---
read_when:
    - Vous approuvez des demandes d’appairage d’appareil
    - Vous devez faire tourner ou révoquer des jetons d’appareil
summary: Référence CLI pour `openclaw devices` (appairage d’appareil + rotation/révocation de jeton)
title: Appareils
x-i18n:
    generated_at: "2026-04-26T11:25:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5746de715f9c1a46b5d0845918c1512723cfed22b711711b8c6dc6e98880f480
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Gérez les demandes d’appairage d’appareil et les jetons limités à un appareil.

## Commandes

### `openclaw devices list`

Liste les demandes d’appairage en attente et les appareils appairés.

```
openclaw devices list
openclaw devices list --json
```

La sortie des demandes en attente affiche l’accès demandé à côté de l’accès actuellement approuvé de l’appareil lorsque celui-ci est déjà appairé. Cela rend explicites les mises à niveau de portée/rôle, au lieu de donner l’impression que l’appairage a été perdu.

### `openclaw devices remove <deviceId>`

Supprime une entrée d’appareil appairé.

Lorsque vous êtes authentifié avec un jeton d’appareil appairé, les appelants non administrateurs ne peuvent supprimer que l’entrée de **leur propre** appareil. La suppression d’un autre appareil nécessite `operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Efface en masse les appareils appairés.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Approuve une demande d’appairage d’appareil en attente via le `requestId` exact. Si `requestId` est omis ou si `--latest` est passé, OpenClaw affiche uniquement la demande en attente sélectionnée puis quitte ; relancez l’approbation avec l’ID exact de la demande après avoir vérifié les détails.

Remarque : si un appareil réessaie l’appairage avec des détails d’authentification modifiés (rôle/portées/clé publique), OpenClaw remplace l’entrée en attente précédente et émet un nouveau `requestId`. Exécutez `openclaw devices list` juste avant l’approbation pour utiliser l’ID actuel.

Si l’appareil est déjà appairé et demande des portées plus larges ou un rôle plus large, OpenClaw conserve l’approbation existante et crée une nouvelle demande de mise à niveau en attente. Examinez les colonnes `Requested` et `Approved` dans `openclaw devices list` ou utilisez `openclaw devices approve --latest` pour prévisualiser la mise à niveau exacte avant de l’approuver.

Si la Gateway est explicitement configurée avec `gateway.nodes.pairing.autoApproveCidrs`, les premières demandes `role: node` provenant d’IP client correspondantes peuvent être approuvées avant d’apparaître dans cette liste. Cette politique est désactivée par défaut et ne s’applique jamais aux clients operator/browser ni aux demandes de mise à niveau.

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

Fait tourner un jeton d’appareil pour un rôle spécifique (avec mise à jour facultative des portées).
Le rôle cible doit déjà exister dans le contrat d’appairage approuvé de cet appareil ; la rotation ne peut pas créer un nouveau rôle non approuvé.
Si vous omettez `--scope`, les reconnexions ultérieures avec le jeton tourné stocké réutilisent les portées approuvées mises en cache de ce jeton. Si vous fournissez des valeurs `--scope` explicites, elles deviennent l’ensemble de portées stocké pour les futures reconnexions avec jeton mis en cache.
Les appelants non administrateurs avec appareil appairé ne peuvent faire tourner que le jeton de **leur propre** appareil.
L’ensemble de portées du jeton cible doit rester dans les limites des propres portées operator de la session appelante ; la rotation ne peut pas créer ni conserver un jeton operator plus large que celui dont dispose déjà l’appelant.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Renvoie la nouvelle charge utile du jeton au format JSON.

### `openclaw devices revoke --device <id> --role <role>`

Révoque un jeton d’appareil pour un rôle spécifique.

Les appelants non administrateurs avec appareil appairé ne peuvent révoquer que le jeton de **leur propre** appareil.
La révocation du jeton d’un autre appareil nécessite `operator.admin`.
L’ensemble de portées du jeton cible doit également tenir dans les propres portées operator de la session appelante ; les appelants limités à l’appairage ne peuvent pas révoquer des jetons operator admin/write.

```
openclaw devices revoke --device <deviceId> --role node
```

Renvoie le résultat de la révocation au format JSON.

## Options courantes

- `--url <url>` : URL WebSocket de la Gateway (par défaut : `gateway.remote.url` lorsqu’elle est configurée).
- `--token <token>` : jeton Gateway (si nécessaire).
- `--password <password>` : mot de passe Gateway (authentification par mot de passe).
- `--timeout <ms>` : délai d’expiration RPC.
- `--json` : sortie JSON (recommandée pour les scripts).

Remarque : lorsque vous définissez `--url`, la CLI ne revient pas aux identifiants de configuration ou d’environnement.
Passez explicitement `--token` ou `--password`. L’absence d’identifiants explicites est une erreur.

## Remarques

- La rotation du jeton renvoie un nouveau jeton (sensible). Traitez-le comme un secret.
- Ces commandes nécessitent la portée `operator.pairing` (ou `operator.admin`).
- `gateway.nodes.pairing.autoApproveCidrs` est une politique Gateway opt-in pour l’appairage initial d’appareil node uniquement ; cela ne modifie pas l’autorité d’approbation de la CLI.
- La rotation et la révocation des jetons restent dans l’ensemble de rôles d’appairage approuvé et dans la base de référence des portées approuvées pour cet appareil. Une entrée de jeton mise en cache parasite n’accorde pas de cible de gestion de jeton.
- Pour les sessions avec jeton d’appareil appairé, la gestion inter-appareils est réservée à l’administration : `remove`, `rotate` et `revoke` sont limités à l’appareil propre sauf si l’appelant dispose de `operator.admin`.
- La mutation des jetons est également contenue dans les portées de l’appelant : une session limitée à l’appairage ne peut pas faire tourner ni révoquer un jeton qui porte actuellement `operator.admin` ou `operator.write`.
- `devices clear` est intentionnellement protégé par `--yes`.
- Si la portée d’appairage n’est pas disponible sur local loopback (et qu’aucun `--url` explicite n’est passé), list/approve peut utiliser un mécanisme local de repli pour l’appairage.
- `devices approve` nécessite un ID de demande explicite avant de créer des jetons ; omettre `requestId` ou passer `--latest` ne fait que prévisualiser la demande en attente la plus récente.

## Liste de contrôle de récupération en cas de dérive de jeton

Utilisez ceci lorsque Control UI ou d’autres clients continuent d’échouer avec `AUTH_TOKEN_MISMATCH` ou `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Confirmez la source actuelle du jeton Gateway :

```bash
openclaw config get gateway.auth.token
```

2. Listez les appareils appairés et identifiez l’ID de l’appareil concerné :

```bash
openclaw devices list
```

3. Faites tourner le jeton operator pour l’appareil concerné :

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Si la rotation ne suffit pas, supprimez l’appairage obsolète et approuvez à nouveau :

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Réessayez la connexion du client avec le jeton/mot de passe partagé actuel.

Remarques :

- L’ordre de priorité normal pour l’authentification à la reconnexion est : jeton/mot de passe partagé explicite d’abord, puis `deviceToken` explicite, puis jeton d’appareil stocké, puis jeton bootstrap.
- La récupération fiable de `AUTH_TOKEN_MISMATCH` peut temporairement envoyer à la fois le jeton partagé et le jeton d’appareil stocké ensemble pour cette unique nouvelle tentative bornée.

Documentation associée :

- [Dépannage de l’authentification du Dashboard](/fr/web/dashboard#if-you-see-unauthorized-1008)
- [Dépannage de la Gateway](/fr/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Connexe

- [Référence CLI](/fr/cli)
- [Nodes](/fr/nodes)
