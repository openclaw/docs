---
read_when:
    - Vuoi aggiornare un checkout sorgente in modo sicuro
    - Stai eseguendo il debug dell'output o delle opzioni di `openclaw update`
    - Devi comprendere il comportamento abbreviato di `--update`
summary: Riferimento CLI per `openclaw update` (aggiornamento del sorgente relativamente sicuro + riavvio automatico del Gateway)
title: Aggiorna
x-i18n:
    generated_at: "2026-06-27T17:23:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3503e1cd15baa4d4f6c26734b37556831c612f1da0da5ccfe7bcde35b9be64b
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Aggiorna OpenClaw in modo sicuro e passa tra i canali stabile/beta/dev.

Se hai installato tramite **npm/pnpm/bun** (installazione globale, senza metadati git),
gli aggiornamenti avvengono tramite il flusso del gestore pacchetti in [Aggiornamento](/it/install/updating).

## Utilizzo

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --acknowledge-clawhub-risk
openclaw update --json
openclaw --update
```

## Opzioni

- `--no-restart`: salta il riavvio del servizio Gateway dopo un aggiornamento riuscito. Gli aggiornamenti tramite gestore pacchetti che riavviano il Gateway verificano che il servizio riavviato riporti la versione aggiornata prevista prima che il comando abbia successo.
- `--channel <stable|beta|dev>`: imposta il canale di aggiornamento (git + npm; persistito nella configurazione).
- `--tag <dist-tag|version|spec>`: sovrascrive la destinazione del pacchetto solo per questo aggiornamento. Per le installazioni da pacchetto, `main` corrisponde a `github:openclaw/openclaw#main`; le specifiche sorgente GitHub/git vengono impacchettate in un tarball temporaneo prima dell'installazione npm globale preparata.
- `--dry-run`: visualizza in anteprima le azioni di aggiornamento pianificate (flusso canale/tag/destinazione/riavvio) senza scrivere la configurazione, installare, sincronizzare Plugin o riavviare.
- `--json`: stampa JSON `UpdateRunResult` leggibile da macchina, incluso
  `postUpdate.plugins.warnings` quando Plugin gestiti corrotti o non caricabili richiedono
  riparazione dopo il successo dell'aggiornamento del core, dettagli del fallback dei Plugin
  del canale beta quando un Plugin non ha una release beta, e `postUpdate.plugins.integrityDrifts`
  quando viene rilevata una deriva degli artefatti dei Plugin npm durante la sincronizzazione Plugin post-aggiornamento.
- `--timeout <seconds>`: timeout per passaggio (il valore predefinito è 1800s).
- `--yes`: salta le richieste di conferma (per esempio la conferma di downgrade).
- `--acknowledge-clawhub-risk`: dopo aver esaminato gli avvisi di fiducia
  della community ClawHub, consente alla sincronizzazione Plugin post-aggiornamento di continuare senza una richiesta
  interattiva. Senza questa opzione, le release rischiose dei Plugin ClawHub della community vengono saltate e
  lasciate invariate quando OpenClaw non può richiedere conferma. I pacchetti ClawHub ufficiali e
  le sorgenti dei Plugin OpenClaw in bundle bypassano questa richiesta di fiducia della release.

`openclaw update` non ha un flag `--verbose`. Usa `--dry-run` per visualizzare in anteprima
le azioni pianificate di canale/tag/installazione/riavvio, `--json` per risultati leggibili
da macchina, e `openclaw update status --json` quando ti servono solo dettagli su canale e
disponibilità. Se stai eseguendo il debug dei log Gateway durante un aggiornamento,
la verbosità della console e il livello dei log su file sono separati: Gateway `--verbose` influisce
sull'output terminale/WebSocket, mentre i log su file richiedono `logging.level: "debug"` o
`"trace"` nella configurazione. Vedi [Log Gateway](/it/gateway/logging).

