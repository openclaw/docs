---
read_when:
    - Vous souhaitez associer rapidement une application de nœud mobile à un Gateway
    - Vous devez afficher le code de configuration pour le partager à distance ou manuellement
summary: Référence de la CLI pour `openclaw qr` (générer le code QR d’association mobile et le code de configuration)
title: QR
x-i18n:
    generated_at: "2026-07-12T02:27:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32641ff4e8035f6ca2eda849a59146125763af21c4105ae6cfa584da31ac070f
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
openclaw qr --url wss://gateway.example/ws
```

Les applications OpenClaw officielles pour iOS et Android se connectent automatiquement lorsque les métadonnées de leur code de configuration correspondent. Si une demande reste en attente (par exemple pour un client non officiel ou en cas de métadonnées incompatibles), examinez-la et approuvez-la :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## Options

- `--remote` : privilégie `gateway.remote.url` ; utilise `gateway.tailscale.mode=serve|funnel` comme solution de repli si cette URL n’est pas définie. Ignore `publicUrl` du Plugin `device-pair`.
- `--url <url>` : remplace l’URL du Gateway utilisée dans la charge utile
- `--public-url <url>` : remplace l’URL publique utilisée dans la charge utile
- `--token <token>` : remplace le jeton du Gateway auprès duquel le flux d’amorçage s’authentifie
- `--password <password>` : remplace le mot de passe du Gateway auprès duquel le flux d’amorçage s’authentifie
- `--setup-code-only` : affiche uniquement le code de configuration
- `--no-ascii` : ignore le rendu ASCII du code QR
- `--json` : produit du JSON (`setupCode`, `gatewayUrl`, `gatewayUrls` facultatif, `auth`, `urlSource`)

`--token` et `--password` sont mutuellement exclusifs.

## Contenu du code de configuration

Le code de configuration contient un `bootstrapToken` opaque et de courte durée, et non le jeton ou le mot de passe partagé du Gateway. Le flux d’amorçage intégré émet :

- un jeton `node` principal avec `scopes: []`
- un jeton de transfert `operator` à portée limitée, restreint à `operator.approvals`, `operator.read`, `operator.talk.secrets` et `operator.write`

Les portées de modification de l’appairage et `operator.admin` nécessitent toujours un appairage d’opérateur approuvé distinct ou un flux de jeton distinct.

## Résolution de l’URL du Gateway

L’appairage mobile échoue de manière sécurisée pour les URL `ws://` publiques ou Tailscale du Gateway : utilisez Tailscale Serve/Funnel ou une URL `wss://` du Gateway dans ces cas. Les adresses de réseau local privé et les hôtes Bonjour en `.local` restent pris en charge via une connexion `ws://` non chiffrée.

Lorsque l’URL du Gateway sélectionnée provient de `gateway.bind=lan`, OpenClaw vérifie également les routes persistantes renvoyées par `tailscale serve status --json`. Toute racine HTTPS Serve qui relaie le port local loopback du Gateway actif est incluse comme solution de repli. La commande QR ajoute cette solution de repli uniquement pour `lan` ; `custom` et `tailnet` conservent leurs routes explicitement annoncées. Les clients iOS actuels testent les routes annoncées dans l’ordre et enregistrent la première accessible ; le champ historique `url` reste inchangé pour les anciens clients.

Avec `--remote`, `gateway.remote.url` ou `gateway.tailscale.mode=serve|funnel` doit être défini.

## Résolution de l’authentification (sans `--remote`)

Lorsqu’aucun remplacement d’authentification par la CLI n’est fourni, les SecretRefs d’authentification du Gateway local sont résolues comme suit :

| Condition                                                                                                                    | Résolution                                |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"`, ou mode déduit sans source de mot de passe prioritaire                                          | `gateway.auth.token`                      |
| `gateway.auth.mode="password"`, ou mode déduit sans jeton prioritaire provenant de l’authentification ou de l’environnement  | `gateway.auth.password`                   |
| `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés, y compris avec des SecretRefs, et `gateway.auth.mode` n’est pas défini | échec ; définissez explicitement `gateway.auth.mode` |

## Résolution de l’authentification (`--remote`)

Si les identifiants distants effectivement actifs sont configurés comme SecretRefs et que ni `--token` ni `--password` ne sont fournis, la commande les résout à partir de l’instantané actif du Gateway. Si le Gateway est indisponible, la commande échoue immédiatement.

<Note>
Ce chemin de commande nécessite un Gateway prenant en charge la méthode RPC `secrets.resolve`. Les anciens Gateways renvoient une erreur indiquant une méthode inconnue.
</Note>

## Ressources associées

- [Référence de la CLI](/fr/cli)
- [Appareils](/fr/cli/devices)
- [Appairage](/fr/cli/pairing)
