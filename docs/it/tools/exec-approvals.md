---
read_when:
    - Configurazione delle approvazioni exec o delle allowlist
    - Implementazione della UX di approvazione exec nell’app macOS
    - Esaminare i prompt di fuga dalla sandbox e le loro implicazioni
sidebarTitle: Exec approvals
summary: 'Approvazioni exec host: manopole di policy, allowlist e flusso YOLO/strict'
title: Approvazioni exec
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:39:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 868cee97882f7298a092bdcb9ec8fd058a5d7cb8745fad2edd712fabfb512e52
    source_path: tools/exec-approvals.md
    workflow: 15
---

Le approvazioni exec sono il **guardrail dell’app companion / node host** che consente
a un agente sandboxato di eseguire comandi su un host reale (`gateway` o `node`). Un
interblocco di sicurezza: i comandi sono consentiti solo quando policy + allowlist +
(eventuale) approvazione utente concordano tutte. Le approvazioni exec si sovrappongono **in aggiunta**
alla policy degli strumenti e al gating elevated (a meno che elevated non sia impostato su `full`, che
salta le approvazioni).

<Note>
La policy effettiva è la **più rigorosa** tra `tools.exec.*` e le
impostazioni predefinite delle approvazioni; se un campo di approvazione è omesso, viene
usato il valore di `tools.exec`. L’exec host usa anche lo stato locale delle approvazioni su quella macchina — un
`ask: "always"` locale dell’host in `~/.openclaw/exec-approvals.json` continua a
mostrare prompt anche se i valori predefiniti di sessione o config richiedono `ask: "on-miss"`.
</Note>

## Ispezionare la policy effettiva

| Comando                                                           | Cosa mostra                                                                          |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Policy richiesta, sorgenti della policy host e risultato effettivo.                  |
| `openclaw exec-policy show`                                       | Vista unita della macchina locale.                                                   |
| `openclaw exec-policy set` / `preset`                             | Sincronizza in un solo passaggio la policy richiesta locale con il file locale delle approvazioni host. |

Quando uno scope locale richiede `host=node`, `exec-policy show` riporta quello
scope come gestito dal node a runtime invece di fingere che il file locale delle
approvazioni sia la fonte di verità.

Se la UI dell’app companion **non è disponibile**, qualsiasi richiesta che
normalmente mostrerebbe un prompt viene risolta tramite l’**ask fallback** (predefinito: `deny`).

<Tip>
I client di approvazione nativi della chat possono inizializzare affordance specifiche del canale sul
messaggio di approvazione in sospeso. Ad esempio, Matrix inizializza scorciatoie di reazione
(`✅` consenti una volta, `❌` nega, `♾️` consenti sempre) lasciando comunque
i comandi `/approve ...` nel messaggio come fallback.
</Tip>

## Dove si applica

Le approvazioni exec vengono applicate localmente sull’host di esecuzione:

- **Host Gateway** → processo `openclaw` sulla macchina gateway.
- **Host Node** → runner node (app companion macOS o node host headless).

### Modello di trust

- I chiamanti autenticati sul Gateway sono operatori attendibili per quel Gateway.
- I Node associati estendono quella capability di operatore attendibile sull’host node.
- Le approvazioni exec riducono il rischio di esecuzione accidentale, ma **non** sono un confine auth per utente.
- Le esecuzioni approvate sull’host node vincolano il contesto canonico di esecuzione: cwd canonica, argv esatto, binding env quando presente e percorso eseguibile fissato quando applicabile.
- Per script shell e invocazioni dirette di file interprete/runtime, OpenClaw prova anche a vincolare un solo operando file locale concreto. Se quel file vincolato cambia dopo l’approvazione ma prima dell’esecuzione, l’esecuzione viene negata invece di eseguire contenuto variato.
- Il binding dei file è intenzionalmente best-effort, **non** un modello semantico completo di ogni percorso di caricamento interprete/runtime. Se la modalità di approvazione non riesce a identificare esattamente un solo file locale concreto da vincolare, si rifiuta di emettere un’esecuzione supportata da approvazione invece di fingere una copertura completa.

