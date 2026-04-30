---
read_when:
    - Exposer l’interface de contrôle du Gateway en dehors de localhost
    - Automatisation de l’accès au tableau de bord via le tailnet ou en accès public
summary: Serve/Funnel Tailscale intégré pour le tableau de bord Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-30T07:29:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5bc0a90ce8105017f5f52bad4a40609711f4bd4538437916c020680d3e9eda4
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw peut configurer automatiquement Tailscale **Serve** (tailnet) ou **Funnel** (public) pour le
tableau de bord du Gateway et le port WebSocket. Cela maintient le Gateway lié au loopback tandis que
Tailscale fournit HTTPS, le routage et, pour Serve, les en-têtes d’identité.

## Modes

- `serve` : Serve réservé au tailnet via `tailscale serve`. Le gateway reste sur `127.0.0.1`.
- `funnel` : HTTPS public via `tailscale funnel`. OpenClaw exige un mot de passe partagé.
- `off` : Par défaut (aucune automatisation Tailscale).

La sortie d’état et d’audit utilise **Exposition Tailscale** pour ce mode Serve/Funnel
d’OpenClaw. `off` signifie qu’OpenClaw ne gère pas Serve ni Funnel ; cela ne signifie pas que le
démon Tailscale local est arrêté ou déconnecté.

## Authentification

Définissez `gateway.auth.mode` pour contrôler la négociation :

- `none` (entrée privée uniquement)
- `token` (valeur par défaut lorsque `OPENCLAW_GATEWAY_TOKEN` est défini)
- `password` (secret partagé via `OPENCLAW_GATEWAY_PASSWORD` ou la configuration)
- `trusted-proxy` (proxy inverse tenant compte de l’identité ; consultez [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth))

Lorsque `tailscale.mode = "serve"` et que `gateway.auth.allowTailscale` vaut `true`,
l’authentification de l’interface utilisateur de contrôle/WebSocket peut utiliser les en-têtes d’identité Tailscale
(`tailscale-user-login`) sans fournir de jeton ni de mot de passe. OpenClaw vérifie
l’identité en résolvant l’adresse `x-forwarded-for` via le démon Tailscale
local (`tailscale whois`) et en la faisant correspondre à l’en-tête avant de l’accepter.
OpenClaw ne traite une requête comme Serve que lorsqu’elle arrive depuis le loopback avec
les en-têtes Tailscale `x-forwarded-for`, `x-forwarded-proto` et `x-forwarded-host`.
Pour les sessions opérateur de l’interface utilisateur de contrôle qui incluent l’identité de l’appareil du navigateur, ce
chemin Serve vérifié ignore aussi l’aller-retour d’appairage de l’appareil. Il ne contourne pas
l’identité de l’appareil du navigateur : les clients sans appareil sont toujours rejetés, et les connexions
WebSocket avec rôle de nœud ou hors interface utilisateur de contrôle suivent toujours les contrôles normaux
d’appairage et d’authentification.
Les points de terminaison de l’API HTTP (par exemple `/v1/*`, `/tools/invoke` et `/api/channels/*`)
n’utilisent **pas** l’authentification par en-têtes d’identité Tailscale. Ils suivent toujours le
mode d’authentification HTTP normal du gateway : authentification par secret partagé par défaut, ou une configuration
`none` de proxy de confiance / entrée privée configurée intentionnellement.
Ce flux sans jeton suppose que l’hôte du gateway est fiable. Si du code local non fiable
peut s’exécuter sur le même hôte, désactivez `gateway.auth.allowTailscale` et exigez plutôt
une authentification par jeton/mot de passe.
Pour exiger des identifiants explicites avec secret partagé, définissez `gateway.auth.allowTailscale: false`
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

### Tailnet uniquement (liaison à l’IP Tailnet)

Utilisez ceci lorsque vous voulez que le Gateway écoute directement sur l’IP Tailnet (sans Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Connectez-vous depuis un autre appareil Tailnet :

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

Préférez `OPENCLAW_GATEWAY_PASSWORD` plutôt que de valider un mot de passe sur disque.

## Exemples CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Remarques

- Tailscale Serve/Funnel exige que la CLI `tailscale` soit installée et connectée.
- `tailscale.mode: "funnel"` refuse de démarrer sauf si le mode d’authentification est `password`, afin d’éviter une exposition publique.
- Définissez `gateway.tailscale.resetOnExit` si vous voulez qu’OpenClaw annule la configuration `tailscale serve`
  ou `tailscale funnel` à l’arrêt.
- `gateway.bind: "tailnet"` est une liaison directe au Tailnet (pas de HTTPS, pas de Serve/Funnel).
- `gateway.bind: "auto"` privilégie le loopback ; utilisez `tailnet` si vous voulez uniquement Tailnet.
- Serve/Funnel expose uniquement **l’interface utilisateur de contrôle du Gateway + WS**. Les nœuds se connectent via
  le même point de terminaison WS du Gateway, donc Serve peut fonctionner pour l’accès aux nœuds.

## Contrôle du navigateur (Gateway distant + navigateur local)

Si vous exécutez le Gateway sur une machine mais voulez piloter un navigateur sur une autre machine,
exécutez un **hôte de nœud** sur la machine du navigateur et gardez les deux sur le même tailnet.
Le Gateway transmettra les actions du navigateur au nœud ; aucun serveur de contrôle séparé ni URL Serve n’est nécessaire.

Évitez Funnel pour le contrôle du navigateur ; traitez l’appairage de nœud comme l’accès opérateur.

## Prérequis et limites de Tailscale

- Serve nécessite que HTTPS soit activé pour votre tailnet ; la CLI vous le demande s’il manque.
- Serve injecte les en-têtes d’identité Tailscale ; Funnel ne le fait pas.
- Funnel nécessite Tailscale v1.38.3+, MagicDNS, HTTPS activé et un attribut de nœud funnel.
- Funnel ne prend en charge que les ports `443`, `8443` et `10000` via TLS.
- Funnel sur macOS nécessite la variante open source de l’application Tailscale.

## En savoir plus

- Présentation de Tailscale Serve : [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Commande `tailscale serve` : [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Présentation de Tailscale Funnel : [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Commande `tailscale funnel` : [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Articles connexes

- [Accès distant](/fr/gateway/remote)
- [Découverte](/fr/gateway/discovery)
- [Authentification](/fr/gateway/authentication)
