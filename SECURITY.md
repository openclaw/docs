# Security Policy

## Reporting

Report suspected vulnerabilities privately through GitHub Security Advisories for
this repository. If GHSA is unavailable to you, email security@openclaw.ai.

Do not open public issues for vulnerabilities or include secrets, private sync
metadata, deployment credentials, translation artifacts with private content, or
exploit details in public reports.

## Scope

In scope:

- docs publishing, translation, R2, Pages, and smoke workflows
- generated docs-site scripts and publish artifacts
- accidental disclosure of private sync metadata or credentials
- workflow behavior that could publish the wrong generated docs output

Out of scope:

- source documentation bugs that must be fixed in `openclaw/openclaw`
- generated locale/content drift without a security boundary impact
- compromise of a trusted maintainer account, local shell, filesystem, or device
- scanner-only findings without a reachable exploit path in supported usage

## Expectations

We prioritize reachable issues that affect docs publishing integrity, private
metadata, credentials, or safe workflow execution. Include the affected commit,
workflow or script, minimal reproduction steps, and sanitized impact details.
