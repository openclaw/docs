---
read_when:
    - Hai problemi di connettività/autenticazione e vuoi correzioni guidate
    - Hai aggiornato e vuoi una verifica rapida
summary: Riferimento CLI per `openclaw doctor` (controlli di integrità + riparazioni guidate)
title: Diagnostica
x-i18n:
    generated_at: "2026-04-30T08:43:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9985c84d23861dd9468a4659ee00519573fe6d540c436548da0a68067dbabc4c
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

- `--no-workspace-suggestions`: disabilita i suggerimenti di memoria/ricerca dell'area di lavoro
- `--yes`: accetta i valori predefiniti senza chiedere conferma
- `--repair`: applica le riparazioni consigliate senza chiedere conferma
- `--fix`: alias di `--repair`
- `--force`: applica riparazioni aggressive, inclusa la sovrascrittura della configurazione personalizzata del servizio quando necessario
- `--non-interactive`: esegue senza prompt; solo migrazioni sicure
- `--generate-gateway-token`: genera e configura un token Gateway
- `--deep`: analizza i servizi di sistema per installazioni Gateway aggiuntive

Note:

- I prompt interattivi (come le correzioni keychain/OAuth) vengono eseguiti solo quando stdin è una TTY e `--non-interactive` **non** è impostato. Le esecuzioni headless (Cron, Telegram, nessun terminale) salteranno i prompt.
- Prestazioni: le esecuzioni non interattive di `doctor` saltano il caricamento anticipato dei Plugin, così i controlli di integrità headless restano veloci. Le sessioni interattive caricano comunque completamente i Plugin quando un controllo richiede il loro contributo.
- `--fix` (alias di `--repair`) scrive un backup in `~/.openclaw/openclaw.json.bak` ed elimina le chiavi di configurazione sconosciute, elencando ogni rimozione.
- I controlli di integrità dello stato ora rilevano file di trascrizione orfani nella directory delle sessioni. La loro archiviazione come `.deleted.<timestamp>` richiede una conferma interattiva; `--fix`, `--yes` e le esecuzioni headless li lasciano al loro posto.
- Doctor analizza anche `~/.openclaw/cron/jobs.json` (o `cron.store`) per forme legacy dei job Cron e può riscriverle sul posto prima che lo scheduler debba normalizzarle automaticamente a runtime.
- Doctor ripara le dipendenze runtime mancanti dei Plugin inclusi senza scrivere nelle installazioni globali pacchettizzate. Per installazioni npm di proprietà root o unità systemd irrigidite, imposta `OPENCLAW_PLUGIN_STAGE_DIR` su una directory scrivibile come `/var/lib/openclaw/plugin-runtime-deps`; può anche essere un elenco di percorsi come `/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps`, dove le root precedenti sono layer di lookup in sola lettura e la root finale è il target della riparazione.
- Doctor ripara la configurazione obsoleta dei Plugin rimuovendo gli id Plugin mancanti da `plugins.allow`/`plugins.entries`, oltre alla configurazione di canale sospesa corrispondente, ai target Heartbeat e agli override dei modelli di canale quando il rilevamento dei Plugin è sano.
- Doctor mette in quarantena la configurazione Plugin non valida disabilitando la voce `plugins.entries.<id>` interessata e rimuovendo il suo payload `config` non valido. L'avvio del Gateway salta già solo quel Plugin non valido, così altri Plugin e canali possono continuare a funzionare.
- Imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando un altro supervisore possiede il ciclo di vita del Gateway. Doctor segnala comunque l'integrità di Gateway/servizio e applica riparazioni non relative al servizio, ma salta installazione/avvio/riavvio/bootstrap del servizio e la pulizia dei servizi legacy.
- Su Linux, doctor ignora le unità systemd inattive aggiuntive simili al Gateway e non riscrive i metadati di comando/entrypoint per un servizio Gateway systemd in esecuzione durante la riparazione. Arresta prima il servizio o usa `openclaw gateway install --force` quando vuoi intenzionalmente sostituire il launcher attivo.
- Doctor migra automaticamente la configurazione piatta legacy di Talk (`talk.voiceId`, `talk.modelId` e simili) in `talk.provider` + `talk.providers.<provider>`.
- Le esecuzioni ripetute di `doctor --fix` non segnalano/applicano più la normalizzazione di Talk quando l'unica differenza è l'ordine delle chiavi dell'oggetto.
- Doctor include un controllo di prontezza della ricerca in memoria e può consigliare `openclaw configure --section model` quando mancano le credenziali di embedding.
- Doctor avvisa quando non è configurato alcun proprietario dei comandi. Il proprietario dei comandi è l'account operatore umano autorizzato a eseguire comandi riservati al proprietario e ad approvare azioni pericolose. L'abbinamento via DM permette solo a qualcuno di parlare con il bot; se hai approvato un mittente prima che esistesse il bootstrap del primo proprietario, imposta esplicitamente `commands.ownerAllowFrom`.
- Se la modalità sandbox è abilitata ma Docker non è disponibile, doctor segnala un avviso ad alto segnale con rimedio (`install Docker` o `openclaw config set agents.defaults.sandbox.mode off`).
- Se `gateway.auth.token`/`gateway.auth.password` sono gestiti da SecretRef e non disponibili nel percorso del comando corrente, doctor segnala un avviso di sola lettura e non scrive credenziali fallback in chiaro.
- Se l'ispezione SecretRef del canale fallisce in un percorso di correzione, doctor continua e segnala un avviso invece di uscire in anticipo.
- La risoluzione automatica dello username Telegram `allowFrom` (`doctor --fix`) richiede un token Telegram risolvibile nel percorso del comando corrente. Se l'ispezione del token non è disponibile, doctor segnala un avviso e salta la risoluzione automatica per quel passaggio.

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
- [Gateway doctor](/it/gateway/doctor)
