---
read_when:
    - Travail sur les fonctionnalités du canal Discord
summary: Statut de prise en charge, capacités et configuration du bot Discord
title: Discord
x-i18n:
    generated_at: "2026-06-30T13:57:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74244c721bfd752bf4ce73a6739503c902a14d07edef5ca6300c87f717669a7e
    source_path: channels/discord.md
    workflow: 16
---

Prêt pour les messages privés et les canaux de serveur via le Gateway Discord officiel.

<CardGroup cols={3}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    Les messages privés Discord utilisent par défaut le mode d’appairage.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/fr/tools/slash-commands">
    Comportement des commandes natives et catalogue des commandes.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics inter-canaux et flux de réparation.
  </Card>
</CardGroup>

## Configuration rapide

Vous devrez créer une nouvelle application avec un bot, ajouter le bot à votre serveur et l’appairer à OpenClaw. Nous recommandons d’ajouter votre bot à votre propre serveur privé. Si vous n’en avez pas encore, [créez-en un d’abord](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (choisissez **Create My Own > For me and my friends**).

<Steps>
  <Step title="Créer une application Discord et un bot">
    Accédez au [Portail développeur Discord](https://discord.com/developers/applications) et cliquez sur **New Application**. Donnez-lui un nom comme « OpenClaw ».

    Cliquez sur **Bot** dans la barre latérale. Définissez le **Username** sur le nom que vous donnez à votre agent OpenClaw.

  </Step>

  <Step title="Activer les intents privilégiés">
    Toujours sur la page **Bot**, faites défiler jusqu’à **Privileged Gateway Intents** et activez :

    - **Message Content Intent** (obligatoire)
    - **Server Members Intent** (recommandé ; obligatoire pour les listes d’autorisation de rôles et la correspondance nom-vers-ID)
    - **Presence Intent** (facultatif ; nécessaire uniquement pour les mises à jour de présence)

  </Step>

  <Step title="Copier le jeton de votre bot">
    Revenez en haut de la page **Bot** et cliquez sur **Reset Token**.

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
      - View Channels

    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (facultatif)

    Il s’agit de l’ensemble de base pour les canaux textuels normaux. Si vous prévoyez de publier dans des fils Discord, y compris des flux de canaux forum ou média qui créent ou poursuivent un fil, activez aussi **Send Messages in Threads**.
    Copiez l’URL générée en bas, collez-la dans votre navigateur, sélectionnez votre serveur, puis cliquez sur **Continue** pour connecter. Vous devriez maintenant voir votre bot dans le serveur Discord.

  </Step>

  <Step title="Activer le mode développeur et collecter vos ID">
    De retour dans l’application Discord, vous devez activer le mode développeur afin de pouvoir copier les ID internes.

    1. Cliquez sur **User Settings** (icône d’engrenage à côté de votre avatar) → Faites défiler jusqu’à **Developer** dans la barre latérale → activez **Developer Mode**

        *(Remarque : dans l’application mobile Discord, le mode développeur se trouve sous **App Settings** → **Advanced**)*

    2. Faites un clic droit sur l’**icône de votre serveur** dans la barre latérale → **Copy Server ID**
    3. Faites un clic droit sur votre **propre avatar** → **Copy User ID**

    Enregistrez vos **Server ID** et **User ID** avec votre Bot Token — vous enverrez les trois à OpenClaw à l’étape suivante.

  </Step>

  <Step title="Autoriser les messages privés des membres du serveur">
    Pour que l’appairage fonctionne, Discord doit autoriser votre bot à vous envoyer un message privé. Faites un clic droit sur l’**icône de votre serveur** → **Privacy Settings** → activez **Direct Messages**.

    Cela permet aux membres du serveur (y compris les bots) de vous envoyer des messages privés. Gardez cette option activée si vous souhaitez utiliser les messages privés Discord avec OpenClaw. Si vous prévoyez d’utiliser uniquement des canaux de serveur, vous pouvez désactiver les messages privés après l’appairage.

  </Step>

  <Step title="Définir le jeton de votre bot de manière sécurisée (ne l’envoyez pas dans le chat)">
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

    Si OpenClaw s’exécute déjà comme service en arrière-plan, redémarrez-le via l’application Mac OpenClaw ou en arrêtant puis en redémarrant le processus `openclaw gateway run`.
    Pour les installations en service géré, exécutez `openclaw gateway install` depuis un shell où `DISCORD_BOT_TOKEN` est présent, ou stockez la variable dans `~/.openclaw/.env`, afin que le service puisse résoudre la SecretRef d’environnement après redémarrage.
    Si votre hôte est bloqué ou limité par Discord lors de la recherche de l’application au démarrage, définissez l’ID d’application/client Discord depuis le Portail développeur afin que le démarrage puisse ignorer cet appel REST. Utilisez `channels.discord.applicationId` pour le compte par défaut, ou `channels.discord.accounts.<accountId>.applicationId` lorsque vous exécutez plusieurs bots Discord.

  </Step>

  <Step title="Configurer OpenClaw et appairer">

    <Tabs>
      <Tab title="Demander à votre agent">
        Discutez avec votre agent OpenClaw sur n’importe quel canal existant (par exemple Telegram) et dites-le-lui. Si Discord est votre premier canal, utilisez plutôt l’onglet CLI / configuration.

        > « J’ai déjà défini le jeton de mon bot Discord dans la configuration. Veuillez terminer la configuration Discord avec l’ID utilisateur `<user_id>` et l’ID serveur `<server_id>`. »
      </Tab>
      <Tab title="CLI / configuration">
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

        Repli d’environnement pour le compte par défaut :

```bash
DISCORD_BOT_TOKEN=...
```

        Pour une configuration scriptée ou distante, écrivez le même bloc JSON5 avec `openclaw config patch --file ./discord.patch.json5 --dry-run`, puis réexécutez sans `--dry-run`. Les valeurs `token` en texte brut sont prises en charge. Les valeurs SecretRef sont également prises en charge pour `channels.discord.token` sur les fournisseurs env/file/exec. Consultez [Gestion des secrets](/fr/gateway/secrets).

        Pour plusieurs bots Discord, conservez chaque jeton de bot et ID d’application dans son compte. Un `channels.discord.applicationId` de niveau supérieur est hérité par les comptes ; ne le définissez donc là que lorsque chaque compte doit utiliser le même ID d’application.

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

        > « Approuve ce code d’appairage Discord : `<CODE>` »
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Les codes d’appairage expirent après 1 heure.

    Vous devriez maintenant pouvoir discuter avec votre agent dans Discord via message privé.

  </Step>
</Steps>

<Note>
La résolution des jetons tient compte du compte. Les valeurs de jeton de configuration priment sur le repli d’environnement. `DISCORD_BOT_TOKEN` n’est utilisé que pour le compte par défaut.
Si deux comptes Discord activés se résolvent vers le même jeton de bot, OpenClaw ne démarre qu’un seul moniteur de Gateway pour ce jeton. Un jeton provenant de la configuration prime sur le repli d’environnement par défaut ; sinon, le premier compte activé l’emporte et le compte en doublon est signalé comme désactivé.
Pour les appels sortants avancés (outil de message/actions de canal), un `token` explicite par appel est utilisé pour cet appel. Cela s’applique aux actions d’envoi et aux actions de style lecture/sonde (par exemple lire/rechercher/récupérer/fil/épingles/autorisations). Les paramètres de politique de compte et de nouvelle tentative proviennent toujours du compte sélectionné dans l’instantané d’exécution actif.
</Note>

## Recommandé : configurer un espace de travail de serveur

Une fois les messages privés fonctionnels, vous pouvez configurer votre serveur Discord comme un espace de travail complet où chaque canal obtient sa propre session d’agent avec son propre contexte. C’est recommandé pour les serveurs privés où il n’y a que vous et votre bot.

<Steps>
  <Step title="Ajouter votre serveur à la liste d’autorisation des serveurs">
    Cela permet à votre agent de répondre dans n’importe quel canal de votre serveur, et pas seulement en messages privés.

    <Tabs>
      <Tab title="Demander à votre agent">
        > « Ajoute mon ID de serveur Discord `<server_id>` à la liste d’autorisation des serveurs »
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
    Par défaut, votre agent ne répond dans les canaux de serveur que lorsqu’il est @mentionné. Pour un serveur privé, vous voudrez probablement qu’il réponde à chaque message.

    Dans les canaux de serveur, les réponses normales sont publiées automatiquement par défaut. Pour les salons partagés toujours actifs, activez `messages.groupChat.visibleReplies: "message_tool"` afin que l’agent puisse rester en veille et ne publier que lorsqu’il décide qu’une réponse dans le canal est utile. Cela fonctionne mieux avec des modèles de dernière génération fiables pour les outils, comme GPT 5.5. Les événements ambiants de salon restent silencieux sauf si l’outil envoie. Consultez [Événements ambiants de salon](/fr/channels/ambient-room-events) pour la configuration complète du mode veille.

    Si Discord affiche la saisie et que les journaux montrent une utilisation de jetons, mais qu’aucun message n’est publié, vérifiez si le tour a été configuré comme événement ambiant de salon ou si les réponses visibles par outil de message ont été activées.

    <Tabs>
      <Tab title="Demander à votre agent">
        > « Autorise mon agent à répondre sur ce serveur sans devoir être @mentionné »
      </Tab>
      <Tab title="Configuration">
        Définissez `requireMention: false` dans votre configuration de serveur :

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

        Pour exiger les envois par outil de message pour les réponses visibles de groupe/canal, définissez `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Prévoir la mémoire dans les canaux de serveur">
    Par défaut, la mémoire à long terme (MEMORY.md) ne se charge que dans les sessions de message privé. Les canaux de serveur ne chargent pas automatiquement MEMORY.md.

    <Tabs>
      <Tab title="Demander à votre agent">
        > « Lorsque je pose des questions dans les canaux Discord, utilise memory_search ou memory_get si tu as besoin du contexte à long terme provenant de MEMORY.md. »
      </Tab>
      <Tab title="Manuel">
        Si vous avez besoin d’un contexte partagé dans chaque canal, placez les instructions stables dans `AGENTS.md` ou `USER.md` (elles sont injectées pour chaque session). Conservez les notes à long terme dans `MEMORY.md` et accédez-y à la demande avec les outils de mémoire.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Créez maintenant quelques canaux sur votre serveur Discord et commencez à discuter. Votre agent peut voir le nom du canal, et chaque canal obtient sa propre session isolée — vous pouvez donc configurer `#coding`, `#home`, `#research` ou tout ce qui correspond à votre flux de travail.

## Modèle d’exécution

- Gateway possède la connexion Discord.
- Le routage des réponses est déterministe : les réponses entrantes Discord retournent vers Discord.
- Les métadonnées de serveur/canal Discord sont ajoutées au prompt du modèle comme contexte non fiable,
  et non comme préfixe de réponse visible par l’utilisateur. Si un modèle recopie cette enveloppe
  dans sa réponse, OpenClaw supprime les métadonnées copiées des réponses sortantes et du
  futur contexte de relecture.
- Par défaut (`session.dmScope=main`), les conversations directes partagent la session principale de l’agent (`agent:main:main`).
- Les canaux de serveur utilisent des clés de session isolées (`agent:<agentId>:discord:channel:<channelId>`).
- Les DM de groupe sont ignorés par défaut (`channels.discord.dm.groupEnabled=false`).
- Les commandes slash natives s’exécutent dans des sessions de commande isolées (`agent:<agentId>:discord:slash:<userId>`), tout en transportant `CommandTargetSessionKey` vers la session de conversation routée.
- La livraison des annonces cron/heartbeat en texte seul vers Discord utilise une seule fois la réponse finale
  visible par l’assistant. Les médias et les charges utiles de composants structurés restent
  multi-messages lorsque l’agent émet plusieurs charges utiles livrables.

## Canaux de forum

Les canaux de forum et multimédias Discord acceptent uniquement les publications dans des fils. OpenClaw prend en charge deux façons de les créer :

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
- Les lignes d’action autorisent jusqu’à 5 boutons ou un seul menu de sélection
- Types de sélection : `string`, `user`, `role`, `mentionable`, `channel`

Par défaut, les composants sont à usage unique. Définissez `components.reusable=true` pour permettre aux boutons, sélections et formulaires d’être utilisés plusieurs fois jusqu’à leur expiration.

Pour restreindre les personnes autorisées à cliquer sur un bouton, définissez `allowedUsers` sur ce bouton (ID utilisateur Discord, tags ou `*`). Lorsque cela est configuré, les utilisateurs non correspondants reçoivent un refus éphémère.

Les callbacks de composants expirent après 30 minutes par défaut. Définissez `channels.discord.agentComponents.ttlMs` pour modifier cette durée de vie du registre de callbacks pour le compte Discord par défaut, ou `channels.discord.accounts.<accountId>.agentComponents.ttlMs` pour remplacer un compte dans une configuration multi-compte. La valeur est en millisecondes, doit être un entier positif et est plafonnée à `86400000` (24 heures). Des TTL plus longs sont utiles pour les workflows de revue ou d’approbation qui nécessitent que les boutons restent utilisables, mais ils prolongent aussi la fenêtre pendant laquelle un ancien message Discord peut encore déclencher une action. Préférez le TTL le plus court compatible avec le workflow, et conservez la valeur par défaut lorsque des callbacks obsolètes seraient surprenants.

Les commandes slash `/model` et `/models` ouvrent un sélecteur de modèle interactif avec des listes déroulantes de fournisseur, modèle et runtime compatible, plus une étape Submit. `/models add` est obsolète et renvoie désormais un message d’obsolescence au lieu d’enregistrer des modèles depuis la conversation. La réponse du sélecteur est éphémère et seul l’utilisateur appelant peut l’utiliser. Les menus de sélection Discord sont limités à 25 options ; ajoutez donc des entrées `provider/*` à `agents.defaults.models` lorsque vous voulez que le sélecteur affiche les modèles découverts dynamiquement uniquement pour des fournisseurs sélectionnés comme `openai` ou `vllm`.

Pièces jointes de fichier :

- Les blocs `file` doivent pointer vers une référence de pièce jointe (`attachment://<filename>`)
- Fournissez la pièce jointe via `media`/`path`/`filePath` (fichier unique) ; utilisez `media-gallery` pour plusieurs fichiers
- Utilisez `filename` pour remplacer le nom de téléversement lorsqu’il doit correspondre à la référence de pièce jointe

Formulaires modaux :

- Ajoutez `components.modal` avec jusqu’à 5 champs
- Types de champ : `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw ajoute automatiquement un bouton déclencheur

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
    `channels.discord.dmPolicy` contrôle l’accès aux DM. `channels.discord.allowFrom` est la liste d’autorisation DM canonique.

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `channels.discord.allowFrom` inclue `"*"`)
    - `disabled`

    Si la politique DM n’est pas ouverte, les utilisateurs inconnus sont bloqués (ou invités à effectuer l’association en mode `pairing`).

    Priorité multi-compte :

    - `channels.discord.accounts.default.allowFrom` s’applique uniquement au compte `default`.
    - Pour un compte, `allowFrom` a priorité sur l’ancien `dm.allowFrom`.
    - Les comptes nommés héritent de `channels.discord.allowFrom` lorsque leur propre `allowFrom` et l’ancien `dm.allowFrom` ne sont pas définis.
    - Les comptes nommés n’héritent pas de `channels.discord.accounts.default.allowFrom`.

    Les anciens `channels.discord.dm.policy` et `channels.discord.dm.allowFrom` sont toujours lus pour compatibilité. `openclaw doctor --fix` les migre vers `dmPolicy` et `allowFrom` lorsqu’il peut le faire sans modifier l’accès.

    Format de cible DM pour la livraison :

    - `user:<id>`
    - mention `<@id>`

    Les ID numériques bruts se résolvent normalement comme des ID de canal lorsqu’une valeur par défaut de canal est active, mais les ID listés dans le `allowFrom` DM effectif du compte sont traités comme des cibles de DM utilisateur pour compatibilité.

  </Tab>

  <Tab title="Access groups">
    Les DM Discord et l’autorisation des commandes textuelles peuvent utiliser des entrées dynamiques `accessGroup:<name>` dans `channels.discord.allowFrom`.

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

    Un canal textuel Discord n’a pas de liste de membres séparée. `type: "discord.channelAudience"` modélise l’appartenance ainsi : l’expéditeur DM est membre du serveur configuré et dispose actuellement de la permission effective `ViewChannel` sur le canal configuré après application des rôles et des remplacements de canal.

    Exemple : autoriser toute personne pouvant voir `#maintainers` à envoyer un DM au bot, tout en gardant les DM fermés à tous les autres.

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

    Les recherches échouent en mode fermé. Si Discord renvoie `Missing Access`, si la recherche de membre échoue ou si le canal appartient à un autre serveur, l’expéditeur DM est traité comme non autorisé.

    Activez **Server Members Intent** dans le Discord Developer Portal pour le bot lorsque vous utilisez des groupes d’accès basés sur l’audience de canal. Les DM n’incluent pas l’état de membre du serveur ; OpenClaw résout donc le membre via Discord REST au moment de l’autorisation.

  </Tab>

  <Tab title="Guild policy">
    La gestion des serveurs est contrôlée par `channels.discord.groupPolicy` :

    - `open`
    - `allowlist`
    - `disabled`

    La base sécurisée lorsque `channels.discord` existe est `allowlist`.

    Comportement de `allowlist` :

    - le serveur doit correspondre à `channels.discord.guilds` (`id` préféré, slug accepté)
    - listes d’autorisation facultatives d’expéditeurs : `users` (ID stables recommandés) et `roles` (ID de rôle uniquement) ; si l’une ou l’autre est configurée, les expéditeurs sont autorisés lorsqu’ils correspondent à `users` OU `roles`
    - la correspondance directe par nom/tag est désactivée par défaut ; activez `channels.discord.dangerouslyAllowNameMatching: true` uniquement comme mode de compatibilité d’urgence
    - les noms/tags sont pris en charge pour `users`, mais les ID sont plus sûrs ; `openclaw security audit` avertit lorsque des entrées nom/tag sont utilisées
    - si un serveur a `channels` configuré, les canaux non listés sont refusés
    - si un serveur n’a pas de bloc `channels`, tous les canaux de ce serveur autorisé sont permis

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

    Si vous définissez seulement `DISCORD_BOT_TOKEN` et ne créez pas de bloc `channels.discord`, le fallback d’exécution est `groupPolicy="allowlist"` (avec un avertissement dans les journaux), même si `channels.defaults.groupPolicy` vaut `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Les messages de serveur sont soumis à une obligation de mention par défaut.

    La détection des mentions inclut :

    - mention explicite du bot
    - motifs de mention configurés (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportement implicite de réponse au bot dans les cas pris en charge

    Lors de l’écriture de messages Discord sortants, utilisez la syntaxe de mention canonique : `<@USER_ID>` pour les utilisateurs, `<#CHANNEL_ID>` pour les canaux et `<@&ROLE_ID>` pour les rôles. N’utilisez pas l’ancienne forme de mention de surnom `<@!USER_ID>`.

    `requireMention` est configuré par serveur/canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` supprime facultativement les messages qui mentionnent un autre utilisateur/rôle mais pas le bot (hors @everyone/@here).

    DM de groupe :

    - par défaut : ignorés (`dm.groupEnabled=false`)
    - liste d’autorisation facultative via `dm.groupChannels` (ID de canal ou slugs)

  </Tab>
</Tabs>

### Routage d’agent basé sur les rôles

Utilisez `bindings[].match.roles` pour acheminer les membres de guildes Discord vers différents agents par ID de rôle. Les bindings fondés sur les rôles acceptent uniquement les ID de rôle et sont évalués après les bindings de pair ou de pair parent, et avant les bindings limités à une guilde. Si un binding définit aussi d’autres champs de correspondance (par exemple `peer` + `guildId` + `roles`), tous les champs configurés doivent correspondre.

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
- `commands.native=false` ignore l’enregistrement et le nettoyage des slash commands Discord au démarrage. Les commandes précédemment enregistrées peuvent rester visibles dans Discord jusqu’à ce que vous les supprimiez de l’application Discord.
- L’authentification des commandes natives utilise les mêmes listes d’autorisation/politiques Discord que le traitement normal des messages.
- Les commandes peuvent toujours être visibles dans l’interface Discord pour les utilisateurs qui ne sont pas autorisés ; l’exécution applique tout de même l’authentification OpenClaw et renvoie « not authorized ».

Consultez [Slash commands](/fr/tools/slash-commands) pour le catalogue et le comportement des commandes.

Paramètres de slash command par défaut :

- `ephemeral: true`

## Détails des fonctionnalités

<AccordionGroup>
  <Accordion title="Balises de réponse et réponses natives">
    Discord prend en charge les balises de réponse dans la sortie de l’agent :

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Contrôlé par `channels.discord.replyToMode` :

    - `off` (par défaut)
    - `first`
    - `all`
    - `batched`

    Remarque : `off` désactive le fil de réponses implicite. Les balises explicites `[[reply_to_*]]` restent honorées.
    `first` attache toujours la référence de réponse native implicite au premier message Discord sortant du tour.
    `batched` attache la référence de réponse native implicite de Discord uniquement lorsque
    l’événement entrant était un lot débouncé de plusieurs messages. C’est utile
    lorsque vous voulez des réponses natives surtout pour les discussions ambiguës et en rafales, pas pour chaque
    tour à message unique.

    Les ID de message sont exposés dans le contexte/l’historique afin que les agents puissent cibler des messages précis.

  </Accordion>

  <Accordion title="Aperçus de liens">
    Discord génère par défaut des intégrations enrichies pour les URL. OpenClaw supprime par défaut ces intégrations générées sur les messages Discord sortants, afin que les URL envoyées par l’agent restent des liens simples sauf si vous les activez :

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Définissez `channels.discord.accounts.<id>.suppressEmbeds` pour remplacer le comportement d’un compte. Les envois via l’outil de messagerie de l’agent peuvent aussi transmettre `suppressEmbeds: false` pour un seul message. Les charges utiles Discord `embeds` explicites ne sont pas supprimées par le paramètre par défaut d’aperçu de lien.

  </Accordion>

  <Accordion title="Aperçu du flux en direct">
    OpenClaw peut diffuser des brouillons de réponse en envoyant un message temporaire puis en le modifiant à mesure que le texte arrive. `channels.discord.streaming` accepte `off` | `partial` | `block` | `progress` (par défaut). `progress` conserve un brouillon de statut modifiable et le met à jour avec la progression des outils jusqu’à la livraison finale ; le libellé de démarrage partagé est une ligne déroulante, donc il défile comme le reste une fois que suffisamment de travail apparaît. `streamMode` est un alias d’exécution hérité. Exécutez `openclaw doctor --fix` pour réécrire la configuration persistée vers la clé canonique.

    Définissez `channels.discord.streaming.mode` sur `off` pour désactiver les modifications d’aperçu Discord. Si le streaming par blocs Discord est explicitement activé, OpenClaw ignore le flux d’aperçu pour éviter une double diffusion.

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
    - `block` émet des fragments de taille brouillon (utilisez `draftChunk` pour ajuster la taille et les points de coupure, bornés à `textChunkLimit`).
    - Les finales avec média, erreur et réponse explicite annulent les modifications d’aperçu en attente.
    - `streaming.preview.toolProgress` (par défaut `true`) contrôle si les mises à jour d’outil/progression réutilisent le message d’aperçu.
    - Les lignes d’outil/progression s’affichent sous forme compacte emoji + titre + détail lorsque disponible, par exemple `🛠️ Bash: run tests` ou `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (par défaut `false`) active le texte de commentaire/préambule de l’assistant dans le brouillon de progression temporaire. Le commentaire est nettoyé avant affichage, reste transitoire et ne modifie pas la livraison de la réponse finale.
    - `streaming.progress.maxLineChars` contrôle le budget d’aperçu de progression par ligne. La prose est raccourcie aux limites de mots ; les détails de commande et de chemin conservent des suffixes utiles.
    - `streaming.preview.commandText` / `streaming.progress.commandText` contrôle les détails de commande/exécution dans les lignes de progression compactes : `raw` (par défaut) ou `status` (libellé d’outil uniquement).

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

    Le streaming d’aperçu est uniquement textuel ; les réponses multimédias reviennent à la livraison normale. Lorsque le streaming `block` est explicitement activé, OpenClaw ignore le flux d’aperçu pour éviter une double diffusion.

  </Accordion>

  <Accordion title="Historique, contexte et comportement des fils">
    Contexte d’historique de guilde :

    - `channels.discord.historyLimit` par défaut `20`
    - solution de repli : `messages.groupChat.historyLimit`
    - `0` désactive

    Contrôles de l’historique des DM :

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportement des fils :

    - Les fils Discord sont acheminés comme des sessions de canal et héritent de la configuration du canal parent sauf remplacement.
    - Les sessions de fil héritent de la sélection `/model` de niveau session du canal parent comme repli de modèle uniquement ; les sélections `/model` locales au fil restent prioritaires et l’historique de transcription parent n’est pas copié sauf si l’héritage de transcription est activé.
    - `channels.discord.thread.inheritParent` (par défaut `false`) active l’amorçage des nouveaux auto-fils à partir de la transcription parente. Les remplacements par compte résident sous `channels.discord.accounts.<id>.thread.inheritParent`.
    - Les réactions de l’outil de messagerie peuvent résoudre des cibles DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` est préservé pendant le repli d’activation à l’étape de réponse.

    Les sujets de canal sont injectés comme contexte **non fiable**. Les listes d’autorisation contrôlent qui peut déclencher l’agent, pas une frontière complète de rédaction de contexte supplémentaire.

  </Accordion>

  <Accordion title="Sessions liées à un fil pour les sous-agents">
    Discord peut lier un fil à une cible de session afin que les messages de suivi dans ce fil continuent d’être acheminés vers la même session (y compris les sessions de sous-agent).

    Commandes :

    - `/focus <target>` lier le fil actuel/nouveau à une cible de sous-agent/session
    - `/unfocus` supprimer le binding du fil actuel
    - `/agents` afficher les exécutions actives et l’état du binding
    - `/session idle <duration|off>` inspecter/mettre à jour le défocus automatique après inactivité pour les bindings focalisés
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

    Remarques :

    - `session.threadBindings.*` définit les valeurs globales par défaut.
    - `channels.discord.threadBindings.*` remplace le comportement Discord.
    - `spawnSessions` contrôle la création/le binding automatique des fils pour `sessions_spawn({ thread: true })` et les créations de fils ACP. Par défaut : `true`.
    - `defaultSpawnContext` contrôle le contexte natif des sous-agents pour les créations liées à un fil. Par défaut : `"fork"`.
    - Les clés obsolètes `spawnSubagentSessions`/`spawnAcpSessions` sont migrées par `openclaw doctor --fix`.
    - Si les bindings de fil sont désactivés pour un compte, `/focus` et les opérations de binding de fil associées ne sont pas disponibles.

    Consultez [Sous-agents](/fr/tools/subagents), [Agents ACP](/fr/tools/acp-agents) et [Référence de configuration](/fr/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Bindings persistants de canal ACP">
    Pour les espaces de travail ACP stables « always-on », configurez des bindings ACP typés de premier niveau ciblant des conversations Discord.

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

    Remarques :

    - `/acp spawn codex --bind here` lie le canal ou le fil actuel en place et conserve les futurs messages sur la même session ACP. Les messages de fil héritent du binding du canal parent.
    - Dans un canal ou fil lié, `/new` et `/reset` réinitialisent la même session ACP en place. Les bindings temporaires de fil peuvent remplacer la résolution de cible tant qu’ils sont actifs.
    - `spawnSessions` contrôle la création/le binding de fils enfants via `--thread auto|here`.

    Consultez [Agents ACP](/fr/tools/acp-agents) pour les détails du comportement de binding.

  </Accordion>

  <Accordion title="Notifications de réaction">
    Mode de notification de réaction par guilde :

    - `off`
    - `own` (par défaut)
    - `all`
    - `allowlist` (utilise `guilds.<id>.users`)

    Les événements de réaction sont transformés en événements système et attachés à la session Discord acheminée.

  </Accordion>

  <Accordion title="Réactions d’accusé de réception">
    `ackReaction` envoie un emoji d’accusé de réception pendant qu’OpenClaw traite un message entrant.

    Ordre de résolution :

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - repli sur l’emoji d’identité de l’agent (`agents.list[].identity.emoji`, sinon "👀")

    Remarques :

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
    Acheminez le trafic WebSocket de Gateway Discord et les recherches REST de démarrage (ID d’application + résolution de liste d’autorisation) via un proxy HTTP(S) avec `channels.discord.proxy`.

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
    Activez la résolution PluralKit pour mapper les messages proxifiés à l’identité de membre système :

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
    - les recherches utilisent l’ID du message d’origine et sont limitées par une fenêtre temporelle
    - si la recherche échoue, les messages mandatés sont traités comme des messages de bot et supprimés, sauf si `allowBots=true`

  </Accordion>

  <Accordion title="Alias de mentions sortantes">
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

    Exemple de streaming :

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

    - 0: Joue
    - 1: Streaming (nécessite `activityUrl`)
    - 2: Écoute
    - 3: Regarde
    - 4: Personnalisé (utilise le texte d’activité comme état du statut ; l’emoji est facultatif)
    - 5: En compétition

    Exemple de présence automatique (signal de santé du runtime) :

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
    Discord prend en charge le traitement des approbations par boutons dans les messages privés et peut facultativement publier les invites d’approbation dans le canal d’origine.

    Chemin de configuration :

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (facultatif ; revient à `commands.ownerAllowFrom` lorsque possible)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, par défaut : `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord active automatiquement les approbations d’exécution natives lorsque `enabled` n’est pas défini ou vaut `"auto"` et qu’au moins un approbateur peut être résolu, soit depuis `execApprovals.approvers`, soit depuis `commands.ownerAllowFrom`. Discord ne déduit pas les approbateurs d’exécution depuis le `allowFrom` du canal, l’ancien `dm.allowFrom` ou le `defaultTo` des messages directs. Définissez `enabled: false` pour désactiver explicitement Discord comme client d’approbation natif.

    Pour les commandes de groupe sensibles réservées au propriétaire, comme `/diagnostics` et `/export-trajectory`, OpenClaw envoie les invites d’approbation et les résultats finaux en privé. Il essaie d’abord le message privé Discord lorsque le propriétaire appelant dispose d’une route propriétaire Discord ; si elle n’est pas disponible, il revient à la première route propriétaire disponible depuis `commands.ownerAllowFrom`, comme Telegram.

    Lorsque `target` vaut `channel` ou `both`, l’invite d’approbation est visible dans le canal. Seuls les approbateurs résolus peuvent utiliser les boutons ; les autres utilisateurs reçoivent un refus éphémère. Les invites d’approbation incluent le texte de la commande ; n’activez donc la livraison dans le canal que dans des canaux de confiance. Si l’ID du canal ne peut pas être dérivé de la clé de session, OpenClaw revient à la livraison par message privé.

    Discord affiche également les boutons d’approbation partagés utilisés par d’autres canaux de discussion. L’adaptateur Discord natif ajoute principalement le routage des messages privés aux approbateurs et la diffusion vers le canal.
    Lorsque ces boutons sont présents, ils constituent l’UX d’approbation principale ; OpenClaw
    ne doit inclure une commande `/approve` manuelle que lorsque le résultat de l’outil indique
    que les approbations par discussion sont indisponibles ou que l’approbation manuelle est la seule voie.
    Si le runtime d’approbation natif Discord n’est pas actif, OpenClaw conserve
    l’invite déterministe locale `/approve <id> <decision>` visible. Si le
    runtime est actif mais qu’une carte native ne peut être livrée à aucune cible,
    OpenClaw envoie un avis de repli dans la même discussion avec la commande `/approve`
    exacte issue de l’approbation en attente.

    L’authentification Gateway et la résolution des approbations suivent le contrat partagé du client Gateway (les ID `plugin:` sont résolus via `plugin.approval.resolve` ; les autres ID via `exec.approval.resolve`). Les approbations expirent par défaut après 30 minutes.

    Voir [Approbations d’exécution](/fr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Outils et garde-fous d’action

Les actions de message Discord incluent la messagerie, l’administration des canaux, la modération, la présence et les actions de métadonnées.

Exemples principaux :

- messagerie : `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- réactions : `react`, `reactions`, `emojiList`
- modération : `timeout`, `kick`, `ban`
- présence : `setPresence`

L’action `event-create` accepte un paramètre `image` facultatif (URL ou chemin de fichier local) pour définir l’image de couverture de l’événement planifié.

Les garde-fous d’action se trouvent sous `channels.discord.actions.*`.

Comportement par défaut des garde-fous :

| Groupe d’actions                                                                                                                                                         | Par défaut |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| réactions, messages, fils, épingles, sondages, recherche, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | activé     |
| rôles                                                                                                                                                                    | désactivé  |
| modération                                                                                                                                                               | désactivé  |
| présence                                                                                                                                                                 | désactivé  |

## UI Components v2

OpenClaw utilise les composants Discord v2 pour les approbations d’exécution et les marqueurs inter-contextes. Les actions de message Discord peuvent aussi accepter `components` pour une UI personnalisée (avancé ; nécessite de construire une charge utile de composant via l’outil discord), tandis que les anciens `embeds` restent disponibles mais ne sont pas recommandés.

- `channels.discord.ui.components.accentColor` définit la couleur d’accent utilisée par les conteneurs de composants Discord (hex).
- Définissez-la par compte avec `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` contrôle la durée pendant laquelle les callbacks de composants Discord envoyés restent enregistrés (par défaut `1800000`, maximum `86400000`). Définissez-la par compte avec `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` sont ignorés lorsque des composants v2 sont présents.
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

Discord possède deux surfaces vocales distinctes : les **canaux vocaux** en temps réel (conversations continues) et les **pièces jointes de messages vocaux** (le format d’aperçu en forme d’onde). Le Gateway prend en charge les deux.

### Canaux vocaux

Liste de vérification de configuration :

1. Activez l’intention de contenu des messages dans le portail développeur Discord.
2. Activez l’intention des membres du serveur lorsque des listes d’autorisation de rôles/utilisateurs sont utilisées.
3. Invitez le bot avec les portées `bot` et `applications.commands`.
4. Accordez Connexion, Parler, Envoyer des messages et Lire l’historique des messages dans le canal vocal cible.
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

Exemple de connexion automatique :

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

- `voice.tts` remplace `messages.tts` uniquement pour la lecture vocale `stt-tts`. Les modes en temps réel utilisent `voice.realtime.speakerVoice`.
- `voice.mode` contrôle le chemin de conversation. La valeur par défaut est `agent-proxy` : une interface vocale en temps réel gère le minutage des tours, l’interruption et la lecture, délègue le travail substantiel à l’agent OpenClaw routé via `openclaw_agent_consult`, puis traite le résultat comme une invite Discord saisie par ce locuteur. `stt-tts` conserve l’ancien flux STT par lot plus TTS. `bidi` permet au modèle en temps réel de converser directement tout en exposant `openclaw_agent_consult` pour le cerveau OpenClaw.
- `voice.agentSession` contrôle quelle conversation OpenClaw reçoit les tours vocaux. Laissez-le non défini pour utiliser la session propre au canal vocal, ou définissez `{ mode: "target", target: "channel:<text-channel-id>" }` pour que le canal vocal agisse comme l’extension microphone/haut-parleur d’une session de canal texte Discord existante, par exemple `#maintainers`.
- `voice.model` remplace le cerveau de l’agent OpenClaw pour les réponses vocales Discord et les consultations en temps réel. Laissez-le non défini pour hériter du modèle de l’agent routé. Il est distinct de `voice.realtime.model`.
- `voice.followUsers` permet au bot de rejoindre, déplacer et quitter les salons vocaux Discord avec les utilisateurs sélectionnés. Consultez [Suivre des utilisateurs en vocal](#follow-users-in-voice) pour les règles de comportement et les exemples.
- `agent-proxy` route la parole via `discord-voice`, ce qui conserve l’autorisation normale propriétaire/outil pour le locuteur et la session cible, mais masque l’outil `tts` de l’agent, car la voix Discord possède la lecture. Par défaut, `agent-proxy` donne à la consultation un accès complet aux outils équivalent au propriétaire pour les locuteurs propriétaires (`voice.realtime.toolPolicy: "owner"`) et privilégie fortement la consultation de l’agent OpenClaw avant les réponses substantielles (`voice.realtime.consultPolicy: "always"`). Dans ce mode `always` par défaut, la couche en temps réel ne prononce pas automatiquement de remplissage avant la réponse de consultation ; elle capture et transcrit la parole, puis prononce la réponse OpenClaw routée. Si plusieurs réponses de consultation forcées se terminent alors que Discord lit encore la première réponse, les réponses vocales exactes ultérieures sont mises en file d’attente jusqu’à ce que la lecture soit inactive, au lieu de remplacer la parole au milieu d’une phrase.
- En mode `stt-tts`, STT utilise `tools.media.audio` ; `voice.model` n’affecte pas la transcription.
- Dans les modes en temps réel, `voice.realtime.provider`, `voice.realtime.model` et `voice.realtime.speakerVoice` configurent la session audio en temps réel. Pour OpenAI Realtime 2 avec le cerveau Codex, utilisez `voice.realtime.model: "gpt-realtime-2"` et `voice.model: "openai/gpt-5.5"`.
- Les modes vocaux en temps réel incluent par défaut de petits fichiers de profil `IDENTITY.md`, `USER.md` et `SOUL.md` dans les instructions du fournisseur en temps réel, afin que les tours directs rapides conservent la même identité, le même ancrage utilisateur et la même persona que l’agent OpenClaw routé. Définissez `voice.realtime.bootstrapContextFiles` sur un sous-ensemble pour personnaliser cela, ou sur `[]` pour le désactiver. Les fichiers d’amorçage en temps réel pris en charge sont limités à ces fichiers de profil ; `AGENTS.md` reste dans le contexte normal de l’agent. Le contexte de profil injecté ne remplace pas `openclaw_agent_consult` pour le travail dans l’espace de travail, les faits actuels, la recherche en mémoire ou les actions adossées à des outils.
- En mode en temps réel OpenAI `agent-proxy`, définissez `voice.realtime.requireWakeName: true` pour que la voix Discord en temps réel reste silencieuse jusqu’à ce qu’une transcription commence ou se termine par un nom de réveil. Les noms de réveil configurés doivent comporter un ou deux mots. Si `voice.realtime.wakeNames` n’est pas défini, OpenClaw utilise le `name` de l’agent routé plus `OpenClaw`, avec un repli sur l’identifiant de l’agent plus `OpenClaw`. Le filtrage par nom de réveil désactive la réponse automatique du fournisseur en temps réel, route les tours acceptés via le chemin de consultation de l’agent OpenClaw, et donne un bref accusé de réception parlé lorsqu’un nom de réveil initial est reconnu à partir de la transcription partielle avant l’arrivée de la transcription finale.
- Le fournisseur en temps réel OpenAI accepte les noms d’événements Realtime 2 actuels et les alias hérités compatibles avec Codex pour les événements audio de sortie et de transcription, afin que les instantanés de fournisseur compatibles puissent dériver sans perdre l’audio de l’assistant.
- `voice.realtime.bargeIn` contrôle si les événements de début de parole Discord interrompent la lecture en temps réel active. S’il n’est pas défini, il suit le paramètre d’interruption audio d’entrée du fournisseur en temps réel.
- `voice.realtime.minBargeInAudioEndMs` contrôle la durée minimale de lecture de l’assistant avant qu’une interruption OpenAI en temps réel tronque l’audio. Valeur par défaut : `250`. Définissez `0` pour une interruption immédiate dans les salons à faible écho, ou augmentez-la pour les configurations de haut-parleurs avec beaucoup d’écho.
- Pour une voix OpenAI lors de la lecture Discord, définissez `voice.tts.provider: "openai"` et choisissez une voix de synthèse vocale sous `voice.tts.providers.openai.speakerVoice`. `cedar` est un bon choix à sonorité masculine sur le modèle TTS OpenAI actuel.
- Les remplacements `systemPrompt` Discord par canal s’appliquent aux tours de transcription vocale pour ce canal vocal.
- Les tours de transcription vocale déduisent le statut propriétaire depuis `allowFrom` Discord (ou `dm.allowFrom`) pour les commandes protégées par propriétaire et les actions de canal. La visibilité des outils de l’agent suit la politique d’outils configurée pour la session routée.
- La voix Discord est facultative pour les configurations texte seul ; définissez `channels.discord.voice.enabled=true` (ou conservez un bloc `channels.discord.voice` existant) pour activer les commandes `/vc`, l’exécution vocale et l’intention Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` peut remplacer explicitement l’abonnement à l’intention d’état vocal. Laissez-le non défini pour que l’intention suive l’activation vocale effective.
- Si `voice.autoJoin` comporte plusieurs entrées pour le même serveur, OpenClaw rejoint le dernier canal configuré pour ce serveur.
- `voice.allowedChannels` est une allowlist de résidence facultative. Laissez-la non définie pour autoriser `/vc join` dans n’importe quel canal vocal Discord autorisé. Lorsqu’elle est définie, `/vc join`, la jonction automatique au démarrage et les déplacements d’état vocal du bot sont limités aux entrées `{ guildId, channelId }` listées. Définissez-la sur un tableau vide pour refuser toutes les jonctions vocales Discord. Si Discord déplace le bot hors de l’allowlist, OpenClaw quitte ce canal et rejoint à nouveau la cible d’auto-join configurée lorsqu’elle est disponible.
- `voice.daveEncryption` et `voice.decryptionFailureTolerance` sont transmis aux options de jonction `@discordjs/voice`.
- Les valeurs par défaut de `@discordjs/voice` sont `daveEncryption=true` et `decryptionFailureTolerance=24` si elles ne sont pas définies.
- OpenClaw utilise le codec groupé `libopus-wasm` pour la réception vocale Discord et la lecture PCM brute en temps réel. Il fournit une build WebAssembly libopus épinglée et ne nécessite pas d’extensions opus natives.
- `voice.connectTimeoutMs` contrôle l’attente initiale Ready de `@discordjs/voice` pour `/vc join` et les tentatives d’auto-join. Valeur par défaut : `30000`.
- `voice.reconnectGraceMs` contrôle combien de temps OpenClaw attend qu’une session vocale déconnectée commence à se reconnecter avant de la détruire. Valeur par défaut : `15000`.
- En mode `stt-tts`, la lecture vocale ne s’arrête pas simplement parce qu’un autre utilisateur commence à parler. Pour éviter les boucles de retour audio, OpenClaw ignore les nouvelles captures vocales pendant la lecture TTS ; parlez après la fin de la lecture pour le tour suivant. Les modes en temps réel transmettent les débuts de parole comme signaux d’interruption au fournisseur en temps réel.
- Dans les modes en temps réel, l’écho des haut-parleurs dans un micro ouvert peut ressembler à une interruption et couper la lecture. Pour les salons Discord avec beaucoup d’écho, définissez `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` pour empêcher OpenAI d’interrompre automatiquement sur l’audio d’entrée. Ajoutez `voice.realtime.bargeIn: true` si vous voulez toujours que les événements de début de parole Discord interrompent la lecture active. Le pont en temps réel OpenAI ignore les troncatures de lecture plus courtes que `voice.realtime.minBargeInAudioEndMs`, les considérant comme un écho/bruit probable, et les journalise comme ignorées au lieu d’effacer la lecture Discord.
- `voice.captureSilenceGraceMs` contrôle combien de temps OpenClaw attend après que Discord signale qu’un locuteur s’est arrêté avant de finaliser ce segment audio pour STT. Valeur par défaut : `2000` ; augmentez-la si Discord découpe les pauses normales en transcriptions partielles hachées.
- Lorsque ElevenLabs est le fournisseur TTS sélectionné, la lecture vocale Discord utilise le TTS en streaming et commence à partir du flux de réponse du fournisseur. Les fournisseurs sans prise en charge du streaming se replient sur le chemin de fichier temporaire synthétisé.
- OpenClaw surveille aussi les échecs de déchiffrement en réception et se rétablit automatiquement en quittant puis rejoignant le canal vocal après des échecs répétés sur une courte fenêtre.
- Si les journaux de réception affichent à répétition `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` après une mise à jour, collectez un rapport de dépendances et les journaux. La ligne `@discordjs/voice` groupée inclut le correctif de remplissage amont de la PR discord.js #11449, qui a clos l’issue discord.js #11419.
- Les événements de réception `The operation was aborted` sont attendus quand OpenClaw finalise un segment de locuteur capturé ; ce sont des diagnostics détaillés, pas des avertissements.
- Les journaux vocaux Discord détaillés incluent un aperçu borné sur une ligne de la transcription STT pour chaque segment de locuteur accepté, afin que le débogage montre à la fois le côté utilisateur et le côté réponse de l’agent sans vider un texte de transcription non borné.
- En mode `agent-proxy`, le repli de consultation forcée ignore les fragments de transcription probablement incomplets, comme le texte se terminant par `...` ou un connecteur final comme `et`, ainsi que les clôtures manifestement non actionnables comme « je reviens tout de suite » ou « au revoir ». Les journaux affichent `forced agent consult skipped reason=...` lorsque cela empêche une réponse obsolète en file d’attente.

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
- `followUsersEnabled` vaut par défaut `true` lorsque `followUsers` est configuré. Définissez-le sur `false` pour conserver la liste enregistrée tout en arrêtant le suivi vocal automatique.
- Lorsqu’un utilisateur suivi rejoint un canal vocal autorisé, OpenClaw rejoint ce canal. Lorsque l’utilisateur se déplace, OpenClaw se déplace avec lui. Lorsque l’utilisateur suivi actif se déconnecte, OpenClaw quitte le canal.
- Si plusieurs utilisateurs suivis se trouvent dans le même serveur et que l’utilisateur suivi actif part, OpenClaw se déplace vers le canal d’un autre utilisateur suivi avant de quitter le serveur. Si plusieurs utilisateurs suivis se déplacent en même temps, le dernier événement d’état vocal observé l’emporte.
- `allowedChannels` s’applique toujours. Un utilisateur suivi dans un canal interdit est ignoré, et une session appartenant au suivi se déplace vers un autre utilisateur suivi ou se termine.
- OpenClaw réconcilie les événements d’état vocal manqués au démarrage et à intervalle borné. La réconciliation échantillonne les serveurs configurés et limite les recherches REST par exécution ; les très grandes listes `followUsers` peuvent donc nécessiter plus d’un intervalle pour converger.
- Si Discord ou un administrateur déplace le bot pendant qu’il suit un utilisateur, OpenClaw reconstruit la session vocale et conserve la propriété du suivi lorsque la destination est autorisée. Si le bot est déplacé hors de `allowedChannels`, OpenClaw quitte le canal et rejoint à nouveau la cible configurée lorsqu’il en existe une.
- La récupération de réception DAVE peut quitter puis rejoindre le même canal après des échecs de déchiffrement répétés. Les sessions appartenant au suivi conservent leur propriété de suivi via ce chemin de récupération, de sorte qu’une déconnexion ultérieure de l’utilisateur suivi quitte toujours le canal.

Choisissez entre les modes de jonction :

- Utilisez `followUsers` pour les configurations personnelles ou opérateur où le bot doit être automatiquement en vocal lorsque vous y êtes.
- Utilisez `autoJoin` pour les bots de salle fixe qui doivent être présents même lorsqu’aucun utilisateur suivi n’est en vocal.
- Utilisez `/vc join` pour les jonctions ponctuelles ou les salons où une présence vocale automatique serait surprenante.

Codec vocal Discord :

- Les journaux de réception vocale affichent `discord voice: opus decoder: libopus-wasm`.
- La lecture en temps réel encode le PCM stéréo brut à 48 kHz en Opus avec le même package `libopus-wasm` intégré avant de transmettre les paquets à `@discordjs/voice`.
- La lecture de fichiers et de flux de fournisseur transcode en PCM stéréo brut à 48 kHz avec ffmpeg, puis utilise `libopus-wasm` pour le flux de paquets Opus envoyé à Discord.

Pipeline STT plus TTS :

- La capture PCM Discord est convertie en fichier temporaire WAV.
- `tools.media.audio` gère le STT, par exemple `openai/gpt-4o-mini-transcribe`.
- La transcription est envoyée via l’entrée et le routage Discord pendant que le LLM de réponse s’exécute avec une politique de sortie vocale qui masque l’outil `tts` de l’agent et demande du texte renvoyé, car la voix Discord possède la lecture TTS finale.
- `voice.model`, lorsqu’il est défini, remplace uniquement le LLM de réponse pour ce tour de canal vocal.
- `voice.tts` est fusionné par-dessus `messages.tts` ; les fournisseurs capables de streaming alimentent directement le lecteur, sinon le fichier audio résultant est lu dans le canal rejoint.

Exemple de session de canal vocal `agent-proxy` par défaut :

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

Exemple `bidi` en temps réel :

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

Voix comme extension d’une session de canal Discord existante :

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

En mode `agent-proxy`, le bot rejoint le canal vocal configuré, mais les tours de l’agent OpenClaw utilisent la session routée normale et l’agent du canal cible. La session vocale en temps réel prononce le résultat renvoyé dans le canal vocal. L’agent superviseur peut toujours utiliser les outils de message normaux selon sa politique d’outils, y compris envoyer un message Discord distinct si c’est l’action appropriée.

Pendant qu’une exécution OpenClaw déléguée est active, les nouvelles transcriptions vocales Discord sont traitées comme du contrôle d’exécution en direct avant de démarrer un autre tour d’agent. Des expressions telles que « statut », « annule ça », « utilise le correctif plus petit » ou « quand tu as terminé, vérifie aussi les tests » sont classées comme entrée de statut, d’annulation, d’orientation ou de suivi pour la session active. Les résultats de statut, d’annulation, d’orientation acceptée et de suivi sont prononcés dans le canal vocal afin que l’appelant sache si OpenClaw a traité la demande.

Formes de cible utiles :

- `target: "channel:123456789012345678"` route via une session de canal textuel Discord.
- `target: "123456789012345678"` est traité comme une cible de canal.
- `target: "dm:123456789012345678"` ou `target: "user:123456789012345678"` route via cette session de message direct.

Exemple OpenAI Realtime avec fort écho :

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

Utilisez ceci lorsque le modèle entend sa propre lecture Discord via un micro ouvert, mais que vous voulez tout de même l’interrompre en parlant. OpenClaw empêche OpenAI de s’interrompre automatiquement sur l’audio d’entrée brut, tandis que `bargeIn: true` permet aux événements de début de locuteur Discord et à l’audio de locuteur déjà actif d’annuler les réponses en temps réel actives avant que le prochain tour capturé n’atteigne OpenAI. Les signaux d’interruption très précoces avec `audioEndMs` inférieur à `minBargeInAudioEndMs` sont considérés comme de l’écho ou du bruit probable et ignorés afin que le modèle ne s’interrompe pas dès la première trame de lecture.

Journaux vocaux attendus :

- À la jonction : `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Au démarrage du temps réel : `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Sur l’audio du locuteur : `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`, et `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Sur la parole obsolète ignorée : `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` ou `reason=non-actionable-closing ...`
- À l’achèvement de la réponse en temps réel : `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- À l’arrêt ou la réinitialisation de la lecture : `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Lors d’une consultation en temps réel : `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Sur la réponse de l’agent : `discord voice: agent turn answer ...`
- Sur la parole exacte mise en file d’attente : `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, suivi de `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Lors de la détection d’interruption : `discord voice: realtime barge-in detected source=speaker-start ...` ou `discord voice: realtime barge-in detected source=active-speaker-audio ...`, suivi de `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Lors de l’interruption en temps réel : `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, suivi soit de `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...`, soit de `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Sur l’écho ou le bruit ignoré : `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Lorsque l’interruption est désactivée : `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Sur une lecture inactive : `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Pour déboguer un audio coupé, lisez les journaux vocaux en temps réel comme une chronologie :

1. `realtime audio playback started` signifie que Discord a commencé à lire l’audio de l’assistant. Le bridge commence à compter les segments de sortie de l’assistant, les octets PCM Discord, les octets en temps réel du fournisseur et la durée audio synthétisée à partir de ce point.
2. `realtime speaker turn opened` marque l’activation d’un locuteur Discord. Si la lecture est déjà active et que `bargeIn` est activé, cela peut être suivi de `barge-in detected source=speaker-start`.
3. `realtime input audio started` marque la première trame audio réelle reçue pour ce tour de locuteur. `outputActive=true` ou un `outputAudioMs` non nul ici signifie que le micro envoie de l’entrée pendant que la lecture de l’assistant est encore active.
4. `barge-in detected source=active-speaker-audio` signifie qu’OpenClaw a vu de l’audio de locuteur en direct pendant que la lecture de l’assistant était active. C’est utile pour distinguer une véritable interruption d’un événement de début de locuteur Discord sans audio utile.
5. `barge-in requested reason=...` signifie qu’OpenClaw a demandé au fournisseur en temps réel d’annuler ou de tronquer la réponse active. Il inclut `outputAudioMs`, `outputActive` et `playbackChunks` afin que vous puissiez voir quelle quantité d’audio de l’assistant avait réellement été lue avant l’interruption.
6. `realtime audio playback stopped reason=...` est le point de réinitialisation de la lecture Discord locale. La raison indique qui a arrêté la lecture : `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` ou `session-close`.
7. `realtime speaker turn closed` résume le tour d’entrée capturé. `chunks=0` ou `hasAudio=false` signifie que le tour de locuteur s’est ouvert, mais qu’aucun audio utilisable n’a atteint le bridge en temps réel. `interruptedPlayback=true` signifie que ce tour d’entrée a chevauché la sortie de l’assistant et déclenché la logique d’interruption.

Champs utiles :

- `outputAudioMs` : durée de l’audio de l’assistant généré par le fournisseur en temps réel avant la ligne de journal.
- `audioMs` : durée de l’audio de l’assistant qu’OpenClaw a comptée avant l’arrêt de la lecture.
- `elapsedMs` : temps horloge murale entre l’ouverture et la fermeture du flux de lecture ou du tour de locuteur.
- `discordBytes` : octets PCM stéréo à 48 kHz envoyés à la voix Discord ou reçus de celle-ci.
- `realtimeBytes` : octets PCM au format du fournisseur envoyés au fournisseur en temps réel ou reçus de celui-ci.
- `playbackChunks` : segments audio de l’assistant transmis à Discord pour la réponse active.
- `sinceLastAudioMs` : intervalle entre la dernière trame audio de locuteur capturée et la fermeture du tour de locuteur.

Modèles courants :

- Une coupure immédiate avec `source=active-speaker-audio`, un petit `outputAudioMs` et le même utilisateur à proximité indique généralement que l’écho du haut-parleur entre dans le micro. Augmentez `voice.realtime.minBargeInAudioEndMs`, baissez le volume du haut-parleur, utilisez un casque ou définissez `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` suivi de `speaker turn closed ... hasAudio=false` signifie que Discord a signalé un début de locuteur, mais qu’aucun audio n’a atteint OpenClaw. Cela peut être un événement vocal Discord transitoire, un comportement de noise gate ou un client activant brièvement le micro.
- `audio playback stopped reason=stream-close` sans interruption proche ni `provider-clear-audio` signifie que le flux de lecture Discord local s’est terminé de façon inattendue. Vérifiez les journaux précédents du fournisseur et du lecteur Discord.
- `capture ignored during playback (barge-in disabled)` signifie qu’OpenClaw a intentionnellement supprimé l’entrée pendant que l’audio de l’assistant était actif. Activez `voice.realtime.bargeIn` si vous voulez que la parole interrompe la lecture.
- `barge-in ignored ... outputActive=false` signifie que Discord ou le VAD du fournisseur a signalé de la parole, mais qu’OpenClaw n’avait aucune lecture active à interrompre. Cela ne devrait pas couper l’audio.

Les identifiants sont résolus par composant : auth de route LLM pour `voice.model`, auth STT pour `tools.media.audio`, auth TTS pour `messages.tts`/`voice.tts`, et auth du fournisseur en temps réel pour `voice.realtime.providers` ou la configuration d’auth normale du fournisseur.

### Messages vocaux

Les messages vocaux Discord affichent un aperçu de forme d’onde et nécessitent de l’audio OGG/Opus. OpenClaw génère automatiquement la forme d’onde, mais a besoin de `ffmpeg` et `ffprobe` sur l’hôte du Gateway pour inspecter et convertir.

- Fournissez un **chemin de fichier local** (les URL sont rejetées).
- Omettez le contenu textuel (Discord rejette le texte + le message vocal dans la même charge utile).
- Tout format audio est accepté ; OpenClaw convertit en OGG/Opus si nécessaire.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Dépannage

<AccordionGroup>
  <Accordion title="Intents non autorisées utilisées ou le bot ne voit aucun message de serveur">

    - activez Message Content Intent
    - activez Server Members Intent lorsque vous dépendez de la résolution des utilisateurs/membres
    - redémarrez le gateway après avoir modifié les intents

  </Accordion>

  <Accordion title="Messages de serveur bloqués de manière inattendue">

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

  <Accordion title="Mention requise définie sur false mais toujours bloquée">
    Causes courantes :

    - `groupPolicy="allowlist"` sans liste d’autorisation de serveur/canal correspondante
    - `requireMention` configuré au mauvais endroit (doit se trouver sous `channels.discord.guilds` ou dans l’entrée du canal)
    - expéditeur bloqué par la liste d’autorisation `users` du serveur/canal

  </Accordion>

  <Accordion title="Tours Discord longs ou réponses en double">

    Journaux typiques :

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Paramètres de file d’attente du Gateway Discord :

    - compte unique : `channels.discord.eventQueue.listenerTimeout`
    - multicompte : `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - cela contrôle uniquement le travail de l’écouteur du Gateway Discord, pas la durée de vie du tour de l’agent

    Discord n’applique pas de délai d’expiration propre au canal aux tours d’agent en file d’attente. Les écouteurs de messages transmettent immédiatement, et les exécutions Discord en file d’attente préservent l’ordre par session jusqu’à ce que le cycle de vie session/outil/runtime termine ou abandonne le travail.

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
    OpenClaw récupère les métadonnées Discord `/gateway/bot` avant la connexion. Les défaillances transitoires se replient sur l’URL de Gateway par défaut de Discord et sont limitées en fréquence dans les journaux.

    Paramètres de délai d’expiration des métadonnées :

    - compte unique : `channels.discord.gatewayInfoTimeoutMs`
    - multicompte : `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - repli sur la variable d’environnement lorsque la configuration n’est pas définie : `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - valeur par défaut : `30000` (30 secondes), maximum : `120000`

  </Accordion>

  <Accordion title="Redémarrages dus au délai d’expiration READY du Gateway">
    OpenClaw attend l’événement `READY` du Gateway Discord pendant le démarrage et après les reconnexions du runtime. Les configurations multicompte avec étalement du démarrage peuvent nécessiter une fenêtre READY au démarrage plus longue que la valeur par défaut.

    Paramètres de délai d’expiration READY :

    - démarrage compte unique : `channels.discord.gatewayReadyTimeoutMs`
    - démarrage multicompte : `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - repli sur la variable d’environnement au démarrage lorsque la configuration n’est pas définie : `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - valeur par défaut au démarrage : `15000` (15 secondes), maximum : `120000`
    - runtime compte unique : `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime multicompte : `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - repli sur la variable d’environnement du runtime lorsque la configuration n’est pas définie : `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - valeur par défaut du runtime : `30000` (30 secondes), maximum : `120000`

  </Accordion>

  <Accordion title="Incohérences de l’audit des autorisations">
    Les vérifications d’autorisations de `channels status --probe` ne fonctionnent que pour les ID de canal numériques.

    Si vous utilisez des clés slug, la correspondance à l’exécution peut encore fonctionner, mais la sonde ne peut pas vérifier complètement les autorisations.

  </Accordion>

  <Accordion title="Problèmes de DM et d’appairage">

    - DM désactivé : `channels.discord.dm.enabled=false`
    - Politique de DM désactivée : `channels.discord.dmPolicy="disabled"` (hérité : `channels.discord.dm.policy`)
    - en attente d’approbation d’appairage en mode `pairing`

  </Accordion>

  <Accordion title="Boucles bot à bot">
    Par défaut, les messages rédigés par des bots sont ignorés.

    Si vous définissez `channels.discord.allowBots=true`, utilisez des règles strictes de mention et de liste d’autorisation pour éviter les comportements de boucle.
    Préférez `channels.discord.allowBots="mentions"` pour n’accepter que les messages de bots qui mentionnent le bot.

    OpenClaw fournit aussi une [protection contre les boucles de bots](/fr/channels/bot-loop-protection) partagée. Chaque fois que `allowBots` laisse des messages rédigés par des bots atteindre la distribution, Discord associe l’événement entrant aux faits `(account, channel, bot pair)` et le garde de paire générique supprime la paire après qu’elle dépasse le budget d’événements configuré. Le garde empêche les boucles incontrôlées entre deux bots qui devaient auparavant être arrêtées par les limites de débit de Discord ; il n’affecte pas les déploiements à bot unique ni les réponses ponctuelles de bots qui restent sous le budget.

    Paramètres par défaut (actifs lorsque `allowBots` est défini) :

    - `maxEventsPerWindow: 20` -- la paire de bots peut échanger 20 messages dans la fenêtre glissante
    - `windowSeconds: 60` -- durée de la fenêtre glissante
    - `cooldownSeconds: 60` -- une fois le budget dépassé, chaque message bot à bot supplémentaire dans l’un ou l’autre sens est abandonné pendant une minute

    Configurez une seule fois la valeur par défaut partagée sous `channels.defaults.botLoopProtection`, puis remplacez-la pour Discord lorsqu’un workflow légitime a besoin de plus de marge. L’ordre de priorité est :

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

  <Accordion title="La STT vocale échoue avec DecryptionFailed(...)">

    - gardez OpenClaw à jour (`openclaw update`) afin que la logique de récupération de réception vocale Discord soit présente
    - confirmez que `channels.discord.voice.daveEncryption=true` (valeur par défaut)
    - partez de `channels.discord.voice.decryptionFailureTolerance=24` (valeur par défaut amont) et ajustez uniquement si nécessaire
    - surveillez les journaux pour :
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - si les échecs continuent après la reconnexion automatique, collectez les journaux et comparez-les à l’historique de réception DAVE amont dans [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) et [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Référence de configuration

Référence principale : [Référence de configuration - Discord](/fr/gateway/config-channels#discord).

<Accordion title="Champs Discord à signal fort">

- démarrage/authentification : `enabled`, `token`, `accounts.*`, `allowBots`
- politique : `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- commande : `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- file d’événements : `eventQueue.listenerTimeout` (budget de l’écouteur), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway : `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- réponse/historique : `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- livraison : `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming : `streaming` (alias hérité : `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- média/nouvelle tentative : `mediaMaxMb` (plafonne les téléversements Discord sortants, valeur par défaut `100MB`), `retry`
- actions : `actions.*`
- présence : `activity`, `status`, `activityType`, `activityUrl`
- UI : `ui.components.accentColor`
- fonctionnalités : `threadBindings`, `bindings[]` de premier niveau (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Sécurité et opérations

- Traitez les jetons de bot comme des secrets (`DISCORD_BOT_TOKEN` est préférable dans les environnements supervisés).
- Accordez les autorisations Discord les moins privilégiées.
- Si le déploiement ou l’état des commandes est obsolète, redémarrez le Gateway et revérifiez avec `openclaw channels status --probe`.

## Connexe

<CardGroup cols={2}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    Appairer un utilisateur Discord au Gateway.
  </Card>
  <Card title="Groupes" icon="users" href="/fr/channels/groups">
    Comportement du chat de groupe et de la liste d’autorisation.
  </Card>
  <Card title="Routage des canaux" icon="route" href="/fr/channels/channel-routing">
    Acheminer les messages entrants vers les agents.
  </Card>
  <Card title="Sécurité" icon="shield" href="/fr/gateway/security">
    Modèle de menace et durcissement.
  </Card>
  <Card title="Routage multi-agent" icon="sitemap" href="/fr/concepts/multi-agent">
    Associer les guildes et les canaux aux agents.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/fr/tools/slash-commands">
    Comportement des commandes natives.
  </Card>
</CardGroup>
