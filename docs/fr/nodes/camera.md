---
read_when:
    - Ajout ou modification de la capture caméra sur les nœuds iOS/Android ou macOS
    - Étendre les flux de travail de fichiers temporaires MEDIA accessibles aux agents
summary: 'Capture caméra (nœuds iOS/Android + application macOS) à l’usage de l’agent : photos (jpg) et courts clips vidéo (mp4)'
title: Capture par caméra
x-i18n:
    generated_at: "2026-05-06T07:30:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 226b9f44e8d56b9b366d679c6c2f974c714afc4cb962afddba89d17dcdfc09eb
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw prend en charge la **capture par caméra** pour les workflows d’agent :

- **nœud iOS** (associé via Gateway) : capturer une **photo** (`jpg`) ou un **court clip vidéo** (`mp4`, avec audio facultatif) via `node.invoke`.
- **nœud Android** (associé via Gateway) : capturer une **photo** (`jpg`) ou un **court clip vidéo** (`mp4`, avec audio facultatif) via `node.invoke`.
- **app macOS** (nœud via Gateway) : capturer une **photo** (`jpg`) ou un **court clip vidéo** (`mp4`, avec audio facultatif) via `node.invoke`.

Tout accès à la caméra est protégé par des **paramètres contrôlés par l’utilisateur**.

## Nœud iOS

### Paramètre utilisateur (activé par défaut)

- Onglet Réglages iOS → **Caméra** → **Autoriser la caméra** (`camera.enabled`)
  - Par défaut : **activé** (une clé manquante est considérée comme activée).
  - Si désactivé : les commandes `camera.*` renvoient `CAMERA_DISABLED`.

### Commandes (via Gateway `node.invoke`)

- `camera.list`
  - Charge utile de réponse :
    - `devices` : tableau de `{ id, name, position, deviceType }`

- `camera.snap`
  - Paramètres :
    - `facing` : `front|back` (par défaut : `front`)
    - `maxWidth` : nombre (facultatif ; par défaut `1600` sur le nœud iOS)
    - `quality` : `0..1` (facultatif ; par défaut `0.9`)
    - `format` : actuellement `jpg`
    - `delayMs` : nombre (facultatif ; par défaut `0`)
    - `deviceId` : chaîne (facultatif ; depuis `camera.list`)
  - Charge utile de réponse :
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Protection de la charge utile : les photos sont recompressées pour maintenir la charge utile base64 sous 5 Mo.

- `camera.clip`
  - Paramètres :
    - `facing` : `front|back` (par défaut : `front`)
    - `durationMs` : nombre (par défaut `3000`, limité à un maximum de `60000`)
    - `includeAudio` : booléen (par défaut `true`)
    - `format` : actuellement `mp4`
    - `deviceId` : chaîne (facultatif ; depuis `camera.list`)
  - Charge utile de réponse :
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Exigence de premier plan

Comme `canvas.*`, le nœud iOS n’autorise les commandes `camera.*` qu’au **premier plan**. Les invocations en arrière-plan renvoient `NODE_BACKGROUND_UNAVAILABLE`.

### Assistant CLI (fichiers temporaires + MEDIA)

Le moyen le plus simple d’obtenir des pièces jointes est d’utiliser l’assistant CLI, qui écrit le média décodé dans un fichier temporaire et affiche `MEDIA:<path>`.

Exemples :

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Notes :

- `nodes camera snap` utilise par défaut les **deux** orientations afin de fournir à l’agent les deux vues.
- Les fichiers de sortie sont temporaires (dans le répertoire temporaire de l’OS), sauf si vous créez votre propre wrapper.

## Nœud Android

### Paramètre utilisateur Android (activé par défaut)

- Feuille Réglages Android → **Caméra** → **Autoriser la caméra** (`camera.enabled`)
  - Par défaut : **activé** (une clé manquante est considérée comme activée).
  - Si désactivé : les commandes `camera.*` renvoient `CAMERA_DISABLED`.

### Autorisations

- Android nécessite des autorisations d’exécution :
  - `CAMERA` pour `camera.snap` et `camera.clip`.
  - `RECORD_AUDIO` pour `camera.clip` lorsque `includeAudio=true`.

Si des autorisations sont manquantes, l’app affichera une invite lorsque possible ; si elles sont refusées, les requêtes `camera.*` échouent avec une erreur
`*_PERMISSION_REQUIRED`.

### Exigence de premier plan Android

Comme `canvas.*`, le nœud Android n’autorise les commandes `camera.*` qu’au **premier plan**. Les invocations en arrière-plan renvoient `NODE_BACKGROUND_UNAVAILABLE`.

### Commandes Android (via Gateway `node.invoke`)

- `camera.list`
  - Charge utile de réponse :
    - `devices` : tableau de `{ id, name, position, deviceType }`

### Protection de la charge utile

Les photos sont recompressées pour maintenir la charge utile base64 sous 5 Mo.

## App macOS

### Paramètre utilisateur (désactivé par défaut)

L’app compagnon macOS expose une case à cocher :

- **Réglages → Général → Autoriser la caméra** (`openclaw.cameraEnabled`)
  - Par défaut : **désactivé**
  - Si désactivé : les requêtes de caméra renvoient « Caméra désactivée par l’utilisateur ».

### Assistant CLI (invocation de nœud)

Utilisez la CLI principale `openclaw` pour invoquer les commandes de caméra sur le nœud macOS.

Exemples :

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints MEDIA:<path> (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

Notes :

- `openclaw nodes camera snap` utilise par défaut `maxWidth=1600`, sauf remplacement.
- Sur macOS, `camera.snap` attend `delayMs` (2000 ms par défaut) après le préchauffage/la stabilisation de l’exposition avant de capturer.
- Les charges utiles photo sont recompressées pour maintenir le base64 sous 5 Mo.

## Sécurité + limites pratiques

- L’accès à la caméra et au microphone déclenche les invites d’autorisation habituelles de l’OS (et nécessite des chaînes d’utilisation dans Info.plist).
- Les clips vidéo sont plafonnés (actuellement `<= 60s`) pour éviter des charges utiles de nœud trop volumineuses (surcoût base64 + limites des messages).

## Vidéo d’écran macOS (niveau OS)

Pour une vidéo d’_écran_ (pas de caméra), utilisez le compagnon macOS :

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints MEDIA:<path>
```

Notes :

- Nécessite l’autorisation macOS **Enregistrement de l’écran** (TCC).

## Connexe

- [Prise en charge des images et médias](/fr/nodes/images)
- [Compréhension des médias](/fr/nodes/media-understanding)
- [Commande de localisation](/fr/nodes/location-command)
