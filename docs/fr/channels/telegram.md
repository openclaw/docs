---
read_when:
    - Travailler sur des fonctionnalités Telegram ou des Webhooks
summary: État de prise en charge du bot Telegram, capacités et configuration
title: Telegram
x-i18n:
    generated_at: "2026-04-30T07:15:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1ffc0c1a6bb94fbab81ede0f08b0e3a165f06c599d4d06d4b9e70c8ba41121f7
    source_path: channels/telegram.md
    workflow: 16
---

Prêt pour la production pour les DM de bot et les groupes via grammY. Le mode par défaut est le long polling ; le mode webhook est facultatif.

<CardGroup cols={3}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    La stratégie DM par défaut pour Telegram est l’appairage.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics inter-canaux et guides de réparation.
  </Card>
  <Card title="Configuration du Gateway" icon="settings" href="/fr/gateway/configuration">
    Modèles et exemples complets de configuration de canal.
  </Card>
</CardGroup>

## Configuration rapide

<Steps>
  <Step title="Créer le jeton du bot dans BotFather">
    Ouvrez Telegram et discutez avec **@BotFather** (vérifiez que l’identifiant est exactement `@BotFather`).

    Exécutez `/newbot`, suivez les invites, puis enregistrez le jeton.

  </Step>

  <Step title="Configurer le jeton et la stratégie DM">

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
    Telegram n’utilise **pas** `openclaw channels login telegram` ; configurez le jeton dans la config/l’env, puis démarrez le gateway.

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
L’ordre de résolution des jetons tient compte du compte. En pratique, les valeurs de configuration priment sur le repli env, et `TELEGRAM_BOT_TOKEN` s’applique uniquement au compte par défaut.
</Note>

## Paramètres côté Telegram

<AccordionGroup>
  <Accordion title="Mode confidentialité et visibilité des groupes">
    Les bots Telegram utilisent par défaut le **mode confidentialité**, qui limite les messages de groupe qu’ils reçoivent.

    Si le bot doit voir tous les messages de groupe, vous pouvez soit :

    - désactiver le mode confidentialité via `/setprivacy`, soit
    - faire du bot un administrateur du groupe.

    Lorsque vous activez ou désactivez le mode confidentialité, supprimez puis rajoutez le bot dans chaque groupe afin que Telegram applique la modification.

  </Accordion>

  <Accordion title="Autorisations de groupe">
    Le statut d’administrateur est contrôlé dans les paramètres du groupe Telegram.

    Les bots administrateurs reçoivent tous les messages de groupe, ce qui est utile pour un comportement de groupe toujours actif.

  </Accordion>

  <Accordion title="Options BotFather utiles">

    - `/setjoingroups` pour autoriser/refuser les ajouts aux groupes
    - `/setprivacy` pour le comportement de visibilité des groupes

  </Accordion>
</AccordionGroup>

## Contrôle d’accès et activation

