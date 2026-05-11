---
read_when:
    - Travail sur les fonctionnalités du canal Discord
summary: État de prise en charge, capacités et configuration du bot Discord
title: Discord
x-i18n:
    generated_at: "2026-05-11T20:20:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70107cf53c44f80e42f99f670aacf6eed8b77d839c05bccc853cd91a7273e5aa
    source_path: channels/discord.md
    workflow: 16
---

Prêt pour les DM et les canaux de guilde via le Gateway Discord officiel.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/fr/channels/pairing">
    Les DM Discord utilisent le mode d’appairage par défaut.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/fr/tools/slash-commands">
    Comportement natif des commandes et catalogue des commandes.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics et flux de réparation inter-canaux.
  </Card>
</CardGroup>

## Configuration rapide

Vous devrez créer une nouvelle application avec un bot, ajouter le bot à votre serveur et l’appairer à OpenClaw. Nous vous recommandons d’ajouter votre bot à votre propre serveur privé. Si vous n’en avez pas encore, [créez-en un d’abord](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (choisissez **Create My Own > For me and my friends**).

<Steps>
  <Step title="Create a Discord application and bot">
    Accédez au [portail développeur Discord](https://discord.com/developers/applications) et cliquez sur **New Application**. Donnez-lui un nom comme « OpenClaw ».

    Cliquez sur **Bot** dans la barre latérale. Définissez le **Username** sur le nom que vous donnez à votre agent OpenClaw.

  </Step>

  <Step title="Enable privileged intents">
    Toujours sur la page **Bot**, faites défiler jusqu’à **Privileged Gateway Intents** et activez :

    - **Message Content Intent** (obligatoire)
    - **Server Members Intent** (recommandé ; obligatoire pour les listes d’autorisation de rôles et la correspondance nom-vers-ID)
    - **Presence Intent** (facultatif ; nécessaire uniquement pour les mises à jour de présence)

  </Step>

  <Step title="Copy your bot token">
    Remontez sur la page **Bot** et cliquez sur **Reset Token**.

    <Note>
    Malgré son nom, cette action génère votre premier token — rien n’est « réinitialisé ».
    </Note>

    Copiez le token et enregistrez-le quelque part. Il s’agit de votre **Bot Token** et vous en aurez besoin sous peu.

  </Step>

  <Step title="Generate an invite URL and add the bot to your server">
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

    Il s’agit de l’ensemble de base pour les canaux de texte normaux. Si vous prévoyez de publier dans des fils Discord, y compris des workflows de canaux de forum ou de médias qui créent ou poursuivent un fil, activez également **Send Messages in Threads**.
    Copiez l’URL générée en bas, collez-la dans votre navigateur, sélectionnez votre serveur, puis cliquez sur **Continue** pour vous connecter. Vous devriez maintenant voir votre bot dans le serveur Discord.

  </Step>

  <Step title="Enable Developer Mode and collect your IDs">
    De retour dans l’application Discord, vous devez activer le mode développeur afin de pouvoir copier les ID internes.

    1. Cliquez sur **User Settings** (icône d’engrenage à côté de votre avatar) → **Advanced** → activez **Developer Mode**
    2. Faites un clic droit sur l’**icône de votre serveur** dans la barre latérale → **Copy Server ID**
    3. Faites un clic droit sur votre **propre avatar** → **Copy User ID**

    Enregistrez votre **Server ID** et votre **User ID** avec votre Bot Token — vous enverrez les trois à OpenClaw à l’étape suivante.

  </Step>

  <Step title="Allow DMs from server members">
    Pour que l’appairage fonctionne, Discord doit autoriser votre bot à vous envoyer un DM. Faites un clic droit sur l’**icône de votre serveur** → **Privacy Settings** → activez **Direct Messages**.

    Cela permet aux membres du serveur (y compris les bots) de vous envoyer des DM. Gardez cette option activée si vous souhaitez utiliser les DM Discord avec OpenClaw. Si vous prévoyez uniquement d’utiliser les canaux de guilde, vous pouvez désactiver les DM après l’appairage.

  </Step>

  <Step title="Set your bot token securely (do not send it in chat)">
    Votre token de bot Discord est un secret (comme un mot de passe). Définissez-le sur la machine qui exécute OpenClaw avant d’envoyer un message à votre agent.

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
    Pour les installations de services gérés, exécutez `openclaw gateway install` depuis un shell où `DISCORD_BOT_TOKEN` est présent, ou stockez la variable dans `~/.openclaw/.env`, afin que le service puisse résoudre le SecretRef d’environnement après le redémarrage.
    Si votre hôte est bloqué ou limité par le lookup d’application au démarrage de Discord, définissez l’ID d’application/client Discord depuis le portail développeur afin que le démarrage puisse ignorer cet appel REST. Utilisez `channels.discord.applicationId` pour le compte par défaut, ou `channels.discord.accounts.<accountId>.applicationId` lorsque vous exécutez plusieurs bots Discord.

  </Step>

  <Step title="Configure OpenClaw and pair">

    <Tabs>
      <Tab title="Ask your agent">
        Discutez avec votre agent OpenClaw sur n’importe quel canal existant (par exemple Telegram) et indiquez-le-lui. Si Discord est votre premier canal, utilisez plutôt l’onglet CLI / config.

        > « J’ai déjà défini mon token de bot Discord dans la config. Veuillez terminer la configuration Discord avec l’User ID `<user_id>` et le Server ID `<server_id>`. »
      </Tab>
      <Tab title="CLI / config">
        Si vous préférez une config basée sur des fichiers, définissez :

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

        Pour une configuration scriptée ou distante, écrivez le même bloc JSON5 avec `openclaw config patch --file ./discord.patch.json5 --dry-run`, puis réexécutez sans `--dry-run`. Les valeurs `token` en texte brut sont prises en charge. Les valeurs SecretRef sont également prises en charge pour `channels.discord.token` sur les fournisseurs env/file/exec. Voir [Gestion des secrets](/fr/gateway/secrets).

        Pour plusieurs bots Discord, conservez chaque token de bot et ID d’application sous son compte. Un `channels.discord.applicationId` de premier niveau est hérité par les comptes, donc ne le définissez à cet endroit que lorsque chaque compte doit utiliser le même ID d’application.

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

  <Step title="Approve first DM pairing">
    Attendez que le gateway soit en cours d’exécution, puis envoyez un DM à votre bot dans Discord. Il répondra avec un code d’appairage.

    <Tabs>
      <Tab title="Ask your agent">
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

    Vous devriez maintenant pouvoir discuter avec votre agent dans Discord via DM.

  </Step>
</Steps>

<Note>
La résolution des tokens tient compte des comptes. Les valeurs de token de config l’emportent sur le repli d’environnement. `DISCORD_BOT_TOKEN` est uniquement utilisé pour le compte par défaut.
Si deux comptes Discord activés se résolvent vers le même token de bot, OpenClaw ne démarre qu’un seul moniteur de gateway pour ce token. Un token issu de la config l’emporte sur le repli d’environnement par défaut ; sinon, le premier compte activé l’emporte et le compte dupliqué est signalé comme désactivé.
Pour les appels sortants avancés (outil de message/actions de canal), un `token` explicite par appel est utilisé pour cet appel. Cela s’applique aux actions d’envoi et de lecture/sondage (par exemple lecture/recherche/récupération/fil/épingles/autorisations). Les paramètres de politique/réessai du compte proviennent toujours du compte sélectionné dans l’instantané d’exécution actif.
</Note>

## Recommandé : configurer un espace de travail de guilde

Une fois les DM fonctionnels, vous pouvez configurer votre serveur Discord comme un espace de travail complet où chaque canal obtient sa propre session d’agent avec son propre contexte. C’est recommandé pour les serveurs privés où il n’y a que vous et votre bot.

<Steps>
  <Step title="Add your server to the guild allowlist">
    Cela permet à votre agent de répondre dans n’importe quel canal de votre serveur, pas seulement dans les DM.

    <Tabs>
      <Tab title="Ask your agent">
        > « Ajoute mon Server ID Discord `<server_id>` à la liste d’autorisation de guilde »
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

  <Step title="Allow responses without @mention">
    Par défaut, votre agent ne répond dans les canaux de guilde que lorsqu’il est @mentionné. Pour un serveur privé, vous voudrez probablement qu’il réponde à chaque message.

    Dans les canaux de guilde, les réponses finales normales de l’assistant restent privées par défaut. La sortie Discord visible doit être envoyée explicitement avec l’outil `message`, afin que l’agent puisse observer par défaut et ne publier que lorsqu’il décide qu’une réponse dans le canal est utile.

    Cela signifie que le modèle sélectionné doit appeler les outils de manière fiable. Si Discord affiche la saisie en cours et que les journaux indiquent une utilisation de tokens mais qu’aucun message n’est publié, vérifiez dans le journal de session la présence de texte d’assistant avec `didSendViaMessagingTool: false`. Cela signifie que le modèle a produit une réponse finale privée au lieu d’appeler `message(action=send)`. Passez à un modèle plus performant pour l’appel d’outils, ou utilisez la config ci-dessous pour restaurer les réponses finales automatiques héritées.

    <Tabs>
      <Tab title="Ask your agent">
        > « Autorise mon agent à répondre sur ce serveur sans devoir être @mentionné »
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

        Pour restaurer les réponses finales automatiques héritées pour les salles de groupe/canal, définissez `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Plan for memory in guild channels">
    Par défaut, la mémoire à long terme (MEMORY.md) ne se charge que dans les sessions DM. Les canaux de guilde ne chargent pas automatiquement MEMORY.md.

    <Tabs>
      <Tab title="Ask your agent">
        > « Lorsque je pose des questions dans des canaux Discord, utilise memory_search ou memory_get si tu as besoin du contexte à long terme de MEMORY.md. »
      </Tab>
      <Tab title="Manual">
        Si vous avez besoin d’un contexte partagé dans chaque canal, placez les instructions stables dans `AGENTS.md` ou `USER.md` (elles sont injectées pour chaque session). Conservez les notes à long terme dans `MEMORY.md` et accédez-y à la demande avec les outils de mémoire.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Créez maintenant quelques canaux sur votre serveur Discord et commencez à discuter. Votre agent peut voir le nom du canal, et chaque canal obtient sa propre session isolée — vous pouvez donc configurer `#coding`, `#home`, `#research`, ou tout autre canal adapté à votre workflow.

## Modèle d’exécution

- Le Gateway possède la connexion Discord.
- Le routage des réponses est déterministe : les réponses entrantes Discord repartent vers Discord.
- Les métadonnées de guilde/canal Discord sont ajoutées au prompt du modèle comme
  contexte non fiable, et non comme préfixe de réponse visible par l'utilisateur. Si un modèle recopie cette enveloppe,
  OpenClaw retire les métadonnées copiées des réponses sortantes et du
  futur contexte de relecture.
- Par défaut (`session.dmScope=main`), les chats directs partagent la session principale de l'agent (`agent:main:main`).
- Les canaux de guilde sont des clés de session isolées (`agent:<agentId>:discord:channel:<channelId>`).
- Les DM de groupe sont ignorés par défaut (`channels.discord.dm.groupEnabled=false`).
- Les commandes slash natives s'exécutent dans des sessions de commande isolées (`agent:<agentId>:discord:slash:<userId>`), tout en portant encore `CommandTargetSessionKey` vers la session de conversation routée.
- La livraison des annonces cron/heartbeat textuelles vers Discord utilise une seule fois la
  réponse finale visible par l'assistant. Les médias et les charges utiles de composants structurés restent
  en plusieurs messages lorsque l'agent émet plusieurs charges utiles livrables.

## Canaux de forum

Les canaux de forum et de médias Discord n'acceptent que les publications de fil. OpenClaw prend en charge deux façons de les créer :

- Envoyez un message au parent du forum (`channel:<forumId>`) pour créer automatiquement un fil. Le titre du fil utilise la première ligne non vide de votre message.
- Utilisez `openclaw message thread create` pour créer un fil directement. Ne transmettez pas `--message-id` pour les canaux de forum.

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

Les parents de forum n'acceptent pas les composants Discord. Si vous avez besoin de composants, envoyez au fil lui-même (`channel:<threadId>`).

## Composants interactifs

OpenClaw prend en charge les conteneurs de composants Discord v2 pour les messages d'agent. Utilisez l'outil de message avec une charge utile `components`. Les résultats d'interaction sont routés vers l'agent comme des messages entrants normaux et suivent les paramètres Discord `replyToMode` existants.

Blocs pris en charge :

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Les lignes d'actions autorisent jusqu'à 5 boutons ou un seul menu de sélection
- Types de sélection : `string`, `user`, `role`, `mentionable`, `channel`

Par défaut, les composants sont à usage unique. Définissez `components.reusable=true` pour permettre aux boutons, sélections et formulaires d'être utilisés plusieurs fois jusqu'à leur expiration.

Pour restreindre qui peut cliquer sur un bouton, définissez `allowedUsers` sur ce bouton (ID utilisateur Discord, tags ou `*`). Lorsque c'est configuré, les utilisateurs non correspondants reçoivent un refus éphémère.

Les commandes slash `/model` et `/models` ouvrent un sélecteur de modèle interactif avec des menus déroulants de fournisseur, modèle et runtime compatible, plus une étape Soumettre. `/models add` est obsolète et renvoie désormais un message d'obsolescence au lieu d'enregistrer des modèles depuis le chat. La réponse du sélecteur est éphémère et seul l'utilisateur qui l'a invoquée peut l'utiliser. Les menus de sélection Discord sont limités à 25 options ; ajoutez donc des entrées `provider/*` à `agents.defaults.models` lorsque vous voulez que le sélecteur affiche les modèles découverts dynamiquement uniquement pour des fournisseurs sélectionnés comme `openai-codex` ou `vllm`.

Pièces jointes de fichier :

- Les blocs `file` doivent pointer vers une référence de pièce jointe (`attachment://<filename>`)
- Fournissez la pièce jointe via `media`/`path`/`filePath` (fichier unique) ; utilisez `media-gallery` pour plusieurs fichiers
- Utilisez `filename` pour remplacer le nom de téléversement lorsqu'il doit correspondre à la référence de pièce jointe

Formulaires modaux :

- Ajoutez `components.modal` avec jusqu'à 5 champs
- Types de champs : `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
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

## Contrôle d'accès et routage

<Tabs>
  <Tab title="DM policy">
    `channels.discord.dmPolicy` contrôle l'accès aux DM. `channels.discord.allowFrom` est la liste d'autorisation canonique des DM.

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `channels.discord.allowFrom` inclue `"*"`)
    - `disabled`

    Si la politique de DM n'est pas ouverte, les utilisateurs inconnus sont bloqués (ou invités à effectuer l'appariement en mode `pairing`).

    Priorité multi-comptes :

    - `channels.discord.accounts.default.allowFrom` s'applique uniquement au compte `default`.
    - Pour un compte, `allowFrom` prévaut sur l'ancien `dm.allowFrom`.
    - Les comptes nommés héritent de `channels.discord.allowFrom` lorsque leur propre `allowFrom` et l'ancien `dm.allowFrom` ne sont pas définis.
    - Les comptes nommés n'héritent pas de `channels.discord.accounts.default.allowFrom`.

    Les anciens `channels.discord.dm.policy` et `channels.discord.dm.allowFrom` sont encore lus pour compatibilité. `openclaw doctor --fix` les migre vers `dmPolicy` et `allowFrom` lorsqu'il peut le faire sans modifier l'accès.

    Format de cible DM pour la livraison :

    - `user:<id>`
    - mention `<@id>`

    Les ID numériques nus se résolvent normalement comme des ID de canal lorsqu'un canal par défaut est actif, mais les ID listés dans le `allowFrom` DM effectif du compte sont traités comme des cibles de DM utilisateur pour compatibilité.

  </Tab>

  <Tab title="Access groups">
    Les DM Discord et l'autorisation des commandes textuelles peuvent utiliser des entrées dynamiques `accessGroup:<name>` dans `channels.discord.allowFrom`.

    Les noms de groupes d'accès sont partagés entre les canaux de messages. Utilisez `type: "message.senders"` pour un groupe statique dont les membres sont exprimés dans la syntaxe `allowFrom` normale de chaque canal, ou `type: "discord.channelAudience"` lorsque l'audience `ViewChannel` actuelle d'un canal Discord doit définir dynamiquement l'appartenance. Le comportement partagé des groupes d'accès est documenté ici : [Groupes d'accès](/fr/channels/access-groups).

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

    Un canal textuel Discord n'a pas de liste de membres séparée. `type: "discord.channelAudience"` modélise l'appartenance ainsi : l'expéditeur du DM est membre de la guilde configurée et dispose actuellement de l'autorisation effective `ViewChannel` sur le canal configuré après application des rôles et des remplacements de canal.

    Exemple : autoriser toute personne qui peut voir `#maintainers` à envoyer un DM au bot, tout en gardant les DM fermés à tous les autres.

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

    Les recherches échouent en mode fermé. Si Discord renvoie `Missing Access`, si la recherche de membre échoue ou si le canal appartient à une autre guilde, l'expéditeur du DM est traité comme non autorisé.

    Activez le **Server Members Intent** du portail développeur Discord pour le bot lorsque vous utilisez des groupes d'accès basés sur l'audience de canal. Les DM n'incluent pas l'état de membre de guilde ; OpenClaw résout donc le membre via Discord REST au moment de l'autorisation.

  </Tab>

  <Tab title="Guild policy">
    La gestion des guildes est contrôlée par `channels.discord.groupPolicy` :

    - `open`
    - `allowlist`
    - `disabled`

    La base sécurisée lorsque `channels.discord` existe est `allowlist`.

    Comportement de `allowlist` :

    - la guilde doit correspondre à `channels.discord.guilds` (`id` préféré, slug accepté)
    - listes d'autorisation facultatives d'expéditeur : `users` (ID stables recommandés) et `roles` (ID de rôle uniquement) ; si l'un ou l'autre est configuré, les expéditeurs sont autorisés lorsqu'ils correspondent à `users` OU `roles`
    - la correspondance directe par nom/tag est désactivée par défaut ; activez `channels.discord.dangerouslyAllowNameMatching: true` uniquement comme mode de compatibilité de dernier recours
    - les noms/tags sont pris en charge pour `users`, mais les ID sont plus sûrs ; `openclaw security audit` avertit lorsque des entrées nom/tag sont utilisées
    - si une guilde a `channels` configuré, les canaux non listés sont refusés
    - si une guilde n'a pas de bloc `channels`, tous les canaux de cette guilde dans la liste d'autorisation sont autorisés

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

    Si vous définissez uniquement `DISCORD_BOT_TOKEN` sans créer de bloc `channels.discord`, le repli d'exécution est `groupPolicy="allowlist"` (avec un avertissement dans les journaux), même si `channels.defaults.groupPolicy` vaut `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Les messages de guilde sont soumis par défaut à une barrière de mention.

    La détection de mention inclut :

    - la mention explicite du bot
    - les motifs de mention configurés (`agents.list[].groupChat.mentionPatterns`, repli `messages.groupChat.mentionPatterns`)
    - le comportement implicite de réponse au bot dans les cas pris en charge

    Lors de l'écriture de messages Discord sortants, utilisez la syntaxe de mention canonique : `<@USER_ID>` pour les utilisateurs, `<#CHANNEL_ID>` pour les canaux et `<@&ROLE_ID>` pour les rôles. N'utilisez pas l'ancien formulaire de mention de surnom `<@!USER_ID>`.

    `requireMention` est configuré par guilde/canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` ignore facultativement les messages qui mentionnent un autre utilisateur/rôle mais pas le bot (hors @everyone/@here).

    DM de groupe :

    - par défaut : ignorés (`dm.groupEnabled=false`)
    - liste d'autorisation facultative via `dm.groupChannels` (ID de canal ou slugs)

  </Tab>
</Tabs>

### Routage d'agent basé sur les rôles

Utilisez `bindings[].match.roles` pour router les membres de guilde Discord vers différents agents par ID de rôle. Les liaisons basées sur les rôles acceptent uniquement les ID de rôle et sont évaluées après les liaisons pair ou pair parent, et avant les liaisons limitées à la guilde. Si une liaison définit aussi d'autres champs de correspondance (par exemple `peer` + `guildId` + `roles`), tous les champs configurés doivent correspondre.

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

- `commands.native` vaut par défaut `"auto"` et est activé pour Discord.
- Remplacement par canal : `channels.discord.commands.native`.
- `commands.native=false` ignore l’enregistrement et le nettoyage des commandes slash Discord au démarrage. Les commandes précédemment enregistrées peuvent rester visibles dans Discord jusqu’à ce que vous les supprimiez de l’application Discord.
- L’authentification des commandes natives utilise les mêmes listes d’autorisation/politiques Discord que le traitement normal des messages.
- Les commandes peuvent toujours être visibles dans l’interface Discord pour les utilisateurs qui ne sont pas autorisés ; l’exécution applique toujours l’authentification OpenClaw et renvoie « non autorisé ».

Voir [Commandes slash](/fr/tools/slash-commands) pour le catalogue des commandes et leur comportement.

Paramètres par défaut des commandes slash :

- `ephemeral: true`

## Détails de la fonctionnalité

<AccordionGroup>
  <Accordion title="Étiquettes de réponse et réponses natives">
    Discord prend en charge les étiquettes de réponse dans la sortie de l’agent :

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Contrôlé par `channels.discord.replyToMode` :

    - `off` (par défaut)
    - `first`
    - `all`
    - `batched`

    Remarque : `off` désactive le fil de réponses implicite. Les étiquettes explicites `[[reply_to_*]]` sont toujours respectées.
    `first` attache toujours la référence de réponse native implicite au premier message Discord sortant du tour.
    `batched` attache uniquement la référence de réponse native implicite de Discord lorsque le
    tour entrant était un lot temporisé de plusieurs messages. C’est utile
    lorsque vous souhaitez des réponses natives surtout pour les discussions en rafale ambiguës, pas pour chaque
    tour à message unique.

    Les ID de message sont exposés dans le contexte/l’historique afin que les agents puissent cibler des messages spécifiques.

  </Accordion>

  <Accordion title="Aperçu de flux en direct">
    OpenClaw peut diffuser des brouillons de réponses en envoyant un message temporaire et en le modifiant à mesure que le texte arrive. `channels.discord.streaming` accepte `off` | `partial` | `block` | `progress` (par défaut). `progress` conserve un brouillon d’état modifiable et le met à jour avec la progression des outils jusqu’à la livraison finale ; le libellé de démarrage partagé est une ligne défilante, il disparaît donc comme le reste dès qu’assez de travail apparaît. `streamMode` est un alias d’exécution historique. Exécutez `openclaw doctor --fix` pour réécrire la configuration persistée vers la clé canonique.

    Définissez `channels.discord.streaming.mode` sur `off` pour désactiver les modifications d’aperçu Discord. Si la diffusion par blocs Discord est explicitement activée, OpenClaw ignore le flux d’aperçu afin d’éviter une double diffusion.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          toolProgress: true,
        },
      },
    },
  },
}
```

    - `partial` modifie un seul message d’aperçu à mesure que les jetons arrivent.
    - `block` émet des fragments de la taille d’un brouillon (utilisez `draftChunk` pour ajuster la taille et les points de rupture, limités par `textChunkLimit`).
    - Les finales avec média, erreur ou réponse explicite annulent les modifications d’aperçu en attente.
    - `streaming.preview.toolProgress` (par défaut `true`) contrôle si les mises à jour d’outil/progression réutilisent le message d’aperçu.
    - Les lignes d’outil/progression s’affichent sous forme compacte avec emoji + titre + détail lorsque disponible, par exemple `🛠️ Bash: run tests` ou `🔎 Web Search: for "query"`.
    - `streaming.preview.commandText` / `streaming.progress.commandText` contrôle le détail des commandes/exécutions dans les lignes de progression compactes : `raw` (par défaut) ou `status` (libellé d’outil uniquement).

    Masquer le texte brut des commandes/exécutions tout en conservant les lignes de progression compactes :

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

    La diffusion d’aperçu est uniquement textuelle ; les réponses avec média reviennent à la livraison normale. Lorsque la diffusion `block` est explicitement activée, OpenClaw ignore le flux d’aperçu afin d’éviter une double diffusion.

  </Accordion>

  <Accordion title="Historique, contexte et comportement des fils">
    Contexte de l’historique de serveur :

    - `channels.discord.historyLimit` valeur par défaut `20`
    - solution de repli : `messages.groupChat.historyLimit`
    - `0` désactive

    Contrôles de l’historique des messages privés :

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportement des fils :

    - Les fils Discord sont routés comme des sessions de canal et héritent de la configuration du canal parent, sauf remplacement.
    - Les sessions de fil héritent de la sélection `/model` au niveau de la session du canal parent comme repli limité au modèle ; les sélections `/model` locales au fil restent prioritaires et l’historique de transcription parent n’est pas copié sauf si l’héritage de transcription est activé.
    - `channels.discord.thread.inheritParent` (par défaut `false`) fait en sorte que les nouveaux fils automatiques soient initialisés depuis la transcription parente. Les remplacements par compte se trouvent sous `channels.discord.accounts.<id>.thread.inheritParent`.
    - Les réactions de l’outil de messages peuvent résoudre les cibles de message privé `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` est préservé pendant le repli d’activation à l’étape de réponse.

    Les sujets de canal sont injectés comme contexte **non fiable**. Les listes d’autorisation contrôlent qui peut déclencher l’agent, pas une limite complète de rédaction du contexte supplémentaire.

  </Accordion>

  <Accordion title="Sessions liées à un fil pour les sous-agents">
    Discord peut lier un fil à une cible de session afin que les messages de suivi dans ce fil continuent d’être routés vers la même session (y compris les sessions de sous-agent).

    Commandes :

    - `/focus <target>` lier le fil actuel/nouveau à une cible de sous-agent/session
    - `/unfocus` supprimer la liaison du fil actuel
    - `/agents` afficher les exécutions actives et l’état de liaison
    - `/session idle <duration|off>` inspecter/mettre à jour le désengagement automatique pour inactivité des liaisons focalisées
    - `/session max-age <duration|off>` inspecter/mettre à jour l’âge maximal strict des liaisons focalisées

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

    - `session.threadBindings.*` définit les valeurs par défaut globales.
    - `channels.discord.threadBindings.*` remplace le comportement de Discord.
    - `spawnSessions` contrôle la création/liaison automatique de fils pour `sessions_spawn({ thread: true })` et les créations de fil ACP. Valeur par défaut : `true`.
    - `defaultSpawnContext` contrôle le contexte natif de sous-agent pour les créations liées à un fil. Valeur par défaut : `"fork"`.
    - Les clés obsolètes `spawnSubagentSessions`/`spawnAcpSessions` sont migrées par `openclaw doctor --fix`.
    - Si les liaisons de fil sont désactivées pour un compte, `/focus` et les opérations de liaison de fil associées ne sont pas disponibles.

    Voir [Sous-agents](/fr/tools/subagents), [Agents ACP](/fr/tools/acp-agents) et [Référence de configuration](/fr/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Liaisons persistantes de canal ACP">
    Pour des espaces de travail ACP stables et « toujours actifs », configurez des liaisons ACP typées de niveau supérieur ciblant des conversations Discord.

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

    - `/acp spawn codex --bind here` lie le canal ou le fil actuel sur place et conserve les futurs messages sur la même session ACP. Les messages de fil héritent de la liaison du canal parent.
    - Dans un canal ou un fil lié, `/new` et `/reset` réinitialisent la même session ACP sur place. Les liaisons de fil temporaires peuvent remplacer la résolution de cible tant qu’elles sont actives.
    - `spawnSessions` contrôle la création/liaison de fils enfants via `--thread auto|here`.

    Voir [Agents ACP](/fr/tools/acp-agents) pour les détails du comportement de liaison.

  </Accordion>

  <Accordion title="Notifications de réaction">
    Mode de notification des réactions par serveur :

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
    - repli vers l’emoji d’identité de l’agent (`agents.list[].identity.emoji`, sinon "👀")

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
    Acheminez le trafic WebSocket de Gateway Discord et les recherches REST au démarrage (ID d’application + résolution de liste d’autorisation) via un proxy HTTP(S) avec `channels.discord.proxy`.

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
    Activez la résolution PluralKit pour associer les messages relayés à l’identité de membre du système :

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

    Remarques :

    - les listes d’autorisation peuvent utiliser `pk:<memberId>`
    - les noms d’affichage des membres sont mis en correspondance par nom/slug uniquement lorsque `channels.discord.dangerouslyAllowNameMatching: true`
    - les recherches utilisent l’ID de message d’origine et sont limitées par une fenêtre temporelle
    - si la recherche échoue, les messages relayés sont traités comme des messages de bot et supprimés, sauf si `allowBots=true`

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
    Les mises à jour de présence sont appliquées lorsque vous définissez un champ d’état ou d’activité, ou lorsque vous activez la présence automatique.

    Exemple d’état uniquement :

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

    Correspondance des types d’activité :

    - 0: Joue
    - 1: Diffuse en streaming (nécessite `activityUrl`)
    - 2: Écoute
    - 3: Regarde
    - 4: Personnalisé (utilise le texte d’activité comme état de statut ; l’emoji est facultatif)
    - 5: Participe à une compétition

    Exemple de présence automatique (signal de santé de l’environnement d’exécution) :

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

    La présence automatique associe la disponibilité de l’environnement d’exécution au statut Discord : sain => en ligne, dégradé ou inconnu => inactif, épuisé ou indisponible => ne pas déranger. Remplacements de texte facultatifs :

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (prend en charge l’espace réservé `{reason}`)

  </Accordion>

  <Accordion title="Approbations dans Discord">
    Discord prend en charge la gestion des approbations par boutons dans les messages privés et peut éventuellement publier les invites d’approbation dans le canal d’origine.

    Chemin de configuration :

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (facultatif ; se rabat sur `commands.ownerAllowFrom` lorsque c’est possible)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, valeur par défaut : `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord active automatiquement les approbations d’exécution natives lorsque `enabled` n’est pas défini ou vaut `"auto"` et qu’au moins un approbateur peut être résolu, soit depuis `execApprovals.approvers`, soit depuis `commands.ownerAllowFrom`. Discord ne déduit pas les approbateurs d’exécution à partir de `allowFrom` du canal, de l’ancien `dm.allowFrom` ni de `defaultTo` des messages directs. Définissez `enabled: false` pour désactiver explicitement Discord comme client d’approbation natif.

    Pour les commandes de groupe sensibles réservées au propriétaire, telles que `/diagnostics` et `/export-trajectory`, OpenClaw envoie les invites d’approbation et les résultats finaux en privé. Il essaie d’abord le message privé Discord lorsque le propriétaire appelant dispose d’une route de propriétaire Discord ; si elle n’est pas disponible, il se rabat sur la première route de propriétaire disponible depuis `commands.ownerAllowFrom`, comme Telegram.

    Lorsque `target` vaut `channel` ou `both`, l’invite d’approbation est visible dans le canal. Seuls les approbateurs résolus peuvent utiliser les boutons ; les autres utilisateurs reçoivent un refus éphémère. Les invites d’approbation incluent le texte de la commande ; n’activez donc la livraison dans le canal que dans des canaux de confiance. Si l’ID du canal ne peut pas être déduit de la clé de session, OpenClaw se rabat sur la livraison par message privé.

    Discord affiche également les boutons d’approbation partagés utilisés par les autres canaux de discussion. L’adaptateur Discord natif ajoute principalement le routage des messages privés aux approbateurs et la diffusion vers les canaux.
    Lorsque ces boutons sont présents, ils constituent l’UX d’approbation principale ; OpenClaw
    ne doit inclure une commande `/approve` manuelle que lorsque le résultat de l’outil indique
    que les approbations par discussion sont indisponibles ou que l’approbation manuelle est la seule voie possible.
    Si le runtime d’approbation natif de Discord n’est pas actif, OpenClaw garde visible
    l’invite déterministe locale `/approve <id> <decision>`. Si le
    runtime est actif mais qu’une carte native ne peut être livrée à aucune cible,
    OpenClaw envoie dans la même discussion un avis de repli avec la commande `/approve`
    exacte de l’approbation en attente.

    L’authentification Gateway et la résolution des approbations suivent le contrat partagé du client Gateway (les ID `plugin:` se résolvent via `plugin.approval.resolve` ; les autres ID via `exec.approval.resolve`). Les approbations expirent par défaut après 30 minutes.

    Voir [Approbations d’exécution](/fr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Outils et barrières d’action

Les actions de message Discord incluent la messagerie, l’administration de canal, la modération, la présence et les actions de métadonnées.

Exemples de base :

- messagerie : `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- réactions : `react`, `reactions`, `emojiList`
- modération : `timeout`, `kick`, `ban`
- présence : `setPresence`

L’action `event-create` accepte un paramètre facultatif `image` (URL ou chemin de fichier local) pour définir l’image de couverture de l’événement planifié.

Les barrières d’action se trouvent sous `channels.discord.actions.*`.

Comportement par défaut des barrières :

| Groupe d’actions                                                                                                                                                         | Valeur par défaut |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- |
| réactions, messages, fils, épingles, sondages, recherche, memberInfo, roleInfo, channelInfo, channels, voiceStatus, événements, stickers, emojiUploads, stickerUploads, permissions | activé            |
| rôles                                                                                                                                                                    | désactivé         |
| modération                                                                                                                                                               | désactivé         |
| présence                                                                                                                                                                 | désactivé         |

## Interface utilisateur Components v2

OpenClaw utilise les composants Discord v2 pour les approbations d’exécution et les marqueurs intercontextes. Les actions de message Discord peuvent aussi accepter `components` pour une interface utilisateur personnalisée (avancé ; nécessite de construire une charge utile de composant via l’outil discord), tandis que les anciens `embeds` restent disponibles mais ne sont pas recommandés.

- `channels.discord.ui.components.accentColor` définit la couleur d’accentuation utilisée par les conteneurs de composants Discord (hexadécimal).
- À définir par compte avec `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` est ignoré lorsque les composants v2 sont présents.

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

1. Activez Message Content Intent dans le portail développeur Discord.
2. Activez Server Members Intent lorsque des listes d’autorisation par rôle/utilisateur sont utilisées.
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

Pour inspecter les autorisations effectives du bot avant de le rejoindre, exécutez :

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
        model: "openai-codex/gpt-5.5",
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
          voice: "cedar",
        },
      },
    },
  },
}
```

Notes :

- `voice.tts` remplace `messages.tts` uniquement pour la lecture vocale `stt-tts`. Les modes temps réel utilisent `voice.realtime.voice`.
- `voice.mode` contrôle le chemin de conversation. La valeur par défaut est `agent-proxy` : une interface vocale temps réel gère le minutage des tours, l’interruption et la lecture, délègue le travail de fond à l’agent OpenClaw routé via `openclaw_agent_consult`, puis traite le résultat comme une invite Discord saisie par ce locuteur. `stt-tts` conserve l’ancien flux STT par lots plus TTS. `bidi` permet au modèle temps réel de converser directement tout en exposant `openclaw_agent_consult` pour le cerveau OpenClaw.
- `voice.agentSession` contrôle quelle conversation OpenClaw reçoit les tours vocaux. Laissez-le non défini pour utiliser la session propre au canal vocal, ou définissez `{ mode: "target", target: "channel:<text-channel-id>" }` pour que le canal vocal agisse comme l’extension microphone/haut-parleur d’une session de canal texte Discord existante, comme `#maintainers`.
- `voice.model` remplace le cerveau de l’agent OpenClaw pour les réponses vocales Discord et les consultations temps réel. Laissez-le non défini pour hériter du modèle d’agent routé. Il est distinct de `voice.realtime.model`.
- `agent-proxy` achemine la parole via `discord-voice`, ce qui préserve l’autorisation normale propriétaire/outil pour le locuteur et la session cible, mais masque l’outil agent `tts` parce que la voix Discord possède la lecture. Par défaut, `agent-proxy` accorde à la consultation un accès complet aux outils équivalent au propriétaire pour les locuteurs propriétaires (`voice.realtime.toolPolicy: "owner"`) et privilégie fortement la consultation de l’agent OpenClaw avant les réponses substantielles (`voice.realtime.consultPolicy: "always"`). Dans ce mode `always` par défaut, la couche temps réel ne prononce pas automatiquement de remplissage avant la réponse de consultation ; elle capture et transcrit la parole, puis prononce la réponse OpenClaw routée. Si plusieurs réponses de consultation forcée se terminent alors que Discord lit encore la première réponse, les réponses ultérieures en parole exacte sont mises en file d’attente jusqu’à ce que la lecture soit inactive au lieu de remplacer la parole en milieu de phrase.
- En mode `stt-tts`, STT utilise `tools.media.audio` ; `voice.model` n’affecte pas la transcription.
- En modes temps réel, `voice.realtime.provider`, `voice.realtime.model` et `voice.realtime.voice` configurent la session audio temps réel. Pour OpenAI Realtime 2 plus le cerveau Codex, utilisez `voice.realtime.model: "gpt-realtime-2"` et `voice.model: "openai-codex/gpt-5.5"`.
- Le fournisseur temps réel OpenAI accepte les noms d’événements Realtime 2 actuels et les alias hérités compatibles avec Codex pour les événements d’audio de sortie et de transcription, afin que les instantanés de fournisseur compatibles puissent dériver sans perdre l’audio assistant.
- `voice.realtime.bargeIn` contrôle si les événements Discord de début de parole interrompent la lecture temps réel active. Si non défini, il suit le paramètre d’interruption audio d’entrée du fournisseur temps réel.
- `voice.realtime.minBargeInAudioEndMs` contrôle la durée minimale de lecture de l’assistant avant qu’une interruption temps réel OpenAI tronque l’audio. Par défaut : `250`. Définissez `0` pour une interruption immédiate dans les salons avec peu d’écho, ou augmentez-la pour les configurations de haut-parleurs très sujettes à l’écho.
- Pour une voix OpenAI lors de la lecture Discord, définissez `voice.tts.provider: "openai"` et choisissez une voix Text-to-speech sous `voice.tts.openai.voice` ou `voice.tts.providers.openai.voice`. `cedar` est un bon choix à sonorité masculine sur le modèle TTS OpenAI actuel.
- Les remplacements Discord `systemPrompt` par canal s’appliquent aux tours de transcription vocale pour ce canal vocal.
- Les tours de transcription vocale déduisent le statut propriétaire depuis Discord `allowFrom` (ou `dm.allowFrom`) ; les locuteurs non propriétaires ne peuvent pas accéder aux outils réservés aux propriétaires (par exemple `gateway` et `cron`).
- La voix Discord est optionnelle pour les configurations uniquement textuelles ; définissez `channels.discord.voice.enabled=true` (ou conservez un bloc `channels.discord.voice` existant) pour activer les commandes `/vc`, le runtime vocal et l’intention Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` peut remplacer explicitement l’abonnement à l’intention d’état vocal. Laissez-le non défini pour que l’intention suive l’activation vocale effective.
- Si `voice.autoJoin` contient plusieurs entrées pour la même guilde, OpenClaw rejoint le dernier canal configuré pour cette guilde.
- `voice.allowedChannels` est une liste d’autorisation de résidence facultative. Laissez-la non définie pour autoriser `/vc join` dans n’importe quel canal vocal Discord autorisé. Lorsqu’elle est définie, `/vc join`, la jonction automatique au démarrage et les déplacements d’état vocal du bot sont limités aux entrées `{ guildId, channelId }` listées. Définissez-la sur un tableau vide pour refuser toutes les jonctions vocales Discord. Si Discord déplace le bot en dehors de la liste d’autorisation, OpenClaw quitte ce canal et rejoint la cible d’auto-jonction configurée lorsqu’il en existe une.
- `voice.daveEncryption` et `voice.decryptionFailureTolerance` sont transmis aux options de jonction `@discordjs/voice`.
- Les valeurs par défaut de `@discordjs/voice` sont `daveEncryption=true` et `decryptionFailureTolerance=24` si elles ne sont pas définies.
- OpenClaw utilise par défaut le décodeur `opusscript` pur JS pour la réception vocale Discord. Le package natif facultatif `@discordjs/opus` est ignoré par la politique d’installation pnpm du dépôt, afin que les installations normales, les voies Docker et les tests sans rapport ne compilent pas d’addon natif. Les hôtes dédiés aux performances vocales peuvent l’activer avec `OPENCLAW_DISCORD_OPUS_DECODER=native` après avoir installé l’addon natif.
- `voice.connectTimeoutMs` contrôle l’attente initiale `@discordjs/voice` Ready pour les tentatives `/vc join` et d’auto-jonction. Par défaut : `30000`.
- `voice.reconnectGraceMs` contrôle combien de temps OpenClaw attend qu’une session vocale déconnectée commence à se reconnecter avant de la détruire. Par défaut : `15000`.
- En mode `stt-tts`, la lecture vocale ne s’arrête pas simplement parce qu’un autre utilisateur commence à parler. Pour éviter les boucles de rétroaction, OpenClaw ignore la nouvelle capture vocale pendant que TTS est en cours de lecture ; parlez après la fin de la lecture pour le tour suivant. Les modes temps réel transmettent les débuts de parole comme signaux d’interruption au fournisseur temps réel.
- En modes temps réel, l’écho des haut-parleurs dans un micro ouvert peut ressembler à une interruption et interrompre la lecture. Pour les salons Discord très sujets à l’écho, définissez `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` pour empêcher OpenAI d’interrompre automatiquement sur l’audio d’entrée. Ajoutez `voice.realtime.bargeIn: true` si vous voulez toujours que les événements Discord de début de parole interrompent la lecture active. Le pont temps réel OpenAI ignore les troncatures de lecture plus courtes que `voice.realtime.minBargeInAudioEndMs`, les considérant comme probablement dues à l’écho/au bruit, et les journalise comme ignorées au lieu d’effacer la lecture Discord.
- `voice.captureSilenceGraceMs` contrôle combien de temps OpenClaw attend après que Discord signale qu’un locuteur s’est arrêté avant de finaliser ce segment audio pour STT. Par défaut : `2500` ; augmentez cette valeur si Discord découpe les pauses normales en transcriptions partielles saccadées.
- Lorsque ElevenLabs est le fournisseur TTS sélectionné, la lecture vocale Discord utilise le TTS en streaming et démarre depuis le flux de réponse du fournisseur. Les fournisseurs sans prise en charge du streaming reviennent au chemin du fichier temporaire synthétisé.
- OpenClaw surveille également les échecs de déchiffrement de réception et récupère automatiquement en quittant/rejoignant le canal vocal après des échecs répétés dans une courte fenêtre.
- Si les journaux de réception affichent à répétition `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` après une mise à jour, collectez un rapport de dépendances et les journaux. La ligne `@discordjs/voice` groupée inclut le correctif amont de remplissage depuis la PR discord.js #11449, qui a fermé l’issue discord.js #11419.
- Les événements de réception `The operation was aborted` sont attendus lorsque OpenClaw finalise un segment de locuteur capturé ; ce sont des diagnostics détaillés, pas des avertissements.
- Les journaux vocaux Discord détaillés incluent un aperçu borné sur une ligne de la transcription STT pour chaque segment de locuteur accepté, afin que le débogage montre à la fois le côté utilisateur et le côté réponse de l’agent sans déverser de texte de transcription non borné.
- En mode `agent-proxy`, le repli de consultation forcée ignore les fragments de transcription probablement incomplets, comme le texte se terminant par `...` ou un connecteur final comme `and`, ainsi que les clôtures manifestement non actionnables comme « je reviens tout de suite » ou « au revoir ». Les journaux affichent `forced agent consult skipped reason=...` lorsque cela empêche une réponse mise en file d’attente obsolète.

Configuration opus native pour les extractions source :

```bash
pnpm install
mise exec node@22 -- pnpm discord:opus:install
```

Utilisez Node 22 pour le Gateway lorsque vous voulez l’addon natif précompilé macOS arm64 amont. Si vous utilisez un autre runtime Node, l’installateur optionnel peut nécessiter une chaîne d’outils locale de compilation depuis les sources `node-gyp`.

Après avoir installé l’addon natif, démarrez le Gateway avec :

```bash
OPENCLAW_DISCORD_OPUS_DECODER=native pnpm gateway:watch
```

Les journaux vocaux détaillés doivent afficher `discord voice: opus decoder: @discordjs/opus`. Sans l’activation par variable d’environnement, ou si l’addon natif est absent ou ne peut pas se charger sur l’hôte, OpenClaw journalise `discord voice: opus decoder: opusscript` et continue à recevoir la voix via le repli pur JS.

Pipeline STT plus TTS :

- La capture PCM Discord est convertie en fichier temporaire WAV.
- `tools.media.audio` gère STT, par exemple `openai/gpt-4o-mini-transcribe`.
- La transcription est envoyée via l’entrée et le routage Discord pendant que le LLM de réponse s’exécute avec une politique de sortie vocale qui masque l’outil agent `tts` et demande du texte retourné, parce que la voix Discord possède la lecture TTS finale.
- `voice.model`, lorsqu’il est défini, remplace uniquement le LLM de réponse pour ce tour de canal vocal.
- `voice.tts` est fusionné par-dessus `messages.tts` ; les fournisseurs compatibles avec le streaming alimentent directement le lecteur, sinon le fichier audio résultant est lu dans le canal rejoint.

Exemple de session de canal vocal agent-proxy par défaut :

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

Sans bloc `voice.agentSession`, chaque canal vocal obtient sa propre session OpenClaw routée. Par exemple, `/vc join channel:234567890123456789` parle à la session de ce canal vocal Discord. Le modèle temps réel n’est que l’interface vocale ; les demandes substantielles sont transmises à l’agent OpenClaw configuré. Si le modèle temps réel produit une transcription finale sans appeler l’outil de consultation, OpenClaw force la consultation comme repli afin que le comportement par défaut reste équivalent à parler à l’agent.

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
          openai: {
            model: "gpt-4o-mini-tts",
            voice: "cedar",
          },
        },
      },
    },
  },
}
```

