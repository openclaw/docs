---
read_when:
    - Vous voulez qu’un agent OpenClaw rejoigne un appel Google Meet
    - Vous voulez qu’un agent OpenClaw crée un nouvel appel Google Meet
    - Vous configurez Chrome, le nœud Chrome ou Twilio comme transport Google Meet
summary: 'Plugin Google Meet : rejoindre des URL Meet explicites via Chrome ou Twilio avec des paramètres par défaut de réponse vocale de l’agent'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-06-27T17:48:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e85d531897e3aeadf0ac718f82a7aac5ce73715e182e96ceba77cb76eff094c4
    source_path: plugins/google-meet.md
    workflow: 16
---

Prise en charge des participants Google Meet pour OpenClaw — le plugin est explicite par conception :

- Il rejoint uniquement une URL explicite `https://meet.google.com/...`.
- Il peut créer un nouvel espace Meet via l’API Google Meet, puis rejoindre l’URL
  retournée.
- `agent` est le mode de réponse vocale par défaut : la transcription en temps
  réel écoute, l’agent OpenClaw configuré répond, et le TTS OpenClaw standard
  parle dans Meet.
- `bidi` reste disponible comme mode de repli direct du modèle vocal en temps réel.
- Les agents choisissent le comportement de connexion avec `mode` : utilisez
  `agent` pour l’écoute/réponse vocale en direct, `bidi` pour le repli vocal
  direct en temps réel, ou `transcribe` pour rejoindre/contrôler le navigateur
  sans le pont de réponse vocale.
- L’authentification commence par OAuth Google personnel ou par un profil Chrome
  déjà connecté.
- Il n’y a pas d’annonce automatique de consentement.
- Le backend audio Chrome par défaut est `BlackHole 2ch`.
- Chrome peut s’exécuter localement ou sur un hôte de nœud appairé.
- Twilio accepte un numéro d’appel entrant ainsi qu’un PIN ou une séquence DTMF
  facultatifs ; il ne peut pas composer directement une URL Meet.
- La commande CLI est `googlemeet` ; `meet` est réservé aux workflows de
  téléconférence plus larges des agents.

## Démarrage rapide

Installez les dépendances audio locales et configurez un fournisseur de
transcription en temps réel ainsi que le TTS OpenClaw standard. OpenAI est le
fournisseur de transcription par défaut ; Google Gemini Live fonctionne aussi
comme repli vocal `bidi` séparé avec `realtime.voiceProvider: "google"` :

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
export GEMINI_API_KEY=...
```

`blackhole-2ch` installe le périphérique audio virtuel `BlackHole 2ch`. Le
programme d’installation Homebrew nécessite un redémarrage avant que macOS
n’expose le périphérique :

```bash
sudo reboot
```

Après le redémarrage, vérifiez les deux éléments :

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

Vérifiez la configuration :

```bash
openclaw googlemeet setup
```

La sortie de configuration est conçue pour être lisible par les agents et
consciente du mode. Elle indique le profil Chrome, l’épinglage du nœud et, pour
les connexions Chrome en temps réel, le pont audio BlackHole/SoX ainsi que les
vérifications différées de l’introduction en temps réel. Pour les connexions en
observation seule, vérifiez le même transport avec `--mode transcribe` ; ce mode
ignore les prérequis audio en temps réel, car il n’écoute ni ne parle à travers
le pont :

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Lorsque la délégation Twilio est configurée, la configuration indique aussi si
le plugin `voice-call`, les identifiants Twilio et l’exposition publique du
webhook sont prêts. Traitez toute vérification `ok: false` comme un blocage pour
le transport et le mode vérifiés avant de demander à un agent de rejoindre.
Utilisez `openclaw googlemeet setup --json` pour les scripts ou une sortie
lisible par machine. Utilisez `--transport chrome`, `--transport chrome-node` ou
`--transport twilio` pour pré-vérifier un transport précis avant qu’un agent ne
l’essaie.

Pour Twilio, pré-vérifiez toujours explicitement le transport lorsque le
transport par défaut est Chrome :

```bash
openclaw googlemeet setup --transport twilio
```

Cela détecte un câblage `voice-call` manquant, des identifiants Twilio absents
ou une exposition webhook inaccessible avant que l’agent n’essaie de composer le
numéro de la réunion.

Rejoignez une réunion :

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Ou laissez un agent rejoindre via l’outil `google_meet` :

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

L’outil `google_meet` destiné aux agents reste disponible sur les hôtes non
macOS pour les flux d’artifacts, calendrier, configuration, transcription,
Twilio et `chrome-node`. Les actions locales de réponse vocale Chrome y sont
bloquées, car le chemin audio Chrome intégré dépend actuellement de
`BlackHole 2ch` sous macOS. Sous Linux, utilisez `mode: "transcribe"`, l’appel
entrant Twilio ou un hôte macOS `chrome-node` pour la participation Chrome avec
réponse vocale.

Créez une nouvelle réunion et rejoignez-la :

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

Pour les salles créées par API, utilisez Google Meet `SpaceConfig.accessType`
lorsque vous voulez que la politique d’entrée sans demande d’admission de la
salle soit explicite plutôt qu’héritée des paramètres par défaut du compte
Google :

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` permet à toute personne disposant de l’URL Meet de rejoindre sans
demander l’admission. `TRUSTED` permet aux utilisateurs de confiance de
l’organisation hôte, aux utilisateurs externes invités et aux utilisateurs par
appel entrant de rejoindre sans demander l’admission. `RESTRICTED` limite
l’entrée sans demande d’admission aux invités. Ces paramètres ne s’appliquent
qu’au chemin officiel de création via l’API Google Meet ; les identifiants OAuth
doivent donc être configurés.

Si vous avez authentifié Google Meet avant que cette option soit disponible,
relancez `openclaw googlemeet auth login --json` après avoir ajouté le scope
`meetings.space.settings` à votre écran de consentement OAuth Google.

Créez uniquement l’URL sans rejoindre :

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` possède deux chemins :

- Création par API : utilisée lorsque les identifiants OAuth Google Meet sont
  configurés. C’est le chemin le plus déterministe et il ne dépend pas de l’état
  de l’interface du navigateur.
- Repli navigateur : utilisé lorsque les identifiants OAuth sont absents.
  OpenClaw utilise le nœud Chrome épinglé, ouvre `https://meet.google.com/new`,
  attend que Google redirige vers une vraie URL avec code de réunion, puis
  retourne cette URL. Ce chemin exige que le profil Chrome OpenClaw sur le nœud
  soit déjà connecté à Google. L’automatisation du navigateur gère la propre
  invite micro de premier lancement de Meet ; cette invite n’est pas traitée
  comme un échec de connexion Google.
  Les flux de connexion et de création essaient aussi de réutiliser un onglet
  Meet existant avant d’en ouvrir un nouveau. La correspondance ignore les
  chaînes de requête inoffensives comme `authuser`, afin qu’une nouvelle
  tentative de l’agent se concentre sur la réunion déjà ouverte au lieu de créer
  un deuxième onglet Chrome.

La sortie de commande/d’outil inclut un champ `source` (`api` ou `browser`) afin
que les agents puissent expliquer quel chemin a été utilisé. `create` rejoint la
nouvelle réunion par défaut et retourne `joined: true` ainsi que la session de
connexion. Pour seulement générer l’URL, utilisez `create --no-join` dans la CLI
ou passez `"join": false` à l’outil.

