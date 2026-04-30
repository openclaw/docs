---
read_when:
    - Vous voulez qu’un agent OpenClaw rejoigne un appel Google Meet
    - Vous voulez qu’un agent OpenClaw crée un nouvel appel Google Meet
    - Vous configurez Chrome, un nœud Chrome ou Twilio en tant que transport Google Meet
summary: 'Plugin Google Meet : rejoindre des URL Meet explicites via Chrome ou Twilio avec des paramètres vocaux par défaut en temps réel'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-30T07:38:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b989c872fee0dca31680f67559cd26b715303f7c6f4eeda51fc63889bb0383c
    source_path: plugins/google-meet.md
    workflow: 16
---

Prise en charge des participants Google Meet pour OpenClaw — le plugin est explicitement conçu ainsi :

- Il ne rejoint qu'une URL explicite `https://meet.google.com/...`.
- Il peut créer un nouvel espace Meet via l'API Google Meet, puis rejoindre l'URL
  retournée.
- La voix `realtime` est le mode par défaut.
- La voix en temps réel peut rappeler l'agent OpenClaw complet lorsqu'un
  raisonnement plus approfondi ou des outils sont nécessaires.
- Les agents choisissent le comportement de connexion avec `mode` : utilisez `realtime` pour l'écoute et
  la réponse orale en direct, ou `transcribe` pour rejoindre/contrôler le navigateur sans le
  pont vocal en temps réel.
- L'authentification commence par Google OAuth personnel ou un profil Chrome déjà connecté.
- Il n'y a pas d'annonce de consentement automatique.
- Le backend audio Chrome par défaut est `BlackHole 2ch`.
- Chrome peut s'exécuter localement ou sur un hôte de nœud appairé.
- Twilio accepte un numéro d'appel entrant plus un PIN ou une séquence DTMF facultatifs.
- La commande CLI est `googlemeet` ; `meet` est réservé aux workflows de
  téléconférence d'agents plus larges.

## Démarrage rapide

Installez les dépendances audio locales et configurez un fournisseur de voix
en temps réel backend. OpenAI est la valeur par défaut ; Google Gemini Live fonctionne aussi avec
`realtime.provider: "google"` :

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` installe le périphérique audio virtuel `BlackHole 2ch`. Le programme
d'installation de Homebrew nécessite un redémarrage avant que macOS expose le périphérique :

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

La sortie de configuration est conçue pour être lisible par les agents et consciente du mode. Elle signale le profil Chrome,
l'épinglage du nœud et, pour les connexions Chrome en temps réel, le pont audio BlackHole/SoX
ainsi que les vérifications d'introduction en temps réel différées. Pour les connexions en observation seule, vérifiez le même
transport avec `--mode transcribe` ; ce mode ignore les prérequis audio en temps réel
car il n'écoute ni ne parle via le pont :

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Lorsque la délégation Twilio est configurée, la configuration indique également si le
plugin `voice-call` et les identifiants Twilio sont prêts. Traitez toute vérification
`ok: false` comme bloquante pour le transport et le mode vérifiés avant de demander à un agent de
rejoindre. Utilisez `openclaw googlemeet setup --json` pour les scripts ou une sortie lisible par machine. Utilisez `--transport chrome`, `--transport chrome-node` ou `--transport twilio`
pour prévalider un transport spécifique avant qu'un agent ne l'essaie.

Rejoindre une réunion :

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Ou laissez un agent rejoindre via l'outil `google_meet` :

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Créer une nouvelle réunion et la rejoindre :

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Créer uniquement l'URL sans rejoindre :

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` dispose de deux chemins :

- Création API : utilisée lorsque les identifiants Google Meet OAuth sont configurés. C'est
  le chemin le plus déterministe et il ne dépend pas de l'état de l'interface du navigateur.
- Repli navigateur : utilisé lorsque les identifiants OAuth sont absents. OpenClaw utilise le
  nœud Chrome épinglé, ouvre `https://meet.google.com/new`, attend que Google
  redirige vers une vraie URL avec code de réunion, puis retourne cette URL. Ce chemin nécessite
  que le profil Chrome OpenClaw sur le nœud soit déjà connecté à Google.
  L'automatisation du navigateur gère la propre invite de microphone au premier lancement de Meet ; cette invite
  n'est pas traitée comme un échec de connexion Google.
  Les flux de connexion et de création essaient aussi de réutiliser un onglet Meet existant avant d'en ouvrir un
  nouveau. La correspondance ignore les chaînes de requête d'URL inoffensives comme `authuser`, donc une
  nouvelle tentative de l'agent devrait focaliser la réunion déjà ouverte au lieu de créer un second
  onglet Chrome.

La sortie de commande/outil inclut un champ `source` (`api` ou `browser`) afin que les agents
puissent expliquer quel chemin a été utilisé. `create` rejoint la nouvelle réunion par défaut et
retourne `joined: true` plus la session de connexion. Pour seulement générer l'URL, utilisez
`create --no-join` dans la CLI ou passez `"join": false` à l'outil.

Ou dites à un agent : « Crée un Google Meet, rejoins-le avec la voix en temps réel et envoie-moi
le lien. » L'agent devrait appeler `google_meet` avec `action: "create"` puis
partager le `meetingUri` retourné.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Pour une connexion en observation seule/contrôle du navigateur, définissez `"mode": "transcribe"`. Cela ne
démarre pas le pont du modèle duplex en temps réel, ne nécessite pas BlackHole ni SoX,
et ne répondra pas oralement dans la réunion. Les connexions Chrome dans ce mode évitent aussi
l'octroi d'autorisation microphone/caméra par OpenClaw et évitent le chemin **Utiliser
le microphone** de Meet. Si Meet affiche un interstitiel de choix audio, l'automatisation essaie
le chemin sans microphone et signale sinon une action manuelle au lieu d'ouvrir
le microphone local.

