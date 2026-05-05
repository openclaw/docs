---
read_when:
    - Travailler sur les fonctionnalités Telegram ou les Webhooks
summary: État de prise en charge du bot Telegram, capacités et configuration
title: Telegram
x-i18n:
    generated_at: "2026-05-05T06:16:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03c75169335378482b80f1ceb669cefaa034ad3e589cf5f1d14c8252608ee46a
    source_path: channels/telegram.md
    workflow: 16
---

Prêt pour la production pour les MP de bots et les groupes via grammY. Le mode par défaut est le long polling ; le mode Webhook est facultatif.

<CardGroup cols={3}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    La politique de MP par défaut pour Telegram est l’appairage.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics multicanaux et guides de réparation.
  </Card>
  <Card title="Configuration du Gateway" icon="settings" href="/fr/gateway/configuration">
    Modèles et exemples complets de configuration de canal.
  </Card>
</CardGroup>

## Configuration rapide

<Steps>
  <Step title="Créer le jeton du bot dans BotFather">
    Ouvrez Telegram et discutez avec **@BotFather** (vérifiez que l’identifiant est exactement `@BotFather`).

    Exécutez `/newbot`, suivez les invites et enregistrez le jeton.

  </Step>

  <Step title="Configurer le jeton et la politique de MP">

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

    Repli env : `TELEGRAM_BOT_TOKEN=...` (compte par défaut uniquement).
    Telegram n’utilise **pas** `openclaw channels login telegram` ; configurez le jeton dans la config/l’env, puis démarrez le Gateway.

  </Step>

  <Step title="Démarrer le Gateway et approuver le premier MP">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Les codes d’appairage expirent après 1 heure.

  </Step>

  <Step title="Ajouter le bot à un groupe">
    Ajoutez le bot à votre groupe, puis définissez `channels.telegram.groups` et `groupPolicy` selon votre modèle d’accès.
  </Step>
</Steps>

<Note>
L’ordre de résolution des jetons tient compte du compte. En pratique, les valeurs de config priment sur le repli env, et `TELEGRAM_BOT_TOKEN` s’applique uniquement au compte par défaut.
</Note>

## Paramètres côté Telegram

<AccordionGroup>
  <Accordion title="Mode confidentialité et visibilité des groupes">
    Les bots Telegram utilisent par défaut le **Mode confidentialité**, qui limite les messages de groupe qu’ils reçoivent.

    Si le bot doit voir tous les messages de groupe, vous pouvez :

    - désactiver le mode confidentialité via `/setprivacy`, ou
    - faire du bot un administrateur du groupe.

    Lorsque vous changez le mode confidentialité, supprimez puis rajoutez le bot dans chaque groupe pour que Telegram applique le changement.

  </Accordion>

  <Accordion title="Autorisations de groupe">
    Le statut d’administrateur se contrôle dans les paramètres du groupe Telegram.

    Les bots administrateurs reçoivent tous les messages de groupe, ce qui est utile pour un comportement de groupe toujours actif.

  </Accordion>

  <Accordion title="Options BotFather utiles">

    - `/setjoingroups` pour autoriser/refuser les ajouts aux groupes
    - `/setprivacy` pour le comportement de visibilité en groupe

  </Accordion>
</AccordionGroup>

## Contrôle d’accès et activation

