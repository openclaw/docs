---
read_when:
    - Vous souhaitez accéder au Gateway via Tailscale
    - Vous voulez l’interface utilisateur de contrôle du navigateur et l’édition de la configuration
summary: 'Surfaces Web du Gateway : interface de contrôle, modes de liaison et sécurité'
title: Web
x-i18n:
    generated_at: "2026-06-27T18:23:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c6b0c9f4ff53af295eb4eef7290d5d6b70c52543f57a9e83c7f8a635a2b35cd
    source_path: web/index.md
    workflow: 16
---

Le Gateway sert une petite **Control UI dans le navigateur** (Vite + Lit) depuis le même port que le WebSocket du Gateway :

- par défaut : `http://<host>:18789/`
- avec `gateway.tls.enabled: true` : `https://<host>:18789/`
- préfixe facultatif : définissez `gateway.controlUi.basePath` (par ex. `/openclaw`)

Les fonctionnalités se trouvent dans [Control UI](/fr/web/control-ui). Le reste de cette page se concentre sur les modes de liaison, la sécurité et les surfaces exposées au Web.

## Webhooks

Lorsque `hooks.enabled=true`, le Gateway expose également un petit point de terminaison webhook sur le même serveur HTTP.
Consultez [Configuration du Gateway](/fr/gateway/configuration) → `hooks` pour l’authentification et les charges utiles.

## RPC HTTP d’administration

Le RPC HTTP d’administration expose certaines méthodes du plan de contrôle du Gateway à `POST /api/v1/admin/rpc`.
Il est désactivé par défaut et n’est enregistré que lorsque le plugin `admin-http-rpc` est activé.
Consultez [RPC HTTP d’administration](/fr/plugins/admin-http-rpc) pour le modèle d’authentification, les méthodes autorisées et la comparaison avec WebSocket.

## Configuration (activée par défaut)

La Control UI est **activée par défaut** lorsque les ressources sont présentes (`dist/control-ui`).
Vous pouvez la contrôler via la configuration :

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath facultatif
  },
}
```

## Accès Tailscale

### Serve intégré (recommandé)

Gardez le Gateway sur local loopback et laissez Tailscale Serve le mandater :

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Démarrez ensuite le Gateway :

```bash
openclaw gateway
```

Ouvrez :

- `https://<magicdns>/` (ou votre `gateway.controlUi.basePath` configuré)

### Liaison Tailnet + jeton

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Démarrez ensuite le Gateway (cet exemple non-loopback utilise une authentification
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
    auth: { mode: "password" }, // ou OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Notes de sécurité

- L’authentification du Gateway est requise par défaut (jeton, mot de passe, proxy de confiance ou en-têtes d’identité Tailscale Serve lorsqu’ils sont activés).
- Les liaisons non-loopback **nécessitent** toujours l’authentification du Gateway. En pratique, cela signifie une authentification par jeton/mot de passe ou un proxy inverse sensible à l’identité avec `gateway.auth.mode: "trusted-proxy"`.
- L’assistant crée par défaut une authentification à secret partagé et génère généralement un
  jeton de Gateway (même sur local loopback).
- En mode secret partagé, l’UI envoie `connect.params.auth.token` ou
  `connect.params.auth.password`.
- Lorsque `gateway.tls.enabled: true`, les assistants locaux de tableau de bord et d’état affichent
  des URL de tableau de bord `https://` et des URL WebSocket `wss://`.
- Dans les modes porteurs d’identité tels que Tailscale Serve ou `trusted-proxy`, la vérification
  d’authentification WebSocket est satisfaite à partir des en-têtes de requête à la place.
- Pour les déploiements publics non-loopback de la Control UI, définissez explicitement `gateway.controlUi.allowedOrigins`
  (origines complètes). Les chargements LAN/Tailnet privés de même origine sont acceptés pour local loopback,
  RFC1918/link-local, `.local`, `.ts.net` et les hôtes CGNAT Tailscale.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` active
  le mode de repli d’origine via l’en-tête Host, mais constitue un abaissement dangereux du niveau de sécurité.
- Avec Serve, les en-têtes d’identité Tailscale peuvent satisfaire l’authentification Control UI/WebSocket
  lorsque `gateway.auth.allowTailscale` vaut `true` (aucun jeton/mot de passe requis).
  Les points de terminaison d’API HTTP n’utilisent pas ces en-têtes d’identité Tailscale ; ils suivent
  plutôt le mode d’authentification HTTP normal du Gateway. Définissez
  `gateway.auth.allowTailscale: false` pour exiger des identifiants explicites. Consultez
  [Tailscale](/fr/gateway/tailscale) et [Sécurité](/fr/gateway/security). Ce
  flux sans jeton suppose que l’hôte du Gateway est fiable.
- `gateway.tailscale.mode: "funnel"` nécessite `gateway.auth.mode: "password"` (mot de passe partagé).

## Construire l’UI

Le Gateway sert les fichiers statiques depuis `dist/control-ui`. Construisez-les avec :

```bash
pnpm ui:build
```
