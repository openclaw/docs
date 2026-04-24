---
read_when:
    - Esecuzione di più Gateway sulla stessa macchina
    - Hai bisogno di configurazione/stato/porte isolate per ogni Gateway
summary: Eseguire più Gateway OpenClaw su un solo host (isolamento, porte e profili)
title: Gateway multipli
x-i18n:
    generated_at: "2026-04-24T08:41:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1700a0d29ceee3e2a242a8455a3c948895fb25750a2b1bce5c4bd0690a051881
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Gateway multipli (stesso host)

La maggior parte delle configurazioni dovrebbe usare un solo Gateway, perché un singolo Gateway può gestire più connessioni di messaggistica e agenti. Se hai bisogno di un isolamento più forte o di ridondanza (per esempio un bot di emergenza), esegui Gateway separati con profili/porte isolati.

## Configurazione migliore consigliata

Per la maggior parte degli utenti, la configurazione più semplice per un bot di emergenza è:

- mantenere il bot principale sul profilo predefinito
- eseguire il bot di emergenza su `--profile rescue`
- usare un bot Telegram completamente separato per l'account di emergenza
- mantenere il bot di emergenza su una porta base diversa, ad esempio `19789`

Questo mantiene il bot di emergenza isolato dal bot principale, così può fare debug o applicare
modifiche di configurazione se il bot primario è fuori servizio. Lascia almeno 20 porte tra le
porte base in modo che le porte derivate per browser/canvas/CDP non entrino mai in conflitto.

## Avvio rapido del bot di emergenza

Usalo come percorso predefinito a meno che tu non abbia una forte ragione per fare altro:

```bash
# Bot di emergenza (bot Telegram separato, profilo separato, porta 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Se il tuo bot principale è già in esecuzione, di solito è tutto ciò che ti serve.

Durante `openclaw --profile rescue onboard`:

- usa il token separato del bot Telegram
- mantieni il profilo `rescue`
- usa una porta base almeno 20 unità più alta del bot principale
- accetta il workspace di emergenza predefinito, a meno che tu non ne gestisca già uno

Se l'onboarding ha già installato il servizio di emergenza per te, l'ultimo
`gateway install` non è necessario.

## Perché funziona

Il bot di emergenza resta indipendente perché ha i propri:

- profilo/configurazione
- directory di stato
- workspace
- porta base (più le porte derivate)
- token del bot Telegram

Per la maggior parte delle configurazioni, usa un bot Telegram completamente separato per il profilo di emergenza:

- facile da mantenere solo per operatori
- token e identità del bot separati
- indipendente dall'installazione del canale/app del bot principale
- semplice percorso di recupero basato su DM quando il bot principale è guasto

## Cosa cambia con `--profile rescue onboard`

`openclaw --profile rescue onboard` usa il normale flusso di onboarding, ma
scrive tutto in un profilo separato.

In pratica, questo significa che il bot di emergenza ottiene propri:

- file di configurazione
- directory di stato
- workspace (predefinito `~/.openclaw/workspace-rescue`)
- nome del servizio gestito

Per il resto, i prompt sono uguali a quelli del normale onboarding.

## Configurazione generale con più Gateway

Il layout del bot di emergenza qui sopra è l'impostazione predefinita più semplice, ma lo stesso pattern
di isolamento funziona per qualsiasi coppia o gruppo di Gateway sullo stesso host.

Per una configurazione più generale, assegna a ogni Gateway aggiuntivo il proprio profilo nominato e la
propria porta base:

```bash
# principale (profilo predefinito)
openclaw setup
openclaw gateway --port 18789

# gateway aggiuntivo
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Se vuoi che entrambi i Gateway usino profili nominati, funziona comunque:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

I servizi seguono lo stesso pattern:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Usa l'avvio rapido del bot di emergenza quando vuoi un canale operatore di fallback. Usa il
pattern generale dei profili quando vuoi più Gateway persistenti per
canali, tenant, workspace o ruoli operativi differenti.

## Checklist di isolamento

Mantieni univoci questi elementi per ogni istanza Gateway:

- `OPENCLAW_CONFIG_PATH` — file di configurazione per istanza
- `OPENCLAW_STATE_DIR` — sessioni, credenziali, cache per istanza
- `agents.defaults.workspace` — radice workspace per istanza
- `gateway.port` (o `--port`) — univoca per istanza
- porte derivate browser/canvas/CDP

Se questi elementi sono condivisi, incontrerai race sulla configurazione e conflitti di porta.

## Mappatura delle porte (derivata)

Porta base = `gateway.port` (o `OPENCLAW_GATEWAY_PORT` / `--port`).

- porta del servizio di controllo browser = base + 2 (solo loopback)
- canvas host è servito sul server HTTP del Gateway (stessa porta di `gateway.port`)
- le porte CDP del profilo browser vengono allocate automaticamente da `browser.controlPort + 9 .. + 108`

Se sostituisci una qualsiasi di queste in config o env, devi mantenerle univoche per istanza.

## Note su browser/CDP (errore comune)

- **Non** fissare `browser.cdpUrl` agli stessi valori su più istanze.
- Ogni istanza ha bisogno della propria porta di controllo browser e del proprio intervallo CDP (derivato dalla porta del Gateway).
- Se hai bisogno di porte CDP esplicite, imposta `browser.profiles.<name>.cdpPort` per istanza.
- Chrome remoto: usa `browser.profiles.<name>.cdpUrl` (per profilo, per istanza).

## Esempio env manuale

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## Controlli rapidi

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

Interpretazione:

- `gateway status --deep` aiuta a individuare servizi launchd/systemd/schtasks obsoleti da installazioni precedenti.
- Il testo di avviso di `gateway probe`, come `multiple reachable gateways detected`, è previsto solo quando esegui intenzionalmente più Gateway isolati.

## Correlati

- [Runbook del Gateway](/it/gateway)
- [Lock del Gateway](/it/gateway/gateway-lock)
- [Configurazione](/it/gateway/configuration)
