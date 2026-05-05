---
read_when:
    - Créer ou exécuter un contrôle qualité visuel en direct pour les bogues d’OpenClaw
    - Ajout d’une vérification avant et après pour une demande de tirage
    - Ajout de scénarios de transport en direct Discord, Slack, WhatsApp ou autres
    - Débogage des exécutions d’assurance qualité nécessitant des captures d’écran, une automatisation du navigateur ou un accès VNC
summary: Mantis est le système de vérification visuelle de bout en bout permettant de reproduire les bugs OpenClaw sur des transports réels, de capturer des preuves avant et après, et de joindre des artefacts aux PR.
title: Mante
x-i18n:
    generated_at: "2026-05-05T07:05:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00f2be92845fb13e410af7188f348010140914514d739b930f97b43abaa66a0c
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis est le système de vérification de bout en bout d’OpenClaw pour les bugs qui nécessitent un véritable environnement d’exécution, un véritable transport et une preuve visible. Il exécute un scénario sur une ref connue comme défectueuse, capture les preuves, exécute le même scénario sur une ref candidate, puis publie la comparaison sous forme d’artéfacts qu’un mainteneur peut inspecter depuis une PR ou depuis une commande locale.

Mantis commence par Discord parce que Discord nous donne une première voie à forte valeur : authentification réelle du bot, vrais canaux de guilde, réactions, fils, commandes natives, et une interface de navigateur où les humains peuvent confirmer visuellement ce que le transport a affiché.

## Objectifs

- Reproduire un bug issu d’une issue ou d’une PR GitHub avec la même forme de transport que celle que voient les utilisateurs.
- Capturer un artéfact **avant** sur la ref de référence avant d’appliquer le correctif.
- Capturer un artéfact **après** sur la ref candidate après avoir appliqué le correctif.
- Utiliser un oracle déterministe chaque fois que possible, comme une lecture de réaction via l’API REST Discord ou une vérification de transcription de canal.
- Capturer des captures d’écran lorsque le bug a une surface d’interface visible.
- S’exécuter localement depuis une CLI contrôlée par un agent et à distance depuis GitHub.
- Préserver suffisamment d’état machine pour un secours VNC lorsque la connexion, l’automatisation du navigateur ou l’authentification du fournisseur se bloque.
- Publier un statut concis dans un canal Discord opérateur lorsque l’exécution est bloquée, nécessite une aide manuelle via VNC ou se termine.

## Non-objectifs

- Mantis ne remplace pas les tests unitaires. Une exécution Mantis devrait généralement devenir un test de régression plus petit une fois le correctif compris.
- Mantis n’est pas la porte CI rapide normale. Il est plus lent, utilise des identifiants réels et est réservé aux bugs où l’environnement réel compte.
- Mantis ne devrait pas nécessiter d’humain en fonctionnement normal. Le VNC manuel est une voie de secours, pas le chemin nominal.
- Mantis ne stocke pas de secrets bruts dans les artéfacts, journaux, captures d’écran, rapports Markdown ou commentaires de PR.

## Propriété

Mantis vit dans la pile QA d’OpenClaw.

- OpenClaw possède le runtime de scénario, les adaptateurs de transport, le schéma de preuves et la CLI locale sous `pnpm openclaw qa mantis`.
- QA Lab possède les éléments du harnais de transport réel, les assistants de capture navigateur et les rédacteurs d’artéfacts.
- Crabbox possède les machines Linux préchauffées lorsqu’une VM distante est nécessaire.
- GitHub Actions possède le point d’entrée du workflow distant et la conservation des artéfacts.
- ClawSweeper possède le routage des commentaires GitHub : analyse des commandes de mainteneur, déclenchement du workflow et publication du commentaire final de PR.
- Les agents OpenClaw pilotent Mantis via Codex lorsqu’un scénario nécessite une configuration agentique, du débogage ou un signalement d’état bloqué.

