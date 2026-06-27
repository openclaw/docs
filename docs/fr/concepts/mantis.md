---
read_when:
    - Créer ou exécuter une QA visuelle en direct pour les bugs OpenClaw
    - Ajout d’une vérification avant et après pour une pull request
    - Ajouter Discord, Slack, WhatsApp ou d’autres scénarios de transport en direct
    - Débogage des exécutions QA qui nécessitent des captures d’écran, l’automatisation du navigateur ou un accès VNC
summary: Mantis est le système de vérification visuelle de bout en bout permettant de reproduire les bugs d’OpenClaw sur des transports en direct, de capturer des preuves avant et après, et de joindre des artefacts aux PR.
title: Mante
x-i18n:
    generated_at: "2026-06-27T17:24:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9de83fac9bfa64b4828dab96fcbf5fac33466c7ede9406472801dc7322bf3ae
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis est le système de vérification de bout en bout d’OpenClaw pour les bugs qui nécessitent un vrai
runtime, un vrai transport et une preuve visible. Il exécute un scénario sur une référence connue comme
défectueuse, capture les preuves, exécute le même scénario sur une référence candidate, puis
publie la comparaison sous forme d’artefacts qu’un mainteneur peut inspecter depuis une PR ou
depuis une commande locale.

Mantis commence avec Discord parce que Discord nous donne une première voie à forte valeur :
authentification de bot réelle, vrais canaux de guilde, réactions, fils, commandes natives et une
interface navigateur où les humains peuvent confirmer visuellement ce que le transport a affiché.

## Objectifs

- Reproduire un bug depuis une issue ou une PR GitHub avec la même forme de transport que celle que les utilisateurs
  voient.
- Capturer un artefact **avant** sur la référence de base avant d’appliquer le correctif.
- Capturer un artefact **après** sur la référence candidate après avoir appliqué le correctif.
- Utiliser un oracle déterministe chaque fois que possible, comme une lecture de réaction Discord REST
  ou une vérification de transcript de canal.
- Capturer des captures d’écran lorsque le bug a une surface d’interface visible.
- Exécuter localement depuis une CLI contrôlée par agent et à distance depuis GitHub.
- Préserver suffisamment d’état machine pour un secours VNC lorsque la connexion, l’automatisation du navigateur ou
  l’authentification fournisseur se bloque.
- Publier un état concis dans un canal Discord opérateur lorsque l’exécution est bloquée,
  nécessite une aide VNC manuelle ou se termine.

## Non-objectifs

- Mantis ne remplace pas les tests unitaires. Une exécution Mantis doit généralement devenir
  un test de régression plus petit une fois le correctif compris.
- Mantis n’est pas la porte CI rapide normale. Il est plus lent, utilise des identifiants réels et
  est réservé aux bugs où l’environnement réel compte.
- Mantis ne doit pas nécessiter d’humain pour un fonctionnement normal. Le VNC manuel est un chemin de secours,
  pas le chemin attendu.
- Mantis ne stocke pas de secrets bruts dans les artefacts, journaux, captures d’écran, rapports Markdown
  ou commentaires de PR.

## Propriété

Mantis vit dans la pile QA d’OpenClaw.

- OpenClaw possède le runtime de scénario, les adaptateurs de transport, le schéma de preuves et la
  CLI locale sous `pnpm openclaw qa mantis`.
- QA Lab possède les composants du harnais de transport réel, les assistants de capture navigateur et
  les écrivains d’artefacts.
- Crabbox possède les machines Linux préchauffées lorsqu’une VM distante est nécessaire.
- GitHub Actions possède le point d’entrée du workflow distant et la rétention des artefacts.
- ClawSweeper possède le routage des commentaires GitHub : analyse des commandes mainteneur,
  déclenchement du workflow et publication du commentaire final de PR.
- Les agents OpenClaw pilotent Mantis via Codex lorsqu’un scénario nécessite une configuration agentique,
  du débogage ou un signalement d’état bloqué.

Cette frontière garde la connaissance du transport dans OpenClaw, la planification des machines dans
Crabbox et la colle du workflow mainteneur dans ClawSweeper.

## Forme de commande

