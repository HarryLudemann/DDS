# SPA hosting

This app uses **React Router** (`BrowserRouter`). Direct requests to `/book`, `/admin`, etc. must serve `index.html` so the client can route.

**Current host is Firebase Hosting.** Rewrites live in `firebase.json`:

```json
"rewrites": [{ "source": "**", "destination": "/index.html" }]
```

`public/_redirects` is a leftover Netlify file. Firebase ignores it. Prefer changing `firebase.json` if hosting behaviour needs to change.

Setup, env, admin, and deploy are in [README.md](README.md).

---

## If you leave Firebase Hosting

### Nginx

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### Apache (`public/.htaccess` if the host serves that folder)

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Netlify

```
/*    /index.html   200
```

Do not use HashRouter (`/#/book`) unless you have no control over the server.
