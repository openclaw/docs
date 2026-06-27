---
doc-schema-version: 1
read_when:
    - Installazione o configurazione dei Plugin
    - Comprendere le regole di scoperta e caricamento dei Plugin
    - Lavorare con bundle di plugin compatibili con Codex/Claude
sidebarTitle: Getting Started
summary: Installa, configura e gestisci i Plugin di OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-06-27T18:23:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61e0ddb164baba368fbf57883e7a72eddadc28cb100ed6c4f11977c55576513
    source_path: tools/plugin.md
    workflow: 16
---

I Plugin estendono OpenClaw con canali, provider di modelli, harness di agenti, strumenti,
skill, parlato, trascrizione in tempo reale, voce, comprensione dei media, generazione,
recupero web, ricerca web e altre capacità di runtime.

Usa questa pagina quando vuoi installare un Plugin, riavviare il Gateway, verificare
che il runtime lo abbia caricato e indirizzare gli errori comuni di configurazione. Per esempi
solo di comandi, vedi [Gestire i Plugin](/it/plugins/manage-plugins). Per l'inventario
generato completo dei Plugin inclusi, ufficiali esterni e solo sorgente, vedi
[Inventario dei Plugin](/it/plugins/plugin-inventory).

## Requisiti

Prima di installare un Plugin, assicurati di avere:

- un checkout o un'installazione di OpenClaw con la CLI `openclaw` disponibile
- accesso di rete alla sorgente selezionata, come ClawHub, npm o un host git
- eventuali credenziali, chiavi di configurazione o strumenti del sistema operativo specifici del Plugin indicati
  dalla documentazione di configurazione di quel Plugin
- autorizzazione per il Gateway che serve i tuoi canali a ricaricarsi o riavviarsi

## Avvio rapido