La première commande locale vérifie le bot Discord, la guilde, le canal, l’envoi de message,
l’envoi de réaction et le chemin d’artefact :

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Le lanceur local avant et après accepte cette forme :

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Le lanceur crée des worktrees détachés de base et candidat sous le répertoire de sortie,
installe les dépendances, construit chaque référence, exécute le scénario avec
`--allow-failures`, puis écrit `baseline/`, `candidate/`, `comparison.json`,
et `mantis-report.md`. Pour le premier scénario Discord, une vérification réussie
signifie que l’état de base est `fail` et que l’état candidat est `pass`.

La seconde sonde Discord avant/après cible les pièces jointes de fils :

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Ce scénario publie un message parent avec le bot pilote, crée un vrai fil Discord,
appelle l’action `message.thread-reply` d’OpenClaw avec un `filePath` local au dépôt,
puis interroge le fil pour trouver la réponse du SUT et le nom de fichier de la pièce jointe. La
capture d’écran de base montre la réponse sans pièce jointe ; la capture d’écran candidate
montre la pièce jointe `mantis-thread-report.md` attendue.

La première primitive VM/navigateur est le smoke desktop :

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Elle loue ou réutilise une machine desktop Crabbox, démarre un navigateur visible dans la
session VNC, capture le desktop, rapatrie les artefacts dans le répertoire de sortie
local et écrit la commande de reconnexion dans le rapport. La commande utilise par défaut
le fournisseur Hetzner parce qu’il est le premier fournisseur avec une couverture desktop/VNC
fonctionnelle dans la voie Mantis. Remplacez-le avec `--provider`, `--crabbox-bin` ou
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` lors de l’exécution contre une autre flotte Crabbox.

Indicateurs utiles pour le smoke desktop :

- `--lease-id <cbx_...>` ou `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` réutilise un desktop préchauffé.
- `--browser-url <url>` change la page ouverte dans le navigateur visible.
- `--html-file <path>` rend un artefact HTML local au dépôt dans le navigateur visible. Mantis l’utilise pour capturer la timeline générée des réactions d’état Discord via un vrai desktop Crabbox.
- `--browser-profile-dir <remote-path>` réutilise un user-data-dir Chrome distant afin qu’un desktop Mantis persistant puisse rester connecté entre les exécutions. Utilisez-le pour le profil de visionneuse Discord Web de longue durée.
- `--browser-profile-archive-env <name>` restaure une archive user-data-dir Chrome `.tgz` en base64 depuis la variable d’environnement nommée avant de lancer le navigateur. Utilisez-le pour les témoins connectés comme Discord Web. La variable d’environnement par défaut est `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` contrôle la durée de capture MP4. Utilisez une durée plus longue pour les applications web connectées lentes qui ont besoin de temps pour se stabiliser.
- `--keep-lease` ou `OPENCLAW_MANTIS_KEEP_VM=1` garde ouverte une location nouvellement créée et réussie pour inspection VNC. Les exécutions échouées gardent la location par défaut lorsqu’une location a été créée afin qu’un opérateur puisse se reconnecter.
- `--class`, `--idle-timeout` et `--ttl` règlent la taille de la machine et la durée de vie de la location.

Pour les preuves Discord Web, Mantis utilise un compte visionneuse dédié au lieu d’un
jeton de bot. Le scénario API Discord réel reste l’oracle : il crée le vrai
fil, envoie le `thread-reply` du SUT et vérifie la pièce jointe via Discord
REST. Lorsque `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` est défini, le scénario écrit aussi
un artefact d’URL Discord Web. Lorsque `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` est
défini, il laisse ce fil disponible assez longtemps pour qu’un navigateur connecté puisse l’ouvrir
et l’enregistrer.

Le workflow GitHub ouvre l’URL du fil candidat dans Discord Web, capture une
capture d’écran, enregistre un MP4 et génère un aperçu GIF tronqué au mouvement lorsque l’outillage
média Crabbox est disponible. Préférez un chemin de profil visionneuse persistant configuré
via `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, parce que les archives de profil Chrome complètes
peuvent dépasser la limite de taille des secrets GitHub. Pour les petits profils ou les profils d’amorçage,
le workflow peut aussi restaurer une archive `.tgz` en base64 depuis
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Si aucune source de profil n’est
configurée, le workflow publie tout de même les captures d’écran déterministes des pièces jointes
de base/candidate et journalise un avis indiquant que le témoin Discord Web connecté
a été ignoré.

