---
read_when:
    - Vous voulez qu’un agent OpenClaw rejoigne un appel Google Meet
    - Vous voulez qu’un agent OpenClaw crée un nouvel appel Google Meet
    - Vous configurez Chrome, Chrome node ou Twilio comme transport Google Meet
summary: 'Plugin Google Meet : rejoindre des URL Meet explicites via Chrome ou Twilio avec des valeurs par défaut vocales en temps réel'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-25T13:52:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3329ea25e94eb20403464d041cd34de731b7620deeac6b32248655e885cd3729
    source_path: plugins/google-meet.md
    workflow: 15
---

Prise en charge des participants Google Meet pour OpenClaw — le plugin est volontairement explicite :

- Il ne rejoint qu’une URL explicite `https://meet.google.com/...`.
- Il peut créer un nouvel espace Meet via l’API Google Meet, puis rejoindre l’URL
  renvoyée.
- La voix `realtime` est le mode par défaut.
- La voix en temps réel peut rappeler l’agent OpenClaw complet lorsque des
  raisonnements plus poussés ou des outils sont nécessaires.
- Les agents choisissent le comportement de jonction avec `mode` : utilisez `realtime` pour une
  écoute/réponse en direct, ou `transcribe` pour rejoindre/contrôler le navigateur sans le pont vocal
  en temps réel.
- L’authentification commence comme OAuth Google personnel ou comme profil Chrome déjà connecté.
- Il n’y a pas d’annonce automatique de consentement.
- Le backend audio Chrome par défaut est `BlackHole 2ch`.
- Chrome peut s’exécuter localement ou sur un hôte node appairé.
- Twilio accepte un numéro d’accès plus un code PIN ou une séquence DTMF facultatifs.
- La commande CLI est `googlemeet` ; `meet` est réservé à des workflows
  plus larges de téléconférence d’agent.

## Démarrage rapide

Installez les dépendances audio locales et configurez un fournisseur vocal backend
en temps réel. OpenAI est la valeur par défaut ; Google Gemini Live fonctionne aussi avec
`realtime.provider: "google"` :

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` installe le périphérique audio virtuel `BlackHole 2ch`. L’installateur
Homebrew nécessite un redémarrage avant que macOS n’expose le périphérique :

```bash
sudo reboot
```

Après redémarrage, vérifiez les deux éléments :

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
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

La sortie de configuration est destinée à être lisible par l’agent. Elle signale le profil Chrome,
le pont audio, l’épinglage de node, l’introduction différée du temps réel et, lorsque la délégation Twilio
est configurée, si le plugin `voice-call` et les identifiants Twilio sont prêts.
Traitez toute vérification `ok: false` comme bloquante avant de demander à un agent de rejoindre.
Utilisez `openclaw googlemeet setup --json` pour les scripts ou une sortie lisible par machine.

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

Créez une nouvelle réunion et rejoignez-la :

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Créez seulement l’URL sans rejoindre :

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` a deux chemins :

- Création API : utilisée lorsque les identifiants OAuth Google Meet sont configurés. C’est
  le chemin le plus déterministe et il ne dépend pas de l’état de l’UI du navigateur.
- Repli navigateur : utilisé lorsque les identifiants OAuth sont absents. OpenClaw utilise le
  Chrome node épinglé, ouvre `https://meet.google.com/new`, attend que Google redirige vers une
  véritable URL de code de réunion, puis renvoie cette URL. Ce chemin exige
  que le profil Chrome OpenClaw sur le node soit déjà connecté à Google.
  L’automatisation du navigateur gère la propre invite micro de premier lancement de Meet ; cette invite
  n’est pas traitée comme un échec de connexion Google.
  Les flux de jonction et de création essaient aussi de réutiliser un onglet Meet existant avant d’en ouvrir un
  nouveau. La correspondance ignore les paramètres de requête d’URL inoffensifs tels que `authuser`, afin qu’une
  nouvelle tentative d’agent focalise la réunion déjà ouverte au lieu de créer un second
  onglet Chrome.

La sortie de la commande/de l’outil inclut un champ `source` (`api` ou `browser`) afin que les agents
puissent expliquer quel chemin a été utilisé. `create` rejoint la nouvelle réunion par défaut et
renvoie `joined: true` plus la session de jonction. Pour seulement générer l’URL, utilisez
`create --no-join` dans la CLI ou passez `"join": false` à l’outil.

Ou dites à un agent : « Crée un Google Meet, rejoins-le avec la voix en temps réel, et envoie-
moi le lien. » L’agent doit appeler `google_meet` avec `action: "create"` puis
partager le `meetingUri` renvoyé.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Pour une jonction en observation seule/contrôle navigateur, définissez `"mode": "transcribe"`. Cela
ne démarre pas le pont de modèle temps réel duplex, donc il ne répondra pas oralement dans la
réunion.

