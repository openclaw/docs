---
read_when:
    - Esecuzione di più Gateway sulla stessa macchina
    - È necessario isolare configurazione/stato/porte per ogni Gateway
summary: Eseguire più Gateway OpenClaw su un unico host (isolamento, porte e profili)
title: Gateway multipli
x-i18n:
    generated_at: "2026-04-30T08:53:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 655f9ea5100813d5836f24eb47a5646443f83d70953efa64122633a5a1341002
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

La maggior parte delle configurazioni dovrebbe usare un solo Gateway, perché un singolo Gateway può gestire più connessioni di messaggistica e agenti. Se hai bisogno di un isolamento o di una ridondanza maggiori (ad es. un bot di soccorso), esegui Gateway separati con profili/porte isolati.

## Configurazione consigliata migliore

Per la maggior parte degli utenti, la configurazione più semplice del bot di soccorso è:

- mantenere il bot principale sul profilo predefinito
- eseguire il bot di soccorso su `--profile rescue`
- usare un bot Telegram completamente separato per l'account di soccorso
- mantenere il bot di soccorso su una porta base diversa, ad esempio `19789`

Questo mantiene il bot di soccorso isolato dal bot principale, così può eseguire debug o applicare
modifiche alla configurazione se il bot primario non funziona. Lascia almeno 20 porte tra
le porte base, così le porte derivate di browser/canvas/CDP non entrano mai in conflitto.

## Avvio rapido del bot di soccorso

Usa questo come percorso predefinito, a meno che tu non abbia un motivo valido per fare
qualcos'altro:

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Se il tuo bot principale è già in esecuzione, di solito è tutto ciò che ti serve.

Durante `openclaw --profile rescue onboard`:

- usa il token del bot Telegram separato
- mantieni il profilo `rescue`
- usa una porta base almeno 20 più alta rispetto al bot principale
- accetta lo spazio di lavoro di soccorso predefinito, a meno che tu non ne gestisca già uno personalmente

Se l'onboarding ha già installato il servizio di soccorso per te, il comando finale
`gateway install` non è necessario.

## Perché funziona

Il bot di soccorso rimane indipendente perché ha i propri:

- profilo/configurazione
- directory di stato
- spazio di lavoro
- porta base (più porte derivate)
- token del bot Telegram

Per la maggior parte delle configurazioni, usa un bot Telegram completamente separato per il profilo di soccorso:

- facile da mantenere riservato solo agli operatori
- token e identità del bot separati
- indipendente dall'installazione del canale/app del bot principale
- semplice percorso di recupero basato su DM quando il bot principale è guasto

## Cosa cambia `--profile rescue onboard`

`openclaw --profile rescue onboard` usa il normale flusso di onboarding, ma
scrive tutto in un profilo separato.

In pratica, ciò significa che il bot di soccorso ottiene i propri:

- file di configurazione
- directory di stato
- spazio di lavoro (per impostazione predefinita `~/.openclaw/workspace-rescue`)
- nome del servizio gestito

Per il resto, i prompt sono gli stessi del normale onboarding.

## Configurazione multi-Gateway generale

Il layout del bot di soccorso sopra è il predefinito più semplice, ma lo stesso modello di isolamento
funziona per qualsiasi coppia o gruppo di Gateway su un host.

Per una configurazione più generale, assegna a ogni Gateway aggiuntivo un profilo con nome e la
propria porta base:

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
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

I servizi seguono lo stesso modello:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Usa l'avvio rapido del bot di soccorso quando vuoi una corsia operatore di fallback. Usa il
modello generale dei profili quando vuoi più Gateway di lunga durata per
canali, tenant, spazi di lavoro o ruoli operativi diversi.

## Checklist di isolamento

Mantieni questi elementi univoci per ogni istanza di Gateway:

- `OPENCLAW_CONFIG_PATH` — file di configurazione per istanza
- `OPENCLAW_STATE_DIR` — sessioni, credenziali e cache per istanza
- `agents.defaults.workspace` — radice dello spazio di lavoro per istanza
- `gateway.port` (o `--port`) — univoca per istanza
- porte derivate di browser/canvas/CDP

Se questi elementi sono condivisi, incontrerai race nella configurazione e conflitti di porte.

## Mappatura delle porte (derivata)

Porta base = `gateway.port` (o `OPENCLAW_GATEWAY_PORT` / `--port`).

- porta del servizio di controllo del browser = base + 2 (solo loopback)
- l'host canvas viene servito sul server HTTP del Gateway (stessa porta di `gateway.port`)
- le porte CDP del profilo browser vengono allocate automaticamente da `browser.controlPort + 9 .. + 108`

Se sovrascrivi uno qualsiasi di questi valori nella configurazione o nell'ambiente, devi mantenerli univoci per istanza.

## Note su browser/CDP (errore comune)

- **Non** fissare `browser.cdpUrl` agli stessi valori su più istanze.
- Ogni istanza richiede la propria porta di controllo del browser e il proprio intervallo CDP (derivati dalla sua porta Gateway).
- Se hai bisogno di porte CDP esplicite, imposta `browser.profiles.<name>.cdpPort` per istanza.
- Chrome remoto: usa `browser.profiles.<name>.cdpUrl` (per profilo, per istanza).

## Esempio di env manuale

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

- `gateway status --deep` aiuta a rilevare servizi launchd/systemd/schtasks obsoleti da installazioni precedenti.
- il testo di avviso di `gateway probe`, ad esempio `multiple reachable gateways detected`, è previsto solo quando esegui intenzionalmente più di un gateway isolato.

## Correlati

- [Runbook del Gateway](/it/gateway)
- [Blocco del Gateway](/it/gateway/gateway-lock)
- [Configurazione](/it/gateway/configuration)
