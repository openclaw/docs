---
read_when:
    - Vous approuvez les demandes d’association d’appareils
    - Vous devez renouveler ou révoquer les jetons d’appareil
summary: Référence de la CLI pour `openclaw devices` (appairage des appareils + rotation/révocation des jetons)
title: Appareils
x-i18n:
    generated_at: "2026-07-12T02:25:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fb10f7a484fec06bfa5e53ae50181b12a9724746176bbace330ec468235494
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Gérez les demandes d'appairage d'appareils et les jetons propres aux appareils.

## Options courantes

- `--url <url>` : URL WebSocket du Gateway (utilise par défaut `gateway.remote.url` lorsqu'elle est configurée)
- `--token <token>` : jeton du Gateway (si requis)
- `--password <password>` : mot de passe du Gateway (authentification par mot de passe)
- `--timeout <ms>` : délai d'expiration RPC
- `--json` : sortie JSON (recommandée pour les scripts)

<Warning>
Lorsque vous définissez `--url`, la CLI ne se rabat pas sur les identifiants de la configuration ou de l'environnement. Transmettez explicitement `--token` ou `--password`, sinon la commande échoue.
</Warning>

## Commandes

### `openclaw devices list`

Répertorie les demandes d'appairage en attente et les appareils appairés.

```bash
openclaw devices list
openclaw devices list --json
```

Pour une demande en attente concernant un appareil déjà appairé, la sortie affiche les accès demandés à côté des accès actuellement approuvés de l'appareil, afin que les extensions de portée ou de rôle soient visibles au lieu de sembler correspondre à un appairage perdu.

Les noms d'affichage des appareils appairés suivent cet ordre de priorité : libellé de l'opérateur (`operatorLabel` provenant de `devices rename`), puis `displayName` du client, puis `clientId`, puis `deviceId`.

### `openclaw devices approve [requestId] [--latest]`

Approuve une demande d'appairage en attente à partir de son `requestId` exact. Si `requestId` est omis ou si `--latest` est transmis, la commande affiche uniquement un aperçu de la demande en attente la plus récente, puis se termine (code 1) ; relancez-la avec l'identifiant exact de la demande pour l'approuver.

```bash
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

<Note>
Si un appareil retente l'appairage avec des informations d'authentification modifiées (rôle, portées ou clé publique), OpenClaw remplace l'entrée en attente précédente par une nouvelle entrée dotée d'un nouveau `requestId`. Exécutez `openclaw devices list` juste avant l'approbation pour obtenir l'identifiant actuel.
</Note>

Comportement de l'approbation :

- Si l'appareil est déjà appairé et demande des portées plus larges ou un autre rôle, OpenClaw conserve l'approbation existante et crée une nouvelle demande de mise à niveau en attente. Comparez `Requested` et `Approved` dans `openclaw devices list`, ou affichez un aperçu avec `--latest`, avant d'approuver.
- L'approbation d'un rôle `node` ou de tout autre rôle non-opérateur nécessite `operator.admin`. `operator.pairing` suffit pour approuver les appareils d'opérateur, mais uniquement si les portées d'opérateur demandées restent comprises dans les propres portées de l'appelant. Consultez [Portées de l'opérateur](/fr/gateway/operator-scopes).
- Si `gateway.nodes.pairing.autoApproveCidrs` est configuré, les premières demandes avec `role: node` provenant d'adresses IP clientes correspondantes peuvent être approuvées automatiquement avant d'apparaître dans cette liste. Cette option est désactivée par défaut et ne s'applique jamais aux clients opérateurs ou navigateurs, ni aux demandes de mise à niveau.
- `gateway.nodes.pairing.sshVerify` (activé par défaut) approuve automatiquement les premières demandes avec `role: node` lorsque le Gateway vérifie la clé de l'appareil par SSH auprès de l'hôte du Node. Les demandes peuvent donc passer à l'état approuvé peu après leur apparition. Définissez `sshVerify: false` pour désactiver la vérification SSH ; ce réglage est indépendant de `autoApproveCidrs`, que vous devez donc également désactiver pour imposer un appairage exclusivement manuel.

### `openclaw devices reject <requestId>`

Rejette une demande d'appairage d'appareil en attente.

```bash
openclaw devices reject <requestId>
```

### `openclaw devices remove <deviceId>`

Supprime une entrée d'appareil appairé.

```bash
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

Un appelant authentifié avec le jeton d'un appareil appairé ne peut supprimer que l'entrée de son **propre** appareil. La suppression d'un autre appareil nécessite `operator.admin`.

### `openclaw devices rename --device <id> --name <label>`

Attribue un libellé d'opérateur à un appareil appairé. Les libellés sont un état géré du côté du propriétaire : ils persistent après les réparations d'appairage et les nouvelles approbations de rôle, et ne modifient pas le `deviceId` stable.

```bash
openclaw devices rename --device <deviceId> --name "Kitchen Mac"
openclaw devices rename --device <deviceId> --name "Kitchen Mac" --json
```

- `--name` est obligatoire, ses espaces de début et de fin sont supprimés, il ne peut pas être vide et sa longueur est limitée à 64 caractères.
- Les surfaces d'affichage (liste de la CLI, inventaire de l'interface de contrôle) privilégient le libellé de l'opérateur par rapport au nom d'affichage indiqué par le client.
- Un appelant non administrateur utilisant un appareil appairé ne peut renommer que son **propre** appareil. Le renommage d'un autre appareil nécessite `operator.admin`.