### Separazione macOS

- Il **servizio node host** inoltra `system.run` alla **app macOS** tramite IPC locale.
- La **app macOS** applica le approvazioni ed esegue il comando nel contesto UI.

## Impostazioni e archiviazione

Le approvazioni vivono in un file JSON locale sull’host di esecuzione:

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
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Manopole di policy

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  `deny` blocca tutte le richieste exec host. `allowlist` consente solo i comandi in allowlist. `full` consente tutto (equivalente a elevated).
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  `off` non mostra mai prompt. `on-miss` mostra prompt solo quando la allowlist non corrisponde. `always` mostra prompt per ogni comando; il trust durevole `allow-always` **non** sopprime i prompt quando la modalità ask effettiva è `always`.
</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Risoluzione quando è richiesto un prompt ma non è raggiungibile alcuna UI.

  `deny` blocca. `allowlist` consente solo se la allowlist corrisponde. `full` consente.
</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Quando `true`, OpenClaw tratta le forme di eval inline come
  soggette ad approvazione anche se il binario interprete stesso è in allowlist. Difesa in profondità
  per loader interprete che non si mappano in modo pulito a un singolo
  operando file stabile.
</ParamField>

Esempi che la modalità strict intercetta:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

In modalità strict questi comandi richiedono comunque approvazione esplicita, e
`allow-always` non persiste automaticamente nuove voci in allowlist per essi.

## Modalità YOLO (senza approvazione)

Se vuoi che l’exec host venga eseguito senza prompt di approvazione, devi aprire
**entrambi** i livelli di policy — la policy exec richiesta nella config OpenClaw
(`tools.exec.*`) **e** la policy locale delle approvazioni host in
`~/.openclaw/exec-approvals.json`.

YOLO è il comportamento host predefinito a meno che tu non lo irrigidisca esplicitamente:

| Livello               | Impostazione YOLO            |
| --------------------- | ---------------------------- |
| `tools.exec.security` | `full` su `gateway`/`node`   |
| `tools.exec.ask`      | `off`                        |
| Host `askFallback`    | `full`                       |

<Warning>
**Distinzioni importanti:**

`tools.exec.host=auto` sceglie **dove** viene eseguito exec: sandbox quando disponibile, altrimenti gateway. YOLO sceglie **come** viene approvato l’exec host: `security=full` più `ask=off`. In modalità YOLO, OpenClaw **non** aggiunge un gate separato di approvazione euristica per offuscamento dei comandi né un livello di rifiuto preflight degli script sopra la policy exec host configurata. `auto` non rende il routing gateway un override libero da una sessione sandboxata. Una richiesta per singola chiamata `host=node` è consentita da `auto`; `host=gateway` è consentito da `auto` solo quando non è attivo alcun runtime sandbox. Per un valore predefinito stabile non-auto, imposta `tools.exec.host` oppure usa `/exec host=...` esplicitamente.
</Warning>

I provider supportati da CLI che espongono una propria modalità di permessi non interattiva
possono seguire questa policy. Claude CLI aggiunge
`--permission-mode bypassPermissions` quando la policy exec richiesta da OpenClaw
è YOLO. Fai override di quel comportamento backend con argomenti Claude espliciti
sotto `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` —
ad esempio `--permission-mode default`, `acceptEdits` oppure
`bypassPermissions`.

Se vuoi un setup più conservativo, irrigidisci di nuovo uno dei due livelli a
`allowlist` / `on-miss` oppure `deny`.

### Setup persistente "mai chiedere" sull’host gateway

<Steps>
  <Step title="Imposta la policy richiesta nella config">
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

Questa scorciatoia locale aggiorna entrambi:

- `tools.exec.host/security/ask` locali.
- I valori predefiniti di `~/.openclaw/exec-approvals.json` locale.

È intenzionalmente solo locale. Per cambiare da remoto le approvazioni
dell’host gateway o dell’host node, usa `openclaw approvals set --gateway` o
`openclaw approvals set --node <id|name|ip>`.

