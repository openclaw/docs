---
read_when:
    - Si desidera aggiornare in modo sicuro un checkout del codice sorgente
    - Si sta eseguendo il debug dell'output o delle opzioni di `openclaw update`
    - È necessario comprendere il comportamento della sintassi abbreviata `--update`
summary: Riferimento CLI per `openclaw update` (aggiornamento abbastanza sicuro del codice sorgente + riavvio automatico del Gateway)
title: Aggiorna
x-i18n:
    generated_at: "2026-07-16T14:04:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b46696f6b9cba5c318f870bcb6c5ea8e0652940968da2ad85e86709fe4c11146
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Aggiorna OpenClaw e passa tra i canali stable/extended-stable/beta/dev.

Se l'installazione è stata eseguita tramite **npm/pnpm/bun** (installazione globale, senza metadati git),
gli aggiornamenti seguono il flusso del gestore di pacchetti descritto in
[Aggiornamento](/it/install/updating).

## Utilizzo

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --channel extended-stable
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

`openclaw --update` viene riscritto come `openclaw update` (utile per shell e
script di avvio).

## Opzioni

| Flag                                             | Descrizione                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-restart`                                   | Evita di riavviare il servizio Gateway dopo un aggiornamento riuscito. Gli aggiornamenti tramite gestore di pacchetti che eseguono il riavvio verificano che il servizio riavviato segnali la versione prevista prima che il comando termini correttamente.                                                                                                                                                |
| `--channel <stable\|extended-stable\|beta\|dev>` | Imposta il canale di aggiornamento e lo rende persistente dopo il completamento dell'aggiornamento del core. Extended-stable è disponibile solo per i pacchetti.                                                                                                                                                                                                                                            |
| `--tag <dist-tag\|version\|spec>`                | Sostituisce la destinazione del pacchetto solo per questo aggiornamento. Non può essere combinato con un canale `extended-stable` effettivo, per il quale è obbligatoria la destinazione esatta verificata. Per le altre installazioni di pacchetti, `main` corrisponde a `github:openclaw/openclaw#main`; le specifiche sorgente GitHub/git vengono impacchettate in un tarball temporaneo prima dell'installazione npm globale a fasi. |
| `--dry-run`                                      | Mostra un'anteprima delle azioni pianificate (flusso di canale/tag/destinazione/riavvio) senza scrivere la configurazione, installare, sincronizzare i plugin o riavviare.                                                                                                                                                                                                                |
| `--json`                                         | Stampa JSON `UpdateRunResult` leggibile dalla macchina. Include `postUpdate.plugins.warnings` quando un plugin gestito richiede una riparazione, i dettagli del fallback dei plugin del canale beta e `postUpdate.plugins.integrityDrifts` quando viene rilevata una divergenza nell'artefatto di un plugin npm durante la sincronizzazione successiva all'aggiornamento.                                                                 |
| `--timeout <seconds>`                            | Timeout per ciascun passaggio. Valore predefinito: `1800`.                                                                                                                                                                                                                                                                                                            |
| `--yes`                                          | Ignora le richieste di conferma (ad esempio, la conferma del downgrade).                                                                                                                                                                                                                                                                              |
| `--acknowledge-clawhub-risk`                     | Consente alla sincronizzazione dei plugin successiva all'aggiornamento di proseguire nonostante gli avvisi di attendibilità di ClawHub relativi alla community, senza una richiesta interattiva. In sua assenza, le versioni rischiose della community vengono ignorate e lasciate invariate quando OpenClaw non può richiedere conferma. I pacchetti ufficiali ClawHub e le sorgenti dei plugin inclusi non richiedono questa conferma.                                                     |

Non esiste alcun flag `--verbose`. Utilizzare `--dry-run` per visualizzare in anteprima le azioni pianificate,
`--json` per ottenere risultati leggibili dalla macchina e `openclaw update status --json`
solo per il canale e la disponibilità. Il livello di dettaglio della console del Gateway (`--verbose`) e
il livello di log dei file (`logging.level: "debug"`/`"trace"`) sono controlli indipendenti; consultare
[Log del Gateway](/it/gateway/logging).

