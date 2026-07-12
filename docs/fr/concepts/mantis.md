---
read_when:
    - Création ou exécution d’un contrôle qualité visuel en conditions réelles pour les bugs d’OpenClaw
    - Ajout d’une vérification avant et après pour une demande de tirage
    - Ajout de scénarios de transport en direct pour Discord, Slack, WhatsApp ou d’autres plateformes
    - Exécution d’une validation ciblée dans le navigateur de l’interface de contrôle pour une référence candidate
    - Débogage des exécutions d’assurance qualité nécessitant des captures d’écran, l’automatisation du navigateur ou un accès VNC
summary: Mantis capture des preuves visuelles de bout en bout pour les comparaisons de transports en conditions réelles et les validations ciblées dans le navigateur portant uniquement sur les versions candidates, puis joint les artefacts aux PR.
title: Mantis
x-i18n:
    generated_at: "2026-07-12T02:29:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86b65ae8503b23407b600aa08f16940f9fcaa9a4e598963f7f878a3b336784f0
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis publie des preuves visuelles de CI et un commentaire de PR concernant le comportement d’OpenClaw.
Les scénarios de transport en direct comparent une référence de base connue comme défaillante à une référence candidate ;
les parcours ciblés dans le navigateur peuvent plutôt valider un seul candidat avec un
transport simulé déterministe. Discord a été livré en premier, avec une authentification par bot réelle, des salons de serveur,
des réactions, des fils de discussion et un témoin dans le navigateur. Des parcours Slack, Telegram et des parcours ciblés de discussion dans
l’interface de contrôle existent également ; WhatsApp et Matrix ne sont pas implémentés.

## Responsabilités

- OpenClaw (`extensions/qa-lab/src/mantis/*`) : environnement d’exécution des scénarios, CLI `pnpm openclaw qa mantis <command>`, schéma des preuves.
- QA Lab (`extensions/qa-lab/src/live-transports/*`) : banc d’essai des transports en direct, bots pilote/SUT, générateurs de rapports et de preuves.
- Crabbox (`openclaw/crabbox`) : machines Linux préchauffées, baux, VNC, `crabbox media preview`.
- GitHub Actions (`.github/workflows/mantis-*.yml`) : points d’entrée distants, conservation des artefacts.
- ClawSweeper : analyse les commandes de maintenance dans les PR, déclenche les workflows et publie le commentaire final sur la PR.

## Commandes CLI

Toutes les commandes suivent la forme `pnpm openclaw qa mantis <command>` et sont définies dans
`extensions/qa-lab/src/mantis/cli.ts`. Elles nécessitent `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
lors de la compilation et de l’exécution (les workflows intégrés définissent `OPENCLAW_BUILD_PRIVATE_QA=1` et
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` avant la compilation).

| Commande                        | Objectif                                                                                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | Vérifier que le bot Discord de Mantis peut voir le serveur et le salon, publier un message et ajouter une réaction.                                       |
| `run`                           | Exécuter un scénario avant/après sur les références de base et candidate (Discord uniquement).                                                            |
| `desktop-browser-smoke`         | Louer ou réutiliser un poste de travail Crabbox, ouvrir un navigateur visible et capturer une capture d’écran ainsi qu’une vidéo.                          |
| `slack-desktop-smoke`           | Louer ou réutiliser un poste de travail Crabbox, y exécuter l’assurance qualité Slack, ouvrir Slack Web et capturer les preuves.                           |
| `telegram-desktop-builder`      | Louer ou réutiliser un poste de travail Crabbox, installer Telegram Desktop et, facultativement, configurer un Gateway OpenClaw.                           |
| `visual-task` / `visual-driver` | Capture générique d’un poste de travail Crabbox avec des assertions facultatives de compréhension d’image ; `visual-driver` est la partie pilote lancée sous `crabbox record --while`. |

