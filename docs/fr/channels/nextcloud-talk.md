---
read_when:
    - Développement des fonctionnalités du canal Nextcloud Talk
summary: État de la prise en charge, fonctionnalités et configuration de Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-07-12T15:03:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 234981d21df12eafabfef60822f2a145d37257689511efc6104451a735346d09
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Nextcloud Talk est un plugin de canal téléchargeable (`@openclaw/nextcloud-talk`) qui connecte OpenClaw à une instance Nextcloud auto-hébergée au moyen d’un bot Webhook Talk. Les messages directs, les salons, les réactions et les messages Markdown sont pris en charge ; les médias sont envoyés sous forme d’URL.

## Installation

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Utilisez la spécification de paquet seule pour suivre le tag de la version officielle actuelle. N’épinglez une version exacte que si vous avez besoin d’une installation reproductible.

Depuis un dépôt local (flux de développement) :

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Redémarrez le Gateway après l’installation. Détails : [Plugins](/fr/tools/plugin)

## Configuration rapide (débutant)

1. Installez le plugin (ci-dessus).
2. Sur votre serveur Nextcloud, créez un bot :

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

   Conservez `--feature response` : sans cette option, les réponses sortantes échouent avec le code 401. Réparez un bot existant avec `./occ talk:bot:state --feature webhook --feature response --feature reaction <botId> 1`.

