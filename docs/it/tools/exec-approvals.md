---
read_when:
    - |-
      Configurare approvazioni exec o allowlistավորապես to=final code```
      Configurare approvazioni exec o allowlist
      ```
    - Implementare la UX di approvazione exec nell’app macOS
    - |-
      Esaminare i prompt di escape dalla sandbox e le loro implicazioni +#+#+#+#+#+ to=final code```
      Esaminare i prompt di escape dalla sandbox e le loro implicazioni
      ```
summary: Approvazioni exec, allowlist e prompt di escape dalla sandbox
title: Approvazioni Exec
x-i18n:
    generated_at: "2026-04-24T09:05:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d7c5cd24e7c1831d5a865da6fa20f4c23280a0ec12b9e8f7f3245170a05a37d
    source_path: tools/exec-approvals.md
    workflow: 15
---

Le approvazioni exec sono il **guardrail della companion app / dell’host node** per permettere a un
agente in sandbox di eseguire comandi su un host reale (`gateway` oppure `node`). Un interblocco di sicurezza:
i comandi sono consentiti solo quando policy + allowlist + (eventuale) approvazione utente
sono tutti d’accordo. Le approvazioni exec si sovrappongono **sopra** la policy degli strumenti e il gating elevated
(a meno che elevated non sia impostato su `full`, che salta le approvazioni).

<Note>
La policy effettiva è la **più restrittiva** tra `tools.exec.*` e i valori predefiniti delle approvazioni;
se un campo di approvazione è omesso, viene usato il valore di `tools.exec`. Anche l’host exec
usa lo stato di approvazione locale su quella macchina — un `ask: "always"` locale nell’host
in `~/.openclaw/exec-approvals.json` continua a chiedere conferma anche se i valori predefiniti di sessione o configurazione richiedono `ask: "on-miss"`.
</Note>

## Ispezionare la policy effettiva

- `openclaw approvals get`, `... --gateway`, `... --node <id|name|ip>` — mostrano la policy richiesta, le sorgenti della policy host e il risultato effettivo.
- `openclaw exec-policy show` — vista unita della macchina locale.
- `openclaw exec-policy set|preset` — sincronizza in un passaggio la policy locale richiesta con il file locale di approvazioni host.

Quando uno scope locale richiede `host=node`, `exec-policy show` segnala quello scope
come gestito dal node a runtime invece di fingere che il file locale delle approvazioni sia la fonte di verità.

Se l’interfaccia della companion app **non è disponibile**, qualunque richiesta che normalmente
richiederebbe un prompt viene risolta dal **fallback ask** (predefinito: deny).

<Tip>
I client di approvazione nativi della chat possono inizializzare affordance specifiche del canale sul
messaggio di approvazione in sospeso. Per esempio, Matrix inizializza scorciatoie di reazione (`✅`
consenti una volta, `❌` nega, `♾️` consenti sempre) lasciando comunque i comandi
`/approve ...` nel messaggio come fallback.
</Tip>

## Dove si applica

Le approvazioni exec vengono applicate localmente sull’host di esecuzione:

- **gateway host** → processo `openclaw` sulla macchina gateway
- **node host** → node runner (companion app macOS o host node headless)

Nota sul modello di fiducia:

- I chiamanti autenticati al Gateway sono operatori trusted per quel Gateway.
- I node associati estendono quella capacità di operatore trusted sull’host node.
- Le approvazioni exec riducono il rischio di esecuzione accidentale, ma non sono un confine di autenticazione per utente.
- Le esecuzioni approvate su host node associano un contesto di esecuzione canonico: cwd canonica, argv esatto, binding env
  quando presente e percorso eseguibile fissato quando applicabile.
- Per script shell e invocazioni dirette di file tramite interprete/runtime, OpenClaw prova anche a vincolare
  un singolo operando file locale concreto. Se quel file associato cambia dopo l’approvazione ma prima dell’esecuzione,
  l’esecuzione viene negata invece di eseguire contenuto alterato.
- Questo binding dei file è intenzionalmente best-effort, non un modello semantico completo di ogni
  percorso di caricamento di interprete/runtime. Se la modalità di approvazione non riesce a identificare esattamente un singolo file locale concreto da vincolare, rifiuta di emettere un’esecuzione supportata da approvazione invece di fingere copertura completa.

Separazione macOS:

- **servizio host node** inoltra `system.run` alla **app macOS** tramite IPC locale.
- **app macOS** applica le approvazioni + esegue il comando nel contesto UI.

## Impostazioni e archiviazione

Le approvazioni vivono in un file JSON locale sull’host di esecuzione:

`~/.openclaw/exec-approvals.json`

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

## Modalità "YOLO" senza approvazione

Se vuoi che l’host exec venga eseguito senza prompt di approvazione, devi aprire **entrambi** i livelli di policy:

- policy exec richiesta nella configurazione OpenClaw (`tools.exec.*`)
- policy approvazioni host-local in `~/.openclaw/exec-approvals.json`

Questo è ora il comportamento host predefinito, salvo che tu non lo restringa esplicitamente:

- `tools.exec.security`: `full` su `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Distinzione importante:

