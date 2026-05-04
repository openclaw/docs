---
read_when:
    - Travailler sur les fonctionnalités Telegram ou les Webhooks
summary: État de la prise en charge, fonctionnalités et configuration du bot Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-04T09:37:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5711d53cf908a14024bc5a94f7d590bb4bcb6963a1d78049d7782871f4eae932
    source_path: channels/telegram.md
    workflow: 16
---

Prêt pour la production pour les messages privés et les groupes de bots via grammY. L’interrogation longue est le mode par défaut ; le mode Webhook est facultatif.

<CardGroup cols={3}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    La politique de messages privés par défaut pour Telegram est l’appairage.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics intercanaux et guides de réparation.
  </Card>
  <Card title="Configuration du Gateway" icon="settings" href="/fr/gateway/configuration">
    Modèles et exemples complets de configuration de canal.
  </Card>
</CardGroup>

## Configuration rapide

<Steps>
  <Step title="Créer le jeton du bot dans BotFather">
    Ouvrez Telegram et discutez avec **@BotFather** (confirmez que l’identifiant est exactement `@BotFather`).

    Exécutez `/newbot`, suivez les invites et enregistrez le jeton.

  </Step>

  <Step title="Configurer le jeton et la politique de messages privés">

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

    Solution de repli par env : `TELEGRAM_BOT_TOKEN=...` (compte par défaut uniquement).
    Telegram n’utilise **pas** `openclaw channels login telegram` ; configurez le jeton dans la config/l’env, puis démarrez le Gateway.

  </Step>

  <Step title="Démarrer le Gateway et approuver le premier message privé">

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
L’ordre de résolution du jeton tient compte du compte. En pratique, les valeurs de configuration l’emportent sur la solution de repli par env, et `TELEGRAM_BOT_TOKEN` ne s’applique qu’au compte par défaut.
</Note>

## Paramètres côté Telegram

<AccordionGroup>
  <Accordion title="Mode confidentialité et visibilité des groupes">
    Les bots Telegram utilisent par défaut le **mode confidentialité**, qui limite les messages de groupe qu’ils reçoivent.

    Si le bot doit voir tous les messages de groupe, vous pouvez soit :

    - désactiver le mode confidentialité via `/setprivacy`, soit
    - faire du bot un administrateur du groupe.

    Lorsque vous activez ou désactivez le mode confidentialité, supprimez puis rajoutez le bot dans chaque groupe afin que Telegram applique le changement.

  </Accordion>

  <Accordion title="Autorisations de groupe">
    Le statut d’administrateur se contrôle dans les paramètres du groupe Telegram.

    Les bots administrateurs reçoivent tous les messages de groupe, ce qui est utile pour un comportement de groupe toujours actif.

  </Accordion>

  <Accordion title="Options BotFather utiles">

    - `/setjoingroups` pour autoriser/refuser les ajouts à des groupes
    - `/setprivacy` pour le comportement de visibilité dans les groupes

  </Accordion>
</AccordionGroup>

## Contrôle d’accès et activation

