---
read_when:
    - Vous voulez que Claude Code utilise les outils MCP du Gateway OpenClaw
    - Vous avez besoin d’une autorisation MCP temporaire liée à la session pour un harnais externe
summary: Référence CLI pour `openclaw attach` (lancer Claude Code avec une autorisation MCP Gateway limitée)
title: Attacher la CLI
x-i18n:
    generated_at: "2026-07-02T00:52:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1445c9bbf28e5365d070f69bf8f53e249d70ac6e8690ed68831404d041e41e86
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` lance Claude Code avec une configuration MCP temporaire stricte liée
à une session Gateway.

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

Options :

- `--session <key>` lie l’autorisation à une session Gateway. Par défaut, utilise la session principale.
- `--ttl <ms>` demande un TTL d’autorisation positif en millisecondes. Le Gateway applique son propre plafond.
- `--bin <path>` sélectionne le binaire Claude Code. Par défaut, utilise `claude`.
- `--print-config` écrit le fichier `.mcp.json` temporaire, affiche la commande de lancement et l’environnement, et laisse l’autorisation active jusqu’à l’expiration du TTL.

Le jeton porteur est transmis par des variables d’environnement, et non par argv. OpenClaw
lance Claude Code avec `--strict-mcp-config --mcp-config <path>` afin que les
serveurs MCP Claude ambiants ne rejoignent pas la session attachée. Les lancements normaux révoquent
l’autorisation lorsque le processus Claude Code se termine.

Voir aussi : [CLI Gateway](/fr/cli/gateway), [CLI MCP](/fr/cli/mcp) et [CLI ACP](/fr/cli/acp).
