---
read_when:
    - Création ou exécution de l’assurance qualité visuelle en direct pour les bogues OpenClaw
    - Ajout d’une vérification avant et après pour une demande de tirage
    - Ajout de scénarios de transport en direct pour Discord, Slack, WhatsApp ou autres
    - Débogage des exécutions d’assurance qualité nécessitant des captures d’écran, l’automatisation du navigateur ou un accès VNC
summary: Mantis est le système de vérification visuelle de bout en bout permettant de reproduire les bugs OpenClaw sur des transports en direct, de capturer des preuves avant et après, et de joindre des artefacts aux PR.
title: Mante
x-i18n:
    generated_at: "2026-05-03T21:29:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3463882b01a7941f6d758c509d6cd70e099aa8352053347fa9c37a80e5b256ce
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis est le système de vérification de bout en bout d’OpenClaw pour les bugs qui nécessitent un véritable
runtime, un véritable transport et une preuve visible. Il exécute un scénario sur une référence connue comme
défaillante, capture les preuves, exécute le même scénario sur une référence candidate, puis
publie la comparaison sous forme d’artifacts qu’un mainteneur peut inspecter depuis une PR ou
depuis une commande locale.

Mantis commence avec Discord parce que Discord nous fournit une première voie à forte valeur :
authentification réelle du bot, véritables canaux de guilde, réactions, fils, commandes natives et une
interface utilisateur de navigateur où les humains peuvent confirmer visuellement ce que le transport a montré.

## Objectifs

- Reproduire un bug depuis une issue GitHub ou une PR avec la même forme de transport que celle que les utilisateurs
  voient.
- Capturer un artifact **avant** sur la référence de base avant d’appliquer le correctif.
- Capturer un artifact **après** sur la référence candidate après avoir appliqué le correctif.
- Utiliser un oracle déterministe chaque fois que possible, comme une lecture de réaction Discord REST
  ou une vérification de transcript de canal.
- Capturer des captures d’écran lorsque le bug a une surface d’interface utilisateur visible.
- Exécuter localement depuis une CLI contrôlée par agent et à distance depuis GitHub.
- Préserver assez d’état machine pour une récupération VNC lorsque la connexion, l’automatisation du navigateur ou
  l’authentification du fournisseur reste bloquée.
- Publier un statut concis dans un canal Discord opérateur lorsque l’exécution est bloquée,
  nécessite une aide VNC manuelle ou se termine.

## Non-objectifs

- Mantis ne remplace pas les tests unitaires. Une exécution Mantis devrait généralement devenir
  un test de régression plus petit une fois le correctif compris.
- Mantis n’est pas la barrière CI rapide normale. Il est plus lent, utilise des identifiants réels et
  est réservé aux bugs où l’environnement réel compte.
- Mantis ne devrait pas nécessiter d’humain pour le fonctionnement normal. Le VNC manuel est un
  chemin de secours, pas le chemin nominal.
- Mantis ne stocke pas de secrets bruts dans les artifacts, journaux, captures d’écran, rapports Markdown
  ou commentaires de PR.

## Propriété

Mantis vit dans la pile QA d’OpenClaw.

- OpenClaw possède le runtime de scénario, les adaptateurs de transport, le schéma de preuves et
  la CLI locale sous `pnpm openclaw qa mantis`.
- QA Lab possède les composants du harnais de transport réel, les assistants de capture de navigateur et
  les rédacteurs d’artifacts.
- Crabbox possède les machines Linux préchauffées lorsqu’une VM distante est nécessaire.
- GitHub Actions possède le point d’entrée du workflow distant et la rétention des artifacts.
- ClawSweeper possède le routage des commentaires GitHub : analyse des commandes des mainteneurs,
  déclenchement du workflow et publication du commentaire final de PR.
- Les agents OpenClaw pilotent Mantis via Codex lorsqu’un scénario nécessite une configuration agentique,
  du débogage ou un signalement d’état bloqué.

Cette limite garde la connaissance du transport dans OpenClaw, la planification des machines dans
Crabbox, et la colle du workflow mainteneur dans ClawSweeper.

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

Le lanceur crée des worktrees détachés de base et candidats sous le répertoire de sortie,
installe les dépendances, construit chaque référence, exécute le scénario avec
`--allow-failures`, puis écrit `baseline/`, `candidate/`, `comparison.json`,
et `mantis-report.md`. Pour le premier scénario Discord, une vérification réussie
signifie que le statut de base est `fail` et que le statut candidat est `pass`.

