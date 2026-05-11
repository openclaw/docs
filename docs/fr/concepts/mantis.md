---
read_when:
    - Créer ou exécuter une assurance qualité visuelle en direct pour les bogues d’OpenClaw
    - Ajout d’une vérification avant et après pour une demande d’extraction
    - Ajout de scénarios de transport en direct pour Discord, Slack, WhatsApp ou d’autres
    - Débogage des exécutions d’assurance qualité qui nécessitent des captures d’écran, l’automatisation du navigateur ou un accès VNC
summary: Mantis est le système de vérification visuelle de bout en bout destiné à reproduire les bugs OpenClaw sur des transports en direct, capturer les preuves avant et après, et joindre les artefacts aux PRs.
title: Mante religieuse
x-i18n:
    generated_at: "2026-05-11T20:31:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 465ed7c994e8821fc64ca46a58de46cbec8b4ba687862b00398f7b0d22d62b44
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis est le système de vérification de bout en bout d’OpenClaw pour les bugs qui nécessitent un vrai
runtime, un vrai transport et une preuve visible. Il exécute un scénario sur une ref connue
défectueuse, capture des preuves, exécute le même scénario sur une ref candidate, puis
publie la comparaison sous forme d’artifacts qu’un mainteneur peut inspecter depuis une PR ou
depuis une commande locale.

Mantis commence par Discord, car Discord nous offre une première voie de grande valeur :
authentification de bot réelle, vrais canaux de guilde, réactions, fils, commandes natives et une
interface de navigateur où les humains peuvent confirmer visuellement ce que le transport a montré.

## Objectifs

- Reproduire un bug depuis une issue ou une PR GitHub avec la même forme de transport que celle que les utilisateurs
  voient.
- Capturer un artifact **avant** sur la ref de référence avant d’appliquer le correctif.
- Capturer un artifact **après** sur la ref candidate après avoir appliqué le correctif.
- Utiliser un oracle déterministe chaque fois que possible, comme une lecture de réaction via Discord REST
  ou une vérification de transcription de canal.
- Capturer des captures d’écran lorsque le bug a une surface d’interface visible.
- Exécuter localement depuis une CLI contrôlée par un agent et à distance depuis GitHub.
- Préserver suffisamment d’état machine pour un secours VNC lorsque la connexion, l’automatisation du navigateur ou
  l’authentification du fournisseur se bloque.
- Publier un statut concis dans un canal Discord d’opérateur lorsque l’exécution est bloquée,
  nécessite une aide VNC manuelle ou se termine.

## Non-objectifs

- Mantis ne remplace pas les tests unitaires. Une exécution Mantis devrait généralement devenir
  un test de régression plus petit une fois le correctif compris.
- Mantis n’est pas la porte CI rapide normale. Il est plus lent, utilise des identifiants réels et
  est réservé aux bugs où l’environnement réel compte.
- Mantis ne devrait pas nécessiter d’humain en fonctionnement normal. Le VNC manuel est un chemin de secours,
  pas le chemin attendu.
- Mantis ne stocke pas de secrets bruts dans les artifacts, les journaux, les captures d’écran, les rapports Markdown
  ou les commentaires de PR.

## Propriété

Mantis vit dans la pile QA d’OpenClaw.

- OpenClaw possède le runtime de scénario, les adaptateurs de transport, le schéma de preuves et
  la CLI locale sous `pnpm openclaw qa mantis`.
- QA Lab possède les éléments du harnais de transport réel, les assistants de capture navigateur et
  les rédacteurs d’artifacts.
- Crabbox possède les machines Linux préchauffées lorsqu’une VM distante est nécessaire.
- GitHub Actions possède le point d’entrée du workflow distant et la rétention des artifacts.
- ClawSweeper possède le routage des commentaires GitHub : analyse des commandes de mainteneur,
  déclenchement du workflow et publication du commentaire final de PR.
- Les agents OpenClaw pilotent Mantis via Codex lorsqu’un scénario nécessite une configuration agentique,
  du débogage ou un rapport d’état bloqué.

Cette limite conserve la connaissance du transport dans OpenClaw, la planification des machines dans
Crabbox, et le liant du workflow mainteneur dans ClawSweeper.

