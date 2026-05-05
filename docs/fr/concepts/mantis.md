---
read_when:
    - Créer ou exécuter une assurance qualité visuelle en direct pour les bogues OpenClaw
    - Ajout d’une vérification avant et après pour une demande d’extraction
    - Ajouter des scénarios de transport en direct pour Discord, Slack, WhatsApp ou d’autres services
    - Débogage des exécutions QA nécessitant des captures d’écran, l’automatisation du navigateur ou un accès VNC
summary: Mantis est le système de vérification visuelle de bout en bout permettant de reproduire les bugs d’OpenClaw sur des transports en direct, de capturer des preuves avant et après, et de joindre des artefacts aux PR.
title: Mante
x-i18n:
    generated_at: "2026-05-05T08:25:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b287e2832e3e49de6b3cb65aeb1d381a36fc30ce9c94dc5b6b4d7e928c2706c
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis est le système de vérification de bout en bout d’OpenClaw pour les bugs qui nécessitent un runtime réel, un transport réel et une preuve visible. Il exécute un scénario sur une ref connue comme défaillante, capture les preuves, exécute le même scénario sur une ref candidate, puis publie la comparaison sous forme d’artifacts qu’un mainteneur peut inspecter depuis une PR ou depuis une commande locale.

Mantis commence avec Discord parce que Discord nous donne une première voie de grande valeur : authentification réelle du bot, vrais canaux de guild, réactions, threads, commandes natives et une UI de navigateur où les humains peuvent confirmer visuellement ce que le transport a montré.

## Objectifs

- Reproduire un bug issu d’une issue ou PR GitHub avec la même forme de transport que celle vue par les utilisateurs.
- Capturer un artifact **before** sur la ref de baseline avant d’appliquer le correctif.
- Capturer un artifact **after** sur la ref candidate après avoir appliqué le correctif.
- Utiliser un oracle déterministe chaque fois que possible, comme une lecture de réaction via Discord REST ou une vérification de transcript de canal.
- Capturer des captures d’écran lorsque le bug possède une surface UI visible.
- S’exécuter localement depuis une CLI contrôlée par un agent et à distance depuis GitHub.
- Préserver suffisamment d’état machine pour un secours VNC lorsque la connexion, l’automatisation du navigateur ou l’authentification du provider se bloque.
- Publier un statut concis dans un canal Discord opérateur lorsque l’exécution est bloquée, nécessite une aide VNC manuelle ou se termine.

## Non-objectifs

- Mantis ne remplace pas les tests unitaires. Une exécution Mantis devrait généralement devenir un test de régression plus petit une fois le correctif compris.
- Mantis n’est pas la gate CI rapide normale. Il est plus lent, utilise des identifiants live et est réservé aux bugs pour lesquels l’environnement live compte.
- Mantis ne devrait pas nécessiter d’humain en fonctionnement normal. Le VNC manuel est un chemin de secours, pas le parcours nominal.
- Mantis ne stocke pas de secrets bruts dans les artifacts, journaux, captures d’écran, rapports Markdown ou commentaires de PR.

## Responsabilités

Mantis vit dans la pile QA d’OpenClaw.

- OpenClaw possède le runtime de scénario, les adaptateurs de transport, le schéma de preuves et la CLI locale sous `pnpm openclaw qa mantis`.
- QA Lab possède les éléments du harness de transport live, les helpers de capture navigateur et les writers d’artifacts.
- Crabbox possède les machines Linux préchauffées lorsqu’une VM distante est nécessaire.
- GitHub Actions possède le point d’entrée du workflow distant et la rétention des artifacts.
- ClawSweeper possède le routage des commentaires GitHub : analyse des commandes des mainteneurs, dispatch du workflow et publication du commentaire final de PR.
- Les agents OpenClaw pilotent Mantis via Codex lorsqu’un scénario nécessite une configuration agentique, du débogage ou un signalement d’état bloqué.

Cette frontière garde la connaissance du transport dans OpenClaw, la planification des machines dans Crabbox et la glue de workflow mainteneur dans ClawSweeper.