<Tabs>
  <Tab title="Stratégie DM">
    `channels.telegram.dmPolicy` contrôle l’accès aux messages directs :

    - `pairing` (par défaut)
    - `allowlist` (requiert au moins un ID d’expéditeur dans `allowFrom`)
    - `open` (requiert que `allowFrom` inclue `"*"`)
    - `disabled`

    `dmPolicy: "open"` avec `allowFrom: ["*"]` permet à tout compte Telegram qui trouve ou devine le nom d’utilisateur du bot de commander le bot. Utilisez-le uniquement pour des bots volontairement publics avec des outils strictement restreints ; les bots à propriétaire unique devraient utiliser `allowlist` avec des ID utilisateur numériques.

    `channels.telegram.allowFrom` accepte les ID utilisateur Telegram numériques. Les préfixes `telegram:` / `tg:` sont acceptés et normalisés.
    Dans les configurations multi-comptes, un `channels.telegram.allowFrom` restrictif de premier niveau est traité comme une limite de sécurité : les entrées `allowFrom: ["*"]` au niveau du compte ne rendent pas ce compte public sauf si l’allowlist effective du compte contient toujours un joker explicite après fusion.
    `dmPolicy: "allowlist"` avec `allowFrom` vide bloque tous les DM et est rejeté par la validation de configuration.
    La configuration demande uniquement des ID utilisateur numériques.
    Si vous avez effectué une mise à niveau et que votre configuration contient des entrées d’allowlist `@username`, exécutez `openclaw doctor --fix` pour les résoudre (au mieux ; nécessite un jeton de bot Telegram).
    Si vous vous appuyiez auparavant sur des fichiers d’allowlist du stockage d’appairage, `openclaw doctor --fix` peut récupérer les entrées dans `channels.telegram.allowFrom` dans les flux allowlist (par exemple lorsque `dmPolicy: "allowlist"` n’a pas encore d’ID explicites).

    Pour les bots à propriétaire unique, préférez `dmPolicy: "allowlist"` avec des ID numériques `allowFrom` explicites afin de conserver une stratégie d’accès durable dans la configuration (au lieu de dépendre d’approbations d’appairage précédentes).

    Confusion fréquente : l’approbation d’appairage DM ne signifie pas « cet expéditeur est autorisé partout ».
    L’appairage accorde l’accès DM. Si aucun propriétaire de commande n’existe encore, le premier appairage approuvé définit aussi `commands.ownerAllowFrom` afin que les commandes réservées au propriétaire et les approbations d’exécution disposent d’un compte opérateur explicite.
    L’autorisation des expéditeurs de groupe provient toujours des allowlists de configuration explicites.
    Si vous voulez « je suis autorisé une fois et les DM comme les commandes de groupe fonctionnent », placez votre ID utilisateur Telegram numérique dans `channels.telegram.allowFrom` ; pour les commandes réservées au propriétaire, assurez-vous que `commands.ownerAllowFrom` contient `telegram:<your user id>`.

    ### Trouver votre ID utilisateur Telegram

    Plus sûr (sans bot tiers) :

    1. Envoyez un DM à votre bot.
    2. Exécutez `openclaw logs --follow`.
    3. Lisez `from.id`.

    Méthode officielle de l’API Bot :

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Méthode tierce (moins privée) : `@userinfobot` ou `@getidsbot`.

  </Tab>

  <Tab title="Stratégie de groupe et allowlists">
    Deux contrôles s’appliquent ensemble :

    1. **Quels groupes sont autorisés** (`channels.telegram.groups`)
       - pas de config `groups` :
         - avec `groupPolicy: "open"` : n’importe quel groupe peut passer les vérifications d’ID de groupe
         - avec `groupPolicy: "allowlist"` (par défaut) : les groupes sont bloqués jusqu’à ce que vous ajoutiez des entrées `groups` (ou `"*"`)
       - `groups` configuré : agit comme allowlist (ID explicites ou `"*"`)

    2. **Quels expéditeurs sont autorisés dans les groupes** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (par défaut)
       - `disabled`

    `groupAllowFrom` est utilisé pour filtrer les expéditeurs de groupe. S’il n’est pas défini, Telegram se replie sur `allowFrom`.
    Les entrées `groupAllowFrom` doivent être des ID utilisateur Telegram numériques (les préfixes `telegram:` / `tg:` sont normalisés).
    Ne placez pas d’ID de chat de groupe ou de supergroupe Telegram dans `groupAllowFrom`. Les ID de chat négatifs doivent aller sous `channels.telegram.groups`.
    Les entrées non numériques sont ignorées pour l’autorisation des expéditeurs.
    Limite de sécurité (`2026.2.25+`) : l’authentification des expéditeurs de groupe n’hérite **pas** des approbations du stockage d’appairage DM.
    L’appairage reste réservé aux DM. Pour les groupes, définissez `groupAllowFrom` ou `allowFrom` par groupe/sujet.
    Si `groupAllowFrom` n’est pas défini, Telegram se replie sur la config `allowFrom`, pas sur le stockage d’appairage.
    Modèle pratique pour les bots à propriétaire unique : définissez votre ID utilisateur dans `channels.telegram.allowFrom`, laissez `groupAllowFrom` non défini, puis autorisez les groupes cibles sous `channels.telegram.groups`.
    Note d’exécution : si `channels.telegram` est complètement absent, l’exécution se ferme par défaut avec `groupPolicy="allowlist"` sauf si `channels.defaults.groupPolicy` est explicitement défini.

    Exemple : autoriser tout membre dans un groupe spécifique :

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
      Erreur fréquente : `groupAllowFrom` n’est pas une allowlist de groupes Telegram.

      - Placez les ID de chat de groupe ou de supergroupe Telegram négatifs comme `-1001234567890` sous `channels.telegram.groups`.
      - Placez les ID utilisateur Telegram comme `8734062810` sous `groupAllowFrom` lorsque vous voulez limiter quelles personnes dans un groupe autorisé peuvent déclencher le bot.
      - Utilisez `groupAllowFrom: ["*"]` uniquement lorsque vous voulez que tout membre d’un groupe autorisé puisse parler au bot.

    </Warning>

  </Tab>

  <Tab title="Comportement des mentions">
    Les réponses de groupe nécessitent une mention par défaut.

    La mention peut provenir :

    - d’une mention native `@botusername`, ou
    - de modèles de mention dans :
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Bascules de commande au niveau de la session :

    - `/activation always`
    - `/activation mention`

    Elles mettent uniquement à jour l’état de session. Utilisez la configuration pour la persistance.

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

