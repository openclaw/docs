---
read_when:
    - Vuoi installare un bundle compatibile con Codex, Claude o Cursor
    - Hai bisogno di capire come OpenClaw mappa il contenuto del bundle nelle funzionalità native
    - Stai eseguendo il debug del rilevamento dei bundle o di funzionalità mancanti
summary: Installa e usa bundle Codex, Claude e Cursor come plugin OpenClaw
title: Bundle di plugin
x-i18n:
    generated_at: "2026-04-05T13:59:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8b1eb4633bdff75425d8c2e29be352e11a4cdad7f420c0c66ae5ef07bf9bdcc
    source_path: plugins/bundles.md
    workflow: 15
---

# Bundle di plugin

OpenClaw può installare plugin da tre ecosistemi esterni: **Codex**, **Claude**,
e **Cursor**. Questi sono chiamati **bundle** — pacchetti di contenuto e metadati che
OpenClaw mappa in funzionalità native come Skills, hook e strumenti MCP.

<Info>
  I bundle **non** sono la stessa cosa dei plugin nativi OpenClaw. I plugin nativi vengono eseguiti
  in-process e possono registrare qualsiasi capacità. I bundle sono pacchetti di contenuto con
  mappatura selettiva delle funzionalità e un confine di fiducia più ristretto.
</Info>

## Perché esistono i bundle

Molti plugin utili vengono pubblicati in formato Codex, Claude o Cursor. Invece
di richiedere agli autori di riscriverli come plugin nativi OpenClaw, OpenClaw
rileva questi formati e mappa il loro contenuto supportato nel set di funzionalità native.
Questo significa che puoi installare un pacchetto di comandi Claude o un bundle di Skills Codex
e usarlo immediatamente.

## Installare un bundle

<Steps>
  <Step title="Installa da una directory, un archivio o un marketplace">
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

    I bundle vengono mostrati come `Format: bundle` con un sottotipo `codex`, `claude` o `cursor`.

  </Step>

  <Step title="Riavvia e usa">
    ```bash
    openclaw gateway restart
    ```

    Le funzionalità mappate (Skills, hook, strumenti MCP, valori predefiniti LSP) sono disponibili nella sessione successiva.

  </Step>
</Steps>

## Cosa OpenClaw mappa dai bundle

Non tutte le funzionalità dei bundle vengono eseguite oggi in OpenClaw. Ecco cosa
funziona e cosa viene rilevato ma non è ancora collegato.

### Supportato ora

| Funzionalità       | Come viene mappata                                                                      | Si applica a   |
| ------------------ | --------------------------------------------------------------------------------------- | -------------- |
| Contenuto Skills   | Le root delle Skills del bundle vengono caricate come normali Skills OpenClaw           | Tutti i formati |
| Comandi            | `commands/` e `.cursor/commands/` trattati come root di Skills                          | Claude, Cursor |
| Pacchetti hook     | Layout in stile OpenClaw con `HOOK.md` + `handler.ts`                                   | Codex          |
| Strumenti MCP      | La configurazione MCP del bundle viene unita alle impostazioni Pi incorporate; vengono caricati i server stdio e HTTP supportati | Tutti i formati |
| Server LSP         | `.lsp.json` di Claude e i `lspServers` dichiarati nel manifest vengono uniti ai valori predefiniti LSP di Pi incorporato | Claude |
| Impostazioni       | `settings.json` di Claude viene importato come valore predefinito di Pi incorporato     | Claude         |

#### Contenuto Skills

- le root delle Skills del bundle vengono caricate come normali root di Skills OpenClaw
- le root `commands` di Claude vengono trattate come root aggiuntive di Skills
- le root `.cursor/commands` di Cursor vengono trattate come root aggiuntive di Skills

Questo significa che i file di comando markdown di Claude funzionano tramite il normale loader delle Skills di OpenClaw. I markdown dei comandi Cursor funzionano tramite lo stesso percorso.

#### Pacchetti hook

- le root hook del bundle funzionano **solo** quando usano il normale layout dei pacchetti hook OpenClaw. Oggi questo è principalmente il caso compatibile con Codex:
  - `HOOK.md`
  - `handler.ts` o `handler.js`

#### MCP per Pi

- i bundle abilitati possono contribuire con configurazione dei server MCP
- OpenClaw unisce la configurazione MCP del bundle alle impostazioni effettive di Pi incorporato come
  `mcpServers`
- OpenClaw espone gli strumenti MCP supportati del bundle durante i turni dell'agente Pi incorporato avviando server stdio o connettendosi a server HTTP
- le impostazioni Pi locali del progetto continuano ad applicarsi dopo i valori predefiniti del bundle, quindi le impostazioni del workspace possono sovrascrivere le voci MCP del bundle quando necessario
- i cataloghi degli strumenti MCP del bundle vengono ordinati in modo deterministico prima della registrazione, così i cambiamenti upstream nell'ordine di `listTools()` non destabilizzano i blocchi degli strumenti nella prompt-cache

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
- sono consentiti solo gli schemi URL `http:` e `https:`
- i valori di `headers` supportano l'interpolazione `${ENV_VAR}`
- una voce server con sia `command` sia `url` viene rifiutata
- le credenziali URL (userinfo e query params) vengono oscurate dalle descrizioni degli strumenti e dai log
- `connectionTimeoutMs` sovrascrive il timeout di connessione predefinito di 30 secondi per entrambi i trasporti stdio e HTTP

##### Denominazione degli strumenti