Ou dites à un agent : « Crée un Google Meet, rejoins-le avec le mode de réponse
vocale de l’agent, et envoie-moi le lien. » L’agent doit appeler `google_meet`
avec `action: "create"`, puis partager le `meetingUri` retourné.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Pour une connexion en observation seule/contrôle du navigateur, définissez
`"mode": "transcribe"`. Cela ne démarre pas le pont vocal duplex en temps réel,
ne nécessite pas BlackHole ni SoX, et ne parlera pas dans la réunion. Les
connexions Chrome dans ce mode évitent aussi l’octroi de permissions
micro/caméra d’OpenClaw et évitent le chemin **Use microphone** de Meet. Si Meet
affiche un interstitiel de choix audio, l’automatisation essaie le chemin sans
microphone et, sinon, signale une action manuelle au lieu d’ouvrir le microphone
local. En mode transcribe, les transports Chrome gérés installent aussi un
observateur de sous-titres Meet au mieux. `googlemeet status --json` et
`googlemeet doctor` exposent `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText` et
une courte fin `recentTranscript` afin que les opérateurs puissent savoir si le
navigateur a rejoint l’appel et si les sous-titres Meet produisent du texte.
Utilisez `openclaw googlemeet test-listen <meet-url> --transport chrome-node`
lorsque vous avez besoin d’une sonde oui/non : elle rejoint en mode transcribe,
attend un nouveau sous-titre ou un mouvement de transcription, puis retourne
`listenVerified`, `listenTimedOut`, les champs d’action manuelle et le dernier
état des sous-titres.

Pendant les sessions en temps réel, le statut `google_meet` inclut l’état du
navigateur et du pont audio, comme `inCall`, `manualActionRequired`,
`providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`,
les derniers horodatages d’entrée/sortie, les compteurs d’octets et l’état de
fermeture du pont. Si une invite sûre de page Meet apparaît, l’automatisation du
navigateur la gère lorsque c’est possible. Les invites de connexion, d’admission
par l’hôte et de permission navigateur/OS sont signalées comme action manuelle,
avec une raison et un message que l’agent doit relayer. Les sessions Chrome
gérées n’émettent la phrase d’introduction ou de test qu’après que l’état du
navigateur indique `inCall: true` ; sinon, le statut indique
`speechReady: false` et la tentative de parole est bloquée au lieu de prétendre
que l’agent a parlé dans la réunion.

Les connexions Chrome locales passent par le profil navigateur OpenClaw connecté.
Le mode en temps réel nécessite `BlackHole 2ch` pour le chemin
microphone/haut-parleur utilisé par OpenClaw. Pour un audio duplex propre,
utilisez des périphériques virtuels séparés ou un graphe de style Loopback ; un
seul périphérique BlackHole suffit pour un premier test de fumée, mais peut
produire de l’écho.

### Gateway local + Chrome Parallels

Vous n’avez **pas** besoin d’un Gateway OpenClaw complet ni d’une clé d’API de
modèle dans une VM macOS simplement pour que la VM possède Chrome. Exécutez le
Gateway et l’agent localement, puis exécutez un hôte de nœud dans la VM. Activez
le plugin intégré une fois sur la VM afin que le nœud annonce la commande Chrome :

Ce qui s’exécute où :

- Hôte Gateway : OpenClaw Gateway, espace de travail de l’agent, clés de
  modèle/API, fournisseur en temps réel et configuration du plugin Google Meet.
- VM macOS Parallels : CLI/hôte de nœud OpenClaw, Google Chrome, SoX,
  BlackHole 2ch et un profil Chrome connecté à Google.
- Non nécessaire dans la VM : service Gateway, configuration d’agent, clé
  OpenAI/GPT ou configuration de fournisseur de modèle.

Installez les dépendances de la VM :

```bash
brew install blackhole-2ch sox
```

Redémarrez la VM après l’installation de BlackHole afin que macOS expose
`BlackHole 2ch` :

```bash
sudo reboot
```

Après le redémarrage, vérifiez que la VM voit le périphérique audio et les
commandes SoX :

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Installez ou mettez à jour OpenClaw dans la VM, puis activez-y le plugin intégré :

```bash
openclaw plugins enable google-meet
```

Démarrez l’hôte de nœud dans la VM :

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Si `<gateway-host>` est une IP LAN et que vous n’utilisez pas TLS, le nœud
refuse le WebSocket en clair sauf si vous l’autorisez explicitement pour ce
réseau privé de confiance :

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Utilisez la même variable d’environnement lorsque vous installez le nœud comme
LaunchAgent :

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` est un environnement de processus, pas un
paramètre `openclaw.json`. `openclaw node install` le stocke dans
l’environnement du LaunchAgent lorsqu’il est présent sur la commande
d’installation.

Approuvez le nœud depuis l’hôte Gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Confirmez que le Gateway voit le nœud et qu’il annonce à la fois
`googlemeet.chrome` et la capacité navigateur/`browser.proxy` :

```bash
openclaw nodes status
```

Acheminez Meet via ce nœud sur l’hôte Gateway :

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

Rejoignez maintenant normalement depuis l’hôte Gateway :

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

ou demandez à l’agent d’utiliser l’outil `google_meet` avec
`transport: "chrome-node"`.

Pour un test de fumée en une commande qui crée ou réutilise une session, prononce
une phrase connue et affiche l’état de la session :

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Pendant une jonction en temps réel, l’automatisation du navigateur OpenClaw renseigne le nom de l’invité, clique sur
Rejoindre/Demander à rejoindre, et accepte le choix de première exécution « Use microphone » de Meet lorsque cette
invite apparaît. Pendant une jonction en observation seule ou la création d’une réunion uniquement dans le navigateur, elle
continue après la même invite sans microphone lorsque ce choix est disponible.
Si le profil de navigateur n’est pas connecté, si Meet attend l’admission par l’hôte,
si Chrome a besoin de l’autorisation microphone/caméra pour une jonction en temps réel, ou si Meet est bloqué
sur une invite que l’automatisation n’a pas pu résoudre, le résultat de join/test-speech indique
`manualActionRequired: true` avec `manualActionReason` et
`manualActionMessage`. Les agents doivent arrêter de réessayer la jonction, signaler ce
message exact avec les valeurs actuelles de `browserUrl`/`browserTitle`, et ne réessayer qu’une fois
l’action manuelle dans le navigateur terminée.

Si `chromeNode.node` est omis, OpenClaw sélectionne automatiquement uniquement lorsqu’un seul
nœud connecté annonce à la fois `googlemeet.chrome` et le contrôle du navigateur. Si
plusieurs nœuds capables sont connectés, définissez `chromeNode.node` sur l’id du nœud,
le nom d’affichage ou l’IP distante.

Vérifications d’échecs courants :

- `Configured Google Meet node ... is not usable: offline` : le nœud épinglé est
  connu du Gateway mais indisponible. Les agents doivent traiter ce nœud comme
  un état de diagnostic, et non comme un hôte Chrome utilisable, et signaler le bloqueur de configuration
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
- Chrome s’ouvre mais ne peut pas rejoindre : connectez-vous au profil du navigateur dans la VM, ou
  conservez `chrome.guestName` défini pour une jonction en tant qu’invité. La jonction automatique en invité utilise l’automatisation
  du navigateur OpenClaw via le proxy de navigateur du nœud ; vérifiez que la configuration du navigateur du nœud
  pointe vers le profil souhaité, par exemple
  `browser.defaultProfile: "user"` ou un profil de session existante nommé.
- Onglets Meet en double : laissez `chrome.reuseExistingTab: true` activé. OpenClaw
  active un onglet existant pour la même URL Meet avant d’en ouvrir un nouveau, et
  la création de réunion dans le navigateur réutilise un onglet `https://meet.google.com/new`
  en cours ou une invite de compte Google avant d’en ouvrir un autre.
