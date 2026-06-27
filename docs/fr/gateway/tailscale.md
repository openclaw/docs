---
read_when:
    - Exposer l’interface de contrôle du Gateway en dehors de localhost
    - Automatisation de l’accès au tailnet ou au tableau de bord public
summary: Serve/Funnel Tailscale intégré pour le tableau de bord Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-06-27T17:34:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35944eba19cd82d373b25c602b66d1b76f35ad63aa90767bb1c7ef75549fe905
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw peut configurer automatiquement Tailscale **Serve** (tailnet) ou **Funnel** (public) pour le tableau de bord du Gateway et le port WebSocket. Cela garde le Gateway lié au loopback tandis que Tailscale fournit le HTTPS, le routage et (pour Serve) les en-têtes d’identité.

## Modes

- `serve` : Serve limité au tailnet via `tailscale serve`. Le gateway reste sur `127.0.0.1`.
- `funnel` : HTTPS public via `tailscale funnel`. OpenClaw exige un mot de passe partagé.
- `off` : Par défaut (aucune automatisation Tailscale).

La sortie d’état et d’audit utilise **exposition Tailscale** pour ce mode OpenClaw Serve/Funnel. `off` signifie qu’OpenClaw ne gère pas Serve ou Funnel ; cela ne signifie pas que le daemon Tailscale local est arrêté ou déconnecté.

## Authentification

Définissez `gateway.auth.mode` pour contrôler la négociation :

- `none` (entrée privée uniquement)
- `token` (par défaut lorsque `OPENCLAW_GATEWAY_TOKEN` est défini)
- `password` (secret partagé via `OPENCLAW_GATEWAY_PASSWORD` ou la configuration)
- `trusted-proxy` (proxy inverse sensible à l’identité ; voir [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth))

Lorsque `tailscale.mode = "serve"` et que `gateway.auth.allowTailscale` vaut `true`,
l’authentification de l’interface utilisateur de contrôle/WebSocket peut utiliser les en-têtes d’identité Tailscale
(`tailscale-user-login`) sans fournir de token/mot de passe. OpenClaw vérifie
l’identité en résolvant l’adresse `x-forwarded-for` via le daemon Tailscale local
(`tailscale whois`) et en la comparant à l’en-tête avant de l’accepter.
OpenClaw ne traite une requête comme Serve que lorsqu’elle arrive depuis le loopback avec
les en-têtes Tailscale `x-forwarded-for`, `x-forwarded-proto` et `x-forwarded-host`.
Pour les sessions opérateur de l’interface utilisateur de contrôle qui incluent l’identité de l’appareil du navigateur, ce
chemin Serve vérifié ignore aussi l’aller-retour d’appairage de l’appareil. Il ne contourne pas
l’identité de l’appareil du navigateur : les clients sans appareil sont toujours rejetés, et les connexions WebSocket
node-role ou hors interface utilisateur de contrôle suivent toujours les contrôles normaux d’appairage et
d’authentification.
Les points de terminaison de l’API HTTP (par exemple `/v1/*`, `/tools/invoke` et `/api/channels/*`)
n’utilisent **pas** l’authentification par en-tête d’identité Tailscale. Ils suivent toujours le mode
d’authentification HTTP normal du gateway : authentification par secret partagé par défaut, ou une configuration
trusted-proxy / entrée privée `none` configurée intentionnellement.
Ce flux sans token suppose que l’hôte du gateway est fiable. Si du code local non fiable
peut s’exécuter sur le même hôte, désactivez `gateway.auth.allowTailscale` et exigez plutôt
l’authentification par token/mot de passe.
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

Pour exposer l’interface utilisateur de contrôle via un Service Tailscale nommé au lieu du
nom d’hôte de l’appareil, définissez `gateway.tailscale.serviceName` sur le nom du Service :

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