Pendant les sessions en temps réel, le statut `google_meet` inclut l’état du navigateur et du pont audio,
comme `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, les derniers horodatages
d’entrée/sortie, les compteurs d’octets et l’état fermé du pont. Si une invite sûre de page Meet
apparaît, l’automatisation du navigateur la gère lorsqu’elle le peut. Les invites de connexion, d’admission par l’hôte et d’autorisations navigateur/OS sont signalées comme action manuelle avec une raison et
un message que l’agent doit relayer.

Chrome rejoint avec le profil Chrome connecté. Dans Meet, choisissez `BlackHole 2ch` pour le
chemin microphone/haut-parleur utilisé par OpenClaw. Pour un audio duplex propre, utilisez des
périphériques virtuels séparés ou un graphe de type Loopback ; un seul périphérique BlackHole suffit
pour un premier smoke test, mais peut produire de l’écho.

### Gateway local + Chrome Parallels

Vous n’avez **pas** besoin d’un Gateway OpenClaw complet ni d’une clé API modèle dans une VM macOS
juste pour faire porter Chrome par la VM. Exécutez le Gateway et l’agent localement, puis exécutez un
hôte node dans la VM. Activez une fois le plugin intégré dans la VM afin que le node
annonce la commande Chrome :

Ce qui s’exécute où :

- Hôte Gateway : Gateway OpenClaw, espace de travail agent, clés modèle/API, fournisseur
  en temps réel et configuration du plugin Google Meet.
- VM macOS Parallels : CLI/node host OpenClaw, Google Chrome, SoX, BlackHole 2ch,
  et un profil Chrome connecté à Google.
- Inutile dans la VM : service Gateway, configuration d’agent, clé OpenAI/GPT ou configuration de fournisseur de modèles.

Installez les dépendances de la VM :

```bash
brew install blackhole-2ch sox
```

Redémarrez la VM après l’installation de BlackHole pour que macOS expose `BlackHole 2ch` :

```bash
sudo reboot
```

Après redémarrage, vérifiez que la VM voit le périphérique audio et les commandes SoX :

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Installez ou mettez à jour OpenClaw dans la VM, puis activez-y le plugin intégré :

```bash
openclaw plugins enable google-meet
```

Démarrez l’hôte node dans la VM :

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Si `<gateway-host>` est une IP LAN et que vous n’utilisez pas TLS, le node refuse le
WebSocket en clair sauf si vous activez explicitement ce réseau privé de confiance :

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Utilisez la même variable d’environnement lors de l’installation du node comme LaunchAgent :

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` est une variable d’environnement de processus, pas
un paramètre `openclaw.json`. `openclaw node install` la stocke dans l’environnement du LaunchAgent
lorsqu’elle est présente sur la commande d’installation.

Approuvez le node depuis l’hôte Gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Confirmez que le Gateway voit le node et qu’il annonce à la fois `googlemeet.chrome`
et la capacité navigateur/`browser.proxy` :

```bash
openclaw nodes status
```

Acheminez Meet via ce node sur l’hôte Gateway :

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

Pour un smoke test en une seule commande qui crée ou réutilise une session, prononce une
phrase connue et affiche l’état de la session :

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Pendant la jonction, l’automatisation du navigateur OpenClaw remplit le nom invité, clique sur Rejoindre/Demander
à rejoindre, et accepte le choix « Utiliser le microphone » du premier lancement de Meet lorsque cette invite
apparaît. Pendant la création de réunion navigateur uniquement, elle peut aussi continuer au-delà de la
même invite sans microphone si Meet n’expose pas le bouton d’utilisation du microphone.
Si le profil navigateur n’est pas connecté, si Meet attend l’admission de l’hôte,
si Chrome a besoin des permissions microphone/caméra, ou si Meet est bloqué sur une
invite que l’automatisation n’a pas pu résoudre, le résultat join/test-speech signale
`manualActionRequired: true` avec `manualActionReason` et
`manualActionMessage`. Les agents doivent cesser de réessayer la jonction, signaler exactement
ce message ainsi que le `browserUrl`/`browserTitle` actuel, et ne réessayer qu’une fois l’action
manuelle du navigateur terminée.

Si `chromeNode.node` est omis, OpenClaw ne sélectionne automatiquement que lorsqu’un seul
node connecté annonce à la fois `googlemeet.chrome` et le contrôle du navigateur. Si
plusieurs nodes capables sont connectés, définissez `chromeNode.node` sur l’identifiant du node,
le nom d’affichage ou l’IP distante.

Vérifications d’échec courantes :

- `No connected Google Meet-capable node` : démarrez `openclaw node run` dans la VM,
  approuvez l’appairage, et assurez-vous que `openclaw plugins enable google-meet` et
  `openclaw plugins enable browser` ont été exécutés dans la VM. Confirmez aussi que l’hôte
  Gateway autorise les deux commandes de node avec
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found on the node` : installez `blackhole-2ch`
  dans la VM et redémarrez la VM.
- Chrome s’ouvre mais ne peut pas rejoindre : connectez-vous au profil navigateur dans la VM, ou
  gardez `chrome.guestName` défini pour une jonction invité. L’auto-jonction invité utilise l’automatisation
  navigateur OpenClaw via le proxy navigateur du node ; assurez-vous que la configuration du navigateur du node
  pointe vers le profil souhaité, par exemple
  `browser.defaultProfile: "user"` ou un profil de session existant nommé.
- Onglets Meet dupliqués : laissez `chrome.reuseExistingTab: true` activé. OpenClaw
  active un onglet existant pour la même URL Meet avant d’en ouvrir un nouveau, et la
  création de réunion navigateur réutilise un onglet `https://meet.google.com/new`
  en cours ou un onglet d’invite de compte Google avant d’en ouvrir un autre.
