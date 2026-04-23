---
read_when:
    - Travail sur les fonctionnalités Telegram ou les Webhook
summary: État de la prise en charge du bot Telegram, capacités et configuration
title: Telegram
x-i18n:
    generated_at: "2026-04-23T06:59:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2073245079eb48b599c4274cc620eb29211a64c5d396ffb355f7022fecec9a6
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (API Bot)

Statut : prêt pour la production pour les messages privés de bot + les groupes via grammY. Le long polling est le mode par défaut ; le mode Webhook est facultatif.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/fr/channels/pairing">
    La politique par défaut des messages privés pour Telegram est le Pairing.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics inter-canaux et procédures de réparation.
  </Card>
  <Card title="Configuration du Gateway" icon="settings" href="/fr/gateway/configuration">
    Modèles complets de configuration des canaux et exemples.
  </Card>
</CardGroup>

## Configuration rapide

<Steps>
  <Step title="Créer le token du bot dans BotFather">
    Ouvrez Telegram et discutez avec **@BotFather** (vérifiez que l’identifiant est exactement `@BotFather`).

    Exécutez `/newbot`, suivez les invites et enregistrez le token.

  </Step>

  <Step title="Configurer le token et la politique des messages privés">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    Variable d’environnement de repli : `TELEGRAM_BOT_TOKEN=...` (compte par défaut uniquement).
    Telegram n’utilise **pas** `openclaw channels login telegram` ; configurez le token dans la config/l’environnement, puis démarrez le Gateway.

  </Step>

  <Step title="Démarrer le Gateway et approuver le premier message privé">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Les codes de Pairing expirent après 1 heure.

  </Step>

  <Step title="Ajouter le bot à un groupe">
    Ajoutez le bot à votre groupe, puis définissez `channels.telegram.groups` et `groupPolicy` pour correspondre à votre modèle d’accès.
  </Step>
</Steps>

<Note>
L’ordre de résolution des tokens tient compte du compte. En pratique, les valeurs de configuration priment sur la variable d’environnement de repli, et `TELEGRAM_BOT_TOKEN` ne s’applique qu’au compte par défaut.
</Note>

## Paramètres côté Telegram

<AccordionGroup>
  <Accordion title="Mode confidentialité et visibilité dans les groupes">
    Les bots Telegram utilisent par défaut le **mode confidentialité**, ce qui limite les messages de groupe qu’ils reçoivent.

    Si le bot doit voir tous les messages du groupe, soit :

    - désactivez le mode confidentialité via `/setprivacy`, soit
    - faites du bot un administrateur du groupe.

    Lorsque vous modifiez le mode confidentialité, supprimez puis rajoutez le bot dans chaque groupe afin que Telegram applique le changement.

  </Accordion>

  <Accordion title="Autorisations de groupe">
    Le statut d’administrateur se contrôle dans les paramètres du groupe Telegram.

    Les bots administrateurs reçoivent tous les messages du groupe, ce qui est utile pour un comportement de groupe toujours actif.

  </Accordion>

  <Accordion title="Options utiles de BotFather">

    - `/setjoingroups` pour autoriser/refuser l’ajout à des groupes
    - `/setprivacy` pour le comportement de visibilité dans les groupes

  </Accordion>
</AccordionGroup>

## Contrôle d’accès et activation

