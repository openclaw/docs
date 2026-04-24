---
read_when:
    - Vous voulez qu’un agent OpenClaw rejoigne un appel Google Meet
    - Vous configurez Chrome, le nœud Chrome ou Twilio comme transport Google Meet
summary: 'Plugin Google Meet : rejoindre des URL Meet explicites via Chrome ou Twilio avec les paramètres vocaux en temps réel par défaut'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-24T09:51:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: f1673ac4adc9cf163194a340dd6e451d0e4d28bb62adeb126898298e62106d43
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

Prise en charge des participants Google Meet pour OpenClaw.

Le Plugin est explicitement conçu ainsi :

- Il rejoint uniquement une URL explicite `https://meet.google.com/...`.
- La voix `realtime` est le mode par défaut.
- La voix en temps réel peut revenir vers l’agent OpenClaw complet lorsque des
  outils ou un raisonnement plus approfondi sont nécessaires.
- L’authentification commence comme un OAuth Google personnel ou un profil Chrome déjà connecté.
- Il n’y a pas d’annonce de consentement automatique.
- Le backend audio Chrome par défaut est `BlackHole 2ch`.
- Chrome peut s’exécuter localement ou sur un hôte Node appairé.
- Twilio accepte un numéro d’appel entrant ainsi qu’un code PIN ou une séquence DTMF facultatifs.
- La commande CLI est `googlemeet` ; `meet` est réservé aux workflows plus larges
  de téléconférence d’agent.

## Démarrage rapide

Installez les dépendances audio locales et configurez un fournisseur de voix en
temps réel backend. OpenAI est celui par défaut ; Google Gemini Live fonctionne
également avec `realtime.provider: "google"` :

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` installe le périphérique audio virtuel `BlackHole 2ch`. Le
programme d’installation de Homebrew nécessite un redémarrage avant que macOS expose le périphérique :

```bash
sudo reboot
```

Après le redémarrage, vérifiez les deux éléments :

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Activez le Plugin :

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

Vérifiez la configuration :

```bash
openclaw googlemeet setup
```

Rejoignez une réunion :

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Ou laissez un agent rejoindre la réunion via l’outil `google_meet` :

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij"
}
```

Chrome rejoint la réunion avec le profil Chrome connecté. Dans Meet, choisissez `BlackHole 2ch` pour
le chemin microphone/haut-parleur utilisé par OpenClaw. Pour un son duplex propre, utilisez
des périphériques virtuels séparés ou un graphe de type Loopback ; un seul périphérique BlackHole suffit
pour un premier test rapide, mais peut produire de l’écho.

### Gateway local + Chrome Parallels

Vous n’avez **pas** besoin d’un Gateway OpenClaw complet ou d’une clé d’API de modèle dans une VM macOS
uniquement pour que la VM héberge Chrome. Exécutez le Gateway et l’agent localement, puis exécutez un
hôte Node dans la VM. Activez une fois le Plugin intégré sur la VM afin que le nœud annonce la commande Chrome :

Ce qui s’exécute où :

- Hôte Gateway : OpenClaw Gateway, espace de travail de l’agent, clés de modèle/API, fournisseur
  temps réel et configuration du Plugin Google Meet.
- VM macOS Parallels : CLI/hôte Node OpenClaw, Google Chrome, SoX, BlackHole 2ch,
  et un profil Chrome connecté à Google.
- Inutile dans la VM : service Gateway, configuration de l’agent, clé OpenAI/GPT ou configuration du fournisseur
  de modèle.

Installez les dépendances de la VM :

```bash
brew install blackhole-2ch sox
```

Redémarrez la VM après l’installation de BlackHole afin que macOS expose `BlackHole 2ch` :

```bash
sudo reboot
```

Après le redémarrage, vérifiez que la VM voit le périphérique audio et les commandes SoX :

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Installez ou mettez à jour OpenClaw dans la VM, puis activez-y le Plugin intégré :

```bash
openclaw plugins enable google-meet
```

