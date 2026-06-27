---
read_when:
    - Vuoi che un agente OpenClaw partecipi a una chiamata Google Meet
    - Vuoi che un agente OpenClaw crei una nuova chiamata Google Meet
    - Stai configurando Chrome, il nodo Chrome o Twilio come trasporto Google Meet
summary: 'Plugin Google Meet: partecipa a URL Meet espliciti tramite Chrome o Twilio con impostazioni predefinite di risposta vocale dell''agente'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-06-27T17:49:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e85d531897e3aeadf0ac718f82a7aac5ce73715e182e96ceba77cb76eff094c4
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet participant support for OpenClaw — the plugin is explicit by design:

- It only joins an explicit `https://meet.google.com/...` URL.
- It can create a new Meet space through the Google Meet API, then join the
  returned URL.
- `agent` is the default talk-back mode: realtime transcription listens, the
  configured OpenClaw agent answers, and regular OpenClaw TTS speaks into Meet.
- `bidi` remains available as the fallback direct realtime voice model mode.
- Agents choose the join behavior with `mode`: use `agent` for live
  listen/talk-back, `bidi` for direct realtime voice fallback, or `transcribe`
  to join/control the browser without the talk-back bridge.
- Auth starts as personal Google OAuth or an already signed-in Chrome profile.
- There is no automatic consent announcement.
- The default Chrome audio backend is `BlackHole 2ch`.
- Chrome can run locally or on a paired node host.
- Twilio accepts a dial-in number plus optional PIN or DTMF sequence; it
  cannot dial a Meet URL directly.
- The CLI command is `googlemeet`; `meet` is reserved for broader agent
  teleconference workflows.

## Quick start

Install the local audio dependencies and configure a realtime transcription
provider plus regular OpenClaw TTS. OpenAI is the default transcription
provider; Google Gemini Live also works as a separate `bidi` voice fallback with
`realtime.voiceProvider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
export GEMINI_API_KEY=...
```

`blackhole-2ch` installs the `BlackHole 2ch` virtual audio device. Homebrew's
installer requires a reboot before macOS exposes the device:

```bash
sudo reboot
```

After reboot, verify both pieces:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Enable the plugin:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Check setup:

```bash
openclaw googlemeet setup
```

The setup output is meant to be agent-readable and mode-aware. It reports Chrome
profile, node pinning, and, for realtime Chrome joins, the BlackHole/SoX audio
bridge and delayed realtime intro checks. For observe-only joins, check the same
transport with `--mode transcribe`; that mode skips realtime audio prerequisites
because it does not listen through or speak through the bridge:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

When Twilio delegation is configured, setup also reports whether the
`voice-call` plugin, Twilio credentials, and public webhook exposure are ready.
Treat any `ok: false` check as a blocker for the checked transport and mode
before asking an agent to join. Use `openclaw googlemeet setup --json` for
scripts or machine-readable output. Use `--transport chrome`,
`--transport chrome-node`, or `--transport twilio` to preflight a specific
transport before an agent tries it.

For Twilio, always preflight the transport explicitly when the default transport
is Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

That catches missing `voice-call` wiring, Twilio credentials, or unreachable
webhook exposure before the agent tries to dial the meeting.

Join a meeting:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Or let an agent join through the `google_meet` tool:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

The agent-facing `google_meet` tool stays available on non-macOS hosts for
artifact, calendar, setup, transcribe, Twilio, and `chrome-node` flows. Local
Chrome talk-back actions are blocked there because the bundled Chrome audio path
currently depends on macOS `BlackHole 2ch`. On Linux, use `mode: "transcribe"`,
Twilio dial-in, or a macOS `chrome-node` host for Chrome talk-back
participation.

Create a new meeting and join it:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

For API-created rooms, use Google Meet `SpaceConfig.accessType` when you want
the room's no-knock policy to be explicit instead of inherited from the Google
account defaults:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` lets anyone with the Meet URL join without knocking. `TRUSTED` lets the
host organization's trusted users, invited external users, and dial-in users
join without knocking. `RESTRICTED` limits no-knock entry to invitees. These
settings only apply to the official Google Meet API creation path, so OAuth
credentials must be configured.

If you authenticated Google Meet before this option was available, rerun
`openclaw googlemeet auth login --json` after adding the
`meetings.space.settings` scope to your Google OAuth consent screen.

Create only the URL without joining:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` has two paths:

- API create: used when Google Meet OAuth credentials are configured. This is
  the most deterministic path and does not depend on browser UI state.
- Browser fallback: used when OAuth credentials are absent. OpenClaw uses the
  pinned Chrome node, opens `https://meet.google.com/new`, waits for Google to
  redirect to a real meeting-code URL, then returns that URL. This path requires
  the OpenClaw Chrome profile on the node to already be signed in to Google.
  Browser automation handles Meet's own first-run microphone prompt; that prompt
  is not treated as a Google login failure.
  Join and create flows also try to reuse an existing Meet tab before opening a
  new one. Matching ignores harmless URL query strings such as `authuser`, so an
  agent retry should focus the already-open meeting instead of creating a second
  Chrome tab.

The command/tool output includes a `source` field (`api` or `browser`) so agents
can explain which path was used. `create` joins the new meeting by default and
returns `joined: true` plus the join session. To only mint the URL, use
`create --no-join` on the CLI or pass `"join": false` to the tool.

Or tell an agent: "Create a Google Meet, join it with the agent talk-back mode,
and send me the link." The agent should call `google_meet` with
`action: "create"` and then share the returned `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

For an observe-only/browser-control join, set `"mode": "transcribe"`. That does
not start the duplex realtime voice bridge, does not require BlackHole or SoX,
and will not talk back into the meeting. Chrome joins in this mode also avoid
OpenClaw's microphone/camera permission grant and avoid the Meet **Use
microphone** path. If Meet shows an audio-choice interstitial, automation tries
the no-microphone path and otherwise reports a manual action instead of opening
the local microphone. In transcribe mode, managed Chrome transports also install
a best-effort Meet caption observer. `googlemeet status --json` and
`googlemeet doctor` surface `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`,
and a short `recentTranscript` tail so operators can tell whether the browser
joined the call and whether Meet captions are producing text.
Use `openclaw googlemeet test-listen <meet-url> --transport chrome-node` when
you need a yes/no probe: it joins in transcribe mode, waits for fresh caption or
transcript movement, and returns `listenVerified`, `listenTimedOut`, manual
action fields, and the latest caption health.

During realtime sessions, `google_meet` status includes browser and audio bridge
health such as `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, last input/output
timestamps, byte counters, and bridge closed state. If a safe Meet page prompt
appears, browser automation handles it when it can. Login, host admission, and
browser/OS permission prompts are reported as manual action with a reason and
message for the agent to relay. Managed Chrome sessions only emit the intro or
test phrase after browser health reports `inCall: true`; otherwise status reports
`speechReady: false` and the speech attempt is blocked instead of pretending the
agent spoke into the meeting.

Local Chrome joins through the signed-in OpenClaw browser profile. Realtime mode
requires `BlackHole 2ch` for the microphone/speaker path used by OpenClaw. For
clean duplex audio, use separate virtual devices or a Loopback-style graph; a
single BlackHole device is enough for a first smoke test but can echo.

### Local gateway + Parallels Chrome

