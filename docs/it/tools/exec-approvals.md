---
read_when:
    - Configurazione delle approvazioni exec o degli elenchi consentiti
    - Implementare la UX di approvazione exec nell’app macOS
    - Revisione dei prompt di evasione dalla sandbox e delle loro implicazioni
sidebarTitle: Exec approvals
summary: 'Approvazioni per l’esecuzione sull’host: opzioni di policy, allowlist e flusso di lavoro YOLO/strict'
title: Approvazioni di esecuzione
x-i18n:
    generated_at: "2026-06-27T18:20:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a4a5c9c56da458fdb25d5fe698df305af17188695d8befc1d4cfd8e8333e96
    source_path: tools/exec-approvals.md
    workflow: 16
---

Le approvazioni exec sono la **barriera dell'app companion / host nodo** che consente
a un agente in sandbox di eseguire comandi su un host reale (`gateway` o `node`). Un
interblocco di sicurezza: i comandi sono consentiti solo quando policy + allowlist +
approvazione utente (opzionale) concordano tutte. Le approvazioni exec si sovrappongono **a**
policy degli strumenti e gate elevato (a meno che elevated sia impostato su `full`, che
salta le approvazioni).

Per una panoramica orientata alle modalità di `deny`, `allowlist`, `ask`, `auto`, `full`,
mappatura di Codex Guardian e autorizzazioni dell'harness ACPX, vedi
[Modalità di autorizzazione](/it/tools/permission-modes).

<Note>
La policy effettiva è la **più restrittiva** tra `tools.exec.*` e i valori
predefiniti delle approvazioni; se un campo delle approvazioni è omesso, viene
usato il valore `tools.exec`. L'exec host usa anche lo stato locale delle
approvazioni su quella macchina: un `ask: "always"` locale dell'host nel file
delle approvazioni dell'host di esecuzione continua a mostrare prompt anche se
i valori predefiniti di sessione o configurazione richiedono `ask: "on-miss"`.
</Note>

## Ispezionare la policy effettiva

| Comando                                                          | Cosa mostra                                                                            |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Policy richiesta, fonti della policy host e risultato effettivo.                       |
| `openclaw exec-policy show`                                      | Vista unificata della macchina locale.                                                 |
| `openclaw exec-policy set` / `preset`                            | Sincronizza in un solo passaggio la policy locale richiesta con il file locale delle approvazioni host. |

Quando un ambito locale richiede `host=node`, `exec-policy show` segnala
quell'ambito come gestito dal nodo a runtime invece di fingere che il file
locale delle approvazioni sia la fonte di verità.

Se l'interfaccia dell'app companion **non è disponibile**, qualsiasi richiesta
che normalmente mostrerebbe un prompt viene risolta dal **fallback ask**
(predefinito: `deny`).

<Tip>
I client di approvazione chat nativi possono predisporre affordance specifiche
del canale sul messaggio di approvazione in sospeso. Per esempio, Matrix
predispone scorciatoie di reazione (`✅` consenti una volta, `❌` nega,
`♾️` consenti sempre) lasciando comunque i comandi `/approve ...` nel messaggio
come fallback.
</Tip>

## Dove si applica

Le approvazioni exec vengono applicate localmente sull'host di esecuzione:

- **Host Gateway** → processo `openclaw` sulla macchina gateway.
- **Host nodo** → runner del nodo (app companion macOS o host nodo headless).

### Modello di fiducia

- I chiamanti autenticati dal Gateway sono operatori fidati per quel Gateway.
- I nodi associati estendono quella capacità di operatore fidato all'host nodo.
- Le approvazioni exec riducono il rischio di esecuzioni accidentali, ma **non** sono un confine di autenticazione per utente o una policy di filesystem in sola lettura.
- Una volta approvato, un comando può modificare i file in base alle autorizzazioni del filesystem dell'host o della sandbox selezionati.
- Le esecuzioni approvate sull'host nodo vincolano il contesto di esecuzione canonico: cwd canonica, argv esatto, binding dell'env quando presente e percorso dell'eseguibile fissato quando applicabile.
- Per script shell e invocazioni dirette di file tramite interprete/runtime, OpenClaw prova anche a vincolare un operando file locale concreto. Se quel file vincolato cambia dopo l'approvazione ma prima dell'esecuzione, l'esecuzione viene negata invece di eseguire contenuto divergente.
- Il binding dei file è intenzionalmente best-effort, **non** un modello semantico completo di ogni percorso di caricamento di interprete/runtime. Se la modalità di approvazione non può identificare esattamente un file locale concreto da vincolare, rifiuta di creare un'esecuzione supportata da approvazione invece di fingere una copertura completa.

