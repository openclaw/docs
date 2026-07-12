---
read_when:
    - Vous utilisez le plugin d’appels vocaux et souhaitez disposer de tous les points d’entrée de la CLI
    - Vous avez besoin de tableaux des options et des valeurs par défaut pour setup, smoke, call, continue, speak, dtmf, end, status, tail, latency, expose et start
summary: Référence de la CLI pour `openclaw voicecall` (interface de commandes du plugin d’appels vocaux)
title: Appel vocal
x-i18n:
    generated_at: "2026-07-12T15:10:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: aec445886cccb79c9212dd9f1f448ff9634274deb380632be786478c9bb29670
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` est une commande fournie par un plugin. Elle n’apparaît que lorsque le
plugin d’appel vocal est installé et activé.

Lorsque le Gateway est en cours d’exécution, les commandes opérationnelles (`call`, `start`,
`continue`, `speak`, `dtmf`, `end`, `status`) sont acheminées vers l’environnement
d’exécution des appels vocaux de ce Gateway. Si aucun Gateway n’est accessible, elles se
rabattent sur un environnement d’exécution CLI autonome.

## Sous-commandes

```bash
openclaw voicecall setup    [--json]
openclaw voicecall smoke    [-t <phone>] [--message <text>] [--mode <m>] [--yes] [--json]
openclaw voicecall call     -m <text> [-t <phone>] [--mode <m>]
openclaw voicecall start    --to <phone> [--message <text>] [--mode <m>]
openclaw voicecall continue --call-id <id> --message <text>
openclaw voicecall speak    --call-id <id> --message <text>
openclaw voicecall dtmf     --call-id <id> --digits <digits>
openclaw voicecall end      --call-id <id>
openclaw voicecall status   [--call-id <id>] [--json]
openclaw voicecall tail     [--file <path>] [--since <n>] [--poll <ms>]
openclaw voicecall latency  [--file <path>] [--last <n>]
openclaw voicecall expose   [--mode <m>] [--path <p>] [--port <port>] [--serve-path <p>]
```

| Sous-commande | Description                                                                  |
| ------------- | ---------------------------------------------------------------------------- |
| `setup`       | Affiche les vérifications de disponibilité du fournisseur et du webhook.     |
| `smoke`       | Exécute les vérifications de disponibilité ; passe un appel de test réel uniquement avec `--yes`. |
| `call`        | Lance un appel vocal sortant.                                                |
| `start`       | Alias de `call` avec `--to` obligatoire et `--message` facultatif.           |
| `continue`    | Prononce un message et attend la réponse suivante.                           |
| `speak`       | Prononce un message sans attendre de réponse.                                |
| `dtmf`        | Envoie des chiffres DTMF à un appel actif.                                   |
| `end`         | Raccroche un appel actif.                                                    |
| `status`      | Examine les appels actifs (ou un appel avec `--call-id`).                    |
| `tail`        | Suit `calls.jsonl` (utile pendant les tests du fournisseur).                 |
| `latency`     | Résume les métriques de latence des échanges à partir de `calls.jsonl`.      |
| `expose`      | Active ou désactive le mode serve/funnel de Tailscale pour le point de terminaison du webhook. |

## Configuration et test rapide

### `setup`

Affiche par défaut des vérifications de disponibilité lisibles par un humain. Utilisez `--json` pour les scripts.

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

Exécute les mêmes vérifications de disponibilité. Passe un véritable appel téléphonique uniquement lorsque
`--to` et `--yes` sont tous deux présents.

| Option             | Valeur par défaut                | Description                                         |
| ------------------ | -------------------------------- | --------------------------------------------------- |
| `-t, --to <phone>` | (aucune)                         | Numéro de téléphone à appeler pour un test réel.    |
| `--message <text>` | `OpenClaw voice call smoke test.` | Message à prononcer pendant l’appel de test.         |
| `--mode <mode>`    | `notify`                         | Mode d’appel : `notify` ou `conversation`.          |
| `--yes`            | `false`                          | Passe effectivement l’appel sortant réel.           |
| `--json`           | `false`                          | Affiche du JSON lisible par une machine.             |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # simulation
openclaw voicecall smoke --to "+15555550123" --yes  # appel de notification réel
```

<Note>
Pour les fournisseurs externes (`plivo`, `telnyx`, `twilio`), `setup` et `smoke` nécessitent une URL de webhook publique provenant de `publicUrl`, d’un tunnel ou d’une exposition Tailscale. Une adresse de bouclage ou un repli vers un mode serve privé est refusé, car les opérateurs ne peuvent pas y accéder.
</Note>

## Cycle de vie d’un appel

### `call`

Lance un appel vocal sortant.

