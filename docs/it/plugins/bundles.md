---
read_when:
    - Vuoi installare un bundle compatibile con Codex, Claude o Cursor
    - Hai bisogno di capire come OpenClaw mappa il contenuto del bundle nelle funzionalità native
    - Stai eseguendo il debug del rilevamento del bundle o di capacità mancanti
summary: Installa e usa bundle Codex, Claude e Cursor come plugin OpenClaw
title: Bundle di plugin
x-i18n:
    generated_at: "2026-04-24T08:51:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: a455eaa64b227204ca4e2a6283644edb72d7a4cfad0f2fcf4439d061dcb374bc
    source_path: plugins/bundles.md
    workflow: 15
---

OpenClaw può installare plugin da tre ecosistemi esterni: **Codex**, **Claude**
e **Cursor**. Questi sono chiamati **bundle** — pacchetti di contenuti e metadati che
OpenClaw mappa in funzionalità native come Skills, hook e strumenti MCP.

<Info>
  I bundle **non** sono la stessa cosa dei plugin OpenClaw nativi. I plugin nativi vengono eseguiti
  in-process e possono registrare qualsiasi capacità. I bundle sono pacchetti di contenuti con
  mappatura selettiva delle funzionalità e un confine di trust più ristretto.
</Info>

## Perché esistono i bundle

Molti plugin utili vengono pubblicati in formato Codex, Claude o Cursor. Invece
di richiedere agli autori di riscriverli come plugin OpenClaw nativi, OpenClaw
rileva questi formati e mappa i loro contenuti supportati nel set di funzionalità native.
Questo significa che puoi installare un command pack Claude o un skill bundle Codex
e usarlo immediatamente.

## Installa un bundle

