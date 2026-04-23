---
read_when:
    - Vous approuvez des demandes d’association d’appareil
    - Vous devez faire tourner ou révoquer des jetons d’appareil
summary: Référence CLI pour `openclaw devices` (association d’appareil + rotation/révocation de jeton)
title: appareils
x-i18n:
    generated_at: "2026-04-23T07:00:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e58d2dff7fc22a11ff372f4937907977dab0ffa9f971b9c0bffeb3e347caf66
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Gérez les demandes d’association d’appareil et les jetons à portée appareil.

## Commandes

### `openclaw devices list`

Lister les demandes d’association en attente et les appareils associés.

```
openclaw devices list
openclaw devices list --json
```

La sortie des demandes en attente affiche l’accès demandé à côté de l’accès actuellement
approuvé de l’appareil lorsqu’il est déjà associé. Cela rend explicites les
mises à niveau de portée/rôle au lieu de donner l’impression que l’association a été perdue.

### `openclaw devices remove <deviceId>`

Supprimer une entrée d’appareil associé.

Lorsque vous êtes authentifié avec un jeton d’appareil associé, les appelants non administrateurs peuvent
supprimer uniquement **leur propre** entrée d’appareil. La suppression d’un autre appareil nécessite
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
est omis ou si `--latest` est passé, OpenClaw affiche uniquement la demande en attente sélectionnée
et quitte ; relancez l’approbation avec l’ID exact de la demande après avoir vérifié les détails.

Remarque : si l’appareil retente l’association avec des détails d’authentification modifiés (rôle/portées/clé
publique), OpenClaw remplace l’entrée en attente précédente et émet un nouveau
`requestId`. Exécutez `openclaw devices list` juste avant l’approbation pour utiliser l’ID
actuel.

Si l’appareil est déjà associé et demande des portées plus larges ou un rôle plus large,
OpenClaw conserve l’approbation existante en place et crée une nouvelle demande de mise à niveau
en attente. Vérifiez les colonnes `Requested` et `Approved` dans `openclaw devices list`
ou utilisez `openclaw devices approve --latest` pour prévisualiser la mise à niveau exacte avant
de l’approuver.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

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
portées approuvées en cache de ce jeton. Si vous passez des valeurs `--scope` explicites, elles
deviennent l’ensemble de portées stocké pour les futures reconnexions par jeton en cache.
Les appelants non administrateurs sur appareil associé peuvent faire tourner uniquement **leur propre** jeton d’appareil.
De plus, toutes les valeurs `--scope` explicites doivent rester dans les limites des portées
operator de la session appelante elle-même ; la rotation ne peut pas émettre un jeton operator plus large que celui que l’appelant
possède déjà.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Renvoie la nouvelle charge utile du jeton au format JSON.

### `openclaw devices revoke --device <id> --role <role>`

Révoquer un jeton d’appareil pour un rôle spécifique.

Les appelants non administrateurs sur appareil associé peuvent révoquer uniquement **leur propre** jeton d’appareil.
La révocation du jeton d’un autre appareil nécessite `operator.admin`.

```
openclaw devices revoke --device <deviceId> --role node
```

Renvoie le résultat de la révocation au format JSON.

## Options courantes

- `--url <url>` : URL WebSocket de la Gateway (utilise par défaut `gateway.remote.url` lorsqu’elle est configurée).
- `--token <token>` : jeton de la Gateway (si requis).
- `--password <password>` : mot de passe de la Gateway (authentification par mot de passe).
- `--timeout <ms>` : délai d’expiration RPC.
- `--json` : sortie JSON (recommandée pour les scripts).

Remarque : lorsque vous définissez `--url`, la CLI ne se replie pas sur les identifiants de configuration ou d’environnement.
Passez `--token` ou `--password` explicitement. L’absence d’identifiants explicites est une erreur.

## Remarques

- La rotation de jeton renvoie un nouveau jeton (sensible). Traitez-le comme un secret.
- Ces commandes nécessitent la portée `operator.pairing` (ou `operator.admin`).
- La rotation de jeton reste dans l’ensemble de rôles d’association approuvés et la base
  de portées approuvées pour cet appareil. Une entrée de jeton en cache erronée n’accorde pas une nouvelle
  cible de rotation.
- Pour les sessions de jeton d’appareil associé, la gestion inter-appareils est réservée à l’administrateur :
  `remove`, `rotate` et `revoke` sont limités à soi-même sauf si l’appelant possède
  `operator.admin`.
- `devices clear` est intentionnellement protégé par `--yes`.
- Si la portée d’association n’est pas disponible sur local loopback (et qu’aucun `--url` explicite n’est passé), list/approve peut utiliser un repli d’association local.
- `devices approve` nécessite un ID de demande explicite avant d’émettre des jetons ; omettre `requestId` ou passer `--latest` ne fait que prévisualiser la demande en attente la plus récente.

## Liste de vérification pour la récupération en cas de dérive de jeton

Utilisez ceci lorsque Control UI ou d’autres clients continuent d’échouer avec `AUTH_TOKEN_MISMATCH` ou `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Confirmez la source actuelle du jeton de la Gateway :

```bash
openclaw config get gateway.auth.token
```

2. Listez les appareils associés et identifiez l’ID de l’appareil concerné :

```bash
openclaw devices list
```

3. Faites tourner le jeton operator pour l’appareil concerné :

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Si la rotation ne suffit pas, supprimez l’association obsolète et approuvez à nouveau :

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Réessayez la connexion du client avec le jeton/mot de passe partagé actuel.

Remarques :

- L’ordre de priorité normal de l’authentification de reconnexion est d’abord le jeton/mot de passe partagé explicite, puis le `deviceToken` explicite, puis le jeton d’appareil stocké, puis le jeton d’amorçage.
- La récupération fiable de `AUTH_TOKEN_MISMATCH` peut temporairement envoyer ensemble le jeton partagé et le jeton d’appareil stocké pour l’unique tentative de reprise bornée.

Connexe :

- [Dépannage de l’authentification du tableau de bord](/fr/web/dashboard#if-you-see-unauthorized-1008)
- [Dépannage de la Gateway](/fr/gateway/troubleshooting#dashboard-control-ui-connectivity)
