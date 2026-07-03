---
read_when:
    - Implémenter le mode Conversation sur macOS/iOS/Android
    - Modifier le comportement de voix/TTS/interruption
summary: 'Mode conversation : conversations vocales continues avec STT/TTS local et voix en temps réel'
title: Mode conversation
x-i18n:
    generated_at: "2026-07-03T09:33:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9c8cdb6ffef7575348e94b36cd73a0613c336d8e811d6ce46d7518ee7c34b14
    source_path: nodes/talk.md
    workflow: 16
---

Le mode Conversation a deux formes d’exécution :

- La Conversation native macOS/iOS/Android utilise la reconnaissance vocale locale, le chat Gateway et le TTS `talk.speak`. Les nœuds annoncent la capacité `talk` et déclarent les commandes `talk.*` qu’ils prennent en charge.
- La Conversation iOS utilise WebRTC côté client pour les configurations OpenAI en temps réel qui sélectionnent `webrtc` ou omettent le transport. Les configurations en temps réel explicites `gateway-relay`, `provider-websocket` et non OpenAI restent sur le relais géré par Gateway ; les configurations qui ne sont pas en temps réel utilisent la boucle vocale native.
- La Conversation dans le navigateur utilise `talk.client.create` pour les sessions `webrtc` et `provider-websocket` côté client, ou `talk.session.create` pour les sessions `gateway-relay` gérées par Gateway. `managed-room` est réservé au transfert Gateway et aux salons talkie-walkie.
- La Conversation Android peut opter pour des sessions de relais en temps réel gérées par Gateway avec `talk.realtime.mode: "realtime"` et `talk.realtime.transport: "gateway-relay"`. Sinon, elle reste sur la reconnaissance vocale native, le chat Gateway et `talk.speak`.
- Les clients de transcription seule utilisent `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, puis `talk.session.appendAudio`, `talk.session.cancelTurn` et `talk.session.close` lorsqu’ils ont besoin de sous-titres ou de dictée sans réponse vocale de l’assistant.

La Conversation native est une boucle continue de conversation vocale :

1. Écouter la parole
2. Envoyer la transcription au modèle via la session active
3. Attendre la réponse
4. La prononcer via le fournisseur Conversation configuré (`talk.speak`)

La Conversation en temps réel côté client transmet les appels d’outils du fournisseur via `talk.client.toolCall` ; ces clients n’appellent pas directement `chat.send` pour les consultations en temps réel.
Pendant qu’une consultation en temps réel est active, les clients Conversation peuvent utiliser `talk.client.steer` ou
`talk.session.steer` pour classer l’entrée vocale comme `status`, `steer`, `cancel` ou
`followup`. Le guidage accepté est mis en file d’attente dans l’exécution intégrée active ; le
guidage rejeté renvoie une raison structurée telle que `no_active_run`, `not_streaming`
ou `compacting`.

La Conversation de transcription seule émet la même enveloppe commune d’événements Conversation que les sessions en temps réel et STT/TTS, mais utilise `mode: "transcription"` et `brain: "none"`. Elle sert aux sous-titres, à la dictée et à la capture vocale en observation seule ; les notes vocales téléversées ponctuelles utilisent toujours le chemin média/audio.

## Comportement (macOS)

- **Superposition toujours active** tant que le mode Conversation est activé.
- Transitions de phase **Écoute → Réflexion → Parole**.
- Lors d’une **courte pause** (fenêtre de silence), la transcription actuelle est envoyée.
- Les réponses sont **écrites dans WebChat** (comme lors de la saisie).
- **Interruption à la parole** (activée par défaut) : si l’utilisateur commence à parler pendant que l’assistant parle, nous arrêtons la lecture et notons l’horodatage de l’interruption pour la prochaine invite.

## Directives vocales dans les réponses

L’assistant peut préfixer sa réponse avec une **seule ligne JSON** pour contrôler la voix :

```json
{ "voice": "<voice-id>", "once": true }
```

Règles :

- Première ligne non vide uniquement.
- Les clés inconnues sont ignorées.
- `once: true` s’applique uniquement à la réponse actuelle.
- Sans `once`, la voix devient la nouvelle valeur par défaut du mode Conversation.
- La ligne JSON est retirée avant la lecture TTS.

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

- `interruptOnSpeech` : true
- `silenceTimeoutMs` : lorsqu’il n’est pas défini, Conversation conserve la fenêtre de pause par défaut de la plateforme avant d’envoyer la transcription (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider` : sélectionne le fournisseur Conversation actif. Utilisez `elevenlabs`, `mlx` ou `system` pour les chemins de lecture locaux macOS.
- `providers.<provider>.voiceId` : se rabat sur `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` pour ElevenLabs (ou sur la première voix ElevenLabs lorsqu’une clé API est disponible).
- `providers.elevenlabs.modelId` : vaut par défaut `eleven_v3` lorsqu’il n’est pas défini.
- `providers.mlx.modelId` : vaut par défaut `mlx-community/Soprano-80M-bf16` lorsqu’il n’est pas défini.
- `providers.elevenlabs.apiKey` : se rabat sur `ELEVENLABS_API_KEY` (ou sur le profil shell Gateway s’il est disponible).
- `consultThinkingLevel` : remplacement facultatif du niveau de réflexion pour l’exécution complète de l’agent OpenClaw derrière les appels `openclaw_agent_consult` en temps réel.
- `consultFastMode` : remplacement facultatif du mode rapide pour les appels `openclaw_agent_consult` en temps réel.
- `realtime.provider` : sélectionne le fournisseur vocal en temps réel actif. Utilisez `openai` pour WebRTC, `google` pour le WebSocket fournisseur, ou un fournisseur uniquement pont via le relais Gateway.
- `realtime.providers.<provider>` stocke la configuration en temps réel détenue par le fournisseur. Le navigateur ne reçoit que des identifiants de session éphémères ou contraints, jamais une clé API standard.
- `realtime.providers.openai.voice` : identifiant de voix OpenAI Realtime intégré. Les voix `gpt-realtime-2` actuelles sont `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` et `cedar` ; `marin` et `cedar` sont recommandées pour une qualité optimale.
- `realtime.transport` : `webrtc` utilise OpenAI WebRTC côté client sur iOS et dans le navigateur. `provider-websocket` est géré côté navigateur mais reste sur le relais Gateway sur iOS. `gateway-relay` conserve l’audio du fournisseur sur Gateway ; Android n’utilise le temps réel que pour ce transport et conserve sinon sa boucle STT/TTS native.
- `realtime.brain` : `agent-consult` route les appels d’outils en temps réel via la politique Gateway ; `direct-tools` est le comportement de compatibilité hérité des outils directs ; `none` sert à la transcription ou à l’orchestration externe.
- `realtime.consultRouting` : `provider-direct` conserve la réponse directe du fournisseur lorsqu’il ignore `openclaw_agent_consult` ; `force-agent-consult` force le relais Gateway à router les transcriptions utilisateur finalisées via OpenClaw à la place.
- `realtime.instructions` : ajoute des instructions système destinées au fournisseur à l’invite en temps réel intégrée d’OpenClaw. Utilisez-le pour le style vocal et le ton ; OpenClaw conserve les consignes `openclaw_agent_consult` par défaut.
- `talk.catalog` expose les identifiants de fournisseur canoniques et les alias de registre avec les modes, transports, stratégies brain, formats audio en temps réel, indicateurs de capacité et le résultat de disponibilité sélectionné à l’exécution valides pour chaque fournisseur. Les clients Conversation de première partie doivent utiliser ce catalogue au lieu de maintenir localement des alias de fournisseur ; un Gateway plus ancien qui omet la disponibilité de groupe est non vérifié plutôt que définitivement non configuré.
- Les fournisseurs de transcription en streaming sont découverts via `talk.catalog.transcription`. Le relais Gateway actuel utilise la configuration du fournisseur de streaming Voice Call jusqu’à l’ajout de la surface de configuration dédiée à la transcription Conversation.
- `speechLocale` : identifiant de locale BCP 47 facultatif pour la reconnaissance vocale Conversation sur l’appareil sur iOS/macOS. Laissez-le non défini pour utiliser la valeur par défaut de l’appareil.
- `outputFormat` : vaut par défaut `pcm_44100` sur macOS/iOS et `pcm_24000` sur Android (définissez `mp3_*` pour forcer le streaming MP3)