| Option                 | Obligatoire | Valeur par défaut | Description                                                                        |
| ---------------------- | ----------- | ----------------- | ---------------------------------------------------------------------------------- |
| `-m, --message <text>` | oui         | (aucune)          | Message à prononcer lorsque l’appel est établi.                                    |
| `-t, --to <phone>`     | non         | config `toNumber` | Numéro de téléphone E.164 à appeler.                                                |
| `--mode <mode>`        | non         | `conversation`    | Mode d’appel : `notify` (raccrocher après le message) ou `conversation` (rester en ligne). |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

Alias de `call` avec une autre forme d’options par défaut.

| Option             | Obligatoire | Valeur par défaut | Description                                     |
| ------------------ | ----------- | ----------------- | ----------------------------------------------- |
| `--to <phone>`     | oui         | (aucune)          | Numéro de téléphone à appeler.                  |
| `--message <text>` | non         | (aucune)          | Message à prononcer lorsque l’appel est établi. |
| `--mode <mode>`    | non         | `conversation`    | Mode d’appel : `notify` ou `conversation`.      |

### `continue`

Prononce un message et attend une réponse.

| Option             | Obligatoire | Description          |
| ------------------ | ----------- | -------------------- |
| `--call-id <id>`   | oui         | Identifiant d’appel. |
| `--message <text>` | oui         | Message à prononcer. |

### `speak`

Prononce un message sans attendre de réponse.

| Option             | Obligatoire | Description          |
| ------------------ | ----------- | -------------------- |
| `--call-id <id>`   | oui         | Identifiant d’appel. |
| `--message <text>` | oui         | Message à prononcer. |

### `dtmf`

Envoie des chiffres DTMF à un appel actif.

| Option              | Obligatoire | Description                                                   |
| ------------------- | ----------- | ------------------------------------------------------------- |
| `--call-id <id>`    | oui         | Identifiant d’appel.                                          |
| `--digits <digits>` | oui         | Chiffres DTMF (par exemple `ww123456#` pour insérer des attentes). |

### `end`

Raccroche un appel actif.

| Option           | Obligatoire | Description          |
| ---------------- | ----------- | -------------------- |
| `--call-id <id>` | oui         | Identifiant d’appel. |

### `status`

Examine les appels actifs.

| Option           | Valeur par défaut | Description                            |
| ---------------- | ----------------- | -------------------------------------- |
| `--call-id <id>` | (aucune)          | Limite la sortie à un seul appel.      |
| `--json`         | `false`           | Affiche du JSON lisible par une machine. |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## Journaux et métriques

### `tail`

Suit le journal JSONL des appels vocaux. Affiche les dernières lignes indiquées par `--since` au démarrage, puis
diffuse les nouvelles lignes à mesure qu’elles sont écrites.

| Option          | Valeur par défaut                  | Description                                     |
| --------------- | ---------------------------------- | ----------------------------------------------- |
| `--file <path>` | résolu depuis le stockage du plugin | Chemin vers `calls.jsonl`.                      |
| `--since <n>`   | `25`                               | Lignes à afficher avant de commencer le suivi.  |
| `--poll <ms>`   | `250` (minimum 50)                 | Intervalle d’interrogation en millisecondes.    |

### `latency`

Résume les métriques de latence des échanges et d’attente d’écoute à partir de `calls.jsonl`. La sortie est
du JSON contenant des résumés `recordsScanned`, `turnLatency` et `listenWait`.

| Option          | Valeur par défaut                  | Description                                  |
| --------------- | ---------------------------------- | -------------------------------------------- |
| `--file <path>` | résolu depuis le stockage du plugin | Chemin vers `calls.jsonl`.                   |
| `--last <n>`    | `200` (minimum 1)                  | Nombre d’enregistrements récents à analyser. |

## Exposition des webhooks

### `expose`

Active, désactive ou modifie la configuration serve/funnel de Tailscale pour le
webhook vocal.

| Option                | Valeur par défaut                              | Description                                           |
| --------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| `--mode <mode>`       | `funnel`                                       | `off`, `serve` (tailnet) ou `funnel` (public).        |
| `--path <path>`       | config `tailscale.path` ou `--serve-path`      | Chemin Tailscale à exposer.                           |
| `--port <port>`       | config `serve.port` ou `3334`                  | Port local du webhook.                                |
| `--serve-path <path>` | config `serve.path` ou `/voice/webhook`        | Chemin local du webhook.                              |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
Exposez le point de terminaison du webhook uniquement aux réseaux auxquels vous faites confiance. Préférez Tailscale Serve à Funnel lorsque cela est possible.
</Warning>

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Plugin d’appel vocal](/fr/plugins/voice-call)
