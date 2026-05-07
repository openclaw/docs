---
read_when:
    - Travail sur les fonctionnalités du canal Discord
summary: État de la prise en charge, fonctionnalités et configuration du bot Discord
title: Discord
x-i18n:
    generated_at: "2026-05-07T01:50:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0422fe8a25a7c40d49c4a8c6ec5683c729c09b79d5d03daefc0fcf032f6d75c2
    source_path: channels/discord.md
    workflow: 16
---

Prêt pour les DM et les canaux de guilde via le Gateway Discord officiel.

<CardGroup cols={3}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    Les DM Discord utilisent le mode d’appairage par défaut.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/fr/tools/slash-commands">
    Comportement natif des commandes et catalogue des commandes.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics intercanaux et flux de réparation.
  </Card>
</CardGroup>

## Configuration rapide

Vous devez créer une nouvelle application avec un bot, ajouter le bot à votre serveur et l’appairer à OpenClaw. Nous recommandons d’ajouter votre bot à votre propre serveur privé. Si vous n’en avez pas encore, [créez-en un d’abord](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (choisissez **Create My Own > For me and my friends**).

<Steps>
  <Step title="Créer une application Discord et un bot">
    Accédez au [portail développeur Discord](https://discord.com/developers/applications) et cliquez sur **New Application**. Donnez-lui un nom comme « OpenClaw ».

    Cliquez sur **Bot** dans la barre latérale. Définissez le **Username** sur le nom que vous donnez à votre agent OpenClaw.

  </Step>

  <Step title="Activer les intentions privilégiées">
    Toujours sur la page **Bot**, faites défiler jusqu’à **Privileged Gateway Intents** et activez :

    - **Message Content Intent** (obligatoire)
    - **Server Members Intent** (recommandé ; obligatoire pour les listes d’autorisation de rôles et la correspondance nom-ID)
    - **Presence Intent** (facultatif ; nécessaire uniquement pour les mises à jour de présence)

  </Step>

  <Step title="Copier le jeton de votre bot">
    Revenez en haut de la page **Bot** et cliquez sur **Reset Token**.

    <Note>
    Malgré son nom, cela génère votre premier jeton — rien n’est « réinitialisé ».
    </Note>

    Copiez le jeton et enregistrez-le quelque part. Il s’agit de votre **Bot Token** et vous en aurez bientôt besoin.

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

    Il s’agit de l’ensemble de base pour les canaux de texte normaux. Si vous prévoyez de publier dans des fils Discord, y compris les workflows de canaux de forum ou de média qui créent ou poursuivent un fil, activez aussi **Send Messages in Threads**.
    Copiez l’URL générée en bas, collez-la dans votre navigateur, sélectionnez votre serveur, puis cliquez sur **Continue** pour connecter. Vous devriez maintenant voir votre bot dans le serveur Discord.

  </Step>

  <Step title="Activer le mode développeur et collecter vos ID">
    De retour dans l’application Discord, vous devez activer le mode développeur afin de pouvoir copier les ID internes.

    1. Cliquez sur **User Settings** (icône d’engrenage à côté de votre avatar) → **Advanced** → activez **Developer Mode**
    2. Faites un clic droit sur votre **icône de serveur** dans la barre latérale → **Copy Server ID**
    3. Faites un clic droit sur votre **propre avatar** → **Copy User ID**

    Enregistrez votre **Server ID** et votre **User ID** avec votre Bot Token — vous enverrez les trois à OpenClaw à l’étape suivante.

  </Step>

  <Step title="Autoriser les DM des membres du serveur">
    Pour que l’appairage fonctionne, Discord doit permettre à votre bot de vous envoyer un DM. Faites un clic droit sur votre **icône de serveur** → **Privacy Settings** → activez **Direct Messages**.

    Cela permet aux membres du serveur (y compris les bots) de vous envoyer des DM. Gardez cette option activée si vous souhaitez utiliser les DM Discord avec OpenClaw. Si vous prévoyez d’utiliser uniquement des canaux de guilde, vous pouvez désactiver les DM après l’appairage.

  </Step>

  <Step title="Définir le jeton de votre bot de façon sécurisée (ne l’envoyez pas dans le chat)">
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

    Si OpenClaw fonctionne déjà comme service en arrière-plan, redémarrez-le via l’application Mac OpenClaw ou en arrêtant puis en relançant le processus `openclaw gateway run`.
    Pour les installations de service géré, exécutez `openclaw gateway install` depuis un shell où `DISCORD_BOT_TOKEN` est présent, ou stockez la variable dans `~/.openclaw/.env`, afin que le service puisse résoudre le SecretRef d’environnement après redémarrage.
    Si votre hôte est bloqué ou soumis à une limitation de débit par la recherche d’application au démarrage de Discord, définissez l’ID d’application/client Discord depuis le portail développeur afin que le démarrage puisse ignorer cet appel REST. Utilisez `channels.discord.applicationId` pour le compte par défaut, ou `channels.discord.accounts.<accountId>.applicationId` lorsque vous exécutez plusieurs bots Discord.

  </Step>

  <Step title="Configurer OpenClaw et appairer">

    <Tabs>
      <Tab title="Demander à votre agent">
        Discutez avec votre agent OpenClaw sur n’importe quel canal existant (par exemple Telegram) et dites-le-lui. Si Discord est votre premier canal, utilisez plutôt l’onglet CLI / config.

        > « J’ai déjà défini le jeton de mon bot Discord dans la config. Veuillez terminer la configuration de Discord avec User ID `<user_id>` et Server ID `<server_id>`. »
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

        Solution de repli d’environnement pour le compte par défaut :

```bash
DISCORD_BOT_TOKEN=...
```

        Pour une configuration scriptée ou distante, écrivez le même bloc JSON5 avec `openclaw config patch --file ./discord.patch.json5 --dry-run`, puis réexécutez sans `--dry-run`. Les valeurs `token` en texte brut sont prises en charge. Les valeurs SecretRef sont également prises en charge pour `channels.discord.token` avec les fournisseurs env/file/exec. Consultez [Gestion des secrets](/fr/gateway/secrets).

        Pour plusieurs bots Discord, conservez chaque jeton de bot et ID d’application sous son compte. Un `channels.discord.applicationId` de premier niveau est hérité par les comptes ; ne le définissez donc à cet endroit que lorsque chaque compte doit utiliser le même ID d’application.

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

  <Step title="Approuver le premier appairage par DM">
    Attendez que le Gateway soit en cours d’exécution, puis envoyez un DM à votre bot dans Discord. Il répondra avec un code d’appairage.

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

    Vous devriez maintenant pouvoir discuter avec votre agent dans Discord via DM.

  </Step>
</Steps>

<Note>
La résolution des jetons tient compte des comptes. Les valeurs de jeton de la config l’emportent sur la solution de repli d’environnement. `DISCORD_BOT_TOKEN` est utilisé uniquement pour le compte par défaut.
Si deux comptes Discord activés se résolvent vers le même jeton de bot, OpenClaw ne démarre qu’un seul moniteur de Gateway pour ce jeton. Un jeton provenant de la config l’emporte sur la solution de repli d’environnement par défaut ; sinon, le premier compte activé l’emporte et le compte dupliqué est signalé comme désactivé.
Pour les appels sortants avancés (outil de message/actions de canal), un `token` explicite par appel est utilisé pour cet appel. Cela s’applique aux actions d’envoi et de lecture/sondage (par exemple read/search/fetch/thread/pins/permissions). Les paramètres de stratégie de compte et de nouvelle tentative proviennent toujours du compte sélectionné dans l’instantané d’exécution actif.
</Note>

## Recommandé : configurer un espace de travail de guilde

Une fois que les DM fonctionnent, vous pouvez configurer votre serveur Discord comme un espace de travail complet où chaque canal obtient sa propre session d’agent avec son propre contexte. C’est recommandé pour les serveurs privés où il n’y a que vous et votre bot.

<Steps>
  <Step title="Ajouter votre serveur à la liste d’autorisation de guilde">
    Cela permet à votre agent de répondre dans n’importe quel canal de votre serveur, et pas seulement dans les DM.

    <Tabs>
      <Tab title="Demander à votre agent">
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

  <Step title="Autoriser les réponses sans @mention">
    Par défaut, votre agent ne répond dans les canaux de guilde que lorsqu’il est @mentionné. Pour un serveur privé, vous souhaitez probablement qu’il réponde à chaque message.

    Dans les canaux de guilde, les réponses finales normales de l’assistant restent privées par défaut. La sortie Discord visible doit être envoyée explicitement avec l’outil `message`, afin que l’agent puisse rester en observation par défaut et ne publier que lorsqu’il décide qu’une réponse de canal est utile.

    Cela signifie que le modèle sélectionné doit appeler les outils de façon fiable. Si Discord affiche la saisie en cours et que les journaux montrent une utilisation de jetons, mais qu’aucun message n’est publié, vérifiez le journal de session pour du texte d’assistant avec `didSendViaMessagingTool: false`. Cela signifie que le modèle a produit une réponse finale privée au lieu d’appeler `message(action=send)`. Passez à un modèle plus robuste pour l’appel d’outils, ou utilisez la config ci-dessous pour restaurer les réponses finales automatiques héritées.

    <Tabs>
      <Tab title="Demander à votre agent">
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

        Pour restaurer les réponses finales automatiques héritées pour les salons de groupe/canal, définissez `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Prévoir la mémoire dans les canaux de guilde">
    Par défaut, la mémoire à long terme (MEMORY.md) se charge uniquement dans les sessions DM. Les canaux de guilde ne chargent pas automatiquement MEMORY.md.

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

Créez maintenant quelques canaux sur votre serveur Discord et commencez à discuter. Votre agent peut voir le nom du canal, et chaque canal obtient sa propre session isolée — vous pouvez donc configurer `#coding`, `#home`, `#research` ou tout ce qui correspond à votre workflow.

## Modèle d’exécution

- Gateway possède la connexion Discord.
- Le routage des réponses est déterministe : les réponses entrantes de Discord repartent vers Discord.
- Les métadonnées de guilde/salon Discord sont ajoutées au prompt du modèle comme contexte non fiable, et non comme préfixe de réponse visible par l’utilisateur. Si un modèle recopie cette enveloppe, OpenClaw retire les métadonnées copiées des réponses sortantes et du futur contexte de rejeu.
- Par défaut (`session.dmScope=main`), les conversations directes partagent la session principale de l’agent (`agent:main:main`).
- Les salons de guilde sont des clés de session isolées (`agent:<agentId>:discord:channel:<channelId>`).
- Les MP de groupe sont ignorés par défaut (`channels.discord.dm.groupEnabled=false`).
- Les commandes slash natives s’exécutent dans des sessions de commande isolées (`agent:<agentId>:discord:slash:<userId>`), tout en transportant `CommandTargetSessionKey` vers la session de conversation routée.
- La livraison d’annonces textuelles Cron/Heartbeat à Discord utilise une seule fois la réponse finale visible par l’assistant. Les médias et les charges utiles de composants structurés restent multi-messages lorsque l’agent émet plusieurs charges utiles livrables.

## Salons de forum

Les salons de forum et de média Discord acceptent uniquement les publications de fil. OpenClaw permet de les créer de deux façons :

- Envoyez un message au parent du forum (`channel:<forumId>`) pour créer automatiquement un fil. Le titre du fil utilise la première ligne non vide de votre message.
- Utilisez `openclaw message thread create` pour créer directement un fil. Ne passez pas `--message-id` pour les salons de forum.

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

Les parents de forum n’acceptent pas les composants Discord. Si vous avez besoin de composants, envoyez au fil lui-même (`channel:<threadId>`).

## Composants interactifs

OpenClaw prend en charge les conteneurs de composants Discord v2 pour les messages d’agent. Utilisez l’outil de message avec une charge utile `components`. Les résultats d’interaction sont routés vers l’agent comme des messages entrants normaux et suivent les paramètres Discord `replyToMode` existants.

Blocs pris en charge :

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Les lignes d’action autorisent jusqu’à 5 boutons ou un seul menu de sélection
- Types de sélection : `string`, `user`, `role`, `mentionable`, `channel`

Par défaut, les composants sont à usage unique. Définissez `components.reusable=true` pour permettre aux boutons, sélections et formulaires d’être utilisés plusieurs fois jusqu’à leur expiration.

Pour restreindre les personnes pouvant cliquer sur un bouton, définissez `allowedUsers` sur ce bouton (ID utilisateur Discord, tags ou `*`). Lorsqu’il est configuré, les utilisateurs sans correspondance reçoivent un refus éphémère.

Les commandes slash `/model` et `/models` ouvrent un sélecteur de modèle interactif avec des listes déroulantes de fournisseur, de modèle et de runtime compatible, plus une étape Envoyer. `/models add` est obsolète et renvoie désormais un message d’obsolescence au lieu d’enregistrer des modèles depuis la conversation. La réponse du sélecteur est éphémère et seul l’utilisateur qui l’a invoquée peut l’utiliser.

Pièces jointes de fichier :

- Les blocs `file` doivent pointer vers une référence de pièce jointe (`attachment://<filename>`)
- Fournissez la pièce jointe via `media`/`path`/`filePath` (fichier unique) ; utilisez `media-gallery` pour plusieurs fichiers
- Utilisez `filename` pour remplacer le nom d’envoi lorsqu’il doit correspondre à la référence de pièce jointe

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

    Si la stratégie de MP n’est pas ouverte, les utilisateurs inconnus sont bloqués (ou invités à s’appairer en mode `pairing`).

    Priorité avec plusieurs comptes :

    - `channels.discord.accounts.default.allowFrom` s’applique uniquement au compte `default`.
    - Pour un compte, `allowFrom` est prioritaire sur l’ancien `dm.allowFrom`.
    - Les comptes nommés héritent de `channels.discord.allowFrom` lorsque leur propre `allowFrom` et l’ancien `dm.allowFrom` ne sont pas définis.
    - Les comptes nommés n’héritent pas de `channels.discord.accounts.default.allowFrom`.

    Les anciens `channels.discord.dm.policy` et `channels.discord.dm.allowFrom` sont encore lus pour compatibilité. `openclaw doctor --fix` les migre vers `dmPolicy` et `allowFrom` lorsqu’il peut le faire sans modifier l’accès.

    Format de cible MP pour la livraison :

    - `user:<id>`
    - mention `<@id>`

    Les ID numériques nus sont normalement résolus comme ID de salon lorsqu’une valeur par défaut de salon est active, mais les ID listés dans le `allowFrom` MP effectif du compte sont traités comme des cibles de MP utilisateur pour compatibilité.

  </Tab>

  <Tab title="DM access groups">
    Les MP Discord peuvent utiliser des entrées dynamiques `accessGroup:<name>` dans `channels.discord.allowFrom`.

    Les noms de groupes d’accès sont partagés entre les canaux de messages. Utilisez `type: "message.senders"` pour un groupe statique dont les membres sont exprimés dans la syntaxe `allowFrom` normale de chaque canal, ou `type: "discord.channelAudience"` lorsque l’audience `ViewChannel` actuelle d’un salon Discord doit définir l’appartenance dynamiquement. Le comportement partagé des groupes d’accès est documenté ici : [Groupes d’accès](/fr/channels/access-groups).

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

    Un salon textuel Discord n’a pas de liste de membres séparée. `type: "discord.channelAudience"` modélise l’appartenance ainsi : l’expéditeur du MP est membre de la guilde configurée et dispose actuellement de la permission effective `ViewChannel` sur le salon configuré après application des rôles et des remplacements de salon.

    Exemple : autoriser toute personne pouvant voir `#maintainers` à envoyer un MP au bot, tout en gardant les MP fermés à toutes les autres personnes.

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

    Les recherches échouent fermées. Si Discord renvoie `Missing Access`, si la recherche du membre échoue ou si le salon appartient à une autre guilde, l’expéditeur du MP est traité comme non autorisé.

    Activez le **Server Members Intent** du portail développeur Discord pour le bot lorsque vous utilisez des groupes d’accès basés sur l’audience d’un salon. Les MP n’incluent pas l’état de membre de guilde, donc OpenClaw résout le membre via l’API REST Discord au moment de l’autorisation.

  </Tab>

  <Tab title="Guild policy">
    La gestion des guildes est contrôlée par `channels.discord.groupPolicy` :

    - `open`
    - `allowlist`
    - `disabled`

    La base sécurisée lorsque `channels.discord` existe est `allowlist`.

    Comportement de `allowlist` :

    - la guilde doit correspondre à `channels.discord.guilds` (`id` recommandé, slug accepté)
    - listes d’autorisation facultatives des expéditeurs : `users` (ID stables recommandés) et `roles` (ID de rôle uniquement) ; si l’un ou l’autre est configuré, les expéditeurs sont autorisés lorsqu’ils correspondent à `users` OU `roles`
    - la correspondance directe par nom/tag est désactivée par défaut ; activez `channels.discord.dangerouslyAllowNameMatching: true` uniquement comme mode de compatibilité d’urgence
    - les noms/tags sont pris en charge pour `users`, mais les ID sont plus sûrs ; `openclaw security audit` avertit lorsque des entrées nom/tag sont utilisées
    - si une guilde a `channels` configuré, les salons non listés sont refusés
    - si une guilde n’a pas de bloc `channels`, tous les salons de cette guilde autorisée sont autorisés

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

    Si vous définissez uniquement `DISCORD_BOT_TOKEN` et ne créez pas de bloc `channels.discord`, le repli runtime est `groupPolicy="allowlist"` (avec un avertissement dans les journaux), même si `channels.defaults.groupPolicy` vaut `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Les messages de guilde exigent une mention par défaut.

    La détection de mention inclut :

    - mention explicite du bot
    - motifs de mention configurés (`agents.list[].groupChat.mentionPatterns`, repli `messages.groupChat.mentionPatterns`)
    - comportement implicite de réponse au bot dans les cas pris en charge

    Lors de l’écriture de messages Discord sortants, utilisez la syntaxe de mention canonique : `<@USER_ID>` pour les utilisateurs, `<#CHANNEL_ID>` pour les salons et `<@&ROLE_ID>` pour les rôles. N’utilisez pas l’ancienne forme de mention de surnom `<@!USER_ID>`.

    `requireMention` est configuré par guilde/salon (`channels.discord.guilds...`).
    `ignoreOtherMentions` supprime facultativement les messages qui mentionnent un autre utilisateur/rôle mais pas le bot (hors @everyone/@here).

    MP de groupe :

    - par défaut : ignorés (`dm.groupEnabled=false`)
    - liste d’autorisation facultative via `dm.groupChannels` (ID de salon ou slugs)

  </Tab>
</Tabs>

### Routage des agents basé sur les rôles

Utilisez `bindings[].match.roles` pour router les membres de guilde Discord vers différents agents par ID de rôle. Les bindings basés sur les rôles acceptent uniquement les ID de rôle et sont évalués après les bindings pair ou pair parent et avant les bindings de guilde uniquement. Si un binding définit aussi d’autres champs de correspondance (par exemple `peer` + `guildId` + `roles`), tous les champs configurés doivent correspondre.

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

- `commands.native` prend par défaut la valeur `"auto"` et est activé pour Discord.
- Remplacement par canal : `channels.discord.commands.native`.
- `commands.native=false` ignore l’enregistrement et le nettoyage des commandes slash Discord au démarrage. Les commandes enregistrées précédemment peuvent rester visibles dans Discord jusqu’à ce que vous les supprimiez de l’application Discord.
- L’authentification des commandes natives utilise les mêmes listes d’autorisation/politiques Discord que le traitement normal des messages.
- Les commandes peuvent rester visibles dans l’interface Discord pour les utilisateurs qui ne sont pas autorisés ; l’exécution applique toujours l’authentification OpenClaw et renvoie « non autorisé ».

Consultez [Commandes slash](/fr/tools/slash-commands) pour le catalogue et le comportement des commandes.

Paramètres par défaut des commandes slash :

- `ephemeral: true`

## Détails de la fonctionnalité

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

    Remarque : `off` désactive le fil de réponse implicite. Les balises explicites `[[reply_to_*]]` sont toujours respectées.
    `first` attache toujours la référence de réponse native implicite au premier message Discord sortant du tour.
    `batched` n’attache la référence de réponse native implicite de Discord que lorsque le
    tour entrant était un lot temporisé de plusieurs messages. C’est utile
    lorsque vous voulez des réponses natives principalement pour les conversations en rafales ambiguës, et non pour chaque
    tour à message unique.

    Les identifiants de message sont exposés dans le contexte/l’historique afin que les agents puissent cibler des messages précis.

  </Accordion>

  <Accordion title="Aperçu du flux en direct">
    OpenClaw peut diffuser des brouillons de réponses en envoyant un message temporaire et en le modifiant à mesure que le texte arrive. `channels.discord.streaming` accepte `off` | `partial` | `block` | `progress` (par défaut). `progress` conserve un brouillon d’état modifiable et le met à jour avec la progression des outils jusqu’à la livraison finale ; `streamMode` est un alias d’exécution hérité. Exécutez `openclaw doctor --fix` pour réécrire la configuration persistée vers la clé canonique.

    Définissez `channels.discord.streaming.mode` sur `off` pour désactiver les modifications d’aperçu Discord. Si le streaming par blocs Discord est explicitement activé, OpenClaw ignore le flux d’aperçu afin d’éviter une double diffusion.

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

    - `partial` modifie un seul message d’aperçu à mesure que les tokens arrivent.
    - `block` émet des fragments de taille brouillon (utilisez `draftChunk` pour ajuster la taille et les points de coupure, bornés par `textChunkLimit`).
    - Les livraisons finales contenant des médias, des erreurs ou des réponses explicites annulent les modifications d’aperçu en attente.
    - `streaming.preview.toolProgress` (par défaut `true`) contrôle si les mises à jour d’outil/de progression réutilisent le message d’aperçu.
    - `streaming.preview.commandText` / `streaming.progress.commandText` contrôle les détails de commande/d’exécution dans les lignes de progression compactes : `raw` (par défaut) ou `status` (libellé de l’outil uniquement).

    Masquer le texte brut de commande/d’exécution tout en conservant les lignes de progression compactes :

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

    Le streaming d’aperçu est uniquement textuel ; les réponses multimédias reviennent à la livraison normale. Lorsque le streaming `block` est explicitement activé, OpenClaw ignore le flux d’aperçu afin d’éviter une double diffusion.

  </Accordion>

  <Accordion title="Historique, contexte et comportement des fils">
    Contexte d’historique de guilde :

    - valeur par défaut de `channels.discord.historyLimit` : `20`
    - solution de repli : `messages.groupChat.historyLimit`
    - `0` désactive

    Contrôles de l’historique des DM :

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportement des fils :

    - Les fils Discord sont routés comme des sessions de canal et héritent de la configuration du canal parent sauf remplacement.
    - Les sessions de fil héritent de la sélection `/model` au niveau session du canal parent comme solution de repli limitée au modèle ; les sélections `/model` locales au fil restent prioritaires et l’historique de transcript parent n’est pas copié sauf si l’héritage de transcript est activé.
    - `channels.discord.thread.inheritParent` (par défaut `false`) active, pour les nouveaux fils automatiques, l’amorçage depuis le transcript parent. Les remplacements par compte se trouvent sous `channels.discord.accounts.<id>.thread.inheritParent`.
    - Les réactions de l’outil de message peuvent résoudre les cibles DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` est préservé pendant le repli d’activation à l’étape de réponse.

    Les sujets de canal sont injectés comme contexte **non fiable**. Les listes d’autorisation limitent qui peut déclencher l’agent, mais ne constituent pas une frontière complète de caviardage du contexte supplémentaire.

  </Accordion>

  <Accordion title="Sessions liées à un fil pour les sous-agents">
    Discord peut lier un fil à une cible de session afin que les messages de suivi dans ce fil continuent d’être routés vers la même session (y compris les sessions de sous-agent).

    Commandes :

    - `/focus <target>` lier le fil actuel/nouveau à une cible de sous-agent/session
    - `/unfocus` supprimer la liaison du fil actuel
    - `/agents` afficher les exécutions actives et l’état de liaison
    - `/session idle <duration|off>` inspecter/mettre à jour le désengagement automatique après inactivité pour les liaisons focalisées
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
    - `channels.discord.threadBindings.*` remplace le comportement Discord.
    - `spawnSessions` contrôle la création/liaison automatique de fils pour `sessions_spawn({ thread: true })` et les créations de fils ACP. Par défaut : `true`.
    - `defaultSpawnContext` contrôle le contexte natif de sous-agent pour les créations liées à un fil. Par défaut : `"fork"`.
    - Les clés obsolètes `spawnSubagentSessions`/`spawnAcpSessions` sont migrées par `openclaw doctor --fix`.
    - Si les liaisons de fil sont désactivées pour un compte, `/focus` et les opérations de liaison de fil associées ne sont pas disponibles.

    Consultez [Sous-agents](/fr/tools/subagents), [Agents ACP](/fr/tools/acp-agents) et [Référence de configuration](/fr/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Liaisons persistantes de canal ACP">
    Pour des espaces de travail ACP stables « toujours actifs », configurez des liaisons ACP typées de niveau supérieur ciblant des conversations Discord.

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

    - `/acp spawn codex --bind here` lie le canal ou le fil actuel sur place et conserve les messages futurs sur la même session ACP. Les messages de fil héritent de la liaison du canal parent.
    - Dans un canal ou un fil lié, `/new` et `/reset` réinitialisent la même session ACP sur place. Les liaisons de fil temporaires peuvent remplacer la résolution de cible lorsqu’elles sont actives.
    - `spawnSessions` contrôle la création/liaison de fils enfants via `--thread auto|here`.

    Consultez [Agents ACP](/fr/tools/acp-agents) pour les détails du comportement de liaison.

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

    Remarques :

    - Discord accepte les emojis unicode ou les noms d’emojis personnalisés.
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
    Activez la résolution PluralKit pour mapper les messages relayés par proxy à l’identité du membre du système :

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
    - les recherches utilisent l’ID du message d’origine et sont contraintes par une fenêtre temporelle
    - si la recherche échoue, les messages relayés par proxy sont traités comme des messages de bot et supprimés sauf si `allowBots=true`

  </Accordion>

  <Accordion title="Alias de mentions sortantes">
    Utilisez `mentionAliases` lorsque les agents ont besoin de mentions sortantes déterministes pour des utilisateurs Discord connus. Les clés sont des handles sans le `@` initial ; les valeurs sont des ID utilisateur Discord. Les handles inconnus, `@everyone`, `@here` et les mentions dans les spans de code Markdown restent inchangés.

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

    Exemple de statut seul :

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

    - 0 : Jeu en cours
    - 1 : Streaming (nécessite `activityUrl`)
    - 2 : Écoute
    - 3 : Visionnage
    - 4 : Personnalisé (utilise le texte d’activité comme état du statut ; l’emoji est facultatif)
    - 5 : Compétition

    Exemple de présence automatique (signal d’état de l’exécution) :

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

    La présence automatique mappe la disponibilité à l’exécution au statut Discord : healthy => online, degraded ou unknown => idle, exhausted ou unavailable => dnd. Remplacements de texte facultatifs :

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (prend en charge l’espace réservé `{reason}`)

  </Accordion>

  <Accordion title="Approbations dans Discord">
    Discord prend en charge la gestion des approbations par boutons dans les messages privés et peut éventuellement publier les demandes d’approbation dans le canal d’origine.

    Chemin de configuration :

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (facultatif ; revient à `commands.ownerAllowFrom` lorsque possible)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, valeur par défaut : `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord active automatiquement les approbations d’exécution natives lorsque `enabled` n’est pas défini ou vaut `"auto"` et qu’au moins un approbateur peut être résolu, soit depuis `execApprovals.approvers`, soit depuis `commands.ownerAllowFrom`. Discord ne déduit pas les approbateurs d’exécution depuis le canal `allowFrom`, l’ancien `dm.allowFrom`, ni le `defaultTo` des messages directs. Définissez `enabled: false` pour désactiver explicitement Discord comme client d’approbation natif.

    Pour les commandes de groupe sensibles réservées au propriétaire, comme `/diagnostics` et `/export-trajectory`, OpenClaw envoie les demandes d’approbation et les résultats finaux en privé. Il essaie d’abord les messages privés Discord lorsque le propriétaire qui invoque la commande dispose d’une route de propriétaire Discord ; si elle n’est pas disponible, il revient à la première route de propriétaire disponible dans `commands.ownerAllowFrom`, comme Telegram.

    Lorsque `target` vaut `channel` ou `both`, la demande d’approbation est visible dans le canal. Seuls les approbateurs résolus peuvent utiliser les boutons ; les autres utilisateurs reçoivent un refus éphémère. Les demandes d’approbation incluent le texte de la commande, donc n’activez la livraison dans un canal que pour des canaux de confiance. Si l’ID du canal ne peut pas être dérivé de la clé de session, OpenClaw revient à la livraison par message privé.

    Discord affiche également les boutons d’approbation partagés utilisés par les autres canaux de discussion. L’adaptateur Discord natif ajoute principalement le routage des messages privés vers les approbateurs et la diffusion vers les canaux.
    Lorsque ces boutons sont présents, ils constituent l’UX d’approbation principale ; OpenClaw
    ne doit inclure une commande `/approve` manuelle que lorsque le résultat de l’outil indique
    que les approbations par discussion sont indisponibles ou que l’approbation manuelle est le seul chemin.
    Si l’environnement d’exécution d’approbation natif de Discord n’est pas actif, OpenClaw conserve visible
    la demande locale déterministe `/approve <id> <decision>`. Si l’environnement
    d’exécution est actif mais qu’une carte native ne peut être livrée à aucune cible,
    OpenClaw envoie un avis de secours dans la même discussion avec la commande `/approve`
    exacte provenant de l’approbation en attente.

    L’authentification du Gateway et la résolution des approbations suivent le contrat client Gateway partagé (les ID `plugin:` sont résolus via `plugin.approval.resolve` ; les autres ID via `exec.approval.resolve`). Les approbations expirent par défaut après 30 minutes.

    Voir [Approbations d’exécution](/fr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Outils et barrières d’action

Les actions de message Discord incluent les actions de messagerie, d’administration de canal, de modération, de présence et de métadonnées.

Exemples principaux :

- messagerie : `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- réactions : `react`, `reactions`, `emojiList`
- modération : `timeout`, `kick`, `ban`
- présence : `setPresence`

L’action `event-create` accepte un paramètre facultatif `image` (URL ou chemin de fichier local) pour définir l’image de couverture de l’événement programmé.

Les barrières d’action se trouvent sous `channels.discord.actions.*`.

Comportement par défaut des barrières :

| Groupe d’actions                                                                                                                                                         | Par défaut |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | activé     |
| roles                                                                                                                                                                    | désactivé  |
| moderation                                                                                                                                                               | désactivé  |
| presence                                                                                                                                                                 | désactivé  |

## Interface utilisateur Components v2

OpenClaw utilise les composants Discord v2 pour les approbations d’exécution et les marqueurs intercontextes. Les actions de message Discord peuvent également accepter `components` pour une interface utilisateur personnalisée (avancé ; nécessite de construire une charge utile de composant via l’outil discord), tandis que les anciens `embeds` restent disponibles mais ne sont pas recommandés.

- `channels.discord.ui.components.accentColor` définit la couleur d’accent utilisée par les conteneurs de composants Discord (hex).
- Définissez-la par compte avec `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` est ignoré lorsque des composants v2 sont présents.

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

Discord propose deux surfaces vocales distinctes : les **canaux vocaux** en temps réel (conversations continues) et les **pièces jointes de messages vocaux** (le format d’aperçu avec forme d’onde). Le Gateway prend en charge les deux.

### Canaux vocaux

Liste de contrôle de configuration :

1. Activez Message Content Intent dans le portail développeur Discord.
2. Activez Server Members Intent lorsque des listes d’autorisation de rôles/utilisateurs sont utilisées.
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
- Les remplacements Discord `systemPrompt` par canal s’appliquent aux tours de transcription vocale pour ce canal vocal.
- Les tours de transcription vocale dérivent le statut de propriétaire depuis Discord `allowFrom` (ou `dm.allowFrom`) ; les intervenants non propriétaires ne peuvent pas accéder aux outils réservés au propriétaire (par exemple `gateway` et `cron`).
- La voix Discord est optionnelle pour les configurations uniquement textuelles ; définissez `channels.discord.voice.enabled=true` (ou conservez un bloc `channels.discord.voice` existant) pour activer les commandes `/vc`, l’environnement d’exécution vocal et l’intention Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` peut remplacer explicitement l’abonnement à l’intention d’état vocal. Laissez-le non défini pour que l’intention suive l’activation vocale effective.
- `voice.daveEncryption` et `voice.decryptionFailureTolerance` sont transmis aux options de jonction `@discordjs/voice`.
- Les valeurs par défaut de `@discordjs/voice` sont `daveEncryption=true` et `decryptionFailureTolerance=24` si elles ne sont pas définies.
- `voice.connectTimeoutMs` contrôle l’attente Ready initiale de `@discordjs/voice` pour les tentatives `/vc join` et de jonction automatique. Valeur par défaut : `30000`.
- `voice.reconnectGraceMs` contrôle la durée pendant laquelle OpenClaw attend qu’une session vocale déconnectée commence à se reconnecter avant de la détruire. Valeur par défaut : `15000`.
- OpenClaw surveille également les échecs de déchiffrement en réception et se rétablit automatiquement en quittant puis en rejoignant le canal vocal après des échecs répétés dans une courte fenêtre.
- Si les journaux de réception affichent à plusieurs reprises `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` après une mise à jour, collectez un rapport de dépendances et les journaux. La version groupée de `@discordjs/voice` inclut le correctif amont de remplissage issu de la PR discord.js #11449, qui a fermé l’issue discord.js #11419.

Pipeline de canal vocal :

- La capture PCM Discord est convertie en fichier temporaire WAV.
- `tools.media.audio` gère STT, par exemple `openai/gpt-4o-mini-transcribe`.
- La transcription est envoyée via l’entrée et le routage Discord pendant que le LLM de réponse s’exécute avec une politique de sortie vocale qui masque l’outil `tts` de l’agent et demande du texte retourné, car la voix Discord possède la lecture TTS finale.
- `voice.model`, lorsqu’il est défini, remplace uniquement le LLM de réponse pour ce tour de canal vocal.
- `voice.tts` est fusionné par-dessus `messages.tts` ; l’audio résultant est lu dans le canal rejoint.

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
  <Accordion title="Intentions non autorisées utilisées ou le bot ne voit aucun message de guilde">

    - activez Message Content Intent
    - activez Server Members Intent lorsque vous dépendez de la résolution d’utilisateurs/membres
    - redémarrez le Gateway après avoir modifié les intentions

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

  <Accordion title="Require mention est false mais reste bloqué">
    Causes courantes :

    - `groupPolicy="allowlist"` sans liste d’autorisation de guilde/canal correspondante
    - `requireMention` configuré au mauvais endroit (doit se trouver sous `channels.discord.guilds` ou dans l’entrée de canal)
    - expéditeur bloqué par la liste d’autorisation `users` de guilde/canal

  </Accordion>

  <Accordion title="Tours Discord de longue durée ou réponses dupliquées">

    Journaux typiques :

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Boutons de réglage de la file d’attente du Gateway Discord :

    - compte unique : `channels.discord.eventQueue.listenerTimeout`
    - plusieurs comptes : `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - cela contrôle uniquement le travail des écouteurs du Gateway Discord, pas la durée de vie du tour de l’agent

    Discord n’applique pas de délai d’expiration propre au canal aux tours d’agent en file d’attente. Les écouteurs de messages transmettent immédiatement, et les exécutions Discord en file d’attente préservent l’ordre par session jusqu’à ce que le cycle de vie de la session, de l’outil ou de l’environnement d’exécution se termine ou abandonne le travail.

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
    OpenClaw récupère les métadonnées Discord `/gateway/bot` avant de se connecter. Les échecs transitoires se rabattent sur l’URL de Gateway par défaut de Discord et sont limités en fréquence dans les journaux.

    Paramètres de délai d’expiration des métadonnées :

    - compte unique : `channels.discord.gatewayInfoTimeoutMs`
    - comptes multiples : `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - repli par variable d’environnement lorsque la configuration n’est pas définie : `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - valeur par défaut : `30000` (30 secondes), max : `120000`

  </Accordion>

  <Accordion title="Redémarrages dus au délai d’expiration READY du Gateway">
    OpenClaw attend l’événement `READY` du Gateway Discord au démarrage et après les reconnexions à l’exécution. Les configurations à comptes multiples avec échelonnement du démarrage peuvent nécessiter une fenêtre READY de démarrage plus longue que la valeur par défaut.

    Paramètres de délai d’expiration READY :

    - démarrage, compte unique : `channels.discord.gatewayReadyTimeoutMs`
    - démarrage, comptes multiples : `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - repli par variable d’environnement au démarrage lorsque la configuration n’est pas définie : `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - valeur par défaut au démarrage : `15000` (15 secondes), max : `120000`
    - exécution, compte unique : `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - exécution, comptes multiples : `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - repli par variable d’environnement à l’exécution lorsque la configuration n’est pas définie : `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - valeur par défaut à l’exécution : `30000` (30 secondes), max : `120000`

  </Accordion>

  <Accordion title="Incohérences d’audit des permissions">
    Les vérifications de permissions `channels status --probe` ne fonctionnent que pour les ID de canal numériques.

    Si vous utilisez des clés slug, la correspondance à l’exécution peut toujours fonctionner, mais la sonde ne peut pas vérifier entièrement les permissions.

  </Accordion>

  <Accordion title="Problèmes de MP et d’appairage">

    - MP désactivés : `channels.discord.dm.enabled=false`
    - stratégie de MP désactivée : `channels.discord.dmPolicy="disabled"` (hérité : `channels.discord.dm.policy`)
    - attente de l’approbation d’appairage en mode `pairing`

  </Accordion>

  <Accordion title="Boucles de bot à bot">
    Par défaut, les messages rédigés par des bots sont ignorés.

    Si vous définissez `channels.discord.allowBots=true`, utilisez des règles strictes de mention et de liste d’autorisation pour éviter les comportements de boucle.
    Préférez `channels.discord.allowBots="mentions"` pour accepter uniquement les messages de bots qui mentionnent le bot.

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

  <Accordion title="Pertes STT vocales avec DecryptionFailed(...)">

    - gardez OpenClaw à jour (`openclaw update`) afin que la logique de récupération de réception vocale Discord soit présente
    - confirmez `channels.discord.voice.daveEncryption=true` (par défaut)
    - commencez avec `channels.discord.voice.decryptionFailureTolerance=24` (valeur par défaut en amont) et ajustez uniquement si nécessaire
    - surveillez les journaux pour :
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - si les échecs continuent après une reconnexion automatique, collectez les journaux et comparez-les à l’historique de réception DAVE en amont dans [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) et [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Référence de configuration

Référence principale : [Référence de configuration - Discord](/fr/gateway/config-channels#discord).

<Accordion title="Champs Discord à signal fort">

- démarrage/authentification : `enabled`, `token`, `accounts.*`, `allowBots`
- stratégie : `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- commande : `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- file d’événements : `eventQueue.listenerTimeout` (budget de l’écouteur), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway : `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- réponse/historique : `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- livraison : `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming : `streaming` (alias hérité : `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- médias/nouvelle tentative : `mediaMaxMb` (plafonne les téléversements Discord sortants, valeur par défaut `100MB`), `retry`
- actions : `actions.*`
- présence : `activity`, `status`, `activityType`, `activityUrl`
- UI : `ui.components.accentColor`
- fonctionnalités : `threadBindings`, `bindings[]` au niveau supérieur (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Sécurité et opérations

- Traitez les jetons de bot comme des secrets (`DISCORD_BOT_TOKEN` est recommandé dans les environnements supervisés).
- Accordez les permissions Discord minimales nécessaires.
- Si le déploiement ou l’état des commandes est obsolète, redémarrez le Gateway et revérifiez avec `openclaw channels status --probe`.

## Connexe

<CardGroup cols={2}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    Appairer un utilisateur Discord au Gateway.
  </Card>
  <Card title="Groupes" icon="users" href="/fr/channels/groups">
    Comportement des discussions de groupe et des listes d’autorisation.
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