Exemple bidi temps réel :

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
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
        model: "openai-codex/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

En mode `agent-proxy`, le bot rejoint le canal vocal configuré, mais les tours de l’agent OpenClaw utilisent la session et l’agent routés normaux du canal cible. La session vocale temps réel prononce le résultat retourné dans le canal vocal. L’agent superviseur peut toujours utiliser les outils de message normaux selon sa politique d’outils, y compris envoyer un message Discord distinct si c’est l’action appropriée.

Formes de cible utiles :

- `target: "channel:123456789012345678"` route via une session de canal texte Discord.
- `target: "123456789012345678"` est traité comme une cible de canal.
- `target: "dm:123456789012345678"` ou `target: "user:123456789012345678"` route via cette session de message direct.

Exemple OpenAI Realtime avec beaucoup d’écho :

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
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

Utilisez ceci lorsque le modèle entend sa propre lecture Discord via un micro ouvert, mais que vous voulez quand même l’interrompre en parlant. OpenClaw empêche OpenAI de s’interrompre automatiquement sur l’audio d’entrée brut, tandis que `bargeIn: true` permet aux événements de début de prise de parole Discord et à l’audio d’un locuteur déjà actif d’annuler les réponses realtime actives avant que le tour capturé suivant n’atteigne OpenAI. Les signaux d’interruption très précoces avec `audioEndMs` inférieur à `minBargeInAudioEndMs` sont traités comme de l’écho ou du bruit probable et ignorés afin que le modèle ne s’interrompe pas dès la première trame de lecture.

