---
read_when:
    - Travailler sur les fonctionnalités du canal Nextcloud Talk
summary: État de la prise en charge, fonctionnalités et configuration de Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-05-02T22:16:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4956586ae8622118dcf136f4279c6ed1c2895fd4bb4576a7f5799de600a95740
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Status : Plugin inclus (bot Webhook). Les messages directs, les salons, les réactions et les messages Markdown sont pris en charge.

## Plugin inclus

Nextcloud Talk est fourni comme Plugin inclus dans les versions actuelles d’OpenClaw ; les builds empaquetés normaux ne nécessitent donc pas d’installation séparée.

Si vous utilisez un build plus ancien ou une installation personnalisée qui exclut Nextcloud Talk, installez directement le package npm :

Installer via la CLI (registre npm) :

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Utilisez le package nu pour suivre le tag de version officiel actuel. Épinglez une version exacte uniquement lorsque vous avez besoin d’une installation reproductible.

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
   - Configuration : `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
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

## Remarques

- Les bots ne peuvent pas initier de messages directs. L’utilisateur doit d’abord envoyer un message au bot.
- L’URL du Webhook doit être accessible par le Gateway ; définissez `webhookPublicUrl` si vous êtes derrière un proxy.
- Les téléversements de médias ne sont pas pris en charge par l’API du bot ; les médias sont envoyés sous forme d’URL.
- La charge utile du Webhook ne distingue pas les messages directs des salons ; définissez `apiUser` + `apiPassword` pour activer les recherches de type de salon (sinon, les messages directs sont traités comme des salons).

## Contrôle d’accès (messages directs)

- Par défaut : `channels.nextcloud-talk.dmPolicy = "pairing"`. Les expéditeurs inconnus reçoivent un code d’appairage.
- Approuvez avec :
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Messages directs publics : `channels.nextcloud-talk.dmPolicy="open"` plus `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` correspond uniquement aux ID utilisateur Nextcloud ; les noms d’affichage sont ignorés.

## Salons (groupes)

- Par défaut : `channels.nextcloud-talk.groupPolicy = "allowlist"` (soumis à mention).
- Autorisez les salons avec `channels.nextcloud-talk.rooms` :

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

- Pour n’autoriser aucun salon, laissez la liste d’autorisation vide ou définissez `channels.nextcloud-talk.groupPolicy="disabled"`.

## Capacités

| Fonctionnalité   | Statut         |
| ---------------- | -------------- |
| Messages directs | Pris en charge |
| Salons           | Pris en charge |
| Fils             | Non pris en charge |
| Médias           | URL uniquement |
| Réactions        | Pris en charge |
| Commandes natives | Non pris en charge |

## Référence de configuration (Nextcloud Talk)

Configuration complète : [Configuration](/fr/gateway/configuration)

Options du fournisseur :

- `channels.nextcloud-talk.enabled` : activer/désactiver le démarrage du canal.
- `channels.nextcloud-talk.baseUrl` : URL de l’instance Nextcloud.
- `channels.nextcloud-talk.botSecret` : secret partagé du bot.
- `channels.nextcloud-talk.botSecretFile` : chemin du secret dans un fichier standard. Les liens symboliques sont rejetés.
- `channels.nextcloud-talk.apiUser` : utilisateur API pour les recherches de salon (détection des messages directs).
- `channels.nextcloud-talk.apiPassword` : mot de passe API/application pour les recherches de salon.
- `channels.nextcloud-talk.apiPasswordFile` : chemin du fichier de mot de passe API.
- `channels.nextcloud-talk.webhookPort` : port de l’écouteur Webhook (par défaut : 8788).
- `channels.nextcloud-talk.webhookHost` : hôte du Webhook (par défaut : 0.0.0.0).
- `channels.nextcloud-talk.webhookPath` : chemin du Webhook (par défaut : /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl` : URL du Webhook accessible depuis l’extérieur.
- `channels.nextcloud-talk.dmPolicy` : `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom` : liste d’autorisation des messages directs (ID utilisateur). `open` nécessite `"*"`.
- `channels.nextcloud-talk.groupPolicy` : `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom` : liste d’autorisation de groupe (ID utilisateur).
- `channels.nextcloud-talk.rooms` : paramètres par salon et liste d’autorisation.
- `channels.nextcloud-talk.historyLimit` : limite d’historique de groupe (0 désactive).
- `channels.nextcloud-talk.dmHistoryLimit` : limite d’historique des messages directs (0 désactive).
- `channels.nextcloud-talk.dms` : remplacements par message direct (historyLimit).
- `channels.nextcloud-talk.textChunkLimit` : taille des segments de texte sortant (caractères).
- `channels.nextcloud-talk.chunkMode` : `length` (par défaut) ou `newline` pour fractionner sur les lignes vides (limites de paragraphe) avant le découpage par longueur.
- `channels.nextcloud-talk.blockStreaming` : désactiver le streaming par blocs pour ce canal.
- `channels.nextcloud-talk.blockStreamingCoalesce` : réglage de la coalescence du streaming par blocs.
- `channels.nextcloud-talk.mediaMaxMb` : plafond des médias entrants (Mo).

## Connexe

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification des messages directs et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement de discussion de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
