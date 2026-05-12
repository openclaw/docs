---
read_when:
    - Vuoi che gli agenti OpenClaw in modalità Codex usino Plugin nativi di Codex
    - Stai migrando Plugin Codex curati da OpenAI installati dai sorgenti
    - Stai risolvendo problemi relativi a codexPlugins, all'inventario app, alle azioni distruttive o alla diagnostica delle app Plugin
summary: Configurare i Plugin Codex nativi migrati per gli agenti OpenClaw in modalità Codex
title: Plugin Codex nativi
x-i18n:
    generated_at: "2026-05-12T23:30:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: ddec40cd5f9a74b43d55f327cdcd7088e024392fbafc7f1aa5bd9b136d3ecc13
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Il supporto nativo dei Plugin Codex consente a un agente OpenClaw in modalità Codex di usare
le funzionalità di app e Plugin proprie dell'app-server Codex nello stesso thread Codex che
gestisce il turno OpenClaw.

OpenClaw non traduce i Plugin Codex in strumenti dinamici OpenClaw sintetici
`codex_plugin_*`. Le chiamate ai Plugin rimangono nella trascrizione nativa di Codex e
l'app-server Codex possiede l'esecuzione MCP supportata dall'app.

Usa questa pagina dopo che il [Codex harness](/it/plugins/codex-harness) di base funziona.

## Requisiti

- Il runtime dell'agente OpenClaw selezionato deve essere il Codex harness nativo.
- `plugins.entries.codex.enabled` deve essere true.
- `plugins.entries.codex.config.codexPlugins.enabled` deve essere true.
- V1 supporta solo Plugin `openai-curated` che la migrazione ha osservato come
  installati dalla sorgente nella home Codex di origine.
- L'app-server Codex di destinazione deve poter vedere il marketplace, il Plugin e l'inventario
  delle app previsti.

`codexPlugins` non ha effetto sulle esecuzioni PI, sulle normali esecuzioni del provider OpenAI, sui binding di conversazione ACP
o su altri harness perché quei percorsi non creano
thread dell'app-server Codex con configurazione `apps` nativa.

## Avvio rapido

Visualizza in anteprima la migrazione dalla home Codex di origine:

```bash
openclaw migrate codex --dry-run
```

Usa la verifica rigorosa delle app di origine quando vuoi che la migrazione controlli
l'accessibilità delle app di origine prima di pianificare l'attivazione nativa dei Plugin:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Applica la migrazione quando il piano sembra corretto:

```bash
openclaw migrate apply codex --yes
```

La migrazione scrive voci `codexPlugins` esplicite per i Plugin idonei e chiama
`plugin/install` dell'app-server Codex per i Plugin selezionati. Una tipica
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

Dopo aver modificato `codexPlugins`, usa `/new`, `/reset` oppure riavvia il Gateway affinché
le future sessioni del Codex harness partano con il set di app aggiornato.

## Come funziona la configurazione nativa dei Plugin

L'integrazione ha tre stati separati:

- Installato: Codex ha il bundle del Plugin locale nel runtime dell'app-server di destinazione.
- Abilitato: la configurazione OpenClaw è disposta a rendere disponibile il Plugin ai
  turni del Codex harness.
- Accessibile: l'app-server Codex conferma che le voci app del Plugin sono disponibili
  per l'account attivo e possono essere mappate all'identità del Plugin migrato.

La migrazione è il passaggio durevole di installazione/idoneità. Durante la pianificazione, OpenClaw
legge i dettagli `plugin/read` di Codex di origine e controlla che la risposta dell'account
dell'app-server Codex di origine sia un account con abbonamento ChatGPT. Le risposte di account non ChatGPT o
mancanti saltano i Plugin supportati da app con
`codex_subscription_required`. Per impostazione predefinita, la migrazione non chiama `app/list` di origine; i Plugin di origine
supportati da app che superano il gate dell'account vengono pianificati
senza verifica dell'accessibilità delle app di origine, e gli errori di trasporto della ricerca account
vengono saltati con `codex_account_unavailable`. Con `--verify-plugin-apps`,
la migrazione acquisisce una nuova snapshot `app/list` di origine e richiede che ogni app posseduta
sia presente, abilitata e accessibile prima di pianificare l'attivazione nativa. In
quella modalità, gli errori di trasporto della ricerca account passano al gate
dell'inventario app di origine. L'inventario app runtime è il controllo di accessibilità
della sessione di destinazione dopo la migrazione. La configurazione della sessione del Codex harness calcola quindi una
configurazione app di thread restrittiva per le app Plugin abilitate e accessibili.

