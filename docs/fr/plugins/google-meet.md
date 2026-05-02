---
read_when:
    - Vous souhaitez qu’un agent OpenClaw rejoigne un appel Google Meet
    - Vous souhaitez qu’un agent OpenClaw crée un nouvel appel Google Meet
    - Vous configurez Chrome, un nœud Chrome ou Twilio comme transport Google Meet
summary: 'Plugin Google Meet : rejoindre des URL Meet explicites via Chrome ou Twilio avec des paramètres par défaut de voix en temps réel'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-02T20:49:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dc515382d2cc7beacaf18a50b75cb0f4eda3038cfd8efe73ea3ce7b5007bc43
    source_path: plugins/google-meet.md
    workflow: 16
---

Prise en charge des participants Google Meet pour OpenClaw — le plugin est explicite par conception :

- Il rejoint uniquement une URL `https://meet.google.com/...` explicite.
- Il peut créer un nouvel espace Meet via l’API Google Meet, puis rejoindre l’URL
  renvoyée.
- `realtime` voice est le mode par défaut.
- La voix en temps réel peut rappeler l’agent OpenClaw complet lorsqu’un
  raisonnement plus approfondi ou des outils sont nécessaires.
- Les agents choisissent le comportement de jonction avec `mode` : utilisez `realtime` pour
  écouter/répondre en direct, ou `transcribe` pour rejoindre/contrôler le navigateur sans le
  pont vocal en temps réel.
- L’authentification commence avec Google OAuth personnel ou un profil Chrome déjà connecté.
- Il n’y a pas d’annonce automatique de consentement.
- Le backend audio Chrome par défaut est `BlackHole 2ch`.
- Chrome peut s’exécuter localement ou sur un hôte Node appairé.
- Twilio accepte un numéro d’appel entrant avec un PIN facultatif ou une séquence DTMF ; il
  ne peut pas appeler directement une URL Meet.
- La commande CLI est `googlemeet` ; `meet` est réservé aux workflows de
  téléconférence d’agent plus larges.

## Démarrage rapide

Installez les dépendances audio locales et configurez un fournisseur de voix en temps réel
backend. OpenAI est la valeur par défaut ; Google Gemini Live fonctionne aussi avec
`realtime.provider: "google"` :

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` installe le périphérique audio virtuel `BlackHole 2ch`. Le programme
d’installation de Homebrew nécessite un redémarrage avant que macOS expose le périphérique :

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

La sortie de configuration est conçue pour être lisible par l’agent et consciente du mode. Elle indique le profil Chrome
, l’épinglage de Node et, pour les jonctions Chrome en temps réel, les vérifications du pont audio BlackHole/SoX
et de l’introduction en temps réel différée. Pour les jonctions en observation seule, vérifiez le même
transport avec `--mode transcribe` ; ce mode ignore les prérequis audio en temps réel
car il n’écoute pas et ne parle pas via le pont :

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Lorsque la délégation Twilio est configurée, la configuration indique aussi si le
plugin `voice-call`, les identifiants Twilio et l’exposition publique du webhook sont prêts.
Traitez toute vérification `ok: false` comme un blocage pour le transport et le mode vérifiés
avant de demander à un agent de rejoindre. Utilisez `openclaw googlemeet setup --json` pour
les scripts ou une sortie lisible par machine. Utilisez `--transport chrome`,
`--transport chrome-node` ou `--transport twilio` pour pré-vérifier un transport spécifique
avant qu’un agent ne l’essaie.

Pour Twilio, pré-vérifiez toujours le transport explicitement lorsque le transport par défaut
est Chrome :

```bash
openclaw googlemeet setup --transport twilio
```

Cela détecte le câblage `voice-call` manquant, les identifiants Twilio ou une exposition
webhook injoignable avant que l’agent essaie d’appeler la réunion.

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
  "mode": "realtime"
}
```

L’outil `google_meet` destiné aux agents reste disponible sur les hôtes non-macOS pour
les flux d’artefacts, de calendrier, de configuration, de transcription, Twilio et `chrome-node`. Les actions Chrome
locales en temps réel y sont bloquées parce que le chemin audio Chrome en temps réel
intégré dépend actuellement de `BlackHole 2ch` sur macOS. Sur Linux, utilisez
`mode: "transcribe"`, l’appel entrant Twilio ou un hôte `chrome-node` macOS pour la participation
Chrome en temps réel.

Créez une nouvelle réunion et rejoignez-la :

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Pour les salles créées par API, utilisez Google Meet `SpaceConfig.accessType` lorsque vous voulez
que la politique sans demande d’accès de la salle soit explicite au lieu d’être héritée des valeurs par défaut du compte
Google :

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

`OPEN` permet à toute personne disposant de l’URL Meet de rejoindre sans demander l’accès. `TRUSTED` permet aux
utilisateurs de confiance de l’organisation hôte, aux utilisateurs externes invités et aux utilisateurs par appel entrant
de rejoindre sans demander l’accès. `RESTRICTED` limite l’entrée sans demande d’accès aux invités. Ces
paramètres s’appliquent uniquement au chemin officiel de création par l’API Google Meet, donc les identifiants
OAuth doivent être configurés.

Si vous avez authentifié Google Meet avant que cette option soit disponible, relancez
`openclaw googlemeet auth login --json` après avoir ajouté le scope
`meetings.space.settings` à votre écran de consentement Google OAuth.

Créez uniquement l’URL sans rejoindre :

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` dispose de deux chemins :

- Création API : utilisée lorsque les identifiants Google Meet OAuth sont configurés. C’est
  le chemin le plus déterministe et il ne dépend pas de l’état de l’interface du navigateur.
- Solution de repli navigateur : utilisée lorsque les identifiants OAuth sont absents. OpenClaw utilise le
  Node Chrome épinglé, ouvre `https://meet.google.com/new`, attend que Google
  redirige vers une vraie URL de code de réunion, puis renvoie cette URL. Ce chemin nécessite
  que le profil Chrome OpenClaw sur le Node soit déjà connecté à Google.
  L’automatisation du navigateur gère la propre invite de microphone au premier lancement de Meet ; cette invite
  n’est pas traitée comme un échec de connexion Google.
  Les flux de jonction et de création essaient aussi de réutiliser un onglet Meet existant avant d’en ouvrir un
  nouveau. La correspondance ignore les chaînes de requête d’URL sans conséquence comme `authuser`, donc une
  nouvelle tentative de l’agent devrait cibler la réunion déjà ouverte au lieu de créer un deuxième
  onglet Chrome.

