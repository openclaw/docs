---
read_when:
    - Ajout ou modification de la capture par caméra sur les plateformes Node
    - Extension des workflows de fichiers temporaires MEDIA accessibles aux agents
summary: Capture avec la caméra sur les Nodes iOS, Android, macOS et Linux pour les photos et les courtes séquences vidéo
title: Capture avec la caméra
x-i18n:
    generated_at: "2026-07-16T13:29:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8fff8302863b63209222d87b350238dd2f01e18d06ce1783036b3cefaca14020
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw prend en charge la capture par caméra pour les workflows d’agents sur les nœuds **iOS**, **Android**, **macOS** et **Linux** appairés : capturez une photo (`jpg`) ou un court clip vidéo (`mp4`, avec audio facultatif) via le Gateway `node.invoke`.

Tout accès à la caméra est soumis à un paramètre contrôlé par l’utilisateur sur chaque plateforme.

## Nœud iOS

### Paramètre utilisateur iOS

- Onglet Settings d’iOS → **Camera** → **Allow Camera** (`camera.enabled`).
  - Valeur par défaut : **activé** (une clé absente est considérée comme activée).
  - Lorsque cette option est désactivée : les commandes `camera.*` renvoient `CAMERA_DISABLED`.

### Commandes iOS (via le Gateway `node.invoke`)

- `camera.list`
  - Charge utile de la réponse : `devices` — tableau de `{ id, name, position, deviceType }`.

- `camera.snap`
  - Paramètres :
    - `facing` : `front|back` (valeur par défaut : `front`)
    - `maxWidth` : nombre (facultatif ; valeur par défaut `1600`)
    - `quality` : `0..1` (facultatif ; valeur par défaut `0.9`, limité à `[0.05, 1.0]`)
    - `format` : actuellement `jpg`
    - `delayMs` : nombre (facultatif ; valeur par défaut `0`, plafonné en interne à `10000`)
    - `deviceId` : chaîne (facultatif ; provenant de `camera.list`)
  - Charge utile de la réponse : `format: "jpg"`, `base64`, `width`, `height`.
  - Protection de la charge utile : les photos sont recompressées pour maintenir la charge utile encodée en base64 sous 5MB.

- `camera.clip`
  - Paramètres :
    - `facing` : `front|back` (valeur par défaut : `front`)
    - `durationMs` : nombre (valeur par défaut `3000`, limité à `[250, 60000]`)
    - `includeAudio` : booléen (valeur par défaut `true`)
    - `format` : actuellement `mp4`
    - `deviceId` : chaîne (facultatif ; provenant de `camera.list`)
  - Charge utile de la réponse : `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.

### Exigence de premier plan sur iOS

Comme `canvas.*`, le nœud iOS n’autorise les commandes `camera.*` qu’au **premier plan**. Les appels en arrière-plan renvoient `NODE_BACKGROUND_UNAVAILABLE`.

### Utilitaire CLI

Le moyen le plus simple d’obtenir les fichiers multimédias consiste à utiliser l’utilitaire CLI, qui écrit les données multimédias décodées dans un fichier temporaire et affiche le chemin d’enregistrement.

```bash
openclaw nodes camera snap --node <id>                 # valeur par défaut : avant + arrière (2 lignes MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

`nodes camera snap` utilise par défaut `--facing both`, capturant les vues avant et arrière afin de fournir les deux vues à l’agent ; transmettez `--device-id` avec une seule orientation explicite (`both` est rejeté lorsque `--device-id` est défini). Les fichiers de sortie sont temporaires (dans le répertoire temporaire du système d’exploitation), sauf si vous créez votre propre enveloppe.

## Nœud Android

### Paramètre utilisateur Android

- Volet Settings d’Android → **Camera** → **Allow Camera** (`camera.enabled`).
  - **La valeur par défaut est désactivée pour les nouvelles installations.** Les installations existantes antérieures à ce paramètre sont migrées vers **activé** afin que les mises à niveau ne suppriment pas silencieusement un accès à la caméra qui fonctionnait auparavant.
  - Lorsque cette option est désactivée : les commandes `camera.*` renvoient `CAMERA_DISABLED: enable Camera in Settings`.

### Autorisations

- `CAMERA` est requis pour `camera.snap` et `camera.clip` ; une autorisation absente ou refusée renvoie `CAMERA_PERMISSION_REQUIRED`.
- `RECORD_AUDIO` est requis pour `camera.clip` lorsque `includeAudio` vaut `true` ; une autorisation absente ou refusée renvoie `MIC_PERMISSION_REQUIRED`.

L’application demande les autorisations d’exécution lorsque cela est possible.

### Exigence de premier plan sur Android

Comme `canvas.*`, le nœud Android n’autorise les commandes `camera.*` qu’au **premier plan**. Les appels en arrière-plan renvoient `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`.

### Commandes Android (via le Gateway `node.invoke`)

- `camera.list`
  - Charge utile de la réponse : `devices` — tableau de `{ id, name, position, deviceType }`.