You do **not** need a full OpenClaw Gateway or model API key inside a macOS VM
just to make the VM own Chrome. Run the Gateway and agent locally, then run a
node host in the VM. Enable the bundled plugin on the VM once so the node
advertises the Chrome command:

What runs where:

- Gateway host: OpenClaw Gateway, agent workspace, model/API keys, realtime
  provider, and the Google Meet plugin config.
- Parallels macOS VM: OpenClaw CLI/node host, Google Chrome, SoX, BlackHole 2ch,
  and a Chrome profile signed in to Google.
- Not needed in the VM: Gateway service, agent config, OpenAI/GPT key, or model
  provider setup.

Install the VM dependencies:

```bash
brew install blackhole-2ch sox
```

Reboot the VM after installing BlackHole so macOS exposes `BlackHole 2ch`:

```bash
sudo reboot
```

After reboot, verify the VM can see the audio device and SoX commands:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Install or update OpenClaw in the VM, then enable the bundled plugin there:

```bash
openclaw plugins enable google-meet
```

Start the node host in the VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

If `<gateway-host>` is a LAN IP and you are not using TLS, the node refuses the
plaintext WebSocket unless you opt in for that trusted private network:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Use the same environment variable when installing the node as a LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` is process environment, not an
`openclaw.json` setting. `openclaw node install` stores it in the LaunchAgent
environment when it is present on the install command.

Approve the node from the Gateway host:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Confirm the Gateway sees the node and that it advertises both `googlemeet.chrome`
and browser capability/`browser.proxy`:

```bash
openclaw nodes status
```

Route Meet through that node on the Gateway host:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome", "browser.proxy"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chrome: {
            guestName: "OpenClaw Agent",
            autoJoin: true,
            reuseExistingTab: true,
          },
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

Now join normally from the Gateway host:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

or ask the agent to use the `google_meet` tool with `transport: "chrome-node"`.

For a one-command smoke test that creates or reuses a session, speaks a known
phrase, and prints session health:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Durante l'accesso in realtime, l'automazione del browser di OpenClaw inserisce il nome dell'ospite, fa clic su
Join/Ask to join e accetta la scelta di primo avvio "Use microphone" di Meet quando
compare il prompt. Durante l'accesso in sola osservazione o la creazione di una riunione solo da browser, prosegue
oltre lo stesso prompt senza microfono quando questa scelta è disponibile.
Se il profilo del browser non ha eseguito l'accesso, Meet è in attesa dell'ammissione da parte dell'host,
Chrome richiede l'autorizzazione per microfono/camera per un accesso realtime, oppure Meet è bloccato
su un prompt che l'automazione non è riuscita a risolvere, il risultato di accesso/test-speech segnala
`manualActionRequired: true` con `manualActionReason` e
`manualActionMessage`. Gli agenti devono smettere di ritentare l'accesso, riportare esattamente quel
messaggio insieme agli attuali `browserUrl`/`browserTitle`, e ritentare solo dopo che
l'azione manuale nel browser è stata completata.

Se `chromeNode.node` viene omesso, OpenClaw seleziona automaticamente solo quando esattamente un
nodo connesso dichiara sia `googlemeet.chrome` sia il controllo del browser. Se
sono connessi più nodi idonei, imposta `chromeNode.node` sull'id del nodo,
sul nome visualizzato o sull'IP remoto.

Controlli comuni degli errori:

- `Configured Google Meet node ... is not usable: offline`: il nodo fissato è
  noto al Gateway ma non disponibile. Gli agenti devono trattare quel nodo come
  stato diagnostico, non come host Chrome utilizzabile, e riportare il blocco di configurazione
  invece di ripiegare su un altro transport, a meno che l'utente non lo abbia richiesto.
- `No connected Google Meet-capable node`: avvia `openclaw node run` nella VM,
  approva l'associazione e assicurati che `openclaw plugins enable google-meet` e
  `openclaw plugins enable browser` siano stati eseguiti nella VM. Conferma inoltre che
  l'host Gateway consenta entrambi i comandi del nodo con
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: installa `blackhole-2ch` sull'host
  controllato e riavvia prima di usare l'audio di Chrome locale.
- `BlackHole 2ch audio device not found on the node`: installa `blackhole-2ch`
  nella VM e riavvia la VM.
- Chrome si apre ma non riesce ad accedere: esegui l'accesso al profilo del browser dentro la VM, oppure
  mantieni `chrome.guestName` impostato per l'accesso come ospite. L'accesso automatico come ospite usa l'automazione
  del browser di OpenClaw tramite il proxy browser del nodo; assicurati che la configurazione del browser del nodo
  punti al profilo desiderato, per esempio
  `browser.defaultProfile: "user"` o un profilo di sessione esistente con nome.
- Schede Meet duplicate: lascia `chrome.reuseExistingTab: true` abilitato. OpenClaw
  attiva una scheda esistente per lo stesso URL Meet prima di aprirne una nuova, e
  la creazione di riunioni da browser riutilizza una scheda `https://meet.google.com/new`
  o un prompt dell'account Google in corso prima di aprirne un'altra.
- Nessun audio: in Meet, instrada microfono/altoparlante attraverso il percorso del dispositivo audio virtuale
  usato da OpenClaw; usa dispositivi virtuali separati o routing in stile Loopback
  per audio duplex pulito.

## Note di installazione

Il default talk-back di Chrome usa due strumenti esterni:

- `sox`: utility audio da riga di comando. Il plugin usa comandi espliciti del dispositivo CoreAudio
  per il bridge audio PCM16 predefinito a 24 kHz.
- `blackhole-2ch`: driver audio virtuale per macOS. Crea il dispositivo audio `BlackHole 2ch`
  attraverso cui Chrome/Meet può instradare l'audio.

OpenClaw non include né ridistribuisce nessuno dei due pacchetti. La documentazione chiede agli utenti di
installarli come dipendenze dell'host tramite Homebrew. SoX è concesso in licenza come
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole è GPL-3.0. Se crei un
installer o un'appliance che include BlackHole con OpenClaw, rivedi i termini di licenza
upstream di BlackHole o ottieni una licenza separata da Existential Audio.

## Transport

### Chrome

Il transport Chrome apre l'URL Meet tramite il controllo browser di OpenClaw e accede
come profilo browser OpenClaw con accesso effettuato. Su macOS, il plugin verifica la presenza di
`BlackHole 2ch` prima dell'avvio. Se configurato, esegue anche un comando di salute del bridge audio
e un comando di avvio prima di aprire Chrome. Usa `chrome` quando
Chrome/audio sono sull'host Gateway; usa `chrome-node` quando Chrome/audio sono
su un nodo associato, come una VM macOS Parallels. Per Chrome locale, scegli il
profilo con `browser.defaultProfile`; `chrome.browserProfile` viene passato agli host
`chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Instrada l'audio del microfono e degli altoparlanti di Chrome attraverso il bridge audio locale di OpenClaw.
Se `BlackHole 2ch` non è installato, l'accesso fallisce con un errore di configurazione
invece di accedere silenziosamente senza un percorso audio.

### Twilio

Il transport Twilio è un piano di chiamata rigoroso delegato al plugin Voice Call. Non
analizza le pagine Meet per trovare numeri di telefono.

Usalo quando la partecipazione tramite Chrome non è disponibile o vuoi un fallback
di accesso telefonico. Google Meet deve esporre un numero di accesso telefonico e un PIN per la
riunione; OpenClaw non li scopre dalla pagina Meet.

Abilita il plugin Voice Call sull'host Gateway, non sul nodo Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // or set "twilio" if Twilio should be the default
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          inboundPolicy: "allowlist",
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Join this Google Meet as an OpenClaw agent. Be brief.",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                silenceDurationMs: 500,
                startSensitivity: "high",
              },
            },
          },
        },
      },
      google: {
        enabled: true,
      },
    },
  },
}
```