La sortie de commande/outil inclut un champ `source` (`api` ou `browser`) afin que les agents
puissent expliquer quel chemin a été utilisé. `create` rejoint la nouvelle réunion par défaut et
renvoie `joined: true` plus la session de jonction. Pour ne créer que l’URL, utilisez
`create --no-join` dans la CLI ou passez `"join": false` à l’outil.

Ou dites à un agent : « Crée un Google Meet, rejoins-le avec la voix en temps réel et envoie-moi
le lien. » L’agent devrait appeler `google_meet` avec `action: "create"` puis
partager le `meetingUri` renvoyé.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Pour une jonction en observation seule/contrôle du navigateur, définissez `"mode": "transcribe"`. Cela ne
démarre pas le pont de modèle duplex en temps réel, ne nécessite pas BlackHole ni SoX,
et ne répondra pas dans la réunion. Les jonctions Chrome dans ce mode évitent aussi
l’octroi de permission microphone/caméra d’OpenClaw et évitent le chemin **Utiliser
le microphone** de Meet. Si Meet affiche un interstitiel de choix audio, l’automatisation essaie
le chemin sans microphone et sinon signale une action manuelle au lieu d’ouvrir
le microphone local. En mode transcription, les transports Chrome gérés installent aussi
un observateur de sous-titres Meet au mieux. `googlemeet status --json` et
`googlemeet doctor` exposent `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`,
et une courte fin `recentTranscript` afin que les opérateurs puissent savoir si le navigateur
a rejoint l’appel et si les sous-titres Meet produisent du texte.
Utilisez `openclaw googlemeet test-listen <meet-url> --transport chrome-node` lorsque
vous avez besoin d’une sonde oui/non : elle rejoint en mode transcription, attend un mouvement récent de sous-titre ou
de transcription, et renvoie `listenVerified`, `listenTimedOut`, les champs d’action manuelle
et le dernier état de santé des sous-titres.

Pendant les sessions en temps réel, le statut `google_meet` inclut l’état du navigateur et du pont audio,
comme `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, les derniers horodatages d’entrée/sortie
, les compteurs d’octets et l’état de fermeture du pont. Si une invite de page Meet sûre
apparaît, l’automatisation du navigateur la gère lorsqu’elle le peut. Les invites de connexion, d’admission par l’hôte et
de permissions navigateur/OS sont signalées comme action manuelle avec une raison et
un message que l’agent doit relayer. Les sessions Chrome gérées n’émettent l’introduction ou
la phrase de test qu’après que l’état du navigateur indique `inCall: true` ; sinon le statut indique
`speechReady: false` et la tentative de parole est bloquée au lieu de prétendre que
l’agent a parlé dans la réunion.

Les jonctions Chrome locales utilisent le profil de navigateur OpenClaw connecté. Le mode temps réel
nécessite `BlackHole 2ch` pour le chemin microphone/haut-parleur utilisé par OpenClaw. Pour
un son duplex propre, utilisez des périphériques virtuels séparés ou un graphe de type Loopback ; un
seul périphérique BlackHole suffit pour un premier test de fumée mais peut créer de l’écho.

### Gateway local + Chrome Parallels

Vous n’avez **pas** besoin d’un Gateway OpenClaw complet ni d’une clé d’API de modèle dans une VM macOS
uniquement pour que la VM possède Chrome. Exécutez le Gateway et l’agent localement, puis exécutez un
hôte Node dans la VM. Activez une fois le plugin intégré sur la VM afin que le Node
annonce la commande Chrome :

Ce qui s’exécute où :

- Hôte Gateway : Gateway OpenClaw, espace de travail de l’agent, clés modèle/API, fournisseur
  en temps réel et configuration du plugin Google Meet.
- VM macOS Parallels : CLI/hôte Node OpenClaw, Google Chrome, SoX, BlackHole 2ch,
  et un profil Chrome connecté à Google.
- Non nécessaire dans la VM : service Gateway, configuration d’agent, clé OpenAI/GPT ou configuration
  du fournisseur de modèle.

Installez les dépendances de la VM :

```bash
brew install blackhole-2ch sox
```

Redémarrez la VM après l’installation de BlackHole afin que macOS expose `BlackHole 2ch` :

```bash
sudo reboot
```

Après le redémarrage, vérifiez que la VM voit le périphérique audio et les commandes SoX :

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Installez ou mettez à jour OpenClaw dans la VM, puis activez-y le plugin intégré :

```bash
openclaw plugins enable google-meet
```

Démarrez l’hôte Node dans la VM :

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Si `<gateway-host>` est une IP LAN et que vous n’utilisez pas TLS, le Node refuse le
WebSocket en clair sauf si vous l’autorisez explicitement pour ce réseau privé de confiance :

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Utilisez la même variable d’environnement lors de l’installation du Node comme LaunchAgent :

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` est un environnement de processus, pas un
paramètre `openclaw.json`. `openclaw node install` le stocke dans l’environnement du LaunchAgent
lorsqu’il est présent dans la commande d’installation.

Approuvez le Node depuis l’hôte Gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Confirmez que le Gateway voit le Node et qu’il annonce à la fois `googlemeet.chrome`
et la capacité navigateur/`browser.proxy` :

```bash
openclaw nodes status
```

Faites passer Meet par ce Node sur l’hôte Gateway :

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

ou demandez à l’agent d’utiliser l’outil `google_meet` avec `transport: "chrome-node"`.

Pour un test de fumée en une commande qui crée ou réutilise une session, prononce une phrase
connue et affiche l’état de santé de la session :

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Lors de la connexion en temps réel, l’automatisation de navigateur OpenClaw renseigne le nom de l’invité, clique sur
Rejoindre/Demander à rejoindre, et accepte le premier choix "Utiliser le microphone" de Meet lorsque cette
invite apparaît. Lors d’une connexion en observation seule ou d’une création de réunion uniquement par navigateur, elle
continue après la même invite sans microphone lorsque ce choix est disponible.
Si le profil du navigateur n’est pas connecté, si Meet attend l’admission par l’hôte,
si Chrome a besoin de l’autorisation microphone/caméra pour une connexion en temps réel, ou si Meet est bloqué
sur une invite que l’automatisation n’a pas pu résoudre, le résultat join/test-speech signale
`manualActionRequired: true` avec `manualActionReason` et
`manualActionMessage`. Les agents doivent arrêter de réessayer la connexion, signaler ce message exact
ainsi que les `browserUrl`/`browserTitle` actuels, puis réessayer seulement une fois
l’action manuelle dans le navigateur terminée.