- Pas d’audio : dans Meet, acheminez le microphone/haut-parleur via le chemin de périphérique audio virtuel
  utilisé par OpenClaw ; utilisez des périphériques virtuels séparés ou un routage de type Loopback
  pour un duplex propre.

## Notes d’installation

La valeur par défaut temps réel Chrome utilise deux outils externes :

- `sox` : utilitaire audio en ligne de commande. Le plugin utilise ses commandes `rec` et `play`
  pour le pont audio G.711 mu-law 8 kHz par défaut.
- `blackhole-2ch` : pilote audio virtuel macOS. Il crée le périphérique audio `BlackHole 2ch`
  que Chrome/Meet peut utiliser.

OpenClaw n’intègre ni ne redistribue aucun de ces deux packages. La documentation demande aux utilisateurs
de les installer comme dépendances hôte via Homebrew. SoX est sous licence
`LGPL-2.0-only AND GPL-2.0-only` ; BlackHole est sous GPL-3.0. Si vous construisez un
installateur ou une appliance qui intègre BlackHole avec OpenClaw, examinez les
conditions de licence amont de BlackHole ou obtenez une licence séparée auprès de Existential Audio.

## Transports

### Chrome

Le transport Chrome ouvre l’URL Meet dans Google Chrome et rejoint avec le profil Chrome
connecté. Sur macOS, le plugin vérifie la présence de `BlackHole 2ch` avant le lancement.
Si configuré, il exécute aussi une commande d’état du pont audio et une commande de démarrage
avant d’ouvrir Chrome. Utilisez `chrome` lorsque Chrome/audio vivent sur l’hôte Gateway ;
utilisez `chrome-node` lorsque Chrome/audio vivent sur un node appairé tel qu’une VM
macOS Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Acheminez l’audio du microphone et du haut-parleur Chrome via le pont audio local OpenClaw.
Si `BlackHole 2ch` n’est pas installé, la jonction échoue avec une erreur de configuration
au lieu de rejoindre silencieusement sans chemin audio.

### Twilio

Le transport Twilio est un plan d’appel strict délégué au plugin Voice Call. Il
n’analyse pas les pages Meet pour en extraire des numéros de téléphone.

Utilisez-le lorsque la participation via Chrome n’est pas disponible ou si vous voulez une solution de repli par appel téléphonique. Google Meet doit exposer un numéro d’accès téléphonique et un code PIN pour la
réunion ; OpenClaw ne les découvre pas à partir de la page Meet.

Activez le plugin Voice Call sur l’hôte Gateway, pas sur le Chrome node :

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // ou définissez "twilio" si Twilio doit être la valeur par défaut
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

Fournissez les identifiants Twilio via l’environnement ou la configuration. L’environnement évite de stocker
les secrets dans `openclaw.json` :

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

Lorsque la délégation Twilio est correctement câblée, `googlemeet setup` inclut des vérifications réussies
`twilio-voice-call-plugin` et `twilio-voice-call-credentials`.

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

## OAuth et preflight

OAuth est facultatif pour créer un lien Meet, car `googlemeet create` peut revenir
à l’automatisation du navigateur. Configurez OAuth lorsque vous voulez la création API officielle,
la résolution d’espace, ou les vérifications preflight de l’API Meet Media.

L’accès à l’API Google Meet utilise l’OAuth utilisateur : créez un client OAuth Google Cloud,
demandez les portées requises, autorisez un compte Google, puis stockez le
refresh token résultant dans la configuration du plugin Google Meet ou fournissez les
variables d’environnement `OPENCLAW_GOOGLE_MEET_*`.

OAuth ne remplace pas le chemin de jonction Chrome. Les transports Chrome et Chrome-node
rejoignent toujours via un profil Chrome connecté, BlackHole/SoX, et un node connecté
lorsque vous utilisez la participation par navigateur. OAuth ne sert qu’au chemin officiel de l’API Google
Meet : créer des espaces de réunion, résoudre des espaces, et exécuter les vérifications preflight de l’API Meet Media.

### Créer les identifiants Google

Dans Google Cloud Console :

1. Créez ou sélectionnez un projet Google Cloud.
2. Activez la **Google Meet REST API** pour ce projet.
3. Configurez l’écran de consentement OAuth.
   - **Internal** est le plus simple pour une organisation Google Workspace.
   - **External** fonctionne pour les configurations personnelles/de test ; tant que l’application est en mode Testing,
     ajoutez chaque compte Google qui autorisera l’application comme utilisateur de test.
