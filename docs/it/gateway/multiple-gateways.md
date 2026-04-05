---
read_when:
    - Esecuzione di più Gateway sulla stessa macchina
    - Hai bisogno di configurazione/stato/porte isolati per ogni Gateway
summary: Esegui più Gateway OpenClaw su un solo host (isolamento, porte e profili)
title: Gateway multipli
x-i18n:
    generated_at: "2026-04-05T13:52:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 061f204bf56b28c6bd0e2c9aee6c561a8a162ca219060117fea4d3a007f01899
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Gateway multipli (stesso host)

Nella maggior parte delle configurazioni è consigliabile usare un solo Gateway, perché un singolo Gateway può gestire più connessioni di messaggistica e agenti. Se hai bisogno di un isolamento più forte o di ridondanza (ad esempio un rescue bot), esegui Gateway separati con profili/porte isolati.

## Checklist di isolamento (obbligatoria)

- `OPENCLAW_CONFIG_PATH` — file di configurazione per istanza
- `OPENCLAW_STATE_DIR` — sessioni, credenziali, cache per istanza
- `agents.defaults.workspace` — radice dello spazio di lavoro per istanza
- `gateway.port` (o `--port`) — univoco per istanza
- Le porte derivate (browser/canvas) non devono sovrapporsi

Se questi elementi sono condivisi, incontrerai race di configurazione e conflitti di porta.

## Consigliato: profili (`--profile`)

I profili delimitano automaticamente `OPENCLAW_STATE_DIR` + `OPENCLAW_CONFIG_PATH` e aggiungono un suffisso ai nomi dei servizi.

```bash
# principale
openclaw --profile main setup
openclaw --profile main gateway --port 18789

# rescue
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

Servizi per profilo:

```bash
openclaw --profile main gateway install
openclaw --profile rescue gateway install
```

## Guida rescue-bot

Esegui un secondo Gateway sullo stesso host con i propri:

- profilo/configurazione
- directory di stato
- spazio di lavoro
- porta base (più le porte derivate)

Questo mantiene il rescue bot isolato dal bot principale, così può eseguire debug o applicare modifiche di configurazione se il bot primario è fuori servizio.

Spaziatura delle porte: lascia almeno 20 porte tra le porte base, in modo che le porte derivate di browser/canvas/CDP non entrino mai in conflitto.

### Come installare (rescue bot)

```bash
# Bot principale (esistente o nuovo, senza parametro --profile)
# Esegue sulla porta 18789 + porte Chrome CDC/Canvas/...
openclaw onboard
openclaw gateway install

# Rescue bot (profilo + porte isolati)
openclaw --profile rescue onboard
# Note:
# - il nome dello spazio di lavoro avrà per impostazione predefinita il suffisso -rescue
# - la porta dovrebbe essere almeno 18789 + 20 porte,
#   meglio scegliere una porta base completamente diversa, come 19789,
# - il resto dell'onboarding è uguale al normale

# Per installare il servizio (se non è avvenuto automaticamente durante la configurazione)
openclaw --profile rescue gateway install
```

## Mappatura delle porte (derivate)

Porta base = `gateway.port` (o `OPENCLAW_GATEWAY_PORT` / `--port`).

- porta del servizio di controllo browser = base + 2 (solo loopback)
- l'host canvas è servito sul server HTTP del Gateway (stessa porta di `gateway.port`)
- le porte CDP del profilo browser vengono allocate automaticamente da `browser.controlPort + 9 .. + 108`

Se sostituisci una di queste impostazioni in config o env, devi mantenerle univoche per istanza.

## Note su browser/CDP (errore comune)

- **Non** fissare `browser.cdpUrl` agli stessi valori su più istanze.
- Ogni istanza ha bisogno della propria porta di controllo browser e del proprio intervallo CDP (derivato dalla sua porta gateway).
- Se hai bisogno di porte CDP esplicite, imposta `browser.profiles.<name>.cdpPort` per istanza.
- Chrome remoto: usa `browser.profiles.<name>.cdpUrl` (per profilo, per istanza).

## Esempio manuale con env

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw-main \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19001
```

## Controlli rapidi

```bash
openclaw --profile main gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw --profile main status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

Interpretazione:

- `gateway status --deep` aiuta a individuare servizi launchd/systemd/schtasks obsoleti da installazioni precedenti.
- Il testo di avviso di `gateway probe`, come `multiple reachable gateways detected`, è previsto solo quando esegui intenzionalmente più gateway isolati.
