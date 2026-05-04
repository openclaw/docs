---
read_when:
    - Vous souhaitez passer un appel vocal sortant depuis OpenClaw
    - Vous configurez ou développez le Plugin d’appels vocaux
    - Vous avez besoin de voix en temps réel ou de transcription en continu pour la téléphonie
sidebarTitle: Voice call
summary: Passez des appels vocaux sortants et acceptez des appels vocaux entrants via Twilio, Telnyx ou Plivo, avec voix en temps réel et transcription en streaming facultatives
title: Plugin d'appel vocal
x-i18n:
    generated_at: "2026-05-04T07:05:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ec2c22dcc9073572963744685a432328787bcedb14025e0326c20d9d842f857
    source_path: plugins/voice-call.md
    workflow: 16
---

Appels vocaux pour OpenClaw via un plugin. Prend en charge les notifications sortantes,
les conversations multi-tours, la voix en temps réel full-duplex, la
transcription en streaming et les appels entrants avec des politiques de liste d'autorisation.

**Fournisseurs actuels :** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (développement/sans réseau).

<Note>
Le plugin Voice Call s'exécute **dans le processus Gateway**. Si vous utilisez un
Gateway distant, installez et configurez le plugin sur la machine qui exécute
le Gateway, puis redémarrez le Gateway pour le charger.
</Note>

## Démarrage rapide

