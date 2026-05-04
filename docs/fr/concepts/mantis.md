---
read_when:
    - Création ou exécution de l’assurance qualité visuelle en direct pour les bogues OpenClaw
    - Ajout d’une vérification avant et après pour une demande de tirage
    - Ajout de scénarios de transport en direct pour Discord, Slack, WhatsApp ou d’autres
    - Débogage des exécutions QA nécessitant des captures d’écran, l’automatisation du navigateur ou un accès VNC
summary: Mantis est le système de vérification visuelle de bout en bout permettant de reproduire les bogues OpenClaw sur des transports en direct, de capturer des preuves avant et après, et de joindre des artefacts aux PR.
title: Mante
x-i18n:
    generated_at: "2026-05-04T02:23:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a86ab4bc876d1c53ada1c30580034165f028194a072f559eb54a898a369211d
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis est le système de vérification de bout en bout d’OpenClaw pour les bugs qui nécessitent un vrai runtime, un vrai transport et une preuve visible. Il exécute un scénario sur une référence connue comme défectueuse, capture les preuves, exécute le même scénario sur une référence candidate, puis publie la comparaison sous forme d’artefacts qu’un mainteneur peut inspecter depuis une PR ou depuis une commande locale.

Mantis commence par Discord, car Discord nous offre une première voie à forte valeur ajoutée : authentification réelle du bot, vrais salons de guildes, réactions, fils de discussion, commandes natives et une interface navigateur où les humains peuvent confirmer visuellement ce que le transport a montré.

## Objectifs

- Reproduire un bug issu d’une issue ou PR GitHub avec la même forme de transport que celle vue par les utilisateurs.
- Capturer un artefact **avant** sur la référence de base avant d’appliquer le correctif.
- Capturer un artefact **après** sur la référence candidate après avoir appliqué le correctif.
- Utiliser un oracle déterministe chaque fois que possible, comme une lecture de réaction via l’API REST Discord ou une vérification de transcription de salon.
- Capturer des captures d’écran lorsque le bug possède une surface d’interface visible.
- Exécuter localement depuis une CLI contrôlée par agent et à distance depuis GitHub.
- Préserver assez d’état machine pour un secours VNC lorsque la connexion, l’automatisation du navigateur ou l’authentification du fournisseur se bloque.
- Publier un statut concis dans un salon Discord opérateur lorsque l’exécution est bloquée, nécessite une aide VNC manuelle ou se termine.

## Non-objectifs

- Mantis ne remplace pas les tests unitaires. Une exécution Mantis devrait généralement devenir un test de régression plus petit une fois le correctif compris.
- Mantis n’est pas la porte CI rapide normale. Il est plus lent, utilise des identifiants réels et est réservé aux bugs pour lesquels l’environnement réel compte.
- Mantis ne devrait pas nécessiter d’humain en fonctionnement normal. Le VNC manuel est un chemin de secours, pas le chemin nominal.
- Mantis ne stocke pas de secrets bruts dans les artefacts, journaux, captures d’écran, rapports Markdown ou commentaires de PR.

## Propriété

Mantis vit dans la stack QA d’OpenClaw.

- OpenClaw possède le runtime de scénario, les adaptateurs de transport, le schéma de preuves et la CLI locale sous `pnpm openclaw qa mantis`.
- QA Lab possède les éléments du harnais de transport réel, les assistants de capture navigateur et les rédacteurs d’artefacts.
- Crabbox possède les machines Linux préchauffées lorsqu’une VM distante est nécessaire.
- GitHub Actions possède le point d’entrée du workflow distant et la conservation des artefacts.
- ClawSweeper possède le routage des commentaires GitHub : analyse des commandes de mainteneur, déclenchement du workflow et publication du commentaire PR final.
- Les agents OpenClaw pilotent Mantis via Codex lorsqu’un scénario nécessite une configuration agentique, du débogage ou un signalement d’état bloqué.

Cette frontière garde la connaissance du transport dans OpenClaw, la planification des machines dans Crabbox et la colle de workflow mainteneur dans ClawSweeper.

## Forme des commandes

