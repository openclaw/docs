---
read_when:
    - Vous voulez passer un appel vocal sortant depuis OpenClaw
    - Vous configurez ou développez le Plugin d’appels vocaux
    - Vous avez besoin de voix en temps réel ou de transcription en continu pour la téléphonie
sidebarTitle: Voice call
summary: Passez des appels vocaux sortants et acceptez des appels vocaux entrants via Twilio, Telnyx ou Plivo, avec voix en temps réel et transcription en continu facultatives
title: Plugin d’appel vocal
x-i18n:
    generated_at: "2026-04-30T07:42:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7976b84ce1ee6e29706e595a4a25337632b34a9bb8f7cecdee1d6f833a8ce932
    source_path: plugins/voice-call.md
    workflow: 16
---

Appels vocaux pour OpenClaw via un Plugin. Prend en charge les notifications sortantes,
les conversations multi-tours, la voix realtime en full-duplex, la transcription
en streaming et les appels entrants avec des politiques de liste d’autorisation.

**Fournisseurs actuels :** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (développement/sans réseau).

<Note>
Le Plugin Voice Call s’exécute **à l’intérieur du processus Gateway**. Si vous utilisez un
Gateway distant, installez et configurez le Plugin sur la machine qui exécute
le Gateway, puis redémarrez le Gateway pour le charger.
</Note>

## Démarrage rapide

