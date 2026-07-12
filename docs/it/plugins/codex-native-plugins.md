---
read_when:
    - Vuoi che gli agenti OpenClaw in modalità Codex utilizzino Plugin Codex nativi
    - Stai migrando i plugin Codex selezionati da OpenAI e installati dal codice sorgente
    - Stai configurando un Plugin Codex esistente nella directory dell’area di lavoro
    - Stai risolvendo problemi relativi a codexPlugins, all'inventario delle app, alle azioni distruttive o alla diagnostica delle app dei Plugin
summary: Configura i plugin Codex nativi per gli agenti OpenClaw in modalità Codex
title: Plugin nativi di Codex
x-i18n:
    generated_at: "2026-07-12T07:16:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b1cfa39838d4dbd1f33a1e5b7f52faec4b033f9fa98ef5c029003177c2e27e5
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Il supporto nativo dei Plugin Codex consente a un agente OpenClaw in modalità Codex di utilizzare le funzionalità di app e Plugin proprie di Codex
app-server all'interno dello stesso thread Codex che
gestisce il turno OpenClaw. Le chiamate ai Plugin rimangono nella trascrizione nativa di Codex;
Codex app-server gestisce l'esecuzione MCP basata sulle app. OpenClaw non converte
i Plugin Codex in strumenti dinamici OpenClaw sintetici `codex_plugin_*`.

Usa questa pagina dopo aver configurato correttamente l'[harness Codex](/it/plugins/codex-harness)
di base.

## Requisiti

- Il runtime dell'agente deve essere l'harness Codex nativo.
- `plugins.entries.codex.enabled` deve essere `true`.
- `plugins.entries.codex.config.codexPlugins.enabled` deve essere `true`.
- Il Codex app-server di destinazione deve poter visualizzare l'inventario previsto di marketplace, Plugin e
  app.
- La migrazione supporta solo i Plugin `openai-curated` rilevati come
  installati dall'origine nella home Codex di origine.
- I Plugin `workspace-directory` configurati manualmente richiedono un Codex app-server
  il cui `plugin/list` accetti `marketplaceKinds` e i cui riepiloghi dell'area di lavoro
  senza percorso includano `remotePluginId`. Il Plugin deve essere già installato e
  abilitato e le app di sua proprietà devono essere accessibili in `app/list`.

`codexPlugins` non ha effetto sulle esecuzioni del provider OpenClaw, sulle associazioni delle conversazioni
ACP o su altri harness, perché questi percorsi non creano mai thread Codex
app-server con una configurazione `apps` nativa.

L'account Codex lato OpenAI, la disponibilità delle app e i controlli sulle app e sui Plugin dell'area di lavoro
dipendono dall'account Codex con cui è stato effettuato l'accesso. Consulta
[Utilizzare Codex con il proprio piano ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
per il modello di account e amministrazione di OpenAI.

## Avvio rapido

Visualizza l'anteprima della migrazione dalla home Codex di origine:

```bash
openclaw migrate codex --dry-run
```

Aggiungi `--verify-plugin-apps` per fare in modo che la migrazione chiami `app/list` sull'origine e
richieda che ogni app di proprietà sia presente, abilitata e accessibile prima di
pianificare l'attivazione nativa:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Applica la migrazione quando il piano è corretto:

```bash
openclaw migrate apply codex --yes
```

La migrazione scrive voci `codexPlugins` esplicite per i Plugin idonei e
chiama `plugin/install` di Codex app-server per i Plugin selezionati. Una configurazione
migrata ha questo aspetto:

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

La migrazione rimane limitata a `openai-curated`. Per utilizzare un Plugin
`workspace-directory` esistente, aggiungilo manualmente con il valore esatto
`summary.id` qualificato dal marketplace restituito da `plugin/list`. Ad esempio, se
Codex restituisce `example-plugin@workspace-directory`, configura tale valore
completo anziché il relativo nome visualizzato:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            plugins: {
              "example-plugin": {
                enabled: true,
                marketplaceName: "workspace-directory",
                pluginName: "example-plugin@workspace-directory",
              },
            },
          },
        },
      },
    },
  },
}
```

OpenClaw non chiama `plugin/install` né avvia l'autenticazione per un
Plugin `workspace-directory`. Installalo, abilitalo ed esegui l'autenticazione in Codex
prima di aggiungere o abilitare il criterio di OpenClaw. OpenClaw mantiene nascoste le app quando
la risposta omette il marketplace esatto, l'ID del Plugin, l'ID dei dettagli o le prove
di disponibilità dell'app. Se Codex rifiuta la richiesta esplicita `plugin/list` dell'area di lavoro,
OpenClaw segnala `marketplace_missing` per ogni Plugin dell'area di lavoro abilitato e
mantiene disponibili gli eventuali Plugin selezionati rilevati in modo indipendente.

Dopo una modifica a `codexPlugins`, le nuove conversazioni Codex acquisiscono automaticamente
il set di app aggiornato. Esegui `/new` o `/reset` per aggiornare la conversazione
corrente. Non è necessario riavviare il Gateway per le modifiche di abilitazione o disabilitazione
dei Plugin.

## Gestire i Plugin dalla chat

`/codex plugins` esamina o modifica i Plugin Codex nativi configurati dalla
stessa chat in cui utilizzi l'harness Codex:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` è un alias di `/codex plugins list`. L'elenco mostra la chiave,
lo stato attivo/disattivo, il nome del Plugin Codex e il marketplace di ogni
Plugin configurato, ricavati da `plugins.entries.codex.config.codexPlugins.plugins`.

