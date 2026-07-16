---
doc-schema-version: 1
read_when:
    - Si desidera cercare, installare, abilitare o disabilitare i plugin nell'interfaccia di controllo.
    - Si desiderano esempi rapidi per elencare, installare, aggiornare, esaminare o disinstallare i plugin
    - Si desidera scegliere un'origine di installazione del plugin
    - Serve il riferimento corretto per pubblicare i pacchetti dei plugin
sidebarTitle: Manage plugins
summary: Gestire i plugin di OpenClaw dall'interfaccia di controllo o dalla CLI
title: Gestire i plugin
x-i18n:
    generated_at: "2026-07-16T14:41:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2e22483a7bfb6da4f1eafef036ebc1e2151a725e21565e0634c615ff2f168c1d
    source_path: plugins/manage-plugins.md
    workflow: 16
---

L'interfaccia di controllo copre il flusso di lavoro comune di individuazione,
installazione, abilitazione e disabilitazione. La CLI aggiunge aggiornamento,
disinstallazione, configurazione avanzata e controlli espliciti sull'origine
dell'installazione. Per il contratto completo dei comandi, i flag, le regole di
selezione dell'origine e i casi limite, consultare [`openclaw plugins`](/it/cli/plugins).

Flusso di lavoro tipico della CLI: trovare un pacchetto, installarlo da ClawHub,
npm, git o da un percorso locale, consentire il riavvio automatico del Gateway
gestito (oppure riavviarlo manualmente), quindi verificare le registrazioni di
runtime del plugin.

## Usare l'interfaccia di controllo

Aprire **Plugin** nell'interfaccia di controllo oppure usare
`/settings/plugins` rispetto al percorso base configurato dell'interfaccia di
controllo. Ad esempio, un percorso base `/openclaw` usa
`/openclaw/settings/plugins`. La pagina contiene due schede:

