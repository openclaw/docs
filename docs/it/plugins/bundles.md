---
read_when:
    - Vuoi installare un pacchetto compatibile con Codex, Claude o Cursor
    - Devi comprendere come OpenClaw mappa il contenuto del bundle in funzionalità native
    - Stai eseguendo il debug del rilevamento del bundle o di capacità mancanti
summary: Installa e usa i bundle di Codex, Claude e Cursor come Plugin OpenClaw
title: Bundle di Plugin
x-i18n:
    generated_at: "2026-05-02T08:28:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b949ad70881714a30ab136261441687b439e39b516638ffa052efeab6b75bd4
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw può installare plugin da tre ecosistemi esterni: **Codex**, **Claude**
e **Cursor**. Questi sono chiamati **bundle**: pacchetti di contenuti e metadati che
OpenClaw mappa in funzionalità native come Skills, hook e strumenti MCP.

<Info>
  I bundle **non** sono la stessa cosa dei plugin OpenClaw nativi. I plugin nativi vengono eseguiti
  in-process e possono registrare qualsiasi capability. I bundle sono pacchetti di contenuti con
  mappatura selettiva delle funzionalità e un confine di attendibilità più ristretto.
</Info>

## Perché esistono i bundle

Molti plugin utili vengono pubblicati nel formato Codex, Claude o Cursor. Invece
di richiedere agli autori di riscriverli come plugin OpenClaw nativi, OpenClaw
rileva questi formati e mappa i contenuti supportati nel set di funzionalità
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

    Le funzionalità mappate (Skills, hook, strumenti MCP, impostazioni predefinite LSP) sono disponibili nella sessione successiva.

  </Step>
</Steps>

## Cosa OpenClaw mappa dai bundle

Non tutte le funzionalità dei bundle vengono eseguite oggi in OpenClaw. Ecco cosa funziona e cosa
viene rilevato ma non ancora collegato.

### Supportato ora

| Funzionalità  | Come viene mappata                                                                        | Si applica a   |
| ------------- | ------------------------------------------------------------------------------------------ | -------------- |
| Contenuti Skills | Le radici delle skill del bundle vengono caricate come normali Skills OpenClaw          | Tutti i formati |
| Comandi       | `commands/` e `.cursor/commands/` trattati come radici di skill                            | Claude, Cursor |
| Pacchetti hook | Layout OpenClaw-style `HOOK.md` + `handler.ts`                                            | Codex          |
| Strumenti MCP | Configurazione MCP del bundle unita alle impostazioni Pi incorporate; server stdio e HTTP supportati caricati | Tutti i formati |
| Server LSP    | Claude `.lsp.json` e `lspServers` dichiarati nel manifest uniti alle impostazioni predefinite LSP di Pi incorporato | Claude         |
| Impostazioni  | Claude `settings.json` importato come impostazioni predefinite di Pi incorporato           | Claude         |

#### Contenuti Skills

- le radici delle skill del bundle vengono caricate come normali radici di skill OpenClaw
- le radici Claude `commands` sono trattate come radici di skill aggiuntive
- le radici Cursor `.cursor/commands` sono trattate come radici di skill aggiuntive

Questo significa che i file di comando markdown Claude funzionano tramite il normale
loader di skill OpenClaw. Il markdown dei comandi Cursor funziona tramite lo stesso percorso.

#### Pacchetti hook

- le radici hook del bundle funzionano **solo** quando usano il normale layout
  dei pacchetti hook OpenClaw. Oggi questo è principalmente il caso compatibile con Codex:
  - `HOOK.md`
  - `handler.ts` o `handler.js`

#### MCP per Pi

- i bundle abilitati possono contribuire alla configurazione del server MCP
- OpenClaw unisce la configurazione MCP del bundle alle impostazioni efficaci di Pi incorporato come
  `mcpServers`
- OpenClaw espone gli strumenti MCP del bundle supportati durante i turni dell’agente Pi incorporato
  avviando server stdio o collegandosi a server HTTP
