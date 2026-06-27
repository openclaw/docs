---
read_when:
    - Vuoi modificare in modo interattivo credenziali, dispositivi o impostazioni predefinite degli agenti
summary: Riferimento CLI per `openclaw configure` (prompt di configurazione interattivi)
title: Configura
x-i18n:
    generated_at: "2026-06-27T17:18:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 55178b3d772297686aeead9799b97dd5d836b908baabde1fce7918d38446fcff
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Prompt interattivo per modifiche mirate a una configurazione esistente: credenziali, dispositivi, impostazioni predefinite dell'agente, gateway, canali, Plugin, Skills e controlli di integrità.

Usa `openclaw onboard` per il percorso guidato completo al primo avvio, `openclaw setup` solo per la configurazione/area di lavoro di base e `openclaw channels add` quando ti serve solo configurare un account di canale.

<Note>
La sezione **Modello** include una selezione multipla per l'elenco consentito `agents.defaults.models` (ciò che compare in `/model` e nel selettore di modello). Le scelte di configurazione specifiche del provider uniscono i modelli selezionati all'elenco consentito esistente, invece di sostituire provider non correlati già presenti nella configurazione.

Ripetere l'autenticazione del provider da configure conserva un `agents.defaults.model.primary` esistente, anche quando il passaggio di autenticazione del provider restituisce una patch di configurazione con un proprio modello predefinito consigliato. Questo significa che aggiungere o riautenticare xAI, OpenRouter o un altro provider dovrebbe rendere disponibile il nuovo modello senza sostituire il modello principale corrente. Usa `openclaw models auth login --provider <id> --set-default` o `openclaw models set <model>` quando vuoi cambiare intenzionalmente il modello predefinito.
</Note>

Quando configure parte da una scelta di autenticazione del provider, i selettori del modello predefinito e dell'elenco consentito preferiscono automaticamente quel provider. Per provider abbinati come Volcengine e BytePlus, la stessa preferenza corrisponde anche alle rispettive varianti del piano di codifica (`volcengine-plan/*`, `byteplus-plan/*`). Se il filtro del provider preferito produrrebbe un elenco vuoto, configure ripiega sul catalogo non filtrato invece di mostrare un selettore vuoto.

<Tip>
`openclaw config` senza un sottocomando apre la stessa procedura guidata. Usa `openclaw config get|set|unset` per modifiche non interattive.
</Tip>

Per la ricerca web, `openclaw configure --section web` ti permette di scegliere un provider
e configurarne le credenziali. Alcuni provider mostrano anche prompt di follow-up
specifici del provider:

- **Grok** può offrire una configurazione `x_search` opzionale con lo stesso profilo OAuth xAI
  o la stessa chiave API e permetterti di scegliere un modello `x_search`.
- **Kimi** può richiedere la regione dell'API Moonshot (`api.moonshot.ai` rispetto a
  `api.moonshot.cn`) e il modello predefinito di ricerca web Kimi.

Correlato:

- Riferimento alla configurazione del Gateway: [Configurazione](/it/gateway/configuration)
- CLI di configurazione: [Config](/it/cli/config)

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

- La procedura guidata completa e le sezioni relative al Gateway chiedono dove viene eseguito il Gateway e aggiornano `gateway.mode`. I filtri di sezione che non includono `gateway`, `daemon` o `health` passano direttamente alla configurazione richiesta.
- Dopo le scritture della configurazione locale, configure installa i Plugin scaricabili selezionati quando il percorso di configurazione scelto li richiede. La configurazione del gateway remoto non installa pacchetti Plugin locali.
- I servizi orientati ai canali (Slack/Discord/Matrix/Microsoft Teams) richiedono elenchi consentiti di canali/stanze durante la configurazione. Puoi inserire nomi o ID; la procedura guidata risolve i nomi in ID quando possibile.
- Se esegui il passaggio di installazione del daemon, l'autenticazione tramite token richiede un token e `gateway.auth.token` è gestito da SecretRef, configure convalida il SecretRef ma non mantiene i valori del token in testo semplice risolti nei metadati dell'ambiente del servizio supervisor.
- Se l'autenticazione tramite token richiede un token e il SecretRef del token configurato non è risolto, configure blocca l'installazione del daemon con indicazioni di correzione utilizzabili.
- Se sia `gateway.auth.token` sia `gateway.auth.password` sono configurati e `gateway.auth.mode` non è impostato, configure blocca l'installazione del daemon finché la modalità non viene impostata esplicitamente.

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