Fornisci le credenziali Twilio tramite ambiente o configurazione. L'ambiente mantiene
i segreti fuori da `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Usa invece `realtime.provider: "openai"` con il plugin provider OpenAI e
`OPENAI_API_KEY` se quello è il tuo provider vocale realtime.

Riavvia o ricarica il Gateway dopo aver abilitato `voice-call`; le modifiche alla configurazione del plugin
non compaiono in un processo Gateway già in esecuzione finché non viene ricaricato.

Poi verifica:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Quando la delega Twilio è collegata, `googlemeet setup` include controlli riusciti
`twilio-voice-call-plugin`, `twilio-voice-call-credentials` e
`twilio-voice-call-webhook`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Usa `--dtmf-sequence` quando la riunione richiede una sequenza personalizzata:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth e controlli preliminari

OAuth è facoltativo per creare un link Meet perché `googlemeet create` può
ricorrere all'automazione del browser. Configura OAuth quando vuoi la creazione
tramite API ufficiale, la risoluzione degli spazi o i controlli preliminari
della Meet Media API.

L'accesso alla Google Meet API usa OAuth utente: crea un client OAuth Google Cloud,
richiedi gli ambiti necessari, autorizza un account Google, quindi archivia il
refresh token risultante nella configurazione del plugin Google Meet oppure
fornisci le variabili d'ambiente `OPENCLAW_GOOGLE_MEET_*`.

OAuth non sostituisce il percorso di partecipazione tramite Chrome. I trasporti
Chrome e Chrome-node continuano a partecipare tramite un profilo Chrome con
accesso effettuato, BlackHole/SoX e un nodo connesso quando usi la partecipazione
tramite browser. OAuth serve solo per il percorso ufficiale della Google Meet API:
creare spazi riunione, risolvere spazi ed eseguire controlli preliminari della
Meet Media API.

### Crea le credenziali Google

In Google Cloud Console:

1. Crea o seleziona un progetto Google Cloud.
2. Abilita **Google Meet REST API** per quel progetto.
3. Configura la schermata di consenso OAuth.
   - **Internal** è l'opzione più semplice per un'organizzazione Google Workspace.
   - **External** funziona per configurazioni personali/di test; mentre l'app è in Testing,
     aggiungi ogni account Google che autorizzerà l'app come utente di test.
4. Aggiungi gli ambiti richiesti da OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Crea un ID client OAuth.
   - Tipo di applicazione: **Web application**.
   - URI di reindirizzamento autorizzato:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Copia l'ID client e il client secret.

`meetings.space.created` è richiesto da Google Meet `spaces.create`.
`meetings.space.readonly` consente a OpenClaw di risolvere URL/codici Meet in spazi.
`meetings.space.settings` consente a OpenClaw di passare impostazioni `SpaceConfig`
come `accessType` durante la creazione di stanze tramite API.
`meetings.conference.media.readonly` serve per i controlli preliminari della Meet
Media API e per il lavoro sui media; Google potrebbe richiedere l'iscrizione alla
Developer Preview per l'uso effettivo della Media API. Se ti servono solo
partecipazioni Chrome basate su browser, salta completamente OAuth.

### Genera il refresh token

Configura `oauth.clientId` e facoltativamente `oauth.clientSecret`, oppure passali
come variabili d'ambiente, quindi esegui:

```bash
openclaw googlemeet auth login --json
```

Il comando stampa un blocco di configurazione `oauth` con un refresh token. Usa PKCE,
callback localhost su `http://localhost:8085/oauth2callback` e un flusso manuale
di copia/incolla con `--manual`.

Esempi:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Usa la modalità manuale quando il browser non può raggiungere la callback locale:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

L'output JSON include:

```json
{
  "oauth": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "refresh-token",
    "accessToken": "access-token",
    "expiresAt": 1770000000000
  },
  "scope": "..."
}
```

Archivia l'oggetto `oauth` nella configurazione del plugin Google Meet:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          oauth: {
            clientId: "your-client-id",
            clientSecret: "your-client-secret",
            refreshToken: "refresh-token",
          },
        },
      },
    },
  },
}
```

Preferisci le variabili d'ambiente quando non vuoi inserire il refresh token nella
configurazione. Se sono presenti sia valori di configurazione sia valori d'ambiente,
il plugin risolve prima la configurazione e poi usa l'ambiente come fallback.

Il consenso OAuth include la creazione di spazi Meet, l'accesso in lettura agli
spazi Meet e l'accesso in lettura ai contenuti multimediali delle conferenze Meet.
Se hai eseguito l'autenticazione prima che esistesse il supporto per la creazione
di riunioni, riesegui `openclaw googlemeet auth login --json` in modo che il
refresh token abbia l'ambito `meetings.space.created`.

### Verifica OAuth con doctor

Esegui il doctor OAuth quando vuoi un controllo di integrità rapido e senza segreti:

```bash
openclaw googlemeet doctor --oauth --json
```

Questo non carica il runtime Chrome e non richiede un nodo Chrome connesso.
Verifica che la configurazione OAuth esista e che il refresh token possa generare
un access token. Il report JSON include solo campi di stato come `ok`, `configured`,
`tokenSource`, `expiresAt` e messaggi di controllo; non stampa l'access token, il
refresh token o il client secret.

Risultati comuni:

| Verifica             | Significato                                                                            |
| -------------------- | -------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` più `oauth.refreshToken`, oppure un token di accesso memorizzato nella cache, è presente. |
| `oauth-token`        | Il token di accesso memorizzato nella cache è ancora valido, oppure il token di aggiornamento ha emesso un nuovo token di accesso. |
| `meet-spaces-get`    | La verifica opzionale `--meeting` ha risolto uno spazio Meet esistente.                |
| `meet-spaces-create` | La verifica opzionale `--create-space` ha creato un nuovo spazio Meet.                 |

Per dimostrare anche l'abilitazione dell'API Google Meet e l'ambito `spaces.create`, esegui la
verifica di creazione con effetti collaterali:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` crea un URL Meet temporaneo. Usalo quando devi confermare
che il progetto Google Cloud abbia l'API Meet abilitata e che l'account
autorizzato abbia l'ambito `meetings.space.created`.

Per dimostrare l'accesso in lettura a uno spazio riunione esistente:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` e `resolve-space` dimostrano l'accesso in lettura a uno
spazio esistente a cui l'account Google autorizzato può accedere. Un `403` da queste verifiche
di solito significa che l'API REST di Google Meet è disabilitata, che al token di aggiornamento
con consenso manca l'ambito richiesto, oppure che l'account Google non può accedere a quello
spazio Meet. Un errore del token di aggiornamento significa rieseguire `openclaw googlemeet auth login
--json` e salvare il nuovo blocco `oauth`.

Non sono necessarie credenziali OAuth per il fallback del browser. In quella modalità, l'autenticazione Google
proviene dal profilo Chrome con accesso effettuato sul nodo selezionato, non dalla
configurazione OpenClaw.

