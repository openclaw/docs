---
read_when:
    - Si desidera aggiornare in modo sicuro un checkout dei sorgenti
    - Stai eseguendo il debug dell'output o delle opzioni di `openclaw update`
    - Devi comprendere il comportamento abbreviato di `--update`
summary: Riferimento CLI per `openclaw update` (aggiornamento relativamente sicuro della sorgente + riavvio automatico del Gateway)
title: Aggiorna
x-i18n:
    generated_at: "2026-05-07T01:52:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 33c1474c6525257b79e947dfa4ce750cadd4e2e440775f5fa3058dcea1a17809
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
- `--tag <dist-tag|version|spec>`: sostituisce la destinazione del pacchetto solo per questo aggiornamento. Per le installazioni da pacchetto, `main` corrisponde a `github:openclaw/openclaw#main`.
- `--dry-run`: mostra in anteprima le azioni di aggiornamento pianificate (flusso canale/tag/destinazione/riavvio) senza scrivere la configurazione, installare, sincronizzare plugin o riavviare.
- `--json`: stampa JSON `UpdateRunResult` leggibile da macchina, inclusi
  `postUpdate.plugins.warnings` quando plugin gestiti corrotti o non caricabili richiedono
  riparazione dopo il successo dell'aggiornamento del core, e `postUpdate.plugins.integrityDrifts`
  quando viene rilevata una deriva dell'artefatto del plugin npm durante la sincronizzazione dei plugin post-aggiornamento.
- `--timeout <seconds>`: timeout per passaggio (il valore predefinito è 1800s).
- `--yes`: salta le richieste di conferma (ad esempio la conferma di downgrade).

`openclaw update` non ha un flag `--verbose`. Usa `--dry-run` per visualizzare in anteprima
le azioni pianificate di canale/tag/installazione/riavvio, `--json` per risultati leggibili da macchina
e `openclaw update status --json` quando ti servono solo i dettagli su canale e
disponibilità. Se stai eseguendo il debug dei log del Gateway durante un aggiornamento,
la verbosità della console e il livello dei log su file sono separati: Gateway `--verbose` influisce
sull'output terminale/WebSocket, mentre i log su file richiedono `logging.level: "debug"` o
`"trace"` nella configurazione. Vedi [Logging del Gateway](/it/gateway/logging).

<Note>
In modalità Nix (`OPENCLAW_NIX_MODE=1`), le esecuzioni mutanti di `openclaw update` sono disabilitate. Aggiorna invece la sorgente Nix o l'input flake per questa installazione; per nix-openclaw, usa la [Guida rapida](https://github.com/openclaw/nix-openclaw#quick-start) agent-first. `openclaw update status` e `openclaw update --dry-run` restano in sola lettura.
</Note>

<Warning>
I downgrade richiedono conferma perché le versioni precedenti possono rompere la configurazione.
</Warning>

## `update status`

Mostra il canale di aggiornamento attivo + tag/branch/SHA git (per checkout da sorgente), oltre alla disponibilità di aggiornamenti.

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
dopo l'aggiornamento (l'impostazione predefinita è riavviare). Se selezioni `dev` senza un checkout git,
propone di crearne uno.

Opzioni:

- `--timeout <seconds>`: timeout per ogni passaggio di aggiornamento (predefinito `1800`)

## Cosa fa

Quando cambi canale in modo esplicito (`--channel ...`), OpenClaw mantiene anche
allineato il metodo di installazione:

- `dev` → assicura un checkout git (predefinito: `~/openclaw`, sostituibile con `OPENCLAW_GIT_DIR`),
  lo aggiorna e installa la CLI globale da quel checkout.
- `stable` → installa da npm usando `latest`.
- `beta` → preferisce il dist-tag npm `beta`, ma ripiega su `latest` quando beta è
  assente o più vecchio della release stable corrente.

OpenClaw non ha ancora un canale di supporto LTS o mensile. Stiamo lavorando
verso linee di supporto mensili, ma `--channel` attualmente accetta solo
`stable`, `beta` e `dev`. Usa `--tag <version-or-dist-tag>` per una destinazione
una tantum quando ti serve uno specifico artefatto di pacchetto.

L'auto-updater del core Gateway (quando abilitato tramite configurazione) avvia il percorso di aggiornamento CLI
fuori dall'handler della richiesta Gateway attiva. Gli aggiornamenti tramite package manager
`update.run` del control plane forzano un riavvio di aggiornamento non differito e senza cooldown dopo lo scambio del pacchetto,
perché il vecchio processo Gateway potrebbe avere ancora in memoria chunk che puntano a
file rimossi dal nuovo pacchetto.

Per le installazioni tramite package manager, `openclaw update` risolve la versione
del pacchetto di destinazione prima di invocare il package manager. Le installazioni globali npm usano
un'installazione staged: OpenClaw installa il nuovo pacchetto in un prefisso npm temporaneo, verifica
l'inventario `dist` del pacchetto lì, poi scambia quel package tree pulito nel
prefisso globale reale. Se la verifica fallisce, doctor post-aggiornamento, sincronizzazione plugin e
riavvio non vengono eseguiti dal tree sospetto. Anche quando la versione installata
corrisponde già alla destinazione, il comando aggiorna l'installazione globale del pacchetto,
poi esegue la sincronizzazione plugin, un refresh del completamento dei comandi core e il riavvio. Questo
mantiene i sidecar pacchettizzati e i record dei plugin posseduti dal canale allineati con la
build OpenClaw installata, lasciando le ricostruzioni complete del completamento dei comandi plugin alle
esecuzioni esplicite di `openclaw completion --write-state`.

