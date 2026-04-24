---
read_when:
    - Vuoi aggiornare in sicurezza un checkout del sorgente
    - Hai bisogno di capire il comportamento abbreviato di `--update`
summary: Riferimento CLI per `openclaw update` (aggiornamento del sorgente relativamente sicuro + riavvio automatico del gateway)
title: Aggiornamento
x-i18n:
    generated_at: "2026-04-24T08:35:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: c7ab28ae6fe91c094826ccbd9fa11c5d7c41849cc95d570a634a0721b82f0e3a
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

Aggiorna OpenClaw in modo sicuro e passa tra i canali stable/beta/dev.

Se hai installato tramite **npm/pnpm/bun** (installazione globale, senza metadati git),
gli aggiornamenti avvengono tramite il flusso del gestore pacchetti descritto in [Updating](/it/install/updating).

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
- `--channel <stable|beta|dev>`: imposta il canale di aggiornamento (git + npm; persistito in configurazione).
- `--tag <dist-tag|version|spec>`: sostituisce la destinazione del pacchetto solo per questo aggiornamento. Per installazioni da pacchetto, `main` corrisponde a `github:openclaw/openclaw#main`.
- `--dry-run`: mostra in anteprima le azioni di aggiornamento pianificate (canale/tag/destinazione/flusso di riavvio) senza scrivere configurazione, installare, sincronizzare Plugin o riavviare.
- `--json`: stampa JSON `UpdateRunResult` leggibile dalle macchine, inclusi
  `postUpdate.plugins.integrityDrifts` quando durante la sincronizzazione dei Plugin post-aggiornamento
  viene rilevata una divergenza di integrità degli artefatti npm dei Plugin.
- `--timeout <seconds>`: timeout per passaggio (il predefinito è 1200s).
- `--yes`: salta le richieste di conferma (per esempio la conferma del downgrade)

Nota: i downgrade richiedono conferma perché le versioni più vecchie possono rompere la configurazione.

## `update status`

Mostra il canale di aggiornamento attivo + tag/branch/SHA git (per i checkout del sorgente), oltre alla disponibilità di aggiornamenti.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opzioni:

- `--json`: stampa JSON di stato leggibile dalle macchine.
- `--timeout <seconds>`: timeout per i controlli (predefinito 3s).

## `update wizard`

Flusso interattivo per scegliere un canale di aggiornamento e confermare se riavviare il Gateway
dopo l’aggiornamento (il comportamento predefinito è riavviare). Se selezioni `dev` senza un checkout git,
viene offerta la possibilità di crearne uno.

Opzioni:

- `--timeout <seconds>`: timeout per ogni passaggio dell’aggiornamento (predefinito `1200`)

## Cosa fa

Quando cambi esplicitamente canale (`--channel ...`), OpenClaw mantiene anche
allineato il metodo di installazione:

- `dev` → garantisce un checkout git (predefinito: `~/openclaw`, sostituibile con `OPENCLAW_GIT_DIR`),
  lo aggiorna e installa la CLI globale da quel checkout.
- `stable` → installa da npm usando `latest`.
- `beta` → preferisce il dist-tag npm `beta`, ma usa come fallback `latest` quando beta è
  mancante o più vecchio dell’attuale release stable.

L’auto-updater del core Gateway (quando abilitato tramite configurazione) riutilizza questo stesso percorso di aggiornamento.

Per le installazioni tramite gestore pacchetti, `openclaw update` risolve la versione
del pacchetto di destinazione prima di invocare il gestore pacchetti. Se la versione installata
corrisponde esattamente alla destinazione e non è necessario rendere persistente alcun cambio
di canale di aggiornamento, il comando termina come saltato prima di installazione del pacchetto, sincronizzazione Plugin, refresh del completamento
o riavvio del gateway.

## Flusso per checkout git

Canali:

- `stable`: effettua il checkout dell’ultimo tag non beta, poi build + doctor.
- `beta`: preferisce l’ultimo tag `-beta`, ma usa come fallback l’ultimo tag stable
  quando beta è mancante o più vecchio.
- `dev`: effettua il checkout di `main`, poi fetch + rebase.

Panoramica di alto livello:

1. Richiede un worktree pulito (nessuna modifica non salvata nel commit).
2. Passa al canale selezionato (tag o branch).
3. Esegue fetch dall’upstream (solo dev).
4. Solo dev: esegue lint di preflight + build TypeScript in un worktree temporaneo; se la punta fallisce, torna indietro fino a 10 commit per trovare la build pulita più recente.
5. Esegue rebase sul commit selezionato (solo dev).
6. Installa le dipendenze con il gestore pacchetti del repository. Per i checkout pnpm, l’updater inizializza `pnpm` su richiesta (prima tramite `corepack`, poi con fallback temporaneo `npm install pnpm@10`) invece di eseguire `npm run build` dentro un workspace pnpm.
7. Esegue la build + la build della Control UI.
8. Esegue `openclaw doctor` come controllo finale di “aggiornamento sicuro”.
9. Sincronizza i Plugin con il canale attivo (dev usa Plugin inclusi; stable/beta usa npm) e aggiorna i Plugin installati tramite npm.

Se un aggiornamento di un Plugin npm fissato a una versione esatta si risolve in un artefatto la cui integrità
differisce dal record di installazione memorizzato, `openclaw update` interrompe quell’aggiornamento
dell’artefatto del Plugin invece di installarlo. Reinstalla o aggiorna il Plugin
esplicitamente solo dopo aver verificato che il nuovo artefatto sia affidabile.

Se l’inizializzazione di pnpm continua a fallire, l’updater ora si ferma prima con un errore specifico del gestore pacchetti invece di provare `npm run build` dentro il checkout.

## Forma abbreviata `--update`

`openclaw --update` viene riscritto come `openclaw update` (utile per shell e script launcher).

## Correlati

- `openclaw doctor` (propone di eseguire prima l’aggiornamento sui checkout git)
- [Canali di sviluppo](/it/install/development-channels)
- [Updating](/it/install/updating)
- [Riferimento CLI](/it/cli)
