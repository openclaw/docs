---
read_when:
    - Vuoi aggiornare un checkout sorgente in modo sicuro
    - È necessario comprendere il comportamento abbreviato di `--update`
summary: Riferimento CLI per `openclaw update` (aggiornamento del sorgente relativamente sicuro + riavvio automatico del Gateway)
title: Aggiorna
x-i18n:
    generated_at: "2026-04-30T08:45:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cd4be6be8f6ae7df501f8bce3d208dd507ae5a1539f9772101cd844dcd93976
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Aggiorna OpenClaw in modo sicuro e passa tra i canali stable/beta/dev.

Se hai installato tramite **npm/pnpm/bun** (installazione globale, nessun metadato git),
gli aggiornamenti avvengono tramite il flusso del gestore di pacchetti in [Aggiornamento](/it/install/updating).

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

- `--no-restart`: salta il riavvio del servizio Gateway dopo un aggiornamento riuscito. Gli aggiornamenti del gestore di pacchetti che riavviano il Gateway verificano che il servizio riavviato riporti la versione aggiornata prevista prima che il comando abbia successo.
- `--channel <stable|beta|dev>`: imposta il canale di aggiornamento (git + npm; salvato nella configurazione).
- `--tag <dist-tag|version|spec>`: sovrascrive la destinazione del pacchetto solo per questo aggiornamento. Per le installazioni da pacchetto, `main` corrisponde a `github:openclaw/openclaw#main`.
- `--dry-run`: visualizza in anteprima le azioni di aggiornamento pianificate (flusso canale/tag/destinazione/riavvio) senza scrivere la configurazione, installare, sincronizzare i plugin o riavviare.
- `--json`: stampa JSON `UpdateRunResult` leggibile da macchina, incluso
  `postUpdate.plugins.integrityDrifts` quando viene rilevata una deriva degli artefatti dei Plugin npm
  durante la sincronizzazione dei Plugin post-aggiornamento.
- `--timeout <seconds>`: timeout per passaggio (il valore predefinito è 1800s).
- `--yes`: salta le richieste di conferma (ad esempio la conferma di downgrade).

<Warning>
I downgrade richiedono conferma perché le versioni precedenti possono compromettere la configurazione.
</Warning>

## `update status`

Mostra il canale di aggiornamento attivo + tag/branch/SHA git (per i checkout sorgente), oltre alla disponibilità degli aggiornamenti.

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
dopo l'aggiornamento (il valore predefinito è riavviare). Se selezioni `dev` senza un checkout git,
propone di crearne uno.

Opzioni:

- `--timeout <seconds>`: timeout per ogni passaggio di aggiornamento (predefinito `1800`)

## Cosa fa

Quando cambi canale esplicitamente (`--channel ...`), OpenClaw mantiene allineato anche il
metodo di installazione:

- `dev` → garantisce un checkout git (predefinito: `~/openclaw`, sovrascrivibile con `OPENCLAW_GIT_DIR`),
  lo aggiorna e installa la CLI globale da quel checkout.
- `stable` → installa da npm usando `latest`.
- `beta` → preferisce il dist-tag npm `beta`, ma ripiega su `latest` quando beta è
  assente o più vecchio dell'attuale release stable.

L'auto-updater del core del Gateway (quando abilitato tramite configurazione) riutilizza questo stesso percorso di aggiornamento.

Per le installazioni tramite gestore di pacchetti, `openclaw update` risolve la versione del pacchetto
di destinazione prima di invocare il gestore di pacchetti. Le installazioni globali npm usano un'installazione
a fasi: OpenClaw installa il nuovo pacchetto in un prefisso npm temporaneo, verifica
l'inventario `dist` del pacchetto lì, quindi scambia quell'albero di pacchetti pulito nel
vero prefisso globale. Se la verifica fallisce, doctor post-aggiornamento, sincronizzazione dei Plugin e
riavvio non vengono eseguiti dall'albero sospetto. Anche quando la versione installata
corrisponde già alla destinazione, il comando aggiorna l'installazione globale del pacchetto,
poi esegue la sincronizzazione dei Plugin, un aggiornamento del completamento dei comandi core e il riavvio. Questo
mantiene allineati i sidecar del pacchetto e i record dei Plugin di proprietà del canale con la
build OpenClaw installata, lasciando le ricostruzioni complete del completamento dei comandi dei Plugin alle
esecuzioni esplicite di `openclaw completion --write-state`.

