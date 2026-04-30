---
read_when:
    - Configurare le approvazioni exec o gli elenchi consentiti
    - Implementazione della UX di approvazione di exec nell'app macOS
    - Revisione dei prompt di evasione dalla sandbox e delle loro implicazioni
sidebarTitle: Exec approvals
summary: 'Approvazioni di Host exec: opzioni dei criteri, allowlist e flusso di lavoro YOLO/strict'
title: Approvazioni di esecuzione
x-i18n:
    generated_at: "2026-04-30T09:16:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71c16d0e547c4dd42a351d37e37e97b681a062cd496d5e0cba923b54c8f5b0e9
    source_path: tools/exec-approvals.md
    workflow: 16
---

Le approvazioni exec sono la **misura di sicurezza dell'app companion / host node** che consente
a un agente in sandbox di eseguire comandi su un host reale (`gateway` o `node`). Un
interblocco di sicurezza: i comandi sono consentiti solo quando policy + allowlist +
approvazione utente (opzionale) concordano tutte. Le approvazioni exec si sovrappongono **in aggiunta**
alla policy degli strumenti e al gating elevato (a meno che elevato non sia impostato su `full`, che
salta le approvazioni).

<Note>
La policy effettiva è la **più restrittiva** tra `tools.exec.*` e i valori predefiniti
delle approvazioni; se un campo delle approvazioni viene omesso, viene usato il valore di
`tools.exec`. Anche l'exec host usa lo stato locale delle approvazioni su quella macchina: un
`ask: "always"` host-local in `~/.openclaw/exec-approvals.json` continua a
richiedere conferma anche se i valori predefiniti di sessione o configurazione richiedono `ask: "on-miss"`.
</Note>

## Ispezione della policy effettiva

| Comando                                                          | Cosa mostra                                                                            |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Policy richiesta, origini della policy host e risultato effettivo.                     |
| `openclaw exec-policy show`                                      | Vista combinata della macchina locale.                                                  |
| `openclaw exec-policy set` / `preset`                            | Sincronizza in un solo passaggio la policy locale richiesta con il file locale delle approvazioni host. |

Quando un ambito locale richiede `host=node`, `exec-policy show` segnala quell'
ambito come gestito dal node a runtime invece di fingere che il file locale
delle approvazioni sia la fonte di verità.

Se la UI dell'app companion **non è disponibile**, qualsiasi richiesta che
normalmente richiederebbe conferma viene risolta tramite il **fallback ask** (predefinito: `deny`).

<Tip>
I client nativi di approvazione chat possono predisporre azioni specifiche del canale nel
messaggio di approvazione in sospeso. Per esempio, Matrix predispone scorciatoie con reazioni
(`✅` allow once, `❌` deny, `♾️` allow always), lasciando comunque
i comandi `/approve ...` nel messaggio come fallback.
</Tip>

## Dove si applica

Le approvazioni exec vengono applicate localmente sull'host di esecuzione:

- **Host Gateway** → processo `openclaw` sulla macchina Gateway.
- **Host Node** → runner node (app companion macOS o host node headless).

### Modello di fiducia

- I chiamanti autenticati dal Gateway sono operatori fidati per quel Gateway.
- I node associati estendono quella capacità di operatore fidato sull'host Node.
- Le approvazioni exec riducono il rischio di esecuzioni accidentali, ma **non** sono un confine di autenticazione per utente.
- Le esecuzioni approvate sull'host Node vincolano il contesto di esecuzione canonico: cwd canonica, argv esatti, binding dell'env quando presente e percorso eseguibile bloccato quando applicabile.
- Per script shell e invocazioni dirette di file tramite interprete/runtime, OpenClaw prova anche a vincolare un singolo operando di file locale concreto. Se quel file vincolato cambia dopo l'approvazione ma prima dell'esecuzione, l'esecuzione viene negata invece di eseguire contenuto modificato.
- Il binding dei file è intenzionalmente best-effort, **non** un modello semantico completo di ogni percorso di caricamento di interpreti/runtime. Se la modalità di approvazione non riesce a identificare esattamente un file locale concreto da vincolare, rifiuta di creare un'esecuzione basata su approvazione invece di fingere una copertura completa.