<Steps>
  <Step title="Installer le plugin">
    <Tabs>
      <Tab title="Depuis npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="Depuis un dossier local (développement)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Utilisez le package nu pour suivre l'étiquette de version officielle actuelle. Épinglez une
    version exacte uniquement lorsque vous avez besoin d'une installation reproductible.

    Redémarrez ensuite le Gateway afin que le plugin se charge.

  </Step>
  <Step title="Configurer le fournisseur et le Webhook">
    Définissez la configuration sous `plugins.entries.voice-call.config` (voir
    [Configuration](#configuration) ci-dessous pour la forme complète). Au minimum :
    `provider`, les identifiants du fournisseur, `fromNumber` et une URL de Webhook
    accessible publiquement.
  </Step>
  <Step title="Vérifier la configuration">
    ```bash
    openclaw voicecall setup
    ```

    La sortie par défaut est lisible dans les journaux de chat et les terminaux. Elle vérifie
    l'activation du plugin, les identifiants du fournisseur, l'exposition du Webhook et que
    seul un mode audio (`streaming` ou `realtime`) est actif. Utilisez
    `--json` pour les scripts.

  </Step>
  <Step title="Test fumigatoire">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Les deux sont des simulations par défaut. Ajoutez `--yes` pour passer réellement un court
    appel de notification sortant :

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Pour Twilio, Telnyx et Plivo, la configuration doit se résoudre en une **URL de Webhook publique**.
Si `publicUrl`, l'URL du tunnel, l'URL Tailscale ou le repli de service
se résout vers l'espace réseau loopback ou privé, la configuration échoue au lieu de
démarrer un fournisseur qui ne peut pas recevoir les Webhooks des opérateurs.
</Warning>

## Configuration

Si `enabled: true` mais que les identifiants du fournisseur sélectionné sont manquants,
le démarrage du Gateway consigne un avertissement de configuration incomplète avec les clés manquantes et
ignore le démarrage de l'exécution. Les commandes, les appels RPC et les outils d'agent renvoient toujours
la configuration exacte du fournisseur manquante lorsqu'ils sont utilisés.

<Note>
Les identifiants voice-call acceptent les SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` et `plugins.entries.voice-call.config.tts.providers.*.apiKey` sont résolus via la surface SecretRef standard ; voir [surface d'identifiants SecretRef](/fr/reference/secretref-credential-surface).
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
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, how can I help?",
              responseSystemPrompt: "You are a concise baseball card specialist.",
              tts: {
                providers: {
                  openai: { voice: "alloy" },
                },
              },
            },
          },

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
  <Accordion title="Notes sur l'exposition et la sécurité des fournisseurs">
    - Twilio, Telnyx et Plivo exigent tous une URL de Webhook **accessible publiquement**.
    - `mock` est un fournisseur de développement local (aucun appel réseau).
    - Telnyx nécessite `telnyx.publicKey` (ou `TELNYX_PUBLIC_KEY`) sauf si `skipSignatureVerification` vaut true.
    - `skipSignatureVerification` est réservé aux tests locaux.
    - Sur l'offre gratuite de ngrok, définissez `publicUrl` sur l'URL ngrok exacte ; la vérification de signature est toujours appliquée.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` autorise les Webhooks Twilio avec des signatures invalides **uniquement** lorsque `tunnel.provider="ngrok"` et que `serve.bind` est loopback (agent local ngrok). Développement local uniquement.
    - Les URL de l'offre gratuite de Ngrok peuvent changer ou ajouter un comportement interstitiel ; si `publicUrl` dérive, les signatures Twilio échouent. Production : privilégiez un domaine stable ou un funnel Tailscale.

  </Accordion>
  <Accordion title="Limites de connexions en streaming">
    - `streaming.preStartTimeoutMs` ferme les sockets qui n'envoient jamais de trame `start` valide.
    - `streaming.maxPendingConnections` limite le nombre total de sockets pré-démarrage non authentifiés.
    - `streaming.maxPendingConnectionsPerIp` limite les sockets pré-démarrage non authentifiés par IP source.
    - `streaming.maxConnections` limite le nombre total de sockets de flux multimédia ouverts (en attente + actifs).

  </Accordion>
  <Accordion title="Migrations de configuration héritée">
    Les anciennes configurations utilisant `provider: "log"`, `twilio.from` ou les clés OpenAI
    `streaming.*` héritées sont réécrites par `openclaw doctor --fix`.
    Le repli d'exécution accepte encore les anciennes clés voice-call pour le moment, mais
    le chemin de réécriture est `openclaw doctor --fix` et la couche de compatibilité est
    temporaire.

    Clés de streaming migrées automatiquement :

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Portée de session

Par défaut, Voice Call utilise `sessionScope: "per-phone"` afin que les appels répétés du
même appelant conservent la mémoire de conversation. Définissez `sessionScope: "per-call"` lorsque
chaque appel opérateur doit commencer avec un contexte neuf, par exemple pour les flux de réception,
de réservation, IVR ou de passerelle Google Meet où le même numéro de téléphone peut
représenter différentes réunions.

## Conversations vocales en temps réel

`realtime` sélectionne un fournisseur de voix en temps réel full-duplex pour l'audio
d'appel en direct. Il est distinct de `streaming`, qui transmet uniquement l'audio aux
fournisseurs de transcription en temps réel.

<Warning>
`realtime.enabled` ne peut pas être combiné avec `streaming.enabled`. Choisissez un
mode audio par appel.
</Warning>

Comportement d'exécution actuel :

- `realtime.enabled` est pris en charge pour Twilio Media Streams.
- `realtime.provider` est facultatif. S'il n'est pas défini, Voice Call utilise le premier fournisseur de voix en temps réel enregistré.
- Fournisseurs de voix en temps réel groupés : Google Gemini Live (`google`) et OpenAI (`openai`), enregistrés par leurs plugins fournisseurs.
- La configuration brute détenue par le fournisseur se trouve sous `realtime.providers.<providerId>`.
- Voice Call expose par défaut l'outil temps réel partagé `openclaw_agent_consult`. Le modèle temps réel peut l'appeler lorsque l'appelant demande un raisonnement plus approfondi, des informations actuelles ou des outils OpenClaw normaux.
- `realtime.fastContext.enabled` est désactivé par défaut. Lorsqu'il est activé, Voice Call recherche d'abord dans le contexte mémoire/session indexé pour la question de consultation et renvoie ces extraits au modèle temps réel dans `realtime.fastContext.timeoutMs` avant de revenir à l'agent de consultation complet uniquement si `realtime.fastContext.fallbackToConsult` vaut true.
- Si `realtime.provider` pointe vers un fournisseur non enregistré, ou si aucun fournisseur de voix en temps réel n'est enregistré, Voice Call consigne un avertissement et ignore le média temps réel au lieu de faire échouer tout le plugin.
- Les clés de session de consultation réutilisent la session d'appel stockée lorsqu'elle est disponible, puis reviennent à la `sessionScope` configurée (`per-phone` par défaut, ou `per-call` pour les appels isolés).

### Politique d'outils

`realtime.toolPolicy` contrôle l'exécution de consultation :

| Politique        | Comportement                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Expose l'outil de consultation et limite l'agent standard à `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` et `memory_get`. |
| `owner`          | Expose l'outil de consultation et laisse l'agent standard utiliser la politique normale d'outils d'agent.                                |
| `none`           | N'expose pas l'outil de consultation. Les `realtime.tools` personnalisés sont toujours transmis au fournisseur temps réel.               |

### Exemples de fournisseurs temps réel

<Tabs>
  <Tab title="Google Gemini Live">
    Valeurs par défaut : clé d'API depuis `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` ou `GOOGLE_GENERATIVE_AI_API_KEY` ; modèle
    `gemini-2.5-flash-native-audio-preview-12-2025` ; voix `Kore`.
    `sessionResumption` et `contextWindowCompression` sont activés par défaut pour les appels plus longs,
    reconnectables. Utilisez `silenceDurationMs`, `startSensitivity` et
    `endSensitivity` pour ajuster une alternance de parole plus rapide sur l'audio téléphonique.

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
                    silenceDurationMs: 500,
                    startSensitivity: "high",
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

Voir [fournisseur Google](/fr/providers/google) et
[fournisseur OpenAI](/fr/providers/openai) pour les options de voix en temps réel
propres au fournisseur.

## Transcription en streaming

`streaming` sélectionne un fournisseur de transcription en temps réel pour l’audio des appels en direct.

Comportement actuel à l’exécution :

- `streaming.provider` est facultatif. S’il n’est pas défini, Voice Call utilise le premier fournisseur de transcription en temps réel enregistré.
- Fournisseurs de transcription en temps réel intégrés : Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) et xAI (`xai`), enregistrés par leurs plugins fournisseurs.
- La configuration brute propre au fournisseur se trouve sous `streaming.providers.<providerId>`.
- Après que Twilio a envoyé un message `start` de flux accepté, Voice Call enregistre immédiatement le flux, met en file d’attente les médias entrants via le fournisseur de transcription pendant que celui-ci se connecte, et ne lance le message d’accueil initial qu’une fois la transcription en temps réel prête.
- Si `streaming.provider` pointe vers un fournisseur non enregistré, ou si aucun fournisseur n’est enregistré, Voice Call consigne un avertissement et ignore le streaming multimédia au lieu de faire échouer tout le plugin.

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
    point de terminaison `wss://api.x.ai/v1/stt` ; encodage `mulaw` ; fréquence d’échantillonnage `8000` ;
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

Voice Call utilise la configuration principale `messages.tts` pour la parole en streaming
lors des appels. Vous pouvez la remplacer dans la configuration du plugin avec la
**même forme** — elle est fusionnée en profondeur avec `messages.tts`.

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
**Microsoft speech est ignoré pour les appels vocaux.** L’audio téléphonique nécessite du PCM ;
le transport Microsoft actuel n’expose pas de sortie PCM téléphonique.
</Warning>

Notes de comportement :

- Les anciennes clés `tts.<provider>` dans la configuration du plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) sont réparées par `openclaw doctor --fix` ; la configuration validée devrait utiliser `tts.providers.<provider>`.
- Le TTS principal est utilisé lorsque le streaming multimédia Twilio est activé ; sinon les appels reviennent aux voix natives du fournisseur.
- Si un flux multimédia Twilio est déjà actif, Voice Call ne revient pas à TwiML `<Say>`. Si le TTS téléphonique n’est pas disponible dans cet état, la requête de lecture échoue au lieu de mélanger deux chemins de lecture.
- Lorsque le TTS téléphonique revient à un fournisseur secondaire, Voice Call consigne un avertissement avec la chaîne de fournisseurs (`from`, `to`, `attempts`) pour le débogage.
- Lorsque l’interruption Twilio ou le démontage du flux vide la file TTS en attente, les requêtes de lecture en file se règlent au lieu de laisser les appelants attendre indéfiniment la fin de la lecture.

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

