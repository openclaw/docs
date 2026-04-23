---
read_when:
    - Vous voulez une présentation simple du TUI pour débutants
    - Vous avez besoin de la liste complète des fonctionnalités, commandes et raccourcis du TUI
summary: 'Interface utilisateur terminal (TUI) : se connecter à la Gateway ou s’exécuter localement en mode intégré'
title: TUI
x-i18n:
    generated_at: "2026-04-23T07:13:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: df3ddbe41cb7d92b9cde09a4d1443d26579b4e1cfc92dce6bbc37eed4d8af8fa
    source_path: web/tui.md
    workflow: 15
---

# TUI (interface utilisateur terminal)

## Démarrage rapide

### Mode Gateway

1. Démarrez la Gateway.

```bash
openclaw gateway
```

2. Ouvrez le TUI.

```bash
openclaw tui
```

3. Saisissez un message et appuyez sur Entrée.

Gateway distante :

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
- `--local` ne peut pas être combiné avec `--url`, `--token`, ou `--password`.
- Le mode local utilise directement le runtime d’agent intégré. La plupart des outils locaux fonctionnent, mais les fonctionnalités réservées à la Gateway ne sont pas disponibles.

## Ce que vous voyez

- En-tête : URL de connexion, agent actuel, session actuelle.
- Journal de chat : messages utilisateur, réponses de l’assistant, avis système, cartes d’outils.
- Ligne d’état : état de connexion/d’exécution (connexion, exécution, streaming, inactif, erreur).
- Pied de page : état de connexion + agent + session + modèle + think/fast/verbose/trace/reasoning + nombres de jetons + deliver.
- Saisie : éditeur de texte avec autocomplétion.

## Modèle mental : agents + sessions

- Les agents sont des slugs uniques (par exemple `main`, `research`). La Gateway en expose la liste.
- Les sessions appartiennent à l’agent courant.
- Les clés de session sont stockées sous la forme `agent:<agentId>:<sessionKey>`.
  - Si vous saisissez `/session main`, le TUI l’étend en `agent:<currentAgent>:main`.
  - Si vous saisissez `/session agent:other:main`, vous basculez explicitement vers cette session d’agent.
- Portée de session :
  - `per-sender` (par défaut) : chaque agent a plusieurs sessions.
  - `global` : le TUI utilise toujours la session `global` (le sélecteur peut être vide).
- L’agent courant + la session courante sont toujours visibles dans le pied de page.

## Envoi + livraison

- Les messages sont envoyés à la Gateway ; la livraison aux fournisseurs est désactivée par défaut.
- Activez la livraison :
  - `/deliver on`
  - ou via le panneau Settings
  - ou démarrez avec `openclaw tui --deliver`

## Sélecteurs + surcouches

- Sélecteur de modèle : liste les modèles disponibles et définit le remplacement de session.
- Sélecteur d’agent : choisir un autre agent.
- Sélecteur de session : n’affiche que les sessions de l’agent courant.
- Settings : basculer la livraison, le développement de la sortie des outils et la visibilité de la réflexion.

## Raccourcis clavier

- Entrée : envoyer le message
- Échap : interrompre l’exécution active
- Ctrl+C : effacer la saisie (appuyez deux fois pour quitter)
- Ctrl+D : quitter
- Ctrl+L : sélecteur de modèle
- Ctrl+G : sélecteur d’agent
- Ctrl+P : sélecteur de session
- Ctrl+O : basculer le développement de la sortie des outils
- Ctrl+T : basculer la visibilité de la réflexion (recharge l’historique)

## Commandes slash

Cœur :

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

- `/auth [provider]` ouvre le flux d’authentification/de connexion du fournisseur à l’intérieur du TUI.

Les autres commandes slash de la Gateway (par exemple `/context`) sont transmises à la Gateway et affichées comme sortie système. Voir [Commandes slash](/fr/tools/slash-commands).

## Commandes shell locales

- Préfixez une ligne par `!` pour exécuter une commande shell locale sur l’hôte du TUI.
- Le TUI demande une fois par session l’autorisation d’exécution locale ; refuser garde `!` désactivé pour la session.
- Les commandes s’exécutent dans un shell non interactif et vierge dans le répertoire de travail du TUI (pas de `cd`/env persistant).
- Les commandes shell locales reçoivent `OPENCLAW_SHELL=tui-local` dans leur environnement.
- Un `!` seul est envoyé comme message normal ; les espaces initiaux ne déclenchent pas d’exécution locale.

## Réparer les configurations depuis le TUI local

Utilisez le mode local lorsque la configuration actuelle est déjà valide et que vous voulez que l’agent
intégré l’inspecte sur la même machine, la compare à la documentation,
et aide à corriger les dérives sans dépendre d’une Gateway en cours d’exécution.

