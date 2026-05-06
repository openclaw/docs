---
read_when:
    - Vuoi aggiornare in sicurezza una copia di lavoro del codice sorgente
    - Stai eseguendo il debug dell'output o delle opzioni di `openclaw update`
    - È necessario comprendere il comportamento della forma abbreviata `--update`
summary: Riferimento CLI per `openclaw update` (aggiornamento sorgente abbastanza sicuro + riavvio automatico del Gateway)
title: Aggiornamento
x-i18n:
    generated_at: "2026-05-06T17:55:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 483e702dfe7f1d1b2f4bcd1037a93ba794fc6a24ff2060afcb3a825c3dc165c7
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Aggiorna OpenClaw in sicurezza e passa tra i canali stable/beta/dev.

Se hai installato tramite **npm/pnpm/bun** (installazione globale, senza metadati git),
gli aggiornamenti avvengono tramite il flusso del gestore di pacchetti descritto in [Aggiornamento](/it/install/updating).

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
- `--dry-run`: mostra in anteprima le azioni di aggiornamento previste (canale/tag/destinazione/flusso di riavvio) senza scrivere la configurazione, installare, sincronizzare Plugin o riavviare.
- `--json`: stampa JSON `UpdateRunResult` leggibile da macchina, inclusi
  `postUpdate.plugins.warnings` quando Plugin gestiti corrotti o non caricabili richiedono
  riparazione dopo il completamento dell'aggiornamento core, e `postUpdate.plugins.integrityDrifts`
  quando viene rilevata una deriva degli artefatti dei Plugin npm durante la sincronizzazione dei Plugin post-aggiornamento.
- `--timeout <seconds>`: timeout per passaggio (il valore predefinito è 1800s).
- `--yes`: salta le richieste di conferma (per esempio la conferma di downgrade).

`openclaw update` non ha un flag `--verbose`. Usa `--dry-run` per vedere in anteprima
le azioni previste di canale/tag/installazione/riavvio, `--json` per risultati
leggibili da macchina e `openclaw update status --json` quando ti servono solo dettagli
su canale e disponibilità. Se stai eseguendo il debug dei log del Gateway durante un aggiornamento,
la verbosità della console e il livello dei log su file sono separati: `--verbose` del Gateway influisce
sull'output di terminale/WebSocket, mentre i log su file richiedono `logging.level: "debug"` o
`"trace"` nella configurazione. Vedi [Logging del Gateway](/it/gateway/logging).

<Note>
In modalità Nix (`OPENCLAW_NIX_MODE=1`), le esecuzioni mutanti di `openclaw update` sono disabilitate. Aggiorna invece la sorgente Nix o l'input flake per questa installazione; per nix-openclaw, usa [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) agent-first. `openclaw update status` e `openclaw update --dry-run` restano di sola lettura.
</Note>

<Warning>
I downgrade richiedono conferma perché le versioni precedenti possono danneggiare la configurazione.
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
dopo l'aggiornamento (il valore predefinito è riavviare). Se selezioni `dev` senza un checkout git, propone
di crearne uno.

Opzioni:

- `--timeout <seconds>`: timeout per ogni passaggio di aggiornamento (valore predefinito `1800`)

## Cosa fa

Quando cambi canale esplicitamente (`--channel ...`), OpenClaw mantiene allineato anche il
metodo di installazione:

- `dev` → assicura un checkout git (predefinito: `~/openclaw`, sovrascrivibile con `OPENCLAW_GIT_DIR`),
  lo aggiorna e installa la CLI globale da quel checkout.
- `stable` → installa da npm usando `latest`.
- `beta` → preferisce il dist-tag npm `beta`, ma ripiega su `latest` quando beta
  manca o è più vecchio della release stable corrente.

L'auto-updater del core del Gateway (quando abilitato tramite configurazione) avvia il percorso di aggiornamento della CLI
al di fuori dell'handler della richiesta live del Gateway. Gli aggiornamenti tramite gestore di pacchetti `update.run`
del control plane forzano un riavvio di aggiornamento non differito e senza cooldown dopo la sostituzione del pacchetto,
perché il vecchio processo Gateway potrebbe ancora avere in memoria chunk che puntano a
file rimossi dal nuovo pacchetto.

Per le installazioni tramite gestore di pacchetti, `openclaw update` risolve la versione
del pacchetto di destinazione prima di invocare il gestore di pacchetti. Le installazioni globali npm usano un'installazione staged:
OpenClaw installa il nuovo pacchetto in un prefisso npm temporaneo, verifica
l'inventario `dist` pacchettizzato lì, quindi sostituisce quell'albero di pacchetto pulito nel
prefisso globale reale. Se la verifica fallisce, doctor post-aggiornamento, sincronizzazione Plugin e
riavvio non vengono eseguiti dall'albero sospetto. Anche quando la versione installata
corrisponde già alla destinazione, il comando aggiorna l'installazione globale del pacchetto,
poi esegue la sincronizzazione dei Plugin, un aggiornamento del completamento dei comandi core e il riavvio. Questo
mantiene i sidecar pacchettizzati e i record dei Plugin gestiti dal canale allineati con la
build OpenClaw installata, lasciando le ricostruzioni complete del completamento dei comandi Plugin alle
esecuzioni esplicite di `openclaw completion --write-state`.