### Host node

Per un host node, applica invece lo stesso file di approvazioni su quel node:

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

`openclaw exec-policy` non sincronizza le approvazioni del node. `openclaw exec-policy set --host node` viene rifiutato. Le approvazioni exec del node vengono recuperate dal node a runtime, quindi gli aggiornamenti mirati al node devono usare `openclaw approvals --node ...`.
</Note>

### Scorciatoia solo sessione

- `/exec security=full ask=off` cambia solo la sessione corrente.
- `/elevated full` è una scorciatoia break-glass che salta anche le approvazioni exec per quella sessione.

Se il file delle approvazioni host resta più rigoroso della config, continua comunque a prevalere
la policy host più rigorosa.

## Allowlist (per agente)

Le allowlist sono **per agente**. Se esistono più agenti, cambia quale agente
stai modificando nell’app macOS. I pattern sono corrispondenze glob.

I pattern possono essere glob del percorso del binario risolto oppure glob del solo nome comando.
I nomi semplici corrispondono solo ai comandi invocati tramite `PATH`, quindi `rg` può corrispondere a
`/opt/homebrew/bin/rg` quando il comando è `rg`, ma **non** a `./rg` o
`/tmp/rg`. Usa un glob di percorso quando vuoi fidarti di una specifica posizione
del binario.

Le vecchie voci `agents.default` vengono migrate a `agents.main` al caricamento.
Le catene shell come `echo ok && pwd` richiedono comunque che ogni segmento di primo livello
soddisfi le regole della allowlist.

Esempi:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Ogni voce di allowlist tiene traccia di:

| Campo              | Significato                        |
| ------------------ | ---------------------------------- |
| `id`               | UUID stabile usato per l’identità UI |
| `lastUsedAt`       | Timestamp dell’ultimo utilizzo     |
| `lastUsedCommand`  | Ultimo comando che ha corrisposto  |
| `lastResolvedPath` | Ultimo percorso binario risolto    |

## Auto-allow delle CLI di Skills

Quando **Auto-allow skill CLIs** è abilitato, gli eseguibili referenziati da
Skills note vengono trattati come presenti in allowlist sui Node (Node macOS o host
node headless). Questo usa `skills.bins` tramite Gateway RPC per recuperare l’elenco
dei bin delle Skills. Disabilitalo se vuoi allowlist manuali rigorose.

<Warning>
Questa è una **allowlist implicita di comodità**, separata dalle voci manuali di allowlist per percorso. È pensata per ambienti di operatori attendibili in cui Gateway e node stanno nello stesso confine di trust. Se richiedi trust rigorosamente esplicito, mantieni `autoAllowSkills: false` e usa solo voci manuali di allowlist per percorso.
</Warning>

## Bin sicuri e inoltro delle approvazioni

Per i bin sicuri (fast-path solo stdin), i dettagli del binding dell’interprete e
come inoltrare i prompt di approvazione a Slack/Discord/Telegram (oppure eseguirli come
client nativi di approvazione), consulta
[Exec approvals — advanced](/it/tools/exec-approvals-advanced).

## Modifica nella Control UI

Usa la scheda **Control UI → Nodes → Exec approvals** per modificare valori predefiniti,
override per agente e allowlist. Scegli uno scope (Defaults o un agente),
regola la policy, aggiungi/rimuovi pattern di allowlist, poi **Save**. La UI
mostra i metadati di ultimo utilizzo per pattern così puoi mantenere ordinato l’elenco.

Il selettore di destinazione sceglie **Gateway** (approvazioni locali) o un **Node**.
I Node devono dichiarare `system.execApprovals.get/set` (app macOS o
host Node headless). Se un Node non dichiara ancora le approvazioni exec,
modifica direttamente il file locale `~/.openclaw/exec-approvals.json`.

CLI: `openclaw approvals` supporta la modifica del gateway o del node — vedi
[CLI delle approvazioni](/it/cli/approvals).

## Flusso di approvazione

