---
read_when:
    - Exposition de l’interface de contrôle Gateway en dehors de localhost
    - Automatisation de l’accès au tableau de bord via tailnet ou accès public
summary: Tailscale Serve/Funnel intégré pour le tableau de bord Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-25T13:48:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6042ddaf7194b34f003b1cdf5226f4693da22663d4007c65c79580e7f8ea2835
    source_path: gateway/tailscale.md
    workflow: 15
---

OpenClaw peut configurer automatiquement Tailscale **Serve** (tailnet) ou **Funnel** (public) pour le
tableau de bord Gateway et le port WebSocket. Cela permet à Gateway de rester lié à loopback tandis que
Tailscale fournit HTTPS, le routage et (pour Serve) les en-têtes d’identité.

## Modes

- `serve` : Serve tailnet uniquement via `tailscale serve`. Gateway reste sur `127.0.0.1`.
- `funnel` : HTTPS public via `tailscale funnel`. OpenClaw exige un mot de passe partagé.
- `off` : valeur par défaut (aucune automatisation Tailscale).

## Authentification

Définissez `gateway.auth.mode` pour contrôler la poignée de main :

- `none` (entrée privée uniquement)
- `token` (par défaut lorsque `OPENCLAW_GATEWAY_TOKEN` est défini)
- `password` (secret partagé via `OPENCLAW_GATEWAY_PASSWORD` ou la configuration)
- `trusted-proxy` (proxy inverse tenant compte de l’identité ; voir [Trusted Proxy Auth](/fr/gateway/trusted-proxy-auth))

Lorsque `tailscale.mode = "serve"` et `gateway.auth.allowTailscale` vaut `true`,
l’authentification de l’interface de contrôle/WebSocket peut utiliser les en-têtes d’identité Tailscale
(`tailscale-user-login`) sans fournir de jeton/mot de passe. OpenClaw vérifie
l’identité en résolvant l’adresse `x-forwarded-for` via le démon Tailscale local
(`tailscale whois`) et en la faisant correspondre à l’en-tête avant de l’accepter.
OpenClaw ne traite une requête comme Serve que si elle arrive depuis loopback avec
les en-têtes `x-forwarded-for`, `x-forwarded-proto` et `x-forwarded-host` de Tailscale.
Les points de terminaison de l’API HTTP (par exemple `/v1/*`, `/tools/invoke` et `/api/channels/*`)
n’utilisent **pas** l’authentification par en-tête d’identité Tailscale. Ils suivent toujours le
mode d’authentification HTTP normal de Gateway : authentification par secret partagé par défaut, ou une configuration
intentionnelle `trusted-proxy` / `none` en entrée privée.
Ce flux sans jeton suppose que l’hôte Gateway est fiable. Si du code local non fiable
peut s’exécuter sur le même hôte, désactivez `gateway.auth.allowTailscale` et exigez
une authentification par jeton/mot de passe à la place.
Pour exiger des identifiants explicites de secret partagé, définissez `gateway.auth.allowTailscale: false`
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

Utilisez ceci lorsque vous voulez que Gateway écoute directement sur l’IP Tailnet (sans Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Connexion depuis un autre appareil du tailnet :

- Interface de contrôle : `http://<tailscale-ip>:18789/`
- WebSocket : `ws://<tailscale-ip>:18789`

Remarque : loopback (`http://127.0.0.1:18789`) **ne fonctionnera pas** dans ce mode.

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

- Tailscale Serve/Funnel nécessite que la CLI `tailscale` soit installée et connectée.
- `tailscale.mode: "funnel"` refuse de démarrer sauf si le mode d’authentification est `password` afin d’éviter une exposition publique.
- Définissez `gateway.tailscale.resetOnExit` si vous voulez qu’OpenClaw annule la configuration `tailscale serve`
  ou `tailscale funnel` à l’arrêt.
- `gateway.bind: "tailnet"` est une liaison Tailnet directe (pas de HTTPS, pas de Serve/Funnel).
- `gateway.bind: "auto"` préfère loopback ; utilisez `tailnet` si vous voulez tailnet uniquement.
- Serve/Funnel n’exposent que l’**interface de contrôle Gateway + WS**. Les Nodes se connectent via
  le même point de terminaison WS Gateway, donc Serve peut fonctionner pour l’accès Node.

## Contrôle du navigateur (Gateway distante + navigateur local)

Si vous exécutez Gateway sur une machine mais souhaitez piloter un navigateur sur une autre machine,
exécutez un **hôte Node** sur la machine du navigateur et gardez les deux sur le même tailnet.
Gateway transmettra les actions du navigateur au Node ; aucun serveur de contrôle distinct ni URL Serve n’est nécessaire.

Évitez Funnel pour le contrôle du navigateur ; traitez l’appairage Node comme un accès opérateur.

## Prérequis + limites Tailscale

- Serve nécessite que HTTPS soit activé pour votre tailnet ; la CLI invite si ce n’est pas le cas.
- Serve injecte les en-têtes d’identité Tailscale ; Funnel ne le fait pas.
- Funnel nécessite Tailscale v1.38.3+, MagicDNS, HTTPS activé et un attribut de nœud funnel.
- Funnel ne prend en charge que les ports `443`, `8443` et `10000` sur TLS.
- Funnel sur macOS nécessite la variante open source de l’application Tailscale.

## En savoir plus

- Présentation de Tailscale Serve : [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Commande `tailscale serve` : [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Présentation de Tailscale Funnel : [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Commande `tailscale funnel` : [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Liens associés

- [Accès distant](/fr/gateway/remote)
- [Découverte](/fr/gateway/discovery)
- [Authentification](/fr/gateway/authentication)
