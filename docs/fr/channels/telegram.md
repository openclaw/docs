---
read_when:
    - Développement de fonctionnalités Telegram ou de Webhooks
summary: État de la prise en charge, fonctionnalités et configuration des bots Telegram
title: Telegram
x-i18n:
    generated_at: "2026-07-12T15:08:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8aa81fb0a1bc2953305591f5b616e5caebfee24c5fab04737c5e2eaa02be4559
    source_path: channels/telegram.md
    workflow: 16
---

Prêt pour la production pour les messages privés et les groupes de bots via grammY. L’interrogation longue est le transport par défaut ; le mode Webhook est facultatif.

<CardGroup cols={3}>
  <Card title="Association" icon="link" href="/fr/channels/pairing">
    La politique par défaut pour les messages privés Telegram est l’association.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics intercanaux et procédures de réparation.
  </Card>
  <Card title="Configuration du Gateway" icon="settings" href="/fr/gateway/configuration">
    Modèles et exemples complets de configuration des canaux.
  </Card>
</CardGroup>

## Configuration rapide

<Steps>
  <Step title="Créer le jeton du bot dans BotFather">
    Les deux méthodes fournissent un jeton à coller dans OpenClaw — choisissez-en une :

    - **Méthode par discussion** : ouvrez Telegram, discutez avec **@BotFather** (vérifiez que l’identifiant est exactement `@BotFather`), exécutez `/newbot`, suivez les instructions et enregistrez le jeton.
    - **Méthode web** : ouvrez [l’application web de BotFather](https://t.me/BotFather?startapp) — elle fonctionne dans tous les clients Telegram, notamment [web.telegram.org](https://web.telegram.org) — créez le bot dans l’interface et copiez son jeton.

  </Step>

  <Step title="Configurer le jeton et la politique des messages privés">

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

    Les codes d’association expirent après 1 heure.

  </Step>

  <Step title="Ajouter le bot à un groupe">
    Ajoutez le bot à votre groupe, puis récupérez les deux identifiants nécessaires à l’accès au groupe :

    - votre identifiant utilisateur Telegram, pour `allowFrom` / `groupAllowFrom`
    - l’identifiant de discussion du groupe Telegram, utilisé comme clé sous `channels.telegram.groups`

    Récupérez l’identifiant de discussion du groupe à partir de `openclaw logs --follow`, d’un bot d’identification des messages transférés ou de `getUpdates` dans l’API Bot. Une fois le groupe autorisé, `/whoami@<bot_username>` confirme les identifiants de l’utilisateur et du groupe.

    Les identifiants négatifs de supergroupes commençant par `-100` sont des identifiants de discussion de groupe. Ils doivent figurer sous `channels.telegram.groups`, et non dans `groupAllowFrom`.

  </Step>
</Steps>

<Note>
La résolution des jetons tient compte du compte : `tokenFile` prévaut sur `botToken`, qui prévaut sur la variable d’environnement, et la configuration prévaut toujours sur `TELEGRAM_BOT_TOKEN` (qui ne s’applique qu’au compte par défaut). Après un démarrage réussi, OpenClaw met en cache l’identité du bot pendant un maximum de 24 heures afin que les redémarrages évitent un appel `getMe` supplémentaire ; la modification ou la suppression du jeton efface ce cache.
</Note>

## Paramètres côté Telegram

<AccordionGroup>
  <Accordion title="Mode de confidentialité et visibilité dans les groupes">
    Les bots Telegram utilisent par défaut le **mode de confidentialité**, qui limite les messages de groupe qu’ils reçoivent.

    Pour voir tous les messages de groupe, vous pouvez :

    - désactiver le mode de confidentialité avec `/setprivacy`, ou
    - nommer le bot administrateur du groupe.

    Après avoir modifié le mode de confidentialité, supprimez puis rajoutez le bot dans chaque groupe afin que Telegram applique la modification.

  </Accordion>

  <Accordion title="Autorisations de groupe">
    Le statut d’administrateur se gère dans les paramètres du groupe Telegram. Les bots administrateurs reçoivent tous les messages du groupe, ce qui est utile pour un fonctionnement permanent dans les groupes.
  </Accordion>

  <Accordion title="Options BotFather utiles">

    - `/setjoingroups` — autoriser ou refuser l’ajout aux groupes
    - `/setprivacy` — comportement de visibilité dans les groupes

    Les mêmes paramètres sont disponibles dans [l’application web de BotFather](https://t.me/BotFather?startapp) si vous préférez une interface aux commandes de discussion.

  </Accordion>
</AccordionGroup>

## Mini App du tableau de bord

Exécutez `/dashboard` dans un message privé avec le bot pour ouvrir le tableau de bord OpenClaw dans Telegram.

Prérequis :

- `gateway.tailscale.mode: "serve"` ou `"funnel"` pour l’URL HTTPS publiée de la Mini App.
- Votre identifiant utilisateur Telegram numérique doit figurer dans la valeur effective de `allowFrom` du compte sélectionné ou dans `commands.ownerAllowFrom`.
- Utilisez un message privé. Dans les groupes, `/dashboard` répond avec `open this in a DM with the bot` et n’envoie aucun bouton.
- Installations Docker : les modes Serve/Funnel exigent que le Gateway se lie à l’interface de bouclage à côté de `tailscaled`, ce que la mise en réseau par pont avec des ports publiés ne permet pas. Exécutez le conteneur du Gateway avec `network_mode: host` et montez dans le conteneur le socket `tailscaled` de l’hôte (`/var/run/tailscale`) ainsi que la CLI `tailscale`.

La Mini App est un chemin v1 réservé à Tailscale et ne prend pas en charge l’iframe Telegram Web.

## Contrôle d’accès et activation

### Identité du bot dans les groupes

Dans les groupes et les sujets de forum, une mention explicite de l’identifiant configuré du bot (par exemple `@my_bot`) s’adresse à l’agent OpenClaw sélectionné, même si le nom de persona de l’agent diffère du nom d’utilisateur Telegram. La politique de silence dans les groupes continue de s’appliquer au trafic sans rapport, mais l’identifiant du bot n’est jamais « quelqu’un d’autre ».

<Tabs>
  <Tab title="Politique des messages privés">
    `channels.telegram.dmPolicy` contrôle l’accès aux messages privés :

    - `pairing` (par défaut)
    - `allowlist` (nécessite au moins un ID d’expéditeur dans `allowFrom`)
    - `open` (nécessite que `allowFrom` contienne `"*"`)
    - `disabled`

    `dmPolicy: "open"` avec `allowFrom: ["*"]` permet à tout compte Telegram qui trouve ou devine le nom d’utilisateur du bot de lui envoyer des commandes. Utilisez cette configuration uniquement pour des bots volontairement publics dont les outils sont strictement restreints ; les bots à propriétaire unique doivent utiliser `allowlist` avec des ID utilisateur numériques.

    `channels.telegram.allowFrom` accepte les ID utilisateur numériques de Telegram. Les préfixes `telegram:` / `tg:` sont acceptés et normalisés.
    Dans les configurations multicomptes, une valeur restrictive de `channels.telegram.allowFrom` au niveau supérieur constitue une limite de sécurité : une valeur `allowFrom: ["*"]` au niveau d’un compte ne rend pas ce compte public, sauf si la liste d’autorisation effective après fusion contient toujours explicitement un caractère générique.
    `dmPolicy: "allowlist"` avec une valeur `allowFrom` vide bloque tous les messages privés et est rejeté par la validation de la configuration.
    La configuration initiale demande uniquement des ID utilisateur numériques. Si votre configuration contient des entrées de liste d’autorisation sous la forme `@username` provenant d’une ancienne configuration initiale, exécutez `openclaw doctor --fix` pour les convertir en ID numériques (dans la mesure du possible ; nécessite un jeton de bot Telegram).
    Si vous utilisiez auparavant les fichiers de liste d’autorisation du magasin d’appairage, `openclaw doctor --fix` peut récupérer les entrées dans `channels.telegram.allowFrom` pour les flux utilisant une liste d’autorisation (par exemple, lorsque `dmPolicy: "allowlist"` ne contient encore aucun ID explicite).

    Pour les bots à propriétaire unique, préférez `dmPolicy: "allowlist"` avec des ID numériques explicites dans `allowFrom` plutôt que de dépendre d’approbations d’appairage antérieures.

    Confusion fréquente : l’approbation d’un appairage par message privé ne signifie pas « cet expéditeur est autorisé partout ». L’appairage accorde uniquement l’accès aux messages privés. S’il n’existe encore aucun propriétaire de commandes, le premier appairage approuvé définit également `commands.ownerAllowFrom`, ce qui attribue les commandes réservées au propriétaire et les approbations d’exécution à un compte opérateur explicite. L’autorisation des expéditeurs dans les groupes provient toujours de listes d’autorisation explicites dans la configuration.
    Pour être autorisé avec une même identité à la fois dans les messages privés et pour les commandes de groupe : ajoutez votre ID utilisateur numérique Telegram à `channels.telegram.allowFrom` et, pour les commandes réservées au propriétaire, vérifiez que `commands.ownerAllowFrom` contient `telegram:<your user id>`.

    ### Trouver votre ID utilisateur Telegram

    Méthode plus sûre (sans bot tiers) : envoyez un message privé à votre bot, exécutez `openclaw logs --follow`, puis consultez `from.id`.

    Méthode officielle de l’API Bot :

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Services tiers (moins confidentiels) : `@userinfobot` ou `@getidsbot`.

  </Tab>

  <Tab title="Politique de groupe et listes d’autorisation">
    Deux contrôles s’appliquent conjointement :

    1. **Quels groupes sont autorisés** (`channels.telegram.groups`)
       - aucune configuration `groups`, `groupPolicy: "open"` : tous les groupes passent les vérifications d’ID de groupe
       - aucune configuration `groups`, `groupPolicy: "allowlist"` (par défaut) : tous les groupes sont bloqués jusqu’à l’ajout d’entrées dans `groups` (ou de `"*"`)
       - `groups` configuré : agit comme une liste d’autorisation (ID explicites ou `"*"`)

    2. **Quels expéditeurs sont autorisés dans les groupes** (`channels.telegram.groupPolicy`)
       - `open` / `allowlist` (par défaut) / `disabled`

    `groupAllowFrom` filtre les expéditeurs des groupes ; s’il n’est pas défini, Telegram se rabat sur `allowFrom` (et non sur le magasin d’appairage — l’autorisation des expéditeurs de groupe n’hérite jamais des approbations du magasin d’appairage des messages privés, une limite de sécurité depuis `2026.2.25`).
    Les entrées de `groupAllowFrom` doivent être des ID utilisateur numériques de Telegram (les préfixes `telegram:` / `tg:` sont normalisés) ; les entrées non numériques sont ignorées. N’y placez pas d’ID de discussion de groupe ou de supergroupe : les ID de discussion négatifs doivent être placés sous `channels.telegram.groups`.
    Modèle pratique pour les bots à propriétaire unique : définissez votre ID utilisateur dans `channels.telegram.allowFrom`, laissez `groupAllowFrom` non défini et autorisez les groupes cibles sous `channels.telegram.groups`.
    Si `channels.telegram` est entièrement absent de la configuration, l’environnement d’exécution utilise par défaut le mode fermé `groupPolicy="allowlist"`, sauf si `channels.defaults.groupPolicy` est explicitement défini.

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

    Testez depuis le groupe avec `@<bot_username> ping`. Les messages de groupe ordinaires ne déclenchent pas le bot tant que `requireMention: true`.

    Autoriser tous les membres dans un groupe précis :

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

      - Les ID de discussion négatifs des groupes et supergroupes Telegram (`-1001234567890`) doivent être placés sous `channels.telegram.groups`.
      - Les ID utilisateur Telegram (`8734062810`) doivent être placés sous `groupAllowFrom` pour limiter les personnes qui, dans un groupe autorisé, peuvent déclencher le bot.
      - Utilisez `groupAllowFrom: ["*"]` uniquement pour permettre à n’importe quel membre d’un groupe autorisé de parler au bot.

    </Warning>

  </Tab>

  <Tab title="Comportement des mentions">
    Par défaut, les réponses dans les groupes nécessitent une mention. Une mention peut provenir :

    - d’une mention native `@botusername`, ou
    - d’un modèle de mention dans `agents.list[].groupChat.mentionPatterns` ou `messages.groupChat.mentionPatterns`

    Options au niveau de la session (état uniquement, non persistant) : `/activation always`, `/activation mention`. Utilisez la configuration pour rendre ce réglage persistant :

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

    Le contexte de l’historique du groupe est toujours activé et limité par `historyLimit`. Définissez `channels.telegram.historyLimit: 0` pour désactiver la fenêtre d’historique du groupe. `openclaw doctor --fix` supprime la clé retirée `includeGroupHistoryContext`.

    Pour obtenir l’ID de discussion du groupe : transférez un message du groupe à `@userinfobot` / `@getidsbot`, consultez `chat.id` dans `openclaw logs --follow`, inspectez `getUpdates` dans l’API Bot ou, une fois le groupe autorisé, exécutez `/whoami@<bot_username>`.

  </Tab>
</Tabs>

## Comportement de l’environnement d’exécution

- Telegram s’exécute dans le processus du Gateway.
- Le routage est déterministe : les réponses aux messages entrants de Telegram sont renvoyées à Telegram (le modèle ne choisit pas les canaux).
- Les messages entrants sont normalisés dans l’enveloppe de canal partagée, avec les métadonnées de réponse, les espaces réservés aux médias et le contexte persistant de la chaîne de réponses pour les réponses observées par le Gateway.
- Les sessions de groupe sont isolées par ID de groupe. Les sujets de forum ajoutent `:topic:<threadId>`.
- Les messages privés peuvent contenir `message_thread_id` ; OpenClaw le conserve pour les réponses. Les sessions de sujets en message privé ne sont séparées que lorsque `getMe` de Telegram indique `has_topics_enabled: true` pour le bot ; sinon, les messages privés restent dans la session non segmentée.
- L’interrogation longue utilise le runner grammY avec un séquençage par discussion et par fil. La concurrence du récepteur du runner utilise `agents.defaults.maxConcurrent`.
- Au démarrage avec plusieurs comptes, le nombre de sondes `getMe` simultanées est limité afin que les grandes flottes de bots ne lancent pas toutes les sondes de compte en même temps.
- Chaque processus du Gateway protège l’interrogation longue afin qu’un seul poller actif puisse utiliser un jeton de bot à la fois. Des conflits `getUpdates` 409 persistants indiquent qu’un autre Gateway OpenClaw, un script ou un poller externe utilise le même jeton.
- Par défaut, le mécanisme de surveillance de l’interrogation redémarre après 120 secondes sans signe de fonctionnement de `getUpdates` terminé. Augmentez `channels.telegram.pollingStallThresholdMs` (30000-600000, remplacements par compte pris en charge) uniquement si votre déploiement subit de faux redémarrages pour blocage de l’interrogation pendant des tâches de longue durée.
- L’API Telegram Bot ne prend pas en charge les accusés de lecture (`sendReadReceipts` ne s’applique pas).

<Note>
  `channels.telegram.dm.threadReplies` et `channels.telegram.direct.<chatId>.threadReplies` ont été supprimés. Exécutez `openclaw doctor --fix` après la mise à niveau si votre configuration contient encore ces clés. Le routage des sujets de messages privés suit désormais `getMe.has_topics_enabled` de Telegram (contrôlé par le mode avec fils de discussion de BotFather) : les bots pour lesquels les sujets sont activés utilisent des sessions de messages privés limitées au fil lorsque Telegram envoie `message_thread_id` ; les autres messages privés restent dans la session non segmentée.
</Note>

## Référence des fonctionnalités

<AccordionGroup>
  <Accordion title="Aperçu du flux en direct (modifications de message)">
    OpenClaw diffuse les réponses partielles en temps réel dans les discussions directes, les groupes et les sujets : il envoie un message d’aperçu, puis appelle `editMessageText` à plusieurs reprises avant de finaliser le message sur place.

    - `channels.telegram.streaming` accepte `off | partial | block | progress` (valeur par défaut : `partial`)
    - les courts aperçus initiaux de réponse sont temporisés, puis matérialisés après un délai limité si l’exécution est toujours active
    - `progress` conserve un seul brouillon d’état modifiable pour la progression des outils, affiche le libellé d’état stable lorsque l’activité de réponse arrive avant la progression des outils, l’efface à la fin et envoie la réponse finale comme un message normal
    - `streaming.preview.toolProgress` détermine si les mises à jour des outils/de progression réutilisent le même message d’aperçu modifié (valeur par défaut : `true` lorsque la diffusion de l’aperçu est active)
    - `streaming.preview.commandText` contrôle les détails des commandes/exécutions dans ces lignes : `raw` (valeur par défaut) ou `status` (libellé de l’outil uniquement)
    - `streaming.progress.commentary` (valeur par défaut : `false`) permet d’inclure les commentaires/préambules de l’assistant dans le brouillon de progression temporaire
    - les anciennes clés `channels.telegram.streamMode`, les valeurs booléennes de `streaming` et les clés retirées de l’aperçu natif des brouillons sont détectées ; exécutez `openclaw doctor --fix` pour les migrer

    Les lignes de progression des outils sont les courtes mises à jour d’état affichées pendant l’exécution des outils (exécution de commandes, lecture de fichiers, mises à jour de planification, résumés de correctifs, préambule/commentaires de Codex en mode serveur d’application). Telegram les conserve activées par défaut (ce qui correspond au comportement publié depuis `v2026.4.22`+).

    Conservez les modifications de l’aperçu de réponse, mais masquez les lignes de progression des outils :

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

    Conservez la progression des outils visible, mais masquez le texte des commandes/exécutions :

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

    Le mode `progress` affiche la progression des outils sans modifier ce message pour y insérer la réponse finale. Placez la stratégie relative au texte des commandes sous `streaming.progress` :

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

    `streaming.mode: "off"` désactive les modifications de l’aperçu et supprime les messages génériques liés aux outils/à la progression au lieu de les envoyer comme messages d’état autonomes ; les demandes d’approbation, les médias et les erreurs suivent toujours le processus normal de livraison finale. `streaming.preview.toolProgress: false` conserve uniquement les modifications de l’aperçu de réponse.

    <Note>
      Les réponses à une citation sélectionnée constituent l’exception. Lorsque `replyToMode` vaut `first`, `all` ou `batched` et que le message entrant contient du texte de citation sélectionné, OpenClaw envoie la réponse finale par le mécanisme natif de réponse avec citation de Telegram au lieu de modifier l’aperçu de réponse ; `streaming.preview.toolProgress` ne peut donc pas afficher de lignes d’état pour cette interaction. Les réponses au message actuel sans texte de citation sélectionné continuent d’être diffusées. Définissez `replyToMode: "off"` lorsque la visibilité de la progression des outils est plus importante que les réponses natives avec citation, ou `streaming.preview.toolProgress: false` pour accepter ce compromis.
    </Note>

    Pour les réponses textuelles uniquement : les aperçus courts reçoivent la modification finale sur place ; les réponses finales longues divisées en plusieurs messages réutilisent l’aperçu comme premier segment, puis envoient uniquement le reste ; les réponses finales en mode progression effacent le brouillon d’état et utilisent la livraison finale normale ; si la modification finale échoue avant que son achèvement soit confirmé, OpenClaw revient à la livraison finale normale et nettoie l’aperçu obsolète. Pour les réponses complexes (charges utiles multimédias), OpenClaw revient toujours à la livraison finale normale et nettoie l’aperçu.

    La diffusion de l’aperçu et la diffusion par blocs sont mutuellement exclusives — lorsque la diffusion par blocs est explicitement activée, OpenClaw ignore le flux d’aperçu afin d’éviter une double diffusion.

    Raisonnement : `/reasoning stream` diffuse le raisonnement dans l’aperçu en direct pendant la génération, puis supprime l’aperçu du raisonnement après la livraison finale (utilisez `/reasoning on` pour le garder visible). La réponse finale est envoyée sans le texte du raisonnement.

  </Accordion>

  <Accordion title="Mise en forme enrichie des messages">
    Par défaut, le texte sortant utilise les messages HTML standard de Telegram, lisibles sur les clients actuels : gras, italique, liens, code, divulgâcheurs, citations — et non les blocs enrichis exclusifs de l’API Bot 10.1 (tableaux natifs, détails, médias enrichis, formules).

    Activez les messages enrichis de l’API Bot 10.1 :

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    Lorsque cette option est activée : l’agent est informé que les messages enrichis sont disponibles pour ce bot/compte ; le texte Markdown est rendu sous forme de HTML enrichi Telegram au moyen de la représentation intermédiaire Markdown d’OpenClaw ; les charges utiles HTML enrichies explicites conservent les balises prises en charge par l’API Bot 10.1 (titres, tableaux, détails, médias enrichis, formules) ; les légendes des médias utilisent toujours les légendes HTML de Telegram (les messages enrichis ne remplacent pas les légendes, qui restent limitées à 1024 caractères).

    Cela évite que le texte du modèle soit interprété selon les marqueurs Markdown enrichis de Telegram, afin que des montants comme `$400-600K` ne soient pas analysés comme des expressions mathématiques. Le texte enrichi long est automatiquement divisé selon les limites de Telegram. Les tableaux dépassant la limite de 20 colonnes sont convertis en bloc de code.

    Valeur par défaut : désactivé, pour assurer la compatibilité avec les clients — certains clients actuels pour ordinateur, Web, Android et tiers affichent les messages enrichis acceptés comme non pris en charge. Laissez cette option désactivée sauf si tous les clients utilisés avec le bot peuvent afficher ces messages. `/status` indique si les messages enrichis sont activés ou désactivés pour la session actuelle.

    Les aperçus de liens sont activés par défaut. `channels.telegram.linkPreview: false` désactive la détection automatique des entités dans le texte enrichi.

  </Accordion>

  <Accordion title="Commandes natives et commandes personnalisées">
    Le menu des commandes de Telegram est enregistré au démarrage avec `setMyCommands`. `commands.native: "auto"` active les commandes natives pour Telegram.

    Ajoutez des entrées personnalisées au menu des commandes :

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

    Règles : les noms sont normalisés (suppression du `/` initial, conversion en minuscules) ; motif valide : `a-z`, `0-9`, `_` ; longueur de 1 à 32 ; les commandes personnalisées ne peuvent pas remplacer les commandes natives ; les conflits et doublons sont ignorés et consignés dans les journaux.

    Les commandes personnalisées sont uniquement des entrées de menu : elles n’implémentent pas automatiquement de comportement. Les commandes de Plugin/Skills peuvent toujours fonctionner lorsqu’elles sont saisies, même si elles ne figurent pas dans le menu Telegram. Si les commandes natives sont désactivées, les commandes intégrées sont supprimées ; les commandes personnalisées ou de Plugin peuvent toujours être enregistrées si elles sont configurées.

    Échecs de configuration courants :

    - `setMyCommands failed` avec `BOT_COMMANDS_TOO_MUCH` après une nouvelle tentative de réduction signifie que le menu déborde toujours ; réduisez les commandes de plugins, de Skills ou personnalisées, ou désactivez `channels.telegram.commands.native`.
    - L’échec de `deleteWebhook`, `deleteMyCommands` ou `setMyCommands` avec `404: Not Found`, alors que les commandes curl directes de la Bot API fonctionnent, signifie généralement que `channels.telegram.apiRoot` a été défini sur le point de terminaison `/bot<TOKEN>` complet. `apiRoot` doit uniquement être la racine de la Bot API ; `openclaw doctor --fix` supprime un `/bot<TOKEN>` final ajouté par erreur.
    - `getMe returned 401` signifie que Telegram a rejeté le jeton de bot configuré. Mettez à jour `botToken`, `tokenFile` ou `TELEGRAM_BOT_TOKEN` (compte par défaut) avec le jeton BotFather actuel ; OpenClaw s’arrête avant l’interrogation, ce qui évite de signaler cette erreur comme un échec du nettoyage du Webhook.
    - `setMyCommands failed` accompagné d’erreurs réseau ou de récupération signifie généralement que les connexions DNS/HTTPS sortantes vers `api.telegram.org` sont bloquées.

    ### Commandes d’association d’appareils (plugin `device-pair`)

    Lorsqu’il est installé :

    1. `/pair` génère un code de configuration
    2. collez le code dans l’application iOS
    3. `/pair pending` répertorie les demandes en attente (y compris le rôle et les périmètres)
    4. approuvez : `/pair approve <requestId>`, `/pair approve` (s’il n’y a qu’une seule demande en attente) ou `/pair approve latest`

    Si un appareil réessaie avec des informations d’authentification modifiées (rôle, périmètres, clé publique), la demande précédente en attente est remplacée par une nouvelle demande dotée d’un nouveau `requestId` ; exécutez à nouveau `/pair pending` avant de l’approuver.

    Plus de détails : [Association](/fr/channels/pairing#pair-via-telegram).

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

    Portées : `off`, `dm`, `group`, `all`, `allowlist` (par défaut). L’ancienne syntaxe `capabilities: ["inlineButtons"]` correspond à `"all"`.

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

    Exemple de bouton de mini-application :

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

    Les clics de rappel qui ne sont pas pris en charge par un gestionnaire interactif de Plugin enregistré sont transmis à l’agent sous forme de texte : `callback_data: <value>`.

  </Accordion>

  <Accordion title="Actions de message Telegram pour les agents et l’automatisation">
    Actions :

    - `sendMessage` (`to`, `content`, `mediaUrl` facultatif, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` ou `caption`, boutons intégrés `presentation` facultatifs ; les modifications portant uniquement sur les boutons mettent à jour le balisage de réponse)
    - `createForumTopic` (`chatId`, `name`, `iconColor` facultatif, `iconCustomEmojiId`)

    Alias ergonomiques : `send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`.

    Activation : `channels.telegram.actions.sendMessage`, `deleteMessage`, `reactions`, `sticker` (par défaut : désactivé). `edit`, `createForumTopic` et `editForumTopic` sont activés par défaut, sans option dédiée.
    Les envois à l’exécution utilisent l’instantané actif de la configuration et des secrets issu du démarrage ou du rechargement ; les chemins d’action ne résolvent donc pas à nouveau les valeurs `SecretRef` à chaque envoi.

    Sémantique de suppression des réactions : [/tools/reactions](/fr/tools/reactions).

  </Accordion>

  <Accordion title="Balises de fil de réponses">
    Balises explicites de fil de réponses dans la sortie générée :

    - `[[reply_to_current]]` — répond au message déclencheur
    - `[[reply_to:<id>]]` — répond à un ID de message précis

    `channels.telegram.replyToMode` : `off` (par défaut), `first`, `all`.

    Lorsque le fil de réponses est activé et que le texte ou la légende d’origine est disponible, OpenClaw ajoute automatiquement un extrait sous forme de citation native. Telegram limite le texte des citations natives à 1024 unités de code UTF-16 ; les messages plus longs sont cités à partir du début et utilisent une réponse simple si Telegram rejette la citation.

    `off` désactive uniquement le fil de réponses implicite ; les balises explicites `[[reply_to_*]]` restent prises en compte.

  </Accordion>

  <Accordion title="Sujets de forum et comportement des fils">
    Supergroupes de forum : les clés de session des sujets ajoutent `:topic:<threadId>` ; les réponses et l’indicateur de saisie ciblent le fil du sujet ; le chemin de configuration du sujet est `channels.telegram.groups.<chatId>.topics.<threadId>`.

    Le sujet général (`threadId=1`) constitue un cas particulier : les envois de messages omettent `message_thread_id` (Telegram rejette `sendMessage(...thread_id=1)` avec « fil introuvable »), mais les actions de saisie incluent toujours `message_thread_id` (nécessaire empiriquement pour que l’indicateur de saisie apparaisse).

    Les entrées de sujet héritent des paramètres du groupe, sauf remplacement (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`). `agentId` est propre au sujet et n’hérite pas des valeurs par défaut du groupe. `topics."*"` définit les valeurs par défaut de chaque sujet de ce groupe ; les ID de sujet exacts restent prioritaires sur `"*"`.

    **Routage de l’agent par sujet** : chaque sujet peut être routé vers un agent différent au moyen de `agentId` dans la configuration du sujet, ce qui lui attribue son propre espace de travail, sa propre mémoire et sa propre session :

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

    Chaque sujet dispose alors de sa propre clé de session, par exemple `agent:zu:telegram:group:-1001234567890:topic:3`.

    **Liaison persistante d’un sujet ACP** : les sujets de forum peuvent épingler des sessions de harnais ACP au moyen de liaisons typées de premier niveau (`bindings[]` avec `type: "acp"`, `match.channel: "telegram"`, `peer.kind: "group"` et un ID qualifié par sujet tel que `-1001234567890:topic:42`). Actuellement limité aux sujets de forum dans les groupes et supergroupes. Consultez [Agents ACP](/fr/tools/acp-agents).

    **Création d’une session ACP liée au fil depuis la discussion** : `/acp spawn <agent> --thread here|auto` lie le sujet actuel à une nouvelle session ACP ; les messages suivants y sont routés directement et OpenClaw épingle la confirmation de création dans le sujet. Nécessite `channels.telegram.threadBindings.spawnSessions` (par défaut : `true`).

    Le contexte de modèle expose `MessageThreadId` et `IsForum`. Les discussions en message privé comportant `message_thread_id` conservent les métadonnées de réponse, mais n’utilisent des clés de session tenant compte du fil que lorsque `getMe` de Telegram indique `has_topics_enabled: true`.
    Les anciens remplacements `dm.threadReplies` et `direct.*.threadReplies` ont été supprimés ; le mode avec fils de BotFather constitue l’unique source de vérité. Exécutez `openclaw doctor --fix` pour supprimer les clés de configuration obsolètes.

  </Accordion>

  <Accordion title="Audio, vidéo et autocollants">
    ### Messages audio

    Telegram distingue les messages vocaux des fichiers audio. Par défaut : comportement de fichier audio ; ajoutez la balise `[[audio_as_voice]]` dans la réponse de l’agent pour forcer l’envoi sous forme de message vocal. Les transcriptions de messages vocaux entrants sont présentées comme du texte généré par une machine et non fiable dans le contexte de l’agent, mais la détection des mentions utilise toujours la transcription brute afin que les messages vocaux soumis à l’exigence de mention continuent de fonctionner.

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

    Telegram distingue les fichiers vidéo des messages vidéo. Les messages vidéo ne prennent pas en charge les légendes ; le texte de message fourni est envoyé séparément.

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

    Utilisez l’action `send` existante avec un objet `location` autonome. Les coordonnées envoient une épingle native ; l’ajout de `name` et de `address` envoie une fiche de lieu native. Les envois d’emplacement ne peuvent pas être combinés avec du texte de message ou un média.

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

    Entrants : le format WEBP statique est téléchargé et traité (espace réservé `<media:sticker>`) ; les formats TGS animés et WEBM vidéo sont ignorés.

    Champs de contexte des stickers : `Sticker.emoji`, `Sticker.setName`, `Sticker.fileId`, `Sticker.fileUniqueId`, `Sticker.cachedDescription`. Les descriptions sont mises en cache dans l’état SQLite du Plugin OpenClaw afin de réduire les appels répétés au service de vision.

    Activez les actions sur les stickers :

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

    Envoyez :

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Recherchez dans les stickers mis en cache :

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "chat qui fait signe",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Notifications de réactions">
    Les réactions Telegram arrivent sous forme de mises à jour `message_reaction`, distinctes des charges utiles des messages. Lorsqu’elles sont activées, OpenClaw met en file d’attente des événements système tels que `Telegram reaction added: 👍 by Alice (@alice) on msg 42`.

    - `channels.telegram.reactionNotifications`: `off | own | all` (par défaut : `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (par défaut : `minimal`)

    `own` désigne uniquement les réactions des utilisateurs aux messages envoyés par le bot (au mieux, via un cache des messages envoyés). Les événements de réaction respectent toujours les contrôles d’accès Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) ; les expéditeurs non autorisés sont ignorés.

    Telegram ne fournit pas d’identifiants de fil de discussion dans les mises à jour de réactions : les groupes sans forum sont acheminés vers la session de discussion du groupe ; les groupes avec forum sont acheminés vers la session du sujet général (`:topic:1`), et non vers le sujet d’origine exact.

    Les `allowed_updates` pour l’interrogation périodique/le Webhook incluent automatiquement `message_reaction`.

  </Accordion>

  <Accordion title="Réactions d’accusé de réception">
    `ackReaction` envoie un émoji d’accusé de réception pendant qu’OpenClaw traite un message entrant. `messages.ackReactionScope` détermine *quand* il est envoyé.

    **Ordre de résolution de l’émoji :**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - emoji de secours de l’identité de l’agent (`agents.list[].identity.emoji`, sinon "👀")

    Telegram attend un emoji Unicode (par exemple "👀") ; utilisez `""` pour désactiver la réaction pour un canal ou un compte.

    **Portée (`messages.ackReactionScope`, valeur par défaut `"group-mentions"` ; aucune substitution par compte ou canal Telegram à ce jour) :**

    `all` (messages privés + groupes, y compris les événements ambiants du salon), `direct` (messages privés uniquement), `group-all` (tous les messages de groupe sauf les événements ambiants du salon, aucun message privé), `group-mentions` (groupes lorsque le bot est mentionné ; **aucun message privé** — valeur par défaut), `off` / `none` (désactivé).

    <Note>
    La portée par défaut (`group-mentions`) ne déclenche pas de réaction d’accusé de réception dans les messages privés ni pour les événements ambiants du salon. Utilisez `direct` ou `all` pour les messages privés ; seul `all` accuse réception des événements ambiants du salon. Cette valeur est lue au démarrage du fournisseur Telegram ; un redémarrage du Gateway est donc nécessaire pour que la modification prenne effet.
    </Note>

  </Accordion>

  <Accordion title="Écritures de configuration depuis les événements et commandes Telegram">
    Les écritures de configuration du canal sont activées par défaut (`configWrites !== false`). Les écritures déclenchées par Telegram comprennent les événements de migration de groupe (`migrate_to_chat_id`, met à jour `channels.telegram.groups`) et `/config set` / `/config unset` (nécessite l’activation des commandes).

    Pour désactiver :

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
    Le mode par défaut est l’interrogation longue. Pour le mode Webhook, définissez `channels.telegram.webhookUrl` et `channels.telegram.webhookSecret` ; les options sont `webhookPath` (valeur par défaut `/telegram-webhook`), `webhookHost` (valeur par défaut `127.0.0.1`), `webhookPort` (valeur par défaut `8787`) et `webhookCertPath` (certificat PEM auto-signé pour les configurations avec adresse IP directe ou sans nom de domaine).

    En mode d’interrogation longue, OpenClaw ne conserve son repère de redémarrage qu’après la transmission réussie d’une mise à jour ; en cas d’échec d’un gestionnaire, cette mise à jour reste réessayable dans le même processus au lieu d’être marquée comme terminée.

    Par défaut, l’écouteur local se lie à `127.0.0.1:8787`. Pour une entrée publique, placez un proxy inverse devant le port local ou définissez intentionnellement `webhookHost: "0.0.0.0"`.

    Le mode Webhook valide les contrôles de la requête, le jeton secret Telegram et le corps JSON, puis enregistre la mise à jour dans sa file d’entrée durable avant de renvoyer une réponse `200` vide. Une prise en charge durable réussie inclut `x-openclaw-delivery-accepted: durable` ; les réponses de contrôle d’intégrité, de routage, d’authentification, de validation et d’erreur de stockage omettent cet en-tête. Les proxys inverses et les contrôleurs d’hôte peuvent exiger cet en-tête pour distinguer la prise en charge par OpenClaw d’une réponse `200` vide générique, sans déduire l’acceptation du délai de réponse.

    OpenClaw traite ensuite la mise à jour de manière asynchrone via les mêmes files du bot par discussion et par sujet que celles utilisées par l’interrogation longue, afin que les traitements lents de l’agent ne retardent pas l’accusé de réception de Telegram.

  </Accordion>

  <Accordion title="Limites, nouvelles tentatives et cibles de la CLI">
    - `channels.telegram.textChunkLimit` vaut 4000 par défaut ; `streaming.chunkMode="newline"` privilégie les limites de paragraphe (lignes vides) avant le découpage selon la longueur.
    - `channels.telegram.mediaMaxMb` (valeur par défaut : 100) limite la taille des médias entrants et sortants.
    - `channels.telegram.mediaGroupFlushMs` (valeur par défaut : 500, plage : 10-60000) détermine la durée de mise en mémoire tampon des albums/groupes de médias avant qu’OpenClaw ne les transmette sous forme d’un seul message entrant. Augmentez-la si des éléments d’un album arrivent en retard ; réduisez-la pour diminuer la latence de réponse aux albums.
    - `channels.telegram.timeoutSeconds` remplace le délai d’expiration du client API (la valeur par défaut de grammY s’applique s’il n’est pas défini). Les clients de bot ajustent les valeurs configurées inférieures à la limite de 60 secondes applicable aux requêtes sortantes de texte/indication de saisie, afin que grammY n’interrompe pas la remise d’une réponse visible avant que la limite de transport et le mécanisme de repli d’OpenClaw puissent s’exécuter. L’interrogation longue utilise toujours une limite de requête `getUpdates` de 45 secondes afin que les interrogations inactives ne soient pas abandonnées indéfiniment.
    - `channels.telegram.pollingStallThresholdMs` vaut 120000 par défaut ; ne choisissez une valeur comprise entre 30000 et 600000 que pour éviter les redémarrages dus à de faux positifs de blocage de l’interrogation.
    - l’historique du contexte de groupe utilise `channels.telegram.historyLimit` ou `messages.groupChat.historyLimit` (valeur par défaut : 50) ; `0` le désactive.
    - le contexte supplémentaire des réponses/citations/transferts est normalisé dans une seule fenêtre de contexte de conversation sélectionnée lorsque le Gateway a observé les messages parents ; le cache des messages observés réside dans l’état SQLite du plugin OpenClaw, et `openclaw doctor --fix` importe les fichiers annexes hérités. Telegram n’inclut qu’un seul `reply_to_message` superficiel par mise à jour ; les chaînes antérieures au cache sont donc limitées à cette charge utile.
    - les listes d’autorisation Telegram déterminent principalement qui peut déclencher l’agent ; elles ne constituent pas une limite complète de masquage du contexte supplémentaire.
    - historique des messages privés : `channels.telegram.dmHistoryLimit`, `channels.telegram.dms["<user_id>"].historyLimit`.
    - `channels.telegram.retry` s’applique aux utilitaires d’envoi Telegram (CLI/outils/actions) pour les erreurs récupérables de l’API sortante. La remise de la réponse finale entrante utilise un nombre limité de nouvelles tentatives d’envoi sécurisé pour les échecs antérieurs à la connexion, mais ne réessaie pas les enveloppes réseau ambiguës postérieures à l’envoi qui pourraient dupliquer des messages visibles.

    Les cibles d’envoi de la CLI et de l’outil de messagerie acceptent un identifiant numérique de discussion, un nom d’utilisateur ou une cible de sujet de forum :

```bash
openclaw message send --channel telegram --target 123456789 --message "bonjour"
openclaw message send --channel telegram --target @name --message "bonjour"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "bonjour sujet"
```

    Les sondages utilisent `openclaw message poll` et prennent en charge les sujets de forum :

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Le publier ?" --poll-option "Oui" --poll-option "Non"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Choisissez une heure" --poll-option "10 h" --poll-option "14 h" \
  --poll-duration-seconds 300 --poll-public
```

    Options de sondage propres à Telegram : `--poll-duration-seconds` (5-600), `--poll-anonymous`, `--poll-public`, `--thread-id` (ou une cible `:topic:`). `--poll-option` est répétée 2-12 fois (limite d’options de Telegram).

    L’envoi Telegram prend également en charge `--presentation` avec des blocs `buttons` pour les claviers intégrés (lorsque `channels.telegram.capabilities.inlineButtons` l’autorise), `--pin` ou `--delivery '{"pin":true}'` pour demander l’épinglage lors de la remise lorsque le bot peut épingler des messages dans cette discussion, ainsi que `--force-document` pour envoyer les images, GIF et vidéos sortants sous forme de documents plutôt que de téléversements compressés, animés ou vidéo.

    Contrôle des actions : `channels.telegram.actions.sendMessage=false` désactive tous les messages sortants, y compris les sondages ; `channels.telegram.actions.poll=false` désactive la création de sondages tout en laissant les envois ordinaires activés.

  </Accordion>

  <Accordion title="Approbations d’exécution dans Telegram">
    Telegram prend en charge les approbations d’exécution dans les messages privés des approbateurs et peut facultativement publier les invites dans la discussion ou le sujet d’origine. Les approbateurs doivent être identifiés par des identifiants numériques d’utilisateur Telegram.

    - `channels.telegram.execApprovals.enabled` (`"auto"` active la fonctionnalité lorsqu’au moins un approbateur peut être résolu)
    - `channels.telegram.execApprovals.approvers` (utilise à défaut les identifiants numériques des propriétaires provenant de `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target` : `dm` (valeur par défaut) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` et `defaultTo` déterminent qui peut communiquer avec le bot et où il envoie les réponses ordinaires ; ils ne confèrent pas le rôle d’approbateur d’exécution. Le premier appairage approuvé par message privé initialise `commands.ownerAllowFrom` lorsqu’aucun propriétaire de commande n’existe encore, de sorte que les configurations à propriétaire unique fonctionnent sans dupliquer les identifiants sous `execApprovals.approvers`.

    La remise dans le canal affiche le texte de la commande dans la discussion ; n’activez `channel` ou `both` que dans des groupes/sujets de confiance. Lorsque l’invite arrive dans un sujet de forum, OpenClaw conserve le sujet pour l’invite d’approbation et le suivi. Par défaut, les approbations d’exécution expirent après 30 minutes.

    Les boutons d’approbation intégrés exigent également que `channels.telegram.capabilities.inlineButtons` autorise la surface cible (`dm`, `group` ou `all`). Les identifiants d’approbation préfixés par `plugin:` sont résolus par les approbations de plugin ; les autres sont d’abord résolus par les approbations d’exécution.

    Consultez [Approbations d’exécution](/fr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Contrôle des réponses d’erreur

Lorsque l’agent rencontre une erreur de remise ou de fournisseur, la politique d’erreur détermine si les messages d’erreur parviennent à la discussion Telegram :

| Clé                                 | Valeurs                    | Valeur par défaut | Description                                                                                                                                                                                                            |
| ----------------------------------- | -------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`          | `always` envoie chaque message d’erreur dans la discussion. `once` envoie chaque message d’erreur unique une fois par fenêtre de temporisation (et supprime les erreurs identiques répétées). `silent` n’envoie jamais de message d’erreur dans la discussion. |
| `channels.telegram.errorCooldownMs` | nombre (ms)                | `14400000` (4h)   | Fenêtre de temporisation de la politique `once`. Après l’envoi d’une erreur, le même message est supprimé jusqu’à l’expiration de cet intervalle. Évite la prolifération des erreurs pendant les interruptions de service. |

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
  <Accordion title="Le bot ne répond pas aux messages de groupe qui ne le mentionnent pas">

    - Si `requireMention=false`, le mode de confidentialité de Telegram doit permettre une visibilité complète : BotFather `/setprivacy` -> Disable, puis retirez le bot du groupe et ajoutez-le de nouveau.
    - `openclaw channels status` affiche un avertissement lorsque la configuration attend des messages de groupe sans mention.
    - `openclaw channels status --probe` vérifie les identifiants numériques explicites des groupes ; l’appartenance ne peut pas être vérifiée avec le caractère générique `"*"`.
    - Test rapide de la session : `/activation always`.

  </Accordion>

  <Accordion title="Le bot ne reçoit aucun message de groupe">

    - Lorsque `channels.telegram.groups` existe, le groupe doit être répertorié (ou inclure `"*"`).
    - Vérifiez que le bot appartient au groupe.
    - Consultez `openclaw logs --follow` pour connaître les raisons des omissions.

  </Accordion>

  <Accordion title="Les commandes fonctionnent partiellement ou pas du tout">

    - Autorisez l’identité de l’expéditeur (appairage et/ou valeur numérique dans `allowFrom`) ; l’autorisation des commandes reste applicable même lorsque la politique du groupe est `open`.
    - `setMyCommands failed` avec `BOT_COMMANDS_TOO_MUCH` signifie que le menu natif comporte trop d’entrées ; réduisez le nombre de commandes de plugins, de Skills ou personnalisées, ou désactivez les menus natifs.
    - Les appels de démarrage `deleteMyCommands` / `setMyCommands` et les appels d’indication de saisie `sendChatAction` sont limités dans le temps et font l’objet d’une nouvelle tentative via le mécanisme de repli du transport Telegram en cas d’expiration de la requête. Des erreurs réseau/de récupération persistantes indiquent généralement que l’accès DNS/HTTPS à `api.telegram.org` est impossible.

  </Accordion>

  <Accordion title="Le démarrage signale un jeton non autorisé">

    - `getMe returned 401` indique un échec d’authentification Telegram pour le jeton de bot configuré. Copiez de nouveau ou régénérez le jeton dans BotFather, puis mettez à jour `channels.telegram.botToken`, `tokenFile`, `accounts.<id>.botToken` ou `TELEGRAM_BOT_TOKEN` (compte par défaut).
    - `deleteWebhook 401 Unauthorized` au démarrage indique également un échec d’authentification ; le traiter comme si « aucun webhook n’existait » ne ferait que reporter le même échec dû au jeton incorrect à un appel API ultérieur.

  </Accordion>

  <Accordion title="Instabilité de l’interrogation ou du réseau">

    - Node 22+ avec une implémentation fetch/un proxy personnalisé peut déclencher un abandon immédiat si les types `AbortSignal` ne correspondent pas.
    - Certains hôtes résolvent d’abord `api.telegram.org` en IPv6 ; une sortie IPv6 défaillante provoque des échecs intermittents de l’API.
    - Les journaux contenant `TypeError: fetch failed` ou `Network request for 'getUpdates' failed!` entraînent de nouvelles tentatives, car ces erreurs réseau sont considérées comme récupérables.
    - Au démarrage de l’interrogation, OpenClaw réutilise pour grammY la sonde `getMe` réussie du démarrage, afin que le processus d’exécution n’ait pas besoin d’un second `getMe` avant le premier `getUpdates`.
    - Si `deleteWebhook` échoue à cause d’une erreur réseau transitoire au démarrage de l’interrogation, OpenClaw passe à l’interrogation longue au lieu d’effectuer un autre appel de plan de contrôle avant l’interrogation. Un webhook encore actif se manifeste alors par un conflit `getUpdates` ; OpenClaw reconstruit le transport et réessaie de supprimer le webhook.
    - Si les sockets Telegram sont renouvelés selon une cadence fixe et courte, recherchez une faible valeur de `channels.telegram.timeoutSeconds` : les clients de bot ajustent les valeurs configurées inférieures aux limites des requêtes sortantes et `getUpdates`, mais les anciennes versions pouvaient interrompre chaque interrogation ou réponse lorsque cette valeur était inférieure à ces limites.
    - `Polling stall detected` dans les journaux signifie qu’OpenClaw redémarre l’interrogation et reconstruit le transport après 120 secondes sans signe d’activité d’interrogation longue terminée par défaut.
    - `openclaw channels status --probe` et `openclaw doctor` affichent un avertissement lorsqu’un compte d’interrogation en cours d’exécution n’a pas terminé `getUpdates` après le délai de grâce du démarrage, lorsqu’un compte webhook en cours d’exécution n’a pas terminé `setWebhook` après ce délai, ou lorsque la dernière activité réussie du transport d’interrogation est obsolète.
    - Augmentez `channels.telegram.pollingStallThresholdMs` uniquement lorsque les appels `getUpdates` de longue durée sont sains, mais que votre hôte signale toujours de faux redémarrages dus à un blocage de l’interrogation. Des blocages persistants indiquent généralement des problèmes de proxy, de DNS, d’IPv6 ou de sortie TLS vers `api.telegram.org`.
    - Telegram respecte les variables d’environnement de proxy du processus pour le transport de l’API Bot : `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` et leurs variantes en minuscules. `NO_PROXY` / `no_proxy` peuvent toujours contourner le proxy pour `api.telegram.org`.
    - Si `OPENCLAW_PROXY_URL` est défini dans un environnement de service et qu’aucune variable d’environnement de proxy standard n’est présente, Telegram utilise également cette URL pour le transport de l’API Bot.
    - Sur les hôtes VPS dont la sortie directe/TLS est instable, acheminez les appels à l’API Telegram via un proxy :

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ utilise `autoSelectFamily=true` par défaut (sauf sous WSL2). L’ordre des résultats DNS de Telegram respecte d’abord `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, puis `channels.telegram.network.dnsResultOrder`, puis la valeur par défaut du processus (par exemple `NODE_OPTIONS=--dns-result-order=ipv4first`) ; si aucune de ces valeurs ne s’applique, il utilise `ipv4first` sous Node 22+.
    - Sous WSL2, ou lorsque le fonctionnement en IPv4 uniquement est préférable, imposez la sélection de famille :

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Les réponses de la plage de référence RFC 2544 (`198.18.0.0/15`) sont déjà autorisées par défaut pour les téléchargements de médias Telegram. Si un proxy fake-IP ou transparent de confiance réécrit `api.telegram.org` vers une autre adresse privée/interne/à usage spécial pendant les téléchargements de médias, activez explicitement le contournement réservé à Telegram :

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - La même activation explicite est disponible pour chaque compte dans `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Si votre proxy résout les hôtes de médias Telegram en `198.18.x.x`, laissez d’abord l’indicateur dangereux désactivé — cette plage est déjà autorisée par défaut.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` affaiblit les protections SSRF des médias Telegram. Utilisez-le uniquement dans des environnements de proxy de confiance contrôlés par l’opérateur (routage fake-IP de Clash, Mihomo ou Surge) qui génèrent des réponses privées ou à usage spécial hors de la plage de référence RFC 2544. Laissez-le désactivé pour un accès normal à Telegram via l’Internet public.
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

- démarrage/authentification : `enabled`, `botToken`, `tokenFile` (doit être un fichier ordinaire ; les liens symboliques sont refusés), `accounts.*`
- contrôle d’accès : `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` au niveau supérieur (`type: "acp"`)
- valeurs par défaut des sujets : `groups.<chatId>.topics."*"` s’applique aux sujets de forum sans correspondance ; les identifiants de sujet exacts prévalent
- approbations d’exécution : `execApprovals`, `accounts.*.execApprovals`
- commandes/menu : `commands.native`, `commands.nativeSkills`, `customCommands`
- fils de discussion/réponses : `replyToMode`, `threadBindings`
- diffusion en continu : `streaming` (modes `off | partial | block | progress`), `streaming.preview.toolProgress`
- formatage/distribution : `textChunkLimit`, `streaming.chunkMode`, `richMessages`, `markdown.tables` (`off | bullets | code | block`), `linkPreview`, `responsePrefix`
- médias/réseau : `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- racine d’API personnalisée : `apiRoot` (racine de la Bot API uniquement ; n’incluez pas `/bot<TOKEN>`), `trustedLocalFileRoots` (racines absolues `file_path` de la Bot API auto-hébergée)
- Webhook : `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`, `webhookPort`, `webhookCertPath`
- actions/capacités : `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker|createForumTopic|editForumTopic`
- réactions : `reactionNotifications`, `reactionLevel`
- erreurs : `errorPolicy`, `errorCooldownMs`, `silentErrorReplies`
- écritures/historique : `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Priorité multicomptes : lorsque deux identifiants de compte ou plus sont configurés, définissez `channels.telegram.defaultAccount` (ou incluez `channels.telegram.accounts.default`) afin d’expliciter le routage par défaut. Sinon, OpenClaw utilise le premier identifiant de compte normalisé et `openclaw doctor` affiche un avertissement. Les comptes nommés héritent de `channels.telegram.allowFrom` / `groupAllowFrom`, mais pas des valeurs `accounts.default.*`.
</Note>

## Pages connexes

<CardGroup cols={2}>
  <Card title="Association" icon="link" href="/fr/channels/pairing">
    Associez un utilisateur Telegram au Gateway.
  </Card>
  <Card title="Groupes" icon="users" href="/fr/channels/groups">
    Comportement des listes d’autorisation de groupes et de sujets.
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
    Diagnostics entre canaux.
  </Card>
</CardGroup>
