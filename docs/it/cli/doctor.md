---
read_when:
    - Hai problemi di connettività/autenticazione e vuoi correzioni guidate
    - Hai aggiornato e vuoi un controllo di coerenza
summary: Riferimento CLI per `openclaw doctor` (controlli di integrità + riparazioni guidate)
title: Diagnostica
x-i18n:
    generated_at: "2026-06-27T17:19:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf7c07cd39053fce7efa81d968ef0f2666f6f5331581e72d2684843519c63b43
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Controlli di integrità + correzioni rapide per il Gateway e i canali.

Correlati:

- Risoluzione dei problemi: [Risoluzione dei problemi](/it/gateway/troubleshooting)
- Audit di sicurezza: [Sicurezza](/it/gateway/security)

## Perché Usarlo

`openclaw doctor` è la superficie di integrità di OpenClaw. Usalo quando il Gateway,
i canali, i plugin, le Skills, l'instradamento dei modelli, lo stato locale o le migrazioni della configurazione
non si comportano come previsto e vuoi un unico comando che possa spiegare cosa
non va.

Doctor ha tre modalità:

| Modalità  | Comando                  | Comportamento                                                                  |
| --------- | ------------------------ | ------------------------------------------------------------------------------ |
| Ispeziona | `openclaw doctor`        | Controlli orientati alle persone e prompt guidati.                             |
| Ripara    | `openclaw doctor --fix`  | Applica le riparazioni supportate, usando prompt salvo quando la riparazione non interattiva è sicura. |
| Lint      | `openclaw doctor --lint` | Risultati strutturati di sola lettura per CI, preflight e gate di revisione.   |

Preferisci `--lint` quando l'automazione richiede un risultato stabile. Preferisci `--fix` quando un
operatore umano vuole intenzionalmente che doctor modifichi configurazione o stato.

## Esempi

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
openclaw doctor --post-upgrade
openclaw doctor --post-upgrade --json
```

Per le autorizzazioni specifiche del canale, usa le sonde dei canali invece di `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

La sonda mirata delle capacità Discord segnala le autorizzazioni effettive del bot sul canale; la sonda di stato esegue l'audit dei canali Discord configurati e delle destinazioni di accesso automatico alla voce.

## Opzioni

- `--no-workspace-suggestions`: disabilita i suggerimenti di memoria/ricerca del workspace
- `--yes`: accetta i valori predefiniti senza prompt
- `--repair`: applica le riparazioni non di servizio consigliate senza prompt; le installazioni e riscritture del servizio Gateway richiedono comunque conferma interattiva o comandi Gateway espliciti
- `--fix`: alias di `--repair`
- `--force`: applica riparazioni aggressive, inclusa la sovrascrittura della configurazione di servizio personalizzata quando necessario
- `--non-interactive`: esegui senza prompt; solo migrazioni sicure e riparazioni non di servizio
- `--generate-gateway-token`: genera e configura un token Gateway
- `--allow-exec`: consenti a doctor di eseguire SecretRefs exec configurati durante la verifica dei segreti
- `--deep`: scansiona i servizi di sistema per installazioni Gateway aggiuntive e segnala i recenti passaggi di consegne del riavvio del supervisore Gateway
- `--lint`: esegui controlli di integrità modernizzati in modalità di sola lettura ed emetti risultati diagnostici
- `--post-upgrade`: esegui sonde di compatibilità dei plugin post-upgrade; emette risultati su stdout; termina con codice 1 se sono presenti risultati di livello errore
- `--json`: con `--lint`, emetti risultati JSON invece dell'output umano; con `--post-upgrade`, emetti una busta JSON leggibile dalla macchina (`{ probesRun, findings }`)
- `--severity-min <level>`: con `--lint`, elimina i risultati sotto `info`, `warning` o `error`
- `--all`: con `--lint`, esegui tutti i controlli registrati, inclusi i controlli opt-in esclusi dal set di automazione predefinito
- `--skip <id>`: con `--lint`, salta un id di controllo; ripeti per saltarne più di uno
- `--only <id>`: con `--lint`, esegui solo un id di controllo; ripeti per eseguire un piccolo set selezionato

