---
read_when:
    - Configurazione delle approvazioni exec o delle liste consentite
    - Implementazione della UX di approvazione di exec nell'app macOS
    - Esame delle istruzioni per evadere dall'ambiente isolato e delle loro implicazioni
sidebarTitle: Exec approvals
summary: 'Approvazioni per l''esecuzione sull''host: controlli dei criteri, liste consentite e flusso di lavoro YOLO/rigoroso'
title: Approvazioni di esecuzione
x-i18n:
    generated_at: "2026-05-11T20:37:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2966a6f4633046941a9ef3267bad10f3a153956361b9f088fb3e29fcd3fcb99d
    source_path: tools/exec-approvals.md
    workflow: 16
---

Le approvazioni exec sono la **protezione della companion app / dell'host Node** per consentire
a un agente in sandbox di eseguire comandi su un host reale (`gateway` o `node`). Un
interblocco di sicurezza: i comandi sono consentiti solo quando policy + allowlist +
approvazione utente (opzionale) concordano tutte. Le approvazioni exec si sovrappongono **a**
policy degli strumenti e gating elevato (a meno che elevated sia impostato su `full`, che
salta le approvazioni).

<Note>
La policy effettiva è la **più restrittiva** tra `tools.exec.*` e i valori
predefiniti delle approvazioni; se un campo delle approvazioni è omesso, viene
usato il valore di `tools.exec`. Anche l'exec host usa lo stato locale delle approvazioni su quella macchina: un
`ask: "always"` locale all'host in `~/.openclaw/exec-approvals.json` continua a
mostrare richieste anche se i valori predefiniti di sessione o configurazione richiedono `ask: "on-miss"`.
</Note>

## Ispezione della policy effettiva

| Comando                                                          | Cosa mostra                                                                             |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Policy richiesta, fonti della policy host e risultato effettivo.                       |
| `openclaw exec-policy show`                                      | Vista aggregata della macchina locale.                                                  |
| `openclaw exec-policy set` / `preset`                            | Sincronizza la policy locale richiesta con il file locale delle approvazioni host in un solo passaggio. |

Quando un ambito locale richiede `host=node`, `exec-policy show` segnala tale
ambito come gestito dal Node a runtime invece di fingere che il file locale
delle approvazioni sia la fonte di verità.

Se l'interfaccia della companion app **non è disponibile**, qualsiasi richiesta che
normalmente mostrerebbe un prompt viene risolta dal **fallback di ask** (predefinito: `deny`).

<Tip>
I client di approvazione chat nativi possono inizializzare facilitazioni specifiche del canale nel
messaggio di approvazione in sospeso. Ad esempio, Matrix inizializza scorciatoie di reazione
(`✅` consenti una volta, `❌` nega, `♾️` consenti sempre) lasciando comunque
i comandi `/approve ...` nel messaggio come fallback.
</Tip>

## Dove si applica

Le approvazioni exec vengono applicate localmente sull'host di esecuzione:

- **Host Gateway** → processo `openclaw` sulla macchina Gateway.
- **Host Node** → runner del Node (companion app macOS o host Node headless).

### Modello di fiducia

- I chiamanti autenticati dal Gateway sono operatori fidati per quel Gateway.
- I nodi associati estendono quella capacità di operatore fidato all'host Node.
- Le approvazioni exec riducono il rischio di esecuzione accidentale, ma **non** sono un confine di autenticazione per utente o una policy filesystem di sola lettura.
- Una volta approvato, un comando può modificare file in base all'host selezionato o ai permessi del filesystem della sandbox.
- Le esecuzioni approvate su host Node vincolano il contesto di esecuzione canonico: cwd canonica, argv esatto, binding dell'env quando presente e percorso eseguibile fissato quando applicabile.
- Per script shell e invocazioni dirette di file tramite interprete/runtime, OpenClaw prova anche a vincolare un operando file locale concreto. Se quel file vincolato cambia dopo l'approvazione ma prima dell'esecuzione, l'esecuzione viene negata invece di eseguire contenuto divergente.
- Il binding dei file è intenzionalmente best-effort, **non** un modello semantico completo di ogni percorso di caricamento di interprete/runtime. Se la modalità di approvazione non riesce a identificare esattamente un file locale concreto da vincolare, rifiuta di creare un'esecuzione supportata da approvazione invece di fingere una copertura completa.

### Separazione macOS