`enable`/`disable` scrivono solo in `~/.openclaw/openclaw.json`; non modificano mai
`~/.codex/config.toml` né installano nuovi Plugin Codex. Solo il proprietario o un
client Gateway con l'ambito `operator.admin` può eseguirli.

L'abilitazione di un Plugin configurato attiva anche l'opzione globale
`codexPlugins.enabled`. Se un Plugin selezionato è stato scritto come disabilitato perché la migrazione ha restituito
`auth_required`, autorizza nuovamente l'app in Codex prima di abilitarla in OpenClaw.
Per una voce `workspace-directory`, abilitarla qui modifica solo il criterio di OpenClaw;
il Plugin e l'app devono essere già attivi in Codex.

## Funzionamento della configurazione nativa dei Plugin

L'integrazione tiene traccia di tre stati:

| Stato      | Significato                                                                                                                            |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Installato  | Codex dispone del pacchetto del Plugin nel runtime app-server di destinazione.                                                                      |
| Abilitato    | Codex segnala che il Plugin è abilitato e la configurazione di OpenClaw lo consente per i turni dell'harness Codex.                                           |
| Accessibile | Codex app-server conferma che le voci dell'app del Plugin sono disponibili per l'account attivo e corrispondono all'identità del Plugin configurata. |

Per i Plugin `openai-curated`, la migrazione costituisce il passaggio permanente di installazione e verifica
dell'idoneità:

- Durante la pianificazione, OpenClaw legge i dettagli di `plugin/read` del Codex di origine e
  verifica che l'account Codex app-server di origine sia un account con abbonamento ChatGPT.
  Una risposta relativa a un account non ChatGPT o mancante esclude i Plugin
  basati su app con `codex_subscription_required`.
- Per impostazione predefinita, la migrazione non esegue la chiamata `app/list` sull'origine: i Plugin di origine
  basati su app che superano il controllo dell'account vengono pianificati senza verificare
  l'accessibilità dell'app di origine, mentre gli errori di trasporto durante la ricerca dell'account determinano l'esclusione
  con `codex_account_unavailable`.
- Con `--verify-plugin-apps`, la migrazione acquisisce una nuova istantanea `app/list`
  dall'origine e richiede che ogni app di proprietà sia presente, abilitata e
  accessibile prima di pianificare l'attivazione nativa. Gli errori di trasporto durante la ricerca
  dell'account passano quindi al controllo dell'inventario delle app di origine anziché
  causare direttamente l'esclusione.

Per i Plugin `workspace-directory`, la configurazione avviene al di fuori di OpenClaw. OpenClaw
interroga tale marketplace solo quando è configurata almeno una voce dell'area di lavoro abilitata,
risolve ogni Plugin tramite il valore esatto `summary.id` e riutilizza i controlli esistenti
della proprietà tramite `plugin/read` e della disponibilità tramite `app/list`. Un Plugin non installato,
disabilitato, inaccessibile o non autenticato non espone alcuna app; OpenClaw
non tenta l'installazione o l'autenticazione.

L'inventario delle app di runtime costituisce il controllo dell'accessibilità della sessione di destinazione sia per
i Plugin selezionati migrati sia per i Plugin dell'area di lavoro configurati manualmente. La configurazione
della sessione dell'harness Codex calcola una configurazione restrittiva delle app del thread a partire dalle app
dei Plugin abilitate e accessibili; non viene ricalcolata a ogni turno, pertanto
`/codex plugins enable`/`disable` influisce solo sulle
nuove conversazioni Codex. Usa `/new` o `/reset` per applicare la modifica alla
conversazione corrente.

## Limiti del supporto V1