Cette frontière garde la connaissance du transport dans OpenClaw, la planification des machines dans Crabbox, et le collage du workflow mainteneur dans ClawSweeper.

## Forme de commande

La première commande locale vérifie le bot Discord, la guilde, le canal, l’envoi de message, l’envoi de réaction et le chemin d’artéfact :

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

Le lanceur crée des worktrees de référence et candidat détachés sous le répertoire de sortie, installe les dépendances, construit chaque ref, exécute le scénario avec `--allow-failures`, puis écrit `baseline/`, `candidate/`, `comparison.json` et `mantis-report.md`. Pour le premier scénario Discord, une vérification réussie signifie que le statut de référence est `fail` et que le statut candidat est `pass`.

La première primitive VM/navigateur est le smoke desktop :

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Elle loue ou réutilise une machine de bureau Crabbox, démarre un navigateur visible dans la session VNC, capture le bureau, rapatrie les artéfacts vers le répertoire de sortie local et écrit la commande de reconnexion dans le rapport. La commande utilise par défaut le fournisseur Hetzner parce qu’il est le premier fournisseur avec une couverture desktop/VNC fonctionnelle dans la voie Mantis. Remplacez-le avec `--provider`, `--crabbox-bin` ou `OPENCLAW_MANTIS_CRABBOX_PROVIDER` lors de l’exécution contre une autre flotte Crabbox.

Indicateurs utiles du smoke desktop :

- `--lease-id <cbx_...>` ou `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` réutilise un bureau préchauffé.
- `--browser-url <url>` change la page ouverte dans le navigateur visible.
- `--html-file <path>` rend un artéfact HTML local au dépôt dans le navigateur visible. Mantis l’utilise pour capturer la chronologie générée des réactions de statut Discord via un vrai bureau Crabbox.
- `--keep-lease` ou `OPENCLAW_MANTIS_KEEP_VM=1` garde ouverte une location nouvellement créée et réussie pour inspection VNC. Les exécutions échouées gardent la location par défaut lorsqu’elle a été créée afin qu’un opérateur puisse se reconnecter.
- `--class`, `--idle-timeout` et `--ttl` ajustent la taille de la machine et la durée de vie de la location.

La première primitive complète de transport desktop est le smoke desktop Slack :

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Elle loue ou réutilise une machine de bureau Crabbox, synchronise le checkout courant dans la VM, exécute `pnpm openclaw qa slack` dans cette VM, ouvre Slack Web dans le navigateur VNC, capture le bureau visible et copie à la fois les artéfacts QA Slack et la capture d’écran VNC vers le répertoire de sortie local. C’est la première forme Mantis où le Gateway OpenClaw SUT et le navigateur vivent tous deux dans la même VM desktop Linux.

Avec `--gateway-setup`, la commande prépare un home OpenClaw jetable persistant à `$HOME/.openclaw-mantis/slack-openclaw`, patche la configuration Slack Socket Mode pour le canal sélectionné, démarre `openclaw gateway run` sur le port `38973` et garde Chrome actif dans la session VNC. C’est le mode « laissez-moi un bureau Linux avec Slack et une claw en cours d’exécution » ; la voie QA Slack bot-à-bot reste la valeur par défaut lorsque `--gateway-setup` est omis.

