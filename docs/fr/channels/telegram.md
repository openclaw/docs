---
read_when:
    - Travailler sur les fonctionnalités Telegram ou les Webhook
summary: État de la prise en charge, fonctionnalités et configuration du bot Telegram
title: Telegram
x-i18n:
    generated_at: "2026-06-27T17:12:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f05ee57f06fe3b1c42ca19204bf74685ca3f05b1f02b9a6e36a7986e298b7edc
    source_path: channels/telegram.md
    workflow: 16
---

Prêt pour la production pour les messages privés et les groupes de bots via grammY. Le mode d’interrogation longue est le mode par défaut ; le mode Webhook est facultatif.

<CardGroup cols={3}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    La politique de messages privés par défaut pour Telegram est l’appairage.
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
    Ouvrez Telegram et discutez avec **@BotFather** (vérifiez que l’identifiant est exactement `@BotFather`).

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

    Repli par variable d’environnement : `TELEGRAM_BOT_TOKEN=...` (compte par défaut uniquement).
    Telegram n’utilise **pas** `openclaw channels login telegram` ; configurez le jeton dans la configuration ou l’environnement, puis démarrez le Gateway.

  </Step>

  <Step title="Démarrer le Gateway et approuver le premier message privé">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Les codes d’appairage expirent au bout de 1 heure.

  </Step>

  <Step title="Ajouter le bot à un groupe">
    Ajoutez le bot à votre groupe, puis récupérez les deux ID nécessaires à l’accès au groupe :

    - votre ID utilisateur Telegram, utilisé dans `allowFrom` / `groupAllowFrom`
    - l’ID de discussion du groupe Telegram, utilisé comme clé sous `channels.telegram.groups`

    Pour une première configuration, récupérez l’ID de discussion du groupe depuis `openclaw logs --follow`, un bot d’ID transféré ou `getUpdates` de l’API Bot. Une fois le groupe autorisé, `/whoami@<bot_username>` peut confirmer les ID utilisateur et groupe.

    Les ID de supergroupes Telegram négatifs qui commencent par `-100` sont des ID de discussion de groupe. Placez-les sous `channels.telegram.groups`, pas sous `groupAllowFrom`.

  </Step>
</Steps>

<Note>
L’ordre de résolution des jetons tient compte du compte. En pratique, les valeurs de configuration priment sur le repli d’environnement, et `TELEGRAM_BOT_TOKEN` ne s’applique qu’au compte par défaut.
Après un démarrage réussi, OpenClaw met en cache l’identité du bot dans le répertoire d’état pendant jusqu’à 24 heures afin que les redémarrages puissent éviter un appel Telegram `getMe` supplémentaire ; modifier ou supprimer le jeton efface ce cache.
</Note>

## Paramètres côté Telegram

<AccordionGroup>
  <Accordion title="Mode de confidentialité et visibilité des groupes">
    Les bots Telegram utilisent par défaut le **mode de confidentialité**, qui limite les messages de groupe qu’ils reçoivent.

    Si le bot doit voir tous les messages de groupe, vous pouvez soit :

    - désactiver le mode de confidentialité via `/setprivacy`, soit
    - faire du bot un administrateur du groupe.

    Lorsque vous modifiez le mode de confidentialité, supprimez puis réajoutez le bot dans chaque groupe afin que Telegram applique le changement.

  </Accordion>

  <Accordion title="Autorisations de groupe">
    Le statut d’administrateur est contrôlé dans les paramètres de groupe Telegram.

    Les bots administrateurs reçoivent tous les messages de groupe, ce qui est utile pour un comportement de groupe toujours actif.

  </Accordion>

  <Accordion title="Options BotFather utiles">

    - `/setjoingroups` pour autoriser/refuser les ajouts aux groupes
    - `/setprivacy` pour le comportement de visibilité dans les groupes

  </Accordion>
</AccordionGroup>

## Contrôle d’accès et activation

### Identité du bot dans les groupes

Dans les groupes Telegram et les sujets de forum, une mention explicite de l’identifiant du bot configuré (par exemple `@my_bot`) est traitée comme une adresse à l’agent OpenClaw sélectionné, même lorsque le nom de persona de l’agent diffère du nom d’utilisateur Telegram. La politique de silence du groupe s’applique toujours au trafic de groupe sans rapport, mais l’identifiant du bot lui-même n’est pas considéré comme « quelqu’un d’autre ».

