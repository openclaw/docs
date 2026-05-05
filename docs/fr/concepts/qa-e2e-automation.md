---
read_when:
    - Comprendre comment la pile d’assurance qualité s’articule
    - Étendre qa-lab, qa-channel ou un adaptateur de transport
    - Ajout de scénarios de QA adossés au dépôt
    - Créer une automatisation d’assurance qualité plus réaliste autour du tableau de bord Gateway
summary: 'Vue d’ensemble de la pile QA : qa-lab, qa-channel, scénarios adossés au dépôt, voies de transport en direct, adaptateurs de transport et rapports.'
title: Vue d’ensemble de l’assurance qualité
x-i18n:
    generated_at: "2026-05-05T01:45:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83adbe934d73265a1b47ee463c98fdd3eddfb1cd063d3a46a83dfc7568df0a96
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

La pile QA privée vise à exercer OpenClaw d’une façon plus réaliste,
proche d’un canal, qu’un seul test unitaire ne peut le faire.

Éléments actuels :

- `extensions/qa-channel` : canal de messages synthétique avec surfaces de DM,
  canal, fil, réaction, modification et suppression.
- `extensions/qa-lab` : UI de débogage et bus QA pour observer la transcription,
  injecter des messages entrants et exporter un rapport Markdown.
- `extensions/qa-matrix`, futurs plugins d’exécution : adaptateurs de transport réel qui
  pilotent un vrai canal dans un Gateway QA enfant.
- `qa/` : ressources d’amorçage appuyées par le dépôt pour la tâche de lancement et les
  scénarios QA de référence.
- [Mantis](/fr/concepts/mantis) : vérification réelle avant et après pour les bogues qui
  nécessitent de vrais transports, des captures d’écran de navigateur, l’état de VM et des preuves de PR.

## Surface de commande

Chaque flux QA s’exécute sous `pnpm openclaw qa <subcommand>`. Beaucoup ont des alias de scripts `pnpm qa:*` ; les deux formes sont prises en charge.

