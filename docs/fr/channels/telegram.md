---
read_when:
    - Travailler sur les fonctionnalités Telegram ou les Webhooks
summary: État de la prise en charge du bot Telegram, fonctionnalités et configuration
title: Telegram
x-i18n:
    generated_at: "2026-05-02T20:41:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b5a733970f21e6b5a145b9ebb13134fb8e18b81fa0c723607019837c60f5497
    source_path: channels/telegram.md
    workflow: 16
---

Prêt pour la production pour les MP de bots et les groupes via grammY. Le mode par défaut est l’interrogation longue ; le mode webhook est facultatif.

<CardGroup cols={3}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    La stratégie de MP par défaut pour Telegram est l’appairage.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics inter-canaux et guides de réparation.
  </Card>
  <Card title="Configuration du Gateway" icon="settings" href="/fr/gateway/configuration">
    Modèles et exemples complets de configuration des canaux.
  </Card>
</CardGroup>

## Configuration rapide

<Steps>
  <Step title="Créer le jeton du bot dans BotFather">
    Ouvrez Telegram et discutez avec **@BotFather** (vérifiez que l’identifiant est exactement `@BotFather`).

    Exécutez `/newbot`, suivez les invites, puis enregistrez le jeton.

  </Step>

  <Step title="Configurer le jeton et la stratégie de MP">

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
    Ajoutez le bot à votre groupe, puis définissez `channels.telegram.groups` et `groupPolicy` pour correspondre à votre modèle d’accès.
  </Step>
</Steps>

<Note>
L’ordre de résolution des jetons tient compte du compte. En pratique, les valeurs de configuration priment sur le repli env, et `TELEGRAM_BOT_TOKEN` ne s’applique qu’au compte par défaut.
</Note>

## Paramètres côté Telegram

<AccordionGroup>
  <Accordion title="Mode confidentialité et visibilité des groupes">
    Les bots Telegram utilisent par défaut le **Mode confidentialité**, qui limite les messages de groupe qu’ils reçoivent.

    Si le bot doit voir tous les messages de groupe, vous pouvez soit :

    - désactiver le mode confidentialité via `/setprivacy`, soit
    - faire du bot un administrateur du groupe.

    Lorsque vous modifiez le mode confidentialité, supprimez puis rajoutez le bot dans chaque groupe afin que Telegram applique le changement.

  </Accordion>

  <Accordion title="Autorisations de groupe">
    Le statut d’administrateur se contrôle dans les paramètres du groupe Telegram.

    Les bots administrateurs reçoivent tous les messages de groupe, ce qui est utile pour un comportement de groupe toujours actif.

  </Accordion>

  <Accordion title="Bascules BotFather utiles">

    - `/setjoingroups` pour autoriser/interdire l’ajout aux groupes
    - `/setprivacy` pour le comportement de visibilité dans les groupes

  </Accordion>
</AccordionGroup>

## Contrôle d’accès et activation

