---
read_when:
    - Vuoi installare un bundle compatibile con Codex, Claude o Cursor
    - Devi capire come OpenClaw mappa i contenuti del bundle nelle funzionalità native
    - Stai eseguendo il debug del rilevamento del bundle o delle funzionalità mancanti
summary: Installa e usa i bundle di Codex, Claude e Cursor come Plugin OpenClaw
title: Bundle di Plugin
x-i18n:
    generated_at: "2026-06-27T17:46:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b26915603db9d4d4422f4d1542f033be02eb83c5ffefcf93cac7968f624f4969
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw può installare plugin da tre ecosistemi esterni: **Codex**, **Claude**
e **Cursor**. Questi sono chiamati **bundle**: pacchetti di contenuti e metadati che
OpenClaw mappa in funzionalità native come skill, hook e strumenti MCP.

<Info>
  I bundle **non** sono la stessa cosa dei plugin nativi di OpenClaw. I plugin nativi vengono eseguiti
  in-process e possono registrare qualsiasi capacità. I bundle sono pacchetti di contenuti con
  mappatura selettiva delle funzionalità e un perimetro di fiducia più ristretto.
</Info>

## Perché esistono i bundle

Molti plugin utili sono pubblicati in formato Codex, Claude o Cursor. Invece
di richiedere agli autori di riscriverli come plugin nativi di OpenClaw, OpenClaw
rileva questi formati e mappa i contenuti supportati nell'insieme di funzionalità
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

    Le funzionalità mappate (skill, hook, strumenti MCP, impostazioni predefinite LSP) sono disponibili nella sessione successiva.

  </Step>
</Steps>

## Cosa mappa OpenClaw dai bundle

Non tutte le funzionalità dei bundle vengono eseguite oggi in OpenClaw. Ecco cosa funziona e cosa
viene rilevato ma non ancora collegato.

### Supportato ora

| Funzionalità       | Come viene mappata                                                                                       | Si applica a     |
| ------------- | ------------------------------------------------------------------------------------------------- | -------------- |
| Contenuto skill | Le radici skill del bundle vengono caricate come normali skill OpenClaw                                                 | Tutti i formati    |
| Comandi      | `commands/` e `.cursor/commands/` trattati come radici skill                                        | Claude, Cursor |
| Pacchetti hook    | Layout OpenClaw-style `HOOK.md` + `handler.ts`                                                   | Codex          |
| Strumenti MCP     | Configurazione MCP del bundle unita alle impostazioni OpenClaw incorporate; server stdio e HTTP supportati caricati | Tutti i formati    |
| Server LSP   | Claude `.lsp.json` e `lspServers` dichiarati nel manifest uniti alle impostazioni predefinite LSP incorporate di OpenClaw  | Claude         |
| Impostazioni      | Claude `settings.json` importato come impostazioni predefinite OpenClaw incorporate                                     | Claude         |

#### Contenuto skill

- le radici skill del bundle vengono caricate come normali radici skill OpenClaw
- le radici Claude `commands` sono trattate come radici skill aggiuntive
- le radici Cursor `.cursor/commands` sono trattate come radici skill aggiuntive

Questo significa che i file di comando markdown Claude funzionano tramite il normale
loader di skill OpenClaw. Il markdown dei comandi Cursor funziona tramite lo stesso percorso.

#### Pacchetti hook

- le radici hook del bundle funzionano **solo** quando usano il normale layout
  di pacchetto hook OpenClaw. Oggi questo è principalmente il caso compatibile con Codex:
  - `HOOK.md`
  - `handler.ts` o `handler.js`

#### MCP per OpenClaw incorporato

- i bundle abilitati possono contribuire alla configurazione del server MCP
- OpenClaw unisce la configurazione MCP del bundle nelle impostazioni OpenClaw incorporate effettive come
  `mcpServers`
- OpenClaw espone gli strumenti MCP del bundle supportati durante i turni degli agenti OpenClaw incorporati
  avviando server stdio o connettendosi a server HTTP
- i profili strumento `coding` e `messaging` includono gli strumenti MCP del bundle per
  impostazione predefinita; usa `tools.deny: ["bundle-mcp"]` per escluderli per un agente o un gateway
