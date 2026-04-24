---
read_when:
    - Uso o modifica dello strumento exec
    - Debug del comportamento stdin o TTY
summary: Uso dello strumento exec, modalità stdin e supporto TTY
title: Strumento exec
x-i18n:
    generated_at: "2026-04-24T09:05:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cad17fecfaf7d6a523282ef4f0090e4ffaab89ab53945b5cd831e426f3fc3ac
    source_path: tools/exec.md
    workflow: 15
---

Esegui comandi shell nel workspace. Supporta esecuzione in foreground + background tramite `process`.
Se `process` non è consentito, `exec` viene eseguito in modo sincrono e ignora `yieldMs`/`background`.
Le sessioni in background sono delimitate per agente; `process` vede solo le sessioni dello stesso agente.

## Parametri

<ParamField path="command" type="string" required>
Comando shell da eseguire.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Directory di lavoro per il comando.
</ParamField>

<ParamField path="env" type="object">
Override di ambiente chiave/valore uniti sopra l'ambiente ereditato.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Passa automaticamente il comando in background dopo questo ritardo (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Mette immediatamente il comando in background invece di attendere `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="1800">
Termina il comando dopo questo numero di secondi.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Esegui in uno pseudo-terminale quando disponibile. Usalo per CLI che richiedono TTY, agenti di coding e UI terminali.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Dove eseguire. `auto` si risolve in `sandbox` quando è attivo un runtime sandbox e in `gateway` altrimenti.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Modalità di enforcement per l'esecuzione `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Comportamento del prompt di approvazione per l'esecuzione `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
ID/nome del Node quando `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Richiede la modalità elevated — esce dalla sandbox verso il percorso host configurato. `security=full` viene forzato solo quando elevated si risolve in `full`.
</ParamField>

Note:

- `host` usa per impostazione predefinita `auto`: sandbox quando è attivo un runtime sandbox per la sessione, altrimenti gateway.
- `auto` è la strategia di instradamento predefinita, non un wildcard. `host=node` per chiamata è consentito da `auto`; `host=gateway` per chiamata è consentito solo quando non è attivo alcun runtime sandbox.
- Senza configurazione aggiuntiva, `host=auto` continua semplicemente a “funzionare”: senza sandbox si risolve in `gateway`; con una sandbox live resta nella sandbox.
- `elevated` esce dalla sandbox verso il percorso host configurato: `gateway` per impostazione predefinita, oppure `node` quando `tools.exec.host=node` (o il valore predefinito della sessione è `host=node`). È disponibile solo quando l'accesso elevated è abilitato per la sessione/provider corrente.
- Le approvazioni `gateway`/`node` sono controllate da `~/.openclaw/exec-approvals.json`.
- `node` richiede un Node associato (app companion o host Node headless).
- Se sono disponibili più Node, imposta `exec.node` o `tools.exec.node` per selezionarne uno.
- `exec host=node` è l'unico percorso di esecuzione shell per i Node; il wrapper legacy `nodes.run` è stato rimosso.
- Su host non-Windows, exec usa `SHELL` quando impostato; se `SHELL` è `fish`, preferisce `bash` (o `sh`)
  dal `PATH` per evitare script incompatibili con fish, poi ripiega su `SHELL` se nessuno dei due esiste.
- Su host Windows, exec preferisce il rilevamento di PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, poi PATH),
  poi ripiega su Windows PowerShell 5.1.
- L'esecuzione host (`gateway`/`node`) rifiuta `env.PATH` e gli override del loader (`LD_*`/`DYLD_*`) per
  prevenire dirottamento di binari o codice iniettato.
- OpenClaw imposta `OPENCLAW_SHELL=exec` nell'ambiente del comando generato (inclusa esecuzione PTY e sandbox) così le regole shell/profile possono rilevare il contesto dello strumento exec.
- Importante: il sandboxing è **disattivato per impostazione predefinita**. Se il sandboxing è disattivato, `host=auto`
  implicito si risolve in `gateway`. `host=sandbox` esplicito fallisce comunque in modalità fail-closed invece di eseguire silenziosamente
  sull'host gateway. Abilita il sandboxing oppure usa `host=gateway` con approvazioni.
- I controlli preflight degli script (per errori comuni di sintassi shell Python/Node) ispezionano solo i file all'interno del
  boundary effettivo di `workdir`. Se un percorso di script si risolve fuori da `workdir`, il preflight viene saltato per
  quel file.
- Per lavori a lunga esecuzione che iniziano ora, avviali una sola volta e fai affidamento sul risveglio automatico
  al completamento quando è abilitato e il comando produce output o fallisce.
  Usa `process` per log, stato, input o intervento; non emulare
  pianificazione con loop sleep, loop timeout o polling ripetuto.
