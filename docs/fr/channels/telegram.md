---
read_when:
    - Travail sur les fonctionnalités Telegram ou les Webhooks
summary: État de la prise en charge des bots Telegram, capacités et configuration
title: Telegram
x-i18n:
    generated_at: "2026-04-22T04:20:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1575c4e5e932a4a6330d57fa0d1639336aecdb8fa70d37d92dccd0d466d2fccb
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Statut : prêt pour la production pour les DM et groupes de bot via grammY. Le long polling est le mode par défaut ; le mode Webhook est facultatif.

<CardGroup cols={3}>
  <Card title="Association" icon="link" href="/fr/channels/pairing">
    La politique DM par défaut pour Telegram est l’association.
  </Card>
  <Card title="Dépannage du canal" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics inter-canaux et procédures de réparation.
  </Card>
  <Card title="Configuration Gateway" icon="settings" href="/fr/gateway/configuration">
    Modèles et exemples complets de configuration de canal.
  </Card>
</CardGroup>

## Configuration rapide

<Steps>
  <Step title="Créer le token du bot dans BotFather">
    Ouvrez Telegram et discutez avec **@BotFather** (vérifiez que l’identifiant est exactement `@BotFather`).

    Exécutez `/newbot`, suivez les invites et enregistrez le token.

  </Step>

  <Step title="Configurer le token et la politique DM">

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
    Telegram n’utilise **pas** `openclaw channels login telegram` ; configurez le token dans la config/l’environnement, puis démarrez Gateway.

  </Step>

  <Step title="Démarrer Gateway et approuver le premier DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Les codes d’association expirent après 1 heure.

  </Step>

  <Step title="Ajouter le bot à un groupe">
    Ajoutez le bot à votre groupe, puis définissez `channels.telegram.groups` et `groupPolicy` pour correspondre à votre modèle d’accès.
  </Step>
</Steps>

<Note>
L’ordre de résolution des tokens est sensible au compte. En pratique, les valeurs de configuration l’emportent sur la variable d’environnement de repli, et `TELEGRAM_BOT_TOKEN` s’applique uniquement au compte par défaut.
</Note>

## Paramètres côté Telegram

<AccordionGroup>
  <Accordion title="Mode confidentialité et visibilité des groupes">
    Les bots Telegram utilisent par défaut le **Mode confidentialité**, qui limite les messages de groupe qu’ils reçoivent.

    Si le bot doit voir tous les messages de groupe, vous pouvez soit :

    - désactiver le mode confidentialité via `/setprivacy`, ou
    - faire du bot un administrateur du groupe.

    Lorsque vous modifiez le mode confidentialité, retirez puis réajoutez le bot dans chaque groupe afin que Telegram applique le changement.

  </Accordion>

  <Accordion title="Autorisations de groupe">
    Le statut d’administrateur est contrôlé dans les paramètres du groupe Telegram.

    Les bots administrateurs reçoivent tous les messages de groupe, ce qui est utile pour un comportement de groupe toujours actif.

  </Accordion>

  <Accordion title="Options utiles de BotFather">

    - `/setjoingroups` pour autoriser/refuser l’ajout à des groupes
    - `/setprivacy` pour le comportement de visibilité dans les groupes

  </Accordion>
</AccordionGroup>

## Contrôle d’accès et activation

