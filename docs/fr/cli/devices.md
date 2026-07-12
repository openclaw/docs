---
read_when:
    - Vous approuvez les demandes d’association d’appareils
    - Vous devez renouveler ou révoquer les jetons d’appareil.
summary: Référence de la CLI pour `openclaw devices` (appairage d’appareils + rotation/révocation des jetons)
title: Appareils
x-i18n:
    generated_at: "2026-07-12T15:07:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 83fb10f7a484fec06bfa5e53ae50181b12a9724746176bbace330ec468235494
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Gérez les demandes d’appairage des appareils et les jetons propres aux appareils.

## Options courantes

- `--url <url>` : URL WebSocket du Gateway (utilise par défaut `gateway.remote.url` lorsqu’elle est configurée)
- `--token <token>` : jeton du Gateway (si requis)
- `--password <password>` : mot de passe du Gateway (authentification par mot de passe)
- `--timeout <ms>` : délai d’expiration RPC
- `--json` : sortie JSON (recommandée pour les scripts)

<Warning>
Lorsque vous définissez `--url`, la CLI ne se rabat pas sur les identifiants de la configuration ou de l’environnement. Transmettez explicitement `--token` ou `--password`, sinon la commande échoue.
</Warning>

## Commandes

### `openclaw devices list`

Répertoriez les demandes d’appairage en attente et les appareils appairés.

```bash
openclaw devices list
openclaw devices list --json
```

Pour une demande en attente concernant un appareil déjà appairé, la sortie affiche les accès demandés à côté des accès actuellement approuvés de l’appareil, afin que les élargissements de portée ou les changements de rôle soient visibles au lieu de donner l’impression que l’appairage a été perdu.

Les noms d’affichage des appareils appairés suivent cet ordre de priorité : libellé de l’opérateur (`operatorLabel` défini par `devices rename`), puis `displayName` du client, puis `clientId`, puis `deviceId`.

### `openclaw devices approve [requestId] [--latest]`

Approuvez une demande d’appairage en attente à l’aide de son `requestId` exact. Si vous omettez `requestId` ou transmettez `--latest`, la commande affiche uniquement un aperçu de la demande en attente la plus récente, puis se termine (code 1) ; relancez-la avec l’ID exact de la demande pour l’approuver.

```bash
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

<Note>
Si un appareil retente l’appairage avec des informations d’authentification modifiées (rôle, portées ou clé publique), OpenClaw remplace l’entrée en attente précédente par une nouvelle entrée dotée d’un nouveau `requestId`. Exécutez `openclaw devices list` juste avant l’approbation pour obtenir l’identifiant actuel.
</Note>

Comportement de l’approbation :

- Si l’appareil est déjà appairé et demande des portées plus larges ou un autre rôle, OpenClaw conserve l’approbation existante et crée une nouvelle demande d’élargissement en attente. Comparez `Requested` et `Approved` dans `openclaw devices list`, ou affichez un aperçu avec `--latest`, avant d’approuver.
- L’approbation d’un rôle `node` ou de tout autre rôle non-opérateur nécessite `operator.admin`. `operator.pairing` suffit pour approuver les appareils d’opérateur, mais uniquement lorsque les portées d’opérateur demandées restent comprises dans celles de l’appelant. Consultez [Portées de l’opérateur](/fr/gateway/operator-scopes).
- Si `gateway.nodes.pairing.autoApproveCidrs` est configuré, les premières demandes avec `role: node` provenant d’adresses IP clientes correspondantes peuvent être approuvées automatiquement avant d’apparaître dans cette liste. Cette option est désactivée par défaut et ne s’applique jamais aux clients opérateur/navigateur ni aux demandes d’élargissement.
- `gateway.nodes.pairing.sshVerify` (activé par défaut) approuve automatiquement les premières demandes avec `role: node` lorsque le Gateway vérifie la clé de l’appareil via SSH auprès de l’hôte du Node. Les demandes peuvent donc passer à l’état approuvé peu après leur apparition. Définissez `sshVerify: false` pour désactiver la vérification SSH ; cette option est indépendante de `autoApproveCidrs`, donc désactivez également cette dernière pour imposer un appairage exclusivement manuel.

### `openclaw devices reject <requestId>`

Rejetez une demande d’appairage d’appareil en attente.

```bash
openclaw devices reject <requestId>
```

### `openclaw devices remove <deviceId>`

Supprimez une entrée d’appareil appairé.

```bash
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

