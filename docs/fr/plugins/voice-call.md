---
read_when:
    - Vous voulez passer un appel vocal sortant depuis OpenClaw
    - Vous configurez ou développez le plugin voice-call
summary: 'Plugin Voice Call : appels sortants + entrants via Twilio/Telnyx/Plivo (installation du Plugin + configuration + CLI)'
title: Plugin Voice Call
x-i18n:
    generated_at: "2026-04-23T07:08:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fbfe1aba459dd4fbe1b5c100430ff8cbe8987d7d34b875d115afcaee6e56412
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (Plugin)

Appels vocaux pour OpenClaw via un Plugin. Prend en charge les notifications sortantes et
les conversations multi-tours avec politiques entrantes.

Fournisseurs actuels :

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + transfert XML + GetInput speech)
- `mock` (développement/sans réseau)

Modèle mental rapide :

- Installer le Plugin
- Redémarrer la Gateway
- Configurer sous `plugins.entries.voice-call.config`
- Utiliser `openclaw voicecall ...` ou l’outil `voice_call`

## Où il s’exécute (local vs distant)

Le Plugin Voice Call s’exécute **dans le processus Gateway**.

Si vous utilisez une Gateway distante, installez/configurez le Plugin sur la **machine qui exécute la Gateway**, puis redémarrez la Gateway pour le charger.

## Installation

### Option A : installation depuis npm (recommandé)

```bash
openclaw plugins install @openclaw/voice-call
```

Redémarrez ensuite la Gateway.

### Option B : installation depuis un dossier local (développement, sans copie)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Redémarrez ensuite la Gateway.

## Configuration

Définissez la configuration sous `plugins.entries.voice-call.config` :

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // or "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234",
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
        },
      },
    },
  },
}
```

Remarques :

- Twilio/Telnyx nécessitent une URL Webhook **accessible publiquement**.
- Plivo nécessite une URL Webhook **accessible publiquement**.
- `mock` est un fournisseur de développement local (sans appels réseau).
- Si d’anciennes configurations utilisent encore `provider: "log"`, `twilio.from` ou des clés OpenAI héritées `streaming.*`, exécutez `openclaw doctor --fix` pour les réécrire.
- Telnyx nécessite `telnyx.publicKey` (ou `TELNYX_PUBLIC_KEY`) sauf si `skipSignatureVerification` vaut true.
- `skipSignatureVerification` est réservé aux tests locaux.
- Si vous utilisez le niveau gratuit ngrok, définissez `publicUrl` sur l’URL ngrok exacte ; la vérification de signature est toujours appliquée.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` autorise les Webhooks Twilio avec signatures invalides **uniquement** lorsque `tunnel.provider="ngrok"` et que `serve.bind` est loopback (agent local ngrok). À utiliser uniquement pour le développement local.
- Les URL du niveau gratuit ngrok peuvent changer ou ajouter un comportement interstitiel ; si `publicUrl` dérive, les signatures Twilio échoueront. En production, préférez un domaine stable ou un funnel Tailscale.
- Valeurs par défaut de sécurité du streaming :
  - `streaming.preStartTimeoutMs` ferme les sockets qui n’envoient jamais de trame `start` valide.
- `streaming.maxPendingConnections` limite le nombre total de sockets pré-démarrage non authentifiés.
- `streaming.maxPendingConnectionsPerIp` limite les sockets pré-démarrage non authentifiés par IP source.
- `streaming.maxConnections` limite le nombre total de sockets de flux média ouverts (en attente + actifs).
- Le repli runtime accepte encore pour l’instant ces anciennes clés voice-call, mais le chemin de réécriture est `openclaw doctor --fix` et le shim de compatibilité est temporaire.

## Transcription en streaming

`streaming` sélectionne un fournisseur de transcription temps réel pour l’audio des appels live.

Comportement runtime actuel :