### `openclaw devices clear --yes [--pending]`

Supprime en masse les appareils appairés. Nécessite `--yes`.

```bash
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

`--pending` rejette également toutes les demandes d'appairage en attente.

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Renouvelle le jeton d'un appareil pour un rôle, avec la possibilité de mettre à jour ses portées.

```bash
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

- Le rôle cible doit déjà exister dans le contrat d'appairage approuvé de cet appareil ; le renouvellement ne peut pas créer un nouveau rôle non approuvé.
- L'omission de `--scope` réutilise les portées approuvées mises en cache du jeton enregistré lors des reconnexions ultérieures. La transmission de valeurs `--scope` explicites remplace l'ensemble de portées enregistré pour les futures reconnexions avec un jeton mis en cache.
- Un appelant non administrateur utilisant un appareil appairé ne peut renouveler que le jeton de son **propre** appareil, et l'ensemble de portées cible doit rester compris dans les propres portées d'opérateur de l'appelant ; le renouvellement ne peut ni créer ni conserver un jeton plus étendu que celui que possède déjà l'appelant.

Renvoie les métadonnées de renouvellement au format JSON. Si l'appelant renouvelle son propre jeton tout en étant authentifié avec le jeton de cet appareil, la réponse inclut le jeton de remplacement afin que le client puisse le conserver avant de se reconnecter. Les renouvellements partagés ou administratifs ne renvoient jamais le jeton porteur.

### `openclaw devices revoke --device <id> --role <role>`

Révoque le jeton d'un appareil pour un rôle.

```bash
openclaw devices revoke --device <deviceId> --role node
```

Un appelant non administrateur utilisant un appareil appairé ne peut révoquer que le jeton de son **propre** appareil. La révocation du jeton d'un autre appareil nécessite `operator.admin`. L'ensemble de portées cible doit également rester compris dans les propres portées d'opérateur de l'appelant ; les appelants disposant uniquement des droits d'appairage ne peuvent pas révoquer les jetons d'opérateur d'administration ou d'écriture.

## Remarques

