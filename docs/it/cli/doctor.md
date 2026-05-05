---
read_when:
    - Hai problemi di connettività/autenticazione e vuoi correzioni guidate
    - Hai eseguito l'aggiornamento e vuoi un controllo rapido
summary: Riferimento CLI per `openclaw doctor` (controlli di integrità + riparazioni guidate)
title: Diagnostica
x-i18n:
    generated_at: "2026-05-05T01:44:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 079d7674ae2a259a0430e30e7577ac532135ad5461c57c4b3a6514a007bc9ea5
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Controlli di integrità + correzioni rapide per il Gateway e i canali.

Correlato:

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
- `--repair`: applica le riparazioni consigliate non di servizio senza chiedere conferma; le installazioni e le riscritture del servizio Gateway richiedono comunque conferma interattiva o comandi Gateway espliciti
- `--fix`: alias di `--repair`
- `--force`: applica riparazioni aggressive, inclusa la sovrascrittura della configurazione personalizzata del servizio quando necessario
- `--non-interactive`: esegue senza prompt; solo migrazioni sicure e riparazioni non di servizio
- `--generate-gateway-token`: genera e configura un token del Gateway
- `--deep`: analizza i servizi di sistema alla ricerca di installazioni Gateway aggiuntive

Note:

- I prompt interattivi (come le correzioni keychain/OAuth) vengono eseguiti solo quando stdin è un TTY e `--non-interactive` **non** è impostato. Le esecuzioni headless (Cron, Telegram, nessun terminale) salteranno i prompt.
- Prestazioni: le esecuzioni non interattive di `doctor` saltano il caricamento anticipato dei plugin, così i controlli di integrità headless restano rapidi. Le sessioni interattive continuano a caricare completamente i plugin quando un controllo richiede il loro contributo.
- `--fix` (alias di `--repair`) scrive un backup in `~/.openclaw/openclaw.json.bak` e rimuove le chiavi di configurazione sconosciute, elencando ogni rimozione.
- `doctor --fix --non-interactive` segnala definizioni del servizio Gateway mancanti o obsolete, ma non le installa né le riscrive fuori dalla modalità di riparazione degli aggiornamenti. Esegui `openclaw gateway install` per un servizio mancante, oppure `openclaw gateway install --force` quando vuoi intenzionalmente sostituire il launcher.
- I controlli di integrità dello stato ora rilevano file di trascrizione orfani nella directory delle sessioni. L'archiviazione come `.deleted.<timestamp>` richiede una conferma interattiva; `--fix`, `--yes` e le esecuzioni headless li lasciano al loro posto.
- Doctor analizza anche `~/.openclaw/cron/jobs.json` (o `cron.store`) alla ricerca di vecchi formati dei job Cron e può riscriverli sul posto prima che lo scheduler debba normalizzarli automaticamente a runtime.
- Su Linux, doctor avvisa quando il crontab dell'utente esegue ancora il vecchio `~/.openclaw/bin/ensure-whatsapp.sh`; quello script non è più mantenuto e può registrare falsi disservizi del Gateway WhatsApp quando Cron non dispone dell'ambiente user-bus di systemd.
- Doctor pulisce lo stato legacy di staging delle dipendenze dei plugin creato da versioni precedenti di OpenClaw. Ripara anche i plugin scaricabili mancanti che sono referenziati dalla configurazione, come `plugins.entries`, canali configurati, impostazioni provider/ricerca configurate o runtime agent configurati. Durante gli aggiornamenti dei pacchetti, doctor salta la riparazione dei plugin del gestore pacchetti finché la sostituzione del pacchetto non è completa; riesegui `openclaw doctor --fix` in seguito se un plugin configurato richiede ancora recupero. Se il download non riesce, doctor segnala l'errore di installazione e conserva la voce del plugin configurato per il tentativo di riparazione successivo.
- Doctor ripara la configurazione obsoleta dei plugin rimuovendo gli id dei plugin mancanti da `plugins.allow`/`plugins.entries`, oltre alla configurazione del canale pendente corrispondente, ai target Heartbeat e agli override del modello del canale quando la discovery dei plugin è integra.
- Doctor mette in quarantena la configurazione non valida dei plugin disabilitando la voce `plugins.entries.<id>` interessata e rimuovendo il relativo payload `config` non valido. L'avvio del Gateway salta già solo quel plugin errato, così gli altri plugin e canali possono continuare a funzionare.
- Imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando un altro supervisor possiede il ciclo di vita del Gateway. Doctor continua a segnalare lo stato di integrità del Gateway/servizio e applica riparazioni non di servizio, ma salta installazione/avvio/riavvio/bootstrap del servizio e la pulizia dei servizi legacy.
- Su Linux, doctor ignora unità systemd inattive aggiuntive simili a Gateway e non riscrive i metadati di comando/entrypoint per un servizio Gateway systemd in esecuzione durante la riparazione. Arresta prima il servizio oppure usa `openclaw gateway install --force` quando vuoi intenzionalmente sostituire il launcher attivo.
- Doctor migra automaticamente la vecchia configurazione Talk piatta (`talk.voiceId`, `talk.modelId` e simili) in `talk.provider` + `talk.providers.<provider>`.
- Le esecuzioni ripetute di `doctor --fix` non segnalano/applicano più la normalizzazione Talk quando l'unica differenza è l'ordine delle chiavi dell'oggetto.
- Doctor include un controllo di prontezza della ricerca in memoria e può consigliare `openclaw configure --section model` quando mancano le credenziali di embedding.
- Doctor avvisa quando non è configurato alcun proprietario dei comandi. Il proprietario dei comandi è l'account dell'operatore umano autorizzato a eseguire comandi riservati al proprietario e ad approvare azioni pericolose. L'associazione in DM permette solo a qualcuno di parlare con il bot; se hai approvato un mittente prima che esistesse il bootstrap del primo proprietario, imposta esplicitamente `commands.ownerAllowFrom`.
- Doctor avvisa quando sono configurati agent in modalità Codex e asset personali della CLI Codex esistono nella home Codex dell'operatore. Gli avvii del server app Codex locale usano home isolate per agent, quindi usa `openclaw migrate codex --dry-run` per inventariare gli asset che dovrebbero essere promossi deliberatamente.
- Doctor avvisa quando le Skills consentite per l'agent predefinito non sono disponibili nell'ambiente runtime corrente perché mancano binari, variabili d'ambiente, configurazione o requisiti del sistema operativo. `doctor --fix` può disabilitare quelle Skills non disponibili con `skills.entries.<skill>.enabled=false`; installa/configura invece il requisito mancante quando vuoi mantenere attiva la skill.
- Se la modalità sandbox è abilitata ma Docker non è disponibile, doctor segnala un avviso ad alto segnale con rimedio (`install Docker` oppure `openclaw config set agents.defaults.sandbox.mode off`).
- Se sono presenti file di registro sandbox legacy (`~/.openclaw/sandbox/containers.json` o `~/.openclaw/sandbox/browsers.json`), doctor li segnala; `openclaw doctor --fix` migra le voci valide in directory di registro sharded e mette in quarantena i file legacy non validi.
- Se `gateway.auth.token`/`gateway.auth.password` sono gestiti da SecretRef e non disponibili nel percorso di comando corrente, doctor segnala un avviso di sola lettura e non scrive credenziali fallback in testo in chiaro.
- Se l'ispezione di SecretRef del canale fallisce in un percorso di correzione, doctor continua e segnala un avviso invece di uscire anticipatamente.
- Dopo le migrazioni della directory di stato, doctor avvisa quando gli account Telegram o Discord predefiniti abilitati dipendono dal fallback dell'ambiente e `TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN` non sono disponibili per il processo doctor.
- La risoluzione automatica degli username `allowFrom` di Telegram (`doctor --fix`) richiede un token Telegram risolvibile nel percorso di comando corrente. Se l'ispezione del token non è disponibile, doctor segnala un avviso e salta la risoluzione automatica per quel passaggio.

## macOS: override dell'ambiente `launchctl`

Se in precedenza hai eseguito `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), quel valore sovrascrive il tuo file di configurazione e può causare errori persistenti di “non autorizzato”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Correlato

- [Riferimento CLI](/it/cli)
- [Doctor del Gateway](/it/gateway/doctor)
