---
read_when:
    - Vuoi esempi rapidi per installare, elencare, aggiornare o disinstallare Plugin
    - Vuoi scegliere tra ClawHub e la distribuzione di Plugin tramite npm
    - Stai pubblicando un pacchetto plugin
sidebarTitle: Manage plugins
summary: Esempi rapidi per installare, elencare, disinstallare, aggiornare e pubblicare Plugin OpenClaw
title: Gestire i Plugin
x-i18n:
    generated_at: "2026-05-10T19:43:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f666a8196c802190dfd69e8b6a679a47db22f97c4c14d2f9fed73e8fb1ffe5a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

La maggior parte dei flussi di lavoro dei Plugin richiede pochi comandi: cercare, installare, riavviare il Gateway,
verificare e disinstallare quando il Plugin non serve piu.

## Elenca i Plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Usa `--json` per gli script. Include la diagnostica del registro e il
`dependencyStatus` statico di ciascun Plugin quando il pacchetto del Plugin dichiara `dependencies` o
`optionalDependencies`.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` e un controllo di inventario a freddo. Mostra cio che OpenClaw puo scoprire
dalla configurazione, dai manifest e dal registro dei Plugin; non dimostra che un
processo Gateway gia in esecuzione abbia importato il runtime del Plugin.

## Installa i Plugin

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

Usa `inspect --runtime` quando ti serve una prova che il Plugin abbia registrato superfici
runtime come strumenti, hook, servizi, metodi Gateway o comandi CLI
di proprieta del Plugin.

## Aggiorna i Plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Se un Plugin e stato installato da un dist-tag npm come `@beta`, le successive
chiamate `update <plugin-id>` riutilizzano quel tag registrato. Passare una specifica npm esplicita
sposta l'installazione tracciata su quella specifica per gli aggiornamenti futuri.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Il secondo comando riporta un Plugin alla linea di rilascio predefinita del registro
quando era stato precedentemente fissato a una versione esatta o a un tag.

Quando `openclaw update` viene eseguito sul canale beta, i record dei Plugin npm e ClawHub
della linea predefinita provano prima la release `@beta` del Plugin corrispondente. Se quella release beta
non esiste, OpenClaw torna alla specifica predefinita/latest registrata.
Per i Plugin npm, OpenClaw torna indietro anche quando il pacchetto beta esiste ma non supera
la validazione dell'installazione. Le versioni esatte e i tag espliciti come `@rc` o `@beta`
vengono preservati.

## Disinstalla i Plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

La disinstallazione rimuove la voce di configurazione del Plugin, il record dell'indice dei Plugin, le voci
delle liste allow/deny e, quando applicabile, i percorsi di caricamento collegati. Le directory di installazione gestite
vengono rimosse a meno che non passi `--keep-files`.

In modalita Nix (`OPENCLAW_NIX_MODE=1`), i comandi di installazione, aggiornamento, disinstallazione, abilitazione
e disabilitazione dei Plugin sono disabilitati. Gestisci invece queste scelte nella sorgente Nix
dell'installazione; per nix-openclaw, usa la
[Guida rapida](https://github.com/openclaw/nix-openclaw#quick-start) agent-first.

## Pubblica i Plugin

Puoi pubblicare Plugin esterni su [ClawHub](https://clawhub.ai), npmjs.com o
entrambi.

### Pubblica su ClawHub

ClawHub e la superficie primaria di scoperta pubblica per i Plugin OpenClaw. Offre
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

La forma senza prefisso controlla comunque prima ClawHub.

### Pubblica su npmjs.com

I Plugin npm nativi devono includere un manifest del Plugin e i metadati dell'entrypoint
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

Se lo stesso pacchetto e disponibile anche su ClawHub, `npm:` salta la ricerca su ClawHub e
forza la risoluzione npm.

## Scelta della sorgente

- **ClawHub**: usalo quando vuoi scoperta nativa OpenClaw, riepiloghi delle scansioni,
  versioni e suggerimenti di installazione.
- **npmjs.com**: usalo quando distribuisci gia pacchetti JavaScript o hai bisogno di flussi di lavoro
  con dist-tag/registri privati npm.
- **Git**: usalo quando vuoi installare direttamente da un branch, un tag o un commit.
- **Percorso locale**: usalo quando sviluppi o testi un Plugin sulla stessa
  macchina.

## Correlati

- [Plugin](/it/tools/plugin) - panoramica e risoluzione dei problemi
- [`openclaw plugins`](/it/cli/plugins) - riferimento CLI completo
- [ClawHub](/it/clawhub/cli) - pubblicazione e operazioni sul registro
- [Creare Plugin](/it/plugins/building-plugins) - crea un pacchetto Plugin
- [Manifest del Plugin](/it/plugins/manifest) - manifest e metadati del pacchetto
