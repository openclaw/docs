---
read_when:
    - Vous voulez passer un appel vocal sortant depuis OpenClaw
    - Vous configurez ou développez le plugin d’appel vocal
    - Vous avez besoin de voix en temps réel ou de transcription en streaming sur la téléphonie
sidebarTitle: Voice call
summary: Passez des appels vocaux sortants et acceptez des appels vocaux entrants via Twilio, Telnyx ou Plivo, avec en option la voix en temps réel et la transcription en streaming
title: Plugin d’appel vocal
x-i18n:
    generated_at: "2026-06-27T18:01:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6eff6fe188644d6ac2f4868b28727783bd1859025e8745b1901e20637d68611c
    source_path: plugins/voice-call.md
    workflow: 16
---

Appels vocaux pour OpenClaw via un plugin. Prend en charge les notifications sortantes,
les conversations à plusieurs tours, la voix realtime full-duplex, la transcription
en streaming et les appels entrants avec des politiques de liste d'autorisation.

**Fournisseurs actuels :** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + transfert XML + GetInput
speech), `mock` (dev/sans réseau).

<Note>
Le plugin Voice Call s’exécute **dans le processus Gateway**. Si vous utilisez un
Gateway distant, installez et configurez le plugin sur la machine qui exécute
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

    Utilisez le package nu pour suivre le tag de version officiel actuel. Épinglez une
    version exacte uniquement lorsque vous avez besoin d’une installation reproductible.

    Redémarrez ensuite le Gateway afin que le plugin se charge.

  </Step>
  <Step title="Configure provider and webhook">
    Définissez la configuration sous `plugins.entries.voice-call.config` (voir
    [Configuration](#configuration) ci-dessous pour la forme complète). Au minimum :
    `provider`, les identifiants du fournisseur, `fromNumber` et une URL de Webhook
    accessible publiquement.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    La sortie par défaut est lisible dans les journaux de chat et les terminaux. Elle vérifie
    l’activation du plugin, les identifiants du fournisseur, l’exposition du Webhook et que
    seul un mode audio (`streaming` ou `realtime`) est actif. Utilisez
    `--json` pour les scripts.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Les deux commandes sont des exécutions à blanc par défaut. Ajoutez `--yes` pour passer réellement
    un court appel de notification sortant :

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Pour Twilio, Telnyx et Plivo, la configuration doit résoudre vers une **URL de Webhook publique**.
Si `publicUrl`, l’URL du tunnel, l’URL Tailscale ou le fallback de service
se résout vers un loopback ou un espace réseau privé, la configuration échoue au lieu de
démarrer un fournisseur qui ne peut pas recevoir les Webhooks de l’opérateur.
</Warning>

## Configuration

Si `enabled: true` mais que le fournisseur sélectionné n’a pas d’identifiants,
le démarrage du Gateway journalise un avertissement de configuration incomplète avec les clés manquantes et
ignore le démarrage du runtime. Les commandes, les appels RPC et les outils d’agent renvoient tout de même
la configuration exacte manquante du fournisseur lorsqu’ils sont utilisés.

<Note>
Les identifiants voice-call acceptent les SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` et `plugins.entries.voice-call.config.tts.providers.*.apiKey` sont résolus via la surface SecretRef standard ; voir [surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface).
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
                  openai: { speakerVoice: "alloy" },
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
  <Accordion title="Provider exposure and security notes">
    - Twilio, Telnyx et Plivo exigent tous une URL de Webhook **accessible publiquement**.
    - `mock` est un fournisseur de développement local (aucun appel réseau).
    - Telnyx exige `telnyx.publicKey` (ou `TELNYX_PUBLIC_KEY`), sauf si `skipSignatureVerification` vaut true.
    - `skipSignatureVerification` est réservé aux tests locaux.
    - Sur l’offre gratuite d’ngrok, définissez `publicUrl` sur l’URL ngrok exacte ; la vérification de signature est toujours appliquée.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` autorise les Webhooks Twilio avec des signatures non valides **uniquement** lorsque `tunnel.provider="ngrok"` et que `serve.bind` est un loopback (agent local ngrok). Développement local uniquement.
    - Les URL de l’offre gratuite ngrok peuvent changer ou ajouter un interstitiel ; si `publicUrl` dérive, les signatures Twilio échouent. Production : préférez un domaine stable ou un funnel Tailscale.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` ferme les sockets qui n’envoient jamais de trame `start` valide.
    - `streaming.maxPendingConnections` plafonne le nombre total de sockets pré-démarrage non authentifiés.
    - `streaming.maxPendingConnectionsPerIp` plafonne les sockets pré-démarrage non authentifiés par IP source.
    - `streaming.maxConnections` plafonne le nombre total de sockets de flux média ouverts (en attente + actifs).

  </Accordion>
  <Accordion title="Legacy config migrations">
    Les anciennes configurations utilisant `provider: "log"`, `twilio.from` ou d’anciennes
    clés OpenAI `streaming.*` sont réécrites par `openclaw doctor --fix`.
    Le fallback du runtime accepte encore les anciennes clés voice-call pour l’instant, mais
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

## Portée de session

Par défaut, Voice Call utilise `sessionScope: "per-phone"` afin que les appels répétés du
même appelant conservent la mémoire de conversation. Définissez `sessionScope: "per-call"` lorsque
chaque appel opérateur doit démarrer avec un contexte neuf, par exemple pour les flux de réception,
de réservation, d’IVR ou de pont Google Meet où le même numéro de téléphone peut
représenter différentes réunions.

Voice Call stocke les clés de session générées sous l’espace de noms d’agent configuré
(`agent:<agentId>:voice:*`) afin que la mémoire d’appel survive à la canonicalisation des clés
de session du Gateway après les redémarrages. Les clés d’intégration explicites brutes utilisent le même
espace de noms d’agent. Une clé canonique `agent:<configuredAgentId>:*` conserve ce propriétaire,
et ses alias principaux respectent `session.mainKey` du cœur et la portée globale. Les entrées
`agent:*` étrangères ou mal formées sont portées comme une clé opaque sous l’agent configuré ;
`global` et `unknown` restent des sentinelles globales. Le démarrage du Gateway promeut les anciennes
clés brutes dans les magasins par défaut ou à modèle `{agentId}` lorsque le chemin prouve un seul
propriétaire. Dans les magasins personnalisés fixes, les anciennes lignes ambiguës restent inchangées car
elles ne contiennent pas assez d’informations pour choisir un propriétaire ; les nouveaux appels utilisent
l’historique canonique porté par agent.

## Conversations vocales realtime

`realtime` sélectionne un fournisseur vocal realtime full-duplex pour l’audio
des appels en direct. Il est distinct de `streaming`, qui transfère uniquement l’audio vers
des fournisseurs de transcription realtime.

<Warning>
`realtime.enabled` ne peut pas être combiné avec `streaming.enabled`. Choisissez un seul
mode audio par appel.
</Warning>

Comportement actuel du runtime :

- `realtime.enabled` est pris en charge pour Twilio Media Streams.
- `realtime.provider` est facultatif. S’il n’est pas défini, Voice Call utilise le premier fournisseur vocal realtime enregistré.
- Fournisseurs vocaux realtime intégrés : Google Gemini Live (`google`) et OpenAI (`openai`), enregistrés par leurs plugins fournisseurs.
- La configuration brute propre au fournisseur se trouve sous `realtime.providers.<providerId>`.
- Voice Call expose par défaut l’outil realtime partagé `openclaw_agent_consult`. Le modèle realtime peut l’appeler lorsque l’appelant demande un raisonnement plus approfondi, des informations actuelles ou des outils OpenClaw normaux.
- `realtime.consultPolicy` ajoute facultativement des consignes indiquant quand le modèle realtime doit appeler `openclaw_agent_consult`.
- `realtime.agentContext.enabled` est désactivé par défaut. Lorsqu’il est activé, Voice Call injecte une identité d’agent limitée et une capsule de fichiers d’espace de travail sélectionnés dans les instructions du fournisseur realtime lors de la configuration de session.
- `realtime.fastContext.enabled` est désactivé par défaut. Lorsqu’il est activé, Voice Call recherche d’abord dans la mémoire indexée/le contexte de session la question de consultation et renvoie ces extraits au modèle realtime dans `realtime.fastContext.timeoutMs` avant de revenir à l’agent de consultation complet uniquement si `realtime.fastContext.fallbackToConsult` vaut true.
- Si `realtime.provider` pointe vers un fournisseur non enregistré, ou si aucun fournisseur vocal realtime n’est enregistré, Voice Call journalise un avertissement et ignore le média realtime au lieu de faire échouer tout le plugin.
- Les clés de session de consultation réutilisent la session d’appel stockée lorsqu’elle est disponible, puis reviennent à la valeur `sessionScope` configurée (`per-phone` par défaut, ou `per-call` pour les appels isolés).

### Politique d’outil

`realtime.toolPolicy` contrôle l’exécution de consultation :

| Politique        | Comportement                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Expose l’outil de consultation et limite l’agent standard à `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` et `memory_get`. |
| `owner`          | Expose l’outil de consultation et laisse l’agent standard utiliser la politique d’outils normale de l’agent.                            |
| `none`           | N’expose pas l’outil de consultation. Les `realtime.tools` personnalisés sont tout de même transmis au fournisseur realtime.             |

`realtime.consultPolicy` contrôle uniquement les instructions du modèle realtime :

| Politique     | Consignes                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------- |
| `auto`        | Conserve le prompt par défaut et laisse le fournisseur décider quand appeler l’outil de consultation. |
| `substantive` | Répond directement aux simples transitions conversationnelles et consulte avant les faits, la mémoire, les outils ou le contexte. |
| `always`      | Consulte avant chaque réponse substantielle.                                                   |

### Contexte vocal de l’agent

Activez `realtime.agentContext` lorsque le pont vocal doit ressembler à l’agent
OpenClaw configuré sans payer un aller-retour complet de consultation de
l’agent lors des tours ordinaires. La capsule de contexte est ajoutée une seule
fois à la création de la session temps réel, elle n’ajoute donc pas de latence
par tour. Les appels à `openclaw_agent_consult` exécutent toujours l’agent
OpenClaw complet et doivent être utilisés pour les travaux avec outils, les
informations actuelles, les recherches en mémoire ou l’état de l’espace de
travail.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          agentId: "main",
          realtime: {
            enabled: true,
            provider: "google",
            toolPolicy: "safe-read-only",
            consultPolicy: "substantive",
            agentContext: {
              enabled: true,
              maxChars: 6000,
              includeIdentity: true,
              includeWorkspaceFiles: true,
              files: ["SOUL.md", "IDENTITY.md", "USER.md"],
            },
          },
        },
      },
    },
  },
}
```

### Exemples de fournisseurs temps réel

<Tabs>
  <Tab title="Google Gemini Live">
    Valeurs par défaut : clé API depuis `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` ou `GOOGLE_GENERATIVE_AI_API_KEY` ; modèle
    `gemini-2.5-flash-native-audio-preview-12-2025` ; voix `Kore`.
    `sessionResumption` et `contextWindowCompression` sont activés par défaut
    pour les appels plus longs et reconnectables. Utilisez `silenceDurationMs`,
    `startSensitivity` et `endSensitivity` pour ajuster une prise de tour plus
    rapide sur l’audio de téléphonie.

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
                consultPolicy: "substantive",
                consultThinkingLevel: "low",
                consultFastMode: true,
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    speakerVoice: "Kore",
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

Consultez [le fournisseur Google](/fr/providers/google) et
[le fournisseur OpenAI](/fr/providers/openai) pour les options vocales temps réel
propres aux fournisseurs.

## Transcription en streaming

`streaming` sélectionne un fournisseur de transcription temps réel pour l’audio
d’appel en direct.

Comportement actuel à l’exécution :

- `streaming.provider` est facultatif. S’il n’est pas défini, Voice Call utilise le premier fournisseur de transcription temps réel enregistré.
- Fournisseurs de transcription temps réel intégrés : Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) et xAI (`xai`), enregistrés par leurs Plugins de fournisseur.
- La configuration brute appartenant au fournisseur se trouve sous `streaming.providers.<providerId>`.
- Une fois que Twilio envoie un message `start` de flux accepté, Voice Call enregistre immédiatement le flux, met en file d’attente les médias entrants via le fournisseur de transcription pendant que celui-ci se connecte, et ne lance le message d’accueil initial qu’une fois la transcription temps réel prête.
- Si `streaming.provider` pointe vers un fournisseur non enregistré, ou si aucun fournisseur n’est enregistré, Voice Call journalise un avertissement et ignore le streaming média au lieu de faire échouer tout le Plugin.

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
    Valeurs par défaut : clé API `streaming.providers.xai.apiKey` ou
    `XAI_API_KEY` ; point de terminaison `wss://api.x.ai/v1/stt` ; encodage
    `mulaw` ; fréquence d’échantillonnage `8000` ; `endpointingMs: 800` ;
    `interimResults: true`.

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

Voice Call utilise la configuration principale `messages.tts` pour le streaming
vocal lors des appels. Vous pouvez la remplacer dans la configuration du Plugin
avec la **même forme** — elle fusionne en profondeur avec `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

<Warning>
**Microsoft speech est ignoré pour les appels vocaux.** L’audio de téléphonie a
besoin de PCM ; le transport Microsoft actuel n’expose pas de sortie PCM de
téléphonie.
</Warning>

Notes de comportement :

- Les anciennes clés `tts.<provider>` dans la configuration du Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) sont réparées par `openclaw doctor --fix` ; la configuration validée doit utiliser `tts.providers.<provider>`.
- Le TTS principal est utilisé lorsque le streaming média Twilio est activé ; sinon, les appels reviennent aux voix natives du fournisseur.
- Si un flux média Twilio est déjà actif, Voice Call ne revient pas à TwiML `<Say>`. Si le TTS de téléphonie est indisponible dans cet état, la demande de lecture échoue au lieu de mélanger deux chemins de lecture.
- Lorsque le TTS de téléphonie revient à un fournisseur secondaire, Voice Call journalise un avertissement avec la chaîne de fournisseurs (`from`, `to`, `attempts`) pour le débogage.
- Lorsque l’interruption Twilio ou la fermeture du flux vide la file TTS en attente, les demandes de lecture en file se terminent au lieu de laisser les appelants en attente de la fin de la lecture.

### Exemples TTS

<Tabs>
  <Tab title="TTS de base uniquement">
```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { speakerVoice: "alloy" },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Remplacement par ElevenLabs (appels uniquement)">
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
                speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
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
  <Tab title="Remplacement du modèle OpenAI (fusion profonde)">
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
                speakerVoice: "marin",
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

La politique entrante est définie par défaut sur `disabled`. Pour activer les appels entrants, définissez :

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` est un filtrage de l’identifiant de l’appelant à faible assurance. Le
Plugin normalise la valeur `From` fournie par le fournisseur et la compare à
`allowFrom`. La vérification du Webhook authentifie la livraison par le fournisseur et
l’intégrité de la charge utile, mais elle ne prouve **pas** la propriété du numéro
d’appelant PSTN/VoIP. Traitez `allowFrom` comme un filtrage de l’identifiant de l’appelant, et non comme une identité forte de l’appelant.
</Warning>

Les réponses automatiques utilisent le système d’agent. Ajustez-les avec `responseModel`,
`responseSystemPrompt` et `responseTimeoutMs`.

### Routage par numéro

Utilisez `numbers` lorsqu’un Plugin Voice Call reçoit des appels pour plusieurs numéros de téléphone
et que chaque numéro doit se comporter comme une ligne différente. Par exemple, un
numéro peut utiliser un assistant personnel décontracté, tandis qu’un autre utilise une persona
professionnelle, un agent de réponse différent et une voix TTS différente.

Les routes sont sélectionnées à partir du numéro `To` composé fourni par le fournisseur. Les clés doivent être
des numéros E.164. Lorsqu’un appel arrive, Voice Call résout une seule fois la route correspondante,
stocke la route correspondante dans l’enregistrement de l’appel et réutilise cette configuration effective
pour le message d’accueil, le chemin de réponse automatique classique, le chemin de consultation en temps réel et la lecture
TTS. Si aucune route ne correspond, la configuration globale de Voice Call est utilisée.
Les appels sortants n’utilisent pas `numbers` ; transmettez explicitement la cible sortante, le message et
la session lors du lancement de l’appel.

Les remplacements de route prennent actuellement en charge :

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

La valeur de route `tts` est fusionnée en profondeur avec la configuration globale `tts` de Voice Call, ce qui vous permet
généralement de ne remplacer que la voix du fournisseur :

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { speakerVoice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { speakerVoice: "alloy" },
        },
      },
    },
  },
}
```

### Contrat de sortie vocale

Pour les réponses automatiques, Voice Call ajoute un contrat strict de sortie vocale
à l’invite système :

```text
{"spoken":"..."}
```

Voice Call extrait le texte à prononcer de manière défensive :

- Ignore les charges utiles marquées comme contenu de raisonnement ou d’erreur.
- Analyse le JSON direct, le JSON dans un bloc clôturé ou les clés `"spoken"` en ligne.
- Se rabat sur le texte brut et supprime les paragraphes d’introduction probablement liés à la planification ou aux métadonnées.

Cela garde la lecture vocale centrée sur le texte destiné à l’appelant et évite
de laisser fuiter du texte de planification dans l’audio.

### Comportement au démarrage de la conversation

Pour les appels `conversation` sortants, la gestion du premier message est liée à l’état de
lecture en direct :

- L’effacement de la file de barge-in et la réponse automatique sont supprimés uniquement pendant que le message d’accueil initial est activement prononcé.
- Si la lecture initiale échoue, l’appel revient à `listening` et le message initial reste en file d’attente pour une nouvelle tentative.
- La lecture initiale pour le streaming Twilio démarre lors de la connexion du flux, sans délai supplémentaire.
- Le barge-in interrompt la lecture active et efface les entrées TTS Twilio en file d’attente mais pas encore lues. Les entrées effacées sont résolues comme ignorées, afin que la logique de réponse suivante puisse continuer sans attendre un audio qui ne sera jamais lu.
- Les conversations vocales en temps réel utilisent le tour d’ouverture propre au flux en temps réel. Voice Call ne publie **pas** de mise à jour TwiML `<Say>` héritée pour ce message initial, afin que les sessions `<Connect><Stream>` sortantes restent attachées.

### Délai de grâce de déconnexion du flux Twilio

Lorsqu’un flux média Twilio se déconnecte, Voice Call attend **2000 ms** avant
de terminer automatiquement l’appel :

- Si le flux se reconnecte pendant cette fenêtre, la fin automatique est annulée.
- Si aucun flux ne se réenregistre après la période de grâce, l’appel est terminé afin d’éviter les appels actifs bloqués.

## Nettoyeur d’appels obsolètes

Utilisez `staleCallReaperSeconds` pour terminer les appels qui ne reçoivent jamais de
webhook terminal (par exemple, les appels en mode notification qui ne se terminent jamais). La valeur par défaut
est `0` (désactivé).

Plages recommandées :

- **Production :** `120` à `300` secondes pour les flux de type notification.
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

## Sécurité des Webhooks

Lorsqu’un proxy ou un tunnel se trouve devant le Gateway, le plugin
reconstruit l’URL publique pour la vérification de signature. Ces options
contrôlent les en-têtes transférés considérés comme fiables :

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Liste d’autorisation des hôtes provenant des en-têtes de transfert.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Faire confiance aux en-têtes transférés sans liste d’autorisation.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Ne faire confiance aux en-têtes transférés que lorsque l’IP distante de la requête correspond à la liste.
</ParamField>

Protections supplémentaires :

- La **protection contre la relecture** des Webhooks est activée pour Twilio et Plivo. Les requêtes de webhook valides rejouées sont acquittées, mais ignorées pour les effets secondaires.
- Les tours de conversation Twilio incluent un jeton par tour dans les rappels `<Gather>`, afin que les rappels vocaux obsolètes ou rejoués ne puissent pas satisfaire un tour de transcription en attente plus récent.
- Les requêtes de webhook non authentifiées sont rejetées avant la lecture du corps lorsque les en-têtes de signature requis par le fournisseur sont absents.
- Le webhook voice-call utilise le profil de corps pré-auth partagé (64 Ko / 5 secondes), plus un plafond par IP sur les requêtes en cours avant la vérification de signature.

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
au runtime voice-call possédé par le Gateway, afin que la CLI ne lie pas un deuxième
serveur de webhooks. Si aucun Gateway n’est joignable, les commandes se replient sur un
runtime CLI autonome.

`latency` lit `calls.jsonl` depuis le chemin de stockage voice-call par défaut.
Utilisez `--file <path>` pour pointer vers un autre journal et `--last <n>` pour limiter
l’analyse aux N derniers enregistrements (200 par défaut). La sortie inclut p50/p90/p99
pour la latence des tours et les temps d’attente d’écoute.

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

Le plugin voice-call fournit un skill d’agent correspondant.

## RPC Gateway

| Méthode              | Arguments                                  |
| -------------------- | ------------------------------------------ |
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

### L’exposition du webhook échoue lors de la configuration

Exécutez la configuration depuis le même environnement que celui qui exécute le Gateway :

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Pour `twilio`, `telnyx` et `plivo`, `webhook-exposure` doit être vert. Une
valeur `publicUrl` configurée échoue quand même lorsqu’elle pointe vers un espace réseau
local ou privé, car l’opérateur ne peut pas rappeler ces adresses. N’utilisez pas
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` ou `fd00::/8` comme `publicUrl`.

Les appels sortants Twilio en mode notification envoient leur TwiML `<Say>` initial directement dans
la requête de création d’appel, de sorte que le premier message parlé ne dépend pas de la récupération
du TwiML de webhook par Twilio. Un webhook public reste requis pour les rappels d’état,
les appels de conversation, le DTMF avant connexion, les flux en temps réel et le contrôle d’appel
après connexion.

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

`voicecall smoke` est une simulation, sauf si vous passez `--yes`.

### Les identifiants du fournisseur échouent

Vérifiez le fournisseur sélectionné et les champs d’identifiants requis :

- Twilio : `twilio.accountSid`, `twilio.authToken` et `fromNumber`, ou
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` et `TWILIO_FROM_NUMBER`.
- Telnyx : `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` et
  `fromNumber`.
- Plivo : `plivo.authId`, `plivo.authToken` et `fromNumber`.

Les identifiants doivent exister sur l’hôte du Gateway. Modifier un profil de shell local
n’affecte pas un Gateway déjà en cours d’exécution tant qu’il n’a pas redémarré ou rechargé son
environnement.

### Les appels démarrent, mais les webhooks du fournisseur n’arrivent pas

Confirmez que la console du fournisseur pointe vers l’URL publique exacte du webhook :

```text
https://voice.example.com/voice/webhook
```

Inspectez ensuite l’état du runtime :

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Causes courantes :

- `publicUrl` pointe vers un chemin différent de `serve.path`.
- L’URL du tunnel a changé après le démarrage du Gateway.
- Un proxy transfère la requête, mais supprime ou réécrit les en-têtes host/proto.
- Le pare-feu ou le DNS achemine le nom d’hôte public ailleurs que vers le Gateway.
- Le Gateway a été redémarré sans le plugin Voice Call activé.

Lorsqu’un proxy inverse ou un tunnel se trouve devant le Gateway, définissez
`webhookSecurity.allowedHosts` sur le nom d’hôte public, ou utilisez
`webhookSecurity.trustedProxyIPs` pour une adresse de proxy connue. Utilisez
`webhookSecurity.trustForwardingHeaders` uniquement lorsque la frontière du proxy est sous
votre contrôle.

### La vérification de signature échoue

Les signatures du fournisseur sont vérifiées par rapport à l’URL publique qu’OpenClaw reconstruit
à partir de la requête entrante. Si les signatures échouent :

- Confirmez que l’URL de webhook du fournisseur correspond exactement à `publicUrl`, y compris
  le schéma, l’hôte et le chemin.
- Pour les URL ngrok en offre gratuite, mettez à jour `publicUrl` lorsque le nom d’hôte du tunnel change.
- Assurez-vous que le proxy conserve les en-têtes host et proto d’origine, ou configurez
  `webhookSecurity.allowedHosts`.
- N’activez pas `skipSignatureVerification` en dehors des tests locaux.

### Les connexions Google Meet via Twilio échouent

Google Meet utilise ce plugin pour les connexions par appel Twilio. Vérifiez d’abord Voice Call :

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Vérifiez ensuite explicitement le transport Google Meet :

```bash
openclaw googlemeet setup --transport twilio
```

Si Voice Call est vert, mais que le participant Meet ne rejoint jamais, vérifiez le numéro d’appel
Meet, le code PIN et `--dtmf-sequence`. L’appel téléphonique peut être sain pendant que
la réunion rejette ou ignore une séquence DTMF incorrecte.

Google Meet démarre le segment téléphonique Twilio via `voicecall.start` avec une
séquence DTMF avant connexion. Les séquences dérivées du PIN incluent
`voiceCall.dtmfDelayMs` du plugin Google Meet comme chiffres d’attente Twilio initiaux. La valeur par défaut est de 12 secondes
car les invites d’appel Meet peuvent arriver tard. Voice Call redirige ensuite vers
le traitement en temps réel avant que le message d’accueil d’introduction soit demandé.

Utilisez `openclaw logs --follow` pour la trace de phase en direct. Une connexion Twilio Meet saine
journalise cet ordre :

- Google Meet délègue la connexion Twilio à Voice Call.
- Voice Call stocke le TwiML DTMF avant connexion.
- Le TwiML initial de Twilio est consommé et servi avant le traitement en temps réel.
- Voice Call sert le TwiML en temps réel pour l’appel Twilio.
- Google Meet demande la parole d’introduction avec `voicecall.speak` après le délai post-DTMF.

`openclaw voicecall tail` affiche toujours les enregistrements d’appels persistés ; il est utile pour
l’état des appels et les transcriptions, mais toutes les transitions webhook/temps réel n’y apparaissent pas
forcément.

### L’appel en temps réel n’a pas de parole

Confirmez qu’un seul mode audio est activé. `realtime.enabled` et
`streaming.enabled` ne peuvent pas être tous deux à true.

Pour les appels Twilio en temps réel, vérifiez aussi :

- Un plugin fournisseur temps réel est chargé et enregistré.
- `realtime.provider` n’est pas défini ou nomme un fournisseur enregistré.
- La clé API du fournisseur est disponible pour le processus Gateway.
- `openclaw logs --follow` affiche le TwiML temps réel servi, le pont temps réel
  démarré, et le message d’accueil initial mis en file d’attente.

## Associés

- [Mode conversation](/fr/nodes/talk)
- [Synthèse vocale](/fr/tools/tts)
- [Réveil vocal](/fr/nodes/voicewake)
