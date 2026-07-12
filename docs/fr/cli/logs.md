---
read_when:
    - Vous devez suivre à distance les journaux du Gateway (sans SSH)
    - Vous souhaitez des lignes de journal au format JSON pour les outils
summary: Référence de la CLI pour `openclaw logs` (suivre les journaux du Gateway via RPC)
title: Journaux
x-i18n:
    generated_at: "2026-07-12T15:08:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c54d7dd7ec46a0ea71cfee0fbe24abf43a3f1207eba3717b40862fb27ed6c9cd
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Affiche en continu les journaux de fichiers du Gateway via RPC. Fonctionne en mode distant.

## Options

- `--limit <n>` : nombre maximal de lignes de journal à renvoyer (valeur par défaut : `200`)
- `--max-bytes <n>` : nombre maximal d’octets à lire dans le fichier journal (valeur par défaut : `250000`)
- `--follow` : suivre le flux des journaux
- `--interval <ms>` : intervalle d’interrogation pendant le suivi (valeur par défaut : `1000`)
- `--json` : émettre des événements JSON délimités par des lignes
- `--plain` : sortie en texte brut sans mise en forme stylisée
- `--no-color` : désactiver les couleurs ANSI
- `--local-time` : afficher les horodatages dans votre fuseau horaire local (valeur par défaut)
- `--utc` : afficher les horodatages en UTC

## Options RPC partagées du Gateway

- `--url <url>` : URL WebSocket du Gateway
- `--token <token>` : jeton du Gateway
- `--timeout <ms>` : délai d’expiration en ms (valeur par défaut : `30000`)
- `--expect-final` : attendre une réponse finale lorsque l’appel au Gateway est pris en charge par un agent

Fournir `--url` désactive l’application automatique des identifiants de configuration ; incluez explicitement `--token` si le Gateway cible exige une authentification.

## Exemples

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Comportement de repli et de récupération

- Si le Gateway local implicite sur l’interface de bouclage demande un appairage, ferme la connexion pendant son établissement ou atteint le délai d’expiration avant que `logs.tail` ne réponde, `openclaw logs` se rabat automatiquement sur le fichier journal configuré du Gateway. Les cibles `--url` explicites n’utilisent jamais ce mécanisme de repli.
- `--follow` ne se rabat pas sur ce fichier configuré après l’échec d’un appel RPC au Gateway local implicite : un fichier parallèle obsolète pourrait fausser le suivi en direct. Sous Linux, il utilise à la place, lorsqu’il est disponible, le journal du Gateway actif dans l’instance systemd de l’utilisateur, identifié par son PID (la source sélectionnée est affichée) ; sinon, il continue de tenter de se reconnecter au Gateway actif.
- Pendant `--follow`, les déconnexions temporaires (fermeture WebSocket, expiration du délai, perte de connexion) déclenchent une reconnexion automatique avec temporisation exponentielle : jusqu’à 8 tentatives, avec un délai maximal de 30s entre elles. Un avertissement est affiché sur stderr à chaque nouvelle tentative et une notification `[logs] gateway reconnected` est affichée dès qu’une interrogation réussit. En mode `--json`, les deux sont émis sur stderr sous forme d’enregistrements `{"type":"notice"}`. Les erreurs irrécupérables (échec d’authentification, configuration incorrecte) provoquent toujours une sortie immédiate.
- En mode `--follow --json`, les changements de source des journaux sont émis sous forme d’enregistrements `{"type":"meta"}`. Suivez les curseurs séparément pour chaque `sourceKind` : un flux peut passer de la sortie du fichier du Gateway (`sourceKind: "file"`) au journal local de repli (`sourceKind: "journal"`, `localFallback: true`, avec `service.pid`/`service.unit`), puis revenir à la sortie du fichier du Gateway après la récupération. Ne supposez pas qu’une source ou qu’un curseur reste stable pendant toute la session et acceptez les lignes qui se chevauchent lorsque la récupération relit le curseur du fichier du Gateway.

## Voir aussi

- [Vue d’ensemble de la journalisation](/fr/logging)
- [CLI du Gateway](/fr/cli/gateway)
- [Référence de la CLI](/fr/cli)
- [Journalisation du Gateway](/fr/gateway/logging)
