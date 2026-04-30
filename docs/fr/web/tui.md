---
read_when:
    - Vous voulez un guide pas à pas du TUI adapté aux débutants
    - Vous avez besoin de la liste complète des fonctionnalités, commandes et raccourcis de la TUI
summary: 'Interface utilisateur de terminal (TUI) : se connecter au Gateway ou exécuter localement en mode intégré'
title: TUI
x-i18n:
    generated_at: "2026-04-30T07:55:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5caca4b3f4df02ce1226a8ed0d759023464e5b0752b9cd1b7922b20099d58df1
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
# or
openclaw tui --local
```

Remarques :

- `openclaw chat` et `openclaw terminal` sont des alias pour `openclaw tui --local`.
- `--local` ne peut pas être combiné avec `--url`, `--token` ou `--password`.
- Le mode local utilise directement l’environnement d’exécution d’agent intégré. La plupart des outils locaux fonctionnent, mais les fonctionnalités réservées au Gateway ne sont pas disponibles.
- `openclaw` et `openclaw crestodian` utilisent aussi ce shell TUI, avec Crestodian comme backend de chat local de configuration et de réparation.

## Ce que vous voyez

- En-tête : URL de connexion, agent actuel, session actuelle.
- Journal de chat : messages utilisateur, réponses de l’assistant, notifications système, cartes d’outils.
- Ligne d’état : état de connexion/d’exécution (connexion, exécution, streaming, inactif, erreur).
- Pied de page : état de connexion + agent + session + modèle + think/fast/verbose/trace/reasoning + nombre de tokens + deliver.
- Saisie : éditeur de texte avec autocomplétion.

## Modèle mental : agents + sessions

- Les agents sont des slugs uniques (p. ex. `main`, `research`). Le Gateway expose la liste.
- Les sessions appartiennent à l’agent actuel.
- Les clés de session sont stockées sous la forme `agent:<agentId>:<sessionKey>`.
  - Si vous saisissez `/session main`, la TUI le développe en `agent:<currentAgent>:main`.
  - Si vous saisissez `/session agent:other:main`, vous basculez explicitement vers cette session d’agent.
- Portée de session :
  - `per-sender` (par défaut) : chaque agent possède plusieurs sessions.
  - `global` : la TUI utilise toujours la session `global` (le sélecteur peut être vide).
- L’agent et la session actuels sont toujours visibles dans le pied de page.

## Envoi + livraison

- Les messages sont envoyés au Gateway ; la livraison aux fournisseurs est désactivée par défaut.
- Activer la livraison :
  - `/deliver on`
  - ou le panneau Paramètres
  - ou démarrer avec `openclaw tui --deliver`

## Sélecteurs + superpositions

- Sélecteur de modèle : liste les modèles disponibles et définit le remplacement de session.
- Sélecteur d’agent : choisissez un autre agent.
- Sélecteur de session : affiche uniquement les sessions de l’agent actuel.
- Paramètres : activer/désactiver deliver, le développement de la sortie d’outil et la visibilité de la réflexion.

## Raccourcis clavier

- Entrée : envoyer le message
- Échap : interrompre l’exécution active
- Ctrl+C : effacer la saisie (appuyez deux fois pour quitter)
- Ctrl+D : quitter
- Ctrl+L : sélecteur de modèle
- Ctrl+G : sélecteur d’agent
- Ctrl+P : sélecteur de session
- Ctrl+O : activer/désactiver le développement de la sortie d’outil
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

- `/auth [provider]` ouvre le flux d’authentification/connexion du fournisseur dans la TUI.

Les autres commandes slash du Gateway (par exemple, `/context`) sont transmises au Gateway et affichées comme sortie système. Consultez [Commandes slash](/fr/tools/slash-commands).

## Commandes shell locales

- Préfixez une ligne par `!` pour exécuter une commande shell locale sur l’hôte de la TUI.
- La TUI demande une fois par session l’autorisation d’exécuter localement ; refuser garde `!` désactivé pour la session.
- Les commandes s’exécutent dans un nouveau shell non interactif dans le répertoire de travail de la TUI (pas de `cd`/env persistant).
- Les commandes shell locales reçoivent `OPENCLAW_SHELL=tui-local` dans leur environnement.
- Un `!` seul est envoyé comme message normal ; les espaces initiaux ne déclenchent pas l’exécution locale.

## Réparer les configurations depuis la TUI locale

Utilisez le mode local lorsque la configuration actuelle est déjà valide et que vous voulez que
l’agent intégré l’inspecte sur la même machine, la compare à la documentation
et aide à réparer les dérives sans dépendre d’un Gateway en cours d’exécution.

Si `openclaw config validate` échoue déjà, commencez par `openclaw configure`
ou `openclaw doctor --fix`. `openclaw chat` ne contourne pas la protection contre
les configurations invalides.

Boucle typique :

1. Démarrez le mode local :

```bash
openclaw chat
```

2. Demandez à l’agent ce que vous voulez vérifier, par exemple :

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. Utilisez les commandes shell locales pour obtenir des preuves exactes et valider :

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
- `openclaw docs "<query>"` recherche dans l’index de documentation en direct depuis la même machine.
- `openclaw config validate --json` est utile lorsque vous voulez des erreurs structurées de schéma et de SecretRef/résolvabilité.

## Sortie d’outil

- Les appels d’outils s’affichent sous forme de cartes avec arguments + résultats.
- Ctrl+O bascule entre les vues réduite et développée.
- Pendant l’exécution des outils, les mises à jour partielles sont diffusées dans la même carte.

## Couleurs du terminal

- La TUI conserve le texte du corps de l’assistant dans la couleur de premier plan par défaut de votre terminal, afin que les terminaux sombres et clairs restent lisibles.
- Si votre terminal utilise un arrière-plan clair et que l’autodétection est incorrecte, définissez `OPENCLAW_THEME=light` avant de lancer `openclaw tui`.
- Pour forcer plutôt la palette sombre d’origine, définissez `OPENCLAW_THEME=dark`.

## Historique + streaming

- À la connexion, la TUI charge l’historique le plus récent (200 messages par défaut).
- Les réponses en streaming se mettent à jour sur place jusqu’à leur finalisation.
- La TUI écoute aussi les événements d’outils de l’agent pour enrichir les cartes d’outils.

## Détails de connexion

- La TUI s’enregistre auprès du Gateway avec `mode: "tui"`.
- Les reconnexions affichent un message système ; les interruptions d’événements sont signalées dans le journal.

## Options

- `--local` : Exécuter avec l’environnement d’exécution d’agent intégré local
- `--url <url>` : URL WebSocket du Gateway (par défaut, depuis la configuration ou `ws://127.0.0.1:<port>`)
- `--token <token>` : Token du Gateway (si requis)
- `--password <password>` : Mot de passe du Gateway (si requis)
- `--session <key>` : Clé de session (par défaut : `main`, ou `global` lorsque la portée est globale)
- `--deliver` : Livrer les réponses de l’assistant au fournisseur (désactivé par défaut)
- `--thinking <level>` : Remplacer le niveau de réflexion pour les envois
- `--message <text>` : Envoyer un message initial après la connexion
- `--timeout-ms <ms>` : Délai d’expiration de l’agent en ms (par défaut, `agents.defaults.timeoutSeconds`)
- `--history-limit <n>` : Entrées d’historique à charger (`200` par défaut)

