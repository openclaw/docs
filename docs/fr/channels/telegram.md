---
read_when:
    - Travailler sur les fonctionnalités Telegram ou les Webhooks
summary: État de la prise en charge, capacités et configuration du bot Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-11T20:22:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f14e59b18e3727b13598d2a5f83ba3ca4267c27c1bd295d36ad20c64707791a
    source_path: channels/telegram.md
    workflow: 16
---

Prêt pour la production pour les DM et les groupes de bot via grammY. L’interrogation longue est le mode par défaut ; le mode Webhook est optionnel.

<CardGroup cols={3}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    La politique de DM par défaut pour Telegram est l’appairage.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics intercanaux et guides de réparation.
  </Card>
  <Card title="Configuration du Gateway" icon="settings" href="/fr/gateway/configuration">
    Modèles et exemples complets de configuration des canaux.
  </Card>
</CardGroup>

## Configuration rapide

<Steps>
  <Step title="Créer le jeton du bot dans BotFather">
    Ouvrez Telegram et discutez avec **@BotFather** (confirmez que le pseudo est exactement `@BotFather`).

    Exécutez `/newbot`, suivez les invites et enregistrez le jeton.

  </Step>

  <Step title="Configurer le jeton et la politique de DM">

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

    Solution de repli via l’environnement : `TELEGRAM_BOT_TOKEN=...` (compte par défaut uniquement).
    Telegram n’utilise **pas** `openclaw channels login telegram` ; configurez le jeton dans la config/l’environnement, puis démarrez le Gateway.

  </Step>

  <Step title="Démarrer le Gateway et approuver le premier DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Les codes d’appairage expirent après 1 heure.

  </Step>

  <Step title="Ajouter le bot à un groupe">
    Ajoutez le bot à votre groupe, puis récupérez les deux ID nécessaires à l’accès au groupe :

    - votre ID utilisateur Telegram, utilisé dans `allowFrom` / `groupAllowFrom`
    - l’ID de chat du groupe Telegram, utilisé comme clé sous `channels.telegram.groups`

    Pour une première configuration, récupérez l’ID de chat du groupe depuis `openclaw logs --follow`, un bot d’ID transféré ou `getUpdates` de l’API Bot. Une fois le groupe autorisé, `/whoami@<bot_username>` peut confirmer les ID utilisateur et groupe.

    Les ID de supergroupe Telegram négatifs qui commencent par `-100` sont des ID de chat de groupe. Placez-les sous `channels.telegram.groups`, pas sous `groupAllowFrom`.

  </Step>
</Steps>

<Note>
L’ordre de résolution des jetons tient compte du compte. En pratique, les valeurs de configuration l’emportent sur la solution de repli via l’environnement, et `TELEGRAM_BOT_TOKEN` s’applique uniquement au compte par défaut.
</Note>

## Paramètres côté Telegram

<AccordionGroup>
  <Accordion title="Mode confidentialité et visibilité des groupes">
    Les bots Telegram utilisent par défaut le **mode confidentialité**, qui limite les messages de groupe qu’ils reçoivent.

    Si le bot doit voir tous les messages de groupe, vous pouvez :

    - désactiver le mode confidentialité via `/setprivacy`, ou
    - faire du bot un administrateur du groupe.

    Lorsque vous basculez le mode confidentialité, supprimez puis rajoutez le bot dans chaque groupe afin que Telegram applique le changement.

  </Accordion>

  <Accordion title="Autorisations de groupe">
    Le statut d’administrateur est contrôlé dans les paramètres du groupe Telegram.

    Les bots administrateurs reçoivent tous les messages de groupe, ce qui est utile pour un comportement de groupe toujours actif.

  </Accordion>

  <Accordion title="Options BotFather utiles">

    - `/setjoingroups` pour autoriser/refuser les ajouts à des groupes
    - `/setprivacy` pour le comportement de visibilité dans les groupes

  </Accordion>
</AccordionGroup>

## Contrôle d’accès et activation

