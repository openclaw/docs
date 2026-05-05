---
read_when:
    - Comprendre comment la pile d’assurance qualité s’articule
    - Extension de qa-lab, qa-channel ou d’un adaptateur de transport
    - Ajout de scénarios QA adossés au dépôt
    - Créer une automatisation d’assurance qualité plus réaliste autour du tableau de bord Gateway
summary: 'Vue d’ensemble de la pile QA : qa-lab, qa-channel, scénarios adossés au dépôt, voies de transport en direct, adaptateurs de transport et rapports.'
title: Aperçu de l’assurance qualité
x-i18n:
    generated_at: "2026-05-05T06:17:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: d313abf9e0f13a159ce28c023e2a1c4c1518529da1354a130e9f495e65faac19
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

La pile QA privée vise à exercer OpenClaw d’une manière plus réaliste,
façonnée par les canaux, que ne le permet un simple test unitaire.

Composants actuels :

- `extensions/qa-channel` : canal de messages synthétique avec surfaces de DM, canal, fil,
  réaction, modification et suppression.
- `extensions/qa-lab` : interface de débogage et bus QA pour observer la transcription,
  injecter des messages entrants et exporter un rapport Markdown.
- `extensions/qa-matrix`, futurs plugins de runner : adaptateurs de transports en direct qui
  pilotent un vrai canal à l’intérieur d’un Gateway QA enfant.
- `qa/` : ressources d’amorçage adossées au dépôt pour la tâche de démarrage et les scénarios QA
  de référence.
- [Mantis](/fr/concepts/mantis) : vérification en direct avant et après pour les bogues qui
  nécessitent de vrais transports, des captures d’écran de navigateur, l’état d’une VM et des preuves de PR.

## Surface de commande

Chaque flux QA s’exécute sous `pnpm openclaw qa <subcommand>`. Beaucoup ont des alias de script `pnpm qa:*` ;
les deux formes sont prises en charge.