La première primitive complète de transport desktop est le smoke desktop Slack :

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Elle loue ou réutilise une machine desktop Crabbox, synchronise le checkout actuel dans
la VM, exécute `pnpm openclaw qa slack` dans cette VM, ouvre Slack Web dans le navigateur
VNC, capture le desktop visible et copie à la fois les artefacts QA Slack et
la capture d’écran VNC dans le répertoire de sortie local. C’est la première forme Mantis
où le Gateway OpenClaw SUT et le navigateur vivent tous deux dans la même
VM desktop Linux.

Avec `--gateway-setup`, la commande prépare un home OpenClaw jetable persistant
à `$HOME/.openclaw-mantis/slack-openclaw`, patche la configuration Slack Socket Mode
pour le canal sélectionné, démarre `openclaw gateway run` sur le port
`38973` et garde Chrome actif dans la session VNC. C’est le mode « laissez-moi un
desktop Linux avec Slack et une claw en cours d’exécution » ; la voie QA Slack bot à bot
reste la valeur par défaut lorsque `--gateway-setup` est omis.

Entrées requises pour `--credential-source env` :

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` pour la voie modèle distante. Si seul
  `OPENAI_API_KEY` est défini localement, Mantis le mappe vers `OPENCLAW_LIVE_OPENAI_KEY`
  avant d’invoquer Crabbox afin que le transfert d’environnement `OPENCLAW_*` de Crabbox puisse l’emporter
  dans la VM.

Avec `--gateway-setup --credential-source convex`, Mantis loue les identifiants Slack SUT
depuis le pool partagé avant de créer la VM et transfère l’id de canal loué,
le jeton d’application Socket Mode et le jeton de bot comme environnement runtime `OPENCLAW_MANTIS_SLACK_*`
dans le desktop. Cela garde les workflows GitHub légers : ils n’ont besoin que
du secret de courtier Convex, pas des jetons bruts de bot ou d’application Slack.

Indicateurs utiles pour le desktop Slack :

- `--lease-id <cbx_...>` relance sur une machine où un opérateur s’est déjà connecté à Slack Web via VNC.
- `--gateway-setup` démarre un Gateway Slack OpenClaw persistant dans la VM au lieu d’exécuter seulement la voie QA bot à bot.
- `--keep-lease` garde la VM Gateway ouverte pour inspection VNC après réussite ; `--no-keep-lease` l’arrête après la collecte des artefacts.
- `--slack-url <url>` ouvre une URL Slack Web spécifique. Sans cela, Mantis dérive `https://app.slack.com/client/<team>/<channel>` depuis Slack `auth.test` lorsque le jeton de bot SUT est disponible.
- `--slack-channel-id <id>` contrôle la liste d’autorisation des canaux Slack utilisée par la configuration Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` contrôle le profil Chrome persistant dans la VM. La valeur par défaut est `$HOME/.config/openclaw-mantis/slack-chrome-profile`, afin qu’une connexion Slack Web manuelle survive aux réexécutions sur la même location.
- `--credential-source convex --credential-role ci` utilise le pool d’identifiants partagé au lieu de jetons Slack d’environnement directs.
- `--provider-mode`, `--model`, `--alt-model` et `--fast` sont transmis à la voie live Slack.

Les exécutions de checkpoint d’approbation rendent les instantanés de messages Slack API en PNG de checkpoint
pour une preuve visuelle compatible CI. `slack-desktop-smoke.png` n’est une preuve de Slack Web
que lorsque la location utilise un profil de navigateur chaud déjà connecté.

Le workflow de smoke GitHub est `Mantis Discord Smoke`. Le workflow GitHub avant et après
pour le premier vrai scénario est `Mantis Discord Status Reactions`. Il
accepte :

- `baseline_ref` : la référence censée reproduire le comportement uniquement en file d’attente.
- `candidate_ref` : la référence censée afficher `queued -> thinking -> done`.

Il checkout la référence du harnais de workflow, construit des worktrees de base et candidat
séparés, exécute `discord-status-reactions-tool-only` contre chaque worktree et
téléverse `baseline/`, `candidate/`, `comparison.json` et `mantis-report.md` comme
artefacts Actions. Il rend aussi le HTML de timeline de chaque voie dans un navigateur desktop
Crabbox et publie ces captures d’écran VNC à côté des PNG de timeline déterministes
dans le commentaire de PR. Le même commentaire de PR intègre des aperçus GIF légers
tronqués au mouvement générés par `crabbox media preview`, lie les clips MP4
tronqués au mouvement correspondants et conserve les fichiers MP4 desktop complets pour une inspection
approfondie. Les captures d’écran restent en ligne pour une revue rapide. Le workflow construit la
CLI Crabbox depuis la branche main de
`openclaw/crabbox` afin de pouvoir utiliser les indicateurs actuels de location desktop/navigateur
avant la prochaine publication du binaire Crabbox.

`Mantis Scenario` est le point d’entrée manuel générique. Il prend un `scenario_id`,
un `candidate_ref`, un `baseline_ref` facultatif et un `pr_number` facultatif, puis
déclenche le workflow détenu par le scénario. Le wrapper est volontairement léger :
les workflows de scénario restent responsables de leur configuration de transport, de leurs identifiants, de leur classe de VM,
de l’oracle attendu et du manifeste d’artefacts.

`Mantis Slack Desktop Smoke` est le premier workflow VM Slack. Il extrait la ref de
candidat approuvée dans un worktree séparé, loue un bureau Linux Crabbox,
exécute `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` sur ce
candidat, ouvre Slack Web dans le navigateur VNC, enregistre le bureau, génère un
aperçu rogné sur le mouvement avec `crabbox media preview`, téléverse le répertoire complet
des artefacts et publie facultativement le commentaire de preuve intégré sur la PR cible.
Il utilise AWS par défaut pour la location du bureau et expose une entrée manuelle de fournisseur afin que
les opérateurs puissent basculer vers Hetzner lorsque la capacité AWS est lente ou indisponible. Utilisez
cette voie lorsque vous voulez « un bureau Linux avec Slack et un agent OpenClaw en cours d’exécution » au lieu
d’un simple transcript Slack de bot à bot.

`Mantis Telegram Live` encapsule la voie d’assurance qualité Telegram live existante dans le même pipeline de
preuve de PR. Il extrait la ref de candidat approuvée dans un worktree séparé,
exécute `pnpm openclaw qa telegram --credential-source convex
--credential-role ci`, écrit un manifeste `mantis-evidence.json` à partir du
récapitulatif d’assurance qualité Telegram, de `qa-evidence.json` et des artefacts de rapport, rend le
HTML de preuve expurgé via un navigateur de bureau Crabbox, génère un
GIF rogné sur le mouvement avec `crabbox media preview` et publie le commentaire de preuve
intégré sur la PR lorsqu’un numéro de PR est disponible. Cette voie est une preuve visuelle
d’assurance qualité plutôt qu’une preuve Telegram Web avec connexion : l’API Telegram Bot fournit des
preuves stables de messages live, mais l’état de connexion Telegram Web n’est pas requis pour l’automatisation Mantis
normale.

`Mantis Telegram Desktop Proof` est le wrapper agentique natif Telegram Desktop
avant/après. Un mainteneur peut le déclencher depuis un commentaire de PR avec
`@openclaw-mantis telegram desktop proof`, depuis l’interface Actions avec des
instructions libres, ou via le répartiteur générique `Mantis Scenario`. Le workflow
transmet à Codex la PR, la ref de référence, la ref de candidat et les instructions du mainteneur.
L’agent lit la PR, décide quel comportement visible dans Telegram prouve le
changement, exécute la voie de preuve Crabbox Telegram Desktop avec utilisateur réel pour la référence et le
candidat, itère jusqu’à ce que les GIFs natifs soient utiles, écrit les artefacts
`motionPreview` appariés dans `mantis-evidence.json`, téléverse le paquet et
publie un tableau de preuve de PR en 2 colonnes lorsqu’un numéro de PR est disponible.

Pour la configuration Telegram desktop avec intervention humaine, utilisez le générateur de scénario :

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Le générateur loue ou réutilise un bureau Crabbox, installe le binaire natif Linux
Telegram Desktop, restaure facultativement une archive de session utilisateur, configure
OpenClaw avec le jeton de bot Telegram SUT loué, démarre `openclaw gateway run`
sur le port `38974`, publie un message de disponibilité du bot pilote dans le groupe privé
loué, puis capture une capture d’écran et un MP4 depuis le bureau VNC visible. Un jeton de
bot ne connecte jamais Telegram Desktop ; il configure uniquement OpenClaw. Le visualiseur de bureau
est une session utilisateur Telegram distincte restaurée depuis
`--telegram-profile-archive-env <name>` ou créée manuellement via VNC et maintenue
active avec `--keep-lease`.

Indicateurs utiles du générateur Telegram desktop :

- `--lease-id <cbx_...>` relance sur une VM où un opérateur s’est déjà connecté à Telegram Desktop.
- `--telegram-profile-archive-env <name>` lit une archive de profil Telegram Desktop `.tgz` en base64 depuis cette variable d’environnement et la restaure avant le lancement.
- `--telegram-profile-dir <remote-path>` contrôle le répertoire distant du profil Telegram Desktop. La valeur par défaut est `$HOME/.local/share/TelegramDesktop`.
- `--no-gateway-setup` installe et ouvre Telegram Desktop sans configurer OpenClaw.
- `--credential-source convex --credential-role ci` utilise le courtier d’identifiants partagé au lieu de jetons Telegram directs dans l’environnement.

Chaque scénario publiant une PR écrit `mantis-evidence.json` à côté de son rapport.
Ce schéma est le transfert entre le code de scénario et les commentaires GitHub :

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

Les valeurs `path` des artefacts sont relatives au répertoire du manifeste. Les valeurs
`targetPath` sont des chemins relatifs sous le préfixe d’artefacts Mantis R2/S3 configuré. Le
publisher rejette les traversées de chemin et ignore les entrées marquées `"required": false`
lorsque les aperçus ou vidéos facultatifs ne sont pas disponibles.

Types d’artefacts pris en charge :

- `timeline` : capture d’écran de scénario déterministe, généralement avant/après.
- `desktopScreenshot` : capture d’écran du bureau VNC/navigateur.
- `motionPreview` : GIF animé intégré généré à partir de l’enregistrement du bureau.
- `motionClip` : MP4 rogné sur le mouvement qui retire l’introduction et la fin statiques.
- `fullVideo` : enregistrement MP4 complet pour une inspection approfondie.
- `metadata` : annexe JSON/journal.
- `report` : rapport Markdown.

Le publisher réutilisable est `scripts/mantis/publish-pr-evidence.mjs`. Les workflows
l’appellent avec le manifeste, la PR cible, la racine cible des artefacts, le marqueur de commentaire,
l’URL d’artefact Actions, l’URL d’exécution et la source de la demande. Il téléverse les artefacts déclarés
vers le bucket Mantis R2/S3 configuré, construit un commentaire de PR centré d’abord sur le
récapitulatif avec images/aperçus intégrés et vidéos liées, puis met à jour le commentaire marqueur
existant ou en crée un. Les workflows publient vers `openclaw-crabbox-artifacts`
avec des URL publiques sous `https://artifacts.openclaw.ai`. Ils fournissent directement les valeurs de bucket,
de région et d’URL publique. Le publisher réutilisable exige :

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`

Vous pouvez aussi déclencher directement l’exécution status-reactions depuis un commentaire de PR :

```text
@openclaw-mantis discord status reactions
```

Le déclencheur par commentaire est volontairement étroit. Il ne s’exécute que sur les commentaires de pull request
provenant d’utilisateurs avec accès en écriture, maintenance ou administration, et il ne reconnaît que
les demandes Discord status-reaction. Par défaut, il utilise la ref de référence connue comme défaillante
et le SHA de tête de la PR actuelle comme candidat. Les mainteneurs peuvent remplacer l’une ou l’autre
ref :

```text
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
```

L’assurance qualité Telegram live peut aussi être déclenchée depuis un commentaire de PR :

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

Par défaut, elle utilise le SHA de tête de la PR actuelle comme candidat et exécute
`telegram-status-command`. Les mainteneurs peuvent remplacer `candidate=...`,
`provider=aws|hetzner` et `lease=<cbx_...>` lorsqu’ils ont besoin d’une ref spécifique ou d’un
bureau Crabbox préchauffé.

Exemples de commandes ClawSweeper :

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

La première commande est explicite et centrée sur le scénario. La seconde pourra ensuite mapper une PR
ou une issue vers des scénarios Mantis recommandés à partir des labels, des fichiers modifiés et des
constats de revue ClawSweeper.

## Cycle de vie de l’exécution

1. Acquérir les identifiants.
2. Allouer ou réutiliser une VM.
3. Préparer le profil de bureau/navigateur lorsque le scénario nécessite une preuve UI.
4. Préparer un checkout propre pour la ref de référence.
5. Installer les dépendances et construire uniquement ce dont le scénario a besoin.
6. Démarrer un Gateway OpenClaw enfant avec un répertoire d’état isolé.
7. Configurer le transport live, le fournisseur, le modèle et le profil de navigateur.
8. Exécuter le scénario et capturer la preuve de référence.
9. Arrêter le gateway et conserver les journaux.
10. Préparer la ref de candidat dans la même VM.
11. Exécuter le même scénario et capturer la preuve du candidat.
12. Comparer les résultats de l’oracle et les preuves visuelles.
13. Écrire le Markdown, le JSON, les journaux, les captures d’écran et les artefacts de trace facultatifs.
14. Téléverser les artefacts GitHub Actions.
15. Publier un message de statut concis sur la PR ou Discord.

Le scénario doit pouvoir échouer de deux façons différentes :

- **Bug reproduit** : la référence a échoué de la manière attendue.
- **Échec du harness** : la configuration de l’environnement, les identifiants, l’API Discord, le navigateur ou
  le fournisseur ont échoué avant que l’oracle du bug ait du sens.

Le rapport final doit séparer ces cas afin que les mainteneurs ne confondent pas un
environnement instable avec le comportement du produit.

## MVP Discord

Le premier scénario doit cibler les réactions de statut Discord dans les salons de guilde où
le mode de livraison de réponse source est `message_tool_only`.

Pourquoi c’est une bonne base initiale pour Mantis :

- C’est visible dans Discord sous forme de réactions sur le message déclencheur.
- Il dispose d’un oracle REST solide via l’état des réactions du message Discord.
- Il exerce un vrai Gateway OpenClaw, l’authentification de bot Discord, la répartition des messages,
  le mode de livraison de réponse source, l’état des réactions de statut et le cycle de vie du tour du modèle.
- Il est assez étroit pour garder la première implémentation honnête.

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

La preuve de référence doit montrer la réaction d’accusé de réception en file d’attente, mais aucune
transition de cycle de vie en mode tool-only. La preuve du candidat doit montrer les réactions de statut du
cycle de vie qui s’exécutent lorsque `messages.statusReactions.enabled` est explicitement
vrai.

La première tranche exécutable est le scénario d’assurance qualité live Discord avec opt-in :

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Il configure le SUT avec une gestion de guilde toujours active, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` et des réactions de statut explicites. L’oracle
interroge le vrai message déclencheur Discord et attend la séquence observée
`👀 -> 🤔 -> 👍`. Les artefacts incluent `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` et
`discord-status-reactions-tool-only-timeline.png`.

