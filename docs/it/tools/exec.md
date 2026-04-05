---
read_when:
    - Uso o modifica dello strumento exec
    - Debug del comportamento stdin o TTY
summary: Utilizzo dello strumento exec, modalità stdin e supporto TTY
title: Strumento Exec
x-i18n:
    generated_at: "2026-04-05T14:06:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: b73e9900c109910fc4e178c888b7ad7f3a4eeaa34eb44bc816abba9af5d664d7
    source_path: tools/exec.md
    workflow: 15
---

# Strumento Exec

Esegui comandi shell nel workspace. Supporta esecuzione in foreground e background tramite `process`.
Se `process` non è consentito, `exec` viene eseguito in modo sincrono e ignora `yieldMs`/`background`.
Le sessioni in background sono limitate per agente; `process` vede solo le sessioni dello stesso agente.

## Parametri

- `command` (obbligatorio)
- `workdir` (predefinito: cwd)
- `env` (override chiave/valore)
- `yieldMs` (predefinito 10000): passaggio automatico in background dopo il ritardo
- `background` (bool): va in background immediatamente
- `timeout` (secondi, predefinito 1800): termina alla scadenza
- `pty` (bool): esecuzione in pseudo-terminale quando disponibile (CLI solo TTY, agenti di coding, UI terminali)
- `host` (`auto | sandbox | gateway | node`): dove eseguire
- `security` (`deny | allowlist | full`): modalità di applicazione per `gateway`/`node`
- `ask` (`off | on-miss | always`): prompt di approvazione per `gateway`/`node`
- `node` (string): id/nome del nodo per `host=node`
- `elevated` (bool): richiede la modalità elevata (esce dalla sandbox verso il percorso host configurato); `security=full` viene forzato solo quando `elevated` si risolve in `full`

Note:

- `host` ha come predefinito `auto`: sandbox quando il runtime sandbox è attivo per la sessione, altrimenti gateway.
- `auto` è la strategia di instradamento predefinita, non un jolly. `host=node` per chiamata è consentito da `auto`; `host=gateway` per chiamata è consentito solo quando non è attivo alcun runtime sandbox.
- Senza configurazione aggiuntiva, `host=auto` continua semplicemente a funzionare: senza sandbox si risolve in `gateway`; con una sandbox attiva resta nella sandbox.
- `elevated` esce dalla sandbox verso il percorso host configurato: `gateway` per impostazione predefinita, oppure `node` quando `tools.exec.host=node` (o il valore predefinito della sessione è `host=node`). È disponibile solo quando l'accesso elevato è abilitato per la sessione/provider corrente.
- Le approvazioni `gateway`/`node` sono controllate da `~/.openclaw/exec-approvals.json`.
- `node` richiede un nodo associato (app companion o host nodo headless).
- Se sono disponibili più nodi, imposta `exec.node` o `tools.exec.node` per selezionarne uno.
- `exec host=node` è l'unico percorso di esecuzione shell per i nodi; il wrapper legacy `nodes.run` è stato rimosso.
- Sugli host non Windows, exec usa `SHELL` se impostato; se `SHELL` è `fish`, preferisce `bash` (o `sh`)
  da `PATH` per evitare script incompatibili con fish, poi usa `SHELL` come fallback se nessuno dei due esiste.
- Sugli host Windows, exec preferisce il rilevamento di PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, poi PATH),
  quindi usa come fallback Windows PowerShell 5.1.
- L'esecuzione host (`gateway`/`node`) rifiuta `env.PATH` e gli override del loader (`LD_*`/`DYLD_*`) per
  prevenire il dirottamento di binari o l'iniezione di codice.
- OpenClaw imposta `OPENCLAW_SHELL=exec` nell'ambiente del comando generato (inclusi PTY ed esecuzione sandbox), in modo che le regole di shell/profile possano rilevare il contesto dello strumento exec.
- Importante: il sandboxing è **disattivato per impostazione predefinita**. Se il sandboxing è disattivato, `host=auto`
  implicito si risolve in `gateway`. `host=sandbox` esplicito fallisce comunque in modo chiuso invece di eseguire silenziosamente
  sull'host gateway. Abilita il sandboxing o usa `host=gateway` con approvazioni.
- I controlli preliminari degli script (per errori comuni di sintassi shell Python/Node) esaminano solo i file all'interno del
  limite effettivo di `workdir`. Se il percorso di uno script si risolve fuori da `workdir`, il preflight viene saltato per
  quel file.