Journaux vocaux attendus :

- À la connexion : `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Au démarrage realtime : `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Sur l’audio du locuteur : `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`, et `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Sur la parole obsolète ignorée : `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` ou `reason=non-actionable-closing ...`
- À la fin de la réponse realtime : `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- À l’arrêt ou à la réinitialisation de la lecture : `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Lors de la consultation realtime : `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Sur la réponse de l’agent : `discord voice: agent turn answer ...`
- Sur la parole exacte mise en file d’attente : `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, suivi de `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Lors de la détection d’interruption : `discord voice: realtime barge-in detected source=speaker-start ...` ou `discord voice: realtime barge-in detected source=active-speaker-audio ...`, suivi de `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Lors de l’interruption realtime : `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, suivi soit de `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...`, soit de `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Sur l’écho ou le bruit ignoré : `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Lorsque l’interruption est désactivée : `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Sur la lecture inactive : `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Pour déboguer l’audio coupé, lisez les journaux vocaux realtime comme une chronologie :

1. `realtime audio playback started` signifie que Discord a commencé à lire l’audio de l’assistant. Le bridge commence à compter les fragments de sortie de l’assistant, les octets PCM Discord, les octets realtime du fournisseur et la durée audio synthétisée à partir de ce point.
2. `realtime speaker turn opened` marque l’activation d’un locuteur Discord. Si la lecture est déjà active et que `bargeIn` est activé, cela peut être suivi de `barge-in detected source=speaker-start`.
3. `realtime input audio started` marque la première trame audio réelle reçue pour ce tour de locuteur. `outputActive=true` ou un `outputAudioMs` non nul ici signifie que le micro envoie une entrée pendant que la lecture de l’assistant est encore active.
4. `barge-in detected source=active-speaker-audio` signifie qu’OpenClaw a détecté de l’audio de locuteur en direct pendant que la lecture de l’assistant était active. C’est utile pour distinguer une véritable interruption d’un événement de début de locuteur Discord sans audio utile.
5. `barge-in requested reason=...` signifie qu’OpenClaw a demandé au fournisseur realtime d’annuler ou de tronquer la réponse active. Il inclut `outputAudioMs`, `outputActive` et `playbackChunks` afin que vous puissiez voir quelle quantité d’audio de l’assistant avait réellement été lue avant l’interruption.
6. `realtime audio playback stopped reason=...` est le point local de réinitialisation de la lecture Discord. La raison indique qui a arrêté la lecture : `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` ou `session-close`.
7. `realtime speaker turn closed` résume le tour d’entrée capturé. `chunks=0` ou `hasAudio=false` signifie que le tour de locuteur s’est ouvert, mais qu’aucun audio exploitable n’a atteint le bridge realtime. `interruptedPlayback=true` signifie que ce tour d’entrée a chevauché la sortie de l’assistant et déclenché la logique d’interruption.

