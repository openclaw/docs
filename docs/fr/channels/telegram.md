---
read_when:
    - Travailler sur les fonctionnalités Telegram ou les Webhooks
summary: État de la prise en charge du bot Telegram, capacités et configuration
title: Telegram
x-i18n:
    generated_at: "2026-04-25T13:42:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24c32a83e86358afb662c9c354a1b538c90693d07dcc048eaf047dabd6822f7e
    source_path: channels/telegram.md
    workflow: 15
---

Prêt pour la production pour les messages privés de bot et les groupes via grammY. Le long polling est le mode par défaut ; le mode webhook est facultatif.

<CardGroup cols={3}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    La politique DM par défaut pour Telegram est l’appairage.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics inter-canaux et procédures de réparation.
  </Card>
  <Card title="Configuration du Gateway" icon="settings" href="/fr/gateway/configuration">
    Modèles complets de configuration de canaux et exemples.
  </Card>
</CardGroup>

## Configuration rapide

<Steps>
  <Step title="Créer le jeton du bot dans BotFather">
    Ouvrez Telegram et discutez avec **@BotFather** (vérifiez que l’identifiant est exactement `@BotFather`).

    Exécutez `/newbot`, suivez les invites et enregistrez le jeton.

  </Step>

  <Step title="Configurer le jeton et la politique DM">

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

    Variable d’environnement de repli : `TELEGRAM_BOT_TOKEN=...` (compte par défaut uniquement).
    Telegram n’utilise **pas** `openclaw channels login telegram` ; configurez le jeton dans la config/l’environnement, puis démarrez le gateway.

  </Step>

  <Step title="Démarrer le gateway et approuver le premier DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Les codes d’appairage expirent après 1 heure.

  </Step>

  <Step title="Ajouter le bot à un groupe">
    Ajoutez le bot à votre groupe, puis définissez `channels.telegram.groups` et `groupPolicy` pour correspondre à votre modèle d’accès.
  </Step>
</Steps>

<Note>
L’ordre de résolution des jetons tient compte des comptes. En pratique, les valeurs de configuration priment sur la variable d’environnement de repli, et `TELEGRAM_BOT_TOKEN` s’applique uniquement au compte par défaut.
</Note>

## Paramètres côté Telegram

<AccordionGroup>
  <Accordion title="Mode confidentialité et visibilité en groupe">
    Les bots Telegram utilisent par défaut le **mode confidentialité**, qui limite les messages de groupe qu’ils reçoivent.

    Si le bot doit voir tous les messages du groupe, vous pouvez soit :

    - désactiver le mode confidentialité via `/setprivacy`, ou
    - faire du bot un administrateur du groupe.

    Lorsque vous changez le mode confidentialité, retirez puis rajoutez le bot dans chaque groupe afin que Telegram applique la modification.

  </Accordion>

  <Accordion title="Autorisations de groupe">
    Le statut d’administrateur se contrôle dans les paramètres du groupe Telegram.

    Les bots administrateurs reçoivent tous les messages du groupe, ce qui est utile pour un comportement de groupe toujours actif.

  </Accordion>

  <Accordion title="Options BotFather utiles">

    - `/setjoingroups` pour autoriser/refuser l’ajout à des groupes
    - `/setprivacy` pour le comportement de visibilité en groupe

  </Accordion>
</AccordionGroup>

## Contrôle d’accès et activation