- `tools.exec.host=auto` sceglie dove viene eseguito exec: sandbox quando disponibile, altrimenti gateway.
- YOLO sceglie come viene approvato host exec: `security=full` più `ask=off`.
- I provider supportati da CLI che espongono la propria modalità di permessi non interattiva possono seguire questa policy.
  Claude CLI aggiunge `--permission-mode bypassPermissions` quando la policy exec richiesta da OpenClaw è
  YOLO. Sostituisci quel comportamento backend con argomenti Claude espliciti in
  `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs`, per esempio
  `--permission-mode default`, `acceptEdits` oppure `bypassPermissions`.
- In modalità YOLO, OpenClaw non aggiunge un gate separato di approvazione euristica sull’offuscamento dei comandi né un layer di rifiuto preflight degli script sopra la policy host exec configurata.
- `auto` non rende l’instradamento gateway un override libero da una sessione in sandbox. Una richiesta per chiamata `host=node` è consentita da `auto`, e `host=gateway` è consentito da `auto` solo quando non è attivo alcun runtime sandbox. Se vuoi un valore predefinito stabile non-auto, imposta `tools.exec.host` oppure usa `/exec host=...` esplicitamente.

Se vuoi una configurazione più conservativa, restringi uno dei due livelli a `allowlist` / `on-miss`
oppure `deny`.

Configurazione persistente gateway-host "never prompt":

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Poi imposta il file delle approvazioni host in modo coerente:

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

Scorciatoia locale per la stessa policy gateway-host sulla macchina corrente:

```bash
openclaw exec-policy preset yolo
```

Questa scorciatoia locale aggiorna entrambe le cose:

- `tools.exec.host/security/ask` locali
- valori predefiniti locali in `~/.openclaw/exec-approvals.json`

È intenzionalmente solo locale. Se hai bisogno di modificare da remoto le approvazioni gateway-host o node-host,
continua a usare `openclaw approvals set --gateway` oppure
`openclaw approvals set --node <id|name|ip>`.

Per un node host, applica invece su quel node lo stesso file di approvazioni:

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

Importante limitazione solo locale:

- `openclaw exec-policy` non sincronizza le approvazioni del node
- `openclaw exec-policy set --host node` viene rifiutato
- le approvazioni exec del node vengono recuperate dal node a runtime, quindi gli aggiornamenti destinati al node devono usare `openclaw approvals --node ...`

Scorciatoia solo sessione:

- `/exec security=full ask=off` cambia solo la sessione corrente.
- `/elevated full` è una scorciatoia di emergenza che salta anche le approvazioni exec per quella sessione.

Se il file delle approvazioni host resta più restrittivo della configurazione, continua comunque a vincere la policy host più restrittiva.

## Manopole della policy

### Sicurezza (`exec.security`)