<Tabs>
  <Tab title="Politique de MP">
    `channels.telegram.dmPolicy` contrôle l’accès aux messages directs :

    - `pairing` (par défaut)
    - `allowlist` (nécessite au moins un ID d’expéditeur dans `allowFrom`)
    - `open` (nécessite que `allowFrom` inclue `"*"`)
    - `disabled`

    `dmPolicy: "open"` avec `allowFrom: ["*"]` permet à tout compte Telegram qui trouve ou devine le nom d’utilisateur du bot de commander le bot. Utilisez-le uniquement pour des bots volontairement publics avec des outils strictement restreints ; les bots à propriétaire unique doivent utiliser `allowlist` avec des ID utilisateur numériques.

    `channels.telegram.allowFrom` accepte les ID utilisateur Telegram numériques. Les préfixes `telegram:` / `tg:` sont acceptés et normalisés.
    Dans les configurations multicomptes, un `channels.telegram.allowFrom` restrictif au niveau supérieur est traité comme une limite de sécurité : les entrées `allowFrom: ["*"]` au niveau du compte ne rendent pas ce compte public, sauf si la liste d’autorisation effective du compte contient encore un joker explicite après fusion.
    `dmPolicy: "allowlist"` avec `allowFrom` vide bloque tous les MP et est rejeté par la validation de config.
    La configuration demande uniquement des ID utilisateur numériques.
    Si vous avez effectué une mise à niveau et que votre config contient des entrées de liste d’autorisation `@username`, exécutez `openclaw doctor --fix` pour les résoudre (meilleur effort ; nécessite un jeton de bot Telegram).
    Si vous vous appuyiez auparavant sur des fichiers de liste d’autorisation du magasin d’appairage, `openclaw doctor --fix` peut récupérer les entrées dans `channels.telegram.allowFrom` dans les flux de liste d’autorisation (par exemple lorsque `dmPolicy: "allowlist"` n’a pas encore d’ID explicites).

    Pour les bots à propriétaire unique, préférez `dmPolicy: "allowlist"` avec des ID `allowFrom` numériques explicites afin de conserver une politique d’accès durable dans la config (au lieu de dépendre d’approbations d’appairage précédentes).

    Confusion fréquente : l’approbation d’appairage en MP ne signifie pas « cet expéditeur est autorisé partout ».
    L’appairage accorde l’accès aux MP. Si aucun propriétaire de commandes n’existe encore, le premier appairage approuvé définit aussi `commands.ownerAllowFrom` afin que les commandes réservées au propriétaire et les approbations d’exécution disposent d’un compte opérateur explicite.
    L’autorisation des expéditeurs de groupe provient toujours des listes d’autorisation explicites de la config.
    Si vous voulez « je suis autorisé une fois et les MP comme les commandes de groupe fonctionnent », placez votre ID utilisateur Telegram numérique dans `channels.telegram.allowFrom` ; pour les commandes réservées au propriétaire, vérifiez que `commands.ownerAllowFrom` contient `telegram:<your user id>`.

    ### Trouver votre ID utilisateur Telegram

    Plus sûr (sans bot tiers) :

    1. Envoyez un MP à votre bot.
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
         - avec `groupPolicy: "open"` : n’importe quel groupe peut passer les vérifications d’ID de groupe
         - avec `groupPolicy: "allowlist"` (par défaut) : les groupes sont bloqués jusqu’à ce que vous ajoutiez des entrées `groups` (ou `"*"`)
       - `groups` configuré : agit comme liste d’autorisation (ID explicites ou `"*"`)

    2. **Quels expéditeurs sont autorisés dans les groupes** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (par défaut)
       - `disabled`

    `groupAllowFrom` est utilisé pour le filtrage des expéditeurs de groupe. S’il n’est pas défini, Telegram se rabat sur `allowFrom`.
    Les entrées `groupAllowFrom` doivent être des ID utilisateur Telegram numériques (les préfixes `telegram:` / `tg:` sont normalisés).
    Ne mettez pas d’ID de chat de groupe ou de supergroupe Telegram dans `groupAllowFrom`. Les ID de chat négatifs doivent être placés sous `channels.telegram.groups`.
    Les entrées non numériques sont ignorées pour l’autorisation d’expéditeur.
    Limite de sécurité (`2026.2.25+`) : l’authentification des expéditeurs de groupe n’hérite **pas** des approbations du magasin d’appairage en MP.
    L’appairage reste limité aux MP. Pour les groupes, définissez `groupAllowFrom` ou `allowFrom` par groupe/par sujet.
    Si `groupAllowFrom` n’est pas défini, Telegram se rabat sur la config `allowFrom`, pas sur le magasin d’appairage.
    Modèle pratique pour les bots à propriétaire unique : définissez votre ID utilisateur dans `channels.telegram.allowFrom`, laissez `groupAllowFrom` non défini et autorisez les groupes cibles sous `channels.telegram.groups`.
    Note d’exécution : si `channels.telegram` est totalement absent, l’exécution utilise par défaut `groupPolicy="allowlist"` avec échec fermé, sauf si `channels.defaults.groupPolicy` est explicitement défini.

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
      - Placez les ID utilisateur Telegram comme `8734062810` sous `groupAllowFrom` lorsque vous voulez limiter les personnes qui peuvent déclencher le bot dans un groupe autorisé.
      - Utilisez `groupAllowFrom: ["*"]` uniquement lorsque vous voulez que n’importe quel membre d’un groupe autorisé puisse parler au bot.

    </Warning>

  </Tab>

  <Tab title="Comportement des mentions">
    Les réponses de groupe nécessitent une mention par défaut.

    La mention peut provenir :

    - d’une mention native `@botusername`, ou
    - de modèles de mention dans :
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Options de commande au niveau de la session :

    - `/activation always`
    - `/activation mention`

    Elles mettent uniquement à jour l’état de session. Utilisez la config pour la persistance.

    Exemple de config persistante :

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

    - transférer un message de groupe à `@userinfobot` / `@getidsbot`
    - ou lire `chat.id` depuis `openclaw logs --follow`
    - ou inspecter `getUpdates` de l’API Bot

  </Tab>
</Tabs>

## Comportement d’exécution

- Telegram appartient au processus Gateway.
- Le routage est déterministe : les entrées Telegram répondent vers Telegram (le modèle ne choisit pas les canaux).
- Les messages entrants sont normalisés dans l’enveloppe de canal partagée avec les métadonnées de réponse et les espaces réservés de média.
- Les sessions de groupe sont isolées par ID de groupe. Les sujets de forum ajoutent `:topic:<threadId>` pour maintenir l’isolation des sujets.
- Les messages MP peuvent transporter `message_thread_id` ; OpenClaw préserve l’ID de fil pour les réponses, mais conserve les MP sur la session plate par défaut. Configurez `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true`, ou une config de sujet correspondante lorsque vous voulez intentionnellement isoler les sessions par sujet de MP.
- Le long polling utilise le runner grammY avec séquencement par chat/par fil. La concurrence globale du collecteur du runner utilise `agents.defaults.maxConcurrent`.
- Le long polling est protégé dans chaque processus Gateway afin qu’un seul poller actif puisse utiliser un jeton de bot à la fois. Si vous voyez encore des conflits `getUpdates` 409, un autre Gateway OpenClaw, script ou poller externe utilise probablement le même jeton.
- Les redémarrages du chien de garde de long polling se déclenchent par défaut après 120 secondes sans vivacité `getUpdates` terminée. Augmentez `channels.telegram.pollingStallThresholdMs` uniquement si votre déploiement observe encore de faux redémarrages pour blocage de polling pendant des tâches longues. La valeur est en millisecondes et est autorisée de `30000` à `600000` ; les remplacements par compte sont pris en charge.
- L’API Bot Telegram ne prend pas en charge les accusés de lecture (`sendReadReceipts` ne s’applique pas).

