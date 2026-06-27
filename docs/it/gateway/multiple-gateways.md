---
read_when:
    - Eseguire più di un Gateway sulla stessa macchina
    - È necessario avere configurazione, stato e porte isolati per ciascun Gateway
summary: Eseguire più Gateway OpenClaw su un host (isolamento, porte e profili)
title: Più Gateway
x-i18n:
    generated_at: "2026-06-27T17:33:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d6f6df481f6ba36749770199ef6eaf94eed33af2bed38d35a31f77b9dbba1913
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

La maggior parte delle configurazioni dovrebbe usare un solo Gateway, perché un singolo Gateway può gestire più connessioni di messaggistica e agenti. Se hai bisogno di un isolamento o di una ridondanza più forti (ad esempio, un bot di soccorso), esegui Gateway separati con profili/porte isolati.

## Configurazione migliore consigliata

Per la maggior parte degli utenti, la configurazione più semplice per un bot di soccorso è:

- mantenere il bot principale sul profilo predefinito
- eseguire il bot di soccorso su `--profile rescue`
- usare un bot Telegram completamente separato per l'account di soccorso
- mantenere il bot di soccorso su una porta di base diversa, ad esempio `19789`

Questo mantiene il bot di soccorso isolato dal bot principale, così può eseguire il debug o applicare
modifiche di configurazione se il bot primario non è disponibile. Lascia almeno 20 porte tra
le porte di base, così le porte browser/canvas/CDP derivate non entrano mai in conflitto.

## Avvio rapido del bot di soccorso

Usa questo percorso come predefinito, a meno che tu non abbia un motivo valido per fare qualcosa
di diverso:

```bash
# Bot di soccorso (bot Telegram separato, profilo separato, porta 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Se il tuo bot principale è già in esecuzione, di solito è tutto ciò che ti serve.

Durante `openclaw --profile rescue onboard`:

- usa il token del bot Telegram separato
- mantieni il profilo `rescue`
- usa una porta di base almeno 20 porte più alta rispetto al bot principale
- accetta l'area di lavoro di soccorso predefinita, a meno che tu non ne gestisca già una autonomamente

Se l'onboarding ha già installato il servizio di soccorso per te, il comando finale
`gateway install` non è necessario.

## Perché funziona

Il bot di soccorso rimane indipendente perché ha i propri:

- profilo/configurazione
- directory di stato
- area di lavoro
- porta di base (più porte derivate)
- token del bot Telegram

Per la maggior parte delle configurazioni, usa un bot Telegram completamente separato per il profilo di soccorso:

- facile da mantenere riservato agli operatori
- token e identità del bot separati
- indipendente dall'installazione del canale/app del bot principale
- semplice percorso di recupero basato su DM quando il bot principale non funziona

## Cosa cambia con `--profile rescue onboard`

`openclaw --profile rescue onboard` usa il normale flusso di onboarding, ma
scrive tutto in un profilo separato.

In pratica, questo significa che il bot di soccorso ottiene i propri:

- file di configurazione
- directory di stato
- area di lavoro (per impostazione predefinita `~/.openclaw/workspace-rescue`)
- nome del servizio gestito

Per il resto, i prompt sono gli stessi del normale onboarding.

## Configurazione multi-Gateway generale

Il layout del bot di soccorso sopra è l'impostazione predefinita più semplice, ma lo stesso
schema di isolamento funziona per qualsiasi coppia o gruppo di Gateway su un host.

Per una configurazione più generale, assegna a ogni Gateway aggiuntivo il proprio profilo con nome e la propria
porta di base:

```bash
# principale (profilo predefinito)
openclaw setup
openclaw gateway --port 18789

# gateway aggiuntivo
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Se vuoi che entrambi i Gateway usino profili con nome, funziona anche così:

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

Usa l'avvio rapido del bot di soccorso quando vuoi un percorso operatore di fallback. Usa lo
schema generale dei profili quando vuoi più Gateway di lunga durata per
canali, tenant, aree di lavoro o ruoli operativi diversi.

## Checklist di isolamento

Mantieni questi elementi univoci per ogni istanza di Gateway:

- `OPENCLAW_CONFIG_PATH` — file di configurazione per istanza
- `OPENCLAW_STATE_DIR` — sessioni, credenziali, cache per istanza
- `agents.defaults.workspace` — radice dell'area di lavoro per istanza
- `gateway.port` (o `--port`) — univoca per istanza
- porte browser/canvas/CDP derivate

Se questi elementi sono condivisi, incontrerai race condition di configurazione e conflitti di porte.

## Mappatura delle porte (derivata)

Porta di base = `gateway.port` (o `OPENCLAW_GATEWAY_PORT` / `--port`).

- porta del servizio di controllo browser = base + 2 (solo local loopback)
- l'host canvas viene servito sul server HTTP del Gateway (stessa porta di `gateway.port`)
- le porte CDP del profilo browser vengono allocate automaticamente da `browser.controlPort + 9 .. + 108`

Se sovrascrivi uno qualsiasi di questi valori nella configurazione o nell'ambiente, devi mantenerli univoci per ogni istanza.

## Note su browser/CDP (errore comune)

- **Non** fissare `browser.cdpUrl` sugli stessi valori per più istanze.
- Ogni istanza ha bisogno della propria porta di controllo browser e del proprio intervallo CDP (derivati dalla sua porta del gateway).
- Se hai bisogno di porte CDP esplicite, imposta `browser.profiles.<name>.cdpPort` per istanza.
- Chrome remoto: usa `browser.profiles.<name>.cdpUrl` (per profilo, per istanza).

## Esempio manuale con variabili d'ambiente

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

- `gateway status --deep` aiuta a individuare servizi launchd/systemd/schtasks obsoleti provenienti da installazioni precedenti.
- Il testo di avviso di `gateway probe`, come `multiple reachable gateway identities detected`, è previsto solo quando esegui intenzionalmente più di un gateway isolato, oppure quando OpenClaw non può dimostrare che le destinazioni di probe raggiungibili siano lo stesso gateway. Un tunnel SSH, un URL proxy o un URL remoto configurato verso lo stesso gateway è un solo gateway con più trasporti, anche quando le porte di trasporto sono diverse.

## Correlati

- [Runbook del Gateway](/it/gateway)
- [Blocco del Gateway](/it/gateway/gateway-lock)
- [Configurazione](/it/gateway/configuration)
