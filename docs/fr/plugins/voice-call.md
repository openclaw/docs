---
read_when:
    - Vous souhaitez passer un appel vocal sortant depuis OpenClaw
    - Vous configurez ou développez le plugin voice-call
summary: 'Plugin Voice Call : appels sortants + entrants via Twilio/Telnyx/Plivo (installation du plugin + configuration + CLI)'
title: Plugin Voice Call
x-i18n:
    generated_at: "2026-04-24T09:51:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6aed4e33ce090c86f43c71280f033e446f335c53d42456fdc93c9938250e9af6
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (plugin)

Appels vocaux pour OpenClaw via un plugin. Prend en charge les notifications sortantes et les conversations multi-tours avec des politiques entrantes.

Fournisseurs actuels :

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + transfert XML + reconnaissance vocale GetInput)
- `mock` (développement/sans réseau)

Modèle mental rapide :

- Installer le plugin
- Redémarrer le Gateway
- Configurer sous `plugins.entries.voice-call.config`
- Utiliser `openclaw voicecall ...` ou l’outil `voice_call`

## Où il s’exécute (local ou distant)

Le plugin Voice Call s’exécute **dans le processus Gateway**.

Si vous utilisez un Gateway distant, installez/configurez le plugin sur la **machine qui exécute le Gateway**, puis redémarrez le Gateway pour le charger.

## Installation

### Option A : installer depuis npm (recommandé)

```bash
openclaw plugins install @openclaw/voice-call
```

Redémarrez ensuite le Gateway.

### Option B : installer depuis un dossier local (développement, sans copie)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Redémarrez ensuite le Gateway.

## Configuration

Définissez la configuration sous `plugins.entries.voice-call.config` :

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // ou "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // ou TWILIO_FROM_NUMBER pour Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Clé publique de webhook Telnyx depuis le portail Telnyx Mission Control
            // (chaîne Base64 ; peut aussi être définie via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Serveur Webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Sécurité Webhook (recommandée pour les tunnels/proxys)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Exposition publique (choisissez-en une)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // facultatif ; premier fournisseur de transcription temps réel enregistré si non défini
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // facultatif si OPENAI_API_KEY est défini
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },

          realtime: {
            enabled: false,
            provider: "google", // facultatif ; premier fournisseur vocal temps réel enregistré si non défini
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

Remarques :

- Twilio/Telnyx nécessitent une URL de Webhook **accessible publiquement**.
- Plivo nécessite une URL de Webhook **accessible publiquement**.
- `mock` est un fournisseur de développement local (sans appels réseau).
- Si d’anciennes configurations utilisent encore `provider: "log"`, `twilio.from` ou d’anciennes clés OpenAI `streaming.*`, exécutez `openclaw doctor --fix` pour les réécrire.
- Telnyx nécessite `telnyx.publicKey` (ou `TELNYX_PUBLIC_KEY`) sauf si `skipSignatureVerification` vaut true.
- `skipSignatureVerification` est réservé aux tests locaux.
- Si vous utilisez l’offre gratuite ngrok, définissez `publicUrl` sur l’URL ngrok exacte ; la vérification de signature est toujours appliquée.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` autorise les Webhooks Twilio avec des signatures invalides **uniquement** lorsque `tunnel.provider="ngrok"` et `serve.bind` est en loopback (agent local ngrok). À utiliser uniquement pour le développement local.
- Les URL ngrok gratuites peuvent changer ou ajouter un comportement interstitiel ; si `publicUrl` dérive, les signatures Twilio échoueront. En production, préférez un domaine stable ou un funnel Tailscale.
- `realtime.enabled` démarre des conversations vocales complètes de bout en bout ; ne l’activez pas en même temps que `streaming.enabled`.
- Paramètres de sécurité par défaut pour le streaming :
  - `streaming.preStartTimeoutMs` ferme les sockets qui n’envoient jamais de trame `start` valide.
- `streaming.maxPendingConnections` limite le nombre total de sockets pré-démarrage non authentifiés.
- `streaming.maxPendingConnectionsPerIp` limite le nombre de sockets pré-démarrage non authentifiés par IP source.
- `streaming.maxConnections` limite le nombre total de sockets de flux média ouverts (en attente + actifs).
- Le repli d’exécution accepte encore ces anciennes clés voice-call pour le moment, mais la voie de réécriture est `openclaw doctor --fix` et la couche de compatibilité est temporaire.

## Conversations vocales temps réel

`realtime` sélectionne un fournisseur vocal temps réel full duplex pour l’audio des appels en direct.
Il est distinct de `streaming`, qui ne transfère l’audio qu’aux fournisseurs
de transcription temps réel.

Comportement actuel à l’exécution :

- `realtime.enabled` est pris en charge pour Twilio Media Streams.
- `realtime.enabled` ne peut pas être combiné avec `streaming.enabled`.
- `realtime.provider` est facultatif. S’il n’est pas défini, Voice Call utilise le premier
  fournisseur vocal temps réel enregistré.
- Les fournisseurs vocaux temps réel inclus comprennent Google Gemini Live (`google`) et
  OpenAI (`openai`), enregistrés par leurs plugins de fournisseur.
- La configuration brute propre au fournisseur se trouve sous `realtime.providers.<providerId>`.
- Si `realtime.provider` pointe vers un fournisseur non enregistré, ou si aucun fournisseur vocal
  temps réel n’est enregistré, Voice Call journalise un avertissement et ignore
  les médias temps réel au lieu de faire échouer tout le plugin.

Valeurs par défaut temps réel pour Google Gemini Live :

- Clé API : `realtime.providers.google.apiKey`, `GEMINI_API_KEY` ou
  `GOOGLE_GENERATIVE_AI_API_KEY`
- modèle : `gemini-2.5-flash-native-audio-preview-12-2025`
- voix : `Kore`

Exemple :

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          provider: "twilio",
          inboundPolicy: "allowlist",
          allowFrom: ["+15550005678"],
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Parlez brièvement et demandez avant d’utiliser des outils.",
            providers: {
              google: {
                apiKey: "${GEMINI_API_KEY}",
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

Utiliser OpenAI à la place :

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          realtime: {
            enabled: true,
            provider: "openai",
            providers: {
              openai: {
                apiKey: "${OPENAI_API_KEY}",
              },
            },
          },
        },
      },
    },
  },
}
```

Voir [fournisseur Google](/fr/providers/google) et [fournisseur OpenAI](/fr/providers/openai)
pour les options vocales temps réel spécifiques au fournisseur.

## Transcription en streaming

`streaming` sélectionne un fournisseur de transcription temps réel pour l’audio des appels en direct.

Comportement actuel à l’exécution :

- `streaming.provider` est facultatif. S’il n’est pas défini, Voice Call utilise le premier
  fournisseur de transcription temps réel enregistré.
- Les fournisseurs de transcription temps réel inclus comprennent Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) et xAI
  (`xai`), enregistrés par leurs plugins de fournisseur.
