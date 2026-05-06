---
read_when:
    - Travail sur les fonctionnalités du canal Discord
summary: État de la prise en charge du bot Discord, fonctionnalités et configuration
title: Discord
x-i18n:
    generated_at: "2026-05-06T17:52:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 11cc911dbc569db7a31ce4a16de167bc8ea771d1dd7842cb151f666f3cb9285b
    source_path: channels/discord.md
    workflow: 16
---

Prêt pour les MP et les canaux de guilde via le Gateway Discord officiel.

<CardGroup cols={3}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    Les MP Discord utilisent le mode d’appairage par défaut.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/fr/tools/slash-commands">
    Comportement des commandes natives et catalogue des commandes.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics intercanaux et flux de réparation.
  </Card>
</CardGroup>

## Configuration rapide

Vous devrez créer une nouvelle application avec un bot, ajouter le bot à votre serveur, puis l’appairer à OpenClaw. Nous vous recommandons d’ajouter votre bot à votre propre serveur privé. Si vous n’en avez pas encore, [créez-en un d’abord](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (choisissez **Create My Own > For me and my friends**).

<Steps>
  <Step title="Créer une application Discord et un bot">
    Accédez au [portail des développeurs Discord](https://discord.com/developers/applications) et cliquez sur **New Application**. Donnez-lui un nom comme « OpenClaw ».

    Cliquez sur **Bot** dans la barre latérale. Définissez **Username** sur le nom que vous donnez à votre agent OpenClaw.

  </Step>

  <Step title="Activer les intents privilégiés">
    Toujours sur la page **Bot**, faites défiler jusqu’à **Privileged Gateway Intents** et activez :

    - **Message Content Intent** (obligatoire)
    - **Server Members Intent** (recommandé ; obligatoire pour les listes d’autorisation de rôles et la correspondance nom-vers-ID)
    - **Presence Intent** (facultatif ; nécessaire uniquement pour les mises à jour de présence)

  </Step>

  <Step title="Copier le token de votre bot">
    Revenez en haut de la page **Bot** et cliquez sur **Reset Token**.

    <Note>
    Malgré son nom, cela génère votre premier token — rien n’est « réinitialisé ».
    </Note>

    Copiez le token et enregistrez-le quelque part. Il s’agit de votre **Bot Token** et vous en aurez besoin sous peu.

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

    Il s’agit de l’ensemble de base pour les canaux de texte normaux. Si vous prévoyez de publier dans des fils Discord, y compris des flux de canaux forum ou média qui créent ou poursuivent un fil, activez également **Send Messages in Threads**.
    Copiez l’URL générée en bas, collez-la dans votre navigateur, sélectionnez votre serveur, puis cliquez sur **Continue** pour vous connecter. Vous devriez maintenant voir votre bot dans le serveur Discord.

  </Step>

  <Step title="Activer le mode développeur et collecter vos ID">
    De retour dans l’application Discord, vous devez activer le mode développeur afin de pouvoir copier les ID internes.

    1. Cliquez sur **User Settings** (icône d’engrenage à côté de votre avatar) → **Advanced** → activez **Developer Mode**
    2. Faites un clic droit sur votre **icône de serveur** dans la barre latérale → **Copy Server ID**
    3. Faites un clic droit sur votre **propre avatar** → **Copy User ID**

    Enregistrez votre **Server ID** et votre **User ID** avec votre Bot Token — vous enverrez les trois à OpenClaw à l’étape suivante.

  </Step>

  <Step title="Autoriser les MP des membres du serveur">
    Pour que l’appairage fonctionne, Discord doit autoriser votre bot à vous envoyer des MP. Faites un clic droit sur votre **icône de serveur** → **Privacy Settings** → activez **Direct Messages**.

    Cela permet aux membres du serveur (y compris les bots) de vous envoyer des MP. Gardez cette option activée si vous souhaitez utiliser les MP Discord avec OpenClaw. Si vous prévoyez d’utiliser uniquement les canaux de guilde, vous pouvez désactiver les MP après l’appairage.

  </Step>

  <Step title="Définir le token de votre bot de façon sécurisée (ne l’envoyez pas dans le chat)">
    Le token de votre bot Discord est un secret (comme un mot de passe). Définissez-le sur la machine qui exécute OpenClaw avant d’envoyer un message à votre agent.

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
    Pour les installations de services gérés, exécutez `openclaw gateway install` depuis un shell où `DISCORD_BOT_TOKEN` est présent, ou stockez la variable dans `~/.openclaw/.env`, afin que le service puisse résoudre le SecretRef d’environnement après redémarrage.
    Si votre hôte est bloqué ou limité par Discord lors de la recherche d’application au démarrage, définissez l’ID d’application/client Discord depuis le portail des développeurs afin que le démarrage puisse ignorer cet appel REST. Utilisez `channels.discord.applicationId` pour le compte par défaut, ou `channels.discord.accounts.<accountId>.applicationId` lorsque vous exécutez plusieurs bots Discord.

  </Step>

  <Step title="Configurer OpenClaw et appairer">

    <Tabs>
      <Tab title="Demander à votre agent">
        Discutez avec votre agent OpenClaw sur n’importe quel canal existant (par exemple Telegram) et dites-le-lui. Si Discord est votre premier canal, utilisez plutôt l’onglet CLI / configuration.

        > « J’ai déjà défini le token de mon bot Discord dans la configuration. Veuillez terminer la configuration Discord avec l’ID utilisateur `<user_id>` et l’ID serveur `<server_id>`. »
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

        Pour une configuration scriptée ou distante, écrivez le même bloc JSON5 avec `openclaw config patch --file ./discord.patch.json5 --dry-run`, puis relancez sans `--dry-run`. Les valeurs `token` en texte brut sont prises en charge. Les valeurs SecretRef sont également prises en charge pour `channels.discord.token` avec les fournisseurs env/file/exec. Consultez [Gestion des secrets](/fr/gateway/secrets).

        Pour plusieurs bots Discord, conservez le token et l’ID d’application de chaque bot sous son compte. Un `channels.discord.applicationId` de premier niveau est hérité par les comptes ; définissez-le donc à cet endroit uniquement lorsque chaque compte doit utiliser le même ID d’application.

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

  <Step title="Approuver le premier appairage par MP">
    Attendez que le Gateway soit en cours d’exécution, puis envoyez un MP à votre bot dans Discord. Il répondra avec un code d’appairage.

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

    Les codes d’appairage expirent au bout de 1 heure.

    Vous devriez maintenant pouvoir discuter avec votre agent dans Discord via MP.

  </Step>
</Steps>

<Note>
La résolution du token tient compte du compte. Les valeurs de token de la configuration l’emportent sur le repli d’environnement. `DISCORD_BOT_TOKEN` n’est utilisé que pour le compte par défaut.
Si deux comptes Discord activés se résolvent vers le même token de bot, OpenClaw ne démarre qu’un seul moniteur Gateway pour ce token. Un token issu de la configuration l’emporte sur le repli d’environnement par défaut ; sinon, le premier compte activé l’emporte et le compte en double est signalé comme désactivé.
Pour les appels sortants avancés (outil de message/actions de canal), un `token` explicite par appel est utilisé pour cet appel. Cela s’applique aux actions d’envoi et de lecture/sonde (par exemple lecture/recherche/récupération/fil/épingles/autorisations). Les paramètres de stratégie de compte et de nouvelle tentative proviennent toujours du compte sélectionné dans l’instantané d’exécution actif.
</Note>

## Recommandé : configurer un espace de travail de guilde

Une fois les MP fonctionnels, vous pouvez configurer votre serveur Discord comme un espace de travail complet où chaque canal obtient sa propre session d’agent avec son propre contexte. C’est recommandé pour les serveurs privés où vous êtes seul avec votre bot.

<Steps>
  <Step title="Ajouter votre serveur à la liste d’autorisation de guilde">
    Cela permet à votre agent de répondre dans n’importe quel canal de votre serveur, pas seulement en MP.

    <Tabs>
      <Tab title="Demander à votre agent">
        > « Ajoute mon ID de serveur Discord `<server_id>` à la liste d’autorisation de guilde »
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
    Par défaut, votre agent ne répond dans les canaux de guilde que lorsqu’il est @mentionné. Pour un serveur privé, vous voudrez probablement qu’il réponde à chaque message.

    Dans les canaux de guilde, les réponses finales normales de l’assistant restent privées par défaut. La sortie Discord visible doit être envoyée explicitement avec l’outil `message`, afin que l’agent puisse observer par défaut et ne publier que lorsqu’il décide qu’une réponse dans le canal est utile.

    Cela signifie que le modèle sélectionné doit appeler les outils de façon fiable. Si Discord affiche la saisie en cours et que les journaux montrent une utilisation de tokens mais aucun message publié, vérifiez dans le journal de session la présence de texte d’assistant avec `didSendViaMessagingTool: false`. Cela signifie que le modèle a produit une réponse finale privée au lieu d’appeler `message(action=send)`. Passez à un modèle plus robuste pour l’appel d’outils, ou utilisez la configuration ci-dessous pour restaurer les anciennes réponses finales automatiques.

    <Tabs>
      <Tab title="Demander à votre agent">
        > « Autorise mon agent à répondre sur ce serveur sans devoir être @mentionné »
      </Tab>
      <Tab title="Configuration">
        Définissez `requireMention: false` dans votre configuration de guilde :

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

        Pour restaurer les anciennes réponses finales automatiques pour les salons de groupe/canal, définissez `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Prévoir la mémoire dans les canaux de guilde">
    Par défaut, la mémoire à long terme (MEMORY.md) ne se charge que dans les sessions MP. Les canaux de guilde ne chargent pas automatiquement MEMORY.md.

    <Tabs>
      <Tab title="Demander à votre agent">
        > « Lorsque je pose des questions dans les canaux Discord, utilise memory_search ou memory_get si tu as besoin du contexte à long terme de MEMORY.md. »
      </Tab>
      <Tab title="Manuel">
        Si vous avez besoin d’un contexte partagé dans chaque canal, placez les instructions stables dans `AGENTS.md` ou `USER.md` (elles sont injectées pour chaque session). Conservez les notes à long terme dans `MEMORY.md` et accédez-y à la demande avec les outils de mémoire.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Créez maintenant quelques canaux sur votre serveur Discord et commencez à discuter. Votre agent peut voir le nom du canal, et chaque canal obtient sa propre session isolée — vous pouvez donc configurer `#coding`, `#home`, `#research`, ou tout autre canal adapté à votre flux de travail.

## Modèle d’exécution

- Le Gateway possède la connexion Discord.
- Le routage des réponses est déterministe : les réponses entrantes Discord retournent vers Discord.
- Les métadonnées de guilde/canal Discord sont ajoutées au prompt du modèle comme
  contexte non fiable, pas comme préfixe de réponse visible par l’utilisateur. Si un modèle recopie cette enveloppe
  dans sa réponse, OpenClaw supprime les métadonnées copiées des réponses sortantes et du
  contexte de relecture futur.
- Par défaut (`session.dmScope=main`), les conversations directes partagent la session principale de l’agent (`agent:main:main`).
- Les canaux de guilde sont des clés de session isolées (`agent:<agentId>:discord:channel:<channelId>`).
- Les MP de groupe sont ignorés par défaut (`channels.discord.dm.groupEnabled=false`).
- Les commandes slash natives s’exécutent dans des sessions de commande isolées (`agent:<agentId>:discord:slash:<userId>`), tout en conservant `CommandTargetSessionKey` vers la session de conversation routée.
- La livraison des annonces cron/heartbeat textuelles vers Discord utilise une seule fois
  la réponse finale visible par l’assistant. Les médias et les charges utiles de composants structurés restent
  multi-messages lorsque l’agent émet plusieurs charges utiles livrables.

## Canaux de forum

Les canaux forum et média Discord n’acceptent que les publications de fils. OpenClaw prend en charge deux façons de les créer :

- Envoyer un message au parent du forum (`channel:<forumId>`) pour créer automatiquement un fil. Le titre du fil utilise la première ligne non vide de votre message.
- Utiliser `openclaw message thread create` pour créer un fil directement. Ne passez pas `--message-id` pour les canaux de forum.

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

Pour limiter les personnes pouvant cliquer sur un bouton, définissez `allowedUsers` sur ce bouton (ID utilisateur Discord, tags ou `*`). Une fois configuré, les utilisateurs non correspondants reçoivent un refus éphémère.

Les commandes slash `/model` et `/models` ouvrent un sélecteur de modèle interactif avec des menus déroulants de fournisseur, modèle et environnement d’exécution compatible, puis une étape de soumission. `/models add` est obsolète et renvoie désormais un message d’obsolescence au lieu d’enregistrer des modèles depuis la conversation. La réponse du sélecteur est éphémère et seul l’utilisateur qui l’a invoquée peut l’utiliser.

Pièces jointes de fichier :

- Les blocs `file` doivent pointer vers une référence de pièce jointe (`attachment://<filename>`)
- Fournissez la pièce jointe via `media`/`path`/`filePath` (fichier unique) ; utilisez `media-gallery` pour plusieurs fichiers
- Utilisez `filename` pour remplacer le nom de téléversement lorsqu’il doit correspondre à la référence de pièce jointe

Formulaires modaux :

- Ajoutez `components.modal` avec jusqu’à 5 champs
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

## Contrôle d’accès et routage

<Tabs>
  <Tab title="DM policy">
    `channels.discord.dmPolicy` contrôle l’accès aux MP. `channels.discord.allowFrom` est la liste d’autorisation canonique des MP.

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `channels.discord.allowFrom` inclue `"*"`)
    - `disabled`

    Si la politique de MP n’est pas ouverte, les utilisateurs inconnus sont bloqués (ou invités à s’apparier en mode `pairing`).

    Priorité multi-comptes :

    - `channels.discord.accounts.default.allowFrom` s’applique uniquement au compte `default`.
    - Pour un compte, `allowFrom` prime sur l’ancien `dm.allowFrom`.
    - Les comptes nommés héritent de `channels.discord.allowFrom` lorsque leur propre `allowFrom` et l’ancien `dm.allowFrom` ne sont pas définis.
    - Les comptes nommés n’héritent pas de `channels.discord.accounts.default.allowFrom`.

    Les anciens `channels.discord.dm.policy` et `channels.discord.dm.allowFrom` sont toujours lus pour compatibilité. `openclaw doctor --fix` les migre vers `dmPolicy` et `allowFrom` lorsqu’il peut le faire sans changer l’accès.

    Format de cible MP pour la livraison :

    - `user:<id>`
    - mention `<@id>`

    Les ID numériques seuls sont normalement résolus comme des ID de canal lorsqu’une valeur par défaut de canal est active, mais les ID listés dans le `allowFrom` MP effectif du compte sont traités comme des cibles MP utilisateur pour compatibilité.

  </Tab>

  <Tab title="DM access groups">
    Les MP Discord peuvent utiliser des entrées dynamiques `accessGroup:<name>` dans `channels.discord.allowFrom`.

    Les noms de groupes d’accès sont partagés entre les canaux de messages. Utilisez `type: "message.senders"` pour un groupe statique dont les membres sont exprimés dans la syntaxe `allowFrom` normale de chaque canal, ou `type: "discord.channelAudience"` lorsque l’audience `ViewChannel` actuelle d’un canal Discord doit définir l’appartenance dynamiquement. Le comportement partagé des groupes d’accès est documenté ici : [Groupes d’accès](/fr/channels/access-groups).

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

    Un canal texte Discord n’a pas de liste de membres distincte. `type: "discord.channelAudience"` modélise l’appartenance ainsi : l’expéditeur du MP est membre de la guilde configurée et dispose actuellement de l’autorisation effective `ViewChannel` sur le canal configuré après application des rôles et des substitutions de canal.

    Exemple : autoriser toute personne qui peut voir `#maintainers` à envoyer un MP au bot, tout en gardant les MP fermés à tous les autres.

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

    Les recherches échouent en mode fermé. Si Discord renvoie `Missing Access`, si la recherche du membre échoue, ou si le canal appartient à une guilde différente, l’expéditeur du MP est traité comme non autorisé.

    Activez **Server Members Intent** dans le portail développeur Discord pour le bot lorsque vous utilisez des groupes d’accès fondés sur l’audience de canal. Les MP n’incluent pas l’état de membre de guilde, donc OpenClaw résout le membre via Discord REST au moment de l’autorisation.

  </Tab>

  <Tab title="Guild policy">
    La gestion des guildes est contrôlée par `channels.discord.groupPolicy` :

    - `open`
    - `allowlist`
    - `disabled`

    La base sécurisée lorsque `channels.discord` existe est `allowlist`.

    Comportement de `allowlist` :

    - la guilde doit correspondre à `channels.discord.guilds` (`id` préféré, slug accepté)
    - listes d’autorisation d’expéditeurs facultatives : `users` (ID stables recommandés) et `roles` (ID de rôle uniquement) ; si l’un ou l’autre est configuré, les expéditeurs sont autorisés lorsqu’ils correspondent à `users` OU `roles`
    - la correspondance directe par nom/tag est désactivée par défaut ; activez `channels.discord.dangerouslyAllowNameMatching: true` uniquement comme mode de compatibilité d’urgence
    - les noms/tags sont pris en charge pour `users`, mais les ID sont plus sûrs ; `openclaw security audit` avertit lorsque des entrées par nom/tag sont utilisées
    - si une guilde a `channels` configuré, les canaux non listés sont refusés
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

    Si vous définissez seulement `DISCORD_BOT_TOKEN` et ne créez pas de bloc `channels.discord`, le repli d’exécution est `groupPolicy="allowlist"` (avec un avertissement dans les journaux), même si `channels.defaults.groupPolicy` est `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Les messages de guilde sont soumis à mention par défaut.

    La détection des mentions inclut :

    - mention explicite du bot
    - motifs de mention configurés (`agents.list[].groupChat.mentionPatterns`, repli `messages.groupChat.mentionPatterns`)
    - comportement implicite de réponse au bot dans les cas pris en charge

    Lors de l’écriture de messages Discord sortants, utilisez la syntaxe de mention canonique : `<@USER_ID>` pour les utilisateurs, `<#CHANNEL_ID>` pour les canaux et `<@&ROLE_ID>` pour les rôles. N’utilisez pas l’ancienne forme de mention de surnom `<@!USER_ID>`.

    `requireMention` est configuré par guilde/canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` supprime facultativement les messages qui mentionnent un autre utilisateur/rôle, mais pas le bot (hors @everyone/@here).

    MP de groupe :

    - par défaut : ignorés (`dm.groupEnabled=false`)
    - liste d’autorisation facultative via `dm.groupChannels` (ID ou slugs de canal)

  </Tab>
</Tabs>

### Routage d’agent basé sur les rôles

Utilisez `bindings[].match.roles` pour router les membres de guildes Discord vers différents agents par ID de rôle. Les liaisons basées sur les rôles n’acceptent que les ID de rôle et sont évaluées après les liaisons de pair ou de pair parent, et avant les liaisons propres à une guilde. Si une liaison définit aussi d’autres champs de correspondance (par exemple `peer` + `guildId` + `roles`), tous les champs configurés doivent correspondre.

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
- Les commandes peuvent rester visibles dans l’interface Discord pour les utilisateurs qui ne sont pas autorisés ; l’exécution applique toujours l’authentification OpenClaw et renvoie « non autorisé ».

Consultez [Commandes slash](/fr/tools/slash-commands) pour le catalogue et le comportement des commandes.

Paramètres par défaut des commandes slash :

- `ephemeral: true`

## Détails de la fonctionnalité

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
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
    `batched` n’attache la référence de réponse native implicite de Discord que lorsque le
    tour entrant était un lot temporisé de plusieurs messages. C’est utile
    lorsque vous voulez des réponses natives surtout pour les échanges ambigus en rafale, pas pour chaque
    tour à message unique.

    Les ID de message sont exposés dans le contexte/l’historique afin que les agents puissent cibler des messages précis.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw peut diffuser des brouillons de réponses en envoyant un message temporaire et en le modifiant à mesure que le texte arrive. `channels.discord.streaming` accepte `off` (par défaut) | `partial` | `block` | `progress`. `progress` conserve un brouillon d’état modifiable et le met à jour avec la progression des outils jusqu’à la livraison finale ; `streamMode` est un alias d’exécution historique. Exécutez `openclaw doctor --fix` pour réécrire la configuration persistée vers la clé canonique.

    La valeur par défaut reste `off`, car les modifications d’aperçu Discord atteignent rapidement les limites de débit lorsque plusieurs bots ou gateways partagent un compte.

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    - `partial` modifie un seul message d’aperçu à mesure que les jetons arrivent.
    - `block` émet des segments de la taille d’un brouillon (utilisez `draftChunk` pour ajuster la taille et les points de coupure, bornés à `textChunkLimit`).
    - Les réponses finales avec média, erreur ou réponse explicite annulent les modifications d’aperçu en attente.
    - `streaming.preview.toolProgress` (par défaut `true`) contrôle si les mises à jour d’outil/progression réutilisent le message d’aperçu.
    - `streaming.preview.commandText` / `streaming.progress.commandText` contrôle le détail commande/exec dans les lignes de progression compactes : `raw` (par défaut) ou `status` (libellé de l’outil uniquement).

    Masquer le texte brut de commande/exec tout en conservant des lignes de progression compactes :

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

    Le streaming d’aperçu est uniquement textuel ; les réponses avec média reviennent à la livraison normale. Lorsque le streaming `block` est explicitement activé, OpenClaw ignore le flux d’aperçu afin d’éviter une double diffusion.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Contexte d’historique de guilde :

    - `channels.discord.historyLimit` par défaut `20`
    - repli : `messages.groupChat.historyLimit`
    - `0` désactive

    Contrôles de l’historique des MP :

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportement des fils :

    - Les fils Discord sont routés comme des sessions de canal et héritent de la configuration du canal parent sauf remplacement.
    - Les sessions de fil héritent de la sélection `/model` au niveau session du canal parent comme repli limité au modèle ; les sélections `/model` locales au fil restent prioritaires et l’historique de transcription parent n’est pas copié sauf si l’héritage de transcription est activé.
    - `channels.discord.thread.inheritParent` (par défaut `false`) choisit d’amorcer les nouveaux fils automatiques depuis la transcription parente. Les remplacements par compte se trouvent sous `channels.discord.accounts.<id>.thread.inheritParent`.
    - Les réactions de l’outil de messagerie peuvent résoudre les cibles de MP `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` est préservé pendant le repli d’activation à l’étape de réponse.

    Les sujets de canal sont injectés comme contexte **non fiable**. Les listes d’autorisation contrôlent qui peut déclencher l’agent, pas une frontière complète de rédaction du contexte supplémentaire.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord peut lier un fil à une cible de session afin que les messages de suivi dans ce fil continuent d’être routés vers la même session (y compris les sessions de sous-agent).

    Commandes :

    - `/focus <target>` lier le fil actuel/nouveau à une cible de sous-agent/session
    - `/unfocus` supprimer la liaison du fil actuel
    - `/agents` afficher les exécutions actives et l’état de liaison
    - `/session idle <duration|off>` inspecter/mettre à jour le retrait automatique du focus après inactivité pour les liaisons focalisées
    - `/session max-age <duration|off>` inspecter/mettre à jour l’âge maximal strict pour les liaisons focalisées

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
    - `defaultSpawnContext` contrôle le contexte natif du sous-agent pour les créations liées à un fil. Par défaut : `"fork"`.
    - Les clés obsolètes `spawnSubagentSessions`/`spawnAcpSessions` sont migrées par `openclaw doctor --fix`.
    - Si les liaisons de fil sont désactivées pour un compte, `/focus` et les opérations associées de liaison de fil ne sont pas disponibles.

    Consultez [Sous-agents](/fr/tools/subagents), [Agents ACP](/fr/tools/acp-agents) et [Référence de configuration](/fr/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    Pour des espaces de travail ACP stables « toujours actifs », configurez des liaisons ACP typées de premier niveau ciblant des conversations Discord.

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

    - `/acp spawn codex --bind here` lie le canal ou le fil actuel sur place et conserve les futurs messages sur la même session ACP. Les messages de fil héritent de la liaison du canal parent.
    - Dans un canal ou un fil lié, `/new` et `/reset` réinitialisent la même session ACP sur place. Les liaisons temporaires de fil peuvent remplacer la résolution de cible tant qu’elles sont actives.
    - `spawnSessions` contrôle la création/liaison de fils enfants via `--thread auto|here`.

    Consultez [Agents ACP](/fr/tools/acp-agents) pour les détails du comportement des liaisons.

  </Accordion>

  <Accordion title="Reaction notifications">
    Mode de notification de réaction par guilde :

    - `off`
    - `own` (par défaut)
    - `all`
    - `allowlist` (utilise `guilds.<id>.users`)

    Les événements de réaction sont transformés en événements système et attachés à la session Discord routée.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` envoie un émoji d’accusé de réception pendant qu’OpenClaw traite un message entrant.

    Ordre de résolution :

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - repli sur l’émoji d’identité de l’agent (`agents.list[].identity.emoji`, sinon "👀")

    Notes :

    - Discord accepte les émojis Unicode ou les noms d’émojis personnalisés.
    - Utilisez `""` pour désactiver la réaction pour un canal ou un compte.

  </Accordion>

  <Accordion title="Config writes">
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

  <Accordion title="Gateway proxy">
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

  <Accordion title="PluralKit support">
    Activez la résolution PluralKit pour mapper les messages proxifiés à l’identité du membre du système :

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
    - les noms d’affichage des membres ne sont associés par nom/slug que lorsque `channels.discord.dangerouslyAllowNameMatching: true`
    - les recherches utilisent l’ID de message d’origine et sont limitées par une fenêtre temporelle
    - si la recherche échoue, les messages proxifiés sont traités comme des messages de bot et supprimés sauf si `allowBots=true`

  </Accordion>

  <Accordion title="Outbound mention aliases">
    Utilisez `mentionAliases` lorsque les agents ont besoin de mentions sortantes déterministes pour des utilisateurs Discord connus. Les clés sont des identifiants sans le `@` initial ; les valeurs sont des ID utilisateur Discord. Les identifiants inconnus, `@everyone`, `@here` et les mentions à l’intérieur de spans de code Markdown restent inchangés.

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

  <Accordion title="Presence configuration">
    Les mises à jour de présence sont appliquées lorsque vous définissez un champ de statut ou d’activité, ou lorsque vous activez la présence automatique.

    Exemple de statut uniquement :

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

    - 0: Jouer
    - 1: Streaming (nécessite `activityUrl`)
    - 2: Écouter
    - 3: Regarder
    - 4: Personnalisé (utilise le texte de l’activité comme état du statut ; l’émoji est facultatif)
    - 5: Participer à une compétition

    Exemple de présence automatique (signal de santé d’exécution) :

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

    La présence automatique associe la disponibilité d’exécution au statut Discord : healthy => online, degraded ou unknown => idle, exhausted ou unavailable => dnd. Remplacements de texte facultatifs :

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (prend en charge l’espace réservé `{reason}`)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord prend en charge la gestion des approbations par boutons dans les MP et peut éventuellement publier des invites d’approbation dans le canal d’origine.

    Chemin de configuration :

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (facultatif ; utilise `commands.ownerAllowFrom` comme solution de repli lorsque c’est possible)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, par défaut : `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord active automatiquement les approbations d’exécution natives lorsque `enabled` n’est pas défini ou vaut `"auto"` et qu’au moins un approbateur peut être résolu, soit depuis `execApprovals.approvers`, soit depuis `commands.ownerAllowFrom`. Discord ne déduit pas les approbateurs d’exécution depuis le canal `allowFrom`, l’ancien `dm.allowFrom` ou le `defaultTo` de message direct. Définissez `enabled: false` pour désactiver explicitement Discord comme client d’approbation natif.

    Pour les commandes de groupe sensibles réservées aux propriétaires, comme `/diagnostics` et `/export-trajectory`, OpenClaw envoie les invites d’approbation et les résultats finaux en privé. Il essaie d’abord le MP Discord lorsque le propriétaire appelant dispose d’une route propriétaire Discord ; si elle n’est pas disponible, il utilise comme solution de repli la première route propriétaire disponible depuis `commands.ownerAllowFrom`, comme Telegram.

    Lorsque `target` vaut `channel` ou `both`, l’invite d’approbation est visible dans le canal. Seuls les approbateurs résolus peuvent utiliser les boutons ; les autres utilisateurs reçoivent un refus éphémère. Les invites d’approbation incluent le texte de la commande, donc n’activez la livraison au canal que dans des canaux de confiance. Si l’ID du canal ne peut pas être déduit de la clé de session, OpenClaw utilise la livraison par MP comme solution de repli.

    Discord affiche aussi les boutons d’approbation partagés utilisés par d’autres canaux de discussion. L’adaptateur Discord natif ajoute principalement le routage des MP des approbateurs et la diffusion vers les canaux.
    Lorsque ces boutons sont présents, ils constituent l’UX d’approbation principale ; OpenClaw
    ne doit inclure une commande manuelle `/approve` que lorsque le résultat de l’outil indique
    que les approbations par chat ne sont pas disponibles ou que l’approbation manuelle est le seul chemin.
    Si le runtime d’approbation natif Discord n’est pas actif, OpenClaw conserve l’invite
    déterministe locale `/approve <id> <decision>` visible. Si le
    runtime est actif mais qu’une carte native ne peut être livrée à aucune cible,
    OpenClaw envoie une notification de repli dans le même chat avec la commande `/approve`
    exacte issue de l’approbation en attente.

    L’authentification Gateway et la résolution des approbations suivent le contrat de client Gateway partagé (les ID `plugin:` sont résolus via `plugin.approval.resolve` ; les autres ID via `exec.approval.resolve`). Les approbations expirent par défaut au bout de 30 minutes.

    Voir [Approbations d’exécution](/fr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Outils et verrous d’action

Les actions de message Discord comprennent des actions de messagerie, d’administration de canal, de modération, de présence et de métadonnées.

Exemples principaux :

- messagerie : `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- réactions : `react`, `reactions`, `emojiList`
- modération : `timeout`, `kick`, `ban`
- présence : `setPresence`

L’action `event-create` accepte un paramètre facultatif `image` (URL ou chemin de fichier local) pour définir l’image de couverture de l’événement planifié.

Les verrous d’action se trouvent sous `channels.discord.actions.*`.

Comportement par défaut des verrous :

| Groupe d’actions                                                                                                                                                         | Par défaut |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | activé     |
| roles                                                                                                                                                                    | désactivé  |
| moderation                                                                                                                                                               | désactivé  |
| presence                                                                                                                                                                 | désactivé  |

## UI Components v2

OpenClaw utilise les composants Discord v2 pour les approbations d’exécution et les marqueurs entre contextes. Les actions de message Discord peuvent aussi accepter `components` pour une UI personnalisée (avancé ; nécessite de construire une charge utile de composant via l’outil discord), tandis que les anciens `embeds` restent disponibles mais ne sont pas recommandés.

- `channels.discord.ui.components.accentColor` définit la couleur d’accent utilisée par les conteneurs de composants Discord (hex).
- Définissez-la par compte avec `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` sont ignorés lorsque des composants v2 sont présents.

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

Discord possède deux surfaces vocales distinctes : les **canaux vocaux** en temps réel (conversations continues) et les **pièces jointes de message vocal** (le format d’aperçu avec forme d’onde). Le Gateway prend en charge les deux.

### Canaux vocaux

Liste de configuration :

1. Activez Message Content Intent dans le Discord Developer Portal.
2. Activez Server Members Intent lorsque des listes d’autorisation de rôles/utilisateurs sont utilisées.
3. Invitez le bot avec les portées `bot` et `applications.commands`.
4. Accordez Connect, Speak, Send Messages et Read Message History dans le canal vocal cible.
5. Activez les commandes natives (`commands.native` ou `channels.discord.commands.native`).
6. Configurez `channels.discord.voice`.

Utilisez `/vc join|leave|status` pour contrôler les sessions. La commande utilise l’agent par défaut du compte et suit les mêmes règles de liste d’autorisation et de stratégie de groupe que les autres commandes Discord.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Exemple de jonction automatique :

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.4-mini",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        tts: {
          provider: "openai",
          openai: { voice: "onyx" },
        },
      },
    },
  },
}
```

Remarques :

- `voice.tts` remplace `messages.tts` uniquement pour la lecture vocale.
- `voice.model` remplace le LLM utilisé uniquement pour les réponses de canal vocal Discord. Laissez-le non défini pour hériter du modèle de l’agent routé.
- STT utilise `tools.media.audio` ; `voice.model` n’affecte pas la transcription.
- Les remplacements `systemPrompt` Discord par canal s’appliquent aux tours de transcription vocale pour ce canal vocal.
- Les tours de transcription vocale déduisent le statut de propriétaire depuis le `allowFrom` Discord (ou `dm.allowFrom`) ; les locuteurs non propriétaires ne peuvent pas accéder aux outils réservés aux propriétaires (par exemple `gateway` et `cron`).
- La voix Discord est optionnelle pour les configurations texte uniquement ; définissez `channels.discord.voice.enabled=true` (ou conservez un bloc `channels.discord.voice` existant) pour activer les commandes `/vc`, le runtime vocal et l’intention Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` peut remplacer explicitement l’abonnement à l’intention d’état vocal. Laissez-le non défini pour que l’intention suive l’activation vocale effective.
- `voice.daveEncryption` et `voice.decryptionFailureTolerance` sont transmis aux options de jonction `@discordjs/voice`.
- Les valeurs par défaut de `@discordjs/voice` sont `daveEncryption=true` et `decryptionFailureTolerance=24` si elles ne sont pas définies.
- `voice.connectTimeoutMs` contrôle l’attente initiale Ready de `@discordjs/voice` pour `/vc join` et les tentatives de jonction automatique. Par défaut : `30000`.
- `voice.reconnectGraceMs` contrôle la durée pendant laquelle OpenClaw attend qu’une session vocale déconnectée commence à se reconnecter avant de la détruire. Par défaut : `15000`.
- OpenClaw surveille aussi les échecs de déchiffrement en réception et se rétablit automatiquement en quittant puis en rejoignant le canal vocal après des échecs répétés dans une courte fenêtre.
- Si les journaux de réception affichent à plusieurs reprises `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` après une mise à jour, collectez un rapport de dépendances et les journaux. La ligne `@discordjs/voice` intégrée inclut le correctif de remplissage amont de la PR discord.js #11449, qui a fermé l’issue discord.js #11419.

