---
read_when:
    - Vuoi modificare in modo interattivo le credenziali, i dispositivi o le impostazioni predefinite dell’agente
summary: Riferimento CLI per `openclaw configure` (richieste interattive di configurazione)
title: Configura
x-i18n:
    generated_at: "2026-07-12T06:55:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6001ea712ee4db3f7bdc2db784a9df2e3f15a8360890b69aec2ea67694c3514b
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Prompt interattivi per apportare modifiche mirate a una configurazione esistente: credenziali, dispositivi, valori predefiniti degli agenti, Gateway, canali, plugin, Skills e controlli di integrità.

Usa `openclaw onboard` o `openclaw setup` per l'intera procedura guidata del primo avvio, `openclaw setup --baseline` solo per la configurazione e lo spazio di lavoro di base e `openclaw channels add` quando devi configurare soltanto l'account di un canale.

<Tip>
`openclaw config` senza sottocomandi apre la stessa procedura guidata. Usa `openclaw config get|set|unset` per le modifiche non interattive.
</Tip>

## Opzioni

`--section <section>`: filtro ripetibile per sezione. Sezioni disponibili:

`workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

Se selezioni `gateway`, `daemon` o `health` (oppure esegui l'intera procedura guidata senza `--section`), viene chiesto dove viene eseguito il Gateway e viene aggiornato `gateway.mode`. I filtri di sezione che escludono tutte e tre queste sezioni passano direttamente alla configurazione richiesta senza chiedere la modalità del Gateway. Se scegli la modalità Gateway remoto, la configurazione remota viene scritta e il programma termina immediatamente; non vengono eseguiti passaggi esclusivamente locali, come l'installazione dei plugin.

<Note>
`openclaw configure` richiede un terminale interattivo (sia stdin sia stdout devono essere TTY). In assenza di un terminale interattivo, visualizza i comandii non interattivi equivalenti `openclaw config get|set|patch|validate` e termina con un errore, anziché eseguire solo una parte della procedura.
</Note>

## Sezione del modello

<Note>
**Modello** include una selezione multipla per l'elenco consentito `agents.defaults.models` (ciò che appare in `/model` e nel selettore dei modelli). Le opzioni di configurazione specifiche del provider uniscono i modelli selezionati all'elenco consentito esistente, anziché sostituire i provider non correlati già presenti nella configurazione.

Ripetere l'autenticazione del provider da configure preserva un valore `agents.defaults.model.primary` esistente, anche quando il passaggio di autenticazione del provider restituisce una patch di configurazione con un proprio modello predefinito consigliato. L'aggiunta o la nuova autenticazione di un provider rende disponibili i relativi modelli senza sostituire il modello primario corrente. Usa `openclaw models auth login --provider <id> --set-default` o `openclaw models set <model>` per cambiare intenzionalmente il modello predefinito.
</Note>

Quando configure viene avviato da una scelta di autenticazione del provider, i selettori del modello predefinito e dell'elenco consentito danno automaticamente la priorità a tale provider. Per provider abbinati come Volcengine e BytePlus, la stessa preferenza corrisponde anche alle rispettive varianti del piano di programmazione (`volcengine-plan/*`, `byteplus-plan/*`). Se il filtro del provider preferito producesse un elenco vuoto, configure usa il catalogo non filtrato anziché mostrare un selettore vuoto.

## Sezione Web

`openclaw configure --section web` seleziona un provider di ricerca sul Web e ne configura le credenziali. Alcuni provider mostrano passaggi successivi specifici:

- **Grok** può offrire la configurazione facoltativa di `x_search` con lo stesso profilo OAuth xAI o la stessa chiave API e consentire di scegliere un modello `x_search`.
- **Kimi** può chiedere la regione dell'API Moonshot (`api.moonshot.ai` oppure `api.moonshot.cn`) e il modello predefinito di Kimi per la ricerca sul Web.

## Altre note

- Dopo aver scritto la configurazione locale, configure installa i plugin scaricabili selezionati quando il percorso di configurazione scelto lo richiede. La configurazione del Gateway remoto non installa pacchetti di plugin locali.
- Durante la configurazione, i servizi orientati ai canali (Slack/Discord/Matrix/Microsoft Teams) richiedono gli elenchi consentiti di canali/stanze. Puoi inserire nomi o ID; quando possibile, la procedura guidata converte i nomi in ID.
- Se esegui il passaggio di installazione del daemon, l'autenticazione tramite token richiede un token. Se `gateway.auth.token` è gestito tramite SecretRef, configure convalida SecretRef ma non salva i valori risolti del token in testo semplice nei metadati dell'ambiente del servizio supervisore; se SecretRef non può essere risolto, configure blocca l'installazione del daemon e fornisce indicazioni operative per risolvere il problema.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, configure blocca l'installazione del daemon finché non imposti esplicitamente la modalità.

## Argomenti correlati

- [Riferimento della CLI](/it/cli)
- [Configurazione](/it/gateway/configuration)
- CLI di configurazione: [Configurazione](/it/cli/config)