<Tabs>
  <Tab title="Politique de messages privés">
    `channels.telegram.dmPolicy` contrôle l’accès par message direct :

    - `pairing` (par défaut)
    - `allowlist` (nécessite au moins un ID d’expéditeur dans `allowFrom`)
    - `open` (nécessite que `allowFrom` inclue `"*"`)
    - `disabled`

    `dmPolicy: "open"` avec `allowFrom: ["*"]` permet à tout compte Telegram qui trouve ou devine le nom d’utilisateur du bot de commander le bot. Utilisez-le uniquement pour des bots intentionnellement publics avec des outils strictement restreints ; les bots à propriétaire unique doivent utiliser `allowlist` avec des ID utilisateur numériques.

    `channels.telegram.allowFrom` accepte les ID utilisateur Telegram numériques. Les préfixes `telegram:` / `tg:` sont acceptés et normalisés.
    Dans les configurations multicomptes, un `channels.telegram.allowFrom` de premier niveau restrictif est traité comme une limite de sécurité : les entrées `allowFrom: ["*"]` au niveau du compte ne rendent pas ce compte public, sauf si la liste d’autorisation effective du compte contient toujours un joker explicite après fusion.
    `dmPolicy: "allowlist"` avec un `allowFrom` vide bloque tous les messages privés et est rejeté par la validation de configuration.
    La configuration ne demande que des ID utilisateur numériques.
    Si vous avez effectué une mise à niveau et que votre configuration contient des entrées de liste d’autorisation `@username`, exécutez `openclaw doctor --fix` pour les résoudre (au mieux ; nécessite un jeton de bot Telegram).
    Si vous vous appuyiez auparavant sur des fichiers de liste d’autorisation du magasin d’appairage, `openclaw doctor --fix` peut récupérer les entrées dans `channels.telegram.allowFrom` dans les flux de liste d’autorisation (par exemple lorsque `dmPolicy: "allowlist"` n’a pas encore d’ID explicites).

    Pour les bots à propriétaire unique, préférez `dmPolicy: "allowlist"` avec des ID numériques explicites dans `allowFrom` afin de rendre la politique d’accès durable dans la configuration (au lieu de dépendre d’approbations d’appairage antérieures).

    Confusion fréquente : l’approbation d’appairage par message privé ne signifie pas « cet expéditeur est autorisé partout ».
    L’appairage accorde l’accès aux messages privés. Si aucun propriétaire de commande n’existe encore, le premier appairage approuvé définit également `commands.ownerAllowFrom` afin que les commandes réservées au propriétaire et les approbations d’exécution aient un compte opérateur explicite.
    L’autorisation des expéditeurs de groupe provient toujours des listes d’autorisation explicites de la configuration.
    Si vous voulez « je suis autorisé une fois et les messages privés comme les commandes de groupe fonctionnent », placez votre ID utilisateur Telegram numérique dans `channels.telegram.allowFrom` ; pour les commandes réservées au propriétaire, assurez-vous que `commands.ownerAllowFrom` contient `telegram:<your user id>`.

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
         - avec `groupPolicy: "open"` : n’importe quel groupe peut réussir les vérifications d’ID de groupe
         - avec `groupPolicy: "allowlist"` (par défaut) : les groupes sont bloqués jusqu’à ce que vous ajoutiez des entrées `groups` (ou `"*"`)
       - `groups` configuré : agit comme une liste d’autorisation (ID explicites ou `"*"`)

    2. **Quels expéditeurs sont autorisés dans les groupes** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (par défaut)
       - `disabled`

    `groupAllowFrom` est utilisé pour le filtrage des expéditeurs de groupe. S’il n’est pas défini, Telegram se replie sur `allowFrom`.
    Les entrées `groupAllowFrom` doivent être des ID utilisateur Telegram numériques (les préfixes `telegram:` / `tg:` sont normalisés).
    Ne placez pas d’ID de discussion de groupe ou de supergroupe Telegram dans `groupAllowFrom`. Les ID de discussion négatifs doivent être placés sous `channels.telegram.groups`.
    Les entrées non numériques sont ignorées pour l’autorisation des expéditeurs.
    Limite de sécurité (`2026.2.25+`) : l’authentification des expéditeurs de groupe n’hérite **pas** des approbations du magasin d’appairage des messages privés.
    L’appairage reste réservé aux messages privés. Pour les groupes, définissez `groupAllowFrom` ou `allowFrom` par groupe/par sujet.
    Si `groupAllowFrom` n’est pas défini, Telegram se replie sur la configuration `allowFrom`, pas sur le magasin d’appairage.
    Modèle pratique pour les bots à propriétaire unique : définissez votre ID utilisateur dans `channels.telegram.allowFrom`, laissez `groupAllowFrom` non défini et autorisez les groupes cibles sous `channels.telegram.groups`.
    Note d’exécution : si `channels.telegram` est complètement absent, l’exécution adopte par défaut un `groupPolicy="allowlist"` fermé, sauf si `channels.defaults.groupPolicy` est explicitement défini.

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

    Testez-la depuis le groupe avec `@<bot_username> ping`. Les messages de groupe simples ne déclenchent pas le bot tant que `requireMention: true`.

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

      - Placez les ID de groupe ou de supergroupe Telegram négatifs comme `-1001234567890` sous `channels.telegram.groups`.
      - Placez les ID utilisateur Telegram comme `8734062810` sous `groupAllowFrom` lorsque vous voulez limiter les personnes à l’intérieur d’un groupe autorisé qui peuvent déclencher le bot.
      - Utilisez `groupAllowFrom: ["*"]` uniquement lorsque vous voulez que n’importe quel membre d’un groupe autorisé puisse parler au bot.

    </Warning>

  </Tab>

  <Tab title="Comportement des mentions">
    Les réponses de groupe nécessitent une mention par défaut.

    La mention peut provenir de :

    - une mention native `@botusername`, ou
    - des modèles de mention dans :
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Bascules de commande au niveau de la session :

    - `/activation always`
    - `/activation mention`

    Elles ne mettent à jour que l’état de session. Utilisez la configuration pour la persistance.

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

    Le contexte d’historique de groupe utilise par défaut `mention-only` : les messages de groupe précédents sont
    inclus uniquement lorsqu’ils étaient adressés au bot, sont des réponses au bot
    ou sont les propres messages du bot. Définissez `includeGroupHistoryContext: "recent"` pour
    inclure l’historique récent du salon pour les groupes de confiance. Définissez
    `includeGroupHistoryContext: "none"` pour n’envoyer aucun historique de groupe Telegram antérieur
    avec le tour suivant.

```json5
{
  channels: {
    telegram: {
      includeGroupHistoryContext: "recent",
    },
  },
}
```

    Obtenir l’ID de discussion du groupe :

    - transférer un message de groupe à `@userinfobot` / `@getidsbot`
    - ou lire `chat.id` depuis `openclaw logs --follow`
    - ou inspecter `getUpdates` de l’API Bot
    - une fois le groupe autorisé, exécuter `/whoami@<bot_username>` si les commandes natives sont activées

  </Tab>
</Tabs>

## Comportement d’exécution

