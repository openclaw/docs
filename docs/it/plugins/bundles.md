---
read_when:
    - Vuoi installare un pacchetto compatibile con Codex, Claude o Cursor
    - È necessario comprendere come OpenClaw mappa il contenuto del pacchetto in funzionalità native.
    - Stai eseguendo il debug del rilevamento del bundle o di capacità mancanti
summary: Installare e usare i pacchetti di Codex, Claude e Cursor come Plugin di OpenClaw
title: Pacchetti di Plugin
x-i18n:
    generated_at: "2026-05-05T01:48:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bc06300e765e2faaf51800462003e242d29d4102ac9feaa47f86d4ad35bf157
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw può installare plugin da tre ecosistemi esterni: **Codex**, **Claude**,
e **Cursor**. Questi sono chiamati **bundle**: pacchetti di contenuti e metadati che
OpenClaw mappa in funzionalità native come skills, hook e strumenti MCP.

<Info>
  I bundle **non** sono la stessa cosa dei plugin nativi OpenClaw. I plugin nativi vengono eseguiti
  in-process e possono registrare qualsiasi capability. I bundle sono pacchetti di contenuti con
  mappatura selettiva delle funzionalità e un confine di attendibilità più ristretto.
</Info>

## Perché esistono i bundle

Molti plugin utili vengono pubblicati in formato Codex, Claude o Cursor. Invece
di richiedere agli autori di riscriverli come plugin nativi OpenClaw, OpenClaw
rileva questi formati e mappa i loro contenuti supportati nel set di funzionalità
native. Questo significa che puoi installare un pacchetto di comandi Claude o un bundle di skill Codex
e usarlo immediatamente.

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

    Le funzionalità mappate (skill, hook, strumenti MCP, valori predefiniti LSP) sono disponibili nella sessione successiva.

  </Step>
</Steps>

## Cosa OpenClaw mappa dai bundle

Oggi non tutte le funzionalità dei bundle vengono eseguite in OpenClaw. Ecco cosa funziona e cosa
viene rilevato ma non ancora collegato.

### Supportato ora

| Funzionalità  | Come viene mappata                                                                         | Si applica a   |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Contenuto skill | Le radici delle skill del bundle vengono caricate come normali skill OpenClaw              | Tutti i formati |
| Comandi       | `commands/` e `.cursor/commands/` trattati come radici skill                                | Claude, Cursor |
| Pacchetti hook | Layout OpenClaw-style `HOOK.md` + `handler.ts`                                             | Codex          |
| Strumenti MCP | Configurazione MCP del bundle unita alle impostazioni Pi incorporate; server stdio e HTTP supportati caricati | Tutti i formati |
| Server LSP    | Claude `.lsp.json` e `lspServers` dichiarati nel manifest uniti ai valori predefiniti LSP del Pi incorporato | Claude         |
| Impostazioni  | Claude `settings.json` importato come valori predefiniti del Pi incorporato                 | Claude         |

#### Contenuto skill

- le radici delle skill del bundle vengono caricate come normali radici skill OpenClaw
- le radici `commands` di Claude sono trattate come radici skill aggiuntive
- le radici `.cursor/commands` di Cursor sono trattate come radici skill aggiuntive

Questo significa che i file di comando markdown Claude funzionano tramite il normale loader delle skill
OpenClaw. I comandi markdown Cursor funzionano tramite lo stesso percorso.

#### Pacchetti hook

- le radici hook del bundle funzionano **solo** quando usano il normale layout
  di pacchetto hook OpenClaw. Oggi questo è principalmente il caso compatibile con Codex:
  - `HOOK.md`
  - `handler.ts` o `handler.js`

#### MCP per Pi

- i bundle abilitati possono contribuire configurazione server MCP
- OpenClaw unisce la configurazione MCP del bundle nelle impostazioni effettive del Pi incorporato come
  `mcpServers`
- OpenClaw espone gli strumenti MCP del bundle supportati durante i turni dell'agente Pi incorporato
  avviando server stdio o connettendosi a server HTTP
