---
read_when:
    - Vuoi aggiornare in modo sicuro un checkout del codice sorgente
    - Stai eseguendo il debug dell'output o delle opzioni di `openclaw update`
    - È necessario comprendere il comportamento abbreviato di `--update`
summary: Riferimento CLI per `openclaw update` (aggiornamento dei sorgenti relativamente sicuro + riavvio automatico del Gateway)
title: Aggiorna
x-i18n:
    generated_at: "2026-05-03T21:29:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53ec06b8db5e2aba4000922f92a36834e8782986a77f6b5889bb19031a59f1b8
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Aggiorna OpenClaw in modo sicuro e passa tra i canali stable/beta/dev.

Se hai installato tramite **npm/pnpm/bun** (installazione globale, senza metadati git),
gli aggiornamenti avvengono tramite il flusso del package manager in [Aggiornamento](/it/install/updating).

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

- `--no-restart`: salta il riavvio del servizio Gateway dopo un aggiornamento riuscito. Gli aggiornamenti tramite package manager che riavviano il Gateway verificano che il servizio riavviato riporti la versione aggiornata prevista prima che il comando abbia esito positivo.
- `--channel <stable|beta|dev>`: imposta il canale di aggiornamento (git + npm; persistito nella configurazione).
- `--tag <dist-tag|version|spec>`: sovrascrive la destinazione del pacchetto solo per questo aggiornamento. Per le installazioni da pacchetto, `main` corrisponde a `github:openclaw/openclaw#main`.
- `--dry-run`: mostra in anteprima le azioni di aggiornamento pianificate (canale/tag/destinazione/flusso di riavvio) senza scrivere la configurazione, installare, sincronizzare i Plugin o riavviare.
- `--json`: stampa JSON `UpdateRunResult` leggibile da macchina, incluso
  `postUpdate.plugins.integrityDrifts` quando viene rilevata una deriva degli
  artefatti dei Plugin npm durante la sincronizzazione dei Plugin post-aggiornamento.
- `--timeout <seconds>`: timeout per passaggio (il valore predefinito è 1800s).
- `--yes`: salta le richieste di conferma (per esempio la conferma di downgrade).

`openclaw update` non ha un flag `--verbose`. Usa `--dry-run` per vedere in anteprima
le azioni pianificate di canale/tag/installazione/riavvio, `--json` per risultati
leggibili da macchina e `openclaw update status --json` quando ti servono solo i
dettagli su canale e disponibilità. Se stai eseguendo il debug dei log del Gateway
durante un aggiornamento, la verbosità della console e il livello dei log su file
sono separati: `--verbose` del Gateway influisce sull'output terminale/WebSocket,
mentre i log su file richiedono `logging.level: "debug"` o `"trace"` nella
configurazione. Vedi [Log del Gateway](/it/gateway/logging).

<Warning>
I downgrade richiedono conferma perché le versioni precedenti possono rompere la configurazione.
</Warning>

## `update status`

Mostra il canale di aggiornamento attivo + tag/branch/SHA git (per checkout del sorgente), oltre alla disponibilità degli aggiornamenti.

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

Quando cambi canale esplicitamente (`--channel ...`), OpenClaw mantiene allineato
anche il metodo di installazione:

- `dev` → garantisce un checkout git (predefinito: `~/openclaw`, sovrascrivibile con `OPENCLAW_GIT_DIR`),
  lo aggiorna e installa la CLI globale da quel checkout.
- `stable` → installa da npm usando `latest`.
- `beta` → preferisce il dist-tag npm `beta`, ma ripiega su `latest` quando beta è
  mancante o precedente rispetto alla release stable corrente.

L'aggiornatore automatico del core Gateway (quando abilitato tramite configurazione) avvia il percorso di aggiornamento della CLI
fuori dall'handler live delle richieste del Gateway. Gli aggiornamenti tramite package manager `update.run` del piano di controllo
forzano un riavvio di aggiornamento non differito e senza cooldown dopo lo scambio del pacchetto,
perché il vecchio processo Gateway potrebbe avere ancora chunk in memoria che puntano a
file rimossi dal nuovo pacchetto.

Per le installazioni tramite package manager, `openclaw update` risolve la versione del pacchetto
di destinazione prima di invocare il package manager. Le installazioni globali npm usano
un'installazione a staging: OpenClaw installa il nuovo pacchetto in un prefisso npm temporaneo,
verifica lì l'inventario `dist` del pacchetto, quindi scambia quell'albero pulito del pacchetto
nel prefisso globale reale. Se la verifica fallisce, doctor post-aggiornamento, sincronizzazione
dei Plugin e riavvio non vengono eseguiti dall'albero sospetto. Anche quando la versione installata
corrisponde già alla destinazione, il comando aggiorna l'installazione globale del pacchetto,
poi esegue la sincronizzazione dei Plugin, un aggiornamento del completamento dei comandi core
e il lavoro di riavvio. Questo mantiene i sidecar pacchettizzati e i record dei Plugin di proprietà
del canale allineati alla build OpenClaw installata, lasciando le ricostruzioni complete del
completamento dei comandi dei Plugin alle esecuzioni esplicite di `openclaw completion --write-state`.

