var BespinBorder = Class.define({
    type: "BespinBorder",

    superclass: Border,

    members: {
        init: function(parms) {
            this._super(parms);
        },

        getInsets: function() {
            return { left: 1, right: 1, bottom: 1, top: 1 };
        },

        paint: function(ctx) {
            var d = this.component.d();

            ctx.fillStyle = "rgb(93, 91, 84)";
            ctx.fillRect(0, 0, d.b.w, 1);

            ctx.fillStyle = "rgb(51, 49, 44)";
            ctx.fillRect(0, d.b.h - 1, d.b.w, 1);

            ctx.fillStyle = "rgb(94, 91, 84)";
            ctx.fillRect(0, 0, 1, d.b.h);

            ctx.fillStyle = "rgb(54, 52, 46)";
            ctx.fillRect(d.b.w - 1, 0, 1, d.b.h);
        }
    }
});

var BespinSessionPanel = Class.define({
    type: "BespinSessionPanel",

    superclass: Panel,

    members: {
        init: function(parms) {
            this._super(parms);

            this.filename = new Label({ style: { color: "white" } });
            this.path = new Label({ style: { color: "rgb(210, 210, 210)" } });
            this.opened = new Label({ style: { color: "rgb(160, 157, 147)" } });
            this.details = new Label({ style: { color: "rgb(160, 157, 147)" } });
            this.editTime = new Label({ style: { color: "rgb(160, 157, 147)" } });

            this.add([ this.filename, this.path, this.opened, this.details, this.editTime ]);

            this.style.border = new BespinBorder();
            this.style.backgroundColor = "rgb(67, 65, 58)";

            this.preferredSizes = [ 13, 9, 8, 8, 8 ];
            this.minimumSizes = [ 9, 8, 7, 7, 7 ];

            // dummy data
            this.filename.attributes.text = "bespin_stuff.js";
            this.path.attributes.text = "Project: some/path/to/file";
            this.opened.attributes.text = "Opened two days ago; last edited 10 minutes ago";
            this.details.attributes.text = "45 changes, including 20 new lines, 10 deleted lines, and 122 keystrokes";
            this.editTime.attributes.text = "22 minutes estimated editing time";
        },

        layout: function() {
            var d = this.d();
            var w = d.b.w - d.i.w;
            var labels = 5;
            var sizes = this.preferredSizes.slice();

            while (labels > 0) {
                var y = d.i.t;

                // set the fonts and clear the bounds
                for (var i = 0; i < this.children.length; i++) {
                    var font = sizes[i] + "pt Tahoma";
                    this.children[i].style.font = font;

                    delete this.children[i].bounds;
                }

                var current = 0;

                var h = this.filename.getPreferredHeight(w);
                h = Math.floor(h * 0.95); // pull in the line height a bit
                this.filename.bounds = { x: d.i.l, y: y, width: w, height: h };
                y += h;

                if (++current < labels) {
                    h = this.path.getPreferredHeight(w);
                    h = Math.floor(h * 1.2); // add a bit of margin to separate from subsequent labels
                    this.path.bounds = { x: d.i.l, y: y, width: w, height: h };
                    y += h;
                }

                if (++current < labels) {
                    h = this.opened.getPreferredHeight(w);
                    this.opened.bounds = { x: d.i.l, y: y, width: w, height: h };
                    y += h;
                }

                if (++current < labels) {
                    h = this.details.getPreferredHeight(w);
                    this.details.bounds = { x: d.i.l, y: y, width: w, height: h };
                    y += h;
                }

                if (++current < labels) {
                    h = this.editTime.getPreferredHeight(w);
                    this.editTime.bounds = { x: d.i.l, y: y, width: w, height: h };
                    y += h;
                }

                y += d.i.b;
                if (y <= d.b.h) break;

                // we're too tall, make adjustments

                var changeMade = false;
                for (var z = 2; z < sizes.length; z++) {
                    if (sizes[z] > this.minimumSizes[z]) {
                        sizes[z]--;
                        changeMade = true;
                    }
                }
                if (changeMade) continue;

                if (labels > 2) {
                    labels--;
                    continue;
                }

                var changeMade = false;
                for (var y = 0; y < 2; y++) {
                    if (sizes[y] > this.minimumSizes[y]) {
                        sizes[y]--;
                        changeMade = true;
                    }
                }
                if (changeMade) continue;

                labels--;
            }
        },

        getInsets: function() {
            return { top: 5, left: 5, bottom: 5, right: 5 };
        }
    }
});

var BespinProjectPanel = Class.define({
    type: "BespinProjectPanel",

    superclass: Panel,

    members: {
        init: function(parms) {
            if (!parms) parms = {};
            this._super(parms);

            this.projectLabel = new Label({ text: "Projects", style: { color: "white", font: "9pt Tahoma" } });
            this.projectLabel.oldPaint = this.projectLabel.paint;
            this.projectLabel.paint = function(ctx) {
                var d = this.d();

                ctx.fillStyle = "rgb(51, 50, 46)";
                ctx.fillRect(0, 0, d.b.w, 1);

                ctx.fillStyle = "black";
                ctx.fillRect(0, d.b.h - 1, d.b.w, 1);

                var gradient = ctx.createLinearGradient(0, 1, 0, d.b.h - 2);
                gradient.addColorStop(0, "rgb(39, 38, 33)");
                gradient.addColorStop(1, "rgb(22, 22, 19)");
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 1, d.b.w, d.b.h - 2);

                this.oldPaint(ctx);
            }

            this.list = new List({ style: { backgroundColor: "rgb(61, 59, 52)", color: "white", font: "9pt Tahoma" } });

            this.splitter = new Splitter({ orientation: GTK.HORIZONTAL });

            this.add([ this.projectLabel, this.list, this.splitter ]);

            this.bus.bind("dragstart", this.splitter, this.ondragstart, this);
            this.bus.bind("drag", this.splitter, this.ondrag, this);
            this.bus.bind("dragstop", this.splitter, this.ondragstop, this);


            // this is a closed container
            delete this.add;
            delete this.remove;
        },

        ondragstart: function(e) {
            this.startWidth = this.bounds.width;
        },

        ondrag: function(e) {
            var delta = e.currentPos.x - e.startPos.x;
            this.prefWidth = this.startWidth + delta;
            this.getScene().render();
        },

        ondragstop: function(e) {
            delete this.startWidth;
        },

        getPreferredWidth: function(height) {
            return this.prefWidth || 150;
        },

        layout: function() {
            var d = this.d();

            var y = d.i.t;
            var lh = this.projectLabel.getPreferredHeight(d.b.w);
            this.projectLabel.bounds = { y: y, x: d.i.l, height: lh, width: d.b.w };
            y += lh;

            var sw = this.splitter.getPreferredWidth()
            this.splitter.bounds = { x: d.b.w - d.i.r - sw, height: d.b.h - d.i.b - y, y: y, width: sw };

            this.list.bounds = { x: d.i.l, y: y, width: d.b.w - d.i.w - sw, height: this.splitter.bounds.height };
        }
    }
});