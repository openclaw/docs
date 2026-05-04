---
read_when:
    - Vous voulez qu’un agent OpenClaw rejoigne un appel Google Meet
    - Vous souhaitez qu’un agent OpenClaw crée un nouvel appel Google Meet
    - Vous configurez Chrome, un nœud Chrome ou Twilio comme transport Google Meet
summary: 'Plugin Google Meet : rejoindre des URL Meet explicites via Chrome ou Twilio avec les paramètres par défaut de voix en temps réel'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-04T02:25:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 77ab70d27d47bcc037144c7c6cfad6f93f307355b6ebcf3ee75c85b96a24af2f
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet participant support for OpenClaw — the plugin is explicit by design:

- It only joins an explicit `https://meet.google.com/...` URL.
- It can create a new Meet space through the Google Meet API, then join the
  returned URL.
- `realtime` voice is the default mode.
- Realtime voice can call back into the full OpenClaw agent when deeper
  reasoning or tools are needed.
- Agents choose the join behavior with `mode`: use `realtime` for live
  listen/talk-back, or `transcribe` to join/control the browser without the
  realtime voice bridge.
- Auth starts as personal Google OAuth or an already signed-in Chrome profile.
- There is no automatic consent announcement.
- The default Chrome audio backend is `BlackHole 2ch`.
- Chrome can run locally or on a paired node host.
- Twilio accepts a dial-in number plus optional PIN or DTMF sequence; it
  cannot dial a Meet URL directly.
- The CLI command is `googlemeet`; `meet` is reserved for broader agent
  teleconference workflows.

## Quick start

Install the local audio dependencies and configure a backend realtime voice
provider. OpenAI is the default; Google Gemini Live also works with
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
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
openclaw googlemeet create --transport chrome-node --mode realtime
```

For API-created rooms, use Google Meet `SpaceConfig.accessType` when you want
the room's no-knock policy to be explicit instead of inherited from the Google
account defaults:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
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

Or tell an agent: "Create a Google Meet, join it with realtime voice, and send
me the link." The agent should call `google_meet` with `action: "create"` and
then share the returned `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
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

Pendant la connexion en temps réel, l’automatisation de navigateur OpenClaw renseigne le nom de l’invité, clique sur
Rejoindre/Demander à rejoindre, et accepte le choix de première exécution « Utiliser le micro » de Meet lorsque cette
invite apparaît. Pendant une connexion en observation seule ou une création de réunion uniquement dans le navigateur, elle
passe la même invite sans micro lorsque ce choix est disponible.
Si le profil de navigateur n’est pas connecté, si Meet attend l’admission par l’hôte,
si Chrome a besoin de l’autorisation micro/caméra pour une connexion en temps réel, ou si Meet est bloqué
sur une invite que l’automatisation n’a pas pu résoudre, le résultat join/test-speech signale
`manualActionRequired: true` avec `manualActionReason` et
`manualActionMessage`. Les agents doivent arrêter de retenter la connexion, signaler ce message exact
ainsi que les valeurs `browserUrl`/`browserTitle` actuelles, et réessayer uniquement après que
l’action manuelle dans le navigateur est terminée.

Si `chromeNode.node` est omis, OpenClaw effectue une sélection automatique uniquement lorsqu’exactement un
nœud connecté annonce à la fois `googlemeet.chrome` et le contrôle du navigateur. Si
plusieurs nœuds compatibles sont connectés, définissez `chromeNode.node` sur l’identifiant du nœud,
le nom d’affichage ou l’adresse IP distante.

Vérifications courantes en cas d’échec :

- `Configured Google Meet node ... is not usable: offline` : le nœud épinglé est
  connu du Gateway mais indisponible. Les agents doivent traiter ce nœud comme
  un état de diagnostic, pas comme un hôte Chrome utilisable, et signaler le blocage de configuration
  au lieu de basculer vers un autre transport sauf si l’utilisateur l’a demandé.
- `No connected Google Meet-capable node` : démarrez `openclaw node run` dans la VM,
  approuvez l’appairage, et vérifiez que `openclaw plugins enable google-meet` et
  `openclaw plugins enable browser` ont été exécutés dans la VM. Confirmez aussi que l’hôte
  Gateway autorise les deux commandes de nœud avec
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found` : installez `blackhole-2ch` sur l’hôte
  vérifié et redémarrez avant d’utiliser l’audio Chrome local.
- `BlackHole 2ch audio device not found on the node` : installez `blackhole-2ch`
  dans la VM et redémarrez la VM.
- Chrome s’ouvre mais ne peut pas rejoindre : connectez-vous au profil de navigateur dans la VM, ou
  conservez `chrome.guestName` défini pour une connexion invité. La connexion automatique en invité utilise l’automatisation
  de navigateur OpenClaw via le proxy de navigateur du nœud ; vérifiez que la configuration du navigateur du nœud
  pointe vers le profil voulu, par exemple
  `browser.defaultProfile: "user"` ou un profil de session existante nommé.
- Onglets Meet en double : laissez `chrome.reuseExistingTab: true` activé. OpenClaw
  active un onglet existant pour la même URL Meet avant d’en ouvrir un nouveau, et
  la création de réunion dans le navigateur réutilise un onglet `https://meet.google.com/new`
  ou une invite de compte Google en cours avant d’en ouvrir un autre.
- Pas d’audio : dans Meet, routez le micro/haut-parleur via le chemin de périphérique audio virtuel
  utilisé par OpenClaw ; utilisez des périphériques virtuels séparés ou un routage de type Loopback
  pour un audio duplex propre.

## Notes d’installation

La valeur par défaut de retour vocal Chrome utilise deux outils externes :

- `sox` : utilitaire audio en ligne de commande. Le Plugin utilise des commandes de périphérique
  CoreAudio explicites pour le pont audio PCM16 24 kHz par défaut.
- `blackhole-2ch` : pilote audio virtuel macOS. Il crée le périphérique audio `BlackHole 2ch`
  que Chrome/Meet peut utiliser pour le routage.