Pendant les sessions en temps réel, le statut `google_meet` inclut l'état de santé du navigateur et du pont audio
comme `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, les derniers horodatages d'entrée/sortie,
les compteurs d'octets et l'état fermé du pont. Si une invite sûre de page Meet
apparaît, l'automatisation du navigateur la gère lorsqu'elle le peut. Les invites de connexion, d'admission par l'hôte et
d'autorisation navigateur/OS sont signalées comme action manuelle avec une raison et
un message que l'agent doit relayer. Les sessions Chrome gérées n'émettent l'introduction ou
la phrase de test qu'après que l'état du navigateur signale `inCall: true` ; sinon le statut signale
`speechReady: false` et la tentative de parole est bloquée au lieu de faire semblant que
l'agent a parlé dans la réunion.

Les connexions Chrome locales passent par le profil de navigateur OpenClaw connecté. Le mode en temps réel
nécessite `BlackHole 2ch` pour le chemin microphone/haut-parleur utilisé par OpenClaw. Pour
un audio duplex propre, utilisez des périphériques virtuels séparés ou un graphe de type Loopback ; un
seul périphérique BlackHole suffit pour un premier test fumigène mais peut provoquer de l'écho.

### Gateway local + Chrome Parallels

Vous n'avez **pas** besoin d'un Gateway OpenClaw complet ni d'une clé d'API de modèle dans une VM macOS
simplement pour que la VM possède Chrome. Exécutez le Gateway et l'agent localement, puis exécutez un
hôte de nœud dans la VM. Activez une fois le plugin groupé sur la VM afin que le nœud
annonce la commande Chrome :

Ce qui s'exécute où :

- Hôte Gateway : OpenClaw Gateway, espace de travail de l'agent, clés de modèle/API, fournisseur
  en temps réel et configuration du plugin Google Meet.
- VM macOS Parallels : CLI/hôte de nœud OpenClaw, Google Chrome, SoX, BlackHole 2ch,
  et un profil Chrome connecté à Google.
- Non nécessaire dans la VM : service Gateway, configuration d'agent, clé OpenAI/GPT ou configuration
  du fournisseur de modèle.

Installez les dépendances de la VM :

```bash
brew install blackhole-2ch sox
```

Redémarrez la VM après l'installation de BlackHole afin que macOS expose `BlackHole 2ch` :

```bash
sudo reboot
```

Après le redémarrage, vérifiez que la VM peut voir le périphérique audio et les commandes SoX :

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Installez ou mettez à jour OpenClaw dans la VM, puis activez-y le plugin groupé :

```bash
openclaw plugins enable google-meet
```

Démarrez l'hôte de nœud dans la VM :

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Si `<gateway-host>` est une IP LAN et que vous n'utilisez pas TLS, le nœud refuse le
WebSocket en clair sauf si vous l'autorisez explicitement pour ce réseau privé de confiance :

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Utilisez la même variable d'environnement lors de l'installation du nœud comme LaunchAgent :

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` est un environnement de processus, pas un
paramètre `openclaw.json`. `openclaw node install` le stocke dans l'environnement du LaunchAgent
lorsqu'il est présent sur la commande d'installation.

Approuvez le nœud depuis l'hôte Gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Confirmez que le Gateway voit le nœud et qu'il annonce à la fois `googlemeet.chrome`
et la capacité navigateur/`browser.proxy` :

```bash
openclaw nodes status
```

Acheminez Meet via ce nœud sur l'hôte Gateway :

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

Rejoignez maintenant normalement depuis l'hôte Gateway :

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

ou demandez à l'agent d'utiliser l'outil `google_meet` avec `transport: "chrome-node"`.

Pour un test fumigène en une commande qui crée ou réutilise une session, prononce une phrase
connue et affiche l'état de santé de la session :

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Pendant la connexion en temps réel, l'automatisation du navigateur OpenClaw renseigne le nom d'invité, clique sur
Rejoindre/Demander à rejoindre, et accepte le choix « Utiliser le microphone » au premier lancement de Meet lorsque cette
invite apparaît. Pendant une connexion en observation seule ou une création de réunion uniquement via navigateur, elle
passe la même invite sans microphone lorsque ce choix est disponible.
Si le profil du navigateur n'est pas connecté, Meet attend l'admission par l'hôte,
Chrome a besoin d'une autorisation microphone/caméra pour une connexion en temps réel, ou Meet est bloqué
sur une invite que l'automatisation n'a pas pu résoudre, le résultat join/test-speech signale
`manualActionRequired: true` avec `manualActionReason` et
`manualActionMessage`. Les agents doivent arrêter de réessayer la connexion, signaler ce message exact
plus les `browserUrl`/`browserTitle` actuels, et ne réessayer qu'une fois l'action manuelle
dans le navigateur terminée.

Si `chromeNode.node` est omis, OpenClaw ne sélectionne automatiquement que lorsqu'exactement un
nœud connecté annonce à la fois `googlemeet.chrome` et le contrôle du navigateur. Si
plusieurs nœuds compatibles sont connectés, définissez `chromeNode.node` sur l'id du nœud,
le nom d'affichage ou l'IP distante.