- La configuration brute propre au fournisseur se trouve sous `streaming.providers.<providerId>`.
- Si `streaming.provider` pointe vers un fournisseur non enregistré, ou si aucun fournisseur de transcription
  temps réel n’est enregistré, Voice Call journalise un avertissement et
  ignore le streaming média au lieu de faire échouer tout le plugin.

Valeurs par défaut pour la transcription en streaming OpenAI :

- Clé API : `streaming.providers.openai.apiKey` ou `OPENAI_API_KEY`
- modèle : `gpt-4o-transcribe`
- `silenceDurationMs` : `800`
- `vadThreshold` : `0.5`

Valeurs par défaut pour la transcription en streaming xAI :

- Clé API : `streaming.providers.xai.apiKey` ou `XAI_API_KEY`
- point de terminaison : `wss://api.x.ai/v1/stt`
- `encoding` : `mulaw`
- `sampleRate` : `8000`
- `endpointingMs` : `800`
- `interimResults` : `true`

Exemple :

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "openai",
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // facultatif si OPENAI_API_KEY est défini
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
          },
        },
      },
    },
  },
}
```

Utiliser xAI à la place :

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "xai",
            streamPath: "/voice/stream",
            providers: {
              xai: {
                apiKey: "${XAI_API_KEY}", // facultatif si XAI_API_KEY est défini
                endpointingMs: 800,
                language: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

Les anciennes clés sont encore migrées automatiquement par `openclaw doctor --fix` :

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Nettoyeur d’appels obsolètes

Utilisez `staleCallReaperSeconds` pour terminer les appels qui ne reçoivent jamais de Webhook terminal
(par exemple, les appels en mode notification qui ne se terminent jamais). La valeur par défaut est `0`
(désactivé).

Plages recommandées :

- **Production :** `120`–`300` secondes pour les flux de type notification.
- Gardez cette valeur **supérieure à `maxDurationSeconds`** pour que les appels normaux puissent
  se terminer. Un bon point de départ est `maxDurationSeconds + 30–60` secondes.

Exemple :

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Sécurité Webhook

Lorsqu’un proxy ou un tunnel est placé devant le Gateway, le plugin reconstruit l’URL
publique pour la vérification de signature. Ces options contrôlent quels en-têtes
transmis sont dignes de confiance.

`webhookSecurity.allowedHosts` met sur liste autorisée les hôtes provenant des en-têtes de transfert.

`webhookSecurity.trustForwardingHeaders` fait confiance aux en-têtes de transfert sans liste autorisée.

`webhookSecurity.trustedProxyIPs` ne fait confiance aux en-têtes de transfert que lorsque l’IP distante
de la requête correspond à la liste.

La protection contre la relecture des Webhooks est activée pour Twilio et Plivo. Les requêtes Webhook
valides rejouées sont reconnues mais ignorées pour les effets de bord.

Les tours de conversation Twilio incluent un jeton par tour dans les rappels `<Gather>`, afin que
les rappels vocaux obsolètes ou rejoués ne puissent pas satisfaire un nouveau tour de transcription en attente.

Les requêtes Webhook non authentifiées sont rejetées avant la lecture du corps lorsque les en-têtes
de signature requis par le fournisseur sont absents.

Le Webhook voice-call utilise le profil partagé de corps pré-authentification (64 KB / 5 secondes)
ainsi qu’une limite par IP sur les requêtes en vol avant la vérification de signature.

Exemple avec un hôte public stable :

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## TTS pour les appels

Voice Call utilise la configuration principale `messages.tts` pour
la synthèse vocale en streaming lors des appels. Vous pouvez la redéfinir dans la configuration du plugin avec la
**même structure** — elle est fusionnée en profondeur avec `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

