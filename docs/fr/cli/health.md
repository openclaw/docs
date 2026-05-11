---
read_when:
    - Vous souhaitez vérifier rapidement l’état de santé du Gateway en cours d’exécution
summary: Référence CLI pour `openclaw health` (instantané de santé du Gateway via RPC)
title: Santé
x-i18n:
    generated_at: "2026-05-11T20:27:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26be7bbbf75c2eca1213fe145fdeeab6fee96798dff457278ac69a20145bf75d
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Récupère l’état de santé depuis le Gateway en cours d’exécution.

## Options

| Indicateur       | Valeur par défaut | Description                                                                      |
| ---------------- | ------- | ------------------------------------------------------------------ |
| `--json`         | `false` | Afficher du JSON lisible par machine plutôt que du texte.                       |
| `--timeout <ms>` | `10000` | Délai d’expiration de la connexion en millisecondes.                                |
| `--verbose`      | `false` | Journalisation détaillée. Force une sonde en direct et développe la sortie par agent. |
| `--debug`        | `false` | Alias de `--verbose`.                                             |

Exemples :

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

Remarques :

- Par défaut, `openclaw health` demande au Gateway en cours d’exécution son instantané d’état de santé. Lorsque le
  Gateway dispose déjà d’un instantané récent mis en cache, il peut renvoyer cette charge utile mise en cache et
  l’actualiser en arrière-plan.
- `--verbose` force une sonde en direct, affiche les détails de connexion au Gateway et développe la
  sortie lisible par l’utilisateur pour tous les comptes et agents configurés.
- La sortie inclut les magasins de sessions par agent lorsque plusieurs agents sont configurés.

## Voir aussi

- [Référence CLI](/fr/cli)
- [État de santé du Gateway](/fr/gateway/health)