Démarrez l’hôte Node dans la VM :

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Si `<gateway-host>` est une IP LAN et que vous n’utilisez pas TLS, le nœud refuse le
WebSocket en texte clair à moins que vous n’autorisiez explicitement ce réseau privé de confiance :

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Utilisez la même variable d’environnement lorsque vous installez le nœud comme LaunchAgent :

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` est un environnement de processus, pas un
paramètre `openclaw.json`. `openclaw node install` l’enregistre dans l’environnement du LaunchAgent
lorsqu’il est présent dans la commande d’installation.

Approuvez le nœud depuis l’hôte Gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Confirmez que le Gateway voit le nœud et qu’il annonce `googlemeet.chrome` :

```bash
openclaw nodes status
```

Faites passer Meet par ce nœud sur l’hôte Gateway :

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

Rejoignez maintenant normalement depuis l’hôte Gateway :

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

ou demandez à l’agent d’utiliser l’outil `google_meet` avec `transport: "chrome-node"`.

Si `chromeNode.node` est omis, OpenClaw effectue une sélection automatique uniquement lorsqu’un seul
nœud connecté annonce `googlemeet.chrome`. Si plusieurs nœuds capables sont
connectés, définissez `chromeNode.node` sur l’identifiant du nœud, son nom d’affichage ou son IP distante.

Vérifications courantes en cas d’échec :

- `No connected Google Meet-capable node` : démarrez `openclaw node run` dans la VM,
  approuvez l’appairage, et assurez-vous que `openclaw plugins enable google-meet` a été exécuté
  dans la VM. Confirmez également que l’hôte Gateway autorise la commande du nœud avec
  `gateway.nodes.allowCommands: ["googlemeet.chrome"]`.
- `BlackHole 2ch audio device not found on the node` : installez `blackhole-2ch`
  dans la VM et redémarrez la VM.
- Chrome s’ouvre mais ne peut pas rejoindre : connectez-vous à Chrome dans la VM et confirmez que ce
  profil peut rejoindre l’URL Meet manuellement.
- Pas de son : dans Meet, faites passer le microphone/haut-parleur par le chemin du périphérique audio virtuel
  utilisé par OpenClaw ; utilisez des périphériques virtuels séparés ou un routage de type Loopback
  pour un duplex propre.

## Notes d’installation

La configuration par défaut Chrome realtime utilise deux outils externes :

- `sox` : utilitaire audio en ligne de commande. Le Plugin utilise ses commandes `rec` et `play`
  pour le pont audio G.711 mu-law 8 kHz par défaut.
- `blackhole-2ch` : pilote audio virtuel macOS. Il crée le périphérique audio `BlackHole 2ch`
  par lequel Chrome/Meet peut être routé.

OpenClaw ne regroupe ni ne redistribue aucun de ces deux paquets. La documentation demande aux utilisateurs de
les installer comme dépendances hôtes via Homebrew. SoX est sous licence
`LGPL-2.0-only AND GPL-2.0-only` ; BlackHole est sous GPL-3.0. Si vous créez un
installateur ou une appliance qui regroupe BlackHole avec OpenClaw, examinez les
conditions de licence amont de BlackHole ou obtenez une licence distincte auprès d’Existential Audio.

## Transports

### Chrome

Le transport Chrome ouvre l’URL Meet dans Google Chrome et rejoint la réunion avec le profil Chrome
connecté. Sur macOS, le Plugin vérifie la présence de `BlackHole 2ch` avant le lancement.
Si configuré, il exécute également une commande de vérification de santé du pont audio et une commande de démarrage
avant d’ouvrir Chrome. Utilisez `chrome` lorsque Chrome/l’audio s’exécutent sur l’hôte Gateway ;
utilisez `chrome-node` lorsque Chrome/l’audio s’exécutent sur un nœud appairé comme une VM macOS Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Faites passer l’audio du microphone et du haut-parleur de Chrome par le pont audio local OpenClaw.
Si `BlackHole 2ch` n’est pas installé, la connexion échoue avec une erreur de configuration
au lieu de rejoindre silencieusement sans chemin audio.

### Twilio

Le transport Twilio est un plan de numérotation strict délégué au Plugin Voice Call. Il
n’analyse pas les pages Meet pour en extraire des numéros de téléphone.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Utilisez `--dtmf-sequence` lorsque la réunion nécessite une séquence personnalisée :

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth et pré-vérification

L’accès à l’API média Google Meet commence d’abord par un client OAuth personnel. Configurez
`oauth.clientId` et éventuellement `oauth.clientSecret`, puis exécutez :

```bash
openclaw googlemeet auth login --json
```

La commande affiche un bloc de configuration `oauth` avec un refresh token. Elle utilise PKCE,
le callback localhost sur `http://localhost:8085/oauth2callback` et un flux manuel
copier/coller avec `--manual`.

Ces variables d’environnement sont acceptées comme solutions de repli :

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` ou `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` ou `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` ou `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` ou `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` ou
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` ou `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` ou `GOOGLE_MEET_PREVIEW_ACK`

Résolvez une URL Meet, un code ou `spaces/{id}` via `spaces.get` :

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Exécutez la pré-vérification avant le travail média :

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Définissez `preview.enrollmentAcknowledged: true` uniquement après avoir confirmé que votre
projet Cloud, le principal OAuth et les participants à la réunion sont inscrits au
Google Workspace Developer Preview Program pour les API média Meet.