<Tabs>
  <Tab title="Politique de DM">
    `channels.telegram.dmPolicy` contrôle l’accès aux messages directs :

    - `pairing` (par défaut)
    - `allowlist` (nécessite au moins un ID d’expéditeur dans `allowFrom`)
    - `open` (nécessite que `allowFrom` inclue `"*"`)
    - `disabled`

    `dmPolicy: "open"` avec `allowFrom: ["*"]` permet à tout compte Telegram qui trouve ou devine le nom d’utilisateur du bot de commander le bot. Utilisez cela uniquement pour des bots volontairement publics avec des outils très restreints ; les bots à propriétaire unique doivent utiliser `allowlist` avec des ID utilisateur numériques.

    `channels.telegram.allowFrom` accepte les ID utilisateur Telegram numériques. Les préfixes `telegram:` / `tg:` sont acceptés et normalisés.
    Dans les configurations multicomptes, un `channels.telegram.allowFrom` de niveau supérieur restrictif est traité comme une limite de sécurité : les entrées `allowFrom: ["*"]` au niveau du compte ne rendent pas ce compte public, sauf si la liste d’autorisation effective du compte contient encore un joker explicite après fusion.
    `dmPolicy: "allowlist"` avec un `allowFrom` vide bloque tous les DM et est rejeté par la validation de configuration.
    La configuration demande uniquement des ID utilisateur numériques.
    Si vous avez effectué une mise à niveau et que votre configuration contient des entrées de liste d’autorisation `@username`, exécutez `openclaw doctor --fix` pour les résoudre (meilleur effort ; nécessite un jeton de bot Telegram).
    Si vous vous reposiez précédemment sur des fichiers de liste d’autorisation du magasin d’appairage, `openclaw doctor --fix` peut récupérer les entrées dans `channels.telegram.allowFrom` dans les flux de liste d’autorisation (par exemple lorsque `dmPolicy: "allowlist"` n’a pas encore d’ID explicites).

    Pour les bots à propriétaire unique, préférez `dmPolicy: "allowlist"` avec des ID `allowFrom` numériques explicites afin de conserver une politique d’accès durable dans la configuration (au lieu de dépendre d’approbations d’appairage précédentes).

    Confusion courante : l’approbation d’appairage DM ne signifie pas « cet expéditeur est autorisé partout ».
    L’appairage accorde l’accès aux DM. Si aucun propriétaire de commandes n’existe encore, le premier appairage approuvé définit aussi `commands.ownerAllowFrom` afin que les commandes réservées au propriétaire et les approbations d’exécution aient un compte opérateur explicite.
    L’autorisation des expéditeurs de groupe vient toujours des listes d’autorisation explicites dans la configuration.
    Si vous voulez « je suis autorisé une fois et les DM comme les commandes de groupe fonctionnent », mettez votre ID utilisateur Telegram numérique dans `channels.telegram.allowFrom` ; pour les commandes réservées au propriétaire, assurez-vous que `commands.ownerAllowFrom` contient `telegram:<your user id>`.

    ### Trouver votre ID utilisateur Telegram

    Plus sûr (aucun bot tiers) :

    1. Envoyez un DM à votre bot.
    2. Exécutez `openclaw logs --follow`.
    3. Lisez `from.id`.

    Méthode officielle avec l’API Bot :

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Méthode tierce (moins privée) : `@userinfobot` ou `@getidsbot`.

  </Tab>

  <Tab title="Politique de groupe et listes d’autorisation">
    Deux contrôles s’appliquent ensemble :

    1. **Quels groupes sont autorisés** (`channels.telegram.groups`)
       - aucune config `groups` :
         - avec `groupPolicy: "open"` : n’importe quel groupe peut passer les vérifications d’ID de groupe
         - avec `groupPolicy: "allowlist"` (par défaut) : les groupes sont bloqués jusqu’à ce que vous ajoutiez des entrées `groups` (ou `"*"`)
       - `groups` configuré : agit comme une liste d’autorisation (ID explicites ou `"*"`)

    2. **Quels expéditeurs sont autorisés dans les groupes** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (par défaut)
       - `disabled`

    `groupAllowFrom` est utilisé pour le filtrage des expéditeurs de groupe. S’il n’est pas défini, Telegram se replie sur `allowFrom`.
    Les entrées `groupAllowFrom` doivent être des ID utilisateur Telegram numériques (les préfixes `telegram:` / `tg:` sont normalisés).
    Ne mettez pas d’ID de chat de groupe ou de supergroupe Telegram dans `groupAllowFrom`. Les ID de chat négatifs vont sous `channels.telegram.groups`.
    Les entrées non numériques sont ignorées pour l’autorisation des expéditeurs.
    Limite de sécurité (`2026.2.25+`) : l’authentification des expéditeurs de groupe n’hérite **pas** des approbations du magasin d’appairage DM.
    L’appairage reste réservé aux DM. Pour les groupes, définissez `groupAllowFrom` ou un `allowFrom` par groupe/sujet.
    Si `groupAllowFrom` n’est pas défini, Telegram se replie sur la config `allowFrom`, pas sur le magasin d’appairage.
    Modèle pratique pour les bots à propriétaire unique : définissez votre ID utilisateur dans `channels.telegram.allowFrom`, laissez `groupAllowFrom` non défini et autorisez les groupes cibles sous `channels.telegram.groups`.
    Note d’exécution : si `channels.telegram` est complètement absent, l’exécution utilise par défaut un `groupPolicy="allowlist"` fermé par défaut, sauf si `channels.defaults.groupPolicy` est explicitement défini.

    Configuration de groupe réservée au propriétaire :

```json5
{
  channels: {
    telegram: {
      enabled: true,
      dmPolicy: "pairing",
      allowFrom: ["<YOUR_TELEGRAM_USER_ID>"],
      groupPolicy: "allowlist",
      groups: {
        "<GROUP_CHAT_ID>": {
          requireMention: true,
        },
      },
    },
  },
}
```

    Testez-le depuis le groupe avec `@<bot_username> ping`. Les messages de groupe simples ne déclenchent pas le bot tant que `requireMention: true`.

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

    Exemple : autoriser uniquement des utilisateurs précis dans un groupe spécifique :

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
      Erreur courante : `groupAllowFrom` n’est pas une liste d’autorisation de groupes Telegram.

      - Placez les ID de chat de groupe ou de supergroupe Telegram négatifs comme `-1001234567890` sous `channels.telegram.groups`.
      - Placez les ID utilisateur Telegram comme `8734062810` sous `groupAllowFrom` lorsque vous voulez limiter les personnes qui peuvent déclencher le bot dans un groupe autorisé.
      - Utilisez `groupAllowFrom: ["*"]` uniquement lorsque vous voulez que tout membre d’un groupe autorisé puisse parler au bot.

    </Warning>

  </Tab>

  <Tab title="Comportement des mentions">
    Les réponses de groupe nécessitent une mention par défaut.

    La mention peut venir de :

    - une mention native `@botusername`, ou
    - des motifs de mention dans :
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Bascules de commande au niveau de la session :

    - `/activation always`
    - `/activation mention`

    Elles mettent uniquement à jour l’état de la session. Utilisez la configuration pour la persistance.

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

    - transférez un message de groupe à `@userinfobot` / `@getidsbot`
    - ou lisez `chat.id` depuis `openclaw logs --follow`
    - ou inspectez `getUpdates` de l’API Bot
    - une fois le groupe autorisé, exécutez `/whoami@<bot_username>` si les commandes natives sont activées

  </Tab>
</Tabs>

## Comportement à l’exécution