<Tabs>
  <Tab title="Stratégie de MP">
    `channels.telegram.dmPolicy` contrôle l’accès aux messages directs :

    - `pairing` (par défaut)
    - `allowlist` (nécessite au moins un ID d’expéditeur dans `allowFrom`)
    - `open` (nécessite que `allowFrom` inclue `"*"`)
    - `disabled`

    `dmPolicy: "open"` avec `allowFrom: ["*"]` permet à tout compte Telegram qui trouve ou devine le nom d’utilisateur du bot de commander le bot. Utilisez-le uniquement pour des bots volontairement publics avec des outils strictement restreints ; les bots à propriétaire unique doivent utiliser `allowlist` avec des ID utilisateur numériques.

    `channels.telegram.allowFrom` accepte les ID utilisateur Telegram numériques. Les préfixes `telegram:` / `tg:` sont acceptés et normalisés.
    Dans les configurations multi-comptes, un `channels.telegram.allowFrom` restrictif au niveau supérieur est traité comme une limite de sécurité : les entrées de niveau compte `allowFrom: ["*"]` ne rendent pas ce compte public sauf si la liste d’autorisation effective du compte contient encore un joker explicite après fusion.
    `dmPolicy: "allowlist"` avec un `allowFrom` vide bloque tous les MP et est rejeté par la validation de configuration.
    La configuration ne demande que des ID utilisateur numériques.
    Si vous avez effectué une mise à niveau et que votre configuration contient des entrées de liste d’autorisation `@username`, exécutez `openclaw doctor --fix` pour les résoudre (au mieux ; nécessite un jeton de bot Telegram).
    Si vous vous appuyiez précédemment sur des fichiers de liste d’autorisation du magasin d’appairage, `openclaw doctor --fix` peut récupérer les entrées dans `channels.telegram.allowFrom` pour les flux en liste d’autorisation (par exemple lorsque `dmPolicy: "allowlist"` n’a encore aucun ID explicite).

    Pour les bots à propriétaire unique, préférez `dmPolicy: "allowlist"` avec des ID numériques explicites dans `allowFrom` afin de garder la stratégie d’accès durable dans la configuration (au lieu de dépendre d’approbations d’appairage précédentes).

    Confusion courante : l’approbation d’appairage en MP ne signifie pas « cet expéditeur est autorisé partout ».
    L’appairage accorde l’accès aux MP. Si aucun propriétaire de commande n’existe encore, le premier appairage approuvé définit aussi `commands.ownerAllowFrom` afin que les commandes réservées au propriétaire et les approbations d’exécution aient un compte opérateur explicite.
    L’autorisation des expéditeurs en groupe provient toujours des listes d’autorisation explicites de la configuration.
    Si vous voulez « je suis autorisé une fois et les MP comme les commandes de groupe fonctionnent », placez votre ID utilisateur Telegram numérique dans `channels.telegram.allowFrom` ; pour les commandes réservées au propriétaire, assurez-vous que `commands.ownerAllowFrom` contient `telegram:<your user id>`.

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

  <Tab title="Stratégie de groupe et listes d’autorisation">
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

    `groupAllowFrom` est utilisé pour filtrer les expéditeurs de groupe. S’il n’est pas défini, Telegram se rabat sur `allowFrom`.
    Les entrées `groupAllowFrom` doivent être des ID utilisateur Telegram numériques (les préfixes `telegram:` / `tg:` sont normalisés).
    Ne mettez pas d’ID de chat de groupe ou de supergroupe Telegram dans `groupAllowFrom`. Les ID de chat négatifs vont sous `channels.telegram.groups`.
    Les entrées non numériques sont ignorées pour l’autorisation des expéditeurs.
    Limite de sécurité (`2026.2.25+`) : l’authentification des expéditeurs de groupe n’hérite **pas** des approbations du magasin d’appairage des MP.
    L’appairage reste limité aux MP. Pour les groupes, définissez `groupAllowFrom` ou un `allowFrom` par groupe/par sujet.
    Si `groupAllowFrom` n’est pas défini, Telegram se rabat sur le `allowFrom` de la configuration, pas sur le magasin d’appairage.
    Modèle pratique pour les bots à propriétaire unique : définissez votre ID utilisateur dans `channels.telegram.allowFrom`, laissez `groupAllowFrom` non défini, puis autorisez les groupes cibles sous `channels.telegram.groups`.
    Note d’exécution : si `channels.telegram` est complètement absent, l’exécution utilise par défaut `groupPolicy="allowlist"` en mode fermé, sauf si `channels.defaults.groupPolicy` est défini explicitement.

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
      Erreur courante : `groupAllowFrom` n’est pas une liste d’autorisation de groupes Telegram.

      - Placez les ID de chat de groupe ou de supergroupe Telegram négatifs comme `-1001234567890` sous `channels.telegram.groups`.
      - Placez les ID utilisateur Telegram comme `8734062810` sous `groupAllowFrom` lorsque vous voulez limiter les personnes qui, dans un groupe autorisé, peuvent déclencher le bot.
      - Utilisez `groupAllowFrom: ["*"]` uniquement lorsque vous voulez que n’importe quel membre d’un groupe autorisé puisse parler au bot.

    </Warning>

  </Tab>

  <Tab title="Comportement des mentions">
    Les réponses de groupe nécessitent une mention par défaut.

    La mention peut provenir de :

    - une mention native `@botusername`, ou
    - des motifs de mention dans :
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Bascules de commande au niveau session :

    - `/activation always`
    - `/activation mention`

    Elles ne mettent à jour que l’état de la session. Utilisez la configuration pour la persistance.

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

    - transférez un message de groupe à `@userinfobot` / `@getidsbot`
    - ou lisez `chat.id` depuis `openclaw logs --follow`
    - ou inspectez `getUpdates` de l’API Bot

  </Tab>
</Tabs>

## Comportement à l’exécution

- Telegram est détenu par le processus Gateway.
- Le routage est déterministe : les entrants Telegram répondent sur Telegram (le modèle ne choisit pas les canaux).
- Les messages entrants sont normalisés dans l’enveloppe de canal partagée avec les métadonnées de réponse et les espaces réservés de médias.
- Les sessions de groupe sont isolées par ID de groupe. Les sujets de forum ajoutent `:topic:<threadId>` pour garder les sujets isolés.
- Les messages de MP peuvent porter `message_thread_id` ; OpenClaw préserve l’ID de fil pour les réponses, mais garde par défaut les MP sur la session plate. Configurez `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` ou une configuration de sujet correspondante lorsque vous voulez intentionnellement isoler les sessions de sujet en MP.
- L’interrogation longue utilise le runner grammY avec un séquencement par chat/par fil. La concurrence globale du collecteur du runner utilise `agents.defaults.maxConcurrent`.
- L’interrogation longue est protégée à l’intérieur de chaque processus Gateway afin qu’un seul poller actif puisse utiliser un jeton de bot à la fois. Si vous voyez encore des conflits `getUpdates` 409, un autre Gateway OpenClaw, script ou poller externe utilise probablement le même jeton.
- Les redémarrages du chien de garde d’interrogation longue se déclenchent par défaut après 120 secondes sans liveness `getUpdates` terminée. Augmentez `channels.telegram.pollingStallThresholdMs` uniquement si votre déploiement voit encore de faux redémarrages pour blocage d’interrogation pendant des travaux de longue durée. La valeur est en millisecondes et est autorisée de `30000` à `600000` ; les surcharges par compte sont prises en charge.
- L’API Bot Telegram ne prend pas en charge les accusés de lecture (`sendReadReceipts` ne s’applique pas).