## Forme de commande

La première commande locale vérifie le bot Discord, la guilde, le canal, l’envoi de message,
l’envoi de réaction et le chemin d’artifact :

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

Le lanceur crée des worktrees détachés de référence et candidats sous le répertoire de sortie,
installe les dépendances, construit chaque ref, exécute le scénario avec
`--allow-failures`, puis écrit `baseline/`, `candidate/`, `comparison.json`,
et `mantis-report.md`. Pour le premier scénario Discord, une vérification réussie
signifie que le statut de référence est `fail` et que le statut candidat est `pass`.

La deuxième sonde Discord avant/après cible les pièces jointes de fils :

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
capture d’écran de référence montre la réponse sans pièce jointe ; la capture d’écran candidate
montre la pièce jointe attendue `mantis-thread-report.md`.

La première primitive VM/navigateur est le smoke de bureau :

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Elle loue ou réutilise une machine de bureau Crabbox, démarre un navigateur visible dans la
session VNC, capture le bureau, rapatrie les artifacts dans le répertoire de sortie local,
et écrit la commande de reconnexion dans le rapport. La commande utilise par défaut
le fournisseur Hetzner, car c’est le premier fournisseur avec une couverture bureau/VNC fonctionnelle
dans la voie Mantis. Remplacez-le avec `--provider`, `--crabbox-bin` ou
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` lors de l’exécution sur une autre flotte Crabbox.

Indicateurs utiles pour le smoke de bureau :

- `--lease-id <cbx_...>` ou `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` réutilise un bureau préchauffé.
- `--browser-url <url>` modifie la page ouverte dans le navigateur visible.
- `--html-file <path>` rend un artifact HTML local au dépôt dans le navigateur visible. Mantis l’utilise pour capturer la chronologie générée des réactions de statut Discord via un vrai bureau Crabbox.
- `--browser-profile-dir <remote-path>` réutilise un user-data-dir Chrome distant afin qu’un bureau Mantis persistant puisse rester connecté entre les exécutions. Utilisez-le pour le profil longue durée du visualiseur Discord Web.
- `--browser-profile-archive-env <name>` restaure une archive user-data-dir Chrome `.tgz` en base64 depuis la variable d’environnement nommée avant de lancer le navigateur. Utilisez-le pour des témoins connectés comme Discord Web. La variable d’environnement par défaut est `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` contrôle la durée de capture MP4. Utilisez une durée plus longue pour les applications web lentes connectées qui ont besoin de temps pour se stabiliser.
- `--keep-lease` ou `OPENCLAW_MANTIS_KEEP_VM=1` conserve ouverte une nouvelle location réussie pour inspection VNC. Les exécutions échouées conservent la location par défaut lorsqu’une location a été créée afin qu’un opérateur puisse se reconnecter.
- `--class`, `--idle-timeout` et `--ttl` ajustent la taille de la machine et la durée de vie de la location.

Pour les preuves Discord Web, Mantis utilise un compte visualiseur dédié au lieu d’un
jeton de bot. Le scénario API Discord réel reste l’oracle : il crée le vrai
fil, envoie le `thread-reply` du SUT et vérifie la pièce jointe via Discord
REST. Lorsque `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` est défini, le scénario écrit aussi
un artifact d’URL Discord Web. Lorsque `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` est
défini, il laisse ce fil disponible assez longtemps pour qu’un navigateur connecté l’ouvre
et l’enregistre.

Le workflow GitHub ouvre l’URL du fil candidat dans Discord Web, capture une
capture d’écran, enregistre un MP4 et génère un aperçu GIF rogné sur le mouvement lorsque les
outils médias Crabbox sont disponibles. Préférez un chemin de profil visualiseur persistant configuré
via `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, car les archives complètes de profil Chrome
peuvent dépasser la limite de taille des secrets GitHub. Pour les petits profils/d’amorçage,
le workflow peut aussi restaurer une archive `.tgz` en base64 depuis
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Si aucune source de profil n’est
configurée, le workflow publie quand même les captures d’écran déterministes de pièces jointes
référence/candidat et consigne un avis indiquant que le témoin Discord Web connecté
a été ignoré.