- Telegram appartient au processus Gateway.
- Le routage est déterministe : les réponses entrantes Telegram repartent vers Telegram (le modèle ne choisit pas les canaux).
- Les messages entrants sont normalisés dans l’enveloppe de canal partagée avec les métadonnées de réponse, les espaces réservés de médias et le contexte persistant de chaîne de réponses pour les réponses Telegram observées par le Gateway.
- Les sessions de groupe sont isolées par ID de groupe. Les sujets de forum ajoutent `:topic:<threadId>` pour isoler les sujets.
- Les messages DM peuvent porter `message_thread_id` ; OpenClaw le conserve pour les réponses. Les sessions de sujets DM ne sont séparées que lorsque `getMe` de Telegram renvoie `has_topics_enabled: true` pour le bot ; sinon les DM restent sur la session plate.
- L’interrogation longue utilise grammY runner avec un séquencement par discussion/par fil. La concurrence globale du collecteur du runner utilise `agents.defaults.maxConcurrent`.
- Le démarrage multi-compte limite les sondes Telegram `getMe` concurrentes afin que les grands parcs de bots ne lancent pas toutes les sondes de comptes en même temps.
- L’interrogation longue est protégée dans chaque processus Gateway afin qu’un seul sondeur actif puisse utiliser un jeton de bot à la fois. Si vous voyez encore des conflits `getUpdates` 409, un autre Gateway OpenClaw, un script ou un sondeur externe utilise probablement le même jeton.
- Les redémarrages du chien de garde d’interrogation longue se déclenchent par défaut après 120 secondes sans vivacité `getUpdates` terminée. N’augmentez `channels.telegram.pollingStallThresholdMs` que si votre déploiement voit encore de faux redémarrages pour blocage d’interrogation pendant des tâches longues. La valeur est en millisecondes et est autorisée de `30000` à `600000` ; les remplacements par compte sont pris en charge.
- L’API Telegram Bot ne prend pas en charge les accusés de lecture (`sendReadReceipts` ne s’applique pas).

<Note>
  `channels.telegram.dm.threadReplies` et `channels.telegram.direct.<chatId>.threadReplies` ont été supprimés. Exécutez `openclaw doctor --fix` après la mise à niveau si votre configuration contient encore ces clés. Le routage des sujets DM suit maintenant la capacité du bot depuis `getMe.has_topics_enabled` de Telegram, qui est contrôlée par le mode avec fils de BotFather : les bots avec sujets activés utilisent des sessions DM limitées au fil lorsque Telegram envoie `message_thread_id` ; les autres DM restent sur la session plate.
</Note>

## Référence des fonctionnalités