Vérifications d'échec courantes :

- `Configured Google Meet node ... is not usable: offline` : le nœud épinglé est
  connu du Gateway mais indisponible. Les agents doivent traiter ce nœud comme
  un état de diagnostic, pas comme un hôte Chrome utilisable, et signaler le
  blocage de configuration au lieu de se rabattre sur un autre transport, sauf
  si l’utilisateur l’a demandé.
- `No connected Google Meet-capable node` : démarrez `openclaw node run` dans la VM,
  approuvez l’appairage et assurez-vous que `openclaw plugins enable google-meet` et
  `openclaw plugins enable browser` ont été exécutés dans la VM. Confirmez aussi que
  l’hôte Gateway autorise les deux commandes de nœud avec
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found` : installez `blackhole-2ch` sur l’hôte
  en cours de vérification et redémarrez avant d’utiliser l’audio Chrome local.
- `BlackHole 2ch audio device not found on the node` : installez `blackhole-2ch`
  dans la VM et redémarrez la VM.
- Chrome s’ouvre mais ne peut pas rejoindre la réunion : connectez-vous au profil
  de navigateur dans la VM, ou gardez `chrome.guestName` défini pour une connexion
  en tant qu’invité. La connexion automatique en tant qu’invité utilise
  l’automatisation de navigateur OpenClaw via le proxy de navigateur du nœud ;
  assurez-vous que la configuration du navigateur du nœud pointe vers le profil
  souhaité, par exemple `browser.defaultProfile: "user"` ou un profil de session
  existant nommé.
- Onglets Meet en double : laissez `chrome.reuseExistingTab: true` activé. OpenClaw
  active un onglet existant pour la même URL Meet avant d’en ouvrir un nouveau, et
  la création de réunion dans le navigateur réutilise un onglet
  `https://meet.google.com/new` en cours ou une invite de compte Google avant d’en
  ouvrir un autre.
- Pas d’audio : dans Meet, routez le microphone/haut-parleur via le chemin du
  périphérique audio virtuel utilisé par OpenClaw ; utilisez des périphériques
  virtuels séparés ou un routage de type Loopback pour un son duplex propre.

## Notes d’installation

La valeur par défaut temps réel de Chrome utilise deux outils externes :

- `sox` : utilitaire audio en ligne de commande. Le plugin utilise des commandes
  de périphérique CoreAudio explicites pour le pont audio PCM16 24 kHz par défaut.
- `blackhole-2ch` : pilote audio virtuel macOS. Il crée le périphérique audio
  `BlackHole 2ch` que Chrome/Meet peut utiliser pour le routage.

OpenClaw n’intègre ni ne redistribue aucun de ces deux paquets. La documentation
demande aux utilisateurs de les installer comme dépendances hôte via Homebrew.
SoX est sous licence `LGPL-2.0-only AND GPL-2.0-only` ; BlackHole est sous
GPL-3.0. Si vous créez un programme d’installation ou une appliance qui intègre
BlackHole avec OpenClaw, examinez les conditions de licence amont de BlackHole ou
obtenez une licence séparée auprès d’Existential Audio.

## Transports

### Chrome

