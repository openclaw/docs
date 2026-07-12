---
read_when:
    - Vous souhaitez un guide pas à pas de la TUI adapté aux débutants
    - Vous avez besoin de la liste complète des fonctionnalités, commandes et raccourcis de la TUI
summary: 'Interface utilisateur de terminal (TUI) : connexion au Gateway ou exécution locale en mode intégré'
title: TUI
x-i18n:
    generated_at: "2026-07-12T03:12:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d7181ea88643a129532f698908fd3dd3d93078b7e33b0ab1166dcfca2ecc2abd
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

Utilisez `--password` si votre Gateway utilise une authentification par mot de passe.

### Mode local

Exécutez la TUI sans Gateway :

```bash
openclaw chat
# ou
openclaw tui --local
```

- `openclaw chat` et `openclaw terminal` sont des alias de `openclaw tui --local`.
- `--local` ne peut pas être combiné avec `--url`, `--token` ou `--password`.
- Le mode local utilise directement l'environnement d'exécution intégré de l'agent. La plupart des outils locaux fonctionnent, mais les fonctionnalités réservées au Gateway sont indisponibles.
- La commande `openclaw` seule (sans sous-commande) choisit automatiquement une cible : une installation non configurée lance l'intégration de l'inférence ; une configuration non valide ouvre les instructions classiques de Doctor ; un Gateway configuré et accessible ouvre cette interface TUI en mode Gateway ; sinon, un modèle local configuré l'ouvre en mode local.

## Éléments affichés

- En-tête : URL de connexion, agent actuel, session actuelle.
- Journal de discussion : messages de l'utilisateur, réponses de l'assistant, notifications système, cartes d'outils.
- Ligne d'état : état de la connexion ou de l'exécution (connexion, exécution, diffusion en continu, inactivité, erreur).
- Pied de page : agent + session + modèle + état de l'objectif + réflexion/rapide/détaillé/traçage/raisonnement + nombre de jetons + livraison. Lorsque `tui.footer.showRemoteHost` est activé, les connexions à un Gateway distant affichent également l'hôte de connexion.
- Saisie : éditeur de texte avec saisie semi-automatique.

## Modèle conceptuel : agents + sessions

- Les agents sont des identifiants uniques (par exemple `main`, `research`). Le Gateway en expose la liste.
- Les sessions appartiennent à l'agent actuel.
- Les clés de session sont stockées sous la forme `agent:<agentId>:<sessionKey>`.
  - Si vous saisissez `/session main`, la TUI la développe en `agent:<currentAgent>:main`.
  - Si vous saisissez `/session agent:other:main`, vous basculez explicitement vers cette session d'agent.
- Portée des sessions :
  - `per-sender` (par défaut) : chaque agent possède plusieurs sessions.
  - `global` : la TUI utilise toujours la session `global` (le sélecteur peut être vide).
- L'agent et la session actuels sont toujours visibles dans le pied de page.
- Pour afficher l'hôte du Gateway pour les connexions non locales reposant sur une URL, activez cette option avec :

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  La valeur par défaut est `false`. Les connexions local loopback et locales intégrées n'affichent jamais de libellé d'hôte.

- Si la session comporte un [objectif](/fr/tools/goal), le pied de page affiche son état compact :
  `Objectif en cours`, `Objectif en pause (/goal resume)`, `Objectif bloqué (/goal resume)` ou `Objectif atteint`.
- Lorsqu'elle est lancée sans `--session`, la TUI en mode Gateway reprend la dernière session sélectionnée pour le même Gateway, le même agent et la même portée de session, si cette session existe encore. L'utilisation de `--session`, `/session`, `/new` ou `/reset` reste explicite.

## Envoi + livraison

- Les messages sont toujours envoyés au Gateway (ou à l'environnement d'exécution intégré en mode local) ; la livraison de la réponse de l'assistant à un fournisseur de discussion constitue une étape distincte, désactivée par défaut.
- La TUI est une surface source interne, comme WebChat, et non un canal sortant générique. Les environnements qui exigent `tools.message` pour les réponses visibles peuvent satisfaire le tour actif de la TUI avec un `message.send` sans cible ; la livraison explicite par le fournisseur continue d'utiliser les canaux normalement configurés et ne revient jamais à `lastChannel`.
- La livraison est définie au lancement pour toute la session TUI : démarrez avec `openclaw tui --deliver` pour l'activer. Il n'existe aucune commande oblique `/deliver` ni aucun bouton dans les paramètres permettant de la modifier en cours de session ; redémarrez la TUI pour la changer.

## Sélecteurs + superpositions

- Sélecteur de modèle : répertorie les modèles disponibles et définit le remplacement pour la session.
- Sélecteur d'agent : permet de choisir un autre agent.
- Sélecteur de session : affiche jusqu'à 50 sessions de l'agent actuel mises à jour au cours des 7 derniers jours. Utilisez `/session <key>` pour accéder à une ancienne session connue.
- Paramètres (`/settings`) : permettent d'activer ou de désactiver le développement de la sortie des outils et la visibilité de la réflexion. Ce panneau ne contrôle pas la livraison.

