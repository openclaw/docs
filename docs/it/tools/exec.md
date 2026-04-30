---
read_when:
    - Uso o modifica dello strumento exec
    - Debug del comportamento di stdin o TTY
summary: Uso dello strumento Exec, modalità stdin e supporto TTY
title: Strumento Exec
x-i18n:
    generated_at: "2026-04-30T09:15:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7949cfde9f141202a3bc36c2be72ecdf6d43305b5f16fb02835a69bcaa46067b
    source_path: tools/exec.md
    workflow: 16
---

Esegui comandi shell nell'area di lavoro. Supporta l'esecuzione in primo piano e in background tramite `process`.
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
Override dell'ambiente chiave/valore uniti all'ambiente ereditato.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Mette automaticamente il comando in background dopo questo ritardo (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Mette subito il comando in background invece di attendere `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Sostituisce il timeout di exec configurato per questa chiamata. Imposta `timeout: 0` solo quando il comando deve essere eseguito senza il timeout del processo exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Esegue in uno pseudo-terminale quando disponibile. Usalo per CLI che richiedono TTY, agenti di codifica e UI da terminale.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Dove eseguire. `auto` si risolve in `sandbox` quando è attivo un runtime sandbox e in `gateway` negli altri casi.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Modalità di applicazione per l'esecuzione `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Comportamento della richiesta di approvazione per l'esecuzione `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
ID/nome del Node quando `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Richiede la modalità elevata: esce dalla sandbox verso il percorso host configurato. `security=full` viene forzato solo quando elevated si risolve in `full`.
</ParamField>

Note:

- `host` ha come valore predefinito `auto`: sandbox quando il runtime sandbox è attivo per la sessione, altrimenti gateway.
- `host` accetta solo `auto`, `sandbox`, `gateway` o `node`. Non è un selettore di hostname; i valori simili a hostname vengono rifiutati prima dell'esecuzione del comando.
- `auto` è la strategia di instradamento predefinita, non un carattere jolly. `host=node` per singola chiamata è consentito da `auto`; `host=gateway` per singola chiamata è consentito solo quando non è attivo alcun runtime sandbox.
- Senza configurazione aggiuntiva, `host=auto` continua a "funzionare": nessuna sandbox significa che si risolve in `gateway`; una sandbox attiva significa che resta nella sandbox.
- `elevated` esce dalla sandbox verso il percorso host configurato: `gateway` per impostazione predefinita, oppure `node` quando `tools.exec.host=node` (o il valore predefinito della sessione è `host=node`). È disponibile solo quando l'accesso elevato è abilitato per la sessione/provider corrente.
- Le approvazioni `gateway`/`node` sono controllate da `~/.openclaw/exec-approvals.json`.
- `node` richiede un nodo associato (app companion o host node headless).
- Se sono disponibili più nodi, imposta `exec.node` o `tools.exec.node` per selezionarne uno.
- `exec host=node` è l'unico percorso di esecuzione shell per i nodi; il wrapper legacy `nodes.run` è stato rimosso.
- `timeout` si applica all'esecuzione in primo piano, in background, `yieldMs`, gateway, sandbox e node `system.run`. Se omesso, OpenClaw usa `tools.exec.timeoutSec`; `timeout: 0` esplicito disabilita il timeout del processo exec per quella chiamata.
- Sugli host non Windows, exec usa `SHELL` quando impostato; se `SHELL` è `fish`, preferisce `bash` (o `sh`)
  da `PATH` per evitare script incompatibili con fish, poi ripiega su `SHELL` se nessuno dei due esiste.
- Sugli host Windows, exec preferisce la scoperta di PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, poi PATH),
  poi ripiega su Windows PowerShell 5.1.
- L'esecuzione host (`gateway`/`node`) rifiuta `env.PATH` e gli override del loader (`LD_*`/`DYLD_*`) per
  prevenire dirottamenti di binari o codice iniettato.
- OpenClaw imposta `OPENCLAW_SHELL=exec` nell'ambiente del comando generato (incluse le esecuzioni PTY e sandbox) così le regole shell/profile possono rilevare il contesto dello strumento exec.
- `openclaw channels login` è bloccato da `exec` perché è un flusso interattivo di autenticazione del canale; eseguilo in un terminale sull'host gateway oppure usa lo strumento di login nativo del canale dalla chat quando esiste.
- Importante: la sandbox è **disattivata per impostazione predefinita**. Se la sandbox è disattivata, `host=auto`
  implicito si risolve in `gateway`. `host=sandbox` esplicito invece fallisce in modo chiuso, invece di
  eseguire silenziosamente sull'host gateway. Abilita la sandbox o usa `host=gateway` con approvazioni.
- I controlli preliminari degli script (per errori comuni di sintassi shell Python/Node) ispezionano solo i file all'interno del
  limite effettivo di `workdir`. Se un percorso di script si risolve fuori da `workdir`, il controllo preliminare viene saltato per
  quel file.
- Per lavori di lunga durata che iniziano ora, avviali una sola volta e affidati al risveglio automatico al
  completamento quando è abilitato e il comando emette output o fallisce.
  Usa `process` per log, stato, input o interventi; non emulare
  la pianificazione con cicli di sleep, cicli di timeout o polling ripetuto.
- Per lavori che devono avvenire più tardi o secondo una pianificazione, usa Cron invece di
  pattern sleep/delay di `exec`.

## Configurazione

- `tools.exec.notifyOnExit` (predefinito: true): quando true, le sessioni exec messe in background accodano un evento di sistema e richiedono un Heartbeat all'uscita.
- `tools.exec.approvalRunningNoticeMs` (predefinito: 10000): emette un singolo avviso di “in esecuzione” quando un exec soggetto ad approvazione dura più di questo valore (0 disabilita).
- `tools.exec.timeoutSec` (predefinito: 1800): timeout exec predefinito per comando in secondi. `timeout` per singola chiamata lo sostituisce; `timeout: 0` per singola chiamata disabilita il timeout del processo exec.
- `tools.exec.host` (predefinito: `auto`; si risolve in `sandbox` quando il runtime sandbox è attivo, in `gateway` negli altri casi)
- `tools.exec.security` (predefinito: `deny` per sandbox, `full` per gateway + node quando non impostato)
- `tools.exec.ask` (predefinito: `off`)
- L'exec host senza approvazione è il valore predefinito per gateway + node. Se vuoi il comportamento con approvazioni/allowlist, rendi più restrittivi sia `tools.exec.*` sia `~/.openclaw/exec-approvals.json` dell'host; vedi [Approvazioni exec](/it/tools/exec-approvals#no-approval-yolo-mode).
- YOLO deriva dai valori predefiniti della policy host (`security=full`, `ask=off`), non da `host=auto`. Se vuoi forzare l'instradamento gateway o node, imposta `tools.exec.host` o usa `/exec host=...`.
- In modalità `security=full` più `ask=off`, host exec segue direttamente la policy configurata; non esiste alcun ulteriore prefiltro euristico di offuscamento dei comandi né livello di rifiuto dei controlli preliminari degli script.
- `tools.exec.node` (predefinito: non impostato)
- `tools.exec.strictInlineEval` (predefinito: false): quando true, le forme eval inline degli interpreti come `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` e `osascript -e` richiedono sempre approvazione esplicita. `allow-always` può ancora mantenere invocazioni benigne di interpreti/script, ma le forme eval inline continuano a richiedere conferma ogni volta.
- `tools.exec.pathPrepend`: elenco di directory da anteporre a `PATH` per le esecuzioni exec (solo gateway + sandbox).
- `tools.exec.safeBins`: binari sicuri solo stdin che possono essere eseguiti senza voci esplicite nell'allowlist. Per i dettagli di comportamento, vedi [Binari sicuri](/it/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: directory esplicite aggiuntive considerate attendibili per i controlli sui percorsi `safeBins`. Le voci `PATH` non vengono mai considerate automaticamente attendibili. I valori predefiniti integrati sono `/bin` e `/usr/bin`.
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

- `host=gateway`: unisce il `PATH` della shell di login nell'ambiente exec. Gli override di `env.PATH` sono
  rifiutati per l'esecuzione host. Il daemon stesso continua a essere eseguito con un `PATH` minimo:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: esegue `sh -lc` (shell di login) all'interno del container, quindi `/etc/profile` può reimpostare `PATH`.
  OpenClaw antepone `env.PATH` dopo il sourcing del profilo tramite una variabile env interna (nessuna interpolazione shell);
  `tools.exec.pathPrepend` si applica anche qui.
- `host=node`: al node vengono inviati solo gli override env non bloccati che passi. Gli override di `env.PATH` sono
  rifiutati per l'esecuzione host e ignorati dagli host node. Se hai bisogno di voci PATH aggiuntive su un node,
  configura l'ambiente del servizio host node (systemd/launchd) o installa gli strumenti in posizioni standard.

Associazione node per agente (usa l'indice dell'elenco agenti nella configurazione):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

UI di controllo: la scheda Nodes include un piccolo pannello “Associazione node exec” per le stesse impostazioni.

## Override di sessione (`/exec`)

Usa `/exec` per impostare valori predefiniti **per sessione** per `host`, `security`, `ask` e `node`.
Invia `/exec` senza argomenti per mostrare i valori correnti.

Esempio:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modello di autorizzazione

`/exec` viene rispettato solo per **mittenti autorizzati** (allowlist/associazione dei canali più `commands.useAccessGroups`).
Aggiorna **solo lo stato della sessione** e non scrive la configurazione. Per disabilitare exec in modo rigido, negalo tramite la policy degli strumenti
(`tools.deny: ["exec"]` o per agente). Le approvazioni host continuano ad applicarsi a meno che tu non imposti esplicitamente
`security=full` e `ask=off`.

## Approvazioni exec (app companion / host node)

Gli agenti sandbox possono richiedere approvazione per richiesta prima che `exec` venga eseguito sul gateway o sull'host node.
Vedi [Approvazioni exec](/it/tools/exec-approvals) per la policy, l'allowlist e il flusso UI.

Quando sono richieste approvazioni, lo strumento exec restituisce immediatamente
`status: "approval-pending"` e un ID di approvazione. Una volta approvato (o negato / scaduto),
il Gateway emette eventi di sistema (`Exec finished` / `Exec denied`). Se il comando è ancora
in esecuzione dopo `tools.exec.approvalRunningNoticeMs`, viene emesso un singolo avviso `Exec running`.
Sui canali con schede/pulsanti di approvazione nativi, l'agente dovrebbe affidarsi prima a quella
UI nativa e includere un comando manuale `/approve` solo quando il risultato dello strumento
dice esplicitamente che le approvazioni via chat non sono disponibili o che l'approvazione manuale è
l'unico percorso.

## Allowlist + binari sicuri

L'applicazione dell'allowlist manuale confronta glob di percorsi binari risolti e glob di nomi comando
semplici. I nomi semplici corrispondono solo ai comandi invocati tramite PATH, quindi `rg` può corrispondere a
`/opt/homebrew/bin/rg` quando il comando è `rg`, ma non a `./rg` o `/tmp/rg`.
Quando `security=allowlist`, i comandi shell sono consentiti automaticamente solo se ogni segmento della pipeline
è in allowlist o è un safe bin. Concatenazioni (`;`, `&&`, `||`) e redirezioni
sono rifiutate in modalità allowlist a meno che ogni segmento di primo livello soddisfi la
allowlist (inclusi i safe bin). Le redirezioni restano non supportate.
La fiducia durevole `allow-always` non aggira questa regola: un comando concatenato richiede comunque che ogni
segmento di primo livello corrisponda.

`autoAllowSkills` è un percorso di comodità separato nelle approvazioni exec. Non è lo stesso delle
voci manuali dell'allowlist dei percorsi. Per una fiducia esplicita rigorosa, mantieni `autoAllowSkills` disabilitato.

Usa i due controlli per compiti diversi:

- `tools.exec.safeBins`: piccoli filtri di stream solo stdin.
- `tools.exec.safeBinTrustedDirs`: directory attendibili extra esplicite per percorsi eseguibili safe-bin.
- `tools.exec.safeBinProfiles`: policy argv esplicita per safe bin personalizzati.
- allowlist: fiducia esplicita per percorsi eseguibili.

Non trattare `safeBins` come un elenco consentito generico e non aggiungere binari di interpreti/runtime (per esempio `python3`, `node`, `ruby`, `bash`). Se ne hai bisogno, usa voci esplicite dell'elenco consentito e mantieni abilitate le richieste di approvazione.
`openclaw security audit` avvisa quando le voci `safeBins` di interpreti/runtime non hanno profili espliciti, e `openclaw doctor --fix` può creare lo scheletro delle voci `safeBinProfiles` personalizzate mancanti.
`openclaw security audit` e `openclaw doctor` avvisano anche quando aggiungi esplicitamente di nuovo in `safeBins` binari dal comportamento ampio, come `jq`.
Se inserisci esplicitamente gli interpreti nell'elenco consentito, abilita `tools.exec.strictInlineEval` in modo che le forme di valutazione di codice inline richiedano comunque una nuova approvazione.

Per dettagli completi sulla policy ed esempi, consulta [Approvazioni Exec](/it/tools/exec-approvals-advanced#safe-bins-stdin-only) e [Bin sicuri rispetto all'elenco consentito](/it/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Esempi

In primo piano:

```json
{ "tool": "exec", "command": "ls -la" }
```

Background + polling:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Il polling serve per lo stato su richiesta, non per cicli di attesa. Se il risveglio automatico al completamento
è abilitato, il comando può riattivare la sessione quando emette output o fallisce.

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

Incolla (con parentesi per impostazione predefinita):

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
- La policy degli strumenti resta applicata; `allow: ["write"]` consente implicitamente `apply_patch`.
- La configurazione si trova sotto `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` ha valore predefinito `true`; impostalo su `false` per disabilitare lo strumento per i modelli OpenAI.
- `tools.exec.applyPatch.workspaceOnly` ha valore predefinito `true` (limitato al workspace). Impostalo su `false` solo se intendi volutamente permettere a `apply_patch` di scrivere/eliminare fuori dalla directory del workspace.

## Correlati

- [Approvazioni Exec](/it/tools/exec-approvals) — gate di approvazione per comandi shell
- [Sandboxing](/it/gateway/sandboxing) — esecuzione di comandi in ambienti sandbox
- [Processo in background](/it/gateway/background-process) — exec a lunga esecuzione e strumento di processo
- [Sicurezza](/it/gateway/security) — policy degli strumenti e accesso elevato
