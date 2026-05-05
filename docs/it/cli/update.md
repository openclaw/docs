---
read_when:
    - Vuoi aggiornare in modo sicuro un checkout del codice sorgente
    - Stai eseguendo il debug dell'output o delle opzioni di `openclaw update`
    - È necessario comprendere il comportamento della sintassi abbreviata `--update`
summary: Riferimento CLI per `openclaw update` (aggiornamento della sorgente relativamente sicuro + riavvio automatico del Gateway)
title: Aggiorna
x-i18n:
    generated_at: "2026-05-05T01:45:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: b12b1837ae80a3688fb7805d78d5a354f07dccdaba175cfa429e18145e543a1f
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
- `--channel <stable|beta|dev>`: imposta il canale di aggiornamento (git + npm; salvato nella configurazione).
- `--tag <dist-tag|version|spec>`: sostituisce la destinazione del pacchetto solo per questo aggiornamento. Per le installazioni da pacchetto, `main` corrisponde a `github:openclaw/openclaw#main`.
- `--dry-run`: visualizza in anteprima le azioni di aggiornamento pianificate (flusso channel/tag/target/restart) senza scrivere la configurazione, installare, sincronizzare Plugin o riavviare.
- `--json`: stampa il JSON `UpdateRunResult` leggibile da macchina, inclusi
  `postUpdate.plugins.integrityDrifts` quando viene rilevata una deriva degli artefatti Plugin npm
  durante la sincronizzazione dei Plugin successiva all'aggiornamento.
- `--timeout <seconds>`: timeout per ogni passaggio (il valore predefinito è 1800s).
- `--yes`: salta le richieste di conferma (per esempio la conferma del downgrade).

`openclaw update` non ha un flag `--verbose`. Usa `--dry-run` per visualizzare in anteprima
le azioni pianificate di channel/tag/install/restart, `--json` per risultati leggibili da macchina
e `openclaw update status --json` quando ti servono solo i dettagli del canale e
della disponibilità. Se stai eseguendo il debug dei log del Gateway durante un aggiornamento,
la verbosità della console e il livello dei log su file sono separati: `--verbose` del Gateway influisce
sull'output di terminale/WebSocket, mentre i log su file richiedono `logging.level: "debug"` o
`"trace"` nella configurazione. Vedi [log del Gateway](/it/gateway/logging).

<Warning>
I downgrade richiedono conferma perché le versioni precedenti possono compromettere la configurazione.
</Warning>

## `update status`

Mostra il canale di aggiornamento attivo + tag/branch/SHA git (per i checkout sorgente), oltre alla disponibilità di aggiornamenti.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opzioni:

- `--json`: stampa lo stato JSON leggibile da macchina.
- `--timeout <seconds>`: timeout per i controlli (il valore predefinito è 3s).

## `update wizard`

Flusso interattivo per scegliere un canale di aggiornamento e confermare se riavviare il Gateway
dopo l'aggiornamento (il valore predefinito è riavviare). Se selezioni `dev` senza un checkout git,
offre di crearne uno.

Opzioni:

- `--timeout <seconds>`: timeout per ogni passaggio di aggiornamento (predefinito `1800`)

## Cosa fa

Quando cambi canale in modo esplicito (`--channel ...`), OpenClaw mantiene allineato anche il
metodo di installazione:

- `dev` → garantisce un checkout git (predefinito: `~/openclaw`, sostituibile con `OPENCLAW_GIT_DIR`),
  lo aggiorna e installa la CLI globale da quel checkout.
- `stable` → installa da npm usando `latest`.
- `beta` → preferisce il dist-tag npm `beta`, ma ripiega su `latest` quando beta è
  mancante o più vecchio dell'attuale rilascio stable.

L'auto-updater del core Gateway (quando abilitato tramite configurazione) avvia il percorso di aggiornamento della CLI
fuori dall'handler live delle richieste Gateway. Gli aggiornamenti tramite gestore di pacchetti `update.run` del piano di controllo
forzano un riavvio di aggiornamento non differito e senza cooldown dopo la sostituzione del pacchetto,
perché il vecchio processo Gateway può avere ancora in memoria chunk che puntano a
file rimossi dal nuovo pacchetto.

Per le installazioni tramite gestore di pacchetti, `openclaw update` risolve la versione del pacchetto
di destinazione prima di invocare il gestore di pacchetti. Le installazioni globali npm usano un'installazione
staged: OpenClaw installa il nuovo pacchetto in un prefisso npm temporaneo, verifica
l'inventario `dist` pacchettizzato lì, quindi sostituisce quel package tree pulito nel
prefisso globale reale. Se la verifica fallisce, doctor post-aggiornamento, sincronizzazione dei Plugin e
riavvio non vengono eseguiti dal tree sospetto. Anche quando la versione installata
corrisponde già alla destinazione, il comando aggiorna l'installazione globale del pacchetto,
poi esegue la sincronizzazione dei Plugin, un aggiornamento del completamento dei comandi core e il riavvio. Questo
mantiene i sidecar pacchettizzati e i record dei Plugin posseduti dal canale allineati con la
build OpenClaw installata, lasciando le ricostruzioni complete del completamento dei comandi Plugin alle
esecuzioni esplicite di `openclaw completion --write-state`.

