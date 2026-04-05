---
read_when:
    - Vuoi modificare in modo interattivo credenziali, dispositivi o valori predefiniti dell'agente
summary: Riferimento CLI per `openclaw configure` (prompt di configurazione interattivi)
title: configure
x-i18n:
    generated_at: "2026-04-05T13:47:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 989569fdb8e1b31ce3438756b3ed9bf18e0c8baf611c5981643ba5925459c98f
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Prompt interattivo per configurare credenziali, dispositivi e valori predefiniti dell'agente.

Nota: la sezione **Model** ora include una selezione multipla per la allowlist `agents.defaults.models` (ciò che appare in `/model` e nel selettore dei modelli).

Quando la configurazione inizia da una scelta di autenticazione del provider, i selettori del modello predefinito e della allowlist preferiscono automaticamente quel provider. Per provider associati come Volcengine/BytePlus, la stessa preferenza corrisponde anche alle loro varianti coding-plan (`volcengine-plan/*`, `byteplus-plan/*`). Se il filtro del provider preferito producesse un elenco vuoto, la configurazione torna al catalogo non filtrato invece di mostrare un selettore vuoto.

Suggerimento: `openclaw config` senza un sottocomando apre la stessa procedura guidata. Usa `openclaw config get|set|unset` per modifiche non interattive.

Per la ricerca web, `openclaw configure --section web` ti consente di scegliere un provider e configurarne le credenziali. Alcuni provider mostrano anche prompt di follow-up specifici del provider:

- **Grok** può offrire una configurazione facoltativa di `x_search` con la stessa `XAI_API_KEY` e consentirti di scegliere un modello `x_search`.
- **Kimi** può chiedere la regione API Moonshot (`api.moonshot.ai` vs `api.moonshot.cn`) e il modello predefinito di ricerca web Kimi.

Correlati:

- Riferimento della configurazione del Gateway: [Configuration](/gateway/configuration)
- CLI di configurazione: [Config](/cli/config)

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

- La scelta di dove eseguire il Gateway aggiorna sempre `gateway.mode`. Puoi selezionare "Continue" senza altre sezioni se è tutto ciò di cui hai bisogno.
- I servizi orientati ai canali (Slack/Discord/Matrix/Microsoft Teams) richiedono allowlist di canali/stanze durante la configurazione. Puoi inserire nomi o ID; la procedura guidata risolve i nomi in ID quando possibile.
- Se esegui il passaggio di installazione del daemon, l'autenticazione tramite token richiede un token e, se `gateway.auth.token` è gestito da SecretRef, la configurazione valida il SecretRef ma non rende persistenti i valori di token in chiaro risolti nei metadati dell'ambiente del servizio supervisor.
- Se l'autenticazione tramite token richiede un token e il SecretRef del token configurato non è risolto, la configurazione blocca l'installazione del daemon con indicazioni pratiche per la risoluzione.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, la configurazione blocca l'installazione del daemon finché la modalità non viene impostata esplicitamente.

## Esempi

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```
