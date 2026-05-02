---
read_when:
    - Vuoi modificare in modo interattivo le credenziali, i dispositivi o le impostazioni predefinite dell'agente
summary: Riferimento CLI per `openclaw configure` (richieste di configurazione interattive)
title: Configura
x-i18n:
    generated_at: "2026-05-02T08:17:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16e45fdead5e8026e8d359a09c799fb1248226a9425fcd9ff956d165b880663d
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Prompt interattivo per configurare credenziali, dispositivi e impostazioni predefinite degli agenti.

<Note>
La sezione **Modello** include una selezione multipla per la allowlist `agents.defaults.models` (ciò che compare in `/model` e nel selettore dei modelli). Le scelte di configurazione specifiche del provider uniscono i modelli selezionati alla allowlist esistente invece di sostituire i provider non correlati già presenti nella configurazione.

Eseguire di nuovo l'autenticazione del provider da configure conserva un `agents.defaults.model.primary` esistente, anche quando il passaggio di autenticazione del provider restituisce una patch di configurazione con un proprio modello predefinito consigliato. Questo significa che aggiungere o autenticare di nuovo xAI, OpenRouter o un altro provider dovrebbe rendere disponibile il nuovo modello senza prendere il posto del modello primario corrente. Usa `openclaw models auth login --provider <id> --set-default` o `openclaw models set <model>` quando vuoi intenzionalmente cambiare il modello predefinito.
</Note>

Quando configure viene avviato da una scelta di autenticazione del provider, i selettori del modello predefinito e della allowlist preferiscono automaticamente quel provider. Per provider associati come Volcengine e BytePlus, la stessa preferenza corrisponde anche alle loro varianti coding-plan (`volcengine-plan/*`, `byteplus-plan/*`). Se il filtro del provider preferito produrrebbe un elenco vuoto, configure ripiega sul catalogo non filtrato invece di mostrare un selettore vuoto.

<Tip>
`openclaw config` senza sottocomando apre la stessa procedura guidata. Usa `openclaw config get|set|unset` per modifiche non interattive.
</Tip>

Per la ricerca web, `openclaw configure --section web` ti consente di scegliere un provider
e configurarne le credenziali. Alcuni provider mostrano anche prompt di follow-up
specifici del provider:

- **Grok** può offrire la configurazione facoltativa di `x_search` con la stessa `XAI_API_KEY` e
  consentirti di scegliere un modello `x_search`.
- **Kimi** può chiedere la regione dell'API Moonshot (`api.moonshot.ai` rispetto a
  `api.moonshot.cn`) e il modello predefinito di ricerca web Kimi.

Correlati:

- Riferimento configurazione Gateway: [Configurazione](/it/gateway/configuration)
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

- Scegliere dove viene eseguito il Gateway aggiorna sempre `gateway.mode`. Puoi selezionare "Continua" senza altre sezioni se è tutto ciò di cui hai bisogno.
- Dopo le scritture della configurazione locale, configure installa i plugin scaricabili selezionati quando il percorso di configurazione scelto li richiede. La configurazione del gateway remoto non installa pacchetti plugin locali.
- I servizi orientati ai canali (Slack/Discord/Matrix/Microsoft Teams) richiedono allowlist di canali/stanze durante la configurazione. Puoi inserire nomi o ID; la procedura guidata risolve i nomi in ID quando possibile.
- Se esegui il passaggio di installazione del daemon, l'autenticazione tramite token richiede un token e `gateway.auth.token` è gestito da SecretRef, configure convalida il SecretRef ma non rende persistenti i valori del token in testo semplice risolti nei metadati dell'ambiente del servizio supervisor.
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
