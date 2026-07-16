---
read_when:
    - Vous souhaitez associer rapidement une application Node mobile à un Gateway
    - Vous avez besoin de la sortie du code de configuration pour un partage à distance/manuel
summary: Référence de la CLI pour `openclaw qr` (génération d’un code QR d’appairage mobile et d’un code de configuration)
title: QR
x-i18n:
    generated_at: "2026-07-16T13:10:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f9d60a58126eae7eec5979f28bb511a09fa52b68cdd73727fca0b2de74efa84a
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Générez un code QR d’appairage mobile et un code de configuration à partir de la configuration actuelle de votre Gateway.

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --limited
openclaw qr --url wss://gateway.example/ws
```

Les applications OpenClaw officielles pour iOS et Android se connectent automatiquement lorsque les métadonnées de leur code de configuration correspondent. Si une demande reste en attente (par exemple, pour un client non officiel ou en cas de métadonnées non concordantes), examinez-la et approuvez-la :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## Options

- `--remote` : privilégie `gateway.remote.url` ; utilise `gateway.tailscale.mode=serve|funnel` comme solution de repli si cette URL n’est pas définie. Ignore `publicUrl` du plugin `device-pair`.
- `--url <url>` : remplace l’URL du Gateway utilisée dans la charge utile
- `--public-url <url>` : remplace l’URL publique utilisée dans la charge utile
- `--token <token>` : remplace le jeton du Gateway auprès duquel le flux d’amorçage s’authentifie
- `--password <password>` : remplace le mot de passe du Gateway auprès duquel le flux d’amorçage s’authentifie
- `--limited` : omet l’accès administratif au Gateway du jeton d’opérateur transmis
- `--setup-code-only` : affiche uniquement le code de configuration
- `--no-ascii` : ignore le rendu ASCII du code QR
- `--json` : émet du JSON (`setupCode`, `gatewayUrl`, `gatewayUrls` facultatif, `auth`, `access`, `accessDowngraded` facultatif, `urlSource`)

`--token` et `--password` sont mutuellement exclusifs.

## Contenu du code de configuration

Le code de configuration contient un `bootstrapToken` opaque et de courte durée, et non le jeton ou le mot de passe partagé du Gateway. Pour un point de terminaison `wss://` (ou une adresse de bouclage sur le même hôte), le flux d’amorçage par défaut émet :

- un jeton `node` principal avec `scopes: []`
- un jeton de transfert `operator` natif complet pour mobile avec `operator.admin`, `operator.approvals`, `operator.read`, `operator.talk.secrets` et `operator.write`

Utilisez `--limited` pour conserver le même jeton de nœud tout en omettant `operator.admin` du transfert à l’opérateur. La portée de modification de l’appairage n’est jamais transmise par un code de configuration.

La configuration en texte clair sur le réseau local via `ws://` reste disponible, mais OpenClaw utilise automatiquement le profil limité, car un observateur du réseau pourrait capturer le jeton d’amorçage au porteur et l’utiliser avant le client. Configurez `wss://` ou Tailscale Serve, puis générez un nouveau code pour obtenir un accès complet.

## Résolution de l’URL du Gateway

L’appairage mobile échoue de manière sécurisée pour les URL de Gateway Tailscale/publiques en `ws://` : utilisez Tailscale Serve/Funnel ou une URL de Gateway `wss://` pour celles-ci. Les adresses privées du réseau local et les hôtes Bonjour `.local` restent pris en charge via `ws://` en clair, avec un accès limité pour l’opérateur comme décrit précédemment.

Lorsque l’URL du Gateway sélectionnée provient de `gateway.bind=lan`, OpenClaw vérifie également les routes `tailscale serve status --json` persistantes. Toute racine HTTPS Serve qui transmet le port de bouclage du Gateway actif est incluse comme solution de repli. La commande QR ajoute cette solution de repli uniquement pour `lan` ; `custom` et `tailnet` conservent leurs routes explicitement annoncées. Les clients iOS actuels testent les routes annoncées dans l’ordre et enregistrent la première accessible ; le champ historique `url` reste inchangé pour les anciens clients.

Avec `--remote`, l’un des deux éléments `gateway.remote.url` ou `gateway.tailscale.mode=serve|funnel` est requis.

## Résolution de l’authentification (sans `--remote`)

Lorsqu’aucun remplacement d’authentification n’est transmis à la CLI, les SecretRefs d’authentification du Gateway local sont résolues comme suit :

| Condition                                                                                                                    | Résolution                                |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"`, ou mode déduit sans source de mot de passe prioritaire                                                | `gateway.auth.token`                      |
| `gateway.auth.mode="password"`, ou mode déduit sans jeton prioritaire provenant de l’authentification ou de l’environnement                                         | `gateway.auth.password`                   |
| `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés (y compris les SecretRefs) et `gateway.auth.mode` n’est pas défini | échec ; définissez explicitement `gateway.auth.mode` |

## Résolution de l’authentification (`--remote`)

Si les identifiants distants effectivement actifs sont configurés comme SecretRefs et que ni `--token` ni `--password` ne sont transmis, la commande les résout à partir de l’instantané du Gateway actif. Si le Gateway est indisponible, la commande échoue immédiatement.

<Note>
Ce chemin de commande nécessite un Gateway prenant en charge la méthode RPC `secrets.resolve`. Les anciens Gateways renvoient une erreur de méthode inconnue.
</Note>

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Appareils](/fr/cli/devices)
- [Appairage](/fr/cli/pairing)