La première primitive complète de transport de bureau est le smoke de bureau Slack :

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Elle loue ou réutilise une machine de bureau Crabbox, synchronise le checkout courant dans
la VM, exécute `pnpm openclaw qa slack` dans cette VM, ouvre Slack Web dans le navigateur
VNC, capture le bureau visible et recopie à la fois les artifacts QA Slack et
la capture d’écran VNC dans le répertoire de sortie local. C’est la première forme Mantis
où le Gateway OpenClaw SUT et le navigateur vivent tous deux dans la même VM de bureau Linux.

Avec `--gateway-setup`, la commande prépare un home OpenClaw jetable persistant à
`$HOME/.openclaw-mantis/slack-openclaw`, patche la configuration Slack Socket Mode
pour le canal sélectionné, démarre `openclaw gateway run` sur le port
`38973`, et garde Chrome en cours d’exécution dans la session VNC. C’est le mode « laissez-moi
un bureau Linux avec Slack et une griffe en cours d’exécution » ; la voie QA Slack bot-à-bot
reste la valeur par défaut lorsque `--gateway-setup` est omis.

Entrées requises pour `--credential-source env` :

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` pour la voie modèle distante. Si seul
  `OPENAI_API_KEY` est défini localement, Mantis le mappe vers `OPENCLAW_LIVE_OPENAI_KEY`
  avant d’invoquer Crabbox afin que le transfert d’env `OPENCLAW_*` de Crabbox puisse le transmettre
  dans la VM.

Avec `--gateway-setup --credential-source convex`, Mantis loue l’identifiant Slack SUT
depuis le pool partagé avant de créer la VM et transmet l’id de canal loué, le jeton d’application
Socket Mode et le jeton de bot comme env d’exécution `OPENCLAW_MANTIS_SLACK_*`
dans le bureau. Cela garde les workflows GitHub légers : ils n’ont besoin que
du secret de broker Convex, pas de jetons bruts de bot ou d’application Slack.

Indicateurs utiles pour le bureau Slack :

- `--lease-id <cbx_...>` réexécute sur une machine où un opérateur s’est déjà connecté à Slack Web via VNC.
- `--gateway-setup` démarre un Gateway Slack OpenClaw persistant dans la VM au lieu d’exécuter uniquement la voie QA bot-à-bot.
- `--keep-lease` garde la VM Gateway ouverte pour inspection VNC après réussite ; `--no-keep-lease` l’arrête après la collecte des artifacts.
- `--slack-url <url>` ouvre une URL Slack Web spécifique. Sans cela, Mantis dérive `https://app.slack.com/client/<team>/<channel>` depuis Slack `auth.test` lorsque le jeton de bot SUT est disponible.
- `--slack-channel-id <id>` contrôle la liste d’autorisation des canaux Slack utilisée par la configuration du Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` contrôle le profil Chrome persistant dans la VM. La valeur par défaut est `$HOME/.config/openclaw-mantis/slack-chrome-profile`, donc une connexion manuelle à Slack Web survit aux réexécutions sur la même location.
- `--credential-source convex --credential-role ci` utilise le pool d’identifiants partagé au lieu de jetons env Slack directs.
- `--provider-mode`, `--model`, `--alt-model` et `--fast` sont transmis à la voie live Slack.

Le workflow de smoke GitHub est `Mantis Discord Smoke`. Le workflow GitHub avant et après
pour le premier scénario réel est `Mantis Discord Status Reactions`. Il
accepte :

- `baseline_ref` : la ref censée reproduire le comportement uniquement en file d’attente.
- `candidate_ref` : la ref censée montrer `queued -> thinking -> done`.

Il récupère la ref du harnais de workflow, construit des worktrees de référence et candidats
séparés, exécute `discord-status-reactions-tool-only` sur chaque worktree et
téléverse `baseline/`, `candidate/`, `comparison.json` et `mantis-report.md` comme
artifacts Actions. Il rend aussi le HTML de chronologie de chaque voie dans un navigateur de bureau
Crabbox et publie ces captures d’écran VNC à côté des PNG de chronologie déterministes
dans le commentaire de PR. Le même commentaire de PR intègre des aperçus GIF légers
rognés sur le mouvement générés par `crabbox media preview`, renvoie aux
clips MP4 rognés sur le mouvement correspondants et conserve les fichiers MP4 complets du bureau pour une
inspection approfondie. Les captures d’écran restent en ligne pour un examen rapide. Le workflow construit la
CLI Crabbox depuis
`openclaw/crabbox` main afin de pouvoir utiliser les indicateurs actuels de location bureau/navigateur
avant la prochaine publication du binaire Crabbox.

`Mantis Scenario` est le point d’entrée manuel générique. Il prend un `scenario_id`,
`candidate_ref`, un `baseline_ref` facultatif et un `pr_number` facultatif, puis
déclenche le workflow détenu par le scénario. Le wrapper est intentionnellement mince :
les workflows de scénario possèdent toujours leur configuration de transport, leurs identifiants, leur classe de VM,
leur oracle attendu et leur manifeste d’artifacts.

`Mantis Slack Desktop Smoke` est le premier flux de travail de VM Slack. Il extrait la ref
candidate de confiance dans un worktree séparé, loue un bureau Linux Crabbox,
exécute `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` sur cette
candidate, ouvre Slack Web dans le navigateur VNC, enregistre le bureau, génère un
aperçu réduit aux séquences avec mouvement avec `crabbox media preview`, téléverse
le répertoire complet d’artefacts et publie éventuellement le commentaire de
preuves en ligne sur la PR cible. Par défaut, il utilise AWS pour la location du
bureau et expose une entrée manuelle de fournisseur afin que les opérateurs puissent
basculer vers Hetzner lorsque la capacité AWS est lente ou indisponible. Utilisez
cette voie lorsque vous voulez « un bureau Linux avec Slack et une claw en cours
d’exécution » plutôt qu’une simple transcription Slack de bot à bot.

`Mantis Telegram Live` encapsule la voie QA live Telegram existante dans le même
pipeline de preuves de PR. Il extrait la ref candidate de confiance dans un
worktree séparé, exécute `pnpm openclaw qa telegram --credential-source convex
--credential-role ci`, écrit un manifeste `mantis-evidence.json` à partir du
résumé QA Telegram et de l’artefact de message observé, affiche le HTML de
transcription expurgé dans un navigateur de bureau Crabbox, génère un GIF réduit
aux séquences avec mouvement avec `crabbox media preview`, puis publie le
commentaire de preuves en ligne de PR lorsqu’un numéro de PR est disponible.
Cette voie fournit une preuve visuelle de transcription plutôt qu’une preuve
Telegram Web avec session connectée : l’API Telegram Bot fournit des preuves de
messages live stables, mais l’état de connexion à Telegram Web n’est pas requis
pour l’automatisation Mantis normale.

`Mantis Telegram Desktop Proof` est l’enveloppe agentique avant/après pour le
Telegram Desktop natif. Un mainteneur peut la déclencher depuis un commentaire de
PR avec `@Mantis telegram desktop proof`, depuis l’interface Actions avec des
instructions libres, ou via le répartiteur générique `Mantis Scenario`. Le flux
de travail transmet à Codex la PR, la ref de référence, la ref candidate et les
instructions du mainteneur. L’agent lit la PR, décide quel comportement visible
dans Telegram prouve le changement, exécute la voie de preuve Crabbox Telegram
Desktop avec utilisateur réel pour la référence et la candidate, itère jusqu’à ce
que les GIF natifs soient utiles, écrit des artefacts `motionPreview` appariés
dans `mantis-evidence.json`, téléverse le bundle et publie un tableau de preuves
de PR à 2 colonnes lorsqu’un numéro de PR est disponible.

Pour la configuration Telegram Desktop avec intervention humaine, utilisez le
générateur de scénario :

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Le générateur loue ou réutilise un bureau Crabbox, installe le binaire Linux natif
Telegram Desktop, restaure éventuellement une archive de session utilisateur,
configure OpenClaw avec le jeton de bot Telegram SUT loué, démarre
`openclaw gateway run` sur le port `38974`, publie un message de disponibilité du
bot pilote dans le groupe privé loué, puis capture une capture d’écran et un MP4
depuis le bureau VNC visible. Un jeton de bot ne connecte jamais Telegram Desktop ;
il ne fait que configurer OpenClaw. Le visualiseur de bureau est une session
utilisateur Telegram séparée restaurée depuis `--telegram-profile-archive-env <name>`
ou créée manuellement via VNC et maintenue active avec `--keep-lease`.

Options utiles du générateur Telegram Desktop :

- `--lease-id <cbx_...>` relance sur une VM où un opérateur s’est déjà connecté à Telegram Desktop.
- `--telegram-profile-archive-env <name>` lit une archive de profil Telegram Desktop `.tgz` encodée en base64 depuis cette variable d’environnement et la restaure avant le lancement.
- `--telegram-profile-dir <remote-path>` contrôle le répertoire distant du profil Telegram Desktop. La valeur par défaut est `$HOME/.local/share/TelegramDesktop`.
- `--no-gateway-setup` installe et ouvre Telegram Desktop sans configurer OpenClaw.
- `--credential-source convex --credential-role ci` utilise le courtier d’identifiants partagé au lieu de jetons d’environnement Telegram directs.

Chaque scénario publiant une PR écrit `mantis-evidence.json` à côté de son
rapport. Ce schéma constitue le transfert entre le code de scénario et les
commentaires GitHub :

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

Les valeurs `path` des artefacts sont relatives au répertoire du manifeste. Les
valeurs `targetPath` sont des chemins relatifs sous le répertoire de publication
de la branche `qa-artifacts`. Le publisher rejette les traversées de chemin et
ignore les entrées marquées `"required": false` lorsque les aperçus ou vidéos
optionnels sont indisponibles.

Types d’artefacts pris en charge :

- `timeline` : capture d’écran déterministe du scénario, généralement avant/après.
- `desktopScreenshot` : capture d’écran du bureau VNC/navigateur.
- `motionPreview` : GIF animé en ligne généré depuis l’enregistrement du bureau.
- `motionClip` : MP4 réduit aux séquences avec mouvement, sans amorce ni fin statiques.
- `fullVideo` : enregistrement MP4 complet pour inspection approfondie.
- `metadata` : fichier auxiliaire JSON/journal.
- `report` : rapport Markdown.

Le publisher réutilisable est `scripts/mantis/publish-pr-evidence.mjs`. Les flux
de travail l’appellent avec le manifeste, la PR cible, la racine cible
`qa-artifacts`, le marqueur de commentaire, l’URL d’artefact Actions, l’URL
d’exécution et la source de la demande. Il copie les artefacts déclarés vers la
branche `qa-artifacts`, construit un commentaire de PR avec résumé en premier,
images/aperçus en ligne et vidéos liées, puis met à jour le commentaire marqueur
existant ou en crée un.

Vous pouvez aussi déclencher directement l’exécution status-reactions depuis un
commentaire de PR :

```text
@Mantis discord status reactions
```

Le déclencheur par commentaire est volontairement étroit. Il s’exécute uniquement
sur les commentaires de pull request provenant d’utilisateurs disposant d’un
accès write, maintain ou admin, et il reconnaît uniquement les demandes de
réactions de statut Discord. Par défaut, il utilise la ref de référence connue
comme défectueuse et le SHA de tête de la PR actuelle comme candidate. Les
mainteneurs peuvent remplacer l’une ou l’autre ref :

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

La QA live Telegram peut également être déclenchée depuis un commentaire de PR :

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

Par défaut, elle utilise le SHA de tête de la PR actuelle comme candidate et
exécute `telegram-status-command`. Les mainteneurs peuvent remplacer
`candidate=...`, `provider=aws|hetzner` et `lease=<cbx_...>` lorsqu’ils ont
besoin d’une ref spécifique ou d’un bureau Crabbox préchauffé.

Exemples de commandes ClawSweeper :

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

La première commande est explicite et centrée sur le scénario. La seconde pourra
plus tard associer une PR ou une issue aux scénarios Mantis recommandés à partir
des libellés, des fichiers modifiés et des constats de revue ClawSweeper.

## Cycle de vie de l’exécution

1. Acquérir les identifiants.
2. Allouer ou réutiliser une VM.
3. Préparer le profil de bureau/navigateur lorsque le scénario nécessite une preuve d’interface.
4. Préparer un checkout propre pour la ref de référence.
5. Installer les dépendances et construire uniquement ce dont le scénario a besoin.
6. Démarrer un Gateway OpenClaw enfant avec un répertoire d’état isolé.
7. Configurer le transport live, le fournisseur, le modèle et le profil de navigateur.
8. Exécuter le scénario et capturer les preuves de référence.
9. Arrêter le gateway et préserver les journaux.
10. Préparer la ref candidate dans la même VM.
11. Exécuter le même scénario et capturer les preuves de la candidate.
12. Comparer les résultats de l’oracle et les preuves visuelles.
13. Écrire les artefacts Markdown, JSON, journaux, captures d’écran et traces optionnelles.
14. Téléverser les artefacts GitHub Actions.
15. Publier un message concis de statut dans la PR ou Discord.

Le scénario doit pouvoir échouer de deux façons différentes :

- **Bug reproduit** : la référence a échoué de la manière attendue.
- **Échec du harnais** : la configuration de l’environnement, les identifiants, l’API Discord, le navigateur ou
  le fournisseur ont échoué avant que l’oracle de bug soit significatif.

Le rapport final doit séparer ces cas afin que les mainteneurs ne confondent pas
un environnement instable avec le comportement du produit.

## MVP Discord

Le premier scénario doit cibler les réactions de statut Discord dans les salons
de guilde où le mode de livraison de réponse source est `message_tool_only`.

Pourquoi c’est une bonne graine Mantis :

- C’est visible dans Discord sous forme de réactions sur le message déclencheur.
- Il dispose d’un oracle REST robuste via l’état des réactions aux messages Discord.
- Il exerce un vrai Gateway OpenClaw, l’authentification du bot Discord, la distribution de messages,
  le mode de livraison de réponse source, l’état des réactions de statut et le cycle de vie du tour de modèle.
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

Les preuves de référence doivent montrer la réaction d’accusé de réception en
file d’attente, mais aucune transition de cycle de vie en mode tool-only. Les
preuves de la candidate doivent montrer les réactions de statut de cycle de vie
qui s’exécutent lorsque `messages.statusReactions.enabled` vaut explicitement
true.

La première tranche exécutable est le scénario QA live Discord à activation
explicite :

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Il configure le SUT avec une gestion des guildes toujours active,
`visibleReplies: "message_tool"`, `ackReaction: "👀"` et des réactions de statut
explicites. L’oracle interroge le vrai message déclencheur Discord et attend la
séquence observée `👀 -> 🤔 -> 👍`. Les artefacts comprennent
`discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` et
`discord-status-reactions-tool-only-timeline.png`.

## Éléments QA existants

Mantis doit s’appuyer sur la pile QA privée existante plutôt que repartir de
zéro :

- `pnpm openclaw qa discord` exécute déjà une voie Discord live avec des bots pilote et SUT.
- Le runner de transport live écrit déjà des rapports et artefacts de messages observés sous `.artifacts/qa-e2e/`.
- Les locations d’identifiants Convex fournissent déjà un accès exclusif aux identifiants de transport live partagés.
- Le service de contrôle du navigateur prend déjà en charge les captures d’écran, snapshots,
  profils gérés headless et profils CDP distants.
- QA Lab dispose déjà d’une interface de débogage et d’un bus pour les tests en forme de transport.

La première implémentation Mantis peut être un runner avant/après léger par-dessus
ces éléments, plus une couche de preuves visuelles.

## Modèle de preuves

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

- les refs et SHA testés
- le transport et l’id du scénario
- le fournisseur de machine et l’id de machine ou de location
- la source des identifiants sans valeurs secrètes
- le résultat de référence
- le résultat de la candidate
- si le bug a été reproduit sur la référence
- si la candidate l’a corrigé
- les chemins des artefacts
- les problèmes de configuration ou de nettoyage assainis

Les captures d’écran sont des preuves, pas des secrets. Elles nécessitent tout de même une discipline de rédaction :
des noms de canaux privés, des noms d’utilisateurs ou le contenu de messages peuvent apparaître. Pour les PR publiques,
préférez les liens d’artefacts GitHub Actions aux images intégrées tant que la stratégie de rédaction
n’est pas plus solide.

## Navigateur et VNC

La voie navigateur comporte deux modes :

- **Automatisation headless** : par défaut pour la CI. Chrome s’exécute avec CDP activé, et
  Playwright ou le contrôle navigateur OpenClaw capture les captures d’écran.
- **Sauvetage VNC** : activé sur la même VM lorsque la connexion, la MFA, l’anti-automatisation Discord
  ou le débogage visuel nécessite un humain.

Le profil de navigateur de l’observateur Discord doit être suffisamment persistant pour éviter
de se connecter à chaque exécution, mais isolé de l’état du navigateur personnel. Un profil
appartient au pool de machines Mantis, pas à l’ordinateur portable d’un développeur.

Lorsque Mantis se bloque, il publie un message de statut Discord avec :

- l’identifiant d’exécution
- l’identifiant du scénario
- le fournisseur de machine
- le répertoire des artefacts
- les instructions de connexion VNC ou noVNC si disponibles
- un court texte décrivant le blocage

Le premier déploiement privé peut publier ces messages dans le canal opérateur existant
et migrer plus tard vers un canal Mantis dédié.

## Machines

Mantis doit privilégier AWS via Crabbox pour la première implémentation distante.
Crabbox nous fournit des machines prêtes à l’emploi, le suivi des baux, l’hydratation, les journaux, les résultats et
le nettoyage. Si la capacité AWS est trop lente ou indisponible, ajoutez un fournisseur Hetzner
derrière la même interface de machine.

Exigences minimales de la VM :

- Linux avec une installation Chrome ou Chromium compatible avec un bureau
- accès CDP pour l’automatisation du navigateur
- VNC ou noVNC pour le sauvetage
- Node 22 et pnpm
- checkout OpenClaw et cache des dépendances
- cache du navigateur Chromium Playwright lorsque Playwright est utilisé
- suffisamment de CPU et de mémoire pour un OpenClaw Gateway, un navigateur et une exécution de modèle
- accès sortant vers Discord, GitHub, les fournisseurs de modèles et le courtier d’identifiants

La VM ne doit pas conserver de secrets bruts à longue durée de vie en dehors des magasins d’identifiants ou
de profils navigateur attendus.

## Secrets

Les secrets résident dans les secrets de l’organisation ou du dépôt GitHub pour les exécutions distantes, et dans
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

À long terme, le pool d’identifiants Convex doit rester la source normale des identifiants
de transport en direct. Les secrets GitHub initialisent le courtier et les voies de secours.
Le workflow de réactions de statut Discord associe les secrets Mantis Crabbox aux variables
d’environnement `CRABBOX_COORDINATOR` et `CRABBOX_COORDINATOR_TOKEN`
attendues par la CLI Crabbox. Les noms simples de secrets GitHub `CRABBOX_*` restent
acceptés comme solution de compatibilité.

Le runner Mantis ne doit jamais afficher :

- les jetons de bots Discord
- les clés d’API des fournisseurs
- les cookies de navigateur
- le contenu des profils d’authentification
- les mots de passe VNC
- les charges utiles d’identifiants brutes

Les téléversements publics d’artefacts doivent aussi expurger les métadonnées de cible Discord telles que les identifiants de bot,
de guilde, de canal et de message. Le workflow de smoke GitHub active
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` pour cette raison.

