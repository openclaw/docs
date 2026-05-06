---
read_when:
    - Implémentation du mode Conversation sur macOS/iOS/Android
    - Modification du comportement de la voix/de la synthèse vocale/de l’interruption
summary: 'Mode conversation : conversations vocales continues via STT/TTS local et voix en temps réel'
title: Mode conversation
x-i18n:
    generated_at: "2026-05-06T07:30:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: a04304a1dd6c3feefa89c0c8c66f8026a7d28b573776fcf14237c3481fbc772a
    source_path: nodes/talk.md
    workflow: 16
---

Le mode Talk a deux formes d’exécution :

- Talk natif macOS/iOS/Android utilise la reconnaissance vocale locale, le chat du Gateway et le TTS `talk.speak`. Les Nodes annoncent la capacité `talk` et déclarent les commandes `talk.*` qu’ils prennent en charge.
- Talk dans le navigateur utilise `talk.client.create` pour les sessions `webrtc` et `provider-websocket` détenues par le client, ou `talk.session.create` pour les sessions `gateway-relay` détenues par le Gateway. `managed-room` est réservé au transfert par le Gateway et aux salons talkie-walkie.
- Les clients de transcription seule utilisent `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, puis `talk.session.appendAudio`, `talk.session.cancelTurn` et `talk.session.close` lorsqu’ils ont besoin de sous-titres ou de dictée sans réponse vocale de l’assistant.

Talk natif est une boucle de conversation vocale continue :

1. Écouter la parole
2. Envoyer la transcription au modèle via la session active
3. Attendre la réponse
4. La lire via le fournisseur Talk configuré (`talk.speak`)

Talk temps réel dans le navigateur transfère les appels d’outils du fournisseur via `talk.client.toolCall` ; les clients navigateur n’appellent pas directement `chat.send` pour les consultations en temps réel.

Talk en transcription seule émet la même enveloppe d’événement Talk commune que les sessions temps réel et STT/TTS, mais utilise `mode: "transcription"` et `brain: "none"`. Il est destiné aux sous-titres, à la dictée et à la capture vocale en observation seule ; les notes vocales téléversées ponctuelles utilisent toujours le chemin média/audio.

## Comportement (macOS)

- **Superposition toujours active** lorsque le mode Talk est activé.
- Transitions de phase **Écoute → Réflexion → Parole**.
- Lors d’une **courte pause** (fenêtre de silence), la transcription actuelle est envoyée.
- Les réponses sont **écrites dans WebChat** (comme lors de la saisie).
- **Interruption à la parole** (activée par défaut) : si l’utilisateur commence à parler pendant que l’assistant parle, nous arrêtons la lecture et notons l’horodatage de l’interruption pour le prompt suivant.

## Directives vocales dans les réponses

L’assistant peut préfixer sa réponse avec une **seule ligne JSON** pour contrôler la voix :

```json
{ "voice": "<voice-id>", "once": true }
```

Règles :

- Première ligne non vide uniquement.
- Les clés inconnues sont ignorées.
- `once: true` s’applique uniquement à la réponse actuelle.
- Sans `once`, la voix devient le nouveau réglage par défaut du mode Talk.
- La ligne JSON est supprimée avant la lecture TTS.

Clés prises en charge :

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
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
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          apiKey: "openai_api_key",
          model: "gpt-realtime",
          voice: "alloy",
        },
      },
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

Valeurs par défaut :

- `interruptOnSpeech`: true
- `silenceTimeoutMs` : lorsqu’il n’est pas défini, Talk conserve la fenêtre de pause par défaut de la plateforme avant d’envoyer la transcription (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider` : sélectionne le fournisseur Talk actif. Utilisez `elevenlabs`, `mlx` ou `system` pour les chemins de lecture locaux à macOS.
- `providers.<provider>.voiceId` : se rabat sur `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` pour ElevenLabs (ou sur la première voix ElevenLabs lorsqu’une clé API est disponible).
- `providers.elevenlabs.modelId` : vaut `eleven_v3` par défaut lorsqu’il n’est pas défini.
- `providers.mlx.modelId` : vaut `mlx-community/Soprano-80M-bf16` par défaut lorsqu’il n’est pas défini.
- `providers.elevenlabs.apiKey` : se rabat sur `ELEVENLABS_API_KEY` (ou sur le profil shell du Gateway s’il est disponible).
- `realtime.provider` : sélectionne le fournisseur vocal temps réel navigateur/serveur actif. Utilisez `openai` pour WebRTC, `google` pour le WebSocket fournisseur, ou un fournisseur pont uniquement via le relais du Gateway.
- `realtime.providers.<provider>` stocke la configuration temps réel détenue par le fournisseur. Le navigateur ne reçoit que des identifiants de session éphémères ou contraints, jamais une clé API standard.
- `realtime.brain` : `agent-consult` route les appels d’outils temps réel via la politique du Gateway ; `direct-tools` est un comportement de compatibilité réservé au propriétaire ; `none` est destiné à la transcription ou à l’orchestration externe.
- `talk.catalog` expose les modes, transports, stratégies de brain, formats audio temps réel et indicateurs de capacité valides de chaque fournisseur afin que les clients Talk internes puissent éviter les combinaisons non prises en charge.
- Les fournisseurs de transcription en streaming sont découverts via `talk.catalog.transcription`. Le relais Gateway actuel utilise la configuration du fournisseur de streaming Voice Call jusqu’à l’ajout de la surface de configuration dédiée à la transcription Talk.
- `speechLocale` : identifiant de locale BCP 47 facultatif pour la reconnaissance vocale Talk sur l’appareil sous iOS/macOS. Laissez non défini pour utiliser la valeur par défaut de l’appareil.
- `outputFormat` : vaut `pcm_44100` par défaut sur macOS/iOS et `pcm_24000` sur Android (définissez `mp3_*` pour forcer le streaming MP3)

