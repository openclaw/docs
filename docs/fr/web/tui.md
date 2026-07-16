---
read_when:
    - Vous souhaitez un guide pas à pas de la TUI adapté aux débutants
    - Vous avez besoin de la liste complète des fonctionnalités, commandes et raccourcis de la TUI
summary: 'Interface utilisateur de terminal (TUI) : se connecter au Gateway ou l’exécuter localement en mode intégré'
title: TUI
x-i18n:
    generated_at: "2026-07-16T13:52:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1e171520c24d95ac1d6df28227efea0a1258a0b9e59b61fe02c09a2d87b24391
    source_path: web/tui.md
    workflow: 16
---

## Démarrage rapide

### Mode Gateway

1. Démarrez le Gateway.

```bash
openclaw gateway
```

2. Ouvrez la TUI.

```bash
openclaw tui
```

3. Saisissez un message et appuyez sur Entrée.

Gateway distant :

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Utilisez `--password` si votre Gateway utilise l’authentification par mot de passe.

### Mode local

Exécutez la TUI sans Gateway :

```bash
openclaw chat
# ou
openclaw tui --local
```

- `openclaw chat` et `openclaw terminal` sont des alias de `openclaw tui --local`.
- `--local` ne peut pas être combiné avec `--url`, `--token` ou `--password`.
- Le mode local utilise directement l’environnement d’exécution intégré de l’agent. La plupart des outils locaux fonctionnent, mais les fonctionnalités réservées au Gateway ne sont pas disponibles.
- La commande `openclaw` seule (sans sous-commande) choisit automatiquement une cible : une installation non configurée lance l’intégration de l’inférence ; une configuration non valide ouvre les instructions classiques de Doctor ; un Gateway configuré et accessible ouvre cette interface TUI en mode Gateway ; sinon, un modèle local configuré l’ouvre en mode local.

## Éléments affichés

- En-tête : URL de connexion, agent actuel, session actuelle.
- Journal de discussion : messages de l’utilisateur, réponses de l’assistant, notifications système, cartes d’outils.
- Ligne d’état : état de la connexion ou de l’exécution (connexion, exécution, diffusion, inactif, erreur).
- Pied de page : agent + session + modèle + état de l’objectif + réflexion/rapide/détaillé/trace/raisonnement + nombre de jetons + livraison. Lorsque `tui.footer.showRemoteHost` est activé, les connexions à un Gateway distant affichent également l’hôte de connexion.
- Saisie : éditeur de texte avec saisie semi-automatique.

## Modèle mental : agents + sessions

- Les agents sont des identifiants uniques (par exemple `main`, `research`). Le Gateway expose la liste.
- Les sessions appartiennent à l’agent actuel.
- Les clés de session sont stockées sous la forme `agent:<agentId>:<sessionKey>`.
  - Si vous saisissez `/session main`, la TUI le développe en `agent:<currentAgent>:main`.
  - Si vous saisissez `/session agent:other:main`, vous basculez explicitement vers cette session d’agent.
- Portée de la session :
  - `per-sender` (par défaut) : chaque agent possède plusieurs sessions.
  - `global` : la TUI utilise toujours la session `global` (le sélecteur peut être vide).
- L’agent et la session actuels sont toujours visibles dans le pied de page.
- Pour afficher l’hôte du Gateway pour les connexions non locales basées sur une URL, activez cette option avec :

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  La valeur par défaut est `false`. Les connexions en boucle locale et les connexions locales intégrées n’affichent jamais d’étiquette d’hôte.

- Si la session possède un [objectif](/fr/tools/goal), le pied de page affiche son état compact :
  `Pursuing goal`, `Goal paused (/goal resume)`, `Goal blocked (/goal resume)` ou `Goal achieved`.
- Lorsqu’elle est démarrée sans `--session`, la TUI en mode Gateway reprend la dernière session sélectionnée pour le même Gateway, le même agent et la même portée de session, si cette session existe encore. Le passage de `--session`, `/session`, `/new` ou `/reset` reste explicite.

## Envoi + livraison

- Les messages sont toujours envoyés au Gateway (ou à l’environnement d’exécution intégré en mode local) ; la livraison de la réponse de l’assistant à un fournisseur de discussion constitue une étape distincte, désactivée par défaut.
- La TUI est une interface source interne, comme WebChat, et non un canal sortant générique. Les bancs d’essai qui nécessitent `tools.message` pour les réponses visibles peuvent satisfaire le tour TUI actif avec un `message.send` sans cible ; la livraison explicite au fournisseur continue d’utiliser les canaux configurés habituels et ne se rabat jamais sur `lastChannel`.
- La livraison est définie au lancement pour toute la session TUI : démarrez avec `openclaw tui --deliver` pour l’activer. Il n’existe ni commande à barre oblique `/deliver` ni interrupteur dans les paramètres permettant de la modifier en cours de session ; redémarrez la TUI pour la changer.

## Sélecteurs + superpositions