Le transport Chrome ouvre l’URL Meet via le contrôle de navigateur OpenClaw et
rejoint la réunion avec le profil de navigateur OpenClaw connecté. Sur macOS, le
plugin vérifie la présence de `BlackHole 2ch` avant le lancement. S’il est
configuré, il exécute aussi une commande d’état du pont audio et une commande de
démarrage avant d’ouvrir Chrome. Utilisez `chrome` lorsque Chrome/l’audio sont sur
l’hôte Gateway ; utilisez `chrome-node` lorsque Chrome/l’audio sont sur un nœud
appairé, comme une VM macOS Parallels. Pour Chrome local, choisissez le profil
avec `browser.defaultProfile` ; `chrome.browserProfile` est transmis aux hôtes
`chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Routez l’audio du microphone et du haut-parleur Chrome via le pont audio
OpenClaw local. Si `BlackHole 2ch` n’est pas installé, la connexion échoue avec
une erreur de configuration au lieu de rejoindre silencieusement sans chemin
audio.

### Twilio

Le transport Twilio est un plan de numérotation strict délégué au plugin Voice
Call. Il n’analyse pas les pages Meet pour trouver des numéros de téléphone.

Utilisez-le lorsque la participation via Chrome n’est pas disponible ou si vous
voulez un recours par appel téléphonique. Google Meet doit exposer un numéro de
connexion téléphonique et un code PIN pour la réunion ; OpenClaw ne les découvre
pas depuis la page Meet.

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

Fournissez les identifiants Twilio via l’environnement ou la configuration.
L’environnement garde les secrets hors de `openclaw.json` :

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Redémarrez ou rechargez le Gateway après avoir activé `voice-call` ; les
changements de configuration de plugin n’apparaissent pas dans un processus
Gateway déjà en cours d’exécution tant qu’il n’est pas rechargé.

Puis vérifiez :

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Lorsque la délégation Twilio est raccordée, `googlemeet setup` inclut des
vérifications `twilio-voice-call-plugin` et `twilio-voice-call-credentials`
réussies.

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

OAuth est facultatif pour créer un lien Meet, car `googlemeet create` peut se
rabattre sur l’automatisation du navigateur. Configurez OAuth lorsque vous voulez
la création via l’API officielle, la résolution d’espaces ou les vérifications
préalables de l’API Meet Media.

L’accès à l’API Google Meet utilise OAuth utilisateur : créez un client OAuth
Google Cloud, demandez les portées requises, autorisez un compte Google, puis
stockez le jeton d’actualisation obtenu dans la configuration du plugin Google
Meet ou fournissez les variables d’environnement `OPENCLAW_GOOGLE_MEET_*`.

OAuth ne remplace pas le chemin de connexion Chrome. Les transports Chrome et
Chrome-node rejoignent toujours la réunion via un profil Chrome connecté,
BlackHole/SoX et un nœud connecté lorsque vous utilisez la participation via
navigateur. OAuth ne sert qu’au chemin officiel de l’API Google Meet : créer des
espaces de réunion, résoudre des espaces et exécuter les vérifications préalables
de l’API Meet Media.

### Créer des identifiants Google

Dans Google Cloud Console :

1. Créez ou sélectionnez un projet Google Cloud.
2. Activez **Google Meet REST API** pour ce projet.
3. Configurez l’écran de consentement OAuth.
   - **Internal** est le plus simple pour une organisation Google Workspace.
   - **External** fonctionne pour les configurations personnelles/de test ; tant
     que l’application est en phase de test, ajoutez chaque compte Google qui
     autorisera l’application comme utilisateur de test.
4. Ajoutez les portées demandées par OpenClaw :
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Créez un ID client OAuth.
   - Type d’application : **Web application**.
   - URI de redirection autorisé :

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Copiez l’ID client et le secret client.

`meetings.space.created` est requis par Google Meet `spaces.create`.
`meetings.space.readonly` permet à OpenClaw de résoudre des URL/codes Meet en
espaces. `meetings.conference.media.readonly` sert à la vérification préalable
de l’API Meet Media et aux travaux média ; Google peut exiger l’inscription au
Developer Preview pour l’utilisation effective de l’API Media. Si vous avez
seulement besoin de connexions Chrome basées sur le navigateur, ignorez
complètement OAuth.

### Générer le jeton d’actualisation

Configurez `oauth.clientId` et éventuellement `oauth.clientSecret`, ou passez-les
comme variables d’environnement, puis exécutez :

```bash
openclaw googlemeet auth login --json
```

La commande affiche un bloc de configuration `oauth` avec un jeton
d’actualisation. Elle utilise PKCE, le rappel localhost sur
`http://localhost:8085/oauth2callback` et un flux manuel copier/coller avec
`--manual`.

Exemples :

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Utilisez le mode manuel lorsque le navigateur ne peut pas atteindre le rappel
local :

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

Préférez les variables d’environnement lorsque vous ne voulez pas placer le jeton
d’actualisation dans la configuration. Si des valeurs de configuration et
d’environnement sont toutes deux présentes, le plugin résout d’abord la
configuration, puis utilise l’environnement comme solution de repli.

Le consentement OAuth inclut la création d’espace Meet, l’accès en lecture aux
espaces Meet et l’accès en lecture aux médias de conférence Meet. Si vous vous
êtes authentifié avant l’existence de la prise en charge de la création de
réunions, réexécutez `openclaw googlemeet auth login --json` afin que le jeton
d’actualisation dispose de la portée `meetings.space.created`.

### Vérifier OAuth avec doctor

Exécutez le doctor OAuth lorsque vous voulez une vérification d’état rapide sans
secret :

```bash
openclaw googlemeet doctor --oauth --json
```

Cela ne charge pas le runtime Chrome et ne nécessite pas de nœud Chrome connecté.
La commande vérifie que la configuration OAuth existe et que le jeton
d’actualisation peut générer un jeton d’accès. Le rapport JSON inclut uniquement
des champs d’état tels que `ok`, `configured`, `tokenSource`, `expiresAt` et des
messages de vérification ; il n’affiche pas le jeton d’accès, le jeton
d’actualisation ni le secret client.

Résultats courants :

| Vérification         | Signification                                                                          |
| -------------------- | -------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` plus `oauth.refreshToken`, ou un jeton d’accès mis en cache, est présent. |
| `oauth-token`        | Le jeton d’accès mis en cache est encore valide, ou le jeton d’actualisation a généré un nouveau jeton d’accès. |
| `meet-spaces-get`    | La vérification facultative `--meeting` a résolu un espace Meet existant.              |
| `meet-spaces-create` | La vérification facultative `--create-space` a créé un nouvel espace Meet.             |

Pour prouver également l’activation de l’API Google Meet et la portée
`spaces.create`, exécutez la vérification de création avec effet de bord :

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` crée une URL Meet jetable. Utilisez-la lorsque vous devez
confirmer que l’API Meet est activée dans le projet Google Cloud et que le compte
autorisé possède la portée `meetings.space.created`.