Quando è installato un servizio Gateway gestito locale e il riavvio è abilitato,
gli aggiornamenti tramite gestore di pacchetti arrestano il servizio in esecuzione prima di sostituire l'albero dei pacchetti,
poi aggiornano i metadati del servizio dall'installazione aggiornata, riavviano il
servizio e verificano che il Gateway riavviato riporti la versione prevista. Con
`--no-restart`, la sostituzione del pacchetto viene comunque eseguita ma il servizio gestito non viene
arrestato o riavviato, quindi il Gateway in esecuzione può mantenere il vecchio codice finché non lo riavvii
manualmente.

## Flusso di checkout git

### Selezione del canale

- `stable`: esegue il checkout del tag non beta più recente, poi build e doctor.
- `beta`: preferisce il tag `-beta` più recente, ma ripiega sull'ultimo tag stable quando beta è assente o più vecchio.
- `dev`: esegue il checkout di `main`, poi fetch e rebase.

### Passaggi di aggiornamento

<Steps>
  <Step title="Verifica worktree pulito">
    Richiede che non ci siano modifiche non committate.
  </Step>
  <Step title="Cambia canale">
    Passa al canale selezionato (tag o branch).
  </Step>
  <Step title="Fetch upstream">
    Solo dev.
  </Step>
  <Step title="Build preflight (solo dev)">
    Esegue lint e build TypeScript in un worktree temporaneo. Se il tip fallisce, risale fino a 10 commit per trovare la build pulita più recente.
  </Step>
  <Step title="Rebase">
    Esegue il rebase sul commit selezionato (solo dev).
  </Step>
  <Step title="Installa dipendenze">
    Usa il gestore di pacchetti del repo. Per i checkout pnpm, l'updater inizializza `pnpm` su richiesta (prima tramite `corepack`, poi con fallback temporaneo `npm install pnpm@10`) invece di eseguire `npm run build` dentro un workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Compila il gateway e la Control UI.
  </Step>
  <Step title="Esegui doctor">
    `openclaw doctor` viene eseguito come controllo finale dell'aggiornamento sicuro.
  </Step>
  <Step title="Sincronizza Plugin">
    Sincronizza i Plugin con il canale attivo. Dev usa i Plugin in bundle; stable e beta usano npm. Aggiorna i Plugin installati tramite npm.
  </Step>
</Steps>

<Warning>
Se un aggiornamento di Plugin npm con pin esatto risolve a un artefatto la cui integrità differisce dal record di installazione memorizzato, `openclaw update` interrompe quell'aggiornamento dell'artefatto del Plugin invece di installarlo. Reinstalla o aggiorna esplicitamente il Plugin solo dopo aver verificato che consideri attendibile il nuovo artefatto.
</Warning>

<Note>
I fallimenti della sincronizzazione dei Plugin post-aggiornamento fanno fallire il risultato dell'aggiornamento e interrompono il lavoro di riavvio successivo. Correggi l'installazione del Plugin o l'errore di aggiornamento, poi riesegui `openclaw update`.

Quando il Gateway aggiornato si avvia, le dipendenze runtime dei Plugin in bundle abilitati vengono predisposte prima dell'attivazione dei Plugin. I riavvii attivati dall'aggiornamento svuotano qualsiasi predisposizione attiva delle dipendenze runtime prima di chiudere il Gateway, quindi i riavvii del gestore del servizio non interrompono un'installazione npm in corso.

Se il bootstrap di pnpm fallisce ancora, l'updater si ferma in anticipo con un errore specifico del gestore di pacchetti invece di provare `npm run build` dentro il checkout.
</Note>

## Abbreviazione `--update`

`openclaw --update` viene riscritto in `openclaw update` (utile per shell e script di avvio).

## Correlati

- `openclaw doctor` (propone di eseguire prima l'aggiornamento sui checkout git)
- [Canali di sviluppo](/it/install/development-channels)
- [Aggiornamento](/it/install/updating)
- [Riferimento CLI](/it/cli)
