---
read_when:
    - L’hub di risoluzione dei problemi ti ha indirizzato qui per una diagnosi più approfondita
    - Servono sezioni di runbook stabili basate sui sintomi, con comandi esatti
sidebarTitle: Troubleshooting
summary: Runbook approfondito per la risoluzione dei problemi di gateway, canali, automazione, nodi e browser
title: Risoluzione dei problemi
x-i18n:
    generated_at: "2026-06-27T17:36:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ce8e8aed5c3e00be5b093875222962c22883472802e164534dae32adc5365c5
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Questa pagina è il runbook approfondito. Inizia da [/help/troubleshooting](/it/help/troubleshooting) se vuoi prima il flusso di triage rapido.

## Sequenza di comandi

Esegui prima questi, in questo ordine:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Segnali attesi di stato corretto:

- `openclaw gateway status` mostra `Runtime: running`, `Connectivity probe: ok` e una riga `Capability: ...`.
- `openclaw doctor` non segnala problemi bloccanti di configurazione/servizio.
- `openclaw channels status --probe` mostra lo stato live del trasporto per account e, dove supportato, risultati di probe/audit come `works` o `audit ok`.

## Dopo un aggiornamento

Usalo quando un aggiornamento termina ma il Gateway è inattivo, i canali sono vuoti oppure
le chiamate al modello iniziano a fallire con 401.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

Cerca:

- `Update restart` in `openclaw status` / `openclaw status --all`. Gli handoff in sospeso o
  non riusciti includono il comando successivo da eseguire.
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`
  sotto Channels. Significa che la configurazione del canale esiste ancora, ma la
  registrazione del plugin è fallita prima che il canale potesse caricarsi.
- 401 del provider dopo la riautenticazione. `openclaw doctor --fix` controlla la presenza di shadow
  OAuth obsolete per agente e rimuove le vecchie copie in modo che tutti gli agenti risolvano
  il profilo condiviso corrente.

## Installazioni split-brain e protezione per configurazioni più recenti

Usalo quando un servizio gateway si arresta inaspettatamente dopo un aggiornamento, oppure i log mostrano che un binario `openclaw` è più vecchio della versione che ha scritto per ultima `openclaw.json`.

OpenClaw marca le scritture di configurazione con `meta.lastTouchedVersion`. I comandi di sola lettura possono ancora ispezionare una configurazione scritta da un OpenClaw più recente, ma le mutazioni di processo e servizio rifiutano di continuare da un binario più vecchio. Le azioni bloccate includono avvio, arresto, riavvio e disinstallazione del servizio gateway, reinstallazione forzata del servizio, avvio del gateway in modalità servizio e pulizia della porta con `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Fix PATH">
    Correggi `PATH` in modo che `openclaw` risolva all'installazione più recente, quindi riesegui l'azione.
  </Step>
  <Step title="Reinstall the gateway service">
    Reinstalla il servizio gateway previsto dall'installazione più recente:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    Rimuovi il pacchetto di sistema obsoleto o le vecchie voci wrapper che puntano ancora a un vecchio binario `openclaw`.
  </Step>
</Steps>

<Warning>
Solo per downgrade intenzionale o ripristino di emergenza, imposta `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` per il singolo comando. Lascialo non impostato per il funzionamento normale.
</Warning>

## Mancata corrispondenza del protocollo dopo il rollback

Usalo quando i log continuano a stampare `protocol mismatch` dopo il downgrade o il rollback di OpenClaw. Significa che è in esecuzione un Gateway più vecchio, ma un processo client locale più recente sta ancora tentando di riconnettersi con un intervallo di protocollo che il Gateway più vecchio non può parlare.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

