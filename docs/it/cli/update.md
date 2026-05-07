---
read_when:
    - Vuoi aggiornare un checkout del codice sorgente in modo sicuro
    - Stai eseguendo il debug dell'output o delle opzioni di `openclaw update`
    - È necessario comprendere il comportamento dell'abbreviazione `--update`
summary: Riferimento CLI per `openclaw update` (aggiornamento della sorgente relativamente sicuro + riavvio automatico del Gateway)
title: Aggiornamento
x-i18n:
    generated_at: "2026-05-07T13:15:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 483e702dfe7f1d1b2f4bcd1037a93ba794fc6a24ff2060afcb3a825c3dc165c7
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

- `--no-restart`: salta il riavvio del servizio Gateway dopo un aggiornamento riuscito. Gli aggiornamenti tramite gestore di pacchetti che riavviano il Gateway verificano che il servizio riavviato riporti la versione aggiornata prevista prima che il comando abbia esito positivo.
- `--channel <stable|beta|dev>`: imposta il canale di aggiornamento (git + npm; persistito nella configurazione).
- `--tag <dist-tag|version|spec>`: sovrascrive la destinazione del pacchetto solo per questo aggiornamento. Per le installazioni da pacchetto, `main` corrisponde a `github:openclaw/openclaw#main`.
- `--dry-run`: visualizza in anteprima le azioni di aggiornamento pianificate (flusso channel/tag/target/restart) senza scrivere la configurazione, installare, sincronizzare Plugin o riavviare.
- `--json`: stampa JSON `UpdateRunResult` leggibile da macchina, includendo
  `postUpdate.plugins.warnings` quando Plugin gestiti corrotti o non caricabili richiedono
  una riparazione dopo il successo dell'aggiornamento del core, e `postUpdate.plugins.integrityDrifts`
  quando durante la sincronizzazione dei Plugin post-aggiornamento viene rilevata una deriva degli artefatti Plugin npm.
- `--timeout <seconds>`: timeout per ogni passaggio (predefinito 1800s).
- `--yes`: salta le richieste di conferma (per esempio la conferma del downgrade).

`openclaw update` non ha un flag `--verbose`. Usa `--dry-run` per visualizzare in anteprima
le azioni channel/tag/install/restart pianificate, `--json` per risultati leggibili da macchina
e `openclaw update status --json` quando ti servono solo i dettagli sul canale e
sulla disponibilità. Se stai eseguendo il debug dei log del Gateway durante un aggiornamento,
la verbosità della console e il livello dei log su file sono separati: `--verbose` del Gateway influisce
sull'output terminale/WebSocket, mentre i log su file richiedono `logging.level: "debug"` o
`"trace"` nella configurazione. Vedi [Log del Gateway](/it/gateway/logging).

<Note>
In modalità Nix (`OPENCLAW_NIX_MODE=1`), le esecuzioni mutanti di `openclaw update` sono disabilitate. Aggiorna invece la sorgente Nix o l'input flake per questa installazione; per nix-openclaw, usa l'[Avvio rapido](https://github.com/openclaw/nix-openclaw#quick-start) agent-first. `openclaw update status` e `openclaw update --dry-run` rimangono in sola lettura.
</Note>

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
- `--timeout <seconds>`: timeout per i controlli (predefinito 3s).

## `update wizard`

Flusso interattivo per scegliere un canale di aggiornamento e confermare se riavviare il Gateway
dopo l'aggiornamento (l'impostazione predefinita è riavviare). Se selezioni `dev` senza un checkout git, propone
di crearne uno.

Opzioni:

- `--timeout <seconds>`: timeout per ogni passaggio di aggiornamento (predefinito `1800`)

## Cosa fa

Quando passi esplicitamente da un canale all'altro (`--channel ...`), OpenClaw mantiene anche
allineato il metodo di installazione:

- `dev` → garantisce un checkout git (predefinito: `~/openclaw`, sovrascrivibile con `OPENCLAW_GIT_DIR`),
  lo aggiorna e installa la CLI globale da quel checkout.