## Forme des commandes

La première commande locale vérifie le bot Discord, la guild, le canal, l’envoi de message, l’envoi de réaction et le chemin d’artifact :

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Le runner local before et after accepte cette forme :

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Le runner crée des worktrees détachés de baseline et de candidate sous le répertoire de sortie, installe les dépendances, build chaque ref, exécute le scénario avec `--allow-failures`, puis écrit `baseline/`, `candidate/`, `comparison.json` et `mantis-report.md`. Pour le premier scénario Discord, une vérification réussie signifie que le statut de la baseline est `fail` et que le statut de la candidate est `pass`.

La première primitive VM/navigateur est le smoke desktop :

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Elle loue ou réutilise une machine desktop Crabbox, démarre un navigateur visible dans la session VNC, capture le desktop, rapatrie les artifacts vers le répertoire de sortie local et écrit la commande de reconnexion dans le rapport. La commande utilise par défaut le provider Hetzner parce qu’il est le premier provider avec une couverture desktop/VNC fonctionnelle dans la voie Mantis. Remplacez-le avec `--provider`, `--crabbox-bin` ou `OPENCLAW_MANTIS_CRABBOX_PROVIDER` lors d’une exécution sur une autre flotte Crabbox.

Flags utiles du smoke desktop :

- `--lease-id <cbx_...>` ou `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` réutilise un desktop préchauffé.
- `--browser-url <url>` change la page ouverte dans le navigateur visible.
- `--html-file <path>` rend un artifact HTML local au dépôt dans le navigateur visible. Mantis l’utilise pour capturer la timeline générée des réactions de statut Discord via un vrai desktop Crabbox.
- `--keep-lease` ou `OPENCLAW_MANTIS_KEEP_VM=1` garde ouverte une lease nouvellement créée et réussie pour inspection VNC. Les exécutions échouées gardent la lease par défaut lorsqu’une lease a été créée afin qu’un opérateur puisse se reconnecter.
- `--class`, `--idle-timeout` et `--ttl` ajustent la taille de machine et la durée de vie de la lease.

La première primitive de transport desktop complète est le smoke desktop Slack :

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Elle loue ou réutilise une machine desktop Crabbox, synchronise le checkout courant dans la VM, exécute `pnpm openclaw qa slack` dans cette VM, ouvre Slack Web dans le navigateur VNC, capture le desktop visible et recopie à la fois les artifacts QA Slack et la capture d’écran VNC vers le répertoire de sortie local. C’est la première forme Mantis où le gateway OpenClaw du SUT et le navigateur vivent tous deux dans la même VM desktop Linux.

Avec `--gateway-setup`, la commande prépare un home OpenClaw jetable persistant à `$HOME/.openclaw-mantis/slack-openclaw`, patche la configuration Slack Socket Mode pour le canal sélectionné, démarre `openclaw gateway run` sur le port `38973` et garde Chrome en cours d’exécution dans la session VNC. C’est le mode « laisse-moi un desktop Linux avec Slack et une claw en cours d’exécution » ; la voie QA Slack bot-à-bot reste la valeur par défaut lorsque `--gateway-setup` est omis.

