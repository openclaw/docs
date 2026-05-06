---
read_when:
    - Configurazione delle approvazioni exec o delle allowlist
    - Implementazione della UX per l'approvazione di exec nell'app macOS
    - Analisi dei prompt di evasione dalla sandbox e delle loro implicazioni
sidebarTitle: Exec approvals
summary: 'Approvazioni host exec: opzioni di policy, allowlist e flusso di lavoro YOLO/rigoroso'
title: Approvazioni di esecuzione
x-i18n:
    generated_at: "2026-05-06T09:11:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: c404fbc80624e31603cfc3f9ca6318534d53e0277af107600c726f97e11b223b
    source_path: tools/exec-approvals.md
    workflow: 16
---

Le approvazioni exec sono la **protezione dell'app complementare / host node** per consentire
a un agente in sandbox di eseguire comandi su un host reale (`gateway` o `node`). Un
interblocco di sicurezza: i comandi sono consentiti solo quando policy + allowlist +
approvazione utente (facoltativa) concordano tutti. Le approvazioni exec si sovrappongono **a**
tool policy e gating elevato (a meno che elevated sia impostato su `full`, nel qual caso
le approvazioni vengono saltate).

<Note>
La policy effettiva è la **più restrittiva** tra `tools.exec.*` e i valori
predefiniti delle approvazioni; se un campo delle approvazioni è omesso, viene
usato il valore di `tools.exec`. L'exec host usa anche lo stato locale delle approvazioni su quella macchina: un
`ask: "always"` locale dell'host in `~/.openclaw/exec-approvals.json` continua a
mostrare richieste anche se i valori predefiniti di sessione o configurazione richiedono `ask: "on-miss"`.
</Note>

## Ispezione della policy effettiva

| Comando                                                          | Cosa mostra                                                                           |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Policy richiesta, fonti della policy host e risultato effettivo.                       |
| `openclaw exec-policy show`                                      | Vista aggregata della macchina locale.                                                 |
| `openclaw exec-policy set` / `preset`                            | Sincronizza in un unico passaggio la policy locale richiesta con il file locale delle approvazioni host. |

Quando un ambito locale richiede `host=node`, `exec-policy show` segnala quell'
ambito come gestito dal node a runtime invece di fingere che il file locale delle
approvazioni sia la fonte di verità.

Se l'interfaccia utente dell'app complementare **non è disponibile**, qualsiasi richiesta che
normalmente mostrerebbe un prompt viene risolta dal **fallback ask** (predefinito: `deny`).

<Tip>
I client nativi di approvazione chat possono predisporre opzioni specifiche del canale nel
messaggio di approvazione in sospeso. Ad esempio, Matrix predispone scorciatoie con reazioni
(`✅` consenti una volta, `❌` nega, `♾️` consenti sempre) lasciando comunque
i comandi `/approve ...` nel messaggio come fallback.
</Tip>

## Dove si applica

Le approvazioni exec sono applicate localmente sull'host di esecuzione:

- **Host Gateway** → processo `openclaw` sulla macchina gateway.
- **Host Node** → runner node (app complementare macOS o host node headless).

### Modello di fiducia

- I chiamanti autenticati dal Gateway sono operatori attendibili per quel Gateway.
- I node associati estendono quella capacità di operatore attendibile all'host node.
- Le approvazioni exec riducono il rischio di esecuzioni accidentali, ma **non** sono un perimetro di autenticazione per utente.
- Le esecuzioni approvate sull'host node vincolano il contesto di esecuzione canonico: cwd canonica, argv esatto, binding dell'env quando presente e percorso eseguibile fissato quando applicabile.
- Per script shell e invocazioni dirette di file tramite interprete/runtime, OpenClaw prova anche a vincolare un operando file locale concreto. Se quel file vincolato cambia dopo l'approvazione ma prima dell'esecuzione, l'esecuzione viene negata invece di eseguire contenuto modificato.
- Il binding dei file è intenzionalmente best-effort, **non** un modello semantico completo di ogni percorso di caricamento interprete/runtime. Se la modalità di approvazione non può identificare esattamente un file locale concreto da vincolare, rifiuta di generare un'esecuzione basata su approvazione invece di fingere una copertura completa.

