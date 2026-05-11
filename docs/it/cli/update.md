---
read_when:
    - Vuoi aggiornare un checkout del sorgente in modo sicuro
    - Stai eseguendo il debug dell'output o delle opzioni di `openclaw update`
    - È necessario comprendere il comportamento della forma abbreviata `--update`
summary: Riferimento CLI per `openclaw update` (aggiornamento del sorgente relativamente sicuro + riavvio automatico del Gateway)
title: Aggiorna
x-i18n:
    generated_at: "2026-05-11T20:26:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: cefe31181412d398f205a51429f6f5c20e86dfa96bd3d78333cefeb8ab6873b0
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Aggiorna OpenClaw in modo sicuro e passa tra i canali stable/beta/dev.

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

- `--no-restart`: salta il riavvio del servizio Gateway dopo un aggiornamento riuscito. Gli aggiornamenti tramite gestore di pacchetti che riavviano il Gateway verificano che il servizio riavviato riporti la versione aggiornata prevista prima che il comando riesca.
- `--channel <stable|beta|dev>`: imposta il canale di aggiornamento (git + npm; persistito nella configurazione).
- `--tag <dist-tag|version|spec>`: sovrascrive la destinazione del pacchetto solo per questo aggiornamento. Per le installazioni da pacchetto, `main` corrisponde a `github:openclaw/openclaw#main`.
- `--dry-run`: visualizza in anteprima le azioni di aggiornamento pianificate (flusso canale/tag/destinazione/riavvio) senza scrivere la configurazione, installare, sincronizzare i plugin o riavviare.
- `--json`: stampa JSON `UpdateRunResult` leggibile da macchina, includendo
  `postUpdate.plugins.warnings` quando plugin gestiti corrotti o non caricabili richiedono
  una riparazione dopo il successo dell’aggiornamento del core, i dettagli del fallback dei plugin
  del canale beta quando un plugin non ha una release beta, e `postUpdate.plugins.integrityDrifts`
  quando viene rilevata una deriva dell’artefatto npm del plugin durante la sincronizzazione post-aggiornamento dei plugin.
- `--timeout <seconds>`: timeout per passaggio (predefinito 1800s).
- `--yes`: salta le richieste di conferma (per esempio la conferma di downgrade).

`openclaw update` non ha un flag `--verbose`. Usa `--dry-run` per visualizzare in anteprima
le azioni pianificate di canale/tag/installazione/riavvio, `--json` per risultati leggibili
da macchina, e `openclaw update status --json` quando servono solo i dettagli su canale e
disponibilità. Se stai eseguendo il debug dei log del Gateway durante un aggiornamento,
la verbosità della console e il livello dei log su file sono separati: Gateway `--verbose` influisce
sull’output terminale/WebSocket, mentre i log su file richiedono `logging.level: "debug"` o
`"trace"` nella configurazione. Vedi [Log del Gateway](/it/gateway/logging).

<Note>
In modalità Nix (`OPENCLAW_NIX_MODE=1`), le esecuzioni mutanti di `openclaw update` sono disabilitate. Aggiorna invece la sorgente Nix o l’input flake per questa installazione; per nix-openclaw, usa [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) agent-first. `openclaw update status` e `openclaw update --dry-run` restano in sola lettura.
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
- `--timeout <seconds>`: timeout per i controlli (predefinito 3s).

## `update wizard`

Flusso interattivo per scegliere un canale di aggiornamento e confermare se riavviare il Gateway
dopo l’aggiornamento (l’impostazione predefinita è riavviare). Se selezioni `dev` senza un checkout git,
offre di crearne uno.

Opzioni:

- `--timeout <seconds>`: timeout per ogni passaggio di aggiornamento (predefinito `1800`)

## Cosa fa

Quando cambi canale esplicitamente (`--channel ...`), OpenClaw mantiene allineato anche il
metodo di installazione:

- `dev` → assicura un checkout git (predefinito: `~/openclaw`, sovrascrivibile con `OPENCLAW_GIT_DIR`),
  lo aggiorna e installa la CLI globale da quel checkout.
- `stable` → installa da npm usando `latest`.
- `beta` → preferisce il dist-tag npm `beta`, ma ripiega su `latest` quando beta è
  mancante o precedente alla release stable corrente.

L’auto-updater del core Gateway (quando abilitato tramite configurazione) avvia il percorso di aggiornamento della CLI
fuori dall’handler di richieste Gateway live. Gli aggiornamenti tramite gestore di pacchetti `update.run`
del piano di controllo forzano un riavvio di aggiornamento non differito e senza cooldown dopo la sostituzione del pacchetto,
perché il vecchio processo Gateway potrebbe avere ancora in memoria chunk che puntano a
file rimossi dal nuovo pacchetto.

Per le installazioni tramite gestore di pacchetti, `openclaw update` risolve la versione
del pacchetto di destinazione prima di invocare il gestore di pacchetti. Le installazioni globali npm usano un’installazione
a staging: OpenClaw installa il nuovo pacchetto in un prefisso npm temporaneo, verifica
l’inventario `dist` impacchettato lì, quindi sostituisce quell’albero di pacchetto pulito nel
prefisso globale reale. Se la verifica fallisce, doctor post-aggiornamento, sincronizzazione dei plugin e
riavvio non vengono eseguiti dall’albero sospetto. Anche quando la versione installata
corrisponde già alla destinazione, il comando aggiorna l’installazione globale del pacchetto,
poi esegue la sincronizzazione dei plugin, un aggiornamento del completamento dei comandi core e il riavvio. Questo
mantiene sidecar impacchettati e record dei plugin posseduti dal canale allineati con la
build OpenClaw installata, lasciando le ricostruzioni complete del completamento dei comandi dei plugin alle
esecuzioni esplicite di `openclaw completion --write-state`.

