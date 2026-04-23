---
read_when:
    - Vuoi installare un bundle compatibile con Codex, Claude o Cursor
    - Devi capire come OpenClaw mappa il contenuto del bundle nelle funzionalità native
    - Stai eseguendo il debug del rilevamento dei bundle o delle capacità mancanti
summary: Installa e usa bundle Codex, Claude e Cursor come plugin OpenClaw
title: Bundle di plugin
x-i18n:
    generated_at: "2026-04-23T08:31:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd5ac067546429412f8f4fd2c0da22005686c2d4377944ecd078f56054223f9b
    source_path: plugins/bundles.md
    workflow: 15
---

# Bundle di plugin

OpenClaw può installare plugin da tre ecosistemi esterni: **Codex**, **Claude**
e **Cursor**. Questi sono chiamati **bundle** — pacchetti di contenuti e metadati che
OpenClaw mappa in funzionalità native come Skills, hook e strumenti MCP.

<Info>
  I bundle **non** sono la stessa cosa dei plugin nativi OpenClaw. I plugin nativi vengono eseguiti
  in-process e possono registrare qualsiasi capacità. I bundle sono pacchetti di contenuti con
  mappatura selettiva delle funzionalità e un confine di fiducia più ristretto.
</Info>

## Perché esistono i bundle

Molti plugin utili sono pubblicati nel formato Codex, Claude o Cursor. Invece
di richiedere agli autori di riscriverli come plugin nativi OpenClaw, OpenClaw
rileva questi formati e mappa il loro contenuto supportato nel set di funzionalità native.
Questo significa che puoi installare un pacchetto di comandi Claude o un bundle di Skills Codex
e usarlo immediatamente.

## Installare un bundle

<Steps>
  <Step title="Installa da una directory, archivio o marketplace">
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

    I bundle appaiono come `Format: bundle` con sottotipo `codex`, `claude` o `cursor`.

  </Step>

  <Step title="Riavvia e usa">
    ```bash
    openclaw gateway restart
    ```

    Le funzionalità mappate (Skills, hook, strumenti MCP, valori predefiniti LSP) sono disponibili nella sessione successiva.

  </Step>
</Steps>

## Cosa mappa OpenClaw dai bundle

Non tutte le funzionalità dei bundle vengono eseguite oggi in OpenClaw. Ecco cosa funziona e cosa
viene rilevato ma non è ancora collegato.

### Attualmente supportato

| Funzionalità   | Come viene mappata                                                                       | Si applica a   |
| -------------- | ---------------------------------------------------------------------------------------- | -------------- |
| Contenuto Skills | Le root Skills del bundle vengono caricate come normali Skills OpenClaw                  | Tutti i formati |
| Comandi        | `commands/` e `.cursor/commands/` trattati come root Skills                              | Claude, Cursor |
| Pacchetti hook | Layout in stile OpenClaw `HOOK.md` + `handler.ts`                                        | Codex          |
| Strumenti MCP  | La configurazione MCP del bundle viene unita nelle impostazioni Pi incorporate; vengono caricati server stdio e HTTP supportati | Tutti i formati |
| Server LSP     | `.lsp.json` di Claude e `lspServers` dichiarati nel manifest vengono uniti nei valori predefiniti LSP di Pi incorporato | Claude         |
| Impostazioni   | `settings.json` di Claude importato come valori predefiniti di Pi incorporato            | Claude         |

#### Contenuto Skills

- le root Skills del bundle vengono caricate come normali root Skills OpenClaw
- le root `commands` di Claude sono trattate come root Skills aggiuntive
- le root `.cursor/commands` di Cursor sono trattate come root Skills aggiuntive

Questo significa che i file di comandi markdown Claude funzionano tramite il normale loader di Skills OpenClaw.
I comandi markdown Cursor funzionano tramite lo stesso percorso.

#### Pacchetti hook

- le root hook del bundle funzionano **solo** quando usano il normale layout di pacchetto hook OpenClaw.
  Oggi questo è principalmente il caso compatibile con Codex:
  - `HOOK.md`
  - `handler.ts` o `handler.js`

