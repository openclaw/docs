---
read_when:
    - Exposer l’interface de contrôle du Gateway en dehors de localhost
    - Automatisation de l’accès au tableau de bord via le tailnet ou le réseau public
summary: Serve/Funnel Tailscale intégré pour le tableau de bord du Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-07-12T15:30:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e201a64ac427994401fae1b934d94e0c5afe976b4acd34d45b059978f5f1807e
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw peut configurer automatiquement Tailscale **Serve** (tailnet) ou **Funnel** (public) pour le tableau de bord du Gateway et le port WebSocket. Le Gateway reste ainsi lié à l’interface de bouclage, tandis que Tailscale fournit HTTPS, le routage et, pour Serve, les en-têtes d’identité.

## Modes

`gateway.tailscale.mode` :

| Mode            | Comportement                                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| `serve`         | Serve limité au tailnet via `tailscale serve`. Le Gateway reste sur `127.0.0.1`.                      |
| `funnel`        | HTTPS public via `tailscale funnel`. Nécessite un mot de passe partagé.                               |
| `off` (par défaut) | Aucune automatisation Tailscale.                                                                   |

Les sorties d’état et d’audit utilisent **l’exposition Tailscale** pour ce mode Serve/Funnel d’OpenClaw. `off` signifie qu’OpenClaw ne gère ni Serve ni Funnel ; cela ne signifie pas que le démon Tailscale local est arrêté ou déconnecté.

## Exemples de configuration

### Limité au tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Ouvrez : `https://<magicdns>/` (ou votre valeur configurée de `gateway.controlUi.basePath`)

Pour exposer l’interface de contrôle par l’intermédiaire d’un service Tailscale nommé plutôt que du nom d’hôte de l’appareil, définissez `gateway.tailscale.serviceName` sur le nom du service :

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

Au démarrage, l’URL du service indiquée est alors `https://openclaw.<tailnet-name>.ts.net/` au lieu du nom d’hôte de l’appareil. Les services Tailscale exigent que l’hôte soit un nœud étiqueté approuvé dans votre tailnet — configurez l’étiquette et approuvez le service dans Tailscale avant d’activer cette option, sinon `tailscale serve --service=...` échoue au démarrage du Gateway.

### Limité au tailnet (liaison à l’adresse IP du tailnet)

Utilisez cette configuration pour que le Gateway écoute directement sur l’adresse IP du tailnet, sans Serve/Funnel :

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Connectez-vous depuis un autre appareil du tailnet :

- Interface de contrôle : `http://<tailscale-ip>:18789/`
- WebSocket : `ws://<tailscale-ip>:18789`

<Note>
Lorsqu’une adresse IPv4 de tailnet pouvant servir à la liaison est présente, le Gateway exige également `http://127.0.0.1:18789` pour les clients authentifiés du même hôte. Si aucune adresse de tailnet n’est disponible au démarrage, il revient à l’interface de bouclage uniquement ; redémarrez-le une fois Tailscale disponible pour ajouter l’accès direct au tailnet. Aucun de ces chemins n’ajoute d’exposition au réseau local ou au public.
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

## Exemples de CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Authentification

`gateway.auth.mode` contrôle l’établissement de la connexion :

| Mode                                                   | Cas d’utilisation                                                                                           |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `none`                                                 | Entrée privée uniquement                                                                                    |
| `token` (par défaut lorsque `OPENCLAW_GATEWAY_TOKEN` est défini) | Jeton partagé                                                                                     |
| `password`                                             | Secret partagé via `OPENCLAW_GATEWAY_PASSWORD` ou la configuration                                          |
| `trusted-proxy`                                        | Proxy inverse tenant compte de l’identité ; voir [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth) |

### En-têtes d’identité Tailscale (Serve uniquement)

Lorsque `tailscale.mode: "serve"` et que `gateway.auth.allowTailscale` vaut `true`, l’authentification de l’interface de contrôle/WebSocket peut utiliser les en-têtes d’identité Tailscale (`tailscale-user-login`) plutôt qu’un jeton ou un mot de passe. OpenClaw vérifie l’en-tête en résolvant l’adresse `x-forwarded-for` de la requête au moyen du démon Tailscale local (`tailscale whois`), puis en la faisant correspondre à l’identifiant de connexion de l’en-tête avant de l’accepter. Une requête ne peut emprunter ce chemin que si elle provient de l’interface de bouclage et contient les en-têtes Tailscale `x-forwarded-for`, `x-forwarded-proto` et `x-forwarded-host`.