<Note>
In modalità Nix (`OPENCLAW_NIX_MODE=1`), le esecuzioni di `openclaw update` che apportano modifiche sono disabilitate. Aggiornare invece la sorgente Nix o l'input della flake per questa installazione; per nix-openclaw, utilizzare la [Guida rapida](https://github.com/openclaw/nix-openclaw#quick-start) con approccio agent-first. `openclaw update status` e `openclaw update --dry-run` rimangono in sola lettura.
</Note>

<Warning>
I downgrade richiedono conferma perché le versioni precedenti possono compromettere la configurazione.
Se l'installazione ha già migrato le sessioni a SQLite, ripristinare gli artefatti archiviati
delle trascrizioni precedenti prima di avviare una versione precedente basata su file. Consultare
[Doctor: downgrade dopo la migrazione delle sessioni a SQLite](/it/cli/doctor#downgrading-after-session-sqlite-migration).
</Warning>

## `update status`

Mostra il canale di aggiornamento attivo, il tag/ramo/SHA git (solo per i checkout del codice sorgente)
e la disponibilità degli aggiornamenti.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

| Flag                  | Valore predefinito | Descrizione                         |
| --------------------- | ------- | ----------------------------------- |
| `--json`              | `false` | Stampa lo stato in formato JSON leggibile dalla macchina. |
| `--timeout <seconds>` | `3`     | Timeout per i controlli.                 |

Per le installazioni di pacchetti extended-stable, lo stato esegue lo stesso selettore pubblico
e la stessa verifica esatta del pacchetto dell'aggiornamento in primo piano. Può segnalare
`ahead of extended-stable` quando la versione installata è più recente. Gli errori JSON
includono `registry.reason` (`selector_missing`, `selector_query_failed`,
`exact_package_mismatch` o `unsupported_git_channel`).

## `update repair`

Esegue nuovamente la finalizzazione dell'aggiornamento dopo che il pacchetto core è già stato modificato, ma le successive
operazioni di riparazione non sono state completate correttamente. Questo è il percorso di ripristino supportato quando
`openclaw update` ha installato il nuovo pacchetto core, ma la sincronizzazione dei plugin successiva all'aggiornamento del core,
i metadati dei plugin npm gestiti, l'aggiornamento del registro o la riparazione tramite Doctor non
sono giunti a convergenza.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

| Flag                                             | Descrizione                                                                                                                                                                                                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--channel <stable\|extended-stable\|beta\|dev>` | Rende persistente il canale di aggiornamento del core prima della riparazione. Per extended-stable, i plugin npm ufficiali idonei che seguono una destinazione bare/predefinita o l'intento `latest` usano come destinazione la versione esatta del core installato. La riparazione extended-stable viene rifiutata nei checkout Git senza modificare la configurazione. |
| `--json`                                         | Stampa il JSON di finalizzazione leggibile dalla macchina.                                                                                                                                                                                                                           |
| `--timeout <seconds>`                            | Timeout per i passaggi di riparazione. Valore predefinito: `1800`.                                                                                                                                                                                                                           |
| `--yes`                                          | Ignora le richieste di conferma.                                                                                                                                                                                                                                          |
| `--acknowledge-clawhub-risk`                     | Stesso comportamento di `openclaw update`.                                                                                                                                                                                                                              |
| `--no-restart`                                   | Accettato per uniformità; la riparazione non riavvia mai il Gateway.                                                                                                                                                                                                             |

`update repair` esegue `openclaw doctor --fix`, ricarica la configurazione riparata e
i record di installazione, sincronizza i plugin monitorati per il canale di aggiornamento attivo, aggiorna
le installazioni dei plugin npm gestiti, ripara i payload mancanti dei plugin configurati,
aggiorna il registro dei plugin e scrive i metadati convergenti dei record di installazione.
Non installa un nuovo pacchetto core e non riavvia il Gateway.

## `update wizard`

Flusso interattivo per scegliere un canale di aggiornamento e confermare se riavviare
successivamente il Gateway (l'impostazione predefinita prevede il riavvio). Se si seleziona `dev` senza un checkout git,
viene proposta la creazione di un checkout.

| Flag                  | Valore predefinito | Descrizione                   |
| --------------------- | ------- | ----------------------------- |
| `--timeout <seconds>` | `1800`  | Timeout per ciascun passaggio dell'aggiornamento. |

## Funzionamento

Il passaggio esplicito da un canale all'altro (`--channel ...`) mantiene inoltre allineato il metodo
di installazione:

- `dev` -> assicura la presenza di un checkout git (valore predefinito `~/openclaw` o
  `$OPENCLAW_HOME/openclaw` quando è impostato `OPENCLAW_HOME`; sostituibile con
  `OPENCLAW_GIT_DIR`), lo aggiorna e installa la CLI globale da tale
  checkout.
- `stable` -> esegue l'installazione da npm utilizzando `latest`.
- `extended-stable` -> risolve il selettore npm pubblico `extended-stable`,
  verifica il pacchetto esatto selezionato e installa quella versione esatta. Non
  utilizza un altro selettore come fallback e viene rifiutato per i checkout Git.
- `beta` -> preferisce il dist-tag npm `beta`, utilizzando come fallback `latest` quando la versione beta è
  assente o precedente alla versione stable corrente.

### Passaggio di consegne per il riavvio

Il programma di aggiornamento automatico del core del Gateway (quando abilitato tramite configurazione) avvia il percorso di
aggiornamento della CLI al di fuori del gestore delle richieste del Gateway attivo. Gli aggiornamenti tramite gestore di pacchetti
`update.run` del piano di controllo e gli aggiornamenti supervisionati dei checkout git utilizzano
lo stesso passaggio di consegne del servizio gestito, anziché sostituire l'albero dei pacchetti o
ricompilare `dist/` all'interno del processo Gateway attivo: il Gateway avvia un
processo ausiliario separato e termina, quindi tale processo esegue `openclaw update --yes --json`
all'esterno dell'albero dei processi del Gateway. Se il passaggio di consegne non è disponibile,
`update.run` restituisce una risposta strutturata contenente il comando shell sicuro da eseguire
manualmente.

Le selezioni extended-stable memorizzate ricevono suggerimenti di avvio in sola lettura e di aggiornamento ogni 24 ore
quando `update.checkOnStart` è abilitato. Questi controlli non applicano mai un aggiornamento,
non avviano un passaggio di consegne, non riavviano il Gateway, non usano il ritardo/jitter di stable né la
cadenza di polling di beta. Restano supportati gli aggiornamenti espliciti in primo piano, gli aggiornamenti
in primo piano senza argomenti con `update.channel: "extended-stable"` memorizzato, lo stato su richiesta e il relativo
passaggio di consegne gestito del Gateway.

Quando è installato un servizio Gateway gestito locale e il riavvio è abilitato,
gli aggiornamenti tramite gestore di pacchetti e checkout Git arrestano il servizio in esecuzione prima
di sostituire l'albero dei pacchetti o modificare l'output del checkout/della build. Il programma di aggiornamento
aggiorna quindi i metadati del servizio, riavvia il servizio e verifica il
Gateway riavviato prima di segnalare `Gateway: restarted and verified.`.
Gli aggiornamenti tramite gestore di pacchetti verificano inoltre che il Gateway riavviato segnali la
versione del pacchetto prevista; gli aggiornamenti del checkout Git verificano l'integrità del gateway e
la disponibilità del servizio dopo la nuova build.

Gli aggiornamenti tramite gestore di pacchetti normalmente continuano a usare il binario Node registrato nel
servizio gestito. Se quel Node non può eseguire la release di destinazione, ma il Node della
CLI corrente può farlo e viene dimostrato che il servizio appartiene al pacchetto in corso di aggiornamento,
un aggiornamento con riavvio abilitato usa il Node corrente per la finalizzazione e riscrive
i metadati del servizio affinché usino tale runtime. `--no-restart` non può riparare i metadati del
servizio, pertanto la stessa incompatibilità del runtime causa l'arresto prima della modifica del pacchetto.

Su macOS, il controllo successivo all'aggiornamento verifica inoltre che LaunchAgent sia
caricato/in esecuzione per il profilo attivo e che la porta di loopback configurata sia
operativa. Se il plist è installato ma launchd non lo supervisiona, OpenClaw
riesegue automaticamente il bootstrap di LaunchAgent e ripete i controlli di integrità/versione/
disponibilità del canale (un nuovo bootstrap carica direttamente il job `RunAtLoad`,
quindi il ripristino non esegue immediatamente `kickstart -k` sul Gateway appena avviato). Se
il Gateway continua a non diventare operativo, il comando termina con un codice diverso da zero e
stampa il percorso del log di riavvio, oltre alle istruzioni per il riavvio, la reinstallazione e il rollback
del pacchetto.

Se il riavvio non può essere eseguito, il comando stampa `Gateway: restart skipped (...)` o
`Gateway: restart failed: ...` con un suggerimento per eseguire manualmente `openclaw gateway restart`.
Con `--no-restart`, la sostituzione del pacchetto o la nuova build Git viene comunque eseguita, ma il
servizio gestito non viene arrestato né riavviato, quindi il Gateway in esecuzione continua a usare il vecchio
codice finché non viene riavviato manualmente.

### Struttura della risposta del piano di controllo

Quando `update.run` viene eseguito tramite il piano di controllo del Gateway in un'installazione
tramite gestore di pacchetti o in un checkout Git supervisionato, il gestore segnala l'avvio del passaggio di consegne
separatamente dall'aggiornamento della CLI che continua dopo l'uscita del Gateway:

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"` e
  `handoff.status: "started"`: il Gateway ha creato il passaggio di consegne del servizio gestito
  e ha pianificato il proprio riavvio, in modo che l'helper separato possa eseguire
  `openclaw update --yes --json` al di fuori del processo del servizio attivo.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"` e
  `handoff.status: "unavailable"`: OpenClaw non ha potuto trovare un
  confine di servizio supervisionato e un'identità persistente del servizio per un passaggio di consegne sicuro (ad
  esempio, il passaggio di consegne di systemd richiede l'identità dell'unità `OPENCLAW_SYSTEMD_UNIT`,
  non soltanto indicatori ambientali dei processi systemd). La risposta include
  `handoff.command`, il comando della shell da eseguire dall'esterno del Gateway.
