---
read_when:
    - Vuoi installare un bundle compatibile con Codex, Claude o Cursor
    - È necessario comprendere come OpenClaw mappa il contenuto del bundle sulle funzionalità native
    - Stai eseguendo il debug del rilevamento dei bundle o delle capacità mancanti
summary: Installa e usa i bundle di Codex, Claude e Cursor come plugin di OpenClaw
title: Pacchetti di Plugin
x-i18n:
    generated_at: "2026-04-30T09:02:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6d03643c3029f5c6c81fab3aa1c00accba94da64a834e381b29db8f405d6bdee
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw può installare plugin da tre ecosistemi esterni: **Codex**, **Claude**
e **Cursor**. Questi sono chiamati **bundle**: pacchetti di contenuti e metadati che
OpenClaw mappa in funzionalità native come skill, hook e strumenti MCP.

<Info>
  I bundle **non** sono la stessa cosa dei plugin nativi di OpenClaw. I plugin nativi vengono eseguiti
  in-process e possono registrare qualsiasi capability. I bundle sono pacchetti di contenuti con
  una mappatura selettiva delle funzionalità e un perimetro di fiducia più ristretto.
</Info>

## Perché esistono i bundle

Molti plugin utili sono pubblicati in formato Codex, Claude o Cursor. Invece
di richiedere agli autori di riscriverli come plugin nativi di OpenClaw, OpenClaw
rileva questi formati e mappa i contenuti supportati nell'insieme di funzionalità
native. Questo significa che puoi installare un pacchetto di comandi Claude o un bundle
di skill Codex e usarlo immediatamente.

## Installare un bundle