<Note>
In modalità Nix (`OPENCLAW_NIX_MODE=1`), le esecuzioni mutanti di `openclaw update` sono disabilitate. Aggiorna invece la sorgente Nix o l'input flake per questa installazione; per nix-openclaw, usa la [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) agent-first. `openclaw update status` e `openclaw update --dry-run` restano in sola lettura.
</Note>

<Warning>
I downgrade richiedono conferma perché le versioni precedenti possono interrompere la configurazione.
</Warning>

## `update status`

Mostra il canale di aggiornamento attivo + tag/branch/SHA git (per checkout sorgente), oltre alla disponibilità di aggiornamenti.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opzioni:

- `--json`: stampa JSON di stato leggibile da macchina.
- `--timeout <seconds>`: timeout per i controlli (il valore predefinito è 3s).

## `update repair`

Esegue di nuovo la finalizzazione dell'aggiornamento dopo che il pacchetto core è già cambiato ma il lavoro di
riparazione successivo non è terminato correttamente. Questo è il percorso di recupero supportato quando
`openclaw update` ha installato il nuovo pacchetto core ma la sincronizzazione Plugin post-core,
i metadati dei Plugin npm gestiti, l'aggiornamento del registro o la riparazione doctor devono ancora
convergere.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

Opzioni:

- `--channel <stable|beta|dev>`: persiste il canale di aggiornamento prima della riparazione ed
  esegue la convergenza dei Plugin rispetto a quel canale.
- `--json`: stampa JSON di finalizzazione leggibile da macchina.
- `--timeout <seconds>`: timeout per i passaggi di riparazione (predefinito `1800`).
- `--yes`: salta le richieste di conferma.
- `--acknowledge-clawhub-risk`: dopo aver esaminato gli avvisi di fiducia
  della community ClawHub, consente alla convergenza Plugin in fase di riparazione di continuare senza una
  richiesta interattiva. I pacchetti ClawHub ufficiali e le sorgenti dei Plugin OpenClaw in bundle
  bypassano questa richiesta di fiducia della release.
- `--no-restart`: accettato per parità con il comando update; repair non riavvia mai il
  Gateway.

`openclaw update repair` esegue `openclaw doctor --fix`, ricarica la configurazione riparata
e i record di installazione, sincronizza i Plugin tracciati per il canale di aggiornamento attivo,
aggiorna le installazioni dei Plugin npm gestiti, ripara i payload dei Plugin configurati mancanti,
aggiorna il registro dei Plugin e scrive i metadati dei record di installazione convergenti.
Non installa un nuovo pacchetto core e non riavvia il Gateway.

## `update wizard`

Flusso interattivo per scegliere un canale di aggiornamento e confermare se riavviare il Gateway
dopo l'aggiornamento (l'impostazione predefinita è riavviare). Se selezioni `dev` senza un checkout git, offre
di crearne uno.

Opzioni:

- `--timeout <seconds>`: timeout per ogni passaggio di aggiornamento (predefinito `1800`)

## Cosa fa

Quando passi esplicitamente da un canale all'altro (`--channel ...`), OpenClaw mantiene allineato anche il
metodo di installazione:

- `dev` → garantisce un checkout git (predefinito: `~/openclaw`, oppure `$OPENCLAW_HOME/openclaw` quando
  `OPENCLAW_HOME` è impostato; sovrascrivibile con `OPENCLAW_GIT_DIR`),
  lo aggiorna e installa la CLI globale da quel checkout.
- `stable` → installa da npm usando `latest`.
- `beta` → preferisce il dist-tag npm `beta`, ma ripiega su `latest` quando beta è
  mancante o precedente alla release stabile corrente.

