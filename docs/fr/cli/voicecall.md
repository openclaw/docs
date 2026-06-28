---
read_when:
    - Vous utilisez le Plugin voice-call et souhaitez chaque point d’entrée CLI
    - Vous avez besoin de tableaux d’options et de valeurs par défaut pour setup, smoke, call, continue, speak, dtmf, end, status, tail, latency, expose et start
summary: Référence CLI pour `openclaw voicecall` (surface de commande du Plugin d’appel vocal)
title: Appel vocal
x-i18n:
    generated_at: "2026-05-11T20:29:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24013c06bf3e688bd86caa407bf20dddabe0dff60a400ed4f23478de62308634
    source_path: cli/voicecall.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw voicecall`

`voicecall` est une commande fournie par un Plugin. Elle apparaît uniquement lorsque le Plugin d’appel vocal est installé et activé.

Lorsque le Gateway est en cours d’exécution, les commandes opérationnelles (`call`, `start`, `continue`, `speak`, `dtmf`, `end`, `status`) sont routées vers le runtime d’appel vocal de ce Gateway. Si aucun Gateway n’est joignable, elles se replient sur un runtime CLI autonome.

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

| Sous-commande | Description                                                               |
| ------------- | ------------------------------------------------------------------------- |
| `setup`       | Affiche les vérifications de disponibilité du fournisseur et du Webhook.  |
| `smoke`       | Exécute les vérifications de disponibilité ; passe un appel de test réel uniquement avec `--yes`. |
| `call`        | Lance un appel vocal sortant.                                             |
| `start`       | Alias de `call` avec `--to` requis et `--message` facultatif.             |
| `continue`    | Prononce un message et attend la réponse suivante.                        |
| `speak`       | Prononce un message sans attendre de réponse.                             |
| `dtmf`        | Envoie des chiffres DTMF à un appel actif.                                |
| `end`         | Raccroche un appel actif.                                                 |
| `status`      | Inspecte les appels actifs (ou un seul via `--call-id`).                  |
| `tail`        | Suit `calls.jsonl` (utile pendant les tests de fournisseur).              |
| `latency`     | Résume les métriques de latence par tour depuis `calls.jsonl`.            |
| `expose`      | Active/désactive Tailscale Serve/Funnel pour le point de terminaison Webhook. |

## Configuration et smoke

### `setup`

Affiche par défaut des vérifications de disponibilité lisibles par un humain. Passez `--json` pour les scripts.

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

Exécute les mêmes vérifications de disponibilité. Aucun véritable appel téléphonique n’est passé sauf si `--to` et `--yes` sont tous deux présents.

| Indicateur         | Par défaut                       | Description                                      |
| ------------------ | -------------------------------- | ------------------------------------------------ |
| `-t, --to <phone>` | (aucun)                          | Numéro de téléphone à appeler pour un smoke réel. |
| `--message <text>` | `OpenClaw voice call smoke test.` | Message à prononcer pendant l’appel smoke.       |
| `--mode <mode>`    | `notify`                         | Mode d’appel : `notify` ou `conversation`.       |
| `--yes`            | `false`                          | Passe réellement l’appel sortant.                |
| `--json`           | `false`                          | Affiche du JSON lisible par machine.             |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # simulation
openclaw voicecall smoke --to "+15555550123" --yes  # appel notify réel
```

<Note>
Pour les fournisseurs externes (`twilio`, `telnyx`, `plivo`), `setup` et `smoke` nécessitent une URL Webhook publique provenant de `publicUrl`, d’un tunnel ou d’une exposition Tailscale. Un repli vers une adresse de boucle locale ou un serveur privé est rejeté, car les opérateurs ne peuvent pas l’atteindre.
</Note>

## Cycle de vie des appels

### `call`

Lance un appel vocal sortant.

| Indicateur             | Requis | Par défaut       | Description                                                                |
| ---------------------- | ------ | ---------------- | -------------------------------------------------------------------------- |
| `-m, --message <text>` | oui    | (aucun)          | Message à prononcer lorsque l’appel se connecte.                           |
| `-t, --to <phone>`     | non    | config `toNumber` | Numéro de téléphone E.164 à appeler.                                       |
| `--mode <mode>`        | non    | `conversation`   | Mode d’appel : `notify` (raccrocher après le message) ou `conversation` (rester ouvert). |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

