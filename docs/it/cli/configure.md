---
read_when:
    - Vuoi modificare in modo interattivo le credenziali, i dispositivi o le impostazioni predefinite dell'agente
summary: Riferimento CLI per `openclaw configure` (prompt di configurazione interattivi)
title: Configura
x-i18n:
    generated_at: "2026-04-30T08:42:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bde13a139c299879ff13a85c17afdd55dce7ad758418266854428b059d8a05e
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Prompt interattivo per configurare credenziali, dispositivi e valori predefiniti dell'agente.

<Note>
La sezione **Modello** include una selezione multipla per l'elenco consentito `agents.defaults.models` (ciò che appare in `/model` e nel selettore dei modelli). Le scelte di configurazione con ambito del fornitore uniscono i modelli selezionati all'elenco consentito esistente invece di sostituire i fornitori non correlati già presenti nella configurazione. Rieseguire l'autenticazione del fornitore da configure conserva un `agents.defaults.model.primary` esistente. Usa `openclaw models auth login --provider <id> --set-default` o `openclaw models set <model>` quando vuoi intenzionalmente modificare il modello predefinito.
</Note>

Quando configure viene avviato da una scelta di autenticazione del fornitore, i selettori del modello predefinito e dell'elenco consentito preferiscono automaticamente quel fornitore. Per fornitori abbinati come Volcengine e BytePlus, la stessa preferenza corrisponde anche alle loro varianti del piano di programmazione (`volcengine-plan/*`, `byteplus-plan/*`). Se il filtro del fornitore preferito producesse un elenco vuoto, configure torna al catalogo non filtrato invece di mostrare un selettore vuoto.

<Tip>
`openclaw config` senza un sottocomando apre la stessa procedura guidata. Usa `openclaw config get|set|unset` per modifiche non interattive.
</Tip>

Per la ricerca web, `openclaw configure --section web` ti consente di scegliere un fornitore
e configurarne le credenziali. Alcuni fornitori mostrano anche prompt di follow-up
specifici del fornitore:

- **Grok** può offrire la configurazione facoltativa di `x_search` con la stessa `XAI_API_KEY` e
  permetterti di scegliere un modello `x_search`.
- **Kimi** può chiedere la regione dell'API Moonshot (`api.moonshot.ai` rispetto a
  `api.moonshot.cn`) e il modello predefinito di ricerca web Kimi.

Correlati:

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

- La scelta della posizione in cui viene eseguito il Gateway aggiorna sempre `gateway.mode`. Puoi selezionare "Continua" senza altre sezioni se è tutto ciò di cui hai bisogno.
- I servizi orientati ai canali (Slack/Discord/Matrix/Microsoft Teams) richiedono elenchi consentiti di canali/stanze durante la configurazione. Puoi inserire nomi o ID; la procedura guidata risolve i nomi in ID quando possibile.
- Se esegui il passaggio di installazione del daemon, l'autenticazione tramite token richiede un token e `gateway.auth.token` è gestito da SecretRef, configure convalida il SecretRef ma non salva i valori token in testo semplice risolti nei metadati dell'ambiente del servizio supervisor.
- Se l'autenticazione tramite token richiede un token e il SecretRef del token configurato non è risolto, configure blocca l'installazione del daemon con indicazioni di rimedio attuabili.
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