L'aggiornatore automatico del core Gateway (quando abilitato tramite configurazione) avvia il percorso di aggiornamento CLI
fuori dal gestore delle richieste Gateway live. Gli aggiornamenti tramite gestore pacchetti di `update.run`
del piano di controllo e gli aggiornamenti dei checkout git supervisionati usano anche un
handoff del servizio gestito invece di sostituire l'albero del pacchetto o ricostruire
`dist/` dentro il processo Gateway live. Il Gateway avvia un helper scollegato,
esce, e l'helper esegue il normale percorso CLI `openclaw update --yes --json`
dall'esterno dell'albero dei processi Gateway. Se tale handoff non è disponibile,
`update.run` restituisce una risposta strutturata con il comando shell sicuro da eseguire
manualmente.

Per le installazioni tramite gestore pacchetti, `openclaw update` risolve la versione del pacchetto di destinazione
prima di invocare il gestore pacchetti. Le installazioni npm globali usano un'installazione preparata:
OpenClaw installa il nuovo pacchetto in un prefisso npm temporaneo, verifica
l'inventario `dist` impacchettato lì, quindi sostituisce quell'albero del pacchetto pulito nel
prefisso globale reale. Se la verifica fallisce, doctor post-aggiornamento, sincronizzazione Plugin e
lavoro di riavvio non vengono eseguiti dall'albero sospetto. Anche quando la versione installata
corrisponde già alla destinazione, il comando aggiorna l'installazione globale del pacchetto,
poi esegue la sincronizzazione Plugin, un aggiornamento del completamento dei comandi core e il lavoro di riavvio. Questo
mantiene i sidecar impacchettati e i record dei Plugin gestiti dal canale allineati con la
build OpenClaw installata, lasciando le ricostruzioni complete del completamento dei comandi Plugin alle
esecuzioni esplicite di `openclaw completion --write-state`.

Quando è installato un servizio Gateway gestito locale e il riavvio è abilitato,
gli aggiornamenti tramite gestore pacchetti e checkout git arrestano il servizio in esecuzione prima di
sostituire l'albero del pacchetto o mutare l'output del checkout/build. L'aggiornatore
quindi aggiorna i metadati del servizio dall'installazione aggiornata, riavvia il
servizio e verifica il Gateway riavviato prima di riportare
`Gateway: restarted and verified.`. Gli aggiornamenti tramite gestore pacchetti verificano inoltre che
il Gateway riavviato riporti la versione del pacchetto prevista; gli aggiornamenti da checkout git
verificano l'integrità del gateway e la prontezza del servizio dopo la ricostruzione. Su macOS, il
controllo post-aggiornamento verifica anche che il LaunchAgent sia caricato/in esecuzione per il profilo
attivo e che la porta di loopback configurata sia integra. Se il plist è installato
ma launchd non lo supervisiona, OpenClaw esegue di nuovo il bootstrap del LaunchAgent
automaticamente, quindi riesegue i controlli di integrità/versione/canale. Un bootstrap fresco
carica direttamente il job RunAtLoad, quindi il recupero dell'aggiornamento non esegue
immediatamente `kickstart -k` sul Gateway appena generato. Se il Gateway ancora non
diventa integro, il comando termina con codice diverso da zero e stampa il percorso del log di riavvio
più istruzioni esplicite di riavvio, reinstallazione e rollback del pacchetto. Se il riavvio
non può essere eseguito, il comando stampa `Gateway: restart skipped (...)` o
`Gateway: restart failed: ...` con un suggerimento manuale `openclaw gateway restart`.
Con `--no-restart`, la sostituzione del pacchetto o la ricostruzione git viene comunque eseguita ma il
servizio gestito non viene arrestato o riavviato, quindi il Gateway in esecuzione può mantenere il vecchio
codice finché non lo riavvii manualmente.

### Forma della risposta del piano di controllo

