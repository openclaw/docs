---
read_when:
    - Vuoi aggiornare in sicurezza un checkout del codice sorgente
    - Stai eseguendo il debug dell'output o delle opzioni di `openclaw update`
    - È necessario comprendere il comportamento della forma abbreviata `--update`
summary: Riferimento CLI per `openclaw update` (aggiornamento della sorgente abbastanza sicuro + riavvio automatico del Gateway)
title: Aggiorna
x-i18n:
    generated_at: "2026-05-06T08:44:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92eff9aeaecd4bf4eaa98fa511a3b9ebaedaf5872ff9407398665f2a8c2ab7d9
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Aggiorna OpenClaw in sicurezza e passa tra i canali stable/beta/dev.

Se hai installato tramite **npm/pnpm/bun** (installazione globale, senza metadati git),
gli aggiornamenti avvengono tramite il flusso del gestore di pacchetti in [Aggiornamento](/it/install/updating).

## Uso

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

- `--no-restart`: salta il riavvio del servizio Gateway dopo un aggiornamento riuscito. Gli aggiornamenti tramite gestore di pacchetti che riavviano il Gateway verificano che il servizio riavviato riporti la versione aggiornata prevista prima che il comando abbia successo.
- `--channel <stable|beta|dev>`: imposta il canale di aggiornamento (git + npm; salvato nella configurazione).
- `--tag <dist-tag|version|spec>`: sovrascrive la destinazione del pacchetto solo per questo aggiornamento. Per le installazioni da pacchetto, `main` corrisponde a `github:openclaw/openclaw#main`.
- `--dry-run`: mostra in anteprima le azioni di aggiornamento pianificate (flusso channel/tag/target/restart) senza scrivere configurazione, installare, sincronizzare plugin o riavviare.
- `--json`: stampa JSON `UpdateRunResult` leggibile da macchina, includendo
  `postUpdate.plugins.warnings` quando plugin gestiti corrotti o non caricabili richiedono
  riparazione dopo il successo dell'aggiornamento del core, e `postUpdate.plugins.integrityDrifts`
  quando viene rilevata una deriva degli artefatti dei plugin npm durante la sincronizzazione post-aggiornamento dei plugin.
- `--timeout <seconds>`: timeout per passaggio (predefinito 1800s).
- `--yes`: salta le richieste di conferma (per esempio la conferma di downgrade).

`openclaw update` non ha un flag `--verbose`. Usa `--dry-run` per visualizzare in anteprima
le azioni channel/tag/install/restart pianificate, `--json` per risultati leggibili
da macchina e `openclaw update status --json` quando ti servono solo dettagli su canale e
disponibilità. Se stai eseguendo il debug dei log del Gateway durante un aggiornamento,
la verbosità della console e il livello dei log su file sono separati: Gateway `--verbose` influisce
sull'output terminale/WebSocket, mentre i log su file richiedono `logging.level: "debug"` o
`"trace"` nella configurazione. Vedi [log del Gateway](/it/gateway/logging).

<Warning>
I downgrade richiedono conferma perché le versioni precedenti possono rompere la configurazione.
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
- `--timeout <seconds>`: timeout per i controlli (predefinito 3s).

## `update wizard`

Flusso interattivo per scegliere un canale di aggiornamento e confermare se riavviare il Gateway
dopo l'aggiornamento (l'impostazione predefinita è riavviare). Se selezioni `dev` senza un checkout git,
propone di crearne uno.

Opzioni:

- `--timeout <seconds>`: timeout per ogni passaggio di aggiornamento (predefinito `1800`)

## Cosa fa

Quando cambi canale esplicitamente (`--channel ...`), OpenClaw mantiene anche allineato
il metodo di installazione:

- `dev` → garantisce un checkout git (predefinito: `~/openclaw`, sovrascrivibile con `OPENCLAW_GIT_DIR`),
  lo aggiorna e installa la CLI globale da quel checkout.
- `stable` → installa da npm usando `latest`.
- `beta` → preferisce il dist-tag npm `beta`, ma ripiega su `latest` quando beta è
  assente o precedente alla release stable corrente.

L'aggiornatore automatico del core Gateway (quando abilitato tramite configurazione) avvia il percorso di aggiornamento CLI
fuori dall'handler della richiesta Gateway live. Gli aggiornamenti tramite gestore di pacchetti del piano di controllo `update.run`
forzano un riavvio di aggiornamento non differito e senza periodo di cooldown dopo la sostituzione del pacchetto,
perché il vecchio processo Gateway potrebbe avere ancora in memoria blocchi che puntano a
file rimossi dal nuovo pacchetto.

Per le installazioni tramite gestore di pacchetti, `openclaw update` risolve la versione del pacchetto
di destinazione prima di invocare il gestore di pacchetti. Le installazioni globali npm usano un'installazione
staged: OpenClaw installa il nuovo pacchetto in un prefisso npm temporaneo, verifica
l'inventario `dist` impacchettato lì, poi sostituisce quell'albero di pacchetto pulito nel
vero prefisso globale. Se la verifica fallisce, il doctor post-aggiornamento, la sincronizzazione dei plugin e
il lavoro di riavvio non vengono eseguiti dall'albero sospetto. Anche quando la versione installata
corrisponde già alla destinazione, il comando aggiorna l'installazione globale del pacchetto,
poi esegue la sincronizzazione dei plugin, un aggiornamento del completamento dei comandi core e il lavoro di riavvio. Questo
mantiene i sidecar impacchettati e i record dei plugin di proprietà del canale allineati con la
build OpenClaw installata, lasciando le ricostruzioni complete del completamento dei comandi dei plugin alle
esecuzioni esplicite di `openclaw completion --write-state`.

