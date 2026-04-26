---
read_when:
    - Vous voulez passer un appel vocal sortant depuis OpenClaw
    - Vous configurez ou développez le Plugin voice-call
    - Vous avez besoin de voix en temps réel ou de transcription en continu sur la téléphonie
sidebarTitle: Voice call
summary: Passer des appels vocaux sortants et accepter des appels entrants via Twilio, Telnyx ou Plivo, avec voix en temps réel et transcription en streaming en option
title: Plugin d’appel vocal
x-i18n:
    generated_at: "2026-04-26T11:36:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77b5e4b338b0c39c71accea7065af70fab695c8f34488ba0fbf7023f2f36f377
    source_path: plugins/voice-call.md
    workflow: 15
---

Appels vocaux pour OpenClaw via un Plugin. Prend en charge les notifications sortantes,
les conversations multi-tours, la voix temps réel en duplex intégral, la transcription en continu,
et les appels entrants avec des politiques de liste d’autorisation.

**Fournisseurs actuels :** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + transfert XML + parole GetInput),
`mock` (développement/sans réseau).

<Note>
Le Plugin Voice Call s’exécute **à l’intérieur du processus Gateway**. Si vous utilisez un
Gateway distant, installez et configurez le Plugin sur la machine qui exécute le
Gateway, puis redémarrez le Gateway pour le charger.
</Note>

## Démarrage rapide

