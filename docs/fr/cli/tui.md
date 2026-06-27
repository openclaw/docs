---
read_when:
    - Vous voulez une interface terminal pour le Gateway (adaptée à l’accès distant)
    - Vous voulez transmettre l’URL, le jeton ou la session depuis des scripts
    - Vous voulez exécuter le TUI en mode intégré local sans Gateway
    - Vous souhaitez utiliser openclaw chat ou openclaw tui --local
summary: Référence CLI pour `openclaw tui` (interface utilisateur de terminal adossée au Gateway ou intégrée localement)
title: TUI
x-i18n:
    generated_at: "2026-06-27T17:22:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 514bbbcd0b695e8d4ccc87d1e242d816e264ac1f8b137f2bd891803ef7f48d5a
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Ouvrez l’interface terminal connectée au Gateway, ou exécutez-la en mode local intégré.

Associé :

- Guide TUI : [TUI](/fr/web/tui)

## Options

| Indicateur            | Par défaut                               | Description                                                                                                                                    |
| --------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `--local`             | `false`                                  | S’exécuter avec l’environnement d’exécution d’agent local intégré plutôt qu’avec un Gateway.                                                   |
| `--url <url>`         | `gateway.remote.url` de la configuration | URL WebSocket du Gateway.                                                                                                                      |
| `--token <token>`     | (aucun)                                  | Jeton du Gateway si requis.                                                                                                                    |
| `--password <pass>`   | (aucun)                                  | Mot de passe du Gateway si requis.                                                                                                             |
| `--session <key>`     | `main` (ou `global` si la portée globale) | Clé de session. Dans un espace de travail d’agent, sélectionne automatiquement cet agent sauf si un préfixe est utilisé.                       |
| `--deliver`           | `false`                                  | Distribuer les réponses de l’assistant via les canaux configurés.                                                                              |
| `--thinking <level>`  | (valeur par défaut du modèle)            | Remplacement du niveau de réflexion.                                                                                                           |
| `--message <text>`    | (aucun)                                  | Envoyer un message initial après la connexion.                                                                                                 |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`         | Délai d’expiration de l’agent. Les valeurs non valides journalisent un avertissement et sont ignorées.                                         |
| `--history-limit <n>` | `200`                                    | Entrées d’historique à charger lors de l’attachement.                                                                                          |

Alias : `openclaw chat` et `openclaw terminal` invoquent la même commande avec `--local` implicite.

Remarques :

- `chat` et `terminal` sont des alias de `openclaw tui --local`.
- `--local` ne peut pas être combiné avec `--url`, `--token` ou `--password`.
- `tui` résout quand c’est possible les SecretRefs d’authentification du Gateway configurés pour l’authentification par jeton/mot de passe (fournisseurs `env`/`file`/`exec`).
- Lorsqu’il est lancé depuis un répertoire d’espace de travail d’agent configuré, TUI sélectionne automatiquement cet agent comme valeur par défaut de la clé de session (sauf si `--session` est explicitement `agent:<id>:...`).
- Pour afficher le nom d’hôte du Gateway dans le pied de page pour les connexions non locales adossées à une URL, exécutez `openclaw config set tui.footer.showRemoteHost true`. Le libellé d’hôte est désactivé par défaut et n’apparaît jamais pour les connexions de loopback ou locales intégrées.
- Le mode local utilise directement l’environnement d’exécution d’agent intégré. La plupart des outils locaux fonctionnent, mais les fonctionnalités propres au Gateway ne sont pas disponibles.
- Le mode local ajoute `/auth [provider]` dans la surface de commande TUI.
- Les barrières d’approbation des Plugins continuent de s’appliquer en mode local. Les outils qui exigent une approbation demandent une décision dans le terminal ; rien n’est approuvé automatiquement en silence parce que le Gateway n’est pas impliqué.
- Les [objectifs](/fr/tools/goal) de session apparaissent dans le pied de page et peuvent être gérés avec `/goal`.

## Exemples

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```

## Boucle de réparation de configuration

Utilisez le mode local lorsque la configuration actuelle est déjà valide et que vous voulez que l’agent intégré l’inspecte, la compare à la documentation et aide à la réparer depuis le même terminal :

Si `openclaw config validate` échoue déjà, utilisez d’abord `openclaw configure` ou `openclaw doctor --fix`. `openclaw chat` ne contourne pas la protection contre les configurations non valides.

```bash
openclaw chat
```

Puis dans le TUI :

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Appliquez des corrections ciblées avec `openclaw config set` ou `openclaw configure`, puis réexécutez `openclaw config validate`. Consultez [TUI](/fr/web/tui) et [Configuration](/fr/cli/config).

## Associé

- [Référence CLI](/fr/cli)
- [TUI](/fr/web/tui)
- [Objectif](/fr/tools/goal)