Le workflow de smoke GitHub est `Mantis Discord Smoke`. Le workflow GitHub avant et après
pour le premier vrai scénario est `Mantis Discord Status Reactions`. Il
accepte :

- `baseline_ref` : la référence censée reproduire le comportement uniquement en file d’attente.
- `candidate_ref` : la référence censée montrer `queued -> thinking -> done`.

Il récupère la référence du harnais de workflow, construit des worktrees de base et candidats
séparés, exécute `discord-status-reactions-tool-only` sur chaque worktree, et
téléverse `baseline/`, `candidate/`, `comparison.json` et `mantis-report.md` comme
artifacts Actions.

Vous pouvez aussi déclencher l’exécution status-reactions directement depuis un commentaire de PR :

```text
@Mantis discord status reactions
```

Le déclencheur par commentaire est volontairement étroit. Il s’exécute uniquement sur les commentaires de pull request
provenant d’utilisateurs avec un accès write, maintain ou admin, et il ne reconnaît que les
requêtes de réactions de statut Discord. Par défaut, il utilise la référence de base connue comme mauvaise
et le SHA de tête de la PR actuelle comme candidat. Les mainteneurs peuvent remplacer l’une ou l’autre
référence :

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Exemples de commandes ClawSweeper :

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

La première commande est explicite et centrée sur le scénario. La seconde pourra plus tard associer une PR
ou une issue aux scénarios Mantis recommandés à partir des labels, des fichiers modifiés et
des conclusions de revue ClawSweeper.

## Cycle de vie d’exécution

1. Acquérir les identifiants.
2. Allouer ou réutiliser une VM.
3. Préparer un checkout propre pour la référence de base.
4. Installer les dépendances et construire uniquement ce dont le scénario a besoin.
5. Démarrer un Gateway OpenClaw enfant avec un répertoire d’état isolé.
6. Configurer le transport réel, le fournisseur, le modèle et le profil de navigateur.
7. Exécuter le scénario et capturer les preuves de base.
8. Arrêter le Gateway et préserver les journaux.
9. Préparer la référence candidate dans la même VM.
10. Exécuter le même scénario et capturer les preuves candidates.
11. Comparer les résultats de l’oracle et les preuves visuelles.
12. Écrire les artifacts Markdown, JSON, journaux, captures d’écran et traces optionnelles.
13. Téléverser les artifacts GitHub Actions.
14. Publier un message de statut concis dans la PR ou sur Discord.

Le scénario devrait pouvoir échouer de deux manières différentes :

- **Bug reproduit** : la base a échoué de la façon attendue.
- **Échec du harnais** : la configuration de l’environnement, les identifiants, l’API Discord, le navigateur ou
  le fournisseur ont échoué avant que l’oracle du bug soit significatif.

Le rapport final doit séparer ces cas afin que les mainteneurs ne confondent pas un
environnement instable avec le comportement du produit.

## MVP Discord

Le premier scénario devrait cibler les réactions de statut Discord dans les canaux de guilde où
le mode de livraison de réponse source est `message_tool_only`.

Pourquoi c’est une bonne graine Mantis :

- C’est visible dans Discord comme réactions sur le message déclencheur.
- Il dispose d’un oracle REST robuste via l’état des réactions de message Discord.
- Il exerce un véritable Gateway OpenClaw, l’authentification de bot Discord, la distribution de messages,
  le mode de livraison de réponse source, l’état des réactions de statut et le cycle de vie d’un tour de modèle.
- Il est assez étroit pour garder la première implémentation honnête.

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

Les preuves de base devraient montrer la réaction d’accusé de réception en file d’attente mais aucune
transition de cycle de vie en mode outil uniquement. Les preuves candidates devraient montrer les réactions
de statut de cycle de vie s’exécutant lorsque `messages.statusReactions.enabled` est explicitement
true.

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

