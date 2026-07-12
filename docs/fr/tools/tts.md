---
read_when:
    - Activation de la synthèse vocale pour les réponses
    - Configuration d’un fournisseur TTS, d’une chaîne de repli ou d’un persona
    - Utilisation des commandes ou directives /tts
sidebarTitle: Text to speech (TTS)
summary: Synthèse vocale pour les réponses sortantes — fournisseurs, personas, commandes slash et sortie par canal
title: Synthèse vocale
x-i18n:
    generated_at: "2026-07-12T16:01:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 908679a0386da75577a2445dfcafecc746d124ffe04816c6f2d6eb74af232edd
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw convertit les réponses sortantes en audio via **14 fournisseurs de synthèse vocale** :
messages vocaux natifs sur Feishu, Matrix, Telegram et WhatsApp ; pièces jointes
audio partout ailleurs ; et flux PCM/Ulaw pour la téléphonie et Talk.

La synthèse vocale constitue la partie de sortie vocale du mode `stt-tts` de Talk (`talk.speak` appelle
ce même chemin de synthèse). Les sessions Talk `realtime` natives du fournisseur synthétisent
la parole au sein du fournisseur temps réel ; les sessions `transcription` ne
synthétisent jamais de réponse vocale de l’assistant.

## Démarrage rapide

