---
read_when:
    - Vous approuvez des demandes d’appairage d’appareils
    - Vous devez procéder à la rotation ou à la révocation des jetons d’appareil
summary: Référence CLI pour `openclaw devices` (appairage d’appareil + rotation/révocation de jetons)
title: Appareils
x-i18n:
    generated_at: "2026-04-30T07:17:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: df105135a12ec733e45a67792e8447628f1538fc2536a008d615d46d1eaff5c8
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

La sortie des demandes en attente affiche l’accès demandé à côté de l’accès
actuellement approuvé de l’appareil lorsque celui-ci est déjà associé. Cela rend
les élargissements de portée/rôle explicites au lieu de donner l’impression que
l’association a été perdue.

### `openclaw devices remove <deviceId>`

Supprimer une entrée d’appareil associé.

Lorsque vous êtes authentifié avec un jeton d’appareil associé, les appelants
non administrateurs peuvent supprimer uniquement **leur propre** entrée
d’appareil. Supprimer un autre appareil nécessite `operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Effacer les appareils associés en bloc.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Approuver une demande d’association d’appareil en attente par `requestId` exact.
Si `requestId` est omis ou si `--latest` est passé, OpenClaw affiche uniquement
la demande en attente sélectionnée puis se termine ; relancez l’approbation avec
l’identifiant exact de la demande après en avoir vérifié les détails.

<Note>
Si un appareil retente l’association avec des détails d’authentification modifiés (rôle, portées ou clé publique), OpenClaw remplace l’entrée en attente précédente et émet un nouveau `requestId`. Exécutez `openclaw devices list` juste avant l’approbation pour utiliser l’identifiant actuel.
</Note>

Si l’appareil est déjà associé et demande des portées plus larges ou un rôle plus
large, OpenClaw conserve l’approbation existante et crée une nouvelle demande de
mise à niveau en attente. Examinez les colonnes `Requested` et `Approved` dans
`openclaw devices list` ou utilisez `openclaw devices approve --latest` pour
prévisualiser la mise à niveau exacte avant de l’approuver.

Si le Gateway est explicitement configuré avec
`gateway.nodes.pairing.autoApproveCidrs`, les premières demandes `role: node`
provenant d’IP clientes correspondantes peuvent être approuvées avant
d’apparaître dans cette liste. Cette politique est désactivée par défaut et ne
s’applique jamais aux clients opérateur/navigateur ni aux demandes de mise à
niveau.

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

Faire tourner un jeton d’appareil pour un rôle spécifique (avec mise à jour
facultative des portées). Le rôle cible doit déjà exister dans le contrat
d’association approuvé de cet appareil ; la rotation ne peut pas créer un nouveau
rôle non approuvé.
Si vous omettez `--scope`, les reconnexions ultérieures avec le jeton tourné
stocké réutilisent les portées approuvées mises en cache pour ce jeton. Si vous
passez des valeurs `--scope` explicites, celles-ci deviennent l’ensemble de
portées stocké pour les futures reconnexions avec jeton mis en cache.
Les appelants non administrateurs utilisant un appareil associé peuvent faire
tourner uniquement leur **propre** jeton d’appareil. L’ensemble de portées du
jeton cible doit rester dans les portées opérateur propres à la session de
l’appelant ; la rotation ne peut pas créer ni conserver un jeton opérateur plus
large que celui dont dispose déjà l’appelant.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Renvoie les métadonnées de rotation au format JSON. Si l’appelant fait tourner
son propre jeton alors qu’il est authentifié avec ce jeton d’appareil, la réponse
inclut également le jeton de remplacement afin que le client puisse le conserver
avant de se reconnecter. Les rotations partagées/administrateur ne renvoient pas
le jeton porteur.

### `openclaw devices revoke --device <id> --role <role>`

Révoquer un jeton d’appareil pour un rôle spécifique.

Les appelants non administrateurs utilisant un appareil associé peuvent révoquer
uniquement leur **propre** jeton d’appareil. Révoquer le jeton d’un autre
appareil nécessite `operator.admin`.
L’ensemble de portées du jeton cible doit également tenir dans les portées
opérateur propres à la session de l’appelant ; les appelants limités à
l’association ne peuvent pas révoquer des jetons opérateur administrateur/écriture.

```
openclaw devices revoke --device <deviceId> --role node
```

Renvoie le résultat de la révocation au format JSON.

## Options communes

- `--url <url>` : URL WebSocket du Gateway (par défaut `gateway.remote.url` lorsque configuré).
- `--token <token>` : jeton du Gateway (si requis).
- `--password <password>` : mot de passe du Gateway (authentification par mot de passe).
- `--timeout <ms>` : délai d’expiration RPC.
- `--json` : sortie JSON (recommandé pour les scripts).

<Warning>
Lorsque vous définissez `--url`, la CLI ne se rabat pas sur les identifiants de configuration ou d’environnement. Passez explicitement `--token` ou `--password`. L’absence d’identifiants explicites est une erreur.
</Warning>

## Notes

- La rotation de jeton renvoie un nouveau jeton (sensible). Traitez-le comme un secret.
- Ces commandes nécessitent la portée `operator.pairing` (ou `operator.admin`).
- `gateway.nodes.pairing.autoApproveCidrs` est une politique Gateway opt-in pour
  la seule association de nouveaux appareils nœuds ; elle ne modifie pas
  l’autorité d’approbation de la CLI.
- La rotation et la révocation de jetons restent dans l’ensemble de rôles
  d’association approuvé et la base de référence de portées approuvée pour cet
  appareil. Une entrée de jeton mise en cache isolée n’accorde pas de cible de
  gestion de jetons.
- Pour les sessions avec jeton d’appareil associé, la gestion entre appareils est
  réservée aux administrateurs : `remove`, `rotate` et `revoke` sont limités à
  soi-même sauf si l’appelant possède `operator.admin`.
- La mutation de jeton est également limitée par les portées de l’appelant : une
  session limitée à l’association ne peut pas faire tourner ni révoquer un jeton
  qui porte actuellement `operator.admin` ou `operator.write`.
- `devices clear` est volontairement protégé par `--yes`.
- Si la portée d’association est indisponible sur local loopback (et qu’aucun `--url` explicite n’est passé), la liste/l’approbation peut utiliser un repli d’association local.
- `devices approve` nécessite un identifiant de demande explicite avant de créer des jetons ; omettre `requestId` ou passer `--latest` ne fait que prévisualiser la demande en attente la plus récente.

## Liste de contrôle de récupération en cas de dérive des jetons

Utilisez ceci lorsque l’IU de contrôle ou d’autres clients continuent d’échouer
avec `AUTH_TOKEN_MISMATCH` ou `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Confirmez la source actuelle du jeton du Gateway :

```bash
openclaw config get gateway.auth.token
```

2. Listez les appareils associés et identifiez l’identifiant de l’appareil affecté :

```bash
openclaw devices list
```

3. Faites tourner le jeton opérateur pour l’appareil affecté :

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

Notes :

- La priorité d’authentification de reconnexion normale est d’abord le jeton/mot de passe partagé explicite, puis le `deviceToken` explicite, puis le jeton d’appareil stocké, puis le jeton d’amorçage.
- La récupération fiable après `AUTH_TOKEN_MISMATCH` peut temporairement envoyer à la fois le jeton partagé et le jeton d’appareil stocké pour la seule tentative limitée.

Connexe :

- [Dépannage de l’authentification du tableau de bord](/fr/web/dashboard#if-you-see-unauthorized-1008)
- [Dépannage du Gateway](/fr/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Connexe

- [Référence CLI](/fr/cli)
- [Nœuds](/fr/nodes)
