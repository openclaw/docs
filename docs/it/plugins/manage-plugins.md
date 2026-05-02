---
read_when:
    - Vuoi esempi rapidi per installare, elencare, aggiornare o disinstallare plugin
    - Vuoi scegliere tra la distribuzione dei Plugin tramite ClawHub e quella tramite npm
    - Stai pubblicando un pacchetto Plugin
sidebarTitle: Manage plugins
summary: Esempi rapidi per installare, elencare, disinstallare, aggiornare e pubblicare Plugin di OpenClaw
title: Gestire i Plugin
x-i18n:
    generated_at: "2026-05-02T20:49:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: c5a1c58da41b243cebe1c163048918a94c492b77fdae1613bd008cb267670041
    source_path: plugins/manage-plugins.md
    workflow: 16
---

La maggior parte dei flussi di lavoro dei plugin richiede pochi comandi: cercare, installare, riavviare il Gateway,
verificare e disinstallare quando il plugin non è più necessario.

## Elencare i plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Usa `--json` per gli script. Include la diagnostica del registro e il
`dependencyStatus` statico di ogni plugin quando il pacchetto del plugin dichiara
`dependencies` o `optionalDependencies`.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` è un controllo d'inventario a freddo. Mostra cosa OpenClaw può scoprire
dalla configurazione, dai manifest e dal registro dei plugin; non prova che un
processo Gateway già in esecuzione abbia importato il runtime del plugin.

## Installare i plugin

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Bare package specs try ClawHub first, then npm fallback.
openclaw plugins install <package>

# Force one source.
openclaw plugins install clawhub:<package>
openclaw plugins install npm:<package>

# Install a specific version or dist-tag.
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex@beta

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Dopo aver installato il codice del plugin, riavvia il Gateway che serve i tuoi canali:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Usa `inspect --runtime` quando ti serve la prova che il plugin abbia registrato superfici
runtime come strumenti, hook, servizi, metodi del Gateway o comandi CLI
di proprietà del plugin.

## Aggiornare i plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Se un plugin è stato installato da un dist-tag npm come `@beta`, le chiamate successive a
`update <plugin-id>` riutilizzano quel tag registrato. Passare una specifica npm esplicita
sposta l'installazione tracciata su quella specifica per gli aggiornamenti futuri.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Il secondo comando riporta un plugin alla linea di rilascio predefinita del registro
quando in precedenza era stato vincolato a una versione esatta o a un tag.

Quando `openclaw update` viene eseguito sul canale beta, i record dei plugin npm e ClawHub
della linea predefinita provano prima la release `@beta` del plugin corrispondente. Se quella release
beta non esiste, OpenClaw ripiega sulla specifica predefinita/latest registrata.
Le versioni esatte e i tag espliciti come `@rc` o `@beta` vengono preservati.

## Disinstallare i plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

La disinstallazione rimuove la voce di configurazione del plugin, il record nell'indice dei plugin, le voci
delle liste consenti/nega e i percorsi di caricamento collegati quando applicabile. Le directory di installazione
gestite vengono rimosse a meno che tu non passi `--keep-files`.

## Pubblicare i plugin

Puoi pubblicare plugin esterni su [ClawHub](https://clawhub.ai), npmjs.com o
entrambi.

### Pubblicare su ClawHub

ClawHub è la principale superficie di discovery pubblica per i plugin OpenClaw. Offre
agli utenti metadati ricercabili, cronologia delle versioni e risultati delle scansioni del registro prima
dell'installazione.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Gli utenti installano da ClawHub con:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

La forma semplice controlla comunque prima ClawHub.

### Pubblicare su npmjs.com

I plugin npm nativi devono includere un manifest del plugin e i metadati del punto di ingresso
OpenClaw in `package.json`.

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
```

Gli utenti installano solo da npm con:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Se lo stesso pacchetto è disponibile anche su ClawHub, `npm:` salta la ricerca su ClawHub e
forza la risoluzione npm.

## Scelta della sorgente

- **ClawHub**: usa quando vuoi discovery nativa OpenClaw, riepiloghi delle scansioni,
  versioni e suggerimenti di installazione.
- **npmjs.com**: usa quando distribuisci già pacchetti JavaScript o ti servono
  dist-tag npm/flussi di lavoro con registro privato.
- **Git**: usa quando vuoi installare direttamente da un branch, tag o commit.
- **Percorso locale**: usa quando stai sviluppando o testando un plugin sulla stessa
  macchina.

## Correlati

- [Plugin](/it/tools/plugin) - panoramica e risoluzione dei problemi
- [`openclaw plugins`](/it/cli/plugins) - riferimento CLI completo
- [ClawHub](/it/tools/clawhub) - pubblicazione e operazioni sul registro
- [Creare plugin](/it/plugins/building-plugins) - creare un pacchetto plugin
- [Manifest del plugin](/it/plugins/manifest) - manifest e metadati del pacchetto
