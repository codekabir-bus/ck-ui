# Security Policy

## Reporting a vulnerability

Please **don't open a public issue** for a security problem. Report it privately through GitHub: go to this
repository's **Security** tab and choose **Report a vulnerability**. Include what's affected, how to reproduce it,
and the impact you expect.

We'll acknowledge the report, keep you updated while we investigate, and credit you when a fix is published (unless
you'd rather stay anonymous).

## Scope

- The components, styles, examples and scripts in this repository.
- The CK-UI CLI ([`ck-ui-cli`](https://www.npmjs.com/package/ck-ui-cli) on npm).
- The public component registry at `https://www.ck-ui.com/r`.

## Supported versions

Fixes are made to the current version of the components (as served by the registry and mirrored here) and to the
latest release of `ck-ui-cli`. To get a fix, update with `npx ck-ui-cli@latest add <component…>` (see the
[changelog](CHANGELOG.md)).
