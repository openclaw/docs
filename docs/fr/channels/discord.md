---
read_when:
    - Développement des fonctionnalités du canal Discord
summary: Configuration du bot Discord, clés de configuration, composants, voix et dépannage
title: Discord
x-i18n:
    generated_at: "2026-07-12T02:22:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ae3682462003a04e57acbdc98a3713e5ef83f89384b7f3b79633c344855b715
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw se connecte à Discord en tant que bot via le Gateway officiel de Discord. Les messages privés et les canaux de serveur sont pris en charge.

<CardGroup cols={3}>
  <Card title="Association" icon="link" href="/fr/channels/pairing">
    Les messages privés Discord utilisent par défaut le mode d’association.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/fr/tools/slash-commands">
    Comportement des commandes natives et catalogue des commandes.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Flux de diagnostic et de réparation multicanal.
  </Card>
</CardGroup>

## Configuration rapide

Créez une application Discord avec un bot, ajoutez le bot à votre serveur et associez-le à OpenClaw. Utilisez si possible un serveur privé ; [commencez par en créer un](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends**) si nécessaire.

<Steps>
  <Step title="Créer une application Discord et un bot">
    Dans le [portail des développeurs Discord](https://discord.com/developers/applications), cliquez sur **New Application** et donnez-lui un nom (par exemple « OpenClaw »).

    Ouvrez **Bot** dans la barre latérale et définissez **Username** sur le nom de votre agent.

  </Step>

  <Step title="Activer les intentions privilégiées">
    Toujours sur la page **Bot**, sous **Privileged Gateway Intents**, activez :

    - **Message Content Intent** (obligatoire)
    - **Server Members Intent** (recommandé ; obligatoire pour les listes d’autorisation de rôles, la correspondance entre noms et identifiants, ainsi que les groupes d’accès à l’audience des canaux)
    - **Presence Intent** (facultatif ; uniquement pour les mises à jour de présence)

  </Step>

  <Step title="Copier le jeton de votre bot">
    Sur la page **Bot**, cliquez sur **Reset Token** et copiez le jeton.

    <Note>
    Malgré son nom, cette action génère votre premier jeton : rien n’est réellement « réinitialisé ».
    </Note>

  </Step>

  <Step title="Générer une URL d’invitation et ajouter le bot à votre serveur">
    Ouvrez **OAuth2** dans la barre latérale. Dans **OAuth2 URL Generator**, activez les portées suivantes :

    - `bot`
    - `applications.commands`

    Dans la section **Bot Permissions** qui apparaît, activez au minimum :

    **General Permissions**
      - View Channels

    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (facultatif)

    Il s’agit de la configuration minimale pour les canaux textuels ordinaires. Si le bot doit publier dans des fils de discussion, notamment dans des flux de canaux de forum ou multimédias qui créent ou poursuivent un fil, activez également **Send Messages in Threads**.

    Copiez l’URL générée, ouvrez-la dans un navigateur, sélectionnez votre serveur et cliquez sur **Continue**. Le bot devrait maintenant apparaître sur votre serveur.

  </Step>

  <Step title="Activer le mode développeur et récupérer vos identifiants">
    Dans l’application Discord, activez le mode développeur afin de pouvoir copier les identifiants :

    1. **User Settings** (icône d’engrenage) → **Developer** → activez **Developer Mode**
       *(sur mobile : **App Settings** → **Advanced**)*
    2. Faites un clic droit sur l’**icône de votre serveur** → **Copy Server ID**
    3. Faites un clic droit sur **votre propre avatar** → **Copy User ID**

    Conservez l’identifiant du serveur et l’identifiant utilisateur avec le jeton de votre bot ; vous aurez besoin des trois à l’étape suivante.

  </Step>

  <Step title="Autoriser les messages privés des membres du serveur">
    Pour que l’association fonctionne, Discord doit autoriser le bot à vous envoyer un message privé. Faites un clic droit sur l’**icône de votre serveur** → **Privacy Settings** → activez **Direct Messages**.

    Laissez cette option activée si vous utilisez les messages privés Discord avec OpenClaw. Si vous utilisez uniquement les canaux du serveur, vous pouvez la désactiver après l’association.

  </Step>

  <Step title="Définir le jeton de votre bot de manière sécurisée (ne l’envoyez pas dans une discussion)">
    Le jeton du bot est un secret. Définissez-le sur la machine qui exécute OpenClaw avant d’envoyer un message à votre agent :

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
cat > discord.patch.json5 <<'JSON5'
{
  channels: {
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./discord.patch.json5 --dry-run
openclaw config patch --file ./discord.patch.json5
openclaw gateway
```

    Si OpenClaw s’exécute déjà comme service en arrière-plan, redémarrez-le via l’application OpenClaw pour Mac, ou arrêtez puis relancez le processus `openclaw gateway run`.
    Pour les installations en tant que service géré, exécutez `openclaw gateway install` depuis un shell dans lequel `DISCORD_BOT_TOKEN` est défini, ou stockez la variable dans `~/.openclaw/.env` afin que le service puisse résoudre la référence secrète d’environnement après le redémarrage.
    Si votre hôte est bloqué ou soumis à une limitation de débit lors de la recherche de l’application au démarrage par Discord, définissez l’identifiant de l’application ou du client depuis le portail des développeurs afin que le démarrage puisse ignorer cet appel REST : `channels.discord.applicationId` pour le compte par défaut, ou `channels.discord.accounts.<accountId>.applicationId` pour chaque bot.

  </Step>

  <Step title="Configurer OpenClaw et effectuer l’association">

    <Tabs>
      <Tab title="Demander à votre agent">
        Discutez avec votre agent OpenClaw sur un canal existant (par exemple Telegram) et donnez-lui les instructions. Si Discord est votre premier canal, utilisez plutôt l’onglet CLI / configuration.

        > « J’ai déjà défini le jeton de mon bot Discord dans la configuration. Termine la configuration de Discord avec l’identifiant utilisateur `<user_id>` et l’identifiant du serveur `<server_id>`. »
      </Tab>
      <Tab title="CLI / configuration">
        Configuration basée sur un fichier :

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        Variable d’environnement de secours pour le compte par défaut :

```bash
DISCORD_BOT_TOKEN=...
```

        Pour une configuration scriptée ou distante, écrivez le même bloc JSON5 avec `openclaw config patch --file ./discord.patch.json5 --dry-run`, puis relancez la commande sans `--dry-run`. Les chaînes `token` en texte brut fonctionnent également, et les valeurs SecretRef sont prises en charge pour `channels.discord.token` avec les fournisseurs d’environnement, de fichier et d’exécution. Consultez la page [Gestion des secrets](/fr/gateway/secrets).

        Pour plusieurs bots Discord, conservez le jeton et l’identifiant d’application de chaque bot sous son compte. La valeur de premier niveau `channels.discord.applicationId` est héritée par les comptes ; ne la définissez donc à cet emplacement que si tous les comptes utilisent le même identifiant d’application.

```json5
{
  channels: {
    discord: {
      enabled: true,
      accounts: {
        personal: {
          token: { source: "env", provider: "default", id: "DISCORD_PERSONAL_TOKEN" },
          applicationId: "111111111111111111",
        },
        work: {
          token: { source: "env", provider: "default", id: "DISCORD_WORK_TOKEN" },
          applicationId: "222222222222222222",
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Approuver la première association par message privé">
    Une fois le Gateway en cours d’exécution, envoyez un message privé à votre bot dans Discord. Il répond avec un code d’association.

    <Tabs>
      <Tab title="Demander à votre agent">
        Envoyez le code d’association à votre agent sur votre canal existant :

        > « Approuve ce code d’association Discord : `<CODE>` »
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Les codes d’association expirent après une heure. Après l’approbation, discutez avec votre agent dans un message privé Discord.

  </Step>
</Steps>

<Note>
La résolution des jetons tient compte des comptes. Les valeurs de jeton de la configuration ont priorité sur la variable d’environnement de secours, et `DISCORD_BOT_TOKEN` n’est utilisée que pour le compte par défaut.
Si deux comptes Discord activés sont résolus vers le même jeton de bot, OpenClaw ne démarre qu’un seul moniteur Gateway pour ce jeton : un jeton provenant de la configuration a priorité sur la variable d’environnement de secours ; sinon, le premier compte activé est retenu et le compte en double est signalé comme désactivé avec la raison `duplicate bot token`.
Pour les appels sortants avancés (outil de messagerie ou actions de canal), un `token` explicite propre à l’appel est utilisé pour celui-ci. Cela s’applique aux actions d’envoi ainsi qu’aux actions de lecture ou de vérification (lecture, recherche, récupération, fil de discussion, messages épinglés et autorisations). Les paramètres de stratégie et de nouvelle tentative du compte proviennent toujours du compte sélectionné dans l’instantané d’exécution actif.
</Note>

## Recommandation : configurer un espace de travail de serveur

Une fois les messages privés opérationnels, vous pouvez transformer votre serveur en espace de travail complet, dans lequel chaque canal possède sa propre session d’agent et son propre contexte. Cette configuration est recommandée pour les serveurs privés où seuls vous et votre bot êtes présents.

<Steps>
  <Step title="Ajouter votre serveur à la liste d’autorisation des serveurs">
    Cela permet à votre agent de répondre dans n’importe quel canal de votre serveur, et pas seulement dans les messages privés.

    <Tabs>
      <Tab title="Demander à votre agent">
        > « Ajoute l’identifiant de mon serveur Discord `<server_id>` à la liste d’autorisation des serveurs »
      </Tab>
      <Tab title="Configuration">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Autoriser les réponses sans mention @">
    Par défaut, l’agent ne répond dans les canaux du serveur que lorsqu’il est mentionné avec @. Sur un serveur privé, vous souhaiterez probablement qu’il réponde à chaque message.

    Dans les canaux du serveur, les réponses ordinaires sont publiées automatiquement par défaut. Pour les salons partagés toujours actifs, activez `messages.groupChat.visibleReplies: "message_tool"` afin que l’agent puisse rester en retrait et ne publier que lorsqu’il estime qu’une réponse dans le canal est utile. Cela fonctionne particulièrement bien avec des modèles de dernière génération offrant une utilisation fiable des outils, tels que GPT-5.6 Sol. Les événements ambiants du salon restent silencieux, sauf si l’outil envoie un message. Consultez [Événements ambiants des salons](/fr/channels/ambient-room-events) pour obtenir la configuration complète du mode de surveillance silencieuse.

    Si Discord affiche l’indicateur de saisie et que les journaux montrent une consommation de jetons sans qu’aucun message soit publié, vérifiez si l’interaction a été configurée comme événement ambiant du salon ou si les réponses visibles via l’outil de messagerie ont été activées.

    <Tabs>
      <Tab title="Demander à votre agent">
        > « Autorise mon agent à répondre sur ce serveur sans qu’il soit nécessaire de le mentionner avec @ »
      </Tab>
      <Tab title="Configuration">
        Définissez `requireMention: false` dans la configuration de votre serveur :

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

        Pour exiger l’envoi via l’outil de messagerie pour les réponses visibles dans les groupes ou les canaux, définissez `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Prévoir la mémoire dans les canaux du serveur">
    La mémoire à long terme (`MEMORY.md`) n’est chargée automatiquement que dans les sessions de messages privés ; elle ne l’est pas dans les canaux du serveur.

    <Tabs>
      <Tab title="Demander à votre agent">
        > « Lorsque je pose des questions dans les canaux Discord, utilise `memory_search` ou `memory_get` si tu as besoin du contexte à long terme provenant de `MEMORY.md`. »
      </Tab>
      <Tab title="Manuel">
        Pour disposer d’un contexte partagé dans chaque canal, placez les instructions stables dans `AGENTS.md` ou `USER.md` (injectés dans chaque session). Conservez les notes à long terme dans `MEMORY.md` et consultez-les à la demande avec les outils de mémoire.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Créez maintenant des canaux et commencez à discuter. L’agent voit le nom du canal, et chaque canal constitue une session isolée : configurez `#coding`, `#home`, `#research` ou tout autre canal adapté à votre flux de travail.

## Modèle d’exécution

- Le Gateway gère la connexion Discord.
- Le routage des réponses est déterministe : les réponses aux messages entrants de Discord sont renvoyées vers Discord.
- Les métadonnées du serveur et du canal Discord sont ajoutées à l’invite du modèle en tant que contexte non fiable, et non comme préfixe de réponse visible par l’utilisateur. Si un modèle recopie cette enveloppe dans sa réponse, OpenClaw supprime les métadonnées copiées des réponses sortantes et du contexte des futures relectures.
- Par défaut (`session.dmScope=main`), les discussions directes partagent la session principale de l’agent (`agent:main:main`).
- Les canaux du serveur utilisent des clés de session isolées (`agent:<agentId>:discord:channel:<channelId>`).
- Les messages privés de groupe sont ignorés par défaut (`channels.discord.dm.groupEnabled=false`).
- Les commandes slash natives s’exécutent dans des sessions de commande isolées (`agent:<agentId>:discord:slash:<userId>`), tout en transmettant `CommandTargetSessionKey` à la session de conversation vers laquelle elles sont routées.
- La diffusion sur Discord des annonces Cron/Heartbeat uniquement textuelles est réduite à la réponse finale visible de l’assistant, envoyée une seule fois. Les contenus multimédias et les charges utiles de composants structurés restent répartis sur plusieurs messages lorsque l’agent produit plusieurs charges utiles à transmettre.

## Canaux de forum

Les canaux de forum et multimédias Discord n’acceptent que les publications dans des fils de discussion. OpenClaw permet de les créer de deux façons :

- Envoyez un message au parent du forum (`channel:<forumId>`) pour créer automatiquement un fil. Le titre du fil correspond à la première ligne non vide du message (tronquée à la limite de 100 caractères imposée par Discord pour le nom des fils).
- Utilisez `openclaw message thread create` pour créer directement un fil. Ne transmettez pas `--message-id` pour les canaux de forum.

Envoyez au parent du forum pour créer un fil :

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Créez explicitement un fil de forum :

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Les parents de forum n’acceptent pas les composants Discord. Si vous avez besoin de composants, envoyez-les au fil lui-même (`channel:<threadId>`).

## Composants interactifs

OpenClaw prend en charge les conteneurs de composants v2 de Discord pour les messages de l’agent. Utilisez l’outil de messagerie avec une charge utile `components`. Les résultats des interactions sont renvoyés à l’agent comme des messages entrants ordinaires et suivent les paramètres Discord `replyToMode` existants.

Blocs pris en charge :

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Les lignes d’actions acceptent jusqu’à 5 boutons ou un seul menu de sélection
- Types de sélection : `string`, `user`, `role`, `mentionable`, `channel`

Par défaut, les composants sont à usage unique. Définissez `components.reusable=true` pour permettre l’utilisation répétée des boutons, sélections et formulaires jusqu’à leur expiration.

Pour limiter les utilisateurs autorisés à cliquer sur un bouton, définissez `allowedUsers` sur ce bouton (identifiants d’utilisateur Discord, tags ou `*`). Les utilisateurs non autorisés reçoivent un refus éphémère.

Par défaut, les rappels de composants expirent après 30 minutes. Définissez `channels.discord.agentComponents.ttlMs` pour modifier la durée de vie du registre des rappels du compte par défaut, ou `channels.discord.accounts.<accountId>.agentComponents.ttlMs` pour chaque compte. La valeur est exprimée en millisecondes, doit être un entier positif et est plafonnée à `86400000` (24 heures). Des durées de vie plus longues conviennent aux processus de révision ou d’approbation qui nécessitent que les boutons restent utilisables, mais elles prolongent la période pendant laquelle un ancien message Discord peut encore déclencher une action. Préférez la durée de vie la plus courte qui convient et conservez la valeur par défaut si des rappels obsolètes risquent de surprendre les utilisateurs.

Les commandes slash `/model` et `/models` ouvrent un sélecteur de modèle interactif comportant des listes déroulantes pour le fournisseur, le modèle et les environnements d’exécution compatibles, ainsi qu’une étape de validation. `/models add` est obsolète et renvoie un message d’obsolescence au lieu d’enregistrer des modèles depuis la discussion. La réponse du sélecteur est éphémère et utilisable uniquement par l’utilisateur qui l’a invoqué. Les menus de sélection Discord sont limités à 25 options ; ajoutez donc des entrées `provider/*` à `agents.defaults.models` lorsque vous souhaitez que le sélecteur affiche les modèles découverts dynamiquement uniquement pour certains fournisseurs, tels que `openai` ou `vllm`.

Pièces jointes :

- Les blocs `file` doivent pointer vers une référence de pièce jointe (`attachment://<filename>`)
- Fournissez la pièce jointe via `media`/`path`/`filePath` (un seul fichier) ; utilisez `media-gallery` pour plusieurs fichiers
- Utilisez `filename` pour remplacer le nom du fichier téléversé lorsqu’il doit correspondre à la référence de la pièce jointe

Formulaires modaux :

- Ajoutez `components.modal` avec jusqu’à 5 champs
- Types de champs : `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw ajoute automatiquement un bouton de déclenchement

Exemple :

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## Contrôle d’accès et routage

<Tabs>
  <Tab title="Politique des messages privés">
    `channels.discord.dmPolicy` contrôle l’accès aux messages privés. `channels.discord.allowFrom` est la liste d’autorisation canonique des messages privés.

    - `pairing` (par défaut)
    - `allowlist` (nécessite au moins un expéditeur dans `allowFrom`)
    - `open` (nécessite que `channels.discord.allowFrom` contienne `"*"`)
    - `disabled`

    Si la politique des messages privés n’est pas ouverte, les utilisateurs inconnus sont bloqués (ou invités à effectuer un appairage en mode `pairing`).

    Ordre de priorité pour plusieurs comptes :

    - `channels.discord.accounts.default.allowFrom` s’applique uniquement au compte `default`.
    - Pour un compte, `allowFrom` est prioritaire sur l’ancien `dm.allowFrom`.
    - Les comptes nommés héritent de `channels.discord.allowFrom` lorsque leurs propres valeurs `allowFrom` et l’ancien `dm.allowFrom` ne sont pas définis.
    - Les comptes nommés n’héritent pas de `channels.discord.accounts.default.allowFrom`.

    Les anciens paramètres `channels.discord.dm.policy` et `channels.discord.dm.allowFrom` sont toujours lus à des fins de compatibilité. `openclaw doctor --fix` les migre vers `dmPolicy` et `allowFrom` lorsqu’il peut le faire sans modifier l’accès.

    Format de la cible des messages privés pour la remise :

    - `user:<id>`
    - mention `<@id>`

    Les identifiants numériques seuls sont normalement interprétés comme des identifiants de canal lorsqu’un canal par défaut est actif, mais les identifiants figurant dans la valeur effective `allowFrom` des messages privés du compte sont traités comme des cibles de messages privés utilisateur à des fins de compatibilité.

  </Tab>

  <Tab title="Groupes d’accès">
    Les messages privés Discord et l’autorisation des commandes textuelles peuvent utiliser des entrées dynamiques `accessGroup:<name>` dans `channels.discord.allowFrom`.

    Les noms de groupes d’accès sont partagés entre les canaux de messagerie. Utilisez `type: "message.senders"` pour un groupe statique dont les membres sont exprimés selon la syntaxe `allowFrom` habituelle de chaque canal, ou `type: "discord.channelAudience"` lorsque l’audience `ViewChannel` actuelle d’un canal Discord doit définir dynamiquement l’appartenance. Comportement partagé des groupes d’accès : [Groupes d’accès](/fr/channels/access-groups).

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

    Un canal textuel Discord ne possède pas de liste de membres distincte. `type: "discord.channelAudience"` modélise l’appartenance ainsi : l’expéditeur du message privé est membre du serveur configuré et dispose actuellement de l’autorisation effective `ViewChannel` sur le canal configuré, après application des rôles et des dérogations du canal.

    Exemple : autoriser toute personne pouvant voir `#maintainers` à envoyer un message privé au bot, tout en laissant les messages privés fermés à tous les autres utilisateurs.

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

    Vous pouvez combiner des entrées dynamiques et statiques :

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers", "discord:123456789012345678"],
    },
  },
}
```

    Les recherches échouent en refusant l’accès. Si Discord renvoie `Missing Access`, si la recherche du membre échoue ou si le canal appartient à un autre serveur, l’expéditeur du message privé est considéré comme non autorisé.

    Activez **Server Members Intent** dans le portail des développeurs Discord lorsque vous utilisez des groupes d’accès fondés sur l’audience d’un canal. Les messages privés n’incluent pas l’état des membres du serveur ; OpenClaw récupère donc le membre via l’API REST Discord au moment de l’autorisation.

  </Tab>

  <Tab title="Politique des serveurs">
    La gestion des serveurs est contrôlée par `channels.discord.groupPolicy` :

    - `open`
    - `allowlist`
    - `disabled`

    La configuration sécurisée de référence lorsque `channels.discord` existe est `allowlist`.

    Comportement de `allowlist` :

    - le serveur doit correspondre à `channels.discord.guilds` (`id` recommandé, slug accepté)
    - listes d’autorisation facultatives des expéditeurs : `users` (identifiants stables recommandés) et `roles` (identifiants de rôles uniquement) ; si l’une ou l’autre est configurée, les expéditeurs sont autorisés lorsqu’ils correspondent à `users` OU `roles`
    - la correspondance directe par nom ou tag est désactivée par défaut ; activez `channels.discord.dangerouslyAllowNameMatching: true` uniquement comme mode de compatibilité d’urgence
    - les noms et tags sont pris en charge pour `users`, mais les identifiants sont plus sûrs ; `openclaw security audit` émet un avertissement lorsque des entrées par nom ou tag sont utilisées
    - si des `channels` sont configurés pour un serveur, les canaux non répertoriés sont refusés
    - si un serveur ne possède pas de bloc `channels`, tous les canaux de ce serveur figurant dans la liste d’autorisation sont autorisés

    Exemple :

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { enabled: true },
            help: { enabled: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    L’ancienne clé `allow` propre à chaque canal est migrée vers `enabled` par `openclaw doctor --fix`.

    Si vous définissez uniquement `DISCORD_BOT_TOKEN` sans créer de bloc `channels.discord`, la valeur de repli à l’exécution est `groupPolicy="allowlist"` (avec un avertissement dans les journaux), même si `channels.defaults.groupPolicy` vaut `open`.

  </Tab>

  <Tab title="Mentions et messages privés de groupe">
    Par défaut, les messages des serveurs nécessitent une mention.

    La détection des mentions comprend :

    - une mention explicite du bot
    - les motifs de mention configurés (`agents.list[].groupChat.mentionPatterns`, avec repli sur `messages.groupChat.mentionPatterns`)
    - le comportement implicite de réponse au bot dans les cas pris en charge

    Lors de la rédaction de messages Discord sortants, utilisez la syntaxe canonique des mentions : `<@USER_ID>` pour les utilisateurs, `<#CHANNEL_ID>` pour les canaux et `<@&ROLE_ID>` pour les rôles. N’utilisez pas l’ancienne forme de mention par surnom `<@!USER_ID>`.

    `requireMention` est configuré par serveur ou canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` ignore facultativement les messages qui mentionnent un autre utilisateur ou rôle, mais pas le bot (à l’exception de @everyone/@here).

    Messages privés de groupe :

    - par défaut : ignorés (`dm.groupEnabled=false`)
    - liste d’autorisation facultative via `dm.groupChannels` (identifiants ou slugs de canaux)

  </Tab>
</Tabs>

### Routage des agents selon les rôles

Utilisez `bindings[].match.roles` pour router les membres d’un serveur Discord vers différents agents selon leur identifiant de rôle. Les liaisons fondées sur les rôles acceptent uniquement des identifiants de rôles et sont évaluées après les liaisons par pair ou pair parent, mais avant les liaisons limitées au serveur. Si une liaison définit également d’autres champs de correspondance (par exemple `peer` + `guildId` + `roles`), tous les champs configurés doivent correspondre.

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## Commandes natives et autorisation des commandes

- `commands.native` utilise par défaut `"auto"` et est activé pour Discord.
- Remplacement par canal : `channels.discord.commands.native`.
- `commands.native=false` ignore l’enregistrement et le nettoyage des commandes slash Discord au démarrage. Les commandes précédemment enregistrées peuvent rester visibles dans Discord jusqu’à ce que vous les supprimiez de l’application Discord.
- L’authentification des commandes natives utilise les mêmes listes d’autorisation et politiques Discord que le traitement normal des messages.
- Les commandes peuvent rester visibles dans l’interface de Discord pour les utilisateurs non autorisés ; leur exécution applique l’authentification OpenClaw et répond « non autorisé ».
- Paramètres par défaut des commandes slash : `ephemeral: true` (`channels.discord.slashCommand.ephemeral`).

Consultez [Commandes slash](/fr/tools/slash-commands) pour connaître le catalogue et le comportement des commandes.

## Détails des fonctionnalités

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord prend en charge les balises de réponse dans la sortie de l’agent :

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Ce comportement est contrôlé par `channels.discord.replyToMode` :

    - `off` (par défaut) : aucun fil de réponse implicite ; les balises explicites `[[reply_to_*]]` restent prises en compte
    - `first` : associe la référence de réponse native implicite au premier message Discord sortant du tour
    - `all` : l’associe à chaque message sortant
    - `batched` : l’associe uniquement lorsque l’événement entrant était un lot temporisé de plusieurs messages — utile lorsque vous souhaitez principalement des réponses natives pour les conversations ambiguës comportant des rafales de messages, et non pour chaque tour à message unique

    Les identifiants des messages sont exposés dans le contexte et l’historique afin que les agents puissent cibler des messages précis.

  </Accordion>

  <Accordion title="Link previews">
    Discord génère par défaut des intégrations enrichies pour les URL. OpenClaw supprime par défaut ces intégrations générées dans les messages Discord sortants, afin que les URL envoyées par l’agent restent de simples liens, sauf si vous activez cette fonctionnalité :

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Définissez `channels.discord.accounts.<id>.suppressEmbeds` pour remplacer ce comportement pour un compte. Les envois effectués par l’outil de messagerie de l’agent peuvent également transmettre `suppressEmbeds: false` pour un seul message. Les charges utiles Discord `embeds` explicites ne sont pas supprimées par le paramètre par défaut des aperçus de liens.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw peut diffuser progressivement les brouillons de réponse en envoyant un message temporaire et en le modifiant à mesure que le texte arrive. `channels.discord.streaming.mode` accepte `off` | `partial` | `block` | `progress` (`progress` est utilisé par défaut lorsqu’aucune clé `streaming` ni ancienne clé `streamMode` n’est définie). `streamMode` est un alias obsolète ; exécutez `openclaw doctor --fix` pour réécrire la configuration persistante selon la structure imbriquée canonique `streaming`.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
          commentary: false,
        },
      },
    },
  },
}
```

    - `off` désactive les modifications des aperçus Discord.
    - `partial` modifie un seul message d’aperçu à mesure que les jetons arrivent.
    - `block` émet des fragments de la taille d’un brouillon ; ajustez leur taille et les points de coupure avec `streaming.preview.chunk` (`minChars`, `maxChars`, `breakPreference`), dans la limite de `textChunkLimit`. Lorsque la diffusion par blocs est explicitement activée, OpenClaw ignore le flux d’aperçu afin d’éviter une double diffusion.
    - `progress` conserve un seul brouillon d’état modifiable et le met à jour avec la progression des outils jusqu’à la livraison finale ; le libellé initial partagé est une ligne défilante, qui disparaît donc comme les autres dès que suffisamment d’activité s’affiche.
    - Les résultats finaux contenant un média, une erreur ou une réponse explicite annulent les modifications d’aperçu en attente.
    - `streaming.preview.toolProgress` (`true` par défaut) détermine si les mises à jour des outils et de la progression réutilisent le message d’aperçu.
    - Les lignes d’outil et de progression s’affichent sous une forme compacte composée d’un émoji, d’un titre et de détails lorsqu’ils sont disponibles, par exemple `🛠️ Bash: run tests` ou `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (`false` par défaut) permet d’inclure le commentaire ou le préambule de l’assistant dans le brouillon temporaire de progression. Le commentaire est nettoyé avant l’affichage, reste temporaire et ne modifie pas la livraison de la réponse finale.
    - `streaming.progress.maxLineChars` contrôle la taille maximale de chaque ligne de l’aperçu de progression. Le texte est raccourci aux limites des mots ; les détails des commandes et des chemins conservent les suffixes utiles.
    - `streaming.preview.commandText` / `streaming.progress.commandText` contrôle les détails des commandes et des exécutions dans les lignes de progression compactes : `raw` (par défaut) ou `status` (libellé de l’outil uniquement).

    Masquez le texte brut des commandes et des exécutions tout en conservant les lignes de progression compactes :

    ```json
    {
      "channels": {
        "discord": {
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

    La diffusion de l’aperçu ne prend en charge que le texte ; les réponses contenant des médias utilisent la livraison normale.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Contexte de l’historique du serveur :

    - valeur par défaut de `channels.discord.historyLimit` : `20`
    - valeur de repli : `messages.groupChat.historyLimit`
    - `0` désactive cette fonctionnalité

    Contrôles de l’historique des messages privés :

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportement des fils :

    - Les fils Discord sont routés comme des sessions de canal et héritent de la configuration du canal parent, sauf remplacement.
    - Les sessions de fil héritent de la sélection `/model` définie au niveau de la session du canal parent uniquement comme modèle de repli ; les sélections `/model` propres au fil sont prioritaires, et l’historique de transcription du parent n’est pas copié sauf si l’héritage de transcription est activé.
    - `channels.discord.thread.inheritParent` (`false` par défaut) permet d’initialiser les nouveaux fils automatiques à partir de la transcription du parent. Remplacement par compte : `channels.discord.accounts.<id>.thread.inheritParent`.
    - Les réactions de l’outil de messagerie peuvent résoudre les cibles de messages privés `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` est conservé lors du mécanisme de repli d’activation à l’étape de réponse.

    Les sujets des canaux sont injectés comme contexte **non fiable**. Les listes d’autorisation déterminent qui peut déclencher l’agent ; elles ne constituent pas une frontière complète de masquage du contexte supplémentaire.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord peut lier un fil à une cible de session afin que les messages suivants de ce fil continuent d’être routés vers la même session, y compris les sessions de sous-agents.

    Commandes :

    - `/focus <target>` lie le fil actuel ou un nouveau fil à une cible de sous-agent ou de session
    - `/unfocus` supprime la liaison du fil actuel
    - `/agents` affiche les exécutions actives et l’état des liaisons
    - `/session idle <duration|off>` consulte ou met à jour la désactivation automatique après inactivité des liaisons ciblées
    - `/session max-age <duration|off>` consulte ou met à jour l’âge maximal absolu des liaisons ciblées

    Configuration :

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
    },
  },
}
```

    Remarques :

    - `session.threadBindings.*` définit les valeurs globales par défaut ; `channels.discord.threadBindings.*` remplace le comportement de Discord.
    - `spawnSessions` contrôle la création et la liaison automatiques des fils pour `sessions_spawn({ thread: true })` et les créations de fils ACP. Valeur par défaut : `true`.
    - `defaultSpawnContext` contrôle le contexte natif du sous-agent pour les créations liées à un fil. Valeur par défaut : `"fork"`.
    - Les clés obsolètes `spawnSubagentSessions` et `spawnAcpSessions` sont migrées par `openclaw doctor --fix`.
    - Si les liaisons de fils sont désactivées pour un compte, `/focus` et les opérations associées de liaison de fils ne sont pas disponibles.

    Consultez [Sous-agents](/fr/tools/subagents), [Agents ACP](/fr/tools/acp-agents) et [Référence de configuration](/fr/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    Pour les espaces de travail ACP stables et « toujours actifs », configurez des liaisons ACP typées de premier niveau ciblant des conversations Discord.

    Chemin de configuration : `bindings[]` avec `type: "acp"` et `match.channel: "discord"`.

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
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    Remarques :

    - `/acp spawn codex --bind here` lie le canal ou le fil actuel sur place et conserve les futurs messages dans la même session ACP. Les messages du fil héritent de la liaison du canal parent.
    - Dans un canal ou un fil lié, `/new` et `/reset` réinitialisent sur place la même session ACP. Les liaisons temporaires de fils peuvent remplacer la résolution de la cible tant qu’elles sont actives.
    - `spawnSessions` contrôle la création et la liaison des fils enfants via `--thread auto|here`.

    Consultez [Agents ACP](/fr/tools/acp-agents) pour plus de détails sur le comportement des liaisons.

  </Accordion>

  <Accordion title="Reaction notifications">
    Mode de notification des réactions par serveur (`guilds.<id>.reactionNotifications`) :

    - `off`
    - `own` (par défaut)
    - `all`
    - `allowlist` (utilise `guilds.<id>.users`)

    Les événements de réaction sont convertis en événements système et associés à la session Discord routée.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` envoie un émoji d’accusé de réception pendant qu’OpenClaw traite un message entrant.

    Ordre de résolution :

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - émoji de repli de l’identité de l’agent (`agents.list[].identity.emoji`, sinon `"👀"`)

    Remarques :

    - Discord accepte les émojis Unicode ou les noms d’émojis personnalisés.
    - Utilisez `""` pour désactiver la réaction pour un canal ou un compte.

    **Portée (`messages.ackReactionScope`) :**

    Valeurs : `"all"` (messages privés et groupes, y compris les événements ambiants des salons), `"direct"` (messages privés uniquement), `"group-all"` (tous les messages de groupe sauf les événements ambiants des salons, aucun message privé), `"group-mentions"` (groupes lorsque le bot est mentionné ; **aucun message privé**, valeur par défaut), `"off"` / `"none"` (désactivé).

    <Note>
    La portée par défaut (`"group-mentions"`) ne déclenche pas de réaction d’accusé de réception dans les messages privés ni dans les événements ambiants des salons. Pour obtenir une réaction d’accusé de réception sur les messages privés Discord entrants et les événements des salons silencieux, définissez `messages.ackReactionScope` sur `"all"`.
    </Note>

  </Accordion>

  <Accordion title="Config writes">
    Les écritures de configuration initiées par le canal sont activées par défaut. Cela affecte les flux `/config set|unset` lorsque les fonctionnalités de commande sont activées.

    Pour les désactiver :

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Gateway proxy">
    Acheminez le trafic WebSocket du Gateway Discord ainsi que les recherches REST effectuées au démarrage — identifiant de l’application et résolution de la liste d’autorisation — via un proxy HTTP(S) avec `channels.discord.proxy`.
    L’utilisation d’un proxy pour le WebSocket du Gateway Discord est explicite ; les connexions WebSocket n’héritent pas des variables d’environnement de proxy du processus Gateway. Les recherches REST au démarrage utilisent ce proxy lorsque `channels.discord.proxy` est configuré.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Remplacement par compte :

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="PluralKit support">
    Activez la résolution PluralKit afin d’associer les messages transmis par proxy à l’identité d’un membre du système :

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // facultatif ; nécessaire pour les systèmes privés
      },
    },
  },
}
```

    Remarques :

    - les listes d’autorisation peuvent utiliser `pk:<memberId>`
    - les noms d’affichage des membres sont mis en correspondance par nom/slug uniquement lorsque `channels.discord.dangerouslyAllowNameMatching: true`
    - les recherches interrogent l’API PluralKit avec l’ID du message d’origine
    - si la recherche échoue, les messages relayés sont traités comme des messages de bot et ignorés, sauf si `allowBots` les autorise

  </Accordion>

  <Accordion title="Alias de mention sortante">
    Utilisez `mentionAliases` lorsque les agents ont besoin de mentions sortantes déterministes pour des utilisateurs Discord connus. Les clés sont des identifiants sans le `@` initial ; les valeurs sont des ID utilisateur Discord. Les identifiants inconnus, `@everyone`, `@here` et les mentions dans les fragments de code Markdown restent inchangés.

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        SupportLead: "123456789012345678",
      },
      accounts: {
        ops: {
          mentionAliases: {
            OpsLead: "234567890123456789",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Configuration de la présence">
    Les mises à jour de présence sont appliquées lorsque vous définissez un champ de statut ou d’activité, ou lorsque vous activez la présence automatique.

    Statut uniquement :

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Activité (le statut personnalisé est le type d’activité par défaut lorsque `activity` est défini) :

```json5
{
  channels: {
    discord: {
      activity: "Temps de concentration",
      activityType: 4,
    },
  },
}
```

    Diffusion en direct :

```json5
{
  channels: {
    discord: {
      activity: "Développement en direct",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Correspondance des types d’activité :

    - 0 : Joue à
    - 1 : Diffuse en direct (nécessite `activityUrl` ; `activityUrl` nécessite à son tour `activityType: 1`)
    - 2 : Écoute
    - 3 : Regarde
    - 4 : Personnalisé (utilise le texte de l’activité comme état du statut ; l’émoji est facultatif)
    - 5 : Participe à une compétition

    Présence automatique (signal d’état de santé de l’exécution) :

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "jeton épuisé",
      },
    },
  },
}
```

    La présence automatique associe la disponibilité de l’exécution au statut Discord : opérationnelle => en ligne, dégradée ou inconnue => inactive, épuisée ou indisponible => ne pas déranger. Valeurs par défaut : `intervalMs` 30000, `minUpdateIntervalMs` 15000 (doit être inférieur ou égal à `intervalMs`). Remplacements de texte facultatifs :

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (prend en charge l’espace réservé `{reason}`)

  </Accordion>

  <Accordion title="Approbations dans Discord">
    Discord prend en charge la gestion des approbations par boutons dans les messages privés et peut facultativement publier les demandes d’approbation dans le canal d’origine.

    Chemin de configuration :

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (facultatif ; utilise `commands.ownerAllowFrom` comme solution de repli lorsque cela est possible)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, valeur par défaut : `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord active automatiquement les approbations d’exécution natives lorsque `enabled` n’est pas défini ou vaut `"auto"` et qu’au moins un approbateur peut être déterminé, soit depuis `execApprovals.approvers`, soit depuis `commands.ownerAllowFrom`. Discord ne déduit pas les approbateurs d’exécution depuis la liste `allowFrom` du canal, l’ancien `dm.allowFrom` ou le `defaultTo` des messages privés. Définissez explicitement `enabled: false` pour désactiver Discord en tant que client d’approbation natif.

    Pour les commandes de groupe sensibles réservées au propriétaire, telles que `/diagnostics` et `/export-trajectory`, OpenClaw envoie les demandes d’approbation et les résultats finaux en privé. Il tente d’abord d’utiliser un message privé Discord lorsque le propriétaire à l’origine de la commande dispose d’une route de propriétaire Discord ; sinon, il utilise comme solution de repli la première route de propriétaire disponible dans `commands.ownerAllowFrom`, telle que Telegram.

    Lorsque `target` vaut `channel` ou `both`, la demande d’approbation est visible dans le canal. Seuls les approbateurs déterminés peuvent utiliser les boutons ; les autres utilisateurs reçoivent un refus éphémère. Les demandes d’approbation incluent le texte de la commande ; n’activez donc leur envoi dans un canal que pour les canaux de confiance. Si l’ID du canal ne peut pas être déduit de la clé de session, OpenClaw utilise l’envoi par message privé comme solution de repli.

    Discord affiche les boutons d’approbation partagés utilisés par les autres canaux de discussion ; l’adaptateur Discord natif ajoute principalement le routage des messages privés vers les approbateurs et la diffusion dans les canaux. Lorsque ces boutons sont présents, ils constituent l’interface principale d’approbation ; OpenClaw ne doit inclure une commande manuelle `/approve` que lorsque le résultat de l’outil indique que les approbations dans la discussion sont indisponibles ou que l’approbation manuelle est la seule possibilité. Si le système d’approbation natif de Discord n’est pas actif, OpenClaw maintient visible l’invite locale déterministe `/approve <id> <decision>`. Si le système est actif, mais qu’une carte native ne peut être envoyée à aucune destination, OpenClaw envoie dans la même discussion une notification de repli contenant la commande `/approve` exacte de l’approbation en attente.

    L’authentification du Gateway et la résolution des approbations suivent le contrat partagé du client Gateway (les ID `plugin:` sont résolus par `plugin.approval.resolve` ; les autres ID par `exec.approval.resolve`). Par défaut, les approbations expirent après 30 minutes.

    Consultez [Approbations d’exécution](/fr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Outils et contrôles des actions

Les actions de message Discord couvrent la messagerie, l’administration des canaux, la modération, la présence et les métadonnées.

Exemples principaux :

- messagerie : `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- réactions : `react`, `reactions`, `emojiList`
- modération : `timeout`, `kick`, `ban`
- présence : `setPresence`

L’action `event-create` accepte un paramètre `image` facultatif (URL ou chemin de fichier local) pour définir l’image de couverture de l’événement planifié.

Les contrôles des actions se trouvent sous `channels.discord.actions.*`.

Comportement par défaut des contrôles :

| Groupe d’actions                                                                                                                                                          | Par défaut |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | activé     |
| roles                                                                                                                                                                    | désactivé  |
| moderation                                                                                                                                                               | désactivé  |
| presence                                                                                                                                                                 | désactivé  |

## Interface utilisateur Components v2

OpenClaw utilise les composants Discord v2 pour les approbations d’exécution et les marqueurs intercontextes. Les actions de message Discord peuvent également accepter `components` pour une interface utilisateur personnalisée (usage avancé ; nécessite de construire une charge utile de composant avec l’outil Discord), tandis que les anciens `embeds` restent disponibles, mais ne sont pas recommandés.

- `channels.discord.ui.components.accentColor` définit la couleur d’accentuation utilisée par les conteneurs de composants Discord (hexadécimale). Par compte : `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` détermine la durée pendant laquelle les rappels des composants Discord envoyés restent enregistrés (valeur par défaut : `1800000`, maximum : `86400000`). Par compte : `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- Les `embeds` sont ignorés lorsque des composants v2 sont présents.
- Les aperçus d’URL simples sont masqués par défaut. Définissez `suppressEmbeds: false` sur une action de message lorsqu’un unique lien sortant doit être développé.

Exemple :

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## Voix

Discord dispose de deux interfaces vocales distinctes : les **canaux vocaux** en temps réel (conversations continues) et les **pièces jointes de messages vocaux** (format d’aperçu avec forme d’onde). Le Gateway prend les deux en charge.

### Canaux vocaux

Liste de contrôle de la configuration :

1. Activez Message Content Intent dans le Discord Developer Portal.
2. Activez Server Members Intent lorsque des listes d’autorisation de rôles ou d’utilisateurs sont utilisées.
3. Invitez le bot avec les portées `bot` et `applications.commands`.
4. Accordez les autorisations Connect, Speak, Send Messages et Read Message History dans le canal vocal cible.
5. Activez les commandes natives (`commands.native` ou `channels.discord.commands.native`).
6. Configurez `channels.discord.voice`.

Utilisez `/vc join|leave|status` pour contrôler les sessions. La commande utilise l’agent par défaut du compte et suit les mêmes règles de liste d’autorisation et de politique de groupe que les autres commandes Discord.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Pour examiner les autorisations effectives du bot avant de rejoindre le canal :

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

Exemple de connexion automatique :

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.6-sol",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Remarques :

- La voix Discord est facultative pour les configurations en mode texte uniquement ; définissez `channels.discord.voice.enabled=true` (ou conservez un bloc `channels.discord.voice` existant) pour activer les commandes `/vc`, l’environnement d’exécution vocal et l’intention Gateway `GuildVoiceStates`. `channels.discord.intents.voiceStates` peut remplacer explicitement l’abonnement à l’intention ; laissez cette option non définie pour suivre l’activation effective de la voix.
- `voice.mode` contrôle le chemin de conversation. La valeur par défaut est `agent-proxy` : une interface vocale en temps réel gère le minutage des tours, les interruptions et la lecture, délègue les tâches de fond à l’agent OpenClaw acheminé via `openclaw_agent_consult`, puis traite le résultat comme une invite Discord saisie par cet interlocuteur. `stt-tts` conserve l’ancien flux de traitement par lots STT suivi de TTS. `bidi` permet au modèle en temps réel de converser directement tout en exposant `openclaw_agent_consult` pour le cerveau OpenClaw.
- `voice.agentSession` contrôle la conversation OpenClaw qui reçoit les tours vocaux. Laissez cette option non définie pour utiliser la propre session du canal vocal, ou définissez `{ mode: "target", target: "channel:<text-channel-id>" }` afin que le canal vocal serve d’extension microphone/haut-parleur à la session d’un canal textuel Discord existant, tel que `#maintainers`.
- `voice.model` remplace le cerveau de l’agent OpenClaw pour les réponses vocales Discord et les consultations en temps réel. Laissez cette option non définie pour hériter du modèle de l’agent acheminé. Elle est distincte de `voice.realtime.model`.
- `voice.followUsers` permet au bot de rejoindre, de suivre et de quitter des utilisateurs sélectionnés dans les canaux vocaux Discord. Consultez [Suivre des utilisateurs dans les canaux vocaux](#follow-users-in-voice).
- `agent-proxy` achemine la parole via `discord-voice`, qui préserve les autorisations normales du propriétaire et des outils pour l’interlocuteur et la session cible, mais masque l’outil `tts` de l’agent, car la voix Discord gère la lecture. Par défaut, `agent-proxy` accorde à la consultation un accès aux outils complet, équivalent à celui du propriétaire, pour les interlocuteurs propriétaires (`voice.realtime.toolPolicy: "owner"`) et privilégie fortement la consultation de l’agent OpenClaw avant toute réponse substantielle (`voice.realtime.consultPolicy: "always"`). Dans ce mode `always` par défaut, la couche en temps réel ne prononce pas automatiquement de paroles de remplissage avant la réponse de la consultation ; elle capture et transcrit la parole, puis prononce la réponse OpenClaw acheminée. Si plusieurs réponses de consultation forcée se terminent alors que Discord lit encore la première réponse, les réponses suivantes à prononcer exactement sont mises en file d’attente jusqu’à ce que la lecture soit inactive, au lieu de remplacer la parole au milieu d’une phrase.
- En mode `stt-tts`, la STT utilise `tools.media.audio` ; `voice.model` n’affecte pas la transcription.
- Dans les modes en temps réel, `voice.realtime.provider`, `voice.realtime.model` et `voice.realtime.speakerVoice` configurent la session audio en temps réel. Pour OpenAI Realtime 2.1 avec le cerveau Codex, utilisez `voice.realtime.model: "gpt-realtime-2.1"` et `voice.model: "openai/gpt-5.6-sol"`.
- Par défaut, les modes vocaux en temps réel incluent les petits fichiers de profil `IDENTITY.md`, `USER.md` et `SOUL.md` dans les instructions du fournisseur en temps réel, afin que les tours directs rapides conservent la même identité, le même ancrage utilisateur et la même personnalité que l’agent OpenClaw acheminé. Définissez `voice.realtime.bootstrapContextFiles` sur un sous-ensemble pour personnaliser ce comportement, ou sur `[]` pour le désactiver. Seuls ces fichiers de profil sont pris en charge ; `AGENTS.md` reste dans le contexte normal de l’agent. Le contexte de profil injecté ne remplace pas `openclaw_agent_consult` pour les tâches liées à l’espace de travail, les informations actuelles, la recherche en mémoire ou les actions reposant sur des outils.
- Dans le mode en temps réel `agent-proxy` d’OpenAI, définissez `voice.realtime.requireWakeName: true` pour que la voix en temps réel de Discord reste silencieuse jusqu’à ce qu’une transcription commence ou se termine par un nom d’activation. Les noms d’activation configurés doivent comporter un ou deux mots. Si `voice.realtime.wakeNames` n’est pas défini, OpenClaw utilise le `name` de l’agent acheminé ainsi que `OpenClaw`, avec comme solution de repli l’identifiant de l’agent ainsi que `OpenClaw`. Le filtrage par nom d’activation désactive la réponse automatique du fournisseur en temps réel, achemine les tours acceptés par le chemin de consultation de l’agent OpenClaw et émet un bref accusé de réception vocal lorsqu’un nom d’activation placé au début est reconnu dans une transcription partielle, avant l’arrivée de la transcription finale.
- Le fournisseur OpenAI en temps réel accepte les noms d’événements actuels de Realtime 2 ainsi que les alias hérités compatibles avec Codex pour les événements de sortie audio et de transcription ; les instantanés compatibles du fournisseur peuvent donc diverger sans entraîner la perte du son de l’assistant.
- `voice.realtime.bargeIn` contrôle si les événements de début de parole Discord interrompent une lecture en temps réel active. Si cette option n’est pas définie, elle suit le paramètre d’interruption par l’audio d’entrée du fournisseur en temps réel.
- `voice.realtime.minBargeInAudioEndMs` contrôle la durée minimale de lecture de l’assistant avant qu’une interruption en temps réel OpenAI ne tronque le son. Valeur par défaut : `250`. Définissez `0` pour une interruption immédiate dans les pièces à faible écho, ou augmentez cette valeur pour les installations de haut-parleurs produisant beaucoup d’écho.
- `voice.tts` remplace `messages.tts` uniquement pour la lecture vocale en mode `stt-tts` ; les modes en temps réel utilisent plutôt `voice.realtime.speakerVoice`. Pour utiliser une voix OpenAI lors de la lecture sur Discord, définissez `voice.tts.provider: "openai"` et choisissez une voix de synthèse vocale sous `voice.tts.providers.openai.speakerVoice`. `cedar` est actuellement un bon choix à la sonorité masculine avec le modèle TTS d’OpenAI.
- Les remplacements `systemPrompt` propres à chaque canal Discord s’appliquent aux tours de transcription vocale de ce canal vocal.
- Les tours de transcription vocale déterminent le statut de propriétaire à partir de `allowFrom` de Discord (ou de `dm.allowFrom`) pour les commandes et actions de canal réservées au propriétaire. La visibilité des outils de l’agent suit la politique d’outils configurée pour la session acheminée.
- Si `voice.autoJoin` contient plusieurs entrées pour la même guilde, OpenClaw rejoint le dernier canal configuré pour cette guilde.
- `voice.allowedChannels` est une liste facultative des canaux de résidence autorisés. Laissez cette option non définie pour permettre à `/vc join` de rejoindre n’importe quel canal vocal Discord autorisé. Lorsqu’elle est définie, `/vc join`, la connexion automatique au démarrage et les déplacements de l’état vocal du bot sont limités aux entrées `{ guildId, channelId }` répertoriées. Définissez-la sur un tableau vide pour interdire toute connexion aux canaux vocaux Discord. Si Discord déplace le bot hors de la liste d’autorisation, OpenClaw quitte ce canal et rejoint la cible de connexion automatique configurée lorsqu’il en existe une.
- `voice.daveEncryption` et `voice.decryptionFailureTolerance` sont transmis aux options de connexion de `@discordjs/voice` ; les valeurs par défaut en amont sont `daveEncryption=true` et `decryptionFailureTolerance=24`.
- OpenClaw utilise le codec `libopus-wasm` fourni pour la réception vocale Discord et la lecture PCM brute en temps réel. Il fournit une version WebAssembly épinglée de libopus et ne nécessite aucun module complémentaire opus natif.
- `voice.connectTimeoutMs` contrôle l’attente initiale de l’état Ready de `@discordjs/voice` lors des tentatives `/vc join` et de connexion automatique. Valeur par défaut : `30000`.
- `voice.reconnectGraceMs` contrôle la durée pendant laquelle OpenClaw attend qu’une session vocale déconnectée commence à se reconnecter avant de la détruire. Valeur par défaut : `15000`.
- En mode `stt-tts`, la lecture vocale ne s’arrête pas simplement parce qu’un autre utilisateur commence à parler. Pour éviter les boucles de rétroaction, OpenClaw ignore toute nouvelle capture vocale pendant la lecture TTS ; parlez une fois la lecture terminée pour le tour suivant. Les modes en temps réel transmettent les débuts de parole comme signaux d’interruption au fournisseur en temps réel.
- Dans les modes en temps réel, l’écho des haut-parleurs capté par un microphone ouvert peut être interprété comme une interruption et interrompre la lecture. Pour les salles Discord produisant beaucoup d’écho, définissez `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` afin d’empêcher OpenAI d’interrompre automatiquement la réponse à la détection d’un signal audio entrant. Ajoutez `voice.realtime.bargeIn: true` si vous souhaitez toujours que les événements de début de parole Discord interrompent la lecture active. Le pont en temps réel OpenAI ignore les troncatures de lecture plus courtes que `voice.realtime.minBargeInAudioEndMs`, considérées comme un écho ou du bruit probable, et les consigne comme ignorées au lieu d’effacer la lecture Discord.
- `voice.captureSilenceGraceMs` contrôle la durée pendant laquelle OpenClaw attend après que Discord a signalé qu’un interlocuteur a cessé de parler avant de finaliser ce segment audio pour la STT. Valeur par défaut : `2000` ; augmentez-la si Discord découpe les pauses normales en transcriptions partielles saccadées.
- Lorsque ElevenLabs est le fournisseur TTS sélectionné, la lecture vocale Discord utilise la TTS en continu et commence à partir du flux de réponse du fournisseur. Les fournisseurs ne prenant pas en charge la diffusion en continu reviennent au chemin utilisant un fichier temporaire synthétisé.
- OpenClaw surveille les échecs de déchiffrement à la réception et récupère automatiquement en quittant puis en rejoignant le canal vocal après des échecs répétés sur une courte période.
- Si les journaux de réception affichent de manière répétée `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` après une mise à jour, recueillez un rapport sur les dépendances ainsi que les journaux. La version fournie de `@discordjs/voice` inclut le correctif de remplissage en amont issu de la demande d’extraction discord.js nº 11449, qui a résolu le problème discord.js nº 11419.
- Les événements de réception `The operation was aborted` sont attendus lorsqu’OpenClaw finalise un segment capturé d’un interlocuteur ; ce sont des diagnostics détaillés, et non des avertissements.
- Les journaux détaillés de la voix Discord incluent un aperçu limité à une ligne de la transcription STT pour chaque segment d’interlocuteur accepté, afin que le débogage affiche à la fois le côté utilisateur et le côté réponse de l’agent sans déverser un volume illimité de texte transcrit.
- En mode `agent-proxy`, la solution de repli de consultation forcée ignore les fragments de transcription probablement incomplets, comme le texte se terminant par `...` ou par un connecteur final tel que « et », ainsi que les conclusions manifestement non exploitables telles que « je reviens » ou « au revoir ». Les journaux affichent `forced agent consult skipped reason=...` lorsque ce mécanisme empêche une ancienne réponse mise en file d’attente.

### Suivre des utilisateurs dans les canaux vocaux

Utilisez `voice.followUsers` lorsque vous souhaitez que le bot vocal Discord reste avec un ou plusieurs utilisateurs Discord connus, au lieu de rejoindre un canal fixe au démarrage ou d’attendre `/vc join`.

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        followUsersEnabled: true,
        followUsers: ["discord:123456789012345678"],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
      },
    },
  },
}
```

Comportement :

- `followUsers` accepte les identifiants bruts d’utilisateurs Discord et les valeurs `discord:<id>`. OpenClaw normalise les deux formes avant de les comparer aux événements d’état vocal.
- `followUsersEnabled` prend par défaut la valeur `true` lorsque `followUsers` est configuré. Définissez-la sur `false` pour conserver la liste enregistrée tout en désactivant le suivi vocal automatique.
- Lorsqu’un utilisateur suivi rejoint un canal vocal autorisé, OpenClaw rejoint ce canal. Lorsque l’utilisateur change de canal, OpenClaw le suit. Lorsque l’utilisateur suivi actif se déconnecte, OpenClaw quitte le canal.
- Si plusieurs utilisateurs suivis se trouvent dans la même guilde et que l’utilisateur suivi actif la quitte, OpenClaw rejoint le canal d’un autre utilisateur suivi avant de quitter la guilde. Si plusieurs utilisateurs suivis changent de canal simultanément, le dernier événement d’état vocal observé prévaut.
- `allowedChannels` continue de s’appliquer. Un utilisateur suivi se trouvant dans un canal non autorisé est ignoré, et une session contrôlée par le suivi rejoint un autre utilisateur suivi ou quitte le canal.
- OpenClaw réconcilie les événements d’état vocal manqués au démarrage et à intervalles limités. La réconciliation échantillonne les guildes configurées et limite le nombre de consultations REST par exécution ; les très longues listes `followUsers` peuvent donc nécessiter plusieurs intervalles pour converger.
- Si Discord ou un administrateur déplace le bot alors qu’il suit un utilisateur, OpenClaw reconstruit la session vocale et conserve la propriété du suivi lorsque la destination est autorisée. Si le bot est déplacé hors de `allowedChannels`, OpenClaw quitte le canal et rejoint la cible configurée lorsqu’elle existe.
- La récupération de la réception DAVE peut quitter puis rejoindre le même canal après des échecs de déchiffrement répétés. Les sessions contrôlées par le suivi conservent la propriété du suivi pendant ce processus de récupération ; une déconnexion ultérieure de l’utilisateur suivi entraîne donc toujours la sortie du canal.

Choisissez l’un des modes de connexion :

- Utilisez `followUsers` pour les configurations personnelles ou d’exploitation dans lesquelles le bot doit rejoindre automatiquement un canal vocal lorsque vous y êtes.
- Utilisez `autoJoin` pour les bots affectés à une salle fixe qui doivent être présents même lorsqu’aucun utilisateur suivi ne se trouve dans un canal vocal.
- Utilisez `/vc join` pour les connexions ponctuelles ou les salles dans lesquelles une présence vocale automatique serait inattendue.

Codec vocal Discord :

- Les journaux de réception vocale affichent `discord voice: opus decoder: libopus-wasm`.
- La lecture en temps réel encode le PCM stéréo brut à 48 kHz en Opus avec le même paquet `libopus-wasm` fourni avant de transmettre les paquets à `@discordjs/voice`.
- La lecture de fichiers et de flux de fournisseurs transcode le contenu en PCM stéréo brut à 48 kHz avec ffmpeg, puis utilise `libopus-wasm` pour le flux de paquets Opus envoyé à Discord.

Chaîne de traitement STT suivie de TTS :

- La capture PCM de Discord est convertie en fichier WAV temporaire.
- `tools.media.audio` gère la reconnaissance vocale, par exemple avec `openai/gpt-4o-mini-transcribe`.
- La transcription est envoyée par le flux d’entrée et le routage de Discord tandis que le LLM de réponse s’exécute avec une politique de sortie vocale qui masque l’outil `tts` de l’agent et demande le renvoi de texte, car la voix Discord assure la lecture TTS finale.
- Lorsqu’il est défini, `voice.model` remplace uniquement le LLM de réponse pour cette interaction dans le canal vocal.
- `voice.tts` est fusionné par-dessus `messages.tts` ; les fournisseurs prenant en charge la diffusion en continu alimentent directement le lecteur, sinon le fichier audio obtenu est lu dans le canal rejoint.

Exemple de session de canal vocal avec proxy d’agent par défaut :

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.6-sol",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

En l’absence de bloc `voice.agentSession`, chaque canal vocal dispose de sa propre session OpenClaw routée. Par exemple, `/vc join channel:234567890123456789` communique avec la session de ce canal vocal Discord. Le modèle en temps réel sert uniquement d’interface vocale ; les requêtes substantielles sont transmises à l’agent OpenClaw configuré. Si le modèle en temps réel produit une transcription finale sans appeler l’outil de consultation, OpenClaw force la consultation comme solution de repli afin que le comportement par défaut reste équivalent à une conversation avec l’agent.

Exemple avec reconnaissance vocale et TTS hérités :

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "stt-tts",
        model: "openai/gpt-5.4-mini",
        tts: {
          provider: "openai",
          providers: {
            openai: {
              model: "gpt-4o-mini-tts",
              speakerVoice: "cedar",
            },
          },
        },
      },
    },
  },
}
```

