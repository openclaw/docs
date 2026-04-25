---
read_when:
    - Implémenter le mode Talk sur macOS/iOS/Android
    - Modifier le comportement de la voix/TTS/des interruptions
summary: 'Mode Talk : conversations vocales continues avec des fournisseurs TTS configurés'
title: Mode Talk
x-i18n:
    generated_at: "2026-04-25T13:50:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84c99149c43bfe9fa4866b20271089d88d7e3d2f5abe6d16477a26915dad7829
    source_path: nodes/talk.md
    workflow: 15
---

Le mode Talk est une boucle continue de conversation vocale :

1. Écouter la parole
2. Envoyer la transcription au modèle (session principale, `chat.send`)
3. Attendre la réponse
4. La prononcer via le fournisseur Talk configuré (`talk.speak`)

## Comportement (macOS)

- **Overlay toujours actif** tant que le mode Talk est activé.
- Transitions de phase **Écoute → Réflexion → Parole**.
- Lors d’une **courte pause** (fenêtre de silence), la transcription actuelle est envoyée.
- Les réponses sont **écrites dans WebChat** (comme si elles étaient saisies).
- **Interruption par la parole** (activée par défaut) : si l’utilisateur commence à parler pendant que l’assistant parle, nous arrêtons la lecture et notons l’horodatage de l’interruption pour le prompt suivant.

## Directives vocales dans les réponses

L’assistant peut préfixer sa réponse par une **seule ligne JSON** pour contrôler la voix :

```json
{ "voice": "<voice-id>", "once": true }
```

Règles :

- Première ligne non vide uniquement.
- Les clés inconnues sont ignorées.
- `once: true` s’applique uniquement à la réponse actuelle.
- Sans `once`, la voix devient la nouvelle valeur par défaut du mode Talk.
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
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

Valeurs par défaut :

- `interruptOnSpeech`: true
- `silenceTimeoutMs` : lorsqu’il n’est pas défini, le mode Talk conserve la fenêtre de pause par défaut de la plateforme avant d’envoyer la transcription (`700 ms` sur macOS et Android, `900 ms` sur iOS)
- `provider` : sélectionne le fournisseur Talk actif. Utilisez `elevenlabs`, `mlx` ou `system` pour les chemins de lecture locaux macOS.
- `providers.<provider>.voiceId` : utilise comme repli `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` pour ElevenLabs (ou la première voix ElevenLabs lorsque la clé API est disponible).
- `providers.elevenlabs.modelId` : utilise `eleven_v3` par défaut lorsqu’il n’est pas défini.
- `providers.mlx.modelId` : utilise `mlx-community/Soprano-80M-bf16` par défaut lorsqu’il n’est pas défini.
- `providers.elevenlabs.apiKey` : utilise comme repli `ELEVENLABS_API_KEY` (ou le profil shell du gateway si disponible).
- `outputFormat` : vaut par défaut `pcm_44100` sur macOS/iOS et `pcm_24000` sur Android (définissez `mp3_*` pour forcer un flux MP3)

## UI macOS

- Bascule de la barre de menus : **Talk**
- Onglet de configuration : groupe **Mode Talk** (id de voix + bascule d’interruption)
- Overlay :
  - **Écoute** : le nuage pulse avec le niveau du micro
  - **Réflexion** : animation descendante
  - **Parole** : anneaux rayonnants
  - Clic sur le nuage : arrêter la parole
  - Clic sur X : quitter le mode Talk

## Remarques

- Nécessite les autorisations Parole + Microphone.
- Utilise `chat.send` sur la clé de session `main`.
- Le gateway résout la lecture Talk via `talk.speak` en utilisant le fournisseur Talk actif. Android revient au TTS système local uniquement lorsque cette RPC n’est pas disponible.
- La lecture MLX locale sur macOS utilise le helper intégré `openclaw-mlx-tts` lorsqu’il est présent, ou un exécutable sur `PATH`. Définissez `OPENCLAW_MLX_TTS_BIN` pour pointer vers un binaire helper personnalisé pendant le développement.
- `stability` pour `eleven_v3` est validé sur `0.0`, `0.5` ou `1.0` ; les autres modèles acceptent `0..1`.
- `latency_tier` est validé sur `0..4` lorsqu’il est défini.
- Android prend en charge les formats de sortie `pcm_16000`, `pcm_22050`, `pcm_24000` et `pcm_44100` pour le streaming AudioTrack à faible latence.

## Connexes

- [Déclenchement vocal](/fr/nodes/voicewake)
- [Audio et notes vocales](/fr/nodes/audio)
- [Compréhension des médias](/fr/nodes/media-understanding)
