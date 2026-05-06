---
read_when:
    - Vous souhaitez vérifier rapidement l’état de santé du Gateway en cours d’exécution
summary: Référence CLI pour `openclaw health` (instantané d’état du Gateway via RPC)
title: Santé
x-i18n:
    generated_at: "2026-05-06T09:02:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 443684af04efce2c54a6679e13b0bff0a5c1869f85d60fae0e853aed0a362226
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Récupère l’état de santé du Gateway en cours d’exécution.

Options :

- `--json` : sortie lisible par machine
- `--timeout <ms>` : délai d’expiration de la connexion en millisecondes (par défaut `10000`)
- `--verbose` : journalisation détaillée
- `--debug` : alias de `--verbose`

Exemples :

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

Notes :

- Par défaut, `openclaw health` demande au Gateway en cours d’exécution son instantané d’état de santé. Lorsque le
  Gateway dispose déjà d’un instantané mis en cache récent, il peut renvoyer cette charge utile mise en cache et
  l’actualiser en arrière-plan.
- `--verbose` force une sonde en direct, affiche les détails de connexion au Gateway et développe la
  sortie lisible par l’humain pour tous les comptes et agents configurés.
- La sortie inclut les magasins de sessions par agent lorsque plusieurs agents sont configurés.

## Connexe

- [Référence CLI](/fr/cli)
- [État de santé du Gateway](/fr/gateway/health)
