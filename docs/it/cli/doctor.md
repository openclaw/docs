---
read_when:
    - Hai problemi di connettività/autenticazione e vuoi soluzioni guidate
    - Hai effettuato l'aggiornamento e vuoi una verifica rapida
summary: Riferimento CLI per `openclaw doctor` (controlli di integrità + riparazioni guidate)
title: Diagnostica
x-i18n:
    generated_at: "2026-05-11T20:25:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69f2dd99f339e4fcdeeae840b75098f3c251b3aa133b7ea11b040b3c7f32c200
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

Per autorizzazioni specifiche del canale, usa i probe del canale invece di `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

Il probe mirato delle capacità Discord segnala le autorizzazioni effettive del bot nel canale; il probe di stato controlla i canali Discord configurati e le destinazioni di accesso automatico ai canali vocali.

## Opzioni

- `--no-workspace-suggestions`: disabilita i suggerimenti di memoria/ricerca del workspace
- `--yes`: accetta le impostazioni predefinite senza chiedere conferma
- `--repair`: applica le riparazioni consigliate non relative ai servizi senza chiedere conferma; le installazioni e le riscritture del servizio Gateway richiedono comunque conferma interattiva o comandi Gateway espliciti
- `--fix`: alias per `--repair`
- `--force`: applica riparazioni aggressive, inclusa la sovrascrittura della configurazione personalizzata del servizio quando necessario
- `--non-interactive`: esegue senza prompt; solo migrazioni sicure e riparazioni non relative ai servizi
- `--generate-gateway-token`: genera e configura un token Gateway
- `--deep`: analizza i servizi di sistema alla ricerca di installazioni Gateway aggiuntive e segnala i recenti passaggi di riavvio del supervisore Gateway

Note:

- In modalità Nix (`OPENCLAW_NIX_MODE=1`), i controlli doctor in sola lettura continuano a funzionare, ma `doctor --fix`, `doctor --repair`, `doctor --yes` e `doctor --generate-gateway-token` sono disabilitati perché `openclaw.json` è immutabile. Modifica invece la sorgente Nix per questa installazione; per nix-openclaw, usa la [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) agent-first.
- I prompt interattivi (come le correzioni keychain/OAuth) vengono eseguiti solo quando stdin è una TTY e `--non-interactive` **non** è impostato. Le esecuzioni headless (cron, Telegram, senza terminale) salteranno i prompt.
- Prestazioni: le esecuzioni non interattive di `doctor` saltano il caricamento anticipato dei plugin, così i controlli di integrità headless restano veloci. Le sessioni interattive caricano comunque completamente i plugin quando un controllo richiede il loro contributo.
- `--fix` (alias per `--repair`) scrive un backup in `~/.openclaw/openclaw.json.bak` ed elimina le chiavi di configurazione sconosciute, elencando ogni rimozione.
- `doctor --fix --non-interactive` segnala definizioni del servizio Gateway mancanti o obsolete, ma non le installa né le riscrive al di fuori della modalità di riparazione degli aggiornamenti. Esegui `openclaw gateway install` per un servizio mancante, oppure `openclaw gateway install --force` quando vuoi intenzionalmente sostituire il launcher.
- I controlli di integrità dello stato ora rilevano file di trascrizione orfani nella directory delle sessioni. Archiviarli come `.deleted.<timestamp>` richiede una conferma interattiva; `--fix`, `--yes` e le esecuzioni headless li lasciano al loro posto.
- Doctor analizza anche `~/.openclaw/cron/jobs.json` (o `cron.store`) per individuare formati legacy dei job cron e può riscriverli sul posto prima che lo scheduler debba normalizzarli automaticamente a runtime.
- Su Linux, doctor avvisa quando il crontab dell'utente esegue ancora il legacy `~/.openclaw/bin/ensure-whatsapp.sh`; quello script non è più mantenuto e può registrare falsi blackout del Gateway WhatsApp quando cron non dispone dell'ambiente user-bus di systemd.
- Quando WhatsApp è abilitato, doctor verifica la presenza di un event loop Gateway degradato con client locali `openclaw-tui` ancora in esecuzione. `doctor --fix` arresta solo client TUI locali verificati, così le risposte WhatsApp non vengono accodate dietro loop di aggiornamento TUI obsoleti.
- Doctor riscrive i riferimenti modello legacy `openai-codex/*` in riferimenti canonici `openai/*` tra modelli primari, fallback, override heartbeat/subagent/compaction, hook, override dei modelli di canale e pin di routing di sessione obsoleti. `--fix` sposta l'intento Codex su voci `agentRuntime.id: "codex"` con ambito provider/modello, preserva i pin auth-profile di sessione come `openai-codex:...`, rimuove pin runtime obsoleti di interi agenti/sessioni e mantiene i riferimenti agent OpenAI riparati sul routing di autenticazione Codex invece che sull'autenticazione diretta con chiave API OpenAI.
- Doctor pulisce lo stato legacy di staging delle dipendenze plugin creato da versioni precedenti di OpenClaw. Ripara anche i plugin scaricabili mancanti referenziati dalla configurazione, come `plugins.entries`, canali configurati, impostazioni provider/ricerca configurate o runtime agent configurati. Durante gli aggiornamenti dei pacchetti, doctor salta la riparazione dei plugin del package manager finché la sostituzione del pacchetto non è completa; riesegui `openclaw doctor --fix` dopo, se un plugin configurato richiede ancora il ripristino. Se il download non riesce, doctor segnala l'errore di installazione e preserva la voce del plugin configurata per il tentativo di riparazione successivo.
- Doctor ripara la configurazione obsoleta dei plugin rimuovendo gli id dei plugin mancanti da `plugins.allow`/`plugins.deny`/`plugins.entries`, oltre alla configurazione di canale pendente corrispondente, ai target heartbeat e agli override dei modelli di canale quando il rilevamento dei plugin è integro.
- Doctor mette in quarantena la configurazione plugin non valida disabilitando la voce `plugins.entries.<id>` interessata e rimuovendo il relativo payload `config` non valido. L'avvio del Gateway salta già solo quel plugin non valido, così gli altri plugin e canali possono continuare a funzionare.
- Imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando un altro supervisore gestisce il ciclo di vita del Gateway. Doctor segnala comunque lo stato di salute del Gateway/servizio e applica riparazioni non relative ai servizi, ma salta installazione/avvio/riavvio/bootstrap del servizio e pulizia dei servizi legacy.
- Su Linux, doctor ignora unità systemd inattive simili a Gateway aggiuntive e non riscrive i metadati di comando/entrypoint per un servizio Gateway systemd in esecuzione durante la riparazione. Arresta prima il servizio oppure usa `openclaw gateway install --force` quando vuoi intenzionalmente sostituire il launcher attivo.
- Doctor migra automaticamente la configurazione Talk piatta legacy (`talk.voiceId`, `talk.modelId` e simili) in `talk.provider` + `talk.providers.<provider>`.
- Esecuzioni ripetute di `doctor --fix` non segnalano/applicano più la normalizzazione Talk quando l'unica differenza è l'ordine delle chiavi dell'oggetto.
- Doctor include un controllo di prontezza della ricerca in memoria e può consigliare `openclaw configure --section model` quando mancano le credenziali per gli embedding.
- Doctor avvisa quando non è configurato alcun proprietario dei comandi. Il proprietario dei comandi è l'account operatore umano autorizzato a eseguire comandi riservati al proprietario e ad approvare azioni pericolose. L'associazione DM consente solo a qualcuno di parlare con il bot; se hai approvato un mittente prima che esistesse il bootstrap del primo proprietario, imposta esplicitamente `commands.ownerAllowFrom`.
- Doctor avvisa quando sono configurati agent in modalità Codex ed esistono asset personali della CLI Codex nella home Codex dell'operatore. Gli avvii locali dell'app-server Codex usano home isolate per agent, quindi usa `openclaw migrate codex --dry-run` per inventariare gli asset da promuovere deliberatamente.
- Doctor rimuove `plugins.entries.codex.config.codexDynamicToolsProfile` ritirato; l'app-server Codex mantiene sempre nativi gli strumenti workspace nativi di Codex.
- Doctor avvisa quando gli Skills consentiti per l'agent predefinito non sono disponibili nell'ambiente runtime corrente perché mancano binari, variabili di ambiente, configurazione o requisiti del sistema operativo. `doctor --fix` può disabilitare quegli skill non disponibili con `skills.entries.<skill>.enabled=false`; installa/configura invece il requisito mancante quando vuoi mantenere lo skill attivo.
- Se la modalità sandbox è abilitata ma Docker non è disponibile, doctor segnala un avviso ad alto segnale con la correzione (`install Docker` o `openclaw config set agents.defaults.sandbox.mode off`).
- Se sono presenti file registry sandbox legacy (`~/.openclaw/sandbox/containers.json` o `~/.openclaw/sandbox/browsers.json`), doctor li segnala; `openclaw doctor --fix` migra le voci valide in directory registry con sharding e mette in quarantena i file legacy non validi.
- Se `gateway.auth.token`/`gateway.auth.password` sono gestiti da SecretRef e non sono disponibili nel percorso del comando corrente, doctor segnala un avviso in sola lettura e non scrive credenziali fallback in chiaro.
- Se l'ispezione SecretRef del canale non riesce in un percorso di correzione, doctor continua e segnala un avviso invece di uscire anticipatamente.
- Dopo le migrazioni della directory di stato, doctor avvisa quando account predefiniti Telegram o Discord abilitati dipendono dal fallback env e `TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN` non è disponibile per il processo doctor.
- La risoluzione automatica degli username Telegram `allowFrom` (`doctor --fix`) richiede un token Telegram risolvibile nel percorso del comando corrente. Se l'ispezione del token non è disponibile, doctor segnala un avviso e salta la risoluzione automatica per quel passaggio.

## macOS: override env `launchctl`

Se in precedenza hai eseguito `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), quel valore sovrascrive il tuo file di configurazione e può causare errori "unauthorized" persistenti.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Correlati

- [Riferimento CLI](/it/cli)
- [Gateway doctor](/it/gateway/doctor)