- `ok: false`, `result.reason: "managed-service-handoff-failed"`: il Gateway
  ha tentato di creare il passaggio di consegne, ma non è riuscito ad avviare l'helper separato.

Il payload `sentinel` viene scritto prima dell'uscita del Gateway e il passaggio di consegne della
CLI aggiorna lo stesso sentinel di riavvio al termine dei controlli di integrità
successivi al riavvio del servizio gestito. Durante il passaggio di consegne, il sentinel può contenere
`stats.reason: "restart-health-pending"` senza alcuna continuazione in caso di successo; il
Gateway riavviato lo interroga ed esegue la continuazione soltanto dopo che la CLI ha
verificato l'integrità del servizio e riscritto il sentinel con il risultato finale `ok`.
`openclaw status` e `openclaw status --all` mostrano una riga `Update restart`
mentre tale sentinel è in sospeso o non è riuscito, mentre `update.status` aggiorna e
restituisce il sentinel più recente.

## Flusso del checkout Git

### Selezione del canale

- `stable`: esegue il checkout del tag non beta più recente, quindi esegue la build e doctor.
- `beta`: preferisce il tag `-beta` più recente, ripiegando sul tag stable più recente
  quando beta è assente o meno recente.
- `dev`: esegue il checkout di `main`, quindi esegue il fetch e il rebase.
- `extended-stable`: non supportato per i checkout Git; non viene eseguita alcuna modifica
  del checkout.

