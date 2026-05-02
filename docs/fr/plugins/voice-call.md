---
read_when:
    - Vous voulez passer un appel vocal sortant depuis OpenClaw
    - Vous configurez ou développez le Plugin d’appel vocal
    - Vous avez besoin de voix en temps réel ou de transcription en continu pour la téléphonie
sidebarTitle: Voice call
summary: Passez des appels vocaux sortants et acceptez des appels vocaux entrants via Twilio, Telnyx ou Plivo, avec, en option, la voix en temps réel et la transcription en continu
title: Plugin d’appel vocal
x-i18n:
    generated_at: "2026-05-02T21:01:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f04b14ad1aafcc6036aff2301d9d0210c0cde333051ed89d498c51b4e0c0353
    source_path: plugins/voice-call.md
    workflow: 16
---

Appels vocaux pour OpenClaw via un plugin. Prend en charge les notifications sortantes,
les conversations à plusieurs tours, la voix temps réel full-duplex, la transcription
en streaming et les appels entrants avec des politiques de liste d’autorisation.

**Fournisseurs actuels :** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (développement/sans réseau).

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

    Si npm signale que le paquet détenu par OpenClaw est obsolète, cette version de paquet
    provient d’une ancienne chaîne de paquets externe ; utilisez une build OpenClaw empaquetée
    actuelle ou le chemin du dossier local jusqu’à la publication d’un paquet npm plus récent.

    Redémarrez ensuite le Gateway afin que le plugin se charge.

  </Step>
  <Step title="Configure provider and webhook">
    Définissez la configuration sous `plugins.entries.voice-call.config` (voir
    [Configuration](#configuration) ci-dessous pour la forme complète). Au minimum :
    `provider`, les identifiants du fournisseur, `fromNumber` et une URL de webhook
    publiquement accessible.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    La sortie par défaut est lisible dans les journaux de discussion et les terminaux. Elle vérifie
    l’activation du plugin, les identifiants du fournisseur, l’exposition du webhook et que
    seul un mode audio (`streaming` ou `realtime`) est actif. Utilisez
    `--json` pour les scripts.

  </Step>
  <Step title="Smoke test">
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
Si `publicUrl`, l’URL du tunnel, l’URL Tailscale ou le repli de service
résout vers le loopback ou un espace réseau privé, la configuration échoue au lieu de
démarrer un fournisseur qui ne peut pas recevoir les webhooks de l’opérateur.
</Warning>

## Configuration

Si `enabled: true` mais que le fournisseur sélectionné n’a pas les identifiants requis,
le démarrage du Gateway consigne un avertissement de configuration incomplète avec les clés manquantes et
ignore le démarrage du runtime. Les commandes, les appels RPC et les outils d’agent renvoient tout de même
la configuration exacte de fournisseur manquante lorsqu’ils sont utilisés.

<Note>
Les identifiants voice-call acceptent les SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` et `plugins.entries.voice-call.config.tts.providers.*.apiKey` se résolvent via la surface SecretRef standard ; voir [surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface).
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
  <Accordion title="Provider exposure and security notes">
    - Twilio, Telnyx et Plivo exigent tous une URL de webhook **publiquement accessible**.
    - `mock` est un fournisseur de développement local (aucun appel réseau).
    - Telnyx exige `telnyx.publicKey` (ou `TELNYX_PUBLIC_KEY`), sauf si `skipSignatureVerification` vaut true.
    - `skipSignatureVerification` est réservé aux tests locaux.
    - Sur l’offre gratuite de ngrok, définissez `publicUrl` sur l’URL ngrok exacte ; la vérification de signature est toujours appliquée.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` autorise les webhooks Twilio avec des signatures non valides **uniquement** lorsque `tunnel.provider="ngrok"` et que `serve.bind` est le loopback (agent local ngrok). Développement local uniquement.
    - Les URL de l’offre gratuite de ngrok peuvent changer ou ajouter un comportement interstitiel ; si `publicUrl` dérive, les signatures Twilio échouent. Production : préférez un domaine stable ou un funnel Tailscale.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` ferme les sockets qui n’envoient jamais de trame `start` valide.
    - `streaming.maxPendingConnections` plafonne le nombre total de sockets pré-démarrage non authentifiées.
    - `streaming.maxPendingConnectionsPerIp` plafonne les sockets pré-démarrage non authentifiées par IP source.
    - `streaming.maxConnections` plafonne le nombre total de sockets de flux média ouvertes (en attente + actives).

  </Accordion>
  <Accordion title="Legacy config migrations">
    Les anciennes configurations utilisant `provider: "log"`, `twilio.from` ou les anciennes clés
    OpenAI `streaming.*` sont réécrites par `openclaw doctor --fix`.
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

## Portée de session

Par défaut, Voice Call utilise `sessionScope: "per-phone"` afin que les appels répétés du
même appelant conservent la mémoire de conversation. Définissez `sessionScope: "per-call"` lorsque
chaque appel opérateur doit commencer avec un contexte frais, par exemple pour l’accueil,
la réservation, l’IVR ou les flux de pont Google Meet où le même numéro de téléphone peut
représenter différentes réunions.

## Conversations vocales en temps réel

`realtime` sélectionne un fournisseur de voix temps réel full-duplex pour l’audio d’appel
en direct. Il est distinct de `streaming`, qui transmet seulement l’audio aux
fournisseurs de transcription en temps réel.

<Warning>
`realtime.enabled` ne peut pas être combiné avec `streaming.enabled`. Choisissez un
mode audio par appel.
</Warning>

Comportement runtime actuel :

- `realtime.enabled` est pris en charge pour Twilio Media Streams.
- `realtime.provider` est facultatif. S’il n’est pas défini, Voice Call utilise le premier fournisseur de voix temps réel enregistré.
- Fournisseurs de voix temps réel inclus : Google Gemini Live (`google`) et OpenAI (`openai`), enregistrés par leurs plugins fournisseurs.
- La configuration brute détenue par le fournisseur se trouve sous `realtime.providers.<providerId>`.
- Voice Call expose par défaut l’outil temps réel partagé `openclaw_agent_consult`. Le modèle temps réel peut l’appeler lorsque l’appelant demande un raisonnement plus approfondi, des informations actuelles ou des outils OpenClaw normaux.
- `realtime.fastContext.enabled` est désactivé par défaut. Lorsqu’il est activé, Voice Call recherche d’abord dans la mémoire indexée/le contexte de session pour la question de consultation et renvoie ces extraits au modèle temps réel dans `realtime.fastContext.timeoutMs` avant de revenir à l’agent de consultation complet uniquement si `realtime.fastContext.fallbackToConsult` vaut true.
- Si `realtime.provider` pointe vers un fournisseur non enregistré, ou si aucun fournisseur de voix temps réel n’est enregistré, Voice Call consigne un avertissement et ignore le média temps réel au lieu de faire échouer tout le plugin.
- Les clés de session de consultation réutilisent la session d’appel stockée lorsqu’elle est disponible, puis se replient sur le `sessionScope` configuré (`per-phone` par défaut, ou `per-call` pour les appels isolés).

### Politique d’outil

`realtime.toolPolicy` contrôle l’exécution de consultation :

| Politique        | Comportement                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Expose l’outil de consultation et limite l’agent normal à `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` et `memory_get`. |
| `owner`          | Expose l’outil de consultation et laisse l’agent normal utiliser la politique d’outils d’agent normale.                                 |
| `none`           | N’expose pas l’outil de consultation. Les `realtime.tools` personnalisés sont toujours transmis au fournisseur temps réel.               |

### Exemples de fournisseurs temps réel

<Tabs>
  <Tab title="Google Gemini Live">
    Valeurs par défaut : clé d’API depuis `realtime.providers.google.apiKey`,
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

Voir [fournisseur Google](/fr/providers/google) et
[fournisseur OpenAI](/fr/providers/openai) pour les options de voix temps réel
propres à chaque fournisseur.

## Transcription en streaming

`streaming` sélectionne un fournisseur de transcription en temps réel pour l’audio d’appel en direct.

Comportement runtime actuel :

- `streaming.provider` est facultatif. S’il n’est pas défini, Voice Call utilise le premier fournisseur de transcription temps réel enregistré.
- Fournisseurs de transcription temps réel inclus : Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) et xAI (`xai`), enregistrés par leurs Plugins fournisseurs.
- La configuration brute appartenant au fournisseur se trouve sous `streaming.providers.<providerId>`.
- Après que Twilio envoie un message `start` de stream accepté, Voice Call enregistre le stream immédiatement, met en file d’attente les médias entrants via le fournisseur de transcription pendant que le fournisseur se connecte, puis lance le message d’accueil initial uniquement lorsque la transcription temps réel est prête.
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
    Valeurs par défaut : clé API `streaming.providers.xai.apiKey` ou `XAI_API_KEY` ;
    endpoint `wss://api.x.ai/v1/stt` ; encodage `mulaw` ; fréquence d’échantillonnage `8000` ;
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
lors des appels. Vous pouvez la remplacer dans la configuration du Plugin avec la
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
**La synthèse vocale Microsoft est ignorée pour les appels vocaux.** L’audio téléphonique nécessite du PCM ;
le transport Microsoft actuel n’expose pas de sortie PCM téléphonique.
</Warning>

Notes de comportement :

- Les anciennes clés `tts.<provider>` dans la configuration du Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) sont réparées par `openclaw doctor --fix` ; la configuration validée doit utiliser `tts.providers.<provider>`.
- Le TTS principal est utilisé lorsque le streaming média Twilio est activé ; sinon, les appels reviennent aux voix natives du fournisseur.
- Si un stream média Twilio est déjà actif, Voice Call ne revient pas à TwiML `<Say>`. Si le TTS téléphonique n’est pas disponible dans cet état, la demande de lecture échoue au lieu de mélanger deux chemins de lecture.
- Lorsque le TTS téléphonique bascule vers un fournisseur secondaire, Voice Call journalise un avertissement avec la chaîne de fournisseurs (`from`, `to`, `attempts`) pour le débogage.
- Lorsque le barge-in Twilio ou le démontage du stream vide la file TTS en attente, les demandes de lecture en file sont résolues au lieu de laisser les appelants attendre indéfiniment la fin de la lecture.

### Exemples de TTS

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

La politique entrante utilise `disabled` par défaut. Pour activer les appels entrants, définissez :

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` est un filtrage de l’identifiant d’appelant à faible assurance. Le
Plugin normalise la valeur `From` fournie par le fournisseur et la compare à
`allowFrom`. La vérification du Webhook authentifie la livraison par le fournisseur et
l’intégrité de la charge utile, mais elle ne prouve **pas** la propriété du numéro
d’appelant PSTN/VoIP. Traitez `allowFrom` comme un filtrage d’identifiant d’appelant, pas comme une identité forte de l’appelant.
</Warning>

Les réponses automatiques utilisent le système d’agent. Ajustez-les avec `responseModel`,
`responseSystemPrompt` et `responseTimeoutMs`.

### Routage par numéro

Utilisez `numbers` lorsqu’un Plugin Voice Call reçoit des appels pour plusieurs numéros de téléphone
et que chaque numéro doit se comporter comme une ligne différente. Par exemple, un
numéro peut utiliser un assistant personnel informel tandis qu’un autre utilise un persona professionnel,
un agent de réponse différent et une voix TTS différente.

Les routes sont sélectionnées à partir du numéro composé `To` fourni par le fournisseur. Les clés doivent être
des numéros E.164. Lorsqu’un appel arrive, Voice Call résout la route correspondante une seule fois,
stocke la route correspondante dans l’enregistrement d’appel et réutilise cette configuration effective
pour le message d’accueil, le chemin de réponse automatique classique, le chemin de consultation temps réel et la lecture
TTS. Si aucune route ne correspond, la configuration globale de Voice Call est utilisée.
Les appels sortants n’utilisent pas `numbers` ; transmettez explicitement la cible sortante, le message et
la session lors de l’initiation de l’appel.

Les remplacements de route prennent actuellement en charge :

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

La valeur de route `tts` est fusionnée en profondeur par-dessus la configuration globale `tts` de Voice Call, vous pouvez donc
généralement remplacer uniquement la voix du fournisseur :

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

Pour les réponses automatiques, Voice Call ajoute un contrat strict de sortie vocale à
l’invite système :

```text
{"spoken":"..."}
```

Voice Call extrait le texte vocal de manière défensive :

- Ignore les charges utiles marquées comme contenu de raisonnement/erreur.
- Analyse le JSON direct, le JSON encadré ou les clés `"spoken"` en ligne.
- Revient au texte brut et supprime les paragraphes d’introduction de planification/méta probables.

Cela maintient la lecture vocale centrée sur le texte destiné à l’appelant et évite
de divulguer du texte de planification dans l’audio.

### Comportement au démarrage de la conversation

Pour les appels `conversation` sortants, la gestion du premier message est liée à l’état de lecture
en direct :

- Le vidage de la file de barge-in et la réponse automatique sont supprimés uniquement pendant que le message d’accueil initial est en cours de parole active.
- Si la lecture initiale échoue, l’appel revient à `listening` et le message initial reste en file d’attente pour une nouvelle tentative.
- La lecture initiale pour le streaming Twilio commence à la connexion du stream sans délai supplémentaire.
- Le barge-in interrompt la lecture active et vide les entrées TTS Twilio en file d’attente mais pas encore en cours de lecture. Les entrées vidées sont résolues comme ignorées, afin que la logique de réponse suivante puisse continuer sans attendre un audio qui ne sera jamais lu.
- Les conversations vocales temps réel utilisent le tour d’ouverture propre au stream temps réel. Voice Call ne publie **pas** de mise à jour TwiML `<Say>` héritée pour ce message initial, afin que les sessions `<Connect><Stream>` sortantes restent attachées.

### Délai de grâce à la déconnexion du stream Twilio

Lorsqu’un stream média Twilio se déconnecte, Voice Call attend **2000 ms** avant
de terminer automatiquement l’appel :

- Si le stream se reconnecte pendant cette fenêtre, la fin automatique est annulée.
- Si aucun stream ne se réenregistre après le délai de grâce, l’appel est terminé pour éviter des appels actifs bloqués.

## Nettoyage des appels obsolètes

Utilisez `staleCallReaperSeconds` pour terminer les appels qui ne reçoivent jamais de
Webhook terminal (par exemple, des appels en mode notification qui ne se terminent jamais). La valeur par défaut
est `0` (désactivé).

Plages recommandées :

- **Production :** `120`–`300` secondes pour les flux de type notification.
- Gardez cette valeur **supérieure à `maxDurationSeconds`** pour que les appels normaux puissent se terminer. Un bon point de départ est `maxDurationSeconds + 30–60` secondes.

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
contrôlent quels en-têtes transférés sont approuvés :

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Hôtes autorisés à partir des en-têtes de transfert.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Faire confiance aux en-têtes transférés sans liste d’autorisation.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Faire confiance aux en-têtes transférés uniquement lorsque l’IP distante de la requête correspond à la liste.
</ParamField>

Protections supplémentaires :

- La **protection contre la relecture** des Webhooks est activée pour Twilio et Plivo. Les requêtes Webhook valides rejouées sont acquittées mais ignorées pour les effets de bord.
- Les tours de conversation Twilio incluent un jeton par tour dans les rappels `<Gather>`, afin que les rappels vocaux obsolètes/rejoués ne puissent pas satisfaire un tour de transcription en attente plus récent.
- Les requêtes Webhook non authentifiées sont rejetées avant la lecture du corps lorsque les en-têtes de signature requis du fournisseur sont absents.
- Le Webhook voice-call utilise le profil partagé de corps en pré-authentification (64 Ko / 5 secondes) plus une limite par IP des requêtes en cours avant la vérification de signature.

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
au runtime voice-call appartenant au Gateway afin que la CLI ne lie pas un deuxième
serveur Webhook. Si aucun Gateway n’est joignable, les commandes reviennent à un
runtime CLI autonome.

`latency` lit `calls.jsonl` depuis le chemin de stockage d’appels vocaux par défaut.
Utilisez `--file <path>` pour pointer vers un journal différent et `--last <n>` pour limiter
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

Ce dépôt fournit une documentation de skill correspondante à `skills/voice-call/SKILL.md`.

## RPC du Gateway

| Méthode             | Arguments                                  |
| ------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` est valide uniquement avec `mode: "conversation"`. Les appels en mode notification
doivent utiliser `voicecall.dtmf` après l’existence de l’appel s’ils ont besoin de chiffres
après connexion.

## Dépannage

### La configuration échoue à l’exposition du Webhook

Exécutez la configuration depuis le même environnement que celui qui exécute le Gateway :

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Pour `twilio`, `telnyx` et `plivo`, `webhook-exposure` doit être vert. Un
`publicUrl` configuré échoue tout de même lorsqu’il pointe vers un espace réseau local ou privé,
car l’opérateur ne peut pas rappeler ces adresses. N’utilisez pas
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` ou `fd00::/8` comme `publicUrl`.

Les appels sortants Twilio en mode notification envoient leur TwiML `<Say>` initial directement dans
la requête de création d’appel, de sorte que le premier message prononcé ne dépend pas de la
récupération du TwiML de Webhook par Twilio. Un Webhook public reste requis pour les rappels d’état,
les appels conversationnels, le DTMF avant connexion, les flux temps réel et le contrôle d’appel
après connexion.

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

`voicecall smoke` est un essai à blanc sauf si vous passez `--yes`.

### Les identifiants du fournisseur échouent

Vérifiez le fournisseur sélectionné et les champs d’identifiants requis :

- Twilio : `twilio.accountSid`, `twilio.authToken` et `fromNumber`, ou
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` et `TWILIO_FROM_NUMBER`.
- Telnyx : `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` et
  `fromNumber`.
- Plivo : `plivo.authId`, `plivo.authToken` et `fromNumber`.

Les identifiants doivent exister sur l’hôte du Gateway. Modifier un profil de shell local
n’affecte pas un Gateway déjà en cours d’exécution tant qu’il ne redémarre pas ou ne recharge pas son
environnement.

### Les appels démarrent mais les Webhooks du fournisseur n’arrivent pas

Confirmez que la console du fournisseur pointe vers l’URL de Webhook publique exacte :

```text
https://voice.example.com/voice/webhook
```

Inspectez ensuite l’état d’exécution :

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Causes courantes :

- `publicUrl` pointe vers un chemin différent de `serve.path`.
- L’URL du tunnel a changé après le démarrage du Gateway.
- Un proxy transmet la requête mais supprime ou réécrit les en-têtes host/proto.
- Le pare-feu ou le DNS achemine le nom d’hôte public ailleurs que vers le Gateway.
- Le Gateway a été redémarré sans le Plugin Voice Call activé.

Lorsqu’un proxy inverse ou un tunnel se trouve devant le Gateway, définissez
`webhookSecurity.allowedHosts` sur le nom d’hôte public, ou utilisez
`webhookSecurity.trustedProxyIPs` pour une adresse de proxy connue. Utilisez
`webhookSecurity.trustForwardingHeaders` uniquement lorsque la frontière du proxy est sous
votre contrôle.

### La vérification de signature échoue

Les signatures du fournisseur sont vérifiées par rapport à l’URL publique qu’OpenClaw reconstruit
à partir de la requête entrante. Si les signatures échouent :

- Confirmez que l’URL de Webhook du fournisseur correspond exactement à `publicUrl`, y compris
  le schéma, l’hôte et le chemin.
- Pour les URL ngrok en offre gratuite, mettez à jour `publicUrl` lorsque le nom d’hôte du tunnel change.
- Assurez-vous que le proxy conserve les en-têtes host et proto d’origine, ou configurez
  `webhookSecurity.allowedHosts`.
- N’activez pas `skipSignatureVerification` en dehors des tests locaux.

### Les connexions Google Meet avec Twilio échouent

Google Meet utilise ce Plugin pour les connexions par appel Twilio. Vérifiez d’abord Voice Call :

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Puis vérifiez explicitement le transport Google Meet :

```bash
openclaw googlemeet setup --transport twilio
```

Si Voice Call est vert mais que le participant Meet ne rejoint jamais, vérifiez le numéro d’appel
Meet, le PIN et `--dtmf-sequence`. L’appel téléphonique peut être sain tandis que
la réunion rejette ou ignore une séquence DTMF incorrecte.

Google Meet transmet la séquence DTMF Meet et le texte d’introduction à `voicecall.start`.
Pour les appels Twilio, Voice Call sert d’abord le TwiML DTMF, redirige vers le
Webhook, puis ouvre le flux média temps réel afin que l’introduction enregistrée soit générée
après que le participant téléphonique a rejoint la réunion.

Utilisez `openclaw logs --follow` pour la trace de phase en direct. Une connexion Twilio Meet
saine consigne cet ordre :

- Google Meet délègue la connexion Twilio à Voice Call.
- Voice Call stocke le TwiML DTMF avant connexion.
- Le TwiML initial de Twilio est consommé et servi avant le traitement temps réel.
- Voice Call sert le TwiML temps réel pour l’appel Twilio.
- Le pont temps réel démarre avec le message d’accueil initial en file d’attente.

`openclaw voicecall tail` affiche toujours les enregistrements d’appels persistés ; il est utile pour
l’état des appels et les transcriptions, mais toutes les transitions Webhook/temps réel n’y apparaissent
pas.

### L’appel temps réel n’a pas de parole

Confirmez qu’un seul mode audio est activé. `realtime.enabled` et
`streaming.enabled` ne peuvent pas tous deux être `true`.

Pour les appels Twilio temps réel, vérifiez aussi :

- Un Plugin fournisseur temps réel est chargé et enregistré.
- `realtime.provider` n’est pas défini ou nomme un fournisseur enregistré.
- La clé d’API du fournisseur est disponible pour le processus Gateway.
- `openclaw logs --follow` montre le TwiML temps réel servi, le pont temps réel
  démarré et le message d’accueil initial mis en file d’attente.

## Articles associés

- [Mode conversation](/fr/nodes/talk)
- [Synthèse vocale](/fr/tools/tts)
- [Réveil vocal](/fr/nodes/voicewake)
