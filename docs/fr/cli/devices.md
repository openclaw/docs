---
read_when:
    - Vous approuvez les demandes d’appairage d’appareils
    - Vous devez renouveler ou révoquer les jetons d’appareil
summary: Référence CLI pour `openclaw devices` (association d’appareil + rotation/révocation des jetons)
title: Appareils
x-i18n:
    generated_at: "2026-05-11T20:26:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: b38caf47697d5fd6c630285c53919f3a5eaf704b1992e57adb1902e20e2a0fc0
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Gérer les demandes d’association d’appareils et les tokens à portée d’appareil.

## Commandes

### `openclaw devices list`

Lister les demandes d’association en attente et les appareils associés.

```
openclaw devices list
openclaw devices list --json
```

La sortie des demandes en attente affiche l’accès demandé à côté de l’accès
actuellement approuvé de l’appareil lorsque celui-ci est déjà associé. Cela rend
les montées de portée/rôle explicites au lieu de donner l’impression que
l’association a été perdue.

### `openclaw devices remove <deviceId>`

Supprimer une entrée d’appareil associé.

Lorsque vous êtes authentifié avec un token d’appareil associé, les appelants
non administrateurs ne peuvent supprimer que l’entrée de **leur propre**
appareil. La suppression d’un autre appareil nécessite `operator.admin`.

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

Approuver une demande d’association d’appareil en attente par `requestId` exact.
Si `requestId` est omis ou si `--latest` est passé, OpenClaw affiche seulement
la demande en attente sélectionnée puis quitte ; relancez l’approbation avec
l’ID de demande exact après avoir vérifié les détails.

<Note>
Si un appareil retente l’association avec des détails d’authentification modifiés (rôle, portées ou clé publique), OpenClaw remplace l’entrée en attente précédente et émet un nouveau `requestId`. Exécutez `openclaw devices list` juste avant l’approbation pour utiliser l’ID actuel.
</Note>

Si l’appareil est déjà associé et demande des portées plus larges ou un rôle
plus large, OpenClaw conserve l’approbation existante et crée une nouvelle
demande de mise à niveau en attente. Examinez les colonnes `Requested` et
`Approved` dans `openclaw devices list` ou utilisez `openclaw devices approve --latest`
pour prévisualiser la mise à niveau exacte avant de l’approuver.

Si le Gateway est explicitement configuré avec
`gateway.nodes.pairing.autoApproveCidrs`, les premières demandes `role: node`
provenant d’IP clientes correspondantes peuvent être approuvées avant
d’apparaître dans cette liste. Cette stratégie est désactivée par défaut et ne
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

Faire tourner un token d’appareil pour un rôle spécifique (avec mise à jour
optionnelle des portées). Le rôle cible doit déjà exister dans le contrat
d’association approuvé de cet appareil ; la rotation ne peut pas créer un
nouveau rôle non approuvé. Si vous omettez `--scope`, les reconnexions
ultérieures avec le token tourné stocké réutilisent les portées approuvées
mises en cache pour ce token. Si vous passez des valeurs `--scope` explicites,
elles deviennent l’ensemble de portées stocké pour les futures reconnexions
avec token mis en cache. Les appelants non administrateurs utilisant un appareil
associé ne peuvent faire tourner que le token de **leur propre** appareil.
L’ensemble de portées du token cible doit rester dans les propres portées
opérateur de la session appelante ; la rotation ne peut pas créer ni préserver
un token opérateur plus large que celui dont l’appelant dispose déjà.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Retourne les métadonnées de rotation en JSON. Si l’appelant fait tourner son
propre token alors qu’il est authentifié avec ce token d’appareil, la réponse
inclut aussi le token de remplacement afin que le client puisse le persister
avant de se reconnecter. Les rotations partagées/admin ne renvoient pas le
token porteur.

### `openclaw devices revoke --device <id> --role <role>`

Révoquer un token d’appareil pour un rôle spécifique.

Les appelants non administrateurs utilisant un appareil associé ne peuvent
révoquer que le token de **leur propre** appareil. La révocation du token d’un
autre appareil nécessite `operator.admin`. L’ensemble de portées du token cible
doit aussi tenir dans les propres portées opérateur de la session appelante ;
les appelants limités à l’association ne peuvent pas révoquer des tokens
opérateur admin/écriture.