Ce flux sans jeton suppose que l’hôte du Gateway est digne de confiance. Si du code local non fiable peut s’exécuter sur le même hôte, définissez `gateway.auth.allowTailscale: false` et exigez plutôt une authentification par jeton ou mot de passe.

Portée du contournement :

- S’applique uniquement à la surface d’authentification WebSocket de l’interface de contrôle. Les points de terminaison de l’API HTTP (`/v1/*`, `/tools/invoke`, `/api/channels/*`, etc.) n’utilisent jamais l’authentification par en-tête d’identité Tailscale ; ils suivent toujours le mode d’authentification HTTP normal du Gateway.
- Pour les sessions d’opérateur de l’interface de contrôle qui possèdent déjà l’identité de l’appareil du navigateur, une identité Tailscale vérifiée évite l’aller-retour d’association par jeton d’amorçage/code QR.
- Cela ne contourne pas l’identité de l’appareil elle-même : les clients sans appareil sont toujours rejetés, et les connexions avec un rôle de nœud passent toujours par les vérifications normales d’association et d’authentification.

## Remarques

- Tailscale Serve/Funnel nécessite que la CLI `tailscale` soit installée et connectée.
- `tailscale.mode: "funnel"` refuse de démarrer sauf si le mode d’authentification est `password`, afin d’éviter une exposition publique.
- `gateway.tailscale.serviceName` s’applique uniquement au mode Serve et est transmis à `tailscale serve --service=<name>`. La valeur doit utiliser le format `svc:<dns-label>` de Tailscale, par exemple `svc:openclaw`. Tailscale exige que les hôtes de service soient des nœuds étiquetés, et le service peut nécessiter une approbation dans la console d’administration avant que Serve puisse le publier.
- `gateway.tailscale.resetOnExit` annule la configuration de `tailscale serve`/`tailscale funnel` à l’arrêt.
- `gateway.tailscale.preserveFunnel: true` maintient active une route `tailscale funnel` configurée en externe lors des redémarrages du Gateway. Avec `mode: "serve"`, OpenClaw vérifie `tailscale funnel status` avant de réappliquer Serve et ignore cette opération lorsqu’une route Funnel couvre déjà le port du Gateway. La politique de Funnel géré par OpenClaw, limitée au mot de passe, reste inchangée.
- `gateway.bind: "tailnet"` utilise une liaison directe au tailnet (sans HTTPS ni Serve/Funnel), ainsi que l’adresse locale obligatoire `127.0.0.1` lorsqu’une adresse IPv4 de tailnet est disponible ; sinon, il revient à l’interface de bouclage uniquement.
- `gateway.bind: "auto"` privilégie l’interface de bouclage ; utilisez `tailnet` pour limiter l’exposition réseau au tailnet tout en conservant l’accès par bouclage depuis le même hôte.
- Serve/Funnel expose uniquement **l’interface de contrôle du Gateway et WS**. Les nœuds se connectent au même point de terminaison WS du Gateway ; Serve fonctionne donc également pour l’accès aux nœuds.

### Prérequis et limites de Tailscale

- Serve nécessite que HTTPS soit activé pour votre tailnet ; la CLI vous invite à l’activer s’il ne l’est pas.
- Serve injecte les en-têtes d’identité Tailscale ; Funnel ne le fait pas.
- Funnel nécessite Tailscale v1.38.3+, MagicDNS, HTTPS activé et un attribut de nœud Funnel.
- Funnel prend uniquement en charge les ports `443`, `8443` et `10000` via TLS.
- Sur macOS, Funnel nécessite la variante open source de l’application Tailscale.

## Contrôle du navigateur (Gateway distant + navigateur local)

Pour exécuter le Gateway sur une machine tout en pilotant un navigateur sur une autre, exécutez un **hôte de nœud** sur la machine du navigateur et conservez les deux sur le même tailnet. Le Gateway transmet les actions du navigateur au nœud ; aucun serveur de contrôle distinct ni aucune URL Serve n’est nécessaire.

Évitez Funnel pour le contrôle du navigateur ; traitez l’association du nœud comme un accès opérateur.

## En savoir plus

- Présentation de Tailscale Serve : [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Commande `tailscale serve` : [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Présentation de Tailscale Funnel : [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Commande `tailscale funnel` : [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Contenu connexe

- [Accès distant](/fr/gateway/remote)
- [Découverte](/fr/gateway/discovery)
- [Authentification](/fr/gateway/authentication)