<Tabs>
  <Tab title="Politique des messages privés">
    `channels.telegram.dmPolicy` contrôle l’accès aux messages directs :

    - `pairing` (par défaut)
    - `allowlist` (nécessite au moins un ID d’expéditeur dans `allowFrom`)
    - `open` (nécessite que `allowFrom` inclue `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` accepte des ID d’utilisateurs Telegram numériques. Les préfixes `telegram:` / `tg:` sont acceptés et normalisés.
    `dmPolicy: "allowlist"` avec un `allowFrom` vide bloque tous les messages privés et est rejeté par la validation de configuration.
    La configuration ne demande que des ID utilisateur numériques.
    Si vous avez effectué une mise à niveau et que votre configuration contient des entrées de liste d’autorisation `@username`, exécutez `openclaw doctor --fix` pour les résoudre (au mieux ; nécessite un token de bot Telegram).
    Si vous vous reposiez auparavant sur des fichiers de liste d’autorisation du magasin de Pairing, `openclaw doctor --fix` peut récupérer les entrées dans `channels.telegram.allowFrom` dans les flux allowlist (par exemple lorsque `dmPolicy: "allowlist"` n’a encore aucun ID explicite).

    Pour les bots à propriétaire unique, préférez `dmPolicy: "allowlist"` avec des ID `allowFrom` numériques explicites pour garder une politique d’accès durable dans la configuration (au lieu de dépendre d’approbations de Pairing précédentes).

    Confusion fréquente : l’approbation du Pairing en message privé ne signifie pas « cet expéditeur est autorisé partout ».
    Le Pairing accorde uniquement l’accès aux messages privés. L’autorisation des expéditeurs dans les groupes provient toujours de listes d’autorisation explicites dans la configuration.
    Si vous voulez « je suis autorisé une fois et les messages privés comme les commandes de groupe fonctionnent », placez votre ID utilisateur Telegram numérique dans `channels.telegram.allowFrom`.

    ### Trouver votre ID utilisateur Telegram

    Plus sûr (sans bot tiers) :

    1. Envoyez un message privé à votre bot.
    2. Exécutez `openclaw logs --follow`.
    3. Lisez `from.id`.

    Méthode officielle de l’API Bot :

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Méthode tierce (moins privée) : `@userinfobot` ou `@getidsbot`.

  </Tab>

  <Tab title="Politique de groupe et listes d’autorisation">
    Deux contrôles s’appliquent ensemble :

    1. **Quels groupes sont autorisés** (`channels.telegram.groups`)
       - pas de configuration `groups` :
         - avec `groupPolicy: "open"` : n’importe quel groupe peut passer les vérifications d’ID de groupe
         - avec `groupPolicy: "allowlist"` (par défaut) : les groupes sont bloqués jusqu’à ce que vous ajoutiez des entrées `groups` (ou `"*"`)
       - `groups` configuré : agit comme liste d’autorisation (ID explicites ou `"*"`)

    2. **Quels expéditeurs sont autorisés dans les groupes** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (par défaut)
       - `disabled`

    `groupAllowFrom` est utilisé pour le filtrage des expéditeurs dans les groupes. S’il n’est pas défini, Telegram utilise `allowFrom` comme repli.
    Les entrées `groupAllowFrom` doivent être des ID d’utilisateurs Telegram numériques (les préfixes `telegram:` / `tg:` sont normalisés).
    Ne mettez pas d’ID de chat de groupe ou de supergroupe Telegram dans `groupAllowFrom`. Les ID de chat négatifs doivent être placés sous `channels.telegram.groups`.
    Les entrées non numériques sont ignorées pour l’autorisation des expéditeurs.
    Limite de sécurité (`2026.2.25+`) : l’authentification des expéditeurs de groupe n’hérite **pas** des approbations du magasin de Pairing pour les messages privés.
    Le Pairing reste réservé aux messages privés. Pour les groupes, définissez `groupAllowFrom` ou `allowFrom` par groupe/par sujet.
    Si `groupAllowFrom` n’est pas défini, Telegram utilise `allowFrom` de la configuration comme repli, pas le magasin de Pairing.
    Modèle pratique pour les bots à propriétaire unique : définissez votre ID utilisateur dans `channels.telegram.allowFrom`, laissez `groupAllowFrom` non défini et autorisez les groupes cibles sous `channels.telegram.groups`.
    Note d’exécution : si `channels.telegram` est complètement absent, les valeurs par défaut d’exécution utilisent le mode fail-closed avec `groupPolicy="allowlist"` sauf si `channels.defaults.groupPolicy` est explicitement défini.

    Exemple : autoriser n’importe quel membre dans un groupe spécifique :

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    Exemple : autoriser seulement certains utilisateurs dans un groupe spécifique :

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      Erreur fréquente : `groupAllowFrom` n’est pas une liste d’autorisation de groupes Telegram.

      - Placez les ID de groupe ou de supergroupe Telegram négatifs comme `-1001234567890` sous `channels.telegram.groups`.
      - Placez les ID d’utilisateurs Telegram comme `8734062810` sous `groupAllowFrom` lorsque vous voulez limiter les personnes à l’intérieur d’un groupe autorisé qui peuvent déclencher le bot.
      - Utilisez `groupAllowFrom: ["*"]` uniquement lorsque vous voulez que n’importe quel membre d’un groupe autorisé puisse parler au bot.
    </Warning>

  </Tab>

  <Tab title="Comportement des mentions">
    Les réponses en groupe nécessitent une mention par défaut.

    Une mention peut provenir :

    - d’une mention native `@botusername`, ou
    - de motifs de mention dans :
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Basculements de commande au niveau de la session :

    - `/activation always`
    - `/activation mention`

    Ceux-ci mettent à jour uniquement l’état de la session. Utilisez la configuration pour la persistance.

    Exemple de configuration persistante :

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    Obtenir l’ID de chat du groupe :

    - transférez un message du groupe à `@userinfobot` / `@getidsbot`
    - ou lisez `chat.id` dans `openclaw logs --follow`
    - ou inspectez `getUpdates` de l’API Bot

  </Tab>
</Tabs>

## Comportement à l’exécution

- Telegram est géré par le processus Gateway.
- Le routage est déterministe : les réponses entrantes de Telegram repartent vers Telegram (le modèle ne choisit pas les canaux).
- Les messages entrants sont normalisés dans l’enveloppe de canal partagée avec des métadonnées de réponse et des espaces réservés pour les médias.
- Les sessions de groupe sont isolées par ID de groupe. Les sujets de forum ajoutent `:topic:<threadId>` afin de garder les sujets isolés.
- Les messages privés peuvent contenir `message_thread_id` ; OpenClaw les route avec des clés de session tenant compte des fils et préserve l’ID de fil pour les réponses.
- Le long polling utilise le runner grammY avec un séquencement par chat/par fil. La concurrence globale du sink du runner utilise `agents.defaults.maxConcurrent`.
- Les redémarrages du watchdog de long polling se déclenchent après 120 secondes sans signe de vie `getUpdates` terminé par défaut. Augmentez `channels.telegram.pollingStallThresholdMs` uniquement si votre déploiement observe encore de faux redémarrages pour blocage du polling pendant des travaux de longue durée. La valeur est en millisecondes et autorisée de `30000` à `600000` ; les surcharges par compte sont prises en charge.
- L’API Bot de Telegram n’a pas de prise en charge des accusés de lecture (`sendReadReceipts` ne s’applique pas).

## Référence des fonctionnalités

<AccordionGroup>
  <Accordion title="Aperçu du streaming en direct (modifications de messages)">
    OpenClaw peut diffuser des réponses partielles en temps réel :

    - discussions directes : message d’aperçu + `editMessageText`
    - groupes/sujets : message d’aperçu + `editMessageText`

    Exigence :

    - `channels.telegram.streaming` vaut `off | partial | block | progress` (par défaut : `partial`)
    - `progress` correspond à `partial` sur Telegram (compatibilité avec la dénomination inter-canaux)
    - `streaming.preview.toolProgress` contrôle si les mises à jour d’outil/progression réutilisent le même message d’aperçu modifié (par défaut : `true`). Définissez `false` pour conserver des messages d’outil/progression séparés.
    - les anciennes valeurs booléennes `channels.telegram.streamMode` et `streaming` sont mappées automatiquement

    Pour les réponses textuelles uniquement :

    - message privé : OpenClaw conserve le même message d’aperçu et effectue une modification finale sur place (pas de second message)
    - groupe/sujet : OpenClaw conserve le même message d’aperçu et effectue une modification finale sur place (pas de second message)

    Pour les réponses complexes (par exemple les charges utiles média), OpenClaw revient à la livraison finale normale puis nettoie le message d’aperçu.

    Le streaming d’aperçu est distinct du streaming par blocs. Lorsque le streaming par blocs est explicitement activé pour Telegram, OpenClaw ignore le flux d’aperçu pour éviter un double streaming.

    Si le transport de brouillon natif est indisponible/rejeté, OpenClaw revient automatiquement à `sendMessage` + `editMessageText`.

    Flux de raisonnement réservé à Telegram :

    - `/reasoning stream` envoie le raisonnement vers l’aperçu en direct pendant la génération
    - la réponse finale est envoyée sans texte de raisonnement

  </Accordion>

  <Accordion title="Mise en forme et repli HTML">
    Le texte sortant utilise `parse_mode: "HTML"` de Telegram.

    - Le texte de type Markdown est rendu en HTML sûr pour Telegram.
    - Le HTML brut du modèle est échappé pour réduire les échecs d’analyse Telegram.
    - Si Telegram rejette le HTML analysé, OpenClaw réessaie en texte brut.

    Les aperçus de liens sont activés par défaut et peuvent être désactivés avec `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Commandes natives et commandes personnalisées">
    L’enregistrement du menu de commandes Telegram est géré au démarrage avec `setMyCommands`.

    Paramètres par défaut des commandes natives :

    - `commands.native: "auto"` active les commandes natives pour Telegram

    Ajoutez des entrées de menu de commande personnalisées :

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Sauvegarde Git" },
        { command: "generate", description: "Créer une image" },
      ],
    },
  },
}
```

    Règles :

    - les noms sont normalisés (suppression du `/` initial, minuscules)
    - motif valide : `a-z`, `0-9`, `_`, longueur `1..32`
    - les commandes personnalisées ne peuvent pas remplacer les commandes natives
    - les conflits/doublons sont ignorés et consignés dans les journaux

    Remarques :

    - les commandes personnalisées sont uniquement des entrées de menu ; elles n’implémentent pas automatiquement de comportement
    - les commandes de Plugin/Skills peuvent toujours fonctionner lorsqu’elles sont saisies, même si elles ne sont pas affichées dans le menu Telegram

    Si les commandes natives sont désactivées, les commandes intégrées sont supprimées. Les commandes personnalisées/de Plugin peuvent toujours s’enregistrer si elles sont configurées.

    Échecs de configuration courants :

    - `setMyCommands failed` avec `BOT_COMMANDS_TOO_MUCH` signifie que le menu Telegram dépasse encore la limite après réduction ; réduisez les commandes de Plugin/Skills/personnalisées ou désactivez `channels.telegram.commands.native`.
    - `setMyCommands failed` avec des erreurs réseau/fetch signifie généralement que le DNS/HTTPS sortant vers `api.telegram.org` est bloqué.

    ### Commandes de Pairing d’appareil (plugin `device-pair`)

    Lorsque le plugin `device-pair` est installé :

    1. `/pair` génère un code de configuration
    2. collez le code dans l’app iOS
    3. `/pair pending` liste les requêtes en attente (y compris rôle/scopes)
    4. approuvez la requête :
       - `/pair approve <requestId>` pour une approbation explicite
       - `/pair approve` lorsqu’il n’y a qu’une seule requête en attente
       - `/pair approve latest` pour la plus récente

    Le code de configuration transporte un token bootstrap à courte durée de vie. Le transfert bootstrap intégré conserve le token du Node principal à `scopes: []` ; tout token opérateur transmis reste limité à `operator.approvals`, `operator.read`, `operator.talk.secrets` et `operator.write`. Les vérifications de scope bootstrap sont préfixées par rôle, donc cette liste d’autorisation opérateur ne satisfait que les requêtes opérateur ; les rôles non opérateur nécessitent toujours des scopes sous leur propre préfixe de rôle.

    Si un appareil réessaie avec des détails d’authentification modifiés (par exemple rôle/scopes/clé publique), la requête précédente en attente est remplacée et la nouvelle requête utilise un `requestId` différent. Relancez `/pair pending` avant d’approuver.

    Plus de détails : [Pairing](/fr/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Boutons inline">
    Configurez la portée du clavier inline :

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    Surcharge par compte :

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    Portées :

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (par défaut)

    L’ancien `capabilities: ["inlineButtons"]` correspond à `inlineButtons: "all"`.

    Exemple d’action de message :

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    Les clics de rappel sont transmis à l’agent sous forme de texte :
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Actions de message Telegram pour les agents et l’automatisation">
    Les actions d’outil Telegram comprennent :

    - `sendMessage` (`to`, `content`, `mediaUrl`, `replyToMessageId`, `messageThreadId` facultatifs)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, `iconColor`, `iconCustomEmojiId` facultatifs)

    Les actions de message de canal exposent des alias ergonomiques (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Contrôles de filtrage :

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (désactivé par défaut)

    Remarque : `edit` et `topic-create` sont actuellement activés par défaut et n’ont pas de bascules `channels.telegram.actions.*` distinctes.
    Les envois à l’exécution utilisent l’instantané actif de configuration/secrets (démarrage/rechargement), donc les chemins d’action n’effectuent pas de re-résolution ad hoc de SecretRef à chaque envoi.

    Sémantique de suppression des réactions : [/tools/reactions](/fr/tools/reactions)

  </Accordion>

  <Accordion title="Balises de fil de réponse">
    Telegram prend en charge des balises explicites de fil de réponse dans la sortie générée :

    - `[[reply_to_current]]` répond au message déclencheur
    - `[[reply_to:<id>]]` répond à un ID de message Telegram spécifique

    `channels.telegram.replyToMode` contrôle le traitement :

    - `off` (par défaut)
    - `first`
    - `all`

    Remarque : `off` désactive le fil de réponse implicite. Les balises explicites `[[reply_to_*]]` sont toujours respectées.

  </Accordion>

  <Accordion title="Sujets de forum et comportement des fils">
    Supergroupes de forum :

    - les clés de session de sujet ajoutent `:topic:<threadId>`
    - les réponses et indicateurs de saisie ciblent le fil du sujet
    - chemin de configuration du sujet :
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Cas particulier du sujet général (`threadId=1`) :

    - les envois de messages omettent `message_thread_id` (Telegram rejette `sendMessage(...thread_id=1)`)
    - les actions de saisie incluent toujours `message_thread_id`

    Héritage des sujets : les entrées de sujet héritent des paramètres du groupe sauf surcharge (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` est propre au sujet et n’hérite pas des paramètres par défaut du groupe.

    **Routage d’agent par sujet** : chaque sujet peut router vers un agent différent en définissant `agentId` dans la configuration du sujet. Cela donne à chaque sujet son propre espace de travail, sa mémoire et sa session isolés. Exemple :

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Sujet général → agent principal
                "3": { agentId: "zu" },        // Sujet dev → agent zu
                "5": { agentId: "coder" }      // Revue de code → agent coder
              }
            }
          }
        }
      }
    }
    ```

    Chaque sujet possède alors sa propre clé de session : `agent:zu:telegram:group:-1001234567890:topic:3`

    **Liaison persistante de sujet ACP** : les sujets de forum peuvent épingler des sessions de harnais ACP via des liaisons ACP typées de premier niveau :

    - `bindings[]` avec `type: "acp"` et `match.channel: "telegram"`

    Exemple :

    ```json5
    {
      agents: {
        list: [
          {
            id: "codex",
            runtime: {
              type: "acp",
              acp: {
                agent: "codex",
                backend: "acpx",
                mode: "persistent",
                cwd: "/workspace/openclaw",
              },
            },
          },
        ],
      },
      bindings: [
        {
          type: "acp",
          agentId: "codex",
          match: {
            channel: "telegram",
            accountId: "default",
            peer: { kind: "group", id: "-1001234567890:topic:42" },
          },
        },
      ],
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "42": {
                  requireMention: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Cela est actuellement limité aux sujets de forum dans les groupes et supergroupes.

    **Création ACP liée à un fil depuis le chat** :

    - `/acp spawn <agent> --thread here|auto` peut lier le sujet Telegram actuel à une nouvelle session ACP.
    - Les messages suivants du sujet sont routés directement vers la session ACP liée (pas de `/acp steer` requis).
    - OpenClaw épingle le message de confirmation de création dans le sujet après une liaison réussie.
    - Nécessite `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Le contexte de modèle inclut :

    - `MessageThreadId`
    - `IsForum`

    Comportement des fils en message privé :

    - les discussions privées avec `message_thread_id` conservent le routage de message privé mais utilisent des clés de session et cibles de réponse tenant compte des fils.

  </Accordion>

  <Accordion title="Audio, vidéo et stickers">
    ### Messages audio

    Telegram distingue les notes vocales et les fichiers audio.

    - par défaut : comportement de fichier audio
    - balise `[[audio_as_voice]]` dans la réponse de l’agent pour forcer l’envoi comme note vocale

    Exemple d’action de message :

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### Messages vidéo

    Telegram distingue les fichiers vidéo et les notes vidéo.

    Exemple d’action de message :

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Les notes vidéo ne prennent pas en charge les légendes ; le texte de message fourni est envoyé séparément.

    ### Stickers

    Gestion des stickers entrants :

    - WEBP statique : téléchargé et traité (espace réservé `<media:sticker>`)
    - TGS animé : ignoré
    - WEBM vidéo : ignoré

    Champs de contexte du sticker :

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Fichier de cache des stickers :

    - `~/.openclaw/telegram/sticker-cache.json`

    Les stickers sont décrits une fois (quand c’est possible) puis mis en cache pour réduire les appels répétés à la vision.

    Activer les actions de sticker :

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    Action d’envoi de sticker :

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Rechercher des stickers en cache :

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Notifications de réaction">
    Les réactions Telegram arrivent sous forme de mises à jour `message_reaction` (séparées des charges utiles de message).

    Lorsqu’elles sont activées, OpenClaw met en file d’attente des événements système comme :

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuration :

    - `channels.telegram.reactionNotifications`: `off | own | all` (par défaut : `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (par défaut : `minimal`)

    Remarques :

    - `own` signifie les réactions utilisateur uniquement sur les messages envoyés par le bot (au mieux via le cache des messages envoyés).
    - Les événements de réaction respectent toujours les contrôles d’accès Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) ; les expéditeurs non autorisés sont rejetés.
    - Telegram ne fournit pas d’ID de fil dans les mises à jour de réaction.
      - les groupes non forum sont routés vers la session de discussion de groupe
      - les groupes de forum sont routés vers la session du sujet général du groupe (`:topic:1`), pas vers le sujet d’origine exact

    `allowed_updates` pour polling/Webhook inclut automatiquement `message_reaction`.

  </Accordion>

  <Accordion title="Réactions d’accusé de réception">
    `ackReaction` envoie un emoji d’accusé de réception pendant qu’OpenClaw traite un message entrant.

    Ordre de résolution :

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - repli sur l’emoji d’identité de l’agent (`agents.list[].identity.emoji`, sinon "👀")

    Remarques :

    - Telegram attend un emoji unicode (par exemple "👀").
    - Utilisez `""` pour désactiver la réaction pour un canal ou un compte.

  </Accordion>

  <Accordion title="Écritures de configuration depuis les événements et commandes Telegram">
    Les écritures de configuration de canal sont activées par défaut (`configWrites !== false`).

    Les écritures déclenchées par Telegram incluent :

    - les événements de migration de groupe (`migrate_to_chat_id`) pour mettre à jour `channels.telegram.groups`
    - `/config set` et `/config unset` (nécessite l’activation des commandes)

    Désactiver :

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Autorisation du sélecteur de modèle dans les groupes">
    Les boutons inline du sélecteur de modèle en groupe nécessitent la même autorisation que `/models`. Les participants non autorisés peuvent parcourir et toucher les boutons, mais OpenClaw rejette le rappel avant de modifier le modèle de session.
  </Accordion>

  <Accordion title="Long polling ou Webhook">
    Par défaut : long polling.

    Mode Webhook :

    - définissez `channels.telegram.webhookUrl`
    - définissez `channels.telegram.webhookSecret` (obligatoire lorsque l’URL Webhook est définie)
    - `channels.telegram.webhookPath` facultatif (par défaut `/telegram-webhook`)
    - `channels.telegram.webhookHost` facultatif (par défaut `127.0.0.1`)
    - `channels.telegram.webhookPort` facultatif (par défaut `8787`)

    L’écouteur local par défaut pour le mode Webhook se lie à `127.0.0.1:8787`.

    Si votre point de terminaison public est différent, placez un proxy inverse devant et faites pointer `webhookUrl` vers l’URL publique.
    Définissez `webhookHost` (par exemple `0.0.0.0`) lorsque vous avez intentionnellement besoin d’une entrée externe.

    Le rappel Webhook grammY renvoie un 200 en moins de 5 secondes afin que Telegram ne relance pas les mises à jour longues comme délais d’attente de lecture ; le traitement plus long continue en arrière-plan. Le polling reconstruit le transport HTTP après les conflits `getUpdates` 409, de sorte que les nouvelles tentatives utilisent une connexion TCP fraîche au lieu de boucler sur un socket keep-alive fermé par Telegram.

  </Accordion>

  <Accordion title="Limites, nouvelles tentatives et cibles CLI">
    - la valeur par défaut de `channels.telegram.textChunkLimit` est 4000.
    - `channels.telegram.chunkMode="newline"` privilégie les frontières de paragraphe (lignes vides) avant le découpage par longueur.
    - `channels.telegram.mediaMaxMb` (par défaut 100) limite la taille des médias Telegram entrants et sortants.
    - `channels.telegram.timeoutSeconds` surcharge le délai d’attente du client API Telegram (si non défini, la valeur par défaut de grammY s’applique).
    - `channels.telegram.pollingStallThresholdMs` a pour valeur par défaut `120000` ; ajustez uniquement entre `30000` et `600000` pour les faux positifs de redémarrage pour blocage du polling.
    - l’historique du contexte de groupe utilise `channels.telegram.historyLimit` ou `messages.groupChat.historyLimit` (par défaut 50) ; `0` désactive.
    - le contexte supplémentaire reply/quote/forward est actuellement transmis tel que reçu.
    - les listes d’autorisation Telegram contrôlent principalement qui peut déclencher l’agent, pas une limite complète de masquage du contexte supplémentaire.
    - contrôles d’historique des messages privés :
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - la configuration `channels.telegram.retry` s’applique aux helpers d’envoi Telegram (CLI/outils/actions) pour les erreurs d’API sortantes récupérables.

    La cible d’envoi CLI peut être un ID de chat numérique ou un nom d’utilisateur :

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Les sondages Telegram utilisent `openclaw message poll` et prennent en charge les sujets de forum :

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Indicateurs de sondage propres à Telegram :

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` pour les sujets de forum (ou utilisez une cible `:topic:`)

    L’envoi Telegram prend aussi en charge :

    - `--presentation` avec des blocs `buttons` pour les claviers inline lorsque `channels.telegram.capabilities.inlineButtons` l’autorise
    - `--pin` ou `--delivery '{"pin":true}'` pour demander une livraison épinglée lorsque le bot peut épingler dans ce chat
    - `--force-document` pour envoyer les images et GIF sortants comme documents au lieu de téléchargements photo compressés ou médias animés

    Filtrage des actions :

    - `channels.telegram.actions.sendMessage=false` désactive les messages Telegram sortants, y compris les sondages
    - `channels.telegram.actions.poll=false` désactive la création de sondages Telegram tout en laissant les envois ordinaires activés

  </Accordion>

  <Accordion title="Approbations exec dans Telegram">
    Telegram prend en charge les approbations exec dans les messages privés des approbateurs et peut éventuellement publier des invites d’approbation dans le chat ou le sujet d’origine.

    Chemin de configuration :

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (facultatif ; utilise en repli les ID propriétaires numériques déduits de `allowFrom` et de `defaultTo` direct lorsque possible)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, par défaut : `dm`)
    - `agentFilter`, `sessionFilter`

    Les approbateurs doivent être des ID d’utilisateurs Telegram numériques. Telegram active automatiquement les approbations exec natives lorsque `enabled` n’est pas défini ou vaut `"auto"` et qu’au moins un approbateur peut être résolu, soit depuis `execApprovals.approvers`, soit depuis la configuration propriétaire numérique du compte (`allowFrom` et `defaultTo` en message direct). Définissez `enabled: false` pour désactiver explicitement Telegram comme client d’approbation natif. Sinon, les demandes d’approbation basculent vers d’autres routes d’approbation configurées ou vers la politique de repli des approbations exec.

    Telegram affiche aussi les boutons d’approbation partagés utilisés par d’autres canaux de chat. L’adaptateur Telegram natif ajoute principalement le routage des messages privés des approbateurs, la diffusion vers les canaux/sujets et les indices de saisie avant la livraison.
    Lorsque ces boutons sont présents, ils constituent l’interface principale d’approbation ; OpenClaw
    ne doit inclure une commande `/approve` manuelle que lorsque le résultat de l’outil indique
    que les approbations de chat ne sont pas disponibles ou que l’approbation manuelle est la seule voie.

    Règles de livraison :

    - `target: "dm"` envoie les invites d’approbation uniquement aux messages privés des approbateurs résolus
    - `target: "channel"` renvoie l’invite vers le chat/sujet Telegram d’origine
    - `target: "both"` envoie vers les messages privés des approbateurs et vers le chat/sujet d’origine

    Seuls les approbateurs résolus peuvent approuver ou refuser. Les non-approbateurs ne peuvent pas utiliser `/approve` ni les boutons d’approbation Telegram.

    Comportement de résolution des approbations :

    - les ID préfixés par `plugin:` sont toujours résolus via les approbations de Plugin.
    - les autres ID essaient d’abord `exec.approval.resolve`.
    - si Telegram est aussi autorisé pour les approbations de Plugin et que le Gateway indique
      que l’approbation exec est inconnue/expirée, Telegram réessaie une fois via
      `plugin.approval.resolve`.
    - les refus/erreurs réels d’approbation exec ne basculent pas silencieusement vers la
      résolution d’approbation de Plugin.

    La livraison par canal affiche le texte de commande dans le chat ; activez donc `channel` ou `both` uniquement dans des groupes/sujets de confiance. Lorsque l’invite arrive dans un sujet de forum, OpenClaw préserve le sujet à la fois pour l’invite d’approbation et pour le suivi après approbation. Les approbations exec expirent après 30 minutes par défaut.

    Les boutons d’approbation inline dépendent aussi de `channels.telegram.capabilities.inlineButtons` autorisant la surface cible (`dm`, `group` ou `all`).

    Documentation associée : [Approbations exec](/fr/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Contrôles des réponses d’erreur

Lorsque l’agent rencontre une erreur de livraison ou de fournisseur, Telegram peut soit répondre avec le texte d’erreur, soit le supprimer. Deux clés de configuration contrôlent ce comportement :

| Clé                                 | Valeurs           | Par défaut | Description                                                                                     |
| ----------------------------------- | ----------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply` envoie un message d’erreur convivial dans le chat. `silent` supprime entièrement les réponses d’erreur. |
| `channels.telegram.errorCooldownMs` | nombre (ms)       | `60000`    | Délai minimal entre les réponses d’erreur vers le même chat. Empêche le spam d’erreurs pendant les pannes. |

Les surcharges par compte, par groupe et par sujet sont prises en charge (même héritage que les autres clés de configuration Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // supprime les erreurs dans ce groupe
        },
      },
    },
  },
}
```

## Dépannage

<AccordionGroup>
  <Accordion title="Le bot ne répond pas aux messages de groupe sans mention">

    - Si `requireMention=false`, le mode confidentialité de Telegram doit autoriser une visibilité complète.
      - BotFather : `/setprivacy` -> Disable
      - puis supprimez + rajoutez le bot au groupe
    - `openclaw channels status` avertit lorsque la configuration attend des messages de groupe sans mention.
    - `openclaw channels status --probe` peut vérifier des ID de groupe numériques explicites ; le joker `"*"` ne peut pas être sondé pour l’appartenance.
    - test rapide de session : `/activation always`.

  </Accordion>

  <Accordion title="Le bot ne voit pas du tout les messages de groupe">

    - lorsque `channels.telegram.groups` existe, le groupe doit être listé (ou inclure `"*"`)
    - vérifiez l’appartenance du bot au groupe
    - examinez les journaux : `openclaw logs --follow` pour les raisons d’ignorance

  </Accordion>

  <Accordion title="Les commandes fonctionnent partiellement ou pas du tout">

    - autorisez votre identité d’expéditeur (Pairing et/ou `allowFrom` numérique)
    - l’autorisation des commandes s’applique toujours même lorsque la politique de groupe est `open`
    - `setMyCommands failed` avec `BOT_COMMANDS_TOO_MUCH` signifie que le menu natif contient trop d’entrées ; réduisez les commandes de Plugin/Skills/personnalisées ou désactivez les menus natifs
    - `setMyCommands failed` avec des erreurs réseau/fetch indique généralement des problèmes d’accessibilité DNS/HTTPS vers `api.telegram.org`

  </Accordion>

  <Accordion title="Instabilité du polling ou du réseau">

    - Node 22+ + fetch/proxy personnalisé peut déclencher un comportement d’abandon immédiat si les types AbortSignal ne correspondent pas.
    - Certains hôtes résolvent `api.telegram.org` d’abord en IPv6 ; une sortie IPv6 défaillante peut provoquer des défaillances intermittentes de l’API Telegram.
    - Si les journaux incluent `TypeError: fetch failed` ou `Network request for 'getUpdates' failed!`, OpenClaw les réessaie maintenant comme erreurs réseau récupérables.
    - Si les journaux incluent `Polling stall detected`, OpenClaw redémarre le polling et reconstruit le transport Telegram après 120 secondes sans signe de vie de long polling terminé par défaut.
    - Augmentez `channels.telegram.pollingStallThresholdMs` uniquement lorsque les appels `getUpdates` de longue durée sont sains mais que votre hôte signale encore de faux redémarrages pour blocage du polling. Les blocages persistants indiquent généralement des problèmes de proxy, DNS, IPv6 ou de sortie TLS entre l’hôte et `api.telegram.org`.
    - Sur les hôtes VPS avec sortie directe/TLS instable, faites passer les appels API Telegram via `channels.telegram.proxy` :

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ utilise par défaut `autoSelectFamily=true` (sauf WSL2) et `dnsResultOrder=ipv4first`.
    - Si votre hôte est WSL2 ou fonctionne explicitement mieux avec un comportement IPv4 uniquement, forcez la sélection de famille :

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Les réponses de plage de benchmark RFC 2544 (`198.18.0.0/15`) sont déjà autorisées
      par défaut pour les téléchargements de médias Telegram. Si un faux IP de confiance ou un
      proxy transparent réécrit `api.telegram.org` vers une autre adresse
      privée/interne/à usage spécial pendant les téléchargements de médias, vous pouvez
      activer le contournement propre à Telegram :

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - La même activation optionnelle est disponible par compte à
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Si votre proxy résout les hôtes média Telegram en `198.18.x.x`, laissez d’abord le
      drapeau dangereux désactivé. Les médias Telegram autorisent déjà par défaut la plage
      de benchmark RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` affaiblit les protections SSRF des
      médias Telegram. Utilisez-le uniquement pour des environnements de proxy de confiance
      contrôlés par l’opérateur, comme le routage en faux IP de Clash, Mihomo ou Surge lorsqu’ils
      synthétisent des réponses privées ou à usage spécial hors de la plage de benchmark RFC 2544.
      Laissez-le désactivé pour un accès Telegram normal sur l’internet public.
    </Warning>

    - Surcharges d’environnement (temporaires) :
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Validez les réponses DNS :

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Plus d’aide : [Dépannage des canaux](/fr/channels/troubleshooting).

## Pointeurs de référence de configuration Telegram

Référence principale :

- `channels.telegram.enabled` : active/désactive le démarrage du canal.
- `channels.telegram.botToken` : token du bot (BotFather).
- `channels.telegram.tokenFile` : lit le token depuis un chemin de fichier ordinaire. Les liens symboliques sont rejetés.
- `channels.telegram.dmPolicy` : `pairing | allowlist | open | disabled` (par défaut : pairing).
- `channels.telegram.allowFrom` : liste d’autorisation des messages privés (ID d’utilisateurs Telegram numériques). `allowlist` exige au moins un ID d’expéditeur. `open` exige `"*"`. `openclaw doctor --fix` peut résoudre les anciennes entrées `@username` en ID et peut récupérer les entrées de liste d’autorisation depuis des fichiers du magasin de Pairing dans les flux de migration allowlist.
- `channels.telegram.actions.poll` : active ou désactive la création de sondages Telegram (activé par défaut ; nécessite toujours `sendMessage`).
- `channels.telegram.defaultTo` : cible Telegram par défaut utilisée par le CLI `--deliver` lorsqu’aucun `--reply-to` explicite n’est fourni.
- `channels.telegram.groupPolicy` : `open | allowlist | disabled` (par défaut : allowlist).
- `channels.telegram.groupAllowFrom` : liste d’autorisation des expéditeurs de groupe (ID d’utilisateurs Telegram numériques). `openclaw doctor --fix` peut résoudre les anciennes entrées `@username` en ID. Les entrées non numériques sont ignorées au moment de l’authentification. L’authentification de groupe n’utilise pas le repli du magasin de Pairing des messages privés (`2026.2.25+`).
- Priorité multi-comptes :
  - Lorsque deux ID de compte ou plus sont configurés, définissez `channels.telegram.defaultAccount` (ou incluez `channels.telegram.accounts.default`) pour rendre le routage par défaut explicite.
  - Si aucun des deux n’est défini, OpenClaw utilise en repli le premier ID de compte normalisé et `openclaw doctor` affiche un avertissement.
  - `channels.telegram.accounts.default.allowFrom` et `channels.telegram.accounts.default.groupAllowFrom` s’appliquent uniquement au compte `default`.
  - Les comptes nommés héritent de `channels.telegram.allowFrom` et `channels.telegram.groupAllowFrom` lorsque les valeurs au niveau du compte ne sont pas définies.
  - Les comptes nommés n’héritent pas de `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups` : valeurs par défaut par groupe + liste d’autorisation (utilisez `"*"` pour les valeurs par défaut globales).
  - `channels.telegram.groups.<id>.groupPolicy` : surcharge par groupe de `groupPolicy` (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention` : valeur par défaut du filtrage par mention.
  - `channels.telegram.groups.<id>.skills` : filtre Skills (omis = tous les Skills, vide = aucun).
  - `channels.telegram.groups.<id>.allowFrom` : surcharge de liste d’autorisation des expéditeurs par groupe.
  - `channels.telegram.groups.<id>.systemPrompt` : prompt système supplémentaire pour le groupe.
  - `channels.telegram.groups.<id>.enabled` : désactive le groupe lorsque `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*` : surcharges par sujet (champs de groupe + `agentId` propre au sujet).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId` : route ce sujet vers un agent spécifique (remplace le routage au niveau du groupe et via binding).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy` : surcharge par sujet de `groupPolicy` (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention` : surcharge par sujet du filtrage par mention.
- `bindings[]` de niveau supérieur avec `type: "acp"` et l’ID canonique de sujet `chatId:topic:topicId` dans `match.peer.id` : champs de liaison persistante de sujet ACP (voir [ACP Agents](/fr/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId` : route les sujets de messages privés vers un agent spécifique (même comportement que les sujets de forum).
- `channels.telegram.execApprovals.enabled` : active Telegram comme client d’approbation exec basé sur le chat pour ce compte.
- `channels.telegram.execApprovals.approvers` : ID d’utilisateurs Telegram autorisés à approuver ou refuser les requêtes exec. Facultatif lorsque `channels.telegram.allowFrom` ou un `channels.telegram.defaultTo` direct identifie déjà le propriétaire.
- `channels.telegram.execApprovals.target` : `dm | channel | both` (par défaut : `dm`). `channel` et `both` préservent le sujet Telegram d’origine lorsqu’il est présent.
- `channels.telegram.execApprovals.agentFilter` : filtre facultatif d’ID d’agent pour les invites d’approbation transférées.
- `channels.telegram.execApprovals.sessionFilter` : filtre facultatif de clé de session (sous-chaîne ou regex) pour les invites d’approbation transférées.
- `channels.telegram.accounts.<account>.execApprovals` : surcharge par compte pour le routage des approbations exec Telegram et l’autorisation des approbateurs.
- `channels.telegram.capabilities.inlineButtons` : `off | dm | group | all | allowlist` (par défaut : allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons` : surcharge par compte.
- `channels.telegram.commands.nativeSkills` : active/désactive les commandes natives Skills de Telegram.
- `channels.telegram.replyToMode` : `off | first | all` (par défaut : `off`).
- `channels.telegram.textChunkLimit` : taille des segments sortants (caractères).
- `channels.telegram.chunkMode` : `length` (par défaut) ou `newline` pour découper sur les lignes vides (frontières de paragraphe) avant le découpage par longueur.
- `channels.telegram.linkPreview` : active/désactive les aperçus de liens pour les messages sortants (par défaut : true).
- `channels.telegram.streaming` : `off | partial | block | progress` (aperçu de streaming en direct ; par défaut : `partial` ; `progress` correspond à `partial` ; `block` est la compatibilité historique du mode aperçu). Le streaming d’aperçu Telegram utilise un seul message d’aperçu modifié sur place.
- `channels.telegram.streaming.preview.toolProgress` : réutilise le message d’aperçu en direct pour les mises à jour d’outil/progression lorsque le streaming d’aperçu est actif (par défaut : `true`). Définissez `false` pour conserver des messages d’outil/progression séparés.
- `channels.telegram.mediaMaxMb` : limite des médias Telegram entrants/sortants (Mo, par défaut : 100).
- `channels.telegram.retry` : politique de nouvelle tentative pour les helpers d’envoi Telegram (CLI/outils/actions) sur les erreurs d’API sortantes récupérables (tentatives, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily` : surcharge de Node autoSelectFamily (true=activer, false=désactiver). Activé par défaut sur Node 22+, avec WSL2 désactivé par défaut.
- `channels.telegram.network.dnsResultOrder` : surcharge de l’ordre des résultats DNS (`ipv4first` ou `verbatim`). Par défaut : `ipv4first` sur Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork` : activation dangereuse pour les environnements de faux IP ou de proxy transparent de confiance où les téléchargements de médias Telegram résolvent `api.telegram.org` vers des adresses privées/internes/à usage spécial hors de l’autorisation par défaut de la plage de benchmark RFC 2544.
- `channels.telegram.proxy` : URL de proxy pour les appels à l’API Bot (SOCKS/HTTP).
- `channels.telegram.webhookUrl` : active le mode Webhook (nécessite `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret` : secret Webhook (obligatoire lorsque `webhookUrl` est défini).
- `channels.telegram.webhookPath` : chemin local du Webhook (par défaut `/telegram-webhook`).
- `channels.telegram.webhookHost` : hôte local de liaison du Webhook (par défaut `127.0.0.1`).
- `channels.telegram.webhookPort` : port local de liaison du Webhook (par défaut `8787`).
- `channels.telegram.actions.reactions` : filtre les réactions d’outil Telegram.
- `channels.telegram.actions.sendMessage` : filtre les envois de messages d’outil Telegram.
- `channels.telegram.actions.deleteMessage` : filtre les suppressions de messages d’outil Telegram.
- `channels.telegram.actions.sticker` : filtre les actions de sticker Telegram — envoi et recherche (par défaut : false).
- `channels.telegram.reactionNotifications` : `off | own | all` — contrôle quelles réactions déclenchent des événements système (par défaut : `own` lorsqu’il n’est pas défini).
- `channels.telegram.reactionLevel` : `off | ack | minimal | extensive` — contrôle la capacité de réaction de l’agent (par défaut : `minimal` lorsqu’il n’est pas défini).
- `channels.telegram.errorPolicy` : `reply | silent` — contrôle le comportement des réponses d’erreur (par défaut : `reply`). Surcharges par compte/groupe/sujet prises en charge.
- `channels.telegram.errorCooldownMs` : délai minimal en ms entre les réponses d’erreur vers le même chat (par défaut : `60000`). Empêche le spam d’erreurs pendant les pannes.

- [Référence de configuration - Telegram](/fr/gateway/configuration-reference#telegram)

Champs Telegram à signal élevé :

- démarrage/auth : `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` doit pointer vers un fichier ordinaire ; les liens symboliques sont rejetés)
- contrôle d’accès : `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de niveau supérieur (`type: "acp"`)
- approbations exec : `execApprovals`, `accounts.*.execApprovals`
- commandes/menu : `commands.native`, `commands.nativeSkills`, `customCommands`
- fils/réponses : `replyToMode`
- streaming : `streaming` (aperçu), `streaming.preview.toolProgress`, `blockStreaming`
- mise en forme/livraison : `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- médias/réseau : `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook : `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- actions/capacités : `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- réactions : `reactionNotifications`, `reactionLevel`
- erreurs : `errorPolicy`, `errorCooldownMs`
- écritures/historique : `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Liens associés

- [Pairing](/fr/channels/pairing)
- [Groupes](/fr/channels/groups)
- [Sécurité](/fr/gateway/security)
- [Routage des canaux](/fr/channels/channel-routing)
- [Routage multi-agent](/fr/concepts/multi-agent)
- [Dépannage](/fr/channels/troubleshooting)
