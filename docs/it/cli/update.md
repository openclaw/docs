---
read_when:
    - Vuoi aggiornare un checkout dei sorgenti in modo sicuro
    - È necessario comprendere il comportamento abbreviato di `--update`
summary: Riferimento CLI per `openclaw update` (aggiornamento abbastanza sicuro del sorgente + riavvio automatico del Gateway)
title: Aggiornamento
x-i18n:
    generated_at: "2026-05-02T08:19:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc88dc7963f1ae7d847a573924e9af7ede207f2f20028a18808116de4912d24e
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Aggiorna OpenClaw in sicurezza e passa tra i canali stable/beta/dev.

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

- `--no-restart`: salta il riavvio del servizio Gateway dopo un aggiornamento riuscito. Gli aggiornamenti tramite gestore di pacchetti che riavviano il Gateway verificano che il servizio riavviato riporti la versione aggiornata prevista prima che il comando vada a buon fine.
- `--channel <stable|beta|dev>`: imposta il canale di aggiornamento (git + npm; salvato nella configurazione).
- `--tag <dist-tag|version|spec>`: sovrascrive la destinazione del pacchetto solo per questo aggiornamento. Per le installazioni da pacchetto, `main` corrisponde a `github:openclaw/openclaw#main`.
- `--dry-run`: mostra in anteprima le azioni di aggiornamento pianificate (flusso canale/tag/destinazione/riavvio) senza scrivere la configurazione, installare, sincronizzare plugin o riavviare.
- `--json`: stampa JSON `UpdateRunResult` leggibile da macchine, inclusi
  `postUpdate.plugins.integrityDrifts` quando viene rilevata una divergenza
  degli artefatti dei plugin npm durante la sincronizzazione dei plugin post-aggiornamento.
- `--timeout <seconds>`: timeout per passaggio (il valore predefinito è 1800s).
- `--yes`: salta le richieste di conferma (per esempio la conferma di downgrade).

<Warning>
I downgrade richiedono conferma perché le versioni precedenti possono interrompere la configurazione.
</Warning>

## `update status`

Mostra il canale di aggiornamento attivo + tag/branch/SHA git (per i checkout da sorgente), oltre alla disponibilità di aggiornamenti.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opzioni:

- `--json`: stampa JSON di stato leggibile da macchine.
- `--timeout <seconds>`: timeout per i controlli (il valore predefinito è 3s).

## `update wizard`

Flusso interattivo per scegliere un canale di aggiornamento e confermare se riavviare il Gateway
dopo l'aggiornamento (l'impostazione predefinita è riavviare). Se selezioni `dev` senza un checkout git,
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
  assente o più vecchio dell'attuale rilascio stabile.

L'auto-updater del core Gateway (quando abilitato tramite configurazione) avvia il percorso di aggiornamento CLI
fuori dall'handler della richiesta live del Gateway. Gli aggiornamenti tramite gestore di pacchetti `update.run`
del control plane forzano un riavvio di aggiornamento non differito e senza cooldown dopo lo scambio del pacchetto,
perché il vecchio processo Gateway potrebbe avere ancora in memoria chunk che puntano a
file rimossi dal nuovo pacchetto.

Per le installazioni tramite gestore di pacchetti, `openclaw update` risolve la versione
del pacchetto di destinazione prima di invocare il gestore di pacchetti. Le installazioni globali npm usano
un'installazione preparata: OpenClaw installa il nuovo pacchetto in un prefisso npm temporaneo, verifica
l'inventario `dist` incluso nel pacchetto, quindi scambia quell'albero di pacchetti pulito con il
prefisso globale reale. Se la verifica fallisce, il doctor post-aggiornamento, la sincronizzazione dei plugin e
il lavoro di riavvio non vengono eseguiti dall'albero sospetto. Anche quando la versione installata
corrisponde già alla destinazione, il comando aggiorna l'installazione globale del pacchetto,
quindi esegue la sincronizzazione dei plugin, un aggiornamento del completamento dei comandi core e il lavoro di riavvio. Questo
mantiene allineati i sidecar impacchettati e i record dei plugin di proprietà del canale con la
build OpenClaw installata, lasciando le ricostruzioni complete del completamento dei comandi dei plugin
alle esecuzioni esplicite di `openclaw completion --write-state`.

