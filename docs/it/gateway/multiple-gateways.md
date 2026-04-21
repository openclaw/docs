---
read_when:
    - Eseguire più Gateway sulla stessa macchina
    - Hai bisogno di configurazione/stato/porte isolati per ogni Gateway
summary: Esegui più Gateway OpenClaw su un singolo host (isolamento, porte e profili)
title: Più Gateway
x-i18n:
    generated_at: "2026-04-21T17:45:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c3fcb921bc6596040e9249467964bd9dcd40ea7c16e958bb378247b0f994a7b
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Più Gateway (stesso host)

La maggior parte delle configurazioni dovrebbe usare un solo Gateway, perché un singolo Gateway può gestire più connessioni di messaggistica e agenti. Se hai bisogno di un isolamento più forte o di ridondanza (ad esempio, un bot di emergenza), esegui Gateway separati con profili/porte isolati.

## Checklist di isolamento (obbligatoria)

- `OPENCLAW_CONFIG_PATH` — file di configurazione per istanza
- `OPENCLAW_STATE_DIR` — sessioni, credenziali, cache per istanza
- `agents.defaults.workspace` — radice del workspace per istanza
- `gateway.port` (o `--port`) — univoco per ogni istanza
- Le porte derivate (browser/canvas) non devono sovrapporsi

Se questi elementi sono condivisi, incontrerai race condition di configurazione e conflitti di porta.

## Consigliato: usa il profilo predefinito per il principale, un profilo con nome per quello di emergenza

I profili applicano automaticamente l'ambito a `OPENCLAW_STATE_DIR` + `OPENCLAW_CONFIG_PATH` e aggiungono un suffisso ai nomi dei servizi. Per
la maggior parte delle configurazioni con bot di emergenza, mantieni il bot principale sul profilo predefinito e assegna solo
al bot di emergenza un profilo con nome come `rescue`.

```bash
# principale (profilo predefinito)
openclaw setup
openclaw gateway --port 18789

# emergenza
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

Servizi:

```bash
openclaw gateway install
openclaw --profile rescue gateway install
```

Se vuoi che entrambi i Gateway usino profili con nome, funziona comunque, ma non è
obbligatorio.

## Guida al bot di emergenza

Configurazione consigliata:

- mantieni il bot principale sul profilo predefinito
- esegui il bot di emergenza con `--profile rescue`
- usa un bot Telegram completamente separato per l'account di emergenza
- mantieni il bot di emergenza su una porta base diversa, ad esempio `19001`

Questo mantiene il bot di emergenza isolato dal bot principale, così può eseguire debug o applicare
modifiche di configurazione se il bot primario non è disponibile. Lascia almeno 20 porte tra le
porte base, così le porte derivate browser/canvas/CDP non entreranno mai in conflitto.

### Canale/account di emergenza consigliato

Per la maggior parte delle configurazioni, usa un bot Telegram completamente separato per il profilo di emergenza.

Perché Telegram:

- facile da mantenere riservato ai soli operatori
- token e identità del bot separati
- indipendente dal canale/dall'installazione dell'app del bot principale
- semplice percorso di ripristino basato su DM quando il bot principale non funziona

La parte importante è l'indipendenza completa: account bot separato, credenziali separate, profilo OpenClaw separato, workspace separato e porta separata.

### Flusso di installazione consigliato

Usa questa come configurazione predefinita, a meno che tu non abbia un motivo forte per fare qualcosa di
diverso:

```bash
# Bot principale (profilo predefinito, porta 18789)
openclaw onboard
openclaw gateway install

# Bot di emergenza (bot Telegram separato, profilo separato, porta 19001)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install
```

Durante `openclaw --profile rescue onboard`:

- usa il token del bot Telegram separato
- mantieni il profilo `rescue`
- usa una porta base di almeno 20 superiore a quella del bot principale
- accetta il workspace di emergenza predefinito, a meno che tu non ne gestisca già uno personalmente

Se l'onboarding ha già installato per te il servizio di emergenza, il comando finale
`gateway install` non è necessario.

### Cosa cambia l'onboarding

`openclaw --profile rescue onboard` usa il normale flusso di onboarding, ma
scrive tutto in un profilo separato.

In pratica, questo significa che il bot di emergenza ottiene i propri:

- file di configurazione
- directory di stato
- workspace (per impostazione predefinita `~/.openclaw/workspace-rescue`)
- nome del servizio gestito

Per il resto, i prompt sono gli stessi del normale onboarding.

## Mappatura delle porte (derivata)

Porta base = `gateway.port` (o `OPENCLAW_GATEWAY_PORT` / `--port`).

- porta del servizio di controllo del browser = base + 2 (solo loopback)
- l'host canvas viene servito sul server HTTP del Gateway (stessa porta di `gateway.port`)
- le porte CDP del profilo browser vengono allocate automaticamente da `browser.controlPort + 9 .. + 108`

Se esegui override di uno qualsiasi di questi valori nella configurazione o nelle variabili d'ambiente, devi mantenerli univoci per ogni istanza.

## Note su browser/CDP (errore comune)

- **Non** fissare `browser.cdpUrl` agli stessi valori su più istanze.
- Ogni istanza ha bisogno della propria porta di controllo del browser e del proprio intervallo CDP (derivato dalla sua porta gateway).
- Se hai bisogno di porte CDP esplicite, imposta `browser.profiles.<name>.cdpPort` per istanza.
- Chrome remoto: usa `browser.profiles.<name>.cdpUrl` (per profilo, per istanza).

## Esempio manuale con env

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19001
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