- i profili di strumenti `coding` e `messaging` includono gli strumenti MCP del bundle per
  impostazione predefinita; usa `tools.deny: ["bundle-mcp"]` per disattivarli per un agente o gateway
- le impostazioni Pi locali al progetto si applicano comunque dopo i valori predefiniti del bundle, quindi le impostazioni
  dell'area di lavoro possono sovrascrivere le voci MCP del bundle quando necessario
- i cataloghi degli strumenti MCP del bundle vengono ordinati in modo deterministico prima della registrazione, quindi
  le modifiche all'ordine upstream di `listTools()` non invalidano ripetutamente i blocchi degli strumenti della prompt-cache

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

**HTTP** si connette a un server MCP in esecuzione tramite `sse` per impostazione predefinita, o `streamable-http` quando richiesto:

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

- `transport` può essere impostato su `"streamable-http"` o `"sse"`; quando omesso, OpenClaw usa `sse`
- `type: "http"` è una forma downstream nativa della CLI; usa `transport: "streamable-http"` nella configurazione OpenClaw. `openclaw mcp set` e `openclaw doctor --fix` normalizzano l'alias comune.
- sono consentiti solo gli schemi URL `http:` e `https:`
- i valori `headers` supportano l'interpolazione `${ENV_VAR}`
- una voce server con sia `command` sia `url` viene rifiutata
- le credenziali URL (userinfo e parametri query) vengono oscurate dalle
  descrizioni degli strumenti e dai log
- `connectionTimeoutMs` sovrascrive il timeout di connessione predefinito di 30 secondi per
  entrambi i trasporti stdio e HTTP

##### Nomi degli strumenti

OpenClaw registra gli strumenti MCP del bundle con nomi compatibili con i provider nella forma
`serverName__toolName`. Ad esempio, un server con chiave `"vigil-harbor"` che espone uno
strumento `memory_search` viene registrato come `vigil-harbor__memory_search`.

- i caratteri fuori da `A-Za-z0-9_-` vengono sostituiti con `-`
- i prefissi server sono limitati a 30 caratteri
- i nomi completi degli strumenti sono limitati a 64 caratteri
- i nomi server vuoti usano `mcp` come fallback
- le collisioni tra nomi sanificati vengono disambiguate con suffissi numerici
- l'ordine finale degli strumenti esposti è deterministico per nome sicuro, per mantenere cache-stable
  i turni Pi ripetuti
- il filtro dei profili tratta tutti gli strumenti da un server MCP del bundle come appartenenti al plugin
  `bundle-mcp`, quindi allowlist e deny list dei profili possono includere sia
  singoli nomi di strumenti esposti sia la chiave plugin `bundle-mcp`

#### Impostazioni Pi incorporate

- Claude `settings.json` viene importato come impostazioni Pi incorporate predefinite quando il
  bundle è abilitato
- OpenClaw sanifica le chiavi di override della shell prima di applicarle

Chiavi sanificate:

- `shellPath`
- `shellCommandPrefix`

#### LSP Pi incorporato

- i bundle Claude abilitati possono contribuire configurazione server LSP
- OpenClaw carica `.lsp.json` più eventuali percorsi `lspServers` dichiarati nel manifest
- la configurazione LSP del bundle viene unita ai valori predefiniti LSP effettivi del Pi incorporato
- oggi sono eseguibili solo i server LSP supportati basati su stdio; i trasporti non supportati
  compaiono comunque in `openclaw plugins inspect <id>`

### Rilevati ma non eseguiti

Questi elementi vengono riconosciuti e mostrati nella diagnostica, ma OpenClaw non li esegue:

- Claude `agents`, automazione `hooks.json`, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- metadati inline/app Codex oltre al reporting delle capability

## Formati dei bundle

