---
read_when:
    - Vous souhaitez qu’un agent OpenClaw rejoigne un appel Google Meet
    - Vous souhaitez qu’un agent OpenClaw crée un nouvel appel Google Meet
    - Vous configurez Chrome, un Node Chrome ou Twilio comme transport Google Meet
summary: 'Plugin Google Meet : rejoignez des URL Meet explicites via Chrome ou Twilio avec des paramètres par défaut permettant à l’agent de répondre oralement'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-07-12T15:33:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5a3a0d2675bdfaeaa869652593fd1931c3afdefe0ed95f13935dade976ff038c
    source_path: plugins/google-meet.md
    workflow: 16
---

Le plugin `google-meet` rejoint des URL Meet explicites pour le compte d’un agent OpenClaw. Sa portée est volontairement limitée :

- Il rejoint uniquement les URL `https://meet.google.com/...` ; il ne se connecte jamais à une réunion à partir d’un numéro de téléphone qu’il aurait lui-même découvert.
- `googlemeet create` peut générer une nouvelle URL Meet au moyen de l’API Google Meet (ou d’une solution de secours dans le navigateur) et la rejoindre par défaut.
- La participation via Chrome utilise un profil Chrome connecté, éventuellement sur un Node appairé. La participation via Twilio compose un numéro de téléphone avec un code PIN/des tonalités DTMF par l’intermédiaire du [plugin d’appel vocal](/fr/plugins/voice-call) ; elle ne peut pas composer directement une URL Meet.
- `mode: "agent"` (valeur par défaut) transcrit les paroles des participants avec un fournisseur en temps réel, les transmet à l’agent OpenClaw configuré et énonce la réponse avec la synthèse vocale OpenClaw habituelle. `mode: "bidi"` permet à un modèle vocal en temps réel de répondre directement. `mode: "transcribe"` rejoint la réunion en mode observation uniquement, sans réponse vocale.
- Aucune annonce automatique de consentement n’est diffusée lorsque le plugin rejoint un appel.
- La commande CLI est `googlemeet` ; `meet` est réservé aux workflows de téléconférence plus généraux des agents.

## Démarrage rapide

Installez les dépendances audio locales, puis définissez la clé d’un fournisseur en temps réel. OpenAI est le fournisseur de transcription par défaut pour le mode `agent` ; Google Gemini Live est disponible comme fournisseur vocal du mode `bidi` :

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# nécessaire uniquement lorsque realtime.voiceProvider vaut "google" pour le mode bidi
export GEMINI_API_KEY=...
```

`blackhole-2ch` installe le périphérique audio virtuel `BlackHole 2ch` par lequel Chrome achemine le son. Le programme d’installation de Homebrew nécessite un redémarrage avant que macOS rende le périphérique disponible :

```bash
sudo reboot
```

Après le redémarrage, vérifiez les deux composants :

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Activez le plugin :

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

Vérifiez la configuration, puis rejoignez la réunion :

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

La sortie de `setup` est lisible par un agent et tient compte du mode et du transport : elle indique le profil Chrome, l’épinglage du Node et, pour les connexions Chrome en temps réel, le pont audio BlackHole/SoX ainsi que la vérification de l’introduction différée. Les connexions en mode observation uniquement ignorent les prérequis du temps réel :

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Lorsque la délégation Twilio est configurée, `setup` indique également si `voice-call`, les identifiants Twilio et l’exposition publique du Webhook sont prêts. Considérez toute vérification `ok: false` comme bloquante pour ce transport/mode avant qu’un agent ne rejoigne la réunion. Utilisez `--json` pour obtenir une sortie lisible par une machine et `--transport chrome|chrome-node|twilio` pour vérifier à l’avance un transport précis :

```bash
openclaw googlemeet setup --transport twilio
```

Vous pouvez également laisser un agent rejoindre la réunion au moyen de l’outil `google_meet` :

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Sur les hôtes Gateway autres que macOS, `google_meet` reste visible pour les actions relatives aux artefacts, au calendrier, à la configuration, à la transcription, à Twilio et à `chrome-node`, mais la réponse vocale de Chrome local (`transport: "chrome"` avec `mode: "agent"` ou `"bidi"`) est bloquée avant d’atteindre le pont audio, car ce chemin dépend actuellement de `BlackHole 2ch` sous macOS. Utilisez plutôt `mode: "transcribe"`, la connexion téléphonique Twilio ou un hôte macOS `chrome-node`.

### Créer une réunion

```bash
openclaw googlemeet create --transport chrome-node --mode agent
openclaw googlemeet create --no-join
```

`create` dispose de deux chemins, indiqués dans le champ `source` du résultat :

- **`api`** : utilisé lorsque les identifiants OAuth Google Meet sont configurés. Déterministe ; ne dépend pas de l’état de l’interface du navigateur.
- **`browser`** : utilisé sans identifiants OAuth. OpenClaw ouvre `https://meet.google.com/new` sur le Node Chrome épinglé et attend que Google redirige vers une véritable URL contenant un code de réunion ; le profil Chrome OpenClaw de ce Node doit déjà être connecté à Google. La connexion et la création réutilisent toutes deux un onglet Meet existant (ou un onglet `.../new` / d’invite de compte Google en cours) avant d’en ouvrir un nouveau ; la correspondance des onglets ignore les chaînes de requête sans incidence telles que `authuser`.

`create` rejoint la réunion par défaut et renvoie `joined: true` ainsi que la session de connexion. Transmettez `--no-join` (CLI) ou `"join": false` (outil) pour générer uniquement l’URL.

Pour les salles créées par l’API, définissez une politique d’accès explicite plutôt que d’hériter de la valeur par défaut du compte Google :

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

| `--access-type` | Personnes pouvant rejoindre sans demander l’accès                                   |
| --------------- | ------------------------------------------------------------------------------------ |
| `OPEN`          | Toute personne disposant de l’URL Meet                                               |
| `TRUSTED`       | Utilisateurs approuvés de l’organisation hôte, utilisateurs externes invités et utilisateurs connectés par téléphone |
| `RESTRICTED`    | Personnes invitées uniquement                                                        |

Cela s’applique uniquement aux salles créées par l’API ; OAuth doit donc être configuré. Si vous vous êtes authentifié avant l’existence de cette option, réexécutez `openclaw googlemeet auth login --json` après avoir ajouté la portée `meetings.space.settings` à votre écran de consentement OAuth.

Si la solution de secours dans le navigateur rencontre un blocage lié à la connexion Google ou aux autorisations Meet, l’outil renvoie `manualActionRequired: true` avec `manualActionReason`, `manualActionMessage` et les valeurs `browser.nodeId`/`browser.targetId`/`browserUrl`. Signalez ce message et cessez d’ouvrir de nouveaux onglets Meet jusqu’à ce que l’opérateur termine l’étape dans le navigateur.

### Connexion en mode observation uniquement

Définissez `"mode": "transcribe"` pour ignorer le pont temps réel duplex (aucune exigence concernant BlackHole/SoX, aucune réponse vocale). Les connexions Chrome en mode transcription ignorent également l’octroi par OpenClaw des autorisations de microphone/caméra et le parcours **Use microphone** de Meet ; si Meet affiche l’écran intermédiaire de choix audio, l’automatisation essaie d’abord **Continue without microphone**. Dans ce mode, les transports Chrome gérés installent un observateur des sous-titres Meet fourni sans garantie. `googlemeet status --json` et `googlemeet doctor` indiquent `captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText` ainsi qu’une fin de transcription `recentTranscript`.

Pour lire la transcription limitée de la session, consultez l’onglet Meet exact faisant l’objet du suivi :

```bash
openclaw googlemeet transcript <session-id>
openclaw googlemeet transcript <session-id> --since <next-index> --json
```