Un appelant authentifié avec le jeton d’un appareil appairé ne peut supprimer que l’entrée de son **propre** appareil. La suppression d’un autre appareil nécessite `operator.admin`.

### `openclaw devices rename --device <id> --name <label>`

Attribuez un libellé d’opérateur à un appareil appairé. Les libellés constituent un état du côté du propriétaire : ils persistent après les réparations d’appairage et les nouvelles approbations de rôle, et ne modifient pas le `deviceId` stable.

```bash
openclaw devices rename --device <deviceId> --name "Kitchen Mac"
openclaw devices rename --device <deviceId> --name "Kitchen Mac" --json
```

- `--name` est obligatoire, ses espaces superflus sont supprimés, il ne peut pas être vide et sa longueur est limitée à 64 caractères.
- Les surfaces d’affichage (liste de la CLI, inventaire de l’interface de contrôle) privilégient le libellé de l’opérateur par rapport au nom d’affichage communiqué par le client.
- Un appelant utilisant un appareil appairé et ne disposant pas des droits d’administration ne peut renommer que son **propre** appareil. Le renommage d’un autre appareil nécessite `operator.admin`.

### `openclaw devices clear --yes [--pending]`

Supprimez en masse les appareils appairés. Cette opération nécessite `--yes`.

```bash
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

`--pending` rejette également toutes les demandes d’appairage en attente.

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Renouvelez le jeton d’un appareil pour un rôle, en mettant éventuellement à jour ses portées.

```bash
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

- Le rôle cible doit déjà exister dans le contrat d’appairage approuvé de cet appareil ; le renouvellement ne peut pas créer un nouveau rôle non approuvé.
- Si vous omettez `--scope`, les portées approuvées mises en cache du jeton stocké sont réutilisées lors des reconnexions ultérieures. La transmission de valeurs `--scope` explicites remplace l’ensemble de portées stocké pour les futures reconnexions utilisant le jeton mis en cache.
- Un appelant utilisant un appareil appairé et ne disposant pas des droits d’administration ne peut renouveler que le jeton de son **propre** appareil, et l’ensemble de portées cible doit rester compris dans les propres portées d’opérateur de l’appelant ; le renouvellement ne peut ni créer ni préserver un jeton plus étendu que celui dont dispose déjà l’appelant.

Renvoie les métadonnées de renouvellement au format JSON. Si l’appelant renouvelle son propre jeton alors qu’il est authentifié avec le jeton de cet appareil, la réponse inclut le jeton de remplacement afin que le client puisse le conserver avant de se reconnecter. Les renouvellements partagés ou administratifs ne renvoient jamais le jeton au porteur.

### `openclaw devices revoke --device <id> --role <role>`

Révoquez le jeton d’un appareil pour un rôle.

```bash
openclaw devices revoke --device <deviceId> --role node
```

Un appelant utilisant un appareil appairé et ne disposant pas des droits d’administration ne peut révoquer que le jeton de son **propre** appareil. La révocation du jeton d’un autre appareil nécessite `operator.admin`. L’ensemble de portées cible doit également rester compris dans les propres portées d’opérateur de l’appelant ; les appelants disposant uniquement de droits d’appairage ne peuvent pas révoquer les jetons d’opérateur avec des droits d’administration ou d’écriture.

## Remarques