<Steps>
  <Step title="Installa da una directory, archivio o marketplace">
    ```bash
    # Directory locale
    openclaw plugins install ./my-bundle

    # Archivio
    openclaw plugins install ./my-bundle.tgz

    # Marketplace Claude
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="Verifica il rilevamento">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    I bundle appaiono come `Format: bundle` con un sottotipo `codex`, `claude` o `cursor`.

  </Step>

  <Step title="Riavvia e usa">
    ```bash
    openclaw gateway restart
    ```

    Le funzionalità mappate (Skills, hook, strumenti MCP, valori predefiniti LSP) sono disponibili nella sessione successiva.

  </Step>
</Steps>

## Cosa mappa OpenClaw dai bundle

Non tutte le funzionalità del bundle vengono eseguite oggi in OpenClaw. Ecco cosa
funziona e cosa viene rilevato ma non è ancora collegato.

### Attualmente supportato

| Funzionalità   | Come viene mappata                                                                         | Si applica a   |
| -------------- | ------------------------------------------------------------------------------------------ | -------------- |
| Contenuto Skill | Le root delle Skill del bundle vengono caricate come normali Skills OpenClaw              | Tutti i formati |
| Comandi        | `commands/` e `.cursor/commands/` trattati come root Skill                                 | Claude, Cursor |
| Hook pack      | Layout in stile OpenClaw `HOOK.md` + `handler.ts`                                          | Codex          |
| Strumenti MCP  | La configurazione MCP del bundle viene unita alle impostazioni di Pi incorporato; vengono caricati server stdio e HTTP supportati | Tutti i formati |
| Server LSP     | `.lsp.json` di Claude e `lspServers` dichiarati nel manifest vengono uniti nei valori predefiniti LSP di Pi incorporato | Claude         |
| Impostazioni   | `settings.json` di Claude viene importato come valori predefiniti di Pi incorporato        | Claude         |

#### Contenuto Skill

- le root delle Skill del bundle vengono caricate come normali root di Skills OpenClaw
- le root Claude `commands` vengono trattate come root di Skills aggiuntive
- le root Cursor `.cursor/commands` vengono trattate come root di Skills aggiuntive

Questo significa che i file di comando markdown di Claude funzionano tramite il normale
loader delle Skills di OpenClaw. I comandi markdown di Cursor funzionano tramite lo stesso percorso.

#### Hook pack

- le root hook del bundle funzionano **solo** quando usano il normale layout
  di hook-pack OpenClaw. Oggi questo è principalmente il caso compatibile con Codex:
  - `HOOK.md`
  - `handler.ts` oppure `handler.js`

#### MCP per Pi

- i bundle abilitati possono contribuire con configurazione del server MCP
- OpenClaw unisce la configurazione MCP del bundle nelle impostazioni effettive di Pi incorporato come
  `mcpServers`
- OpenClaw espone gli strumenti MCP del bundle supportati durante i turni dell'agente Pi incorporato avviando server stdio o connettendosi a server HTTP
- i profili di strumenti `coding` e `messaging` includono per impostazione predefinita gli strumenti MCP del bundle;
  usa `tools.deny: ["bundle-mcp"]` per disattivarli per un agente o gateway
- le impostazioni locali del progetto per Pi continuano ad applicarsi dopo i valori predefiniti del bundle, quindi
  le impostazioni dello spazio di lavoro possono sovrascrivere le voci MCP del bundle quando necessario
- i cataloghi di strumenti MCP del bundle vengono ordinati in modo deterministico prima della registrazione, così
  le variazioni upstream nell'ordine di `listTools()` non destabilizzano i blocchi degli strumenti della prompt cache

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

- `transport` può essere impostato su `"streamable-http"` oppure `"sse"`; se omesso, OpenClaw usa `sse`
- sono consentiti solo schemi URL `http:` e `https:`
- i valori `headers` supportano l'interpolazione `${ENV_VAR}`
- una voce server con entrambi `command` e `url` viene rifiutata
- le credenziali URL (userinfo e parametri di query) vengono redatte dalle descrizioni
  degli strumenti e dai log
- `connectionTimeoutMs` sovrascrive il timeout di connessione predefinito di 30 secondi per
  entrambi i trasporti stdio e HTTP

##### Naming degli strumenti

OpenClaw registra gli strumenti MCP del bundle con nomi sicuri per il provider nella forma
`serverName__toolName`. Per esempio, un server con chiave `"vigil-harbor"` che espone uno
strumento `memory_search` viene registrato come `vigil-harbor__memory_search`.

- i caratteri fuori da `A-Za-z0-9_-` vengono sostituiti con `-`
- i prefissi del server sono limitati a 30 caratteri
- i nomi completi degli strumenti sono limitati a 64 caratteri
- i nomi di server vuoti usano come fallback `mcp`
- i nomi sanificati in collisione vengono disambiguati con suffissi numerici
- l'ordine finale esposto degli strumenti è deterministico in base al nome sicuro per mantenere stabili nella cache i turni ripetuti di Pi
- il filtraggio per profilo tratta tutti gli strumenti di un server MCP del bundle come appartenenti al plugin `bundle-mcp`, quindi allowlist e denylist dei profili possono includere sia
  i singoli nomi degli strumenti esposti sia la chiave plugin `bundle-mcp`

#### Impostazioni di Pi incorporato

- `settings.json` di Claude viene importato come impostazioni predefinite di Pi incorporato quando il
  bundle è abilitato
- OpenClaw sanifica le chiavi di override della shell prima di applicarle

Chiavi sanificate:

- `shellPath`
- `shellCommandPrefix`

#### LSP di Pi incorporato

- i bundle Claude abilitati possono contribuire con configurazione del server LSP
- OpenClaw carica `.lsp.json` più eventuali percorsi `lspServers` dichiarati nel manifest
- la configurazione LSP del bundle viene unita nei valori predefiniti LSP effettivi di Pi incorporato
- oggi possono essere eseguiti solo server LSP supportati e supportati da stdio; i trasporti non supportati compaiono comunque in `openclaw plugins inspect <id>`

### Rilevato ma non eseguito

Questi vengono riconosciuti e mostrati nella diagnostica, ma OpenClaw non li esegue:

- `agents`, `hooks.json` automation, `outputStyles` di Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` di Cursor
- metadati inline/app di Codex oltre al reporting delle capacità

## Formati bundle

