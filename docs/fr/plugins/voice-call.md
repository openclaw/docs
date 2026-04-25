---
read_when:
    - Vous voulez passer un appel vocal sortant depuis OpenClaw
    - Vous configurez ou développez le plugin voice-call
summary: 'Plugin Voice Call : appels sortants + entrants via Twilio/Telnyx/Plivo (installation du plugin + configuration + CLI)'
title: Plugin Voice Call
x-i18n:
    generated_at: "2026-04-25T13:54:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb396c6e346590b742c4d0f0e4f9653982da78fc40b9650760ed10d6fcd5710c
    source_path: plugins/voice-call.md
    workflow: 15
---

Appels vocaux pour OpenClaw via un plugin. Prend en charge les appels sortants et
les conversations à plusieurs tours avec politiques entrantes.

Fournisseurs actuels :

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + transfert XML + GetInput speech)
- `mock` (développement/sans réseau)

Modèle mental rapide :

- Installer le plugin
- Redémarrer Gateway
- Configurer sous `plugins.entries.voice-call.config`
- Utiliser `openclaw voicecall ...` ou l’outil `voice_call`

## Où il s’exécute (local ou distant)

Le plugin Voice Call s’exécute **dans le processus Gateway**.

Si vous utilisez un Gateway distant, installez/configurez le plugin sur la **machine qui exécute Gateway**, puis redémarrez Gateway pour le charger.

## Installation

### Option A : installer depuis npm (recommandé)

```bash
openclaw plugins install @openclaw/voice-call
```

Redémarrez ensuite Gateway.

### Option B : installer depuis un dossier local (développement, sans copie)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Redémarrez ensuite Gateway.

## Configuration

