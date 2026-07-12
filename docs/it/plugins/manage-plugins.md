---
doc-schema-version: 1
read_when:
    - Vuoi esplorare, installare, abilitare o disabilitare i plugin nell'interfaccia di controllo
    - Vuoi esempi rapidi per elencare, installare, aggiornare, ispezionare o disinstallare i plugin
    - Vuoi scegliere una fonte di installazione del plugin
    - Vuoi il riferimento corretto per pubblicare i pacchetti dei plugin
sidebarTitle: Manage plugins
summary: Gestisci i plugin di OpenClaw dall'interfaccia di controllo o dalla CLI
title: Gestire i plugin
x-i18n:
    generated_at: "2026-07-12T07:16:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b235dfca7ef815cc8b0f82db6a9ba8cb344b00612ffd77ca67c8bbd379bdf2a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

L'interfaccia di controllo copre il flusso di lavoro comune di individuazione, installazione, abilitazione e disabilitazione. La CLI aggiunge aggiornamento, disinstallazione, configurazione avanzata e controlli espliciti sull'origine di installazione. Per il contratto completo dei comandi, i flag, le regole di selezione dell'origine e i casi limite, consulta [`openclaw plugins`](/it/cli/plugins).

Flusso di lavoro tipico della CLI: trova un pacchetto, installalo da ClawHub, npm, git o da un percorso locale, lascia che il Gateway gestito si riavvii automaticamente (oppure riavvialo manualmente), quindi verifica le registrazioni di runtime del plugin.

## Usa l'interfaccia di controllo

Apri **Plugin** nell'interfaccia di controllo oppure usa `/settings/plugins` rispetto al percorso di base configurato per l'interfaccia di controllo. Ad esempio, un percorso di base `/openclaw` usa `/openclaw/settings/plugins`. La pagina contiene due schede:

- **Installati** mostra l'inventario locale completo raggruppato per categoria (canali, provider di modelli, memoria, strumenti). Ogni riga apre una vista dettagliata; il relativo menu di overflow (`…`) abilita o disabilita il plugin e, per i plugin installati esternamente, offre **Rimuovi**. La scheda elenca anche i [server MCP](/it/cli/mcp) configurati con le stesse azioni di abilitazione, disabilitazione e rimozione basate su menu, modificando `mcp.servers` nella configurazione del Gateway.
- **Scopri** è lo store: plugin in evidenza inclusi con OpenClaw, plugin esterni ufficiali e una raccolta selezionata di connettori. Le schede dei connettori aggiungono con un clic un server MCP ospitato (GitHub, Notion, Linear, Sentry, Home Assistant) oppure aprono una ricerca ClawHub precompilata. Digitando nella casella di ricerca viene eseguita direttamente una query su [ClawHub](https://clawhub.ai/plugins) e viene aggiunta una sezione **Da ClawHub** con conteggi dei download e badge di verifica dell'origine.

I plugin inclusi non richiedono l'installazione di un pacchetto. La relativa azione di menu è **Abilita** o **Disabilita**. Workboard, ad esempio, è incluso con OpenClaw e disabilitato per impostazione predefinita, quindi scegli **Abilita** per attivarlo. I plugin forniti in bundle non possono essere rimossi, ma solo disabilitati.

L'accesso al catalogo e alla ricerca richiede `operator.read`. L'installazione, l'abilitazione, la disabilitazione, la rimozione e le modifiche ai server MCP richiedono `operator.admin`. Un'installazione da ClawHub viene eseguita dal Gateway e mantiene i relativi controlli di attendibilità, integrità e criteri di installazione dei plugin.

L'installazione o la rimozione del codice di un plugin richiede il riavvio del Gateway. Le modifiche all'abilitazione possono essere applicate senza riavvio quando il plugin installato e il runtime corrente del Gateway lo supportano; in caso contrario, l'interfaccia indica che è necessario un riavvio. I connettori MCP basati su OAuth richiedono comunque l'esecuzione una tantum di `openclaw mcp login <name>` dalla CLI dopo essere stati aggiunti.

L'interfaccia di controllo non installa da origini npm, git o percorsi locali arbitrari, non aggiorna i plugin e non espone una configurazione avanzata dei plugin. Per queste operazioni, usa i flussi di lavoro della CLI riportati di seguito.

## Elencare e cercare i plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

`--json` per gli script:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` è un controllo a freddo dell'inventario: indica ciò che OpenClaw può individuare dalla configurazione, dai manifest e dal registro persistente dei plugin. Non dimostra che un Gateway già in esecuzione abbia importato il runtime del plugin. L'output JSON include la diagnostica del registro e il `dependencyStatus` di ciascun plugin, che indica se le `dependencies`/`optionalDependencies` dichiarate sono risolvibili su disco.

`plugins search` interroga ClawHub per trovare pacchetti di plugin installabili e visualizza per ogni risultato un suggerimento di installazione (`openclaw plugins install clawhub:<package>`).

## Abilitare e disabilitare i plugin

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

Modifica la voce di configurazione di un plugin senza intervenire sui file installati. Alcuni plugin forniti in bundle (provider di modelli e sintesi vocale in bundle e il plugin del browser in bundle) sono abilitati per impostazione predefinita; altri richiedono `enable` dopo l'installazione.

## Installare i plugin

```bash
# Cerca pacchetti di plugin su ClawHub.
openclaw plugins search "calendar"

# Installa da ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Installa da npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Installa da un artefatto locale prodotto da npm pack.
openclaw plugins install npm-pack:<path.tgz>

# Installa da git o da un checkout di sviluppo locale.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Durante il passaggio definitivo all'avvio, le specifiche di pacchetto senza prefisso vengono installate da npm, a meno che il nome non corrisponda all'ID di un plugin fornito in bundle o ufficiale; in tal caso, OpenClaw usa invece la copia locale/ufficiale. Usa `clawhub:`, `npm:`, `git:` o `npm-pack:` per una selezione deterministica dell'origine.

Usa `--force` solo per sovrascrivere una destinazione di installazione esistente proveniente da un'origine diversa. Per gli aggiornamenti ordinari di un'installazione npm, ClawHub o di un pacchetto di hook registrata, usa invece `openclaw plugins update`; `--force` non è supportato con `--link`.

## Riavviare e ispezionare

Un Gateway gestito in esecuzione con il ricaricamento della configurazione abilitato si riavvia automaticamente dopo l'installazione, l'aggiornamento o la disinstallazione del codice di un plugin. Se il Gateway non è gestito o il ricaricamento è disabilitato, riavvialo manualmente prima di controllare le superfici di runtime attive:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` carica il modulo del plugin e dimostra che ha registrato superfici di runtime (strumenti, hook, servizi, metodi del Gateway, route HTTP, comandi CLI di proprietà del plugin). `inspect` senza opzioni e `list` eseguono solo controlli a freddo di manifest, configurazione e registro.

## Aggiornare i plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Il passaggio dell'ID di un plugin riutilizza la relativa specifica di installazione registrata: i dist-tag memorizzati (`@beta`) e le versioni esatte bloccate vengono mantenuti nelle successive esecuzioni di `update <plugin-id>`.

`openclaw plugins update --all` è il percorso di manutenzione in blocco. Continua a rispettare le normali specifiche di installazione registrate, ma i record attendibili dei plugin ufficiali OpenClaw vengono sincronizzati con la destinazione corrente del catalogo ufficiale invece di rimanere bloccati su un pacchetto ufficiale esatto obsoleto; quando `update.channel` è `beta`, la sincronizzazione preferisce la linea di rilascio beta. Usa un comando mirato `update <plugin-id>` per mantenere invariata una specifica ufficiale esatta o con tag.

Per le installazioni npm, passa una specifica esplicita del pacchetto per modificare il record registrato:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Il secondo comando riporta un plugin alla linea di rilascio predefinita del registro quando in precedenza era bloccato su una versione esatta o un tag.

Consulta [`openclaw plugins`](/it/cli/plugins#update) per le regole esatte di ripiego e blocco delle versioni.

## Disinstallare i plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

La disinstallazione rimuove la voce di configurazione del plugin, il record persistente dell'indice dei plugin, le voci degli elenchi di autorizzazione/blocco e, quando applicabile, le voci collegate di `plugins.load.paths`. La directory di installazione gestita viene rimossa, a meno che non venga passato `--keep-files`. Un Gateway gestito in esecuzione si riavvia automaticamente quando la disinstallazione modifica l'origine del plugin.

In modalità Nix (`OPENCLAW_NIX_MODE=1`), l'installazione, l'aggiornamento, la disinstallazione, l'abilitazione e la disabilitazione dei plugin sono tutti disabilitati; gestisci queste scelte nell'origine Nix dell'installazione.

## Scegliere un'origine

| Origine     | Quando usarla                                                               | Esempio                                                        |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | Vuoi individuazione nativa di OpenClaw, riepiloghi delle scansioni, versioni e suggerimenti | `openclaw plugins install clawhub:<package>`                   |
| git         | Vuoi un branch, un tag o un commit da un repository                         | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| percorso locale | Stai sviluppando o testando un plugin sulla stessa macchina             | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Stai installando un plugin di marketplace compatibile con Claude            | `openclaw plugins install <plugin> --marketplace <source>`     |
| pacchetto npm | Stai verificando un artefatto di pacchetto locale tramite la semantica di installazione di npm | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | Distribuisci già pacchetti JavaScript o ti servono dist-tag npm/un registro privato | `openclaw plugins install npm:@acme/openclaw-plugin`           |

Le installazioni gestite da percorso locale devono essere directory o archivi di plugin. Inserisci i file di plugin autonomi in `plugins.load.paths` invece di installarli con `plugins install`.

## Pubblicare i plugin

ClawHub è la principale superficie pubblica di individuazione per i plugin OpenClaw. Pubblica lì quando vuoi che gli utenti trovino i metadati del plugin, la cronologia delle versioni, i risultati delle scansioni del registro e i suggerimenti di installazione prima di installarlo.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Prima della pubblicazione, i plugin npm nativi devono includere un manifest del plugin (`openclaw.plugin.json`) e i metadati di `package.json`:

```json package.json
{
  "name": "@acme/openclaw-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

```bash
npm publish --access public
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Per il contratto completo di pubblicazione, usa queste pagine invece di considerare questa pagina come riferimento per la pubblicazione:

- [Pubblicazione su ClawHub](/it/clawhub/publishing) spiega proprietari, ambiti, rilasci, revisione, convalida e trasferimento dei pacchetti.
- [Creazione di plugin](/it/plugins/building-plugins) mostra la struttura completa del pacchetto del plugin (incluso `openclaw.plugin.json`) e il flusso di lavoro per la prima pubblicazione.
- [Manifest del plugin](/it/plugins/manifest) definisce i campi del manifest dei plugin nativi.

Se lo stesso pacchetto è disponibile sia su ClawHub sia su npm, usa il prefisso esplicito `clawhub:` o `npm:` per imporre un'origine.

## Risorse correlate

- [Plugin](/it/tools/plugin) - installazione, configurazione, riavvio e risoluzione dei problemi
- [`openclaw plugins`](/it/cli/plugins) - riferimento completo della CLI
- [Plugin della community](/it/plugins/community) - individuazione pubblica e pubblicazione su ClawHub
- [ClawHub](/it/clawhub/cli) - operazioni della CLI del registro
- [Creazione di plugin](/it/plugins/building-plugins) - creazione di un pacchetto plugin
- [Manifest del plugin](/it/plugins/manifest) - manifest e metadati del pacchetto
