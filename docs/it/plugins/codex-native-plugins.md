---
read_when:
    - Vuoi che gli agenti OpenClaw in modalità Codex usino plugin Codex nativi
    - Stai migrando plugin Codex curati da OpenAI e installati da sorgente
    - Stai risolvendo problemi relativi a codexPlugins, inventario delle app, azioni distruttive o diagnostica delle app del Plugin
summary: Configura i Plugin Codex nativi migrati per gli agenti OpenClaw in modalità Codex
title: Plugin nativi di Codex
x-i18n:
    generated_at: "2026-05-12T00:59:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4cc1c7b6a97c6eb27eb10a7b14261ecfd398eff58fbd26cc2979a31e6f6a6c4
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Il supporto nativo ai plugin Codex consente a un agente OpenClaw in modalità Codex di usare le funzionalità di app e Plugin proprie del Codex app-server nello stesso thread Codex che gestisce il turno OpenClaw.

OpenClaw non traduce i plugin Codex in strumenti dinamici OpenClaw sintetici `codex_plugin_*`. Le chiamate dei Plugin restano nella trascrizione Codex nativa e Codex app-server gestisce l'esecuzione MCP supportata dall'app.

Usa questa pagina dopo che il [harness Codex](/it/plugins/codex-harness) di base funziona.

## Requisiti

- Il runtime dell'agente OpenClaw selezionato deve essere l'harness Codex nativo.
- `plugins.entries.codex.enabled` deve essere true.
- `plugins.entries.codex.config.codexPlugins.enabled` deve essere true.
- V1 supporta solo plugin `openai-curated` che la migrazione ha osservato come installati dalla sorgente nella home Codex sorgente.
- Il Codex app-server di destinazione deve poter vedere l'inventario previsto di marketplace, Plugin e app.

`codexPlugins` non ha effetto sulle esecuzioni PI, sulle normali esecuzioni del provider OpenAI, sui binding di conversazione ACP o su altri harness, perché questi percorsi non creano thread Codex app-server con configurazione `apps` nativa.

## Avvio rapido

Anteprima della migrazione dalla home Codex sorgente:

```bash
openclaw migrate codex --dry-run
```

Applica la migrazione quando il piano sembra corretto:

```bash
openclaw migrate apply codex --yes
```

La migrazione scrive voci `codexPlugins` esplicite per i plugin idonei e chiama `plugin/install` di Codex app-server per i plugin selezionati. Una configurazione migrata tipica ha questo aspetto:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

Dopo aver modificato `codexPlugins`, usa `/new`, `/reset` oppure riavvia il gateway in modo che le future sessioni dell'harness Codex partano con il set di app aggiornato.

## Come funziona la configurazione nativa dei Plugin

L'integrazione ha tre stati separati:

- Installato: Codex dispone del bundle Plugin locale nel runtime app-server di destinazione.
- Abilitato: la configurazione OpenClaw consente di rendere il Plugin disponibile ai turni dell'harness Codex.
- Accessibile: Codex app-server conferma che le voci app del Plugin sono disponibili per l'account attivo e possono essere mappate all'identità del Plugin migrata.

La migrazione è il passaggio durevole di installazione/idoneità. L'inventario delle app runtime è il controllo di accessibilità. La configurazione della sessione dell'harness Codex calcola quindi una configurazione restrittiva delle app del thread per le app Plugin abilitate e accessibili.

La configurazione delle app del thread viene calcolata quando OpenClaw stabilisce una sessione dell'harness Codex o sostituisce un binding di thread Codex obsoleto. Non viene ricalcolata a ogni turno.

## Limite di supporto V1

V1 è intenzionalmente ristretto:

- Solo i plugin `openai-curated` già installati nell'inventario Codex app-server sorgente sono idonei alla migrazione.
- La migrazione scrive identità Plugin esplicite con `marketplaceName` e `pluginName`; non scrive percorsi di cache locali `marketplacePath`.
- `codexPlugins.enabled` è l'interruttore di abilitazione globale.
- Non esiste alcun carattere jolly `plugins["*"]` e nessuna chiave di configurazione che conceda autorità di installazione arbitraria.
- Marketplace non supportati, bundle Plugin memorizzati nella cache, hook e file di configurazione Codex sono preservati nel report di migrazione per revisione manuale.

## Inventario app e ownership