Exemple bidirectionnel en temps réel :

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

Voix en tant qu’extension de la session d’un canal Discord existant :

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai/gpt-5.6-sol",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

En mode `agent-proxy`, le bot rejoint le canal vocal configuré, mais les interactions de l’agent OpenClaw utilisent la session routée normale et l’agent du canal cible. La session vocale en temps réel restitue oralement le résultat renvoyé dans le canal vocal. L’agent superviseur peut toujours utiliser les outils de messagerie normaux conformément à sa politique d’outils, notamment pour envoyer un message Discord distinct si cette action est appropriée.

Lorsqu’une exécution OpenClaw déléguée est active, les nouvelles transcriptions vocales Discord sont traitées comme des commandes de l’exécution en cours avant le démarrage d’une autre interaction de l’agent. Des phrases telles que « état », « annule ça », « utilise le correctif plus petit » ou « une fois terminé, vérifie aussi les tests » sont classées comme demande d’état, annulation, réorientation ou demande de suivi pour la session active. Les résultats des demandes d’état, des annulations, des réorientations acceptées et des suivis sont restitués oralement dans le canal vocal afin que l’appelant sache si OpenClaw a traité la demande.

Formes de cibles utiles :

- `target: "channel:123456789012345678"` effectue le routage par la session d’un canal textuel Discord.
- `target: "123456789012345678"` est traité comme une cible de canal.
- `target: "dm:123456789012345678"` ou `target: "user:123456789012345678"` effectue le routage par la session de messages privés correspondante.