Définissez la configuration sous `plugins.entries.voice-call.config` :

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // or "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // or TWILIO_FROM_NUMBER for Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx webhook public key from the Telnyx Mission Control Portal
            // (Base64 string; can also be set via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook server
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook security (recommended for tunnels/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Public exposure (pick one)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // optional; first registered realtime transcription provider when unset
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // optional if OPENAI_API_KEY is set
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
            provider: "google", // optional; first registered realtime voice provider when unset
            toolPolicy: "safe-read-only",
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

Vérifiez la configuration avant de tester avec un vrai fournisseur :

```bash
openclaw voicecall setup
```

La sortie par défaut est lisible dans les journaux de chat et les sessions terminal. Elle vérifie
si le plugin est activé, si le fournisseur et les identifiants sont présents, si l’exposition du Webhook
est configurée, et si un seul mode audio est actif. Utilisez
`openclaw voicecall setup --json` pour les scripts.

Pour Twilio, Telnyx et Plivo, la configuration doit se résoudre vers une URL de Webhook publique. Si l’URL
`publicUrl`, l’URL de tunnel, l’URL Tailscale ou le repli `serve` configurés se résolvent vers
la boucle locale ou un espace réseau privé, la configuration échoue au lieu de démarrer un fournisseur
qui ne peut pas recevoir de vrais Webhooks d’opérateur.

Pour un test de fumée sans surprise, exécutez :

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"
```

La deuxième commande reste un essai à blanc. Ajoutez `--yes` pour passer un court appel
sortant de notification :

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

Remarques :

- Twilio/Telnyx exigent une URL de Webhook **accessible publiquement**.
- Plivo exige une URL de Webhook **accessible publiquement**.
- `mock` est un fournisseur local de développement (sans appels réseau).
- Si d’anciennes configurations utilisent encore `provider: "log"`, `twilio.from` ou d’anciennes clés `streaming.*` OpenAI, exécutez `openclaw doctor --fix` pour les réécrire.
- Telnyx exige `telnyx.publicKey` (ou `TELNYX_PUBLIC_KEY`) sauf si `skipSignatureVerification` vaut true.
- `skipSignatureVerification` est réservé aux tests locaux.
- Si vous utilisez le niveau gratuit ngrok, définissez `publicUrl` sur l’URL ngrok exacte ; la vérification de signature est toujours appliquée.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` autorise les Webhooks Twilio avec des signatures invalides **uniquement** lorsque `tunnel.provider="ngrok"` et que `serve.bind` est en boucle locale (agent local ngrok). À utiliser uniquement pour le développement local.
- Les URL du niveau gratuit ngrok peuvent changer ou ajouter un comportement interstitiel ; si `publicUrl` dérive, les signatures Twilio échoueront. En production, préférez un domaine stable ou un funnel Tailscale.
- `realtime.enabled` démarre des conversations vocales complètes de voix à voix ; ne l’activez pas en même temps que `streaming.enabled`.
- Valeurs de sécurité par défaut pour le streaming :
  - `streaming.preStartTimeoutMs` ferme les sockets qui n’envoient jamais de trame `start` valide.
- `streaming.maxPendingConnections` limite le nombre total de sockets pré-démarrage non authentifiés.
- `streaming.maxPendingConnectionsPerIp` limite le nombre de sockets pré-démarrage non authentifiés par IP source.
- `streaming.maxConnections` limite le nombre total de sockets de flux média ouverts (en attente + actifs).
- Le repli d’exécution accepte encore ces anciennes clés voice-call pour l’instant, mais le chemin de réécriture est `openclaw doctor --fix` et la couche de compatibilité est temporaire.

## Conversations vocales en temps réel

`realtime` sélectionne un fournisseur vocal temps réel full duplex pour l’audio d’appel en direct.
Il est distinct de `streaming`, qui ne fait que transférer l’audio vers des fournisseurs
de transcription en temps réel.

Comportement actuel de l’exécution :

- `realtime.enabled` est pris en charge pour Twilio Media Streams.
- `realtime.enabled` ne peut pas être combiné avec `streaming.enabled`.
- `realtime.provider` est facultatif. S’il n’est pas défini, Voice Call utilise le premier
  fournisseur vocal temps réel enregistré.
- Les fournisseurs vocaux temps réel intégrés incluent Google Gemini Live (`google`) et
  OpenAI (`openai`), enregistrés par leurs plugins fournisseur.
- La configuration brute gérée par le fournisseur se trouve sous `realtime.providers.<providerId>`.
- Voice Call expose par défaut l’outil temps réel partagé `openclaw_agent_consult`.
  Le modèle temps réel peut l’appeler lorsque l’appelant demande un raisonnement plus approfondi,
  des informations actuelles ou les outils OpenClaw normaux.
- `realtime.toolPolicy` contrôle l’exécution de consultation :
  - `safe-read-only` : expose l’outil de consultation et limite l’agent normal à
    `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` et
    `memory_get`.
  - `owner` : expose l’outil de consultation et laisse l’agent normal utiliser la politique d’outils normale de l’agent.
  - `none` : n’expose pas l’outil de consultation. Les `realtime.tools` personnalisés sont quand même
    transmis au fournisseur temps réel.
- Les clés de session de consultation réutilisent la session vocale existante lorsqu’elle est disponible, puis
  se replient sur le numéro de téléphone de l’appelant/appelé afin que les appels de consultation de suivi conservent
  le contexte pendant l’appel.
- Si `realtime.provider` pointe vers un fournisseur non enregistré, ou si aucun fournisseur
  vocal temps réel n’est enregistré, Voice Call enregistre un avertissement et ignore
  le média temps réel au lieu de faire échouer l’ensemble du plugin.

Valeurs par défaut de Google Gemini Live temps réel :

- Clé API : `realtime.providers.google.apiKey`, `GEMINI_API_KEY`, ou
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
            instructions: "Speak briefly. Call openclaw_agent_consult before using deeper tools.",
            toolPolicy: "safe-read-only",
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

Utilisez plutôt OpenAI :

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

Consultez [fournisseur Google](/fr/providers/google) et [fournisseur OpenAI](/fr/providers/openai)
pour les options vocales temps réel spécifiques au fournisseur.

## Transcription en streaming

`streaming` sélectionne un fournisseur de transcription en temps réel pour l’audio d’appel en direct.

Comportement actuel de l’exécution :

- `streaming.provider` est facultatif. S’il n’est pas défini, Voice Call utilise le premier
  fournisseur de transcription en temps réel enregistré.
- Les fournisseurs de transcription en temps réel intégrés incluent Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) et xAI
  (`xai`), enregistrés par leurs plugins fournisseur.