- le impostazioni dell'agente incorporato locali al progetto si applicano comunque dopo le impostazioni predefinite del bundle, quindi le impostazioni
  del workspace possono sovrascrivere le voci MCP del bundle quando necessario
- i cataloghi degli strumenti MCP del bundle vengono ordinati in modo deterministico prima della registrazione, quindi
  le modifiche all'ordine upstream di `listTools()` non invalidano continuamente i blocchi strumento della prompt-cache

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

- `transport` può essere impostato su `"streamable-http"` o `"sse"`; se omesso, OpenClaw usa `sse`
- `type: "http"` è una forma downstream nativa della CLI; usa `transport: "streamable-http"` nella configurazione OpenClaw. `openclaw mcp set` e `openclaw doctor --fix` normalizzano l'alias comune.
- sono consentiti solo gli schemi URL `http:` e `https:`
- i valori di `headers` supportano l'interpolazione `${ENV_VAR}`
- una voce server con sia `command` sia `url` viene rifiutata
- le credenziali URL (userinfo e parametri di query) vengono oscurate dalle
  descrizioni degli strumenti e dai log
- `connectionTimeoutMs` sovrascrive il timeout di connessione predefinito di 30 secondi per
  i trasporti sia stdio sia HTTP

##### Nomi degli strumenti

OpenClaw registra gli strumenti MCP del bundle con nomi sicuri per i provider nella forma
`serverName__toolName`. Per esempio, un server con chiave `"vigil-harbor"` che espone uno
strumento `memory_search` viene registrato come `vigil-harbor__memory_search`.

- i caratteri al di fuori di `A-Za-z0-9_-` vengono sostituiti con `-`
- i frammenti che inizierebbero con una non lettera ricevono un prefisso letterale, quindi le chiavi server numeriche
  come `12306` diventano prefissi strumento sicuri per i provider
- i prefissi server sono limitati a 30 caratteri
- i nomi completi degli strumenti sono limitati a 64 caratteri
- i nomi server vuoti ripiegano su `mcp`
- i nomi sanificati in collisione vengono disambiguati con suffissi numerici
- l'ordine finale degli strumenti esposti è deterministico per nome sicuro, per mantenere stabili nella cache
  i turni ripetuti degli agenti incorporati
- il filtraggio dei profili tratta tutti gli strumenti di un server MCP del bundle come posseduti dal plugin
  `bundle-mcp`, quindi le allowlist e le deny list dei profili possono includere sia
  i singoli nomi degli strumenti esposti sia la chiave plugin `bundle-mcp`

#### Impostazioni OpenClaw incorporate

- Claude `settings.json` viene importato come impostazioni OpenClaw incorporate predefinite quando il
  bundle è abilitato
- OpenClaw sanifica le chiavi di override della shell prima di applicarle

Chiavi sanificate:

- `shellPath`
- `shellCommandPrefix`

#### LSP OpenClaw incorporato

- i bundle Claude abilitati possono contribuire alla configurazione dei server LSP
- OpenClaw carica `.lsp.json` più eventuali percorsi `lspServers` dichiarati nel manifest
- la configurazione LSP del bundle viene unita alle impostazioni predefinite LSP OpenClaw incorporate effettive
- oggi sono eseguibili solo server LSP supportati basati su stdio; i trasporti
  non supportati compaiono comunque in `openclaw plugins inspect <id>`

### Rilevati ma non eseguiti

Questi elementi vengono riconosciuti e mostrati nella diagnostica, ma OpenClaw non li esegue:

- Claude `agents`, automazione `hooks.json`, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- metadati inline/app Codex oltre alla segnalazione delle capacità

## Formati dei bundle

