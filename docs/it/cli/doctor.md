---
read_when:
    - Hai problemi di connettività/autenticazione e vuoi soluzioni guidate
    - Hai aggiornato e vuoi un controllo rapido
summary: Riferimento CLI per `openclaw doctor` (controlli di integrità + riparazioni guidate)
title: Diagnostica
x-i18n:
    generated_at: "2026-05-04T02:22:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd7fb09d373c313e4be45ad9e3b19ceb187a5787ef3e70fcd2b1f1f01b50c905
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Controlli di integrità + correzioni rapide per il gateway e i canali.

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

- `--no-workspace-suggestions`: disabilita i suggerimenti di memoria/ricerca dell'area di lavoro
- `--yes`: accetta i valori predefiniti senza chiedere conferma
- `--repair`: applica le riparazioni consigliate non relative ai servizi senza chiedere conferma; le installazioni e le riscritture del servizio gateway richiedono comunque una conferma interattiva o comandi gateway espliciti
- `--fix`: alias per `--repair`
- `--force`: applica riparazioni aggressive, inclusa la sovrascrittura della configurazione personalizzata del servizio quando necessario
- `--non-interactive`: esegue senza prompt; solo migrazioni sicure e riparazioni non relative ai servizi
- `--generate-gateway-token`: genera e configura un token gateway
- `--deep`: analizza i servizi di sistema per individuare installazioni gateway aggiuntive

Note:

