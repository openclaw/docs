---
read_when:
    - Vous voulez exécuter un tour agent depuis des scripts (avec livraison optionnelle de la réponse)
summary: Référence CLI pour `openclaw agent` (envoyer un tour agent via la Gateway)
title: agent
x-i18n:
    generated_at: "2026-04-23T07:00:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ba3181d74e9a8d6d607ee62b18e1e6fd693e64e7789e6b29b7f7b1ccb7b69d0
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Exécutez un tour agent via la Gateway (utilisez `--local` pour le mode intégré).
Utilisez `--agent <id>` pour cibler directement un agent configuré.

Passez au moins un sélecteur de session :

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Voir aussi :

- Outil d’envoi agent : [Agent send](/fr/tools/agent-send)

## Options

- `-m, --message <text>` : corps du message requis
- `-t, --to <dest>` : destinataire utilisé pour dériver la clé de session
- `--session-id <id>` : identifiant de session explicite
- `--agent <id>` : identifiant de l’agent ; remplace les liaisons de routage
- `--thinking <level>` : niveau de réflexion de l’agent (`off`, `minimal`, `low`, `medium`, `high`, ainsi que les niveaux personnalisés pris en charge par le fournisseur tels que `xhigh`, `adaptive` ou `max`)
- `--verbose <on|off>` : conserver le niveau détaillé pour la session
- `--channel <channel>` : canal de livraison ; omettez-le pour utiliser le canal principal de la session
- `--reply-to <target>` : remplacement de la cible de livraison
- `--reply-channel <channel>` : remplacement du canal de livraison
- `--reply-account <id>` : remplacement du compte de livraison
- `--local` : exécute directement l’agent intégré (après préchargement du registre de plugins)
- `--deliver` : renvoie la réponse vers le canal/la cible sélectionné(e)
- `--timeout <seconds>` : remplace le délai d’expiration de l’agent (par défaut 600 ou la valeur de configuration)
- `--json` : sortie au format JSON

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

- Le mode Gateway bascule vers l’agent intégré si la requête Gateway échoue. Utilisez `--local` pour forcer l’exécution intégrée dès le départ.
- `--local` précharge tout de même d’abord le registre de plugins, afin que les fournisseurs, outils et canaux fournis par des plugins restent disponibles pendant les exécutions intégrées.
- `--channel`, `--reply-channel` et `--reply-account` affectent la livraison de la réponse, pas le routage de session.
- Lorsque cette commande déclenche la régénération de `models.json`, les identifiants de fournisseur gérés par SecretRef sont conservés sous forme de marqueurs non secrets (par exemple noms de variables d’environnement, `secretref-env:ENV_VAR_NAME` ou `secretref-managed`), et non comme secrets en clair résolus.
- Les écritures de marqueurs sont autoritatives côté source : OpenClaw conserve les marqueurs depuis l’instantané de configuration source actif, et non depuis les valeurs secrètes résolues à l’exécution.
