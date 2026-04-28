---
read_when:
    - Uso o modifica dello strumento Exec
    - Debug del comportamento stdin o TTY
summary: Uso dello strumento Exec, modalità stdin e supporto TTY
title: Strumento Exec
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-25T13:58:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 358f9155120382fa2b03b22e22408bdb9e51715f80c8b1701a1ff7fd05850188
    source_path: tools/exec.md
    workflow: 15
---

Esegui comandi shell nel workspace. Supporta esecuzione in foreground + background tramite `process`.
Se `process` non è consentito, `exec` viene eseguito in modo sincrono e ignora `yieldMs`/`background`.
Le sessioni in background sono limitate per agente; `process` vede solo le sessioni dello stesso agente.

## Parametri

<ParamField path="command" type="string" required>
Comando shell da eseguire.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Directory di lavoro per il comando.
</ParamField>

<ParamField path="env" type="object">
Override dell'ambiente come coppie chiave/valore uniti all'ambiente ereditato.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Passa automaticamente il comando in background dopo questo ritardo (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Passa immediatamente il comando in background invece di attendere `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="1800">
Termina il comando dopo questo numero di secondi.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Esegui in uno pseudo-terminale quando disponibile. Usalo per CLI che richiedono TTY, agenti di coding e interfacce terminali.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Dove eseguire. `auto` si risolve in `sandbox` quando è attivo un runtime sandbox e altrimenti in `gateway`.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Modalità di enforcement per l'esecuzione `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Comportamento della richiesta di approvazione per l'esecuzione `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
Id/nome del Node quando `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Richiedi la modalità elevata — esce dalla sandbox verso il percorso host configurato. `security=full` è forzato solo quando elevated si risolve in `full`.
</ParamField>

Note:

- `host` usa per impostazione predefinita `auto`: sandbox quando è attivo un runtime sandbox per la sessione, altrimenti gateway.
- `auto` è la strategia di instradamento predefinita, non un carattere jolly. `host=node` per chiamata è consentito da `auto`; `host=gateway` per chiamata è consentito solo quando non è attivo alcun runtime sandbox.
- Senza configurazione aggiuntiva, `host=auto` continua a “funzionare semplicemente”: senza sandbox si risolve in `gateway`; con una sandbox attiva resta nella sandbox.
- `elevated` esce dalla sandbox verso il percorso host configurato: `gateway` per impostazione predefinita, oppure `node` quando `tools.exec.host=node` (o l'impostazione predefinita della sessione è `host=node`). È disponibile solo quando l'accesso elevato è abilitato per la sessione/provider corrente.
- Le approvazioni `gateway`/`node` sono controllate da `~/.openclaw/exec-approvals.json`.
- `node` richiede un Node associato (app companion o host Node headless).
- Se sono disponibili più Node, imposta `exec.node` o `tools.exec.node` per selezionarne uno.
- `exec host=node` è l'unico percorso di esecuzione shell per i Node; il wrapper legacy `nodes.run` è stato rimosso.
- Sugli host non Windows, exec usa `SHELL` quando impostato; se `SHELL` è `fish`, preferisce `bash` (o `sh`)
  da `PATH` per evitare script incompatibili con fish, poi ripiega su `SHELL` se nessuno dei due esiste.
- Sugli host Windows, exec preferisce individuare PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, poi PATH),
  quindi ripiega su Windows PowerShell 5.1.
- L'esecuzione host (`gateway`/`node`) rifiuta `env.PATH` e gli override del loader (`LD_*`/`DYLD_*`) per
  prevenire il dirottamento dei binari o l'iniezione di codice.
- OpenClaw imposta `OPENCLAW_SHELL=exec` nell'ambiente del comando avviato (inclusi PTY ed esecuzione sandbox) così le regole di shell/profile possono rilevare il contesto dello strumento exec.
- Importante: il sandboxing è **disattivato per impostazione predefinita**. Se il sandboxing è disattivato, l'implicito `host=auto`
  si risolve in `gateway`. L'esplicito `host=sandbox` fallisce comunque in modalità chiusa invece di eseguire silenziosamente
  sull'host gateway. Abilita il sandboxing o usa `host=gateway` con approvazioni.
- I controlli preliminari sugli script (per errori comuni di sintassi shell Python/Node) ispezionano solo i file all'interno
  del confine effettivo di `workdir`. Se un percorso script si risolve fuori da `workdir`, il preflight viene saltato per
  quel file.
- Per lavoro di lunga durata che inizia ora, avvialo una sola volta e affidati al
  risveglio automatico al completamento quando è abilitato e il comando emette output o fallisce.
  Usa `process` per log, stato, input o intervento; non emulare la
  pianificazione con loop di sleep, loop di timeout o polling ripetuto.
- Per lavoro che deve avvenire in seguito o secondo una pianificazione, usa Cron invece di
  pattern di sleep/delay con `exec`.

## Configurazione

- `tools.exec.notifyOnExit` (predefinito: true): quando true, le sessioni exec in background accodano un evento di sistema e richiedono un Heartbeat all'uscita.
- `tools.exec.approvalRunningNoticeMs` (predefinito: 10000): emette un singolo avviso “running” quando un exec soggetto ad approvazione dura più di questo tempo (0 lo disabilita).
- `tools.exec.host` (predefinito: `auto`; si risolve in `sandbox` quando è attivo un runtime sandbox, altrimenti in `gateway`)
- `tools.exec.security` (predefinito: `deny` per sandbox, `full` per gateway + node se non impostato)
- `tools.exec.ask` (predefinito: `off`)
- L'exec host senza approvazione è il comportamento predefinito per gateway + node. Se vuoi un comportamento con approvazioni/allowlist, restringi sia `tools.exec.*` sia `~/.openclaw/exec-approvals.json` sull'host; vedi [Exec approvals](/it/tools/exec-approvals#no-approval-yolo-mode).
- YOLO deriva dai valori predefiniti della policy host (`security=full`, `ask=off`), non da `host=auto`. Se vuoi forzare l'instradamento gateway o node, imposta `tools.exec.host` o usa `/exec host=...`.
- In modalità `security=full` più `ask=off`, l'exec host segue direttamente la policy configurata; non esiste un ulteriore livello euristico di prefiltro sull'offuscamento dei comandi o di rifiuto del preflight degli script.
- `tools.exec.node` (predefinito: non impostato)
- `tools.exec.strictInlineEval` (predefinito: false): quando true, le forme eval inline dell'interprete come `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` e `osascript -e` richiedono sempre un'approvazione esplicita. `allow-always` può comunque rendere persistenti invocazioni benignhe di interpreti/script, ma le forme inline-eval continuano a richiedere una richiesta ogni volta.
- `tools.exec.pathPrepend`: elenco di directory da anteporre a `PATH` per le esecuzioni exec (solo gateway + sandbox).
- `tools.exec.safeBins`: binari sicuri solo-stdin che possono essere eseguiti senza voci esplicite di allowlist. Per i dettagli del comportamento, vedi [Safe bins](/it/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: ulteriori directory esplicite considerate attendibili per i controlli del percorso eseguibile di `safeBins`. Le voci `PATH` non sono mai considerate attendibili automaticamente. I valori predefiniti integrati sono `/bin` e `/usr/bin`.
- `tools.exec.safeBinProfiles`: policy argv personalizzata facoltativa per safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

Esempio:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### Gestione di PATH

- `host=gateway`: unisce il tuo `PATH` della shell di login nell'ambiente exec. Gli override di `env.PATH` vengono
  rifiutati per l'esecuzione host. Il daemon stesso continua però a usare un `PATH` minimo:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: esegue `sh -lc` (shell di login) all'interno del container, quindi `/etc/profile` può reimpostare `PATH`.
  OpenClaw antepone `env.PATH` dopo il sourcing del profilo tramite una variabile env interna (senza interpolazione shell);
  anche `tools.exec.pathPrepend` si applica qui.
- `host=node`: solo gli override env non bloccati che passi vengono inviati al Node. Gli override di `env.PATH` vengono
  rifiutati per l'esecuzione host e ignorati dagli host Node. Se hai bisogno di voci PATH aggiuntive su un Node,
  configura l'ambiente del servizio host Node (systemd/launchd) o installa gli strumenti in posizioni standard.

Binding del Node per agente (usa l'indice della lista agenti nella configurazione):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: la scheda Nodes include un piccolo pannello “Exec node binding” per le stesse impostazioni.

## Override di sessione (`/exec`)

Usa `/exec` per impostare i valori predefiniti **per sessione** di `host`, `security`, `ask` e `node`.
Invia `/exec` senza argomenti per mostrare i valori correnti.

Esempio:

```text
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modello di autorizzazione

`/exec` viene onorato solo per i **mittenti autorizzati** (allowlist del canale/associazione più `commands.useAccessGroups`).
Aggiorna **solo lo stato della sessione** e non scrive la configurazione. Per disabilitare completamente exec, negalo tramite la
policy degli strumenti (`tools.deny: ["exec"]` o per agente). Le approvazioni host continuano comunque ad applicarsi a meno che tu non imposti esplicitamente
`security=full` e `ask=off`.

## Exec approvals (app companion / host node)

Gli agenti in sandbox possono richiedere un'approvazione per richiesta prima che `exec` venga eseguito sull'host gateway o node.
Vedi [Exec approvals](/it/tools/exec-approvals) per policy, allowlist e flusso UI.

Quando sono richieste approvazioni, lo strumento exec restituisce immediatamente
`status: "approval-pending"` e un id di approvazione. Una volta approvato (o negato / scaduto),
il Gateway emette eventi di sistema (`Exec finished` / `Exec denied`). Se il comando è ancora
in esecuzione dopo `tools.exec.approvalRunningNoticeMs`, viene emesso un singolo avviso `Exec running`.
Sui canali con schede/pulsanti di approvazione nativi, l'agente dovrebbe fare affidamento prima su
quell'interfaccia nativa e includere un comando manuale `/approve` solo quando il
risultato dello strumento indica esplicitamente che le approvazioni in chat non sono disponibili o che l'approvazione manuale è
l'unico percorso.

## Allowlist + safe bins

L'enforcement manuale della allowlist corrisponde a glob del percorso binario risolto e a glob del solo nome comando.
I nomi semplici corrispondono solo ai comandi invocati tramite PATH, quindi `rg` può corrispondere a
`/opt/homebrew/bin/rg` quando il comando è `rg`, ma non a `./rg` o `/tmp/rg`.
Quando `security=allowlist`, i comandi shell sono consentiti automaticamente solo se ogni segmento della pipeline
è in allowlist o è un safe bin. Il concatenamento (`;`, `&&`, `||`) e i reindirizzamenti
vengono rifiutati in modalità allowlist a meno che ogni segmento di primo livello non soddisfi la
allowlist (inclusi i safe bin). I reindirizzamenti restano non supportati.
La fiducia persistente `allow-always` non aggira questa regola: un comando concatenato continua a richiedere che ogni
segmento di primo livello corrisponda.

`autoAllowSkills` è un percorso di convenienza separato nelle exec approvals. Non è la stessa cosa delle
voci manuali di allowlist del percorso. Per una fiducia esplicita rigorosa, mantieni `autoAllowSkills` disabilitato.

Usa i due controlli per compiti diversi:

- `tools.exec.safeBins`: piccoli filtri di stream solo-stdin.
- `tools.exec.safeBinTrustedDirs`: directory esplicite aggiuntive attendibili per i percorsi eseguibili dei safe bin.
- `tools.exec.safeBinProfiles`: policy argv esplicita per safe bin personalizzati.
- allowlist: fiducia esplicita per i percorsi degli eseguibili.

Non trattare `safeBins` come una allowlist generica e non aggiungere binari interprete/runtime (ad esempio `python3`, `node`, `ruby`, `bash`). Se ti servono, usa voci esplicite di allowlist e mantieni abilitate le richieste di approvazione.
`openclaw security audit` avvisa quando mancano voci esplicite di `safeBinProfiles` per interpreti/runtime in `safeBins`, e `openclaw doctor --fix` può creare lo scheletro delle voci personalizzate `safeBinProfiles` mancanti.
`openclaw security audit` e `openclaw doctor` avvisano anche quando aggiungi esplicitamente di nuovo in `safeBins` bin con comportamento ampio come `jq`.
Se metti esplicitamente in allowlist degli interpreti, abilita `tools.exec.strictInlineEval` così le forme inline di valutazione del codice richiedono comunque una nuova approvazione.

Per dettagli completi sulla policy ed esempi, vedi [Exec approvals](/it/tools/exec-approvals-advanced#safe-bins-stdin-only) e [Safe bins versus allowlist](/it/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Esempi

Foreground:

```json
{ "tool": "exec", "command": "ls -la" }
```

Background + polling:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Il polling serve per uno stato on-demand, non per loop di attesa. Se il risveglio automatico al completamento
è abilitato, il comando può risvegliare la sessione quando emette output o fallisce.

Invia tasti (stile tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Invio (manda solo CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Incolla (tra parentesi quadre per impostazione predefinita):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` è un sottostrumento di `exec` per modifiche strutturate a più file.
È abilitato per impostazione predefinita per i modelli OpenAI e OpenAI Codex. Usa la configurazione solo
quando vuoi disabilitarlo o limitarlo a modelli specifici:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

Note:

- Disponibile solo per i modelli OpenAI/OpenAI Codex.
- La policy dello strumento continua ad applicarsi; `allow: ["write"]` consente implicitamente `apply_patch`.
- La configurazione si trova sotto `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` è impostato su `true` per impostazione predefinita; impostalo su `false` per disabilitare lo strumento per i modelli OpenAI.
- `tools.exec.applyPatch.workspaceOnly` è impostato su `true` per impostazione predefinita (limitato al workspace). Impostalo su `false` solo se vuoi intenzionalmente che `apply_patch` scriva/elimini fuori dalla directory del workspace.

## Correlati

- [Exec Approvals](/it/tools/exec-approvals) — gate di approvazione per i comandi shell
- [Sandboxing](/it/gateway/sandboxing) — esecuzione di comandi in ambienti sandbox
- [Background Process](/it/gateway/background-process) — exec di lunga durata e strumento process
- [Security](/it/gateway/security) — policy degli strumenti e accesso elevato
