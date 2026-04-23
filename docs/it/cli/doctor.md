---
read_when:
    - Hai problemi di connettività/autenticazione e vuoi correzioni guidate
    - Hai aggiornato e vuoi un controllo rapido di integrità
summary: Riferimento CLI per `openclaw doctor` (controlli di stato + riparazioni guidate)
title: doctor
x-i18n:
    generated_at: "2026-04-23T08:26:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4b858e8726094c950edcde1e3bdff05d03ae2bd216c3519bbee4805955cf851
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Controlli di stato + correzioni rapide per il gateway e i canali.

Correlati:

- Risoluzione dei problemi: [Troubleshooting](/it/gateway/troubleshooting)
- Audit di sicurezza: [Security](/it/gateway/security)

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
- `--force`: applica riparazioni aggressive, inclusa la sovrascrittura della config di servizio personalizzata quando necessario
- `--non-interactive`: esegue senza prompt; solo migrazioni sicure
- `--generate-gateway-token`: genera e configura un token gateway
- `--deep`: analizza i servizi di sistema per installazioni gateway aggiuntive

Note:

- I prompt interattivi (come correzioni keychain/OAuth) vengono eseguiti solo quando stdin è una TTY e `--non-interactive` **non** è impostato. Le esecuzioni headless (Cron, Telegram, nessun terminale) salteranno i prompt.
- Prestazioni: le esecuzioni non interattive di `doctor` saltano il caricamento eager dei plugin, così i controlli di stato headless restano veloci. Le sessioni interattive caricano comunque completamente i plugin quando un controllo richiede il loro contributo.
- `--fix` (alias di `--repair`) scrive un backup in `~/.openclaw/openclaw.json.bak` e rimuove le chiavi di config sconosciute, elencando ogni rimozione.
- I controlli di integrità dello stato ora rilevano file di transcript orfani nella directory delle sessioni e possono archiviarli come `.deleted.<timestamp>` per recuperare spazio in sicurezza.
- Doctor analizza anche `~/.openclaw/cron/jobs.json` (o `cron.store`) per forme legacy dei job Cron e può riscriverle sul posto prima che lo scheduler debba auto-normalizzarle a runtime.
- Doctor ripara le dipendenze di runtime mancanti dei plugin inclusi senza richiedere accesso in scrittura al pacchetto OpenClaw installato. Per installazioni npm possedute da root o unità systemd rafforzate, imposta `OPENCLAW_PLUGIN_STAGE_DIR` su una directory scrivibile come `/var/lib/openclaw/plugin-runtime-deps`.
- Doctor migra automaticamente la config Talk flat legacy (`talk.voiceId`, `talk.modelId` e simili) in `talk.provider` + `talk.providers.<provider>`.
- Esecuzioni ripetute di `doctor --fix` non segnalano né applicano più la normalizzazione Talk quando l'unica differenza è l'ordine delle chiavi dell'oggetto.
- Doctor include un controllo di prontezza per la ricerca in memoria e può consigliare `openclaw configure --section model` quando mancano le credenziali di embedding.
- Se la modalità sandbox è abilitata ma Docker non è disponibile, doctor segnala un avviso ad alto segnale con la correzione (`install Docker` oppure `openclaw config set agents.defaults.sandbox.mode off`).
- Se `gateway.auth.token`/`gateway.auth.password` sono gestiti come SecretRef e non disponibili nel percorso del comando corrente, doctor segnala un avviso di sola lettura e non scrive credenziali di fallback in testo normale.
- Se l'ispezione SecretRef del canale fallisce in un percorso di correzione, doctor continua e segnala un avviso invece di terminare in anticipo.
- L'auto-risoluzione del nome utente Telegram `allowFrom` (`doctor --fix`) richiede un token Telegram risolvibile nel percorso del comando corrente. Se l'ispezione del token non è disponibile, doctor segnala un avviso e salta l'auto-risoluzione per quel passaggio.

## macOS: override env `launchctl`

Se in precedenza hai eseguito `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), quel valore sovrascrive il tuo file di config e può causare errori persistenti di “non autorizzato”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