Entrées requises pour `--credential-source env` :

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` pour la voie modèle distante. Si seul `OPENAI_API_KEY` est défini localement, Mantis le mappe vers `OPENCLAW_LIVE_OPENAI_KEY` avant d’invoquer Crabbox afin que le transfert d’env `OPENCLAW_*` de Crabbox puisse le transporter dans la VM.

Indicateurs utiles du desktop Slack :

- `--lease-id <cbx_...>` relance contre une machine où un opérateur s’est déjà connecté à Slack Web via VNC.
- `--gateway-setup` démarre un Gateway Slack OpenClaw persistant dans la VM au lieu d’exécuter seulement la voie QA bot-à-bot.
- `--slack-url <url>` ouvre une URL Slack Web spécifique. Sans cela, Mantis déduit `https://app.slack.com/client/<team>/<channel>` depuis `auth.test` Slack lorsque le token du bot SUT est disponible.
- `--slack-channel-id <id>` contrôle la liste d’autorisation de canaux Slack utilisée par la configuration du Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` contrôle le profil Chrome persistant dans la VM. La valeur par défaut est `$HOME/.config/openclaw-mantis/slack-chrome-profile`, de sorte qu’une connexion manuelle à Slack Web survive aux relances sur la même location.
- `--credential-source convex --credential-role ci` utilise le pool d’identifiants partagé au lieu des tokens env Slack directs.
- `--provider-mode`, `--model`, `--alt-model` et `--fast` sont transmis à la voie live Slack.

Le workflow de smoke GitHub est `Mantis Discord Smoke`. Le workflow GitHub avant et après pour le premier vrai scénario est `Mantis Discord Status Reactions`. Il accepte :

- `baseline_ref` : la ref censée reproduire le comportement uniquement en file d’attente.
- `candidate_ref` : la ref censée afficher `queued -> thinking -> done`.

Il checkout la ref du harnais de workflow, construit des worktrees de référence et candidat séparés, exécute `discord-status-reactions-tool-only` contre chaque worktree, puis téléverse `baseline/`, `candidate/`, `comparison.json` et `mantis-report.md` comme artéfacts Actions. Il rend aussi le HTML de chronologie de chaque voie dans un navigateur desktop Crabbox et publie ces captures d’écran VNC à côté des PNG de chronologie déterministes dans le commentaire de PR. Le même commentaire de PR intègre des aperçus GIF légers avec mouvement rogné générés par `crabbox media preview`, lie vers les clips MP4 correspondants avec mouvement rogné, et garde les fichiers MP4 desktop complets pour une inspection approfondie. Les captures d’écran restent inline pour une revue rapide. Le workflow construit la CLI Crabbox depuis `openclaw/crabbox` main afin de pouvoir utiliser les indicateurs de location desktop/navigateur courants avant la prochaine publication binaire Crabbox.

Vous pouvez aussi déclencher l’exécution des réactions de statut directement depuis un commentaire de PR :

```text
@Mantis discord status reactions
```

Le déclencheur de commentaire est volontairement étroit. Il ne s’exécute que sur les commentaires de pull request provenant d’utilisateurs avec un accès write, maintain ou admin, et ne reconnaît que les demandes de réactions de statut Discord. Par défaut, il utilise la ref de référence connue comme défectueuse et le SHA HEAD de la PR courante comme candidat. Les mainteneurs peuvent remplacer l’une ou l’autre ref :

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Exemples de commandes ClawSweeper :

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

La première commande est explicite et centrée sur le scénario. La seconde pourra plus tard mapper une PR ou une issue vers les scénarios Mantis recommandés à partir des labels, des fichiers modifiés et des constats de revue ClawSweeper.

## Cycle d’exécution

1. Acquérir les identifiants.
2. Allouer ou réutiliser une VM.
3. Préparer le profil desktop/navigateur lorsque le scénario nécessite des preuves d’interface.
4. Préparer un checkout propre pour la ref de référence.
5. Installer les dépendances et construire seulement ce dont le scénario a besoin.
6. Démarrer un Gateway OpenClaw enfant avec un répertoire d’état isolé.
7. Configurer le transport réel, le fournisseur, le modèle et le profil navigateur.
8. Exécuter le scénario et capturer les preuves de référence.
9. Arrêter le Gateway et préserver les journaux.
10. Préparer la ref candidate dans la même VM.
11. Exécuter le même scénario et capturer les preuves candidates.
12. Comparer les résultats de l’oracle et les preuves visuelles.
13. Écrire Markdown, JSON, journaux, captures d’écran et artéfacts de trace optionnels.
14. Téléverser les artéfacts GitHub Actions.
15. Publier un message concis de statut PR ou Discord.

Le scénario doit pouvoir échouer de deux manières différentes :

- **Bug reproduit** : la référence a échoué de la manière attendue.
- **Échec du harnais** : la configuration de l’environnement, les identifiants, l’API Discord, le navigateur ou le fournisseur a échoué avant que l’oracle du bug soit significatif.

Le rapport final doit séparer ces cas afin que les mainteneurs ne confondent pas un environnement flaky avec le comportement du produit.

## MVP Discord

Le premier scénario devrait cibler les réactions de statut Discord dans les canaux de guilde où le mode de livraison de réponse source est `message_tool_only`.

Pourquoi c’est une bonne graine Mantis :

- C’est visible dans Discord comme réactions sur le message déclencheur.
- Il dispose d’un oracle REST solide via l’état des réactions de message Discord.
- Il exerce un vrai Gateway OpenClaw, l’authentification du bot Discord, la distribution de messages, le mode de livraison de réponse source, l’état des réactions de statut et le cycle de vie du tour modèle.
- Il est suffisamment étroit pour garder la première implémentation honnête.

Forme de scénario attendue :

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

Les preuves de référence doivent afficher la réaction d’accusé de réception en file d’attente mais aucune transition de cycle de vie en mode tool-only. Les preuves candidates doivent afficher les réactions de statut de cycle de vie en cours lorsque `messages.statusReactions.enabled` est explicitement vrai.

La première tranche exécutable est le scénario QA live Discord opt-in :

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Il configure le SUT avec une gestion des guildes toujours active, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` et des réactions d’état explicites. L’oracle
interroge le vrai message déclencheur Discord et attend la séquence observée
`👀 -> 🤔 -> 👍`. Les artefacts incluent `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` et
`discord-status-reactions-tool-only-timeline.png`.