- Pas d’audio : dans Meet, faites passer le microphone/haut-parleur par le chemin du périphérique audio virtuel
  utilisé par OpenClaw ; utilisez des périphériques virtuels séparés ou un routage de type Loopback
  pour un audio duplex propre.

## Notes d’installation

La valeur par défaut du retour vocal Chrome utilise deux outils externes :

- `sox` : utilitaire audio en ligne de commande. Le plugin utilise des commandes de périphérique CoreAudio
  explicites pour le pont audio PCM16 24 kHz par défaut.
- `blackhole-2ch` : pilote audio virtuel macOS. Il crée le périphérique audio `BlackHole 2ch`
  par lequel Chrome/Meet peut router l’audio.

OpenClaw n’intègre ni ne redistribue aucun des deux paquets. La documentation demande aux utilisateurs de
les installer comme dépendances hôte via Homebrew. SoX est sous licence
`LGPL-2.0-only AND GPL-2.0-only` ; BlackHole est sous GPL-3.0. Si vous créez un
programme d’installation ou une appliance qui intègre BlackHole avec OpenClaw, examinez les conditions
de licence amont de BlackHole ou obtenez une licence séparée auprès d’Existential Audio.

## Transports

### Chrome

Le transport Chrome ouvre l’URL Meet via le contrôle de navigateur OpenClaw et rejoint
avec le profil de navigateur OpenClaw connecté. Sur macOS, le plugin vérifie la présence de
`BlackHole 2ch` avant le lancement. S’il est configuré, il exécute aussi une commande de santé du pont audio
et une commande de démarrage avant d’ouvrir Chrome. Utilisez `chrome` lorsque
Chrome/l’audio s’exécutent sur l’hôte Gateway ; utilisez `chrome-node` lorsque Chrome/l’audio s’exécutent
sur un nœud appairé tel qu’une VM macOS Parallels. Pour Chrome local, choisissez le
profil avec `browser.defaultProfile` ; `chrome.browserProfile` est transmis aux hôtes
`chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Acheminez l’audio du microphone et du haut-parleur Chrome via le pont audio OpenClaw local.
Si `BlackHole 2ch` n’est pas installé, la jonction échoue avec une erreur de configuration
au lieu de rejoindre silencieusement sans chemin audio.

### Twilio

Le transport Twilio est un plan d’appel strict délégué au plugin Voice Call. Il
n’analyse pas les pages Meet pour y rechercher des numéros de téléphone.

Utilisez-le lorsque la participation via Chrome n’est pas disponible ou si vous voulez une solution de repli
par appel téléphonique. Google Meet doit exposer un numéro d’appel et un PIN pour la
réunion ; OpenClaw ne les découvre pas depuis la page Meet.

Activez le plugin Voice Call sur l’hôte Gateway, pas sur le nœud Chrome :

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

Fournissez les identifiants Twilio via l’environnement ou la configuration. L’environnement garde
les secrets hors de `openclaw.json` :

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Utilisez plutôt `realtime.provider: "openai"` avec le plugin fournisseur OpenAI et
`OPENAI_API_KEY` si c’est votre fournisseur de voix en temps réel.

Redémarrez ou rechargez le Gateway après avoir activé `voice-call` ; les changements de configuration de plugin
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

## OAuth et vérification préalable

OAuth est facultatif pour créer un lien Meet, car `googlemeet create` peut se rabattre
sur l’automatisation du navigateur. Configurez OAuth lorsque vous voulez la création via l’API officielle,
la résolution d’espaces ou les vérifications préalables de l’API Meet Media.

L’accès à l’API Google Meet utilise l’OAuth utilisateur : créez un client OAuth Google Cloud,
demandez les portées requises, autorisez un compte Google, puis stockez le
jeton d’actualisation obtenu dans la configuration du plugin Google Meet ou fournissez les variables
d’environnement `OPENCLAW_GOOGLE_MEET_*`.

OAuth ne remplace pas le chemin de jonction Chrome. Les transports Chrome et Chrome-node
rejoignent toujours via un profil Chrome connecté, BlackHole/SoX, et un nœud connecté
lorsque vous utilisez la participation par navigateur. OAuth sert uniquement au chemin officiel de l’API Google
Meet : créer des espaces de réunion, résoudre des espaces et exécuter des vérifications préalables de l’API Meet Media.

### Créer des identifiants Google

Dans Google Cloud Console :

1. Créez ou sélectionnez un projet Google Cloud.
2. Activez **Google Meet REST API** pour ce projet.
3. Configurez l’écran de consentement OAuth.
   - **Internal** est le plus simple pour une organisation Google Workspace.
   - **External** fonctionne pour les configurations personnelles/de test ; tant que l’application est en test,
     ajoutez chaque compte Google qui autorisera l’application comme utilisateur de test.
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

`meetings.space.created` est requis par Google Meet `spaces.create`.
`meetings.space.readonly` permet à OpenClaw de résoudre des URL/codes Meet en espaces.
`meetings.space.settings` permet à OpenClaw de transmettre des paramètres `SpaceConfig` tels que
`accessType` pendant la création de salle via l’API.
`meetings.conference.media.readonly` sert aux vérifications préalables de l’API Meet Media et au travail
média ; Google peut exiger une inscription au Developer Preview pour l’utilisation réelle de l’API Media.
Si vous avez seulement besoin de jonctions Chrome basées sur le navigateur, ignorez entièrement OAuth.

### Émettre le jeton d’actualisation

Configurez `oauth.clientId` et éventuellement `oauth.clientSecret`, ou transmettez-les comme
variables d’environnement, puis exécutez :

```bash
openclaw googlemeet auth login --json
```

La commande affiche un bloc de configuration `oauth` avec un jeton d’actualisation. Elle utilise PKCE,
un callback localhost sur `http://localhost:8085/oauth2callback`, et un flux manuel
copier/coller avec `--manual`.

Exemples :

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Utilisez le mode manuel lorsque le navigateur ne peut pas atteindre le callback local :

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

Stockez l’objet `oauth` sous la configuration du plugin Google Meet :

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
Si des valeurs de configuration et d’environnement sont toutes deux présentes, le plugin résout d’abord
la configuration puis utilise l’environnement comme solution de repli.

Le consentement OAuth inclut la création d’espaces Meet, l’accès en lecture aux espaces Meet et l’accès
en lecture aux médias de conférence Meet. Si vous vous êtes authentifié avant l’existence du support de création
de réunions, réexécutez `openclaw googlemeet auth login --json` afin que le jeton d’actualisation
ait la portée `meetings.space.created`.

### Vérifier OAuth avec doctor

Exécutez le doctor OAuth lorsque vous voulez une vérification de santé rapide et sans secret :

```bash
openclaw googlemeet doctor --oauth --json
```

