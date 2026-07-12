---
read_when:
    - Développement des fonctionnalités du canal Discord
summary: Configuration du bot Discord, clés de configuration, composants, voix et dépannage
title: Discord
x-i18n:
    generated_at: "2026-07-12T21:37:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6cb693cd1c772570cd09ca3ac3ad6278ac93e9641b25ed06e1496f98b75e8b1b
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw se connecte à Discord en tant que bot via le Gateway officiel de Discord. Les messages privés et les canaux de serveur sont pris en charge.

<CardGroup cols={3}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    Les messages privés Discord utilisent par défaut le mode d’appairage.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/fr/tools/slash-commands">
    Comportement des commandes natives et catalogue des commandes.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Flux de diagnostic et de réparation intercanaux.
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
    Malgré son nom, cette opération génère votre premier jeton : rien n’est « réinitialisé ».
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

    Il s’agit de la configuration minimale pour les canaux textuels ordinaires. Si le bot publie dans des fils de discussion — notamment dans les flux de canaux de forum ou multimédias qui créent ou poursuivent un fil — activez également **Send Messages in Threads**.

    Copiez l’URL générée, ouvrez-la dans un navigateur, sélectionnez votre serveur, puis cliquez sur **Continue**. Le bot devrait maintenant apparaître sur votre serveur.

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
    Pour que l’appairage fonctionne, Discord doit autoriser le bot à vous envoyer un message privé. Faites un clic droit sur l’**icône de votre serveur** → **Privacy Settings** → activez **Direct Messages**.

    Laissez cette option activée si vous utilisez les messages privés Discord avec OpenClaw. Si vous utilisez uniquement les canaux du serveur, vous pouvez la désactiver après l’appairage.

  </Step>

  <Step title="Définir le jeton de votre bot de manière sécurisée (ne l’envoyez pas dans le chat)">
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

    Si OpenClaw s’exécute déjà en tant que service d’arrière-plan, redémarrez-le via l’application OpenClaw pour Mac ou en arrêtant puis en relançant le processus `openclaw gateway run`.
    Pour les installations en tant que service géré, exécutez `openclaw gateway install` depuis un shell où `DISCORD_BOT_TOKEN` est défini, ou stockez la variable dans `~/.openclaw/.env` afin que le service puisse résoudre la SecretRef d’environnement après le redémarrage.
    Si votre hôte est bloqué ou soumis à une limitation de débit par la recherche de l’application au démarrage auprès de Discord, définissez l’identifiant d’application/client depuis le portail des développeurs afin que le démarrage puisse ignorer cet appel REST : `channels.discord.applicationId` pour le compte par défaut, ou `channels.discord.accounts.<accountId>.applicationId` pour chaque bot.

  </Step>

  <Step title="Configurer OpenClaw et effectuer l’appairage">

    <Tabs>
      <Tab title="Demander à votre agent">
        Discutez avec votre agent OpenClaw sur un canal existant (par exemple Telegram) et indiquez-lui les informations. Si Discord est votre premier canal, utilisez plutôt l’onglet CLI / configuration.

        > « J’ai déjà défini le jeton de mon bot Discord dans la configuration. Veuillez terminer la configuration de Discord avec l’identifiant utilisateur `<user_id>` et l’identifiant de serveur `<server_id>`. »
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

        Pour une configuration scriptée ou distante, écrivez le même bloc JSON5 avec `openclaw config patch --file ./discord.patch.json5 --dry-run`, puis réexécutez la commande sans `--dry-run`. Les chaînes `token` en texte brut fonctionnent également, et les valeurs SecretRef sont prises en charge pour `channels.discord.token` avec les fournisseurs env/file/exec. Consultez [Gestion des secrets](/fr/gateway/secrets).

        Pour plusieurs bots Discord, conservez le jeton et l’identifiant d’application de chaque bot sous son compte. Une valeur `channels.discord.applicationId` de premier niveau est héritée par les comptes ; ne la définissez donc à cet emplacement que si tous les comptes utilisent le même identifiant d’application.

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

  <Step title="Approuver le premier appairage par message privé">
    Une fois le Gateway en cours d’exécution, envoyez un message privé à votre bot dans Discord. Il répond avec un code d’appairage.

    <Tabs>
      <Tab title="Demander à votre agent">
        Envoyez le code d’appairage à votre agent sur votre canal existant :

        > « Approuvez ce code d’appairage Discord : `<CODE>` »
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Les codes d’appairage expirent après 1 heure. Après l’approbation, discutez avec votre agent dans un message privé Discord.

  </Step>
</Steps>

<Note>
La résolution des jetons tient compte du compte. Les valeurs de jeton de la configuration prévalent sur la variable d’environnement de secours, et `DISCORD_BOT_TOKEN` est utilisé uniquement pour le compte par défaut.
Si deux comptes Discord activés sont associés au même jeton de bot, OpenClaw ne démarre qu’un seul moniteur Gateway pour ce jeton : un jeton provenant de la configuration prévaut sur la variable d’environnement de secours ; sinon, le premier compte activé prévaut et le compte en double est signalé comme désactivé avec la raison `duplicate bot token`.
Pour les appels sortants avancés (outil de messagerie/actions de canal), un `token` explicite propre à l’appel est utilisé pour cet appel. Cela s’applique aux actions d’envoi et de type lecture/sonde (lecture/recherche/récupération/fil/épingles/autorisations). Les paramètres de politique et de nouvelle tentative du compte proviennent toujours du compte sélectionné dans l’instantané d’exécution actif.
</Note>

## Recommandation : configurer un espace de travail de serveur

Une fois les messages privés fonctionnels, vous pouvez transformer votre serveur en un espace de travail complet dans lequel chaque canal dispose de sa propre session d’agent et de son propre contexte. Cette configuration est recommandée pour les serveurs privés où il n’y a que vous et votre bot.

<Steps>
  <Step title="Ajouter votre serveur à la liste d’autorisation des serveurs">
    Cela permet à votre agent de répondre dans n’importe quel canal de votre serveur, et pas uniquement dans les messages privés.

    <Tabs>
      <Tab title="Demander à votre agent">
        > « Ajoutez l’identifiant de mon serveur Discord `<server_id>` à la liste d’autorisation des serveurs »
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

  <Step title="Autoriser les réponses sans @mention">
    Par défaut, l’agent répond dans les canaux du serveur uniquement lorsqu’il est @mentionné. Sur un serveur privé, vous souhaiterez probablement qu’il réponde à chaque message.

    Dans les canaux du serveur, les réponses ordinaires sont publiées automatiquement par défaut. Pour les salons partagés toujours actifs, activez `messages.groupChat.visibleReplies: "message_tool"` afin que l’agent puisse rester en retrait et ne publier que lorsqu’il estime qu’une réponse dans le canal est utile. Ce mode fonctionne mieux avec les modèles de dernière génération fiables dans l’utilisation des outils, tels que GPT-5.6 Sol. Les événements ambiants du salon restent silencieux tant que l’outil n’envoie rien. Consultez [Événements ambiants des salons](/fr/channels/ambient-room-events) pour obtenir la configuration complète du mode d’observation silencieuse.

    Si Discord affiche l’indicateur de saisie et que les journaux indiquent une utilisation de jetons, mais qu’aucun message n’est publié, vérifiez si le tour a été configuré comme un événement ambiant du salon ou s’il utilise les réponses visibles via l’outil de messagerie.

    <Tabs>
      <Tab title="Demander à votre agent">
        > « Autorisez mon agent à répondre sur ce serveur sans devoir être @mentionné »
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

        Pour exiger des envois via l’outil de messagerie pour les réponses visibles de groupe ou de canal, définissez `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Planifier l’utilisation de la mémoire dans les canaux du serveur">
    La mémoire à long terme (MEMORY.md) se charge automatiquement uniquement dans les sessions de messages privés ; les canaux du serveur ne la chargent pas.

    <Tabs>
      <Tab title="Demander à votre agent">
        > « Lorsque je pose des questions dans les canaux Discord, utilisez memory_search ou memory_get si vous avez besoin du contexte à long terme provenant de MEMORY.md. »
      </Tab>
      <Tab title="Manuel">
        Pour partager le contexte dans chaque canal, placez les instructions stables dans `AGENTS.md` ou `USER.md` (injectés dans chaque session). Conservez les notes à long terme dans `MEMORY.md` et consultez-les à la demande à l’aide des outils de mémoire.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Créez maintenant des canaux et commencez à discuter. L’agent voit le nom du canal, et chaque canal constitue une session isolée : configurez `#coding`, `#home`, `#research` ou tout autre canal adapté à votre flux de travail.

## Modèle d’exécution

