---
read_when:
    - Vous devez suivre les journaux du Gateway à distance (sans SSH)
    - Vous voulez des lignes de journal JSON pour l’outillage
summary: Référence CLI pour `openclaw logs` (suivi des journaux du Gateway via RPC)
title: Journaux
x-i18n:
    generated_at: "2026-04-30T07:18:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f9268fefa4d0e54297fd12c5cef30a1465bd735ae6a36292c279a438285f2b8
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Suit les journaux de fichier du Gateway via RPC (fonctionne en mode distant).

Connexe :

- Vue d’ensemble de la journalisation : [Journalisation](/fr/logging)
- CLI du Gateway : [gateway](/fr/cli/gateway)

## Options

- `--limit <n>` : nombre maximal de lignes de journal à renvoyer (par défaut `200`)
- `--max-bytes <n>` : nombre maximal d’octets à lire dans le fichier de journal (par défaut `250000`)
- `--follow` : suivre le flux de journal
- `--interval <ms>` : intervalle d’interrogation pendant le suivi (par défaut `1000`)
- `--json` : émettre des événements JSON délimités par ligne
- `--plain` : sortie en texte brut sans mise en forme stylisée
- `--no-color` : désactiver les couleurs ANSI
- `--local-time` : afficher les horodatages dans votre fuseau horaire local

## Options RPC Gateway partagées

`openclaw logs` accepte aussi les indicateurs client Gateway standard :

- `--url <url>` : URL WebSocket du Gateway
- `--token <token>` : jeton du Gateway
- `--timeout <ms>` : délai d’expiration en ms (par défaut `30000`)
- `--expect-final` : attendre une réponse finale lorsque l’appel au Gateway est adossé à un agent

Lorsque vous passez `--url`, la CLI n’applique pas automatiquement les identifiants de configuration ou d’environnement. Incluez explicitement `--token` si le Gateway cible exige une authentification.

## Exemples

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Notes

- Utilisez `--local-time` pour afficher les horodatages dans votre fuseau horaire local.
- Si le Gateway local loopback implicite demande un appairage, ferme pendant la connexion ou expire avant que `logs.tail` ne réponde, `openclaw logs` bascule automatiquement vers le journal de fichier du Gateway configuré. Les cibles `--url` explicites n’utilisent pas ce repli.

## Connexe

- [Référence de la CLI](/fr/cli)
- [Journalisation du Gateway](/fr/gateway/logging)