## Éléments d’assurance qualité existants

Mantis doit s’appuyer sur la pile d’assurance qualité privée existante au lieu de partir de
zéro :

- `pnpm openclaw qa discord` exécute déjà une voie Discord live avec des bots pilote et
  SUT.
- Le runner de transport live écrit déjà les rapports, les preuves d’assurance qualité et les
  artefacts propres au transport sous `.artifacts/qa-e2e/`.
- Les locations d’identifiants Convex fournissent déjà un accès exclusif aux identifiants de transport
  live partagés.
- Le service de contrôle de navigateur prend déjà en charge les captures d’écran, les instantanés,
  les profils gérés headless et les profils CDP distants.
- QA Lab dispose déjà d’une interface de débogage et d’un bus pour les tests structurés comme des transports.

La première implémentation Mantis peut être un runner avant/après léger au-dessus de ces
éléments, avec une couche de preuve visuelle.

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

- les refs et les SHA testés
- le transport et l’id du scénario
- le fournisseur de machine et l’id de machine ou l’id de bail
- la source des identifiants sans valeurs secrètes
- le résultat de la baseline
- le résultat du candidat
- si le bug a été reproduit sur la baseline
- si le candidat l’a corrigé
- les chemins des artefacts
- les problèmes de configuration ou de nettoyage assainis