<Tabs>
  <Tab title="Politique de messages privés">
    `channels.telegram.dmPolicy` contrôle l’accès aux messages directs :

    - `pairing` (par défaut)
    - `allowlist` (nécessite au moins un ID d’expéditeur dans `allowFrom`)
    - `open` (nécessite que `allowFrom` inclue `"*"`)
    - `disabled`

    `dmPolicy: "open"` avec `allowFrom: ["*"]` permet à tout compte Telegram qui trouve ou devine le nom d’utilisateur du bot de commander le bot. Utilisez-le uniquement pour des bots volontairement publics avec des outils strictement restreints ; les bots à propriétaire unique devraient utiliser `allowlist` avec des ID utilisateur numériques.

    `channels.telegram.allowFrom` accepte les ID utilisateur Telegram numériques. Les préfixes `telegram:` / `tg:` sont acceptés et normalisés.
    Dans les configurations multicompte, un `channels.telegram.allowFrom` restrictif au niveau supérieur est traité comme une limite de sécurité : les entrées `allowFrom: ["*"]` au niveau du compte ne rendent pas ce compte public sauf si la liste d’autorisation effective du compte contient toujours un joker explicite après fusion.
    `dmPolicy: "allowlist"` avec `allowFrom` vide bloque tous les messages privés et est rejeté par la validation de configuration.
    La configuration demande uniquement des ID utilisateur numériques.
    Si vous avez effectué une mise à niveau et que votre configuration contient des entrées de liste d’autorisation `@username`, exécutez `openclaw doctor --fix` pour les résoudre (au mieux ; nécessite un jeton de bot Telegram).
    Si vous vous appuyiez précédemment sur des fichiers de liste d’autorisation du magasin d’appairage, `openclaw doctor --fix` peut récupérer les entrées dans `channels.telegram.allowFrom` dans les flux de liste d’autorisation (par exemple lorsque `dmPolicy: "allowlist"` n’a pas encore d’ID explicites).

    Pour les bots à propriétaire unique, préférez `dmPolicy: "allowlist"` avec des ID numériques `allowFrom` explicites afin de conserver une politique d’accès durable dans la configuration (plutôt que de dépendre des approbations d’appairage précédentes).

    Confusion fréquente : l’approbation d’appairage des messages privés ne signifie pas « cet expéditeur est autorisé partout ».
    L’appairage accorde l’accès aux messages privés. Si aucun propriétaire de commande n’existe encore, le premier appairage approuvé définit aussi `commands.ownerAllowFrom` afin que les commandes réservées au propriétaire et les approbations d’exécution aient un compte opérateur explicite.
    L’autorisation des expéditeurs de groupe provient toujours des listes d’autorisation explicites de la configuration.
    Si vous voulez « je suis autorisé une fois, et les messages privés comme les commandes de groupe fonctionnent », placez votre ID utilisateur Telegram numérique dans `channels.telegram.allowFrom` ; pour les commandes réservées au propriétaire, assurez-vous que `commands.ownerAllowFrom` contient `telegram:<your user id>`.

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
       - aucune config `groups` :
         - avec `groupPolicy: "open"` : tout groupe peut réussir les contrôles d’ID de groupe
         - avec `groupPolicy: "allowlist"` (par défaut) : les groupes sont bloqués jusqu’à ce que vous ajoutiez des entrées `groups` (ou `"*"`)
       - `groups` configuré : agit comme liste d’autorisation (ID explicites ou `"*"`)

    2. **Quels expéditeurs sont autorisés dans les groupes** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (par défaut)
       - `disabled`

    `groupAllowFrom` est utilisé pour le filtrage des expéditeurs de groupe. S’il n’est pas défini, Telegram se rabat sur `allowFrom`.
    Les entrées `groupAllowFrom` doivent être des ID utilisateur Telegram numériques (les préfixes `telegram:` / `tg:` sont normalisés).
    Ne mettez pas d’ID de chat de groupe ou de supergroupe Telegram dans `groupAllowFrom`. Les ID de chat négatifs appartiennent à `channels.telegram.groups`.
    Les entrées non numériques sont ignorées pour l’autorisation des expéditeurs.
    Limite de sécurité (`2026.2.25+`) : l’authentification des expéditeurs de groupe n’hérite **pas** des approbations du magasin d’appairage de messages privés.
    L’appairage reste limité aux messages privés. Pour les groupes, définissez `groupAllowFrom` ou `allowFrom` par groupe/par sujet.
    Si `groupAllowFrom` n’est pas défini, Telegram se rabat sur la config `allowFrom`, pas sur le magasin d’appairage.
    Modèle pratique pour les bots à propriétaire unique : définissez votre ID utilisateur dans `channels.telegram.allowFrom`, laissez `groupAllowFrom` non défini, et autorisez les groupes cibles sous `channels.telegram.groups`.
    Note d’exécution : si `channels.telegram` est complètement absent, l’exécution utilise par défaut `groupPolicy="allowlist"` en échec fermé, sauf si `channels.defaults.groupPolicy` est explicitement défini.

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

      - Placez les ID de chat de groupe ou de supergroupe Telegram négatifs comme `-1001234567890` sous `channels.telegram.groups`.
      - Placez les ID utilisateur Telegram comme `8734062810` sous `groupAllowFrom` lorsque vous voulez limiter les personnes qui, dans un groupe autorisé, peuvent déclencher le bot.
      - Utilisez `groupAllowFrom: ["*"]` uniquement lorsque vous voulez que tout membre d’un groupe autorisé puisse parler au bot.

    </Warning>

  </Tab>

  <Tab title="Comportement des mentions">
    Les réponses de groupe nécessitent une mention par défaut.

    La mention peut provenir de :

    - une mention native `@botusername`, ou
    - des motifs de mention dans :
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Options de commande au niveau de la session :

    - `/activation always`
    - `/activation mention`

    Celles-ci ne mettent à jour que l’état de la session. Utilisez la configuration pour la persistance.

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

    Obtenir l’ID du chat de groupe :

    - transférer un message de groupe à `@userinfobot` / `@getidsbot`
    - ou lire `chat.id` depuis `openclaw logs --follow`
    - ou inspecter `getUpdates` de l’API Bot

  </Tab>
</Tabs>

## Comportement à l’exécution

- Telegram est géré par le processus Gateway.
- Le routage est déterministe : les réponses entrantes de Telegram repartent vers Telegram (le modèle ne choisit pas les canaux).
- Les messages entrants sont normalisés dans l’enveloppe de canal partagée avec les métadonnées de réponse et les espaces réservés de médias.
- Les sessions de groupe sont isolées par ID de groupe. Les sujets de forum ajoutent `:topic:<threadId>` pour garder les sujets isolés.
- Les messages privés peuvent porter `message_thread_id` ; OpenClaw conserve l’ID de fil pour les réponses mais garde par défaut les messages privés sur la session plate. Configurez `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` ou une configuration de sujet correspondante lorsque vous voulez intentionnellement isoler les sessions de sujets en messages privés.
- L’interrogation longue utilise grammY runner avec un séquençage par chat/par fil. La concurrence globale du récepteur du runner utilise `agents.defaults.maxConcurrent`.
- L’interrogation longue est protégée dans chaque processus Gateway afin qu’un seul poller actif puisse utiliser un jeton de bot à la fois. Si vous voyez toujours des conflits `getUpdates` 409, un autre Gateway OpenClaw, script ou poller externe utilise probablement le même jeton.
- Les redémarrages de surveillance de l’interrogation longue se déclenchent par défaut après 120 secondes sans liveness `getUpdates` terminée. Augmentez `channels.telegram.pollingStallThresholdMs` uniquement si votre déploiement voit encore de faux redémarrages pour blocage d’interrogation pendant des travaux de longue durée. La valeur est en millisecondes et est autorisée de `30000` à `600000` ; les remplacements par compte sont pris en charge.
- L’API Bot Telegram ne prend pas en charge les accusés de lecture (`sendReadReceipts` ne s’applique pas).

