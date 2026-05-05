---
read_when:
    - Vuoi esempi rapidi per installare, elencare, aggiornare o disinstallare Plugin
    - Vuoi scegliere tra la distribuzione di Plugin tramite ClawHub e tramite npm
    - Stai pubblicando un pacchetto Plugin
sidebarTitle: Manage plugins
summary: Esempi rapidi per installare, elencare, disinstallare, aggiornare e pubblicare plugin OpenClaw
title: Gestire i plugin
x-i18n:
    generated_at: "2026-05-05T01:48:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fa7aa78c1ba9c83ba09bea073987ed5e037031f7c7f29307fe18934b0bd2a1c
    source_path: plugins/manage-plugins.md
    workflow: 16
---

La maggior parte dei workflow dei Plugin richiede pochi comandi: cercare, installare, riavviare il Gateway, verificare e disinstallare quando il Plugin non serve più.

## Elencare i Plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Usa `--json` per gli script. Include la diagnostica del registro e lo
`dependencyStatus` statico di ogni Plugin quando il pacchetto del Plugin dichiara
`dependencies` o `optionalDependencies`.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` è un controllo di inventario a freddo. Mostra ciò che OpenClaw può scoprire
da configurazione, manifest e registro dei Plugin; non dimostra che un processo
Gateway già in esecuzione abbia importato il runtime del Plugin.

## Installare i Plugin

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
openclaw plugins install npm:@openclaw/codex

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Dopo aver installato il codice del Plugin, riavvia il Gateway che serve i tuoi canali:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Usa `inspect --runtime` quando ti serve la prova che il Plugin abbia registrato superfici
runtime come strumenti, hook, servizi, metodi Gateway o comandi CLI di proprietà del Plugin.

## Aggiornare i Plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Se un Plugin è stato installato da un dist-tag npm come `@beta`, le chiamate successive
a `update <plugin-id>` riutilizzano quel tag registrato. Passare una specifica npm esplicita
sposta l’installazione tracciata su quella specifica per gli aggiornamenti futuri.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Il secondo comando riporta un Plugin alla linea di rilascio predefinita del registro
quando in precedenza era stato fissato a una versione esatta o a un tag.

Quando `openclaw update` viene eseguito sul canale beta, i record npm e ClawHub
dei Plugin sulla linea predefinita provano prima la release `@beta` del Plugin corrispondente.
Se quella release beta non esiste, OpenClaw ripiega sulla specifica predefinita/latest registrata.
Per i Plugin npm, OpenClaw ripiega anche quando il pacchetto beta esiste ma non supera
la convalida dell’installazione. Le versioni esatte e i tag espliciti come `@rc` o `@beta`
vengono preservati.

## Disinstallare i Plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

La disinstallazione rimuove la voce di configurazione del Plugin, il record dell’indice del Plugin,
le voci delle liste allow/deny e i percorsi di caricamento collegati quando applicabile.
Le directory di installazione gestite vengono rimosse a meno che non passi `--keep-files`.

## Pubblicare i Plugin

Puoi pubblicare Plugin esterni su [ClawHub](https://clawhub.ai), npmjs.com o
entrambi.

### Pubblicare su ClawHub

ClawHub è la superficie pubblica principale per la scoperta dei Plugin OpenClaw. Offre
agli utenti metadati ricercabili, cronologia delle versioni e risultati delle scansioni del registro prima
dell’installazione.

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

I Plugin npm nativi devono includere un manifest del Plugin e metadati del punto di ingresso
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
forza la risoluzione tramite npm.

## Scelta della sorgente

- **ClawHub**: usa quando vuoi scoperta nativa OpenClaw, riepiloghi delle scansioni,
  versioni e suggerimenti di installazione.
- **npmjs.com**: usa quando distribuisci già pacchetti JavaScript o hai bisogno di workflow
  con dist-tag npm/registri privati.
- **Git**: usa quando vuoi installare direttamente da un branch, tag o commit.
- **Percorso locale**: usa quando stai sviluppando o testando un Plugin sulla stessa
  macchina.

## Correlati

- [Plugin](/it/tools/plugin) - panoramica e risoluzione dei problemi
- [`openclaw plugins`](/it/cli/plugins) - riferimento CLI completo
- [ClawHub](/it/tools/clawhub) - pubblicazione e operazioni sul registro
- [Creare Plugin](/it/plugins/building-plugins) - creare un pacchetto Plugin
- [Manifest del Plugin](/it/plugins/manifest) - manifest e metadati del pacchetto