## Interface macOS

- Bascule de la barre de menus : **Conversation**
- Onglet de configuration : groupe **Mode Conversation** (identifiant de voix + bascule d’interruption)
- Superposition :
  - **Écoute** : le nuage pulse avec le niveau du micro
  - **Réflexion** : animation descendante
  - **Parole** : anneaux rayonnants
  - Cliquer sur le nuage : arrêter la parole
  - Cliquer sur X : quitter le mode Conversation

## Interface Android

- Bascule de l’onglet Voix : **Conversation**
- Les modes de capture d’exécution manuels **Micro** et **Conversation** sont mutuellement exclusifs.
- Le micro manuel et la Conversation en temps réel préfèrent le microphone d’un casque Bluetooth Classic ou BLE connecté. S’il se déconnecte, l’application demande une autre entrée casque ou laisse Android utiliser le microphone par défaut ; l’arrêt de la capture restaure la préférence de microphone par défaut.
- Le micro manuel s’arrête lorsque l’application quitte le premier plan ou que l’utilisateur quitte l’onglet Voix.
- Le mode Conversation continue à fonctionner jusqu’à sa désactivation ou la déconnexion du nœud Android, et utilise le type de service de premier plan microphone d’Android pendant son activité.

## Notes

- Nécessite les autorisations Parole + Microphone.
- La Conversation native utilise la session Gateway active et ne se rabat sur l’interrogation de l’historique que lorsque les événements de réponse ne sont pas disponibles.
- La Conversation en temps réel côté client utilise `talk.client.toolCall` pour `openclaw_agent_consult` au lieu d’exposer `chat.send` aux sessions détenues par le fournisseur.
- La Conversation de transcription seule utilise `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` et `talk.session.close` ; les clients s’abonnent à `talk.event` pour les mises à jour de transcription partielles/finales.
- Le Gateway résout la lecture Conversation via `talk.speak` en utilisant le fournisseur Conversation actif. Android ne se rabat sur le TTS système local que lorsque ce RPC n’est pas disponible.
- La lecture MLX locale macOS utilise l’assistant groupé `openclaw-mlx-tts` lorsqu’il est présent, ou un exécutable sur `PATH`. Définissez `OPENCLAW_MLX_TTS_BIN` pour pointer vers un binaire d’assistant personnalisé pendant le développement.
- `stability` pour `eleven_v3` est validé à `0.0`, `0.5` ou `1.0` ; les autres modèles acceptent `0..1`.
- `latency_tier` est validé à `0..4` lorsqu’il est défini.
- Android prend en charge les formats de sortie `pcm_16000`, `pcm_22050`, `pcm_24000` et `pcm_44100` pour le streaming AudioTrack à faible latence.

## Connexe

- [Réveil vocal](/fr/nodes/voicewake)
- [Audio et notes vocales](/fr/nodes/audio)
- [Compréhension des médias](/fr/nodes/media-understanding)