### Separazione macOS

- Il **servizio host nodo** inoltra `system.run` all'**app macOS** tramite IPC locale.
- L'**app macOS** applica le approvazioni ed esegue il comando nel contesto UI.

## Impostazioni e archiviazione

Le approvazioni risiedono in un file JSON locale sull'host di esecuzione. Quando
`OPENCLAW_STATE_DIR` è impostato, il file segue quella directory di stato;
altrimenti usa la directory di stato predefinita di OpenClaw:

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# otherwise
~/.openclaw/exec-approvals.json
```

Il socket di approvazione predefinito segue la stessa radice:
`$OPENCLAW_STATE_DIR/exec-approvals.sock`, oppure
`~/.openclaw/exec-approvals.sock` quando la variabile non è impostata.

Schema di esempio:

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
          "commandText": "rg -n TODO",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Manopole della policy

### `tools.exec.mode`

`tools.exec.mode` è la superficie di policy normalizzata preferita per l'exec host.
I valori sono:

- `deny` - blocca l'exec host.
- `allowlist` - esegui senza chiedere solo i comandi nella allowlist.
- `ask` - usa la policy allowlist e chiedi in caso di mancata corrispondenza.
- `auto` - usa la policy allowlist, esegui direttamente le corrispondenze deterministiche e invia le mancate corrispondenze di approvazione al revisore automatico nativo di OpenClaw prima di ricorrere a un percorso di approvazione umano.
- `full` - esegui l'exec host senza prompt di approvazione.

I legacy `tools.exec.security` / `tools.exec.ask` restano supportati e prevalgono ancora
quando impostati all'ambito più ristretto di sessione o agente.

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - blocca tutte le richieste di exec host.
  - `allowlist` - consenti solo i comandi nella allowlist.
  - `full` - consenti tutto (equivalente a elevated).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  Policy ask configurata per l'exec host. Controlla il comportamento base dei
  prompt di approvazione da `tools.exec.ask` e dai valori predefiniti delle
  approvazioni host. Il parametro strumento `ask` per chiamata (vedi
  [Strumento Exec](/it/tools/exec#parameters)) può solo irrigidire quella base,
  e le chiamate modello originate da canale lo ignorano quando l'ask host
  effettivo è `off`.

- `off` - non mostrare mai prompt.
- `on-miss` - mostra prompt solo quando la allowlist non corrisponde.
- `always` - mostra prompt a ogni comando. La fiducia duratura `allow-always` **non** sopprime i prompt quando la modalità ask effettiva è `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Risoluzione quando è richiesto un prompt ma non è raggiungibile alcuna UI. Se
  questo campo è omesso, OpenClaw usa `deny` come valore predefinito.

- `deny` - blocca.
- `allowlist` - consenti solo se la allowlist corrisponde.
- `full` - consenti.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Quando `true`, OpenClaw tratta le forme di valutazione inline del codice
  come soggette solo ad approvazione anche se il binario dell'interprete stesso
  è nella allowlist. Difesa in profondità per loader di interpreti che non si
  mappano in modo netto a un solo operando file stabile.
</ParamField>

Esempi intercettati dalla modalità rigorosa:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

In modalità rigorosa questi comandi richiedono comunque approvazione esplicita, e
`allow-always` non conserva automaticamente nuove voci di allowlist per loro.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Controlla solo la presentazione nei prompt di approvazione exec. Quando
  abilitato, OpenClaw può allegare intervalli di comando derivati dal parser
  così che i prompt di approvazione Web possano evidenziare i token del
  comando. Impostalo su `true` per abilitare l'evidenziazione del testo del
  comando.
</ParamField>

Questa impostazione **non** cambia `security`, `ask`, la corrispondenza della
allowlist, il comportamento strict inline-eval, l'inoltro delle approvazioni o
l'esecuzione dei comandi. Può essere impostata globalmente sotto
`tools.exec.commandHighlighting` o per agente sotto
`agents.list[].tools.exec.commandHighlighting`.

## Modalità YOLO (senza approvazione)