## Éléments QA existants

Mantis doit s’appuyer sur la pile QA privée existante au lieu de repartir de
zéro :

- `pnpm openclaw qa discord` exécute déjà une voie Discord en direct avec des bots
  pilote et SUT.
- Le lanceur de transport en direct écrit déjà des rapports et des artefacts de
  messages observés sous `.artifacts/qa-e2e/`.
- Les baux d’identifiants Convex fournissent déjà un accès exclusif aux
  identifiants de transport en direct partagés.
- Le service de contrôle du navigateur prend déjà en charge les captures
  d’écran, les instantanés, les profils gérés headless et les profils CDP
  distants.
- QA Lab dispose déjà d’une interface de débogage et d’un bus pour les tests de
  type transport.

La première implémentation de Mantis peut être un fin lanceur avant/après par-dessus
ces éléments, plus une couche de preuve visuelle.

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

- les refs et SHA testés
- le transport et l’identifiant du scénario
- le fournisseur de machine et l’identifiant de machine ou de bail
- la source des identifiants sans valeurs secrètes
- le résultat de la baseline
- le résultat du candidat
- si le bug s’est reproduit sur la baseline
- si le candidat l’a corrigé
- les chemins des artefacts
- les problèmes de configuration ou de nettoyage assainis

Les captures d’écran sont des preuves, pas des secrets. Elles nécessitent tout de
même une discipline de caviardage : des noms de canaux privés, des noms
d’utilisateurs ou le contenu de messages peuvent apparaître. Pour les PR
publiques, préférez les liens d’artefacts GitHub Actions aux images intégrées
tant que l’histoire du caviardage n’est pas plus solide.

## Navigateur et VNC

La voie navigateur a deux modes :

- **Automatisation headless** : mode par défaut pour la CI. Chrome s’exécute avec
  CDP activé, et Playwright ou le contrôle de navigateur OpenClaw capture les
  captures d’écran.
- **Secours VNC** : activé sur la même VM lorsque la connexion, la MFA,
  l’anti-automatisation Discord ou le débogage visuel nécessitent une
  intervention humaine.

