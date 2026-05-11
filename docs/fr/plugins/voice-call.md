---
read_when:
    - Vous souhaitez passer un appel vocal sortant depuis OpenClaw
    - Vous configurez ou développez le Plugin d’appel vocal
    - Vous avez besoin de voix en temps réel ou de transcription en continu pour la téléphonie
sidebarTitle: Voice call
summary: Passez des appels vocaux sortants et acceptez des appels vocaux entrants via Twilio, Telnyx ou Plivo, avec voix en temps réel et transcription en streaming facultatives
title: Plugin d’appel vocal
x-i18n:
    generated_at: "2026-05-11T20:51:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94e3942b8330ebf2014f1899267f69f8a135859cfa1002ae390244a4f89883d6
    source_path: plugins/voice-call.md
    workflow: 16
---

Appels vocaux pour OpenClaw via un plugin. Prend en charge les notifications sortantes,
les conversations à plusieurs tours, la voix en temps réel full-duplex, la transcription
en streaming et les appels entrants avec des politiques de liste d’autorisation.

**Fournisseurs actuels :** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + transfert XML + GetInput
speech), `mock` (développement/sans réseau).

<Note>
Le plugin Voice Call s’exécute **à l’intérieur du processus Gateway**. Si vous utilisez un
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

    Utilisez le paquet nu pour suivre l’étiquette de publication officielle actuelle. Épinglez une
    version exacte uniquement lorsque vous avez besoin d’une installation reproductible.

    Redémarrez ensuite le Gateway afin que le plugin se charge.

  </Step>
  <Step title="Configurer le fournisseur et le webhook">
    Définissez la configuration sous `plugins.entries.voice-call.config` (voir
    [Configuration](#configuration) ci-dessous pour la forme complète). Au minimum :
    `provider`, les identifiants du fournisseur, `fromNumber` et une URL de webhook
    accessible publiquement.
  </Step>
  <Step title="Vérifier la configuration">
    ```bash
    openclaw voicecall setup
    ```

    La sortie par défaut est lisible dans les journaux de chat et les terminaux. Elle vérifie
    l’activation du plugin, les identifiants du fournisseur, l’exposition du webhook et qu’un
    seul mode audio (`streaming` ou `realtime`) est actif. Utilisez
    `--json` pour les scripts.

  </Step>
  <Step title="Test de fumée">
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
Pour Twilio, Telnyx et Plivo, la configuration doit résoudre vers une **URL de webhook publique**.
Si `publicUrl`, l’URL du tunnel, l’URL Tailscale ou le fallback de service
résout vers une adresse de loopback ou un espace réseau privé, la configuration échoue au lieu de
démarrer un fournisseur qui ne peut pas recevoir les webhooks opérateur.
</Warning>

## Configuration

Si `enabled: true` mais que les identifiants du fournisseur sélectionné sont manquants,
le démarrage du Gateway journalise un avertissement de configuration incomplète avec les clés manquantes et
ignore le démarrage du runtime. Les commandes, appels RPC et outils d’agent renvoient toujours
la configuration exacte manquante du fournisseur lorsqu’ils sont utilisés.

<Note>
Les identifiants Voice Call acceptent les SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` et `plugins.entries.voice-call.config.tts.providers.*.apiKey` sont résolus via la surface SecretRef standard ; voir [Surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface).
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
  <Accordion title="Notes sur l’exposition et la sécurité des fournisseurs">
    - Twilio, Telnyx et Plivo nécessitent tous une URL de webhook **accessible publiquement**.
    - `mock` est un fournisseur de développement local (aucun appel réseau).
    - Telnyx nécessite `telnyx.publicKey` (ou `TELNYX_PUBLIC_KEY`), sauf si `skipSignatureVerification` vaut true.
    - `skipSignatureVerification` est réservé aux tests locaux.
    - Sur l’offre gratuite ngrok, définissez `publicUrl` sur l’URL ngrok exacte ; la vérification de signature est toujours appliquée.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` autorise les webhooks Twilio avec des signatures invalides **uniquement** lorsque `tunnel.provider="ngrok"` et que `serve.bind` est en loopback (agent local ngrok). Développement local uniquement.
    - Les URL de l’offre gratuite ngrok peuvent changer ou ajouter un comportement interstitiel ; si `publicUrl` dérive, les signatures Twilio échouent. Production : préférez un domaine stable ou un tunnel Tailscale.

  </Accordion>
  <Accordion title="Plafonds des connexions de streaming">
    - `streaming.preStartTimeoutMs` ferme les sockets qui n’envoient jamais de trame `start` valide.
    - `streaming.maxPendingConnections` limite le nombre total de sockets pré-démarrage non authentifiés.
    - `streaming.maxPendingConnectionsPerIp` limite les sockets pré-démarrage non authentifiés par IP source.
    - `streaming.maxConnections` limite le nombre total de sockets de flux média ouverts (en attente + actifs).

  </Accordion>
  <Accordion title="Migrations de configuration héritée">
    Les anciennes configurations utilisant `provider: "log"`, `twilio.from` ou les anciennes clés OpenAI
    `streaming.*` sont réécrites par `openclaw doctor --fix`.
    Le fallback d’exécution accepte encore les anciennes clés voice-call pour le moment, mais
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
chaque appel opérateur doit démarrer avec un contexte neuf, par exemple pour la réception,
la réservation, l’IVR ou les flux de passerelle Google Meet où le même numéro de téléphone peut
représenter différentes réunions.

## Conversations vocales en temps réel

`realtime` sélectionne un fournisseur vocal en temps réel full-duplex pour l’audio
des appels en direct. Il est distinct de `streaming`, qui transfère uniquement l’audio vers
des fournisseurs de transcription en temps réel.

<Warning>
`realtime.enabled` ne peut pas être combiné avec `streaming.enabled`. Choisissez un
mode audio par appel.
</Warning>

Comportement d’exécution actuel :

- `realtime.enabled` est pris en charge pour Twilio Media Streams.
- `realtime.provider` est facultatif. S’il n’est pas défini, Voice Call utilise le premier fournisseur vocal en temps réel enregistré.
- Fournisseurs vocaux en temps réel inclus : Google Gemini Live (`google`) et OpenAI (`openai`), enregistrés par leurs plugins fournisseurs.
- La configuration brute détenue par le fournisseur se trouve sous `realtime.providers.<providerId>`.
- Voice Call expose l’outil partagé en temps réel `openclaw_agent_consult` par défaut. Le modèle en temps réel peut l’appeler lorsque l’appelant demande un raisonnement plus approfondi, des informations actuelles ou des outils OpenClaw normaux.
- `realtime.consultPolicy` ajoute facultativement des indications sur le moment où le modèle en temps réel doit appeler `openclaw_agent_consult`.
- `realtime.agentContext.enabled` est désactivé par défaut. Lorsqu’il est activé, Voice Call injecte une identité d’agent bornée, une surcharge de prompt système et une capsule de fichier d’espace de travail sélectionné dans les instructions du fournisseur en temps réel lors de la configuration de la session.
- `realtime.fastContext.enabled` est désactivé par défaut. Lorsqu’il est activé, Voice Call recherche d’abord dans la mémoire indexée/le contexte de session pour la question de consultation et renvoie ces extraits au modèle en temps réel dans `realtime.fastContext.timeoutMs` avant de basculer vers l’agent de consultation complet uniquement si `realtime.fastContext.fallbackToConsult` vaut true.
- Si `realtime.provider` pointe vers un fournisseur non enregistré, ou si aucun fournisseur vocal en temps réel n’est enregistré, Voice Call journalise un avertissement et ignore le média en temps réel au lieu de faire échouer tout le plugin.
- Les clés de session de consultation réutilisent la session d’appel stockée lorsqu’elle est disponible, puis se replient sur le `sessionScope` configuré (`per-phone` par défaut, ou `per-call` pour les appels isolés).

### Politique des outils

`realtime.toolPolicy` contrôle l’exécution de consultation :

| Politique        | Comportement                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Expose l’outil de consultation et limite l’agent standard à `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` et `memory_get`. |
| `owner`          | Expose l’outil de consultation et laisse l’agent standard utiliser la politique d’outils d’agent normale.                               |
| `none`           | N’expose pas l’outil de consultation. Les `realtime.tools` personnalisés sont toujours transmis au fournisseur en temps réel.            |

`realtime.consultPolicy` contrôle uniquement les instructions du modèle en temps réel :

| Politique     | Indication                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | Conserve le prompt par défaut et laisse le fournisseur décider quand appeler l’outil de consultation. |
| `substantive` | Répond directement aux simples transitions conversationnelles et consulte avant les faits, la mémoire, les outils ou le contexte. |
| `always`      | Consulte avant chaque réponse substantielle.                                                     |

### Contexte vocal de l’agent

Activez `realtime.agentContext` lorsque la passerelle vocale doit sonner comme l’agent
OpenClaw configuré sans payer un aller-retour complet de consultation d’agent sur
les tours ordinaires. La capsule de contexte est ajoutée une seule fois lorsque la session en temps réel est
créée, elle n’ajoute donc pas de latence par tour. Les appels à
`openclaw_agent_consult` exécutent toujours l’agent OpenClaw complet et doivent être utilisés
pour le travail avec les outils, les informations actuelles, les recherches en mémoire ou l’état de l’espace de travail.

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
              includeSystemPrompt: true,
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

### Exemples de fournisseurs en temps réel

<Tabs>
  <Tab title="Google Gemini Live">
    Valeurs par défaut : clé API issue de `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` ou `GOOGLE_GENERATIVE_AI_API_KEY` ; modèle
    `gemini-2.5-flash-native-audio-preview-12-2025` ; voix `Kore`.
    `sessionResumption` et `contextWindowCompression` sont activés par défaut pour les appels plus longs
    et reconnectables. Utilisez `silenceDurationMs`, `startSensitivity` et
    `endSensitivity` pour ajuster une prise de tour plus rapide sur l'audio téléphonique.

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

Consultez [Fournisseur Google](/fr/providers/google) et
[Fournisseur OpenAI](/fr/providers/openai) pour les options vocales en temps réel
propres aux fournisseurs.

## Transcription en streaming

`streaming` sélectionne un fournisseur de transcription en temps réel pour l'audio des appels en direct.

Comportement d'exécution actuel :

- `streaming.provider` est facultatif. S'il n'est pas défini, Voice Call utilise le premier fournisseur de transcription en temps réel enregistré.
- Fournisseurs de transcription en temps réel inclus : Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) et xAI (`xai`), enregistrés par leurs Plugins de fournisseur.
- La configuration brute détenue par le fournisseur se trouve sous `streaming.providers.<providerId>`.
- Après que Twilio a envoyé un message `start` de flux accepté, Voice Call enregistre le flux immédiatement, met en file d'attente les médias entrants via le fournisseur de transcription pendant que celui-ci se connecte, et ne lance le message d'accueil initial qu'une fois la transcription en temps réel prête.
- Si `streaming.provider` pointe vers un fournisseur non enregistré, ou si aucun fournisseur n'est enregistré, Voice Call journalise un avertissement et ignore le streaming média au lieu de faire échouer tout le Plugin.

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
    point de terminaison `wss://api.x.ai/v1/stt` ; encodage `mulaw` ; fréquence d'échantillonnage `8000` ;
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

Voice Call utilise la configuration principale `messages.tts` pour la parole
en streaming pendant les appels. Vous pouvez la remplacer dans la configuration du Plugin avec la
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
**Microsoft speech est ignoré pour les appels vocaux.** L'audio téléphonique nécessite du PCM ;
le transport Microsoft actuel n'expose pas de sortie PCM téléphonique.
</Warning>

Notes de comportement :

- Les anciennes clés `tts.<provider>` dans la configuration du Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) sont réparées par `openclaw doctor --fix` ; la configuration validée doit utiliser `tts.providers.<provider>`.
- Le TTS principal est utilisé lorsque le streaming média Twilio est activé ; sinon, les appels reviennent aux voix natives du fournisseur.
- Si un flux média Twilio est déjà actif, Voice Call ne revient pas à TwiML `<Say>`. Si le TTS téléphonique est indisponible dans cet état, la demande de lecture échoue au lieu de mélanger deux chemins de lecture.
- Lorsque le TTS téléphonique revient à un fournisseur secondaire, Voice Call journalise un avertissement avec la chaîne de fournisseurs (`from`, `to`, `attempts`) pour le débogage.
- Lorsque le barge-in Twilio ou le démontage du flux vide la file d'attente TTS en attente, les demandes de lecture en file d'attente se terminent au lieu de laisser les appelants attendre la fin de la lecture.