Quando è installato un servizio Gateway locale gestito e il riavvio è abilitato,
gli aggiornamenti tramite package manager arrestano il servizio in esecuzione prima di sostituire l'albero
del pacchetto, quindi aggiornano i metadati del servizio dall'installazione aggiornata, riavviano il
servizio e verificano che il Gateway riavviato riporti la versione prevista prima
di segnalare il successo. Su macOS, il controllo post-aggiornamento verifica anche che il LaunchAgent
sia caricato/in esecuzione per il profilo attivo e che la porta loopback configurata sia
integra. Se il plist è installato ma launchd non lo sta supervisionando, OpenClaw
riesegue automaticamente il bootstrap del LaunchAgent, quindi ripete i controlli di
prontezza di salute/versione/canale. Un bootstrap nuovo carica direttamente il job RunAtLoad,
quindi il ripristino dell'aggiornamento non esegue immediatamente `kickstart -k` sul Gateway
appena avviato. Se il Gateway continua a non diventare integro, il comando esce
con codice diverso da zero e stampa il percorso del log di riavvio più istruzioni esplicite
per riavvio, reinstallazione e rollback del pacchetto. Con `--no-restart`,
la sostituzione del pacchetto viene comunque eseguita, ma il servizio gestito non viene arrestato né
riavviato, quindi il Gateway in esecuzione può mantenere il vecchio codice finché non lo riavvii
manualmente.

## Flusso di checkout git

### Selezione del canale

- `stable`: esegue il checkout del tag non beta più recente, quindi build e doctor.
- `beta`: preferisce l'ultimo tag `-beta`, ma ripiega sull'ultimo tag stable quando beta è mancante o precedente.
- `dev`: esegue il checkout di `main`, quindi fetch e rebase.

### Passaggi di aggiornamento

<Steps>
  <Step title="Verify clean worktree">
    Richiede che non ci siano modifiche non commitate.
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
    Usa il package manager del repo. Per i checkout pnpm, l'aggiornatore esegue il bootstrap di `pnpm` su richiesta (prima tramite `corepack`, poi con fallback temporaneo `npm install pnpm@10`) invece di eseguire `npm run build` dentro un workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Compila il Gateway e la Control UI.
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` viene eseguito come controllo finale di aggiornamento sicuro.
  </Step>
  <Step title="Sync plugins">
    Sincronizza i Plugin con il canale attivo. Dev usa Plugin in bundle; stable e beta usano npm. Aggiorna le installazioni dei Plugin tracciate.
  </Step>
</Steps>

Sul canale di aggiornamento beta, le installazioni di Plugin npm e ClawHub tracciate che seguono
la linea predefinita/latest provano prima una release Plugin `@beta`. Se il Plugin non ha
una release beta, OpenClaw ripiega sulla spec predefinita/latest registrata. Le versioni
esatte e i tag espliciti non vengono riscritti.

<Warning>
Se l'aggiornamento di un Plugin npm con pin esatto risolve a un artefatto la cui integrità differisce dal record di installazione archiviato, `openclaw update` interrompe quell'aggiornamento dell'artefatto Plugin invece di installarlo. Reinstalla o aggiorna esplicitamente il Plugin solo dopo aver verificato che consideri affidabile il nuovo artefatto.
</Warning>

<Note>
Gli errori di sincronizzazione dei Plugin post-aggiornamento fanno fallire il risultato dell'aggiornamento e interrompono il lavoro di riavvio successivo. Correggi l'errore di installazione o aggiornamento del Plugin, quindi riesegui `openclaw update`.

Quando il Gateway aggiornato si avvia, il caricamento dei Plugin è solo di verifica: l'avvio non esegue package manager né muta gli alberi delle dipendenze. I riavvii `update.run` tramite package manager ignorano il normale differimento per inattività e il cooldown di riavvio dopo che l'albero del pacchetto è stato scambiato, così il vecchio processo non può continuare a caricare in modo lazy chunk rimossi.

Se il bootstrap pnpm fallisce comunque, l'aggiornatore si ferma in anticipo con un errore specifico del package manager invece di provare `npm run build` dentro il checkout.
</Note>

## Abbreviazione `--update`

`openclaw --update` viene riscritto in `openclaw update` (utile per shell e script di avvio).

## Correlati

- `openclaw doctor` (propone di eseguire prima l'aggiornamento sui checkout git)
- [Canali di sviluppo](/it/install/development-channels)
- [Aggiornamento](/it/install/updating)
- [Riferimento CLI](/it/cli)