## Référence des fonctionnalités

<AccordionGroup>
  <Accordion title="Aperçu du flux en direct (modifications de message)">
    OpenClaw peut diffuser des réponses partielles en temps réel :

    - chats directs : message d’aperçu + `editMessageText`
    - groupes/sujets : message d’aperçu + `editMessageText`

    Exigence :

    - `channels.telegram.streaming` vaut `off | partial | block | progress` (par défaut : `partial`)
    - `progress` conserve un brouillon de statut modifiable et le met à jour avec la progression des outils jusqu’à la livraison finale
    - `streaming.preview.toolProgress` contrôle si les mises à jour d’outil/de progression réutilisent le même message d’aperçu modifié (par défaut : `true` lorsque le streaming d’aperçu est actif)
    - `streaming.preview.commandText` contrôle le détail de commande/d’exécution dans ces lignes de progression d’outil : `raw` (par défaut, préserve le comportement publié) ou `status` (étiquette d’outil uniquement)
    - les anciens `channels.telegram.streamMode` et valeurs booléennes `streaming` sont détectés ; exécutez `openclaw doctor --fix` pour les migrer vers `channels.telegram.streaming.mode`

    Les mises à jour d’aperçu de progression d’outil sont les courtes lignes de statut affichées pendant l’exécution des outils, par exemple l’exécution de commandes, la lecture de fichiers, les mises à jour de planification ou les résumés de correctifs. Telegram les garde activées par défaut pour correspondre au comportement OpenClaw publié depuis `v2026.4.22` et les versions ultérieures. Pour conserver l’aperçu modifié pour le texte de réponse tout en masquant les lignes de progression d’outil, définissez :

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

    Pour garder la progression d’outil visible mais masquer le texte de commande/d’exécution, définissez :

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

    Pour le mode brouillon de progression, placez la même politique de texte de commande sous `streaming.progress` :

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

    Utilisez `streaming.mode: "off"` uniquement lorsque vous voulez une livraison finale seulement : les modifications d’aperçu Telegram sont désactivées et les bavardages génériques d’outil/de progression sont supprimés au lieu d’être envoyés comme messages d’état autonomes. Les invites d’approbation, les charges utiles multimédias et les erreurs passent toujours par la livraison finale normale. Utilisez `streaming.preview.toolProgress: false` lorsque vous voulez seulement conserver les modifications d’aperçu de réponse tout en masquant les lignes d’état de progression de l’outil.

    <Note>
      Les réponses Telegram à citation sélectionnée sont l’exception. Lorsque `replyToMode` vaut `"first"`, `"all"` ou `"batched"` et que le message entrant inclut un texte de citation sélectionné, OpenClaw envoie la réponse finale via le chemin de réponse avec citation natif de Telegram au lieu de modifier l’aperçu de réponse ; `streaming.preview.toolProgress` ne peut donc pas afficher les courtes lignes d’état pour ce tour. Les réponses au message courant sans texte de citation sélectionné conservent toujours le streaming d’aperçu. Définissez `replyToMode: "off"` lorsque la visibilité de la progression des outils compte davantage que les réponses avec citation natives, ou définissez `streaming.preview.toolProgress: false` pour accepter le compromis.
    </Note>

    Pour les réponses en texte uniquement :

    - aperçus courts de DM/groupe/sujet : OpenClaw conserve le même message d’aperçu et effectue une modification finale sur place, sauf si un message visible hors aperçu a été envoyé après l’apparition de l’aperçu
    - les textes finaux longs qui se divisent en plusieurs messages Telegram réutilisent si possible l’aperçu existant comme premier fragment final, puis envoient uniquement les fragments restants
    - aperçus suivis d’une sortie visible hors aperçu : OpenClaw envoie la réponse terminée comme nouveau message final et nettoie l’ancien aperçu, afin que la réponse finale apparaisse après la sortie intermédiaire
    - aperçus vieux d’environ plus d’une minute : OpenClaw envoie la réponse terminée comme nouveau message final puis nettoie l’aperçu, afin que l’horodatage visible de Telegram reflète l’heure d’achèvement plutôt que l’heure de création de l’aperçu

    Pour les réponses complexes (par exemple les charges utiles multimédias), OpenClaw revient à la livraison finale normale puis nettoie le message d’aperçu.

    Le streaming d’aperçu est séparé du streaming par blocs. Lorsque le streaming par blocs est explicitement activé pour Telegram, OpenClaw ignore le flux d’aperçu afin d’éviter un double streaming.

    Flux de raisonnement propre à Telegram :

    - `/reasoning stream` envoie le raisonnement dans l’aperçu en direct pendant la génération
    - l’aperçu de raisonnement est supprimé après la livraison finale ; utilisez `/reasoning on` lorsque le raisonnement doit rester visible
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

    Ajoutez des entrées de menu de commandes personnalisées :

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

    Règles :

    - les noms sont normalisés (suppression du `/` initial, minuscules)
    - motif valide : `a-z`, `0-9`, `_`, longueur `1..32`
    - les commandes personnalisées ne peuvent pas remplacer les commandes natives
    - les conflits/doublons sont ignorés et consignés

    Notes :

    - les commandes personnalisées sont uniquement des entrées de menu ; elles n’implémentent pas automatiquement un comportement
    - les commandes de Plugin/Skill peuvent toujours fonctionner lorsqu’elles sont saisies, même si elles ne sont pas affichées dans le menu Telegram

    Si les commandes natives sont désactivées, les commandes intégrées sont supprimées. Les commandes personnalisées/de Plugin peuvent toujours s’enregistrer si elles sont configurées.

    Échecs de configuration courants :

    - `setMyCommands failed` avec `BOT_COMMANDS_TOO_MUCH` signifie que le menu Telegram débordait encore après réduction ; réduisez les commandes de Plugin/Skill/personnalisées ou désactivez `channels.telegram.commands.native`.
    - l’échec de `deleteWebhook`, `deleteMyCommands` ou `setMyCommands` avec `404: Not Found` alors que les commandes curl directes de la Bot API fonctionnent peut signifier que `channels.telegram.apiRoot` a été défini sur le point de terminaison complet `/bot<TOKEN>`. `apiRoot` doit être uniquement la racine de la Bot API, et `openclaw doctor --fix` supprime un `/bot<TOKEN>` final accidentel.
    - `getMe returned 401` signifie que Telegram a rejeté le jeton de bot configuré. Mettez à jour `botToken`, `tokenFile` ou `TELEGRAM_BOT_TOKEN` avec le jeton BotFather actuel ; OpenClaw s’arrête avant l’interrogation, ce qui n’est donc pas signalé comme un échec de nettoyage de Webhook.
    - `setMyCommands failed` avec des erreurs réseau/fetch signifie généralement que le DNS/HTTPS sortant vers `api.telegram.org` est bloqué.

    ### Commandes d’appairage d’appareil (Plugin `device-pair`)

    Lorsque le Plugin `device-pair` est installé :

    1. `/pair` génère le code de configuration
    2. collez le code dans l’application iOS
    3. `/pair pending` liste les demandes en attente (y compris rôle/portées)
    4. approuvez la demande :
       - `/pair approve <requestId>` pour une approbation explicite
       - `/pair approve` lorsqu’il n’y a qu’une seule demande en attente
       - `/pair approve latest` pour la plus récente

    Le code de configuration transporte un jeton d’amorçage à courte durée de vie. Le transfert d’amorçage intégré conserve le jeton du nœud principal à `scopes: []` ; tout jeton opérateur transféré reste limité à `operator.approvals`, `operator.read`, `operator.talk.secrets` et `operator.write`. Les vérifications de portée d’amorçage sont préfixées par rôle ; cette liste d’autorisation d’opérateur ne satisfait donc que les demandes d’opérateur, et les rôles non opérateurs ont toujours besoin de portées sous leur propre préfixe de rôle.

    Si un appareil réessaie avec des détails d’authentification modifiés (par exemple rôle/portées/clé publique), la demande précédente en attente est remplacée et la nouvelle demande utilise un `requestId` différent. Relancez `/pair pending` avant d’approuver.

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

    - `sendMessage` (`to`, `content`, `mediaUrl` facultatif, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, `iconColor` facultatif, `iconCustomEmojiId`)

    Les actions de message de canal exposent des alias ergonomiques (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Contrôles de verrouillage :

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (par défaut : désactivé)

    Remarque : `edit` et `topic-create` sont actuellement activés par défaut et n’ont pas de bascules `channels.telegram.actions.*` séparées.
    Les envois à l’exécution utilisent l’instantané actif de configuration/secrets (démarrage/rechargement), les chemins d’action ne réeffectuent donc pas de résolution SecretRef ad hoc à chaque envoi.

    Sémantique de suppression des réactions : [/tools/reactions](/fr/tools/reactions)

  </Accordion>

  <Accordion title="Balises de fil de réponse">
    Telegram prend en charge des balises explicites de fil de réponse dans la sortie générée :

    - `[[reply_to_current]]` répond au message déclencheur
    - `[[reply_to:<id>]]` répond à un ID de message Telegram spécifique

    `channels.telegram.replyToMode` contrôle la gestion :

    - `off` (par défaut)
    - `first`
    - `all`

    Lorsque le fil de réponse est activé et que le texte ou la légende Telegram d’origine est disponible, OpenClaw inclut automatiquement un extrait de citation Telegram natif. Telegram limite le texte de citation natif à 1024 unités de code UTF-16 ; les messages plus longs sont donc cités depuis le début et reviennent à une réponse simple si Telegram rejette la citation.

    Remarque : `off` désactive le fil de réponse implicite. Les balises explicites `[[reply_to_*]]` sont toujours honorées.

  </Accordion>

  <Accordion title="Sujets de forum et comportement des fils">
    Supergroupes de forum :

    - les clés de session de sujet ajoutent `:topic:<threadId>`
    - les réponses et la saisie ciblent le fil du sujet
    - chemin de configuration du sujet :
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Cas particulier du sujet général (`threadId=1`) :

    - les envois de message omettent `message_thread_id` (Telegram rejette `sendMessage(...thread_id=1)`)
    - les actions de saisie incluent toujours `message_thread_id`

    Héritage de sujet : les entrées de sujet héritent des paramètres de groupe sauf remplacement (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` est propre au sujet et n’hérite pas des valeurs par défaut du groupe.

    **Routage d’agent par sujet** : Chaque sujet peut être routé vers un agent différent en définissant `agentId` dans la configuration du sujet. Cela donne à chaque sujet son propre espace de travail, sa mémoire et sa session isolés. Exemple :

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

    Chaque sujet possède alors sa propre clé de session : `agent:zu:telegram:group:-1001234567890:topic:3`

    **Liaison persistante de sujet ACP** : Les sujets de forum peuvent épingler les sessions de harnais ACP via des liaisons ACP typées de niveau supérieur (`bindings[]` avec `type: "acp"` et `match.channel: "telegram"`, `peer.kind: "group"` et un identifiant qualifié par sujet comme `-1001234567890:topic:42`). Actuellement limité aux sujets de forum dans les groupes/supergroupes. Voir [Agents ACP](/fr/tools/acp-agents).

    **Création ACP liée au fil depuis le chat** : `/acp spawn <agent> --thread here|auto` lie le sujet actuel à une nouvelle session ACP ; les suivis y sont routés directement. OpenClaw épingle la confirmation de création dans le sujet. Nécessite que `channels.telegram.threadBindings.spawnSessions` reste activé (par défaut : `true`).

    Le contexte du modèle expose `MessageThreadId` et `IsForum`. Les conversations DM avec `message_thread_id` conservent par défaut le routage DM et les métadonnées de réponse sur les sessions plates ; elles n’utilisent des clés de session tenant compte des fils que lorsqu’elles sont configurées avec `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true`, ou une configuration de sujet correspondante. Utilisez `channels.telegram.dm.threadReplies` au niveau supérieur pour la valeur par défaut du compte, ou `direct.<chatId>.threadReplies` pour un DM.

  </Accordion>

  <Accordion title="Audio, vidéo et stickers">
    ### Messages audio

    Telegram distingue les notes vocales des fichiers audio.

    - par défaut : comportement de fichier audio
    - balise `[[audio_as_voice]]` dans la réponse de l’agent pour forcer l’envoi d’une note vocale
    - les transcriptions de notes vocales entrantes sont encadrées comme du texte généré par machine,
      non fiable, dans le contexte de l’agent ; la détection de mention utilise toujours la transcription
      brute, de sorte que les messages vocaux soumis à mention continuent de fonctionner.

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

    Champs de contexte des stickers :

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Fichier de cache des stickers :

    - `~/.openclaw/telegram/sticker-cache.json`

    Les stickers sont décrits une fois (lorsque c’est possible) et mis en cache afin de réduire les appels de vision répétés.

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

    Envoyer une action de sticker :

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Rechercher des stickers mis en cache :

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
    Les réactions Telegram arrivent sous forme de mises à jour `message_reaction` (séparées des payloads de message).

    Lorsqu’elles sont activées, OpenClaw met en file d’attente des événements système comme :

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Config :

    - `channels.telegram.reactionNotifications`: `off | own | all` (par défaut : `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (par défaut : `minimal`)

    Notes :

    - `own` signifie uniquement les réactions des utilisateurs aux messages envoyés par le bot (au mieux, via le cache des messages envoyés).
    - Les événements de réaction respectent toujours les contrôles d’accès Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) ; les expéditeurs non autorisés sont ignorés.
    - Telegram ne fournit pas d’ID de fil dans les mises à jour de réaction.
      - les groupes non-forum sont routés vers la session de discussion du groupe
      - les groupes de forum sont routés vers la session du sujet général du groupe (`:topic:1`), et non vers le sujet d’origine exact

    `allowed_updates` pour le polling/webhook inclut automatiquement `message_reaction`.

  </Accordion>

  <Accordion title="Réactions d’accusé de réception">
    `ackReaction` envoie un émoji d’accusé de réception pendant qu’OpenClaw traite un message entrant.

    Ordre de résolution :

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - repli sur l’émoji d’identité de l’agent (`agents.list[].identity.emoji`, sinon "👀")

    Notes :

    - Telegram attend un émoji unicode (par exemple "👀").
    - Utilisez `""` pour désactiver la réaction pour un canal ou un compte.

  </Accordion>

  <Accordion title="Écritures de configuration depuis des événements et commandes Telegram">
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

  <Accordion title="Long polling vs webhook">
    Le comportement par défaut est le long polling. Pour le mode webhook, définissez `channels.telegram.webhookUrl` et `channels.telegram.webhookSecret` ; `webhookPath`, `webhookHost`, `webhookPort` sont facultatifs (valeurs par défaut : `/telegram-webhook`, `127.0.0.1`, `8787`).

    L’écouteur local se lie à `127.0.0.1:8787`. Pour une entrée publique, placez un proxy inverse devant le port local ou définissez intentionnellement `webhookHost: "0.0.0.0"`.

    Le mode webhook valide les gardes de requête, le jeton secret Telegram et le corps JSON avant de retourner `200` à Telegram.
    OpenClaw traite ensuite la mise à jour de manière asynchrone via les mêmes voies de bot par discussion/par sujet que celles utilisées par le long polling, de sorte que les tours d’agent lents ne bloquent pas l’ACK de livraison de Telegram.

  </Accordion>

  <Accordion title="Limites, nouvelle tentative et cibles CLI">
    - `channels.telegram.textChunkLimit` vaut 4000 par défaut.
    - `channels.telegram.chunkMode="newline"` privilégie les limites de paragraphe (lignes vides) avant le découpage par longueur.
    - `channels.telegram.mediaMaxMb` (par défaut 100) plafonne la taille des médias Telegram entrants et sortants.
    - `channels.telegram.mediaGroupFlushMs` (par défaut 500) contrôle la durée pendant laquelle les albums/groupes de médias Telegram sont mis en mémoire tampon avant qu’OpenClaw ne les distribue comme un seul message entrant. Augmentez cette valeur si les parties d’album arrivent tard ; réduisez-la pour diminuer la latence de réponse aux albums.
    - `channels.telegram.timeoutSeconds` remplace le délai d’expiration du client API Telegram (si non défini, la valeur par défaut de grammY s’applique). Les clients bot limitent les valeurs configurées sous le garde de requête de texte/saisie sortante de 60 secondes, afin que grammY n’interrompe pas la livraison visible de la réponse avant que le garde de transport et le repli d’OpenClaw puissent s’exécuter. Le long polling utilise toujours un garde de requête `getUpdates` de 45 secondes afin que les polls inactifs ne soient pas abandonnés indéfiniment.
    - `channels.telegram.pollingStallThresholdMs` vaut par défaut `120000` ; ajustez entre `30000` et `600000` uniquement pour les redémarrages de polling bloqué faux positifs.
    - l’historique du contexte de groupe utilise `channels.telegram.historyLimit` ou `messages.groupChat.historyLimit` (par défaut 50) ; `0` le désactive.
    - le contexte supplémentaire de réponse/citation/transfert est actuellement transmis tel qu’il est reçu.
    - les listes d’autorisation Telegram contrôlent principalement qui peut déclencher l’agent, et non une frontière complète de caviardage du contexte supplémentaire.
    - Contrôles de l’historique DM :
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - La config `channels.telegram.retry` s’applique aux helpers d’envoi Telegram (CLI/outils/actions) pour les erreurs d’API sortantes récupérables. La livraison de réponse finale entrante utilise également une nouvelle tentative d’envoi sûr bornée pour les échecs Telegram avant connexion, mais elle ne réessaie pas les enveloppes réseau ambiguës après envoi qui pourraient dupliquer les messages visibles.

    Les cibles d’envoi CLI et d’outil de message peuvent être un ID de discussion numérique, un nom d’utilisateur ou une cible de sujet de forum :

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

    Flags de poll propres à Telegram :

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` pour les sujets de forum (ou utilisez une cible `:topic:`)

    L’envoi Telegram prend également en charge :

    - `--presentation` avec des blocs `buttons` pour les claviers en ligne lorsque `channels.telegram.capabilities.inlineButtons` l’autorise
    - `--pin` ou `--delivery '{"pin":true}'` pour demander une livraison épinglée lorsque le bot peut épingler dans cette discussion
    - `--force-document` pour envoyer les images sortantes et les GIF comme documents plutôt que comme photos compressées ou téléversements de médias animés

    Contrôle des actions :

    - `channels.telegram.actions.sendMessage=false` désactive les messages Telegram sortants, y compris les polls
    - `channels.telegram.actions.poll=false` désactive la création de polls Telegram tout en laissant les envois ordinaires activés

  </Accordion>

  <Accordion title="Approbations exec dans Telegram">
    Telegram prend en charge les approbations exec dans les DM des approbateurs et peut éventuellement publier des invites dans la discussion ou le sujet d’origine. Les approbateurs doivent être des ID d’utilisateur Telegram numériques.

    Chemin de config :

    - `channels.telegram.execApprovals.enabled` (s’active automatiquement lorsqu’au moins un approbateur peut être résolu)
    - `channels.telegram.execApprovals.approvers` (se rabat sur les ID propriétaires numériques depuis `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (par défaut) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` et `defaultTo` contrôlent qui peut parler au bot et où il envoie les réponses normales. Ils ne font pas de quelqu’un un approbateur exec. Le premier appairage DM approuvé amorce `commands.ownerAllowFrom` lorsqu’aucun propriétaire de commande n’existe encore, de sorte que la configuration à propriétaire unique fonctionne toujours sans dupliquer les ID sous `execApprovals.approvers`.

    La livraison au canal affiche le texte de la commande dans la discussion ; n’activez `channel` ou `both` que dans des groupes/sujets de confiance. Lorsque l’invite arrive dans un sujet de forum, OpenClaw conserve le sujet pour l’invite d’approbation et le suivi. Les approbations exec expirent au bout de 30 minutes par défaut.

    Les boutons d’approbation en ligne exigent également que `channels.telegram.capabilities.inlineButtons` autorise la surface cible (`dm`, `group` ou `all`). Les ID d’approbation préfixés par `plugin:` sont résolus via les approbations de plugins ; les autres sont d’abord résolus via les approbations exec.

    Voir [Approbations exec](/fr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Contrôles des réponses d’erreur

Lorsque l’agent rencontre une erreur de livraison ou de fournisseur, Telegram peut soit répondre avec le texte de l’erreur, soit le supprimer. Deux clés de config contrôlent ce comportement :

| Clé                                 | Valeurs           | Par défaut | Description                                                                                              |
| ----------------------------------- | ----------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply` envoie un message d’erreur convivial à la discussion. `silent` supprime entièrement les réponses d’erreur. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`    | Temps minimal entre les réponses d’erreur à la même discussion. Empêche le spam d’erreurs pendant les interruptions. |

Les remplacements par compte, par groupe et par sujet sont pris en charge (même héritage que les autres clés de config Telegram).

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

    - Si `requireMention=false`, le mode confidentialité de Telegram doit permettre une visibilité complète.
      - BotFather : `/setprivacy` -> Désactiver
      - puis supprimez et rajoutez le bot au groupe
    - `openclaw channels status` avertit lorsque la configuration attend des messages de groupe sans mention.
    - `openclaw channels status --probe` peut vérifier les identifiants numériques explicites de groupes ; le joker `"*"` ne peut pas faire l'objet d'une vérification d'appartenance.
    - test rapide de session : `/activation always`.

  </Accordion>

  <Accordion title="Le bot ne voit aucun message de groupe">

    - lorsque `channels.telegram.groups` existe, le groupe doit être listé (ou inclure `"*"`)
    - vérifiez l'appartenance du bot au groupe
    - consultez les journaux : `openclaw logs --follow` pour les raisons d'omission

  </Accordion>

  <Accordion title="Les commandes fonctionnent partiellement ou pas du tout">

    - autorisez l'identité de votre expéditeur (appariement et/ou `allowFrom` numérique)
    - l'autorisation des commandes s'applique toujours même lorsque la stratégie de groupe est `open`
    - `setMyCommands failed` avec `BOT_COMMANDS_TOO_MUCH` signifie que le menu natif comporte trop d'entrées ; réduisez les commandes de Plugin/Skills/personnalisées ou désactivez les menus natifs
    - les appels de démarrage `deleteMyCommands` / `setMyCommands` et les appels de saisie `sendChatAction` sont bornés et réessayés une fois via le repli de transport de Telegram en cas d'expiration de requête. Les erreurs réseau/fetch persistantes indiquent généralement des problèmes d'accessibilité DNS/HTTPS vers `api.telegram.org`

  </Accordion>

  <Accordion title="Le démarrage signale un jeton non autorisé">

    - `getMe returned 401` est un échec d'authentification Telegram pour le jeton de bot configuré.
    - Recopiez ou régénérez le jeton de bot dans BotFather, puis mettez à jour `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` ou `TELEGRAM_BOT_TOKEN` pour le compte par défaut.
    - `deleteWebhook 401 Unauthorized` pendant le démarrage est aussi un échec d'authentification ; le traiter comme « aucun webhook n'existe » ne ferait que reporter le même échec de mauvais jeton à des appels API ultérieurs.

  </Accordion>

  <Accordion title="Polling ou instabilité réseau">

    - Node 22+ + fetch/proxy personnalisé peuvent déclencher un comportement d'abandon immédiat si les types AbortSignal ne correspondent pas.
    - Certains hôtes résolvent d'abord `api.telegram.org` en IPv6 ; une sortie IPv6 défaillante peut provoquer des échecs intermittents de l'API Telegram.
    - Si les journaux incluent `TypeError: fetch failed` ou `Network request for 'getUpdates' failed!`, OpenClaw réessaie désormais ces erreurs comme des erreurs réseau récupérables.
    - Pendant le démarrage du polling, OpenClaw réutilise la sonde `getMe` de démarrage réussie pour grammY afin que l'exécuteur n'ait pas besoin d'un second `getMe` avant le premier `getUpdates`.
    - Si `deleteWebhook` échoue avec une erreur réseau transitoire pendant le démarrage du polling, OpenClaw poursuit en long polling au lieu d'effectuer un autre appel de plan de contrôle avant polling. Un webhook encore actif apparaît comme un conflit `getUpdates` ; OpenClaw reconstruit alors le transport Telegram et réessaie le nettoyage du webhook.
    - Si les sockets Telegram sont recyclées selon une cadence fixe courte, vérifiez si `channels.telegram.timeoutSeconds` est faible ; les clients de bot bornent les valeurs configurées sous les gardes des requêtes sortantes et `getUpdates`, mais les anciennes versions pouvaient abandonner chaque polling ou réponse lorsque cette valeur était définie sous ces gardes.
    - Si les journaux incluent `Polling stall detected`, OpenClaw redémarre le polling et reconstruit le transport Telegram après 120 secondes sans vivacité de long polling terminée par défaut.
    - `openclaw channels status --probe` et `openclaw doctor` avertissent lorsqu'un compte de polling en cours d'exécution n'a pas terminé `getUpdates` après le délai de grâce de démarrage, lorsqu'un compte webhook en cours d'exécution n'a pas terminé `setWebhook` après le délai de grâce de démarrage, ou lorsque la dernière activité réussie du transport de polling est obsolète.
    - Augmentez `channels.telegram.pollingStallThresholdMs` uniquement lorsque les appels `getUpdates` longue durée sont sains mais que votre hôte signale encore de faux redémarrages pour blocage de polling. Les blocages persistants indiquent généralement des problèmes de proxy, DNS, IPv6 ou sortie TLS entre l'hôte et `api.telegram.org`.
    - Telegram respecte également les variables d'environnement de proxy du processus pour le transport de l'API Bot, notamment `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` et leurs variantes en minuscules. `NO_PROXY` / `no_proxy` peuvent toujours contourner `api.telegram.org`.
    - Si le proxy géré par OpenClaw est configuré via `OPENCLAW_PROXY_URL` pour un environnement de service et qu'aucune variable d'environnement de proxy standard n'est présente, Telegram utilise aussi cette URL pour le transport de l'API Bot.
    - Sur les hôtes VPS avec une sortie directe/TLS instable, acheminez les appels à l'API Telegram via `channels.telegram.proxy` :

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ utilise par défaut `autoSelectFamily=true` (sauf WSL2). L'ordre des résultats DNS Telegram respecte `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, puis `channels.telegram.network.dnsResultOrder`, puis la valeur par défaut du processus comme `NODE_OPTIONS=--dns-result-order=ipv4first` ; si aucun ne s'applique, Node 22+ se replie sur `ipv4first`.
    - Si votre hôte est WSL2 ou fonctionne explicitement mieux avec un comportement IPv4 seul, forcez la sélection de famille :

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Les réponses de plage de banc d'essai RFC 2544 (`198.18.0.0/15`) sont déjà autorisées
      par défaut pour les téléchargements de médias Telegram. Si un faux IP fiable ou
      un proxy transparent réécrit `api.telegram.org` vers une autre adresse
      privée/interne/à usage spécial pendant les téléchargements de médias, vous pouvez
      activer le contournement limité à Telegram :

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - La même activation est disponible par compte à
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Si votre proxy résout les hôtes de médias Telegram en `198.18.x.x`, laissez d'abord
      l'indicateur dangereux désactivé. Les médias Telegram autorisent déjà la plage
      de banc d'essai RFC 2544 par défaut.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` affaiblit les protections
      SSRF des médias Telegram. Utilisez-le uniquement pour les environnements de proxy
      fiables contrôlés par l'opérateur comme Clash, Mihomo ou le routage faux IP de Surge lorsqu'ils
      synthétisent des réponses privées ou à usage spécial hors de la plage de banc d'essai
      RFC 2544. Laissez-le désactivé pour un accès Telegram normal à l'internet public.
    </Warning>

    - Surcharges d'environnement (temporaires) :
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

Plus d'aide : [Dépannage des canaux](/fr/channels/troubleshooting).

## Référence de configuration

Référence principale : [Référence de configuration - Telegram](/fr/gateway/config-channels#telegram).

<Accordion title="Champs Telegram à signal fort">

- démarrage/authentification : `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` doit pointer vers un fichier normal ; les liens symboliques sont rejetés)
- contrôle d'accès : `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de niveau supérieur (`type: "acp"`)
- approbations d'exécution : `execApprovals`, `accounts.*.execApprovals`
- commande/menu : `commands.native`, `commands.nativeSkills`, `customCommands`
- fils/réponses : `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming : `streaming` (aperçu), `streaming.preview.toolProgress`, `blockStreaming`
- mise en forme/livraison : `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- médias/réseau : `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- racine d'API personnalisée : `apiRoot` (racine de l'API Bot uniquement ; n'incluez pas `/bot<TOKEN>`)
- webhook : `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- actions/capacités : `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- réactions : `reactionNotifications`, `reactionLevel`
- erreurs : `errorPolicy`, `errorCooldownMs`
- écritures/historique : `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Priorité multi-compte : lorsque deux identifiants de compte ou plus sont configurés, définissez `channels.telegram.defaultAccount` (ou incluez `channels.telegram.accounts.default`) pour rendre explicite le routage par défaut. Sinon, OpenClaw se replie sur le premier identifiant de compte normalisé et `openclaw doctor` avertit. Les comptes nommés héritent de `channels.telegram.allowFrom` / `groupAllowFrom`, mais pas des valeurs `accounts.default.*`.
</Note>

## Connexe

<CardGroup cols={2}>
  <Card title="Appariement" icon="link" href="/fr/channels/pairing">
    Appariez un utilisateur Telegram au Gateway.
  </Card>
  <Card title="Groupes" icon="users" href="/fr/channels/groups">
    Comportement de liste d'autorisation des groupes et des sujets.
  </Card>
  <Card title="Routage des canaux" icon="route" href="/fr/channels/channel-routing">
    Routez les messages entrants vers des agents.
  </Card>
  <Card title="Sécurité" icon="shield" href="/fr/gateway/security">
    Modèle de menace et durcissement.
  </Card>
  <Card title="Routage multi-agent" icon="sitemap" href="/fr/concepts/multi-agent">
    Associez des groupes et des sujets à des agents.
  </Card>
  <Card title="Dépannage" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics inter-canaux.
  </Card>
</CardGroup>