Quando è richiesto un prompt, il gateway trasmette
`exec.approval.requested` ai client operatore. La Control UI e l'app macOS
lo risolvono tramite `exec.approval.resolve`, quindi il gateway inoltra la
richiesta approvata all'host Node.

Per `host=node`, le richieste di approvazione includono un payload
`systemRunPlan` canonico. Il gateway usa quel piano come contesto
autoritativo per comando/cwd/sessione quando inoltra le richieste
`system.run` approvate.

Questo è importante per la latenza di approvazione asincrona:

- Il percorso exec del Node prepara in anticipo un unico piano canonico.
- Il record di approvazione memorizza quel piano e i suoi metadati di binding.
- Una volta approvata, la chiamata finale `system.run` inoltrata riutilizza il piano memorizzato invece di fidarsi di modifiche successive del chiamante.
- Se il chiamante modifica `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey` dopo la creazione della richiesta di approvazione, il gateway rifiuta l'esecuzione inoltrata per mancata corrispondenza dell'approvazione.

## Eventi di sistema

Il ciclo di vita di exec è esposto come messaggi di sistema:

- `Exec running` (solo se il comando supera la soglia dell'avviso di esecuzione).
- `Exec finished`.
- `Exec denied`.

Questi vengono pubblicati nella sessione dell'agente dopo che il Node segnala l'evento.
Le approvazioni exec ospitate dal Gateway emettono gli stessi eventi del ciclo di vita quando il
comando termina (e facoltativamente quando resta in esecuzione più a lungo della soglia).
Gli exec soggetti ad approvazione riutilizzano l'id dell'approvazione come `runId` in questi
messaggi per facilitare la correlazione.

## Comportamento in caso di approvazione negata

Quando un'approvazione exec asincrona viene negata, OpenClaw impedisce all'agente di
riutilizzare l'output di qualsiasi esecuzione precedente dello stesso comando nella sessione.
Il motivo del rifiuto viene passato con indicazioni esplicite che nessun output del comando
è disponibile, il che impedisce all'agente di affermare che esiste un nuovo output o
di ripetere il comando negato con risultati obsoleti di una precedente esecuzione riuscita.

## Implicazioni

- **`full`** è potente; quando possibile, preferisci le allowlist.
- **`ask`** ti mantiene nel flusso decisionale pur consentendo approvazioni rapide.
- Le allowlist per agente impediscono che le approvazioni di un agente si estendano ad altri.
- Le approvazioni si applicano solo alle richieste di exec host da **mittenti autorizzati**. I mittenti non autorizzati non possono eseguire `/exec`.
- `/exec security=full` è una comodità a livello di sessione per gli operatori autorizzati e, per progettazione, salta le approvazioni. Per bloccare rigidamente l'exec host, imposta la sicurezza delle approvazioni su `deny` oppure nega lo strumento `exec` tramite la policy degli strumenti.

## Correlati

<CardGroup cols={2}>
  <Card title="Approvazioni exec — avanzate" href="/it/tools/exec-approvals-advanced" icon="gear">
    Safe bin, binding dell'interprete e inoltro dell'approvazione alla chat.
  </Card>
  <Card title="Strumento exec" href="/it/tools/exec" icon="terminal">
    Strumento per l'esecuzione di comandi shell.
  </Card>
  <Card title="Modalità elevata" href="/it/tools/elevated" icon="shield-exclamation">
    Percorso break-glass che salta anch'esso le approvazioni.
  </Card>
  <Card title="Sandboxing" href="/it/gateway/sandboxing" icon="box">
    Modalità sandbox e accesso al workspace.
  </Card>
  <Card title="Sicurezza" href="/it/gateway/security" icon="lock">
    Modello di sicurezza e hardening.
  </Card>
  <Card title="Sandbox vs policy degli strumenti vs modalità elevata" href="/it/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Quando ricorrere a ciascun controllo.
  </Card>
  <Card title="Skills" href="/it/tools/skills" icon="sparkles">
    Comportamento di auto-allow supportato da Skills.
  </Card>
</CardGroup>
