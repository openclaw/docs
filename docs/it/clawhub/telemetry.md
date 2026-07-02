---
read_when:
    - Lavorare sui controlli di telemetria / privacy
    - Domande su quali dati vengono raccolti
summary: Telemetria di installazione raccolta dalla CLI di ClawHub e come disattivarla.
x-i18n:
    generated_at: "2026-07-02T14:05:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetria

ClawHub usa una telemetria CLI minima per calcolare i conteggi aggregati delle installazioni.

## Quando viene raccolta la telemetria

La telemetria viene inviata solo quando:

- Hai effettuato l’accesso nella CLI.
- Esegui `clawhub install <slug>`.
- La telemetria **non è disabilitata** (vedi “Come disabilitare” sotto).

Se non hai effettuato l’accesso, non viene segnalato nulla.

## Cosa raccogliamo

A ogni `clawhub install` segnalato, la CLI invia un singolo evento di installazione best-effort.

L’evento include:

- `slug`: lo slug dello skill installato.
- `version`: la versione installata, quando nota.

### Cosa _non_ raccogliamo

- Nessun percorso di cartella o identificatore derivato dalle cartelle.
- Nessun contenuto dei file.
- Nessun log per esecuzione, prompt o altro output della CLI.

## Conteggi delle installazioni

ClawHub mantiene contatori aggregati per skill:

- `installsAllTime`: utenti unici che hanno segnalato almeno un’installazione CLI per lo skill.
- `installsCurrent`: utenti unici che hanno segnalato un’installazione e non hanno eliminato la propria
  telemetria.

## Trasparenza + controlli utente

Tutti vedono solo **contatori aggregati delle installazioni**.

L’eliminazione del tuo account elimina anche i tuoi dati di telemetria.

## Come disabilitare la telemetria

Imposta la variabile d’ambiente:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Con questa impostazione, la CLI non invierà la telemetria delle installazioni.