OpenClaw n’intègre ni ne redistribue aucun de ces paquets. La documentation demande aux utilisateurs de
les installer comme dépendances hôte via Homebrew. SoX est sous licence
`LGPL-2.0-only AND GPL-2.0-only` ; BlackHole est sous GPL-3.0. Si vous créez un
installateur ou une appliance qui intègre BlackHole avec OpenClaw, examinez les
conditions de licence amont de BlackHole ou obtenez une licence distincte auprès d’Existential Audio.

## Transports

### Chrome

Le transport Chrome ouvre l’URL Meet via le contrôle de navigateur OpenClaw et rejoint
avec le profil de navigateur OpenClaw connecté. Sur macOS, le Plugin vérifie la présence de
`BlackHole 2ch` avant le lancement. S’il est configuré, il exécute aussi une commande d’état de santé
du pont audio et une commande de démarrage avant d’ouvrir Chrome. Utilisez `chrome` lorsque
Chrome/audio s’exécutent sur l’hôte Gateway ; utilisez `chrome-node` lorsque Chrome/audio s’exécutent
sur un nœud appairé tel qu’une VM macOS Parallels. Pour Chrome local, choisissez le
profil avec `browser.defaultProfile` ; `chrome.browserProfile` est transmis aux hôtes
`chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Routez l’audio du micro et du haut-parleur Chrome via le pont audio OpenClaw local.
Si `BlackHole 2ch` n’est pas installé, la connexion échoue avec une erreur de configuration
au lieu de rejoindre silencieusement sans chemin audio.

### Twilio

Le transport Twilio est un plan de numérotation strict délégué au Plugin Voice Call. Il
n’analyse pas les pages Meet pour y chercher des numéros de téléphone.

Utilisez-le lorsque la participation Chrome n’est pas disponible ou si vous voulez une solution de secours
par appel téléphonique. Google Meet doit exposer un numéro d’appel et un PIN pour la
réunion ; OpenClaw ne les découvre pas depuis la page Meet.

Activez le Plugin Voice Call sur l’hôte Gateway, pas sur le nœud Chrome :

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
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
        },
      },
    },
  },
}
```

Fournissez les identifiants Twilio via l’environnement ou la configuration. L’environnement garde
les secrets hors de `openclaw.json` :

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Redémarrez ou rechargez le Gateway après avoir activé `voice-call` ; les changements de configuration du Plugin
n’apparaissent pas dans un processus Gateway déjà en cours d’exécution tant qu’il n’est pas rechargé.

Puis vérifiez :

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Lorsque la délégation Twilio est câblée, `googlemeet setup` inclut des vérifications
`twilio-voice-call-plugin`, `twilio-voice-call-credentials` et
`twilio-voice-call-webhook` réussies.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Utilisez `--dtmf-sequence` lorsque la réunion nécessite une séquence personnalisée :

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth et prévalidation

OAuth est facultatif pour créer un lien Meet, car `googlemeet create` peut se rabattre
sur l’automatisation de navigateur. Configurez OAuth lorsque vous voulez la création via l’API officielle,
la résolution d’espace, ou les vérifications de prévalidation Meet Media API.

L’accès à Google Meet API utilise l’OAuth utilisateur : créez un client OAuth Google Cloud,
demandez les portées requises, autorisez un compte Google, puis stockez le
jeton d’actualisation obtenu dans la configuration du Plugin Google Meet ou fournissez les
variables d’environnement `OPENCLAW_GOOGLE_MEET_*`.

OAuth ne remplace pas le chemin de connexion Chrome. Les transports Chrome et Chrome-node
rejoignent toujours via un profil Chrome connecté, BlackHole/SoX, et un nœud
connecté lorsque vous utilisez la participation par navigateur. OAuth sert uniquement au chemin officiel
Google Meet API : créer des espaces de réunion, résoudre des espaces, et exécuter les vérifications de prévalidation
Meet Media API.

### Créer les identifiants Google

Dans Google Cloud Console :

1. Créez ou sélectionnez un projet Google Cloud.
2. Activez **Google Meet REST API** pour ce projet.
3. Configurez l’écran de consentement OAuth.
   - **Internal** est le plus simple pour une organisation Google Workspace.
   - **External** fonctionne pour les configurations personnelles/de test ; tant que l’application est en phase Testing,
     ajoutez comme utilisateur de test chaque compte Google qui autorisera l’application.
4. Ajoutez les portées demandées par OpenClaw :
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Créez un ID client OAuth.
   - Type d’application : **Web application**.
   - URI de redirection autorisée :

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Copiez l’ID client et le secret client.

`meetings.space.created` est requis par `spaces.create` de Google Meet.
`meetings.space.readonly` permet à OpenClaw de résoudre les URL/codes Meet en espaces.
`meetings.space.settings` permet à OpenClaw de transmettre des paramètres `SpaceConfig` tels que
`accessType` pendant la création de salle via l’API.
`meetings.conference.media.readonly` sert à la prévalidation Meet Media API et au travail
média ; Google peut exiger l’inscription au Developer Preview pour l’utilisation réelle de Media API.
Si vous avez seulement besoin de connexions Chrome basées sur le navigateur, ignorez entièrement OAuth.

### Générer le jeton d’actualisation

Configurez `oauth.clientId` et éventuellement `oauth.clientSecret`, ou transmettez-les comme
variables d’environnement, puis exécutez :

```bash
openclaw googlemeet auth login --json
```

La commande affiche un bloc de configuration `oauth` avec un jeton d’actualisation. Elle utilise PKCE,
un rappel localhost sur `http://localhost:8085/oauth2callback`, et un flux manuel
copier/coller avec `--manual`.

Exemples :

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Utilisez le mode manuel lorsque le navigateur ne peut pas atteindre le rappel local :

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

La sortie JSON inclut :

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

Stockez l’objet `oauth` sous la configuration du Plugin Google Meet :

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

Préférez les variables d’environnement lorsque vous ne voulez pas le jeton d’actualisation dans la configuration.
Si des valeurs de configuration et d’environnement sont présentes, le Plugin résout d’abord la configuration,
puis utilise l’environnement en solution de repli.

Le consentement OAuth inclut la création d’espaces Meet, l’accès en lecture aux espaces Meet et l’accès
en lecture aux médias de conférence Meet. Si vous vous êtes authentifié avant l’existence de la prise en charge
de la création de réunions, réexécutez `openclaw googlemeet auth login --json` afin que le jeton d’actualisation
dispose de la portée `meetings.space.created`.

