---
read_when:
    - Aggiornamento di OpenClaw
    - Qualcosa si rompe dopo un aggiornamento
summary: Aggiornare OpenClaw in sicurezza (installazione globale o da sorgente), più strategia di rollback
title: Aggiornamento
x-i18n:
    generated_at: "2026-04-24T08:47:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04ed583916ce64c9f60639c8145a46ce5b27ebf5a6dfd09924312d7acfefe1ab
    source_path: install/updating.md
    workflow: 15
---

Mantieni OpenClaw aggiornato.

## Consigliato: `openclaw update`

Il modo più rapido per aggiornare. Rileva il tipo di installazione (npm o git), recupera l'ultima versione, esegue `openclaw doctor` e riavvia il gateway.

```bash
openclaw update
```

Per cambiare canale o puntare a una versione specifica:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # anteprima senza applicare
```

`--channel beta` preferisce beta, ma il runtime usa come fallback stable/latest quando
il tag beta manca o è più vecchio dell'ultima release stable. Usa `--tag beta`
se vuoi il dist-tag npm beta grezzo per un aggiornamento una tantum del pacchetto.

Vedi [Development channels](/it/install/development-channels) per la semantica dei canali.

## Alternativa: esegui di nuovo l'installer

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Aggiungi `--no-onboard` per saltare l'onboarding. Per installazioni da sorgente, passa `--install-method git --no-onboard`.

## Alternativa: npm, pnpm o bun manuale

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Installazioni npm globali possedute da root

Alcune configurazioni npm Linux installano i pacchetti globali in directory possedute da root come
`/usr/lib/node_modules/openclaw`. OpenClaw supporta questa disposizione: il pacchetto installato
viene trattato come di sola lettura a runtime, e le dipendenze runtime dei Plugin inclusi
vengono preparate in una directory runtime scrivibile invece di modificare
l'albero del pacchetto.

Per unità systemd hardenizzate, imposta una directory di staging scrivibile inclusa in
`ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Se `OPENCLAW_PLUGIN_STAGE_DIR` non è impostato, OpenClaw usa `$STATE_DIRECTORY` quando
systemd lo fornisce, poi usa come fallback `~/.openclaw/plugin-runtime-deps`.

## Auto-updater

L'auto-updater è disattivato per impostazione predefinita. Abilitalo in `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Canale | Comportamento |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Attende `stableDelayHours`, poi applica con jitter deterministico distribuito su `stableJitterHours` (rollout distribuito). |
| `beta` | Controlla ogni `betaCheckIntervalHours` (predefinito: ogni ora) e applica immediatamente. |
| `dev` | Nessuna applicazione automatica. Usa `openclaw update` manualmente. |

Il gateway registra anche un suggerimento di aggiornamento all'avvio (disattivalo con `update.checkOnStart: false`).

## Dopo l'aggiornamento

<Steps>

### Esegui doctor

```bash
openclaw doctor
```

Migra la configurazione, controlla i criteri DM e verifica lo stato del gateway. Dettagli: [Doctor](/it/gateway/doctor)

### Riavvia il gateway

```bash
openclaw gateway restart
```

### Verifica

```bash
openclaw health
```

</Steps>

## Rollback

### Fissa una versione (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

Suggerimento: `npm view openclaw version` mostra la versione pubblicata corrente.

### Fissa un commit (sorgente)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Per tornare all'ultima versione: `git checkout main && git pull`.

## Se sei bloccato

- Esegui di nuovo `openclaw doctor` e leggi attentamente l'output.
- Per `openclaw update --channel dev` su checkout da sorgente, l'updater inizializza automaticamente `pnpm` quando necessario. Se vedi un errore di bootstrap pnpm/corepack, installa `pnpm` manualmente (oppure riattiva `corepack`) e riesegui l'aggiornamento.
- Controlla: [Troubleshooting](/it/gateway/troubleshooting)
- Chiedi su Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Correlati

- [Panoramica dell'installazione](/it/install) — tutti i metodi di installazione
- [Doctor](/it/gateway/doctor) — controlli di stato dopo gli aggiornamenti
- [Migrazione](/it/install/migrating) — guide di migrazione per versioni principali
