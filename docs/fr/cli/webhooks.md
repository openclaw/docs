---
read_when:
    - Vous souhaitez connecter les événements Pub/Sub de Gmail à OpenClaw
    - Vous avez besoin de la liste complète des options et de leurs valeurs par défaut
summary: Référence de la CLI pour `openclaw webhooks` (configuration Gmail Pub/Sub et exécuteur)
title: Webhooks
x-i18n:
    generated_at: "2026-05-11T20:29:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9ce17ca78bbe9836edd4643a262833e52cceb27f441d5922c036777e47a6f74
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Assistants et intégrations Webhook. Aujourd’hui, cette surface est limitée aux flux Gmail Pub/Sub qui s’intègrent à l’observateur `gog` intégré.

## Sous-commandes

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| Sous-commande | Description                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| `gmail setup` | Configurer la surveillance Gmail, le sujet/l’abonnement Pub/Sub et la cible de livraison Webhook OpenClaw. |
| `gmail run`   | Exécuter `gog watch serve` plus la boucle de renouvellement automatique de la surveillance.               |

## `webhooks gmail setup`

Configurer la surveillance Gmail, Pub/Sub et la livraison Webhook OpenClaw.

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### Requis

| Option              | Description               |
| ------------------- | ------------------------- |
| `--account <email>` | Compte Gmail à surveiller. |

### Options Pub/Sub

| Option                  | Valeur par défaut     | Description                                                    |
| ----------------------- | --------------------- | -------------------------------------------------------------- |
| `--project <id>`        | (aucune)              | ID du projet GCP (le propriétaire du client OAuth).            |
| `--topic <name>`        | `gog-gmail-watch`     | Nom du sujet Pub/Sub.                                          |
| `--subscription <name>` | `gog-gmail-watch-push` | Nom de l’abonnement Pub/Sub.                                   |
| `--label <label>`       | `INBOX`               | Libellé Gmail à surveiller.                                    |
| `--push-endpoint <url>` | (aucune)              | Point de terminaison push Pub/Sub explicite. Remplace Tailscale. |

### Options de livraison OpenClaw

| Option                 | Valeur par défaut | Description                                      |
| ---------------------- | ----------------- | ------------------------------------------------ |
| `--hook-url <url>`     | (aucune)          | URL Webhook OpenClaw.                            |
| `--hook-token <token>` | (aucune)          | Jeton Webhook OpenClaw.                          |
| `--push-token <token>` | (aucune)          | Jeton push transmis à `gog watch serve`.         |

### Options `gog watch serve`

| Option                | Valeur par défaut | Description                                                                    |
| --------------------- | ----------------- | ------------------------------------------------------------------------------ |
| `--bind <host>`       | `127.0.0.1`       | Hôte de liaison de `gog watch serve`.                                          |
| `--port <port>`       | `8788`            | Port de `gog watch serve`.                                                     |
| `--path <path>`       | `/gmail-pubsub`   | Chemin de `gog watch serve`.                                                   |
| `--include-body`      | `true`            | Inclure les extraits du corps des e-mails. Passez `--no-include-body` pour désactiver. |
| `--max-bytes <n>`     | `20000`           | Nombre maximal d’octets par extrait de corps.                                  |
| `--renew-minutes <n>` | `720` (12h)       | Renouveler la surveillance Gmail toutes les N minutes.                         |

### Exposition Tailscale

| Option                    | Valeur par défaut | Description                                                                  |
| ------------------------- | ----------------- | ---------------------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel`          | Exposer le point de terminaison push via Tailscale : `funnel`, `serve` ou `off`. |
| `--tailscale-path <path>` | (aucune)          | Chemin pour Tailscale serve/funnel.                                           |
| `--tailscale-target <t>`  | (aucune)          | Cible Tailscale serve/funnel (port, `host:port` ou URL).                     |

### Sortie

| Option   | Description                                                  |
| -------- | ------------------------------------------------------------ |
| `--json` | Afficher un résumé lisible par machine au lieu de texte.     |

## `webhooks gmail run`

Exécuter `gog watch serve` plus la boucle de renouvellement automatique de la surveillance au premier plan.

```bash
openclaw webhooks gmail run --account you@example.com
```

`run` accepte les mêmes options `gog watch serve`, de livraison OpenClaw, Pub/Sub et Tailscale que `setup`, sauf :

- `--account` est **facultatif** sur `run` (il revient au compte configuré).
- `run` n’accepte **pas** `--project`, `--push-endpoint` ni `--json`.
- Les options de `run` n’ont pas de valeurs par défaut intégrées ; les valeurs manquantes reviennent aux valeurs écrites par `setup`.

| Catégorie          | Options                                                                          |
| ------------------ | -------------------------------------------------------------------------------- |
| Pub/Sub            | `--account`, `--topic`, `--subscription`, `--label`                              |
| Livraison OpenClaw | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve`  | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale          | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
Pour `run`, la valeur `--topic` est le chemin complet du sujet Pub/Sub (`projects/.../topics/...`), et pas seulement le nom court du sujet.
</Note>

## Flux de bout en bout

Consultez [l’intégration Gmail Pub/Sub](/fr/automation/cron-jobs#gmail-pubsub-integration) pour la configuration du projet GCP, d’OAuth et côté Gateway qui va avec ces commandes CLI.

## Connexe

- [Référence CLI](/fr/cli)
- [Automatisation Webhook](/fr/automation/cron-jobs)
- [Gmail Pub/Sub](/fr/automation/cron-jobs#gmail-pubsub-integration)
