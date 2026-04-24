---
read_when:
    - Vous voulez qu’un agent OpenClaw rejoigne un appel Google Meet
    - Vous configurez Chrome, le Node Chrome ou Twilio comme transport Google Meet
summary: 'Plugin Google Meet : rejoindre des URL Meet explicites via Chrome ou Twilio avec les valeurs par défaut de voix en temps réel'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-24T08:57:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d430a1f2d6ee7fc1d997ef388a2e0d2915a6475480343e7060edac799dfc027
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

Prise en charge des participants Google Meet pour OpenClaw.

Le Plugin est explicitement conçu ainsi :

- Il rejoint uniquement une URL explicite `https://meet.google.com/...`.
- La voix `realtime` est le mode par défaut.
- La voix en temps réel peut rappeler l’agent OpenClaw complet lorsque des outils ou un raisonnement plus approfondi sont nécessaires.
- L’authentification commence comme un OAuth Google personnel ou un profil Chrome déjà connecté.
- Il n’y a aucune annonce automatique de consentement.
- Le backend audio Chrome par défaut est `BlackHole 2ch`.
- Chrome peut s’exécuter localement ou sur un hôte Node appairé.
- Twilio accepte un numéro d’appel entrant avec un code PIN ou une séquence DTMF facultatifs.
- La commande CLI est `googlemeet` ; `meet` est réservé aux flux de téléconférence d’agent plus larges.

## Démarrage rapide

Installez les dépendances audio locales et assurez-vous que le fournisseur en temps réel peut utiliser OpenAI :

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

`blackhole-2ch` installe le périphérique audio virtuel `BlackHole 2ch`. Le programme d’installation de Homebrew nécessite un redémarrage avant que macOS n’expose le périphérique :

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

Chrome rejoint la réunion en tant que profil Chrome connecté. Dans Meet, choisissez `BlackHole 2ch` pour le chemin microphone/haut-parleur utilisé par OpenClaw. Pour un audio duplex propre, utilisez des périphériques virtuels séparés ou un graphe de type Loopback ; un seul périphérique BlackHole suffit pour un premier test rapide, mais peut produire de l’écho.

### Gateway local + Chrome Parallels

Vous n’avez **pas** besoin d’un Gateway OpenClaw complet ni d’une clé API de modèle à l’intérieur d’une VM macOS uniquement pour faire de la VM l’hôte de Chrome. Exécutez le Gateway et l’agent localement, puis exécutez un hôte Node dans la VM. Activez une fois le Plugin intégré sur la VM afin que le Node annonce la commande Chrome :

Ce qui s’exécute où :

- Hôte Gateway : Gateway OpenClaw, espace de travail de l’agent, clés de modèle/API, fournisseur en temps réel et configuration du Plugin Google Meet.
- VM macOS Parallels : CLI/hôte Node OpenClaw, Google Chrome, SoX, BlackHole 2ch et un profil Chrome connecté à Google.
- Non requis dans la VM : service Gateway, configuration de l’agent, clé OpenAI/GPT ou configuration du fournisseur de modèle.

Installez les dépendances de la VM :

```bash
brew install blackhole-2ch sox
```

Redémarrez la VM après l’installation de BlackHole afin que macOS expose `BlackHole 2ch` :

```bash
sudo reboot
```

Après le redémarrage, vérifiez que la VM peut voir le périphérique audio et les commandes SoX :

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

