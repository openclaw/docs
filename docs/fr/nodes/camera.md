---
read_when:
    - Ajout ou modification de la capture avec l’appareil photo sur les Nodes iOS/Android ou macOS
    - Extension des workflows de fichiers temporaires MEDIA accessibles aux agents
summary: 'Capture par l’appareil photo (nœuds iOS/Android + application macOS) destinée aux agents : photos (jpg) et courtes séquences vidéo (mp4)'
title: Capture par l’appareil photo
x-i18n:
    generated_at: "2026-07-12T02:58:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 38555c98886f6cd74ddacabc049da353cdb023e7f99aba81a272021cd8a0e33d
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw prend en charge la capture par caméra pour les flux de travail des agents sur les nœuds **iOS**, **Android** et **macOS** appairés : capturez une photo (`jpg`) ou une courte séquence vidéo (`mp4`, avec audio facultatif) via `node.invoke` du Gateway.

Tout accès à la caméra est soumis à un réglage contrôlé par l’utilisateur sur chaque plateforme.

## Nœud iOS

### Réglage utilisateur iOS

- Onglet iOS Settings → **Camera** → **Allow Camera** (`camera.enabled`).
  - Valeur par défaut : **activé** (une clé absente est considérée comme activée).
  - Lorsque ce réglage est désactivé : les commandes `camera.*` renvoient `CAMERA_DISABLED`.

### Commandes iOS (via `node.invoke` du Gateway)

- `camera.list`
  - Charge utile de la réponse : `devices` — tableau de `{ id, name, position, deviceType }`.

- `camera.snap`
  - Paramètres :
    - `facing` : `front|back` (valeur par défaut : `front`)
    - `maxWidth` : nombre (facultatif ; valeur par défaut : `1600`)
    - `quality` : `0..1` (facultatif ; valeur par défaut : `0.9`, limitée à `[0.05, 1.0]`)
    - `format` : actuellement `jpg`
    - `delayMs` : nombre (facultatif ; valeur par défaut : `0`, plafonnée en interne à `10000`)
    - `deviceId` : chaîne (facultatif ; provenant de `camera.list`)
  - Charge utile de la réponse : `format: "jpg"`, `base64`, `width`, `height`.
  - Limitation de la charge utile : les photos sont recompressées afin de maintenir la charge utile encodée en base64 sous 5 Mo.

- `camera.clip`
  - Paramètres :
    - `facing` : `front|back` (valeur par défaut : `front`)
    - `durationMs` : nombre (valeur par défaut : `3000`, limitée à `[250, 60000]`)
    - `includeAudio` : booléen (valeur par défaut : `true`)
    - `format` : actuellement `mp4`
    - `deviceId` : chaîne (facultatif ; provenant de `camera.list`)
  - Charge utile de la réponse : `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.

### Exigence de premier plan sur iOS

Comme pour `canvas.*`, le nœud iOS n’autorise les commandes `camera.*` qu’au **premier plan**. Les appels en arrière-plan renvoient `NODE_BACKGROUND_UNAVAILABLE`.

### Utilitaire CLI

Le moyen le plus simple d’obtenir les fichiers multimédias consiste à utiliser l’utilitaire CLI, qui écrit le média décodé dans un fichier temporaire et affiche le chemin d’enregistrement.

```bash
openclaw nodes camera snap --node <id>                 # valeur par défaut : avant + arrière (2 lignes MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Par défaut, `nodes camera snap` utilise `--facing both` et capture les vues avant et arrière afin de les fournir toutes deux à l’agent ; utilisez `--device-id` avec une seule orientation explicite (`both` est refusé lorsque `--device-id` est défini). Les fichiers de sortie sont temporaires (dans le répertoire temporaire du système d’exploitation), sauf si vous créez votre propre enveloppe.

## Nœud Android

### Réglage utilisateur Android

- Feuille Android Settings → **Camera** → **Allow Camera** (`camera.enabled`).
  - **Sur les nouvelles installations, ce réglage est désactivé par défaut.** Les installations existantes antérieures à l’ajout de ce réglage sont migrées vers l’état **activé**, afin que les mises à niveau ne suppriment pas silencieusement un accès à la caméra qui fonctionnait auparavant.
  - Lorsque ce réglage est désactivé : les commandes `camera.*` renvoient `CAMERA_DISABLED: enable Camera in Settings`.