Si `openclaw config validate` échoue déjà, commencez d’abord par `openclaw configure`
ou `openclaw doctor --fix`. `openclaw chat` ne contourne pas la protection
contre les configurations invalides.

Boucle typique :

1. Démarrez le mode local :

```bash
openclaw chat
```

2. Demandez à l’agent ce que vous voulez vérifier, par exemple :

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. Utilisez des commandes shell locales pour obtenir des preuves exactes et valider :

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Appliquez des changements ciblés avec `openclaw config set` ou `openclaw configure`, puis réexécutez `!openclaw config validate`.
5. Si Doctor recommande une migration ou une réparation automatique, examinez-la puis exécutez `!openclaw doctor --fix`.

Conseils :

- Préférez `openclaw config set` ou `openclaw configure` à l’édition manuelle de `openclaw.json`.
- `openclaw docs "<query>"` recherche dans l’index live de la documentation depuis la même machine.
- `openclaw config validate --json` est utile lorsque vous voulez des erreurs structurées de schéma et de SecretRef/résolubilité.

## Sortie des outils

- Les appels d’outils s’affichent sous forme de cartes avec arguments + résultats.
- Ctrl+O bascule entre les vues réduites/développées.
- Pendant l’exécution des outils, les mises à jour partielles sont diffusées dans la même carte.

## Couleurs du terminal

- Le TUI garde le texte principal de l’assistant dans la couleur de premier plan par défaut de votre terminal afin que les terminaux sombres et clairs restent tous lisibles.
- Si votre terminal utilise un arrière-plan clair et que l’auto-détection est incorrecte, définissez `OPENCLAW_THEME=light` avant de lancer `openclaw tui`.
- Pour forcer à la place la palette sombre d’origine, définissez `OPENCLAW_THEME=dark`.

## Historique + streaming

- À la connexion, le TUI charge le dernier historique (200 messages par défaut).
- Les réponses en streaming se mettent à jour sur place jusqu’à leur finalisation.
- Le TUI écoute aussi les événements d’outils de l’agent pour des cartes d’outils plus riches.

## Détails de connexion

- Le TUI s’enregistre auprès de la Gateway avec `mode: "tui"`.
- Les reconnexions affichent un message système ; les trous d’événements sont signalés dans le journal.

## Options

- `--local` : exécuter contre le runtime d’agent intégré local
- `--url <url>` : URL WebSocket de la Gateway (par défaut issue de la config ou `ws://127.0.0.1:<port>`)
- `--token <token>` : jeton de Gateway (si requis)
- `--password <password>` : mot de passe de Gateway (si requis)
- `--session <key>` : clé de session (par défaut : `main`, ou `global` lorsque la portée est globale)
- `--deliver` : livrer les réponses de l’assistant au fournisseur (désactivé par défaut)
- `--thinking <level>` : remplacer le niveau de réflexion pour les envois
- `--message <text>` : envoyer un message initial après la connexion
- `--timeout-ms <ms>` : délai d’expiration de l’agent en ms (valeur issue de `agents.defaults.timeoutSeconds`)
- `--history-limit <n>` : entrées d’historique à charger (valeur par défaut `200`)

Remarque : lorsque vous définissez `--url`, le TUI ne retombe pas sur les identifiants de la configuration ou de l’environnement.
Passez explicitement `--token` ou `--password`. L’absence d’identifiants explicites est une erreur.
En mode local, ne passez pas `--url`, `--token`, ou `--password`.

## Dépannage

Aucune sortie après l’envoi d’un message :

- Exécutez `/status` dans le TUI pour confirmer que la Gateway est connectée et inactive/occupée.
- Vérifiez les journaux de la Gateway : `openclaw logs --follow`.
- Confirmez que l’agent peut s’exécuter : `openclaw status` et `openclaw models status`.
- Si vous attendez des messages dans un canal de chat, activez la livraison (`/deliver on` ou `--deliver`).

## Dépannage de la connexion

- `disconnected` : assurez-vous que la Gateway est en cours d’exécution et que vos `--url/--token/--password` sont corrects.
- Aucun agent dans le sélecteur : vérifiez `openclaw agents list` et votre configuration de routage.
- Sélecteur de session vide : vous êtes peut-être en portée globale ou vous n’avez pas encore de sessions.

## Liens associés

- [Control UI](/fr/web/control-ui) — interface de contrôle web
- [Config](/fr/cli/config) — inspecter, valider et modifier `openclaw.json`
- [Doctor](/fr/cli/doctor) — vérifications guidées de réparation et de migration
- [Référence CLI](/fr/cli) — référence complète des commandes CLI