### Separazione macOS

- Il **servizio host node** inoltra `system.run` all'**app macOS** tramite IPC locale.
- L'**app macOS** applica le approvazioni ed esegue il comando nel contesto UI.

## Impostazioni e archiviazione

Le approvazioni risiedono in un file JSON locale sull'host di esecuzione:

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

## Manopole della policy

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - blocca tutte le richieste exec host.
  - `allowlist` - consente solo i comandi in allowlist.
  - `full` - consente tutto (equivalente a elevated).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - non mostra mai prompt.
  - `on-miss` - mostra un prompt solo quando l'allowlist non corrisponde.
  - `always` - mostra un prompt per ogni comando. La fiducia durevole `allow-always` **non** sopprime i prompt quando la modalità ask effettiva è `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Risoluzione quando è richiesto un prompt ma non è raggiungibile alcuna UI.

- `deny` - blocca.
- `allowlist` - consente solo se l'allowlist corrisponde.
- `full` - consente.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Quando è `true`, OpenClaw tratta le forme inline code-eval come soggette solo ad approvazione
  anche se il binario dell'interprete stesso è in allowlist. Difesa in profondità
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

## Modalità YOLO (senza approvazione)

Se vuoi che host exec venga eseguito senza prompt di approvazione, devi aprire
**entrambi** i livelli di policy: la policy exec richiesta nella configurazione di OpenClaw
(`tools.exec.*`) **e** la policy locale delle approvazioni host in
`~/.openclaw/exec-approvals.json`.

YOLO è il comportamento host predefinito a meno che tu non lo restringa esplicitamente:

| Livello               | Impostazione YOLO         |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` su `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**Distinzioni importanti:**

- `tools.exec.host=auto` sceglie **dove** viene eseguito exec: sandbox quando disponibile, altrimenti gateway.
- YOLO sceglie **come** viene approvato host exec: `security=full` più `ask=off`.
- In modalità YOLO, OpenClaw **non** aggiunge un gate di approvazione euristico separato per offuscamento dei comandi né un livello di rifiuto preflight degli script sopra la policy host exec configurata.
- `auto` non rende il routing gateway un override libero da una sessione in sandbox. Una richiesta per chiamata `host=node` è consentita da `auto`; `host=gateway` è consentito da `auto` solo quando non è attivo alcun runtime sandbox. Per un valore predefinito stabile non-auto, imposta `tools.exec.host` o usa esplicitamente `/exec host=...`.

</Warning>

I provider basati su CLI che espongono una propria modalità di permessi non interattiva
possono seguire questa policy. Claude CLI aggiunge
`--permission-mode bypassPermissions` quando la policy exec richiesta di OpenClaw
è YOLO. Sovrascrivi quel comportamento del backend con argomenti Claude espliciti
in `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs`:
ad esempio `--permission-mode default`, `acceptEdits` o
`bypassPermissions`.

Se vuoi una configurazione più conservativa, riporta uno dei due livelli a
`allowlist` / `on-miss` o `deny`.

### Configurazione persistente "non mostrare mai prompt" per host Gateway

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

È intenzionalmente solo locale. Per modificare da remoto le approvazioni dell'host gateway o dell'host node, usa `openclaw approvals set --gateway` o
`openclaw approvals set --node <id|name|ip>`.

### Host Node

Per un host node, applica invece lo stesso file delle approvazioni su quel node:

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

- `openclaw exec-policy` non sincronizza le approvazioni del node.
- `openclaw exec-policy set --host node` viene rifiutato.
- Le approvazioni exec del Node vengono recuperate dal node a runtime, quindi gli aggiornamenti mirati al node devono usare `openclaw approvals --node ...`.

</Note>

### Scorciatoia solo sessione

- `/exec security=full ask=off` modifica solo la sessione corrente.
- `/elevated full` è una scorciatoia break-glass che salta anche le approvazioni exec per quella sessione.

Se il file delle approvazioni host resta più restrittivo della configurazione, continua a vincere la policy host più restrittiva.

## Allowlist (per agente)

Le allowlist sono **per agente**. Se esistono più agenti, cambia nell'app macOS l'agente
che stai modificando. I pattern sono corrispondenze glob.

I pattern possono essere glob di percorsi binari risolti o glob di nomi comando nudi.
I nomi nudi corrispondono solo ai comandi invocati tramite `PATH`, quindi `rg` può corrispondere a
`/opt/homebrew/bin/rg` quando il comando è `rg`, ma **non** a `./rg` o
`/tmp/rg`. Usa un glob di percorso quando vuoi considerare attendibile una posizione binaria specifica.

Le voci legacy `agents.default` vengono migrate a `agents.main` al caricamento.
Le catene shell come `echo ok && pwd` richiedono comunque che ogni segmento di primo livello
soddisfi le regole allowlist.

Esempi:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Limitare gli argomenti con argPattern

Aggiungi `argPattern` quando una voce allowlist deve corrispondere a un binario e a
una forma specifica degli argomenti. OpenClaw valuta l'espressione regolare
sugli argomenti del comando analizzati, escludendo il token dell'eseguibile
(`argv[0]`). Per le voci scritte a mano, gli argomenti sono uniti con un
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

Quella voce consente `python3 safe.py`; `python3 other.py` è un mancato
riscontro dell'allowlist. Se è presente anche una voce solo percorso per lo
stesso binario, gli argomenti non corrispondenti possono comunque ricadere su
quella voce solo percorso. Ometti la voce solo percorso quando l'obiettivo è
limitare il binario agli argomenti dichiarati.

Le voci salvate dai flussi di approvazione possono usare un formato di separatore interno per
la corrispondenza esatta di argv. Preferisci la UI o il flusso di approvazione per rigenerare quelle
voci invece di modificare a mano il valore codificato. Se OpenClaw non può
analizzare argv per un segmento di comando, le voci con `argPattern` non corrispondono.

Ogni voce allowlist supporta:

| Campo              | Significato                                                       |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Glob del percorso binario risolto o glob del nome del comando semplice           |
| `argPattern`       | Regex argv opzionale; le voci omesse sono solo percorso            |
| `id`               | UUID stabile usato per l'identità UI                              |
| `source`           | Origine della voce, ad esempio `allow-always`                          |
| `commandText`      | Testo del comando acquisito quando un flusso di approvazione ha creato la voce |
| `lastUsedAt`       | Timestamp dell'ultimo utilizzo                                           |
| `lastUsedCommand`  | Ultimo comando corrispondente                                     |
| `lastResolvedPath` | Ultimo percorso binario risolto                                     |

## Consenti automaticamente le CLI delle skill

Quando **Consenti automaticamente le CLI delle skill** è abilitato, gli eseguibili referenziati da
skill note vengono trattati come consentiti sui nodi (nodo macOS o host
di nodo headless). Questo usa `skills.bins` tramite RPC del Gateway per recuperare
l'elenco dei bin della skill. Disabilitalo se vuoi allowlist manuali rigorose.

<Warning>
- Questa è una **allowlist implicita di convenienza**, separata dalle voci manuali della allowlist dei percorsi.
- È destinata ad ambienti operatore attendibili in cui Gateway e nodo sono nello stesso confine di fiducia.
- Se richiedi fiducia esplicita rigorosa, mantieni `autoAllowSkills: false` e usa solo voci manuali della allowlist dei percorsi.

</Warning>

## Bin sicuri e inoltro delle approvazioni

Per i bin sicuri (il percorso rapido solo stdin), i dettagli di binding dell'interprete e
come inoltrare le richieste di approvazione a Slack/Discord/Telegram (o eseguirle come
client di approvazione nativi), consulta
[Approvazioni exec - avanzate](/it/tools/exec-approvals-advanced).

## Modifica nella Control UI

Usa la scheda **Control UI → Nodi → Approvazioni exec** per modificare i valori predefiniti,
le sostituzioni per agente e le allowlist. Scegli un ambito (Predefiniti o un agente),
modifica la policy, aggiungi/rimuovi pattern dalla allowlist, quindi **Salva**. La UI
mostra i metadati dell'ultimo utilizzo per pattern, così puoi mantenere l'elenco ordinato.

Il selettore di destinazione sceglie **Gateway** (approvazioni locali) o un **Nodo**.
I nodi devono dichiarare `system.execApprovals.get/set` (app macOS o
host di nodo headless). Se un nodo non dichiara ancora le approvazioni exec,
modifica direttamente il suo `~/.openclaw/exec-approvals.json` locale.

CLI: `openclaw approvals` supporta la modifica di gateway o nodo - vedi
[CLI delle approvazioni](/it/cli/approvals).

## Flusso di approvazione

Quando è richiesta una richiesta, il gateway trasmette
`exec.approval.requested` ai client operatore. La Control UI e l'app macOS
la risolvono tramite `exec.approval.resolve`, quindi il gateway inoltra la
richiesta approvata all'host del nodo.

Per `host=node`, le richieste di approvazione includono un payload `systemRunPlan`
canonico. Il gateway usa quel piano come contesto autorevole
di comando/cwd/sessione quando inoltra le richieste `system.run`
approvate.

Questo è importante per la latenza delle approvazioni asincrone:

- Il percorso exec del nodo prepara un piano canonico iniziale.
- Il record di approvazione memorizza quel piano e i relativi metadati di binding.
- Una volta approvata, la chiamata finale inoltrata a `system.run` riutilizza il piano memorizzato invece di fidarsi di modifiche successive del chiamante.
- Se il chiamante modifica `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey` dopo la creazione della richiesta di approvazione, il gateway rifiuta l'esecuzione inoltrata come mancata corrispondenza dell'approvazione.

## Eventi di sistema

Il ciclo di vita exec viene esposto come messaggi di sistema:

- `Exec running` (solo se il comando supera la soglia dell'avviso di esecuzione).
- `Exec finished`.
- `Exec denied`.

Questi vengono pubblicati nella sessione dell'agente dopo che il nodo segnala l'evento.
Le approvazioni exec ospitate dal Gateway emettono gli stessi eventi del ciclo di vita quando il
comando termina (e opzionalmente quando resta in esecuzione più a lungo della soglia).
Gli exec protetti da approvazione riutilizzano l'id dell'approvazione come `runId` in questi
messaggi per una correlazione semplice.

## Comportamento in caso di approvazione negata

Quando un'approvazione exec asincrona viene negata, OpenClaw impedisce all'agente di
riutilizzare l'output di qualsiasi esecuzione precedente dello stesso comando nella sessione.
Il motivo del rifiuto viene passato con indicazioni esplicite che nessun output del comando
è disponibile, impedendo all'agente di affermare che esista nuovo output o
di ripetere il comando negato con risultati obsoleti di una precedente esecuzione
riuscita.

## Implicazioni

- **`full`** è potente; preferisci le allowlist quando possibile.
- **`ask`** ti mantiene nel ciclo pur consentendo approvazioni rapide.
- Le allowlist per agente impediscono che le approvazioni di un agente si propaghino ad altri.
- Le approvazioni si applicano solo alle richieste exec dell'host provenienti da **mittenti autorizzati**. I mittenti non autorizzati non possono emettere `/exec`.
- `/exec security=full` è una comodità a livello di sessione per operatori autorizzati e salta le approvazioni per progettazione. Per bloccare rigidamente l'exec dell'host, imposta la sicurezza delle approvazioni su `deny` o nega lo strumento `exec` tramite la policy degli strumenti.

## Correlati

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/it/tools/exec-approvals-advanced" icon="gear">
    Bin sicuri, binding dell'interprete e inoltro delle approvazioni alla chat.
  </Card>
  <Card title="Exec tool" href="/it/tools/exec" icon="terminal">
    Strumento di esecuzione di comandi shell.
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
    Comportamento di consenso automatico basato su Skills.
  </Card>
</CardGroup>