Se vuoi che l'exec host venga eseguito senza prompt di approvazione, devi aprire
**entrambi** i livelli di policy: la policy exec richiesta nella configurazione
OpenClaw (`tools.exec.*`) **e** la policy di approvazione locale dell'host nel
file delle approvazioni dell'host di esecuzione.

OpenClaw imposta i `askFallback` omessi su `deny` per impostazione predefinita.
Imposta esplicitamente `askFallback` dell'host su `full` quando un prompt di
approvazione senza UI deve ricadere su allow.

| Livello               | Impostazione YOLO          |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` su `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**Distinzioni importanti:**

- `tools.exec.host=auto` sceglie **dove** viene eseguito exec: sandbox quando disponibile, altrimenti gateway.
- YOLO sceglie **come** viene approvato l'exec host: `security=full` più `ask=off`.
- In modalità YOLO, OpenClaw **non** aggiunge un gate di approvazione separato euristico per l'offuscamento dei comandi o un livello di rifiuto preflight degli script sopra la policy exec host configurata.
- `auto` non rende il routing gateway un override libero da una sessione in sandbox. Una richiesta per chiamata `host=node` è consentita da `auto`; `host=gateway` è consentito da `auto` solo quando non è attivo alcun runtime sandbox. Per un valore predefinito stabile non automatico, imposta `tools.exec.host` oppure usa esplicitamente `/exec host=...`.

</Warning>

I provider basati su CLI che espongono una propria modalità di autorizzazione
non interattiva possono seguire questa policy. Claude CLI aggiunge
`--permission-mode bypassPermissions` quando la policy exec effettiva di
OpenClaw è YOLO. Per le sessioni live Claude gestite da OpenClaw, la policy exec
effettiva di OpenClaw è autoritativa rispetto alla modalità di autorizzazione
nativa di Claude: YOLO normalizza gli avvii live a
`--permission-mode bypassPermissions`, e una policy exec effettiva restrittiva
normalizza gli avvii live a `--permission-mode default`, anche se gli argomenti
grezzi del backend Claude specificano un'altra modalità.

Se vuoi una configurazione più conservativa, restringi di nuovo la policy exec di
OpenClaw a `allowlist` / `on-miss` o `deny`.

### Configurazione persistente "non mostrare mai prompt" per host gateway

<Steps>
  <Step title="Imposta la policy di configurazione richiesta">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Allinea il file delle approvazioni host">
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

Quella scorciatoia locale aggiorna entrambi:

- `tools.exec.host/security/ask` locali.
- Valori predefiniti del file locale delle approvazioni, incluso `askFallback: "full"`.

È intenzionalmente solo locale. Per modificare da remoto le approvazioni
dell'host gateway o dell'host nodo, usa `openclaw approvals set --gateway` oppure
`openclaw approvals set --node <id|name|ip>`.

### Host Node

Per un host nodo, applica invece lo stesso file delle approvazioni su quel nodo:

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
**Limitazioni solo locali:**

- `openclaw exec-policy` non sincronizza le approvazioni del nodo.
- `openclaw exec-policy set --host node` viene rifiutato.
- Le approvazioni exec del nodo vengono recuperate dal nodo a runtime, quindi gli aggiornamenti destinati al nodo devono usare `openclaw approvals --node ...`.

</Note>

### Scorciatoia solo sessione

- `/exec security=full ask=off` modifica solo la sessione corrente.
- `/elevated full` è una scorciatoia di emergenza che salta le approvazioni exec solo quando
  sia la policy richiesta sia il file delle approvazioni dell'host si risolvono in
  `security: "full"` e `ask: "off"`. Un file host più restrittivo, come
  `ask: "always"`, richiede comunque conferma.

Se il file delle approvazioni dell'host rimane più restrittivo della configurazione, la policy
host più restrittiva continua a prevalere.

## Allowlist (per agente)

Le allowlist sono **per agente**. Se esistono più agenti, cambia l'agente
che stai modificando nell'app macOS. I pattern sono corrispondenze glob.

I pattern possono essere glob di percorsi binari risolti o glob di nomi comando semplici.
I nomi semplici corrispondono solo ai comandi invocati tramite `PATH`, quindi `rg` può corrispondere a
`/opt/homebrew/bin/rg` quando il comando è `rg`, ma **non** a `./rg` o
`/tmp/rg`. Usa un glob di percorso quando vuoi considerare attendibile una posizione
binaria specifica.