- `stable` → installa da npm usando `latest`.
- `beta` → preferisce il dist-tag npm `beta`, ma ripiega su `latest` quando beta è
  mancante o più vecchio dell'attuale release stable.

L'aggiornatore automatico del core Gateway (quando abilitato tramite configurazione) avvia il percorso di aggiornamento della CLI
fuori dall'handler delle richieste Gateway live. Gli aggiornamenti tramite gestore di pacchetti `update.run` del piano di controllo
forzano un riavvio di aggiornamento non differito e senza cooldown dopo la sostituzione del pacchetto,
perché il vecchio processo Gateway potrebbe avere ancora in memoria parti che puntano a
file rimossi dal nuovo pacchetto.

Per le installazioni tramite gestore di pacchetti, `openclaw update` risolve la versione del pacchetto
di destinazione prima di invocare il gestore di pacchetti. Le installazioni globali npm usano un'installazione
a staging: OpenClaw installa il nuovo pacchetto in un prefisso npm temporaneo, verifica
l'inventario `dist` confezionato lì, quindi sostituisce quell'albero di pacchetti pulito nel
prefisso globale reale. Se la verifica fallisce, doctor post-aggiornamento, sincronizzazione Plugin e
riavvio non vengono eseguiti dall'albero sospetto. Anche quando la versione installata
corrisponde già alla destinazione, il comando aggiorna l'installazione del pacchetto globale,
quindi esegue la sincronizzazione Plugin, un aggiornamento del completamento dei comandi core e il riavvio. Questo
mantiene i sidecar confezionati e i record Plugin di proprietà del canale allineati con la
build OpenClaw installata, lasciando le ricostruzioni complete del completamento dei comandi Plugin alle
esecuzioni esplicite di `openclaw completion --write-state`.

Quando è installato un servizio Gateway gestito locale e il riavvio è abilitato,
gli aggiornamenti tramite gestore di pacchetti arrestano il servizio in esecuzione prima di sostituire l'albero
dei pacchetti, quindi aggiornano i metadati del servizio dall'installazione aggiornata, riavviano il
servizio e verificano che il Gateway riavviato riporti la versione prevista prima di
segnalare il successo. Su macOS, il controllo post-aggiornamento verifica anche che il LaunchAgent
sia caricato/in esecuzione per il profilo attivo e che la porta loopback configurata sia
integra. Se il plist è installato ma launchd non lo supervisiona, OpenClaw
ri-esegue automaticamente il bootstrap del LaunchAgent, quindi ripete i
controlli di prontezza health/version/channel. Un bootstrap fresco carica direttamente il job RunAtLoad,
quindi il recupero dell'aggiornamento non esegue subito `kickstart -k` sul Gateway
appena avviato. Se il Gateway continua a non diventare integro, il comando esce
con codice diverso da zero e stampa il percorso del log di riavvio più istruzioni esplicite per riavvio, reinstallazione e
rollback del pacchetto. Con `--no-restart`,
la sostituzione del pacchetto viene comunque eseguita ma il servizio gestito non viene arrestato né
riavviato, quindi il Gateway in esecuzione può mantenere il vecchio codice finché non lo riavvii
manualmente.

## Flusso di checkout git

### Selezione del canale

- `stable`: esegue il checkout dell'ultimo tag non beta, quindi build e doctor.
- `beta`: preferisce l'ultimo tag `-beta`, ma ripiega sull'ultimo tag stable quando beta è mancante o più vecchio.
- `dev`: esegue il checkout di `main`, quindi fetch e rebase.

### Passaggi di aggiornamento

