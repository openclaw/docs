---
read_when:
    - Hai problemi di connettività/autenticazione e vuoi correzioni guidate
    - Hai aggiornato e vuoi un controllo di integrità
summary: Riferimento CLI per `openclaw doctor` (controlli di integrità + riparazioni guidate)
title: doctor
x-i18n:
    generated_at: "2026-04-05T13:47:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: d257a9e2797b4b0b50c1020165c8a1cd6a2342381bf9c351645ca37494c881e1
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Controlli di integrità + correzioni rapide per il gateway e i canali.

Correlati:

- Risoluzione dei problemi: [Risoluzione dei problemi](/gateway/troubleshooting)
- Audit di sicurezza: [Sicurezza](/gateway/security)

## Esempi

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Opzioni

- `--no-workspace-suggestions`: disabilita i suggerimenti per memoria/ricerca del workspace
- `--yes`: accetta i valori predefiniti senza chiedere conferma
- `--repair`: applica le riparazioni consigliate senza chiedere conferma
- `--fix`: alias di `--repair`
- `--force`: applica riparazioni aggressive, inclusa la sovrascrittura della configurazione del servizio personalizzata quando necessario
- `--non-interactive`: esegue senza prompt; solo migrazioni sicure
- `--generate-gateway-token`: genera e configura un token gateway
- `--deep`: analizza i servizi di sistema alla ricerca di installazioni gateway aggiuntive

Note:

- I prompt interattivi (come le correzioni keychain/OAuth) vengono eseguiti solo quando stdin è un TTY e `--non-interactive` **non** è impostato. Le esecuzioni headless (cron, Telegram, nessun terminale) salteranno i prompt.
- `--fix` (alias di `--repair`) scrive un backup in `~/.openclaw/openclaw.json.bak` e rimuove le chiavi di configurazione sconosciute, elencando ogni rimozione.
- I controlli di integrità dello stato ora rilevano file di trascrizione orfani nella directory delle sessioni e possono archiviarli come `.deleted.<timestamp>` per recuperare spazio in sicurezza.
- Doctor analizza anche `~/.openclaw/cron/jobs.json` (o `cron.store`) alla ricerca di forme legacy dei job cron e può riscriverle in-place prima che lo scheduler debba auto-normalizzarle a runtime.
- Doctor migra automaticamente la vecchia configurazione flat Talk (`talk.voiceId`, `talk.modelId` e simili) in `talk.provider` + `talk.providers.<provider>`.
- Le esecuzioni ripetute di `doctor --fix` non segnalano né applicano più la normalizzazione di Talk quando l'unica differenza è l'ordine delle chiavi dell'oggetto.
- Doctor include un controllo di disponibilità memory-search e può consigliare `openclaw configure --section model` quando mancano le credenziali per gli embedding.
- Se la modalità sandbox è abilitata ma Docker non è disponibile, doctor segnala un avviso ad alta rilevanza con la correzione suggerita (`install Docker` oppure `openclaw config set agents.defaults.sandbox.mode off`).
- Se `gateway.auth.token`/`gateway.auth.password` sono gestiti da SecretRef e non disponibili nel percorso di comando corrente, doctor segnala un avviso di sola lettura e non scrive credenziali fallback in chiaro.
- Se l'ispezione SecretRef del canale fallisce in un percorso di correzione, doctor continua e segnala un avviso invece di terminare in anticipo.
- La risoluzione automatica dei nomi utente Telegram `allowFrom` (`doctor --fix`) richiede un token Telegram risolvibile nel percorso di comando corrente. Se l'ispezione del token non è disponibile, doctor segnala un avviso e salta la risoluzione automatica per quel passaggio.

## macOS: override env `launchctl`

Se in precedenza hai eseguito `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), quel valore sovrascrive il file di configurazione e può causare errori persistenti di tipo “unauthorized”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