OpenClaw legge l'inventario delle app Codex tramite `app/list` dell'app-server, lo memorizza nella cache per un'ora e aggiorna in modo asincrono le voci obsolete o mancanti.

Un'app Plugin viene esposta solo quando OpenClaw può ricondurla al Plugin migrato tramite ownership stabile:

- ID app esatto dal dettaglio del Plugin
- nome server MCP noto
- metadati stabili univoci

L'ownership basata solo sul nome visualizzato o ambigua viene esclusa fino a quando il successivo aggiornamento dell'inventario non dimostra l'ownership.

## Configurazione delle app del thread

OpenClaw inietta una patch restrittiva `config.apps` per il thread Codex: `_default` è disabilitato e solo le app di proprietà di Plugin migrati abilitati sono abilitate.

OpenClaw imposta `destructive_enabled` a livello di app dalla policy effettiva globale o per Plugin `allow_destructive_actions` e lascia che Codex applichi i metadati degli strumenti distruttivi dalle annotazioni native degli strumenti app. La configurazione dell'app `_default` è disabilitata con `open_world_enabled: false`. Le app Plugin abilitate sono emesse con `open_world_enabled: true`; OpenClaw non espone una manopola di policy open-world separata per Plugin e non mantiene liste di negazione per nome di strumenti distruttivi per Plugin.

La modalità di approvazione degli strumenti è automatica per impostazione predefinita per le app Plugin, in modo che gli strumenti di lettura non distruttivi possano essere eseguiti senza un'interfaccia di approvazione nello stesso thread. Gli strumenti distruttivi restano controllati dalla policy `destructive_enabled` di ciascuna app.

## Policy sulle azioni distruttive

Le elicitazioni distruttive dei Plugin sono consentite per impostazione predefinita per i plugin Codex migrati, mentre schemi non sicuri e ownership ambigua continuano a fallire in modo chiuso:

- `allow_destructive_actions` globale ha valore predefinito `true`.
- `allow_destructive_actions` per Plugin sovrascrive la policy globale per quel Plugin.
- Quando la policy è `false`, OpenClaw restituisce un rifiuto deterministico.
- Quando la policy è `true`, OpenClaw accetta automaticamente solo schemi sicuri che può mappare a una risposta di approvazione, come un campo booleano di approvazione.
- Identità Plugin mancante, ownership ambigua, ID turno mancante, ID turno errato o schema di elicitazione non sicuro rifiutano invece di richiedere conferma.

## Risoluzione dei problemi

**`auth_required`:** la migrazione ha installato il Plugin, ma una delle sue app richiede ancora l'autenticazione. La voce Plugin esplicita viene scritta come disabilitata finché non effettui nuovamente l'autorizzazione e la abiliti.

**`marketplace_missing` o `plugin_missing`:** il Codex app-server di destinazione non riesce a vedere il marketplace o il Plugin `openai-curated` previsto. Riesegui la migrazione rispetto al runtime di destinazione oppure ispeziona lo stato del Plugin di Codex app-server.

**`app_inventory_missing` o `app_inventory_stale`:** la disponibilità dell'app proveniva da una cache vuota o obsoleta. OpenClaw pianifica un aggiornamento asincrono ed esclude le app Plugin finché ownership e disponibilità non sono note.

**`app_ownership_ambiguous`:** l'inventario delle app corrispondeva solo per nome visualizzato, quindi l'app non viene esposta al thread Codex.

**La configurazione è cambiata ma l'agente non vede il Plugin:** usa `/new`, `/reset` oppure riavvia il gateway. I binding di thread Codex esistenti mantengono la configurazione delle app con cui sono stati avviati finché OpenClaw non stabilisce una nuova sessione harness o sostituisce un binding obsoleto.

**L'azione distruttiva viene rifiutata:** controlla i valori `allow_destructive_actions` globali e per Plugin. Anche quando la policy è true, schemi di elicitazione non sicuri e identità Plugin ambigua continuano a fallire in modo chiuso.

## Correlati

- [Harness Codex](/it/plugins/codex-harness)
- [Riferimento dell'harness Codex](/it/plugins/codex-harness-reference)
- [Runtime dell'harness Codex](/it/plugins/codex-harness-runtime)
- [Riferimento di configurazione](/it/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI migrate](/it/cli/migrate)