- Sélecteur de modèle : répertorie les modèles disponibles et définit le remplacement pour la session.
- Sélecteur d’agent : permet de choisir un autre agent.
- Sélecteur de session : affiche jusqu’à 50 sessions de l’agent actuel mises à jour au cours des 7 derniers jours. Utilisez `/session <key>` pour accéder à une session connue plus ancienne.
- Paramètres (`/settings`) : permettent d’afficher ou de masquer les détails des sorties d’outils et la réflexion. Ce panneau ne contrôle pas la livraison.

## Raccourcis clavier

- Entrée : envoyer le message
- Échap : interrompre l’exécution active
- Ctrl+C : effacer la saisie (appuyez deux fois pour quitter)
- Ctrl+D : quitter
- Ctrl+L : sélecteur de modèle
- Ctrl+G : sélecteur d’agent
- Ctrl+P : sélecteur de session
- Ctrl+O : afficher ou masquer les détails des sorties d’outils
- Ctrl+T : afficher ou masquer la réflexion (recharge l’historique)

## Commandes à barre oblique

Commandes principales :

- `/help`
- `/status` (transmise au Gateway ; affiche un résumé de la session et du modèle)
- `/gateway-status` (alias `/gwstatus` ; affiche directement l’état de la connexion au Gateway)
- `/agent <id>` (ou `/agents`)
- `/session <key>` (ou `/sessions`)
- `/model <provider/model>` (ou `/models`)

Contrôles de session :

- `/think <off|minimal|low|medium|high>` (les niveaux supérieurs peuvent ajouter des niveaux tels que `xhigh`/`max` selon le modèle)
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default` efface le remplacement de session)
- `/goal [status] | /goal start <objective> | /goal edit <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (alias : `/elev`)
- `/activation <mention|always>`

Cycle de vie de la session :

- `/new` (crée une nouvelle session isolée sous une nouvelle clé ; n’affecte pas les autres clients TUI de l’ancienne session)
- `/reset` (réinitialise sur place la clé de la session actuelle)
- `/abort` (interrompt l’exécution active)
- `/settings`
- `/exit` (ou `/quit`)

Mode local uniquement :

- `/auth [provider]` ouvre le flux d’authentification/de connexion du fournisseur dans la TUI.

OpenClaw :

