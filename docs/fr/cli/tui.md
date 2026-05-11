---
read_when:
    - Vous voulez une interface utilisateur en terminal pour le Gateway (adaptée à un usage à distance)
    - Vous souhaitez transmettre url/token/session depuis des scripts
    - Vous souhaitez exécuter le TUI en mode intégré local sans Gateway
    - Vous souhaitez utiliser openclaw chat ou openclaw tui --local
summary: Référence CLI pour `openclaw tui` (interface utilisateur de terminal adossée au Gateway ou intégrée localement)
title: TUI
x-i18n:
    generated_at: "2026-05-11T20:30:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e59f0f5360a456d19cfee38adc540b27665c55de68480616f269d1088f13677
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Ouvrez l’interface utilisateur de terminal connectée au Gateway, ou exécutez-la en mode
local intégré.

Associé :

- Guide TUI : [TUI](/fr/web/tui)

## Options

| Drapeau               | Par défaut                               | Description                                                                                     |
| --------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `--local`             | `false`                                  | Exécuter avec le runtime d’agent local intégré au lieu d’un Gateway.                            |
| `--url <url>`         | `gateway.remote.url` depuis la config    | URL WebSocket du Gateway.                                                                       |
| `--token <token>`     | (aucun)                                  | Jeton du Gateway, si requis.                                                                    |
| `--password <pass>`   | (aucun)                                  | Mot de passe du Gateway, si requis.                                                             |
| `--session <key>`     | `main` (ou `global` quand la portée est globale) | Clé de session. Dans un espace de travail d’agent, sélectionne automatiquement cet agent sauf si préfixée. |
| `--deliver`           | `false`                                  | Distribuer les réponses de l’assistant via les canaux configurés.                               |
| `--thinking <level>`  | (par défaut du modèle)                   | Remplacement du niveau de réflexion.                                                            |
| `--message <text>`    | (aucun)                                  | Envoyer un message initial après la connexion.                                                   |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`         | Délai d’expiration de l’agent. Les valeurs invalides consignent un avertissement et sont ignorées. |
| `--history-limit <n>` | `200`                                    | Entrées d’historique à charger lors de l’attachement.                                           |

Alias : `openclaw chat` et `openclaw terminal` invoquent la même commande avec `--local` implicite.

Remarques :

- `chat` et `terminal` sont des alias de `openclaw tui --local`.
- `--local` ne peut pas être combiné avec `--url`, `--token` ou `--password`.
- `tui` résout les SecretRefs d’authentification du gateway configurés pour l’authentification par jeton/mot de passe lorsque c’est possible (fournisseurs `env`/`file`/`exec`).
- Lorsqu’il est lancé depuis un répertoire d’espace de travail d’agent configuré, TUI sélectionne automatiquement cet agent comme valeur par défaut de la clé de session (sauf si `--session` est explicitement `agent:<id>:...`).
- Le mode local utilise directement le runtime d’agent intégré. La plupart des outils locaux fonctionnent, mais les fonctionnalités propres au Gateway ne sont pas disponibles.
- Le mode local ajoute `/auth [provider]` dans la surface de commande TUI.
- Les barrières d’approbation des Plugins s’appliquent toujours en mode local. Les outils qui exigent une approbation demandent une décision dans le terminal ; rien n’est approuvé automatiquement en silence parce que le Gateway n’intervient pas.

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

## Boucle de réparation de la config

Utilisez le mode local lorsque la config actuelle est déjà valide et que vous voulez que
l’agent intégré l’inspecte, la compare à la documentation et aide à la réparer
depuis le même terminal :

Si `openclaw config validate` échoue déjà, utilisez d’abord `openclaw configure` ou
`openclaw doctor --fix`. `openclaw chat` ne contourne pas le garde-fou de config
invalide.

```bash
openclaw chat
```

Puis dans TUI :

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Appliquez des correctifs ciblés avec `openclaw config set` ou `openclaw configure`, puis
relancez `openclaw config validate`. Consultez [TUI](/fr/web/tui) et [Config](/fr/cli/config).

## Associé

- [Référence CLI](/fr/cli)
- [TUI](/fr/web/tui)
