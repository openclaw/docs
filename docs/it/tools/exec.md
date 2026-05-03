---
read_when:
    - Uso o modifica dello strumento exec
    - Debug del comportamento di stdin o TTY
summary: Utilizzo dello strumento Exec, modalità stdin e supporto TTY
title: Strumento Exec
x-i18n:
    generated_at: "2026-05-03T21:44:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: dbc8dda08abfd4d7b2e2cd5c7319a7eddf1575156bbfbc52df841908589c8c81
    source_path: tools/exec.md
    workflow: 16
---

Esegui comandi shell nell'area di lavoro. Supporta l'esecuzione in primo piano + in background tramite `process`.
Se `process` non è consentito, `exec` viene eseguito in modo sincrono e ignora `yieldMs`/`background`.
Le sessioni in background hanno ambito per agente; `process` vede solo le sessioni dello stesso agente.

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
Sposta automaticamente il comando in background dopo questo ritardo (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Sposta subito il comando in background invece di attendere `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Sovrascrive il timeout exec configurato per questa chiamata. Imposta `timeout: 0` solo quando il comando deve essere eseguito senza il timeout del processo exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Esegui in uno pseudo-terminale quando disponibile. Usalo per CLI solo TTY, agenti di codice e interfacce utente terminale.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Dove eseguire. `auto` si risolve in `sandbox` quando è attivo un runtime sandbox e in `gateway` altrimenti.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Modalità di applicazione per l'esecuzione `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Comportamento del prompt di approvazione per l'esecuzione `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
ID/nome del Node quando `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Richiedi la modalità elevata: esce dalla sandbox verso il percorso host configurato. `security=full` viene forzato solo quando elevated si risolve in `full`.
</ParamField>

Note:

- `host` usa `auto` come valore predefinito: sandbox quando il runtime sandbox è attivo per la sessione, altrimenti Gateway.
- `host` accetta solo `auto`, `sandbox`, `gateway` o `node`. Non è un selettore di hostname; i valori simili a hostname vengono rifiutati prima dell'esecuzione del comando.
- `auto` è la strategia di routing predefinita, non un carattere jolly. `host=node` per singola chiamata è consentito da `auto`; `host=gateway` per singola chiamata è consentito solo quando non è attivo alcun runtime sandbox.
- Senza configurazione aggiuntiva, `host=auto` continua a funzionare direttamente: se non c'è sandbox si risolve in `gateway`; una sandbox attiva resta nella sandbox.
- `elevated` esce dalla sandbox verso il percorso host configurato: `gateway` per impostazione predefinita, oppure `node` quando `tools.exec.host=node` (o il valore predefinito della sessione è `host=node`). È disponibile solo quando l'accesso elevato è abilitato per la sessione/provider corrente.
- Le approvazioni `gateway`/`node` sono controllate da `~/.openclaw/exec-approvals.json`.
- `node` richiede un Node associato (app companion o host Node headless).
- Se sono disponibili più Node, imposta `exec.node` o `tools.exec.node` per selezionarne uno.
- `exec host=node` è l'unico percorso di esecuzione shell per i Node; il wrapper legacy `nodes.run` è stato rimosso.
- `timeout` si applica all'esecuzione in primo piano, in background, `yieldMs`, Gateway, sandbox e Node `system.run`. Se omesso, OpenClaw usa `tools.exec.timeoutSec`; `timeout: 0` esplicito disabilita il timeout del processo exec per quella chiamata.
- Su host non Windows, exec usa `SHELL` quando impostato; se `SHELL` è `fish`, preferisce `bash` (o `sh`)
  da `PATH` per evitare script incompatibili con fish, poi ripiega su `SHELL` se nessuno dei due esiste.
- Su host Windows, exec preferisce il rilevamento di PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, poi PATH),
  poi ripiega su Windows PowerShell 5.1.
- L'esecuzione host (`gateway`/`node`) rifiuta gli override `env.PATH` e gli override dei loader (`LD_*`/`DYLD_*`) per
  prevenire dirottamenti di binari o codice iniettato.
- OpenClaw imposta `OPENCLAW_SHELL=exec` nell'ambiente del comando generato (incluse l'esecuzione PTY e sandbox) in modo che le regole shell/profilo possano rilevare il contesto dello strumento exec.
- `openclaw channels login` è bloccato da `exec` perché è un flusso interattivo di autenticazione del canale; eseguilo in un terminale sull'host Gateway, oppure usa lo strumento di login nativo del canale dalla chat quando esiste.
- Importante: il sandboxing è **disattivato per impostazione predefinita**. Se il sandboxing è disattivato, `host=auto` implicito
  si risolve in `gateway`. `host=sandbox` esplicito continua invece a fallire in modo chiuso, senza eseguire silenziosamente
  sull'host Gateway. Abilita il sandboxing o usa `host=gateway` con le approvazioni.
- I controlli preliminari sugli script (per errori comuni di sintassi shell Python/Node) ispezionano solo i file dentro il
  limite effettivo di `workdir`. Se un percorso di script si risolve fuori da `workdir`, il controllo preliminare viene saltato per
  quel file.
- Per lavori di lunga durata che iniziano ora, avviali una sola volta e affidati al risveglio automatico
  al completamento quando è abilitato e il comando emette output o fallisce.
  Usa `process` per log, stato, input o intervento; non emulare
  la pianificazione con cicli sleep, cicli timeout o polling ripetuto.
- Per lavori che devono avvenire più tardi o secondo una pianificazione, usa cron invece di
  pattern sleep/delay di `exec`.

## Configurazione

- `tools.exec.notifyOnExit` (predefinito: true): quando true, le sessioni exec mandate in background accodano un evento di sistema e richiedono un Heartbeat all'uscita.
- `tools.exec.approvalRunningNoticeMs` (predefinito: 10000): emette un singolo avviso "in esecuzione" quando un exec soggetto ad approvazione supera questa durata (0 disabilita).
- `tools.exec.timeoutSec` (predefinito: 1800): timeout exec predefinito per comando in secondi. `timeout` per singola chiamata lo sovrascrive; `timeout: 0` per singola chiamata disabilita il timeout del processo exec.
- `tools.exec.host` (predefinito: `auto`; si risolve in `sandbox` quando il runtime sandbox è attivo, `gateway` altrimenti)
- `tools.exec.security` (predefinito: `deny` per sandbox, `full` per Gateway + Node quando non impostato)
- `tools.exec.ask` (predefinito: `off`)
- L'exec host senza approvazione è il valore predefinito per Gateway + Node. Se vuoi comportamenti di approvazione/allowlist, rendi più restrittivi sia `tools.exec.*` sia l'host `~/.openclaw/exec-approvals.json`; vedi [Approvazioni exec](/it/tools/exec-approvals#yolo-mode-no-approval).
- YOLO deriva dai valori predefiniti della policy host (`security=full`, `ask=off`), non da `host=auto`. Se vuoi forzare il routing verso Gateway o Node, imposta `tools.exec.host` o usa `/exec host=...`.
- In modalità `security=full` più `ask=off`, l'exec host segue direttamente la policy configurata; non c'è alcun prefiltro euristico aggiuntivo di offuscamento dei comandi né livello di rifiuto del controllo preliminare degli script.
- `tools.exec.node` (predefinito: non impostato)
- `tools.exec.strictInlineEval` (predefinito: false): quando true, le forme di valutazione inline degli interpreti come `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` e `osascript -e` richiedono sempre approvazione esplicita. `allow-always` può comunque rendere persistenti invocazioni benigne di interpreti/script, ma le forme inline-eval continuano a mostrare il prompt ogni volta.
- `tools.exec.pathPrepend`: elenco di directory da anteporre a `PATH` per le esecuzioni exec (solo Gateway + sandbox).
- `tools.exec.safeBins`: binari sicuri solo stdin che possono essere eseguiti senza voci allowlist esplicite. Per i dettagli del comportamento, vedi [Binari sicuri](/it/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: directory esplicite aggiuntive considerate attendibili per i controlli dei percorsi `safeBins`. Le voci `PATH` non sono mai considerate attendibili automaticamente. I valori predefiniti integrati sono `/bin` e `/usr/bin`.
- `tools.exec.safeBinProfiles`: policy argv personalizzata opzionale per safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: unisce il `PATH` della tua shell di login nell'ambiente exec. Gli override `env.PATH` sono
  rifiutati per l'esecuzione host. Il daemon stesso continua a essere eseguito con un `PATH` minimo:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: esegue `sh -lc` (shell di login) dentro il container, quindi `/etc/profile` può reimpostare `PATH`.
  OpenClaw antepone `env.PATH` dopo il caricamento del profilo tramite una variabile d'ambiente interna (senza interpolazione shell);
  `tools.exec.pathPrepend` si applica anche qui.
- `host=node`: solo gli override env non bloccati che passi vengono inviati al Node. Gli override `env.PATH` sono
  rifiutati per l'esecuzione host e ignorati dagli host Node. Se hai bisogno di voci PATH aggiuntive su un Node,
  configura l'ambiente del servizio host Node (systemd/launchd) oppure installa gli strumenti in posizioni standard.

Associazione Node per agente (usa l'indice dell'elenco agenti nella configurazione):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: la scheda Nodes include un piccolo pannello "Associazione Node exec" per le stesse impostazioni.

## Override di sessione (`/exec`)

Usa `/exec` per impostare i valori predefiniti **per sessione** per `host`, `security`, `ask` e `node`.
Invia `/exec` senza argomenti per mostrare i valori correnti.

Esempio:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modello di autorizzazione

`/exec` viene rispettato solo per **mittenti autorizzati** (allowlist/associazione del canale più `commands.useAccessGroups`).
Aggiorna **solo lo stato della sessione** e non scrive la configurazione. Per disabilitare exec in modo rigido, negalo tramite la policy degli strumenti
(`tools.deny: ["exec"]` o per agente). Le approvazioni host continuano ad applicarsi a meno che tu non imposti esplicitamente
`security=full` e `ask=off`.

## Approvazioni exec (app companion / host Node)

Gli agenti in sandbox possono richiedere l'approvazione per richiesta prima che `exec` venga eseguito sul Gateway o sull'host Node.
Vedi [Approvazioni exec](/it/tools/exec-approvals) per la policy, l'allowlist e il flusso UI.

Quando sono richieste approvazioni, lo strumento exec restituisce immediatamente
`status: "approval-pending"` e un ID di approvazione. Dopo l'approvazione (o il rifiuto / timeout),
il Gateway emette eventi di sistema (`Exec finished` / `Exec denied`). Se il comando è ancora
in esecuzione dopo `tools.exec.approvalRunningNoticeMs`, viene emesso un singolo avviso `Exec running`.
Sui canali con schede/pulsanti di approvazione nativi, l'agente dovrebbe fare affidamento prima su quella
UI nativa e includere un comando manuale `/approve` solo quando il risultato dello strumento
dice esplicitamente che le approvazioni via chat non sono disponibili o che l'approvazione manuale è
l'unico percorso.

## Allowlist + safe bin

L'applicazione manuale dell'allowlist confronta i glob dei percorsi binari risolti e i glob dei nomi di comando
semplici. I nomi semplici corrispondono solo ai comandi invocati tramite PATH, quindi `rg` può corrispondere a
`/opt/homebrew/bin/rg` quando il comando è `rg`, ma non a `./rg` o `/tmp/rg`.
Quando `security=allowlist`, i comandi shell sono consentiti automaticamente solo se ogni segmento della pipeline
è in allowlist o è un safe bin. Il concatenamento (`;`, `&&`, `||`) e le redirezioni
vengono rifiutati in modalità allowlist a meno che ogni segmento di primo livello soddisfi
l'allowlist (inclusi i safe bin). Le redirezioni restano non supportate.
La fiducia durevole `allow-always` non aggira questa regola: un comando concatenato richiede comunque che ogni
segmento di primo livello corrisponda.

`autoAllowSkills` è un percorso di comodità separato nelle approvazioni exec. Non è equivalente alle
voci allowlist manuali dei percorsi. Per una fiducia esplicita rigorosa, mantieni `autoAllowSkills` disabilitato.

Usa i due controlli per lavori diversi:

- `tools.exec.safeBins`: piccoli filtri di flusso solo stdin.
- `tools.exec.safeBinTrustedDirs`: directory attendibili extra esplicite per i percorsi eseguibili dei safe bin.
- `tools.exec.safeBinProfiles`: policy argv esplicita per safe bin personalizzati.
- allowlist: fiducia esplicita per i percorsi eseguibili.

Non trattare `safeBins` come un elenco consentiti generico e non aggiungere binari di interpreti/runtime (per esempio `python3`, `node`, `ruby`, `bash`). Se ne hai bisogno, usa voci esplicite nell'elenco consentiti e mantieni abilitate le richieste di approvazione.
`openclaw security audit` avvisa quando le voci `safeBins` di interpreti/runtime non hanno profili espliciti, e `openclaw doctor --fix` può creare una struttura di base per le voci custom `safeBinProfiles` mancanti.
`openclaw security audit` e `openclaw doctor` avvisano anche quando aggiungi esplicitamente di nuovo in `safeBins` binari con comportamento ampio come `jq`.
Se inserisci esplicitamente interpreti nell'elenco consentiti, abilita `tools.exec.strictInlineEval` in modo che le forme di valutazione del codice inline richiedano comunque una nuova approvazione.

Per i dettagli completi della policy e gli esempi, consulta [Approvazioni exec](/it/tools/exec-approvals-advanced#safe-bins-stdin-only) e [Safe bins rispetto a elenco consentiti](/it/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Esempi

In primo piano:

```json
{ "tool": "exec", "command": "ls -la" }
```

In secondo piano + sondaggio:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Il sondaggio serve per lo stato su richiesta, non per cicli di attesa. Se il risveglio
al completamento automatico è abilitato, il comando può risvegliare la sessione quando produce output o fallisce.

Inviare tasti (stile tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Invio (invia solo CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Incolla (tra parentesi per impostazione predefinita):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` è un sotto-strumento di `exec` per modifiche strutturate multi-file.
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
- La policy degli strumenti si applica comunque; `allow: ["write"]` consente implicitamente `apply_patch`.
- `deny: ["write"]` non nega `apply_patch`; nega esplicitamente `apply_patch` oppure usa `deny: ["group:fs"]` quando anche le scritture tramite patch devono essere bloccate.
- La configurazione si trova in `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` ha valore predefinito `true`; impostalo su `false` per disabilitare lo strumento per i modelli OpenAI.
- `tools.exec.applyPatch.workspaceOnly` ha valore predefinito `true` (limitato all'area di lavoro). Impostalo su `false` solo se vuoi intenzionalmente che `apply_patch` scriva/elimini fuori dalla directory dell'area di lavoro.

## Correlati

- [Approvazioni Exec](/it/tools/exec-approvals) — gate di approvazione per comandi shell
- [Sandboxing](/it/gateway/sandboxing) — esecuzione di comandi in ambienti sandbox
- [Processo in background](/it/gateway/background-process) — exec a lunga esecuzione e strumento process
- [Sicurezza](/it/gateway/security) — policy degli strumenti e accesso elevato