4. Ajoutez les portées demandées par OpenClaw :
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Créez un identifiant client OAuth.
   - Type d’application : **Web application**.
   - URI de redirection autorisé :

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Copiez l’identifiant client et le secret client.

`meetings.space.created` est requis par Google Meet `spaces.create`.
`meetings.space.readonly` permet à OpenClaw de résoudre les URL/codes Meet en espaces.
`meetings.conference.media.readonly` sert au preflight de l’API Meet Media et au travail sur les médias ;
Google peut exiger une inscription Developer Preview pour l’usage réel de l’API Media.
Si vous n’avez besoin que des jonctions Chrome basées sur le navigateur, ignorez complètement OAuth.

### Générer le refresh token

Configurez `oauth.clientId` et éventuellement `oauth.clientSecret`, ou passez-les comme
variables d’environnement, puis exécutez :

```bash
openclaw googlemeet auth login --json
```

La commande affiche un bloc de configuration `oauth` avec un refresh token. Elle utilise PKCE,
un callback localhost sur `http://localhost:8085/oauth2callback`, et un flux manuel
de copier/coller avec `--manual`.

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

Préférez les variables d’environnement lorsque vous ne voulez pas stocker le refresh token dans la configuration.
Si des valeurs de configuration et d’environnement sont toutes deux présentes, le plugin résout la configuration
en premier, puis utilise l’environnement comme solution de repli.

Le consentement OAuth inclut la création d’espaces Meet, l’accès en lecture aux espaces Meet, et l’accès en lecture aux médias de conférence Meet. Si vous vous êtes authentifié avant que la prise en charge de la création de réunions
n’existe, relancez `openclaw googlemeet auth login --json` afin que le refresh
token dispose de la portée `meetings.space.created`.

### Vérifier OAuth avec doctor

Exécutez le doctor OAuth lorsque vous voulez une vérification rapide de l’état, sans secrets :

```bash
openclaw googlemeet doctor --oauth --json
```

Cela ne charge pas le runtime Chrome et ne nécessite pas de Chrome node connecté. Cela
vérifie que la configuration OAuth existe et que le refresh token peut générer un access
token. Le rapport JSON inclut uniquement des champs d’état tels que `ok`, `configured`,
`tokenSource`, `expiresAt`, et des messages de vérification ; il n’affiche pas l’access
token, le refresh token ni le secret client.

Résultats courants :

| Vérification          | Signification                                                                          |
| --------------------- | -------------------------------------------------------------------------------------- |
| `oauth-config`        | `oauth.clientId` plus `oauth.refreshToken`, ou un access token en cache, est présent. |
| `oauth-token`         | L’access token en cache est toujours valide, ou le refresh token en a généré un nouveau. |
| `meet-spaces-get`     | La vérification facultative `--meeting` a résolu un espace Meet existant.             |
| `meet-spaces-create`  | La vérification facultative `--create-space` a créé un nouvel espace Meet.            |

Pour prouver aussi l’activation de l’API Google Meet et la portée `spaces.create`, exécutez la
vérification de création avec effet de bord :

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` crée une URL Meet jetable. Utilisez-le lorsque vous devez confirmer
que le projet Google Cloud a bien l’API Meet activée et que le compte autorisé
dispose de la portée `meetings.space.created`.

Pour prouver l’accès en lecture à un espace de réunion existant :

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` et `resolve-space` prouvent l’accès en lecture à un espace existant
auquel le compte Google autorisé peut accéder. Un `403` à ces vérifications
signifie généralement que la Google Meet REST API est désactivée, que le refresh token consenti
n’a pas la portée requise, ou que le compte Google n’a pas accès à cet espace Meet. Une erreur de refresh token signifie qu’il faut relancer `openclaw googlemeet auth login
--json` et stocker le nouveau bloc `oauth`.

Aucun identifiant OAuth n’est nécessaire pour le repli navigateur. Dans ce mode, l’auth Google
provient du profil Chrome connecté sur le node sélectionné, et non de la configuration
OpenClaw.

Ces variables d’environnement sont acceptées comme solutions de repli :

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` ou `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` ou `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` ou `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` ou `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` ou
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` ou `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` ou `GOOGLE_MEET_PREVIEW_ACK`

Résoudre une URL Meet, un code, ou `spaces/{id}` via `spaces.get` :

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Exécuter preflight avant le travail sur les médias :

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Lister les artefacts de réunion et la présence après que Meet a créé les conference records :

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Avec `--meeting`, `artifacts` et `attendance` utilisent le dernier conference record
par défaut. Passez `--all-conference-records` lorsque vous voulez chaque enregistrement conservé
pour cette réunion.

