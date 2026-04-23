---
read_when:
    - Vous voulez accéder à la Gateway via Tailscale
    - Vous voulez la Control UI dans le navigateur et l’édition de configuration
summary: 'Surfaces web de la Gateway : Control UI, modes de bind et sécurité'
title: Web
x-i18n:
    generated_at: "2026-04-23T07:13:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf1a173143782557ecd2e79b28694308709dc945700a509148856255d5cef773
    source_path: web/index.md
    workflow: 15
---

# Web (Gateway)

La Gateway sert une petite **Control UI de navigateur** (Vite + Lit) sur le même port que le WebSocket de la Gateway :

- par défaut : `http://<host>:18789/`
- préfixe facultatif : définissez `gateway.controlUi.basePath` (par exemple `/openclaw`)

Les capacités se trouvent dans [Control UI](/fr/web/control-ui).
Cette page se concentre sur les modes de bind, la sécurité et les surfaces exposées au web.

## Webhooks

Lorsque `hooks.enabled=true`, la Gateway expose aussi un petit point de terminaison Webhook sur le même serveur HTTP.
Voir [Configuration de la Gateway](/fr/gateway/configuration) → `hooks` pour l’authentification + les charges utiles.

## Configuration (activée par défaut)

La Control UI est **activée par défaut** lorsque les assets sont présents (`dist/control-ui`).
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

Gardez la Gateway sur loopback et laissez Tailscale Serve la proxyfier :

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Démarrez ensuite la Gateway :

```bash
openclaw gateway
```

Ouvrez :

- `https://<magicdns>/` (ou votre `gateway.controlUi.basePath` configuré)

### Bind tailnet + jeton

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Démarrez ensuite la Gateway (cet exemple non loopback utilise une
authentification par jeton à secret partagé) :

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

## Remarques de sécurité

- L’authentification de la Gateway est requise par défaut (token, mot de passe, trusted-proxy, ou en-têtes d’identité Tailscale Serve lorsqu’ils sont activés).
- Les binds non loopback **exigent toujours** l’authentification de la Gateway. En pratique, cela signifie une authentification par jeton/mot de passe ou un proxy inverse sensible à l’identité avec `gateway.auth.mode: "trusted-proxy"`.
- L’assistant crée par défaut une authentification à secret partagé et génère généralement un
  jeton de Gateway (même sur loopback).
- En mode secret partagé, l’UI envoie `connect.params.auth.token` ou
  `connect.params.auth.password`.
- Dans les modes porteurs d’identité tels que Tailscale Serve ou `trusted-proxy`, la
  vérification d’authentification WebSocket est satisfaite à partir des en-têtes de requête à la place.
- Pour les déploiements non loopback de la Control UI, définissez explicitement `gateway.controlUi.allowedOrigins`
  (origines complètes). Sans cela, le démarrage de la Gateway est refusé par défaut.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` active
  le mode de repli d’origine basé sur l’en-tête Host, mais constitue une dangereuse dégradation de sécurité.
- Avec Serve, les en-têtes d’identité Tailscale peuvent satisfaire l’authentification de la Control UI/WebSocket
  lorsque `gateway.auth.allowTailscale` vaut `true` (aucun token/mot de passe requis).
  Les points de terminaison de l’API HTTP n’utilisent pas ces en-têtes d’identité Tailscale ; ils suivent
  plutôt le mode normal d’authentification HTTP de la Gateway. Définissez
  `gateway.auth.allowTailscale: false` pour exiger des identifiants explicites. Voir
  [Tailscale](/fr/gateway/tailscale) et [Sécurité](/fr/gateway/security). Ce
  flux sans jeton suppose que l’hôte de la Gateway est approuvé.
- `gateway.tailscale.mode: "funnel"` exige `gateway.auth.mode: "password"` (mot de passe partagé).

## Construction de l’UI

La Gateway sert des fichiers statiques depuis `dist/control-ui`. Construisez-les avec :

```bash
pnpm ui:build
```