Champs utiles :

- `outputAudioMs` : durée audio de l’assistant générée par le fournisseur realtime avant la ligne de journal.
- `audioMs` : durée audio de l’assistant comptabilisée par OpenClaw avant l’arrêt de la lecture.
- `elapsedMs` : temps réel écoulé entre l’ouverture et la fermeture du flux de lecture ou du tour de locuteur.
- `discordBytes` : octets PCM stéréo 48 kHz envoyés à Discord voice ou reçus de celui-ci.
- `realtimeBytes` : octets PCM au format du fournisseur envoyés au fournisseur realtime ou reçus de celui-ci.
- `playbackChunks` : fragments audio de l’assistant transmis à Discord pour la réponse active.
- `sinceLastAudioMs` : intervalle entre la dernière trame audio de locuteur capturée et la fermeture du tour de locuteur.

Motifs courants :

- Une coupure immédiate avec `source=active-speaker-audio`, un petit `outputAudioMs` et le même utilisateur à proximité indique généralement que l’écho du haut-parleur entre dans le micro. Augmentez `voice.realtime.minBargeInAudioEndMs`, baissez le volume du haut-parleur, utilisez un casque ou définissez `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` suivi de `speaker turn closed ... hasAudio=false` signifie que Discord a signalé un début de prise de parole, mais qu’aucun audio n’a atteint OpenClaw. Il peut s’agir d’un événement vocal Discord transitoire, d’un comportement de noise gate ou d’un client qui active brièvement le micro.
- `audio playback stopped reason=stream-close` sans interruption proche ni `provider-clear-audio` signifie que le flux local de lecture Discord s’est terminé de manière inattendue. Vérifiez les journaux précédents du fournisseur et du lecteur Discord.
- `capture ignored during playback (barge-in disabled)` signifie qu’OpenClaw a volontairement ignoré l’entrée pendant que l’audio de l’assistant était actif. Activez `voice.realtime.bargeIn` si vous voulez que la parole interrompe la lecture.
- `barge-in ignored ... outputActive=false` signifie que Discord ou le VAD du fournisseur a signalé de la parole, mais qu’OpenClaw n’avait aucune lecture active à interrompre. Cela ne devrait pas couper l’audio.