La recherche Calendar peut résoudre l’URL de la réunion à partir de Google Calendar avant de lire
les artefacts Meet :

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` recherche dans le calendrier `primary` du jour un événement Calendar contenant un
lien Google Meet. Utilisez `--event <query>` pour rechercher un texte d’événement correspondant, et
`--calendar <id>` pour un calendrier non principal. La recherche Calendar exige une nouvelle connexion
OAuth incluant la portée Calendar events readonly.
`calendar-events` prévisualise les événements Meet correspondants et marque l’événement que
`latest`, `artifacts`, `attendance`, ou `export` choisira.

Si vous connaissez déjà l’identifiant du conference record, adressez-le directement :

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

`artifacts` renvoie les métadonnées du conference record ainsi que les métadonnées des ressources de participants, d’enregistrements,
de transcriptions, d’entrées de transcription structurées et de smart notes lorsque
Google les expose pour la réunion. Utilisez `--no-transcript-entries` pour ignorer la
récupération des entrées sur les grandes réunions. `attendance` développe les participants en
lignes de session de participant avec heures de première/dernière présence, durée totale de session,
indicateurs de retard/de départ anticipé, et ressources participantes dupliquées fusionnées par utilisateur
connecté ou nom d’affichage. Passez `--no-merge-duplicates` pour conserver séparées les
ressources participantes brutes, `--late-after-minutes` pour ajuster la détection des retards,
et `--early-before-minutes` pour ajuster la détection des départs anticipés.

`export` écrit un dossier contenant `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` et `manifest.json`.
`manifest.json` enregistre l’entrée choisie, les options d’export, les conference records,
les fichiers de sortie, les comptes, la source du token, l’événement Calendar lorsqu’un tel événement a été utilisé,
et tout avertissement de récupération partielle. Passez `--zip` pour écrire aussi une archive portable à côté
du dossier. Passez `--include-doc-bodies` pour exporter le texte des Google Docs liés de transcription
et de smart notes via Google Drive `files.export` ; cela nécessite une nouvelle
connexion OAuth incluant la portée Drive Meet readonly. Sans
`--include-doc-bodies`, les exports incluent uniquement les métadonnées Meet et les
entrées de transcription structurées. Si Google renvoie un échec partiel d’artefact, tel qu’une erreur de liste de smart notes,
d’entrée de transcription ou de corps de document Drive, le résumé et le
manifeste conservent l’avertissement au lieu de faire échouer tout l’export.
Utilisez `--dry-run` pour récupérer les mêmes données d’artefacts/de présence et afficher le
JSON du manifeste sans créer le dossier ni le ZIP. C’est utile avant d’écrire
un export volumineux ou lorsqu’un agent n’a besoin que des comptes, des enregistrements sélectionnés et
des avertissements.

Les agents peuvent aussi créer le même bundle via l’outil `google_meet` :

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Définissez `"dryRun": true` pour ne renvoyer que le manifeste d’export et ignorer les écritures de fichiers.

Exécutez le smoke live protégé contre une vraie réunion conservée :

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Environnement du smoke live :

- `OPENCLAW_LIVE_TEST=1` active les tests live protégés.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` pointe vers une URL Meet, un code, ou
  `spaces/{id}` conservé.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` ou `GOOGLE_MEET_CLIENT_ID` fournit l’identifiant
  client OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` ou `GOOGLE_MEET_REFRESH_TOKEN` fournit
  le refresh token.
- Facultatif : `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, et
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` utilisent les mêmes noms de repli
  sans le préfixe `OPENCLAW_`.

Le smoke live de base artefact/présence nécessite
`https://www.googleapis.com/auth/meetings.space.readonly` et
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. La
recherche Calendar nécessite `https://www.googleapis.com/auth/calendar.events.readonly`. L’export
des corps de document Drive nécessite
`https://www.googleapis.com/auth/drive.meet.readonly`.

Créer un nouvel espace Meet :

```bash
openclaw googlemeet create
```

La commande affiche le nouveau `meeting uri`, la source et la session de jonction. Avec des identifiants
OAuth, elle utilise l’API officielle Google Meet. Sans identifiants OAuth, elle
utilise comme repli le profil navigateur connecté du Chrome node épinglé. Les agents peuvent
utiliser l’outil `google_meet` avec `action: "create"` pour créer et rejoindre en une
étape. Pour une création d’URL uniquement, passez `"join": false`.

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

Si le repli navigateur rencontre une connexion Google ou un blocage de permission Meet avant de
pouvoir créer l’URL, la méthode Gateway renvoie une réponse en échec et l’outil
`google_meet` renvoie des détails structurés au lieu d’une simple chaîne :