Pour prouver l’accès en lecture à un espace de réunion existant :

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` et `resolve-space` prouvent l’accès en lecture à un
espace existant auquel le compte Google autorisé peut accéder. Un `403` de ces
vérifications signifie généralement que Google Meet REST API est désactivée, que
le jeton d’actualisation consenti ne possède pas la portée requise ou que le
compte Google ne peut pas accéder à cet espace Meet. Une erreur de jeton
d’actualisation signifie qu’il faut réexécuter `openclaw googlemeet auth login
--json` et stocker le nouveau bloc `oauth`.

Aucun identifiant OAuth n’est nécessaire pour le repli par navigateur. Dans ce
mode, l’authentification Google provient du profil Chrome connecté sur le nœud
sélectionné, pas de la configuration OpenClaw.

Ces variables d’environnement sont acceptées comme solutions de repli :

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

Exécutez le contrôle préalable avant toute opération multimédia :

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

La recherche dans le calendrier peut résoudre l’URL de réunion depuis Google Calendar avant de lire les artefacts Meet :

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` recherche dans le calendrier `primary` d’aujourd’hui un événement Calendar contenant un lien Google Meet. Utilisez `--event <query>` pour rechercher le texte d’un événement correspondant, et `--calendar <id>` pour un calendrier non principal. La recherche dans le calendrier nécessite une nouvelle connexion OAuth qui inclut le périmètre en lecture seule des événements Calendar. `calendar-events` affiche un aperçu des événements Meet correspondants et marque l’événement que `latest`, `artifacts`, `attendance` ou `export` choisira.

Si vous connaissez déjà l’identifiant de l’enregistrement de conférence, ciblez-le directement :

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Écrire un rapport lisible :

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

`artifacts` renvoie les métadonnées d’enregistrement de conférence ainsi que les métadonnées de ressources de participants, d’enregistrements, de transcriptions, d’entrées de transcription structurées et de notes intelligentes lorsque Google les expose pour la réunion. Utilisez `--no-transcript-entries` pour ignorer la recherche d’entrées dans les grandes réunions. `attendance` développe les participants en lignes de sessions de participant avec les heures de première/dernière apparition, la durée totale de session, les indicateurs de retard/départ anticipé, et les ressources de participants en double fusionnées par utilisateur connecté ou nom d’affichage. Passez `--no-merge-duplicates` pour garder les ressources de participants brutes séparées, `--late-after-minutes` pour ajuster la détection des retards, et `--early-before-minutes` pour ajuster la détection des départs anticipés.

`export` écrit un dossier contenant `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` et `manifest.json`. `manifest.json` enregistre l’entrée choisie, les options d’exportation, les enregistrements de conférence, les fichiers de sortie, les comptages, la source du jeton, l’événement Calendar lorsqu’il y en a eu un, et tout avertissement de récupération partielle. Passez `--zip` pour écrire aussi une archive portable à côté du dossier. Passez `--include-doc-bodies` pour exporter le texte des Google Docs liés aux transcriptions et aux notes intelligentes via Google Drive `files.export` ; cela nécessite une nouvelle connexion OAuth qui inclut le périmètre en lecture seule Drive Meet. Sans `--include-doc-bodies`, les exportations incluent uniquement les métadonnées Meet et les entrées de transcription structurées. Si Google renvoie un échec partiel d’artefact, comme une erreur de liste de notes intelligentes, d’entrée de transcription ou de corps de document Drive, le résumé et le manifeste conservent l’avertissement au lieu de faire échouer toute l’exportation. Utilisez `--dry-run` pour récupérer les mêmes données d’artefacts/de présence et imprimer le JSON du manifeste sans créer le dossier ni le ZIP. C’est utile avant d’écrire une grande exportation ou lorsqu’un agent n’a besoin que des comptages, des enregistrements sélectionnés et des avertissements.

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

Définissez `"dryRun": true` pour renvoyer uniquement le manifeste d’exportation et ignorer l’écriture des fichiers.

Exécutez le test live protégé avec une vraie réunion conservée :

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Environnement du test live :

- `OPENCLAW_LIVE_TEST=1` active les tests live protégés.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` pointe vers une URL Meet, un code ou `spaces/{id}` conservé.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` ou `GOOGLE_MEET_CLIENT_ID` fournit l’identifiant client OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` ou `GOOGLE_MEET_REFRESH_TOKEN` fournit le jeton d’actualisation.
- Facultatif : `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` et
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` utilisent les mêmes noms de repli
  sans le préfixe `OPENCLAW_`.

Le test live de base des artefacts/de la présence nécessite `https://www.googleapis.com/auth/meetings.space.readonly` et `https://www.googleapis.com/auth/meetings.conference.media.readonly`. La recherche dans le calendrier nécessite `https://www.googleapis.com/auth/calendar.events.readonly`. L’exportation du corps de document Drive nécessite `https://www.googleapis.com/auth/drive.meet.readonly`.

Créer un nouvel espace Meet :

```bash
openclaw googlemeet create
```

La commande imprime le nouveau `meeting uri`, la source et la session de participation. Avec des identifiants OAuth, elle utilise l’API officielle Google Meet. Sans identifiants OAuth, elle utilise en repli le profil de navigateur connecté du nœud Chrome épinglé. Les agents peuvent utiliser l’outil `google_meet` avec `action: "create"` pour créer et rejoindre en une seule étape. Pour une création limitée à l’URL, passez `"join": false`.

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

Si le repli navigateur rencontre une connexion Google ou un blocage d’autorisation Meet avant de pouvoir créer l’URL, la méthode Gateway renvoie une réponse en échec et l’outil `google_meet` renvoie des détails structurés au lieu d’une simple chaîne :

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

La création d’un Meet rejoint la réunion par défaut. Le transport Chrome ou Chrome-node nécessite toujours un profil Google Chrome connecté pour rejoindre via le navigateur. Si le profil est déconnecté, OpenClaw signale `manualActionRequired: true` ou une erreur de repli navigateur et demande à l’opérateur de terminer la connexion Google avant de réessayer.