Pipeline de canal vocal :

- La capture PCM Discord est convertie en fichier temporaire WAV.
- `tools.media.audio` gère STT, par exemple `openai/gpt-4o-mini-transcribe`.
- La transcription est envoyée via l’entrée et le routage Discord pendant que le LLM de réponse s’exécute avec une stratégie de sortie vocale qui masque l’outil `tts` de l’agent et demande du texte retourné, car la voix Discord possède la lecture TTS finale.
- `voice.model`, lorsqu’il est défini, remplace uniquement le LLM de réponse pour ce tour de canal vocal.
- `voice.tts` est fusionné par-dessus `messages.tts` ; l’audio obtenu est lu dans le canal rejoint.

Les identifiants sont résolus par composant : authentification de route LLM pour `voice.model`, authentification STT pour `tools.media.audio` et authentification TTS pour `messages.tts`/`voice.tts`.

### Messages vocaux

Les messages vocaux Discord affichent un aperçu de forme d’onde et nécessitent de l’audio OGG/Opus. OpenClaw génère automatiquement la forme d’onde, mais a besoin de `ffmpeg` et `ffprobe` sur l’hôte Gateway pour inspecter et convertir.

- Fournissez un **chemin de fichier local** (les URL sont rejetées).
- Omettez le contenu textuel (Discord rejette texte + message vocal dans la même charge utile).
- Tout format audio est accepté ; OpenClaw convertit en OGG/Opus si nécessaire.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Dépannage

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - activez Message Content Intent
    - activez Server Members Intent lorsque vous dépendez de la résolution utilisateur/membre
    - redémarrez le gateway après modification des intentions

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - vérifiez `groupPolicy`
    - vérifiez la liste d’autorisation de guild sous `channels.discord.guilds`
    - si la carte `channels` de guild existe, seuls les canaux listés sont autorisés
    - vérifiez le comportement de `requireMention` et les motifs de mention

    Vérifications utiles :

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false but still blocked">
    Causes fréquentes :

    - `groupPolicy="allowlist"` sans liste d’autorisation de guild/canal correspondante
    - `requireMention` configuré au mauvais endroit (doit être sous `channels.discord.guilds` ou dans l’entrée de canal)
    - expéditeur bloqué par la liste d’autorisation `users` de guild/canal

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    Journaux typiques :

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Réglages de file d’attente du Gateway Discord :

    - compte unique : `channels.discord.eventQueue.listenerTimeout`
    - comptes multiples : `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - ceci contrôle uniquement le travail de l’écouteur Gateway Discord, pas la durée de vie du tour d’agent

    Discord n’applique pas de délai d’expiration détenu par le canal aux tours d’agent en file d’attente. Les écouteurs de messages transmettent immédiatement, et les exécutions Discord en file d’attente préservent l’ordre par session jusqu’à ce que le cycle de vie de la session/de l’outil/du runtime se termine ou abandonne le travail.

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
    OpenClaw récupère les métadonnées Discord `/gateway/bot` avant la connexion. Les défaillances transitoires se rabattent sur l’URL de gateway par défaut de Discord et sont limitées en débit dans les journaux.

    Paramètres de délai d’expiration des métadonnées :

    - compte unique : `channels.discord.gatewayInfoTimeoutMs`
    - multi-compte : `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - repli env lorsque la config n’est pas définie : `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - valeur par défaut : `30000` (30 secondes), max : `120000`

  </Accordion>

  <Accordion title="Redémarrages dus au délai d’expiration READY du Gateway">
    OpenClaw attend l’événement `READY` du gateway Discord au démarrage et après les reconnexions à l’exécution. Les configurations multi-comptes avec échelonnement au démarrage peuvent nécessiter une fenêtre READY de démarrage plus longue que celle par défaut.

    Paramètres de délai d’expiration READY :

    - démarrage avec compte unique : `channels.discord.gatewayReadyTimeoutMs`
    - démarrage multi-compte : `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - repli env au démarrage lorsque la config n’est pas définie : `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - valeur par défaut au démarrage : `15000` (15 secondes), max : `120000`
    - exécution avec compte unique : `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - exécution multi-compte : `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - repli env à l’exécution lorsque la config n’est pas définie : `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - valeur par défaut à l’exécution : `30000` (30 secondes), max : `120000`

  </Accordion>

  <Accordion title="Incohérences d’audit des autorisations">
    Les vérifications d’autorisations `channels status --probe` ne fonctionnent que pour les identifiants numériques de salons.

    Si vous utilisez des clés slug, la correspondance à l’exécution peut toujours fonctionner, mais la sonde ne peut pas vérifier entièrement les autorisations.

  </Accordion>

  <Accordion title="Problèmes de DM et d’association">

    - DM désactivés : `channels.discord.dm.enabled=false`
    - politique DM désactivée : `channels.discord.dmPolicy="disabled"` (ancien : `channels.discord.dm.policy`)
    - attente d’approbation d’association en mode `pairing`

  </Accordion>

  <Accordion title="Boucles de bot à bot">
    Par défaut, les messages rédigés par des bots sont ignorés.

    Si vous définissez `channels.discord.allowBots=true`, utilisez des règles strictes de mention et de liste d’autorisation pour éviter les comportements de boucle.
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

  <Accordion title="Interruptions du STT vocal avec DecryptionFailed(...)">

    - gardez OpenClaw à jour (`openclaw update`) afin que la logique de récupération de réception vocale Discord soit présente
    - confirmez `channels.discord.voice.daveEncryption=true` (par défaut)
    - partez de `channels.discord.voice.decryptionFailureTolerance=24` (valeur par défaut upstream) et ajustez uniquement si nécessaire
    - surveillez les journaux pour :
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - si les échecs continuent après la reconnexion automatique, collectez les journaux et comparez-les à l’historique upstream de réception DAVE dans [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) et [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Référence de configuration

Référence principale : [Référence de configuration - Discord](/fr/gateway/config-channels#discord).

<Accordion title="Champs Discord à signal fort">

- démarrage/authentification : `enabled`, `token`, `accounts.*`, `allowBots`
- politique : `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- commande : `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- file d’événements : `eventQueue.listenerTimeout` (budget de l’écouteur), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway : `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- réponse/historique : `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- livraison : `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming : `streaming` (alias ancien : `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- média/nouvelle tentative : `mediaMaxMb` (plafonne les téléversements Discord sortants, valeur par défaut `100MB`), `retry`
- actions : `actions.*`
- présence : `activity`, `status`, `activityType`, `activityUrl`
- interface utilisateur : `ui.components.accentColor`
- fonctionnalités : `threadBindings`, `bindings[]` de premier niveau (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Sécurité et opérations

- Traitez les jetons de bot comme des secrets (`DISCORD_BOT_TOKEN` est préférable dans les environnements supervisés).
- Accordez les autorisations Discord selon le principe du moindre privilège.
- Si le déploiement ou l’état des commandes est obsolète, redémarrez le gateway et revérifiez avec `openclaw channels status --probe`.

## Associés

<CardGroup cols={2}>
  <Card title="Association" icon="link" href="/fr/channels/pairing">
    Associez un utilisateur Discord au gateway.
  </Card>
  <Card title="Groupes" icon="users" href="/fr/channels/groups">
    Comportement des discussions de groupe et des listes d’autorisation.
  </Card>
  <Card title="Routage des salons" icon="route" href="/fr/channels/channel-routing">
    Acheminez les messages entrants vers des agents.
  </Card>
  <Card title="Sécurité" icon="shield" href="/fr/gateway/security">
    Modèle de menace et durcissement.
  </Card>
  <Card title="Routage multi-agent" icon="sitemap" href="/fr/concepts/multi-agent">
    Mappez les guildes et les salons aux agents.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/fr/tools/slash-commands">
    Comportement des commandes natives.
  </Card>
</CardGroup>