Chaque commande accepte `--repo-root <path>` et `--output-dir <path>` ; les commandes Crabbox
acceptent également `--crabbox-bin`, `--provider`, `--machine-class`/`--class`,
`--lease-id`, `--idle-timeout`, `--ttl` et `--keep-lease`. Les valeurs locales par défaut de la CLI
pour le fournisseur et la classe sont `hetzner`/`beast`, sauf indication contraire ; les workflows de CI
remplacent généralement ces deux valeurs.

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Appelle l’API REST de Discord (`https://discord.com/api/v10`) pour récupérer l’utilisateur
du bot, le serveur, les salons du serveur et le salon cible, vérifie que le
salon appartient au serveur, puis, sauf avec `--skip-post`, publie un message et
ajoute une réaction `👀`. Génère `mantis-discord-smoke-summary.json` et
`mantis-discord-smoke-report.md`.

Ordre de résolution du jeton : valeur de `--token-file`, puis `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(remplaçable avec `--token-env`), puis fichier nommé par `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
(remplaçable avec `--token-file-env`). Les identifiants du serveur et du salon proviennent de
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID` (remplaçables avec
`--guild-id` / `--channel-id`) et doivent être des snowflakes Discord de 17 à 20 chiffres. Définissez
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` pour remplacer les identifiants
et les noms du bot, du serveur, du salon et du message par `<redacted>` dans le résumé et le rapport publiés.

### `run`

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

`--transport` n’accepte actuellement que `discord`. `--scenario` correspond à l’un des deux
identifiants intégrés, chacun ayant sa propre référence de base par défaut et ses propres
libellés avant/après attendus (`extensions/qa-lab/src/mantis/run.runtime.ts`) :

| Scénario                                   | Référence de base par défaut                | Résultat attendu pour la référence de base | Résultat attendu pour le candidat |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | la réponse dans le fil omet la pièce jointe `filePath` | la réponse dans le fil l’inclut |

`--candidate` utilise `HEAD` par défaut. Autres options : `--credential-source`
(valeur par défaut : `convex`), `--credential-role` (valeur par défaut : `ci`), `--provider-mode`
(valeur par défaut : `live-frontier`), `--fast` (activée par défaut), `--skip-install`, `--skip-build`.

L’exécuteur crée des extractions `git worktree` détachées pour la référence de base et
le candidat sous `<output-dir>/worktrees/`, exécute `pnpm install`/`pnpm build` dans
chacune d’elles, sauf si ces étapes sont ignorées, puis exécute
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
sur chaque worktree. Chaque parcours génère `discord-qa-reaction-timelines.json`
ainsi qu’une paire `<scenario-id>-timeline.html`/`.png` ; l’exécuteur recopie ces
preuves sous `baseline/`/`candidate/`, génère `comparison.json`,
`mantis-report.md` et `mantis-evidence.json` dans le répertoire de sortie, puis
se termine avec un code différent de zéro si la comparaison n’a pas réussi (référence de base en `fail` et candidat en
`pass`).

Le second scénario Discord (`discord-thread-reply-filepath-attachment`) publie
un message parent avec le bot pilote, crée un véritable fil de discussion, appelle l’action
`message.thread-reply` du SUT avec un `filePath` local au dépôt, puis interroge
le fil jusqu’à obtenir la réponse et le nom du fichier joint. Il attend une pièce jointe
nommée `mantis-thread-report.md`.

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Loue ou réutilise un poste de travail Crabbox, lance un navigateur dans la session VNC
en l’orientant vers `--browser-url` (valeur par défaut : `https://openclaw.ai`) ou vers un
`--html-file` rendu, attend, effectue une capture d’écran avec `scrot`, enregistre facultativement une vidéo MP4 avec
`ffmpeg`, puis resynchronise `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
vers `--output-dir`.

Options :

- `--lease-id <cbx_...>` réutilise un poste de travail préchauffé au lieu d’en créer un.
- `--browser-profile-dir <remote-path>` réutilise un répertoire distant de données utilisateur Chrome afin qu’un poste de travail persistant reste connecté entre les exécutions (utilisé pour un profil durable de visualisation dans Discord Web).
- `--browser-profile-archive-env <name>` restaure avant le lancement une archive de profil Chrome `.tgz` encodée en base64 depuis cette variable d’environnement (valeur par défaut : `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`) ; utilisé pour les témoins connectés tels que Discord Web.
- `--video-duration <seconds>` contrôle la durée de la capture MP4 (10 s par défaut).
- `--keep-lease` (ou `OPENCLAW_MANTIS_KEEP_VM=1`) maintient ouvert, à des fins d’inspection VNC, le bail créé par cette exécution ; les exécutions ayant échoué après avoir créé un bail le conservent également par défaut.

Pour les preuves Discord Web, Mantis utilise un compte de visualisation dédié, et non un jeton
de bot. L’oracle REST Discord, via `qa discord`, reste la référence faisant autorité ; lorsque
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` est défini, le scénario génère également un
artefact d’URL Discord Web, et `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` laisse le
fil ouvert assez longtemps pour que le navigateur puisse l’ouvrir.