Les captures d’écran sont des preuves, pas des secrets. Elles nécessitent tout
de même une discipline de rédaction : des noms de canaux privés, des noms
d’utilisateurs ou du contenu de messages peuvent apparaître. Pour les PR
publiques, préférez les liens d’artefacts GitHub Actions aux images intégrées
tant que l’approche de rédaction n’est pas plus solide.

## Navigateur et VNC

La voie navigateur comporte deux modes :

- **Automatisation sans interface** : valeur par défaut pour la CI. Chrome
  s’exécute avec CDP activé, et Playwright ou le contrôle navigateur OpenClaw
  capture les captures d’écran.
- **Secours VNC** : activé sur la même VM lorsque la connexion, la MFA,
  l’anti-automatisation de Discord ou le débogage visuel nécessite un humain.

Le profil de navigateur observateur Discord doit être suffisamment persistant
pour éviter une connexion à chaque exécution, mais isolé de l’état du navigateur
personnel. Un profil appartient au pool de machines Mantis, pas à l’ordinateur
portable d’un développeur.

Quand Mantis se bloque, il publie un message d’état Discord avec :

- l’id d’exécution
- l’id du scénario
- le fournisseur de machine
- le répertoire d’artefacts
- les instructions de connexion VNC ou noVNC si disponibles
- un court texte décrivant le blocage

