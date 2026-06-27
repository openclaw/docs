---
read_when:
    - Vuoi che gli agenti OpenClaw in modalità Codex usino Plugin Codex nativi
    - Stai migrando Plugin Codex selezionati da OpenAI installati da sorgente
    - Stai risolvendo problemi relativi a codexPlugins, inventario delle app, azioni distruttive o diagnostica delle app dei plugin
summary: Configura i Plugin Codex nativi migrati per gli agenti OpenClaw in modalità Codex
title: Plugin Codex nativi
x-i18n:
    generated_at: "2026-06-27T17:48:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 82d8eb7ca7c10db5220c49426f5e9db5992ee751d48b2ac8c89e93773fc87776
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Il supporto nativo dei plugin Codex consente a un agente OpenClaw in modalità Codex di usare le funzionalità di app e plugin proprie dell'app-server Codex all'interno dello stesso thread Codex che gestisce il turno OpenClaw.

OpenClaw non traduce i plugin Codex in strumenti dinamici OpenClaw sintetici `codex_plugin_*`. Le chiamate ai plugin restano nella trascrizione Codex nativa e l'app-server Codex possiede l'esecuzione MCP supportata dall'app.

Usa questa pagina dopo che l'[harness Codex](/it/plugins/codex-harness) di base funziona.

## Requisiti

- Il runtime agente OpenClaw selezionato deve essere l'harness Codex nativo.
- `plugins.entries.codex.enabled` deve essere true.
- `plugins.entries.codex.config.codexPlugins.enabled` deve essere true.
- La V1 supporta solo plugin `openai-curated` che la migrazione ha osservato come installati da sorgente nella home Codex sorgente.
- L'app-server Codex di destinazione deve poter vedere l'inventario previsto di marketplace, plugin e app.

`codexPlugins` non ha effetto sulle esecuzioni OpenClaw, sulle normali esecuzioni del provider OpenAI, sui binding di conversazione ACP o su altri harness, perché quei percorsi non creano thread dell'app-server Codex con configurazione `apps` nativa.

