---
read_when:
    - Vuoi modificare in modo interattivo credenziali, dispositivi o i valori predefiniti dell'agente
summary: Riferimento CLI per `openclaw configure` (richieste di configurazione interattive)
title: Configura
x-i18n:
    generated_at: "2026-05-01T08:28:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 437a6ec43a48611bf08bdeb0a6e692581c488fac283f0104b172088db37949bb
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Prompt interattivo per configurare credenziali, dispositivi e impostazioni predefinite degli agenti.

<Note>
La sezione **Modello** include una selezione multipla per l'elenco consentito `agents.defaults.models` (ciò che viene mostrato in `/model` e nel selettore dei modelli). Le scelte di configurazione con ambito provider uniscono i modelli selezionati all'elenco consentito esistente invece di sostituire provider non correlati già presenti nella configurazione. Rieseguire l'autenticazione del provider da configure preserva un valore `agents.defaults.model.primary` esistente. Usa `openclaw models auth login --provider <id> --set-default` o `openclaw models set <model>` quando vuoi cambiare intenzionalmente il modello predefinito.
</Note>

Quando configure viene avviato da una scelta di autenticazione del provider, i selettori del modello predefinito e dell'elenco consentito preferiscono automaticamente quel provider. Per provider abbinati come Volcengine e BytePlus, la stessa preferenza corrisponde anche alle loro varianti di piano di coding (`volcengine-plan/*`, `byteplus-plan/*`). Se il filtro del provider preferito produrrebbe un elenco vuoto, configure ripiega sul catalogo non filtrato invece di mostrare un selettore vuoto.

<Tip>
`openclaw config` senza sottocomando apre la stessa procedura guidata. Usa `openclaw config get|set|unset` per modifiche non interattive.
</Tip>

Per la ricerca web, `openclaw configure --section web` ti consente di scegliere un provider
e configurarne le credenziali. Alcuni provider mostrano anche prompt successivi
specifici del provider:

- **Grok** può offrire la configurazione opzionale di `x_search` con la stessa `XAI_API_KEY` e
  consentirti di scegliere un modello `x_search`.
- **Kimi** può chiedere la regione dell'API Moonshot (`api.moonshot.ai` vs
  `api.moonshot.cn`) e il modello di ricerca web Kimi predefinito.

Correlati:

- Riferimento di configurazione del Gateway: [Configurazione](/it/gateway/configuration)
- CLI di configurazione: [Configurazione](/it/cli/config)

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

- La scelta di dove viene eseguito il Gateway aggiorna sempre `gateway.mode`. Puoi selezionare "Continua" senza altre sezioni se è tutto ciò di cui hai bisogno.
- Dopo le scritture della configurazione locale, configure materializza le dipendenze di runtime dei Plugin in bundle appena richieste. Questo è un passaggio ristretto di riparazione del gestore di pacchetti, non un'esecuzione completa di `openclaw doctor`. La configurazione del Gateway remoto non installa dipendenze locali dei Plugin.
- I servizi orientati ai canali (Slack/Discord/Matrix/Microsoft Teams) richiedono elenchi consentiti di canali/stanze durante la configurazione. Puoi inserire nomi o ID; la procedura guidata risolve i nomi in ID quando possibile.
- Se esegui il passaggio di installazione del daemon, l'autenticazione tramite token richiede un token, e `gateway.auth.token` è gestito da SecretRef, configure convalida il SecretRef ma non persiste i valori del token in testo normale risolti nei metadati dell'ambiente del servizio supervisor.
- Se l'autenticazione tramite token richiede un token e il SecretRef del token configurato non è risolto, configure blocca l'installazione del daemon con indicazioni operative per la correzione.
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
