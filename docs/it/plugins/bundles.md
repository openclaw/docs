---
read_when:
    - Vuoi installare un pacchetto compatibile con Codex, Claude o Cursor
    - Devi capire come OpenClaw associa i contenuti del pacchetto alle funzionalità native
    - Stai eseguendo il debug del rilevamento dei bundle o di funzionalità mancanti
summary: Installa e usa i bundle Codex, Claude e Cursor come plugin di OpenClaw
title: Bundle di Plugin
x-i18n:
    generated_at: "2026-07-12T07:15:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d44006866238f53ee2e3e8126cc4f7ed6f7413534257775f7904c9b877778c59
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw può installare plugin da tre ecosistemi esterni: **Codex**, **Claude**
e **Cursor**. Questi sono chiamati **bundle**, ovvero pacchetti di contenuti e metadati che
OpenClaw mappa in funzionalità native come Skills, hook e strumenti MCP.

<Info>
  I bundle **non** sono equivalenti ai plugin nativi di OpenClaw. I plugin nativi vengono eseguiti
  nello stesso processo e possono registrare qualsiasi funzionalità. I bundle sono pacchetti di contenuti con
  una mappatura selettiva delle funzionalità e un perimetro di attendibilità più ristretto.
</Info>

## Perché esistono i bundle

Molti plugin utili sono pubblicati nel formato Codex, Claude o Cursor. Anziché
richiedere agli autori di riscriverli come plugin nativi di OpenClaw, OpenClaw
rileva questi formati e mappa i contenuti supportati nell'insieme di funzionalità
native. È possibile installare un pacchetto di comandi Claude o un bundle di Skills Codex e utilizzarlo
immediatamente.

## Installare un bundle

<Steps>
  <Step title="Installa da una directory, un archivio o un marketplace">
    ```bash
    # Directory locale
    openclaw plugins install ./my-bundle

    # Archivio
    openclaw plugins install ./my-bundle.tgz

    # Marketplace Claude
    openclaw plugins marketplace list <source>
    openclaw plugins install <plugin> --marketplace <source>
    ```

    `<source>` è un percorso/repository di marketplace locale oppure un'origine git/GitHub.

  </Step>

  <Step title="Verifica il rilevamento">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    I bundle mostrano `Format: bundle` insieme a un valore `Bundle format:` pari a `codex`,
    `claude` o `cursor`.

  </Step>

  <Step title="Riavvia e utilizza">
    ```bash
    openclaw gateway restart
    ```

    Le funzionalità mappate (Skills, hook, strumenti MCP, impostazioni predefinite LSP) sono disponibili nella sessione successiva.

  </Step>
</Steps>

## Cosa mappa OpenClaw dai bundle

Attualmente non tutte le funzionalità dei bundle vengono eseguite in OpenClaw. Di seguito sono indicate quelle operative e quelle
rilevate ma non ancora collegate.

### Attualmente supportate

| Funzionalità        | Modalità di mappatura                                                                                             | Si applica a        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------- |
| Contenuti delle Skills | Le radici delle Skills del bundle vengono caricate come normali Skills di OpenClaw                                | Tutti i formati     |
| Comandi             | `commands/` e `.cursor/commands/` vengono trattate come radici delle Skills                                       | Claude, Cursor      |
| Pacchetti di hook   | Strutture in stile OpenClaw con `HOOK.md` + `handler.ts`                                                          | Codex               |
| Strumenti MCP       | La configurazione MCP del bundle viene unita alle impostazioni integrate di OpenClaw; vengono caricati i server stdio e HTTP supportati | Tutti i formati |
| Server LSP          | Il file `.lsp.json` di Claude e i percorsi `lspServers` dichiarati nel manifesto vengono uniti alle impostazioni predefinite LSP integrate di OpenClaw | Claude |
| Impostazioni        | Il file `settings.json` di Claude viene importato come impostazioni predefinite integrate di OpenClaw             | Claude              |

#### Contenuti delle Skills

- Le radici delle Skills del bundle vengono caricate come normali radici delle Skills di OpenClaw.
- Le radici `commands/` di Claude vengono trattate come radici aggiuntive delle Skills.
- Le radici `.cursor/commands/` di Cursor vengono trattate come radici aggiuntive delle Skills.

I file di comando Markdown di Claude e quelli di Cursor funzionano entrambi tramite il
normale caricatore delle Skills di OpenClaw.

#### Pacchetti di hook

Le radici degli hook dei bundle funzionano **solo** quando utilizzano la normale
struttura dei pacchetti di hook di OpenClaw: `HOOK.md` insieme a `handler.ts` o `handler.js`. Attualmente ciò riguarda principalmente
il caso compatibile con Codex.

#### MCP per OpenClaw integrato

- I bundle abilitati possono fornire la configurazione dei server MCP.
- OpenClaw unisce la configurazione MCP del bundle alle impostazioni effettive di OpenClaw
  integrato come `mcpServers`.