Quando è installato un servizio Gateway gestito locale e il riavvio è abilitato,
gli aggiornamenti tramite gestore di pacchetti fermano il servizio in esecuzione prima di sostituire l'albero
del pacchetto, poi aggiornano i metadati del servizio dall'installazione aggiornata, riavviano il
servizio e verificano che il Gateway riavviato riporti la versione prevista prima di
segnalare il successo. Su macOS, il controllo post-aggiornamento verifica anche che il LaunchAgent
sia caricato/in esecuzione per il profilo attivo e che la porta loopback configurata sia
sana. Se il plist è installato ma launchd non lo sta supervisionando, OpenClaw
riavvia automaticamente il bootstrap del LaunchAgent, poi riesegue i controlli di
salute/versione/canale. Un bootstrap nuovo carica direttamente il job RunAtLoad,
quindi il recupero dell'aggiornamento non esegue immediatamente `kickstart -k` sul Gateway
appena avviato. Se il Gateway continua a non diventare sano, il comando termina
con codice diverso da zero e stampa il percorso del log di riavvio più istruzioni esplicite per riavvio, reinstallazione e
rollback del pacchetto. Con `--no-restart`,
la sostituzione del pacchetto viene comunque eseguita ma il servizio gestito non viene fermato né
riavviato, quindi il Gateway in esecuzione può mantenere il vecchio codice finché non lo riavvii
manualmente.

## Flusso di checkout git

### Selezione del canale

- `stable`: checkout dell'ultimo tag non-beta, poi build e doctor.
- `beta`: preferisce l'ultimo tag `-beta`, ma ripiega sull'ultimo tag stable quando beta è assente o precedente.
- `dev`: checkout di `main`, poi fetch e rebase.

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
    Esegue la build TypeScript in un worktree temporaneo. Se il tip fallisce, torna indietro fino a 10 commit per trovare il commit più recente compilabile. Imposta `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` per eseguire anche il lint durante questo preflight; il lint viene eseguito in modalità seriale vincolata perché gli host di aggiornamento degli utenti sono spesso più piccoli dei runner CI.
  </Step>
  <Step title="Rebase">
    Esegue il rebase sul commit selezionato (solo dev).
  </Step>
  <Step title="Installa dipendenze">
    Usa il gestore di pacchetti del repo. Per i checkout pnpm, l'aggiornatore inizializza `pnpm` su richiesta (prima tramite `corepack`, poi con fallback temporaneo `npm install pnpm@10`) invece di eseguire `npm run build` dentro un workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Compila il gateway e la Control UI.
  </Step>
  <Step title="Esegui doctor">
    `openclaw doctor` viene eseguito come controllo finale di aggiornamento sicuro.
  </Step>
  <Step title="Sincronizza plugin">
    Sincronizza i plugin con il canale attivo. Dev usa i plugin inclusi; stable e beta usano npm. Aggiorna le installazioni dei plugin tracciate.
  </Step>
</Steps>

Sul canale di aggiornamento beta, le installazioni tracciate di plugin npm e ClawHub che seguono
la linea default/latest provano prima una release del plugin `@beta`. Se il plugin non ha
una release beta, OpenClaw ripiega sulla spec default/latest registrata. Per i plugin
npm, OpenClaw ripiega anche quando il pacchetto beta esiste ma fallisce la
validazione dell'installazione. Le versioni esatte e i tag espliciti non vengono riscritti.

<Warning>
Se un aggiornamento di plugin npm con pin esatto risolve a un artefatto la cui integrità differisce dal record di installazione salvato, `openclaw update` interrompe quell'aggiornamento dell'artefatto del plugin invece di installarlo. Reinstalla o aggiorna il plugin esplicitamente solo dopo aver verificato che ritieni affidabile il nuovo artefatto.
</Warning>

<Note>
Gli errori di sincronizzazione dei plugin post-aggiornamento circoscritti a un plugin gestito vengono riportati come avvisi dopo che l'aggiornamento del core ha avuto successo. Il risultato JSON mantiene lo `status: "ok"` di primo livello dell'aggiornamento e riporta `postUpdate.plugins.status: "warning"` con indicazioni per `openclaw doctor --fix` e `openclaw plugins inspect <id> --runtime --json`. Le eccezioni inattese dell'aggiornatore o della sincronizzazione continuano a far fallire il risultato dell'aggiornamento. Correggi l'installazione del plugin o l'errore di aggiornamento, poi riesegui `openclaw doctor --fix` o `openclaw update`.

Quando il Gateway aggiornato si avvia, il caricamento dei plugin è solo di verifica: l'avvio non esegue gestori di pacchetti né modifica alberi di dipendenze. I riavvii `update.run` tramite gestore di pacchetti aggirano il normale differimento per inattività e il cooldown di riavvio dopo che l'albero del pacchetto è stato sostituito, quindi il vecchio processo non può continuare a caricare lazy blocchi rimossi.

Se il bootstrap di pnpm continua a fallire, l'aggiornatore si ferma presto con un errore specifico del gestore di pacchetti invece di provare `npm run build` dentro il checkout.
</Note>

## Scorciatoia `--update`

`openclaw --update` viene riscritto in `openclaw update` (utile per shell e script di avvio).

## Correlati

- `openclaw doctor` (propone di eseguire prima l'aggiornamento sui checkout git)
- [Canali di sviluppo](/it/install/development-channels)
- [Aggiornamento](/it/install/updating)
- [Riferimento CLI](/it/cli)
