---
read_when:
    - Vous voulez une présentation pas à pas du TUI adaptée aux débutants
    - Vous avez besoin de la liste complète des fonctionnalités, commandes et raccourcis du TUI
summary: 'Interface utilisateur de terminal (TUI) : se connecter au Gateway ou s’exécuter localement en mode intégré'
title: TUI
x-i18n:
    generated_at: "2026-06-27T18:23:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed02875ea5dcb8cef987d16fe11701eba11160525caf9791f74c610b1b6bec6e
    source_path: web/tui.md
    workflow: 16
---

## Démarrage rapide

### Mode Gateway

1. Démarrez le Gateway.

```bash
openclaw gateway
```

2. Ouvrez le TUI.

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

Exécutez le TUI sans Gateway :

```bash
openclaw chat
# or
openclaw tui --local
```

Remarques :

- `openclaw chat` et `openclaw terminal` sont des alias de `openclaw tui --local`.
- `--local` ne peut pas être combiné avec `--url`, `--token` ou `--password`.
- Le mode local utilise directement le runtime d’agent intégré. La plupart des outils locaux fonctionnent, mais les fonctionnalités propres au Gateway ne sont pas disponibles.
- Une fois qu’un fichier de configuration contient des paramètres définis, `openclaw` et `openclaw crestodian` utilisent également ce shell TUI, avec Crestodian comme backend de chat local pour la configuration et la réparation.

## Ce que vous voyez

- En-tête : URL de connexion, agent actuel, session actuelle.
- Journal de chat : messages utilisateur, réponses de l’assistant, notifications système, cartes d’outils.
- Ligne d’état : état de connexion/d’exécution (connexion, exécution, streaming, inactif, erreur).
- Pied de page : agent + session + modèle + état de l’objectif + think/fast/verbose/trace/reasoning + nombres de jetons + livraison. Lorsque `tui.footer.showRemoteHost` est activé, les connexions Gateway distantes affichent aussi l’hôte de connexion.
- Entrée : éditeur de texte avec autocomplétion.

## Modèle mental : agents + sessions

- Les agents sont des slugs uniques (par exemple `main`, `research`). Le Gateway expose la liste.
- Les sessions appartiennent à l’agent actuel.
- Les clés de session sont stockées sous la forme `agent:<agentId>:<sessionKey>`.
  - Si vous saisissez `/session main`, le TUI le développe en `agent:<currentAgent>:main`.
  - Si vous saisissez `/session agent:other:main`, vous basculez explicitement vers cette session d’agent.
- Portée de session :
  - `per-sender` (par défaut) : chaque agent a plusieurs sessions.
  - `global` : le TUI utilise toujours la session `global` (le sélecteur peut être vide).
- L’agent et la session actuels sont toujours visibles dans le pied de page.
- Pour afficher l’hôte Gateway des connexions adossées à une URL non locales, activez l’option avec :

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  Les connexions en boucle locale et locales intégrées n’affichent jamais de libellé d’hôte.

- Si la session a un [objectif](/fr/tools/goal), le pied de page affiche son état compact,
  par exemple `Pursuing goal`, `Goal paused (/goal resume)` ou
  `Goal achieved`.
- Lorsqu’il est lancé sans `--session`, le TUI en mode Gateway reprend la dernière session sélectionnée pour le même Gateway, le même agent et la même portée de session si cette session existe encore. Passer `--session`, `/session`, `/new` ou `/reset` reste explicite.

## Envoi + livraison

- Les messages sont envoyés au Gateway ; la livraison aux fournisseurs est désactivée par défaut.
- Le TUI est une surface source interne comme WebChat, pas un canal sortant générique. Les harnais qui nécessitent `tools.message` pour les réponses visibles peuvent satisfaire le tour TUI actif avec un `message.send` sans cible ; la livraison explicite au fournisseur utilise toujours les canaux configurés normaux et ne revient jamais à `lastChannel`.
- Activer la livraison :
  - `/deliver on`
  - ou le panneau Paramètres
  - ou lancer avec `openclaw tui --deliver`

## Sélecteurs + superpositions

- Sélecteur de modèle : liste les modèles disponibles et définit la substitution de session.
- Sélecteur d’agent : choisir un autre agent.
- Sélecteur de session : affiche jusqu’à 50 sessions de l’agent actuel mises à jour au cours des 7 derniers jours. Utilisez `/session <key>` pour accéder à une session connue plus ancienne.
- Paramètres : basculer la livraison, le développement de la sortie des outils et la visibilité de la réflexion.

## Raccourcis clavier

- Entrée : envoyer le message
- Échap : abandonner l’exécution active
- Ctrl+C : effacer l’entrée (appuyez deux fois pour quitter)
- Ctrl+D : quitter
- Ctrl+L : sélecteur de modèle
- Ctrl+G : sélecteur d’agent
- Ctrl+P : sélecteur de session
- Ctrl+O : basculer le développement de la sortie des outils
- Ctrl+T : basculer la visibilité de la réflexion (recharge l’historique)

## Commandes slash

Noyau :

- `/help`
- `/status`
- `/agent <id>` (ou `/agents`)
- `/session <key>` (ou `/sessions`)
- `/model <provider/model>` (ou `/models`)