La première commande locale vérifie le bot Discord, la guilde, le salon, l’envoi de message, l’envoi de réaction et le chemin des artefacts :

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

L’exécuteur local avant et après accepte cette forme :

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

L’exécuteur crée des worktrees de base et candidats détachés sous le répertoire de sortie, installe les dépendances, construit chaque référence, exécute le scénario avec `--allow-failures`, puis écrit `baseline/`, `candidate/`, `comparison.json` et `mantis-report.md`. Pour le premier scénario Discord, une vérification réussie signifie que le statut de base est `fail` et que le statut candidat est `pass`.

La première primitive VM/navigateur est le smoke desktop :

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Elle loue ou réutilise une machine desktop Crabbox, démarre un navigateur visible dans la session VNC, capture le bureau, rapatrie les artefacts vers le répertoire de sortie local et écrit la commande de reconnexion dans le rapport. La commande utilise par défaut le fournisseur Hetzner parce qu’il est le premier fournisseur avec une couverture desktop/VNC fonctionnelle dans la voie Mantis. Remplacez-le avec `--provider`, `--crabbox-bin` ou `OPENCLAW_MANTIS_CRABBOX_PROVIDER` lors d’une exécution sur une autre flotte Crabbox.

Indicateurs utiles pour le smoke desktop :

- `--lease-id <cbx_...>` ou `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` réutilise un desktop préchauffé.
- `--browser-url <url>` change la page ouverte dans le navigateur visible.
- `--html-file <path>` affiche un artefact HTML local au dépôt dans le navigateur visible. Mantis l’utilise pour capturer la chronologie générée des réactions de statut Discord via un vrai desktop Crabbox.
- `--keep-lease` ou `OPENCLAW_MANTIS_KEEP_VM=1` garde ouverte une location nouvellement créée et réussie pour inspection VNC. Les exécutions échouées gardent la location par défaut lorsqu’une location a été créée afin qu’un opérateur puisse se reconnecter.
- `--class`, `--idle-timeout` et `--ttl` règlent la taille de la machine et la durée de vie de la location.

Le workflow smoke GitHub est `Mantis Discord Smoke`. Le workflow GitHub avant et après pour le premier vrai scénario est `Mantis Discord Status Reactions`. Il accepte :

- `baseline_ref` : la référence censée reproduire le comportement file d’attente uniquement.
- `candidate_ref` : la référence censée montrer `queued -> thinking -> done`.

Il récupère la référence du harnais de workflow, construit des worktrees de base et candidats séparés, exécute `discord-status-reactions-tool-only` sur chaque worktree et téléverse `baseline/`, `candidate/`, `comparison.json` et `mantis-report.md` comme artefacts Actions. Il rend aussi le HTML de chronologie de chaque voie dans un navigateur desktop Crabbox et publie ces captures d’écran VNC à côté des PNG de chronologie déterministes dans le commentaire PR. Le workflow construit la CLI Crabbox depuis `openclaw/crabbox` main afin de pouvoir utiliser les indicateurs de location desktop/navigateur actuels avant la prochaine publication du binaire Crabbox.

Vous pouvez aussi déclencher directement l’exécution status-reactions depuis un commentaire de PR :

```text
@Mantis discord status reactions
```

Le déclencheur de commentaire est volontairement étroit. Il ne s’exécute que sur les commentaires de pull request provenant d’utilisateurs ayant un accès write, maintain ou admin, et il ne reconnaît que les demandes de réactions de statut Discord. Par défaut, il utilise la référence de base connue comme défectueuse et le SHA HEAD de la PR courante comme candidat. Les mainteneurs peuvent remplacer l’une ou l’autre référence :

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Exemples de commandes ClawSweeper :

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

La première commande est explicite et centrée sur le scénario. La seconde pourra plus tard associer une PR ou une issue aux scénarios Mantis recommandés à partir des labels, des fichiers modifiés et des constats de revue ClawSweeper.

## Cycle d’exécution