Le workflow GitHub privilégie un profil de visualisation persistant via
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` (les archives de profil complètes peuvent dépasser
la limite de taille des secrets GitHub) ; pour les profils de petite taille ou d’amorçage, il peut restaurer à la place une
archive `.tgz` encodée en base64 depuis `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Si
aucune des deux sources n’est configurée, le workflow publie tout de même les captures d’écran déterministes
de la référence de base et du candidat, et consigne que le témoin connecté a été
ignoré.

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Loue ou réutilise un poste de travail Crabbox, synchronise l’extraction dans la machine virtuelle, exécute
`pnpm openclaw qa slack` dans celle-ci, ouvre Slack Web dans le navigateur VNC,
capture le bureau et recopie localement les artefacts d’assurance qualité Slack (`slack-qa/`) ainsi que
la capture d’écran et la vidéo VNC. Il s’agit de la seule configuration Mantis dans laquelle le
Gateway du SUT et le navigateur s’exécutent tous deux dans la même machine virtuelle.

Avec `--gateway-setup`, la commande crée un répertoire personnel OpenClaw jetable et persistant
à l’emplacement `$HOME/.openclaw-mantis/slack-openclaw` dans la machine virtuelle, adapte la
configuration Slack Socket Mode pour le salon cible, démarre
`openclaw gateway run --dev --allow-unconfigured --port 38973` et laisse
Chrome s’exécuter dans la session VNC ; sans `--gateway-setup`, elle exécute à la place le parcours
normal d’assurance qualité Slack entre bots.

