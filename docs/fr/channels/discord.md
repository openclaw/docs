---
read_when:
    - Travail sur les fonctionnalités du canal Discord
summary: Statut de la prise en charge du bot Discord, capacités et configuration
title: Discord
x-i18n:
    generated_at: "2026-04-22T04:20:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 613ae39bc4b8c5661cbaab4f70a57af584f296581c3ce54ddaef0feab44e7e42
    source_path: channels/discord.md
    workflow: 15
---

# Discord (API Bot)

Statut : prêt pour les MP et les canaux de serveur via la passerelle Discord officielle.

<CardGroup cols={3}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    Les MP Discord utilisent par défaut le mode d’appairage.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/fr/tools/slash-commands">
    Comportement natif des commandes et catalogue de commandes.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostic multi-canaux et flux de réparation.
  </Card>
</CardGroup>

## Configuration rapide

Vous devrez créer une nouvelle application avec un bot, ajouter le bot à votre serveur, puis l’appairer à OpenClaw. Nous vous recommandons d’ajouter votre bot à votre propre serveur privé. Si vous n’en avez pas encore, [créez-en d’abord un](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (choisissez **Create My Own > For me and my friends**).

<Steps>
  <Step title="Créer une application Discord et un bot">
    Accédez au [Portail des développeurs Discord](https://discord.com/developers/applications) et cliquez sur **New Application**. Donnez-lui un nom comme « OpenClaw ».

    Cliquez sur **Bot** dans la barre latérale. Définissez le **Username** sur le nom que vous donnez à votre agent OpenClaw.

  </Step>

  <Step title="Activer les intents privilégiés">
    Toujours sur la page **Bot**, faites défiler jusqu’à **Privileged Gateway Intents** et activez :

    - **Message Content Intent** (obligatoire)
    - **Server Members Intent** (recommandé ; obligatoire pour les listes d’autorisations de rôles et la correspondance nom-vers-ID)
    - **Presence Intent** (facultatif ; nécessaire uniquement pour les mises à jour de présence)

  </Step>

  <Step title="Copier le jeton de votre bot">
    Revenez en haut de la page **Bot** et cliquez sur **Reset Token**.

    <Note>
    Malgré le nom, cela génère votre premier jeton — rien n’est « réinitialisé ».
    </Note>

    Copiez le jeton et enregistrez-le quelque part. Il s’agit de votre **Bot Token** et vous en aurez besoin sous peu.

  </Step>

  <Step title="Générer une URL d’invitation et ajouter le bot à votre serveur">
    Cliquez sur **OAuth2** dans la barre latérale. Vous allez générer une URL d’invitation avec les bonnes autorisations pour ajouter le bot à votre serveur.

    Faites défiler jusqu’à **OAuth2 URL Generator** et activez :

    - `bot`
    - `applications.commands`

    Une section **Bot Permissions** apparaîtra en dessous. Activez :

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (facultatif)

    Copiez l’URL générée en bas, collez-la dans votre navigateur, sélectionnez votre serveur, puis cliquez sur **Continue** pour vous connecter. Vous devriez maintenant voir votre bot dans le serveur Discord.

  </Step>

  <Step title="Activer le mode développeur et récupérer vos ID">
    De retour dans l’application Discord, vous devez activer le mode développeur afin de pouvoir copier les ID internes.

    1. Cliquez sur **User Settings** (icône d’engrenage à côté de votre avatar) → **Advanced** → activez **Developer Mode**
    2. Faites un clic droit sur l’**icône de votre serveur** dans la barre latérale → **Copy Server ID**
    3. Faites un clic droit sur **votre propre avatar** → **Copy User ID**

    Enregistrez votre **Server ID** et votre **User ID** avec votre Bot Token — vous enverrez les trois à OpenClaw à l’étape suivante.

  </Step>

  <Step title="Autoriser les MP provenant des membres du serveur">
    Pour que l’appairage fonctionne, Discord doit autoriser votre bot à vous envoyer des MP. Faites un clic droit sur l’**icône de votre serveur** → **Privacy Settings** → activez **Direct Messages**.

    Cela permet aux membres du serveur (y compris les bots) de vous envoyer des MP. Gardez cette option activée si vous souhaitez utiliser les MP Discord avec OpenClaw. Si vous prévoyez d’utiliser uniquement les canaux de serveur, vous pouvez désactiver les MP après l’appairage.

  </Step>

  <Step title="Définir votre jeton de bot de manière sécurisée (ne l’envoyez pas dans le chat)">
    Le jeton de votre bot Discord est un secret (comme un mot de passe). Définissez-le sur la machine qui exécute OpenClaw avant d’envoyer un message à votre agent.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Si OpenClaw s’exécute déjà comme service en arrière-plan, redémarrez-le via l’app Mac OpenClaw ou en arrêtant puis en redémarrant le processus `openclaw gateway run`.

  </Step>

  <Step title="Configurer OpenClaw et appairer">

    <Tabs>
      <Tab title="Demandez à votre agent">
        Discutez avec votre agent OpenClaw sur n’importe quel canal existant (par ex. Telegram) et dites-lui. Si Discord est votre premier canal, utilisez plutôt l’onglet CLI / config.

        > "J’ai déjà défini mon jeton de bot Discord dans la configuration. Veuillez terminer la configuration de Discord avec l’User ID `<user_id>` et le Server ID `<server_id>`."
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

        Repli d’environnement pour le compte par défaut :

```bash
DISCORD_BOT_TOKEN=...
```

        Les valeurs `token` en texte brut sont prises en charge. Les valeurs SecretRef sont également prises en charge pour `channels.discord.token` avec les fournisseurs env/file/exec. Voir [Gestion des secrets](/fr/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Approuver le premier appairage par MP">
    Attendez que la passerelle soit en cours d’exécution, puis envoyez un MP à votre bot dans Discord. Il répondra avec un code d’appairage.

    <Tabs>
      <Tab title="Demandez à votre agent">
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

    Vous devriez maintenant pouvoir discuter avec votre agent dans Discord via MP.

  </Step>
</Steps>

<Note>
La résolution du jeton tient compte du compte. Les valeurs de jeton dans la configuration ont priorité sur le repli d’environnement. `DISCORD_BOT_TOKEN` n’est utilisé que pour le compte par défaut.
Pour les appels sortants avancés (actions d’outil de message/canal), un `token` explicite par appel est utilisé pour cet appel. Cela s’applique aux actions de type envoi et lecture/sondage (par exemple read/search/fetch/thread/pins/permissions). Les paramètres de stratégie de compte et de nouvelle tentative proviennent toujours du compte sélectionné dans l’instantané d’exécution actif.
</Note>

## Recommandé : configurer un espace de travail de serveur

Une fois que les MP fonctionnent, vous pouvez configurer votre serveur Discord comme un espace de travail complet où chaque canal obtient sa propre session d’agent avec son propre contexte. Cela est recommandé pour les serveurs privés où il n’y a que vous et votre bot.

<Steps>
  <Step title="Ajouter votre serveur à la liste d’autorisations de serveurs">
    Cela permet à votre agent de répondre dans n’importe quel canal de votre serveur, et pas seulement dans les MP.

    <Tabs>
      <Tab title="Demandez à votre agent">
        > "Ajoute mon Server ID Discord `<server_id>` à la liste d’autorisations de serveurs"
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
    Par défaut, votre agent ne répond dans les canaux de serveur que lorsqu’il est @mentionné. Pour un serveur privé, vous voudrez probablement qu’il réponde à chaque message.

    <Tabs>
      <Tab title="Demandez à votre agent">
        > "Autorise mon agent à répondre sur ce serveur sans avoir besoin d’être @mentionné"
      </Tab>
      <Tab title="Config">
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

      </Tab>
    </Tabs>

  </Step>

  <Step title="Prévoir la mémoire dans les canaux de serveur">
    Par défaut, la mémoire à long terme (MEMORY.md) n’est chargée que dans les sessions MP. Les canaux de serveur ne chargent pas automatiquement MEMORY.md.

    <Tabs>
      <Tab title="Demandez à votre agent">
        > "Quand je pose des questions dans les canaux Discord, utilise memory_search ou memory_get si tu as besoin du contexte à long terme de MEMORY.md."
      </Tab>
      <Tab title="Manuel">
        Si vous avez besoin d’un contexte partagé dans chaque canal, placez les instructions stables dans `AGENTS.md` ou `USER.md` (ils sont injectés pour chaque session). Conservez les notes à long terme dans `MEMORY.md` et accédez-y à la demande avec les outils de mémoire.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Créez maintenant quelques canaux sur votre serveur Discord et commencez à discuter. Votre agent peut voir le nom du canal, et chaque canal reçoit sa propre session isolée — vous pouvez donc configurer `#coding`, `#home`, `#research` ou tout ce qui correspond à votre flux de travail.

## Modèle d’exécution

- La Gateway gère la connexion Discord.
- Le routage des réponses est déterministe : les réponses entrantes de Discord reviennent vers Discord.
- Par défaut (`session.dmScope=main`), les discussions directes partagent la session principale de l’agent (`agent:main:main`).
- Les canaux de serveur utilisent des clés de session isolées (`agent:<agentId>:discord:channel:<channelId>`).
- Les MP de groupe sont ignorés par défaut (`channels.discord.dm.groupEnabled=false`).
- Les commandes slash natives s’exécutent dans des sessions de commande isolées (`agent:<agentId>:discord:slash:<userId>`), tout en transportant `CommandTargetSessionKey` vers la session de conversation routée.

## Canaux de forum

Les canaux de forum et de média Discord n’acceptent que des publications de fil. OpenClaw prend en charge deux façons de les créer :

- Envoyez un message au parent du forum (`channel:<forumId>`) pour créer automatiquement un fil. Le titre du fil utilise la première ligne non vide de votre message.
- Utilisez `openclaw message thread create` pour créer directement un fil. Ne transmettez pas `--message-id` pour les canaux de forum.

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

OpenClaw prend en charge les conteneurs de composants Discord v2 pour les messages de l’agent. Utilisez l’outil de message avec une charge utile `components`. Les résultats d’interaction sont renvoyés à l’agent comme des messages entrants normaux et suivent les paramètres Discord `replyToMode` existants.

Blocs pris en charge :

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Les rangées d’actions autorisent jusqu’à 5 boutons ou un seul menu de sélection
- Types de sélection : `string`, `user`, `role`, `mentionable`, `channel`

Par défaut, les composants sont à usage unique. Définissez `components.reusable=true` pour autoriser l’utilisation multiple des boutons, sélections et formulaires jusqu’à leur expiration.

Pour restreindre les utilisateurs pouvant cliquer sur un bouton, définissez `allowedUsers` sur ce bouton (ID d’utilisateurs Discord, tags, ou `*`). Lorsque c’est configuré, les utilisateurs non correspondants reçoivent un refus éphémère.

Les commandes slash `/model` et `/models` ouvrent un sélecteur de modèle interactif avec des listes déroulantes de fournisseur et de modèle, ainsi qu’une étape Submit. La réponse du sélecteur est éphémère et seul l’utilisateur qui l’a invoqué peut l’utiliser.

Pièces jointes de fichiers :

- les blocs `file` doivent pointer vers une référence de pièce jointe (`attachment://<filename>`)
- fournissez la pièce jointe via `media`/`path`/`filePath` (fichier unique) ; utilisez `media-gallery` pour plusieurs fichiers
- utilisez `filename` pour remplacer le nom de téléversement lorsqu’il doit correspondre à la référence de pièce jointe

Formulaires modaux :

- ajoutez `components.modal` avec jusqu’à 5 champs
- types de champs : `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw ajoute automatiquement un bouton de déclenchement

Exemple :

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Texte de repli facultatif",
  components: {
    reusable: true,
    text: "Choisissez un chemin",
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

## Contrôle d’accès et routage

<Tabs>
  <Tab title="Politique de MP">
    `channels.discord.dmPolicy` contrôle l’accès aux MP (hérité : `channels.discord.dm.policy`) :

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `channels.discord.allowFrom` inclue `"*"` ; héritage : `channels.discord.dm.allowFrom`)
    - `disabled`

    Si la politique de MP n’est pas ouverte, les utilisateurs inconnus sont bloqués (ou invités à s’appairer en mode `pairing`).

    Priorité multi-comptes :

    - `channels.discord.accounts.default.allowFrom` s’applique uniquement au compte `default`.
    - Les comptes nommés héritent de `channels.discord.allowFrom` lorsque leur propre `allowFrom` n’est pas défini.
    - Les comptes nommés n’héritent pas de `channels.discord.accounts.default.allowFrom`.

    Format de cible MP pour la distribution :

    - `user:<id>`
    - mention `<@id>`

    Les ID numériques bruts sont ambigus et rejetés, sauf si un type de cible utilisateur/canal explicite est fourni.

  </Tab>

  <Tab title="Politique de serveur">
    La gestion des serveurs est contrôlée par `channels.discord.groupPolicy` :

    - `open`
    - `allowlist`
    - `disabled`

    La base sécurisée lorsque `channels.discord` existe est `allowlist`.

    Comportement de `allowlist` :

    - le serveur doit correspondre à `channels.discord.guilds` (`id` préféré, slug accepté)
    - listes d’autorisations facultatives pour l’expéditeur : `users` (ID stables recommandés) et `roles` (ID de rôle uniquement) ; si l’une ou l’autre est configurée, les expéditeurs sont autorisés lorsqu’ils correspondent à `users` OU `roles`
    - la correspondance directe par nom/tag est désactivée par défaut ; activez `channels.discord.dangerouslyAllowNameMatching: true` uniquement comme mode de compatibilité de dernier recours
    - les noms/tags sont pris en charge pour `users`, mais les ID sont plus sûrs ; `openclaw security audit` avertit lorsque des entrées nom/tag sont utilisées
    - si un serveur a `channels` configuré, les canaux non listés sont refusés
    - si un serveur n’a pas de bloc `channels`, tous les canaux de ce serveur en allowlist sont autorisés

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

    Si vous définissez uniquement `DISCORD_BOT_TOKEN` et ne créez pas de bloc `channels.discord`, le repli d’exécution est `groupPolicy="allowlist"` (avec un avertissement dans les journaux), même si `channels.defaults.groupPolicy` est `open`.

  </Tab>

  <Tab title="Mentions et MP de groupe">
    Les messages de serveur sont filtrés par mention par défaut.

    La détection des mentions inclut :

    - mention explicite du bot
    - motifs de mention configurés (`agents.list[].groupChat.mentionPatterns`, repli `messages.groupChat.mentionPatterns`)
    - comportement implicite de réponse-au-bot dans les cas pris en charge

    `requireMention` est configuré par serveur/canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` ignore facultativement les messages qui mentionnent un autre utilisateur/rôle mais pas le bot (hors @everyone/@here).

    MP de groupe :

    - par défaut : ignorés (`dm.groupEnabled=false`)
    - allowlist facultative via `dm.groupChannels` (ID de canal ou slugs)

  </Tab>
</Tabs>

### Routage d’agent basé sur les rôles

Utilisez `bindings[].match.roles` pour router les membres de serveur Discord vers différents agents selon l’ID de rôle. Les liaisons basées sur les rôles n’acceptent que des ID de rôle et sont évaluées après les liaisons pair ou pair-parent et avant les liaisons uniquement serveur. Si une liaison définit aussi d’autres champs de correspondance (par exemple `peer` + `guildId` + `roles`), tous les champs configurés doivent correspondre.

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

## Configuration du portail développeur

<AccordionGroup>
  <Accordion title="Créer une application et un bot">

    1. Portail des développeurs Discord -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. Copiez le jeton du bot

  </Accordion>

  <Accordion title="Intents privilégiés">
    Dans **Bot -> Privileged Gateway Intents**, activez :

    - Message Content Intent
    - Server Members Intent (recommandé)

    L’intent de présence est facultatif et n’est requis que si vous souhaitez recevoir des mises à jour de présence. Définir la présence du bot (`setPresence`) ne nécessite pas d’activer les mises à jour de présence pour les membres.

  </Accordion>

  <Accordion title="Scopes OAuth et autorisations de base">
    Générateur d’URL OAuth :

    - scopes : `bot`, `applications.commands`

    Autorisations de base typiques :

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (facultatif)

    Évitez `Administrator` sauf en cas de besoin explicite.

  </Accordion>

  <Accordion title="Copier les ID">
    Activez le mode développeur Discord, puis copiez :

    - ID du serveur
    - ID du canal
    - ID de l’utilisateur

    Préférez les ID numériques dans la configuration OpenClaw pour des audits et des sondages fiables.

  </Accordion>
</AccordionGroup>

## Commandes natives et authentification des commandes

- `commands.native` vaut par défaut `"auto"` et est activé pour Discord.
- Remplacement par canal : `channels.discord.commands.native`.
- `commands.native=false` efface explicitement les commandes natives Discord précédemment enregistrées.
- L’authentification des commandes natives utilise les mêmes allowlists/politiques Discord que la gestion normale des messages.
- Les commandes peuvent tout de même rester visibles dans l’interface Discord pour les utilisateurs non autorisés ; l’exécution applique toujours l’authentification OpenClaw et renvoie « non autorisé ».

Voir [Commandes slash](/fr/tools/slash-commands) pour le catalogue et le comportement des commandes.

Paramètres par défaut des commandes slash :

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

    Remarque : `off` désactive le fil de réponse implicite. Les balises explicites `[[reply_to_*]]` restent respectées.
    `first` attache toujours la référence de réponse native implicite au premier message Discord sortant du tour.
    `batched` n’attache la référence de réponse native implicite de Discord que lorsque le tour entrant était un lot débouncé de plusieurs messages. Cela est utile si vous souhaitez des réponses natives principalement pour les discussions ambiguës et rapides, et non pour chaque tour à message unique.

    Les ID de message sont exposés dans le contexte/l’historique afin que les agents puissent cibler des messages spécifiques.

  </Accordion>

  <Accordion title="Aperçu du flux en direct">
    OpenClaw peut diffuser les réponses brouillon en envoyant un message temporaire et en le modifiant à mesure que le texte arrive.

    - `channels.discord.streaming` contrôle le flux d’aperçu (`off` | `partial` | `block` | `progress`, par défaut : `off`).
    - La valeur par défaut reste `off` car les modifications d’aperçu Discord peuvent rapidement atteindre les limites de débit, en particulier lorsque plusieurs bots ou passerelles partagent le même compte ou le même trafic de serveur.
    - `progress` est accepté pour la cohérence inter-canaux et correspond à `partial` sur Discord.
    - `channels.discord.streamMode` est un alias hérité et est migré automatiquement.
    - `partial` modifie un seul message d’aperçu à mesure que les tokens arrivent.
    - `block` émet des blocs de taille brouillon (utilisez `draftChunk` pour ajuster la taille et les points de coupure).
    - Les réponses média, d’erreur et de réponse explicite annulent les modifications d’aperçu en attente sans vider un brouillon temporaire avant la distribution normale.
    - `streaming.preview.toolProgress` contrôle si les mises à jour d’outil/progression réutilisent le même message d’aperçu brouillon (par défaut : `true`). Définissez `false` pour conserver des messages d’outil/progression séparés.

    Exemple :

```json5
{
  channels: {
    discord: {
      streaming: "partial",
    },
  },
}
```

    Valeurs par défaut de découpage en blocs du mode `block` (limitées par `channels.discord.textChunkLimit`) :

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

    Le flux d’aperçu est réservé au texte ; les réponses média reviennent à la distribution normale.

    Remarque : le flux d’aperçu est distinct du flux par blocs. Lorsque le flux par blocs est explicitement activé pour Discord, OpenClaw ignore le flux d’aperçu afin d’éviter une double diffusion.

  </Accordion>

  <Accordion title="Historique, contexte et comportement des fils">
    Contexte d’historique de serveur :

    - `channels.discord.historyLimit` par défaut `20`
    - repli : `messages.groupChat.historyLimit`
    - `0` désactive

    Contrôles d’historique des MP :

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportement des fils :

    - les fils Discord sont routés comme des sessions de canal
    - les métadonnées du fil parent peuvent être utilisées pour le lien de session parente
    - la configuration du fil hérite de celle du canal parent, sauf si une entrée spécifique au fil existe

    Les sujets de canal sont injectés comme contexte **non fiable** (et non comme prompt système).
    Le contexte des réponses et des messages cités reste actuellement tel qu’il est reçu.
    Les allowlists Discord servent principalement à filtrer qui peut déclencher l’agent, et non de frontière complète de masquage du contexte supplémentaire.

  </Accordion>

  <Accordion title="Sessions liées à un fil pour les sous-agents">
    Discord peut lier un fil à une cible de session afin que les messages suivants dans ce fil continuent d’être routés vers la même session (y compris les sessions de sous-agent).

    Commandes :

    - `/focus <target>` lie le fil actuel/nouveau à une cible de sous-agent/session
    - `/unfocus` supprime la liaison du fil actuel
    - `/agents` affiche les exécutions actives et l’état des liaisons
    - `/session idle <duration|off>` inspecte/met à jour le retrait automatique du focus après inactivité pour les liaisons focalisées
    - `/session max-age <duration|off>` inspecte/met à jour l’âge maximal strict pour les liaisons focalisées

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
        spawnSubagentSessions: false, // activation explicite
      },
    },
  },
}
```

    Remarques :

    - `session.threadBindings.*` définit les valeurs par défaut globales.
    - `channels.discord.threadBindings.*` remplace le comportement Discord.
    - `spawnSubagentSessions` doit être à true pour créer/lier automatiquement des fils pour `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` doit être à true pour créer/lier automatiquement des fils pour ACP (`/acp spawn ... --thread ...` ou `sessions_spawn({ runtime: "acp", thread: true })`).
    - Si les liaisons de fil sont désactivées pour un compte, `/focus` et les opérations liées aux liaisons de fil ne sont pas disponibles.

    Voir [Sous-agents](/fr/tools/subagents), [Agents ACP](/fr/tools/acp-agents) et [Référence de configuration](/fr/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Liaisons de canal ACP persistantes">
    Pour des espaces de travail ACP stables « toujours actifs », configurez des liaisons ACP typées au niveau supérieur ciblant des conversations Discord.

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

    - `/acp spawn codex --bind here` lie le canal ou le fil Discord actuel sur place et maintient le routage des messages futurs vers la même session ACP.
    - Cela peut toujours signifier « démarrer une nouvelle session ACP Codex », mais cela ne crée pas en soi un nouveau fil Discord. Le canal existant reste la surface de discussion.
    - Codex peut toujours s’exécuter dans son propre `cwd` ou espace de travail backend sur disque. Cet espace de travail est un état d’exécution, pas un fil Discord.
    - Les messages de fil peuvent hériter de la liaison ACP du canal parent.
    - Dans un canal ou fil lié, `/new` et `/reset` réinitialisent la même session ACP sur place.
    - Les liaisons de fil temporaires fonctionnent toujours et peuvent remplacer la résolution de cible lorsqu’elles sont actives.
    - `spawnAcpSessions` n’est requis que lorsque OpenClaw doit créer/lier un fil enfant via `--thread auto|here`. Il n’est pas requis pour `/acp spawn ... --bind here` dans le canal actuel.

    Voir [Agents ACP](/fr/tools/acp-agents) pour les détails du comportement des liaisons.

  </Accordion>

  <Accordion title="Notifications de réaction">
    Mode de notification de réaction par serveur :

    - `off`
    - `own` (par défaut)
    - `all`
    - `allowlist` (utilise `guilds.<id>.users`)

    Les événements de réaction sont transformés en événements système et joints à la session Discord routée.

  </Accordion>

  <Accordion title="Réactions d’accusé de réception">
    `ackReaction` envoie un emoji d’accusé de réception pendant qu’OpenClaw traite un message entrant.

    Ordre de résolution :

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - repli sur l’emoji d’identité de l’agent (`agents.list[].identity.emoji`, sinon "👀")

    Remarques :

    - Discord accepte les emoji unicode ou les noms d’emoji personnalisés.
    - Utilisez `""` pour désactiver la réaction pour un canal ou un compte.

  </Accordion>

  <Accordion title="Écritures de configuration">
    Les écritures de configuration initiées depuis le canal sont activées par défaut.

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
    Routez le trafic WebSocket de la Gateway Discord et les recherches REST au démarrage (ID d’application + résolution d’allowlist) via un proxy HTTP(S) avec `channels.discord.proxy`.

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
    Activez la résolution PluralKit pour mapper les messages proxifiés à l’identité du membre du système :

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

    - les allowlists peuvent utiliser `pk:<memberId>`
    - les noms d’affichage des membres correspondent par nom/slug uniquement lorsque `channels.discord.dangerouslyAllowNameMatching: true`
    - les recherches utilisent l’ID du message d’origine et sont limitées par une fenêtre temporelle
    - si la recherche échoue, les messages proxifiés sont traités comme des messages de bot et ignorés sauf si `allowBots=true`

  </Accordion>

  <Accordion title="Configuration de la présence">
    Les mises à jour de présence sont appliquées lorsque vous définissez un statut ou un champ d’activité, ou lorsque vous activez la présence automatique.

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
      activity: "Temps de concentration",
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

    - 0 : Playing
    - 1 : Streaming (nécessite `activityUrl`)
    - 2 : Listening
    - 3 : Watching
    - 4 : Custom (utilise le texte d’activité comme état du statut ; l’emoji est facultatif)
    - 5 : Competing

    Exemple de présence automatique (signal de santé d’exécution) :

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

    La présence automatique mappe la disponibilité d’exécution au statut Discord : sain => online, dégradé ou inconnu => idle, épuisé ou indisponible => dnd. Remplacements de texte facultatifs :

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (prend en charge l’espace réservé `{reason}`)

  </Accordion>

  <Accordion title="Approbations dans Discord">
    Discord prend en charge la gestion des approbations par boutons en MP et peut facultativement publier les invites d’approbation dans le canal d’origine.

    Chemin de configuration :

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (facultatif ; utilise `commands.ownerAllowFrom` en repli lorsque c’est possible)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, par défaut : `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord active automatiquement les approbations exec natives lorsque `enabled` n’est pas défini ou vaut `"auto"` et qu’au moins un approbateur peut être résolu, soit depuis `execApprovals.approvers`, soit depuis `commands.ownerAllowFrom`. Discord ne déduit pas les approbateurs exec à partir de `allowFrom` du canal, de l’ancien `dm.allowFrom` ni de `defaultTo` des messages directs. Définissez `enabled: false` pour désactiver explicitement Discord comme client d’approbation natif.

    Lorsque `target` vaut `channel` ou `both`, l’invite d’approbation est visible dans le canal. Seuls les approbateurs résolus peuvent utiliser les boutons ; les autres utilisateurs reçoivent un refus éphémère. Les invites d’approbation incluent le texte de commande, donc n’activez la distribution dans le canal que dans des canaux de confiance. Si l’ID du canal ne peut pas être dérivé de la clé de session, OpenClaw revient à la distribution en MP.

    Discord affiche également les boutons d’approbation partagés utilisés par d’autres canaux de discussion. L’adaptateur natif Discord ajoute principalement le routage en MP des approbateurs et la diffusion vers le canal.
    Lorsque ces boutons sont présents, ils constituent l’UX d’approbation principale ; OpenClaw
    ne doit inclure une commande manuelle `/approve` que lorsque le résultat de l’outil indique
    que les approbations dans le chat ne sont pas disponibles ou que l’approbation manuelle est la seule voie possible.

    L’authentification Gateway pour ce gestionnaire utilise le même contrat partagé de résolution des identifiants que les autres clients Gateway :

    - authentification locale priorité-env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` puis `gateway.auth.*`)
    - en mode local, `gateway.remote.*` peut être utilisé comme repli uniquement lorsque `gateway.auth.*` n’est pas défini ; les SecretRef locaux configurés mais non résolus échouent en mode fermé
    - prise en charge du mode distant via `gateway.remote.*` le cas échéant
    - les remplacements d’URL sont sûrs vis-à-vis des remplacements : les remplacements CLI ne réutilisent pas d’identifiants implicites, et les remplacements d’environnement utilisent uniquement des identifiants d’environnement

    Comportement de résolution des approbations :

    - Les ID préfixés par `plugin:` sont résolus via `plugin.approval.resolve`.
    - Les autres ID sont résolus via `exec.approval.resolve`.
    - Discord n’effectue pas ici de saut de repli exec-vers-plugin supplémentaire ; le préfixe
      de l’ID décide de la méthode Gateway appelée.

    Les approbations exec expirent après 30 minutes par défaut. Si les approbations échouent avec
    des ID d’approbation inconnus, vérifiez la résolution des approbateurs, l’activation de la fonctionnalité, et
    que le type d’ID d’approbation distribué correspond à la demande en attente.

    Documentation associée : [Approbations exec](/fr/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Outils et garde-fous d’action

Les actions de message Discord incluent la messagerie, l’administration des canaux, la modération, la présence et les actions sur les métadonnées.

Exemples principaux :

- messagerie : `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- réactions : `react`, `reactions`, `emojiList`
- modération : `timeout`, `kick`, `ban`
- présence : `setPresence`