Entrées requises pour `--credential-source env` :

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` pour la voie de modèle distante. Si seul `OPENAI_API_KEY` est défini localement, Mantis le mappe vers `OPENCLAW_LIVE_OPENAI_KEY` avant d’invoquer Crabbox afin que le transfert d’env `OPENCLAW_*` de Crabbox puisse l’acheminer dans la VM.

Flags utiles du desktop Slack :

- `--lease-id <cbx_...>` relance sur une machine où un opérateur s’est déjà connecté à Slack Web via VNC.
- `--gateway-setup` démarre un gateway Slack OpenClaw persistant dans la VM au lieu d’exécuter uniquement la voie QA bot-à-bot.
- `--slack-url <url>` ouvre une URL Slack Web spécifique. Sans lui, Mantis dérive `https://app.slack.com/client/<team>/<channel>` depuis Slack `auth.test` lorsque le token du bot SUT est disponible.
- `--slack-channel-id <id>` contrôle l’allowlist de canaux Slack utilisée par la configuration du gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` contrôle le profil Chrome persistant dans la VM. La valeur par défaut est `$HOME/.config/openclaw-mantis/slack-chrome-profile`, afin qu’une connexion Slack Web manuelle survive aux relances sur la même lease.
- `--credential-source convex --credential-role ci` utilise le pool d’identifiants partagé au lieu de tokens env Slack directs.
- `--provider-mode`, `--model`, `--alt-model` et `--fast` sont transmis à la voie live Slack.

Le workflow smoke GitHub est `Mantis Discord Smoke`. Le workflow GitHub before et after pour le premier scénario réel est `Mantis Discord Status Reactions`. Il accepte :

- `baseline_ref` : la ref censée reproduire le comportement uniquement en file d’attente.
- `candidate_ref` : la ref censée afficher `queued -> thinking -> done`.

Il checkout la ref du harness de workflow, build des worktrees baseline et candidate séparés, exécute `discord-status-reactions-tool-only` sur chaque worktree et téléverse `baseline/`, `candidate/`, `comparison.json` et `mantis-report.md` comme artifacts Actions. Il rend aussi le HTML de timeline de chaque voie dans un navigateur desktop Crabbox et publie ces captures d’écran VNC à côté des PNG de timeline déterministes dans le commentaire de PR. Le même commentaire de PR intègre des aperçus GIF légers à mouvement tronqué générés par `crabbox media preview`, lie les clips MP4 correspondants à mouvement tronqué et conserve les fichiers MP4 desktop complets pour une inspection approfondie. Les captures d’écran restent inline pour une revue rapide. Le workflow build la CLI Crabbox depuis `openclaw/crabbox` main afin de pouvoir utiliser les flags actuels de lease desktop/navigateur avant la prochaine release binaire Crabbox.

`Mantis Scenario` est le point d’entrée manuel générique. Il prend un `scenario_id`, une `candidate_ref`, une `baseline_ref` optionnelle et un `pr_number` optionnel, puis dispatch le workflow possédé par le scénario. Le wrapper est intentionnellement fin : les workflows de scénario possèdent toujours leur configuration de transport, leurs identifiants, leur classe de VM, leur oracle attendu et leur manifeste d’artifacts.

`Mantis Slack Desktop Smoke` est le premier workflow VM Slack. Il checkout la ref candidate de confiance dans un worktree séparé, loue un desktop Linux Crabbox, exécute `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` sur cette candidate, ouvre Slack Web dans le navigateur VNC, enregistre le desktop, génère un aperçu à mouvement tronqué avec `crabbox media preview`, téléverse le répertoire d’artifacts complet et publie optionnellement le commentaire de preuves inline sur la PR cible. Utilisez cette voie lorsque vous voulez « un desktop Linux avec Slack et une claw en cours d’exécution » au lieu d’un simple transcript Slack bot-à-bot.

Chaque scénario publiant sur une PR écrit `mantis-evidence.json` à côté de son rapport. Ce schéma est le passage de relais entre le code de scénario et les commentaires GitHub :

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord Status Reactions QA",
  "summary": "Human-readable top summary for the PR comment.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "queued-only" },
    "candidate": { "sha": "...", "status": "pass", "expected": "queued -> thinking -> done" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Baseline queued-only",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Baseline Discord timeline",
      "width": 420
    }
  ]
}
```

Les valeurs `path` d’artifact sont relatives au répertoire du manifeste. Les valeurs `targetPath` sont des chemins relatifs sous le répertoire de publication cible de la branche `qa-artifacts`. Le publisher rejette la traversée de chemin et ignore les entrées marquées `"required": false` lorsque des aperçus ou vidéos optionnels sont indisponibles.

Kinds d’artifacts pris en charge :

