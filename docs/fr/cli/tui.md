---
read_when:
    - Vous souhaitez une interface de terminal pour la Gateway (adaptée à l’accès distant)
    - Vous souhaitez transmettre url/token/session depuis des scripts
    - Vous souhaitez exécuter la TUI en mode intégré local sans Gateway
    - Vous souhaitez utiliser openclaw chat ou openclaw tui --local
summary: Référence CLI pour `openclaw tui` (interface de terminal intégrée locale ou adossée à la Gateway)
title: TUI
x-i18n:
    generated_at: "2026-04-23T07:02:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4fca025a15f5e985ca6f2eaf39fcbe784bd716f24841f43450b71936db26d141
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Ouvrez la TUI connectée à la Gateway, ou exécutez-la en mode
intégré local.

Connexe :

- Guide TUI : [TUI](/fr/web/tui)

Remarques :

- `chat` et `terminal` sont des alias de `openclaw tui --local`.
- `--local` ne peut pas être combiné avec `--url`, `--token` ou `--password`.
- `tui` résout les SecretRef d’authentification Gateway configurés pour l’authentification par jeton/mot de passe lorsque cela est possible (fournisseurs `env`/`file`/`exec`).
- Lorsqu’elle est lancée depuis un répertoire d’espace de travail d’agent configuré, la TUI sélectionne automatiquement cet agent pour la valeur par défaut de la clé de session (sauf si `--session` est explicitement `agent:<id>:...`).
- Le mode local utilise directement le runtime d’agent intégré. La plupart des outils locaux fonctionnent, mais les fonctionnalités réservées à la Gateway ne sont pas disponibles.
- Le mode local ajoute `/auth [provider]` dans la surface de commande de la TUI.
- Les contrôles d’approbation des plugins s’appliquent toujours en mode local. Les outils qui nécessitent une approbation demandent une décision dans le terminal ; rien n’est auto-approuvé silencieusement parce que la Gateway n’est pas impliquée.

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

Utilisez le mode local lorsque la configuration actuelle est déjà valide et que vous souhaitez que l’agent
intégré l’inspecte, la compare à la documentation et aide à la réparer
depuis le même terminal :

Si `openclaw config validate` échoue déjà, utilisez d’abord `openclaw configure` ou
`openclaw doctor --fix`. `openclaw chat` ne contourne pas la protection contre une
configuration invalide.

```bash
openclaw chat
```

Ensuite dans la TUI :

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Appliquez des correctifs ciblés avec `openclaw config set` ou `openclaw configure`, puis
relancez `openclaw config validate`. Voir [TUI](/fr/web/tui) et [Config](/fr/cli/config).