Alias de `call` avec une forme d’indicateurs par défaut différente.

| Indicateur         | Requis | Par défaut     | Description                                      |
| ------------------ | ------ | -------------- | ------------------------------------------------ |
| `--to <phone>`     | oui    | (aucun)        | Numéro de téléphone à appeler.                   |
| `--message <text>` | non    | (aucun)        | Message à prononcer lorsque l’appel se connecte. |
| `--mode <mode>`    | non    | `conversation` | Mode d’appel : `notify` ou `conversation`.       |

### `continue`

Prononce un message et attend une réponse.

| Indicateur         | Requis | Description             |
| ------------------ | ------ | ----------------------- |
| `--call-id <id>`   | oui    | ID d’appel.             |
| `--message <text>` | oui    | Message à prononcer.    |

### `speak`

Prononce un message sans attendre de réponse.

| Indicateur         | Requis | Description             |
| ------------------ | ------ | ----------------------- |
| `--call-id <id>`   | oui    | ID d’appel.             |
| `--message <text>` | oui    | Message à prononcer.    |

### `dtmf`

Envoie des chiffres DTMF à un appel actif.

| Indicateur          | Requis | Description                                      |
| ------------------- | ------ | ------------------------------------------------ |
| `--call-id <id>`    | oui    | ID d’appel.                                      |
| `--digits <digits>` | oui    | Chiffres DTMF (par ex. `ww123456#` pour les attentes). |

### `end`

Raccroche un appel actif.

| Indicateur       | Requis | Description |
| ---------------- | ------ | ----------- |
| `--call-id <id>` | oui    | ID d’appel. |

### `status`

Inspecte les appels actifs.

| Indicateur       | Par défaut | Description                         |
| ---------------- | ---------- | ----------------------------------- |
| `--call-id <id>` | (aucun)    | Limite la sortie à un seul appel.   |
| `--json`         | `false`    | Affiche du JSON lisible par machine. |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## Journaux et métriques

### `tail`

Suit le journal JSONL d’appel vocal. Affiche les dernières lignes `--since` au démarrage, puis diffuse les nouvelles lignes à mesure qu’elles sont écrites.

| Indicateur       | Par défaut                 | Description                              |
| ---------------- | -------------------------- | ---------------------------------------- |
| `--file <path>`  | résolu depuis le magasin du Plugin | Chemin vers `calls.jsonl`.        |
| `--since <n>`    | `25`                       | Lignes à afficher avant le suivi.        |
| `--poll <ms>`    | `250` (minimum 50)         | Intervalle d’interrogation en millisecondes. |

### `latency`

Résume les métriques de latence par tour et d’attente d’écoute depuis `calls.jsonl`. La sortie est du JSON avec les résumés `recordsScanned`, `turnLatency` et `listenWait`.

| Indicateur      | Par défaut                 | Description                              |
| --------------- | -------------------------- | ---------------------------------------- |
| `--file <path>` | résolu depuis le magasin du Plugin | Chemin vers `calls.jsonl`.        |
| `--last <n>`    | `200` (minimum 1)          | Nombre d’enregistrements récents à analyser. |

## Exposition des Webhooks

### `expose`

Active, désactive ou modifie la configuration Tailscale Serve/Funnel pour le Webhook vocal.

| Indicateur            | Par défaut                                | Description                                      |
| --------------------- | ---------------------------------------- | ------------------------------------------------ |
| `--mode <mode>`       | `funnel`                                 | `off`, `serve` (tailnet) ou `funnel` (public).   |
| `--path <path>`       | config `tailscale.path` ou `--serve-path` | Chemin Tailscale à exposer.                     |
| `--port <port>`       | config `serve.port` ou `3334`            | Port Webhook local.                              |
| `--serve-path <path>` | config `serve.path` ou `/voice/webhook`  | Chemin Webhook local.                            |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
N’exposez le point de terminaison Webhook qu’aux réseaux auxquels vous faites confiance. Privilégiez Tailscale Serve plutôt que Funnel lorsque c’est possible.
</Warning>

## Connexe

- [Référence CLI](/fr/cli)
- [Plugin d’appel vocal](/fr/plugins/voice-call)