```
openclaw devices revoke --device <deviceId> --role node
```

Retourne le résultat de révocation en JSON.

## Options courantes

- `--url <url>` : URL WebSocket du Gateway (par défaut `gateway.remote.url` lorsque configuré).
- `--token <token>` : token du Gateway (si requis).
- `--password <password>` : mot de passe du Gateway (authentification par mot de passe).
- `--timeout <ms>` : délai d’expiration RPC.
- `--json` : sortie JSON (recommandée pour les scripts).

<Warning>
Lorsque vous définissez `--url`, la CLI ne se rabat pas sur les identifiants de configuration ou d’environnement. Passez `--token` ou `--password` explicitement. L’absence d’identifiants explicites est une erreur.
</Warning>

## Notes

- La rotation de token retourne un nouveau token (sensible). Traitez-le comme un secret.
- Ces commandes nécessitent la portée `operator.pairing` (ou `operator.admin`).
  Certaines approbations exigent aussi que l’appelant détienne les portées
  opérateur que l’appareil cible créerait ou hériterait ; consultez
  [Portées opérateur](/fr/gateway/operator-scopes).
- `gateway.nodes.pairing.autoApproveCidrs` est une stratégie Gateway à activer
  explicitement pour la seule association de nouveaux appareils node ; elle ne
  modifie pas l’autorité d’approbation de la CLI.
- La rotation et la révocation de tokens restent dans l’ensemble de rôles
  d’association approuvé et dans la base de portées approuvée pour cet appareil.
  Une entrée de token mise en cache isolée n’accorde pas de cible de gestion de
  tokens.
- Pour les sessions avec token d’appareil associé, la gestion entre appareils
  est réservée aux administrateurs : `remove`, `rotate` et `revoke` sont limités
  à soi-même sauf si l’appelant dispose de `operator.admin`.
- La mutation de token est également contenue par les portées de l’appelant :
  une session limitée à l’association ne peut pas faire tourner ni révoquer un
  token qui porte actuellement `operator.admin` ou `operator.write`.
- `devices clear` est volontairement protégé par `--yes`.
- Si la portée d’association est indisponible sur local loopback (et qu’aucun
  `--url` explicite n’est passé), list/approve peut utiliser un repli
  d’association local.
- `devices approve` nécessite un ID de demande explicite avant de créer des
  tokens ; omettre `requestId` ou passer `--latest` ne fait que prévisualiser la
  demande en attente la plus récente.

## Liste de contrôle de récupération après dérive de token

Utilisez ceci lorsque l’interface de contrôle ou d’autres clients échouent
sans cesse avec `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` ou
`AUTH_SCOPE_MISMATCH`.

1. Confirmer la source actuelle du token Gateway :

```bash
openclaw config get gateway.auth.token
```

2. Lister les appareils associés et identifier l’ID de l’appareil affecté :

```bash
openclaw devices list
```

3. Faire tourner le token opérateur pour l’appareil affecté :

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Si la rotation ne suffit pas, supprimer l’association obsolète et approuver à nouveau :

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Réessayer la connexion client avec le token/mot de passe partagé actuel.

Notes :

- La précédence d’authentification de reconnexion normale est d’abord le
  token/mot de passe partagé explicite, puis `deviceToken` explicite, puis le
  token d’appareil stocké, puis le token d’amorçage.
- La récupération `AUTH_TOKEN_MISMATCH` de confiance peut temporairement envoyer
  ensemble le token partagé et le token d’appareil stocké pour l’unique nouvelle
  tentative bornée.
- `AUTH_SCOPE_MISMATCH` signifie que le token d’appareil a été reconnu, mais
  qu’il ne porte pas l’ensemble de portées demandé ; corrigez le contrat
  d’association/d’approbation de portée avant de modifier l’authentification
  Gateway partagée.

Connexe :

- [Dépannage de l’authentification du tableau de bord](/fr/web/dashboard#if-you-see-unauthorized-1008)
- [Dépannage du Gateway](/fr/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Connexe

- [Référence CLI](/fr/cli)
- [Nœuds](/fr/nodes)