3. Activez le bot dans les paramètres du salon cible.
4. Configurez OpenClaw :
   - Configuration : `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Ou variable d’environnement : `NEXTCLOUD_TALK_BOT_SECRET` (compte par défaut uniquement)

   Configuration avec la CLI (`--url`/`--token` sont des alias des champs explicites ; `nc-talk` et `nc` fonctionnent comme alias de canal) :

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

   Secret stocké dans un fichier :

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

## Remarques

- Les bots ne peuvent pas initier de messages directs. L’utilisateur doit d’abord envoyer un message au bot.
- L’URL du Webhook doit être accessible depuis le serveur Nextcloud ; définissez `webhookPublicUrl` lorsque le Gateway se trouve derrière un proxy. Les requêtes Webhook sont signées avec HMAC-SHA256 à l’aide du secret du bot ; les signatures non valides sont rejetées et soumises à une limitation de débit.
- Les téléversements de médias ne sont pas pris en charge par l’API du bot ; les médias sortants sont ajoutés sous la forme d’une ligne `Attachment: <url>`.
- La charge utile du Webhook ne distingue pas les messages directs des salons ; définissez `apiUser` + `apiPassword` pour activer la recherche du type de salon (mise en cache pendant environ 5 minutes). Sans ces paramètres, chaque conversation est traitée comme un salon.
- Les requêtes sortantes passent par la protection SSRF. Pour un hôte Nextcloud situé sur un réseau privé/interne de confiance, activez explicitement `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork: true`.
- Lorsque `apiUser`/`apiPassword` et `webhookPublicUrl` sont définis, `openclaw channels status` sonde le bot et émet un avertissement si la fonctionnalité `response` est absente.

## Contrôle d’accès (messages directs)

- Valeur par défaut : `channels.nextcloud-talk.dmPolicy = "pairing"`. Les expéditeurs inconnus reçoivent un code d’association.
- Approuvez avec :
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Messages directs publics : `channels.nextcloud-talk.dmPolicy="open"` avec `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` correspond uniquement aux identifiants utilisateur Nextcloud (en minuscules) ; les noms d’affichage sont ignorés.

## Salons (groupes)

- Valeur par défaut : `channels.nextcloud-talk.groupPolicy = "allowlist"` (mention obligatoire).
- Ajoutez les salons à la liste d’autorisation avec `channels.nextcloud-talk.rooms`, indexés par le jeton du salon ; `"*"` définit une valeur générique par défaut :

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

- Clés par salon : `requireMention` (true par défaut), `enabled` (false désactive le salon), `allowFrom` (liste d’autorisation des expéditeurs propre au salon), `tools` (remplacements d’autorisation/de refus pour les outils), `skills` (limite les Skills chargées), `systemPrompt`.
- Pour n’autoriser aucun salon, laissez la liste d’autorisation vide ou définissez `channels.nextcloud-talk.groupPolicy="disabled"`.

## Fonctionnalités

| Fonctionnalité     | État               |
| ------------------ | ------------------ |
| Messages directs   | Pris en charge      |
| Salons             | Pris en charge      |
| Fils de discussion | Non pris en charge  |
| Médias             | URL uniquement      |
| Réactions          | Prises en charge    |
| Commandes natives  | Non prises en charge |

## Référence de configuration (Nextcloud Talk)

Configuration complète : [Configuration](/fr/gateway/configuration)

Options du fournisseur :

- `channels.nextcloud-talk.enabled` : active/désactive le démarrage du canal.
- `channels.nextcloud-talk.baseUrl` : URL de l’instance Nextcloud.
- `channels.nextcloud-talk.botSecret` : secret partagé du bot (chaîne ou référence de secret).
- `channels.nextcloud-talk.botSecretFile` : chemin vers un fichier ordinaire contenant le secret. Les liens symboliques sont rejetés.
- `channels.nextcloud-talk.apiUser` : utilisateur de l’API pour la recherche des salons (détection des messages directs) et la sonde d’état.
- `channels.nextcloud-talk.apiPassword` : mot de passe de l’API/de l’application pour la recherche des salons.
- `channels.nextcloud-talk.apiPasswordFile` : chemin vers le fichier du mot de passe de l’API.
- `channels.nextcloud-talk.webhookPort` : port d’écoute du Webhook (valeur par défaut : 8788).
- `channels.nextcloud-talk.webhookHost` : hôte du Webhook (valeur par défaut : 0.0.0.0).
- `channels.nextcloud-talk.webhookPath` : chemin du Webhook (valeur par défaut : /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl` : URL du Webhook accessible de l’extérieur.
- `channels.nextcloud-talk.dmPolicy` : `pairing | allowlist | open | disabled` (valeur par défaut : pairing). `open` nécessite `allowFrom=["*"]`.
- `channels.nextcloud-talk.allowFrom` : liste d’autorisation des messages directs (identifiants utilisateur).
- `channels.nextcloud-talk.groupPolicy` : `allowlist | open | disabled` (valeur par défaut : allowlist).
- `channels.nextcloud-talk.groupAllowFrom` : liste d’autorisation des expéditeurs de salon (identifiants utilisateur) ; utilise `allowFrom` comme solution de repli si elle n’est pas définie.
- `channels.nextcloud-talk.rooms` : paramètres et liste d’autorisation propres à chaque salon (voir ci-dessus).
- Les groupes statiques d’accès des expéditeurs peuvent être référencés depuis `allowFrom` et `groupAllowFrom` avec `accessGroup:<name>`.
- `channels.nextcloud-talk.historyLimit` : limite de l’historique des groupes (0 le désactive).
- `channels.nextcloud-talk.dmHistoryLimit` : limite de l’historique des messages directs (0 le désactive).
- `channels.nextcloud-talk.dms` : remplacements propres à chaque conversation directe, indexés par identifiant utilisateur (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit` : taille des segments de texte sortants en caractères (valeur par défaut : 4000).
- `channels.nextcloud-talk.chunkMode` : `length` (valeur par défaut) ou `newline` pour effectuer la division sur les lignes vides (limites de paragraphes) avant la segmentation par longueur.
- `channels.nextcloud-talk.blockStreaming` : désactive la diffusion par blocs pour ce canal.
- `channels.nextcloud-talk.blockStreamingCoalesce` : réglage de la fusion de la diffusion par blocs.
- `channels.nextcloud-talk.responsePrefix` : préfixe des réponses sortantes.
- `channels.nextcloud-talk.markdown.tables` : mode de rendu des tableaux Markdown (`off | bullets | code | block`).
- `channels.nextcloud-talk.mediaMaxMb` : limite des médias entrants (Mo).
- `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork` : autorise les hôtes Nextcloud privés/internes à franchir la protection SSRF.
- `channels.nextcloud-talk.accounts.<id>` : remplacements propres à chaque compte (mêmes clés) ; `defaultAccount` sélectionne le compte par défaut. Les variables d’environnement `NEXTCLOUD_TALK_BOT_SECRET` / `NEXTCLOUD_TALK_API_PASSWORD` s’appliquent uniquement au compte par défaut.

## Pages connexes

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Association](/fr/channels/pairing) — authentification des messages directs et processus d’association
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et obligation de mention
- [Routage des canaux](/fr/channels/channel-routing) — routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et renforcement de la sécurité