<Steps>
  <Step title="Choisir un fournisseur">
    OpenAI et ElevenLabs sont les options hébergées les plus fiables. Microsoft et
    la CLI locale fonctionnent sans clé API. Consultez la [matrice des fournisseurs](#supported-providers)
    pour obtenir la liste complète.
  </Step>
  <Step title="Définir la clé API">
    Exportez la variable d’environnement de votre fournisseur (par exemple `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft et la CLI locale ne nécessitent aucune clé.
  </Step>
  <Step title="Activer dans la configuration">
    Définissez `messages.tts.auto: "always"` et `messages.tts.provider` :

    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "elevenlabs",
        },
      },
    }
    ```

  </Step>
  <Step title="Essayer dans le chat">
    `/tts status` affiche l’état actuel. `/tts audio Hello from OpenClaw`
    envoie une réponse audio ponctuelle.
  </Step>
</Steps>

<Note>
La synthèse vocale automatique est **désactivée** par défaut. Lorsque `messages.tts.provider` n’est pas défini,
OpenClaw choisit le premier fournisseur configuré selon l’ordre de sélection automatique du registre.
L’outil d’agent `tts` intégré est réservé aux intentions explicites : les conversations ordinaires restent
textuelles, sauf si l’utilisateur demande de l’audio, utilise `/tts` ou active la synthèse vocale
automatique/par directive.
</Note>

## Fournisseurs pris en charge

| Fournisseur        | Authentification                                                                                                 | Remarques                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Azure Speech**   | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (également `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)     | Sortie native de messages vocaux Ogg/Opus et téléphonie.                                                  |
| **DeepInfra**      | `DEEPINFRA_API_KEY`                                                                                              | Synthèse vocale compatible avec OpenAI. Utilise `hexgrad/Kokoro-82M` par défaut.                          |
| **ElevenLabs**     | `ELEVENLABS_API_KEY` ou `XI_API_KEY`                                                                             | Clonage vocal, multilingue, déterministe via `seed` ; diffusé en continu pour la lecture vocale Discord.  |
| **Google Gemini**  | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`                                                                             | Synthèse vocale par lots de l’API Gemini ; prise en compte du persona via `promptTemplate: "audio-profile-v1"`. |
| **Gradium**        | `GRADIUM_API_KEY`                                                                                                | Sortie de messages vocaux et téléphonie.                                                                  |
| **Inworld**        | `INWORLD_API_KEY`                                                                                                | API de synthèse vocale en continu. Messages vocaux Opus natifs et téléphonie PCM.                         |
| **CLI locale**     | aucune                                                                                                           | Exécute une commande locale de synthèse vocale configurée.                                                |
| **Microsoft**      | aucune                                                                                                           | Synthèse vocale neuronale publique Edge via `node-edge-tts`. Sans garantie de service.                    |
| **MiniMax**        | `MINIMAX_API_KEY` (ou Token Plan : `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)     | API T2A v2. Utilise `speech-2.8-hd` par défaut.                                                           |
| **OpenAI**         | `OPENAI_API_KEY`                                                                                                 | Également utilisé pour le résumé automatique ; prend en charge les `instructions` de persona.             |
| **OpenRouter**     | `OPENROUTER_API_KEY` (peut réutiliser `models.providers.openrouter.apiKey`)                                      | Modèle par défaut : `hexgrad/kokoro-82m`.                                                                 |
| **Volcengine**     | `VOLCENGINE_TTS_API_KEY` ou `BYTEPLUS_SEED_SPEECH_API_KEY` (ancien AppID/jeton : `VOLCENGINE_TTS_APPID`/`_TOKEN`) | API HTTP BytePlus Seed Speech.                                                                            |
| **Vydra**          | `VYDRA_API_KEY`                                                                                                  | Fournisseur partagé d’images, de vidéos et de synthèse vocale.                                            |
| **xAI**            | `XAI_API_KEY`                                                                                                    | Synthèse vocale par lots xAI. Les messages vocaux Opus natifs ne sont **pas** pris en charge.             |
| **Xiaomi MiMo**    | `XIAOMI_API_KEY`                                                                                                 | Synthèse vocale MiMo via les complétions de chat Xiaomi.                                                  |

Si plusieurs fournisseurs sont configurés, celui qui est sélectionné est utilisé en premier et les
autres servent de solutions de repli. Le résumé automatique utilise `summaryModel` (ou
`agents.defaults.model.primary`) ; ce fournisseur doit donc également être authentifié
si vous laissez les résumés activés.

<Warning>
Le fournisseur **Microsoft** intégré utilise le service de synthèse vocale neuronale en ligne
de Microsoft Edge via `node-edge-tts`. Il s’agit d’un service web public sans garantie
de service ni quota publiés : considérez-le comme une solution sans garantie. L’ancien identifiant de fournisseur `edge` est
normalisé en `microsoft` et `openclaw doctor --fix` réécrit la configuration
persistée ; les nouvelles configurations doivent toujours utiliser `microsoft`.
</Warning>

## Configuration

La configuration de la synthèse vocale se trouve sous `messages.tts` dans `~/.openclaw/openclaw.json`. Choisissez un
préréglage et adaptez le bloc du fournisseur. Les champs `speakerVoice`/`speakerVoiceId`
présentés ci-dessous sont canoniques ; les noms de champs propres à chaque fournisseur, `voice`/`voiceId`/
`voiceName`, continuent de fonctionner comme anciens alias.

<Tabs>
  <Tab title="Azure Speech">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "azure-speech",
      providers: {
        "azure-speech": {
          apiKey: "${AZURE_SPEECH_KEY}",
          region: "eastus",
          speakerVoice: "en-US-JennyNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          voiceNoteOutputFormat: "ogg-24khz-16bit-mono-opus",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Google Gemini">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "${GEMINI_API_KEY}",
          model: "gemini-3.1-flash-tts-preview",
          speakerVoice: "Kore",
          // Invites de style facultatives en langage naturel :
          // audioProfile: "Parlez d’un ton calme, comme un animateur de podcast.",
          // speakerName: "Alex",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Gradium">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "${GRADIUM_API_KEY}",
          speakerVoiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Inworld">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "inworld",
      providers: {
        inworld: {
          apiKey: "${INWORLD_API_KEY}",
          modelId: "inworld-tts-1.5-max",
          speakerVoiceId: "Sarah",
          temperature: 0.7,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="CLI locale">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "tts-local-cli",
      providers: {
        "tts-local-cli": {
          command: "say",
          args: ["-o", "{{OutputPath}}", "{{Text}}"],
          outputFormat: "wav",
          timeoutMs: 120000,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Microsoft (sans clé)">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          speakerVoice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+0%",
          pitch: "+0%",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="MiniMax">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "${MINIMAX_API_KEY}",
          model: "speech-2.8-hd",
          speakerVoiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenAI + ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      providers: {
        openai: {
          apiKey: "${OPENAI_API_KEY}",
          model: "gpt-4o-mini-tts",
          speakerVoice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
          voiceSettings: { stability: 0.5, similarityBoost: 0.75, style: 0.0, useSpeakerBoost: true, speed: 1.0 },
          applyTextNormalization: "auto",
          languageCode: "en",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenRouter">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "${OPENROUTER_API_KEY}",
          model: "hexgrad/kokoro-82m",
          speakerVoice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Volcengine">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "${VOLCENGINE_TTS_API_KEY}",
          resourceId: "seed-tts-1.0",
          speakerVoice: "en_female_anna_mars_bigtts",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="xAI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "${XAI_API_KEY}",
          speakerVoiceId: "eve",
          language: "en",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Xiaomi MiMo">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "${XIAOMI_API_KEY}",
          model: "mimo-v2.5-tts",
          speakerVoice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

Pour Xiaomi `mimo-v2.5-tts-voicedesign`, omettez `speakerVoice` et définissez `style` sur
l’invite de conception vocale. OpenClaw envoie cette invite comme message TTS `user`
et n’envoie pas `audio.voice` pour le modèle voicedesign.

### Remplacements de voix par agent

Utilisez `agents.list[].tts` lorsqu’un agent doit parler avec un fournisseur,
une voix, un modèle, une persona ou un mode TTS automatique différent. Le bloc de l’agent est fusionné en profondeur avec
`messages.tts`, afin que les identifiants du fournisseur puissent rester dans la configuration globale du fournisseur :

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: { apiKey: "${ELEVENLABS_API_KEY}", model: "eleven_multilingual_v2" },
      },
    },
  },
  agents: {
    list: [
      {
        id: "reader",
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

Pour définir une persona par agent, configurez `agents.list[].tts.persona` avec la configuration
du fournisseur : elle remplace la valeur globale de `messages.tts.persona` pour cet agent uniquement.

Ordre de priorité pour les réponses automatiques, `/tts audio`, `/tts status` et l’outil d’agent
`tts` :

1. `messages.tts`
2. `agents.list[].tts` actif
3. remplacement du canal, lorsque celui-ci prend en charge `channels.<channel>.tts`
4. remplacement du compte, lorsque le canal transmet `channels.<channel>.accounts.<id>.tts`
5. préférences `/tts` locales pour cet hôte
6. directives `[[tts:...]]` intégrées lorsque les [remplacements par le modèle](#model-driven-directives) sont activés

Les remplacements de canal et de compte utilisent la même structure que `messages.tts` et
sont fusionnés en profondeur avec les couches précédentes, afin que les identifiants partagés du fournisseur puissent rester dans
`messages.tts`, tandis qu’un canal ou un compte de bot modifie uniquement la voix du locuteur, le modèle, la persona
ou le mode automatique :

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { apiKey: "${OPENAI_API_KEY}", model: "gpt-4o-mini-tts" },
      },
    },
  },
  channels: {
    feishu: {
      accounts: {
        english: {
          tts: {
            providers: {
              openai: { speakerVoice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

## Personas

Une **persona** est une identité vocale stable qui peut être appliquée de manière déterministe
à tous les fournisseurs. Elle peut privilégier un fournisseur, définir une intention d’invite indépendante
du fournisseur et contenir des liaisons propres à chaque fournisseur pour les voix, les modèles, les modèles
d’invite, les graines et les paramètres vocaux.

### Persona minimale

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "Narrateur",
          provider: "elevenlabs",
          providers: {
            elevenlabs: {
              speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
              modelId: "eleven_multilingual_v2",
            },
          },
        },
      },
    },
  },
}
```

### Persona complète (invite indépendante du fournisseur)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "Narrateur majordome britannique, pince-sans-rire et chaleureux.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "Un brillant majordome britannique. Pince-sans-rire, spirituel, chaleureux, charmant, expressif sur le plan émotionnel, jamais générique.",
            scene: "Un bureau calme tard dans la nuit. Narration en prise de son rapprochée pour un opérateur de confiance.",
            sampleContext: "Le locuteur répond à une demande technique privée avec une assurance concise et une chaleur teintée d’humour pince-sans-rire.",
            style: "Raffiné, sobre, légèrement amusé.",
            accent: "Anglais britannique.",
            pacing: "Mesuré, avec de courtes pauses dramatiques.",
            constraints: ["Ne pas lire les valeurs de configuration à voix haute.", "Ne pas expliquer la persona."],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              speakerVoice: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "cedar" },
            elevenlabs: {
              speakerVoiceId: "voice_id",
              modelId: "eleven_multilingual_v2",
              seed: 42,
              voiceSettings: {
                stability: 0.65,
                similarityBoost: 0.8,
                style: 0.25,
                useSpeakerBoost: true,
                speed: 0.95,
              },
            },
          },
        },
      },
    },
  },
}
```

### Résolution de la persona

La persona active est sélectionnée de manière déterministe :

1. préférence locale `/tts persona <id>`, si elle est définie.
2. `messages.tts.persona`, si elle est définie.
3. Aucune persona.

La sélection du fournisseur privilégie les valeurs explicites :

1. Remplacements directs (CLI, Gateway, Talk, directives TTS autorisées).
2. Préférence locale `/tts provider <id>`.
3. `provider` de la persona active.
4. `messages.tts.provider`.
5. Sélection automatique dans le registre.

Pour chaque tentative de fournisseur, OpenClaw fusionne les configurations dans cet ordre :

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Remplacements de requête approuvés
4. Remplacements autorisés par des directives TTS émises par le modèle

### Utilisation des invites de persona par les fournisseurs

Les champs d’invite de persona (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) sont **indépendants du fournisseur**. Chaque fournisseur décide comment
les utiliser :

<AccordionGroup>
  <Accordion title="Google Gemini">
    Encapsule les champs d’invite de persona dans une structure d’invite TTS Gemini **uniquement lorsque**
    la configuration effective du fournisseur Google définit `promptTemplate: "audio-profile-v1"`
    ou `personaPrompt`. Les anciens champs `audioProfile` et `speakerName` sont
    toujours ajoutés au début sous forme de texte d’invite propre à Google. Les balises audio intégrées telles que
    `[whispers]` ou `[laughs]` dans un bloc `[[tts:text]]` sont conservées
    dans la transcription Gemini ; OpenClaw ne génère pas ces balises.
  </Accordion>
  <Accordion title="OpenAI">
    Associe les champs d’invite de persona au champ `instructions` de la requête **uniquement lorsqu’**
    aucune valeur `instructions` explicite n’est configurée pour OpenAI. Une valeur `instructions`
    explicite est toujours prioritaire.
  </Accordion>
  <Accordion title="Autres fournisseurs">
    Utilisent uniquement les liaisons de persona propres au fournisseur sous
    `personas.<id>.providers.<provider>`. Les champs d’invite de persona sont ignorés,
    sauf si le fournisseur implémente sa propre association d’invite de persona.
  </Accordion>
</AccordionGroup>

### Politique de repli

`fallbackPolicy` contrôle le comportement lorsqu’une persona ne possède **aucune liaison** pour le
fournisseur tenté :

| Politique           | Comportement                                                                                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `preserve-persona`  | **Par défaut.** Les champs d’invite indépendants du fournisseur restent disponibles ; le fournisseur peut les utiliser ou les ignorer.                                              |
| `provider-defaults` | La persona est omise de la préparation de l’invite pour cette tentative ; le fournisseur utilise ses valeurs par défaut neutres tandis que le repli vers d’autres fournisseurs continue. |
| `fail`              | Ignore cette tentative de fournisseur avec `reasonCode: "not_configured"` et `personaBinding: "missing"`. Les fournisseurs de repli sont tout de même essayés.                       |

L’ensemble de la requête TTS échoue uniquement lorsque **tous** les fournisseurs tentés sont ignorés
ou échouent.

La sélection du fournisseur d’une session Talk est limitée à la session. Un client Talk doit choisir
les identifiants de fournisseur, de modèle, de voix et les paramètres régionaux dans `talk.catalog`, puis les transmettre
par l’intermédiaire de la session Talk ou de la requête de transfert. L’ouverture d’une session vocale ne doit
pas modifier `messages.tts` ni les valeurs globales par défaut du fournisseur Talk.

## Directives pilotées par le modèle

Par défaut, l’assistant **peut** émettre des directives `[[tts:...]]` pour remplacer
la voix, le modèle ou la vitesse pour une seule réponse, ainsi qu’un bloc facultatif
`[[tts:text]]...[[/tts:text]]` pour les indications expressives qui doivent apparaître
uniquement dans l’audio :

```text
Voici.

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](rit) Lisez encore une fois la chanson.[[/tts:text]]
```

Lorsque `messages.tts.auto` vaut `"tagged"`, les **directives sont obligatoires** pour déclencher
l’audio. La diffusion des blocs en streaming retire les directives du texte visible avant que le
canal ne le reçoive, même lorsqu’elles sont réparties entre des blocs adjacents.

`provider=...` est ignoré sauf si `modelOverrides.allowProvider: true`. Lorsqu’une
réponse déclare `provider=...`, les autres clés de cette directive sont analysées
uniquement par ce fournisseur ; les clés non prises en charge sont supprimées et signalées comme avertissements de
directive TTS.

**Clés de directive disponibles :**

- `provider` (identifiant de fournisseur enregistré ; nécessite `allowProvider: true`)
- `speakerVoice` / `speakerVoiceId` (alias hérités : `voice`, `voiceName`, `voice_name`, `google_voice`, `voiceId`)
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume MiniMax, `(0, 10]`)
- `pitch` (hauteur MiniMax entière, de −12 à 12 ; les valeurs fractionnaires sont tronquées)
- `emotion` (balise d’émotion Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Désactiver entièrement les remplacements par le modèle :**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Autoriser le changement de fournisseur tout en gardant les autres paramètres configurables :**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Commandes slash

Commande unique `/tts`. Sur Discord, OpenClaw enregistre également `/voice`, car
`/tts` est une commande intégrée de Discord — la commande textuelle `/tts ...` fonctionne toujours.

```text
/tts off | on | status
/tts chat on | off | default
/tts latest
/tts provider <id>
/tts persona <id> | off
/tts limit <chars>
/tts summary off
/tts audio <text>
```

<Note>
Les commandes nécessitent un expéditeur autorisé (les règles de liste d’autorisation/de propriétaire s’appliquent) et soit
`commands.text`, soit l’enregistrement natif des commandes doit être activé.
</Note>

Remarques sur le comportement :

- `/tts on` écrit la préférence TTS locale avec la valeur `always` ; `/tts off` lui attribue la valeur `off`.
- `/tts chat on|off|default` écrit un remplacement TTS automatique limité à la session pour la discussion actuelle.
- `/tts persona <id>` écrit la préférence locale de persona ; `/tts persona off` l’efface.
- `/tts latest` lit la dernière réponse de l’assistant dans la transcription de la session actuelle et l’envoie une fois sous forme audio. Seul un hachage de cette réponse est stocké dans l’entrée de session afin d’empêcher les envois vocaux en double.
- `/tts audio` génère une réponse audio ponctuelle (sans **activer** le TTS).
- `/tts limit <chars>` accepte **100–4096** (4096 est la limite maximale de légende/message de Telegram) ; les valeurs hors de cette plage sont rejetées.
- `limit` et `summary` sont stockés dans les **préférences locales**, et non dans la configuration principale.
- `/tts status` inclut les diagnostics de repli de la dernière tentative — `Fallback: <primary> -> <used>`, `Attempts: ...` et les détails de chaque tentative (`provider:outcome(reasonCode) latency`).
- `/status` affiche le mode TTS actif ainsi que le fournisseur, le modèle et la voix configurés, et les métadonnées assainies du point de terminaison personnalisé lorsque le TTS est activé.

## Préférences par utilisateur

Les commandes slash écrivent les remplacements locaux dans `prefsPath`. La valeur par défaut est
`~/.openclaw/settings/tts.json` ; remplacez-la avec la variable d’environnement `OPENCLAW_TTS_PREFS`
ou `messages.tts.prefsPath`.

| Champ stocké   | Effet                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------- |
| `auto`         | Remplacement TTS automatique local (`always`, `off`, …)                                             |
| `provider`     | Remplacement local du fournisseur principal                                                         |
| `persona`      | Remplacement local de la persona                                                                    |
| `maxLength`    | Seuil de résumé/troncature (`1500` caractères par défaut, plage de `/tts limit` : 100–4096)          |
| `summarize`    | Activation du résumé (`true` par défaut)                                                             |

Ces valeurs remplacent la configuration effective provenant de `messages.tts` et du bloc
`agents.list[].tts` actif pour cet hôte.

## Formats de sortie

La diffusion vocale TTS dépend des capacités du canal. Les plugins de canal indiquent
si la TTS de type message vocal doit demander aux fournisseurs une cible native `voice-note` ou
conserver la synthèse `audio-file` normale, et si le canal transcode
la sortie non native avant l’envoi.

| Cible                                 | Format                                                                                                                                                   |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | Les réponses sous forme de message vocal privilégient **Opus** (`opus_48000_64` d’ElevenLabs, `opus` d’OpenAI). 48 kHz / 64 kbps offre un bon compromis entre clarté et taille. |
| Autres canaux                         | **MP3** (`mp3_44100_128` d’ElevenLabs, `mp3` d’OpenAI). 44,1 kHz / 128 kbps constitue le compromis par défaut pour la parole.                              |
| Talk / téléphonie                     | **PCM** natif du fournisseur (Inworld 22050 Hz, Google 24 kHz), ou `ulaw_8000` de Gradium pour la téléphonie.                                              |

Remarques par fournisseur :

- **Transcodage Feishu / WhatsApp :** lorsqu’une réponse sous forme de message vocal arrive au format MP3/WebM/WAV/M4A ou sous la forme d’un autre fichier probablement audio, le plugin de canal la transcode en Ogg/Opus 48 kHz avec `ffmpeg` (`libopus`, 64 kbps) avant d’envoyer le message vocal natif. WhatsApp envoie le résultat au moyen de la charge utile `audio` de Baileys avec `ptt: true` et `audio/ogg; codecs=opus`. En cas d’échec du transcodage : Feishu intercepte l’erreur et envoie à la place le fichier d’origine en tant que simple pièce jointe ; WhatsApp ne dispose d’aucun mécanisme de repli, l’envoi lui-même échoue donc au lieu de publier une charge utile PTT incompatible.
- **MiniMax :** MP3 (modèle `speech-2.8-hd`, fréquence d’échantillonnage de 32 kHz) pour les pièces jointes audio normales ; transcodé en Opus 48 kHz avec `ffmpeg` pour les cibles de message vocal annoncées par le canal.
- **Xiaomi MiMo :** MP3 par défaut, ou WAV lorsque configuré ; transcodé en Opus 48 kHz avec `ffmpeg` pour les cibles de message vocal annoncées par le canal.
- **CLI locale :** utilise le `outputFormat` configuré. Les cibles de message vocal sont converties en Ogg/Opus et la sortie téléphonique est convertie en PCM mono brut 16 kHz avec `ffmpeg`.
- **Google Gemini :** renvoie du PCM brut 24 kHz. OpenClaw l’encapsule au format WAV pour les pièces jointes audio, le transcode en Opus 48 kHz pour les cibles de message vocal et renvoie directement le PCM pour Talk/la téléphonie.
- **Gradium :** WAV pour les pièces jointes audio, Opus pour les cibles de message vocal et `ulaw_8000` à 8 kHz pour la téléphonie.
- **Inworld :** MP3 pour les pièces jointes audio normales, `OGG_OPUS` natif pour les cibles de message vocal et `PCM` brut à 22050 Hz pour Talk/la téléphonie.
- **xAI :** MP3 par défaut ; `responseFormat` peut être `mp3`, `wav`, `pcm`, `mulaw` ou `alaw`. Utilise le point de terminaison REST TTS par lots de xAI et renvoie une pièce jointe audio complète ; le WebSocket TTS en streaming de xAI n’est pas utilisé par ce chemin de fournisseur. Le format vocal Opus natif n’est pas pris en charge.
- **Microsoft :** utilise `microsoft.outputFormat` (valeur par défaut : `audio-24khz-48kbitrate-mono-mp3`).
  - Le transport intégré accepte un `outputFormat`, mais tous les formats ne sont pas disponibles auprès du service.
  - Les valeurs du format de sortie suivent les formats de sortie Microsoft Speech (notamment Ogg/WebM Opus).
  - La méthode `sendVoice` de Telegram accepte OGG/MP3/M4A ; utilisez OpenAI/ElevenLabs si vous avez besoin de messages vocaux Opus garantis.
  - Si le format de sortie Microsoft configuré échoue, OpenClaw réessaie avec MP3.
  - Lorsqu’aucun remplacement explicite de la voix n’est défini et que la voix anglaise par défaut est utilisée, OpenClaw bascule automatiquement vers une voix neuronale chinoise (`zh-CN-XiaoxiaoNeural`, paramètres régionaux `zh-CN`) si le texte de la réponse est majoritairement en caractères CJK.

Les formats de sortie OpenAI et ElevenLabs sont fixes pour chaque canal, comme indiqué ci-dessus.

## Comportement TTS automatique

Lorsque `messages.tts.auto` est activé, OpenClaw :

- Ignore la TTS si la réponse contient déjà un média structuré.
- Ignore les réponses très courtes (moins de 10 caractères).
- Résume les réponses longues lorsque les résumés sont activés, à l’aide de
  `summaryModel` (ou de `agents.defaults.model.primary`).
- Joint l’audio généré à la réponse.
- En `mode: "final"`, envoie toujours une TTS uniquement audio pour les réponses finales diffusées en streaming
  après la fin du flux de texte ; le média généré passe par la même
  normalisation des médias du canal que les pièces jointes de réponse normales.

Si la réponse dépasse `maxLength`, OpenClaw n’ignore jamais complètement l’audio :

- **Résumé activé** (par défaut) et un modèle de résumé est disponible : résume le
  texte à environ `maxLength` caractères, puis synthétise le résumé.
- **Résumé désactivé**, échec du résumé ou aucune clé API disponible pour le
  modèle de résumé : tronque le texte à `maxLength` caractères et synthétise le
  texte tronqué.

```text
Réponse -> TTS activée ?
  non -> envoyer le texte
  oui -> contient un média / est courte ?
          oui -> envoyer le texte
          non -> longueur > limite ?
                   non -> TTS -> joindre l’audio
                   oui -> résumé activé et disponible ?
                            non -> tronquer -> TTS -> joindre l’audio
                            oui -> résumer -> TTS -> joindre l’audio
