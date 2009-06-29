/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License
 * Version 1.1 (the "License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * See the License for the specific language governing rights and
 * limitations under the License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * ***** END LICENSE BLOCK ***** */

dojo.provide("bespin.cmd.commands");

// = Commands =
//
// This array stores all of the default commands.

// ** {{{Command: bespin.cmd.commands.toArgArray}}} **
// Helper for when you have a command that needs to get a hold of it's params
// as an array for processing
bespin.cmd.commands.toArgArray = function(args) {
    if (args == null) {
        return [];
    }
    else {
        var spliten = args.split(" ");
        if (spliten.length == 1 && spliten[0] == "") {
            return [];
        }
        else {
            return spliten;
        }
    }
};

// == Start adding commands to the store ==
//
bespin.cmd.displayHelp = function(store, instruction, extra, morehelpoutput) {
    var commands = [];
    var command, name;

    if (store.commands[extra]) { // caught a real command
        command = store.commands[extra];
        commands.push(command['description'] ? command.description : command.preview);
    } else {
        var showHidden = false;

        var subcmdextra = "";
        if (store.subcommandFor) subcmdextra = " for " + store.subcommandFor;

        if (extra) {
            if (extra == "hidden") { // sneaky, sneaky.
                extra = "";
                showHidden = true;
            }
            commands.push("Commands starting with '" + extra + "'.<br/>");
        }

        var tobesorted = [];
        for (name in store.commands) {
            tobesorted.push(name);
        }

        var sorted = tobesorted.sort();

        commands.push("<table>");
        for (var i = 0; i < sorted.length; i++) {
            name = sorted[i];
            command = store.commands[name];

            if (!showHidden && command.hidden) continue;
            if (extra && name.indexOf(extra) != 0) continue;

            var args = (command.takes) ? ' [' + command.takes.order.join('] [') + ']' : '';

            commands.push("<tr>");
            commands.push('<th>' + name + '</th>');
            commands.push('<td>' + command.preview + "</td>");
            commands.push('<td>' + args + '</td>');
            commands.push("</tr>");
        }
        commands.push("</table>");
    }
    instruction.addOutput(commands.join("") + (morehelpoutput || ""));
};

// ** {{{Command: help}}} **
bespin.command.store.addCommand({
    name: 'help',
    takes: ['search'],
    preview: 'show commands',
    description: 'The <u>help</u> gives you access to the various commands in the Bespin system.<br/><br/>You can narrow the search of a command by adding an optional search params.<br/><br/>If you pass in the magic <em>hidden</em> parameter, you will find subtle hidden commands.<br/><br/>Finally, pass in the full name of a command and you can get the full description, which you just did to see this!',
    completeText: 'optionally, narrow down the search',
    execute: function(instruction, extra) {
        bespin.cmd.displayHelp(instruction.commandLine.store, instruction, extra);
    }
});

// ** {{{Command: eval}}} **
bespin.command.store.addCommand({
    name: 'eval',
    takes: ['js-code'],
    preview: 'evals given js code and show the result',
    completeText: 'evals given js code and show the result',
    execute: function(instruction, jscode) {
        try {
            var result = eval(jscode);
        } catch (err) {
            var result = '<b>Error: ' + err.message + '</b>';
        }

        var msg = '';
        var type = '';

        if (dojo.isFunction(result)) {
            // converts the function to a well formated string
            msg = (result + '').replace(/\n/g, '<br>').replace(/ /g, '&#160');
            type = 'function';
        } else if (dojo.isObject(result)) {
            if (dojo.isArray(result)) {
                type = 'array';
            } else {
                type = 'object';
            }

            var items = [];
            var value;

            for (x in result) {
                if (dojo.isFunction(result[x])) {
                    value = "[function]";
                } else if (dojo.isObject(result[x])) {
                    value = "[object]";
                } else {
                    value = result[x];
                }

                items.push({name: x, value: value});
            }

            items.sort(function(a,b) {
                return (a.name.toLowerCase() < b.name.toLowerCase()) ? -1 : 1;
            });

            for (var x = 0; x < items.length; x++) {
                msg += '<b>' + items[x].name + '</b>: ' + items[x].value + '<br>';
            }

        } else {
            msg = result;
            type = typeof result;
        }

        instruction.addOutput("Result for eval <b>\""+jscode+"\"</b> (type: "+ type+"): <br><br>"+ msg);
    }
});

// ** {{{Command: set}}} **
bespin.command.store.addCommand({
    name: 'set',
    takes: ['key', 'value'],
    preview: 'define and show settings',
    completeText: 'optionally, add a key and/or a value, else you will see all settings',
    // complete: function(instruction, value) {
    //     console.log(instruction);
    //     console.log(value);
    //     return value;
    // },
    execute: function(instruction, setting) {
        var output;

        if (!setting.key) { // -- show all
            var settings = bespin.get("settings").list();
            output = "";
            dojo.forEach(settings.sort(function (a, b) { // first sort the settings based on the key
                if (a.key < b.key) {
                    return -1;
                } else if (a.key == b.key) {
                    return 0;
                } else {
                    return 1;
                }
            }), function(setting) { // now add to output unless hidden settings (start with a _)
                if (setting.key[0] != '_') {
                    output += "<strong>" + setting.key + "</strong> = " + setting.value + "<br/>";
                }
            });
        } else {
            var key = setting.key;
            if (setting.value === undefined) { // show it
                var value = bespin.get("settings").get(key);
                if (value) {
                    output = "<strong>" + key + "</strong> = " + value;
                } else {
                    output = "You do not have a setting for '" + key + "'";
                }
            } else {
                output = "Saving setting: <strong>" + key + "</strong> = " + setting.value;
                bespin.get("settings").set(key, setting.value);
            }
        }
        instruction.addOutput(output);
    },
    sendAllOptions: function(type, callback) {
        var settings = bespin.get("settings").list();
        var names = settings.map(function(setting) {
            return setting.key;
        });
        callback(names);
    }
});

// ** {{{Command: unset}}} **
bespin.command.store.addCommand({
    name: 'unset',
    takes: ['key'],
    preview: 'unset a setting entirely',
    completeText: 'add a key for the setting to delete entirely',
    execute: function(instruction, key) {
        bespin.get("settings").unset(key);
        instruction.addOutput("Unset the setting for " + key + ".");
    }
});

// ** {{{Command: search}}} **
bespin.command.store.addCommand({
    name: 'search',
    takes: ['searchString'],
    preview: 'searches the current file for the given searchString',
    completeText: 'type in a string to search',
    execute: function(instruction, str) {
        bespin.get('actions').startSearch(str, 'commandLine');
    }
});

// ** {{{Command: files (ls, list)}}} **
bespin.command.store.addCommand({
    name: 'files',
    aliases: ['ls', 'list'],
    takes: ['project'],
    preview: 'show files',
    completeText: 'optionally, add the project name of your choice',
    execute: function(instruction, project) {
        if (!project) {
            bespin.withComponent('editSession', function(editSession) {
                project = editSession.project;
            });
        }

        if (!project) {
            instruction.addErrorOutput("You need to pass in a project");
            return;
        }

        bespin.get('files').fileNames(project, function(fileNames) {
            var files = "";
            for (var x = 0; x < fileNames.length; x++) {
                files += fileNames[x].name + "<br/>";
            }
            instruction.addOutput(files);
        });
    }
});

// ** {{{Command: status}}} **
bespin.command.store.addCommand({
    name: 'status',
    preview: 'get info on the current project and file',
    execute: function(instruction) {
        instruction.addOutput(bespin.get('editSession').getStatus());
    }
});

// ** {{{Command: project}}} **
bespin.command.store.addCommand({
    name: 'project',
    takes: ['projectname'],
    preview: 'show the current project, or set to a new one',
    completeText: 'optionally, add the project name to change to that project',
    execute: function(instruction, projectname) {
        if (projectname) {
            bespin.get('editSession').setProject(projectname);
            instruction.addOutput('Changed project to ' + projectname);
        } else {
            instruction.addOutput(bespin.get('editSession').getStatus());
        }
    }
});

// ** {{{Command: projects}}} **
bespin.command.store.addCommand({
    name: 'projects',
    preview: 'show projects',
    execute: function(instruction, extra) {
        bespin.get('files').projects(function(projectNames) {
            var projects = "";
            for (var x = 0; x < projectNames.length; x++) {
                projects += projectNames[x].name + "<br/>";
            }
            instruction.addOutput(projects);
        });
    }
});

// ** {{{Command: createproject}}} **
bespin.command.store.addCommand({
    name: 'createproject',
    takes: ['projectname'],
    preview: 'create a new project',
    usage: '[newprojectname]',
    execute: function(instruction, project) {
        if (!project) {
            instruction.addUsageOutput(this);
            return;
        }

        var onSuccess = instruction.link(function() {
            bespin.get('editSession').setProject(project);
            instruction.addOutput('Successfully created project \'' + project + '\'.');
        });

        var onFailure = instruction.link(function(xhr) {
            instruction.addErrorOutput('Unable to create project \'' + project + '\: ' + xhr.responseText);
        });

        bespin.get('files').makeDirectory(project, '', onSuccess, onFailure);
    }
});

// ** {{{Command: createproject}}} **
bespin.command.store.addCommand({
    name: 'deleteproject',
    takes: ['projectname'],
    preview: 'delete a project',
    usage: '[projectname]',
    execute: function(instruction, project) {
        if (!project) {
            instruction.addUsageOutput(this);
            return;
        }

        if (!project || project == bespin.userSettingsProject) {
            instruction.addErrorOutput('Sorry, you can\'t delete the settings project.');
            return;
        }

        var onSuccess = instruction.link(function() {
            instruction.addOutput('Deleted project ' + project);
            instruction.unlink();
        });

        var onFailure = instruction.link(function(xhr) {
            instruction.addErrorOutput('Failed to delete project ' + project + ': ' + xhr.responseText);
            instruction.unlink();
        });

        bespin.get('files').removeDirectory(project, '', onSuccess, onFailure);
    }
});

// ** {{{Command: renameproject}}} **
bespin.command.store.addCommand({
    name: 'renameproject',
    takes: ['currentProject', 'newProject'],
    preview: 'rename a project',
    usage: '[currentProject], [newProject]',
    execute: function(instruction, args) {
        if (!args.currentProject || !args.newProject) {
            instruction.addUsageOutput(this);
            return;
        }

        var currentProject = args.currentProject;
        var newProject = args.newProject;

        if ((!currentProject || !newProject) || (currentProject == newProject)) {
            return;
        }

        bespin.get('server').renameProject(currentProject, newProject, {
            onSuccess: instruction.link(function() {
                bespin.get('editSession').setProject(newProject);
                instruction.unlink();
            }),
            onFailure: instruction.link(function(xhr) {
                instruction.addErrorOutput('Unable to rename project from ' + currentProject + " to " + newProject + "<br><br><em>Are you sure that the " + currentProject + " project exists?</em>");
                instruction.unlink();
            })
        });
    }
});

// ** {{{Command: mkdir}}} **
bespin.command.store.addCommand({
    name: 'mkdir',
    takes: ['path', 'projectname'],
    preview: 'create a new directory in the given project',
    usage: '[path] [projectname]',
    execute: function(instruction, args) {
        if (!args.path) {
            instruction.addUsageOutput(this);
            return;
        }

        var editSession = bespin.get('editSession');

        var path = args.path;
        var project = args.projectname || editSession.project;

        var onSuccess = instruction.link(function() {
            if (path == '') editSession.setProject(project);
            instruction.addOutput('Successfully created directory \'/' + project + '/' + path + '\'');
            instruction.unlink();
        });

        var onFailure = instruction.link(function(xhr) {
            instruction.addErrorOutput('Unable to create directory \'/' + project + '/' + path + '\': ' + xhr.responseText);
            instruction.unlink();
        });

        bespin.get('files').makeDirectory(project, path, onSuccess, onFailure);
    }
});

// ** {{{Command: save}}} **
bespin.command.store.addCommand({
    name: 'save',
    takes: ['filename'],
    preview: 'save the current contents',
    completeText: 'add the filename to save as, or use the current file',
    withKey: "CMD S",
    execute: function(instruction, filename) {
        bespin.publish("editor:savefile", {
            filename: filename
        });
    }
});

// ** {{{Command: load (open)}}} **
bespin.command.store.addCommand({
    name: 'load',
    aliases: ['open'],
    takes: ['filename', 'project', 'line'],
    preview: 'load up the contents of the file',
    completeText: 'add the filename to open',
    execute: function(instruction, opts) {
        bespin.publish("editor:openfile", opts);
    }
});

// ** {{{Command: editconfig}}} **
bespin.command.store.addCommand({
    name: 'editconfig',
    aliases: ['config'],
    preview: 'load up the config file',
    execute: function(instruction) {
        if (!bespin.userSettingsProject) {
            instruction.addErrorOutput("You don't seem to have a user project. Sorry.");
            return;
        }

        bespin.publish("editor:openfile", {
            project: bespin.userSettingsProject,
            filename: "config"
        });
    }
});

// ** {{{Command: runconfig}}} **
bespin.command.store.addCommand({
    name: 'runconfig',
    preview: 'run your config file',
    execute: function(instruction) {
        bespin.get('files').evalFile(bespin.userSettingsProject, "config");
    }
});

// ** {{{Command: cmdload}}} **
bespin.command.store.addCommand({
    name: 'cmdload',
    takes: ['commandname'],
    preview: 'load up a new command',
    completeText: 'command name to load (required)',
    usage: '[commandname]: Command name required.',
    execute: function(instruction, commandname) {
        if (!commandname) {
            instruction.addUsageOutput(this);
            return;
        }

        if (!commandname) {
            instruction.addErrorOutput("Please pass me a command name to load.");
            return;
        }

        var path = "commands/" + commandname + ".js";
        var project = bespin.userSettingsProject;
        var onSuccess = function(file) {
            try {
                var command = eval(file.content);
                // Note: This used to allow multiple commands to be stored in
                // a single file, however that meant that the file was a (more)
                // butchered version of JSON - the contents of an array.
                bespin.command.store.addCommand(command);
            } catch (e) {
                instruction.addErrorOutput("Something is wrong about the command:<br><br>" + e);
            }
        };

        bespin.get('files').loadContents(project, path, onSuccess, true);
    }
});

// ** {{{Command: cmdedit}}} **
bespin.command.store.addCommand({
    name: 'cmdedit',
    takes: ['commandname'],
    aliases: ['cmdadd'],
    preview: 'edit the given command (force if doesn\'t exist',
    completeText: 'command name to edit (required)',
    usage: '[commandname]: Command name required.',
    execute: function(instruction, commandname) {
        if (!commandname) {
            instruction.addUsageOutput(this);
            return;
        }

        if (!bespin.userSettingsProject) {
            instruction.addErrorOutput("You don't seem to have a user project. Sorry.");
            return;
        }

        if (!commandname) {
            instruction.addErrorOutput("Please pass me a command name to edit.");
            return;
        }

        bespin.publish("editor:forceopenfile", {
            project: bespin.userSettingsProject,
            filename: "commands/" + commandname + ".js",
            content: "{\n    name: '" + commandname + "',\n    takes: [YOUR_ARGUMENTS_HERE],\n    preview: 'execute any editor action',\n    execute: function(self, args) {\n\n    }\n}"
        });
    }
});

// ** {{{Command: cmdlist}}} **
bespin.command.store.addCommand({
    name: 'cmdlist',
    preview: 'list my custom commands',
    execute: function(instruction) {
        if (!bespin.userSettingsProject) {
            instruction.addOutput("You don't seem to have a user project. Sorry.");
            return;
        }

        bespin.get('server').list(bespin.userSettingsProject, 'commands/', function(commands) {
            var output;

            if (!commands || commands.length < 1) {
                output = "You haven't installed any custom commands.<br>Want to <a href='https://wiki.mozilla.org/Labs/Bespin/Roadmap/Commands'>learn how?</a>";
            } else {
                output = "<u>Your Custom Commands</u><br/><br/>";

                var jsCommands = dojo.filter(commands, function(file) {
                    return bespin.util.endsWith(file.name, '\\.js');
                });

                output += dojo.map(jsCommands, function(jsCommand) {
                    return jsCommand.name.replace(/\.js$/, '');
                }).join("<br>");
            }

            instruction.addOutput(output);
        });
    }
});

// ** {{{Command: cmdrm}}} **
bespin.command.store.addCommand({
    name: 'cmdrm',
    takes: ['commandname'],
    preview: 'delete a custom command',
    completeText: 'command name to delete (required)',
    usage: '[commandname]: Command name required.',
    execute: function(instruction, commandname) {
        if (!commandname) {
            instruction.addUsageOutput(this);
            return;
        }

        var editSession = bespin.get('editSession');
        var files = bespin.get('files');

        if (!bespin.userSettingsProject) {
            instruction.addErrorOutput("You don't seem to have a user project. Sorry.");
            return;
        }

        if (!commandname) {
            instruction.addErrorOutput("Please pass me a command name to delete.");
            return;
        }

        var commandpath = "commands/" + commandname + ".js";

        var onSuccess = instruction.link(function() {
            if (editSession.checkSameFile(bespin.userSettingsProject, commandpath)) bespin.get('editor').model.clear(); // only clear if deleting the same file
            instruction.addOutput('Removed command: ' + commandname);
        });

        var onFailure = instruction.link(function(xhr) {
            instruction.addOutput("Wasn't able to remove the command <b>" + commandname + "</b><br/><em>Error</em> (probably doesn't exist): " + xhr.responseText);
        });

        files.removeFile(bespin.userSettingsProject, commandpath, onSuccess, onFailure);
    }
});

// ** {{{Command: newfile}}} **
bespin.command.store.addCommand({
    name: 'newfile',
    //aliases: ['new'],
    takes: ['filename', 'project'],
    preview: 'create a new buffer for file',
    completeText: 'optionally, name the new filename first, and then the name of the project second',
    withKey: "CTRL SHIFT N",
    execute: function(instruction, args) {
        if (args.filename) {
            args.newfilename = args.filename;
            delete args.filename;
        }
        bespin.publish("editor:newfile", args || {});
    }
});

// ** {{{Command: rm (remove, del)}}} **
bespin.command.store.addCommand({
    name: 'rm',
    aliases: ['remove', 'del'],
    takes: ['filename', 'project'],
    preview: 'remove the file',
    completeText: 'add the filename to remove, and optionally a specific project at the end. To delete a directory end the path in a '/'',
    execute: function(instruction, args) {
        var project = args.project || bespin.get('editSession').project;
        var filename = args.filename;

        if (!project) {
            instruction.addErrorOutput("'rm' only works with the project is set.");
            return;
        }

        if (!filename) {
            instruction.addErrorOutput("give me a filename or directory to delete");
            return;
        }

        var onSuccess = instruction.link(function() {
            if (bespin.get('editSession').checkSameFile(project, filename)) {
                bespin.get("editor").model.clear(); // only clear if deleting the same file
            }

            instruction.addOutput('Removed file: ' + filename, true);
            instruction.unlink();
        });

        var onFailure = instruction.link(function(xhr) {
            instruction.addErrorOutput("Wasn't able to remove the file <b>" + filename + "</b><br/><em>Error</em> (probably doesn't exist): " + xhr.responseText);
            instruction.unlink();
        });

        bespin.get('files').removeFile(project, filename, onSuccess, onFailure);
    }
});

// ** {{{Command: closefile}}} **
bespin.command.store.addCommand({
    name: 'closefile',
    takes: ['filename', 'project'],
    preview: 'close the file (may lose edits)',
    completeText: 'add the filename to close (defaults to this file).<br>also, optional project name.',
    execute: function(instruction, args) {
        var editSession = bespin.get('editSession');
        var filename = args.filename || editSession.path;  // default to current page
        var project  = args.project  || editSession.project;

        bespin.get('files').closeFile(project, filename, function() {
            bespin.publish("editor:closedfile", { filename: filename });

            // if the current file, move on to a new one
            if (filename == editSession.path) bespin.publish("editor:newfile");

            bespin.get("commandLine").addOutput('Closed file: ' + filename);
        });
    }
});

// ** {{{Command: version}}} **
bespin.command.store.addCommand({
    name: 'version',
    takes: ['command'],
    preview: 'show the version for Bespin or a command',
    completeText: 'optionally, a command name',
    execute: function(instruction, command) {
        var bespinVersion = 'Your Bespin is at version ' + bespin.versionNumber + ', Code name: "' + bespin.versionCodename + '"';
        var version;
        if (command) {
            var theCommand = instruction.commandLine.store.commands[command];
            if (!theCommand) {
                version = "It appears that there is no command named '" + command + "', but " + bespinVersion;
            } else {
                version = (theCommand.version)
                    ? "The command named '" + command + "' is at version " + theCommand.version
                    : "The command named '" + command + "' is a core command in Bespin version " + bespin.versionNumber;
            }
        }
        else {
            version = bespinVersion;
        }
        instruction.addOutput(version);
    }
});

// ** {{{Command: clear}}} **
bespin.command.store.addCommand({
    name: 'clear',
    aliases: ['cls'],
    preview: 'clear the file',
    execute: function(instruction) {
        bespin.get("editor").model.clear();
    }
});

// ** {{{Command: goto}}} **
(function () {
    var previewFull      = 'move it! make the editor head to a line number or a function name.';
    var preview          = 'move it! make the editor head to a line number.';
    var completeTextFull = 'add the line number to move to, or the name of a function in the file';
    var completeText     = 'add the line number to move to in the file';
    var gotoCmd = {
        name: 'goto',
        takes: ['value'],
        preview: previewFull,
        completeText: completeTextFull,
        execute: function(instruction, value) {
            var settings = bespin.get("settings");
            if (value) {
                var linenum = parseInt(value, 10); // parse the line number as a decimal

                if (isNaN(linenum)) { // it's not a number, so for now it is a function name
                    if(settings.isOn(settings.get("syntaxcheck"))) {
                        bespin.publish("parser:gotofunction", {
                            functionName: value
                        });
                    } else {
                        instruction.addErrorOutput("Please enter a valid line number.");
                    }
                } else {
                    bespin.publish("editor:moveandcenter", {
                        row: linenum
                    });
                }
            }
        }
    };
    bespin.command.store.addCommand(gotoCmd);
    bespin.subscribe("settings:set:syntaxcheck", function () {
        var settings = bespin.get("settings");
        if(settings.isOn(settings.get("syntaxcheck"))) {
            gotoCmd.preview = previewFull;
            gotoCmd.completeText = completeTextFull;
        } else {
            gotoCmd.preview = preview;
            gotoCmd.completeText = completeText;
        }
    });
})();

// ** {{{Command: replace}}} **
bespin.command.store.addCommand({
    name: 'replace',
    takes: ['search', 'replace'],
    preview: 's/foo/bar/g',
    completeText: 'add the search regex, and then the replacement text',
    execute: function(instruction, args) {
        bespin.get("editor").ui.actions.replace(args);
    }
});

// ** {{{Command: login}}} **
bespin.command.store.addCommand({
    name: 'login',
    // aliases: ['user'],
    //            takes: ['username', 'password'],
    hidden: true,
    takes: {
        order: ['username', 'password'],
        username: {
            "short": 'u'
        },
        password: {
            "short": 'p',
            optional: true
        }
    },
    preview: 'login to the service',
    completeText: 'pass in your username and password',
    execute: function(instruction, args) {
        if (!args) { // short circuit if no username
            instruction.commandLine.executeCommand("status");
            return;
        }
        bespin.get('editSession').username = args.user; // TODO: normalize syncing
        bespin.get('server').login(args.user, args.pass);
    }
});

// ** {{{Command: logout}}} **
bespin.command.store.addCommand({
    name: 'logout',
    preview: 'log out',
    execute: function(instruction) {
        delete bespin.get('editSession').username;
        bespin.get('server').logout(function() {
            window.location.href="/";
        });
    }
});

// ** {{{Command: bespin}}} **
bespin.command.store.addCommand({
    name: 'bespin',
    preview: 'has',
    hidden: true,
    messages: [
        "really wants you to trick it out in some way.",
        "is your Web editor.",
        "would love to be like Emacs on the Web.",
        "is written on the Web platform, so you can tweak it."
    ],
    execute: function(instruction) {
        instruction.addOutput("Bespin " + this.messages[Math.floor(Math.random() * this.messages.length)]);
    }
});

// ** {{{Command: sort}}} **
bespin.command.store.addCommand({
    name: 'sort',
    takes: ['direction'],
    preview: 'sort the current buffer',
    completeText: 'optionally, sort descending',
    execute: function(instruction, direction) {
        var buffer = bespin.get("editor").model.getDocument().split(/\n/);
        buffer.sort();
        if (direction && /^desc/.test(direction.toLowerCase())) {
            buffer.reverse();
        }
        bespin.get("editor").model.insertDocument(buffer.join("\n"));
    }
});

// ** {{{Command: quota}}} **
bespin.command.store.addCommand({
    name: 'quota',
    preview: 'show your quota info',
    megabytes: function(bytes) {
        return (bytes / 1024 / 1024).toFixed(2);
    },
    execute: function(instruction) {
        var es = bespin.get('editSession');
        var output = "You have " + this.megabytes(es.quota - es.amountUsed) +
                     " MB free space to put some great code!<br>" +
                     "Used " + this.megabytes(es.amountUsed) + " MB " +
                     "out of your " + this.megabytes(es.quota) + " MB quota.";
        instruction.addOutput(output);
    }
});

// ** {{{Command: export}}} **
bespin.command.store.addCommand({
    name: 'export',
    takes: ['project', 'archivetype'],
    preview: 'export the given project with an archivetype of zip or tgz',
    completeText: 'project name, archivetype (zip | tgz, defaults to zip)',
    execute: function(instruction, args) {
        var project = args.project || bespin.get('editSession').project;

        var type = args.archivetype;
        if (!bespin.util.include(['zip','tgz','tar.gz'], type)) {
            type = 'zip';
        }

        bespin.get('server').exportProject(project, type); // try to do it via the iframe
    }
});

// ** {{{Command: import}}} **
bespin.command.store.addCommand({
    name: 'import',
    takes: ['url', 'project'],
    preview: 'import the given url as a project.<br>If a project name isn\'t given it will use the filename<br>If no URL is given to import, a file upload box will be shown to import.',
    completeText: 'url (to an archive zip | tgz) and/or project name',
    usage: "[url of archive] [projectname]<br><br><em>If only a URL is given, the projectname will be implied<br><br>If only a project name is given, a file upload window will be shown to upload.</em>",
    // ** {{{calculateProjectName}}}
    //
    // Given a URL, work out the project name as a default
    // For example, given http://foo.com/path/to/myproject.zip
    // return "myproject"
    calculateProjectName: function(url) {
        var split = url.split('/');
        var projectMaker = split[split.length - 1].split(".");
        projectMaker.pop();
        return projectMaker.join("_");
    },
    // ** {{{isURL}}}
    //
    // Test the given string to return if it is a URL.
    // In this context it has to be http(s) only
    isURL: function(url) {
        return (url && (/^http(:|s:)/.test(url)));
    },
    upload: function(project) {
        // use the center popup and inject a form in that points to the right place.
        var el = dojo.byId('centerpopup');


        el.innerHTML = "<div id='upload-container'><form method='POST' name='upload' id='upload' enctype='multipart/form-data'><div id='upload-header'>Import project via upload <img id='upload-close' src='images/icn_close_x.png' align='right'></div><div id='upload-content'><div id='upload-status'></div><p>Browse to find the project archive that you wish to archive<br>and then click on the <code>Upload</code> button.</p><center><input type='file' id='filedata' name='filedata' accept='application/zip,application/x-gzip'> <input type='submit' value='Upload'></center></div></form></div>";

        dojo.require("dijit._base.place");
        dojo.require("bespin.util.webpieces");

        dojo.require("dojo.io.iframe");

        dojo.connect(dojo.byId('upload'), "submit", function() {
            dojo.byId('upload-status').innerHTML = 'Importing file into new project ' + project;
            dojo.io.iframe.send({
                url: '/project/import/' + project,
                form: dojo.byId('upload'),
                method: 'POST',
                handleAs: 'text',
                preventCache: true,
                contentType: "multipart/form-data",
                load: function(data, ioArg) {
                    dojo.byId('upload-status').innerHTML = 'Thanks for uploading the file!';
                },
                error: function(error, ioArg) {
                    setTimeout(function() {
                        bespin.get('files').projects(function(projectNames) {
                            if (dojo.some(projectNames, function(testProject) { return project + '/' == testProject.name; })) {
                                dojo.byId('upload-status').innerHTML = 'Archive imported and project ' + project + ' has been created!';
                            } else {
                                dojo.byId('upload-status').innerHTML = 'Error uploading the file. Sorry, try again!';
                            }
                        });
                    }, 100);
                }
            });
        });

        bespin.util.webpieces.showCenterPopup(el, true);

        // TODO: refactor this block into webpieces if popup is modal
        // pass the uploadClose DOM element as parameter to showCenterPopup
        var uploadClose, overlay;
        var hideCenterPopup = function(){
            el.removeChild(el.firstChild);
            bespin.util.webpieces.hideCenterPopup(el);
            dojo.disconnect(uploadClose);
            dojo.disconnect(overlay);
        };
        uploadClose = dojo.connect(dojo.byId("upload-close"), "onclick", hideCenterPopup);
        overlay = dojo.connect(dojo.byId("overlay"), "onclick", hideCenterPopup);
    },

    // ** {{{execute}}}
    //
    // Can be called in three ways:
    //
    // * import http://foo.com/path/to/archive.zip
    // * import http://foo.com/path/to/archive.zip projectName
    // * import projectName http://foo.com/path/to/archive.zip
    execute: function(instruction, args) {
        var project, url;

        // Fail fast. Nothing given?
        if (!args.url) {
            instruction.addUsageOutput(this);
            return;
        // * checking - import http://foo.com/path/to/archive.zip
        } else if (!args.project && this.isURL(args.url)) {
            args.project = this.calculateProjectName(args.url);
        // * Oops, project and url are the wrong way around. That's fine
        } else if (this.isURL(args.project)) {
            project = args.project;
            url = args.url;
            args.project = url;
            args.url = project;
        // * Make sure that a URL came along at some point, else call up an upload box
        } else if (!this.isURL(args.url)) {
            var project = args.url; // only a project has been passed in
            this.upload(project);
        } else {
        // * A project and URL are here and available to do a URL based import
            project = args.project;
            url = args.url;

            instruction.addOutput("About to import " + project + " from:<br><br>" + url + "<br><br><em>It can take awhile to download the project, so be patient!</em>");

            bespin.get('server').importProject(project, url, {
                onSuccess: function() {
                    instruction.addOutput("Project " + project + " imported from:<br><br>" + url);
                },
                onFailure: function(xhr) {
                    instruction.addErrorOutput("Unable to import " + project + " from:<br><br>" + url + ".<br><br>Maybe due to: " + xhr.responseText);
                }
            });
        }
    }
});

// ** {{{Command: trim}}} **
bespin.command.store.addCommand({
    name: 'trim',
    takes: ['side'], // left, right, both
    preview: 'trim trailing or leading whitespace',
    completeText: 'optionally, give a side of left, right, or both (defaults to right)',
    execute: function(instruction, side) {
        if (!side) side = "right";
        var replaceArgs = {
            replace: ''
        };

        if (bespin.util.include(["left", "both"], side)) {
            replaceArgs.search = "^\\s+";
            bespin.get("editor").ui.actions.replace(replaceArgs);
        }

        if (bespin.util.include(["right", "both"], side)) {
            replaceArgs.search = "\\s+$";
            bespin.get("editor").ui.actions.replace(replaceArgs);
        }
    }
});

// ** {{{Command: bindkey}}} **
bespin.command.store.addCommand({
    name: 'bindkey',
    takes: ['modifiers', 'key', 'action'],
    preview: 'Bind a key to an action, or show bindings',
    completeText: 'With no arguments show bindings, else give modifier(s), key, and action name to set',
    execute: function(instruction, args) {
        if (args.key && args.action) { // bind a new key binding
            if (args.modifiers == "none") args.modifiers = '';

            bespin.publish("editor:bindkey", args);
        } else { // show me the key bindings
            var descriptions = bespin.get('editor').editorKeyListener.keyMapDescriptions;
            var output = "<table>";

            for (var keys in descriptions) {
                var keyData = keys.split(','); // metaKey, ctrlKey, altKey, shiftKey
                var keyCode = parseInt(keyData[0]);

                var modifiers = [];
                if (keyData[1] === "true") modifiers.push("CMD");
                if (keyData[2] === "true") modifiers.push("CTRL");
                if (keyData[3] === "true") modifiers.push("ALT");
                if (keyData[4] === "true") modifiers.push("SHIFT");

                var modifierInfo = modifiers.length > 0 ? modifiers.join(', ') + " " : "";
                var keyInfo = modifierInfo + bespin.util.keys.KeyCodeToName[keyCode] || keyCode;
                output += "<tr><td style='text-align:right;'>" + keyInfo + "</td><td>&#x2192;</td><td>" + descriptions[keys] + "</td></tr>";
            }
            output += "</table>";
            instruction.addOutput(output);
        }
    }
});

// ** {{{Command: alias}}} **
bespin.command.store.addCommand({
    name: 'alias',
    takes: ['alias', 'command'],
    preview: 'define and show aliases for commands',
    completeText: 'optionally, add your alias name, and then the command name',
    execute: function(instruction, args) {
        var aliases = instruction.commandLine.store.aliases;

        if (!args.alias) {
            // * show all
            var output = "<table>";
            for (var x in aliases) {
                output += "<tr><td style='text-align:right;'>" + x + "</td><td>&#x2192;</td><td>" + aliases[x] + "</td></tr>";
            }
            output += "</table>";
            instruction.addOutput(output);
        } else {
            // * show just one
            if (args.command === undefined) {
              var alias = aliases[args.alias];
              if (alias) {
                  instruction.addOutput(args.alias + " &#x2192; " + aliases[args.alias]);
              } else {
                  instruction.addErrorOutput("No alias set for '" + args.alias + "'");
              }
            } else {
                // * save a new alias
                var key = args.alias;
                var value = args.command;
                var aliascmd = value.split(' ')[0];

                if (instruction.commandLine.store.commands[key]) {
                    instruction.addErrorOutput("Sorry, there is already a command with the name: " + key);
                } else if (instruction.commandLine.store.commands[aliascmd]) {
                    aliases[key] = value;
                    instruction.addOutput("Saving alias: " + key + " &#x2192; " + value);
                } else if (aliases[aliascmd]) {
                    // TODO: have the symlink to the alias not the end point
                    aliases[key] = value;
                    instruction.addOutput("Saving alias: " + key + " &#x2192; " + aliases[value] + " (" + value + " was an alias itself)");
                } else {
                    instruction.addErrorOutput("Sorry, no command or alias with that name.");
                }
            }
        }
    }
});

// ** {{{Command: history}}} **
bespin.command.store.addCommand({
    name: 'history',
    preview: 'Show history of the commands',
    execute: function(instruction) {
        var instructions = instruction.commandLine.history.getInstructions();
        var output = [];
        output.push("<table>");
        var count = 1;
        dojo.forEach(instructions, function(instruction) {
            output.push("<tr>");
            output.push('<th>' + count + '</th>');
            output.push('<td>' + instruction.typed + "</td>");
            output.push("</tr>");
            count++;
        });
        output.push("</table>");

        instruction.addOutput(output.join(''));
    }
});

bespin.command.store.addCommand({
    name: 'uc',
    preview: 'Change all selected text to uppercase',
    withKey: "CMD SHIFT U",
    execute: function(instruction) {
        var args = { stringCase: 'u' };
        bespin.get("editor").ui.actions.selectionChangeCase(args);
    }
});

bespin.command.store.addCommand({
    name: 'lc',
    preview: 'Change all selected text to lowercase',
    withKey: "CMD SHIFT L",
    execute: function(instruction) {
        var args = { stringCase: 'l' };
        bespin.get("editor").ui.actions.selectionChangeCase(args);
    }
});

// ** {{{Command: outline}}} **
bespin.command.store.addCommand({
    name: 'outline',
    preview: 'show outline of source code',
    withKey: "ALT SHIFT O",
    execute: function(instruction) {
        bespin.publish("parser:showoutline");
    }
});

//** {{{Command: rescan}}} **
bespin.command.store.addCommand({
    name: 'rescan',
    takes: ['project'],
    preview: 'update the project catalog of files used by quick open',
    execute: function(instruction, project) {
        if (!project) {
            bespin.withComponent('editSession', function(editSession) {
                project = editSession.project;
            });
        }
        bespin.get("server").rescan(project, instruction, {
            onSuccess: instruction.link(function(response) {
                instruction.addOutput(response);
                instruction.unlink();
            }),
            onFailure: instruction.link(function(xhr) {
                instruction.addErrorOutput(xhr.response);
                instruction.unlink();
            })
        });
    }
});

