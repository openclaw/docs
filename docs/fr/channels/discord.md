---
read_when:
    - Travail sur les fonctionnalités du canal Discord
summary: État de la prise en charge, capacités et configuration du bot Discord
title: Discord
x-i18n:
    generated_at: "2026-04-30T07:11:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9f31af2801e7faf6456d4452a5f43b0e42a067b86b7e562c308fa450a847356
    source_path: channels/discord.md
    workflow: 16
---

Prêt pour les messages privés et les salons de guilde via le Gateway Discord officiel.

<CardGroup cols={3}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    Les messages privés Discord utilisent le mode d'appairage par défaut.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/fr/tools/slash-commands">
    Comportement natif des commandes et catalogue des commandes.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics intercanaux et flux de réparation.
  </Card>
</CardGroup>

## Configuration rapide

Vous devrez créer une nouvelle application avec un bot, ajouter le bot à votre serveur et l'appairer à OpenClaw. Nous vous recommandons d'ajouter votre bot à votre propre serveur privé. Si vous n'en avez pas encore, [créez-en un d'abord](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (choisissez **Create My Own > For me and my friends**).

<Steps>
  <Step title="Créer une application Discord et un bot">
    Accédez au [portail développeur Discord](https://discord.com/developers/applications) et cliquez sur **New Application**. Donnez-lui un nom comme « OpenClaw ».

    Cliquez sur **Bot** dans la barre latérale. Définissez le **Username** avec le nom que vous donnez à votre agent OpenClaw.

  </Step>

  <Step title="Activer les intentions privilégiées">
    Toujours sur la page **Bot**, faites défiler jusqu'à **Privileged Gateway Intents** et activez :

    - **Message Content Intent** (obligatoire)
    - **Server Members Intent** (recommandé ; obligatoire pour les listes d'autorisation de rôles et la correspondance nom-vers-ID)
    - **Presence Intent** (facultatif ; seulement nécessaire pour les mises à jour de présence)

  </Step>

  <Step title="Copier votre jeton de bot">
    Remontez sur la page **Bot** et cliquez sur **Reset Token**.

    <Note>
    Malgré son nom, cela génère votre premier jeton — rien n'est « réinitialisé ».
    </Note>

    Copiez le jeton et enregistrez-le quelque part. Il s'agit de votre **Bot Token** et vous en aurez bientôt besoin.

  </Step>

  <Step title="Générer une URL d'invitation et ajouter le bot à votre serveur">
    Cliquez sur **OAuth2** dans la barre latérale. Vous allez générer une URL d'invitation avec les bonnes autorisations pour ajouter le bot à votre serveur.

    Faites défiler jusqu'à **OAuth2 URL Generator** et activez :

    - `bot`
    - `applications.commands`

    Une section **Bot Permissions** apparaîtra en dessous. Activez au minimum :

    **General Permissions**
      - Voir les salons
    **Text Permissions**
      - Envoyer des messages
      - Lire l'historique des messages
      - Intégrer des liens
      - Joindre des fichiers
      - Ajouter des réactions (facultatif)

    Il s'agit de l'ensemble de base pour les salons textuels normaux. Si vous prévoyez de publier dans des fils Discord, y compris des workflows de salons forum ou média qui créent ou poursuivent un fil, activez aussi **Send Messages in Threads**.
    Copiez l'URL générée en bas, collez-la dans votre navigateur, sélectionnez votre serveur et cliquez sur **Continue** pour vous connecter. Vous devriez maintenant voir votre bot dans le serveur Discord.

  </Step>

  <Step title="Activer le mode développeur et récupérer vos ID">
    De retour dans l'application Discord, vous devez activer le mode développeur pour pouvoir copier les ID internes.

    1. Cliquez sur **User Settings** (icône d'engrenage à côté de votre avatar) → **Advanced** → activez **Developer Mode**
    2. Faites un clic droit sur votre **icône de serveur** dans la barre latérale → **Copy Server ID**
    3. Faites un clic droit sur votre **propre avatar** → **Copy User ID**

    Enregistrez votre **Server ID** et votre **User ID** avec votre Bot Token — vous enverrez les trois à OpenClaw à l'étape suivante.

  </Step>

  <Step title="Autoriser les messages privés des membres du serveur">
    Pour que l'appairage fonctionne, Discord doit autoriser votre bot à vous envoyer un message privé. Faites un clic droit sur votre **icône de serveur** → **Privacy Settings** → activez **Direct Messages**.

    Cela permet aux membres du serveur (y compris les bots) de vous envoyer des messages privés. Gardez cette option activée si vous voulez utiliser les messages privés Discord avec OpenClaw. Si vous prévoyez seulement d'utiliser des salons de guilde, vous pouvez désactiver les messages privés après l'appairage.

  </Step>

  <Step title="Définir votre jeton de bot de façon sécurisée (ne l'envoyez pas dans le chat)">
    Votre jeton de bot Discord est un secret (comme un mot de passe). Définissez-le sur la machine qui exécute OpenClaw avant d'envoyer un message à votre agent.

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

    Si OpenClaw fonctionne déjà comme service d'arrière-plan, redémarrez-le via l'application Mac OpenClaw ou en arrêtant puis en relançant le processus `openclaw gateway run`.
    Pour les installations en service géré, exécutez `openclaw gateway install` depuis un shell où `DISCORD_BOT_TOKEN` est présent, ou stockez la variable dans `~/.openclaw/.env`, afin que le service puisse résoudre le SecretRef env après redémarrage.
    Si votre hôte est bloqué ou limité en débit par la recherche de l'application au démarrage de Discord, définissez l'ID d'application/client Discord depuis le portail développeur afin que le démarrage puisse ignorer cet appel REST. Utilisez `channels.discord.applicationId` pour le compte par défaut, ou `channels.discord.accounts.<accountId>.applicationId` lorsque vous exécutez plusieurs bots Discord.

  </Step>

  <Step title="Configurer OpenClaw et appairer">

    <Tabs>
      <Tab title="Demander à votre agent">
        Discutez avec votre agent OpenClaw sur n'importe quel canal existant (par exemple Telegram) et dites-lui. Si Discord est votre premier canal, utilisez plutôt l'onglet CLI / configuration.

        > « J'ai déjà défini mon jeton de bot Discord dans la configuration. Termine la configuration Discord avec l'ID utilisateur `<user_id>` et l'ID serveur `<server_id>`. »
      </Tab>
      <Tab title="CLI / configuration">
        Si vous préférez une configuration basée sur des fichiers, définissez :

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

        Pour une configuration scriptée ou distante, écrivez le même bloc JSON5 avec `openclaw config patch --file ./discord.patch.json5 --dry-run`, puis relancez sans `--dry-run`. Les valeurs `token` en texte brut sont prises en charge. Les valeurs SecretRef sont également prises en charge pour `channels.discord.token` via les fournisseurs env/file/exec. Consultez [Gestion des secrets](/fr/gateway/secrets).

        Pour plusieurs bots Discord, conservez chaque jeton de bot et ID d'application sous son compte. Un `channels.discord.applicationId` de niveau supérieur est hérité par les comptes ; définissez-le donc à cet endroit uniquement lorsque chaque compte doit utiliser le même ID d'application.

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
    Attendez que le Gateway soit en cours d'exécution, puis envoyez un message privé à votre bot dans Discord. Il répondra avec un code d'appairage.

    <Tabs>
      <Tab title="Demander à votre agent">
        Envoyez le code d'appairage à votre agent sur votre canal existant :

        > « Approuve ce code d'appairage Discord : `<CODE>` »
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Les codes d'appairage expirent au bout de 1 heure.

    Vous devriez maintenant pouvoir discuter avec votre agent dans Discord par message privé.

  </Step>
</Steps>

<Note>
La résolution des jetons tient compte du compte. Les valeurs de jeton de configuration prévalent sur le repli env. `DISCORD_BOT_TOKEN` est seulement utilisé pour le compte par défaut.
Si deux comptes Discord activés se résolvent vers le même jeton de bot, OpenClaw ne démarre qu'un seul moniteur de Gateway pour ce jeton. Un jeton issu de la configuration prévaut sur le repli env par défaut ; sinon, le premier compte activé prévaut et le compte dupliqué est signalé comme désactivé.
Pour les appels sortants avancés (actions d'outil message/canal), un `token` explicite par appel est utilisé pour cet appel. Cela s'applique aux actions d'envoi et aux actions de type lecture/sonde (par exemple lecture/recherche/récupération/fil/épingles/autorisations). Les paramètres de politique de compte et de nouvelle tentative proviennent toujours du compte sélectionné dans l'instantané d'exécution actif.
</Note>

## Recommandé : configurer un espace de travail de guilde

Une fois les messages privés fonctionnels, vous pouvez configurer votre serveur Discord comme un espace de travail complet, où chaque salon obtient sa propre session d'agent avec son propre contexte. C'est recommandé pour les serveurs privés où il n'y a que vous et votre bot.

<Steps>
  <Step title="Ajouter votre serveur à la liste d'autorisation de guilde">
    Cela permet à votre agent de répondre dans n'importe quel salon de votre serveur, pas seulement dans les messages privés.

    <Tabs>
      <Tab title="Demander à votre agent">
        > « Ajoute mon ID de serveur Discord `<server_id>` à la liste d'autorisation de guilde »
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
    Par défaut, votre agent ne répond dans les salons de guilde que lorsqu'il est @mentionné. Pour un serveur privé, vous voudrez probablement qu'il réponde à chaque message.

    Dans les salons de guilde, les réponses finales normales de l'assistant restent privées par défaut. La sortie Discord visible doit être envoyée explicitement avec l'outil `message`, afin que l'agent puisse rester en observation par défaut et ne publier que lorsqu'il décide qu'une réponse dans le salon est utile.

    <Tabs>
      <Tab title="Demander à votre agent">
        > « Autorise mon agent à répondre sur ce serveur sans avoir à être @mentionné »
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

        Pour restaurer les réponses finales automatiques héritées pour les salles de groupe/canal, définissez `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Prévoir la mémoire dans les salons de guilde">
    Par défaut, la mémoire à long terme (MEMORY.md) ne se charge que dans les sessions de messages privés. Les salons de guilde ne chargent pas automatiquement MEMORY.md.

    <Tabs>
      <Tab title="Demander à votre agent">
        > « Lorsque je pose des questions dans les salons Discord, utilise memory_search ou memory_get si tu as besoin du contexte à long terme de MEMORY.md. »
      </Tab>
      <Tab title="Manuel">
        Si vous avez besoin d'un contexte partagé dans chaque salon, placez les instructions stables dans `AGENTS.md` ou `USER.md` (elles sont injectées dans chaque session). Conservez les notes à long terme dans `MEMORY.md` et consultez-les à la demande avec les outils de mémoire.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Créez maintenant quelques salons sur votre serveur Discord et commencez à discuter. Votre agent peut voir le nom du salon, et chaque salon obtient sa propre session isolée — vous pouvez donc configurer `#coding`, `#home`, `#research`, ou ce qui convient à votre workflow.

## Modèle d'exécution

- Gateway possède la connexion Discord.
- Le routage des réponses est déterministe : les réponses entrantes Discord reviennent vers Discord.
- Les métadonnées de guilde/canal Discord sont ajoutées au prompt du modèle comme contexte non fiable, et non comme préfixe de réponse visible par l’utilisateur. Si un modèle recopie cette enveloppe, OpenClaw supprime les métadonnées copiées des réponses sortantes et du futur contexte de rejeu.
- Par défaut (`session.dmScope=main`), les conversations directes partagent la session principale de l’agent (`agent:main:main`).
- Les canaux de guilde sont des clés de session isolées (`agent:<agentId>:discord:channel:<channelId>`).
- Les MP de groupe sont ignorés par défaut (`channels.discord.dm.groupEnabled=false`).
- Les commandes slash natives s’exécutent dans des sessions de commande isolées (`agent:<agentId>:discord:slash:<userId>`), tout en portant `CommandTargetSessionKey` vers la session de conversation routée.
- La livraison des annonces Cron/Heartbeat textuelles uniquement vers Discord utilise une seule fois la réponse finale visible par l’assistant. Les charges utiles multimédias et de composants structurés restent multi-messages lorsque l’agent émet plusieurs charges utiles livrables.

## Canaux de forum

Les canaux de forum et multimédias Discord acceptent uniquement les publications de fil. OpenClaw prend en charge deux façons de les créer :

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

Par défaut, les composants sont à usage unique. Définissez `components.reusable=true` pour autoriser l’utilisation multiple des boutons, sélections et formulaires jusqu’à leur expiration.

Pour restreindre les personnes pouvant cliquer sur un bouton, définissez `allowedUsers` sur ce bouton (ID utilisateur Discord, tags ou `*`). Lorsqu’il est configuré, les utilisateurs non correspondants reçoivent un refus éphémère.

Les commandes slash `/model` et `/models` ouvrent un sélecteur de modèle interactif avec des menus déroulants pour le fournisseur, le modèle et l’exécution compatible, plus une étape Envoyer. `/models add` est obsolète et renvoie désormais un message d’obsolescence au lieu d’enregistrer des modèles depuis la conversation. La réponse du sélecteur est éphémère et seul l’utilisateur qui l’a invoquée peut l’utiliser.

Pièces jointes de fichiers :

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
    `channels.discord.dmPolicy` contrôle l’accès aux MP. `channels.discord.allowFrom` est la liste d’autorisation canonique pour les MP.

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `channels.discord.allowFrom` inclue `"*"`)
    - `disabled`

    Si la politique de MP n’est pas ouverte, les utilisateurs inconnus sont bloqués (ou invités à s’appairer en mode `pairing`).

    Priorité multi-compte :

    - `channels.discord.accounts.default.allowFrom` s’applique uniquement au compte `default`.
    - Pour un compte, `allowFrom` a priorité sur l’ancien `dm.allowFrom`.
    - Les comptes nommés héritent de `channels.discord.allowFrom` lorsque leur propre `allowFrom` et l’ancien `dm.allowFrom` ne sont pas définis.
    - Les comptes nommés n’héritent pas de `channels.discord.accounts.default.allowFrom`.

    Les anciens `channels.discord.dm.policy` et `channels.discord.dm.allowFrom` sont encore lus pour compatibilité. `openclaw doctor --fix` les migre vers `dmPolicy` et `allowFrom` lorsqu’il peut le faire sans modifier l’accès.

    Format de cible MP pour la livraison :

    - `user:<id>`
    - mention `<@id>`

    Les ID numériques nus se résolvent normalement comme ID de canal lorsqu’un canal par défaut est actif, mais les ID listés dans le `allowFrom` MP effectif du compte sont traités comme des cibles de MP utilisateur pour compatibilité.

  </Tab>

  <Tab title="Guild policy">
    La gestion des guildes est contrôlée par `channels.discord.groupPolicy` :

    - `open`
    - `allowlist`
    - `disabled`

    La base sécurisée lorsque `channels.discord` existe est `allowlist`.

    Comportement de `allowlist` :

    - la guilde doit correspondre à `channels.discord.guilds` (`id` préféré, slug accepté)
    - listes d’autorisation d’expéditeurs facultatives : `users` (ID stables recommandés) et `roles` (ID de rôle uniquement) ; si l’une ou l’autre est configurée, les expéditeurs sont autorisés lorsqu’ils correspondent à `users` OU `roles`
    - la correspondance directe par nom/tag est désactivée par défaut ; activez `channels.discord.dangerouslyAllowNameMatching: true` uniquement comme mode de compatibilité d’urgence
    - les noms/tags sont pris en charge pour `users`, mais les ID sont plus sûrs ; `openclaw security audit` avertit lorsque des entrées de nom/tag sont utilisées
    - si une guilde a `channels` configuré, les canaux non listés sont refusés
    - si une guilde n’a pas de bloc `channels`, tous les canaux de cette guilde autorisée sont permis

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

    Si vous définissez seulement `DISCORD_BOT_TOKEN` et ne créez pas de bloc `channels.discord`, le repli d’exécution est `groupPolicy="allowlist"` (avec un avertissement dans les journaux), même si `channels.defaults.groupPolicy` vaut `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Les messages de guilde exigent une mention par défaut.

    La détection des mentions inclut :

    - mention explicite du bot
    - motifs de mention configurés (`agents.list[].groupChat.mentionPatterns`, repli `messages.groupChat.mentionPatterns`)
    - comportement implicite de réponse au bot dans les cas pris en charge

    `requireMention` est configuré par guilde/canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` supprime éventuellement les messages qui mentionnent un autre utilisateur/rôle mais pas le bot (hors @everyone/@here).

    MP de groupe :

    - par défaut : ignorés (`dm.groupEnabled=false`)
    - liste d’autorisation facultative via `dm.groupChannels` (ID de canal ou slugs)

  </Tab>
</Tabs>

### Routage des agents basé sur les rôles

Utilisez `bindings[].match.roles` pour router les membres de guilde Discord vers différents agents par ID de rôle. Les liaisons basées sur les rôles acceptent uniquement les ID de rôle et sont évaluées après les liaisons par pair ou pair parent et avant les liaisons de guilde uniquement. Si une liaison définit aussi d’autres champs de correspondance (par exemple `peer` + `guildId` + `roles`), tous les champs configurés doivent correspondre.

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
- `commands.native=false` efface explicitement les commandes natives Discord précédemment enregistrées.
- L’authentification des commandes natives utilise les mêmes listes d’autorisation/politiques Discord que la gestion normale des messages.
- Les commandes peuvent rester visibles dans l’interface Discord pour les utilisateurs non autorisés ; l’exécution applique quand même l’authentification OpenClaw et renvoie « not authorized ».

Voir [Commandes slash](/fr/tools/slash-commands) pour le catalogue et le comportement des commandes.

Paramètres par défaut des commandes slash :

- `ephemeral: true`

## Détails des fonctionnalités

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord prend en charge les tags de réponse dans la sortie de l’agent :

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Contrôlé par `channels.discord.replyToMode` :

    - `off` (par défaut)
    - `first`
    - `all`
    - `batched`

    Remarque : `off` désactive le fil de réponse implicite. Les tags explicites `[[reply_to_*]]` sont toujours honorés.
    `first` attache toujours la référence de réponse native implicite au premier message Discord sortant du tour.
    `batched` attache uniquement la référence de réponse native implicite de Discord lorsque le tour entrant était un lot temporisé de plusieurs messages. C’est utile lorsque vous voulez des réponses natives surtout pour les conversations ambiguës en rafales, et non pour chaque tour à message unique.

    Les ID de message sont exposés dans le contexte/l’historique afin que les agents puissent cibler des messages précis.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw peut diffuser des brouillons de réponse en envoyant un message temporaire puis en le modifiant à mesure que le texte arrive. `channels.discord.streaming` accepte `off` (par défaut) | `partial` | `block` | `progress`. `progress` est mappé vers `partial` sur Discord ; `streamMode` est un alias hérité et est migré automatiquement.

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
    - `block` émet des fragments de taille brouillon (utilisez `draftChunk` pour ajuster la taille et les points de rupture, bornés par `textChunkLimit`).
    - Les réponses finales multimédias, d’erreur et de réponse explicite annulent les modifications d’aperçu en attente.
    - `streaming.preview.toolProgress` (par défaut `true`) contrôle si les mises à jour d’outil/progression réutilisent le message d’aperçu.

    La diffusion d’aperçu est textuelle uniquement ; les réponses multimédias reviennent à la livraison normale. Lorsque la diffusion `block` est explicitement activée, OpenClaw ignore le flux d’aperçu pour éviter une double diffusion.

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
    - Les sessions de fil héritent de la sélection `/model` de niveau session du canal parent comme repli limité au modèle ; les sélections `/model` locales au fil restent prioritaires et l’historique de transcription parent n’est pas copié sauf si l’héritage de transcription est activé.
    - `channels.discord.thread.inheritParent` (par défaut `false`) inscrit les nouveaux fils automatiques à l’amorçage depuis la transcription parente. Les remplacements par compte se trouvent sous `channels.discord.accounts.<id>.thread.inheritParent`.
    - Les réactions d’outil de message peuvent résoudre les cibles de DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` est préservé pendant le repli d’activation à l’étape de réponse.

    Les sujets de canal sont injectés comme contexte **non fiable**. Les listes d’autorisation contrôlent qui peut déclencher l’agent, pas une frontière complète de caviardage du contexte supplémentaire.

  </Accordion>

  <Accordion title="Sessions liées aux fils pour les sous-agents">
    Discord peut lier un fil à une cible de session afin que les messages de suivi dans ce fil continuent d’être routés vers la même session (y compris les sessions de sous-agent).

    Commandes :

    - `/focus <target>` lier le fil actuel/nouveau à une cible de sous-agent/session
    - `/unfocus` supprimer la liaison du fil actuel
    - `/agents` afficher les exécutions actives et l’état de liaison
    - `/session idle <duration|off>` inspecter/mettre à jour le défocus automatique après inactivité pour les liaisons ciblées
    - `/session max-age <duration|off>` inspecter/mettre à jour l’âge maximal strict pour les liaisons ciblées

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
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    Notes :

    - `session.threadBindings.*` définit les valeurs par défaut globales.
    - `channels.discord.threadBindings.*` remplace le comportement Discord.
    - `spawnSubagentSessions` doit valoir true pour créer automatiquement/lier des fils pour `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` doit valoir true pour créer automatiquement/lier des fils pour ACP (`/acp spawn ... --thread ...` ou `sessions_spawn({ runtime: "acp", thread: true })`).
    - Si les liaisons de fil sont désactivées pour un compte, `/focus` et les opérations associées de liaison de fil ne sont pas disponibles.

    Voir [Sous-agents](/fr/tools/subagents), [Agents ACP](/fr/tools/acp-agents) et [Référence de configuration](/fr/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Liaisons persistantes de canal ACP">
    Pour les espaces de travail ACP stables « toujours actifs », configurez des liaisons ACP typées de premier niveau ciblant des conversations Discord.

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
    - Dans un canal ou un fil lié, `/new` et `/reset` réinitialisent sur place la même session ACP. Les liaisons temporaires de fil peuvent remplacer la résolution de cible pendant qu’elles sont actives.
    - `spawnAcpSessions` n’est requis que lorsqu’OpenClaw doit créer/lier un fil enfant via `--thread auto|here`.

    Voir [Agents ACP](/fr/tools/acp-agents) pour les détails du comportement de liaison.

  </Accordion>

  <Accordion title="Notifications de réaction">
    Mode de notification de réaction par guilde :

    - `off`
    - `own` (par défaut)
    - `all`
    - `allowlist` (utilise `guilds.<id>.users`)

    Les événements de réaction sont convertis en événements système et attachés à la session Discord routée.

  </Accordion>

  <Accordion title="Réactions d’accusé de réception">
    `ackReaction` envoie un émoji d’accusé de réception pendant qu’OpenClaw traite un message entrant.

    Ordre de résolution :

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - repli vers l’émoji d’identité de l’agent (`agents.list[].identity.emoji`, sinon "👀")

    Notes :

    - Discord accepte les émojis Unicode ou les noms d’émojis personnalisés.
    - Utilisez `""` pour désactiver la réaction pour un canal ou un compte.

  </Accordion>

  <Accordion title="Écritures de configuration">
    Les écritures de configuration initiées par un canal sont activées par défaut.

    Cela affecte les flux `/config set|unset` (quand les fonctionnalités de commande sont activées).

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
    Activez la résolution PluralKit pour mapper les messages proxifiés à l’identité de membre du système :

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
    - les recherches utilisent l’ID du message d’origine et sont contraintes par une fenêtre temporelle
    - si la recherche échoue, les messages proxifiés sont traités comme des messages de bot et abandonnés sauf si `allowBots=true`

  </Accordion>

  <Accordion title="Configuration de présence">
    Les mises à jour de présence sont appliquées quand vous définissez un champ de statut ou d’activité, ou quand vous activez la présence automatique.

    Exemple avec statut seulement :

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

    - 0: Jouer
    - 1: Diffusion (requiert `activityUrl`)
    - 2: Écouter
    - 3: Regarder
    - 4: Personnalisée (utilise le texte de l’activité comme état de statut ; l’émoji est facultatif)
    - 5: Participer à une compétition

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
    Discord prend en charge la gestion des approbations via boutons dans les DM et peut éventuellement publier les invites d’approbation dans le canal d’origine.

    Chemin de configuration :

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (facultatif ; se rabat sur `commands.ownerAllowFrom` lorsque c’est possible)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, par défaut : `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord active automatiquement les approbations d’exécution natives lorsque `enabled` n’est pas défini ou vaut `"auto"` et qu’au moins un approbateur peut être résolu, soit depuis `execApprovals.approvers`, soit depuis `commands.ownerAllowFrom`. Discord ne déduit pas les approbateurs d’exécution depuis `allowFrom` de canal, l’ancien `dm.allowFrom` ou `defaultTo` de message direct. Définissez `enabled: false` pour désactiver explicitement Discord comme client d’approbation natif.

    Pour les commandes de groupe sensibles réservées au propriétaire, comme `/diagnostics` et `/export-trajectory`, OpenClaw envoie les invites d’approbation et les résultats finaux en privé. Il essaie d’abord le DM Discord lorsque le propriétaire appelant dispose d’une route propriétaire Discord ; si ce n’est pas disponible, il se rabat sur la première route propriétaire disponible depuis `commands.ownerAllowFrom`, comme Telegram.

    Lorsque `target` vaut `channel` ou `both`, l’invite d’approbation est visible dans le canal. Seuls les approbateurs résolus peuvent utiliser les boutons ; les autres utilisateurs reçoivent un refus éphémère. Les invites d’approbation incluent le texte de la commande ; n’activez donc la livraison dans le canal que dans des canaux fiables. Si l’ID du canal ne peut pas être dérivé de la clé de session, OpenClaw se rabat sur la livraison en DM.

    Discord affiche également les boutons d’approbation partagés utilisés par les autres canaux de discussion. L’adaptateur Discord natif ajoute principalement le routage des DM d’approbateur et la diffusion vers les canaux.
    Quand ces boutons sont présents, ils constituent l’UX principale d’approbation ; OpenClaw
    ne devrait inclure une commande `/approve` manuelle que lorsque le résultat de l’outil indique
    que les approbations par discussion ne sont pas disponibles ou que l’approbation manuelle est la seule voie.
    Si le runtime d’approbation natif Discord n’est pas actif, OpenClaw conserve l’invite
    déterministe locale `/approve <id> <decision>` visible. Si le
    runtime est actif mais qu’une carte native ne peut être livrée à aucune cible,
    OpenClaw envoie un avis de repli dans la même discussion avec la commande `/approve`
    exacte issue de l’approbation en attente.

    L’authentification Gateway et la résolution des approbations suivent le contrat partagé du client Gateway (les ID `plugin:` sont résolus via `plugin.approval.resolve` ; les autres ID via `exec.approval.resolve`). Les approbations expirent par défaut après 30 minutes.

    Voir [Approbations d’exécution](/fr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Outils et contrôles d’action

Les actions de message Discord incluent les actions de messagerie, d’administration de canal, de modération, de présence et de métadonnées.

Exemples principaux :

- messagerie : `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- réactions : `react`, `reactions`, `emojiList`
- modération : `timeout`, `kick`, `ban`
- présence : `setPresence`

L’action `event-create` accepte un paramètre facultatif `image` (URL ou chemin de fichier local) pour définir l’image de couverture de l’événement planifié.

Les contrôles d’action se trouvent sous `channels.discord.actions.*`.

Comportement des contrôles par défaut :

| Groupe d’actions                                                                                                                                                         | Par défaut |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | activé     |
| roles                                                                                                                                                                    | désactivé  |
| moderation                                                                                                                                                               | désactivé  |
| presence                                                                                                                                                                 | désactivé  |

## Interface utilisateur Components v2

OpenClaw utilise les composants Discord v2 pour les approbations d’exécution et les marqueurs inter-contextes. Les actions de message Discord peuvent aussi accepter `components` pour une interface utilisateur personnalisée (avancé ; nécessite de construire une charge utile de composant via l’outil discord), tandis que les anciens `embeds` restent disponibles mais ne sont pas recommandés.

- `channels.discord.ui.components.accentColor` définit la couleur d’accentuation utilisée par les conteneurs de composants Discord (hex).
- Définissez-la par compte avec `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` est ignoré quand des composants v2 sont présents.

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

Discord a deux surfaces vocales distinctes : les **canaux vocaux** en temps réel (conversations continues) et les **pièces jointes de messages vocaux** (le format de prévisualisation avec forme d’onde). Le Gateway prend en charge les deux.

### Canaux vocaux

Liste de configuration :

1. Activez Message Content Intent dans le portail développeur Discord.
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

Exemple d’auto-jonction :

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

Remarques :

- `voice.tts` remplace `messages.tts` uniquement pour la lecture vocale.
- `voice.model` remplace le LLM utilisé uniquement pour les réponses de canal vocal Discord. Laissez-le non défini pour hériter du modèle de l’agent routé.
- STT utilise `tools.media.audio` ; `voice.model` n’affecte pas la transcription.
- Les tours de transcription vocale déduisent le statut de propriétaire depuis `allowFrom` (ou `dm.allowFrom`) de Discord ; les intervenants non propriétaires ne peuvent pas accéder aux outils réservés au propriétaire (par exemple `gateway` et `cron`).
- La voix est activée par défaut ; définissez `channels.discord.voice.enabled=false` pour désactiver le moteur d’exécution vocal et l’intention Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` peut explicitement remplacer l’abonnement à l’intention d’état vocal. Laissez-le non défini pour que l’intention suive `voice.enabled`.
- `voice.daveEncryption` et `voice.decryptionFailureTolerance` sont transmis aux options de jonction de `@discordjs/voice`.
- Les valeurs par défaut de `@discordjs/voice` sont `daveEncryption=true` et `decryptionFailureTolerance=24` si elles ne sont pas définies.
- OpenClaw surveille aussi les échecs de déchiffrement en réception et récupère automatiquement en quittant puis en rejoignant le canal vocal après des échecs répétés dans une courte fenêtre.
- Si les journaux de réception affichent à répétition `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` après la mise à jour, collectez un rapport de dépendances et les journaux. La ligne `@discordjs/voice` groupée inclut le correctif amont de remplissage de la PR discord.js #11449, qui a fermé l’issue discord.js #11419.

Pipeline de canal vocal :

- La capture PCM Discord est convertie en fichier WAV temporaire.
- `tools.media.audio` gère STT, par exemple `openai/gpt-4o-mini-transcribe`.
- La transcription est envoyée via l’entrée et le routage Discord normaux.
- `voice.model`, lorsqu’il est défini, remplace uniquement le LLM de réponse pour ce tour de canal vocal.
- `voice.tts` est fusionné par-dessus `messages.tts` ; l’audio résultant est lu dans le canal rejoint.

Les identifiants sont résolus par composant : authentification de route LLM pour `voice.model`, authentification STT pour `tools.media.audio`, et authentification TTS pour `messages.tts`/`voice.tts`.

### Messages vocaux

Les messages vocaux Discord affichent une prévisualisation en forme d’onde et nécessitent de l’audio OGG/Opus. OpenClaw génère automatiquement la forme d’onde, mais a besoin de `ffmpeg` et `ffprobe` sur l’hôte Gateway pour inspecter et convertir.

- Fournissez un **chemin de fichier local** (les URL sont rejetées).
- Omettez le contenu textuel (Discord rejette le texte + message vocal dans la même charge utile).
- Tout format audio est accepté ; OpenClaw convertit en OGG/Opus si nécessaire.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Dépannage

<AccordionGroup>
  <Accordion title="Intentions non autorisées utilisées ou le bot ne voit aucun message de serveur">

    - activez Message Content Intent
    - activez Server Members Intent lorsque vous dépendez de la résolution utilisateur/membre
    - redémarrez le Gateway après avoir modifié les intentions

  </Accordion>

  <Accordion title="Messages de serveur bloqués de manière inattendue">

    - vérifiez `groupPolicy`
    - vérifiez la liste d’autorisation de serveur sous `channels.discord.guilds`
    - si la carte `channels` du serveur existe, seuls les canaux listés sont autorisés
    - vérifiez le comportement de `requireMention` et les motifs de mention

    Vérifications utiles :

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Mention obligatoire à false mais toujours bloqué">
    Causes courantes :

    - `groupPolicy="allowlist"` sans liste d’autorisation de serveur/canal correspondante
    - `requireMention` configuré au mauvais endroit (doit être sous `channels.discord.guilds` ou l’entrée de canal)
    - expéditeur bloqué par la liste d’autorisation `users` du serveur/canal

  </Accordion>

  <Accordion title="Tours Discord de longue durée ou réponses en double">

    Journaux typiques :

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Réglages de la file d’attente du Gateway Discord :

    - compte unique : `channels.discord.eventQueue.listenerTimeout`
    - comptes multiples : `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - cela contrôle uniquement le travail de l’écouteur du Gateway Discord, pas la durée de vie du tour d’agent

    Discord n’applique pas de délai d’expiration appartenant au canal aux tours d’agent mis en file d’attente. Les écouteurs de messages transmettent immédiatement, et les exécutions Discord mises en file d’attente conservent l’ordre par session jusqu’à ce que le cycle de vie de la session/de l’outil/du moteur d’exécution termine ou abandonne le travail.

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

  <Accordion title="Avertissements de délai d’expiration de recherche des métadonnées Gateway">
    OpenClaw récupère les métadonnées Discord `/gateway/bot` avant de se connecter. Les échecs transitoires reviennent à l’URL Gateway par défaut de Discord et sont limités en débit dans les journaux.

    Réglages du délai d’expiration des métadonnées :

    - compte unique : `channels.discord.gatewayInfoTimeoutMs`
    - comptes multiples : `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - solution de repli d’environnement quand la configuration n’est pas définie : `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - par défaut : `30000` (30 secondes), max : `120000`

  </Accordion>

  <Accordion title="Incohérences d’audit des permissions">
    Les vérifications de permission `channels status --probe` ne fonctionnent que pour les ID de canaux numériques.

    Si vous utilisez des clés slug, la correspondance au moment de l’exécution peut encore fonctionner, mais la sonde ne peut pas vérifier entièrement les permissions.

  </Accordion>

  <Accordion title="Problèmes de DM et d’appairage">

    - DM désactivé : `channels.discord.dm.enabled=false`
    - stratégie DM désactivée : `channels.discord.dmPolicy="disabled"` (ancien : `channels.discord.dm.policy`)
    - attente d’approbation d’appairage en mode `pairing`

  </Accordion>

  <Accordion title="Boucles de bot à bot">
    Par défaut, les messages créés par des bots sont ignorés.

    Si vous définissez `channels.discord.allowBots=true`, utilisez des règles strictes de mention et de liste d’autorisation pour éviter les boucles.
    Préférez `channels.discord.allowBots="mentions"` pour n’accepter que les messages de bot qui mentionnent le bot.

  </Accordion>

  <Accordion title="Chutes STT vocales avec DecryptionFailed(...)">

    - gardez OpenClaw à jour (`openclaw update`) afin que la logique de récupération de réception vocale Discord soit présente
    - confirmez `channels.discord.voice.daveEncryption=true` (par défaut)
    - commencez avec `channels.discord.voice.decryptionFailureTolerance=24` (valeur par défaut amont) et ajustez uniquement si nécessaire
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
- stratégie : `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- commande : `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- file d’attente d’événements : `eventQueue.listenerTimeout` (budget de l’écouteur), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- métadonnées Gateway : `gatewayInfoTimeoutMs`
- réponse/historique : `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- livraison : `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming : `streaming` (alias ancien : `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- média/réessai : `mediaMaxMb` (plafonne les téléversements Discord sortants, par défaut `100MB`), `retry`
- actions : `actions.*`
- présence : `activity`, `status`, `activityType`, `activityUrl`
- interface utilisateur : `ui.components.accentColor`
- fonctionnalités : `threadBindings`, `bindings[]` de niveau supérieur (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Sécurité et opérations

- Traitez les jetons de bot comme des secrets (`DISCORD_BOT_TOKEN` recommandé dans les environnements supervisés).
- Accordez les permissions Discord les moins privilégiées.
- Si le déploiement/l’état des commandes est obsolète, redémarrez le Gateway et revérifiez avec `openclaw channels status --probe`.

## Connexe

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/fr/channels/pairing">
    Associer un utilisateur Discord au gateway.
  </Card>
  <Card title="Groups" icon="users" href="/fr/channels/groups">
    Comportement des discussions de groupe et des listes d’autorisation.
  </Card>
  <Card title="Channel routing" icon="route" href="/fr/channels/channel-routing">
    Acheminer les messages entrants vers les agents.
  </Card>
  <Card title="Security" icon="shield" href="/fr/gateway/security">
    Modèle de menace et durcissement.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/fr/concepts/multi-agent">
    Associer les guildes et les canaux aux agents.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/fr/tools/slash-commands">
    Comportement des commandes natives.
  </Card>
</CardGroup>