Il configure le SUT avec une gestion de guilde toujours active, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` et des réactions de statut explicites. L’oracle
interroge le vrai message déclencheur Discord et attend la séquence observée
`👀 -> 🤔 -> 👍`. Les artifacts incluent `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` et
`discord-status-reactions-tool-only-timeline.png`.

## Composants QA existants

Mantis devrait s’appuyer sur la pile QA privée existante au lieu de partir de
zéro :

- `pnpm openclaw qa discord` exécute déjà une voie Discord réelle avec bots pilote et
  SUT.
- Le lanceur de transport réel écrit déjà des rapports et des artifacts de messages observés
  sous `.artifacts/qa-e2e/`.
- Les baux d’identifiants Convex fournissent déjà un accès exclusif aux identifiants partagés de
  transport réel.
- Le service de contrôle du navigateur prend déjà en charge les captures d’écran, les instantanés,
  les profils gérés headless et les profils CDP distants.
- QA Lab dispose déjà d’une interface utilisateur de débogage et d’un bus pour les tests en forme de transport.

La première implémentation de Mantis peut être un mince lanceur avant/après au-dessus de ces
composants, plus une couche de preuves visuelles.

## Modèle de preuves

Chaque exécution écrit un répertoire d’artifact stable :

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

`mantis-summary.json` devrait être la source de vérité lisible par machine. Le
rapport Markdown est destiné aux commentaires de PR et à la revue humaine.

Le résumé doit inclure :

- les références et SHA testés
- le transport et l’identifiant de scénario
- le fournisseur de machine et l’identifiant de machine ou de bail
- la source des identifiants sans valeurs secrètes
- le résultat de base
- le résultat candidat
- si le bug a été reproduit sur la base
- si le candidat l’a corrigé
- les chemins d’artifacts
- les problèmes de configuration ou de nettoyage nettoyés

Les captures d’écran sont des preuves, pas des secrets. Elles nécessitent tout de même une discipline de rédaction :
des noms de canaux privés, des noms d’utilisateurs ou du contenu de messages peuvent apparaître. Pour les PR publiques,
préférez les liens d’artifacts GitHub Actions aux images intégrées jusqu’à ce que l’histoire de rédaction
soit plus robuste.

## Navigateur et VNC

La voie navigateur a deux modes :

- **Automatisation headless** : par défaut pour la CI. Chrome s’exécute avec CDP activé, et
  Playwright ou le contrôle de navigateur OpenClaw capture les captures d’écran.
- **Secours VNC** : activé sur la même VM lorsque la connexion, MFA, l’anti-automatisation Discord
  ou le débogage visuel nécessite un humain.

Le profil de navigateur observateur Discord devrait être assez persistant pour éviter de
se connecter à chaque exécution, mais isolé de l’état de navigateur personnel. Un profil
appartient au pool de machines Mantis, pas à l’ordinateur portable d’un développeur.

Lorsque Mantis reste bloqué, il publie un message de statut Discord avec :

- l’identifiant d’exécution
- l’identifiant de scénario
- le fournisseur de machine
- le répertoire d’artifact
- les instructions de connexion VNC ou noVNC si disponibles
- un court texte de blocage

Le premier déploiement privé peut publier ces messages dans le canal opérateur existant
et passer plus tard à un canal Mantis dédié.

## Machines

Mantis devrait privilégier AWS via Crabbox pour la première implémentation distante.
Crabbox nous fournit des machines préchauffées, le suivi des baux, l’hydratation, les journaux, les résultats et
le nettoyage. Si la capacité AWS est trop lente ou indisponible, ajoutez un fournisseur Hetzner
derrière la même interface machine.

Exigences minimales de VM :

- Linux avec une installation Chrome ou Chromium compatible avec un bureau
- accès CDP pour l’automatisation du navigateur
- VNC ou noVNC pour le secours
- Node 22 et pnpm
- checkout OpenClaw et cache de dépendances
- cache du navigateur Playwright Chromium lorsque Playwright est utilisé
- assez de CPU et de mémoire pour un Gateway OpenClaw, un navigateur et une exécution de modèle
- accès sortant à Discord, GitHub, aux fournisseurs de modèles et au courtier d’identifiants

La VM ne devrait pas conserver de secrets bruts durables en dehors des magasins d’identifiants ou
de profils de navigateur attendus.

## Secrets

Les secrets vivent dans les secrets d’organisation ou de dépôt GitHub pour les exécutions distantes, et dans
un fichier de secrets local contrôlé par l’opérateur pour les exécutions locales.

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

À long terme, le pool d’identifiants Convex doit rester la source normale pour les
identifiants de transport en direct. Les secrets GitHub initialisent le broker et
les voies de repli.

Le runner Mantis ne doit jamais afficher :

- les tokens de bots Discord
- les clés d’API de fournisseurs
- les cookies de navigateur
- le contenu des profils d’authentification
- les mots de passe VNC
- les charges utiles brutes d’identifiants

Les téléversements d’artefacts publics doivent aussi masquer les métadonnées de
cible Discord, comme les identifiants de bot, de guilde, de canal et de message.
Le workflow de smoke GitHub active `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` pour
cette raison.

Si un token est collé par erreur dans une issue, une PR, un chat ou un log,
faites-le tourner après avoir stocké le nouveau secret.

## Artefacts GitHub et commentaires de PR

Les workflows Mantis doivent téléverser l’ensemble complet de preuves sous forme
d’artefact Actions à courte durée de vie. Lorsque le workflow est exécuté pour un
rapport de bug ou une PR de correction, il doit aussi publier les captures
d’écran PNG expurgées sur la branche `qa-artifacts` et insérer ou mettre à jour
un commentaire sur ce bug ou cette PR de correction avec des captures d’écran
avant/après en ligne. Ne publiez pas la preuve principale uniquement sur une PR
générique d’automatisation QA. Les logs bruts, les messages observés et les
autres preuves volumineuses restent dans l’artefact Actions.

Les workflows de production doivent publier ces commentaires avec l’application
GitHub Mantis, et non avec `github-actions[bot]`. Stockez l’id de l’application
et la clé privée comme secrets GitHub Actions `MANTIS_GITHUB_APP_ID` et
`MANTIS_GITHUB_APP_PRIVATE_KEY`. Le workflow utilise un marqueur masqué comme clé
d’insertion ou de mise à jour, met à jour ce commentaire lorsque le token peut le
modifier, et crée un nouveau commentaire appartenant à Mantis lorsqu’un ancien
marqueur appartenant à un bot ne peut pas être modifié.

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

Lorsque l’exécution échoue parce que le harnais a échoué, le commentaire doit le
dire au lieu de laisser entendre que le candidat a échoué.

## Notes sur le déploiement privé

Un déploiement privé peut déjà disposer d’une application Discord Mantis.
Réutilisez cette application au lieu d’en créer une autre lorsqu’elle dispose des
bonnes autorisations de bot et peut être tournée en toute sécurité.

Définissez le canal initial de notification opérateur via des secrets ou la
configuration de déploiement. Il peut d’abord pointer vers un canal mainteneur ou
opérations existant, puis être déplacé vers un canal Mantis dédié lorsqu’il en
existe un.

Ne placez pas d’identifiants de guilde, d’identifiants de canal, de tokens de
bot, de cookies de navigateur ni de mots de passe VNC dans ce document.
Stockez-les dans les secrets GitHub, le broker d’identifiants ou le magasin de
secrets local de l’opérateur.

## Ajouter un scénario

Un scénario Mantis doit déclarer :

- id et titre
- transport
- identifiants requis
- politique de référence de base
- politique de référence candidate
- patch de configuration OpenClaw
- étapes de configuration
- stimulus
- oracle attendu pour la référence de base
- oracle attendu pour le candidat
- cibles de capture visuelle
- budget de délai d’expiration
- étapes de nettoyage

Les scénarios doivent privilégier de petits oracles typés :

- état des réactions Discord pour les bugs de réactions
- références de messages Discord pour les bugs de fils
- horodatage `ts` du fil Slack et état de l’API de réactions pour les bugs Slack
- identifiants et en-têtes de messages e-mail pour les bugs e-mail
- captures d’écran de navigateur lorsque l’UI est le seul observable fiable

Les vérifications par vision doivent être additives. Si une API de plateforme
peut prouver le bug, utilisez l’API comme oracle de réussite/échec et conservez
les captures d’écran pour la confiance humaine.

## Extension des fournisseurs

Après Discord, le même runner peut ajouter :

- Slack : réactions, fils, mentions d’application, modales, téléversements de fichiers.
- E-mail : authentification Gmail et fils de messages avec `gog` lorsque les connecteurs ne suffisent pas.
- WhatsApp : connexion par QR code, ré-identification, livraison des messages, médias, réactions.
- Telegram : contrôle des mentions de groupe, commandes, réactions lorsqu’elles sont disponibles.
- Matrix : salons chiffrés, relations de fil ou de réponse, reprise après redémarrage.

Chaque transport doit avoir un petit scénario de smoke peu coûteux et un ou
plusieurs scénarios par classe de bug. Les scénarios visuels coûteux doivent
rester optionnels.

## Questions ouvertes

- Quel bot Discord doit être le driver, et lequel doit être le SUT, lorsque le
  bot Mantis existant est réutilisé ?
- La connexion du navigateur observateur doit-elle utiliser un compte Discord
  humain, un compte de test, ou seulement des preuves REST lisibles par bot pour
  la première phase ?
- Combien de temps GitHub doit-il conserver les artefacts Mantis pour les PR ?
- Quand ClawSweeper doit-il recommander automatiquement Mantis au lieu d’attendre
  une commande d’un mainteneur ?
- Les captures d’écran doivent-elles être expurgées ou rognées avant le
  téléversement pour les PR publiques ?