Le voci legacy `agents.default` vengono migrate a `agents.main` al caricamento.
Le catene shell come `echo ok && pwd` devono comunque avere ogni segmento di primo livello
conforme alle regole dell'allowlist.

Esempi:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Limitare gli argomenti con argPattern

Aggiungi `argPattern` quando una voce allowlist deve corrispondere a un binario e a una
forma specifica degli argomenti. OpenClaw valuta l'espressione regolare
rispetto agli argomenti del comando analizzati, escludendo il token dell'eseguibile
(`argv[0]`). Per le voci scritte manualmente, gli argomenti vengono uniti con un
singolo spazio, quindi ancora il pattern quando ti serve una corrispondenza esatta.

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

Quella voce consente `python3 safe.py`; `python3 other.py` non corrisponde all'allowlist.
Se è presente anche una voce solo percorso per lo stesso binario, gli
argomenti non corrispondenti possono comunque ricadere su quella voce solo percorso. Ometti la voce
solo percorso quando l'obiettivo è limitare il binario agli argomenti dichiarati.

Le voci salvate dai flussi di approvazione possono usare un formato separatore interno per la
corrispondenza esatta di argv. Preferisci l'UI o il flusso di approvazione per rigenerare quelle
voci invece di modificare manualmente il valore codificato. Se OpenClaw non riesce ad
analizzare argv per un segmento di comando, le voci con `argPattern` non corrispondono.

Ogni voce allowlist supporta:

| Campo              | Significato                                                   |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Glob di percorso binario risolto o glob di nome comando semplice |
| `argPattern`       | Regex argv opzionale; le voci omesse sono solo percorso       |
| `id`               | UUID stabile usato per l'identità nell'UI                     |
| `source`           | Origine della voce, come `allow-always`                       |
| `commandText`      | Testo del comando acquisito quando un flusso di approvazione ha creato la voce |
| `lastUsedAt`       | Timestamp dell'ultimo utilizzo                                |
| `lastUsedCommand`  | Ultimo comando che ha corrisposto                            |
| `lastResolvedPath` | Ultimo percorso binario risolto                               |

## Consenti automaticamente le CLI delle Skills

Quando **Consenti automaticamente le CLI delle Skills** è abilitato, gli eseguibili referenziati da
Skills note vengono trattati come inclusi nell'allowlist sui nodi (nodo macOS o host
nodo headless). Questo usa `skills.bins` tramite la RPC del Gateway per recuperare
l'elenco dei bin delle Skills. Disabilitalo se vuoi allowlist manuali rigorose.

<Warning>
- Questa è un'**allowlist implicita di comodità**, separata dalle voci allowlist manuali dei percorsi.
- È pensata per ambienti operatore attendibili in cui Gateway e nodo si trovano nello stesso confine di attendibilità.
- Se richiedi attendibilità esplicita rigorosa, mantieni `autoAllowSkills: false` e usa solo voci allowlist manuali dei percorsi.

</Warning>

## Bin sicuri e inoltro delle approvazioni

Per i bin sicuri (il percorso rapido solo stdin), i dettagli di associazione degli interpreti e
come inoltrare le richieste di approvazione a Slack/Discord/Telegram (o eseguirle come
client di approvazione nativi), consulta
[Approvazioni exec - avanzate](/it/tools/exec-approvals-advanced).

## Modifica nella Control UI

Usa la scheda **Control UI → Nodi → Approvazioni exec** per modificare i valori predefiniti,
gli override per agente e le allowlist. Scegli un ambito (Predefiniti o un agente),
regola la policy, aggiungi/rimuovi pattern allowlist, quindi **Salva**. L'UI
mostra i metadati dell'ultimo utilizzo per pattern, così puoi mantenere ordinato l'elenco.

Il selettore di destinazione sceglie **Gateway** (approvazioni locali) o un **Nodo**.
I nodi devono pubblicizzare `system.execApprovals.get/set` (app macOS o
host nodo headless). Se un nodo non pubblicizza ancora le approvazioni exec,
modifica direttamente il suo file locale delle approvazioni.

CLI: `openclaw approvals` supporta la modifica di gateway o nodo - consulta
[CLI delle approvazioni](/it/cli/approvals).

## Flusso di approvazione