### Vérifier OAuth avec doctor

Exécutez le doctor OAuth lorsque vous voulez une vérification d’état rapide et sans secret :

```bash
openclaw googlemeet doctor --oauth --json
```

Cela ne charge pas le runtime Chrome et ne nécessite pas de nœud Chrome connecté. Il
vérifie que la configuration OAuth existe et que le jeton d’actualisation peut générer un jeton d’accès.
Le rapport JSON inclut uniquement des champs d’état tels que `ok`, `configured`,
`tokenSource`, `expiresAt`, et les messages de vérification ; il n’affiche pas le jeton d’accès,
le jeton d’actualisation ni le secret client.

Résultats courants :

| Vérification         | Signification                                                                            |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` plus `oauth.refreshToken`, ou un jeton d’accès mis en cache, est présent. |
| `oauth-token`        | Le jeton d’accès mis en cache est encore valide, ou le jeton d’actualisation a généré un nouveau jeton d’accès. |
| `meet-spaces-get`    | La vérification facultative `--meeting` a résolu un espace Meet existant.                |
| `meet-spaces-create` | La vérification facultative `--create-space` a créé un nouvel espace Meet.               |

Pour prouver également l’activation de Google Meet API et la portée `spaces.create`, exécutez la
vérification de création avec effet de bord :

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` crée une URL Meet jetable. Utilisez-le lorsque vous devez confirmer
que l'API Meet est activée pour le projet Google Cloud et que le compte autorisé
dispose du scope `meetings.space.created`.

Pour prouver l'accès en lecture à un espace de réunion existant :

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` et `resolve-space` prouvent l'accès en lecture à un
espace existant auquel le compte Google autorisé peut accéder. Un `403` renvoyé
par ces vérifications signifie généralement que l'API REST Google Meet est
désactivée, que le jeton d'actualisation accepté ne dispose pas du scope requis,
ou que le compte Google ne peut pas accéder à cet espace Meet. Une erreur de
jeton d'actualisation signifie qu'il faut relancer `openclaw googlemeet auth login
--json` et enregistrer le nouveau bloc `oauth`.

Aucun identifiant OAuth n'est nécessaire pour le fallback par navigateur. Dans
ce mode, l'authentification Google provient du profil Chrome connecté sur le
Node sélectionné, et non de la configuration OpenClaw.

Ces variables d'environnement sont acceptées comme fallbacks :

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` ou `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` ou `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` ou `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` ou `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` ou
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` ou `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` ou `GOOGLE_MEET_PREVIEW_ACK`

Résolvez une URL Meet, un code ou `spaces/{id}` via `spaces.get` :

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Exécutez le contrôle préalable avant les opérations média :

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Listez les artefacts de réunion et la présence après que Meet a créé les
enregistrements de conférence :

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Avec `--meeting`, `artifacts` et `attendance` utilisent par défaut le dernier
enregistrement de conférence. Passez `--all-conference-records` lorsque vous
voulez tous les enregistrements conservés pour cette réunion.

La recherche dans l'agenda peut résoudre l'URL de réunion depuis Google Calendar
avant de lire les artefacts Meet :

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` recherche dans le calendrier `primary` d'aujourd'hui un événement
Calendar avec un lien Google Meet. Utilisez `--event <query>` pour rechercher le
texte correspondant dans les événements, et `--calendar <id>` pour un calendrier
non principal. La recherche dans l'agenda nécessite une nouvelle connexion OAuth
incluant le scope en lecture seule des événements Calendar.
`calendar-events` prévisualise les événements Meet correspondants et marque
l'événement que `latest`, `artifacts`, `attendance` ou `export` choisira.

Si vous connaissez déjà l'id de l'enregistrement de conférence, ciblez-le
directement :

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Mettez fin à une conférence active pour un espace créé par l'API lorsque vous
voulez fermer la salle après l'appel :

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Cela appelle Google Meet `spaces.endActiveConference` et nécessite OAuth avec le
scope `meetings.space.created` pour un espace que le compte autorisé peut gérer.
OpenClaw accepte en entrée une URL Meet, un code de réunion ou `spaces/{id}`, et
le résout en ressource d'espace API avant de mettre fin à la conférence active.
Cette commande est distincte de `googlemeet leave` : `leave` arrête la
participation locale/de session d'OpenClaw, tandis que `end-active-conference`
demande à Google Meet de mettre fin à la conférence active pour l'espace.

Écrivez un rapport lisible :

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

`artifacts` renvoie les métadonnées de l'enregistrement de conférence ainsi que
les métadonnées des ressources de participants, d'enregistrements, de
transcriptions, d'entrées de transcription structurées et de notes intelligentes
lorsque Google les expose pour la réunion. Utilisez `--no-transcript-entries`
pour ignorer la recherche d'entrées pour les grandes réunions. `attendance`
développe les participants en lignes de sessions de participant avec les heures
de première et dernière présence, la durée totale de session, les indicateurs de
retard/départ anticipé, et les ressources de participant en double fusionnées
par utilisateur connecté ou nom d'affichage. Passez `--no-merge-duplicates` pour
conserver les ressources de participant brutes séparées, `--late-after-minutes`
pour ajuster la détection des retards, et `--early-before-minutes` pour ajuster
la détection des départs anticipés.

`export` écrit un dossier contenant `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` et `manifest.json`.
`manifest.json` enregistre l'entrée choisie, les options d'exportation, les
enregistrements de conférence, les fichiers de sortie, les compteurs, la source
du jeton, l'événement Calendar lorsqu'il a été utilisé, et tout avertissement de
récupération partielle. Passez `--zip` pour écrire également une archive
portable à côté du dossier. Passez `--include-doc-bodies` pour exporter le texte
des Google Docs liés de transcription et de notes intelligentes via Google Drive
`files.export` ; cela nécessite une nouvelle connexion OAuth incluant le scope
Drive Meet en lecture seule. Sans `--include-doc-bodies`, les exportations
incluent uniquement les métadonnées Meet et les entrées de transcription
structurées. Si Google renvoie un échec partiel d'artefact, par exemple une
erreur de liste de notes intelligentes, d'entrée de transcription ou de corps de
document Drive, le résumé et le manifeste conservent l'avertissement au lieu de
faire échouer toute l'exportation.
Utilisez `--dry-run` pour récupérer les mêmes données d'artefacts/de présence et
imprimer le JSON du manifeste sans créer le dossier ni le ZIP. C'est utile avant
d'écrire une grande exportation ou lorsqu'un agent a seulement besoin des
compteurs, des enregistrements sélectionnés et des avertissements.