### Separazione macOS

- Il **servizio host Node** inoltra `system.run` all'**app macOS** tramite IPC locale.
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
  - `deny` — blocca tutte le richieste di exec host.
  - `allowlist` — consente solo i comandi in allowlist.
  - `full` — consente tutto (equivalente a elevato).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` — non chiedere mai conferma.
  - `on-miss` — chiedi conferma solo quando l'allowlist non corrisponde.
  - `always` — chiedi conferma per ogni comando. La fiducia duratura `allow-always` **non** sopprime le richieste quando la modalità ask effettiva è `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Risoluzione quando è richiesta una conferma ma nessuna UI è raggiungibile.

- `deny` — blocca.
- `allowlist` — consente solo se l'allowlist corrisponde.
- `full` — consente.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Quando è `true`, OpenClaw tratta i formati di valutazione del codice inline come solo su approvazione
  anche se il binario dell'interprete stesso è in allowlist. Difesa in profondità
  per loader di interpreti che non si mappano in modo netto a un singolo operando
  di file stabile.
</ParamField>

Esempi intercettati dalla modalità rigorosa:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

In modalità rigorosa questi comandi richiedono comunque un'approvazione esplicita, e
`allow-always` non persiste automaticamente nuove voci di allowlist per essi.

## Modalità YOLO (senza approvazione)

Se vuoi che l'exec host venga eseguito senza richieste di approvazione, devi aprire
**entrambi** i livelli di policy: la policy exec richiesta nella configurazione di OpenClaw
(`tools.exec.*`) **e** la policy delle approvazioni host-local in
`~/.openclaw/exec-approvals.json`.

YOLO è il comportamento host predefinito, a meno che tu non lo renda esplicitamente più restrittivo:

| Livello               | Impostazione YOLO         |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` su `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**Distinzioni importanti:**

- `tools.exec.host=auto` sceglie **dove** viene eseguito exec: sandbox quando disponibile, altrimenti Gateway.
- YOLO sceglie **come** viene approvato l'exec host: `security=full` più `ask=off`.
- In modalità YOLO, OpenClaw **non** aggiunge un gate euristico separato di approvazione per l'offuscamento dei comandi né un livello di rifiuto preflight degli script sopra la policy exec host configurata.
- `auto` non rende il routing Gateway un override libero da una sessione in sandbox. Una richiesta per chiamata `host=node` è consentita da `auto`; `host=gateway` è consentita da `auto` solo quando non è attivo alcun runtime sandbox. Per un valore predefinito stabile non automatico, imposta `tools.exec.host` oppure usa `/exec host=...` esplicitamente.

</Warning>

I provider basati su CLI che espongono una propria modalità di permesso non interattiva
possono seguire questa policy. Claude CLI aggiunge
`--permission-mode bypassPermissions` quando la policy exec richiesta da OpenClaw
è YOLO. Sovrascrivi quel comportamento del backend con argomenti Claude espliciti
in `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs`,
per esempio `--permission-mode default`, `acceptEdits` o
`bypassPermissions`.

Se vuoi una configurazione più conservativa, rendi nuovamente più restrittivo uno dei due livelli con
`allowlist` / `on-miss` oppure `deny`.

### Configurazione persistente "non chiedere mai" sull'host Gateway

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
usa `openclaw approvals set --gateway` oppure
`openclaw approvals set --node <id|name|ip>`.

### Host Node

Per un host Node, applica invece lo stesso file delle approvazioni su quel node:

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

- `openclaw exec-policy` non sincronizza le approvazioni node.
- `openclaw exec-policy set --host node` viene rifiutato.
- Le approvazioni exec node vengono recuperate dal node a runtime, quindi gli aggiornamenti destinati al node devono usare `openclaw approvals --node ...`.

