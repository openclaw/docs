---
read_when:
    - Vuoi che gli agenti OpenClaw in modalità Codex usino Plugin Codex nativi
    - Stai migrando i plugin Codex curati da OpenAI installati da sorgente
    - Stai risolvendo problemi relativi a codexPlugins, inventario delle app, azioni distruttive o diagnostica delle app dei plugin
summary: Configurare i Plugin Codex nativi migrati per gli agenti OpenClaw in modalità Codex
title: Plugin nativi di Codex
x-i18n:
    generated_at: "2026-05-10T19:43:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b9116a479ffb68e3566f6113d9ec9d2a3c33df2dd27ff539f2f27110c7b9d9f
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Il supporto nativo dei plugin Codex consente a un agente OpenClaw in modalità Codex di usare le funzionalità app e plugin proprie di Codex
app-server nello stesso thread Codex che
gestisce il turno OpenClaw.

OpenClaw non traduce i plugin Codex in strumenti dinamici OpenClaw sintetici `codex_plugin_*`. Le chiamate dei plugin restano nella trascrizione Codex nativa e
Codex app-server possiede l'esecuzione MCP basata sull'app.

Usa questa pagina dopo che l'[harness Codex](/it/plugins/codex-harness) di base funziona.

## Requisiti

- Il runtime dell'agente OpenClaw selezionato deve essere l'harness Codex nativo.
- `plugins.entries.codex.enabled` deve essere true.
- `plugins.entries.codex.config.codexPlugins.enabled` deve essere true.
- V1 supporta solo i plugin `openai-curated` che la migrazione ha osservato come
  installati dal sorgente nella home Codex di origine.
- Il Codex app-server di destinazione deve poter vedere il marketplace,
  il plugin e l'inventario delle app previsti.

`codexPlugins` non ha effetto sulle esecuzioni PI, sulle normali esecuzioni del provider OpenAI, sui binding di conversazione ACP
o su altri harness, perché quei percorsi non creano
thread Codex app-server con configurazione `apps` nativa.

## Avvio rapido

Visualizza in anteprima la migrazione dalla home Codex di origine:

```bash
openclaw migrate codex --dry-run
```

Applica la migrazione quando il piano sembra corretto:

```bash
openclaw migrate apply codex --yes
```

La migrazione scrive voci `codexPlugins` esplicite per i plugin idonei e chiama
Codex app-server `plugin/install` per i plugin selezionati. Una configurazione
migrata tipica ha questo aspetto:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
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

Dopo aver modificato `codexPlugins`, usa `/new`, `/reset` oppure riavvia il gateway in modo che
le future sessioni dell'harness Codex partano con il set di app aggiornato.

## Come funziona la configurazione dei plugin nativi

L'integrazione ha tre stati distinti:

- Installato: Codex ha il bundle del plugin locale nel runtime app-server di destinazione.
- Abilitato: la configurazione OpenClaw è disposta a rendere il plugin disponibile ai turni
  dell'harness Codex.
- Accessibile: Codex app-server conferma che le voci app del plugin sono disponibili
  per l'account attivo e possono essere mappate all'identità del plugin migrata.

La migrazione è il passaggio durevole di installazione/idoneità. L'inventario delle app a runtime è il
controllo di accessibilità. La configurazione della sessione dell'harness Codex calcola quindi una
configurazione restrittiva delle app del thread per le app dei plugin abilitate e accessibili.

La configurazione delle app del thread viene calcolata quando OpenClaw stabilisce una sessione dell'harness Codex
o sostituisce un binding del thread Codex obsoleto. Non viene ricalcolata a ogni turno.

## Ambito del supporto V1

V1 è intenzionalmente ristretto:

- Solo i plugin `openai-curated` che erano già installati nell'inventario Codex
  app-server di origine sono idonei alla migrazione.
- La migrazione scrive identità di plugin esplicite con `marketplaceName` e
  `pluginName`; non scrive percorsi cache `marketplacePath` locali.
- `codexPlugins.enabled` è l'interruttore globale di abilitazione.
- Non esiste alcun wildcard `plugins["*"]` e nessuna chiave di configurazione che conceda autorità
  di installazione arbitraria.