| Commande                                            | Objectif                                                                                                                                                                                     |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Auto-vérification QA groupée ; écrit un rapport Markdown.                                                                                                                                    |
| `qa suite`                                          | Exécuter les scénarios appuyés par le dépôt contre la voie du Gateway QA. Alias : `pnpm openclaw qa suite --runner multipass` pour une VM Linux jetable.                                    |
| `qa coverage`                                       | Afficher l’inventaire markdown de couverture des scénarios (`--json` pour une sortie machine).                                                                                              |
| `qa parity-report`                                  | Comparer deux fichiers `qa-suite-summary.json` et écrire le rapport de parité agentique.                                                                                                     |
| `qa character-eval`                                 | Exécuter le scénario QA de personnage sur plusieurs modèles réels avec un rapport évalué. Voir [Rapports](#reporting).                                                                      |
| `qa manual`                                         | Exécuter un prompt ponctuel contre la voie du fournisseur/modèle sélectionné.                                                                                                                |
| `qa ui`                                             | Démarrer l’UI de débogage QA et le bus QA local (alias : `pnpm qa:lab:ui`).                                                                                                                  |
| `qa docker-build-image`                             | Construire l’image Docker QA préintégrée.                                                                                                                                                    |
| `qa docker-scaffold`                                | Écrire un échafaudage docker-compose pour le tableau de bord QA + la voie Gateway.                                                                                                           |
| `qa up`                                             | Construire le site QA, démarrer la pile appuyée par Docker, afficher l’URL (alias : `pnpm qa:lab:up` ; la variante `:fast` ajoute `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).    |
| `qa aimock`                                         | Démarrer uniquement le serveur de fournisseur AIMock.                                                                                                                                        |
| `qa mock-openai`                                    | Démarrer uniquement le serveur de fournisseur `mock-openai` conscient des scénarios.                                                                                                         |
| `qa credentials doctor` / `add` / `list` / `remove` | Gérer le pool partagé d’identifiants Convex.                                                                                                                                                 |
| `qa matrix`                                         | Voie de transport réel contre un homeserver Tuwunel jetable. Voir [Matrix QA](/fr/concepts/qa-matrix).                                                                                         |
| `qa telegram`                                       | Voie de transport réel contre un vrai groupe privé Telegram.                                                                                                                                 |
| `qa discord`                                        | Voie de transport réel contre un vrai canal de guilde privé Discord.                                                                                                                         |
| `qa slack`                                          | Voie de transport réel contre un vrai canal privé Slack.                                                                                                                                     |
| `qa mantis`                                         | Exécuteur de vérification avant et après pour les bogues de transport réel, avec preuves de réactions de statut Discord, smoke desktop/navigateur Crabbox et smoke Slack dans VNC. Voir [Mantis](/fr/concepts/mantis). |

## Flux opérateur

Le flux opérateur QA actuel est un site QA à deux volets :

- Gauche : tableau de bord Gateway (Control UI) avec l’agent.
- Droite : QA Lab, affichant la transcription de style Slack et le plan de scénario.

Exécutez-le avec :

```bash
pnpm qa:lab:up
```

Cela construit le site QA, démarre la voie Gateway appuyée par Docker et expose la
page QA Lab où un opérateur ou une boucle d’automatisation peut donner à l’agent une mission
QA, observer le comportement réel du canal et consigner ce qui a fonctionné, échoué ou
est resté bloqué.

Pour itérer plus vite sur l’UI QA Lab locale sans reconstruire l’image Docker à chaque fois,
démarrez la pile avec un bundle QA Lab monté par liaison :

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` garde les services Docker sur une image préconstruite et monte par liaison
`extensions/qa-lab/web/dist` dans le conteneur `qa-lab`. `qa:lab:watch`
reconstruit ce bundle à chaque changement, et le navigateur se recharge automatiquement lorsque le hachage des ressources QA Lab
change.

Pour un smoke local de trace OpenTelemetry, exécutez :

```bash
pnpm qa:otel:smoke
```

Ce script démarre un récepteur local de traces OTLP/HTTP, exécute le scénario QA
`otel-trace-smoke` avec le plugin `diagnostics-otel` activé, puis
décode les spans protobuf exportés et vérifie la forme critique pour la release :
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` et `openclaw.message.delivery` doivent être présents ;
les appels de modèle ne doivent pas exporter `StreamAbandoned` lors des tours réussis ; les ID de diagnostic bruts et les
attributs `openclaw.content.*` doivent rester hors de la trace. Il écrit
`otel-smoke-summary.json` à côté des artefacts de la suite QA.

La QA d’observabilité reste réservée aux checkouts source. La tarball npm omet intentionnellement
QA Lab, donc les voies de release Docker de package n’exécutent pas les commandes `qa`. Utilisez
`pnpm qa:otel:smoke` depuis un checkout source construit lors des changements de l’instrumentation
de diagnostic.

Pour une voie smoke Matrix avec transport réel, exécutez :

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

La référence CLI complète, le catalogue des profils/scénarios, les variables d’environnement et la disposition des artefacts pour cette voie se trouvent dans [Matrix QA](/fr/concepts/qa-matrix). En bref : elle provisionne un homeserver Tuwunel jetable dans Docker, enregistre des utilisateurs temporaires driver/SUT/observer, exécute le vrai plugin Matrix dans un Gateway QA enfant limité à ce transport (pas de `qa-channel`), puis écrit un rapport Markdown, un résumé JSON, un artefact d’événements observés et un journal de sortie combiné sous `.artifacts/qa-e2e/matrix-<timestamp>/`.

Pour les voies smoke à transport réel Telegram, Discord et Slack :

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

Cette commande loue une machine desktop/navigateur Crabbox, exécute la voie live Slack
dans la VM, ouvre Slack Web dans le navigateur VNC, capture le bureau et
copie `slack-qa/` ainsi que `slack-desktop-smoke.png` dans le répertoire d’artefacts Mantis.
Réutilisez `--lease-id <cbx_...>` après vous être connecté manuellement à Slack Web
via VNC. Avec `--gateway-setup`, Mantis laisse un Gateway Slack OpenClaw persistant
en cours d’exécution dans la VM sur le port `38973` ; sans cela, la commande exécute la
voie QA Slack bot-à-bot normale et quitte après la capture des artefacts.

Avant d’utiliser des identifiants réels mutualisés, exécutez :

```bash
pnpm openclaw qa credentials doctor
```

Le doctor vérifie l’environnement du courtier Convex, valide les paramètres d’endpoint et vérifie l’accessibilité admin/list lorsque le secret mainteneur est présent. Il ne signale que l’état défini/manquant des secrets.

## Couverture des transports réels

Les voies de transport réel partagent un contrat unique au lieu que chacune invente sa propre forme de liste de scénarios. `qa-channel` est la suite synthétique large de comportements produit et ne fait pas partie de la matrice de couverture des transports réels.

| Voie     | Canary | Contrôle des mentions | Bot-à-bot | Blocage par liste d’autorisation | Réponse de premier niveau | Reprise après redémarrage | Suivi de fil | Isolation de fil | Observation des réactions | Commande d’aide | Enregistrement de commande native |
| -------- | ------ | --------------------- | ---------- | -------------------------------- | ------------------------- | ------------------------- | ------------ | ---------------- | ------------------------- | --------------- | --------------------------------- |
| Matrix   | x      | x                     | x          | x                                | x                         | x                         | x            | x                | x                         |                 |                                   |
| Telegram | x      | x                     | x          |                                  |                           |                           |              |                  |                           | x               |                                   |
| Discord  | x      | x                     | x          |                                  |                           |                           |              |                  |                           |                 | x                                 |
| Slack    | x      | x                     | x          |                                  |                           |                           |              |                  |                           |                 |                                   |

Cela garde `qa-channel` comme suite large de comportements produit, tandis que Matrix,
Telegram et les futurs transports réels partagent une checklist explicite de contrat de transport.

Pour une voie de VM Linux jetable sans faire entrer Docker dans le chemin QA, exécutez :

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Cela démarre un nouvel invité Multipass, installe les dépendances, compile OpenClaw
dans l’invité, exécute `qa suite`, puis recopie le rapport QA normal et le
résumé dans `.artifacts/qa-e2e/...` sur l’hôte.
Il réutilise le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
Les exécutions de suite sur l’hôte et avec Multipass exécutent par défaut plusieurs scénarios sélectionnés en parallèle
avec des workers Gateway isolés. `qa-channel` utilise par défaut une concurrence
de 4, limitée au nombre de scénarios sélectionnés. Utilisez `--concurrency <count>` pour ajuster
le nombre de workers, ou `--concurrency 1` pour une exécution série.
La commande se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque
vous voulez obtenir les artefacts sans code de sortie en échec.
Les exécutions live transmettent les entrées d’authentification QA prises en charge et pratiques pour
l’invité : clés de fournisseur basées sur l’environnement, chemin de configuration du fournisseur live QA, et
`CODEX_HOME` lorsqu’il est présent. Gardez `--output-dir` sous la racine du dépôt afin que l’invité
puisse réécrire via l’espace de travail monté.

## Référence QA pour Telegram, Discord et Slack

Matrix dispose d’une [page dédiée](/fr/concepts/qa-matrix) en raison de son nombre de scénarios et du provisionnement de homeserver adossé à Docker. Telegram, Discord et Slack sont plus petits — une poignée de scénarios chacun, sans système de profils, contre des canaux réels préexistants — leur référence se trouve donc ici.

### Options CLI partagées

Ces voies s’enregistrent via `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` et acceptent les mêmes options :

| Option                                | Par défaut                                                     | Description                                                                                                                   |
| ------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                              | Exécute uniquement ce scénario. Répétable.                                                                                    |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Emplacement où les rapports, le résumé, les messages observés et le journal de sortie sont écrits. Les chemins relatifs sont résolus par rapport à `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                | Racine du dépôt lors d’un appel depuis un cwd neutre.                                                                         |
| `--sut-account <id>`                  | `sut`                                                          | Id de compte temporaire dans la configuration du Gateway QA.                                                                  |
| `--provider-mode <mode>`              | `live-frontier`                                                | `mock-openai` ou `live-frontier` (`live-openai` hérité fonctionne toujours).                                                  |
| `--model <ref>` / `--alt-model <ref>` | valeur par défaut du fournisseur                               | Références du modèle principal/secondaire.                                                                                    |
| `--fast`                              | désactivé                                                      | Mode rapide du fournisseur lorsqu’il est pris en charge.                                                                      |
| `--credential-source <env\|convex>`   | `env`                                                          | Voir [Pool d’identifiants Convex](#convex-credential-pool).                                                                   |
| `--credential-role <maintainer\|ci>`  | `ci` en CI, `maintainer` sinon                                 | Rôle utilisé lorsque `--credential-source convex`.                                                                            |

Chaque voie se termine avec un code non nul en cas d’échec d’un scénario. `--allow-failures` écrit les artefacts sans définir de code de sortie en échec.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Cible un groupe Telegram privé réel avec deux bots distincts (driver + SUT). Le bot SUT doit avoir un nom d’utilisateur Telegram ; l’observation bot-à-bot fonctionne mieux lorsque les deux bots ont activé le **Bot-to-Bot Communication Mode** dans `@BotFather`.

Environnement requis lorsque `--credential-source env` :

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — id de discussion numérique (chaîne).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Facultatif :

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` conserve les corps des messages dans les artefacts de messages observés (masqués par défaut).

Scénarios (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`) :

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

Artefacts de sortie :

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — inclut le RTT par réponse (envoi du driver → réponse SUT observée) à partir du canary.
- `telegram-qa-observed-messages.json` — corps masqués sauf si `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Cible un canal de guilde Discord privé réel avec deux bots : un bot driver contrôlé par le harness et un bot SUT démarré par le Gateway OpenClaw enfant via le Plugin Discord groupé. Vérifie la gestion des mentions de canal, que le bot SUT a enregistré la commande native `/help` auprès de Discord, ainsi que les scénarios de preuves Mantis opt-in.

Environnement requis lorsque `--credential-source env` :

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — doit correspondre à l’id utilisateur du bot SUT renvoyé par Discord (sinon la voie échoue rapidement).

Facultatif :

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` conserve les corps des messages dans les artefacts de messages observés.

Scénarios (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`) :

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — scénario Mantis opt-in. S’exécute seul, car il fait passer le SUT en mode toujours actif, réponses de guilde uniquement par outil avec `messages.statusReactions.enabled=true`, puis capture une chronologie de réactions REST ainsi qu’un artefact visuel HTML/PNG.

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

Cible un canal Slack privé réel avec deux bots distincts : un bot driver contrôlé par le harness et un bot SUT démarré par le Gateway OpenClaw enfant via le Plugin Slack groupé.

Environnement requis lorsque `--credential-source env` :

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Facultatif :

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` conserve les corps des messages dans les artefacts de messages observés.

Scénarios (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`) :

- `slack-canary`
- `slack-mention-gating`

Artefacts de sortie :

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — corps masqués sauf si `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Configurer l’espace de travail Slack

La voie nécessite deux applications Slack distinctes dans un même espace de travail, ainsi qu’un canal dont les deux bots sont membres :

- `channelId` — l’id `Cxxxxxxxxxx` d’un canal auquel les deux bots ont été invités. Utilisez un canal dédié ; la voie publie à chaque exécution.
- `driverBotToken` — jeton de bot (`xoxb-...`) de l’application **Driver**.
- `sutBotToken` — jeton de bot (`xoxb-...`) de l’application **SUT**, qui doit être une application Slack séparée du driver afin que son id utilisateur de bot soit distinct.
- `sutAppToken` — jeton de niveau application (`xapp-...`) de l’application SUT avec `connections:write`, utilisé par Socket Mode afin que l’application SUT puisse recevoir des événements.

Préférez un espace de travail Slack dédié à la QA plutôt que de réutiliser un espace de travail de production.

Le manifeste SUT ci-dessous reflète l’installation de production du Plugin Slack groupé (`extensions/slack/src/setup-shared.ts:10`). Pour la configuration du canal de production telle que les utilisateurs la voient, consultez [Configuration rapide du canal Slack](/fr/channels/slack#quick-setup) ; la paire Driver/SUT QA est volontairement séparée, car la voie a besoin de deux ids utilisateur de bot distincts dans un même espace de travail.

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

Copiez le _Bot User OAuth Token_ (`xoxb-...`) — il devient `driverBotToken`. Le driver a seulement besoin de publier des messages et de s’identifier ; pas d’événements, pas de Socket Mode.

**2. Créer l’application SUT**

Répétez _Create New App → From a manifest_ dans le même espace de travail. L’ensemble de portées reflète l’installation de production du Plugin Slack groupé (`extensions/slack/src/setup-shared.ts:10`) :

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

Après que Slack a créé l’application, effectuez deux actions sur sa page de paramètres :

- _Install to Workspace_ → copiez le _Bot User OAuth Token_ → il devient `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → ajoutez la portée `connections:write` → enregistrez → copiez la valeur `xapp-...` → elle devient `sutAppToken`.

Vérifiez que les deux bots ont des identifiants utilisateur distincts en appelant `auth.test` sur chaque jeton. Le runtime distingue le pilote et le SUT par identifiant utilisateur ; réutiliser une seule application pour les deux fera échouer immédiatement le filtrage des mentions.

**3. Créer le canal**

Dans l’espace de travail QA, créez un canal (par exemple `#openclaw-qa`) et invitez les deux bots depuis l’intérieur du canal :

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copiez l’identifiant `Cxxxxxxxxxx` depuis _infos du canal → À propos → ID du canal_ — il devient `channelId`. Un canal public fonctionne ; si vous utilisez un canal privé, les deux applications disposent déjà de `groups:history`, donc les lectures d’historique du harnais réussiront quand même.

**4. Enregistrer les identifiants**

Deux options. Utilisez des variables d’environnement pour le débogage sur une seule machine (définissez les quatre variables `OPENCLAW_QA_SLACK_*` et passez `--credential-source env`), ou alimentez le pool Convex partagé afin que CI et les autres mainteneurs puissent les réserver.

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

Exécutez la lane localement pour confirmer que les deux bots peuvent communiquer entre eux via le broker :

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Une exécution réussie se termine largement en moins de 30 secondes et `slack-qa-report.md` affiche `slack-canary` et `slack-mention-gating` avec le statut `pass`. Si la lane se bloque pendant environ 90 secondes puis se termine avec `Convex credential pool exhausted for kind "slack"`, soit le pool est vide, soit chaque ligne est réservée — `qa credentials list --kind slack --status all --json` vous indiquera lequel de ces cas s’applique.

### Pool d’identifiants Convex

Les lanes Telegram, Discord et Slack peuvent réserver des identifiants depuis un pool Convex partagé au lieu de lire les variables d’environnement ci-dessus. Passez `--credential-source convex` (ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) ; QA Lab acquiert une réservation exclusive, maintient son Heartbeat pendant toute la durée de l’exécution, puis la libère à l’arrêt. Les types de pool sont `"telegram"`, `"discord"` et `"slack"`.

Formes de payload que le broker valide sur `admin/add` :

- Telegram (`kind: "telegram"`) : `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` doit être une chaîne d’identifiant de discussion numérique.
- Discord (`kind: "discord"`) : `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`) : `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` doit correspondre à `^[A-Z][A-Z0-9]+$` (un identifiant Slack comme `Cxxxxxxxxxx`). Consultez [Configurer l’espace de travail Slack](#setting-up-the-slack-workspace) pour le provisionnement de l’application et des portées.

Les variables d’environnement opérationnelles et le contrat d’endpoint du broker Convex se trouvent dans [Tests → Identifiants Telegram partagés via Convex](/fr/help/testing#shared-telegram-credentials-via-convex-v1) (le nom de la section est antérieur à la prise en charge de Discord ; la sémantique du broker est identique pour les deux types).

## Seeds adossés au dépôt

Les ressources de seed se trouvent dans `qa/` :

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Elles sont intentionnellement dans git afin que le plan QA soit visible à la fois par les humains et par l’agent.

`qa-lab` doit rester un exécuteur Markdown générique. Chaque fichier Markdown de scénario est la source de vérité pour une exécution de test et doit définir :

- les métadonnées du scénario
- les métadonnées facultatives de catégorie, capacité, lane et risque
- les références de documentation et de code
- les exigences facultatives de Plugin
- le correctif facultatif de configuration du Gateway
- le `qa-flow` exécutable

La surface de runtime réutilisable qui sous-tend `qa-flow` peut rester générique et transversale. Par exemple, les scénarios Markdown peuvent combiner des assistants côté transport avec des assistants côté navigateur qui pilotent la Control UI intégrée via la jonction `browser.request` du Gateway, sans ajouter d’exécuteur de cas particulier.

Les fichiers de scénario doivent être regroupés par capacité produit plutôt que par dossier de l’arborescence source. Gardez les identifiants de scénario stables lorsque les fichiers sont déplacés ; utilisez `docsRefs` et `codeRefs` pour la traçabilité de l’implémentation.

La liste de référence doit rester suffisamment large pour couvrir :

- les messages directs et la discussion de canal
- le comportement des fils
- le cycle de vie des actions de message
- les callbacks cron
- le rappel de mémoire
- le changement de modèle
- le transfert vers un sous-agent
- la lecture du dépôt et de la documentation
- une petite tâche de build comme Lobster Invaders

## Lanes de mocks de fournisseur

`qa suite` possède deux lanes locales de mock de fournisseur :

- `mock-openai` est le mock OpenClaw conscient des scénarios. Il reste la lane de mock déterministe par défaut pour la QA adossée au dépôt et les portes de parité.
- `aimock` démarre un serveur fournisseur basé sur AIMock pour la couverture expérimentale du protocole, des fixtures, de l’enregistrement/relecture et du chaos. Il est additif et ne remplace pas le répartiteur de scénarios `mock-openai`.

L’implémentation des lanes de fournisseur se trouve sous `extensions/qa-lab/src/providers/`. Chaque fournisseur possède ses valeurs par défaut, le démarrage de son serveur local, la configuration de modèle du Gateway, les besoins de préparation de profils d’authentification et les indicateurs de capacité live/mock. Le code partagé de suite et de Gateway doit passer par le registre des fournisseurs au lieu de créer des branches sur les noms de fournisseurs.

## Adaptateurs de transport

`qa-lab` possède une jonction de transport générique pour les scénarios QA Markdown. `qa-channel` est le premier adaptateur sur cette jonction, mais la cible de conception est plus large : les futurs canaux réels ou synthétiques doivent se brancher sur le même exécuteur de suite au lieu d’ajouter un exécuteur QA spécifique au transport.

Au niveau architectural, la séparation est la suivante :

- `qa-lab` possède l’exécution générique des scénarios, la concurrence des workers, l’écriture des artefacts et le reporting.
- L’adaptateur de transport possède la configuration du Gateway, l’état prêt, l’observation entrante et sortante, les actions de transport et l’état de transport normalisé.
- Les fichiers de scénario Markdown sous `qa/scenarios/` définissent l’exécution de test ; `qa-lab` fournit la surface de runtime réutilisable qui les exécute.

### Ajouter un canal

Ajouter un canal au système QA Markdown nécessite exactement deux éléments :

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

Les plugins d’exécuteur possèdent le contrat de transport :

- comment `openclaw qa <runner>` est monté sous la racine partagée `qa`
- comment le Gateway est configuré pour ce transport
- comment l’état prêt est vérifié
- comment les événements entrants sont injectés
- comment les messages sortants sont observés
- comment les transcriptions et l’état de transport normalisé sont exposés
- comment les actions adossées au transport sont exécutées
- comment la réinitialisation ou le nettoyage spécifique au transport est géré

Le seuil minimal d’adoption pour un nouveau canal :

1. Garder `qa-lab` comme propriétaire de la racine partagée `qa`.
2. Implémenter l’exécuteur de transport sur la jonction d’hôte partagée de `qa-lab`.
3. Garder les mécanismes propres au transport dans le Plugin d’exécuteur ou le harnais de canal.
4. Monter l’exécuteur comme `openclaw qa <runner>` au lieu d’enregistrer une racine de commande concurrente. Les Plugins d’exécuteur doivent déclarer `qaRunners` dans `openclaw.plugin.json` et exporter un tableau `qaRunnerCliRegistrations` correspondant depuis `runtime-api.ts`. Gardez `runtime-api.ts` léger ; la CLI paresseuse et l’exécution de l’exécuteur doivent rester derrière des points d’entrée séparés.
5. Rédiger ou adapter des scénarios Markdown sous les répertoires thématiques `qa/scenarios/`.
6. Utiliser les assistants de scénario génériques pour les nouveaux scénarios.
7. Garder les alias de compatibilité existants opérationnels, sauf si le dépôt effectue une migration intentionnelle.

La règle de décision est stricte :

- Si le comportement peut être exprimé une seule fois dans `qa-lab`, placez-le dans `qa-lab`.
- Si le comportement dépend d’un seul transport de canal, gardez-le dans ce Plugin d’exécuteur ou dans le harnais du Plugin.
- Si un scénario a besoin d’une nouvelle capacité que plusieurs canaux peuvent utiliser, ajoutez un assistant générique au lieu d’une branche spécifique au canal dans `suite.ts`.
- Si un comportement n’a de sens que pour un seul transport, gardez le scénario spécifique au transport et rendez-le explicite dans le contrat du scénario.

### Noms des assistants de scénario

Assistants génériques recommandés pour les nouveaux scénarios :

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

Les alias de compatibilité restent disponibles pour les scénarios existants — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — mais la rédaction de nouveaux scénarios doit utiliser les noms génériques. Les alias existent pour éviter une migration à date fixe, pas comme modèle pour l’avenir.

## Reporting

`qa-lab` exporte un rapport de protocole Markdown à partir de la chronologie du bus observée.
Le rapport doit répondre à :

- Ce qui a fonctionné
- Ce qui a échoué
- Ce qui est resté bloqué
- Les scénarios de suivi qu’il vaut la peine d’ajouter

Pour l’inventaire des scénarios disponibles — utile pour dimensionner les travaux de suivi ou câbler un nouveau transport — exécutez `pnpm openclaw qa coverage` (ajoutez `--json` pour une sortie lisible par machine).

Pour les vérifications de caractère et de style, exécutez le même scénario sur plusieurs références de modèle live et écrivez un rapport Markdown évalué :

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

La commande exécute des processus enfants QA gateway locaux, pas Docker. Les scénarios
d’évaluation de personnage doivent définir la persona via `SOUL.md`, puis exécuter
des tours utilisateur ordinaires comme le chat, l’aide sur l’espace de travail et de
petites tâches sur des fichiers. Le modèle candidat ne doit pas être informé qu’il
est en cours d’évaluation. La commande préserve chaque transcription complète,
enregistre les statistiques d’exécution de base, puis demande aux modèles juges en
mode rapide, avec un raisonnement `xhigh` lorsque c’est pris en charge, de classer
les exécutions selon leur naturel, leur vibe et leur humour. Utilisez
`--blind-judge-models` lorsque vous comparez des fournisseurs : le prompt du juge
reçoit toujours chaque transcription et état d’exécution, mais les références des
candidats sont remplacées par des libellés neutres comme `candidate-01` ; le rapport
associe de nouveau les classements aux références réelles après l’analyse.
Les exécutions candidates utilisent par défaut une réflexion `high`, avec `medium`
pour GPT-5.5 et `xhigh` pour les anciennes références d’évaluation OpenAI qui le
prennent en charge. Remplacez un candidat précis en ligne avec
`--model provider/model,thinking=<level>`. `--thinking <level>` définit toujours une
solution de repli globale, et l’ancienne forme `--model-thinking <provider/model=level>`
est conservée pour compatibilité.
Les références candidates OpenAI utilisent par défaut le mode rapide afin que le
traitement prioritaire soit utilisé lorsque le fournisseur le prend en charge.
Ajoutez `,fast`, `,no-fast` ou `,fast=false` en ligne lorsqu’un seul candidat ou juge
nécessite un remplacement. Passez `--fast` uniquement lorsque vous voulez forcer le
mode rapide pour chaque modèle candidat. Les durées des candidats et des juges sont
enregistrées dans le rapport pour l’analyse comparative, mais les prompts des juges
indiquent explicitement de ne pas classer selon la vitesse.
Les exécutions des modèles candidats et juges utilisent toutes deux par défaut une
concurrence de 16. Réduisez `--concurrency` ou `--judge-concurrency` lorsque les
limites du fournisseur ou la pression sur le gateway local rendent une exécution
trop bruitée.
Lorsqu’aucun candidat `--model` n’est transmis, l’évaluation de personnage utilise par défaut
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, et
`google/gemini-3.1-pro-preview` lorsqu’aucun `--model` n’est transmis.
Lorsqu’aucun `--judge-model` n’est transmis, les juges utilisent par défaut
`openai/gpt-5.5,thinking=xhigh,fast` et
`anthropic/claude-opus-4-6,thinking=high`.

## Docs associées

- [QA matricielle](/fr/concepts/qa-matrix)
- [Canal QA](/fr/channels/qa-channel)
- [Tests](/fr/help/testing)
- [Tableau de bord](/fr/web/dashboard)