- Telegram appartient au processus Gateway.
- Le routage est déterministe : les messages entrants Telegram répondent sur Telegram (le modèle ne choisit pas les canaux).
- Les messages entrants sont normalisés dans l’enveloppe de canal partagée avec des métadonnées de réponse, des espaces réservés pour les médias et un contexte persistant de chaîne de réponses pour les réponses Telegram que le Gateway a observées.
- Les sessions de groupe sont isolées par ID de groupe. Les sujets de forum ajoutent `:topic:<threadId>` pour isoler les sujets.
- Les messages DM peuvent porter `message_thread_id` ; OpenClaw conserve l’ID de fil pour les réponses, mais garde par défaut les DM sur la session plate. Configurez `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` ou une configuration de sujet correspondante lorsque vous voulez intentionnellement isoler les sessions de sujet DM.
- L’interrogation longue utilise le runner grammY avec un séquencement par chat/par fil. La concurrence globale du sink du runner utilise `agents.defaults.maxConcurrent`.
- L’interrogation longue est protégée dans chaque processus Gateway afin qu’un seul poller actif puisse utiliser un jeton de bot à la fois. Si vous voyez encore des conflits `getUpdates` 409, un autre Gateway OpenClaw, script ou poller externe utilise probablement le même jeton.
- Les redémarrages du watchdog d’interrogation longue se déclenchent par défaut après 120 secondes sans liveness `getUpdates` terminée. Augmentez `channels.telegram.pollingStallThresholdMs` uniquement si votre déploiement voit encore de faux redémarrages pour blocage d’interrogation pendant des travaux de longue durée. La valeur est en millisecondes et autorisée de `30000` à `600000` ; les remplacements par compte sont pris en charge.
- L’API Bot Telegram ne prend pas en charge les accusés de lecture (`sendReadReceipts` ne s’applique pas).

## Référence des fonctionnalités

