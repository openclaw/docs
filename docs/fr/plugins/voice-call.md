---
read_when:
    - Vous souhaitez passer un appel vocal sortant depuis OpenClaw
    - Vous configurez ou développez le plugin d’appel vocal
    - Vous avez besoin d’une transcription vocale en temps réel ou en streaming pour la téléphonie
sidebarTitle: Voice call
summary: Passez des appels vocaux sortants et acceptez les appels entrants via Twilio, Telnyx ou Plivo, avec, en option, une communication vocale en temps réel et une transcription en continu.
title: Plugin d’appels vocaux
x-i18n:
    generated_at: "2026-07-12T15:39:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ed6fb5c7e08666e14a0280115eb8f501543ec0bb48cbe5169278b273791ebc8b
    source_path: plugins/voice-call.md
    workflow: 16
---

Appels vocaux pour OpenClaw via un plugin : notifications sortantes, conversations
à plusieurs tours, voix en temps réel en duplex intégral, transcription en streaming et
appels entrants avec politiques de liste d’autorisation.

**Fournisseurs :** `mock` (développement, sans réseau), `plivo` (API Voice + transfert XML +
reconnaissance vocale GetInput), `telnyx` (Call Control v2), `twilio` (Programmable Voice +
Media Streams).

<Note>
Le plugin d’appels vocaux s’exécute **dans le processus Gateway**. Si vous utilisez un
Gateway distant, installez et configurez le plugin sur la machine exécutant le
Gateway, puis redémarrez le Gateway pour le charger.
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

    Utilisez le paquet sans version pour suivre l’étiquette de version actuelle. Épinglez une version
    exacte uniquement si vous avez besoin d’une installation reproductible. Redémarrez ensuite le Gateway
    afin que le plugin soit chargé.

  </Step>
  <Step title="Configurer le fournisseur et le webhook">
    Définissez la configuration sous `plugins.entries.voice-call.config` (voir
    [Configuration](#configuration) ci-dessous). Au minimum : `provider`, les identifiants
    du fournisseur, `fromNumber` et une URL de webhook accessible publiquement.
  </Step>
  <Step title="Vérifier la configuration">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    Vérifie l’activation du plugin, les identifiants du fournisseur, l’exposition du webhook et
    qu’un seul mode audio (`streaming` ou `realtime`) est actif.

  </Step>
  <Step title="Effectuer un test rapide">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Les deux commandes effectuent par défaut des simulations. Ajoutez `--yes` pour passer un court appel
    sortant de notification :

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Pour Twilio, Telnyx et Plivo, la configuration doit aboutir à une **URL de webhook publique**.
Si `publicUrl`, l’URL du tunnel, l’URL Tailscale ou la solution de repli du serveur
aboutit à une adresse de bouclage ou à un espace réseau privé, la configuration échoue au lieu de
démarrer un fournisseur qui ne peut pas recevoir les webhooks de l’opérateur.
</Warning>

## Configuration

Si `enabled: true`, mais que les identifiants du fournisseur sélectionné sont manquants, le démarrage du Gateway
journalise un avertissement indiquant que la configuration est incomplète, avec les clés manquantes, et ignore
le démarrage de l’environnement d’exécution. Lorsqu’ils sont utilisés, les commandes, les appels RPC et les outils de l’agent
renvoient toujours la configuration exacte manquante.

<Note>
Les identifiants d’appel vocal acceptent les SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` et `plugins.entries.voice-call.config.tts.providers.*.apiKey` sont résolus via l’interface SecretRef standard ; consultez [Interface des identifiants SecretRef](/fr/reference/secretref-credential-surface).
</Note>

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
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, comment puis-je vous aider ?",
              responseSystemPrompt: "Vous êtes un spécialiste des cartes de baseball qui répond de manière concise.",
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
            // region: "ie1", // facultatif : us1 | ie1 | au1 ; valeur par défaut : us1
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Clé publique du webhook Telnyx provenant du Mission Control Portal
            // (Base64 ; peut également être définie via TELNYX_PUBLIC_KEY).
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

          streaming: { enabled: true /* voir Transcription en streaming */ },
          realtime: { enabled: false /* voir Conversations vocales en temps réel */ },
        },
      },
    },
  },
}
```

### Référence de configuration

Clés de premier niveau sous `plugins.entries.voice-call.config` non présentées ci-dessus :

| Clé                             | Valeur par défaut | Remarques                                                                                         |
| ------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `enabled`                       | `false`           | Interrupteur principal d'activation/désactivation.                                                |
| `inboundPolicy`                 | `"disabled"`      | `disabled` \| `allowlist` \| `pairing` \| `open`. Voir [Appels entrants](#inbound-calls).         |
| `allowFrom`                     | `[]`              | Liste d'autorisation E.164 pour `inboundPolicy: "allowlist"`.                                     |
| `maxDurationSeconds`            | `300`             | Limite stricte de durée par appel, appliquée indépendamment de l'état de réponse.                  |
| `staleCallReaperSeconds`        | `120`             | Voir [Nettoyeur d'appels obsolètes](#stale-call-reaper). `0` le désactive.                         |
| `silenceTimeoutMs`              | `800`             | Détection du silence de fin de parole pour le flux classique (non temps réel).                     |
| `transcriptTimeoutMs`           | `180000`          | Durée maximale d'attente de la transcription d'un appelant avant d'abandonner un tour.             |
| `ringTimeoutMs`                 | `30000`           | Délai d'expiration de la sonnerie pour les appels sortants.                                       |
| `maxConcurrentCalls`            | `1`               | Les appels sortants au-delà de cette limite sont rejetés.                                         |
| `outbound.notifyHangupDelaySec` | `3`               | Secondes d'attente après la TTS avant le raccrochage automatique en mode notification.             |
| `skipSignatureVerification`     | `false`           | Uniquement pour les tests locaux ; ne jamais activer en production.                               |
| `store`                         | non défini        | Remplace le chemin par défaut du journal d'appels `~/.openclaw/voice-calls`.                       |
| `agentId`                       | `"main"`          | Agent utilisé pour la génération des réponses et le stockage des sessions.                        |
| `responseModel`                 | non défini        | Remplace le modèle par défaut pour les réponses classiques (non temps réel).                       |
| `responseSystemPrompt`          | générée           | Invite système personnalisée pour les réponses classiques.                                        |
| `responseTimeoutMs`             | `30000`           | Délai d'expiration de la génération des réponses classiques (ms).                                 |

Twilio utilise par défaut son point de terminaison REST US1. Pour traiter les appels dans une région
hors des États-Unis prise en charge, définissez `twilio.region` sur `ie1` ou `au1` et utilisez les identifiants de
cette région. Voir
[le guide de Twilio sur l'API REST hors des États-Unis](https://www.twilio.com/docs/global-infrastructure/using-the-twilio-rest-api-in-a-non-us-region).

<AccordionGroup>
  <Accordion title="Remarques sur l'exposition et la sécurité des fournisseurs">
    - Twilio, Telnyx et Plivo nécessitent tous une URL de Webhook **accessible publiquement**.
    - `mock` est un fournisseur de développement local (aucun appel réseau).
    - Telnyx nécessite `telnyx.publicKey` (ou `TELNYX_PUBLIC_KEY`), sauf si `skipSignatureVerification` est défini sur true.
    - `skipSignatureVerification` est réservé aux tests locaux.
    - Avec l'offre gratuite de ngrok, définissez `publicUrl` sur l'URL ngrok exacte ; la vérification des signatures est toujours appliquée.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` autorise les Webhooks Twilio dont les signatures sont invalides **uniquement** lorsque `tunnel.provider="ngrok"` et que `serve.bind` est une adresse de bouclage (agent local ngrok). Développement local uniquement.
    - Les URL de l'offre gratuite de ngrok peuvent changer ou ajouter une page intermédiaire ; si `publicUrl` dérive, les signatures Twilio échouent. En production : préférez un domaine stable ou un funnel Tailscale.

  </Accordion>
  <Accordion title="Limites des connexions de streaming">
    - `streaming.preStartTimeoutMs` (valeur par défaut : `5000`) ferme les sockets qui n'envoient jamais de trame `start` valide.
    - `streaming.maxPendingConnections` (valeur par défaut : `32`) limite le nombre total de sockets non authentifiés avant démarrage.
    - `streaming.maxPendingConnectionsPerIp` (valeur par défaut : `4`) limite les sockets non authentifiés avant démarrage pour chaque adresse IP source.
    - `streaming.maxConnections` (valeur par défaut : `128`) limite tous les sockets ouverts de flux multimédia (en attente + actifs).

  </Accordion>
  <Accordion title="Migrations des configurations héritées">
    L'analyse de la configuration normalise automatiquement ces clés héritées et consigne un
    avertissement indiquant le chemin de remplacement ; la couche de compatibilité sera supprimée dans une prochaine
    version (`2026.6.0`), exécutez donc `openclaw doctor --fix` pour réécrire la configuration enregistrée
    selon la structure canonique :

    - `provider: "log"` → `provider: "mock"`
    - `twilio.from` → `fromNumber`
    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`
    - `realtime.agentContext.includeSystemPrompt` est supprimé (le contexte en temps réel utilise désormais l'invite générée de l'agent)

  </Accordion>
</AccordionGroup>

## Portée de la session

Par défaut, Voice Call utilise `sessionScope: "per-phone"` afin que les appels répétés du
même appelant conservent la mémoire de la conversation. Définissez `sessionScope: "per-call"` lorsque
chaque appel de l'opérateur doit commencer avec un nouveau contexte, par exemple pour les flux de réception,
de réservation, de SVI ou de passerelle Google Meet dans lesquels le même numéro de téléphone peut
représenter différentes réunions.

Voice Call stocke les clés de session générées dans l'espace de noms de l'agent configuré
(`agent:<agentId>:voice:*`). Les clés d'intégration brutes explicites sont résolues dans le
même espace de noms : une clé canonique `agent:<configuredAgentId>:*` conserve ce
propriétaire et respecte les alias de portée globale/`session.mainKey` du cœur ; une entrée `agent:*`
étrangère ou mal formée est limitée en tant que clé opaque sous l'agent configuré ;
`global` et `unknown` restent des sentinelles globales.

## Conversations vocales en temps réel

`realtime` sélectionne un fournisseur vocal bidirectionnel simultané en temps réel pour l'audio des appels en direct.
Il est distinct de `streaming`, qui transmet uniquement l'audio aux fournisseurs de
transcription en temps réel.

<Warning>
`realtime.enabled` ne peut pas être combiné avec `streaming.enabled`. Choisissez un seul
mode audio par appel.
</Warning>

Comportement actuel à l'exécution :

- `realtime.enabled` est pris en charge pour Twilio et Telnyx.
- `realtime.provider` est facultatif. S’il n’est pas défini, Voice Call utilise le premier fournisseur vocal en temps réel enregistré.
- Fournisseurs vocaux en temps réel intégrés : Google Gemini Live (`google`) et OpenAI (`openai`), enregistrés par leurs Plugins de fournisseur.
- La configuration brute propre au fournisseur se trouve sous `realtime.providers.<providerId>`.
- Voice Call expose par défaut l’outil en temps réel partagé `openclaw_agent_consult`. Le modèle en temps réel peut l’appeler lorsque l’appelant demande un raisonnement plus approfondi, des informations actuelles ou les outils OpenClaw habituels.
- `realtime.consultPolicy` ajoute éventuellement des indications sur les situations dans lesquelles le modèle en temps réel doit appeler `openclaw_agent_consult`.
- `realtime.agentContext.enabled` est désactivé par défaut. Lorsqu’il est activé, Voice Call injecte une identité d’agent limitée et une capsule composée de fichiers sélectionnés de l’espace de travail dans les instructions du fournisseur en temps réel lors de l’établissement de la session.
- `realtime.fastContext.enabled` est désactivé par défaut. Lorsqu’il est activé, Voice Call recherche d’abord dans le contexte indexé de la mémoire et de la session la question de consultation, puis renvoie ces extraits au modèle en temps réel dans le délai `realtime.fastContext.timeoutMs`, avant de recourir à l’agent de consultation complet uniquement si `realtime.fastContext.fallbackToConsult` vaut true.
- Si `realtime.provider` désigne un fournisseur non enregistré, ou si aucun fournisseur vocal en temps réel n’est enregistré, Voice Call consigne un avertissement et ignore les médias en temps réel au lieu de faire échouer l’ensemble du Plugin.
- `inboundPolicy` ne doit pas valoir `"disabled"` lorsque `realtime.enabled` vaut true ; `validateProviderConfig` rejette cette combinaison.
- Les clés de session de consultation réutilisent la session d’appel stockée lorsqu’elle est disponible, puis utilisent à défaut le `sessionScope` configuré (`per-phone` par défaut, ou `per-call` pour les appels isolés).

### Politique des outils

`realtime.toolPolicy` contrôle l’exécution de la consultation :

| Politique        | Comportement                                                                                                                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Expose l’outil de consultation et limite l’agent standard à `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` et `memory_get`.                                                            |
| `owner`          | Expose l’outil de consultation et permet à l’agent standard d’utiliser la politique habituelle des outils de l’agent.                                                                                  |
| `none`           | N’expose pas l’outil de consultation. Les outils `realtime.tools` personnalisés sont tout de même transmis au fournisseur en temps réel.                                                              |

`realtime.consultPolicy` contrôle uniquement les instructions du modèle en temps réel :

| Politique     | Indications                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `auto`        | Conserve le prompt par défaut et laisse le fournisseur décider quand appeler l’outil de consultation.                           |
| `substantive` | Répond directement aux simples éléments de liaison conversationnelle et consulte avant les faits, la mémoire, les outils ou le contexte. |
| `always`      | Consulte avant chaque réponse substantielle.                                                                                    |

### Contexte vocal de l’agent

Activez `realtime.agentContext` lorsque la passerelle vocale doit s’exprimer comme
l’agent OpenClaw configuré sans subir le temps d’un aller-retour complet de
consultation de l’agent pour les échanges ordinaires. La capsule de contexte est ajoutée une seule
fois lors de la création de la session en temps réel ; elle n’ajoute donc aucune latence
par échange. Les appels à `openclaw_agent_consult` exécutent toujours l’agent OpenClaw
complet et doivent être utilisés pour les tâches nécessitant des outils, les informations
actuelles, les recherches en mémoire ou l’état de l’espace de travail.

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

### Exemples de fournisseurs en temps réel

<Tabs>
  <Tab title="Google Gemini Live">
    Valeurs par défaut : clé API provenant de `realtime.providers.google.apiKey`, `GEMINI_API_KEY`
    ou `GOOGLE_API_KEY` ; modèle `gemini-3.1-flash-live-preview` ;
    voix `Kore`. `sessionResumption` et `contextWindowCompression` sont activés par défaut
    pour les appels plus longs et reconnectables. Utilisez `silenceDurationMs`,
    `startSensitivity` et `endSensitivity` pour ajuster une alternance des prises de parole plus rapide avec
    l’audio téléphonique.

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
                consultPolicy: "substantive",
                consultThinkingLevel: "low",
                consultFastMode: true,
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-3.1-flash-live-preview",
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

Consultez [Fournisseur Google](/fr/providers/google) et
[Fournisseur OpenAI](/fr/providers/openai) pour connaître les options vocales en temps réel
propres à chaque fournisseur.

## Transcription en continu

`streaming` sélectionne un fournisseur de transcription en temps réel pour l’audio des appels en direct.

Comportement actuel à l’exécution :

- `streaming.provider` est facultatif. S’il n’est pas défini, Voice Call utilise le premier fournisseur de transcription en temps réel enregistré.
- Fournisseurs de transcription en temps réel intégrés : Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) et xAI (`xai`), enregistrés par leurs plugins fournisseurs.
- La configuration brute propre au fournisseur se trouve sous `streaming.providers.<providerId>`.
- Une fois que Twilio envoie un message `start` de flux accepté, Voice Call enregistre immédiatement le flux, met en file d’attente les médias entrants via le fournisseur de transcription pendant que celui-ci se connecte et ne lance le message d’accueil initial que lorsque la transcription en temps réel est prête.
- Si `streaming.provider` désigne un fournisseur non enregistré, ou si aucun fournisseur n’est enregistré, Voice Call consigne un avertissement et ignore la diffusion des médias au lieu de faire échouer l’ensemble du plugin.

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
    Valeurs par défaut : clé API `streaming.providers.xai.apiKey` ou `XAI_API_KEY` (utilise
    un profil d’authentification OAuth xAI en solution de repli si aucune des deux n’est définie) ; point de terminaison
    `wss://api.x.ai/v1/stt` ; encodage `mulaw` ; fréquence d’échantillonnage `8000` ;
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

Voice Call utilise la configuration principale `messages.tts` pour la synthèse vocale en streaming lors des
appels. Vous pouvez la remplacer dans la configuration du plugin avec la **même structure** —
elle est fusionnée en profondeur avec `messages.tts`.

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
**La synthèse vocale Microsoft est ignorée pour les appels vocaux.** La synthèse pour la téléphonie nécessite
un fournisseur qui implémente une sortie destinée à la téléphonie ; le fournisseur de synthèse vocale
Microsoft ne le fait pas. Il est donc ignoré pour les appels et les autres fournisseurs de la
chaîne de repli sont essayés à la place.
</Warning>

Remarques sur le comportement :

- Les anciennes clés `tts.<provider>` dans la configuration du plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) sont réparées par `openclaw doctor --fix` ; la configuration enregistrée doit utiliser `tts.providers.<provider>`.
- La TTS principale est utilisée lorsque le streaming multimédia Twilio est activé ; sinon, les appels utilisent en solution de repli les voix natives du fournisseur.
- Si un flux multimédia Twilio est déjà actif, Voice Call n’utilise pas TwiML `<Say>` comme solution de repli. Si la TTS pour la téléphonie n’est pas disponible dans cet état, la demande de lecture échoue au lieu de mélanger deux chemins de lecture.
- Lorsque la TTS pour la téléphonie utilise un fournisseur secondaire en solution de repli, Voice Call consigne un avertissement indiquant la chaîne de fournisseurs (`from`, `to`, `attempts`) à des fins de débogage.
- Lorsque l’interruption Twilio ou la fermeture du flux vide la file d’attente TTS, les demandes de lecture en attente se terminent au lieu de laisser indéfiniment en attente les appelants qui attendent la fin de la lecture.

### Exemples de TTS

<Tabs>
  <Tab title="TTS principale uniquement">
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
  <Tab title="Remplacement du modèle OpenAI (fusion en profondeur)">
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

La stratégie des appels entrants est définie par défaut sur `disabled`. Pour activer les appels entrants, définissez :

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Bonjour ! Comment puis-je vous aider ?",
}
```

<Warning>
`inboundPolicy: "allowlist"` est un filtrage de l’identifiant de l’appelant offrant un faible niveau d’assurance. Le plugin
normalise la valeur `From` fournie par le fournisseur et la compare à `allowFrom`.
La vérification du Webhook authentifie la livraison par le fournisseur et l’intégrité de la charge utile,
mais elle ne prouve **pas** la propriété du numéro d’appelant PSTN/VoIP. Considérez
`allowFrom` comme un filtrage de l’identifiant de l’appelant, et non comme une authentification forte de son identité.
</Warning>

Les réponses automatiques utilisent le système d’agent. Ajustez-les avec `responseModel`,
`responseSystemPrompt` et `responseTimeoutMs`.

### Routage par numéro

Utilisez `numbers` lorsqu’un même plugin Voice Call reçoit des appels destinés à plusieurs numéros de
téléphone et que chaque numéro doit se comporter comme une ligne différente. Par exemple,
un numéro peut utiliser un assistant personnel au ton décontracté, tandis qu’un autre utilise une identité
professionnelle, un agent de réponse différent et une autre voix TTS.

Les routes sont sélectionnées à partir du numéro `To` composé et fourni par le fournisseur. Les clés doivent
être des numéros E.164. Lorsqu’un appel arrive, Voice Call détermine une seule fois la
route correspondante, stocke cette route dans l’enregistrement de l’appel et réutilise cette
configuration effective pour le message d’accueil, le chemin de réponse automatique classique, le chemin de
consultation en temps réel et la lecture TTS. Si aucune route ne correspond, la configuration Voice Call
globale est utilisée. Les appels sortants n’utilisent pas `numbers` ; transmettez explicitement la
destination sortante, le message et la session lors du lancement de l’appel.

Les remplacements de route prennent actuellement en charge :

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

La valeur de route `tts` est fusionnée récursivement par-dessus la configuration `tts` globale de Voice Call ; vous
pouvez donc généralement remplacer uniquement la voix du fournisseur :

```json5
{
  inboundGreeting: "Bonjour, vous êtes sur la ligne principale.",
  responseSystemPrompt: "Vous êtes l’assistant vocal par défaut.",
  tts: {
    provider: "openai",
    providers: {
      openai: { speakerVoice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, comment puis-je vous aider ?",
      responseSystemPrompt: "Vous êtes un spécialiste concis des cartes de baseball.",
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

Pour les réponses automatiques, Voice Call ajoute au prompt système un contrat strict de sortie vocale
exigeant une réponse JSON `{"spoken":"..."}`. Voice Call
extrait le texte à prononcer de manière défensive :

- Ignore les charges utiles marquées comme contenu de raisonnement ou d’erreur.
- Analyse le JSON direct, le JSON dans un bloc délimité ou les clés `"spoken"` intégrées.
- Se rabat sur le texte brut et supprime les paragraphes introductifs probablement liés à la planification ou aux métadonnées.

Cela permet de concentrer la lecture vocale sur le texte destiné à l’appelant et d’éviter que du
texte de planification ne soit divulgué dans l’audio.

### Comportement au démarrage de la conversation

Pour les appels `conversation` sortants, le traitement du premier message dépend de l’état de
lecture en direct :

- L’effacement de la file lors d’une interruption vocale et la réponse automatique sont désactivés uniquement pendant que le message d’accueil initial est effectivement prononcé.
- Si la lecture initiale échoue, l’appel revient à l’état `listening` et le message initial reste en file d’attente pour une nouvelle tentative.
- La lecture initiale pour le streaming Twilio démarre à la connexion du flux, sans délai supplémentaire.
- Une interruption vocale interrompt la lecture active et efface les entrées TTS Twilio en file d’attente qui n’ont pas encore commencé. Les entrées effacées sont résolues comme ignorées, afin que la logique de réponse suivante puisse continuer sans attendre un contenu audio qui ne sera jamais lu.
- Les conversations vocales en temps réel utilisent le tour d’ouverture propre au flux en temps réel. Voice Call ne publie **pas** de mise à jour TwiML `<Say>` héritée pour ce message initial, afin que les sessions `<Connect><Stream>` sortantes restent attachées.

### Délai de grâce lors de la déconnexion d’un flux Twilio

Lorsqu’un flux multimédia Twilio se déconnecte, Voice Call attend **2000 ms** avant de
mettre automatiquement fin à l’appel :

- Si le flux se reconnecte pendant cette période, la fin automatique est annulée.
- Si aucun flux ne se réenregistre après le délai de grâce, l’appel prend fin afin d’éviter que des appels actifs restent bloqués.

## Nettoyeur d’appels obsolètes

Utilisez `staleCallReaperSeconds` (valeur par défaut : **120**) pour mettre fin aux appels qui ne reçoivent jamais
de réponse et n’atteignent jamais un état de conversation en direct, par exemple les appels en mode notification
pour lesquels le fournisseur n’envoie jamais de Webhook terminal. Définissez cette valeur sur `0` pour
désactiver cette fonctionnalité.

Le nettoyeur s’exécute toutes les 30 secondes et met fin uniquement aux appels qui n’ont pas
d’horodatage `answeredAt` et qui ne sont pas déjà dans un état terminal ou en direct
(`speaking`/`listening`). Ainsi, les conversations auxquelles il a été répondu ne sont jamais supprimées
par ce minuteur ; `maxDurationSeconds` (valeur par défaut : 300) constitue la limite distincte qui
met fin aux appels répondus dont la durée est excessive.

Pour les flux de type notification dans lesquels les opérateurs peuvent mettre du temps à envoyer les Webhooks
de sonnerie ou de réponse, augmentez `staleCallReaperSeconds` au-delà de la valeur par défaut afin que les appels
lents mais normaux ne soient pas supprimés prématurément ; `120`-`300` secondes constitue une plage raisonnable
en production.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 120,
        },
      },
    },
  },
}
```

## Sécurité des Webhooks

Lorsqu’un proxy ou un tunnel se trouve devant le Gateway, le plugin reconstruit
l’URL publique pour la vérification de la signature. Ces options déterminent les
en-têtes transférés qui sont approuvés :

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Hôtes de la liste d’autorisation issus des en-têtes de transfert.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Approuver les en-têtes transférés sans liste d’autorisation.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Approuver les en-têtes transférés uniquement lorsque l’adresse IP distante de la requête correspond à la liste.
</ParamField>

Protections supplémentaires :

- La **protection contre la réexécution** des Webhooks est activée pour Twilio, Telnyx et Plivo. Les requêtes de Webhook valides réexécutées sont acquittées, mais leurs effets secondaires sont ignorés.
- Les tours de conversation Twilio incluent un jeton propre à chaque tour dans les rappels `<Gather>`, afin que les rappels vocaux obsolètes ou réexécutés ne puissent pas satisfaire un tour de transcription en attente plus récent.
- Les requêtes de Webhook non authentifiées sont rejetées avant la lecture du corps lorsque les en-têtes de signature requis par le fournisseur sont absents.
- Le Webhook voice-call utilise le profil partagé de lecture du corps avant authentification (corps de 64 KB maximum, délai de lecture de 5 secondes), ainsi qu’une limite par clé des requêtes en cours (8 requêtes simultanées par clé par défaut) avant la vérification de la signature.

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
openclaw voicecall call --to "+15555550123" --message "Bonjour de la part d’OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias de call
openclaw voicecall continue --call-id <id> --message "Avez-vous des questions ?"
openclaw voicecall speak --call-id <id> --message "Un instant"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # résumer la latence des tours à partir des journaux
openclaw voicecall expose --mode funnel
```

Lorsque le Gateway est déjà en cours d’exécution, les commandes opérationnelles `voicecall`
sont déléguées au runtime voice-call appartenant au Gateway, afin que la CLI ne lie pas un
second serveur de Webhook. Si aucun Gateway n’est accessible, les commandes se rabattent sur
un runtime CLI autonome.

`latency` lit `calls.jsonl` depuis le chemin de stockage voice-call par défaut. Utilisez
`--file <path>` pour désigner un autre journal et `--last <n>` pour limiter
l’analyse aux N derniers enregistrements (valeur par défaut : 200). La sortie comprend les valeurs minimale, maximale et moyenne,
p50 et p95 pour la latence des tours et les temps d’attente d’écoute.

## Outil de l’agent

Nom de l’outil : `voice_call`.

| Action          | Arguments                                  |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Le plugin voice-call fournit une Skill d’agent correspondante.

## RPC du Gateway

| Méthode                     | Arguments                                                        | Remarques                                                                 |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | Se rabat sur la configuration `toNumber` lorsque `to` est omis.           |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | Identique à `initiate`, mais accepte également `dtmfSequence` avant la connexion. |
| `voicecall.continue`        | `callId`, `message`                                              | Bloque jusqu’à la résolution du tour ; renvoie la transcription.          |
| `voicecall.continue.start`  | `callId`, `message`                                              | Variante asynchrone : renvoie immédiatement un `operationId`.             |
| `voicecall.continue.result` | `operationId`                                                    | Interroge une opération `voicecall.continue.start` en attente pour obtenir son résultat. |
| `voicecall.speak`           | `callId`, `message`                                              | Parle sans attendre ; utilise le pont en temps réel lorsque `realtime.enabled`. |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                           |
| `voicecall.end`             | `callId`                                                         |                                                                           |
| `voicecall.status`          | `callId?`                                                        | Omettez `callId` pour répertorier tous les appels actifs.                  |

`dtmfSequence` est valide uniquement avec `mode: "conversation"` ; les appels en mode notification
doivent utiliser `voicecall.dtmf` une fois l’appel créé s’ils ont besoin de chiffres
après la connexion.

## Dépannage

### Échec de l’exposition du Webhook lors de la configuration

Exécutez la configuration depuis le même environnement que celui qui exécute le Gateway :

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Pour `twilio`, `telnyx` et `plivo`, `webhook-exposure` doit être au vert. Une
valeur `publicUrl` configurée échoue tout de même lorsqu’elle pointe vers un espace réseau local ou privé,
car l’opérateur ne peut pas rappeler ces adresses.
N’utilisez pas `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, `fd00::/8` ni d’autres plages
de NAT de classe opérateur comme `publicUrl`.

Les appels sortants Twilio en mode notification envoient leur TwiML `<Say>` initial directement
dans la requête de création d’appel ; le premier message prononcé ne dépend donc pas
de la récupération du TwiML du Webhook par Twilio. Un Webhook public reste requis pour les rappels
d’état, les appels de conversation, les DTMF avant connexion, les flux en temps réel et le
contrôle des appels après connexion.

Utilisez un chemin d’exposition public :

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // ou
          tunnel: { provider: "ngrok" },
          // ou
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

`voicecall smoke` effectue une simulation, sauf si vous transmettez `--yes`.

### Échec des identifiants du fournisseur

Vérifiez le fournisseur sélectionné et les champs d’identifiants requis :

- Twilio : `twilio.accountSid`, `twilio.authToken` et `fromNumber`, ou
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` et `TWILIO_FROM_NUMBER`.
- Telnyx : `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` et
  `fromNumber`, ou `TELNYX_API_KEY`, `TELNYX_CONNECTION_ID` et
  `TELNYX_PUBLIC_KEY`.
- Plivo : `plivo.authId`, `plivo.authToken` et `fromNumber`, ou
  `PLIVO_AUTH_ID` et `PLIVO_AUTH_TOKEN`.

Les identifiants doivent être présents sur l’hôte du Gateway. La modification d’un profil de shell local
n’affecte pas un Gateway déjà en cours d’exécution tant qu’il n’a pas redémarré ou rechargé son
environnement.

### Les appels démarrent, mais les Webhooks du fournisseur n’arrivent pas

Vérifiez que la console du fournisseur pointe vers l’URL publique exacte du Webhook :

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
- Un proxy transfère la requête, mais supprime ou réécrit les en-têtes d’hôte ou de protocole.
- Le pare-feu ou le DNS achemine le nom d’hôte public vers une destination autre que le Gateway.
- Le Gateway a été redémarré sans que le Plugin Voice Call soit activé.

Lorsqu’un proxy inverse ou un tunnel se trouve devant le Gateway, définissez
`webhookSecurity.allowedHosts` sur le nom d’hôte public, ou utilisez
`webhookSecurity.trustedProxyIPs` pour une adresse de proxy connue. N’utilisez
`webhookSecurity.trustForwardingHeaders` que lorsque la limite de confiance du proxy est
sous votre contrôle.

### La vérification de la signature échoue

Les signatures du fournisseur sont vérifiées par rapport à l’URL publique qu’OpenClaw reconstitue
à partir de la requête entrante. Si la vérification des signatures échoue :

- Vérifiez que l’URL du Webhook du fournisseur correspond exactement à `publicUrl`, y compris le schéma, l’hôte et le chemin.
- Pour les URL de l’offre gratuite de ngrok, mettez à jour `publicUrl` lorsque le nom d’hôte du tunnel change.
- Assurez-vous que le proxy conserve les en-têtes d’hôte et de protocole d’origine, ou configurez `webhookSecurity.allowedHosts`.
- N’activez pas `skipSignatureVerification` en dehors des tests locaux.

### Les connexions de Google Meet via Twilio échouent

Google Meet utilise ce Plugin pour les connexions par accès téléphonique Twilio. Vérifiez d’abord Voice
Call :

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Vérifiez ensuite explicitement le transport Google Meet :

```bash
openclaw googlemeet setup --transport twilio
```

Si Voice Call fonctionne, mais que le participant ne rejoint jamais la réunion Meet, vérifiez le
numéro d’accès téléphonique Meet, le code PIN et `--dtmf-sequence`. L’appel téléphonique peut fonctionner
correctement tandis que la réunion rejette ou ignore une séquence DTMF incorrecte.

Google Meet démarre la partie téléphonique Twilio via `voicecall.start` avec une
séquence DTMF préalable à la connexion. Les séquences dérivées du code PIN incluent le paramètre
`voiceCall.dtmfDelayMs` du Plugin Google Meet (**12000 ms** par défaut) sous forme de chiffres d’attente Twilio
initiaux, car les invites d’accès téléphonique Meet peuvent arriver tardivement. Voice Call redirige ensuite
vers le traitement en temps réel avant la demande du message d’accueil initial.

Utilisez `openclaw logs --follow` pour suivre les phases en direct. Une connexion Twilio à Meet
réussie consigne les événements dans cet ordre :

- Google Meet délègue la connexion Twilio à Voice Call.
- Voice Call stocke le TwiML DTMF préalable à la connexion.
- Le TwiML initial de Twilio est consommé et servi avant le traitement en temps réel.
- Voice Call sert le TwiML en temps réel pour l’appel Twilio.
- Google Meet demande le message d’introduction avec `voicecall.speak` après le délai suivant la séquence DTMF.

`openclaw voicecall tail` affiche toujours les enregistrements d’appels persistants ; ils sont utiles pour
l’état des appels et les transcriptions, mais toutes les transitions de Webhook ou en temps réel
n’y apparaissent pas.

### L’appel en temps réel ne produit aucune parole

Vérifiez qu’un seul mode audio est activé : `realtime.enabled` et
`streaming.enabled` ne peuvent pas tous deux être définis sur true.

Pour les appels Twilio/Telnyx en temps réel, vérifiez également les points suivants :

- Un Plugin de fournisseur en temps réel est chargé et enregistré.
- `realtime.provider` n’est pas défini ou désigne un fournisseur enregistré.
- La clé API du fournisseur est accessible au processus du Gateway.
- `openclaw logs --follow` indique que le TwiML en temps réel a été servi, que le pont en temps réel a démarré et que le message d’accueil initial a été mis en file d’attente.

## Voir aussi

- [Mode conversation](/fr/nodes/talk)
- [Synthèse vocale](/fr/tools/tts)
- [Réveil vocal](/fr/nodes/voicewake)