<Steps>
  <Step title="Verifica worktree pulita">
    Richiede che non ci siano modifiche non committate.
  </Step>
  <Step title="Cambia canale">
    Passa al canale selezionato (tag o branch).
  </Step>
  <Step title="Recupera upstream">
    Solo dev.
  </Step>
  <Step title="Build preflight (solo dev)">
    Esegue la build TypeScript in una worktree temporanea. Se la punta fallisce, risale fino a 10 commit per trovare il commit più recente compilabile. Imposta `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` per eseguire anche il lint durante questo preflight; il lint viene eseguito in modalità seriale vincolata perché gli host di aggiornamento degli utenti sono spesso più piccoli dei runner CI.
  </Step>
  <Step title="Rebase">
    Esegue il rebase sul commit selezionato (solo dev).
  </Step>
  <Step title="Installa dipendenze">
    Usa il gestore di pacchetti del repo. Per i checkout pnpm, l'aggiornatore esegue il bootstrap di `pnpm` su richiesta (prima tramite `corepack`, poi con fallback temporaneo `npm install pnpm@10`) invece di eseguire `npm run build` dentro un workspace pnpm.
  </Step>
  <Step title="Compila Control UI">
    Compila il gateway e la Control UI.
  </Step>
  <Step title="Esegui doctor">
    `openclaw doctor` viene eseguito come controllo finale dell'aggiornamento sicuro.
  </Step>
  <Step title="Sincronizza Plugin">
    Sincronizza i Plugin sul canale attivo. Dev usa i Plugin inclusi; stable e beta usano npm. Aggiorna le installazioni Plugin tracciate.
  </Step>
</Steps>

Sul canale di aggiornamento beta, le installazioni Plugin npm e ClawHub tracciate che seguono
la linea predefinita/latest provano prima una release Plugin `@beta`. Se il Plugin non ha
una release beta, OpenClaw ripiega sulla spec predefinita/latest registrata. Per i Plugin npm,
OpenClaw ripiega anche quando il pacchetto beta esiste ma non supera la validazione
dell'installazione. Versioni esatte e tag espliciti non vengono riscritti.

<Warning>
Se un aggiornamento di Plugin npm con pin esatto risolve a un artefatto la cui integrità differisce dal record di installazione memorizzato, `openclaw update` interrompe quell'aggiornamento dell'artefatto Plugin invece di installarlo. Reinstalla o aggiorna esplicitamente il Plugin solo dopo aver verificato di fidarti del nuovo artefatto.
</Warning>

<Note>
Gli errori di sincronizzazione Plugin post-aggiornamento circoscritti a un Plugin gestito vengono segnalati come avvisi dopo il successo dell'aggiornamento del core. Il risultato JSON mantiene lo `status: "ok"` di aggiornamento di livello superiore e riporta `postUpdate.plugins.status: "warning"` con indicazioni su `openclaw doctor --fix` e `openclaw plugins inspect <id> --runtime --json`. Le eccezioni inattese dell'aggiornatore o della sincronizzazione continuano a far fallire il risultato dell'aggiornamento. Correggi l'errore di installazione o aggiornamento del Plugin, quindi riesegui `openclaw doctor --fix` o `openclaw update`.

Quando il Gateway aggiornato si avvia, il caricamento Plugin è solo di verifica: l'avvio non esegue gestori di pacchetti né modifica alberi di dipendenze. I riavvii `update.run` del gestore di pacchetti bypassano il normale differimento per inattività e il cooldown di riavvio dopo che l'albero dei pacchetti è stato sostituito, quindi il vecchio processo non può continuare a caricare lazy parti rimosse.

Se il bootstrap di pnpm continua a fallire, l'aggiornatore si ferma in anticipo con un errore specifico del gestore di pacchetti invece di provare `npm run build` dentro il checkout.
</Note>

## Abbreviazione `--update`

`openclaw --update` viene riscritto in `openclaw update` (utile per shell e script di avvio).

## Correlati

- `openclaw doctor` (propone di eseguire prima l'aggiornamento sui checkout git)
- [Canali di sviluppo](/it/install/development-channels)
- [Aggiornamento](/it/install/updating)
- [Riferimento CLI](/it/cli)