### Passaggi dell'aggiornamento

<Steps>
  <Step title="Verifica un worktree pulito">
    Richiede l'assenza di modifiche non sottoposte a commit.
  </Step>
  <Step title="Cambia canale">
    Passa al canale selezionato (tag o branch).
  </Step>
  <Step title="Recupera dall'upstream">
    Solo dev.
  </Step>
  <Step title="Build preliminare (solo dev)">
    Esegue la build TypeScript in un worktree temporaneo. Se il commit più recente non riesce, torna indietro fino a 10 commit per trovare il commit compilabile più recente. Impostare `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` per eseguire anche il lint durante questo controllo preliminare; il lint viene eseguito in modalità seriale con risorse limitate perché gli host di aggiornamento degli utenti sono spesso meno potenti dei runner CI.
  </Step>
  <Step title="Esegui il rebase">
    Esegue il rebase sul commit selezionato (solo dev).
  </Step>
  <Step title="Installa le dipendenze">
    Usa il gestore di pacchetti del repository. Per i checkout pnpm, il programma di aggiornamento esegue il bootstrap di `pnpm` su richiesta (prima tramite `corepack`, quindi con un fallback temporaneo `npm install pnpm@11`) anziché eseguire `npm run build` all'interno di un workspace pnpm. Se anche il bootstrap di pnpm non riesce, il programma di aggiornamento si arresta anticipatamente con un errore specifico del gestore di pacchetti anziché tentare `npm run build` nel checkout.
  </Step>
  <Step title="Compila l'interfaccia di controllo">
    Compila il gateway e l'interfaccia di controllo.
  </Step>
  <Step title="Esegui doctor">
    `openclaw doctor` viene eseguito come controllo finale di aggiornamento sicuro.
  </Step>
  <Step title="Sincronizza i plugin">
    Sincronizza i plugin con il canale attivo. Dev usa i plugin inclusi; stable e beta usano npm. Aggiorna le installazioni dei plugin monitorate.
  </Step>