```json
{
  "source": "browser",
  "error": "google-login-required: Connectez-vous à Google dans le profil navigateur OpenClaw, puis réessayez la création de réunion.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Connectez-vous à Google dans le profil navigateur OpenClaw, puis réessayez la création de réunion.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

Lorsqu’un agent voit `manualActionRequired: true`, il doit signaler le
`manualActionMessage` ainsi que le contexte node/onglet du navigateur et cesser d’ouvrir de nouveaux
onglets Meet jusqu’à ce que l’opérateur termine l’étape navigateur.

Exemple de sortie JSON de création API :

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

La création d’un Meet rejoint par défaut. Le transport Chrome ou Chrome-node
a toujours besoin d’un profil Google Chrome connecté pour rejoindre via le navigateur. Si le
profil est déconnecté, OpenClaw signale `manualActionRequired: true` ou une
erreur de repli navigateur et demande à l’opérateur de terminer la connexion Google avant
de réessayer.

Définissez `preview.enrollmentAcknowledged: true` uniquement après avoir confirmé que votre projet
Cloud, le principal OAuth et les participants de la réunion sont inscrits au Google
Workspace Developer Preview Program pour les API média Meet.

## Configuration

Le chemin Chrome en temps réel courant ne nécessite que le plugin activé, BlackHole, SoX,
et une clé de fournisseur vocal backend en temps réel. OpenAI est la valeur par défaut ; définissez
`realtime.provider: "google"` pour utiliser Google Gemini Live :

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
- `defaultMode: "realtime"`
- `chromeNode.node` : identifiant/nom/IP de node facultatif pour `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"` : nom utilisé sur l’écran invité Meet
  déconnecté
- `chrome.autoJoin: true` : remplissage best-effort du nom invité et clic sur Join Now
  via l’automatisation navigateur OpenClaw sur `chrome-node`
- `chrome.reuseExistingTab: true` : activer un onglet Meet existant au lieu
  d’ouvrir des doublons
- `chrome.waitForInCallMs: 20000` : attendre que l’onglet Meet signale l’état in-call
  avant de déclencher l’introduction temps réel
- `chrome.audioInputCommand` : commande SoX `rec` écrivant de l’audio G.711 mu-law
  8 kHz sur stdout
- `chrome.audioOutputCommand` : commande SoX `play` lisant de l’audio G.711 mu-law
  8 kHz depuis stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions` : réponses parlées brèves, avec
  `openclaw_agent_consult` pour les réponses plus approfondies
- `realtime.introMessage` : courte vérification de disponibilité parlée lorsque le pont temps réel
  se connecte ; définissez-la sur `""` pour rejoindre silencieusement

Remplacements facultatifs :

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
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
l’appel PSTN et le DTMF réels au plugin Voice Call. Si `voice-call` n’est pas
activé, Google Meet peut toujours valider et enregistrer le plan d’appel, mais il ne peut
pas passer l’appel Twilio.

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
`transport: "chrome-node"` lorsque Chrome s’exécute sur un node appairé tel qu’une VM
Parallels. Dans les deux cas, le modèle temps réel et `openclaw_agent_consult` s’exécutent sur l’hôte
Gateway, de sorte que les identifiants du modèle y restent.

Utilisez `action: "status"` pour lister les sessions actives ou inspecter un identifiant de session. Utilisez
`action: "speak"` avec `sessionId` et `message` pour faire parler immédiatement l’agent
temps réel. Utilisez `action: "test_speech"` pour créer ou réutiliser la session,
déclencher une phrase connue, et renvoyer l’état `inCall` lorsque l’hôte Chrome peut
le signaler. Utilisez `action: "leave"` pour marquer une session comme terminée.

`status` inclut l’état Chrome lorsque disponible :

- `inCall` : Chrome semble être à l’intérieur de l’appel Meet
- `micMuted` : état best-effort du microphone Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage` : le
  profil navigateur nécessite une connexion manuelle, une admission par l’hôte Meet, des permissions, ou
  une réparation du contrôle navigateur avant que la parole puisse fonctionner
- `providerConnected` / `realtimeReady` : état du pont vocal temps réel
- `lastInputAt` / `lastOutputAt` : dernier audio vu depuis ou envoyé au pont

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Consultation d’agent en temps réel

Le mode temps réel Chrome est optimisé pour une boucle vocale live. Le fournisseur vocal
temps réel entend l’audio de la réunion et parle via le pont audio configuré.
Lorsque le modèle temps réel a besoin d’un raisonnement plus poussé, d’informations actuelles, ou des outils OpenClaw normaux, il peut appeler `openclaw_agent_consult`.

L’outil de consultation exécute l’agent OpenClaw habituel en arrière-plan avec le contexte récent de transcription de la réunion et renvoie une réponse parlée concise à la session vocale temps réel. Le modèle vocal peut ensuite prononcer cette réponse dans la réunion.
Il utilise le même outil partagé de consultation temps réel que Voice Call.

`realtime.toolPolicy` contrôle l’exécution de consultation :

- `safe-read-only` : expose l’outil de consultation et limite l’agent normal à
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, et
  `memory_get`.
- `owner` : expose l’outil de consultation et laisse l’agent normal utiliser la politique
  d’outils normale de l’agent.
- `none` : n’expose pas l’outil de consultation au modèle vocal temps réel.

La clé de session de consultation est limitée à chaque session Meet, de sorte que les appels de consultation ultérieurs
peuvent réutiliser le contexte de consultation antérieur pendant la même réunion.

Pour forcer une vérification de disponibilité parlée après que Chrome a complètement rejoint l’appel :

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Pour le smoke complet join-and-speak :

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Checklist de test live

Utilisez cette séquence avant de confier une réunion à un agent sans supervision :

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

État attendu pour Chrome-node :