- **Installati** mostra l'inventario locale completo raggruppato per categoria
(canali, provider di modelli, memoria, strumenti). Ogni riga apre una vista
dettagliata; il relativo menu di overflow (`…`) abilita o
disabilita il plugin e, per i plugin installati esternamente, offre **Rimuovi**.
La scheda elenca anche i [server MCP](/it/cli/mcp) configurati, con le stesse azioni
di abilitazione, disabilitazione e rimozione tramite menu, modificando
`mcp.servers` nella configurazione del Gateway.
- **Scopri** è lo store: plugin in evidenza inclusi con OpenClaw, plugin
esterni ufficiali e una selezione curata di connettori. Le schede dei connettori
aggiungono un server MCP in hosting con un solo clic (GitHub, Notion, Linear,
Sentry, Home Assistant) oppure aprono una ricerca ClawHub precompilata. Digitando
nella casella di ricerca si interroga direttamente
[ClawHub](https://clawhub.ai/plugins) e si aggiunge una sezione **Da ClawHub**
con conteggi dei download e badge di verifica dell'origine.

I plugin inclusi non richiedono l'installazione di un pacchetto. La relativa
azione di menu è **Abilita** o **Disabilita**. Workboard, ad esempio, è incluso
con OpenClaw e disabilitato per impostazione predefinita; selezionare quindi
**Abilita** per attivarlo. I plugin integrati non possono essere rimossi, ma
soltanto disabilitati.

L'accesso al catalogo e alla ricerca richiede `operator.read`. Le modifiche
di installazione, abilitazione, disabilitazione, rimozione e dei server MCP
richiedono `operator.admin`. L'installazione da ClawHub viene eseguita dal
Gateway e mantiene i relativi controlli dei criteri di attendibilità, integrità
e installazione dei plugin. L'abilitazione di un plugin installato da parte di
un amministratore registra inoltre tale attendibilità esplicita aggiungendo il
plugin selezionato a un elenco restrittivo `plugins.allow` esistente. Una
voce `plugins.deny` esplicita rimane autoritativa e deve essere rimossa
prima di abilitare il plugin.

L'installazione o la rimozione del codice di un plugin richiede il riavvio del
Gateway. Le modifiche all'abilitazione possono essere applicate senza riavvio
quando il plugin installato e il runtime attuale del Gateway lo supportano; in
caso contrario, l'interfaccia indica che è necessario un riavvio. I connettori
MCP basati su OAuth richiedono comunque un'unica esecuzione di
`openclaw mcp login <name>` dalla CLI dopo essere stati aggiunti.

L'interfaccia di controllo non installa da origini npm, git o percorsi locali
arbitrari, non aggiorna i plugin e non espone una configurazione avanzata dei
plugin. Per queste operazioni, usare i flussi di lavoro CLI riportati di
seguito.

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

`plugins list` è un controllo dell'inventario a freddo: indica ciò che
OpenClaw può individuare dalla configurazione, dai manifest e dal registro
persistente dei plugin. Non dimostra che un Gateway già in esecuzione abbia
importato il runtime del plugin. L'output JSON include la diagnostica del
registro e il valore `dependencyStatus` di ogni plugin, che indica se le
risorse `dependencies`/`optionalDependencies` dichiarate vengono risolte sul
disco.

`plugins search` interroga ClawHub per individuare pacchetti di plugin
installabili e visualizza un suggerimento di installazione
(`openclaw plugins install clawhub:<package>`) per ogni risultato.

## Abilitare e disabilitare i plugin

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

Modifica la voce di configurazione di un plugin senza intervenire sui file
installati. Alcuni plugin integrati (provider integrati di modelli/voce e il
plugin del browser integrato) sono abilitati per impostazione predefinita;
altri richiedono `enable` dopo l'installazione.

## Installare i plugin

```bash
# Cercare pacchetti di plugin in ClawHub.
openclaw plugins search "calendar"

# Installare da ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Installare da npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Installare da un artefatto locale npm-pack.
openclaw plugins install npm-pack:<path.tgz>

# Installare da git o da un checkout di sviluppo locale.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Le specifiche di pacchetto senza prefisso vengono installate da npm durante la
transizione del lancio, a meno che il nome non corrisponda all'id di un plugin
integrato o ufficiale; in tal caso OpenClaw usa invece la relativa copia
locale/ufficiale. Usare `clawhub:`, `npm:`,
`git:` o `npm-pack:` per una selezione deterministica
dell'origine. I pacchetti integrati e del catalogo ufficiale di OpenClaw sono
considerati attendibili insieme ai pacchetti ClawHub. Le nuove origini
arbitrarie npm, git, percorso/archivio locale, `npm-pack:` o marketplace
richiedono `--force` nelle installazioni non interattive, dopo aver
esaminato e considerato attendibile l'origine.

`--force` conferma un'origine diversa da ClawHub senza chiedere
conferma e sovrascrive una destinazione di installazione esistente quando
necessario. Per gli aggiornamenti ordinari di un'installazione npm, ClawHub o
hook-pack monitorata, usare invece `openclaw plugins update`. Con
`--link`, `--force` conferma soltanto l'origine; la directory
collegata non viene copiata né sovrascritta.

## Riavviare e ispezionare

Un Gateway gestito in esecuzione con il ricaricamento della configurazione
abilitato si riavvia automaticamente dopo l'installazione, l'aggiornamento o la
disinstallazione del codice di un plugin. Se il Gateway non è gestito o il
ricaricamento è disabilitato, riavviarlo manualmente prima di controllare le
superfici di runtime attive:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` carica il modulo del plugin e dimostra che ha registrato le
superfici di runtime (strumenti, hook, servizi, metodi del Gateway, route HTTP,
comandi CLI di proprietà del plugin). `inspect` semplice e
`list` sono soltanto controlli a freddo di
manifest/configurazione/registro.

## Aggiornare i plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Passando l'id di un plugin si riutilizza la relativa specifica di installazione
monitorata: i dist-tag memorizzati (`@beta`) e le versioni esatte
fissate vengono mantenuti nelle successive esecuzioni di `update <plugin-id>`.

`openclaw plugins update --all` è il percorso per la manutenzione in blocco. Continua a
rispettare le normali specifiche di installazione monitorate, ma i record
attendibili dei plugin ufficiali OpenClaw vengono sincronizzati con la
destinazione corrente del catalogo ufficiale anziché rimanere fissati a un
pacchetto ufficiale esatto ormai obsoleto; quando `update.channel` è
`beta`, la sincronizzazione preferisce la linea di rilascio beta.
Usare un'esecuzione mirata di `update <plugin-id>` per mantenere invariata una
specifica ufficiale esatta o con tag.

Per le installazioni npm, passare una specifica di pacchetto esplicita per
modificare il record monitorato:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Il secondo comando riporta un plugin alla linea di rilascio predefinita del
registro quando in precedenza era fissato a una versione o a un tag esatto.

Consultare [`openclaw plugins`](/it/cli/plugins#update) per le regole esatte di
ripiego e fissaggio delle versioni.

## Disinstallare i plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

La disinstallazione rimuove la voce di configurazione del plugin, il record
persistente dell'indice dei plugin, le voci degli elenchi di autorizzazione e
negazione e, quando applicabile, le voci `plugins.load.paths` collegate. La
directory di installazione gestita viene rimossa, a meno che non venga passato
`--keep-files`. Un Gateway gestito in esecuzione si riavvia automaticamente
quando la disinstallazione modifica l'origine del plugin.

In modalità Nix (`OPENCLAW_NIX_MODE=1`), installazione, aggiornamento,
disinstallazione, abilitazione e disabilitazione dei plugin sono tutti
disabilitati; gestire queste scelte nell'origine Nix dell'installazione.

## Scegliere un'origine

| Origine     | Da usare quando                                                              | Esempio                                                        |
| ----------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | Si desiderano individuazione nativa di OpenClaw, riepiloghi delle scansioni, versioni e suggerimenti | `openclaw plugins install clawhub:<package>`                   |
| git         | Si desidera un branch, un tag o un commit da un repository                    | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| percorso locale | Si sta sviluppando o testando un plugin sullo stesso computer             | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Si sta installando un plugin marketplace compatibile con Claude               | `openclaw plugins install <plugin> --marketplace <source>`     |
| npm pack    | Si sta verificando un artefatto di pacchetto locale tramite la semantica di installazione npm | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | Si distribuiscono già pacchetti JavaScript oppure servono dist-tag npm o un registro privato | `openclaw plugins install npm:@acme/openclaw-plugin`           |

Le installazioni gestite da percorsi locali devono essere directory o archivi
di plugin. Collocare i file di plugin autonomi in `plugins.load.paths` anziché
installarli con `plugins install`.

## Pubblicare i plugin

ClawHub è la principale superficie pubblica per individuare i plugin OpenClaw.
Pubblicare lì quando si desidera consentire agli utenti di trovare metadati dei
plugin, cronologia delle versioni, risultati delle scansioni del registro e
suggerimenti per l'installazione prima di installarli.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Prima della pubblicazione, i plugin npm nativi devono includere un manifest del
plugin (`openclaw.plugin.json`) e i metadati `package.json`:

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

Per il contratto completo di pubblicazione, usare queste pagine anziché
considerare questa pagina come riferimento per la pubblicazione:

- [Pubblicazione su ClawHub](/it/clawhub/publishing) illustra proprietari,
ambiti, rilasci, revisione, convalida e trasferimento dei pacchetti.
- [Creazione dei plugin](/it/plugins/building-plugins) mostra la struttura
completa del pacchetto del plugin (incluso `openclaw.plugin.json`) e il flusso di
lavoro per la prima pubblicazione.
- [Manifest del plugin](/it/plugins/manifest) definisce i campi del manifest
dei plugin nativi.

Se lo stesso pacchetto è disponibile sia su ClawHub sia su npm, usare il
prefisso esplicito `clawhub:` o `npm:` per imporre una
determinata origine.

## Contenuti correlati

- [Plugin](/it/tools/plugin) - installazione, configurazione, riavvio e risoluzione dei problemi
- [`openclaw plugins`](/it/cli/plugins) - riferimento completo della CLI
- [Plugin della community](/it/plugins/community) - individuazione pubblica e pubblicazione su ClawHub
- [ClawHub](/it/clawhub/cli) - operazioni CLI del registro
- [Creazione dei plugin](/it/plugins/building-plugins) - creare un pacchetto di plugin
- [Manifest del plugin](/it/plugins/manifest) - manifest e metadati del pacchetto