</Steps>

### Dettagli della sincronizzazione dei plugin

Sul canale beta, le installazioni dei plugin npm e ClawHub monitorate che seguono la
linea predefinita/latest provano prima una release `@beta` del plugin. Se il plugin non dispone di una
release beta, OpenClaw ripiega sulla specifica predefinita/latest registrata e
segnala un avviso. Per i plugin npm, OpenClaw ripiega inoltre quando il pacchetto
beta esiste ma non supera la convalida dell'installazione. Questi avvisi di fallback non
causano il fallimento dell'aggiornamento principale. Le versioni esatte e i tag espliciti non vengono mai riscritti.

<Warning>
Se l'aggiornamento di un plugin npm associato esattamente a una versione risolve un artefatto la cui integrità differisce dal record di installazione memorizzato, `openclaw update` interrompe l'aggiornamento dell'artefatto del plugin anziché installarlo. Reinstallare o aggiornare esplicitamente il plugin soltanto dopo aver verificato che il nuovo artefatto sia attendibile.
</Warning>

<Note>
Gli errori di sincronizzazione dei plugin successivi all'aggiornamento che sono limitati a un plugin gestito e che il percorso di sincronizzazione può aggirare (ad esempio un registro npm non raggiungibile per un plugin non essenziale) vengono segnalati come avvisi dopo il completamento dell'aggiornamento principale. Il risultato JSON mantiene `status: "ok"` dell'aggiornamento di primo livello e segnala `postUpdate.plugins.status: "warning"` con indicazioni `openclaw update repair` e `openclaw plugins inspect <id> --runtime --json`. Le eccezioni impreviste del programma di aggiornamento o della sincronizzazione causano comunque il fallimento del risultato dell'aggiornamento. Correggere l'errore di installazione o aggiornamento del plugin, quindi rieseguire `openclaw update repair`. Quando un aggiornamento non riuscito rende inutilizzabile un plugin gestito, OpenClaw ne disabilita la voce di runtime e reimposta gli slot attivi senza modificare i criteri `plugins.allow` o `plugins.deny` definiti dall'operatore.