Les agents peuvent également créer le même lot via l'outil `google_meet` :

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Définissez `"dryRun": true` pour ne renvoyer que le manifeste d'exportation et
ignorer l'écriture des fichiers.

Les agents peuvent aussi créer une salle appuyée par l'API avec une politique
d'accès explicite :

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime",
  "accessType": "OPEN"
}
```

Et ils peuvent mettre fin à la conférence active pour une salle connue :

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Pour une validation qui écoute d'abord, les agents doivent utiliser `test_listen`
avant d'affirmer que la réunion est utile :

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Exécutez le smoke test live protégé sur une vraie réunion conservée :

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Exécutez la sonde navigateur live qui écoute d'abord sur une réunion où
quelqu'un parlera avec les sous-titres Meet disponibles :

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Environnement du smoke test live :

- `OPENCLAW_LIVE_TEST=1` active les tests live protégés.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` pointe vers une URL Meet conservée, un code
  ou `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` ou `GOOGLE_MEET_CLIENT_ID` fournit l'id client
  OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` ou `GOOGLE_MEET_REFRESH_TOKEN` fournit le
  jeton d'actualisation.
- Facultatif : `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` et
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` utilisent les mêmes noms de
  fallback sans le préfixe `OPENCLAW_`.

Le smoke test live de base pour les artefacts/la présence nécessite
`https://www.googleapis.com/auth/meetings.space.readonly` et
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. La
recherche dans l'agenda nécessite
`https://www.googleapis.com/auth/calendar.events.readonly`. L'exportation du
corps de document Drive nécessite
`https://www.googleapis.com/auth/drive.meet.readonly`.

Créez un nouvel espace Meet :

```bash
openclaw googlemeet create
```

La commande imprime le nouveau `meeting uri`, la source et la session de
participation. Avec des identifiants OAuth, elle utilise l'API officielle Google
Meet. Sans identifiants OAuth, elle utilise en fallback le profil de navigateur
connecté du Node Chrome épinglé. Les agents peuvent utiliser l'outil
`google_meet` avec `action: "create"` pour créer et rejoindre en une seule étape.
Pour une création limitée à l'URL, passez `"join": false`.

Exemple de sortie JSON depuis le fallback par navigateur :

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

Si le fallback par navigateur rencontre une connexion Google ou un blocage
d'autorisation Meet avant de pouvoir créer l'URL, la méthode Gateway renvoie une
réponse échouée et l'outil `google_meet` renvoie des détails structurés au lieu
d'une simple chaîne :

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

Lorsqu'un agent voit `manualActionRequired: true`, il doit signaler le
`manualActionMessage` ainsi que le contexte du Node/onglet de navigateur, puis
cesser d'ouvrir de nouveaux onglets Meet jusqu'à ce que l'opérateur termine
l'étape dans le navigateur.

Exemple de sortie JSON depuis la création par API :

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

La création d'un Meet rejoint la réunion par défaut. Le transport Chrome ou
Chrome-node nécessite toujours un profil Google Chrome connecté pour rejoindre
via le navigateur. Si le profil est déconnecté, OpenClaw signale
`manualActionRequired: true` ou une erreur de fallback navigateur et demande à
l'opérateur de terminer la connexion Google avant de réessayer.

Définissez `preview.enrollmentAcknowledged: true` uniquement après avoir confirmé
que votre projet Cloud, votre principal OAuth et les participants à la réunion
sont inscrits au Google Workspace Developer Preview Program pour les API média
Meet.

## Configuration

Le chemin commun de l'agent Chrome ne nécessite que le Plugin activé, BlackHole,
SoX, une clé de fournisseur de transcription realtime et un fournisseur TTS
OpenClaw configuré. OpenAI est le fournisseur de transcription par défaut ;
définissez `realtime.provider: "google"` pour utiliser Google Gemini Live en mode
`bidi` :

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Définissez la configuration du Plugin sous `plugins.entries.google-meet.config` :

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

Valeurs par défaut :

- `defaultTransport: "chrome"`
- `defaultMode: "agent"` (`"realtime"` est accepté comme alias de compatibilité pour
  `"agent"`)
- `chromeNode.node` : id/nom/IP de Node facultatif pour `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"` : nom utilisé sur l’écran invité Meet
  déconnecté
- `chrome.autoJoin: true` : remplissage du nom d’invité et clic sur Rejoindre maintenant au mieux
  via l’automatisation du navigateur OpenClaw sur `chrome-node`
- `chrome.reuseExistingTab: true` : activer un onglet Meet existant au lieu
  d’ouvrir des doublons
- `chrome.waitForInCallMs: 20000` : attendre que l’onglet Meet indique être dans l’appel
  avant le déclenchement de l’intro realtime
- `chrome.audioFormat: "pcm16-24khz"` : format audio de paire de commandes. Utilisez
  `"g711-ulaw-8khz"` uniquement pour les paires de commandes héritées/personnalisées qui émettent encore
  de l’audio téléphonique.
- `chrome.audioInputCommand` : commande SoX lisant depuis CoreAudio `BlackHole 2ch`
  et écrivant l’audio dans `chrome.audioFormat`