- Il **servizio host Node** inoltra `system.run` all'**app macOS** tramite IPC locale.
- L'**app macOS** applica le approvazioni ed esegue il comando nel contesto dell'interfaccia.

## Impostazioni e archiviazione

Le approvazioni si trovano in un file JSON locale sull'host di esecuzione:

```text
~/.openclaw/exec-approvals.json
```

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

## Parametri della policy

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - blocca tutte le richieste di exec host.
  - `allowlist` - consenti solo i comandi nella allowlist.
  - `full` - consenti tutto (equivalente a elevated).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - non mostrare mai prompt.
  - `on-miss` - mostra prompt solo quando la allowlist non corrisponde.
  - `always` - mostra prompt a ogni comando. La fiducia duratura `allow-always` **non** sopprime i prompt quando la modalità ask effettiva è `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Risoluzione quando è richiesto un prompt ma nessuna interfaccia è raggiungibile.

- `deny` - blocca.
- `allowlist` - consenti solo se la allowlist corrisponde.
- `full` - consenti.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Quando `true`, OpenClaw tratta le forme di eval di codice inline come soggette solo ad approvazione
  anche se il binario dell'interprete stesso è nella allowlist. Difesa in profondità
  per loader di interpreti che non si mappano in modo pulito a un singolo operando file
  stabile.
</ParamField>

Esempi intercettati dalla modalità strict:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

In modalità strict questi comandi richiedono comunque approvazione esplicita, e
`allow-always` non persiste automaticamente nuove voci allowlist per essi.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Controlla solo la presentazione nei prompt di approvazione exec. Quando abilitato,
  OpenClaw può allegare intervalli di comando derivati dal parser affinché i prompt di approvazione
  Web possano evidenziare i token del comando. Impostalo su `true` per abilitare
  l'evidenziazione del testo del comando.
</ParamField>

Questa impostazione **non** cambia `security`, `ask`, la corrispondenza della allowlist,
il comportamento strict inline-eval, l'inoltro delle approvazioni o l'esecuzione dei comandi.
Può essere impostata globalmente sotto `tools.exec.commandHighlighting` o per
agente sotto `agents.list[].tools.exec.commandHighlighting`.

## Modalità YOLO (senza approvazione)

Se vuoi che l'exec host venga eseguito senza prompt di approvazione, devi aprire
**entrambi** i livelli di policy: la policy exec richiesta nella configurazione OpenClaw
(`tools.exec.*`) **e** la policy delle approvazioni locali all'host in
`~/.openclaw/exec-approvals.json`.

YOLO è il comportamento host predefinito a meno che tu non lo restringa esplicitamente:

| Livello               | Impostazione YOLO         |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` su `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**Distinzioni importanti:**

- `tools.exec.host=auto` sceglie **dove** viene eseguito exec: sandbox quando disponibile, altrimenti Gateway.
- YOLO sceglie **come** viene approvato l'exec host: `security=full` più `ask=off`.
- In modalità YOLO, OpenClaw **non** aggiunge un gate di approvazione separato basato su euristiche di offuscamento del comando o un livello di rifiuto preflight degli script sopra la policy exec host configurata.
- `auto` non rende il routing Gateway un override libero da una sessione in sandbox. Una richiesta per chiamata `host=node` è consentita da `auto`; `host=gateway` è consentito da `auto` solo quando non è attivo alcun runtime sandbox. Per un valore predefinito stabile non auto, imposta `tools.exec.host` o usa `/exec host=...` esplicitamente.

</Warning>

I provider supportati da CLI che espongono una propria modalità di permesso non interattiva
possono seguire questa policy. Claude CLI aggiunge
`--permission-mode bypassPermissions` quando la policy exec richiesta di OpenClaw
è YOLO. Esegui l'override di quel comportamento backend con argomenti Claude espliciti
sotto `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` -
ad esempio `--permission-mode default`, `acceptEdits` o
`bypassPermissions`.

Se vuoi una configurazione più conservativa, restringi di nuovo uno dei due livelli a
`allowlist` / `on-miss` o `deny`.

### Configurazione persistente "mai mostrare prompt" per host Gateway

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
- Valori predefiniti locali di `~/.openclaw/exec-approvals.json`.

È intenzionalmente solo locale. Per modificare da remoto le approvazioni dell'host Gateway o dell'host Node,
usa `openclaw approvals set --gateway` o
`openclaw approvals set --node <id|name|ip>`.

### Host Node

Per un host Node, applica invece lo stesso file di approvazioni su quel Node:

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

- `openclaw exec-policy` non sincronizza le approvazioni del Node.
- `openclaw exec-policy set --host node` viene rifiutato.
- Le approvazioni exec del Node vengono recuperate dal Node a runtime, quindi gli aggiornamenti destinati al Node devono usare `openclaw approvals --node ...`.

</Note>

### Scorciatoia solo sessione

- `/exec security=full ask=off` modifica solo la sessione corrente.
- `/elevated full` è una scorciatoia break-glass che salta anche le approvazioni exec per quella sessione.

Se il file delle approvazioni host resta più restrittivo della configurazione, la policy host
più restrittiva prevale comunque.

## Allowlist (per agente)

Le allowlist sono **per agente**. Se esistono più agenti, cambia l'agente che
stai modificando nell'app macOS. I pattern sono corrispondenze glob.

I pattern possono essere glob di percorso binario risolto o glob di nomi comando semplici.
I nomi semplici corrispondono solo ai comandi invocati tramite `PATH`, quindi `rg` può corrispondere a
`/opt/homebrew/bin/rg` quando il comando è `rg`, ma **non** a `./rg` o
`/tmp/rg`. Usa un glob di percorso quando vuoi considerare affidabile una specifica
posizione del binario.

Le voci legacy `agents.default` vengono migrate a `agents.main` al caricamento.
Le catene shell come `echo ok && pwd` richiedono comunque che ogni segmento di primo livello
soddisfi le regole della allowlist.

Esempi:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Restrizione degli argomenti con argPattern

Aggiungi `argPattern` quando una voce allowlist deve corrispondere a un binario e a una
forma specifica degli argomenti. OpenClaw valuta l'espressione regolare
rispetto agli argomenti del comando analizzati, escludendo il token eseguibile
(`argv[0]`). Per le voci scritte a mano, gli argomenti vengono uniti con un
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

Quella voce consente `python3 safe.py`; `python3 other.py` è un mancato match della allowlist. Se è presente anche una voce solo percorso per lo stesso binario, gli argomenti non corrispondenti
possono comunque ricadere su quella voce solo percorso. Ometti la voce solo percorso
quando l'obiettivo è restringere il binario agli argomenti dichiarati.

Le voci salvate dai flussi di approvazione possono usare un formato separatore interno per
la corrispondenza esatta di argv. Preferisci l'UI o il flusso di approvazione per rigenerare quelle
voci invece di modificare manualmente il valore codificato. Se OpenClaw non riesce a
analizzare argv per un segmento di comando, le voci con `argPattern` non corrispondono.

Ogni voce della lista consentita supporta:

| Campo              | Significato                                                    |
| ------------------ | -------------------------------------------------------------- |
| `pattern`          | Glob del percorso binario risolto o glob del nome comando nudo |
| `argPattern`       | Regex argv opzionale; le voci omesse sono solo percorso        |
| `id`               | UUID stabile usato per l'identità UI                           |
| `source`           | Origine della voce, come `allow-always`                        |
| `commandText`      | Testo del comando acquisito quando un flusso di approvazione ha creato la voce |
| `lastUsedAt`       | Timestamp dell'ultimo utilizzo                                 |
| `lastUsedCommand`  | Ultimo comando che ha corrisposto                              |
| `lastResolvedPath` | Ultimo percorso binario risolto                                |

## CLI Skills consentite automaticamente

Quando **Consenti automaticamente le CLI Skills** è abilitato, gli eseguibili referenziati da
Skills note vengono trattati come consentiti sui nodi (nodo macOS o host nodo
headless). Questo usa `skills.bins` tramite la RPC del Gateway per recuperare
l'elenco dei bin della skill. Disabilitalo se vuoi liste consentite manuali rigide.

<Warning>
- Questa è una **lista consentita implicita di comodità**, separata dalle voci manuali della lista consentita per percorso.
- È pensata per ambienti operatore fidati in cui Gateway e nodo sono nello stesso confine di fiducia.
- Se richiedi fiducia esplicita rigorosa, mantieni `autoAllowSkills: false` e usa solo voci manuali della lista consentita per percorso.

</Warning>

## Bin sicuri e inoltro delle approvazioni

Per i bin sicuri (il percorso rapido solo stdin), i dettagli di binding degli interpreti e
come inoltrare le richieste di approvazione a Slack/Discord/Telegram (o eseguirle come
client di approvazione nativi), consulta
[Approvazioni exec - avanzate](/it/tools/exec-approvals-advanced).

## Modifica nell'UI di controllo

Usa la scheda **UI di controllo → Nodi → Approvazioni exec** per modificare i valori predefiniti,
gli override per agente e le liste consentite. Scegli un ambito (Predefiniti o un agente),
regola la policy, aggiungi/rimuovi pattern della lista consentita, poi **Salva**. L'UI
mostra i metadati dell'ultimo utilizzo per pattern, così puoi mantenere ordinata la lista.

Il selettore di destinazione sceglie **Gateway** (approvazioni locali) o un **Nodo**.
I nodi devono pubblicizzare `system.execApprovals.get/set` (app macOS o
host nodo headless). Se un nodo non pubblicizza ancora le approvazioni exec,
modifica direttamente il suo `~/.openclaw/exec-approvals.json` locale.

CLI: `openclaw approvals` supporta la modifica del gateway o del nodo - vedi
[CLI delle approvazioni](/it/cli/approvals).

## Flusso di approvazione

Quando è richiesta una richiesta, il gateway trasmette
`exec.approval.requested` ai client operatore. L'UI di controllo e l'app macOS
la risolvono tramite `exec.approval.resolve`, poi il gateway inoltra la
richiesta approvata all'host nodo.

Per `host=node`, le richieste di approvazione includono un payload canonico
`systemRunPlan`. Il gateway usa quel piano come contesto autorevole di
comando/cwd/sessione quando inoltra le richieste `system.run` approvate.

Questo è importante per la latenza delle approvazioni async:

- Il percorso exec del nodo prepara in anticipo un unico piano canonico.
- Il record di approvazione memorizza quel piano e i relativi metadati di binding.
- Una volta approvata, la chiamata finale `system.run` inoltrata riusa il piano memorizzato invece di fidarsi di modifiche successive del chiamante.
- Se il chiamante modifica `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey` dopo la creazione della richiesta di approvazione, il gateway rifiuta l'esecuzione inoltrata come mancata corrispondenza dell'approvazione.

## Eventi di sistema

Il ciclo di vita exec viene esposto come messaggi di sistema:

- `Exec running` (solo se il comando supera la soglia di avviso di esecuzione).
- `Exec finished`.
- `Exec denied`.

Questi vengono pubblicati nella sessione dell'agente dopo che il nodo segnala l'evento.
Le approvazioni exec ospitate dal Gateway emettono gli stessi eventi del ciclo di vita quando il
comando termina (e opzionalmente quando l'esecuzione dura più della soglia).
Gli exec protetti da approvazione riusano l'id di approvazione come `runId` in questi
messaggi per una correlazione semplice.

## Comportamento delle approvazioni negate

Quando un'approvazione exec async viene negata, OpenClaw impedisce all'agente di
riusare l'output di qualsiasi esecuzione precedente dello stesso comando nella sessione.
Il motivo del diniego viene passato con indicazioni esplicite che nessun output del comando
è disponibile, impedendo all'agente di sostenere che ci sia nuovo output o
di ripetere il comando negato con risultati obsoleti da una precedente esecuzione
riuscita.

## Implicazioni

- **`full`** è potente; preferisci le liste consentite quando possibile.
- **`ask`** ti mantiene nel loop consentendo comunque approvazioni rapide.
- Le liste consentite per agente impediscono che le approvazioni di un agente si propaghino ad altri.
- Le approvazioni si applicano solo alle richieste exec host provenienti da **mittenti autorizzati**. I mittenti non autorizzati non possono emettere `/exec`.
- `/exec security=full` è una comodità a livello di sessione per operatori autorizzati e salta le approvazioni per progettazione. Per bloccare rigidamente host exec, imposta la sicurezza delle approvazioni su `deny` o nega lo strumento `exec` tramite la policy degli strumenti.

## Correlati

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/it/tools/exec-approvals-advanced" icon="gear">
    Bin sicuri, binding degli interpreti e inoltro delle approvazioni alla chat.
  </Card>
  <Card title="Exec tool" href="/it/tools/exec" icon="terminal">
    Strumento di esecuzione dei comandi shell.
  </Card>
  <Card title="Elevated mode" href="/it/tools/elevated" icon="shield-exclamation">
    Percorso break-glass che salta anche le approvazioni.
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
    Comportamento di autorizzazione automatica basato su Skills.
  </Card>
</CardGroup>