### Exemples TTS

<Tabs>
  <Tab title="TTS principal uniquement">
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

La politique entrante est par défaut `disabled`. Pour activer les appels entrants, définissez :

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
`allowFrom`. La vérification du Webhook authentifie la livraison du fournisseur et
l'intégrité de la charge utile, mais elle ne prouve **pas** la possession du numéro
d'appelant PSTN/VoIP. Traitez `allowFrom` comme un filtrage d'identifiant d'appelant, pas comme une identité
d'appelant forte.
</Warning>

Les réponses automatiques utilisent le système d'agent. Ajustez avec `responseModel`,
`responseSystemPrompt` et `responseTimeoutMs`.

### Routage par numéro

Utilisez `numbers` lorsqu'un Plugin Voice Call reçoit des appels pour plusieurs numéros de téléphone
et que chaque numéro doit se comporter comme une ligne différente. Par exemple, un
numéro peut utiliser un assistant personnel détendu tandis qu'un autre utilise une persona
professionnelle, un agent de réponse différent et une voix TTS différente.

Les routes sont sélectionnées à partir du numéro `To` composé fourni par le fournisseur. Les clés doivent être
des numéros E.164. Lorsqu'un appel arrive, Voice Call résout la route correspondante une seule fois,
stocke la route correspondante dans l'enregistrement d'appel et réutilise cette configuration effective
pour le message d'accueil, le chemin de réponse automatique classique, le chemin de consultation en temps réel et la lecture
TTS. Si aucune route ne correspond, la configuration globale de Voice Call est utilisée.
Les appels sortants n'utilisent pas `numbers` ; transmettez explicitement la cible sortante, le message et la
session lors du lancement de l'appel.