Cela ne charge pas le runtime Chrome et ne nécessite pas de nœud Chrome connecté. Il
vérifie que la configuration OAuth existe et que le jeton d’actualisation peut émettre un jeton
d’accès. Le rapport JSON inclut uniquement des champs d’état tels que `ok`, `configured`,
`tokenSource`, `expiresAt` et des messages de vérification ; il n’affiche pas le jeton d’accès,
le jeton d’actualisation ni le secret client.

Résultats courants :

| Vérification         | Signification                                                                          |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` plus `oauth.refreshToken`, ou un jeton d’accès mis en cache, est présent. |
| `oauth-token`        | Le jeton d’accès mis en cache est encore valide, ou le jeton d’actualisation a émis un nouveau jeton d’accès. |
| `meet-spaces-get`    | La vérification facultative `--meeting` a résolu un espace Meet existant.               |
| `meet-spaces-create` | La vérification facultative `--create-space` a créé un nouvel espace Meet.              |

Pour prouver également l’activation de l’API Google Meet et le périmètre `spaces.create`, exécutez la vérification de création avec effet de bord :

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` crée une URL Meet jetable. Utilisez-le lorsque vous devez confirmer que le projet Google Cloud a l’API Meet activée et que le compte autorisé dispose du périmètre `meetings.space.created`.

Pour prouver l’accès en lecture à un espace de réunion existant :

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` et `resolve-space` prouvent l’accès en lecture à un espace existant auquel le compte Google autorisé peut accéder. Un `403` provenant de ces vérifications signifie généralement que l’API REST Google Meet est désactivée, que le jeton d’actualisation consenti ne contient pas le périmètre requis, ou que le compte Google ne peut pas accéder à cet espace Meet. Une erreur de jeton d’actualisation signifie qu’il faut relancer `openclaw googlemeet auth login --json` et stocker le nouveau bloc `oauth`.

Aucun identifiant OAuth n’est nécessaire pour le repli navigateur. Dans ce mode, l’authentification Google provient du profil Chrome connecté sur le nœud sélectionné, et non de la configuration OpenClaw.

Ces variables d’environnement sont acceptées comme replis :

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` ou `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` ou `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` ou `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` ou `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` ou
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` ou `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` ou `GOOGLE_MEET_PREVIEW_ACK`

Résoudre une URL Meet, un code ou `spaces/{id}` via `spaces.get` :

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Exécuter le prévol avant les opérations multimédias :

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Lister les artefacts de réunion et la présence après que Meet a créé les enregistrements de conférence :

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Avec `--meeting`, `artifacts` et `attendance` utilisent par défaut le dernier enregistrement de conférence. Passez `--all-conference-records` lorsque vous voulez tous les enregistrements conservés pour cette réunion.

La recherche Calendar peut résoudre l’URL de réunion depuis Google Calendar avant de lire les artefacts Meet :

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` recherche dans le calendrier `primary` du jour un événement Calendar contenant un lien Google Meet. Utilisez `--event <query>` pour rechercher le texte d’événements correspondant, et `--calendar <id>` pour un calendrier non principal. La recherche Calendar nécessite une nouvelle connexion OAuth qui inclut le périmètre de lecture seule des événements Calendar. `calendar-events` prévisualise les événements Meet correspondants et marque l’événement que `latest`, `artifacts`, `attendance` ou `export` choisira.

Si vous connaissez déjà l’id de l’enregistrement de conférence, adressez-le directement :

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Terminer une conférence active pour un espace créé par API lorsque vous voulez fermer la salle après l’appel :

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Cela appelle Google Meet `spaces.endActiveConference` et nécessite OAuth avec le périmètre `meetings.space.created` pour un espace que le compte autorisé peut gérer. OpenClaw accepte une URL Meet, un code de réunion ou une entrée `spaces/{id}` et la résout vers la ressource d’espace de l’API avant de terminer la conférence active. C’est distinct de `googlemeet leave` : `leave` arrête la participation locale/de session d’OpenClaw, tandis que `end-active-conference` demande à Google Meet de terminer la conférence active pour l’espace.

Rédiger un rapport lisible :

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

`artifacts` renvoie les métadonnées d’enregistrement de conférence ainsi que les métadonnées de ressources de participants, d’enregistrement, de transcription, d’entrées de transcription structurées et de notes intelligentes lorsque Google les expose pour la réunion. Utilisez `--no-transcript-entries` pour ignorer la recherche d’entrées pour les grandes réunions. `attendance` développe les participants en lignes de sessions de participant avec les heures de première/dernière apparition, la durée totale de session, les indicateurs de retard/départ anticipé, et les ressources de participant en double fusionnées par utilisateur connecté ou nom d’affichage. Passez `--no-merge-duplicates` pour conserver séparément les ressources brutes de participants, `--late-after-minutes` pour ajuster la détection des retards, et `--early-before-minutes` pour ajuster la détection des départs anticipés.

`export` écrit un dossier contenant `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` et `manifest.json`. `manifest.json` consigne l’entrée choisie, les options d’export, les enregistrements de conférence, les fichiers de sortie, les décomptes, la source du jeton, l’événement Calendar lorsqu’il en a été utilisé un, et tout avertissement de récupération partielle. Passez `--zip` pour écrire également une archive portable à côté du dossier. Passez `--include-doc-bodies` pour exporter le texte des Google Docs de transcription et de notes intelligentes liés via Google Drive `files.export` ; cela nécessite une nouvelle connexion OAuth qui inclut le périmètre de lecture seule Drive Meet. Sans `--include-doc-bodies`, les exports incluent uniquement les métadonnées Meet et les entrées de transcription structurées. Si Google renvoie un échec partiel d’artefact, comme une erreur de listage de notes intelligentes, d’entrée de transcription ou de corps de document Drive, le résumé et le manifeste conservent l’avertissement au lieu de faire échouer tout l’export. Utilisez `--dry-run` pour récupérer les mêmes données d’artefacts/de présence et imprimer le JSON du manifeste sans créer le dossier ni le ZIP. C’est utile avant d’écrire un gros export ou lorsqu’un agent n’a besoin que des décomptes, des enregistrements sélectionnés et des avertissements.

Les agents peuvent aussi créer le même paquet via l’outil `google_meet` :

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Définissez `"dryRun": true` pour renvoyer uniquement le manifeste d’export et ignorer les écritures de fichiers.

Les agents peuvent aussi créer une salle appuyée par l’API avec une politique d’accès explicite :

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

Et ils peuvent terminer la conférence active pour une salle connue :

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Pour une validation avec écoute d’abord, les agents doivent utiliser `test_listen` avant d’affirmer que la réunion est utile :

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Exécuter le smoke test live protégé contre une vraie réunion conservée :

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Exécuter la sonde navigateur live avec écoute d’abord contre une réunion où quelqu’un parlera avec les sous-titres Meet disponibles :

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Environnement du smoke test live :

- `OPENCLAW_LIVE_TEST=1` active les tests live protégés.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` pointe vers une URL Meet conservée, un code ou `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` ou `GOOGLE_MEET_CLIENT_ID` fournit l’id client OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` ou `GOOGLE_MEET_REFRESH_TOKEN` fournit le jeton d’actualisation.
- Facultatif : `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` et
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` utilisent les mêmes noms de repli
  sans le préfixe `OPENCLAW_`.

Le smoke test live de base pour les artefacts/la présence nécessite `https://www.googleapis.com/auth/meetings.space.readonly` et `https://www.googleapis.com/auth/meetings.conference.media.readonly`. La recherche Calendar nécessite `https://www.googleapis.com/auth/calendar.events.readonly`. L’export du corps de document Drive nécessite `https://www.googleapis.com/auth/drive.meet.readonly`.