La politique d’entrée est définie par défaut sur `disabled`. Pour activer les appels entrants, définissez :

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` est un filtrage de l’identifiant d’appelant à faible assurance. Le
plugin normalise la valeur `From` fournie par le fournisseur et la compare à
`allowFrom`. La vérification Webhook authentifie la livraison par le fournisseur et
l’intégrité de la charge utile, mais elle ne prouve **pas** la propriété du numéro
d’appelant PSTN/VoIP. Traitez `allowFrom` comme un filtrage de l’identifiant d’appelant, et non comme une identité
d’appelant forte.
</Warning>

Les réponses automatiques utilisent le système d’agents. Ajustez-les avec `responseModel`,
`responseSystemPrompt` et `responseTimeoutMs`.

### Routage par numéro

Utilisez `numbers` lorsqu’un même plugin Voice Call reçoit des appels pour plusieurs numéros de téléphone
et que chaque numéro doit se comporter comme une ligne différente. Par exemple, un
numéro peut utiliser un assistant personnel décontracté tandis qu’un autre utilise une personnalité professionnelle,
un agent de réponse différent et une voix TTS différente.

Les routes sont sélectionnées à partir du numéro composé `To` fourni par le fournisseur. Les clés doivent être
des numéros E.164. Lorsqu’un appel arrive, Voice Call résout une fois la route correspondante,
stocke la route correspondante dans l’enregistrement d’appel et réutilise cette configuration effective
pour le message d’accueil, le chemin classique de réponse automatique, le chemin de consultation en temps réel et la lecture
TTS. Si aucune route ne correspond, la configuration globale de Voice Call est utilisée.
Les appels sortants n’utilisent pas `numbers` ; transmettez explicitement la cible sortante, le message et la
session lors de l’initiation de l’appel.

Les remplacements de route prennent actuellement en charge :

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

La valeur de route `tts` est fusionnée en profondeur avec la configuration `tts` globale de Voice Call, ce qui vous permet généralement de remplacer uniquement la voix du fournisseur :

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { voice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

### Contrat de sortie vocale

Pour les réponses automatiques, Voice Call ajoute un contrat strict de sortie vocale à l’invite système :

```text
{"spoken":"..."}
```

Voice Call extrait le texte à prononcer de manière défensive :

- Ignore les charges utiles marquées comme contenu de raisonnement ou d’erreur.
- Analyse le JSON direct, le JSON balisé ou les clés `"spoken"` en ligne.
- Se rabat sur du texte brut et supprime les paragraphes d’introduction qui ressemblent à de la planification ou à des métadonnées.

Cela maintient la lecture vocale centrée sur le texte destiné à l’appelant et évite de divulguer du texte de planification dans l’audio.

### Comportement au démarrage de la conversation

Pour les appels `conversation` sortants, la gestion du premier message est liée à l’état de lecture en direct :

- L’effacement de la file d’attente lors d’une interruption et la réponse automatique ne sont supprimés que pendant que le message d’accueil initial est en cours de lecture.
- Si la lecture initiale échoue, l’appel revient à l’état `listening` et le message initial reste en file d’attente pour une nouvelle tentative.
- La lecture initiale pour le streaming Twilio démarre à la connexion du flux, sans délai supplémentaire.
- L’interruption annule la lecture active et efface les entrées TTS Twilio en file d’attente mais pas encore en cours de lecture. Les entrées effacées sont résolues comme ignorées, afin que la logique de réponse de suivi puisse continuer sans attendre un audio qui ne sera jamais lu.
- Les conversations vocales en temps réel utilisent le premier tour propre au flux temps réel. Voice Call ne publie **pas** de mise à jour TwiML `<Say>` héritée pour ce message initial, de sorte que les sessions `<Connect><Stream>` sortantes restent attachées.

### Délai de grâce lors de la déconnexion d’un flux Twilio

Lorsqu’un flux média Twilio se déconnecte, Voice Call attend **2000 ms** avant de mettre automatiquement fin à l’appel :

- Si le flux se reconnecte pendant cette fenêtre, la fin automatique est annulée.
- Si aucun flux ne se réenregistre après le délai de grâce, l’appel est terminé afin d’éviter les appels actifs bloqués.

## Nettoyeur d’appels obsolètes

Utilisez `staleCallReaperSeconds` pour terminer les appels qui ne reçoivent jamais de Webhook terminal (par exemple, les appels en mode notification qui ne se terminent jamais). La valeur par défaut est `0` (désactivé).

Plages recommandées :

- **Production :** `120` à `300` secondes pour les flux de type notification.
- Conservez cette valeur **supérieure à `maxDurationSeconds`** afin que les appels normaux puissent se terminer. Un bon point de départ est `maxDurationSeconds + 30–60` secondes.

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

Lorsqu’un proxy ou un tunnel se trouve devant le Gateway, le plugin reconstruit l’URL publique pour la vérification de signature. Ces options contrôlent les en-têtes transférés qui sont approuvés :

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Autorisez les hôtes issus des en-têtes de transfert.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Approuvez les en-têtes transférés sans liste d’autorisation.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  N’approuvez les en-têtes transférés que lorsque l’IP distante de la requête correspond à la liste.
</ParamField>

Protections supplémentaires :

- La **protection contre la relecture** des Webhooks est activée pour Twilio et Plivo. Les requêtes Webhook valides rejouées sont acquittées mais ignorées pour les effets de bord.
- Les tours de conversation Twilio incluent un jeton par tour dans les callbacks `<Gather>`, afin que les callbacks vocaux obsolètes ou rejoués ne puissent pas satisfaire un tour de transcription en attente plus récent.
- Les requêtes Webhook non authentifiées sont rejetées avant la lecture du corps lorsque les en-têtes de signature requis du fournisseur sont absents.
- Le Webhook voice-call utilise le profil de corps pré-authentification partagé (64 Ko / 5 secondes) ainsi qu’un plafond par IP sur les requêtes en cours avant la vérification de signature.

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

Lorsque le Gateway est déjà en cours d’exécution, les commandes opérationnelles `voicecall` délèguent
au runtime d’appels vocaux détenu par le Gateway afin que la CLI ne lie pas un second
serveur Webhook. Si aucun Gateway n’est joignable, les commandes se rabattent sur un
runtime CLI autonome.

`latency` lit `calls.jsonl` depuis le chemin de stockage d’appels vocaux par défaut.
Utilisez `--file <path>` pour pointer vers un autre journal et `--last <n>` pour limiter
l’analyse aux N derniers enregistrements (200 par défaut). La sortie inclut p50/p90/p99
pour la latence de tour et les temps d’attente d’écoute.

## Outil d’agent

Nom de l’outil : `voice_call`.

| Action          | Arguments                                  |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Ce dépôt fournit une documentation de skill correspondante dans `skills/voice-call/SKILL.md`.

## RPC Gateway

| Méthode             | Arguments                                  |
| ------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` n’est valide qu’avec `mode: "conversation"`. Les appels en mode notification
doivent utiliser `voicecall.dtmf` après la création de l’appel s’ils ont besoin de chiffres
après connexion.