Variables d’environnement requises pour `--credential-source env` (la valeur locale par défaut est `env` ; le rôle
par défaut est `maintainer`) :

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` pour le parcours distant du modèle (si seule `OPENAI_API_KEY`
  est définie localement, Mantis la copie dans `OPENCLAW_LIVE_OPENAI_KEY` avant
  d’appeler Crabbox)

Avec `--credential-source convex`, Mantis loue les informations d’identification Slack du SUT dans
le pool partagé avant de créer la machine virtuelle, puis transmet l’identifiant du salon, le jeton d’application et
le jeton de bot à la machine virtuelle sous forme de variables d’environnement `OPENCLAW_MANTIS_SLACK_*`, afin que les workflows
GitHub n’aient besoin que du secret du courtier Convex, et non des jetons Slack bruts.

Autres options : `--slack-url <url>` ouvre une URL spécifique (sinon Mantis déduit
`https://app.slack.com/client/<team>/<channel>` à partir de `auth.test`) ;
`--slack-channel-id <id>` définit le salon autorisé par le Gateway ;
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` contrôle le profil Chrome persistant
dans la machine virtuelle (valeur par défaut : `$HOME/.config/openclaw-mantis/slack-chrome-profile`) ;
`--approval-checkpoints` exécute les scénarios d’approbation Slack natifs
(`slack-approval-exec-native`, `slack-approval-plugin-native`) et produit
des captures d’écran des points de contrôle en attente et résolus au lieu de configurer le Gateway (option mutuellement
exclusive avec `--gateway-setup`) ; `--hydrate-mode source|prehydrated`,
`--provider-mode`, `--model`, `--alt-model` et `--fast` sont transmis au
parcours Slack en direct.

Les captures d’écran des points de contrôle d’approbation sont produites à partir du message de l’API Slack
observé par le scénario, et non depuis l’interface Slack en direct ; `slack-desktop-smoke.png` constitue uniquement
une preuve de Slack Web lui-même lorsque le profil du navigateur associé au bail était déjà connecté.

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Loue ou réutilise un bureau Crabbox, installe l’application native Telegram Desktop pour Linux,
restaure éventuellement une archive de session utilisateur, configure OpenClaw avec le
jeton du bot SUT Telegram loué, démarre
`openclaw gateway run --dev --allow-unconfigured --port 38974`, publie un
message indiquant que le bot pilote est prêt dans le groupe privé loué, puis capture une
image et une vidéo MP4. Un jeton de bot sert uniquement à configurer OpenClaw ; il ne
connecte jamais Telegram Desktop. La visionneuse de bureau utilise une session utilisateur Telegram distincte,
restaurée depuis `--telegram-profile-archive-env <name>` ou ouverte manuellement
via VNC et maintenue active avec `--keep-lease`.

Options : `--lease-id <cbx_...>` relance l’exécution sur une VM déjà connectée à
Telegram Desktop ; `--telegram-profile-archive-env <name>` restaure une archive de profil
`.tgz` encodée en base64 avant le lancement ; `--telegram-profile-dir <remote-path>`
définit le répertoire de profil distant (par défaut `$HOME/.local/share/TelegramDesktop`) ;
`--no-gateway-setup` installe et ouvre uniquement Telegram Desktop ;
`--credential-source`/`--credential-role` utilisent par défaut `convex`/`maintainer`.

## Manifeste de preuves

Chaque scénario publié dans une PR écrit `mantis-evidence.json` à côté de
son rapport :

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

Le `path` de l’artefact est relatif au répertoire du manifeste ; `targetPath` est
relatif au préfixe d’artefacts R2/S3 configuré. `scripts/mantis/publish-pr-evidence.mjs`
rejette la traversée de répertoires et ignore les entrées comportant `"required": false` lorsque le
fichier est absent.

Types d’artefacts : `timeline` (capture d’écran déterministe avant/après),
`desktopScreenshot` (capture d’écran VNC/navigateur), `motionPreview` (GIF animé intégré
issu de l’enregistrement), `motionClip` (MP4 réduit aux séquences animées), `fullVideo` (enregistrement
complet), `metadata` (fichier annexe JSON/journal), `report` (rapport Markdown).

Organisation des artefacts d’une exécution sur le disque :

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

Les captures d’écran sont des preuves, pas des secrets, mais exigent tout de même une politique de caviardage :
des noms de canaux privés, des noms d’utilisateur ou le contenu de messages peuvent apparaître. Définissez
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` pour les téléversements publics d’artefacts ; cette option est
activée par défaut dans les workflows GitHub Discord/Slack/Telegram.

## Automatisation GitHub

`scripts/mantis/publish-pr-evidence.mjs` est l’outil de publication réutilisable. Les workflows
l’appellent avec le manifeste, la PR cible, la racine cible des artefacts, le marqueur de commentaire,
l’URL des artefacts, l’URL de l’exécution et la source de la requête. Il téléverse les artefacts déclarés dans
le compartiment R2 Mantis, génère un commentaire de PR commençant par un résumé avec des
images/aperçus intégrés et des liens vers les vidéos, puis met à jour le commentaire portant le marqueur existant ou
en crée un nouveau. Variables d’environnement requises :

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET` (les workflows définissent `openclaw-crabbox-artifacts`)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION` (les workflows définissent `auto`)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL` (les workflows définissent `https://artifacts.openclaw.ai`)

Les commentaires sont publiés via l’application GitHub Mantis (`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`), et non par `github-actions[bot]`, en utilisant un commentaire
marqueur masqué comme clé d’insertion ou de mise à jour.

