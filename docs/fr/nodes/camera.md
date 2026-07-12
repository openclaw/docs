---
read_when:
    - Ajout ou modification de la capture par caméra sur les nœuds iOS/Android ou macOS
    - Extension des workflows de fichiers temporaires MEDIA accessibles aux agents
summary: 'Capture par l’appareil photo (nœuds iOS/Android + application macOS) à l’usage de l’agent : photos (jpg) et courtes séquences vidéo (mp4)'
title: Capture avec l’appareil photo
x-i18n:
    generated_at: "2026-07-12T15:35:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 38555c98886f6cd74ddacabc049da353cdb023e7f99aba81a272021cd8a0e33d
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw prend en charge la capture par caméra pour les workflows d’agent sur les nœuds **iOS**, **Android** et **macOS** appairés : capturez une photo (`jpg`) ou un court clip vidéo (`mp4`, avec audio facultatif) via `node.invoke` du Gateway.

Tout accès à la caméra est soumis à un réglage contrôlé par l’utilisateur sur chaque plateforme.

## Nœud iOS

### Réglage utilisateur iOS

- Onglet Settings d’iOS → **Camera** → **Allow Camera** (`camera.enabled`).
  - Valeur par défaut : **activé** (une clé absente est considérée comme activée).
  - Lorsque désactivé : les commandes `camera.*` renvoient `CAMERA_DISABLED`.

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
  - Limite de la charge utile : les photos sont recompressées afin de maintenir la charge utile encodée en base64 sous 5MB.

- `camera.clip`
  - Paramètres :
    - `facing` : `front|back` (valeur par défaut : `front`)
    - `durationMs` : nombre (valeur par défaut : `3000`, limitée à `[250, 60000]`)
    - `includeAudio` : booléen (valeur par défaut : `true`)
    - `format` : actuellement `mp4`
    - `deviceId` : chaîne (facultatif ; provenant de `camera.list`)
  - Charge utile de la réponse : `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.

### Exigence de premier plan sur iOS

Comme `canvas.*`, le nœud iOS n’autorise les commandes `camera.*` qu’au **premier plan**. Les appels en arrière-plan renvoient `NODE_BACKGROUND_UNAVAILABLE`.

### Assistant CLI

Le moyen le plus simple d’obtenir des fichiers multimédias consiste à utiliser l’assistant CLI, qui écrit les médias décodés dans un fichier temporaire et affiche le chemin d’enregistrement.

```bash
openclaw nodes camera snap --node <id>                 # valeur par défaut : avant + arrière (2 lignes MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Par défaut, `nodes camera snap` utilise `--facing both`, capturant à la fois les vues avant et arrière afin de les fournir toutes deux à l’agent ; transmettez `--device-id` avec une seule orientation explicite (`both` est refusé lorsque `--device-id` est défini). Les fichiers de sortie sont temporaires (dans le répertoire temporaire du système d’exploitation), sauf si vous créez votre propre wrapper.

## Nœud Android

### Réglage utilisateur Android

- Panneau Settings d’Android → **Camera** → **Allow Camera** (`camera.enabled`).
  - **Les nouvelles installations sont désactivées par défaut.** Les installations existantes antérieures à ce réglage sont migrées vers l’état **activé**, afin que les mises à niveau ne suppriment pas silencieusement un accès à la caméra qui fonctionnait auparavant.
  - Lorsque désactivé : les commandes `camera.*` renvoient `CAMERA_DISABLED: enable Camera in Settings`.

### Autorisations

- `CAMERA` est requis pour `camera.snap` et `camera.clip` ; une autorisation absente ou refusée renvoie `CAMERA_PERMISSION_REQUIRED`.
- `RECORD_AUDIO` est requis pour `camera.clip` lorsque `includeAudio` vaut `true` ; une autorisation absente ou refusée renvoie `MIC_PERMISSION_REQUIRED`.

L’application demande les autorisations d’exécution lorsque cela est possible.

### Exigence de premier plan sur Android

Comme `canvas.*`, le nœud Android n’autorise les commandes `camera.*` qu’au **premier plan**. Les appels en arrière-plan renvoient `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`.

### Commandes Android (via `node.invoke` du Gateway)

- `camera.list`
  - Charge utile de la réponse : `devices` — tableau de `{ id, name, position, deviceType }`.

- `camera.snap`
  - Paramètres : `facing` (`front|back`, valeur par défaut `front`), `quality` (valeur par défaut `0.95`, limitée à `[0.1, 1.0]`), `maxWidth` (valeur par défaut `1600`), `deviceId` (facultatif ; un identifiant inconnu provoque une erreur `INVALID_REQUEST`).
  - Charge utile de la réponse : `format: "jpg"`, `base64`, `width`, `height`.
  - Limite de la charge utile : recompression afin de maintenir le contenu base64 sous 5MB (même limite que sur iOS).

- `camera.clip`
  - Paramètres : `facing` (valeur par défaut `front`), `durationMs` (valeur par défaut `3000`, limitée à `[200, 60000]`), `includeAudio` (valeur par défaut `true`), `deviceId` (facultatif).
  - Charge utile de la réponse : `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.
  - Limite de la charge utile : le fichier MP4 brut est plafonné à 18MB avant l’encodage en base64 ; les clips trop volumineux échouent avec `PAYLOAD_TOO_LARGE` (réduisez `durationMs` et réessayez).

## Application macOS

### Réglage utilisateur macOS

L’application compagnon macOS propose une case à cocher :

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`).
  - Valeur par défaut : **désactivé**.
  - Lorsque désactivé : les requêtes de caméra renvoient `CAMERA_DISABLED: enable Camera in Settings`.

### Assistant CLI (appel de nœud)

Utilisez la CLI principale `openclaw` pour appeler les commandes de caméra sur le nœud macOS.

```bash
openclaw nodes camera list --node <id>                     # répertorie les identifiants des caméras
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
- `camera.snap` attend pendant `delayMs` (valeur par défaut 2000ms, limitée à `[0, 10000]`) après le préchauffage et la stabilisation de l’exposition avant la capture.
- Les charges utiles des photos sont recompressées afin de maintenir le contenu base64 sous 5MB.

## Sécurité et limites pratiques

- L’accès à la caméra et au microphone déclenche les demandes d’autorisation habituelles du système d’exploitation (et nécessite des chaînes d’utilisation dans `Info.plist`).
- Les clips vidéo sont limités à 60s afin d’éviter des charges utiles de nœud trop volumineuses (surcharge du base64 et limites des messages).

## Vidéo de l’écran macOS (au niveau du système d’exploitation)

Pour une vidéo de l’_écran_ (et non de la caméra), utilisez l’application compagnon macOS :

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # affiche le chemin d’enregistrement
```

Nécessite l’autorisation macOS **Screen Recording** (TCC).

## Voir aussi

- [Prise en charge des images et des médias](/fr/nodes/images)
- [Compréhension des médias](/fr/nodes/media-understanding)
- [Commande de localisation](/fr/nodes/location-command)
