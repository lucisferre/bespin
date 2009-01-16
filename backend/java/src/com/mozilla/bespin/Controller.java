/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1
 * 
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 * 
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 * 
 * The Original Code is Bespin.
 * 
 * The Initial Developer of the Original Code is Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 * 
 * Contributor(s):
 *     Bespin Team (bespin@mozilla.com)
 *
 * 
 * ***** END LICENSE BLOCK ***** */

package com.mozilla.bespin;

import java.io.IOException;
import java.io.Reader;

public class Controller {
    private RequestContext ctx;

    public RequestContext getCtx() {
        return ctx;
    }

    public void setCtx(RequestContext ctx) {
        this.ctx = ctx;
    }

    /**
     * Convenience method that catches the exception and prints it out
     *
     * @param message
     */
    protected void print(String message) {
        try {
            getCtx().getResp().setHeader("Content-Type", "text/plain");
            getCtx().getResp().getWriter().print(message);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    /**
     * Convenience method for returning the body stream as a single string.
     *
     * @return
     * @throws IOException
     */
    protected String getBody() throws IOException {
        Reader reader = getCtx().getReq().getReader();
        StringBuffer sb = new StringBuffer();
        int i = 0;
        while ((i = reader.read()) != -1) sb.append((char) i);
        return sb.toString();
    }

    protected boolean isAuthenticated() {
        throw new UnsupportedOperationException("You must implement the isAuthenticated() method in your Controller subclass");
    }
}