Si `chromeNode.node` est omis, OpenClaw ne sélectionne automatiquement que lorsqu’un seul
nœud connecté annonce à la fois `googlemeet.chrome` et le contrôle du navigateur. Si
plusieurs nœuds capables sont connectés, définissez `chromeNode.node` sur l’identifiant du nœud,
le nom d’affichage ou l’IP distante.

Vérifications d’échec courantes :

- `Configured Google Meet node ... is not usable: offline` : le nœud épinglé est
  connu du Gateway mais indisponible. Les agents doivent traiter ce nœud comme
  un état de diagnostic, pas comme un hôte Chrome utilisable, et signaler le blocage
  de configuration au lieu de basculer vers un autre transport, sauf si l’utilisateur l’a demandé.
- `No connected Google Meet-capable node` : démarrez `openclaw node run` dans la VM,
  approuvez l’appairage, et assurez-vous que `openclaw plugins enable google-meet` et
  `openclaw plugins enable browser` ont été exécutés dans la VM. Confirmez aussi que l’hôte
  Gateway autorise les deux commandes de nœud avec
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found` : installez `blackhole-2ch` sur l’hôte
  vérifié et redémarrez avant d’utiliser l’audio Chrome local.
- `BlackHole 2ch audio device not found on the node` : installez `blackhole-2ch`
  dans la VM et redémarrez la VM.
- Chrome s’ouvre mais ne peut pas rejoindre : connectez-vous au profil du navigateur dans la VM, ou
  gardez `chrome.guestName` défini pour une connexion invité. La connexion automatique en invité utilise l’automatisation
  de navigateur OpenClaw via le proxy de navigateur du nœud ; assurez-vous que la configuration du navigateur
  du nœud pointe vers le profil voulu, par exemple
  `browser.defaultProfile: "user"` ou un profil de session existante nommé.
- Onglets Meet en double : laissez `chrome.reuseExistingTab: true` activé. OpenClaw
  active un onglet existant pour la même URL Meet avant d’en ouvrir un nouveau, et
  la création de réunion par navigateur réutilise un onglet `https://meet.google.com/new`
  ou d’invite de compte Google en cours avant d’en ouvrir un autre.
- Pas d’audio : dans Meet, acheminez le microphone/haut-parleur via le chemin du périphérique audio virtuel
  utilisé par OpenClaw ; utilisez des périphériques virtuels séparés ou un routage de type Loopback
  pour un audio duplex propre.

## Notes d’installation

La valeur par défaut Chrome en temps réel utilise deux outils externes :

- `sox` : utilitaire audio en ligne de commande. Le plugin utilise des commandes de périphérique
  CoreAudio explicites pour le pont audio PCM16 24 kHz par défaut.
- `blackhole-2ch` : pilote audio virtuel macOS. Il crée le périphérique audio `BlackHole 2ch`
  que Chrome/Meet peut utiliser.

OpenClaw n’intègre ni ne redistribue aucun des deux paquets. La documentation demande aux utilisateurs de
les installer comme dépendances hôte via Homebrew. SoX est sous licence
`LGPL-2.0-only AND GPL-2.0-only` ; BlackHole est sous GPL-3.0. Si vous créez un
programme d’installation ou une appliance qui intègre BlackHole avec OpenClaw, examinez les
conditions de licence amont de BlackHole ou obtenez une licence distincte auprès d’Existential Audio.

## Transports

### Chrome

Le transport Chrome ouvre l’URL Meet via le contrôle de navigateur OpenClaw et rejoint
avec le profil de navigateur OpenClaw connecté. Sur macOS, le plugin vérifie la présence de
`BlackHole 2ch` avant le lancement. S’il est configuré, il exécute aussi une commande de santé
du pont audio et une commande de démarrage avant d’ouvrir Chrome. Utilisez `chrome` lorsque
Chrome/l’audio s’exécutent sur l’hôte Gateway ; utilisez `chrome-node` lorsque Chrome/l’audio s’exécutent
sur un nœud appairé tel qu’une VM Parallels macOS. Pour Chrome local, choisissez le
profil avec `browser.defaultProfile` ; `chrome.browserProfile` est transmis aux hôtes
`chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Acheminez l’audio du microphone et du haut-parleur de Chrome via le pont audio OpenClaw local.
Si `BlackHole 2ch` n’est pas installé, la connexion échoue avec une erreur de configuration
au lieu de rejoindre silencieusement sans chemin audio.

### Twilio

Le transport Twilio est un plan de numérotation strict délégué au plugin Voice Call. Il
n’analyse pas les pages Meet pour trouver des numéros de téléphone.

Utilisez-le lorsque la participation via Chrome n’est pas disponible ou lorsque vous voulez une solution de repli
par appel téléphonique. Google Meet doit exposer un numéro d’appel et un PIN pour la
réunion ; OpenClaw ne les découvre pas depuis la page Meet.

Activez le plugin Voice Call sur l’hôte Gateway, pas sur le nœud Chrome :

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

Redémarrez ou rechargez le Gateway après avoir activé `voice-call` ; les changements de configuration de plugin
n’apparaissent pas dans un processus Gateway déjà en cours d’exécution tant qu’il n’est pas rechargé.

Vérifiez ensuite :

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

## OAuth et prévol

OAuth est facultatif pour créer un lien Meet, car `googlemeet create` peut se replier
sur l’automatisation de navigateur. Configurez OAuth lorsque vous voulez la création via l’API officielle,
la résolution d’espaces ou les vérifications de prévol de l’API Meet Media.

L’accès à l’API Google Meet utilise OAuth utilisateur : créez un client OAuth Google Cloud,
demandez les portées requises, autorisez un compte Google, puis stockez le
jeton d’actualisation résultant dans la configuration du plugin Google Meet ou fournissez les
variables d’environnement `OPENCLAW_GOOGLE_MEET_*`.

OAuth ne remplace pas le chemin de connexion Chrome. Les transports Chrome et Chrome-node
rejoignent toujours via un profil Chrome connecté, BlackHole/SoX et un nœud connecté
lorsque vous utilisez la participation par navigateur. OAuth sert uniquement au chemin officiel de l’API
Google Meet : créer des espaces de réunion, résoudre des espaces et exécuter des vérifications
de prévol de l’API Meet Media.

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
`meetings.space.readonly` permet à OpenClaw de résoudre les URL/codes Meet en espaces.
`meetings.space.settings` permet à OpenClaw de transmettre des paramètres `SpaceConfig` tels que
`accessType` lors de la création de salle via l’API.
`meetings.conference.media.readonly` sert au prévol de l’API Meet Media et au travail
média ; Google peut exiger une inscription Developer Preview pour l’utilisation réelle de l’API Media.
Si vous n’avez besoin que de connexions Chrome basées sur le navigateur, ignorez entièrement OAuth.

### Générer le jeton d’actualisation

Configurez `oauth.clientId` et éventuellement `oauth.clientSecret`, ou transmettez-les comme
variables d’environnement, puis exécutez :

```bash
openclaw googlemeet auth login --json
```

La commande affiche un bloc de configuration `oauth` avec un jeton d’actualisation. Elle utilise PKCE,
un callback localhost sur `http://localhost:8085/oauth2callback` et un flux manuel
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

