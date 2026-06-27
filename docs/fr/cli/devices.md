---
read_when:
    - Vous approuvez les demandes d’appairage d’appareils
    - Vous devez faire tourner ou révoquer les jetons d’appareil
summary: Référence CLI pour `openclaw devices` (appairage d’appareil + rotation/révocation de jetons)
title: Appareils
x-i18n:
    generated_at: "2026-06-27T17:18:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08d6945af4fa2403a97dfec94af7bbd0dc746efe90d3e5b4c9f5c5d6d27d70a4
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Gérer les demandes d’association d’appareils et les jetons limités à un appareil.

## Commandes

### `openclaw devices list`

Lister les demandes d’association en attente et les appareils associés.

```
openclaw devices list
openclaw devices list --json
```

La sortie des demandes en attente affiche l’accès demandé à côté de l’accès actuellement
approuvé pour l’appareil lorsque celui-ci est déjà associé. Cela rend les mises à niveau
de portée/rôle explicites au lieu de donner l’impression que l’association a été perdue.

### `openclaw devices remove <deviceId>`

Supprimer une entrée d’appareil associé.

Lorsque vous êtes authentifié avec un jeton d’appareil associé, les appelants non administrateurs peuvent
supprimer uniquement l’entrée de **leur propre** appareil. La suppression d’un autre appareil nécessite
`operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Effacer en masse les appareils associés.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Approuver une demande d’association d’appareil en attente par `requestId` exact. Si `requestId`
est omis ou si `--latest` est passé, OpenClaw affiche uniquement la demande en attente
sélectionnée puis quitte ; relancez l’approbation avec l’ID de demande exact après avoir vérifié
les détails.

<Note>
Si un appareil retente l’association avec des détails d’authentification modifiés (rôle, portées ou clé publique), OpenClaw remplace l’entrée en attente précédente et émet un nouveau `requestId`. Exécutez `openclaw devices list` juste avant l’approbation afin d’utiliser l’ID actuel.
</Note>

Si l’appareil est déjà associé et demande des portées plus larges ou un rôle plus large,
OpenClaw conserve l’approbation existante et crée une nouvelle demande de mise à niveau
en attente. Consultez les colonnes `Requested` et `Approved` dans `openclaw devices list`
ou utilisez `openclaw devices approve --latest` pour prévisualiser la mise à niveau exacte avant
de l’approuver.

Si le Gateway est explicitement configuré avec
`gateway.nodes.pairing.autoApproveCidrs`, les premières demandes `role: node` provenant
d’IP clientes correspondantes peuvent être approuvées avant d’apparaître dans cette liste. Cette politique
est désactivée par défaut et ne s’applique jamais aux clients opérateur/navigateur ni aux demandes de mise à niveau.

L’approbation de rôles d’appareil de nœud ou d’autres rôles non opérateur nécessite `operator.admin`.
`operator.pairing` suffit pour les approbations d’appareils opérateur uniquement lorsque les
portées opérateur demandées restent dans les propres portées de l’appelant. Consultez
[Portées opérateur](/fr/gateway/operator-scopes) pour les vérifications effectuées au moment de l’approbation.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

## Approbation initiale de Paperclip / `openclaw_gateway`

Lorsqu’un nouvel agent Paperclip se connecte pour la première fois via l’adaptateur `openclaw_gateway`, le Gateway peut exiger une approbation unique d’association d’appareil avant que les exécutions puissent réussir. Si Paperclip signale `openclaw_gateway_pairing_required`, approuvez l’appareil en attente puis réessayez.

Pour les gateways locaux, prévisualisez la dernière demande en attente :

```bash
openclaw devices approve --latest
```

La prévisualisation affiche la commande exacte `openclaw devices approve <requestId>`. Vérifiez les détails de la demande, puis relancez cette commande avec l’ID de demande pour l’approuver.

Pour les gateways distants ou les identifiants explicites, passez les mêmes options lors de la prévisualisation et de l’approbation :

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

Pour éviter de réapprouver après les redémarrages, conservez une clé d’appareil persistante dans la configuration de l’adaptateur Paperclip au lieu de générer une nouvelle identité éphémère à chaque exécution :

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

Si l’approbation échoue toujours, exécutez d’abord `openclaw devices list` pour confirmer qu’une demande en attente existe.

### `openclaw devices reject <requestId>`

Rejeter une demande d’association d’appareil en attente.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Faire tourner un jeton d’appareil pour un rôle spécifique (avec mise à jour optionnelle des portées).
Le rôle cible doit déjà exister dans le contrat d’association approuvé de cet appareil ;
la rotation ne peut pas émettre un nouveau rôle non approuvé.
Si vous omettez `--scope`, les reconnexions ultérieures avec le jeton tourné stocké réutilisent les
portées approuvées mises en cache de ce jeton. Si vous passez des valeurs `--scope` explicites, celles-ci
deviennent l’ensemble de portées stocké pour les futures reconnexions avec jeton mis en cache.
Les appelants non administrateurs utilisant un appareil associé peuvent faire tourner uniquement le jeton de **leur propre** appareil.
L’ensemble de portées du jeton cible doit rester dans les propres portées opérateur de la session
de l’appelant ; la rotation ne peut pas émettre ni préserver un jeton opérateur plus large que celui
dont dispose déjà l’appelant.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Renvoie les métadonnées de rotation au format JSON. Si l’appelant fait tourner son propre jeton alors qu’il est
authentifié avec ce jeton d’appareil, la réponse inclut également le jeton de remplacement
afin que le client puisse le conserver avant de se reconnecter. Les rotations partagées/administrateur
ne renvoient pas le jeton porteur.

### `openclaw devices revoke --device <id> --role <role>`

Révoquer un jeton d’appareil pour un rôle spécifique.

Les appelants non administrateurs utilisant un appareil associé peuvent révoquer uniquement le jeton de **leur propre** appareil.
La révocation du jeton d’un autre appareil nécessite `operator.admin`.
L’ensemble de portées du jeton cible doit également tenir dans les propres portées
opérateur de la session de l’appelant ; les appelants disposant uniquement de l’association ne peuvent pas révoquer des jetons opérateur admin/écriture.

```
openclaw devices revoke --device <deviceId> --role node
```

Renvoie le résultat de révocation au format JSON.

## Options communes

- `--url <url>` : URL WebSocket du Gateway (par défaut `gateway.remote.url` lorsqu’elle est configurée).
- `--token <token>` : jeton du Gateway (si requis).
- `--password <password>` : mot de passe du Gateway (authentification par mot de passe).
- `--timeout <ms>` : délai d’expiration RPC.
- `--json` : sortie JSON (recommandé pour les scripts).

<Warning>
Lorsque vous définissez `--url`, la CLI ne se rabat pas sur les identifiants de configuration ou d’environnement. Passez `--token` ou `--password` explicitement. L’absence d’identifiants explicites est une erreur.
</Warning>

## Notes

- La rotation de jeton renvoie un nouveau jeton (sensible). Traitez-le comme un secret.
- Ces commandes nécessitent la portée `operator.pairing` (ou `operator.admin`). Certaines
  approbations exigent aussi que l’appelant détienne les portées opérateur que l’appareil cible
  émettrait ou hériterait. Les rôles d’appareil non opérateur nécessitent
  `operator.admin` ; consultez [Portées opérateur](/fr/gateway/operator-scopes).
- `gateway.nodes.pairing.autoApproveCidrs` est une politique Gateway opt-in réservée
  à l’association de nouveaux appareils nœuds ; elle ne change pas l’autorité d’approbation de la CLI.
- La rotation et la révocation de jetons restent dans l’ensemble de rôles d’association approuvé et
  la base de portées approuvée pour cet appareil. Une entrée de jeton mise en cache isolée ne
  confère pas une cible de gestion de jetons.
- Pour les sessions avec jeton d’appareil associé, la gestion inter-appareils est réservée aux administrateurs :
  `remove`, `rotate` et `revoke` sont limités à soi-même sauf si l’appelant possède
  `operator.admin`.
- La mutation de jeton est également limitée par la portée de l’appelant : une session disposant uniquement
  de l’association ne peut pas faire tourner ni révoquer un jeton qui porte actuellement `operator.admin` ou
  `operator.write`.
- `devices clear` est intentionnellement protégé par `--yes`.
- Si la portée d’association est indisponible sur local loopback (et qu’aucun `--url` explicite n’est passé), list/approve peut utiliser un repli d’association local.
- `devices approve` nécessite un ID de demande explicite avant d’émettre des jetons ; omettre `requestId` ou passer `--latest` ne fait que prévisualiser la demande en attente la plus récente.

## Liste de récupération en cas de dérive de jeton

Utilisez ceci lorsque Control UI ou d’autres clients continuent d’échouer avec `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` ou `AUTH_SCOPE_MISMATCH`.

1. Confirmez la source actuelle du jeton de gateway :

```bash
openclaw config get gateway.auth.token
```

2. Listez les appareils associés et identifiez l’ID de l’appareil concerné :

```bash
openclaw devices list
```

3. Faites tourner le jeton opérateur pour l’appareil concerné :

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Si la rotation ne suffit pas, supprimez l’association obsolète et approuvez à nouveau :

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Réessayez la connexion cliente avec le jeton/mot de passe partagé actuel.

Notes :

- La priorité normale d’authentification à la reconnexion est d’abord le jeton/mot de passe partagé explicite, puis le `deviceToken` explicite, puis le jeton d’appareil stocké, puis le jeton d’amorçage.
- La récupération fiable de `AUTH_TOKEN_MISMATCH` peut temporairement envoyer à la fois le jeton partagé et le jeton d’appareil stocké pour l’unique nouvelle tentative bornée.
- `AUTH_SCOPE_MISMATCH` signifie que le jeton d’appareil a été reconnu mais ne porte pas l’ensemble de portées demandé ; corrigez le contrat d’approbation d’association/de portée avant de modifier l’authentification gateway partagée.

Connexe :

- [Dépannage de l’authentification du tableau de bord](/fr/web/dashboard#if-you-see-unauthorized-1008)
- [Dépannage du Gateway](/fr/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Connexe

- [Référence CLI](/fr/cli)
- [Nœuds](/fr/nodes)
