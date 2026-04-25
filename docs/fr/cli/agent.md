---
read_when:
    - Vous voulez exécuter un tour d’agent depuis des scripts (avec distribution facultative de la réponse)
summary: Référence CLI pour `openclaw agent` (envoyer un tour d’agent via la Gateway)
title: Agent
x-i18n:
    generated_at: "2026-04-25T13:42:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: e06681ffbed56cb5be05c7758141e784eac8307ed3c6fc973f71534238b407e1
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Exécute un tour d’agent via la Gateway (utilisez `--local` pour l’embarqué).
Utilisez `--agent <id>` pour cibler directement un agent configuré.

Passez au moins un sélecteur de session :

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Voir aussi :

- Outil d’envoi d’agent : [Agent send](/fr/tools/agent-send)

## Options

- `-m, --message <text>` : corps du message requis
- `-t, --to <dest>` : destinataire utilisé pour dériver la clé de session
- `--session-id <id>` : identifiant de session explicite
- `--agent <id>` : identifiant de l’agent ; remplace les liaisons de routage
- `--thinking <level>` : niveau de réflexion de l’agent (`off`, `minimal`, `low`, `medium`, `high`, plus les niveaux personnalisés pris en charge par le fournisseur tels que `xhigh`, `adaptive` ou `max`)
- `--verbose <on|off>` : conserver le niveau verbeux pour la session
- `--channel <channel>` : canal de distribution ; omettez-le pour utiliser le canal principal de la session
- `--reply-to <target>` : remplacement de la cible de distribution
- `--reply-channel <channel>` : remplacement du canal de distribution
- `--reply-account <id>` : remplacement du compte de distribution
- `--local` : exécute directement l’agent embarqué (après le préchargement du registre de plugins)
- `--deliver` : renvoie la réponse vers le canal/la cible sélectionné(e)
- `--timeout <seconds>` : remplace le délai d’expiration de l’agent (600 par défaut ou valeur de configuration)
- `--json` : sortie JSON

## Exemples

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Remarques

- Le mode Gateway se replie sur l’agent embarqué lorsque la requête Gateway échoue. Utilisez `--local` pour forcer l’exécution embarquée dès le départ.
- `--local` précharge quand même d’abord le registre de plugins, afin que les fournisseurs, outils et canaux fournis par des plugins restent disponibles pendant les exécutions embarquées.
- Chaque invocation de `openclaw agent` est traitée comme une exécution ponctuelle. Les serveurs MCP inclus ou configurés par l’utilisateur ouverts pour cette exécution sont arrêtés après la réponse, même lorsque la commande utilise le chemin Gateway, afin que les processus enfants MCP stdio ne restent pas actifs entre les invocations scriptées.
- `--channel`, `--reply-channel` et `--reply-account` affectent la distribution des réponses, pas le routage de session.
- `--json` réserve stdout à la réponse JSON. Les diagnostics Gateway, plugin et de repli embarqué sont dirigés vers stderr afin que les scripts puissent analyser stdout directement.
- Lorsque cette commande déclenche la régénération de `models.json`, les identifiants de fournisseur gérés par SecretRef sont conservés sous forme de marqueurs non secrets (par exemple des noms de variables d’environnement, `secretref-env:ENV_VAR_NAME` ou `secretref-managed`), et non comme du texte secret résolu en clair.
- Les écritures de marqueurs sont autoritatives côté source : OpenClaw conserve les marqueurs à partir de l’instantané de configuration source actif, et non à partir des valeurs secrètes résolues à l’exécution.

## Voir aussi

- [Référence CLI](/fr/cli)
- [Runtime de l’agent](/fr/concepts/agent)