- Ces commandes nécessitent la portée `operator.pairing` (ou `operator.admin`). Les rôles d’appareil non-opérateur nécessitent toujours `operator.admin` ; consultez [Portées de l’opérateur](/fr/gateway/operator-scopes).
- Le renouvellement et la révocation des jetons restent limités à l’ensemble de rôles d’appairage et à la base de référence des portées approuvés de l’appareil. Une entrée de jeton mise en cache isolée n’accorde pas de cible de gestion des jetons.
- Pour les sessions utilisant le jeton d’un appareil appairé, la gestion entre appareils (`remove`, `rename`, `rotate`, `revoke`) est limitée à l’appareil de l’appelant, sauf si celui-ci dispose de `operator.admin`.
- Le renouvellement d’un jeton renvoie un nouveau jeton (sensible) — traitez-le comme un secret.
- Si la portée d’appairage n’est pas disponible sur l’interface de bouclage locale et qu’aucune option `--url` explicite n’est transmise, `list`/`approve` peuvent se rabattre sur l’état d’appairage local.

## Liste de contrôle pour corriger la divergence des jetons

Utilisez cette procédure lorsque l’interface de contrôle ou d’autres clients continuent d’échouer avec `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` ou `AUTH_SCOPE_MISMATCH`.

1. Confirmez la source actuelle du jeton du Gateway :

   ```bash
   openclaw config get gateway.auth.token
   ```

2. Répertoriez les appareils appairés et identifiez l’ID de l’appareil concerné :

   ```bash
   openclaw devices list
   ```

3. Renouvelez le jeton d’opérateur de l’appareil concerné :

   ```bash
   openclaw devices rotate --device <deviceId> --role operator
   ```

4. Si le renouvellement ne suffit pas, supprimez l’appairage obsolète et approuvez-le à nouveau :

   ```bash
   openclaw devices remove <deviceId>
   openclaw devices list
   openclaw devices approve <requestId>
   ```

5. Réessayez la connexion du client avec le jeton partagé ou le mot de passe actuel.

Remarques :

- Ordre de priorité normal de l’authentification lors de la reconnexion : d’abord le jeton partagé ou le mot de passe explicite, puis le `deviceToken` explicite, puis le jeton d’appareil stocké, puis le jeton d’amorçage.
- La récupération approuvée après une erreur `AUTH_TOKEN_MISMATCH` peut envoyer temporairement et simultanément le jeton partagé et le jeton d’appareil stocké pendant une seule nouvelle tentative limitée.
- `AUTH_SCOPE_MISMATCH` signifie que le jeton de l’appareil a été reconnu, mais qu’il ne contient pas l’ensemble de portées demandé ; corrigez le contrat d’approbation de l’appairage et des portées avant de modifier l’authentification partagée du Gateway.

Voir aussi :

- [Dépannage de l’authentification du tableau de bord](/fr/web/dashboard#if-you-see-unauthorized-1008)
- [Dépannage du Gateway](/fr/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Approbation à la première exécution de Paperclip / `openclaw_gateway`

Les agents Paperclip qui se connectent via l’adaptateur `openclaw_gateway` suivent la même procédure d’approbation d’appairage d’appareil à la première exécution que tout autre nouveau client. Si Paperclip signale `openclaw_gateway_pairing_required`, approuvez l’appareil en attente et réessayez.

```bash
openclaw devices approve --latest
```

L’aperçu affiche la commande exacte `openclaw devices approve <requestId>` ; vérifiez les informations, puis relancez cette commande avec l’ID de la demande pour l’approuver. Pour un Gateway distant ou des identifiants explicites, transmettez les mêmes options lors de l’aperçu et de l’approbation :

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

Pour éviter de devoir approuver à nouveau après chaque redémarrage, configurez une valeur `adapterConfig.devicePrivateKeyPem` persistante dans Paperclip au lieu de le laisser générer une nouvelle identité d’appareil éphémère à chaque exécution :

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

Si l’approbation continue d’échouer, exécutez d’abord `openclaw devices list` pour confirmer qu’une demande en attente existe.

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Nodes](/fr/nodes)
