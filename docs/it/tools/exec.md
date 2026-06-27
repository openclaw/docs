---
read_when:
    - Uso o modifica dello strumento exec
    - Debug del comportamento stdin o TTY
summary: Utilizzo dello strumento exec, modalità stdin e supporto TTY
title: Strumento exec
x-i18n:
    generated_at: "2026-06-27T18:20:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2831d9e66b25ce251f90e59a41b25234e22106d865466e61b878e3999e849dc
    source_path: tools/exec.md
    workflow: 16
---

Esegui comandi shell nell'area di lavoro. `exec` è una superficie shell mutante: i comandi possono creare, modificare o eliminare file ovunque l'host selezionato o il filesystem sandbox lo permetta. Disabilitare strumenti filesystem di OpenClaw come `write`, `edit` o `apply_patch` non rende `exec` di sola lettura.

Supporta l'esecuzione in primo piano + in background tramite `process`. Se `process` non è consentito, `exec` viene eseguito in modo sincrono e ignora `yieldMs`/`background`.
Le sessioni in background sono nell'ambito del singolo agent; `process` vede solo le sessioni dello stesso agent.

## Parametri

<ParamField path="command" type="string" required>
Comando shell da eseguire.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Directory di lavoro per il comando.
</ParamField>

<ParamField path="env" type="object">
Sostituzioni di ambiente chiave/valore unite sopra l'ambiente ereditato.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Manda automaticamente il comando in background dopo questo ritardo (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Manda il comando in background immediatamente invece di attendere `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Sovrascrive il timeout exec configurato per questa chiamata. Imposta `timeout: 0` solo quando il comando deve essere eseguito senza il timeout del processo exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Esegui in uno pseudo-terminale quando disponibile. Usalo per CLI solo TTY, coding agent e UI terminali.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Dove eseguire. `auto` si risolve in `sandbox` quando un runtime sandbox è attivo e in `gateway` altrimenti.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Ignorato per le normali chiamate agli strumenti. La sicurezza `gateway` / `node` è controllata da
`tools.exec.security` e dal file delle approvazioni dell'host; la modalità elevata può
forzare `security=full` solo quando l'operatore concede esplicitamente l'accesso elevato.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
La modalità di richiesta di base proviene da `tools.exec.ask` e dalle approvazioni dell'host.
Per le chiamate del modello originate da canale, `ask` per chiamata viene ignorato quando
la richiesta effettiva dell'host è `off`; altrimenti può solo irrigidire verso una modalità
più restrittiva. I chiamanti interni/API attendibili che costruiscono strumenti exec con un
valore `ask` esplicito restano invariati.
</ParamField>