Quando è installato un servizio Gateway gestito locale e il riavvio è abilitato,
gli aggiornamenti tramite gestore di pacchetti fermano il servizio in esecuzione prima di sostituire l'albero
del pacchetto, quindi aggiornano i metadati del servizio dall'installazione aggiornata, riavviano il
servizio e verificano che il Gateway riavviato riporti la versione prevista. Con
`--no-restart`, la sostituzione del pacchetto viene comunque eseguita ma il servizio gestito non viene
fermato né riavviato, quindi il Gateway in esecuzione può mantenere il vecchio codice finché non lo riavvii
manualmente.

## Flusso del checkout Git

### Selezione del canale

- `stable`: effettua il checkout dell'ultimo tag non beta, poi esegue build e doctor.
- `beta`: preferisce l'ultimo tag `-beta`, ma ripiega sull'ultimo tag stabile quando beta è assente o più vecchio.
- `dev`: effettua il checkout di `main`, poi esegue fetch e rebase.

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
    Esegue lint e build TypeScript in un worktree temporaneo. Se il tip fallisce, risale fino a 10 commit per trovare la build pulita più recente.
  </Step>
  <Step title="Rebase">
    Esegue il rebase sul commit selezionato (solo dev).
  </Step>
  <Step title="Install dependencies">
    Usa il gestore di pacchetti del repo. Per i checkout pnpm, l'updater inizializza `pnpm` su richiesta (prima tramite `corepack`, poi con fallback temporaneo `npm install pnpm@10`) invece di eseguire `npm run build` dentro un workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Compila il gateway e la Control UI.
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` viene eseguito come controllo finale di aggiornamento sicuro.
  </Step>
  <Step title="Sync plugins">
    Sincronizza i plugin sul canale attivo. Dev usa i plugin in bundle; stable e beta usano npm. Aggiorna i plugin installati da npm.
  </Step>
</Steps>

<Warning>
Se un aggiornamento esatto di un plugin npm con pin risolve a un artefatto la cui integrità differisce dal record di installazione salvato, `openclaw update` interrompe quell'aggiornamento dell'artefatto del plugin invece di installarlo. Reinstalla o aggiorna il plugin esplicitamente solo dopo aver verificato che consideri attendibile il nuovo artefatto.
</Warning>

<Note>
Gli errori della sincronizzazione dei plugin post-aggiornamento fanno fallire il risultato dell'aggiornamento e fermano il lavoro di riavvio successivo. Correggi l'errore di installazione o aggiornamento del plugin, quindi riesegui `openclaw update`.

Quando il Gateway aggiornato si avvia, il caricamento dei plugin è solo di verifica: l'avvio non esegue gestori di pacchetti né modifica alberi di dipendenze. I riavvii `update.run` del gestore di pacchetti bypassano il normale differimento per inattività e il cooldown di riavvio dopo che l'albero del pacchetto è stato scambiato, quindi il vecchio processo non può continuare a caricare pigramente chunk rimossi.

Se il bootstrap pnpm continua a fallire, l'updater si ferma presto con un errore specifico del gestore di pacchetti invece di provare `npm run build` dentro il checkout.
</Note>

## Scorciatoia `--update`

`openclaw --update` viene riscritto in `openclaw update` (utile per shell e script di avvio).

## Correlati

- `openclaw doctor` (propone di eseguire prima l'aggiornamento sui checkout git)
- [Canali di sviluppo](/it/install/development-channels)
- [Aggiornamento](/it/install/updating)
- [Riferimento CLI](/it/cli)
