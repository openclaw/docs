---
read_when:
    - Vous approuvez les demandes d’appairage d’appareils
    - Vous devez renouveler ou révoquer les jetons d’appareil
summary: Référence CLI pour `openclaw devices` (appairage des appareils + rotation/révocation des jetons)
title: Appareils
x-i18n:
    generated_at: "2026-05-03T07:08:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: fa92fd3ffc671c827fa98870bf9df89f3be90adec167fd8ea32698cf2e69991a
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Gérer les demandes d’appairage d’appareil et les jetons limités à un appareil.

## Commandes

### `openclaw devices list`

Lister les demandes d’appairage en attente et les appareils appairés.

```
openclaw devices list
openclaw devices list --json
```

La sortie des demandes en attente affiche l’accès demandé à côté de l’accès actuellement approuvé de l’appareil lorsque celui-ci est déjà appairé. Cela rend les mises à niveau de portée/rôle explicites au lieu de donner l’impression que l’appairage a été perdu.

### `openclaw devices remove <deviceId>`

Supprimer une entrée d’appareil appairé.

Lorsque vous êtes authentifié avec un jeton d’appareil appairé, les appelants non administrateurs peuvent supprimer uniquement l’entrée de **leur propre** appareil. La suppression d’un autre appareil nécessite `operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Effacer en masse les appareils appairés.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Approuver une demande d’appairage d’appareil en attente au moyen du `requestId` exact. Si `requestId` est omis ou si `--latest` est passé, OpenClaw affiche uniquement la demande en attente sélectionnée et quitte ; relancez l’approbation avec l’ID de demande exact après avoir vérifié les détails.

<Note>
Si un appareil réessaie l’appairage avec des détails d’authentification modifiés (rôle, portées ou clé publique), OpenClaw remplace l’entrée en attente précédente et émet un nouveau `requestId`. Exécutez `openclaw devices list` juste avant l’approbation pour utiliser l’ID actuel.
</Note>

Si l’appareil est déjà appairé et demande des portées plus larges ou un rôle plus large, OpenClaw conserve l’approbation existante et crée une nouvelle demande de mise à niveau en attente. Consultez les colonnes `Requested` et `Approved` dans `openclaw devices list`, ou utilisez `openclaw devices approve --latest` pour prévisualiser la mise à niveau exacte avant de l’approuver.

Si le Gateway est explicitement configuré avec `gateway.nodes.pairing.autoApproveCidrs`, les premières demandes `role: node` provenant d’IP clientes correspondantes peuvent être approuvées avant d’apparaître dans cette liste. Cette politique est désactivée par défaut et ne s’applique jamais aux clients opérateur/navigateur ni aux demandes de mise à niveau.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Rejeter une demande d’appairage d’appareil en attente.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Faire tourner un jeton d’appareil pour un rôle précis (avec mise à jour facultative des portées).
Le rôle cible doit déjà exister dans le contrat d’appairage approuvé de cet appareil ; la rotation ne peut pas émettre un nouveau rôle non approuvé.
Si vous omettez `--scope`, les reconnexions ultérieures avec le jeton tourné stocké réutilisent les portées approuvées mises en cache de ce jeton. Si vous passez des valeurs `--scope` explicites, celles-ci deviennent l’ensemble de portées stocké pour les futures reconnexions avec jeton mis en cache.
Les appelants non administrateurs utilisant un appareil appairé peuvent faire tourner uniquement le jeton de **leur propre** appareil.
L’ensemble de portées du jeton cible doit rester dans les propres portées opérateur de la session appelante ; la rotation ne peut pas émettre ni conserver un jeton opérateur plus large que celui dont dispose déjà l’appelant.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Retourne les métadonnées de rotation au format JSON. Si l’appelant fait tourner son propre jeton tout en étant authentifié avec ce jeton d’appareil, la réponse inclut aussi le jeton de remplacement afin que le client puisse le conserver avant de se reconnecter. Les rotations partagées/administrateur ne renvoient pas le jeton porteur.

### `openclaw devices revoke --device <id> --role <role>`

Révoquer un jeton d’appareil pour un rôle précis.

Les appelants non administrateurs utilisant un appareil appairé peuvent révoquer uniquement le jeton de **leur propre** appareil.
La révocation du jeton d’un autre appareil nécessite `operator.admin`.
L’ensemble de portées du jeton cible doit également tenir dans les propres portées opérateur de la session appelante ; les appelants limités à l’appairage ne peuvent pas révoquer des jetons opérateur administrateur/écriture.

```
openclaw devices revoke --device <deviceId> --role node
```

Retourne le résultat de révocation au format JSON.

## Options communes

- `--url <url>` : URL WebSocket du Gateway (utilise par défaut `gateway.remote.url` lorsqu’elle est configurée).
- `--token <token>` : jeton du Gateway (si requis).
- `--password <password>` : mot de passe du Gateway (authentification par mot de passe).
- `--timeout <ms>` : délai d’expiration RPC.
- `--json` : sortie JSON (recommandé pour les scripts).

<Warning>
Lorsque vous définissez `--url`, la CLI ne se rabat pas sur les identifiants de configuration ou d’environnement. Passez explicitement `--token` ou `--password`. L’absence d’identifiants explicites est une erreur.
</Warning>

## Remarques

- La rotation de jeton retourne un nouveau jeton (sensible). Traitez-le comme un secret.
- Ces commandes nécessitent la portée `operator.pairing` (ou `operator.admin`). Certaines approbations exigent également que l’appelant possède les portées opérateur que l’appareil cible émettrait ou hériterait ; consultez [Portées opérateur](/fr/gateway/operator-scopes).
- `gateway.nodes.pairing.autoApproveCidrs` est une politique opt-in du Gateway réservée au premier appairage d’un appareil nœud ; elle ne modifie pas l’autorité d’approbation de la CLI.
- La rotation et la révocation de jeton restent dans l’ensemble de rôles d’appairage approuvé et dans la base de référence de portées approuvée pour cet appareil. Une entrée de jeton mise en cache isolée n’accorde pas de cible de gestion des jetons.
- Pour les sessions avec jeton d’appareil appairé, la gestion inter-appareils est réservée aux administrateurs : `remove`, `rotate` et `revoke` s’appliquent uniquement à soi-même, sauf si l’appelant possède `operator.admin`.
- La mutation de jeton est également limitée par la portée de l’appelant : une session limitée à l’appairage ne peut pas faire tourner ni révoquer un jeton qui porte actuellement `operator.admin` ou `operator.write`.
- `devices clear` est intentionnellement protégé par `--yes`.
- Si la portée d’appairage n’est pas disponible sur local loopback (et qu’aucun `--url` explicite n’est passé), list/approve peut utiliser une solution de repli d’appairage locale.
- `devices approve` nécessite un ID de demande explicite avant d’émettre des jetons ; omettre `requestId` ou passer `--latest` ne fait que prévisualiser la demande en attente la plus récente.

## Liste de vérification pour récupérer après une dérive de jeton

Utilisez ceci lorsque Control UI ou d’autres clients continuent d’échouer avec `AUTH_TOKEN_MISMATCH` ou `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Confirmez la source actuelle du jeton du Gateway :

```bash
openclaw config get gateway.auth.token
```

2. Listez les appareils appairés et identifiez l’ID de l’appareil concerné :

```bash
openclaw devices list
```

3. Faites tourner le jeton opérateur pour l’appareil concerné :

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Si la rotation ne suffit pas, supprimez l’appairage obsolète et approuvez à nouveau :

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Réessayez la connexion client avec le jeton/mot de passe partagé actuel.

Remarques :

- La précédence normale de l’authentification à la reconnexion est d’abord le jeton/mot de passe partagé explicite, puis `deviceToken` explicite, puis le jeton d’appareil stocké, puis le jeton d’amorçage.
- La récupération fiable après `AUTH_TOKEN_MISMATCH` peut temporairement envoyer ensemble le jeton partagé et le jeton d’appareil stocké pour l’unique nouvelle tentative bornée.

Connexe :

- [Dépannage de l’authentification du tableau de bord](/fr/web/dashboard#if-you-see-unauthorized-1008)
- [Dépannage du Gateway](/fr/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Connexe

- [Référence CLI](/fr/cli)
- [Nœuds](/fr/nodes)