- `timeline` : capture d’écran déterministe du scénario, généralement before/after.
- `desktopScreenshot` : capture d’écran du desktop VNC/navigateur.
- `motionPreview` : GIF animé inline généré depuis l’enregistrement du desktop.
- `motionClip` : MP4 à mouvement tronqué qui supprime l’amorce et la fin statiques.
- `fullVideo` : enregistrement MP4 complet pour inspection approfondie.
- `metadata` : sidecar JSON/journal.
- `report` : rapport Markdown.

Le publisher réutilisable est `scripts/mantis/publish-pr-evidence.mjs`. Les workflows l’appellent avec le manifeste, la PR cible, la racine cible `qa-artifacts`, le marqueur de commentaire, l’URL d’artifact Actions, l’URL d’exécution et la source de requête. Il copie les artifacts déclarés vers la branche `qa-artifacts`, construit un commentaire de PR privilégiant le résumé avec images/aperçus inline et vidéos liées, puis met à jour le commentaire avec marqueur existant ou en crée un.

Vous pouvez aussi déclencher l’exécution status-reactions directement depuis un commentaire de PR :

```text
@Mantis discord status reactions
```

Le déclencheur par commentaire est intentionnellement étroit. Il ne s’exécute que sur les commentaires de pull request provenant d’utilisateurs disposant d’un accès write, maintain ou admin, et il ne reconnaît que les requêtes de réactions de statut Discord. Par défaut, il utilise la ref de baseline connue comme défaillante et le SHA de head de la PR courante comme candidate. Les mainteneurs peuvent remplacer l’une ou l’autre ref :

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Exemples de commandes ClawSweeper :

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

La première commande est explicite et centrée sur le scénario. La seconde peut ensuite mapper une PR
ou une issue vers les scénarios Mantis recommandés à partir des libellés, des fichiers modifiés et
des constats de revue ClawSweeper.

## Cycle de vie d’exécution

1. Acquérir les identifiants.
2. Allouer ou réutiliser une VM.
3. Préparer le profil de bureau/navigateur lorsque le scénario nécessite des preuves d’interface utilisateur.
4. Préparer un checkout propre pour la référence de base.
5. Installer les dépendances et construire uniquement ce dont le scénario a besoin.
6. Démarrer un Gateway OpenClaw enfant avec un répertoire d’état isolé.
7. Configurer le transport réel, le fournisseur, le modèle et le profil de navigateur.
8. Exécuter le scénario et capturer les preuves de base.
9. Arrêter le gateway et conserver les journaux.
10. Préparer la référence candidate dans la même VM.
11. Exécuter le même scénario et capturer les preuves candidates.
12. Comparer les résultats de l’oracle et les preuves visuelles.
13. Écrire les artefacts Markdown, JSON, journaux, captures d’écran et traces facultatives.
14. Téléverser les artefacts GitHub Actions.
15. Publier un message de statut concis sur la PR ou Discord.

Le scénario doit pouvoir échouer de deux manières différentes :

- **Bogue reproduit** : la base a échoué de la manière attendue.
- **Échec du harnais** : la configuration de l’environnement, les identifiants, l’API Discord, le navigateur ou
  le fournisseur ont échoué avant que l’oracle du bogue soit significatif.

Le rapport final doit séparer ces cas afin que les mainteneurs ne confondent pas un environnement instable
avec le comportement du produit.

## MVP Discord

Le premier scénario doit cibler les réactions de statut Discord dans les canaux de guild où
le mode de livraison de la réponse source est `message_tool_only`.

Pourquoi c’est une bonne graine Mantis :

- C’est visible dans Discord sous forme de réactions sur le message déclencheur.
- Il dispose d’un oracle REST solide via l’état des réactions aux messages Discord.
- Il exerce un vrai Gateway OpenClaw, l’authentification du bot Discord, la distribution de messages,
  le mode de livraison de la réponse source, l’état des réactions de statut et le cycle de vie d’un tour de modèle.
- Il est suffisamment étroit pour garder la première implémentation honnête.