L’observateur conserve au maximum 2 000 lignes de sous-titres terminées dans la page Meet. Le texte progressif visible reste dans la fin de l’état d’intégrité jusqu’à ce que la ligne de sous-titre soit terminée ; l’enregistrement de `nextIndex` ne peut donc pas ignorer une extension ultérieure du texte. Quitter la réunion finalise les lignes visibles avant l’instantané. `droppedLines` indique les lignes perdues au début lorsque la limite est dépassée. Les transcriptions des quatre sessions terminées les plus récentes restent lisibles jusqu’au redémarrage du Gateway. Les transcriptions terminées plus anciennes renvoient `evicted: true`. Il s’agit volontairement de mémoire d’exécution et non d’un stockage durable de l’historique des réunions : le redémarrage du Gateway, la fermeture de l’onglet avant un instantané ou le dépassement des limites documentées peuvent entraîner la perte de sous-titres.

Pour effectuer un test d’écoute avec une réponse oui/non :

```bash
openclaw googlemeet test-listen <meet-url> --transport chrome-node
```

Cette commande rejoint la réunion en mode transcription, attend un nouveau changement dans les sous-titres/la transcription et renvoie `listenVerified`, `listenTimedOut`, les champs d’action manuelle et l’état actuel des sous-titres.

### État de la session en temps réel

Pendant les sessions avec réponse vocale, l’état de `google_meet` indique l’état de Chrome/du pont audio : `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, les horodatages des dernières entrées/sorties, les compteurs d’octets et l’état de fermeture du pont. Les sessions Chrome gérées n’énoncent la phrase d’introduction/de test qu’une fois que l’état indique `inCall: true` ; sinon, `speechReady: false` et la tentative de parole est bloquée au lieu d’être silencieusement ignorée.

Les connexions Chrome locales utilisent le profil de navigateur OpenClaw connecté et nécessitent `BlackHole 2ch` pour le chemin microphone/haut-parleur. Un seul périphérique BlackHole suffit pour un premier test rapide, mais peut produire un écho ; utilisez des périphériques virtuels distincts ou un graphe de type Loopback pour obtenir un son duplex propre.

## Gateway local et Chrome dans Parallels

Un Gateway complet ou une clé API de modèle n’est pas nécessaire dans une machine virtuelle macOS uniquement pour lui fournir Chrome. Exécutez le Gateway et l’agent localement ; exécutez un hôte Node dans la machine virtuelle.

| Emplacement d’exécution | Éléments                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| Hôte du Gateway         | Gateway OpenClaw, espace de travail de l’agent, clés de modèle/API, fournisseur en temps réel, configuration du plugin Google Meet |
| Machine virtuelle macOS Parallels | Hôte CLI/Node OpenClaw, Chrome, SoX, BlackHole 2ch, profil Chrome connecté à Google       |
| Non requis dans la machine virtuelle | Service Gateway, configuration de l’agent, configuration du fournisseur de modèle      |

Installez les dépendances dans la machine virtuelle, redémarrez et vérifiez :

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Activez le plugin dans la machine virtuelle et démarrez l’hôte Node :

```bash
openclaw plugins enable google-meet
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Si `<gateway-host>` est une adresse IP de réseau local sans TLS, autorisez explicitement ce réseau privé approuvé :

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Utilisez le même indicateur lors de l’installation comme LaunchAgent (il s’agit d’une variable d’environnement du processus, enregistrée dans l’environnement du LaunchAgent lorsqu’elle figure dans la commande d’installation, et non d’un paramètre `openclaw.json`) :

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

Approuvez le Node depuis l’hôte du Gateway, puis vérifiez qu’il annonce à la fois `googlemeet.chrome` et la capacité du navigateur/`browser.proxy` :

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Acheminez Meet par ce Node :

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
            guestName: "Agent OpenClaw",
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

Rejoignez ensuite normalement la réunion depuis l’hôte du Gateway :

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Pour effectuer avec une seule commande un test rapide qui crée ou réutilise une session, énonce une phrase connue et affiche l’état de la session :

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Pendant la connexion en temps réel, l’automatisation du navigateur renseigne le nom d’invité, clique sur Join/Ask to join et accepte l’invite initiale **Use microphone** de Meet lorsqu’elle apparaît (ou **Continue without microphone** lors d’une connexion en mode observation uniquement et de la création d’une réunion uniquement dans le navigateur). Si le profil est déconnecté, si Meet attend l’admission par l’hôte, si Chrome nécessite une autorisation pour le microphone/la caméra ou si Meet reste bloqué sur une invite non résolue, le résultat indique `manualActionRequired: true` avec `manualActionReason` et `manualActionMessage`. Cessez les nouvelles tentatives, signalez ce message avec `browserUrl`/`browserTitle`, puis réessayez uniquement après l’exécution de l’action manuelle.

Si `chromeNode.node` est omis, OpenClaw effectue une sélection automatique uniquement lorsqu’un seul Node connecté annonce à la fois `googlemeet.chrome` et le contrôle du navigateur ; épinglez `chromeNode.node` (identifiant du Node, nom d’affichage ou adresse IP distante) lorsque plusieurs Nodes compatibles sont connectés.

### Vérifications courantes en cas d’échec

| Symptôme                                                | Correctif                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Configured Google Meet node ... is not usable: offline` | Le Node épinglé est connu, mais indisponible. Signalez le blocage de configuration ; ne basculez pas silencieusement vers un autre transport, sauf demande explicite.                                                                                                     |
| `No connected Google Meet-capable node`                  | Exécutez `openclaw node run` dans la VM, approuvez l’association, puis exécutez-y `openclaw plugins enable google-meet` et `openclaw plugins enable browser`. Vérifiez que `gateway.nodes.allowCommands` inclut `googlemeet.chrome` et `browser.proxy`.                      |
| `BlackHole 2ch audio device not found`                   | Installez `blackhole-2ch` sur l’hôte vérifié, puis redémarrez-le.                                                                                                                                                                                                         |
| `BlackHole 2ch audio device not found on the node`       | Installez `blackhole-2ch` dans la VM, puis redémarrez la VM.                                                                                                                                                                                                               |
| Chrome s’ouvre, mais ne peut pas rejoindre la réunion    | Connectez-vous au profil de navigateur dans la VM, ou conservez `chrome.guestName`. La participation automatique en tant qu’invité utilise l’automatisation du navigateur OpenClaw via le proxy de navigateur du Node ; définissez `browser.defaultProfile` du Node (ou un profil nommé de session existante) sur le profil souhaité. |
| Onglets Meet en double                                   | Conservez `chrome.reuseExistingTab: true`. OpenClaw active un onglet existant pour la même URL et, avant d’en ouvrir un autre, réutilise un onglet `.../new` en cours d’utilisation ou un onglet d’invite de compte Google.                                                  |
| Aucun son                                                | Acheminez le microphone et les haut-parleurs Meet via le chemin audio virtuel utilisé par OpenClaw ; utilisez des périphériques virtuels distincts ou un routage de type Loopback pour un son duplex propre.                                                               |

## Notes d’installation

Le mécanisme de réponse vocale par défaut de Chrome utilise deux outils externes qu’OpenClaw n’intègre ni ne redistribue ; installez-les comme dépendances de l’hôte via Homebrew :

- `sox` : utilitaire audio en ligne de commande. Le Plugin exécute des commandes explicites de périphérique CoreAudio pour le pont audio PCM16 à 24 kHz par défaut.
- `blackhole-2ch` : pilote audio virtuel macOS fournissant le périphérique `BlackHole 2ch` par lequel passe le routage Chrome/Meet.

SoX est sous licence `LGPL-2.0-only AND GPL-2.0-only` ; BlackHole est sous licence GPL-3.0. Si vous créez un programme d’installation ou une appliance qui regroupe BlackHole avec OpenClaw, examinez les conditions de licence en amont de BlackHole ou obtenez une licence distincte auprès d’Existential Audio.

## Transports

| Transport     | À utiliser lorsque                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------- |
| `chrome`      | Chrome et l’audio s’exécutent sur l’hôte du Gateway                                            |
| `chrome-node` | Chrome et l’audio s’exécutent sur un Node associé (par exemple, une VM macOS Parallels)         |
| `twilio`      | Solution de repli par connexion téléphonique via le Plugin Voice Call lorsque la participation par Chrome n’est pas disponible |

### Chrome

Ouvre l’URL Meet à l’aide du contrôle de navigateur OpenClaw et rejoint la réunion avec le profil de navigateur OpenClaw connecté. Sous macOS, le Plugin vérifie la présence de `BlackHole 2ch` avant le lancement et, si cela est configuré, exécute une commande de contrôle d’intégrité ou de démarrage du pont audio avant d’ouvrir Chrome. Pour une instance Chrome locale, sélectionnez le profil avec `browser.defaultProfile` ; `chrome.browserProfile` est plutôt transmis aux hôtes `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Le son du microphone et des haut-parleurs Chrome passe par le pont audio OpenClaw local. Si `BlackHole 2ch` n’est pas installé, la participation échoue avec une erreur de configuration au lieu de rejoindre la réunion sans chemin audio.