Queste variabili d'ambiente sono accettate come fallback:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` o `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` o `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` o `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` o `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` o
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` o `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` o `GOOGLE_MEET_PREVIEW_ACK`

Risolvi un URL Meet, un codice o `spaces/{id}` tramite `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Esegui il preflight prima del lavoro multimediale:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Elenca gli artefatti della riunione e le presenze dopo che Meet ha creato i record della conferenza:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Con `--meeting`, `artifacts` e `attendance` usano per impostazione predefinita il record della conferenza
più recente. Passa `--all-conference-records` quando vuoi ogni record conservato
per quella riunione.

La ricerca nel calendario può risolvere l'URL della riunione da Google Calendar prima di leggere
gli artefatti Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` cerca nel calendario `primary` di oggi un evento Calendar con un
link Google Meet. Usa `--event <query>` per cercare testo evento corrispondente e
`--calendar <id>` per un calendario non primario. La ricerca nel calendario richiede un nuovo
accesso OAuth che includa l'ambito di sola lettura degli eventi Calendar.
`calendar-events` mostra un'anteprima degli eventi Meet corrispondenti e contrassegna l'evento che
`latest`, `artifacts`, `attendance` o `export` sceglierà.

Se conosci già l'id del record della conferenza, indirizzalo direttamente:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Termina una conferenza attiva per uno spazio creato dall'API quando vuoi chiudere la
stanza dopo la chiamata:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Questo chiama Google Meet `spaces.endActiveConference` e richiede OAuth con l'ambito
`meetings.space.created` per uno spazio che l'account autorizzato può gestire.
OpenClaw accetta un URL Meet, un codice riunione o un input `spaces/{id}` e lo risolve
nella risorsa spazio API prima di terminare la conferenza attiva.
È separato da `googlemeet leave`: `leave` interrompe la partecipazione locale/di sessione
di OpenClaw, mentre `end-active-conference` chiede a Google Meet di terminare la conferenza attiva
per lo spazio.

Scrivi un report leggibile:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` restituisce i metadati del record della conferenza più i metadati delle risorse di partecipanti, registrazioni,
trascrizioni, voci di trascrizione strutturate e note intelligenti quando
Google li espone per la riunione. Usa `--no-transcript-entries` per saltare
la ricerca delle voci per riunioni di grandi dimensioni. `attendance` espande i partecipanti in
righe di sessione partecipante con orari di prima/ultima visualizzazione, durata totale della sessione,
flag di ritardo/uscita anticipata e risorse partecipante duplicate unite per utente con accesso effettuato
o nome visualizzato. Passa `--no-merge-duplicates` per mantenere separate le risorse partecipante
grezze, `--late-after-minutes` per regolare il rilevamento dei ritardi e
`--early-before-minutes` per regolare il rilevamento dell'uscita anticipata.

`export` scrive una cartella contenente `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` e `manifest.json`.
`manifest.json` registra l'input scelto, le opzioni di esportazione, i record della conferenza,
i file di output, i conteggi, l'origine del token, l'evento Calendar quando ne è stato usato uno e qualsiasi
avviso di recupero parziale. Passa `--zip` per scrivere anche un archivio portatile accanto
alla cartella. Passa `--include-doc-bodies` per esportare il testo dei documenti Google collegati di trascrizioni e
note intelligenti tramite Google Drive `files.export`; questo richiede un
nuovo accesso OAuth che includa l'ambito di sola lettura Drive Meet. Senza
`--include-doc-bodies`, le esportazioni includono solo metadati Meet e voci di trascrizione
strutturate. Se Google restituisce un errore parziale degli artefatti, come un errore di elenco
delle note intelligenti, di voce di trascrizione o di corpo del documento Drive, il riepilogo e il
manifest mantengono l'avviso invece di far fallire l'intera esportazione.
Usa `--dry-run` per recuperare gli stessi dati di artefatti/presenze e stampare il
JSON del manifest senza creare la cartella o lo ZIP. È utile prima di scrivere
una grande esportazione o quando un agente ha bisogno solo di conteggi, record selezionati e
avvisi.

Gli agenti possono creare lo stesso bundle anche tramite lo strumento `google_meet`:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Imposta `"dryRun": true` per restituire solo il manifest di esportazione e saltare le scritture dei file.

Gli agenti possono anche creare una stanza supportata dall'API con un criterio di accesso esplicito:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

E possono terminare la conferenza attiva per una stanza nota:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Per una validazione con ascolto preliminare, gli agenti dovrebbero usare `test_listen` prima di affermare che la
riunione è utile:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Esegui il live smoke protetto su una riunione reale conservata:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Esegui il probe live del browser con ascolto preliminare su una riunione in cui qualcuno
parlerà con sottotitoli Meet disponibili:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Ambiente live smoke:

- `OPENCLAW_LIVE_TEST=1` abilita i test live protetti.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` punta a un URL Meet, codice o
  `spaces/{id}` conservato.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` o `GOOGLE_MEET_CLIENT_ID` fornisce l'id client OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` o `GOOGLE_MEET_REFRESH_TOKEN` fornisce
  il token di aggiornamento.
- Opzionale: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` e
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` usano gli stessi nomi di fallback
  senza il prefisso `OPENCLAW_`.

Il live smoke di base per artefatti/presenze richiede
`https://www.googleapis.com/auth/meetings.space.readonly` e
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. La ricerca nel calendario
richiede `https://www.googleapis.com/auth/calendar.events.readonly`. L'esportazione del corpo dei documenti Drive
richiede
`https://www.googleapis.com/auth/drive.meet.readonly`.

Crea un nuovo spazio Meet:

```bash
openclaw googlemeet create
```

Il comando stampa il nuovo `meeting uri`, l'origine e la sessione di accesso. Con le credenziali OAuth
usa l'API Google Meet ufficiale. Senza credenziali OAuth
usa come fallback il profilo browser con accesso effettuato del nodo Chrome fissato. Gli agenti possono
usare lo strumento `google_meet` con `action: "create"` per creare e accedere in un solo
passaggio. Per la creazione solo URL, passa `"join": false`.

Esempio di output JSON dal fallback del browser:

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Se il fallback del browser incontra il login Google o un blocco di permessi Meet prima di
poter creare l'URL, il metodo Gateway restituisce una risposta non riuscita e lo
strumento `google_meet` restituisce dettagli strutturati invece di una stringa semplice:

```json
{
  "source": "browser",
  "error": "google-login-required: Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

Quando un agente vede `manualActionRequired: true`, deve riportare il
`manualActionMessage` più il contesto nodo/scheda del browser e smettere di aprire nuove
schede Meet finché l'operatore non completa il passaggio nel browser.

Esempio di output JSON dalla creazione tramite API:

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

La creazione di un Meet accede alla riunione per impostazione predefinita. Il trasporto Chrome o Chrome-node richiede comunque
un profilo Google Chrome con accesso eseguito per partecipare tramite il browser. Se il
profilo non ha effettuato l'accesso, OpenClaw segnala `manualActionRequired: true` o un
errore di fallback del browser e chiede all'operatore di completare l'accesso a Google prima di
riprovare.

Imposta `preview.enrollmentAcknowledged: true` solo dopo aver confermato che il tuo progetto Cloud,
il principale OAuth e i partecipanti alla riunione sono iscritti al Google
Workspace Developer Preview Program per le API multimediali di Meet.

## Configurazione

Il percorso comune dell'agente Chrome richiede solo il plugin abilitato, BlackHole, SoX, una
chiave del provider di trascrizione realtime e un provider TTS OpenClaw configurato.
OpenAI è il provider di trascrizione predefinito; imposta `realtime.voiceProvider` su
`"google"` e `realtime.model` per usare Google Gemini Live per la modalità `bidi`
senza modificare il provider di trascrizione predefinito della modalità agente:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Imposta la configurazione del plugin in `plugins.entries.google-meet.config`:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Valori predefiniti:

- `defaultTransport: "chrome"`
- `defaultMode: "agent"` (`"realtime"` è accettato solo come alias di compatibilità
  legacy per `"agent"`; le nuove chiamate agli strumenti dovrebbero indicare `"agent"`)
- `chromeNode.node`: id/nome/IP opzionale del nodo per `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nome usato nella schermata ospite di Meet senza accesso
  eseguito