- Le Gateway gère la connexion à Discord.
- Le routage des réponses est déterministe : les réponses aux messages entrants de Discord sont renvoyées à Discord.
- Les métadonnées de serveur/canal Discord sont ajoutées au prompt du modèle en tant que contexte non fiable, et non comme préfixe de réponse visible par l’utilisateur. Si un modèle recopie cette enveloppe dans sa réponse, OpenClaw supprime les métadonnées copiées des réponses sortantes et du contexte des relectures ultérieures.
- Par défaut (`session.dmScope=main`), les discussions directes partagent la session principale de l’agent (`agent:main:main`).
- Les canaux de serveur utilisent des clés de session isolées (`agent:<agentId>:discord:channel:<channelId>`).
- Les messages privés de groupe sont ignorés par défaut (`channels.discord.dm.groupEnabled=false`).
- Les commandes slash natives s’exécutent dans des sessions de commande isolées (`agent:<agentId>:discord:slash:<userId>`), tout en transmettant `CommandTargetSessionKey` à la session de conversation routée.
- La diffusion sur Discord des annonces Cron/Heartbeat uniquement textuelles est réduite à la réponse finale visible de l’assistant, envoyée une seule fois. Les contenus multimédias et les charges utiles de composants structurés restent répartis sur plusieurs messages lorsque l’agent produit plusieurs charges utiles à transmettre.

## Canaux de forum

Les canaux de forum et multimédias Discord acceptent uniquement les publications dans des fils de discussion. OpenClaw permet de les créer de deux manières :

- Envoyez un message au parent du forum (`channel:<forumId>`) pour créer automatiquement un fil. Le titre du fil correspond à la première ligne non vide du message (tronquée à la limite de 100 caractères imposée par Discord pour le nom des fils).
- Utilisez `openclaw message thread create` pour créer directement un fil. Ne transmettez pas `--message-id` pour les canaux de forum.

Envoyez un message au parent du forum pour créer un fil :

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Titre du sujet\nCorps de la publication"
```

Créez explicitement un fil de forum :

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Titre du sujet" --message "Corps de la publication"
```

Les parents de forum n'acceptent pas les composants Discord. Si vous avez besoin de composants, envoyez-les au fil lui-même (`channel:<threadId>`).

## Composants interactifs

OpenClaw prend en charge les conteneurs de composants v2 de Discord pour les messages des agents. Utilisez l'outil de messagerie avec une charge utile `components`. Les résultats des interactions sont renvoyés à l'agent comme des messages entrants normaux et respectent les paramètres Discord `replyToMode` existants.

Blocs pris en charge :

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Les lignes d'actions autorisent jusqu'à 5 boutons ou un seul menu de sélection
- Types de sélection : `string`, `user`, `role`, `mentionable`, `channel`

Par défaut, les composants sont à usage unique. Définissez `components.reusable=true` pour permettre l'utilisation répétée des boutons, sélections et formulaires jusqu'à leur expiration.

