---
read_when:
    - Implémentation du mode Conversation sur macOS/iOS/Android
    - Modification du comportement de voix/TTS/interruption
summary: 'Mode conversation : conversations vocales continues via STT/TTS local et voix en temps réel'
title: Mode conversation
x-i18n:
    generated_at: "2026-06-27T17:41:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 47ae6c1abc763688ab5bbea1c23c9f4f27fe2f4b13cfade61917f5a1a912f057
    source_path: nodes/talk.md
    workflow: 16
---

Le mode Talk a deux formes d’exécution :

- Le Talk natif macOS/iOS/Android utilise la reconnaissance vocale locale, le chat du Gateway et le TTS `talk.speak`. Les nœuds annoncent la capacité `talk` et déclarent les commandes `talk.*` qu’ils prennent en charge.
- Le Talk dans le navigateur utilise `talk.client.create` pour les sessions `webrtc` et `provider-websocket` appartenant au client, ou `talk.session.create` pour les sessions `gateway-relay` appartenant au Gateway. `managed-room` est réservé au transfert Gateway et aux salons talkie-walkie.
- Android Talk peut opter pour des sessions relais en temps réel appartenant au Gateway avec `talk.realtime.mode: "realtime"` et `talk.realtime.transport: "gateway-relay"`. Sinon, il reste sur la reconnaissance vocale native, le chat du Gateway et `talk.speak`.
- Les clients transcription seule utilisent `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, puis `talk.session.appendAudio`, `talk.session.cancelTurn` et `talk.session.close` lorsqu’ils ont besoin de sous-titres ou de dictée sans réponse vocale de l’assistant.

Le Talk natif est une boucle continue de conversation vocale :

1. Écouter la parole
2. Envoyer la transcription au modèle via la session active
3. Attendre la réponse
4. La prononcer via le fournisseur Talk configuré (`talk.speak`)

Le Talk en temps réel dans le navigateur transmet les appels d’outils du fournisseur via `talk.client.toolCall` ; les clients navigateur n’appellent pas directement `chat.send` pour les consultations en temps réel.
Pendant qu’une consultation en temps réel est active, les clients Talk peuvent utiliser `talk.client.steer` ou
`talk.session.steer` pour classer l’entrée vocale comme `status`, `steer`, `cancel` ou
`followup`. Le guidage accepté est mis en file dans l’exécution intégrée active ; le guidage rejeté
renvoie une raison structurée telle que `no_active_run`, `not_streaming`
ou `compacting`.

Le Talk transcription seule émet la même enveloppe d’événements Talk commune que les sessions temps réel et STT/TTS, mais utilise `mode: "transcription"` et `brain: "none"`. Il sert aux sous-titres, à la dictée et à la capture vocale en observation seule ; les notes vocales téléversées ponctuelles utilisent toujours le chemin média/audio.

## Comportement (macOS)

- **Superposition toujours active** lorsque le mode Talk est activé.
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
- `silenceTimeoutMs` : lorsqu’il n’est pas défini, Talk conserve la fenêtre de pause par défaut de la plateforme avant d’envoyer la transcription (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider` : sélectionne le fournisseur Talk actif. Utilisez `elevenlabs`, `mlx` ou `system` pour les chemins de lecture locaux à macOS.
- `providers.<provider>.voiceId` : revient à `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` pour ElevenLabs (ou à la première voix ElevenLabs lorsqu’une clé API est disponible).
- `providers.elevenlabs.modelId` : valeur par défaut `eleven_v3` lorsqu’il n’est pas défini.
- `providers.mlx.modelId` : valeur par défaut `mlx-community/Soprano-80M-bf16` lorsqu’il n’est pas défini.
- `providers.elevenlabs.apiKey` : revient à `ELEVENLABS_API_KEY` (ou au profil shell du Gateway s’il est disponible).
- `consultThinkingLevel` : remplacement facultatif du niveau de réflexion pour l’exécution complète de l’agent OpenClaw derrière les appels temps réel `openclaw_agent_consult`.
- `consultFastMode` : remplacement facultatif du mode rapide pour les appels temps réel `openclaw_agent_consult`.
- `realtime.provider` : sélectionne le fournisseur vocal temps réel navigateur/serveur actif. Utilisez `openai` pour WebRTC, `google` pour le WebSocket fournisseur, ou un fournisseur pont uniquement via le relais du Gateway.
- `realtime.providers.<provider>` stocke la configuration temps réel appartenant au fournisseur. Le navigateur ne reçoit que des identifiants de session éphémères ou contraints, jamais une clé API standard.
- `realtime.providers.openai.voice` : identifiant de voix OpenAI Realtime intégré. Les voix actuelles de `gpt-realtime-2` sont `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` et `cedar` ; `marin` et `cedar` sont recommandées pour la meilleure qualité.
- `realtime.transport` : `webrtc` et `provider-websocket` sont des transports temps réel pour navigateur. Android utilise le relais temps réel uniquement lorsque cette valeur est `gateway-relay` ; sinon Android Talk utilise sa boucle STT/TTS native.
- `realtime.brain` : `agent-consult` achemine les appels d’outils temps réel via la politique du Gateway ; `direct-tools` est le comportement de compatibilité hérité avec outils directs ; `none` sert à la transcription ou à l’orchestration externe.
- `realtime.consultRouting` : `provider-direct` conserve la réponse directe du fournisseur lorsqu’il ignore `openclaw_agent_consult` ; `force-agent-consult` fait en sorte que le relais Gateway achemine plutôt les transcriptions utilisateur finalisées via OpenClaw.
- `realtime.instructions` : ajoute des instructions système destinées au fournisseur à l’invite temps réel intégrée d’OpenClaw. Utilisez-les pour le style vocal et le ton ; OpenClaw conserve les consignes `openclaw_agent_consult` par défaut.
- `talk.catalog` expose les modes, transports, stratégies de brain, formats audio temps réel et indicateurs de capacité valides de chaque fournisseur afin que les clients Talk de première partie puissent éviter les combinaisons non prises en charge.
- Les fournisseurs de transcription en streaming sont découverts via `talk.catalog.transcription`. Le relais Gateway actuel utilise la configuration du fournisseur de streaming Voice Call jusqu’à l’ajout de la surface de configuration dédiée à la transcription Talk.
- `speechLocale` : identifiant de locale BCP 47 facultatif pour la reconnaissance vocale Talk sur l’appareil sous iOS/macOS. Laissez non défini pour utiliser la valeur par défaut de l’appareil.
- `outputFormat` : valeur par défaut `pcm_44100` sur macOS/iOS et `pcm_24000` sur Android (définissez `mp3_*` pour forcer le streaming MP3)

