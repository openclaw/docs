---
read_when:
    - Vous souhaitez connecter les événements Pub/Sub de Gmail à OpenClaw
    - Vous avez besoin de la liste complète des options et de leurs valeurs par défaut
summary: Référence de la CLI pour `openclaw webhooks` (configuration et exécuteur Gmail Pub/Sub)
title: Webhooks
x-i18n:
    generated_at: "2026-07-12T02:33:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fff0ac2ce247402f45523eda0b5cdd551bd65212636118698e45cb8740236c
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Assistants et intégrations Webhook. Actuellement, cette interface est limitée aux flux Gmail Pub/Sub reposant sur l’observateur `gog` intégré.

## Sous-commandes

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| Sous-commande  | Description                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `gmail setup`  | Assistant de configuration initiale : surveillance Gmail, sujet/abonnement Pub/Sub et transmission au hook OpenClaw. |
| `gmail run`    | Exécute `gog watch serve` et la boucle de renouvellement automatique de la surveillance au premier plan.         |

<Note>
Le Gateway démarre également automatiquement `gog gmail watch serve` au démarrage lorsque `hooks.enabled=true` et que `hooks.gmail.account` est défini (par `gmail setup`). `gmail run` exécute la même logique au premier plan, ce qui est utile pour le débogage ou lorsque l’observateur du Gateway est désactivé. Consultez [Intégration Gmail Pub/Sub](/fr/automation/cron-jobs#gmail-pubsub-integration) pour plus de détails sur le démarrage automatique et sur `OPENCLAW_SKIP_GMAIL_WATCHER`, qui permet de le désactiver.
</Note>

## `webhooks gmail setup`

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

Installe `gcloud` et `gog` s’ils sont absents, authentifie `gcloud`, crée le sujet et l’abonnement Pub/Sub, démarre la surveillance Gmail et écrit la configuration `hooks.gmail` avec `hooks.enabled=true`. Affiche `Next: openclaw webhooks gmail run`.

### Obligatoire

| Option              | Description                  |
| ------------------- | ---------------------------- |
| `--account <email>` | Compte Gmail à surveiller.   |

### Options Pub/Sub

| Option                  | Valeur par défaut     | Description                                                                                                                                                                             |
| ----------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--project <id>`        | (aucune)              | Identifiant du projet GCP (propriétaire du client OAuth). Utilise à défaut l’identifiant du projet propre au sujet, puis le projet déterminé à partir des identifiants `gog`.            |
| `--topic <name>`        | `gog-gmail-watch`     | Nom du sujet Pub/Sub.                                                                                                                                                                   |
| `--subscription <name>` | `gog-gmail-watch-push` | Nom de l’abonnement Pub/Sub.                                                                                                                                                            |
| `--label <label>`       | `INBOX`               | Libellé Gmail à surveiller.                                                                                                                                                             |
| `--push-endpoint <url>` | (aucune)              | Point de terminaison push Pub/Sub explicite. Remplace Tailscale.                                                                                                                        |

### Options de transmission à OpenClaw

| Option                 | Valeur par défaut                                  | Description                         |
| ---------------------- | -------------------------------------------------- | ----------------------------------- |
| `--hook-url <url>`     | Construite à partir de `hooks.path` et du port du Gateway | URL du Webhook OpenClaw.       |
| `--hook-token <token>` | `hooks.token`, ou un jeton généré                  | Jeton du Webhook OpenClaw.          |
| `--push-token <token>` | Jeton généré                                       | Jeton push transmis à `gog watch serve`. |

### Options de `gog watch serve`

| Option                | Valeur par défaut | Description                                                                                                                                                                                                                 |
| --------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`       | Hôte d’écoute de `gog watch serve`.                                                                                                                                                                                         |
| `--port <port>`       | `8788`            | Port de `gog watch serve`.                                                                                                                                                                                                  |
| `--path <path>`       | `/gmail-pubsub`   | Chemin de `gog watch serve`. Forcé à `/` lorsque Tailscale est activé sans cible explicite, car Tailscale supprime le chemin avant d’effectuer le proxy.                                                                     |
| `--include-body`      | `true`            | Inclut des extraits du corps des e-mails. Aucune option de CLI ne permet de désactiver cette fonctionnalité ; définissez plutôt `hooks.gmail.includeBody: false` dans la configuration.                                     |
| `--max-bytes <n>`     | `20000`           | Nombre maximal d’octets par extrait de corps.                                                                                                                                                                               |
| `--renew-minutes <n>` | `720` (12 h)      | Renouvelle la surveillance Gmail toutes les N minutes.                                                                                                                                                                      |

### Exposition via Tailscale

| Option                    | Valeur par défaut | Description                                                                      |
| ------------------------- | ----------------- | -------------------------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel`          | Expose le point de terminaison push via Tailscale : `funnel`, `serve` ou `off`.  |
| `--tailscale-path <path>` | (aucune)          | Chemin pour le mode serve/funnel de Tailscale.                                   |
| `--tailscale-target <t>`  | (aucune)          | Cible serve/funnel de Tailscale (port, `host:port` ou URL).                      |

### Sortie

| Option   | Description                                                  |
| -------- | ------------------------------------------------------------ |
| `--json` | Affiche un résumé lisible par une machine plutôt que du texte. |

## `webhooks gmail run`

```bash
openclaw webhooks gmail run --account you@example.com
```

Exécute `gog watch serve` et la boucle de renouvellement automatique de la surveillance au premier plan, en redémarrant `gog watch serve` après un délai de 2 s s’il s’arrête de manière inattendue.

`run` accepte les mêmes options Pub/Sub, de transmission à OpenClaw, de `gog watch serve` et de Tailscale que `setup`, à l’exception des points suivants :

- `--account` est **facultatif** avec `run` ; sa valeur provient par défaut de `hooks.gmail.account`.
- `run` n’accepte **pas** `--project`, `--push-endpoint` ni `--json`.
- Chaque option utilise par défaut la valeur de configuration `hooks.gmail.*` correspondante (écrite par `setup`), puis la même valeur par défaut intégrée que celle utilisée par `setup`, à une exception près : avec `run`, `--tailscale` utilise par défaut `off` (et non `funnel`) lorsque ni l’option ni `hooks.gmail.tailscale.mode` ne sont définis.

| Catégorie                 | Options                                                                          |
| ------------------------- | -------------------------------------------------------------------------------- |
| Pub/Sub                   | `--account`, `--topic`, `--subscription`, `--label`                              |
| Transmission à OpenClaw   | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve`         | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale                 | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
Avec `run`, la valeur de `--topic` est le chemin complet du sujet Pub/Sub (`projects/.../topics/...`), et non simplement son nom court.
</Note>

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Automatisation par Webhook](/fr/automation/cron-jobs)
- [Intégration Gmail Pub/Sub](/fr/automation/cron-jobs#gmail-pubsub-integration)
