---
read_when:
    - Stai aggiornando OpenClaw
    - Qualcosa si rompe dopo un aggiornamento
summary: Aggiornare OpenClaw in sicurezza (installazione globale o dal sorgente), più strategia di rollback
title: Aggiornamento
x-i18n:
    generated_at: "2026-04-05T13:56:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: b40429d38ca851be4fdf8063ed425faf4610a4b5772703e0481c5f1fb588ba58
    source_path: install/updating.md
    workflow: 15
---

# Aggiornamento

Mantieni OpenClaw aggiornato.

## Consigliato: `openclaw update`

Il modo più rapido per aggiornare. Rileva il tuo tipo di installazione (npm o git), recupera l'ultima versione, esegue `openclaw doctor` e riavvia il gateway.

```bash
openclaw update
```

Per cambiare canale o puntare a una versione specifica:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # anteprima senza applicare
```

`--channel beta` preferisce beta, ma il runtime ripiega su stable/latest quando
il tag beta è assente o più vecchio dell'ultima release stable. Usa `--tag beta`
se vuoi il dist-tag npm beta grezzo per un aggiornamento una tantum del pacchetto.

Vedi [Canali di sviluppo](/install/development-channels) per la semantica dei canali.

## Alternativa: rieseguire l'installer

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Aggiungi `--no-onboard` per saltare l'onboarding. Per le installazioni dal sorgente, passa `--install-method git --no-onboard`.

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

| Canale   | Comportamento                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| `stable` | Attende `stableDelayHours`, poi applica con jitter deterministico distribuito su `stableJitterHours` (rilascio distribuito). |
| `beta`   | Controlla ogni `betaCheckIntervalHours` (predefinito: ogni ora) e applica immediatamente.                         |
| `dev`    | Nessuna applicazione automatica. Usa `openclaw update` manualmente.                                                |

Il gateway registra anche un suggerimento di aggiornamento all'avvio (disabilitalo con `update.checkOnStart: false`).

## Dopo l'aggiornamento

<Steps>

### Esegui doctor

```bash
openclaw doctor
```

Migra la configurazione, verifica le policy DM e controlla lo stato del gateway. Dettagli: [Doctor](/gateway/doctor)

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

Suggerimento: `npm view openclaw version` mostra la versione attualmente pubblicata.

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
- Controlla: [Risoluzione dei problemi](/gateway/troubleshooting)
- Chiedi su Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Correlati

- [Panoramica dell'installazione](/install) — tutti i metodi di installazione
- [Doctor](/gateway/doctor) — controlli di stato dopo gli aggiornamenti
- [Migrazione](/install/migrating) — guide alla migrazione delle versioni principali