## Interface utilisateur macOS

- Bascule de la barre de menus : **Talk**
- Onglet de configuration : groupe **Mode Talk** (identifiant de voix + bascule d’interruption)
- Superposition :
  - **Écoute** : le nuage pulse avec le niveau du micro
  - **Réflexion** : animation d’enfoncement
  - **Parole** : anneaux rayonnants
  - Cliquer sur le nuage : arrêter la parole
  - Cliquer sur X : quitter le mode Talk

## Interface utilisateur Android

- Bascule de l’onglet Voix : **Talk**
- Les modes de capture à l’exécution manuels **Mic** et **Talk** sont mutuellement exclusifs.
- Le micro manuel s’arrête lorsque l’application quitte le premier plan ou que l’utilisateur quitte l’onglet Voix.
- Le mode Talk continue de s’exécuter jusqu’à sa désactivation ou la déconnexion du nœud Android, et utilise le type de service de premier plan microphone d’Android lorsqu’il est actif.

## Notes

- Nécessite les autorisations Parole + Microphone.
- Le Talk natif utilise la session Gateway active et ne revient à l’interrogation de l’historique que lorsque les événements de réponse ne sont pas disponibles.
- Le Talk en temps réel dans le navigateur utilise `talk.client.toolCall` pour `openclaw_agent_consult` au lieu d’exposer `chat.send` aux sessions navigateur appartenant au fournisseur.
- Le Talk transcription seule utilise `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` et `talk.session.close` ; les clients s’abonnent à `talk.event` pour les mises à jour partielles/finales de la transcription.
- Le gateway résout la lecture Talk via `talk.speak` à l’aide du fournisseur Talk actif. Android revient au TTS système local uniquement lorsque cette RPC n’est pas disponible.
- La lecture MLX locale macOS utilise l’assistant groupé `openclaw-mlx-tts` lorsqu’il est présent, ou un exécutable dans `PATH`. Définissez `OPENCLAW_MLX_TTS_BIN` pour pointer vers un binaire d’assistant personnalisé pendant le développement.
- `stability` pour `eleven_v3` est validé à `0.0`, `0.5` ou `1.0` ; les autres modèles acceptent `0..1`.
- `latency_tier` est validé à `0..4` lorsqu’il est défini.
- Android prend en charge les formats de sortie `pcm_16000`, `pcm_22050`, `pcm_24000` et `pcm_44100` pour le streaming AudioTrack à faible latence.

## Associé

- [Réveil vocal](/fr/nodes/voicewake)
- [Audio et notes vocales](/fr/nodes/audio)
- [Compréhension des médias](/fr/nodes/media-understanding)