- `chrome.audioOutputCommand` : commande SoX lisant l’audio dans `chrome.audioFormat`
  et écrivant vers CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand` : commande de microphone local facultative qui écrit
  du PCM mono signé 16 bits little-endian pour détecter l’interruption humaine pendant que
  la lecture de l’assistant est active. Cela s’applique actuellement au pont de paire de commandes
  `chrome` hébergé par le Gateway.
- `chrome.bargeInRmsThreshold: 650` : niveau RMS comptant comme une
  interruption humaine sur `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500` : niveau de crête comptant comme une
  interruption humaine sur `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900` : délai minimal entre les effacements répétés
  d’interruption humaine
- `mode: "agent"` : mode de réponse vocale par défaut. La parole des participants est transcrite par
  le fournisseur de transcription realtime configuré, envoyée à l’agent
  OpenClaw configuré dans une session de sous-agent par réunion, puis restituée via le
  runtime TTS OpenClaw normal.
- `mode: "bidi"` : mode de modèle realtime bidirectionnel direct de secours. Le
  fournisseur vocal realtime répond directement à la parole des participants et peut appeler
  `openclaw_agent_consult` pour des réponses plus approfondies/adossées à des outils.
- `mode: "transcribe"` : mode observation seule sans le pont de réponse vocale.
- `realtime.provider: "openai"` : id de fournisseur utilisé par le mode `agent` pour la transcription
  realtime et par le mode `bidi` pour la voix realtime.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions` : réponses parlées brèves, avec
  `openclaw_agent_consult` pour les réponses plus approfondies
- `realtime.introMessage` : bref contrôle vocal de disponibilité lorsque le pont realtime
  se connecte ; définissez-le sur `""` pour rejoindre silencieusement
- `realtime.agentId` : id d’agent OpenClaw facultatif pour
  `openclaw_agent_consult` ; valeur par défaut : `main`

Remplacements facultatifs :

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
    provider: "google",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

Configuration Twilio uniquement :

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

`voiceCall.enabled` vaut `true` par défaut ; avec le transport Twilio, il délègue
l’appel PSTN réel, le DTMF et le message d’introduction au Plugin Voice Call. Voice Call
lit la séquence DTMF avant d’ouvrir le flux média realtime, puis utilise le
texte d’introduction enregistré comme salutation realtime initiale. Si `voice-call` n’est pas
activé, Google Meet peut toujours valider et enregistrer le plan de numérotation, mais ne peut pas
passer l’appel Twilio.

## Outil

Les agents peuvent utiliser l’outil `google_meet` :

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Utilisez `transport: "chrome"` lorsque Chrome s’exécute sur l’hôte Gateway. Utilisez
`transport: "chrome-node"` lorsque Chrome s’exécute sur un Node appairé, comme une VM Parallels.
Dans les deux cas, les fournisseurs de modèles et `openclaw_agent_consult` s’exécutent sur l’hôte
Gateway, de sorte que les identifiants de modèle y restent. Avec le `mode: "agent"` par défaut,
le fournisseur de transcription realtime gère l’écoute, l’agent OpenClaw configuré
produit la réponse, et le TTS OpenClaw standard la prononce dans Meet. Utilisez
`mode: "bidi"` lorsque vous voulez que le modèle vocal realtime réponde directement.
`mode: "realtime"` reste accepté comme alias de compatibilité pour
`mode: "agent"`.

Utilisez `action: "status"` pour lister les sessions actives ou inspecter un id de session. Utilisez
`action: "speak"` avec `sessionId` et `message` pour faire parler immédiatement l’agent realtime.
Utilisez `action: "test_speech"` pour créer ou réutiliser la session,
déclencher une phrase connue et renvoyer l’état de santé `inCall` lorsque l’hôte Chrome peut
le signaler. `test_speech` force toujours `mode: "agent"` et échoue si on lui demande de
s’exécuter en `mode: "transcribe"`, car les sessions observation seule ne peuvent intentionnellement pas
émettre de parole. Son résultat `speechOutputVerified` repose sur l’augmentation des octets de sortie audio
realtime pendant cet appel de test ; ainsi, une session réutilisée avec de l’audio plus ancien
ne compte pas comme un nouveau contrôle vocal réussi. Utilisez `action: "leave"` pour marquer
une session comme terminée.

`status` inclut l’état de santé de Chrome lorsqu’il est disponible :

- `inCall` : Chrome semble être dans l’appel Meet
- `micMuted` : état du microphone Meet déterminé au mieux
- `manualActionRequired` / `manualActionReason` / `manualActionMessage` : le
  profil de navigateur nécessite une connexion manuelle, l’admission par l’hôte Meet, des autorisations ou
  une réparation du contrôle du navigateur avant que la parole puisse fonctionner
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage` : indique si
  la parole Chrome gérée est maintenant autorisée. `speechReady: false` signifie qu’OpenClaw n’a
  pas envoyé la phrase d’introduction/de test dans le pont audio.
- `providerConnected` / `realtimeReady` : état du pont vocal realtime
- `lastInputAt` / `lastOutputAt` : dernier audio vu depuis le pont ou envoyé vers celui-ci
- `audioOutputRouted` / `audioOutputDeviceLabel` : indique si la sortie média de l’onglet Meet
  a été activement routée vers le périphérique BlackHole utilisé par le pont
- `lastSuppressedInputAt` / `suppressedInputBytes` : entrée loopback ignorée pendant que
  la lecture de l’assistant est active

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Modes Agent et Bidi

Le mode Chrome `agent` est optimisé pour le comportement « mon agent est dans la réunion ». Le
fournisseur de transcription realtime entend l’audio de la réunion, les transcriptions finales des participants
sont routées via l’agent OpenClaw configuré, et la réponse est
prononcée via le runtime TTS OpenClaw normal. Définissez `mode: "bidi"` lorsque vous voulez
que le modèle vocal realtime réponde directement.
Les fragments de transcription finale proches sont coalescés avant la consultation afin qu’un tour
parlé ne produise pas plusieurs réponses partielles obsolètes. L’entrée realtime est également
supprimée tant que l’audio de l’assistant en file d’attente est encore en lecture,
et les échos récents de transcription ressemblant à l’assistant sont ignorés avant la consultation de l’agent
afin que le loopback BlackHole ne fasse pas répondre l’agent à sa propre parole.

| Mode    | Qui décide de la réponse        | Chemin de sortie vocale                     | À utiliser lorsque                                              |
| ------- | ------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| `agent` | L’agent OpenClaw configuré      | Runtime TTS OpenClaw normal                 | Vous voulez le comportement « mon agent est dans la réunion »   |
| `bidi`  | Le modèle vocal realtime        | Réponse audio du fournisseur vocal realtime | Vous voulez la boucle vocale conversationnelle la moins latente |

En mode `bidi`, lorsque le modèle realtime a besoin d’un raisonnement plus approfondi, d’informations
actuelles ou des outils OpenClaw normaux, il peut appeler `openclaw_agent_consult`.

L’outil de consultation exécute l’agent OpenClaw standard en arrière-plan avec le contexte de transcription
récent de la réunion et renvoie une réponse parlée concise. En mode `agent`,
OpenClaw envoie cette réponse directement au runtime TTS ; en mode `bidi`, le
modèle vocal realtime peut restituer le résultat de consultation dans la réunion. Il utilise
le même mécanisme de consultation partagé que Voice Call.

Par défaut, les consultations s’exécutent avec l’agent `main`. Définissez `realtime.agentId` lorsqu’une
voie Meet doit consulter un espace de travail d’agent OpenClaw dédié, des valeurs par défaut de modèle,
une politique d’outils, une mémoire et un historique de session.

Les consultations en mode agent utilisent une clé de session `agent:<id>:subagent:google-meet:<session>`
par réunion afin que les questions de suivi conservent le contexte de la réunion tout en héritant de la
politique d’agent normale de l’agent configuré.

`realtime.toolPolicy` contrôle l’exécution de la consultation :

- `safe-read-only` : expose l’outil de consultation et limite l’agent standard à
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` et
  `memory_get`.