<ParamField path="node" type="string">
ID/nome del Node quando `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Richiede la modalità elevata — esce dalla sandbox verso il percorso host configurato. `security=full` viene forzato solo quando elevated si risolve in `full`.
</ParamField>

Note:

- `host` ha come valore predefinito `auto`: sandbox quando il runtime sandbox è attivo per la sessione, altrimenti gateway.
- `host` accetta solo `auto`, `sandbox`, `gateway` o `node`. Non è un selettore di hostname; i valori simili a hostname vengono rifiutati prima dell'esecuzione del comando.
- `auto` è la strategia di instradamento predefinita, non un carattere jolly. `host=node` per chiamata è consentito da `auto`; `host=gateway` per chiamata è consentito solo quando non è attivo alcun runtime sandbox.
- `tools.exec.mode` è la manopola di policy normalizzata. I valori sono `deny`, `allowlist`, `ask`, `auto` e `full`. `auto` esegue direttamente le corrispondenze deterministiche allowlist/safe-bin e instrada ogni caso restante di approvazione exec attraverso l'auto reviewer nativo di OpenClaw prima di chiedere a un essere umano. `ask` / `ask=always` continua a chiedere a un essere umano ogni volta.
- Senza configurazione aggiuntiva, `host=auto` continua a "funzionare e basta": nessuna sandbox significa che si risolve in `gateway`; una sandbox attiva significa che resta nella sandbox.
- `elevated` esce dalla sandbox verso il percorso host configurato: `gateway` per impostazione predefinita, oppure `node` quando `tools.exec.host=node` (o il valore predefinito della sessione è `host=node`). È disponibile solo quando l'accesso elevato è abilitato per la sessione/il provider corrente.
- Le approvazioni `gateway`/`node` sono controllate dal file delle approvazioni dell'host.
- `node` richiede un node associato (app companion o host node headless).
- Se sono disponibili più node, imposta `exec.node` o `tools.exec.node` per selezionarne uno.
- `exec host=node` è l'unico percorso di esecuzione shell per i node; il wrapper legacy `nodes.run` è stato rimosso.
- `timeout` si applica all'esecuzione in primo piano, in background, `yieldMs`, gateway, sandbox e node `system.run`. Se omesso, OpenClaw usa `tools.exec.timeoutSec`; `timeout: 0` esplicito disabilita il timeout del processo exec per quella chiamata.
- Sugli host non Windows, exec usa `SHELL` quando impostato; se `SHELL` è `fish`, preferisce `bash` (o `sh`)
  da `PATH` per evitare script incompatibili con fish, poi ripiega su `SHELL` se nessuno dei due esiste.
- Sugli host Windows, exec preferisce la discovery di PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, poi PATH),
  poi ripiega su Windows PowerShell 5.1.
- Sugli host gateway non Windows, i comandi exec bash e zsh usano uno snapshot di avvio. OpenClaw acquisisce
  alias/funzioni sorgentabili e un piccolo insieme sicuro di ambiente dai file di avvio della shell in
  `$OPENCLAW_STATE_DIR/cache/shell-snapshots/`, poi carica quello snapshot prima di ogni comando exec.
  Le variabili che sembrano segreti sono escluse; sandbox e node exec non usano questo snapshot. Imposta
  `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` nell'ambiente del processo Gateway per disabilitare questo percorso snapshot.
- L'esecuzione host (`gateway`/`node`) rifiuta `env.PATH` e le sostituzioni del loader (`LD_*`/`DYLD_*`) per
  impedire dirottamenti di binari o codice iniettato.
- OpenClaw imposta `OPENCLAW_SHELL=exec` nell'ambiente del comando avviato (incluse l'esecuzione PTY e sandbox) così le regole shell/profile possono rilevare il contesto dello strumento exec.
- Per le esecuzioni originate da canale, OpenClaw espone anche un payload JSON ristretto con identità mittente/chat in
  `OPENCLAW_CHANNEL_CONTEXT` quando il canale ha fornito quegli ID.
- `openclaw channels login` è bloccato da `exec` perché è un flusso interattivo di autenticazione canale; eseguilo in un terminale sull'host gateway, oppure usa lo strumento di login nativo del canale dalla chat quando esiste.
- Importante: il sandboxing è **disattivato per impostazione predefinita**. Se il sandboxing è disattivato, `host=auto`
  implicito si risolve in `gateway`. `host=sandbox` esplicito fallisce comunque in modo chiuso invece di
  essere eseguito silenziosamente sull'host gateway. Abilita il sandboxing o usa `host=gateway` con approvazioni.
- I controlli preflight degli script (per comuni errori di sintassi shell Python/Node) ispezionano solo i file dentro il
  confine effettivo di `workdir`. Se un percorso script si risolve fuori da `workdir`, il preflight viene saltato per
  quel file.
- Per lavoro a lunga durata che parte ora, avvialo una sola volta e affidati al risveglio automatico
  al completamento quando è abilitato e il comando emette output o fallisce.
  Usa `process` per log, stato, input o intervento; non emulare
  la schedulazione con cicli sleep, cicli timeout o polling ripetuto.
- Per lavoro che deve avvenire più tardi o secondo una pianificazione, usa cron invece di
  pattern sleep/delay con `exec`.

## Configurazione

- `tools.exec.notifyOnExit` (predefinito: true): quando true, le sessioni exec mandate in background accodano un evento di sistema e richiedono un Heartbeat all'uscita.
- `tools.exec.approvalRunningNoticeMs` (predefinito: 10000): emette un singolo avviso "in esecuzione" quando un exec soggetto ad approvazione resta in esecuzione più a lungo di questo valore (0 disabilita).
- `tools.exec.timeoutSec` (predefinito: 1800): timeout exec predefinito per comando in secondi. `timeout` per chiamata lo sovrascrive; `timeout: 0` per chiamata disabilita il timeout del processo exec.
- `tools.exec.host` (predefinito: `auto`; si risolve in `sandbox` quando il runtime sandbox è attivo, `gateway` altrimenti)
- `tools.exec.security` (predefinito: `deny` per sandbox, `full` per gateway + node quando non impostato)
- `tools.exec.ask` (predefinito: `off`)
- L'exec host senza approvazione è il valore predefinito per gateway + node. Se vuoi comportamento con approvazioni/allowlist, irrigidisci sia `tools.exec.*` sia il file delle approvazioni dell'host; vedi [Approvazioni exec](/it/tools/exec-approvals#yolo-mode-no-approval).
- YOLO deriva dai valori predefiniti della policy dell'host (`security=full`, `ask=off`), non da `host=auto`. Se vuoi forzare l'instradamento gateway o node, imposta `tools.exec.host` o usa `/exec host=...`.
- In modalità `security=full` più `ask=off`, l'exec host segue direttamente la policy configurata; non c'è un ulteriore livello euristico di prefiltro per offuscamento del comando o rifiuto preflight degli script.
- `tools.exec.node` (predefinito: non impostato)
- `tools.exec.strictInlineEval` (predefinito: false): quando true, le forme eval inline degli interpreti come `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` e `osascript -e` richiedono reviewer o approvazione esplicita. In `mode=auto`, il normale percorso di approvazione exec può consentire all'auto reviewer nativo di permettere un comando una tantum chiaramente a basso rischio; le chiamate dirette `system.run` su host node richiedono comunque un'approvazione esplicita perché non possono consegnare il comando a un percorso di approvazione umano. Se il reviewer lo chiede, la richiesta va a un essere umano. `allow-always` può comunque rendere persistenti invocazioni benigne di interpreti/script, ma le forme inline-eval non diventano regole allow durevoli.
- `tools.exec.commandHighlighting` (predefinito: false): quando true, i prompt di approvazione possono evidenziare nel testo del comando gli intervalli di comando derivati dal parser. Impostalo a `true` globalmente o per agent per abilitare l'evidenziazione del testo del comando senza cambiare la policy di approvazione exec.
- `tools.exec.pathPrepend`: elenco di directory da anteporre a `PATH` per le esecuzioni exec (solo gateway + sandbox).
- `tools.exec.safeBins`: binari sicuri solo stdin che possono essere eseguiti senza voci allowlist esplicite. Per i dettagli sul comportamento, vedi [Binari sicuri](/it/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: directory esplicite aggiuntive considerate attendibili per i controlli di percorso `safeBins`. Le voci `PATH` non sono mai considerate attendibili automaticamente. I valori predefiniti integrati sono `/bin` e `/usr/bin`.
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

- `host=gateway`: unisce il `PATH` della tua login-shell nell'ambiente exec. Le sostituzioni `env.PATH` sono
  rifiutate per l'esecuzione host. Il daemon stesso continua a essere eseguito con un `PATH` minimo:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
    - Per impedire alla configurazione shell dell'utente (come `~/.zshenv` o `/etc/zshenv`) di sovrascrivere percorsi prioritari durante l'avvio, le voci `tools.exec.pathPrepend` vengono anteposte in modo sicuro al `PATH` finale dentro il comando shell subito prima dell'esecuzione.
- `host=sandbox`: esegue `sh -lc` (login shell) dentro il container, quindi `/etc/profile` può reimpostare `PATH`.
  OpenClaw antepone `env.PATH` dopo il sourcing del profilo tramite una variabile env interna (senza interpolazione shell);
  `tools.exec.pathPrepend` si applica anche qui.
- `host=node`: solo le sostituzioni env non bloccate che passi vengono inviate al node. Le sostituzioni `env.PATH` sono
  rifiutate per l'esecuzione host e ignorate dagli host node. Se ti servono voci PATH aggiuntive su un node,
  configura l'ambiente del servizio host node (systemd/launchd) o installa gli strumenti in posizioni standard.

Binding node per agent (usa l'indice dell'elenco agent nella configurazione):

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

UI di controllo: la scheda Nodes include un piccolo pannello "Binding node exec" per le stesse impostazioni.

## Sostituzioni di sessione (`/exec`)

Usa `/exec` per impostare i valori predefiniti **per sessione** per `host`, `security`, `ask` e `node`.
Invia `/exec` senza argomenti per mostrare i valori correnti.

Esempio:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modello di autorizzazione

`/exec` viene rispettato solo per **mittenti autorizzati** (allowlist/associazione del canale più `commands.useAccessGroups`).
Aggiorna **solo lo stato della sessione** e non scrive la configurazione. I mittenti autorizzati dei canali esterni possono
impostare questi valori predefiniti di sessione. I client interni Gateway/webchat necessitano di `operator.admin` per renderli persistenti.
Per disabilitare forzatamente exec, negalo tramite la policy degli strumenti (`tools.deny: ["exec"]` o per agente). Le approvazioni dell'host
si applicano comunque, a meno che tu non imposti esplicitamente `security=full` e `ask=off`.

## Approvazioni exec (app companion / host Node)

Gli agenti in sandbox possono richiedere un'approvazione per ogni richiesta prima che `exec` venga eseguito sul Gateway o sull'host Node.
Consulta [Approvazioni exec](/it/tools/exec-approvals) per la policy, l'allowlist e il flusso UI.

Quando le approvazioni sono richieste, lo strumento exec restituisce immediatamente
`status: "approval-pending"` e un id di approvazione. Dopo l'approvazione (o il rifiuto / timeout),
il Gateway emette eventi di sistema di avanzamento e completamento del comando solo per le esecuzioni approvate
(`Exec running` / `Exec finished`). Le approvazioni rifiutate o scadute sono terminali e non
riattivano la sessione dell'agente con un evento di sistema di rifiuto.
Sui canali con schede/pulsanti di approvazione nativi, l'agente dovrebbe fare affidamento prima su quella
UI nativa e includere un comando manuale `/approve` solo quando il risultato dello strumento
dice esplicitamente che le approvazioni via chat non sono disponibili o che l'approvazione manuale è
l'unico percorso.

## Allowlist + bin sicuri

L'applicazione manuale dell'allowlist confronta i glob dei percorsi binari risolti e i glob dei
nomi comando semplici. I nomi semplici corrispondono solo ai comandi invocati tramite PATH, quindi `rg` può corrispondere a
`/opt/homebrew/bin/rg` quando il comando è `rg`, ma non a `./rg` o `/tmp/rg`.
Quando `security=allowlist`, i comandi shell sono consentiti automaticamente solo se ogni segmento della pipeline
è incluso nell'allowlist o è un bin sicuro. Il chaining (`;`, `&&`, `||`) e i reindirizzamenti
vengono rifiutati in modalità allowlist a meno che ogni segmento di primo livello soddisfi
l'allowlist (inclusi i bin sicuri). I reindirizzamenti restano non supportati.
La fiducia duratura `allow-always` non aggira questa regola: un comando concatenato richiede comunque che ogni
segmento di primo livello corrisponda.

`autoAllowSkills` è un percorso di comodità separato nelle approvazioni exec. Non equivale alle
voci manuali dell'allowlist dei percorsi. Per una fiducia esplicita e rigorosa, mantieni `autoAllowSkills` disabilitato.

Usa i due controlli per compiti diversi:

- `tools.exec.safeBins`: piccoli filtri di stream solo stdin.
- `tools.exec.safeBinTrustedDirs`: directory fidate aggiuntive esplicite per i percorsi degli eseguibili dei bin sicuri.
- `tools.exec.safeBinProfiles`: policy argv esplicita per bin sicuri personalizzati.
- allowlist: fiducia esplicita per i percorsi degli eseguibili.

Non trattare `safeBins` come un'allowlist generica e non aggiungere binari di interpreti/runtime (per esempio `python3`, `node`, `ruby`, `bash`). Se ne hai bisogno, usa voci di allowlist esplicite e mantieni abilitate le richieste di approvazione.
`openclaw security audit` avvisa quando mancano profili espliciti per le voci `safeBins` di interpreti/runtime, e `openclaw doctor --fix` può creare lo scaffold delle voci `safeBinProfiles` personalizzate mancanti.
`openclaw security audit` e `openclaw doctor` avvisano anche quando aggiungi esplicitamente di nuovo in `safeBins` bin a comportamento ampio come `jq`.
Se includi esplicitamente interpreti nell'allowlist, abilita `tools.exec.strictInlineEval` affinché le forme di valutazione di codice inline richiedano comunque revisore o approvazione esplicita.

Per i dettagli completi della policy e gli esempi, consulta [Approvazioni exec](/it/tools/exec-approvals-advanced#safe-bins-stdin-only) e [Bin sicuri rispetto ad allowlist](/it/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

Il polling serve per lo stato su richiesta, non per cicli di attesa. Se la riattivazione automatica al completamento
è abilitata, il comando può riattivare la sessione quando emette output o fallisce.

Inviare tasti (stile tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Submit (invia solo CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Incolla (bracketed per impostazione predefinita):

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

- Disponibile solo per modelli OpenAI/OpenAI Codex.
- La policy degli strumenti si applica comunque; `allow: ["write"]` consente implicitamente `apply_patch`.
- `deny: ["write"]` non nega `apply_patch`; nega esplicitamente `apply_patch` oppure usa `deny: ["group:fs"]` quando anche le scritture tramite patch devono essere bloccate.
- La configurazione si trova sotto `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` ha valore predefinito `true`; impostalo su `false` per disabilitare lo strumento per i modelli OpenAI.
- `tools.exec.applyPatch.workspaceOnly` ha valore predefinito `true` (contenuto nell'area di lavoro). Impostalo su `false` solo se vuoi intenzionalmente che `apply_patch` scriva/elimini fuori dalla directory dell'area di lavoro.

## Correlati

- [Approvazioni exec](/it/tools/exec-approvals) — gate di approvazione per comandi shell
- [Sandboxing](/it/gateway/sandboxing) — esecuzione di comandi in ambienti in sandbox
- [Processo in background](/it/gateway/background-process) — exec a lunga esecuzione e strumento process
- [Sicurezza](/it/gateway/security) — policy degli strumenti e accesso elevato