La configurazione app del thread viene calcolata quando OpenClaw stabilisce una sessione del Codex harness
o sostituisce un binding di thread Codex obsoleto. Non viene ricalcolata a ogni turno.

## Limite di supporto V1

V1 è intenzionalmente ristretto:

- Solo i Plugin `openai-curated` che erano già installati nell'inventario
  dell'app-server Codex di origine sono idonei alla migrazione.
- I Plugin di origine supportati da app devono superare il gate di abbonamento al momento della migrazione.
  `--verify-plugin-apps` aggiunge il gate dell'inventario app di origine. Gli account soggetti a gate di abbonamento
  più, in modalità di verifica, app di origine inaccessibili, disabilitate, mancanti
  o errori di aggiornamento dell'inventario app di origine vengono segnalati come elementi manuali saltati
  invece che come voci di configurazione abilitate. I dettagli Plugin illeggibili vengono saltati
  prima del gate dell'inventario app di origine.
- La migrazione scrive identità Plugin esplicite con `marketplaceName` e
  `pluginName`; non scrive percorsi di cache `marketplacePath` locali.
- `codexPlugins.enabled` è l'interruttore globale di abilitazione.
- Non esiste un carattere jolly `plugins["*"]` e non esiste alcuna chiave di configurazione che conceda autorità
  di installazione arbitraria.
- Marketplace non supportati, bundle Plugin memorizzati nella cache, hook e file di configurazione Codex
  vengono conservati nel report di migrazione per revisione manuale.

## Inventario app e proprietà

OpenClaw legge l'inventario app Codex tramite `app/list` dell'app-server, lo memorizza nella cache per
un'ora e aggiorna in modo asincrono le voci obsolete o mancanti. La cache è
solo in memoria; il riavvio della CLI o del Gateway la elimina e OpenClaw la ricostruisce
dalla lettura `app/list` successiva.

Migrazione e runtime usano chiavi cache separate:

- La verifica della migrazione di origine usa la home Codex di origine e le opzioni di avvio dell'app-server
  di origine. Questa viene eseguita solo quando `--verify-plugin-apps` è impostato, e
  forza un nuovo attraversamento `app/list` di origine per quell'esecuzione di pianificazione.
- La configurazione del runtime di destinazione usa l'identità dell'app-server Codex dell'agente di destinazione quando
  costruisce la configurazione app del thread Codex. L'attivazione del Plugin invalida quella chiave
  cache di destinazione e poi la aggiorna forzatamente dopo `plugin/install`.

Un'app Plugin viene esposta solo quando OpenClaw può mapparla di nuovo al Plugin migrato
tramite proprietà stabile:

- ID app esatto dal dettaglio Plugin
- nome server MCP noto
- metadati stabili univoci

La proprietà basata solo sul nome visualizzato o ambigua è esclusa finché il successivo aggiornamento
dell'inventario non prova la proprietà.

## Configurazione app del thread

OpenClaw inietta una patch `config.apps` restrittiva per il thread Codex:
`_default` è disabilitato e solo le app possedute da Plugin migrati abilitati sono
abilitate.

OpenClaw imposta `destructive_enabled` a livello di app dalla policy globale effettiva o
per Plugin `allow_destructive_actions` e lascia che Codex applichi i metadati degli strumenti
distruttivi dalle annotazioni native degli strumenti app. La configurazione app `_default`
è disabilitata con `open_world_enabled: false`. Le app Plugin abilitate
vengono emesse con `open_world_enabled: true`; OpenClaw non espone una manopola di policy
open-world separata per Plugin e non mantiene elenchi di negazione per nome strumento distruttivo
per Plugin.

La modalità di approvazione strumenti è automatica per impostazione predefinita per le app Plugin, così gli strumenti
di lettura non distruttivi possono essere eseguiti senza una UI di approvazione nello stesso thread. Gli strumenti distruttivi rimangono
controllati dalla policy `destructive_enabled` di ciascuna app.