Les identifiants sont résolus par composant : authentification de la route LLM pour `voice.model`, authentification STT pour `tools.media.audio`, authentification TTS pour `messages.tts`/`voice.tts`, et authentification du fournisseur realtime pour `voice.realtime.providers` ou la configuration d’authentification normale du fournisseur.

### Messages vocaux

Les messages vocaux Discord affichent un aperçu de forme d’onde et nécessitent de l’audio OGG/Opus. OpenClaw génère automatiquement la forme d’onde, mais a besoin de `ffmpeg` et `ffprobe` sur l’hôte du Gateway pour inspecter et convertir.

- Fournissez un **chemin de fichier local** (les URL sont rejetées).
- Omettez le contenu textuel (Discord rejette le texte + message vocal dans la même charge utile).
- Tous les formats audio sont acceptés ; OpenClaw convertit en OGG/Opus si nécessaire.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Dépannage

<AccordionGroup>
  <Accordion title="Intents non autorisés utilisés ou bot ne voyant aucun message de guilde">

    - activez Message Content Intent
    - activez Server Members Intent lorsque vous dépendez de la résolution utilisateur/membre
    - redémarrez le Gateway après avoir modifié les intents

  </Accordion>

  <Accordion title="Messages de guilde bloqués de façon inattendue">

    - vérifiez `groupPolicy`
    - vérifiez la liste d’autorisation de guilde sous `channels.discord.guilds`
    - si la map `channels` de guilde existe, seuls les canaux listés sont autorisés
    - vérifiez le comportement de `requireMention` et les motifs de mention

    Vérifications utiles :

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Mention requise à false mais toujours bloquée">
    Causes courantes :

    - `groupPolicy="allowlist"` sans liste d’autorisation de guilde/canal correspondante
    - `requireMention` configuré au mauvais endroit (doit se trouver sous `channels.discord.guilds` ou dans l’entrée du canal)
    - expéditeur bloqué par la liste d’autorisation `users` de guilde/canal

  </Accordion>

  <Accordion title="Tours Discord longs ou réponses dupliquées">

    Journaux typiques :

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Réglages de la file d’attente du Gateway Discord :

    - compte unique : `channels.discord.eventQueue.listenerTimeout`
    - multi-compte : `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - ceci contrôle uniquement le travail des écouteurs du Gateway Discord, pas la durée de vie du tour de l’agent

    Discord n’applique pas de délai d’expiration propre au canal aux tours d’agent mis en file d’attente. Les écouteurs de messages transmettent immédiatement, et les exécutions Discord mises en file d’attente préservent l’ordre par session jusqu’à ce que le cycle de vie de la session/de l’outil/du runtime se termine ou abandonne le travail.

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
    OpenClaw récupère les métadonnées Discord `/gateway/bot` avant de se connecter. Les échecs transitoires reviennent à l’URL de Gateway par défaut de Discord et sont limités en fréquence dans les journaux.

    Réglages du délai d’expiration des métadonnées :

    - compte unique : `channels.discord.gatewayInfoTimeoutMs`
    - multi-compte : `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - variable d’environnement de secours lorsque la configuration n’est pas définie : `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - valeur par défaut : `30000` (30 secondes), max : `120000`

  </Accordion>

  <Accordion title="Redémarrages dus au délai d’expiration READY du Gateway">
    OpenClaw attend l’événement `READY` du Gateway Discord au démarrage et après les reconnexions runtime. Les configurations multi-comptes avec étalement du démarrage peuvent nécessiter une fenêtre READY de démarrage plus longue que la valeur par défaut.

    Réglages du délai d’expiration READY :

    - démarrage compte unique : `channels.discord.gatewayReadyTimeoutMs`
    - démarrage multi-compte : `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - variable d’environnement de secours au démarrage lorsque la configuration n’est pas définie : `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - valeur par défaut au démarrage : `15000` (15 secondes), max : `120000`
    - runtime compte unique : `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime multi-compte : `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - variable d’environnement de secours au runtime lorsque la configuration n’est pas définie : `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - valeur par défaut au runtime : `30000` (30 secondes), max : `120000`

  </Accordion>

  <Accordion title="Incohérences dans l’audit des autorisations">
    Les vérifications d’autorisations `channels status --probe` ne fonctionnent que pour les identifiants numériques de canaux.

    Si vous utilisez des clés slug, la correspondance runtime peut toujours fonctionner, mais la sonde ne peut pas vérifier entièrement les autorisations.

  </Accordion>

  <Accordion title="Problèmes de DM et d’appairage">

    - DM désactivé : `channels.discord.dm.enabled=false`
    - politique DM désactivée : `channels.discord.dmPolicy="disabled"` (hérité : `channels.discord.dm.policy`)
    - attente de l’approbation d’appairage en mode `pairing`

  </Accordion>

  <Accordion title="Boucles de bot à bot">
    Par défaut, les messages rédigés par des bots sont ignorés.

    Si vous définissez `channels.discord.allowBots=true`, utilisez des règles strictes de mention et de liste d’autorisation pour éviter les comportements en boucle.
    Préférez `channels.discord.allowBots="mentions"` pour n’accepter que les messages de bots qui mentionnent le bot.