Dopo il passaggio di sincronizzazione di ogni plugin, `openclaw update` esegue un passaggio obbligatorio di **convergenza successiva al core** prima del riavvio del gateway: ripara i payload mancanti dei plugin configurati, convalida su disco ogni record di installazione monitorato _attivo_ e verifica staticamente che il relativo `package.json` sia analizzabile (e che ogni `main` dichiarato esplicitamente esista). Gli errori di questo passaggio e uno snapshot di configurazione non valido restituiscono `postUpdate.plugins.status: "error"` e modificano `status` dell'aggiornamento di primo livello in `"error"`, pertanto `openclaw update` termina con un codice diverso da zero e il gateway _non_ viene riavviato con un insieme di plugin non verificato. L'errore include righe strutturate `postUpdate.plugins.warnings[].guidance` che rimandano a `openclaw update repair` e `openclaw plugins inspect <id> --runtime --json`. Le voci dei plugin disabilitate e i record che non sono destinazioni ufficiali di sincronizzazione collegate a fonti attendibili vengono ignorati in questa fase (rispecchiando il criterio `skipDisabledPlugins` usato dal controllo dei payload mancanti), pertanto un record obsoleto di un plugin disabilitato non può bloccare un aggiornamento altrimenti valido.

All'avvio del Gateway aggiornato, il caricamento dei plugin esegue soltanto la verifica: l'avvio non esegue gestori di pacchetti né modifica gli alberi delle dipendenze. I riavvii `update.run` del gestore di pacchetti vengono affidati al percorso del servizio gestito della CLI, affinché lo scambio del pacchetto avvenga al di fuori del vecchio processo del Gateway e i controlli di integrità del servizio determinino se l'aggiornamento può essere segnalato come completato.
</Note>

Dopo il completamento di un aggiornamento extended-stable del core, l'integrità e
la convergenza dei plugin successive al core hanno come destinazione i plugin npm ufficiali idonei nella versione esatta
del core installato. Per l'intento predefinito/`latest`, OpenClaw non interroga
`@extended-stable` del plugin né ripiega su `latest` di npm; ricava la versione del pacchetto
dal core installato. Le versioni associate esplicitamente, i tag espliciti diversi da `latest`,
i pacchetti di terze parti e le origini diverse da npm mantengono l'intento esistente.

Per le installazioni tramite gestore di pacchetti, `openclaw update` risolve la versione del pacchetto
di destinazione prima di invocare il gestore di pacchetti. Le installazioni globali npm usano un'installazione
preliminare: OpenClaw installa il nuovo pacchetto in un prefisso npm temporaneo,
consente al pacchetto candidato di convalidare la versione Node dell'host durante `preinstall`
e verifica lì l'inventario `dist` incluso nel pacchetto. Una protezione di completamento inclusa nel pacchetto
rimane fuori da tale inventario finché `preinstall` non riesce, in modo che anche i gestori di pacchetti
che ignorano gli script del ciclo di vita si arrestino prima dell'attivazione. Su npm 12 e versioni successive,
il programma di aggiornamento approva soltanto il ciclo di vita del pacchetto OpenClaw candidato; gli script delle
dipendenze transitive rimangono bloccati. OpenClaw scambia quindi l'albero dei pacchetti pulito
nel prefisso globale reale. Se la verifica non riesce, doctor successivo all'aggiornamento, la sincronizzazione dei plugin
e il riavvio non vengono eseguiti dall'albero sospetto. Anche quando la
versione installata corrisponde già alla destinazione, il comando aggiorna
l'installazione globale del pacchetto, quindi esegue la sincronizzazione dei plugin, un aggiornamento del completamento
dei comandi principali e il riavvio. Ciò mantiene i componenti ausiliari inclusi nel pacchetto e i record dei
plugin appartenenti al canale allineati con la build OpenClaw installata, lasciando le ricostruzioni complete
del completamento dei comandi dei plugin alle esecuzioni esplicite di
`openclaw completion --write-state`.

## Correlati

- `openclaw doctor` (propone di eseguire prima l'aggiornamento nei checkout Git)
- [Canali di sviluppo](/it/install/development-channels)
- [Aggiornamento](/it/install/updating)
- [Riferimento della CLI](/it/cli)
