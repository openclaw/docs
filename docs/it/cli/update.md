---
read_when:
    - Vuoi aggiornare in modo sicuro una copia di lavoro del codice sorgente
    - È necessario comprendere il comportamento della forma abbreviata `--update`
summary: Riferimento CLI per `openclaw update` (aggiornamento sorgente relativamente sicuro + riavvio automatico del Gateway)
title: Aggiorna
x-i18n:
    generated_at: "2026-05-02T20:43:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35df8c6d8b1adb9597377f6e2b4844352577992c12636a88b3f3c1854dc0666b
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Aggiorna OpenClaw in modo sicuro e passa tra i canali stable/beta/dev.

Se hai installato tramite **npm/pnpm/bun** (installazione globale, senza metadati git),
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

- `--no-restart`: salta il riavvio del servizio Gateway dopo un aggiornamento riuscito. Gli aggiornamenti tramite gestore di pacchetti che riavviano il Gateway verificano che il servizio riavviato segnali la versione aggiornata prevista prima che il comando abbia esito positivo.
- `--channel <stable|beta|dev>`: imposta il canale di aggiornamento (git + npm; persistito nella configurazione).
- `--tag <dist-tag|version|spec>`: sostituisce la destinazione del pacchetto solo per questo aggiornamento. Per le installazioni da pacchetto, `main` corrisponde a `github:openclaw/openclaw#main`.
- `--dry-run`: mostra in anteprima le azioni di aggiornamento pianificate (flusso canale/tag/destinazione/riavvio) senza scrivere la configurazione, installare, sincronizzare i Plugin o riavviare.
- `--json`: stampa JSON `UpdateRunResult` leggibile da macchina, incluso
  `postUpdate.plugins.integrityDrifts` quando viene rilevata una deriva degli artefatti dei Plugin npm
  durante la sincronizzazione dei Plugin post-aggiornamento.
- `--timeout <seconds>`: timeout per passaggio (il valore predefinito è 1800s).
- `--yes`: salta le richieste di conferma (per esempio la conferma del downgrade).

<Warning>
I downgrade richiedono conferma perché le versioni precedenti possono interrompere la configurazione.
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

- `--timeout <seconds>`: timeout per ogni passaggio di aggiornamento (valore predefinito `1800`)

## Cosa fa

Quando cambi canale esplicitamente (`--channel ...`), OpenClaw mantiene allineato anche il
metodo di installazione:

- `dev` → garantisce un checkout git (predefinito: `~/openclaw`, sovrascrivibile con `OPENCLAW_GIT_DIR`),
  lo aggiorna e installa la CLI globale da quel checkout.
- `stable` → installa da npm usando `latest`.
- `beta` → preferisce il dist-tag npm `beta`, ma ripiega su `latest` quando beta è
  mancante o più vecchio della versione stabile corrente.

L'aggiornamento automatico del core Gateway (quando abilitato tramite configurazione) avvia il percorso di aggiornamento della CLI
al di fuori del gestore della richiesta Gateway in esecuzione. Gli aggiornamenti tramite gestore di pacchetti
`update.run` del piano di controllo forzano un riavvio di aggiornamento non differito e senza cooldown dopo la sostituzione del pacchetto,
perché il vecchio processo Gateway potrebbe avere ancora in memoria chunk che puntano a
file rimossi dal nuovo pacchetto.

Per le installazioni tramite gestore di pacchetti, `openclaw update` risolve la versione del pacchetto
di destinazione prima di invocare il gestore di pacchetti. Le installazioni globali npm usano un'installazione
staged: OpenClaw installa il nuovo pacchetto in un prefisso npm temporaneo, verifica
l'inventario `dist` del pacchetto lì, quindi scambia quell'albero di pacchetto pulito nel
prefisso globale reale. Se la verifica fallisce, doctor post-aggiornamento, sincronizzazione dei Plugin e
riavvio non vengono eseguiti dall'albero sospetto. Anche quando la versione installata
corrisponde già alla destinazione, il comando aggiorna l'installazione globale del pacchetto,
quindi esegue la sincronizzazione dei Plugin, un aggiornamento del completamento dei comandi core e il riavvio. Questo
mantiene i sidecar pacchettizzati e i record dei Plugin di proprietà del canale allineati con la
build OpenClaw installata, lasciando le ricostruzioni complete del completamento dei comandi Plugin a
esecuzioni esplicite di `openclaw completion --write-state`.