- `owner` : expose l’outil de consultation et laisse l’agent standard utiliser la politique
  d’outils normale de l’agent.
- `none` : n’expose pas l’outil de consultation au modèle vocal realtime.

La clé de session de consultation est limitée à chaque session Meet, ce qui permet aux appels de consultation
de suivi de réutiliser le contexte de consultation antérieur pendant la même réunion.

Pour forcer un contrôle vocal de disponibilité après que Chrome a complètement rejoint l’appel :

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Pour le smoke complet rejoindre-et-parler :

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Liste de contrôle de test en direct

Utilisez cette séquence avant de confier une réunion à un agent sans surveillance :

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

État Chrome-node attendu :

- `googlemeet setup` est entièrement vert.
- `googlemeet setup` inclut `chrome-node-connected` lorsque Chrome-node est le
  transport par défaut ou qu’un Node est épinglé.
- `nodes status` affiche le Node sélectionné comme connecté.
- Le Node sélectionné annonce à la fois `googlemeet.chrome` et `browser.proxy`.
- L’onglet Meet rejoint l’appel et `test-speech` renvoie l’état de santé Chrome avec
  `inCall: true`.

Pour un hôte Chrome distant comme une VM macOS Parallels, voici le contrôle
sûr le plus court après mise à jour du Gateway ou de la VM :

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Cela prouve que le Plugin Gateway est chargé, que le Node de la VM est connecté avec le
jeton actuel, et que le pont audio Meet est disponible avant qu’un agent n’ouvre un
véritable onglet de réunion.

Pour un smoke Twilio, utilisez une réunion qui expose les détails de connexion par téléphone :

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

État Twilio attendu :

- `googlemeet setup` inclut les vérifications vertes `twilio-voice-call-plugin`,
  `twilio-voice-call-credentials` et `twilio-voice-call-webhook`.
- `voicecall` est disponible dans la CLI après le rechargement du Gateway.
- La session renvoyée contient `transport: "twilio"` et un `twilio.voiceCallId`.
- `openclaw logs --follow` affiche le TwiML DTMF servi avant le TwiML en temps réel, puis un
  pont en temps réel avec le message d’accueil initial mis en file d’attente.
- `googlemeet leave <sessionId>` raccroche l’appel vocal délégué.

## Dépannage

### L’agent ne voit pas l’outil Google Meet

Vérifiez que le plugin est activé dans la configuration du Gateway et rechargez le Gateway :

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Si vous venez de modifier `plugins.entries.google-meet`, redémarrez ou rechargez le Gateway.
L’agent en cours d’exécution ne voit que les outils de plugin enregistrés par le processus Gateway
actuel.

Sur les hôtes Gateway non macOS, l’outil `google_meet` exposé à l’agent reste visible,
mais les actions de réponse vocale locales de Chrome sont bloquées avant d’atteindre le pont audio.
L’audio de réponse vocale locale de Chrome dépend actuellement de `BlackHole 2ch` sur macOS, donc
les agents Linux doivent utiliser `mode: "transcribe"`, l’appel entrant Twilio, ou un hôte macOS
`chrome-node` au lieu du chemin par défaut d’agent Chrome local.

### Aucun nœud compatible Google Meet connecté

Sur l’hôte du nœud, exécutez :

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Sur l’hôte Gateway, approuvez le nœud et vérifiez les commandes :

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Le nœud doit être connecté et lister `googlemeet.chrome` ainsi que `browser.proxy`.
La configuration du Gateway doit autoriser ces commandes de nœud :

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Si `googlemeet setup` échoue sur `chrome-node-connected` ou si le journal du Gateway signale
`gateway token mismatch`, réinstallez ou redémarrez le nœud avec le jeton Gateway actuel.
Pour un Gateway LAN, cela signifie généralement :

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Rechargez ensuite le service du nœud et relancez :

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Le navigateur s’ouvre mais l’agent ne peut pas rejoindre

Exécutez `googlemeet test-listen` pour les jonctions en observation seule ou `googlemeet test-speech`
pour les jonctions en temps réel, puis inspectez l’état Chrome renvoyé. Si l’une des sondes
signale `manualActionRequired: true`, affichez `manualActionMessage` à l’opérateur
et cessez de réessayer jusqu’à ce que l’action dans le navigateur soit terminée.

Actions manuelles courantes :

- Connectez-vous au profil Chrome.
- Admettez l’invité depuis le compte hôte Meet.
- Accordez à Chrome les autorisations de microphone/caméra lorsque l’invite d’autorisation native
  de Chrome apparaît.
- Fermez ou réparez une boîte de dialogue d’autorisation Meet bloquée.

Ne signalez pas « non connecté » simplement parce que Meet affiche « Do you want people to
hear you in the meeting? ». Il s’agit de l’interstitiel de choix audio de Meet ; OpenClaw
clique sur **Use microphone** via l’automatisation du navigateur lorsque c’est possible et continue
d’attendre l’état réel de la réunion. Pour le repli navigateur en création seule, OpenClaw
peut cliquer sur **Continue without microphone** parce que la création de l’URL n’a pas besoin
du chemin audio en temps réel.