## Dépannage

### L’exposition du Webhook échoue pendant la configuration

Exécutez la configuration depuis le même environnement que celui qui exécute le Gateway :

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Pour `twilio`, `telnyx` et `plivo`, `webhook-exposure` doit être au vert. Un
`publicUrl` configuré échoue quand même s’il pointe vers un espace réseau local ou privé,
car l’opérateur ne peut pas rappeler ces adresses. N’utilisez pas
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` ou `fd00::/8` comme `publicUrl`.

Les appels sortants Twilio en mode notification envoient leur TwiML `<Say>` initial directement dans
la requête de création d’appel ; le premier message parlé ne dépend donc pas de la récupération
du TwiML de Webhook par Twilio. Un Webhook public reste requis pour les rappels de statut,
les appels conversationnels, le DTMF avant connexion, les flux temps réel et le contrôle
d’appel après connexion.

Utilisez un chemin d’exposition public :

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // or
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Après avoir modifié la configuration, redémarrez ou rechargez le Gateway, puis exécutez :

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` est une exécution à blanc sauf si vous passez `--yes`.

### Les identifiants du fournisseur échouent

Vérifiez le fournisseur sélectionné et les champs d’identifiants requis :

- Twilio : `twilio.accountSid`, `twilio.authToken` et `fromNumber`, ou
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` et `TWILIO_FROM_NUMBER`.
- Telnyx : `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` et
  `fromNumber`.
- Plivo : `plivo.authId`, `plivo.authToken` et `fromNumber`.

Les identifiants doivent exister sur l’hôte du Gateway. Modifier un profil shell local
n’affecte pas un Gateway déjà en cours d’exécution tant qu’il ne redémarre pas ou ne recharge pas
son environnement.

### Les appels démarrent mais les Webhooks du fournisseur n’arrivent pas

Confirmez que la console du fournisseur pointe vers l’URL exacte du Webhook public :

```text
https://voice.example.com/voice/webhook
```

Puis inspectez l’état du runtime :

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Causes courantes :

- `publicUrl` pointe vers un chemin différent de `serve.path`.
- L’URL du tunnel a changé après le démarrage du Gateway.
- Un proxy transfère la requête mais supprime ou réécrit les en-têtes d’hôte/protocole.
- Le pare-feu ou le DNS route le nom d’hôte public ailleurs que vers le Gateway.
- Le Gateway a été redémarré sans que le Plugin Voice Call soit activé.

Lorsqu’un proxy inverse ou un tunnel se trouve devant le Gateway, définissez
`webhookSecurity.allowedHosts` sur le nom d’hôte public, ou utilisez
`webhookSecurity.trustedProxyIPs` pour une adresse de proxy connue. Utilisez
`webhookSecurity.trustForwardingHeaders` uniquement lorsque la frontière du proxy est sous
votre contrôle.

### La vérification de signature échoue

Les signatures du fournisseur sont vérifiées par rapport à l’URL publique qu’OpenClaw reconstruit
à partir de la requête entrante. Si les signatures échouent :

- Confirmez que l’URL du Webhook du fournisseur correspond exactement à `publicUrl`, y compris
  le schéma, l’hôte et le chemin.
- Pour les URL ngrok en offre gratuite, mettez à jour `publicUrl` lorsque le nom d’hôte du tunnel change.
- Assurez-vous que le proxy préserve les en-têtes d’hôte et de protocole d’origine, ou configurez
  `webhookSecurity.allowedHosts`.
- N’activez pas `skipSignatureVerification` en dehors des tests locaux.

### Les connexions Google Meet via Twilio échouent

Google Meet utilise ce Plugin pour les connexions par appel Twilio. Vérifiez d’abord Voice Call :

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Puis vérifiez explicitement le transport Google Meet :

```bash
openclaw googlemeet setup --transport twilio
```

Si Voice Call est au vert mais que le participant Meet ne rejoint jamais, vérifiez le numéro
d’appel entrant Meet, le code PIN et `--dtmf-sequence`. L’appel téléphonique peut être sain tandis
que la réunion rejette ou ignore une séquence DTMF incorrecte.

Google Meet transmet la séquence DTMF Meet et le texte d’introduction à `voicecall.start`.
Pour les appels Twilio, Voice Call sert d’abord le TwiML DTMF, redirige vers le
Webhook, puis ouvre le flux média temps réel afin que l’introduction enregistrée soit générée
après que le participant téléphonique a rejoint la réunion.

Utilisez `openclaw logs --follow` pour la trace en direct de la phase. Une connexion Twilio Meet
saine journalise cet ordre :

- Google Meet délègue la connexion Twilio à Voice Call.
- Voice Call stocke le TwiML DTMF avant connexion.
- Le TwiML initial Twilio est consommé et servi avant la gestion temps réel.
- Voice Call sert le TwiML temps réel pour l’appel Twilio.
- Le pont temps réel démarre avec le message d’accueil initial en file d’attente.

`openclaw voicecall tail` affiche toujours les enregistrements d’appel persistés ; il est utile pour
l’état des appels et les transcriptions, mais toutes les transitions Webhook/temps réel n’y
apparaissent pas.

### L’appel temps réel n’a pas de parole

Confirmez qu’un seul mode audio est activé. `realtime.enabled` et
`streaming.enabled` ne peuvent pas tous les deux être `true`.

Pour les appels Twilio temps réel, vérifiez aussi :

- Un Plugin fournisseur temps réel est chargé et enregistré.
- `realtime.provider` n’est pas défini ou nomme un fournisseur enregistré.
- La clé API du fournisseur est disponible pour le processus Gateway.
- `openclaw logs --follow` montre que le TwiML temps réel a été servi, que le pont temps réel
  a démarré et que le message d’accueil initial a été mis en file d’attente.

## Associé

- [Mode conversation](/fr/nodes/talk)
- [Synthèse vocale](/fr/tools/tts)
- [Réveil vocal](/fr/nodes/voicewake)