Cerca:

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` nei log del Gateway.
- `Established clients:` in `openclaw gateway status --deep` oppure `Gateway clients` in `openclaw doctor --deep`. Elenca i client TCP attivi connessi alla porta del Gateway, inclusi PID e righe di comando quando il sistema operativo lo consente.
- Un processo client la cui riga di comando punta all'installazione o al wrapper OpenClaw più recente da cui hai eseguito il rollback.

Correzione:

1. Arresta o riavvia il processo client OpenClaw obsoleto mostrato da `gateway status --deep`.
2. Riavvia le app o i wrapper che incorporano OpenClaw, come dashboard locali, editor, helper di app-server o shell `openclaw logs --follow` a lunga esecuzione.
3. Riesegui `openclaw gateway status --deep` oppure `openclaw doctor --deep` e conferma che il PID del client obsoleto non sia più presente.

Non fare in modo che un Gateway più vecchio accetti un protocollo più recente incompatibile. Gli incrementi di protocollo proteggono il contratto wire; il ripristino da rollback è un problema di pulizia di processi/versioni.

## Symlink Skill ignorato come evasione del percorso

Usalo quando i log includono:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw tratta ogni radice skill come un confine di contenimento. Un symlink sotto
`~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` o
`~/.openclaw/skills` viene ignorato quando la sua destinazione reale si risolve fuori da quella radice
a meno che la destinazione non sia esplicitamente attendibile.

Ispeziona il link:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Se la destinazione è intenzionale, configura sia la radice skill diretta sia la
destinazione symlink consentita:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

Poi avvia una nuova sessione o attendi che il watcher delle skills si aggiorni. Riavvia il
gateway se il processo in esecuzione precede la modifica della configurazione.

Non usare destinazioni ampie come `~`, `/` o un'intera cartella di progetto sincronizzata.
Mantieni `allowSymlinkTargets` limitato alla radice skill reale che contiene directory
`SKILL.md` attendibili.

Se anche l'applicazione da Skill Workshop deve scrivere attraverso quei percorsi skill del workspace
symlinkati e attendibili, abilita `skills.workshop.allowSymlinkTargetWrites`. Tienilo
disabilitato per radici skill condivise di sola lettura.

Correlati:

- [Configurazione Skills](/it/tools/skills-config#symlinked-skill-roots)
- [Esempi di configurazione](/it/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429: uso extra richiesto per contesto lungo

Usalo quando log/errori includono: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Cerca:

- Il modello Anthropic selezionato è un modello Claude 4.x da 1M con capacità GA, oppure il modello ha il parametro legacy `params.context1m: true`.
- La credenziale Anthropic corrente non è idonea per l'uso con contesto lungo.
- Le richieste falliscono solo su sessioni lunghe/esecuzioni modello che richiedono il percorso di contesto 1M.

Opzioni di correzione:

<Steps>
  <Step title="Use a standard context window">
    Passa a un modello con finestra standard, oppure rimuovi `context1m` legacy dalla
    configurazione di modelli più vecchi che non sono GA-capable per contesto 1M.
  </Step>
  <Step title="Use an eligible credential">
    Usa una credenziale Anthropic idonea per richieste con contesto lungo, oppure passa a una chiave API Anthropic.
  </Step>
  <Step title="Configure fallback models">
    Configura modelli di fallback in modo che le esecuzioni continuino quando le richieste Anthropic con contesto lungo vengono rifiutate.
  </Step>
</Steps>

Correlati:

- [Anthropic](/it/providers/anthropic)
- [Uso dei token e costi](/it/reference/token-use)
- [Perché vedo HTTP 429 da Anthropic?](/it/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Risposte upstream 403 bloccate

Usalo quando un provider LLM upstream restituisce un `403` generico come
`Your request was blocked`.

Non presumere che sia sempre un problema di configurazione OpenClaw. La risposta può
provenire da un livello di sicurezza upstream come CDN, WAF, regola di gestione bot o
reverse proxy davanti a un endpoint compatibile con OpenAI.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

Cerca:

- più modelli sotto lo stesso provider che falliscono nello stesso modo
- HTML o testo di sicurezza generico invece di un normale errore API del provider
- eventi di sicurezza lato provider per lo stesso orario della richiesta
- un minuscolo probe diretto `curl` che riesce mentre le normali richieste in forma SDK falliscono

Correggi prima il filtro lato provider quando le prove indicano un blocco WAF/CDN.
Preferisci una regola allow o skip con ambito ristretto per il percorso API usato da OpenClaw
ed evita di disabilitare la protezione per l'intero sito.

<Warning>
Un `curl` minimo riuscito non garantisce che le richieste reali in stile SDK
passeranno attraverso lo stesso livello di sicurezza upstream.
</Warning>

Correlati:

- [Endpoint compatibili con OpenAI](/it/gateway/configuration-reference#openai-compatible-endpoints)
- [Configurazione dei provider](/it/providers)
- [Log](/it/logging)

## Il backend locale compatibile con OpenAI supera i probe diretti ma le esecuzioni agente falliscono

Usalo quando:

- `curl ... /v1/models` funziona
- chiamate dirette minuscole a `/v1/chat/completions` funzionano
- le esecuzioni modello OpenClaw falliscono solo nei normali turni agente

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Cerca:

- le chiamate dirette minuscole riescono, ma le esecuzioni OpenClaw falliscono solo con prompt più grandi
- errori `model_not_found` o 404 anche se `/v1/chat/completions` diretto
  funziona con lo stesso id modello semplice
- errori del backend su `messages[].content` che si aspetta una stringa
- avvisi intermittenti `incomplete turn detected ... stopReason=stop payloads=0` con un backend locale compatibile con OpenAI
- crash del backend che compaiono solo con conteggi prompt-token maggiori o prompt completi del runtime agente

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` con un server locale in stile MLX/vLLM → verifica che `baseUrl` includa `/v1`, che `api` sia `"openai-completions"` per backend `/v1/chat/completions` e che `models.providers.<provider>.models[].id` sia l'id provider-locale semplice. Selezionalo una volta con il prefisso del provider, per esempio `mlx/mlx-community/Qwen3-30B-A3B-6bit`; mantieni la voce di catalogo come `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → il backend rifiuta parti di contenuto Chat Completions strutturate. Correzione: imposta `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` o chiavi messaggio consentite come `["role","content"]` → il backend rifiuta metadati di replay in stile OpenAI sui messaggi Chat Completions. Correzione: imposta `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → il backend ha completato la richiesta Chat Completions ma non ha restituito testo assistente visibile all'utente per quel turno. OpenClaw ritenta una volta i turni vuoti compatibili con OpenAI e sicuri per il replay; i fallimenti persistenti di solito indicano che il backend emette contenuto vuoto/non testuale o sopprime il testo della risposta finale.
    - le richieste dirette minuscole riescono, ma le esecuzioni agente OpenClaw falliscono con crash backend/modello (per esempio Gemma su alcune build `inferrs`) → il trasporto OpenClaw è probabilmente già corretto; il backend sta fallendo sulla forma di prompt più grande del runtime agente.
    - i fallimenti si riducono dopo aver disabilitato gli strumenti ma non scompaiono → gli schemi degli strumenti erano parte della pressione, ma il problema residuo è ancora capacità del modello/server upstream o un bug del backend.

  </Accordion>
  <Accordion title="Fix options">
    1. Imposta `compat.requiresStringContent: true` per backend Chat Completions che accettano solo stringhe.
    2. Imposta `compat.strictMessageKeys: true` per backend Chat Completions rigorosi che accettano solo `role` e `content` su ogni messaggio.
    3. Imposta `compat.supportsTools: false` per modelli/backend che non riescono a gestire in modo affidabile la superficie degli schemi strumenti di OpenClaw.
    4. Riduci la pressione del prompt dove possibile: bootstrap del workspace più piccolo, cronologia sessione più breve, modello locale più leggero o un backend con supporto più forte per contesti lunghi.
    5. Se le richieste dirette minuscole continuano a riuscire mentre i turni agente OpenClaw continuano a causare crash dentro il backend, trattalo come una limitazione upstream del server/modello e apri lì una riproduzione con la forma di payload accettata.
  </Accordion>