- Telegram est géré par le processus gateway.
- Le routage est déterministe : les messages entrants Telegram répondent vers Telegram (le modèle ne choisit pas les canaux).
- Les messages entrants sont normalisés dans l’enveloppe de canal partagée avec les métadonnées de réponse et les placeholders de médias.
- Les sessions de groupe sont isolées par ID de groupe. Les sujets de forum ajoutent `:topic:<threadId>` pour garder les sujets isolés.
- Les messages DM peuvent transporter `message_thread_id` ; OpenClaw les route avec des clés de session tenant compte du fil et préserve l’ID de fil pour les réponses.
- Le long polling utilise le runner grammY avec un séquencement par chat/par fil. La concurrence globale du sink du runner utilise `agents.defaults.maxConcurrent`.
- Le long polling est protégé dans chaque processus gateway afin qu’un seul poller actif puisse utiliser un jeton de bot à la fois. Si vous voyez encore des conflits `getUpdates` 409, un autre gateway OpenClaw, script ou poller externe utilise probablement le même jeton.
- Les redémarrages déclenchés par le watchdog de long polling se produisent par défaut après 120 secondes sans activité `getUpdates` terminée. Augmentez `channels.telegram.pollingStallThresholdMs` uniquement si votre déploiement observe encore de faux redémarrages pour blocage de polling pendant des travaux de longue durée. La valeur est en millisecondes et autorisée de `30000` à `600000` ; les remplacements par compte sont pris en charge.
- L’API Bot Telegram ne prend pas en charge les accusés de lecture (`sendReadReceipts` ne s’applique pas).

## Référence des fonctionnalités

