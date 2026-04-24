---
read_when:
    - Vuoi modificare in modo interattivo credenziali, dispositivi o impostazioni predefinite dell'agente
summary: Riferimento CLI per `openclaw configure` (prompt di configurazione interattivi)
title: Configura
x-i18n:
    generated_at: "2026-04-24T08:33:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 822c01f8c0fe9dc4c170f3418bc836b1d18b4713551355b0a18de9e613754dd0
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Prompt interattivo per configurare credenziali, dispositivi e impostazioni predefinite dell'agente.

Nota: la sezione **Model** ora include una selezione multipla per la allowlist
`agents.defaults.models` (ciò che appare in `/model` e nel selettore di modelli).
Le scelte di configurazione con ambito provider uniscono i modelli selezionati alla
allowlist esistente invece di sostituire provider non correlati già presenti nella configurazione.

Quando la configurazione parte da una scelta di autenticazione del provider, i selettori
del modello predefinito e della allowlist danno automaticamente priorità a quel provider. Per provider associati come
Volcengine/BytePlus, la stessa preferenza corrisponde anche alle loro varianti
del piano coding (`volcengine-plan/*`, `byteplus-plan/*`). Se il filtro del provider
preferito produrrebbe un elenco vuoto, configure usa come fallback il catalogo non filtrato invece di mostrare un selettore vuoto.

Suggerimento: `openclaw config` senza un sottocomando apre la stessa procedura guidata. Usa
`openclaw config get|set|unset` per modifiche non interattive.

Per la ricerca web, `openclaw configure --section web` ti consente di scegliere un provider
e configurarne le credenziali. Alcuni provider mostrano anche prompt di follow-up specifici del provider:

- **Grok** può offrire una configurazione facoltativa di `x_search` con la stessa `XAI_API_KEY` e
  consentirti di scegliere un modello `x_search`.
- **Kimi** può chiedere la regione API Moonshot (`api.moonshot.ai` vs
  `api.moonshot.cn`) e il modello di ricerca web Kimi predefinito.

Correlati:

- Riferimento della configurazione del Gateway: [Configurazione](/it/gateway/configuration)
- CLI config: [Config](/it/cli/config)

## Opzioni

- `--section <section>`: filtro di sezione ripetibile

Sezioni disponibili:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

Note:

- Scegliere dove viene eseguito il Gateway aggiorna sempre `gateway.mode`. Puoi selezionare "Continue" senza altre sezioni se è tutto ciò di cui hai bisogno.
- I servizi orientati ai canali (Slack/Discord/Matrix/Microsoft Teams) richiedono allowlist di canali/stanze durante la configurazione. Puoi inserire nomi o ID; la procedura guidata risolve i nomi in ID quando possibile.
- Se esegui il passaggio di installazione del daemon, l'autenticazione tramite token richiede un token e `gateway.auth.token` è gestito con SecretRef; configure convalida il SecretRef ma non rende persistenti valori token in chiaro risolti nei metadati dell'ambiente del servizio supervisor.
- Se l'autenticazione tramite token richiede un token e il SecretRef del token configurato non è risolto, configure blocca l'installazione del daemon con indicazioni pratiche per la risoluzione.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, configure blocca l'installazione del daemon finché la modalità non viene impostata esplicitamente.

## Esempi

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## Correlati

- [Riferimento CLI](/it/cli)
- [Configurazione](/it/gateway/configuration)
