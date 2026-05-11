---
read_when:
    - Vuoi che gli agenti OpenClaw in modalità Codex utilizzino i plugin nativi di Codex
    - Stai migrando Plugin Codex curati da OpenAI installati da sorgente
    - Stai risolvendo problemi relativi a codexPlugins, inventario delle app, azioni distruttive o diagnostica delle app dei Plugin
summary: Configura i plugin Codex nativi migrati per gli agenti OpenClaw in modalità Codex
title: Plugin Codex nativi
x-i18n:
    generated_at: "2026-05-11T20:32:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64e8f552e65b3f1c1c62bc1ba1abfc1bf592d1bdc7fbbe2a484f3eb9955159f0
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Il supporto nativo dei plugin Codex consente a un agente OpenClaw in modalità Codex di usare
le capacità di app e plugin proprie di Codex app-server all'interno dello stesso thread Codex che
gestisce il turno OpenClaw.

OpenClaw non traduce i plugin Codex in strumenti dinamici OpenClaw sintetici
`codex_plugin_*`. Le chiamate ai plugin restano nella trascrizione Codex nativa, e
Codex app-server gestisce l'esecuzione MCP supportata dall'app.

Usa questa pagina dopo che il [Codex harness](/it/plugins/codex-harness) di base funziona.

## Requisiti

- Il runtime dell'agente OpenClaw selezionato deve essere il Codex harness nativo.
- `plugins.entries.codex.enabled` deve essere true.
- `plugins.entries.codex.config.codexPlugins.enabled` deve essere true.
- La V1 supporta solo plugin `openai-curated` che la migrazione ha rilevato come
  installati dall'origine nella home Codex sorgente.
- Il Codex app-server di destinazione deve poter vedere il marketplace,
  il plugin e l'inventario delle app previsti.

`codexPlugins` non ha effetto sulle esecuzioni PI, sulle normali esecuzioni del provider OpenAI, sui binding
di conversazione ACP o su altri harness, perché quei percorsi non creano
thread Codex app-server con configurazione `apps` nativa.

## Avvio rapido

Visualizza in anteprima la migrazione dalla home Codex sorgente:

```bash
openclaw migrate codex --dry-run
```

Applica la migrazione quando il piano sembra corretto:

```bash
openclaw migrate apply codex --yes
```

La migrazione scrive voci `codexPlugins` esplicite per i plugin idonei e chiama
`plugin/install` di Codex app-server per i plugin selezionati. Una tipica
configurazione migrata ha questo aspetto:

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
le future sessioni del Codex harness partano con il set di app aggiornato.

## Come funziona la configurazione nativa dei plugin

L'integrazione ha tre stati separati:

- Installato: Codex ha il bundle del plugin locale nel runtime app-server di destinazione.
- Abilitato: la configurazione OpenClaw consente di rendere il plugin disponibile ai
  turni del Codex harness.
- Accessibile: Codex app-server conferma che le voci app del plugin sono disponibili
  per l'account attivo e possono essere mappate all'identità del plugin migrata.

La migrazione è il passaggio durevole di installazione/idoneità. L'inventario delle app a runtime è il
controllo di accessibilità. La configurazione della sessione del Codex harness calcola quindi una
configurazione app di thread restrittiva per le app dei plugin abilitate e accessibili.

La configurazione app di thread viene calcolata quando OpenClaw stabilisce una sessione del Codex harness
o sostituisce un binding di thread Codex obsoleto. Non viene ricalcolata a ogni turno.

## Limite di supporto V1

La V1 è intenzionalmente ristretta:

- Solo i plugin `openai-curated` già installati nell'inventario app-server Codex
  sorgente sono idonei alla migrazione.
- La migrazione scrive identità di plugin esplicite con `marketplaceName` e
  `pluginName`; non scrive percorsi di cache `marketplacePath` locali.
- `codexPlugins.enabled` è l'interruttore di abilitazione globale.
- Non esiste alcun jolly `plugins["*"]` e nessuna chiave di configurazione che conceda autorità
  di installazione arbitraria.
- Marketplace non supportati, bundle di plugin memorizzati nella cache, hook e file di configurazione Codex
  vengono conservati nel report di migrazione per la revisione manuale.

