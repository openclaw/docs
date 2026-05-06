---
read_when:
    - Hai problemi di connettività/autenticazione e vuoi correzioni guidate
    - Hai eseguito l'aggiornamento e vuoi una verifica rapida
summary: Riferimento CLI per `openclaw doctor` (controlli di integrità + riparazioni guidate)
title: Diagnostica
x-i18n:
    generated_at: "2026-05-06T08:42:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20eff2f94b41315dbe1d393ebbbf6dce352a7f9e589db3b8fb51f423dd6fed28
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

## Opzioni

- `--no-workspace-suggestions`: disabilita i suggerimenti di memoria/ricerca dello spazio di lavoro
- `--yes`: accetta i valori predefiniti senza chiedere conferma
- `--repair`: applica le riparazioni consigliate non di servizio senza chiedere conferma; le installazioni e le riscritture del servizio Gateway richiedono comunque una conferma interattiva o comandi Gateway espliciti
- `--fix`: alias di `--repair`
- `--force`: applica riparazioni aggressive, inclusa la sovrascrittura della configurazione personalizzata del servizio quando necessario
- `--non-interactive`: esegue senza prompt; solo migrazioni sicure e riparazioni non di servizio
- `--generate-gateway-token`: genera e configura un token Gateway
- `--deep`: analizza i servizi di sistema per installazioni Gateway aggiuntive e segnala i passaggi di consegna recenti al supervisore Gateway dopo riavvii

Note:

