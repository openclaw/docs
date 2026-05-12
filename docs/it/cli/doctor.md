---
read_when:
    - Riscontri problemi di connettività/autenticazione e vuoi correzioni guidate
    - Hai aggiornato e vuoi un controllo di coerenza
summary: Riferimento CLI per `openclaw doctor` (controlli di integrità + riparazioni guidate)
title: Diagnostica
x-i18n:
    generated_at: "2026-05-12T08:45:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 90050276597a50abcc3638e7b7b50f29ef0682f5da30d33d5dca3ad6117173e0
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

Per le autorizzazioni specifiche dei canali, usa le sonde dei canali invece di `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

La sonda mirata delle capacità Discord segnala le autorizzazioni effettive del bot nel canale; la sonda di stato controlla i canali Discord configurati e le destinazioni di accesso automatico ai canali vocali.

## Opzioni

- `--no-workspace-suggestions`: disabilita i suggerimenti di memoria/ricerca dell'area di lavoro
- `--yes`: accetta i valori predefiniti senza chiedere conferma
- `--repair`: applica le riparazioni consigliate non di servizio senza chiedere conferma; le installazioni e le riscritture del servizio Gateway richiedono comunque una conferma interattiva o comandi Gateway espliciti
- `--fix`: alias per `--repair`
- `--force`: applica riparazioni aggressive, inclusa la sovrascrittura della configurazione di servizio personalizzata quando necessario
- `--non-interactive`: esegue senza prompt; solo migrazioni sicure e riparazioni non di servizio
- `--generate-gateway-token`: genera e configura un token Gateway
- `--deep`: esegue la scansione dei servizi di sistema per installazioni Gateway aggiuntive e segnala i passaggi di consegne recenti dei riavvii del supervisore Gateway

Note:

- In modalità Nix (`OPENCLAW_NIX_MODE=1`), i controlli di sola lettura di doctor funzionano comunque, ma `doctor --fix`, `doctor --repair`, `doctor --yes` e `doctor --generate-gateway-token` sono disabilitati perché `openclaw.json` è immutabile. Modifica invece il sorgente Nix per questa installazione; per nix-openclaw, usa la [Guida rapida](https://github.com/openclaw/nix-openclaw#quick-start) agent-first.
- I prompt interattivi (come le correzioni di portachiavi/OAuth) vengono eseguiti solo quando stdin è un TTY e `--non-interactive` **non** è impostato. Le esecuzioni headless (cron, Telegram, senza terminale) salteranno i prompt.
- Prestazioni: le esecuzioni non interattive di `doctor` saltano il caricamento anticipato dei Plugin, così i controlli di integrità headless restano rapidi. Le sessioni interattive caricano comunque completamente i Plugin quando un controllo richiede il loro contributo.
- `--fix` (alias per `--repair`) scrive un backup in `~/.openclaw/openclaw.json.bak` e rimuove le chiavi di configurazione sconosciute, elencando ogni rimozione.
- `doctor --fix --non-interactive` segnala definizioni del servizio Gateway mancanti o obsolete, ma non le installa né le riscrive al di fuori della modalità di riparazione degli aggiornamenti. Esegui `openclaw gateway install` per un servizio mancante oppure `openclaw gateway install --force` quando vuoi sostituire intenzionalmente il launcher.
- I controlli di integrità dello stato ora rilevano file di trascrizione orfani nella directory delle sessioni. L'archiviazione come `.deleted.<timestamp>` richiede una conferma interattiva; `--fix`, `--yes` e le esecuzioni headless li lasciano al loro posto.
- Doctor esegue anche la scansione di `~/.openclaw/cron/jobs.json` (o `cron.store`) per forme legacy dei job Cron e può riscriverle sul posto prima che lo scheduler debba normalizzarle automaticamente a runtime.
- Su Linux, doctor avvisa quando il crontab dell'utente esegue ancora il legacy `~/.openclaw/bin/ensure-whatsapp.sh`; quello script non è più mantenuto e può registrare falsi outage del Gateway WhatsApp quando Cron non dispone dell'ambiente user-bus di systemd.
- Quando WhatsApp è abilitato, doctor verifica la presenza di un event loop Gateway degradato con client locali `openclaw-tui` ancora in esecuzione. `doctor --fix` arresta solo i client TUI locali verificati, così le risposte WhatsApp non vengono messe in coda dietro cicli di refresh TUI obsoleti.
- Doctor riscrive i riferimenti ai modelli legacy `openai-codex/*` in riferimenti canonici `openai/*` nei modelli primari, fallback, override heartbeat/subagent/compaction, hook, override dei modelli dei canali e pin di routing delle sessioni obsoleti. `--fix` sposta l'intento Codex in voci `agentRuntime.id: "codex"` con ambito provider/modello, preserva i pin degli auth-profile di sessione come `openai-codex:...`, rimuove i pin obsoleti del runtime dell'intero agente/sessione e mantiene i riferimenti agli agenti OpenAI riparati sul routing di autenticazione Codex invece dell'autenticazione diretta con chiave API OpenAI.
- Doctor pulisce lo stato legacy di staging delle dipendenze dei Plugin creato da versioni precedenti di OpenClaw e ricollega il pacchetto host `openclaw` per i Plugin npm gestiti che lo dichiarano come dipendenza peer. Ripara anche i Plugin scaricabili mancanti a cui fa riferimento la configurazione, come `plugins.entries`, canali configurati, impostazioni provider/ricerca configurate o runtime agente configurati. Durante gli aggiornamenti dei pacchetti, doctor salta la riparazione dei Plugin del gestore pacchetti finché lo scambio del pacchetto non è completo; riesegui `openclaw doctor --fix` in seguito se un Plugin configurato richiede ancora il ripristino. Se il download non riesce, doctor segnala l'errore di installazione e preserva la voce del Plugin configurata per il successivo tentativo di riparazione.
- Doctor ripara la configurazione obsoleta dei Plugin rimuovendo gli id dei Plugin mancanti da `plugins.allow`/`plugins.deny`/`plugins.entries`, oltre alla configurazione dei canali penzolante corrispondente, alle destinazioni heartbeat e agli override dei modelli dei canali quando la discovery dei Plugin è integra.
- Doctor mette in quarantena la configurazione non valida dei Plugin disabilitando la voce `plugins.entries.<id>` interessata e rimuovendo il relativo payload `config` non valido. L'avvio del Gateway salta già solo quel Plugin errato, così gli altri Plugin e canali possono continuare a funzionare.
- Imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando un altro supervisore possiede il ciclo di vita del Gateway. Doctor segnala comunque l'integrità di Gateway/servizio e applica riparazioni non di servizio, ma salta installazione/avvio/riavvio/bootstrap del servizio e la pulizia dei servizi legacy.
- Su Linux, doctor ignora le unità systemd aggiuntive simili a Gateway inattive e non riscrive i metadati di comando/entrypoint per un servizio Gateway systemd in esecuzione durante la riparazione. Arresta prima il servizio oppure usa `openclaw gateway install --force` quando vuoi sostituire intenzionalmente il launcher attivo.
- Doctor migra automaticamente la configurazione Talk legacy piatta (`talk.voiceId`, `talk.modelId` e simili) in `talk.provider` + `talk.providers.<provider>`.
- Le esecuzioni ripetute di `doctor --fix` non segnalano/applicano più la normalizzazione di Talk quando l'unica differenza è l'ordine delle chiavi dell'oggetto.
- Doctor include un controllo di prontezza della ricerca in memoria e può consigliare `openclaw configure --section model` quando mancano le credenziali per gli embedding.
- Doctor avvisa quando non è configurato alcun proprietario dei comandi. Il proprietario dei comandi è l'account dell'operatore umano autorizzato a eseguire comandi riservati al proprietario e approvare azioni pericolose. L'abbinamento DM consente solo a qualcuno di parlare con il bot; se hai approvato un mittente prima che esistesse il bootstrap del primo proprietario, imposta esplicitamente `commands.ownerAllowFrom`.
- Doctor avvisa quando sono configurati agenti in modalità Codex ed esistono asset personali della CLI Codex nella home Codex dell'operatore. Gli avvii locali dell'app-server Codex usano home isolate per agente, quindi usa `openclaw migrate codex --dry-run` per inventariare gli asset da promuovere deliberatamente.
- Doctor rimuove il valore ritirato `plugins.entries.codex.config.codexDynamicToolsProfile`; l'app-server Codex mantiene sempre nativi gli strumenti dell'area di lavoro nativi di Codex.
- Doctor avvisa quando le Skills consentite per l'agente predefinito non sono disponibili nell'ambiente runtime corrente perché mancano binari, variabili d'ambiente, configurazione o requisiti del sistema operativo. `doctor --fix` può disabilitare quelle Skills non disponibili con `skills.entries.<skill>.enabled=false`; installa/configura invece il requisito mancante quando vuoi mantenere attiva la skill.
- Se la modalità sandbox è abilitata ma Docker non è disponibile, doctor segnala un avviso ad alto segnale con rimedio (`install Docker` o `openclaw config set agents.defaults.sandbox.mode off`).
- Se sono presenti file di registro sandbox legacy (`~/.openclaw/sandbox/containers.json` o `~/.openclaw/sandbox/browsers.json`), doctor li segnala; `openclaw doctor --fix` migra le voci valide in directory di registro partizionate e mette in quarantena i file legacy non validi.
- Se `gateway.auth.token`/`gateway.auth.password` sono gestiti da SecretRef e non disponibili nel percorso del comando corrente, doctor segnala un avviso di sola lettura e non scrive credenziali di fallback in testo normale.
- Se l'ispezione SecretRef dei canali non riesce in un percorso di correzione, doctor continua e segnala un avviso invece di uscire in anticipo.
- Dopo le migrazioni della directory di stato, doctor avvisa quando gli account Telegram o Discord predefiniti abilitati dipendono da fallback di ambiente e `TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN` non sono disponibili per il processo doctor.
- La risoluzione automatica degli username `allowFrom` di Telegram (`doctor --fix`) richiede un token Telegram risolvibile nel percorso del comando corrente. Se l'ispezione del token non è disponibile, doctor segnala un avviso e salta la risoluzione automatica per quel passaggio.

## macOS: override env di `launchctl`

Se in precedenza hai eseguito `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), quel valore sovrascrive il file di configurazione e può causare errori persistenti di "unauthorized".

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Correlati

- [Riferimento CLI](/it/cli)
- [Gateway doctor](/it/gateway/doctor)