- Solo i Plugin `openai-curated` già installati nell'inventario Codex
  app-server di origine sono idonei alla migrazione.
- Il runtime supporta anche voci `workspace-directory` esplicite nelle build app-server
  il cui `plugin/list` implementa `marketplaceKinds` e restituisce
  `remotePluginId` per i riepiloghi dell'area di lavoro senza percorso. Queste voci devono utilizzare
  il rispettivo valore esatto `summary.id` qualificato dal marketplace e devono essere già installate,
  abilitate e accessibili dall'app. Una richiesta rifiutata dell'elenco dell'area di lavoro produce
  la diagnostica `marketplace_missing` esistente per ogni Plugin; in assenza di prove relative a marketplace,
  Plugin, dettagli o app, non viene esposta alcuna app dell'area di lavoro. L'inventario selezionato
  derivante dalla richiesta di elenco predefinita rimane utilizzabile.
- I Plugin di origine basati su app devono superare il controllo dell'abbonamento al momento della migrazione.
  `--verify-plugin-apps` aggiunge il controllo dell'inventario delle app di origine. Gli account soggetti
  al controllo dell'abbonamento e, in modalità di verifica, le app di origine inaccessibili, disabilitate o mancanti
  oppure gli errori di aggiornamento dell'inventario delle app vengono segnalati come elementi manuali
  esclusi anziché come voci di configurazione abilitate. I dettagli dei Plugin illeggibili vengono
  esclusi prima del controllo dell'inventario delle app.
- La migrazione scrive identità esplicite dei Plugin (`marketplaceName` e
  `pluginName`); non scrive percorsi della cache locale `marketplacePath`.
- `codexPlugins.enabled` è l'unica opzione di abilitazione globale; non esistono
  caratteri jolly `plugins["*"]` né chiavi di configurazione che concedano un'autorità di installazione
  arbitraria.
- I marketplace non selezionati, i pacchetti dei Plugin memorizzati nella cache, gli hook e i file di configurazione
  di Codex vengono conservati nel rapporto di migrazione per la revisione manuale, non attivati
  automaticamente. Il runtime accetta voci `workspace-directory` configurate manualmente;
  gli altri marketplace non sono supportati.

## Inventario e proprietà delle app

OpenClaw legge l'inventario delle app Codex tramite `app/list` di app-server, lo memorizza
in memoria per un'ora e aggiorna in modo asincrono le voci obsolete o mancanti.
La cache è locale al processo; il riavvio della CLI o del Gateway
la elimina e OpenClaw la ricostruisce a partire dalla successiva lettura di `app/list`.

La migrazione e il runtime utilizzano chiavi di cache separate:

- La verifica della migrazione di origine utilizza la home Codex di origine e le opzioni di
  avvio. Viene eseguita solo con `--verify-plugin-apps` e forza un nuovo
  attraversamento di `app/list` dell'origine per tale esecuzione di pianificazione.
- La configurazione del runtime di destinazione utilizza l'identità Codex app-server dell'agente di destinazione durante
  la creazione della configurazione delle app del thread. L'attivazione del Plugin selezionato invalida tale
  chiave di cache di destinazione, quindi ne forza l'aggiornamento dopo `plugin/install`.
  La configurazione di `workspace-directory` non esegue mai questo percorso di attivazione.

Un'app di un Plugin viene esposta solo quando OpenClaw può ricondurla al Plugin configurato
tramite una proprietà stabile: un ID app esatto ricavato dai dettagli del Plugin, un nome
di server MCP noto o metadati stabili univoci. La proprietà basata unicamente sul nome
visualizzato o ambigua viene esclusa finché il successivo aggiornamento dell'inventario non ne dimostra la proprietà.

## App degli account connessi