<Steps>
  <Step title="Installer le Plugin">
    <Tabs>
      <Tab title="Depuis npm (recommandé)">
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

    Redémarrez ensuite le Gateway pour que le Plugin soit chargé.

  </Step>
  <Step title="Configurer le fournisseur et le Webhook">
    Définissez la configuration sous `plugins.entries.voice-call.config` (voir
    [Configuration](#configuration) ci-dessous pour la structure complète). Au minimum :
    `provider`, les identifiants du fournisseur, `fromNumber`, et une URL de Webhook
    accessible publiquement.
  </Step>
  <Step title="Vérifier la configuration">
    ```bash
    openclaw voicecall setup
    ```

    La sortie par défaut est lisible dans les journaux de chat et les terminaux. Elle vérifie
    l’activation du Plugin, les identifiants du fournisseur, l’exposition du Webhook, et que
    un seul mode audio (`streaming` ou `realtime`) est actif. Utilisez
    `--json` pour les scripts.

  </Step>
  <Step title="Test de validation">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Les deux sont des essais à blanc par défaut. Ajoutez `--yes` pour réellement passer
    un court appel sortant de notification :

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Pour Twilio, Telnyx et Plivo, la configuration doit se résoudre vers une **URL de Webhook publique**.
Si `publicUrl`, l’URL du tunnel, l’URL Tailscale, ou la solution de repli de service
se résout vers une boucle locale ou un espace réseau privé, la configuration échoue au lieu de
démarrer un fournisseur qui ne peut pas recevoir les Webhooks de l’opérateur.
</Warning>

## Configuration

Si `enabled: true` mais qu’il manque des identifiants pour le fournisseur sélectionné,
le démarrage du Gateway enregistre un avertissement de configuration incomplète avec les clés manquantes et
ignore le démarrage du runtime. Les commandes, appels RPC et outils d’agent renvoient quand même
la configuration exacte manquante du fournisseur lorsqu’ils sont utilisés.

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
            // Clé publique du Webhook Telnyx depuis le Mission Control Portal
            // (Base64 ; peut aussi être définie via TELNYX_PUBLIC_KEY).
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

          // Sécurité du Webhook (recommandée pour les tunnels/proxys)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Exposition publique (choisissez-en une)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* voir Transcription en continu */ },
          realtime: { enabled: false /* voir Voix temps réel */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Notes sur l’exposition et la sécurité des fournisseurs">
    - Twilio, Telnyx et Plivo exigent tous une URL de Webhook **accessible publiquement**.
    - `mock` est un fournisseur de développement local (aucun appel réseau).
    - Telnyx exige `telnyx.publicKey` (ou `TELNYX_PUBLIC_KEY`) sauf si `skipSignatureVerification` vaut true.
    - `skipSignatureVerification` est uniquement destiné aux tests locaux.
    - Avec l’offre gratuite ngrok, définissez `publicUrl` sur l’URL ngrok exacte ; la vérification de signature est toujours appliquée.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` autorise les Webhooks Twilio avec des signatures invalides **uniquement** lorsque `tunnel.provider="ngrok"` et que `serve.bind` est en boucle locale (agent local ngrok). Développement local uniquement.
    - Les URL ngrok gratuites peuvent changer ou ajouter un comportement interstitiel ; si `publicUrl` dérive, les signatures Twilio échouent. En production : préférez un domaine stable ou un funnel Tailscale.
  </Accordion>
  <Accordion title="Plafonds de connexion en continu">
    - `streaming.preStartTimeoutMs` ferme les sockets qui n’envoient jamais de trame `start` valide.
    - `streaming.maxPendingConnections` limite le total des sockets pré-démarrage non authentifiés.
    - `streaming.maxPendingConnectionsPerIp` limite les sockets pré-démarrage non authentifiés par IP source.
    - `streaming.maxConnections` limite le total des sockets de flux multimédia ouverts (en attente + actifs).
  </Accordion>
  <Accordion title="Migrations de configuration héritée">
    Les anciennes configurations utilisant `provider: "log"`, `twilio.from`, ou les anciennes
    clés OpenAI `streaming.*` sont réécrites par `openclaw doctor --fix`.
    La solution de repli du runtime accepte encore pour l’instant les anciennes clés voice-call, mais
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

## Conversations vocales temps réel

`realtime` sélectionne un fournisseur vocal temps réel en duplex intégral pour l’audio
d’appel en direct. Il est distinct de `streaming`, qui ne transmet l’audio qu’aux
fournisseurs de transcription temps réel.

<Warning>
`realtime.enabled` ne peut pas être combiné avec `streaming.enabled`. Choisissez un seul
mode audio par appel.
</Warning>

Comportement actuel du runtime :

- `realtime.enabled` est pris en charge pour Twilio Media Streams.
- `realtime.provider` est facultatif. S’il n’est pas défini, Voice Call utilise le premier fournisseur vocal temps réel enregistré.
- Fournisseurs vocaux temps réel intégrés : Google Gemini Live (`google`) et OpenAI (`openai`), enregistrés par leurs Plugins fournisseur.
- La configuration brute propre au fournisseur se trouve sous `realtime.providers.<providerId>`.
- Voice Call expose par défaut l’outil temps réel partagé `openclaw_agent_consult`. Le modèle temps réel peut l’appeler lorsque l’appelant demande un raisonnement plus approfondi, des informations actuelles, ou les outils OpenClaw normaux.
- Si `realtime.provider` pointe vers un fournisseur non enregistré, ou si aucun fournisseur vocal temps réel n’est enregistré, Voice Call enregistre un avertissement et ignore le média temps réel au lieu de faire échouer tout le Plugin.
- Les clés de session de consultation réutilisent la session vocale existante lorsqu’elle est disponible, puis se replient sur le numéro de téléphone de l’appelant/du destinataire afin que les appels de consultation de suivi conservent le contexte pendant l’appel.

### Politique d’outil

`realtime.toolPolicy` contrôle l’exécution de la consultation :

| Politique        | Comportement                                                                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Expose l’outil de consultation et limite l’agent normal à `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, et `memory_get`. |
| `owner`          | Expose l’outil de consultation et permet à l’agent normal d’utiliser la politique d’outil normale de l’agent.                           |
| `none`           | N’expose pas l’outil de consultation. Les `realtime.tools` personnalisés sont tout de même transmis au fournisseur temps réel.          |

### Exemples de fournisseurs temps réel

<Tabs>
  <Tab title="Google Gemini Live">
    Valeurs par défaut : clé API depuis `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY`, ou `GOOGLE_GENERATIVE_AI_API_KEY` ; modèle
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
                instructions: "Parlez brièvement. Appelez openclaw_agent_consult avant d’utiliser des outils plus avancés.",
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

Consultez [Google provider](/fr/providers/google) et
[OpenAI provider](/fr/providers/openai) pour les options spécifiques aux fournisseurs de voix temps réel.

## Transcription en continu

`streaming` sélectionne un fournisseur de transcription temps réel pour l’audio d’appel en direct.

Comportement actuel du runtime :

- `streaming.provider` est facultatif. S’il n’est pas défini, Voice Call utilise le premier fournisseur de transcription temps réel enregistré.
- Fournisseurs de transcription temps réel intégrés : Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`), et xAI (`xai`), enregistrés par leurs Plugins fournisseur.
- La configuration brute propre au fournisseur se trouve sous `streaming.providers.<providerId>`.
- Si `streaming.provider` pointe vers un fournisseur non enregistré, ou si aucun n’est enregistré, Voice Call enregistre un avertissement et ignore le streaming multimédia au lieu de faire échouer tout le Plugin.

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

  </Tab>
</Tabs>

## TTS pour les appels

Voice Call utilise la configuration centrale `messages.tts` pour la synthèse
vocale en continu lors des appels. Vous pouvez la remplacer sous la configuration du plugin avec la
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

<Warning>
**Microsoft speech est ignoré pour les appels vocaux.** L’audio téléphonique nécessite du PCM ;
le transport Microsoft actuel n’expose pas de sortie PCM téléphonique.
</Warning>

Notes sur le comportement :

- Les anciennes clés `tts.<provider>` dans la configuration du plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) sont corrigées par `openclaw doctor --fix` ; la configuration validée doit utiliser `tts.providers.<provider>`.
- Le TTS central est utilisé lorsque le streaming multimédia Twilio est activé ; sinon, les appels reviennent aux voix natives du fournisseur.
- Si un flux multimédia Twilio est déjà actif, Voice Call ne revient pas à TwiML `<Say>`. Si le TTS téléphonique n’est pas disponible dans cet état, la demande de lecture échoue au lieu de mélanger deux chemins de lecture.
- Lorsque le TTS téléphonique revient à un fournisseur secondaire, Voice Call enregistre un avertissement avec la chaîne de fournisseurs (`from`, `to`, `attempts`) pour le débogage.
- Lorsque l’interruption Twilio ou l’arrêt du flux efface la file d’attente TTS en attente, les demandes de lecture en file se résolvent au lieu de laisser les appelants attendre indéfiniment la fin de la lecture.

### Exemples de TTS

<Tabs>
  <Tab title="TTS central uniquement">
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
  <Tab title="Remplacer par ElevenLabs (appels uniquement)">
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

La politique entrante est définie par défaut sur `disabled`. Pour activer les appels entrants, définissez :

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Bonjour ! Comment puis-je vous aider ?",
}
```

<Warning>
`inboundPolicy: "allowlist"` est un filtrage à faible assurance basé sur l’identifiant de l’appelant. Le
plugin normalise la valeur `From` fournie par le fournisseur et la compare à
`allowFrom`. La vérification du Webhook authentifie la livraison du fournisseur et
l’intégrité de la charge utile, mais elle ne **prouve pas** la propriété du numéro
d’appelant PSTN/VoIP. Traitez `allowFrom` comme un filtrage d’identifiant d’appelant, et non comme une
identité forte de l’appelant.
</Warning>

Les réponses automatiques utilisent le système d’agent. Ajustez avec `responseModel`,
`responseSystemPrompt`, et `responseTimeoutMs`.

### Contrat de sortie vocale

Pour les réponses automatiques, Voice Call ajoute un contrat strict de sortie vocale à
l’invite système :

```text
{"spoken":"..."}
```

Voice Call extrait le texte vocal de manière défensive :

- Ignore les charges utiles marquées comme contenu de raisonnement/erreur.
- Analyse le JSON direct, le JSON délimité, ou les clés `"spoken"` en ligne.
- Revient au texte brut et supprime les paragraphes d’introduction probables de planification/méta.

Cela permet de garder la lecture vocale centrée sur le texte destiné à l’appelant et évite
de faire fuiter du texte de planification dans l’audio.

### Comportement de démarrage des conversations

Pour les appels sortants `conversation`, la gestion du premier message est liée à l’état de
lecture en direct :

- L’effacement de la file d’attente par interruption et la réponse automatique sont supprimés uniquement pendant que le message d’accueil initial est effectivement en cours de lecture.
- Si la lecture initiale échoue, l’appel repasse à l’état `listening` et le message initial reste en file d’attente pour une nouvelle tentative.
- La lecture initiale pour le streaming Twilio démarre à la connexion du flux sans délai supplémentaire.
- L’interruption annule la lecture active et efface les entrées TTS Twilio en file d’attente mais pas encore en lecture. Les entrées effacées sont résolues comme ignorées, afin que la logique de réponse de suivi puisse continuer sans attendre un audio qui ne sera jamais lu.
- Les conversations vocales temps réel utilisent le propre tour d’ouverture du flux temps réel. Voice Call ne publie **pas** de mise à jour TwiML `<Say>` héritée pour ce message initial, afin que les sessions sortantes `<Connect><Stream>` restent attachées.

### Délai de grâce pour la déconnexion du flux Twilio

Lorsqu’un flux multimédia Twilio se déconnecte, Voice Call attend **2000 ms** avant
de terminer automatiquement l’appel :

- Si le flux se reconnecte pendant cette fenêtre, la fin automatique est annulée.
- Si aucun flux ne se réenregistre après la période de grâce, l’appel est terminé afin d’éviter les appels actifs bloqués.

## Nettoyeur des appels obsolètes

Utilisez `staleCallReaperSeconds` pour terminer les appels qui ne reçoivent jamais de Webhook
terminal (par exemple, les appels en mode notification qui ne se terminent jamais). La valeur par défaut
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

## Sécurité du Webhook

Lorsqu’un proxy ou un tunnel se trouve devant le Gateway, le plugin
reconstruit l’URL publique pour la vérification de signature. Ces options
contrôlent quels en-têtes transférés sont approuvés :

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Hôtes autorisés depuis les en-têtes de transfert.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Faire confiance aux en-têtes transférés sans liste d’autorisation.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Faire confiance aux en-têtes transférés uniquement lorsque l’IP distante de la requête correspond à la liste.
</ParamField>

Protections supplémentaires :

- La **protection contre la relecture** des Webhooks est activée pour Twilio et Plivo. Les requêtes Webhook valides rejouées sont reconnues mais ignorées pour les effets de bord.
- Les tours de conversation Twilio incluent un jeton par tour dans les rappels `<Gather>`, de sorte que les rappels vocaux obsolètes/rejoués ne peuvent pas satisfaire un tour de transcription en attente plus récent.
- Les requêtes Webhook non authentifiées sont rejetées avant la lecture du corps lorsque les en-têtes de signature requis par le fournisseur sont absents.
- Le Webhook voice-call utilise le profil partagé de corps pré-authentification (64 KB / 5 secondes) ainsi qu’un plafond par IP des requêtes en vol avant la vérification de signature.

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
openclaw voicecall start --to "+15555550123"   # alias pour call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # résume la latence des tours à partir des journaux
openclaw voicecall expose --mode funnel
```

`latency` lit `calls.jsonl` depuis le chemin de stockage voice-call par défaut.
Utilisez `--file <path>` pour pointer vers un autre journal et `--last <n>` pour limiter
l’analyse aux N derniers enregistrements (200 par défaut). La sortie inclut les p50/p90/p99
pour la latence des tours et les temps d’attente d’écoute.

## Outil d’agent

Nom de l’outil : `voice_call`.

| Action          | Args                      |
| --------------- | ------------------------- |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `send_dtmf`     | `callId`, `digits`        |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

Ce dépôt inclut un document Skills correspondant dans `skills/voice-call/SKILL.md`.

## RPC Gateway

| Méthode              | Args                      |
| -------------------- | ------------------------- |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## Lié

- [Talk mode](/fr/nodes/talk)
- [Text-to-speech](/fr/tools/tts)
- [Voice wake](/fr/nodes/voicewake)
