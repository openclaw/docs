---
doc-schema-version: 1
read_when:
    - Installazione o configurazione dei plugin
    - Comprendere le regole di individuazione e caricamento dei Plugin
    - Utilizzo dei bundle di Plugin compatibili con Codex/Claude
sidebarTitle: Getting Started
summary: Installa, configura e gestisci i plugin di OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-07-16T15:01:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cd6b19616c14fbbfcec47beca02f206d7a8ca9500c530d06958a30a9e5488bde
    source_path: tools/plugin.md
    workflow: 16
---

I Plugin estendono OpenClaw con canali, provider di modelli, harness per agenti, strumenti,
Skills, sintesi vocale, trascrizione in tempo reale, voce, comprensione dei contenuti multimediali, generazione,
recupero dal web, ricerca sul web e altre funzionalità di runtime.

Usare questa pagina per installare un Plugin, riavviare il Gateway, verificare che il runtime
lo abbia caricato e risolvere i comuni errori di configurazione. Per esempi relativi ai soli comandi, vedere
[Gestire i Plugin](/it/plugins/manage-plugins). Per l'inventario generato dei
Plugin inclusi, esterni ufficiali e disponibili solo come sorgente, vedere
[Inventario dei Plugin](/it/plugins/plugin-inventory).

## Requisiti

- un checkout o un'installazione di OpenClaw con la CLI `openclaw` disponibile
- accesso di rete alla sorgente selezionata (ClawHub, npm o un host git)
- eventuali credenziali, chiavi di configurazione o strumenti del sistema operativo specifici del Plugin indicati dalla
  documentazione di configurazione del Plugin
- autorizzazione per il Gateway che gestisce i canali a ricaricarsi o riavviarsi

## Avvio rapido

<Steps>
  <Step title="Trovare il Plugin">
    Cercare in [ClawHub](/clawhub) i pacchetti di Plugin pubblici:

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub è la superficie principale per individuare i Plugin della community. Durante la
    transizione del lancio, le normali specifiche di pacchetto senza prefisso continuano a essere installate da npm, a meno che
    non corrispondano all'id di un Plugin ufficiale. Le specifiche `@openclaw/*` non elaborate che corrispondono a un
    Plugin incluso vengono risolte nella relativa copia inclusa. Usare un prefisso di sorgente esplicito
    quando è necessaria una sorgente specifica.

  </Step>

  <Step title="Installare il Plugin">
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

    Considerare l'installazione di un Plugin come l'esecuzione di codice. Preferire versioni fissate per
    installazioni di produzione riproducibili. I pacchetti ClawHub e il catalogo
    incluso/ufficiale di OpenClaw sono sorgenti attendibili. Nuove sorgenti arbitrarie npm, git,
    percorso/archivio locale, `npm-pack:` o marketplace richiedono
    `--force` nelle installazioni non interattive, dopo aver
    esaminato la sorgente e averne verificato l'affidabilità.

  </Step>

  <Step title="Configurarlo e abilitarlo">
    Configurare le impostazioni specifiche del Plugin in `plugins.entries.<id>.config`.
    Abilitare il Plugin se non è già abilitato:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Se `plugins.allow` è impostato, l'id del Plugin installato deve essere presente in tale elenco
    prima che il Plugin possa essere caricato. `openclaw plugins install` aggiunge l'id
    installato a un elenco `plugins.allow` esistente e rimuove lo stesso id da
    `plugins.deny`, in modo che l'installazione esplicita possa essere caricata dopo il riavvio.

  </Step>

  <Step title="Consentire al Gateway di ricaricarsi">
    L'installazione, l'aggiornamento o la disinstallazione del codice di un Plugin richiede il riavvio del Gateway.
    Un Gateway gestito con la ricarica della configurazione abilitata rileva la modifica
    del record di installazione del Plugin e si riavvia automaticamente. In caso contrario, riavviarlo
    manualmente:

    ```bash
    openclaw gateway restart
    ```

    L'abilitazione/disabilitazione aggiorna la configurazione e il registro a freddo. Un'ispezione del runtime
    rimane comunque la prova più chiara delle superfici attive del runtime.

  </Step>

  <Step title="Verificare la registrazione nel runtime">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Usare `--runtime` per verificare strumenti, hook, servizi, metodi del Gateway
    o comandi CLI di proprietà del Plugin registrati. Il semplice `inspect` è solo un controllo
    a freddo del manifesto e del registro.

  </Step>