- `/openclaw [request]` permet de revenir de la TUI normale de l’agent à la discussion de configuration/réparation [OpenClaw](#openclaw-setup-and-repair-helper), avec la possibilité de transmettre une requête.

Les autres commandes à barre oblique du Gateway (par exemple, `/context`) sont transmises au Gateway et affichées comme sortie système. Consultez [Commandes à barre oblique](/fr/tools/slash-commands).

## Commandes de shell locales

- Préfixez une ligne avec `!` pour exécuter une commande de shell locale sur l’hôte de la TUI.
- La TUI demande une fois par session l’autorisation d’exécuter des commandes locales ; en cas de refus, `!` reste désactivé pour la session.
- Les commandes s’exécutent dans un nouveau shell non interactif, dans le répertoire de travail de la TUI (sans `cd`/environnement persistant).
- Les commandes de shell locales reçoivent `OPENCLAW_SHELL=tui-local` dans leur environnement.
- Un `!` isolé est envoyé comme un message normal ; les espaces initiaux ne déclenchent pas l’exécution locale.

## Assistant de configuration et de réparation OpenClaw

OpenClaw est l’assistant de configuration/réparation de niveau zéro, exposé sous la forme `openclaw setup` après que le modèle par défaut configuré a réussi une vérification d’inférence en direct. Si l’inférence n’est pas disponible, une invocation interactive revient à l’intégration de l’inférence et l’automatisation échoue avec des instructions de réparation. Il s’exécute dans la même interface TUI locale que `openclaw tui --local`, avec un agent d’IA limité aux opérations typées d’OpenClaw soumises à approbation :

```bash
openclaw setup                       # démarrer en mode interactif
openclaw setup -m "status"           # exécuter une requête et quitter
openclaw setup -m "set default model openai/gpt-5.2" --yes   # appliquer une écriture de configuration
```

- Les écritures persistantes de configuration nécessitent une approbation : confirmez-les de manière interactive ou transmettez `--yes`.
- `--json` affiche la vue d’ensemble du démarrage au format JSON au lieu de lancer la discussion.
- Depuis OpenClaw, une requête `open-tui` (par exemple, demander à parler à un agent normal) ferme OpenClaw et ouvre la TUI habituelle de l’agent ; utilisez-y `/openclaw` pour revenir.

Utilisez le mode local lorsque la configuration actuelle est déjà valide et que vous souhaitez que l’agent intégré l’examine sur la même machine, la compare à la documentation et vous aide à corriger les divergences sans dépendre d’un Gateway en cours d’exécution.

Si `openclaw config validate` échoue déjà, commencez par `openclaw configure` ou `openclaw doctor --fix` ; `openclaw chat` nécessite toujours une configuration chargeable pour démarrer.

Boucle type :

1. Démarrez le mode local :

```bash
openclaw chat
```

2. Demandez à l’agent ce que vous souhaitez vérifier, par exemple :

```text
Comparez ma configuration d’authentification du Gateway à la documentation et suggérez la correction la plus limitée.
```

3. Utilisez des commandes de shell locales pour obtenir des éléments probants précis et effectuer la validation :

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Appliquez des modifications ciblées avec `openclaw config set` ou `openclaw configure`, puis réexécutez `!openclaw config validate`.
5. Si Doctor recommande une migration ou une réparation automatique, examinez-la, puis exécutez `!openclaw doctor --fix`.

Conseils :

- Préférez `openclaw config set` ou `openclaw configure` à la modification manuelle de `openclaw.json`.
- `openclaw docs "<query>"` effectue une recherche dans l’index de la documentation en direct depuis la même machine.
- `openclaw config validate --json` est utile pour obtenir un schéma structuré et les erreurs de SecretRef/résolution.

## Sortie des outils

- Les appels d’outils s’affichent sous forme de cartes avec leurs arguments et leurs résultats.
- Ctrl+O permet de basculer entre les vues réduite et développée.
- Pendant l’exécution des outils, les mises à jour partielles sont diffusées dans la même carte.

## Couleurs du terminal

- La TUI conserve le texte principal de l’assistant dans la couleur de premier plan par défaut de votre terminal afin que les terminaux sombres comme clairs restent lisibles.
- Si votre terminal utilise un arrière-plan clair et que la détection automatique est incorrecte, définissez `OPENCLAW_THEME=light` avant de lancer `openclaw tui`.
- Pour imposer plutôt la palette sombre d’origine, définissez `OPENCLAW_THEME=dark`.

## Historique + diffusion

- Lors de la connexion, la TUI charge l’historique le plus récent (200 messages par défaut).
- Les réponses diffusées sont mises à jour sur place jusqu’à leur finalisation.
- La TUI écoute également les événements d’outils de l’agent afin d’enrichir les cartes d’outils.

## Détails de la connexion

- La TUI se connecte avec l’identifiant client `openclaw-tui` dans le mode client général `ui` (le même mode que celui utilisé par Control UI et WebChat pour la politique du Gateway).
- Les reconnexions affichent un message système ; les interruptions dans les événements sont signalées dans le journal.

## Options

- `--local` : exécuter avec l’environnement d’exécution local intégré de l’agent
- `--url <url>` : URL WebSocket du Gateway (utilise par défaut `gateway.remote.url` depuis la configuration, ou `ws://127.0.0.1:<port>` sur l’interface de bouclage)
- `--token <token>` : jeton du Gateway (si requis)
- `--password <password>` : mot de passe du Gateway (si requis)
- `--tls-fingerprint <sha256>` : empreinte attendue du certificat TLS pour un Gateway `wss://` épinglé
- `--session <key>` : clé de session (par défaut : `main`, ou `global` lorsque la portée est globale)
- `--deliver` : transmettre les réponses de l’assistant au fournisseur (désactivé par défaut)
- `--thinking <level>` : remplacer le niveau de raisonnement pour les envois
- `--message <text>` : envoyer un message initial après la connexion
- `--timeout-ms <ms>` : délai d’expiration de l’agent en ms (par défaut : `agents.defaults.timeoutSeconds`)
- `--history-limit <n>` : entrées d’historique à charger (par défaut : `200`)

<Warning>
Lorsque vous définissez `--url`, la TUI ne se rabat pas sur les identifiants de la configuration ou de l’environnement. Transmettez explicitement `--token` ou `--password`, ainsi que `--tls-fingerprint` lorsque la cible utilise un certificat épinglé. L’absence d’identifiants explicites constitue une erreur. En mode local, ne transmettez pas `--url`, `--token`, `--password` ni `--tls-fingerprint`.
</Warning>

## Dépannage

Aucune sortie après l’envoi d’un message :

- Exécutez `/status` dans la TUI pour vérifier que le Gateway est connecté et inactif ou occupé.
- Consultez les journaux du Gateway : `openclaw logs --follow`.
- Vérifiez que l’agent peut s’exécuter : `openclaw status` et `openclaw models status`.
- Si vous attendez des messages dans un canal de discussion, vérifiez que la TUI a été démarrée avec `--deliver` (cette option ne peut pas être activée ultérieurement sans redémarrage).

## Dépannage de la connexion

- `disconnected` : vérifiez que le Gateway est en cours d’exécution et que vos `--url/--token/--password` sont corrects.
- Aucun agent dans le sélecteur : vérifiez `openclaw agents list` et votre configuration de routage.
- Sélecteur de session vide : vous vous trouvez peut-être dans la portée globale ou ne disposez encore d’aucune session.

## Voir aussi

- [Interface de contrôle](/fr/web/control-ui) — interface de contrôle web
- [Configuration](/fr/cli/config) — inspecter, valider et modifier `openclaw.json`
- [Diagnostic](/fr/cli/doctor) — vérifications guidées de réparation et de migration
- [Référence de la CLI](/fr/cli) — référence complète des commandes de la CLI