```

## Référence des champs

<AccordionGroup>
  <Accordion title="messages.tts.* de premier niveau">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Mode TTS automatique. `inbound` n’envoie l’audio qu’après un message vocal entrant ; `tagged` n’envoie l’audio que lorsque la réponse comprend des directives `[[tts:...]]` ou un bloc `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Ancienne option d’activation. `openclaw doctor --fix` la migre vers `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` inclut les réponses d’outil/de bloc en plus des réponses finales.
    </ParamField>
    <ParamField path="provider" type="string">
      Identifiant du fournisseur de synthèse vocale. Lorsqu’il n’est pas défini, OpenClaw utilise le premier fournisseur configuré selon l’ordre de sélection automatique du registre. L’ancienne valeur `provider: "edge"` est réécrite en `"microsoft"` par `openclaw doctor --fix`.
    </ParamField>
    <ParamField path="persona" type="string">
      Identifiant du persona actif dans `personas`. Normalisé en minuscules.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Identité vocale stable. Champs : `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Consultez [Personas](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Modèle économique pour le résumé automatique ; utilise par défaut `agents.defaults.model.primary`. Accepte `provider/model` ou un alias de modèle configuré.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Autorise le modèle à émettre des directives TTS. `enabled` vaut `true` par défaut ; `allowProvider` vaut `false` par défaut.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Paramètres appartenant au fournisseur, indexés par l’identifiant du fournisseur de synthèse vocale. Les anciens blocs directs (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) sont réécrits par `openclaw doctor --fix` ; validez uniquement `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number" default="4096">
      Limite stricte du nombre de caractères de l’entrée TTS. `/tts audio`, `tts.convert` et `tts.speak` échouent si elle est dépassée.
    </ParamField>
    <ParamField path="timeoutMs" type="number" default="30000">
      Délai d’expiration de la requête en millisecondes. Un `timeoutMs` propre à l’appel (outil de l’agent, Gateway) prévaut lorsqu’il est défini ; sinon, une valeur `messages.tts.timeoutMs` explicitement configurée prévaut sur toute valeur par défaut du fournisseur définie par un plugin.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Remplace le chemin JSON local des préférences (fournisseur/limite/résumé). Valeur par défaut : `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Variable d’environnement : `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` ou `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Région Azure Speech (par ex. `eastus`). Variable d’environnement : `AZURE_SPEECH_REGION` ou `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Remplacement facultatif du point de terminaison Azure Speech (alias `baseUrl`).</ParamField>
    <ParamField path="speakerVoice" type="string">ShortName de la voix Azure. Valeur par défaut : `en-US-JennyNeural`. Ancien alias : `voice`.</ParamField>
    <ParamField path="lang" type="string">Code de langue SSML. Valeur par défaut : `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">Valeur Azure `X-Microsoft-OutputFormat` pour l’audio standard. Valeur par défaut : `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Valeur Azure `X-Microsoft-OutputFormat` pour la sortie sous forme de message vocal. Valeur par défaut : `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Utilise à défaut `ELEVENLABS_API_KEY` ou `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Identifiant du modèle. Valeur par défaut : `eleven_multilingual_v2`. Les anciens identifiants `eleven_turbo_v2_5`/`eleven_turbo_v2` sont normalisés vers le modèle `flash` correspondant.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Identifiant de voix ElevenLabs. Valeur par défaut : `pMsXgVXv3BLzUgSXRplE`. Ancien alias : `voiceId`.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (chacun dans `0..1`, valeurs par défaut `0.5`/`0.75`/`0`), `useSpeakerBoost` (`true|false`, valeur par défaut `true`), `speed` (`0.5..2.0`, valeur par défaut `1.0`).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Mode de normalisation du texte.</ParamField>
    <ParamField path="languageCode" type="string">Code ISO 639-1 à 2 lettres (par ex. `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Entier `0..4294967295` pour un déterminisme au mieux.</ParamField>
    <ParamField path="baseUrl" type="string">Remplace l’URL de base de l’API ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Utilise à défaut `GEMINI_API_KEY` / `GOOGLE_API_KEY`. Si elle est omise, la TTS peut réutiliser `models.providers.google.apiKey` avant de recourir aux variables d’environnement.</ParamField>
    <ParamField path="model" type="string">Modèle TTS Gemini. Valeur par défaut : `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="speakerVoice" type="string">Nom de la voix prédéfinie Gemini. Valeur par défaut : `Kore`. Anciens alias : `voiceName`, `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Instruction de style en langage naturel ajoutée avant le texte prononcé.</ParamField>
    <ParamField path="speakerName" type="string">Libellé facultatif du locuteur ajouté avant le texte prononcé lorsque votre instruction utilise un locuteur nommé.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Définissez sur `audio-profile-v1` pour encapsuler les champs d’instruction du persona actif dans une structure d’instruction TTS Gemini déterministe.</ParamField>
    <ParamField path="personaPrompt" type="string">Texte d’instruction supplémentaire propre à Google pour le persona, ajouté aux notes du réalisateur du modèle.</ParamField>
    <ParamField path="baseUrl" type="string">Seule l’adresse `https://generativelanguage.googleapis.com` est acceptée.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Variable d’environnement : `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">URL HTTPS de l’API Gradium sur `api.gradium.ai`. Valeur par défaut : `https://api.gradium.ai`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Emma par défaut (`YTpq7expH9539ERJ`). Ancien alias : `voiceId`.</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Paramètres principaux d’Inworld

    <ParamField path="apiKey" type="string">Env. : `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Valeur par défaut : `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Valeur par défaut : `inworld-tts-1.5-max`. Également : `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Valeur par défaut : `Sarah`. Alias historique : `voiceId`.</ParamField>
    <ParamField path="temperature" type="number">Température d’échantillonnage `0..2` (0 exclu).</ParamField>

  </Accordion>

  <Accordion title="CLI locale (tts-local-cli)">
    <ParamField path="command" type="string">Exécutable local ou chaîne de commande pour la synthèse vocale via la CLI.</ParamField>
    <ParamField path="args" type="string[]">Arguments de la commande. Prend en charge les espaces réservés `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Format de sortie attendu de la CLI. Valeur par défaut : `mp3` pour les pièces jointes audio.</ParamField>
    <ParamField path="timeoutMs" type="number">Délai d’expiration de la commande en millisecondes. Valeur par défaut : `120000`.</ParamField>
    <ParamField path="cwd" type="string">Répertoire de travail facultatif de la commande.</ParamField>
    <ParamField path="env" type="Record<string, string>">Remplacements facultatifs des variables d’environnement pour la commande.</ParamField>

    La sortie standard de la commande ainsi que l’audio généré ou converti sont limités à 50 Mio. La sortie d’erreur de diagnostic est limitée à 1 Mio. OpenClaw met fin à la commande et fait échouer la synthèse si l’une de ces limites est dépassée.

  </Accordion>

  <Accordion title="Microsoft (aucune clé API)">
    <ParamField path="enabled" type="boolean" default="true">Autoriser l’utilisation de la synthèse vocale Microsoft.</ParamField>
    <ParamField path="speakerVoice" type="string">Nom de la voix neuronale Microsoft (par ex. `en-US-MichelleNeural`). Alias historique : `voice`. Si la voix anglaise par défaut est utilisée et que le texte de la réponse est majoritairement en caractères CJK, OpenClaw passe automatiquement à `zh-CN-XiaoxiaoNeural`.</ParamField>
    <ParamField path="lang" type="string">Code de langue (par ex. `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Format de sortie Microsoft. Valeur par défaut : `audio-24khz-48kbitrate-mono-mp3`. Tous les formats ne sont pas pris en charge par le transport Edge intégré.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Chaînes de pourcentage (par ex. `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Écrire les sous-titres JSON à côté du fichier audio.</ParamField>
    <ParamField path="proxy" type="string">URL du proxy pour les requêtes de synthèse vocale Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Remplacement du délai d’expiration de la requête (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Alias historique. Exécutez `openclaw doctor --fix` pour réécrire la configuration persistante vers `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Utilise `MINIMAX_API_KEY` comme solution de repli. Authentification Token Plan via `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` ou `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Valeur par défaut : `https://api.minimax.io`. Env. : `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Valeur par défaut : `speech-2.8-hd`. Env. : `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Valeur par défaut : `English_expressive_narrator`. Env. : `MINIMAX_TTS_VOICE_ID`. Alias historique : `voiceId`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Valeur par défaut : `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Valeur par défaut : `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Entier `-12..12`. Valeur par défaut : `0`. Les valeurs fractionnaires sont tronquées avant la requête.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Utilise `OPENAI_API_KEY` comme solution de repli.</ParamField>
    <ParamField path="model" type="string">Identifiant du modèle TTS OpenAI. Valeur par défaut : `gpt-4o-mini-tts`.</ParamField>
    <ParamField path="speakerVoice" type="string">Nom de la voix (par ex. `alloy`, `cedar`). Valeur par défaut : `coral`. Alias historique : `voice`.</ParamField>
    <ParamField path="instructions" type="string">Champ `instructions` OpenAI explicite. Lorsqu’il est défini, les champs d’invite de persona ne sont **pas** associés automatiquement.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">Champs JSON supplémentaires fusionnés dans les corps des requêtes `/audio/speech` après les champs TTS OpenAI générés. Utilisez ceci pour les points de terminaison compatibles avec OpenAI, tels que Kokoro, qui nécessitent des clés propres au fournisseur comme `lang` ; les clés de prototype non sécurisées sont ignorées.</ParamField>
    <ParamField path="baseUrl" type="string">
      Remplacez le point de terminaison TTS OpenAI. Ordre de résolution : configuration → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Les valeurs autres que celle par défaut sont traitées comme des points de terminaison TTS compatibles avec OpenAI ; les noms personnalisés de modèles et de voix sont donc acceptés, et `speed` n’est plus soumis à la vérification de la plage `0.25..4.0`.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Env. : `OPENROUTER_API_KEY`. Peut réutiliser `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">Valeur par défaut : `https://openrouter.ai/api/v1`. L’ancienne URL `https://openrouter.ai/v1` est normalisée.</ParamField>
    <ParamField path="model" type="string">Valeur par défaut : `hexgrad/kokoro-82m`. Alias : `modelId`.</ParamField>
    <ParamField path="speakerVoice" type="string">Valeur par défaut : `af_alloy`. Alias historiques : `voice`, `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Valeur par défaut : `mp3`.</ParamField>
    <ParamField path="speed" type="number">Remplacement de la vitesse native du fournisseur.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Env. : `VOLCENGINE_TTS_API_KEY` ou `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Valeur par défaut : `seed-tts-1.0`. Env. : `VOLCENGINE_TTS_RESOURCE_ID`. Utilisez `seed-tts-2.0` lorsque votre projet dispose des droits TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">En-tête de clé d’application. Valeur par défaut : `aGjiRDfUWi`. Env. : `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Remplace le point de terminaison HTTP TTS Seed Speech. Env. : `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="speakerVoice" type="string">Type de voix. Valeur par défaut : `en_female_anna_mars_bigtts`. Env. : `VOLCENGINE_TTS_VOICE`. Alias historique : `voice`.</ParamField>
    <ParamField path="speedRatio" type="number">Rapport de vitesse natif du fournisseur, `0.2..3`.</ParamField>
    <ParamField path="emotion" type="string">Balise d’émotion native du fournisseur.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Anciens champs de Volcengine Speech Console. Env. : `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (valeur par défaut : `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Env. : `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Valeur par défaut : `https://api.x.ai/v1`. Env. : `XAI_BASE_URL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Valeur par défaut : `eve`. Avec authentification, `openclaw infer tts voices --provider xai` récupère le catalogue intégré actuel ; sans authentification, la commande répertorie les solutions de repli hors ligne `ara`, `eve`, `leo`, `rex` et `sal`. Les identifiants de voix personnalisés du compte sont transmis même s’ils ne figurent pas dans la liste intégrée. Alias historique : `voiceId`.</ParamField>
    <ParamField path="language" type="string">Code de langue BCP-47 ou `auto`. Valeur par défaut : `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Valeur par défaut : `mp3`.</ParamField>
    <ParamField path="speed" type="number">Remplacement de la vitesse native du fournisseur, `0.7..1.5`.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Env. : `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Valeur par défaut : `https://api.xiaomimimo.com/v1`. Env. : `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Valeur par défaut : `mimo-v2.5-tts`. Env. : `XIAOMI_TTS_MODEL`. Prend également en charge `mimo-v2-tts` et `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="speakerVoice" type="string">Valeur par défaut : `mimo_default` pour les modèles à voix prédéfinies. Env. : `XIAOMI_TTS_VOICE`. Alias historique : `voice`. Non envoyé pour `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Valeur par défaut : `mp3`. Env. : `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Instruction facultative de style en langage naturel envoyée comme message utilisateur ; elle n’est pas prononcée. Pour `mimo-v2.5-tts-voicedesign`, il s’agit de l’invite de conception de la voix ; OpenClaw fournit une valeur par défaut lorsqu’elle est omise.</ParamField>
  </Accordion>
</AccordionGroup>

## Outil de l’agent

L’outil `tts` convertit le texte en parole et renvoie une pièce jointe audio pour
la livraison de la réponse. Sur Feishu, Matrix, Telegram et WhatsApp, l’audio est
envoyé sous forme de message vocal plutôt que de pièce jointe. Feishu et
WhatsApp peuvent transcoder une sortie TTS autre qu’Opus sur ce parcours lorsque `ffmpeg` est
disponible.

WhatsApp envoie l’audio via Baileys sous forme de note vocale PTT (`audio` avec
`ptt: true`) et envoie le texte visible **séparément** de l’audio PTT, car
les clients n’affichent pas systématiquement les légendes des notes vocales.

L’outil accepte les champs facultatifs `channel` et `timeoutMs` ; `timeoutMs` est un
délai d’expiration par appel pour la requête au fournisseur, en millisecondes. Les valeurs par appel remplacent
`messages.tts.timeoutMs` ; les délais d’expiration TTS configurés remplacent toute valeur par défaut du fournisseur
définie par un Plugin.

## RPC du Gateway

| Méthode           | Objectif                                                   |
| ----------------- | ---------------------------------------------------------- |
| `tts.status`      | Lire l’état TTS actuel et la dernière tentative.           |
| `tts.enable`      | Définir la préférence automatique locale sur `always`.     |
| `tts.disable`     | Définir la préférence automatique locale sur `off`.        |
| `tts.convert`     | Conversion ponctuelle du texte en audio.                   |
| `tts.setProvider` | Définir la préférence locale de fournisseur.               |
| `tts.personas`    | Répertorier les personas configurées et celle qui est active. |
| `tts.setPersona`  | Définir la préférence locale de persona.                   |
| `tts.providers`   | Répertorier les fournisseurs configurés et leur état.      |

## Liens vers les services

- [Guide de synthèse vocale OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [Référence de l’API Audio OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [Synthèse vocale REST Azure Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Fournisseur Azure Speech](/fr/providers/azure-speech)
- [Synthèse vocale ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Authentification ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/fr/providers/gradium)
- [API TTS Inworld](https://docs.inworld.ai/tts/tts)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [API HTTP TTS Volcengine](/fr/providers/volcengine#text-to-speech)
- [Synthèse vocale Xiaomi MiMo](/fr/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formats de sortie Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [Synthèse vocale xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Pages connexes

- [Vue d’ensemble des médias](/fr/tools/media-overview)
- [Génération de musique](/fr/tools/music-generation)
- [Génération de vidéos](/fr/tools/video-generation)
- [Commandes slash](/fr/tools/slash-commands)
- [Plugin d’appel vocal](/fr/plugins/voice-call)