- `camera.snap`
  - Paramètres : `facing` (`front|back`, valeur par défaut `front`), `quality` (valeur par défaut `0.95`, limité à `[0.1, 1.0]`), `maxWidth` (valeur par défaut `1600`), `deviceId` (facultatif ; un identifiant inconnu échoue avec `INVALID_REQUEST`).
  - Charge utile de la réponse : `format: "jpg"`, `base64`, `width`, `height`.
  - Protection de la charge utile : recompression pour maintenir la base64 sous 5MB (même budget que sur iOS).

- `camera.clip`
  - Paramètres : `facing` (valeur par défaut `front`), `durationMs` (valeur par défaut `3000`, limité à `[200, 60000]`), `includeAudio` (valeur par défaut `true`), `deviceId` (facultatif).
  - Charge utile de la réponse : `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.
  - Protection de la charge utile : le MP4 brut est plafonné à 18MB avant l’encodage en base64 ; les clips trop volumineux échouent avec `PAYLOAD_TOO_LARGE` (réduisez `durationMs` et réessayez).

## Application macOS

### Paramètre utilisateur macOS

L’application compagnon macOS propose une case à cocher :

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`).
  - Valeur par défaut : **désactivé**.
  - Lorsque cette option est désactivée : les requêtes de caméra renvoient `CAMERA_DISABLED: enable Camera in Settings`.

### Utilitaire CLI (appel du nœud)

Utilisez la CLI `openclaw` principale pour appeler les commandes de caméra sur le nœud macOS.

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
- `camera.snap` attend `delayMs` (valeur par défaut 2000ms, limitée à `[0, 10000]`) après le préchauffage et la stabilisation de l’exposition avant la capture.
- Les charges utiles des photos sont recompressées pour maintenir la base64 sous 5MB.

## Hôte du nœud Linux

Le Plugin Linux Node intégré ajoute la capture par caméra au service CLI `openclaw node`. Il fonctionne sur un hôte sans interface graphique et ne nécessite pas l’application de bureau Linux.

L’accès à la caméra est désactivé par défaut. Activez-le dans l’entrée du Plugin, puis redémarrez le service du nœud afin que son annonce Gateway soit reconstruite :

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          camera: { enabled: true },
        },
      },
    },
  },
}
```

Prérequis :

- FFmpeg avec entrée V4L2, `libx264` et prise en charge d’AAC
- un périphérique `/dev/video*` lisible par l’utilisateur du service de nœud ; sur les distributions courantes, ajoutez cet utilisateur au groupe `video`
- pour les clips utilisant la valeur `includeAudio: true` par défaut, un serveur PulseAudio fonctionnel ou une couche de compatibilité PulseAudio de PipeWire avec une source par défaut

Linux renvoie les chemins de périphériques V4L2 lisibles et capables d’effectuer des captures depuis `camera.list` ; FFmpeg sonde chaque candidat `/dev/video*` et omet les nœuds de métadonnées ou de sortie uniquement. Le `position` du périphérique est `unknown`, de sorte que les demandes d’orientation sans `deviceId` produisent une photo ou un clip en position `unknown` au lieu de prétendre qu’il s’agit d’une caméra avant ou arrière. Utilisez `deviceId` lorsqu’un hôte dispose de plusieurs caméras. `camera.snap` utilise le préchauffage de l’entrée FFmpeg pour `delayMs` et préserve les proportions tout en limitant la largeur. `camera.clip` enregistre l’audio du microphone comme piste audio du MP4 ; OpenClaw ne propose délibérément aucune commande de microphone autonome.

Le Plugin utilise `libx264` pour la vidéo MP4 et ne change pas silencieusement de codec. Une version de FFmpeg dépourvue de l’entrée ou des encodeurs requis renvoie `CAMERA_UNAVAILABLE`. Les photos et clips qui dépasseraient le budget de charge utile base64 de 25MB échouent avec `PAYLOAD_TOO_LARGE`.

`camera.snap` et `camera.clip` restent des commandes dangereuses. Ajoutez-les à `gateway.nodes.allowCommands` uniquement lorsque vous souhaitez armer la capture ; l’activation du Plugin seul ne contourne pas la politique du Gateway.

## Sécurité et limites pratiques

- L’accès à la caméra et au microphone déclenche les demandes d’autorisation habituelles du système d’exploitation (et nécessite des chaînes d’utilisation dans `Info.plist`).
- Les clips vidéo sont limités à 60s afin d’éviter des charges utiles de nœud surdimensionnées (surcoût de la base64 et limites des messages).

## Vidéo de l’écran macOS (au niveau du système d’exploitation)

Pour une vidéo de l’_écran_ (et non de la caméra), utilisez l’application compagnon macOS :

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # affiche le chemin d’enregistrement
```

Nécessite l’autorisation macOS **Screen Recording** (TCC).

## Pages connexes

- [Prise en charge des images et des contenus multimédias](/fr/nodes/images)
- [Compréhension des contenus multimédias](/fr/nodes/media-understanding)
- [Commande de localisation](/fr/nodes/location-command)