Quando è installato un servizio Gateway gestito locale e il riavvio è abilitato,
gli aggiornamenti tramite gestore di pacchetti arrestano il servizio in esecuzione prima di sostituire il package
tree, poi aggiornano i metadati del servizio dall'installazione aggiornata, riavviano il
servizio e verificano che il Gateway riavviato riporti la versione prevista prima di
segnalare il successo. Su macOS, il controllo post-aggiornamento verifica anche che il LaunchAgent
sia caricato/in esecuzione per il profilo attivo e che la porta local loopback configurata sia
integra. Se il plist è installato ma launchd non lo supervisiona, OpenClaw
esegue automaticamente il bootstrap del LaunchAgent, poi riesegue i
controlli di prontezza di health/version/channel. Un nuovo bootstrap carica direttamente il job RunAtLoad,
quindi il ripristino dell'aggiornamento non esegue immediatamente `kickstart -k` sul Gateway
appena avviato. Se il Gateway continua a non diventare integro, il comando esce
con codice diverso da zero e stampa il percorso del log di riavvio più istruzioni esplicite per riavvio, reinstallazione e
rollback del pacchetto. Con `--no-restart`,
la sostituzione del pacchetto viene comunque eseguita ma il servizio gestito non viene arrestato né
riavviato, quindi il Gateway in esecuzione può mantenere il vecchio codice finché non lo riavvii
manualmente.

## Flusso del checkout git

### Selezione del canale

- `stable`: esegue il checkout dell'ultimo tag non beta, poi build e doctor.
- `beta`: preferisce l'ultimo tag `-beta`, ma ripiega sull'ultimo tag stable quando beta è mancante o più vecchio.
- `dev`: esegue il checkout di `main`, poi fetch e rebase.

### Passaggi di aggiornamento

<Steps>
  <Step title="Verify clean worktree">
    Richiede che non ci siano modifiche non committate.
  </Step>
  <Step title="Switch channel">
    Passa al canale selezionato (tag o branch).
  </Step>
  <Step title="Fetch upstream">
    Solo dev.
  </Step>
  <Step title="Preflight build (dev only)">
    Esegue lint e build TypeScript in una worktree temporanea. Se il tip fallisce, risale fino a 10 commit per trovare la build pulita più recente.
  </Step>
  <Step title="Rebase">
    Esegue il rebase sul commit selezionato (solo dev).
  </Step>
  <Step title="Install dependencies">
    Usa il gestore di pacchetti del repo. Per i checkout pnpm, l'updater inizializza `pnpm` su richiesta (prima tramite `corepack`, poi con un fallback temporaneo `npm install pnpm@10`) invece di eseguire `npm run build` dentro un workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Compila il gateway e l'interfaccia di controllo.
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` viene eseguito come controllo finale di aggiornamento sicuro.
  </Step>
  <Step title="Sync plugins">
    Sincronizza i Plugin con il canale attivo. Dev usa i Plugin inclusi; stable e beta usano npm. Aggiorna le installazioni Plugin tracciate.
  </Step>
</Steps>

Sul canale di aggiornamento beta, le installazioni Plugin npm e ClawHub tracciate che seguono
la linea default/latest provano prima un rilascio Plugin `@beta`. Se il Plugin non ha
un rilascio beta, OpenClaw ripiega sulla spec default/latest registrata. Per i Plugin npm,
OpenClaw ripiega anche quando il pacchetto beta esiste ma fallisce la validazione
dell'installazione. Versioni esatte e tag espliciti non vengono riscritti.

<Warning>
Se un aggiornamento Plugin npm con pin esatto si risolve in un artefatto la cui integrità differisce dal record di installazione memorizzato, `openclaw update` interrompe quell'aggiornamento dell'artefatto Plugin invece di installarlo. Reinstalla o aggiorna il Plugin esplicitamente solo dopo aver verificato che consideri attendibile il nuovo artefatto.
</Warning>

<Note>
Gli errori di sincronizzazione dei Plugin post-aggiornamento fanno fallire il risultato dell'aggiornamento e interrompono il lavoro successivo di riavvio. Correggi l'installazione del Plugin o l'errore di aggiornamento, poi riesegui `openclaw update`.

Quando il Gateway aggiornato si avvia, il caricamento dei Plugin è solo di verifica: l'avvio non esegue gestori di pacchetti né modifica dependency tree. I riavvii tramite gestore di pacchetti `update.run` bypassano il normale differimento per inattività e il cooldown del riavvio dopo la sostituzione del package tree, così il vecchio processo non può continuare a caricare in modo lazy chunk rimossi.

Se il bootstrap pnpm continua a fallire, l'updater si arresta presto con un errore specifico del gestore di pacchetti invece di provare `npm run build` dentro il checkout.
</Note>

## Abbreviazione `--update`

`openclaw --update` viene riscritto in `openclaw update` (utile per shell e script di avvio).

## Correlati

- `openclaw doctor` (offre di eseguire prima l'aggiornamento sui checkout git)
- [Canali di sviluppo](/it/install/development-channels)
- [Aggiornamento](/it/install/updating)
- [Riferimento CLI](/it/cli)