Définissez `preview.enrollmentAcknowledged: true` uniquement après avoir confirmé que votre projet Cloud, votre principal OAuth et les participants à la réunion sont inscrits au Google Workspace Developer Preview Program pour les API multimédias Meet.

## Config

Le chemin temps réel Chrome commun n’a besoin que du Plugin activé, de BlackHole, de SoX et d’une clé de fournisseur vocal temps réel backend. OpenAI est la valeur par défaut ; définissez `realtime.provider: "google"` pour utiliser Google Gemini Live :

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
- `defaultMode: "realtime"`
- `chromeNode.node`: identifiant/nom/IP de nœud facultatif pour `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"` : nom utilisé sur l’écran d’invité Meet déconnecté
- `chrome.autoJoin: true` : remplissage du nom d’invité et clic sur Join Now au mieux via l’automatisation du navigateur OpenClaw sur `chrome-node`
- `chrome.reuseExistingTab: true` : activer un onglet Meet existant au lieu d’ouvrir des doublons
- `chrome.waitForInCallMs: 20000` : attendre que l’onglet Meet signale l’état en appel avant de déclencher l’introduction temps réel
- `chrome.audioFormat: "pcm16-24khz"` : format audio de paire de commandes. Utilisez `"g711-ulaw-8khz"` uniquement pour les paires de commandes héritées/personnalisées qui émettent encore de l’audio téléphonique.
- `chrome.audioInputCommand` : commande SoX lisant depuis CoreAudio `BlackHole 2ch` et écrivant l’audio dans `chrome.audioFormat`
- `chrome.audioOutputCommand` : commande SoX lisant l’audio dans `chrome.audioFormat` et écrivant vers CoreAudio `BlackHole 2ch`
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions` : réponses orales brèves, avec `openclaw_agent_consult` pour les réponses plus approfondies
- `realtime.introMessage` : bref contrôle de disponibilité oral lorsque le pont temps réel se connecte ; définissez-le sur `""` pour rejoindre silencieusement
- `realtime.agentId` : identifiant d’agent OpenClaw facultatif pour `openclaw_agent_consult` ; par défaut `main`

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

`voiceCall.enabled` vaut `true` par défaut ; avec le transport Twilio, il délègue l’appel PSTN réel et le DTMF au Plugin Voice Call. Si `voice-call` n’est pas activé, Google Meet peut encore valider et enregistrer le plan de numérotation, mais il ne peut pas passer l’appel Twilio.

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
`transport: "chrome-node"` lorsque Chrome s’exécute sur un nœud appairé, comme une VM
Parallels. Dans les deux cas, le modèle en temps réel et `openclaw_agent_consult` s’exécutent sur
l’hôte Gateway, donc les identifiants du modèle y restent.

Utilisez `action: "status"` pour lister les sessions actives ou inspecter un ID de session. Utilisez
`action: "speak"` avec `sessionId` et `message` pour faire parler immédiatement l’agent en temps réel.
Utilisez `action: "test_speech"` pour créer ou réutiliser la session,
déclencher une phrase connue, et retourner l’état `inCall` lorsque l’hôte Chrome peut
le signaler. `test_speech` force toujours `mode: "realtime"` et échoue si on lui demande de
s’exécuter en `mode: "transcribe"`, car les sessions d’observation seule ne peuvent volontairement pas
émettre de parole. Son résultat `speechOutputVerified` est basé sur l’augmentation des octets de sortie audio
en temps réel pendant cet appel de test, donc une session réutilisée avec un ancien audio
ne compte pas comme une nouvelle vérification vocale réussie. Utilisez `action: "leave"` pour marquer
une session comme terminée.

`status` inclut l’état de Chrome lorsqu’il est disponible :

- `inCall` : Chrome semble être dans l’appel Meet
- `micMuted` : état du microphone Meet, au mieux des possibilités
- `manualActionRequired` / `manualActionReason` / `manualActionMessage` : le
  profil du navigateur nécessite une connexion manuelle, une admission par l’hôte Meet, des autorisations, ou
  une réparation du contrôle du navigateur avant que la parole puisse fonctionner
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage` : indique si
  la parole Chrome gérée est actuellement autorisée. `speechReady: false` signifie qu’OpenClaw n’a
  pas envoyé la phrase d’introduction/de test dans le pont audio.
- `providerConnected` / `realtimeReady` : état du pont vocal en temps réel
- `lastInputAt` / `lastOutputAt` : dernier audio reçu du pont ou envoyé vers celui-ci

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Consultation d’agent en temps réel

Le mode en temps réel de Chrome est optimisé pour une boucle vocale en direct. Le fournisseur vocal en temps réel
écoute l’audio de la réunion et parle via le pont audio configuré.
Lorsque le modèle en temps réel a besoin d’un raisonnement plus approfondi, d’informations actuelles, ou des outils
OpenClaw normaux, il peut appeler `openclaw_agent_consult`.

L’outil de consultation exécute l’agent OpenClaw standard en arrière-plan avec le contexte récent
de transcription de la réunion et retourne une réponse orale concise à la session vocale en temps réel.
Le modèle vocal peut ensuite prononcer cette réponse dans la réunion.
Il utilise le même outil de consultation en temps réel partagé que Voice Call.

Par défaut, les consultations s’exécutent avec l’agent `main`. Définissez `realtime.agentId` lorsqu’un
flux Meet doit consulter un espace de travail d’agent OpenClaw dédié, avec ses valeurs par défaut de modèle,
sa politique d’outils, sa mémoire, et son historique de session.