## Configuration

Le chemin Chrome realtime courant nécessite seulement l’activation du Plugin, BlackHole, SoX
et une clé de fournisseur de voix temps réel backend. OpenAI est celui par défaut ; définissez
`realtime.provider: "google"` pour utiliser Google Gemini Live :

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Définissez la configuration du Plugin sous `plugins.entries.google-meet.config` :

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

Valeurs par défaut :

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node` : identifiant/nom/IP de nœud facultatif pour `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.audioInputCommand` : commande SoX `rec` écrivant de l’audio G.711 mu-law 8 kHz
  sur stdout
- `chrome.audioOutputCommand` : commande SoX `play` lisant de l’audio G.711 mu-law 8 kHz
  depuis stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions` : réponses parlées brèves, avec
  `openclaw_agent_consult` pour les réponses plus approfondies
- `realtime.introMessage` : bref contrôle de disponibilité vocal lorsque le pont temps réel
  se connecte ; définissez-le sur `""` pour rejoindre silencieusement

Surcharges facultatives :

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
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

Configuration Twilio uniquement :

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

## Outil

Les agents peuvent utiliser l’outil `google_meet` :

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Utilisez `transport: "chrome"` lorsque Chrome s’exécute sur l’hôte Gateway. Utilisez
`transport: "chrome-node"` lorsque Chrome s’exécute sur un nœud appairé comme une VM Parallels.
Dans les deux cas, le modèle temps réel et `openclaw_agent_consult` s’exécutent sur l’hôte
Gateway, de sorte que les identifiants du modèle y restent.

Utilisez `action: "status"` pour lister les sessions actives ou inspecter un identifiant de session. Utilisez
`action: "speak"` avec `sessionId` et `message` pour faire parler immédiatement l’agent
temps réel. Utilisez `action: "leave"` pour marquer la fin d’une session.

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Consultation de l’agent en temps réel

Le mode Chrome realtime est optimisé pour une boucle vocale en direct. Le fournisseur
de voix temps réel entend l’audio de la réunion et parle via le pont audio configuré.
Lorsque le modèle temps réel a besoin d’un raisonnement plus approfondi, d’informations
actuelles ou des outils OpenClaw normaux, il peut appeler `openclaw_agent_consult`.

L’outil de consultation exécute l’agent OpenClaw standard en arrière-plan avec le contexte
récent de la transcription de la réunion et renvoie une réponse parlée concise à la session
vocale temps réel. Le modèle vocal peut ensuite prononcer cette réponse dans la réunion.

`realtime.toolPolicy` contrôle l’exécution de la consultation :

- `safe-read-only` : expose l’outil de consultation et limite l’agent standard à
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` et
  `memory_get`.
- `owner` : expose l’outil de consultation et laisse l’agent standard utiliser la politique
  d’outils normale de l’agent.
- `none` : n’expose pas l’outil de consultation au modèle vocal temps réel.

La clé de session de consultation est limitée à chaque session Meet, afin que les appels de
consultation de suivi puissent réutiliser le contexte de consultation antérieur pendant la même réunion.

Pour forcer un contrôle vocal de disponibilité une fois que Chrome a complètement rejoint l’appel :

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

## Notes

L’API média officielle de Google Meet est orientée réception, donc parler dans un appel Meet
nécessite toujours un chemin de participation. Ce Plugin garde cette limite visible :
Chrome gère la participation du navigateur et le routage audio local ; Twilio gère
la participation par appel téléphonique.

Le mode Chrome realtime nécessite soit :

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand` : OpenClaw gère le
  pont du modèle temps réel et transfère l’audio G.711 mu-law 8 kHz entre ces
  commandes et le fournisseur de voix temps réel sélectionné.
- `chrome.audioBridgeCommand` : une commande de pont externe gère l’ensemble du chemin
  audio local et doit se terminer après avoir démarré ou validé son démon.

Pour un duplex audio propre, faites passer la sortie Meet et le microphone Meet par des
périphériques virtuels séparés ou par un graphe de périphérique virtuel de type Loopback. Un seul
périphérique BlackHole partagé peut renvoyer en écho les autres participants dans l’appel.

`googlemeet speak` déclenche le pont audio temps réel actif pour une session Chrome.
`googlemeet leave` arrête ce pont. Pour les sessions Twilio déléguées via le Plugin
Voice Call, `leave` raccroche également l’appel vocal sous-jacent.

## Liens associés

- [Plugin Voice Call](/fr/plugins/voice-call)
- [Mode Talk](/fr/nodes/talk)
- [Créer des plugins](/fr/plugins/building-plugins)