Quando è installato un servizio Gateway gestito locale e il riavvio è abilitato,
gli aggiornamenti tramite package manager arrestano il servizio in esecuzione prima di sostituire il package
tree, poi aggiornano i metadati del servizio dall'installazione aggiornata, riavviano il
servizio e verificano che il Gateway riavviato riporti la versione prevista prima di
segnalare il successo. Su macOS, il controllo post-aggiornamento verifica anche che il LaunchAgent
sia caricato/in esecuzione per il profilo attivo e che la porta loopback configurata sia
integra. Se il plist è installato ma launchd non lo sta supervisionando, OpenClaw
ri-esegue automaticamente il bootstrap del LaunchAgent, poi riesegue i controlli di
prontezza salute/versione/canale. Un bootstrap fresco carica direttamente il job RunAtLoad,
quindi il ripristino dell'aggiornamento non esegue immediatamente `kickstart -k` sul Gateway
appena avviato. Se il Gateway continua a non diventare integro, il comando esce
con codice diverso da zero e stampa il percorso del log di riavvio più istruzioni esplicite per riavvio, reinstallazione e
rollback del pacchetto. Con `--no-restart`,
la sostituzione del pacchetto viene comunque eseguita ma il servizio gestito non viene arrestato o
riavviato, quindi il Gateway in esecuzione potrebbe mantenere il vecchio codice finché non lo riavvii
manualmente.

## Flusso di checkout git

### Selezione del canale

- `stable`: esegue il checkout del tag non beta più recente, poi build e doctor.
- `beta`: preferisce il tag `-beta` più recente, ma ripiega sul tag stable più recente quando beta è assente o più vecchio.
- `dev`: esegue il checkout di `main`, poi fetch e rebase.

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
    Esegue la build TypeScript in un worktree temporaneo. Se il tip fallisce, torna indietro fino a 10 commit per trovare il commit più nuovo che compila. Imposta `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` per eseguire anche il lint durante questo preflight; il lint viene eseguito in modalità seriale vincolata perché gli host di aggiornamento degli utenti sono spesso più piccoli dei runner CI.
  </Step>
  <Step title="Rebase">
    Esegue il rebase sul commit selezionato (solo dev).
  </Step>
  <Step title="Installa dipendenze">
    Usa il package manager del repo. Per checkout pnpm, l'updater esegue il bootstrap di `pnpm` on demand (prima tramite `corepack`, poi con fallback temporaneo `npm install pnpm@10`) invece di eseguire `npm run build` dentro un workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Compila il gateway e la Control UI.
  </Step>
  <Step title="Esegui doctor">
    `openclaw doctor` viene eseguito come controllo finale di aggiornamento sicuro.
  </Step>
  <Step title="Sincronizza plugin">
    Sincronizza i plugin sul canale attivo. Dev usa i plugin in bundle; stable e beta usano npm. Aggiorna le installazioni plugin tracciate.
  </Step>
</Steps>

Sul canale di aggiornamento beta, le installazioni plugin npm e ClawHub tracciate che seguono
la linea default/latest provano prima una release plugin `@beta`. Se il plugin non ha
release beta, OpenClaw ripiega sulla spec default/latest registrata. Per i plugin npm,
OpenClaw ripiega anche quando il pacchetto beta esiste ma fallisce la validazione
dell'installazione. Versioni esatte e tag espliciti non vengono riscritti.

<Warning>
Se un aggiornamento di plugin npm con pin esatto risolve a un artefatto la cui integrità differisce dal record di installazione archiviato, `openclaw update` interrompe quell'aggiornamento dell'artefatto plugin invece di installarlo. Reinstalla o aggiorna esplicitamente il plugin solo dopo aver verificato che ti fidi del nuovo artefatto.
</Warning>

<Note>
Gli errori di sincronizzazione plugin post-aggiornamento che sono limitati a un plugin gestito vengono segnalati come avvisi dopo il successo dell'aggiornamento del core. Il risultato JSON mantiene lo `status: "ok"` dell'aggiornamento di livello superiore e segnala `postUpdate.plugins.status: "warning"` con indicazioni `openclaw doctor --fix` e `openclaw plugins inspect <id> --runtime --json`. Le eccezioni inattese dell'updater o della sincronizzazione fanno comunque fallire il risultato dell'aggiornamento. Correggi l'installazione del plugin o l'errore di aggiornamento, poi riesegui `openclaw doctor --fix` o `openclaw update`.

Quando il Gateway aggiornato si avvia, il caricamento dei plugin è solo di verifica: l'avvio non esegue package manager né muta i dependency tree. I riavvii `update.run` tramite package manager bypassano il normale differimento idle e il cooldown di riavvio dopo lo scambio del package tree, così il vecchio processo non può continuare a caricare lazy chunk rimossi.

Se il bootstrap di pnpm continua a fallire, l'updater si ferma in anticipo con un errore specifico del package manager invece di provare `npm run build` dentro il checkout.
</Note>

## Abbreviazione `--update`

`openclaw --update` viene riscritto in `openclaw update` (utile per shell e script launcher).

## Correlati

- `openclaw doctor` (propone di eseguire prima update sui checkout git)
- [Canali di sviluppo](/it/install/development-channels)
- [Aggiornamento](/it/install/updating)
- [Riferimento CLI](/it/cli)