Créer un nouvel espace Meet :

```bash
openclaw googlemeet create
```

La commande affiche le nouveau `meeting uri`, la source et la session de participation. Avec des identifiants OAuth, elle utilise l’API Google Meet officielle. Sans identifiants OAuth, elle utilise comme repli le profil de navigateur connecté du nœud Chrome épinglé. Les agents peuvent utiliser l’outil `google_meet` avec `action: "create"` pour créer et rejoindre en une seule étape. Pour une création URL seule, passez `"join": false`.

Exemple de sortie JSON du repli navigateur :

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

Si le repli navigateur rencontre une connexion Google ou un blocage d’autorisation Meet avant de pouvoir créer l’URL, la méthode Gateway renvoie une réponse échouée et l’outil `google_meet` renvoie des détails structurés au lieu d’une simple chaîne :

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

Lorsqu’un agent voit `manualActionRequired: true`, il doit signaler le `manualActionMessage` ainsi que le contexte du nœud/onglet de navigateur, puis arrêter d’ouvrir de nouveaux onglets Meet jusqu’à ce que l’opérateur termine l’étape dans le navigateur.

Exemple de sortie JSON d’une création par API :

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

Créer un Meet le rejoint par défaut. Le transport Chrome ou Chrome-node a tout de même
besoin d’un profil Google Chrome connecté pour rejoindre via le navigateur. Si le
profil est déconnecté, OpenClaw signale `manualActionRequired: true` ou une
erreur de repli du navigateur et demande à l’opérateur de terminer la connexion
Google avant de réessayer.

Définissez `preview.enrollmentAcknowledged: true` uniquement après avoir confirmé que votre projet Cloud,
votre principal OAuth et les participants à la réunion sont inscrits au Google
Workspace Developer Preview Program pour les API multimédias Meet.

## Configuration

Le chemin d’agent Chrome commun nécessite seulement que le plugin soit activé, BlackHole, SoX, une
clé de fournisseur de transcription en temps réel et un fournisseur TTS OpenClaw configuré.
OpenAI est le fournisseur de transcription par défaut ; définissez `realtime.voiceProvider` sur
`"google"` et `realtime.model` pour utiliser Google Gemini Live en mode `bidi`
sans modifier le fournisseur de transcription par défaut du mode agent :

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Définissez la configuration du plugin sous `plugins.entries.google-meet.config` :

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
- `defaultMode: "agent"` (`"realtime"` n’est accepté que comme alias de
  compatibilité hérité pour `"agent"` ; les nouveaux appels d’outil doivent indiquer `"agent"`)
- `chromeNode.node` : id/nom/IP de nœud facultatif pour `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"` : nom utilisé sur l’écran d’invité Meet
  déconnecté
- `chrome.autoJoin: true` : remplissage du nom d’invité et clic sur Join Now au mieux
  via l’automatisation du navigateur OpenClaw sur `chrome-node`
- `chrome.reuseExistingTab: true` : activer un onglet Meet existant au lieu
  d’ouvrir des doublons
- `chrome.waitForInCallMs: 20000` : attendre que l’onglet Meet signale l’état en appel
  avant de déclencher l’introduction de réponse vocale
- `chrome.audioFormat: "pcm16-24khz"` : format audio de paire de commandes. Utilisez
  `"g711-ulaw-8khz"` uniquement pour les paires de commandes héritées/personnalisées qui émettent encore
  de l’audio téléphonique.
- `chrome.audioBufferBytes: 4096` : tampon de traitement SoX pour les commandes audio
  de paire de commandes Chrome générées. C’est la moitié du tampon par défaut de SoX de 8192 octets,
  ce qui réduit la latence de tube par défaut tout en laissant de la marge pour l’augmenter sur les hôtes chargés.
  Les valeurs inférieures au minimum de SoX sont limitées à 17 octets.
- `chrome.audioInputCommand` : commande SoX lisant depuis CoreAudio `BlackHole 2ch`
  et écrivant l’audio dans `chrome.audioFormat`
- `chrome.audioOutputCommand` : commande SoX lisant l’audio dans `chrome.audioFormat`
  et écrivant vers CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand` : commande de microphone local facultative qui écrit
  du PCM mono signé 16 bits little-endian pour la détection d’interruption humaine pendant que
  la lecture de l’assistant est active. Cela s’applique actuellement au pont de paire de commandes
  `chrome` hébergé par le Gateway.
- `chrome.bargeInRmsThreshold: 650` : niveau RMS considéré comme une interruption humaine
  sur `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500` : niveau de crête considéré comme une interruption humaine
  sur `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900` : délai minimal entre les effacements répétés
  d’interruption humaine
- `mode: "agent"` : mode de réponse vocale par défaut. La parole des participants est transcrite par
  le fournisseur de transcription en temps réel configuré, envoyée à l’agent OpenClaw configuré
  dans une session de sous-agent par réunion, puis restituée vocalement via le runtime TTS
  OpenClaw normal.
- `mode: "bidi"` : mode de repli de modèle temps réel bidirectionnel direct. Le
  fournisseur vocal temps réel répond directement à la parole des participants et peut appeler
  `openclaw_agent_consult` pour des réponses plus approfondies/appuyées par des outils.
- `mode: "transcribe"` : mode d’observation uniquement sans le pont de réponse vocale.
- `realtime.provider: "openai"` : repli de compatibilité utilisé lorsque les champs de
  fournisseur délimités ci-dessous ne sont pas définis.
- `realtime.transcriptionProvider: "openai"` : id de fournisseur utilisé par le mode `agent`
  pour la transcription en temps réel.
- `realtime.voiceProvider` : id de fournisseur utilisé par le mode `bidi` pour la voix
  temps réel directe. Définissez-le sur `"google"` pour utiliser Gemini Live tout en conservant la
  transcription du mode agent sur OpenAI.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions` : réponses vocales brèves, avec
  `openclaw_agent_consult` pour les réponses plus approfondies
- `realtime.introMessage` : courte vérification de disponibilité vocale quand le pont temps réel
  se connecte ; définissez-le sur `""` pour rejoindre silencieusement
- `realtime.agentId` : id d’agent OpenClaw facultatif pour
  `openclaw_agent_consult` ; par défaut `main`

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

