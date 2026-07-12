---
read_when:
    - Vous souhaitez vérifier rapidement l’état de santé du Gateway en cours d’exécution
summary: Référence de la CLI pour `openclaw health` (instantané de l’état du Gateway via RPC)
title: Santé
x-i18n:
    generated_at: "2026-07-12T02:42:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a26ce5ade9ab56c9751c3dde814c38a1e01e74d91c2fd57e56d3c44ca529d0d8
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Récupère un instantané de l’état de santé du Gateway en cours d’exécution via RPC WebSocket (sans connexion directe de la CLI aux sockets des canaux).

## Options

| Option           | Valeur par défaut | Description                                                                                                                     |
| ---------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `--json`         | `false`           | Affiche du JSON lisible par une machine plutôt que du texte.                                                                    |
| `--timeout <ms>` | `10000`           | Délai d’expiration de la connexion, en millisecondes.                                                                            |
| `--verbose`      | `false`           | Force une sonde en direct et étend la sortie à tous les comptes et agents configurés.                                            |
| `--debug`        | `false`           | Alias de `--verbose`.                                                                                                            |

Exemples :

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

## Comportement

- Sans `--verbose`, le Gateway peut renvoyer un instantané mis en cache (valide pendant 60 secondes au maximum et identique à l’état d’exécution des canaux en direct), puis l’actualiser en arrière-plan pour le prochain appelant.
- `--verbose` force une sonde en direct (sondes de compte pour chaque canal), affiche les détails de connexion au Gateway et étend la sortie lisible par un humain à tous les comptes et agents configurés, au lieu du seul agent par défaut.
- `--json` renvoie toujours l’instantané complet : canaux, sondes par compte, état de chargement des plugins, état de quarantaine du moteur de contexte, état du cache des tarifs des modèles, état de santé de la boucle d’événements et magasins de sessions par agent.

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [`openclaw status`](/fr/cli/status) — diagnostic local et sondes des canaux sans instantané complet de l’état de santé
- [État de santé du Gateway](/fr/gateway/health)