Le profil du navigateur observateur Discord doit être suffisamment persistant
pour éviter de se connecter à chaque exécution, mais isolé de l’état du navigateur
personnel. Un profil appartient au parc de machines Mantis, pas à l’ordinateur
portable d’un développeur.

Quand Mantis se bloque, il publie un message d’état Discord avec :

- l’identifiant d’exécution
- l’identifiant du scénario
- le fournisseur de machine
- le répertoire d’artefacts
- les instructions de connexion VNC ou noVNC si disponibles
- un court texte de blocage

Le premier déploiement privé peut publier ces messages dans le canal opérateur
existant, puis migrer plus tard vers un canal Mantis dédié.

## Machines

Mantis doit préférer AWS via Crabbox pour la première implémentation distante.
Crabbox nous fournit des machines préchauffées, le suivi des baux, l’hydratation,
les journaux, les résultats et le nettoyage. Si la capacité AWS est trop lente ou
indisponible, ajoutez un fournisseur Hetzner derrière la même interface de
machine.

Exigences minimales de la VM :

- Linux avec une installation Chrome ou Chromium compatible bureau
- accès CDP pour l’automatisation du navigateur
- VNC ou noVNC pour le secours
- Node 22 et pnpm
- checkout OpenClaw et cache des dépendances
- cache du navigateur Playwright Chromium lorsque Playwright est utilisé
- assez de CPU et de mémoire pour un Gateway OpenClaw, un navigateur et une
  exécution de modèle
- accès sortant à Discord, GitHub, aux fournisseurs de modèles et au courtier
  d’identifiants

La VM ne doit pas conserver de secrets bruts de longue durée en dehors des
magasins d’identifiants ou de profils de navigateur attendus.

## Secrets

Les secrets vivent dans les secrets d’organisation ou de dépôt GitHub pour les
exécutions distantes, et dans un fichier de secrets local contrôlé par
l’opérateur pour les exécutions locales.

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
les identifiants de transport en direct. Les secrets GitHub amorcent le courtier
et les voies de secours. Le workflow de réactions d’état Discord mappe les
secrets Mantis Crabbox vers les variables d’environnement
`CRABBOX_COORDINATOR` et `CRABBOX_COORDINATOR_TOKEN` attendues par la CLI
Crabbox. Les noms de secrets GitHub simples `CRABBOX_*` restent acceptés comme
solution de compatibilité.

Le lanceur Mantis ne doit jamais imprimer :

- les tokens des bots Discord
- les clés d’API des fournisseurs
- les cookies du navigateur
- le contenu des profils d’authentification
- les mots de passe VNC
- les charges utiles brutes des identifiants

Les téléversements d’artefacts publics doivent aussi caviarder les métadonnées
cibles Discord comme les identifiants de bot, de guilde, de canal et de message.
Le workflow de smoke GitHub active `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` pour
cette raison.

Si un token est accidentellement collé dans une issue, une PR, une discussion ou
un journal, faites-le tourner après avoir stocké le nouveau secret.

## Artefacts GitHub et commentaires de PR

Les workflows Mantis doivent téléverser l’ensemble complet de preuves comme
artefact Actions à durée de vie courte. Lorsque le workflow est exécuté pour un
rapport de bug ou une PR de correction, il doit aussi publier les captures
d’écran PNG caviardées sur la branche `qa-artifacts` et mettre à jour ou créer un
commentaire sur ce bug ou cette PR de correction avec les captures avant/après
intégrées. Ne publiez pas la preuve principale uniquement sur une PR générique
d’automatisation QA. Les journaux bruts, les messages observés et les autres
preuves volumineuses restent dans l’artefact Actions.

Les workflows de production doivent publier ces commentaires avec l’application
GitHub Mantis, pas avec `github-actions[bot]`. Stockez l’identifiant de
l’application et la clé privée comme secrets GitHub Actions
`MANTIS_GITHUB_APP_ID` et `MANTIS_GITHUB_APP_PRIVATE_KEY`. Le workflow utilise
un marqueur masqué comme clé de mise à jour, met à jour ce commentaire lorsque le
token peut le modifier, et crée un nouveau commentaire appartenant à Mantis
lorsqu’un ancien marqueur appartenant à un bot ne peut pas être modifié.