- `streaming.provider` est optionnel. S’il n’est pas défini, Voice Call utilise le premier
  fournisseur de transcription temps réel enregistré.
- Les fournisseurs de transcription temps réel inclus comprennent Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) et xAI
  (`xai`), enregistrés par leurs Plugins fournisseurs.
- La configuration brute détenue par le fournisseur se trouve sous `streaming.providers.<providerId>`.
- Si `streaming.provider` pointe vers un fournisseur non enregistré, ou si aucun fournisseur
  de transcription temps réel n’est enregistré, Voice Call journalise un avertissement et
  ignore le streaming média au lieu de faire échouer tout le Plugin.

Valeurs par défaut de transcription en streaming OpenAI :

- Clé API : `streaming.providers.openai.apiKey` ou `OPENAI_API_KEY`
- modèle : `gpt-4o-transcribe`
- `silenceDurationMs` : `800`
- `vadThreshold` : `0.5`

Valeurs par défaut de transcription en streaming xAI :

- Clé API : `streaming.providers.xai.apiKey` ou `XAI_API_KEY`
- point de terminaison : `wss://api.x.ai/v1/stt`
- `encoding` : `mulaw`
- `sampleRate` : `8000`
- `endpointingMs` : `800`
- `interimResults` : `true`

Exemple :

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

Utiliser xAI à la place :

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

Les anciennes clés sont encore migrées automatiquement par `openclaw doctor --fix` :

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Nettoyeur d’appels obsolètes

Utilisez `staleCallReaperSeconds` pour terminer les appels qui ne reçoivent jamais de Webhook terminal
(par exemple les appels en mode notify qui ne se terminent jamais). La valeur par défaut est `0`
(désactivé).

Plages recommandées :

- **Production :** `120`–`300` secondes pour les flux de style notification.
- Gardez cette valeur **supérieure à `maxDurationSeconds`** afin que les appels normaux puissent
  se terminer. Un bon point de départ est `maxDurationSeconds + 30–60` secondes.

Exemple :

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

Lorsqu’un proxy ou un tunnel se trouve devant la Gateway, le Plugin reconstruit l’URL
publique pour la vérification de signature. Ces options contrôlent quels en-têtes transférés sont fiables.

`webhookSecurity.allowedHosts` met en liste d’autorisation les hôtes des en-têtes de transfert.

`webhookSecurity.trustForwardingHeaders` fait confiance aux en-têtes transférés sans liste d’autorisation.

`webhookSecurity.trustedProxyIPs` ne fait confiance aux en-têtes transférés que lorsque l’IP distante
de la requête correspond à la liste.

La protection contre la relecture de Webhook est activée pour Twilio et Plivo. Les requêtes Webhook
rejouées mais valides sont reconnues mais ignorées pour les effets de bord.

Les tours de conversation Twilio incluent un jeton par tour dans les callbacks `<Gather>`, de sorte
que les callbacks de parole obsolètes/rejoués ne peuvent pas satisfaire un tour de transcription en attente plus récent.

Les requêtes Webhook non authentifiées sont rejetées avant lecture du corps lorsque les en-têtes de signature requis
par le fournisseur sont absents.

Le Webhook voice-call utilise le profil partagé de corps pré-authentification (64 KB / 5 secondes)
plus un plafond de requêtes en vol par IP avant la vérification de signature.

Exemple avec un hôte public stable :

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

Voice Call utilise la configuration cœur `messages.tts` pour la
parole en streaming sur les appels. Vous pouvez la remplacer sous la configuration du Plugin avec la
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

Remarques :