Préférez les variables d’environnement lorsque vous ne voulez pas mettre le jeton d’actualisation dans la configuration.
Si des valeurs de configuration et d’environnement sont toutes deux présentes, le plugin résout d’abord la configuration,
puis utilise l’environnement comme solution de repli.

Le consentement OAuth inclut la création d’espaces Meet, l’accès en lecture aux espaces Meet et l’accès
en lecture aux médias de conférence Meet. Si vous vous êtes authentifié avant l’existence de la prise en charge
de la création de réunions, relancez `openclaw googlemeet auth login --json` afin que le jeton d’actualisation
ait la portée `meetings.space.created`.

### Vérifier OAuth avec doctor

Exécutez le doctor OAuth lorsque vous voulez une vérification de santé rapide et sans secret :

```bash
openclaw googlemeet doctor --oauth --json
```

Cela ne charge pas le runtime Chrome et ne nécessite pas de nœud Chrome connecté. Cela
vérifie que la configuration OAuth existe et que le jeton d’actualisation peut générer un jeton d’accès.
Le rapport JSON inclut uniquement des champs d’état tels que `ok`, `configured`,
`tokenSource`, `expiresAt` et les messages de vérification ; il n’affiche pas le jeton d’accès,
le jeton d’actualisation ni le secret client.

Résultats courants :

| Vérification         | Signification                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` plus `oauth.refreshToken`, ou un jeton d’accès en cache, est présent.   |
| `oauth-token`        | Le jeton d’accès en cache est encore valide, ou le jeton d’actualisation a généré un nouveau jeton d’accès. |
| `meet-spaces-get`    | La vérification facultative `--meeting` a résolu un espace Meet existant.                |
| `meet-spaces-create` | La vérification facultative `--create-space` a créé un nouvel espace Meet.               |

Pour prouver aussi l’activation de l’API Google Meet et la portée `spaces.create`, exécutez la
vérification de création avec effet de bord :

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` crée une URL Meet temporaire. Utilisez-la lorsque vous devez confirmer
que le projet Google Cloud a activé l’API Meet et que le compte autorisé
dispose du champ d’application `meetings.space.created`.

Pour prouver l’accès en lecture à un espace de réunion existant :

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` et `resolve-space` prouvent l’accès en lecture à un
espace existant auquel le compte Google autorisé peut accéder. Un `403` renvoyé
par ces vérifications signifie généralement que l’API REST Google Meet est
désactivée, que le jeton d’actualisation consenti ne possède pas le champ
d’application requis, ou que le compte Google ne peut pas accéder à cet espace
Meet. Une erreur de jeton d’actualisation signifie qu’il faut relancer
`openclaw googlemeet auth login --json` et stocker le nouveau bloc `oauth`.

Aucun identifiant OAuth n’est nécessaire pour le repli navigateur. Dans ce mode,
l’authentification Google provient du profil Chrome connecté sur le Node
sélectionné, et non de la configuration OpenClaw.

Ces variables d’environnement sont acceptées comme replis :

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

Exécutez le précontrôle avant le travail média :

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

La recherche Calendar peut résoudre l’URL de réunion depuis Google Calendar
avant de lire les artefacts Meet :

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` recherche dans le calendrier `primary` d’aujourd’hui un événement
Calendar contenant un lien Google Meet. Utilisez `--event <query>` pour
rechercher le texte d’événement correspondant, et `--calendar <id>` pour un
calendrier non principal. La recherche Calendar nécessite une nouvelle connexion
OAuth qui inclut le champ d’application en lecture seule des événements
Calendar. `calendar-events` affiche un aperçu des événements Meet correspondants
et marque l’événement que `latest`, `artifacts`, `attendance` ou `export`
choisira.

Si vous connaissez déjà l’identifiant de l’enregistrement de conférence,
adressez-le directement :

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Terminez une conférence active pour un espace créé par l’API lorsque vous voulez
fermer le salon après l’appel :

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Cela appelle `spaces.endActiveConference` de Google Meet et nécessite OAuth avec
le champ d’application `meetings.space.created` pour un espace que le compte
autorisé peut gérer. OpenClaw accepte une URL Meet, un code de réunion ou une
entrée `spaces/{id}` et la résout vers la ressource d’espace de l’API avant de
terminer la conférence active. Cette commande est distincte de
`googlemeet leave` : `leave` arrête la participation locale/de session
d’OpenClaw, tandis que `end-active-conference` demande à Google Meet de terminer
la conférence active pour l’espace.

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

`artifacts` renvoie les métadonnées d’enregistrement de conférence ainsi que les
métadonnées de ressources de participants, d’enregistrements, de transcriptions,
d’entrées de transcription structurées et de notes intelligentes lorsque Google
les expose pour la réunion. Utilisez `--no-transcript-entries` pour ignorer la
recherche d’entrées pour les grandes réunions. `attendance` développe les
participants en lignes de sessions de participants avec les heures de première
et dernière détection, la durée totale de session, les indicateurs de retard et
de départ anticipé, et les ressources de participants en double fusionnées par
utilisateur connecté ou nom d’affichage. Passez `--no-merge-duplicates` pour
conserver les ressources de participants brutes séparées,
`--late-after-minutes` pour ajuster la détection des retards, et
`--early-before-minutes` pour ajuster la détection des départs anticipés.

