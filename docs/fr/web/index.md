---
read_when:
    - Vous souhaitez accéder au Gateway via Tailscale
    - Vous souhaitez l’interface de contrôle dans le navigateur et la modification de la configuration
summary: 'Interfaces web du Gateway : interface de contrôle, modes de liaison et sécurité'
title: Web
x-i18n:
    generated_at: "2026-07-12T03:14:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 413fb029d95241f5c6043b28825727cdee52b2fa8cbe998fbbd6e3ff7b81467b
    source_path: web/index.md
    workflow: 16
---

Le Gateway fournit une petite **interface de contrôle dans le navigateur** (Vite + Lit) sur le même port que le WebSocket du Gateway :

- par défaut : `http://<host>:18789/`
- avec `gateway.tls.enabled: true` : `https://<host>:18789/`
- préfixe facultatif : définissez `gateway.controlUi.basePath` (par exemple `/openclaw`)

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

`POST /api/v1/admin/rpc` expose certaines méthodes du plan de contrôle du Gateway via HTTP. Désactivé par défaut ; enregistré uniquement lorsque le Plugin `admin-http-rpc` est activé. Consultez [RPC HTTP d’administration](/fr/plugins/admin-http-rpc) pour le modèle d’authentification, les méthodes autorisées et la comparaison avec l’API WebSocket.

## Accès Tailscale

<Tabs>
  <Tab title="Serve intégré (recommandé)">
    Maintenez le Gateway sur local loopback et laissez Tailscale Serve agir comme proxy :

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

    Démarrez le Gateway (cet exemple hors local loopback utilise une authentification par jeton à secret partagé) :

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
- Les liaisons hors local loopback **nécessitent** toujours l’authentification du Gateway : authentification par jeton ou mot de passe, ou proxy inverse tenant compte de l’identité avec `gateway.auth.mode: "trusted-proxy"`.
- L’assistant d’intégration crée par défaut une authentification à secret partagé et génère généralement un jeton de Gateway, même sur local loopback.
- En mode secret partagé, l’interface envoie `connect.params.auth.token` ou `connect.params.auth.password` lors de l’établissement de la connexion WebSocket.
- Avec `gateway.tls.enabled: true`, les outils locaux de tableau de bord et d’état affichent des URL `https://` et des URL WebSocket `wss://`.
- Dans les modes transmettant l’identité (Tailscale Serve, `trusted-proxy`), la vérification de l’authentification WebSocket s’appuie sur les en-têtes de la requête plutôt que sur un secret partagé.
- Pour les déploiements publics de l’interface de contrôle hors local loopback, définissez explicitement `gateway.controlUi.allowedOrigins` avec les origines complètes. Sans ce paramètre, les chargements privés depuis la même origine sont acceptés pour local loopback, les hôtes RFC1918 ou link-local, `.local`, `.ts.net` et les hôtes CGNAT de Tailscale.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback: true` active le repli sur l’origine fournie par l’en-tête Host ; il s’agit d’un dangereux affaiblissement de la sécurité.
- Avec Serve, les en-têtes d’identité Tailscale satisfont l’authentification de l’interface de contrôle et du WebSocket lorsque `gateway.auth.allowTailscale: true` (aucun jeton ni mot de passe requis). Les points de terminaison de l’API HTTP n’utilisent pas les en-têtes d’identité Tailscale ; ils suivent toujours le mode d’authentification HTTP normal du Gateway. Définissez `gateway.auth.allowTailscale: false` pour exiger des identifiants explicites, même via Serve. Ce flux sans jeton suppose que l’hôte du Gateway lui-même est fiable. Consultez [Tailscale](/fr/gateway/tailscale) et [Sécurité](/fr/gateway/security).

## Compilation de l’interface

Le Gateway fournit les fichiers statiques depuis `dist/control-ui` :

```bash
pnpm ui:build
```