<Steps>
  <Step title="Install the plugin">
    <Tabs>
      <Tab title="From npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="From a local folder (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Si npm signale que le paquet appartenant à OpenClaw est obsolète, cette version du paquet
    provient d’une ancienne série de paquets externes ; utilisez un build OpenClaw
    empaqueté actuel ou le chemin du dossier local jusqu’à la publication d’un paquet npm plus récent.

    Redémarrez ensuite le Gateway afin que le Plugin se charge.

  </Step>
  <Step title="Configure provider and webhook">
    Définissez la configuration sous `plugins.entries.voice-call.config` (voir
    [Configuration](#configuration) ci-dessous pour la structure complète). Au minimum :
    `provider`, les identifiants du fournisseur, `fromNumber` et une URL de Webhook
    accessible publiquement.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    La sortie par défaut est lisible dans les journaux de chat et les terminaux. Elle vérifie
    l’activation du Plugin, les identifiants du fournisseur, l’exposition du Webhook et le fait
    qu’un seul mode audio (`streaming` ou `realtime`) soit actif. Utilisez
    `--json` pour les scripts.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Les deux commandes sont des exécutions à blanc par défaut. Ajoutez `--yes` pour passer réellement
    un bref appel de notification sortant :

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Pour Twilio, Telnyx et Plivo, la configuration doit aboutir à une **URL de Webhook publique**.
Si `publicUrl`, l’URL du tunnel, l’URL Tailscale ou le repli de service
aboutit à une adresse local loopback ou à un espace de réseau privé, la configuration échoue au lieu de
démarrer un fournisseur qui ne peut pas recevoir les Webhooks des opérateurs.
</Warning>

## Configuration

Si `enabled: true` mais que le fournisseur sélectionné n’a pas les identifiants requis,
le démarrage du Gateway journalise un avertissement de configuration incomplète avec les clés manquantes et
ignore le démarrage du runtime. Les commandes, les appels RPC et les outils d’agent
renvoient toujours la configuration fournisseur manquante exacte lorsqu’ils sont utilisés.

<Note>
Les identifiants voice-call acceptent les SecretRefs. `plugins.entries.voice-call.config.twilio.authToken` et `plugins.entries.voice-call.config.tts.providers.*.apiKey` sont résolus via la surface SecretRef standard ; voir [Surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface).
</Note>

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
            // Telnyx webhook public key from the Mission Control Portal
            // (Base64; can also be set via TELNYX_PUBLIC_KEY).
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
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* see Streaming transcription */ },
          realtime: { enabled: false /* see Realtime voice */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Provider exposure and security notes">
    - Twilio, Telnyx et Plivo exigent tous une URL de Webhook **accessible publiquement**.
    - `mock` est un fournisseur de développement local (aucun appel réseau).
    - Telnyx exige `telnyx.publicKey` (ou `TELNYX_PUBLIC_KEY`) sauf si `skipSignatureVerification` vaut true.
    - `skipSignatureVerification` est réservé aux tests locaux.
    - Sur l’offre gratuite de ngrok, définissez `publicUrl` sur l’URL ngrok exacte ; la vérification de signature est toujours appliquée.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` autorise les Webhooks Twilio avec des signatures non valides **uniquement** lorsque `tunnel.provider="ngrok"` et que `serve.bind` est local loopback (agent local ngrok). Développement local uniquement.
    - Les URL de l’offre gratuite de ngrok peuvent changer ou ajouter un écran intermédiaire ; si `publicUrl` dérive, les signatures Twilio échouent. Production : préférez un domaine stable ou un funnel Tailscale.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` ferme les sockets qui n’envoient jamais de trame `start` valide.
    - `streaming.maxPendingConnections` plafonne le nombre total de sockets pré-démarrage non authentifiés.
    - `streaming.maxPendingConnectionsPerIp` plafonne les sockets pré-démarrage non authentifiés par adresse IP source.
    - `streaming.maxConnections` plafonne le nombre total de sockets de flux média ouverts (en attente + actifs).

  </Accordion>
  <Accordion title="Legacy config migrations">
    Les anciennes configurations utilisant `provider: "log"`, `twilio.from` ou des clés OpenAI
    `streaming.*` héritées sont réécrites par `openclaw doctor --fix`.
    Le repli runtime accepte encore les anciennes clés voice-call pour le moment, mais
    le chemin de réécriture est `openclaw doctor --fix` et le shim de compatibilité est
    temporaire.

    Clés de streaming migrées automatiquement :

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Conversations vocales realtime

`realtime` sélectionne un fournisseur de voix realtime full-duplex pour l’audio
d’appel en direct. Il est distinct de `streaming`, qui transmet seulement l’audio aux
fournisseurs de transcription realtime.

<Warning>
`realtime.enabled` ne peut pas être combiné avec `streaming.enabled`. Choisissez un seul
mode audio par appel.
</Warning>

Comportement runtime actuel :

- `realtime.enabled` est pris en charge pour Twilio Media Streams.
- `realtime.provider` est facultatif. S’il n’est pas défini, Voice Call utilise le premier fournisseur de voix realtime enregistré.
- Fournisseurs de voix realtime inclus : Google Gemini Live (`google`) et OpenAI (`openai`), enregistrés par leurs Plugins fournisseurs.
- La configuration brute détenue par le fournisseur se trouve sous `realtime.providers.<providerId>`.
- Voice Call expose par défaut l’outil realtime partagé `openclaw_agent_consult`. Le modèle realtime peut l’appeler lorsque l’appelant demande un raisonnement plus approfondi, des informations actuelles ou des outils OpenClaw normaux.
- Si `realtime.provider` pointe vers un fournisseur non enregistré, ou si aucun fournisseur de voix realtime n’est enregistré, Voice Call journalise un avertissement et ignore le média realtime au lieu de faire échouer tout le Plugin.
- Les clés de session de consultation réutilisent la session vocale existante lorsqu’elle est disponible, puis se rabattent sur le numéro de téléphone de l’appelant/du destinataire afin que les appels de consultation de suivi conservent le contexte pendant l’appel.

### Politique des outils

`realtime.toolPolicy` contrôle l’exécution de consultation :

| Politique        | Comportement                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Expose l’outil de consultation et limite l’agent standard à `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` et `memory_get`. |
| `owner`          | Expose l’outil de consultation et laisse l’agent standard utiliser la politique d’outils d’agent normale.                               |
| `none`           | N’expose pas l’outil de consultation. Les `realtime.tools` personnalisés sont toujours transmis au fournisseur realtime.                 |

### Exemples de fournisseurs realtime

<Tabs>
  <Tab title="Google Gemini Live">
    Valeurs par défaut : clé API depuis `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` ou `GOOGLE_GENERATIVE_AI_API_KEY` ; modèle
    `gemini-2.5-flash-native-audio-preview-12-2025` ; voix `Kore`.

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

  </Tab>
  <Tab title="OpenAI">
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
                  openai: { apiKey: "${OPENAI_API_KEY}" },
                },
              },
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

Consultez [fournisseur Google](/fr/providers/google) et
[fournisseur OpenAI](/fr/providers/openai) pour les options de voix realtime
propres aux fournisseurs.

## Transcription en streaming

`streaming` sélectionne un fournisseur de transcription realtime pour l’audio d’appel en direct.

Comportement runtime actuel :

- `streaming.provider` est facultatif. S’il n’est pas défini, Voice Call utilise le premier fournisseur de transcription realtime enregistré.
- Fournisseurs de transcription realtime inclus : Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) et xAI (`xai`), enregistrés par leurs Plugins fournisseurs.
- La configuration brute détenue par le fournisseur se trouve sous `streaming.providers.<providerId>`.
- Si `streaming.provider` pointe vers un fournisseur non enregistré, ou si aucun n’est enregistré, Voice Call journalise un avertissement et ignore le streaming média au lieu de faire échouer tout le Plugin.