`export` écrit un dossier contenant `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` et `manifest.json`.
`manifest.json` enregistre l’entrée choisie, les options d’export, les
enregistrements de conférence, les fichiers de sortie, les décomptes, la source
du jeton, l’événement Calendar lorsqu’il y en a eu un, et les éventuels
avertissements de récupération partielle. Passez `--zip` pour écrire également
une archive portable à côté du dossier. Passez `--include-doc-bodies` pour
exporter le texte des Google Docs liés de transcription et de notes
intelligentes via `files.export` de Google Drive ; cela nécessite une nouvelle
connexion OAuth qui inclut le champ d’application Drive Meet en lecture seule.
Sans `--include-doc-bodies`, les exports incluent uniquement les métadonnées
Meet et les entrées de transcription structurées. Si Google renvoie un échec
partiel d’artefact, comme une erreur de liste de notes intelligentes, d’entrée
de transcription ou de corps de document Drive, le résumé et le manifeste
conservent l’avertissement au lieu de faire échouer tout l’export. Utilisez
`--dry-run` pour récupérer les mêmes données d’artefacts/de présence et
afficher le JSON du manifeste sans créer le dossier ni le ZIP. C’est utile avant
d’écrire un export volumineux ou lorsqu’un agent a seulement besoin des
décomptes, des enregistrements sélectionnés et des avertissements.

Les agents peuvent aussi créer le même lot via l’outil `google_meet` :

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Définissez `"dryRun": true` pour renvoyer uniquement le manifeste d’export et
ignorer les écritures de fichiers.

Les agents peuvent aussi créer un salon adossé à l’API avec une politique
d’accès explicite :

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime",
  "accessType": "OPEN"
}
```

Et ils peuvent terminer la conférence active pour un salon connu :

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Pour la validation par écoute d’abord, les agents doivent utiliser `test_listen`
avant d’affirmer que la réunion est utile :

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Exécutez le smoke test live protégé contre une vraie réunion conservée :

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Exécutez la sonde navigateur live par écoute d’abord contre une réunion où
quelqu’un parlera avec les sous-titres Meet disponibles :

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Environnement du smoke test live :

- `OPENCLAW_LIVE_TEST=1` active les tests live protégés.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` pointe vers une URL Meet conservée, un
  code ou `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` ou `GOOGLE_MEET_CLIENT_ID` fournit
  l’identifiant client OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` ou `GOOGLE_MEET_REFRESH_TOKEN` fournit
  le jeton d’actualisation.
- Facultatif : `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` et
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` utilisent les mêmes noms de
  repli sans le préfixe `OPENCLAW_`.

Le smoke test live de base des artefacts/de la présence nécessite
`https://www.googleapis.com/auth/meetings.space.readonly` et
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. La
recherche Calendar nécessite
`https://www.googleapis.com/auth/calendar.events.readonly`. L’export de corps de
document Drive nécessite
`https://www.googleapis.com/auth/drive.meet.readonly`.

Créez un nouvel espace Meet :

```bash
openclaw googlemeet create
```

La commande affiche le nouveau `meeting uri`, la source et la session de
participation. Avec des identifiants OAuth, elle utilise l’API Google Meet
officielle. Sans identifiants OAuth, elle utilise comme repli le profil
navigateur connecté du Node Chrome épinglé. Les agents peuvent utiliser l’outil
`google_meet` avec `action: "create"` pour créer et rejoindre en une seule
étape. Pour une création uniquement d’URL, passez `"join": false`.

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

Si le repli navigateur rencontre une connexion Google ou un blocage
d’autorisation Meet avant de pouvoir créer l’URL, la méthode Gateway renvoie une
réponse échouée et l’outil `google_meet` renvoie des détails structurés au lieu
d’une simple chaîne :

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

Lorsqu’un agent voit `manualActionRequired: true`, il doit signaler le
`manualActionMessage` ainsi que le contexte Node/onglet du navigateur et arrêter
d’ouvrir de nouveaux onglets Meet jusqu’à ce que l’opérateur termine l’étape
dans le navigateur.

Exemple de sortie JSON d’une création par l’API :

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

La création d’un Meet rejoint la réunion par défaut. Le transport Chrome ou
Chrome-node nécessite toujours un profil Google Chrome connecté pour rejoindre
via le navigateur. Si le profil est déconnecté, OpenClaw signale
`manualActionRequired: true` ou une erreur de repli navigateur et demande à
l’opérateur de terminer la connexion Google avant de réessayer.

Définissez `preview.enrollmentAcknowledged: true` seulement après avoir confirmé
que votre projet Cloud, le principal OAuth et les participants à la réunion sont
inscrits au programme Google Workspace Developer Preview Program pour les API
média Meet.

## Configuration

Le chemin temps réel Chrome commun nécessite seulement que le Plugin soit
activé, BlackHole, SoX et une clé de fournisseur vocal temps réel backend.
OpenAI est la valeur par défaut ; définissez `realtime.provider: "google"` pour
utiliser Google Gemini Live :

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Définissez la configuration du Plugin sous `plugins.entries.google-meet.config`:

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
- `defaultMode: "realtime"`
- `chromeNode.node` : ID/nom/IP de nœud optionnel pour `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"` : nom utilisé sur l’écran d’invité Meet
  déconnecté
- `chrome.autoJoin: true` : remplissage du nom d’invité et clic sur Rejoindre maintenant au mieux
  via l’automatisation de navigateur OpenClaw sur `chrome-node`
- `chrome.reuseExistingTab: true` : activer un onglet Meet existant au lieu
  d’ouvrir des doublons
- `chrome.waitForInCallMs: 20000` : attendre que l’onglet Meet signale l’état en appel
  avant le déclenchement de l’introduction temps réel
- `chrome.audioFormat: "pcm16-24khz"` : format audio de paire de commandes. Utilisez
  `"g711-ulaw-8khz"` uniquement pour les paires de commandes héritées/personnalisées qui émettent encore
  de l’audio téléphonique.
- `chrome.audioInputCommand` : commande SoX lisant depuis CoreAudio `BlackHole 2ch`
  et écrivant l’audio au format `chrome.audioFormat`
- `chrome.audioOutputCommand` : commande SoX lisant l’audio au format `chrome.audioFormat`
  et écrivant vers CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand` : commande de microphone local optionnelle qui écrit
  du PCM mono signé 16 bits little-endian pour la détection d’interruption humaine pendant que
  la lecture de l’assistant est active. Cela s’applique actuellement au pont de paire de commandes
  `chrome` hébergé par le Gateway.
- `chrome.bargeInRmsThreshold: 650` : niveau RMS qui compte comme une interruption
  humaine sur `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500` : niveau de crête qui compte comme une interruption
  humaine sur `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900` : délai minimal entre les effacements répétés
  d’interruption humaine
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions` : réponses parlées brèves, avec
  `openclaw_agent_consult` pour des réponses plus approfondies
