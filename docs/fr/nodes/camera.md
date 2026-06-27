---
read_when:
    - Ajout ou modification de la capture caméra sur les nœuds iOS/Android ou macOS
    - Extension des workflows de fichiers temporaires MEDIA accessibles à l’agent
summary: 'Capture caméra (nœuds iOS/Android + application macOS) pour l’utilisation par l’agent : photos (jpg) et courtes séquences vidéo (mp4)'
title: Capture caméra
x-i18n:
    generated_at: "2026-06-27T17:41:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cb02b1e0e5d68e537dc699bcabacfb48b7beaf07459bf47800810a721191795
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw prend en charge la **capture caméra** pour les workflows d’agent :

- **Nœud iOS** (appairé via Gateway) : capturez une **photo** (`jpg`) ou un **court clip vidéo** (`mp4`, avec audio facultatif) via `node.invoke`.
- **Nœud Android** (appairé via Gateway) : capturez une **photo** (`jpg`) ou un **court clip vidéo** (`mp4`, avec audio facultatif) via `node.invoke`.
- **Application macOS** (nœud via Gateway) : capturez une **photo** (`jpg`) ou un **court clip vidéo** (`mp4`, avec audio facultatif) via `node.invoke`.

Tout accès à la caméra est contrôlé par des **paramètres gérés par l’utilisateur**.

## Nœud iOS

### Paramètre utilisateur (activé par défaut)

- Onglet Réglages iOS → **Caméra** → **Autoriser la caméra** (`camera.enabled`)
  - Par défaut : **activé** (une clé manquante est considérée comme activée).
  - Quand il est désactivé : les commandes `camera.*` renvoient `CAMERA_DISABLED`.

### Commandes (via Gateway `node.invoke`)

- `camera.list`
  - Charge utile de réponse :
    - `devices` : tableau de `{ id, name, position, deviceType }`

- `camera.snap`
  - Paramètres :
    - `facing` : `front|back` (par défaut : `front`)
    - `maxWidth` : nombre (facultatif ; valeur par défaut `1600` sur le nœud iOS)
    - `quality` : `0..1` (facultatif ; valeur par défaut `0.9`)
    - `format` : actuellement `jpg`
    - `delayMs` : nombre (facultatif ; valeur par défaut `0`)
    - `deviceId` : chaîne (facultatif ; depuis `camera.list`)
  - Charge utile de réponse :
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Garde de charge utile : les photos sont recompressées afin de garder la charge utile base64 sous 5 Mo.

- `camera.clip`
  - Paramètres :
    - `facing` : `front|back` (par défaut : `front`)
    - `durationMs` : nombre (valeur par défaut `3000`, plafonnée à un maximum de `60000`)
    - `includeAudio` : booléen (valeur par défaut `true`)
    - `format` : actuellement `mp4`
    - `deviceId` : chaîne (facultatif ; depuis `camera.list`)
  - Charge utile de réponse :
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Exigence de premier plan

Comme `canvas.*`, le nœud iOS n’autorise les commandes `camera.*` qu’au **premier plan**. Les invocations en arrière-plan renvoient `NODE_BACKGROUND_UNAVAILABLE`.

### Assistant CLI

Le moyen le plus simple d’obtenir des fichiers multimédias consiste à utiliser l’assistant CLI, qui écrit le média décodé dans un fichier temporaire et affiche le chemin enregistré.

Exemples :

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Remarques :

- `nodes camera snap` utilise par défaut **les deux** orientations afin de fournir les deux vues à l’agent.
- Les fichiers de sortie sont temporaires (dans le répertoire temporaire du système d’exploitation), sauf si vous créez votre propre wrapper.

## Nœud Android

### Paramètre utilisateur Android (activé par défaut)

- Feuille Paramètres Android → **Caméra** → **Autoriser la caméra** (`camera.enabled`)
  - Par défaut : **activé** (une clé manquante est considérée comme activée).
  - Quand il est désactivé : les commandes `camera.*` renvoient `CAMERA_DISABLED`.

### Autorisations

- Android exige des autorisations d’exécution :
  - `CAMERA` pour `camera.snap` et `camera.clip`.
  - `RECORD_AUDIO` pour `camera.clip` lorsque `includeAudio=true`.

Si des autorisations manquent, l’application demandera l’autorisation lorsque c’est possible ; si elle est refusée, les requêtes `camera.*` échouent avec une erreur
`*_PERMISSION_REQUIRED`.

### Exigence de premier plan Android

Comme `canvas.*`, le nœud Android n’autorise les commandes `camera.*` qu’au **premier plan**. Les invocations en arrière-plan renvoient `NODE_BACKGROUND_UNAVAILABLE`.

### Commandes Android (via Gateway `node.invoke`)

- `camera.list`
  - Charge utile de réponse :
    - `devices` : tableau de `{ id, name, position, deviceType }`

### Garde de charge utile

Les photos sont recompressées afin de garder la charge utile base64 sous 5 Mo.

## Application macOS

### Paramètre utilisateur (désactivé par défaut)

L’application compagnon macOS expose une case à cocher :

- **Paramètres → Général → Autoriser la caméra** (`openclaw.cameraEnabled`)
  - Par défaut : **désactivé**
  - Quand il est désactivé : les requêtes caméra renvoient « Caméra désactivée par l’utilisateur ».

### Assistant CLI (invocation du nœud)

Utilisez la CLI principale `openclaw` pour invoquer les commandes caméra sur le nœud macOS.

Exemples :

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints saved path
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints saved path
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints saved path (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

Remarques :

- `openclaw nodes camera snap` utilise par défaut `maxWidth=1600`, sauf remplacement.
- Sur macOS, `camera.snap` attend `delayMs` (2000 ms par défaut) après la stabilisation du préchauffage/de l’exposition avant la capture.
- Les charges utiles photo sont recompressées afin de garder le base64 sous 5 Mo.

## Sécurité + limites pratiques

- L’accès à la caméra et au microphone déclenche les invites d’autorisation habituelles du système d’exploitation (et nécessite des chaînes d’utilisation dans Info.plist).
- Les clips vidéo sont plafonnés (actuellement `<= 60s`) afin d’éviter des charges utiles de nœud trop volumineuses (surcoût base64 + limites de message).

## Vidéo d’écran macOS (niveau système d’exploitation)

Pour la vidéo d’_écran_ (pas la caméra), utilisez le compagnon macOS :

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints saved path
```

Remarques :

- Nécessite l’autorisation macOS **Enregistrement de l’écran** (TCC).

## Connexe

- [Prise en charge des images et des médias](/fr/nodes/images)
- [Compréhension des médias](/fr/nodes/media-understanding)
- [Commande de localisation](/fr/nodes/location-command)