</AccordionGroup>

Correlati:

- [Configurazione](/it/gateway/configuration)
- [Modelli locali](/it/gateway/local-models)
- [Endpoint compatibili con OpenAI](/it/gateway/configuration-reference#openai-compatible-endpoints)

## Nessuna risposta

Se i canali sono attivi ma nulla risponde, controlla routing e policy prima di riconnettere qualsiasi cosa.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Cerca:

- Pairing in sospeso per mittenti DM.
- Gate sulle menzioni nei gruppi (`requireMention`, `mentionPatterns`).
- Disallineamenti nell'allowlist di canale/gruppo.

Firme comuni:

- `drop guild message (mention required` → messaggio di gruppo ignorato finché non viene menzionato.
- `pairing request` → il mittente necessita di approvazione.
- `blocked` / `allowlist` → mittente/canale filtrato dalla policy.

Correlati:

- [Risoluzione dei problemi dei canali](/it/channels/troubleshooting)
- [Gruppi](/it/channels/groups)
- [Pairing](/it/channels/pairing)

## Connettività dell'interfaccia di controllo del dashboard

Quando l'interfaccia utente dashboard/di controllo non si connette, verifica URL, modalità di autenticazione e assunzioni sul contesto sicuro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Cerca:

- URL di probe e URL del dashboard corretti.
- Disallineamento modalità/token di autenticazione tra client e Gateway.
- Uso di HTTP dove è richiesta l'identità del dispositivo.

Se un browser locale non riesce a connettersi a `127.0.0.1:18789` dopo un aggiornamento, prima
ripristina il servizio Gateway locale e conferma che stia servendo il dashboard:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

Se `curl` restituisce HTML di OpenClaw, il Gateway funziona e il problema residuo
è probabilmente la cache del browser, un vecchio deep link o uno stato di scheda obsoleto. Apri
`http://127.0.0.1:18789` direttamente e naviga dal dashboard. Se il riavvio
non lascia il servizio in esecuzione, esegui `openclaw gateway start` e ricontrolla
`openclaw gateway status`.

<AccordionGroup>
  <Accordion title="Firme di connessione/autenticazione">
    - `device identity required` → contesto non sicuro o autenticazione del dispositivo mancante.
    - `origin not allowed` → l'`Origin` del browser non è in `gateway.controlUi.allowedOrigins` (oppure ti stai connettendo da un'origine browser non loopback senza un'allowlist esplicita).
    - `device nonce required` / `device nonce mismatch` → il client non completa il flusso di autenticazione del dispositivo basato su challenge (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → il client ha firmato il payload sbagliato (o con timestamp obsoleto) per l'handshake corrente.
    - `AUTH_TOKEN_MISMATCH` con `canRetryWithDeviceToken=true` → il client può eseguire un solo tentativo affidabile con il token dispositivo in cache.
    - Quel nuovo tentativo con token in cache riusa l'insieme di scope in cache memorizzato con il token dispositivo associato. I chiamanti con `deviceToken` esplicito / `scopes` espliciti mantengono invece l'insieme di scope richiesto.
    - `AUTH_SCOPE_MISMATCH` → il token dispositivo è stato riconosciuto, ma i suoi scope approvati non coprono questa richiesta di connessione; riassocia o approva il contratto di scope richiesto invece di ruotare un token Gateway condiviso.
    - Al di fuori di quel percorso di nuovo tentativo, la precedenza dell'autenticazione di connessione è prima token/password condivisi espliciti, poi `deviceToken` esplicito, poi token dispositivo memorizzato, poi token di bootstrap.
    - Nel percorso asincrono dell'interfaccia di controllo Tailscale Serve, i tentativi falliti per la stessa `{scope, ip}` vengono serializzati prima che il limitatore registri il fallimento. Due nuovi tentativi errati concorrenti dallo stesso client possono quindi mostrare `retry later` al secondo tentativo invece di due semplici mismatch.
    - `too many failed authentication attempts (retry later)` da un client loopback con origine browser → fallimenti ripetuti dalla stessa `Origin` normalizzata vengono bloccati temporaneamente; un'altra origine localhost usa un bucket separato.
    - `unauthorized` ripetuto dopo quel nuovo tentativo → deriva tra token condiviso/token dispositivo; aggiorna la configurazione del token e riapprova/ruota il token dispositivo se necessario.
    - `gateway connect failed:` → host/porta/URL di destinazione errati.

  </Accordion>
</AccordionGroup>

### Mappa rapida dei codici di dettaglio autenticazione

Usa `error.details.code` dalla risposta `connect` fallita per scegliere l'azione successiva:

| Codice dettaglio             | Significato                                                                                                                                                                                | Azione consigliata                                                                                                                                                                                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Il client non ha inviato un token condiviso richiesto.                                                                                                                                     | Incolla/imposta il token nel client e riprova. Per i percorsi del dashboard: `openclaw config get gateway.auth.token`, poi incollalo nelle impostazioni dell'interfaccia di controllo.                                                                                                                   |
| `AUTH_TOKEN_MISMATCH`        | Il token condiviso non corrispondeva al token di autenticazione del Gateway.                                                                                                               | Se `canRetryWithDeviceToken=true`, consenti un solo tentativo affidabile. I tentativi con token in cache riusano gli scope approvati memorizzati; i chiamanti con `deviceToken` / `scopes` espliciti mantengono gli scope richiesti. Se continua a fallire, esegui la [checklist di ripristino dalla deriva del token](/it/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Il token per dispositivo in cache è obsoleto o revocato.                                                                                                                                   | Ruota/riapprova il token dispositivo usando la [CLI dei dispositivi](/it/cli/devices), quindi riconnettiti.                                                                                                                                                                                                 |
| `AUTH_SCOPE_MISMATCH`        | Il token dispositivo è valido, ma il suo ruolo/i suoi scope approvati non coprono questa richiesta di connessione.                                                                         | Riassocia il dispositivo o approva il contratto di scope richiesto; non trattarlo come deriva del token condiviso.                                                                                                                                                                                       |
| `PAIRING_REQUIRED`           | L'identità del dispositivo richiede approvazione. Controlla `error.details.reason` per `not-paired`, `scope-upgrade`, `role-upgrade` o `metadata-upgrade`, e usa `requestId` / `remediationHint` quando presenti. | Approva la richiesta in sospeso: `openclaw devices list`, poi `openclaw devices approve <requestId>`. Gli upgrade di scope/ruolo usano lo stesso flusso dopo aver esaminato l'accesso richiesto.                                                                                                         |

<Note>
Gli RPC backend diretti su loopback autenticati con il token/password Gateway condiviso non dovrebbero dipendere dalla baseline di scope dei dispositivi associati della CLI. Se i subagent o altre chiamate interne continuano a fallire con `scope-upgrade`, verifica che il chiamante usi `client.id: "gateway-client"` e `client.mode: "backend"` e non forzi un `deviceIdentity` esplicito o un token dispositivo.
</Note>

Controllo migrazione autenticazione dispositivo v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Se i log mostrano errori di nonce/firma, aggiorna il client che si connette e verificalo:

<Steps>
  <Step title="Attendi connect.challenge">
    Il client attende il `connect.challenge` emesso dal Gateway.
  </Step>
  <Step title="Firma il payload">
    Il client firma il payload vincolato alla challenge.
  </Step>
  <Step title="Invia il nonce del dispositivo">
    Il client invia `connect.params.device.nonce` con lo stesso nonce della challenge.
  </Step>
</Steps>

Se `openclaw devices rotate` / `revoke` / `remove` viene negato inaspettatamente:

- le sessioni con token di dispositivo associato possono gestire solo **il proprio** dispositivo, a meno che il chiamante abbia anche `operator.admin`
- `openclaw devices rotate --scope ...` può richiedere solo scope operatore che la sessione del chiamante possiede già

Correlati:

- [Configurazione](/it/gateway/configuration) (modalità di autenticazione del Gateway)
- [Interfaccia di controllo](/it/web/control-ui)
- [Dispositivi](/it/cli/devices)
- [Accesso remoto](/it/gateway/remote)
- [Autenticazione proxy attendibile](/it/gateway/trusted-proxy-auth)

## Servizio Gateway non in esecuzione

Usalo quando il servizio è installato ma il processo non resta attivo.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # analizza anche i servizi a livello di sistema
```

Cerca:

- `Runtime: stopped` con suggerimenti di uscita.
- Disallineamento della configurazione del servizio (`Config (cli)` vs `Config (service)`).
- Conflitti di porta/listener.
- Installazioni launchd/systemd/schtasks extra quando viene usato `--deep`.
- Suggerimenti di pulizia `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Firme comuni">
    - `Gateway start blocked: set gateway.mode=local` o `existing config is missing gateway.mode` → la modalità Gateway locale non è abilitata, oppure il file di configurazione è stato sovrascritto e ha perso `gateway.mode`. Correzione: imposta `gateway.mode="local"` nella tua configurazione, oppure riesegui `openclaw onboard --mode local` / `openclaw setup` per ristampare la configurazione prevista in modalità locale. Se esegui OpenClaw tramite Podman, il percorso di configurazione predefinito è `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → bind non loopback senza un percorso di autenticazione Gateway valido (token/password, o proxy attendibile dove configurato).
    - `another gateway instance is already listening` / `EADDRINUSE` → conflitto di porta.
    - `Other gateway-like services detected (best effort)` → esistono unità launchd/systemd/schtasks obsolete o parallele. La maggior parte delle configurazioni dovrebbe mantenere un Gateway per macchina; se ne serve più di uno, isola porte + configurazione/stato/workspace. Consulta [/gateway#multiple-gateways-same-host](/it/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` da doctor → esiste un'unità di sistema systemd mentre manca il servizio a livello utente. Rimuovi o disabilita il duplicato prima di consentire a doctor di installare un servizio utente, oppure imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` se l'unità di sistema è il supervisore previsto.
    - `Gateway service port does not match current gateway config` → il supervisore installato fissa ancora il vecchio `--port`. Esegui `openclaw doctor --fix` o `openclaw gateway install --force`, quindi riavvia il servizio Gateway.

  </Accordion>
</AccordionGroup>

Correlati:

- [Exec in background e strumento processi](/it/gateway/background-process)
- [Configurazione](/it/gateway/configuration)
- [Doctor](/it/gateway/doctor)

## Il Gateway macOS smette silenziosamente di rispondere, poi riprende quando tocchi il dashboard

Usalo quando i canali (Telegram, WhatsApp, ecc.) su un host macOS restano silenziosi per minuti o ore alla volta, e il Gateway sembra tornare non appena apri l'interfaccia di controllo, accedi via SSH o interagisci in altro modo con l'host. Di solito non c'è alcun sintomo evidente in `openclaw status` perché quando controlli il Gateway è già di nuovo attivo.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

Cerca:

- Uno o più bundle `*-uncaught_exception.json` in `~/.openclaw/logs/stability/` con `error.code` impostato su un codice di rete transitorio come `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH` o `ECONNREFUSED`.
- Righe di `pmset -g log` come `Entering Sleep state due to 'Maintenance Sleep'` o `en0 driver is slow (msg: WillChangeState to 0)` allineate ai timestamp del crash. Power Nap / Maintenance Sleep porta brevemente il driver Wi-Fi nello stato 0; qualsiasi `connect()` in uscita che cade in quella finestra può fallire con `ENETDOWN` anche su un host che altrimenti ha connettività di rete completa.
- Output di `launchctl print` che mostra `state = not running` con più `runs` recenti e un codice di uscita, soprattutto quando l'intervallo tra il crash e l'avvio successivo è dell'ordine di un'ora anziché di secondi. Su macOS, launchd applica una protezione di respawn non documentata dopo una raffica di crash che può smettere di rispettare `KeepAlive=true` finché un trigger esterno, come login interattivo, connessione alla dashboard o `launchctl kickstart`, non lo riattiva.

Firme comuni:

- Un bundle di stabilità il cui `error.code` è `ENETDOWN` o un codice simile, con lo stack di chiamate che punta a `lookupAndConnect` / `Socket.connect` di `net` in Node. OpenClaw `2026.5.26` e versioni successive classificano questi errori come errori di rete transitori benigni, quindi non si propagano più all'handler uncaught di primo livello; se usi una release precedente, esegui prima l'aggiornamento.
- Lunghi periodi di silenzio che terminano nell'istante in cui ti connetti alla Control UI o accedi all'host via SSH: l'attività visibile all'utente è ciò che riattiva la protezione di respawn di launchd, non qualcosa che la dashboard fa al gateway.
- Conteggio `runs` che aumenta durante la giornata senza una riga corrispondente `received SIG*; shutting down` in `~/Library/Logs/openclaw/gateway.log`: gli arresti puliti registrano un segnale; i crash transitori no.

Cosa fare:

1. **Aggiorna il gateway** se stai eseguendo una release precedente a `2026.5.26`. Dopo l'aggiornamento, i futuri errori `ENETDOWN` vengono registrati come avvisi invece di terminare il processo.
2. **Riduci l'attività di sospensione per manutenzione** sugli host Mac mini / desktop pensati per funzionare come server sempre attivi:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   Questo riduce in modo significativo, ma non elimina del tutto, il flap del driver sottostante. Il sistema può comunque eseguire alcune sospensioni di manutenzione per TCP keepalive e manutenzione mDNS indipendentemente da questi flag.

3. **Aggiungi un watchdog di liveness** in modo che una futura raffica di crash parcheggiata da launchd venga rilevata rapidamente:

   ```bash
   # Example launchd-aware liveness check, suitable for a 5-minute cron or LaunchAgent
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   L'obiettivo è riattivare esternamente la protezione di respawn; `KeepAlive=true` da solo non è sufficiente su macOS dopo una raffica di crash.

Correlato:

- [Note sulla piattaforma macOS](/it/platforms/macos)
- [Logging](/it/logging)
- [Doctor](/it/gateway/doctor)

## Il Gateway esce durante un uso elevato della memoria

Usa questa se il Gateway scompare sotto carico, il supervisore segnala un riavvio in stile OOM o i log menzionano `critical memory pressure bundle written`.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

Cerca:

- `Reason: diagnostic.memory.pressure.critical` nel bundle di stabilità più recente.
- `Memory pressure:` con `critical/rss_threshold`, `critical/heap_threshold` o `critical/rss_growth`.
- Valori `V8 heap:` vicini al limite dello heap.
- Voci `Largest session files:` come `agents/<agent>/sessions/<session>.jsonl` o `sessions/<session>.jsonl`.
- Contatori di memoria cgroup Linux quando il gateway viene eseguito dentro un container o un servizio con memoria limitata.

Firme comuni:

- `critical memory pressure bundle written` appare poco prima del riavvio → OpenClaw ha acquisito un bundle di stabilità pre-OOM. Ispezionalo con `openclaw gateway stability --bundle latest`.
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` appare nei log del gateway → OpenClaw ha rilevato pressione di memoria critica, ma lo snapshot di stabilità pre-OOM è disattivato.
- `Largest session files:` punta a un percorso di trascrizione redatto molto grande → riduci la cronologia delle sessioni conservata, ispeziona la crescita della sessione o sposta le vecchie trascrizioni fuori dallo store attivo prima di riavviare.
- I byte usati in `V8 heap:` sono vicini al limite dello heap → riduci la pressione di prompt/sessione, riduci il lavoro concorrente o aumenta il limite dello heap di Node solo dopo aver confermato che il carico di lavoro è previsto.
- `Memory pressure: critical/rss_growth` → la memoria è cresciuta rapidamente in una finestra di campionamento. Controlla i log più recenti per un import grande, output di tool fuori controllo, retry ripetuti o un batch di lavoro agente in coda.
- La pressione di memoria critica appare nei log ma non esiste alcun bundle → questo è il comportamento predefinito. Imposta `diagnostics.memoryPressureSnapshot: true` per acquisire il bundle di stabilità pre-OOM nei futuri eventi di pressione di memoria critica.

Il bundle di stabilità non contiene payload. Include prove operative sulla memoria e percorsi di file relativi redatti, non testo dei messaggi, corpi webhook, credenziali, token, cookie o ID sessione grezzi. Allega l'export diagnostico alle segnalazioni di bug invece di copiare log grezzi.

Correlato:

- [Salute del Gateway](/it/gateway/health)
- [Export diagnostico](/it/gateway/diagnostics)
- [Sessioni](/it/cli/sessions)

## Il Gateway ha rifiutato una configurazione non valida

Usa questa quando l'avvio del Gateway fallisce con `Invalid config` o i log di hot reload dicono che
ha saltato una modifica non valida.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Cerca:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- Un file `openclaw.json.rejected.*` con timestamp accanto alla configurazione attiva
- Un file `openclaw.json.clobbered.*` con timestamp se `doctor --fix` ha riparato una modifica diretta rotta
- OpenClaw conserva gli ultimi 32 file `.clobbered.*` per ciascun percorso di configurazione e ruota quelli più vecchi

<AccordionGroup>
  <Accordion title="Cosa è successo">
    - La configurazione non è stata validata durante l'avvio, l'hot reload o una scrittura di proprietà di OpenClaw.
    - L'avvio del Gateway fallisce in modo chiuso invece di riscrivere `openclaw.json`.
    - L'hot reload salta le modifiche esterne non valide e mantiene attiva la configurazione runtime corrente.
    - Le scritture di proprietà di OpenClaw rifiutano payload non validi/distruttivi prima del commit e salvano `.rejected.*`.
    - `openclaw doctor --fix` possiede la riparazione. Può rimuovere prefissi non JSON o ripristinare l'ultima copia valida nota preservando il payload rifiutato come `.clobbered.*`.
    - Quando avvengono molte riparazioni per un percorso di configurazione, OpenClaw ruota i file `.clobbered.*` più vecchi in modo che il payload riparato più recente sia ancora disponibile.

  </Accordion>
  <Accordion title="Ispeziona e ripara">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Firme comuni">
    - `.clobbered.*` esiste → doctor ha preservato una modifica esterna rotta mentre riparava la configurazione attiva.
    - `.rejected.*` esiste → una scrittura di configurazione di proprietà di OpenClaw ha fallito i controlli di schema o clobber prima del commit.
    - `Config write rejected:` → la scrittura ha tentato di eliminare la struttura richiesta, ridurre drasticamente il file o persistere una configurazione non valida.
    - `config reload skipped (invalid config):` → una modifica diretta ha fallito la validazione ed è stata ignorata dal Gateway in esecuzione.
    - `Invalid config at ...` → l'avvio è fallito prima che i servizi del Gateway venissero avviati.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` o `size-drop-vs-last-good:*` → una scrittura di proprietà di OpenClaw è stata rifiutata perché ha perso campi o dimensione rispetto al backup last-known-good.
    - `Config last-known-good promotion skipped` → il candidato conteneva placeholder di segreti redatti come `***`.

  </Accordion>
  <Accordion title="Opzioni di correzione">
    1. Esegui `openclaw doctor --fix` per lasciare che doctor ripari la configurazione prefissata/clobbered o ripristini last-known-good.
    2. Copia solo le chiavi desiderate da `.clobbered.*` o `.rejected.*`, poi applicale con `openclaw config set` o `config.patch`.
    3. Esegui `openclaw config validate` prima di riavviare.
    4. Se modifichi a mano, mantieni la configurazione JSON5 completa, non solo l'oggetto parziale che volevi cambiare.
  </Accordion>
</AccordionGroup>

Correlato:

- [Config](/it/cli/config)
- [Configurazione: hot reload](/it/gateway/configuration#config-hot-reload)
- [Configurazione: validazione rigorosa](/it/gateway/configuration#strict-validation)
- [Doctor](/it/gateway/doctor)

## Avvisi dei probe del Gateway

Usa questa quando `openclaw gateway probe` raggiunge qualcosa, ma stampa comunque un blocco di avviso.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Cerca:

- `warnings[].code` e `primaryTargetId` nell'output JSON.
- Se l'avviso riguarda fallback SSH, più gateway, ambiti mancanti o riferimenti auth non risolti.

Firme comuni:

- `SSH tunnel failed to start; falling back to direct probes.` → la configurazione SSH è fallita, ma il comando ha comunque provato target diretti configurati/loopback.
- `multiple reachable gateway identities detected` → gateway distinti hanno risposto, oppure OpenClaw non ha potuto provare che i target raggiungibili siano lo stesso gateway. Un tunnel SSH, URL proxy o URL remoto configurato verso lo stesso gateway viene trattato come un solo gateway con più trasporti, anche quando le porte di trasporto differiscono.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la connessione ha funzionato, ma l'RPC di dettaglio è limitato dagli ambiti; abbina l'identità del dispositivo o usa credenziali con `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → la connessione ha funzionato, ma il set completo di RPC diagnostici è andato in timeout o è fallito. Trattalo come un Gateway raggiungibile con diagnostica degradata; confronta `connect.ok` e `connect.rpcOk` nell'output `--json`.
- `Capability: pairing-pending` o `gateway closed (1008): pairing required` → il gateway ha risposto, ma questo client necessita ancora di pairing/approvazione prima del normale accesso operatore.
- testo di avviso SecretRef `gateway.auth.*` / `gateway.remote.*` non risolto → il materiale auth non era disponibile in questo percorso di comando per il target fallito.

Correlato:

- [Gateway](/it/cli/gateway)
- [Più gateway sullo stesso host](/it/gateway#multiple-gateways-same-host)
- [Accesso remoto](/it/gateway/remote)

## Canale connesso, messaggi non in transito

Se lo stato del canale è connesso ma il flusso dei messaggi è interrotto, concentrati su policy, autorizzazioni e regole di consegna specifiche del canale.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Cerca:

- Policy DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist dei gruppi e requisiti di menzione.
- Autorizzazioni/ambiti API del canale mancanti.

Firme comuni:

- `mention required` → messaggio ignorato dalla policy di menzione del gruppo.
- tracce `pairing` / approvazione in sospeso → il mittente non è approvato.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema di auth/autorizzazioni del canale.

Correlato:

- [Risoluzione dei problemi dei canali](/it/channels/troubleshooting)
- [Discord](/it/channels/discord)
- [Telegram](/it/channels/telegram)
- [WhatsApp](/it/channels/whatsapp)

## Consegna di Cron e Heartbeat

Se Cron o Heartbeat non è stato eseguito o non ha consegnato, verifica prima lo stato dello scheduler, poi il target di consegna.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Cerca:

- Cron abilitato e prossimo risveglio presente.
- Stato della cronologia delle esecuzioni del job (`ok`, `skipped`, `error`).
- Motivi di salto dell'Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Firme comuni">
    - `cron: scheduler disabled; jobs will not run automatically` → cron disabilitato.
    - `cron: timer tick failed` → tick dello scheduler non riuscito; controlla errori di file/log/runtime.
    - `heartbeat skipped` con `reason=quiet-hours` → fuori dalla finestra degli orari attivi.
    - `heartbeat skipped` con `reason=empty-heartbeat-file` → `HEARTBEAT.md` esiste ma contiene solo righe vuote, commenti, intestazioni, fence o scaffolding di checklist vuote, quindi OpenClaw salta la chiamata al modello.
    - `heartbeat skipped` con `reason=no-tasks-due` → `HEARTBEAT.md` contiene un blocco `tasks:`, ma nessuna attività è in scadenza in questo tick.
    - `heartbeat: unknown accountId` → ID account non valido per la destinazione di recapito dell'Heartbeat.
    - `heartbeat skipped` con `reason=dm-blocked` → la destinazione dell'Heartbeat è stata risolta in una destinazione in stile DM mentre `agents.defaults.heartbeat.directPolicy` (o l'override per agente) è impostato su `block`.

  </Accordion>
</AccordionGroup>

Correlati:

- [Heartbeat](/it/gateway/heartbeat)
- [Attività pianificate](/it/automation/cron-jobs)
- [Attività pianificate: risoluzione dei problemi](/it/automation/cron-jobs#troubleshooting)

## Node associato, strumento non riuscito

Se un nodo è associato ma gli strumenti non riescono, isola stato di foreground, autorizzazioni e approvazioni.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Cerca:

- Nodo online con le capacità previste.
- Concessioni di autorizzazioni del sistema operativo per fotocamera/microfono/posizione/schermo.
- Stato delle approvazioni exec e dell'allowlist.

Firme comuni:

- `NODE_BACKGROUND_UNAVAILABLE` → l'app del nodo deve essere in foreground.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → autorizzazione del sistema operativo mancante.
- `SYSTEM_RUN_DENIED: approval required` → approvazione exec in sospeso.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloccato dall'allowlist.

Correlati:

- [Approvazioni exec](/it/tools/exec-approvals)
- [Risoluzione dei problemi dei Node](/it/nodes/troubleshooting)
- [Node](/it/nodes/index)

## Strumento browser non riuscito

Usalo quando le azioni dello strumento browser non riescono anche se il Gateway stesso è integro.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Cerca:

- Se `plugins.allow` è impostato e include `browser`.
- Percorso valido dell'eseguibile del browser.
- Raggiungibilità del profilo CDP.
- Disponibilità di Chrome locale per i profili `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Firme Plugin / eseguibile">
    - `unknown command "browser"` o `unknown command 'browser'` → il Plugin browser in bundle è escluso da `plugins.allow`.
    - strumento browser mancante / non disponibile mentre `browser.enabled=true` → `plugins.allow` esclude `browser`, quindi il plugin non è mai stato caricato.
    - `Failed to start Chrome CDP on port` → avvio del processo browser non riuscito.
    - `browser.executablePath not found` → il percorso configurato non è valido.
    - `browser.cdpUrl must be http(s) or ws(s)` → l'URL CDP configurato usa uno schema non supportato come `file:` o `ftp:`.
    - `browser.cdpUrl has invalid port` → l'URL CDP configurato ha una porta errata o fuori intervallo.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → l'installazione corrente del Gateway non include la dipendenza runtime core del browser; reinstalla o aggiorna OpenClaw, quindi riavvia il Gateway. Gli snapshot ARIA e gli screenshot di base delle pagine possono ancora funzionare, ma navigazione, snapshot AI, screenshot di elementi con selettore CSS ed esportazione PDF restano non disponibili.

  </Accordion>
  <Accordion title="Firme Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session non è ancora riuscito ad agganciarsi alla directory dati del browser selezionata. Apri la pagina di ispezione del browser, abilita il debug remoto, tieni aperto il browser, approva la prima richiesta di aggancio, quindi riprova. Se lo stato di accesso non è richiesto, preferisci il profilo gestito `openclaw`.
    - `No Chrome tabs found for profile="user"` → il profilo di aggancio Chrome MCP non ha schede Chrome locali aperte.
    - `Remote CDP for profile "<name>" is not reachable` → l'endpoint CDP remoto configurato non è raggiungibile dall'host del Gateway.
    - `Browser attachOnly is enabled ... not reachable` o `Browser attachOnly is enabled and CDP websocket ... is not reachable` → il profilo solo aggancio non ha destinazioni raggiungibili, oppure l'endpoint HTTP ha risposto ma il WebSocket CDP non ha comunque potuto essere aperto.

  </Accordion>
  <Accordion title="Firme elemento / screenshot / caricamento">
    - `fullPage is not supported for element screenshots` → la richiesta di screenshot ha combinato `--full-page` con `--ref` o `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → le chiamate screenshot Chrome MCP / `existing-session` devono usare la cattura della pagina o un `--ref` da snapshot, non `--element` CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → gli hook di caricamento Chrome MCP richiedono riferimenti snapshot, non selettori CSS.
    - `existing-session file uploads currently support one file at a time.` → invia un caricamento per chiamata sui profili Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → gli hook di dialogo sui profili Chrome MCP non supportano override del timeout.
    - `existing-session type does not support timeoutMs overrides.` → ometti `timeoutMs` per `act:type` su `profile="user"` / profili Chrome MCP existing-session, oppure usa un profilo browser gestito/CDP quando è richiesto un timeout personalizzato.
    - `existing-session evaluate does not support timeoutMs overrides.` → ometti `timeoutMs` per `act:evaluate` su `profile="user"` / profili Chrome MCP existing-session, oppure usa un profilo browser gestito/CDP quando è richiesto un timeout personalizzato.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` richiede ancora un browser gestito o un profilo CDP grezzo.
    - override obsoleti di viewport / modalità scura / locale / offline su profili solo aggancio o CDP remoto → esegui `openclaw browser stop --browser-profile <name>` per chiudere la sessione di controllo attiva e rilasciare lo stato di emulazione Playwright/CDP senza riavviare l'intero Gateway.

  </Accordion>
</AccordionGroup>

Correlati:

- [Browser (gestito da OpenClaw)](/it/tools/browser)
- [Risoluzione dei problemi del browser](/it/tools/browser-linux-troubleshooting)

## Se hai aggiornato e qualcosa si è rotto improvvisamente

La maggior parte delle rotture post-aggiornamento è dovuta a deriva della configurazione o a default più rigorosi ora applicati.

<AccordionGroup>
  <Accordion title="1. Il comportamento di override di autenticazione e URL è cambiato">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Cosa controllare:

    - Se `gateway.mode=remote`, le chiamate CLI potrebbero puntare al remoto mentre il servizio locale funziona correttamente.
    - Le chiamate esplicite con `--url` non fanno fallback alle credenziali memorizzate.

    Firme comuni:

    - `gateway connect failed:` → destinazione URL errata.
    - `unauthorized` → endpoint raggiungibile ma autenticazione errata.

  </Accordion>
  <Accordion title="2. I guardrail di bind e autenticazione sono più rigorosi">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Cosa controllare:

    - I bind non loopback (`lan`, `tailnet`, `custom`) richiedono un percorso di autenticazione Gateway valido: autenticazione con token/password condivisi oppure una distribuzione `trusted-proxy` non loopback configurata correttamente.
    - Le vecchie chiavi come `gateway.token` non sostituiscono `gateway.auth.token`.

    Firme comuni:

    - `refusing to bind gateway ... without auth` → bind non loopback senza un percorso di autenticazione Gateway valido.
    - `Connectivity probe: failed` mentre il runtime è in esecuzione → Gateway attivo ma inaccessibile con autenticazione/URL correnti.

  </Accordion>
  <Accordion title="3. Lo stato di associazione e identità del dispositivo è cambiato">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Cosa controllare:

    - Approvazioni dispositivo in sospeso per dashboard/nodi.
    - Approvazioni di associazione DM in sospeso dopo modifiche a policy o identità.

    Firme comuni:

    - `device identity required` → autenticazione dispositivo non soddisfatta.
    - `pairing required` → mittente/dispositivo deve essere approvato.

  </Accordion>
</AccordionGroup>

Se la configurazione del servizio e il runtime continuano a non concordare dopo i controlli, reinstalla i metadati del servizio dalla stessa directory profilo/stato:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Correlati:

- [Autenticazione](/it/gateway/authentication)
- [Exec in background e strumento di processo](/it/gateway/background-process)
- [Associazione gestita dal Gateway](/it/gateway/pairing)

## Correlati

- [Doctor](/it/gateway/doctor)
- [FAQ](/it/help/faq)
- [Runbook del Gateway](/it/gateway)