Exemple OpenAI Realtime dans un environnement produisant beaucoup d’écho :

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
          bargeIn: true,
          minBargeInAudioEndMs: 500,
          consultPolicy: "always",
          providers: {
            openai: {
              interruptResponseOnInputAudio: false,
            },
          },
        },
      },
    },
  },
}
```

Utilisez cette configuration lorsque le modèle entend sa propre lecture Discord au moyen d’un microphone ouvert, mais que vous souhaitez tout de même pouvoir l’interrompre en parlant. OpenClaw empêche OpenAI d’interrompre automatiquement la réponse en présence d’un signal audio d’entrée brut, tandis que `bargeIn: true` permet aux événements de début de prise de parole de Discord et au signal audio d’un interlocuteur déjà actif d’annuler les réponses en temps réel actives avant que la prochaine interaction capturée n’atteigne OpenAI. Les signaux d’interruption très précoces dont la valeur `audioEndMs` est inférieure à `minBargeInAudioEndMs` sont considérés comme de l’écho ou du bruit probable et ignorés, afin que le modèle ne s’interrompe pas dès la première trame de lecture.

Journaux vocaux attendus :

- À la connexion : `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Au démarrage du temps réel : `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Lors du signal audio d’un interlocuteur : `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` et `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Lorsqu’une parole obsolète est ignorée : `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` ou `reason=non-actionable-closing ...`
- À la fin d’une réponse en temps réel : `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- À l’arrêt ou à la réinitialisation de la lecture : `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Lors d’une consultation en temps réel : `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Lors de la réponse de l’agent : `discord voice: agent turn answer ...`
- Lors de la mise en file d’attente d’une énonciation exacte : `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, suivi de `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Lors de la détection d’une interruption vocale : `discord voice: realtime barge-in detected source=speaker-start ...` ou `discord voice: realtime barge-in detected source=active-speaker-audio ...`, suivi de `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Lors d’une interruption en temps réel : `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, suivi de `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` ou de `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Lorsqu’un écho ou un bruit est ignoré : `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Lorsque l’interruption vocale est désactivée : `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Lorsque la lecture est inactive : `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Pour diagnostiquer un signal audio interrompu prématurément, lisez les journaux vocaux en temps réel comme une chronologie :

1. `realtime audio playback started` signifie que Discord a commencé à lire le signal audio de l’assistant. À partir de cet instant, le pont commence à compter les fragments de sortie de l’assistant, les octets PCM de Discord, les octets en temps réel du fournisseur et la durée du signal audio synthétisé.
2. `realtime speaker turn opened` indique qu’un interlocuteur Discord devient actif. Si la lecture est déjà active et que `bargeIn` est activé, cette ligne peut être suivie de `barge-in detected source=speaker-start`.
3. `realtime input audio started` indique la première trame audio effectivement reçue pour cette prise de parole. À cet endroit, `outputActive=true` ou une valeur `outputAudioMs` non nulle signifie que le microphone envoie un signal d’entrée alors que la lecture de l’assistant est toujours active.
4. `barge-in detected source=active-speaker-audio` signifie qu’OpenClaw a détecté le signal audio en direct d’un interlocuteur pendant que la lecture de l’assistant était active. Cela permet de distinguer une véritable interruption d’un événement de début de prise de parole Discord ne contenant aucun signal audio utile.
5. `barge-in requested reason=...` signifie qu’OpenClaw a demandé au fournisseur en temps réel d’annuler ou de tronquer la réponse active. Cette ligne comprend `outputAudioMs`, `outputActive` et `playbackChunks`, ce qui permet de voir quelle quantité du signal audio de l’assistant avait effectivement été lue avant l’interruption.
6. `realtime audio playback stopped reason=...` correspond au point de réinitialisation de la lecture Discord locale. Le motif indique l’origine de l’arrêt de la lecture : `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` ou `session-close`.
7. `realtime speaker turn closed` résume l’interaction d’entrée capturée. `chunks=0` ou `hasAudio=false` signifie que la prise de parole a commencé, mais qu’aucun signal audio exploitable n’a atteint le pont en temps réel. `interruptedPlayback=true` signifie que cette interaction d’entrée a chevauché la sortie de l’assistant et déclenché la logique d’interruption vocale.

Champs utiles :

- `outputAudioMs` : durée du signal audio de l’assistant généré par le fournisseur en temps réel avant la ligne de journal.
- `audioMs` : durée du signal audio de l’assistant comptabilisée par OpenClaw avant l’arrêt de la lecture.
- `elapsedMs` : temps écoulé entre l’ouverture et la fermeture du flux de lecture ou de la prise de parole.
- `discordBytes` : octets PCM stéréo à 48 kHz envoyés à la voix Discord ou reçus de celle-ci.
- `realtimeBytes` : octets PCM au format du fournisseur envoyés au fournisseur en temps réel ou reçus de celui-ci.
- `playbackChunks` : fragments audio de l’assistant transmis à Discord pour la réponse active.
- `sinceLastAudioMs` : intervalle entre la dernière trame audio capturée de l’interlocuteur et la fin de sa prise de parole.

Schémas courants :

- Une interruption immédiate avec `source=active-speaker-audio`, une faible valeur `outputAudioMs` et le même utilisateur à proximité indique généralement que l’écho des haut-parleurs entre dans le microphone. Augmentez `voice.realtime.minBargeInAudioEndMs`, réduisez le volume des haut-parleurs, utilisez un casque ou définissez `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` suivi de `speaker turn closed ... hasAudio=false` signifie que Discord a signalé le début d’une prise de parole, mais qu’aucun signal audio n’a atteint OpenClaw. Il peut s’agir d’un événement vocal Discord transitoire, du comportement de la porte de bruit ou d’une activation très brève du microphone par un client.
- `audio playback stopped reason=stream-close` sans interruption vocale ou `provider-clear-audio` à proximité signifie que le flux de lecture Discord local s’est terminé de manière inattendue. Consultez les journaux précédents du fournisseur et du lecteur Discord.
- `capture ignored during playback (barge-in disabled)` signifie qu’OpenClaw a intentionnellement ignoré le signal d’entrée pendant que le signal audio de l’assistant était actif. Activez `voice.realtime.bargeIn` si vous souhaitez que la parole interrompe la lecture.
- `barge-in ignored ... outputActive=false` signifie que la détection d’activité vocale de Discord ou du fournisseur a signalé de la parole, mais qu’OpenClaw n’avait aucune lecture active à interrompre. Cela ne doit pas interrompre le signal audio.

Les identifiants sont résolus séparément pour chaque composant : authentification de la route LLM pour `voice.model`, authentification de la reconnaissance vocale pour `tools.media.audio`, authentification TTS pour `messages.tts`/`voice.tts` et authentification du fournisseur en temps réel pour `voice.realtime.providers` ou la configuration d’authentification normale du fournisseur.

### Messages vocaux

Les messages vocaux Discord affichent un aperçu de la forme d’onde et nécessitent un signal audio OGG/Opus. OpenClaw génère automatiquement la forme d’onde, mais nécessite `ffmpeg` et `ffprobe` sur l’hôte du Gateway pour l’analyse et la conversion.

- Fournissez un **chemin de fichier local** (les URL sont refusées).
- Omettez le contenu textuel (Discord refuse le texte et le message vocal dans la même charge utile).
- Tous les formats audio sont acceptés ; OpenClaw effectue la conversion en OGG/Opus si nécessaire.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Dépannage

<AccordionGroup>
  <Accordion title="Intentions non autorisées utilisées ou le bot ne voit aucun message du serveur">

    - activez l’intention Message Content
    - activez l’intention Server Members lorsque vous dépendez de la résolution des utilisateurs/membres
    - redémarrez le Gateway après avoir modifié les intentions

  </Accordion>

  <Accordion title="Messages de serveur bloqués de façon inattendue">

    - vérifiez `groupPolicy`
    - vérifiez la liste d’autorisation des serveurs sous `channels.discord.guilds`
    - si une table `channels` existe pour un serveur, seuls les canaux répertoriés sont autorisés
    - vérifiez le comportement de `requireMention` et les modèles de mention

    Vérifications utiles :

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Mention non requise, mais messages toujours bloqués">
    Causes courantes :

    - `groupPolicy="allowlist"` sans liste d’autorisation correspondante pour le serveur ou le canal
    - `requireMention` configuré au mauvais endroit (doit se trouver sous `channels.discord.guilds` ou dans une entrée de canal)
    - expéditeur bloqué par la liste d’autorisation `users` du serveur ou du canal

  </Accordion>

  <Accordion title="Tours Discord de longue durée ou réponses en double">

    Journaux typiques :

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Paramètres de la file d’attente du Gateway Discord :

    - compte unique : `channels.discord.eventQueue.listenerTimeout`
    - plusieurs comptes : `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - cela contrôle uniquement le travail des écouteurs du Gateway Discord, et non la durée de vie des tours de l’agent

    Discord n’applique aucun délai d’expiration propre au canal aux tours d’agent mis en file d’attente. Les écouteurs de messages transmettent immédiatement le travail, et les exécutions Discord en file d’attente conservent l’ordre propre à chaque session jusqu’à ce que le cycle de vie de la session, de l’outil ou de l’environnement d’exécution termine ou annule le travail.

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Avertissements de délai d’expiration lors de la récupération des métadonnées du Gateway">
    OpenClaw récupère les métadonnées Discord `/gateway/bot` avant de se connecter. En cas d’échec temporaire, il utilise l’URL par défaut du Gateway Discord et limite la fréquence des messages dans les journaux.

    Paramètres du délai d’expiration des métadonnées :

    - compte unique : `channels.discord.gatewayInfoTimeoutMs`
    - plusieurs comptes : `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - variable d’environnement de secours lorsque la configuration n’est pas définie : `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - valeur par défaut : `30000` (30 secondes), maximum : `120000`

  </Accordion>

  <Accordion title="Redémarrages dus au délai d’expiration READY du Gateway">
    OpenClaw attend l’événement `READY` du Gateway Discord au démarrage et après les reconnexions de l’environnement d’exécution. Les configurations à plusieurs comptes dont les démarrages sont échelonnés peuvent nécessiter une fenêtre READY de démarrage plus longue que celle définie par défaut.

    Paramètres du délai d’expiration READY :

    - démarrage avec un seul compte : `channels.discord.gatewayReadyTimeoutMs`
    - démarrage avec plusieurs comptes : `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - variable d’environnement de secours au démarrage lorsque la configuration n’est pas définie : `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - valeur par défaut au démarrage : `15000` (15 secondes), maximum : `120000`
    - environnement d’exécution avec un seul compte : `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - environnement d’exécution avec plusieurs comptes : `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - variable d’environnement de secours pour l’environnement d’exécution lorsque la configuration n’est pas définie : `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - valeur par défaut pour l’environnement d’exécution : `30000` (30 secondes), maximum : `120000`

  </Accordion>

  <Accordion title="Incohérences dans l’audit des autorisations">
    Les vérifications d’autorisation de `channels status --probe` fonctionnent uniquement avec des identifiants de canal numériques.

    Si vous utilisez des clés sous forme de slugs, la correspondance à l’exécution peut tout de même fonctionner, mais la sonde ne peut pas vérifier entièrement les autorisations.

  </Accordion>

  <Accordion title="Problèmes de messages privés et d’appairage">

    - messages privés désactivés : `channels.discord.dm.enabled=false`
    - politique de messages privés désactivée : `channels.discord.dmPolicy="disabled"` (ancienne configuration : `channels.discord.dm.policy`)
    - approbation d’appairage en attente en mode `pairing`

  </Accordion>

  <Accordion title="Boucles entre bots">
    Par défaut, les messages rédigés par des bots sont ignorés.

    Si vous définissez `channels.discord.allowBots=true`, appliquez des règles strictes de mention et de liste d’autorisation afin d’éviter les boucles.
    Préférez `channels.discord.allowBots="mentions"` pour n’accepter que les messages de bots qui mentionnent le bot.

    OpenClaw intègre également une [protection partagée contre les boucles de bots](/fr/channels/bot-loop-protection). Chaque fois que `allowBots` permet à des messages rédigés par des bots d’atteindre le répartiteur, Discord associe l’événement entrant aux informations du triplet `(compte, canal, paire de bots)`, et la protection générique des paires bloque la paire lorsqu’elle dépasse le budget d’événements configuré. Cette protection empêche les boucles incontrôlées entre deux bots qui devaient auparavant être interrompues par les limites de débit de Discord ; elle n’affecte ni les déploiements à bot unique ni les réponses ponctuelles de bots qui restent sous le budget.

    Paramètres par défaut (actifs lorsque `allowBots` est défini) :

    - `maxEventsPerWindow: 20` -- la paire de bots peut échanger 20 messages au cours de la fenêtre glissante
    - `windowSeconds: 60` -- durée de la fenêtre glissante
    - `cooldownSeconds: 60` -- une fois le budget dépassé, chaque message supplémentaire entre les bots, dans un sens comme dans l’autre, est ignoré pendant une minute

    Configurez une seule fois la valeur partagée par défaut sous `channels.defaults.botLoopProtection`, puis remplacez-la pour Discord lorsqu’un processus légitime nécessite davantage de marge. L’ordre de priorité est le suivant :

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - valeurs par défaut intégrées

    Discord utilise les clés génériques `maxEventsPerWindow`, `windowSeconds` et `cooldownSeconds`.

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
    discord: {
      // Remplacement facultatif pour l’ensemble de Discord. Les blocs de compte remplacent
      // les champs individuels et héritent d’ici les champs omis.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        alpha: {
          // Alpha écoute les autres bots uniquement lorsqu’ils le mentionnent.
          allowBots: "mentions",
        },
        bravo: {
          // Bravo écoute tous les messages Discord rédigés par des bots.
          allowBots: true,
          mentionAliases: {
            // Permet à Bravo d’écrire une mention Discord d’Alpha avec l’identifiant utilisateur configuré.
            Alpha: "ALPHA_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Autorise jusqu’à cinq messages par minute avant de bloquer la paire.
            maxEventsPerWindow: 5,
            windowSeconds: 60,
            cooldownSeconds: 90,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Interruptions de la reconnaissance vocale avec DecryptionFailed(...)">

    - maintenez OpenClaw à jour (`openclaw update`) afin de disposer de la logique de récupération de la réception vocale Discord
    - vérifiez que `channels.discord.voice.daveEncryption=true` (valeur par défaut)
    - commencez avec `channels.discord.voice.decryptionFailureTolerance=24` (valeur par défaut en amont) et ajustez-la uniquement si nécessaire
    - surveillez les journaux pour repérer :
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - si les échecs persistent après la reconnexion automatique, recueillez les journaux et comparez-les à l’historique de réception DAVE en amont dans [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) et [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Référence de configuration

Référence principale : [Référence de configuration - Discord](/fr/gateway/config-channels#discord).

<Accordion title="Principaux champs Discord">

- démarrage/authentification : `enabled`, `token`, `applicationId`, `accounts.*`, `allowBots`
- politique : `groupPolicy`, `dmPolicy`, `allowFrom`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- commandes : `commands.native`, `commands.useAccessGroups` (global), `configWrites`, `slashCommand.ephemeral`
- file d’attente des événements : `eventQueue.listenerTimeout` (budget de l’écouteur, valeur par défaut `120000`), `eventQueue.maxQueueSize` (valeur par défaut `10000`), `eventQueue.maxConcurrency` (valeur par défaut `50`)
- Gateway : `proxy`, `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- réponses/historique : `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- distribution : `textChunkLimit` (valeur par défaut `2000`), `maxLinesPerMessage` (valeur par défaut `17`)
- diffusion en continu : `streaming.mode`, `streaming.chunkMode`, `streaming.preview.*`, `streaming.progress.*`, `streaming.block.*` (les anciennes clés de premier niveau `streamMode`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce` et `chunkMode` sont migrées vers `streaming.*` par `openclaw doctor --fix`)
- médias/nouvelles tentatives : `mediaMaxMb` (limite les téléversements Discord sortants, valeur par défaut `100`), `retry`
- actions : `actions.*`
- présence : `activity`, `status`, `activityType`, `activityUrl`, `autoPresence.*`
- interface utilisateur : `ui.components.accentColor`
- fonctionnalités : `threadBindings`, `bindings[]` au niveau supérieur (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Sécurité et exploitation

- Traitez les jetons de bot comme des secrets (`DISCORD_BOT_TOKEN` est recommandé dans les environnements supervisés).
- Accordez les autorisations Discord minimales nécessaires.
- Si le déploiement ou l’état des commandes est obsolète, redémarrez le Gateway et vérifiez à nouveau avec `openclaw channels status --probe`.

## Pages associées

<CardGroup cols={2}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    Associez un utilisateur Discord au Gateway.
  </Card>
  <Card title="Groupes" icon="users" href="/fr/channels/groups">
    Comportement des discussions de groupe et des listes d’autorisation.
  </Card>
  <Card title="Routage des canaux" icon="route" href="/fr/channels/channel-routing">
    Acheminez les messages entrants vers les agents.
  </Card>
  <Card title="Sécurité" icon="shield" href="/fr/gateway/security">
    Modèle de menace et renforcement de la sécurité.
  </Card>
  <Card title="Routage multi-agent" icon="sitemap" href="/fr/concepts/multi-agent">
    Associez les serveurs et les canaux aux agents.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/fr/tools/slash-commands">
    Comportement des commandes natives.
  </Card>
</CardGroup>
