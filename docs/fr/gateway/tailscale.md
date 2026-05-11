---
read_when:
    - Exposer l’interface utilisateur de contrôle du Gateway en dehors de localhost
    - Automatisation de l’accès au tailnet ou au tableau de bord public
summary: Tailscale Serve/Funnel intégré pour le tableau de bord du Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-05-11T20:39:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3a90145b9884f31d43fabaddabe17e6ba017dabaec6e6e7d263dacefb33f1b6
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw peut configurer automatiquement Tailscale **Serve** (tailnet) ou **Funnel** (public) pour le tableau de bord du Gateway et le port WebSocket. Cela garde le Gateway lié au loopback tandis que Tailscale fournit HTTPS, le routage et, pour Serve, les en-têtes d’identité.

## Modes

- `serve` : Serve limité au tailnet via `tailscale serve`. Le gateway reste sur `127.0.0.1`.
- `funnel` : HTTPS public via `tailscale funnel`. OpenClaw exige un mot de passe partagé.
- `off` : Valeur par défaut (aucune automatisation Tailscale).

La sortie d’état et d’audit utilise **exposition Tailscale** pour ce mode Serve/Funnel d’OpenClaw. `off` signifie qu’OpenClaw ne gère pas Serve ni Funnel ; cela ne signifie pas que le daemon Tailscale local est arrêté ou déconnecté.

## Authentification

Définissez `gateway.auth.mode` pour contrôler la négociation :

- `none` (entrée privée uniquement)
- `token` (valeur par défaut lorsque `OPENCLAW_GATEWAY_TOKEN` est défini)
- `password` (secret partagé via `OPENCLAW_GATEWAY_PASSWORD` ou la configuration)
- `trusted-proxy` (proxy inverse sensible à l’identité ; voir [Authentification par proxy approuvé](/fr/gateway/trusted-proxy-auth))

Lorsque `tailscale.mode = "serve"` et que `gateway.auth.allowTailscale` vaut `true`, l’authentification de l’interface Control UI/WebSocket peut utiliser les en-têtes d’identité Tailscale (`tailscale-user-login`) sans fournir de jeton ni de mot de passe. OpenClaw vérifie l’identité en résolvant l’adresse `x-forwarded-for` via le daemon Tailscale local (`tailscale whois`) et en la comparant à l’en-tête avant de l’accepter. OpenClaw ne traite une requête comme Serve que lorsqu’elle arrive depuis le loopback avec les en-têtes `x-forwarded-for`, `x-forwarded-proto` et `x-forwarded-host` de Tailscale.
Pour les sessions opérateur de Control UI qui incluent l’identité de l’appareil du navigateur, ce chemin Serve vérifié ignore aussi l’aller-retour d’appairage de l’appareil. Il ne contourne pas l’identité de l’appareil du navigateur : les clients sans appareil sont toujours rejetés, et les connexions WebSocket de rôle nœud ou hors Control UI suivent toujours les vérifications normales d’appairage et d’authentification.
Les points de terminaison de l’API HTTP (par exemple `/v1/*`, `/tools/invoke` et `/api/channels/*`) n’utilisent **pas** l’authentification par en-tête d’identité Tailscale. Ils suivent toujours le mode d’authentification HTTP normal du gateway : authentification par secret partagé par défaut, ou configuration `trusted-proxy` / entrée privée `none` intentionnellement configurée.
Ce flux sans jeton suppose que l’hôte du gateway est approuvé. Si du code local non approuvé peut s’exécuter sur le même hôte, désactivez `gateway.auth.allowTailscale` et exigez plutôt une authentification par jeton/mot de passe.
Pour exiger des identifiants explicites par secret partagé, définissez `gateway.auth.allowTailscale: false` et utilisez `gateway.auth.mode: "token"` ou `"password"`.

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

- Control UI : `http://<tailscale-ip>:18789/`
- WebSocket : `ws://<tailscale-ip>:18789`

<Note>
Le loopback (`http://127.0.0.1:18789`) ne fonctionnera **pas** dans ce mode.
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

- Tailscale Serve/Funnel nécessite que la CLI `tailscale` soit installée et connectée.
- `tailscale.mode: "funnel"` refuse de démarrer sauf si le mode d’authentification est `password`, afin d’éviter une exposition publique.
- Définissez `gateway.tailscale.resetOnExit` si vous voulez qu’OpenClaw annule la configuration `tailscale serve` ou `tailscale funnel` à l’arrêt.
- Définissez `gateway.tailscale.preserveFunnel: true` pour garder active une route `tailscale funnel` configurée en externe lors des redémarrages du gateway. Lorsque cette option est activée et que le gateway s’exécute en `mode: "serve"`, OpenClaw vérifie `tailscale funnel status` avant de réappliquer Serve et l’ignore lorsqu’une route Funnel couvre déjà le port du gateway. La politique Funnel gérée par OpenClaw avec mot de passe uniquement reste inchangée.
- `gateway.bind: "tailnet"` est une liaison directe au Tailnet (pas de HTTPS, pas de Serve/Funnel).
- `gateway.bind: "auto"` préfère le loopback ; utilisez `tailnet` si vous voulez un accès limité au Tailnet.
- Serve/Funnel n’expose que **l’interface de contrôle du Gateway + WS**. Les nœuds se connectent via le même point de terminaison WS du Gateway, donc Serve peut fonctionner pour l’accès des nœuds.

## Contrôle du navigateur (Gateway distant + navigateur local)

Si vous exécutez le Gateway sur une machine mais souhaitez piloter un navigateur sur une autre machine, exécutez un **hôte de nœud** sur la machine du navigateur et gardez les deux sur le même tailnet.
Le Gateway transmettra les actions du navigateur au nœud ; aucun serveur de contrôle séparé ni URL Serve n’est nécessaire.

Évitez Funnel pour le contrôle du navigateur ; traitez l’appairage des nœuds comme un accès opérateur.

## Prérequis et limites Tailscale

- Serve nécessite que HTTPS soit activé pour votre tailnet ; la CLI vous invite à le faire s’il manque.
- Serve injecte des en-têtes d’identité Tailscale ; Funnel ne le fait pas.
- Funnel nécessite Tailscale v1.38.3+, MagicDNS, HTTPS activé et un attribut de nœud funnel.
- Funnel ne prend en charge que les ports `443`, `8443` et `10000` via TLS.
- Funnel sur macOS nécessite la variante open source de l’application Tailscale.

## En savoir plus

- Vue d’ensemble de Tailscale Serve : [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Commande `tailscale serve` : [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Vue d’ensemble de Tailscale Funnel : [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Commande `tailscale funnel` : [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Associés

- [Accès distant](/fr/gateway/remote)
- [Découverte](/fr/gateway/discovery)
- [Authentification](/fr/gateway/authentication)