Quando `update.run` viene invocato tramite il piano di controllo Gateway su
un'installazione tramite gestore pacchetti o un checkout git supervisionato, il gestore riporta
l'avvio dell'handoff separatamente dall'aggiornamento CLI che continua dopo l'uscita del
Gateway:

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"` e
  `handoff.status: "started"` significano che il Gateway ha creato l'handoff del servizio gestito
  e pianificato il proprio riavvio così che l'helper scollegato possa eseguire
  `openclaw update --yes --json` fuori dal processo del servizio live.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"` e
  `handoff.status: "unavailable"` significano che OpenClaw non ha potuto trovare un confine di servizio
  supervisionato e un'identità di servizio durevole per un handoff sicuro. Per
  esempio, l'handoff systemd richiede l'identità dell'unità OpenClaw
  (`OPENCLAW_SYSTEMD_UNIT`), non solo marcatori ambientali del processo systemd. La
  risposta include `handoff.command`, il comando shell da eseguire dall'esterno del
  Gateway.
- `ok: false`, `result.reason: "managed-service-handoff-failed"` significa che il
  Gateway ha provato a creare l'handoff ma non è riuscito ad avviare l'helper scollegato.

Il payload `sentinel` viene comunque scritto prima che il Gateway esca, e l'handoff CLI
aggiorna lo stesso sentinel di riavvio dopo il completamento dei controlli di integrità del riavvio
del servizio gestito. Durante l'handoff, il sentinel può contenere
`stats.reason: "restart-health-pending"` senza una continuazione di successo; il
Gateway riavviato continua a interrogarlo e avvia la continuazione solo dopo che la CLI
ha verificato l'integrità del servizio e riscritto il sentinel con il risultato `ok`
finale. `openclaw status` e `openclaw status --all` mostrano una riga `Update restart`
mentre quel sentinel è in sospeso o fallito, e `update.status` aggiorna e
restituisce il sentinel più recente.

## Flusso checkout git

### Selezione del canale

- `stable`: esegue il checkout del tag non beta più recente, quindi build e doctor.
- `beta`: preferisce il tag `-beta` più recente, ma ripiega sul tag stabile più recente quando beta è mancante o precedente.
- `dev`: esegue il checkout di `main`, quindi fetch e rebase.

### Passaggi di aggiornamento

<Steps>
  <Step title="Verifica worktree pulito">
    Non richiede modifiche non committate.
  </Step>
  <Step title="Cambia canale">
    Passa al canale selezionato (tag o ramo).
  </Step>
  <Step title="Recupera upstream">
    Solo dev.
  </Step>
  <Step title="Build preflight (solo dev)">
    Esegue la build TypeScript in una worktree temporanea. Se il tip fallisce, torna indietro fino a 10 commit per trovare il commit più recente che può essere compilato. Imposta `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` per eseguire anche il lint durante questo preflight; il lint viene eseguito in modalità seriale vincolata perché gli host degli aggiornamenti degli utenti sono spesso più piccoli dei runner CI.
  </Step>
  <Step title="Rebase">
    Esegue il rebase sul commit selezionato (solo dev).
  </Step>
  <Step title="Installa dipendenze">
    Usa il gestore pacchetti del repository. Per i checkout pnpm, l'updater inizializza `pnpm` su richiesta (prima tramite `corepack`, poi con un fallback temporaneo `npm install pnpm@11`) invece di eseguire `npm run build` dentro un workspace pnpm.
  </Step>
  <Step title="Compila Control UI">
    Compila il gateway e la Control UI.
  </Step>
  <Step title="Esegui doctor">
    `openclaw doctor` viene eseguito come controllo finale di aggiornamento sicuro.
  </Step>
  <Step title="Sincronizza Plugin">
    Sincronizza i Plugin con il canale attivo. Dev usa Plugin in bundle; stable e beta usano npm. Aggiorna le installazioni dei Plugin tracciate.
  </Step>
</Steps>

