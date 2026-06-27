---
doc-schema-version: 1
read_when:
    - Vuoi esempi rapidi per elencare, installare, aggiornare, ispezionare o disinstallare Plugin
    - Vuoi scegliere una sorgente di installazione dei Plugin
    - Vuoi il riferimento corretto per pubblicare pacchetti Plugin
sidebarTitle: Manage plugins
summary: Esempi rapidi per elencare, installare, aggiornare, ispezionare e disinstallare i Plugin di OpenClaw
title: Gestire i Plugin
x-i18n:
    generated_at: "2026-06-27T17:51:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd0c1143c6312603311931cbbdc63069a44bc5ec487e2a46b0266b86a556da4e
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Usa questa pagina per i comandi comuni di gestione dei plugin. Per il contratto completo dei comandi, i flag, le regole di selezione della sorgente e i casi limite, vedi
[`openclaw plugins`](/it/cli/plugins).

La maggior parte dei flussi di installazione è:

1. trovare un pacchetto
2. installarlo da ClawHub, npm, git o da un percorso locale
3. lasciare che il Gateway gestito si riavvii automaticamente, oppure riavviarlo manualmente quando non è gestito
4. verificare le registrazioni runtime del plugin

## Elencare e cercare plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

Usa `--json` per gli script:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` è un controllo a freddo dell’inventario. Mostra ciò che OpenClaw può individuare da configurazione, manifest e registro dei plugin; non prova che un Gateway già in esecuzione abbia importato il runtime del plugin. L’output JSON include diagnostica del registro e il `dependencyStatus` statico di ciascun plugin quando il pacchetto del plugin dichiara `dependencies` o `optionalDependencies`.

`plugins search` interroga ClawHub per pacchetti di plugin installabili e stampa suggerimenti di installazione come `openclaw plugins install clawhub:<package>`.

## Installare plugin

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Install from ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Install from npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from a local npm pack artifact.
openclaw plugins install npm-pack:<path.tgz>

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Le specifiche di pacchetto senza prefisso installano da npm durante la transizione di lancio. Usa `clawhub:`, `npm:`, `git:` o `npm-pack:` quando ti serve una selezione deterministica della sorgente. Se il nome senza prefisso corrisponde a un ID di plugin ufficiale, OpenClaw può installare direttamente la voce del catalogo.

Usa `--force` solo quando vuoi intenzionalmente sovrascrivere una destinazione di installazione esistente. Per gli aggiornamenti ordinari di installazioni tracciate npm, ClawHub o hook-pack, usa `openclaw plugins update`.

## Riavviare e ispezionare

Dopo aver installato, aggiornato o disinstallato codice di plugin, un Gateway gestito in esecuzione con ricaricamento della configurazione abilitato si riavvia automaticamente. Se il Gateway non è gestito o il ricaricamento è disabilitato, riavvialo tu prima di controllare le superfici runtime live:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Usa `inspect --runtime` quando ti serve la prova che il plugin abbia registrato superfici runtime come strumenti, hook, servizi, metodi del Gateway, route HTTP o comandi CLI di proprietà del plugin. `inspect` semplice e `list` sono controlli a freddo di manifest, configurazione e registro.

## Aggiornare plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Quando passi un ID plugin, OpenClaw riusa la specifica di installazione tracciata. I dist-tag memorizzati come `@beta` e le versioni esatte fissate continuano a essere usati nelle esecuzioni successive di `update <plugin-id>`.

`openclaw plugins update --all` è il percorso di manutenzione in blocco. Rispetta comunque le normali specifiche di installazione tracciate, ma i record attendibili dei plugin ufficiali OpenClaw possono sincronizzarsi con la destinazione corrente del catalogo ufficiale invece di restare su un pacchetto ufficiale esatto obsoleto. Se `update.channel` è impostato su `beta`, quella sincronizzazione ufficiale in blocco usa il contesto del canale beta. Usa un `update <plugin-id>` mirato quando vuoi intenzionalmente mantenere intatta una specifica ufficiale esatta o con tag.

Per le installazioni npm, puoi passare una specifica di pacchetto esplicita per cambiare il record tracciato:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Il secondo comando riporta un plugin alla linea di rilascio predefinita del registro quando in precedenza era fissato a una versione esatta o a un tag.

Quando `openclaw update` viene eseguito sul canale beta, i record dei plugin possono preferire rilasci `@beta` corrispondenti. Per le regole esatte di fallback e pinning, vedi
[`openclaw plugins`](/it/cli/plugins#update).

## Disinstallare plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

La disinstallazione rimuove la voce di configurazione del plugin, il record persistente dell’indice dei plugin, le voci degli elenchi di consentiti/negati e i percorsi di caricamento collegati quando applicabile. Le directory di installazione gestite vengono rimosse a meno che tu non passi `--keep-files`. Un Gateway gestito in esecuzione si riavvia automaticamente quando la disinstallazione cambia la sorgente del plugin.

In modalità Nix (`OPENCLAW_NIX_MODE=1`), i comandi di installazione, aggiornamento, disinstallazione, abilitazione e disabilitazione dei plugin sono disabilitati. Gestisci invece queste scelte nella sorgente Nix dell’installazione.

## Scegliere una sorgente

| Sorgente    | Usare quando                                                                 | Esempio                                                        |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | Vuoi discovery nativa OpenClaw, riepiloghi di scansione, versioni e suggerimenti | `openclaw plugins install clawhub:<package>`                   |
| npmjs.com   | Distribuisci già pacchetti JavaScript o ti servono dist-tag npm/registro privato | `openclaw plugins install npm:@acme/openclaw-plugin`           |
| git         | Vuoi un branch, un tag o un commit da un repository                         | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| percorso locale | Stai sviluppando o testando un plugin sulla stessa macchina             | `openclaw plugins install --link ./my-plugin`                  |
| npm pack    | Stai verificando un artifact di pacchetto locale tramite la semantica di installazione npm | `openclaw plugins install npm-pack:<path.tgz>`                 |
| marketplace | Stai installando un plugin marketplace compatibile con Claude               | `openclaw plugins install <plugin> --marketplace <source>`     |

Le installazioni gestite da percorso locale devono essere directory o archivi di plugin. Metti i file di plugin autonomi in `plugins.load.paths` invece di installarli con `plugins install`.

## Pubblicare plugin

ClawHub è la principale superficie pubblica di discovery per i plugin OpenClaw. Pubblica lì quando vuoi che gli utenti trovino metadati del plugin, cronologia delle versioni, risultati di scansione del registro e suggerimenti di installazione prima di installare.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

I plugin npm nativi devono includere un manifest del plugin e metadati del pacchetto prima della pubblicazione:

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

Usa queste pagine per il contratto completo di pubblicazione invece di considerare questa pagina come riferimento per la pubblicazione:

- [Pubblicazione ClawHub](/it/clawhub/publishing) spiega proprietari, ambiti, rilasci, revisione, convalida dei pacchetti e trasferimento dei pacchetti.
- [Creare plugin](/it/plugins/building-plugins) mostra la struttura del pacchetto del plugin e il primo flusso di pubblicazione.
- [Manifest del plugin](/it/plugins/manifest) definisce i campi del manifest dei plugin nativi.

Se lo stesso pacchetto è disponibile sia su ClawHub sia su npm, usa il prefisso esplicito `clawhub:` o `npm:` quando devi forzare una sorgente.

## Correlati

- [Plugin](/it/tools/plugin) - installazione, configurazione, riavvio e risoluzione dei problemi
- [`openclaw plugins`](/it/cli/plugins) - riferimento CLI completo
- [Plugin della community](/it/plugins/community) - discovery pubblica e pubblicazione su ClawHub
- [ClawHub](/it/clawhub/cli) - operazioni CLI del registro
- [Creare plugin](/it/plugins/building-plugins) - creare un pacchetto di plugin
- [Manifest del plugin](/it/plugins/manifest) - manifest e metadati del pacchetto
