---
doc-schema-version: 1
read_when:
    - Installazione o configurazione dei plugin
    - Comprendere le regole di individuazione e caricamento dei plugin
    - Utilizzo di pacchetti di Plugin compatibili con Codex/Claude
sidebarTitle: Getting Started
summary: Installa, configura e gestisci i Plugin di OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-07-12T07:34:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9de5b54c1c7b8ecf789816aa909ee1538de4295f0503a1ea9eecd535077a7cbc
    source_path: tools/plugin.md
    workflow: 16
---

I Plugin estendono OpenClaw con canali, provider di modelli, harness per agenti, strumenti,
Skills, sintesi vocale, trascrizione in tempo reale, voce, comprensione dei contenuti multimediali, generazione,
recupero web, ricerca web e altre funzionalità di runtime.

Usa questa pagina per installare un Plugin, riavviare il Gateway, verificare che il runtime
lo abbia caricato e risolvere i comuni errori di configurazione. Per esempi relativi ai soli comandi, consulta
[Gestire i Plugin](/it/plugins/manage-plugins). Per l'inventario generato dei
Plugin inclusi, esterni ufficiali e disponibili solo come sorgente, consulta
[Inventario dei Plugin](/it/plugins/plugin-inventory).

## Requisiti

- un checkout o un'installazione di OpenClaw con la CLI `openclaw` disponibile
- accesso di rete alla sorgente selezionata (ClawHub, npm o un host git)
- eventuali credenziali, chiavi di configurazione o strumenti del sistema operativo specifici del Plugin indicati dalla
  relativa documentazione di configurazione
- autorizzazione per ricaricare o riavviare il Gateway che gestisce i tuoi canali

## Avvio rapido