Le premier déploiement privé peut publier ces messages dans le canal opérateur
existant et passer plus tard à un canal Mantis dédié.

## Machines

Mantis doit privilégier AWS via Crabbox pour la première implémentation distante.
Crabbox nous fournit des machines préchauffées, le suivi des baux, l’hydratation,
les journaux, les résultats et le nettoyage. Si la capacité AWS est trop lente
ou indisponible, ajoutez un fournisseur Hetzner derrière la même interface de
machine.

Exigences minimales de VM :

- Linux avec une installation Chrome ou Chromium compatible bureau
- accès CDP pour l’automatisation du navigateur
- VNC ou noVNC pour le secours
- Node 22 et pnpm
- checkout OpenClaw et cache des dépendances
- cache du navigateur Chromium Playwright lorsque Playwright est utilisé
- suffisamment de CPU et de mémoire pour un Gateway OpenClaw, un navigateur et
  une exécution de modèle
- accès sortant à Discord, GitHub, aux fournisseurs de modèles et au courtier
  d’identifiants

La VM ne doit pas conserver de secrets bruts de longue durée en dehors des
magasins d’identifiants ou de profils navigateur attendus.

## Secrets

Les secrets résident dans les secrets d’organisation ou de dépôt GitHub pour les
exécutions distantes, et dans un fichier secret local contrôlé par l’opérateur
pour les exécutions locales.