<Steps>
  <Step title="Installa da una directory, un archivio o un marketplace">
    ```bash
    # Local directory
    openclaw plugins install ./my-bundle

    # Archive
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="Verifica il rilevamento">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    I bundle vengono mostrati come `Format: bundle` con un sottotipo `codex`, `claude` o `cursor`.

  </Step>

  <Step title="Riavvia e usa">
    ```bash
    openclaw gateway restart
    ```

    Le funzionalità mappate (skill, hook, strumenti MCP, predefiniti LSP) sono disponibili nella sessione successiva.

  </Step>
</Steps>

## Cosa mappa OpenClaw dai bundle

Non tutte le funzionalità dei bundle vengono eseguite oggi in OpenClaw. Ecco cosa funziona e cosa
viene rilevato ma non è ancora collegato.

### Supportato ora

| Funzionalità  | Come viene mappata                                                                         | Si applica a   |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Contenuto skill | Le radici delle skill del bundle vengono caricate come normali skill OpenClaw              | Tutti i formati |
| Comandi       | `commands/` e `.cursor/commands/` trattati come radici skill                               | Claude, Cursor |
| Pacchetti hook | Layout OpenClaw-style `HOOK.md` + `handler.ts`                                            | Codex          |
| Strumenti MCP | Configurazione MCP del bundle unita alle impostazioni Pi integrate; server stdio e HTTP supportati caricati | Tutti i formati |
| Server LSP    | `.lsp.json` di Claude e `lspServers` dichiarati nel manifesto uniti ai predefiniti LSP di Pi integrato | Claude         |
| Impostazioni  | `settings.json` di Claude importato come predefiniti di Pi integrato                       | Claude         |

#### Contenuto skill

- le radici delle skill del bundle vengono caricate come normali radici skill OpenClaw
- le radici `commands` di Claude vengono trattate come radici skill aggiuntive
- le radici `.cursor/commands` di Cursor vengono trattate come radici skill aggiuntive

Questo significa che i file di comandi markdown di Claude funzionano tramite il normale
loader di skill di OpenClaw. I comandi markdown di Cursor funzionano tramite lo stesso percorso.

#### Pacchetti hook

- le radici hook del bundle funzionano **solo** quando usano il normale layout
  di pacchetto hook di OpenClaw. Oggi questo è principalmente il caso compatibile con Codex:
  - `HOOK.md`
  - `handler.ts` o `handler.js`

#### MCP per Pi

- i bundle abilitati possono contribuire con configurazione del server MCP
- OpenClaw unisce la configurazione MCP del bundle nelle impostazioni Pi integrate effettive come
  `mcpServers`
- OpenClaw espone gli strumenti MCP supportati del bundle durante i turni dell'agente Pi integrato
  avviando server stdio o connettendosi a server HTTP
- i profili strumento `coding` e `messaging` includono gli strumenti MCP del bundle per
  impostazione predefinita; usa `tools.deny: ["bundle-mcp"]` per disattivarli per un agente o un Gateway
- le impostazioni Pi locali al progetto continuano ad applicarsi dopo i predefiniti del bundle, quindi le impostazioni
  del workspace possono sovrascrivere le voci MCP del bundle quando necessario
- i cataloghi degli strumenti MCP del bundle vengono ordinati in modo deterministico prima della registrazione, quindi
  le modifiche all'ordine upstream di `listTools()` non rendono instabili i blocchi degli strumenti della prompt-cache

##### Trasporti

I server MCP possono usare il trasporto stdio o HTTP:

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

**HTTP** si connette a un server MCP in esecuzione tramite `sse` per impostazione predefinita, oppure `streamable-http` quando richiesto:

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

- `transport` può essere impostato su `"streamable-http"` o `"sse"`; se omesso, OpenClaw usa `sse`
- `type: "http"` è una forma downstream nativa della CLI; usa `transport: "streamable-http"` nella configurazione OpenClaw. `openclaw mcp set` e `openclaw doctor --fix` normalizzano l'alias comune.
- sono consentiti solo gli schemi URL `http:` e `https:`
- i valori di `headers` supportano l'interpolazione `${ENV_VAR}`
- una voce server con sia `command` sia `url` viene rifiutata
- le credenziali URL (userinfo e parametri di query) vengono oscurate dalle descrizioni
  degli strumenti e dai log
- `connectionTimeoutMs` sovrascrive il timeout di connessione predefinito di 30 secondi per
  entrambi i trasporti stdio e HTTP

##### Denominazione degli strumenti

OpenClaw registra gli strumenti MCP del bundle con nomi sicuri per il provider nel formato
`serverName__toolName`. Per esempio, un server con chiave `"vigil-harbor"` che espone uno
strumento `memory_search` viene registrato come `vigil-harbor__memory_search`.

- i caratteri al di fuori di `A-Za-z0-9_-` vengono sostituiti con `-`
- i prefissi dei server sono limitati a 30 caratteri
- i nomi completi degli strumenti sono limitati a 64 caratteri
- i nomi server vuoti usano `mcp` come fallback
- le collisioni tra nomi sanificati vengono disambiguate con suffissi numerici
- l'ordine finale degli strumenti esposti è deterministico in base al nome sicuro per mantenere i turni Pi
  ripetuti stabili per la cache
- il filtro dei profili tratta tutti gli strumenti da un server MCP del bundle come di proprietà del plugin
  `bundle-mcp`, quindi le liste allow e deny dei profili possono includere sia i nomi
  dei singoli strumenti esposti sia la chiave plugin `bundle-mcp`

#### Impostazioni Pi integrate

- `settings.json` di Claude viene importato come impostazioni Pi integrate predefinite quando il
  bundle è abilitato
- OpenClaw sanifica le chiavi di override della shell prima di applicarle

Chiavi sanificate:

- `shellPath`
- `shellCommandPrefix`

#### LSP Pi integrato

- i bundle Claude abilitati possono contribuire con configurazione del server LSP
- OpenClaw carica `.lsp.json` più eventuali percorsi `lspServers` dichiarati nel manifesto
- la configurazione LSP del bundle viene unita nei predefiniti LSP di Pi integrato effettivi
- oggi sono eseguibili solo i server LSP supportati basati su stdio; i trasporti
  non supportati vengono comunque mostrati in `openclaw plugins inspect <id>`

### Rilevato ma non eseguito

Questi elementi vengono riconosciuti e mostrati nella diagnostica, ma OpenClaw non li esegue:

- `agents`, automazione `hooks.json`, `outputStyles` di Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` di Cursor
- metadati inline/app di Codex oltre alla segnalazione delle capability

## Formati dei bundle

