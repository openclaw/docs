---
read_when:
    - Vous devez suivre les journaux Gateway à distance (sans SSH)
    - Vous voulez des lignes de journal JSON pour l’outillage
summary: Référence CLI pour `openclaw logs` (suivre les journaux Gateway via RPC)
title: Journaux
x-i18n:
    generated_at: "2026-07-01T15:23:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c2cc14132d46b60fd323b40dad3c524b6eef40b940bb98d4b445d03782e0ea07
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Suit les journaux de fichiers du Gateway via RPC (fonctionne en mode distant).

Connexe :

- Vue d’ensemble de la journalisation : [Journalisation](/fr/logging)
- CLI Gateway : [gateway](/fr/cli/gateway)

## Options

- `--limit <n>` : nombre maximal de lignes de journal à renvoyer (par défaut `200`)
- `--max-bytes <n>` : nombre maximal d’octets à lire dans le fichier journal (par défaut `250000`)
- `--follow` : suivre le flux de journaux
- `--interval <ms>` : intervalle d’interrogation pendant le suivi (par défaut `1000`)
- `--json` : émettre des événements JSON délimités par des lignes
- `--plain` : sortie en texte brut sans mise en forme stylisée
- `--no-color` : désactiver les couleurs ANSI
- `--local-time` : afficher les horodatages dans votre fuseau horaire local (par défaut)
- `--utc` : afficher les horodatages en UTC

## Options RPC Gateway partagées

`openclaw logs` accepte également les indicateurs client Gateway standard :

- `--url <url>` : URL WebSocket du Gateway
- `--token <token>` : jeton du Gateway
- `--timeout <ms>` : délai d’expiration en ms (par défaut `30000`)
- `--expect-final` : attendre une réponse finale lorsque l’appel au Gateway est pris en charge par un agent

Lorsque vous passez `--url`, la CLI n’applique pas automatiquement la configuration ni les identifiants d’environnement. Incluez explicitement `--token` si le Gateway cible exige une authentification.

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
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Notes

- Les horodatages s’affichent dans votre fuseau horaire local par défaut. Utilisez `--utc` pour une sortie en UTC.
- Si le Gateway local loopback implicite demande un appairage, se ferme pendant la connexion ou expire avant que `logs.tail` ne réponde, `openclaw logs` se rabat automatiquement sur le fichier journal du Gateway configuré. Les cibles `--url` explicites n’utilisent pas ce repli.
- `openclaw logs --follow` ne suit pas les replis vers le fichier configuré après les échecs RPC du Gateway local implicite. Sous Linux, il utilise le journal Gateway user-systemd actif par PID lorsqu’il est disponible et affiche la source de journal sélectionnée ; sinon, il continue de réessayer le Gateway actif au lieu de suivre un fichier côte à côte potentiellement obsolète.
- Lors de l’utilisation de `--follow`, les déconnexions transitoires du gateway (fermeture WebSocket, délai d’expiration, perte de connexion) déclenchent une reconnexion automatique avec backoff exponentiel (jusqu’à 8 tentatives, plafonnées à 30 s entre les tentatives). Un avertissement est imprimé sur stderr à chaque nouvelle tentative, et un avis `[logs] gateway reconnected` est imprimé dès qu’une interrogation réussit. En mode `--json`, l’avertissement de nouvelle tentative et la transition de reconnexion sont tous deux émis sous forme d’enregistrements `{"type":"notice"}` sur stderr. Les erreurs non récupérables (échec d’authentification, mauvaise configuration) quittent toujours immédiatement.
- En mode `--follow --json`, les transitions de source de journal sont émises sous forme d’enregistrements `{"type":"meta"}`. Les consommateurs doivent suivre les curseurs par `sourceKind` : un flux peut passer de la sortie du fichier Gateway (`sourceKind: "file"`) au repli sur le journal local (`sourceKind: "journal"`, `localFallback: true`, avec `service.pid`/`service.unit`), puis revenir à la sortie du fichier Gateway après récupération. Ne supposez pas une source ou un curseur stable unique pour toute la session de suivi, et tolérez les lignes qui se chevauchent lorsque la récupération rejoue le curseur du fichier Gateway.

## Connexe

- [Référence CLI](/fr/cli)
- [Journalisation Gateway](/fr/gateway/logging)