<AccordionGroup>
  <Accordion title="Aperçu de flux en direct (modifications de message)">
    OpenClaw peut diffuser des réponses partielles en temps réel :

    - discussions directes : message d’aperçu + `editMessageText`
    - groupes/sujets : message d’aperçu + `editMessageText`

    Prérequis :

    - `channels.telegram.streaming` est `off | partial | block | progress` (par défaut : `partial`)
    - les courts aperçus de réponse initiale sont temporisés, puis matérialisés après un délai borné si l’exécution est toujours active
    - `progress` conserve un brouillon d’état modifiable pour la progression des outils, affiche le libellé d’état stable lorsque l’activité de réponse arrive avant la progression des outils, l’efface à la fin et envoie la réponse finale comme message normal
    - `streaming.preview.toolProgress` contrôle si les mises à jour d’outil/de progression réutilisent le même message d’aperçu modifié (par défaut : `true` lorsque la diffusion d’aperçu est active)
    - `streaming.preview.commandText` contrôle le détail des commandes/exécutions dans ces lignes de progression d’outil : `raw` (par défaut, conserve le comportement publié) ou `status` (libellé d’outil uniquement)
    - `streaming.progress.commentary` (par défaut : `false`) active le texte de commentaire/préambule de l’assistant dans le brouillon temporaire de progression
    - l’ancien `channels.telegram.streamMode`, les valeurs booléennes `streaming` et les clés d’aperçu de brouillon natif retirées sont détectés ; exécutez `openclaw doctor --fix` pour les migrer vers la configuration de diffusion actuelle

    Les mises à jour d’aperçu de progression d’outil sont les courtes lignes d’état affichées pendant l’exécution des outils, par exemple l’exécution de commandes, les lectures de fichiers, les mises à jour de planification, les résumés de correctifs ou le texte de préambule/commentaire Codex en mode serveur d’application Codex. Telegram les garde activées par défaut afin de correspondre au comportement OpenClaw publié depuis `v2026.4.22` et versions ultérieures.

    Pour conserver l’aperçu modifié du texte de réponse mais masquer les lignes de progression d’outil, définissez :

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

    Pour garder la progression d’outil visible mais masquer le texte de commande/exécution, définissez :

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

    Utilisez le mode `progress` lorsque vous voulez une progression d’outil visible sans modifier la réponse finale dans ce même message. Placez la politique de texte de commande sous `streaming.progress` :

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

    Utilisez `streaming.mode: "off"` uniquement lorsque vous voulez une livraison finale seulement : les modifications d’aperçu Telegram sont désactivées et le bavardage générique d’outil/de progression est supprimé au lieu d’être envoyé comme messages d’état autonomes. Les demandes d’approbation, les charges utiles multimédias et les erreurs continuent de passer par la livraison finale normale. Utilisez `streaming.preview.toolProgress: false` lorsque vous voulez seulement conserver les modifications d’aperçu de réponse tout en masquant les lignes d’état de progression d’outil.

    <Note>
      Les réponses à citation sélectionnée Telegram constituent l’exception. Lorsque `replyToMode` vaut `"first"`, `"all"` ou `"batched"` et que le message entrant inclut le texte d’une citation sélectionnée, OpenClaw envoie la réponse finale via le chemin natif de réponse à citation de Telegram au lieu de modifier l’aperçu de réponse, si bien que `streaming.preview.toolProgress` ne peut pas afficher les courtes lignes d’état pour ce tour. Les réponses au message courant sans texte de citation sélectionnée conservent la diffusion d’aperçu. Définissez `replyToMode: "off"` lorsque la visibilité de la progression d’outil compte davantage que les réponses à citation natives, ou définissez `streaming.preview.toolProgress: false` pour reconnaître ce compromis.
    </Note>

    Pour les réponses uniquement textuelles :

    - aperçus courts de DM/groupe/sujet : OpenClaw conserve le même message d’aperçu et effectue la modification finale sur place
    - les textes finaux longs qui se divisent en plusieurs messages Telegram réutilisent l’aperçu existant comme premier fragment final lorsque c’est possible, puis n’envoient que les fragments restants
    - les réponses finales en mode progression effacent le brouillon d’état et utilisent la livraison finale normale au lieu de modifier le brouillon en réponse
    - si la modification finale échoue avant que le texte terminé soit confirmé, OpenClaw utilise la livraison finale normale et nettoie l’aperçu obsolète

    Pour les réponses complexes (par exemple les charges utiles multimédias), OpenClaw revient à la livraison finale normale puis nettoie le message d’aperçu.

    La diffusion d’aperçu est distincte de la diffusion par blocs. Lorsque la diffusion par blocs est explicitement activée pour Telegram, OpenClaw ignore le flux d’aperçu pour éviter une double diffusion.

    Comportement du flux de raisonnement :

    - `/reasoning stream` utilise le chemin d’aperçu de raisonnement d’un canal pris en charge ; sur Telegram, il diffuse le raisonnement dans l’aperçu en direct pendant la génération
    - l’aperçu de raisonnement est supprimé après la livraison finale ; utilisez `/reasoning on` lorsque le raisonnement doit rester visible
    - la réponse finale est envoyée sans texte de raisonnement

  </Accordion>

  <Accordion title="Mise en forme enrichie des messages">
    Le texte sortant utilise par défaut les messages HTML Telegram standard afin que les réponses restent lisibles dans les clients Telegram actuels. Ce mode de compatibilité prend en charge le gras, l’italique, les liens, le code, les spoilers et les citations classiques, mais pas les blocs uniquement enrichis de l’API Bot 10.1 tels que les tableaux natifs, les détails, les médias enrichis et les formules.

    Définissez `channels.telegram.richMessages: true` pour activer les messages enrichis de l’API Bot 10.1 :

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    Lorsque cette option est activée :

    - L’agent est informé que les messages enrichis Telegram sont disponibles pour ce bot/compte.
    - Le texte Markdown est rendu via l’IR Markdown d’OpenClaw et envoyé comme HTML enrichi Telegram.
    - Les charges utiles HTML enrichies explicites conservent les balises prises en charge par l’API Bot 10.1, comme les titres, tableaux, détails, médias enrichis et formules.
    - Les légendes de médias utilisent toujours les légendes HTML Telegram, car les messages enrichis ne remplacent pas les légendes.

    Cela garde le texte du modèle à l’écart des sigils Telegram Rich Markdown, de sorte que des montants comme `$400-600K` ne sont pas analysés comme des mathématiques. Le texte enrichi long est automatiquement divisé selon les limites de texte enrichi et de blocs enrichis de Telegram. Les tableaux dépassant la limite de colonnes de Telegram sont envoyés comme blocs de code.

    Par défaut : désactivé pour la compatibilité client. Les messages enrichis nécessitent des clients Telegram compatibles ; certains clients Desktop, Web, Android et tiers actuels affichent les messages enrichis acceptés comme non pris en charge. Gardez cette option désactivée sauf si chaque client utilisé avec le bot peut les afficher. `/status` indique si les messages enrichis sont activés ou désactivés pour la session Telegram actuelle.

    Les aperçus de lien sont activés par défaut. `channels.telegram.linkPreview: false` ignore la détection automatique d’entités pour le texte enrichi.

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
    - les conflits/doublons sont ignorés et journalisés

    Notes :

    - les commandes personnalisées sont uniquement des entrées de menu ; elles n’implémentent pas automatiquement de comportement
    - les commandes de Plugin/Skills peuvent encore fonctionner lorsqu’elles sont saisies, même si elles ne sont pas affichées dans le menu Telegram

    Si les commandes natives sont désactivées, les commandes intégrées sont supprimées. Les commandes personnalisées/de Plugin peuvent encore s’enregistrer si elles sont configurées.

    Échecs de configuration courants :

    - `setMyCommands failed` avec `BOT_COMMANDS_TOO_MUCH` signifie que le menu Telegram déborde encore après réduction ; réduisez les commandes de Plugin/Skills/personnalisées ou désactivez `channels.telegram.commands.native`.
    - L’échec de `deleteWebhook`, `deleteMyCommands` ou `setMyCommands` avec `404: Not Found` alors que les commandes curl directes de l’API Bot fonctionnent peut signifier que `channels.telegram.apiRoot` a été défini sur le point de terminaison complet `/bot<TOKEN>`. `apiRoot` doit être seulement la racine de l’API Bot, et `openclaw doctor --fix` supprime un `/bot<TOKEN>` final accidentel.
    - `getMe returned 401` signifie que Telegram a rejeté le jeton de bot configuré. Mettez à jour `botToken`, `tokenFile` ou `TELEGRAM_BOT_TOKEN` avec le jeton BotFather actuel ; OpenClaw s’arrête avant l’interrogation, donc cela n’est pas signalé comme un échec de nettoyage de Webhook.
    - `setMyCommands failed` avec des erreurs réseau/fetch signifie généralement que le DNS/HTTPS sortant vers `api.telegram.org` est bloqué.

    ### Commandes d’association d’appareil (Plugin `device-pair`)

    Lorsque le Plugin `device-pair` est installé :

    1. `/pair` génère le code de configuration
    2. collez le code dans l’application iOS
    3. `/pair pending` liste les demandes en attente (y compris rôle/portées)
    4. approuvez la demande :
       - `/pair approve <requestId>` pour une approbation explicite
       - `/pair approve` lorsqu’il n’y a qu’une seule demande en attente
       - `/pair approve latest` pour la plus récente

    Le code de configuration transporte un jeton d’amorçage de courte durée. L’amorçage par code de configuration intégré est réservé aux nœuds : la première connexion crée une demande de nœud en attente, et après approbation le Gateway renvoie un jeton de nœud durable avec `scopes: []`. Il ne renvoie pas de jeton opérateur transféré ; l’accès opérateur nécessite une association opérateur approuvée séparée ou un flux de jeton.

    Si un appareil réessaie avec des détails d’authentification modifiés (par exemple rôle/portées/clé publique), la demande en attente précédente est remplacée et la nouvelle demande utilise un `requestId` différent. Réexécutez `/pair pending` avant d’approuver.

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

    Exemple de bouton Mini App :

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Open app:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Launch", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    Les boutons Telegram `web_app` fonctionnent uniquement dans les discussions privées entre un utilisateur et le
    bot.

    Les clics de rappel sont transmis à l’agent sous forme de texte :
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Actions de message Telegram pour les agents et l’automatisation">
    Les actions d’outil Telegram incluent :

    - `sendMessage` (`to`, `content`, `mediaUrl` facultatif, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` ou `caption`, boutons en ligne `presentation` facultatifs ; les modifications portant uniquement sur les boutons mettent à jour le balisage de réponse)
    - `createForumTopic` (`chatId`, `name`, `iconColor` facultatif, `iconCustomEmojiId`)

    Les actions de message de canal exposent des alias ergonomiques (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Contrôles de limitation :

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (par défaut : désactivé)

    Remarque : `edit` et `topic-create` sont actuellement activés par défaut et ne disposent pas de bascules `channels.telegram.actions.*` séparées.
    Les envois à l’exécution utilisent l’instantané de configuration/secrets actif (démarrage/rechargement), de sorte que les chemins d’action ne réévaluent pas les SecretRef ad hoc à chaque envoi.

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

    Quand le fil de réponse est activé et que le texte ou la légende Telegram d’origine est disponible, OpenClaw inclut automatiquement un extrait de citation Telegram natif. Telegram limite le texte de citation natif à 1024 unités de code UTF-16 ; les messages plus longs sont donc cités depuis le début et reviennent à une réponse simple si Telegram rejette la citation.

    Remarque : `off` désactive le fil de réponse implicite. Les balises explicites `[[reply_to_*]]` restent honorées.

  </Accordion>

  <Accordion title="Sujets de forum et comportement des fils">
    Supergroupes de forum :

    - les clés de session de sujet ajoutent `:topic:<threadId>`
    - les réponses et l’indication de saisie ciblent le fil du sujet
    - chemin de configuration du sujet :
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Cas particulier du sujet général (`threadId=1`) :

    - les envois de messages omettent `message_thread_id` (Telegram rejette `sendMessage(...thread_id=1)`)
    - les actions d’indication de saisie incluent toujours `message_thread_id`

    Héritage des sujets : les entrées de sujet héritent des paramètres du groupe sauf remplacement (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` est propre au sujet et n’hérite pas des valeurs par défaut du groupe.
    `topics."*"` définit les valeurs par défaut pour chaque sujet de ce groupe ; les ID de sujet exacts l’emportent toujours sur `"*"`.

    **Routage d’agent par sujet** : chaque sujet peut être routé vers un agent différent en définissant `agentId` dans la configuration du sujet. Cela donne à chaque sujet son propre espace de travail, sa mémoire et sa session isolés. Exemple :

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

    **Liaison persistante de sujet ACP** : les sujets de forum peuvent épingler des sessions de harnais ACP via des liaisons ACP typées de premier niveau (`bindings[]` avec `type: "acp"` et `match.channel: "telegram"`, `peer.kind: "group"`, et un ID qualifié par sujet comme `-1001234567890:topic:42`). Actuellement limité aux sujets de forum dans les groupes/supergroupes. Consultez [Agents ACP](/fr/tools/acp-agents).

    **Lancement ACP lié au fil depuis la discussion** : `/acp spawn <agent> --thread here|auto` lie le sujet actuel à une nouvelle session ACP ; les suivis y sont routés directement. OpenClaw épingle la confirmation de lancement dans le sujet. Nécessite que `channels.telegram.threadBindings.spawnSessions` reste activé (par défaut : `true`).

    Le contexte de modèle expose `MessageThreadId` et `IsForum`. Les discussions DM avec `message_thread_id` conservent les métadonnées de réponse ; elles utilisent des clés de session sensibles aux fils uniquement lorsque `getMe` de Telegram indique `has_topics_enabled: true` pour le bot.
    Les anciens remplacements `dm.threadReplies` et `direct.*.threadReplies` sont volontairement retirés ; utilisez le mode de fils BotFather comme source unique de vérité et exécutez `openclaw doctor --fix` pour supprimer les clés de configuration obsolètes.

  </Accordion>

  <Accordion title="Audio, vidéo et autocollants">
    ### Messages audio

    Telegram distingue les notes vocales des fichiers audio.

    - par défaut : comportement de fichier audio
    - balise `[[audio_as_voice]]` dans la réponse de l’agent pour forcer l’envoi en note vocale
    - les transcriptions de notes vocales entrantes sont encadrées comme du texte généré par machine,
      non fiable dans le contexte de l’agent ; la détection de mention utilise toujours la transcription
      brute, afin que les messages vocaux soumis à une mention continuent de fonctionner.

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

    Les notes vidéo ne prennent pas en charge les légendes ; le texte de message fourni est envoyé séparément.

    ### Autocollants

    Gestion des autocollants entrants :

    - WEBP statique : téléchargé et traité (espace réservé `<media:sticker>`)
    - TGS animé : ignoré
    - WEBM vidéo : ignoré

    Champs de contexte des autocollants :

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Les descriptions d’autocollants sont mises en cache dans l’état de Plugin SQLite OpenClaw afin de réduire les appels de vision répétés.

    Activer les actions d’autocollant :

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

    Action d’envoi d’autocollant :

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Rechercher des autocollants mis en cache :

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

    Une fois activé, OpenClaw met en file d’attente des événements système comme :

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuration :

    - `channels.telegram.reactionNotifications`: `off | own | all` (par défaut : `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (par défaut : `minimal`)

    Remarques :

    - `own` signifie uniquement les réactions de l’utilisateur aux messages envoyés par le bot (au mieux via le cache des messages envoyés).
    - Les événements de réaction respectent toujours les contrôles d’accès Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) ; les expéditeurs non autorisés sont ignorés.
    - Telegram ne fournit pas d’ID de fil dans les mises à jour de réaction.
      - les groupes hors forum sont routés vers la session de discussion de groupe
      - les groupes de forum sont routés vers la session du sujet général du groupe (`:topic:1`), et non vers le sujet d’origine exact

    `allowed_updates` pour l’interrogation ou le Webhook inclut automatiquement `message_reaction`.

  </Accordion>

  <Accordion title="Réactions d’accusé de réception">
    `ackReaction` envoie un emoji d’accusé de réception pendant qu’OpenClaw traite un message entrant. `ackReactionScope` décide *quand* cet emoji est réellement envoyé.

    **Ordre de résolution de l’emoji (`ackReaction`) :**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - repli sur l’emoji d’identité de l’agent (`agents.list[].identity.emoji`, sinon "👀")

    Remarques :

    - Telegram attend un emoji unicode (par exemple "👀").
    - Utilisez `""` pour désactiver la réaction pour un canal ou un compte.

    **Portée (`messages.ackReactionScope`) :**

    Le fournisseur Telegram lit la portée depuis `messages.ackReactionScope` (par défaut `"group-mentions"`). Il n’existe actuellement aucune surcharge au niveau du compte Telegram ni du canal Telegram.

    Valeurs : `"all"` (messages privés + groupes), `"direct"` (messages privés uniquement), `"group-all"` (chaque message de groupe, aucun message privé), `"group-mentions"` (groupes lorsque le bot est mentionné ; **aucun message privé** — c’est la valeur par défaut), `"off"` / `"none"` (désactivé).

    <Note>
    La portée par défaut (`"group-mentions"`) ne déclenche pas de réactions d’accusé de réception dans les messages directs. Pour obtenir une réaction d’accusé de réception sur les messages directs Telegram entrants, définissez `messages.ackReactionScope` sur `"direct"` ou `"all"`. La valeur est lue au démarrage du fournisseur Telegram ; un redémarrage du Gateway est donc nécessaire pour que la modification prenne effet.
    </Note>

  </Accordion>

  <Accordion title="Écritures de configuration depuis les événements et commandes Telegram">
    Les écritures de configuration du canal sont activées par défaut (`configWrites !== false`).

    Les écritures déclenchées par Telegram incluent :

    - les événements de migration de groupe (`migrate_to_chat_id`) pour mettre à jour `channels.telegram.groups`
    - `/config set` et `/config unset` (nécessite l’activation des commandes)

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

  <Accordion title="Interrogation longue ou Webhook">
    Par défaut, l’interrogation longue est utilisée. Pour le mode Webhook, définissez `channels.telegram.webhookUrl` et `channels.telegram.webhookSecret` ; `webhookPath`, `webhookHost`, `webhookPort` sont facultatifs (valeurs par défaut : `/telegram-webhook`, `127.0.0.1`, `8787`).

    En mode d’interrogation longue, OpenClaw conserve son repère de redémarrage uniquement après la distribution réussie d’une mise à jour. Si un gestionnaire échoue, cette mise à jour reste réessayable dans le même processus et n’est pas marquée comme terminée pour la déduplication au redémarrage.

    L’écouteur local se lie à `127.0.0.1:8787`. Pour une entrée publique, placez soit un proxy inverse devant le port local, soit définissez intentionnellement `webhookHost: "0.0.0.0"`.

    Le mode Webhook valide les protections de requête, le jeton secret Telegram et le corps JSON avant de renvoyer `200` à Telegram.
    OpenClaw traite ensuite la mise à jour de façon asynchrone via les mêmes voies de bot par discussion et par sujet que celles utilisées par l’interrogation longue, afin que les tours d’agent lents ne bloquent pas l’accusé de réception de livraison de Telegram.

  </Accordion>

  <Accordion title="Limites, nouvelles tentatives et cibles CLI">
    - La valeur par défaut de `channels.telegram.textChunkLimit` est 4000.
    - `channels.telegram.chunkMode="newline"` privilégie les limites de paragraphes (lignes vides) avant le découpage par longueur.
    - `channels.telegram.mediaMaxMb` (100 par défaut) plafonne la taille des médias Telegram entrants et sortants.
    - `channels.telegram.mediaGroupFlushMs` (500 par défaut) contrôle la durée pendant laquelle les albums/groupes de médias Telegram sont mis en mémoire tampon avant qu’OpenClaw les transmette comme un seul message entrant. Augmentez-la si les parties d’album arrivent en retard ; diminuez-la pour réduire la latence des réponses aux albums.
    - `channels.telegram.timeoutSeconds` remplace le délai d’expiration du client API Telegram (si non défini, la valeur par défaut de grammY s’applique). Les clients bot limitent les valeurs configurées en dessous de la garde de requête de texte/saisie sortante de 60 secondes afin que grammY n’abandonne pas la livraison des réponses visibles avant que la garde de transport et le repli d’OpenClaw puissent s’exécuter. Le long polling utilise toujours une garde de requête `getUpdates` de 45 secondes afin que les interrogations inactives ne soient pas abandonnées indéfiniment.
    - `channels.telegram.pollingStallThresholdMs` vaut `120000` par défaut ; ajustez entre `30000` et `600000` uniquement pour les redémarrages de blocage de polling faussement positifs.
    - L’historique du contexte de groupe utilise `channels.telegram.historyLimit` ou `messages.groupChat.historyLimit` (50 par défaut) ; `0` le désactive.
    - Le contexte supplémentaire de réponse/citation/transfert est normalisé dans une fenêtre de contexte de conversation sélectionnée lorsque le Gateway a observé les messages parents ; le cache des messages observés réside dans l’état de Plugin SQLite d’OpenClaw, et `openclaw doctor --fix` importe les anciens fichiers annexes. Telegram n’inclut qu’un seul `reply_to_message` peu profond dans les mises à jour ; les chaînes plus anciennes que le cache sont donc limitées à la charge utile de mise à jour actuelle de Telegram.
    - Les listes d’autorisation Telegram contrôlent principalement qui peut déclencher l’agent, et ne constituent pas une limite complète de caviardage du contexte supplémentaire.
    - Contrôles de l’historique des messages privés :
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - La configuration `channels.telegram.retry` s’applique aux assistants d’envoi Telegram (CLI/outils/actions) pour les erreurs d’API sortantes récupérables. La livraison de la réponse finale entrante utilise aussi une nouvelle tentative d’envoi sûre et bornée pour les échecs Telegram avant connexion, mais elle ne réessaie pas les enveloppes réseau ambiguës après envoi qui pourraient dupliquer des messages visibles.

    Les cibles d’envoi CLI et d’outil de message peuvent être un ID de chat numérique, un nom d’utilisateur ou une cible de sujet de forum :

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
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

    L’envoi Telegram prend également en charge :

    - `--presentation` avec des blocs `buttons` pour les claviers en ligne lorsque `channels.telegram.capabilities.inlineButtons` l’autorise
    - `--pin` ou `--delivery '{"pin":true}'` pour demander une livraison épinglée lorsque le bot peut épingler dans ce chat
    - `--force-document` pour envoyer les images, GIF et vidéos sortants comme documents au lieu de téléversements de photo compressée, de média animé ou de vidéo

    Contrôle des actions :

    - `channels.telegram.actions.sendMessage=false` désactive les messages Telegram sortants, y compris les sondages
    - `channels.telegram.actions.poll=false` désactive la création de sondages Telegram tout en laissant les envois ordinaires activés

  </Accordion>

  <Accordion title="Approbations exec dans Telegram">
    Telegram prend en charge les approbations exec dans les messages privés des approbateurs et peut éventuellement publier les invites dans le chat ou le sujet d’origine. Les approbateurs doivent être des ID utilisateur Telegram numériques.

    Chemin de configuration :

    - `channels.telegram.execApprovals.enabled` (s’active automatiquement lorsqu’au moins un approbateur peut être résolu)
    - `channels.telegram.execApprovals.approvers` (se rabat sur les ID numériques de propriétaires issus de `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target` : `dm` (par défaut) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` et `defaultTo` contrôlent qui peut parler au bot et où il envoie les réponses normales. Ils ne font pas d’une personne un approbateur exec. Le premier jumelage approuvé par message privé initialise `commands.ownerAllowFrom` lorsqu’aucun propriétaire de commande n’existe encore, de sorte que la configuration à un seul propriétaire fonctionne toujours sans dupliquer les ID sous `execApprovals.approvers`.

    La livraison dans le canal affiche le texte de la commande dans le chat ; n’activez `channel` ou `both` que dans des groupes/sujets de confiance. Lorsque l’invite arrive dans un sujet de forum, OpenClaw préserve le sujet pour l’invite d’approbation et le suivi. Les approbations exec expirent après 30 minutes par défaut.

    Les boutons d’approbation en ligne nécessitent également que `channels.telegram.capabilities.inlineButtons` autorise la surface cible (`dm`, `group` ou `all`). Les ID d’approbation préfixés par `plugin:` sont résolus via les approbations de Plugin ; les autres sont d’abord résolus via les approbations exec.

    Voir [Approbations exec](/fr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Contrôles des réponses d’erreur

Lorsque l’agent rencontre une erreur de livraison ou de fournisseur, Telegram peut soit répondre avec le texte de l’erreur, soit le supprimer. Deux clés de configuration contrôlent ce comportement :

| Clé                                 | Valeurs           | Par défaut | Description                                                                                                        |
| ----------------------------------- | ----------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply` envoie un message d’erreur convivial au chat. `silent` supprime entièrement les réponses d’erreur.         |
| `channels.telegram.errorCooldownMs` | nombre (ms)       | `60000`    | Temps minimal entre les réponses d’erreur au même chat. Empêche le spam d’erreurs pendant les interruptions.       |

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
      - BotFather : `/setprivacy` -> Disable
      - puis supprimez et rajoutez le bot au groupe
    - `openclaw channels status` avertit lorsque la configuration attend des messages de groupe sans mention.
    - `openclaw channels status --probe` peut vérifier les ID numériques explicites de groupes ; le joker `"*"` ne peut pas faire l’objet d’une sonde d’appartenance.
    - Test rapide de session : `/activation always`.

  </Accordion>

  <Accordion title="Le bot ne voit aucun message de groupe">

    - lorsque `channels.telegram.groups` existe, le groupe doit être listé (ou inclure `"*"`)
    - vérifiez l’appartenance du bot au groupe
    - consultez les journaux : `openclaw logs --follow` pour les raisons d’ignorance

  </Accordion>

  <Accordion title="Les commandes fonctionnent partiellement ou pas du tout">

    - autorisez votre identité d’expéditeur (jumelage et/ou `allowFrom` numérique)
    - l’autorisation des commandes s’applique toujours même lorsque la politique de groupe est `open`
    - `setMyCommands failed` avec `BOT_COMMANDS_TOO_MUCH` signifie que le menu natif contient trop d’entrées ; réduisez les commandes de Plugin/Skills/personnalisées ou désactivez les menus natifs
    - Les appels de démarrage `deleteMyCommands` / `setMyCommands` et les appels de saisie `sendChatAction` sont bornés et réessayés une fois via le repli de transport de Telegram en cas d’expiration de requête. Les erreurs réseau/fetch persistantes indiquent généralement des problèmes d’accessibilité DNS/HTTPS vers `api.telegram.org`

  </Accordion>

  <Accordion title="Le démarrage signale un jeton non autorisé">

    - `getMe returned 401` est un échec d’authentification Telegram pour le jeton de bot configuré.
    - Recopiez ou régénérez le jeton de bot dans BotFather, puis mettez à jour `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` ou `TELEGRAM_BOT_TOKEN` pour le compte par défaut.
    - `deleteWebhook 401 Unauthorized` pendant le démarrage est aussi un échec d’authentification ; le traiter comme « aucun Webhook n’existe » ne ferait que reporter le même échec dû à un mauvais jeton à des appels API ultérieurs.

  </Accordion>

  <Accordion title="Instabilité du polling ou du réseau">

    - Node 22+ avec fetch/proxy personnalisé peut déclencher un comportement d’abandon immédiat si les types AbortSignal ne correspondent pas.
    - Certains hôtes résolvent d’abord `api.telegram.org` en IPv6 ; une sortie IPv6 défectueuse peut provoquer des échecs intermittents de l’API Telegram.
    - Si les journaux incluent `TypeError: fetch failed` ou `Network request for 'getUpdates' failed!`, OpenClaw réessaie désormais ces erreurs comme des erreurs réseau récupérables.
    - Pendant le démarrage du polling, OpenClaw réutilise la sonde de démarrage `getMe` réussie pour grammY afin que l’exécuteur n’ait pas besoin d’un second `getMe` avant le premier `getUpdates`.
    - Si `deleteWebhook` échoue avec une erreur réseau transitoire pendant le démarrage du polling, OpenClaw continue en long polling au lieu d’effectuer un autre appel de plan de contrôle avant polling. Un Webhook encore actif apparaît comme un conflit `getUpdates` ; OpenClaw reconstruit alors le transport Telegram et réessaie le nettoyage du Webhook.
    - Si les sockets Telegram se recyclent selon une cadence courte et fixe, vérifiez si `channels.telegram.timeoutSeconds` est bas ; les clients bot limitent les valeurs configurées en dessous des gardes de requêtes sortantes et `getUpdates`, mais les anciennes versions pouvaient abandonner chaque polling ou réponse lorsque cette valeur était inférieure à ces gardes.
    - Si les journaux incluent `Polling stall detected`, OpenClaw redémarre le polling et reconstruit le transport Telegram après 120 secondes sans vivacité de long polling terminée par défaut.
    - `openclaw channels status --probe` et `openclaw doctor` avertissent lorsqu’un compte de polling en cours d’exécution n’a pas terminé `getUpdates` après la période de grâce de démarrage, lorsqu’un compte Webhook en cours d’exécution n’a pas terminé `setWebhook` après la période de grâce de démarrage, ou lorsque la dernière activité réussie du transport de polling est obsolète.
    - Augmentez `channels.telegram.pollingStallThresholdMs` uniquement lorsque les appels `getUpdates` de longue durée sont sains, mais que votre hôte signale encore de faux redémarrages pour blocage de polling. Les blocages persistants indiquent généralement des problèmes de proxy, DNS, IPv6 ou sortie TLS entre l’hôte et `api.telegram.org`.
    - Telegram respecte également les variables d’environnement de proxy du processus pour le transport de l’API Bot, notamment `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` et leurs variantes en minuscules. `NO_PROXY` / `no_proxy` peuvent toujours contourner `api.telegram.org`.
    - Si le proxy géré par OpenClaw est configuré via `OPENCLAW_PROXY_URL` pour un environnement de service et qu’aucune variable d’environnement de proxy standard n’est présente, Telegram utilise aussi cette URL pour le transport de l’API Bot.
    - Sur les hôtes VPS avec une sortie directe/TLS instable, acheminez les appels à l’API Telegram via `channels.telegram.proxy` :

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ utilise par défaut `autoSelectFamily=true` (sauf WSL2). L’ordre des résultats DNS Telegram respecte `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, puis `channels.telegram.network.dnsResultOrder`, puis la valeur par défaut du processus telle que `NODE_OPTIONS=--dns-result-order=ipv4first` ; si aucune ne s’applique, Node 22+ se rabat sur `ipv4first`.
    - Si votre hôte est WSL2 ou fonctionne explicitement mieux avec un comportement IPv4 uniquement, forcez la sélection de famille :

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Les réponses de plage de référence RFC 2544 (`198.18.0.0/15`) sont déjà autorisées
      par défaut pour les téléchargements de médias Telegram. Si une fausse IP de confiance ou
      un proxy transparent réécrit `api.telegram.org` vers une autre
      adresse privée/interne/à usage spécial pendant les téléchargements de médias, vous pouvez
      activer le contournement limité à Telegram :

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
      référence RFC 2544 par défaut.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` affaiblit les protections
      SSRF des médias Telegram. Utilisez-le uniquement pour des environnements de proxy de confiance
      contrôlés par l’opérateur, comme le routage par fausse IP Clash, Mihomo ou Surge, lorsqu’ils
      synthétisent des réponses privées ou à usage spécial hors de la plage de référence RFC 2544.
      Laissez-le désactivé pour un accès Telegram normal via l’internet public.
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

<Accordion title="Champs Telegram à signal fort">

- démarrage/authentification : `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` doit pointer vers un fichier standard ; les liens symboliques sont rejetés)
- contrôle d’accès : `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de premier niveau (`type: "acp"`)
- valeurs par défaut des sujets : `groups.<chatId>.topics."*"` s’applique aux sujets de forum non correspondants ; les ID de sujet exacts le remplacent
- approbations d’exécution : `execApprovals`, `accounts.*.execApprovals`
- commandes/menu : `commands.native`, `commands.nativeSkills`, `customCommands`
- fils de discussion/réponses : `replyToMode`
- diffusion en continu : `streaming` (aperçu), `streaming.preview.toolProgress`, `blockStreaming`
- mise en forme/livraison : `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
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
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    Associer un utilisateur Telegram au Gateway.
  </Card>
  <Card title="Groupes" icon="users" href="/fr/channels/groups">
    Comportement de liste d’autorisation des groupes et des sujets.
  </Card>
  <Card title="Routage des canaux" icon="route" href="/fr/channels/channel-routing">
    Acheminer les messages entrants vers les agents.
  </Card>
  <Card title="Sécurité" icon="shield" href="/fr/gateway/security">
    Modèle de menace et renforcement.
  </Card>
  <Card title="Routage multi-agent" icon="sitemap" href="/fr/concepts/multi-agent">
    Mapper les groupes et les sujets aux agents.
  </Card>
  <Card title="Dépannage" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics inter-canaux.
  </Card>
</CardGroup>