</Note>

### Scorciatoia solo sessione

- `/exec security=full ask=off` cambia solo la sessione corrente.
- `/elevated full` è una scorciatoia di emergenza che salta anche le approvazioni exec per quella sessione.

Se il file delle approvazioni host resta più restrittivo della configurazione, la policy host
più restrittiva prevale comunque.

## Allowlist (per agente)

Le allowlist sono **per agente**. Se esistono più agenti, cambia l'agente
che stai modificando nell'app macOS. I pattern sono corrispondenze glob.

I pattern possono essere glob di percorsi binari risolti oppure glob di semplici nomi di comando.
I nomi semplici corrispondono solo ai comandi invocati tramite `PATH`, quindi `rg` può corrispondere
a `/opt/homebrew/bin/rg` quando il comando è `rg`, ma **non** a `./rg` o
`/tmp/rg`. Usa un glob di percorso quando vuoi fidarti di una posizione binaria
specifica.

Le voci legacy `agents.default` vengono migrate a `agents.main` al caricamento.
Le catene shell come `echo ok && pwd` richiedono comunque che ogni segmento di primo livello
soddisfi le regole dell'allowlist.

Esempi:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Ogni voce dell'allowlist tiene traccia di:

| Campo              | Significato                      |
| ------------------ | -------------------------------- |
| `id`               | UUID stabile usato per l'identità UI |
| `lastUsedAt`       | Timestamp dell'ultimo utilizzo   |
| `lastUsedCommand`  | Ultimo comando che ha avuto corrispondenza |
| `lastResolvedPath` | Ultimo percorso binario risolto  |

## Consenti automaticamente le CLI Skills

Quando **Consenti automaticamente le CLI Skills** è abilitato, gli eseguibili referenziati da
Skills note vengono trattati come in allowlist sui node (node macOS o host
node headless). Questo usa `skills.bins` tramite RPC Gateway per recuperare
l'elenco dei bin delle Skills. Disabilitalo se vuoi allowlist manuali rigorose.

<Warning>
- Questa è una **allowlist implicita di comodità**, separata dalle voci manuali dell'allowlist di percorso.
- È pensata per ambienti con operatori fidati in cui Gateway e node si trovano nello stesso confine di fiducia.
- Se richiedi fiducia esplicita rigorosa, mantieni `autoAllowSkills: false` e usa solo voci manuali dell'allowlist di percorso.

</Warning>

## Bin sicuri e inoltro delle approvazioni

Per i bin sicuri (il fast-path solo stdin), i dettagli di binding degli interpreti e
come inoltrare le richieste di approvazione a Slack/Discord/Telegram (o eseguirle come
client nativi di approvazione), consulta
[Approvazioni exec — avanzate](/it/tools/exec-approvals-advanced).

## Modifica dalla Control UI

Usa la scheda **Control UI → Nodes → Approvazioni exec** per modificare i valori predefiniti,
gli override per agente e le allowlist. Scegli un ambito (Valori predefiniti o un agente),
regola la policy, aggiungi/rimuovi pattern di allowlist, quindi **Salva**. La UI
mostra i metadati di ultimo utilizzo per pattern, così puoi mantenere ordinato l'elenco.

Il selettore della destinazione sceglie **Gateway** (approvazioni locali) o un **Node**.
I Node devono pubblicizzare `system.execApprovals.get/set` (app macOS o
host Node headless). Se un Node non pubblicizza ancora le approvazioni exec,
modifica direttamente il suo `~/.openclaw/exec-approvals.json` locale.

CLI: `openclaw approvals` supporta la modifica del gateway o del Node — vedi
[CLI delle approvazioni](/it/cli/approvals).

## Flusso di approvazione

Quando è richiesta una conferma, il Gateway trasmette
`exec.approval.requested` ai client operatore. L'UI di controllo e l'app macOS
la risolvono tramite `exec.approval.resolve`, poi il Gateway inoltra la
richiesta approvata all'host Node.

