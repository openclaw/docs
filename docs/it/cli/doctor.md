---
read_when:
    - Hai problemi di connettività/autenticazione e vuoi correzioni guidate
    - Hai aggiornato e vuoi un controllo rapido di validità
summary: Riferimento CLI per `openclaw doctor` (controlli di integrità + riparazioni guidate)
title: Doctor
x-i18n:
    generated_at: "2026-04-24T08:33:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5ea3f4992effe3d417f20427b3bdb9e47712816106b03bc27a415571cf88a7c
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Controlli di integrità + correzioni rapide per il gateway e i canali.

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

- `--no-workspace-suggestions`: disabilita i suggerimenti di memoria/ricerca dello spazio di lavoro
- `--yes`: accetta i valori predefiniti senza chiedere conferma
- `--repair`: applica le riparazioni consigliate senza chiedere conferma
- `--fix`: alias di `--repair`
- `--force`: applica riparazioni aggressive, inclusa la sovrascrittura della configurazione del servizio personalizzata quando necessario
- `--non-interactive`: esegue senza prompt; solo migrazioni sicure
- `--generate-gateway-token`: genera e configura un token gateway
- `--deep`: analizza i servizi di sistema per installazioni gateway aggiuntive

Note:

- I prompt interattivi (come le correzioni keychain/OAuth) vengono eseguiti solo quando stdin è un TTY e `--non-interactive` **non** è impostato. Le esecuzioni headless (Cron, Telegram, nessun terminale) salteranno i prompt.
- Prestazioni: le esecuzioni non interattive di `doctor` saltano il caricamento anticipato dei Plugin, così i controlli di integrità headless rimangono rapidi. Le sessioni interattive continuano a caricare completamente i Plugin quando un controllo richiede il loro contributo.
- `--fix` (alias di `--repair`) scrive un backup in `~/.openclaw/openclaw.json.bak` e rimuove chiavi di configurazione sconosciute, elencando ogni rimozione.
- I controlli di integrità dello stato ora rilevano file di trascrizione orfani nella directory delle sessioni e possono archiviarli come `.deleted.<timestamp>` per recuperare spazio in sicurezza.
- Doctor analizza anche `~/.openclaw/cron/jobs.json` (o `cron.store`) per forme legacy dei processi Cron e può riscriverle sul posto prima che il pianificatore debba auto-normalizzarle a runtime.
- Doctor ripara le dipendenze runtime mancanti dei Plugin integrati senza richiedere accesso in scrittura al pacchetto OpenClaw installato. Per installazioni npm di proprietà di root o unità systemd rinforzate, imposta `OPENCLAW_PLUGIN_STAGE_DIR` su una directory scrivibile come `/var/lib/openclaw/plugin-runtime-deps`.
- Doctor esegue automaticamente la migrazione della configurazione Talk flat legacy (`talk.voiceId`, `talk.modelId` e simili) in `talk.provider` + `talk.providers.<provider>`.
- Esecuzioni ripetute di `doctor --fix` non segnalano né applicano più la normalizzazione di Talk quando l'unica differenza è l'ordine delle chiavi dell'oggetto.
- Doctor include un controllo di prontezza della ricerca in memoria e può consigliare `openclaw configure --section model` quando mancano le credenziali di embedding.
- Se la modalità sandbox è abilitata ma Docker non è disponibile, doctor segnala un avviso ad alta rilevanza con una correzione (`install Docker` oppure `openclaw config set agents.defaults.sandbox.mode off`).
- Se `gateway.auth.token`/`gateway.auth.password` sono gestiti da SecretRef e non sono disponibili nel percorso di comando corrente, doctor segnala un avviso di sola lettura e non scrive credenziali fallback in chiaro.
- Se l'ispezione di SecretRef del canale fallisce in un percorso di correzione, doctor continua e segnala un avviso invece di uscire in anticipo.
- La risoluzione automatica dei nomi utente `allowFrom` di Telegram (`doctor --fix`) richiede un token Telegram risolvibile nel percorso di comando corrente. Se l'ispezione del token non è disponibile, doctor segnala un avviso e salta la risoluzione automatica per quel passaggio.

## macOS: override env `launchctl`

Se in precedenza hai eseguito `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), quel valore sovrascrive il file di configurazione e può causare errori persistenti di tipo “unauthorized”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Correlati

- [Riferimento CLI](/it/cli)
- [Gateway doctor](/it/gateway/doctor)