<Steps>
  <Step title="Trova il Plugin">
    Cerca in [ClawHub](/clawhub) i pacchetti Plugin pubblici:

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub è il principale punto di ricerca dei Plugin della community. Durante la
    transizione del lancio, le normali specifiche di pacchetto semplici vengono ancora installate da npm, a meno che
    non corrispondano all'ID di un Plugin ufficiale. Le specifiche `@openclaw/*` non elaborate che corrispondono a un
    Plugin incluso vengono risolte nella relativa copia inclusa. Usa un prefisso di sorgente esplicito
    quando ti serve specificamente una determinata sorgente.

  </Step>

  <Step title="Installa il Plugin">
    ```bash
    # Da ClawHub.
    openclaw plugins install clawhub:<package>

    # Da npm.
    openclaw plugins install npm:<package>

    # Da git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # Da un checkout di sviluppo locale.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    Considera le installazioni dei Plugin come l'esecuzione di codice. Per installazioni
    di produzione riproducibili, preferisci versioni bloccate.

  </Step>

  <Step title="Configuralo e abilitalo">
    Configura le impostazioni specifiche del Plugin in `plugins.entries.<id>.config`.
    Abilita il Plugin se non è già abilitato:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Se `plugins.allow` è impostato, l'ID del Plugin installato deve essere presente nell'elenco
    prima che il Plugin possa essere caricato. `openclaw plugins install` aggiunge l'ID
    installato a un elenco `plugins.allow` esistente e rimuove lo stesso ID da
    `plugins.deny`, in modo che l'installazione esplicita possa essere caricata dopo il riavvio.

  </Step>

  <Step title="Consenti il ricaricamento del Gateway">
    L'installazione, l'aggiornamento o la disinstallazione del codice di un Plugin richiede il riavvio del
    Gateway. Un Gateway gestito con il ricaricamento della configurazione abilitato rileva la modifica
    del record di installazione del Plugin e si riavvia automaticamente. Altrimenti, riavvialo
    manualmente:

    ```bash
    openclaw gateway restart
    ```

    L'abilitazione o la disabilitazione aggiorna la configurazione e il registro a freddo. Un'ispezione del runtime
    resta comunque la prova più chiara delle superfici attive del runtime.

  </Step>

  <Step title="Verifica la registrazione nel runtime">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Usa `--runtime` per verificare strumenti, hook, servizi, metodi del Gateway
    o comandi CLI di proprietà del Plugin registrati. Un semplice `inspect` controlla soltanto
    il manifest e il registro a freddo.

  </Step>
</Steps>

## Configurazione

### Scegli una sorgente di installazione

| Sorgente    | Usala quando                                                                    | Esempio                                                        |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | Vuoi ricerca nativa di OpenClaw, scansioni, metadati delle versioni e indicazioni per l'installazione | `openclaw plugins install clawhub:<package>`                   |
| npm         | Ti servono flussi di lavoro diretti con il registro npm o i dist-tag           | `openclaw plugins install npm:<package>`                       |
| git         | Ti serve un branch, un tag o un commit da un repository                        | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| percorso locale | Stai sviluppando o testando un Plugin sulla stessa macchina                | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Stai installando un Plugin di marketplace compatibile con Claude               | `openclaw plugins install <plugin> --marketplace <source>`     |

Le specifiche di pacchetto semplici hanno un comportamento speciale di compatibilità: un nome semplice che
corrisponde all'ID di un Plugin incluso usa la relativa sorgente inclusa; un nome semplice che corrisponde
all'ID di un Plugin esterno ufficiale usa il catalogo ufficiale dei pacchetti; qualsiasi altra
specifica semplice viene installata tramite npm durante la transizione del lancio. Anche le specifiche `@openclaw/*`
non elaborate che corrispondono a Plugin inclusi vengono risolte nella copia inclusa prima del
fallback su npm. Usa `npm:@openclaw/<plugin>@<version>` per installare intenzionalmente il
pacchetto npm esterno invece della copia inclusa. Usa `clawhub:`, `npm:`,
`git:` o `npm-pack:` per selezionare la sorgente in modo deterministico. Consulta
[`openclaw plugins`](/it/cli/plugins#install) per il contratto completo del comando.

Per le installazioni npm, le specifiche senza versione bloccata e `@latest` selezionano il pacchetto stabile
più recente che dichiara la compatibilità con questa build di OpenClaw. Se la
versione latest corrente di npm dichiara un `openclaw.compat.pluginApi` o
`openclaw.install.minHostVersion` più recente di quanto supportato da questa build, OpenClaw esamina
le versioni stabili precedenti e installa la più recente compatibile. Le versioni esatte
e i tag di canale espliciti, come `@beta`, restano vincolati al pacchetto selezionato
e non riescono se incompatibili.

### Criteri di installazione dell'operatore

Configura `security.installPolicy` per eseguire un comando di criteri locale attendibile
prima che proceda l'installazione o l'aggiornamento di un Plugin. Il comando riceve i metadati e
il percorso della sorgente predisposta e può consentire o bloccare l'installazione. Si applica sia ai percorsi
di installazione/aggiornamento della CLI sia a quelli supportati dal Gateway. Gli hook `before_install` del Plugin vengono eseguiti
successivamente e solo nei processi OpenClaw in cui sono caricati gli hook dei Plugin; usa quindi
`security.installPolicy` per le decisioni di installazione di competenza dell'operatore. Il
flag deprecato `--dangerously-force-unsafe-install` è accettato per
compatibilità, ma non esegue alcuna operazione: non aggira i criteri di installazione né l'elenco di esclusione
integrato di OpenClaw per le dipendenze dei Plugin.

Consulta [Configurazione delle Skills](/it/tools/skills-config#operator-install-policy-securityinstallpolicy)
per lo schema exec condiviso di `security.installPolicy`, usato sia dalle Skills sia dai
Plugin.

### Configura i criteri dei Plugin

La struttura comune della configurazione dei Plugin è:

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    slots: { memory: "memory-core" },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

Regole principali dei criteri:

- `plugins.enabled: false` disabilita tutti i Plugin e ignora le operazioni di rilevamento/caricamento.
  I riferimenti obsoleti ai Plugin restano inerti finché questa opzione è attiva; riabilita
  i Plugin prima di eseguire la pulizia con doctor se vuoi rimuovere gli ID obsoleti.
- `plugins.deny` prevale sull'elenco delle autorizzazioni e sull'abilitazione dei singoli Plugin.
- `plugins.allow` è un elenco esclusivo di autorizzazioni. Gli strumenti di proprietà dei Plugin non inclusi
  nell'elenco restano non disponibili anche quando `tools.allow` include `"*"`.
- `plugins.entries.<id>.enabled: false` disabilita un singolo Plugin mantenendone la
  configurazione.
- `plugins.load.paths` aggiunge file o directory locali di Plugin espliciti.
  I percorsi locali gestiti da `plugins install` devono essere directory o
  archivi di Plugin; usa `plugins.load.paths` per file Plugin autonomi.
- I Plugin provenienti dall'area di lavoro sono disabilitati per impostazione predefinita; abilitali esplicitamente o
  aggiungili all'elenco delle autorizzazioni prima di usare codice dell'area di lavoro locale.
- I Plugin inclusi seguono i relativi metadati integrati di attivazione/disattivazione predefinita,
  a meno che la configurazione non li sovrascriva esplicitamente.
- `plugins.slots.<slot>` (`memory` o `contextEngine`) seleziona un Plugin per una
  categoria esclusiva. La selezione dello slot conta come attivazione esplicita e
  abilita forzatamente il Plugin selezionato per quello slot, anche se altrimenti
  richiederebbe l'attivazione esplicita. `plugins.deny` e `plugins.entries.<id>.enabled: false`
  continuano a bloccarlo.
- I Plugin inclusi che richiedono l'attivazione esplicita possono attivarsi automaticamente quando la configurazione indica una delle
  superfici di loro proprietà, come un riferimento a provider/modello, la configurazione di un canale, un backend CLI
  o il runtime di un harness per agenti.
- L'instradamento Codex della famiglia OpenAI mantiene separati i confini tra provider e Plugin di runtime:
  i riferimenti legacy ai modelli Codex sono configurazioni legacy che doctor corregge,
  mentre il Plugin `codex` incluso gestisce il runtime app-server Codex per
  i riferimenti canonici agli agenti `openai/*`, `agentRuntime.id: "codex"` esplicito e
  i riferimenti legacy `codex/*`.

Quando `plugins.allow` non è impostato e i Plugin non inclusi vengono rilevati automaticamente
dall'area di lavoro o dalle radici globali dei Plugin, all'avvio viene registrato
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
con gli ID dei Plugin rilevati e, per elenchi brevi, un frammento minimo di `plugins.allow`.
Esegui [`openclaw plugins list --enabled --verbose`](/it/cli/plugins#list)
o [`openclaw plugins inspect <id>`](/it/cli/plugins#inspect) sull'ID del
Plugin elencato prima di copiare i Plugin attendibili in `openclaw.json`. Lo stesso
vincolo di attendibilità si applica quando la diagnostica indica che un Plugin è stato caricato
`without install/load-path provenance`: ispeziona l'ID del Plugin, quindi aggiungilo a
`plugins.allow` oppure reinstallalo da una sorgente attendibile affinché OpenClaw registri la
provenienza dell'installazione.

Esegui `openclaw doctor` o `openclaw doctor --fix` quando la convalida della configurazione
segnala ID di Plugin obsoleti, incongruenze tra elenchi di autorizzazioni e strumenti o percorsi legacy dei Plugin
inclusi.

## Comprendere i formati dei Plugin

OpenClaw riconosce due formati di Plugin:

| Formato                | Modalità di caricamento                                                        | Usalo quando                                                            |
| ---------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Plugin OpenClaw nativo | `openclaw.plugin.json` più un modulo di runtime caricato nel processo          | Stai installando o creando funzionalità di runtime specifiche di OpenClaw |
| Bundle compatibile     | Layout di Plugin Codex, Claude o Cursor mappato nell'inventario dei Plugin di OpenClaw | Stai riutilizzando Skills, comandi, hook o metadati di bundle compatibili |

Entrambi i formati compaiono in `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` e `openclaw plugins disable`. Consulta
[Bundle di Plugin](/it/plugins/bundles) per i limiti di compatibilità dei bundle e
[Creazione di Plugin](/it/plugins/building-plugins) per la creazione di Plugin nativi.

## Hook dei Plugin

I Plugin possono registrare hook in fase di runtime tramite due API diverse:

- hook tipizzati `api.on(...)` per gli eventi del ciclo di vita del runtime. Questa è la
  superficie preferita per middleware, criteri, riscrittura dei messaggi, strutturazione dei prompt
  e controllo degli strumenti.
- `api.registerHook(...)` per il sistema di hook interno descritto in
  [Hook](/it/automation/hooks). Serve principalmente per effetti collaterali generali sui comandi o sul ciclo di vita
  e per la compatibilità con l'automazione esistente in stile HOOK.

Regola rapida: se il gestore necessita di priorità, semantica di unione o
comportamento di blocco/annullamento, usa gli hook tipizzati. Se reagisce soltanto a `command:new`,
`command:reset`, `message:sent` o eventi generali simili, `api.registerHook`
è adeguato.

Gli hook interni gestiti dai Plugin compaiono in `openclaw hooks list` con
`plugin:<id>`. Non puoi abilitarli o disabilitarli tramite `openclaw hooks`;
abilita o disabilita invece il Plugin.

## Verifica il Gateway attivo

`openclaw plugins list` e un semplice `openclaw plugins inspect` leggono lo stato a freddo di configurazione,
manifest e registro. Non dimostrano che un Gateway già in esecuzione
abbia importato lo stesso codice del Plugin.

Quando un Plugin risulta installato ma il traffico della chat in tempo reale non lo utilizza:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

I Gateway gestiti si riavviano automaticamente dopo modifiche di installazione, aggiornamento e
disinstallazione che alterano il codice sorgente del plugin. Nelle installazioni su VPS o container, assicurati
che qualsiasi riavvio manuale interessi l'effettivo processo figlio `openclaw gateway run` che
serve i tuoi canali, non soltanto un wrapper o un supervisore.

## Risoluzione dei problemi

| Sintomo                                                        | Verifica                                                                                                                                      | Soluzione                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Il plugin appare in `plugins list`, ma gli hook di runtime non vengono eseguiti  | Usa `openclaw plugins inspect <id> --runtime --json` e verifica il Gateway attivo con `gateway status --deep --require-rpc`             | Riavvia il Gateway attivo dopo modifiche di installazione, aggiornamento, configurazione o codice sorgente                               |
| Vengono visualizzate diagnostiche di proprietà duplicate di canali o strumenti         | Esegui `openclaw plugins list --enabled --verbose`, esamina ogni plugin sospetto con `--runtime --json` e confronta la proprietà di canali/strumenti | Disabilita uno dei proprietari, rimuovi le installazioni obsolete oppure usa `preferOver` nel manifest per una sostituzione intenzionale      |
| La configurazione indica che manca un plugin                                | Consulta l'[inventario dei plugin](/it/plugins/plugin-inventory) per verificare se è incluso, ufficiale esterno o disponibile solo come codice sorgente                           | Installa il pacchetto esterno, abilita il plugin incluso oppure rimuovi la configurazione obsoleta                         |
| La configurazione non è valida durante l'installazione                               | Leggi il messaggio di convalida ed esegui `openclaw doctor --fix` se indica uno stato obsoleto del plugin                                             | Doctor può mettere in quarantena la configurazione non valida del plugin disabilitando la voce e rimuovendo il payload non valido     |
| Il percorso del plugin è bloccato a causa di proprietà o autorizzazioni sospette | Esamina la diagnostica che precede l'errore di configurazione                                                                                             | Correggi la proprietà e le autorizzazioni del file system, quindi esegui `openclaw plugins registry --refresh`                    |
| `OPENCLAW_NIX_MODE=1` blocca i comandi del ciclo di vita                | Verifica che l'installazione sia gestita da Nix                                                                                                      | Modifica la selezione dei plugin nel codice sorgente Nix anziché usare i comandi di modifica dei plugin                      |
| L'importazione delle dipendenze non riesce durante il runtime                             | Verifica se il plugin è stato installato tramite npm/git/ClawHub o caricato da un percorso locale                                                 | Esegui `openclaw plugins update <id>`, reinstalla il codice sorgente oppure installa autonomamente le dipendenze del plugin locale |

Quando la configurazione obsoleta del plugin indica ancora un plugin di canale non più rilevabile,
la convalida della configurazione declassa la relativa chiave del canale ad avviso anziché generare un
errore irreversibile, in modo che all'avvio il Gateway possa comunque servire tutti gli altri canali. Esegui
`openclaw doctor --fix` per rimuovere le voci obsolete del plugin e del canale. Le chiavi
di canale sconosciute senza prove di plugin obsoleti continuano a causare il fallimento della convalida, così gli errori di battitura
restano visibili.

Per la sostituzione intenzionale di un canale, il plugin preferito deve dichiarare
`channelConfigs.<channel-id>.preferOver` con l'id del plugin precedente o con priorità
inferiore. Se entrambi i plugin sono esplicitamente abilitati, OpenClaw conserva tale richiesta
e segnala diagnostiche di proprietà duplicate di canali/strumenti anziché scegliere
silenziosamente un proprietario.

Se un pacchetto installato segnala che `requires compiled runtime output for
TypeScript entry ...`, il pacchetto è stato pubblicato senza i file JavaScript
necessari a OpenClaw durante il runtime. Aggiornalo o reinstallalo dopo che l'editore avrà distribuito
il codice JavaScript compilato, oppure disabilita o disinstalla il plugin fino ad allora.

### Proprietà bloccata del percorso del plugin

Se le diagnostiche indicano
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
e la convalida prosegue con `plugin present but blocked`, OpenClaw ha trovato
file del plugin appartenenti a un utente Unix diverso da quello del processo che li carica.
Mantieni la configurazione del plugin; correggi la proprietà nel file system oppure esegui OpenClaw
con lo stesso utente proprietario della directory di stato.

Per le installazioni Docker, l'immagine ufficiale viene eseguita come `node` (uid `1000`), pertanto le
directory di configurazione e dell'area di lavoro di OpenClaw montate dall'host dovrebbero normalmente
appartenere all'uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Se esegui intenzionalmente OpenClaw come root, assegna invece a root la proprietà
della radice gestita dei plugin:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Dopo aver corretto la proprietà, esegui nuovamente `openclaw doctor --fix` oppure
`openclaw plugins registry --refresh`, affinché il registro persistente dei plugin
corrisponda ai file corretti.

### Configurazione lenta degli strumenti dei plugin

Se le interazioni dell'agente sembrano bloccarsi durante la preparazione degli strumenti, abilita la registrazione a livello trace
e cerca le righe relative ai tempi delle factory degli strumenti dei plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Cerca:

```text
[trace:plugin-tools] factory timings ...
```

Il riepilogo elenca il tempo totale delle factory e le factory degli strumenti dei plugin più lente,
inclusi l'id del plugin, i nomi degli strumenti dichiarati, la struttura del risultato e l'eventuale
carattere facoltativo dello strumento. Le righe lente vengono promosse ad avvisi quando una singola factory impiega
almeno 1 s oppure la preparazione complessiva delle factory degli strumenti dei plugin richiede almeno 5 s.

OpenClaw memorizza nella cache i risultati corretti delle factory degli strumenti dei plugin per risoluzioni
ripetute con lo stesso contesto effettivo della richiesta. La chiave della cache include
la configurazione effettiva del runtime, l'area di lavoro e l'id dell'agente, i criteri della sandbox, le impostazioni
del browser, il contesto di consegna, l'identità del richiedente e lo stato della proprietà, pertanto
le factory che dipendono da questi campi attendibili vengono eseguite nuovamente quando cambia il contesto.
Se i tempi restano elevati, il plugin potrebbe eseguire operazioni onerose prima
di restituire le definizioni dei propri strumenti.

Se un plugin domina i tempi, esaminane le registrazioni di runtime:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Quindi aggiorna, reinstalla o disabilita tale plugin. Gli autori dei plugin dovrebbero spostare
il caricamento oneroso delle dipendenze nel percorso di esecuzione dello strumento, anziché eseguirlo
all'interno della factory dello strumento.

Per le radici delle dipendenze, la convalida dei metadati dei pacchetti, i record del registro, il comportamento
di ricaricamento all'avvio e la pulizia delle risorse obsolete, consulta
[Risoluzione delle dipendenze dei plugin](/it/plugins/dependency-resolution).

## Contenuti correlati

- [Gestire i plugin](/it/plugins/manage-plugins) - esempi di comandi per elencare, installare, aggiornare, disinstallare e pubblicare
- [`openclaw plugins`](/it/cli/plugins) - riferimento completo della CLI
- [Inventario dei plugin](/it/plugins/plugin-inventory) - elenco generato dei plugin inclusi ed esterni
- [Riferimento dei plugin](/it/plugins/reference) - pagine di riferimento generate per ciascun plugin
- [Plugin della community](/it/plugins/community) - individuazione tramite ClawHub e criteri per le PR della documentazione
- [Risoluzione delle dipendenze dei plugin](/it/plugins/dependency-resolution) - radici di installazione, record del registro e confini del runtime
- [Creazione di plugin](/it/plugins/building-plugins) - guida alla creazione di plugin nativi
- [Panoramica dell'SDK dei plugin](/it/plugins/sdk-overview) - registrazione del runtime, hook e campi API
- [Manifest del plugin](/it/plugins/manifest) - manifest e metadati del pacchetto