Quando è richiesta una conferma, il gateway trasmette
`exec.approval.requested` ai client operatore. La Control UI e l'app macOS
la risolvono tramite `exec.approval.resolve`, quindi il gateway inoltra la
richiesta approvata all'host nodo.

Per `host=node`, le richieste di approvazione includono un payload canonico
`systemRunPlan`. Il gateway usa quel piano come contesto
comando/cwd/sessione autorevole quando inoltra le richieste `system.run`
approvate.

Questo è importante per la latenza dell'approvazione asincrona:

- Il percorso exec del nodo prepara in anticipo un piano canonico.
- Il record di approvazione memorizza quel piano e i relativi metadati di associazione.
- Dopo l'approvazione, la chiamata finale inoltrata a `system.run` riusa il piano memorizzato invece di fidarsi di modifiche successive del chiamante.
- Se il chiamante modifica `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey` dopo la creazione della richiesta di approvazione, il gateway rifiuta l'esecuzione inoltrata come mancata corrispondenza dell'approvazione.

## Eventi di sistema

Il ciclo di vita exec viene esposto come messaggi di sistema:

- `Exec running` (solo se il comando supera la soglia di avviso di esecuzione).
- `Exec finished`.

Questi vengono pubblicati nella sessione dell'agente dopo che il nodo segnala l'evento.
Le approvazioni exec negate sono terminali per il comando host stesso: il comando
non viene eseguito. Per le approvazioni asincrone dell'agente principale con una sessione di origine,
OpenClaw pubblica il rifiuto in quella sessione come follow-up interno, così
l'agente può smettere di attendere il comando asincrono ed evitare una riparazione per risultato mancante.
Se non c'è una sessione o la sessione non può essere ripresa, OpenClaw può comunque
segnalare un rifiuto conciso all'operatore o alla rotta di chat diretta. I rifiuti per
le sessioni dei subagenti non vengono ripubblicati nel subagente.
Le approvazioni exec host Gateway emettono gli stessi eventi del ciclo di vita quando il
comando termina (e facoltativamente quando resta in esecuzione oltre la soglia).
Gli exec soggetti ad approvazione riusano l'id di approvazione come `runId` in questi
messaggi per una correlazione semplice.

## Comportamento in caso di approvazione negata

Quando un'approvazione exec asincrona viene negata, OpenClaw tratta il comando host come
terminale e fail-closed. Per le sessioni dell'agente principale, il rifiuto viene consegnato come
follow-up interno della sessione che comunica all'agente che il comando asincrono non è stato eseguito.
Questo preserva la continuità della trascrizione senza esporre output di comando obsoleto. Se
la consegna alla sessione non è disponibile, OpenClaw ricade su un rifiuto conciso all'operatore o
alla chat diretta quando esiste una rotta sicura.

## Implicazioni

- **`full`** è potente; preferisci le allowlist quando possibile.
- **`ask`** ti mantiene nel circuito consentendo comunque approvazioni rapide.
- Le allowlist per agente impediscono che le approvazioni di un agente passino ad altri.
- Le approvazioni si applicano solo alle richieste exec host da **mittenti autorizzati**. I mittenti non autorizzati non possono emettere `/exec`.
- `/exec security=full` è una comodità a livello di sessione per operatori autorizzati e salta le approvazioni per progettazione. Per bloccare rigidamente l'exec host, imposta la sicurezza delle approvazioni su `deny` o nega lo strumento `exec` tramite la policy degli strumenti.

## Correlati

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/it/tools/exec-approvals-advanced" icon="gear">
    Bin sicuri, associazione degli interpreti e inoltro delle approvazioni alla chat.
  </Card>
  <Card title="Exec tool" href="/it/tools/exec" icon="terminal">
    Strumento di esecuzione dei comandi shell.
  </Card>
  <Card title="Elevated mode" href="/it/tools/elevated" icon="shield-exclamation">
    Percorso di emergenza che salta anche le approvazioni.
  </Card>
  <Card title="Sandboxing" href="/it/gateway/sandboxing" icon="box">
    Modalità sandbox e accesso al workspace.
  </Card>
  <Card title="Security" href="/it/gateway/security" icon="lock">
    Modello di sicurezza e hardening.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/it/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Quando usare ciascun controllo.
  </Card>
  <Card title="Skills" href="/it/tools/skills" icon="sparkles">
    Comportamento di auto-consenso basato su Skills.
  </Card>
</CardGroup>
