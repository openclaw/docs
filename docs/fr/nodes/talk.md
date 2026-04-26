---
read_when:
    - Implémentation du mode Talk sur macOS/iOS/Android
    - Modifier le comportement de la voix/TTS/interruption
summary: 'Mode Talk : conversations vocales continues avec des providers TTS configurés'
title: Mode Talk
x-i18n:
    generated_at: "2026-04-26T11:33:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: afdddaa81c0a09076eaeeafd25295b0c02681f03b273ec4afe4ea2afa692dc2a
    source_path: nodes/talk.md
    workflow: 15
---

Le mode Talk est une boucle continue de conversation vocale :

1. Écouter la parole
2. Envoyer la transcription au modèle (session principale, chat.send)
3. Attendre la réponse
4. La lire via le provider Talk configuré (`talk.speak`)

## Comportement (macOS)

- **Overlay toujours actif** tant que le mode Talk est activé.
- Transitions de phase **Écoute → Réflexion → Parole**.
- Lors d’une **courte pause** (fenêtre de silence), la transcription actuelle est envoyée.
- Les réponses sont **écrites dans WebChat** (comme si elles étaient saisies).
- **Interruption à la parole** (activée par défaut) : si l’utilisateur commence à parler pendant que l’assistant parle, nous arrêtons la lecture et notons l’horodatage de l’interruption pour le prompt suivant.

## Directives vocales dans les réponses

L’assistant peut préfixer sa réponse avec une **ligne JSON unique** pour contrôler la voix :

```json
{ "voice": "<voice-id>", "once": true }
```

Règles :

- Première ligne non vide uniquement.
- Les clés inconnues sont ignorées.
- `once: true` s’applique à la réponse en cours uniquement.
- Sans `once`, la voix devient la nouvelle valeur par défaut pour le mode Talk.
- La ligne JSON est retirée avant la lecture TTS.

Clés prises en charge :

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (MPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Configuration (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

Valeurs par défaut :

- `interruptOnSpeech` : true
- `silenceTimeoutMs` : lorsqu’il n’est pas défini, Talk conserve la fenêtre de pause par défaut de la plateforme avant d’envoyer la transcription (`700 ms sur macOS et Android, 900 ms sur iOS`)
- `provider` : sélectionne le provider Talk actif. Utilisez `elevenlabs`, `mlx` ou `system` pour les chemins de lecture locale macOS.
- `providers.<provider>.voiceId` : revient à `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` pour ElevenLabs (ou à la première voix ElevenLabs lorsque la clé API est disponible).
- `providers.elevenlabs.modelId` : vaut par défaut `eleven_v3` lorsqu’il n’est pas défini.
- `providers.mlx.modelId` : vaut par défaut `mlx-community/Soprano-80M-bf16` lorsqu’il n’est pas défini.
- `providers.elevenlabs.apiKey` : revient à `ELEVENLABS_API_KEY` (ou au profil shell de la gateway s’il est disponible).
- `speechLocale` : ID de locale BCP 47 facultatif pour la reconnaissance vocale Talk sur appareil sur iOS/macOS. Laissez non défini pour utiliser la valeur par défaut de l’appareil.
- `outputFormat` : vaut par défaut `pcm_44100` sur macOS/iOS et `pcm_24000` sur Android (définissez `mp3_*` pour forcer le streaming MP3)

## Interface macOS

- Bascule de barre de menus : **Talk**
- Onglet de configuration : groupe **Mode Talk** (ID de voix + bascule d’interruption)
- Overlay :
  - **Écoute** : nuage pulsant avec niveau du micro
  - **Réflexion** : animation d’enfoncement
  - **Parole** : anneaux rayonnants
  - Clic sur le nuage : arrêter la lecture
  - Clic sur X : quitter le mode Talk

## Interface Android

- Bascule de l’onglet Voice : **Talk**
- Les modes manuels **Mic** et **Talk** sont des modes de capture d’exécution mutuellement exclusifs.
- Le micro manuel s’arrête lorsque l’application quitte le premier plan ou que l’utilisateur quitte l’onglet Voice.
- Le mode Talk continue de s’exécuter jusqu’à sa désactivation ou à la déconnexion du node Android, et utilise le type de service de premier plan microphone d’Android lorsqu’il est actif.

## Remarques

- Nécessite les autorisations Speech et Microphone.
- Utilise `chat.send` avec la clé de session `main`.
- La gateway résout la lecture Talk via `talk.speak` en utilisant le provider Talk actif. Android revient au TTS système local uniquement lorsque ce RPC n’est pas disponible.
- La lecture MLX locale sur macOS utilise l’assistant intégré `openclaw-mlx-tts` lorsqu’il est présent, ou un exécutable sur `PATH`. Définissez `OPENCLAW_MLX_TTS_BIN` pour pointer vers un binaire d’assistant personnalisé pendant le développement.
- `stability` pour `eleven_v3` est validé à `0.0`, `0.5` ou `1.0` ; les autres modèles acceptent `0..1`.
- `latency_tier` est validé à `0..4` lorsqu’il est défini.
- Android prend en charge les formats de sortie `pcm_16000`, `pcm_22050`, `pcm_24000` et `pcm_44100` pour le streaming AudioTrack à faible latence.

## Connexe

- [Réveil vocal](/fr/nodes/voicewake)
- [Audio et notes vocales](/fr/nodes/audio)
- [Compréhension des médias](/fr/nodes/media-understanding)