Les remplacements de route prennent actuellement en charge :

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

La valeur de route `tts` est fusionnée en profondeur par-dessus la configuration globale `tts` de Voice Call, donc
vous pouvez généralement ne remplacer que la voix du fournisseur :

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

### Contrat de sortie parlée

Pour les réponses automatiques, Voice Call ajoute un contrat strict de sortie parlée à
l'invite système :

```text
{"spoken":"..."}
```

Voice Call extrait le texte à prononcer de façon défensive :

- Ignore les charges utiles marquées comme contenu de raisonnement/d'erreur.
- Analyse le JSON direct, le JSON balisé ou les clés `"spoken"` en ligne.
- Revient au texte brut et supprime les paragraphes d'introduction susceptibles de relever de la planification ou des métadonnées.

Cela maintient la lecture parlée centrée sur le texte destiné à l'appelant et évite
de laisser fuiter du texte de planification dans l'audio.

### Comportement de démarrage de conversation

Pour les appels `conversation` sortants, la gestion du premier message est liée à l'état de
lecture en direct :

- Le vidage de la file de barge-in et la réponse automatique sont supprimés uniquement pendant que le message d'accueil initial est activement prononcé.
- Si la lecture initiale échoue, l'appel revient à `listening` et le message initial reste en file d'attente pour une nouvelle tentative.
- La lecture initiale pour le streaming Twilio démarre à la connexion du flux sans délai supplémentaire.
- Le barge-in interrompt la lecture active et vide les entrées TTS Twilio en file d'attente mais pas encore lues. Les entrées vidées se résolvent comme ignorées, afin que la logique de réponse de suivi puisse continuer sans attendre un audio qui ne sera jamais lu.
- Les conversations vocales en temps réel utilisent leur propre tour d'ouverture du flux en temps réel. Voice Call ne publie **pas** de mise à jour TwiML `<Say>` héritée pour ce message initial, afin que les sessions `<Connect><Stream>` sortantes restent attachées.