<AccordionGroup>
  <Accordion title="Bundle Codex">
    Marcatori: `.codex-plugin/plugin.json`

    Contenuto facoltativo: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    I bundle Codex si adattano al meglio a OpenClaw quando usano radici skill e directory
    di pacchetti hook OpenClaw-style (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Bundle Claude">
    Due modalità di rilevamento:

    - **Basata su manifesto:** `.claude-plugin/plugin.json`
    - **Senza manifesto:** layout Claude predefinito (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportamento specifico di Claude:

    - `commands/` viene trattato come contenuto skill
    - `settings.json` viene importato nelle impostazioni Pi integrate (le chiavi di override della shell sono sanificate)
    - `.mcp.json` espone strumenti stdio supportati a Pi integrato
    - `.lsp.json` più i percorsi `lspServers` dichiarati nel manifesto vengono caricati nei predefiniti LSP di Pi integrato
    - `hooks/hooks.json` viene rilevato ma non eseguito
    - i percorsi dei componenti personalizzati nel manifesto sono additivi (estendono i predefiniti, non li sostituiscono)

  </Accordion>

  <Accordion title="Bundle Cursor">
    Marcatori: `.cursor-plugin/plugin.json`

    Contenuto facoltativo: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` viene trattato come contenuto skill
    - `.cursor/rules/`, `.cursor/agents/` e `.cursor/hooks.json` sono solo rilevati

  </Accordion>
</AccordionGroup>

## Precedenza del rilevamento

OpenClaw controlla prima il formato plugin nativo:

1. `openclaw.plugin.json` o `package.json` valido con `openclaw.extensions`: trattato come **plugin nativo**
2. Marcatori di bundle (`.codex-plugin/`, `.claude-plugin/` o layout Claude/Cursor predefinito): trattati come **bundle**

Se una directory contiene entrambi, OpenClaw usa il percorso nativo. Questo impedisce
che i pacchetti a doppio formato vengano installati parzialmente come bundle.

## Dipendenze runtime e pulizia

- I bundle compatibili di terze parti non ricevono la riparazione `npm install` all'avvio. Devono
  essere installati tramite `openclaw plugins install` e includere tutto ciò di cui
  hanno bisogno nella directory del plugin installato.
- I plugin bundle pacchettizzati di proprietà di OpenClaw hanno un'eccezione ristretta: quando uno è
  abilitato, l'avvio del Gateway può riparare le dipendenze runtime dichiarate mancanti
  prima dell'importazione. Gli operatori possono ispezionare o riparare quella fase con
  `openclaw plugins deps`.
- La pipeline di rilascio è comunque responsabile della distribuzione di un payload completo di dipendenze
  del bundle quando possibile (vedi la regola di verifica postpubblicazione in
  [Rilascio](/it/reference/RELEASING)).

## Sicurezza

I bundle hanno un perimetro di fiducia più ristretto rispetto ai plugin nativi:

- OpenClaw **non** carica moduli runtime arbitrari del bundle in-process
- I percorsi delle Skills e dei pacchetti hook devono restare all'interno della radice del plugin (con controllo del perimetro)
- I file delle impostazioni vengono letti con gli stessi controlli del perimetro
- I server MCP stdio supportati possono essere avviati come sottoprocessi

Questo rende i bundle più sicuri per impostazione predefinita, ma dovresti comunque trattare i bundle
di terze parti come contenuti attendibili per le funzionalità che espongono.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Il bundle viene rilevato ma le capability non vengono eseguite">
    Esegui `openclaw plugins inspect <id>`. Se una capability è elencata ma contrassegnata come
    non collegata, è un limite del prodotto, non un'installazione difettosa.
  </Accordion>

  <Accordion title="I file di comandi Claude non compaiono">
    Assicurati che il bundle sia abilitato e che i file markdown si trovino dentro una radice
    `commands/` o `skills/` rilevata.
  </Accordion>

  <Accordion title="Le impostazioni Claude non si applicano">
    Sono supportate solo le impostazioni Pi integrate da `settings.json`. OpenClaw non
    tratta le impostazioni del bundle come patch di configurazione grezze.
  </Accordion>

  <Accordion title="Gli hook Claude non vengono eseguiti">
    `hooks/hooks.json` è solo rilevato. Se ti servono hook eseguibili, usa il
    layout di pacchetto hook di OpenClaw o distribuisci un plugin nativo.
  </Accordion>
</AccordionGroup>

## Correlati

- [Installa e configura i plugin](/it/tools/plugin)
- [Creazione di plugin](/it/plugins/building-plugins) — crea un plugin nativo
- [Manifesto del Plugin](/it/plugins/manifest) — schema del manifesto nativo