- `googlemeet setup` est entièrement au vert.
- `googlemeet setup` inclut `chrome-node-connected` lorsque `chrome-node` est le
  transport par défaut ou lorsqu’un node est épinglé.
- `nodes status` montre que le node sélectionné est connecté.
- Le node sélectionné annonce à la fois `googlemeet.chrome` et `browser.proxy`.
- L’onglet Meet rejoint l’appel et `test-speech` renvoie l’état Chrome avec
  `inCall: true`.

Pour un hôte Chrome distant tel qu’une VM macOS Parallels, voici la vérification sûre
la plus courte après une mise à jour du Gateway ou de la VM :

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Cela prouve que le plugin Gateway est chargé, que le node VM est connecté avec le
token actuel, et que le pont audio Meet est disponible avant qu’un agent n’ouvre un véritable onglet de réunion.

Pour un smoke Twilio, utilisez une réunion qui expose les détails d’accès téléphonique :

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

État attendu pour Twilio :

- `googlemeet setup` inclut les vérifications vertes `twilio-voice-call-plugin` et
  `twilio-voice-call-credentials`.
- `voicecall` est disponible dans la CLI après rechargement du Gateway.
- La session renvoyée a `transport: "twilio"` et un `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` raccroche l’appel vocal délégué.

## Dépannage

### L’agent ne voit pas l’outil Google Meet

Confirmez que le plugin est activé dans la configuration du Gateway et rechargez le Gateway :

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Si vous venez de modifier `plugins.entries.google-meet`, redémarrez ou rechargez le Gateway.
L’agent en cours d’exécution ne voit que les outils de plugin enregistrés par le
processus Gateway actuel.

### Aucun node compatible Google Meet connecté

Sur l’hôte node, exécutez :

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Sur l’hôte Gateway, approuvez le node et vérifiez les commandes :

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Le node doit être connecté et lister `googlemeet.chrome` plus `browser.proxy`.
La configuration du Gateway doit autoriser ces commandes de node :

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
`gateway token mismatch`, réinstallez ou redémarrez le node avec le token Gateway actuel. Pour un Gateway LAN, cela signifie généralement :

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Rechargez ensuite le service node et réexécutez :

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Le navigateur s’ouvre mais l’agent ne peut pas rejoindre

Exécutez `googlemeet test-speech` et inspectez l’état Chrome renvoyé. S’il
signale `manualActionRequired: true`, affichez `manualActionMessage` à l’opérateur
et cessez de réessayer jusqu’à ce que l’action navigateur soit terminée.

Actions manuelles courantes :

- Se connecter au profil Chrome.
- Admettre l’invité depuis le compte hôte Meet.
- Accorder à Chrome les permissions microphone/caméra lorsque l’invite native
  de permission Chrome apparaît.
- Fermer ou réparer une boîte de dialogue de permission Meet bloquée.

Ne signalez pas « non connecté » simplement parce que Meet affiche « Do you want people to
hear you in the meeting? ». C’est l’interstitiel de choix audio de Meet ; OpenClaw
clique sur **Use microphone** via l’automatisation du navigateur lorsqu’elle est disponible et continue d’attendre l’état réel de la réunion. Pour le repli navigateur en création uniquement, OpenClaw
peut cliquer sur **Continue without microphone** car la création de l’URL n’a pas besoin
du chemin audio en temps réel.

### La création de réunion échoue

`googlemeet create` utilise d’abord l’endpoint Google Meet API `spaces.create`
lorsque des identifiants OAuth sont configurés. Sans identifiants OAuth, il revient
au navigateur du Chrome node épinglé. Confirmez :

- Pour la création API : `oauth.clientId` et `oauth.refreshToken` sont configurés,
  ou des variables d’environnement `OPENCLAW_GOOGLE_MEET_*` correspondantes sont présentes.
- Pour la création API : le refresh token a été généré après l’ajout de la prise en charge
  de la création. Les anciens tokens peuvent manquer de la portée `meetings.space.created` ; relancez
  `openclaw googlemeet auth login --json` et mettez à jour la configuration du plugin.
- Pour le repli navigateur : `defaultTransport: "chrome-node"` et
  `chromeNode.node` pointent vers un node connecté avec `browser.proxy` et
  `googlemeet.chrome`.
- Pour le repli navigateur : le profil Chrome OpenClaw sur ce node est connecté
  à Google et peut ouvrir `https://meet.google.com/new`.
- Pour le repli navigateur : les nouvelles tentatives réutilisent un onglet existant `https://meet.google.com/new`
  ou un onglet d’invite de compte Google avant d’en ouvrir un nouveau. Si un agent expire,
  relancez l’appel d’outil au lieu d’ouvrir manuellement un autre onglet Meet.
- Pour le repli navigateur : si l’outil renvoie `manualActionRequired: true`, utilisez
  les champs renvoyés `browser.nodeId`, `browser.targetId`, `browserUrl`, et
  `manualActionMessage` pour guider l’opérateur. Ne réessayez pas en boucle tant que cette
  action n’est pas terminée.