| Workflow                          | Déclencheur                                                                                | Fonction                                                                                                                                                                                                                                                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | déclenchement manuel                                                                       | Exécute `discord-smoke` sur une référence choisie.                                                                                                                                                                                                                                                               |
| `Mantis Discord Status Reactions` | commentaire de PR ou déclenchement manuel                                                  | Crée des arbres de travail distincts pour la référence et le candidat, exécute `discord-status-reactions-tool-only` sur chacun, affiche la chronologie de chaque voie dans un navigateur de bureau Crabbox, génère des aperçus GIF/MP4 réduits aux séquences animées avec `crabbox media preview`, téléverse les artefacts et publie les preuves intégrées dans la PR. |
| `Mantis Scenario`                 | déclenchement manuel                                                                       | Répartiteur générique : accepte `scenario_id` (`discord-status-reactions-tool-only`, `discord-thread-reply-filepath-attachment`, `slack-desktop-smoke`, `telegram-live`, `telegram-desktop-proof`, `web-ui-chat-proof`), `baseline_ref`, `candidate_ref`, `pr_number`, puis transmet au workflow de scénario correspondant. |
| `Mantis Slack Desktop Smoke`      | déclenchement manuel                                                                       | Loue un bureau Linux Crabbox (`aws` par défaut, avec possibilité de choisir `hetzner`), exécute `slack-desktop-smoke --gateway-setup` sur le candidat, enregistre le bureau, génère un aperçu animé, téléverse les artefacts et publie les preuves dans la PR lorsqu’un numéro de PR est fourni.                 |
| `Mantis Telegram Live`            | commentaire de PR ou déclenchement manuel                                                  | Exécute la voie d’AQ Telegram en direct via l’API de bot (`openclaw qa telegram`), écrit `mantis-evidence.json` à partir du résumé d’AQ, affiche le HTML de preuve caviardé dans un navigateur de bureau Crabbox, génère un GIF animé et publie les preuves dans la PR. La connexion à Telegram Web n’est pas requise pour cette voie. |
| `Mantis Telegram Desktop Proof`   | étiquette de PR de mainteneur (`mantis: telegram-visible-proof`) avec commentaire de PR, ou déclenchement manuel | Preuve agentique avant/après dans l’application native Telegram Desktop. Transmet la PR, les références de base/candidate et les instructions du mainteneur à Codex, qui exécute la voie de preuve Crabbox Telegram Desktop avec un utilisateur réel pour les deux références et publie un tableau de preuves de PR à deux colonnes. |
| `Mantis Web UI Chat Proof`        | commentaire de PR ou déclenchement manuel                                                  | Exécute la preuve Playwright ciblée du chat de l’interface de contrôle OpenClaw sur le candidat, vérifie que le navigateur envoie les données via le Gateway simulé, capture les artefacts de capture d’écran/vidéo et publie les preuves dans la PR. Cette voie prouve uniquement le chat web, pas WinUI/une application native ni une preuve visuelle quelconque. |

`Mantis Discord Status Reactions` et `Mantis Telegram Live` acceptent tous deux
`baseline_ref`/`candidate_ref` (ou `baseline=`/`candidate=` dans un commentaire de PR)
et vérifient que le SHA résolu est soit un ancêtre de `origin/main`, soit une
étiquette de version (`v*`), soit la tête d’une PR ouverte avant toute exécution avec
des identifiants contenant des secrets.

Déclencheurs par commentaire, depuis une PR avec un accès en écriture, de maintenance ou d’administration :

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Les déclencheurs Telegram par commentaire utilisent par défaut le SHA de tête de la PR comme candidat et
`telegram-status-command` comme scénario ; ils acceptent `provider=aws|hetzner` et
`lease=<cbx_...>` pour cibler un fournisseur Crabbox précis ou un
bureau préchauffé. `Mantis Telegram Desktop Proof` ne répond à un commentaire de PR que lorsque
la PR porte déjà l’étiquette `mantis: telegram-visible-proof`.

Les déclencheurs du chat de l’interface web par commentaire utilisent par défaut le SHA de tête de la PR comme candidat. Ils exécutent
la preuve de chat de l’interface de contrôle avec un Gateway simulé et publient les artefacts du navigateur ; utilisez
une preuve Playwright/navigateur normale, des captures d’écran du mainteneur, Crabbox ou des artefacts
locaux pour les autres pages web et les surfaces d’applications natives.

ClawSweeper peut également lancer directement un scénario :

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## Machines et secrets