- I prompt interattivi (come le correzioni di portachiavi/OAuth) vengono eseguiti solo quando stdin è un TTY e `--non-interactive` **non** è impostato. Le esecuzioni senza terminale (cron, Telegram, nessun terminale) salteranno i prompt.
- Prestazioni: le esecuzioni non interattive di `doctor` saltano il caricamento anticipato dei Plugin, così i controlli di integrità senza terminale restano veloci. Le sessioni interattive caricano comunque completamente i Plugin quando un controllo richiede il loro contributo.
- `--fix` (alias di `--repair`) scrive un backup in `~/.openclaw/openclaw.json.bak` ed elimina le chiavi di configurazione sconosciute, elencando ogni rimozione.
- `doctor --fix --non-interactive` segnala definizioni del servizio Gateway mancanti o obsolete, ma non le installa né le riscrive al di fuori della modalità di riparazione dell'aggiornamento. Esegui `openclaw gateway install` per un servizio mancante, oppure `openclaw gateway install --force` quando vuoi intenzionalmente sostituire il lanciatore.
- I controlli di integrità dello stato ora rilevano file di trascrizione orfani nella directory delle sessioni. L'archiviazione come `.deleted.<timestamp>` richiede una conferma interattiva; `--fix`, `--yes` e le esecuzioni senza terminale li lasciano al loro posto.
- Doctor analizza anche `~/.openclaw/cron/jobs.json` (o `cron.store`) per forme legacy dei job cron e può riscriverle sul posto prima che lo scheduler debba normalizzarle automaticamente durante l'esecuzione.
- Su Linux, doctor avvisa quando il crontab dell'utente esegue ancora il vecchio `~/.openclaw/bin/ensure-whatsapp.sh`; quello script non è più mantenuto e può registrare falsi disservizi del Gateway WhatsApp quando cron non dispone dell'ambiente del bus utente systemd.
- Quando WhatsApp è abilitato, doctor controlla se esiste un ciclo eventi Gateway degradato con client locali `openclaw-tui` ancora in esecuzione. `doctor --fix` arresta solo i client TUI locali verificati, così le risposte WhatsApp non vengono accodate dietro cicli di aggiornamento TUI obsoleti.
- Doctor riscrive i riferimenti modello legacy `openai-codex/*` in riferimenti canonici `openai/*` nei modelli principali, fallback, override di Heartbeat/subagent/Compaction, hook, override dei modelli di canale e pin di route di sessione obsoleti. `--fix` seleziona `agentRuntime.id: "codex"` solo quando il Plugin Codex è installato, abilitato, contribuisce l'harness `codex` e dispone di OAuth utilizzabile; altrimenti seleziona `agentRuntime.id: "pi"` così la route resta sul runner OpenClaw predefinito.
- Doctor pulisce lo stato legacy di staging delle dipendenze dei Plugin creato da versioni precedenti di OpenClaw. Ripara anche Plugin scaricabili mancanti citati dalla configurazione, come `plugins.entries`, canali configurati, impostazioni provider/ricerca configurate o ambienti di esecuzione agente configurati. Durante gli aggiornamenti del pacchetto, doctor salta la riparazione dei Plugin tramite gestore pacchetti finché la sostituzione del pacchetto non è completa; riesegui `openclaw doctor --fix` dopo, se un Plugin configurato richiede ancora il ripristino. Se il download non riesce, doctor segnala l'errore di installazione e conserva la voce Plugin configurata per il tentativo di riparazione successivo.
- Doctor ripara la configurazione Plugin obsoleta rimuovendo gli id dei Plugin mancanti da `plugins.allow`/`plugins.entries`, oltre alla configurazione canale penzolante corrispondente, ai target Heartbeat e agli override dei modelli di canale quando il rilevamento dei Plugin è integro.
- Doctor mette in quarantena la configurazione Plugin non valida disabilitando la voce `plugins.entries.<id>` interessata e rimuovendo il suo payload `config` non valido. L'avvio del Gateway salta già solo quel Plugin difettoso, così altri Plugin e canali possono continuare a funzionare.
- Imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando un altro supervisore gestisce il ciclo di vita del Gateway. Doctor continua a segnalare l'integrità del Gateway/servizio e applica riparazioni non di servizio, ma salta installazione/avvio/riavvio/bootstrap del servizio e pulizia dei servizi legacy.
- Su Linux, doctor ignora le unità systemd inattive aggiuntive simili a Gateway e non riscrive i metadati di comando/entrypoint per un servizio Gateway systemd in esecuzione durante la riparazione. Arresta prima il servizio oppure usa `openclaw gateway install --force` quando vuoi intenzionalmente sostituire il lanciatore attivo.
- Doctor migra automaticamente la configurazione Talk piatta legacy (`talk.voiceId`, `talk.modelId` e simili) in `talk.provider` + `talk.providers.<provider>`.
- Le esecuzioni ripetute di `doctor --fix` non segnalano/applicano più la normalizzazione Talk quando l'unica differenza è l'ordine delle chiavi dell'oggetto.
- Doctor include un controllo di prontezza della ricerca in memoria e può consigliare `openclaw configure --section model` quando mancano le credenziali di embedding.
- Doctor avvisa quando non è configurato alcun proprietario dei comandi. Il proprietario dei comandi è l'account dell'operatore umano autorizzato a eseguire comandi riservati al proprietario e ad approvare azioni pericolose. L'associazione DM consente solo a qualcuno di parlare con il bot; se hai approvato un mittente prima che esistesse il bootstrap del primo proprietario, imposta esplicitamente `commands.ownerAllowFrom`.
- Doctor avvisa quando sono configurati agenti in modalità Codex ed esistono asset personali della CLI Codex nella home Codex dell'operatore. Gli avvii locali del server app Codex usano home isolate per agente, quindi usa `openclaw migrate codex --dry-run` per inventariare gli asset da promuovere deliberatamente.
- Doctor avvisa quando le Skills consentite per l'agente predefinito non sono disponibili nell'ambiente di esecuzione corrente perché mancano binari, variabili d'ambiente, configurazione o requisiti del sistema operativo. `doctor --fix` può disabilitare quelle Skills non disponibili con `skills.entries.<skill>.enabled=false`; installa/configura invece il requisito mancante quando vuoi mantenere attiva la skill.
- Se la modalità sandbox è abilitata ma Docker non è disponibile, doctor segnala un avviso ad alto valore informativo con rimedio (`install Docker` oppure `openclaw config set agents.defaults.sandbox.mode off`).
- Se sono presenti file legacy del registro sandbox (`~/.openclaw/sandbox/containers.json` o `~/.openclaw/sandbox/browsers.json`), doctor li segnala; `openclaw doctor --fix` migra le voci valide in directory di registro partizionate e mette in quarantena i file legacy non validi.
- Se `gateway.auth.token`/`gateway.auth.password` sono gestiti da SecretRef e non disponibili nel percorso del comando corrente, doctor segnala un avviso di sola lettura e non scrive credenziali di fallback in testo semplice.
- Se l'ispezione SecretRef del canale non riesce in un percorso di correzione, doctor continua e segnala un avviso invece di uscire in anticipo.
- Dopo le migrazioni della directory di stato, doctor avvisa quando account Telegram o Discord predefiniti abilitati dipendono dal fallback tramite ambiente e `TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN` non è disponibile per il processo doctor.
- La risoluzione automatica del nome utente `allowFrom` di Telegram (`doctor --fix`) richiede un token Telegram risolvibile nel percorso del comando corrente. Se l'ispezione del token non è disponibile, doctor segnala un avviso e salta la risoluzione automatica per quel passaggio.

## macOS: override env di `launchctl`

Se in precedenza hai eseguito `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), quel valore sovrascrive il tuo file di configurazione e può causare errori persistenti di “non autorizzato”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Correlati

- [Riferimento CLI](/it/cli)
- [Doctor Gateway](/it/gateway/doctor)