### Twilio

Un plan de numérotation strict délégué au [Plugin Voice Call](/fr/plugins/voice-call). Il n’analyse pas les pages Meet pour y rechercher des numéros de téléphone ; Google Meet doit fournir un numéro de connexion téléphonique et un code PIN pour la réunion.

Activez Voice Call sur l’hôte du Gateway, et non sur le Node Chrome :

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // ou définissez "twilio" si Twilio doit être utilisé par défaut
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
            instructions: "Rejoignez cette réunion Google Meet en tant qu’agent OpenClaw. Soyez concis.",
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

Fournissez les identifiants Twilio via l’environnement afin de ne pas stocker les secrets dans `openclaw.json` :

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Utilisez plutôt `realtime.provider: "openai"` avec `OPENAI_API_KEY` si OpenAI est le fournisseur vocal en temps réel.

Redémarrez ou rechargez le Gateway après avoir activé `voice-call` ; les modifications de configuration du Plugin ne prennent effet qu’après le rechargement. Vérifiez :

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Lorsque la délégation Twilio est configurée, `googlemeet setup` inclut les contrôles `twilio-voice-call-plugin`, `twilio-voice-call-credentials` et `twilio-voice-call-webhook`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Utilisez `--dtmf-sequence` pour définir une séquence personnalisée, avec un `w` initial ou des virgules pour introduire une pause avant le code PIN :

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth et vérifications préalables

OAuth est facultatif pour créer un lien Meet, car `googlemeet create` peut utiliser l’automatisation du navigateur comme solution de repli. Configurez OAuth pour la création via l’API officielle, la résolution d’espaces ou les vérifications préalables de l’API Meet Media. La participation via Chrome ou Chrome-node ne dépend jamais d’OAuth ; elle utilise dans tous les cas un profil Chrome connecté, BlackHole/SoX et, pour `chrome-node`, un Node connecté.

### Créer des identifiants Google

Dans Google Cloud Console :

<Steps>
<Step title="Créer ou sélectionner un projet">
</Step>
<Step title="Activer l’API REST Google Meet">
</Step>
<Step title="Configurer l’écran de consentement OAuth">
Internal est l’option la plus simple pour une organisation Google Workspace. External convient aux configurations personnelles ou de test ; tant que l’application est en mode Testing, ajoutez comme utilisateur test chaque compte Google qui devra l’autoriser.
</Step>
<Step title="Ajouter les niveaux d’accès demandés">
- `https://www.googleapis.com/auth/meetings.space.created`
- `https://www.googleapis.com/auth/meetings.space.readonly`
- `https://www.googleapis.com/auth/meetings.space.settings`
- `https://www.googleapis.com/auth/meetings.conference.media.readonly`
- `https://www.googleapis.com/auth/calendar.events.readonly` (recherche dans Calendar)
- `https://www.googleapis.com/auth/drive.meet.readonly` (export du contenu des transcriptions et des documents de notes intelligentes)

</Step>
<Step title="Créer un ID client OAuth">
Type d’application **Web application**. URI de redirection autorisé :

```text
http://localhost:8085/oauth2callback
```

</Step>
<Step title="Copier l’ID client et le secret client">
</Step>
</Steps>

`meetings.space.created` est requis par `spaces.create`. `meetings.space.readonly` associe les URL et codes Meet à des espaces. `meetings.space.settings` permet à OpenClaw de transmettre des paramètres `SpaceConfig` tels que `accessType` lors de la création d’une salle via l’API. `meetings.conference.media.readonly` sert aux vérifications préalables de l’API Meet Media et aux opérations multimédias ; Google peut exiger une inscription au programme Developer Preview pour l’utilisation effective de l’API Media. `calendar.events.readonly` est uniquement nécessaire pour la recherche dans le calendrier avec `--today` ou `--event`. `drive.meet.readonly` est uniquement nécessaire pour l’export avec `--include-doc-bodies`. Si vous avez uniquement besoin de rejoindre des réunions avec Chrome via le navigateur, ignorez complètement OAuth.

### Générer le jeton d’actualisation

Configurez `oauth.clientId` et, facultativement, `oauth.clientSecret` (ou transmettez-les sous forme de variables d’environnement), puis exécutez :

```bash
openclaw googlemeet auth login --json
```

Cette commande exécute un flux PKCE avec un rappel localhost sur `http://localhost:8085/oauth2callback` et affiche un bloc de configuration `oauth` contenant un jeton d’actualisation. Ajoutez `--manual` pour utiliser un flux de copier-coller lorsque le navigateur ne peut pas accéder au rappel local :

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

Sortie JSON :

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

Stockez l’objet `oauth` dans la configuration du Plugin :

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

Privilégiez les variables d’environnement si vous ne souhaitez pas enregistrer le jeton d’actualisation dans la configuration ; la configuration est d’abord résolue, puis l’environnement est utilisé comme solution de repli. Si vous vous êtes authentifié avant la prise en charge de la création de réunions, de la recherche dans le calendrier ou de l’export du contenu des documents, exécutez à nouveau `openclaw googlemeet auth login --json` afin que le jeton d’actualisation couvre l’ensemble actuel des niveaux d’accès.

### Vérifier OAuth avec doctor

```bash
openclaw googlemeet doctor --oauth --json
```

Cette commande vérifie que la configuration OAuth existe et que le jeton d’actualisation peut générer un jeton d’accès, sans charger l’environnement d’exécution Chrome ni exiger un Node connecté. Le rapport inclut uniquement les champs d’état (`ok`, `configured`, `tokenSource`, `expiresAt`, messages de contrôle) et n’affiche jamais le jeton d’accès, le jeton d’actualisation ou le secret client.

