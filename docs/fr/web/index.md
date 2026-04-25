---
read_when:
    - Vous souhaitez accéder à la Gateway via Tailscale
    - Vous souhaitez l’interface navigateur Control UI et l’édition de configuration
summary: 'Surfaces web de la Gateway : Control UI, modes de liaison et sécurité'
title: Web
x-i18n:
    generated_at: "2026-04-25T14:00:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 424704a35ce3a0f5960486372514751cc93ae90e4b75d0ed114e045664256d2d
    source_path: web/index.md
    workflow: 15
---

La Gateway sert une petite **Control UI** navigateur (Vite + Lit) depuis le même port que le WebSocket Gateway :

- par défaut : `http://<host>:18789/`
- avec `gateway.tls.enabled: true` : `https://<host>:18789/`
- préfixe facultatif : définissez `gateway.controlUi.basePath` (par ex. `/openclaw`)

Les fonctionnalités se trouvent dans [Control UI](/fr/web/control-ui).
Cette page se concentre sur les modes de liaison, la sécurité et les surfaces exposées au web.

## Webhooks

Lorsque `hooks.enabled=true`, la Gateway expose également un petit point de terminaison Webhook sur le même serveur HTTP.
Consultez [Configuration de la Gateway](/fr/gateway/configuration) → `hooks` pour l’authentification + les charges utiles.

## Config (activée par défaut)

La Control UI est **activée par défaut** lorsque les assets sont présents (`dist/control-ui`).
Vous pouvez la contrôler via la config :

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Accès Tailscale

### Serve intégré (recommandé)

Conservez la Gateway sur loopback et laissez Tailscale Serve la proxyfier :

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Démarrez ensuite la gateway :

```bash
openclaw gateway
```

Ouvrez :

- `https://<magicdns>/` (ou votre `gateway.controlUi.basePath` configuré)

### Liaison tailnet + jeton

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Démarrez ensuite la gateway (cet exemple non loopback utilise l’authentification
par jeton à secret partagé) :

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

- L’authentification Gateway est requise par défaut (jeton, mot de passe, trusted-proxy, ou en-têtes d’identité Tailscale Serve lorsqu’ils sont activés).
- Les liaisons non loopback **requièrent toujours** une authentification gateway. En pratique, cela signifie une authentification par jeton/mot de passe ou un proxy inverse sensible à l’identité avec `gateway.auth.mode: "trusted-proxy"`.
- L’assistant crée une authentification à secret partagé par défaut et génère généralement un
  jeton gateway (même sur loopback).
- En mode secret partagé, l’interface envoie `connect.params.auth.token` ou
  `connect.params.auth.password`.
- Lorsque `gateway.tls.enabled: true`, les helpers locaux de tableau de bord et de statut affichent
  les URL du tableau de bord en `https://` et les URL WebSocket en `wss://`.
- Dans les modes avec identité, comme Tailscale Serve ou `trusted-proxy`, la
  vérification d’authentification WebSocket est satisfaite à partir des en-têtes de requête.
- Pour les déploiements Control UI non loopback, définissez explicitement `gateway.controlUi.allowedOrigins`
  (origines complètes). Sans cela, le démarrage de la gateway est refusé par défaut.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` active le mode de repli d’origine basé sur l’en-tête Host, mais il s’agit d’une dégradation de sécurité dangereuse.
- Avec Serve, les en-têtes d’identité Tailscale peuvent satisfaire l’authentification Control UI/WebSocket
  lorsque `gateway.auth.allowTailscale` vaut `true` (aucun jeton/mot de passe requis).
  Les points de terminaison HTTP API n’utilisent pas ces en-têtes d’identité Tailscale ; ils suivent
  à la place le mode d’authentification HTTP normal de la gateway. Définissez
  `gateway.auth.allowTailscale: false` pour exiger des identifiants explicites. Consultez
  [Tailscale](/fr/gateway/tailscale) et [Sécurité](/fr/gateway/security). Ce
  flux sans jeton suppose que l’hôte gateway est de confiance.
- `gateway.tailscale.mode: "funnel"` exige `gateway.auth.mode: "password"` (mot de passe partagé).

## Compilation de l’interface

La Gateway sert les fichiers statiques depuis `dist/control-ui`. Compilez-les avec :

```bash
pnpm ui:build
```
