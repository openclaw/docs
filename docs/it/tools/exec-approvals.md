---
read_when:
    - Configurazione delle approvazioni di esecuzione o delle liste consentite
    - Implementazione dell'esperienza utente per l'approvazione dell'esecuzione nell'app macOS
    - Analisi dei prompt di evasione dalla sandbox e delle relative implicazioni
sidebarTitle: Exec approvals
summary: 'Approvazioni per l''esecuzione sull''host: parametri dei criteri, elenchi di elementi consentiti e flusso di lavoro YOLO/rigoroso'
title: Approvazioni di esecuzione
x-i18n:
    generated_at: "2026-07-12T07:33:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b44efdfe5a6c9f3cc978baef91d80d1f75d39627d3a16f5971800809a642a72c
    source_path: tools/exec-approvals.md
    workflow: 16
---

Le approvazioni di esecuzione sono il **meccanismo di protezione dell'app complementare / host Node** che consente a un agente in sandbox di eseguire comandi su un host reale (`gateway` o `node`). I comandi vengono eseguiti solo quando criteri + elenco consentiti + approvazione (facoltativa) dell'utente concordano.
Le approvazioni si applicano **in aggiunta** ai criteri degli strumenti e al controllo dell'accesso con privilegi elevati (`full` con privilegi elevati le ignora).

Per una panoramica incentrata sulle modalità `deny`, `allowlist`, `ask`, `auto`, `full`, sulla mappatura di Codex Guardian e sulle autorizzazioni dell'harness ACPX, consulta
[Modalità di autorizzazione](/it/tools/permission-modes).

<Note>
Il criterio effettivo è quello **più restrittivo** tra `tools.exec.*` e i valori predefiniti delle approvazioni: le approvazioni possono solo rendere più restrittive le impostazioni di sicurezza/richiesta derivate dalla configurazione, mai allentarle. Se un campo delle approvazioni viene omesso, viene usato il valore di `tools.exec`. L'esecuzione sull'host usa anche lo stato locale delle approvazioni su quella macchina: un valore locale dell'host `ask: "always"` nel file delle approvazioni dell'host di esecuzione continua a richiedere conferma anche se i valori predefiniti della sessione o della configurazione specificano `ask: "on-miss"`.
</Note>

## Ambito di applicazione

Le approvazioni di esecuzione vengono applicate localmente sull'host di esecuzione:

- **Host Gateway** -> processo `openclaw` sulla macchina Gateway.
- **Host Node** -> esecutore Node (app complementare per macOS o host Node headless).

### Modello di attendibilità

- I chiamanti autenticati dal Gateway sono operatori attendibili per quel Gateway.
- I nodi associati estendono tale capacità dell'operatore attendibile all'host Node.
- Le approvazioni riducono il rischio di esecuzione accidentale, ma **non** costituiscono un confine di autenticazione per utente né un criterio di sola lettura del file system.
- Dopo l'approvazione, un comando può modificare i file in base alle autorizzazioni del file system dell'host o della sandbox selezionati.
- Le esecuzioni approvate sull'host Node vincolano il contesto di esecuzione canonico: directory di lavoro, argv esatto, associazione dell'ambiente quando presente e percorso fissato dell'eseguibile quando applicabile.
- Per gli script di shell e le invocazioni dirette di file tramite interprete/runtime, OpenClaw tenta inoltre di vincolare un singolo operando di file locale concreto. Se tale file cambia dopo l'approvazione ma prima dell'esecuzione, l'esecuzione viene negata anziché eseguire contenuto modificato.
- Il vincolo del file è basato sul massimo impegno e non rappresenta un modello completo di ogni percorso di caricamento di interpreti/runtime. Se non è possibile identificare esattamente un singolo file locale concreto, OpenClaw rifiuta di generare un'esecuzione supportata da approvazione anziché simulare una copertura completa.

### Separazione su macOS

- Il **servizio host Node** inoltra `system.run` all'**app macOS** tramite IPC locale.
- L'**app macOS** applica le approvazioni ed esegue il comando nel contesto dell'interfaccia utente.

## Ispezione del criterio effettivo

| Comando                                                          | Informazioni mostrate                                                                    |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Criterio richiesto, origini dei criteri dell'host e risultato effettivo.                  |
| `openclaw exec-policy show`                                      | Vista unificata della macchina locale.                                                    |
| `openclaw exec-policy set` / `preset`                            | Sincronizza in un solo passaggio il criterio locale richiesto con il file locale delle approvazioni dell'host. |

