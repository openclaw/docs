---
read_when:
    - Uso o modifica del tool exec
    - Debug del comportamento di stdin o TTY
summary: Uso del tool exec, modalità stdin e supporto TTY
title: Tool exec
x-i18n:
    generated_at: "2026-04-21T08:29:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5018468f31bb76fc142ddef7002c7bbc617406de7ce912670d1b9edef6a9a042
    source_path: tools/exec.md
    workflow: 15
---

# Tool exec

Esegui comandi shell nel workspace. Supporta esecuzione in foreground + background tramite `process`.
Se `process` non è consentito, `exec` viene eseguito in modo sincrono e ignora `yieldMs`/`background`.
Le sessioni in background hanno ambito per agent; `process` vede solo le sessioni dello stesso agent.

## Parametri

- `command` (obbligatorio)
- `workdir` (predefinito: cwd)
- `env` (override chiave/valore)
- `yieldMs` (predefinito 10000): passa automaticamente in background dopo il ritardo
- `background` (bool): passa immediatamente in background
- `timeout` (secondi, predefinito 1800): termina alla scadenza
- `pty` (bool): esegui in uno pseudo-terminal quando disponibile (CLI solo TTY, agent di coding, UI terminali)
- `host` (`auto | sandbox | gateway | node`): dove eseguire
- `security` (`deny | allowlist | full`): modalità di enforcement per `gateway`/`node`
- `ask` (`off | on-miss | always`): prompt di approvazione per `gateway`/`node`
- `node` (string): id/nome del node per `host=node`
- `elevated` (bool): richiede modalità elevata (esce dalla sandbox verso il percorso host configurato); `security=full` viene forzato solo quando elevated si risolve in `full`

Note:

- `host` ha come valore predefinito `auto`: sandbox quando il runtime sandbox è attivo per la sessione, altrimenti gateway.
- `auto` è la strategia di instradamento predefinita, non un wildcard. `host=node` per chiamata è consentito da `auto`; `host=gateway` per chiamata è consentito solo quando non è attivo alcun runtime sandbox.
- Senza configurazione aggiuntiva, `host=auto` continua a “funzionare e basta”: senza sandbox si risolve in `gateway`; con una sandbox attiva resta nella sandbox.
- `elevated` esce dalla sandbox verso il percorso host configurato: `gateway` per impostazione predefinita, oppure `node` quando `tools.exec.host=node` (o quando il valore predefinito della sessione è `host=node`). È disponibile solo quando l'accesso elevato è abilitato per la sessione/provider corrente.
- Le approvazioni `gateway`/`node` sono controllate da `~/.openclaw/exec-approvals.json`.
- `node` richiede un node associato (app companion o host node headless).
- Se sono disponibili più node, imposta `exec.node` o `tools.exec.node` per selezionarne uno.
- `exec host=node` è l'unico percorso di esecuzione shell per i node; il wrapper legacy `nodes.run` è stato rimosso.
- Sugli host non Windows, exec usa `SHELL` se impostata; se `SHELL` è `fish`, preferisce `bash` (o `sh`)
  da `PATH` per evitare script incompatibili con fish, poi torna a `SHELL` se nessuno dei due esiste.
- Sugli host Windows, exec preferisce individuare PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, poi PATH),
  poi torna a Windows PowerShell 5.1.
- L'esecuzione host (`gateway`/`node`) rifiuta `env.PATH` e gli override del loader (`LD_*`/`DYLD_*`) per
  impedire dirottamento di binari o codice iniettato.
- OpenClaw imposta `OPENCLAW_SHELL=exec` nell'ambiente del comando avviato (inclusi PTY ed esecuzione sandbox) così le regole di shell/profile possono rilevare il contesto del tool exec.
- Importante: il sandboxing è **disattivato per impostazione predefinita**. Se il sandboxing è disattivato, `host=auto`
  implicito si risolve in `gateway`. `host=sandbox` esplicito continua però a fallire in modo chiuso invece di
  eseguire silenziosamente sull'host gateway. Abilita il sandboxing oppure usa `host=gateway` con approvazioni.
- I controlli preflight degli script (per comuni errori di sintassi shell Python/Node) ispezionano solo i file dentro il
  confine effettivo di `workdir`. Se un percorso script viene risolto fuori da `workdir`, il preflight viene saltato per
  quel file.
- Per lavori di lunga durata che iniziano ora, avviali una sola volta e affidati al risveglio
  automatico al completamento quando è abilitato e il comando produce output o fallisce.
  Usa `process` per log, stato, input o intervento; non emulare
  la schedulazione con loop di sleep, loop di timeout o polling ripetuto.