- `realtime.introMessage` : bref contrôle de disponibilité parlé lorsque le pont temps réel
  se connecte ; définissez-le sur `""` pour rejoindre silencieusement
- `realtime.agentId` : ID d’agent OpenClaw optionnel pour
  `openclaw_agent_consult` ; par défaut `main`

Remplacements optionnels :

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

Configuration uniquement Twilio :

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
lit la séquence DTMF avant d’ouvrir le flux média temps réel, puis utilise le
texte d’introduction enregistré comme message d’accueil temps réel initial. Si `voice-call` n’est pas
activé, Google Meet peut toujours valider et enregistrer le plan d’appel, mais il ne peut pas
passer l’appel Twilio.

## Outil

Les agents peuvent utiliser l’outil `google_meet` :

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Utilisez `transport: "chrome"` lorsque Chrome s’exécute sur l’hôte Gateway. Utilisez
`transport: "chrome-node"` lorsque Chrome s’exécute sur un nœud appairé, comme une VM Parallels.
Dans les deux cas, le modèle temps réel et `openclaw_agent_consult` s’exécutent sur l’hôte
Gateway, donc les identifiants de modèle y restent.

Utilisez `action: "status"` pour lister les sessions actives ou inspecter un ID de session. Utilisez
`action: "speak"` avec `sessionId` et `message` pour faire parler immédiatement l’agent temps réel.
Utilisez `action: "test_speech"` pour créer ou réutiliser la session,
déclencher une phrase connue et renvoyer l’état de santé `inCall` lorsque l’hôte Chrome peut
le signaler. `test_speech` force toujours `mode: "realtime"` et échoue si on lui demande de
s’exécuter en `mode: "transcribe"` parce que les sessions d’observation seule ne peuvent intentionnellement pas
émettre de parole. Son résultat `speechOutputVerified` est basé sur l’augmentation des octets de sortie audio
temps réel pendant cet appel de test, donc une session réutilisée avec un audio plus ancien
ne compte pas comme un nouveau contrôle vocal réussi. Utilisez `action: "leave"` pour marquer
une session comme terminée.

`status` inclut l’état de santé de Chrome lorsqu’il est disponible :

- `inCall` : Chrome semble être dans l’appel Meet
- `micMuted` : état du microphone Meet au mieux
- `manualActionRequired` / `manualActionReason` / `manualActionMessage` : le
  profil de navigateur nécessite une connexion manuelle, l’admission par l’hôte Meet, des autorisations ou
  une réparation du contrôle du navigateur avant que la parole puisse fonctionner
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage` : indique si
  la parole Chrome gérée est autorisée maintenant. `speechReady: false` signifie qu’OpenClaw n’a
  pas envoyé la phrase d’introduction/test dans le pont audio.
- `providerConnected` / `realtimeReady` : état du pont vocal temps réel
- `lastInputAt` / `lastOutputAt` : dernier audio vu depuis le pont ou envoyé au pont
- `lastSuppressedInputAt` / `suppressedInputBytes` : entrée local loopback ignorée pendant que
  la lecture de l’assistant est active

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Consultation d’agent temps réel

Le mode temps réel Chrome est optimisé pour une boucle vocale en direct. Le fournisseur vocal
temps réel entend l’audio de la réunion et parle via le pont audio configuré.
Lorsque le modèle temps réel a besoin d’un raisonnement plus approfondi, d’informations actuelles ou des outils
OpenClaw normaux, il peut appeler `openclaw_agent_consult`.

L’outil de consultation exécute l’agent OpenClaw normal en arrière-plan avec le contexte récent
de transcription de réunion et renvoie une réponse parlée concise à la session vocale
temps réel. Le modèle vocal peut ensuite prononcer cette réponse dans la réunion.
Il utilise le même outil partagé de consultation temps réel que Voice Call.

Par défaut, les consultations s’exécutent sur l’agent `main`. Définissez `realtime.agentId` lorsqu’une
voie Meet doit consulter un espace de travail d’agent OpenClaw dédié, des valeurs par défaut de modèle,
une politique d’outils, une mémoire et un historique de session.

`realtime.toolPolicy` contrôle l’exécution de consultation :

- `safe-read-only` : exposer l’outil de consultation et limiter l’agent normal à
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` et
  `memory_get`.
- `owner` : exposer l’outil de consultation et laisser l’agent normal utiliser la politique
  d’outils d’agent normale.
- `none` : ne pas exposer l’outil de consultation au modèle vocal temps réel.

La clé de session de consultation est limitée à chaque session Meet, afin que les appels de consultation
de suivi puissent réutiliser le contexte de consultation précédent pendant la même réunion.

Pour forcer un contrôle de disponibilité parlé après que Chrome a entièrement rejoint l’appel :

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Pour le test rapide complet de jonction et parole :

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
  transport par défaut ou qu’un nœud est épinglé.
- `nodes status` indique que le nœud sélectionné est connecté.
- Le nœud sélectionné annonce à la fois `googlemeet.chrome` et `browser.proxy`.
- L’onglet Meet rejoint l’appel et `test-speech` renvoie l’état de santé de Chrome avec
  `inCall: true`.

Pour un hôte Chrome distant comme une VM macOS Parallels, voici le contrôle
sûr le plus court après la mise à jour du Gateway ou de la VM :

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Cela prouve que le Plugin Gateway est chargé, que le nœud VM est connecté avec le
jeton actuel et que le pont audio Meet est disponible avant qu’un agent n’ouvre un
vrai onglet de réunion.

Pour un test rapide Twilio, utilisez une réunion qui expose des détails d’appel téléphonique :

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

État Twilio attendu :

- `googlemeet setup` inclut les contrôles verts `twilio-voice-call-plugin`,
  `twilio-voice-call-credentials` et `twilio-voice-call-webhook`.
- `voicecall` est disponible dans la CLI après le rechargement du Gateway.
- La session renvoyée a `transport: "twilio"` et un `twilio.voiceCallId`.
- `openclaw logs --follow` montre le TwiML DTMF servi avant le TwiML temps réel, puis un
  pont temps réel avec le message d’accueil initial mis en file d’attente.
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

Sur les hôtes Gateway non macOS, l’outil `google_meet` destiné à l’agent reste visible,
mais les actions temps réel Chrome locales sont bloquées avant d’atteindre le pont audio.
L’audio temps réel Chrome local dépend actuellement de `BlackHole 2ch` sur macOS, donc
les agents Linux doivent utiliser `mode: "transcribe"`, l’appel téléphonique Twilio ou un hôte
`chrome-node` macOS au lieu du chemin temps réel Chrome local par défaut.

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
La configuration Gateway doit autoriser ces commandes de nœud :

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Si `googlemeet setup` échoue sur `chrome-node-connected` ou si le journal Gateway signale
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

