---
read_when:
    - Vuoi aggiornare in sicurezza un checkout del sorgente
    - Devi capire il comportamento abbreviato di `--update`
summary: Riferimento CLI per `openclaw update` (aggiornamento del sorgente relativamente sicuro + riavvio automatico del gateway)
title: update
x-i18n:
    generated_at: "2026-04-05T13:49:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12c8098654b644c3666981d379f6c018e84fde56a5420f295d78052f9001bdad
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

Aggiorna in sicurezza OpenClaw e passa tra i canali stable/beta/dev.

Se hai installato tramite **npm/pnpm/bun** (installazione globale, senza metadata git),
gli aggiornamenti avvengono tramite il flusso del gestore pacchetti in [Aggiornamento](/install/updating).

## Utilizzo

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## Opzioni

- `--no-restart`: salta il riavvio del servizio Gateway dopo un aggiornamento riuscito.
- `--channel <stable|beta|dev>`: imposta il canale di aggiornamento (git + npm; persistito nella config).
- `--tag <dist-tag|version|spec>`: sovrascrive il target del pacchetto solo per questo aggiornamento. Per le installazioni da pacchetto, `main` corrisponde a `github:openclaw/openclaw#main`.
- `--dry-run`: mostra in anteprima le azioni di aggiornamento pianificate (canale/tag/target/flusso di riavvio) senza scrivere nella config, installare, sincronizzare i plugin o riavviare.
- `--json`: stampa JSON `UpdateRunResult` leggibile da macchina.
- `--timeout <seconds>`: timeout per passaggio (il valore predefinito è 1200 s).
- `--yes`: salta le richieste di conferma (per esempio la conferma del downgrade)

Nota: i downgrade richiedono conferma perché le versioni più vecchie possono compromettere la configurazione.

## `update status`

Mostra il canale di aggiornamento attivo + tag/branch/SHA git (per i checkout del sorgente), oltre alla disponibilità di aggiornamenti.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opzioni:

- `--json`: stampa JSON di stato leggibile da macchina.
- `--timeout <seconds>`: timeout per i controlli (il valore predefinito è 3 s).

## `update wizard`

Flusso interattivo per scegliere un canale di aggiornamento e confermare se riavviare il Gateway
dopo l'aggiornamento (il comportamento predefinito è riavviare). Se selezioni `dev` senza un checkout git,
offre di crearne uno.

Opzioni:

- `--timeout <seconds>`: timeout per ogni passaggio di aggiornamento (predefinito `1200`)

## Cosa fa

Quando cambi canale esplicitamente (`--channel ...`), OpenClaw mantiene anche
allineato il metodo di installazione:

- `dev` → assicura un checkout git (predefinito: `~/openclaw`, sovrascrivibile con `OPENCLAW_GIT_DIR`),
  lo aggiorna e installa la CLI globale da quel checkout.
- `stable` → installa da npm usando `latest`.
- `beta` → preferisce il dist-tag npm `beta`, ma usa `latest` come fallback quando `beta` è
  mancante o più vecchio dell'attuale release stable.

L'auto-updater core del Gateway (quando abilitato tramite config) riutilizza questo stesso percorso di aggiornamento.

## Flusso del checkout git

Canali:

- `stable`: esegue il checkout dell'ultimo tag non beta, poi build + doctor.
- `beta`: preferisce l'ultimo tag `-beta`, ma usa come fallback l'ultimo tag stable
  quando `beta` è mancante o più vecchio.
- `dev`: esegue il checkout di `main`, poi fetch + rebase.

Panoramica generale:

1. Richiede un worktree pulito (nessuna modifica non commitata).
2. Passa al canale selezionato (tag o branch).
3. Esegue il fetch dell'upstream (solo dev).
4. Solo dev: preflight di lint + build TypeScript in un worktree temporaneo; se il tip fallisce, torna indietro fino a 10 commit per trovare la build pulita più recente.
5. Esegue il rebase sul commit selezionato (solo dev).
6. Installa le dipendenze (preferito pnpm; fallback npm; bun resta disponibile come fallback secondario di compatibilità).
7. Esegue la build + la build della Control UI.
8. Esegue `openclaw doctor` come controllo finale di “aggiornamento sicuro”.
9. Sincronizza i plugin con il canale attivo (dev usa extension bundle, stable/beta usa npm) e aggiorna i plugin installati tramite npm.

## Forma abbreviata `--update`

`openclaw --update` viene riscritto come `openclaw update` (utile per shell e script di avvio).

## Vedi anche

- `openclaw doctor` (offre di eseguire prima l'aggiornamento sui checkout git)
- [Canali di sviluppo](/install/development-channels)
- [Aggiornamento](/install/updating)
- [Riferimento CLI](/cli)