- OpenClaw espone gli strumenti MCP supportati del bundle durante i turni dell'agente OpenClaw
  integrato avviando server stdio o connettendosi a server HTTP.
- I profili degli strumenti `coding` e `messaging` includono per impostazione predefinita gli strumenti MCP
  dei bundle; utilizzare `tools.deny: ["bundle-mcp"]` per escluderli per un agente o un Gateway.
- Le impostazioni locali del progetto per l'agente integrato vengono comunque applicate dopo le impostazioni predefinite del bundle, pertanto
  le impostazioni dell'area di lavoro possono sovrascrivere le voci MCP del bundle quando necessario.
- I cataloghi degli strumenti MCP dei bundle vengono ordinati in modo deterministico prima della registrazione, affinché
  le modifiche a monte nell'ordine di `listTools()` non alterino continuamente i blocchi degli strumenti nella cache dei prompt.

##### Trasporti

I server MCP possono utilizzare il trasporto stdio o HTTP.

**Stdio** avvia un processo figlio:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP** si connette a un server MCP in esecuzione, utilizzando per impostazione predefinita `sse`, salvo quando
viene richiesto `streamable-http`:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- `transport` accetta `"streamable-http"` o `"sse"`; se omesso, il valore predefinito è `sse`.
- `type: "http"` è una struttura a valle nativa della CLI; nella configurazione di OpenClaw utilizzare `transport: "streamable-http"`. `openclaw mcp set` e `openclaw doctor --fix` normalizzano l'alias comune.
- Sono consentiti solo gli schemi URL `http:` e `https:`.
- I valori di `headers` supportano l'interpolazione `${ENV_VAR}`.
- Una voce server contenente sia `command` sia `url` viene rifiutata.
- Le credenziali presenti nell'URL (informazioni utente e parametri di query) vengono oscurate nelle descrizioni degli strumenti
  e nei registri.
- `connectionTimeoutMs` sostituisce il timeout di connessione predefinito di 30 secondi per
  entrambi i trasporti stdio e HTTP. Il timeout predefinito delle richieste è di 60 secondi e
  può essere sostituito con `requestTimeoutMs`.

##### Denominazione degli strumenti

OpenClaw registra gli strumenti MCP dei bundle con nomi compatibili con i provider nel formato
`serverName__toolName`. Ad esempio, un server identificato dalla chiave `"vigil-harbor"` che espone uno
strumento `memory_search` viene registrato come `vigil-harbor__memory_search`.

- I caratteri non compresi in `A-Za-z0-9_-` vengono sostituiti con `-`.
- I frammenti che inizierebbero con un carattere diverso da una lettera ricevono un prefisso alfabetico, pertanto le chiavi
  numeriche dei server, come `12306`, diventano prefissi degli strumenti compatibili con i provider.
- I prefissi dei server sono limitati a 30 caratteri.
- I nomi completi degli strumenti sono limitati a 64 caratteri.
- Per i nomi dei server vuoti viene utilizzato `mcp`.
- I nomi normalizzati che entrano in conflitto vengono distinti con suffissi numerici.
- L'ordine finale degli strumenti esposti è deterministico in base al nome sicuro, mantenendo stabili rispetto alla cache
  i turni ripetuti dell'agente integrato.
- Il filtraggio dei profili considera ogni strumento proveniente da un server MCP di un bundle come
  appartenente al plugin `bundle-mcp`, pertanto gli elenchi di inclusione/esclusione dei profili possono fare riferimento
  sia ai singoli nomi degli strumenti esposti sia alla chiave del plugin `bundle-mcp`.

#### Impostazioni di OpenClaw integrato

Il file `settings.json` di Claude viene importato come impostazioni predefinite di OpenClaw integrato quando
il bundle è abilitato. OpenClaw rimuove le chiavi di sostituzione della shell prima di applicarle:

- `shellPath`
- `shellCommandPrefix`

#### LSP di OpenClaw integrato

- I bundle Claude abilitati possono fornire la configurazione dei server LSP.
- OpenClaw carica `.lsp.json` insieme agli eventuali percorsi `lspServers` dichiarati nel manifesto.
- La configurazione LSP del bundle viene unita alle impostazioni predefinite LSP effettive di OpenClaw
  integrato.
- Attualmente sono eseguibili solo i server LSP supportati basati su stdio; i trasporti non supportati
  vengono comunque visualizzati in `openclaw plugins inspect <id>`.

### Rilevate ma non eseguite

Le seguenti funzionalità vengono riconosciute e mostrate nella diagnostica, ma OpenClaw non le esegue:

- `agents`, automazione `hooks/hooks.json` e `outputStyles` di Claude
- `.cursor/agents`, `.cursor/hooks.json` e `.cursor/rules` di Cursor
- Metadati `.app.json` di Codex oltre alla segnalazione delle funzionalità

## Formati dei bundle

