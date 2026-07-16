---
read_when:
    - Travail sur les fonctionnalités ou les Webhooks de Telegram
summary: État de la prise en charge des bots Telegram, fonctionnalités et configuration
title: Telegram
x-i18n:
    generated_at: "2026-07-16T13:00:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 51c155afeb147b92a55f181be269ce13c4fd6b609a94d680cd7e091cd4a7c236
    source_path: channels/telegram.md
    workflow: 16
---

Prêt pour la production pour les messages privés aux bots et les groupes via grammY. L’interrogation longue est le transport par défaut ; le mode Webhook est facultatif.

<CardGroup cols={3}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    La politique de messages privés par défaut pour Telegram est l’appairage.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Procédures de diagnostic et de réparation intercanaux.
  </Card>
  <Card title="Configuration du Gateway" icon="settings" href="/fr/gateway/configuration">
    Modèles et exemples complets de configuration des canaux.
  </Card>
</CardGroup>

## Configuration rapide

<Steps>
  <Step title="Créer le jeton du bot dans BotFather">
    Les deux méthodes aboutissent à un jeton à coller dans OpenClaw — choisissez-en une :

    - **Méthode par discussion** : ouvrez Telegram, discutez avec **@BotFather** (vérifiez que l’identifiant est exactement `@BotFather`), exécutez `/newbot`, suivez les instructions et enregistrez le jeton.
    - **Méthode web** : ouvrez l’[application web de BotFather](https://t.me/BotFather?startapp) — elle fonctionne dans chaque client Telegram, y compris [web.telegram.org](https://web.telegram.org) — créez le bot dans l’interface et copiez son jeton.

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

    Variable d’environnement de secours : `TELEGRAM_BOT_TOKEN` (compte par défaut uniquement ; les comptes nommés doivent utiliser `botToken` ou `tokenFile`).
    Telegram n’utilise **pas** `openclaw channels login telegram` ; définissez le jeton dans la configuration ou l’environnement, puis démarrez le Gateway.

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
    Ajoutez le bot à votre groupe, puis récupérez les deux identifiants nécessaires à l’accès au groupe :

    - votre identifiant utilisateur Telegram, pour `allowFrom` / `groupAllowFrom`
    - l’identifiant de discussion du groupe Telegram, comme clé sous `channels.telegram.groups`

    Récupérez l’identifiant de discussion du groupe à l’aide de `openclaw logs --follow`, d’un bot d’identification des messages transférés ou de `getUpdates` de la Bot API. Une fois le groupe autorisé, `/whoami@<bot_username>` confirme les identifiants de l’utilisateur et du groupe.

    Les identifiants négatifs de supergroupes commençant par `-100` sont des identifiants de discussion de groupe. Ils se placent sous `channels.telegram.groups`, et non sous `groupAllowFrom`.

  </Step>
</Steps>

<Note>
La résolution des jetons tient compte du compte : `tokenFile` prévaut sur `botToken`, qui prévaut sur l’environnement, et la configuration prévaut toujours sur `TELEGRAM_BOT_TOKEN` (qui n’est résolu que pour le compte par défaut). Après un démarrage réussi, OpenClaw met en cache l’identité du bot pendant 24 heures au maximum afin que les redémarrages évitent un appel `getMe` supplémentaire ; la modification ou la suppression du jeton efface ce cache.
</Note>

## Paramètres côté Telegram

<AccordionGroup>
  <Accordion title="Mode de confidentialité et visibilité dans les groupes">
    Par défaut, les bots Telegram utilisent le **Privacy Mode**, qui limite les messages de groupe qu’ils reçoivent.

    Pour voir tous les messages de groupe :

    - désactivez le mode de confidentialité via `/setprivacy`, ou
    - nommez le bot administrateur du groupe.

    Après avoir modifié le mode de confidentialité, retirez puis ajoutez de nouveau le bot dans chaque groupe afin que Telegram applique la modification.

  </Accordion>

  <Accordion title="Autorisations du groupe">
    Le statut d’administrateur se contrôle dans les paramètres du groupe Telegram. Les bots administrateurs reçoivent tous les messages du groupe, ce qui est utile pour un fonctionnement permanent dans les groupes.
  </Accordion>

  <Accordion title="Options BotFather utiles">

    - `/setjoingroups` — autoriser ou refuser l’ajout aux groupes
    - `/setprivacy` — comportement de visibilité dans les groupes

    Les mêmes paramètres sont disponibles dans l’[application web de BotFather](https://t.me/BotFather?startapp) si vous préférez une interface aux commandes de discussion.

  </Accordion>
</AccordionGroup>

## Mini App du tableau de bord

Exécutez `/dashboard` dans un message privé avec le bot pour ouvrir le tableau de bord OpenClaw dans Telegram.

Prérequis :

- `gateway.tailscale.mode: "serve"` ou `"funnel"` pour l’URL HTTPS publiée de la Mini App.
- Votre identifiant utilisateur Telegram numérique doit figurer dans la valeur effective de `allowFrom` du compte sélectionné ou dans `commands.ownerAllowFrom`.
- Utilisez un message privé. Dans les groupes, `/dashboard` répond avec `open this in a DM with the bot` et n’envoie aucun bouton.
- Installations Docker : les modes Serve/Funnel exigent que le Gateway se lie à l’interface de bouclage aux côtés de `tailscaled`, ce que la mise en réseau par pont avec des ports publiés ne permet pas. Exécutez le conteneur du Gateway avec `network_mode: host` et montez le socket `tailscaled` de l’hôte (`/var/run/tailscale`), ainsi que la CLI `tailscale`, dans le conteneur.

La Mini App est un chemin v1 réservé à Tailscale et ne prend pas en charge l’iframe Telegram Web.

## Contrôle d’accès et activation

### Identité du bot dans les groupes

Dans les groupes et les sujets de forum, une mention explicite de l’identifiant configuré du bot (par exemple `@my_bot`) s’adresse à l’agent OpenClaw sélectionné, même lorsque le nom de personnalité de l’agent diffère du nom d’utilisateur Telegram. La politique de silence du groupe continue de s’appliquer au trafic sans rapport, mais l’identifiant du bot n’est jamais « quelqu’un d’autre ».

<Tabs>
  <Tab title="Politique de messages privés">
    `channels.telegram.dmPolicy` contrôle l’accès aux messages privés :

    - `pairing` (par défaut)
    - `allowlist` (nécessite au moins un identifiant d’expéditeur dans `allowFrom`)
    - `open` (nécessite que `allowFrom` contienne `"*"`)
    - `disabled`

    `dmPolicy: "open"` avec `allowFrom: ["*"]` permet à tout compte Telegram qui trouve ou devine le nom d’utilisateur du bot de lui envoyer des commandes. Utilisez cette configuration uniquement pour des bots volontairement publics dont les outils sont strictement restreints ; les bots à propriétaire unique doivent utiliser `allowlist` avec des identifiants utilisateur numériques.

    `channels.telegram.allowFrom` accepte les identifiants utilisateur Telegram numériques. Les préfixes `telegram:` / `tg:` sont acceptés et normalisés.
    Dans les configurations multicomptes, une valeur restrictive de `channels.telegram.allowFrom` au niveau supérieur constitue une limite de sécurité : une valeur `allowFrom: ["*"]` au niveau d’un compte ne rend pas ce compte public, sauf si la liste d’autorisation effective fusionnée contient toujours un caractère générique explicite.
    `dmPolicy: "allowlist"` avec une valeur `allowFrom` vide bloque tous les messages privés et est rejeté par la validation de la configuration.
    La configuration demande uniquement des identifiants utilisateur numériques. Si votre configuration contient des entrées de liste d’autorisation `@username` issues d’une ancienne configuration, exécutez `openclaw doctor --fix` pour les résoudre en identifiants numériques (dans la mesure du possible ; nécessite un jeton de bot Telegram).
    Si vous utilisiez auparavant des fichiers de liste d’autorisation du magasin d’appairage, `openclaw doctor --fix` peut récupérer les entrées dans `channels.telegram.allowFrom` pour les flux de liste d’autorisation (par exemple lorsque `dmPolicy: "allowlist"` ne contient encore aucun identifiant explicite).

    Pour les bots à propriétaire unique, préférez `dmPolicy: "allowlist"` avec des identifiants numériques `allowFrom` explicites plutôt que de dépendre d’approbations d’appairage antérieures.

    Confusion fréquente : l’approbation d’un appairage par message privé ne signifie pas que « cet expéditeur est autorisé partout ». L’appairage accorde uniquement l’accès aux messages privés. Si aucun propriétaire de commandes n’existe encore, le premier appairage approuvé définit également `commands.ownerAllowFrom`, ce qui attribue un compte opérateur explicite aux commandes réservées au propriétaire et aux approbations d’exécution. L’autorisation des expéditeurs dans les groupes provient toujours de listes d’autorisation explicites dans la configuration.
    Pour être autorisé à la fois pour les messages privés et les commandes de groupe avec une seule identité : placez votre identifiant utilisateur Telegram numérique dans `channels.telegram.allowFrom` et, pour les commandes réservées au propriétaire, assurez-vous que `commands.ownerAllowFrom` contient `telegram:<your user id>`.

    ### Trouver votre identifiant utilisateur Telegram

    Méthode plus sûre (sans bot tiers) : envoyez un message privé à votre bot, exécutez `openclaw logs --follow`, puis consultez `from.id`.

    Méthode officielle de la Bot API :

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Services tiers (moins confidentiels) : `@userinfobot` ou `@getidsbot`.

  </Tab>

  <Tab title="Politique de groupe et listes d’autorisation">
    Deux contrôles s’appliquent conjointement :

    1. **Groupes autorisés** (`channels.telegram.groups`)
       - aucune configuration `groups`, `groupPolicy: "open"` : tous les groupes satisfont les vérifications d’identifiant de groupe
       - aucune configuration `groups`, `groupPolicy: "allowlist"` (par défaut) : tous les groupes sont bloqués jusqu’à l’ajout d’entrées `groups` (ou `"*"`)
       - `groups` configuré : agit comme une liste d’autorisation (identifiants explicites ou `"*"`)

    2. **Expéditeurs autorisés dans les groupes** (`channels.telegram.groupPolicy`)
       - `open` / `allowlist` (par défaut) / `disabled`

    `groupAllowFrom` filtre les expéditeurs des groupes ; si cette valeur n’est pas définie, Telegram utilise `allowFrom` comme solution de secours (et non le magasin d’appairage — l’autorisation des expéditeurs de groupe n’hérite jamais des approbations du magasin d’appairage des messages privés, ce qui constitue une limite de sécurité depuis `2026.2.25`).
    Les entrées `groupAllowFrom` doivent être des identifiants utilisateur Telegram numériques (les préfixes `telegram:` / `tg:` sont normalisés) ; les entrées non numériques sont ignorées. N’y placez pas d’identifiants de discussion de groupe ou de supergroupe — les identifiants de discussion négatifs se placent sous `channels.telegram.groups`.
    Modèle pratique pour les bots à propriétaire unique : définissez votre identifiant utilisateur dans `channels.telegram.allowFrom`, laissez `groupAllowFrom` non défini et autorisez les groupes cibles sous `channels.telegram.groups`.
    Si `channels.telegram` est entièrement absent de la configuration, l’exécution utilise par défaut la valeur fermée par défaut `groupPolicy="allowlist"`, sauf si `channels.defaults.groupPolicy` est explicitement défini.

    Configuration d’un groupe réservé au propriétaire :

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

    Testez depuis le groupe avec `@<bot_username> ping`. Les messages ordinaires du groupe ne déclenchent pas le bot tant que `requireMention: true`.

    Autoriser tous les membres d’un groupe précis :

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

    Autoriser uniquement certains utilisateurs dans un groupe précis :

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
      Erreur fréquente : `groupAllowFrom` n’est pas une liste d’autorisation de groupes.

      - Les identifiants négatifs de discussion de groupe ou de supergroupe Telegram (`-1001234567890`) se placent sous `channels.telegram.groups`.
      - Les identifiants utilisateur Telegram (`8734062810`) se placent sous `groupAllowFrom` afin de limiter les personnes qui peuvent déclencher le bot dans un groupe autorisé.
      - Utilisez `groupAllowFrom: ["*"]` uniquement pour permettre à n’importe quel membre d’un groupe autorisé de parler au bot.

    </Warning>

  </Tab>

  <Tab title="Comportement des mentions">
    Par défaut, les réponses dans les groupes nécessitent une mention. Une mention peut provenir :

    - d’une mention native `@botusername`, ou
    - d’un modèle de mention dans `agents.list[].groupChat.mentionPatterns` ou `messages.groupChat.mentionPatterns`

    Options au niveau de la session (état uniquement, non persistant) : `/activation always`, `/activation mention`. Utilisez la configuration pour assurer la persistance :

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

    Le contexte de l’historique du groupe est toujours activé et limité par `historyLimit`. Définissez `channels.telegram.historyLimit: 0` pour désactiver la fenêtre d’historique du groupe. `openclaw doctor --fix` supprime la clé obsolète `includeGroupHistoryContext`.

    Pour obtenir l’identifiant de discussion du groupe : transférez un message du groupe à `@userinfobot` / `@getidsbot`, consultez `chat.id` dans `openclaw logs --follow`, inspectez `getUpdates` de la Bot API ou, une fois le groupe autorisé, exécutez `/whoami@<bot_username>`.

  </Tab>
</Tabs>

## Comportement à l’exécution

- Telegram s’exécute dans le processus du Gateway.
- Le routage est déterministe : les réponses aux messages entrants de Telegram sont renvoyées vers Telegram (le modèle ne choisit pas les canaux).
- Les messages entrants sont normalisés dans l’enveloppe de canal partagée avec les métadonnées de réponse, les espaces réservés pour les médias et le contexte persistant de la chaîne de réponses pour les réponses observées par le Gateway.
- Les sessions de groupe sont isolées par ID de groupe. Les sujets de forum ajoutent `:topic:<threadId>`.
- Les messages privés peuvent contenir `message_thread_id` ; OpenClaw le conserve pour les réponses. Les sessions de sujets en message privé ne sont séparées que lorsque Telegram `getMe` indique `has_topics_enabled: true` pour le bot ; sinon, les messages privés restent dans la session non hiérarchisée.
- L’interrogation longue utilise l’exécuteur grammY avec un séquençage par discussion et par fil. La concurrence du récepteur de l’exécuteur utilise `agents.defaults.maxConcurrent`.
- Le démarrage multicomptes limite le nombre de sondes `getMe` simultanées afin que les grandes flottes de bots ne lancent pas toutes les sondes de comptes en même temps.
- Chaque processus du Gateway protège l’interrogation longue afin qu’un seul interrogateur actif puisse utiliser un jeton de bot à la fois. Des conflits 409 `getUpdates` persistants indiquent qu’un autre Gateway OpenClaw, un script ou un interrogateur externe utilise le même jeton.
- Par défaut, le mécanisme de surveillance de l’interrogation redémarre après 120 secondes sans validation de l’activité `getUpdates`. N’augmentez `channels.telegram.pollingStallThresholdMs` (30000-600000, remplacements par compte pris en charge) que si votre déploiement subit de faux redémarrages pour blocage de l’interrogation pendant des tâches de longue durée.
- L’API Telegram Bot ne prend pas en charge les accusés de lecture (`sendReadReceipts` ne s’applique pas).

<Note>
  `channels.telegram.dm.threadReplies` et `channels.telegram.direct.<chatId>.threadReplies` ont été supprimés. Exécutez `openclaw doctor --fix` après la mise à niveau si votre configuration contient encore ces clés. Le routage des sujets de messages privés suit désormais Telegram `getMe.has_topics_enabled` (contrôlé par le mode de fils de discussion de BotFather) : les bots pour lesquels les sujets sont activés utilisent des sessions de messages privés limitées au fil lorsque Telegram envoie `message_thread_id` ; les autres messages privés restent dans la session non hiérarchisée.
</Note>

## Référence des fonctionnalités

<AccordionGroup>
  <Accordion title="Aperçu du flux en direct (modifications de messages)">
    OpenClaw diffuse les réponses partielles en temps réel dans les discussions directes, les groupes et les sujets : il envoie un message d’aperçu, puis exécute `editMessageText` de manière répétée avant de finaliser le message sur place.

    - `channels.telegram.streaming` est `off | partial | block | progress` (valeur par défaut : `partial`)
    - les courts aperçus de réponse initiaux sont temporisés, puis matérialisés après un délai limité si l’exécution est toujours active
    - `progress` conserve un unique brouillon d’état modifiable pour la progression des outils, affiche le libellé d’état stable lorsque l’activité de réponse commence avant la progression des outils, l’efface à la fin et envoie la réponse finale comme un message normal
    - `streaming.preview.toolProgress` détermine si les mises à jour des outils et de la progression réutilisent le même message d’aperçu modifié (valeur par défaut : `true` lorsque la diffusion de l’aperçu est active)
    - `streaming.preview.commandText` contrôle le niveau de détail des commandes et de leur exécution dans ces lignes : `raw` (valeur par défaut) ou `status` (libellé de l’outil uniquement)
    - `streaming.progress.commentary` (valeur par défaut : `false`) permet d’inclure le commentaire et le préambule de l’assistant dans le brouillon de progression temporaire
    - l’ancien `channels.telegram.streamMode`, les valeurs booléennes `streaming` et les clés d’aperçu de brouillon natif retirées sont détectés ; exécutez `openclaw doctor --fix` pour les migrer

    Les lignes de progression des outils sont les brèves mises à jour d’état affichées pendant l’exécution des outils (exécution de commandes, lecture de fichiers, mises à jour de planification, résumés de correctifs, préambule et commentaires Codex en mode serveur d’application). Telegram les conserve activées par défaut (ce qui correspond au comportement publié depuis `v2026.4.22`+).

    Pour conserver les modifications de l’aperçu de la réponse tout en masquant les lignes de progression des outils :

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "toolProgress": false }
          }
        }
      }
    }
    ```

    Pour garder la progression des outils visible tout en masquant le texte des commandes et de leur exécution :

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "commandText": "status" }
          }
        }
      }
    }
    ```

    Le mode `progress` affiche la progression des outils sans intégrer la réponse finale à ce message par modification. Placez la stratégie relative au texte des commandes sous `streaming.progress` :

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

    `streaming.mode: "off"` désactive les modifications d’aperçu et supprime les messages génériques relatifs aux outils et à la progression au lieu de les envoyer sous forme de messages d’état autonomes ; les demandes d’approbation, les médias et les erreurs sont toujours acheminés par la livraison finale normale. `streaming.preview.toolProgress: false` ne conserve que les modifications de l’aperçu de la réponse.

    <Note>
      Les réponses à une citation sélectionnée constituent l’exception. Lorsque `replyToMode` vaut `first`, `all` ou `batched` et que le message entrant contient du texte de citation sélectionné, OpenClaw envoie la réponse finale par le mécanisme natif de réponse à une citation de Telegram au lieu de modifier l’aperçu de la réponse ; `streaming.preview.toolProgress` ne peut donc pas afficher de lignes d’état pendant cette interaction. Les réponses au message actuel sans texte de citation sélectionné continuent d’être diffusées. Définissez `replyToMode: "off"` lorsque la visibilité de la progression des outils importe davantage que les réponses natives aux citations, ou `streaming.preview.toolProgress: false` pour accepter ce compromis.
    </Note>

    Pour les réponses contenant uniquement du texte : les aperçus courts sont remplacés sur place par la modification finale ; les longues réponses finales divisées en plusieurs messages réutilisent l’aperçu comme premier fragment, puis n’envoient que le reste ; les réponses finales en mode progression effacent le brouillon d’état et utilisent la livraison finale normale ; si la modification finale échoue avant la confirmation de l’achèvement, OpenClaw revient à la livraison finale normale et supprime l’aperçu obsolète. Pour les réponses complexes (charges utiles multimédias), OpenClaw revient toujours à la livraison finale normale et supprime l’aperçu.

    La diffusion de l’aperçu et la diffusion par blocs sont mutuellement exclusives — lorsque la diffusion par blocs est explicitement activée, OpenClaw ignore le flux d’aperçu afin d’éviter une double diffusion.

    Raisonnement : `/reasoning stream` diffuse le raisonnement dans l’aperçu en direct pendant la génération, puis supprime l’aperçu du raisonnement après la livraison finale (utilisez `/reasoning on` pour le conserver visible). La réponse finale est envoyée sans le texte du raisonnement.

  </Accordion>

  <Accordion title="Mise en forme enrichie des messages">
    Par défaut, le texte sortant utilise les messages HTML standard de Telegram, lisibles dans les clients actuels : gras, italique, liens, code, divulgâcheurs, citations — et non les blocs enrichis exclusifs de Bot API 10.2 (tableaux natifs, détails, médias enrichis, formules).

    Pour activer les messages enrichis de Bot API 10.2 :

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    Lorsqu’ils sont activés : l’agent est informé que les messages enrichis sont disponibles pour ce bot ou ce compte (avec le contrat de création Markdown et d’îlots HTML pris en charge) ; le texte Markdown est rendu par l’intermédiaire de la représentation intermédiaire Markdown d’OpenClaw sous forme de blocs enrichis typés de Bot API 10.2 (titres, tableaux, détails, listes de contrôle, médias enrichis, formules, cartes, collages) ; les légendes de médias utilisent toujours les légendes HTML de Telegram (les messages enrichis ne remplacent pas les légendes, qui restent limitées à 1024 caractères).

    Cela évite que le texte du modèle soit interprété selon les symboles du Markdown enrichi de Telegram, afin que les montants tels que `$400-600K` ne soient pas analysés comme des expressions mathématiques. Les longs textes enrichis sont automatiquement divisés selon les limites de Telegram. Les tableaux dépassant la limite de 20 colonnes sont remplacés par un bloc de code.

    Valeur par défaut : désactivé, pour assurer la compatibilité des clients — certains clients actuels pour ordinateur, Web, Android et tiers affichent les messages enrichis acceptés comme non pris en charge. Laissez cette option désactivée sauf si tous les clients utilisés avec le bot peuvent afficher ces messages. `/status` indique si les messages enrichis sont activés ou désactivés pour la session actuelle.

    Les aperçus de liens sont activés par défaut. `channels.telegram.linkPreview: false` désactive la détection automatique des entités pour le texte enrichi.

  </Accordion>

  <Accordion title="Commandes natives et commandes personnalisées">
    Le menu de commandes de Telegram est enregistré au démarrage avec `setMyCommands`. `commands.native: "auto"` active les commandes natives pour Telegram.

    Pour ajouter des entrées personnalisées au menu de commandes :

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

    Règles : les noms sont normalisés (suppression du préfixe `/`, conversion en minuscules) ; motif valide `a-z`, `0-9`, `_`, longueur de 1-32 ; les commandes personnalisées ne peuvent pas remplacer les commandes natives ; les conflits et doublons sont ignorés et consignés.

    Les commandes personnalisées ne sont que des entrées de menu — elles n’implémentent pas automatiquement de comportement. Les commandes de Plugin ou de compétence peuvent toujours fonctionner lorsqu’elles sont saisies, même si elles ne figurent pas dans le menu Telegram. Si les commandes natives sont désactivées, les commandes intégrées sont supprimées ; les commandes personnalisées ou de Plugin peuvent toujours être enregistrées si elles sont configurées.

    Échecs de configuration courants :

    - `setMyCommands failed` avec `BOT_COMMANDS_TOO_MUCH` après une nouvelle tentative de réduction signifie que le menu dépasse encore la limite ; réduisez le nombre de commandes de Plugin, de compétence ou personnalisées, ou désactivez `channels.telegram.commands.native`.
    - Si `deleteWebhook`, `deleteMyCommands` ou `setMyCommands` échoue avec `404: Not Found` alors que les commandes curl directes de Bot API fonctionnent, cela signifie généralement que `channels.telegram.apiRoot` a été défini sur le point de terminaison `/bot<TOKEN>` complet. `apiRoot` doit uniquement correspondre à la racine de Bot API ; `openclaw doctor --fix` supprime un suffixe `/bot<TOKEN>` ajouté par erreur.
    - `getMe returned 401` signifie que Telegram a rejeté le jeton de bot configuré. Mettez à jour `botToken`, `tokenFile` ou `TELEGRAM_BOT_TOKEN` (compte par défaut) avec le jeton BotFather actuel ; OpenClaw s’arrête avant l’interrogation afin que cette erreur ne soit pas signalée comme un échec de nettoyage du Webhook.
    - `setMyCommands failed` accompagné d’erreurs de réseau ou de récupération signifie généralement que les connexions DNS/HTTPS sortantes vers `api.telegram.org` sont bloquées.

    ### Commandes d’association d’appareils (Plugin `device-pair`)

    Une fois installé :

    1. `/pair` génère un code de configuration
    2. collez le code dans l’application iOS
    3. `/pair pending` répertorie les demandes en attente (y compris le rôle et les portées)
    4. approuver : `/pair approve <requestId>`, `/pair approve` (seule demande en attente) ou `/pair approve latest`

    Si un appareil effectue une nouvelle tentative avec des informations d’authentification modifiées (rôle, portées, clé publique), la demande précédente en attente est remplacée par une nouvelle demande `requestId` ; réexécutez `/pair pending` avant de l’approuver.

    Plus de détails : [Association](/fr/channels/pairing#pair-via-telegram).

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

    Portées : `off`, `dm`, `group`, `all`, `allowlist` (valeur par défaut). L’ancien `capabilities: ["inlineButtons"]` correspond à `"all"`.

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

    Exemple de bouton Mini App :

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Ouvrir l’application :",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Lancer", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    Les boutons `web_app` fonctionnent uniquement dans les discussions privées entre un utilisateur et le bot.

    Les clics de rappel non revendiqués par un gestionnaire interactif de plugin enregistré sont transmis à l’agent sous forme de texte : `callback_data: <value>`.

  </Accordion>

  <Accordion title="Actions sur les messages Telegram pour les agents et l’automatisation">
    Actions :

    - `sendMessage` (`to`, `content`, `mediaUrl` facultatif, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` ou `caption`, boutons intégrés `presentation` facultatifs ; les modifications portant uniquement sur les boutons mettent à jour le balisage de réponse)
    - `createForumTopic` (`chatId`, `name`, `iconColor` facultatif, `iconCustomEmojiId`)

    Alias pratiques : `send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`.

    Contrôle d’activation : `channels.telegram.actions.sendMessage`, `deleteMessage`, `reactions`, `sticker` (valeur par défaut : désactivé). `edit`, `createForumTopic` et `editForumTopic` sont activés par défaut sans option dédiée.
    Les envois à l’exécution utilisent l’instantané actif de la configuration et des secrets créé au démarrage ou au rechargement ; les chemins d’action ne résolvent donc pas à nouveau les valeurs `SecretRef` à chaque envoi.

    Sémantique de suppression des réactions : [/tools/reactions](/fr/tools/reactions).

  </Accordion>

  <Accordion title="Balises de fils de réponse">
    Balises explicites de fils de réponse dans la sortie générée :

    - `[[reply_to_current]]` — répond au message déclencheur
    - `[[reply_to:<id>]]` — répond à un ID de message précis

    `channels.telegram.replyToMode` : `off` (valeur par défaut), `first`, `all`.

    Lorsque les fils de réponse sont activés et que le texte ou la légende d’origine est disponible, OpenClaw ajoute automatiquement un extrait de citation natif. Telegram limite le texte des citations natives à 1024 unités de code UTF-16 ; les messages plus longs sont cités à partir du début et utilisent une réponse simple comme solution de repli si Telegram rejette la citation.

    `off` désactive uniquement les fils de réponse implicites ; les balises `[[reply_to_*]]` explicites sont toujours respectées.

  </Accordion>

  <Accordion title="Sujets de forum et comportement des fils">
    Supergroupes de forum : les clés de session des sujets ajoutent `:topic:<threadId>` ; les réponses et l’indicateur de saisie ciblent le fil du sujet ; le chemin de configuration du sujet est `channels.telegram.groups.<chatId>.topics.<threadId>`.

    Le sujet général (`threadId=1`) constitue un cas particulier : les envois de messages omettent `message_thread_id` (Telegram rejette `sendMessage(...thread_id=1)` avec « thread not found »), mais les actions de saisie incluent toujours `message_thread_id` (nécessaire empiriquement pour que l’indicateur de saisie apparaisse).

    Les entrées de sujet héritent des paramètres du groupe sauf s’ils sont remplacés (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`). `agentId` est propre aux sujets et n’hérite pas des valeurs par défaut du groupe. `topics."*"` définit les valeurs par défaut de chaque sujet de ce groupe ; les ID de sujet exacts restent prioritaires sur `"*"`.

    **Routage des agents par sujet** : chaque sujet peut être routé vers un agent différent au moyen de `agentId` dans la configuration du sujet, ce qui lui fournit son propre espace de travail, sa propre mémoire et sa propre session :

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Sujet général -> agent principal
                "3": { agentId: "zu" },        // Sujet de développement -> agent zu
                "5": { agentId: "coder" }      // Revue de code -> agent coder
              }
            }
          }
        }
      }
    }
    ```

    Chaque sujet possède alors sa propre clé de session, par exemple `agent:zu:telegram:group:-1001234567890:topic:3`.

    **Liaison persistante d’un sujet à ACP** : les sujets de forum peuvent épingler des sessions de harnais ACP au moyen de liaisons typées de premier niveau (`bindings[]` avec `type: "acp"`, `match.channel: "telegram"`, `peer.kind: "group"` et un ID qualifié par sujet tel que `-1001234567890:topic:42`). Cette fonctionnalité est actuellement limitée aux sujets de forum dans les groupes et supergroupes. Consultez [Agents ACP](/fr/tools/acp-agents).

    **Création d’une session ACP liée au fil depuis la discussion** : `/acp spawn <agent> --thread here|auto` lie le sujet actuel à une nouvelle session ACP ; les messages suivants y sont directement routés et OpenClaw épingle la confirmation de création dans le sujet. Nécessite `channels.telegram.threadBindings.spawnSessions` (valeur par défaut : `true`).

    Le contexte du modèle expose `MessageThreadId` et `IsForum`. Les discussions par message privé avec `message_thread_id` conservent les métadonnées de réponse, mais utilisent des clés de session tenant compte des fils uniquement lorsque `getMe` de Telegram indique `has_topics_enabled: true`.
    Les remplacements retirés `dm.threadReplies` et `direct.*.threadReplies` ont disparu ; le mode avec fils de BotFather constitue l’unique source de vérité. Exécutez `openclaw doctor --fix` pour supprimer les clés de configuration obsolètes.

  </Accordion>

  <Accordion title="Audio, vidéo et autocollants">
    ### Messages audio

    Telegram distingue les notes vocales des fichiers audio. Par défaut, le comportement est celui d’un fichier audio ; ajoutez la balise `[[audio_as_voice]]` dans la réponse de l’agent pour forcer l’envoi d’une note vocale. Les transcriptions de notes vocales entrantes sont présentées dans le contexte de l’agent comme du texte non fiable généré par une machine, mais la détection des mentions utilise toujours la transcription brute afin que les messages vocaux soumis à une exigence de mention continuent de fonctionner.

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

    Telegram distingue les fichiers vidéo des notes vidéo. Les notes vidéo ne prennent pas en charge les légendes ; le texte de message fourni est envoyé séparément.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    ### Emplacements et lieux

    Utilisez l’action `send` existante avec un seul objet `location` autonome. Les coordonnées envoient une épingle native ; l’ajout simultané de `name` et `address` envoie une fiche de lieu native. Les envois d’emplacement ne peuvent pas être combinés avec du texte de message ou un média.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  location: {
    latitude: 48.858844,
    longitude: 2.294351,
    accuracy: 12,
    name: "Tour Eiffel",
    address: "Champ de Mars, Paris",
  },
}
```

    ### Autocollants

    À la réception : les fichiers WEBP statiques sont téléchargés et traités (espace réservé `<media:sticker>`) ; les fichiers TGS animés et les vidéos WEBM sont ignorés.

    Champs de contexte des autocollants : `Sticker.emoji`, `Sticker.setName`, `Sticker.fileId`, `Sticker.fileUniqueId`, `Sticker.cachedDescription`. Les descriptions sont mises en cache dans l’état SQLite du plugin OpenClaw afin de réduire les appels répétés au modèle de vision.

    Activez les actions d’autocollant :

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

    Envoyer :

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
  query: "chat qui fait signe",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Notifications de réaction">
    Les réactions Telegram arrivent sous forme de mises à jour `message_reaction`, séparément des charges utiles des messages. Lorsqu’elles sont activées, OpenClaw place en file d’attente des événements système tels que `Telegram reaction added: 👍 by Alice (@alice) on msg 42`.

    - `channels.telegram.reactionNotifications` : `off | own | all` (valeur par défaut : `own`)
    - `channels.telegram.reactionLevel` : `off | ack | minimal | extensive` (valeur par défaut : `minimal`)

    `own` désigne uniquement les réactions des utilisateurs aux messages envoyés par le bot (au mieux, au moyen d’un cache des messages envoyés). Les événements de réaction respectent toujours les contrôles d’accès de Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) ; les expéditeurs non autorisés sont ignorés.

    Telegram ne fournit pas d’ID de fil dans les mises à jour de réaction : les groupes qui ne sont pas des forums sont routés vers la session de discussion du groupe ; les groupes de forum sont routés vers la session du sujet général (`:topic:1`), et non vers le sujet d’origine exact.

    `allowed_updates` pour l’interrogation ou le Webhook inclut automatiquement `message_reaction`.

  </Accordion>

  <Accordion title="Réactions d’accusé de réception">
    `ackReaction` envoie un emoji d’accusé de réception pendant qu’OpenClaw traite un message entrant. `messages.ackReactionScope` détermine *quand* il est envoyé.

    **Ordre de résolution de l’emoji :**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - emoji de secours de l’identité de l’agent (`agents.list[].identity.emoji`, sinon « 👀 »)

    Telegram attend un emoji Unicode (par exemple « 👀 ») ; utilisez `""` pour désactiver la réaction pour un canal ou un compte.

    **Portée (`messages.ackReactionScope`, valeur par défaut : `"group-mentions"` ; aucun remplacement propre au compte Telegram ou au canal Telegram actuellement) :**

    `all` (messages privés + groupes, y compris les événements ambiants de salon), `direct` (messages privés uniquement), `group-all` (tous les messages de groupe sauf les événements ambiants de salon, aucun message privé), `group-mentions` (groupes lorsque le bot est mentionné ; **aucun message privé** — valeur par défaut), `off` / `none` (désactivé).

    <Note>
    La portée par défaut (`group-mentions`) ne déclenche pas de réactions d’accusé de réception dans les messages privés ni pour les événements ambiants de salon. Utilisez `direct` ou `all` pour les messages privés ; seul `all` accuse réception des événements ambiants de salon. Cette valeur est lue au démarrage du fournisseur Telegram ; un redémarrage du Gateway est donc nécessaire pour que la modification prenne effet.
    </Note>

  </Accordion>

  <Accordion title="Écritures de configuration depuis les événements et commandes Telegram">
    Les écritures dans la configuration du canal sont activées par défaut (`configWrites !== false`). Les écritures déclenchées par Telegram comprennent les événements de migration de groupe (`migrate_to_chat_id`, met à jour `channels.telegram.groups`) ainsi que `/config set` / `/config unset` (nécessite l’activation des commandes).

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

  <Accordion title="Interrogation longue ou Webhook">
    Le mode par défaut est l’interrogation longue. Pour le mode Webhook, définissez `channels.telegram.webhookUrl` et `channels.telegram.webhookSecret` ; facultatifs : `webhookPath` (valeur par défaut : `/telegram-webhook`), `webhookHost` (valeur par défaut : `127.0.0.1`), `webhookPort` (valeur par défaut : `8787`), `webhookCertPath` (certificat PEM autosigné pour les configurations avec IP directe ou sans domaine).

    En mode d’interrogation longue, OpenClaw ne conserve son point de reprise après redémarrage qu’une fois qu’une mise à jour a été distribuée avec succès ; en cas d’échec d’un gestionnaire, cette mise à jour reste réessayable dans le même processus au lieu d’être marquée comme terminée.

    Par défaut, l’écouteur local se lie à `127.0.0.1:8787`. Pour une entrée publique, placez un proxy inverse devant le port local ou définissez délibérément `webhookHost: "0.0.0.0"`.

    Le mode Webhook valide les protections de la requête, le jeton secret Telegram et le corps JSON, puis enregistre la mise à jour dans sa file d’entrée durable avant de renvoyer un `200` vide. Une adoption durable réussie inclut `x-openclaw-delivery-accepted: durable` ; les réponses relatives à l’état de santé, au routage, à l’authentification, à la validation et aux erreurs de stockage omettent cet en-tête. Les proxys inverses et les contrôleurs d’hôte peuvent exiger cet en-tête pour distinguer l’adoption par OpenClaw d’un `200` vide générique, sans déduire l’acceptation du délai de réponse.

    OpenClaw traite ensuite la mise à jour de manière asynchrone au moyen des mêmes files de bot par discussion et par sujet que celles utilisées par l’interrogation longue ; les tours d’agent lents ne retardent donc pas l’accusé de réception de livraison de Telegram.

  </Accordion>

  <Accordion title="Limites, nouvelles tentatives et cibles CLI">
    - `channels.telegram.textChunkLimit` vaut 4000 par défaut ; `streaming.chunkMode="newline"` privilégie les limites de paragraphes (lignes vides) avant le découpage selon la longueur.
    - `channels.telegram.mediaMaxMb` (100 par défaut) limite la taille des médias entrants et sortants.
    - `channels.telegram.mediaGroupFlushMs` (500 par défaut, plage 10-60000) contrôle la durée de mise en mémoire tampon des albums/groupes de médias avant qu’OpenClaw ne les transmette sous forme d’un seul message entrant. Augmentez cette valeur si des éléments de l’album arrivent tardivement ; diminuez-la pour réduire la latence de réponse aux albums.
    - `channels.telegram.timeoutSeconds` remplace le délai d’expiration du client API (la valeur par défaut de grammY s’applique s’il n’est pas défini). Les clients de bot plafonnent les valeurs configurées inférieures à la garde de 60 secondes des requêtes sortantes de texte/de saisie afin que grammY n’interrompe pas la remise d’une réponse visible avant que la garde de transport et le mécanisme de repli d’OpenClaw puissent s’exécuter. L’interrogation longue utilise toujours une garde de requête `getUpdates` de 45 secondes afin que les interrogations inactives ne soient pas abandonnées indéfiniment.
    - `channels.telegram.pollingStallThresholdMs` vaut 120000 par défaut ; ajustez-la entre 30000 et 600000 uniquement en cas de redémarrages dus à de fausses détections de blocage de l’interrogation.
    - l’historique du contexte de groupe utilise `channels.telegram.historyLimit` ou `messages.groupChat.historyLimit` (50 par défaut) ; `0` le désactive.
    - le contexte supplémentaire de réponse/citation/transfert est normalisé dans une seule fenêtre de contexte de conversation sélectionnée lorsque le Gateway a observé les messages parents ; le cache des messages observés réside dans l’état SQLite du Plugin OpenClaw, et `openclaw doctor --fix` importe les fichiers annexes hérités. Telegram n’inclut qu’un seul `reply_to_message` superficiel par mise à jour ; les chaînes plus anciennes que le cache sont donc limitées à cette charge utile.
    - les listes d’autorisation Telegram déterminent principalement qui peut déclencher l’agent ; elles ne constituent pas une frontière complète de masquage du contexte supplémentaire.
    - historique des messages privés : `channels.telegram.dmHistoryLimit`, `channels.telegram.dms["<user_id>"].historyLimit`.
    - `channels.telegram.retry` s’applique aux utilitaires d’envoi Telegram (CLI/outils/actions) pour les erreurs récupérables de l’API sortante. La remise de la réponse finale entrante utilise une nouvelle tentative d’envoi sécurisé et limitée pour les échecs antérieurs à la connexion, mais ne réessaie pas les enveloppes réseau ambiguës postérieures à l’envoi, qui pourraient dupliquer les messages visibles.

    Les cibles d’envoi de la CLI et de l’outil de messagerie acceptent un identifiant numérique de discussion, un nom d’utilisateur ou une cible de sujet de forum :

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Les sondages utilisent `openclaw message poll` et prennent en charge les sujets de forum :

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Options de sondage propres à Telegram : `--poll-duration-seconds` (5-600), `--poll-anonymous`, `--poll-public`, `--thread-id` (ou une cible `:topic:`). `--poll-option` se répète de 2 à 12 fois (limite d’options de Telegram).

    L’envoi Telegram prend également en charge `--presentation` avec des blocs `buttons` pour les claviers intégrés (lorsque `channels.telegram.capabilities.inlineButtons` l’autorise), `--pin` ou `--delivery '{"pin":true}'` pour demander l’épinglage du message lorsque le bot peut épingler des messages dans cette discussion, et `--force-document` pour envoyer les images, GIF et vidéos sortants sous forme de documents plutôt que de téléversements compressés/animés/vidéo.

    Contrôle des actions : `channels.telegram.actions.sendMessage=false` désactive tous les messages sortants, y compris les sondages ; `channels.telegram.actions.poll=false` désactive la création de sondages tout en laissant les envois ordinaires activés.

  </Accordion>

  <Accordion title="Approbations d’exécution dans Telegram">
    Telegram prend en charge les approbations d’exécution dans les messages privés des approbateurs et peut facultativement publier les demandes dans la discussion ou le sujet d’origine. Les approbateurs doivent être des identifiants numériques d’utilisateurs Telegram.

    - `channels.telegram.execApprovals.enabled` (`"auto"` l’active lorsqu’au moins un approbateur peut être résolu)
    - `channels.telegram.execApprovals.approvers` (utilise à défaut les identifiants numériques des propriétaires provenant de `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target` : `dm` (par défaut) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` et `defaultTo` déterminent qui peut communiquer avec le bot et où celui-ci envoie les réponses ordinaires ; ils ne font pas d’une personne un approbateur d’exécution. Le premier appairage approuvé par message privé initialise `commands.ownerAllowFrom` lorsqu’aucun propriétaire de commande n’existe encore, afin que les configurations à propriétaire unique fonctionnent sans dupliquer les identifiants sous `execApprovals.approvers`.

    La remise dans le canal affiche le texte de la commande dans la discussion ; activez `channel` ou `both` uniquement dans des groupes/sujets de confiance. Lorsque la demande arrive dans un sujet de forum, OpenClaw conserve le sujet pour la demande d’approbation et le suivi. Les approbations d’exécution expirent après 30 minutes par défaut.

    Les boutons d’approbation intégrés nécessitent également que `channels.telegram.capabilities.inlineButtons` autorise la surface cible (`dm`, `group` ou `all`). Les identifiants d’approbation préfixés par `plugin:` sont résolus par les approbations de Plugin ; les autres sont d’abord résolus par les approbations d’exécution.

    Consultez [Approbations d’exécution](/fr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Contrôle des réponses d’erreur

Lorsque l’agent rencontre une erreur de remise ou de fournisseur, la politique d’erreur détermine si les messages d’erreur parviennent à la discussion Telegram :

| Clé                                 | Valeurs                     | Valeur par défaut         | Description                                                                                                                                                                                              |
| ----------------------------------- | -------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` envoie chaque message d’erreur dans la discussion. `once` envoie chaque message d’erreur unique une fois par fenêtre de temporisation (les erreurs identiques répétées sont supprimées). `silent` n’envoie jamais de message d’erreur dans la discussion. |
| `channels.telegram.errorCooldownMs` | nombre (ms)                | `14400000` (4h) | Fenêtre de temporisation de la politique `once`. Après l’envoi d’une erreur, le même message est supprimé jusqu’à l’expiration de cet intervalle. Cela évite la multiplication des erreurs pendant les interruptions de service.                                           |

Les remplacements par compte, par groupe et par sujet sont pris en charge (même héritage que pour les autres clés de configuration Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // supprimer les erreurs dans ce groupe
        },
      },
    },
  },
}
```

## Résolution des problèmes

<AccordionGroup>
  <Accordion title="Le bot ne répond pas aux messages de groupe sans mention">

    - Si `requireMention=false`, le mode de confidentialité de Telegram doit autoriser une visibilité complète : BotFather `/setprivacy` -> Disable, puis supprimez le bot du groupe et ajoutez-le à nouveau.
    - `openclaw channels status` émet un avertissement lorsque la configuration attend des messages de groupe sans mention.
    - `openclaw channels status --probe` vérifie les identifiants numériques explicites des groupes ; le caractère générique `"*"` ne permet pas de vérifier l’appartenance.
    - Test rapide de session : `/activation always`.

  </Accordion>

  <Accordion title="Le bot ne voit aucun message de groupe">

    - Lorsque `channels.telegram.groups` existe, le groupe doit être répertorié (ou inclure `"*"`).
    - Vérifiez que le bot appartient au groupe.
    - Consultez `openclaw logs --follow` pour connaître les motifs d’exclusion.

  </Accordion>

  <Accordion title="Les commandes fonctionnent partiellement ou pas du tout">

    - Autorisez l’identité de l’expéditeur (appairage et/ou `allowFrom` numérique) ; l’autorisation des commandes s’applique toujours, même lorsque la politique du groupe est `open`.
    - `setMyCommands failed` avec `BOT_COMMANDS_TOO_MUCH` signifie que le menu natif comporte trop d’entrées ; réduisez le nombre de commandes de Plugin/Skills/personnalisées ou désactivez les menus natifs.
    - Les appels de démarrage `deleteMyCommands` / `setMyCommands` et les appels de saisie `sendChatAction` sont limités et font l’objet d’une nouvelle tentative via le mécanisme de repli du transport Telegram en cas d’expiration de la requête. Les erreurs persistantes de réseau/récupération signifient généralement que `api.telegram.org` est inaccessible par DNS/HTTPS.

  </Accordion>

  <Accordion title="Le démarrage signale un jeton non autorisé">

    - `getMe returned 401` est un échec d’authentification Telegram pour le jeton de bot configuré. Copiez à nouveau ou régénérez le jeton dans BotFather, puis mettez à jour `channels.telegram.botToken`, `tokenFile`, `accounts.<id>.botToken` ou `TELEGRAM_BOT_TOKEN` (compte par défaut).
    - `deleteWebhook 401 Unauthorized` au démarrage est également un échec d’authentification ; le traiter comme « aucun Webhook n’existe » ne ferait que différer le même échec dû au jeton incorrect jusqu’à un appel API ultérieur.

  </Accordion>

  <Accordion title="Instabilité de l’interrogation ou du réseau">

    - Node 22+ avec un mécanisme de récupération/proxy personnalisé peut provoquer un abandon immédiat si les types `AbortSignal` ne correspondent pas.
    - Certains hôtes résolvent d’abord `api.telegram.org` en IPv6 ; une sortie IPv6 défectueuse provoque des échecs intermittents de l’API.
    - Les journaux contenant `TypeError: fetch failed` ou `Network request for 'getUpdates' failed!` font l’objet de nouvelles tentatives en tant qu’erreurs réseau récupérables.
    - Au démarrage de l’interrogation, OpenClaw réutilise pour grammY la sonde `getMe` ayant réussi au démarrage, afin que l’exécuteur n’ait pas besoin d’effectuer un second `getMe` avant le premier `getUpdates`.
    - Si `deleteWebhook` échoue en raison d’une erreur réseau temporaire au démarrage de l’interrogation, OpenClaw passe à l’interrogation longue au lieu d’effectuer un autre appel du plan de contrôle avant l’interrogation. Un Webhook encore actif se manifeste alors sous forme de conflit `getUpdates` ; OpenClaw reconstruit le transport et réessaie de nettoyer le Webhook.
    - Si les sockets Telegram sont renouvelés selon une cadence fixe et courte, recherchez une valeur `channels.telegram.timeoutSeconds` faible : les clients de bot plafonnent les valeurs configurées inférieures aux gardes de requête sortantes et `getUpdates`, mais les anciennes versions pouvaient interrompre chaque interrogation ou réponse lorsque cette valeur était inférieure à ces gardes.
    - `Polling stall detected` dans les journaux signifie qu’OpenClaw redémarre l’interrogation et reconstruit le transport après 120 secondes sans activité d’interrogation longue achevée par défaut.
    - `openclaw channels status --probe` et `openclaw doctor` émettent un avertissement lorsqu’un compte d’interrogation actif n’a pas achevé `getUpdates` après le délai de grâce du démarrage, qu’un compte Webhook actif n’a pas achevé `setWebhook` après le délai de grâce du démarrage, ou que la dernière activité réussie du transport d’interrogation est obsolète.
    - Augmentez `channels.telegram.pollingStallThresholdMs` uniquement lorsque les appels `getUpdates` de longue durée fonctionnent correctement, mais que votre hôte signale toujours de faux redémarrages dus au blocage de l’interrogation. Les blocages persistants indiquent généralement des problèmes de proxy, DNS, IPv6 ou de sortie TLS vers `api.telegram.org`.
    - Telegram respecte les variables d’environnement de proxy du processus pour le transport de l’API Bot : `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` et leurs variantes en minuscules. `NO_PROXY` / `no_proxy` peuvent toujours contourner `api.telegram.org`.
    - Si `OPENCLAW_PROXY_URL` est défini pour un environnement de service et qu’aucune variable d’environnement de proxy standard n’est présente, Telegram utilise également cette URL pour le transport de l’API Bot.
    - Sur les hôtes VPS dont la sortie directe/TLS est instable, acheminez les appels à l’API Telegram via un proxy :

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ utilise par défaut `autoSelectFamily=true` (sauf sous WSL2). L’ordre des résultats DNS de Telegram respecte `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, puis `channels.telegram.network.dnsResultOrder`, puis la valeur par défaut du processus (par exemple `NODE_OPTIONS=--dns-result-order=ipv4first`), avec un repli vers `ipv4first` sous Node 22+ si aucune ne s’applique.
    - Sous WSL2, ou lorsqu’un fonctionnement exclusivement en IPv4 donne de meilleurs résultats, forcez la sélection de la famille :

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Les réponses de la plage de référence RFC 2544 (`198.18.0.0/15`) sont déjà autorisées par défaut pour les téléchargements de médias Telegram. Si un proxy fake-IP ou transparent de confiance réécrit `api.telegram.org` vers une autre adresse privée/interne/à usage spécial pendant les téléchargements de médias, activez le contournement réservé à Telegram :

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - La même activation est disponible pour chaque compte dans `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Si votre proxy résout les hôtes de médias Telegram dans `198.18.x.x`, laissez d’abord l’option dangereuse désactivée — cette plage est déjà autorisée par défaut.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` affaiblit les protections SSRF des médias Telegram. Utilisez-la uniquement dans des environnements de proxy de confiance contrôlés par l’opérateur (routage fake-IP de Clash, Mihomo ou Surge) qui génèrent des réponses privées ou à usage spécial hors de la plage de référence RFC 2544. Laissez-la désactivée pour un accès normal à Telegram sur l’Internet public.
    </Warning>

    - Remplacements temporaires par variables d’environnement : `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`.
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

