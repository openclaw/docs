---
read_when:
    - Vous devez suivre les journaux du Gateway à distance (sans SSH)
    - Vous souhaitez des lignes de journal au format JSON pour vos outils
summary: Référence de la CLI pour `openclaw logs` (suivi des journaux du Gateway via RPC)
title: Journaux
x-i18n:
    generated_at: "2026-07-12T02:26:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
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
- `--json` : émettre des événements JSON délimités par des sauts de ligne
- `--plain` : sortie en texte brut sans mise en forme stylisée
- `--no-color` : désactiver les couleurs ANSI
- `--local-time` : afficher les horodatages dans votre fuseau horaire local (valeur par défaut)
- `--utc` : afficher les horodatages en UTC

## Options RPC partagées du Gateway

- `--url <url>` : URL WebSocket du Gateway
- `--token <token>` : jeton du Gateway
- `--timeout <ms>` : délai d’expiration en ms (valeur par défaut : `30000`)
- `--expect-final` : attendre une réponse finale lorsque l’appel au Gateway s’appuie sur un agent

Le passage de `--url` ignore les identifiants de configuration appliqués automatiquement ; incluez explicitement `--token` si le Gateway cible exige une authentification.

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

- Si le Gateway local loopback implicite demande un appairage, ferme la connexion pendant son établissement ou expire avant que `logs.tail` ne réponde, `openclaw logs` utilise automatiquement en repli le fichier journal configuré du Gateway. Les cibles `--url` explicites n’utilisent jamais ce mécanisme de repli.
- Après un échec RPC du Gateway local implicite, `--follow` ne se replie pas sur ce fichier configuré : un fichier parallèle obsolète pourrait induire en erreur lors d’un suivi en direct. Sous Linux, la commande utilise à la place, lorsqu’il est disponible, le journal systemd utilisateur du Gateway actif identifié par son PID et affiche la source sélectionnée ; sinon, elle continue de réessayer le Gateway actif.
- Pendant `--follow`, les déconnexions temporaires (fermeture WebSocket, expiration du délai, perte de connexion) déclenchent une reconnexion automatique avec temporisation exponentielle : jusqu’à 8 tentatives, avec un intervalle plafonné à 30 s entre elles. Un avertissement est affiché sur stderr à chaque nouvelle tentative et un avis `[logs] gateway reconnected` est affiché dès qu’une interrogation réussit. En mode `--json`, les deux sont émis sur stderr sous forme d’enregistrements `{"type":"notice"}`. Les erreurs irrécupérables (échec d’authentification, configuration incorrecte) provoquent toujours une sortie immédiate.
- En mode `--follow --json`, les changements de source des journaux sont émis sous forme d’enregistrements `{"type":"meta"}`. Suivez les curseurs séparément pour chaque `sourceKind` : un flux peut passer de la sortie du fichier du Gateway (`sourceKind: "file"`) au journal local de repli (`sourceKind: "journal"`, `localFallback: true`, avec `service.pid`/`service.unit`), puis revenir à la sortie du fichier du Gateway après la récupération. Ne supposez pas que la source ou le curseur reste stable pendant toute la session et acceptez les lignes en double lorsque la récupération relit le curseur du fichier du Gateway.

## Voir aussi

- [Présentation de la journalisation](/fr/logging)
- [CLI du Gateway](/fr/cli/gateway)
- [Référence de la CLI](/fr/cli)
- [Journalisation du Gateway](/fr/gateway/logging)