Pour limiter les utilisateurs autorisés à cliquer sur un bouton, définissez `allowedUsers` sur ce bouton (identifiants d'utilisateur Discord, tags ou `*`). Les utilisateurs non correspondants reçoivent un refus éphémère.

Les rappels de composants expirent après 30 minutes par défaut. Définissez `channels.discord.agentComponents.ttlMs` pour modifier la durée de vie du registre de rappels du compte par défaut, ou `channels.discord.accounts.<accountId>.agentComponents.ttlMs` pour chaque compte. La valeur est exprimée en millisecondes, doit être un entier positif et est plafonnée à `86400000` (24 heures). Des durées de vie plus longues conviennent aux processus de révision ou d'approbation qui nécessitent que les boutons restent utilisables, mais elles prolongent la période pendant laquelle un ancien message Discord peut encore déclencher une action. Privilégiez la durée de vie la plus courte qui convienne et conservez la valeur par défaut si des rappels obsolètes seraient inattendus.

Les commandes slash `/model` et `/models` ouvrent un sélecteur de modèle interactif comprenant des listes déroulantes pour le fournisseur, le modèle et le runtime compatible, ainsi qu'une étape Submit. `/models add` est obsolète et renvoie un message d'obsolescence au lieu d'enregistrer des modèles depuis la discussion. La réponse du sélecteur est éphémère et utilisable uniquement par l'utilisateur qui l'a invoqué. Les menus de sélection Discord sont limités à 25 options ; ajoutez donc des entrées `provider/*` à `agents.defaults.models` lorsque vous souhaitez que le sélecteur affiche les modèles découverts dynamiquement uniquement pour certains fournisseurs, tels que `openai` ou `vllm`.

Pièces jointes :

- Les blocs `file` doivent pointer vers une référence de pièce jointe (`attachment://<filename>`)
- Fournissez la pièce jointe via `media`/`path`/`filePath` (un seul fichier) ; utilisez `media-gallery` pour plusieurs fichiers
- Utilisez `filename` pour remplacer le nom du fichier téléversé lorsqu'il doit correspondre à la référence de pièce jointe

Formulaires modaux :

- Ajoutez `components.modal` avec jusqu'à 5 champs
- Types de champs : `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw ajoute automatiquement un bouton de déclenchement

Exemple :

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Texte de secours facultatif",
  components: {
    reusable: true,
    text: "Choisissez une voie",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approuver",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Refuser", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Choisissez une option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Détails",
      triggerLabel: "Ouvrir le formulaire",
      fields: [
        { type: "text", label: "Demandeur" },
        {
          type: "select",
          label: "Priorité",
          options: [
            { label: "Faible", value: "low" },
            { label: "Élevée", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## Contrôle d'accès et routage

<Tabs>
  <Tab title="Politique des messages privés">
    `channels.discord.dmPolicy` contrôle l'accès aux messages privés. `channels.discord.allowFrom` est la liste d'autorisation canonique pour les messages privés.

    - `pairing` (par défaut)
    - `allowlist` (nécessite au moins un expéditeur dans `allowFrom`)
    - `open` (nécessite que `channels.discord.allowFrom` inclue `"*"`)
    - `disabled`

    Si la politique des messages privés n'est pas ouverte, les utilisateurs inconnus sont bloqués (ou invités à effectuer l'association en mode `pairing`).

    Ordre de priorité pour plusieurs comptes :

    - `channels.discord.accounts.default.allowFrom` s'applique uniquement au compte `default`.
    - Pour un compte, `allowFrom` est prioritaire sur l'ancien `dm.allowFrom`.
    - Les comptes nommés héritent de `channels.discord.allowFrom` lorsque leurs propres `allowFrom` et ancien `dm.allowFrom` ne sont pas définis.
    - Les comptes nommés n'héritent pas de `channels.discord.accounts.default.allowFrom`.

    Les anciens paramètres `channels.discord.dm.policy` et `channels.discord.dm.allowFrom` sont toujours lus à des fins de compatibilité. `openclaw doctor --fix` les migre vers `dmPolicy` et `allowFrom` lorsqu'il peut le faire sans modifier l'accès.

    Format de la cible de message privé pour la livraison :

    - `user:<id>`
    - mention `<@id>`

    Les identifiants numériques seuls sont normalement interprétés comme des identifiants de canal lorsqu'un canal par défaut est actif, mais les identifiants figurant dans la liste d'autorisation effective `allowFrom` des messages privés du compte sont traités comme des cibles de messages privés d'utilisateur à des fins de compatibilité.

  </Tab>

  <Tab title="Groupes d'accès">
    Les messages privés Discord et l'autorisation des commandes textuelles peuvent utiliser des entrées dynamiques `accessGroup:<name>` dans `channels.discord.allowFrom`.

    Les noms de groupes d'accès sont partagés entre les canaux de messagerie. Utilisez `type: "message.senders"` pour un groupe statique dont les membres sont exprimés selon la syntaxe `allowFrom` normale de chaque canal, ou `type: "discord.channelAudience"` lorsque l'audience `ViewChannel` actuelle d'un canal Discord doit définir dynamiquement l'appartenance. Comportement partagé des groupes d'accès : [Groupes d'accès](/fr/channels/access-groups).

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

    Un canal textuel Discord ne possède pas de liste de membres distincte. `type: "discord.channelAudience"` modélise l'appartenance ainsi : l'expéditeur du message privé est membre du serveur configuré et dispose actuellement de l'autorisation effective `ViewChannel` sur le canal configuré après application des rôles et des remplacements d'autorisations du canal.

    Exemple : autoriser toute personne pouvant voir `#maintainers` à envoyer un message privé au bot, tout en maintenant les messages privés fermés à tous les autres utilisateurs.

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

    Les recherches échouent de manière sécurisée. Si Discord renvoie `Missing Access`, si la recherche du membre échoue ou si le canal appartient à un autre serveur, l'expéditeur du message privé est considéré comme non autorisé.

    Activez **Server Members Intent** dans le Discord Developer Portal lorsque vous utilisez des groupes d'accès fondés sur l'audience d'un canal. Les messages privés n'incluent pas l'état du membre du serveur ; OpenClaw récupère donc le membre via l'API REST de Discord au moment de l'autorisation.

  </Tab>

  <Tab title="Politique des serveurs">
    La gestion des serveurs est contrôlée par `channels.discord.groupPolicy` :

    - `open`
    - `allowlist`
    - `disabled`

    Lorsque `channels.discord` existe, la configuration sécurisée de référence est `allowlist`.

    Comportement de `allowlist` :

    - le serveur doit correspondre à `channels.discord.guilds` (`id` privilégié, slug accepté)
    - listes d'autorisation facultatives des expéditeurs : `users` (identifiants stables recommandés) et `roles` (identifiants de rôles uniquement) ; si l'une ou l'autre est configurée, les expéditeurs sont autorisés lorsqu'ils correspondent à `users` OU `roles`
    - la correspondance directe par nom ou tag est désactivée par défaut ; activez `channels.discord.dangerouslyAllowNameMatching: true` uniquement comme mode de compatibilité d'urgence
    - les noms et tags sont pris en charge pour `users`, mais les identifiants sont plus sûrs ; `openclaw security audit` émet un avertissement lorsque des entrées par nom ou tag sont utilisées
    - si des `channels` sont configurés pour un serveur, les canaux non répertoriés sont refusés
    - si un serveur ne possède aucun bloc `channels`, tous les canaux de ce serveur figurant dans la liste d'autorisation sont autorisés

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

    L'ancienne clé `allow` propre à chaque canal est migrée vers `enabled` par `openclaw doctor --fix`.

    Si vous définissez uniquement `DISCORD_BOT_TOKEN` sans créer de bloc `channels.discord`, la valeur de repli à l'exécution est `groupPolicy="allowlist"` (avec un avertissement dans les journaux), même si `channels.defaults.groupPolicy` vaut `open`.

  </Tab>

  <Tab title="Mentions et messages privés de groupe">
    Les messages des serveurs nécessitent par défaut une mention.

    La détection des mentions comprend :

    - une mention explicite du bot
    - les modèles de mention configurés (`agents.list[].groupChat.mentionPatterns`, avec repli sur `messages.groupChat.mentionPatterns`)
    - le comportement implicite de réponse au bot dans les cas pris en charge

    Lorsque vous rédigez des messages Discord sortants, utilisez la syntaxe canonique des mentions : `<@USER_ID>` pour les utilisateurs, `<#CHANNEL_ID>` pour les canaux et `<@&ROLE_ID>` pour les rôles. N'utilisez pas l'ancienne forme de mention de pseudonyme `<@!USER_ID>`.

    `requireMention` est configuré par serveur et par canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` ignore facultativement les messages qui mentionnent un autre utilisateur ou rôle, mais pas le bot (à l'exception de @everyone/@here).

    Messages privés de groupe :

    - par défaut : ignorés (`dm.groupEnabled=false`)
    - liste d'autorisation facultative via `dm.groupChannels` (identifiants de canaux ou slugs)

  </Tab>
</Tabs>

### Routage des agents fondé sur les rôles

Utilisez `bindings[].match.roles` pour acheminer les membres d'un serveur Discord vers différents agents selon leur identifiant de rôle. Les liaisons fondées sur les rôles acceptent uniquement des identifiants de rôles et sont évaluées après les liaisons par pair ou pair parent, mais avant les liaisons limitées au serveur. Si une liaison définit également d'autres champs de correspondance (par exemple `peer` + `guildId` + `roles`), tous les champs configurés doivent correspondre.

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
  - L’authentification des commandes natives utilise les mêmes listes d’autorisation et stratégies Discord que le traitement normal des messages.
  - Les commandes peuvent rester visibles dans l’interface de Discord pour les utilisateurs non autorisés ; leur exécution applique l’authentification OpenClaw et répond « non autorisé ».
  - Paramètres par défaut des commandes slash : `ephemeral: true` (`channels.discord.slashCommand.ephemeral`).

  Consultez [Commandes slash](/fr/tools/slash-commands) pour connaître le catalogue et le comportement des commandes.

  ## Détails des fonctionnalités

  <AccordionGroup>
  <Accordion title="Balises de réponse et réponses natives">
    Discord prend en charge les balises de réponse dans la sortie de l’agent :

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Contrôlé par `channels.discord.replyToMode` :

    - `off` (par défaut) : aucun fil de réponse implicite ; les balises `[[reply_to_*]]` explicites sont toujours prises en compte
    - `first` : associe la référence de réponse native implicite au premier message Discord sortant du tour
    - `all` : l’associe à chaque message sortant
    - `batched` : l’associe uniquement lorsque l’événement entrant était un lot temporisé de plusieurs messages — utile si vous souhaitez utiliser les réponses natives principalement pour les conversations ambiguës comportant des rafales de messages, plutôt que pour chaque tour à message unique

    Les identifiants de message sont inclus dans le contexte et l’historique afin que les agents puissent cibler des messages précis.

  </Accordion>

  <Accordion title="Aperçus des liens">
    Discord génère par défaut des intégrations enrichies pour les URL. OpenClaw désactive par défaut ces intégrations générées dans les messages Discord sortants, afin que les URL envoyées par l’agent restent de simples liens, sauf si vous activez cette fonctionnalité :

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Définissez `channels.discord.accounts.<id>.suppressEmbeds` pour remplacer ce comportement pour un compte. Les envois effectués par l’outil de messagerie de l’agent peuvent également transmettre `suppressEmbeds: false` pour un seul message. Les charges utiles Discord `embeds` explicites ne sont pas désactivées par le paramètre par défaut des aperçus de liens.

  </Accordion>

  <Accordion title="Aperçu du flux en direct">
    OpenClaw peut diffuser les brouillons de réponse en envoyant un message temporaire et en le modifiant à mesure que le texte arrive. `channels.discord.streaming.mode` accepte `off` | `partial` | `block` | `progress` (valeur par défaut lorsqu’aucune clé `streaming` ni clé héritée `streamMode` n’est définie). `streamMode` est un alias hérité ; exécutez `openclaw doctor --fix` pour réécrire la configuration persistante selon la structure imbriquée canonique `streaming`.

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

    - `off` désactive les modifications de l’aperçu Discord.
    - `partial` modifie un seul message d’aperçu à mesure que les jetons arrivent.
    - `block` émet des segments de la taille d’un brouillon ; ajustez leur taille et leurs points de coupure avec `streaming.preview.chunk` (`minChars`, `maxChars`, `breakPreference`), dans la limite de `textChunkLimit`. Lorsque la diffusion par blocs est explicitement activée, OpenClaw ignore le flux d’aperçu afin d’éviter une double diffusion.
    - `progress` conserve un brouillon d’état modifiable et le met à jour avec la progression des outils jusqu’à la livraison finale. La progression brute des outils utilise le libellé initial partagé comme ligne déroulante ; l’état narré n’affiche que la narration, sauf si un libellé est explicitement configuré.
    - Les résultats finaux contenant un média, une erreur ou une réponse explicite annulent les modifications d’aperçu en attente.
    - `streaming.preview.toolProgress` (valeur par défaut : `true`) détermine si les mises à jour des outils et de la progression réutilisent le message d’aperçu.
    - Les lignes d’outil et de progression s’affichent sous une forme compacte avec un émoji, un titre et des détails lorsqu’ils sont disponibles, par exemple `🛠️ Bash: run tests` ou `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (valeur par défaut : `false`) permet d’inclure le texte de commentaire ou de préambule de l’assistant dans le brouillon de progression temporaire. Le commentaire est nettoyé avant l’affichage, reste temporaire et ne modifie pas la livraison de la réponse finale.
    - `streaming.progress.maxLineChars` définit la limite de l’aperçu de progression par ligne. Le texte est raccourci aux limites des mots ; les détails des commandes et des chemins conservent les suffixes utiles.
    - `streaming.preview.commandText` / `streaming.progress.commandText` contrôle les détails des commandes et de leur exécution dans les lignes de progression compactes : `raw` (valeur par défaut) ou `status` (libellé de l’outil uniquement).

    Masquez le texte brut des commandes/exécutions tout en conservant des lignes de progression compactes :

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

    La diffusion de l’aperçu ne prend en charge que le texte ; les réponses contenant des médias utilisent le mode d’envoi normal.

  </Accordion>

  <Accordion title="Historique, contexte et comportement des fils de discussion">
    Contexte de l’historique de la guilde :

    - `channels.discord.historyLimit` vaut `20` par défaut
    - valeur de repli : `messages.groupChat.historyLimit`
    - `0` désactive cette fonctionnalité

    Contrôles de l’historique des messages privés :

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportement des fils de discussion :

    - Les fils de discussion Discord sont acheminés comme des sessions de canal et héritent de la configuration du canal parent, sauf remplacement explicite.
    - Les sessions de fil de discussion héritent de la sélection `/model` du canal parent au niveau de la session uniquement comme modèle de repli ; les sélections `/model` propres au fil de discussion sont prioritaires, et l’historique de la transcription parente n’est pas copié sauf si l’héritage de transcription est activé.
    - `channels.discord.thread.inheritParent` (`false` par défaut) permet d’initialiser les nouveaux fils automatiques à partir de la transcription parente. Remplacement par compte : `channels.discord.accounts.<id>.thread.inheritParent`.
    - Les réactions de l’outil de messagerie peuvent résoudre les cibles de messages privés `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` est conservé lors du mécanisme de repli d’activation à l’étape de réponse.

    Les sujets des canaux sont injectés comme contexte **non fiable**. Les listes d’autorisation déterminent qui peut déclencher l’agent, mais ne constituent pas une limite complète de masquage du contexte supplémentaire.

  </Accordion>

  <Accordion title="Sessions liées à un fil de discussion pour les sous-agents">
    Discord peut lier un fil de discussion à une cible de session afin que les messages suivants dans ce fil continuent d’être acheminés vers la même session, y compris les sessions de sous-agent.

    Commandes :

    - `/focus <target>` lie le fil actuel ou un nouveau fil à une cible de sous-agent/session
    - `/unfocus` supprime la liaison du fil actuel
    - `/agents` affiche les exécutions actives et l’état de la liaison
    - `/session idle <duration|off>` consulte/met à jour la suppression automatique de la liaison après une période d’inactivité pour les liaisons ciblées
    - `/session max-age <duration|off>` consulte/met à jour l’âge maximal absolu des liaisons ciblées

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

    Notes :

    - `session.threadBindings.*` définit les valeurs par défaut globales ; `channels.discord.threadBindings.*` remplace le comportement de Discord.
    - `spawnSessions` contrôle la création et la liaison automatiques des fils pour `sessions_spawn({ thread: true })` et les créations de fils ACP. Valeur par défaut : `true`.
    - `defaultSpawnContext` contrôle le contexte natif du sous-agent pour les créations liées à un fil. Valeur par défaut : `"fork"`.
    - Les clés obsolètes `spawnSubagentSessions`/`spawnAcpSessions` sont migrées par `openclaw doctor --fix`.
    - Si les liaisons de fils sont désactivées pour un compte, `/focus` et les opérations associées de liaison de fils ne sont pas disponibles.

    Consultez [Sous-agents](/fr/tools/subagents), [Agents ACP](/fr/tools/acp-agents) et [Référence de configuration](/fr/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Liaisons persistantes de canaux ACP">
    Pour des espaces de travail ACP stables et « toujours actifs », configurez des liaisons ACP typées de premier niveau ciblant des conversations Discord.

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

    Notes :

    - `/acp spawn codex --bind here` lie le canal ou le fil actuel sur place et conserve les futurs messages dans la même session ACP. Les messages du fil héritent de la liaison du canal parent.
    - Dans un canal ou un fil lié, `/new` et `/reset` réinitialisent la même session ACP sur place. Les liaisons temporaires de fils peuvent remplacer la résolution de la cible tant qu’elles sont actives.
    - `spawnSessions` contrôle la création et la liaison des fils enfants via `--thread auto|here`.

    Consultez [Agents ACP](/fr/tools/acp-agents) pour plus de détails sur le comportement des liaisons.

  </Accordion>

  <Accordion title="Notifications de réaction">
    Mode de notification des réactions par serveur (`guilds.<id>.reactionNotifications`) :

    - `off`
    - `own` (valeur par défaut)
    - `all`
    - `allowlist` (utilise `guilds.<id>.users`)

    Les événements de réaction sont convertis en événements système et associés à la session Discord acheminée.

  </Accordion>

  <Accordion title="Réactions d’accusé de réception">
    `ackReaction` envoie un émoji d’accusé de réception pendant qu’OpenClaw traite un message entrant.

    Ordre de résolution :

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - repli sur l’émoji de l’identité de l’agent (`agents.list[].identity.emoji`, sinon "👀")

    Notes :

    - Discord accepte les émojis Unicode ou les noms d’émojis personnalisés.
    - Utilisez `""` pour désactiver la réaction pour un canal ou un compte.

    **Portée (`messages.ackReactionScope`) :**

    Valeurs : `"all"` (messages privés + groupes, y compris les événements ambiants du salon), `"direct"` (messages privés uniquement), `"group-all"` (tous les messages de groupe à l’exception des événements ambiants du salon, aucun message privé), `"group-mentions"` (groupes lorsque le bot est mentionné ; **aucun message privé**, valeur par défaut), `"off"` / `"none"` (désactivé).

    <Note>
    La portée par défaut (`"group-mentions"`) ne déclenche pas de réaction d’accusé de réception dans les messages privés ni pour les événements ambiants du salon. Pour obtenir une réaction d’accusé de réception aux messages privés Discord entrants et aux événements des salons silencieux, définissez `messages.ackReactionScope` sur `"all"`.
    </Note>

  </Accordion>

  <Accordion title="Écritures de configuration">
    Les écritures de configuration initiées depuis un canal sont activées par défaut. Cela affecte les flux `/config set|unset` (lorsque les fonctionnalités de commande sont activées).

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

  <Accordion title="Proxy du Gateway">
    Acheminez le trafic WebSocket du Gateway Discord et les requêtes REST au démarrage (ID d’application + résolution de la liste d’autorisation) via un proxy HTTP(S) avec `channels.discord.proxy`.
    L’utilisation d’un proxy pour le WebSocket du Gateway Discord est explicite ; les connexions WebSocket n’héritent pas des variables d’environnement de proxy ambiantes du processus Gateway. Les requêtes REST au démarrage utilisent ce proxy lorsque `channels.discord.proxy` est configuré.

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

  <Accordion title="Prise en charge de PluralKit">
    Activez la résolution PluralKit pour associer les messages transmis par proxy à l’identité du membre du système :

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

  <Accordion title="Alias de mention sortants">
    Utilisez `mentionAliases` lorsque les agents ont besoin de mentions sortantes déterministes pour des utilisateurs Discord connus. Les clés sont des identifiants sans le préfixe `@` ; les valeurs sont des ID d’utilisateur Discord. Les identifiants inconnus, `@everyone`, `@here` et les mentions dans les segments de code Markdown restent inchangés.

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
      activity: "Programmation en direct",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Correspondance des types d’activité :

    - 0: Joue à
    - 1: Diffuse en direct (nécessite `activityUrl` ; `activityUrl` nécessite à son tour `activityType: 1`)
    - 2: Écoute
    - 3: Regarde
    - 4: Personnalisé (utilise le texte de l’activité comme état du statut ; l’émoji est facultatif)
    - 5: Participe à une compétition

    Présence automatique (signal d’état d’exécution) :

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

    La présence automatique associe la disponibilité de l’environnement d’exécution au statut Discord : opérationnel => en ligne, dégradé ou inconnu => inactif, épuisé ou indisponible => ne pas déranger. Valeurs par défaut : `intervalMs` 30000, `minUpdateIntervalMs` 15000 (doit être inférieur ou égal à `intervalMs`). Remplacements de texte facultatifs :

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (prend en charge l’espace réservé `{reason}`)

  </Accordion>

  <Accordion title="Approbations dans Discord">
    Discord prend en charge la gestion des approbations par boutons dans les messages privés et peut éventuellement publier les demandes d’approbation dans le canal d’origine.

    Chemin de configuration :

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (facultatif ; utilise `commands.ownerAllowFrom` comme solution de repli lorsque cela est possible)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, valeur par défaut : `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord active automatiquement les approbations d’exécution natives lorsque `enabled` n’est pas défini ou vaut `"auto"` et qu’au moins un approbateur peut être déterminé, soit à partir de `execApprovals.approvers`, soit à partir de `commands.ownerAllowFrom`. Discord ne déduit pas les approbateurs d’exécution depuis le paramètre de canal `allowFrom`, l’ancien `dm.allowFrom` ou le paramètre de message privé `defaultTo`. Définissez explicitement `enabled: false` pour désactiver Discord comme client d’approbation natif.

    Pour les commandes de groupe sensibles réservées au propriétaire, telles que `/diagnostics` et `/export-trajectory`, OpenClaw envoie les demandes d’approbation et les résultats finaux en privé. Il essaie d’abord les messages privés Discord lorsque le propriétaire à l’origine de l’appel dispose d’une route de propriétaire Discord ; sinon, il utilise comme solution de repli la première route de propriétaire disponible dans `commands.ownerAllowFrom`, par exemple Telegram.

    Lorsque `target` vaut `channel` ou `both`, la demande d’approbation est visible dans le canal. Seuls les approbateurs déterminés peuvent utiliser les boutons ; les autres utilisateurs reçoivent un refus éphémère. Les demandes d’approbation incluent le texte de la commande ; n’activez donc la diffusion dans le canal que pour les canaux de confiance. Si l’ID du canal ne peut pas être déduit de la clé de session, OpenClaw utilise les messages privés comme solution de repli.

    Discord affiche les boutons d’approbation partagés utilisés par les autres canaux de discussion ; l’adaptateur Discord natif ajoute principalement le routage des messages privés vers les approbateurs et la diffusion vers les canaux. Lorsque ces boutons sont présents, ils constituent l’interface principale d’approbation ; OpenClaw ne doit inclure une commande manuelle `/approve` que lorsque le résultat de l’outil indique que les approbations par discussion sont indisponibles ou que l’approbation manuelle est la seule voie possible. Si l’environnement d’exécution d’approbation natif de Discord n’est pas actif, OpenClaw conserve l’invite locale déterministe `/approve <id> <decision>` visible. Si l’environnement d’exécution est actif, mais qu’une carte native ne peut être envoyée à aucune cible, OpenClaw envoie une notification de repli dans la même discussion avec la commande `/approve` exacte de l’approbation en attente.

    L’authentification du Gateway et la résolution des approbations suivent le contrat partagé du client Gateway (les ID `plugin:` sont résolus via `plugin.approval.resolve` ; les autres ID via `exec.approval.resolve`). Par défaut, les approbations expirent après 30 minutes.

    Consultez [Approbations d’exécution](/fr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Outils et mécanismes d’autorisation des actions

Les actions de message Discord couvrent la messagerie, l’administration des canaux, la modération, la présence et les métadonnées.

Exemples principaux :

- messagerie : `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- réactions : `react`, `reactions`, `emojiList`
- modération : `timeout`, `kick`, `ban`
- présence : `setPresence`

L’action `event-create` accepte un paramètre `image` facultatif (URL ou chemin de fichier local) pour définir l’image de couverture de l’événement planifié.

Les mécanismes d’autorisation des actions se trouvent sous `channels.discord.actions.*`.

Comportement par défaut des mécanismes d’autorisation :

| Groupe d’actions                                                                                                                                                          | Valeur par défaut |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | activé            |
| roles                                                                                                                                                                    | désactivé         |
| moderation                                                                                                                                                               | désactivé         |
| presence                                                                                                                                                                 | désactivé         |

## Interface utilisateur Components v2

OpenClaw utilise les composants Discord v2 pour les approbations d’exécution et les marqueurs intercontextes. Les actions de message Discord peuvent également accepter `components` pour une interface utilisateur personnalisée (avancé ; nécessite la construction d’une charge utile de composant via l’outil Discord), tandis que les anciens `embeds` restent disponibles, mais ne sont pas recommandés.

- `channels.discord.ui.components.accentColor` définit la couleur d’accentuation utilisée par les conteneurs de composants Discord (hexadécimale). Par compte : `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` contrôle la durée pendant laquelle les rappels des composants Discord envoyés restent enregistrés (valeur par défaut `1800000`, maximum `86400000`). Par compte : `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` est ignoré lorsque des composants v2 sont présents.
- Les aperçus d’URL simples sont supprimés par défaut. Définissez `suppressEmbeds: false` sur une action de message lorsqu’un seul lien sortant doit être développé.

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

Discord possède deux surfaces vocales distinctes : les **canaux vocaux** en temps réel (conversations continues) et les **pièces jointes de messages vocaux** (format d’aperçu de la forme d’onde). Le Gateway prend en charge les deux.

### Canaux vocaux

Liste de vérification de la configuration :

1. Activez Message Content Intent dans Discord Developer Portal.
2. Activez Server Members Intent lorsque des listes d’autorisation de rôles ou d’utilisateurs sont utilisées.
3. Invitez le bot avec les portées `bot` et `applications.commands`.
4. Accordez Connect, Speak, Send Messages et Read Message History dans le canal vocal cible.
5. Activez les commandes natives (`commands.native` ou `channels.discord.commands.native`).
6. Configurez `channels.discord.voice`.

Utilisez `/vc join|leave|status` pour contrôler les sessions. La commande utilise l’agent par défaut du compte et suit les mêmes règles de liste d’autorisation et de politique de groupe que les autres commandes Discord.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Pour inspecter les autorisations effectives du bot avant de rejoindre le canal :

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

- La voix Discord est optionnelle pour les configurations uniquement textuelles ; définissez `channels.discord.voice.enabled=true` (ou conservez un bloc `channels.discord.voice` existant) pour activer les commandes `/vc`, l’environnement d’exécution vocal et l’intention Gateway `GuildVoiceStates`. `channels.discord.intents.voiceStates` permet de remplacer explicitement l’abonnement à l’intention ; laissez cette option non définie pour suivre l’activation effective de la voix.
- `voice.mode` contrôle le chemin de conversation. La valeur par défaut est `agent-proxy` : une interface vocale en temps réel gère le minutage des tours, les interruptions et la lecture, délègue le travail de fond à l’agent OpenClaw acheminé via `openclaw_agent_consult` et traite le résultat comme une invite Discord saisie par cet interlocuteur. `stt-tts` conserve l’ancien flux STT par lots suivi de TTS. `bidi` permet au modèle en temps réel de converser directement tout en exposant `openclaw_agent_consult` pour le cerveau OpenClaw.
- `voice.agentSession` détermine quelle conversation OpenClaw reçoit les tours vocaux. Laissez cette option non définie pour utiliser la propre session du canal vocal, ou définissez `{ mode: "target", target: "channel:<text-channel-id>" }` afin que le canal vocal serve d’extension microphone/haut-parleur à la session d’un canal textuel Discord existant, tel que `#maintainers`.
- `voice.model` remplace le cerveau de l’agent OpenClaw pour les réponses vocales Discord et les consultations en temps réel. Laissez cette option non définie pour hériter du modèle de l’agent acheminé. Elle est distincte de `voice.realtime.model`.
- `voice.followUsers` permet au bot de rejoindre, de suivre et de quitter les canaux vocaux Discord avec les utilisateurs sélectionnés. Consultez [Suivre des utilisateurs dans les canaux vocaux](#follow-users-in-voice).
- `agent-proxy` achemine la parole via `discord-voice`, qui préserve les autorisations normales du propriétaire et des outils pour l’interlocuteur et la session cible, mais masque l’outil `tts` de l’agent, car la voix Discord prend en charge la lecture. Par défaut, `agent-proxy` accorde à la consultation un accès aux outils entièrement équivalent à celui du propriétaire pour les interlocuteurs propriétaires (`voice.realtime.toolPolicy: "owner"`) et privilégie fortement la consultation de l’agent OpenClaw avant les réponses de fond (`voice.realtime.consultPolicy: "always"`). Dans ce mode `always` par défaut, la couche en temps réel ne prononce pas automatiquement de phrases d’attente avant la réponse de la consultation ; elle capture et transcrit la parole, puis énonce la réponse OpenClaw acheminée. Si plusieurs réponses de consultation forcée se terminent alors que Discord lit encore la première réponse, les réponses ultérieures à prononcer exactement sont mises en file d’attente jusqu’à ce que la lecture soit inactive, au lieu de remplacer la parole en milieu de phrase.
- En mode `stt-tts`, la STT utilise `tools.media.audio` ; `voice.model` n’affecte pas la transcription.
- Dans les modes en temps réel, `voice.realtime.provider`, `voice.realtime.model` et `voice.realtime.speakerVoice` configurent la session audio en temps réel. Pour OpenAI Realtime 2.1 avec le cerveau Codex, utilisez `voice.realtime.model: "gpt-realtime-2.1"` et `voice.model: "openai/gpt-5.6-sol"`.
- Par défaut, les modes vocaux en temps réel incluent les petits fichiers de profil `IDENTITY.md`, `USER.md` et `SOUL.md` dans les instructions du fournisseur en temps réel, afin que les tours directs rapides conservent la même identité, le même ancrage utilisateur et la même personnalité que l’agent OpenClaw acheminé. Définissez `voice.realtime.bootstrapContextFiles` sur un sous-ensemble pour personnaliser ce comportement, ou sur `[]` pour le désactiver. Seuls ces fichiers de profil sont pris en charge ; `AGENTS.md` reste dans le contexte normal de l’agent. Le contexte de profil injecté ne remplace pas `openclaw_agent_consult` pour le travail dans l’espace de travail, les faits actuels, la recherche en mémoire ou les actions reposant sur des outils.
- Dans le mode en temps réel OpenAI `agent-proxy`, définissez `voice.realtime.requireWakeName: true` pour que la voix Discord en temps réel reste silencieuse jusqu’à ce qu’une transcription commence ou se termine par un nom d’activation. Les noms d’activation configurés doivent comporter un ou deux mots. Si `voice.realtime.wakeNames` n’est pas défini, OpenClaw utilise le `name` de l’agent acheminé ainsi que `OpenClaw`, avec comme solution de repli l’identifiant de l’agent ainsi que `OpenClaw`. Le filtrage par nom d’activation désactive la réponse automatique du fournisseur en temps réel, achemine les tours acceptés par le chemin de consultation de l’agent OpenClaw et fournit un bref accusé de réception vocal lorsqu’un nom d’activation initial est reconnu à partir d’une transcription partielle avant l’arrivée de la transcription finale.
- Le fournisseur OpenAI en temps réel accepte les noms d’événements Realtime 2 actuels et les anciens alias compatibles avec Codex pour les événements de sortie audio et de transcription, afin que les instantanés de fournisseurs compatibles puissent diverger sans entraîner la perte de l’audio de l’assistant.
- `voice.realtime.bargeIn` détermine si les événements de début de parole Discord interrompent la lecture en temps réel active. Si cette option n’est pas définie, elle suit le paramètre d’interruption par l’audio d’entrée du fournisseur en temps réel.
- `voice.realtime.minBargeInAudioEndMs` contrôle la durée minimale de lecture de l’assistant avant qu’une interruption OpenAI en temps réel ne tronque l’audio. Valeur par défaut : `250`. Définissez `0` pour une interruption immédiate dans les pièces à faible écho, ou augmentez cette valeur pour les configurations de haut-parleurs générant beaucoup d’écho.
- `voice.tts` remplace `messages.tts` uniquement pour la lecture vocale en mode `stt-tts` ; les modes en temps réel utilisent plutôt `voice.realtime.speakerVoice`. Pour utiliser une voix OpenAI lors de la lecture sur Discord, définissez `voice.tts.provider: "openai"` et choisissez une voix de synthèse vocale sous `voice.tts.providers.openai.speakerVoice`. `cedar` constitue un bon choix à sonorité masculine avec le modèle TTS OpenAI actuel.
- Les remplacements de `systemPrompt` Discord propres à chaque canal s’appliquent aux tours de transcription vocale de ce canal vocal.
- Les tours de transcription vocale déterminent le statut de propriétaire à partir de `allowFrom` (ou `dm.allowFrom`) de Discord pour les commandes et les actions de canal réservées au propriétaire. La visibilité des outils de l’agent suit la politique d’outils configurée pour la session acheminée.
- Si `voice.autoJoin` contient plusieurs entrées pour une même guilde, OpenClaw rejoint le dernier canal configuré pour cette guilde.
- `voice.allowedChannels` est une liste d’autorisation de résidence facultative. Laissez cette option non définie pour autoriser `/vc join` à rejoindre n’importe quel canal vocal Discord autorisé. Lorsqu’elle est définie, `/vc join`, la connexion automatique au démarrage et les déplacements de l’état vocal du bot sont limités aux entrées `{ guildId, channelId }` répertoriées. Définissez-la sur un tableau vide pour refuser toutes les connexions aux canaux vocaux Discord. Si Discord déplace le bot hors de la liste d’autorisation, OpenClaw quitte ce canal et rejoint la cible de connexion automatique configurée lorsqu’elle est disponible.
- `voice.daveEncryption` et `voice.decryptionFailureTolerance` sont transmis aux options de connexion de `@discordjs/voice` ; les valeurs par défaut du projet en amont sont `daveEncryption=true` et `decryptionFailureTolerance=24`.
- OpenClaw utilise le codec `libopus-wasm` intégré pour la réception vocale Discord et la lecture PCM brute en temps réel. Il fournit une version WebAssembly épinglée de libopus et ne nécessite aucun module complémentaire opus natif.
- `voice.connectTimeoutMs` contrôle le délai d’attente initial de l’état Ready de `@discordjs/voice` pour `/vc join` et les tentatives de connexion automatique. Valeur par défaut : `30000`.
- `voice.reconnectGraceMs` contrôle la durée pendant laquelle OpenClaw attend qu’une session vocale déconnectée commence à se reconnecter avant de la détruire. Valeur par défaut : `15000`.
- En mode `stt-tts`, la lecture vocale ne s’arrête pas simplement parce qu’un autre utilisateur commence à parler. Pour éviter les boucles de rétroaction, OpenClaw ignore toute nouvelle capture vocale pendant la lecture TTS ; parlez une fois la lecture terminée pour passer au tour suivant. Les modes en temps réel transmettent les débuts de parole comme signaux d’interruption au fournisseur en temps réel.
- Dans les modes en temps réel, l’écho des haut-parleurs capté par un microphone ouvert peut être interprété comme une interruption et interrompre la lecture. Pour les salons Discord générant beaucoup d’écho, définissez `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` afin d’empêcher OpenAI d’interrompre automatiquement la réponse à la réception d’audio d’entrée. Ajoutez `voice.realtime.bargeIn: true` si vous souhaitez néanmoins que les événements de début de parole Discord interrompent la lecture active. Le pont OpenAI en temps réel ignore les troncatures de lecture plus courtes que `voice.realtime.minBargeInAudioEndMs`, considérées comme un écho ou un bruit probable, et les consigne comme ignorées au lieu d’effacer la lecture Discord.
- `voice.captureSilenceGraceMs` contrôle la durée pendant laquelle OpenClaw attend, après que Discord a signalé l’arrêt d’un interlocuteur, avant de finaliser ce segment audio pour la STT. Valeur par défaut : `2000` ; augmentez-la si Discord découpe les pauses normales en transcriptions partielles saccadées.
- Lorsque ElevenLabs est le fournisseur TTS sélectionné, la lecture vocale Discord utilise la TTS en flux continu et démarre à partir du flux de réponse du fournisseur. Les fournisseurs sans prise en charge du flux continu utilisent à la place le chemin fondé sur un fichier temporaire synthétisé.
- OpenClaw surveille les échecs de déchiffrement à la réception et effectue une récupération automatique en quittant puis en rejoignant le canal vocal après plusieurs échecs sur une courte période.
- Si les journaux de réception affichent de manière répétée `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` après une mise à jour, recueillez un rapport de dépendances et les journaux. La version intégrée de `@discordjs/voice` inclut le correctif de remplissage en amont issu de la PR discord.js #11449, qui a résolu le ticket discord.js #11419.
- Les événements de réception `The operation was aborted` sont attendus lorsqu’OpenClaw finalise un segment d’interlocuteur capturé ; il s’agit de diagnostics détaillés, et non d’avertissements.
- Les journaux détaillés de la voix Discord incluent un aperçu limité à une ligne de la transcription STT pour chaque segment d’interlocuteur accepté, afin que le débogage affiche à la fois le côté utilisateur et le côté réponse de l’agent sans produire un volume illimité de texte de transcription.
- En mode `agent-proxy`, la solution de repli de consultation forcée ignore les fragments de transcription probablement incomplets, tels que le texte se terminant par `...` ou par un connecteur final comme « et », ainsi que les formules de clôture manifestement non exploitables comme « je reviens tout de suite » ou « au revoir ». Les journaux affichent `forced agent consult skipped reason=...` lorsque cela empêche une réponse obsolète mise en file d’attente.

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

- `followUsers` accepte les identifiants utilisateur Discord bruts et les valeurs `discord:<id>`. OpenClaw normalise les deux formes avant de les faire correspondre aux événements d’état vocal.
- `followUsersEnabled` prend la valeur `true` par défaut lorsque `followUsers` est configuré. Définissez-la sur `false` pour conserver la liste enregistrée tout en interrompant le suivi vocal automatique.
- Lorsqu’un utilisateur suivi rejoint un canal vocal autorisé, OpenClaw rejoint ce canal. Lorsque l’utilisateur change de canal, OpenClaw le suit. Lorsque l’utilisateur suivi actif se déconnecte, OpenClaw quitte le canal.
- Si plusieurs utilisateurs suivis se trouvent dans la même guilde et que l’utilisateur suivi actif la quitte, OpenClaw rejoint le canal d’un autre utilisateur suivi avant de quitter la guilde. Si plusieurs utilisateurs suivis changent de canal simultanément, le dernier événement d’état vocal observé prévaut.
- `allowedChannels` continue de s’appliquer. Un utilisateur suivi dans un canal non autorisé est ignoré, et une session appartenant au suivi rejoint un autre utilisateur suivi ou quitte le canal.
- OpenClaw réconcilie les événements d’état vocal manqués au démarrage et à intervalles limités. La réconciliation échantillonne les guildes configurées et limite les recherches REST par exécution ; les très grandes listes `followUsers` peuvent donc nécessiter plus d’un intervalle pour converger.
- Si Discord ou un administrateur déplace le bot alors qu’il suit un utilisateur, OpenClaw reconstruit la session vocale et préserve la propriété du suivi lorsque la destination est autorisée. Si le bot est déplacé hors de `allowedChannels`, OpenClaw quitte le canal et rejoint la cible configurée lorsqu’elle existe.
- La récupération de réception DAVE peut quitter puis rejoindre le même canal après plusieurs échecs de déchiffrement. Les sessions appartenant au suivi conservent cette propriété pendant ce chemin de récupération, de sorte que la déconnexion ultérieure d’un utilisateur suivi entraîne toujours la sortie du canal.

Choisissez parmi les modes de connexion :

- Utilisez `followUsers` pour les configurations personnelles ou d’opérateur dans lesquelles le bot doit automatiquement être présent dans un canal vocal lorsque vous y êtes.
- Utilisez `autoJoin` pour les bots de salons fixes qui doivent être présents même lorsqu’aucun utilisateur suivi ne se trouve dans un canal vocal.
- Utilisez `/vc join` pour les connexions ponctuelles ou les salons dans lesquels une présence vocale automatique serait inattendue.

Codec vocal Discord :

- Les journaux de réception vocale affichent `discord voice: opus decoder: libopus-wasm`.
- La lecture en temps réel encode le PCM stéréo brut à 48 kHz en Opus avec le même paquet `libopus-wasm` intégré avant de transmettre les paquets à `@discordjs/voice`.
- La lecture de fichiers et de flux de fournisseurs transcode les données en PCM stéréo brut à 48 kHz avec ffmpeg, puis utilise `libopus-wasm` pour le flux de paquets Opus envoyé à Discord.

Pipeline STT suivi de TTS :

- La capture PCM de Discord est convertie en fichier WAV temporaire.
- `tools.media.audio` gère la reconnaissance vocale (STT), par exemple `openai/gpt-4o-mini-transcribe`.
- La transcription est transmise via l’entrée et le routage Discord tandis que le LLM de réponse s’exécute avec une politique de sortie vocale qui masque l’outil `tts` de l’agent et demande le renvoi de texte, car le canal vocal Discord prend en charge la lecture TTS finale.
- `voice.model`, lorsqu’il est défini, remplace uniquement le LLM de réponse pour cette interaction sur le canal vocal.
- `voice.tts` est fusionné par-dessus `messages.tts` ; les fournisseurs capables de diffuser en continu alimentent directement le lecteur, sinon le fichier audio obtenu est lu dans le canal rejoint.

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

En l’absence de bloc `voice.agentSession`, chaque canal vocal dispose de sa propre session OpenClaw routée. Par exemple, `/vc join channel:234567890123456789` communique avec la session de ce canal vocal Discord. Le modèle temps réel constitue uniquement l’interface vocale ; les demandes substantielles sont transmises à l’agent OpenClaw configuré. Si le modèle temps réel produit une transcription finale sans appeler l’outil de consultation, OpenClaw force la consultation en solution de repli afin que le comportement par défaut reste équivalent à une conversation avec l’agent.

Exemple hérité de STT avec TTS :

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

Voix comme extension d’une session de canal Discord existante :

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

En mode `agent-proxy`, le bot rejoint le canal vocal configuré, mais les interactions de l’agent OpenClaw utilisent la session routée et l’agent habituels du canal cible. La session vocale en temps réel restitue oralement le résultat renvoyé dans le canal vocal. L’agent superviseur peut toujours utiliser les outils de messagerie habituels conformément à sa politique d’outils, notamment envoyer un message Discord séparé si cette action est appropriée.

Pendant l’exécution d’une tâche OpenClaw déléguée, les nouvelles transcriptions vocales Discord sont traitées comme des commandes de contrôle de l’exécution en cours avant de démarrer une autre interaction de l’agent. Les phrases telles que « état », « annule cela », « utilise le correctif le plus petit » ou « lorsque tu as terminé, vérifie également les tests » sont classées comme une demande d’état, une annulation, une instruction d’orientation ou une demande de suivi pour la session active. Les résultats des demandes d’état, des annulations, des instructions d’orientation acceptées et des suivis sont restitués oralement dans le canal vocal afin que l’appelant sache si OpenClaw a traité la demande.

Formes de cible utiles :

- `target: "channel:123456789012345678"` effectue le routage via une session de canal textuel Discord.
- `target: "123456789012345678"` est traité comme une cible de canal.
- `target: "dm:123456789012345678"` ou `target: "user:123456789012345678"` effectue le routage via cette session de message direct.

Exemple OpenAI Realtime dans un environnement générant beaucoup d’écho :

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

Utilisez cette configuration lorsque le modèle entend sa propre lecture Discord via un microphone ouvert, mais que vous souhaitez toujours pouvoir l’interrompre en parlant. OpenClaw empêche OpenAI d’interrompre automatiquement la réponse en cas d’audio d’entrée brut, tandis que `bargeIn: true` permet aux événements de début de prise de parole de Discord et à l’audio d’un locuteur déjà actif d’annuler les réponses en temps réel actives avant que la prochaine intervention capturée n’atteigne OpenAI. Les signaux d’interruption très précoces dont la valeur `audioEndMs` est inférieure à `minBargeInAudioEndMs` sont considérés comme de l’écho ou du bruit probable et ignorés afin que le modèle ne s’interrompe pas dès la première trame de lecture.

Journaux vocaux attendus :

- Lors de la connexion : `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Au démarrage du temps réel : `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Lors de l’audio du locuteur : `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` et `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Lorsqu’une parole obsolète est ignorée : `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` ou `reason=non-actionable-closing ...`
- À la fin de la réponse en temps réel : `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Lors de l’arrêt ou de la réinitialisation de la lecture : `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Lors d’une consultation en temps réel : `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Lors de la réponse de l’agent : `discord voice: agent turn answer ...`
- Lorsqu’une parole exacte est mise en file d’attente : `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, suivi de `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Lors de la détection d’une interruption : `discord voice: realtime barge-in detected source=speaker-start ...` ou `discord voice: realtime barge-in detected source=active-speaker-audio ...`, suivi de `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Lors d’une interruption en temps réel : `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, suivi soit de `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...`, soit de `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Lorsqu’un écho ou un bruit est ignoré : `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Lorsque l’interruption est désactivée : `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Lorsque la lecture est inactive : `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Pour diagnostiquer un son interrompu, lisez les journaux vocaux en temps réel comme une chronologie :

1. `realtime audio playback started` signifie que Discord a commencé à lire l’audio de l’assistant. À partir de cet instant, la passerelle commence à compter les fragments de sortie de l’assistant, les octets PCM Discord, les octets temps réel du fournisseur et la durée de l’audio synthétisé.
2. `realtime speaker turn opened` signale qu’un locuteur Discord devient actif. Si la lecture est déjà active et que `bargeIn` est activé, ce message peut être suivi de `barge-in detected source=speaker-start`.
3. `realtime input audio started` signale la première trame audio réellement reçue pour cette intervention du locuteur. Une valeur `outputActive=true` ou une valeur `outputAudioMs` non nulle à cet endroit signifie que le microphone envoie une entrée alors que la lecture de l’assistant est encore active.
4. `barge-in detected source=active-speaker-audio` signifie qu’OpenClaw a détecté l’audio en direct d’un locuteur pendant que la lecture de l’assistant était active. Cela permet de distinguer une véritable interruption d’un événement de début de prise de parole Discord dépourvu d’audio utile.
5. `barge-in requested reason=...` signifie qu’OpenClaw a demandé au fournisseur temps réel d’annuler ou de tronquer la réponse active. Le message inclut `outputAudioMs`, `outputActive` et `playbackChunks` afin que vous puissiez voir la quantité d’audio de l’assistant qui avait réellement été lue avant l’interruption.
6. `realtime audio playback stopped reason=...` est le point de réinitialisation de la lecture Discord locale. La raison indique l’origine de l’arrêt de la lecture : `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` ou `session-close`.
7. `realtime speaker turn closed` résume l’intervention d’entrée capturée. `chunks=0` ou `hasAudio=false` signifie que l’intervention du locuteur a commencé, mais qu’aucun audio exploitable n’a atteint la passerelle temps réel. `interruptedPlayback=true` signifie que cette intervention d’entrée a chevauché la sortie de l’assistant et déclenché la logique d’interruption.

Champs utiles :

- `outputAudioMs` : durée de l’audio de l’assistant généré par le fournisseur temps réel avant cette ligne de journal.
- `audioMs` : durée de l’audio de l’assistant comptabilisée par OpenClaw avant l’arrêt de la lecture.
- `elapsedMs` : temps réel écoulé entre l’ouverture et la fermeture du flux de lecture ou de l’intervention du locuteur.
- `discordBytes` : octets PCM stéréo à 48 kHz envoyés à la voix Discord ou reçus depuis celle-ci.
- `realtimeBytes` : octets PCM au format du fournisseur envoyés au fournisseur temps réel ou reçus depuis celui-ci.
- `playbackChunks` : fragments audio de l’assistant transmis à Discord pour la réponse active.
- `sinceLastAudioMs` : intervalle entre la dernière trame audio capturée du locuteur et la fermeture de son intervention.

Schémas courants :

- Une interruption immédiate avec `source=active-speaker-audio`, une faible valeur `outputAudioMs` et le même utilisateur à proximité indique généralement que l’écho des haut-parleurs entre dans le microphone. Augmentez `voice.realtime.minBargeInAudioEndMs`, réduisez le volume des haut-parleurs, utilisez un casque ou définissez `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` suivi de `speaker turn closed ... hasAudio=false` signifie que Discord a signalé le début de la prise de parole d’un locuteur, mais qu’aucun audio n’a atteint OpenClaw. Il peut s’agir d’un événement vocal Discord transitoire, du comportement de la porte de bruit ou de l’activation très brève du microphone par un client.
- `audio playback stopped reason=stream-close` sans interruption proche ni `provider-clear-audio` signifie que le flux de lecture Discord local s’est terminé de manière inattendue. Vérifiez les journaux précédents du fournisseur et du lecteur Discord.
- `capture ignored during playback (barge-in disabled)` signifie qu’OpenClaw a intentionnellement ignoré l’entrée pendant que l’audio de l’assistant était actif. Activez `voice.realtime.bargeIn` si vous souhaitez que la parole interrompe la lecture.
- `barge-in ignored ... outputActive=false` signifie que Discord ou la détection d’activité vocale du fournisseur a signalé de la parole, mais qu’OpenClaw n’avait aucune lecture active à interrompre. Cela ne devrait pas interrompre l’audio.

Les identifiants sont résolus séparément pour chaque composant : authentification de la route LLM pour `voice.model`, authentification STT pour `tools.media.audio`, authentification TTS pour `messages.tts`/`voice.tts` et authentification du fournisseur temps réel pour `voice.realtime.providers` ou la configuration d’authentification habituelle du fournisseur.

### Messages vocaux

Les messages vocaux Discord affichent un aperçu de la forme d’onde et nécessitent un audio OGG/Opus. OpenClaw génère automatiquement la forme d’onde, mais nécessite `ffmpeg` et `ffprobe` sur l’hôte du Gateway pour inspecter et convertir l’audio.

- Fournissez un **chemin de fichier local** (les URL sont rejetées).
- Omettez le contenu textuel (Discord refuse le texte et le message vocal dans la même charge utile).
- Tous les formats audio sont acceptés ; OpenClaw les convertit en OGG/Opus si nécessaire.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Résolution des problèmes

<AccordionGroup>
  <Accordion title="Intentions non autorisées utilisées ou le bot ne voit aucun message du serveur">

    - activez Message Content Intent
    - activez Server Members Intent lorsque vous dépendez de la résolution des utilisateurs/membres
    - redémarrez le Gateway après avoir modifié les intents

  </Accordion>

  <Accordion title="Messages de guilde bloqués de manière inattendue">

    - vérifiez `groupPolicy`
    - vérifiez la liste d’autorisation des guildes sous `channels.discord.guilds`
    - si une map `channels` existe pour une guilde, seuls les canaux répertoriés sont autorisés
    - vérifiez le comportement de `requireMention` et les motifs de mention

    Vérifications utiles :

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Mention non requise, mais messages toujours bloqués">
    Causes courantes :

    - `groupPolicy="allowlist"` sans liste d’autorisation de guilde/canal correspondante
    - `requireMention` configuré au mauvais endroit (doit se trouver sous `channels.discord.guilds` ou dans une entrée de canal)
    - expéditeur bloqué par la liste d’autorisation `users` de la guilde/du canal

  </Accordion>

  <Accordion title="Tours Discord de longue durée ou réponses en double">

    Journaux typiques :

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Paramètres de la file d’attente du Gateway Discord :

    - compte unique : `channels.discord.eventQueue.listenerTimeout`
    - plusieurs comptes : `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - ce paramètre contrôle uniquement le travail des écouteurs du Gateway Discord, et non la durée de vie des tours de l’agent

    Discord n’applique aucun délai d’expiration propre au canal aux tours d’agent mis en file d’attente. Les écouteurs de messages transmettent immédiatement le travail, et les exécutions Discord en file d’attente préservent l’ordre de chaque session jusqu’à ce que le cycle de vie de la session, de l’outil ou du runtime se termine ou annule le travail.

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
    OpenClaw récupère les métadonnées Discord `/gateway/bot` avant la connexion. En cas d’échecs transitoires, l’URL par défaut du Gateway de Discord est utilisée comme solution de repli, et la fréquence des journaux est limitée.

    Paramètres du délai d’expiration des métadonnées :

    - compte unique : `channels.discord.gatewayInfoTimeoutMs`
    - plusieurs comptes : `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - variable d’environnement de repli lorsque la configuration n’est pas définie : `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - valeur par défaut : `30000` (30 secondes), maximum : `120000`

  </Accordion>

  <Accordion title="Redémarrages dus au délai d’expiration de READY du Gateway">
    OpenClaw attend l’événement `READY` du Gateway de Discord au démarrage et après les reconnexions du runtime. Les configurations à plusieurs comptes avec démarrage échelonné peuvent nécessiter une fenêtre READY de démarrage plus longue que celle par défaut.

    Paramètres du délai d’expiration de READY :

    - démarrage avec un compte unique : `channels.discord.gatewayReadyTimeoutMs`
    - démarrage avec plusieurs comptes : `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - variable d’environnement de repli au démarrage lorsque la configuration n’est pas définie : `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - valeur par défaut au démarrage : `15000` (15 secondes), maximum : `120000`
    - runtime avec un compte unique : `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime avec plusieurs comptes : `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - variable d’environnement de repli du runtime lorsque la configuration n’est pas définie : `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - valeur par défaut du runtime : `30000` (30 secondes), maximum : `120000`

  </Accordion>

  <Accordion title="Incohérences de l’audit des autorisations">
    Les vérifications des autorisations de `channels status --probe` fonctionnent uniquement avec les identifiants numériques des canaux.

    Si vous utilisez des clés de slug, la correspondance à l’exécution peut toujours fonctionner, mais la sonde ne peut pas vérifier entièrement les autorisations.

  </Accordion>

  <Accordion title="Problèmes de messages privés et d’appairage">

    - Messages privés désactivés : `channels.discord.dm.enabled=false`
    - Politique de messages privés désactivée : `channels.discord.dmPolicy="disabled"` (anciennement : `channels.discord.dm.policy`)
    - en attente de l’approbation de l’appairage en mode `pairing`

  </Accordion>

  <Accordion title="Boucles entre bots">
    Par défaut, les messages rédigés par des bots sont ignorés.

    Si vous définissez `channels.discord.allowBots=true`, utilisez des règles strictes de mention et de liste d’autorisation afin d’éviter les boucles.
    Privilégiez `channels.discord.allowBots="mentions"` pour n’accepter que les messages de bots qui mentionnent le bot.

    OpenClaw fournit également une [protection partagée contre les boucles de bots](/fr/channels/bot-loop-protection). Chaque fois que `allowBots` permet aux messages générés par des bots d’atteindre le système de distribution, Discord convertit l’événement entrant en données `(account, channel, bot pair)`, et le mécanisme générique de protection des paires bloque la paire dès qu’elle dépasse le budget d’événements configuré. Ce mécanisme empêche les boucles incontrôlées entre deux bots, qui devaient auparavant être interrompues par les limites de débit de Discord ; il n’affecte ni les déploiements à bot unique ni les réponses ponctuelles de bots qui restent sous le seuil prévu.

    Paramètres par défaut (actifs lorsque `allowBots` est défini) :

    - `maxEventsPerWindow: 20` -- la paire de bots peut échanger 20 messages pendant la fenêtre glissante
    - `windowSeconds: 60` -- durée de la fenêtre glissante
    - `cooldownSeconds: 60` -- une fois le budget dépassé, chaque message supplémentaire entre les bots, dans l’un ou l’autre sens, est ignoré pendant une minute

    Configurez une seule fois la valeur partagée par défaut sous `channels.defaults.botLoopProtection`, puis remplacez-la pour Discord lorsqu’un workflow légitime nécessite une marge plus importante. L’ordre de priorité est le suivant :

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
      // Remplacement facultatif à l’échelle de Discord. Les blocs de compte remplacent les
      // champs individuels et héritent d’ici les champs omis.
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

  <Accordion title="Échecs de la STT vocale avec DecryptionFailed(...)">

    - maintenez OpenClaw à jour (`openclaw update`) afin de disposer de la logique de récupération de la réception vocale Discord
    - vérifiez que `channels.discord.voice.daveEncryption=true` (valeur par défaut)
    - commencez avec `channels.discord.voice.decryptionFailureTolerance=24` (valeur par défaut en amont) et ajustez uniquement si nécessaire
    - surveillez les journaux pour repérer :
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - si les échecs persistent après la reconnexion automatique, collectez les journaux et comparez-les à l’historique de réception DAVE en amont dans [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) et [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Référence de configuration

Référence principale : [Référence de configuration — Discord](/fr/gateway/config-channels#discord).

<Accordion title="Champs Discord les plus pertinents">

- démarrage/authentification : `enabled`, `token`, `applicationId`, `accounts.*`, `allowBots`
- stratégie : `groupPolicy`, `dmPolicy`, `allowFrom`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- commande : `commands.native`, `commands.useAccessGroups` (global), `configWrites`, `slashCommand.ephemeral`
- file d’attente des événements : `eventQueue.listenerTimeout` (budget de l’écouteur, valeur par défaut `120000`), `eventQueue.maxQueueSize` (valeur par défaut `10000`), `eventQueue.maxConcurrency` (valeur par défaut `50`)
- Gateway : `proxy`, `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- réponse/historique : `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- distribution : `textChunkLimit` (valeur par défaut `2000`), `maxLinesPerMessage` (valeur par défaut `17`)
- diffusion en continu : `streaming.mode`, `streaming.chunkMode`, `streaming.preview.*`, `streaming.progress.*`, `streaming.block.*` (les anciennes clés de premier niveau `streamMode`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`, `chunkMode` sont migrées vers `streaming.*` par `openclaw doctor --fix`)
- médias/nouvelles tentatives : `mediaMaxMb` (limite les téléversements Discord sortants, valeur par défaut `100`), `retry`
- actions : `actions.*`
- présence : `activity`, `status`, `activityType`, `activityUrl`, `autoPresence.*`
- interface utilisateur : `ui.components.accentColor`
- fonctionnalités : `threadBindings`, `bindings[]` au niveau supérieur (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Sécurité et exploitation

- Traitez les jetons de bot comme des secrets (`DISCORD_BOT_TOKEN` est recommandé dans les environnements supervisés).
- Accordez à Discord les autorisations minimales nécessaires.
- Si le déploiement ou l’état des commandes est obsolète, redémarrez le Gateway et vérifiez à nouveau avec `openclaw channels status --probe`.

## Pages connexes

<CardGroup cols={2}>
  <Card title="Association" icon="link" href="/fr/channels/pairing">
    Associez un utilisateur Discord au Gateway.
  </Card>
  <Card title="Groupes" icon="users" href="/fr/channels/groups">
    Comportement des discussions de groupe et des listes d’autorisation.
  </Card>
  <Card title="Routage des canaux" icon="route" href="/fr/channels/channel-routing">
    Acheminez les messages entrants vers les agents.
  </Card>
  <Card title="Sécurité" icon="shield" href="/fr/gateway/security">
    Modèle de menaces et renforcement de la sécurité.
  </Card>
  <Card title="Routage multi-agent" icon="sitemap" href="/fr/concepts/multi-agent">
    Associez les serveurs et les canaux aux agents.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/fr/tools/slash-commands">
    Comportement des commandes natives.
  </Card>
</CardGroup>