## Référence des fonctionnalités

<AccordionGroup>
  <Accordion title="Aperçu du flux en direct (modifications de message)">
    OpenClaw peut diffuser des réponses partielles en temps réel :

    - chats directs : message d’aperçu + `editMessageText`
    - groupes/sujets : message d’aperçu + `editMessageText`

    Exigence :

    - `channels.telegram.streaming` vaut `off | partial | block | progress` (par défaut : `partial`)
    - `progress` conserve un brouillon d’état modifiable et le met à jour avec la progression des outils jusqu’à la livraison finale
    - `streaming.preview.toolProgress` contrôle si les mises à jour d’outil/de progression réutilisent le même message d’aperçu modifié (par défaut : `true` lorsque le streaming d’aperçu est actif)
    - `streaming.preview.commandText` contrôle les détails de commande/d’exécution dans ces lignes de progression d’outil : `raw` (par défaut, conserve le comportement publié) ou `status` (libellé d’outil uniquement)
    - les anciens `channels.telegram.streamMode` et valeurs booléennes `streaming` sont détectés ; exécutez `openclaw doctor --fix` pour les migrer vers `channels.telegram.streaming.mode`

    Les mises à jour d’aperçu de progression d’outil sont les courtes lignes d’état affichées pendant l’exécution des outils, par exemple l’exécution de commandes, les lectures de fichiers, les mises à jour de planification ou les résumés de patch. Telegram les garde activées par défaut pour correspondre au comportement publié d’OpenClaw depuis `v2026.4.22` et versions ultérieures. Pour conserver l’aperçu modifié pour le texte de réponse mais masquer les lignes de progression d’outil, définissez :

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

    Pour garder la progression des outils visible mais masquer le texte de commande/d’exécution, définissez :

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

    Pour le mode brouillon de progression, placez la même stratégie de texte de commande sous `streaming.progress`:

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

    Utilisez `streaming.mode: "off"` uniquement lorsque vous voulez une livraison finale uniquement: les modifications d’aperçu Telegram sont désactivées et le bavardage générique d’outil/progression est supprimé au lieu d’être envoyé comme messages d’état autonomes. Les invites d’approbation, les charges utiles multimédias et les erreurs passent toujours par la livraison finale normale. Utilisez `streaming.preview.toolProgress: false` lorsque vous voulez seulement conserver les modifications d’aperçu de réponse tout en masquant les lignes d’état de progression des outils.

    <Note>
      Les réponses à citation sélectionnée Telegram sont l’exception. Lorsque `replyToMode` vaut `"first"`, `"all"` ou `"batched"` et que le message entrant inclut du texte de citation sélectionné, OpenClaw envoie la réponse finale via le chemin natif de réponse avec citation de Telegram au lieu de modifier l’aperçu de réponse; `streaming.preview.toolProgress` ne peut donc pas afficher les courtes lignes d’état pour ce tour. Les réponses au message courant sans texte de citation sélectionné conservent toujours le streaming d’aperçu. Définissez `replyToMode: "off"` lorsque la visibilité de la progression des outils compte davantage que les réponses natives avec citation, ou définissez `streaming.preview.toolProgress: false` pour accepter ce compromis.
    </Note>

    Pour les réponses texte uniquement:

    - aperçus courts en DM/groupe/sujet: OpenClaw conserve le même message d’aperçu et effectue une modification finale sur place, sauf si un message visible qui n’est pas un aperçu a été envoyé après l’apparition de l’aperçu
    - aperçus suivis d’une sortie visible qui n’est pas un aperçu: OpenClaw envoie la réponse terminée comme nouveau message final et nettoie l’ancien aperçu, afin que la réponse finale apparaisse après la sortie intermédiaire
    - aperçus datant de plus d’environ une minute: OpenClaw envoie la réponse terminée comme nouveau message final puis nettoie l’aperçu, afin que l’horodatage visible de Telegram reflète l’heure d’achèvement plutôt que l’heure de création de l’aperçu

    Pour les réponses complexes (par exemple les charges utiles multimédias), OpenClaw revient à la livraison finale normale puis nettoie le message d’aperçu.

    Le streaming d’aperçu est distinct du streaming par blocs. Lorsque le streaming par blocs est explicitement activé pour Telegram, OpenClaw ignore le flux d’aperçu pour éviter un double streaming.

    Flux de raisonnement propre à Telegram:

    - `/reasoning stream` envoie le raisonnement à l’aperçu en direct pendant la génération
    - l’aperçu du raisonnement est supprimé après la livraison finale; utilisez `/reasoning on` lorsque le raisonnement doit rester visible
    - la réponse finale est envoyée sans texte de raisonnement

  </Accordion>

  <Accordion title="Mise en forme et repli HTML">
    Le texte sortant utilise Telegram `parse_mode: "HTML"`.

    - Le texte de type Markdown est rendu en HTML compatible avec Telegram.
    - Le HTML brut du modèle est échappé pour réduire les échecs d’analyse Telegram.
    - Si Telegram rejette le HTML analysé, OpenClaw réessaie en texte brut.

    Les aperçus de liens sont activés par défaut et peuvent être désactivés avec `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Commandes natives et commandes personnalisées">
    L’inscription du menu de commandes Telegram est gérée au démarrage avec `setMyCommands`.

    Valeurs par défaut des commandes natives:

    - `commands.native: "auto"` active les commandes natives pour Telegram

    Ajoutez des entrées de menu de commandes personnalisées:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    Règles:

    - les noms sont normalisés (suppression du `/` initial, minuscules)
    - motif valide: `a-z`, `0-9`, `_`, longueur `1..32`
    - les commandes personnalisées ne peuvent pas remplacer les commandes natives
    - les conflits/doublons sont ignorés et journalisés

    Notes:

    - les commandes personnalisées ne sont que des entrées de menu; elles n’implémentent pas automatiquement un comportement
    - les commandes de plugin/skill peuvent toujours fonctionner lorsqu’elles sont saisies, même si elles ne sont pas affichées dans le menu Telegram

    Si les commandes natives sont désactivées, les commandes intégrées sont supprimées. Les commandes personnalisées/de plugin peuvent toujours s’inscrire si elles sont configurées.

    Échecs de configuration courants:

    - `setMyCommands failed` avec `BOT_COMMANDS_TOO_MUCH` signifie que le menu Telegram dépassait encore la limite après réduction; réduisez les commandes de plugin/skill/personnalisées ou désactivez `channels.telegram.commands.native`.
    - l’échec de `deleteWebhook`, `deleteMyCommands` ou `setMyCommands` avec `404: Not Found` alors que les commandes curl directes de l’API Bot fonctionnent peut signifier que `channels.telegram.apiRoot` a été défini sur le point de terminaison complet `/bot<TOKEN>`. `apiRoot` doit être uniquement la racine de l’API Bot, et `openclaw doctor --fix` supprime un suffixe accidentel `/bot<TOKEN>`.
    - `getMe returned 401` signifie que Telegram a rejeté le jeton de bot configuré. Mettez à jour `botToken`, `tokenFile` ou `TELEGRAM_BOT_TOKEN` avec le jeton BotFather actuel; OpenClaw s’arrête avant l’interrogation, donc ce n’est pas signalé comme un échec de nettoyage de Webhook.
    - `setMyCommands failed` avec des erreurs réseau/fetch signifie généralement que le DNS/HTTPS sortant vers `api.telegram.org` est bloqué.

    ### Commandes d’association d’appareil (plugin `device-pair`)

    Lorsque le plugin `device-pair` est installé:

    1. `/pair` génère le code de configuration
    2. collez le code dans l’application iOS
    3. `/pair pending` liste les demandes en attente (y compris rôle/portées)
    4. approuvez la demande:
       - `/pair approve <requestId>` pour une approbation explicite
       - `/pair approve` lorsqu’il n’y a qu’une seule demande en attente
       - `/pair approve latest` pour la plus récente

    Le code de configuration transporte un jeton d’amorçage de courte durée. Le transfert d’amorçage intégré conserve le jeton du nœud principal à `scopes: []`; tout jeton d’opérateur transféré reste limité à `operator.approvals`, `operator.read`, `operator.talk.secrets` et `operator.write`. Les vérifications de portée d’amorçage sont préfixées par rôle, donc cette liste d’autorisation d’opérateur ne satisfait que les demandes d’opérateur; les rôles non opérateurs ont toujours besoin de portées sous leur propre préfixe de rôle.

    Si un appareil réessaie avec des détails d’authentification modifiés (par exemple rôle/portées/clé publique), la demande précédente en attente est remplacée et la nouvelle demande utilise un autre `requestId`. Relancez `/pair pending` avant d’approuver.

    Plus de détails: [Association](/fr/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Boutons intégrés">
    Configurez la portée du clavier intégré:

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

    Remplacement par compte:

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

    Portées:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (par défaut)

    L’ancien `capabilities: ["inlineButtons"]` correspond à `inlineButtons: "all"`.

    Exemple d’action de message:

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

    Les clics de rappel sont transmis à l’agent comme texte:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Actions de message Telegram pour agents et automatisation">
    Les actions d’outil Telegram incluent:

    - `sendMessage` (`to`, `content`, optionnel `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, optionnel `iconColor`, `iconCustomEmojiId`)

    Les actions de message de canal exposent des alias ergonomiques (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Contrôles de garde:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (par défaut: désactivé)

    Note: `edit` et `topic-create` sont actuellement activés par défaut et n’ont pas de bascules `channels.telegram.actions.*` séparées.
    Les envois à l’exécution utilisent l’instantané actif de configuration/secrets (démarrage/rechargement), donc les chemins d’action ne réévaluent pas les SecretRef ad hoc à chaque envoi.

    Sémantique de suppression des réactions: [/tools/reactions](/fr/tools/reactions)

  </Accordion>

  <Accordion title="Balises de fils de réponse">
    Telegram prend en charge les balises explicites de fil de réponse dans la sortie générée:

    - `[[reply_to_current]]` répond au message déclencheur
    - `[[reply_to:<id>]]` répond à un ID de message Telegram spécifique

    `channels.telegram.replyToMode` contrôle la gestion:

    - `off` (par défaut)
    - `first`
    - `all`

    Lorsque le fil de réponse est activé et que le texte ou la légende Telegram d’origine est disponible, OpenClaw inclut automatiquement un extrait de citation natif Telegram. Telegram limite le texte de citation natif à 1024 unités de code UTF-16; les messages plus longs sont donc cités depuis le début et reviennent à une réponse simple si Telegram rejette la citation.

    Note: `off` désactive le fil de réponse implicite. Les balises explicites `[[reply_to_*]]` sont toujours respectées.

  </Accordion>

  <Accordion title="Sujets de forum et comportement des fils">
    Supergroupes de forum:

    - les clés de session de sujet ajoutent `:topic:<threadId>`
    - les réponses et l’indication de saisie ciblent le fil du sujet
    - chemin de configuration du sujet:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Cas particulier du sujet général (`threadId=1`):

    - les envois de message omettent `message_thread_id` (Telegram rejette `sendMessage(...thread_id=1)`)
    - les actions de saisie incluent toujours `message_thread_id`

    Héritage de sujet: les entrées de sujet héritent des paramètres de groupe sauf remplacement (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` est propre au sujet et n’hérite pas des valeurs par défaut du groupe.

    **Routage d’agent par sujet**: chaque sujet peut router vers un agent différent en définissant `agentId` dans la configuration du sujet. Cela donne à chaque sujet son propre espace de travail, sa propre mémoire et sa propre session isolés. Exemple:

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

    Chaque sujet a ensuite sa propre clé de session: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Liaison persistante de sujet ACP**: les sujets de forum peuvent épingler les sessions de harnais ACP au moyen de liaisons ACP typées de premier niveau (`bindings[]` avec `type: "acp"` et `match.channel: "telegram"`, `peer.kind: "group"`, et un id qualifié par sujet comme `-1001234567890:topic:42`). Actuellement limité aux sujets de forum dans les groupes/supergroupes. Consultez [Agents ACP](/fr/tools/acp-agents).

    **Création ACP liée au fil depuis la discussion**: `/acp spawn <agent> --thread here|auto` lie le sujet courant à une nouvelle session ACP; les messages suivants y sont routés directement. OpenClaw épingle la confirmation de création dans le sujet. Nécessite que `channels.telegram.threadBindings.spawnSessions` reste activé (par défaut: `true`).

    Le contexte du modèle expose `MessageThreadId` et `IsForum`. Les discussions en DM avec `message_thread_id` conservent par défaut le routage DM et les métadonnées de réponse sur des sessions plates ; elles n’utilisent des clés de session tenant compte des fils que lorsqu’elles sont configurées avec `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true`, ou une configuration de sujet correspondante. Utilisez `channels.telegram.dm.threadReplies` au niveau supérieur pour la valeur par défaut du compte, ou `direct.<chatId>.threadReplies` pour un DM.

  </Accordion>

  <Accordion title="Audio, vidéo et stickers">
    ### Messages audio

    Telegram distingue les notes vocales des fichiers audio.

    - par défaut : comportement de fichier audio
    - balise `[[audio_as_voice]]` dans la réponse de l’agent pour forcer l’envoi en note vocale
    - les transcriptions de notes vocales entrantes sont encadrées comme du texte généré par machine,
      non fiable dans le contexte de l’agent ; la détection des mentions utilise toujours la
      transcription brute afin que les messages vocaux soumis à mention continuent de fonctionner.

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

    ### Stickers

    Gestion des stickers entrants :

    - WEBP statique : téléchargé et traité (placeholder `<media:sticker>`)
    - TGS animé : ignoré
    - WEBM vidéo : ignoré

    Champs de contexte de sticker :

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Fichier de cache des stickers :

    - `~/.openclaw/telegram/sticker-cache.json`

    Les stickers sont décrits une fois (lorsque possible) et mis en cache afin de réduire les appels de vision répétés.

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

  <Accordion title="Notifications de réactions">
    Les réactions Telegram arrivent sous forme de mises à jour `message_reaction` (séparées des charges utiles de message).

    Lorsqu’elles sont activées, OpenClaw met en file des événements système comme :

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuration :

    - `channels.telegram.reactionNotifications` : `off | own | all` (par défaut : `own`)
    - `channels.telegram.reactionLevel` : `off | ack | minimal | extensive` (par défaut : `minimal`)

    Notes :

    - `own` signifie uniquement les réactions utilisateur aux messages envoyés par le bot (au mieux via le cache des messages envoyés).
    - Les événements de réaction respectent toujours les contrôles d’accès Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) ; les expéditeurs non autorisés sont ignorés.
    - Telegram ne fournit pas d’ID de fil dans les mises à jour de réaction.
      - les groupes non-forum sont routés vers la session de discussion de groupe
      - les groupes forum sont routés vers la session du sujet général du groupe (`:topic:1`), et non vers le sujet d’origine exact

    `allowed_updates` pour le polling/Webhook inclut automatiquement `message_reaction`.

  </Accordion>

  <Accordion title="Réactions d’accusé de réception">
    `ackReaction` envoie un emoji d’accusé de réception pendant qu’OpenClaw traite un message entrant.

    Ordre de résolution :

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - solution de secours avec l’emoji d’identité de l’agent (`agents.list[].identity.emoji`, sinon "👀")

    Notes :

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

  <Accordion title="Long polling ou Webhook">
    La valeur par défaut est le long polling. Pour le mode Webhook, définissez `channels.telegram.webhookUrl` et `channels.telegram.webhookSecret` ; `webhookPath`, `webhookHost`, `webhookPort` sont facultatifs (valeurs par défaut `/telegram-webhook`, `127.0.0.1`, `8787`).

    L’écouteur local se lie à `127.0.0.1:8787`. Pour une entrée publique, placez soit un proxy inverse devant le port local, soit définissez intentionnellement `webhookHost: "0.0.0.0"`.

    Le mode Webhook valide les protections de requête, le jeton secret Telegram et le corps JSON avant de renvoyer `200` à Telegram.
    OpenClaw traite ensuite la mise à jour de manière asynchrone via les mêmes files bot par discussion/par sujet que celles utilisées par le long polling, de sorte que les tours d’agent lents ne bloquent pas l’ACK de livraison de Telegram.

  </Accordion>

  <Accordion title="Limites, nouvelle tentative et cibles CLI">
    - La valeur par défaut de `channels.telegram.textChunkLimit` est 4000.
    - `channels.telegram.chunkMode="newline"` privilégie les limites de paragraphes (lignes vides) avant le découpage par longueur.
    - `channels.telegram.mediaMaxMb` (par défaut 100) limite la taille des médias Telegram entrants et sortants.
    - `channels.telegram.mediaGroupFlushMs` (par défaut 500) contrôle la durée pendant laquelle les albums/groupes de médias Telegram sont mis en tampon avant qu’OpenClaw les envoie comme un seul message entrant. Augmentez-la si les parties d’album arrivent tard ; diminuez-la pour réduire la latence de réponse aux albums.
    - `channels.telegram.timeoutSeconds` remplace le délai d’expiration du client API Telegram (si non défini, la valeur par défaut de grammY s’applique). Les clients bot bornent les valeurs configurées sous la protection de 60 secondes des requêtes de texte/saisie sortantes afin que grammY n’interrompe pas la livraison visible des réponses avant que la protection de transport et la solution de secours d’OpenClaw puissent s’exécuter. Le long polling utilise toujours une protection de requête `getUpdates` de 45 secondes afin que les polls inactifs ne soient pas abandonnés indéfiniment.
    - `channels.telegram.pollingStallThresholdMs` vaut `120000` par défaut ; réglez-la entre `30000` et `600000` uniquement pour les redémarrages de polling bloqué faussement positifs.
    - l’historique de contexte de groupe utilise `channels.telegram.historyLimit` ou `messages.groupChat.historyLimit` (par défaut 50) ; `0` le désactive.
    - le contexte supplémentaire de réponse/citation/transfert est actuellement transmis tel que reçu.
    - les listes d’autorisation Telegram contrôlent principalement qui peut déclencher l’agent, et ne constituent pas une frontière complète de caviardage du contexte supplémentaire.
    - Contrôles de l’historique des DM :
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - La configuration `channels.telegram.retry` s’applique aux assistants d’envoi Telegram (CLI/outils/actions) pour les erreurs d’API sortantes récupérables. La livraison de réponse finale entrante utilise aussi une nouvelle tentative d’envoi sécurisé bornée pour les échecs Telegram avant connexion, mais elle ne retente pas les enveloppes réseau ambiguës après envoi qui pourraient dupliquer des messages visibles.

    Les cibles d’envoi CLI et d’outil de message peuvent être un ID de discussion numérique, un nom d’utilisateur, ou une cible de sujet forum :

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Les polls Telegram utilisent `openclaw message poll` et prennent en charge les sujets forum :

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
    - `--thread-id` pour les sujets forum (ou utilisez une cible `:topic:`)

    L’envoi Telegram prend aussi en charge :

    - `--presentation` avec des blocs `buttons` pour les claviers inline lorsque `channels.telegram.capabilities.inlineButtons` l’autorise
    - `--pin` ou `--delivery '{"pin":true}'` pour demander une livraison épinglée lorsque le bot peut épingler dans cette discussion
    - `--force-document` pour envoyer les images et GIF sortants comme documents plutôt que comme photos compressées ou téléversements de médias animés

    Contrôle des actions :

    - `channels.telegram.actions.sendMessage=false` désactive les messages Telegram sortants, y compris les polls
    - `channels.telegram.actions.poll=false` désactive la création de polls Telegram tout en laissant les envois ordinaires activés

  </Accordion>

  <Accordion title="Approbations exec dans Telegram">
    Telegram prend en charge les approbations exec dans les DM des approbateurs et peut facultativement publier les prompts dans la discussion ou le sujet d’origine. Les approbateurs doivent être des ID utilisateur Telegram numériques.

    Chemin de configuration :

    - `channels.telegram.execApprovals.enabled` (s’active automatiquement lorsqu’au moins un approbateur peut être résolu)
    - `channels.telegram.execApprovals.approvers` (revient aux ID propriétaires numériques de `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target` : `dm` (par défaut) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` et `defaultTo` contrôlent qui peut parler au bot et où il envoie les réponses normales. Ils ne font pas de quelqu’un un approbateur exec. Le premier appairage DM approuvé initialise `commands.ownerAllowFrom` lorsqu’aucun propriétaire de commande n’existe encore, de sorte que la configuration à propriétaire unique fonctionne toujours sans dupliquer les ID sous `execApprovals.approvers`.

    La livraison au canal affiche le texte de la commande dans la discussion ; n’activez `channel` ou `both` que dans des groupes/sujets de confiance. Lorsque le prompt arrive dans un sujet forum, OpenClaw conserve le sujet pour le prompt d’approbation et le suivi. Les approbations exec expirent par défaut après 30 minutes.

    Les boutons d’approbation inline nécessitent aussi que `channels.telegram.capabilities.inlineButtons` autorise la surface cible (`dm`, `group` ou `all`). Les ID d’approbation préfixés par `plugin:` sont résolus via les approbations de plugin ; les autres sont d’abord résolus via les approbations exec.

    Voir [Approbations exec](/fr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Contrôles des réponses d’erreur

Lorsque l’agent rencontre une erreur de livraison ou de fournisseur, Telegram peut soit répondre avec le texte de l’erreur, soit le supprimer. Deux clés de configuration contrôlent ce comportement :

| Clé                                 | Valeurs           | Par défaut | Description                                                                                                      |
| ----------------------------------- | ----------------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply` envoie un message d’erreur convivial dans la discussion. `silent` supprime entièrement les réponses d’erreur. |
| `channels.telegram.errorCooldownMs` | nombre (ms)       | `60000`    | Temps minimal entre les réponses d’erreur à la même discussion. Empêche le spam d’erreurs pendant les pannes.    |

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
      - puis supprimez et ajoutez de nouveau le bot au groupe
    - `openclaw channels status` avertit quand la configuration attend des messages de groupe sans mention.
    - `openclaw channels status --probe` peut vérifier les ID de groupe numériques explicites ; le caractère générique `"*"` ne peut pas faire l’objet d’une vérification d’appartenance.
    - test rapide de session : `/activation always`.

  </Accordion>

  <Accordion title="Le bot ne voit aucun message de groupe">

    - lorsque `channels.telegram.groups` existe, le groupe doit être listé (ou inclure `"*"`)
    - vérifiez l’appartenance du bot au groupe
    - consultez les journaux : `openclaw logs --follow` pour connaître les raisons de l’ignorance

  </Accordion>

  <Accordion title="Les commandes fonctionnent partiellement ou pas du tout">

    - autorisez votre identité d’expéditeur (jumelage et/ou `allowFrom` numérique)
    - l’autorisation des commandes s’applique toujours même lorsque la stratégie de groupe est `open`
    - `setMyCommands failed` avec `BOT_COMMANDS_TOO_MUCH` signifie que le menu natif contient trop d’entrées ; réduisez les commandes Plugin/Skills/personnalisées ou désactivez les menus natifs
    - les appels de démarrage `deleteMyCommands` / `setMyCommands` et les appels de saisie `sendChatAction` sont bornés et réessayés une fois via le repli de transport de Telegram en cas d’expiration de la requête. Les erreurs réseau/fetch persistantes indiquent généralement des problèmes de joignabilité DNS/HTTPS vers `api.telegram.org`

  </Accordion>

  <Accordion title="Le démarrage signale un jeton non autorisé">

    - `getMe returned 401` est un échec d’authentification Telegram pour le jeton de bot configuré.
    - Recopiez ou régénérez le jeton du bot dans BotFather, puis mettez à jour `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` ou `TELEGRAM_BOT_TOKEN` pour le compte par défaut.
    - `deleteWebhook 401 Unauthorized` pendant le démarrage est également un échec d’authentification ; le traiter comme « aucun Webhook n’existe » ne ferait que reporter le même échec de mauvais jeton aux appels API ultérieurs.

  </Accordion>

  <Accordion title="Instabilité du polling ou du réseau">

    - Node 22+ + un fetch/proxy personnalisé peuvent déclencher un comportement d’abandon immédiat si les types AbortSignal ne correspondent pas.
    - Certains hôtes résolvent d’abord `api.telegram.org` en IPv6 ; une sortie IPv6 défectueuse peut provoquer des échecs intermittents de l’API Telegram.
    - Si les journaux incluent `TypeError: fetch failed` ou `Network request for 'getUpdates' failed!`, OpenClaw réessaie désormais ces erreurs comme des erreurs réseau récupérables.
    - Pendant le démarrage du polling, OpenClaw réutilise la sonde `getMe` de démarrage réussie pour grammY afin que le runner n’ait pas besoin d’un second `getMe` avant le premier `getUpdates`.
    - Si `deleteWebhook` échoue avec une erreur réseau transitoire pendant le démarrage du polling, OpenClaw continue en long polling au lieu d’effectuer un autre appel de plan de contrôle avant le polling. Un Webhook encore actif apparaît comme un conflit `getUpdates` ; OpenClaw reconstruit alors le transport Telegram et réessaie le nettoyage du Webhook.
    - Si les sockets Telegram se recyclent selon une cadence fixe courte, vérifiez si `channels.telegram.timeoutSeconds` est bas ; les clients de bot plafonnent les valeurs configurées sous les protections des requêtes sortantes et `getUpdates`, mais les anciennes versions pouvaient interrompre chaque polling ou réponse lorsque cette valeur était définie sous ces protections.
    - Si les journaux incluent `Polling stall detected`, OpenClaw redémarre le polling et reconstruit le transport Telegram après 120 secondes sans liveness de long polling terminé par défaut.
    - `openclaw channels status --probe` et `openclaw doctor` avertissent lorsqu’un compte en polling actif n’a pas terminé `getUpdates` après la période de grâce de démarrage, lorsqu’un compte Webhook actif n’a pas terminé `setWebhook` après la période de grâce de démarrage, ou lorsque la dernière activité réussie du transport de polling est obsolète.
    - N’augmentez `channels.telegram.pollingStallThresholdMs` que lorsque les appels `getUpdates` de longue durée sont sains mais que votre hôte signale encore à tort des redémarrages pour blocage du polling. Les blocages persistants indiquent généralement des problèmes de proxy, DNS, IPv6 ou sortie TLS entre l’hôte et `api.telegram.org`.
    - Telegram respecte également les variables d’environnement de proxy du processus pour le transport de l’API Bot, y compris `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` et leurs variantes en minuscules. `NO_PROXY` / `no_proxy` peuvent toujours contourner `api.telegram.org`.
    - Si le proxy géré par OpenClaw est configuré via `OPENCLAW_PROXY_URL` pour un environnement de service et qu’aucune variable d’environnement de proxy standard n’est présente, Telegram utilise aussi cette URL pour le transport de l’API Bot.
    - Sur les hôtes VPS avec une sortie directe/TLS instable, routez les appels de l’API Telegram via `channels.telegram.proxy` :

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ utilise par défaut `autoSelectFamily=true` (sauf WSL2). L’ordre des résultats DNS de Telegram respecte `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, puis `channels.telegram.network.dnsResultOrder`, puis la valeur par défaut du processus comme `NODE_OPTIONS=--dns-result-order=ipv4first` ; si rien ne s’applique, Node 22+ revient à `ipv4first`.
    - Si votre hôte est WSL2 ou fonctionne explicitement mieux avec un comportement IPv4 uniquement, forcez la sélection de famille :

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Les réponses de plage de benchmark RFC 2544 (`198.18.0.0/15`) sont déjà autorisées
      par défaut pour les téléchargements de médias Telegram. Si un proxy fake-IP ou
      transparent de confiance réécrit `api.telegram.org` vers une autre
      adresse privée/interne/à usage spécial pendant les téléchargements de médias, vous pouvez
      activer le contournement propre à Telegram :

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - La même activation est disponible par compte à
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Si votre proxy résout les hôtes de médias Telegram en `198.18.x.x`, laissez d’abord le
      drapeau dangereux désactivé. Les médias Telegram autorisent déjà par défaut la plage de
      benchmark RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` affaiblit les protections SSRF
      des médias Telegram. Utilisez-le uniquement pour des environnements de proxy contrôlés par un opérateur
      de confiance, tels que le routage fake-IP de Clash, Mihomo ou Surge, lorsqu’ils
      synthétisent des réponses privées ou à usage spécial en dehors de la plage de benchmark
      RFC 2544. Laissez-le désactivé pour un accès Telegram normal via l’internet public.
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

<Accordion title="Champs Telegram à fort signal">

- démarrage/authentification : `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` doit pointer vers un fichier standard ; les liens symboliques sont rejetés)
- contrôle d’accès : `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de premier niveau (`type: "acp"`)
- approbations d’exécution : `execApprovals`, `accounts.*.execApprovals`
- commande/menu : `commands.native`, `commands.nativeSkills`, `customCommands`
- fils/réponses : `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
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
Priorité multi-compte : lorsque deux ID de compte ou plus sont configurés, définissez `channels.telegram.defaultAccount` (ou incluez `channels.telegram.accounts.default`) pour rendre le routage par défaut explicite. Sinon, OpenClaw revient au premier ID de compte normalisé et `openclaw doctor` émet un avertissement. Les comptes nommés héritent de `channels.telegram.allowFrom` / `groupAllowFrom`, mais pas des valeurs `accounts.default.*`.
</Note>

## Associé

<CardGroup cols={2}>
  <Card title="Jumelage" icon="link" href="/fr/channels/pairing">
    Jumelez un utilisateur Telegram au Gateway.
  </Card>
  <Card title="Groupes" icon="users" href="/fr/channels/groups">
    Comportement des listes d’autorisation de groupes et de sujets.
  </Card>
  <Card title="Routage des canaux" icon="route" href="/fr/channels/channel-routing">
    Routez les messages entrants vers les agents.
  </Card>
  <Card title="Sécurité" icon="shield" href="/fr/gateway/security">
    Modèle de menace et durcissement.
  </Card>
  <Card title="Routage multi-agent" icon="sitemap" href="/fr/concepts/multi-agent">
    Associez les groupes et les sujets aux agents.
  </Card>
  <Card title="Dépannage" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics inter-canaux.
  </Card>
</CardGroup>