<Tabs>
  <Tab title="Politique DM">
    `channels.telegram.dmPolicy` contrôle l’accès aux messages directs :

    - `pairing` (par défaut)
    - `allowlist` (nécessite au moins un ID d’expéditeur dans `allowFrom`)
    - `open` (nécessite que `allowFrom` inclue `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` accepte des identifiants utilisateur Telegram numériques. Les préfixes `telegram:` / `tg:` sont acceptés et normalisés.
    `dmPolicy: "allowlist"` avec `allowFrom` vide bloque tous les DM et est rejeté par la validation de configuration.
    La configuration demande uniquement des identifiants utilisateur numériques.
    Si vous avez effectué une mise à niveau et que votre configuration contient des entrées de liste d’autorisation `@username`, exécutez `openclaw doctor --fix` pour les résoudre (au mieux de ses capacités ; nécessite un jeton de bot Telegram).
    Si vous vous appuyiez auparavant sur des fichiers de liste d’autorisation du stockage d’appairage, `openclaw doctor --fix` peut récupérer les entrées dans `channels.telegram.allowFrom` dans les flux de liste d’autorisation (par exemple lorsque `dmPolicy: "allowlist"` n’a pas encore d’identifiants explicites).

    Pour les bots à propriétaire unique, préférez `dmPolicy: "allowlist"` avec des identifiants numériques explicites dans `allowFrom` afin de conserver une politique d’accès durable dans la configuration (au lieu de dépendre des approbations d’appairage précédentes).

    Confusion fréquente : l’approbation de l’appairage DM ne signifie pas « cet expéditeur est autorisé partout ».
    L’appairage accorde uniquement l’accès en DM. L’autorisation d’expéditeur en groupe provient toujours de listes d’autorisation explicites dans la configuration.
    Si vous voulez « je suis autorisé une fois et les DM comme les commandes de groupe fonctionnent », ajoutez votre identifiant utilisateur Telegram numérique dans `channels.telegram.allowFrom`.

    ### Trouver votre identifiant utilisateur Telegram

    Méthode plus sûre (sans bot tiers) :

    1. Envoyez un DM à votre bot.
    2. Exécutez `openclaw logs --follow`.
    3. Lisez `from.id`.

    Méthode officielle de l’API Bot :

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Méthode tierce (moins privée) : `@userinfobot` ou `@getidsbot`.

  </Tab>

  <Tab title="Politique de groupe et listes d’autorisation">
    Deux contrôles s’appliquent ensemble :

    1. **Quels groupes sont autorisés** (`channels.telegram.groups`)
       - aucune configuration `groups` :
         - avec `groupPolicy: "open"` : n’importe quel groupe peut passer les vérifications d’ID de groupe
         - avec `groupPolicy: "allowlist"` (par défaut) : les groupes sont bloqués jusqu’à ce que vous ajoutiez des entrées `groups` (ou `"*"`)
       - `groups` configuré : agit comme liste d’autorisation (ID explicites ou `"*"`)

    2. **Quels expéditeurs sont autorisés dans les groupes** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (par défaut)
       - `disabled`

    `groupAllowFrom` est utilisé pour le filtrage des expéditeurs en groupe. S’il n’est pas défini, Telegram revient à `allowFrom`.
    Les entrées `groupAllowFrom` doivent être des identifiants utilisateur Telegram numériques (les préfixes `telegram:` / `tg:` sont normalisés).
    Ne placez pas d’identifiants de chat de groupe ou supergroupe Telegram dans `groupAllowFrom`. Les identifiants de chat négatifs doivent se trouver sous `channels.telegram.groups`.
    Les entrées non numériques sont ignorées pour l’autorisation des expéditeurs.
    Limite de sécurité (`2026.2.25+`) : l’autorisation d’expéditeur en groupe n’hérite **pas** des approbations du stockage d’appairage DM.
    L’appairage reste limité aux DM. Pour les groupes, définissez `groupAllowFrom` ou `allowFrom` par groupe/par sujet.
    Si `groupAllowFrom` n’est pas défini, Telegram revient à `allowFrom` de la configuration, pas au stockage d’appairage.
    Modèle pratique pour les bots à propriétaire unique : définissez votre identifiant utilisateur dans `channels.telegram.allowFrom`, laissez `groupAllowFrom` non défini et autorisez les groupes cibles sous `channels.telegram.groups`.
    Remarque d’exécution : si `channels.telegram` est complètement absent, l’exécution utilise par défaut `groupPolicy="allowlist"` en mode fail-closed sauf si `channels.defaults.groupPolicy` est explicitement défini.

    Exemple : autoriser n’importe quel membre dans un groupe spécifique :

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

    Exemple : autoriser uniquement certains utilisateurs dans un groupe spécifique :

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
      Erreur fréquente : `groupAllowFrom` n’est pas une liste d’autorisation de groupes Telegram.

      - Placez les identifiants négatifs de groupe ou supergroupe Telegram comme `-1001234567890` sous `channels.telegram.groups`.
      - Placez les identifiants utilisateur Telegram comme `8734062810` sous `groupAllowFrom` lorsque vous voulez limiter quelles personnes à l’intérieur d’un groupe autorisé peuvent déclencher le bot.
      - Utilisez `groupAllowFrom: ["*"]` uniquement lorsque vous voulez que n’importe quel membre d’un groupe autorisé puisse parler au bot.
    </Warning>

  </Tab>

  <Tab title="Comportement des mentions">
    Les réponses en groupe exigent une mention par défaut.

    La mention peut provenir de :

    - une mention native `@botusername`, ou
    - des motifs de mention dans :
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Commandes de bascule au niveau de la session :

    - `/activation always`
    - `/activation mention`

    Elles mettent à jour uniquement l’état de la session. Utilisez la configuration pour la persistance.

    Exemple de configuration persistante :

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

    Obtenir l’identifiant du chat de groupe :

    - transférer un message de groupe à `@userinfobot` / `@getidsbot`
    - ou lire `chat.id` depuis `openclaw logs --follow`
    - ou inspecter `getUpdates` de l’API Bot

  </Tab>
</Tabs>

## Comportement à l’exécution

- Telegram appartient au processus gateway.
- Le routage est déterministe : les réponses entrantes de Telegram repartent vers Telegram (le modèle ne choisit pas les canaux).
- Les messages entrants sont normalisés dans l’enveloppe de canal partagée avec des métadonnées de réponse et des espaces réservés pour les médias.
- Les sessions de groupe sont isolées par identifiant de groupe. Les sujets de forum ajoutent `:topic:<threadId>` pour conserver l’isolation des sujets.
- Les messages DM peuvent inclure `message_thread_id` ; OpenClaw les route avec des clés de session tenant compte des threads et conserve l’identifiant de thread pour les réponses.
- Le long polling utilise grammY runner avec un séquencement par chat/par thread. La concurrence globale du récepteur runner utilise `agents.defaults.maxConcurrent`.
- Le long polling est protégé à l’intérieur de chaque processus gateway afin qu’un seul poller actif puisse utiliser un jeton de bot à la fois. Si vous voyez encore des conflits `getUpdates` 409, un autre gateway OpenClaw, script ou poller externe utilise probablement le même jeton.
- Les redémarrages du watchdog de long polling se déclenchent par défaut après 120 secondes sans signal de vie `getUpdates` terminé. Augmentez `channels.telegram.pollingStallThresholdMs` uniquement si votre déploiement voit encore de faux redémarrages de blocage du polling pendant un travail de longue durée. La valeur est en millisecondes et est autorisée de `30000` à `600000` ; les remplacements par compte sont pris en charge.
- L’API Telegram Bot ne prend pas en charge les accusés de lecture (`sendReadReceipts` ne s’applique pas).

## Référence des fonctionnalités

<AccordionGroup>
  <Accordion title="Aperçu de flux en direct (modifications de message)">
    OpenClaw peut diffuser des réponses partielles en temps réel :

    - chats directs : message d’aperçu + `editMessageText`
    - groupes/sujets : message d’aperçu + `editMessageText`

    Exigence :

    - `channels.telegram.streaming` est `off | partial | block | progress` (par défaut : `partial`)
    - `progress` correspond à `partial` sur Telegram (compatibilité avec le nommage inter-canaux)
    - `streaming.preview.toolProgress` contrôle si les mises à jour d’outil/progression réutilisent le même message d’aperçu modifié (par défaut : `true` lorsque le flux d’aperçu est actif)
    - les anciennes valeurs booléennes `channels.telegram.streamMode` et `streaming` sont détectées ; exécutez `openclaw doctor --fix` pour les migrer vers `channels.telegram.streaming.mode`

    Les mises à jour d’aperçu de progression des outils sont les courtes lignes « Working... » affichées pendant l’exécution des outils, par exemple exécution de commande, lectures de fichiers, mises à jour de planification ou résumés de correctif. Telegram les laisse activées par défaut pour correspondre au comportement d’OpenClaw publié à partir de `v2026.4.22`. Pour conserver l’aperçu modifié pour le texte de réponse tout en masquant les lignes de progression des outils, définissez :

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    Utilisez `streaming.mode: "off"` uniquement lorsque vous voulez désactiver entièrement les modifications d’aperçu Telegram. Utilisez `streaming.preview.toolProgress: false` lorsque vous voulez seulement désactiver les lignes d’état de progression des outils.

    Pour les réponses texte uniquement :

    - DM : OpenClaw conserve le même message d’aperçu et effectue une modification finale sur place (pas de second message)
    - groupe/sujet : OpenClaw conserve le même message d’aperçu et effectue une modification finale sur place (pas de second message)

    Pour les réponses complexes (par exemple des charges utiles multimédias), OpenClaw revient à la livraison finale normale puis nettoie le message d’aperçu.

    Le flux d’aperçu est distinct du flux par blocs. Lorsque le flux par blocs est explicitement activé pour Telegram, OpenClaw ignore le flux d’aperçu pour éviter un double flux.

    Si le transport brouillon natif est indisponible ou rejeté, OpenClaw revient automatiquement à `sendMessage` + `editMessageText`.

    Flux de raisonnement réservé à Telegram :

    - `/reasoning stream` envoie le raisonnement vers l’aperçu en direct pendant la génération
    - la réponse finale est envoyée sans le texte de raisonnement

  </Accordion>

  <Accordion title="Formatage et repli HTML">
    Le texte sortant utilise Telegram `parse_mode: "HTML"`.

    - Le texte de type Markdown est rendu en HTML sûr pour Telegram.
- Le HTML brut du modèle est échappé pour réduire les échecs d’analyse de Telegram.
- Si Telegram rejette le HTML analysé, OpenClaw réessaie en texte brut.

Les aperçus de liens sont activés par défaut et peuvent être désactivés avec `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Commandes natives et commandes personnalisées">
    L’enregistrement du menu de commandes Telegram est géré au démarrage avec `setMyCommands`.

    Valeurs par défaut des commandes natives :

    - `commands.native: "auto"` active les commandes natives pour Telegram

    Ajoutez des entrées de menu de commandes personnalisées :

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

    Règles :

    - les noms sont normalisés (suppression du `/` initial, minuscules)
    - motif valide : `a-z`, `0-9`, `_`, longueur `1..32`
    - les commandes personnalisées ne peuvent pas remplacer les commandes natives
    - les conflits/doublons sont ignorés et journalisés

    Remarques :

    - les commandes personnalisées sont uniquement des entrées de menu ; elles n’implémentent pas automatiquement un comportement
    - les commandes de Plugin/Skills peuvent toujours fonctionner lorsqu’elles sont saisies, même si elles ne sont pas affichées dans le menu Telegram

    Si les commandes natives sont désactivées, les commandes intégrées sont supprimées. Les commandes personnalisées/de Plugin peuvent toujours être enregistrées si elles sont configurées.

    Échecs de configuration fréquents :

    - `setMyCommands failed` avec `BOT_COMMANDS_TOO_MUCH` signifie que le menu Telegram déborde encore après réduction ; réduisez les commandes de Plugin/Skills/personnalisées ou désactivez `channels.telegram.commands.native`.
    - `setMyCommands failed` avec des erreurs réseau/fetch signifie généralement que le DNS/HTTPS sortant vers `api.telegram.org` est bloqué.

    ### Commandes d’appairage d’appareil (Plugin `device-pair`)

    Lorsque le Plugin `device-pair` est installé :

    1. `/pair` génère un code de configuration
    2. collez le code dans l’application iOS
    3. `/pair pending` liste les demandes en attente (y compris rôle/scopes)
    4. approuvez la demande :
       - `/pair approve <requestId>` pour une approbation explicite
       - `/pair approve` lorsqu’il n’y a qu’une seule demande en attente
       - `/pair approve latest` pour la plus récente

    Le code de configuration contient un jeton bootstrap de courte durée. Le transfert bootstrap intégré conserve le jeton du nœud principal à `scopes: []` ; tout jeton opérateur transféré reste limité à `operator.approvals`, `operator.read`, `operator.talk.secrets` et `operator.write`. Les vérifications de scope bootstrap sont préfixées par rôle ; cette liste d’autorisation opérateur ne satisfait donc que les demandes opérateur ; les rôles non opérateur ont toujours besoin de scopes sous leur propre préfixe de rôle.

    Si un appareil réessaie avec des détails d’authentification modifiés (par exemple rôle/scopes/clé publique), la demande en attente précédente est remplacée et la nouvelle demande utilise un `requestId` différent. Réexécutez `/pair pending` avant d’approuver.

    Plus de détails : [Appairage](/fr/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Boutons en ligne">
    Configurez la portée du clavier en ligne :

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

    Remplacement par compte :

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

    Portées :

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (par défaut)

    L’ancienne valeur `capabilities: ["inlineButtons"]` correspond à `inlineButtons: "all"`.

    Exemple d’action de message :

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choisissez une option :",
  buttons: [
    [
      { text: "Oui", callback_data: "yes" },
      { text: "Non", callback_data: "no" },
    ],
    [{ text: "Annuler", callback_data: "cancel" }],
  ],
}
```

    Les clics de rappel sont transmis à l’agent sous forme de texte :
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Actions de message Telegram pour les agents et l’automatisation">
    Les actions d’outil Telegram comprennent :

    - `sendMessage` (`to`, `content`, `mediaUrl`, `replyToMessageId`, `messageThreadId` facultatifs)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, `iconColor`, `iconCustomEmojiId` facultatifs)

    Les actions de message de canal exposent des alias ergonomiques (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Contrôles de restriction :

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (par défaut : désactivé)

    Remarque : `edit` et `topic-create` sont actuellement activés par défaut et n’ont pas de bascules `channels.telegram.actions.*` distinctes.
    Les envois à l’exécution utilisent l’instantané actif de configuration/secrets (démarrage/rechargement), donc les chemins d’action n’effectuent pas de nouvelle résolution ad hoc de SecretRef à chaque envoi.

    Sémantique de suppression de réaction : [/tools/reactions](/fr/tools/reactions)

  </Accordion>

  <Accordion title="Balises de fil de réponse">
    Telegram prend en charge des balises explicites de fil de réponse dans la sortie générée :

    - `[[reply_to_current]]` répond au message déclencheur
    - `[[reply_to:<id>]]` répond à un identifiant de message Telegram spécifique

    `channels.telegram.replyToMode` contrôle le traitement :

    - `off` (par défaut)
    - `first`
    - `all`

    Remarque : `off` désactive le fil de réponse implicite. Les balises explicites `[[reply_to_*]]` sont toujours respectées.

  </Accordion>

  <Accordion title="Sujets de forum et comportement des fils">
    Supergroupes de forum :

    - les clés de session de sujet ajoutent `:topic:<threadId>`
    - les réponses et l’indicateur de saisie ciblent le fil du sujet
    - chemin de configuration du sujet :
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Cas particulier du sujet général (`threadId=1`) :

    - les envois de message omettent `message_thread_id` (Telegram rejette `sendMessage(...thread_id=1)`)
    - les actions d’indicateur de saisie incluent toujours `message_thread_id`

    Héritage des sujets : les entrées de sujet héritent des paramètres du groupe sauf remplacement (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` est propre au sujet et n’hérite pas des valeurs par défaut du groupe.

    **Routage d’agent par sujet** : chaque sujet peut être routé vers un agent différent en définissant `agentId` dans la configuration du sujet. Cela donne à chaque sujet son propre espace de travail, sa propre mémoire et sa propre session isolés. Exemple :

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

    Chaque sujet a alors sa propre clé de session : `agent:zu:telegram:group:-1001234567890:topic:3`

    **Liaison persistante de sujet ACP** : les sujets de forum peuvent épingler des sessions de harnais ACP via des liaisons ACP typées de premier niveau (`bindings[]` avec `type: "acp"` et `match.channel: "telegram"`, `peer.kind: "group"` et un identifiant qualifié par sujet comme `-1001234567890:topic:42`). Actuellement limité aux sujets de forum dans les groupes/supergroupes. Voir [Agents ACP](/fr/tools/acp-agents).

    **Création ACP liée à un fil depuis le chat** : `/acp spawn <agent> --thread here|auto` lie le sujet actuel à une nouvelle session ACP ; les suivis y sont ensuite routés directement. OpenClaw épingle la confirmation de création dans le sujet. Nécessite `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Le contexte de modèle expose `MessageThreadId` et `IsForum`. Les chats DM avec `message_thread_id` conservent le routage DM, mais utilisent des clés de session tenant compte des fils.

  </Accordion>

  <Accordion title="Audio, vidéo et stickers">
    ### Messages audio

    Telegram distingue les notes vocales des fichiers audio.

    - par défaut : comportement de fichier audio
    - balise `[[audio_as_voice]]` dans la réponse de l’agent pour forcer l’envoi en note vocale

    Exemple d’action de message :

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

    Telegram distingue les fichiers vidéo des pastilles vidéo.

    Exemple d’action de message :

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Les pastilles vidéo ne prennent pas en charge les légendes ; le texte du message fourni est envoyé séparément.

    ### Stickers

    Gestion des stickers entrants :

    - WEBP statique : téléchargé et traité (espace réservé `<media:sticker>`)
    - TGS animé : ignoré
    - WEBM vidéo : ignoré

    Champs de contexte des stickers :

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Fichier de cache des stickers :

    - `~/.openclaw/telegram/sticker-cache.json`

    Les stickers sont décrits une fois (lorsque c’est possible) puis mis en cache pour réduire les appels de vision répétés.

    Activer les actions de sticker :

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

    Action d’envoi de sticker :

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Rechercher dans les stickers mis en cache :

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

    Lorsqu’elles sont activées, OpenClaw met en file d’attente des événements système tels que :

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuration :

    - `channels.telegram.reactionNotifications` : `off | own | all` (par défaut : `own`)
    - `channels.telegram.reactionLevel` : `off | ack | minimal | extensive` (par défaut : `minimal`)

    Remarques :

    - `own` signifie uniquement les réactions utilisateur aux messages envoyés par le bot (au mieux via le cache des messages envoyés).
    - Les événements de réaction respectent toujours les contrôles d’accès Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) ; les expéditeurs non autorisés sont ignorés.
    - Telegram ne fournit pas d’identifiants de fil dans les mises à jour de réaction.
      - les groupes non forum sont routés vers la session du chat de groupe
      - les groupes forum sont routés vers la session du sujet général du groupe (`:topic:1`), pas vers le sujet d’origine exact

    `allowed_updates` pour le polling/webhook inclut automatiquement `message_reaction`.

  </Accordion>

  <Accordion title="Réactions d’accusé de réception">
    `ackReaction` envoie un emoji d’accusé de réception pendant qu’OpenClaw traite un message entrant.

    Ordre de résolution :

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - repli sur l’emoji d’identité de l’agent (`agents.list[].identity.emoji`, sinon "👀")

    Remarques :

    - Telegram attend un emoji unicode (par exemple "👀").
    - Utilisez `""` pour désactiver la réaction pour un canal ou un compte.

  </Accordion>

  <Accordion title="Écritures de configuration depuis les événements et commandes Telegram">
    Les écritures de configuration du canal sont activées par défaut (`configWrites !== false`).

    Les écritures déclenchées par Telegram comprennent :

    - événements de migration de groupe (`migrate_to_chat_id`) pour mettre à jour `channels.telegram.groups`
    - `/config set` et `/config unset` (nécessite l’activation de la commande)

    Désactiver :

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

  <Accordion title="Long polling vs webhook">
    Le mode par défaut est le long polling. Pour le mode webhook, définissez `channels.telegram.webhookUrl` et `channels.telegram.webhookSecret` ; `webhookPath`, `webhookHost`, `webhookPort` sont facultatifs (valeurs par défaut : `/telegram-webhook`, `127.0.0.1`, `8787`).

    L’écouteur local se lie à `127.0.0.1:8787`. Pour une entrée publique, placez soit un proxy inverse devant le port local, soit définissez intentionnellement `webhookHost: "0.0.0.0"`.

    Le mode Webhook valide les garde-fous de requête, le jeton secret Telegram et le corps JSON avant de renvoyer `200` à Telegram.
    OpenClaw traite ensuite la mise à jour de manière asynchrone via les mêmes voies de bot par chat/par sujet que celles utilisées par le long polling, afin que les tours d’agent lents ne bloquent pas l’accusé de réception de livraison de Telegram.

  </Accordion>

  <Accordion title="Limites, nouvelles tentatives et cibles CLI">
    - la valeur par défaut de `channels.telegram.textChunkLimit` est 4000.
    - `channels.telegram.chunkMode="newline"` privilégie les limites de paragraphe (lignes vides) avant le découpage par longueur.
    - `channels.telegram.mediaMaxMb` (par défaut 100) plafonne la taille des médias Telegram entrants et sortants.
    - `channels.telegram.timeoutSeconds` remplace le délai d’attente du client API Telegram (si non défini, la valeur par défaut de grammY s’applique).
    - `channels.telegram.pollingStallThresholdMs` vaut `120000` par défaut ; ajustez entre `30000` et `600000` uniquement pour les redémarrages à faux positifs dus à un blocage du polling.
    - l’historique de contexte de groupe utilise `channels.telegram.historyLimit` ou `messages.groupChat.historyLimit` (par défaut 50) ; `0` désactive.
    - le contexte supplémentaire de réponse/citation/transfert est actuellement transmis tel que reçu.
    - les listes d’autorisation Telegram contrôlent principalement qui peut déclencher l’agent, et ne constituent pas une frontière complète de rédaction du contexte supplémentaire.
    - contrôles de l’historique DM :
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - la configuration `channels.telegram.retry` s’applique aux assistants d’envoi Telegram (CLI/outils/actions) pour les erreurs récupérables de l’API sortante.

    La cible d’envoi CLI peut être un identifiant de chat numérique ou un nom d’utilisateur :

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Les polls Telegram utilisent `openclaw message poll` et prennent en charge les sujets de forum :

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Options de poll réservées à Telegram :

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` pour les sujets de forum (ou utilisez une cible `:topic:`)

    L’envoi Telegram prend également en charge :

    - `--presentation` avec des blocs `buttons` pour les claviers en ligne lorsque `channels.telegram.capabilities.inlineButtons` l’autorise
    - `--pin` ou `--delivery '{"pin":true}'` pour demander un envoi épinglé lorsque le bot peut épingler dans ce chat
    - `--force-document` pour envoyer les images et GIF sortants comme documents au lieu de téléversements compressés en photo ou média animé

    Restriction des actions :

    - `channels.telegram.actions.sendMessage=false` désactive les messages Telegram sortants, y compris les polls
    - `channels.telegram.actions.poll=false` désactive la création de polls Telegram tout en laissant les envois réguliers activés

  </Accordion>

  <Accordion title="Approbations exec dans Telegram">
    Telegram prend en charge les approbations exec dans les DM des approbateurs et peut éventuellement publier les invites dans le chat ou le sujet d’origine. Les approbateurs doivent être des identifiants utilisateur Telegram numériques.

    Chemin de configuration :

    - `channels.telegram.execApprovals.enabled` (s’active automatiquement lorsqu’au moins un approbateur peut être résolu)
    - `channels.telegram.execApprovals.approvers` (revient aux identifiants propriétaire numériques de `allowFrom` / `defaultTo`)
    - `channels.telegram.execApprovals.target` : `dm` (par défaut) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    La livraison vers le canal affiche le texte de la commande dans le chat ; activez `channel` ou `both` uniquement dans des groupes/sujets de confiance. Lorsque l’invite arrive dans un sujet de forum, OpenClaw conserve le sujet pour l’invite d’approbation et le suivi. Les approbations exec expirent après 30 minutes par défaut.

    Les boutons d’approbation en ligne exigent aussi que `channels.telegram.capabilities.inlineButtons` autorise la surface cible (`dm`, `group` ou `all`). Les identifiants d’approbation préfixés par `plugin:` sont résolus via les approbations de Plugin ; les autres sont d’abord résolus via les approbations exec.

    Voir [Approbations exec](/fr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Contrôles des réponses d’erreur

Lorsque l’agent rencontre une erreur de livraison ou de fournisseur, Telegram peut soit répondre avec le texte d’erreur, soit le supprimer. Deux clés de configuration contrôlent ce comportement :

| Clé                                 | Valeurs           | Par défaut | Description                                                                                         |
| ----------------------------------- | ----------------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply` envoie un message d’erreur convivial dans le chat. `silent` supprime entièrement les réponses d’erreur. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`    | Temps minimal entre les réponses d’erreur vers le même chat. Empêche le spam d’erreurs pendant les pannes. |

Les remplacements par compte, par groupe et par sujet sont pris en charge (même héritage que les autres clés de configuration Telegram).

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

    - si `requireMention=false`, le mode confidentialité de Telegram doit autoriser une visibilité complète.
      - BotFather : `/setprivacy` -> Désactiver
      - puis retirer et rajouter le bot dans le groupe
    - `openclaw channels status` avertit lorsque la configuration attend des messages de groupe sans mention.
    - `openclaw channels status --probe` peut vérifier des identifiants de groupe numériques explicites ; le joker `"*"` ne peut pas faire l’objet d’une vérification d’appartenance.
    - test rapide de session : `/activation always`.

  </Accordion>

  <Accordion title="Le bot ne voit pas du tout les messages de groupe">

    - lorsque `channels.telegram.groups` existe, le groupe doit être listé (ou inclure `"*"`)
    - vérifiez l’appartenance du bot au groupe
    - examinez les journaux : `openclaw logs --follow` pour les raisons d’ignorance

  </Accordion>

  <Accordion title="Les commandes fonctionnent partiellement ou pas du tout">

    - autorisez l’identité de votre expéditeur (appairage et/ou `allowFrom` numérique)
    - l’autorisation des commandes s’applique toujours même lorsque la politique de groupe est `open`
    - `setMyCommands failed` avec `BOT_COMMANDS_TOO_MUCH` signifie que le menu natif comporte trop d’entrées ; réduisez les commandes de Plugin/Skills/personnalisées ou désactivez les menus natifs
    - `setMyCommands failed` avec des erreurs réseau/fetch indique généralement des problèmes d’accessibilité DNS/HTTPS vers `api.telegram.org`

  </Accordion>

  <Accordion title="Instabilité du polling ou du réseau">

    - Node 22+ + fetch/proxy personnalisé peut déclencher un comportement d’abandon immédiat si les types AbortSignal ne correspondent pas.
    - Certains hôtes résolvent `api.telegram.org` en IPv6 en premier ; une sortie IPv6 défaillante peut provoquer des échecs intermittents de l’API Telegram.
    - Si les journaux incluent `TypeError: fetch failed` ou `Network request for 'getUpdates' failed!`, OpenClaw les réessaie désormais comme erreurs réseau récupérables.
    - Si les journaux incluent `Polling stall detected`, OpenClaw redémarre le polling et reconstruit le transport Telegram après 120 secondes sans signal de vie de long polling terminé par défaut.
    - Augmentez `channels.telegram.pollingStallThresholdMs` uniquement lorsque les appels `getUpdates` de longue durée sont sains mais que votre hôte signale encore de faux redémarrages de blocage du polling. Les blocages persistants indiquent généralement des problèmes de proxy, DNS, IPv6 ou de sortie TLS entre l’hôte et `api.telegram.org`.
    - Sur les hôtes VPS avec une sortie directe/TLS instable, faites passer les appels à l’API Telegram via `channels.telegram.proxy` :

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ utilise par défaut `autoSelectFamily=true` (sauf WSL2) et `dnsResultOrder=ipv4first`.
    - Si votre hôte est WSL2 ou fonctionne explicitement mieux avec un comportement IPv4 uniquement, forcez la sélection de famille :

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Les réponses de plage de benchmark RFC 2544 (`198.18.0.0/15`) sont déjà autorisées
      par défaut pour les téléchargements de médias Telegram. Si un faux-IP de confiance ou
      un proxy transparent réécrit `api.telegram.org` vers une autre
      adresse privée/interne/à usage spécial pendant les téléchargements de médias, vous pouvez
      activer le contournement réservé à Telegram :

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Le même opt-in est disponible par compte dans
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Si votre proxy résout les hôtes médias Telegram en `198.18.x.x`, laissez
      d’abord l’option dangereuse désactivée. Les médias Telegram autorisent déjà par défaut
      la plage de benchmark RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` affaiblit les protections SSRF des médias Telegram. Utilisez-le uniquement dans des environnements proxy de confiance contrôlés par l’opérateur, comme le routage fake-IP de Clash, Mihomo ou Surge lorsqu’ils synthétisent des réponses privées ou à usage spécial en dehors de la plage de benchmark RFC 2544. Laissez-le désactivé pour un accès Telegram normal sur l’internet public.
    </Warning>

    - Remplacements d’environnement (temporaires) :
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Valider les réponses DNS :

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Plus d’aide : [Dépannage des canaux](/fr/channels/troubleshooting).

## Référence de configuration

Référence principale : [Référence de configuration - Telegram](/fr/gateway/config-channels#telegram).

<Accordion title="Champs Telegram à fort signal">

- démarrage/auth : `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` doit pointer vers un fichier ordinaire ; les liens symboliques sont rejetés)
- contrôle d’accès : `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de premier niveau (`type: "acp"`)
- approbations exec : `execApprovals`, `accounts.*.execApprovals`
- commande/menu : `commands.native`, `commands.nativeSkills`, `customCommands`
- fils/réponses : `replyToMode`
- streaming : `streaming` (aperçu), `streaming.preview.toolProgress`, `blockStreaming`
- formatage/livraison : `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- médias/réseau : `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- webhook : `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- actions/capacités : `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- réactions : `reactionNotifications`, `reactionLevel`
- erreurs : `errorPolicy`, `errorCooldownMs`
- écritures/historique : `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Priorité multi-comptes : lorsque deux identifiants de compte ou plus sont configurés, définissez `channels.telegram.defaultAccount` (ou incluez `channels.telegram.accounts.default`) pour rendre le routage par défaut explicite. Sinon, OpenClaw revient au premier identifiant de compte normalisé et `openclaw doctor` émet un avertissement. Les comptes nommés héritent de `channels.telegram.allowFrom` / `groupAllowFrom`, mais pas des valeurs `accounts.default.*`.
</Note>

## Connexe

<CardGroup cols={2}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    Appairer un utilisateur Telegram au gateway.
  </Card>
  <Card title="Groupes" icon="users" href="/fr/channels/groups">
    Comportement des listes d’autorisation pour les groupes et sujets.
  </Card>
  <Card title="Routage des canaux" icon="route" href="/fr/channels/channel-routing">
    Router les messages entrants vers les agents.
  </Card>
  <Card title="Sécurité" icon="shield" href="/fr/gateway/security">
    Modèle de menace et renforcement.
  </Card>
  <Card title="Routage multi-agent" icon="sitemap" href="/fr/concepts/multi-agent">
    Mapper les groupes et sujets aux agents.
  </Card>
  <Card title="Dépannage" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics inter-canaux.
  </Card>
</CardGroup>