- Les anciennes clés `tts.<provider>` dans la configuration du Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) sont migrées automatiquement vers `tts.providers.<provider>` au chargement. Préférez la forme `providers` dans la configuration conservée.
- **Microsoft speech est ignoré pour les appels vocaux** (l’audio téléphonique nécessite du PCM ; le transport Microsoft actuel n’expose pas de sortie PCM téléphonique).
- Le TTS du cœur est utilisé lorsque le streaming média Twilio est activé ; sinon les appels reviennent aux voix natives du fournisseur.
- Si un flux média Twilio est déjà actif, Voice Call ne revient pas à TwiML `<Say>`. Si le TTS téléphonique n’est pas disponible dans cet état, la requête de lecture échoue au lieu de mélanger deux chemins de lecture.
- Lorsque le TTS téléphonique bascule vers un fournisseur secondaire, Voice Call journalise un avertissement avec la chaîne de fournisseurs (`from`, `to`, `attempts`) pour le débogage.

### Plus d’exemples

Utiliser uniquement le TTS du cœur (sans remplacement) :

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

Remplacer par ElevenLabs uniquement pour les appels (garder la valeur par défaut du cœur ailleurs) :

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

Remplacer uniquement le modèle OpenAI pour les appels (exemple de fusion profonde) :

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

La politique entrante vaut par défaut `disabled`. Pour activer les appels entrants, définissez :

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` est un filtrage d’identifiant d’appelant à faible assurance. Le Plugin
normalise la valeur `From` fournie par le fournisseur et la compare à `allowFrom`.
La vérification Webhook authentifie la livraison du fournisseur et l’intégrité de la charge utile, mais
elle ne prouve pas la propriété du numéro appelant PSTN/VoIP. Traitez `allowFrom` comme un filtrage
d’identifiant d’appelant, et non comme une identité forte de l’appelant.

Les réponses automatiques utilisent le système agent. Réglez-les avec :

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Contrat de sortie vocale

Pour les réponses automatiques, Voice Call ajoute un contrat strict de sortie vocale au prompt système :

- `{"spoken":"..."}`

Voice Call extrait ensuite le texte vocal de manière défensive :

- Ignore les charges utiles marquées comme contenu de raisonnement/erreur.
- Analyse le JSON direct, le JSON encadré ou les clés `"spoken"` en ligne.
- Revient au texte brut et supprime les paragraphes d’introduction probablement liés à la planification/aux métadonnées.

Cela permet de garder la lecture vocale centrée sur le texte destiné à l’appelant et d’éviter les fuites de texte de planification dans l’audio.

### Comportement au démarrage de conversation

Pour les appels sortants `conversation`, la gestion du premier message est liée à l’état de lecture live :

- L’effacement de la file en cas d’interruption vocale et la réponse automatique sont supprimés uniquement pendant que le message d’accueil initial est activement en cours de lecture.
- Si la lecture initiale échoue, l’appel revient à `listening` et le message initial reste en file pour une nouvelle tentative.
- La lecture initiale pour le streaming Twilio démarre à la connexion du flux sans délai supplémentaire.

### Délai de grâce à la déconnexion du flux Twilio

Lorsqu’un flux média Twilio se déconnecte, Voice Call attend `2000ms` avant de terminer automatiquement l’appel :

- Si le flux se reconnecte pendant cette fenêtre, la fin automatique est annulée.
- Si aucun flux n’est réenregistré après le délai de grâce, l’appel est terminé pour éviter les appels actifs bloqués.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

`latency` lit `calls.jsonl` depuis le chemin de stockage voice-call par défaut. Utilisez
`--file <path>` pour pointer vers un autre journal et `--last <n>` pour limiter l’analyse
aux N derniers enregistrements (200 par défaut). La sortie inclut p50/p90/p99 pour la
latence des tours et les temps d’attente en écoute.

## Outil agent

Nom de l’outil : `voice_call`

Actions :

- `initiate_call` (`message`, `to?`, `mode?`)
- `continue_call` (`callId`, `message`)
- `speak_to_user` (`callId`, `message`)
- `end_call` (`callId`)
- `get_status` (`callId`)

Ce dépôt inclut un document de Skill correspondant dans `skills/voice-call/SKILL.md`.

## RPC Gateway

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)
