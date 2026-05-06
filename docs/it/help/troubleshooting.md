---
read_when:
    - OpenClaw non funziona e hai bisogno del modo più rapido per risolvere il problema
    - Vuoi un flusso di triage prima di addentrarti in runbook approfonditi
summary: Hub di risoluzione dei problemi basato sui sintomi per OpenClaw
title: Risoluzione generale dei problemi
x-i18n:
    generated_at: "2026-05-06T08:54:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 624fa34cda3b440fa9cc636beb3fe6e3608a77a332933fa593097ebc556ac745
    source_path: help/troubleshooting.md
    workflow: 16
---

Se hai solo 2 minuti, usa questa pagina come punto di ingresso per il triage.

## Primi 60 secondi

Esegui questa sequenza esatta in ordine:

```bash
openclaw status
openclaw status --all
openclaw gateway probe
openclaw gateway status
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

Output corretto in una riga:

- `openclaw status` → mostra i canali configurati e nessun errore di autenticazione evidente.
- `openclaw status --all` → il report completo è presente e condivisibile.
- `openclaw gateway probe` → il target del gateway previsto è raggiungibile (`Reachable: yes`). `Capability: ...` indica quale livello di autenticazione il probe è riuscito a dimostrare, e `Read probe: limited - missing scope: operator.read` indica diagnostica degradata, non un errore di connessione.
- `openclaw gateway status` → `Runtime: running`, `Connectivity probe: ok` e una riga `Capability: ...` plausibile. Usa `--require-rpc` se ti serve anche la prova RPC con ambito di lettura.
- `openclaw doctor` → nessun errore bloccante di configurazione/servizio.
- `openclaw channels status --probe` → un Gateway raggiungibile restituisce lo stato di trasporto live per account più risultati di probe/audit come `works` o `audit ok`; se il Gateway non è raggiungibile, il comando ripiega su riepiloghi basati solo sulla configurazione.
- `openclaw logs --follow` → attività stabile, senza errori fatali ripetuti.

## 429 per contesto lungo Anthropic

Se vedi:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`,
vai a [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/it/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

## Backend locale compatibile con OpenAI funzionante direttamente ma non in OpenClaw

Se il tuo backend `/v1` locale o self-hosted risponde a piccoli probe diretti
`/v1/chat/completions` ma fallisce con `openclaw infer model run` o nei normali
turni dell’agente:

1. Se l’errore menziona `messages[].content` che si aspetta una stringa, imposta
   `models.providers.<provider>.models[].compat.requiresStringContent: true`.
2. Se il backend fallisce ancora solo nei turni agente di OpenClaw, imposta
   `models.providers.<provider>.models[].compat.supportsTools: false` e riprova.
3. Se le piccole chiamate dirette continuano a funzionare ma prompt OpenClaw più grandi mandano in crash il
   backend, considera il problema residuo come una limitazione del modello/server upstream e
   continua nel runbook approfondito:
   [/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail](/it/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail)

## Installazione del Plugin non riuscita per estensioni openclaw mancanti

Se l’installazione fallisce con `package.json missing openclaw.extensions`, il pacchetto Plugin
usa una forma obsoleta che OpenClaw non accetta più.

Correzione nel pacchetto Plugin:

1. Aggiungi `openclaw.extensions` a `package.json`.
2. Punta le voci ai file runtime compilati, di solito `./dist/index.js`.
3. Ripubblica il Plugin ed esegui di nuovo `openclaw plugins install <package>`.

Esempio:

```json
{
  "name": "@openclaw/my-plugin",
  "version": "1.2.3",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

Riferimento: [Architettura dei Plugin](/it/plugins/architecture)

## Plugin presente ma bloccato da proprietà sospetta

Se `openclaw doctor`, la configurazione iniziale o gli avvisi di avvio mostrano:

```text
blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)
plugin present but blocked
```

i file del Plugin appartengono a un utente Unix diverso dal processo che li carica. Non rimuovere la configurazione del Plugin. Correggi la proprietà dei file o esegui OpenClaw con
lo stesso utente proprietario della directory di stato.

Le installazioni Docker normalmente vengono eseguite come `node` (uid `1000`). Per la configurazione Docker
predefinita, ripara i bind mount dell’host:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
openclaw doctor --fix
```