- Per lavori che devono avvenire più tardi o secondo una pianificazione, usa Cron invece di
  pattern `exec` basati su sleep/delay.

## Configurazione

- `tools.exec.notifyOnExit` (predefinito: true): quando true, le sessioni exec passate in background accodano un evento di sistema e richiedono un Heartbeat all'uscita.
- `tools.exec.approvalRunningNoticeMs` (predefinito: 10000): emette un singolo avviso “running” quando un exec con gating di approvazione dura più di questo tempo (0 disabilita).
- `tools.exec.host` (predefinito: `auto`; si risolve in `sandbox` quando il runtime sandbox è attivo, altrimenti `gateway`)
- `tools.exec.security` (predefinito: `deny` per sandbox, `full` per gateway + node quando non impostato)
- `tools.exec.ask` (predefinito: `off`)
- L'exec host senza approvazione è il valore predefinito per gateway + node. Se vuoi comportamento con approvazioni/allowlist, restringi sia `tools.exec.*` sia la policy host `~/.openclaw/exec-approvals.json`; vedi [Exec approvals](/it/tools/exec-approvals#no-approval-yolo-mode).
- YOLO deriva dai valori predefiniti della policy host (`security=full`, `ask=off`), non da `host=auto`. Se vuoi forzare l'instradamento verso gateway o node, imposta `tools.exec.host` oppure usa `/exec host=...`.
- In modalità `security=full` più `ask=off`, l'exec host segue direttamente la policy configurata; non esiste un ulteriore livello euristico di prefilter per offuscamento dei comandi o di rifiuto del preflight degli script.
- `tools.exec.node` (predefinito: non impostato)
- `tools.exec.strictInlineEval` (predefinito: false): quando true, le forme inline di eval dell'interprete come `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` e `osascript -e` richiedono sempre approvazione esplicita. `allow-always` può ancora mantenere invocazioni innocue di interprete/script, ma le forme inline-eval continuano a richiedere prompt ogni volta.
- `tools.exec.pathPrepend`: elenco di directory da anteporre a `PATH` per le esecuzioni exec (solo gateway + sandbox).
- `tools.exec.safeBins`: binari sicuri solo-stdin che possono essere eseguiti senza voci esplicite nella allowlist. Per i dettagli di comportamento, vedi [Safe bins](/it/tools/exec-approvals#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: directory esplicite aggiuntive considerate attendibili per i controlli del percorso eseguibile dei `safeBins`. Le voci `PATH` non sono mai considerate attendibili automaticamente. I valori predefiniti integrati sono `/bin` e `/usr/bin`.
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

- `host=gateway`: unisce il tuo `PATH` della login shell nell'ambiente exec. Gli override di `env.PATH` vengono
  rifiutati per l'esecuzione host. Il daemon stesso continua però a essere eseguito con un `PATH` minimo:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: esegue `sh -lc` (login shell) dentro il container, quindi `/etc/profile` può reimpostare `PATH`.
  OpenClaw antepone `env.PATH` dopo il sourcing del profilo tramite una variabile env interna (senza interpolazione della shell);
  anche `tools.exec.pathPrepend` si applica qui.
- `host=node`: solo gli override env non bloccati che passi vengono inviati al node. Gli override `env.PATH` vengono
  rifiutati per l'esecuzione host e ignorati dagli host node. Se hai bisogno di ulteriori voci PATH su un node,
  configura l'ambiente del servizio host node (systemd/launchd) oppure installa i tool in posizioni standard.

Binding per-agent del node (usa l'indice dell'elenco agent nella configurazione):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

UI di controllo: la scheda Nodes include un piccolo pannello “Exec node binding” per le stesse impostazioni.

## Override di sessione (`/exec`)

Usa `/exec` per impostare valori predefiniti **per-sessione** per `host`, `security`, `ask` e `node`.
Invia `/exec` senza argomenti per mostrare i valori correnti.

Esempio:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modello di autorizzazione

`/exec` viene rispettato solo per **mittenti autorizzati** (allowlist/pairing del canale più `commands.useAccessGroups`).
Aggiorna **solo lo stato della sessione** e non scrive la configurazione. Per disabilitare in modo rigido exec, negalo tramite
policy del tool (`tools.deny: ["exec"]` o per-agent). Le approvazioni host continuano ad applicarsi a meno che tu non imposti esplicitamente
`security=full` e `ask=off`.

## Exec approvals (app companion / host node)

Gli agent in sandbox possono richiedere approvazione per richiesta prima che `exec` venga eseguito sull'host gateway o node.
Vedi [Exec approvals](/it/tools/exec-approvals) per policy, allowlist e flusso UI.

Quando sono richieste approvazioni, il tool exec restituisce immediatamente
`status: "approval-pending"` e un ID di approvazione. Una volta approvato (o negato / scaduto),
il Gateway emette eventi di sistema (`Exec finished` / `Exec denied`). Se il comando è ancora
in esecuzione dopo `tools.exec.approvalRunningNoticeMs`, viene emesso un singolo avviso `Exec running`.
Nei canali con card/pulsanti di approvazione nativi, l'agent dovrebbe affidarsi prima a quella
UI nativa e includere un comando manuale `/approve` solo quando il risultato
del tool dice esplicitamente che le approvazioni via chat non sono disponibili o che l'approvazione manuale è l'unico
percorso possibile.

## Allowlist + safe bins

L'enforcement manuale della allowlist corrisponde solo ai **percorsi binari risolti** (nessuna corrispondenza per basename). Quando
`security=allowlist`, i comandi shell vengono auto-consentiti solo se ogni segmento della pipeline è
presente nella allowlist o è un safe bin. Concatenamenti (`;`, `&&`, `||`) e redirection vengono rifiutati in
modalità allowlist a meno che ogni segmento di primo livello soddisfi la allowlist (inclusi i safe bin).
Le redirection restano non supportate.
La fiducia duratura `allow-always` non aggira questa regola: un comando concatenato continua a richiedere che ogni
segmento di primo livello corrisponda.

`autoAllowSkills` è un percorso di convenience separato nelle exec approvals. Non è la stessa cosa delle
voci manuali di allowlist dei percorsi. Per fiducia esplicita rigorosa, mantieni `autoAllowSkills` disabilitato.

Usa i due controlli per lavori diversi:

- `tools.exec.safeBins`: piccoli filtri stream solo-stdin.
- `tools.exec.safeBinTrustedDirs`: directory esplicite aggiuntive attendibili per i percorsi eseguibili dei safe bin.
- `tools.exec.safeBinProfiles`: policy argv esplicita per safe bin personalizzati.
- allowlist: fiducia esplicita per i percorsi eseguibili.

Non trattare `safeBins` come una allowlist generica e non aggiungere binari di interpreti/runtime (ad esempio `python3`, `node`, `ruby`, `bash`). Se ne hai bisogno, usa voci esplicite di allowlist e mantieni abilitati i prompt di approvazione.
`openclaw security audit` avvisa quando nelle voci `safeBins` di interpreti/runtime mancano profili espliciti, e `openclaw doctor --fix` può creare le voci personalizzate mancanti di `safeBinProfiles`.
`openclaw security audit` e `openclaw doctor` avvisano anche quando aggiungi esplicitamente di nuovo binari dal comportamento ampio come `jq` in `safeBins`.
Se inserisci esplicitamente interpreti nella allowlist, abilita `tools.exec.strictInlineEval` così le forme inline di code-eval continuano a richiedere una nuova approvazione.

Per dettagli completi su policy ed esempi, vedi [Exec approvals](/it/tools/exec-approvals#safe-bins-stdin-only) e [Safe bins versus allowlist](/it/tools/exec-approvals#safe-bins-versus-allowlist).

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

Il polling serve per lo stato on-demand, non per loop di attesa. Se il risveglio automatico al completamento
è abilitato, il comando può risvegliare la sessione quando produce output o fallisce.

Invio tasti (stile tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Invio (manda solo CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Incolla (tra bracket per impostazione predefinita):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` è un subtool di `exec` per modifiche strutturate multi-file.
È abilitato per impostazione predefinita per i modelli OpenAI e OpenAI Codex. Usa la configurazione solo
quando vuoi disabilitarlo o limitarlo a modelli specifici:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.4"] },
    },
  },
}
```

Note:

- Disponibile solo per i modelli OpenAI/OpenAI Codex.
- La policy del tool continua ad applicarsi; `allow: ["write"]` consente implicitamente `apply_patch`.
- La configurazione si trova sotto `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` ha come valore predefinito `true`; impostalo su `false` per disabilitare il tool per i modelli OpenAI.
- `tools.exec.applyPatch.workspaceOnly` ha come valore predefinito `true` (contenuto nel workspace). Impostalo su `false` solo se vuoi intenzionalmente che `apply_patch` scriva/elimini fuori dalla directory del workspace.

## Correlati

- [Exec Approvals](/it/tools/exec-approvals) — gate di approvazione per i comandi shell
- [Sandboxing](/it/gateway/sandboxing) — esecuzione di comandi in ambienti sandbox
- [Background Process](/it/gateway/background-process) — esecuzioni exec di lunga durata e tool process
- [Security](/it/gateway/security) — policy dei tool e accesso elevato
