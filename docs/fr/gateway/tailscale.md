---
read_when:
    - Exposer l’interface de contrôle du Gateway en dehors de localhost
    - Automatisation de l’accès au tailnet ou au tableau de bord public
summary: Tailscale Serve/Funnel intégré au tableau de bord Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-05-06T17:56:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89a2094dc5d9250b3af2dcc991e83099bdf6fc4039c86358ca57f7e58899196d
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw peut configurer automatiquement Tailscale **Serve** (tailnet) ou **Funnel** (public) pour le
tableau de bord du Gateway et le port WebSocket. Cela maintient le Gateway lié à l’interface de bouclage tandis que
Tailscale fournit HTTPS, le routage et (pour Serve) les en-têtes d’identité.

## Modes

- `serve` : Serve réservé au tailnet via `tailscale serve`. Le gateway reste sur `127.0.0.1`.
- `funnel` : HTTPS public via `tailscale funnel`. OpenClaw exige un mot de passe partagé.
- `off` : Valeur par défaut (aucune automatisation Tailscale).

Les sorties d’état et d’audit utilisent **Exposition Tailscale** pour ce mode Serve/Funnel
d’OpenClaw. `off` signifie qu’OpenClaw ne gère pas Serve ni Funnel ; cela ne signifie pas que le
daemon Tailscale local est arrêté ou déconnecté.

## Authentification

Définissez `gateway.auth.mode` pour contrôler la négociation :

- `none` (entrée privée uniquement)
- `token` (par défaut lorsque `OPENCLAW_GATEWAY_TOKEN` est défini)
- `password` (secret partagé via `OPENCLAW_GATEWAY_PASSWORD` ou la configuration)
- `trusted-proxy` (proxy inverse sensible à l’identité ; voir [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth))

Lorsque `tailscale.mode = "serve"` et que `gateway.auth.allowTailscale` vaut `true`,
l’authentification de l’interface utilisateur de contrôle/WebSocket peut utiliser les en-têtes d’identité Tailscale
(`tailscale-user-login`) sans fournir de jeton/mot de passe. OpenClaw vérifie
l’identité en résolvant l’adresse `x-forwarded-for` via le daemon Tailscale
local (`tailscale whois`) et en la comparant à l’en-tête avant de l’accepter.
OpenClaw ne traite une requête comme Serve que lorsqu’elle arrive depuis l’interface de bouclage avec
les en-têtes `x-forwarded-for`, `x-forwarded-proto` et `x-forwarded-host`
de Tailscale.
Pour les sessions d’opérateur de l’interface utilisateur de contrôle qui incluent l’identité de l’appareil du navigateur, ce
chemin Serve vérifié ignore aussi l’aller-retour d’appairage de l’appareil. Il ne contourne pas
l’identité de l’appareil du navigateur : les clients sans appareil sont toujours rejetés, et les connexions WebSocket
avec rôle de nœud ou hors interface utilisateur de contrôle suivent toujours les contrôles normaux d’appairage et
d’authentification.
Les points de terminaison de l’API HTTP (par exemple `/v1/*`, `/tools/invoke` et `/api/channels/*`)
n’utilisent **pas** l’authentification par en-tête d’identité Tailscale. Ils suivent toujours le mode
d’authentification HTTP normal du gateway : authentification par secret partagé par défaut, ou une configuration
`none` de type proxy de confiance / entrée privée configurée intentionnellement.
Ce flux sans jeton suppose que l’hôte du gateway est fiable. Si du code local non fiable
peut s’exécuter sur le même hôte, désactivez `gateway.auth.allowTailscale` et exigez
plutôt une authentification par jeton/mot de passe.
Pour exiger des identifiants explicites par secret partagé, définissez `gateway.auth.allowTailscale: false`
et utilisez `gateway.auth.mode: "token"` ou `"password"`.

## Exemples de configuration

### Tailnet uniquement (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Ouvrir : `https://<magicdns>/` (ou votre `gateway.controlUi.basePath` configuré)

### Tailnet uniquement (liaison à l’IP du tailnet)

Utilisez ceci lorsque vous voulez que le Gateway écoute directement sur l’IP du tailnet (sans Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Connexion depuis un autre appareil du tailnet :

- Interface utilisateur de contrôle : `http://<tailscale-ip>:18789/`
- WebSocket : `ws://<tailscale-ip>:18789`

<Note>
Loopback (`http://127.0.0.1:18789`) ne fonctionnera **pas** dans ce mode.
</Note>

### Internet public (Funnel + mot de passe partagé)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

Préférez `OPENCLAW_GATEWAY_PASSWORD` à l’enregistrement d’un mot de passe sur disque.

## Exemples CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Notes

- Tailscale Serve/Funnel exige que le CLI `tailscale` soit installé et connecté.
- `tailscale.mode: "funnel"` refuse de démarrer sauf si le mode d’authentification est `password`, afin d’éviter une exposition publique.
- Définissez `gateway.tailscale.resetOnExit` si vous voulez qu’OpenClaw annule la configuration `tailscale serve`
  ou `tailscale funnel` à l’arrêt.
- `gateway.bind: "tailnet"` est une liaison directe au tailnet (pas de HTTPS, pas de Serve/Funnel).
- `gateway.bind: "auto"` privilégie l’interface de bouclage ; utilisez `tailnet` si vous voulez un accès limité au tailnet.
- Serve/Funnel n’exposent que **l’interface utilisateur de contrôle du Gateway + WS**. Les nœuds se connectent via
  le même point de terminaison WS du Gateway, donc Serve peut fonctionner pour l’accès des nœuds.

## Contrôle du navigateur (Gateway distant + navigateur local)

Si vous exécutez le Gateway sur une machine mais voulez piloter un navigateur sur une autre machine,
exécutez un **hôte de nœud** sur la machine du navigateur et gardez les deux sur le même tailnet.
Le Gateway relaiera les actions du navigateur vers le nœud ; aucun serveur de contrôle distinct ni URL Serve n’est nécessaire.

Évitez Funnel pour le contrôle du navigateur ; traitez l’appairage des nœuds comme l’accès opérateur.

## Prérequis et limites de Tailscale

- Serve exige que HTTPS soit activé pour votre tailnet ; le CLI vous le demande si ce n’est pas le cas.
- Serve injecte les en-têtes d’identité Tailscale ; Funnel ne le fait pas.
- Funnel exige Tailscale v1.38.3+, MagicDNS, HTTPS activé et un attribut de nœud funnel.
- Funnel ne prend en charge que les ports `443`, `8443` et `10000` via TLS.
- Funnel sur macOS exige la variante open source de l’application Tailscale.

## En savoir plus

- Présentation de Tailscale Serve : [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Commande `tailscale serve` : [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Présentation de Tailscale Funnel : [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Commande `tailscale funnel` : [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Associé

- [Accès distant](/fr/gateway/remote)
- [Découverte](/fr/gateway/discovery)
- [Authentification](/fr/gateway/authentication)