### Délai de grâce à la déconnexion du flux Twilio

Lorsqu'un flux média Twilio se déconnecte, Voice Call attend **2000 ms** avant
de terminer automatiquement l'appel :

- Si le flux se reconnecte pendant cette fenêtre, la fin automatique est annulée.
- Si aucun flux ne se réenregistre après la période de grâce, l'appel est terminé afin d'éviter des appels actifs bloqués.

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

## Sécurité des Webhooks

Lorsqu’un proxy ou un tunnel se trouve devant le Gateway, le Plugin
reconstruit l’URL publique pour la vérification de signature. Ces options
contrôlent les en-têtes transférés qui sont approuvés :

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Autoriser les hôtes depuis les en-têtes de transfert.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Approuver les en-têtes transférés sans liste d’autorisation.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  N’approuver les en-têtes transférés que lorsque l’adresse IP distante de la requête correspond à la liste.
</ParamField>

Protections supplémentaires :

- La **protection contre la relecture** des Webhooks est activée pour Twilio et Plivo. Les requêtes Webhook valides rejouées sont acquittées, mais ignorées pour les effets de bord.
- Les tours de conversation Twilio incluent un jeton par tour dans les rappels `<Gather>`, afin que les rappels vocaux obsolètes ou rejoués ne puissent pas satisfaire un tour de transcription en attente plus récent.
- Les requêtes Webhook non authentifiées sont rejetées avant la lecture du corps lorsque les en-têtes de signature requis par le fournisseur sont absents.
- Le Webhook voice-call utilise le profil de corps préauthentification partagé (64 Ko / 5 secondes), plus une limite par IP sur les requêtes en cours avant la vérification de signature.

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