1. Acquérir les identifiants.
2. Allouer ou réutiliser une VM.
3. Préparer le profil desktop/navigateur lorsque le scénario nécessite une preuve d’interface.
4. Préparer un checkout propre pour la référence de base.
5. Installer les dépendances et construire uniquement ce dont le scénario a besoin.
6. Démarrer un Gateway OpenClaw enfant avec un répertoire d’état isolé.
7. Configurer le transport réel, le fournisseur, le modèle et le profil navigateur.
8. Exécuter le scénario et capturer les preuves de base.
9. Arrêter le Gateway et préserver les journaux.
10. Préparer la référence candidate dans la même VM.
11. Exécuter le même scénario et capturer les preuves candidates.
12. Comparer les résultats de l’oracle et les preuves visuelles.
13. Écrire Markdown, JSON, journaux, captures d’écran et artefacts de trace optionnels.
14. Téléverser les artefacts GitHub Actions.
15. Publier un message de statut concis dans la PR ou Discord.

Le scénario devrait pouvoir échouer de deux manières différentes :

- **Bug reproduit** : la base a échoué de la manière attendue.
- **Échec du harnais** : la configuration de l’environnement, les identifiants, l’API Discord, le navigateur ou le fournisseur a échoué avant que l’oracle du bug ne soit significatif.

Le rapport final doit séparer ces cas afin que les mainteneurs ne confondent pas un environnement instable avec le comportement du produit.

## MVP Discord

Le premier scénario devrait cibler les réactions de statut Discord dans les salons de guilde où le mode de livraison de réponse source est `message_tool_only`.

Pourquoi c’est une bonne graine Mantis :

- C’est visible dans Discord comme réactions sur le message déclencheur.
- Il dispose d’un oracle REST solide via l’état des réactions du message Discord.
- Il exerce un vrai Gateway OpenClaw, l’authentification du bot Discord, la répartition des messages, le mode de livraison de réponse source, l’état des réactions de statut et le cycle de vie du tour de modèle.
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

Les preuves de base devraient montrer la réaction d’accusé de réception en file d’attente, mais aucune transition de cycle de vie en mode tool-only. Les preuves candidates devraient montrer les réactions de statut de cycle de vie en cours d’exécution lorsque `messages.statusReactions.enabled` est explicitement `true`.