Sul canale di aggiornamento beta, le installazioni tracciate di Plugin npm e ClawHub che seguono
la linea predefinita/latest provano prima una release `@beta` del Plugin. Se il Plugin non ha
una release beta, OpenClaw ripiega sulla spec predefinita/latest registrata e lo segnala
come avviso. Per i Plugin npm, OpenClaw ripiega anche quando il pacchetto beta
esiste ma non supera la convalida dell'installazione. Questi avvisi di fallback dei Plugin
non fanno fallire l'aggiornamento del core. Le versioni esatte e i tag espliciti non vengono
riscritti.

<Warning>
Se un aggiornamento esatto con pin di un Plugin npm si risolve in un artefatto la cui integrità differisce dal record di installazione memorizzato, `openclaw update` interrompe l'aggiornamento di quell'artefatto del Plugin invece di installarlo. Reinstalla o aggiorna esplicitamente il Plugin solo dopo aver verificato di fidarti del nuovo artefatto.
</Warning>

<Note>
Gli errori di sincronizzazione dei Plugin post-aggiornamento limitati a un Plugin gestito e che il percorso di sincronizzazione può aggirare (ad es. un registro npm irraggiungibile per un Plugin non essenziale) vengono segnalati come avvisi dopo il completamento dell'aggiornamento del core. Il risultato JSON mantiene lo `status: "ok"` di primo livello dell'aggiornamento e segnala `postUpdate.plugins.status: "warning"` con indicazioni su `openclaw update repair` e `openclaw plugins inspect <id> --runtime --json`. Le eccezioni inattese dell'updater o della sincronizzazione fanno comunque fallire il risultato dell'aggiornamento. Correggi l'errore di installazione o aggiornamento del Plugin, quindi riesegui `openclaw update repair`.

Dopo il passaggio di sincronizzazione per Plugin, `openclaw update` esegue un passaggio obbligatorio di **convergenza post-core** prima del riavvio del gateway: ripara i payload mancanti dei Plugin configurati, convalida su disco ogni record di installazione tracciato _attivo_ e verifica staticamente che il suo `package.json` sia analizzabile (e che qualsiasi `main` dichiarato esplicitamente esista). Gli errori di questo passaggio — e uno snapshot di configurazione OpenClaw non valido — restituiscono `postUpdate.plugins.status: "error"` e impostano lo `status` di primo livello dell'aggiornamento su `"error"`, quindi `openclaw update` esce con codice diverso da zero e il gateway _non_ viene riavviato con un set di Plugin non verificato. L'errore include righe strutturate `postUpdate.plugins.warnings[].guidance` che puntano a `openclaw update repair` e `openclaw plugins inspect <id> --runtime --json` per il follow-up. Le voci di Plugin disabilitate e i record che non sono target ufficiali di sincronizzazione collegati a fonti attendibili vengono saltati qui, rispecchiando la policy `skipDisabledPlugins` usata dal controllo dei payload mancanti, quindi un record obsoleto di Plugin disabilitato non può bloccare un aggiornamento altrimenti valido.

Quando il Gateway aggiornato si avvia, il caricamento dei Plugin è solo di verifica: l'avvio non
esegue gestori pacchetti né modifica gli alberi delle dipendenze. I riavvii `update.run` del gestore pacchetti
vengono passati al percorso di servizio gestito dalla CLI, quindi lo scambio del pacchetto avviene
fuori dal vecchio processo Gateway e i controlli di integrità del servizio decidono se
l'aggiornamento può essere segnalato come completato.

Se il bootstrap di pnpm fallisce comunque, l'updater si arresta in anticipo con un errore specifico del gestore pacchetti invece di provare `npm run build` dentro il checkout.
</Note>

## Abbreviazione `--update`

`openclaw --update` viene riscritto in `openclaw update` (utile per shell e script di avvio).

## Correlati

- `openclaw doctor` (propone di eseguire prima l'aggiornamento sui checkout git)
- [Canali di sviluppo](/it/install/development-channels)
- [Aggiornamento](/it/install/updating)
- [Riferimento CLI](/it/cli)
