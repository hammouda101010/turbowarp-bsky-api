"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var oauth_client_browser_1 = require("@atproto/oauth-client-browser");
var client = new oauth_client_browser_1.BrowserOAuthClient({
    clientMetadata: {
        "client_id": "https://hammouda101010.github.io/turbowarp-bsky-api/static/client-metadata.json",
        "client_name": "TurboWarp/Penguinmod",
        "client_uri": "https://hammouda101010.github.io/turbowarp-bsky-api",
        "logo_uri": "https://hammouda101010.github.io/turbowarp-bsky-api/static/icons/favicon.ico",
        "tos_uri": "https://scratch.mit.edu/terms_of_use",
        "policy_uri": "https://turbowarp.org/privacy.html",
        "redirect_uris": ["https://hammouda101010.github.io/turbowarp-bsky-api/redirect.html"],
        "scope": "atproto transition:generic",
        "grant_types": ["authorization_code", "refresh_token"],
        "response_types": ["code"],
        "token_endpoint_auth_method": "none",
        "application_type": "web",
        "dpop_bound_access_tokens": true
    },
    handleResolver: "https://bsky.social/",
    responseMode: "query"
});
var params = new URLSearchParams(window.location.search);
client.callback(params);