<AccordionGroup>
  <Accordion title="Aperçu du flux en direct (modifications de message)">
    OpenClaw peut diffuser des réponses partielles en temps réel :

    - chats directs : message d’aperçu + `editMessageText`
    - groupes/sujets : message d’aperçu + `editMessageText`

    Exigence :

    - `channels.telegram.streaming` vaut `off | partial | block | progress` (par défaut : `partial`)
    - `progress` conserve un brouillon de statut modifiable pour la progression des outils, l’efface à la fin, puis envoie la réponse finale comme un message normal
    - `streaming.preview.toolProgress` contrôle si les mises à jour d’outil/progression réutilisent le même message d’aperçu modifié (par défaut : `true` lorsque le streaming d’aperçu est actif)
    - `streaming.preview.commandText` contrôle le détail des commandes/exec dans ces lignes de progression d’outil : `raw` (par défaut, conserve le comportement publié) ou `status` (libellé de l’outil uniquement)
    - les anciennes valeurs `channels.telegram.streamMode` et les valeurs booléennes `streaming` sont détectées ; exécutez `openclaw doctor --fix` pour les migrer vers `channels.telegram.streaming.mode`

    Les mises à jour d’aperçu de progression d’outil sont les courtes lignes de statut affichées pendant l’exécution des outils, par exemple l’exécution de commandes, les lectures de fichiers, les mises à jour de planification ou les résumés de patch. Telegram les garde activées par défaut pour correspondre au comportement publié d’OpenClaw depuis `v2026.4.22` et versions ultérieures. Pour conserver l’aperçu modifié pour le texte de réponse mais masquer les lignes de progression d’outil, définissez :

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

    Pour garder la progression d’outil visible mais masquer le texte de commande/exec, définissez :

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    Utilisez le mode `progress` lorsque vous voulez une progression d’outil visible sans modifier la réponse finale dans ce même message. Placez la politique du texte de commande sous `streaming.progress` :

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    Utilisez `streaming.mode: "off"` uniquement lorsque vous voulez une livraison finale seule : les modifications d’aperçu Telegram sont désactivées et les bavardages génériques d’outil/progression sont supprimés au lieu d’être envoyés comme messages de statut autonomes. Les invites d’approbation, les charges utiles multimédias et les erreurs continuent de passer par la livraison finale normale. Utilisez `streaming.preview.toolProgress: false` lorsque vous voulez seulement conserver les modifications d’aperçu de réponse tout en masquant les lignes de statut de progression d’outil.

    <Note>
      Les réponses Telegram à une citation sélectionnée sont l’exception. Lorsque `replyToMode` vaut `"first"`, `"all"` ou `"batched"` et que le message entrant inclut du texte de citation sélectionné, OpenClaw envoie la réponse finale via le chemin natif de réponse avec citation de Telegram au lieu de modifier l’aperçu de réponse ; ainsi, `streaming.preview.toolProgress` ne peut pas afficher les courtes lignes de statut pour ce tour. Les réponses au message actuel sans texte de citation sélectionné conservent toujours le streaming d’aperçu. Définissez `replyToMode: "off"` lorsque la visibilité de la progression d’outil compte davantage que les réponses avec citation natives, ou définissez `streaming.preview.toolProgress: false` pour reconnaître ce compromis.
    </Note>

    Pour les réponses textuelles uniquement :

    - aperçus courts en DM/groupe/sujet : OpenClaw conserve le même message d’aperçu et effectue la modification finale sur place
    - les longues réponses finales textuelles réparties en plusieurs messages Telegram réutilisent l’aperçu existant comme premier bloc final lorsque c’est possible, puis n’envoient que les blocs restants
    - les réponses finales en mode progression effacent le brouillon de statut et utilisent la livraison finale normale au lieu de modifier le brouillon en réponse
    - si la modification finale échoue avant que le texte terminé soit confirmé, OpenClaw utilise la livraison finale normale et nettoie l’aperçu obsolète

    Pour les réponses complexes (par exemple les charges utiles multimédias), OpenClaw revient à la livraison finale normale puis nettoie le message d’aperçu.

    Le streaming d’aperçu est séparé du streaming par blocs. Lorsque le streaming par blocs est explicitement activé pour Telegram, OpenClaw ignore le flux d’aperçu afin d’éviter un double streaming.

    Flux de raisonnement propre à Telegram :

    - `/reasoning stream` envoie le raisonnement à l’aperçu en direct pendant la génération
    - l’aperçu du raisonnement est supprimé après la livraison finale ; utilisez `/reasoning on` lorsque le raisonnement doit rester visible
    - la réponse finale est envoyée sans texte de raisonnement

  </Accordion>

  <Accordion title="Mise en forme et repli HTML">
    Le texte sortant utilise Telegram `parse_mode: "HTML"`.

    - Le texte de type Markdown est rendu en HTML compatible avec Telegram.
    - Le HTML brut du modèle est échappé afin de réduire les échecs d’analyse Telegram.
    - Si Telegram rejette le HTML analysé, OpenClaw réessaie en texte brut.

    Les aperçus de liens sont activés par défaut et peuvent être désactivés avec `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Commandes natives et commandes personnalisées">
    L’enregistrement du menu de commandes Telegram est géré au démarrage avec `setMyCommands`.

    Valeurs par défaut des commandes natives :

    - `commands.native: "auto"` active les commandes natives pour Telegram

    Ajoutez des entrées personnalisées au menu de commandes :

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

    Notes :

    - les commandes personnalisées sont uniquement des entrées de menu ; elles n’implémentent pas automatiquement de comportement
    - les commandes de plugin/skill peuvent toujours fonctionner lorsqu’elles sont saisies, même si elles ne s’affichent pas dans le menu Telegram

    Si les commandes natives sont désactivées, les intégrées sont supprimées. Les commandes personnalisées/plugin peuvent toujours s’enregistrer si elles sont configurées.

    Échecs de configuration courants :

    - `setMyCommands failed` avec `BOT_COMMANDS_TOO_MUCH` signifie que le menu Telegram débordait encore après réduction ; réduisez les commandes plugin/skill/personnalisées ou désactivez `channels.telegram.commands.native`.
    - l’échec de `deleteWebhook`, `deleteMyCommands` ou `setMyCommands` avec `404: Not Found` alors que les commandes curl directes de Bot API fonctionnent peut signifier que `channels.telegram.apiRoot` a été défini sur le point de terminaison complet `/bot<TOKEN>`. `apiRoot` doit être uniquement la racine de Bot API, et `openclaw doctor --fix` supprime un suffixe accidentel `/bot<TOKEN>`.
    - `getMe returned 401` signifie que Telegram a rejeté le jeton de bot configuré. Mettez à jour `botToken`, `tokenFile` ou `TELEGRAM_BOT_TOKEN` avec le jeton BotFather actuel ; OpenClaw s’arrête avant l’interrogation, donc ce n’est pas signalé comme un échec de nettoyage de Webhook.
    - `setMyCommands failed` avec des erreurs réseau/fetch signifie généralement que le DNS/HTTPS sortant vers `api.telegram.org` est bloqué.

    ### Commandes d’appairage d’appareil (plugin `device-pair`)

    Lorsque le plugin `device-pair` est installé :

    1. `/pair` génère le code de configuration
    2. collez le code dans l’application iOS
    3. `/pair pending` liste les demandes en attente (y compris rôle/portées)
    4. approuvez la demande :
       - `/pair approve <requestId>` pour une approbation explicite
       - `/pair approve` lorsqu’il n’y a qu’une seule demande en attente
       - `/pair approve latest` pour la plus récente

    Le code de configuration transporte un jeton d’amorçage de courte durée. Le transfert d’amorçage intégré conserve le jeton du nœud principal à `scopes: []` ; tout jeton d’opérateur transféré reste limité à `operator.approvals`, `operator.read`, `operator.talk.secrets` et `operator.write`. Les vérifications de portée d’amorçage sont préfixées par rôle, donc cette liste d’autorisation d’opérateur ne satisfait que les demandes d’opérateur ; les rôles non-opérateurs ont toujours besoin de portées sous leur propre préfixe de rôle.

    Si un appareil réessaie avec des détails d’authentification modifiés (par exemple rôle/portées/clé publique), la demande précédente en attente est remplacée et la nouvelle demande utilise un `requestId` différent. Réexécutez `/pair pending` avant d’approuver.

    Plus de détails : [Appairage](/fr/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Boutons en ligne">
    Configurez la portée du clavier en ligne :

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
    Les actions d’outil Telegram incluent :

    - `sendMessage` (`to`, `content`, optionnel `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, optionnel `iconColor`, `iconCustomEmojiId`)

    Les actions de message de canal exposent des alias ergonomiques (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Contrôles de verrouillage :

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (par défaut : désactivé)

    Note : `edit` et `topic-create` sont actuellement activés par défaut et ne disposent pas de bascules `channels.telegram.actions.*` distinctes.
    Les envois à l’exécution utilisent l’instantané de configuration/secrets actif (démarrage/rechargement), donc les chemins d’action n’effectuent pas de nouvelle résolution SecretRef ad hoc à chaque envoi.

    Sémantique de suppression des réactions : [/tools/reactions](/fr/tools/reactions)

  </Accordion>

  <Accordion title="Balises de fils de réponse">
    Telegram prend en charge des balises explicites de fil de réponse dans la sortie générée :

    - `[[reply_to_current]]` répond au message déclencheur
    - `[[reply_to:<id>]]` répond à un ID de message Telegram spécifique

    `channels.telegram.replyToMode` contrôle le traitement :

    - `off` (par défaut)
    - `first`
    - `all`

    Lorsque le fil de réponse est activé et que le texte ou la légende Telegram d’origine est disponible, OpenClaw inclut automatiquement un extrait de citation natif Telegram. Telegram limite le texte de citation natif à 1024 unités de code UTF-16 ; les messages plus longs sont donc cités depuis le début et reviennent à une réponse simple si Telegram rejette la citation.

    Note : `off` désactive le fil de réponse implicite. Les balises explicites `[[reply_to_*]]` sont toujours respectées.

  </Accordion>

  <Accordion title="Sujets de forum et comportement des fils">
    Supergroupes de forum :

    - les clés de session de sujet ajoutent `:topic:<threadId>`
    - les réponses et la saisie ciblent le fil du sujet
    - chemin de configuration du sujet :
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Cas spécial du sujet général (`threadId=1`) :

    - les envois de messages omettent `message_thread_id` (Telegram rejette `sendMessage(...thread_id=1)`)
    - les actions de saisie incluent toujours `message_thread_id`

    Héritage des sujets : les entrées de sujet héritent des paramètres de groupe sauf remplacement (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` est propre au sujet et n’hérite pas des valeurs par défaut du groupe.

    **Routage d’agent par sujet** : chaque sujet peut router vers un agent différent en définissant `agentId` dans la configuration du sujet. Cela donne à chaque sujet son propre espace de travail, sa mémoire et sa session isolés. Exemple :

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    Chaque sujet possède ensuite sa propre clé de session : `agent:zu:telegram:group:-1001234567890:topic:3`

    **Liaison persistante de sujet ACP** : les sujets de forum peuvent épingler les sessions du harnais ACP au moyen de liaisons ACP typées de premier niveau (`bindings[]` avec `type: "acp"` et `match.channel: "telegram"`, `peer.kind: "group"`, et un identifiant qualifié par sujet comme `-1001234567890:topic:42`). Actuellement limité aux sujets de forum dans les groupes/supergroupes. Consultez [Agents ACP](/fr/tools/acp-agents).

    **Lancement ACP lié au fil depuis le chat** : `/acp spawn <agent> --thread here|auto` lie le sujet actuel à une nouvelle session ACP ; les suivis y sont acheminés directement. OpenClaw épingle la confirmation de lancement dans le sujet. Nécessite que `channels.telegram.threadBindings.spawnSessions` reste activé (par défaut : `true`).

    Le contexte de modèle expose `MessageThreadId` et `IsForum`. Les discussions DM avec `message_thread_id` conservent par défaut le routage DM et les métadonnées de réponse sur des sessions plates ; elles n’utilisent des clés de session tenant compte des fils que lorsqu’elles sont configurées avec `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true`, ou une configuration de sujet correspondante. Utilisez `channels.telegram.dm.threadReplies` de premier niveau pour la valeur par défaut du compte, ou `direct.<chatId>.threadReplies` pour un DM.

  </Accordion>

  <Accordion title="Audio, vidéo et autocollants">
    ### Messages audio

    Telegram distingue les notes vocales des fichiers audio.

    - par défaut : comportement de fichier audio
    - balise `[[audio_as_voice]]` dans la réponse de l’agent pour forcer l’envoi en note vocale
    - les transcriptions de notes vocales entrantes sont encadrées comme du texte généré par machine,
      non fiable dans le contexte de l’agent ; la détection des mentions utilise toujours la transcription
      brute, afin que les messages vocaux filtrés par mention continuent de fonctionner.

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

    Telegram distingue les fichiers vidéo des notes vidéo.

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

    ### Autocollants

    Gestion des autocollants entrants :

    - WEBP statique : téléchargé et traité (espace réservé `<media:sticker>`)
    - TGS animé : ignoré
    - WEBM vidéo : ignoré

    Champs du contexte d’autocollant :

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Fichier de cache des autocollants :

    - `~/.openclaw/telegram/sticker-cache.json`

    Les autocollants sont décrits une fois (quand c’est possible) et mis en cache afin de réduire les appels répétés à la vision.

    Activer les actions d’autocollant :

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

    Action d’envoi d’autocollant :

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Rechercher dans les autocollants mis en cache :

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
    Les réactions Telegram arrivent sous forme de mises à jour `message_reaction` (distinctes des charges utiles de message).

    Lorsqu’elles sont activées, OpenClaw met en file d’attente des événements système comme :

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuration :

    - `channels.telegram.reactionNotifications` : `off | own | all` (par défaut : `own`)
    - `channels.telegram.reactionLevel` : `off | ack | minimal | extensive` (par défaut : `minimal`)

    Notes :

    - `own` signifie uniquement les réactions d’utilisateurs aux messages envoyés par le bot (au mieux via le cache des messages envoyés).
    - Les événements de réaction respectent toujours les contrôles d’accès Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) ; les expéditeurs non autorisés sont ignorés.
    - Telegram ne fournit pas d’ID de fil dans les mises à jour de réaction.
      - les groupes hors forum sont acheminés vers la session de discussion de groupe
      - les groupes de forum sont acheminés vers la session de sujet général du groupe (`:topic:1`), et non vers le sujet d’origine exact

    `allowed_updates` pour le polling/Webhook inclut automatiquement `message_reaction`.

  </Accordion>

  <Accordion title="Réactions d’accusé de réception">
    `ackReaction` envoie un émoji d’accusé de réception pendant qu’OpenClaw traite un message entrant.

    Ordre de résolution :

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - repli vers l’émoji d’identité de l’agent (`agents.list[].identity.emoji`, sinon "👀")

    Notes :

    - Telegram attend un émoji Unicode (par exemple "👀").
    - Utilisez `""` pour désactiver la réaction pour un canal ou un compte.

  </Accordion>

  <Accordion title="Écritures de configuration depuis les événements et commandes Telegram">
    Les écritures de configuration de canal sont activées par défaut (`configWrites !== false`).

    Les écritures déclenchées par Telegram incluent :

    - les événements de migration de groupe (`migrate_to_chat_id`) pour mettre à jour `channels.telegram.groups`
    - `/config set` et `/config unset` (nécessite l’activation de la commande)

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

  <Accordion title="Polling long ou Webhook">
    La valeur par défaut est le polling long. Pour le mode Webhook, définissez `channels.telegram.webhookUrl` et `channels.telegram.webhookSecret` ; `webhookPath`, `webhookHost`, `webhookPort` sont facultatifs (valeurs par défaut `/telegram-webhook`, `127.0.0.1`, `8787`).

    En mode polling long, OpenClaw persiste son marqueur de reprise uniquement après qu’une mise à jour a été distribuée avec succès. Si un gestionnaire échoue, cette mise à jour reste réessayable dans le même processus et n’est pas écrite comme terminée pour la déduplication au redémarrage.

    L’écouteur local se lie à `127.0.0.1:8787`. Pour une entrée publique, placez soit un proxy inverse devant le port local, soit définissez intentionnellement `webhookHost: "0.0.0.0"`.

    Le mode Webhook valide les gardes de requête, le jeton secret Telegram et le corps JSON avant de renvoyer `200` à Telegram.
    OpenClaw traite ensuite la mise à jour de manière asynchrone via les mêmes files de bot par discussion/par sujet que celles utilisées par le polling long, de sorte que les tours d’agent lents ne retiennent pas l’ACK de livraison de Telegram.

  </Accordion>

  <Accordion title="Limites, nouvelle tentative et cibles CLI">
    - La valeur par défaut de `channels.telegram.textChunkLimit` est 4000.
    - `channels.telegram.chunkMode="newline"` privilégie les limites de paragraphe (lignes vides) avant le découpage par longueur.
    - `channels.telegram.mediaMaxMb` (par défaut 100) plafonne la taille des médias Telegram entrants et sortants.
    - `channels.telegram.mediaGroupFlushMs` (par défaut 500) contrôle combien de temps les albums/groupes de médias Telegram sont mis en mémoire tampon avant qu’OpenClaw les distribue comme un seul message entrant. Augmentez cette valeur si des parties d’album arrivent tard ; diminuez-la pour réduire la latence de réponse aux albums.
    - `channels.telegram.timeoutSeconds` remplace le délai d’expiration du client API Telegram (s’il n’est pas défini, la valeur par défaut de grammY s’applique). Les clients bot bornent les valeurs configurées sous le garde de requête sortante texte/saisie de 60 secondes, afin que grammY n’interrompe pas la livraison visible des réponses avant que le garde de transport et le repli d’OpenClaw puissent s’exécuter. Le polling long utilise toujours un garde de requête `getUpdates` de 45 secondes, afin que les polls inactifs ne soient pas abandonnés indéfiniment.
    - `channels.telegram.pollingStallThresholdMs` vaut par défaut `120000` ; ajustez entre `30000` et `600000` uniquement en cas de redémarrages pour blocage de polling faussement positifs.
    - l’historique de contexte de groupe utilise `channels.telegram.historyLimit` ou `messages.groupChat.historyLimit` (par défaut 50) ; `0` le désactive.
    - le contexte supplémentaire de réponse/citation/transfert est normalisé dans une fenêtre unique de contexte de conversation sélectionnée lorsque le gateway a observé les messages parents ; le cache de messages observés est persisté à côté du stockage de session. Telegram n’inclut qu’un seul `reply_to_message` superficiel dans les mises à jour, donc les chaînes plus anciennes que le cache sont limitées à la charge utile de mise à jour actuelle de Telegram.
    - les listes d’autorisation Telegram contrôlent principalement qui peut déclencher l’agent, et ne constituent pas une frontière complète de rédaction du contexte supplémentaire.
    - Contrôles de l’historique DM :
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - La configuration `channels.telegram.retry` s’applique aux helpers d’envoi Telegram (CLI/outils/actions) pour les erreurs d’API sortantes récupérables. La livraison de réponse finale entrante utilise également une nouvelle tentative d’envoi sécurisé bornée pour les échecs Telegram avant connexion, mais elle ne réessaie pas les enveloppes réseau ambiguës après envoi qui pourraient dupliquer des messages visibles.

    Les cibles d’envoi CLI et outil de message peuvent être un ID de discussion numérique, un nom d’utilisateur ou une cible de sujet de forum :

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
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

    L’envoi Telegram prend également en charge :

    - `--presentation` avec des blocs `buttons` pour les claviers en ligne lorsque `channels.telegram.capabilities.inlineButtons` l’autorise
    - `--pin` ou `--delivery '{"pin":true}'` pour demander une livraison épinglée lorsque le bot peut épingler dans cette discussion
    - `--force-document` pour envoyer les images, GIF et vidéos sortants comme documents plutôt que comme téléversements compressés de photo, média animé ou vidéo

    Filtrage des actions :

    - `channels.telegram.actions.sendMessage=false` désactive les messages Telegram sortants, y compris les polls
    - `channels.telegram.actions.poll=false` désactive la création de polls Telegram tout en laissant les envois ordinaires activés

  </Accordion>

  <Accordion title="Approbations exec dans Telegram">
    Telegram prend en charge les approbations exec dans les DM des approbateurs et peut éventuellement publier les invites dans la discussion ou le sujet d’origine. Les approbateurs doivent être des ID d’utilisateur Telegram numériques.

    Chemin de configuration :

    - `channels.telegram.execApprovals.enabled` (s’active automatiquement lorsqu’au moins un approbateur peut être résolu)
    - `channels.telegram.execApprovals.approvers` (se rabat sur les ID numériques de propriétaires issus de `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target` : `dm` (par défaut) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` et `defaultTo` contrôlent qui peut parler au bot et où il envoie les réponses normales. Ils ne font pas de quelqu’un un approbateur exec. La première association DM approuvée amorce `commands.ownerAllowFrom` lorsqu’aucun propriétaire de commande n’existe encore, de sorte que la configuration avec un seul propriétaire fonctionne toujours sans dupliquer les ID sous `execApprovals.approvers`.

    La livraison par canal affiche le texte de la commande dans la discussion ; n’activez `channel` ou `both` que dans des groupes/sujets de confiance. Lorsque l’invite arrive dans un sujet de forum, OpenClaw préserve le sujet pour l’invite d’approbation et le suivi. Les approbations exec expirent par défaut après 30 minutes.

    Les boutons d’approbation en ligne nécessitent également que `channels.telegram.capabilities.inlineButtons` autorise la surface cible (`dm`, `group` ou `all`). Les ID d’approbation préfixés par `plugin:` sont résolus via les approbations Plugin ; les autres sont d’abord résolus via les approbations exec.

    Consultez [Approbations exec](/fr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Contrôles des réponses d’erreur

Lorsque l’agent rencontre une erreur de livraison ou de fournisseur, Telegram peut soit répondre avec le texte de l’erreur, soit la supprimer. Deux clés de configuration contrôlent ce comportement :

| Clé                                 | Valeurs           | Par défaut | Description                                                                                                            |
| ----------------------------------- | ----------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply` envoie un message d’erreur convivial dans le chat. `silent` supprime entièrement les réponses d’erreur.        |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`    | Temps minimal entre deux réponses d’erreur au même chat. Empêche le spam d’erreurs pendant les interruptions de service. |

Les remplacements par compte, par groupe et par sujet sont pris en charge (même héritage que les autres clés de configuration Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suppress errors in this group
        },
      },
    },
  },
}
```

## Dépannage

<AccordionGroup>
  <Accordion title="Le bot ne répond pas aux messages de groupe sans mention">

    - Si `requireMention=false`, le mode de confidentialité de Telegram doit autoriser une visibilité complète.
      - BotFather : `/setprivacy` -> Disable
      - puis supprimez et rajoutez le bot au groupe
    - `openclaw channels status` avertit lorsque la configuration attend des messages de groupe sans mention.
    - `openclaw channels status --probe` peut vérifier les ID numériques explicites de groupes ; le joker `"*"` ne peut pas faire l’objet d’une vérification d’appartenance.
    - test rapide de session : `/activation always`.

  </Accordion>

  <Accordion title="Le bot ne voit aucun message de groupe">

    - lorsque `channels.telegram.groups` existe, le groupe doit être listé (ou inclure `"*"`)
    - vérifiez l’appartenance du bot au groupe
    - examinez les journaux : `openclaw logs --follow` pour les raisons d’ignorance

  </Accordion>

  <Accordion title="Les commandes fonctionnent partiellement ou pas du tout">

    - autorisez votre identité d’expéditeur (association et/ou `allowFrom` numérique)
    - l’autorisation des commandes s’applique toujours même lorsque la stratégie de groupe est `open`
    - `setMyCommands failed` avec `BOT_COMMANDS_TOO_MUCH` signifie que le menu natif contient trop d’entrées ; réduisez les commandes de plugins/Skills/personnalisées ou désactivez les menus natifs
    - les appels de démarrage `deleteMyCommands` / `setMyCommands` et les appels de saisie `sendChatAction` sont bornés et réessayés une fois via le transport de secours de Telegram en cas d’expiration de requête. Des erreurs réseau/fetch persistantes indiquent généralement des problèmes d’accessibilité DNS/HTTPS vers `api.telegram.org`

  </Accordion>

  <Accordion title="Le démarrage signale un jeton non autorisé">

    - `getMe returned 401` est un échec d’authentification Telegram pour le jeton de bot configuré.
    - Recopiez ou régénérez le jeton de bot dans BotFather, puis mettez à jour `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` ou `TELEGRAM_BOT_TOKEN` pour le compte par défaut.
    - `deleteWebhook 401 Unauthorized` pendant le démarrage est également un échec d’authentification ; le traiter comme « aucun Webhook n’existe » ne ferait que reporter le même échec dû à un mauvais jeton aux appels d’API ultérieurs.

  </Accordion>

  <Accordion title="Instabilité du polling ou du réseau">

    - Node 22+ avec fetch/proxy personnalisé peut déclencher un comportement d’abandon immédiat si les types AbortSignal ne correspondent pas.
    - Certains hôtes résolvent d’abord `api.telegram.org` en IPv6 ; une sortie IPv6 défectueuse peut provoquer des échecs intermittents de l’API Telegram.
    - Si les journaux incluent `TypeError: fetch failed` ou `Network request for 'getUpdates' failed!`, OpenClaw réessaie désormais ces erreurs comme des erreurs réseau récupérables.
    - Pendant le démarrage du polling, OpenClaw réutilise la sonde `getMe` de démarrage réussie pour grammY afin que l’exécuteur n’ait pas besoin d’un second `getMe` avant le premier `getUpdates`.
    - Si `deleteWebhook` échoue avec une erreur réseau transitoire pendant le démarrage du polling, OpenClaw continue en long polling au lieu d’effectuer un autre appel de plan de contrôle avant le polling. Un Webhook encore actif apparaît comme un conflit `getUpdates` ; OpenClaw reconstruit alors le transport Telegram et réessaie le nettoyage du Webhook.
    - Si les sockets Telegram sont recyclés selon une cadence fixe courte, vérifiez si `channels.telegram.timeoutSeconds` est faible ; les clients de bot plafonnent les valeurs configurées en dessous des gardes de requêtes sortantes et `getUpdates`, mais les anciennes versions pouvaient abandonner chaque polling ou réponse lorsque cette valeur était définie sous ces gardes.
    - Si les journaux incluent `Polling stall detected`, OpenClaw redémarre le polling et reconstruit le transport Telegram après 120 secondes sans liveness de long polling terminée par défaut.
    - `openclaw channels status --probe` et `openclaw doctor` avertissent lorsqu’un compte de polling en cours d’exécution n’a pas terminé `getUpdates` après le délai de grâce de démarrage, lorsqu’un compte Webhook en cours d’exécution n’a pas terminé `setWebhook` après le délai de grâce de démarrage, ou lorsque la dernière activité réussie du transport de polling est obsolète.
    - N’augmentez `channels.telegram.pollingStallThresholdMs` que lorsque les appels `getUpdates` de longue durée sont sains, mais que votre hôte signale encore de faux redémarrages dus à un blocage du polling. Les blocages persistants indiquent généralement des problèmes de proxy, de DNS, d’IPv6 ou de sortie TLS entre l’hôte et `api.telegram.org`.
    - Telegram respecte également les variables d’environnement de proxy du processus pour le transport de l’API Bot, notamment `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` et leurs variantes en minuscules. `NO_PROXY` / `no_proxy` peuvent toujours contourner `api.telegram.org`.
    - Si le proxy géré OpenClaw est configuré via `OPENCLAW_PROXY_URL` pour un environnement de service et qu’aucune variable d’environnement de proxy standard n’est présente, Telegram utilise également cette URL pour le transport de l’API Bot.
    - Sur les hôtes VPS avec une sortie directe/TLS instable, acheminez les appels de l’API Telegram via `channels.telegram.proxy` :

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ utilise par défaut `autoSelectFamily=true` (sauf WSL2). L’ordre des résultats DNS de Telegram respecte `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, puis `channels.telegram.network.dnsResultOrder`, puis la valeur par défaut du processus comme `NODE_OPTIONS=--dns-result-order=ipv4first` ; si aucune ne s’applique, Node 22+ revient à `ipv4first`.
    - Si votre hôte est WSL2 ou fonctionne explicitement mieux avec un comportement IPv4 uniquement, forcez la sélection de famille :

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Les réponses de plage de benchmark RFC 2544 (`198.18.0.0/15`) sont déjà autorisées
      par défaut pour les téléchargements de médias Telegram. Si un faux IP de confiance ou
      un proxy transparent réécrit `api.telegram.org` vers une autre adresse
      privée/interne/à usage spécial pendant les téléchargements de médias, vous pouvez opter
      pour le contournement limité à Telegram :

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - La même activation est disponible par compte à
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Si votre proxy résout les hôtes de médias Telegram en `198.18.x.x`, laissez d’abord
      l’indicateur dangereux désactivé. Les médias Telegram autorisent déjà la plage de
      benchmark RFC 2544 par défaut.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` affaiblit les protections SSRF
      des médias Telegram. Utilisez-le uniquement pour des environnements de proxy de confiance
      contrôlés par l’opérateur, tels que le routage fake-IP Clash, Mihomo ou Surge, lorsqu’ils
      synthétisent des réponses privées ou à usage spécial en dehors de la plage de benchmark
      RFC 2544. Laissez-le désactivé pour un accès Telegram normal à l’internet public.
    </Warning>

    - Remplacements d’environnement (temporaires) :
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

Aide supplémentaire : [Dépannage des canaux](/fr/channels/troubleshooting).

## Référence de configuration

Référence principale : [Référence de configuration - Telegram](/fr/gateway/config-channels#telegram).

<Accordion title="Champs Telegram à signal fort">

- démarrage/authentification : `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` doit pointer vers un fichier régulier ; les liens symboliques sont rejetés)
- contrôle d’accès : `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de niveau supérieur (`type: "acp"`)
- approbations d’exécution : `execApprovals`, `accounts.*.execApprovals`
- commande/menu : `commands.native`, `commands.nativeSkills`, `customCommands`
- fils de discussion/réponses : `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming : `streaming` (aperçu), `streaming.preview.toolProgress`, `blockStreaming`
- formatage/livraison : `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- médias/réseau : `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- racine d’API personnalisée : `apiRoot` (racine de l’API Bot uniquement ; n’incluez pas `/bot<TOKEN>`)
- Webhook : `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- actions/capacités : `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- réactions : `reactionNotifications`, `reactionLevel`
- erreurs : `errorPolicy`, `errorCooldownMs`
- écritures/historique : `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Priorité multi-compte : lorsque deux ID de compte ou plus sont configurés, définissez `channels.telegram.defaultAccount` (ou incluez `channels.telegram.accounts.default`) afin de rendre le routage par défaut explicite. Sinon, OpenClaw revient au premier ID de compte normalisé et `openclaw doctor` avertit. Les comptes nommés héritent de `channels.telegram.allowFrom` / `groupAllowFrom`, mais pas des valeurs `accounts.default.*`.
</Note>

## Connexe

<CardGroup cols={2}>
  <Card title="Association" icon="link" href="/fr/channels/pairing">
    Associez un utilisateur Telegram au Gateway.
  </Card>
  <Card title="Groupes" icon="users" href="/fr/channels/groups">
    Comportement de liste d’autorisation des groupes et sujets.
  </Card>
  <Card title="Routage des canaux" icon="route" href="/fr/channels/channel-routing">
    Acheminez les messages entrants vers les agents.
  </Card>
  <Card title="Sécurité" icon="shield" href="/fr/gateway/security">
    Modèle de menace et durcissement.
  </Card>
  <Card title="Routage multi-agent" icon="sitemap" href="/fr/concepts/multi-agent">
    Associez les groupes et sujets aux agents.
  </Card>
  <Card title="Dépannage" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics multicanaux.
  </Card>
</CardGroup>