- La configuration brute gérée par le fournisseur se trouve sous `streaming.providers.<providerId>`.
- Si `streaming.provider` pointe vers un fournisseur non enregistré, ou si aucun fournisseur
  de transcription en temps réel n’est enregistré, Voice Call enregistre un avertissement et
  ignore le streaming média au lieu de faire échouer l’ensemble du plugin.

Valeurs par défaut de la transcription en streaming OpenAI :

- Clé API : `streaming.providers.openai.apiKey` ou `OPENAI_API_KEY`
- modèle : `gpt-4o-transcribe`
- `silenceDurationMs` : `800`
- `vadThreshold` : `0.5`

Valeurs par défaut de la transcription en streaming xAI :

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
                apiKey: "sk-...", // optional if OPENAI_API_KEY is set
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

Utilisez plutôt xAI :

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
                apiKey: "${XAI_API_KEY}", // optional if XAI_API_KEY is set
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

## Nettoyeur des appels périmés

Utilisez `staleCallReaperSeconds` pour terminer les appels qui ne reçoivent jamais de Webhook terminal
(par exemple, des appels en mode notification qui ne se terminent jamais). La valeur par défaut est `0`
(désactivé).

Plages recommandées :

- **Production :** `120`–`300` secondes pour les flux de type notification.
- Gardez cette valeur **supérieure à `maxDurationSeconds`** afin que les appels normaux puissent
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

## Sécurité des Webhooks

Lorsqu’un proxy ou un tunnel se trouve devant Gateway, le plugin reconstruit l’URL
publique pour la vérification de signature. Ces options contrôlent quels en-têtes
transmis sont fiables.

`webhookSecurity.allowedHosts` crée une liste d’autorisations des hôtes provenant des en-têtes de transfert.

`webhookSecurity.trustForwardingHeaders` fait confiance aux en-têtes de transfert sans liste d’autorisations.

`webhookSecurity.trustedProxyIPs` ne fait confiance aux en-têtes de transfert que lorsque l’IP distante
de la requête correspond à la liste.

La protection contre la relecture des Webhooks est activée pour Twilio et Plivo. Les requêtes Webhook valides rejouées
sont reconnues mais ignorées pour les effets de bord.

Les tours de conversation Twilio incluent un jeton par tour dans les rappels `<Gather>`, afin que
les rappels vocaux périmés/rejoués ne puissent pas satisfaire un tour de transcription en attente plus récent.

Les requêtes Webhook non authentifiées sont rejetées avant la lecture du corps lorsque les en-têtes de signature requis
du fournisseur sont absents.

Le Webhook voice-call utilise le profil partagé de corps pré-authentification (64 KB / 5 secondes)
plus une limite de requêtes en vol par IP avant la vérification de signature.

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

Voice Call utilise la configuration centrale `messages.tts` pour
la synthèse vocale en streaming dans les appels. Vous pouvez la remplacer sous la configuration du plugin avec la
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

- Les anciennes clés `tts.<provider>` à l’intérieur de la configuration du plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) sont réparées par `openclaw doctor --fix` ; la configuration validée doit utiliser `tts.providers.<provider>`.
- **La synthèse vocale Microsoft est ignorée pour les appels vocaux** (l’audio de téléphonie a besoin de PCM ; le transport Microsoft actuel n’expose pas de sortie PCM pour la téléphonie).
- Le TTS central est utilisé lorsque le streaming média Twilio est activé ; sinon les appels reviennent aux voix natives du fournisseur.
- Si un flux média Twilio est déjà actif, Voice Call ne revient pas à TwiML `<Say>`. Si le TTS téléphonique n’est pas disponible dans cet état, la requête de lecture échoue au lieu de mélanger deux chemins de lecture.
- Lorsque le TTS téléphonique revient à un fournisseur secondaire, Voice Call consigne un avertissement avec la chaîne des fournisseurs (`from`, `to`, `attempts`) pour le débogage.
- Lorsque l’interruption Twilio ou l’arrêt du flux vide la file d’attente TTS en attente, les
  requêtes de lecture mises en file se terminent au lieu de laisser les appelants attendre indéfiniment
  la fin de la lecture.

