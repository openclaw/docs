---
read_when:
    - Hai problemi di connettività/autenticazione e vuoi correzioni guidate
    - Hai aggiornato e vuoi una verifica di coerenza
summary: Riferimento CLI per `openclaw doctor` (controlli di integrità + riparazioni guidate)
title: Diagnostica
x-i18n:
    generated_at: "2026-05-10T19:28:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: c336915c94b6bf703ebece5be429cc0a86be9a2122dd9a912e956579ecb2b096
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Controlli di integrità + correzioni rapide per il Gateway e i canali.

Correlati:

- Risoluzione dei problemi: [Risoluzione dei problemi](/it/gateway/troubleshooting)
- Audit di sicurezza: [Sicurezza](/it/gateway/security)

## Esempi

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

Per i permessi specifici dei canali, usa le sonde dei canali invece di `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

La sonda mirata delle capacità Discord segnala i permessi effettivi del bot nel canale; la sonda di stato verifica i canali Discord configurati e le destinazioni di accesso automatico alla voce.

## Opzioni

- `--no-workspace-suggestions`: disabilita i suggerimenti di memoria/ricerca dello workspace
- `--yes`: accetta i valori predefiniti senza chiedere conferma
- `--repair`: applica le riparazioni consigliate non relative al servizio senza chiedere conferma; le installazioni e le riscritture del servizio Gateway richiedono comunque una conferma interattiva o comandi Gateway espliciti
- `--fix`: alias per `--repair`
- `--force`: applica riparazioni aggressive, inclusa la sovrascrittura della configurazione personalizzata del servizio quando necessario
- `--non-interactive`: esegue senza prompt; solo migrazioni sicure e riparazioni non relative al servizio
- `--generate-gateway-token`: genera e configura un token Gateway
- `--deep`: analizza i servizi di sistema per installazioni Gateway aggiuntive e segnala i passaggi di consegne recenti dei riavvii del supervisore Gateway

Note:

- In modalità Nix (`OPENCLAW_NIX_MODE=1`), i controlli di sola lettura di doctor funzionano comunque, ma `doctor --fix`, `doctor --repair`, `doctor --yes` e `doctor --generate-gateway-token` sono disabilitati perché `openclaw.json` è immutabile. Modifica invece la sorgente Nix per questa installazione; per nix-openclaw, usa la [Guida rapida](https://github.com/openclaw/nix-openclaw#quick-start) agent-first.
- I prompt interattivi (come le correzioni keychain/OAuth) vengono eseguiti solo quando stdin è un TTY e `--non-interactive` **non** è impostato. Le esecuzioni headless (cron, Telegram, nessun terminale) salteranno i prompt.
- Prestazioni: le esecuzioni non interattive di `doctor` saltano il caricamento anticipato dei plugin, così i controlli di integrità headless restano rapidi. Le sessioni interattive caricano comunque completamente i plugin quando un controllo richiede il loro contributo.
- `--fix` (alias per `--repair`) scrive un backup in `~/.openclaw/openclaw.json.bak` ed elimina le chiavi di configurazione sconosciute, elencando ogni rimozione.
- `doctor --fix --non-interactive` segnala definizioni del servizio Gateway mancanti o obsolete, ma non le installa né le riscrive fuori dalla modalità di riparazione dell'aggiornamento. Esegui `openclaw gateway install` per un servizio mancante, oppure `openclaw gateway install --force` quando vuoi intenzionalmente sostituire il launcher.
- I controlli di integrità dello stato ora rilevano file di trascrizione orfani nella directory delle sessioni. L'archiviazione come `.deleted.<timestamp>` richiede una conferma interattiva; `--fix`, `--yes` e le esecuzioni headless li lasciano al loro posto.
- Doctor analizza anche `~/.openclaw/cron/jobs.json` (o `cron.store`) per individuare vecchie forme di job cron e può riscriverle sul posto prima che lo scheduler debba normalizzarle automaticamente a runtime.
- Su Linux, doctor avvisa quando il crontab dell'utente esegue ancora il vecchio `~/.openclaw/bin/ensure-whatsapp.sh`; quello script non è più mantenuto e può registrare falsi disservizi del Gateway WhatsApp quando cron non dispone dell'ambiente systemd user-bus.
- Quando WhatsApp è abilitato, doctor controlla la presenza di un ciclo eventi Gateway degradato con client locali `openclaw-tui` ancora in esecuzione. `doctor --fix` arresta solo client TUI locali verificati, così le risposte WhatsApp non vengono accodate dietro vecchi cicli di aggiornamento TUI.
- Doctor riscrive i riferimenti modello legacy `openai-codex/*` in riferimenti canonici `openai/*` per modelli primari, fallback, override heartbeat/subagent/compaction, hook, override dei modelli di canale e vecchi pin di routing delle sessioni. `--fix` sposta l'intento Codex su voci `agentRuntime.id: "codex"` con ambito provider/modello, preserva i pin auth-profile di sessione come `openai-codex:...`, rimuove vecchi pin runtime dell'intero agent/sessione e mantiene i riferimenti agent OpenAI riparati sul routing di autenticazione Codex invece che sull'autenticazione diretta con chiave API OpenAI.
- Doctor pulisce lo stato legacy di staging delle dipendenze dei plugin creato da versioni precedenti di OpenClaw. Ripara anche i plugin scaricabili mancanti a cui fa riferimento la configurazione, come `plugins.entries`, canali configurati, impostazioni provider/ricerca configurate o runtime degli agent configurati. Durante gli aggiornamenti dei pacchetti, doctor salta la riparazione dei plugin del gestore pacchetti finché la sostituzione del pacchetto non è completa; esegui di nuovo `openclaw doctor --fix` in seguito se un plugin configurato richiede ancora il ripristino. Se il download non riesce, doctor segnala l'errore di installazione e preserva la voce del plugin configurata per il tentativo di riparazione successivo.
- Doctor ripara configurazioni plugin obsolete rimuovendo ID plugin mancanti da `plugins.allow`/`plugins.entries`, oltre alla configurazione di canale pendente corrispondente, ai target Heartbeat e agli override dei modelli di canale quando la scoperta dei plugin è integra.
- Doctor mette in quarantena le configurazioni plugin non valide disabilitando la voce `plugins.entries.<id>` interessata e rimuovendo il relativo payload `config` non valido. L'avvio del Gateway salta già solo quel plugin difettoso, così altri plugin e canali possono continuare a funzionare.
- Imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando un altro supervisore possiede il ciclo di vita del Gateway. Doctor segnala comunque lo stato di salute del Gateway/servizio e applica riparazioni non relative al servizio, ma salta installazione/avvio/riavvio/bootstrap del servizio e pulizia dei servizi legacy.
- Su Linux, doctor ignora unità systemd aggiuntive simili a Gateway ma inattive e non riscrive i metadati comando/entrypoint per un servizio Gateway systemd in esecuzione durante la riparazione. Arresta prima il servizio o usa `openclaw gateway install --force` quando vuoi intenzionalmente sostituire il launcher attivo.
- Doctor migra automaticamente la vecchia configurazione piatta di Talk (`talk.voiceId`, `talk.modelId` e simili) in `talk.provider` + `talk.providers.<provider>`.
- Le esecuzioni ripetute di `doctor --fix` non segnalano/applicano più la normalizzazione Talk quando l'unica differenza è l'ordine delle chiavi dell'oggetto.
- Doctor include un controllo di prontezza della ricerca in memoria e può consigliare `openclaw configure --section model` quando mancano le credenziali di embedding.
- Doctor avvisa quando non è configurato alcun proprietario dei comandi. Il proprietario dei comandi è l'account operatore umano autorizzato a eseguire comandi riservati al proprietario e ad approvare azioni pericolose. L'associazione DM permette solo a qualcuno di parlare con il bot; se hai approvato un mittente prima che esistesse il bootstrap del primo proprietario, imposta esplicitamente `commands.ownerAllowFrom`.
- Doctor avvisa quando sono configurati agent in modalità Codex ed esistono asset personali della CLI Codex nella home Codex dell'operatore. Gli avvii locali dell'app-server Codex usano home isolate per agent, quindi usa `openclaw migrate codex --dry-run` per inventariare gli asset che dovrebbero essere promossi deliberatamente.
- Doctor rimuove `plugins.entries.codex.config.codexDynamicToolsProfile` ritirato; l'app-server Codex mantiene sempre nativi gli strumenti workspace nativi di Codex.
- Doctor avvisa quando Skills consentite per l'agent predefinito non sono disponibili nell'ambiente runtime corrente perché mancano binari, variabili d'ambiente, configurazione o requisiti del sistema operativo. `doctor --fix` può disabilitare quelle Skills non disponibili con `skills.entries.<skill>.enabled=false`; installa/configura invece il requisito mancante quando vuoi mantenere la skill attiva.
- Se la modalità sandbox è abilitata ma Docker non è disponibile, doctor segnala un avviso ad alto segnale con rimedio (`install Docker` oppure `openclaw config set agents.defaults.sandbox.mode off`).
- Se sono presenti file legacy del registro sandbox (`~/.openclaw/sandbox/containers.json` o `~/.openclaw/sandbox/browsers.json`), doctor li segnala; `openclaw doctor --fix` migra le voci valide in directory di registro partizionate e mette in quarantena i file legacy non validi.
- Se `gateway.auth.token`/`gateway.auth.password` sono gestiti da SecretRef e non disponibili nel percorso del comando corrente, doctor segnala un avviso di sola lettura e non scrive credenziali fallback in chiaro.
- Se l'ispezione SecretRef del canale fallisce in un percorso di correzione, doctor continua e segnala un avviso invece di uscire in anticipo.
- Dopo le migrazioni della directory di stato, doctor avvisa quando account Telegram o Discord predefiniti abilitati dipendono dal fallback env e `TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN` non sono disponibili per il processo doctor.
- La risoluzione automatica del nome utente Telegram `allowFrom` (`doctor --fix`) richiede un token Telegram risolvibile nel percorso del comando corrente. Se l'ispezione del token non è disponibile, doctor segnala un avviso e salta la risoluzione automatica per quel passaggio.

## macOS: override env `launchctl`

Se in precedenza hai eseguito `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), quel valore sovrascrive il tuo file di configurazione e può causare errori persistenti "unauthorized".

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Correlati

- [Riferimento CLI](/it/cli)
- [Gateway doctor](/it/gateway/doctor)