| Contrôle             | Signification                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` et `oauth.refreshToken`, ou un jeton d’accès mis en cache, sont présents                            |
| `oauth-token`        | Le jeton d’accès mis en cache est encore valide, ou le jeton d’actualisation en a généré un nouveau                  |
| `meet-spaces-get`    | Le contrôle facultatif `--meeting` a résolu un espace Meet existant                                                  |
| `meet-spaces-create` | Le contrôle facultatif `--create-space` a créé un nouvel espace Meet                                                 |

Prouvez l’activation de l’API Meet et la portée `spaces.create` avec la vérification de création produisant un effet de bord :

```bash
openclaw googlemeet doctor --oauth --create-space --json
```

Prouvez l’accès en lecture à un espace existant :

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Une réponse `403` à ces vérifications signifie généralement que l’API REST Meet est désactivée, que le jeton d’actualisation ne dispose pas de la portée requise ou que le compte Google ne peut pas accéder à cet espace. Une erreur de jeton d’actualisation signifie que vous devez réexécuter `openclaw googlemeet auth login --json` et stocker le nouveau bloc `oauth`.

Aucun OAuth n’est nécessaire pour la solution de repli via le navigateur ; l’authentification Google provient alors du profil Chrome connecté sur le Node sélectionné, et non de la configuration OpenClaw.

Ces variables d’environnement sont acceptées comme solutions de repli :

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` ou `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` ou `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` ou `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` ou `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` ou `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` ou `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` ou `GOOGLE_MEET_PREVIEW_ACK`

### Résoudre, effectuer les vérifications préalables et lire les artefacts

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Après que Meet a créé les enregistrements de conférence :

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Avec `--meeting`, `artifacts` et `attendance` utilisent par défaut le dernier enregistrement de conférence ; transmettez `--all-conference-records` pour chaque enregistrement conservé.

La recherche dans l’agenda résout l’URL de la réunion depuis Google Calendar avant de lire les artefacts (elle nécessite un jeton d’actualisation incluant la portée de lecture seule des événements Calendar) :

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` recherche dans l’agenda `primary` du jour un événement comportant un lien Meet ; `--event <query>` recherche le texte d’événement correspondant ; `--calendar <id>` cible un agenda non principal. `calendar-events` affiche un aperçu des événements correspondants et indique celui que `latest`/`artifacts`/`attendance`/`export` choisira.

Si vous connaissez déjà l’identifiant de l’enregistrement de conférence, ciblez-le directement :

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Fermez la salle d’un espace créé par l’API :

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Appelle `spaces.endActiveConference` et nécessite OAuth avec la portée `meetings.space.created` pour un espace que le compte autorisé peut gérer. Accepte une URL Meet, un code de réunion ou `spaces/{id}`, puis le résout d’abord en ressource d’espace de l’API. Cette commande est distincte de `googlemeet leave` : `leave` met fin à la participation locale/de session d’OpenClaw ; `end-active-conference` demande à Google Meet de mettre fin à la conférence active de l’espace.

Rédigez un rapport lisible :

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` renvoie les métadonnées de l’enregistrement de conférence ainsi que les métadonnées des ressources de participants, d’enregistrements, de transcriptions, d’entrées de transcription structurées et de notes intelligentes lorsque Google les expose. `--no-transcript-entries` ignore la recherche des entrées pour les réunions volumineuses. `attendance` développe les participants en lignes de sessions de participants avec les heures de première et de dernière présence, la durée totale des sessions, les indicateurs de retard et de départ anticipé, et fusionne les ressources de participants en double selon l’utilisateur connecté ou le nom d’affichage ; `--no-merge-duplicates` conserve les ressources brutes séparées, tandis que `--late-after-minutes`/`--early-before-minutes` règlent les seuils.

`export` écrit un dossier contenant `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` et `manifest.json`. `manifest.json` consigne l’entrée choisie, les options d’exportation, les enregistrements de conférence, les fichiers de sortie, les décomptes, la source du jeton, tout événement Calendar utilisé et les avertissements de récupération partielle. `--zip` écrit également une archive portable à côté du dossier. `--include-doc-bodies` exporte le texte des documents Google Docs liés aux transcriptions et aux notes intelligentes via `files.export` de Drive (nécessite la portée de lecture seule Drive Meet) ; sans cette option, les exportations incluent uniquement les métadonnées Meet et les entrées de transcription structurées. Un échec partiel concernant les artefacts (erreur de listage des notes intelligentes, d’entrée de transcription ou de corps de document) conserve l’avertissement dans le résumé/manifeste au lieu de faire échouer toute l’exportation. `--dry-run` récupère les mêmes données et affiche le JSON du manifeste sans créer le dossier ni le fichier ZIP.