### Autorisations

- `CAMERA` est requis pour `camera.snap` et `camera.clip` ; une autorisation absente ou refusée entraîne le renvoi de `CAMERA_PERMISSION_REQUIRED`.
- `RECORD_AUDIO` est requis pour `camera.clip` lorsque `includeAudio` vaut `true` ; une autorisation absente ou refusée entraîne le renvoi de `MIC_PERMISSION_REQUIRED`.

L’application demande les autorisations d’exécution lorsque cela est possible.

### Exigence de premier plan sur Android

Comme pour `canvas.*`, le nœud Android n’autorise les commandes `camera.*` qu’au **premier plan**. Les appels en arrière-plan renvoient `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`.

### Commandes Android (via `node.invoke` du Gateway)

- `camera.list`
  - Charge utile de la réponse : `devices` — tableau de `{ id, name, position, deviceType }`.

- `camera.snap`
  - Paramètres : `facing` (`front|back`, valeur par défaut `front`), `quality` (valeur par défaut `0.95`, limitée à `[0.1, 1.0]`), `maxWidth` (valeur par défaut `1600`), `deviceId` (facultatif ; un identifiant inconnu entraîne `INVALID_REQUEST`).
  - Charge utile de la réponse : `format: "jpg"`, `base64`, `width`, `height`.
  - Limitation de la charge utile : recompression afin de maintenir les données base64 sous 5 Mo (même limite que sur iOS).

- `camera.clip`
  - Paramètres : `facing` (valeur par défaut `front`), `durationMs` (valeur par défaut `3000`, limitée à `[200, 60000]`), `includeAudio` (valeur par défaut `true`), `deviceId` (facultatif).
  - Charge utile de la réponse : `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.
  - Limitation de la charge utile : le fichier MP4 brut est plafonné à 18 Mo avant l’encodage en base64 ; les séquences trop volumineuses échouent avec `PAYLOAD_TOO_LARGE` (réduisez `durationMs` et réessayez).

## Application macOS

### Réglage utilisateur macOS

L’application compagnon macOS propose une case à cocher :

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`).
  - Valeur par défaut : **désactivé**.
  - Lorsque ce réglage est désactivé : les requêtes de caméra renvoient `CAMERA_DISABLED: enable Camera in Settings`.

### Utilitaire CLI (appel de nœud)

Utilisez la CLI principale `openclaw` pour appeler les commandes de caméra sur le nœud macOS.

```bash
openclaw nodes camera list --node <id>                     # répertorie les identifiants de caméra
openclaw nodes camera snap --node <id>                     # affiche le chemin d’enregistrement
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # affiche le chemin d’enregistrement
openclaw nodes camera clip --node <id> --duration-ms 3000   # affiche le chemin d’enregistrement (option héritée)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- `openclaw nodes camera snap` utilise par défaut `maxWidth=1600`, sauf remplacement explicite.
- `camera.snap` attend pendant `delayMs` (valeur par défaut : 2000 ms, limitée à `[0, 10000]`) après la stabilisation du préchauffage et de l’exposition avant d’effectuer la capture.
- Les charges utiles des photos sont recompressées afin de maintenir les données base64 sous 5 Mo.

## Sécurité et limites pratiques

- L’accès à la caméra et au microphone déclenche les demandes d’autorisation habituelles du système d’exploitation (et nécessite des chaînes d’utilisation dans `Info.plist`).
- Les séquences vidéo sont limitées à 60 s afin d’éviter des charges utiles de nœud trop volumineuses (surcharge du base64 ajoutée aux limites de taille des messages).

## Vidéo de l’écran macOS (au niveau du système d’exploitation)

Pour enregistrer une vidéo de l’_écran_ (et non de la caméra), utilisez l’application compagnon macOS :

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # affiche le chemin d’enregistrement
```

Nécessite l’autorisation macOS **Screen Recording** (TCC).

## Voir aussi

- [Prise en charge des images et des médias](/fr/nodes/images)
- [Compréhension des médias](/fr/nodes/media-understanding)
- [Commande de localisation](/fr/nodes/location-command)