<AccordionGroup>
  <Accordion title="Bundle Codex">
    Marcatori: `.codex-plugin/plugin.json`

    Contenuto opzionale: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    I bundle Codex si adattano meglio a OpenClaw quando usano radici skill e directory
    di pacchetti hook OpenClaw-style (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Bundle Claude">
    Due modalità di rilevamento:

    - **Basata su manifest:** `.claude-plugin/plugin.json`
    - **Senza manifest:** layout Claude predefinito (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportamento specifico di Claude:

    - `commands/` è trattato come contenuto skill
    - `settings.json` viene importato nelle impostazioni Pi incorporate (le chiavi di override della shell sono sanificate)
    - `.mcp.json` espone strumenti stdio supportati al Pi incorporato
    - `.lsp.json` più i percorsi `lspServers` dichiarati nel manifest vengono caricati nei valori predefiniti LSP del Pi incorporato
    - `hooks/hooks.json` viene rilevato ma non eseguito
    - i percorsi dei componenti personalizzati nel manifest sono additivi (estendono i valori predefiniti, non li sostituiscono)

  </Accordion>

  <Accordion title="Bundle Cursor">
    Marcatori: `.cursor-plugin/plugin.json`

    Contenuto opzionale: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` è trattato come contenuto skill
    - `.cursor/rules/`, `.cursor/agents/` e `.cursor/hooks.json` sono solo rilevati

  </Accordion>
</AccordionGroup>

## Precedenza del rilevamento

OpenClaw controlla prima il formato plugin nativo:

1. `openclaw.plugin.json` o `package.json` valido con `openclaw.extensions` — trattato come **plugin nativo**
2. Marcatori bundle (`.codex-plugin/`, `.claude-plugin/` o layout Claude/Cursor predefinito) — trattati come **bundle**

Se una directory contiene entrambi, OpenClaw usa il percorso nativo. Questo impedisce
che i pacchetti a doppio formato vengano installati parzialmente come bundle.

## Dipendenze runtime e pulizia

- I bundle compatibili di terze parti non ricevono riparazione `npm install` all'avvio. Devono
  essere installati tramite `openclaw plugins install` e includere tutto ciò
  di cui hanno bisogno nella directory del plugin installato.
- I plugin in bundle di proprietà OpenClaw sono spediti leggeri nel core oppure
  scaricabili tramite l'installer dei plugin. L'avvio del Gateway non esegue mai un
  gestore di pacchetti per loro.
- `openclaw doctor --fix` rimuove directory di dipendenze staged legacy e può
  recuperare plugin scaricabili mancanti dall'indice locale dei plugin quando
  la configurazione li referenzia.

## Sicurezza

I bundle hanno un confine di attendibilità più ristretto rispetto ai plugin nativi:

- OpenClaw **non** carica moduli runtime arbitrari del bundle in-process
- I percorsi di Skills e dei pacchetti hook devono rimanere dentro la radice del plugin (con controllo del confine)
- I file di impostazioni vengono letti con gli stessi controlli del confine
- I server MCP stdio supportati possono essere avviati come sottoprocessi

Questo rende i bundle più sicuri per impostazione predefinita, ma devi comunque trattare i bundle
di terze parti come contenuto attendibile per le funzionalità che espongono.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Il bundle viene rilevato ma le capability non vengono eseguite">
    Esegui `openclaw plugins inspect <id>`. Se una capability è elencata ma contrassegnata come
    non collegata, è un limite del prodotto, non un'installazione difettosa.
  </Accordion>

  <Accordion title="I file di comando Claude non compaiono">
    Assicurati che il bundle sia abilitato e che i file markdown siano dentro una radice
    `commands/` o `skills/` rilevata.
  </Accordion>

  <Accordion title="Le impostazioni Claude non si applicano">
    Sono supportate solo le impostazioni Pi incorporate da `settings.json`. OpenClaw non
    tratta le impostazioni del bundle come patch di configurazione raw.
  </Accordion>

  <Accordion title="Gli hook Claude non vengono eseguiti">
    `hooks/hooks.json` è solo rilevato. Se ti servono hook eseguibili, usa il
    layout di pacchetto hook OpenClaw o distribuisci un plugin nativo.
  </Accordion>
</AccordionGroup>

## Correlati

- [Installa e configura i Plugin](/it/tools/plugin)
- [Creare Plugin](/it/plugins/building-plugins) — crea un plugin nativo
- [Manifest del Plugin](/it/plugins/manifest) — schema del manifest nativo