```json5
{
  channels: {
    discord: {
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write "@Mantis" and send a real Discord mention.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Les transcriptions vocales STT échouent avec DecryptionFailed(...)">

    - gardez OpenClaw à jour (`openclaw update`) afin que la logique de récupération de réception vocale Discord soit présente
    - confirmez que `channels.discord.voice.daveEncryption=true` (par défaut)
    - commencez avec `channels.discord.voice.decryptionFailureTolerance=24` (valeur par défaut en amont) et ajustez uniquement si nécessaire
    - surveillez les journaux pour :
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - si les échecs continuent après la reconnexion automatique, collectez les journaux et comparez-les à l’historique de réception DAVE en amont dans [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) et [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Référence de configuration

Référence principale : [Référence de configuration - Discord](/fr/gateway/config-channels#discord).

<Accordion title="Champs Discord à fort signal">

- démarrage/authentification : `enabled`, `token`, `accounts.*`, `allowBots`
- politique : `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- commande : `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- file d’événements : `eventQueue.listenerTimeout` (budget de l’écouteur), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway : `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- réponse/historique : `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- livraison : `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming : `streaming` (alias hérité : `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- média/nouvelle tentative : `mediaMaxMb` (plafonne les téléversements Discord sortants, valeur par défaut `100MB`), `retry`
- actions : `actions.*`
- présence : `activity`, `status`, `activityType`, `activityUrl`
- UI : `ui.components.accentColor`
- fonctionnalités : `threadBindings`, `bindings[]` de premier niveau (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Sécurité et opérations

- Traitez les jetons de bot comme des secrets (`DISCORD_BOT_TOKEN` est recommandé dans les environnements supervisés).
- Accordez les autorisations Discord avec le moindre privilège.
- Si le déploiement ou l’état des commandes est obsolète, redémarrez le gateway et revérifiez avec `openclaw channels status --probe`.

## Connexe

<CardGroup cols={2}>
  <Card title="Association" icon="link" href="/fr/channels/pairing">
    Associez un utilisateur Discord au gateway.
  </Card>
  <Card title="Groupes" icon="users" href="/fr/channels/groups">
    Comportement de discussion de groupe et de liste d’autorisation.
  </Card>
  <Card title="Routage des canaux" icon="route" href="/fr/channels/channel-routing">
    Acheminez les messages entrants vers les agents.
  </Card>
  <Card title="Sécurité" icon="shield" href="/fr/gateway/security">
    Modèle de menace et durcissement.
  </Card>
  <Card title="Routage multi-agent" icon="sitemap" href="/fr/concepts/multi-agent">
    Associez les guildes et les canaux aux agents.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/fr/tools/slash-commands">
    Comportement des commandes natives.
  </Card>
</CardGroup>