Forme attendue du scénario :

```yaml
id: discord-status-reactions-tool-only
transport: discord
baseline:
  expect:
    reproduced: true
candidate:
  expect:
    fixed: true
config:
  messages:
    ackReaction: "👀"
    ackReactionScope: "group-mentions"
    groupChat:
      visibleReplies: "message_tool"
    statusReactions:
      enabled: true
      timing:
        debounceMs: 0
discord:
  requireMention: true
  notifyChannel: operator-notify
evidence:
  rest:
    messageReactions: true
  browser:
    screenshotMessageRow: true
```

Les preuves de base doivent montrer la réaction d’accusé de réception mise en file, mais aucune
transition de cycle de vie en mode outil uniquement. Les preuves candidates doivent montrer les réactions
de statut de cycle de vie en cours d’exécution lorsque `messages.statusReactions.enabled` est explicitement
à true.

La première tranche exécutable est le scénario QA Discord réel à activation explicite :

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Il configure le SUT avec une gestion de guild toujours active, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` et des réactions de statut explicites. L’oracle
interroge le vrai message déclencheur Discord et attend la séquence observée
`👀 -> 🤔 -> 👍`. Les artefacts incluent `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` et
`discord-status-reactions-tool-only-timeline.png`.

## Éléments QA existants

Mantis doit s’appuyer sur la pile QA privée existante au lieu de repartir de zéro :

- `pnpm openclaw qa discord` exécute déjà une voie Discord réelle avec des bots pilote et
  SUT.
- L’exécuteur de transport réel écrit déjà des rapports et des artefacts de messages observés
  sous `.artifacts/qa-e2e/`.
- Les baux d’identifiants Convex fournissent déjà un accès exclusif aux identifiants de transport réel
  partagés.
- Le service de contrôle du navigateur prend déjà en charge les captures d’écran, les instantanés,
  les profils gérés headless et les profils CDP distants.
- QA Lab dispose déjà d’une interface de débogage et d’un bus pour les tests structurés comme un transport.

La première implémentation Mantis peut être un exécuteur avant/après léger au-dessus de ces
éléments, plus une couche de preuves visuelles.

## Modèle de preuve

Chaque exécution écrit un répertoire d’artefacts stable :

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-summary.json
  baseline/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  candidate/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  comparison.json
  run.log
```

`mantis-summary.json` doit être la source de vérité lisible par machine. Le
rapport Markdown est destiné aux commentaires de PR et à la revue humaine.

Le résumé doit inclure :

- les références et SHA testés
- le transport et l’identifiant du scénario
- le fournisseur de machine et l’identifiant de machine ou de bail
- la source des identifiants sans valeurs secrètes
- le résultat de base
- le résultat candidat
- si le bogue a été reproduit sur la base
- si le candidat l’a corrigé
- les chemins d’artefacts
- les problèmes de configuration ou de nettoyage assainis

Les captures d’écran sont des preuves, pas des secrets. Elles exigent malgré tout une discipline de rédaction :
des noms de canaux privés, des noms d’utilisateurs ou du contenu de messages peuvent apparaître. Pour les PR publiques,
préférez les liens d’artefacts GitHub Actions aux images intégrées tant que la stratégie de rédaction
n’est pas plus solide.

## Navigateur et VNC

La voie navigateur a deux modes :

- **Automatisation headless** : valeur par défaut pour la CI. Chrome s’exécute avec CDP activé, et
  Playwright ou le contrôle de navigateur OpenClaw capture les captures d’écran.
- **Secours VNC** : activé sur la même VM lorsque la connexion, la MFA, l’anti-automatisation Discord
  ou le débogage visuel nécessite un humain.

Le profil de navigateur observateur Discord doit être suffisamment persistant pour éviter de
se connecter à chaque exécution, mais isolé de l’état du navigateur personnel. Un profil
appartient au pool de machines Mantis, pas à l’ordinateur portable d’un développeur.

Quand Mantis se bloque, il publie un message de statut Discord avec :