<AccordionGroup>
  <Accordion title="Aperçu du flux en direct (modifications de message)">
    OpenClaw peut diffuser des réponses partielles en temps réel :

    - discussions directes : message d’aperçu + `editMessageText`
    - groupes/sujets : message d’aperçu + `editMessageText`

    Exigence :

    - `channels.telegram.streaming` vaut `off | partial | block | progress` (par défaut : `partial`)
    - `progress` correspond à `partial` sur Telegram (compatibilité avec le nommage inter-canaux)
    - `streaming.preview.toolProgress` contrôle si les mises à jour d’outil/progression réutilisent le même message d’aperçu modifié (par défaut : `true` lorsque le streaming d’aperçu est actif)
    - les anciens `channels.telegram.streamMode` et les valeurs booléennes `streaming` sont détectés ; exécutez `openclaw doctor --fix` pour les migrer vers `channels.telegram.streaming.mode`

    Les mises à jour d’aperçu de progression des outils sont les courtes lignes « Working... » affichées pendant l’exécution des outils, par exemple l’exécution de commandes, les lectures de fichiers, les mises à jour de planification ou les résumés de patch. Telegram les garde activées par défaut pour correspondre au comportement publié d’OpenClaw à partir de `v2026.4.22`. Pour conserver l’aperçu modifié pour le texte de réponse tout en masquant les lignes de progression des outils, définissez :

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

    Utilisez `streaming.mode: "off"` uniquement lorsque vous voulez une livraison finale uniquement : les modifications d’aperçu Telegram sont désactivées et le bavardage générique d’outil/progression est supprimé au lieu d’être envoyé comme messages autonomes « Working... ». Les invites d’approbation, les charges utiles média et les erreurs continuent de passer par la livraison finale normale. Utilisez `streaming.preview.toolProgress: false` lorsque vous voulez seulement conserver les modifications d’aperçu de réponse tout en masquant les lignes d’état de progression des outils.

    Pour les réponses texte uniquement :

    - aperçus courts de MP/groupe/sujet : OpenClaw conserve le même message d’aperçu et effectue une modification finale sur place
    - aperçus datant de plus d’environ une minute : OpenClaw envoie la réponse terminée comme nouveau message final, puis nettoie l’aperçu, afin que l’horodatage visible de Telegram reflète l’heure d’achèvement plutôt que l’heure de création de l’aperçu

    Pour les réponses complexes (par exemple les charges utiles multimédias), OpenClaw revient à une livraison finale normale, puis nettoie le message d’aperçu.

    Le streaming d’aperçu est distinct du streaming par blocs. Lorsque le streaming par blocs est explicitement activé pour Telegram, OpenClaw ignore le flux d’aperçu afin d’éviter un double streaming.

    Si le transport natif de brouillon est indisponible ou rejeté, OpenClaw revient automatiquement à `sendMessage` + `editMessageText`.

    Flux de raisonnement propre à Telegram :

    - `/reasoning stream` envoie le raisonnement à l’aperçu en direct pendant la génération
    - la réponse finale est envoyée sans texte de raisonnement

  </Accordion>

  <Accordion title="Formatage et repli HTML">
    Le texte sortant utilise Telegram `parse_mode: "HTML"`.

    - Le texte de type Markdown est rendu en HTML sûr pour Telegram.
    - Le HTML brut du modèle est échappé afin de réduire les échecs d’analyse de Telegram.
    - Si Telegram rejette le HTML analysé, OpenClaw réessaie en texte brut.

    Les aperçus de liens sont activés par défaut et peuvent être désactivés avec `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Commandes natives et commandes personnalisées">
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

    - les noms sont normalisés (suppression du `/` initial, minuscules)
    - motif valide : `a-z`, `0-9`, `_`, longueur `1..32`
    - les commandes personnalisées ne peuvent pas remplacer les commandes natives
    - les conflits/doublons sont ignorés et journalisés

    Notes :

    - les commandes personnalisées sont uniquement des entrées de menu ; elles n’implémentent pas automatiquement un comportement
    - les commandes Plugin/Skills peuvent toujours fonctionner lorsqu’elles sont saisies, même si elles ne sont pas affichées dans le menu Telegram

    Si les commandes natives sont désactivées, les commandes intégrées sont supprimées. Les commandes personnalisées/Plugin peuvent toujours s’enregistrer si elles sont configurées.

    Échecs de configuration courants :

    - `setMyCommands failed` avec `BOT_COMMANDS_TOO_MUCH` signifie que le menu Telegram déborde encore après réduction ; réduisez les commandes Plugin/Skills/personnalisées ou désactivez `channels.telegram.commands.native`.
    - L’échec de `deleteWebhook`, `deleteMyCommands` ou `setMyCommands` avec `404: Not Found` alors que les commandes curl directes de l’API Bot fonctionnent peut signifier que `channels.telegram.apiRoot` a été défini sur le point de terminaison complet `/bot<TOKEN>`. `apiRoot` doit être uniquement la racine de l’API Bot, et `openclaw doctor --fix` supprime un suffixe `/bot<TOKEN>` accidentel.
    - `getMe returned 401` signifie que Telegram a rejeté le jeton de bot configuré. Mettez à jour `botToken`, `tokenFile` ou `TELEGRAM_BOT_TOKEN` avec le jeton BotFather actuel ; OpenClaw s’arrête avant l’interrogation, ce qui évite de le signaler comme un échec de nettoyage de Webhook.
    - `setMyCommands failed` avec des erreurs réseau/fetch signifie généralement que le DNS/HTTPS sortant vers `api.telegram.org` est bloqué.

    ### Commandes d’appairage d’appareil (Plugin `device-pair`)

    Lorsque le Plugin `device-pair` est installé :

    1. `/pair` génère un code de configuration
    2. collez le code dans l’app iOS
    3. `/pair pending` liste les demandes en attente (rôle/portées inclus)
    4. approuvez la demande :
       - `/pair approve <requestId>` pour une approbation explicite
       - `/pair approve` lorsqu’il n’y a qu’une seule demande en attente
       - `/pair approve latest` pour la plus récente

    Le code de configuration transporte un jeton d’amorçage de courte durée. Le transfert d’amorçage intégré conserve le jeton du nœud principal à `scopes: []` ; tout jeton opérateur transféré reste limité à `operator.approvals`, `operator.read`, `operator.talk.secrets` et `operator.write`. Les vérifications de portée d’amorçage sont préfixées par rôle, de sorte que cette liste d’autorisation opérateur ne satisfait que les demandes opérateur ; les rôles non opérateur ont toujours besoin de portées sous leur propre préfixe de rôle.

    Si un appareil réessaie avec des détails d’authentification modifiés (par exemple rôle/portées/clé publique), la demande précédente en attente est remplacée et la nouvelle demande utilise un `requestId` différent. Relancez `/pair pending` avant d’approuver.

    Plus de détails : [Appairage](/fr/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Boutons intégrés">
    Configurer la portée du clavier intégré :

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

    Les clics de rappel sont transmis à l’agent comme texte :
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Actions de messages Telegram pour les agents et l’automatisation">
    Les actions d’outil Telegram incluent :

    - `sendMessage` (`to`, `content`, `mediaUrl` facultatif, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, `iconColor` facultatif, `iconCustomEmojiId`)

    Les actions de message de canal exposent des alias ergonomiques (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Contrôles d’accès :

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (par défaut : désactivé)

    Note : `edit` et `topic-create` sont actuellement activés par défaut et n’ont pas de bascules `channels.telegram.actions.*` séparées.
    Les envois d’exécution utilisent l’instantané de configuration/secrets actif (démarrage/rechargement), donc les chemins d’action n’effectuent pas de nouvelle résolution SecretRef ad hoc à chaque envoi.

    Sémantique de suppression des réactions : [/tools/reactions](/fr/tools/reactions)

  </Accordion>

  <Accordion title="Balises de fil de réponse">
    Telegram prend en charge les balises explicites de fil de réponse dans la sortie générée :

    - `[[reply_to_current]]` répond au message déclencheur
    - `[[reply_to:<id>]]` répond à un ID de message Telegram spécifique

    `channels.telegram.replyToMode` contrôle la gestion :

    - `off` (par défaut)
    - `first`
    - `all`

    Lorsque le fil de réponse est activé et que le texte ou la légende Telegram d’origine est disponible, OpenClaw inclut automatiquement un extrait de citation natif Telegram. Telegram limite le texte de citation natif à 1024 unités de code UTF-16 ; les messages plus longs sont donc cités depuis le début et reviennent à une réponse simple si Telegram rejette la citation.

    Note : `off` désactive le fil de réponse implicite. Les balises explicites `[[reply_to_*]]` sont toujours respectées.

  </Accordion>

  <Accordion title="Sujets de forum et comportement des fils">
    Supergroupes de forum :

    - les clés de session de sujet ajoutent `:topic:<threadId>`
    - les réponses et l’indication de saisie ciblent le fil du sujet
    - chemin de configuration du sujet :
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Cas particulier du sujet Général (`threadId=1`) :

    - les envois de messages omettent `message_thread_id` (Telegram rejette `sendMessage(...thread_id=1)`)
    - les actions de saisie incluent toujours `message_thread_id`

    Héritage des sujets : les entrées de sujet héritent des paramètres du groupe sauf remplacement (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
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

    **Liaison persistante de sujet ACP** : les sujets de forum peuvent épingler des sessions de harnais ACP via des liaisons ACP typées de niveau supérieur (`bindings[]` avec `type: "acp"` et `match.channel: "telegram"`, `peer.kind: "group"`, ainsi qu’un identifiant qualifié par sujet comme `-1001234567890:topic:42`). Actuellement limité aux sujets de forum dans les groupes/supergroupes. Voir [Agents ACP](/fr/tools/acp-agents).

    **Création ACP liée au fil depuis le chat** : `/acp spawn <agent> --thread here|auto` lie le sujet actuel à une nouvelle session ACP ; les suivis y sont routés directement. OpenClaw épingle la confirmation de création dans le sujet. Nécessite `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Le contexte de modèle expose `MessageThreadId` et `IsForum`. Les discussions MP avec `message_thread_id` conservent le routage MP mais utilisent des clés de session sensibles au fil.

  </Accordion>

  <Accordion title="Audio, vidéo et stickers">
    ### Messages audio

    Telegram distingue les notes vocales des fichiers audio.

    - par défaut : comportement de fichier audio
    - balise `[[audio_as_voice]]` dans la réponse de l’agent pour forcer l’envoi comme note vocale
    - les transcriptions de notes vocales entrantes sont encadrées comme du texte généré par machine,
      non fiable dans le contexte de l’agent ; la détection de mention utilise toujours la transcription
      brute afin que les messages vocaux soumis à mention continuent de fonctionner.

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

    Les stickers sont décrits une fois (lorsque possible) et mis en cache pour réduire les appels vision répétés.

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

    Rechercher dans les stickers mis en cache :

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

    - `own` désigne uniquement les réactions des utilisateurs aux messages envoyés par le bot (au mieux, via le cache des messages envoyés).
    - Les événements de réaction respectent toujours les contrôles d’accès Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) ; les expéditeurs non autorisés sont ignorés.
    - Telegram ne fournit pas d’ID de fil dans les mises à jour de réactions.
      - les groupes hors forum sont routés vers la session de discussion de groupe
      - les groupes de forum sont routés vers la session du sujet général du groupe (`:topic:1`), pas vers le sujet d’origine exact

    `allowed_updates` pour le polling/webhook inclut automatiquement `message_reaction`.

  </Accordion>

  <Accordion title="Réactions d’accusé de réception">
    `ackReaction` envoie un emoji d’accusé de réception pendant qu’OpenClaw traite un message entrant.

    Ordre de résolution :

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - repli sur l’emoji d’identité de l’agent (`agents.list[].identity.emoji`, sinon "👀")

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

  <Accordion title="Long polling ou webhook">
    Le mode par défaut est le long polling. Pour le mode webhook, définissez `channels.telegram.webhookUrl` et `channels.telegram.webhookSecret` ; `webhookPath`, `webhookHost`, `webhookPort` sont facultatifs (valeurs par défaut : `/telegram-webhook`, `127.0.0.1`, `8787`).

    L’écouteur local se lie à `127.0.0.1:8787`. Pour une entrée publique, placez un proxy inverse devant le port local ou définissez intentionnellement `webhookHost: "0.0.0.0"`.

    Le mode Webhook valide les protections de requête, le jeton secret Telegram et le corps JSON avant de renvoyer `200` à Telegram.
    OpenClaw traite ensuite la mise à jour de façon asynchrone via les mêmes files de bot par discussion/par sujet que le long polling, de sorte que les tours d’agent lents ne bloquent pas l’ACK de livraison de Telegram.

  </Accordion>

  <Accordion title="Limites, nouvelle tentative et cibles CLI">
    - La valeur par défaut de `channels.telegram.textChunkLimit` est 4000.
    - `channels.telegram.chunkMode="newline"` privilégie les limites de paragraphe (lignes vides) avant le découpage par longueur.
    - `channels.telegram.mediaMaxMb` (100 par défaut) limite la taille des médias Telegram entrants et sortants.
    - `channels.telegram.timeoutSeconds` remplace le délai d’expiration du client d’API Telegram (si non défini, la valeur par défaut de grammY s’applique).
    - `channels.telegram.pollingStallThresholdMs` vaut par défaut `120000` ; ajustez-le entre `30000` et `600000` uniquement pour les redémarrages de polling bloqué faussement positifs.
    - l’historique du contexte de groupe utilise `channels.telegram.historyLimit` ou `messages.groupChat.historyLimit` (50 par défaut) ; `0` le désactive.
    - le contexte supplémentaire de réponse/citation/transfert est actuellement transmis tel que reçu.
    - les listes d’autorisation Telegram contrôlent principalement qui peut déclencher l’agent, pas une limite complète de caviardage du contexte supplémentaire.
    - Contrôles de l’historique des DM :
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - La configuration `channels.telegram.retry` s’applique aux assistants d’envoi Telegram (CLI/outils/actions) pour les erreurs d’API sortantes récupérables. La livraison de la réponse finale entrante utilise aussi une nouvelle tentative bornée d’envoi sûr pour les échecs Telegram avant connexion, mais elle ne retente pas les enveloppes réseau ambiguës après envoi qui pourraient dupliquer des messages visibles.

    La cible d’envoi CLI peut être un ID numérique de discussion ou un nom d’utilisateur :

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

    - `--presentation` avec des blocs `buttons` pour les claviers en ligne lorsque `channels.telegram.capabilities.inlineButtons` l’autorise
    - `--pin` ou `--delivery '{"pin":true}'` pour demander une livraison épinglée lorsque le bot peut épingler dans cette discussion
    - `--force-document` pour envoyer les images et GIF sortants sous forme de documents au lieu d’imports de photo compressée ou de média animé

    Contrôle des actions :

    - `channels.telegram.actions.sendMessage=false` désactive les messages Telegram sortants, y compris les sondages
    - `channels.telegram.actions.poll=false` désactive la création de sondages Telegram tout en laissant les envois standard activés

  </Accordion>

  <Accordion title="Approbations d’exécution dans Telegram">
    Telegram prend en charge les approbations d’exécution dans les DM des approbateurs et peut éventuellement publier les invites dans la discussion ou le sujet d’origine. Les approbateurs doivent être des ID utilisateur Telegram numériques.

    Chemin de configuration :

    - `channels.telegram.execApprovals.enabled` (s’active automatiquement lorsqu’au moins un approbateur est résoluble)
    - `channels.telegram.execApprovals.approvers` (se replie sur les ID numériques des propriétaires depuis `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target` : `dm` (par défaut) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` et `defaultTo` contrôlent qui peut parler au bot et où il envoie les réponses normales. Ils ne font de personne un approbateur d’exécution. Le premier appairage DM approuvé initialise `commands.ownerAllowFrom` lorsqu’aucun propriétaire de commande n’existe encore, donc la configuration à propriétaire unique fonctionne toujours sans dupliquer les ID sous `execApprovals.approvers`.

    La livraison sur canal affiche le texte de commande dans la discussion ; n’activez `channel` ou `both` que dans des groupes/sujets de confiance. Lorsque l’invite arrive dans un sujet de forum, OpenClaw conserve le sujet pour l’invite d’approbation et le suivi. Les approbations d’exécution expirent après 30 minutes par défaut.

    Les boutons d’approbation en ligne nécessitent aussi que `channels.telegram.capabilities.inlineButtons` autorise la surface cible (`dm`, `group` ou `all`). Les ID d’approbation préfixés par `plugin:` sont résolus via les approbations de plugin ; les autres sont d’abord résolus via les approbations d’exécution.

    Voir [Approbations d’exécution](/fr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Contrôles des réponses d’erreur

Lorsque l’agent rencontre une erreur de livraison ou de fournisseur, Telegram peut soit répondre avec le texte de l’erreur, soit le supprimer. Deux clés de configuration contrôlent ce comportement :

| Clé                                 | Valeurs           | Par défaut | Description                                                                                                             |
| ----------------------------------- | ----------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply` envoie un message d’erreur convivial dans la discussion. `silent` supprime entièrement les réponses d’erreur. |
| `channels.telegram.errorCooldownMs` | nombre (ms)       | `60000`    | Temps minimal entre deux réponses d’erreur à la même discussion. Empêche le spam d’erreurs pendant les pannes.          |

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

    - Si `requireMention=false`, le mode de confidentialité Telegram doit autoriser une visibilité complète.
      - BotFather : `/setprivacy` -> Désactiver
      - puis supprimez et rajoutez le bot au groupe
    - `openclaw channels status` avertit lorsque la configuration attend des messages de groupe sans mention.
    - `openclaw channels status --probe` peut vérifier des ID de groupe numériques explicites ; le caractère générique `"*"` ne peut pas être vérifié par appartenance.
    - test rapide de session : `/activation always`.

  </Accordion>

  <Accordion title="Le bot ne voit aucun message de groupe">

    - lorsque `channels.telegram.groups` existe, le groupe doit être listé (ou inclure `"*"`)
    - vérifiez l’appartenance du bot au groupe
    - consultez les journaux : `openclaw logs --follow` pour les raisons d’omission

  </Accordion>

  <Accordion title="Les commandes fonctionnent partiellement ou pas du tout">

    - autorisez votre identité d’expéditeur (appairage et/ou `allowFrom` numérique)
    - l’autorisation des commandes s’applique toujours même lorsque la politique de groupe est `open`
    - `setMyCommands failed` avec `BOT_COMMANDS_TOO_MUCH` signifie que le menu natif comporte trop d’entrées ; réduisez les commandes de plugin/skill/personnalisées ou désactivez les menus natifs
    - les appels de démarrage `deleteMyCommands` / `setMyCommands` sont bornés et retentent une fois via le repli de transport de Telegram en cas d’expiration de requête. Les erreurs réseau/fetch persistantes indiquent généralement des problèmes de joignabilité DNS/HTTPS vers `api.telegram.org`

  </Accordion>

  <Accordion title="Le démarrage signale un jeton non autorisé">

    - `getMe returned 401` est un échec d’authentification Telegram pour le jeton de bot configuré.
    - Recopiez ou régénérez le jeton du bot dans BotFather, puis mettez à jour `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` ou `TELEGRAM_BOT_TOKEN` pour le compte par défaut.
    - `deleteWebhook 401 Unauthorized` pendant le démarrage est aussi un échec d’authentification ; le traiter comme « aucun webhook n’existe » ne ferait que reporter le même échec de mauvais jeton aux appels d’API ultérieurs.
    - Si `deleteWebhook` échoue avec une erreur réseau transitoire pendant le démarrage du polling, OpenClaw vérifie `getWebhookInfo` ; lorsque Telegram signale une URL de webhook vide, le polling continue parce que le nettoyage est déjà satisfait.

  </Accordion>

  <Accordion title="Instabilité du polling ou du réseau">

    - Node 22+ + fetch/proxy personnalisé peut déclencher un comportement d’abandon immédiat si les types AbortSignal ne correspondent pas.
    - Certains hôtes résolvent d’abord `api.telegram.org` en IPv6 ; une sortie IPv6 défectueuse peut provoquer des échecs intermittents de l’API Telegram.
    - Si les journaux incluent `TypeError: fetch failed` ou `Network request for 'getUpdates' failed!`, OpenClaw réessaie désormais ces erreurs comme des erreurs réseau récupérables.
    - Si les journaux incluent `Polling stall detected`, OpenClaw redémarre le polling et reconstruit le transport Telegram après 120 secondes sans vivacité long-poll terminée, par défaut.
    - `openclaw channels status --probe` et `openclaw doctor` avertissent lorsqu’un compte en polling actif n’a pas terminé `getUpdates` après la période de grâce au démarrage, lorsqu’un compte webhook actif n’a pas terminé `setWebhook` après la période de grâce au démarrage, ou lorsque la dernière activité réussie du transport de polling est obsolète.
    - Augmentez `channels.telegram.pollingStallThresholdMs` uniquement lorsque les appels `getUpdates` de longue durée sont sains, mais que votre hôte signale encore à tort des redémarrages pour blocage du polling. Les blocages persistants indiquent généralement des problèmes de proxy, DNS, IPv6 ou de sortie TLS entre l’hôte et `api.telegram.org`.
    - Telegram respecte aussi les variables d’environnement de proxy du processus pour le transport de l’API Bot, notamment `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` et leurs variantes en minuscules. `NO_PROXY` / `no_proxy` peut toujours contourner `api.telegram.org`.
    - Si le proxy géré par OpenClaw est configuré via `OPENCLAW_PROXY_URL` pour un environnement de service et qu’aucune variable d’environnement de proxy standard n’est présente, Telegram utilise aussi cette URL pour le transport de l’API Bot.
    - Sur les hôtes VPS avec une sortie directe/TLS instable, acheminez les appels à l’API Telegram via `channels.telegram.proxy` :

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

    - Les réponses dans la plage de référence RFC 2544 (`198.18.0.0/15`) sont déjà autorisées
      par défaut pour les téléchargements de médias Telegram. Si un proxy fake-IP ou
      transparent de confiance réécrit `api.telegram.org` vers une autre adresse
      privée/interne/à usage spécial pendant les téléchargements de médias, vous pouvez
      activer le contournement propre à Telegram :

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - La même activation est disponible par compte à
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Si votre proxy résout les hôtes de médias Telegram en `198.18.x.x`, laissez d’abord
      l’indicateur dangereux désactivé. Les médias Telegram autorisent déjà la plage
      de référence RFC 2544 par défaut.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` affaiblit les protections SSRF
      des médias Telegram. Utilisez-le uniquement pour des environnements de proxy de confiance
      contrôlés par l’opérateur, tels que le routage fake-IP Clash, Mihomo ou Surge, lorsqu’ils
      synthétisent des réponses privées ou à usage spécial en dehors de la plage de référence
      RFC 2544. Laissez-le désactivé pour un accès Telegram normal sur l’internet public.
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

Aide supplémentaire : [dépannage des canaux](/fr/channels/troubleshooting).

## Référence de configuration

Référence principale : [Référence de configuration - Telegram](/fr/gateway/config-channels#telegram).

<Accordion title="Champs Telegram à fort signal">

- démarrage/authentification : `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` doit pointer vers un fichier ordinaire ; les liens symboliques sont rejetés)
- contrôle d’accès : `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de premier niveau (`type: "acp"`)
- approbations d’exécution : `execApprovals`, `accounts.*.execApprovals`
- commande/menu : `commands.native`, `commands.nativeSkills`, `customCommands`
- fils/réponses : `replyToMode`
- streaming : `streaming` (aperçu), `streaming.preview.toolProgress`, `blockStreaming`
- formatage/livraison : `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- médias/réseau : `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- racine d’API personnalisée : `apiRoot` (racine de l’API Bot uniquement ; n’incluez pas `/bot<TOKEN>`)
- webhook : `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- actions/capacités : `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- réactions : `reactionNotifications`, `reactionLevel`
- erreurs : `errorPolicy`, `errorCooldownMs`
- écritures/historique : `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Priorité multi-comptes : lorsque deux ID de compte ou plus sont configurés, définissez `channels.telegram.defaultAccount` (ou incluez `channels.telegram.accounts.default`) pour rendre le routage par défaut explicite. Sinon, OpenClaw se rabat sur le premier ID de compte normalisé et `openclaw doctor` avertit. Les comptes nommés héritent de `channels.telegram.allowFrom` / `groupAllowFrom`, mais pas des valeurs `accounts.default.*`.
</Note>

## Connexe

<CardGroup cols={2}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    Appairez un utilisateur Telegram au Gateway.
  </Card>
  <Card title="Groupes" icon="users" href="/fr/channels/groups">
    Comportement des listes d’autorisation de groupes et de sujets.
  </Card>
  <Card title="Routage des canaux" icon="route" href="/fr/channels/channel-routing">
    Acheminez les messages entrants vers les agents.
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