### Exemples de fournisseurs de streaming

<Tabs>
  <Tab title="OpenAI">
    Valeurs par défaut : clé API `streaming.providers.openai.apiKey` ou
    `OPENAI_API_KEY` ; modèle `gpt-4o-transcribe` ; `silenceDurationMs: 800` ;
    `vadThreshold: 0.5`.

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

  </Tab>
  <Tab title="xAI">
    Valeurs par défaut : clé API `streaming.providers.xai.apiKey` ou `XAI_API_KEY` ;
    endpoint `wss://api.x.ai/v1/stt` ; encodage `mulaw` ; fréquence d'échantillonnage `8000` ;
    `endpointingMs: 800` ; `interimResults: true`.

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

  </Tab>
</Tabs>

## TTS pour les appels

Voice Call utilise la configuration centrale `messages.tts` pour la parole en streaming
sur les appels. Vous pouvez la remplacer dans la configuration du Plugin avec la
**même forme** : elle est fusionnée en profondeur avec `messages.tts`.

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

<Warning>
**Microsoft speech est ignoré pour les appels vocaux.** L'audio téléphonique nécessite du PCM ;
le transport Microsoft actuel n'expose pas de sortie PCM téléphonique.
</Warning>

Notes de comportement :

- Les anciennes clés `tts.<provider>` dans la configuration du Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) sont réparées par `openclaw doctor --fix` ; la configuration validée doit utiliser `tts.providers.<provider>`.
- Le TTS central est utilisé lorsque le streaming multimédia Twilio est activé ; sinon, les appels reviennent aux voix natives du fournisseur.
- Si un flux multimédia Twilio est déjà actif, Voice Call ne revient pas à TwiML `<Say>`. Si le TTS téléphonique n'est pas disponible dans cet état, la demande de lecture échoue au lieu de mélanger deux chemins de lecture.
- Lorsque le TTS téléphonique revient à un fournisseur secondaire, Voice Call journalise un avertissement avec la chaîne de fournisseurs (`from`, `to`, `attempts`) pour le débogage.
- Lorsque l'interruption Twilio ou le démontage du flux efface la file TTS en attente, les demandes de lecture en file se terminent au lieu de laisser les appelants attendre la fin de la lecture.

### Exemples TTS

<Tabs>
  <Tab title="Core TTS only">
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
  </Tab>
  <Tab title="Override to ElevenLabs (calls only)">
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
  </Tab>
  <Tab title="OpenAI model override (deep-merge)">
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
  </Tab>
</Tabs>

## Appels entrants