Quando un servizio Gateway gestito locale è installato e il riavvio è abilitato,
gli aggiornamenti tramite gestore di pacchetti arrestano il servizio in esecuzione prima di sostituire l’albero del pacchetto,
quindi aggiornano i metadati del servizio dall’installazione aggiornata, riavviano il
servizio e verificano che il Gateway riavviato riporti la versione prevista prima di
segnalare il successo. Su macOS, il controllo post-aggiornamento verifica anche che il LaunchAgent
sia caricato/in esecuzione per il profilo attivo e che la porta loopback configurata sia
integra. Se il plist è installato ma launchd non lo supervisiona, OpenClaw
riesegue automaticamente il bootstrap del LaunchAgent, quindi riesegue i
controlli di prontezza su salute/versione/canale. Un bootstrap nuovo carica direttamente il job RunAtLoad,
quindi il recupero dell’aggiornamento non esegue subito `kickstart -k` sul Gateway appena
avviato. Se il Gateway continua a non diventare sano, il comando termina
con codice diverso da zero e stampa il percorso del log di riavvio più istruzioni esplicite per riavvio, reinstallazione e
rollback del pacchetto. Con `--no-restart`,
la sostituzione del pacchetto viene comunque eseguita, ma il servizio gestito non viene arrestato né
riavviato, quindi il Gateway in esecuzione potrebbe mantenere il vecchio codice finché non lo riavvii
manualmente.

## Flusso di checkout git

### Selezione del canale

- `stable`: esegue il checkout dell’ultimo tag non beta, quindi build e doctor.
- `beta`: preferisce l’ultimo tag `-beta`, ma ripiega sull’ultimo tag stable quando beta è mancante o precedente.
- `dev`: esegue il checkout di `main`, quindi fetch e rebase.

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
    Esegue la build TypeScript in una worktree temporanea. Se il tip fallisce, torna indietro fino a 10 commit per trovare il commit più recente che può essere buildato. Imposta `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` per eseguire anche il lint durante questo preflight; il lint viene eseguito in modalità seriale vincolata perché gli host di aggiornamento degli utenti sono spesso più piccoli dei runner CI.
  </Step>
  <Step title="Rebase">
    Esegue il rebase sul commit selezionato (solo dev).
  </Step>
  <Step title="Install dependencies">
    Usa il gestore di pacchetti del repo. Per i checkout pnpm, l’updater esegue il bootstrap di `pnpm` on demand (prima tramite `corepack`, poi con un fallback temporaneo `npm install pnpm@11`) invece di eseguire `npm run build` dentro un workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Esegue la build del gateway e della UI di controllo.
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` viene eseguito come controllo finale di aggiornamento sicuro.
  </Step>
  <Step title="Sync plugins">
    Sincronizza i plugin con il canale attivo. Dev usa i plugin inclusi; stable e beta usano npm. Aggiorna le installazioni dei plugin tracciate.
  </Step>
</Steps>

Sul canale di aggiornamento beta, le installazioni di plugin npm e ClawHub tracciate che seguono
la linea predefinita/latest provano prima una release plugin `@beta`. Se il plugin non ha
una release beta, OpenClaw ripiega sulla spec predefinita/latest registrata e segnala
questo come avviso. Per i plugin npm, OpenClaw ripiega anche quando il pacchetto beta
esiste ma non supera la validazione di installazione. Questi avvisi di fallback dei plugin non
fanno fallire l’aggiornamento del core. Versioni esatte e tag espliciti non vengono
riscritti.

<Warning>
Se un aggiornamento di plugin npm fissato a una versione esatta risolve a un artefatto la cui integrità differisce dal record di installazione memorizzato, `openclaw update` interrompe l’aggiornamento di quell’artefatto plugin invece di installarlo. Reinstalla o aggiorna esplicitamente il plugin solo dopo aver verificato che ti fidi del nuovo artefatto.
</Warning>

<Note>
Gli errori di sincronizzazione dei plugin post-aggiornamento limitati a un plugin gestito vengono riportati come avvisi dopo il successo dell’aggiornamento del core. Il risultato JSON mantiene lo `status: "ok"` di aggiornamento di primo livello e riporta `postUpdate.plugins.status: "warning"` con indicazioni per `openclaw doctor --fix` e `openclaw plugins inspect <id> --runtime --json`. Eccezioni inattese dell’updater o della sincronizzazione fanno comunque fallire il risultato dell’aggiornamento. Correggi l’installazione del plugin o l’errore di aggiornamento, quindi riesegui `openclaw doctor --fix` o `openclaw update`.

Quando il Gateway aggiornato si avvia, il caricamento dei plugin è solo di verifica: l’avvio non esegue gestori di pacchetti né modifica alberi di dipendenze. I riavvii `update.run` tramite gestore di pacchetti bypassano il normale differimento per inattività e il cooldown di riavvio dopo che l’albero del pacchetto è stato sostituito, così il vecchio processo non può continuare a caricare pigramente chunk rimossi.

Se il bootstrap di pnpm continua a fallire, l’updater si ferma in anticipo con un errore specifico del gestore di pacchetti invece di provare `npm run build` dentro il checkout.
</Note>

## Scorciatoia `--update`

`openclaw --update` viene riscritto in `openclaw update` (utile per shell e script di avvio).

## Correlati

- `openclaw doctor` (offre di eseguire prima update sui checkout git)
- [Canali di sviluppo](/it/install/development-channels)
- [Aggiornamento](/it/install/updating)
- [Riferimento CLI](/it/cli)