La voix Meet persistante vient de
`messages.tts.providers.elevenlabs.speakerVoiceId`. Les réponses de l’agent peuvent aussi utiliser
des directives par réponse `[[tts:speakerVoiceId=... model=eleven_v3]]` lorsque les remplacements de modèle TTS
sont activés, mais la configuration est la valeur par défaut déterministe pour les réunions.
À la connexion, les journaux doivent afficher `transcriptionProvider=elevenlabs` et chaque
réponse vocale doit journaliser `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>`.

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
l’appel PSTN réel, le DTMF et le message d’accueil d’introduction au plugin Voice Call. Voice Call
joue la séquence DTMF avant d’ouvrir le flux multimédia temps réel, puis utilise le
texte d’introduction enregistré comme salutation temps réel initiale. Si `voice-call` n’est pas
activé, Google Meet peut encore valider et enregistrer le plan de numérotation, mais il ne peut pas
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
`transport: "chrome-node"` lorsque Chrome s’exécute sur un nœud appairé tel qu’une VM Parallels.
Dans les deux cas, les fournisseurs de modèles et `openclaw_agent_consult` s’exécutent sur l’hôte
Gateway, donc les identifiants de modèle y restent. Avec le `mode: "agent"` par défaut,
le fournisseur de transcription en temps réel gère l’écoute, l’agent OpenClaw configuré
produit la réponse, et le TTS OpenClaw standard la prononce dans Meet. Utilisez
`mode: "bidi"` lorsque vous voulez que le modèle vocal temps réel réponde directement.
Le `mode: "realtime"` brut reste accepté comme alias de compatibilité hérité pour
`mode: "agent"`, mais il n’est plus annoncé dans le schéma d’outil d’agent.
Les journaux du mode agent incluent le fournisseur/modèle de transcription résolu au démarrage du pont
ainsi que le fournisseur TTS, le modèle, la voix, le format de sortie et la fréquence d’échantillonnage après
chaque réponse synthétisée.

Utilisez `action: "status"` pour lister les sessions actives ou inspecter un ID de session. Utilisez
`action: "speak"` avec `sessionId` et `message` pour faire parler l’agent temps réel
immédiatement. Utilisez `action: "test_speech"` pour créer ou réutiliser la session,
déclencher une phrase connue et retourner l’état de santé `inCall` lorsque l’hôte Chrome peut
le signaler. `test_speech` force toujours `mode: "agent"` et échoue si on lui demande de
s’exécuter en `mode: "transcribe"` parce que les sessions d’observation uniquement ne peuvent volontairement pas
émettre de parole. Son résultat `speechOutputVerified` est basé sur l’augmentation des octets de sortie audio
temps réel pendant cet appel de test, donc une session réutilisée avec un ancien audio
ne compte pas comme une nouvelle vérification vocale réussie. Utilisez `action: "leave"` pour marquer
une session comme terminée.

`status` inclut l’état de Chrome lorsque disponible :

- `inCall` : Chrome semble être dans l’appel Meet
- `micMuted` : état du microphone Meet au mieux
- `manualActionRequired` / `manualActionReason` / `manualActionMessage` : le
  profil de navigateur nécessite une connexion manuelle, une admission par l’hôte Meet, des autorisations ou
  une réparation du contrôle du navigateur avant que la parole puisse fonctionner
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage` : indique si
  la parole Chrome gérée est autorisée maintenant. `speechReady: false` signifie qu’OpenClaw n’a pas
  envoyé l’introduction/la phrase de test dans le pont audio.
- `providerConnected` / `realtimeReady` : état du pont vocal temps réel
- `lastInputAt` / `lastOutputAt` : dernier audio reçu depuis ou envoyé vers le pont
- `audioOutputRouted` / `audioOutputDeviceLabel` : indique si la sortie multimédia de l’onglet Meet
  a été activement routée vers le périphérique BlackHole utilisé par le pont
- `lastSuppressedInputAt` / `suppressedInputBytes` : entrée local loopback ignorée pendant que
  la lecture de l’assistant est active

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Modes agent et bidi

Le mode Chrome `agent` est optimisé pour le comportement « mon agent est dans la réunion ». Le
fournisseur de transcription en temps réel entend l’audio de la réunion, les transcriptions finales des participants
sont acheminées vers l’agent OpenClaw configuré, et la réponse est
prononcée via le runtime TTS OpenClaw normal. Définissez `mode: "bidi"` lorsque vous voulez
que le modèle vocal temps réel réponde directement.
Les fragments de transcription finale proches sont fusionnés avant la consultation afin qu’un tour
vocal ne produise pas plusieurs réponses partielles obsolètes. L’entrée temps réel est également
supprimée pendant que l’audio d’assistant en file d’attente est encore en cours de lecture,
et les échos de transcription récents ressemblant à l’assistant sont ignorés avant la consultation de l’agent
afin que le local loopback BlackHole ne pousse pas l’agent à répondre à sa propre parole.

| Mode    | Qui décide de la réponse      | Chemin de sortie vocale                | À utiliser lorsque                                      |
| ------- | ----------------------------- | -------------------------------------- | ------------------------------------------------------- |
| `agent` | L’agent OpenClaw configuré    | Runtime TTS OpenClaw normal            | Vous voulez le comportement « mon agent est dans la réunion » |
| `bidi`  | Le modèle vocal temps réel    | Réponse audio du fournisseur vocal temps réel | Vous voulez la boucle vocale conversationnelle à plus faible latence |

En mode `bidi`, lorsque le modèle temps réel a besoin d’un raisonnement plus approfondi, d’informations
actuelles ou d’outils OpenClaw normaux, il peut appeler `openclaw_agent_consult`.

L’outil de consultation exécute en arrière-plan l’agent OpenClaw standard avec le
contexte récent de transcription de réunion et renvoie une réponse orale concise. En mode `agent`,
OpenClaw envoie cette réponse directement au runtime TTS ; en mode `bidi`, le
modèle vocal en temps réel peut restituer oralement le résultat de consultation dans la réunion. Il utilise
le même mécanisme de consultation partagé que Voice Call.

Par défaut, les consultations s’exécutent avec l’agent `main`. Définissez `realtime.agentId` lorsqu’une
voie Meet doit consulter un espace de travail d’agent OpenClaw dédié, avec ses valeurs par défaut de modèle,
sa politique d’outils, sa mémoire et son historique de session.

Les consultations en mode agent utilisent une clé de session par réunion `agent:<id>:subagent:google-meet:<session>`
afin que les questions de suivi conservent le contexte de la réunion tout en héritant de la politique
d’agent normale de l’agent configuré.

`realtime.toolPolicy` contrôle l’exécution de la consultation :

- `safe-read-only` : expose l’outil de consultation et limite l’agent standard à
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` et
  `memory_get`.
- `owner` : expose l’outil de consultation et laisse l’agent standard utiliser la politique
  d’outils d’agent normale.
- `none` : n’expose pas l’outil de consultation au modèle vocal en temps réel.

La clé de session de consultation est limitée à chaque session Meet, afin que les appels de consultation de suivi
puissent réutiliser le contexte de consultation antérieur pendant la même réunion.

Pour forcer une vérification orale de disponibilité après que Chrome a complètement rejoint l’appel :

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Pour le test de fumée complet de connexion et parole :

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Liste de vérification de test live

Utilisez cette séquence avant de confier une réunion à un agent sans surveillance :

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

État Chrome-node attendu :

- `googlemeet setup` est entièrement au vert.
- `googlemeet setup` inclut `chrome-node-connected` lorsque Chrome-node est le
  transport par défaut ou qu’un nœud est épinglé.
- `nodes status` indique que le nœud sélectionné est connecté.
- Le nœud sélectionné annonce à la fois `googlemeet.chrome` et `browser.proxy`.
- L’onglet Meet rejoint l’appel et `test-speech` renvoie l’état de santé de Chrome avec
  `inCall: true`.

Pour un hôte Chrome distant tel qu’une VM macOS Parallels, voici la vérification sûre
la plus courte après la mise à jour du Gateway ou de la VM :

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Cela prouve que le Plugin Gateway est chargé, que le nœud VM est connecté avec le
jeton actuel, et que le pont audio Meet est disponible avant qu’un agent ouvre un
véritable onglet de réunion.