<Steps>
  <Step title="Trova il Plugin">
    Cerca in [ClawHub](/it/clawhub) i pacchetti Plugin pubblici:

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub è la superficie primaria di scoperta per i Plugin della community. Durante il
    passaggio di lancio, le normali specifiche di pacchetto bare installano ancora da npm a meno che
    non corrispondano a un id di Plugin ufficiale. Le specifiche di pacchetto `@openclaw/*` raw che corrispondono
    ai Plugin inclusi usano la copia inclusa della build OpenClaw corrente. Usa un
    prefisso esplicito quando ti serve una sorgente specifica.

  </Step>

  <Step title="Installa il Plugin">
    ```bash
    # From ClawHub.
    openclaw plugins install clawhub:<package>

    # From npm.
    openclaw plugins install npm:<package>

    # From git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # From a local development checkout.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    Tratta le installazioni dei Plugin come esecuzione di codice. Preferisci versioni fissate quando ti
    servono installazioni di produzione riproducibili.

  </Step>

  <Step title="Configuralo e abilitalo">
    Configura le impostazioni specifiche del Plugin in `plugins.entries.<id>.config`.
    Abilita il Plugin quando non è già abilitato:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Se la tua configurazione usa un elenco `plugins.allow` restrittivo, l'id del Plugin installato
    deve essere presente lì prima che il Plugin possa essere caricato.
    `openclaw plugins install` aggiunge l'id installato a un elenco
    `plugins.allow` esistente e rimuove lo stesso id da `plugins.deny` in modo che
    l'installazione esplicita possa caricarsi dopo il riavvio.

  </Step>

  <Step title="Lascia ricaricare il Gateway">
    L'installazione, l'aggiornamento o la disinstallazione del codice del Plugin richiedono un riavvio del Gateway.
    Quando un Gateway gestito è già in esecuzione con la ricarica della configurazione
    abilitata, OpenClaw rileva il record di installazione del Plugin modificato e riavvia il
    Gateway automaticamente. Se il Gateway non è gestito o la ricarica è disabilitata,
    riavvialo tu:

    ```bash
    openclaw gateway restart
    ```

    Le operazioni di abilitazione e disabilitazione aggiornano la configurazione e aggiornano il registro a freddo.
    Un'ispezione del runtime resta comunque il percorso di verifica più chiaro per le superfici di runtime
    live.

  </Step>

  <Step title="Verifica la registrazione del runtime">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Usa `--runtime` quando devi dimostrare strumenti, hook, servizi,
    metodi Gateway o comandi CLI posseduti dal Plugin registrati. `inspect` semplice è un controllo a freddo
    di manifest e registro.

  </Step>
</Steps>

## Configurazione

### Scegli una sorgente di installazione

| Sorgente    | Usala quando                                                                    | Esempio                                                        |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | Vuoi scoperta nativa di OpenClaw, scansioni, metadati di versione e suggerimenti di installazione | `openclaw plugins install clawhub:<package>`                   |
| npm         | Ti servono workflow diretti del registro npm o dist-tag                        | `openclaw plugins install npm:<package>`                       |
| git         | Ti serve un branch, tag o commit da un repository                              | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| percorso locale | Stai sviluppando o testando un Plugin sulla stessa macchina                    | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Stai installando un Plugin marketplace compatibile con Claude                  | `openclaw plugins install <plugin> --marketplace <source>`     |

Le specifiche di pacchetto bare hanno uno speciale comportamento di compatibilità. Se il nome bare corrisponde
a un id di Plugin incluso, OpenClaw usa quella sorgente inclusa. Se corrisponde a un
id di Plugin ufficiale esterno, OpenClaw usa il catalogo ufficiale dei pacchetti. Le altre
normali specifiche di pacchetto bare vengono installate tramite npm durante il passaggio di lancio. Anche le specifiche di pacchetto `@openclaw/*` raw
che corrispondono a Plugin inclusi si risolvono alla
copia inclusa prima del fallback npm. Usa `npm:@openclaw/<plugin>@<version>` quando
vuoi deliberatamente il pacchetto npm esterno invece della copia inclusa
posseduta dall'immagine. Usa `clawhub:`, `npm:`, `git:` o `npm-pack:` quando ti serve
una selezione deterministica della sorgente. Vedi [`openclaw plugins`](/it/cli/plugins#install)
per il contratto completo del comando.

Per le installazioni npm, le specifiche di pacchetto non fissate e `@latest` scelgono il pacchetto stabile
più recente che dichiara compatibilità con questa build OpenClaw. Se la release latest
corrente di npm dichiara un `openclaw.compat.pluginApi` o
`openclaw.install.minHostVersion` più recente, OpenClaw analizza le versioni stabili più vecchie del pacchetto
e installa la più recente compatibile. Versioni esatte e tag di canale espliciti
come `@beta` restano fissati al pacchetto selezionato e falliscono se incompatibili.

### Policy di installazione dell'operatore

Configura `security.installPolicy` per eseguire un comando di policy locale attendibile prima che
l'installazione o l'aggiornamento del Plugin proceda. La policy riceve metadati più il percorso
sorgente preparato e può consentire o bloccare l'installazione. Copre i percorsi di installazione/aggiornamento
dei Plugin basati su CLI e Gateway. Gli hook `before_install` del Plugin vengono eseguiti più tardi solo nei
processi OpenClaw in cui gli hook del Plugin sono caricati, quindi usa `security.installPolicy`
per decisioni di installazione possedute dall'operatore. Il flag deprecato
`--dangerously-force-unsafe-install` è accettato per compatibilità ma non
aggira la policy di installazione o la denylist integrata delle dipendenze Plugin di OpenClaw.

Vedi [Configurazione Skills](/it/tools/skills-config#operator-install-policy-securityinstallpolicy)
per lo schema exec `security.installPolicy` condiviso usato sia da skills sia da
Plugin.

### Configura la policy dei Plugin

La forma comune della configurazione dei Plugin è:

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

Regole principali della policy:

- `plugins.enabled: false` disabilita tutti i Plugin e salta il lavoro di scoperta/caricamento
  dei Plugin. I riferimenti obsoleti ai Plugin sono inerti mentre questa opzione è attiva; riabilita
  i Plugin prima di eseguire la pulizia doctor quando vuoi rimuovere gli id obsoleti.
- `plugins.deny` prevale su allow e sull'abilitazione per Plugin.
- `plugins.allow` è un allowlist esclusivo. Gli strumenti posseduti dai Plugin fuori dall'
  allowlist restano non disponibili, anche quando `tools.allow` include `"*"`.
- `plugins.entries.<id>.enabled: false` disabilita un Plugin preservandone
  la configurazione.
- `plugins.load.paths` aggiunge file o directory di Plugin locali espliciti. I percorsi locali gestiti da
  `plugins install` devono essere directory o archivi di Plugin; usa
  `plugins.load.paths` per file Plugin autonomi.
- I Plugin di origine workspace sono disabilitati per impostazione predefinita; abilitali esplicitamente o
  inseriscili nell'allowlist prima di usare codice locale del workspace.
- I Plugin inclusi seguono i propri metadati integrati default-on/default-off a meno che
  la configurazione non li sovrascriva esplicitamente.
- `plugins.slots.<slot>` sceglie un Plugin per categorie esclusive come
  motori di memoria e contesto. La selezione dello slot forza l'abilitazione del Plugin selezionato
  per quello slot contando come attivazione esplicita; può caricarsi anche quando
  altrimenti sarebbe opt-in. `plugins.deny` e
  `plugins.entries.<id>.enabled: false` lo bloccano comunque.
- I Plugin inclusi opt-in possono auto-attivarsi quando la configurazione nomina una delle loro superfici possedute,
  come un riferimento provider/modello, configurazione canale, backend CLI o runtime harness di agente.
- Il routing Codex della famiglia OpenAI mantiene separati i confini di provider e Plugin di runtime:
  i riferimenti legacy ai modelli Codex sono configurazione legacy riparata da doctor, mentre il Plugin incluso
  `codex` possiede il runtime app-server Codex per i riferimenti agente canonici `openai/*`,
  `agentRuntime.id: "codex"` esplicito e riferimenti legacy `codex/*`.

Quando `plugins.allow` non è impostato e Plugin non inclusi vengono scoperti automaticamente dalle
radici Plugin del workspace o globali, i log di avvio riportano
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`.
L'avviso include gli id dei Plugin scoperti e, per elenchi brevi, uno snippet minimale
`plugins.allow`. Esegui
[`openclaw plugins list --enabled --verbose`](/it/cli/plugins#list) o
[`openclaw plugins inspect <id>`](/it/cli/plugins#inspect) con l'id Plugin elencato
prima di copiare Plugin attendibili in `openclaw.json`. La stessa guida di trust-pinning
si applica quando la diagnostica dice che un Plugin è stato caricato
`without install/load-path provenance`: ispeziona quell'id Plugin, poi fissa l'id
attendibile in `plugins.allow` o reinstalla da una sorgente attendibile in modo che OpenClaw
registri la provenienza dell'installazione.

Esegui `openclaw doctor` o `openclaw doctor --fix` quando la validazione della configurazione segnala
id Plugin obsoleti, mismatch allowlist/strumenti o percorsi legacy dei Plugin inclusi.

## Comprendere i formati dei Plugin

OpenClaw riconosce due formati di Plugin:

| Formato                | Come viene caricato                                                         | Usalo quando                                                            |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Plugin OpenClaw nativo | `openclaw.plugin.json` più un modulo runtime caricato nel processo           | Stai installando o creando capacità di runtime specifiche di OpenClaw  |
| Bundle compatibile     | Layout Plugin Codex, Claude o Cursor mappato nell'inventario Plugin OpenClaw | Stai riutilizzando Skills, comandi, hook o metadati bundle compatibili |

Entrambi i formati compaiono in `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` e `openclaw plugins disable`. Vedi
[Bundle dei Plugin](/it/plugins/bundles) per il confine di compatibilità dei bundle e
[Creazione di Plugin](/it/plugins/building-plugins) per l'authoring di Plugin nativi.

## Hook dei Plugin

I Plugin possono registrare hook a runtime, ma esistono due API diverse con
compiti diversi.

- Usa hook tipizzati tramite `api.on(...)` per gli hook del ciclo di vita runtime. Questa è la
  superficie preferita per middleware, policy, riscrittura dei messaggi, modellazione del prompt
  e controllo degli strumenti.
- Usa `api.registerHook(...)` solo quando vuoi partecipare al sistema di hook interno
  descritto in [Hook](/it/automation/hooks). Questo serve principalmente per effetti collaterali grossolani
  di comando/ciclo di vita e compatibilità con automazioni esistenti in stile HOOK.

Regola rapida:

- Se l'handler richiede priorità, semantica di merge o comportamento di blocco/annullamento, usa
  gli hook Plugin tipizzati.
- Se l'handler reagisce semplicemente a `command:new`, `command:reset`, `message:sent`
  o eventi grossolani simili, `api.registerHook(...)` va bene.

Gli hook interni gestiti dai Plugin compaiono in `openclaw hooks list` con
`plugin:<id>`. Non puoi abilitarli o disabilitarli tramite `openclaw hooks`;
abilita o disabilita invece il Plugin.

## Verifica il Gateway attivo

`openclaw plugins list` e il semplice `openclaw plugins inspect` leggono lo stato
a freddo di configurazione, manifesto e registro. Non dimostrano che un Gateway
gia in esecuzione abbia importato lo stesso codice del plugin.

Quando un plugin risulta installato ma il traffico chat live non lo usa:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

I Gateway gestiti si riavviano automaticamente dopo modifiche di installazione,
aggiornamento e disinstallazione dei plugin che alterano il sorgente del plugin.
Su installazioni VPS o container, assicurati che qualsiasi riavvio manuale punti
al vero processo figlio `openclaw gateway run` che serve i tuoi canali, non solo
a un wrapper o supervisore.

## Risoluzione dei problemi

| Sintomo                                                        | Controllo                                                                                                                                      | Correzione                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Il Plugin appare in `plugins list` ma gli hook runtime non vengono eseguiti  | Usa `openclaw plugins inspect <id> --runtime --json` e conferma il Gateway attivo con `gateway status --deep --require-rpc`             | Riavvia il Gateway live dopo modifiche di installazione, aggiornamento, configurazione o sorgente                               |
| Compaiono diagnostiche di proprieta duplicate di canale o strumento         | Esegui `openclaw plugins list --enabled --verbose`, ispeziona ogni plugin sospetto con `--runtime --json` e confronta la proprieta di canali/strumenti | Disabilita un proprietario, rimuovi installazioni obsolete oppure usa `preferOver` del manifesto per la sostituzione intenzionale      |
| La configurazione indica che manca un plugin                                | Controlla [Inventario dei plugin](/it/plugins/plugin-inventory) per sapere se e bundled, esterno ufficiale o solo sorgente                           | Installa il pacchetto esterno, abilita il plugin bundled oppure rimuovi la configurazione obsoleta                         |
| La configurazione non e valida durante l'installazione                               | Leggi il messaggio di validazione ed esegui `openclaw doctor --fix` quando indica uno stato plugin obsoleto                                           | Doctor puo mettere in quarantena la configurazione plugin non valida disabilitando la voce e rimuovendo il payload non valido     |
| Il percorso del plugin e bloccato per proprieta o permessi sospetti | Ispeziona la diagnostica prima dell'errore di configurazione                                                                                             | Correggi proprieta/permessi del filesystem, poi esegui `openclaw plugins registry --refresh`                    |
| `OPENCLAW_NIX_MODE=1` blocca i comandi del ciclo di vita                | Conferma che l'installazione sia gestita da Nix                                                                                                      | Modifica la selezione dei plugin nel sorgente Nix invece di usare i comandi mutatori dei plugin                      |
| L'importazione di una dipendenza fallisce a runtime                             | Controlla se il plugin e stato installato tramite npm/git/ClawHub o caricato da un percorso locale                                                 | Esegui `openclaw plugins update <id>`, reinstalla il sorgente oppure installa manualmente le dipendenze del plugin locale |

Quando una configurazione plugin obsoleta nomina ancora un plugin di canale non
piu individuabile, l'avvio del Gateway salta quel canale supportato dal plugin
invece di bloccare ogni altro canale. Esegui `openclaw doctor --fix` per
rimuovere voci obsolete di plugin e canali. Le chiavi di canale sconosciute
senza evidenza di plugin obsoleto continuano a fallire la validazione, cosi gli
errori di battitura restano visibili.

Per la sostituzione intenzionale di un canale, il plugin preferito dovrebbe
dichiarare `channelConfigs.<channel-id>.preferOver` con l'id del plugin legacy o
a priorita inferiore. Se entrambi i plugin sono abilitati esplicitamente,
OpenClaw mantiene quella richiesta e segnala diagnostiche di canali o strumenti
duplicati invece di scegliere silenziosamente un proprietario.

Se un pacchetto installato segnala che `requires compiled runtime output for
TypeScript entry ...`, il pacchetto e stato pubblicato senza i file JavaScript
necessari a OpenClaw a runtime. Aggiorna o reinstalla dopo che il publisher avra
distribuito JavaScript compilato, oppure disabilita/disinstalla il plugin fino ad
allora.

### Proprieta bloccata del percorso del plugin

Se le diagnostiche del plugin indicano
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
e la validazione della configurazione prosegue con `plugin present but blocked`,
OpenClaw ha trovato file del plugin di proprieta di un utente Unix diverso da
quello del processo che li sta caricando. Mantieni la configurazione del plugin;
correggi la proprieta del filesystem oppure esegui OpenClaw con lo stesso utente
che possiede la directory di stato.

Per le installazioni Docker, l'immagine ufficiale viene eseguita come `node`
(uid `1000`), quindi le directory di configurazione e workspace OpenClaw montate
in bind dall'host dovrebbero normalmente essere di proprieta dell'uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Se esegui intenzionalmente OpenClaw come root, ripara invece la root dei plugin
gestiti impostandone la proprieta a root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Dopo aver corretto la proprieta, riesegui `openclaw doctor --fix` oppure
`openclaw plugins registry --refresh` in modo che il registro persistente dei
plugin corrisponda ai file riparati.

### Configurazione lenta degli strumenti dei plugin

Se i turni dell'agente sembrano bloccarsi durante la preparazione degli strumenti,
abilita il logging di trace e controlla le righe di temporizzazione delle factory
degli strumenti dei plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Cerca:

```text
[trace:plugin-tools] factory timings ...
```

Il riepilogo elenca il tempo totale delle factory e le factory degli strumenti
dei plugin piu lente, inclusi id del plugin, nomi degli strumenti dichiarati,
forma del risultato e se lo strumento e opzionale. Le righe lente vengono
promosse ad avvisi quando una singola factory richiede almeno 1s o la
preparazione totale delle factory degli strumenti dei plugin richiede almeno 5s.

OpenClaw memorizza nella cache i risultati riusciti delle factory degli strumenti
dei plugin per risoluzioni ripetute con lo stesso contesto di richiesta effettivo.
La chiave della cache include la configurazione runtime effettiva, il workspace,
gli id agente/sessione, la policy sandbox, le impostazioni del browser, il
contesto di consegna, l'identita del richiedente e lo stato di proprieta, quindi
le factory che dipendono da questi campi attendibili vengono rieseguite quando il
contesto cambia. Se le temporizzazioni restano alte, il plugin potrebbe svolgere
lavoro costoso prima di restituire le definizioni degli strumenti.

Se un plugin domina la temporizzazione, ispeziona le sue registrazioni runtime:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Poi aggiorna, reinstalla o disabilita quel plugin. Gli autori di plugin
dovrebbero spostare il caricamento costoso delle dipendenze dietro il percorso di
esecuzione dello strumento invece di farlo dentro la factory dello strumento.

Per root delle dipendenze, validazione dei metadati dei pacchetti, record del
registro, comportamento di ricaricamento all'avvio e pulizia legacy, consulta
[Risoluzione delle dipendenze dei plugin](/it/plugins/dependency-resolution).

## Correlati

- [Gestire i plugin](/it/plugins/manage-plugins) - esempi di comandi per elenco, installazione, aggiornamento, disinstallazione e pubblicazione
- [`openclaw plugins`](/it/cli/plugins) - riferimento CLI completo
- [Inventario dei plugin](/it/plugins/plugin-inventory) - elenco generato dei plugin bundled ed esterni
- [Riferimento dei plugin](/it/plugins/reference) - pagine di riferimento generate per plugin
- [Plugin della community](/it/plugins/community) - individuazione ClawHub e policy per le PR alla documentazione
- [Risoluzione delle dipendenze dei plugin](/it/plugins/dependency-resolution) - root di installazione, record del registro e confini runtime
- [Creare plugin](/it/plugins/building-plugins) - guida all'autorialita dei plugin nativi
- [Panoramica del Plugin SDK](/it/plugins/sdk-overview) - registrazione runtime, hook e campi API
- [Manifesto del plugin](/it/plugins/manifest) - manifesto e metadati del pacchetto
