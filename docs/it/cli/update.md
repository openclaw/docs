---
read_when:
    - Vuoi aggiornare in sicurezza un checkout dei sorgenti
    - Devi comprendere il comportamento abbreviato di `--update`
summary: Riferimento CLI per `openclaw update` (aggiornamento dei sorgenti relativamente sicuro + riavvio automatico del gateway)
title: update
x-i18n:
    generated_at: "2026-04-23T08:27:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: abcfbd2fb66f560f2c6e9d78d37355510d78946eaeafa17d67fe36bc158ad5cd
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

Aggiorna OpenClaw in modo sicuro e passa tra i canali stable/beta/dev.

Se hai installato tramite **npm/pnpm/bun** (installazione globale, senza metadati git),
gli aggiornamenti avvengono tramite il flusso del gestore pacchetti in [Aggiornamento](/it/install/updating).

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
- `--channel <stable|beta|dev>`: imposta il canale di aggiornamento (git + npm; persistito nella configurazione).
- `--tag <dist-tag|version|spec>`: sovrascrive il target del pacchetto solo per questo aggiornamento. Per le installazioni tramite pacchetto, `main` viene mappato a `github:openclaw/openclaw#main`.
- `--dry-run`: mostra in anteprima le azioni di aggiornamento pianificate (flusso di canale/tag/target/riavvio) senza scrivere la configurazione, installare, sincronizzare i plugin o riavviare.
- `--json`: stampa JSON `UpdateRunResult` leggibile da macchina, incluso
  `postUpdate.plugins.integrityDrifts` quando durante la sincronizzazione dei plugin post-aggiornamento
  viene rilevata una deriva dell'artefatto dei plugin npm.
- `--timeout <seconds>`: timeout per ogni passaggio (il valore predefinito è 1200s).
- `--yes`: salta i prompt di conferma (per esempio la conferma del downgrade)

Nota: i downgrade richiedono conferma perché le versioni precedenti possono rompere la configurazione.

## `update status`

Mostra il canale di aggiornamento attivo + tag/branch/SHA git (per i checkout dei sorgenti), oltre alla disponibilità degli aggiornamenti.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opzioni:

- `--json`: stampa JSON di stato leggibile da macchina.
- `--timeout <seconds>`: timeout per i controlli (il valore predefinito è 3s).

## `update wizard`

Flusso interattivo per scegliere un canale di aggiornamento e confermare se riavviare il Gateway
dopo l'aggiornamento (il comportamento predefinito è riavviarlo). Se selezioni `dev` senza un checkout git,
offre di crearne uno.

Opzioni:

- `--timeout <seconds>`: timeout per ogni passaggio di aggiornamento (predefinito `1200`)

## Che cosa fa

Quando cambi esplicitamente canale (`--channel ...`), OpenClaw mantiene anche allineato il
metodo di installazione:

- `dev` → garantisce un checkout git (predefinito: `~/openclaw`, override con `OPENCLAW_GIT_DIR`),
  lo aggiorna e installa la CLI globale da quel checkout.
- `stable` → installa da npm usando `latest`.
- `beta` → preferisce il dist-tag npm `beta`, ma usa il fallback a `latest` quando `beta` è
  assente o più vecchio della release stable corrente.

L'auto-updater del core Gateway (quando abilitato tramite configurazione) riutilizza questo stesso percorso di aggiornamento.

Per le installazioni tramite gestore pacchetti, `openclaw update` risolve la
versione del pacchetto di destinazione prima di invocare il gestore pacchetti. Se la versione installata
corrisponde esattamente al target e non è necessario persistere alcun cambio di canale di aggiornamento, il
comando termina come saltato prima del lavoro di installazione del pacchetto, sincronizzazione dei plugin, aggiornamento del completamento
o riavvio del gateway.

## Flusso del checkout git

Canali:

- `stable`: esegue il checkout dell'ultimo tag non-beta, quindi build + doctor.
- `beta`: preferisce l'ultimo tag `-beta`, ma usa il fallback all'ultimo tag stable
  quando `beta` è assente o più vecchio.
- `dev`: esegue il checkout di `main`, quindi fetch + rebase.

Panoramica di alto livello:

1. Richiede un worktree pulito (nessuna modifica non committata).
2. Passa al canale selezionato (tag o branch).
3. Esegue il fetch dell'upstream (solo dev).
4. Solo dev: esegue preflight lint + build TypeScript in un worktree temporaneo; se il tip fallisce, torna indietro fino a 10 commit per trovare la build pulita più recente.
5. Esegue il rebase sul commit selezionato (solo dev).
6. Installa le dipendenze con il gestore pacchetti del repository. Per i checkout pnpm, l'updater avvia `pnpm` su richiesta (prima tramite `corepack`, poi con il fallback temporaneo `npm install pnpm@10`) invece di eseguire `npm run build` all'interno di un workspace pnpm.
7. Esegue la build + la build della Control UI.
8. Esegue `openclaw doctor` come controllo finale di “aggiornamento sicuro”.
9. Sincronizza i plugin con il canale attivo (dev usa i plugin inclusi; stable/beta usa npm) e aggiorna i plugin installati tramite npm.

Se un aggiornamento esatto di un plugin npm fissato risolve a un artefatto la cui integrità
differisce dal record di installazione memorizzato, `openclaw update` interrompe quell'aggiornamento
dell'artefatto del plugin invece di installarlo. Reinstalla o aggiorna esplicitamente il plugin
solo dopo aver verificato che il nuovo artefatto sia affidabile.

Se il bootstrap di pnpm continua a fallire, l'updater ora si ferma in anticipo con un errore specifico
del gestore pacchetti invece di provare `npm run build` all'interno del checkout.

## Abbreviazione `--update`

`openclaw --update` viene riscritto in `openclaw update` (utile per shell e script launcher).

## Vedi anche

- `openclaw doctor` (offre di eseguire prima update sui checkout git)
- [Canali di sviluppo](/it/install/development-channels)
- [Aggiornamento](/it/install/updating)
- [Riferimento CLI](/it/cli)