Pour un test de fumée Twilio, utilisez une réunion qui expose les détails d’appel téléphonique :

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

Confirmez que le Plugin est activé dans la configuration du Gateway et rechargez le Gateway :

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Si vous venez de modifier `plugins.entries.google-meet`, redémarrez ou rechargez le Gateway.
L’agent en cours d’exécution ne voit que les outils de Plugin enregistrés par le processus
Gateway actuel.

Sur les hôtes Gateway non macOS, l’outil orienté agent `google_meet` reste visible,
mais les actions locales de retour vocal Chrome sont bloquées avant d’atteindre le pont audio.
L’audio local de retour vocal Chrome dépend actuellement de `BlackHole 2ch` sous macOS ; les
agents Linux doivent donc utiliser `mode: "transcribe"`, l’appel entrant Twilio ou un hôte
`chrome-node` macOS au lieu du chemin d’agent Chrome local par défaut.

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

Rechargez ensuite le service de nœud et relancez :

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Le navigateur s’ouvre mais l’agent ne peut pas rejoindre

Exécutez `googlemeet test-listen` pour les connexions en observation seule ou `googlemeet test-speech`
pour les connexions en temps réel, puis inspectez l’état de santé Chrome renvoyé. Si l’une des sondes
signale `manualActionRequired: true`, affichez `manualActionMessage` à l’opérateur
et arrêtez les tentatives jusqu’à ce que l’action dans le navigateur soit terminée.

Actions manuelles courantes :

- Se connecter au profil Chrome.
- Admettre l’invité depuis le compte hôte Meet.
- Accorder les autorisations microphone/caméra de Chrome lorsque l’invite d’autorisation native de Chrome
  apparaît.
- Fermer ou réparer une boîte de dialogue d’autorisation Meet bloquée.

Ne signalez pas « non connecté » simplement parce que Meet affiche « Do you want people to
hear you in the meeting? ». Il s’agit de l’écran intermédiaire de choix audio de Meet ; OpenClaw
clique sur **Use microphone** via l’automatisation du navigateur lorsque disponible et continue
d’attendre l’état réel de la réunion. Pour le repli navigateur de création uniquement, OpenClaw
peut cliquer sur **Continue without microphone**, car la création de l’URL n’a pas besoin
du chemin audio en temps réel.

### La création de réunion échoue

`googlemeet create` utilise d’abord le point de terminaison Google Meet API `spaces.create`
lorsque les identifiants OAuth sont configurés. Sans identifiants OAuth, il se replie
sur le navigateur du nœud Chrome épinglé. Confirmez :

- Pour la création via API : `oauth.clientId` et `oauth.refreshToken` sont configurés,
  ou les variables d’environnement correspondantes `OPENCLAW_GOOGLE_MEET_*` sont présentes.
- Pour la création via API : le jeton d’actualisation a été émis après l’ajout de la prise en charge
  de la création. Les anciens jetons peuvent ne pas inclure le périmètre `meetings.space.created` ; relancez
  `openclaw googlemeet auth login --json` et mettez à jour la configuration du Plugin.
- Pour le repli navigateur : `defaultTransport: "chrome-node"` et
  `chromeNode.node` pointent vers un nœud connecté avec `browser.proxy` et
  `googlemeet.chrome`.
- Pour le repli navigateur : le profil Chrome OpenClaw sur ce nœud est connecté
  à Google et peut ouvrir `https://meet.google.com/new`.
- Pour le repli navigateur : les nouvelles tentatives réutilisent un onglet existant `https://meet.google.com/new`
  ou une invite de compte Google avant d’ouvrir un nouvel onglet. Si un agent expire,
  relancez l’appel d’outil plutôt que d’ouvrir manuellement un autre onglet Meet.
- Pour le repli navigateur : si l’outil renvoie `manualActionRequired: true`, utilisez
  les valeurs renvoyées `browser.nodeId`, `browser.targetId`, `browserUrl` et
  `manualActionMessage` pour guider l’opérateur. Ne réessayez pas en boucle tant que cette
  action n’est pas terminée.
- Pour le repli navigateur : si Meet affiche « Do you want people to hear you in the
  meeting? », laissez l’onglet ouvert. OpenClaw doit cliquer sur **Use microphone** ou, pour
  le repli de création uniquement, **Continue without microphone** via l’automatisation du navigateur
  et continuer à attendre l’URL Meet générée. S’il ne le peut pas, l’erreur doit mentionner
  `meet-audio-choice-required`, pas `google-login-required`.

### L’agent rejoint mais ne parle pas

Vérifiez le chemin en temps réel :

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Utilisez `mode: "agent"` pour le chemin normal STT -> agent OpenClaw -> retour vocal TTS,
ou `mode: "bidi"` pour le repli vocal direct en temps réel. `mode: "transcribe"`
ne démarre volontairement pas le pont de retour vocal. Pour le débogage en observation seule,
exécutez `openclaw googlemeet status --json <session-id>` après que des participants ont parlé
et vérifiez `captioning`, `transcriptLines` et `lastCaptionText`. Si `inCall` vaut
true mais que `transcriptLines` reste à `0`, les sous-titres Meet peuvent être désactivés, personne
n’a parlé depuis l’installation de l’observateur, l’interface Meet a changé, ou les sous-titres
en direct ne sont pas disponibles pour la langue/le compte de la réunion.

`googlemeet test-speech` vérifie toujours le chemin en temps réel et indique si
des octets de sortie du pont ont été observés pour cette invocation. Si `speechOutputVerified` vaut false et
`speechOutputTimedOut` vaut true, le fournisseur en temps réel a peut-être accepté l’énoncé,
mais OpenClaw n’a pas vu de nouveaux octets de sortie atteindre le pont audio Chrome.

Vérifiez également :

- Une clé de fournisseur en temps réel est disponible sur l’hôte Gateway, telle que
  `OPENAI_API_KEY` ou `GEMINI_API_KEY`.
- `BlackHole 2ch` est visible sur l’hôte Chrome.
- `sox` existe sur l’hôte Chrome.
- Le microphone et le haut-parleur Meet sont routés via le chemin audio virtuel utilisé par
  OpenClaw. `doctor` doit afficher `meet output routed: yes` pour les connexions en temps réel
  avec Chrome local.

`googlemeet doctor [session-id]` imprime la session, le nœud, l’état dans l’appel,
la raison d’action manuelle, la connexion au fournisseur en temps réel, `realtimeReady`, l’activité
d’entrée/sortie audio, les derniers horodatages audio, les compteurs d’octets et l’URL du navigateur.
Utilisez `googlemeet status [session-id] --json` lorsque vous avez besoin du JSON brut. Utilisez
`googlemeet doctor --oauth` lorsque vous devez vérifier l’actualisation OAuth Google Meet
sans exposer les jetons ; ajoutez `--meeting` ou `--create-space` lorsque vous avez également besoin
d’une preuve Google Meet API.

Si un agent a expiré et que vous voyez un onglet Meet déjà ouvert, inspectez cet onglet
sans en ouvrir un autre :

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