Si `<gateway-host>` est une IP LAN et que vous n’utilisez pas TLS, le Node refuse le WebSocket en texte clair sauf si vous l’autorisez explicitement pour ce réseau privé de confiance :

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Utilisez la même variable d’environnement lors de l’installation du Node comme LaunchAgent :

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` est un environnement de processus, pas un paramètre `openclaw.json`. `openclaw node install` l’enregistre dans l’environnement du LaunchAgent lorsqu’elle est présente sur la commande d’installation.

Approuvez le Node depuis l’hôte Gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Confirmez que le Gateway voit le Node et qu’il annonce `googlemeet.chrome` :

```bash
openclaw nodes status
```

Acheminez Meet via ce Node sur l’hôte Gateway :

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

Vous pouvez maintenant rejoindre la réunion normalement depuis l’hôte Gateway :

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

ou demander à l’agent d’utiliser l’outil `google_meet` avec `transport: "chrome-node"`.

Si `chromeNode.node` est omis, OpenClaw effectue une sélection automatique uniquement lorsqu’un seul Node connecté annonce `googlemeet.chrome`. Si plusieurs Nodes compatibles sont connectés, définissez `chromeNode.node` sur l’identifiant du Node, son nom d’affichage ou son IP distante.

Vérifications courantes en cas d’échec :

- `No connected Google Meet-capable node` : démarrez `openclaw node run` dans la VM, approuvez l’appairage et assurez-vous que `openclaw plugins enable google-meet` a bien été exécuté dans la VM. Confirmez aussi que l’hôte Gateway autorise la commande Node avec `gateway.nodes.allowCommands: ["googlemeet.chrome"]`.
- `BlackHole 2ch audio device not found on the node` : installez `blackhole-2ch` dans la VM et redémarrez la VM.
- Chrome s’ouvre mais ne peut pas rejoindre la réunion : connectez-vous à Chrome dans la VM et confirmez que ce profil peut rejoindre manuellement l’URL Meet.
- Pas d’audio : dans Meet, acheminez le microphone et le haut-parleur via le chemin de périphérique audio virtuel utilisé par OpenClaw ; utilisez des périphériques virtuels séparés ou un routage de type Loopback pour un audio duplex propre.

## Notes d’installation

Le mode Chrome en temps réel par défaut utilise deux outils externes :

- `sox` : utilitaire audio en ligne de commande. Le Plugin utilise ses commandes `rec` et `play` pour le pont audio G.711 mu-law 8 kHz par défaut.
- `blackhole-2ch` : pilote audio virtuel macOS. Il crée le périphérique audio `BlackHole 2ch` par lequel Chrome/Meet peut être acheminé.

OpenClaw ne fournit ni ne redistribue aucun de ces deux paquets. La documentation demande aux utilisateurs de les installer comme dépendances de l’hôte via Homebrew. SoX est sous licence `LGPL-2.0-only AND GPL-2.0-only` ; BlackHole est sous licence GPL-3.0. Si vous créez un programme d’installation ou une appliance qui intègre BlackHole avec OpenClaw, vérifiez les conditions de licence amont de BlackHole ou obtenez une licence distincte auprès de Existential Audio.

## Transports

### Chrome

Le transport Chrome ouvre l’URL Meet dans Google Chrome et rejoint la réunion en tant que profil Chrome connecté. Sur macOS, le Plugin vérifie la présence de `BlackHole 2ch` avant le lancement. Si configuré, il exécute également une commande de vérification de santé du pont audio et une commande de démarrage avant d’ouvrir Chrome. Utilisez `chrome` lorsque Chrome/l’audio s’exécutent sur l’hôte Gateway ; utilisez `chrome-node` lorsque Chrome/l’audio s’exécutent sur un Node appairé, comme une VM macOS Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Acheminez l’audio microphone et haut-parleur de Chrome via le pont audio OpenClaw local. Si `BlackHole 2ch` n’est pas installé, la connexion échoue avec une erreur de configuration au lieu de rejoindre silencieusement sans chemin audio.

### Twilio

Le transport Twilio est un plan de numérotation strict délégué au Plugin Voice Call. Il n’analyse pas les pages Meet pour y trouver des numéros de téléphone.

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

## OAuth et prévérification

L’accès à l’API média Google Meet utilise d’abord un client OAuth personnel. Configurez `oauth.clientId` et, facultativement, `oauth.clientSecret`, puis exécutez :

```bash
openclaw googlemeet auth login --json
```

La commande affiche un bloc de configuration `oauth` avec un jeton d’actualisation. Elle utilise PKCE, un rappel localhost sur `http://localhost:8085/oauth2callback` et un flux manuel de copier-coller avec `--manual`.

Ces variables d’environnement sont acceptées comme solutions de secours :

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

Exécutez la prévérification avant le travail média :

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Définissez `preview.enrollmentAcknowledged: true` uniquement après avoir confirmé que votre projet Cloud, le principal OAuth et les participants à la réunion sont inscrits au Google Workspace Developer Preview Program pour les API média Meet.