- l’identifiant d’exécution
- l’identifiant du scénario
- le fournisseur de machine
- le répertoire d’artefacts
- les instructions de connexion VNC ou noVNC si disponibles
- un court texte de blocage

Le premier déploiement privé peut publier ces messages dans le canal opérateur existant
et passer plus tard à un canal Mantis dédié.

## Machines

Mantis doit privilégier AWS via Crabbox pour la première implémentation distante.
Crabbox nous donne des machines préchauffées, le suivi des baux, l’hydratation, les journaux, les résultats et
le nettoyage. Si la capacité AWS est trop lente ou indisponible, ajoutez un fournisseur Hetzner
derrière la même interface de machine.

Exigences minimales de VM :

- Linux avec une installation Chrome ou Chromium compatible avec un bureau
- accès CDP pour l’automatisation du navigateur
- VNC ou noVNC pour le secours
- Node 22 et pnpm
- checkout OpenClaw et cache de dépendances
- cache de navigateur Playwright Chromium lorsque Playwright est utilisé
- suffisamment de CPU et de mémoire pour un Gateway OpenClaw, un navigateur et une exécution de modèle
- accès sortant vers Discord, GitHub, les fournisseurs de modèles et le courtier d’identifiants

La VM ne doit pas conserver de secrets bruts de longue durée en dehors des magasins d’identifiants ou
de profils de navigateur attendus.

## Secrets

Les secrets résident dans les secrets d’organisation ou de dépôt GitHub pour les exécutions distantes, et dans
un fichier de secrets local contrôlé par l’opérateur pour les exécutions locales.

Noms de secrets recommandés :

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` pour les téléversements publics d’artefacts GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

À long terme, le pool d’identifiants Convex doit rester la source normale pour les identifiants
de transport réel. Les secrets GitHub amorcent le courtier et les voies de secours.
Le workflow de réactions de statut Discord mappe les secrets Mantis Crabbox vers
les variables d’environnement `CRABBOX_COORDINATOR` et `CRABBOX_COORDINATOR_TOKEN`
attendues par la CLI Crabbox. Les noms de secrets GitHub simples `CRABBOX_*` restent
acceptés comme solution de compatibilité de repli.

L’exécuteur Mantis ne doit jamais imprimer :

- les tokens de bots Discord
- les clés d’API de fournisseurs
- les cookies de navigateur
- le contenu des profils d’authentification
- les mots de passe VNC
- les charges utiles brutes d’identifiants

Les téléversements d’artefacts publics doivent aussi rédiger les métadonnées de cible Discord telles que les identifiants de bot,
de guild, de canal et de message. Le workflow de smoke GitHub active
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` pour cette raison.

Si un token est accidentellement collé dans une issue, une PR, un chat ou un journal, faites-le tourner
après le stockage du nouveau secret.

## Artefacts GitHub et commentaires de PR

Les workflows Mantis doivent téléverser l’ensemble complet de preuves comme artefact Actions
à durée de vie courte. Lorsque le workflow est exécuté pour un rapport de bogue ou une PR de correction, il doit également
publier les captures d’écran PNG rédigées sur la branche `qa-artifacts` et insérer ou mettre à jour un
commentaire sur ce bogue ou cette PR de correction avec des captures d’écran avant/après intégrées. Ne publiez pas
la preuve principale uniquement sur une PR générique d’automatisation QA. Les journaux bruts, les messages observés
et les autres preuves volumineuses restent dans l’artefact Actions.

Les workflows de production doivent publier ces commentaires avec l’application GitHub Mantis, pas
avec `github-actions[bot]`. Stockez l’identifiant de l’application et la clé privée comme
secrets GitHub Actions `MANTIS_GITHUB_APP_ID` et `MANTIS_GITHUB_APP_PRIVATE_KEY`.
Le workflow utilise un marqueur masqué comme clé d’insertion ou de mise à jour, met à jour ce
commentaire lorsque le token peut le modifier, et crée un nouveau commentaire appartenant à Mantis lorsqu’un
ancien marqueur appartenant au bot ne peut pas être modifié.