Quando è installato un servizio Gateway gestito locale e il riavvio è abilitato,
gli aggiornamenti tramite gestore di pacchetti arrestano il servizio in esecuzione prima di sostituire l'albero del pacchetto,
quindi aggiornano i metadati del servizio dall'installazione aggiornata, riavviano il
servizio e verificano che il Gateway riavviato segnali la versione prevista. Con
`--no-restart`, la sostituzione del pacchetto viene comunque eseguita ma il servizio gestito non viene
arrestato o riavviato, quindi il Gateway in esecuzione può mantenere il vecchio codice finché non lo riavvii
manualmente.

## Flusso di checkout git

### Selezione del canale

- `stable`: esegue il checkout del tag non beta più recente, quindi build e doctor.
- `beta`: preferisce il tag `-beta` più recente, ma ripiega sul tag stabile più recente quando beta è mancante o più vecchio.
- `dev`: esegue il checkout di `main`, quindi fetch e rebase.

### Passaggi di aggiornamento

<Steps>
  <Step title="Verifica worktree pulito">
    Richiede l'assenza di modifiche non committate.
  </Step>
  <Step title="Cambia canale">
    Passa al canale selezionato (tag o branch).
  </Step>
  <Step title="Recupera upstream">
    Solo dev.
  </Step>
  <Step title="Build preflight (solo dev)">
    Esegue lint e build TypeScript in un worktree temporaneo. Se la punta fallisce, risale fino a 10 commit per trovare la build pulita più recente.
  </Step>
  <Step title="Rebase">
    Esegue il rebase sul commit selezionato (solo dev).
  </Step>
  <Step title="Installa dipendenze">
    Usa il gestore di pacchetti del repo. Per i checkout pnpm, l'updater inizializza `pnpm` su richiesta (prima tramite `corepack`, poi con fallback temporaneo `npm install pnpm@10`) invece di eseguire `npm run build` dentro un workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Compila il Gateway e la Control UI.
  </Step>
  <Step title="Esegui doctor">
    `openclaw doctor` viene eseguito come controllo finale di aggiornamento sicuro.
  </Step>
  <Step title="Sincronizza Plugin">
    Sincronizza i Plugin con il canale attivo. Dev usa i Plugin in bundle; stable e beta usano npm. Aggiorna le installazioni dei Plugin tracciate.
  </Step>
</Steps>

Sul canale di aggiornamento beta, le installazioni di Plugin npm e ClawHub tracciate che seguono
la linea default/latest provano prima una release Plugin `@beta`. Se il Plugin non ha una
release beta, OpenClaw ripiega sulla spec default/latest registrata. Le versioni esatte
e i tag espliciti non vengono riscritti.

<Warning>
Se un aggiornamento di Plugin npm con pin esatto si risolve in un artefatto la cui integrità differisce dal record di installazione archiviato, `openclaw update` interrompe quell'aggiornamento dell'artefatto Plugin invece di installarlo. Reinstalla o aggiorna il Plugin esplicitamente solo dopo aver verificato che ritieni affidabile il nuovo artefatto.
</Warning>

<Note>
Gli errori di sincronizzazione dei Plugin post-aggiornamento fanno fallire il risultato dell'aggiornamento e interrompono il lavoro di riavvio successivo. Correggi l'errore di installazione o aggiornamento del Plugin, quindi riesegui `openclaw update`.

Quando il Gateway aggiornato si avvia, il caricamento dei Plugin è solo di verifica: l'avvio non esegue gestori di pacchetti né modifica gli alberi delle dipendenze. I riavvii `update.run` tramite gestore di pacchetti aggirano il normale differimento per inattività e il cooldown di riavvio dopo che l'albero del pacchetto è stato scambiato, quindi il vecchio processo non può continuare a caricare pigramente chunk rimossi.

Se il bootstrap pnpm continua a fallire, l'updater si ferma presto con un errore specifico del gestore di pacchetti invece di provare `npm run build` dentro il checkout.
</Note>

## Abbreviazione `--update`

`openclaw --update` viene riscritto in `openclaw update` (utile per shell e script di avvio).

## Correlati

- `openclaw doctor` (propone di eseguire prima l'aggiornamento nei checkout git)
- [Canali di sviluppo](/it/install/development-channels)
- [Aggiornamento](/it/install/updating)
- [Riferimento CLI](/it/cli)