<Accordion title="Champs Telegram à forte valeur diagnostique">

- démarrage/authentification : `enabled`, `botToken`, `tokenFile` (doit être un fichier ordinaire ; les liens symboliques sont rejetés), `accounts.*`
- contrôle d’accès : `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` au niveau supérieur (`type: "acp"`)
- valeurs par défaut des sujets : `groups.<chatId>.topics."*"` s’applique aux sujets de forum sans correspondance ; les identifiants de sujet exacts la remplacent
- approbations d’exécution : `execApprovals`, `accounts.*.execApprovals`
- commande/menu : `commands.native`, `commands.nativeSkills`, `customCommands`
- fils de discussion/réponses : `replyToMode`, `threadBindings`
- diffusion en continu : `streaming` (modes `off | partial | block | progress`), `streaming.preview.toolProgress`
- mise en forme/remise : `textChunkLimit`, `streaming.chunkMode`, `richMessages`, `markdown.tables` (`off | bullets | code | block`), `linkPreview`, `responsePrefix`
- médias/réseau : `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- racine d’API personnalisée : `apiRoot` (racine de l’API Bot uniquement ; n’incluez pas `/bot<TOKEN>`), `trustedLocalFileRoots` (racines `file_path` absolues de l’API Bot auto-hébergée)
- Webhook : `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`, `webhookPort`, `webhookCertPath`
- actions/capacités : `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker|createForumTopic|editForumTopic`
- réactions : `reactionNotifications`, `reactionLevel`
- erreurs : `errorPolicy`, `errorCooldownMs`, `silentErrorReplies`
- écritures/historique : `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Priorité multicomptes : lorsque deux identifiants de compte ou plus sont configurés, définissez `channels.telegram.defaultAccount` (ou incluez `channels.telegram.accounts.default`) afin de rendre explicite le routage par défaut. Sinon, OpenClaw se replie sur le premier identifiant de compte normalisé et `openclaw doctor` émet un avertissement. Les comptes nommés héritent de `channels.telegram.allowFrom` / `groupAllowFrom`, mais pas des valeurs de `accounts.default.*`.
</Note>

## Pages connexes

<CardGroup cols={2}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    Appairez un utilisateur Telegram au Gateway.
  </Card>
  <Card title="Groupes" icon="users" href="/fr/channels/groups">
    Comportement des listes d’autorisation pour les groupes et les sujets.
  </Card>
  <Card title="Routage des canaux" icon="route" href="/fr/channels/channel-routing">
    Acheminez les messages entrants vers les agents.
  </Card>
  <Card title="Sécurité" icon="shield" href="/fr/gateway/security">
    Modèle de menace et renforcement de la sécurité.
  </Card>
  <Card title="Routage multi-agent" icon="sitemap" href="/fr/concepts/multi-agent">
    Associez les groupes et les sujets aux agents.
  </Card>
  <Card title="Dépannage" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostic intercanaux.
  </Card>
</CardGroup>