- Pour le repli navigateur : si Meet affiche « Do you want people to hear you in the
  meeting? », laissez l’onglet ouvert. OpenClaw devrait cliquer sur **Use microphone** ou, pour
  le repli création uniquement, sur **Continue without microphone** via l’automatisation
  du navigateur et continuer à attendre l’URL Meet générée. S’il n’y parvient pas, l’erreur doit mentionner `meet-audio-choice-required`, et non `google-login-required`.

### L’agent rejoint mais ne parle pas

Vérifiez le chemin temps réel :

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Utilisez `mode: "realtime"` pour écouter/répondre oralement. `mode: "transcribe"` ne
démarre volontairement pas le pont vocal duplex en temps réel.

Vérifiez aussi :

- Une clé de fournisseur en temps réel est disponible sur l’hôte Gateway, telle que
  `OPENAI_API_KEY` ou `GEMINI_API_KEY`.
- `BlackHole 2ch` est visible sur l’hôte Chrome.
- `rec` et `play` existent sur l’hôte Chrome.
- Le microphone et le haut-parleur Meet sont routés via le chemin audio virtuel utilisé par
  OpenClaw.

`googlemeet doctor [session-id]` affiche la session, le node, l’état in-call,
la raison de l’action manuelle, la connexion du fournisseur temps réel, `realtimeReady`, l’activité audio
entrée/sortie, les derniers horodatages audio, les compteurs d’octets et l’URL du navigateur.
Utilisez `googlemeet status [session-id]` lorsque vous avez besoin du JSON brut. Utilisez
`googlemeet doctor --oauth` lorsque vous devez vérifier le refresh OAuth Google Meet
sans exposer de tokens ; ajoutez `--meeting` ou `--create-space` lorsque vous avez aussi besoin d’une preuve API Google Meet.

Si un agent a expiré et que vous voyez déjà un onglet Meet ouvert, inspectez cet onglet
sans en ouvrir un autre :

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

L’action d’outil équivalente est `recover_current_tab`. Elle focalise et inspecte un
onglet Meet existant sur le Chrome node configuré. Elle n’ouvre pas de nouvel onglet ni ne crée de nouvelle session ; elle signale le blocage actuel, comme la connexion, l’admission,
les permissions, ou l’état de choix audio. La commande CLI parle au Gateway configuré,
donc le Gateway doit être en cours d’exécution et le Chrome node doit être connecté.

### Les vérifications de configuration Twilio échouent

`twilio-voice-call-plugin` échoue lorsque `voice-call` n’est pas autorisé ou n’est pas activé.
Ajoutez-le à `plugins.allow`, activez `plugins.entries.voice-call`, puis rechargez le
Gateway.

`twilio-voice-call-credentials` échoue lorsque le backend Twilio n’a pas de SID de compte,
de jeton d’authentification ou de numéro appelant. Définissez-les sur l’hôte Gateway :

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Redémarrez ou rechargez ensuite le Gateway puis exécutez :

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` ne vérifie par défaut que la disponibilité. Pour faire un dry-run d’un numéro spécifique :

```bash
openclaw voicecall smoke --to "+15555550123"
```

N’ajoutez `--yes` que si vous voulez intentionnellement passer un véritable appel
sortant de notification :

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### L’appel Twilio démarre mais n’entre jamais dans la réunion

Confirmez que l’événement Meet expose les détails d’accès téléphonique. Passez exactement le
numéro d’accès et le code PIN ou une séquence DTMF personnalisée :

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Utilisez des `w` initiaux ou des virgules dans `--dtmf-sequence` si le fournisseur a besoin d’une pause
avant la saisie du code PIN.

## Remarques

L’API média officielle de Google Meet est orientée réception, donc parler dans un
appel Meet nécessite toujours un chemin de participant. Ce plugin maintient cette limite visible :
Chrome gère la participation navigateur et le routage audio local ; Twilio gère
la participation par appel téléphonique.

Le mode temps réel Chrome nécessite soit :

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand` : OpenClaw gère le
  pont de modèle en temps réel et fait passer l’audio G.711 mu-law 8 kHz entre ces
  commandes et le fournisseur vocal temps réel sélectionné.
- `chrome.audioBridgeCommand` : une commande de pont externe gère tout le chemin audio local
  et doit se terminer après avoir démarré ou validé son daemon.

Pour un audio duplex propre, acheminez la sortie Meet et le microphone Meet via des
périphériques virtuels séparés ou un graphe de périphérique virtuel de type Loopback. Un
seul périphérique BlackHole partagé peut réinjecter l’écho des autres participants dans l’appel.

`googlemeet speak` déclenche le pont audio temps réel actif pour une session
Chrome. `googlemeet leave` arrête ce pont. Pour les sessions Twilio déléguées
via le plugin Voice Call, `leave` raccroche aussi l’appel vocal sous-jacent.

## Connexes

- [Plugin Voice Call](/fr/plugins/voice-call)
- [Mode Talk](/fr/nodes/talk)
- [Créer des plugins](/fr/plugins/building-plugins)