`realtime.toolPolicy` contrôle l’exécution de la consultation :

- `safe-read-only` : expose l’outil de consultation et limite l’agent standard à
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, et
  `memory_get`.
- `owner` : expose l’outil de consultation et laisse l’agent standard utiliser la politique
  d’outils normale de l’agent.
- `none` : n’expose pas l’outil de consultation au modèle vocal en temps réel.

La clé de session de consultation est délimitée par session Meet, afin que les appels de consultation de suivi
puissent réutiliser le contexte de consultation précédent pendant la même réunion.

Pour forcer une vérification de disponibilité orale après que Chrome a entièrement rejoint l’appel :

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Pour le test de fumée complet de jonction et de parole :

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
- L’onglet Meet rejoint l’appel et `test-speech` retourne l’état Chrome avec
  `inCall: true`.

Pour un hôte Chrome distant comme une VM macOS Parallels, voici la vérification
sûre la plus courte après la mise à jour du Gateway ou de la VM :

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
vrai onglet de réunion.

Pour un test de fumée Twilio, utilisez une réunion qui expose les détails d’appel téléphonique :

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

État Twilio attendu :

- `googlemeet setup` inclut les vérifications vertes `twilio-voice-call-plugin` et
  `twilio-voice-call-credentials`.
- `voicecall` est disponible dans la CLI après le rechargement du Gateway.
- La session retournée a `transport: "twilio"` et un `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` raccroche l’appel vocal délégué.

## Dépannage

### L’agent ne voit pas l’outil Google Meet

Confirmez que le Plugin est activé dans la configuration du Gateway et rechargez le Gateway :

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Si vous venez de modifier `plugins.entries.google-meet`, redémarrez ou rechargez le Gateway.
L’agent en cours d’exécution ne voit que les outils de Plugin enregistrés par le processus Gateway
actuel.

### Aucun nœud compatible avec Google Meet connecté

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
`gateway token mismatch`, réinstallez ou redémarrez le nœud avec le jeton Gateway
actuel. Pour un Gateway LAN, cela signifie généralement :

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

Exécutez `googlemeet test-speech` et inspectez l’état Chrome retourné. S’il
signale `manualActionRequired: true`, affichez `manualActionMessage` à l’opérateur
et arrêtez les nouvelles tentatives jusqu’à ce que l’action dans le navigateur soit terminée.

Actions manuelles courantes :

- Se connecter au profil Chrome.
- Admettre l’invité depuis le compte hôte Meet.
- Accorder les autorisations microphone/caméra à Chrome lorsque l’invite d’autorisation native
  de Chrome apparaît.
- Fermer ou réparer une boîte de dialogue d’autorisation Meet bloquée.

Ne signalez pas « non connecté » simplement parce que Meet affiche « Do you want people to
hear you in the meeting? ». Il s’agit de l’interstitiel de choix audio de Meet ; OpenClaw
clique sur **Use microphone** via l’automatisation du navigateur lorsqu’elle est disponible et continue
d’attendre l’état réel de la réunion. Pour le repli navigateur en création seule, OpenClaw
peut cliquer sur **Continue without microphone**, car la création de l’URL n’a pas besoin
du chemin audio en temps réel.

### La création de réunion échoue

`googlemeet create` utilise d’abord le point de terminaison Google Meet API `spaces.create`
lorsque les identifiants OAuth sont configurés. Sans identifiants OAuth, il se replie
sur le navigateur du nœud Chrome épinglé. Confirmez :

- Pour la création via API : `oauth.clientId` et `oauth.refreshToken` sont configurés,
  ou des variables d’environnement `OPENCLAW_GOOGLE_MEET_*` correspondantes sont présentes.
- Pour la création via API : le jeton d’actualisation a été généré après l’ajout de la prise en charge
  de la création. Les anciens jetons peuvent ne pas avoir la portée `meetings.space.created` ; réexécutez
  `openclaw googlemeet auth login --json` et mettez à jour la configuration du Plugin.
- Pour le repli navigateur : `defaultTransport: "chrome-node"` et
  `chromeNode.node` pointent vers un nœud connecté avec `browser.proxy` et
  `googlemeet.chrome`.
- Pour le repli navigateur : le profil Chrome OpenClaw sur ce nœud est connecté
  à Google et peut ouvrir `https://meet.google.com/new`.
- Pour le repli navigateur : les nouvelles tentatives réutilisent un onglet existant `https://meet.google.com/new`
  ou un onglet d’invite de compte Google avant d’ouvrir un nouvel onglet. Si un agent expire,
  réessayez l’appel d’outil plutôt que d’ouvrir manuellement un autre onglet Meet.
- Pour le repli navigateur : si l’outil retourne `manualActionRequired: true`, utilisez
  les valeurs retournées `browser.nodeId`, `browser.targetId`, `browserUrl`, et
  `manualActionMessage` pour guider l’opérateur. Ne réessayez pas en boucle tant que cette
  action n’est pas terminée.
- Pour le repli navigateur : si Meet affiche « Do you want people to hear you in the
  meeting? », laissez l’onglet ouvert. OpenClaw doit cliquer sur **Use microphone** ou, pour
  le repli de création seule, sur **Continue without microphone** via
  l’automatisation du navigateur et continuer d’attendre l’URL Meet générée. Si cela échoue, l’erreur
  doit mentionner `meet-audio-choice-required`, et non `google-login-required`.

