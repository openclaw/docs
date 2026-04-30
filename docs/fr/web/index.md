---
read_when:
    - Vous souhaitez accéder au Gateway via Tailscale
    - Vous voulez l’interface utilisateur de contrôle du navigateur et la modification de la configuration
summary: 'Surfaces web du Gateway : interface utilisateur de contrôle, modes de liaison et sécurité'
title: Web
x-i18n:
    generated_at: "2026-04-30T07:55:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1e357d1e9f4ad0286b9412cd0a684b6428180e0586eef76577ecb2909212fb2
    source_path: web/index.md
    workflow: 16
---

Le Gateway sert une petite **interface de contrôle dans le navigateur** (Vite + Lit) depuis le même port que le WebSocket du Gateway :

- par défaut : `http://<host>:18789/`
- avec `gateway.tls.enabled: true` : `https://<host>:18789/`
- préfixe facultatif : définissez `gateway.controlUi.basePath` (p. ex. `/openclaw`)

Les fonctionnalités se trouvent dans [l’interface de contrôle](/fr/web/control-ui). Le reste de cette page se concentre sur les modes de liaison, la sécurité et les surfaces exposées au Web.

## Webhooks

Lorsque `hooks.enabled=true`, le Gateway expose aussi un petit point de terminaison Webhook sur le même serveur HTTP.
Consultez [Configuration du Gateway](/fr/gateway/configuration) → `hooks` pour l’authentification et les charges utiles.

## Configuration (activée par défaut)

L’interface de contrôle est **activée par défaut** lorsque les ressources sont présentes (`dist/control-ui`).
Vous pouvez la contrôler via la configuration :

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Accès Tailscale

### Serve intégré (recommandé)

Gardez le Gateway sur loopback et laissez Tailscale Serve le proxyfier :

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Puis démarrez le gateway :

```bash
openclaw gateway
```

Ouvrez :

- `https://<magicdns>/` (ou votre `gateway.controlUi.basePath` configuré)

### Liaison au tailnet + jeton

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Puis démarrez le gateway (cet exemple non-loopback utilise une authentification
par jeton secret partagé) :

```bash
openclaw gateway
```

Ouvrez :

- `http://<tailscale-ip>:18789/` (ou votre `gateway.controlUi.basePath` configuré)

### Internet public (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // or OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Notes de sécurité

- L’authentification du Gateway est requise par défaut (jeton, mot de passe, trusted-proxy ou en-têtes d’identité Tailscale Serve lorsqu’ils sont activés).
- Les liaisons non-loopback **requièrent** toujours l’authentification du gateway. En pratique, cela signifie une authentification par jeton/mot de passe ou un proxy inverse sensible à l’identité avec `gateway.auth.mode: "trusted-proxy"`.
- L’assistant crée une authentification par secret partagé par défaut et génère généralement un
  jeton de gateway (même sur loopback).
- En mode secret partagé, l’interface envoie `connect.params.auth.token` ou
  `connect.params.auth.password`.
- Lorsque `gateway.tls.enabled: true`, les assistants locaux de tableau de bord et de statut affichent
  des URL de tableau de bord en `https://` et des URL WebSocket en `wss://`.
- Dans les modes portant une identité, comme Tailscale Serve ou `trusted-proxy`, la
  vérification d’authentification WebSocket est satisfaite à partir des en-têtes de requête à la place.
- Pour les déploiements non-loopback de l’interface de contrôle, définissez `gateway.controlUi.allowedOrigins`
  explicitement (origines complètes). Sans cela, le démarrage du gateway est refusé par défaut.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` active
  le mode de repli de l’origine sur l’en-tête Host, mais constitue une dégradation de sécurité dangereuse.
- Avec Serve, les en-têtes d’identité Tailscale peuvent satisfaire l’authentification de l’interface de contrôle/WebSocket
  lorsque `gateway.auth.allowTailscale` vaut `true` (aucun jeton/mot de passe requis).
  Les points de terminaison de l’API HTTP n’utilisent pas ces en-têtes d’identité Tailscale ; ils suivent
  plutôt le mode d’authentification HTTP normal du gateway. Définissez
  `gateway.auth.allowTailscale: false` pour exiger des identifiants explicites. Consultez
  [Tailscale](/fr/gateway/tailscale) et [Sécurité](/fr/gateway/security). Ce
  flux sans jeton suppose que l’hôte du gateway est fiable.
- `gateway.tailscale.mode: "funnel"` requiert `gateway.auth.mode: "password"` (mot de passe partagé).

## Construire l’interface

Le Gateway sert les fichiers statiques depuis `dist/control-ui`. Construisez-les avec :

```bash
pnpm ui:build
```