L’action d’outil équivalente est `recover_current_tab`. Elle met au premier plan et inspecte un
onglet Meet existant pour le transport sélectionné. Avec `chrome`, elle utilise le contrôle local
du navigateur via le Gateway ; avec `chrome-node`, elle utilise le nœud Chrome configuré.
Elle n’ouvre pas de nouvel onglet et ne crée pas de nouvelle session ; elle signale le
blocage actuel, comme l’identification, l’admission, les autorisations ou l’état de choix audio.
La commande CLI communique avec le Gateway configuré, le Gateway doit donc être en cours d’exécution ;
`chrome-node` exige également que le nœud Chrome soit connecté.

### Les vérifications de configuration Twilio échouent

`twilio-voice-call-plugin` échoue lorsque `voice-call` n’est pas autorisé ou pas activé.
Ajoutez-le à `plugins.allow`, activez `plugins.entries.voice-call`, puis rechargez le
Gateway.

`twilio-voice-call-credentials` échoue lorsque le backend Twilio ne dispose pas du SID de compte,
du jeton d’authentification ou du numéro appelant. Définissez-les sur l’hôte Gateway :

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` échoue lorsque `voice-call` n’a pas d’exposition Webhook
publique, ou lorsque `publicUrl` pointe vers un espace réseau local loopback ou privé.
Définissez `plugins.entries.voice-call.config.publicUrl` sur l’URL publique du fournisseur ou
configurez une exposition par tunnel/Tailscale pour `voice-call`.

Les URL loopback et privées ne sont pas valides pour les rappels opérateur. N’utilisez pas
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

Pour le développement local, utilisez un tunnel ou une exposition Tailscale plutôt qu’une URL
d’hôte privée :

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

Redémarrez ou rechargez ensuite le Gateway, puis exécutez :

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` vérifie uniquement la disponibilité par défaut. Pour simuler un numéro précis :

```bash
openclaw voicecall smoke --to "+15555550123"
```

N’ajoutez `--yes` que lorsque vous voulez intentionnellement passer un appel de notification
sortant en direct :

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### L’appel Twilio démarre, mais n’entre jamais dans la réunion

Vérifiez que l’événement Meet expose les informations de connexion par téléphone. Transmettez le numéro de connexion
exact et le code PIN, ou une séquence DTMF personnalisée :

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Utilisez un `w` initial ou des virgules dans `--dtmf-sequence` si le fournisseur a besoin d’une pause
avant la saisie du code PIN.

Si l’appel téléphonique est créé, mais que la liste des participants Meet n’affiche jamais le participant
connecté par téléphone :

- Exécutez `openclaw googlemeet doctor <session-id>` pour confirmer l’ID d’appel Twilio délégué, vérifier si le DTMF a été mis en file d’attente et si le message d’accueil initial a été demandé.
- Exécutez `openclaw voicecall status --call-id <id>` et vérifiez que l’appel est toujours actif.
- Exécutez `openclaw voicecall tail` et vérifiez que les webhooks Twilio arrivent au Gateway.
- Exécutez `openclaw logs --follow` et recherchez la séquence Twilio Meet : Google Meet délègue la connexion, Voice Call stocke et sert le TwiML DTMF avant connexion, Voice Call sert le TwiML temps réel pour l’appel Twilio, puis Google Meet demande le message vocal d’introduction avec `voicecall.speak`.
- Relancez `openclaw googlemeet setup --transport twilio` ; une vérification de configuration verte est requise, mais elle ne prouve pas que la séquence de code PIN de la réunion est correcte.
- Vérifiez que le numéro d’appel appartient à la même invitation Meet et à la même région que le code PIN.
- Augmentez `voiceCall.dtmfDelayMs` par rapport à la valeur par défaut de 12 secondes si Meet répond lentement ou si la transcription de l’appel affiche encore l’invite demandant un code PIN après l’envoi du DTMF avant connexion.
- Si le participant rejoint la réunion, mais que vous n’entendez pas le message d’accueil, consultez `openclaw logs --follow` pour vérifier la requête `voicecall.speak` post-DTMF et soit la lecture TTS du flux multimédia, soit le repli Twilio `<Say>`. Si la transcription de l’appel contient encore « enter the meeting PIN », la branche téléphonique n’a pas encore rejoint la salle Meet ; les participants à la réunion n’entendront donc pas la parole.

Si les webhooks n’arrivent pas, déboguez d’abord le plugin Voice Call : le fournisseur doit pouvoir atteindre `plugins.entries.voice-call.config.publicUrl` ou le tunnel configuré.
Consultez [Dépannage des appels vocaux](/fr/plugins/voice-call#troubleshooting).

## Notes

L’API multimédia officielle de Google Meet est orientée réception ; parler dans un appel Meet
nécessite donc toujours un chemin de participant. Ce plugin garde cette limite visible :
Chrome gère la participation dans le navigateur et le routage audio local ; Twilio gère
la participation par appel téléphonique.

Les modes de réponse vocale Chrome nécessitent `BlackHole 2ch` ainsi que l’un des éléments suivants :

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand` : OpenClaw possède le pont et transmet l’audio en `chrome.audioFormat` entre ces commandes et le fournisseur sélectionné. Le mode agent utilise la transcription en temps réel plus le TTS standard ; le mode bidi utilise le fournisseur vocal en temps réel. Le chemin Chrome par défaut est PCM16 24 kHz avec `chrome.audioBufferBytes: 4096` ; le G.711 mu-law 8 kHz reste disponible pour les paires de commandes héritées.
- `chrome.audioBridgeCommand` : une commande de pont externe possède tout le chemin audio local et doit se terminer après avoir démarré ou validé son démon. Cela n’est valide que pour `bidi`, car le mode `agent` nécessite un accès direct à la paire de commandes pour le TTS.

Lorsqu’un agent appelle l’outil `google_meet` en mode agent, la session de consultant de réunion duplique la transcription actuelle de l’appelant avant de répondre à la parole des participants. La session Meet reste néanmoins séparée (`agent:<agentId>:subagent:google-meet:<sessionId>`) afin que les suivis de réunion ne modifient pas directement la transcription de l’appelant.

Pour un audio duplex propre, routez la sortie Meet et le microphone Meet via des appareils virtuels distincts ou un graphe d’appareils virtuels de type Loopback. Un seul appareil BlackHole partagé peut renvoyer l’audio des autres participants dans l’appel.

Avec le pont Chrome à paire de commandes, `chrome.bargeInInputCommand` peut écouter un microphone local
distinct et interrompre la lecture de l’assistant lorsque l’humain commence à parler. Cela permet de prioriser la parole humaine sur la sortie de l’assistant, même lorsque l’entrée loopback BlackHole partagée est temporairement supprimée pendant la lecture de l’assistant.
Comme `chrome.audioInputCommand` et `chrome.audioOutputCommand`, il s’agit d’une commande locale
configurée par l’opérateur. Utilisez un chemin de commande ou une liste d’arguments explicitement fiable, et ne la pointez pas vers des scripts situés dans des emplacements non fiables.

`googlemeet speak` déclenche le pont audio de réponse vocale actif pour une session Chrome.
`googlemeet leave` arrête ce pont. Pour les sessions Twilio déléguées
via le plugin Voice Call, `leave` raccroche également l’appel vocal sous-jacent.
Utilisez `googlemeet end-active-conference` lorsque vous voulez aussi fermer la conférence
Google Meet active pour un espace géré par API.

## Associés

- [Plugin Voice Call](/fr/plugins/voice-call)
- [Mode conversation](/fr/nodes/talk)
- [Création de plugins](/fr/plugins/building-plugins)