L’action `event-create` accepte un paramètre facultatif `image` (URL ou chemin de fichier local) pour définir l’image de couverture de l’événement planifié.

Les garde-fous d’action se trouvent sous `channels.discord.actions.*`.

Comportement par défaut des garde-fous :

| Groupe d’actions                                                                                                                                                         | Par défaut |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | activé     |
| roles                                                                                                                                                                    | désactivé  |
| moderation                                                                                                                                                               | désactivé  |
| presence                                                                                                                                                                 | désactivé  |

## Interface Components v2

OpenClaw utilise les components v2 de Discord pour les approbations exec et les marqueurs inter-contexte. Les actions de message Discord peuvent également accepter `components` pour une interface personnalisée (avancé ; nécessite la construction d’une charge utile de composant via l’outil Discord), tandis que les `embeds` hérités restent disponibles mais ne sont pas recommandés.

- `channels.discord.ui.components.accentColor` définit la couleur d’accent utilisée par les conteneurs de composants Discord (hex).
- Définition par compte avec `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` sont ignorés lorsque des components v2 sont présents.

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

## Canaux vocaux

OpenClaw peut rejoindre des canaux vocaux Discord pour des conversations continues en temps réel. Cela est distinct des pièces jointes de messages vocaux.

Exigences :

- Activez les commandes natives (`commands.native` ou `channels.discord.commands.native`).
- Configurez `channels.discord.voice`.
- Le bot a besoin des autorisations Connect + Speak dans le canal vocal cible.

