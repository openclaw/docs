---
read_when:
    - Vous souhaitez exécuter un tour d’agent depuis des scripts (et éventuellement envoyer la réponse)
summary: Référence CLI pour `openclaw agent` (envoyer un tour d’agent via le Gateway)
title: Agent
x-i18n:
    generated_at: "2026-04-30T07:16:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: b77668949040933c5281f2f183e48cc2593d09252470483b9ae38dcffd13d071
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Exécutez un tour d’agent via le Gateway (utilisez `--local` pour le mode intégré).
Utilisez `--agent <id>` pour cibler directement un agent configuré.

Passez au moins un sélecteur de session :

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Lié :

- Outil d’envoi d’agent : [Envoi d’agent](/fr/tools/agent-send)

## Options

- `-m, --message <text>` : corps du message requis
- `-t, --to <dest>` : destinataire utilisé pour dériver la clé de session
- `--session-id <id>` : identifiant de session explicite
- `--agent <id>` : identifiant d’agent ; remplace les liaisons de routage
- `--model <id>` : remplacement du modèle pour cette exécution (`provider/model` ou identifiant de modèle)
- `--thinking <level>` : niveau de réflexion de l’agent (`off`, `minimal`, `low`, `medium`, `high`, ainsi que les niveaux personnalisés pris en charge par le fournisseur comme `xhigh`, `adaptive` ou `max`)
- `--verbose <on|off>` : persiste le niveau détaillé pour la session
- `--channel <channel>` : canal de livraison ; omettez-le pour utiliser le canal principal de la session
- `--reply-to <target>` : remplacement de la cible de livraison
- `--reply-channel <channel>` : remplacement du canal de livraison
- `--reply-account <id>` : remplacement du compte de livraison
- `--local` : exécute directement l’agent intégré (après le préchargement du registre de plugins)
- `--deliver` : renvoie la réponse au canal/à la cible sélectionné
- `--timeout <seconds>` : remplace le délai d’expiration de l’agent (valeur par défaut 600 ou valeur de configuration)
- `--json` : sortie JSON

## Exemples

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Notes

- Le mode Gateway revient à l’agent intégré lorsque la requête Gateway échoue. Utilisez `--local` pour forcer l’exécution intégrée dès le départ.
- `--local` précharge tout de même d’abord le registre de plugins, afin que les fournisseurs, outils et canaux fournis par les plugins restent disponibles pendant les exécutions intégrées.
- `--local` et les exécutions de repli intégrées sont traités comme des exécutions ponctuelles. Les ressources de loopback MCP groupées et les sessions stdio Claude chaudes ouvertes pour ce processus local sont retirées après la réponse, afin que les invocations scriptées ne gardent pas de processus enfants locaux actifs.
- Les exécutions adossées au Gateway laissent les ressources de loopback MCP appartenant au Gateway sous le processus Gateway en cours d’exécution ; les anciens clients peuvent encore envoyer l’indicateur de nettoyage historique, mais le Gateway l’accepte comme une absence d’opération de compatibilité.
- `--channel`, `--reply-channel` et `--reply-account` affectent la livraison de la réponse, pas le routage de session.
- `--json` réserve stdout à la réponse JSON. Les diagnostics du Gateway, des plugins et du repli intégré sont acheminés vers stderr afin que les scripts puissent analyser stdout directement.
- Le JSON du repli intégré inclut `meta.transport: "embedded"` et `meta.fallbackFrom: "gateway"` afin que les scripts puissent distinguer les exécutions de repli des exécutions Gateway.
- Si le Gateway accepte une exécution d’agent mais que la CLI dépasse le délai d’attente en attendant la réponse finale, le repli intégré utilise un nouvel identifiant explicite de session/exécution `gateway-fallback-*` et signale `meta.fallbackReason: "gateway_timeout"` ainsi que les champs de session de repli. Cela évite d’entrer en concurrence avec le verrou de transcription appartenant au Gateway ou de remplacer silencieusement la session de conversation routée d’origine.
- Lorsque cette commande déclenche la régénération de `models.json`, les identifiants de fournisseur gérés par SecretRef sont persistés sous forme de marqueurs non secrets (par exemple des noms de variables d’environnement, `secretref-env:ENV_VAR_NAME` ou `secretref-managed`), et non sous forme de secrets en clair résolus.
- Les écritures de marqueurs font autorité depuis la source : OpenClaw persiste les marqueurs à partir de l’instantané de configuration source actif, et non à partir des valeurs de secrets d’exécution résolues.

## Lié

- [Référence CLI](/fr/cli)
- [Exécution d’agent](/fr/concepts/agent)