## Raccourcis clavier

- Entrée : envoyer le message
- Échap : interrompre l'exécution active
- Ctrl+C : effacer la saisie (appuyez deux fois pour quitter)
- Ctrl+D : quitter
- Ctrl+L : sélecteur de modèle
- Ctrl+G : sélecteur d'agent
- Ctrl+P : sélecteur de session
- Ctrl+O : développer ou réduire la sortie des outils
- Ctrl+T : afficher ou masquer la réflexion (recharge l'historique)

## Commandes obliques

Commandes principales :

- `/help`
- `/status` (transmise au Gateway ; affiche un résumé de la session et du modèle)
- `/gateway-status` (alias `/gwstatus` ; affiche directement l'état de la connexion au Gateway)
- `/agent <id>` (ou `/agents`)
- `/session <key>` (ou `/sessions`)
- `/model <provider/model>` (ou `/models`)

Contrôles de session :

- `/think <off|minimal|low|medium|high>` (les niveaux supérieurs peuvent ajouter des niveaux comme `xhigh`/`max` selon le modèle)
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default` supprime le remplacement de la session)
- `/goal [status] | /goal start <objective> | /goal edit <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (alias : `/elev`)
- `/activation <mention|always>`

Cycle de vie de la session :

- `/new` (crée une nouvelle session isolée sous une nouvelle clé ; n'affecte pas les autres clients TUI utilisant l'ancienne session)
- `/reset` (réinitialise sur place la clé de la session actuelle)
- `/abort` (interrompt l'exécution active)
- `/settings`
- `/exit` (ou `/quit`)

Mode local uniquement :

- `/auth [provider]` ouvre le processus d'authentification ou de connexion du fournisseur dans la TUI.

Crestodian :

- `/crestodian [request]` permet de quitter la TUI normale de l'agent pour revenir à la discussion de configuration et de réparation de [Crestodian](#crestodian-setup-and-repair-helper), en transmettant éventuellement une requête.

Les autres commandes obliques du Gateway (par exemple `/context`) sont transmises au Gateway et affichées comme sortie système. Consultez [Commandes obliques](/fr/tools/slash-commands).

## Commandes shell locales

- Préfixez une ligne par `!` pour exécuter une commande shell locale sur l'hôte de la TUI.
- La TUI demande une fois par session l'autorisation d'exécuter des commandes locales ; en cas de refus, `!` reste désactivé pour la session.
- Les commandes s'exécutent dans un nouveau shell non interactif, depuis le répertoire de travail de la TUI (sans persistance de `cd` ni des variables d'environnement).
- Les commandes shell locales reçoivent `OPENCLAW_SHELL=tui-local` dans leur environnement.
- Un `!` seul est envoyé comme un message normal ; les espaces initiaux ne déclenchent pas l'exécution locale.

## Assistant de configuration et de réparation Crestodian

Crestodian est l'assistant de configuration et de réparation de niveau zéro, exposé sous la forme `openclaw crestodian` après la réussite d'une vérification d'inférence en direct par le modèle par défaut configuré. Si l'inférence est indisponible, un appel interactif revient à l'intégration de l'inférence et l'automatisation échoue en fournissant des instructions de réparation. Il s'exécute dans la même interface TUI locale que `openclaw tui --local`, avec un agent d'IA limité aux opérations typées de Crestodian et soumises à approbation :

```bash
openclaw crestodian                       # démarrer en mode interactif
openclaw crestodian -m "status"           # exécuter une requête et quitter
openclaw crestodian -m "set default model openai/gpt-5.2" --yes   # appliquer une écriture de configuration
```

- Les écritures persistantes dans la configuration nécessitent une approbation : confirmez-les de manière interactive ou transmettez `--yes`.
- `--json` affiche la vue d'ensemble du démarrage au format JSON au lieu de lancer la discussion.
- Depuis Crestodian, une requête `open-tui` (par exemple, pour demander à parler à un agent normal) ferme Crestodian et ouvre la TUI normale de l'agent ; utilisez-y `/crestodian` pour revenir.

Utilisez le mode local lorsque la configuration actuelle est déjà valide et que vous souhaitez que l'agent intégré l'inspecte sur la même machine, la compare à la documentation et vous aide à corriger les divergences sans dépendre d'un Gateway en cours d'exécution.

Si `openclaw config validate` échoue déjà, commencez par `openclaw configure` ou `openclaw doctor --fix` ; `openclaw chat` nécessite toujours une configuration chargeable pour démarrer.

Boucle type :

1. Démarrez le mode local :

```bash
openclaw chat
```

2. Demandez à l'agent ce que vous souhaitez vérifier, par exemple :

```text
Compare ma configuration d'authentification du Gateway à la documentation et propose la correction la plus limitée.
```

3. Utilisez les commandes shell locales pour obtenir des preuves exactes et effectuer la validation :

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Appliquez des modifications ciblées avec `openclaw config set` ou `openclaw configure`, puis réexécutez `!openclaw config validate`.
5. Si Doctor recommande une migration ou une réparation automatique, examinez-la et exécutez `!openclaw doctor --fix`.

Conseils :

- Préférez `openclaw config set` ou `openclaw configure` à la modification manuelle de `openclaw.json`.
- `openclaw docs "<query>"` effectue une recherche dans l'index de la documentation en direct depuis la même machine.
- `openclaw config validate --json` est utile pour obtenir des erreurs structurées de schéma, de SecretRef et de possibilité de résolution.

## Sortie des outils

- Les appels d'outils s'affichent sous forme de cartes avec leurs arguments et leurs résultats.
- Ctrl+O bascule entre les vues réduite et développée.
- Pendant l'exécution des outils, les mises à jour partielles sont diffusées dans la même carte.

## Couleurs du terminal

- La TUI conserve le texte principal de l'assistant dans la couleur de premier plan par défaut de votre terminal afin qu'il reste lisible sur les terminaux clairs comme sombres.
- Si votre terminal utilise un arrière-plan clair et que la détection automatique est incorrecte, définissez `OPENCLAW_THEME=light` avant de lancer `openclaw tui`.
- Pour imposer à la place la palette sombre d'origine, définissez `OPENCLAW_THEME=dark`.

## Historique + diffusion en continu

- Lors de la connexion, la TUI charge l'historique le plus récent (200 messages par défaut).
- Les réponses diffusées en continu sont mises à jour sur place jusqu'à leur finalisation.
- La TUI écoute également les événements des outils de l'agent afin d'afficher des cartes d'outils plus détaillées.

## Détails de la connexion

- La TUI se connecte avec l'identifiant client `openclaw-tui` dans le mode client général `ui` (le même mode que Control UI et WebChat utilisent pour la politique du Gateway).
- Les reconnexions affichent un message système ; les interruptions d'événements sont signalées dans le journal.

## Options

- `--local` : exécuter avec l'environnement d'exécution local intégré de l'agent
- `--url <url>` : URL WebSocket du Gateway (valeur par défaut : `gateway.remote.url` dans la configuration, ou `ws://127.0.0.1:<port>` sur local loopback)
- `--token <token>` : jeton du Gateway (si nécessaire)
- `--password <password>` : mot de passe du Gateway (si nécessaire)
- `--tls-fingerprint <sha256>` : empreinte attendue du certificat TLS pour un Gateway `wss://` épinglé
- `--session <key>` : clé de session (valeur par défaut : `main`, ou `global` lorsque la portée est globale)
- `--deliver` : livrer les réponses de l'assistant au fournisseur (désactivé par défaut)
- `--thinking <level>` : remplacer le niveau de réflexion pour les envois
- `--message <text>` : envoyer un message initial après la connexion
- `--timeout-ms <ms>` : délai d'expiration de l'agent en ms (valeur par défaut : `agents.defaults.timeoutSeconds`)
- `--history-limit <n>` : nombre d'entrées d'historique à charger (valeur par défaut : `200`)

<Warning>
Lorsque vous définissez `--url`, la TUI ne se rabat pas sur les identifiants de la configuration ou de l'environnement. Transmettez explicitement `--token` ou `--password`, ainsi que `--tls-fingerprint` lorsque la cible utilise un certificat épinglé. L'absence d'identifiants explicites constitue une erreur. En mode local, ne transmettez pas `--url`, `--token`, `--password` ni `--tls-fingerprint`.
</Warning>

## Dépannage

Aucune sortie après l'envoi d'un message :

- Exécutez `/status` dans la TUI pour confirmer que le Gateway est connecté et inactif ou occupé.
- Consultez les journaux du Gateway : `openclaw logs --follow`.
- Vérifiez que l'agent peut s'exécuter : `openclaw status` et `openclaw models status`.
- Si vous attendez des messages dans un canal de discussion, vérifiez que la TUI a été démarrée avec `--deliver` (cette option ne peut pas être activée ultérieurement sans redémarrage).

## Dépannage de la connexion

- `disconnected` : vérifiez que le Gateway est en cours d'exécution et que vos `--url/--token/--password` sont corrects.
- Aucun agent dans le sélecteur : vérifiez `openclaw agents list` et votre configuration de routage.
- Sélecteur de session vide : vous êtes peut-être dans la portée globale ou ne disposez encore d'aucune session.

## Voir aussi

- [Control UI](/fr/web/control-ui) — interface de contrôle web
- [Configuration](/fr/cli/config) — inspecter, valider et modifier `openclaw.json`
- [Doctor](/fr/cli/doctor) — vérifications guidées de réparation et de migration
- [Référence de la CLI](/fr/cli) — référence complète des commandes de la CLI