Les agents utilisent les mêmes actions avec l’outil `google_meet` (`export`, `create` avec `accessType`, `end_active_conference`, `test_listen`) ; consultez [Outil](#tool).

### Test de validation rapide en conditions réelles

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

| Variable                                                                                                                  | Objectif                                                                 |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `OPENCLAW_LIVE_TEST=1`                                                                                                    | Active les tests en conditions réelles protégés                          |
| `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`                                                                                       | URL Meet, code ou `spaces/{id}` conservé                                 |
| `OPENCLAW_GOOGLE_MEET_CLIENT_ID` / `GOOGLE_MEET_CLIENT_ID`                                                                | Identifiant client OAuth                                                 |
| `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` / `GOOGLE_MEET_REFRESH_TOKEN`                                                        | Jeton d’actualisation                                                    |
| `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` | Facultatif ; les mêmes noms de repli sans le préfixe `OPENCLAW_` fonctionnent également |

Le test de validation rapide de base des artefacts et de la présence nécessite `meetings.space.readonly` et `meetings.conference.media.readonly`. La recherche dans l’agenda nécessite `calendar.events.readonly`. L’exportation du corps des documents Drive nécessite `drive.meet.readonly`.

### Exemples de création

```bash
openclaw googlemeet create
```

Affiche l’URI de la nouvelle réunion, la source et la session de participation. Avec OAuth, la commande utilise l’API Meet ; sans OAuth, elle utilise le profil connecté du Node Chrome épinglé. JSON de la solution de repli via le navigateur :

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

Si la solution de repli via le navigateur rencontre d’abord la connexion Google ou un blocage d’autorisation Meet, `google_meet` renvoie des détails structurés au lieu d’une simple chaîne :

```json
{
  "source": "browser",
  "error": "google-login-required: Connectez-vous à Google dans le profil de navigateur OpenClaw, puis réessayez de créer la réunion.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Connectez-vous à Google dans le profil de navigateur OpenClaw, puis réessayez de créer la réunion.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

JSON de création par l’API :

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

La création rejoint la réunion par défaut, mais Chrome/Chrome-node nécessite toujours un profil Google connecté pour rejoindre la réunion via le navigateur ; si le profil est déconnecté, OpenClaw signale `manualActionRequired: true` ou une erreur de solution de repli du navigateur et demande à l’opérateur de terminer la connexion Google avant de réessayer.

Définissez `preview.enrollmentAcknowledged: true` uniquement après avoir confirmé que votre projet Cloud, votre principal OAuth et les participants à la réunion sont inscrits au Google Workspace Developer Preview Program pour les API multimédias Meet.

## Configuration

Le parcours courant de l’agent Chrome nécessite uniquement que le Plugin soit activé, ainsi que BlackHole, SoX, une clé de fournisseur en temps réel et un fournisseur TTS OpenClaw configuré :

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

### Valeurs par défaut

| Clé                               | Valeur par défaut                       | Remarques                                                                                                                                                                                                               |
| --------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultTransport`                | `"chrome"`                               |                                                                                                                                                                                                                         |
| `defaultMode`                     | `"agent"`                                | `"realtime"` est accepté comme alias hérité de `"agent"` ; les nouveaux appelants doivent utiliser `"agent"`                                                                                                           |
| `chromeNode.node`                 | non défini                               | Identifiant/nom/adresse IP du Node pour `chrome-node` ; requis lorsque plusieurs Nodes compatibles peuvent être connectés                                                                                               |
| `chrome.launch`                   | `true`                                   | Lance Chrome pour rejoindre la réunion ; définissez `false` uniquement lors de la réutilisation d’une session déjà ouverte                                                                                              |
| `chrome.audioBackend`             | `"blackhole-2ch"`                        |                                                                                                                                                                                                                         |
| `chrome.guestName`                | `"OpenClaw Agent"`                       | Affiché sur l’écran d’invité Meet en mode déconnecté                                                                                                                                                                    |
| `chrome.autoJoin`                 | `true`                                   | Tente de renseigner le nom d’invité et de cliquer sur Join Now dans `chrome-node`                                                                                                                                        |
| `chrome.reuseExistingTab`         | `true`                                   | Active un onglet Meet existant au lieu d’ouvrir des doublons                                                                                                                                                            |
| `chrome.waitForInCallMs`          | `20000`                                  | Attend que l’onglet Meet signale que l’appel est en cours avant de déclencher le message d’introduction vocal                                                                                                            |
| `chrome.audioFormat`              | `"pcm16-24khz"`                          | Format audio de la paire de commandes ; `"g711-ulaw-8khz"` est réservé aux paires de commandes héritées/personnalisées qui émettent de l’audio téléphonique                                                              |
| `chrome.audioBufferBytes`         | `4096`                                   | Tampon de traitement SoX pour les commandes audio générées de la paire de commandes (moitié du tampon par défaut de SoX, soit 8192 octets, afin de réduire la latence du tube) ; les valeurs sont limitées à un minimum de 17 octets |
| `chrome.audioInputCommand`        | commande SoX générée                     | Lit depuis CoreAudio `BlackHole 2ch` et écrit l’audio au format `chrome.audioFormat`                                                                                                                                     |
| `chrome.audioOutputCommand`       | commande SoX générée                     | Lit l’audio au format `chrome.audioFormat` et l’écrit dans CoreAudio `BlackHole 2ch`                                                                                                                                     |
| `chrome.bargeInInputCommand`      | non défini                               | Commande facultative de microphone local écrivant du PCM mono signé 16 bits petit-boutiste pour détecter une interruption humaine pendant la lecture de l’assistant ; s’applique au pont de paire de commandes hébergé par le Gateway |
| `chrome.bargeInRmsThreshold`      | `650`                                    | Niveau RMS considéré comme une interruption humaine                                                                                                                                                                     |
| `chrome.bargeInPeakThreshold`     | `2500`                                   | Niveau de crête considéré comme une interruption humaine                                                                                                                                                                |
| `chrome.bargeInCooldownMs`        | `900`                                    | Délai minimal entre les effacements répétés dus à une interruption                                                                                                                                                       |
| `mode` (par requête)              | `"agent"`                                | Mode de réponse vocale ; consultez le tableau [Modes agent et bidi](#agent-and-bidi-modes)                                                                                                                               |
| `realtime.provider`               | `"openai"`                               | Solution de repli de compatibilité utilisée lorsque les champs délimités ci-dessous ne sont pas définis                                                                                                                 |
| `realtime.transcriptionProvider`  | `"openai"`                               | Identifiant du fournisseur utilisé par le mode `agent` pour la transcription en temps réel                                                                                                                              |
| `realtime.voiceProvider`          | non défini                               | Identifiant du fournisseur utilisé par le mode `bidi` pour la voix directe en temps réel ; définissez-le sur `"google"` pour Gemini Live tout en conservant la transcription du mode agent sur OpenAI. Associez-le à `realtime.model` pour choisir le modèle Gemini Live précis. |
| `realtime.toolPolicy`             | `"safe-read-only"`                       | Consultez [Modes agent et bidi](#agent-and-bidi-modes)                                                                                                                                                                  |
| `realtime.instructions`           | brèves instructions de réponse orale     | Indique au modèle de parler brièvement et d’utiliser `openclaw_agent_consult` pour fournir des réponses plus approfondies                                                                                                |
| `realtime.introMessage`           | `"Say exactly: I'm here and listening."` | Prononcé une fois lorsque le pont en temps réel se connecte ; définissez-le sur `""` pour rejoindre silencieusement                                                                                                      |
| `realtime.agentId`                | `"main"`                                 | Identifiant de l’agent OpenClaw utilisé pour `openclaw_agent_consult`                                                                                                                                                    |
| `voiceCall.enabled`               | `true`                                   | Délègue l’appel PSTN Twilio, le DTMF et le message d’accueil initial au plugin Voice Call                                                                                                                                |
| `voiceCall.dtmfDelayMs`           | `12000`                                  | Attente initiale avant la lecture d’une séquence DTMF dérivée d’un code PIN sur Twilio                                                                                                                                   |
| `voiceCall.postDtmfSpeechDelayMs` | `5000`                                   | Délai avant de demander le message d’accueil initial en temps réel après que Voice Call a démarré la branche Twilio                                                                                                      |

`chrome.audioBridgeCommand` et `chrome.audioBridgeHealthCommand` permettent à un pont externe de prendre en charge l’intégralité du chemin audio local à la place de `chrome.audioInputCommand`/`chrome.audioOutputCommand` ; consultez les [Remarques](#notes) pour connaître la contrainte déterminant le mode qui peut les utiliser.

Une migration `openclaw doctor --fix` existe pour la forme héritée `realtime.provider: "google"` : elle déplace cette intention vers `realtime.voiceProvider: "google"` avec `realtime.transcriptionProvider: "openai"` lorsque ces champs ne sont pas déjà définis.

### Remplacements facultatifs

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
    model: "gemini-3.1-flash-live-preview",
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

ElevenLabs pour l’écoute et la parole en mode agent :

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

La voix Meet persistante provient de `messages.tts.providers.elevenlabs.speakerVoiceId`. Les réponses de l’agent peuvent également utiliser des directives `[[tts:speakerVoiceId=... model=eleven_v3]]` propres à chaque réponse lorsque les remplacements de modèle TTS sont activés, mais la configuration constitue la valeur par défaut déterministe pour les réunions. Lors de la connexion, les journaux affichent `transcriptionProvider=elevenlabs`, et chaque réponse prononcée consigne `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>`.

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

Avec `voiceCall.enabled: true` (valeur par défaut) et le transport Twilio, Voice Call compose la séquence DTMF avant d’ouvrir le flux multimédia en temps réel, puis utilise le texte d’introduction enregistré comme message d’accueil initial en temps réel. Si `voice-call` n’est pas activé, Google Meet peut toujours valider et enregistrer le plan de numérotation, mais ne peut pas passer l’appel Twilio.

Laissez `voiceCall.gatewayUrl` non défini pour utiliser le runtime Gateway local approuvé, ce qui préserve
l’agent appelant pendant tout l’appel. Une URL de Gateway configurée reste une cible WebSocket explicite et
ne peut pas authentifier la provenance du Plugin ; les connexions d’agents autres que celui par défaut échouent de manière sécurisée au lieu
d’utiliser silencieusement un autre agent. Exécutez Google Meet et Voice Call dans le même processus Gateway lorsqu’un routage
par agent est requis.

## Outil

Les agents utilisent l’outil `google_meet` :

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

| `action`                | Objectif                                                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `join`                  | Rejoindre une URL Meet explicite                                                                                       |
| `create`                | Créer un espace (et le rejoindre par défaut) ; prend en charge `accessType`/`entryPointAccess`                        |
| `status`                | Répertorier les sessions actives ou en inspecter une avec `sessionId`                                                  |
| `setup_status`          | Exécuter les mêmes vérifications que `googlemeet setup`                                                               |
| `resolve_space`         | Résoudre une URL/un code/`spaces/{id}` via `spaces.get`                                                               |
| `preflight`             | Valider les prérequis OAuth et de résolution de la réunion                                                             |
| `latest`                | Rechercher le dernier enregistrement de conférence d’une réunion                                                      |
| `calendar_events`       | Prévisualiser les événements Calendar contenant des liens Meet                                                        |
| `artifacts`             | Répertorier les enregistrements de conférence et les métadonnées de participants/d’enregistrements/de transcriptions/de notes intelligentes |
| `attendance`            | Répertorier les participants et leurs sessions                                                                         |
| `export`                | Écrire le lot d’artefacts/de présence/de transcription/de manifeste ; définir `"dryRun": true` pour le manifeste seul |
| `recover_current_tab`   | Activer/inspecter un onglet Meet existant sans en ouvrir un nouveau                                                    |
| `transcript`            | Lire la transcription bornée des sous-titres ; `sinceIndex` reprend à partir du précédent `nextIndex`                |
| `leave`                 | Mettre fin à une session (Chrome clique sur Quitter ; ferme uniquement les onglets qu’il a ouverts ; Twilio raccroche) |
| `end_active_conference` | Mettre fin à la conférence Google Meet active d’un espace géré par API                                                 |
| `speak`                 | Faire parler immédiatement l’agent en temps réel, avec `sessionId` et `message`                                        |
| `test_speech`           | Créer/réutiliser une session, déclencher une phrase connue et renvoyer l’état de Chrome                               |
| `test_listen`           | Créer/réutiliser une session d’observation uniquement et attendre une évolution des sous-titres/de la transcription   |

`test_speech` force toujours `mode: "agent"` ou `"bidi"` et échoue si vous demandez son exécution avec `mode: "transcribe"`, car les sessions d’observation uniquement ne peuvent pas émettre de parole. Son résultat `speechOutputVerified` repose sur l’augmentation du nombre d’octets de sortie audio en temps réel pendant cet appel ; une session réutilisée contenant un audio antérieur ne compte donc pas comme une nouvelle vérification.

Pour les transports Chrome, `leave` laisse ouvert un onglet réutilisé appartenant à l’utilisateur après avoir cliqué sur le bouton Quitter l’appel de Meet. Les onglets ouverts par OpenClaw sont fermés après le départ.

Utilisez `transport: "chrome"` lorsque Chrome s’exécute sur l’hôte du Gateway, et `transport: "chrome-node"` lorsqu’il s’exécute sur un Node appairé. Dans les deux cas, les fournisseurs de modèles et `openclaw_agent_consult` s’exécutent sur l’hôte du Gateway, de sorte que les identifiants des modèles y restent. Les journaux du mode agent incluent le fournisseur/modèle de transcription résolu au démarrage du pont, ainsi que le fournisseur/modèle/la voix/le format de sortie/le taux d’échantillonnage TTS après chaque réponse synthétisée. Le `mode: "realtime"` brut reste accepté comme alias de compatibilité hérité pour `mode: "agent"`, mais il n’est plus annoncé dans l’énumération `mode` de l’outil.

`create` avec une salle adossée à une API et une politique d’accès explicite :

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

Mettre fin à la conférence active d’une salle connue :

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Validation de l’écoute avant d’affirmer qu’une réunion est exploitable :

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Prise de parole à la demande :

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Dites exactement : Je suis là et j’écoute."
}
```

`status` inclut l’état de Chrome lorsqu’il est disponible :

| Champ                                                                 | Signification                                                                                                                            |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `inCall`                                                              | Chrome semble se trouver dans l’appel Meet                                                                                               |
| `micMuted`                                                            | État approximatif du microphone Meet                                                                                                     |
| `manualActionRequired` / `manualActionReason` / `manualActionMessage` | Le profil du navigateur nécessite une connexion manuelle, l’admission par l’hôte Meet, des autorisations ou une réparation du contrôle du navigateur avant que la parole puisse fonctionner |
| `speechReady` / `speechBlockedReason` / `speechBlockedMessage`        | Indique si la parole gérée par Chrome est actuellement autorisée ; `speechReady: false` signifie qu’OpenClaw n’a pas envoyé la phrase d’introduction/de test |
| `providerConnected` / `realtimeReady`                                 | État du pont vocal en temps réel                                                                                                         |
| `lastInputAt` / `lastOutputAt`                                        | Dernier audio reçu du pont/envoyé au pont                                                                                                |
| `audioOutputRouted` / `audioOutputDeviceLabel`                        | Indique si la sortie multimédia de l’onglet Meet a été activement acheminée vers le périphérique BlackHole du pont                      |
| `lastSuppressedInputAt` / `suppressedInputBytes`                      | Entrée de bouclage ignorée pendant la lecture audio de l’assistant                                                                        |

## Modes agent et bidi

| Mode    | Qui décide de la réponse          | Chemin de sortie vocale                   | À utiliser lorsque                                                 |
| ------- | --------------------------------- | ----------------------------------------- | ------------------------------------------------------------------ |
| `agent` | L’agent OpenClaw configuré        | Runtime TTS OpenClaw normal               | Vous souhaitez un comportement « mon agent participe à la réunion » |
| `bidi`  | Le modèle vocal en temps réel     | Réponse audio du fournisseur vocal en temps réel | Vous souhaitez la boucle vocale conversationnelle à la latence la plus faible |

Mode `agent` : le fournisseur de transcription en temps réel reçoit l’audio de la réunion, les transcriptions finales des participants sont acheminées via l’agent OpenClaw configuré, et la réponse est prononcée par le TTS OpenClaw standard. Les fragments proches de transcription finale sont regroupés avant la consultation afin qu’un seul tour de parole ne produise pas plusieurs réponses partielles obsolètes ; l’entrée en temps réel est supprimée tant que l’audio de l’assistant en file d’attente est encore en cours de lecture, et les échos récents de transcription ressemblant aux paroles de l’assistant sont ignorés avant la consultation afin que le bouclage BlackHole n’amène pas l’agent à répondre à ses propres paroles.

Mode `bidi` : le modèle vocal en temps réel répond directement et peut appeler `openclaw_agent_consult` pour un raisonnement plus approfondi, des informations actuelles ou les outils OpenClaw habituels. L’outil de consultation exécute en arrière-plan l’agent OpenClaw standard avec le contexte récent de la transcription de la réunion et renvoie une réponse orale concise ; en mode `agent`, OpenClaw envoie directement cette réponse au TTS, tandis qu’en mode `bidi`, le modèle vocal en temps réel peut la restituer oralement. Il utilise le même mécanisme de consultation partagé que Voice Call.

Par défaut, les consultations s’exécutent avec l’agent `main` ; définissez `realtime.agentId` pour associer un flux Meet à un espace de travail d’agent dédié, à des valeurs par défaut de modèle, à une politique d’outils, à une mémoire et à un historique de session. Les consultations en mode agent utilisent une clé de session `agent:<id>:subagent:google-meet:<session>` propre à chaque réunion, afin que les questions de suivi conservent le contexte de la réunion tout en héritant de la politique normale de l’agent. Lorsqu’un agent appelle `google_meet` en mode agent, la session du consultant duplique la transcription actuelle de l’appelant avant de répondre aux paroles des participants ; la session Meet reste distincte afin que les suivis de réunion ne modifient pas directement la transcription de l’appelant.

`realtime.toolPolicy` contrôle l’exécution de la consultation :

| Politique        | Comportement                                                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Exposer l’outil de consultation ; limiter l’agent standard à `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, `memory_get` |
| `owner`          | Exposer l’outil de consultation ; permettre à l’agent standard d’utiliser sa politique d’outils normale                            |
| `none`           | Ne pas exposer l’outil de consultation au modèle vocal en temps réel                                                               |

La clé de session de consultation est propre à chaque session Meet ; les appels de consultation ultérieurs réutilisent donc le contexte de consultation antérieur pendant la même réunion.

Forcez une vérification vocale de l’état de préparation une fois que Chrome a entièrement rejoint la réunion :

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Test de fumée complet de connexion et de prise de parole :

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Liste de contrôle des tests en conditions réelles

Avant de confier une réunion à un agent sans surveillance :

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

État Chrome-node attendu :

- `googlemeet setup` est entièrement au vert et inclut `chrome-node-connected` lorsque Chrome-node est le transport par défaut ou qu’un Node est épinglé.
- `nodes status` indique que le Node sélectionné est connecté et publie à la fois `googlemeet.chrome` et `browser.proxy`.
- L’onglet Meet rejoint la réunion et `test-speech` renvoie l’état de Chrome avec `inCall: true`.

Pour un hôte Chrome distant, tel qu’une machine virtuelle macOS Parallels, la vérification sûre la plus courte après la mise à jour du Gateway ou de la machine virtuelle est la suivante :

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Cela prouve que le Plugin du Gateway est chargé, que le Node de la machine virtuelle est connecté avec le jeton actuel et que le pont audio Meet est disponible avant qu’un agent n’ouvre un véritable onglet de réunion.

Pour un test de fumée Twilio, utilisez une réunion qui fournit des informations de connexion par téléphone :

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

État Twilio attendu :

- `googlemeet setup` inclut des vérifications vertes pour `twilio-voice-call-plugin`, `twilio-voice-call-credentials` et `twilio-voice-call-webhook`.
- `voicecall` est disponible dans la CLI après le rechargement du Gateway.
- La session renvoyée possède `transport: "twilio"` et un `twilio.voiceCallId`.
- `openclaw logs --follow` montre que le TwiML DTMF est servi avant le TwiML temps réel, puis qu’un pont temps réel est établi avec le message d’accueil initial mis en file d’attente.
- `googlemeet leave <sessionId>` raccroche l’appel vocal délégué.

## Dépannage

### L’agent ne voit pas l’outil Google Meet

Vérifiez que le plugin est activé et rechargez le Gateway ; l’agent en cours d’exécution ne voit que les outils de plugin enregistrés par le processus Gateway actuel :

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Sur les hôtes Gateway autres que macOS, `google_meet` reste visible, mais les actions locales de retour audio de Chrome sont bloquées avant d’atteindre le pont audio. Utilisez `mode: "transcribe"`, l’accès téléphonique Twilio ou un hôte macOS `chrome-node` au lieu du chemin d’agent Chrome local par défaut.

### Aucun Node compatible avec Google Meet n’est connecté

Sur l’hôte du Node :

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Sur l’hôte du Gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Le Node doit être connecté et répertorier `googlemeet.chrome` ainsi que `browser.proxy` ; la configuration du Gateway doit autoriser les deux :

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Si `googlemeet setup` échoue à la vérification `chrome-node-connected`, ou si le journal du Gateway signale `gateway token mismatch`, réinstallez ou redémarrez le Node avec le jeton actuel du Gateway :

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Rechargez ensuite le service du Node et réexécutez :

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Le navigateur s’ouvre, mais l’agent ne peut pas rejoindre la réunion

Exécutez `googlemeet test-listen` pour les connexions en observation seule ou `googlemeet test-speech` pour les connexions en temps réel, puis examinez l’état de santé de Chrome renvoyé. Si l’un ou l’autre signale `manualActionRequired: true`, affichez `manualActionMessage` à l’opérateur et cessez les nouvelles tentatives jusqu’à ce que l’action dans le navigateur soit terminée.

Actions manuelles courantes : se connecter au profil Chrome ; admettre l’invité depuis le compte hôte de Meet ; accorder à Chrome les autorisations d’accès au microphone et à la caméra lorsque l’invite native apparaît ; fermer ou corriger une boîte de dialogue d’autorisation Meet bloquée.

Ne signalez pas « non connecté » uniquement parce que Meet demande « Do you want people to hear you in the meeting? » ; il s’agit de l’écran intermédiaire de choix audio de Meet. OpenClaw clique sur **Use microphone** par automatisation du navigateur lorsque cette option est disponible et continue d’attendre l’état réel de la réunion ; pour le repli sur navigateur réservé à la création, il peut cliquer sur **Continue without microphone** à la place, car la génération de l’URL ne nécessite pas le chemin audio temps réel.

### Échec de la création de la réunion

`googlemeet create` utilise `spaces.create` de l’API Meet lorsque OAuth est configuré, sinon le navigateur du Node Chrome épinglé. Vérifiez les éléments suivants :

- **Création par API** : `oauth.clientId` et `oauth.refreshToken` (ou les variables d’environnement `OPENCLAW_GOOGLE_MEET_*` correspondantes) sont présents, et le jeton d’actualisation a été généré après l’ajout de la prise en charge de la création ; les anciens jetons peuvent ne pas inclure `meetings.space.created`, réexécutez donc `openclaw googlemeet auth login --json`.
- **Repli sur navigateur** : `defaultTransport: "chrome-node"` et `chromeNode.node` désignent un Node connecté disposant de `browser.proxy` et `googlemeet.chrome` ; le profil Chrome d’OpenClaw sur ce Node est connecté et peut ouvrir `https://meet.google.com/new`.
- **Nouvelles tentatives du repli sur navigateur** : réutilisez un onglet `.../new` existant ou un onglet d’invite de compte Google avant d’en ouvrir un nouveau ; relancez l’appel de l’outil plutôt que d’ouvrir manuellement un autre onglet.
- **Action manuelle** : si l’outil renvoie `manualActionRequired: true`, utilisez `browser.nodeId`, `browser.targetId`, `browserUrl` et `manualActionMessage` pour guider l’opérateur ; ne relancez pas l’opération en boucle.
- **Écran intermédiaire de choix audio** : si Meet affiche « Do you want people to hear you in the meeting? », laissez l’onglet ouvert. OpenClaw doit cliquer sur **Use microphone** ou, pour la création seule, sur **Continue without microphone**, puis continuer d’attendre l’URL générée ; s’il n’y parvient pas, l’erreur doit mentionner `meet-audio-choice-required`, et non `google-login-required`.

### L’agent rejoint la réunion, mais ne parle pas

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Utilisez `mode: "agent"` pour le chemin STT -> agent OpenClaw -> TTS, et `mode: "bidi"` pour le repli vocal direct en temps réel. `mode: "transcribe"` ne démarre volontairement aucun pont de retour audio. Pour un débogage en observation seule, exécutez `openclaw googlemeet status --json <session-id>` après que des participants ont parlé et vérifiez `captioning`, `transcriptLines`, `lastCaptionText`. Si `inCall` vaut true mais que `transcriptLines` reste à `0`, les sous-titres Meet peuvent être désactivés, personne n’a parlé depuis l’installation de l’observateur, l’interface de Meet a changé, ou les sous-titres en direct ne sont pas disponibles pour la langue ou le compte de la réunion.

`googlemeet test-speech` vérifie toujours le chemin temps réel et indique si des octets de sortie du pont ont été observés pour cette invocation. Si `speechOutputVerified` vaut false et `speechOutputTimedOut` vaut true, le fournisseur temps réel peut avoir accepté l’énoncé, mais OpenClaw n’a pas constaté que de nouveaux octets de sortie atteignaient le pont audio de Chrome.

Vérifiez également les éléments suivants : une clé de fournisseur temps réel (`OPENAI_API_KEY` ou `GEMINI_API_KEY`) est disponible sur l’hôte du Gateway ; `BlackHole 2ch` est visible sur l’hôte Chrome ; `sox` y est installé ; le microphone et le haut-parleur de Meet sont acheminés par le chemin audio virtuel (`doctor` doit afficher `meet output routed: yes` pour les connexions temps réel via Chrome local).

`googlemeet doctor [session-id]` affiche la session, le Node, l’état de l’appel, la raison de l’action manuelle, la connexion au fournisseur temps réel, `realtimeReady`, l’activité d’entrée et de sortie audio, les derniers horodatages audio, les compteurs d’octets et l’URL du navigateur. Utilisez `googlemeet status [session-id] --json` pour obtenir le JSON brut, et `googlemeet doctor --oauth` (ajoutez `--meeting` ou `--create-space`) pour vérifier l’actualisation OAuth sans exposer les jetons.

Si un agent a dépassé le délai imparti et qu’un onglet Meet est déjà ouvert, examinez-le sans en ouvrir un autre :

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

L’action d’outil équivalente est `recover_current_tab` : elle met au premier plan et examine un onglet Meet existant pour le transport sélectionné (contrôle local du navigateur pour `chrome`, Node configuré pour `chrome-node`) sans ouvrir de nouvel onglet ni de nouvelle session, et signale le blocage actuel (connexion, admission, autorisations, état du choix audio). La commande CLI communique avec le Gateway configuré, qui doit être en cours d’exécution ; `chrome-node` exige également que le Node soit connecté.

### Échec des vérifications de configuration de Twilio

`twilio-voice-call-plugin` échoue lorsque `voice-call` n’est pas autorisé ou activé : ajoutez-le à `plugins.allow`, activez `plugins.entries.voice-call`, puis rechargez le Gateway.

`twilio-voice-call-credentials` échoue lorsque le backend Twilio ne dispose pas du SID du compte, du jeton d’authentification ou du numéro de l’appelant :

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` échoue lorsque `voice-call` ne dispose d’aucune exposition publique du Webhook, ou lorsque `publicUrl` désigne l’espace réseau de bouclage ou un réseau privé. N’utilisez pas `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` ou `fd00::/8` comme `publicUrl` ; les rappels de l’opérateur ne peuvent pas les atteindre. Définissez `plugins.entries.voice-call.config.publicUrl` sur une URL publique, ou configurez une exposition par tunnel ou Tailscale :

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

Pour le développement local, utilisez une exposition par tunnel ou Tailscale plutôt qu’une URL d’hôte privée :

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // ou
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Redémarrez ou rechargez le Gateway, puis exécutez :

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

Par défaut, `voicecall smoke` vérifie uniquement l’état de préparation. Effectuez une simulation pour un numéro précis :

```bash
openclaw voicecall smoke --to "+15555550123"
```

Ajoutez `--yes` uniquement pour passer volontairement un appel sortant réel :

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### L’appel Twilio démarre, mais n’entre jamais dans la réunion

Vérifiez que l’événement Meet expose les informations d’accès téléphonique, puis transmettez le numéro d’accès exact ainsi que le code PIN ou une séquence DTMF personnalisée :

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Utilisez des `w` initiaux ou des virgules dans `--dtmf-sequence` pour introduire une pause avant le code PIN.

Si l’appel est créé, mais que la liste des participants Meet n’affiche jamais le participant connecté par téléphone :

- `openclaw googlemeet doctor <session-id>` : vérifiez l’identifiant de l’appel Twilio délégué, si la séquence DTMF a été mise en file d’attente et si le message d’accueil a été demandé.
- `openclaw voicecall status --call-id <id>` : vérifiez que l’appel est toujours actif.
- `openclaw voicecall tail` : vérifiez que les Webhooks Twilio arrivent au Gateway.
- `openclaw logs --follow` : recherchez la séquence Twilio Meet : Google Meet délègue la connexion, Voice Call stocke et sert le TwiML DTMF préalable à la connexion, Voice Call sert le TwiML temps réel pour l’appel Twilio, puis Google Meet demande le message d’introduction avec `voicecall.speak`.
- Réexécutez `openclaw googlemeet setup --transport twilio` ; une vérification de configuration verte est requise, mais ne prouve pas que la séquence du code PIN de la réunion est correcte.
- Vérifiez que le numéro d’accès appartient à la même invitation Meet et à la même région que le code PIN.
- Augmentez `voiceCall.dtmfDelayMs` par rapport à la valeur par défaut de 12 secondes si Meet répond lentement ou si la transcription de l’appel affiche toujours l’invite de saisie du code PIN après l’envoi de la séquence DTMF préalable à la connexion.
- Si le participant rejoint la réunion, mais que vous n’entendez pas le message d’accueil, recherchez dans `openclaw logs --follow` la requête `voicecall.speak` postérieure à la séquence DTMF, ainsi que la lecture TTS par flux multimédia ou le repli Twilio `<Say>`. Si la transcription affiche toujours « enter the meeting PIN », le segment téléphonique n’a pas encore rejoint la salle Meet ; les participants n’entendront donc aucun message.

Si les Webhooks n’arrivent pas, déboguez d’abord le plugin Voice Call : le fournisseur doit pouvoir atteindre `plugins.entries.voice-call.config.publicUrl` ou le tunnel configuré. Consultez [Dépannage des appels vocaux](/fr/plugins/voice-call#troubleshooting).

## Remarques

L’API multimédia officielle de Google Meet est orientée réception ; parler dans un appel nécessite donc toujours un chemin de participation. Ce plugin rend cette limite explicite : Chrome gère la participation par navigateur et l’acheminement audio local ; Twilio gère la participation par accès téléphonique.

Les modes de retour audio de Chrome nécessitent `BlackHole 2ch` ainsi que l’une des options suivantes :

- `chrome.audioInputCommand` avec `chrome.audioOutputCommand` : OpenClaw contrôle le pont et achemine le son au format `chrome.audioFormat` entre ces commandes et le fournisseur sélectionné. Le mode `agent` utilise la transcription en temps réel avec la TTS standard ; le mode `bidi` utilise le fournisseur vocal temps réel. Le chemin par défaut utilise PCM16 à 24 kHz avec `chrome.audioBufferBytes: 4096` ; le G.711 mu-law à 8 kHz reste disponible pour les anciennes paires de commandes.
- `chrome.audioBridgeCommand` : une commande de pont externe contrôle l’ensemble du chemin audio local et doit se terminer après le démarrage ou la validation de son démon. Valide uniquement pour `bidi`, car le mode `agent` nécessite un accès direct à la paire de commandes pour la TTS.

Avec le pont Chrome à paire de commandes, `chrome.bargeInInputCommand` peut écouter un microphone local distinct et interrompre la lecture de l’assistant lorsqu’une personne commence à parler, afin que la parole humaine reste prioritaire sur la sortie de l’assistant, même lorsque l’entrée de bouclage BlackHole partagée est temporairement désactivée pendant la lecture de l’assistant. Comme `chrome.audioInputCommand`/`chrome.audioOutputCommand`, il s’agit d’une commande locale configurée par l’opérateur : utilisez un chemin de commande approuvé explicite ou une liste d’arguments, jamais un script provenant d’un emplacement non approuvé.

Pour un son duplex propre, acheminez la sortie de Meet et le microphone de Meet via des périphériques virtuels distincts ou un graphe de périphériques virtuels de type Loopback ; un périphérique BlackHole partagé unique peut renvoyer l’écho des autres participants dans l’appel.

`googlemeet speak` déclenche le pont audio de réponse actif pour une session Chrome ; `googlemeet leave` l’arrête (et, pour les sessions Twilio déléguées via Voice Call, raccroche l’appel sous-jacent). Utilisez `googlemeet end-active-conference` pour fermer également la conférence Google Meet active d’un espace géré par API.

## Articles connexes

- [Plugin d’appel vocal](/fr/plugins/voice-call)
- [Mode conversation](/fr/nodes/talk)
- [Création de plugins](/fr/plugins/building-plugins)