- **deny**: blocca tutte le richieste di host exec.
- **allowlist**: consente solo i comandi in allowlist.
- **full**: consente tutto (equivalente a elevated).

### Ask (`exec.ask`)

- **off**: non chiedere mai.
- **on-miss**: chiedi solo quando l’allowlist non corrisponde.
- **always**: chiedi per ogni comando.
- La fiducia duratura `allow-always` non sopprime i prompt quando la modalità ask effettiva è `always`

### Ask fallback (`askFallback`)

Se è richiesto un prompt ma nessuna UI è raggiungibile, il fallback decide:

- **deny**: blocca.
- **allowlist**: consente solo se c’è corrispondenza con l’allowlist.
- **full**: consente.

### Hardening dell’eval inline dell’interprete (`tools.exec.strictInlineEval`)

Quando `tools.exec.strictInlineEval=true`, OpenClaw tratta le forme di code-eval inline come soggette a sola approvazione anche se il binario dell’interprete stesso è in allowlist.

Esempi:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Questa è difesa in profondità per loader di interpreti che non si mappano bene a un singolo operando file stabile. In modalità strict:

- questi comandi richiedono comunque approvazione esplicita;
- `allow-always` non persiste automaticamente nuove voci allowlist per loro.

## Allowlist (per agente)

Le allowlist sono **per agente**. Se esistono più agenti, cambia quale agente stai
modificando nell’app macOS. I pattern sono **glob match case-insensitive**.
I pattern dovrebbero risolversi in **percorsi binari** (le voci con solo basename vengono ignorate).
Le voci legacy `agents.default` vengono migrate a `agents.main` al caricamento.
Catene shell come `echo ok && pwd` richiedono comunque che ogni segmento top-level soddisfi le regole dell’allowlist.

Esempi:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Ogni voce dell’allowlist tiene traccia di:

- **id** UUID stabile usato per l’identità UI (opzionale)
- timestamp di **ultimo utilizzo**
- **ultimo comando utilizzato**
- **ultimo percorso risolto**

## Auto-allow delle CLI delle Skills

Quando **Auto-allow skill CLIs** è abilitato, gli eseguibili referenziati da Skills note
vengono trattati come in allowlist sui node (node macOS o host node headless). Questo usa
`skills.bins` tramite Gateway RPC per recuperare l’elenco bin della Skill. Disabilitalo se vuoi allowlist manuali rigorose.

Note importanti sul modello di fiducia:

- Questa è una **allowlist implicita di comodità**, separata dalle voci manuali di allowlist dei percorsi.
- È pensata per ambienti di operatori trusted in cui Gateway e node sono nello stesso confine di fiducia.
- Se ti serve una fiducia esplicita rigorosa, mantieni `autoAllowSkills: false` e usa solo voci manuali di allowlist dei percorsi.

## Safe bins e inoltro delle approvazioni

Per safe bins (il percorso veloce solo-stdin), dettagli sul binding degli interpreti e come
inoltrare i prompt di approvazione a Slack/Discord/Telegram (oppure eseguirli come client
di approvazione nativi), vedi [Approvazioni Exec — avanzato](/it/tools/exec-approvals-advanced).

<!-- spostato in /tools/exec-approvals-advanced -->

## Modifica nella Control UI

Usa la scheda **Control UI → Nodes → Exec approvals** per modificare valori predefiniti, override
per-agente e allowlist. Scegli uno scope (Defaults o un agente), regola la policy,
aggiungi/rimuovi pattern di allowlist, poi **Save**. L’interfaccia mostra i metadati di **ultimo utilizzo** per
pattern così puoi mantenere pulito l’elenco.

Il selettore di destinazione sceglie **Gateway** (approvazioni locali) oppure un **Node**. I node
devono pubblicizzare `system.execApprovals.get/set` (app macOS o host node headless).
Se un node non pubblicizza ancora le exec approvals, modifica direttamente il suo
`~/.openclaw/exec-approvals.json` locale.

