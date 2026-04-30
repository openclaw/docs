---
read_when:
    - Développement des fonctionnalités du canal Nextcloud Talk
summary: État de prise en charge de Nextcloud Talk, fonctionnalités et configuration
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-30T07:13:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: fcbe8a65adfddc95d2b4944af88f9982e23a1676752efec2bbf40cfc4dd846d2
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Statut : Plugin groupé (bot Webhook). Les messages directs, les salons, les réactions et les messages Markdown sont pris en charge.

## Plugin groupé

Nextcloud Talk est fourni comme Plugin groupé dans les versions actuelles d’OpenClaw ; les builds empaquetés normaux n’ont donc pas besoin d’installation séparée.

Si vous utilisez un build plus ancien ou une installation personnalisée qui exclut Nextcloud Talk, installez un paquet npm actuel lorsqu’il est publié :

Installation via la CLI (registre npm, lorsqu’un paquet actuel existe) :

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Si npm signale que le paquet appartenant à OpenClaw est obsolète, utilisez un build OpenClaw empaqueté actuel ou le chemin du checkout local jusqu’à ce qu’un paquet npm plus récent soit publié.

Checkout local (lors de l’exécution depuis un dépôt git) :

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Détails : [Plugins](/fr/tools/plugin)

## Configuration rapide (débutant)

1. Assurez-vous que le Plugin Nextcloud Talk est disponible.
   - Les versions OpenClaw empaquetées actuelles l’incluent déjà.
   - Les installations plus anciennes/personnalisées peuvent l’ajouter manuellement avec les commandes ci-dessus.
2. Sur votre serveur Nextcloud, créez un bot :

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Activez le bot dans les paramètres du salon cible.
4. Configurez OpenClaw :
   - Config : `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Ou env : `NEXTCLOUD_TALK_BOT_SECRET` (compte par défaut uniquement)

   Configuration CLI :

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   Champs explicites équivalents :

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   Secret adossé à un fichier :

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Redémarrez le Gateway (ou terminez la configuration).

Configuration minimale :

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## Notes

- Les bots ne peuvent pas initier de messages directs. L’utilisateur doit d’abord envoyer un message au bot.
- L’URL du Webhook doit être accessible par le Gateway ; définissez `webhookPublicUrl` si vous êtes derrière un proxy.
- Les téléversements de médias ne sont pas pris en charge par l’API du bot ; les médias sont envoyés sous forme d’URL.
- La charge utile du Webhook ne distingue pas les messages directs des salons ; définissez `apiUser` + `apiPassword` pour activer les recherches de type de salon (sinon les messages directs sont traités comme des salons).

## Contrôle d’accès (messages directs)

- Par défaut : `channels.nextcloud-talk.dmPolicy = "pairing"`. Les expéditeurs inconnus reçoivent un code d’appairage.
- Approuver via :
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Messages directs publics : `channels.nextcloud-talk.dmPolicy="open"` plus `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` correspond uniquement aux ID utilisateur Nextcloud ; les noms d’affichage sont ignorés.

## Salons (groupes)

- Par défaut : `channels.nextcloud-talk.groupPolicy = "allowlist"` (contrôlé par mention).
- Ajoutez des salons à la liste d’autorisation avec `channels.nextcloud-talk.rooms` :

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- Pour n’autoriser aucun salon, gardez la liste d’autorisation vide ou définissez `channels.nextcloud-talk.groupPolicy="disabled"`.

## Capacités

| Fonctionnalité  | Statut        |
| --------------- | ------------- |
| Messages directs | Pris en charge |
| Salons          | Pris en charge |
| Fils de discussion | Non pris en charge |
| Médias          | URL uniquement |
| Réactions       | Pris en charge |
| Commandes natives | Non prises en charge |

## Référence de configuration (Nextcloud Talk)

Configuration complète : [Configuration](/fr/gateway/configuration)

Options du fournisseur :

- `channels.nextcloud-talk.enabled` : activer/désactiver le démarrage du canal.
- `channels.nextcloud-talk.baseUrl` : URL de l’instance Nextcloud.
- `channels.nextcloud-talk.botSecret` : secret partagé du bot.
- `channels.nextcloud-talk.botSecretFile` : chemin du secret dans un fichier régulier. Les liens symboliques sont rejetés.
- `channels.nextcloud-talk.apiUser` : utilisateur API pour les recherches de salon (détection des messages directs).
- `channels.nextcloud-talk.apiPassword` : mot de passe API/application pour les recherches de salon.
- `channels.nextcloud-talk.apiPasswordFile` : chemin du fichier de mot de passe API.
- `channels.nextcloud-talk.webhookPort` : port d’écoute du Webhook (par défaut : 8788).
- `channels.nextcloud-talk.webhookHost` : hôte du Webhook (par défaut : 0.0.0.0).
- `channels.nextcloud-talk.webhookPath` : chemin du Webhook (par défaut : /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl` : URL du Webhook accessible depuis l’extérieur.
- `channels.nextcloud-talk.dmPolicy` : `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom` : liste d’autorisation des messages directs (ID utilisateur). `open` nécessite `"*"`.
- `channels.nextcloud-talk.groupPolicy` : `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom` : liste d’autorisation des groupes (ID utilisateur).
- `channels.nextcloud-talk.rooms` : paramètres par salon et liste d’autorisation.
- `channels.nextcloud-talk.historyLimit` : limite de l’historique de groupe (0 désactive).
- `channels.nextcloud-talk.dmHistoryLimit` : limite de l’historique des messages directs (0 désactive).
- `channels.nextcloud-talk.dms` : remplacements par message direct (historyLimit).
- `channels.nextcloud-talk.textChunkLimit` : taille des fragments de texte sortants (caractères).
- `channels.nextcloud-talk.chunkMode` : `length` (par défaut) ou `newline` pour découper sur les lignes vides (limites de paragraphes) avant le découpage par longueur.
- `channels.nextcloud-talk.blockStreaming` : désactiver le streaming par blocs pour ce canal.
- `channels.nextcloud-talk.blockStreamingCoalesce` : réglage de la coalescence du streaming par blocs.
- `channels.nextcloud-talk.mediaMaxMb` : plafond des médias entrants (Mo).

## Connexe

- [Aperçu des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification des messages directs et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et contrôle par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et renforcement
