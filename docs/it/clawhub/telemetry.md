---
read_when:
    - Lavori in corso sui controlli di telemetria e privacy
    - Domande sui dati raccolti
summary: Telemetria di installazione raccolta dalla CLI di ClawHub e modalità per disattivarla.
x-i18n:
    generated_at: "2026-07-16T14:11:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetria

ClawHub utilizza una telemetria CLI minima per calcolare il numero aggregato di installazioni.

## Quando viene raccolta la telemetria

La telemetria viene inviata solo quando:

- È stato effettuato l'accesso nella CLI.
- Viene eseguito `clawhub install <slug>`.
- La telemetria **non è disabilitata** (vedere «Come disabilitare la telemetria» di seguito).

Se non è stato effettuato l'accesso, non viene segnalato nulla.

## Cosa raccogliamo

Per ogni `clawhub install` segnalato, la CLI invia un singolo evento di installazione secondo il principio del massimo impegno.

L'evento include:

- `slug`: lo slug della skill installata.
- `version`: la versione installata, quando nota.

### Cosa _non_ raccogliamo

- Nessun percorso di cartella o identificatore derivato dalle cartelle.
- Nessun contenuto dei file.
- Nessun log delle singole esecuzioni, prompt o altro output della CLI.

## Conteggi delle installazioni

ClawHub mantiene contatori aggregati per ciascuna skill:

- `installsAllTime`: utenti unici che hanno segnalato almeno un'installazione della skill tramite CLI.
- `installsCurrent`: utenti unici che hanno segnalato un'installazione e non hanno eliminato i propri
  dati di telemetria.

## Trasparenza e controlli per l'utente

Sono visibili a tutti solo i **contatori aggregati delle installazioni**.

L'eliminazione dell'account comporta anche l'eliminazione dei dati di telemetria.

## Come disabilitare la telemetria

Impostare la variabile di ambiente:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Con questa impostazione, la CLI non invierà dati di telemetria sulle installazioni.