<Tabs>
  <Tab title="Politique DM">
    `channels.telegram.dmPolicy` contrôle l’accès aux messages directs :

    - `pairing` (par défaut)
    - `allowlist` (nécessite au moins un identifiant d’expéditeur dans `allowFrom`)
    - `open` (nécessite que `allowFrom` inclue `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` accepte des identifiants utilisateur Telegram numériques. Les préfixes `telegram:` / `tg:` sont acceptés et normalisés.
    `dmPolicy: "allowlist"` avec un `allowFrom` vide bloque tous les DM et est rejeté par la validation de configuration.
    L’assistant de configuration demande uniquement des identifiants utilisateur numériques.
    Si vous avez effectué une mise à niveau et que votre configuration contient des entrées de liste d’autorisation `@username`, exécutez `openclaw doctor --fix` pour les résoudre (au mieux ; nécessite un token de bot Telegram).
    Si vous vous appuyiez auparavant sur des fichiers de liste d’autorisation du store d’association, `openclaw doctor --fix` peut récupérer ces entrées dans `channels.telegram.allowFrom` dans les flux en liste d’autorisation (par exemple lorsque `dmPolicy: "allowlist"` n’a pas encore d’identifiants explicites).

    Pour les bots à propriétaire unique, préférez `dmPolicy: "allowlist"` avec des identifiants numériques explicites dans `allowFrom` afin de conserver une politique d’accès durable dans la configuration (au lieu de dépendre d’approbations d’association précédentes).

    Confusion fréquente : l’approbation d’association DM ne signifie pas « cet expéditeur est autorisé partout ».
    L’association accorde uniquement l’accès DM. L’autorisation des expéditeurs en groupe provient toujours de listes d’autorisation explicites dans la configuration.
    Si vous voulez « je suis autorisé une seule fois et les DM comme les commandes de groupe fonctionnent », placez votre identifiant utilisateur Telegram numérique dans `channels.telegram.allowFrom`.

    ### Trouver votre identifiant utilisateur Telegram

    Méthode plus sûre (sans bot tiers) :

    1. Envoyez un DM à votre bot.
    2. Exécutez `openclaw logs --follow`.
    3. Lisez `from.id`.

    Méthode officielle Bot API :

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Méthode tierce (moins privée) : `@userinfobot` ou `@getidsbot`.

  </Tab>

  <Tab title="Politique de groupe et listes d’autorisation">
    Deux contrôles s’appliquent ensemble :

    1. **Quels groupes sont autorisés** (`channels.telegram.groups`)
       - aucune configuration `groups` :
         - avec `groupPolicy: "open"` : n’importe quel groupe peut passer les vérifications d’identifiant de groupe
         - avec `groupPolicy: "allowlist"` (par défaut) : les groupes sont bloqués jusqu’à ce que vous ajoutiez des entrées `groups` (ou `"*"`)
       - `groups` configuré : agit comme liste d’autorisation (identifiants explicites ou `"*"`)

    2. **Quels expéditeurs sont autorisés dans les groupes** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (par défaut)
       - `disabled`

    `groupAllowFrom` est utilisé pour filtrer les expéditeurs dans les groupes. S’il n’est pas défini, Telegram se replie sur `allowFrom`.
    Les entrées `groupAllowFrom` doivent être des identifiants utilisateur Telegram numériques (les préfixes `telegram:` / `tg:` sont normalisés).
    Ne mettez pas les identifiants de discussion Telegram de groupe ou supergroupe dans `groupAllowFrom`. Les identifiants de discussion négatifs doivent être placés sous `channels.telegram.groups`.
    Les entrées non numériques sont ignorées pour l’autorisation des expéditeurs.
    Frontière de sécurité (`2026.2.25+`) : l’autorisation des expéditeurs en groupe n’hérite **pas** des approbations du store d’association DM.
    L’association reste réservée aux DM. Pour les groupes, définissez `groupAllowFrom` ou `allowFrom` par groupe/par sujet.
    Si `groupAllowFrom` n’est pas défini, Telegram se replie sur `allowFrom` de la configuration, et non sur le store d’association.
    Modèle pratique pour les bots à propriétaire unique : définissez votre identifiant utilisateur dans `channels.telegram.allowFrom`, laissez `groupAllowFrom` non défini, et autorisez les groupes cibles sous `channels.telegram.groups`.
    Remarque d’exécution : si `channels.telegram` est complètement absent, l’exécution utilise par défaut un `groupPolicy="allowlist"` fermé par défaut, sauf si `channels.defaults.groupPolicy` est défini explicitement.

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

    Exemple : autoriser uniquement des utilisateurs spécifiques dans un groupe spécifique :

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

      - Placez les identifiants négatifs de groupe ou supergroupe Telegram comme `-1001234567890` sous `channels.telegram.groups`.
      - Placez les identifiants utilisateur Telegram comme `8734062810` sous `groupAllowFrom` lorsque vous voulez limiter les personnes à l’intérieur d’un groupe autorisé pouvant déclencher le bot.
      - Utilisez `groupAllowFrom: ["*"]` uniquement lorsque vous voulez que n’importe quel membre d’un groupe autorisé puisse parler au bot.
    </Warning>

  </Tab>

  <Tab title="Comportement des mentions">
    Les réponses de groupe exigent une mention par défaut.

    La mention peut provenir de :

    - la mention native `@botusername`, ou
    - de motifs de mention dans :
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Bascules de commande au niveau de la session :

    - `/activation always`
    - `/activation mention`

    Elles mettent à jour uniquement l’état de la session. Utilisez la configuration pour la persistance.

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

    Obtenir l’identifiant de discussion du groupe :

    - transférer un message de groupe à `@userinfobot` / `@getidsbot`
    - ou lire `chat.id` dans `openclaw logs --follow`
    - ou inspecter Bot API `getUpdates`

  </Tab>
</Tabs>

## Comportement à l’exécution

- Telegram est géré par le processus Gateway.
- Le routage est déterministe : les réponses entrantes Telegram repartent vers Telegram (le modèle ne choisit pas les canaux).
- Les messages entrants sont normalisés dans l’enveloppe de canal partagée avec métadonnées de réponse et espaces réservés de média.
- Les sessions de groupe sont isolées par identifiant de groupe. Les sujets de forum ajoutent `:topic:<threadId>` pour garder les sujets isolés.
- Les messages DM peuvent contenir `message_thread_id` ; OpenClaw les route avec des clés de session sensibles au fil et préserve l’identifiant de fil pour les réponses.
- Le long polling utilise grammY runner avec un séquencement par discussion/par fil. La concurrence globale du runner sink utilise `agents.defaults.maxConcurrent`.
- Les redémarrages du watchdog du long polling se déclenchent après 120 secondes sans activité `getUpdates` terminée par défaut. Augmentez `channels.telegram.pollingStallThresholdMs` uniquement si votre déploiement continue à voir de faux redémarrages pour blocage du polling pendant des tâches longues. La valeur est en millisecondes et autorisée de `30000` à `600000` ; des remplacements par compte sont pris en charge.
- Telegram Bot API ne prend pas en charge les accusés de lecture (`sendReadReceipts` ne s’applique pas).

## Référence des fonctionnalités

<AccordionGroup>
  <Accordion title="Aperçu de streaming en direct (modifications de message)">
    OpenClaw peut diffuser des réponses partielles en temps réel :

    - discussions directes : message d’aperçu + `editMessageText`
    - groupes/sujets : message d’aperçu + `editMessageText`

    Exigence :

    - `channels.telegram.streaming` vaut `off | partial | block | progress` (par défaut : `partial`)
    - `progress` est mappé vers `partial` sur Telegram (compatibilité avec les noms inter-canaux)
    - `streaming.preview.toolProgress` contrôle si les mises à jour d’outil/progression réutilisent le même message d’aperçu modifié (par défaut : `true`). Définissez `false` pour conserver des messages séparés pour l’outil/la progression.
    - les anciennes valeurs booléennes `channels.telegram.streamMode` et `streaming` sont mappées automatiquement

    Pour les réponses texte uniquement :

    - DM : OpenClaw conserve le même message d’aperçu et effectue une modification finale sur place (pas de second message)
    - groupe/sujet : OpenClaw conserve le même message d’aperçu et effectue une modification finale sur place (pas de second message)

    Pour les réponses complexes (par exemple les payloads média), OpenClaw se replie sur la livraison finale normale puis nettoie le message d’aperçu.

    Le streaming d’aperçu est distinct du block streaming. Lorsque le block streaming est explicitement activé pour Telegram, OpenClaw saute le flux d’aperçu pour éviter un double streaming.

    Si le transport de brouillon natif n’est pas disponible ou est rejeté, OpenClaw se replie automatiquement sur `sendMessage` + `editMessageText`.

    Flux de raisonnement propre à Telegram :

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

    Valeurs par défaut des commandes natives :

    - `commands.native: "auto"` active les commandes natives pour Telegram

    Ajouter des entrées de menu de commande personnalisées :

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
    - les conflits/doublons sont ignorés et journalisés

    Remarques :

    - les commandes personnalisées sont uniquement des entrées de menu ; elles n’implémentent pas automatiquement un comportement
    - les commandes de Plugin/Skills peuvent toujours fonctionner lorsqu’elles sont saisies, même si elles ne sont pas affichées dans le menu Telegram

    Si les commandes natives sont désactivées, les commandes intégrées sont supprimées. Les commandes personnalisées/de Plugin peuvent toujours être enregistrées si elles sont configurées.

    Échecs de configuration fréquents :

    - `setMyCommands failed` avec `BOT_COMMANDS_TOO_MUCH` signifie que le menu Telegram déborde encore après réduction ; réduisez les commandes de Plugin/Skills/personnalisées ou désactivez `channels.telegram.commands.native`.
    - `setMyCommands failed` avec des erreurs réseau/fetch signifie généralement que le DNS/HTTPS sortant vers `api.telegram.org` est bloqué.

    ### Commandes d’association d’appareil (Plugin `device-pair`)

    Lorsque le Plugin `device-pair` est installé :

    1. `/pair` génère un code de configuration
    2. collez le code dans l’app iOS
    3. `/pair pending` liste les demandes en attente (y compris le rôle/les scopes)
    4. approuvez la demande :
       - `/pair approve <requestId>` pour une approbation explicite
       - `/pair approve` lorsqu’il n’y a qu’une seule demande en attente
       - `/pair approve latest` pour la plus récente

    Le code de configuration transporte un token bootstrap de courte durée. Le transfert bootstrap intégré conserve le token du Node principal à `scopes: []` ; tout token opérateur transmis reste limité à `operator.approvals`, `operator.read`, `operator.talk.secrets`, et `operator.write`. Les vérifications de scope bootstrap sont préfixées par rôle, de sorte que cette liste d’autorisation opérateur ne satisfait que les demandes d’opérateur ; les rôles non opérateur nécessitent toujours des scopes sous leur propre préfixe de rôle.

    Si un appareil réessaie avec des détails d’authentification modifiés (par exemple rôle/scopes/clé publique), la demande en attente précédente est remplacée et la nouvelle demande utilise un `requestId` différent. Réexécutez `/pair pending` avant d’approuver.

    Plus de détails : [Association](/fr/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Boutons intégrés">
    Configurez la portée du clavier intégré :

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

    Remplacement par compte :

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

    L’ancienne valeur `capabilities: ["inlineButtons"]` est mappée vers `inlineButtons: "all"`.

    Exemple d’action de message :

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choisissez une option :",
  buttons: [
    [
      { text: "Oui", callback_data: "yes" },
      { text: "Non", callback_data: "no" },
    ],
    [{ text: "Annuler", callback_data: "cancel" }],
  ],
}
```

    Les clics de callback sont transmis à l’agent sous forme de texte :
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Actions de message Telegram pour les agents et l’automatisation">
    Les actions d’outil Telegram incluent :

    - `sendMessage` (`to`, `content`, `mediaUrl`, `replyToMessageId`, `messageThreadId` facultatifs)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, `iconColor`, `iconCustomEmojiId` facultatifs)

    Les actions de message du canal exposent des alias ergonomiques (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Contrôles de filtrage :

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (par défaut : désactivé)

    Remarque : `edit` et `topic-create` sont actuellement activés par défaut et n’ont pas de bascules `channels.telegram.actions.*` séparées.
    Les envois à l’exécution utilisent l’instantané actif de configuration/secrets (démarrage/rechargement), de sorte que les chemins d’action n’effectuent pas de nouvelle résolution ad hoc de SecretRef à chaque envoi.

    Sémantique de suppression des réactions : [/tools/reactions](/fr/tools/reactions)

  </Accordion>

  <Accordion title="Balises de fil de réponse">
    Telegram prend en charge des balises explicites de fil de réponse dans la sortie générée :

    - `[[reply_to_current]]` répond au message déclencheur
    - `[[reply_to:<id>]]` répond à un identifiant de message Telegram spécifique

    `channels.telegram.replyToMode` contrôle le traitement :

    - `off` (par défaut)
    - `first`
    - `all`

    Remarque : `off` désactive le fil de réponse implicite. Les balises explicites `[[reply_to_*]]` sont toujours respectées.

  </Accordion>

  <Accordion title="Sujets de forum et comportement des fils">
    Supergroupes de forum :

    - les clés de session des sujets ajoutent `:topic:<threadId>`
    - les réponses et l’indicateur de saisie ciblent le fil du sujet
    - chemin de configuration du sujet :
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Cas particulier du sujet général (`threadId=1`) :

    - les envois de message omettent `message_thread_id` (Telegram rejette `sendMessage(...thread_id=1)`)
    - les actions de saisie incluent toujours `message_thread_id`

    Héritage des sujets : les entrées de sujet héritent des paramètres du groupe sauf en cas de remplacement (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` est propre au sujet et n’hérite pas des paramètres par défaut du groupe.

    **Routage d’agent par sujet** : chaque sujet peut être routé vers un agent différent en définissant `agentId` dans la configuration du sujet. Cela donne à chaque sujet son propre espace de travail, sa propre mémoire et sa propre session isolés. Exemple :

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Sujet général → agent main
                "3": { agentId: "zu" },        // Sujet dev → agent zu
                "5": { agentId: "coder" }      // Revue de code → agent coder
              }
            }
          }
        }
      }
    }
    ```

    Chaque sujet a alors sa propre clé de session : `agent:zu:telegram:group:-1001234567890:topic:3`

    **Binding ACP persistant de sujet** : les sujets de forum peuvent épingler des sessions de harnais ACP via des bindings ACP typés de premier niveau :

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

    Ceci est actuellement limité aux sujets de forum dans les groupes et supergroupes.

    **Lancement ACP lié à un fil depuis le chat** :

    - `/acp spawn <agent> --thread here|auto` peut lier le sujet Telegram actuel à une nouvelle session ACP.
    - Les messages suivants dans le sujet sont routés directement vers la session ACP liée (aucun `/acp steer` requis).
    - OpenClaw épingle le message de confirmation de lancement dans le sujet après un binding réussi.
    - Nécessite `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Le contexte du modèle inclut :

    - `MessageThreadId`
    - `IsForum`

    Comportement des fils de DM :

    - les discussions privées avec `message_thread_id` conservent le routage DM mais utilisent des clés de session et des cibles de réponse sensibles au fil.

  </Accordion>

  <Accordion title="Audio, vidéo et stickers">
    ### Messages audio

    Telegram distingue les notes vocales et les fichiers audio.

    - par défaut : comportement de fichier audio
    - balise `[[audio_as_voice]]` dans la réponse de l’agent pour forcer l’envoi en note vocale

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

    Les notes vidéo ne prennent pas en charge les légendes ; le texte du message fourni est envoyé séparément.

    ### Stickers

    Gestion des stickers entrants :

    - WEBP statique : téléchargé et traité (placeholder `<media:sticker>`)
    - TGS animé : ignoré
    - WEBM vidéo : ignoré

    Champs de contexte des stickers :

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

    Rechercher dans les stickers en cache :

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "chat qui salue de la patte",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Notifications de réaction">
    Les réactions Telegram arrivent sous forme de mises à jour `message_reaction` (séparées des payloads de message).

    Lorsqu’elles sont activées, OpenClaw met en file d’attente des événements système tels que :

    - `Réaction Telegram ajoutée : 👍 par Alice (@alice) sur msg 42`

    Configuration :

    - `channels.telegram.reactionNotifications`: `off | own | all` (par défaut : `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (par défaut : `minimal`)

    Remarques :

    - `own` signifie uniquement les réactions des utilisateurs aux messages envoyés par le bot (au mieux via le cache des messages envoyés).
    - Les événements de réaction respectent toujours les contrôles d’accès Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) ; les expéditeurs non autorisés sont ignorés.
    - Telegram ne fournit pas d’identifiants de fil dans les mises à jour de réaction.
      - les groupes non forum sont routés vers la session de discussion de groupe
      - les groupes forum sont routés vers la session du sujet général du groupe (`:topic:1`), et non vers le sujet d’origine exact

    `allowed_updates` pour le polling/Webhook inclut automatiquement `message_reaction`.

  </Accordion>

  <Accordion title="Réactions d’accusé de réception">
    `ackReaction` envoie un emoji d’accusé de réception pendant qu’OpenClaw traite un message entrant.

    Ordre de résolution :

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - emoji de repli de l’identité de l’agent (`agents.list[].identity.emoji`, sinon "👀")

    Remarques :

    - Telegram attend un emoji unicode (par exemple "👀").
    - Utilisez `""` pour désactiver la réaction pour un canal ou un compte.

  </Accordion>

  <Accordion title="Écritures de configuration à partir des événements et commandes Telegram">
    Les écritures de configuration du canal sont activées par défaut (`configWrites !== false`).

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

  <Accordion title="Long polling vs Webhook">
    Par défaut : long polling.

    Mode Webhook :

    - définir `channels.telegram.webhookUrl`
    - définir `channels.telegram.webhookSecret` (obligatoire lorsque l’URL Webhook est définie)
    - `channels.telegram.webhookPath` facultatif (par défaut `/telegram-webhook`)
    - `channels.telegram.webhookHost` facultatif (par défaut `127.0.0.1`)
    - `channels.telegram.webhookPort` facultatif (par défaut `8787`)

    L’écouteur local par défaut pour le mode Webhook se lie à `127.0.0.1:8787`.

    Si votre point d’accès public diffère, placez un reverse proxy devant et faites pointer `webhookUrl` vers l’URL publique.
    Définissez `webhookHost` (par exemple `0.0.0.0`) lorsque vous avez intentionnellement besoin d’un ingress externe.

  </Accordion>

  <Accordion title="Limites, nouvelles tentatives et cibles CLI">
    - `channels.telegram.textChunkLimit` a une valeur par défaut de 4000.
    - `channels.telegram.chunkMode="newline"` privilégie les limites de paragraphe (lignes vides) avant le découpage par longueur.
    - `channels.telegram.mediaMaxMb` (par défaut 100) limite la taille des médias Telegram entrants et sortants.
    - `channels.telegram.timeoutSeconds` remplace le délai d’expiration du client API Telegram (si non défini, la valeur par défaut de grammY s’applique).
    - `channels.telegram.pollingStallThresholdMs` a pour valeur par défaut `120000` ; ajustez entre `30000` et `600000` uniquement pour les redémarrages à faux positifs dus à un blocage du polling.
    - l’historique du contexte de groupe utilise `channels.telegram.historyLimit` ou `messages.groupChat.historyLimit` (par défaut 50) ; `0` désactive.
    - le contexte complémentaire reply/quote/forward est actuellement transmis tel que reçu.
    - les listes d’autorisation Telegram filtrent principalement qui peut déclencher l’agent, et non une frontière complète de masquage du contexte complémentaire.
    - contrôles d’historique DM :
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - la configuration `channels.telegram.retry` s’applique aux helpers d’envoi Telegram (CLI/outils/actions) pour les erreurs API sortantes récupérables.

    La cible d’envoi CLI peut être un identifiant de discussion numérique ou un nom d’utilisateur :

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Les polls Telegram utilisent `openclaw message poll` et prennent en charge les sujets de forum :

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Indicateurs de poll propres à Telegram :

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` pour les sujets de forum (ou utilisez une cible `:topic:`)

    L’envoi Telegram prend aussi en charge :

    - `--presentation` avec des blocs `buttons` pour les claviers intégrés lorsque `channels.telegram.capabilities.inlineButtons` l’autorise
    - `--pin` ou `--delivery '{"pin":true}'` pour demander une livraison épinglée lorsque le bot peut épingler dans cette discussion
    - `--force-document` pour envoyer les images et GIF sortants comme documents au lieu d’envois compressés de photo ou de média animé

    Filtrage des actions :

    - `channels.telegram.actions.sendMessage=false` désactive les messages Telegram sortants, y compris les polls
    - `channels.telegram.actions.poll=false` désactive la création de polls Telegram tout en laissant les envois normaux activés

  </Accordion>

  <Accordion title="Approbations exec dans Telegram">
    Telegram prend en charge les approbations exec dans les DM des approbateurs et peut, en option, publier des invites d’approbation dans la discussion ou le sujet d’origine.

    Chemin de configuration :

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (facultatif ; se replie sur les identifiants propriétaires numériques déduits de `allowFrom` et de `defaultTo` direct lorsque c’est possible)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, par défaut : `dm`)
    - `agentFilter`, `sessionFilter`

    Les approbateurs doivent être des identifiants utilisateur Telegram numériques. Telegram active automatiquement les approbations exec natives lorsque `enabled` n’est pas défini ou vaut `"auto"` et qu’au moins un approbateur peut être résolu, soit à partir de `execApprovals.approvers`, soit à partir de la configuration numérique du propriétaire du compte (`allowFrom` et `defaultTo` en message direct). Définissez `enabled: false` pour désactiver explicitement Telegram comme client d’approbation natif. Sinon, les demandes d’approbation se replient sur d’autres routes d’approbation configurées ou sur la politique de repli d’approbation exec.

    Telegram affiche aussi les boutons d’approbation partagés utilisés par les autres canaux de chat. L’adaptateur Telegram natif ajoute principalement le routage des DM d’approbateur, la diffusion vers la discussion/le sujet, et des indications de saisie avant la livraison.
    Lorsque ces boutons sont présents, ils constituent l’expérience d’approbation principale ; OpenClaw
    ne doit inclure une commande manuelle `/approve` que lorsque le résultat de l’outil indique
    que les approbations via le chat ne sont pas disponibles ou que l’approbation manuelle est la seule voie possible.

    Règles de livraison :

    - `target: "dm"` envoie les invites d’approbation uniquement aux DM des approbateurs résolus
    - `target: "channel"` renvoie l’invite dans la discussion/le sujet Telegram d’origine
    - `target: "both"` envoie aux DM des approbateurs et à la discussion/au sujet d’origine

    Seuls les approbateurs résolus peuvent approuver ou refuser. Les non-approbateurs ne peuvent pas utiliser `/approve` ni les boutons d’approbation Telegram.

    Comportement de résolution des approbations :

    - les identifiants préfixés par `plugin:` sont toujours résolus via les approbations de Plugin.
    - les autres identifiants d’approbation tentent d’abord `exec.approval.resolve`.
    - si Telegram est aussi autorisé pour les approbations de Plugin et que Gateway indique
      que l’approbation exec est inconnue/expirée, Telegram réessaie une fois via
      `plugin.approval.resolve`.
    - les refus/erreurs réels d’approbation exec ne basculent pas silencieusement vers la
      résolution d’approbation de Plugin.

    La livraison dans le canal affiche le texte de la commande dans la discussion, donc activez `channel` ou `both` uniquement dans des groupes/sujets de confiance. Lorsque l’invite arrive dans un sujet de forum, OpenClaw préserve le sujet à la fois pour l’invite d’approbation et pour le suivi post-approbation. Les approbations exec expirent après 30 minutes par défaut.

    Les boutons d’approbation intégrés dépendent aussi du fait que `channels.telegram.capabilities.inlineButtons` autorise la surface cible (`dm`, `group` ou `all`).

    Documentation associée : [Approbations exec](/fr/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Contrôles de réponse d’erreur

Lorsque l’agent rencontre une erreur de livraison ou de provider, Telegram peut soit répondre avec le texte d’erreur, soit le supprimer. Deux clés de configuration contrôlent ce comportement :

| Clé | Valeurs | Par défaut | Description |
| --- | --- | --- | --- |
| `channels.telegram.errorPolicy` | `reply`, `silent` | `reply` | `reply` envoie un message d’erreur convivial dans la discussion. `silent` supprime entièrement les réponses d’erreur. |
| `channels.telegram.errorCooldownMs` | number (ms) | `60000` | Temps minimal entre deux réponses d’erreur dans la même discussion. Empêche le spam d’erreurs pendant les pannes. |

Les remplacements par compte, par groupe et par sujet sont pris en charge (même héritage que pour les autres clés de configuration Telegram).

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
      - BotFather : `/setprivacy` -> Désactiver
      - puis retirer + réajouter le bot au groupe
    - `openclaw channels status` avertit lorsque la configuration attend des messages de groupe sans mention.
    - `openclaw channels status --probe` peut vérifier des identifiants de groupe numériques explicites ; le joker `"*"` ne peut pas être sondé pour l’appartenance.
    - test rapide de session : `/activation always`.

  </Accordion>

  <Accordion title="Le bot ne voit pas du tout les messages de groupe">

    - lorsque `channels.telegram.groups` existe, le groupe doit être listé (ou inclure `"*"`)
    - vérifier que le bot est membre du groupe
    - consulter les journaux : `openclaw logs --follow` pour les raisons d’ignorance

  </Accordion>

  <Accordion title="Les commandes fonctionnent partiellement ou pas du tout">

    - autorisez votre identité d’expéditeur (association et/ou `allowFrom` numérique)
    - l’autorisation des commandes s’applique toujours même lorsque la politique de groupe est `open`
    - `setMyCommands failed` avec `BOT_COMMANDS_TOO_MUCH` signifie que le menu natif comporte trop d’entrées ; réduisez les commandes de Plugin/Skills/personnalisées ou désactivez les menus natifs
    - `setMyCommands failed` avec des erreurs réseau/fetch indique généralement des problèmes d’accessibilité DNS/HTTPS vers `api.telegram.org`

  </Accordion>

  <Accordion title="Instabilité du polling ou du réseau">

    - Node 22+ + fetch/proxy personnalisé peut déclencher un comportement d’abandon immédiat si les types AbortSignal ne correspondent pas.
    - Certains hôtes résolvent `api.telegram.org` d’abord en IPv6 ; une sortie IPv6 défaillante peut provoquer des échecs intermittents de l’API Telegram.
    - Si les journaux incluent `TypeError: fetch failed` ou `Network request for 'getUpdates' failed!`, OpenClaw réessaie désormais ces erreurs comme erreurs réseau récupérables.
    - Si les journaux incluent `Polling stall detected`, OpenClaw redémarre le polling et reconstruit le transport Telegram après 120 secondes sans activité long-poll terminée par défaut.
    - Augmentez `channels.telegram.pollingStallThresholdMs` uniquement lorsque les appels `getUpdates` de longue durée sont sains mais que votre hôte signale encore de faux redémarrages pour blocage du polling. Des blocages persistants pointent généralement vers des problèmes de proxy, DNS, IPv6 ou de sortie TLS entre l’hôte et `api.telegram.org`.
    - Sur des hôtes VPS avec une sortie directe/TLS instable, faites transiter les appels API Telegram via `channels.telegram.proxy` :

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

    - Les réponses de la plage de benchmark RFC 2544 (`198.18.0.0/15`) sont déjà autorisées
      par défaut pour les téléchargements de médias Telegram. Si une fausse IP ou un
      proxy transparent de confiance réécrit `api.telegram.org` vers une autre
      adresse privée/interne/spéciale lors des téléchargements de médias, vous pouvez
      activer le contournement propre à Telegram :

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - La même activation existe par compte dans
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Si votre proxy résout les hôtes média Telegram vers `198.18.x.x`, laissez d’abord
      l’option dangereuse désactivée. Les médias Telegram autorisent déjà la plage
      de benchmark RFC 2544 par défaut.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` affaiblit les protections SSRF
      des médias Telegram. Utilisez-le uniquement pour des environnements proxy de confiance
      contrôlés par l’opérateur, tels que le routage fake-IP de Clash, Mihomo ou Surge lorsqu’ils
      synthétisent des réponses privées ou à usage spécial en dehors de la plage de benchmark RFC 2544.
      Laissez-le désactivé pour un accès Telegram normal sur l’internet public.
    </Warning>

    - Remplacements d’environnement (temporaires) :
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Valider les réponses DNS :

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Plus d’aide : [Dépannage du canal](/fr/channels/troubleshooting).

## Pointeurs vers la référence de configuration Telegram

Référence principale :

- `channels.telegram.enabled` : activer/désactiver le démarrage du canal.
- `channels.telegram.botToken` : token du bot (BotFather).
- `channels.telegram.tokenFile` : lire le token depuis un chemin de fichier ordinaire. Les liens symboliques sont refusés.
- `channels.telegram.dmPolicy` : `pairing | allowlist | open | disabled` (par défaut : pairing).
- `channels.telegram.allowFrom` : liste d’autorisation DM (identifiants utilisateur Telegram numériques). `allowlist` exige au moins un identifiant d’expéditeur. `open` exige `"*"`. `openclaw doctor --fix` peut résoudre les anciennes entrées `@username` en identifiants et peut récupérer des entrées de liste d’autorisation à partir des fichiers du store d’association dans les flux de migration allowlist.
- `channels.telegram.actions.poll` : activer ou désactiver la création de polls Telegram (activé par défaut ; nécessite toujours `sendMessage`).
- `channels.telegram.defaultTo` : cible Telegram par défaut utilisée par le CLI `--deliver` lorsqu’aucun `--reply-to` explicite n’est fourni.
- `channels.telegram.groupPolicy` : `open | allowlist | disabled` (par défaut : allowlist).
- `channels.telegram.groupAllowFrom` : liste d’autorisation des expéditeurs de groupe (identifiants utilisateur Telegram numériques). `openclaw doctor --fix` peut résoudre les anciennes entrées `@username` en identifiants. Les entrées non numériques sont ignorées au moment de l’authentification. L’authentification de groupe n’utilise pas le repli du store d’association DM (`2026.2.25+`).
- Priorité multi-comptes :
  - Lorsque deux identifiants de compte ou plus sont configurés, définissez `channels.telegram.defaultAccount` (ou incluez `channels.telegram.accounts.default`) pour rendre le routage par défaut explicite.
  - Si aucun n’est défini, OpenClaw se replie sur le premier identifiant de compte normalisé et `openclaw doctor` affiche un avertissement.
  - `channels.telegram.accounts.default.allowFrom` et `channels.telegram.accounts.default.groupAllowFrom` s’appliquent uniquement au compte `default`.
  - Les comptes nommés héritent de `channels.telegram.allowFrom` et `channels.telegram.groupAllowFrom` lorsque les valeurs au niveau du compte ne sont pas définies.
  - Les comptes nommés n’héritent pas de `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups` : valeurs par défaut par groupe + liste d’autorisation (utilisez `"*"` pour les valeurs par défaut globales).
  - `channels.telegram.groups.<id>.groupPolicy` : remplacement par groupe pour groupPolicy (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention` : valeur par défaut du contrôle des mentions.
  - `channels.telegram.groups.<id>.skills` : filtre de Skills (omettre = tous les Skills, vide = aucun).
  - `channels.telegram.groups.<id>.allowFrom` : remplacement de la liste d’autorisation des expéditeurs par groupe.
  - `channels.telegram.groups.<id>.systemPrompt` : prompt système supplémentaire pour le groupe.
  - `channels.telegram.groups.<id>.enabled` : désactiver le groupe lorsque la valeur est `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*` : remplacements par sujet (champs du groupe + `agentId` propre au sujet).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId` : router ce sujet vers un agent spécifique (remplace le routage au niveau du groupe et par binding).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy` : remplacement par sujet pour groupPolicy (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention` : remplacement du contrôle des mentions par sujet.
- `bindings[]` de niveau supérieur avec `type: "acp"` et identifiant de sujet canonique `chatId:topic:topicId` dans `match.peer.id` : champs de binding ACP persistant de sujet (voir [Agents ACP](/fr/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId` : router des sujets DM vers un agent spécifique (même comportement que pour les sujets de forum).
- `channels.telegram.execApprovals.enabled` : activer Telegram comme client d’approbation exec basé sur le chat pour ce compte.
- `channels.telegram.execApprovals.approvers` : identifiants utilisateur Telegram autorisés à approuver ou refuser des demandes exec. Facultatif lorsque `channels.telegram.allowFrom` ou un `channels.telegram.defaultTo` direct identifie déjà le propriétaire.
- `channels.telegram.execApprovals.target` : `dm | channel | both` (par défaut : `dm`). `channel` et `both` préservent le sujet Telegram d’origine lorsqu’il est présent.
- `channels.telegram.execApprovals.agentFilter` : filtre facultatif d’identifiant d’agent pour les invites d’approbation transférées.
- `channels.telegram.execApprovals.sessionFilter` : filtre facultatif de clé de session (sous-chaîne ou regex) pour les invites d’approbation transférées.
- `channels.telegram.accounts.<account>.execApprovals` : remplacement par compte pour le routage des approbations exec Telegram et l’autorisation des approbateurs.
- `channels.telegram.capabilities.inlineButtons` : `off | dm | group | all | allowlist` (par défaut : allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons` : remplacement par compte.
- `channels.telegram.commands.nativeSkills` : activer/désactiver les commandes natives Telegram pour Skills.
- `channels.telegram.replyToMode` : `off | first | all` (par défaut : `off`).
- `channels.telegram.textChunkLimit` : taille des segments sortants (caractères).
- `channels.telegram.chunkMode` : `length` (par défaut) ou `newline` pour découper sur les lignes vides (limites de paragraphe) avant le découpage par longueur.
- `channels.telegram.linkPreview` : activer/désactiver les aperçus de liens pour les messages sortants (par défaut : true).
- `channels.telegram.streaming` : `off | partial | block | progress` (aperçu de streaming en direct ; par défaut : `partial` ; `progress` est mappé vers `partial` ; `block` correspond à l’ancien mode de compatibilité d’aperçu). Le streaming d’aperçu Telegram utilise un seul message d’aperçu modifié sur place.
- `channels.telegram.streaming.preview.toolProgress` : réutiliser le message d’aperçu en direct pour les mises à jour d’outil/progression lorsque le streaming d’aperçu est actif (par défaut : `true`). Définissez `false` pour conserver des messages séparés pour l’outil/la progression.
- `channels.telegram.mediaMaxMb` : limite des médias Telegram entrants/sortants (Mo, par défaut : 100).
- `channels.telegram.retry` : politique de nouvelle tentative pour les helpers d’envoi Telegram (CLI/outils/actions) sur les erreurs API sortantes récupérables (tentatives, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily` : remplacer Node autoSelectFamily (true=activer, false=désactiver). Activé par défaut sur Node 22+, avec WSL2 désactivé par défaut.
- `channels.telegram.network.dnsResultOrder` : remplacer l’ordre de résultat DNS (`ipv4first` ou `verbatim`). La valeur par défaut est `ipv4first` sur Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork` : activation dangereuse pour des environnements de fake-IP ou de proxy transparent de confiance où les téléchargements de médias Telegram résolvent `api.telegram.org` vers des adresses privées/internes/spéciales en dehors de l’autorisation par défaut de la plage de benchmark RFC 2544.
- `channels.telegram.proxy` : URL de proxy pour les appels Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl` : activer le mode Webhook (nécessite `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret` : secret Webhook (obligatoire lorsque webhookUrl est défini).
- `channels.telegram.webhookPath` : chemin Webhook local (par défaut `/telegram-webhook`).
- `channels.telegram.webhookHost` : hôte de binding Webhook local (par défaut `127.0.0.1`).
- `channels.telegram.webhookPort` : port de binding Webhook local (par défaut `8787`).
- `channels.telegram.actions.reactions` : filtrer les réactions d’outil Telegram.
- `channels.telegram.actions.sendMessage` : filtrer les envois de messages d’outil Telegram.
- `channels.telegram.actions.deleteMessage` : filtrer les suppressions de messages d’outil Telegram.
- `channels.telegram.actions.sticker` : filtrer les actions de sticker Telegram — envoi et recherche (par défaut : false).
- `channels.telegram.reactionNotifications` : `off | own | all` — contrôler quelles réactions déclenchent des événements système (par défaut : `own` si non défini).
- `channels.telegram.reactionLevel` : `off | ack | minimal | extensive` — contrôler la capacité de réaction de l’agent (par défaut : `minimal` si non défini).
- `channels.telegram.errorPolicy` : `reply | silent` — contrôler le comportement des réponses d’erreur (par défaut : `reply`). Remplacements par compte/groupe/sujet pris en charge.
- `channels.telegram.errorCooldownMs` : nombre minimal de ms entre deux réponses d’erreur dans la même discussion (par défaut : `60000`). Empêche le spam d’erreurs pendant les pannes.

- [Référence de configuration - Telegram](/fr/gateway/configuration-reference#telegram)

Champs à fort signal propres à Telegram :

- démarrage/auth : `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` doit pointer vers un fichier ordinaire ; les liens symboliques sont refusés)
- contrôle d’accès : `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de niveau supérieur (`type: "acp"`)
- approbations exec : `execApprovals`, `accounts.*.execApprovals`
- commandes/menu : `commands.native`, `commands.nativeSkills`, `customCommands`
- fils/réponses : `replyToMode`
- streaming : `streaming` (aperçu), `streaming.preview.toolProgress`, `blockStreaming`
- mise en forme/livraison : `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- média/réseau : `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook : `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- actions/capacités : `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- réactions : `reactionNotifications`, `reactionLevel`
- erreurs : `errorPolicy`, `errorCooldownMs`
- écritures/historique : `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Lié

- [Association](/fr/channels/pairing)
- [Groupes](/fr/channels/groups)
- [Sécurité](/fr/gateway/security)
- [Routage de canal](/fr/channels/channel-routing)
- [Routage multi-agent](/fr/concepts/multi-agent)
- [Dépannage](/fr/channels/troubleshooting)
