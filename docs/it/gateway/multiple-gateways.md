---
read_when:
    - Eseguire più Gateway sulla stessa macchina
    - Hai bisogno di configurazione/stato/porte isolati per ogni Gateway
summary: Esegui più Gateway OpenClaw su un unico host (isolamento, porte e profili)
title: Più Gateway
x-i18n:
    generated_at: "2026-04-21T19:20:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36796da339d5baea1704a7f42530030ea6ef4fa4bde43452ffec946b917ed4a3
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Più Gateway (stesso host)

Nella maggior parte delle configurazioni è consigliabile usare un solo Gateway, perché un singolo Gateway può gestire più connessioni di messaggistica e agenti. Se hai bisogno di un isolamento più forte o di ridondanza, ad esempio un bot di emergenza, esegui Gateway separati con profili/porte isolati.

## Configurazione consigliata migliore

Per la maggior parte degli utenti, la configurazione più semplice per un bot di emergenza è:

- mantenere il bot principale sul profilo predefinito
- eseguire il bot di emergenza con `--profile rescue`
- usare un bot Telegram completamente separato per l’account di emergenza
- mantenere il bot di emergenza su una porta base diversa, ad esempio `19789`

Questo mantiene il bot di emergenza isolato da quello principale, così può eseguire debug o applicare modifiche di configurazione se il bot primario non è disponibile. Lascia almeno 20 porte di distanza tra le porte base, così le porte derivate browser/canvas/CDP non entreranno mai in conflitto.

## Avvio rapido del bot di emergenza

Usa questo come percorso predefinito, a meno che tu non abbia un motivo valido per fare diversamente:

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Se il tuo bot principale è già in esecuzione, di solito è tutto ciò che ti serve.

Durante `openclaw --profile rescue onboard`:

- usa il token del bot Telegram separato
- mantieni il profilo `rescue`
- usa una porta base almeno 20 più alta rispetto a quella del bot principale
- accetta lo spazio di lavoro di emergenza predefinito, a meno che tu non ne gestisca già uno tu stesso

Se l’onboarding ha già installato per te il servizio di emergenza, il comando finale `gateway install` non è necessario.

## Perché funziona

Il bot di emergenza resta indipendente perché ha i propri:

- profilo/configurazione
- directory di stato
- workspace
- porta base, più le porte derivate
- token del bot Telegram

Per la maggior parte delle configurazioni, usa un bot Telegram completamente separato per il profilo di emergenza:

- facile da mantenere solo per gli operatori
- token e identità del bot separati
- indipendente dall’installazione del canale/dell’app del bot principale
- semplice percorso di ripristino basato su DM quando il bot principale è guasto

## Cosa cambia `--profile rescue onboard`

`openclaw --profile rescue onboard` usa il normale flusso di onboarding, ma scrive tutto in un profilo separato.

In pratica, questo significa che il bot di emergenza ottiene i propri:

- file di configurazione
- directory di stato
- workspace (per impostazione predefinita `~/.openclaw/workspace-rescue`)
- nome del servizio gestito

Per il resto, i prompt sono gli stessi del normale onboarding.

## Configurazione generale con più Gateway

La disposizione del bot di emergenza qui sopra è l’impostazione predefinita più semplice, ma lo stesso schema di isolamento funziona per qualsiasi coppia o gruppo di Gateway su un unico host.

Per una configurazione più generale, assegna a ogni Gateway aggiuntivo il proprio profilo con nome e la propria porta base:

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Se vuoi che entrambi i Gateway usino profili con nome, funziona ugualmente:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

I servizi seguono lo stesso schema:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Usa l’avvio rapido del bot di emergenza quando vuoi un canale operatore di fallback. Usa lo schema generale con profili quando vuoi più Gateway persistenti per canali, tenant, workspace o ruoli operativi diversi.

## Checklist di isolamento

Mantieni univoci questi elementi per ogni istanza Gateway:

- `OPENCLAW_CONFIG_PATH` — file di configurazione per istanza
- `OPENCLAW_STATE_DIR` — sessioni, credenziali e cache per istanza
- `agents.defaults.workspace` — radice del workspace per istanza
- `gateway.port` (o `--port`) — univoco per istanza
- porte derivate browser/canvas/CDP

Se questi elementi sono condivisi, incontrerai race nella configurazione e conflitti di porta.

## Mappatura delle porte (derivate)

Porta base = `gateway.port` (oppure `OPENCLAW_GATEWAY_PORT` / `--port`).

- porta del servizio di controllo browser = base + 2 (solo loopback locale)
- l’host canvas viene servito sul server HTTP del Gateway (stessa porta di `gateway.port`)
- le porte CDP del profilo browser vengono allocate automaticamente da `browser.controlPort + 9 .. + 108`

Se sovrascrivi uno qualsiasi di questi valori in config o env, devi mantenerli univoci per ogni istanza.

## Note su browser/CDP (errore comune)

- **Non** fissare `browser.cdpUrl` sugli stessi valori su più istanze.
- Ogni istanza ha bisogno della propria porta di controllo browser e del proprio intervallo CDP, derivati dalla relativa porta gateway.
- Se hai bisogno di porte CDP esplicite, imposta `browser.profiles.<name>.cdpPort` per istanza.
- Chrome remoto: usa `browser.profiles.<name>.cdpUrl` (per profilo, per istanza).

## Esempio manuale con env

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## Verifiche rapide

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

Interpretazione:

- `gateway status --deep` aiuta a individuare servizi `launchd`/`systemd`/`schtasks` obsoleti provenienti da installazioni precedenti.
- Il testo di avviso di `gateway probe`, come `multiple reachable gateways detected`, è previsto solo quando esegui intenzionalmente più gateway isolati.
