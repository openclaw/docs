---
read_when:
    - Implémentation du mode conversation sur macOS/iOS/Android
    - Modification du comportement de la voix, de la synthèse vocale et des interruptions
summary: 'Mode conversation : conversations vocales continues via STT/TTS local et la voix en temps réel'
title: Mode conversationnel
x-i18n:
    generated_at: "2026-07-12T15:28:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4180dcbf7a62cd03e2d18f2c568ed2182c9cf2f80159154a7d261bcb9b3ebee0
    source_path: nodes/talk.md
    workflow: 16
---

Le mode Talk couvre cinq formes d’exécution :

- **Talk natif sur macOS/iOS/Android** : reconnaissance vocale locale, conversation via le Gateway et synthèse vocale TTS avec `talk.speak`. Les Nodes annoncent la capacité `talk` et déclarent les commandes `talk.*` qu’ils prennent en charge.
- **Talk sur iOS (temps réel)** : WebRTC géré par le client pour les configurations OpenAI en temps réel qui sélectionnent le transport `webrtc` ou omettent le transport. Les configurations explicites `gateway-relay`, `provider-websocket` et les configurations en temps réel autres qu’OpenAI restent sur le relais géré par le Gateway ; les configurations non temps réel utilisent la boucle vocale native.
- **Talk dans le navigateur** : `talk.client.create` pour les sessions `webrtc`/`provider-websocket` gérées par le client, ou `talk.session.create` pour les sessions `gateway-relay` gérées par le Gateway. `managed-room` est réservé au transfert vers le Gateway et aux salons de type talkie-walkie.
- **Talk sur Android (temps réel)** : activez-le avec `talk.realtime.mode: "realtime"` et `talk.realtime.transport: "gateway-relay"`. Sinon, Android continue d’utiliser la reconnaissance vocale native, la conversation via le Gateway et `talk.speak`.
- **Clients de transcription uniquement** : `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, puis `talk.session.appendAudio`, `talk.session.cancelTurn` et `talk.session.close` pour le sous-titrage ou la dictée sans réponse vocale de l’assistant. Les notes vocales téléversées ponctuellement utilisent toujours le chemin audio de la [compréhension des médias](/fr/nodes/media-understanding).

Le mode Talk natif est une boucle continue : écouter la parole, envoyer la transcription au modèle via la session active, attendre la réponse, puis la prononcer au moyen du fournisseur Talk configuré (`talk.speak`).

Le mode Talk en temps réel géré par le client transmet les appels d’outils du fournisseur via `talk.client.toolCall` au lieu d’appeler directement `chat.send`. Tant qu’une consultation en temps réel est active, les clients peuvent appeler `talk.client.steer` ou `talk.session.steer` afin de classer l’entrée vocale comme `status`, `steer`, `cancel` ou `followup`. Les instructions de guidage acceptées sont placées dans la file d’attente de l’exécution intégrée active ; celles qui sont rejetées renvoient un motif tel que `no_active_run`, `not_streaming` ou `compacting`.

Le mode Talk de transcription uniquement émet la même enveloppe d’événement Talk que les sessions en temps réel et STT/TTS, mais utilise `mode: "transcription"` et `brain: "none"`. Toutes les sessions Talk diffusent des événements sur le canal `talk.event` ; les clients s’y abonnent pour recevoir les mises à jour partielles/finales de la transcription (`transcript.delta`/`transcript.done`) et les autres données de télémétrie de la session.

## Comportement (macOS)

- Superposition toujours visible lorsque le mode Talk est activé.
- Transitions entre les phases **Écoute &rarr; Réflexion &rarr; Parole**.
- Après une courte pause (fenêtre de silence), la transcription en cours est envoyée.
- Les réponses sont écrites dans WebChat (comme lors de la saisie).
- **Interruption par la parole** (activée par défaut) : si l’utilisateur parle pendant que l’assistant s’exprime, la lecture s’arrête et l’horodatage de l’interruption est enregistré pour la prochaine invite.

## Directives vocales dans les réponses

L’assistant peut préfixer une réponse par une seule ligne JSON afin de contrôler la voix :

```json
{ "voice": "<voice-id>", "once": true }
```

Règles :

- Uniquement la première ligne non vide ; la ligne JSON est supprimée avant la lecture TTS.
- Les clés inconnues sont ignorées.
- `once: true` s’applique uniquement à la réponse en cours ; sans cette option, la voix devient la nouvelle valeur par défaut du mode Talk.

Clés prises en charge : `voice` / `voice_id` / `voiceId`, `model` / `model_id` / `modelId`, `speed`, `rate` (mots/min), `stability`, `similarity`, `style`, `speakerBoost`, `seed`, `normalize`, `lang`, `output_format`, `latency_tier`, `once`.

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

| Clé                                      | Valeur par défaut                          | Remarques                                                                                                                                                                                                                                                                 |
| ---------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`                               | -                                          | Fournisseur TTS Talk actif. Utilisez `elevenlabs`, `mlx` ou `system` pour les chemins de lecture locale sur macOS.                                                                                                                                                        |
| `providers.<id>.voiceId`                 | -                                          | ElevenLabs utilise à défaut `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`, ou la première voix disponible avec une clé API.                                                                                                                                                     |
| `providers.elevenlabs.modelId`           | `eleven_v3`                                |                                                                                                                                                                                                                                                                           |
| `providers.mlx.modelId`                  | `mlx-community/Soprano-80M-bf16`           |                                                                                                                                                                                                                                                                           |
| `providers.elevenlabs.apiKey`            | -                                          | Utilise à défaut `ELEVENLABS_API_KEY` (ou le profil d’interpréteur du Gateway s’il est disponible).                                                                                                                                                                      |
| `speechLocale`                           | valeur par défaut de l’appareil            | Identifiant de paramètres régionaux BCP 47 pour la reconnaissance vocale Talk sur l’appareil sous iOS/macOS.                                                                                                                                                             |
| `silenceTimeoutMs`                       | `700` ms macOS/Android, `900` ms iOS       | Fenêtre de pause avant que Talk envoie la transcription.                                                                                                                                                                                                                  |
| `interruptOnSpeech`                      | `true`                                     |                                                                                                                                                                                                                                                                           |
| `outputFormat`                           | `pcm_44100` macOS/iOS, `pcm_24000` Android | Définissez `mp3_*` pour forcer la diffusion en continu au format MP3.                                                                                                                                                                                                     |
| `consultThinkingLevel`                   | non défini                                 | Remplacement du niveau de réflexion pour l’exécution de l’agent derrière les appels `openclaw_agent_consult` en temps réel.                                                                                                                                              |
| `consultFastMode`                        | non défini                                 | Remplacement du mode rapide pour les appels `openclaw_agent_consult` en temps réel.                                                                                                                                                                                       |
| `realtime.provider`                      | -                                          | `openai` pour WebRTC, `google` pour le WebSocket du fournisseur, ou un fournisseur servant uniquement de pont via le relais du Gateway.                                                                                                                                 |
| `realtime.providers.<id>`                | -                                          | Configuration en temps réel gérée par le fournisseur. Les navigateurs ne reçoivent que des identifiants de session éphémères/restreints, jamais une clé API standard.                                                                                                    |
| `realtime.providers.openai.speakerVoice` | `alloy`                                    | Identifiant de voix OpenAI Realtime intégré (l’ancienne clé `voice` fonctionne toujours, mais elle est obsolète). Voix actuelles de `gpt-realtime-2.1` : `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `marin`, `sage`, `shimmer`, `verse` ; `marin` et `cedar` sont recommandées pour une qualité optimale. |
| `realtime.transport`                     | -                                          | `webrtc` : WebRTC OpenAI géré par le client sous iOS et dans le navigateur. `provider-websocket` : géré par le navigateur, reste sur le relais du Gateway sous iOS. `gateway-relay` : conserve l’audio du fournisseur sur le Gateway ; Android utilise le temps réel uniquement avec ce transport. |
| `realtime.brain`                         | -                                          | `agent-consult` achemine les appels d’outils en temps réel via la politique du Gateway ; `direct-tools` assure la compatibilité avec les anciens outils directs ; `none` est destiné à la transcription ou à l’orchestration externe.                                      |
| `realtime.consultRouting`                | -                                          | `provider-direct` conserve la réponse directe du fournisseur lorsqu’il ignore `openclaw_agent_consult` ; `force-agent-consult` achemine plutôt les transcriptions utilisateur finalisées via OpenClaw.                                                                   |
| `realtime.instructions`                  | -                                          | Ajoute des instructions système destinées au fournisseur à l’invite en temps réel intégrée d’OpenClaw (style/ton de la voix) ; les instructions par défaut de `openclaw_agent_consult` sont conservées.                                                                   |

`talk.catalog` expose les identifiants canoniques des fournisseurs et les alias du registre, les modes/transports/stratégies de cerveau/formats audio en temps réel/indicateurs de capacités valides de chaque fournisseur, ainsi que le résultat de disponibilité sélectionné à l’exécution. Les clients Talk officiels doivent consulter ce catalogue au lieu de gérer localement les alias des fournisseurs ; considérez un ancien Gateway qui omet la disponibilité du groupe comme non vérifié plutôt que comme définitivement non configuré. Les fournisseurs de transcription en streaming sont découverts via `talk.catalog.transcription` ; le relais Gateway actuel utilise la configuration du fournisseur de streaming Voice Call jusqu’à la livraison d’une surface de configuration dédiée à la transcription Talk.

## Interface macOS

- Bouton de la barre des menus : **Talk**
- Onglet de configuration : groupe **Talk Mode** (identifiant vocal + bouton d’interruption)
- Superposition : l’orbe affiche la forme d’onde universelle de Talk (partagée avec iOS, watchOS et Android). Lors de l’écoute, elle suit le niveau du microphone en direct ; lors de la parole, elle suit l’enveloppe réelle de lecture TTS ; lors de la réflexion, elle pulse doucement. Cliquez sur l’orbe pour mettre en pause/reprendre, double-cliquez pour arrêter la parole, cliquez sur X pour quitter le mode Talk.

## Interface Android

- Bouton de l’onglet Voice : **Talk**
- Les modes manuels **Mic** et **Talk** sont des modes de capture mutuellement exclusifs.
- Le mode Mic manuel et le mode Talk en temps réel privilégient le microphone d’un casque Bluetooth Classic ou BLE connecté ; s’il se déconnecte, l’application demande une autre entrée de casque ou utilise le microphone par défaut, puis rétablit la préférence par défaut une fois la capture arrêtée.
- Le mode Mic manuel s’arrête lorsque l’application quitte le premier plan ou que l’utilisateur quitte l’onglet Voice.
- Le mode Talk continue de fonctionner jusqu’à ce qu’il soit désactivé ou que le Node se déconnecte, en utilisant le type de service de premier plan d’Android dédié au microphone pendant son activité.
- Android prend en charge les formats de sortie `pcm_16000`, `pcm_22050`, `pcm_24000` et `pcm_44100` pour le streaming `AudioTrack` à faible latence.

## Remarques

- Nécessite les autorisations de reconnaissance vocale et d’accès au microphone.
- Le mode Talk natif utilise la session Gateway active et ne recourt à l’interrogation de l’historique que lorsque les événements de réponse sont indisponibles.
- Le Gateway résout la lecture Talk via `talk.speak` en utilisant le fournisseur Talk actif. Android ne recourt au TTS local du système que lorsque ce RPC est indisponible.
- La lecture MLX locale sous macOS utilise l’utilitaire `openclaw-mlx-tts` inclus lorsqu’il est présent, ou un exécutable disponible dans `PATH`. Définissez `OPENCLAW_MLX_TTS_BIN` pour désigner un binaire d’utilitaire personnalisé pendant le développement.
- Plages de valeurs des directives vocales (ElevenLabs) : `stability`, `similarity` et `style` acceptent `0..1` ; `speed` accepte `0.5..2` ; `latency_tier` accepte `0..4`.

## Voir aussi

- [Activation vocale](/fr/nodes/voicewake)
- [Audio et notes vocales](/fr/nodes/audio)
- [Compréhension des médias](/fr/nodes/media-understanding)