Utilisez la commande native propre à Discord `/vc join|leave|status` pour contrôler les sessions. La commande utilise l’agent par défaut du compte et suit les mêmes règles d’allowlist et de politique de groupe que les autres commandes Discord.

Exemple de jonction automatique :

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

Remarques :

- `voice.tts` remplace `messages.tts` pour la lecture vocale uniquement.
- Les tours de transcription vocale dérivent le statut de propriétaire à partir de Discord `allowFrom` (ou `dm.allowFrom`) ; les locuteurs non propriétaires ne peuvent pas accéder aux outils réservés au propriétaire (par exemple `gateway` et `cron`).
- La voix est activée par défaut ; définissez `channels.discord.voice.enabled=false` pour la désactiver.
- `voice.daveEncryption` et `voice.decryptionFailureTolerance` sont transmis aux options de jonction de `@discordjs/voice`.
- Les valeurs par défaut de `@discordjs/voice` sont `daveEncryption=true` et `decryptionFailureTolerance=24` si elles ne sont pas définies.
- OpenClaw surveille également les échecs de déchiffrement à la réception et récupère automatiquement en quittant puis en rejoignant de nouveau le canal vocal après des échecs répétés dans une courte fenêtre.
- Si les journaux de réception affichent à plusieurs reprises `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, il peut s’agir du bug de réception amont de `@discordjs/voice` suivi dans [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

## Messages vocaux

Les messages vocaux Discord affichent un aperçu de forme d’onde et nécessitent un audio OGG/Opus ainsi que des métadonnées. OpenClaw génère automatiquement la forme d’onde, mais nécessite que `ffmpeg` et `ffprobe` soient disponibles sur l’hôte de la gateway pour inspecter et convertir les fichiers audio.

Exigences et contraintes :

- Fournissez un **chemin de fichier local** (les URL sont rejetées).
- Omettez le contenu texte (Discord n’autorise pas texte + message vocal dans la même charge utile).
- Tout format audio est accepté ; OpenClaw convertit en OGG/Opus si nécessaire.

Exemple :

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Dépannage

<AccordionGroup>
  <Accordion title="Intents non autorisés utilisés ou le bot ne voit aucun message de serveur">

    - activez Message Content Intent
    - activez Server Members Intent lorsque vous dépendez de la résolution utilisateur/membre
    - redémarrez la gateway après avoir modifié les intents

  </Accordion>

  <Accordion title="Messages de serveur bloqués de façon inattendue">

    - vérifiez `groupPolicy`
    - vérifiez l’allowlist du serveur sous `channels.discord.guilds`
    - si la map `channels` du serveur existe, seuls les canaux listés sont autorisés
    - vérifiez le comportement de `requireMention` et les motifs de mention

    Vérifications utiles :

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention est à false mais reste bloqué">
    Causes fréquentes :

    - `groupPolicy="allowlist"` sans allowlist serveur/canal correspondante
    - `requireMention` configuré au mauvais endroit (doit être sous `channels.discord.guilds` ou sous l’entrée du canal)
    - expéditeur bloqué par l’allowlist `users` du serveur/canal

  </Accordion>

  <Accordion title="Les gestionnaires longue durée expirent ou dupliquent les réponses">

    Journaux typiques :

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Paramètre de budget du listener :

    - compte unique : `channels.discord.eventQueue.listenerTimeout`
    - multi-comptes : `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Paramètre de délai d’expiration d’exécution du worker :

    - compte unique : `channels.discord.inboundWorker.runTimeoutMs`
    - multi-comptes : `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - par défaut : `1800000` (30 minutes) ; définissez `0` pour désactiver

    Base recommandée :

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    Utilisez `eventQueue.listenerTimeout` pour une initialisation lente du listener et `inboundWorker.runTimeoutMs`
    uniquement si vous souhaitez une soupape de sécurité distincte pour les tours d’agent en file d’attente.

  </Accordion>

  <Accordion title="Incohérences d’audit des autorisations">
    Les vérifications d’autorisations de `channels status --probe` ne fonctionnent que pour les ID de canal numériques.

    Si vous utilisez des clés slug, la correspondance à l’exécution peut toujours fonctionner, mais la sonde ne peut pas vérifier complètement les autorisations.

  </Accordion>

  <Accordion title="Problèmes de MP et d’appairage">

    - MP désactivés : `channels.discord.dm.enabled=false`
    - politique de MP désactivée : `channels.discord.dmPolicy="disabled"` (hérité : `channels.discord.dm.policy`)
    - en attente d’approbation d’appairage en mode `pairing`

  </Accordion>

  <Accordion title="Boucles bot à bot">
    Par défaut, les messages rédigés par des bots sont ignorés.

    Si vous définissez `channels.discord.allowBots=true`, utilisez des règles strictes de mention et d’allowlist pour éviter les comportements en boucle.
    Préférez `channels.discord.allowBots="mentions"` pour n’accepter que les messages de bots qui mentionnent le bot.

  </Accordion>

  <Accordion title="La STT vocale tombe avec DecryptionFailed(...)">

    - gardez OpenClaw à jour (`openclaw update`) afin que la logique de récupération de réception vocale Discord soit présente
    - confirmez `channels.discord.voice.daveEncryption=true` (par défaut)
    - partez de `channels.discord.voice.decryptionFailureTolerance=24` (valeur par défaut amont) et ajustez uniquement si nécessaire
    - surveillez les journaux pour :
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - si les échecs persistent après la reconnexion automatique, collectez les journaux et comparez-les à [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Pointeurs vers la référence de configuration

Référence principale :

- [Référence de configuration - Discord](/fr/gateway/configuration-reference#discord)

Champs Discord à fort signal :

- démarrage/auth : `enabled`, `token`, `accounts.*`, `allowBots`
- politique : `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- commande : `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- file d’événements : `eventQueue.listenerTimeout` (budget du listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- worker entrant : `inboundWorker.runTimeoutMs`
- réponse/historique : `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- distribution : `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming : `streaming` (alias hérité : `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- média/nouvelle tentative : `mediaMaxMb`, `retry`
  - `mediaMaxMb` limite les téléversements Discord sortants (par défaut : `100MB`)
- actions : `actions.*`
- présence : `activity`, `status`, `activityType`, `activityUrl`
- interface : `ui.components.accentColor`
- fonctionnalités : `threadBindings`, `bindings[]` de niveau supérieur (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Sécurité et opérations

- Traitez les jetons de bot comme des secrets (`DISCORD_BOT_TOKEN` est préférable dans les environnements supervisés).
- Accordez le minimum de privilèges Discord nécessaire.
- Si le déploiement/l’état des commandes est obsolète, redémarrez la gateway et revérifiez avec `openclaw channels status --probe`.

## Liens associés

- [Appairage](/fr/channels/pairing)
- [Groupes](/fr/channels/groups)
- [Routage de canal](/fr/channels/channel-routing)
- [Sécurité](/fr/gateway/security)
- [Routage multi-agents](/fr/concepts/multi-agent)
- [Dépannage](/fr/channels/troubleshooting)
- [Commandes slash](/fr/tools/slash-commands)