<AccordionGroup>
  <Accordion title="Bundle Codex">
    Marker: `.codex-plugin/plugin.json`

    Contenuto facoltativo: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    I bundle Codex si adattano meglio a OpenClaw quando usano root Skill e
    directory di hook-pack in stile OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Bundle Claude">
    Due modalità di rilevamento:

    - **Basata su manifest:** `.claude-plugin/plugin.json`
    - **Senza manifest:** layout Claude predefinito (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportamento specifico di Claude:

    - `commands/` viene trattato come contenuto Skill
    - `settings.json` viene importato nelle impostazioni di Pi incorporato (le chiavi di override della shell vengono sanificate)
    - `.mcp.json` espone strumenti stdio supportati a Pi incorporato
    - `.lsp.json` più i percorsi `lspServers` dichiarati nel manifest vengono caricati nei valori predefiniti LSP di Pi incorporato
    - `hooks/hooks.json` viene rilevato ma non eseguito
    - I percorsi di componenti personalizzati nel manifest sono additivi (estendono i valori predefiniti, non li sostituiscono)

  </Accordion>

  <Accordion title="Bundle Cursor">
    Marker: `.cursor-plugin/plugin.json`

    Contenuto facoltativo: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` viene trattato come contenuto Skill
    - `.cursor/rules/`, `.cursor/agents/` e `.cursor/hooks.json` sono solo detect-only

  </Accordion>
</AccordionGroup>

## Precedenza del rilevamento

OpenClaw controlla prima il formato del plugin nativo:

1. `openclaw.plugin.json` oppure `package.json` valido con `openclaw.extensions` — trattato come **plugin nativo**
2. Marker bundle (`.codex-plugin/`, `.claude-plugin/` oppure layout predefinito Claude/Cursor) — trattati come **bundle**

Se una directory contiene entrambi, OpenClaw usa il percorso nativo. Questo impedisce
che pacchetti dual-format vengano installati parzialmente come bundle.

## Dipendenze runtime e pulizia

- Le dipendenze runtime dei plugin bundled vengono distribuite all'interno del pacchetto OpenClaw sotto
  `dist/*`. OpenClaw **non** esegue `npm install` all'avvio per i plugin
  bundled; la pipeline di release è responsabile della distribuzione di un payload completo delle dipendenze bundled (vedi la regola di verifica postpublish in
  [Releasing](/it/reference/RELEASING)).

## Sicurezza

I bundle hanno un confine di trust più ristretto rispetto ai plugin nativi:

- OpenClaw **non** carica moduli runtime arbitrari del bundle in-process
- I percorsi delle Skills e degli hook-pack devono restare all'interno della root del plugin (controllo dei confini)
- I file di impostazioni vengono letti con gli stessi controlli dei confini
- I server MCP stdio supportati possono essere avviati come sottoprocessi

Questo rende i bundle più sicuri per impostazione predefinita, ma dovresti comunque trattare i bundle di terze parti come contenuti fidati per le funzionalità che espongono.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Il bundle viene rilevato ma le capacità non funzionano">
    Esegui `openclaw plugins inspect <id>`. Se una capacità è elencata ma marcata come
    non collegata, questo è un limite del prodotto — non un'installazione guasta.
  </Accordion>

  <Accordion title="I file di comando Claude non compaiono">
    Assicurati che il bundle sia abilitato e che i file markdown si trovino all'interno di una root
    `commands/` oppure `skills/` rilevata.
  </Accordion>

  <Accordion title="Le impostazioni Claude non si applicano">
    Sono supportate solo le impostazioni di Pi incorporato da `settings.json`. OpenClaw non
    tratta le impostazioni del bundle come patch grezze di configurazione.
  </Accordion>

  <Accordion title="Gli hook Claude non vengono eseguiti">
    `hooks/hooks.json` è solo detect-only. Se hai bisogno di hook eseguibili, usa il
    layout OpenClaw hook-pack oppure distribuisci un plugin nativo.
  </Accordion>
</AccordionGroup>

## Correlati

- [Installa e configura Plugin](/it/tools/plugin)
- [Building Plugins](/it/plugins/building-plugins) — crea un plugin nativo
- [Manifest del Plugin](/it/plugins/manifest) — schema del manifest nativo