### La création de la réunion échoue

`googlemeet create` utilise d’abord le point de terminaison `spaces.create` de l’API Google Meet
lorsque des identifiants OAuth sont configurés. Sans identifiants OAuth, il bascule vers le
navigateur de nœud Chrome épinglé. Vérifiez :

- Pour la création par API : `oauth.clientId` et `oauth.refreshToken` sont configurés,
  ou des variables d’environnement `OPENCLAW_GOOGLE_MEET_*` correspondantes sont présentes.
- Pour la création par API : le jeton d’actualisation a été généré après l’ajout de la prise en charge
  de la création. Les anciens jetons peuvent ne pas avoir le scope `meetings.space.created` ; relancez
  `openclaw googlemeet auth login --json` et mettez à jour la configuration du plugin.
- Pour le repli navigateur : `defaultTransport: "chrome-node"` et
  `chromeNode.node` pointent vers un nœud connecté avec `browser.proxy` et
  `googlemeet.chrome`.
- Pour le repli navigateur : le profil Chrome OpenClaw sur ce nœud est connecté
  à Google et peut ouvrir `https://meet.google.com/new`.
- Pour le repli navigateur : les nouvelles tentatives réutilisent un onglet existant `https://meet.google.com/new`
  ou une invite de compte Google avant d’ouvrir un nouvel onglet. Si un agent dépasse le délai,
  réessayez l’appel d’outil plutôt que d’ouvrir manuellement un autre onglet Meet.
- Pour le repli navigateur : si l’outil renvoie `manualActionRequired: true`, utilisez
  les valeurs renvoyées `browser.nodeId`, `browser.targetId`, `browserUrl` et
  `manualActionMessage` pour guider l’opérateur. Ne réessayez pas en boucle tant que cette
  action n’est pas terminée.
- Pour le repli navigateur : si Meet affiche « Do you want people to hear you in the
  meeting? », laissez l’onglet ouvert. OpenClaw doit cliquer sur **Use microphone** ou, pour
  le repli en création seule, sur **Continue without microphone** via l’automatisation du navigateur
  et continuer d’attendre l’URL Meet générée. S’il ne le peut pas, l’erreur doit mentionner
  `meet-audio-choice-required`, pas `google-login-required`.

### L’agent rejoint la réunion mais ne parle pas

Vérifiez le chemin en temps réel :

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Utilisez `mode: "agent"` pour le chemin normal STT -> agent OpenClaw -> réponse vocale TTS,
ou `mode: "bidi"` pour le repli vocal direct en temps réel. `mode: "transcribe"`
ne démarre intentionnellement pas le pont de réponse vocale. Pour le débogage en observation seule,
exécutez `openclaw googlemeet status --json <session-id>` après que les participants ont parlé
et vérifiez `captioning`, `transcriptLines` et `lastCaptionText`. Si `inCall` est
true mais que `transcriptLines` reste à `0`, les sous-titres Meet peuvent être désactivés, personne
n’a parlé depuis l’installation de l’observateur, l’interface Meet a changé, ou les sous-titres
en direct ne sont pas disponibles pour la langue/le compte de la réunion.

`googlemeet test-speech` vérifie toujours le chemin en temps réel et indique si
des octets de sortie du pont ont été observés pour cette invocation. Si `speechOutputVerified` est false et
`speechOutputTimedOut` est true, le fournisseur en temps réel peut avoir accepté l’énoncé
mais OpenClaw n’a pas vu de nouveaux octets de sortie atteindre le pont audio Chrome.

Vérifiez également :

- Une clé de fournisseur en temps réel est disponible sur l’hôte Gateway, par exemple
  `OPENAI_API_KEY` ou `GEMINI_API_KEY`.
- `BlackHole 2ch` est visible sur l’hôte Chrome.
- `sox` existe sur l’hôte Chrome.
- Le microphone et le haut-parleur Meet sont acheminés par le chemin audio virtuel utilisé par
  OpenClaw. `doctor` doit afficher `meet output routed: yes` pour les jonctions Chrome locales
  en temps réel.

`googlemeet doctor [session-id]` affiche la session, le nœud, l’état d’appel en cours,
la raison de l’action manuelle, la connexion du fournisseur en temps réel, `realtimeReady`, l’activité
d’entrée/sortie audio, les derniers horodatages audio, les compteurs d’octets et l’URL du navigateur.
Utilisez `googlemeet status [session-id] --json` lorsque vous avez besoin du JSON brut. Utilisez
`googlemeet doctor --oauth` lorsque vous devez vérifier l’actualisation OAuth Google Meet
sans exposer les jetons ; ajoutez `--meeting` ou `--create-space` lorsque vous avez aussi besoin
d’une preuve de l’API Google Meet.

Si un agent a dépassé le délai et que vous pouvez voir un onglet Meet déjà ouvert, inspectez cet onglet
sans en ouvrir un autre :

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

L’action d’outil équivalente est `recover_current_tab`. Elle met au premier plan et inspecte un
onglet Meet existant pour le transport sélectionné. Avec `chrome`, elle utilise le contrôle local
du navigateur via le Gateway ; avec `chrome-node`, elle utilise le nœud Chrome configuré.
Elle n’ouvre pas de nouvel onglet et ne crée pas de nouvelle session ; elle signale le
blocage actuel, par exemple l’état de connexion, d’admission, d’autorisations ou de choix audio.
La commande CLI communique avec le Gateway configuré, donc le Gateway doit être en cours d’exécution ;
`chrome-node` exige également que le nœud Chrome soit connecté.

### Les vérifications de configuration Twilio échouent

`twilio-voice-call-plugin` échoue lorsque `voice-call` n’est pas autorisé ou n’est pas activé.
Ajoutez-le à `plugins.allow`, activez `plugins.entries.voice-call`, puis rechargez le Gateway.