Si un jeton est accidentellement collé dans une issue, une PR, une discussion ou un journal, faites-le tourner
après avoir stocké le nouveau secret.

## Artefacts GitHub et commentaires de PR

Les workflows Mantis doivent téléverser le paquet complet de preuves comme artefact Actions
à courte durée de vie. Lorsque le workflow est exécuté pour un rapport de bug ou une PR de correctif, il doit aussi
publier les captures d’écran PNG expurgées sur la branche `qa-artifacts` et mettre à jour ou créer un
commentaire sur ce bug ou cette PR de correctif avec des captures avant/après intégrées. Ne publiez pas
la preuve principale uniquement sur une PR générique d’automatisation QA. Les journaux bruts, messages observés
et autres preuves volumineuses restent dans l’artefact Actions.

Les workflows de production doivent publier ces commentaires avec l’application GitHub Mantis, pas
avec `github-actions[bot]`. Stockez l’identifiant de l’application et la clé privée comme secrets
GitHub Actions `MANTIS_GITHUB_APP_ID` et `MANTIS_GITHUB_APP_PRIVATE_KEY`.
Le workflow utilise un marqueur masqué comme clé d’upsert, met à jour ce
commentaire lorsque le jeton peut le modifier, et crée un nouveau commentaire appartenant à Mantis lorsqu’un
ancien marqueur appartenant à un bot ne peut pas être modifié.

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

