---
read_when:
    - Implémentation du mode conversation sur macOS/iOS/Android
    - Modification du comportement de la voix, de la synthèse vocale et des interruptions
summary: 'Mode conversation : conversations vocales continues avec STT/TTS local et voix en temps réel'
title: Mode conversationnel
x-i18n:
    generated_at: "2026-07-12T02:58:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4180dcbf7a62cd03e2d18f2c568ed2182c9cf2f80159154a7d261bcb9b3ebee0
    source_path: nodes/talk.md
    workflow: 16
---

Le mode Conversation couvre cinq architectures d’exécution :

- **Conversation native sur macOS/iOS/Android** : reconnaissance vocale locale, discussion via le Gateway et synthèse vocale avec `talk.speak`. Les Nodes annoncent la capacité `talk` et déclarent les commandes `talk.*` qu’ils prennent en charge.
- **Conversation iOS (temps réel)** : WebRTC géré par le client pour les configurations OpenAI en temps réel qui sélectionnent le transport `webrtc` ou omettent le transport. Les configurations explicites `gateway-relay`, `provider-websocket` et les configurations en temps réel autres qu’OpenAI restent sur le relais géré par le Gateway ; les configurations qui ne sont pas en temps réel utilisent la boucle vocale native.
- **Conversation dans le navigateur** : `talk.client.create` pour les sessions `webrtc`/`provider-websocket` gérées par le client, ou `talk.session.create` pour les sessions `gateway-relay` gérées par le Gateway. `managed-room` est réservé au transfert par le Gateway et aux salles de type talkie-walkie.
- **Conversation Android (temps réel)** : activez-la avec `talk.realtime.mode: "realtime"` et `talk.realtime.transport: "gateway-relay"`. Sinon, Android continue d’utiliser la reconnaissance vocale native, la discussion via le Gateway et `talk.speak`.
- **Clients de transcription uniquement** : `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, puis `talk.session.appendAudio`, `talk.session.cancelTurn` et `talk.session.close` pour le sous-titrage ou la dictée sans réponse vocale de l’assistant. Les notes vocales ponctuelles téléversées utilisent toujours le chemin audio de [compréhension des médias](/fr/nodes/media-understanding).

La Conversation native est une boucle continue : écouter la parole, envoyer la transcription au modèle via la session active, attendre la réponse, puis la lire à voix haute au moyen du fournisseur de Conversation configuré (`talk.speak`).

La Conversation en temps réel gérée par le client transmet les appels d’outils du fournisseur via `talk.client.toolCall` au lieu d’appeler directement `chat.send`. Tant qu’une consultation en temps réel est active, les clients peuvent appeler `talk.client.steer` ou `talk.session.steer` pour classer l’entrée vocale comme `status`, `steer`, `cancel` ou `followup`. Les instructions de pilotage acceptées sont mises en file d’attente dans l’exécution intégrée active ; celles qui sont refusées renvoient un motif tel que `no_active_run`, `not_streaming` ou `compacting`.

La Conversation en transcription uniquement émet la même enveloppe d’événement de Conversation que les sessions en temps réel et STT/TTS, mais utilise `mode: "transcription"` et `brain: "none"`. Toutes les sessions de Conversation diffusent des événements sur le canal `talk.event` ; les clients s’y abonnent pour recevoir les mises à jour partielles/finales de la transcription (`transcript.delta`/`transcript.done`) et d’autres données de télémétrie de session.

## Comportement (macOS)

- Superposition toujours visible lorsque le mode Conversation est activé.
- Transitions de phase **Écoute &rarr; Réflexion &rarr; Parole**.
- Lors d’une courte pause (fenêtre de silence), la transcription en cours est envoyée.
- Les réponses sont écrites dans WebChat (comme lors de la saisie).
- **Interruption par la parole** (activée par défaut) : si l’utilisateur parle pendant que l’assistant s’exprime, la lecture s’arrête et l’horodatage de l’interruption est enregistré pour la prochaine requête.

## Directives vocales dans les réponses

L’assistant peut faire précéder une réponse d’une seule ligne JSON pour contrôler la voix :

```json
{ "voice": "<voice-id>", "once": true }
```

Règles :

- Uniquement la première ligne non vide ; la ligne JSON est supprimée avant la lecture TTS.
- Les clés inconnues sont ignorées.
- `once: true` s’applique uniquement à la réponse actuelle ; sans cette option, la voix devient la nouvelle valeur par défaut du mode Conversation.

Clés prises en charge : `voice` / `voice_id` / `voiceId`, `model` / `model_id` / `modelId`, `speed`, `rate` (mots par minute), `stability`, `similarity`, `style`, `speakerBoost`, `seed`, `normalize`, `lang`, `output_format`, `latency_tier`, `once`.

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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
      instructions: "Parlez chaleureusement et donnez des réponses brèves.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

| Clé                                      | Valeur par défaut                         | Remarques                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`                               | -                                          | Fournisseur TTS actif de la Conversation. Utilisez `elevenlabs`, `mlx` ou `system` pour les chemins de lecture locale sur macOS.                                                                                                                                                                                                          |
| `providers.<id>.voiceId`                 | -                                          | ElevenLabs utilise à défaut `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`, ou la première voix disponible avec une clé API.                                                                                                                                                                                                                      |
| `providers.elevenlabs.modelId`           | `eleven_v3`                                |                                                                                                                                                                                                                                                                                                                                           |
| `providers.mlx.modelId`                  | `mlx-community/Soprano-80M-bf16`           |                                                                                                                                                                                                                                                                                                                                           |
| `providers.elevenlabs.apiKey`            | -                                          | Utilise à défaut `ELEVENLABS_API_KEY` (ou le profil d’interpréteur de commandes du Gateway s’il est disponible).                                                                                                                                                                                                                          |
| `speechLocale`                           | valeur par défaut de l’appareil            | Identifiant de paramètres régionaux BCP 47 pour la reconnaissance vocale de la Conversation sur l’appareil sous iOS/macOS.                                                                                                                                                                                                               |
| `silenceTimeoutMs`                       | `700` ms sur macOS/Android, `900` ms sur iOS | Fenêtre de pause avant que la Conversation envoie la transcription.                                                                                                                                                                                                                                                                      |
| `interruptOnSpeech`                      | `true`                                     |                                                                                                                                                                                                                                                                                                                                           |
| `outputFormat`                           | `pcm_44100` sur macOS/iOS, `pcm_24000` sur Android | Définissez `mp3_*` pour forcer la diffusion en continu au format MP3.                                                                                                                                                                                                                                                              |
| `consultThinkingLevel`                   | non défini                                 | Remplacement du niveau de réflexion pour l’exécution de l’agent sous-jacente aux appels `openclaw_agent_consult` en temps réel.                                                                                                                                                                                                           |
| `consultFastMode`                        | non défini                                 | Remplacement du mode rapide pour les appels `openclaw_agent_consult` en temps réel.                                                                                                                                                                                                                                                       |
| `realtime.provider`                      | -                                          | `openai` pour WebRTC, `google` pour le WebSocket du fournisseur, ou un fournisseur fonctionnant uniquement par pont via le relais du Gateway.                                                                                                                                                                                            |
| `realtime.providers.<id>`                | -                                          | Configuration en temps réel gérée par le fournisseur. Les navigateurs reçoivent uniquement des identifiants de session éphémères/restreints, jamais une clé API standard.                                                                                                                                                                |
| `realtime.providers.openai.speakerVoice` | `alloy`                                    | Identifiant de voix OpenAI Realtime intégré (l’ancienne clé `voice` fonctionne toujours, mais elle est obsolète). Voix actuelles de `gpt-realtime-2.1` : `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `marin`, `sage`, `shimmer`, `verse` ; `marin` et `cedar` sont recommandées pour une qualité optimale. |
| `realtime.transport`                     | -                                          | `webrtc` : WebRTC OpenAI géré par le client sur iOS et dans le navigateur. `provider-websocket` : géré par le navigateur, mais reste sur le relais du Gateway sous iOS. `gateway-relay` : conserve le flux audio du fournisseur sur le Gateway ; Android utilise le temps réel uniquement avec ce transport.                           |
| `realtime.brain`                         | -                                          | `agent-consult` achemine les appels d’outils en temps réel via la politique du Gateway ; `direct-tools` assure la compatibilité héritée avec les outils directs ; `none` est destiné à la transcription ou à l’orchestration externe.                                                                                                      |
| `realtime.consultRouting`                | -                                          | `provider-direct` conserve la réponse directe du fournisseur lorsqu’il ignore `openclaw_agent_consult` ; `force-agent-consult` achemine à la place les transcriptions utilisateur finalisées via OpenClaw.                                                                                                                               |
| `realtime.instructions`                  | -                                          | Ajoute des instructions système destinées au fournisseur à l’invite en temps réel intégrée d’OpenClaw (style/ton de la voix) ; les instructions par défaut de `openclaw_agent_consult` sont conservées.                                                                                                                                    |

`talk.catalog` expose les identifiants canoniques des fournisseurs et les alias du registre, les modes/transports/stratégies de cerveau/formats audio en temps réel/indicateurs de capacité valides de chaque fournisseur, ainsi que le résultat de disponibilité sélectionné à l’exécution. Les clients Talk propriétaires doivent consulter ce catalogue au lieu de gérer localement les alias des fournisseurs ; considérez un ancien Gateway qui omet la disponibilité du groupe comme non vérifié plutôt que comme définitivement non configuré. Les fournisseurs de transcription en streaming sont découverts via `talk.catalog.transcription` ; le relais actuel du Gateway utilise la configuration du fournisseur de streaming de Voice Call jusqu’à la mise à disposition d’une surface de configuration dédiée à la transcription Talk.

## Interface macOS

- Bouton de la barre des menus : **Talk**
- Onglet de configuration : groupe **Talk Mode** (identifiant vocal + bouton d’interruption)
- Superposition : l’orbe affiche la forme d’onde universelle de Talk (partagée avec iOS, watchOS et Android). Lors de l’écoute, elle suit le niveau du microphone en direct ; lors de la parole, elle suit l’enveloppe réelle de lecture TTS ; pendant la réflexion, elle respire doucement. Cliquez sur l’orbe pour mettre en pause ou reprendre, double-cliquez pour arrêter la parole, puis cliquez sur X pour quitter le mode Talk.

## Interface Android

- Bouton de l’onglet vocal : **Talk**
- Les modes de capture manuels **Mic** et **Talk** sont mutuellement exclusifs.
- Le microphone manuel et le mode Talk en temps réel privilégient le microphone d’un casque Bluetooth Classic ou BLE connecté ; en cas de déconnexion, l’application demande une autre entrée de casque ou utilise par défaut le microphone par défaut, puis rétablit la préférence par défaut une fois la capture terminée.
- Le microphone manuel s’arrête lorsque l’application quitte le premier plan ou que l’utilisateur quitte l’onglet vocal.
- Le mode Talk continue de fonctionner jusqu’à sa désactivation ou jusqu’à la déconnexion du Node, en utilisant le type de service de premier plan d’Android destiné au microphone lorsqu’il est actif.
- Android prend en charge les formats de sortie `pcm_16000`, `pcm_22050`, `pcm_24000` et `pcm_44100` pour le streaming `AudioTrack` à faible latence.

## Remarques

- Nécessite les autorisations de reconnaissance vocale et d’accès au microphone.
- Le mode Talk natif utilise la session active du Gateway et ne recourt à l’interrogation de l’historique que lorsque les événements de réponse ne sont pas disponibles.
- Le Gateway gère la lecture de Talk via `talk.speak` en utilisant le fournisseur Talk actif. Android ne recourt au TTS local du système que lorsque ce RPC n’est pas disponible.
- La lecture MLX locale sous macOS utilise l’utilitaire `openclaw-mlx-tts` inclus lorsqu’il est présent, ou un exécutable disponible dans `PATH`. Définissez `OPENCLAW_MLX_TTS_BIN` pour indiquer un binaire d’utilitaire personnalisé pendant le développement.
- Plages de valeurs des directives vocales (ElevenLabs) : `stability`, `similarity` et `style` acceptent `0..1` ; `speed` accepte `0.5..2` ; `latency_tier` accepte `0..4`.

## Voir aussi

- [Activation vocale](/fr/nodes/voicewake)
- [Audio et notes vocales](/fr/nodes/audio)
- [Compréhension des médias](/fr/nodes/media-understanding)