### Le navigateur s’ouvre, mais l’agent ne peut pas rejoindre

Exécutez `googlemeet test-listen` pour les jonctions en observation seule ou `googlemeet test-speech`
pour les jonctions temps réel, puis inspectez l’état de santé Chrome renvoyé. Si l’une des sondes
signale `manualActionRequired: true`, montrez `manualActionMessage` à l’opérateur
et arrêtez de réessayer jusqu’à ce que l’action du navigateur soit terminée.

Actions manuelles courantes :

- Connectez-vous au profil Chrome.
- Admettez l’invité depuis le compte hôte Meet.
- Accordez les autorisations de microphone/caméra à Chrome lorsque l’invite d’autorisation native
  de Chrome apparaît.
- Fermez ou réparez une boîte de dialogue d’autorisation Meet bloquée.

Ne signalez pas « non connecté » simplement parce que Meet affiche « Voulez-vous que les personnes vous
entendent dans la réunion ? » Il s’agit de l’interstitiel de choix audio de Meet ; OpenClaw
clique sur **Utiliser le microphone** par automatisation du navigateur quand c’est possible et continue
d’attendre l’état réel de la réunion. Pour le repli navigateur limité à la création, OpenClaw
peut cliquer sur **Continuer sans microphone**, car la création de l’URL n’a pas besoin
du chemin audio temps réel.

### La création de réunion échoue

`googlemeet create` utilise d’abord l’endpoint `spaces.create` de l’API Google Meet
lorsque des identifiants OAuth sont configurés. Sans identifiants OAuth, il se rabat
sur le navigateur Chrome node épinglé. Vérifiez :

- Pour la création par API : `oauth.clientId` et `oauth.refreshToken` sont configurés,
  ou des variables d’environnement `OPENCLAW_GOOGLE_MEET_*` correspondantes sont présentes.
- Pour la création par API : le jeton d’actualisation a été généré après l’ajout de la prise en charge
  de la création. Les anciens jetons peuvent ne pas avoir le périmètre `meetings.space.created` ; relancez
  `openclaw googlemeet auth login --json` et mettez à jour la configuration du plugin.
- Pour le repli navigateur : `defaultTransport: "chrome-node"` et
  `chromeNode.node` pointent vers un node connecté avec `browser.proxy` et
  `googlemeet.chrome`.
- Pour le repli navigateur : le profil Chrome OpenClaw sur ce node est connecté
  à Google et peut ouvrir `https://meet.google.com/new`.
- Pour le repli navigateur : les nouvelles tentatives réutilisent un onglet existant `https://meet.google.com/new`
  ou une invite de compte Google avant d’ouvrir un nouvel onglet. Si un agent expire,
  relancez l’appel d’outil plutôt que d’ouvrir manuellement un autre onglet Meet.
- Pour le repli navigateur : si l’outil renvoie `manualActionRequired: true`, utilisez
  les valeurs renvoyées `browser.nodeId`, `browser.targetId`, `browserUrl` et
  `manualActionMessage` pour guider l’opérateur. Ne réessayez pas en boucle avant que cette
  action soit terminée.
- Pour le repli navigateur : si Meet affiche « Voulez-vous que les personnes vous entendent dans la
  réunion ? », laissez l’onglet ouvert. OpenClaw doit cliquer sur **Utiliser le microphone** ou, pour
  le repli limité à la création, sur **Continuer sans microphone** par automatisation du navigateur
  et continuer d’attendre l’URL Meet générée. S’il ne le peut pas, l’erreur doit mentionner
  `meet-audio-choice-required`, pas `google-login-required`.

### L’agent rejoint la réunion mais ne parle pas

Vérifiez le chemin temps réel :

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Utilisez `mode: "realtime"` pour écouter et répondre. `mode: "transcribe"` ne démarre
intentionnellement pas le pont vocal temps réel duplex. Pour le débogage en observation seule,
exécutez `openclaw googlemeet status --json <session-id>` après que des participants ont parlé
et vérifiez `captioning`, `transcriptLines` et `lastCaptionText`. Si `inCall` est
true mais que `transcriptLines` reste à `0`, les sous-titres Meet peuvent être désactivés, personne
n’a parlé depuis l’installation de l’observateur, l’interface Meet a changé, ou les sous-titres
en direct ne sont pas disponibles pour la langue ou le compte de la réunion.

`googlemeet test-speech` vérifie toujours le chemin temps réel et indique si
des octets de sortie du pont ont été observés pour cette invocation. Si `speechOutputVerified` est false et que
`speechOutputTimedOut` est true, le fournisseur temps réel peut avoir accepté
l’énoncé, mais OpenClaw n’a pas vu de nouveaux octets de sortie atteindre le pont audio
Chrome.

Vérifiez aussi :

- Une clé de fournisseur temps réel est disponible sur l’hôte Gateway, par exemple
  `OPENAI_API_KEY` ou `GEMINI_API_KEY`.
- `BlackHole 2ch` est visible sur l’hôte Chrome.
- `sox` existe sur l’hôte Chrome.
- Le microphone et le haut-parleur Meet sont acheminés via le chemin audio virtuel utilisé par
  OpenClaw.

`googlemeet doctor [session-id]` affiche la session, le node, l’état en appel,
la raison de l’action manuelle, la connexion du fournisseur temps réel, `realtimeReady`, l’activité
d’entrée/sortie audio, les derniers horodatages audio, les compteurs d’octets et l’URL du navigateur.
Utilisez `googlemeet status [session-id] --json` lorsque vous avez besoin du JSON brut. Utilisez
`googlemeet doctor --oauth` lorsque vous devez vérifier l’actualisation OAuth Google Meet
sans exposer les jetons ; ajoutez `--meeting` ou `--create-space` lorsque vous avez aussi besoin d’une
preuve via l’API Google Meet.

Si un agent a expiré et que vous voyez un onglet Meet déjà ouvert, inspectez cet onglet
sans en ouvrir un autre :

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

L’action d’outil équivalente est `recover_current_tab`. Elle cible et inspecte un
onglet Meet existant pour le transport sélectionné. Avec `chrome`, elle utilise le contrôle local
du navigateur via le Gateway ; avec `chrome-node`, elle utilise le node Chrome configuré.
Elle n’ouvre pas de nouvel onglet et ne crée pas de nouvelle session ; elle signale le
blocage actuel, comme la connexion, l’admission, les autorisations ou l’état de choix audio.
La commande CLI communique avec le Gateway configuré, le Gateway doit donc être en cours d’exécution ;
`chrome-node` exige aussi que le node Chrome soit connecté.