- `chrome.autoJoin: true`: compilazione best-effort del nome ospite e clic su Partecipa ora
  tramite l'automazione del browser OpenClaw su `chrome-node`
- `chrome.reuseExistingTab: true`: attiva una scheda Meet esistente invece di
  aprire duplicati
- `chrome.waitForInCallMs: 20000`: attende che la scheda Meet segnali di essere in chiamata
  prima di attivare l'introduzione talk-back
- `chrome.audioFormat: "pcm16-24khz"`: formato audio della coppia di comandi. Usa
  `"g711-ulaw-8khz"` solo per coppie di comandi legacy/personalizzate che emettono ancora
  audio telefonico.
- `chrome.audioBufferBytes: 4096`: buffer di elaborazione SoX per i comandi audio
  della coppia di comandi Chrome generati. È metà del buffer predefinito di SoX da 8192 byte,
  riducendo la latenza predefinita della pipe e lasciando margine per aumentarlo su host occupati.
  I valori inferiori al minimo di SoX vengono limitati a 17 byte.
- `chrome.audioInputCommand`: comando SoX che legge da CoreAudio `BlackHole 2ch`
  e scrive audio in `chrome.audioFormat`
- `chrome.audioOutputCommand`: comando SoX che legge audio in `chrome.audioFormat`
  e scrive su CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: comando opzionale del microfono locale che scrive
  PCM mono little-endian firmato a 16 bit per il rilevamento dell'interruzione umana mentre
  la riproduzione dell'assistente è attiva. Attualmente si applica al bridge della coppia di comandi
  `chrome` ospitato dal Gateway.
- `chrome.bargeInRmsThreshold: 650`: livello RMS che conta come interruzione umana
  su `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: livello di picco che conta come interruzione umana
  su `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: ritardo minimo tra cancellazioni ripetute di
  interruzioni umane
- `mode: "agent"`: modalità talk-back predefinita. Il parlato dei partecipanti viene trascritto dal
  provider di trascrizione realtime configurato, inviato all'agente OpenClaw configurato
  in una sessione di sub-agente per riunione e riprodotto vocalmente tramite il normale
  runtime TTS di OpenClaw.
- `mode: "bidi"`: modalità fallback diretta del modello realtime bidirezionale. Il
  provider vocale realtime risponde direttamente al parlato dei partecipanti e può chiamare
  `openclaw_agent_consult` per risposte più approfondite/supportate da strumenti.
- `mode: "transcribe"`: modalità di sola osservazione senza bridge talk-back.
- `realtime.provider: "openai"`: fallback di compatibilità usato quando i campi
  provider con ambito sottostanti non sono impostati.
- `realtime.transcriptionProvider: "openai"`: id del provider usato dalla modalità `agent`
  per la trascrizione realtime.
- `realtime.voiceProvider`: id del provider usato dalla modalità `bidi` per la voce realtime
  diretta. Impostalo su `"google"` per usare Gemini Live mantenendo la trascrizione
  in modalità agente su OpenAI.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: brevi risposte parlate, con
  `openclaw_agent_consult` per risposte più approfondite
- `realtime.introMessage`: breve controllo di prontezza parlato quando il bridge realtime
  si connette; impostalo su `""` per partecipare in silenzio
- `realtime.agentId`: id agente OpenClaw opzionale per
  `openclaw_agent_consult`; valore predefinito `main`

Override opzionali:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  browser: {
    defaultProfile: "openclaw",
  },
  chrome: {
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
    bargeInInputCommand: [
      "sox",
      "-q",
      "-t",
      "coreaudio",
      "External Microphone",
      "-r",
      "24000",
      "-c",
      "1",
      "-b",
      "16",
      "-e",
      "signed-integer",
      "-t",
      "raw",
      "-",
    ],
  },
  chromeNode: {
    node: "parallels-macos",
  },
  defaultMode: "agent",
  realtime: {
    provider: "openai",
    transcriptionProvider: "openai",
    voiceProvider: "google",
    model: "gemini-2.5-flash-native-audio-preview-12-2025",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        speakerVoice: "Kore",
      },
    },
  },
}
```

ElevenLabs sia per l'ascolto sia per il parlato in modalità agente:

```json5
{
  messages: {
    tts: {
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          modelId: "eleven_v3",
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        },
      },
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        config: {
          realtime: {
            transcriptionProvider: "elevenlabs",
            providers: {
              elevenlabs: {
                modelId: "scribe_v2_realtime",
                audioFormat: "ulaw_8000",
                sampleRate: 8000,
                commitStrategy: "vad",
              },
            },
          },
        },
      },
    },
  },
}
```

La voce persistente di Meet proviene da
`messages.tts.providers.elevenlabs.speakerVoiceId`. Le risposte dell'agente possono anche usare
direttive per risposta `[[tts:speakerVoiceId=... model=eleven_v3]]` quando gli override del modello TTS
sono abilitati, ma la configurazione è il valore predefinito deterministico per le riunioni.
All'accesso, i log dovrebbero mostrare `transcriptionProvider=elevenlabs` e ogni
risposta parlata dovrebbe registrare `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>`.

Configurazione solo Twilio:

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

`voiceCall.enabled` ha valore predefinito `true`; con il trasporto Twilio delega la
chiamata PSTN effettiva, il DTMF e il saluto introduttivo al plugin Voice Call. Voice Call
riproduce la sequenza DTMF prima di aprire lo stream multimediale realtime, poi usa il
testo introduttivo salvato come saluto realtime iniziale. Se `voice-call` non è
abilitato, Google Meet può comunque convalidare e registrare il piano di composizione, ma non può
effettuare la chiamata Twilio.

## Strumento

Gli agenti possono usare lo strumento `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Usa `transport: "chrome"` quando Chrome viene eseguito sull'host Gateway. Usa
`transport: "chrome-node"` quando Chrome viene eseguito su un nodo associato, come una VM Parallels.
In entrambi i casi i provider di modelli e `openclaw_agent_consult` vengono eseguiti sull'host
Gateway, quindi le credenziali dei modelli restano lì. Con il valore predefinito `mode: "agent"`,
il provider di trascrizione realtime gestisce l'ascolto, l'agente OpenClaw configurato
produce la risposta e il normale TTS di OpenClaw la pronuncia in Meet. Usa
`mode: "bidi"` quando vuoi che il modello vocale realtime risponda direttamente.
Il `mode: "realtime"` grezzo resta accettato come alias di compatibilità legacy per
`mode: "agent"`, ma non è più pubblicizzato nello schema dello strumento agente.
I log della modalità agente includono il provider/modello di trascrizione risolto all'avvio del bridge
e il provider TTS, il modello, la voce, il formato di output e la frequenza di campionamento dopo
ogni risposta sintetizzata.