Lorsque l’exécution échoue parce que le harnais a échoué, le commentaire doit l’indiquer
au lieu de laisser entendre que le candidat a échoué.

## Notes de déploiement privé

Un déploiement privé peut déjà avoir une application Discord Mantis. Réutilisez cette
application au lieu de créer une autre application lorsqu’elle dispose des bonnes permissions de bot
et peut faire l’objet d’une rotation en toute sécurité.

Définissez le canal initial de notification opérateur via les secrets ou la configuration de déploiement.
Il peut d’abord pointer vers un canal mainteneur ou opérations existant,
puis migrer vers un canal Mantis dédié une fois qu’il existe.

Ne placez pas d’identifiants de guilde, d’identifiants de canal, de jetons de bot, de cookies de navigateur ou de mots de passe VNC
dans ce document. Stockez-les dans les secrets GitHub, le courtier d’identifiants ou le
magasin local de secrets de l’opérateur.

## Ajouter un scénario

Un scénario Mantis doit déclarer :

- l’identifiant et le titre
- le transport
- les identifiants requis
- la politique de référence de baseline
- la politique de référence de candidat
- le correctif de configuration OpenClaw
- les étapes de configuration
- le stimulus
- l’oracle de baseline attendu
- l’oracle de candidat attendu
- les cibles de capture visuelle
- le budget de délai d’expiration
- les étapes de nettoyage