### Les vérifications de configuration Twilio échouent

`twilio-voice-call-plugin` échoue lorsque `voice-call` n’est pas autorisé ou n’est pas activé.
Ajoutez-le à `plugins.allow`, activez `plugins.entries.voice-call`, puis rechargez le
Gateway.

`twilio-voice-call-credentials` échoue lorsqu’il manque au backend Twilio le SID du compte,
le jeton d’authentification ou le numéro appelant. Définissez-les sur l’hôte Gateway :

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` échoue lorsque `voice-call` n’a pas d’exposition Webhook
publique, ou lorsque `publicUrl` pointe vers un loopback ou un espace de réseau privé.
Définissez `plugins.entries.voice-call.config.publicUrl` sur l’URL publique du fournisseur ou
configurez une exposition par tunnel/Tailscale pour `voice-call`.

Les URL de loopback et privées ne sont pas valides pour les rappels des opérateurs. N’utilisez pas
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
d’hôte privé :

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

Puis redémarrez ou rechargez le Gateway et exécutez :

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` vérifie uniquement la préparation par défaut. Pour simuler un numéro spécifique :

```bash
openclaw voicecall smoke --to "+15555550123"
```

N’ajoutez `--yes` que lorsque vous voulez intentionnellement passer un appel de notification
sortant réel :

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### L’appel Twilio démarre mais n’entre jamais dans la réunion

Confirmez que l’événement Meet expose les détails d’appel téléphonique. Passez le numéro exact
à composer et le code PIN, ou une séquence DTMF personnalisée :

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Utilisez un `w` initial ou des virgules dans `--dtmf-sequence` si le fournisseur a besoin d’une pause
avant la saisie du code PIN.

Si l’appel téléphonique est créé mais que la liste des participants Meet n’affiche jamais le
participant appelé :

- Exécutez `openclaw googlemeet doctor <session-id>` pour confirmer l’ID d’appel Twilio délégué,
  si la DTMF a été mise en file d’attente et si le message d’accueil d’introduction a été demandé.
- Exécutez `openclaw voicecall status --call-id <id>` et confirmez que l’appel est toujours
  actif.
- Exécutez `openclaw voicecall tail` et vérifiez que les Webhooks Twilio arrivent au
  Gateway.
- Exécutez `openclaw logs --follow` et cherchez la séquence Twilio Meet : Google
  Meet délègue la jonction, Voice Call démarre la branche téléphonique, Google Meet attend
  `voiceCall.dtmfDelayMs`, envoie la DTMF avec `voicecall.dtmf`, attend
  `voiceCall.postDtmfSpeechDelayMs`, puis demande le discours d’introduction avec
  `voicecall.speak`.
- Relancez `openclaw googlemeet setup --transport twilio` ; une vérification de configuration verte est
  requise, mais elle ne prouve pas que la séquence de code PIN de la réunion est correcte.
- Confirmez que le numéro à composer appartient à la même invitation Meet et à la même région que
  le code PIN.
- Augmentez `voiceCall.dtmfDelayMs` si Meet répond lentement ou si la transcription de l’appel
  affiche encore l’invite demandant un code PIN après l’envoi de la DTMF.
- Si le participant rejoint mais que vous n’entendez pas le message d’accueil, vérifiez
  `openclaw logs --follow` pour la requête post-DTMF `voicecall.speak` et
  soit la lecture TTS du flux multimédia, soit le repli Twilio `<Say>`. Si la transcription de l’appel
  contient encore « enter the meeting PIN », la branche téléphonique n’a pas encore rejoint
  la salle Meet, les participants à la réunion n’entendront donc pas la parole.

Si les Webhooks n’arrivent pas, déboguez d’abord le plugin Voice Call : le fournisseur doit
atteindre `plugins.entries.voice-call.config.publicUrl` ou le tunnel configuré.
Voir [Dépannage des appels vocaux](/fr/plugins/voice-call#troubleshooting).

## Notes

L’API média officielle de Google Meet est orientée réception, donc parler dans un appel Meet
nécessite encore un chemin participant. Ce plugin garde cette limite visible :
Chrome gère la participation via navigateur et le routage audio local ; Twilio gère
la participation par appel téléphonique.

Le mode temps réel de Chrome nécessite `BlackHole 2ch` plus l’un des éléments suivants :

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand` : OpenClaw possède le
  pont de modèle temps réel et achemine l’audio en `chrome.audioFormat` entre ces
  commandes et le fournisseur vocal temps réel sélectionné. Le chemin Chrome par défaut est
  PCM16 24 kHz ; G.711 mu-law 8 kHz reste disponible pour les anciennes paires de commandes.
- `chrome.audioBridgeCommand` : une commande de pont externe possède tout le chemin audio
  local et doit quitter après avoir démarré ou validé son démon.

Pour un audio duplex propre, acheminez la sortie Meet et le microphone Meet via des
appareils virtuels séparés ou un graphe d’appareils virtuels de type Loopback. Un seul appareil
BlackHole partagé peut renvoyer l’écho des autres participants dans l’appel.

Avec le pont Chrome par paire de commandes, `chrome.bargeInInputCommand` peut écouter un
microphone local séparé et effacer la lecture de l’assistant lorsque l’humain commence à
parler. Cela maintient la parole humaine avant la sortie de l’assistant même lorsque l’entrée local loopback
BlackHole partagée est temporairement supprimée pendant la lecture de l’assistant.
Comme `chrome.audioInputCommand` et `chrome.audioOutputCommand`, il s’agit d’une
commande locale configurée par l’opérateur. Utilisez un chemin de commande approuvé explicite ou
une liste d’arguments, et ne le faites pas pointer vers des scripts provenant d’emplacements non approuvés.

`googlemeet speak` déclenche le pont audio temps réel actif pour une session Chrome.
`googlemeet leave` arrête ce pont. Pour les sessions Twilio déléguées
via le plugin Voice Call, `leave` raccroche aussi l’appel vocal sous-jacent.
Utilisez `googlemeet end-active-conference` lorsque vous voulez aussi fermer la
conférence Google Meet active pour un espace géré par API.

## Liens associés

- [Plugin d’appel vocal](/fr/plugins/voice-call)
- [Mode conversation](/fr/nodes/talk)
- [Créer des plugins](/fr/plugins/building-plugins)
