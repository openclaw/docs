---
read_when:
    - Vuoi modificare in modo interattivo credenziali, dispositivi o impostazioni predefinite degli agenti
summary: Riferimento CLI per `openclaw configure` (prompt di configurazione interattivi)
title: Configura
x-i18n:
    generated_at: "2026-05-10T19:27:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: aba5320fefb856c208405511619fc1a4314e3f5e3990f221e987a03d692189fb
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Prompt interattivo per modifiche mirate a una configurazione esistente: credenziali, dispositivi, impostazioni predefinite degli agenti, Gateway, canali, plugin, Skills e controlli di integrità.

Usa `openclaw onboard` per il percorso completo guidato di primo avvio, `openclaw setup` solo per la configurazione/area di lavoro di base e `openclaw channels add` quando ti serve soltanto configurare l'account del canale.

<Note>
La sezione **Model** include una selezione multipla per la allowlist `agents.defaults.models` (ciò che viene visualizzato in `/model` e nel selettore di modelli). Le scelte di configurazione con ambito provider uniscono i modelli selezionati alla allowlist esistente invece di sostituire provider non correlati già presenti nella configurazione.

La riesecuzione dell'autenticazione del provider da configure conserva un `agents.defaults.model.primary` esistente, anche quando il passaggio di autenticazione del provider restituisce una patch di configurazione con il proprio modello predefinito consigliato. Ciò significa che aggiungere o riautenticare xAI, OpenRouter o un altro provider dovrebbe rendere disponibile il nuovo modello senza sostituire il tuo modello primario corrente. Usa `openclaw models auth login --provider <id> --set-default` o `openclaw models set <model>` quando vuoi intenzionalmente cambiare il modello predefinito.
</Note>

Quando configure viene avviato da una scelta di autenticazione del provider, i selettori del modello predefinito e della allowlist preferiscono automaticamente quel provider. Per provider accoppiati come Volcengine e BytePlus, la stessa preferenza corrisponde anche alle loro varianti di piano di codifica (`volcengine-plan/*`, `byteplus-plan/*`). Se il filtro del provider preferito producesse un elenco vuoto, configure ripiega sul catalogo non filtrato invece di mostrare un selettore vuoto.

<Tip>
`openclaw config` senza un sottocomando apre la stessa procedura guidata. Usa `openclaw config get|set|unset` per modifiche non interattive.
</Tip>

Per la ricerca web, `openclaw configure --section web` ti consente di scegliere un provider
e configurarne le credenziali. Alcuni provider mostrano anche prompt successivi
specifici del provider:

- **Grok** può offrire la configurazione facoltativa di `x_search` con la stessa `XAI_API_KEY` e
  consentirti di scegliere un modello `x_search`.
- **Kimi** può chiedere l'area dell'API Moonshot (`api.moonshot.ai` rispetto a
  `api.moonshot.cn`) e il modello di ricerca web Kimi predefinito.

Correlati:

- Riferimento di configurazione del Gateway: [Configuration](/it/gateway/configuration)
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

- La scelta di dove viene eseguito il Gateway aggiorna sempre `gateway.mode`. Puoi selezionare "Continua" senza altre sezioni se è tutto ciò che ti serve.
- Dopo le scritture della configurazione locale, configure installa i plugin scaricabili selezionati quando il percorso di configurazione scelto li richiede. La configurazione del Gateway remoto non installa pacchetti plugin locali.
- I servizi orientati ai canali (Slack/Discord/Matrix/Microsoft Teams) richiedono allowlist di canali/stanze durante la configurazione. Puoi inserire nomi o ID; la procedura guidata risolve i nomi in ID quando possibile.
- Se esegui il passaggio di installazione del daemon, l'autenticazione con token richiede un token e `gateway.auth.token` è gestito da SecretRef, configure convalida il SecretRef ma non persiste i valori del token in chiaro risolti nei metadati dell'ambiente del servizio supervisor.
- Se l'autenticazione con token richiede un token e il SecretRef del token configurato non è risolto, configure blocca l'installazione del daemon con indicazioni di correzione utilizzabili.
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
- [Configuration](/it/gateway/configuration)
