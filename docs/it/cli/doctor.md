---
read_when:
    - Hai problemi di connettività/autenticazione e desideri correzioni guidate
    - Hai aggiornato e vuoi una verifica rapida
summary: Riferimento CLI per `openclaw doctor` (controlli di integrità + riparazioni guidate)
title: Diagnostica
x-i18n:
    generated_at: "2026-05-05T08:25:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6101008d1cb7e08f9902a8a29785710f325966524b003b87b5c628fe906ab78
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Controlli di integrità + correzioni rapide per il Gateway e i canali.

Correlati:

- Risoluzione dei problemi: [Risoluzione dei problemi](/it/gateway/troubleshooting)
- Controllo di sicurezza: [Sicurezza](/it/gateway/security)

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
- `--repair`: applica le riparazioni consigliate non relative al servizio senza chiedere conferma; le installazioni e le riscritture del servizio Gateway richiedono comunque conferma interattiva o comandi Gateway espliciti
- `--fix`: alias per `--repair`
- `--force`: applica riparazioni aggressive, inclusa la sovrascrittura della configurazione personalizzata del servizio quando necessario
- `--non-interactive`: esegui senza prompt; solo migrazioni sicure e riparazioni non relative al servizio
- `--generate-gateway-token`: genera e configura un token del Gateway
- `--deep`: analizza i servizi di sistema alla ricerca di installazioni Gateway aggiuntive e segnala i recenti passaggi di consegna del riavvio del supervisore Gateway

Note:

- I prompt interattivi (come le correzioni keychain/OAuth) vengono eseguiti solo quando stdin è un TTY e `--non-interactive` **non** è impostato. Le esecuzioni headless (cron, Telegram, senza terminale) salteranno i prompt.
- Prestazioni: le esecuzioni non interattive di `doctor` saltano il caricamento anticipato dei plugin, così i controlli di integrità headless restano rapidi. Le sessioni interattive caricano comunque completamente i plugin quando un controllo richiede il loro contributo.
- `--fix` (alias per `--repair`) scrive un backup in `~/.openclaw/openclaw.json.bak` ed elimina le chiavi di configurazione sconosciute, elencando ogni rimozione.
- `doctor --fix --non-interactive` segnala definizioni mancanti o obsolete del servizio Gateway ma non le installa né le riscrive al di fuori della modalità di riparazione dell'aggiornamento. Esegui `openclaw gateway install` per un servizio mancante, oppure `openclaw gateway install --force` quando vuoi intenzionalmente sostituire il launcher.
- I controlli di integrità dello stato ora rilevano file di transcript orfani nella directory delle sessioni. L'archiviazione come `.deleted.<timestamp>` richiede una conferma interattiva; `--fix`, `--yes` e le esecuzioni headless li lasciano al loro posto.
- Doctor analizza anche `~/.openclaw/cron/jobs.json` (o `cron.store`) alla ricerca di forme legacy dei processi cron e può riscriverle sul posto prima che lo scheduler debba normalizzarle automaticamente a runtime.
- Su Linux, doctor avvisa quando il crontab dell'utente esegue ancora il legacy `~/.openclaw/bin/ensure-whatsapp.sh`; quello script non è più mantenuto e può registrare falsi outage del Gateway WhatsApp quando cron non dispone dell'ambiente user-bus di systemd.
- Quando WhatsApp è abilitato, doctor controlla se esiste un event loop del Gateway degradato con client locali `openclaw-tui` ancora in esecuzione. `doctor --fix` arresta solo i client TUI locali verificati, così le risposte WhatsApp non vengono accodate dietro cicli di aggiornamento TUI obsoleti.
- Doctor pulisce lo stato legacy di staging delle dipendenze dei plugin creato da versioni precedenti di OpenClaw. Ripara anche i plugin scaricabili mancanti a cui fa riferimento la configurazione, come `plugins.entries`, canali configurati, impostazioni provider/ricerca configurate o runtime agente configurati. Durante gli aggiornamenti del pacchetto, doctor salta la riparazione dei plugin del gestore pacchetti finché la sostituzione del pacchetto non è completa; riesegui `openclaw doctor --fix` in seguito se un plugin configurato necessita ancora di ripristino. Se il download fallisce, doctor segnala l'errore di installazione e preserva la voce del plugin configurata per il prossimo tentativo di riparazione.
- Doctor ripara la configurazione obsoleta dei plugin rimuovendo gli ID dei plugin mancanti da `plugins.allow`/`plugins.entries`, più la configurazione dei canali pendente corrispondente, le destinazioni heartbeat e gli override del modello canale quando il rilevamento dei plugin è integro.
- Doctor mette in quarantena la configurazione plugin non valida disabilitando la voce `plugins.entries.<id>` interessata e rimuovendo il relativo payload `config` non valido. L'avvio del Gateway salta già solo quel plugin difettoso, così gli altri plugin e canali possono continuare a funzionare.
- Imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando un altro supervisore gestisce il ciclo di vita del Gateway. Doctor segnala comunque l'integrità del Gateway/servizio e applica le riparazioni non relative al servizio, ma salta installazione/avvio/riavvio/bootstrap del servizio e la pulizia dei servizi legacy.
- Su Linux, doctor ignora le unità systemd inattive aggiuntive simili al Gateway e non riscrive i metadati di comando/entrypoint per un servizio Gateway systemd in esecuzione durante la riparazione. Arresta prima il servizio oppure usa `openclaw gateway install --force` quando vuoi intenzionalmente sostituire il launcher attivo.
- Doctor migra automaticamente la configurazione flat legacy di Talk (`talk.voiceId`, `talk.modelId` e simili) in `talk.provider` + `talk.providers.<provider>`.
- Le esecuzioni ripetute di `doctor --fix` non segnalano/applicano più la normalizzazione di Talk quando l'unica differenza è l'ordine delle chiavi dell'oggetto.
- Doctor include un controllo di prontezza della ricerca in memoria e può consigliare `openclaw configure --section model` quando mancano le credenziali di embedding.
- Doctor avvisa quando non è configurato alcun proprietario dei comandi. Il proprietario dei comandi è l'account dell'operatore umano autorizzato a eseguire comandi riservati al proprietario e ad approvare azioni pericolose. L'abbinamento DM permette solo a qualcuno di parlare con il bot; se hai approvato un mittente prima che esistesse il bootstrap del primo proprietario, imposta esplicitamente `commands.ownerAllowFrom`.
- Doctor avvisa quando sono configurati agenti in modalità Codex ed esistono asset personali della CLI Codex nella home Codex dell'operatore. Gli avvii locali del server app Codex usano home isolate per ogni agente, quindi usa `openclaw migrate codex --dry-run` per inventariare gli asset che dovrebbero essere promossi deliberatamente.
- Doctor avvisa quando le skills consentite per l'agente predefinito non sono disponibili nell'ambiente runtime corrente perché mancano binari, variabili di ambiente, configurazione o requisiti del sistema operativo. `doctor --fix` può disabilitare quelle skills non disponibili con `skills.entries.<skill>.enabled=false`; installa/configura invece il requisito mancante quando vuoi mantenere attiva la skill.
- Se la modalità sandbox è abilitata ma Docker non è disponibile, doctor segnala un avviso ad alto segnale con rimedio (`install Docker` o `openclaw config set agents.defaults.sandbox.mode off`).
- Se sono presenti file legacy del registro sandbox (`~/.openclaw/sandbox/containers.json` o `~/.openclaw/sandbox/browsers.json`), doctor li segnala; `openclaw doctor --fix` migra le voci valide in directory di registro partizionate e mette in quarantena i file legacy non validi.
- Se `gateway.auth.token`/`gateway.auth.password` sono gestiti da SecretRef e non disponibili nel percorso del comando corrente, doctor segnala un avviso di sola lettura e non scrive credenziali di fallback in testo normale.
- Se l'ispezione SecretRef del canale fallisce in un percorso di correzione, doctor continua e segnala un avviso invece di uscire in anticipo.
- Dopo le migrazioni della directory di stato, doctor avvisa quando gli account Telegram o Discord predefiniti abilitati dipendono dal fallback env e `TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN` non è disponibile per il processo doctor.
- La risoluzione automatica dello username Telegram `allowFrom` (`doctor --fix`) richiede un token Telegram risolvibile nel percorso del comando corrente. Se l'ispezione del token non è disponibile, doctor segnala un avviso e salta la risoluzione automatica per quel passaggio.

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