- Ces commandes nécessitent la portée `operator.pairing` (ou `operator.admin`). Les rôles d'appareil non-opérateur nécessitent toujours `operator.admin` ; consultez [Portées de l'opérateur](/fr/gateway/operator-scopes).
- Le renouvellement et la révocation des jetons restent limités à l'ensemble de rôles d'appairage approuvés et à la base de référence des portées de l'appareil. Une entrée de jeton mise en cache isolée ne crée pas de cible de gestion de jetons.
- Pour les sessions utilisant un jeton d'appareil appairé, la gestion entre appareils (`remove`, `rename`, `rotate`, `revoke`) est limitée à l'appareil de l'appelant, sauf si celui-ci dispose de `operator.admin`.
- Le renouvellement d'un jeton renvoie un nouveau jeton (sensible) — traitez-le comme un secret.
- Si la portée d'appairage n'est pas disponible sur local loopback et qu'aucune option `--url` explicite n'est transmise, `list` et `approve` peuvent se rabattre sur l'état d'appairage local.

## Liste de contrôle pour corriger la dérive des jetons

Utilisez cette procédure lorsque l'interface de contrôle ou d'autres clients continuent d'échouer avec `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` ou `AUTH_SCOPE_MISMATCH`.

1. Confirmez la source actuelle du jeton du Gateway :

   ```bash
   openclaw config get gateway.auth.token
   ```

2. Répertoriez les appareils appairés et identifiez l'identifiant de l'appareil concerné :

   ```bash
   openclaw devices list
   ```

3. Renouvelez le jeton d'opérateur de l'appareil concerné :

   ```bash
   openclaw devices rotate --device <deviceId> --role operator
   ```

4. Si le renouvellement ne suffit pas, supprimez l'appairage obsolète et approuvez-le de nouveau :

   ```bash
   openclaw devices remove <deviceId>
   openclaw devices list
   openclaw devices approve <requestId>
   ```

5. Réessayez la connexion du client avec le jeton partagé ou le mot de passe actuel.

Remarques :

- Ordre de priorité normal pour l'authentification à la reconnexion : jeton partagé ou mot de passe explicite en premier, puis `deviceToken` explicite, puis jeton d'appareil enregistré, puis jeton d'amorçage.
- La récupération fiable après `AUTH_TOKEN_MISMATCH` peut temporairement envoyer ensemble le jeton partagé et le jeton d'appareil enregistré lors d'une seule nouvelle tentative limitée.
- `AUTH_SCOPE_MISMATCH` signifie que le jeton de l'appareil a été reconnu, mais qu'il ne contient pas l'ensemble de portées demandé ; corrigez le contrat d'approbation de l'appairage et des portées avant de modifier l'authentification partagée du Gateway.

Pages associées :

- [Dépannage de l'authentification du tableau de bord](/fr/web/dashboard#if-you-see-unauthorized-1008)
- [Dépannage du Gateway](/fr/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Approbation initiale de Paperclip / `openclaw_gateway`

Les agents Paperclip qui se connectent au moyen de l'adaptateur `openclaw_gateway` suivent la même procédure d'approbation d'appairage d'appareil lors de la première exécution que tout autre nouveau client. Si Paperclip signale `openclaw_gateway_pairing_required`, approuvez l'appareil en attente, puis réessayez.

```bash
openclaw devices approve --latest
```

L'aperçu affiche la commande exacte `openclaw devices approve <requestId>` ; vérifiez les détails, puis relancez cette commande avec l'identifiant de la demande pour l'approuver. Pour un Gateway distant ou des identifiants explicites, transmettez les mêmes options lors de l'aperçu et de l'approbation :

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

Pour éviter de devoir approuver de nouveau après chaque redémarrage, configurez une valeur `adapterConfig.devicePrivateKeyPem` persistante dans Paperclip au lieu de le laisser générer une nouvelle identité d'appareil éphémère à chaque exécution :

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

Si l'approbation continue d'échouer, exécutez d'abord `openclaw devices list` pour confirmer qu'une demande en attente existe.

## Pages associées

- [Référence de la CLI](/fr/cli)
- [Nodes](/fr/nodes)
