---
read_when:
    - Travailler sur les fonctionnalités du canal Discord
summary: État de prise en charge, fonctionnalités et configuration du bot Discord
title: Discord
x-i18n:
    generated_at: "2026-06-27T17:09:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90ed02258347113ca5b1dfcc5169a48190e3b4e1273d27a8a5c45f0f930cdbbf
    source_path: channels/discord.md
    workflow: 16
---

Prêt pour les messages privés et les canaux de guilde via le Gateway Discord officiel.

<CardGroup cols={3}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    Les messages privés Discord utilisent le mode d’appairage par défaut.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/fr/tools/slash-commands">
    Comportement natif des commandes et catalogue des commandes.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics intercanaux et flux de réparation.
  </Card>
</CardGroup>

## Configuration rapide

Vous devrez créer une nouvelle application avec un bot, ajouter le bot à votre serveur et l’appairer à OpenClaw. Nous recommandons d’ajouter votre bot à votre propre serveur privé. Si vous n’en avez pas encore, [créez-en un d’abord](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (choisissez **Create My Own > For me and my friends**).

<Steps>
  <Step title="Créer une application Discord et un bot">
    Accédez au [portail développeur Discord](https://discord.com/developers/applications) et cliquez sur **New Application**. Donnez-lui un nom comme "OpenClaw".

    Cliquez sur **Bot** dans la barre latérale. Définissez le **Username** sur le nom que vous donnez à votre agent OpenClaw.

  </Step>

  <Step title="Activer les intents privilégiés">
    Toujours sur la page **Bot**, faites défiler jusqu’à **Privileged Gateway Intents** et activez :

    - **Message Content Intent** (obligatoire)
    - **Server Members Intent** (recommandé ; obligatoire pour les listes d’autorisation de rôles et la correspondance nom-vers-ID)
    - **Presence Intent** (facultatif ; nécessaire uniquement pour les mises à jour de présence)

  </Step>

  <Step title="Copier le jeton de votre bot">
    Remontez sur la page **Bot** et cliquez sur **Reset Token**.

    <Note>
    Malgré son nom, cela génère votre premier jeton — rien n’est « réinitialisé ».
    </Note>

    Copiez le jeton et enregistrez-le quelque part. C’est votre **Bot Token** et vous en aurez besoin sous peu.

  </Step>

  <Step title="Générer une URL d’invitation et ajouter le bot à votre serveur">
    Cliquez sur **OAuth2** dans la barre latérale. Vous allez générer une URL d’invitation avec les bonnes autorisations pour ajouter le bot à votre serveur.

    Faites défiler jusqu’à **OAuth2 URL Generator** et activez :

    - `bot`
    - `applications.commands`

    Une section **Bot Permissions** apparaîtra en dessous. Activez au minimum :

    **General Permissions**
      - Voir les canaux
    **Text Permissions**
      - Envoyer des messages
      - Lire l’historique des messages
      - Intégrer des liens
      - Joindre des fichiers
      - Ajouter des réactions (facultatif)

    C’est l’ensemble de base pour les canaux textuels normaux. Si vous prévoyez de publier dans des fils Discord, y compris des workflows de forums ou de canaux média qui créent ou poursuivent un fil, activez aussi **Send Messages in Threads**.
    Copiez l’URL générée en bas, collez-la dans votre navigateur, sélectionnez votre serveur, puis cliquez sur **Continue** pour vous connecter. Vous devriez maintenant voir votre bot dans le serveur Discord.

  </Step>

  <Step title="Activer le mode développeur et collecter vos ID">
    De retour dans l’application Discord, vous devez activer le mode développeur afin de pouvoir copier les ID internes.

    1. Cliquez sur **User Settings** (icône d’engrenage à côté de votre avatar) → **Advanced** → activez **Developer Mode**
    2. Faites un clic droit sur votre **icône de serveur** dans la barre latérale → **Copy Server ID**
    3. Faites un clic droit sur votre **propre avatar** → **Copy User ID**

    Enregistrez votre **Server ID** et votre **User ID** avec votre Bot Token — vous enverrez les trois à OpenClaw à l’étape suivante.

  </Step>

  <Step title="Autoriser les messages privés des membres du serveur">
    Pour que l’appairage fonctionne, Discord doit autoriser votre bot à vous envoyer un message privé. Faites un clic droit sur votre **icône de serveur** → **Privacy Settings** → activez **Direct Messages**.

    Cela permet aux membres du serveur (y compris les bots) de vous envoyer des messages privés. Gardez cette option activée si vous souhaitez utiliser les messages privés Discord avec OpenClaw. Si vous prévoyez d’utiliser uniquement les canaux de guilde, vous pouvez désactiver les messages privés après l’appairage.

  </Step>

  <Step title="Définir le jeton de votre bot en sécurité (ne l’envoyez pas dans le chat)">
    Le jeton de votre bot Discord est un secret (comme un mot de passe). Définissez-le sur la machine qui exécute OpenClaw avant d’envoyer un message à votre agent.

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

    Si OpenClaw s’exécute déjà comme service en arrière-plan, redémarrez-le via l’application Mac OpenClaw ou en arrêtant puis en relançant le processus `openclaw gateway run`.
    Pour les installations de service gérées, exécutez `openclaw gateway install` depuis un shell où `DISCORD_BOT_TOKEN` est présent, ou stockez la variable dans `~/.openclaw/.env`, afin que le service puisse résoudre la SecretRef d’env après redémarrage.
    Si votre hôte est bloqué ou limité en débit par la recherche de l’application au démarrage de Discord, définissez l’ID d’application/client Discord depuis le portail développeur afin que le démarrage puisse ignorer cet appel REST. Utilisez `channels.discord.applicationId` pour le compte par défaut, ou `channels.discord.accounts.<accountId>.applicationId` lorsque vous exécutez plusieurs bots Discord.

  </Step>

  <Step title="Configurer OpenClaw et appairer">

    <Tabs>
      <Tab title="Demander à votre agent">
        Discutez avec votre agent OpenClaw sur n’importe quel canal existant (par exemple Telegram) et dites-le-lui. Si Discord est votre premier canal, utilisez plutôt l’onglet CLI / config.

        > "J’ai déjà défini le jeton de mon bot Discord dans la config. Termine la configuration de Discord avec l’User ID `<user_id>` et le Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Si vous préférez une configuration basée sur un fichier, définissez :

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

        Repli env pour le compte par défaut :

```bash
DISCORD_BOT_TOKEN=...
```

        Pour une configuration scriptée ou distante, écrivez le même bloc JSON5 avec `openclaw config patch --file ./discord.patch.json5 --dry-run`, puis relancez sans `--dry-run`. Les valeurs `token` en texte clair sont prises en charge. Les valeurs SecretRef sont aussi prises en charge pour `channels.discord.token` via les fournisseurs env/file/exec. Consultez [Gestion des secrets](/fr/gateway/secrets).

        Pour plusieurs bots Discord, conservez chaque jeton de bot et chaque ID d’application sous son compte. Un `channels.discord.applicationId` de premier niveau est hérité par les comptes, donc ne le définissez là que lorsque chaque compte doit utiliser le même ID d’application.

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
    Attendez que le Gateway soit en cours d’exécution, puis envoyez un message privé à votre bot dans Discord. Il répondra avec un code d’appairage.

    <Tabs>
      <Tab title="Demander à votre agent">
        Envoyez le code d’appairage à votre agent sur votre canal existant :

        > "Approuve ce code d’appairage Discord : `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Les codes d’appairage expirent après 1 heure.

    Vous devriez maintenant pouvoir discuter avec votre agent dans Discord par message privé.

  </Step>
</Steps>

<Note>
La résolution des jetons tient compte du compte. Les valeurs de jeton de config l’emportent sur le repli env. `DISCORD_BOT_TOKEN` est utilisé uniquement pour le compte par défaut.
Si deux comptes Discord activés se résolvent vers le même jeton de bot, OpenClaw ne démarre qu’un seul moniteur Gateway pour ce jeton. Un jeton provenant de la config l’emporte sur le repli env par défaut ; sinon, le premier compte activé l’emporte et le compte dupliqué est signalé comme désactivé.
Pour les appels sortants avancés (outil de message/actions de canal), un `token` explicite par appel est utilisé pour cet appel. Cela s’applique aux actions d’envoi et de lecture/sonde (par exemple read/search/fetch/thread/pins/permissions). Les paramètres de stratégie/réessai du compte proviennent toujours du compte sélectionné dans l’instantané d’exécution actif.
</Note>

## Recommandé : configurer un espace de travail de guilde

Une fois les messages privés fonctionnels, vous pouvez configurer votre serveur Discord comme espace de travail complet où chaque canal obtient sa propre session d’agent avec son propre contexte. C’est recommandé pour les serveurs privés où il n’y a que vous et votre bot.

<Steps>
  <Step title="Ajouter votre serveur à la liste d’autorisation de guildes">
    Cela permet à votre agent de répondre dans n’importe quel canal de votre serveur, pas seulement dans les messages privés.

    <Tabs>
      <Tab title="Demander à votre agent">
        > "Ajoute mon Server ID Discord `<server_id>` à la liste d’autorisation de guildes"
      </Tab>
      <Tab title="Config">

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
    Par défaut, votre agent ne répond dans les canaux de guilde que lorsqu’il est @mentionné. Pour un serveur privé, vous voulez probablement qu’il réponde à chaque message.

    Dans les canaux de guilde, les réponses normales sont publiées automatiquement par défaut. Pour les salles partagées toujours actives, optez pour `messages.groupChat.visibleReplies: "message_tool"` afin que l’agent puisse rester en observation et ne publier que lorsqu’il décide qu’une réponse au canal est utile. Cela fonctionne mieux avec des modèles de dernière génération fiables avec les outils, comme GPT 5.5. Les événements ambiants de salle restent silencieux sauf si l’outil envoie un message. Consultez [Événements ambiants de salle](/fr/channels/ambient-room-events) pour la configuration complète du mode observation.

    Si Discord affiche la saisie en cours et que les journaux montrent une utilisation de jetons, mais qu’aucun message n’est publié, vérifiez si le tour a été configuré comme événement ambiant de salle ou s’il a opté pour les réponses visibles via outil de message.

    <Tabs>
      <Tab title="Demander à votre agent">
        > "Autorise mon agent à répondre sur ce serveur sans avoir besoin d’être @mentionné"
      </Tab>
      <Tab title="Config">
        Définissez `requireMention: false` dans votre config de guilde :

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

        Pour exiger des envois par outil de message pour les réponses visibles de groupe/canal, définissez `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Prévoir la mémoire dans les canaux de guilde">
    Par défaut, la mémoire à long terme (MEMORY.md) ne se charge que dans les sessions de messages privés. Les canaux de guilde ne chargent pas automatiquement MEMORY.md.

    <Tabs>
      <Tab title="Demander à votre agent">
        > "Quand je pose des questions dans les canaux Discord, utilise memory_search ou memory_get si tu as besoin du contexte à long terme de MEMORY.md."
      </Tab>
      <Tab title="Manuel">
        Si vous avez besoin d’un contexte partagé dans chaque canal, placez les instructions stables dans `AGENTS.md` ou `USER.md` (elles sont injectées pour chaque session). Conservez les notes à long terme dans `MEMORY.md` et accédez-y à la demande avec les outils de mémoire.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Créez maintenant quelques canaux sur votre serveur Discord et commencez à discuter. Votre agent peut voir le nom du canal, et chaque canal obtient sa propre session isolée — vous pouvez donc configurer `#coding`, `#home`, `#research`, ou tout ce qui convient à votre workflow.

## Modèle d’exécution

- Gateway possède la connexion Discord.
- Le routage des réponses est déterministe : les réponses entrantes Discord retournent vers Discord.
- Les métadonnées de guilde/canal Discord sont ajoutées au prompt du modèle comme
  contexte non fiable, et non comme préfixe de réponse visible par l’utilisateur. Si un modèle recopie cette enveloppe
  en retour, OpenClaw retire les métadonnées copiées des réponses sortantes et du
  futur contexte de relecture.
- Par défaut (`session.dmScope=main`), les conversations directes partagent la session principale de l’agent (`agent:main:main`).
- Les canaux de guilde sont des clés de session isolées (`agent:<agentId>:discord:channel:<channelId>`).
- Les MP de groupe sont ignorés par défaut (`channels.discord.dm.groupEnabled=false`).
- Les commandes slash natives s’exécutent dans des sessions de commande isolées (`agent:<agentId>:discord:slash:<userId>`), tout en transportant `CommandTargetSessionKey` vers la session de conversation routée.
- La livraison des annonces cron/heartbeat en texte seul vers Discord utilise une seule fois
  la réponse finale visible par l’assistant. Les charges utiles de médias et de composants structurés restent
  multi-messages quand l’agent émet plusieurs charges utiles livrables.

## Canaux de forum

Les canaux de forum et de médias Discord n’acceptent que les publications dans des fils. OpenClaw prend en charge deux façons de les créer :

- Envoyez un message au parent du forum (`channel:<forumId>`) pour créer automatiquement un fil. Le titre du fil utilise la première ligne non vide de votre message.
- Utilisez `openclaw message thread create` pour créer directement un fil. Ne passez pas `--message-id` pour les canaux de forum.

Exemple : envoyer au parent du forum pour créer un fil

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Exemple : créer explicitement un fil de forum

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Les parents de forum n’acceptent pas les composants Discord. Si vous avez besoin de composants, envoyez-les au fil lui-même (`channel:<threadId>`).

## Composants interactifs

OpenClaw prend en charge les conteneurs de composants Discord v2 pour les messages d’agent. Utilisez l’outil de message avec une charge utile `components`. Les résultats d’interaction sont routés vers l’agent comme des messages entrants normaux et suivent les paramètres Discord `replyToMode` existants.

Blocs pris en charge :

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Les lignes d’actions autorisent jusqu’à 5 boutons ou un seul menu de sélection
- Types de sélection : `string`, `user`, `role`, `mentionable`, `channel`

Par défaut, les composants sont à usage unique. Définissez `components.reusable=true` pour permettre aux boutons, sélections et formulaires d’être utilisés plusieurs fois jusqu’à leur expiration.

Pour limiter les personnes pouvant cliquer sur un bouton, définissez `allowedUsers` sur ce bouton (ID utilisateur Discord, tags ou `*`). Une fois configuré, les utilisateurs sans correspondance reçoivent un refus éphémère.

Les rappels de composants expirent par défaut après 30 minutes. Définissez `channels.discord.agentComponents.ttlMs` pour modifier cette durée de vie du registre de rappels pour le compte Discord par défaut, ou `channels.discord.accounts.<accountId>.agentComponents.ttlMs` pour remplacer un compte dans une configuration multi-comptes. La valeur est en millisecondes, doit être un entier positif et est plafonnée à `86400000` (24 heures). Des TTL plus longs sont utiles pour les workflows de revue ou d’approbation qui nécessitent que les boutons restent utilisables, mais ils étendent aussi la fenêtre pendant laquelle un ancien message Discord peut encore déclencher une action. Préférez le TTL le plus court adapté au workflow, et conservez la valeur par défaut lorsque des rappels obsolètes seraient surprenants.

Les commandes slash `/model` et `/models` ouvrent un sélecteur de modèle interactif avec des menus déroulants pour le fournisseur, le modèle et l’exécution compatible, plus une étape Submit. `/models add` est obsolète et renvoie désormais un message de dépréciation au lieu d’enregistrer des modèles depuis la conversation. La réponse du sélecteur est éphémère et seul l’utilisateur qui l’a déclenchée peut l’utiliser. Les menus de sélection Discord sont limités à 25 options ; ajoutez donc des entrées `provider/*` à `agents.defaults.models` lorsque vous voulez que le sélecteur affiche les modèles découverts dynamiquement uniquement pour les fournisseurs sélectionnés comme `openai` ou `vllm`.

Pièces jointes de fichier :

- Les blocs `file` doivent pointer vers une référence de pièce jointe (`attachment://<filename>`)
- Fournissez la pièce jointe via `media`/`path`/`filePath` (fichier unique) ; utilisez `media-gallery` pour plusieurs fichiers
- Utilisez `filename` pour remplacer le nom téléversé lorsqu’il doit correspondre à la référence de pièce jointe

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
  <Tab title="DM policy">
    `channels.discord.dmPolicy` contrôle l’accès aux MP. `channels.discord.allowFrom` est la liste d’autorisation canonique des MP.

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `channels.discord.allowFrom` inclue `"*"`)
    - `disabled`

    Si la politique de MP n’est pas ouverte, les utilisateurs inconnus sont bloqués (ou invités à l’appairage en mode `pairing`).

    Priorité multi-comptes :

    - `channels.discord.accounts.default.allowFrom` s’applique uniquement au compte `default`.
    - Pour un compte, `allowFrom` est prioritaire sur l’ancien `dm.allowFrom`.
    - Les comptes nommés héritent de `channels.discord.allowFrom` lorsque leurs propres `allowFrom` et l’ancien `dm.allowFrom` ne sont pas définis.
    - Les comptes nommés n’héritent pas de `channels.discord.accounts.default.allowFrom`.

    Les anciens `channels.discord.dm.policy` et `channels.discord.dm.allowFrom` sont toujours lus pour compatibilité. `openclaw doctor --fix` les migre vers `dmPolicy` et `allowFrom` lorsqu’il peut le faire sans modifier l’accès.

    Format de cible MP pour la livraison :

    - `user:<id>`
    - mention `<@id>`

    Les ID numériques bruts se résolvent normalement comme des ID de canal lorsqu’une valeur de canal par défaut est active, mais les ID répertoriés dans le `allowFrom` MP effectif du compte sont traités comme des cibles de MP utilisateur pour compatibilité.

  </Tab>

  <Tab title="Access groups">
    Les MP Discord et l’autorisation des commandes texte peuvent utiliser des entrées dynamiques `accessGroup:<name>` dans `channels.discord.allowFrom`.

    Les noms de groupes d’accès sont partagés entre les canaux de message. Utilisez `type: "message.senders"` pour un groupe statique dont les membres sont exprimés dans la syntaxe `allowFrom` normale de chaque canal, ou `type: "discord.channelAudience"` lorsque l’audience `ViewChannel` actuelle d’un canal Discord doit définir l’appartenance dynamiquement. Le comportement partagé des groupes d’accès est documenté ici : [Groupes d’accès](/fr/channels/access-groups).

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

    Un canal texte Discord n’a pas de liste de membres séparée. `type: "discord.channelAudience"` modélise l’appartenance ainsi : l’expéditeur du MP est membre de la guilde configurée et dispose actuellement de l’autorisation effective `ViewChannel` sur le canal configuré après application des rôles et des remplacements de canal.

    Exemple : autoriser toute personne pouvant voir `#maintainers` à envoyer un MP au bot, tout en gardant les MP fermés à tous les autres.

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

    Vous pouvez mélanger des entrées dynamiques et statiques :

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

    Les recherches échouent en mode fermé. Si Discord renvoie `Missing Access`, si la recherche de membre échoue ou si le canal appartient à une autre guilde, l’expéditeur du MP est considéré comme non autorisé.

    Activez l’**intention Membres du serveur** dans le portail développeur Discord pour le bot lorsque vous utilisez des groupes d’accès basés sur l’audience de canal. Les MP n’incluent pas l’état de membre de guilde ; OpenClaw résout donc le membre via Discord REST au moment de l’autorisation.

  </Tab>

  <Tab title="Guild policy">
    La gestion des guildes est contrôlée par `channels.discord.groupPolicy` :

    - `open`
    - `allowlist`
    - `disabled`

    La base de sécurité lorsque `channels.discord` existe est `allowlist`.

    Comportement de `allowlist` :

    - la guilde doit correspondre à `channels.discord.guilds` (`id` recommandé, slug accepté)
    - listes d’autorisation facultatives d’expéditeurs : `users` (ID stables recommandés) et `roles` (ID de rôles uniquement) ; si l’un ou l’autre est configuré, les expéditeurs sont autorisés lorsqu’ils correspondent à `users` OU `roles`
    - la correspondance directe par nom/tag est désactivée par défaut ; activez `channels.discord.dangerouslyAllowNameMatching: true` uniquement comme mode de compatibilité de dernier recours
    - les noms/tags sont pris en charge pour `users`, mais les ID sont plus sûrs ; `openclaw security audit` avertit lorsque des entrées par nom/tag sont utilisées
    - si une guilde a des `channels` configurés, les canaux non répertoriés sont refusés
    - si une guilde n’a pas de bloc `channels`, tous les canaux de cette guilde autorisée sont autorisés

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
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    Si vous définissez seulement `DISCORD_BOT_TOKEN` et ne créez pas de bloc `channels.discord`, le comportement de repli à l’exécution est `groupPolicy="allowlist"` (avec un avertissement dans les journaux), même si `channels.defaults.groupPolicy` vaut `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Les messages de guilde sont filtrés par mention par défaut.

    La détection de mention inclut :

    - mention explicite du bot
    - motifs de mention configurés (`agents.list[].groupChat.mentionPatterns`, repli `messages.groupChat.mentionPatterns`)
    - comportement implicite de réponse au bot dans les cas pris en charge

    Lors de l’écriture de messages Discord sortants, utilisez la syntaxe de mention canonique : `<@USER_ID>` pour les utilisateurs, `<#CHANNEL_ID>` pour les canaux et `<@&ROLE_ID>` pour les rôles. N’utilisez pas l’ancienne forme de mention de pseudonyme `<@!USER_ID>`.

    `requireMention` est configuré par guilde/canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` ignore facultativement les messages qui mentionnent un autre utilisateur/rôle mais pas le bot (à l’exclusion de @everyone/@here).

    MP de groupe :

    - par défaut : ignorés (`dm.groupEnabled=false`)
    - liste d’autorisation facultative via `dm.groupChannels` (ID de canal ou slugs)

  </Tab>
</Tabs>

### Routage d’agent basé sur les rôles

Utilisez `bindings[].match.roles` pour router les membres de guildes Discord vers différents agents selon l’ID de rôle. Les bindings basés sur les rôles acceptent uniquement les ID de rôle et sont évalués après les bindings de pair ou de pair parent, et avant les bindings limités à la guilde. Si un binding définit aussi d’autres champs de correspondance (par exemple `peer` + `guildId` + `roles`), tous les champs configurés doivent correspondre.

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

## Commandes natives et authentification des commandes

- `commands.native` vaut `"auto"` par défaut et est activé pour Discord.
- Remplacement par canal : `channels.discord.commands.native`.
- `commands.native=false` ignore l’enregistrement et le nettoyage des commandes slash Discord au démarrage. Les commandes enregistrées précédemment peuvent rester visibles dans Discord jusqu’à ce que vous les supprimiez de l’application Discord.
- L’authentification des commandes natives utilise les mêmes listes d’autorisation/politiques Discord que le traitement normal des messages.
- Les commandes peuvent toujours être visibles dans l’interface Discord pour les utilisateurs qui ne sont pas autorisés ; l’exécution applique quand même l’authentification OpenClaw et renvoie "not authorized".

Consultez [Commandes slash](/fr/tools/slash-commands) pour le catalogue et le comportement des commandes.

Paramètres par défaut des commandes slash :

- `ephemeral: true`

## Détails des fonctionnalités

<AccordionGroup>
  <Accordion title="Tags de réponse et réponses natives">
    Discord prend en charge les tags de réponse dans la sortie de l’agent :

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Contrôlé par `channels.discord.replyToMode` :

    - `off` (par défaut)
    - `first`
    - `all`
    - `batched`

    Remarque : `off` désactive le fil de réponse implicite. Les tags explicites `[[reply_to_*]]` sont toujours respectés.
    `first` attache toujours la référence de réponse native implicite au premier message Discord sortant du tour.
    `batched` attache uniquement la référence de réponse native implicite de Discord lorsque
    l’événement entrant était un lot temporisé de plusieurs messages. C’est utile
    lorsque vous voulez des réponses natives surtout pour les conversations ambiguës en rafale, pas pour chaque
    tour à message unique.

    Les ID de message sont exposés dans le contexte/l’historique afin que les agents puissent cibler des messages précis.

  </Accordion>

  <Accordion title="Aperçus de liens">
    Discord génère par défaut des intégrations enrichies de liens pour les URL. OpenClaw supprime ces intégrations générées sur les messages Discord sortants par défaut, afin que les URL envoyées par l’agent restent de simples liens, sauf si vous l’activez explicitement :

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Définissez `channels.discord.accounts.<id>.suppressEmbeds` pour remplacer le comportement d’un compte. Les envois via l’outil de message de l’agent peuvent aussi passer `suppressEmbeds: false` pour un seul message. Les payloads Discord `embeds` explicites ne sont pas supprimés par le paramètre par défaut d’aperçu de lien.

  </Accordion>

  <Accordion title="Aperçu du flux en direct">
    OpenClaw peut streamer des brouillons de réponse en envoyant un message temporaire et en le modifiant à mesure que le texte arrive. `channels.discord.streaming` accepte `off` | `partial` | `block` | `progress` (par défaut). `progress` conserve un brouillon d’état modifiable et le met à jour avec la progression des outils jusqu’à la livraison finale ; le libellé de démarrage partagé est une ligne défilante, il disparaît donc comme le reste une fois qu’assez de travail apparaît. `streamMode` est un alias d’exécution hérité. Exécutez `openclaw doctor --fix` pour réécrire la configuration persistée vers la clé canonique.

    Définissez `channels.discord.streaming.mode` sur `off` pour désactiver les modifications d’aperçu Discord. Si le streaming par blocs Discord est explicitement activé, OpenClaw ignore le flux d’aperçu afin d’éviter un double streaming.

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

    - `partial` modifie un seul message d’aperçu à mesure que les tokens arrivent.
    - `block` émet des fragments de taille brouillon (utilisez `draftChunk` pour ajuster la taille et les points de rupture, plafonné à `textChunkLimit`).
    - Les réponses finales avec média, erreur ou réponse explicite annulent les modifications d’aperçu en attente.
    - `streaming.preview.toolProgress` (par défaut `true`) contrôle si les mises à jour d’outil/progression réutilisent le message d’aperçu.
    - Les lignes d’outil/progression s’affichent sous forme compacte emoji + titre + détail lorsque disponible, par exemple `🛠️ Bash: run tests` ou `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (par défaut `false`) active le texte de commentaire/préambule de l’assistant dans le brouillon de progression temporaire. Le commentaire est nettoyé avant affichage, reste transitoire et ne modifie pas la livraison de la réponse finale.
    - `streaming.progress.maxLineChars` contrôle le budget d’aperçu de progression par ligne. La prose est raccourcie aux limites des mots ; les détails de commande et de chemin conservent des suffixes utiles.
    - `streaming.preview.commandText` / `streaming.progress.commandText` contrôle le détail de commande/exécution dans les lignes de progression compactes : `raw` (par défaut) ou `status` (libellé d’outil uniquement).

    Masquer le texte brut de commande/exécution tout en conservant les lignes de progression compactes :

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

    Le streaming d’aperçu est uniquement textuel ; les réponses avec média reviennent à la livraison normale. Lorsque le streaming `block` est explicitement activé, OpenClaw ignore le flux d’aperçu afin d’éviter un double streaming.

  </Accordion>

  <Accordion title="Historique, contexte et comportement des fils">
    Contexte d’historique de guilde :

    - `channels.discord.historyLimit` par défaut `20`
    - repli : `messages.groupChat.historyLimit`
    - `0` désactive

    Contrôles d’historique des DM :

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportement des fils :

    - Les fils Discord sont routés comme sessions de canal et héritent de la configuration du canal parent sauf remplacement.
    - Les sessions de fil héritent de la sélection `/model` au niveau session du canal parent comme repli limité au modèle ; les sélections `/model` locales au fil restent prioritaires et l’historique de transcript parent n’est pas copié sauf si l’héritage de transcript est activé.
    - `channels.discord.thread.inheritParent` (par défaut `false`) active l’amorçage des nouveaux fils automatiques à partir du transcript parent. Les remplacements par compte se trouvent sous `channels.discord.accounts.<id>.thread.inheritParent`.
    - Les réactions de l’outil de message peuvent résoudre les cibles DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` est préservé pendant le repli d’activation à l’étape de réponse.

    Les sujets de canal sont injectés comme contexte **non fiable**. Les listes d’autorisation déterminent qui peut déclencher l’agent, pas une frontière complète de masquage du contexte supplémentaire.

  </Accordion>

  <Accordion title="Sessions liées à un fil pour les sous-agents">
    Discord peut lier un fil à une cible de session afin que les messages de suivi dans ce fil continuent d’être routés vers la même session (y compris les sessions de sous-agent).

    Commandes :

    - `/focus <target>` lier le fil actuel/nouveau à une cible de sous-agent/session
    - `/unfocus` supprimer le binding du fil actuel
    - `/agents` afficher les exécutions actives et l’état des bindings
    - `/session idle <duration|off>` inspecter/mettre à jour le désengagement automatique pour inactivité des bindings focalisés
    - `/session max-age <duration|off>` inspecter/mettre à jour l’âge maximal strict des bindings focalisés

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

    - `session.threadBindings.*` définit les valeurs par défaut globales.
    - `channels.discord.threadBindings.*` remplace le comportement Discord.
    - `spawnSessions` contrôle la création/liaison automatique de fils pour `sessions_spawn({ thread: true })` et les créations de fils ACP. Par défaut : `true`.
    - `defaultSpawnContext` contrôle le contexte natif de sous-agent pour les créations liées à un fil. Par défaut : `"fork"`.
    - Les clés obsolètes `spawnSubagentSessions`/`spawnAcpSessions` sont migrées par `openclaw doctor --fix`.
    - Si les bindings de fil sont désactivés pour un compte, `/focus` et les opérations associées de binding de fil ne sont pas disponibles.

    Consultez [Sous-agents](/fr/tools/subagents), [Agents ACP](/fr/tools/acp-agents) et [Référence de configuration](/fr/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Bindings de canal ACP persistants">
    Pour les espaces de travail ACP stables et "always-on", configurez des bindings ACP typés de premier niveau ciblant les conversations Discord.

    Chemin de configuration :

    - `bindings[]` avec `type: "acp"` et `match.channel: "discord"`

    Exemple :

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

    - `/acp spawn codex --bind here` lie le canal ou fil actuel sur place et conserve les futurs messages sur la même session ACP. Les messages de fil héritent du binding du canal parent.
    - Dans un canal ou un fil lié, `/new` et `/reset` réinitialisent la même session ACP sur place. Les bindings temporaires de fil peuvent remplacer la résolution de cible tant qu’ils sont actifs.
    - `spawnSessions` contrôle la création/liaison de fils enfants via `--thread auto|here`.

    Consultez [Agents ACP](/fr/tools/acp-agents) pour les détails du comportement des bindings.

  </Accordion>

  <Accordion title="Notifications de réaction">
    Mode de notification de réaction par guilde :

    - `off`
    - `own` (par défaut)
    - `all`
    - `allowlist` (utilise `guilds.<id>.users`)

    Les événements de réaction sont transformés en événements système et attachés à la session Discord routée.

  </Accordion>

  <Accordion title="Réactions d’accusé de réception">
    `ackReaction` envoie un emoji d’accusé de réception pendant qu’OpenClaw traite un message entrant.

    Ordre de résolution :

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - repli sur l’emoji d’identité de l’agent (`agents.list[].identity.emoji`, sinon "👀")

    Notes :

    - Discord accepte les emoji Unicode ou les noms d’emoji personnalisés.
    - Utilisez `""` pour désactiver la réaction pour un canal ou un compte.

  </Accordion>

  <Accordion title="Écritures de configuration">
    Les écritures de configuration initiées par le canal sont activées par défaut.

    Cela affecte les flux `/config set|unset` (lorsque les fonctionnalités de commande sont activées).

    Désactiver :

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

  <Accordion title="Proxy Gateway">
    Routez le trafic WebSocket du Gateway Discord et les recherches REST au démarrage (ID d’application + résolution de liste d’autorisation) via un proxy HTTP(S) avec `channels.discord.proxy`.

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
    Activez la résolution PluralKit pour mapper les messages proxifiés à l’identité du membre système :

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // optional; needed for private systems
      },
    },
  },
}
```

    Notes :

    - les listes d’autorisation peuvent utiliser `pk:<memberId>`
    - les noms d’affichage des membres sont mis en correspondance par nom/slug uniquement lorsque `channels.discord.dangerouslyAllowNameMatching: true`
    - les recherches utilisent l’ID du message d’origine et sont limitées à une fenêtre temporelle
    - si la recherche échoue, les messages proxifiés sont traités comme des messages de bot et ignorés sauf si `allowBots=true`

  </Accordion>

  <Accordion title="Alias de mention sortants">
    Utilisez `mentionAliases` lorsque les agents ont besoin de mentions sortantes déterministes pour des utilisateurs Discord connus. Les clés sont des identifiants sans le `@` initial ; les valeurs sont des ID utilisateur Discord. Les identifiants inconnus, `@everyone`, `@here` et les mentions dans les spans de code Markdown restent inchangés.

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        Vladislava: "123456789012345678",
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

  <Accordion title="Configuration de présence">
    Les mises à jour de présence sont appliquées lorsque vous définissez un champ de statut ou d’activité, ou lorsque vous activez la présence automatique.

    Exemple avec statut uniquement :

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Exemple d’activité (le statut personnalisé est le type d’activité par défaut) :

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    Exemple de diffusion :

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Carte des types d’activité :

    - 0 : En train de jouer
    - 1 : Diffusion (nécessite `activityUrl`)
    - 2 : Écoute
    - 3 : Regarde
    - 4 : Personnalisé (utilise le texte d’activité comme état du statut ; l’emoji est facultatif)
    - 5 : Compétition

    Exemple de présence automatique (signal d’état du runtime) :

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    La présence automatique mappe la disponibilité du runtime au statut Discord : sain => en ligne, dégradé ou inconnu => inactif, épuisé ou indisponible => ne pas déranger. Remplacements de texte facultatifs :

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (prend en charge l’espace réservé `{reason}`)

  </Accordion>

  <Accordion title="Approbations dans Discord">
    Discord prend en charge la gestion des approbations par boutons dans les messages privés et peut éventuellement publier les invites d’approbation dans le salon d’origine.

    Chemin de configuration :

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (facultatif ; utilise `commands.ownerAllowFrom` en repli lorsque possible)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, valeur par défaut : `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord active automatiquement les approbations exec natives lorsque `enabled` n’est pas défini ou vaut `"auto"` et qu’au moins un approbateur peut être résolu, soit depuis `execApprovals.approvers`, soit depuis `commands.ownerAllowFrom`. Discord ne déduit pas les approbateurs exec depuis `allowFrom` du salon, l’ancien `dm.allowFrom` ou le `defaultTo` de message direct. Définissez `enabled: false` pour désactiver explicitement Discord comme client d’approbation natif.

    Pour les commandes de groupe sensibles réservées au propriétaire, comme `/diagnostics` et `/export-trajectory`, OpenClaw envoie les invites d’approbation et les résultats finaux en privé. Il essaie d’abord le message privé Discord lorsque le propriétaire appelant dispose d’une route propriétaire Discord ; si elle n’est pas disponible, il utilise en repli la première route propriétaire disponible depuis `commands.ownerAllowFrom`, comme Telegram.

    Lorsque `target` vaut `channel` ou `both`, l’invite d’approbation est visible dans le salon. Seuls les approbateurs résolus peuvent utiliser les boutons ; les autres utilisateurs reçoivent un refus éphémère. Les invites d’approbation incluent le texte de la commande ; n’activez donc la livraison dans le salon que dans des salons de confiance. Si l’ID du salon ne peut pas être dérivé de la clé de session, OpenClaw revient à une livraison par message privé.

    Discord affiche également les boutons d’approbation partagés utilisés par d’autres canaux de chat. L’adaptateur Discord natif ajoute principalement le routage des messages privés aux approbateurs et la diffusion vers les salons.
    Lorsque ces boutons sont présents, ils constituent l’UX d’approbation principale ; OpenClaw
    ne doit inclure une commande manuelle `/approve` que lorsque le résultat de l’outil indique que
    les approbations par chat ne sont pas disponibles ou que l’approbation manuelle est le seul chemin.
    Si le runtime d’approbation native Discord n’est pas actif, OpenClaw garde visible l’invite
    déterministe locale `/approve <id> <decision>`. Si le
    runtime est actif mais qu’une carte native ne peut être livrée à aucune cible,
    OpenClaw envoie un avis de repli dans le même chat avec la commande `/approve`
    exacte depuis l’approbation en attente.

    L’authentification Gateway et la résolution des approbations suivent le contrat client Gateway partagé (les ID `plugin:` sont résolus via `plugin.approval.resolve` ; les autres ID via `exec.approval.resolve`). Les approbations expirent après 30 minutes par défaut.

    Voir [Approbations exec](/fr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Outils et barrières d’action

Les actions de message Discord incluent les actions de messagerie, d’administration de salon, de modération, de présence et de métadonnées.

Exemples principaux :

- messagerie : `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- réactions : `react`, `reactions`, `emojiList`
- modération : `timeout`, `kick`, `ban`
- présence : `setPresence`

L’action `event-create` accepte un paramètre facultatif `image` (URL ou chemin de fichier local) pour définir l’image de couverture de l’événement planifié.

Les barrières d’action se trouvent sous `channels.discord.actions.*`.

Comportement par défaut des barrières :

| Groupe d’actions                                                                                                                                                         | Par défaut |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | activé     |
| roles                                                                                                                                                                    | désactivé  |
| moderation                                                                                                                                                               | désactivé  |
| presence                                                                                                                                                                 | désactivé  |

## UI Components v2

OpenClaw utilise les composants Discord v2 pour les approbations exec et les marqueurs intercontextes. Les actions de message Discord peuvent aussi accepter `components` pour une UI personnalisée (avancé ; nécessite de construire une charge utile de composant via l’outil discord), tandis que les anciens `embeds` restent disponibles mais ne sont pas recommandés.

- `channels.discord.ui.components.accentColor` définit la couleur d’accent utilisée par les conteneurs de composants Discord (hex).
- Définissez-la par compte avec `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` contrôle la durée pendant laquelle les callbacks de composants Discord envoyés restent enregistrés (valeur par défaut `1800000`, maximum `86400000`). Définissez-la par compte avec `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` est ignoré lorsque les composants v2 sont présents.
- Les aperçus d’URL simples sont supprimés par défaut. Définissez `suppressEmbeds: false` sur une action de message lorsqu’un seul lien sortant doit se déployer.

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

Discord possède deux surfaces vocales distinctes : les **salons vocaux** en temps réel (conversations continues) et les **pièces jointes de message vocal** (le format d’aperçu avec forme d’onde). Le Gateway prend en charge les deux.

### Salons vocaux

Liste de vérification de configuration :

1. Activez Message Content Intent dans le Discord Developer Portal.
2. Activez Server Members Intent lorsque des listes d’autorisation de rôles/utilisateurs sont utilisées.
3. Invitez le bot avec les portées `bot` et `applications.commands`.
4. Accordez Connect, Speak, Send Messages et Read Message History dans le salon vocal cible.
5. Activez les commandes natives (`commands.native` ou `channels.discord.commands.native`).
6. Configurez `channels.discord.voice`.

Utilisez `/vc join|leave|status` pour contrôler les sessions. La commande utilise l’agent par défaut du compte et suit les mêmes règles de liste d’autorisation et de politique de groupe que les autres commandes Discord.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Pour inspecter les autorisations effectives du bot avant de rejoindre, exécutez :

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

Exemple de jonction automatique :

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.5",
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
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Notes :

- `voice.tts` remplace `messages.tts` uniquement pour la lecture vocale `stt-tts`. Les modes temps réel utilisent `voice.realtime.speakerVoice`.
- `voice.mode` contrôle le chemin de conversation. La valeur par défaut est `agent-proxy` : une interface vocale temps réel gère le minutage des tours, l’interruption et la lecture, délègue le travail substantiel à l’agent OpenClaw routé via `openclaw_agent_consult`, puis traite le résultat comme une invite Discord saisie par cet intervenant. `stt-tts` conserve l’ancien flux STT par lot plus TTS. `bidi` permet au modèle temps réel de converser directement tout en exposant `openclaw_agent_consult` pour le cerveau OpenClaw.
- `voice.agentSession` contrôle quelle conversation OpenClaw reçoit les tours vocaux. Laissez-le non défini pour utiliser la session propre au canal vocal, ou définissez `{ mode: "target", target: "channel:<text-channel-id>" }` pour que le canal vocal agisse comme extension microphone/haut-parleur d’une session de canal texte Discord existante, comme `#maintainers`.
- `voice.model` remplace le cerveau de l’agent OpenClaw pour les réponses vocales Discord et les consultations temps réel. Laissez-le non défini pour hériter du modèle de l’agent routé. Il est distinct de `voice.realtime.model`.
- `voice.followUsers` permet au bot de rejoindre, déplacer et quitter la voix Discord avec les utilisateurs sélectionnés. Consultez [Suivre des utilisateurs en vocal](#follow-users-in-voice) pour les règles de comportement et les exemples.
- `agent-proxy` route la parole via `discord-voice`, ce qui préserve l’autorisation normale du propriétaire et des outils pour l’intervenant et la session cible, mais masque l’outil `tts` de l’agent parce que la voix Discord possède la lecture. Par défaut, `agent-proxy` donne à la consultation un accès complet aux outils équivalent à celui du propriétaire pour les intervenants propriétaires (`voice.realtime.toolPolicy: "owner"`) et préfère fortement consulter l’agent OpenClaw avant les réponses substantielles (`voice.realtime.consultPolicy: "always"`). Dans ce mode `always` par défaut, la couche temps réel ne prononce pas automatiquement de remplissage avant la réponse de consultation ; elle capture et transcrit la parole, puis prononce la réponse OpenClaw routée. Si plusieurs réponses de consultation forcées se terminent pendant que Discord lit encore la première réponse, les réponses ultérieures à formulation exacte sont mises en file d’attente jusqu’à ce que la lecture soit inactive, au lieu de remplacer la parole au milieu d’une phrase.
- En mode `stt-tts`, le STT utilise `tools.media.audio` ; `voice.model` n’affecte pas la transcription.
- Dans les modes temps réel, `voice.realtime.provider`, `voice.realtime.model` et `voice.realtime.speakerVoice` configurent la session audio temps réel. Pour OpenAI Realtime 2 plus le cerveau Codex, utilisez `voice.realtime.model: "gpt-realtime-2"` et `voice.model: "openai/gpt-5.5"`.
- Les modes vocaux temps réel incluent par défaut de petits fichiers de profil `IDENTITY.md`, `USER.md` et `SOUL.md` dans les instructions du fournisseur temps réel, afin que les tours directs rapides conservent la même identité, le même ancrage utilisateur et la même persona que l’agent OpenClaw routé. Définissez `voice.realtime.bootstrapContextFiles` sur un sous-ensemble pour personnaliser cela, ou sur `[]` pour le désactiver. Les fichiers d’amorçage temps réel pris en charge sont limités à ces fichiers de profil ; `AGENTS.md` reste dans le contexte normal de l’agent. Le contexte de profil injecté ne remplace pas `openclaw_agent_consult` pour le travail dans l’espace de travail, les faits actuels, la recherche en mémoire ou les actions appuyées par des outils.
- En mode temps réel OpenAI `agent-proxy`, définissez `voice.realtime.requireWakeName: true` pour garder la voix temps réel Discord silencieuse jusqu’à ce qu’une transcription commence ou se termine par un nom d’activation. Les noms d’activation configurés doivent comporter un ou deux mots. Si `voice.realtime.wakeNames` n’est pas défini, OpenClaw utilise le `name` de l’agent routé plus `OpenClaw`, avec repli sur l’identifiant de l’agent plus `OpenClaw`. Le filtrage par nom d’activation désactive la réponse automatique du fournisseur temps réel, route les tours acceptés via le chemin de consultation de l’agent OpenClaw et donne un court accusé vocal lorsqu’un nom d’activation initial est reconnu depuis une transcription partielle avant l’arrivée de la transcription finale.
- Le fournisseur temps réel OpenAI accepte les noms d’événements Realtime 2 actuels et les alias hérités compatibles avec Codex pour les événements audio de sortie et de transcription, afin que les instantanés de fournisseur compatibles puissent dériver sans perdre l’audio de l’assistant.
- `voice.realtime.bargeIn` contrôle si les événements de début de parole Discord interrompent la lecture temps réel active. S’il n’est pas défini, il suit le paramètre d’interruption de l’audio d’entrée du fournisseur temps réel.
- `voice.realtime.minBargeInAudioEndMs` contrôle la durée minimale de lecture de l’assistant avant qu’une interruption OpenAI temps réel ne tronque l’audio. Valeur par défaut : `250`. Définissez `0` pour une interruption immédiate dans les salons à faible écho, ou augmentez cette valeur pour les configurations de haut-parleurs avec beaucoup d’écho.
- Pour une voix OpenAI lors de la lecture Discord, définissez `voice.tts.provider: "openai"` et choisissez une voix de synthèse vocale sous `voice.tts.providers.openai.speakerVoice`. `cedar` est un bon choix à sonorité masculine avec le modèle TTS OpenAI actuel.
- Les remplacements Discord `systemPrompt` par canal s’appliquent aux tours de transcription vocale pour ce canal vocal.
- Les tours de transcription vocale dérivent le statut de propriétaire de `allowFrom` Discord (ou `dm.allowFrom`) pour les commandes protégées par propriétaire et les actions de canal. La visibilité des outils de l’agent suit la stratégie d’outils configurée pour la session routée.
- La voix Discord est optionnelle pour les configurations texte uniquement ; définissez `channels.discord.voice.enabled=true` (ou conservez un bloc `channels.discord.voice` existant) pour activer les commandes `/vc`, l’exécution vocale et l’intention Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` peut remplacer explicitement l’abonnement à l’intention d’état vocal. Laissez-le non défini pour que l’intention suive l’activation vocale effective.
- Si `voice.autoJoin` comporte plusieurs entrées pour la même guilde, OpenClaw rejoint le dernier canal configuré pour cette guilde.
- `voice.allowedChannels` est une liste d’autorisation de résidence facultative. Laissez-la non définie pour autoriser `/vc join` dans n’importe quel canal vocal Discord autorisé. Lorsqu’elle est définie, `/vc join`, la jonction automatique au démarrage et les déplacements d’état vocal du bot sont restreints aux entrées `{ guildId, channelId }` listées. Définissez-la sur un tableau vide pour refuser toutes les jonctions vocales Discord. Si Discord déplace le bot hors de la liste d’autorisation, OpenClaw quitte ce canal et rejoint à nouveau la cible de jonction automatique configurée lorsqu’elle est disponible.
- `voice.daveEncryption` et `voice.decryptionFailureTolerance` sont transmis aux options de jonction `@discordjs/voice`.
- Les valeurs par défaut de `@discordjs/voice` sont `daveEncryption=true` et `decryptionFailureTolerance=24` si elles ne sont pas définies.
- OpenClaw utilise le codec `libopus-wasm` fourni pour la réception vocale Discord et la lecture PCM brute temps réel. Il embarque une version WebAssembly libopus épinglée et ne nécessite pas de modules complémentaires opus natifs.
- `voice.connectTimeoutMs` contrôle l’attente initiale Ready de `@discordjs/voice` pour les tentatives `/vc join` et de jonction automatique. Valeur par défaut : `30000`.
- `voice.reconnectGraceMs` contrôle combien de temps OpenClaw attend qu’une session vocale déconnectée commence à se reconnecter avant de la détruire. Valeur par défaut : `15000`.
- En mode `stt-tts`, la lecture vocale ne s’arrête pas simplement parce qu’un autre utilisateur commence à parler. Pour éviter les boucles de rétroaction, OpenClaw ignore les nouvelles captures vocales pendant la lecture TTS ; parlez après la fin de la lecture pour le tour suivant. Les modes temps réel transmettent les débuts de parole comme signaux d’interruption au fournisseur temps réel.
- Dans les modes temps réel, l’écho des haut-parleurs dans un micro ouvert peut ressembler à une interruption et interrompre la lecture. Pour les salons Discord avec beaucoup d’écho, définissez `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` pour empêcher OpenAI d’interrompre automatiquement sur l’audio d’entrée. Ajoutez `voice.realtime.bargeIn: true` si vous voulez toujours que les événements de début de parole Discord interrompent la lecture active. Le pont temps réel OpenAI ignore les troncatures de lecture plus courtes que `voice.realtime.minBargeInAudioEndMs`, considérées comme probablement dues à l’écho ou au bruit, et les journalise comme ignorées au lieu d’effacer la lecture Discord.
- `voice.captureSilenceGraceMs` contrôle combien de temps OpenClaw attend après que Discord signale qu’un intervenant s’est arrêté avant de finaliser ce segment audio pour le STT. Valeur par défaut : `2000` ; augmentez cette valeur si Discord découpe des pauses normales en transcriptions partielles hachées.
- Lorsqu’ElevenLabs est le fournisseur TTS sélectionné, la lecture vocale Discord utilise le TTS en streaming et démarre à partir du flux de réponse du fournisseur. Les fournisseurs sans prise en charge du streaming se replient sur le chemin de fichier temporaire synthétisé.
- OpenClaw surveille aussi les échecs de déchiffrement de réception et récupère automatiquement en quittant puis en rejoignant le canal vocal après des échecs répétés sur une courte fenêtre.
- Si les journaux de réception affichent à répétition `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` après une mise à jour, collectez un rapport de dépendances et les journaux. La ligne `@discordjs/voice` fournie inclut le correctif de remplissage amont de la PR discord.js #11449, qui a fermé le problème discord.js #11419.
- Les événements de réception `The operation was aborted` sont attendus quand OpenClaw finalise un segment d’intervenant capturé ; ce sont des diagnostics verbeux, pas des avertissements.
- Les journaux vocaux Discord verbeux incluent un aperçu borné sur une ligne de la transcription STT pour chaque segment d’intervenant accepté, afin que le débogage affiche à la fois le côté utilisateur et le côté réponse de l’agent sans déverser de texte de transcription non borné.
- En mode `agent-proxy`, le repli de consultation forcée ignore les fragments de transcription probablement incomplets, comme du texte se terminant par `...` ou par un connecteur final comme `and`, ainsi que les clôtures manifestement non actionnables comme « je reviens tout de suite » ou « au revoir ». Les journaux affichent `forced agent consult skipped reason=...` lorsque cela empêche une réponse obsolète mise en file d’attente.

### Suivre des utilisateurs en vocal

Utilisez `voice.followUsers` lorsque vous voulez que le bot vocal Discord reste avec un ou plusieurs utilisateurs Discord connus au lieu de rejoindre un canal fixe au démarrage ou d’attendre `/vc join`.

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

- `followUsers` accepte les identifiants utilisateur Discord bruts et les valeurs `discord:<id>`. OpenClaw normalise les deux formes avant de faire correspondre les événements d’état vocal.
- `followUsersEnabled` vaut par défaut `true` lorsque `followUsers` est configuré. Définissez-le sur `false` pour conserver la liste enregistrée mais arrêter le suivi vocal automatique.
- Lorsqu’un utilisateur suivi rejoint un canal vocal autorisé, OpenClaw rejoint ce canal. Lorsque l’utilisateur se déplace, OpenClaw se déplace avec lui. Lorsque l’utilisateur suivi actif se déconnecte, OpenClaw quitte le canal.
- Si plusieurs utilisateurs suivis se trouvent dans la même guilde et que l’utilisateur suivi actif part, OpenClaw se déplace vers le canal d’un autre utilisateur suivi avant de quitter la guilde. Si plusieurs utilisateurs suivis se déplacent en même temps, le dernier événement d’état vocal observé l’emporte.
- `allowedChannels` s’applique toujours. Un utilisateur suivi dans un canal interdit est ignoré, et une session possédée par le suivi se déplace vers un autre utilisateur suivi ou quitte le canal.
- OpenClaw réconcilie les événements d’état vocal manqués au démarrage et à intervalle borné. La réconciliation échantillonne les guildes configurées et limite les recherches REST par exécution, donc les très grandes listes `followUsers` peuvent nécessiter plus d’un intervalle pour converger.
- Si Discord ou un administrateur déplace le bot pendant qu’il suit un utilisateur, OpenClaw reconstruit la session vocale et préserve la propriété du suivi lorsque la destination est autorisée. Si le bot est déplacé hors de `allowedChannels`, OpenClaw quitte et rejoint à nouveau la cible configurée lorsqu’elle existe.
- La récupération de réception DAVE peut quitter et rejoindre le même canal après des échecs de déchiffrement répétés. Les sessions possédées par le suivi conservent leur propriété de suivi via ce chemin de récupération, afin qu’une déconnexion ultérieure de l’utilisateur suivi quitte toujours le canal.

Choisissez entre les modes de jonction :

- Utilisez `followUsers` pour les configurations personnelles ou d’opérateur où le bot doit automatiquement être en vocal lorsque vous l’êtes.
- Utilisez `autoJoin` pour les bots de salon fixe qui doivent être présents même lorsqu’aucun utilisateur suivi n’est en vocal.
- Utilisez `/vc join` pour les jonctions ponctuelles ou les salons où une présence vocale automatique serait surprenante.

Codec vocal Discord :

- Les journaux de réception vocale affichent `discord voice: opus decoder: libopus-wasm`.
- La lecture en temps réel encode le PCM stéréo brut à 48 kHz en Opus avec le même package `libopus-wasm` inclus avant de transmettre les paquets à `@discordjs/voice`.
- La lecture de fichiers et de flux fournisseur transcode en PCM stéréo brut à 48 kHz avec ffmpeg, puis utilise `libopus-wasm` pour le flux de paquets Opus envoyé à Discord.

Pipeline STT plus TTS :

- La capture PCM Discord est convertie en fichier temporaire WAV.
- `tools.media.audio` gère le STT, par exemple `openai/gpt-4o-mini-transcribe`.
- La transcription est envoyée via l’entrée Discord et le routage pendant que le LLM de réponse s’exécute avec une politique de sortie vocale qui masque l’outil `tts` de l’agent et demande du texte retourné, car la voix Discord possède la lecture TTS finale.
- `voice.model`, lorsqu’il est défini, remplace uniquement le LLM de réponse pour ce tour de canal vocal.
- `voice.tts` est fusionné par-dessus `messages.tts` ; les fournisseurs capables de streaming alimentent directement le lecteur, sinon le fichier audio résultant est lu dans le canal rejoint.

Exemple de session de canal vocal agent-proxy par défaut :

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.5",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Sans bloc `voice.agentSession`, chaque canal vocal obtient sa propre session OpenClaw routée. Par exemple, `/vc join channel:234567890123456789` parle à la session de ce canal vocal Discord. Le modèle en temps réel n’est que l’interface vocale ; les requêtes substantielles sont transmises à l’agent OpenClaw configuré. Si le modèle en temps réel produit une transcription finale sans appeler l’outil de consultation, OpenClaw force la consultation comme solution de repli afin que le comportement par défaut reste équivalent à parler à l’agent.

Exemple STT plus TTS hérité :

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

Exemple bidi en temps réel :

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

La voix comme extension d’une session de canal Discord existante :

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

En mode `agent-proxy`, le bot rejoint le canal vocal configuré, mais les tours de l’agent OpenClaw utilisent la session routée normale et l’agent du canal cible. La session vocale en temps réel prononce le résultat retourné dans le canal vocal. L’agent superviseur peut toujours utiliser les outils de message normaux selon sa politique d’outils, y compris envoyer un message Discord séparé si c’est l’action appropriée.

Pendant qu’une exécution OpenClaw déléguée est active, les nouvelles transcriptions vocales Discord sont traitées comme du contrôle d’exécution en direct avant de démarrer un autre tour d’agent. Les phrases telles que « status », « cancel that », « use the smaller fix » ou « when you're done also check tests » sont classées comme statut, annulation, orientation ou entrée de suivi pour la session active. Les résultats de statut, d’annulation, d’orientation acceptée et de suivi sont énoncés dans le canal vocal afin que l’appelant sache si OpenClaw a traité la demande.

Formes de cible utiles :

- `target: "channel:123456789012345678"` route via une session de canal texte Discord.
- `target: "123456789012345678"` est traité comme une cible de canal.
- `target: "dm:123456789012345678"` ou `target: "user:123456789012345678"` route via cette session de message direct.

Exemple OpenAI Realtime avec écho important :

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
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

Utilisez ceci lorsque le modèle entend sa propre lecture Discord via un micro ouvert, mais que vous souhaitez tout de même l’interrompre en parlant. OpenClaw empêche OpenAI de s’interrompre automatiquement sur l’audio d’entrée brut, tandis que `bargeIn: true` permet aux événements de début de locuteur Discord et à l’audio d’un locuteur déjà actif d’annuler les réponses en temps réel actives avant que le prochain tour capturé n’atteigne OpenAI. Les signaux de barge-in très précoces dont `audioEndMs` est inférieur à `minBargeInAudioEndMs` sont traités comme de l’écho ou du bruit probable et ignorés afin que le modèle ne se coupe pas à la première trame de lecture.

Journaux vocaux attendus :

- À la connexion : `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Au démarrage du temps réel : `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Sur audio de locuteur : `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`, et `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Sur parole obsolète ignorée : `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` ou `reason=non-actionable-closing ...`
- À la fin de la réponse en temps réel : `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- À l’arrêt ou à la réinitialisation de la lecture : `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Sur consultation en temps réel : `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Sur réponse de l’agent : `discord voice: agent turn answer ...`
- Sur parole exacte mise en file : `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, suivi de `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Sur détection de barge-in : `discord voice: realtime barge-in detected source=speaker-start ...` ou `discord voice: realtime barge-in detected source=active-speaker-audio ...`, suivi de `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Sur interruption en temps réel : `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, suivi soit de `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...`, soit de `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Sur écho ou bruit ignoré : `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Sur barge-in désactivé : `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Sur lecture inactive : `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Pour déboguer un audio coupé, lisez les journaux vocaux en temps réel comme une chronologie :

1. `realtime audio playback started` signifie que Discord a commencé à lire l’audio de l’assistant. Le pont commence à compter les morceaux de sortie de l’assistant, les octets PCM Discord, les octets temps réel du fournisseur et la durée audio synthétisée à partir de ce point.
2. `realtime speaker turn opened` marque l’activation d’un locuteur Discord. Si la lecture est déjà active et que `bargeIn` est activé, cela peut être suivi de `barge-in detected source=speaker-start`.
3. `realtime input audio started` marque la première trame audio réelle reçue pour ce tour de locuteur. `outputActive=true` ou un `outputAudioMs` non nul ici signifie que le micro envoie une entrée pendant que la lecture de l’assistant est encore active.
4. `barge-in detected source=active-speaker-audio` signifie qu’OpenClaw a détecté de l’audio de locuteur en direct pendant que la lecture de l’assistant était active. C’est utile pour distinguer une vraie interruption d’un événement de début de locuteur Discord sans audio utile.
5. `barge-in requested reason=...` signifie qu’OpenClaw a demandé au fournisseur en temps réel d’annuler ou de tronquer la réponse active. Il inclut `outputAudioMs`, `outputActive` et `playbackChunks` afin que vous puissiez voir quelle quantité d’audio de l’assistant avait réellement été lue avant l’interruption.
6. `realtime audio playback stopped reason=...` est le point de réinitialisation de la lecture Discord locale. La raison indique qui a arrêté la lecture : `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` ou `session-close`.
7. `realtime speaker turn closed` résume le tour d’entrée capturé. `chunks=0` ou `hasAudio=false` signifie que le tour de locuteur s’est ouvert, mais qu’aucun audio utilisable n’a atteint le pont en temps réel. `interruptedPlayback=true` signifie que ce tour d’entrée a chevauché la sortie de l’assistant et déclenché la logique de barge-in.

Champs utiles :

- `outputAudioMs` : durée audio de l’assistant générée par le fournisseur en temps réel avant la ligne de journal.
- `audioMs` : durée audio de l’assistant comptée par OpenClaw avant l’arrêt de la lecture.
- `elapsedMs` : temps d’horloge entre l’ouverture et la fermeture du flux de lecture ou du tour de locuteur.
- `discordBytes` : octets PCM stéréo à 48 kHz envoyés à la voix Discord ou reçus d’elle.
- `realtimeBytes` : octets PCM au format fournisseur envoyés au fournisseur en temps réel ou reçus de lui.
- `playbackChunks` : morceaux audio de l’assistant transmis à Discord pour la réponse active.
- `sinceLastAudioMs` : écart entre la dernière trame audio de locuteur capturée et la fermeture du tour de locuteur.

Modèles courants :

- Une coupure immédiate avec `source=active-speaker-audio`, un petit `outputAudioMs` et le même utilisateur à proximité indique généralement que l’écho du haut-parleur entre dans le micro. Augmentez `voice.realtime.minBargeInAudioEndMs`, baissez le volume du haut-parleur, utilisez un casque ou définissez `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` suivi de `speaker turn closed ... hasAudio=false` signifie que Discord a signalé un début de locuteur, mais qu’aucun audio n’a atteint OpenClaw. Cela peut être un événement vocal Discord transitoire, un comportement de noise gate ou un client qui active brièvement le micro.
- `audio playback stopped reason=stream-close` sans barge-in proche ni `provider-clear-audio` signifie que le flux de lecture Discord local s’est terminé de manière inattendue. Vérifiez les journaux précédents du fournisseur et du lecteur Discord.
- `capture ignored during playback (barge-in disabled)` signifie qu’OpenClaw a volontairement abandonné l’entrée pendant que l’audio de l’assistant était actif. Activez `voice.realtime.bargeIn` si vous souhaitez que la parole interrompe la lecture.
- `barge-in ignored ... outputActive=false` signifie que Discord ou le VAD du fournisseur a signalé de la parole, mais qu’OpenClaw n’avait aucune lecture active à interrompre. Cela ne devrait pas couper l’audio.

Les identifiants sont résolus par composant : authentification de route LLM pour `voice.model`, authentification STT pour `tools.media.audio`, authentification TTS pour `messages.tts`/`voice.tts`, et authentification du fournisseur en temps réel pour `voice.realtime.providers` ou la configuration d’authentification normale du fournisseur.

### Messages vocaux

Les messages vocaux Discord affichent un aperçu de forme d’onde et nécessitent de l’audio OGG/Opus. OpenClaw génère automatiquement la forme d’onde, mais a besoin de `ffmpeg` et `ffprobe` sur l’hôte Gateway pour inspecter et convertir.

- Fournissez un **chemin de fichier local** (les URL sont rejetées).
- Omettez le contenu textuel (Discord rejette texte + message vocal dans le même payload).
- Tout format audio est accepté ; OpenClaw convertit en OGG/Opus si nécessaire.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Dépannage

<AccordionGroup>
  <Accordion title="Intents non autorisés utilisés ou le bot ne voit aucun message de serveur">

    - activez Message Content Intent
    - activez Server Members Intent lorsque vous dépendez de la résolution utilisateur/membre
    - redémarrez le Gateway après avoir modifié les intents

  </Accordion>

  <Accordion title="Messages de serveur bloqués de façon inattendue">

    - vérifiez `groupPolicy`
    - vérifiez la liste d’autorisation des serveurs sous `channels.discord.guilds`
    - si la map `channels` du serveur existe, seuls les canaux listés sont autorisés
    - vérifiez le comportement de `requireMention` et les motifs de mention

    Vérifications utiles :

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Mention requise à false, mais toujours bloqué">
    Causes fréquentes :

    - `groupPolicy="allowlist"` sans liste d’autorisation de serveur/canal correspondante
    - `requireMention` configuré au mauvais endroit (doit être sous `channels.discord.guilds` ou dans l’entrée de canal)
    - expéditeur bloqué par la liste d’autorisation `users` du serveur/canal

  </Accordion>

  <Accordion title="Tours Discord de longue durée ou réponses dupliquées">

    Journaux typiques :

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Réglages de la file Gateway Discord :

    - compte unique : `channels.discord.eventQueue.listenerTimeout`
    - plusieurs comptes : `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - cela contrôle uniquement le travail du listener du Gateway Discord, pas la durée de vie du tour d’agent

    Discord n’applique pas de délai d’expiration propre au canal aux tours d’agent en file d’attente. Les listeners de messages transfèrent immédiatement le travail, et les exécutions Discord en file d’attente préservent l’ordre par session jusqu’à ce que le cycle de vie de la session, de l’outil ou du runtime se termine ou abandonne le travail.

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

  <Accordion title="Avertissements de délai d’expiration de recherche des métadonnées du Gateway">
    OpenClaw récupère les métadonnées Discord `/gateway/bot` avant de se connecter. Les échecs transitoires reviennent à l’URL de Gateway par défaut de Discord et sont soumis à une limitation de fréquence dans les journaux.

    Réglages du délai d’expiration des métadonnées :

    - compte unique : `channels.discord.gatewayInfoTimeoutMs`
    - plusieurs comptes : `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - repli env lorsque la configuration n’est pas définie : `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - valeur par défaut : `30000` (30 secondes), max : `120000`

  </Accordion>

  <Accordion title="Redémarrages après délai d’expiration READY du Gateway">
    OpenClaw attend l’événement `READY` du Gateway Discord au démarrage et après les reconnexions du runtime. Les configurations à plusieurs comptes avec étalement du démarrage peuvent nécessiter une fenêtre READY de démarrage plus longue que la valeur par défaut.

    Réglages du délai d’expiration READY :

    - démarrage compte unique : `channels.discord.gatewayReadyTimeoutMs`
    - démarrage plusieurs comptes : `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - repli env au démarrage lorsque la configuration n’est pas définie : `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - valeur par défaut au démarrage : `15000` (15 secondes), max : `120000`
    - runtime compte unique : `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime plusieurs comptes : `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - repli env du runtime lorsque la configuration n’est pas définie : `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - valeur par défaut du runtime : `30000` (30 secondes), max : `120000`

  </Accordion>

  <Accordion title="Incohérences d’audit des permissions">
    Les vérifications de permissions `channels status --probe` ne fonctionnent que pour les ID de canaux numériques.

    Si vous utilisez des clés slug, la correspondance au runtime peut toujours fonctionner, mais la sonde ne peut pas vérifier entièrement les permissions.

  </Accordion>

  <Accordion title="Problèmes de DM et d’association">

    - DM désactivé : `channels.discord.dm.enabled=false`
    - politique DM désactivée : `channels.discord.dmPolicy="disabled"` (hérité : `channels.discord.dm.policy`)
    - approbation d’association en attente en mode `pairing`

  </Accordion>

  <Accordion title="Boucles bot à bot">
    Par défaut, les messages rédigés par des bots sont ignorés.

    Si vous définissez `channels.discord.allowBots=true`, utilisez des règles strictes de mention et de liste d’autorisation pour éviter les boucles.
    Préférez `channels.discord.allowBots="mentions"` pour n’accepter que les messages de bots qui mentionnent le bot.

    OpenClaw inclut aussi une [protection contre les boucles de bots](/fr/channels/bot-loop-protection) partagée. Chaque fois que `allowBots` laisse des messages rédigés par des bots atteindre la distribution, Discord associe l’événement entrant aux faits `(account, channel, bot pair)`, et le garde générique de paire supprime la paire après qu’elle dépasse le budget d’événements configuré. Le garde empêche les boucles incontrôlées à deux bots qui devaient auparavant être arrêtées par les limites de débit Discord ; il n’affecte pas les déploiements à bot unique ni les réponses ponctuelles de bots qui restent sous le budget.

    Paramètres par défaut (actifs lorsque `allowBots` est défini) :

    - `maxEventsPerWindow: 20` -- une paire de bots peut échanger 20 messages dans la fenêtre glissante
    - `windowSeconds: 60` -- durée de la fenêtre glissante
    - `cooldownSeconds: 60` -- une fois le budget dépassé, chaque message bot à bot supplémentaire dans l’un ou l’autre sens est supprimé pendant une minute

    Configurez la valeur par défaut partagée une seule fois sous `channels.defaults.botLoopProtection`, puis remplacez Discord lorsqu’un workflow légitime a besoin de plus de marge. La précédence est :

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
      // Optional Discord-wide override. Account blocks override individual
      // fields and inherit omitted fields from here.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write a Mantis Discord mention with the configured user id.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Allow up to five messages per minute before suppressing the pair.
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

  <Accordion title="Abandons STT vocal avec DecryptionFailed(...)">

    - gardez OpenClaw à jour (`openclaw update`) afin que la logique de récupération de réception vocale Discord soit présente
    - confirmez `channels.discord.voice.daveEncryption=true` (par défaut)
    - commencez avec `channels.discord.voice.decryptionFailureTolerance=24` (valeur par défaut upstream) et ajustez uniquement si nécessaire
    - surveillez les journaux pour :
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - si les échecs continuent après la reconnexion automatique, collectez les journaux et comparez-les à l’historique de réception DAVE upstream dans [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) et [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Référence de configuration

Référence principale : [Référence de configuration - Discord](/fr/gateway/config-channels#discord).

<Accordion title="Champs Discord à signal fort">

- démarrage/authentification : `enabled`, `token`, `accounts.*`, `allowBots`
- politique : `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- commande : `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- file d’événements : `eventQueue.listenerTimeout` (budget du listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway : `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- réponse/historique : `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- livraison : `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming : `streaming` (alias hérité : `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- média/nouvelle tentative : `mediaMaxMb` (plafonne les téléversements Discord sortants, par défaut `100MB`), `retry`
- actions : `actions.*`
- présence : `activity`, `status`, `activityType`, `activityUrl`
- UI : `ui.components.accentColor`
- fonctionnalités : `threadBindings`, `bindings[]` de niveau supérieur (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Sécurité et opérations

- Traitez les tokens de bot comme des secrets (`DISCORD_BOT_TOKEN` est préférable dans les environnements supervisés).
- Accordez les permissions Discord minimales nécessaires.
- Si le déploiement ou l’état des commandes est obsolète, redémarrez le Gateway et revérifiez avec `openclaw channels status --probe`.

## Connexe

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
    Modèle de menace et durcissement.
  </Card>
  <Card title="Routage multi-agent" icon="sitemap" href="/fr/concepts/multi-agent">
    Associez les serveurs et les canaux aux agents.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/fr/tools/slash-commands">
    Comportement des commandes natives.
  </Card>
</CardGroup>