Noms de secrets recommandés :

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` pour les téléversements d’artefacts GitHub publics
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

À long terme, le pool d’identifiants Convex doit rester la source normale pour
les identifiants de transport live. Les secrets GitHub amorcent le courtier et
les voies de repli. Le workflow des réactions d’état Discord mappe les secrets
Mantis Crabbox vers les variables d’environnement `CRABBOX_COORDINATOR` et
`CRABBOX_COORDINATOR_TOKEN` attendues par la CLI Crabbox. Les noms de secrets
GitHub `CRABBOX_*` simples restent acceptés comme solution de repli de
compatibilité.

Le runner Mantis ne doit jamais imprimer :

- les jetons de bots Discord
- les clés d’API des fournisseurs
- les cookies de navigateur
- le contenu des profils d’authentification
- les mots de passe VNC
- les charges utiles brutes d’identifiants

Les téléversements d’artefacts publics doivent aussi rédiger les métadonnées de
cible Discord comme les ids de bot, de guild, de canal et de message. Le
workflow smoke GitHub active `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` pour cette
raison.

Si un jeton est accidentellement collé dans une issue, une PR, une discussion ou
un journal, faites-le tourner après avoir stocké le nouveau secret.

## Artefacts GitHub et commentaires de PR

Les workflows Mantis doivent téléverser le bundle complet de preuves comme
artefact Actions à courte durée de vie. Lorsque le workflow est exécuté pour un
rapport de bug ou une PR de correction, il doit aussi publier les médias
intégrés rédigés dans le compartiment Mantis R2/S3 configuré et faire un upsert
d’un commentaire sur ce bug ou cette PR de correction avec des captures d’écran
avant/après intégrées. Ne publiez pas la preuve principale uniquement sur une PR
générique d’automatisation QA. Les journaux bruts, les messages observés et les
autres preuves volumineuses restent dans l’artefact Actions.

Les workflows de production doivent publier ces commentaires avec la GitHub App
Mantis, pas avec `github-actions[bot]`. Stockez l’id de l’application et la clé
privée comme secrets GitHub Actions `MANTIS_GITHUB_APP_ID` et
`MANTIS_GITHUB_APP_PRIVATE_KEY`. Le workflow utilise un marqueur masqué comme
clé d’upsert, met à jour ce commentaire lorsque le jeton peut le modifier, et
crée un nouveau commentaire appartenant à Mantis lorsqu’un ancien marqueur
appartenant à un bot ne peut pas être modifié.

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

Lorsque l’exécution échoue parce que le harnais a échoué, le commentaire doit
l’indiquer au lieu de laisser entendre que le candidat a échoué.

## Notes de déploiement privé

Un déploiement privé peut déjà disposer d’une application Discord Mantis.
Réutilisez cette application au lieu d’en créer une autre lorsqu’elle possède les
bonnes permissions de bot et peut faire l’objet d’une rotation en toute sécurité.

Définissez le canal initial de notification de l’opérateur via des secrets ou la
configuration de déploiement. Il peut d’abord pointer vers un canal mainteneur ou
opérations existant, puis passer à un canal Mantis dédié une fois celui-ci créé.

Ne mettez pas d’ids de guild, d’ids de canal, de jetons de bot, de cookies de
navigateur ni de mots de passe VNC dans ce document. Stockez-les dans les
secrets GitHub, le courtier d’identifiants ou le magasin secret local de
l’opérateur.

## Ajouter un scénario

Un scénario Mantis doit déclarer :

- l’id et le titre
- le transport
- les identifiants requis
- la politique de ref de baseline
- la politique de ref candidate
- le correctif de configuration OpenClaw
- les étapes de configuration
- le stimulus
- l’oracle de baseline attendu
- l’oracle candidat attendu
- les cibles de capture visuelle
- le budget de délai d’expiration
- les étapes de nettoyage

Les scénarios doivent privilégier de petits oracles typés :

- l’état des réactions Discord pour les bugs de réactions
- les références de messages Discord pour les bugs de fils
- le ts de fil Slack et l’état de l’API de réactions pour les bugs Slack
- les ids et en-têtes de messages e-mail pour les bugs e-mail
- les captures d’écran de navigateur lorsque l’UI est le seul observable fiable

Les vérifications visuelles doivent être additives. Si une API de plateforme peut
prouver le bug, utilisez l’API comme oracle réussite/échec et conservez les
captures d’écran pour la confiance humaine.

## Extension des fournisseurs

Après Discord, le même runner peut ajouter :

- Slack : réactions, fils, mentions d’application, modales, téléversements de fichiers.
- E-mail : authentification Gmail et fils de messages avec `gog` lorsque les connecteurs ne suffisent pas.
- WhatsApp : connexion par QR, réidentification, livraison des messages, médias, réactions.
- Telegram : filtrage des mentions de groupe, commandes, réactions lorsqu’elles sont disponibles.
- Matrix : salons chiffrés, relations de fil ou de réponse, reprise après redémarrage.

Chaque transport doit disposer d’un scénario smoke peu coûteux et d’un ou de
plusieurs scénarios par classe de bug. Les scénarios visuels coûteux doivent
rester opt-in.

## Questions ouvertes

- Quel bot Discord doit être le pilote, et lequel doit être le SUT, lorsque le
  bot Mantis existant est réutilisé ?
- La connexion du navigateur observateur doit-elle utiliser un compte Discord
  humain, un compte de test ou uniquement des preuves REST lisibles par bot pour
  la première phase ?
- Combien de temps GitHub doit-il conserver les artefacts Mantis pour les PR ?
- Quand ClawSweeper doit-il recommander automatiquement Mantis au lieu d’attendre
  une commande de mainteneur ?
- Les captures d’écran doivent-elles être rédigées ou recadrées avant le
  téléversement pour les PR publiques ?