<AccordionGroup>
  <Accordion title="Bundle Codex">
    Marcatori: `.codex-plugin/plugin.json`

    Contenuto opzionale: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    I bundle Codex si adattano meglio a OpenClaw quando usano radici skill e directory
    di pacchetto hook OpenClaw-style (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Bundle Claude">
    Due modalità di rilevamento:

    - **Basata su manifest:** `.claude-plugin/plugin.json`
    - **Senza manifest:** layout Claude predefinito (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportamento specifico di Claude:

    - `commands/` è trattato come contenuto skill
    - `settings.json` viene importato nelle impostazioni OpenClaw incorporate (le chiavi di override della shell sono sanificate)
    - `.mcp.json` espone gli strumenti stdio supportati a OpenClaw incorporato
    - `.lsp.json` più i percorsi `lspServers` dichiarati nel manifest vengono caricati nelle impostazioni predefinite LSP OpenClaw incorporate
    - `hooks/hooks.json` viene rilevato ma non eseguito
    - I percorsi dei componenti personalizzati nel manifest sono additivi (estendono le impostazioni predefinite, non le sostituiscono)

  </Accordion>

  <Accordion title="Bundle Cursor">
    Marcatori: `.cursor-plugin/plugin.json`

    Contenuto opzionale: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` è trattato come contenuto skill
    - `.cursor/rules/`, `.cursor/agents/` e `.cursor/hooks.json` sono solo rilevati

  </Accordion>
</AccordionGroup>

## Precedenza di rilevamento

OpenClaw controlla prima il formato plugin nativo:

1. `openclaw.plugin.json` o `package.json` valido con `openclaw.extensions` — trattato come **plugin nativo**
2. Marcatori bundle (`.codex-plugin/`, `.claude-plugin/` o layout Claude/Cursor predefinito) — trattati come **bundle**

Se una directory contiene entrambi, OpenClaw usa il percorso nativo. Questo impedisce
che i pacchetti a doppio formato vengano installati parzialmente come bundle.

## Dipendenze runtime e pulizia

- I bundle compatibili di terze parti non ricevono riparazione `npm install` all'avvio. Devono
  essere installati tramite `openclaw plugins install` e includere tutto ciò
  di cui hanno bisogno nella directory plugin installata.
- I plugin in bundle posseduti da OpenClaw sono spediti leggeri nel core oppure
  scaricabili tramite l'installer dei plugin. L'avvio del Gateway non esegue mai un
  package manager per loro.
- `openclaw doctor --fix` rimuove le directory legacy di dipendenze in staging e può
  recuperare i plugin scaricabili mancanti dall'indice plugin locale quando
  la configurazione li referenzia.

## Sicurezza

I bundle hanno un perimetro di fiducia più ristretto rispetto ai plugin nativi:

- OpenClaw **non** carica moduli runtime arbitrari del bundle in-process
- I percorsi di skill e pacchetti hook devono rimanere dentro la radice del plugin (controllati al perimetro)
- I file di impostazioni vengono letti con gli stessi controlli di perimetro
- I server MCP stdio supportati possono essere avviati come sottoprocessi

Questo rende i bundle più sicuri per impostazione predefinita, ma dovresti comunque trattare i bundle
di terze parti come contenuto affidabile per le funzionalità che espongono.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Il bundle viene rilevato ma le capacità non vengono eseguite">
    Esegui `openclaw plugins inspect <id>`. Se una capacità è elencata ma contrassegnata come
    non collegata, si tratta di un limite del prodotto, non di un'installazione non riuscita.
  </Accordion>

  <Accordion title="I file di comando Claude non compaiono">
    Assicurati che il bundle sia abilitato e che i file markdown siano dentro una radice
    `commands/` o `skills/` rilevata.
  </Accordion>

  <Accordion title="Le impostazioni Claude non si applicano">
    Sono supportate solo le impostazioni OpenClaw incorporate da `settings.json`. OpenClaw
    non tratta le impostazioni del bundle come patch di configurazione grezze.
  </Accordion>

  <Accordion title="Gli hook Claude non vengono eseguiti">
    `hooks/hooks.json` è solo rilevato. Se ti servono hook eseguibili, usa il
    layout di pacchetto hook OpenClaw o distribuisci un plugin nativo.
  </Accordion>
</AccordionGroup>

## Correlati

- [Installare e configurare i plugin](/it/tools/plugin)
- [Creare plugin](/it/plugins/building-plugins) — crea un plugin nativo
- [Manifest del plugin](/it/plugins/manifest) — schema del manifest nativo
