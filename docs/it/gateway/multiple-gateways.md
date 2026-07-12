---
read_when:
    - Esecuzione di più Gateway sulla stessa macchina
    - Sono necessari configurazione, stato e porte isolati per ciascun Gateway
summary: Eseguire più Gateway OpenClaw su un unico host (isolamento, porte e profili)
title: Gateway multipli
x-i18n:
    generated_at: "2026-07-12T07:04:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d5088d9bcfae6800217079365dcaec828a18ca19ac80c7ad7b4245d9059a986
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

La maggior parte delle configurazioni richiede un solo Gateway: un singolo Gateway gestisce più connessioni di messaggistica e agenti. Esegui Gateway separati con profili/porte isolati solo quando è necessario un isolamento più rigoroso o una ridondanza maggiore (ad esempio, un bot di soccorso).

## Avvio rapido del bot di soccorso

La configurazione più semplice per un bot di soccorso:

- Mantieni il bot principale sul profilo predefinito.
- Esegui il bot di soccorso con `--profile rescue`, usando un token bot Telegram dedicato.
- Assegna al bot di soccorso una porta di base diversa, ad esempio `19789`.

In questo modo, il bot di soccorso può eseguire il debug o applicare modifiche alla configurazione se il bot principale non è disponibile. Lascia almeno 20 porte di distanza tra le porte di base, affinché le porte derivate del browser/CDP non entrino mai in conflitto.

```bash
# Bot di soccorso (bot Telegram separato, profilo separato, porta 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Se il bot principale è già in esecuzione, in genere non serve altro. Se l'onboarding ha già installato il servizio di soccorso, salta il comando finale `gateway install`.

Durante `openclaw --profile rescue onboard`:

- Usa un token bot Telegram separato, dedicato all'account di soccorso (facile da riservare agli operatori, indipendente dall'installazione del canale/dell'app del bot principale e utile come semplice percorso di ripristino basato sui messaggi diretti).
- Mantieni il nome del profilo `rescue`.
- Usa una porta di base superiore di almeno 20 rispetto a quella del bot principale.
- Accetta lo spazio di lavoro di soccorso predefinito, a meno che tu non ne gestisca già uno autonomamente.

### Modifiche apportate da `--profile rescue onboard`

`--profile rescue onboard` esegue il normale flusso di onboarding, ma scrive tutto in un profilo separato; il bot di soccorso dispone quindi di propri:

- File di profilo/configurazione
- Directory di stato
- Spazio di lavoro (predefinito: `~/.openclaw/workspace-rescue`)
- Nome del servizio gestito
- Porta di base (più le porte derivate)
- Token bot Telegram

Per il resto, le richieste interattive sono identiche a quelle del normale onboarding.

## Configurazione generale con più Gateway

Lo stesso modello di isolamento funziona per qualsiasi coppia o gruppo di Gateway su un singolo host: assegna a ogni Gateway aggiuntivo un profilo denominato e una porta di base dedicati:

```bash
# principale (profilo predefinito)
openclaw setup
openclaw gateway --port 18789

# gateway aggiuntivo
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

È inoltre possibile usare profili denominati per entrambi:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

I servizi seguono lo stesso modello:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Usa l'avvio rapido del bot di soccorso per disporre di un canale operativo di riserva; usa il modello generale basato sui profili per più Gateway di lunga durata distribuiti tra canali, tenant, spazi di lavoro o ruoli operativi differenti.

## Elenco di controllo per l'isolamento

Mantieni univoche queste impostazioni per ogni istanza del Gateway:

| Impostazione                 | Scopo                                              |
| ---------------------------- | -------------------------------------------------- |
| `OPENCLAW_CONFIG_PATH`       | File di configurazione specifico dell'istanza      |
| `OPENCLAW_STATE_DIR`         | Sessioni, credenziali e cache specifiche dell'istanza |
| `agents.defaults.workspace`  | Radice dello spazio di lavoro specifica dell'istanza |
| `gateway.port` (o `--port`)  | Univoca per ogni istanza                           |
| Porte derivate del browser/CDP | Vedi sotto                                       |

La condivisione di una qualsiasi di queste impostazioni causa condizioni di competizione nella configurazione e conflitti tra porte.

## Mappatura delle porte (derivate)

Porta di base = `gateway.port` (oppure `OPENCLAW_GATEWAY_PORT` / `--port`).

- Porta del servizio di controllo del browser = base + 2 (solo local loopback).
- L'host Canvas viene servito direttamente dal server HTTP del Gateway (sulla stessa porta di `gateway.port`).
- Le porte CDP dei profili browser vengono allocate automaticamente da `browser control port + 9` fino a `+ 108`.

Se sostituisci uno qualsiasi di questi valori nella configurazione o nelle variabili d'ambiente, devi mantenerlo univoco per ogni istanza.

## Note su browser/CDP (errore comune)

- **Non** impostare `browser.cdpUrl` sullo stesso valore in più istanze.
- Ogni istanza necessita di una propria porta di controllo del browser e di un proprio intervallo CDP (derivati dalla relativa porta del Gateway).
- Per porte CDP esplicite, imposta `browser.profiles.<name>.cdpPort` per ogni istanza.
- Per un'istanza Chrome remota, usa `browser.profiles.<name>.cdpUrl` (per profilo e per istanza).

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

- `gateway status --deep` rileva i servizi launchd/systemd/schtasks obsoleti provenienti da installazioni precedenti.
- Il testo di avviso di `gateway probe`, come `multiple reachable gateway identities detected`, è previsto solo quando esegui intenzionalmente più Gateway isolati oppure quando OpenClaw non può verificare che le destinazioni di verifica raggiungibili corrispondano allo stesso Gateway. Un tunnel SSH, un URL proxy o un URL remoto configurato verso lo stesso Gateway costituiscono un solo Gateway con più trasporti, anche quando le porte di trasporto sono diverse.

## Contenuti correlati

- [Manuale operativo del Gateway](/it/gateway)
- [Blocco del Gateway](/it/gateway/gateway-lock)
- [Configurazione](/it/gateway/configuration)