Contrôles de session :

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default` efface la substitution de session)
- `/goal [status] | /goal start <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (alias : `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Cycle de vie de session :

- `/new` ou `/reset` (réinitialiser la session)
- `/abort` (abandonner l’exécution active)
- `/settings`
- `/exit`

Mode local uniquement :

- `/auth [provider]` ouvre le flux d’authentification/de connexion du fournisseur dans le TUI.

Les autres commandes slash Gateway (par exemple, `/context`) sont transmises au Gateway et affichées comme sortie système. Consultez [Commandes slash](/fr/tools/slash-commands).

## Commandes shell locales

- Préfixez une ligne avec `!` pour exécuter une commande shell locale sur l’hôte TUI.
- Le TUI demande une fois par session d’autoriser l’exécution locale ; refuser garde `!` désactivé pour la session.
- Les commandes s’exécutent dans un nouveau shell non interactif dans le répertoire de travail du TUI (pas de `cd`/env persistant).
- Les commandes shell locales reçoivent `OPENCLAW_SHELL=tui-local` dans leur environnement.
- Un `!` seul est envoyé comme message normal ; les espaces initiaux ne déclenchent pas l’exécution locale.

## Réparer des configurations depuis le TUI local

Utilisez le mode local lorsque la configuration actuelle est déjà valide et que vous voulez que
l’agent intégré l’inspecte sur la même machine, la compare à la documentation
et aide à réparer la dérive sans dépendre d’un Gateway en cours d’exécution.

Si `openclaw config validate` échoue déjà, commencez par `openclaw configure`
ou `openclaw doctor --fix`. `openclaw chat` ne contourne pas la garde de
configuration invalide.

Boucle typique :

1. Lancez le mode local :

```bash
openclaw chat
```

2. Demandez à l’agent ce que vous voulez vérifier, par exemple :

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. Utilisez les commandes shell locales pour des preuves exactes et la validation :

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Appliquez des changements ciblés avec `openclaw config set` ou `openclaw configure`, puis relancez `!openclaw config validate`.
5. Si Doctor recommande une migration ou une réparation automatique, examinez-la et exécutez `!openclaw doctor --fix`.

Conseils :

- Préférez `openclaw config set` ou `openclaw configure` à la modification manuelle de `openclaw.json`.
- `openclaw docs "<query>"` recherche dans l’index de documentation actif depuis la même machine.
- `openclaw config validate --json` est utile lorsque vous voulez des erreurs structurées de schéma et de SecretRef/résolvabilité.

## Sortie des outils

- Les appels d’outils s’affichent sous forme de cartes avec arguments + résultats.
- Ctrl+O bascule entre les vues réduite/développée.
- Pendant l’exécution des outils, les mises à jour partielles sont diffusées dans la même carte.

## Couleurs du terminal

- Le TUI conserve le texte du corps de l’assistant dans la couleur de premier plan par défaut de votre terminal, afin que les terminaux sombres et clairs restent tous deux lisibles.
- Si votre terminal utilise un arrière-plan clair et que la détection automatique est incorrecte, définissez `OPENCLAW_THEME=light` avant de lancer `openclaw tui`.
- Pour forcer plutôt la palette sombre d’origine, définissez `OPENCLAW_THEME=dark`.

## Historique + streaming

- À la connexion, le TUI charge le dernier historique (200 messages par défaut).
- Les réponses en streaming se mettent à jour sur place jusqu’à leur finalisation.
- Le TUI écoute aussi les événements d’outils de l’agent pour des cartes d’outils plus riches.

## Détails de connexion

- Le TUI s’enregistre auprès du Gateway avec `mode: "tui"`.
- Les reconnexions affichent un message système ; les interruptions d’événements sont signalées dans le journal.

## Options

- `--local` : exécuter avec le runtime d’agent local intégré
- `--url <url>` : URL WebSocket du Gateway (par défaut, la configuration ou `ws://127.0.0.1:<port>`)
- `--token <token>` : jeton Gateway (si requis)
- `--password <password>` : mot de passe Gateway (si requis)
- `--session <key>` : clé de session (par défaut : `main`, ou `global` lorsque la portée est globale)
- `--deliver` : livrer les réponses de l’assistant au fournisseur (désactivé par défaut)
- `--thinking <level>` : remplacer le niveau de réflexion pour les envois
- `--message <text>` : envoyer un message initial après la connexion
- `--timeout-ms <ms>` : délai d’expiration de l’agent en ms (par défaut, `agents.defaults.timeoutSeconds`)
- `--history-limit <n>` : entrées d’historique à charger (`200` par défaut)

<Warning>
Lorsque vous définissez `--url`, le TUI ne revient pas aux identifiants de configuration ou d’environnement. Passez explicitement `--token` ou `--password`. L’absence d’identifiants explicites est une erreur. En mode local, ne passez pas `--url`, `--token` ou `--password`.
</Warning>

## Dépannage

Aucune sortie après l’envoi d’un message :

- Exécutez `/status` dans le TUI pour confirmer que le Gateway est connecté et inactif/occupé.
- Vérifiez les journaux du Gateway : `openclaw logs --follow`.
- Confirmez que l’agent peut s’exécuter : `openclaw status` et `openclaw models status`.
- Si vous attendez des messages dans un canal de chat, activez la livraison (`/deliver on` ou `--deliver`).

## Dépannage de connexion

- `disconnected` : assurez-vous que le Gateway est en cours d’exécution et que vos `--url/--token/--password` sont corrects.
- Aucun agent dans le sélecteur : vérifiez `openclaw agents list` et votre configuration de routage.
- Sélecteur de session vide : vous êtes peut-être en portée globale ou vous n’avez pas encore de sessions.

## Connexe

- [Control UI](/fr/web/control-ui) — interface de contrôle web
- [Config](/fr/cli/config) — inspecter, valider et modifier `openclaw.json`
- [Doctor](/fr/cli/doctor) — vérifications guidées de réparation et de migration
- [Référence CLI](/fr/cli) — référence complète des commandes CLI