## Inventario delle app e proprietà

OpenClaw legge l'inventario delle app Codex tramite `app/list` di app-server, lo memorizza nella cache per
un'ora e aggiorna in modo asincrono le voci obsolete o mancanti.

Un'app di plugin viene esposta solo quando OpenClaw può ricondurla al plugin migrato
tramite proprietà stabile:

- ID app esatto dai dettagli del plugin
- nome server MCP noto
- metadati stabili univoci

La proprietà basata solo sul nome visualizzato o ambigua viene esclusa finché il successivo aggiornamento
dell'inventario non dimostra la proprietà.

## Configurazione app di thread

OpenClaw inietta una patch `config.apps` restrittiva per il thread Codex:
`_default` è disabilitata e vengono abilitate solo le app possedute da plugin migrati abilitati.

OpenClaw imposta `destructive_enabled` a livello di app dalla policy globale o
per plugin effettiva `allow_destructive_actions` e lascia che Codex applichi
i metadati degli strumenti distruttivi dalle annotazioni native degli strumenti app. La configurazione app `_default`
è disabilitata con `open_world_enabled: false`. Le app plugin abilitate
vengono emesse con `open_world_enabled: true`; OpenClaw non espone un controllo di policy
open-world separato per plugin e non mantiene liste di negazione dei nomi degli strumenti distruttivi
per plugin.

La modalità di approvazione degli strumenti è automatica per impostazione predefinita per le app plugin, così gli strumenti di lettura
non distruttivi possono essere eseguiti senza un'interfaccia di approvazione nello stesso thread. Gli strumenti distruttivi restano
controllati dalla policy `destructive_enabled` di ciascuna app.

## Policy per le azioni distruttive

Le elicitazioni distruttive dei plugin falliscono in modo chiuso per impostazione predefinita:

- `allow_destructive_actions` globale ha valore predefinito `false`.
- `allow_destructive_actions` per plugin sovrascrive la policy globale per quel
  plugin.
- Quando la policy è `false`, OpenClaw restituisce un rifiuto deterministico.
- Quando la policy è `true`, OpenClaw accetta automaticamente solo schemi sicuri che può mappare a
  una risposta di approvazione, ad esempio un campo booleano di approvazione.
- Identità del plugin mancante, proprietà ambigua, ID turno mancante, ID turno
  errato o schema di elicitazione non sicuro causano un rifiuto invece di una richiesta.

## Risoluzione dei problemi

**`auth_required`:** la migrazione ha installato il plugin, ma una delle sue app richiede ancora
l'autenticazione. La voce esplicita del plugin viene scritta disabilitata finché non
riautorizzi e la abiliti.

**`marketplace_missing` o `plugin_missing`:** il Codex app-server di destinazione
non può vedere il marketplace o il plugin `openai-curated` previsto. Riesegui la migrazione
rispetto al runtime di destinazione oppure ispeziona lo stato del plugin in Codex app-server.

**`app_inventory_missing` o `app_inventory_stale`:** la prontezza dell'app proveniva da una
cache vuota o obsoleta. OpenClaw pianifica un aggiornamento asincrono ed esclude le app
dei plugin finché proprietà e prontezza non sono note.

**`app_ownership_ambiguous`:** l'inventario app corrispondeva solo per nome visualizzato, quindi
l'app non viene esposta al thread Codex.

**La configurazione è cambiata ma l'agente non vede il plugin:** usa `/new`, `/reset` oppure
riavvia il gateway. I binding di thread Codex esistenti mantengono la configurazione app con cui
sono stati avviati finché OpenClaw non stabilisce una nuova sessione harness o sostituisce un
binding obsoleto.

**L'azione distruttiva viene rifiutata:** controlla i valori globale e per plugin
di `allow_destructive_actions`. Anche quando la policy è true, schemi di elicitazione
non sicuri e identità del plugin ambigua falliscono comunque in modo chiuso.

## Correlati

- [Codex harness](/it/plugins/codex-harness)
- [Riferimento Codex harness](/it/plugins/codex-harness-reference)
- [Runtime Codex harness](/it/plugins/codex-harness-runtime)
- [Riferimento della configurazione](/it/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI di migrazione](/it/cli/migrate)