- i profili degli strumenti `coding` e `messaging` includono per impostazione predefinita gli strumenti MCP del bundle;
  usa `tools.deny: ["bundle-mcp"]` per disattivarli per un agente o un gateway
- le impostazioni Pi locali al progetto si applicano comunque dopo le impostazioni predefinite del bundle, quindi le impostazioni
  dello spazio di lavoro possono sovrascrivere le voci MCP del bundle quando necessario
- i cataloghi degli strumenti MCP del bundle vengono ordinati in modo deterministico prima della registrazione, quindi
  le modifiche all’ordine upstream di `listTools()` non destabilizzano i blocchi di strumenti della prompt cache

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
- `type: "http"` è una forma downstream nativa della CLI; usa `transport: "streamable-http"` nella configurazione OpenClaw. `openclaw mcp set` e `openclaw doctor --fix` normalizzano l’alias comune.
- sono consentiti solo gli schemi URL `http:` e `https:`
- i valori di `headers` supportano l’interpolazione `${ENV_VAR}`
- una voce server con sia `command` sia `url` viene rifiutata
- le credenziali URL (userinfo e parametri di query) vengono rimosse dalle descrizioni
  degli strumenti e dai log
- `connectionTimeoutMs` sovrascrive il timeout di connessione predefinito di 30 secondi per
  entrambi i trasporti stdio e HTTP

##### Denominazione degli strumenti

OpenClaw registra gli strumenti MCP del bundle con nomi sicuri per i provider nel formato
`serverName__toolName`. Per esempio, un server con chiave `"vigil-harbor"` che espone uno
strumento `memory_search` viene registrato come `vigil-harbor__memory_search`.

- i caratteri fuori da `A-Za-z0-9_-` vengono sostituiti con `-`
- i prefissi server sono limitati a 30 caratteri
- i nomi completi degli strumenti sono limitati a 64 caratteri
- i nomi server vuoti ripiegano su `mcp`
- i nomi sanificati in collisione vengono distinti con suffissi numerici
- l’ordine finale degli strumenti esposti è deterministico per nome sicuro per mantenere cache-stable
  i turni Pi ripetuti
- il filtro dei profili tratta tutti gli strumenti di un server MCP del bundle come appartenenti al plugin
  `bundle-mcp`, quindi le allowlist e le deny list del profilo possono includere sia
  nomi di strumenti esposti individuali sia la chiave plugin `bundle-mcp`

#### Impostazioni Pi incorporate

- Claude `settings.json` viene importato come impostazioni predefinite di Pi incorporato quando il
  bundle è abilitato
- OpenClaw sanifica le chiavi di override della shell prima di applicarle

Chiavi sanificate:

- `shellPath`
- `shellCommandPrefix`

#### LSP di Pi incorporato

- i bundle Claude abilitati possono contribuire alla configurazione del server LSP
- OpenClaw carica `.lsp.json` più eventuali percorsi `lspServers` dichiarati nel manifest
- la configurazione LSP del bundle viene unita alle impostazioni predefinite LSP efficaci di Pi incorporato
- oggi sono eseguibili solo i server LSP supportati basati su stdio; i trasporti
  non supportati compaiono comunque in `openclaw plugins inspect <id>`

### Rilevato ma non eseguito

Questi elementi vengono riconosciuti e mostrati nella diagnostica, ma OpenClaw non li esegue:

- Claude `agents`, automazione `hooks.json`, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- metadati inline/app Codex oltre alla segnalazione delle capability

## Formati dei bundle