OpenClaw registra gli strumenti MCP del bundle con nomi sicuri per il provider nella forma
`serverName__toolName`. Per esempio, un server con chiave `"vigil-harbor"` che espone uno
strumento `memory_search` viene registrato come `vigil-harbor__memory_search`.

- i caratteri esterni a `A-Za-z0-9_-` vengono sostituiti con `-`
- i prefissi dei server sono limitati a 30 caratteri
- i nomi completi degli strumenti sono limitati a 64 caratteri
- i nomi server vuoti usano `mcp` come fallback
- i nomi sanificati in collisione vengono disambiguati con suffissi numerici
- l'ordine finale degli strumenti esposti è deterministico per nome sicuro, così i turni Pi ripetuti restano stabili per la cache

#### Impostazioni Pi incorporate

- `settings.json` di Claude viene importato come impostazione predefinita di Pi incorporato quando il bundle è abilitato
- OpenClaw sanifica le chiavi di override della shell prima di applicarle

Chiavi sanificate:

- `shellPath`
- `shellCommandPrefix`

#### LSP di Pi incorporato

- i bundle Claude abilitati possono contribuire con configurazione del server LSP
- OpenClaw carica `.lsp.json` più tutti i percorsi `lspServers` dichiarati nel manifest
- la configurazione LSP del bundle viene unita ai valori predefiniti effettivi LSP di Pi incorporato
- oggi sono eseguibili solo i server LSP supportati basati su stdio; i trasporti non supportati compaiono comunque in `openclaw plugins inspect <id>`

### Rilevato ma non eseguito

Questi elementi vengono riconosciuti e mostrati nella diagnostica, ma OpenClaw non li esegue:

- `agents`, automazione `hooks.json`, `outputStyles` di Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` di Cursor
- metadati inline/app di Codex oltre alla segnalazione delle capacità

## Formati bundle

<AccordionGroup>
  <Accordion title="Bundle Codex">
    Marcatori: `.codex-plugin/plugin.json`

    Contenuto facoltativo: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    I bundle Codex si adattano meglio a OpenClaw quando usano root di Skills e
    directory di pacchetti hook in stile OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Bundle Claude">
    Due modalità di rilevamento:

    - **Basata su manifest:** `.claude-plugin/plugin.json`
    - **Senza manifest:** layout Claude predefinito (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportamento specifico di Claude:

    - `commands/` viene trattato come contenuto Skills
    - `settings.json` viene importato nelle impostazioni Pi incorporate (le chiavi di override della shell vengono sanificate)
    - `.mcp.json` espone gli strumenti stdio supportati a Pi incorporato
    - `.lsp.json` più i percorsi `lspServers` dichiarati nel manifest vengono caricati nei valori predefiniti LSP di Pi incorporato
    - `hooks/hooks.json` viene rilevato ma non eseguito
    - i percorsi di componenti personalizzati nel manifest sono additivi (estendono i valori predefiniti, non li sostituiscono)

  </Accordion>

  <Accordion title="Bundle Cursor">
    Marcatori: `.cursor-plugin/plugin.json`

    Contenuto facoltativo: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` viene trattato come contenuto Skills
    - `.cursor/rules/`, `.cursor/agents/` e `.cursor/hooks.json` sono solo rilevamento

  </Accordion>
</AccordionGroup>

## Precedenza del rilevamento

OpenClaw controlla prima il formato plugin nativo:

1. `openclaw.plugin.json` o `package.json` valido con `openclaw.extensions` — trattato come **plugin nativo**
2. Marcatori di bundle (`.codex-plugin/`, `.claude-plugin/` o layout predefinito Claude/Cursor) — trattato come **bundle**

Se una directory contiene entrambi, OpenClaw usa il percorso nativo. Questo evita
che pacchetti dual-format vengano installati parzialmente come bundle.

## Sicurezza

I bundle hanno un confine di fiducia più ristretto rispetto ai plugin nativi:

- OpenClaw **non** carica moduli runtime arbitrari dei bundle in-process
- I percorsi delle Skills e dei pacchetti hook devono restare all'interno della root del plugin (controllo dei confini)
- I file delle impostazioni vengono letti con gli stessi controlli di confine
- I server MCP stdio supportati possono essere avviati come sottoprocessi

Questo rende i bundle più sicuri per impostazione predefinita, ma dovresti comunque trattare i bundle di terze parti come contenuto attendibile per le funzionalità che espongono.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Il bundle viene rilevato ma le capacità non vengono eseguite">
    Esegui `openclaw plugins inspect <id>`. Se una capacità è elencata ma contrassegnata come
    non collegata, si tratta di un limite del prodotto — non di un'installazione non riuscita.
  </Accordion>

  <Accordion title="I file di comando Claude non compaiono">
    Assicurati che il bundle sia abilitato e che i file markdown si trovino all'interno di una root
    `commands/` o `skills/` rilevata.
  </Accordion>

  <Accordion title="Le impostazioni Claude non si applicano">
    Sono supportate solo le impostazioni Pi incorporate da `settings.json`. OpenClaw non
    tratta le impostazioni del bundle come patch di configurazione grezze.
  </Accordion>

  <Accordion title="Gli hook Claude non vengono eseguiti">
    `hooks/hooks.json` è solo rilevamento. Se hai bisogno di hook eseguibili, usa il
    layout dei pacchetti hook OpenClaw o distribuisci un plugin nativo.
  </Accordion>
</AccordionGroup>

## Correlati

- [Installare e configurare i plugin](/tools/plugin)
- [Building Plugins](/plugins/building-plugins) — crea un plugin nativo
- [Manifest del plugin](/plugins/manifest) — schema del manifest nativo
