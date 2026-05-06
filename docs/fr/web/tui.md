---
read_when:
    - Vous voulez un guide pas à pas de la TUI adapté aux débutants
    - Vous avez besoin de la liste complète des fonctionnalités, commandes et raccourcis de la TUI
summary: 'Interface terminal (TUI) : connectez-vous au Gateway ou exécutez localement en mode intégré'
title: TUI
x-i18n:
    generated_at: "2026-05-06T07:43:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b517ff434cc440aeffd8698df75d4d85c22a19e59b38a1f2383e58e1b4084ff
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

Utilisez `--password` si votre Gateway utilise l’authentification par mot de passe.

### Mode local

Exécutez le TUI sans Gateway :

```bash
openclaw chat
# or
openclaw tui --local
```

Notes :

- `openclaw chat` et `openclaw terminal` sont des alias de `openclaw tui --local`.
- `--local` ne peut pas être combiné avec `--url`, `--token` ou `--password`.
- Le mode local utilise directement le runtime d’agent intégré. La plupart des outils locaux fonctionnent, mais les fonctionnalités propres au Gateway ne sont pas disponibles.
- `openclaw` et `openclaw crestodian` utilisent également ce shell TUI, avec Crestodian comme backend de chat local pour la configuration et la réparation.

## Ce que vous voyez

- En-tête : URL de connexion, agent actuel, session actuelle.
- Journal de chat : messages utilisateur, réponses de l’assistant, notifications système, cartes d’outils.
- Ligne d’état : état de la connexion/de l’exécution (connexion, exécution, streaming, inactif, erreur).
- Pied de page : état de connexion + agent + session + modèle + think/fast/verbose/trace/reasoning + décomptes de jetons + deliver.
- Saisie : éditeur de texte avec autocomplétion.

## Modèle mental : agents + sessions

- Les agents sont des slugs uniques (par exemple `main`, `research`). Le Gateway expose la liste.
- Les sessions appartiennent à l’agent actuel.
- Les clés de session sont stockées sous la forme `agent:<agentId>:<sessionKey>`.
  - Si vous saisissez `/session main`, le TUI l’étend en `agent:<currentAgent>:main`.
  - Si vous saisissez `/session agent:other:main`, vous basculez explicitement vers cette session d’agent.
- Portée de session :
  - `per-sender` (par défaut) : chaque agent a plusieurs sessions.
  - `global` : le TUI utilise toujours la session `global` (le sélecteur peut être vide).
- L’agent + la session actuels sont toujours visibles dans le pied de page.
- Lorsqu’il est démarré sans `--session`, le TUI en mode Gateway reprend la dernière session sélectionnée pour le même gateway, le même agent et la même portée de session si cette session existe encore. L’utilisation de `--session`, `/session`, `/new` ou `/reset` reste explicite.

## Envoi + livraison

- Les messages sont envoyés au Gateway ; la livraison aux fournisseurs est désactivée par défaut.
- Activer la livraison :
  - `/deliver on`
  - ou le panneau Paramètres
  - ou démarrer avec `openclaw tui --deliver`

## Sélecteurs + superpositions

- Sélecteur de modèle : liste les modèles disponibles et définit la substitution de session.
- Sélecteur d’agent : choisissez un autre agent.
- Sélecteur de session : affiche jusqu’à 50 sessions pour l’agent actuel mises à jour au cours des 7 derniers jours. Utilisez `/session <key>` pour accéder à une session plus ancienne connue.
- Paramètres : activez/désactivez la livraison, l’expansion de la sortie d’outil et la visibilité de la réflexion.

## Raccourcis clavier

