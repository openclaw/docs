---
read_when:
    - Vous souhaitez que Claude Code utilise les outils MCP du Gateway OpenClaw
    - Vous avez besoin d’une autorisation MCP temporaire liée à la session pour un environnement de test externe
summary: Référence de la CLI pour `openclaw attach` (lancer Claude Code avec une autorisation MCP limitée au Gateway)
title: Associer la CLI
x-i18n:
    generated_at: "2026-07-12T15:08:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0d8ac60724adef1439af09179806af537b8f2925f06b3715850e4dd3b83b080f
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` lance Claude Code avec une configuration MCP temporaire stricte liée à une seule session Gateway.

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

Options :

- `--session <key>` lie l’autorisation à une session Gateway. Par défaut, il s’agit de la session principale.
- `--ttl <ms>` demande une durée de vie positive de l’autorisation, en millisecondes. Le Gateway applique sa propre limite maximale.
- `--bin <path>` sélectionne le binaire Claude Code. Valeur par défaut : `claude`.
- `--print-config` écrit le fichier temporaire `.mcp.json`, affiche la commande de lancement et les variables d’environnement, puis maintient l’autorisation active jusqu’à l’expiration de sa durée de vie (cette option ne lance pas Claude Code et ne révoque pas l’autorisation).

Le jeton au porteur est transmis par des variables d’environnement, et non par argv. OpenClaw lance Claude Code avec `--strict-mcp-config --mcp-config <path>` afin que les serveurs MCP Claude présents dans l’environnement ne rejoignent pas la session attachée. Les lancements normaux (sans `--print-config`) révoquent l’autorisation lorsque le processus Claude Code se termine.

Voir aussi : [CLI du Gateway](/fr/cli/gateway), [CLI MCP](/fr/cli/mcp) et [CLI ACP](/fr/cli/acp).