## Policy sulle azioni distruttive

Le elicitazioni distruttive dei Plugin sono consentite per impostazione predefinita per i Plugin Codex
migrati, mentre gli schemi non sicuri e la proprietà ambigua continuano a fallire in modo chiuso:

- `allow_destructive_actions` globale ha valore predefinito `true`.
- `allow_destructive_actions` per Plugin sovrascrive la policy globale per quel
  Plugin.
- Quando la policy è `false`, OpenClaw restituisce un rifiuto deterministico.
- Quando la policy è `true`, OpenClaw accetta automaticamente solo schemi sicuri che può mappare a
  una risposta di approvazione, come un campo booleano di approvazione.
- Identità Plugin mancante, proprietà ambigua, ID turno mancante, ID turno errato
  o schema di elicitazione non sicuro producono un rifiuto invece di una richiesta.

## Risoluzione dei problemi

**`auth_required`:** la migrazione ha installato il Plugin, ma una delle sue app ha ancora
bisogno di autenticazione. La voce Plugin esplicita viene scritta disabilitata finché non
autorizzi di nuovo e la abiliti.

**`app_inaccessible`, `app_disabled` o `app_missing`:**
la migrazione non ha installato il Plugin perché l'inventario app Codex di origine non
mostrava tutte le app possedute come presenti, abilitate e accessibili mentre
`--verify-plugin-apps` era impostato. Autorizza di nuovo o abilita l'app in Codex, quindi
riesegui la migrazione con `--verify-plugin-apps`.

**`app_inventory_unavailable`:** la migrazione non ha installato il Plugin perché
è stata richiesta la verifica rigorosa delle app di origine e l'aggiornamento dell'inventario
app Codex di origine non è riuscito. Correggi l'accesso all'app-server Codex di origine o riprova senza
`--verify-plugin-apps` se accetti il piano più rapido soggetto al gate dell'account.

**`codex_subscription_required`:** la migrazione non ha installato il Plugin
supportato da app perché l'account dell'app-server Codex di origine non aveva eseguito l'accesso con un
account con abbonamento ChatGPT. Accedi all'app Codex con autenticazione di abbonamento,
quindi riesegui la migrazione.

**`codex_account_unavailable`:** la migrazione non ha installato il Plugin supportato da app
perché non è stato possibile leggere l'account dell'app-server Codex di origine. Correggi l'autenticazione
dell'app-server Codex di origine o riesegui con `--verify-plugin-apps` se vuoi che l'inventario
app di origine decida l'idoneità quando la ricerca account fallisce.

**`marketplace_missing` o `plugin_missing`:** l'app-server Codex di destinazione
non può vedere il marketplace o il Plugin `openai-curated` previsto. Riesegui la migrazione
contro il runtime di destinazione o ispeziona lo stato dei Plugin dell'app-server Codex.

**`app_inventory_missing` o `app_inventory_stale`:** la prontezza delle app proveniva da una
cache vuota o obsoleta. OpenClaw pianifica un aggiornamento asincrono ed esclude le app
Plugin finché proprietà e prontezza non sono note.

**`app_ownership_ambiguous`:** l'inventario app corrispondeva solo per nome visualizzato, quindi
l'app non viene esposta al thread Codex.

**La configurazione è cambiata ma l'agente non vede il Plugin:** usa `/new`, `/reset`, oppure
riavvia il Gateway. I binding di thread Codex esistenti mantengono la configurazione app con cui
sono stati avviati finché OpenClaw non stabilisce una nuova sessione harness o sostituisce un
binding obsoleto.

**L'azione distruttiva viene rifiutata:** controlla i valori globali e per Plugin
`allow_destructive_actions`. Anche quando la policy è true, schemi di elicitazione non sicuri
e identità Plugin ambigua continuano a fallire in modo chiuso.

## Correlati

- [Codex harness](/it/plugins/codex-harness)
- [Riferimento Codex harness](/it/plugins/codex-harness-reference)
- [Runtime Codex harness](/it/plugins/codex-harness-runtime)
- [Riferimento di configurazione](/it/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI di migrazione](/it/cli/migrate)