<Note>
Le sostituzioni `/exec` per sessione non sono incluse. Esegui `/exec` nella sessione pertinente per esaminarne i valori predefiniti correnti. Consulta [sostituzioni di sessione](/it/tools/exec#session-overrides-exec).
</Note>

Riferimento completo della CLI (flag, output JSON, aggiunta/rimozione dall'elenco consentiti): [CLI delle approvazioni](/it/cli/approvals).

Quando un ambito locale richiede `host=node`, `exec-policy show` segnala tale ambito come gestito dal Node durante l'esecuzione, anziché considerare il file locale delle approvazioni come fonte autorevole.

Se l'interfaccia utente dell'app complementare **non è disponibile**, ogni richiesta che normalmente richiederebbe conferma viene risolta tramite il **ripiego della richiesta** (valore predefinito: `deny`).

<Tip>
I client nativi per l'approvazione nelle chat possono predisporre funzionalità specifiche del canale nel messaggio di approvazione in sospeso. Matrix predispone scorciatoie tramite reazioni (`✅` consenti una volta, `♾️` consenti sempre, `❌` nega), mantenendo comunque `/approve ...` nel messaggio come ripiego.
</Tip>

## Impostazioni e archiviazione

Le approvazioni risiedono in un file JSON locale sull'host di esecuzione. Quando `OPENCLAW_STATE_DIR` è impostata, il file si trova in tale directory di stato; altrimenti usa la directory di stato predefinita di OpenClaw:

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# altrimenti
~/.openclaw/exec-approvals.json
```

Il socket di approvazione predefinito usa la stessa radice:
`$OPENCLAW_STATE_DIR/exec-approvals.sock`, oppure
`~/.openclaw/exec-approvals.sock` quando la variabile non è impostata.

Le versioni precedenti alla 2026.6.6 conservavano sempre il file in `~/.openclaw`. Se `OPENCLAW_STATE_DIR` punta altrove e nella directory predefinita esiste ancora un file delle approvazioni, esegui direttamente una volta `openclaw doctor --fix` per importarlo nella directory di stato (l'originale viene archiviato con il suffisso `.migrated`). La procedura interattiva di doctor può anche mostrare un'anteprima e confermare l'importazione. Le esecuzioni automatiche di riparazione durante gli aggiornamenti e il monitoraggio del Gateway non importano mai dati tra directory di stato: una directory di stato temporanea o di staging non deve acquisire le approvazioni dell'installazione predefinita. Lo stesso confine si applica alle importazioni del file precedente `plugin-binding-approvals.json` nello stato SQLite condiviso.

Esempio di schema:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "source": "allow-always",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Parametri dei criteri

### `tools.exec.mode`

`tools.exec.mode` è la superficie normalizzata preferita per i criteri di esecuzione sull'host:

| Valore      | Comportamento                                                                                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deny`      | Blocca l'esecuzione sull'host.                                                                                                                                                                                 |
| `allowlist` | Esegue senza chiedere conferma solo i comandi presenti nell'elenco consentiti.                                                                                                                                 |
| `ask`       | Usa il criterio dell'elenco consentiti e chiede conferma per le corrispondenze mancanti.                                                                                                                       |
| `auto`      | Usa il criterio dell'elenco consentiti, esegue direttamente le corrispondenze deterministiche e invia le corrispondenze mancanti al revisore automatico nativo di OpenClaw prima di ricorrere all'approvazione umana. |
| `full`      | Esegue sull'host senza richieste di approvazione.                                                                                                                                                              |

Le precedenti impostazioni `tools.exec.security` / `tools.exec.ask` rimangono supportate e continuano ad applicarsi ovunque `mode` non sia impostata in tale ambito.

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - blocca tutte le richieste di esecuzione sull'host.
  - `allowlist` - consente solo i comandi presenti nell'elenco consentiti.
  - `full` - consente tutto (equivalente ai privilegi elevati).

Il valore predefinito è `full` per gli host Gateway/Node; per un host `sandbox` il valore predefinito è invece `deny`.
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  Criterio di richiesta configurato per l'esecuzione sull'host. Controlla il comportamento di base delle richieste di approvazione derivato da `tools.exec.ask` e dai valori predefiniti delle approvazioni dell'host. Il valore predefinito è `off`. Il parametro dello strumento `ask` per singola chiamata (consulta
  [Strumento Exec](/it/tools/exec#parameters)) può solo rendere più restrittiva questa base, mentre le chiamate del modello provenienti dai canali lo ignorano quando il valore effettivo della richiesta sull'host è `off`.

- `off` - non richiede mai conferma.
- `on-miss` - richiede conferma solo quando l'elenco consentiti non produce corrispondenze.
- `always` - richiede conferma per ogni comando. L'attendibilità persistente `allow-always` **non** elimina le richieste quando la modalità di richiesta effettiva è `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Risoluzione usata quando è necessaria una richiesta ma non è raggiungibile alcuna interfaccia utente (oppure la richiesta scade). Se omesso, il valore predefinito è `deny`.

- `deny` - blocca.
- `allowlist` - consente solo se l'elenco consentiti produce una corrispondenza.
- `full` - consente.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Quando è `true`, considera le forme di valutazione del codice inline come eseguibili solo previa approvazione, anche se il binario dell'interprete è incluso nell'elenco consentiti. Offre una difesa in profondità per i caricatori degli interpreti che non possono essere associati in modo chiaro a un singolo operando di file stabile.
</ParamField>

Esempi intercettati dalla modalità rigorosa: `python -c`, `node -e`/`--eval`/`-p`,
`ruby -e`, `perl -e`/`-E`, `php -r`, `lua -e`, `osascript -e` (incluse anche le forme inline di `awk`,
`sed`, `make`, `find -exec` e `xargs`).

In modalità rigorosa, questi comandi richiedono l'approvazione di un revisore o un'approvazione esplicita. Con `tools.exec.mode: "auto"`, il revisore può autorizzare una singola esecuzione a basso rischio quando il comando dispone di un piano applicabile; in caso contrario, OpenClaw chiede l'approvazione di una persona.
Le approvazioni dei comandi di `Codex app-server` che raggiungono il ripiego del revisore richiedono l'intervento di una persona, poiché le relative richieste di approvazione non espongono un eseguibile risolto applicabile.
`allow-always` non salva nuove voci nell'elenco consentiti per i comandi di valutazione inline.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Solo presentazione: quando è abilitata, OpenClaw può allegare intervalli dei comandi derivati dal parser affinché le richieste di approvazione Web possano evidenziare i token dei comandi. **Non** modifica `security`, `ask`, la corrispondenza con l'elenco consentiti, il comportamento rigoroso per la valutazione inline, l'inoltro delle approvazioni o l'esecuzione dei comandi.
</ParamField>

Imposta il valore globalmente in `tools.exec.commandHighlighting` oppure per singolo agente in
`agents.list[].tools.exec.commandHighlighting`.

## Modalità YOLO (senza approvazione)

Per eseguire comandi sull'host senza richieste di approvazione, apri **entrambi** i livelli dei criteri:
il criterio di esecuzione richiesto nella configurazione di OpenClaw (`tools.exec.*`) **e**
il criterio locale delle approvazioni dell'host nel file delle approvazioni dell'host di esecuzione.

Se `askFallback` viene omesso, il valore predefinito è `deny`. Imposta esplicitamente `askFallback` dell'host su `full` quando una richiesta di approvazione senza interfaccia utente deve consentire l'esecuzione come ripiego.

| Livello               | Impostazione YOLO          |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` su `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| `askFallback` host    | `full`                     |

<Warning>
**Distinzioni importanti:**

- `tools.exec.host=auto` sceglie **dove** viene eseguito il comando: nella sandbox quando disponibile, altrimenti nel Gateway.
- YOLO sceglie **come** viene approvata l'esecuzione sull'host: `security=full` insieme a `ask=off`.
- YOLO **non** aggiunge un ulteriore controllo euristico di approvazione per l'offuscamento dei comandi né un livello di rifiuto preventivo degli script oltre al criterio di esecuzione sull'host configurato.
- `auto` non rende l'instradamento al Gateway una sostituzione liberamente disponibile da una sessione in sandbox. Una richiesta per singola chiamata `host=node` è consentita da `auto`; `host=gateway` è consentita da `auto` solo quando non è attivo alcun runtime sandbox. Per un valore predefinito stabile diverso da `auto`, imposta `tools.exec.host` oppure usa esplicitamente `/exec host=...`.

</Warning>

I provider basati su CLI che espongono una propria modalità di autorizzazione non interattiva possono seguire questo criterio. La CLI di Claude aggiunge `--permission-mode bypassPermissions` quando il criterio di esecuzione effettivo di OpenClaw è YOLO. Per le sessioni live di Claude gestite da OpenClaw, il criterio di esecuzione effettivo di OpenClaw prevale sulla modalità di autorizzazione nativa di Claude: YOLO normalizza gli avvii live su `--permission-mode bypassPermissions`, mentre un criterio di esecuzione effettivo restrittivo normalizza gli avvii live su `--permission-mode default`, anche se gli argomenti non elaborati del backend Claude specificano un'altra modalità.

Se desideri una configurazione più prudente, restringi nuovamente il criterio di esecuzione di OpenClaw a `allowlist` / `on-miss` o `deny`.

### Configurazione persistente "non chiedere mai" sull'host del Gateway

<Steps>
  <Step title="Imposta il criterio di configurazione richiesto">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Allinea il file delle approvazioni dell'host">
    ```bash
    openclaw approvals set --stdin <<'EOF'
    {
      version: 1,
      defaults: {
        security: "full",
        ask: "off",
        askFallback: "full"
      }
    }
    EOF
    ```
  </Step>
</Steps>

### Scorciatoia locale

```bash
openclaw exec-policy preset yolo
```

Aggiorna sia i valori locali di `tools.exec.host/security/ask` sia i valori predefiniti del file locale delle approvazioni (incluso `askFallback: "full"`). È intenzionalmente limitato all'ambiente locale. Per modificare da remoto le approvazioni dell'host del Gateway o dell'host Node, usa `openclaw approvals set --gateway` oppure `openclaw approvals set --node
<id|name|ip>`.

Altri preset integrati: `cautious` (`host=gateway`, `security=allowlist`, `ask=on-miss`, `askFallback=deny`) e `deny-all` (`host=gateway`, `security=deny`, `ask=off`, `askFallback=deny`). Applicali nello stesso modo: `openclaw exec-policy preset cautious`.

Per impostare singoli campi anziché un preset completo, usa
`openclaw exec-policy set --host <auto|sandbox|gateway|node> --security
<deny|allowlist|full> --ask <off|on-miss|always> --ask-fallback
<deny|allowlist|full>` con un qualsiasi sottoinsieme di questi flag.

### Host Node

Applica invece lo stesso file delle approvazioni sul Node:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

<Note>
**Limitazioni esclusivamente locali:**

- `openclaw exec-policy` non sincronizza le approvazioni dei Node.
- `openclaw exec-policy set --host node` viene rifiutato.
- Le approvazioni di esecuzione dei Node vengono recuperate dal Node in fase di esecuzione, quindi gli aggiornamenti destinati ai Node devono usare `openclaw approvals --node ...`.

</Note>

### Scorciatoia valida solo per la sessione

- `/exec security=full ask=off` modifica solo la sessione corrente.
- `/elevated full` è una scorciatoia di emergenza che ignora le approvazioni di esecuzione solo quando sia il criterio richiesto sia il file delle approvazioni dell'host risultano in `security: "full"` e `ask: "off"`. Un file dell'host più restrittivo, come `ask:
"always"`, continua a richiedere conferma.

Se il file delle approvazioni dell'host rimane più restrittivo della configurazione, continua a prevalere il criterio dell'host più restrittivo.

## Elenco consentiti (per agente)

Gli elenchi consentiti sono **specifici per ogni agente**. Se esistono più agenti, seleziona nell'app macOS l'agente da modificare. I pattern usano la corrispondenza glob.

I pattern possono essere glob di percorsi binari risolti oppure glob di semplici nomi di comando. I nomi semplici corrispondono soltanto ai comandi invocati tramite `PATH`, quindi `rg` può corrispondere a `/opt/homebrew/bin/rg` quando il comando è `rg`, ma **non** a `./rg` o `/tmp/rg`. Usa un glob di percorso per considerare attendibile una specifica posizione del binario.

Le voci legacy `agents.default` vengono migrate in `agents.main` durante il caricamento. Le catene di comandi shell come `echo ok && pwd` richiedono comunque che ogni segmento di primo livello soddisfi le regole dell'elenco consentiti.

Esempi:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Limitazione degli argomenti con argPattern

Aggiungi `argPattern` quando una voce dell'elenco consentiti deve corrispondere a un binario e a una specifica struttura degli argomenti. OpenClaw usa la semantica delle espressioni regolari ECMAScript (JavaScript) su ogni host e valuta l'espressione rispetto agli argomenti analizzati del comando, escludendo il token dell'eseguibile (`argv[0]`). Per le voci create manualmente, gli argomenti vengono uniti con un singolo spazio; usa gli ancoraggi nel pattern quando è necessaria una corrispondenza esatta.

```json
{
  "version": 1,
  "agents": {
    "main": {
      "allowlist": [
        {
          "pattern": "python3",
          "argPattern": "^safe\\.py$"
        }
      ]
    }
  }
}
```

Questa voce consente `python3 safe.py`; `python3 other.py` non corrisponde all'elenco consentiti. Se è presente anche una voce basata sul solo percorso per lo stesso binario, gli argomenti non corrispondenti possono comunque ricadere su tale voce. Ometti la voce basata sul solo percorso quando l'obiettivo è limitare il binario agli argomenti dichiarati.

Le voci salvate dai flussi di approvazione usano un formato interno con separatori per la corrispondenza esatta di argv. È preferibile usare l'interfaccia utente o il flusso di approvazione per rigenerare queste voci, anziché modificare manualmente il valore codificato. Se OpenClaw non riesce ad analizzare argv per un segmento di comando, le voci con `argPattern` non corrispondono.

Ogni voce dell'elenco consentiti supporta:

| Campo              | Significato                                              |
| ------------------ | ---------------------------------------------------- |
| `pattern`          | Glob del percorso binario risolto o glob del semplice nome del comando |
| `argPattern`       | Espressione regolare ECMAScript facoltativa per argv; se omessa, la corrispondenza è basata solo sul percorso |
| `id`               | ID opaco stabile; generato come UUID quando assente |
| `source`           | Origine della voce, ad esempio `allow-always` |
| `commandText`      | Input legacy in testo semplice; eliminato durante il caricamento |
| `lastUsedAt`       | Data e ora dell'ultimo utilizzo |
| `lastUsedCommand`  | Ultimo comando che ha prodotto una corrispondenza |
| `lastResolvedPath` | Ultimo percorso binario risolto |

## Autorizzazione automatica delle CLI delle Skills

Quando **Autorizzazione automatica delle CLI delle Skills** (`autoAllowSkills`) è abilitata, gli eseguibili indicati dalle Skills note vengono considerati inclusi nell'elenco consentiti sui Node (Node macOS o host Node headless). Questa funzionalità usa `skills.bins` tramite l'RPC del Gateway per recuperare l'elenco dei binari delle Skills. Disabilitala se desideri elenchi consentiti rigorosamente manuali.

<Warning>
- Questo è un **elenco consentiti implicito per praticità**, distinto dalle voci manuali basate sui percorsi.
- È destinato ad ambienti di operatori attendibili nei quali Gateway e Node appartengono allo stesso perimetro di attendibilità.
- Se richiedi un'attendibilità esplicita e rigorosa, mantieni `autoAllowSkills: false` e usa esclusivamente voci manuali basate sui percorsi.

</Warning>

## Binari sicuri e inoltro delle approvazioni

Per i binari sicuri (il percorso rapido basato esclusivamente su stdin), i dettagli dell'associazione degli interpreti e le modalità di inoltro delle richieste di approvazione a Slack/Discord/Telegram (o di esecuzione come client di approvazione nativi), consulta
[Approvazioni di esecuzione - funzionalità avanzate](/it/tools/exec-approvals-advanced).

## Modifica tramite l'interfaccia di controllo

Usa la scheda **Interfaccia di controllo -> Node -> Approvazioni di esecuzione** per modificare i valori predefiniti, le sostituzioni specifiche per agente e gli elenchi consentiti. Scegli un ambito (Valori predefiniti o un agente), modifica il criterio, aggiungi o rimuovi pattern dall'elenco consentiti, quindi seleziona **Salva**. L'interfaccia mostra per ogni pattern i metadati dell'ultimo utilizzo, così puoi mantenere ordinato l'elenco.

Il selettore della destinazione consente di scegliere **Gateway** (approvazioni locali) oppure un **Node**. I Node devono dichiarare `system.execApprovals.get/set` (app macOS o host Node headless). Se un Node non dichiara ancora le approvazioni di esecuzione, modifica direttamente il relativo file locale delle approvazioni.

Alcuni host Node, incluso il componente complementare per Windows, gestiscono un formato diverso dei criteri di approvazione. L'interfaccia di controllo mostra questi criteri nativi dell'host in sola lettura. Per modificarli, usa l'app complementare oppure `openclaw approvals set --node <id|name|ip>` con la struttura nativa del criterio; consulta [CLI delle approvazioni](/it/cli/approvals).

CLI: `openclaw approvals` supporta la modifica del Gateway o dei Node; consulta
[CLI delle approvazioni](/it/cli/approvals).

## Flusso di approvazione

Quando è richiesta una conferma, il Gateway trasmette `exec.approval.requested` ai client degli operatori. L'interfaccia di controllo e l'app macOS la risolvono tramite `exec.approval.resolve`, quindi il Gateway inoltra la richiesta approvata all'host Node.

Per `host=node`, le richieste di approvazione includono un payload canonico `systemRunPlan`. Il Gateway usa tale piano come contesto autorevole per comando, cwd e sessione durante l'inoltro delle richieste `system.run` approvate:

- Il percorso di esecuzione del Node prepara anticipatamente un unico piano canonico.
- Il record di approvazione memorizza tale piano e i relativi metadati di associazione.
- Dopo l'approvazione, la chiamata `system.run` finale inoltrata riutilizza il piano memorizzato anziché considerare attendibili le modifiche successive del chiamante.
- Se il chiamante modifica `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey` dopo la creazione della richiesta di approvazione, il Gateway rifiuta l'esecuzione inoltrata a causa di una mancata corrispondenza dell'approvazione.

## Eventi di sistema e rifiuti

Il ciclo di vita dell'esecuzione pubblica un messaggio di sistema `Esecuzione completata` nella sessione dell'agente dopo che il Node segnala il completamento. OpenClaw può inoltre emettere un avviso di operazione in corso dopo la concessione di un'approvazione, una volta trascorso `tools.exec.approvalRunningNoticeMs` (valore predefinito `10000`; `0` lo disabilita). Il rifiuto di un'approvazione di esecuzione è definitivo per il comando dell'host: il comando non viene eseguito.

- Per le approvazioni asincrone dell'agente principale con una sessione di origine, OpenClaw pubblica il rifiuto in tale sessione come aggiornamento interno, consentendo all'agente di smettere di attendere il comando asincrono ed evitare una procedura di riparazione per risultato mancante.
- Se non è presente alcuna sessione o la sessione non può essere ripresa, OpenClaw può comunque segnalare un rifiuto conciso all'operatore o al percorso di chat diretto.
- I rifiuti relativi alle sessioni di sottoagenti e Cron non vengono pubblicati nuovamente in tali sessioni.

Le approvazioni di esecuzione sull'host del Gateway emettono lo stesso evento del ciclo di vita relativo al completamento. Le esecuzioni soggette ad approvazione riutilizzano l'ID di approvazione per correlare la richiesta in sospeso con il relativo messaggio di completamento o rifiuto (`Esecuzione completata (gateway
id=...)` / `Esecuzione rifiutata (gateway id=...)`).

## Implicazioni

- **`full`** offre ampi privilegi; quando possibile, preferisci gli elenchi consentiti.
- **`ask`** ti mantiene coinvolto, consentendo comunque approvazioni rapide.
- Gli elenchi consentiti specifici per agente impediscono che le approvazioni di un agente vengano applicate ad altri.
- Le approvazioni si applicano esclusivamente alle richieste di esecuzione sull'host provenienti da **mittenti autorizzati**. I mittenti non autorizzati non possono inviare `/exec`.
- `/exec security=full` è una funzione pratica a livello di sessione per gli operatori autorizzati e, per progettazione, ignora le approvazioni. Per bloccare completamente l'esecuzione sull'host, imposta la sicurezza delle approvazioni su `deny` oppure nega lo strumento `exec` tramite il criterio degli strumenti.

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Approvazioni di esecuzione - funzionalità avanzate" href="/it/tools/exec-approvals-advanced" icon="gear">
    Binari sicuri, associazione degli interpreti e inoltro delle approvazioni alla chat.
  </Card>
  <Card title="Strumento di esecuzione" href="/it/tools/exec" icon="terminal">
    Strumento per l'esecuzione di comandi shell.
  </Card>
  <Card title="Modalità elevata" href="/it/tools/elevated" icon="shield-exclamation">
    Percorso di emergenza che ignora anche le approvazioni.
  </Card>
  <Card title="Sandboxing" href="/it/gateway/sandboxing" icon="box">
    Modalità sandbox e accesso allo spazio di lavoro.
  </Card>
  <Card title="Sicurezza" href="/it/gateway/security" icon="lock">
    Modello di sicurezza e rafforzamento.
  </Card>
  <Card title="Sandbox, criterio degli strumenti e modalità elevata a confronto" href="/it/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Quando usare ciascun controllo.
  </Card>
  <Card title="Skills" href="/it/tools/skills" icon="sparkles">
    Comportamento di autorizzazione automatica basato sulle Skills.
  </Card>
</CardGroup>