L'accesso a Codex lato OpenAI, la disponibilità delle app e i controlli delle app/dei plugin del workspace provengono dall'account Codex autenticato. Per il modello di account OpenAI e amministrazione, consulta [Using Codex with your ChatGPT plan](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Avvio rapido

Anteprima della migrazione dalla home Codex sorgente:

```bash
openclaw migrate codex --dry-run
```

Usa la verifica rigorosa delle app sorgente quando vuoi che la migrazione controlli l'accessibilità delle app sorgente prima di pianificare l'attivazione dei plugin nativi:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Applica la migrazione quando il piano sembra corretto:

```bash
openclaw migrate apply codex --yes
```

La migrazione scrive voci `codexPlugins` esplicite per i plugin idonei e chiama `plugin/install` dell'app-server Codex per i plugin selezionati. Una tipica configurazione migrata ha questo aspetto:

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

Dopo aver modificato `codexPlugins`, le nuove conversazioni Codex acquisiscono automaticamente il set di app aggiornato. Usa `/new` o `/reset` per aggiornare la conversazione corrente. Non è necessario riavviare il Gateway per modifiche di abilitazione o disabilitazione dei plugin.

## Gestire i plugin dalla chat

Usa `/codex plugins` quando vuoi ispezionare o modificare i plugin Codex nativi configurati dalla stessa chat in cui usi l'harness Codex:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` è un alias di `/codex plugins list`. L'output dell'elenco mostra le chiavi dei plugin configurati, lo stato attivo/disattivo, il nome del plugin Codex e il marketplace da `plugins.entries.codex.config.codexPlugins.plugins`.

`enable` e `disable` scrivono solo nella configurazione OpenClaw in `~/.openclaw/openclaw.json`; non modificano `~/.codex/config.toml` né installano nuovi plugin Codex. Solo il proprietario o un client Gateway con ambito `operator.admin` può modificare lo stato dei plugin.

Abilitare un plugin configurato attiva anche l'interruttore globale `codexPlugins.enabled`. Se il plugin è stato scritto come disabilitato perché la migrazione ha restituito `auth_required`, riautorizza l'app in Codex prima di abilitarla in OpenClaw.

## Come funziona la configurazione dei plugin nativi

L'integrazione ha tre stati separati:

- Installato: Codex ha il bundle del plugin locale nel runtime app-server di destinazione.
- Abilitato: la configurazione OpenClaw è disposta a rendere il plugin disponibile ai turni dell'harness Codex.
- Accessibile: l'app-server Codex conferma che le voci app del plugin sono disponibili per l'account attivo e possono essere mappate all'identità del plugin migrata.

La migrazione è il passaggio durevole di installazione/idoneità. Durante la pianificazione, OpenClaw legge i dettagli `plugin/read` di Codex sorgente e controlla che la risposta dell'account dell'app-server Codex sorgente sia un account con abbonamento ChatGPT. Le risposte account non ChatGPT o mancanti saltano i plugin supportati da app con `codex_subscription_required`. Per impostazione predefinita, la migrazione non chiama `app/list` sorgente; i plugin sorgente supportati da app che superano il gate dell'account vengono pianificati senza verifica dell'accessibilità delle app sorgente, e gli errori di trasporto della ricerca account vengono saltati con `codex_account_unavailable`. Con `--verify-plugin-apps`, la migrazione acquisisce uno snapshot `app/list` sorgente nuovo e richiede che ogni app posseduta sia presente, abilitata e accessibile prima di pianificare l'attivazione nativa. In quella modalità, gli errori di trasporto della ricerca account passano al gate dell'inventario app sorgente. L'inventario app di runtime è il controllo di accessibilità della sessione di destinazione dopo la migrazione. La configurazione della sessione dell'harness Codex calcola quindi una configurazione app del thread restrittiva per le app dei plugin abilitate e accessibili.

La configurazione app del thread viene calcolata quando OpenClaw stabilisce una sessione dell'harness Codex o sostituisce un binding di thread Codex obsoleto. Non viene ricalcolata a ogni turno, quindi `/codex plugins enable` e `/codex plugins disable` influenzano le nuove conversazioni Codex. Usa `/new` o `/reset` quando la conversazione corrente deve acquisire il set di app aggiornato.

## Perimetro di supporto V1

La V1 è intenzionalmente limitata:

- Solo i plugin `openai-curated` già installati nell'inventario dell'app-server Codex sorgente sono idonei alla migrazione.
- I plugin sorgente supportati da app devono superare il gate dell'abbonamento al momento della migrazione. `--verify-plugin-apps` aggiunge il gate dell'inventario app sorgente. Gli account bloccati dall'abbonamento e, in modalità di verifica, le app sorgente inaccessibili, disabilitate o mancanti oppure gli errori di aggiornamento dell'inventario app sorgente vengono segnalati come elementi manuali saltati invece che come voci di configurazione abilitate. I dettagli plugin non leggibili vengono saltati prima del gate dell'inventario app sorgente.
- La migrazione scrive identità plugin esplicite con `marketplaceName` e `pluginName`; non scrive percorsi di cache `marketplacePath` locali.
- `codexPlugins.enabled` è l'interruttore di abilitazione globale.
- Non esiste alcun carattere jolly `plugins["*"]` e nessuna chiave di configurazione che conceda autorità di installazione arbitraria.
- Marketplace non supportati, bundle plugin memorizzati nella cache, hook e file di configurazione Codex vengono preservati nel report di migrazione per revisione manuale.

## Inventario app e proprietà

OpenClaw legge l'inventario app Codex tramite `app/list` dell'app-server, lo memorizza nella cache per un'ora e aggiorna in modo asincrono le voci obsolete o mancanti. La cache è solo in memoria; riavviare la CLI o il Gateway la elimina, e OpenClaw la ricostruisce dalla lettura `app/list` successiva.

Migrazione e runtime usano chiavi di cache separate:

- La verifica della migrazione sorgente usa la home Codex sorgente e le opzioni di avvio dell'app-server sorgente. Questa viene eseguita solo quando `--verify-plugin-apps` è impostato, e forza un attraversamento `app/list` sorgente nuovo per quella pianificazione.
- La configurazione del runtime di destinazione usa l'identità dell'app-server Codex dell'agente di destinazione quando crea la configurazione app del thread Codex. L'attivazione del plugin invalida quella chiave di cache di destinazione e poi la aggiorna forzatamente dopo `plugin/install`.

Un'app plugin viene esposta solo quando OpenClaw può ricondurla al plugin migrato tramite proprietà stabile:

- id app esatto dal dettaglio plugin
- nome server MCP noto
- metadati stabili univoci

La proprietà basata solo sul nome visualizzato o ambigua viene esclusa finché il successivo aggiornamento dell'inventario non dimostra la proprietà.

## Configurazione app del thread

OpenClaw inietta una patch `config.apps` restrittiva per il thread Codex: `_default` è disabilitata e solo le app possedute da plugin migrati abilitati sono abilitate.

OpenClaw imposta `destructive_enabled` a livello app dalla policy globale effettiva o per plugin `allow_destructive_actions` e lascia che Codex applichi i metadati degli strumenti distruttivi dalle annotazioni native degli strumenti app. `true`, `"auto"` e `"always"` impostano `destructive_enabled: true`; `false` lo imposta a false. La configurazione app `_default` è disabilitata con `open_world_enabled: false`. Le app plugin abilitate vengono emesse con `open_world_enabled: true`; OpenClaw non espone una manopola di policy open-world separata per plugin e non mantiene elenchi di negazione dei nomi degli strumenti distruttivi per plugin.

La modalità di approvazione degli strumenti è automatica per impostazione predefinita per le app plugin, così gli strumenti di lettura non distruttivi possono essere eseguiti senza un'interfaccia di approvazione nello stesso thread. Gli strumenti distruttivi restano controllati dalla policy `destructive_enabled` di ciascuna app.

## Policy delle azioni distruttive

Le elicitazioni distruttive dei plugin sono consentite per impostazione predefinita per i plugin Codex migrati, mentre gli schemi non sicuri e la proprietà ambigua continuano a fallire in modo chiuso:

- `allow_destructive_actions` globale predefinito è `true`.
- `allow_destructive_actions` per plugin sovrascrive la policy globale per quel plugin.
- Quando la policy è `false`, OpenClaw restituisce un rifiuto deterministico.
- Quando la policy è `true`, OpenClaw accetta automaticamente solo schemi sicuri che può mappare a una risposta di approvazione, come un campo booleano di approvazione.
- Quando la policy è `"auto"`, OpenClaw espone le azioni distruttive dei plugin a Codex ma trasforma le elicitazioni di approvazione MCP con proprietà dimostrata in approvazioni plugin OpenClaw prima di restituire la risposta di approvazione Codex.
- Quando la policy è `"always"`, OpenClaw usa lo stesso gating Codex di scrittura/distruttivo di `"auto"`, cancella gli override durevoli di approvazione per strumento Codex per l'app prima dell'avvio del thread e offre solo approvazione o negazione una tantum, così le approvazioni durevoli non possono sopprimere i prompt successivi per azioni di scrittura.
- Identità plugin mancante, proprietà ambigua, id turno mancante, id turno errato o schema di elicitazione non sicuro rifiutano invece di chiedere conferma.

## Risoluzione dei problemi

**`auth_required`:** la migrazione ha installato il plugin, ma una delle sue app richiede ancora autenticazione. La voce plugin esplicita viene scritta come disabilitata finché non la riautorizzi e la abiliti.

**`app_inaccessible`, `app_disabled` o `app_missing`:**
la migrazione non ha installato il plugin perché l'inventario app Codex sorgente non mostrava tutte le app possedute come presenti, abilitate e accessibili mentre `--verify-plugin-apps` era impostato. Riautorizza o abilita l'app in Codex, quindi riesegui la migrazione con `--verify-plugin-apps`.

**`app_inventory_unavailable`:** la migrazione non ha installato il plugin perché è stata richiesta la verifica rigorosa delle app sorgente e l'aggiornamento dell'inventario app Codex sorgente non è riuscito. Correggi l'accesso all'app-server Codex sorgente o riprova senza `--verify-plugin-apps` se accetti il piano più rapido basato sul gate dell'account.

**`codex_subscription_required`:** la migrazione non ha installato il plugin supportato da app perché l'account dell'app-server Codex sorgente non aveva effettuato l'accesso con un account con abbonamento ChatGPT. Accedi all'app Codex con autenticazione da abbonamento, quindi riesegui la migrazione.

**`codex_account_unavailable`:** la migrazione non ha installato il plugin supportato da app perché non è stato possibile leggere l'account dell'app-server Codex sorgente. Correggi l'autenticazione dell'app-server Codex sorgente o riesegui con `--verify-plugin-apps` se vuoi che l'inventario app sorgente decida l'idoneità quando la ricerca account fallisce.

**`marketplace_missing` o `plugin_missing`:** l'app-server Codex di destinazione non può vedere il marketplace o il plugin `openai-curated` previsto. Riesegui la migrazione rispetto al runtime di destinazione o ispeziona lo stato dei plugin dell'app-server Codex.

**`app_inventory_missing` o `app_inventory_stale`:** la prontezza app proveniva da una cache vuota o obsoleta. OpenClaw pianifica un aggiornamento asincrono ed esclude le app plugin finché proprietà e prontezza non sono note.

**`app_ownership_ambiguous`:** l'inventario app corrispondeva solo per nome visualizzato, quindi l'app non viene esposta al thread Codex.

**La configurazione è cambiata ma l'agente non vede il plugin:** usa `/codex plugins list` per confermare lo stato configurato, quindi usa `/new` o `/reset`. I binding di thread Codex esistenti mantengono la configurazione app con cui sono stati avviati finché OpenClaw non stabilisce una nuova sessione harness o sostituisce un binding obsoleto.

**Azione distruttiva rifiutata:** controlla i valori globali e per Plugin
`allow_destructive_actions`. Anche quando la policy è `true`, `"auto"` o
`"always"`, gli schemi di elicitation non sicuri e l'identità ambigua del Plugin continuano a fallire in modalità chiusa.

## Correlati

- [Harness Codex](/it/plugins/codex-harness)
- [Riferimento dell'harness Codex](/it/plugins/codex-harness-reference)
- [Runtime dell'harness Codex](/it/plugins/codex-harness-runtime)
- [Riferimento di configurazione](/it/gateway/configuration-reference#codex-harness-plugin-config)
- [Migra CLI](/it/cli/migrate)