## UI macOS

- Bascule de la barre de menus : **Talk**
- Onglet de configuration : groupe **Mode Talk** (id de voix + bascule d’interruption)
- Superposition :
  - **Écoute** : le nuage pulse avec le niveau du micro
  - **Réflexion** : animation descendante
  - **Parole** : anneaux rayonnants
  - Cliquer sur le nuage : arrêter la parole
  - Cliquer sur X : quitter le mode Talk

## UI Android

- Bascule de l’onglet Voix : **Talk**
- Les modes de capture à l’exécution **Mic** manuel et **Talk** sont mutuellement exclusifs.
- Le Mic manuel s’arrête lorsque l’app quitte le premier plan ou que l’utilisateur quitte l’onglet Voix.
- Le mode Talk continue de s’exécuter jusqu’à sa désactivation ou jusqu’à la déconnexion du Node Android, et utilise le type de service de premier plan microphone d’Android lorsqu’il est actif.

## Notes

- Nécessite les autorisations Parole + Microphone.
- Talk natif utilise la session Gateway active et ne se rabat sur l’interrogation de l’historique que lorsque les événements de réponse ne sont pas disponibles.
- Talk temps réel dans le navigateur utilise `talk.client.toolCall` pour `openclaw_agent_consult` au lieu d’exposer `chat.send` aux sessions navigateur détenues par le fournisseur.
- Talk en transcription seule utilise `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` et `talk.session.close` ; les clients s’abonnent à `talk.event` pour les mises à jour partielles/finales de transcription.
- Le gateway résout la lecture Talk via `talk.speak` en utilisant le fournisseur Talk actif. Android se rabat sur le TTS système local uniquement lorsque ce RPC n’est pas disponible.
- La lecture MLX locale sur macOS utilise l’assistant groupé `openclaw-mlx-tts` lorsqu’il est présent, ou un exécutable sur `PATH`. Définissez `OPENCLAW_MLX_TTS_BIN` pour pointer vers un binaire d’assistant personnalisé pendant le développement.
- `stability` pour `eleven_v3` est validé à `0.0`, `0.5` ou `1.0` ; les autres modèles acceptent `0..1`.
- `latency_tier` est validé à `0..4` lorsqu’il est défini.
- Android prend en charge les formats de sortie `pcm_16000`, `pcm_22050`, `pcm_24000` et `pcm_44100` pour le streaming AudioTrack à faible latence.

## Connexe

- [Réveil vocal](/fr/nodes/voicewake)
- [Audio et notes vocales](/fr/nodes/audio)
- [Compréhension des médias](/fr/nodes/media-understanding)
