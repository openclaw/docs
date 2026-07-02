---
read_when:
    - Implémenter le mode Talk sur macOS/iOS/Android
    - Modifier le comportement de voix/TTS/interruption
summary: 'Mode conversation : conversations vocales continues via STT/TTS local et voix en temps réel'
title: Mode conversation
x-i18n:
    generated_at: "2026-07-02T22:29:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 696e9693cd6b4a18500221230db17c94ffd01fe6f9c7fcf271b74072bb035a82
    source_path: nodes/talk.md
    workflow: 16
---

Le mode Talk a deux formes d’exécution :

- Talk natif sur macOS/iOS/Android utilise la reconnaissance vocale locale, le chat Gateway et le TTS `talk.speak`. Les nœuds annoncent la capacité `talk` et déclarent les commandes `talk.*` qu’ils prennent en charge.
- Talk sur iOS utilise WebRTC, détenu par le client, pour les configurations OpenAI temps réel qui sélectionnent `webrtc` ou omettent le transport. Les configurations temps réel explicites `gateway-relay`, `provider-websocket` et non OpenAI restent sur le relais détenu par le Gateway ; les configurations non temps réel utilisent la boucle vocale native.
- Talk dans le navigateur utilise `talk.client.create` pour les sessions `webrtc` et `provider-websocket` détenues par le client, ou `talk.session.create` pour les sessions `gateway-relay` détenues par le Gateway. `managed-room` est réservé au transfert par le Gateway et aux salles talkie-walkie.
- Talk sur Android peut opter pour des sessions de relais temps réel détenues par le Gateway avec `talk.realtime.mode: "realtime"` et `talk.realtime.transport: "gateway-relay"`. Sinon, il reste sur la reconnaissance vocale native, le chat Gateway et `talk.speak`.
- Les clients de transcription seule utilisent `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, puis `talk.session.appendAudio`, `talk.session.cancelTurn` et `talk.session.close` lorsqu’ils ont besoin de sous-titres ou de dictée sans réponse vocale de l’assistant.

Talk natif est une boucle continue de conversation vocale :

1. Écouter la parole
2. Envoyer la transcription au modèle via la session active
3. Attendre la réponse
4. La prononcer via le fournisseur Talk configuré (`talk.speak`)

Talk temps réel détenu par le client transmet les appels d’outils du fournisseur via `talk.client.toolCall` ; ces clients n’appellent pas directement `chat.send` pour les consultations temps réel.
Pendant qu’une consultation temps réel est active, les clients Talk peuvent utiliser `talk.client.steer` ou
`talk.session.steer` pour classer l’entrée vocale comme `status`, `steer`, `cancel` ou
`followup`. Les instructions acceptées sont mises en file dans l’exécution intégrée active ; les
instructions rejetées renvoient une raison structurée comme `no_active_run`, `not_streaming`
ou `compacting`.

Talk de transcription seule émet la même enveloppe commune d’événements Talk que les sessions temps réel et STT/TTS, mais utilise `mode: "transcription"` et `brain: "none"`. Il sert aux sous-titres, à la dictée et à la capture vocale en observation seule ; les notes vocales téléversées ponctuelles utilisent toujours le chemin média/audio.

## Comportement (macOS)

- **Superposition toujours active** lorsque le mode Talk est activé.
- Transitions de phase **Écoute → Réflexion → Parole**.
- Lors d’une **courte pause** (fenêtre de silence), la transcription actuelle est envoyée.
- Les réponses sont **écrites dans WebChat** (comme lors d’une saisie).
- **Interruption à la parole** (activée par défaut) : si l’utilisateur commence à parler pendant que l’assistant parle, nous arrêtons la lecture et notons l’horodatage de l’interruption pour le prochain prompt.

## Directives vocales dans les réponses

L’assistant peut préfixer sa réponse avec une **unique ligne JSON** pour contrôler la voix :

```json
{ "voice": "<voice-id>", "once": true }
```

Règles :

- Première ligne non vide uniquement.
- Les clés inconnues sont ignorées.
- `once: true` s’applique uniquement à la réponse actuelle.
- Sans `once`, la voix devient la nouvelle valeur par défaut du mode Talk.
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
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

Valeurs par défaut :

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: lorsque non défini, Talk conserve la fenêtre de pause par défaut de la plateforme avant d’envoyer la transcription (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: sélectionne le fournisseur Talk actif. Utilisez `elevenlabs`, `mlx` ou `system` pour les chemins de lecture locaux à macOS.
- `providers.<provider>.voiceId`: se rabat sur `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` pour ElevenLabs (ou sur la première voix ElevenLabs lorsqu’une clé API est disponible).
- `providers.elevenlabs.modelId`: vaut `eleven_v3` par défaut lorsqu’il n’est pas défini.
- `providers.mlx.modelId`: vaut `mlx-community/Soprano-80M-bf16` par défaut lorsqu’il n’est pas défini.
- `providers.elevenlabs.apiKey`: se rabat sur `ELEVENLABS_API_KEY` (ou sur le profil shell Gateway s’il est disponible).
- `consultThinkingLevel`: remplacement facultatif du niveau de réflexion pour l’exécution complète de l’agent OpenClaw derrière les appels temps réel `openclaw_agent_consult`.
- `consultFastMode`: remplacement facultatif du mode rapide pour les appels temps réel `openclaw_agent_consult`.
- `realtime.provider`: sélectionne le fournisseur vocal temps réel actif. Utilisez `openai` pour WebRTC, `google` pour le WebSocket du fournisseur, ou un fournisseur uniquement pont via le relais Gateway.
- `realtime.providers.<provider>` stocke la configuration temps réel détenue par le fournisseur. Le navigateur ne reçoit que des identifiants de session éphémères ou contraints, jamais une clé API standard.
- `realtime.providers.openai.voice`: id de voix OpenAI Realtime intégré. Les voix actuelles de `gpt-realtime-2` sont `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` et `cedar` ; `marin` et `cedar` sont recommandées pour la meilleure qualité.
- `realtime.transport`: `webrtc` utilise OpenAI WebRTC détenu par le client sur iOS et dans le navigateur. `provider-websocket` est détenu par le navigateur mais reste sur le relais Gateway sur iOS. `gateway-relay` conserve l’audio du fournisseur sur le Gateway ; Android utilise le temps réel uniquement pour ce transport et conserve sinon sa boucle STT/TTS native.
- `realtime.brain`: `agent-consult` achemine les appels d’outils temps réel via la politique Gateway ; `direct-tools` est le comportement de compatibilité historique des outils directs ; `none` sert à la transcription ou à l’orchestration externe.
- `realtime.consultRouting`: `provider-direct` préserve la réponse directe du fournisseur lorsqu’il ignore `openclaw_agent_consult` ; `force-agent-consult` fait acheminer par le relais Gateway les transcriptions utilisateur finalisées via OpenClaw à la place.
- `realtime.instructions`: ajoute des instructions système destinées au fournisseur au prompt temps réel intégré d’OpenClaw. Utilisez-le pour le style et le ton de la voix ; OpenClaw conserve les instructions `openclaw_agent_consult` par défaut.
- `talk.catalog` expose les modes, transports, stratégies de cerveau, formats audio temps réel et indicateurs de capacités valides de chaque fournisseur afin que les clients Talk internes puissent éviter les combinaisons non prises en charge.
- Les fournisseurs de transcription en streaming sont découverts via `talk.catalog.transcription`. Le relais Gateway actuel utilise la configuration du fournisseur de streaming Voice Call jusqu’à l’ajout de la surface de configuration dédiée à la transcription Talk.
- `speechLocale`: id de locale BCP 47 facultatif pour la reconnaissance vocale Talk sur l’appareil sur iOS/macOS. Laissez non défini pour utiliser la valeur par défaut de l’appareil.
- `outputFormat`: vaut `pcm_44100` par défaut sur macOS/iOS et `pcm_24000` sur Android (définissez `mp3_*` pour forcer le streaming MP3)

## Interface macOS

- Bascule de la barre de menus : **Talk**
- Onglet de configuration : groupe **Mode Talk** (id de voix + bascule d’interruption)
- Superposition :
  - **Écoute** : le nuage pulse avec le niveau du micro
  - **Réflexion** : animation d’enfoncement
  - **Parole** : anneaux rayonnants
  - Cliquer sur le nuage : arrêter de parler
  - Cliquer sur X : quitter le mode Talk

## Interface Android

- Bascule de l’onglet Voix : **Talk**
- **Mic** manuel et **Talk** sont des modes de capture d’exécution mutuellement exclusifs.
- Mic manuel s’arrête lorsque l’application quitte le premier plan ou que l’utilisateur quitte l’onglet Voix.
- Le mode Talk continue à s’exécuter jusqu’à ce qu’il soit désactivé ou que le nœud Android se déconnecte, et utilise le type de service de premier plan microphone d’Android lorsqu’il est actif.

## Notes

- Nécessite les autorisations Parole + Microphone.
- Talk natif utilise la session Gateway active et ne se rabat sur l’interrogation de l’historique que lorsque les événements de réponse ne sont pas disponibles.
- Talk temps réel détenu par le client utilise `talk.client.toolCall` pour `openclaw_agent_consult` au lieu d’exposer `chat.send` aux sessions détenues par le fournisseur.
- Talk de transcription seule utilise `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` et `talk.session.close` ; les clients s’abonnent à `talk.event` pour les mises à jour de transcription partielles/finales.
- Le Gateway résout la lecture Talk via `talk.speak` en utilisant le fournisseur Talk actif. Android se rabat sur le TTS système local uniquement lorsque ce RPC est indisponible.
- La lecture MLX locale sur macOS utilise l’assistant groupé `openclaw-mlx-tts` lorsqu’il est présent, ou un exécutable sur `PATH`. Définissez `OPENCLAW_MLX_TTS_BIN` pour pointer vers un binaire d’assistant personnalisé pendant le développement.
- `stability` pour `eleven_v3` est validé à `0.0`, `0.5` ou `1.0` ; les autres modèles acceptent `0..1`.
- `latency_tier` est validé à `0..4` lorsqu’il est défini.
- Android prend en charge les formats de sortie `pcm_16000`, `pcm_22050`, `pcm_24000` et `pcm_44100` pour le streaming AudioTrack à faible latence.

## Connexe

- [Réveil vocal](/fr/nodes/voicewake)
- [Audio et notes vocales](/fr/nodes/audio)
- [Compréhension des médias](/fr/nodes/media-understanding)