<AccordionGroup>
  <Accordion title="Bundle Codex">
    Marcatori: `.codex-plugin/plugin.json`

    Contenuti facoltativi: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    I bundle Codex si integrano al meglio con OpenClaw quando utilizzano le radici delle Skills e directory
    di pacchetti di hook in stile OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Bundle Claude">
    Due modalità di rilevamento:

    - **Basata sul manifesto:** `.claude-plugin/plugin.json`
    - **Senza manifesto:** struttura predefinita di Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportamento specifico di Claude:

    - `commands/` viene trattata come contenuto delle Skills
    - `settings.json` viene importato nelle impostazioni di OpenClaw integrato (le chiavi di sostituzione della shell vengono rimosse)
    - `.mcp.json` espone gli strumenti stdio supportati a OpenClaw integrato
    - `.lsp.json` insieme ai percorsi `lspServers` dichiarati nel manifesto viene caricato nelle impostazioni predefinite LSP di OpenClaw integrato
    - `hooks/hooks.json` viene rilevato ma non eseguito
    - I percorsi personalizzati dei componenti nel manifesto sono aggiuntivi: estendono i valori predefiniti, non li sostituiscono

  </Accordion>

  <Accordion title="Bundle Cursor">
    Marcatori: `.cursor-plugin/plugin.json`

    Contenuti facoltativi: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` viene trattata come contenuto delle Skills
    - `.cursor/rules/`, `.cursor/agents/` e `.cursor/hooks.json` vengono soltanto rilevati

  </Accordion>
</AccordionGroup>

## Precedenza del rilevamento

OpenClaw verifica innanzitutto il formato dei plugin nativi:

1. `openclaw.plugin.json` o un `package.json` valido con `openclaw.extensions`: viene trattato come **plugin nativo**
2. Marcatori dei bundle (`.codex-plugin/`, `.claude-plugin/` o struttura predefinita di Claude/Cursor): vengono trattati come **bundle**

Se una directory contiene entrambi, OpenClaw utilizza il percorso nativo. Ciò impedisce
che i pacchetti in doppio formato vengano installati parzialmente come bundle.

## Dipendenze di runtime e pulizia

- I bundle compatibili di terze parti non ricevono la riparazione tramite `npm install` all'avvio. Devono
  essere installati tramite `openclaw plugins install` e includere tutto ciò di cui
  hanno bisogno nella directory del plugin installato.
- I plugin inclusi di proprietà di OpenClaw sono distribuiti in forma leggera nel core oppure
  scaricabili tramite il programma di installazione dei plugin. All'avvio, il Gateway non esegue mai un
  gestore di pacchetti per questi plugin.
- `openclaw doctor --fix` rimuove i record obsoleti delle installazioni locali dei plugin inclusi
  e può ripristinare i plugin scaricabili mancanti dall'indice locale dei plugin
  quando la configurazione continua a farvi riferimento.

## Sicurezza

I bundle hanno un perimetro di attendibilità più ristretto rispetto ai plugin nativi:

- OpenClaw **non** carica nello stesso processo moduli di runtime arbitrari dei bundle.
- I percorsi delle Skills e dei pacchetti di hook devono rimanere all'interno della radice del plugin (con verifica dei confini).
- I file delle impostazioni vengono letti applicando le stesse verifiche dei confini.
- I server MCP stdio supportati possono essere avviati come sottoprocessi.

Questo rende i bundle più sicuri per impostazione predefinita, ma è comunque necessario considerare i bundle
di terze parti come contenuti attendibili per le funzionalità che espongono.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Il bundle viene rilevato ma le funzionalità non vengono eseguite">
    Eseguire `openclaw plugins inspect <id>`. Se una funzionalità è elencata ma contrassegnata come
    non collegata, si tratta di una limitazione del prodotto, non di un'installazione non riuscita.
  </Accordion>

  <Accordion title="I file dei comandi Claude non vengono visualizzati">
    Assicurarsi che il bundle sia abilitato e che i file Markdown si trovino all'interno di una radice
    `commands/` o `skills/` rilevata.
  </Accordion>

  <Accordion title="Le impostazioni Claude non vengono applicate">
    Sono supportate solo le impostazioni di OpenClaw integrato provenienti da `settings.json`. OpenClaw
    non tratta le impostazioni del bundle come modifiche dirette alla configurazione.
  </Accordion>

  <Accordion title="Gli hook Claude non vengono eseguiti">
    `hooks/hooks.json` viene soltanto rilevato. Se sono necessari hook eseguibili, utilizzare la
    struttura dei pacchetti di hook di OpenClaw oppure distribuire un plugin nativo.
  </Accordion>
</AccordionGroup>

## Contenuti correlati

- [Installare e configurare i plugin](/it/tools/plugin)
- [Creare plugin](/it/plugins/building-plugins) - creare un plugin nativo
- [Manifesto dei plugin](/it/plugins/manifest) - schema del manifesto nativo