Per `host=node`, le richieste di approvazione includono un payload canonico
`systemRunPlan`. Il Gateway usa quel piano come contesto autorevole di
comando/cwd/sessione quando inoltra le richieste `system.run` approvate.

Questo è importante per la latenza dell'approvazione asincrona:

- Il percorso exec del Node prepara in anticipo un unico piano canonico.
- Il record di approvazione memorizza quel piano e i relativi metadati di associazione.
- Una volta approvata, la chiamata `system.run` finale inoltrata riutilizza il piano memorizzato invece di fidarsi di successive modifiche del chiamante.
- Se il chiamante modifica `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey` dopo la creazione della richiesta di approvazione, il Gateway rifiuta l'esecuzione inoltrata come mancata corrispondenza dell'approvazione.

## Eventi di sistema

Il ciclo di vita exec viene esposto come messaggi di sistema:

- `Exec running` (solo se il comando supera la soglia di avviso di esecuzione).
- `Exec finished`.
- `Exec denied`.

Questi vengono pubblicati nella sessione dell'agente dopo che il Node segnala l'evento.
Le approvazioni exec ospitate dal Gateway emettono gli stessi eventi del ciclo di vita quando il
comando termina (e facoltativamente quando l'esecuzione supera la soglia).
Gli exec vincolati all'approvazione riutilizzano l'id di approvazione come `runId` in questi
messaggi per facilitare la correlazione.

## Comportamento delle approvazioni negate

Quando un'approvazione exec asincrona viene negata, OpenClaw impedisce all'agente di
riutilizzare l'output di qualsiasi esecuzione precedente dello stesso comando nella sessione.
Il motivo del rifiuto viene passato con indicazioni esplicite che nessun output del comando
è disponibile, impedendo all'agente di affermare che ci sia nuovo output o
di ripetere il comando negato con risultati obsoleti di una precedente esecuzione
riuscita.

## Implicazioni

- **`full`** è potente; preferisci gli allowlist quando possibile.
- **`ask`** ti mantiene nel ciclo pur consentendo approvazioni rapide.
- Gli allowlist per agente impediscono che le approvazioni di un agente filtrino verso altri.
- Le approvazioni si applicano solo alle richieste exec dell'host provenienti da **mittenti autorizzati**. I mittenti non autorizzati non possono emettere `/exec`.
- `/exec security=full` è una comodità a livello di sessione per gli operatori autorizzati e salta le approvazioni per progettazione. Per bloccare in modo rigido l'exec dell'host, imposta la sicurezza delle approvazioni su `deny` oppure nega lo strumento `exec` tramite la policy degli strumenti.

## Correlati

<CardGroup cols={2}>
  <Card title="Approvazioni exec — avanzate" href="/it/tools/exec-approvals-advanced" icon="gear">
    Bin sicuri, associazione dell'interprete e inoltro delle approvazioni alla chat.
  </Card>
  <Card title="Strumento exec" href="/it/tools/exec" icon="terminal">
    Strumento di esecuzione dei comandi shell.
  </Card>
  <Card title="Modalità elevata" href="/it/tools/elevated" icon="shield-exclamation">
    Percorso di emergenza che salta anche le approvazioni.
  </Card>
  <Card title="Sandboxing" href="/it/gateway/sandboxing" icon="box">
    Modalità sandbox e accesso allo spazio di lavoro.
  </Card>
  <Card title="Sicurezza" href="/it/gateway/security" icon="lock">
    Modello di sicurezza e rafforzamento.
  </Card>
  <Card title="Sandbox vs policy degli strumenti vs modalità elevata" href="/it/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Quando usare ciascun controllo.
  </Card>
  <Card title="Skills" href="/it/tools/skills" icon="sparkles">
    Comportamento di auto-consenso supportato da Skill.
  </Card>
</CardGroup>