| Commande                                            | Objectif                                                                                                                                                                                     |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Auto-vérification QA intégrée ; écrit un rapport Markdown.                                                                                                                                   |
| `qa suite`                                          | Exécute les scénarios adossés au dépôt contre la voie Gateway QA. Alias : `pnpm openclaw qa suite --runner multipass` pour une VM Linux jetable.                                             |
| `qa coverage`                                       | Affiche l’inventaire Markdown de couverture des scénarios (`--json` pour une sortie machine).                                                                                               |
| `qa parity-report`                                  | Compare deux fichiers `qa-suite-summary.json` et écrit le rapport de parité agentique.                                                                                                      |
| `qa character-eval`                                 | Exécute le scénario QA de personnage sur plusieurs modèles en direct avec un rapport jugé. Voir [Rapports](#reporting).                                                                     |
| `qa manual`                                         | Exécute une invite ponctuelle contre la voie fournisseur/modèle sélectionnée.                                                                                                                |
| `qa ui`                                             | Démarre l’interface de débogage QA et le bus QA local (alias : `pnpm qa:lab:ui`).                                                                                                            |
| `qa docker-build-image`                             | Construit l’image Docker QA préassemblée.                                                                                                                                                    |
| `qa docker-scaffold`                                | Écrit un échafaudage docker-compose pour le tableau de bord QA + la voie Gateway.                                                                                                           |
| `qa up`                                             | Construit le site QA, démarre la pile adossée à Docker, affiche l’URL (alias : `pnpm qa:lab:up` ; la variante `:fast` ajoute `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).         |
| `qa aimock`                                         | Démarre uniquement le serveur fournisseur AIMock.                                                                                                                                            |
| `qa mock-openai`                                    | Démarre uniquement le serveur fournisseur `mock-openai` conscient des scénarios.                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Gère le pool d’identifiants Convex partagé.                                                                                                                                                  |
| `qa matrix`                                         | Voie de transport en direct contre un homeserver Tuwunel jetable. Voir [QA Matrix](/fr/concepts/qa-matrix).                                                                                    |
| `qa telegram`                                       | Voie de transport en direct contre un vrai groupe Telegram privé.                                                                                                                           |
| `qa discord`                                        | Voie de transport en direct contre un vrai canal de guilde Discord privé.                                                                                                                   |
| `qa slack`                                          | Voie de transport en direct contre un vrai canal Slack privé.                                                                                                                               |
| `qa mantis`                                         | Runner de vérification avant et après pour les bogues de transport en direct, avec preuves de réactions de statut Discord, smoke desktop/navigateur Crabbox et smoke Slack-dans-VNC. Voir [Mantis](/fr/concepts/mantis). |

## Flux opérateur

Le flux opérateur QA actuel est un site QA à deux volets :

- Gauche : tableau de bord Gateway (Control UI) avec l’agent.
- Droite : QA Lab, affichant la transcription de type Slack et le plan de scénario.

Lancez-le avec :

```bash
pnpm qa:lab:up
```

Cela construit le site QA, démarre la voie Gateway adossée à Docker et expose la
page QA Lab où un opérateur ou une boucle d’automatisation peut donner à l’agent une mission
QA, observer le comportement réel du canal et enregistrer ce qui a fonctionné, échoué ou
est resté bloqué.

Pour une itération plus rapide sur l’interface QA Lab sans reconstruire l’image Docker à chaque fois,
démarrez la pile avec un bundle QA Lab monté par liaison :

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` garde les services Docker sur une image préconstruite et monte par liaison
`extensions/qa-lab/web/dist` dans le conteneur `qa-lab`. `qa:lab:watch`
reconstruit ce bundle à chaque modification, et le navigateur se recharge automatiquement quand le hachage des ressources QA Lab change.

Pour un smoke local de trace OpenTelemetry, exécutez :

```bash
pnpm qa:otel:smoke
```

Ce script démarre un récepteur local de traces OTLP/HTTP, exécute le scénario QA
`otel-trace-smoke` avec le plugin `diagnostics-otel` activé, puis
décode les spans protobuf exportés et vérifie la forme critique pour la publication :
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` et `openclaw.message.delivery` doivent être présents ;
les appels de modèle ne doivent pas exporter `StreamAbandoned` sur les tours réussis ; les ID de diagnostic bruts et les
attributs `openclaw.content.*` doivent rester absents de la trace. Il écrit
`otel-smoke-summary.json` à côté des artefacts de la suite QA.

La QA d’observabilité reste réservée aux extractions de source. Le tarball npm omet intentionnellement
QA Lab, donc les voies de publication Docker de package n’exécutent pas les commandes `qa`. Utilisez
`pnpm qa:otel:smoke` depuis une extraction de source construite lorsque vous modifiez l’instrumentation
de diagnostic.

Pour une voie smoke Matrix avec transport réel, exécutez :

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

La référence CLI complète, le catalogue des profils/scénarios, les variables d’environnement et l’organisation des artefacts pour cette voie se trouvent dans [QA Matrix](/fr/concepts/qa-matrix). En bref : elle provisionne un homeserver Tuwunel jetable dans Docker, enregistre des utilisateurs temporaires driver/SUT/observer, exécute le vrai plugin Matrix dans un Gateway QA enfant limité à ce transport (pas de `qa-channel`), puis écrit un rapport Markdown, un résumé JSON, un artefact d’événements observés et un journal de sortie combiné sous `.artifacts/qa-e2e/matrix-<timestamp>/`.

Pour les voies smoke Telegram, Discord et Slack avec transport réel :

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Elles ciblent un vrai canal préexistant avec deux bots (driver + SUT). Les variables d’environnement requises, les listes de scénarios, les artefacts de sortie et le pool d’identifiants Convex sont documentés dans la [référence QA Telegram, Discord et Slack](#telegram-discord-and-slack-qa-reference) ci-dessous.

Pour une exécution complète de VM desktop Slack avec secours VNC, exécutez :

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Cette commande loue une machine desktop/navigateur Crabbox, exécute la voie Slack en direct
dans la VM, ouvre Slack Web dans le navigateur VNC, capture le bureau et
copie `slack-qa/`, `slack-desktop-smoke.png` et `slack-desktop-smoke.mp4`
lorsque la capture vidéo est disponible, vers le répertoire d’artefacts Mantis. Réutilisez `--lease-id <cbx_...>` après vous être connecté manuellement à Slack Web
via VNC. Avec `--gateway-setup`, Mantis laisse un Gateway Slack OpenClaw persistant
en cours d’exécution dans la VM sur le port `38973` ; sans cette option, la commande exécute la
voie QA Slack bot-à-bot normale et se termine après la capture des artefacts.

Pour une tâche desktop de style agent/CV, exécutez :

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` loue ou réutilise une machine desktop/navigateur Crabbox, démarre
`crabbox record --while`, pilote le navigateur visible via un
`visual-driver` imbriqué, capture `visual-task.png`, exécute `openclaw infer image describe`
sur la capture d’écran lorsque `--vision-mode image-describe` est sélectionné, et
écrit `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` et `mantis-visual-task-report.md`.
Lorsque `--expect-text` est défini, l’invite de vision demande un verdict JSON structuré
et ne réussit que lorsque le modèle signale une preuve visible positive ; une
réponse négative qui se contente de citer le texte cible échoue à l’assertion.
Utilisez `--vision-mode metadata` pour un smoke sans modèle qui prouve la plomberie
du bureau, du navigateur, de la capture d’écran et de la vidéo sans appeler de fournisseur de compréhension d’image. L’enregistrement est un artefact obligatoire pour `visual-task` ; si Crabbox n’enregistre
aucun `visual-task.mp4` non vide, la tâche échoue même si le driver visuel
a réussi. En cas d’échec, Mantis conserve la location pour VNC sauf si la tâche avait déjà
réussi et que `--keep-lease` n’était pas défini.

Avant d’utiliser des identifiants en direct mis en pool, exécutez :

```bash
pnpm openclaw qa credentials doctor
```

Le doctor vérifie l’environnement du broker Convex, valide les paramètres de point de terminaison et vérifie l’accessibilité admin/list lorsque le secret mainteneur est présent. Il ne signale que l’état défini/manquant des secrets.

## Couverture des transports en direct

Les voies de transport en direct partagent un contrat unique au lieu d’inventer chacune leur propre forme de liste de scénarios. `qa-channel` est la vaste suite synthétique de comportement produit et ne fait pas partie de la matrice de couverture des transports en direct.

| Voie     | Canari | Filtrage par mention | Bot à bot | Blocage par liste d’autorisation | Réponse de niveau supérieur | Reprise après redémarrage | Suivi de fil | Isolation du fil | Observation des réactions | Commande d’aide | Enregistrement de commande native |
| -------- | ------ | -------------------- | --------- | -------------------------------- | --------------------------- | ------------------------- | ------------ | ---------------- | -------------------------- | --------------- | ---------------------------------- |
| Matrix   | x      | x                    | x         | x                                | x                           | x                         | x            | x                | x                          |                 |                                    |
| Telegram | x      | x                    | x         |                                  |                             |                           |              |                  |                            | x               |                                    |
| Discord  | x      | x                    | x         |                                  |                             |                           |              |                  |                            |                 | x                                  |
| Slack    | x      | x                    | x         |                                  |                             |                           |              |                  |                            |                 |                                    |

Cela conserve `qa-channel` comme suite large de comportement produit, tandis que Matrix,
Telegram et les futurs transports live partagent une même liste de contrôle
explicite de contrat de transport.

Pour une voie de VM Linux jetable sans introduire Docker dans le chemin QA, exécutez :

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Cela démarre un nouvel invité Multipass, installe les dépendances, construit OpenClaw
dans l’invité, exécute `qa suite`, puis copie le rapport QA normal et le
résumé dans `.artifacts/qa-e2e/...` sur l’hôte.
Il réutilise le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
Les exécutions de suite sur l’hôte et Multipass exécutent par défaut plusieurs
scénarios sélectionnés en parallèle avec des workers Gateway isolés. `qa-channel`
utilise par défaut une concurrence de 4, plafonnée par le nombre de scénarios
sélectionnés. Utilisez `--concurrency <count>` pour ajuster le nombre de workers,
ou `--concurrency 1` pour une exécution en série.
La commande se termine avec un code non nul lorsqu’un scénario échoue. Utilisez
`--allow-failures` lorsque vous voulez des artefacts sans code de sortie d’échec.
Les exécutions live transmettent les entrées d’authentification QA prises en charge
qui sont pratiques pour l’invité : clés de fournisseur basées sur l’environnement,
chemin de configuration du fournisseur live QA et `CODEX_HOME` lorsqu’il est présent.
Gardez `--output-dir` sous la racine du dépôt afin que l’invité puisse réécrire
via l’espace de travail monté.

## Référence QA Telegram, Discord et Slack

Matrix dispose d’une [page dédiée](/fr/concepts/qa-matrix) en raison de son nombre de scénarios et de son provisionnement de serveur domestique basé sur Docker. Telegram, Discord et Slack sont plus petits — quelques scénarios chacun, aucun système de profil, contre des canaux réels préexistants — leur référence se trouve donc ici.

### Indicateurs CLI partagés

Ces voies s’enregistrent via `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` et acceptent les mêmes indicateurs :

| Indicateur                           | Par défaut                                                      | Description                                                                                                                   |
| ------------------------------------ | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                    | —                                                               | Exécuter uniquement ce scénario. Répétable.                                                                                   |
| `--output-dir <path>`                | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Emplacement où les rapports, résumés, messages observés et le journal de sortie sont écrits. Les chemins relatifs sont résolus par rapport à `--repo-root`. |
| `--repo-root <path>`                 | `process.cwd()`                                                 | Racine du dépôt lors de l’appel depuis un cwd neutre.                                                                         |
| `--sut-account <id>`                 | `sut`                                                           | Identifiant de compte temporaire dans la configuration Gateway QA.                                                            |
| `--provider-mode <mode>`             | `live-frontier`                                                 | `mock-openai` ou `live-frontier` (`live-openai` hérité fonctionne toujours).                                                  |
| `--model <ref>` / `--alt-model <ref>` | valeur par défaut du fournisseur                                | Références du modèle principal/alternatif.                                                                                    |
| `--fast`                             | désactivé                                                       | Mode rapide du fournisseur lorsqu’il est pris en charge.                                                                      |
| `--credential-source <env\|convex>`  | `env`                                                           | Voir [pool d’identifiants Convex](#convex-credential-pool).                                                                   |
| `--credential-role <maintainer\|ci>` | `ci` dans CI, `maintainer` sinon                                | Rôle utilisé lorsque `--credential-source convex`.                                                                            |

Chaque voie se termine avec un code non nul si un scénario échoue. `--allow-failures` écrit les artefacts sans définir de code de sortie d’échec.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Cible un groupe Telegram privé réel avec deux bots distincts (pilote + SUT). Le bot SUT doit avoir un nom d’utilisateur Telegram ; l’observation bot à bot fonctionne mieux lorsque les deux bots ont le **Bot-to-Bot Communication Mode** activé dans `@BotFather`.

Environnement requis lorsque `--credential-source env` :

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — identifiant numérique du chat (chaîne).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Facultatif :

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` conserve le corps des messages dans les artefacts de messages observés (masqué par défaut).

Scénarios (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`) :

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Artefacts de sortie :

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — inclut le RTT par réponse (envoi du pilote → réponse SUT observée) à partir du canari.
- `telegram-qa-observed-messages.json` — corps masqués sauf si `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Cible un canal de guilde Discord privé réel avec deux bots : un bot pilote contrôlé par le harnais et un bot SUT démarré par le Gateway OpenClaw enfant via le Plugin Discord groupé. Vérifie la gestion des mentions de canal, que le bot SUT a enregistré la commande native `/help` auprès de Discord, et les scénarios de preuves Mantis avec consentement explicite.

Environnement requis lorsque `--credential-source env` :

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — doit correspondre à l’identifiant utilisateur du bot SUT renvoyé par Discord (sinon la voie échoue rapidement).

Facultatif :

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` conserve le corps des messages dans les artefacts de messages observés.

Scénarios (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`) :

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — scénario Mantis avec consentement explicite. S’exécute seul, car il bascule le SUT vers des réponses de guilde toujours actives et uniquement via outils avec `messages.statusReactions.enabled=true`, puis capture une chronologie de réactions REST ainsi que des artefacts visuels HTML/PNG. Les rapports Mantis avant/après préservent également les artefacts MP4 fournis par le scénario sous forme de `baseline.mp4` et `candidate.mp4`.

Exécutez explicitement le scénario de réactions de statut Mantis :

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

Artefacts de sortie :

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — corps masqués sauf si `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` et `discord-status-reactions-tool-only-timeline.png` lorsque le scénario de réactions de statut s’exécute.

### QA Slack

```bash
pnpm openclaw qa slack
```

Cible un canal Slack privé réel avec deux bots distincts : un bot pilote contrôlé par le harnais et un bot SUT démarré par le Gateway OpenClaw enfant via le Plugin Slack groupé.

Environnement requis lorsque `--credential-source env` :

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Facultatif :

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` conserve le corps des messages dans les artefacts de messages observés.

Scénarios (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`) :

- `slack-canary`
- `slack-mention-gating`

Artefacts de sortie :

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — corps masqués sauf si `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Configuration de l’espace de travail Slack

La voie nécessite deux applications Slack distinctes dans un même espace de travail, ainsi qu’un canal dont les deux bots sont membres :

- `channelId` — l’identifiant `Cxxxxxxxxxx` d’un canal auquel les deux bots ont été invités. Utilisez un canal dédié ; la voie publie à chaque exécution.
- `driverBotToken` — jeton de bot (`xoxb-...`) de l’application **Driver**.
- `sutBotToken` — jeton de bot (`xoxb-...`) de l’application **SUT**, qui doit être une application Slack séparée du pilote afin que son identifiant utilisateur de bot soit distinct.
- `sutAppToken` — jeton de niveau application (`xapp-...`) de l’application SUT avec `connections:write`, utilisé par Socket Mode afin que l’application SUT puisse recevoir les événements.

Préférez un espace de travail Slack dédié à la QA plutôt que la réutilisation d’un espace de travail de production.

Le manifeste SUT ci-dessous reflète l’installation de production du Plugin Slack groupé (`extensions/slack/src/setup-shared.ts:10`). Pour la configuration du canal de production telle que les utilisateurs la voient, consultez [configuration rapide du canal Slack](/fr/channels/slack#quick-setup) ; la paire QA Driver/SUT est intentionnellement séparée, car la voie nécessite deux identifiants utilisateur de bot distincts dans un même espace de travail.

**1. Créer l’application Driver**

Accédez à [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → choisissez l’espace de travail QA, collez le manifeste suivant, puis _Install to Workspace_ :

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

Copiez le _Bot User OAuth Token_ (`xoxb-...`) — il devient `driverBotToken`. Le pilote a seulement besoin de publier des messages et de s’identifier ; aucun événement, aucun Socket Mode.

**2. Créer l’application SUT**

Répétez _Create New App → From a manifest_ dans le même espace de travail. L’ensemble des portées reflète l’installation de production du Plugin Slack groupé (`extensions/slack/src/setup-shared.ts:10`) :

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

Une fois que Slack a créé l’app, effectuez deux actions sur sa page de paramètres :

- _Install to Workspace_ → copiez le _Bot User OAuth Token_ → il devient `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → ajoutez le scope `connections:write` → enregistrez → copiez la valeur `xapp-...` → elle devient `sutAppToken`.

Vérifiez que les deux bots ont des identifiants utilisateur distincts en appelant `auth.test` sur chaque token. Le runtime distingue le pilote et le SUT par identifiant utilisateur ; réutiliser une seule app pour les deux fera échouer immédiatement le filtrage des mentions.

**3. Créer le canal**

Dans l’espace de travail QA, créez un canal (par exemple `#openclaw-qa`) et invitez les deux bots depuis l’intérieur du canal :

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copiez l’identifiant `Cxxxxxxxxxx` depuis _channel info → About → Channel ID_ : il devient `channelId`. Un canal public fonctionne ; si vous utilisez un canal privé, les deux apps disposent déjà de `groups:history`, donc les lectures d’historique du harnais réussiront tout de même.

**4. Enregistrer les identifiants**

Deux options. Utilisez des variables d’environnement pour le débogage sur une seule machine (définissez les quatre variables `OPENCLAW_QA_SLACK_*` et passez `--credential-source env`), ou alimentez le pool Convex partagé afin que CI et les autres mainteneurs puissent les louer.

Pour le pool Convex, écrivez les quatre champs dans un fichier JSON :

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Avec `OPENCLAW_QA_CONVEX_SITE_URL` et `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` exportés dans votre shell, enregistrez et vérifiez :

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Attendez-vous à `count: 1`, `status: "active"`, sans champ `lease`.

**5. Vérifier de bout en bout**

Exécutez le lane localement pour confirmer que les deux bots peuvent communiquer entre eux via le broker :

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Une exécution verte se termine en bien moins de 30 secondes, et `slack-qa-report.md` affiche `slack-canary` et `slack-mention-gating` avec le statut `pass`. Si le lane reste bloqué pendant environ 90 secondes puis se termine avec `Convex credential pool exhausted for kind "slack"`, soit le pool est vide, soit toutes les lignes sont louées : `qa credentials list --kind slack --status all --json` vous indiquera laquelle de ces situations s’applique.

### Pool d’identifiants Convex

Les lanes Telegram, Discord et Slack peuvent louer des identifiants depuis un pool Convex partagé au lieu de lire les variables d’environnement ci-dessus. Passez `--credential-source convex` (ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) ; QA Lab acquiert un bail exclusif, envoie des heartbeats pendant toute la durée de l’exécution et le libère à l’arrêt. Les types de pool sont `"telegram"`, `"discord"` et `"slack"`.

Formes de payload validées par le broker sur `admin/add` :

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` doit être une chaîne d’identifiant de chat numérique.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` doit correspondre à `^[A-Z][A-Z0-9]+$` (un identifiant Slack comme `Cxxxxxxxxxx`). Consultez [Configurer l’espace de travail Slack](#setting-up-the-slack-workspace) pour le provisionnement de l’app et des scopes.

Les variables d’environnement opérationnelles et le contrat d’endpoint du broker Convex se trouvent dans [Tests → Identifiants Telegram partagés via Convex](/fr/help/testing#shared-telegram-credentials-via-convex-v1) (le nom de la section est antérieur à la prise en charge de Discord ; la sémantique du broker est identique pour les deux types).

## Seeds adossés au dépôt

Les assets de seed se trouvent dans `qa/` :

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Ils sont intentionnellement versionnés dans git afin que le plan QA soit visible à la fois par les humains et par l’agent.

`qa-lab` doit rester un runner Markdown générique. Chaque fichier de scénario Markdown est la source de vérité pour une exécution de test et doit définir :

- les métadonnées du scénario
- les métadonnées facultatives de catégorie, capacité, lane et risque
- les références de docs et de code
- les exigences facultatives de Plugin
- le correctif facultatif de configuration Gateway
- le `qa-flow` exécutable

La surface de runtime réutilisable qui soutient `qa-flow` peut rester générique et transversale. Par exemple, les scénarios Markdown peuvent combiner des helpers côté transport avec des helpers côté navigateur qui pilotent l’interface Control UI intégrée via la jointure Gateway `browser.request`, sans ajouter de runner spécial.

Les fichiers de scénario doivent être regroupés par capacité produit plutôt que par dossier de l’arborescence source. Gardez les identifiants de scénario stables lorsque les fichiers changent d’emplacement ; utilisez `docsRefs` et `codeRefs` pour la traçabilité de l’implémentation.

La liste de base doit rester assez large pour couvrir :

- les discussions DM et de canal
- le comportement des threads
- le cycle de vie des actions de message
- les callbacks cron
- le rappel mémoire
- le changement de modèle
- le transfert vers un sous-agent
- la lecture du dépôt et de la documentation
- une petite tâche de build comme Lobster Invaders

## Lanes de mocks fournisseur

`qa suite` comporte deux lanes locales de mocks fournisseur :

- `mock-openai` est le mock OpenClaw conscient des scénarios. Il reste le lane de mock déterministe par défaut pour la QA adossée au dépôt et les portes de parité.
- `aimock` démarre un serveur fournisseur adossé à AIMock pour la couverture expérimentale du protocole, des fixtures, de l’enregistrement/relecture et du chaos. Il est additif et ne remplace pas le répartiteur de scénarios `mock-openai`.

L’implémentation des lanes fournisseur se trouve sous `extensions/qa-lab/src/providers/`. Chaque fournisseur possède ses valeurs par défaut, le démarrage de son serveur local, la configuration du modèle Gateway, ses besoins de préparation d’auth-profile et ses indicateurs de capacité live/mock. Le code partagé de suite et de Gateway doit passer par le registre des fournisseurs au lieu de brancher sur les noms de fournisseurs.

## Adaptateurs de transport

`qa-lab` possède une jointure de transport générique pour les scénarios QA Markdown. `qa-channel` est le premier adaptateur sur cette jointure, mais la cible de conception est plus large : les futurs canaux réels ou synthétiques doivent se brancher au même runner de suite plutôt que d’ajouter un runner QA spécifique au transport.

Au niveau de l’architecture, la séparation est la suivante :

- `qa-lab` possède l’exécution générique des scénarios, la concurrence des workers, l’écriture des artefacts et le reporting.
- L’adaptateur de transport possède la configuration Gateway, la disponibilité, l’observation entrante et sortante, les actions de transport et l’état de transport normalisé.
- Les fichiers de scénario Markdown sous `qa/scenarios/` définissent l’exécution de test ; `qa-lab` fournit la surface de runtime réutilisable qui les exécute.

### Ajouter un canal

Ajouter un canal au système QA Markdown exige exactement deux choses :

1. Un adaptateur de transport pour le canal.
2. Un pack de scénarios qui exerce le contrat du canal.

N’ajoutez pas de nouvelle racine de commande QA de premier niveau lorsque l’hôte partagé `qa-lab` peut posséder le flux.

`qa-lab` possède les mécanismes d’hôte partagés :

- la racine de commande `openclaw qa`
- le démarrage et l’arrêt de la suite
- la concurrence des workers
- l’écriture des artefacts
- la génération de rapports
- l’exécution des scénarios
- les alias de compatibilité pour les anciens scénarios `qa-channel`

Les plugins runner possèdent le contrat de transport :

- la manière dont `openclaw qa <runner>` est monté sous la racine partagée `qa`
- la manière dont le Gateway est configuré pour ce transport
- la manière dont la disponibilité est vérifiée
- la manière dont les événements entrants sont injectés
- la manière dont les messages sortants sont observés
- la manière dont les transcripts et l’état de transport normalisé sont exposés
- la manière dont les actions adossées au transport sont exécutées
- la manière dont la réinitialisation ou le nettoyage spécifique au transport est géré

Le seuil minimum d’adoption pour un nouveau canal :

1. Garder `qa-lab` comme propriétaire de la racine partagée `qa`.
2. Implémenter le runner de transport sur la jointure d’hôte partagée `qa-lab`.
3. Garder les mécanismes spécifiques au transport dans le Plugin runner ou le harnais de canal.
4. Monter le runner comme `openclaw qa <runner>` au lieu d’enregistrer une commande racine concurrente. Les plugins runner doivent déclarer `qaRunners` dans `openclaw.plugin.json` et exporter un tableau `qaRunnerCliRegistrations` correspondant depuis `runtime-api.ts`. Gardez `runtime-api.ts` léger ; la CLI paresseuse et l’exécution du runner doivent rester derrière des points d’entrée séparés.
5. Rédiger ou adapter des scénarios Markdown sous les répertoires thématiques `qa/scenarios/`.
6. Utiliser les helpers de scénario génériques pour les nouveaux scénarios.
7. Garder les alias de compatibilité existants fonctionnels, sauf si le dépôt effectue une migration intentionnelle.

La règle de décision est stricte :

- Si un comportement peut être exprimé une seule fois dans `qa-lab`, mettez-le dans `qa-lab`.
- Si un comportement dépend d’un transport de canal, gardez-le dans ce Plugin runner ou dans le harnais de Plugin.
- Si un scénario a besoin d’une nouvelle capacité que plusieurs canaux peuvent utiliser, ajoutez un helper générique au lieu d’une branche spécifique au canal dans `suite.ts`.
- Si un comportement n’a de sens que pour un seul transport, gardez le scénario spécifique au transport et rendez cela explicite dans le contrat du scénario.

### Noms des helpers de scénario

Helpers génériques préférés pour les nouveaux scénarios :

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Les alias de compatibilité restent disponibles pour les scénarios existants — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — mais la rédaction de nouveaux scénarios doit utiliser les noms génériques. Les alias existent pour éviter une migration instantanée, pas comme modèle pour la suite.

## Reporting

`qa-lab` exporte un rapport de protocole Markdown depuis la chronologie de bus observée.
Le rapport doit répondre à ces questions :

- Ce qui a fonctionné
- Ce qui a échoué
- Ce qui est resté bloqué
- Les scénarios de suivi qu’il vaut la peine d’ajouter

Pour l’inventaire des scénarios disponibles — utile pour dimensionner le travail de suivi ou câbler un nouveau transport — exécutez `pnpm openclaw qa coverage` (ajoutez `--json` pour une sortie lisible par machine).

Pour les contrôles de caractère et de style, exécutez le même scénario sur plusieurs refs de modèle live et écrivez un rapport Markdown jugé :

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

La commande exécute des processus enfants du Gateway QA local, pas Docker. Les scénarios d’évaluation de personnage doivent définir la persona via `SOUL.md`, puis exécuter des tours utilisateur ordinaires comme du chat, de l’aide sur l’espace de travail et de petites tâches sur les fichiers. Le modèle candidat ne doit pas être informé qu’il est évalué. La commande conserve chaque transcription complète, enregistre des statistiques d’exécution de base, puis demande aux modèles juges en mode rapide, avec un raisonnement `xhigh` lorsque c’est pris en charge, de classer les exécutions selon le naturel, l’ambiance et l’humour.
Utilisez `--blind-judge-models` lorsque vous comparez des fournisseurs : le prompt du juge reçoit toujours chaque transcription et statut d’exécution, mais les références des candidats sont remplacées par des libellés neutres comme `candidate-01` ; le rapport associe de nouveau les classements aux références réelles après l’analyse.
Les exécutions candidates utilisent par défaut un raisonnement `high`, avec `medium` pour GPT-5.5 et `xhigh` pour les anciennes références d’évaluation OpenAI qui le prennent en charge. Remplacez un candidat précis en ligne avec `--model provider/model,thinking=<level>`. `--thinking <level>` définit toujours un repli global, et l’ancienne forme `--model-thinking <provider/model=level>` est conservée pour la compatibilité.
Les références candidates OpenAI utilisent par défaut le mode rapide afin que le traitement prioritaire soit utilisé lorsque le fournisseur le prend en charge. Ajoutez `,fast`, `,no-fast` ou `,fast=false` en ligne lorsqu’un candidat ou juge unique a besoin d’un remplacement. Passez `--fast` uniquement lorsque vous voulez forcer le mode rapide pour chaque modèle candidat. Les durées des candidats et des juges sont enregistrées dans le rapport pour l’analyse comparative, mais les prompts des juges indiquent explicitement de ne pas classer selon la vitesse.
Les exécutions des modèles candidats et juges utilisent toutes deux par défaut une concurrence de 16. Réduisez `--concurrency` ou `--judge-concurrency` lorsque les limites des fournisseurs ou la pression sur le Gateway local rendent une exécution trop bruyante.
Lorsqu’aucun candidat `--model` n’est passé, l’évaluation de personnage utilise par défaut
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` et
`google/gemini-3.1-pro-preview` lorsqu’aucun `--model` n’est passé.
Lorsqu’aucun `--judge-model` n’est passé, les juges utilisent par défaut
`openai/gpt-5.5,thinking=xhigh,fast` et
`anthropic/claude-opus-4-6,thinking=high`.

## Docs connexes

- [Matrice QA](/fr/concepts/qa-matrix)
- [Canal QA](/fr/channels/qa-channel)
- [Tests](/fr/help/testing)
- [Tableau de bord](/fr/web/dashboard)