<AccordionGroup>
  <Accordion title="Bundle Codex">
    Marker: `.codex-plugin/plugin.json`

    Contenuto opzionale: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    I bundle Codex si adattano meglio a OpenClaw quando usano radici di skill e directory
    di pacchetti hook OpenClaw-style (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Bundle Claude">
    Due modalità di rilevamento:

    - **Basata su manifest:** `.claude-plugin/plugin.json`
    - **Senza manifest:** layout Claude predefinito (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportamento specifico di Claude:

    - `commands/` è trattato come contenuto skill
    - `settings.json` viene importato nelle impostazioni Pi incorporate (le chiavi di override della shell vengono sanificate)
    - `.mcp.json` espone strumenti stdio supportati a Pi incorporato
    - `.lsp.json` più i percorsi `lspServers` dichiarati nel manifest vengono caricati nelle impostazioni predefinite LSP di Pi incorporato
    - `hooks/hooks.json` viene rilevato ma non eseguito
    - i percorsi dei componenti personalizzati nel manifest sono additivi (estendono le impostazioni predefinite, non le sostituiscono)

  </Accordion>

  <Accordion title="Bundle Cursor">
    Marker: `.cursor-plugin/plugin.json`

    Contenuto opzionale: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` è trattato come contenuto skill
    - `.cursor/rules/`, `.cursor/agents/` e `.cursor/hooks.json` sono solo rilevati

  </Accordion>
</AccordionGroup>

## Precedenza di rilevamento

OpenClaw verifica prima il formato del plugin nativo:

1. `openclaw.plugin.json` o `package.json` valido con `openclaw.extensions` — trattato come **plugin nativo**
2. Marker del bundle (`.codex-plugin/`, `.claude-plugin/` o layout Claude/Cursor predefinito) — trattati come **bundle**

Se una directory contiene entrambi, OpenClaw usa il percorso nativo. Questo impedisce
che i pacchetti a doppio formato vengano installati parzialmente come bundle.

## Dipendenze runtime e pulizia

- I bundle compatibili di terze parti non ricevono la riparazione `npm install` all’avvio. Devono
  essere installati tramite `openclaw plugins install` e includere tutto ciò
  di cui hanno bisogno nella directory del plugin installato.
- I plugin in bundle di proprietà di OpenClaw sono inclusi nel core in forma leggera o
  scaricabili tramite l’installer dei plugin. L’avvio del Gateway non esegue mai un
  package manager per loro.
- `openclaw doctor --fix` rimuove le directory di dipendenze staged legacy e può
  installare i plugin scaricabili configurati che mancano dall’indice locale
  dei plugin.

## Sicurezza

I bundle hanno un confine di attendibilità più ristretto rispetto ai plugin nativi:

- OpenClaw **non** carica moduli runtime arbitrari del bundle in-process
- Skills e percorsi dei pacchetti hook devono restare dentro la radice del plugin (con controllo del confine)
- I file delle impostazioni vengono letti con gli stessi controlli del confine
- I server MCP stdio supportati possono essere avviati come sottoprocessi

Questo rende i bundle più sicuri per impostazione predefinita, ma dovresti comunque trattare i bundle di terze parti
come contenuto attendibile per le funzionalità che espongono.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Il bundle viene rilevato ma le capability non vengono eseguite">
    Esegui `openclaw plugins inspect <id>`. Se una capability è elencata ma contrassegnata come
    non collegata, si tratta di un limite del prodotto, non di un’installazione non riuscita.
  </Accordion>

  <Accordion title="I file di comando Claude non compaiono">
    Assicurati che il bundle sia abilitato e che i file markdown siano dentro una radice
    `commands/` o `skills/` rilevata.
  </Accordion>

  <Accordion title="Le impostazioni Claude non si applicano">
    Sono supportate solo le impostazioni Pi incorporate da `settings.json`. OpenClaw non
    tratta le impostazioni del bundle come patch di configurazione grezze.
  </Accordion>

  <Accordion title="Gli hook Claude non vengono eseguiti">
    `hooks/hooks.json` è solo rilevato. Se hai bisogno di hook eseguibili, usa il
    layout dei pacchetti hook OpenClaw o distribuisci un plugin nativo.
  </Accordion>
</AccordionGroup>

## Correlati

- [Installare e configurare i plugin](/it/tools/plugin)
- [Creare plugin](/it/plugins/building-plugins) — crea un plugin nativo
- [Manifest del plugin](/it/plugins/manifest) — schema del manifest nativo