CLI: `openclaw approvals` supporta la modifica di gateway o node (vedi [CLI Approvazioni](/it/cli/approvals)).

## Flusso di approvazione

Quando è richiesto un prompt, il gateway trasmette `exec.approval.requested` ai client operatore.
La Control UI e l’app macOS lo risolvono tramite `exec.approval.resolve`, poi il gateway inoltra la
richiesta approvata all’host node.

Per `host=node`, le richieste di approvazione includono un payload canonico `systemRunPlan`. Il gateway usa
quel piano come contesto autorevole di comando/cwd/sessione quando inoltra richieste
`system.run` approvate.

Questo è importante per la latenza di approvazione asincrona:

- il percorso exec del node prepara in anticipo un piano canonico
- il record di approvazione memorizza quel piano e i suoi metadati di binding
- una volta approvata, la chiamata finale `system.run` inoltrata riutilizza il piano memorizzato
  invece di fidarsi di modifiche successive del chiamante
- se il chiamante cambia `command`, `rawCommand`, `cwd`, `agentId` oppure
  `sessionKey` dopo che la richiesta di approvazione è stata creata, il gateway rifiuta
  l’esecuzione inoltrata come mismatch di approvazione

## Eventi di sistema

Il ciclo di vita exec viene esposto come messaggi di sistema:

- `Exec running` (solo se il comando supera la soglia di notifica running)
- `Exec finished`
- `Exec denied`

Questi vengono pubblicati nella sessione dell’agente dopo che il node segnala l’evento.
Le approvazioni exec dell’host gateway emettono gli stessi eventi di ciclo di vita quando il comando termina (e facoltativamente quando resta in esecuzione oltre la soglia).
Gli exec soggetti ad approvazione riutilizzano l’ID di approvazione come `runId` in questi messaggi per una correlazione semplice.

## Comportamento dell’approvazione negata

Quando un’approvazione exec asincrona viene negata, OpenClaw impedisce all’agente di riutilizzare
output di qualsiasi esecuzione precedente dello stesso comando nella sessione. Il motivo del rifiuto
viene passato con indicazioni esplicite che nessun output del comando è disponibile, il che impedisce
all’agente di affermare che esista un nuovo output o di ripetere il comando negato usando
risultati obsoleti di una precedente esecuzione riuscita.

## Implicazioni

- **full** è potente; quando possibile preferisci le allowlist.
- **ask** ti mantiene nel loop pur consentendo approvazioni rapide.
- Le allowlist per agente impediscono che le approvazioni di un agente si propaghino agli altri.
- Le approvazioni si applicano solo a richieste di host exec da **mittenti autorizzati**. I mittenti non autorizzati non possono emettere `/exec`.
- `/exec security=full` è una comodità a livello di sessione per operatori autorizzati e per progettazione salta le approvazioni. Per bloccare rigidamente l’host exec, imposta la sicurezza delle approvazioni su `deny` oppure nega lo strumento `exec` tramite la policy degli strumenti.

## Correlati

<CardGroup cols={2}>
  <Card title="Approvazioni Exec — avanzato" href="/it/tools/exec-approvals-advanced" icon="gear">
    Safe bins, binding degli interpreti e inoltro delle approvazioni alla chat.
  </Card>
  <Card title="Strumento Exec" href="/it/tools/exec" icon="terminal">
    Strumento di esecuzione di comandi shell.
  </Card>
  <Card title="Modalità elevata" href="/it/tools/elevated" icon="shield-exclamation">
    Percorso di emergenza che salta anche le approvazioni.
  </Card>
  <Card title="Sandboxing" href="/it/gateway/sandboxing" icon="box">
    Modalità sandbox e accesso al workspace.
  </Card>
  <Card title="Security" href="/it/gateway/security" icon="lock">
    Modello di sicurezza e hardening.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/it/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Quando ricorrere a ciascun controllo.
  </Card>
  <Card title="Skills" href="/it/tools/skills" icon="sparkles">
    Comportamento auto-allow supportato dalle Skills.
  </Card>
</CardGroup>
