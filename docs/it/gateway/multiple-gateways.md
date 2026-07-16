---
read_when:
    - Esecuzione di più Gateway sulla stessa macchina
    - Sono necessari configurazione, stato e porte isolati per ciascun Gateway
summary: Eseguire più Gateway OpenClaw su un unico host (isolamento, porte e profili)
title: Più gateway
x-i18n:
    generated_at: "2026-07-16T14:22:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 655fa865a98064d7c017a7c2eb08ea9a9683002d96a3dbe45a8c16cbd3c86ba1
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

La maggior parte delle configurazioni richiede un solo Gateway: un singolo Gateway gestisce più connessioni di messaggistica e agenti. Eseguire Gateway separati con profili/porte isolati solo quando è necessario un isolamento più forte o una ridondanza (ad esempio, un bot di soccorso).

## Avvio rapido del bot di soccorso

La configurazione più semplice per un bot di soccorso:

- Mantenere il bot principale nel profilo predefinito.
- Eseguire il bot di soccorso su `--profile rescue`, con un token bot Telegram dedicato.
- Assegnare al bot di soccorso una porta di base diversa, ad esempio `19789`.

In questo modo, il bot di soccorso può eseguire il debug o applicare modifiche alla configurazione se il bot principale non è disponibile. Lasciare almeno 20 porte tra le porte di base, affinché le porte derivate del browser/CDP non entrino mai in conflitto.

```bash
# Bot di soccorso (bot Telegram separato, profilo separato, porta 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Se il bot principale è già in esecuzione, in genere non serve altro. Se l'onboarding ha già installato il servizio di soccorso, saltare il comando finale `gateway install`.

Durante `openclaw --profile rescue onboard`:

- Utilizzare un token bot Telegram separato, dedicato all'account di soccorso (facile da riservare agli operatori, indipendente dall'installazione del canale/app del bot principale e semplice percorso di ripristino basato sui messaggi diretti).
- Mantenere il nome del profilo `rescue`.
- Utilizzare una porta di base superiore di almeno 20 rispetto a quella del bot principale.
- Accettare lo spazio di lavoro di soccorso predefinito, a meno che non se ne gestisca già uno autonomamente.

### Cosa modifica `--profile rescue onboard`

`--profile rescue onboard` esegue il normale flusso di onboarding, ma scrive tutto in un profilo separato, così il bot di soccorso dispone di propri:

- File di profilo/configurazione
- Directory di stato
- Spazio di lavoro (predefinito: `~/.openclaw/workspace-rescue`)
- Nome del servizio gestito
- Porta di base (oltre alle porte derivate)
- Token bot Telegram

Per il resto, le richieste sono identiche a quelle del normale onboarding.

## Configurazione generale con più Gateway

Lo stesso schema di isolamento funziona per qualsiasi coppia o gruppo di Gateway su un unico host: assegnare a ogni Gateway aggiuntivo un profilo denominato e una porta di base dedicati:

```bash
# principale (profilo predefinito)
openclaw setup
openclaw gateway --port 18789

# gateway aggiuntivo
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

È anche possibile utilizzare profili denominati per entrambi:

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

Utilizzare l'avvio rapido del bot di soccorso per un canale operativo di riserva; utilizzare lo schema generale dei profili per più Gateway a lunga esecuzione su canali, tenant, spazi di lavoro o ruoli operativi diversi.

## Lista di controllo dell'isolamento

Mantenere univoci questi elementi per ogni istanza del Gateway:

| Impostazione                      | Scopo                              |
| ---------------------------- | ------------------------------------ |
| `OPENCLAW_CONFIG_PATH`       | File di configurazione per istanza             |
| `OPENCLAW_STATE_DIR`         | Sessioni, credenziali e cache per istanza |
| `agents.defaults.workspace`  | Radice dello spazio di lavoro per istanza          |
| `gateway.port` (o `--port`) | Univoca per ogni istanza                  |
| Porte derivate del browser/CDP    | Vedere sotto                            |

La condivisione di uno qualsiasi di questi elementi causa conflitti di configurazione, stato o porte. L'avvio del Gateway
impone che ogni directory di stato abbia un proprietario univoco, anche quando
`OPENCLAW_ALLOW_MULTI_GATEWAY=1` ignora l'istanza singola per configurazione.

## Mappatura delle porte (derivate)

Porta di base = `gateway.port` (o `OPENCLAW_GATEWAY_PORT` / `--port`).

- Porta del servizio di controllo del browser = base + 2 (solo loopback).
- L'host Canvas viene servito sul server HTTP del Gateway stesso (stessa porta di `gateway.port`).
- Le porte CDP del profilo del browser vengono allocate automaticamente da `browser control port + 9` a `+ 108`.

Se uno qualsiasi di questi valori viene sovrascritto nella configurazione o nell'ambiente, deve rimanere univoco per ogni istanza.

## Note su browser/CDP (errore comune)

- **Non** impostare `browser.cdpUrl` sullo stesso valore per più istanze.
- Ogni istanza richiede una porta di controllo del browser e un intervallo CDP propri (derivati dalla relativa porta del Gateway).
- Per porte CDP esplicite, impostare `browser.profiles.<name>.cdpPort` per ogni istanza.
- Per Chrome remoto, utilizzare `browser.profiles.<name>.cdpUrl` (per profilo e per istanza).

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
- Il testo di avviso di `gateway probe`, come `multiple reachable gateway identities detected`, è previsto solo quando si eseguono intenzionalmente più Gateway isolati oppure quando OpenClaw non può verificare che le destinazioni di probe raggiungibili corrispondano allo stesso Gateway. Un tunnel SSH, un URL proxy o un URL remoto configurato verso lo stesso Gateway rappresentano un unico Gateway con più trasporti, anche quando le porte di trasporto sono diverse.

## Argomenti correlati

- [Manuale operativo del Gateway](/it/gateway)
- [Blocco del Gateway](/it/gateway/gateway-lock)
- [Configurazione](/it/gateway/configuration)