Le commentaire de PR doit être court et visuel :

```md
Mantis Discord Status Reactions QA

Summary: Mantis reran the reported Discord status-reaction bug against the known
bad baseline and the candidate fix. The baseline reproduced the bug, while the
candidate showed the expected queued -> thinking -> done sequence.

- Scenario: `discord-status-reactions-tool-only`
- Run: <workflow run link>
- Artifact: <artifact link>
- Baseline: `<status>` at `<sha>`
- Candidate: `<status>` at `<sha>`

| Baseline            | Candidate           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

Lorsque l’exécution échoue parce que le harnais a échoué, le commentaire doit le dire
au lieu d’impliquer que le candidat a échoué.

## Notes de déploiement privé

Un déploiement privé peut déjà avoir une application Discord Mantis. Réutilisez cette
application au lieu de créer une autre application lorsqu’elle dispose des bonnes permissions de bot
et peut être tournée en toute sécurité.

Définissez le canal initial de notification opérateur via des secrets ou la configuration de déploiement.
Il peut d’abord pointer vers un canal de mainteneurs ou d’opérations existant,
puis passer à un canal Mantis dédié lorsqu’il en existe un.

Ne placez pas d’identifiants de guild, d’identifiants de canal, de tokens de bot, de cookies de navigateur ou de mots de passe VNC
dans ce document. Stockez-les dans les secrets GitHub, le courtier d’identifiants ou le
magasin local de secrets de l’opérateur.

## Ajouter un scénario

Un scénario Mantis doit déclarer :

- l’identifiant et le titre
- le transport
- les identifiants requis
- la politique de référence de base
- la politique de référence candidate
- le correctif de configuration OpenClaw
- les étapes de configuration
- le stimulus
- l’oracle de base attendu
- l’oracle candidat attendu
- les cibles de capture visuelle
- le budget de délai d’expiration
- les étapes de nettoyage

Les scénarios doivent préférer de petits oracles typés :

- l’état des réactions Discord pour les bogues de réactions
- les références de messages Discord pour les bogues de fil de discussion
- le ts de fil Slack et l’état de l’API de réactions pour les bogues Slack
- les identifiants et en-têtes de messages email pour les bogues email
- les captures d’écran de navigateur lorsque l’interface utilisateur est le seul observable fiable

Les vérifications par vision doivent être additives. Si une API de plateforme peut prouver le bogue, utilisez
l’API comme oracle réussite/échec et gardez les captures d’écran pour la confiance humaine.

## Extension des fournisseurs

Après Discord, le même exécuteur peut ajouter :

- Slack : réactions, fils, mentions d’application, fenêtres modales, téléversements de fichiers.
- E-mail : authentification Gmail et fils de messages avec `gog` lorsque les connecteurs ne
  suffisent pas.
- WhatsApp : connexion par QR code, ré-identification, remise des messages, médias, réactions.
- Telegram : filtrage des mentions de groupe, commandes, réactions lorsqu’elles sont disponibles.
- Matrix : salons chiffrés, relations de fil ou de réponse, reprise après redémarrage.

Chaque transport doit avoir un scénario de smoke test peu coûteux et un ou plusieurs scénarios
par classe de bogue. Les scénarios visuels coûteux doivent rester facultatifs.

## Questions Ouvertes

- Quel bot Discord doit être le pilote, et lequel doit être le SUT, lorsque le
  bot Mantis existant est réutilisé ?
- La connexion du navigateur observateur doit-elle utiliser un compte Discord humain, un compte de test,
  ou seulement des preuves REST lisibles par le bot pour la première phase ?
- Combien de temps GitHub doit-il conserver les artefacts Mantis pour les PR ?
- Quand ClawSweeper doit-il recommander automatiquement Mantis au lieu d’attendre une
  commande d’un mainteneur ?
- Les captures d’écran doivent-elles être expurgées ou rognées avant le téléversement pour les PR publics ?
