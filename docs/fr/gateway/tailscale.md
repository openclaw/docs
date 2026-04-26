---
read_when:
    - Exposer la Control UI Gateway en dehors de localhost
    - Automatiser l’accès au tableau de bord sur le tailnet ou en public
summary: Tailscale Serve/Funnel intégré pour le tableau de bord Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-26T11:30:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5966490f8e85774b5149ed29cf7fd4b108eb438f94f5f74a3e5aa3e3b39568a
    source_path: gateway/tailscale.md
    workflow: 15
---

OpenClaw peut configurer automatiquement Tailscale **Serve** (tailnet) ou **Funnel** (public) pour le
tableau de bord Gateway et le port WebSocket. Cela permet de garder la Gateway liée au loopback pendant que
Tailscale fournit HTTPS, le routage et (pour Serve) les en-têtes d’identité.

## Modes

- `serve` : Serve limité au tailnet via `tailscale serve`. La gateway reste sur `127.0.0.1`.
- `funnel` : HTTPS public via `tailscale funnel`. OpenClaw exige un mot de passe partagé.
- `off` : Par défaut (aucune automatisation Tailscale).

La sortie de statut et d’audit utilise **Tailscale exposure** pour ce mode Serve/Funnel
d’OpenClaw. `off` signifie qu’OpenClaw ne gère ni Serve ni Funnel ; cela ne signifie pas que le
démon Tailscale local est arrêté ou déconnecté.

## Authentification

Définissez `gateway.auth.mode` pour contrôler la poignée de main :

- `none` (ingress privé uniquement)
- `token` (par défaut lorsque `OPENCLAW_GATEWAY_TOKEN` est défini)
- `password` (secret partagé via `OPENCLAW_GATEWAY_PASSWORD` ou la configuration)
- `trusted-proxy` (proxy inverse conscient de l’identité ; voir [Auth Trusted Proxy](/fr/gateway/trusted-proxy-auth))

Lorsque `tailscale.mode = "serve"` et que `gateway.auth.allowTailscale` vaut `true`,
l’authentification Control UI/WebSocket peut utiliser les en-têtes d’identité Tailscale
(`tailscale-user-login`) sans fournir de jeton/mot de passe. OpenClaw vérifie
l’identité en résolvant l’adresse `x-forwarded-for` via le démon Tailscale local
(`tailscale whois`) et en la comparant à l’en-tête avant de l’accepter.
OpenClaw ne traite une requête comme provenant de Serve que lorsqu’elle arrive depuis loopback avec
les en-têtes Tailscale `x-forwarded-for`, `x-forwarded-proto` et `x-forwarded-host`.
Pour les sessions operator de Control UI qui incluent l’identité de l’appareil navigateur, ce
chemin Serve vérifié saute aussi l’aller-retour d’appairage de l’appareil. Cela ne contourne pas
l’identité de l’appareil navigateur : les clients sans appareil sont toujours rejetés, et les connexions WebSocket
de rôle node ou non-Control UI suivent toujours les vérifications normales d’appairage et
d’authentification.
Les points de terminaison HTTP API (par exemple `/v1/*`, `/tools/invoke` et `/api/channels/*`)
n’utilisent **pas** l’authentification par en-tête d’identité Tailscale. Ils suivent toujours
le mode d’authentification HTTP normal de la gateway : authentification par secret partagé par défaut,
ou une configuration intentionnelle `trusted-proxy` / `none` avec ingress privé.
Ce flux sans jeton suppose que l’hôte de la gateway est de confiance. Si du code local non fiable
peut s’exécuter sur le même hôte, désactivez `gateway.auth.allowTailscale` et exigez
à la place une authentification par jeton/mot de passe.
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

### Tailnet uniquement (liaison à l’IP Tailnet)

Utilisez ceci lorsque vous voulez que la Gateway écoute directement sur l’IP Tailnet (sans Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Connexion depuis un autre appareil du tailnet :

- Control UI : `http://<tailscale-ip>:18789/`
- WebSocket : `ws://<tailscale-ip>:18789`

Remarque : loopback (`http://127.0.0.1:18789`) **ne** fonctionnera **pas** dans ce mode.

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

## Remarques

- Tailscale Serve/Funnel nécessite que la CLI `tailscale` soit installée et connectée.
- `tailscale.mode: "funnel"` refuse de démarrer sauf si le mode d’authentification est `password` afin d’éviter une exposition publique.
- Définissez `gateway.tailscale.resetOnExit` si vous voulez qu’OpenClaw annule la configuration `tailscale serve`
  ou `tailscale funnel` à l’arrêt.
- `gateway.bind: "tailnet"` correspond à une liaison Tailnet directe (sans HTTPS, sans Serve/Funnel).
- `gateway.bind: "auto"` préfère loopback ; utilisez `tailnet` si vous voulez uniquement Tailnet.
- Serve/Funnel n’exposent que la **Gateway control UI + WS**. Les Nodes se connectent via
  le même point de terminaison Gateway WS, donc Serve peut fonctionner pour l’accès Node.

## Contrôle du navigateur (Gateway distante + navigateur local)

Si vous exécutez la Gateway sur une machine mais voulez piloter un navigateur sur une autre machine,
exécutez un **hôte node** sur la machine du navigateur et gardez les deux sur le même tailnet.
La Gateway transmettra les actions du navigateur au node ; aucun serveur de contrôle séparé ni URL Serve ne sont nécessaires.

Évitez Funnel pour le contrôle du navigateur ; traitez l’appairage node comme l’accès operator.

## Prérequis et limites de Tailscale

- Serve exige que HTTPS soit activé pour votre tailnet ; la CLI vous invite à l’activer si ce n’est pas le cas.
- Serve injecte les en-têtes d’identité Tailscale ; Funnel ne le fait pas.
- Funnel nécessite Tailscale v1.38.3+, MagicDNS, HTTPS activé et un attribut de nœud funnel.
- Funnel ne prend en charge que les ports `443`, `8443` et `10000` via TLS.
- Funnel sur macOS nécessite la variante open source de l’application Tailscale.

## En savoir plus

- Vue d’ensemble de Tailscale Serve : [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Commande `tailscale serve` : [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Vue d’ensemble de Tailscale Funnel : [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Commande `tailscale funnel` : [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Connexe

- [Accès distant](/fr/gateway/remote)
- [Découverte](/fr/gateway/discovery)
- [Authentification](/fr/gateway/authentication)