</Steps>

## Configurazione

### Scegliere una sorgente di installazione

| Sorgente    | Quando usarla                                                                  | Esempio                                                        |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | Se si desiderano individuazione nativa di OpenClaw, scansioni, metadati delle versioni e suggerimenti di installazione | `openclaw plugins install clawhub:<package>`                   |
| npm         | Se sono necessari flussi di lavoro diretti con il registro npm o i dist-tag    | `openclaw plugins install npm:<package>`                       |
| git         | Se è necessario un branch, un tag o un commit da un repository                 | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| percorso locale | Se si sta sviluppando o testando un Plugin sulla stessa macchina           | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Se si sta installando un Plugin marketplace compatibile con Claude             | `openclaw plugins install <plugin> --marketplace <source>`     |

Le specifiche di pacchetto senza prefisso hanno un comportamento di compatibilità speciale: un nome senza prefisso che
corrisponde all'id di un Plugin incluso usa la relativa sorgente inclusa; un nome senza prefisso che corrisponde
all'id di un Plugin esterno ufficiale usa il catalogo ufficiale dei pacchetti; qualsiasi altra
specifica senza prefisso viene installata tramite npm durante la transizione del lancio. Anche le specifiche
`@openclaw/*` non elaborate che corrispondono a Plugin inclusi vengono risolte nella copia inclusa prima del
fallback su npm. Usare `npm:@openclaw/<plugin>@<version>` per installare deliberatamente il
pacchetto npm esterno anziché la copia inclusa. Usare `clawhub:`, `npm:`,
`git:` o `npm-pack:` per una selezione deterministica della sorgente. Vedere
[`openclaw plugins`](/it/cli/plugins#install) per il contratto completo del comando.

Per le installazioni npm, le specifiche senza versione fissata e `@latest` selezionano il pacchetto
stabile più recente che dichiara compatibilità con questa build di OpenClaw. Se la versione
latest corrente di npm dichiara un `openclaw.compat.pluginApi` o
`openclaw.install.minHostVersion` più recente di quello supportato da questa build, OpenClaw esamina
le versioni stabili precedenti e installa la più recente compatibile. Le versioni esatte
e i tag di canale espliciti come `@beta` rimangono fissati al pacchetto selezionato
e generano un errore in caso di incompatibilità.

### Criteri di installazione dell'operatore

Configurare `security.installPolicy` per eseguire un comando di criteri locale attendibile
prima di procedere con l'installazione o l'aggiornamento di un Plugin. I criteri ricevono i metadati e
il percorso della sorgente preparata e possono consentire o bloccare l'installazione. Si applicano sia ai percorsi
di installazione/aggiornamento tramite CLI sia a quelli gestiti dal Gateway. Gli hook `before_install` del Plugin vengono eseguiti
successivamente e solo nei processi OpenClaw in cui vengono caricati gli hook dei Plugin; usare quindi
`security.installPolicy` per le decisioni di installazione di competenza dell'operatore. Il flag
obsoleto `--dangerously-force-unsafe-install` è accettato per
compatibilità, ma non esegue alcuna operazione: non elude i criteri di installazione né l'elenco di esclusione
integrato di OpenClaw per le dipendenze dei Plugin.

Vedere [Configurazione delle Skills](/it/tools/skills-config#operator-install-policy-securityinstallpolicy)
per lo schema exec condiviso `security.installPolicy` usato sia dalle Skills sia dai
Plugin.

### Configurare i criteri dei Plugin

La struttura comune di configurazione dei Plugin è:

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

- `plugins.enabled: false` disabilita tutti i Plugin e ignora il lavoro di individuazione/caricamento.
  I riferimenti obsoleti ai Plugin rimangono inattivi mentre questa opzione è attiva; riabilitare
  i Plugin prima di eseguire la pulizia con doctor se si desidera rimuovere gli id obsoleti.
- `plugins.deny` ha la precedenza sull'elenco delle autorizzazioni e sull'abilitazione dei singoli Plugin.
- `plugins.allow` è un elenco esclusivo di autorizzazioni. Gli strumenti di proprietà dei Plugin non presenti
  nell'elenco rimangono indisponibili anche quando `tools.allow` include `"*"`.
- `plugins.entries.<id>.enabled: false` disabilita un singolo Plugin mantenendone
  la configurazione.
- `plugins.load.paths` aggiunge file o directory locali espliciti dei Plugin.
  I percorsi locali `plugins install` gestiti devono essere directory o
  archivi di Plugin; usare `plugins.load.paths` per file di Plugin autonomi.
- I Plugin provenienti dal workspace sono disabilitati per impostazione predefinita; abilitarli esplicitamente o
  aggiungerli all'elenco delle autorizzazioni prima di usare il codice del workspace locale.
- I Plugin inclusi seguono i metadati integrati di attivazione/disattivazione predefinita,
  a meno che la configurazione non li sostituisca esplicitamente.
- `plugins.slots.<slot>` (`memory` o `contextEngine`) seleziona un Plugin per una
  categoria esclusiva. La selezione dello slot conta come attivazione esplicita e
  forza l'abilitazione del Plugin selezionato per quello slot, anche se altrimenti
  richiederebbe l'attivazione esplicita. `plugins.deny` e `plugins.entries.<id>.enabled: false` continuano
  a bloccarlo.
- I Plugin inclusi che richiedono attivazione esplicita possono attivarsi automaticamente quando la configurazione indica una delle
  superfici di loro proprietà, come un riferimento a provider/modello, la configurazione di un canale, un backend CLI
  o il runtime di un harness per agenti.
- L'instradamento Codex della famiglia OpenAI mantiene separati i confini tra provider e Plugin
  di runtime: i riferimenti legacy ai modelli Codex sono configurazioni legacy che doctor corregge,
  mentre il Plugin incluso `codex` gestisce il runtime del server applicativo Codex per
  i riferimenti canonici agli agenti `openai/*`, `agentRuntime.id: "codex"` espliciti e
  i riferimenti legacy `codex/*`.

Quando `plugins.allow` non è impostato e i Plugin non inclusi vengono individuati automaticamente dal
workspace o dalle radici globali dei Plugin, all'avvio viene registrato
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
con gli id dei Plugin individuati e, per elenchi brevi, un frammento `plugins.allow`
minimo. Eseguire [`openclaw plugins list --enabled --verbose`](/it/cli/plugins#list)
o [`openclaw plugins inspect <id>`](/it/cli/plugins#inspect) sull'id del
Plugin elencato prima di copiare i Plugin attendibili in `openclaw.json`. Lo stesso
blocco basato sull'attendibilità si applica quando la diagnostica indica che un Plugin è stato caricato
`without install/load-path provenance`: ispezionare l'id del Plugin, quindi fissarlo in
`plugins.allow` oppure reinstallarlo da una sorgente attendibile affinché OpenClaw registri la
provenienza dell'installazione.

Eseguire `openclaw doctor` o `openclaw doctor --fix` quando la convalida della configurazione
segnala id di Plugin obsoleti, mancata corrispondenza tra elenco delle autorizzazioni e strumenti o percorsi legacy di Plugin
inclusi.

## Comprendere i formati dei Plugin

OpenClaw riconosce due formati di Plugin:

| Formato                | Modalità di caricamento                                                       | Quando usarlo                                                           |
| ---------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Plugin OpenClaw nativo | `openclaw.plugin.json` più un modulo di runtime caricato nel processo             | Se si installano o sviluppano funzionalità di runtime specifiche di OpenClaw |
| Bundle compatibile     | Layout di Plugin Codex, Claude o Cursor mappato nell'inventario dei Plugin di OpenClaw | Se si riutilizzano Skills, comandi, hook o metadati di bundle compatibili |

Entrambi i formati compaiono in `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` e `openclaw plugins disable`. Vedere
[Bundle di Plugin](/it/plugins/bundles) per il confine di compatibilità dei bundle e
[Creazione di Plugin](/it/plugins/building-plugins) per lo sviluppo di Plugin nativi.

## Hook dei Plugin

I Plugin possono registrare hook nel runtime tramite due API diverse:

- hook tipizzati `api.on(...)` per gli eventi del ciclo di vita del runtime. Questa è la
  superficie preferita per middleware, criteri, riscrittura dei messaggi, definizione
  dei prompt e controllo degli strumenti.
- `api.registerHook(...)` per il sistema di hook interno descritto in
  [Hook](/it/automation/hooks). È destinato principalmente a effetti collaterali generali di comandi/ciclo di vita
  e alla compatibilità con l'automazione esistente in stile HOOK.

Regola rapida: se il gestore richiede priorità, semantica di unione o
comportamento di blocco/annullamento, usare gli hook tipizzati. Se reagisce soltanto a `command:new`,
`command:reset`, `message:sent` o eventi generali simili, `api.registerHook`
è adeguato.

Gli hook interni gestiti dai Plugin compaiono in `openclaw hooks list` con
`plugin:<id>`. Non è possibile abilitarli o disabilitarli tramite `openclaw hooks`;
abilitare o disabilitare invece il Plugin.

## Verificare il Gateway attivo

`openclaw plugins list` e il semplice `openclaw plugins inspect` leggono la configurazione a freddo,
il manifest e lo stato del registro. Non dimostrano che un Gateway già in esecuzione
abbia importato lo stesso codice del plugin.

Quando un plugin risulta installato ma il traffico della chat in tempo reale non lo utilizza:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

I Gateway gestiti si riavviano automaticamente dopo modifiche di installazione, aggiornamento e
disinstallazione che alterano il codice sorgente del plugin. Nelle installazioni su VPS o container,
assicurarsi che qualsiasi riavvio manuale interessi il processo figlio `openclaw gateway run` effettivo
che gestisce i canali, non soltanto un wrapper o un supervisore.

## Risoluzione dei problemi

| Sintomo                                                        | Verifica                                                                                                                                      | Soluzione                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Il plugin appare in `plugins list`, ma gli hook di runtime non vengono eseguiti  | Usare `openclaw plugins inspect <id> --runtime --json` e confermare il Gateway attivo con `gateway status --deep --require-rpc`             | Riavviare il Gateway in esecuzione dopo modifiche di installazione, aggiornamento, configurazione o codice sorgente                               |
| Compaiono diagnostiche sulla proprietà duplicata di canali o strumenti         | Eseguire `openclaw plugins list --enabled --verbose`, esaminare ogni plugin sospetto con `--runtime --json` e confrontare la proprietà di canali/strumenti | Disabilitare uno dei proprietari, rimuovere le installazioni obsolete o usare `preferOver` nel manifest per la sostituzione intenzionale      |
| La configurazione indica che manca un plugin                                | Consultare l'[inventario dei plugin](/it/plugins/plugin-inventory) per verificare se è incluso, esterno ufficiale o disponibile solo come codice sorgente                           | Installare il pacchetto esterno, abilitare il plugin incluso o rimuovere la configurazione obsoleta                         |
| La configurazione non è valida durante l'installazione                               | Leggere il messaggio di convalida ed eseguire `openclaw doctor --fix` se indica uno stato obsoleto del plugin                                             | Doctor può mettere in quarantena la configurazione non valida del plugin disabilitando la voce e rimuovendo il payload non valido     |
| Il percorso del plugin è bloccato a causa di proprietà o autorizzazioni sospette | Esaminare la diagnostica che precede l'errore di configurazione                                                                                             | Correggere la proprietà e le autorizzazioni del file system, quindi eseguire `openclaw plugins registry --refresh`                    |
| `OPENCLAW_NIX_MODE=1` blocca i comandi del ciclo di vita                | Confermare che l'installazione sia gestita da Nix                                                                                                      | Modificare la selezione del plugin nel codice sorgente Nix anziché usare i comandi di modifica dei plugin                      |
| L'importazione di una dipendenza non riesce in fase di esecuzione                             | Verificare se il plugin è stato installato tramite npm/git/ClawHub o caricato da un percorso locale                                                 | Eseguire `openclaw plugins update <id>`, reinstallare il codice sorgente oppure installare manualmente le dipendenze del plugin locale |

Quando la configurazione obsoleta di un plugin indica ancora un plugin di canale non più
individuabile, la convalida della configurazione trasforma la chiave del canale in un avviso anziché
in un errore bloccante, così l'avvio del Gateway può continuare a gestire tutti gli altri canali. Eseguire
`openclaw doctor --fix` per rimuovere le voci obsolete del plugin e del canale. Le chiavi
di canale sconosciute senza prove di un plugin obsoleto continuano a non superare la convalida, così gli errori
di battitura restano visibili.

Per la sostituzione intenzionale di un canale, il plugin preferito deve dichiarare
`channelConfigs.<channel-id>.preferOver` con l'id del plugin precedente o con priorità
inferiore. Se entrambi i plugin sono abilitati esplicitamente, OpenClaw mantiene tale richiesta
e segnala diagnostiche sulla proprietà duplicata di canali/strumenti anziché scegliere
silenziosamente un proprietario.

Se un pacchetto installato segnala che `requires compiled runtime output for
TypeScript entry ...`, il pacchetto è stato pubblicato senza i file JavaScript
necessari a OpenClaw in fase di esecuzione. Aggiornarlo o reinstallarlo dopo che l'editore avrà distribuito
il JavaScript compilato, oppure disabilitare/disinstallare il plugin fino ad allora.

### Proprietà bloccata del percorso del plugin

Se la diagnostica indica
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
e la convalida prosegue con `plugin present but blocked`, OpenClaw ha rilevato
file del plugin appartenenti a un utente Unix diverso da quello del processo che li carica.
Mantenere invariata la configurazione del plugin; correggere la proprietà del file system oppure eseguire OpenClaw
con lo stesso utente proprietario della directory di stato.

Per le installazioni Docker, l'immagine ufficiale viene eseguita come `node` (uid `1000`), quindi le
directory di configurazione e dell'area di lavoro di OpenClaw montate dall'host dovrebbero normalmente
appartenere all'uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Se OpenClaw viene eseguito intenzionalmente come root, assegnare invece
a root la proprietà della directory principale gestita dei plugin:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Dopo aver corretto la proprietà, eseguire nuovamente `openclaw doctor --fix` o
`openclaw plugins registry --refresh`, affinché il registro persistente dei plugin
corrisponda ai file corretti.

### Configurazione lenta degli strumenti del plugin

Se i turni dell'agente sembrano bloccarsi durante la preparazione degli strumenti, abilitare i log di traccia
e verificare la presenza delle righe relative ai tempi delle factory degli strumenti del plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Cercare:

```text
[trace:plugin-tools] tempi delle factory ...
```

Il riepilogo elenca il tempo totale delle factory e le factory degli strumenti del plugin più lente,
inclusi l'id del plugin, i nomi degli strumenti dichiarati, la struttura del risultato e l'eventuale
carattere facoltativo dello strumento. Le righe lente vengono elevate ad avvisi quando una singola factory impiega
almeno 1s o la preparazione complessiva delle factory degli strumenti del plugin impiega almeno 5s.

OpenClaw memorizza nella cache i risultati riusciti delle factory degli strumenti del plugin per risoluzioni
ripetute con lo stesso contesto effettivo della richiesta. La chiave della cache include
la configurazione effettiva del runtime, l'area di lavoro e l'id dell'agente, la policy della sandbox, le impostazioni
del browser, il contesto di consegna, l'identità del richiedente e lo stato di proprietà, quindi
le factory che dipendono da questi campi attendibili vengono eseguite nuovamente quando cambia il contesto.
Se i tempi rimangono elevati, il plugin potrebbe eseguire operazioni costose prima
di restituire le definizioni dei propri strumenti.

Se un plugin domina i tempi, esaminarne le registrazioni di runtime:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Quindi aggiornare, reinstallare o disabilitare tale plugin. Gli autori dei plugin dovrebbero spostare
il caricamento oneroso delle dipendenze nel percorso di esecuzione dello strumento anziché effettuarlo
all'interno della factory dello strumento.

Per le directory principali delle dipendenze, la convalida dei metadati dei pacchetti, i record del registro, il comportamento
di ricaricamento all'avvio e la pulizia dei dati legacy, consultare
[Risoluzione delle dipendenze dei plugin](/it/plugins/dependency-resolution).

## Contenuti correlati

- [Gestire i plugin](/it/plugins/manage-plugins) - esempi di comandi per elencare, installare, aggiornare, disinstallare e pubblicare
- [`openclaw plugins`](/it/cli/plugins) - riferimento CLI completo
- [Inventario dei plugin](/it/plugins/plugin-inventory) - elenco generato dei plugin inclusi ed esterni
- [Riferimento dei plugin](/it/plugins/reference) - pagine di riferimento generate per ciascun plugin
- [Plugin della community](/it/plugins/community) - individuazione tramite ClawHub e policy per le PR della documentazione
- [Risoluzione delle dipendenze dei plugin](/it/plugins/dependency-resolution) - directory principali di installazione, record del registro e confini del runtime
- [Creazione di plugin](/it/plugins/building-plugins) - guida alla creazione di plugin nativi
- [Panoramica dell'SDK dei plugin](/it/plugins/sdk-overview) - registrazione del runtime, hook e campi API
- [Manifest del plugin](/it/plugins/manifest) - manifest e metadati del pacchetto
