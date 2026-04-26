---
read_when:
    - Travail sur les fonctionnalités du canal Discord
summary: État de la prise en charge du bot Discord, capacités et configuration
title: Discord
x-i18n:
    generated_at: "2026-04-26T11:22:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68f4e1885aab2438c38ef3735b752968b7e1ed70795d1c3903fad20ff183d3ca
    source_path: channels/discord.md
    workflow: 15
---

Prêt pour les messages privés et les canaux de serveur via la passerelle Discord officielle.

<CardGroup cols={3}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    Les messages privés Discord utilisent par défaut le mode d’appairage.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/fr/tools/slash-commands">
    Comportement natif des commandes et catalogue de commandes.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics inter-canaux et flux de réparation.
  </Card>
</CardGroup>

## Configuration rapide

Vous devrez créer une nouvelle application avec un bot, ajouter le bot à votre serveur et l’appairer à OpenClaw. Nous recommandons d’ajouter votre bot à votre propre serveur privé. Si vous n’en avez pas encore, [créez-en un d’abord](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (choisissez **Create My Own > For me and my friends**).

<Steps>
  <Step title="Créer une application Discord et un bot">
    Accédez au [Portail développeur Discord](https://discord.com/developers/applications) et cliquez sur **New Application**. Donnez-lui un nom comme « OpenClaw ».

    Cliquez sur **Bot** dans la barre latérale. Définissez le **Username** sur le nom que vous donnez à votre agent OpenClaw.

  </Step>

  <Step title="Activer les intents privilégiés">
    Toujours sur la page **Bot**, faites défiler jusqu’à **Privileged Gateway Intents** et activez :

    - **Message Content Intent** (obligatoire)
    - **Server Members Intent** (recommandé ; obligatoire pour les listes d’autorisations de rôles et la correspondance nom-vers-ID)
    - **Presence Intent** (facultatif ; nécessaire uniquement pour les mises à jour de présence)

  </Step>

  <Step title="Copier le jeton de votre bot">
    Revenez en haut de la page **Bot** et cliquez sur **Reset Token**.

    <Note>
    Malgré son nom, cela génère votre premier jeton — rien n’est « réinitialisé ».
    </Note>

    Copiez le jeton et enregistrez-le quelque part. C’est votre **Bot Token** et vous en aurez besoin sous peu.

  </Step>

  <Step title="Générer une URL d’invitation et ajouter le bot à votre serveur">
    Cliquez sur **OAuth2** dans la barre latérale. Vous allez générer une URL d’invitation avec les bonnes autorisations pour ajouter le bot à votre serveur.

    Faites défiler jusqu’à **OAuth2 URL Generator** et activez :

    - `bot`
    - `applications.commands`

    Une section **Bot Permissions** apparaîtra en dessous. Activez au minimum :

    **Autorisations générales**
      - Voir les canaux
    **Autorisations de texte**
      - Envoyer des messages
      - Lire l’historique des messages
      - Intégrer des liens
      - Joindre des fichiers
      - Ajouter des réactions (facultatif)

    Il s’agit de l’ensemble de base pour les canaux textuels normaux. Si vous prévoyez de publier dans des fils Discord, y compris des workflows de canaux forum ou média qui créent ou poursuivent un fil, activez également **Send Messages in Threads**.
    Copiez l’URL générée en bas, collez-la dans votre navigateur, sélectionnez votre serveur et cliquez sur **Continue** pour vous connecter. Vous devriez maintenant voir votre bot dans le serveur Discord.

  </Step>

  <Step title="Activer le mode développeur et récupérer vos identifiants">
    De retour dans l’application Discord, vous devez activer le mode développeur afin de pouvoir copier les identifiants internes.

    1. Cliquez sur **User Settings** (icône d’engrenage à côté de votre avatar) → **Advanced** → activez **Developer Mode**
    2. Faites un clic droit sur l’**icône de votre serveur** dans la barre latérale → **Copy Server ID**
    3. Faites un clic droit sur **votre propre avatar** → **Copy User ID**

    Enregistrez votre **Server ID** et votre **User ID** avec votre Bot Token — vous enverrez les trois à OpenClaw à l’étape suivante.

  </Step>

  <Step title="Autoriser les messages privés des membres du serveur">
    Pour que l’appairage fonctionne, Discord doit autoriser votre bot à vous envoyer un message privé. Faites un clic droit sur l’**icône de votre serveur** → **Privacy Settings** → activez **Direct Messages**.

    Cela permet aux membres du serveur (y compris les bots) de vous envoyer des messages privés. Laissez cette option activée si vous souhaitez utiliser les messages privés Discord avec OpenClaw. Si vous prévoyez d’utiliser uniquement les canaux de serveur, vous pouvez désactiver les messages privés après l’appairage.

  </Step>

  <Step title="Définir le jeton de votre bot de manière sécurisée (ne l’envoyez pas dans le chat)">
    Le jeton de votre bot Discord est un secret (comme un mot de passe). Définissez-le sur la machine qui exécute OpenClaw avant d’envoyer un message à votre agent.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Si OpenClaw s’exécute déjà comme service en arrière-plan, redémarrez-le via l’application OpenClaw Mac ou en arrêtant puis en redémarrant le processus `openclaw gateway run`.

  </Step>

  <Step title="Configurer OpenClaw et appairer">

    <Tabs>
      <Tab title="Demander à votre agent">
        Discutez avec votre agent OpenClaw sur n’importe quel canal existant (par exemple Telegram) et dites-lui. Si Discord est votre premier canal, utilisez plutôt l’onglet CLI / config.

        > "J’ai déjà défini mon jeton de bot Discord dans la configuration. Veuillez terminer la configuration de Discord avec l’User ID `<user_id>` et le Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Si vous préférez une configuration basée sur un fichier, définissez :

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

        Solution de repli env pour le compte par défaut :

```bash
DISCORD_BOT_TOKEN=...
```

        Les valeurs `token` en texte brut sont prises en charge. Les valeurs SecretRef sont également prises en charge pour `channels.discord.token` via les fournisseurs env/file/exec. Voir [Gestion des secrets](/fr/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Approuver le premier appairage par message privé">
    Attendez que la Gateway soit en cours d’exécution, puis envoyez un message privé à votre bot dans Discord. Il répondra avec un code d’appairage.

    <Tabs>
      <Tab title="Demander à votre agent">
        Envoyez le code d’appairage à votre agent sur votre canal existant :

        > "Approuve ce code d’appairage Discord : `<CODE>`"
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
La résolution de jeton tient compte du compte. Les valeurs de jeton dans la configuration priment sur la solution de repli env. `DISCORD_BOT_TOKEN` n’est utilisé que pour le compte par défaut.
Pour les appels sortants avancés (outil de message/actions de canal), un `token` explicite par appel est utilisé pour cet appel. Cela s’applique aux actions d’envoi ainsi qu’aux actions de type lecture/sondage (par exemple read/search/fetch/thread/pins/permissions). Les paramètres de politique de compte/de nouvelle tentative proviennent toujours du compte sélectionné dans l’instantané d’exécution actif.
</Note>

## Recommandé : configurer un espace de travail de serveur

Une fois que les messages privés fonctionnent, vous pouvez configurer votre serveur Discord comme un espace de travail complet où chaque canal obtient sa propre session d’agent avec son propre contexte. Cela est recommandé pour les serveurs privés où il n’y a que vous et votre bot.

<Steps>
  <Step title="Ajouter votre serveur à la liste d’autorisations des serveurs">
    Cela permet à votre agent de répondre dans n’importe quel canal de votre serveur, pas seulement en message privé.

    <Tabs>
      <Tab title="Demander à votre agent">
        > "Ajoute mon Server ID Discord `<server_id>` à la liste d’autorisations des serveurs"
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
    Par défaut, votre agent ne répond dans les canaux de serveur que lorsqu’il est mentionné avec @mention. Pour un serveur privé, vous voudrez probablement qu’il réponde à chaque message.

    <Tabs>
      <Tab title="Demander à votre agent">
        > "Autorise mon agent à répondre sur ce serveur sans avoir besoin d’être @mentionné"
      </Tab>
      <Tab title="Configuration">
        Définissez `requireMention: false` dans la configuration de votre serveur :

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
    Par défaut, la mémoire à long terme (MEMORY.md) n’est chargée que dans les sessions de messages privés. Les canaux de serveur ne chargent pas automatiquement MEMORY.md.

    <Tabs>
      <Tab title="Demander à votre agent">
        > "Lorsque je pose des questions dans les canaux Discord, utilise memory_search ou memory_get si tu as besoin de contexte à long terme depuis MEMORY.md."
      </Tab>
      <Tab title="Manuel">
        Si vous avez besoin d’un contexte partagé dans chaque canal, placez les instructions stables dans `AGENTS.md` ou `USER.md` (ils sont injectés dans chaque session). Conservez les notes à long terme dans `MEMORY.md` et accédez-y à la demande avec les outils de mémoire.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Créez maintenant quelques canaux sur votre serveur Discord et commencez à discuter. Votre agent peut voir le nom du canal, et chaque canal obtient sa propre session isolée — vous pouvez donc configurer `#coding`, `#home`, `#research` ou tout ce qui convient à votre workflow.

## Modèle d’exécution

- La Gateway gère la connexion Discord.
- Le routage des réponses est déterministe : les réponses entrantes de Discord repartent vers Discord.
- Les métadonnées de serveur/canal Discord sont ajoutées à l’invite du modèle comme contexte non fiable, et non comme préfixe de réponse visible par l’utilisateur. Si un modèle recopie cette enveloppe dans sa réponse, OpenClaw supprime les métadonnées recopiées des réponses sortantes et du futur contexte de relecture.
- Par défaut (`session.dmScope=main`), les conversations directes partagent la session principale de l’agent (`agent:main:main`).
- Les canaux de serveur utilisent des clés de session isolées (`agent:<agentId>:discord:channel:<channelId>`).
- Les messages privés de groupe sont ignorés par défaut (`channels.discord.dm.groupEnabled=false`).
- Les commandes slash natives s’exécutent dans des sessions de commande isolées (`agent:<agentId>:discord:slash:<userId>`), tout en transportant `CommandTargetSessionKey` vers la session de conversation routée.
- La diffusion d’annonces Cron/Heartbeat en texte seul vers Discord utilise une seule fois la réponse finale visible par l’assistant.
  Les charges utiles multimédias et les composants structurés restent en plusieurs messages lorsque l’agent émet plusieurs charges utiles distribuables.

## Canaux forum

Les canaux forum et média Discord n’acceptent que des publications sous forme de fil. OpenClaw prend en charge deux façons de les créer :

- Envoyer un message au parent du forum (`channel:<forumId>`) pour créer automatiquement un fil. Le titre du fil utilise la première ligne non vide de votre message.
- Utiliser `openclaw message thread create` pour créer un fil directement. Ne passez pas `--message-id` pour les canaux forum.

Exemple : envoyer au parent du forum pour créer un fil

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Exemple : créer explicitement un fil de forum

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Les parents de forum n’acceptent pas les composants Discord. Si vous avez besoin de composants, envoyez au fil lui-même (`channel:<threadId>`).

## Composants interactifs

OpenClaw prend en charge les conteneurs de composants Discord v2 pour les messages d’agent. Utilisez l’outil de message avec une charge utile `components`. Les résultats d’interaction sont renvoyés à l’agent comme des messages entrants normaux et suivent les paramètres Discord `replyToMode` existants.

Blocs pris en charge :

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Les lignes d’action autorisent jusqu’à 5 boutons ou un seul menu de sélection
- Types de sélection : `string`, `user`, `role`, `mentionable`, `channel`

Par défaut, les composants sont à usage unique. Définissez `components.reusable=true` pour permettre aux boutons, menus de sélection et formulaires d’être utilisés plusieurs fois jusqu’à leur expiration.

Pour restreindre qui peut cliquer sur un bouton, définissez `allowedUsers` sur ce bouton (ID d’utilisateur Discord, tags ou `*`). Lorsqu’il est configuré, les utilisateurs non correspondants reçoivent un refus éphémère.

Les commandes slash `/model` et `/models` ouvrent un sélecteur de modèle interactif avec des menus déroulants pour le fournisseur, le modèle et le runtime compatible, ainsi qu’une étape **Submit**. `/models add` est obsolète et renvoie désormais un message de dépréciation au lieu d’enregistrer des modèles depuis le chat. La réponse du sélecteur est éphémère et seul l’utilisateur qui l’a invoqué peut l’utiliser.

Pièces jointes de fichier :

- les blocs `file` doivent pointer vers une référence de pièce jointe (`attachment://<filename>`)
- fournissez la pièce jointe via `media`/`path`/`filePath` (fichier unique) ; utilisez `media-gallery` pour plusieurs fichiers
- utilisez `filename` pour remplacer le nom d’envoi lorsqu’il doit correspondre à la référence de pièce jointe

Formulaires modaux :

- ajoutez `components.modal` avec jusqu’à 5 champs
- types de champ : `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw ajoute automatiquement un bouton de déclenchement

Exemple :

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
    `channels.discord.dmPolicy` contrôle l’accès aux messages privés (hérité : `channels.discord.dm.policy`) :

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `channels.discord.allowFrom` inclue `"*"` ; hérité : `channels.discord.dm.allowFrom`)
    - `disabled`

    Si la politique des messages privés n’est pas ouverte, les utilisateurs inconnus sont bloqués (ou invités à s’appairer en mode `pairing`).

    Priorité multi-comptes :

    - `channels.discord.accounts.default.allowFrom` s’applique uniquement au compte `default`.
    - Les comptes nommés héritent de `channels.discord.allowFrom` lorsque leur propre `allowFrom` n’est pas défini.
    - Les comptes nommés n’héritent pas de `channels.discord.accounts.default.allowFrom`.

    Format de cible de message privé pour la distribution :

    - `user:<id>`
    - mention `<@id>`

    Les identifiants numériques bruts sont ambigus et rejetés sauf si un type de cible utilisateur/canal explicite est fourni.

  </Tab>

  <Tab title="Politique des serveurs">
    La gestion des serveurs est contrôlée par `channels.discord.groupPolicy` :

    - `open`
    - `allowlist`
    - `disabled`

    La base sécurisée lorsque `channels.discord` existe est `allowlist`.

    Comportement de `allowlist` :

    - le serveur doit correspondre à `channels.discord.guilds` (`id` préféré, slug accepté)
    - listes d’autorisations facultatives pour les expéditeurs : `users` (identifiants stables recommandés) et `roles` (identifiants de rôle uniquement) ; si l’un des deux est configuré, les expéditeurs sont autorisés lorsqu’ils correspondent à `users` OU `roles`
    - la correspondance directe par nom/tag est désactivée par défaut ; activez `channels.discord.dangerouslyAllowNameMatching: true` uniquement comme mode de compatibilité de secours
    - les noms/tags sont pris en charge pour `users`, mais les identifiants sont plus sûrs ; `openclaw security audit` avertit lorsque des entrées nom/tag sont utilisées
    - si un serveur a `channels` configuré, les canaux non listés sont refusés
    - si un serveur n’a pas de bloc `channels`, tous les canaux de ce serveur autorisé sont permis

    Exemple :

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

    Si vous définissez uniquement `DISCORD_BOT_TOKEN` et ne créez pas de bloc `channels.discord`, la solution de repli au runtime est `groupPolicy="allowlist"` (avec un avertissement dans les journaux), même si `channels.defaults.groupPolicy` est `open`.

  </Tab>

  <Tab title="Mentions et messages privés de groupe">
    Les messages de serveur sont soumis à une exigence de mention par défaut.

    La détection des mentions inclut :

    - mention explicite du bot
    - motifs de mention configurés (`agents.list[].groupChat.mentionPatterns`, avec repli sur `messages.groupChat.mentionPatterns`)
    - comportement implicite de réponse au bot dans les cas pris en charge

    `requireMention` est configuré par serveur/canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` ignore facultativement les messages qui mentionnent un autre utilisateur/rôle mais pas le bot (à l’exclusion de @everyone/@here).

    Messages privés de groupe :

    - par défaut : ignorés (`dm.groupEnabled=false`)
    - liste d’autorisations facultative via `dm.groupChannels` (identifiants ou slugs de canal)

  </Tab>
</Tabs>

### Routage d’agent basé sur les rôles

Utilisez `bindings[].match.roles` pour router les membres de serveur Discord vers différents agents par identifiant de rôle. Les liaisons basées sur les rôles acceptent uniquement des identifiants de rôle et sont évaluées après les liaisons peer ou parent-peer et avant les liaisons serveur seules. Si une liaison définit aussi d’autres champs de correspondance (par exemple `peer` + `guildId` + `roles`), tous les champs configurés doivent correspondre.

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
- Remplacement par canal : `channels.discord.commands.native`.
- `commands.native=false` supprime explicitement les commandes natives Discord précédemment enregistrées.
- L’authentification des commandes natives utilise les mêmes listes d’autorisations/politiques Discord que le traitement normal des messages.
- Les commandes peuvent toujours être visibles dans l’interface Discord pour les utilisateurs non autorisés ; l’exécution applique toujours l’authentification OpenClaw et renvoie « non autorisé ».

Voir [Commandes slash](/fr/tools/slash-commands) pour le catalogue et le comportement des commandes.

Paramètres par défaut des commandes slash :

- `ephemeral: true`

## Détails des fonctionnalités

<AccordionGroup>
  <Accordion title="Balises de réponse et réponses natives">
    Discord prend en charge les balises de réponse dans la sortie de l’agent :

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Contrôlé par `channels.discord.replyToMode` :

    - `off` (par défaut)
    - `first`
    - `all`
    - `batched`

    Remarque : `off` désactive le filage implicite des réponses. Les balises explicites `[[reply_to_*]]` sont toujours respectées.
    `first` attache toujours la référence de réponse native implicite au premier message Discord sortant du tour.
    `batched` attache uniquement la référence de réponse native implicite de Discord lorsque le tour entrant était un lot temporisé de plusieurs messages. Cela est utile lorsque vous souhaitez des réponses natives principalement pour des discussions ambiguës et rapides, et non pour chaque tour à message unique.

    Les identifiants de message sont exposés dans le contexte/l’historique afin que les agents puissent cibler des messages spécifiques.

  </Accordion>

  <Accordion title="Aperçu du flux en direct">
    OpenClaw peut diffuser des brouillons de réponse en envoyant un message temporaire et en le modifiant au fur et à mesure de l’arrivée du texte. `channels.discord.streaming` accepte `off` (par défaut) | `partial` | `block` | `progress`. `progress` correspond à `partial` sur Discord ; `streamMode` est un alias hérité et est migré automatiquement.

    La valeur par défaut reste `off`, car les modifications d’aperçu sur Discord atteignent rapidement les limites de débit lorsque plusieurs bots ou Gateways partagent un compte.

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

    - `partial` modifie un seul message d’aperçu à mesure que les tokens arrivent.
    - `block` émet des morceaux de taille brouillon (utilisez `draftChunk` pour ajuster la taille et les points de coupure, limités par `textChunkLimit`).
    - Les versions finales média, erreur et réponse explicite annulent les modifications d’aperçu en attente.
    - `streaming.preview.toolProgress` (par défaut `true`) contrôle si les mises à jour d’outil/progression réutilisent le message d’aperçu.

    Le streaming d’aperçu est uniquement textuel ; les réponses média reviennent à la distribution normale. Lorsque le streaming `block` est explicitement activé, OpenClaw ignore le flux d’aperçu pour éviter un double streaming.

  </Accordion>

  <Accordion title="Historique, contexte et comportement des fils">
    Contexte d’historique de serveur :

    - `channels.discord.historyLimit` par défaut `20`
    - repli : `messages.groupChat.historyLimit`
    - `0` désactive

    Contrôles d’historique des messages privés :

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportement des fils :

    - Les fils Discord sont routés comme des sessions de canal et héritent de la configuration du canal parent sauf remplacement.
    - `channels.discord.thread.inheritParent` (par défaut `false`) permet aux nouveaux fils automatiques d’être initialisés à partir de la transcription du parent. Les remplacements par compte se trouvent sous `channels.discord.accounts.<id>.thread.inheritParent`.
    - Les réactions de l’outil de message peuvent résoudre des cibles de message privé `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` est préservé pendant le repli d’activation à l’étape de réponse.

    Les sujets de canal sont injectés comme contexte **non fiable**. Les listes d’autorisations contrôlent qui peut déclencher l’agent, et non une frontière complète de masquage de contexte supplémentaire.

  </Accordion>

  <Accordion title="Sessions liées à des fils pour les sous-agents">
    Discord peut lier un fil à une cible de session afin que les messages suivants dans ce fil continuent d’être routés vers la même session (y compris les sessions de sous-agent).

    Commandes :

    - `/focus <target>` lie le fil actuel/nouveau à une cible de sous-agent/session
    - `/unfocus` supprime la liaison du fil actuel
    - `/agents` affiche les exécutions actives et l’état des liaisons
    - `/session idle <duration|off>` inspecte/met à jour la suppression automatique de focus par inactivité pour les liaisons focalisées
    - `/session max-age <duration|off>` inspecte/met à jour l’âge maximal strict pour les liaisons focalisées

    Configuration :

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
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    Remarques :

    - `session.threadBindings.*` définit les valeurs par défaut globales.
    - `channels.discord.threadBindings.*` remplace le comportement Discord.
    - `spawnSubagentSessions` doit être à true pour créer/lier automatiquement des fils pour `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` doit être à true pour créer/lier automatiquement des fils pour ACP (`/acp spawn ... --thread ...` ou `sessions_spawn({ runtime: "acp", thread: true })`).
    - Si les liaisons de fil sont désactivées pour un compte, `/focus` et les opérations liées aux liaisons de fil ne sont pas disponibles.

    Voir [Sous-agents](/fr/tools/subagents), [Agents ACP](/fr/tools/acp-agents) et [Référence de configuration](/fr/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Liaisons persistantes de canal ACP">
    Pour des espaces de travail ACP stables et « toujours actifs », configurez des liaisons ACP typées de niveau supérieur ciblant des conversations Discord.

    Chemin de configuration :

    - `bindings[]` avec `type: "acp"` et `match.channel: "discord"`

    Exemple :

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

    Remarques :

    - `/acp spawn codex --bind here` lie le canal ou fil actuel sur place et conserve les futurs messages sur la même session ACP. Les messages de fil héritent de la liaison du canal parent.
    - Dans un canal ou fil lié, `/new` et `/reset` réinitialisent la même session ACP sur place. Les liaisons temporaires de fil peuvent remplacer la résolution de la cible tant qu’elles sont actives.
    - `spawnAcpSessions` n’est requis que lorsque OpenClaw doit créer/lier un fil enfant via `--thread auto|here`.

    Voir [Agents ACP](/fr/tools/acp-agents) pour les détails du comportement des liaisons.

  </Accordion>

  <Accordion title="Notifications de réaction">
    Mode de notification de réaction par serveur :

    - `off`
    - `own` (par défaut)
    - `all`
    - `allowlist` (utilise `guilds.<id>.users`)

    Les événements de réaction sont transformés en événements système et attachés à la session Discord routée.

  </Accordion>

  <Accordion title="Réactions d’accusé de réception">
    `ackReaction` envoie un emoji d’accusé de réception pendant qu’OpenClaw traite un message entrant.

    Ordre de résolution :

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - repli sur l’emoji d’identité de l’agent (`agents.list[].identity.emoji`, sinon "👀")

    Remarques :

    - Discord accepte les emojis Unicode ou les noms d’emojis personnalisés.
    - Utilisez `""` pour désactiver la réaction pour un canal ou un compte.

  </Accordion>

  <Accordion title="Écritures de configuration">
    Les écritures de configuration initiées depuis le canal sont activées par défaut.

    Cela affecte les flux `/config set|unset` (lorsque les fonctionnalités de commande sont activées).

    Désactiver :

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
    Faites passer le trafic WebSocket de la Gateway Discord et les recherches REST au démarrage (ID d’application + résolution de liste d’autorisations) via un proxy HTTP(S) avec `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Remplacement par compte :

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
    Activez la résolution PluralKit pour mapper les messages relayés à l’identité du membre du système :

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // facultatif ; nécessaire pour les systèmes privés
      },
    },
  },
}
```

    Remarques :

    - les listes d’autorisations peuvent utiliser `pk:<memberId>`
    - les noms d’affichage des membres sont mis en correspondance par nom/slug uniquement lorsque `channels.discord.dangerouslyAllowNameMatching: true`
    - les recherches utilisent l’ID du message d’origine et sont limitées par une fenêtre temporelle
    - si la recherche échoue, les messages relayés sont traités comme des messages de bot et ignorés sauf si `allowBots=true`

  </Accordion>

  <Accordion title="Configuration de présence">
    Les mises à jour de présence sont appliquées lorsque vous définissez un champ d’état ou d’activité, ou lorsque vous activez la présence automatique.

    Exemple état seulement :

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Exemple d’activité (le statut personnalisé est le type d’activité par défaut) :

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

    Exemple de streaming :

```json5
{
  channels: {
    discord: {
      activity: "Codage en direct",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Correspondance des types d’activité :

    - 0: Playing
    - 1: Streaming (nécessite `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (utilise le texte d’activité comme état du statut ; l’emoji est facultatif)
    - 5: Competing

    Exemple de présence automatique (signal de santé du runtime) :

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

    La présence automatique mappe la disponibilité du runtime vers le statut Discord : healthy => online, degraded ou unknown => idle, exhausted ou unavailable => dnd. Remplacements de texte facultatifs :

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (prend en charge l’espace réservé `{reason}`)

  </Accordion>

  <Accordion title="Approbations dans Discord">
    Discord prend en charge le traitement des approbations par boutons dans les messages privés et peut facultativement publier les invites d’approbation dans le canal d’origine.

    Chemin de configuration :

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (facultatif ; replie sur `commands.ownerAllowFrom` lorsque possible)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, par défaut : `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord active automatiquement les approbations d’exécution natives lorsque `enabled` n’est pas défini ou vaut `"auto"` et qu’au moins un approbateur peut être résolu, soit depuis `execApprovals.approvers`, soit depuis `commands.ownerAllowFrom`. Discord ne déduit pas les approbateurs d’exécution depuis `allowFrom` du canal, `dm.allowFrom` hérité, ni `defaultTo` des messages directs. Définissez `enabled: false` pour désactiver explicitement Discord comme client d’approbation natif.

    Lorsque `target` vaut `channel` ou `both`, l’invite d’approbation est visible dans le canal. Seuls les approbateurs résolus peuvent utiliser les boutons ; les autres utilisateurs reçoivent un refus éphémère. Les invites d’approbation incluent le texte de commande ; activez donc la distribution dans le canal uniquement dans des canaux de confiance. Si l’ID du canal ne peut pas être dérivé de la clé de session, OpenClaw replie sur une distribution par message privé.

    Discord affiche également les boutons d’approbation partagés utilisés par d’autres canaux de chat. L’adaptateur natif Discord ajoute principalement le routage des messages privés pour les approbateurs et la diffusion vers le canal.
    Lorsque ces boutons sont présents, ils constituent l’UX d’approbation principale ; OpenClaw
    ne doit inclure une commande manuelle `/approve` que lorsque le résultat de l’outil indique
    que les approbations par chat ne sont pas disponibles ou que l’approbation manuelle est la seule voie.

    L’authentification Gateway et la résolution d’approbation suivent le contrat client Gateway partagé (`plugin:` IDs se résolvent via `plugin.approval.resolve` ; les autres IDs via `exec.approval.resolve`). Les approbations expirent après 30 minutes par défaut.

    Voir [Approbations Exec](/fr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Outils et barrières d’actions

Les actions de message Discord incluent la messagerie, l’administration des canaux, la modération, la présence et les actions sur les métadonnées.

Exemples principaux :

- messagerie : `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- réactions : `react`, `reactions`, `emojiList`
- modération : `timeout`, `kick`, `ban`
- présence : `setPresence`

L’action `event-create` accepte un paramètre `image` facultatif (URL ou chemin de fichier local) pour définir l’image de couverture de l’événement planifié.

Les barrières d’actions se trouvent sous `channels.discord.actions.*`.

Comportement par défaut des barrières :

| Groupe d’actions                                                                                                                                                         | Par défaut |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | activé     |
| roles                                                                                                                                                                    | désactivé  |
| moderation                                                                                                                                                               | désactivé  |
| presence                                                                                                                                                                 | désactivé  |

## Interface Components v2

OpenClaw utilise Discord components v2 pour les approbations d’exécution et les marqueurs inter-contexte. Les actions de message Discord peuvent également accepter `components` pour une interface personnalisée (avancé ; nécessite de construire une charge utile de composant via l’outil discord), tandis que les `embeds` hérités restent disponibles mais ne sont pas recommandés.

- `channels.discord.ui.components.accentColor` définit la couleur d’accent utilisée par les conteneurs de composants Discord (hex).
- Définissez-la par compte avec `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` sont ignorés lorsque components v2 sont présents.

Exemple :

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

Discord a deux surfaces vocales distinctes : les **canaux vocaux** en temps réel (conversations continues) et les **pièces jointes de message vocal** (format d’aperçu avec forme d’onde). La Gateway prend en charge les deux.

### Canaux vocaux

Liste de contrôle de configuration :

1. Activez Message Content Intent dans le Portail développeur Discord.
2. Activez Server Members Intent lorsque des listes d’autorisations par rôle/utilisateur sont utilisées.
3. Invitez le bot avec les scopes `bot` et `applications.commands`.
4. Accordez Connect, Speak, Send Messages et Read Message History dans le canal vocal cible.
5. Activez les commandes natives (`commands.native` ou `channels.discord.commands.native`).
6. Configurez `channels.discord.voice`.

Utilisez `/vc join|leave|status` pour contrôler les sessions. La commande utilise l’agent par défaut du compte et suit les mêmes règles de liste d’autorisations et de politique de serveur que les autres commandes Discord.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Exemple de connexion automatique :

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
        tts: {
          provider: "openai",
          openai: { voice: "onyx" },
        },
      },
    },
  },
}
```

Remarques :

- `voice.tts` remplace `messages.tts` pour la lecture vocale uniquement.
- `voice.model` remplace le LLM utilisé uniquement pour les réponses dans les canaux vocaux Discord. Laissez-le non défini pour hériter du modèle de l’agent routé.
- La STT utilise `tools.media.audio` ; `voice.model` n’affecte pas la transcription.
- Les tours de transcription vocale dérivent le statut de propriétaire depuis Discord `allowFrom` (ou `dm.allowFrom`) ; les locuteurs non propriétaires ne peuvent pas accéder aux outils réservés au propriétaire (par exemple `gateway` et `cron`).
- La voix est activée par défaut ; définissez `channels.discord.voice.enabled=false` pour la désactiver.
- `voice.daveEncryption` et `voice.decryptionFailureTolerance` sont transmis aux options de jointure de `@discordjs/voice`.
- Les valeurs par défaut de `@discordjs/voice` sont `daveEncryption=true` et `decryptionFailureTolerance=24` si elles ne sont pas définies.
- OpenClaw surveille également les échecs de déchiffrement à la réception et récupère automatiquement en quittant/rejoignant le canal vocal après des échecs répétés dans une courte fenêtre.
- Si les journaux de réception affichent de manière répétée `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` après une mise à jour, collectez un rapport de dépendances et les journaux. La ligne `@discordjs/voice` fournie inclut le correctif upstream de remplissage issu de discord.js PR #11449, qui a clôturé l’issue discord.js #11419.

Pipeline du canal vocal :

- La capture PCM Discord est convertie en fichier WAV temporaire.
- `tools.media.audio` gère la STT, par exemple `openai/gpt-4o-mini-transcribe`.
- La transcription est envoyée via l’ingestion et le routage Discord normaux.
- `voice.model`, lorsqu’il est défini, remplace uniquement le LLM de réponse pour ce tour de canal vocal.
- `voice.tts` est fusionné par-dessus `messages.tts` ; l’audio résultant est lu dans le canal rejoint.

Les identifiants d’authentification sont résolus par composant : auth de routage LLM pour `voice.model`, auth STT pour `tools.media.audio` et auth TTS pour `messages.tts`/`voice.tts`.

### Messages vocaux

Les messages vocaux Discord affichent un aperçu en forme d’onde et nécessitent de l’audio OGG/Opus. OpenClaw génère automatiquement la forme d’onde, mais a besoin de `ffmpeg` et `ffprobe` sur l’hôte de la Gateway pour inspecter et convertir.

- Fournissez un **chemin de fichier local** (les URL sont rejetées).
- Omettez le contenu texte (Discord rejette le texte + le message vocal dans la même charge utile).
- Tout format audio est accepté ; OpenClaw convertit en OGG/Opus si nécessaire.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Dépannage

<AccordionGroup>
  <Accordion title="Intents non autorisés utilisés ou le bot ne voit aucun message de serveur">

    - activez Message Content Intent
    - activez Server Members Intent lorsque vous dépendez de la résolution utilisateur/membre
    - redémarrez la Gateway après avoir modifié les intents

  </Accordion>

  <Accordion title="Messages de serveur bloqués de manière inattendue">

    - vérifiez `groupPolicy`
    - vérifiez la liste d’autorisations du serveur sous `channels.discord.guilds`
    - si la map `channels` du serveur existe, seuls les canaux listés sont autorisés
    - vérifiez le comportement de `requireMention` et les motifs de mention

    Vérifications utiles :

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false mais toujours bloqué">
    Causes fréquentes :

    - `groupPolicy="allowlist"` sans liste d’autorisations serveur/canal correspondante
    - `requireMention` configuré au mauvais endroit (doit être sous `channels.discord.guilds` ou sous l’entrée du canal)
    - expéditeur bloqué par la liste d’autorisations `users` du serveur/canal

  </Accordion>

  <Accordion title="Les gestionnaires longue durée expirent ou les réponses sont dupliquées">

    Journaux typiques :

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Paramètre de budget d’écouteur :

    - compte unique : `channels.discord.eventQueue.listenerTimeout`
    - multi-comptes : `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Paramètre de délai maximal d’exécution du worker :

    - compte unique : `channels.discord.inboundWorker.runTimeoutMs`
    - multi-comptes : `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - par défaut : `1800000` (30 minutes) ; définissez `0` pour désactiver

    Base recommandée :

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

    Utilisez `eventQueue.listenerTimeout` pour une initialisation lente des écouteurs et `inboundWorker.runTimeoutMs`
    uniquement si vous souhaitez une soupape de sécurité distincte pour les tours d’agent en file d’attente.

  </Accordion>

  <Accordion title="Incohérences de l’audit des autorisations">
    Les vérifications d’autorisations de `channels status --probe` ne fonctionnent que pour les identifiants de canal numériques.

    Si vous utilisez des clés slug, la correspondance au runtime peut toujours fonctionner, mais la sonde ne peut pas vérifier entièrement les autorisations.

  </Accordion>

  <Accordion title="Problèmes de messages privés et d’appairage">

    - messages privés désactivés : `channels.discord.dm.enabled=false`
    - politique des messages privés désactivée : `channels.discord.dmPolicy="disabled"` (hérité : `channels.discord.dm.policy`)
    - en attente d’approbation d’appairage en mode `pairing`

  </Accordion>

  <Accordion title="Boucles bot à bot">
    Par défaut, les messages rédigés par des bots sont ignorés.

    Si vous définissez `channels.discord.allowBots=true`, utilisez des règles strictes de mention et de liste d’autorisations pour éviter les comportements de boucle.
    Préférez `channels.discord.allowBots="mentions"` pour accepter uniquement les messages de bot qui mentionnent le bot.

  </Accordion>

  <Accordion title="La STT vocale échoue avec DecryptionFailed(...)">

    - maintenez OpenClaw à jour (`openclaw update`) afin que la logique de récupération de réception vocale Discord soit présente
    - confirmez `channels.discord.voice.daveEncryption=true` (par défaut)
    - partez de `channels.discord.voice.decryptionFailureTolerance=24` (valeur par défaut upstream) et ajustez uniquement si nécessaire
    - surveillez les journaux pour :
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - si les échecs continuent après la reconnexion automatique, collectez les journaux et comparez-les à l’historique upstream de réception DAVE dans [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) et [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Référence de configuration

Référence principale : [Référence de configuration - Discord](/fr/gateway/config-channels#discord).

<Accordion title="Champs Discord à fort signal">

- démarrage/auth : `enabled`, `token`, `accounts.*`, `allowBots`
- politique : `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- commande : `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- file d’événements : `eventQueue.listenerTimeout` (budget d’écouteur), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- worker entrant : `inboundWorker.runTimeoutMs`
- réponse/historique : `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- distribution : `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming : `streaming` (alias hérité : `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- média/nouvelle tentative : `mediaMaxMb` (limite les envois Discord sortants, par défaut `100MB`), `retry`
- actions : `actions.*`
- présence : `activity`, `status`, `activityType`, `activityUrl`
- interface : `ui.components.accentColor`
- fonctionnalités : `threadBindings`, `bindings[]` de niveau supérieur (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Sécurité et opérations

- Traitez les jetons de bot comme des secrets (`DISCORD_BOT_TOKEN` recommandé dans les environnements supervisés).
- Accordez le minimum de privilèges Discord nécessaire.
- Si l’état/le déploiement des commandes est obsolète, redémarrez la Gateway et revérifiez avec `openclaw channels status --probe`.

## Liens connexes

<CardGroup cols={2}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    Appairer un utilisateur Discord à la Gateway.
  </Card>
  <Card title="Groupes" icon="users" href="/fr/channels/groups">
    Comportement des discussions de groupe et de liste d’autorisations.
  </Card>
  <Card title="Routage de canal" icon="route" href="/fr/channels/channel-routing">
    Router les messages entrants vers les agents.
  </Card>
  <Card title="Sécurité" icon="shield" href="/fr/gateway/security">
    Modèle de menace et durcissement.
  </Card>
  <Card title="Routage multi-agent" icon="sitemap" href="/fr/concepts/multi-agent">
    Mapper les serveurs et canaux aux agents.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/fr/tools/slash-commands">
    Comportement des commandes natives.
  </Card>
</CardGroup>