### Autres exemples

Utiliser uniquement le TTS central (sans remplacement) :

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

Remplacer par ElevenLabs uniquement pour les appels (conserver la valeur par défaut centrale ailleurs) :

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

Remplacer uniquement le modèle OpenAI pour les appels (exemple de fusion profonde) :

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

La politique entrante vaut par défaut `disabled`. Pour activer les appels entrants, définissez :

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` est un filtrage à faible assurance basé sur l’identifiant d’appelant. Le plugin
normalise la valeur `From` fournie par le fournisseur et la compare à `allowFrom`.
La vérification du Webhook authentifie la livraison du fournisseur et l’intégrité de la charge utile, mais
elle ne prouve pas la propriété du numéro appelant PSTN/VoIP. Traitez `allowFrom` comme
un filtrage d’identifiant d’appelant, et non comme une identité forte de l’appelant.

Les réponses automatiques utilisent le système d’agent. Ajustez-le avec :

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Contrat de sortie vocale

Pour les réponses automatiques, Voice Call ajoute un contrat strict de sortie vocale à l’invite système :

- `{"spoken":"..."}`

Voice Call extrait ensuite le texte vocal de manière défensive :

- Ignore les charges utiles marquées comme contenu de raisonnement/erreur.
- Analyse le JSON direct, le JSON dans des blocs délimités, ou les clés `"spoken"` en ligne.
- Revient au texte brut et supprime les paragraphes d’introduction probablement liés à la planification/aux métadonnées.

Cela permet de concentrer la lecture vocale sur le texte destiné à l’appelant et évite de divulguer du texte de planification dans l’audio.

### Comportement de démarrage de conversation

Pour les appels sortants `conversation`, le traitement du premier message est lié à l’état de lecture en direct :

- L’effacement de la file d’attente lors d’une interruption et la réponse automatique ne sont supprimés que pendant la lecture active du message d’accueil initial.
- Si la lecture initiale échoue, l’appel revient à l’état `listening` et le message initial reste en file d’attente pour une nouvelle tentative.
- Pour le streaming Twilio, la lecture initiale commence à la connexion du flux sans délai supplémentaire.
- L’interruption arrête la lecture active et vide les entrées TTS Twilio mises en file mais pas encore lues. Les entrées supprimées se résolvent comme ignorées, afin que la logique de réponse suivante puisse continuer sans attendre un audio qui ne sera jamais lu.
- Les conversations vocales temps réel utilisent le tour d’ouverture propre au flux temps réel. Voice Call n’envoie pas de mise à jour TwiML `<Say>` héritée pour ce message initial, afin que les sessions sortantes `<Connect><Stream>` restent attachées.

### Délai de grâce lors de la déconnexion du flux Twilio

Lorsqu’un flux média Twilio se déconnecte, Voice Call attend `2000ms` avant de terminer automatiquement l’appel :

- Si le flux se reconnecte pendant cette fenêtre, la fin automatique est annulée.
- Si aucun flux n’est réenregistré après le délai de grâce, l’appel est terminé pour éviter les appels actifs bloqués.

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

`latency` lit `calls.jsonl` à partir du chemin de stockage voice-call par défaut. Utilisez
`--file <path>` pour pointer vers un autre journal et `--last <n>` pour limiter l’analyse
aux N derniers enregistrements (200 par défaut). La sortie inclut p50/p90/p99 pour la latence
des tours et les temps d’attente d’écoute.

## Outil d’agent

Nom de l’outil : `voice_call`

Actions :

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

Ce dépôt fournit un document de compétence correspondant à `skills/voice-call/SKILL.md`.

## RPC Gateway

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## Lié

- [Synthèse vocale](/fr/tools/tts)
- [Mode Talk](/fr/nodes/talk)
- [Voice wake](/fr/nodes/voicewake)