Lorsque le Gateway est déjà en cours d’exécution, les commandes opérationnelles
`voicecall` délèguent au runtime voice-call appartenant au Gateway afin que la
CLI ne lie pas un second serveur Webhook. Si aucun Gateway n’est joignable, les
commandes se replient sur un runtime CLI autonome.

`latency` lit `calls.jsonl` depuis le chemin de stockage voice-call par défaut.
Utilisez `--file <path>` pour pointer vers un autre journal et `--last <n>` pour limiter
l’analyse aux N derniers enregistrements (200 par défaut). La sortie inclut p50/p90/p99
pour la latence des tours et les temps d’attente d’écoute.

## Outil d’agent

Nom de l’outil : `voice_call`.

| Action          | Args                                       |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Ce dépôt fournit une documentation de Skills correspondante dans `skills/voice-call/SKILL.md`.

## RPC du Gateway

| Méthode             | Args                                       |
| ------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` n’est valide qu’avec `mode: "conversation"`. Les appels en mode
notification doivent utiliser `voicecall.dtmf` après l’existence de l’appel s’ils
ont besoin de chiffres après connexion.

## Dépannage

### La configuration échoue à exposer le Webhook

Exécutez la configuration depuis le même environnement que celui qui exécute le Gateway :

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Pour `twilio`, `telnyx` et `plivo`, `webhook-exposure` doit être vert. Une
`publicUrl` configurée échoue quand même lorsqu’elle pointe vers un espace réseau
local ou privé, car l’opérateur ne peut pas rappeler ces adresses. N’utilisez pas
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` ou `fd00::/8` comme `publicUrl`.

Les appels sortants Twilio en mode notification envoient leur TwiML `<Say>` initial
directement dans la requête de création d’appel ; le premier message parlé ne dépend
donc pas de la récupération du TwiML Webhook par Twilio. Un Webhook public reste requis
pour les rappels de statut, les appels de conversation, le DTMF avant connexion, les flux
en temps réel et le contrôle d’appel après connexion.

Utilisez un seul chemin d’exposition public :

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
n’affecte pas un Gateway déjà en cours d’exécution tant qu’il ne redémarre pas ou ne recharge
pas son environnement.

### Les appels démarrent, mais les Webhooks du fournisseur n’arrivent pas

Vérifiez que la console du fournisseur pointe vers l’URL Webhook publique exacte :

```text
https://voice.example.com/voice/webhook
```

Inspectez ensuite l’état du runtime :

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Causes fréquentes :