Usa `action: "status"` per elencare le sessioni attive o ispezionare un ID sessione. Usa
`action: "speak"` con `sessionId` e `message` per far parlare immediatamente l'agente realtime.
Usa `action: "test_speech"` per creare o riusare la sessione,
attivare una frase nota e restituire lo stato di salute `inCall` quando l'host Chrome può
segnalarlo. `test_speech` forza sempre `mode: "agent"` e fallisce se viene chiesto di
eseguire in `mode: "transcribe"` perché le sessioni di sola osservazione intenzionalmente non possono
emettere parlato. Il suo risultato `speechOutputVerified` si basa sull'aumento dei byte di output audio
realtime durante questa chiamata di test, quindi una sessione riusata con audio precedente
non conta come nuovo controllo vocale riuscito. Usa `action: "leave"` per contrassegnare
una sessione come terminata.

`status` include lo stato di salute di Chrome quando disponibile:

- `inCall`: Chrome sembra essere all'interno della chiamata Meet
- `micMuted`: stato best-effort del microfono Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: il
  profilo del browser richiede accesso manuale, ammissione da parte dell'host Meet, autorizzazioni o
  riparazione del controllo browser prima che il parlato possa funzionare
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: indica se
  il parlato Chrome gestito è consentito ora. `speechReady: false` significa che OpenClaw non ha
  inviato la frase introduttiva/di test nel bridge audio.
- `providerConnected` / `realtimeReady`: stato del bridge vocale realtime
- `lastInputAt` / `lastOutputAt`: ultimo audio visto dal bridge o inviato al bridge
- `audioOutputRouted` / `audioOutputDeviceLabel`: indica se l'output multimediale della scheda Meet
  è stato instradato attivamente al dispositivo BlackHole usato dal bridge
- `lastSuppressedInputAt` / `suppressedInputBytes`: input local loopback ignorato mentre
  la riproduzione dell'assistente è attiva

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Modalità agente e bidi

La modalità Chrome `agent` è ottimizzata per il comportamento "il mio agente è nella riunione". Il
provider di trascrizione realtime ascolta l'audio della riunione, le trascrizioni finali dei partecipanti
vengono instradate attraverso l'agente OpenClaw configurato e la risposta viene
pronunciata tramite il normale runtime TTS di OpenClaw. Imposta `mode: "bidi"` quando vuoi
che il modello vocale realtime risponda direttamente.
I frammenti vicini della trascrizione finale vengono accorpati prima della consultazione, così un turno
parlato non produce diverse risposte parziali obsolete. Anche l'input realtime viene
soppresso mentre l'audio dell'assistente in coda è ancora in riproduzione,
e gli echi recenti di trascrizioni simili all'assistente vengono ignorati prima della consultazione dell'agente
così il local loopback di BlackHole non fa rispondere all'agente il proprio parlato.

| Modalità | Chi decide la risposta        | Percorso di output vocale              | Quando usarla                                          |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | L'agente OpenClaw configurato | Normale runtime TTS di OpenClaw        | Vuoi il comportamento "il mio agente è nella riunione" |
| `bidi`  | Il modello vocale realtime    | Risposta audio del provider vocale realtime | Vuoi il loop vocale conversazionale a latenza minima |

In modalità `bidi`, quando il modello realtime richiede ragionamento più approfondito, informazioni
aggiornate o i normali strumenti OpenClaw, può chiamare `openclaw_agent_consult`.

Lo strumento consult esegue dietro le quinte il normale agente OpenClaw con il contesto recente della trascrizione della riunione e restituisce una risposta parlata concisa. In modalità `agent`, OpenClaw invia quella risposta direttamente al runtime TTS; in modalità `bidi`, il modello vocale realtime può pronunciare il risultato di consult nella riunione. Usa lo stesso meccanismo condiviso di consult di Voice Call.

Per impostazione predefinita, le consultazioni vengono eseguite sull'agente `main`. Imposta `realtime.agentId` quando una corsia Meet deve consultare un'area di lavoro, impostazioni predefinite del modello, policy degli strumenti, memoria e cronologia della sessione di un agente OpenClaw dedicato.

Le consultazioni in modalità agente usano una chiave di sessione per riunione `agent:<id>:subagent:google-meet:<session>`, così le domande successive mantengono il contesto della riunione ereditando al contempo la normale policy dell'agente dall'agente configurato.

`realtime.toolPolicy` controlla l'esecuzione di consult:

- `safe-read-only`: espone lo strumento consult e limita il normale agente a
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e
  `memory_get`.
- `owner`: espone lo strumento consult e lascia che il normale agente usi la normale policy degli strumenti dell'agente.
- `none`: non espone lo strumento consult al modello vocale realtime.

La chiave di sessione di consult ha ambito per sessione Meet, quindi le chiamate consult successive possono riutilizzare il contesto consult precedente durante la stessa riunione.

Per forzare un controllo di prontezza parlato dopo che Chrome ha partecipato completamente alla chiamata:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Per lo smoke completo di partecipazione e parlato:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Checklist dei test live

Usa questa sequenza prima di affidare una riunione a un agente non presidiato:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Stato Chrome-node previsto:

- `googlemeet setup` è tutto verde.
- `googlemeet setup` include `chrome-node-connected` quando Chrome-node è il trasporto predefinito o un nodo è fissato.
- `nodes status` mostra il nodo selezionato connesso.
- Il nodo selezionato pubblicizza sia `googlemeet.chrome` sia `browser.proxy`.
- La scheda Meet partecipa alla chiamata e `test-speech` restituisce lo stato di integrità di Chrome con
  `inCall: true`.

Per un host Chrome remoto, ad esempio una VM macOS Parallels, questo è il controllo sicuro più breve dopo l'aggiornamento del Gateway o della VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Questo dimostra che il Plugin Gateway è caricato, che il nodo VM è connesso con il token corrente e che il bridge audio Meet è disponibile prima che un agente apra una vera scheda di riunione.

Per uno smoke Twilio, usa una riunione che espone i dettagli di accesso telefonico:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Stato Twilio previsto:

- `googlemeet setup` include controlli verdi `twilio-voice-call-plugin`,
  `twilio-voice-call-credentials` e `twilio-voice-call-webhook`.
- `voicecall` è disponibile nella CLI dopo il ricaricamento del Gateway.
- La sessione restituita ha `transport: "twilio"` e un `twilio.voiceCallId`.
- `openclaw logs --follow` mostra il TwiML DTMF servito prima del TwiML realtime, quindi un bridge realtime con il saluto iniziale in coda.
- `googlemeet leave <sessionId>` termina la chiamata vocale delegata.

## Risoluzione dei problemi

### L'agente non riesce a vedere lo strumento Google Meet

Conferma che il plugin sia abilitato nella configurazione del Gateway e ricarica il Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Se hai appena modificato `plugins.entries.google-meet`, riavvia o ricarica il Gateway.
L'agente in esecuzione vede solo gli strumenti dei plugin registrati dal processo Gateway corrente.