## Référence des fonctionnalités

<AccordionGroup>
  <Accordion title="Aperçu du flux en direct (modifications de message)">
    OpenClaw peut diffuser des réponses partielles en temps réel :

    - chats directs : message d’aperçu + `editMessageText`
    - groupes/sujets : message d’aperçu + `editMessageText`

    Exigence :

    - `channels.telegram.streaming` vaut `off | partial | block | progress` (par défaut : `partial`)
    - `progress` correspond à `partial` sur Telegram (compatibilité avec la nomenclature inter-canaux)
    - `streaming.preview.toolProgress` contrôle si les mises à jour d’outil/progression réutilisent le même message d’aperçu modifié (par défaut : `true` lorsque le streaming d’aperçu est actif)
    - les anciens `channels.telegram.streamMode` et valeurs booléennes `streaming` sont détectés ; exécutez `openclaw doctor --fix` pour les migrer vers `channels.telegram.streaming.mode`

    Les mises à jour d’aperçu de progression d’outil sont les courtes lignes « Travail en cours... » affichées pendant l’exécution des outils, par exemple l’exécution de commandes, les lectures de fichiers, les mises à jour de planification ou les résumés de correctifs. Telegram les garde activées par défaut pour correspondre au comportement OpenClaw publié depuis `v2026.4.22` et versions ultérieures. Pour garder l’aperçu modifié pour le texte de réponse tout en masquant les lignes de progression d’outil, définissez :

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

    Utilisez `streaming.mode: "off"` uniquement lorsque vous voulez une livraison finale seule : les modifications d’aperçu Telegram sont désactivées et le bavardage générique des outils/de progression est supprimé au lieu d’être envoyé sous forme de messages autonomes « Working... ». Les invites d’approbation, les charges utiles multimédias et les erreurs passent toujours par la livraison finale normale. Utilisez `streaming.preview.toolProgress: false` lorsque vous voulez seulement conserver les modifications d’aperçu de réponse tout en masquant les lignes d’état de progression des outils.

    Pour les réponses uniquement textuelles :

    - aperçus courts en MP/groupe/sujet : OpenClaw conserve le même message d’aperçu et effectue une modification finale sur place
    - aperçus datant de plus d’environ une minute : OpenClaw envoie la réponse terminée comme nouveau message final, puis nettoie l’aperçu, afin que l’horodatage visible de Telegram reflète l’heure de fin plutôt que l’heure de création de l’aperçu

    Pour les réponses complexes (par exemple des charges utiles multimédias), OpenClaw revient à la livraison finale normale, puis nettoie le message d’aperçu.

    Le streaming d’aperçu est séparé du streaming par blocs. Lorsque le streaming par blocs est explicitement activé pour Telegram, OpenClaw ignore le flux d’aperçu afin d’éviter un double streaming.

    Flux de raisonnement propre à Telegram :

    - `/reasoning stream` envoie le raisonnement à l’aperçu en direct pendant la génération
    - la réponse finale est envoyée sans texte de raisonnement

  </Accordion>

  <Accordion title="Formatting and HTML fallback">
    Le texte sortant utilise Telegram `parse_mode: "HTML"`.

    - Le texte de type Markdown est rendu en HTML compatible avec Telegram.
    - Le HTML brut du modèle est échappé afin de réduire les échecs d’analyse Telegram.
    - Si Telegram rejette le HTML analysé, OpenClaw réessaie en texte brut.

    Les aperçus de liens sont activés par défaut et peuvent être désactivés avec `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Native commands and custom commands">
    L’enregistrement du menu de commandes Telegram est géré au démarrage avec `setMyCommands`.

    Valeurs par défaut des commandes natives :

    - `commands.native: "auto"` active les commandes natives pour Telegram

    Ajouter des entrées de menu de commandes personnalisées :

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

    - les noms sont normalisés (suppression du `/` initial, passage en minuscules)
    - motif valide : `a-z`, `0-9`, `_`, longueur `1..32`
    - les commandes personnalisées ne peuvent pas remplacer les commandes natives
    - les conflits/doublons sont ignorés et journalisés

    Notes :

    - les commandes personnalisées sont uniquement des entrées de menu ; elles n’implémentent pas automatiquement un comportement
    - les commandes de plugin/Skill peuvent toujours fonctionner lorsqu’elles sont saisies, même si elles ne sont pas affichées dans le menu Telegram

    Si les commandes natives sont désactivées, les commandes intégrées sont supprimées. Les commandes personnalisées/de plugin peuvent encore être enregistrées si elles sont configurées.

    Échecs de configuration courants :

    - `setMyCommands failed` avec `BOT_COMMANDS_TOO_MUCH` signifie que le menu Telegram déborde encore après réduction ; réduisez les commandes de plugin/Skill/personnalisées ou désactivez `channels.telegram.commands.native`.
    - L’échec de `deleteWebhook`, `deleteMyCommands` ou `setMyCommands` avec `404: Not Found` alors que les commandes curl directes de la Bot API fonctionnent peut signifier que `channels.telegram.apiRoot` a été défini sur le point de terminaison complet `/bot<TOKEN>`. `apiRoot` doit être uniquement la racine de la Bot API, et `openclaw doctor --fix` supprime un `/bot<TOKEN>` final accidentel.
    - `getMe returned 401` signifie que Telegram a rejeté le jeton de bot configuré. Mettez à jour `botToken`, `tokenFile` ou `TELEGRAM_BOT_TOKEN` avec le jeton BotFather actuel ; OpenClaw s’arrête avant le polling, ce qui évite que cela soit signalé comme un échec de nettoyage de Webhook.
    - `setMyCommands failed` avec des erreurs réseau/fetch signifie généralement que le DNS/HTTPS sortant vers `api.telegram.org` est bloqué.

    ### Commandes d’association d’appareil (plugin `device-pair`)

    Lorsque le plugin `device-pair` est installé :

    1. `/pair` génère un code de configuration
    2. collez le code dans l’application iOS
    3. `/pair pending` liste les demandes en attente (y compris rôle/périmètres)
    4. approuvez la demande :
       - `/pair approve <requestId>` pour une approbation explicite
       - `/pair approve` lorsqu’il n’y a qu’une seule demande en attente
       - `/pair approve latest` pour la plus récente

    Le code de configuration transporte un jeton d’amorçage à durée de vie courte. Le transfert d’amorçage intégré garde le jeton du nœud principal à `scopes: []` ; tout jeton opérateur transféré reste limité à `operator.approvals`, `operator.read`, `operator.talk.secrets` et `operator.write`. Les vérifications de périmètre d’amorçage sont préfixées par rôle, de sorte que cette liste d’autorisation d’opérateur ne satisfait que les demandes d’opérateur ; les rôles non opérateur ont toujours besoin de périmètres sous leur propre préfixe de rôle.

    Si un appareil réessaie avec des détails d’authentification modifiés (par exemple rôle/périmètres/clé publique), la demande en attente précédente est remplacée et la nouvelle demande utilise un `requestId` différent. Relancez `/pair pending` avant d’approuver.

    Plus de détails : [Association](/fr/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline buttons">
    Configurer la portée du clavier en ligne :

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

  <Accordion title="Telegram message actions for agents and automation">
    Les actions d’outil Telegram comprennent :

    - `sendMessage` (`to`, `content`, optionnel `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, optionnel `iconColor`, `iconCustomEmojiId`)

    Les actions de message de canal exposent des alias ergonomiques (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Contrôles de filtrage :

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (par défaut : désactivé)

    Remarque : `edit` et `topic-create` sont actuellement activés par défaut et ne disposent pas de bascules `channels.telegram.actions.*` distinctes.
    Les envois à l’exécution utilisent l’instantané actif de la configuration/des secrets (démarrage/rechargement), de sorte que les chemins d’action ne réévaluent pas les SecretRef de manière ponctuelle à chaque envoi.

    Sémantique de suppression des réactions : [/tools/reactions](/fr/tools/reactions)

  </Accordion>

  <Accordion title="Balises de fil de réponse">
    Telegram prend en charge les balises explicites de fil de réponse dans la sortie générée :

    - `[[reply_to_current]]` répond au message déclencheur
    - `[[reply_to:<id>]]` répond à un ID de message Telegram spécifique

    `channels.telegram.replyToMode` contrôle le traitement :

    - `off` (par défaut)
    - `first`
    - `all`

    Lorsque le fil de réponse est activé et que le texte ou la légende Telegram d’origine est disponible, OpenClaw inclut automatiquement un extrait de citation Telegram natif. Telegram limite le texte de citation natif à 1024 unités de code UTF-16 ; les messages plus longs sont donc cités depuis le début et reviennent à une réponse simple si Telegram rejette la citation.

    Remarque : `off` désactive le fil de réponse implicite. Les balises explicites `[[reply_to_*]]` restent prises en compte.

  </Accordion>

  <Accordion title="Sujets de forum et comportement des fils">
    Supergroupes de forum :

    - les clés de session de sujet ajoutent `:topic:<threadId>`
    - les réponses et l’indication de saisie ciblent le fil du sujet
    - chemin de configuration du sujet :
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Cas particulier du sujet général (`threadId=1`) :

    - les envois de message omettent `message_thread_id` (Telegram rejette `sendMessage(...thread_id=1)`)
    - les actions de saisie incluent toujours `message_thread_id`

    Héritage des sujets : les entrées de sujet héritent des paramètres du groupe sauf remplacement (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
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

    Chaque sujet possède ensuite sa propre clé de session : `agent:zu:telegram:group:-1001234567890:topic:3`

    **Liaison persistante de sujet ACP** : Les sujets de forum peuvent épingler des sessions de harnais ACP via des liaisons ACP typées de premier niveau (`bindings[]` avec `type: "acp"` et `match.channel: "telegram"`, `peer.kind: "group"`, et un identifiant qualifié par sujet comme `-1001234567890:topic:42`). Actuellement limité aux sujets de forum dans les groupes/supergroupes. Consultez [Agents ACP](/fr/tools/acp-agents).

    **Lancement d’ACP lié au fil depuis le chat** : `/acp spawn <agent> --thread here|auto` lie le sujet actuel à une nouvelle session ACP ; les messages de suivi y sont routés directement. OpenClaw épingle la confirmation de lancement dans le sujet. Nécessite que `channels.telegram.threadBindings.spawnSessions` reste activé (par défaut : `true`).

    Le contexte de modèle expose `MessageThreadId` et `IsForum`. Les chats en DM avec `message_thread_id` conservent par défaut le routage DM et les métadonnées de réponse sur des sessions plates ; ils n’utilisent des clés de session sensibles aux fils que lorsqu’ils sont configurés avec `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` ou une configuration de sujet correspondante. Utilisez `channels.telegram.dm.threadReplies` de premier niveau comme valeur par défaut du compte, ou `direct.<chatId>.threadReplies` pour un DM.

  </Accordion>

  <Accordion title="Audio, vidéo et stickers">
    ### Messages audio

    Telegram distingue les notes vocales des fichiers audio.

    - par défaut : comportement de fichier audio
    - balise `[[audio_as_voice]]` dans la réponse de l’agent pour forcer l’envoi d’une note vocale
    - les transcriptions de notes vocales entrantes sont encadrées comme du texte généré par machine,
      non fiable dans le contexte de l’agent ; la détection des mentions utilise toujours la transcription
      brute, afin que les messages vocaux conditionnés par mention continuent de fonctionner.

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

    Les stickers sont décrits une fois (lorsque c’est possible) et mis en cache afin de réduire les appels vision répétés.

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
    Les réactions Telegram arrivent sous forme de mises à jour `message_reaction` (distinctes des charges utiles des messages).

    Lorsqu’elles sont activées, OpenClaw met en file d’attente des événements système comme :

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuration :

    - `channels.telegram.reactionNotifications` : `off | own | all` (par défaut : `own`)
    - `channels.telegram.reactionLevel` : `off | ack | minimal | extensive` (par défaut : `minimal`)

    Notes :

    - `own` signifie uniquement les réactions des utilisateurs aux messages envoyés par le bot (au mieux, via le cache des messages envoyés).
    - Les événements de réaction respectent toujours les contrôles d’accès Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) ; les expéditeurs non autorisés sont ignorés.
    - Telegram ne fournit pas d’ID de fil dans les mises à jour de réaction.
      - les groupes hors forum sont routés vers la session de discussion de groupe
      - les groupes forum sont routés vers la session du sujet général du groupe (`:topic:1`), et non vers le sujet d’origine exact

    `allowed_updates` pour polling/webhook inclut automatiquement `message_reaction`.

  </Accordion>

  <Accordion title="Réactions d’accusé de réception">
    `ackReaction` envoie un emoji d’accusé de réception pendant qu’OpenClaw traite un message entrant.

    Ordre de résolution :

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - emoji de repli de l’identité de l’agent (`agents.list[].identity.emoji`, sinon "👀")

    Notes :

    - Telegram attend un emoji Unicode (par exemple "👀").
    - Utilisez `""` pour désactiver la réaction pour un canal ou un compte.

  </Accordion>

  <Accordion title="Écritures de configuration depuis les événements et commandes Telegram">
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

  <Accordion title="Long polling ou webhook">
    Le comportement par défaut est le long polling. Pour le mode webhook, définissez `channels.telegram.webhookUrl` et `channels.telegram.webhookSecret` ; `webhookPath`, `webhookHost`, `webhookPort` sont facultatifs (valeurs par défaut : `/telegram-webhook`, `127.0.0.1`, `8787`).

    L’écouteur local se lie à `127.0.0.1:8787`. Pour une entrée publique, placez soit un proxy inverse devant le port local, soit définissez intentionnellement `webhookHost: "0.0.0.0"`.

    Le mode webhook valide les protections de requête, le jeton secret Telegram et le corps JSON avant de renvoyer `200` à Telegram.
    OpenClaw traite ensuite la mise à jour de façon asynchrone via les mêmes files de bot par discussion/par sujet que celles utilisées par le long polling, afin que les tours d’agent lents ne bloquent pas l’ACK de livraison de Telegram.

  </Accordion>

  <Accordion title="Limites, nouvelle tentative et cibles CLI">
    - La valeur par défaut de `channels.telegram.textChunkLimit` est 4000.
    - `channels.telegram.chunkMode="newline"` privilégie les limites de paragraphe (lignes vides) avant le découpage par longueur.
    - `channels.telegram.mediaMaxMb` (par défaut 100) limite la taille des médias Telegram entrants et sortants.
    - `channels.telegram.timeoutSeconds` remplace le délai d’expiration du client API Telegram (s’il n’est pas défini, la valeur par défaut de grammY s’applique). Les clients bot plafonnent les valeurs configurées sous la garde de requête texte/saisie sortante de 60 secondes, afin que grammY n’interrompe pas la livraison visible des réponses avant que la garde de transport et le repli d’OpenClaw puissent s’exécuter. Le long polling utilise toujours une garde de requête `getUpdates` de 45 secondes afin que les polls inactifs ne soient pas abandonnés indéfiniment.
    - `channels.telegram.pollingStallThresholdMs` vaut `120000` par défaut ; ajustez entre `30000` et `600000` uniquement pour les redémarrages de polling bloqué faux positifs.
    - l’historique du contexte de groupe utilise `channels.telegram.historyLimit` ou `messages.groupChat.historyLimit` (par défaut 50) ; `0` désactive.
    - le contexte supplémentaire des réponses/citations/transferts est actuellement transmis tel que reçu.
    - Les listes d’autorisation Telegram contrôlent principalement qui peut déclencher l’agent, et ne constituent pas une limite complète de caviardage du contexte supplémentaire.
    - Contrôles de l’historique des DM :
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - La configuration `channels.telegram.retry` s’applique aux helpers d’envoi Telegram (CLI/outils/actions) pour les erreurs d’API sortantes récupérables. La livraison de la réponse finale entrante utilise aussi une nouvelle tentative safe-send bornée pour les échecs Telegram avant connexion, mais elle ne réessaie pas les enveloppes réseau ambiguës après envoi qui pourraient dupliquer des messages visibles.

    La cible d’envoi CLI peut être un ID de discussion numérique ou un nom d’utilisateur :

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

    Options de sondage propres à Telegram :

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` pour les sujets de forum (ou utilisez une cible `:topic:`)

    L’envoi Telegram prend aussi en charge :

    - `--presentation` avec des blocs `buttons` pour les claviers intégrés lorsque `channels.telegram.capabilities.inlineButtons` l’autorise
    - `--pin` ou `--delivery '{"pin":true}'` pour demander une livraison épinglée lorsque le bot peut épingler dans cette discussion
    - `--force-document` pour envoyer les images et GIF sortants comme documents plutôt que comme téléversements de photo compressée ou de média animé

    Contrôle des actions :

    - `channels.telegram.actions.sendMessage=false` désactive les messages Telegram sortants, y compris les sondages
    - `channels.telegram.actions.poll=false` désactive la création de sondages Telegram tout en laissant les envois normaux activés

  </Accordion>

  <Accordion title="Approbations exec dans Telegram">
    Telegram prend en charge les approbations exec dans les DM des approbateurs et peut éventuellement publier les invites dans la discussion ou le sujet d’origine. Les approbateurs doivent être des ID utilisateur Telegram numériques.

    Chemin de configuration :

    - `channels.telegram.execApprovals.enabled` (s’active automatiquement lorsqu’au moins un approbateur peut être résolu)
    - `channels.telegram.execApprovals.approvers` (se rabat sur les ID propriétaires numériques de `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target` : `dm` (par défaut) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` et `defaultTo` contrôlent qui peut parler au bot et où il envoie les réponses normales. Ils ne font pas de quelqu’un un approbateur exec. La première association DM approuvée initialise `commands.ownerAllowFrom` lorsqu’aucun propriétaire de commande n’existe encore, afin que la configuration avec un seul propriétaire fonctionne toujours sans dupliquer les ID sous `execApprovals.approvers`.

    La livraison au canal affiche le texte de la commande dans la discussion ; activez `channel` ou `both` uniquement dans des groupes/sujets de confiance. Lorsque l’invite arrive dans un sujet de forum, OpenClaw conserve le sujet pour l’invite d’approbation et le suivi. Les approbations exec expirent après 30 minutes par défaut.

    Les boutons d’approbation intégrés nécessitent aussi que `channels.telegram.capabilities.inlineButtons` autorise la surface cible (`dm`, `group` ou `all`). Les ID d’approbation préfixés par `plugin:` sont résolus via les approbations de plugins ; les autres sont d’abord résolus via les approbations exec.

    Voir [Approbations exec](/fr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Contrôles des réponses d’erreur

Lorsque l’agent rencontre une erreur de livraison ou de fournisseur, Telegram peut soit répondre avec le texte de l’erreur, soit la supprimer. Deux clés de configuration contrôlent ce comportement :

| Clé                                 | Valeurs           | Par défaut | Description                                                                                         |
| ----------------------------------- | ----------------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply` envoie un message d’erreur convivial à la discussion. `silent` supprime entièrement les réponses d’erreur. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`    | Délai minimal entre les réponses d’erreur à la même discussion. Évite le spam d’erreurs pendant les pannes. |

Les substitutions par compte, par groupe et par sujet sont prises en charge (même héritage que les autres clés de configuration Telegram).

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

    - Si `requireMention=false`, le mode confidentialité de Telegram doit autoriser une visibilité complète.
      - BotFather : `/setprivacy` -> Disable
      - puis supprimez et rajoutez le bot au groupe
    - `openclaw channels status` avertit lorsque la configuration attend des messages de groupe sans mention.
    - `openclaw channels status --probe` peut vérifier les ID de groupe numériques explicites ; le joker `"*"` ne peut pas être sondé pour l’appartenance.
    - test rapide de session : `/activation always`.

  </Accordion>

  <Accordion title="Le bot ne voit aucun message de groupe">

    - lorsque `channels.telegram.groups` existe, le groupe doit être listé (ou inclure `"*"`)
    - vérifiez l’appartenance du bot au groupe
    - examinez les journaux : `openclaw logs --follow` pour les raisons d’exclusion

  </Accordion>

  <Accordion title="Les commandes fonctionnent partiellement ou pas du tout">

    - autorisez votre identité d’expéditeur (association et/ou `allowFrom` numérique)
    - l’autorisation des commandes s’applique toujours même lorsque la stratégie de groupe est `open`
    - `setMyCommands failed` avec `BOT_COMMANDS_TOO_MUCH` signifie que le menu natif contient trop d’entrées ; réduisez les commandes de plugin/skill/personnalisées ou désactivez les menus natifs
    - les appels de démarrage `deleteMyCommands` / `setMyCommands` et les appels de saisie `sendChatAction` sont bornés et réessayés une fois via le repli de transport de Telegram en cas de délai d’expiration de requête. Les erreurs réseau/fetch persistantes indiquent généralement des problèmes d’accessibilité DNS/HTTPS vers `api.telegram.org`

  </Accordion>

  <Accordion title="Le démarrage signale un jeton non autorisé">

    - `getMe returned 401` est un échec d’authentification Telegram pour le jeton de bot configuré.
    - Recopiez ou régénérez le jeton du bot dans BotFather, puis mettez à jour `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` ou `TELEGRAM_BOT_TOKEN` pour le compte par défaut.
    - `deleteWebhook 401 Unauthorized` pendant le démarrage est aussi un échec d’authentification ; le traiter comme "aucun webhook n’existe" ne ferait que différer le même échec de mauvais jeton aux appels d’API ultérieurs.
    - Si `deleteWebhook` échoue avec une erreur réseau transitoire pendant le démarrage du polling, OpenClaw vérifie `getWebhookInfo` ; lorsque Telegram signale une URL de webhook vide, le polling continue parce que le nettoyage est déjà satisfait.

  </Accordion>

  <Accordion title="Instabilité du polling ou du réseau">

    - Node 22+ + fetch/proxy personnalisé peut déclencher un comportement d’abandon immédiat si les types AbortSignal ne correspondent pas.
    - Certains hôtes résolvent d’abord `api.telegram.org` en IPv6 ; une sortie IPv6 défectueuse peut provoquer des échecs intermittents de l’API Telegram.
    - Si les journaux contiennent `TypeError: fetch failed` ou `Network request for 'getUpdates' failed!`, OpenClaw les réessaie désormais comme des erreurs réseau récupérables.
    - Si les sockets Telegram sont recyclés selon une cadence fixe courte, vérifiez si `channels.telegram.timeoutSeconds` est faible ; les clients bot bornent les valeurs configurées sous les garde-fous des requêtes sortantes et `getUpdates`, mais les anciennes versions pouvaient abandonner chaque interrogation ou réponse lorsque ce paramètre était défini sous ces garde-fous.
    - Si les journaux contiennent `Polling stall detected`, OpenClaw redémarre l’interrogation et reconstruit le transport Telegram après 120 secondes sans activité de vivacité long-poll terminée par défaut.
    - `openclaw channels status --probe` et `openclaw doctor` avertissent lorsqu’un compte d’interrogation en cours d’exécution n’a pas terminé `getUpdates` après le délai de grâce au démarrage, lorsqu’un compte webhook en cours d’exécution n’a pas terminé `setWebhook` après le délai de grâce au démarrage, ou lorsque la dernière activité réussie du transport d’interrogation est périmée.
    - Augmentez `channels.telegram.pollingStallThresholdMs` uniquement lorsque les appels `getUpdates` de longue durée sont sains, mais que votre hôte signale encore à tort des redémarrages pour blocage d’interrogation. Les blocages persistants indiquent généralement des problèmes de proxy, DNS, IPv6 ou sortie TLS entre l’hôte et `api.telegram.org`.
    - Telegram respecte aussi les variables d’environnement de proxy du processus pour le transport Bot API, notamment `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` et leurs variantes en minuscules. `NO_PROXY` / `no_proxy` peuvent toujours contourner `api.telegram.org`.
    - Si le proxy géré par OpenClaw est configuré via `OPENCLAW_PROXY_URL` pour un environnement de service et qu’aucune variable d’environnement de proxy standard n’est présente, Telegram utilise aussi cette URL pour le transport Bot API.
    - Sur les hôtes VPS dont la sortie directe/TLS est instable, routez les appels de l’API Telegram via `channels.telegram.proxy` :

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ utilise par défaut `autoSelectFamily=true` (sauf WSL2). L’ordre des résultats DNS de Telegram respecte `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, puis `channels.telegram.network.dnsResultOrder`, puis la valeur par défaut du processus comme `NODE_OPTIONS=--dns-result-order=ipv4first` ; si aucun ne s’applique, Node 22+ revient à `ipv4first`.
    - Si votre hôte est WSL2 ou fonctionne explicitement mieux avec un comportement IPv4 uniquement, forcez la sélection de famille :

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Les réponses dans la plage de benchmark RFC 2544 (`198.18.0.0/15`) sont déjà autorisées
      par défaut pour les téléchargements de médias Telegram. Si un fake-IP ou
      un proxy transparent de confiance réécrit `api.telegram.org` vers une autre
      adresse privée/interne/à usage spécial pendant les téléchargements de médias, vous pouvez
      activer le contournement réservé à Telegram :

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - La même option d’activation est disponible par compte à
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Si votre proxy résout les hôtes de médias Telegram en `198.18.x.x`, laissez d’abord
      l’indicateur dangereux désactivé. Les médias Telegram autorisent déjà par défaut
      la plage de benchmark RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` affaiblit les
      protections SSRF des médias Telegram. Utilisez-le uniquement pour des environnements de proxy
      de confiance contrôlés par l’opérateur, tels que le routage fake-IP Clash, Mihomo ou Surge,
      lorsqu’ils synthétisent des réponses privées ou à usage spécial hors de la plage de benchmark
      RFC 2544. Laissez-le désactivé pour un accès Telegram normal via l’internet public.
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

Aide supplémentaire : [Dépannage des canaux](/fr/channels/troubleshooting).

## Référence de configuration

Référence principale : [Référence de configuration - Telegram](/fr/gateway/config-channels#telegram).

<Accordion title="High-signal Telegram fields">

- démarrage/authentification : `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` doit pointer vers un fichier ordinaire ; les liens symboliques sont rejetés)
- contrôle d’accès : `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de premier niveau (`type: "acp"`)
- approbations d’exécution : `execApprovals`, `accounts.*.execApprovals`
- commande/menu : `commands.native`, `commands.nativeSkills`, `customCommands`
- fils/réponses : `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming : `streaming` (aperçu), `streaming.preview.toolProgress`, `blockStreaming`
- formatage/livraison : `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- médias/réseau : `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- racine d’API personnalisée : `apiRoot` (racine Bot API uniquement ; n’incluez pas `/bot<TOKEN>`)
- webhook : `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- actions/capacités : `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- réactions : `reactionNotifications`, `reactionLevel`
- erreurs : `errorPolicy`, `errorCooldownMs`
- écritures/historique : `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Priorité multi-compte : lorsque deux ID de compte ou plus sont configurés, définissez `channels.telegram.defaultAccount` (ou incluez `channels.telegram.accounts.default`) pour rendre le routage par défaut explicite. Sinon, OpenClaw revient au premier ID de compte normalisé et `openclaw doctor` émet un avertissement. Les comptes nommés héritent de `channels.telegram.allowFrom` / `groupAllowFrom`, mais pas des valeurs `accounts.default.*`.
</Note>

## Connexe

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/fr/channels/pairing">
    Associer un utilisateur Telegram au Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/fr/channels/groups">
    Comportement de liste d’autorisation pour les groupes et sujets.
  </Card>
  <Card title="Channel routing" icon="route" href="/fr/channels/channel-routing">
    Router les messages entrants vers les agents.
  </Card>
  <Card title="Security" icon="shield" href="/fr/gateway/security">
    Modèle de menace et durcissement.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/fr/concepts/multi-agent">
    Associer les groupes et sujets aux agents.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics inter-canaux.
  </Card>
</CardGroup>