Les scénarios doivent privilégier de petits oracles typés :

- l’état de réaction Discord pour les bugs de réactions
- les références de messages Discord pour les bugs de fils
- le ts de fil Slack et l’état de l’API de réaction pour les bugs Slack
- les identifiants et en-têtes de messages e-mail pour les bugs d’e-mail
- les captures d’écran navigateur lorsque l’interface utilisateur est le seul observable fiable

Les contrôles de vision doivent être additifs. Si une API de plateforme peut prouver le bug, utilisez
l’API comme oracle de réussite/échec et conservez les captures d’écran pour la confiance humaine.

## Extension des fournisseurs

Après Discord, le même runner peut ajouter :

- Slack : réactions, fils, mentions d’application, modales, téléversements de fichiers.
- E-mail : authentification Gmail et fil de messages avec `gog` lorsque les connecteurs ne sont pas
  suffisants.
- WhatsApp : connexion par QR, ré-identification, livraison des messages, médias, réactions.
- Telegram : contrôle des mentions de groupe, commandes, réactions lorsque disponibles.
- Matrix : salons chiffrés, relations de fil ou de réponse, reprise après redémarrage.

Chaque transport doit avoir un scénario de smoke peu coûteux et un ou plusieurs scénarios
par classe de bugs. Les scénarios visuels coûteux doivent rester optionnels.

## Questions ouvertes

- Quel bot Discord doit être le driver, et lequel doit être le SUT, lorsque le
  bot Mantis existant est réutilisé ?
- La connexion du navigateur observateur doit-elle utiliser un compte Discord humain, un compte de test,
  ou uniquement des preuves REST lisibles par bot pour la première phase ?
- Combien de temps GitHub doit-il conserver les artefacts Mantis pour les PR ?
- Quand ClawSweeper doit-il recommander automatiquement Mantis au lieu d’attendre une
  commande de mainteneur ?
- Les captures d’écran doivent-elles être expurgées ou recadrées avant le téléversement pour les PR publiques ?