- I prompt interattivi (come le correzioni keychain/OAuth) vengono eseguiti solo quando stdin è una TTY e `--non-interactive` **non** è impostato. Le esecuzioni headless (cron, Telegram, senza terminale) salteranno i prompt.
- Prestazioni: le esecuzioni non interattive di `doctor` saltano il caricamento anticipato dei plugin, così i controlli di integrità headless restano veloci. Le sessioni interattive continuano a caricare completamente i plugin quando un controllo richiede il loro contributo.
- `--fix` (alias di `--repair`) scrive un backup in `~/.openclaw/openclaw.json.bak` e rimuove le chiavi di configurazione sconosciute, elencando ogni rimozione.
- `doctor --fix --non-interactive` segnala definizioni del servizio gateway mancanti o obsolete, ma non le installa né le riscrive al di fuori della modalità di riparazione aggiornamento. Esegui `openclaw gateway install` per un servizio mancante, oppure `openclaw gateway install --force` quando vuoi intenzionalmente sostituire il launcher.
- I controlli di integrità dello stato ora rilevano file di trascrizione orfani nella directory delle sessioni. Archiviarli come `.deleted.<timestamp>` richiede una conferma interattiva; `--fix`, `--yes` e le esecuzioni headless li lasciano al loro posto.
- Doctor analizza anche `~/.openclaw/cron/jobs.json` (o `cron.store`) per forme legacy dei job cron e può riscriverle in posizione prima che lo scheduler debba normalizzarle automaticamente a runtime.
- Su Linux, doctor avvisa quando il crontab dell'utente esegue ancora il legacy `~/.openclaw/bin/ensure-whatsapp.sh`; quello script non è più mantenuto e può registrare falsi disservizi del gateway WhatsApp quando cron non dispone dell'ambiente systemd user-bus.
- Doctor pulisce lo stato legacy di staging delle dipendenze dei plugin creato da versioni precedenti di OpenClaw. Ripara anche plugin scaricabili configurati mancanti quando il registro può risolverli, e il passaggio doctor 2026.5.2 installa automaticamente i plugin scaricabili che una configurazione precedente usa già prima di segnare la configurazione come toccata per quella release. Se il download non riesce, doctor segnala l'errore di installazione e conserva la voce del plugin configurata per il prossimo tentativo di riparazione.
- Doctor ripara la configurazione obsoleta dei plugin rimuovendo gli ID plugin mancanti da `plugins.allow`/`plugins.entries`, oltre alla configurazione di canale pendente corrispondente, ai target heartbeat e agli override del modello di canale quando il rilevamento dei plugin è sano.
- Doctor mette in quarantena la configurazione plugin non valida disabilitando la voce `plugins.entries.<id>` interessata e rimuovendo il relativo payload `config` non valido. L'avvio del gateway salta già solo quel plugin non valido, così gli altri plugin e canali possono continuare a funzionare.
- Imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando un altro supervisore gestisce il ciclo di vita del gateway. Doctor continua a segnalare l'integrità del gateway/servizio e applica riparazioni non relative ai servizi, ma salta installazione/avvio/riavvio/bootstrap del servizio e pulizia dei servizi legacy.
- Su Linux, doctor ignora le unità systemd aggiuntive simili al gateway inattive e non riscrive i metadati di comando/entrypoint per un servizio gateway systemd in esecuzione durante la riparazione. Arresta prima il servizio oppure usa `openclaw gateway install --force` quando vuoi intenzionalmente sostituire il launcher attivo.
- Doctor migra automaticamente la configurazione piatta legacy di Talk (`talk.voiceId`, `talk.modelId` e correlate) in `talk.provider` + `talk.providers.<provider>`.
- Le esecuzioni ripetute di `doctor --fix` non segnalano/applicano più la normalizzazione Talk quando l'unica differenza è l'ordine delle chiavi dell'oggetto.
- Doctor include un controllo di prontezza della ricerca in memoria e può consigliare `openclaw configure --section model` quando mancano le credenziali di embedding.
- Doctor avvisa quando non è configurato alcun proprietario dei comandi. Il proprietario dei comandi è l'account dell'operatore umano autorizzato a eseguire comandi riservati al proprietario e approvare azioni pericolose. L'associazione DM consente solo a qualcuno di parlare con il bot; se hai approvato un mittente prima che esistesse il bootstrap del primo proprietario, imposta esplicitamente `commands.ownerAllowFrom`.
- Doctor avvisa quando sono configurati agenti in modalità Codex ed esistono asset personali della CLI Codex nella home Codex dell'operatore. Gli avvii locali dell'app-server Codex usano home isolate per agente, quindi usa `openclaw migrate codex --dry-run` per inventariare gli asset che devono essere promossi deliberatamente.
- Doctor avvisa quando le skills consentite per l'agente predefinito non sono disponibili nell'ambiente di runtime corrente perché mancano binari, variabili d'ambiente, configurazione o requisiti del sistema operativo. `doctor --fix` può disabilitare quelle skills non disponibili con `skills.entries.<skill>.enabled=false`; installa/configura invece il requisito mancante quando vuoi mantenere la skill attiva.
- Se la modalità sandbox è abilitata ma Docker non è disponibile, doctor segnala un avviso ad alta rilevanza con rimedio (`install Docker` oppure `openclaw config set agents.defaults.sandbox.mode off`).
- Se sono presenti file legacy del registro sandbox (`~/.openclaw/sandbox/containers.json` o `~/.openclaw/sandbox/browsers.json`), doctor li segnala; `openclaw doctor --fix` migra le voci valide in directory di registro sharded e mette in quarantena i file legacy non validi.
- Se `gateway.auth.token`/`gateway.auth.password` sono gestiti da SecretRef e non disponibili nel percorso di comando corrente, doctor segnala un avviso di sola lettura e non scrive credenziali fallback in testo normale.
- Se l'ispezione SecretRef del canale fallisce in un percorso di correzione, doctor continua e segnala un avviso invece di uscire anticipatamente.
- Dopo le migrazioni della directory di stato, doctor avvisa quando gli account Telegram o Discord predefiniti abilitati dipendono dal fallback env e `TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN` non sono disponibili al processo doctor.
- La risoluzione automatica dei nomi utente `allowFrom` di Telegram (`doctor --fix`) richiede un token Telegram risolvibile nel percorso di comando corrente. Se l'ispezione del token non è disponibile, doctor segnala un avviso e salta la risoluzione automatica per quel passaggio.

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
- [Doctor gateway](/it/gateway/doctor)