## Modalità lint

`openclaw doctor --lint` è la modalità di automazione di sola lettura per i controlli doctor.
Usa il percorso strutturato dei controlli di integrità, non mostra prompt e non ripara
né riscrive configurazione/stato. Usala in CI, negli script di preflight e nei workflow di revisione
quando vuoi risultati leggibili dalla macchina invece di prompt di riparazione guidati.
Le opzioni di output lint come `--json`, `--severity-min`, `--all`, `--only` e `--skip`
sono accettate solo con `--lint`.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
```

L'output umano è compatto:

```text
doctor --lint: ran 6 check(s), 1 finding(s)
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode is unset; gateway start will be blocked.
    fix: Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`.
```

L'output JSON è la superficie di scripting per le esecuzioni lint:

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode is unset; gateway start will be blocked.",
      "path": "gateway.mode",
      "fixHint": "Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`."
    }
  ]
}
```

Comportamento di uscita:

- `0`: nessun risultato pari o superiore alla soglia di gravità selezionata
- `1`: almeno un risultato soddisfa la soglia selezionata
- `2`: errore di comando/runtime prima che possano essere prodotti risultati lint

`--severity-min` controlla sia i risultati visibili sia la soglia di uscita. Per
esempio, `openclaw doctor --lint --severity-min error` può non stampare alcun risultato e
uscire con `0` anche quando esistono risultati `info` o `warning` di gravità inferiore.

`--all` controlla quali controlli vengono selezionati prima del filtro per gravità. L'esecuzione lint
predefinita è il gate di automazione stabile ed esclude i controlli che sono
intenzionalmente opt-in perché sono profondi, storici o più propensi a
far emergere residui legacy riparabili. Usa `--all` quando vuoi l'inventario lint
completo senza elencare ogni id di controllo. `--only <id>` resta il selettore più preciso
e può eseguire qualsiasi controllo registrato per id.

## Controlli di Integrità Strutturati

I controlli doctor moderni usano un piccolo contratto strutturato:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` alimenta `doctor --lint`. `repair()` è opzionale ed è considerato solo
da `doctor --fix` / `doctor --repair`. I controlli che non sono stati migrati a questa
forma continuano a usare il flusso legacy dei contributi doctor.

La separazione è intenzionale: `detect()` possiede la diagnosi, mentre `repair()` possiede
il resoconto di ciò che ha cambiato o cambierebbe. I contesti di riparazione possono portare
richieste `dryRun`/`diff` e i risultati della riparazione possono restituire `diffs` strutturati per
modifiche di configurazione/file più `effects` per effetti collaterali su servizio, processo, pacchetto, stato o altri
effetti. Questo consente ai controlli convertiti di evolvere verso `doctor --fix --dry-run`
e il reporting dei diff senza spostare la pianificazione delle mutazioni in `detect()`.

`repair()` segnala se ha tentato la riparazione richiesta con `status:
"repaired" | "skipped" | "failed"`. Uno stato omesso significa `repaired`, quindi i controlli di
riparazione semplici devono restituire solo le modifiche. Quando la riparazione restituisce `skipped` o
`failed`, doctor segnala il motivo e non esegue la validazione per quel controllo.

Dopo una riparazione strutturata riuscita, doctor riesegue `detect()` con i
risultati riparati come scope. I controlli possono usare risultati selezionati, percorsi o valori `ocPath`
per una validazione mirata. Se il risultato è ancora presente, doctor segnala un
avviso di riparazione invece di trattare la modifica come completata silenziosamente.

Un risultato include:

| Campo             | Scopo                                                  |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | Id stabile per filtri skip/only e allowlist CI.        |
| `severity`        | `info`, `warning` o `error`.                           |
| `message`         | Descrizione del problema leggibile da una persona.     |
| `path`            | Percorso di configurazione, file o logico quando disponibile. |
| `line` / `column` | Posizione nel sorgente quando disponibile.             |
| `ocPath`          | Indirizzo `oc://` preciso quando un controllo può puntarvi. |
| `fixHint`         | Azione operatore suggerita o riepilogo della riparazione. |

I controlli doctor core modernizzati restano collegati al contributo doctor ordinato
che possiede il loro comportamento umano `doctor` / `doctor --fix`. Il registro di integrità
strutturato condiviso è il punto di estensione: i controlli forniti in bundle e supportati da plugin vengono eseguiti
dopo i controlli doctor core una volta che il pacchetto proprietario li registra nel percorso di
comando attivo. Il sottopercorso `openclaw/plugin-sdk/health` espone lo stesso
contratto per quei consumatori di estensioni.

## Selezione dei Controlli

Usa `--only` e `--skip` quando un workflow vuole un gate focalizzato:

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` e `--skip` accettano id di controllo completi e possono essere ripetuti. Se un id `--only`
non è registrato, nessun controllo viene eseguito per quell'id; usa i campi `checksRun`
e `checksSkipped` del comando per verificare che un gate focalizzato stia selezionando i controlli che
ti aspetti.

## Modalità post-upgrade

`openclaw doctor --post-upgrade` esegue sonde di compatibilità dei plugin pensate per essere
concatenate dopo una build o un upgrade. I risultati vengono emessi su stdout; il comando
termina con codice 1 se un qualsiasi risultato ha `level: "error"`. Aggiungi `--json` per ricevere una
busta leggibile dalla macchina (`{ probesRun, findings }`) adatta a CI, alla
skill community `fork-upgrade` e ad altri strumenti smoke post-upgrade. Se l'indice dei
plugin installati è mancante o malformato, la modalità JSON emette comunque quella
busta con un risultato di errore `plugin.index_unavailable`.

Note:

- In modalità Nix (`OPENCLAW_NIX_MODE=1`), i controlli doctor in sola lettura continuano a funzionare, ma `doctor --fix`, `doctor --repair`, `doctor --yes` e `doctor --generate-gateway-token` sono disabilitati perché `openclaw.json` è immutabile. Modifica invece la sorgente Nix per questa installazione; per nix-openclaw, usa la [Guida rapida](https://github.com/openclaw/nix-openclaw#quick-start) agent-first.
- I prompt interattivi (come le correzioni keychain/OAuth) vengono eseguiti solo quando stdin è un TTY e `--non-interactive` **non** è impostato. Le esecuzioni senza terminale (Cron, Telegram, nessun terminale) salteranno i prompt.
- Prestazioni: le esecuzioni non interattive di `doctor` saltano il caricamento anticipato dei Plugin, così i controlli di integrità senza terminale restano rapidi. Le sessioni doctor interattive caricano comunque le superfici Plugin necessarie al flusso legacy di integrità e riparazione.
- `--lint` è più rigoroso di `--non-interactive`: è sempre in sola lettura, non mostra mai prompt e non applica mai migrazioni sicure. Esegui `doctor --fix` o `doctor --repair` quando vuoi che doctor apporti modifiche.
- Per impostazione predefinita, doctor non esegue SecretRefs `exec` durante il controllo dei segreti. Usa `openclaw doctor --allow-exec` o `openclaw doctor --lint --allow-exec` solo quando vuoi intenzionalmente che doctor esegua quei resolver di segreti configurati.
- `--fix` (alias di `--repair`) scrive un backup in `~/.openclaw/openclaw.json.bak` e rimuove le chiavi di configurazione sconosciute, elencando ogni rimozione.
- I controlli di integrità modernizzati possono esporre un percorso `repair()` per `doctor --fix`; i controlli che non ne espongono uno continuano tramite il flusso di riparazione doctor esistente.
- `doctor --fix --non-interactive` segnala definizioni del servizio Gateway mancanti o obsolete, ma non le installa né le riscrive fuori dalla modalità di riparazione aggiornamento. Esegui `openclaw gateway install` per un servizio mancante, oppure `openclaw gateway install --force` quando vuoi intenzionalmente sostituire il launcher.
- I controlli di integrità dello stato ora rilevano file di trascrizione orfani nella directory delle sessioni. L’archiviazione come `.deleted.<timestamp>` richiede una conferma interattiva; `--fix`, `--yes` e le esecuzioni senza terminale li lasciano al loro posto.
- Doctor scansiona anche `~/.openclaw/cron/jobs.json` (o `cron.store`) alla ricerca di forme legacy dei job Cron e le riscrive prima di importare righe canoniche in SQLite.
- Doctor segnala i job Cron con override espliciti di `payload.model`, inclusi i conteggi dei namespace dei provider e le discrepanze rispetto a `agents.defaults.model`, così i job pianificati che non ereditano il modello predefinito sono visibili durante indagini su autenticazione o fatturazione.
- Su Linux, doctor avvisa quando il crontab dell’utente esegue ancora il legacy `~/.openclaw/bin/ensure-whatsapp.sh`; quello script non è più mantenuto e può registrare falsi disservizi del Gateway WhatsApp quando Cron non dispone dell’ambiente systemd user-bus.
- Quando WhatsApp è abilitato, doctor controlla se esiste un loop di eventi Gateway degradato con client `openclaw-tui` locali ancora in esecuzione. `doctor --fix` arresta solo i client TUI locali verificati, così le risposte WhatsApp non restano in coda dietro loop di aggiornamento TUI obsoleti.
- Doctor riscrive i riferimenti modello legacy `openai-codex/*` in riferimenti canonici `openai/*` su modelli primari, fallback, modelli di generazione immagini/video, override Heartbeat/subagent/Compaction, hook, override modello dei canali e pin obsoleti delle route di sessione. `--fix` migra anche i profili di autenticazione legacy `openai-codex:*` e le voci `auth.order.openai-codex` a `openai:*`, sposta l’intento Codex in voci `agentRuntime.id: "codex"` con ambito provider/modello, rimuove pin runtime obsoleti a livello di agente/sessione e mantiene i riferimenti degli agenti OpenAI riparati sul routing di autenticazione Codex invece che sull’autenticazione diretta con chiave API OpenAI.
- Doctor pulisce lo stato legacy di staging delle dipendenze Plugin creato da versioni precedenti di OpenClaw e ricollega il pacchetto host `openclaw` per i Plugin npm gestiti che lo dichiarano come dipendenza peer. Ripara anche Plugin scaricabili mancanti a cui fa riferimento la configurazione, come `plugins.entries`, canali configurati, impostazioni provider/ricerca configurate o runtime agente configurati. Durante gli aggiornamenti dei pacchetti, doctor salta la riparazione dei Plugin tramite package manager finché lo scambio del pacchetto non è completo; esegui di nuovo `openclaw doctor --fix` dopo, se un Plugin configurato richiede ancora il ripristino. Se il download non riesce, doctor segnala l’errore di installazione e conserva la voce Plugin configurata per il prossimo tentativo di riparazione.
- Doctor ripara la configurazione Plugin obsoleta rimuovendo gli ID Plugin mancanti da `plugins.allow`/`plugins.deny`/`plugins.entries`, oltre alla configurazione canale pendente corrispondente, ai target Heartbeat e agli override modello dei canali quando la discovery dei Plugin è sana.
- Doctor mette in quarantena la configurazione Plugin non valida disabilitando la voce `plugins.entries.<id>` interessata e rimuovendo il relativo payload `config` non valido. L’avvio del Gateway salta già solo quel Plugin non valido, così gli altri Plugin e canali possono continuare a funzionare.
- Imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando un altro supervisor possiede il ciclo di vita del Gateway. Doctor segnala comunque l’integrità di Gateway/servizio e applica riparazioni non relative al servizio, ma salta installazione/avvio/riavvio/bootstrap del servizio e pulizia dei servizi legacy.
- Su Linux, doctor ignora unità systemd extra simili al Gateway ma inattive e non riscrive i metadati command/entrypoint per un servizio Gateway systemd in esecuzione durante la riparazione. Arresta prima il servizio oppure usa `openclaw gateway install --force` quando vuoi intenzionalmente sostituire il launcher attivo.
- Doctor migra automaticamente la configurazione Talk flat legacy (`talk.voiceId`, `talk.modelId` e simili) in `talk.provider` + `talk.providers.<provider>`.
- Esecuzioni ripetute di `doctor --fix` non segnalano/applicano più la normalizzazione Talk quando l’unica differenza è l’ordine delle chiavi dell’oggetto.
- Doctor include un controllo di prontezza della ricerca in memoria e può consigliare `openclaw configure --section model` quando mancano le credenziali di embedding.
- Doctor avvisa quando non è configurato alcun proprietario dei comandi. Il proprietario dei comandi è l’account dell’operatore umano autorizzato a eseguire comandi riservati al proprietario e ad approvare azioni pericolose. L’abbinamento DM consente solo a qualcuno di parlare con il bot; se hai approvato un mittente prima che esistesse il bootstrap del primo proprietario, imposta esplicitamente `commands.ownerAllowFrom`.
- Doctor segnala una nota informativa quando sono configurati agenti in modalità Codex ed esistono asset personali della CLI Codex nella home Codex dell’operatore. Gli avvii locali del server app Codex usano home isolate per agente, quindi installa prima il Plugin Codex se necessario, poi usa `openclaw migrate plan codex` per inventariare gli asset da promuovere deliberatamente.
- Doctor rimuove `plugins.entries.codex.config.codexDynamicToolsProfile` ritirato; il server app Codex mantiene sempre nativi gli strumenti workspace nativi Codex.
- Doctor avvisa quando Skills consentite per l’agente predefinito non sono disponibili nell’ambiente runtime corrente perché mancano binari, variabili env, configurazione o requisiti del sistema operativo. `doctor --fix` può disabilitare quelle Skills non disponibili con `skills.entries.<skill>.enabled=false`; installa/configura invece il requisito mancante quando vuoi mantenere attiva la skill.
- Se la modalità sandbox è abilitata ma Docker non è disponibile, doctor segnala un avviso ad alto segnale con rimedio (`install Docker` oppure `openclaw config set agents.defaults.sandbox.mode off`).
- Se sono presenti file legacy del registro sandbox o directory shard (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/` o `~/.openclaw/sandbox/browsers/`), doctor li segnala; `openclaw doctor --fix` migra le voci valide in SQLite e mette in quarantena i file legacy non validi.
- Se `gateway.auth.token`/`gateway.auth.password` sono gestiti da SecretRef e non disponibili nel percorso del comando corrente, doctor segnala un avviso in sola lettura e non scrive credenziali fallback in chiaro. Per SecretRef basati su exec, doctor salta l’esecuzione a meno che non sia presente `--allow-exec`.
- Se l’ispezione di un SecretRef di canale non riesce in un percorso di correzione, doctor continua e segnala un avviso invece di uscire in anticipo.
- Dopo le migrazioni della directory di stato, doctor avvisa quando account Telegram o Discord predefiniti abilitati dipendono dal fallback env e `TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN` non è disponibile per il processo doctor.
- La risoluzione automatica degli username `allowFrom` di Telegram (`doctor --fix`) richiede un token Telegram risolvibile nel percorso del comando corrente. Se l’ispezione del token non è disponibile, doctor segnala un avviso e salta la risoluzione automatica per quel passaggio.

## macOS: override env di `launchctl`

Se in precedenza hai eseguito `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), quel valore sovrascrive il file di configurazione e può causare errori persistenti di “non autorizzato”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Correlati

- [Riferimento CLI](/it/cli)
- [Doctor del Gateway](/it/gateway/doctor)
