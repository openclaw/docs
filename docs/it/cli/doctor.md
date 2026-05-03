---
read_when:
    - Hai problemi di connettività/autenticazione e vuoi correzioni guidate
    - Hai aggiornato e vuoi una verifica rapida
summary: Riferimento CLI per `openclaw doctor` (controlli di integrità + riparazioni guidate)
title: Diagnostica
x-i18n:
    generated_at: "2026-05-03T21:28:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4baab5b0cd4d046d12ae5bd14ccf05224115856d45e630a57e77a2be15e5db0
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
- `--repair`: applica le riparazioni non di servizio consigliate senza chiedere conferma; le installazioni e le riscritture del servizio gateway richiedono comunque conferma interattiva o comandi gateway espliciti
- `--fix`: alias per `--repair`
- `--force`: applica riparazioni aggressive, inclusa la sovrascrittura della configurazione del servizio personalizzata quando necessario
- `--non-interactive`: esegue senza prompt; solo migrazioni sicure e riparazioni non di servizio
- `--generate-gateway-token`: genera e configura un token gateway
- `--deep`: analizza i servizi di sistema alla ricerca di installazioni gateway aggiuntive

Note:

- I prompt interattivi (come le correzioni di keychain/OAuth) vengono eseguiti solo quando stdin è una TTY e `--non-interactive` **non** è impostato. Le esecuzioni headless (cron, Telegram, nessun terminale) salteranno i prompt.
- Prestazioni: le esecuzioni non interattive di `doctor` saltano il caricamento anticipato dei Plugin, così i controlli di integrità headless restano rapidi. Le sessioni interattive caricano comunque completamente i Plugin quando un controllo richiede il loro contributo.
- `--fix` (alias per `--repair`) scrive un backup in `~/.openclaw/openclaw.json.bak` e rimuove le chiavi di configurazione sconosciute, elencando ogni rimozione.
- `doctor --fix --non-interactive` segnala definizioni del servizio gateway mancanti o obsolete, ma non le installa né le riscrive fuori dalla modalità di riparazione aggiornamento. Esegui `openclaw gateway install` per un servizio mancante, oppure `openclaw gateway install --force` quando vuoi intenzionalmente sostituire il launcher.
- I controlli di integrità dello stato ora rilevano file di trascrizione orfani nella directory delle sessioni. Archiviarli come `.deleted.<timestamp>` richiede una conferma interattiva; `--fix`, `--yes` e le esecuzioni headless li lasciano al loro posto.
- Doctor analizza anche `~/.openclaw/cron/jobs.json` (o `cron.store`) alla ricerca di forme legacy dei job cron e può riscriverle sul posto prima che lo scheduler debba normalizzarle automaticamente in fase di esecuzione.
- Su Linux, doctor avvisa quando la crontab dell'utente esegue ancora il legacy `~/.openclaw/bin/ensure-whatsapp.sh`; quello script non è più mantenuto e può registrare falsi disservizi del gateway WhatsApp quando cron non dispone dell'ambiente user-bus di systemd.
- Doctor pulisce lo stato legacy di staging delle dipendenze dei Plugin creato da versioni precedenti di OpenClaw. Ripara anche i Plugin scaricabili configurati mancanti quando il registro riesce a risolverli, e il passaggio doctor 2026.5.2 installa automaticamente i Plugin scaricabili che una configurazione precedente usa già prima di contrassegnare la configurazione come toccata per quella release.
- Doctor ripara la configurazione obsoleta dei Plugin rimuovendo gli id dei Plugin mancanti da `plugins.allow`/`plugins.entries`, oltre alla configurazione di canale pendente corrispondente, ai target Heartbeat e agli override del modello di canale quando la scoperta dei Plugin è integra.
- Doctor mette in quarantena la configurazione non valida dei Plugin disabilitando la voce `plugins.entries.<id>` interessata e rimuovendo il relativo payload `config` non valido. L'avvio del Gateway salta già solo quel Plugin non valido, così gli altri Plugin e canali possono continuare a funzionare.
- Imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando un altro supervisore gestisce il ciclo di vita del gateway. Doctor continua a segnalare l'integrità di gateway/servizio e applica le riparazioni non di servizio, ma salta installazione/avvio/riavvio/bootstrap del servizio e la pulizia del servizio legacy.
- Su Linux, doctor ignora le unità systemd inattive aggiuntive simili al gateway e non riscrive i metadati di comando/entrypoint per un servizio gateway systemd in esecuzione durante la riparazione. Arresta prima il servizio oppure usa `openclaw gateway install --force` quando vuoi intenzionalmente sostituire il launcher attivo.
- Doctor migra automaticamente la configurazione Talk piatta legacy (`talk.voiceId`, `talk.modelId` e simili) in `talk.provider` + `talk.providers.<provider>`.
- Le esecuzioni ripetute di `doctor --fix` non segnalano/applicano più la normalizzazione di Talk quando l'unica differenza è l'ordine delle chiavi dell'oggetto.
- Doctor include un controllo di prontezza della ricerca in memoria e può consigliare `openclaw configure --section model` quando mancano le credenziali di embedding.
- Doctor avvisa quando non è configurato alcun proprietario dei comandi. Il proprietario dei comandi è l'account dell'operatore umano autorizzato a eseguire comandi riservati al proprietario e ad approvare azioni pericolose. L'abbinamento DM consente solo a qualcuno di parlare con il bot; se hai approvato un mittente prima che esistesse il bootstrap del primo proprietario, imposta esplicitamente `commands.ownerAllowFrom`.
- Doctor avvisa quando sono configurati agenti in modalità Codex e nella home Codex dell'operatore esistono asset personali della CLI Codex. Gli avvii locali dell'app-server Codex usano home isolate per agente, quindi usa `openclaw migrate codex --dry-run` per inventariare gli asset che dovrebbero essere promossi deliberatamente.
- Doctor avvisa quando Skills consentite per l'agente predefinito non sono disponibili nell'ambiente di runtime corrente perché mancano binari, variabili d'ambiente, configurazione o requisiti del sistema operativo. `doctor --fix` può disabilitare quelle Skills non disponibili con `skills.entries.<skill>.enabled=false`; installa/configura invece il requisito mancante quando vuoi mantenere attiva la skill.
- Se la modalità sandbox è abilitata ma Docker non è disponibile, doctor segnala un avviso ad alto valore informativo con rimedio (`install Docker` oppure `openclaw config set agents.defaults.sandbox.mode off`).
- Se sono presenti file legacy del registro sandbox (`~/.openclaw/sandbox/containers.json` o `~/.openclaw/sandbox/browsers.json`), doctor li segnala; `openclaw doctor --fix` migra le voci valide in directory di registro partizionate e mette in quarantena i file legacy non validi.
- Se `gateway.auth.token`/`gateway.auth.password` sono gestiti da SecretRef e non disponibili nel percorso del comando corrente, doctor segnala un avviso di sola lettura e non scrive credenziali fallback in chiaro.
- Se l'ispezione SecretRef del canale fallisce in un percorso di correzione, doctor continua e segnala un avviso invece di uscire in anticipo.
- Dopo le migrazioni della directory di stato, doctor avvisa quando gli account Telegram o Discord predefiniti abilitati dipendono dal fallback env e `TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN` non è disponibile per il processo doctor.
- La risoluzione automatica del nome utente Telegram `allowFrom` (`doctor --fix`) richiede un token Telegram risolvibile nel percorso del comando corrente. Se l'ispezione del token non è disponibile, doctor segnala un avviso e salta la risoluzione automatica per quel passaggio.

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