Les valeurs par défaut de la CLI Crabbox locale sont `--provider hetzner --class beast` ; remplacez-les
avec `--provider`, `--class`/`--machine-class`, ou
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS`. Les workflows GitHub
remplacent fréquemment les deux (par exemple `--class standard`, ainsi que l’entrée de sélection
du fournisseur `aws`/`hetzner` du workflow Slack). Si un fournisseur est trop
lent ou indisponible, ajoutez-le derrière la même interface Crabbox au lieu de
coder en dur une solution de repli.

Configuration de base de la VM : Linux avec Chrome/Chromium compatible avec un environnement de bureau, accès CDP, VNC/
noVNC, Node 22+ et pnpm, une extraction d’OpenClaw et un accès sortant au
transport cible, à GitHub, aux fournisseurs de modèles et au courtier d’identifiants.

Noms de secrets utilisés dans les workflows Mantis :

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` pour les téléversements publics d’artefacts
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN` (les workflows acceptent également
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` comme solution de repli et les associent
  aux noms simples avant d’appeler Crabbox)
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

L’exécuteur Mantis ne doit jamais afficher les jetons de bot Discord/Slack/Telegram,
les clés d’API des fournisseurs, les cookies du navigateur, le contenu des profils d’authentification, les mots de passe VNC ni
les charges utiles brutes d’identifiants. Si un jeton est divulgué dans un ticket, une PR, une conversation ou un journal,
renouvelez-le après avoir stocké le secret de remplacement.

## Résultats des exécutions

Les scénarios de transport avant/après distinguent ces résultats afin qu’un environnement
instable ne soit pas interprété comme une régression du produit :

- **Bug reproduit** : la référence a échoué de la manière attendue par le scénario.
- **Échec du banc de test** : la configuration de l’environnement, les identifiants, l’API de transport, le navigateur
  ou le fournisseur ont échoué avant que l’oracle soit pertinent.

La preuve par navigateur portant uniquement sur le candidat indique si celui-ci a satisfait les assertions relatives au
Gateway simulé et à l’interface visible ; elle ne prétend pas avoir reproduit le comportement de référence.

## Ajout d’un scénario

Les scénarios de transport en direct sont définis en TypeScript pour chaque transport (consultez
`MANTIS_SCENARIO_CONFIGS` dans `extensions/qa-lab/src/mantis/run.runtime.ts` pour
la structure avant/après de Discord), et non dans un format de fichier déclaratif autonome.
Chaque scénario nécessite : un identifiant et un titre, un transport, les identifiants requis, une politique de
référence de base, une politique de référence candidate, un correctif de configuration OpenClaw, des étapes de configuration/stimulation,
l’oracle attendu pour la référence et le candidat, les cibles de capture visuelle, un budget de
délai d’expiration et des étapes de nettoyage.

La validation ciblée dans un navigateur, limitée au candidat, peut utiliser un test E2E déterministe dédié et un workflow. Délimitez explicitement sa portée, validez la référence du candidat avant l’exécution, isolez la publication nécessitant des secrets et produisez un manifeste respectant le même contrat de preuves.

Privilégiez de petits oracles typés plutôt que des contrôles visuels : état des réactions Discord ou références de messages, `ts` des fils Slack/état des réactions via l’API, identifiants et en-têtes des e-mails. Utilisez des captures d’écran du navigateur lorsque l’interface utilisateur est le seul élément observable fiable, et ajoutez les contrôles visuels à un oracle reposant sur l’API de la plateforme lorsqu’il en existe un.

Après Discord, Slack et Telegram, la même structure d’exécuteur peut être étendue à WhatsApp (connexion par code QR, réidentification, remise, médias, réactions) et à Matrix (salons chiffrés, relations entre fils et réponses, reprise après redémarrage) ; aucune de ces extensions n’est encore implémentée.

## Questions ouvertes

- Quel bot Discord doit servir de pilote et lequel de système testé lorsque le bot Mantis existant est réutilisé ?
- Pendant combien de temps GitHub doit-il conserver les artefacts Mantis des PR ?
- Quand ClawSweeper doit-il recommander automatiquement un scénario Mantis au lieu d’attendre une commande d’un mainteneur ?
- Les captures d’écran doivent-elles être expurgées ou recadrées avant leur téléversement pour les PR publiques ?