- Marketplace non supportati, bundle di plugin memorizzati nella cache, hook e file di configurazione Codex
  vengono preservati nel report di migrazione per revisione manuale.

## Inventario delle app e proprietà

OpenClaw legge l'inventario delle app Codex tramite app-server `app/list`, lo memorizza nella cache per
un'ora e aggiorna in modo asincrono le voci obsolete o mancanti.

Un'app plugin viene esposta solo quando OpenClaw può ricondurla al plugin migrato
tramite proprietà stabile:

- id app esatto dal dettaglio del plugin
- nome server MCP noto
- metadati stabili univoci

La proprietà basata solo sul nome visualizzato o ambigua viene esclusa finché il successivo aggiornamento dell'inventario
non dimostra la proprietà.

## Configurazione delle app del thread

OpenClaw inietta una patch `config.apps` restrittiva per il thread Codex:
`_default` è disabilitato e sono abilitate solo le app possedute da plugin migrati abilitati.

OpenClaw imposta `destructive_enabled` a livello di app dalla policy globale effettiva o
per-plugin `allow_destructive_actions` e lascia che Codex applichi
i metadati degli strumenti distruttivi dalle annotazioni native degli strumenti app. La configurazione app `_default`
è disabilitata con `open_world_enabled: false`. Le app dei plugin abilitate
vengono emesse con `open_world_enabled: true`; OpenClaw non espone una manopola di policy
open-world separata per i plugin e non mantiene elenchi di esclusione per nome
degli strumenti distruttivi per-plugin.

La modalità di approvazione degli strumenti richiede conferma per impostazione predefinita per le app plugin, perché OpenClaw non
ha un'interfaccia utente interattiva di app-elicitation in questo percorso nello stesso thread.

## Policy delle azioni distruttive

Le elicitation distruttive dei plugin falliscono in modo chiuso per impostazione predefinita:

- Il valore predefinito globale di `allow_destructive_actions` è `false`.
- `allow_destructive_actions` per-plugin sovrascrive la policy globale per quel
  plugin.
- Quando la policy è `false`, OpenClaw restituisce un rifiuto deterministico.
- Quando la policy è `true`, OpenClaw accetta automaticamente solo schemi sicuri che può mappare a
  una risposta di approvazione, come un campo booleano di approvazione.
- Identità del plugin mancante, proprietà ambigua, id turno mancante, id turno
  errato o schema di elicitation non sicuro causano un rifiuto invece di una richiesta di conferma.

## Risoluzione dei problemi

**`auth_required`:** la migrazione ha installato il plugin, ma una delle sue app necessita ancora
di autenticazione. La voce esplicita del plugin viene scritta come disabilitata finché non la
riautorizzi e la abiliti.

**`marketplace_missing` o `plugin_missing`:** il Codex app-server di destinazione
non può vedere il marketplace o il plugin `openai-curated` previsto. Riesegui la migrazione
contro il runtime di destinazione o ispeziona lo stato dei plugin di Codex app-server.

**`app_inventory_missing` o `app_inventory_stale`:** la prontezza dell'app proveniva da una
cache vuota o obsoleta. OpenClaw pianifica un aggiornamento asincrono ed esclude le app dei plugin
finché proprietà e prontezza non sono note.

**`app_ownership_ambiguous`:** l'inventario delle app corrispondeva solo per nome visualizzato, quindi
l'app non viene esposta al thread Codex.

**La configurazione è cambiata ma l'agente non vede il plugin:** usa `/new`, `/reset` oppure
riavvia il gateway. I binding dei thread Codex esistenti mantengono la configurazione delle app con cui
sono stati avviati finché OpenClaw non stabilisce una nuova sessione dell'harness o sostituisce un
binding obsoleto.

**L'azione distruttiva viene rifiutata:** controlla i valori globali e per-plugin
`allow_destructive_actions`. Anche quando la policy è true, gli schemi di elicitation
non sicuri e l'identità ambigua del plugin continuano a fallire in modo chiuso.

## Correlati

- [harness Codex](/it/plugins/codex-harness)
- [Riferimento dell'harness Codex](/it/plugins/codex-harness-reference)
- [Runtime dell'harness Codex](/it/plugins/codex-harness-runtime)
- [Riferimento di configurazione](/it/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI migrate](/it/cli/migrate)