Sugli host Gateway non macOS, lo strumento `google_meet` rivolto all'agente resta visibile, ma le azioni locali di talk-back di Chrome vengono bloccate prima di raggiungere il bridge audio.
L'audio talk-back locale di Chrome attualmente dipende da `BlackHole 2ch` di macOS, quindi gli agenti Linux dovrebbero usare `mode: "transcribe"`, l'accesso telefonico Twilio o un host `chrome-node` macOS invece del percorso agente Chrome locale predefinito.

### Nessun nodo compatibile con Google Meet connesso

Sull'host del nodo, esegui:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Sull'host Gateway, approva il nodo e verifica i comandi:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Il nodo deve essere connesso ed elencare `googlemeet.chrome` più `browser.proxy`.
La configurazione del Gateway deve consentire questi comandi del nodo:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Se `googlemeet setup` non supera `chrome-node-connected` o il log del Gateway segnala
`gateway token mismatch`, reinstalla o riavvia il nodo con il token Gateway
corrente. Per un Gateway LAN questo di solito significa:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Poi ricarica il servizio del nodo ed esegui di nuovo:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Il browser si apre ma l'agente non riesce a partecipare

Esegui `googlemeet test-listen` per partecipazioni in sola osservazione o `googlemeet test-speech`
per partecipazioni in tempo reale, quindi esamina lo stato di salute di Chrome restituito. Se una delle due sonde
segnala `manualActionRequired: true`, mostra `manualActionMessage` all'operatore
e interrompi i tentativi finché l'azione nel browser non è completa.

Azioni manuali comuni:

- Accedi al profilo Chrome.
- Ammetti l'ospite dall'account host di Meet.
- Concedi a Chrome le autorizzazioni per microfono/fotocamera quando compare la richiesta di autorizzazione
  nativa di Chrome.
- Chiudi o correggi una finestra di autorizzazione Meet bloccata.

Non segnalare "accesso non effettuato" solo perché Meet mostra "Vuoi che gli altri possano
sentirti nella riunione?" Quello è l'interstitial di scelta audio di Meet; OpenClaw
fa clic su **Usa microfono** tramite automazione del browser quando disponibile e continua
ad attendere il vero stato della riunione. Per il fallback del browser di sola creazione, OpenClaw
può fare clic su **Continua senza microfono** perché la creazione dell'URL non richiede
il percorso audio in tempo reale.

### La creazione della riunione non riesce

`googlemeet create` usa prima l'endpoint Google Meet API `spaces.create`
quando le credenziali OAuth sono configurate. Senza credenziali OAuth ripiega
sul browser del nodo Chrome fissato. Conferma:

- Per la creazione tramite API: `oauth.clientId` e `oauth.refreshToken` sono configurati,
  oppure sono presenti variabili d'ambiente `OPENCLAW_GOOGLE_MEET_*` corrispondenti.
- Per la creazione tramite API: il token di aggiornamento è stato generato dopo l'aggiunta
  del supporto alla creazione. I token più vecchi potrebbero non avere lo scope `meetings.space.created`; riesegui
  `openclaw googlemeet auth login --json` e aggiorna la configurazione del plugin.
- Per il fallback del browser: `defaultTransport: "chrome-node"` e
  `chromeNode.node` puntano a un nodo connesso con `browser.proxy` e
  `googlemeet.chrome`.
- Per il fallback del browser: il profilo Chrome di OpenClaw su quel nodo ha effettuato l'accesso
  a Google e può aprire `https://meet.google.com/new`.
- Per il fallback del browser: i tentativi riutilizzano una scheda esistente `https://meet.google.com/new`
  o una scheda di richiesta dell'account Google prima di aprire una nuova scheda. Se un agente va in timeout,
  riprova la chiamata allo strumento invece di aprire manualmente un'altra scheda Meet.
- Per il fallback del browser: se lo strumento restituisce `manualActionRequired: true`, usa
  `browser.nodeId`, `browser.targetId`, `browserUrl` e
  `manualActionMessage` restituiti per guidare l'operatore. Non riprovare in ciclo finché tale
  azione non è completa.
- Per il fallback del browser: se Meet mostra "Vuoi che gli altri possano sentirti nella
  riunione?", lascia aperta la scheda. OpenClaw dovrebbe fare clic su **Usa microfono** oppure, per
  il fallback di sola creazione, su **Continua senza microfono** tramite automazione del
  browser e continuare ad attendere l'URL Meet generato. Se non ci riesce, l'errore
  dovrebbe menzionare `meet-audio-choice-required`, non `google-login-required`.

### L'agente partecipa ma non parla

Controlla il percorso in tempo reale:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Usa `mode: "agent"` per il normale percorso STT -> agente OpenClaw -> risposta vocale TTS,
oppure `mode: "bidi"` per il fallback vocale diretto in tempo reale. `mode: "transcribe"`
intenzionalmente non avvia il bridge di risposta vocale. Per il debug in sola osservazione,
esegui `openclaw googlemeet status --json <session-id>` dopo che i partecipanti hanno parlato
e controlla `captioning`, `transcriptLines` e `lastCaptionText`. Se `inCall` è
true ma `transcriptLines` rimane a `0`, i sottotitoli di Meet potrebbero essere disabilitati, nessuno
ha parlato da quando l'osservatore è stato installato, l'interfaccia utente di Meet è cambiata oppure i
sottotitoli live non sono disponibili per la lingua/account della riunione.

`googlemeet test-speech` controlla sempre il percorso in tempo reale e segnala se
sono stati osservati byte di output del bridge per quella invocazione. Se `speechOutputVerified` è false e
`speechOutputTimedOut` è true, il provider in tempo reale potrebbe aver accettato
l'enunciato ma OpenClaw non ha visto nuovi byte di output raggiungere il bridge audio
di Chrome.

Verifica anche:

- Una chiave del provider in tempo reale è disponibile sull'host Gateway, come
  `OPENAI_API_KEY` o `GEMINI_API_KEY`.
- `BlackHole 2ch` è visibile sull'host Chrome.
- `sox` esiste sull'host Chrome.
- Il microfono e l'altoparlante di Meet sono instradati attraverso il percorso audio virtuale usato da
  OpenClaw. `doctor` dovrebbe mostrare `meet output routed: yes` per partecipazioni in tempo reale
  con Chrome locale.

`googlemeet doctor [session-id]` stampa sessione, nodo, stato in chiamata,
motivo dell'azione manuale, connessione del provider in tempo reale, `realtimeReady`, attività
audio di input/output, ultimi timestamp audio, contatori di byte e URL del browser.
Usa `googlemeet status [session-id] --json` quando hai bisogno del JSON grezzo. Usa
`googlemeet doctor --oauth` quando devi verificare l'aggiornamento OAuth di Google Meet
senza esporre token; aggiungi `--meeting` o `--create-space` quando ti serve anche
una prova dell'API Google Meet.

Se un agente è andato in timeout e puoi vedere una scheda Meet già aperta, esamina quella scheda
senza aprirne un'altra:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

L'azione strumento equivalente è `recover_current_tab`. Porta in primo piano ed esamina una
scheda Meet esistente per il trasporto selezionato. Con `chrome`, usa il controllo del browser
locale tramite il Gateway; con `chrome-node`, usa il nodo Chrome configurato. Non
apre una nuova scheda né crea una nuova sessione; segnala il blocco corrente, come
accesso, ammissione, autorizzazioni o stato di scelta audio. Il comando CLI comunica con il
Gateway configurato, quindi il Gateway deve essere in esecuzione;
`chrome-node` richiede anche che il nodo Chrome sia connesso.

