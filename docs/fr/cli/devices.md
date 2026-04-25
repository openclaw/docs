---
read_when:
    - Vous approuvez des demandes d’appairage d’appareil
    - Vous devez faire tourner ou révoquer des jetons d’appareil
summary: Référence CLI pour `openclaw devices` (appairage d’appareil + rotation/révocation de jeton)
title: Appareils
x-i18n:
    generated_at: "2026-04-25T13:43:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 168afa3c784565c09ebdac854acc33cb7c0cacf4eba6a1a038c88c96af3c1430
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Gérez les demandes d’appairage d’appareil et les jetons à portée d’appareil.

## Commandes

### `openclaw devices list`

Liste les demandes d’appairage en attente et les appareils appairés.

```
openclaw devices list
openclaw devices list --json
```

La sortie des demandes en attente affiche l’accès demandé à côté de l’accès actuellement approuvé pour l’appareil lorsqu’il est déjà appairé. Cela rend explicites les mises à niveau de portée/rôle au lieu de donner l’impression que l’appairage a été perdu.

### `openclaw devices remove <deviceId>`

Supprime une entrée d’appareil appairé.

Lorsque vous êtes authentifié avec un jeton d’appareil appairé, les appelants non administrateurs peuvent supprimer uniquement **leur propre** entrée d’appareil. La suppression de l’appareil d’un autre nécessite `operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Efface les appareils appairés en masse.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Approuve une demande d’appairage d’appareil en attente par `requestId` exact. Si `requestId` est omis ou si `--latest` est passé, OpenClaw affiche seulement la demande en attente sélectionnée puis quitte ; relancez l’approbation avec l’identifiant exact de la demande après avoir vérifié les détails.

Remarque : si un appareil retente l’appairage avec des détails d’authentification modifiés (rôle/portées/clé publique), OpenClaw remplace l’entrée en attente précédente et émet un nouveau `requestId`. Exécutez `openclaw devices list` juste avant l’approbation pour utiliser l’identifiant actuel.

Si l’appareil est déjà appairé et demande des portées plus larges ou un rôle plus large, OpenClaw conserve l’approbation existante en place et crée une nouvelle demande de mise à niveau en attente. Vérifiez les colonnes `Requested` et `Approved` dans `openclaw devices list` ou utilisez `openclaw devices approve --latest` pour prévisualiser la mise à niveau exacte avant de l’approuver.

Si la Gateway est explicitement configurée avec `gateway.nodes.pairing.autoApproveCidrs`, les demandes initiales `role: node` provenant d’adresses IP clientes correspondantes peuvent être approuvées avant d’apparaître dans cette liste. Cette politique est désactivée par défaut et ne s’applique jamais aux clients opérateur/navigateur ni aux demandes de mise à niveau.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Rejette une demande d’appairage d’appareil en attente.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Fait tourner un jeton d’appareil pour un rôle spécifique, avec mise à jour facultative des portées.
Le rôle cible doit déjà exister dans le contrat d’appairage approuvé de cet appareil ; la rotation ne peut pas générer un nouveau rôle non approuvé.
Si vous omettez `--scope`, les reconnexions ultérieures avec le jeton tourné stocké réutilisent les portées approuvées mises en cache de ce jeton. Si vous passez des valeurs `--scope` explicites, elles deviennent l’ensemble de portées stocké pour les futures reconnexions avec jeton mis en cache.
Les appelants non administrateurs avec appareil appairé peuvent faire tourner uniquement **leur propre** jeton d’appareil.
De plus, toutes les valeurs `--scope` explicites doivent rester dans les portées opérateur propres à la session de l’appelant ; la rotation ne peut pas générer un jeton opérateur plus large que celui dont l’appelant dispose déjà.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Renvoie la charge utile du nouveau jeton au format JSON.

### `openclaw devices revoke --device <id> --role <role>`

Révoque un jeton d’appareil pour un rôle spécifique.

Les appelants non administrateurs avec appareil appairé peuvent révoquer uniquement **leur propre** jeton d’appareil.
La révocation du jeton d’un autre appareil nécessite `operator.admin`.

```
openclaw devices revoke --device <deviceId> --role node
```

Renvoie le résultat de la révocation au format JSON.

## Options courantes

- `--url <url>` : URL WebSocket de la Gateway (utilise par défaut `gateway.remote.url` lorsqu’elle est configurée).
- `--token <token>` : jeton de Gateway (si nécessaire).
- `--password <password>` : mot de passe de Gateway (authentification par mot de passe).
- `--timeout <ms>` : délai d’expiration RPC.
- `--json` : sortie JSON (recommandée pour les scripts).

Remarque : lorsque vous définissez `--url`, la CLI ne se rabat pas sur les identifiants provenant de la config ou de l’environnement.
Passez `--token` ou `--password` explicitement. L’absence d’identifiants explicites est une erreur.

## Remarques

- La rotation de jeton renvoie un nouveau jeton (sensible). Traitez-le comme un secret.
- Ces commandes nécessitent la portée `operator.pairing` (ou `operator.admin`).
- `gateway.nodes.pairing.autoApproveCidrs` est une politique optionnelle de Gateway pour l’appairage initial des appareils Node uniquement ; elle ne modifie pas l’autorité d’approbation de la CLI.
- La rotation de jeton reste dans l’ensemble de rôles d’appairage approuvés et dans la base de portées approuvées pour cet appareil. Une entrée de jeton mise en cache parasite n’accorde pas une nouvelle cible de rotation.
- Pour les sessions de jeton d’appareil appairé, la gestion inter-appareils est réservée aux administrateurs : `remove`, `rotate` et `revoke` sont limités à soi-même sauf si l’appelant dispose de `operator.admin`.
- `devices clear` est intentionnellement protégé par `--yes`.
- Si la portée d’appairage n’est pas disponible sur local loopback (et qu’aucun `--url` explicite n’est passé), list/approve peut utiliser un mécanisme local de secours pour l’appairage.
- `devices approve` nécessite un identifiant de demande explicite avant de générer des jetons ; omettre `requestId` ou passer `--latest` ne fait que prévisualiser la plus récente demande en attente.

## Liste de contrôle de récupération après dérive de jeton

Utilisez ceci lorsque Control UI ou d’autres clients continuent d’échouer avec `AUTH_TOKEN_MISMATCH` ou `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Confirmez la source actuelle du jeton de Gateway :

```bash
openclaw config get gateway.auth.token
```

2. Listez les appareils appairés et identifiez l’identifiant de l’appareil concerné :

```bash
openclaw devices list
```

3. Faites tourner le jeton opérateur pour l’appareil concerné :

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Si la rotation ne suffit pas, supprimez l’appairage obsolète et approuvez de nouveau :

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Réessayez la connexion du client avec le jeton partagé/mot de passe actuel.

Remarques :

- L’ordre de priorité normal de l’authentification à la reconnexion est : jeton partagé/mot de passe explicite d’abord, puis `deviceToken` explicite, puis jeton d’appareil stocké, puis jeton de bootstrap.
- La récupération approuvée de `AUTH_TOKEN_MISMATCH` peut temporairement envoyer à la fois le jeton partagé et le jeton d’appareil stocké ensemble pour cette unique nouvelle tentative bornée.

Lié :

- [Dépannage de l’authentification du tableau de bord](/fr/web/dashboard#if-you-see-unauthorized-1008)
- [Dépannage de la Gateway](/fr/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Lié

- [Référence CLI](/fr/cli)
- [Nodes](/fr/nodes)