- Entrée : envoyer le message
- Échap : interrompre l’exécution active
- Ctrl+C : effacer la saisie (appuyer deux fois pour quitter)
- Ctrl+D : quitter
- Ctrl+L : sélecteur de modèle
- Ctrl+G : sélecteur d’agent
- Ctrl+P : sélecteur de session
- Ctrl+O : activer/désactiver l’expansion de la sortie d’outil
- Ctrl+T : activer/désactiver la visibilité de la réflexion (recharge l’historique)

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
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (alias : `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Cycle de vie de session :

- `/new` ou `/reset` (réinitialiser la session)
- `/abort` (interrompre l’exécution active)
- `/settings`
- `/exit`

Mode local uniquement :

- `/auth [provider]` ouvre le flux d’authentification/de connexion du fournisseur dans le TUI.

Les autres commandes slash du Gateway (par exemple, `/context`) sont transmises au Gateway et affichées comme sortie système. Voir [Commandes slash](/fr/tools/slash-commands).

## Commandes de shell local

- Préfixez une ligne avec `!` pour exécuter une commande de shell locale sur l’hôte du TUI.
- Le TUI demande une fois par session l’autorisation d’exécuter localement ; refuser laisse `!` désactivé pour la session.
- Les commandes s’exécutent dans un nouveau shell non interactif dans le répertoire de travail du TUI (pas de `cd`/env persistant).
- Les commandes de shell locales reçoivent `OPENCLAW_SHELL=tui-local` dans leur environnement.
- Un `!` seul est envoyé comme message normal ; les espaces initiaux ne déclenchent pas l’exécution locale.

## Réparer les configurations depuis le TUI local

Utilisez le mode local lorsque la configuration actuelle est déjà valide et que vous voulez que
l’agent intégré l’inspecte sur la même machine, la compare à la documentation
et aide à corriger les écarts sans dépendre d’un Gateway en cours d’exécution.

Si `openclaw config validate` échoue déjà, commencez par `openclaw configure`
ou `openclaw doctor --fix`. `openclaw chat` ne contourne pas la protection de
configuration invalide.

Boucle typique :

1. Démarrez le mode local :

```bash
openclaw chat
```

2. Demandez à l’agent ce que vous voulez vérifier, par exemple :

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. Utilisez des commandes de shell locales pour obtenir des preuves exactes et valider :

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Appliquez des modifications ciblées avec `openclaw config set` ou `openclaw configure`, puis réexécutez `!openclaw config validate`.
5. Si Doctor recommande une migration ou une réparation automatique, examinez-la et exécutez `!openclaw doctor --fix`.

Conseils :

- Préférez `openclaw config set` ou `openclaw configure` à l’édition manuelle de `openclaw.json`.
- `openclaw docs "<query>"` recherche dans l’index de documentation en direct depuis la même machine.
- `openclaw config validate --json` est utile lorsque vous voulez des erreurs structurées de schéma et de SecretRef/résolvabilité.

## Sortie d’outil

- Les appels d’outils s’affichent comme des cartes avec arguments + résultats.
- Ctrl+O bascule entre les vues réduite/étendue.
- Pendant l’exécution des outils, les mises à jour partielles sont diffusées dans la même carte.

## Couleurs du terminal

- Le TUI conserve le texte du corps de l’assistant dans la couleur de premier plan par défaut de votre terminal afin que les terminaux sombres et clairs restent lisibles.
- Si votre terminal utilise un arrière-plan clair et que la détection automatique est incorrecte, définissez `OPENCLAW_THEME=light` avant de lancer `openclaw tui`.
- Pour forcer à la place la palette sombre d’origine, définissez `OPENCLAW_THEME=dark`.

## Historique + streaming

- À la connexion, le TUI charge l’historique le plus récent (200 messages par défaut).
- Les réponses en streaming sont mises à jour sur place jusqu’à leur finalisation.
- Le TUI écoute également les événements d’outils de l’agent pour des cartes d’outils plus riches.

## Détails de connexion

- Le TUI s’enregistre auprès du Gateway avec `mode: "tui"`.
- Les reconnexions affichent un message système ; les interruptions d’événements sont signalées dans le journal.

## Options

- `--local` : exécuter avec le runtime d’agent intégré local
- `--url <url>` : URL WebSocket du Gateway (par défaut, depuis la configuration ou `ws://127.0.0.1:<port>`)
- `--token <token>` : jeton du Gateway (si requis)
- `--password <password>` : mot de passe du Gateway (si requis)
- `--session <key>` : clé de session (par défaut : `main`, ou `global` lorsque la portée est globale)
- `--deliver` : livrer les réponses de l’assistant au fournisseur (désactivé par défaut)
- `--thinking <level>` : remplacer le niveau de réflexion pour les envois
- `--message <text>` : envoyer un message initial après la connexion
- `--timeout-ms <ms>` : délai d’expiration de l’agent en ms (par défaut : `agents.defaults.timeoutSeconds`)
- `--history-limit <n>` : entrées d’historique à charger (`200` par défaut)

<Warning>
Lorsque vous définissez `--url`, le TUI ne revient pas aux identifiants de configuration ou d’environnement. Passez `--token` ou `--password` explicitement. L’absence d’identifiants explicites est une erreur. En mode local, ne passez pas `--url`, `--token` ni `--password`.
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
- Sélecteur de session vide : vous êtes peut-être dans la portée globale ou vous n’avez pas encore de sessions.

## Connexe

- [Interface de contrôle](/fr/web/control-ui) — interface de contrôle basée sur le web
- [Configuration](/fr/cli/config) — inspecter, valider et modifier `openclaw.json`
- [Doctor](/fr/cli/doctor) — vérifications guidées de réparation et de migration
- [Référence CLI](/fr/cli) — référence complète des commandes CLI