Quando è installato un servizio Gateway gestito locale e il riavvio è abilitato,
gli aggiornamenti tramite gestore di pacchetti arrestano il servizio in esecuzione prima di sostituire l'albero
del pacchetto, poi aggiornano i metadati del servizio dall'installazione aggiornata, riavviano il
servizio e verificano che il Gateway riavviato riporti la versione prevista prima di
segnalare il successo. Su macOS, il controllo post-aggiornamento verifica anche che il LaunchAgent
sia caricato/in esecuzione per il profilo attivo e che la porta local loopback configurata sia
integra. Se il plist è installato ma launchd non lo sta supervisionando, OpenClaw
riesegue automaticamente il bootstrap del LaunchAgent, quindi riesegue i
controlli di integrità/versione/canale. Un bootstrap nuovo carica direttamente il job RunAtLoad,
quindi il ripristino dell'aggiornamento non esegue immediatamente `kickstart -k` sul Gateway
appena avviato. Se il Gateway non diventa comunque integro, il comando termina
con codice diverso da zero e stampa il percorso del log di riavvio più istruzioni esplicite per riavvio, reinstallazione e
rollback del pacchetto. Con `--no-restart`,
la sostituzione del pacchetto viene comunque eseguita ma il servizio gestito non viene arrestato né
riavviato, quindi il Gateway in esecuzione può mantenere il vecchio codice finché non lo riavvii
manualmente.

## Flusso di checkout git

### Selezione del canale

- `stable`: esegue il checkout dell'ultimo tag non beta, poi build e doctor.
- `beta`: preferisce l'ultimo tag `-beta`, ma ripiega sull'ultimo tag stable quando beta manca o è più vecchio.
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
    Esegue la build TypeScript in una worktree temporanea. Se la punta fallisce, risale fino a 10 commit per trovare il commit più recente compilabile. Imposta `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` per eseguire anche lint durante questo preflight; lint viene eseguito in modalità seriale vincolata perché gli host di aggiornamento degli utenti sono spesso più piccoli dei runner CI.
  </Step>
  <Step title="Rebase">
    Esegue il rebase sul commit selezionato (solo dev).
  </Step>
  <Step title="Install dependencies">
    Usa il gestore di pacchetti del repo. Per i checkout pnpm, l'updater esegue il bootstrap di `pnpm` on demand (prima tramite `corepack`, poi con fallback temporaneo `npm install pnpm@10`) invece di eseguire `npm run build` dentro un workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Compila il gateway e la Control UI.
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` viene eseguito come controllo finale di aggiornamento sicuro.
  </Step>
  <Step title="Sync plugins">
    Sincronizza i Plugin con il canale attivo. Dev usa i Plugin bundled; stable e beta usano npm. Aggiorna le installazioni Plugin tracciate.
  </Step>
</Steps>

Sul canale di aggiornamento beta, le installazioni Plugin npm e ClawHub tracciate che seguono
la linea default/latest provano prima una release Plugin `@beta`. Se il Plugin non ha una
release beta, OpenClaw ripiega sulla spec default/latest registrata. Per i Plugin npm,
OpenClaw ripiega anche quando il pacchetto beta esiste ma fallisce la validazione di installazione.
Versioni esatte e tag espliciti non vengono riscritti.

<Warning>
Se un aggiornamento di Plugin npm con pin esatto si risolve in un artefatto la cui integrità differisce dal record di installazione memorizzato, `openclaw update` interrompe quell'aggiornamento dell'artefatto Plugin invece di installarlo. Reinstalla o aggiorna il Plugin esplicitamente solo dopo aver verificato che consideri affidabile il nuovo artefatto.
</Warning>

<Note>
Gli errori di sincronizzazione dei Plugin post-aggiornamento limitati a un Plugin gestito vengono segnalati come avvisi dopo il successo dell'aggiornamento core. Il risultato JSON mantiene `status: "ok"` dell'aggiornamento di livello superiore e riporta `postUpdate.plugins.status: "warning"` con indicazioni su `openclaw doctor --fix` e `openclaw plugins inspect <id> --runtime --json`. Eccezioni inattese dell'updater o della sincronizzazione fanno comunque fallire il risultato dell'aggiornamento. Correggi l'installazione del Plugin o l'errore di aggiornamento, poi riesegui `openclaw doctor --fix` o `openclaw update`.

Quando il Gateway aggiornato si avvia, il caricamento dei Plugin è solo di verifica: l'avvio non esegue gestori di pacchetti né muta gli alberi delle dipendenze. I riavvii `update.run` tramite gestore di pacchetti bypassano il normale differimento in idle e il cooldown di riavvio dopo che l'albero del pacchetto è stato sostituito, quindi il vecchio processo non può continuare a caricare in modo lazy chunk rimossi.

Se il bootstrap di pnpm continua a fallire, l'updater si arresta in anticipo con un errore specifico del gestore di pacchetti invece di provare `npm run build` dentro il checkout.
</Note>

## Scorciatoia `--update`

`openclaw --update` viene riscritto in `openclaw update` (utile per shell e script di avvio).

## Correlati

- `openclaw doctor` (propone di eseguire prima update sui checkout git)
- [Canali di sviluppo](/it/install/development-channels)
- [Aggiornamento](/it/install/updating)
- [Riferimento CLI](/it/cli)