#### MCP per Pi

- i bundle abilitati possono contribuire con configurazione server MCP
- OpenClaw unisce la configurazione MCP del bundle nelle impostazioni effettive di Pi incorporato come
  `mcpServers`
- OpenClaw espone gli strumenti MCP del bundle supportati durante i turni dell'agente Pi incorporato avviando
  server stdio o collegandosi a server HTTP
- i profili strumento `coding` e `messaging` includono per impostazione predefinita gli strumenti MCP del bundle; usa `tools.deny: ["bundle-mcp"]` per escluderli per un agente o Gateway
- le impostazioni locali del progetto per Pi continuano ad applicarsi dopo i valori predefiniti del bundle, quindi le
  impostazioni del workspace possono sovrascrivere le voci MCP del bundle quando necessario
- i cataloghi di strumenti MCP del bundle vengono ordinati in modo deterministico prima della registrazione, così
  le modifiche upstream nell'ordine di `listTools()` non destabilizzano i blocchi strumenti del prompt-cache

##### Trasporti

I server MCP possono usare trasporto stdio o HTTP:

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

**HTTP** si collega a un server MCP in esecuzione usando per impostazione predefinita `sse`, oppure `streamable-http` quando richiesto:

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
- sono consentiti solo gli schemi URL `http:` e `https:`
- i valori di `headers` supportano l'interpolazione `${ENV_VAR}`
- una voce server con sia `command` sia `url` viene rifiutata
- le credenziali URL (userinfo e parametri query) vengono redatte dalle
  descrizioni degli strumenti e dai log
- `connectionTimeoutMs` sovrascrive il timeout di connessione predefinito di 30 secondi per
  entrambi i trasporti stdio e HTTP

##### Nomi degli strumenti

OpenClaw registra gli strumenti MCP del bundle con nomi sicuri per il provider nella forma
`serverName__toolName`. Ad esempio, un server con chiave `"vigil-harbor"` che espone uno
strumento `memory_search` viene registrato come `vigil-harbor__memory_search`.

- i caratteri fuori da `A-Za-z0-9_-` vengono sostituiti con `-`
- i prefissi server sono limitati a 30 caratteri
- i nomi completi degli strumenti sono limitati a 64 caratteri
- i nomi server vuoti usano come fallback `mcp`
- i nomi sanificati in collisione vengono disambiguati con suffissi numerici
- l'ordine finale esposto degli strumenti è deterministico per nome sicuro per mantenere stabili in cache i
  turni ripetuti di Pi
- il filtraggio dei profili tratta tutti gli strumenti di un server MCP del bundle come appartenenti al plugin
  `bundle-mcp`, quindi allowlist e deny list dei profili possono includere
  singoli nomi di strumenti esposti oppure la chiave plugin `bundle-mcp`

#### Impostazioni Pi incorporate

- `settings.json` di Claude viene importato come impostazioni predefinite di Pi incorporato quando il
  bundle è abilitato
- OpenClaw sanifica le chiavi di sovrascrittura della shell prima di applicarle

Chiavi sanificate:

- `shellPath`
- `shellCommandPrefix`

#### LSP Pi incorporato

- i bundle Claude abilitati possono contribuire con configurazione server LSP
- OpenClaw carica `.lsp.json` più eventuali percorsi `lspServers` dichiarati nel manifest
- la configurazione LSP del bundle viene unita nei valori predefiniti LSP effettivi di Pi incorporato
- oggi sono eseguibili solo i server LSP supportati basati su stdio; i trasporti non supportati
  continuano comunque ad apparire in `openclaw plugins inspect <id>`

### Rilevato ma non eseguito

Questi elementi vengono riconosciuti e mostrati nella diagnostica, ma OpenClaw non li esegue:

- `agents`, automazione `hooks.json`, `outputStyles` di Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` di Cursor
- metadati inline/app Codex oltre al reporting delle capacità

## Formati bundle

<AccordionGroup>
  <Accordion title="Bundle Codex">
    Marker: `.codex-plugin/plugin.json`

    Contenuto facoltativo: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    I bundle Codex si adattano meglio a OpenClaw quando usano root Skills e directory di pacchetto hook
    in stile OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Bundle Claude">
    Due modalità di rilevamento:

    - **Basato su manifest:** `.claude-plugin/plugin.json`
    - **Senza manifest:** layout Claude predefinito (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportamento specifico di Claude:

    - `commands/` viene trattato come contenuto Skills
    - `settings.json` viene importato nelle impostazioni Pi incorporate (le chiavi di sovrascrittura della shell vengono sanificate)
    - `.mcp.json` espone strumenti stdio supportati a Pi incorporato
    - `.lsp.json` più i percorsi `lspServers` dichiarati nel manifest vengono caricati nei valori predefiniti LSP di Pi incorporato
    - `hooks/hooks.json` viene rilevato ma non eseguito
    - i percorsi di componenti personalizzati nel manifest sono additivi (estendono i predefiniti, non li sostituiscono)

  </Accordion>

  <Accordion title="Bundle Cursor">
    Marker: `.cursor-plugin/plugin.json`

    Contenuto facoltativo: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` viene trattato come contenuto Skills
    - `.cursor/rules/`, `.cursor/agents/` e `.cursor/hooks.json` sono solo rilevamento

  </Accordion>
</AccordionGroup>

## Precedenza del rilevamento

OpenClaw controlla prima il formato di plugin nativo:

1. `openclaw.plugin.json` o `package.json` valido con `openclaw.extensions` — trattato come **plugin nativo**
2. Marker di bundle (`.codex-plugin/`, `.claude-plugin/` o layout predefinito Claude/Cursor) — trattato come **bundle**

Se una directory contiene entrambi, OpenClaw usa il percorso nativo. Questo impedisce
che pacchetti dual-format vengano installati parzialmente come bundle.

## Dipendenze runtime e pulizia

- Le dipendenze runtime dei plugin inclusi sono distribuite all'interno del pacchetto OpenClaw sotto
  `dist/*`. OpenClaw **non** esegue `npm install` all'avvio per i plugin
  inclusi; la pipeline di release è responsabile della distribuzione di un payload completo di
  dipendenze incluse (vedi la regola di verifica postpublish in
  [Releasing](/it/reference/RELEASING)).

## Sicurezza

I bundle hanno un confine di fiducia più ristretto rispetto ai plugin nativi:

- OpenClaw **non** carica moduli runtime arbitrari del bundle in-process
- I percorsi di Skills e pacchetti hook devono restare dentro la root del plugin (con controllo dei boundary)
- I file di impostazioni vengono letti con gli stessi controlli di boundary
- I server MCP stdio supportati possono essere avviati come sottoprocessi

Questo rende i bundle più sicuri per impostazione predefinita, ma dovresti comunque trattare i bundle di terze parti come contenuti fidati per le funzionalità che espongono.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Il bundle viene rilevato ma le capacità non vengono eseguite">
    Esegui `openclaw plugins inspect <id>`. Se una capacità è elencata ma contrassegnata come
    non collegata, si tratta di un limite del prodotto — non di un'installazione non funzionante.
  </Accordion>

  <Accordion title="I file di comandi Claude non compaiono">
    Assicurati che il bundle sia abilitato e che i file markdown siano all'interno di una root rilevata
    `commands/` o `skills/`.
  </Accordion>

  <Accordion title="Le impostazioni Claude non si applicano">
    Sono supportate solo le impostazioni Pi incorporate da `settings.json`. OpenClaw non
    tratta le impostazioni del bundle come patch di configurazione grezze.
  </Accordion>

  <Accordion title="Gli hook Claude non vengono eseguiti">
    `hooks/hooks.json` è solo rilevamento. Se hai bisogno di hook eseguibili, usa il
    layout di pacchetto hook OpenClaw oppure distribuisci un plugin nativo.
  </Accordion>
</AccordionGroup>

## Correlati

- [Installare e configurare i plugin](/it/tools/plugin)
- [Creazione di plugin](/it/plugins/building-plugins) — crea un plugin nativo
- [Manifest del plugin](/it/plugins/manifest) — schema del manifest nativo
