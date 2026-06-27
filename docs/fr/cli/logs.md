---
read_when:
    - Vous devez suivre les journaux du Gateway à distance (sans SSH)
    - Vous voulez des lignes de journal JSON pour l’outillage
summary: Référence CLI pour `openclaw logs` (suivre les journaux du Gateway via RPC)
title: Journaux
x-i18n:
    generated_at: "2026-06-27T17:19:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3835880c0919d4c0c67bd3b371f9f8b0f396b80a9456c545ea0caa064a6361c0
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Suivre les journaux de fichiers du Gateway via RPC (fonctionne en mode distant).

Connexe :

- Vue d’ensemble de la journalisation : [Journalisation](/fr/logging)
- CLI du Gateway : [gateway](/fr/cli/gateway)

## Options

- `--limit <n>` : nombre maximal de lignes de journal à retourner (`200` par défaut)
- `--max-bytes <n>` : nombre maximal d’octets à lire depuis le fichier journal (`250000` par défaut)
- `--follow` : suivre le flux du journal
- `--interval <ms>` : intervalle d’interrogation pendant le suivi (`1000` par défaut)
- `--json` : émettre des événements JSON délimités par ligne
- `--plain` : sortie en texte brut sans mise en forme stylisée
- `--no-color` : désactiver les couleurs ANSI
- `--local-time` : afficher les horodatages dans votre fuseau horaire local (par défaut)
- `--utc` : afficher les horodatages en UTC

## Options RPC partagées du Gateway

`openclaw logs` accepte aussi les indicateurs standard du client Gateway :

- `--url <url>` : URL WebSocket du Gateway
- `--token <token>` : jeton du Gateway
- `--timeout <ms>` : délai d’expiration en ms (`30000` par défaut)
- `--expect-final` : attendre une réponse finale lorsque l’appel au Gateway est pris en charge par un agent

Lorsque vous passez `--url`, la CLI n’applique pas automatiquement les identifiants issus de la configuration ou de l’environnement. Incluez `--token` explicitement si le Gateway cible exige une authentification.

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

- Les horodatages sont affichés dans votre fuseau horaire local par défaut. Utilisez `--utc` pour une sortie en UTC.
- Si le Gateway local loopback implicite demande un appairage, se ferme pendant la connexion, ou expire avant que `logs.tail` ne réponde, `openclaw logs` revient automatiquement au fichier journal du Gateway configuré. Les cibles `--url` explicites n’utilisent pas ce repli.
- `openclaw logs --follow` ne suit pas les replis vers fichier configuré après des échecs RPC du Gateway local implicite. Sur Linux, il utilise le journal user-systemd actif du Gateway par PID quand il est disponible et affiche la source de journal sélectionnée ; sinon, il continue de réessayer le Gateway en direct au lieu de suivre un fichier adjacent potentiellement obsolète.
- Lors de l’utilisation de `--follow`, les déconnexions transitoires du gateway (fermeture WebSocket, expiration, perte de connexion) déclenchent une reconnexion automatique avec backoff exponentiel (jusqu’à 8 tentatives, limité à 30 s entre les tentatives). Un avertissement est écrit sur stderr à chaque nouvelle tentative, et un avis `[logs] gateway reconnected` est écrit dès qu’une interrogation réussit. En mode `--json`, l’avertissement de nouvelle tentative et la transition de reconnexion sont tous deux émis sous forme d’enregistrements `{"type":"notice"}` sur stderr. Les erreurs non récupérables (échec d’authentification, mauvaise configuration) se terminent toujours immédiatement.

## Connexe

- [Référence CLI](/fr/cli)
- [Journalisation Gateway](/fr/gateway/logging)