Remarques :

- Les anciennes clés `tts.<provider>` dans la configuration du plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) sont migrées automatiquement vers `tts.providers.<provider>` au chargement. Préférez la structure `providers` dans la configuration versionnée.
- **Microsoft speech est ignoré pour les appels vocaux** (l’audio téléphonique nécessite du PCM ; le transport Microsoft actuel n’expose pas de sortie PCM pour la téléphonie).
- Le TTS principal est utilisé lorsque le streaming média Twilio est activé ; sinon les appels reviennent aux voix natives du fournisseur.
- Si un flux média Twilio est déjà actif, Voice Call ne revient pas à TwiML `<Say>`. Si le TTS téléphonique n’est pas disponible dans cet état, la demande de lecture échoue au lieu de mélanger deux chemins de lecture.
- Lorsque le TTS téléphonique revient à un fournisseur secondaire, Voice Call journalise un avertissement avec la chaîne de fournisseurs (`from`, `to`, `attempts`) pour le débogage.

### Autres exemples

Utiliser uniquement le TTS principal (sans redéfinition) :

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```

Redéfinir vers ElevenLabs uniquement pour les appels (conserver la valeur par défaut principale ailleurs) :

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```

Redéfinir uniquement le modèle OpenAI pour les appels (exemple de fusion en profondeur) :

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```

## Appels entrants

La politique entrante est `disabled` par défaut. Pour activer les appels entrants, définissez :

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Bonjour ! Comment puis-je vous aider ?",
}
```

`inboundPolicy: "allowlist"` est un filtrage à faible assurance basé sur l’identifiant de l’appelant. Le plugin
normalise la valeur `From` fournie par le fournisseur et la compare à `allowFrom`.
La vérification du Webhook authentifie la livraison par le fournisseur et l’intégrité de la charge utile, mais
elle ne prouve pas la possession du numéro appelant PSTN/VoIP. Considérez `allowFrom` comme
un filtrage d’identifiant d’appelant, et non comme une identité forte de l’appelant.

Les réponses automatiques utilisent le système d’agent. Ajustez avec :

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Contrat de sortie vocale

Pour les réponses automatiques, Voice Call ajoute un contrat strict de sortie vocale au prompt système :

- `{"spoken":"..."}`

Voice Call extrait ensuite le texte vocal de manière défensive :

- Ignore les charges utiles marquées comme contenu de raisonnement/erreur.
- Analyse du JSON direct, du JSON délimité, ou des clés `"spoken"` en ligne.
- Revient au texte brut et supprime les paragraphes d’introduction probables de planification/métadonnées.

Cela permet de concentrer la lecture vocale sur le texte destiné à l’appelant et d’éviter que du texte de planification ne fuite dans l’audio.

### Comportement au démarrage de la conversation

Pour les appels sortants `conversation`, la gestion du premier message est liée à l’état de lecture en direct :

- L’effacement de la file d’attente pour interruption et la réponse automatique sont supprimés uniquement pendant que le message d’accueil initial est en cours de lecture.
- Si la lecture initiale échoue, l’appel revient à l’état `listening` et le message initial reste en file d’attente pour une nouvelle tentative.
- La lecture initiale pour le streaming Twilio démarre à la connexion du flux sans délai supplémentaire.

### Délai de grâce après déconnexion du flux Twilio

Lorsqu’un flux média Twilio se déconnecte, Voice Call attend `2000ms` avant de terminer automatiquement l’appel :

- Si le flux se reconnecte pendant cette fenêtre, la fin automatique est annulée.
- Si aucun flux n’est réenregistré après le délai de grâce, l’appel est terminé pour éviter des appels actifs bloqués.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

`latency` lit `calls.jsonl` depuis le chemin de stockage voice-call par défaut. Utilisez
`--file <path>` pour pointer vers un autre journal et `--last <n>` pour limiter l’analyse
aux N derniers enregistrements (200 par défaut). La sortie inclut p50/p90/p99 pour la
latence des tours et les temps d’attente d’écoute.

## Outil d’agent

Nom de l’outil : `voice_call`

Actions :

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

Ce dépôt inclut un document Skills correspondant dans `skills/voice-call/SKILL.md`.

## RPC Gateway

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## Liens associés

- [Synthèse vocale](/fr/tools/tts)
- [Mode Talk](/fr/nodes/talk)
- [Réveil vocal](/fr/nodes/voicewake)