<Warning>
Lorsque vous définissez `--url`, la TUI ne se rabat pas sur les identifiants de configuration ou d’environnement. Passez explicitement `--token` ou `--password`. L’absence d’identifiants explicites est une erreur. En mode local, ne passez pas `--url`, `--token` ni `--password`.
</Warning>

## Dépannage

Aucune sortie après l’envoi d’un message :

- Exécutez `/status` dans la TUI pour confirmer que le Gateway est connecté et inactif/occupé.
- Vérifiez les journaux du Gateway : `openclaw logs --follow`.
- Confirmez que l’agent peut s’exécuter : `openclaw status` et `openclaw models status`.
- Si vous attendez des messages dans un canal de chat, activez la livraison (`/deliver on` ou `--deliver`).

## Dépannage de connexion

- `disconnected` : assurez-vous que le Gateway est en cours d’exécution et que vos `--url/--token/--password` sont corrects.
- Aucun agent dans le sélecteur : vérifiez `openclaw agents list` et votre configuration de routage.
- Sélecteur de session vide : vous êtes peut-être en portée globale ou vous n’avez pas encore de sessions.

## Connexe

- [Interface de contrôle](/fr/web/control-ui) — interface de contrôle basée sur le web
- [Configuration](/fr/cli/config) — inspecter, valider et modifier `openclaw.json`
- [Doctor](/fr/cli/doctor) — vérifications guidées de réparation et de migration
- [Référence CLI](/fr/cli) — référence complète des commandes CLI