Avec l’exemple ci-dessus, le démarrage signale l’URL du Service comme
`https://openclaw.<tailnet-name>.ts.net/` au lieu du nom d’hôte de l’appareil.
Les Services Tailscale exigent que l’hôte soit un node étiqueté approuvé dans votre
tailnet. Configurez l’étiquette et approuvez le Service dans Tailscale avant d’activer
cette option, sinon `tailscale serve --service=...` échouera pendant le démarrage du gateway.

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

Connexion depuis un autre appareil Tailnet :

- Interface utilisateur de contrôle : `http://<tailscale-ip>:18789/`
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

Préférez `OPENCLAW_GATEWAY_PASSWORD` plutôt que de valider un mot de passe sur disque.

## Exemples CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Remarques

- Tailscale Serve/Funnel exige que la CLI `tailscale` soit installée et connectée.
- `tailscale.mode: "funnel"` refuse de démarrer sauf si le mode d’authentification est `password`, afin d’éviter une exposition publique.
- `gateway.tailscale.serviceName` s’applique uniquement au mode Serve et est transmis à
  `tailscale serve --service=<name>`. La valeur doit utiliser le format de nom de Service
  Tailscale `svc:<dns-label>`, par exemple `svc:openclaw`.
  Tailscale exige que les hôtes de Service soient des nodes étiquetés, et le Service peut nécessiter
  une approbation dans la console d’administration avant que Serve puisse le publier.
- Définissez `gateway.tailscale.resetOnExit` si vous voulez qu’OpenClaw annule la configuration
  `tailscale serve` ou `tailscale funnel` à l’arrêt.
- Définissez `gateway.tailscale.preserveFunnel: true` pour conserver une route
  `tailscale funnel` configurée en externe active entre les redémarrages du gateway. Lorsque cette option est activée et que le
  gateway s’exécute en `mode: "serve"`, OpenClaw vérifie `tailscale funnel status`
  avant de réappliquer Serve et l’ignore lorsqu’une route Funnel couvre déjà le
  port du gateway. La politique Funnel gérée par OpenClaw, limitée au mot de passe, reste inchangée.
- `gateway.bind: "tailnet"` est une liaison Tailnet directe (pas de HTTPS, pas de Serve/Funnel).
- `gateway.bind: "auto"` préfère le loopback ; utilisez `tailnet` si vous voulez Tailnet uniquement.
- Serve/Funnel n’exposent que **l’interface utilisateur de contrôle du Gateway + WS**. Les nodes se connectent via
  le même point de terminaison WS du Gateway, donc Serve peut fonctionner pour l’accès des nodes.

## Contrôle du navigateur (Gateway distant + navigateur local)

Si vous exécutez le Gateway sur une machine mais voulez piloter un navigateur sur une autre machine,
exécutez un **hôte node** sur la machine du navigateur et gardez les deux sur le même tailnet.
Le Gateway relaiera les actions du navigateur vers le node ; aucun serveur de contrôle distinct ni URL Serve n’est nécessaire.

Évitez Funnel pour le contrôle du navigateur ; traitez l’appairage de node comme un accès opérateur.

## Prérequis et limites Tailscale

- Serve exige que HTTPS soit activé pour votre tailnet ; la CLI vous invite à le faire s’il manque.
- Serve injecte les en-têtes d’identité Tailscale ; Funnel ne le fait pas.
- Funnel exige Tailscale v1.38.3+, MagicDNS, HTTPS activé et un attribut de node funnel.
- Funnel ne prend en charge que les ports `443`, `8443` et `10000` sur TLS.
- Funnel sur macOS exige la variante open source de l’application Tailscale.

## En savoir plus

- Vue d’ensemble de Tailscale Serve : [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Commande `tailscale serve` : [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Vue d’ensemble de Tailscale Funnel : [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Commande `tailscale funnel` : [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Connexe

- [Accès distant](/fr/gateway/remote)
- [Découverte](/fr/gateway/discovery)
- [Authentification](/fr/gateway/authentication)