- Per lavori di lunga durata che iniziano subito, avviali una sola volta e affidati al
  risveglio automatico al completamento quando è abilitato e il comando emette output o fallisce.
  Usa `process` per log, stato, input o intervento; non simulare
  schedulazione con loop di sleep, loop di timeout o polling ripetuto.
- Per lavori che devono avvenire più tardi o secondo una pianificazione, usa cron invece di
  pattern sleep/delay con `exec`.

## Configurazione

- `tools.exec.notifyOnExit` (predefinito: true): quando true, le sessioni exec mandate in background accodano un evento di sistema e richiedono un heartbeat all'uscita.
- `tools.exec.approvalRunningNoticeMs` (predefinito: 10000): emette un singolo avviso “running” quando un exec con approvazione dura più di questo valore (0 disabilita).
- `tools.exec.host` (predefinito: `auto`; si risolve in `sandbox` quando il runtime sandbox è attivo, altrimenti `gateway`)
- `tools.exec.security` (predefinito: `deny` per sandbox, `full` per gateway + node se non impostato)
- `tools.exec.ask` (predefinito: `off`)
- L'esecuzione host senza approvazione è il valore predefinito per gateway + node. Se vuoi il comportamento con approvazioni/allowlist, restringi sia `tools.exec.*` sia il file host `~/.openclaw/exec-approvals.json`; vedi [Approvazioni Exec](/tools/exec-approvals#no-approval-yolo-mode).
- La modalità YOLO deriva dalle impostazioni predefinite della policy host (`security=full`, `ask=off`), non da `host=auto`. Se vuoi forzare il routing gateway o node, imposta `tools.exec.host` o usa `/exec host=...`.
- `tools.exec.node` (predefinito: non impostato)
- `tools.exec.strictInlineEval` (predefinito: false): quando true, le forme eval inline dell'interprete come `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` e `osascript -e` richiedono sempre approvazione esplicita. `allow-always` può comunque persistere invocazioni benigne di interpreti/script, ma le forme inline-eval continuano a richiedere un prompt ogni volta.
- `tools.exec.pathPrepend`: elenco di directory da anteporre a `PATH` per le esecuzioni exec (solo gateway + sandbox).
- `tools.exec.safeBins`: binari sicuri solo-stdin che possono essere eseguiti senza voci esplicite in allowlist. Per i dettagli del comportamento, vedi [Safe bins](/tools/exec-approvals#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: directory esplicite aggiuntive considerate attendibili per i controlli del percorso eseguibile dei safe bin. Le voci in `PATH` non sono mai considerate attendibili automaticamente. I valori predefiniti incorporati sono `/bin` e `/usr/bin`.
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

- `host=gateway`: unisce il tuo `PATH` della shell di login all'ambiente exec. Gli override di `env.PATH` vengono
  rifiutati per l'esecuzione host. Il daemon stesso continua comunque a essere eseguito con un `PATH` minimo:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: esegue `sh -lc` (shell di login) all'interno del container, quindi `/etc/profile` può reimpostare `PATH`.
  OpenClaw antepone `env.PATH` dopo il caricamento del profilo tramite una variabile env interna (senza interpolazione shell);
  anche `tools.exec.pathPrepend` si applica qui.
- `host=node`: solo gli override env non bloccati che passi vengono inviati al nodo. Gli override di `env.PATH` vengono
  rifiutati per l'esecuzione host e ignorati dagli host nodo. Se ti servono voci PATH aggiuntive su un nodo,
  configura l'ambiente del servizio host nodo (systemd/launchd) o installa gli strumenti in posizioni standard.

Binding del nodo per agente (usa l'indice dell'elenco agenti nella configurazione):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: la scheda Nodes include un piccolo pannello “Exec node binding” per le stesse impostazioni.

## Override di sessione (`/exec`)

Usa `/exec` per impostare i valori predefiniti **per sessione** di `host`, `security`, `ask` e `node`.
Invia `/exec` senza argomenti per mostrare i valori correnti.

Esempio:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modello di autorizzazione

`/exec` viene rispettato solo per **mittenti autorizzati** (allowlist dei canali/associazione più `commands.useAccessGroups`).
Aggiorna **solo lo stato della sessione** e non scrive la configurazione. Per disabilitare completamente exec, negalo tramite
la policy dello strumento (`tools.deny: ["exec"]` o per agente). Le approvazioni host continuano comunque ad applicarsi, a meno che tu non imposti esplicitamente
`security=full` e `ask=off`.

## Approvazioni Exec (app companion / host nodo)

Gli agenti in sandbox possono richiedere un'approvazione per richiesta prima che `exec` venga eseguito sull'host gateway o nodo.
Vedi [Approvazioni Exec](/tools/exec-approvals) per policy, allowlist e flusso UI.

Quando sono richieste approvazioni, lo strumento exec restituisce immediatamente
`status: "approval-pending"` e un id di approvazione. Una volta approvato (o negato / scaduto),
il Gateway emette eventi di sistema (`Exec finished` / `Exec denied`). Se il comando è ancora
in esecuzione dopo `tools.exec.approvalRunningNoticeMs`, viene emesso un singolo avviso `Exec running`.
Sui canali con card/pulsanti di approvazione nativi, l'agente dovrebbe affidarsi prima a
quell'UI nativa e includere un comando manuale `/approve` solo quando il risultato dello
strumento dice esplicitamente che le approvazioni in chat non sono disponibili o che l'approvazione manuale è
l'unico percorso.

## Allowlist + safe bins

L'applicazione manuale della allowlist corrisponde **solo ai percorsi binari risolti** (nessuna corrispondenza per basename). Quando
`security=allowlist`, i comandi shell sono consentiti automaticamente solo se ogni segmento della pipeline è
in allowlist o è un safe bin. Le concatenazioni (`;`, `&&`, `||`) e i reindirizzamenti vengono rifiutati in
modalità allowlist a meno che ogni segmento di primo livello soddisfi la allowlist (inclusi i safe bin).
I reindirizzamenti restano non supportati.
La fiducia persistente `allow-always` non aggira questa regola: un comando concatenato richiede comunque che ogni
segmento di primo livello corrisponda.

`autoAllowSkills` è un percorso di comodità separato nelle approvazioni exec. Non è la stessa cosa delle
voci manuali di allowlist per percorso. Per una fiducia esplicita rigorosa, tieni `autoAllowSkills` disabilitato.

Usa i due controlli per lavori diversi:

- `tools.exec.safeBins`: piccoli filtri stream solo-stdin.
- `tools.exec.safeBinTrustedDirs`: directory aggiuntive esplicite considerate attendibili per i percorsi degli eseguibili safe-bin.
- `tools.exec.safeBinProfiles`: policy argv esplicita per safe bin personalizzati.
- allowlist: fiducia esplicita per i percorsi degli eseguibili.

Non trattare `safeBins` come una allowlist generica e non aggiungere binari interprete/runtime (ad esempio `python3`, `node`, `ruby`, `bash`). Se ti servono, usa voci esplicite di allowlist e mantieni attivi i prompt di approvazione.
`openclaw security audit` avvisa quando mancano voci esplicite `safeBinProfiles` per interpreti/runtime in `safeBins`, e `openclaw doctor --fix` può creare automaticamente voci personalizzate `safeBinProfiles` mancanti.
`openclaw security audit` e `openclaw doctor` avvisano anche quando aggiungi esplicitamente di nuovo in `safeBins` binari dal comportamento ampio come `jq`.
Se metti esplicitamente interpreti in allowlist, abilita `tools.exec.strictInlineEval` così le forme eval inline del codice continuano a richiedere una nuova approvazione.

Per i dettagli completi della policy e gli esempi, vedi [Approvazioni Exec](/tools/exec-approvals#safe-bins-stdin-only) e [Safe bins versus allowlist](/tools/exec-approvals#safe-bins-versus-allowlist).

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

Il polling serve per lo stato su richiesta, non per loop di attesa. Se il risveglio automatico al completamento
è abilitato, il comando può riattivare la sessione quando emette output o fallisce.

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

Incolla (tra parentesi per impostazione predefinita):

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
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.4"] },
    },
  },
}
```

Note:

- Disponibile solo per i modelli OpenAI/OpenAI Codex.
- La policy dello strumento continua ad applicarsi; `allow: ["write"]` consente implicitamente `apply_patch`.
- La configurazione si trova in `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` ha come predefinito `true`; impostalo su `false` per disabilitare lo strumento per i modelli OpenAI.
- `tools.exec.applyPatch.workspaceOnly` ha come predefinito `true` (contenuto nel workspace). Impostalo su `false` solo se vuoi intenzionalmente che `apply_patch` scriva/elimini fuori dalla directory del workspace.

## Correlati

- [Approvazioni Exec](/tools/exec-approvals) — controlli di approvazione per i comandi shell
- [Sandboxing](/it/gateway/sandboxing) — esecuzione di comandi in ambienti sandbox
- [Processo in background](/it/gateway/background-process) — exec di lunga durata e strumento process
- [Sicurezza](/it/gateway/security) — policy degli strumenti e accesso elevato