### I controlli di configurazione Twilio non riescono

`twilio-voice-call-plugin` non riesce quando `voice-call` non è consentito o non è abilitato.
Aggiungilo a `plugins.allow`, abilita `plugins.entries.voice-call` e ricarica il
Gateway.

`twilio-voice-call-credentials` non riesce quando al backend Twilio mancano SID account,
token di autenticazione o numero chiamante. Impostali sull'host Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` non riesce quando `voice-call` non ha esposizione Webhook
pubblica, oppure quando `publicUrl` punta al loopback o a uno spazio di rete privato.
Imposta `plugins.entries.voice-call.config.publicUrl` sull'URL pubblico del provider oppure
configura un'esposizione tunnel/Tailscale per `voice-call`.

Gli URL di loopback e privati non sono validi per i callback degli operatori. Non usare
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` o `fd00::/8` come `publicUrl`.

Per un URL pubblico stabile:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          fromNumber: "+15550001234",
          publicUrl: "https://voice.example.com/voice/webhook",
        },
      },
    },
  },
}
```

Per lo sviluppo locale, usa un tunnel o un'esposizione Tailscale invece di un URL
host privato:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Poi riavvia o ricarica il Gateway ed esegui:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` per impostazione predefinita verifica solo la disponibilità. Per eseguire una prova senza effetti su un numero specifico:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Aggiungi `--yes` solo quando vuoi intenzionalmente effettuare una chiamata di
notifica in uscita reale:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### La chiamata Twilio parte ma non entra mai nella riunione

Conferma che l'evento Meet esponga i dettagli di accesso telefonico. Passa il
numero di accesso telefonico e il PIN esatti oppure una sequenza DTMF personalizzata:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Usa `w` iniziali o virgole in `--dtmf-sequence` se il provider richiede una pausa
prima di inserire il PIN.

Se la chiamata telefonica viene creata ma l'elenco dei partecipanti Meet non mostra mai il
partecipante con accesso telefonico:

- Esegui `openclaw googlemeet doctor <session-id>` per confermare l'ID chiamata
  Twilio delegata, se il DTMF è stato messo in coda e se è stato richiesto il saluto introduttivo.
- Esegui `openclaw voicecall status --call-id <id>` e conferma che la chiamata sia ancora
  attiva.
- Esegui `openclaw voicecall tail` e verifica che i Webhook Twilio arrivino al
  Gateway.
- Esegui `openclaw logs --follow` e cerca la sequenza Twilio Meet: Google
  Meet delega l'accesso, Voice Call archivia e serve il TwiML DTMF pre-connessione,
  Voice Call serve il TwiML in tempo reale per la chiamata Twilio, poi Google Meet richiede
  il parlato introduttivo con `voicecall.speak`.
- Riesegui `openclaw googlemeet setup --transport twilio`; è richiesto un controllo di configurazione
  verde, ma non dimostra che la sequenza del PIN della riunione sia corretta.
- Conferma che il numero di accesso telefonico appartenga allo stesso invito Meet e alla stessa regione del
  PIN.
- Aumenta `voiceCall.dtmfDelayMs` rispetto al valore predefinito di 12 secondi se Meet risponde
  lentamente o se la trascrizione della chiamata mostra ancora il prompt che chiede un PIN dopo
  l'invio del DTMF pre-connessione.
- Se il partecipante entra ma non senti il saluto, controlla
  `openclaw logs --follow` per la richiesta post-DTMF `voicecall.speak` e
  la riproduzione TTS tramite media-stream oppure il fallback Twilio `<Say>`. Se la trascrizione della chiamata
  contiene ancora "enter the meeting PIN", il ramo telefonico non è ancora entrato
  nella stanza Meet, quindi i partecipanti alla riunione non sentiranno il parlato.

Se i Webhook non arrivano, esegui prima il debug del Plugin Voice Call: il provider deve
raggiungere `plugins.entries.voice-call.config.publicUrl` o il tunnel configurato.
Consulta [Risoluzione dei problemi delle chiamate vocali](/it/plugins/voice-call#troubleshooting).

## Note

L'API media ufficiale di Google Meet è orientata alla ricezione, quindi parlare in una
chiamata Meet richiede comunque un percorso partecipante. Questo Plugin mantiene visibile
quel confine: Chrome gestisce la partecipazione tramite browser e l'instradamento audio locale; Twilio gestisce
la partecipazione tramite accesso telefonico.

Le modalità talk-back di Chrome richiedono `BlackHole 2ch` più una delle seguenti opzioni:

- `chrome.audioInputCommand` più `chrome.audioOutputCommand`: OpenClaw possiede il
  bridge e convoglia l'audio in `chrome.audioFormat` tra quei comandi e il
  provider selezionato. La modalità agente usa trascrizione in tempo reale più TTS normale;
  la modalità bidi usa il provider vocale in tempo reale. Il percorso Chrome predefinito è PCM16 a 24 kHz
  con `chrome.audioBufferBytes: 4096`; G.711 mu-law a 8 kHz rimane
  disponibile per le coppie di comandi legacy.
- `chrome.audioBridgeCommand`: un comando bridge esterno possiede l'intero
  percorso audio locale e deve terminare dopo aver avviato o validato il proprio daemon. Questo è
  valido solo per `bidi` perché la modalità `agent` richiede accesso diretto alla coppia di comandi per il TTS.

Quando un agente chiama lo strumento `google_meet` in modalità agente, la sessione consulente
della riunione biforca la trascrizione corrente del chiamante prima di rispondere al parlato
dei partecipanti. La sessione Meet rimane comunque separata (`agent:<agentId>:subagent:google-meet:<sessionId>`)
così i follow-up della riunione non modificano direttamente la trascrizione del chiamante.

Per un audio duplex pulito, instrada l'output Meet e il microfono Meet attraverso dispositivi
virtuali separati o un grafo di dispositivi virtuali in stile Loopback. Un singolo dispositivo
BlackHole condiviso può rimandare l'eco degli altri partecipanti nella chiamata.

Con il bridge Chrome a coppia di comandi, `chrome.bargeInInputCommand` può ascoltare un
microfono locale separato e cancellare la riproduzione dell'assistente quando l'umano inizia
a parlare. Questo mantiene il parlato umano davanti all'output dell'assistente anche quando l'input
BlackHole loopback condiviso viene temporaneamente soppresso durante la riproduzione dell'assistente.
Come `chrome.audioInputCommand` e `chrome.audioOutputCommand`, è un
comando locale configurato dall'operatore. Usa un percorso di comando attendibile esplicito o
un elenco di argomenti, e non puntarlo a script provenienti da posizioni non attendibili.

`googlemeet speak` attiva il bridge audio talk-back attivo per una sessione Chrome.
`googlemeet leave` arresta quel bridge. Per le sessioni Twilio delegate
tramite il Plugin Voice Call, `leave` chiude anche la chiamata vocale sottostante.
Usa `googlemeet end-active-conference` quando vuoi anche chiudere la conferenza
Google Meet attiva per uno spazio gestito dall'API.

## Correlati

- [Plugin Voice Call](/it/plugins/voice-call)
- [Modalità talk](/it/nodes/talk)
- [Creazione di Plugin](/it/plugins/building-plugins)