La première tranche exécutable est le scénario QA Discord réel opt-in :

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
"message_tool"`, `ackReaction: "👀"` et des réactions de statut explicites. L’oracle interroge le vrai message déclencheur Discord et attend la séquence observée `👀 -> 🤔 -> 👍`. Les artefacts incluent `discord-qa-reaction-timelines.json`, `discord-status-reactions-tool-only-timeline.html` et `discord-status-reactions-tool-only-timeline.png`.

## Éléments QA existants

Mantis devrait s’appuyer sur la stack QA privée existante au lieu de repartir de zéro :

- `pnpm openclaw qa discord` exécute déjà une voie Discord réelle avec des bots pilote et SUT.
- L’exécuteur de transport réel écrit déjà des rapports et des artefacts de messages observés sous `.artifacts/qa-e2e/`.
- Les locations d’identifiants Convex fournissent déjà un accès exclusif aux identifiants de transport réel partagés.
- Le service de contrôle navigateur prend déjà en charge les captures d’écran, instantanés, profils gérés headless et profils CDP distants.
- QA Lab dispose déjà d’une interface de débogage et d’un bus pour les tests en forme de transport.

La première implémentation de Mantis peut être un mince exécuteur avant/après par-dessus ces éléments, plus une couche de preuves visuelles.

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

`mantis-summary.json` devrait être la source de vérité lisible par machine. Le rapport Markdown sert aux commentaires PR et à la revue humaine.

Le résumé doit inclure :

- les références et SHA testés
- le transport et l’identifiant de scénario
- le fournisseur de machine et l’identifiant de machine ou de location
- la source des identifiants sans valeurs secrètes
- le résultat de base
- le résultat candidat
- si le bug a été reproduit sur la base
- si le candidat l’a corrigé
- les chemins d’artefacts
- les problèmes de configuration ou de nettoyage assainis

Les captures d’écran sont des preuves, pas des secrets. Elles nécessitent tout de même une discipline de rédaction : noms de salons privés, noms d’utilisateurs ou contenu de messages peuvent apparaître. Pour les PR publiques, préférez les liens vers les artefacts GitHub Actions plutôt que les images intégrées jusqu’à ce que la stratégie de rédaction soit plus solide.

## Navigateur et VNC

La voie navigateur possède deux modes :

- **Automatisation headless** : par défaut pour la CI. Chrome s’exécute avec CDP activé, et Playwright ou le contrôle navigateur OpenClaw capture les captures d’écran.
- **Secours VNC** : activé sur la même VM lorsque la connexion, la MFA, l’anti-automatisation Discord ou le débogage visuel nécessite un humain.

Le profil de navigateur observateur Discord doit être suffisamment persistant pour éviter
de se reconnecter à chaque exécution, mais isolé de l’état du navigateur personnel. Un profil
appartient au pool de machines Mantis, pas à l’ordinateur portable d’un développeur.

Quand Mantis reste bloqué, il publie un message de statut Discord avec :

- id d’exécution
- id de scénario
- fournisseur de machine
- répertoire des artefacts
- instructions de connexion VNC ou noVNC si disponibles
- texte court décrivant le blocage

Le premier déploiement privé peut publier ces messages dans le canal opérateur
existant et passer plus tard à un canal Mantis dédié.

## Machines

Mantis doit privilégier AWS via Crabbox pour la première implémentation distante.
Crabbox nous fournit des machines préchauffées, le suivi des baux, l’hydratation,
les journaux, les résultats et le nettoyage. Si la capacité AWS est trop lente ou
indisponible, ajoutez un fournisseur Hetzner derrière la même interface de machine.

Exigences minimales pour la VM :

- Linux avec une installation Chrome ou Chromium compatible avec un bureau
- accès CDP pour l’automatisation du navigateur
- VNC ou noVNC pour la récupération
- Node 22 et pnpm
- checkout OpenClaw et cache des dépendances
- cache du navigateur Playwright Chromium quand Playwright est utilisé
- suffisamment de CPU et de mémoire pour un OpenClaw Gateway, un navigateur et une exécution de modèle
- accès sortant à Discord, GitHub, aux fournisseurs de modèles et au courtier d’identifiants

La VM ne doit pas conserver de secrets bruts à longue durée de vie en dehors des
magasins d’identifiants ou de profils de navigateur attendus.

## Secrets

Les secrets résident dans les secrets d’organisation ou de dépôt GitHub pour les
exécutions distantes, et dans un fichier de secrets local contrôlé par l’opérateur
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

À long terme, le pool d’identifiants Convex doit rester la source normale des
identifiants de transport en direct. Les secrets GitHub amorcent le courtier et
les voies de secours. Le workflow des réactions de statut Discord mappe les
secrets Mantis Crabbox vers les variables d’environnement `CRABBOX_COORDINATOR`
et `CRABBOX_COORDINATOR_TOKEN` attendues par la CLI Crabbox. Les noms de secrets
GitHub `CRABBOX_*` simples restent acceptés comme solution de compatibilité.

Le runner Mantis ne doit jamais afficher :

- jetons de bots Discord
- clés d’API de fournisseurs
- cookies de navigateur
- contenu des profils d’authentification
- mots de passe VNC
- charges utiles d’identifiants brutes

Les téléversements d’artefacts publics doivent aussi caviarder les métadonnées de
cible Discord telles que les ids de bot, serveur, canal et message. Le workflow
smoke GitHub active `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` pour cette raison.

Si un jeton est accidentellement collé dans une issue, une PR, un chat ou un
journal, faites-le tourner après avoir stocké le nouveau secret.

## Artefacts GitHub et commentaires de PR

Les workflows Mantis doivent téléverser le paquet complet de preuves sous forme
d’artefact Actions à courte durée de vie. Quand le workflow est exécuté pour un
rapport de bogue ou une PR de correction, il doit aussi publier les captures
d’écran PNG caviardées dans la branche `qa-artifacts` et insérer ou mettre à jour
un commentaire sur ce bogue ou cette PR de correction avec des captures d’écran
avant/après intégrées. Ne publiez pas la preuve principale uniquement sur une PR
générique d’automatisation QA. Les journaux bruts, messages observés et autres
preuves volumineuses restent dans l’artefact Actions.

Les workflows de production doivent publier ces commentaires avec la GitHub App
Mantis, pas avec `github-actions[bot]`. Stockez l’id de l’app et la clé privée
comme secrets GitHub Actions `MANTIS_GITHUB_APP_ID` et
`MANTIS_GITHUB_APP_PRIVATE_KEY`. Le workflow utilise un marqueur masqué comme clé
d’upsert, met à jour ce commentaire quand le jeton peut le modifier, et crée un
nouveau commentaire appartenant à Mantis quand un ancien marqueur appartenant à
un bot ne peut pas être modifié.

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

Quand l’exécution échoue parce que le harnais a échoué, le commentaire doit le
dire au lieu de laisser entendre que le candidat a échoué.

## Notes de déploiement privé

Un déploiement privé peut déjà disposer d’une application Discord Mantis.
Réutilisez cette application au lieu d’en créer une autre quand elle dispose des
bonnes autorisations de bot et peut faire l’objet d’une rotation en toute sécurité.

Définissez le canal initial de notification des opérateurs via des secrets ou la
configuration de déploiement. Il peut d’abord pointer vers un canal mainteneur ou
opérations existant, puis passer à un canal Mantis dédié dès qu’il existe.

Ne mettez pas d’ids de serveur, d’ids de canal, de jetons de bot, de cookies de
navigateur ou de mots de passe VNC dans ce document. Stockez-les dans les secrets
GitHub, le courtier d’identifiants ou le magasin local de secrets de l’opérateur.

## Ajouter un scénario

Un scénario Mantis doit déclarer :

- id et titre
- transport
- identifiants requis
- politique de référence de base
- politique de référence candidate
- correctif de configuration OpenClaw
- étapes de configuration
- stimulus
- oracle de référence attendu
- oracle candidat attendu
- cibles de capture visuelle
- budget de délai d’expiration
- étapes de nettoyage

Les scénarios doivent privilégier de petits oracles typés :

- état des réactions Discord pour les bogues de réactions
- références de messages Discord pour les bogues de fils de discussion
- ts de fil Slack et état de l’API de réactions pour les bogues Slack
- ids et en-têtes de messages e-mail pour les bogues e-mail
- captures d’écran du navigateur quand l’UI est le seul observable fiable

Les vérifications par vision doivent être additives. Si une API de plateforme peut
prouver le bogue, utilisez l’API comme oracle de réussite/échec et conservez les
captures d’écran pour la confiance humaine.

## Extension des fournisseurs

Après Discord, le même runner peut ajouter :

- Slack : réactions, fils, mentions d’app, modales, téléversements de fichiers.
- E-mail : authentification Gmail et fils de messages avec `gog` quand les connecteurs ne
  suffisent pas.
- WhatsApp : connexion QR, ré-identification, livraison des messages, médias, réactions.
- Telegram : contrôle des mentions de groupe, commandes, réactions quand disponibles.
- Matrix : salons chiffrés, relations de fil ou de réponse, reprise après redémarrage.

Chaque transport doit avoir un scénario smoke peu coûteux et un ou plusieurs
scénarios par classe de bogues. Les scénarios visuels coûteux doivent rester
optionnels.

## Questions ouvertes

- Quel bot Discord doit être le pilote, et lequel doit être le SUT, quand le
  bot Mantis existant est réutilisé ?
- La connexion du navigateur observateur doit-elle utiliser un compte Discord
  humain, un compte de test, ou seulement des preuves REST lisibles par bot pour
  la première phase ?
- Combien de temps GitHub doit-il conserver les artefacts Mantis pour les PR ?
- Quand ClawSweeper doit-il recommander automatiquement Mantis au lieu d’attendre
  une commande de mainteneur ?
- Les captures d’écran doivent-elles être caviardées ou rognées avant le téléversement pour les PR publiques ?