### L’agent rejoint mais ne parle pas

Vérifiez le chemin en temps réel :

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Utilisez `mode: "realtime"` pour écouter/répondre oralement. `mode: "transcribe"` ne démarre
volontairement pas le pont vocal en temps réel duplex. `googlemeet test-speech`
vérifie toujours le chemin en temps réel et indique si des octets de sortie du pont ont été
observés pour cette invocation. Si `speechOutputVerified` est faux et que
`speechOutputTimedOut` est vrai, le fournisseur en temps réel a peut-être accepté
l’énoncé, mais OpenClaw n’a pas vu de nouveaux octets de sortie atteindre le pont audio
Chrome.

Vérifiez aussi :

- Une clé de fournisseur en temps réel est disponible sur l’hôte Gateway, comme
  `OPENAI_API_KEY` ou `GEMINI_API_KEY`.
- `BlackHole 2ch` est visible sur l’hôte Chrome.
- `sox` existe sur l’hôte Chrome.
- Le microphone et le haut-parleur Meet sont routés via le chemin audio virtuel utilisé par
  OpenClaw.

`googlemeet doctor [session-id]` affiche la session, le nœud, l’état dans l’appel,
la raison d’action manuelle, la connexion au fournisseur en temps réel, `realtimeReady`, l’activité
d’entrée/sortie audio, les derniers horodatages audio, les compteurs d’octets, et l’URL du navigateur.
Utilisez `googlemeet status [session-id]` lorsque vous avez besoin du JSON brut. Utilisez
`googlemeet doctor --oauth` lorsque vous devez vérifier l’actualisation OAuth Google Meet
sans exposer les jetons ; ajoutez `--meeting` ou `--create-space` lorsque vous avez également besoin d’une
preuve Google Meet API.

Si un agent a expiré et que vous voyez déjà un onglet Meet ouvert, inspectez cet onglet
sans en ouvrir un autre :

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

L’action d’outil équivalente est `recover_current_tab`. Elle met au premier plan et inspecte un
onglet Meet existant pour le transport sélectionné. Avec `chrome`, elle utilise le contrôle
local du navigateur via le Gateway ; avec `chrome-node`, elle utilise le nœud Chrome configuré.
Elle n’ouvre pas de nouvel onglet et ne crée pas de nouvelle session ; elle signale le
blocage actuel, comme la connexion, l’admission, les autorisations, ou l’état de choix audio.
La commande CLI communique avec le Gateway configuré, donc le Gateway doit être en cours d’exécution ;
`chrome-node` nécessite également que le nœud Chrome soit connecté.

### Les vérifications de configuration Twilio échouent

`twilio-voice-call-plugin` échoue lorsque `voice-call` n’est pas autorisé ou n’est pas activé.
Ajoutez-le à `plugins.allow`, activez `plugins.entries.voice-call`, puis rechargez le
Gateway.

`twilio-voice-call-credentials` échoue lorsque le backend Twilio n’a pas de SID de
compte, de jeton d’authentification ou de numéro d’appelant. Définissez-les sur l’hôte du Gateway :

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Redémarrez ou rechargez ensuite le Gateway, puis exécutez :

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` vérifie uniquement l’état de préparation par défaut. Pour effectuer un essai à blanc avec un numéro précis :

```bash
openclaw voicecall smoke --to "+15555550123"
```

Ajoutez `--yes` uniquement lorsque vous voulez intentionnellement passer un véritable
appel de notification sortant :

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### L’appel Twilio démarre mais n’entre jamais dans la réunion

Vérifiez que l’événement Meet expose les informations de connexion téléphonique. Indiquez le numéro d’appel
et le code PIN exacts, ou une séquence DTMF personnalisée :

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Utilisez un `w` initial ou des virgules dans `--dtmf-sequence` si le fournisseur a besoin d’une pause
avant la saisie du code PIN.

## Remarques

L’API média officielle de Google Meet est orientée réception ; parler dans un appel Meet
nécessite donc toujours un chemin de participant. Ce Plugin rend cette limite explicite :
Chrome gère la participation par navigateur et le routage audio local ; Twilio gère
la participation par connexion téléphonique.

Le mode temps réel de Chrome nécessite `BlackHole 2ch` ainsi que l’un des éléments suivants :

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand` : OpenClaw possède le pont
  de modèle temps réel et transmet l’audio au format `chrome.audioFormat` entre ces
  commandes et le fournisseur de voix temps réel sélectionné. Le chemin Chrome par défaut est
  PCM16 24 kHz ; G.711 mu-law 8 kHz reste disponible pour les paires de commandes héritées.
- `chrome.audioBridgeCommand` : une commande de pont externe possède tout le chemin audio
  local et doit se terminer après avoir démarré ou validé son démon.

Pour un son duplex propre, routez la sortie Meet et le microphone Meet via des
appareils virtuels distincts ou un graphe d’appareils virtuels de type Loopback. Un seul appareil
BlackHole partagé peut renvoyer l’écho des autres participants dans l’appel.

`googlemeet speak` déclenche le pont audio temps réel actif pour une session Chrome.
`googlemeet leave` arrête ce pont. Pour les sessions Twilio déléguées via le Plugin Voice Call,
`leave` raccroche également l’appel vocal sous-jacent.

## Connexe

- [Plugin d’appel vocal](/fr/plugins/voice-call)
- [Mode conversation](/fr/nodes/talk)
- [Créer des Plugins](/fr/plugins/building-plugins)
