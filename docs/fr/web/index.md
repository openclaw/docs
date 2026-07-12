---
read_when:
    - Vous souhaitez accéder au Gateway via Tailscale
    - Vous souhaitez utiliser l’interface de contrôle dans le navigateur et modifier la configuration
summary: 'Surfaces web du Gateway : interface de contrôle, modes de liaison et sécurité'
title: Web
x-i18n:
    generated_at: "2026-07-12T15:57:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 413fb029d95241f5c6043b28825727cdee52b2fa8cbe998fbbd6e3ff7b81467b
    source_path: web/index.md
    workflow: 16
---

Le Gateway fournit une petite **interface de contrôle dans le navigateur** (Vite + Lit) depuis le même port que le WebSocket du Gateway :

- par défaut : `http://<host>:18789/`
- avec `gateway.tls.enabled: true` : `https://<host>:18789/`
- préfixe facultatif : définissez `gateway.controlUi.basePath` (par ex. `/openclaw`)

Les fonctionnalités sont décrites dans [Interface de contrôle](/fr/web/control-ui). Cette page présente les modes de liaison, la sécurité et les autres surfaces accessibles sur le Web.

## Configuration (activée par défaut)

L’interface de contrôle est **activée par défaut** lorsque les ressources sont présentes (`dist/control-ui`) :

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath facultatif
  },
}
```

## Webhooks

Lorsque `hooks.enabled=true`, le Gateway expose également un point de terminaison Webhook sur le même serveur HTTP. Consultez `hooks` dans la [référence de configuration du Gateway](/fr/gateway/configuration-reference#hooks) pour l’authentification et les charges utiles.

## RPC HTTP d’administration

`POST /api/v1/admin/rpc` expose certaines méthodes du plan de contrôle du Gateway via HTTP. Désactivé par défaut ; enregistré uniquement lorsque le plugin `admin-http-rpc` est activé. Consultez [RPC HTTP d’administration](/fr/plugins/admin-http-rpc) pour le modèle d’authentification, les méthodes autorisées et la comparaison avec l’API WebSocket.

## Accès Tailscale

<Tabs>
  <Tab title="Serve intégré (recommandé)">
    Maintenez le Gateway sur l’interface de bouclage et laissez Tailscale Serve agir comme proxy :

    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "serve" },
      },
    }
    ```

    Démarrez le Gateway :

    ```bash
    openclaw gateway
    ```

    Ouvrez `https://<magicdns>/` (ou la valeur configurée pour `gateway.controlUi.basePath`).

  </Tab>
  <Tab title="Liaison au tailnet + jeton">
    ```json5
    {
      gateway: {
        bind: "tailnet",
        controlUi: { enabled: true },
        auth: { mode: "token", token: "your-token" },
      },
    }
    ```

    Démarrez le Gateway (cet exemple hors interface de bouclage utilise une authentification par jeton à secret partagé) :

    ```bash
    openclaw gateway
    ```

    Ouvrez `http://<tailscale-ip>:18789/` (ou la valeur configurée pour `gateway.controlUi.basePath`).

  </Tab>
  <Tab title="Internet public (Funnel)">
    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "funnel" },
        auth: { mode: "password" }, // ou OPENCLAW_GATEWAY_PASSWORD
      },
    }
    ```

    `tailscale.mode: "funnel"` nécessite `gateway.auth.mode: "password"` ; Serve et Funnel nécessitent tous deux `gateway.bind: "loopback"`.

  </Tab>
</Tabs>

## Remarques sur la sécurité

- L’authentification du Gateway est requise par défaut : jeton, mot de passe, proxy de confiance ou en-têtes d’identité Tailscale Serve lorsqu’ils sont activés.
- Les liaisons hors interface de bouclage **nécessitent** toujours l’authentification du Gateway : authentification par jeton/mot de passe ou proxy inverse tenant compte de l’identité avec `gateway.auth.mode: "trusted-proxy"`.
- L’assistant de configuration initiale crée par défaut une authentification à secret partagé et génère généralement un jeton de Gateway, même sur l’interface de bouclage.
- En mode secret partagé, l’interface envoie `connect.params.auth.token` ou `connect.params.auth.password` lors de la négociation WebSocket.
- Avec `gateway.tls.enabled: true`, les outils locaux de tableau de bord et d’état affichent des URL `https://` et des URL WebSocket `wss://`.
- Dans les modes porteurs d’identité (Tailscale Serve, `trusted-proxy`), la vérification de l’authentification WebSocket est effectuée à partir des en-têtes de la requête plutôt que d’un secret partagé.
- Pour les déploiements publics de l’interface de contrôle hors interface de bouclage, définissez explicitement `gateway.controlUi.allowedOrigins` (origines complètes). Les chargements privés de même origine sont acceptés sans cette option pour les hôtes de bouclage, RFC1918/lien-local, `.local`, `.ts.net` et CGNAT Tailscale.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback: true` active le repli de l’origine sur l’en-tête Host ; il s’agit d’un affaiblissement dangereux de la sécurité.
- Avec Serve, les en-têtes d’identité Tailscale satisfont l’authentification de l’interface de contrôle/WebSocket lorsque `gateway.auth.allowTailscale: true` (aucun jeton ni mot de passe requis). Les points de terminaison de l’API HTTP n’utilisent pas les en-têtes d’identité Tailscale ; ils suivent toujours le mode d’authentification HTTP normal du Gateway. Définissez `gateway.auth.allowTailscale: false` pour exiger des identifiants explicites même via Serve. Ce flux sans jeton suppose que l’hôte du Gateway lui-même est digne de confiance. Consultez [Tailscale](/fr/gateway/tailscale) et [Sécurité](/fr/gateway/security).

## Compilation de l’interface

Le Gateway fournit les fichiers statiques depuis `dist/control-ui` :

```bash
pnpm ui:build
```