- `publicUrl` pointe vers un chemin différent de `serve.path`.
- L’URL du tunnel a changé après le démarrage du Gateway.
- Un proxy transfère la requête, mais supprime ou réécrit les en-têtes d’hôte/protocole.
- Un pare-feu ou le DNS route le nom d’hôte public ailleurs que vers le Gateway.
- Le Gateway a été redémarré sans le Plugin Voice Call activé.

Lorsqu’un proxy inverse ou un tunnel se trouve devant le Gateway, définissez
`webhookSecurity.allowedHosts` sur le nom d’hôte public, ou utilisez
`webhookSecurity.trustedProxyIPs` pour une adresse de proxy connue. Utilisez
`webhookSecurity.trustForwardingHeaders` uniquement lorsque la limite du proxy est sous
votre contrôle.

### La vérification de signature échoue

Les signatures du fournisseur sont vérifiées par rapport à l’URL publique qu’OpenClaw reconstruit
à partir de la requête entrante. Si les signatures échouent :

- Vérifiez que l’URL Webhook du fournisseur correspond exactement à `publicUrl`, y compris
  le schéma, l’hôte et le chemin.
- Pour les URL ngrok de l’offre gratuite, mettez à jour `publicUrl` lorsque le nom d’hôte du tunnel change.
- Assurez-vous que le proxy préserve les en-têtes d’hôte et de protocole d’origine, ou configurez
  `webhookSecurity.allowedHosts`.
- N’activez pas `skipSignatureVerification` en dehors des tests locaux.

### Les jointures Google Meet via Twilio échouent

Google Meet utilise ce Plugin pour les jointures par appel Twilio. Vérifiez d’abord Voice Call :

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Vérifiez ensuite explicitement le transport Google Meet :

```bash
openclaw googlemeet setup --transport twilio
```

Si Voice Call est vert, mais que le participant Meet ne rejoint jamais, vérifiez le numéro
d’appel entrant Meet, le PIN et `--dtmf-sequence`. L’appel téléphonique peut être sain tandis
que la réunion rejette ou ignore une séquence DTMF incorrecte.

Google Meet démarre la liaison téléphonique Twilio via `voicecall.start` avec une séquence DTMF
avant connexion. Les séquences dérivées du PIN incluent le `voiceCall.dtmfDelayMs` du Plugin
Google Meet comme chiffres d’attente Twilio en tête. La valeur par défaut est de 12 secondes,
car les invites d’appel entrant Meet peuvent arriver tard. Voice Call redirige ensuite vers
la gestion en temps réel avant que le message d’accueil d’introduction ne soit demandé.

Utilisez `openclaw logs --follow` pour la trace de phase en direct. Une jointure Twilio Meet
saine journalise cet ordre :

- Google Meet délègue la jointure Twilio à Voice Call.
- Voice Call stocke le TwiML DTMF avant connexion.
- Le TwiML initial de Twilio est consommé et servi avant la gestion en temps réel.
- Voice Call sert le TwiML en temps réel pour l’appel Twilio.
- Google Meet demande le message d’introduction avec `voicecall.speak` après le délai post-DTMF.

`openclaw voicecall tail` affiche toujours les enregistrements d’appels persistés ; il est utile pour
l’état des appels et les transcriptions, mais toutes les transitions Webhook/temps réel n’y apparaissent
pas.

### L’appel en temps réel n’a pas de parole

Vérifiez qu’un seul mode audio est activé. `realtime.enabled` et
`streaming.enabled` ne peuvent pas tous deux être true.

Pour les appels Twilio en temps réel, vérifiez aussi :

- Un Plugin fournisseur temps réel est chargé et enregistré.
- `realtime.provider` n’est pas défini ou nomme un fournisseur enregistré.
- La clé API du fournisseur est disponible pour le processus Gateway.
- `openclaw logs --follow` affiche le TwiML en temps réel servi, le pont temps réel
  démarré et le message d’accueil initial mis en file d’attente.

## Associés

- [Mode conversation](/fr/nodes/talk)
- [Synthèse vocale](/fr/tools/tts)
- [Réveil vocal](/fr/nodes/voicewake)