- Per lavori che dovrebbero avvenire in seguito o a cadenza programmata, usa Cron invece di pattern
  sleep/delay con `exec`.

## Configurazione

- `tools.exec.notifyOnExit` (predefinito: true): quando true, le sessioni exec passate in background accodano un evento di sistema e richiedono un Heartbeat all'uscita.
- `tools.exec.approvalRunningNoticeMs` (predefinito: 10000): emette un singolo avviso “running” quando un exec soggetto ad approvazione dura più di questo valore (0 disabilita).
- `tools.exec.host` (predefinito: `auto`; si risolve in `sandbox` quando è attivo un runtime sandbox, altrimenti in `gateway`)
- `tools.exec.security` (predefinito: `deny` per sandbox, `full` per gateway + node quando non impostato)
- `tools.exec.ask` (predefinito: `off`)
- Exec host senza approvazione è il valore predefinito per gateway + node. Se vuoi comportamento con approvazioni/allowlist, restringi sia `tools.exec.*` sia la policy host `~/.openclaw/exec-approvals.json`; vedi [Approvazioni Exec](/it/tools/exec-approvals#no-approval-yolo-mode).
- YOLO deriva dai valori predefiniti della policy host (`security=full`, `ask=off`), non da `host=auto`. Se vuoi forzare l'instradamento gateway o node, imposta `tools.exec.host` o usa `/exec host=...`.
- In modalità `security=full` più `ask=off`, l'exec host segue direttamente la policy configurata; non esiste un livello extra di prefiltro euristico di offuscamento dei comandi o di rifiuto preflight degli script.
- `tools.exec.node` (predefinito: non impostato)
- `tools.exec.strictInlineEval` (predefinito: false): quando true, le forme di eval inline dell'interprete come `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` e `osascript -e` richiedono sempre approvazione esplicita. `allow-always` può comunque rendere persistenti invocazioni benigne di interpreti/script, ma le forme inline-eval continueranno a richiedere un prompt ogni volta.
- `tools.exec.pathPrepend`: elenco di directory da anteporre a `PATH` per le esecuzioni exec (solo gateway + sandbox).
- `tools.exec.safeBins`: binari sicuri solo-stdin che possono essere eseguiti senza voci esplicite in allowlist. Per i dettagli di comportamento, vedi [Safe bins](/it/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: directory esplicite aggiuntive considerate attendibili per i controlli di percorso degli eseguibili `safeBins`. Le voci di `PATH` non vengono mai considerate attendibili automaticamente. I valori predefiniti integrati sono `/bin` e `/usr/bin`.
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

- `host=gateway`: unisce il tuo `PATH` della shell di login nell'ambiente exec. Gli override di
  `env.PATH` vengono rifiutati per l'esecuzione host. Il daemon stesso continua comunque a girare con un `PATH` minimo:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: esegue `sh -lc` (shell di login) dentro il container, quindi `/etc/profile` può reimpostare `PATH`.
  OpenClaw antepone `env.PATH` dopo il sourcing del profilo tramite una variabile env interna (senza interpolazione shell);
  anche `tools.exec.pathPrepend` si applica qui.
- `host=node`: solo gli override env non bloccati che passi vengono inviati al Node. Gli override di `env.PATH` vengono
  rifiutati per l'esecuzione host e ignorati dagli host Node. Se hai bisogno di voci PATH aggiuntive su un Node,
  configura l'ambiente del servizio host Node (systemd/launchd) oppure installa gli strumenti in posizioni standard.

Binding del Node per agente (usa l'indice dell'elenco agenti nella configurazione):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

UI di controllo: la scheda Nodes include un piccolo pannello “Exec node binding” per le stesse impostazioni.

## Override di sessione (`/exec`)

Usa `/exec` per impostare i valori predefiniti **per-sessione** di `host`, `security`, `ask` e `node`.
Invia `/exec` senza argomenti per mostrare i valori correnti.

Esempio:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modello di autorizzazione

`/exec` viene rispettato solo per **mittenti autorizzati** (allowlist/pairing del canale più `commands.useAccessGroups`).
Aggiorna **solo lo stato della sessione** e non scrive configurazione. Per disabilitare rigidamente exec, negalo tramite la
policy degli strumenti (`tools.deny: ["exec"]` o per-agente). Le approvazioni host continuano comunque ad applicarsi a meno che tu non imposti esplicitamente
`security=full` e `ask=off`.

## Approvazioni Exec (app companion / host Node)

Gli agenti sandboxed possono richiedere approvazione per richiesta prima che `exec` venga eseguito sull'host gateway o node.
Vedi [Approvazioni Exec](/it/tools/exec-approvals) per la policy, l'allowlist e il flusso UI.

Quando sono richieste approvazioni, lo strumento exec restituisce immediatamente
`status: "approval-pending"` e un id di approvazione. Una volta approvato (o negato / scaduto),
il Gateway emette eventi di sistema (`Exec finished` / `Exec denied`). Se il comando è ancora
in esecuzione dopo `tools.exec.approvalRunningNoticeMs`, viene emesso un singolo avviso `Exec running`.
Sui canali con card/button di approvazione nativi, l'agente dovrebbe fare affidamento prima
su quella UI nativa e includere un comando manuale `/approve` solo quando il
risultato dello strumento dice esplicitamente che le approvazioni in chat non sono disponibili o che l'approvazione manuale è l'unico percorso.

## Allowlist + safe bins

L'enforcement manuale della allowlist corrisponde solo ai **percorsi binari risolti** (nessuna corrispondenza per basename). Quando
`security=allowlist`, i comandi shell vengono consentiti automaticamente solo se ogni segmento della pipeline è
in allowlist oppure è un safe bin. Concatenazioni (`;`, `&&`, `||`) e reindirizzamenti vengono rifiutati in
modalità allowlist a meno che ogni segmento di primo livello soddisfi la allowlist (inclusi i safe bin).
I reindirizzamenti restano non supportati.
La fiducia duratura `allow-always` non aggira questa regola: un comando concatenato richiede comunque che ogni
segmento di primo livello corrisponda.

`autoAllowSkills` è un percorso di comodità separato nelle approvazioni exec. Non è la stessa cosa delle
voci manuali di allowlist dei percorsi. Per una fiducia rigorosa ed esplicita, mantieni `autoAllowSkills` disabilitato.

Usa i due controlli per lavori diversi:

- `tools.exec.safeBins`: piccoli filtri di stream solo-stdin.
- `tools.exec.safeBinTrustedDirs`: directory attendibili esplicite aggiuntive per i percorsi eseguibili dei safe bin.
- `tools.exec.safeBinProfiles`: policy argv esplicita per safe bin personalizzati.
- allowlist: fiducia esplicita per i percorsi eseguibili.

Non trattare `safeBins` come una allowlist generica e non aggiungere binari interprete/runtime (ad esempio `python3`, `node`, `ruby`, `bash`). Se ti servono, usa voci esplicite in allowlist e mantieni abilitati i prompt di approvazione.
`openclaw security audit` avvisa quando mancano profili espliciti per voci `safeBins` di interpreti/runtime, e `openclaw doctor --fix` può creare automaticamente voci mancanti di `safeBinProfiles`.
`openclaw security audit` e `openclaw doctor` avvisano anche quando aggiungi esplicitamente in `safeBins` bin dal comportamento ampio come `jq`.
Se aggiungi esplicitamente interpreti in allowlist, abilita `tools.exec.strictInlineEval` così le forme di eval inline richiedono comunque una nuova approvazione.

Per dettagli completi sulla policy ed esempi, vedi [Approvazioni Exec](/it/tools/exec-approvals-advanced#safe-bins-stdin-only) e [Safe bins versus allowlist](/it/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Esempi

Foreground:

```json
{ "tool": "exec", "command": "ls -la" }
```

Background + poll:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Il polling serve per stato su richiesta, non per loop di attesa. Se il risveglio automatico al completamento
è abilitato, il comando può risvegliare la sessione quando emette output o fallisce.

Invio di tasti (stile tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Invio (manda solo CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Incolla (delimitato di default):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` è un sottostrumento di `exec` per modifiche strutturate su più file.
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
- `tools.exec.applyPatch.enabled` usa come predefinito `true`; impostalo su `false` per disabilitare lo strumento per i modelli OpenAI.
- `tools.exec.applyPatch.workspaceOnly` usa come predefinito `true` (limitato al workspace). Impostalo su `false` solo se vuoi intenzionalmente che `apply_patch` scriva/cancelli fuori dalla directory del workspace.

## Correlati

- [Approvazioni Exec](/it/tools/exec-approvals) — gate di approvazione per i comandi shell
- [Sandboxing](/it/gateway/sandboxing) — esecuzione di comandi in ambienti sandboxed
- [Background Process](/it/gateway/background-process) — exec a lunga esecuzione e strumento process
- [Sicurezza](/it/gateway/security) — policy degli strumenti e accesso elevated
