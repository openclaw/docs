---
read_when:
    - Hai problemi di connettività/autenticazione e vuoi correzioni guidate
    - Hai aggiornato e vuoi un controllo di coerenza
summary: Riferimento CLI per `openclaw doctor` (controlli di integrità + riparazioni guidate)
title: Diagnostica
x-i18n:
    generated_at: "2026-05-07T13:14:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7683a974eb9406e5ca071612c96c7db05247a69e253ef4293c57e7707aa5fd4
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

Per le autorizzazioni specifiche dei canali, usa i controlli dei canali invece di `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

Il controllo mirato delle capacità di Discord segnala le autorizzazioni effettive del bot nel canale; il controllo di stato esegue l’audit dei canali Discord configurati e degli obiettivi di accesso automatico ai canali vocali.

## Opzioni

- `--no-workspace-suggestions`: disabilita i suggerimenti di memoria/ricerca del workspace
- `--yes`: accetta i valori predefiniti senza chiedere conferma
- `--repair`: applica le riparazioni consigliate non relative al servizio senza chiedere conferma; le installazioni e le riscritture del servizio Gateway richiedono comunque una conferma interattiva o comandi Gateway espliciti
- `--fix`: alias di `--repair`
- `--force`: applica riparazioni aggressive, inclusa la sovrascrittura della configurazione personalizzata del servizio quando necessario
- `--non-interactive`: esegue senza prompt; solo migrazioni sicure e riparazioni non relative al servizio
- `--generate-gateway-token`: genera e configura un token Gateway
- `--deep`: analizza i servizi di sistema per installazioni Gateway aggiuntive e segnala i passaggi recenti di riavvio del supervisore Gateway

Note:

- In modalità Nix (`OPENCLAW_NIX_MODE=1`), i controlli di sola lettura di doctor continuano a funzionare, ma `doctor --fix`, `doctor --repair`, `doctor --yes` e `doctor --generate-gateway-token` sono disabilitati perché `openclaw.json` è immutabile. Modifica invece la sorgente Nix per questa installazione; per nix-openclaw, usa la [Guida introduttiva](https://github.com/openclaw/nix-openclaw#quick-start) agent-first.
- I prompt interattivi (come le correzioni per portachiavi/OAuth) vengono eseguiti solo quando stdin è una TTY e `--non-interactive` **non** è impostato. Le esecuzioni senza interfaccia (cron, Telegram, senza terminale) salteranno i prompt.
- Prestazioni: le esecuzioni non interattive di `doctor` saltano il caricamento anticipato dei Plugin, così i controlli di integrità senza interfaccia restano rapidi. Le sessioni interattive caricano comunque completamente i Plugin quando un controllo richiede il loro contributo.
- `--fix` (alias di `--repair`) scrive un backup in `~/.openclaw/openclaw.json.bak` e rimuove le chiavi di configurazione sconosciute, elencando ogni rimozione.
- `doctor --fix --non-interactive` segnala definizioni del servizio Gateway mancanti o obsolete, ma non le installa né le riscrive al di fuori della modalità di riparazione dell’aggiornamento. Esegui `openclaw gateway install` per un servizio mancante, oppure `openclaw gateway install --force` quando vuoi sostituire intenzionalmente il launcher.
- I controlli di integrità dello stato ora rilevano file di trascrizione orfani nella directory delle sessioni. Archiviarli come `.deleted.<timestamp>` richiede una conferma interattiva; `--fix`, `--yes` e le esecuzioni senza interfaccia li lasciano al loro posto.
- Doctor analizza anche `~/.openclaw/cron/jobs.json` (o `cron.store`) per forme legacy dei processi Cron e può riscriverle sul posto prima che lo scheduler debba normalizzarle automaticamente in fase di runtime.
- Su Linux, doctor avvisa quando il crontab dell’utente esegue ancora il legacy `~/.openclaw/bin/ensure-whatsapp.sh`; quello script non è più mantenuto e può registrare falsi disservizi del Gateway WhatsApp quando Cron non dispone dell’ambiente del bus utente systemd.
- Quando WhatsApp è abilitato, doctor verifica la presenza di un ciclo eventi Gateway degradato con client locali `openclaw-tui` ancora in esecuzione. `doctor --fix` arresta solo i client TUI locali verificati, così le risposte WhatsApp non restano in coda dietro cicli di aggiornamento TUI obsoleti.
- Doctor riscrive i riferimenti modello legacy `openai-codex/*` in riferimenti canonici `openai/*` per modelli primari, fallback, override heartbeat/subagent/compaction, hook, override dei modelli dei canali e pin di instradamento di sessioni obsolete. `--fix` seleziona `agentRuntime.id: "codex"` solo quando il Plugin Codex è installato, abilitato, contribuisce l’harness `codex` e dispone di OAuth utilizzabile; altrimenti seleziona `agentRuntime.id: "pi"` così la route resta sul runner OpenClaw predefinito.
- Doctor pulisce lo stato legacy di staging delle dipendenze dei Plugin creato da versioni meno recenti di OpenClaw. Ripara anche i Plugin scaricabili mancanti a cui fa riferimento la configurazione, come `plugins.entries`, canali configurati, impostazioni provider/ricerca configurate o runtime agente configurati. Durante gli aggiornamenti dei pacchetti, doctor salta la riparazione dei Plugin del gestore pacchetti finché la sostituzione del pacchetto non è completa; riesegui `openclaw doctor --fix` dopo, se un Plugin configurato necessita ancora di ripristino. Se il download non riesce, doctor segnala l’errore di installazione e preserva la voce del Plugin configurata per il successivo tentativo di riparazione.
- Doctor ripara la configurazione obsoleta dei Plugin rimuovendo gli ID dei Plugin mancanti da `plugins.allow`/`plugins.entries`, più la configurazione di canale pendente corrispondente, gli obiettivi Heartbeat e gli override dei modelli dei canali quando la scoperta dei Plugin è integra.
- Doctor mette in quarantena la configurazione non valida dei Plugin disabilitando la voce `plugins.entries.<id>` interessata e rimuovendo il relativo payload `config` non valido. L’avvio del Gateway salta già solo quel Plugin difettoso, così gli altri Plugin e canali possono continuare a funzionare.
- Imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando un altro supervisore possiede il ciclo di vita del Gateway. Doctor segnala comunque l’integrità di Gateway/servizio e applica riparazioni non relative al servizio, ma salta installazione/avvio/riavvio/bootstrap del servizio e la pulizia dei servizi legacy.
- Su Linux, doctor ignora le unità systemd inattive aggiuntive simili al Gateway e non riscrive i metadati di comando/entrypoint per un servizio Gateway systemd in esecuzione durante la riparazione. Arresta prima il servizio oppure usa `openclaw gateway install --force` quando vuoi sostituire intenzionalmente il launcher attivo.
- Doctor migra automaticamente la configurazione piatta legacy di Talk (`talk.voiceId`, `talk.modelId` e simili) in `talk.provider` + `talk.providers.<provider>`.
- Le esecuzioni ripetute di `doctor --fix` non segnalano/applicano più la normalizzazione di Talk quando l’unica differenza è l’ordine delle chiavi dell’oggetto.
- Doctor include un controllo di prontezza della ricerca in memoria e può consigliare `openclaw configure --section model` quando mancano le credenziali di embedding.
- Doctor avvisa quando non è configurato alcun proprietario dei comandi. Il proprietario dei comandi è l’account dell’operatore umano autorizzato a eseguire comandi riservati al proprietario e ad approvare azioni pericolose. L’associazione DM consente solo a qualcuno di parlare con il bot; se hai approvato un mittente prima dell’esistenza del bootstrap del primo proprietario, imposta esplicitamente `commands.ownerAllowFrom`.
- Doctor avvisa quando sono configurati agenti in modalità Codex ed esistono asset personali della CLI Codex nella home Codex dell’operatore. Gli avvii locali dell’app-server Codex usano home isolate per agente, quindi usa `openclaw migrate codex --dry-run` per inventariare gli asset che dovrebbero essere promossi deliberatamente.
- Doctor avvisa quando le Skills consentite per l’agente predefinito non sono disponibili nell’ambiente di runtime corrente perché mancano binari, variabili d’ambiente, configurazione o requisiti del sistema operativo. `doctor --fix` può disabilitare quelle Skills non disponibili con `skills.entries.<skill>.enabled=false`; installa/configura invece il requisito mancante quando vuoi mantenere attiva la skill.
- Se la modalità sandbox è abilitata ma Docker non è disponibile, doctor segnala un avviso ad alto segnale con rimedio (`install Docker` oppure `openclaw config set agents.defaults.sandbox.mode off`).
- Se sono presenti file di registro sandbox legacy (`~/.openclaw/sandbox/containers.json` o `~/.openclaw/sandbox/browsers.json`), doctor li segnala; `openclaw doctor --fix` migra le voci valide in directory di registro suddivise e mette in quarantena i file legacy non validi.
- Se `gateway.auth.token`/`gateway.auth.password` sono gestiti da SecretRef e non disponibili nel percorso del comando corrente, doctor segnala un avviso di sola lettura e non scrive credenziali di fallback in testo semplice.
- Se l’ispezione di SecretRef del canale fallisce in un percorso di correzione, doctor continua e segnala un avviso invece di uscire in anticipo.
- Dopo le migrazioni della directory di stato, doctor avvisa quando account Telegram o Discord predefiniti abilitati dipendono dal fallback tramite env e `TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN` non è disponibile per il processo doctor.
- La risoluzione automatica del nome utente Telegram `allowFrom` (`doctor --fix`) richiede un token Telegram risolvibile nel percorso del comando corrente. Se l’ispezione del token non è disponibile, doctor segnala un avviso e salta la risoluzione automatica per quel passaggio.

## macOS: override env di `launchctl`

Se in precedenza hai eseguito `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), quel valore sovrascrive il tuo file di configurazione e può causare errori "unauthorized" persistenti.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Correlato

- [Riferimento CLI](/it/cli)
- [Doctor Gateway](/it/gateway/doctor)