La politique entrante utilise `disabled` par défaut. Pour activer les appels entrants, définissez :

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` est un filtrage d'identifiant d'appelant à faible assurance. Le
Plugin normalise la valeur `From` fournie par le fournisseur et la compare à
`allowFrom`. La vérification du Webhook authentifie la livraison par le fournisseur et
l'intégrité de la charge utile, mais elle ne prouve **pas** la propriété du numéro
d'appelant PSTN/VoIP. Traitez `allowFrom` comme un filtrage d'identifiant d'appelant, et non comme une identité
forte de l'appelant.
</Warning>

Les réponses automatiques utilisent le système d'agent. Ajustez-les avec `responseModel`,
`responseSystemPrompt` et `responseTimeoutMs`.

### Contrat de sortie vocale

Pour les réponses automatiques, Voice Call ajoute un contrat strict de sortie vocale à
l'invite système :

```text
{"spoken":"..."}
```

Voice Call extrait le texte vocal de manière défensive :

- Ignore les charges utiles marquées comme contenu de raisonnement/erreur.
- Analyse le JSON direct, le JSON encadré ou les clés `"spoken"` en ligne.
- Revient au texte brut et supprime les paragraphes d'introduction probablement liés à la planification ou aux métadonnées.

Cela maintient la lecture vocale centrée sur le texte destiné à l'appelant et évite
de divulguer du texte de planification dans l'audio.

### Comportement au démarrage de la conversation

Pour les appels `conversation` sortants, la gestion du premier message est liée à l'état de
lecture en direct :

- L'effacement de la file d'interruption et la réponse automatique ne sont supprimés que pendant que le message d'accueil initial est activement prononcé.
- Si la lecture initiale échoue, l'appel revient à `listening` et le message initial reste en file pour une nouvelle tentative.
- La lecture initiale pour le streaming Twilio démarre à la connexion du flux sans délai supplémentaire.
- L'interruption annule la lecture active et efface les entrées TTS Twilio en file mais pas encore en cours de lecture. Les entrées effacées se résolvent comme ignorées, de sorte que la logique de réponse de suivi peut continuer sans attendre un audio qui ne sera jamais lu.
- Les conversations vocales en temps réel utilisent le tour d'ouverture propre au flux en temps réel. Voice Call ne publie **pas** de mise à jour TwiML `<Say>` héritée pour ce message initial, afin que les sessions `<Connect><Stream>` sortantes restent attachées.

### Délai de grâce de déconnexion du flux Twilio

Lorsqu'un flux multimédia Twilio se déconnecte, Voice Call attend **2000 ms** avant
de terminer automatiquement l'appel :

- Si le flux se reconnecte pendant cette fenêtre, la fin automatique est annulée.
- Si aucun flux ne se réenregistre après la période de grâce, l'appel est terminé pour éviter les appels actifs bloqués.

## Nettoyeur d'appels obsolètes

Utilisez `staleCallReaperSeconds` pour terminer les appels qui ne reçoivent jamais de
Webhook terminal (par exemple, les appels en mode notification qui ne se terminent jamais). La valeur par défaut
est `0` (désactivé).

Plages recommandées :

- **Production :** `120`–`300` secondes pour les flux de type notification.
- Gardez cette valeur **supérieure à `maxDurationSeconds`** afin que les appels normaux puissent se terminer. Un bon point de départ est `maxDurationSeconds + 30–60` secondes.

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

## Sécurité des Webhook

Lorsqu'un proxy ou un tunnel se trouve devant le Gateway, le Plugin
reconstruit l'URL publique pour la vérification de signature. Ces options
contrôlent quels en-têtes transférés sont approuvés :

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Hôtes autorisés issus des en-têtes de transfert.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Approuver les en-têtes transférés sans liste d'autorisation.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Approuver les en-têtes transférés uniquement lorsque l'IP distante de la requête correspond à la liste.
</ParamField>

Protections supplémentaires :

- La **protection contre la relecture** des Webhook est activée pour Twilio et Plivo. Les requêtes Webhook valides relues sont acquittées mais ignorées pour les effets de bord.
- Les tours de conversation Twilio incluent un jeton par tour dans les rappels `<Gather>`, afin que les rappels vocaux obsolètes ou relus ne puissent pas satisfaire un tour de transcription en attente plus récent.
- Les requêtes Webhook non authentifiées sont rejetées avant la lecture du corps lorsque les en-têtes de signature requis par le fournisseur sont absents.
- Le Webhook voice-call utilise le profil de corps préauthentification partagé (64 Ko / 5 secondes), plus une limite par IP des requêtes en cours avant la vérification de signature.

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
openclaw voicecall latency                      # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

`latency` lit `calls.jsonl` depuis le chemin de stockage voice-call par défaut.
Utilisez `--file <path>` pour pointer vers un autre journal et `--last <n>` pour limiter
l'analyse aux N derniers enregistrements (200 par défaut). La sortie inclut p50/p90/p99
pour la latence des tours et les temps d'attente d'écoute.

## Outil d'agent

Nom de l'outil : `voice_call`.

| Action          | Arguments                 |
| --------------- | ------------------------- |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `send_dtmf`     | `callId`, `digits`        |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

Ce dépôt inclut une documentation de Skills correspondante à `skills/voice-call/SKILL.md`.

## RPC Gateway

| Méthode              | Arguments                 |
| -------------------- | ------------------------- |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## Articles connexes

- [Mode conversation](/fr/nodes/talk)
- [Synthèse vocale](/fr/tools/tts)
- [Réveil vocal](/fr/nodes/voicewake)