Gli agenti gestiti dal proprietario possono scegliere di includere tutte le app già connesse al proprio account
Codex senza richiedere un pacchetto Plugin corrispondente:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_all_plugins: true,
            allow_destructive_actions: "auto",
          },
        },
      },
    },
  },
}
```

`allow_all_plugins: true` acquisisce un'istantanea completa di `app/list` quando viene creato un nuovo thread
Codex nativo e ammette solo le app contrassegnate come accessibili per tale
account. Non installa, autentica o abilita le app a livello globale. I thread
esistenti mantengono il proprio set di app persistente; usa `/new`, `/reset` o riavvia il
Gateway per acquisire le app appena connesse o revocate.

Le app dell'account ereditano il valore globale `codexPlugins.allow_destructive_actions`,
che accetta `true`, `false`, `"auto"` o `"ask"`. Il criterio esplicito per singolo Plugin
sostituisce il criterio globale per gli ID app sovrapposti. Gli errori dell'inventario determinano
una chiusura sicura anziché il ripiego su un'impostazione predefinita senza restrizioni.

## Configurazione delle app del thread

OpenClaw inserisce una patch restrittiva per `config.apps` nel thread Codex:
`_default` è disabilitato e sono abilitate solo le app appartenenti ai Plugin configurati e abilitati oppure le app dell'account accessibili ammesse da `allow_all_plugins`.

Il valore `destructive_enabled` di ciascuna app deriva dal criterio effettivo globale o per Plugin `allow_destructive_actions`; `true`, `"auto"` e `"ask"` impostano tutti `destructive_enabled: true`, mentre `false` lo imposta su `false`. Codex continua ad applicare i metadati degli strumenti distruttivi provenienti dalle annotazioni native degli strumenti dell'app.
`_default` è disabilitato con `open_world_enabled: false`; le app dei Plugin abilitati ricevono `open_world_enabled: true`. OpenClaw non espone un'impostazione separata a livello di Plugin per il criterio open-world e non mantiene elenchi di esclusione dei nomi degli strumenti distruttivi per ciascun Plugin.

La modalità di approvazione degli strumenti è automaticamente predefinita per le app ammesse, pertanto gli strumenti di lettura non distruttivi vengono eseguiti senza una richiesta di approvazione nello stesso thread. Gli strumenti distruttivi restano soggetti al criterio `destructive_enabled` di ciascuna app.

## Criterio per le azioni distruttive

Le richieste di conferma distruttive dei Plugin sono consentite per impostazione predefinita per i Plugin Codex configurati, mentre gli schemi non sicuri e la proprietà ambigua causano un rifiuto preventivo:

- Il valore globale predefinito di `allow_destructive_actions` è `true`.
- Il valore `allow_destructive_actions` per Plugin sostituisce il criterio globale per
  quel Plugin.
- `false`: OpenClaw restituisce un rifiuto deterministico.
- `true`: OpenClaw accetta automaticamente solo gli schemi sicuri che può associare a una risposta
  di approvazione, come un campo booleano di approvazione.
- `"auto"`: OpenClaw espone a Codex le azioni distruttive dei Plugin, quindi
  converte le richieste di approvazione MCP con proprietà verificata in approvazioni dei Plugin
  OpenClaw prima di restituire la risposta di approvazione di Codex.
- `"ask"`: OpenClaw usa lo stesso controllo di Codex per le operazioni di scrittura/distruttive adottato da
  `"auto"`, cancella le sostituzioni persistenti dell'approvazione per strumento di Codex relative all'app
  prima dell'avvio del thread e offre soltanto un'approvazione o un rifiuto una tantum, affinché
  le approvazioni persistenti non possano impedire le successive richieste per azioni di scrittura. Per ogni
  app ammessa che usa `"ask"`, OpenClaw seleziona il revisore umano delle approvazioni
  di Codex per tale app, in modo che Codex invii le proprie richieste di approvazione a
  OpenClaw; le altre app e le approvazioni del thread non relative alle app mantengono il revisore
  e il criterio configurati.
- L'assenza dell'identità del Plugin, una proprietà ambigua, un ID del turno mancante o non corrispondente
  oppure uno schema di richiesta non sicuro determinano un rifiuto anziché la visualizzazione di una richiesta.

## Risoluzione dei problemi

| Codice                                            | Significato                                                                                                                                    | Soluzione                                                                                                                     |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `auth_required`                                   | La migrazione ha installato il Plugin, ma una delle sue app richiede ancora l'autenticazione. La voce viene scritta come disabilitata finché non viene autorizzata nuovamente. | Autorizza nuovamente l'app in Codex, quindi abilita il Plugin in OpenClaw.                                                      |
| `app_inaccessible`, `app_disabled`, `app_missing` | Con `--verify-plugin-apps`, l'inventario delle app Codex di origine non mostrava tutte le app appartenenti al Plugin come presenti, abilitate e accessibili. | Autorizza nuovamente o abilita l'app in Codex, quindi riesegui la migrazione con `--verify-plugin-apps`.                        |
| `app_inventory_unavailable`                       | È stata richiesta una verifica rigorosa delle app di origine, ma l'aggiornamento dell'inventario delle app Codex di origine non è riuscito.      | Correggi l'accesso all'app-server Codex di origine oppure riprova senza `--verify-plugin-apps` per accettare il piano più rapido basato sull'account. |
| `codex_subscription_required`                     | L'account dell'app-server Codex di origine non era un account con abbonamento ChatGPT.                                                          | Accedi all'app Codex usando l'autenticazione dell'abbonamento, quindi riesegui la migrazione.                                  |
| `codex_account_unavailable`                       | Non è stato possibile leggere l'account dell'app-server Codex di origine.                                                                       | Correggi l'autenticazione dell'app-server Codex di origine oppure riesegui con `--verify-plugin-apps` affinché sia l'inventario delle app di origine a determinare l'idoneità. |
| `marketplace_missing`, `plugin_missing`           | Il marketplace o il Plugin esatto non è disponibile; la richiesta esplicita del catalogo dell'area di lavoro potrebbe essere stata rifiutata; le app dell'area di lavoro vengono escluse preventivamente. | Verifica il contratto compatibile dell'app-server e l'ID esatto descritti di seguito.                                          |
| `plugin_detail_unavailable`                       | OpenClaw non è riuscito a leggere i dettagli sulla proprietà del Plugin.                                                                        | Esamina le risposte `plugin/list` e `plugin/read` dell'app-server di destinazione.                                             |
| `plugin_disabled`                                 | Codex segnala che il Plugin è installato ma disabilitato.                                                                                       | L'attivazione curata potrebbe correggere il problema; abilita un Plugin dell'area di lavoro in Codex prima di riprovare.       |
| `plugin_activation_failed`                        | L'attivazione del Plugin non è stata completata.                                                                                                | Usa la diagnostica allegata per distinguere gli errori del marketplace, di autenticazione, di aggiornamento o di preparazione dell'area di lavoro. |
| `app_inventory_missing`, `app_inventory_stale`    | Lo stato di preparazione dell'app proviene da una cache vuota o obsoleta.                                                                        | OpenClaw pianifica automaticamente un aggiornamento asincrono; le app dei Plugin restano escluse finché proprietà e stato di preparazione non sono noti. |
| `app_ownership_ambiguous`                         | L'inventario delle app ha trovato una corrispondenza soltanto in base al nome visualizzato.                                                      | L'app resta nascosta al thread Codex finché un aggiornamento successivo non ne dimostra la proprietà.                          |

**Il Plugin dell'area di lavoro è installato ma non è visibile:** verifica che il risultato
`plugin/list` dell'area di lavoro riporti l'ID configurato esatto come installato e abilitato,
quindi verifica che `app/list` riporti ogni app appartenente al Plugin come accessibile per lo stesso
account Codex. OpenClaw può abilitare un'app accessibile per il thread anche quando
l'inventario dell'account segnala attualmente tale app come disabilitata. Se hai modificato questo stato dopo che il Gateway ha memorizzato nella cache l'inventario
delle app, attendi l'aggiornamento orario della cache oppure riavvia il Gateway, quindi usa
`/new` o `/reset`. OpenClaw non corregge né autentica i Plugin dell'area di lavoro.
Se la richiesta esplicita dell'elenco dell'area di lavoro viene rifiutata, ogni voce abilitata dell'area di lavoro
segnala `marketplace_missing`; le voci curate non correlate continuano a essere elaborate
in base alla risposta dell'elenco predefinito.

Per `plugin_detail_unavailable`, un riepilogo dell'area di lavoro privo di percorso deve includere
`remotePluginId`; OpenClaw mantiene nascoste le app appartenenti al Plugin quando tale selettore o il
successivo risultato `plugin/read` non è disponibile. Per
`plugin_activation_failed`, i Plugin curati possono segnalare un errore del marketplace, di autenticazione o
di aggiornamento successivo all'installazione. Un Plugin dell'area di lavoro segnala questo codice quando non è
già attivo; installalo, abilitalo e autenticalo al di fuori di OpenClaw.

**La configurazione è cambiata ma l'agente non riesce a vedere il Plugin:** esegui `/codex plugins
list` per verificare lo stato configurato, quindi `/new` o `/reset`. I collegamenti
esistenti dei thread Codex mantengono la configurazione delle app con cui sono stati avviati finché OpenClaw
non stabilisce una nuova sessione dell'harness o sostituisce un collegamento obsoleto.

**L'azione distruttiva viene rifiutata:** controlla i valori globali e per Plugin
di `allow_destructive_actions`. Anche con `true`, `"auto"` o `"ask"`,
gli schemi di richiesta non sicuri e un'identità ambigua del Plugin causano comunque un rifiuto preventivo.

## Contenuti correlati

- [Harness Codex](/it/plugins/codex-harness)
- [Riferimento dell'harness Codex](/it/plugins/codex-harness-reference)
- [Runtime dell'harness Codex](/it/plugins/codex-harness-runtime)
- [Riferimento della configurazione](/it/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI di migrazione](/it/cli/migrate)