Se esegui intenzionalmente OpenClaw come root, ripara invece la root dei Plugin gestiti
assegnandola a root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
openclaw doctor --fix
```

Documentazione più approfondita:

- [Proprietà dei percorsi Plugin](/it/tools/plugin#blocked-plugin-path-ownership)
- [Permessi Docker](/it/install/docker#permissions-and-eacces)

## Albero decisionale

```mermaid
flowchart TD
  A[OpenClaw is not working] --> B{What breaks first}
  B --> C[No replies]
  B --> D[Dashboard or Control UI will not connect]
  B --> E[Gateway will not start or service not running]
  B --> F[Channel connects but messages do not flow]
  B --> G[Cron or heartbeat did not fire or did not deliver]
  B --> H[Node is paired but camera canvas screen exec fails]
  B --> I[Browser tool fails]

  C --> C1[/No replies section/]
  D --> D1[/Control UI section/]
  E --> E1[/Gateway section/]
  F --> F1[/Channel flow section/]
  G --> G1[/Automation section/]
  H --> H1[/Node tools section/]
  I --> I1[/Browser section/]
```

<AccordionGroup>
  <Accordion title="No replies">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw channels status --probe
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    ```

    L’output corretto assomiglia a:

    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` o `admin-capable`
    - Il tuo canale mostra il trasporto connesso e, dove supportato, `works` o `audit ok` in `channels status --probe`
    - Il mittente risulta approvato, oppure la policy DM è aperta/allowlist

    Firme di log comuni:

    - `drop guild message (mention required` → il gating sulla menzione ha bloccato il messaggio in Discord.
    - `pairing request` → il mittente non è approvato ed è in attesa di approvazione di abbinamento DM.
    - `blocked` / `allowlist` nei log del canale → il mittente, la stanza o il gruppo è filtrato.

    Pagine approfondite:

    - [/gateway/troubleshooting#no-replies](/it/gateway/troubleshooting#no-replies)
    - [/channels/troubleshooting](/it/channels/troubleshooting)
    - [/channels/pairing](/it/channels/pairing)

  </Accordion>

  <Accordion title="Dashboard or Control UI will not connect">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    L’output corretto assomiglia a:

    - `Dashboard: http://...` viene mostrato in `openclaw gateway status`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` o `admin-capable`
    - Nessun loop di autenticazione nei log

    Firme di log comuni:

    - `device identity required` → il contesto HTTP/non sicuro non può completare l’autenticazione del dispositivo.
    - `origin not allowed` → l’`Origin` del browser non è consentito per il target Gateway della Control UI.
    - `AUTH_TOKEN_MISMATCH` con suggerimenti di retry (`canRetryWithDeviceToken=true`) → può avvenire automaticamente un retry con token dispositivo attendibile.
    - Quel retry con token in cache riusa l’insieme di ambiti memorizzato con il token del dispositivo abbinato. I chiamanti con `deviceToken` esplicito / `scopes` espliciti mantengono invece il loro insieme di ambiti richiesto.
    - Nel percorso asincrono della Control UI Tailscale Serve, i tentativi falliti per lo stesso
      `{scope, ip}` vengono serializzati prima che il limitatore registri l’errore, quindi un
      secondo retry errato concorrente può già mostrare `retry later`.
    - `too many failed authentication attempts (retry later)` da un’origine browser localhost → errori ripetuti dallo stesso `Origin` vengono temporaneamente bloccati; un’altra origine localhost usa un bucket separato.
    - `unauthorized` ripetuto dopo quel retry → token/password errati, modalità di autenticazione non corrispondente o token dispositivo abbinato obsoleto.
    - `gateway connect failed:` → l’interfaccia utente punta all’URL/porta sbagliati o a un Gateway non raggiungibile.

    Pagine approfondite:

    - [/gateway/troubleshooting#dashboard-control-ui-connectivity](/it/gateway/troubleshooting#dashboard-control-ui-connectivity)
    - [/web/control-ui](/it/web/control-ui)
    - [/gateway/authentication](/it/gateway/authentication)

  </Accordion>

  <Accordion title="Gateway will not start or service installed but not running">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    L’output corretto assomiglia a:

    - `Service: ... (loaded)`
    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` o `admin-capable`

    Firme di log comuni:

    - `Gateway start blocked: set gateway.mode=local` o `existing config is missing gateway.mode` → la modalità Gateway è remota, oppure il file di configurazione non contiene il contrassegno di modalità locale e deve essere riparato.
    - `refusing to bind gateway ... without auth` → bind non local loopback senza un percorso valido di autenticazione Gateway (token/password, oppure trusted-proxy dove configurato).
    - `another gateway instance is already listening` o `EADDRINUSE` → porta già occupata.

    Pagine approfondite:

    - [/gateway/troubleshooting#gateway-service-not-running](/it/gateway/troubleshooting#gateway-service-not-running)
    - [/gateway/background-process](/it/gateway/background-process)
    - [/gateway/configuration](/it/gateway/configuration)

  </Accordion>

  <Accordion title="Channel connects but messages do not flow">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    L’output corretto assomiglia a:

    - Il trasporto del canale è connesso.
    - I controlli di abbinamento/allowlist passano.
    - Le menzioni vengono rilevate dove richieste.

    Firme di log comuni:

    - `mention required` → il gating sulla menzione di gruppo ha bloccato l’elaborazione.
    - `pairing` / `pending` → il mittente DM non è ancora approvato.
    - `not_in_channel`, `missing_scope`, `Forbidden`, `401/403` → problema di token di permesso del canale.

    Pagine approfondite:

    - [/gateway/troubleshooting#channel-connected-messages-not-flowing](/it/gateway/troubleshooting#channel-connected-messages-not-flowing)
    - [/channels/troubleshooting](/it/channels/troubleshooting)

  </Accordion>

  <Accordion title="Cron or heartbeat did not fire or did not deliver">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw cron status
    openclaw cron list
    openclaw cron runs --id <jobId> --limit 20
    openclaw logs --follow
    ```

    L’output corretto assomiglia a:

    - `cron.status` mostra che è abilitato con un prossimo risveglio.
    - `cron runs` mostra voci recenti `ok`.
    - Heartbeat è abilitato e non è fuori dalle ore attive.

    Firme di log comuni:

    - `cron: scheduler disabled; jobs will not run automatically` → Cron è disabilitato.
    - `heartbeat skipped` con `reason=quiet-hours` → fuori dalle ore attive configurate.
    - `heartbeat skipped` con `reason=empty-heartbeat-file` → `HEARTBEAT.md` esiste ma contiene solo scaffolding vuoto/con sole intestazioni.
    - `heartbeat skipped` con `reason=no-tasks-due` → la modalità attività di `HEARTBEAT.md` è attiva ma nessuno degli intervalli delle attività è ancora scaduto.
    - `heartbeat skipped` con `reason=alerts-disabled` → tutta la visibilità Heartbeat è disabilitata (`showOk`, `showAlerts` e `useIndicator` sono tutti disattivati).
    - `requests-in-flight` → corsia principale occupata; il risveglio Heartbeat è stato posticipato.
    - `unknown accountId` → l’account target di consegna Heartbeat non esiste.

    Pagine approfondite:

    - [/gateway/troubleshooting#cron-and-heartbeat-delivery](/it/gateway/troubleshooting#cron-and-heartbeat-delivery)
    - [/automation/cron-jobs#troubleshooting](/it/automation/cron-jobs#troubleshooting)
    - [/gateway/heartbeat](/it/gateway/heartbeat)

  </Accordion>

  <Accordion title="Node is paired but tool fails camera canvas screen exec">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw nodes status
    openclaw nodes describe --node <idOrNameOrIp>
    openclaw logs --follow
    ```

    L’output corretto assomiglia a:

    - Node è elencato come connesso e abbinato per il ruolo `node`.
    - Esiste la capability per il comando che stai invocando.
    - Lo stato dei permessi è concesso per lo strumento.

    Firme di log comuni:

    - `NODE_BACKGROUND_UNAVAILABLE` → porta l'app Node in primo piano.
    - `*_PERMISSION_REQUIRED` → l'autorizzazione del sistema operativo è stata negata/manca.
    - `SYSTEM_RUN_DENIED: approval required` → l'approvazione exec è in sospeso.
    - `SYSTEM_RUN_DENIED: allowlist miss` → il comando non è nell'allowlist exec.

    Pagine di approfondimento:

    - [/gateway/troubleshooting#node-paired-tool-fails](/it/gateway/troubleshooting#node-paired-tool-fails)
    - [/nodes/troubleshooting](/it/nodes/troubleshooting)
    - [/tools/exec-approvals](/it/tools/exec-approvals)

  </Accordion>

  <Accordion title="Exec chiede improvvisamente l'approvazione">
    ```bash
    openclaw config get tools.exec.host
    openclaw config get tools.exec.security
    openclaw config get tools.exec.ask
    openclaw gateway restart
    ```

    Cosa è cambiato:

    - Se `tools.exec.host` non è impostato, il valore predefinito è `auto`.
    - `host=auto` si risolve in `sandbox` quando è attivo un runtime sandbox, altrimenti in `gateway`.
    - `host=auto` riguarda solo il routing; il comportamento "YOLO" senza prompt deriva da `security=full` più `ask=off` su Gateway/Node.
    - Su `gateway` e `node`, `tools.exec.security` non impostato usa come valore predefinito `full`.
    - `tools.exec.ask` non impostato usa come valore predefinito `off`.
    - Risultato: se vedi approvazioni, qualche criterio locale all'host o per sessione ha reso exec più restrittivo rispetto ai valori predefiniti correnti.

    Ripristina il comportamento predefinito corrente senza approvazione:

    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```

    Alternative più sicure:

    - Imposta solo `tools.exec.host=gateway` se vuoi soltanto un routing host stabile.
    - Usa `security=allowlist` con `ask=on-miss` se vuoi exec sull'host ma vuoi comunque una revisione per i mancati riscontri nell'allowlist.
    - Abilita la modalità sandbox se vuoi che `host=auto` si risolva di nuovo in `sandbox`.

    Firme di log comuni:

    - `Approval required.` → il comando è in attesa di `/approve ...`.
    - `SYSTEM_RUN_DENIED: approval required` → l'approvazione exec dell'host Node è in sospeso.
    - `exec host=sandbox requires a sandbox runtime for this session` → selezione sandbox implicita/esplicita, ma la modalità sandbox è disattivata.

    Pagine di approfondimento:

    - [/tools/exec](/it/tools/exec)
    - [/tools/exec-approvals](/it/tools/exec-approvals)
    - [/gateway/security#what-the-audit-checks-high-level](/it/gateway/security#what-the-audit-checks-high-level)

  </Accordion>

  <Accordion title="Lo strumento browser non funziona">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw browser status
    openclaw logs --follow
    openclaw doctor
    ```

    Un output corretto è simile a:

    - Lo stato del browser mostra `running: true` e un browser/profilo scelto.
    - `openclaw` si avvia, oppure `user` può vedere le schede locali di Chrome.

    Firme di log comuni:

    - `unknown command "browser"` o `unknown command 'browser'` → `plugins.allow` è impostato e non include `browser`.
    - `Failed to start Chrome CDP on port` → avvio del browser locale non riuscito.
    - `browser.executablePath not found` → il percorso del binario configurato è errato.
    - `browser.cdpUrl must be http(s) or ws(s)` → l'URL CDP configurato usa uno schema non supportato.
    - `browser.cdpUrl has invalid port` → l'URL CDP configurato ha una porta errata o fuori intervallo.
    - `No Chrome tabs found for profile="user"` → il profilo di collegamento Chrome MCP non ha schede locali di Chrome aperte.
    - `Remote CDP for profile "<name>" is not reachable` → l'endpoint CDP remoto configurato non è raggiungibile da questo host.
    - `Browser attachOnly is enabled ... not reachable` o `Browser attachOnly is enabled and CDP websocket ... is not reachable` → il profilo solo collegamento non ha una destinazione CDP attiva.
    - override obsoleti di viewport / modalità scura / locale / offline su profili solo collegamento o CDP remoti → esegui `openclaw browser stop --browser-profile <name>` per chiudere la sessione di controllo attiva e rilasciare lo stato di emulazione senza riavviare il Gateway.

    Pagine di approfondimento:

    - [/gateway/troubleshooting#browser-tool-fails](/it/gateway/troubleshooting#browser-tool-fails)
    - [/tools/browser#missing-browser-command-or-tool](/it/tools/browser#missing-browser-command-or-tool)
    - [/tools/browser-linux-troubleshooting](/it/tools/browser-linux-troubleshooting)
    - [/tools/browser-wsl2-windows-remote-cdp-troubleshooting](/it/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

  </Accordion>

</AccordionGroup>

## Correlati

- [FAQ](/it/help/faq) — domande frequenti
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting) — problemi specifici del Gateway
- [Doctor](/it/gateway/doctor) — controlli di integrità e riparazioni automatizzati
- [Risoluzione dei problemi dei canali](/it/channels/troubleshooting) — problemi di connettività dei canali
- [Risoluzione dei problemi di automazione](/it/automation/cron-jobs#troubleshooting) — problemi di Cron e Heartbeat