## Configuration

Le chemin Chrome en temps réel courant nécessite seulement le Plugin activé, BlackHole, SoX et une clé OpenAI :

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
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
- `chromeNode.node` : identifiant/nom/IP du Node facultatif pour `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.audioInputCommand` : commande SoX `rec` écrivant un audio G.711 mu-law 8 kHz vers stdout
- `chrome.audioOutputCommand` : commande SoX `play` lisant un audio G.711 mu-law 8 kHz depuis stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions` : réponses parlées brèves, avec
  `openclaw_agent_consult` pour les réponses plus approfondies
- `realtime.introMessage` : bref contrôle vocal de disponibilité lorsque le pont en temps réel se connecte ; définissez-le sur `""` pour rejoindre silencieusement

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
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
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

Utilisez `transport: "chrome"` lorsque Chrome s’exécute sur l’hôte Gateway. Utilisez `transport: "chrome-node"` lorsque Chrome s’exécute sur un Node appairé, comme une VM Parallels. Dans les deux cas, le modèle en temps réel et `openclaw_agent_consult` s’exécutent sur l’hôte Gateway, de sorte que les identifiants du modèle y restent.

Utilisez `action: "status"` pour lister les sessions actives ou inspecter un identifiant de session. Utilisez `action: "speak"` avec `sessionId` et `message` pour faire parler immédiatement l’agent en temps réel. Utilisez `action: "leave"` pour marquer une session comme terminée.

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Consultation d’agent en temps réel

Le mode Chrome en temps réel est optimisé pour une boucle vocale en direct. Le fournisseur vocal en temps réel entend l’audio de la réunion et parle via le pont audio configuré. Lorsque le modèle en temps réel a besoin d’un raisonnement plus approfondi, d’informations actuelles ou des outils OpenClaw normaux, il peut appeler `openclaw_agent_consult`.

L’outil de consultation exécute en arrière-plan l’agent OpenClaw standard avec le contexte récent de la transcription de la réunion, puis renvoie une réponse orale concise à la session vocale en temps réel. Le modèle vocal peut ensuite restituer cette réponse dans la réunion.

`realtime.toolPolicy` contrôle l’exécution de la consultation :

- `safe-read-only` : expose l’outil de consultation et limite l’agent standard à
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` et
  `memory_get`.
- `owner` : expose l’outil de consultation et permet à l’agent standard d’utiliser la politique d’outils normale de l’agent.
- `none` : n’expose pas l’outil de consultation au modèle vocal en temps réel.

La clé de session de consultation est limitée à chaque session Meet, afin que les appels de consultation de suivi puissent réutiliser le contexte de consultation précédent pendant la même réunion.

Pour forcer une vérification vocale de disponibilité après que Chrome a complètement rejoint l’appel :

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

## Notes

L’API média officielle de Google Meet est orientée réception, donc parler dans un appel Meet nécessite toujours un chemin de participation. Ce Plugin conserve cette limite visible : Chrome gère la participation via le navigateur et le routage audio local ; Twilio gère la participation par appel téléphonique.

Le mode Chrome en temps réel nécessite soit :

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand` : OpenClaw gère le pont du modèle en temps réel et fait transiter l’audio G.711 mu-law 8 kHz entre ces commandes et le fournisseur vocal en temps réel sélectionné.
- `chrome.audioBridgeCommand` : une commande de pont externe gère l’ensemble du chemin audio local et doit se terminer après avoir démarré ou validé son démon.

Pour un audio duplex propre, acheminez la sortie Meet et le microphone Meet via des périphériques virtuels séparés ou un graphe de périphériques virtuels de type Loopback. Un seul périphérique BlackHole partagé peut réinjecter l’audio des autres participants dans l’appel.

`googlemeet speak` déclenche le pont audio en temps réel actif pour une session Chrome. `googlemeet leave` arrête ce pont. Pour les sessions Twilio déléguées via le Plugin Voice Call, `leave` raccroche également l’appel vocal sous-jacent.

## Liés

- [Plugin Voice Call](/fr/plugins/voice-call)
- [Mode conversation](/fr/nodes/talk)
- [Créer des Plugins](/fr/plugins/building-plugins)