Le commentaire de PR doit être court et visuel :

```md
QA Mantis des réactions d’état Discord

Résumé : Mantis a relancé le bug signalé des réactions d’état Discord sur la
baseline connue comme défectueuse et sur la correction candidate. La baseline a
reproduit le bug, tandis que le candidat a montré la séquence attendue queued -> thinking -> done.

- Scénario : `discord-status-reactions-tool-only`
- Exécution : <workflow run link>
- Artefact : <artifact link>
- Baseline : `<status>` à `<sha>`
- Candidat : `<status>` à `<sha>`

| Baseline            | Candidat            |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

Lorsque l’exécution échoue parce que le harnais a échoué, le commentaire doit le
dire au lieu de laisser entendre que le candidat a échoué.

## Notes de déploiement privé

Un déploiement privé peut déjà disposer d’une application Discord Mantis.
Réutilisez cette application au lieu d’en créer une autre lorsqu’elle possède les
bonnes autorisations de bot et peut être tournée en toute sécurité.

Définissez le canal initial de notification des opérateurs via les secrets ou la
configuration de déploiement. Il peut d’abord pointer vers un canal de
maintenance ou d’opérations existant, puis migrer vers un canal Mantis dédié une
fois qu’il existe.

Ne placez pas d’identifiants de guilde, d’identifiants de canal, de tokens de
bot, de cookies de navigateur ou de mots de passe VNC dans ce document.
Stockez-les dans les secrets GitHub, le courtier d’identifiants ou le magasin de
secrets local de l’opérateur.

## Ajout d’un scénario

Un scénario Mantis doit déclarer :

- l’identifiant et le titre
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
- le budget de délai d’attente
- les étapes de nettoyage

Les scénarios doivent privilégier de petits oracles typés :

- état des réactions Discord pour les bugs de réaction
- références de messages Discord pour les bugs de fil de discussion
- ts de fil Slack et état de l’API de réaction pour les bugs Slack
- identifiants et en-têtes de messages email pour les bugs email
- captures d’écran de navigateur lorsque l’interface utilisateur est le seul
  observable fiable

Les contrôles de vision doivent être additifs. Si une API de plateforme peut
prouver le bug, utilisez l’API comme oracle réussite/échec et gardez les captures
d’écran pour la confiance humaine.

## Expansion des fournisseurs

Après Discord, le même lanceur peut ajouter :

- Slack : réactions, fils, mentions d’application, modales, téléversements de fichiers.
- Email : authentification Gmail et fils de messages avec `gog` lorsque les connecteurs ne suffisent pas.
- WhatsApp : connexion QR, ré-identification, livraison de messages, médias, réactions.
- Telegram : contrôle des mentions de groupe, commandes, réactions lorsque disponibles.
- Matrix : salons chiffrés, relations de fil ou de réponse, reprise après redémarrage.

Chaque transport doit avoir un scénario smoke peu coûteux et un ou plusieurs
scénarios de classe de bugs. Les scénarios visuels coûteux doivent rester
optionnels.

## Questions ouvertes

- Quel bot Discord doit être le pilote, et lequel doit être le SUT, lorsque le
  bot Mantis existant est réutilisé ?
- La connexion du navigateur observateur doit-elle utiliser un compte Discord
  humain, un compte de test, ou uniquement des preuves REST lisibles par bot pour
  la première phase ?
- Pendant combien de temps GitHub doit-il conserver les artefacts Mantis pour les PR ?
- Quand ClawSweeper doit-il recommander automatiquement Mantis au lieu d’attendre
  une commande d’un mainteneur ?
- Les captures d’écran doivent-elles être caviardées ou recadrées avant le
  téléversement pour les PR publiques ?
