---
read_when:
    - Vuoi modificare in modo interattivo credenziali, dispositivi o impostazioni predefinite dell'agente
summary: Riferimento CLI per `openclaw configure` (prompt di configurazione interattivi)
title: configure
x-i18n:
    generated_at: "2026-04-23T08:26:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7fedaf1bc5e5c793ed354ff01294808f9b4a266219f8e07799a2545fe5652cf2
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Prompt interattivo per configurare credenziali, dispositivi e impostazioni predefinite dell'agente.

Nota: la sezione **Model** ora include una selezione multipla per l'allowlist
`agents.defaults.models` (ciò che viene mostrato in `/model` e nel selettore dei modelli).
Le scelte di configurazione con ambito provider uniscono i modelli selezionati
all'allowlist esistente invece di sostituire provider non correlati già presenti nella config.

Quando configure viene avviato da una scelta di autenticazione provider, i selettori
del modello predefinito e dell'allowlist preferiscono automaticamente quel provider. Per provider associati come
Volcengine/BytePlus, la stessa preferenza corrisponde anche alle loro varianti
di piano di coding (`volcengine-plan/*`, `byteplus-plan/*`). Se il filtro
del provider preferito produrrebbe un elenco vuoto, configure torna al catalogo
non filtrato invece di mostrare un selettore vuoto.

Suggerimento: `openclaw config` senza un sottocomando apre la stessa procedura guidata. Usa
`openclaw config get|set|unset` per modifiche non interattive.

Per la ricerca web, `openclaw configure --section web` ti consente di scegliere un provider
e configurarne le credenziali. Alcuni provider mostrano anche prompt di follow-up
specifici del provider:

- **Grok** può offrire una configurazione facoltativa di `x_search` con la stessa `XAI_API_KEY` e
  consentirti di scegliere un modello `x_search`.
- **Kimi** può chiedere la regione API Moonshot (`api.moonshot.ai` vs
  `api.moonshot.cn`) e il modello predefinito Kimi per la ricerca web.

Correlati:

- Riferimento alla configurazione del Gateway: [Configuration](/it/gateway/configuration)
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

- La scelta di dove viene eseguito il Gateway aggiorna sempre `gateway.mode`. Puoi selezionare "Continue" senza altre sezioni se è tutto ciò di cui hai bisogno.
- I servizi orientati ai canali (Slack/Discord/Matrix/Microsoft Teams) richiedono durante la configurazione allowlist di canali/stanze. Puoi inserire nomi o ID; la procedura guidata risolve i nomi in ID quando possibile.
- Se esegui il passaggio di installazione del daemon, l'autenticazione token richiede un token e `gateway.auth.token` è gestito come SecretRef, configure convalida il SecretRef ma non rende persistenti i valori token in testo normale risolti nei metadati dell'ambiente del servizio supervisor.
- Se l'autenticazione token richiede un token e il SecretRef del token configurato non è risolto, configure blocca l'installazione del daemon con indicazioni operative per la correzione.
- Se sia `gateway.auth.token` sia `gateway.auth.password` sono configurati e `gateway.auth.mode` non è impostato, configure blocca l'installazione del daemon finché la modalità non viene impostata esplicitamente.

## Esempi

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```