`twilio-voice-call-credentials` échoue lorsqu’il manque au backend Twilio le SID de compte,
le jeton d’authentification ou le numéro appelant. Définissez-les sur l’hôte Gateway :

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` échoue lorsque `voice-call` n’a aucune exposition Webhook publique,
ou lorsque `publicUrl` pointe vers le local loopback ou un espace réseau privé.
Définissez `plugins.entries.voice-call.config.publicUrl` sur l’URL publique du fournisseur ou
configurez une exposition tunnel/Tailscale `voice-call`.

Les URL de local loopback et privées ne sont pas valides pour les rappels opérateur. N’utilisez pas
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` ou `fd00::/8` comme `publicUrl`.

Pour une URL publique stable :

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

Pour le développement local, utilisez un tunnel ou une exposition Tailscale au lieu d’une URL
d’hôte privée :

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

Redémarrez ou rechargez ensuite le Gateway et exécutez :

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` vérifie uniquement la disponibilité par défaut. Pour faire un dry run sur un numéro précis :

```bash
openclaw voicecall smoke --to "+15555550123"
```

Ajoutez `--yes` uniquement lorsque vous voulez intentionnellement passer un appel de notification
sortant en direct :

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### L’appel Twilio démarre mais n’entre jamais dans la réunion

Vérifiez que l’événement Meet expose les informations d’appel téléphonique. Passez le numéro
d’appel entrant et le code PIN exacts ou une séquence DTMF personnalisée :

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Utilisez un `w` initial ou des virgules dans `--dtmf-sequence` si le fournisseur a besoin d’une pause
avant de saisir le code PIN.

Si l’appel téléphonique est créé mais que la liste des participants Meet n’affiche jamais le participant
par appel entrant :

- Exécutez `openclaw googlemeet doctor <session-id>` pour confirmer l’ID d’appel Twilio
  délégué, si le DTMF a été mis en file d’attente, et si le message d’accueil d’introduction a été demandé.
- Exécutez `openclaw voicecall status --call-id <id>` et confirmez que l’appel est toujours
  actif.
- Exécutez `openclaw voicecall tail` et vérifiez que les Webhooks Twilio arrivent au
  Gateway.
- Exécutez `openclaw logs --follow` et recherchez la séquence Twilio Meet : Google
  Meet délègue la jonction, Voice Call démarre la branche téléphonique, Google Meet attend
  `voiceCall.dtmfDelayMs`, envoie le DTMF avec `voicecall.dtmf`, attend
  `voiceCall.postDtmfSpeechDelayMs`, puis demande le message d’introduction avec
  `voicecall.speak`.
- Relancez `openclaw googlemeet setup --transport twilio` ; une vérification de configuration verte est
  obligatoire mais ne prouve pas que la séquence PIN de la réunion est correcte.
- Vérifiez que le numéro d’appel entrant appartient à la même invitation Meet et à la même région que
  le code PIN.
- Augmentez `voiceCall.dtmfDelayMs` si Meet répond lentement ou si la transcription de l’appel
  affiche encore l’invite demandant un code PIN après l’envoi du DTMF.
- Si le participant rejoint la réunion mais que vous n’entendez pas le message d’accueil, vérifiez
  `openclaw logs --follow` pour la requête post-DTMF `voicecall.speak` et
  soit la lecture TTS du flux média, soit le repli Twilio `<Say>`. Si la transcription de l’appel
  contient encore « enter the meeting PIN », la branche téléphonique n’a pas encore rejoint
  la salle Meet, donc les participants à la réunion n’entendront pas la parole.

Si les webhooks n’arrivent pas, déboguez d’abord le Plugin Voice Call : le fournisseur doit
atteindre `plugins.entries.voice-call.config.publicUrl` ou le tunnel configuré.
Consultez [Résolution des problèmes de Voice Call](/fr/plugins/voice-call#troubleshooting).

## Notes

L’API multimédia officielle de Google Meet est orientée réception, donc parler dans un
appel Meet nécessite toujours un chemin de participant. Ce Plugin rend cette limite visible :
Chrome gère la participation via le navigateur et le routage audio local ; Twilio gère
la participation par appel téléphonique.

Les modes de réponse vocale de Chrome nécessitent `BlackHole 2ch` ainsi que l’un des éléments suivants :

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand` : OpenClaw possède le
  pont et achemine l’audio au format `chrome.audioFormat` entre ces commandes et le
  fournisseur sélectionné. Le mode agent utilise la transcription en temps réel plus la TTS standard ;
  le mode bidi utilise le fournisseur vocal en temps réel. Le chemin Chrome par défaut est en PCM16
  à 24 kHz ; le G.711 mu-law à 8 kHz reste disponible pour les anciennes paires de commandes.
- `chrome.audioBridgeCommand` : une commande de pont externe possède tout le chemin
  audio local et doit se terminer après avoir démarré ou validé son daemon. Cela n’est
  valable que pour `bidi`, car le mode `agent` nécessite un accès direct à la paire de commandes pour la TTS.

Pour un audio duplex propre, routez la sortie Meet et le microphone Meet via des périphériques
virtuels séparés ou un graphe de périphériques virtuels de type Loopback. Un seul périphérique
BlackHole partagé peut renvoyer l’écho des autres participants dans l’appel.

Avec le pont Chrome par paire de commandes, `chrome.bargeInInputCommand` peut écouter un
microphone local séparé et effacer la lecture de l’assistant lorsque l’humain commence
à parler. Cela garde la parole humaine prioritaire sur la sortie de l’assistant, même lorsque l’entrée
loopback BlackHole partagée est temporairement supprimée pendant la lecture de l’assistant.
Comme `chrome.audioInputCommand` et `chrome.audioOutputCommand`, il s’agit d’une
commande locale configurée par l’opérateur. Utilisez un chemin de commande ou une
liste d’arguments explicitement fiables, et ne les pointez pas vers des scripts situés dans des emplacements non fiables.

`googlemeet speak` déclenche le pont audio de réponse vocale actif pour une session Chrome.
`googlemeet leave` arrête ce pont. Pour les sessions Twilio déléguées
via le Plugin Voice Call, `leave` raccroche également l’appel vocal sous-jacent.
Utilisez `googlemeet end-active-conference` lorsque vous voulez aussi fermer la conférence
Google Meet active pour un espace géré par API.

## Associés

- [Plugin Voice Call](/fr/plugins/voice-call)
- [Mode parole](/fr/nodes/talk)
- [Créer des plugins](/fr/plugins/building-plugins)
