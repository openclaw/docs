---
read_when:
    - Activer la synthèse vocale pour les réponses
    - Configuration d’un fournisseur TTS, d’une chaîne de repli ou d’une persona
    - Utilisation des commandes ou directives /tts
sidebarTitle: Text to speech (TTS)
summary: Synthèse vocale pour les réponses sortantes — fournisseurs, personas, commandes slash et sortie par canal
title: Synthèse vocale
x-i18n:
    generated_at: "2026-06-27T18:22:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 94835daf766286e937c57828818a4ee0a20e6d5894b7d51d6f98fc7ebdaffe35
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw peut convertir les réponses sortantes en audio avec **14 fournisseurs de synthèse vocale**
et livrer des messages vocaux natifs sur Feishu, Matrix, Telegram et WhatsApp,
des pièces jointes audio partout ailleurs, ainsi que des flux PCM/Ulaw pour la téléphonie et Talk.

TTS est la moitié sortie vocale du mode `stt-tts` de Talk. Les sessions Talk `realtime`
natives du fournisseur synthétisent la parole dans le fournisseur en temps réel au lieu
d’appeler ce chemin TTS, tandis que les sessions `transcription` ne synthétisent pas de
réponse vocale de l’assistant.

## Démarrage rapide

<Steps>
  <Step title="Choisir un fournisseur">
    OpenAI et ElevenLabs sont les options hébergées les plus fiables. Microsoft et
    la CLI locale fonctionnent sans clé API. Consultez la [matrice des fournisseurs](#supported-providers)
    pour la liste complète.
  </Step>
  <Step title="Définir la clé API">
    Exportez la variable d’environnement de votre fournisseur (par exemple `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft et la CLI locale n’ont pas besoin de clé.
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
  <Step title="L’essayer dans le chat">
    `/tts status` affiche l’état actuel. `/tts audio Hello from OpenClaw`
    envoie une réponse audio ponctuelle.
  </Step>
</Steps>

<Note>
Auto-TTS est **désactivé** par défaut. Quand `messages.tts.provider` n’est pas défini,
OpenClaw choisit le premier fournisseur configuré dans l’ordre de sélection automatique du registre.
L’outil d’agent `tts` intégré exige une intention explicite : le chat ordinaire reste
en texte sauf si l’utilisateur demande de l’audio, utilise `/tts` ou active la parole
Auto-TTS/directive.
</Note>

## Fournisseurs pris en charge

| Fournisseur       | Authentification                                                                                                 | Notes                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (aussi `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)          | Sortie native de note vocale Ogg/Opus et téléphonie.                                        |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | TTS compatible OpenAI. Par défaut : `hexgrad/Kokoro-82M`.                                   |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` ou `XI_API_KEY`                                                                             | Clonage de voix, multilingue, déterministe via `seed` ; diffusé en continu pour la lecture vocale Discord. |
| **Google Gemini** | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`                                                                             | TTS par lot de l’API Gemini ; sensible à la persona via `promptTemplate: "audio-profile-v1"`. |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | Sortie de note vocale et de téléphonie.                                                     |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | API TTS en streaming. Note vocale Opus native et téléphonie PCM.                            |
| **CLI locale**    | aucune                                                                                                           | Exécute une commande TTS locale configurée.                                                  |
| **Microsoft**     | aucune                                                                                                           | TTS neural public Edge via `node-edge-tts`. Au mieux, sans SLA.                             |
| **MiniMax**       | `MINIMAX_API_KEY` (ou Token Plan : `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)     | API T2A v2. Par défaut : `speech-2.8-hd`.                                                   |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | Également utilisé pour le résumé automatique ; prend en charge les `instructions` de persona. |
| **OpenRouter**    | `OPENROUTER_API_KEY` (peut réutiliser `models.providers.openrouter.apiKey`)                                      | Modèle par défaut `hexgrad/kokoro-82m`.                                                     |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` ou `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/jeton hérité : `VOLCENGINE_TTS_APPID`/`_TOKEN`) | API HTTP BytePlus Seed Speech.                                                              |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | Fournisseur partagé d’image, de vidéo et de parole.                                         |
| **xAI**           | `XAI_API_KEY`                                                                                                    | TTS par lot xAI. La note vocale Opus native n’est **pas** prise en charge.                  |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | TTS MiMo via les complétions de chat Xiaomi.                                                |

Si plusieurs fournisseurs sont configurés, celui sélectionné est utilisé en premier et les
autres servent d’options de secours. Le résumé automatique utilise `summaryModel` (ou
`agents.defaults.model.primary`), ce fournisseur doit donc aussi être authentifié
si vous gardez les résumés activés.

<Warning>
Le fournisseur **Microsoft** intégré utilise le service TTS neural en ligne de Microsoft Edge
via `node-edge-tts`. Il s’agit d’un service web public sans SLA ni quota publiés —
traitez-le comme un service au mieux. L’identifiant de fournisseur hérité `edge` est
normalisé en `microsoft` et `openclaw doctor --fix` réécrit la configuration persistée ;
les nouvelles configurations doivent toujours utiliser `microsoft`.
</Warning>

## Configuration

La configuration TTS se trouve sous `messages.tts` dans `~/.openclaw/openclaw.json`. Choisissez un
préréglage et adaptez le bloc du fournisseur :

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
          // Optional natural-language style prompts:
          // audioProfile: "Speak in a calm, podcast-host tone.",
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

Utilisez `agents.list[].tts` lorsqu’un agent doit parler avec un fournisseur, une voix, un modèle, une persona ou un mode auto-TTS différent. Le bloc de l’agent est fusionné en profondeur au-dessus de `messages.tts`, ce qui permet aux identifiants du fournisseur de rester dans la configuration globale du fournisseur:

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

Pour épingler une persona par agent, définissez `agents.list[].tts.persona` avec la configuration du fournisseur — elle remplace la `messages.tts.persona` globale uniquement pour cet agent.

Ordre de priorité pour les réponses automatiques, `/tts audio`, `/tts status` et l’outil d’agent `tts`:

1. `messages.tts`
2. `agents.list[].tts` actif
3. remplacement du canal, lorsque le canal prend en charge `channels.<channel>.tts`
4. remplacement du compte, lorsque le canal transmet `channels.<channel>.accounts.<id>.tts`
5. préférences `/tts` locales pour cet hôte
6. directives inline `[[tts:...]]` lorsque les [remplacements pilotés par le modèle](#model-driven-directives) sont activés

Les remplacements de canal et de compte utilisent la même forme que `messages.tts` et se fusionnent en profondeur au-dessus des couches précédentes, ce qui permet aux identifiants de fournisseur partagés de rester dans `messages.tts` tandis qu’un canal ou un compte de bot modifie uniquement la voix du locuteur, le modèle, la persona ou le mode auto:

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

Une **persona** est une identité vocale stable qui peut être appliquée de façon déterministe entre fournisseurs. Elle peut privilégier un fournisseur, définir une intention de prompt neutre vis-à-vis des fournisseurs et transporter des liaisons propres aux fournisseurs pour les voix, modèles, modèles de prompt, seeds et réglages de voix.

### Persona minimale

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "Narrator",
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

### Persona complète (prompt neutre vis-à-vis du fournisseur)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "Dry, warm British butler narrator.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "A brilliant British butler. Dry, witty, warm, charming, emotionally expressive, never generic.",
            scene: "A quiet late-night study. Close-mic narration for a trusted operator.",
            sampleContext: "The speaker is answering a private technical request with concise confidence and dry warmth.",
            style: "Refined, understated, lightly amused.",
            accent: "British English.",
            pacing: "Measured, with short dramatic pauses.",
            constraints: ["Do not read configuration values aloud.", "Do not explain the persona."],
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

La persona active est sélectionnée de façon déterministe:

1. préférence locale `/tts persona <id>`, si elle est définie.
2. `messages.tts.persona`, si elle est définie.
3. aucune persona.

La sélection du fournisseur suit d’abord les éléments explicites:

1. remplacements directs (CLI, Gateway, Talk, directives TTS autorisées).
2. préférence locale `/tts provider <id>`.
3. `provider` de la persona active.
4. `messages.tts.provider`.
5. sélection automatique du registre.

Pour chaque tentative de fournisseur, OpenClaw fusionne les configurations dans cet ordre:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. remplacements de requête approuvés
4. remplacements autorisés issus de directives TTS émises par le modèle

### Comment les fournisseurs utilisent les prompts de persona

Les champs de prompt de persona (`profile`, `scene`, `sampleContext`, `style`, `accent`, `pacing`, `constraints`) sont **neutres vis-à-vis du fournisseur**. Chaque fournisseur décide comment les utiliser:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Encapsule les champs de prompt de persona dans une structure de prompt Gemini TTS **uniquement lorsque** la configuration effective du fournisseur Google définit `promptTemplate: "audio-profile-v1"` ou `personaPrompt`. Les anciens champs `audioProfile` et `speakerName` sont encore préfixés comme texte de prompt propre à Google. Les balises audio inline comme `[whispers]` ou `[laughs]` dans un bloc `[[tts:text]]` sont préservées dans la transcription Gemini; OpenClaw ne génère pas ces balises.
  </Accordion>
  <Accordion title="OpenAI">
    Mappe les champs de prompt de persona vers le champ de requête `instructions` **uniquement lorsque** aucune `instructions` OpenAI explicite n’est configurée. Les `instructions` explicites ont toujours priorité.
  </Accordion>
  <Accordion title="Autres fournisseurs">
    Utilisent uniquement les liaisons de persona propres au fournisseur sous `personas.<id>.providers.<provider>`. Les champs de prompt de persona sont ignorés sauf si le fournisseur implémente son propre mappage de prompt de persona.
  </Accordion>
</AccordionGroup>

### Politique de fallback

`fallbackPolicy` contrôle le comportement lorsqu’une persona n’a **aucune liaison** pour le fournisseur tenté:

| Politique           | Comportement                                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `preserve-persona`  | **Par défaut.** Les champs de prompt neutres vis-à-vis du fournisseur restent disponibles; le fournisseur peut les utiliser ou les ignorer.       |
| `provider-defaults` | La persona est omise de la préparation du prompt pour cette tentative; le fournisseur utilise ses valeurs par défaut neutres pendant que le fallback vers d’autres fournisseurs continue. |
| `fail`              | Ignore cette tentative de fournisseur avec `reasonCode: "not_configured"` et `personaBinding: "missing"`. Les fournisseurs de fallback sont tout de même essayés. |

L’ensemble de la requête TTS n’échoue que lorsque **tous** les fournisseurs tentés sont ignorés ou échouent.

La sélection du fournisseur de session Talk est limitée à la session. Un client Talk doit choisir les ID de fournisseur, ID de modèle, ID de voix et paramètres régionaux depuis `talk.catalog` et les transmettre via la session Talk ou la requête de transfert. L’ouverture d’une session vocale ne doit pas modifier `messages.tts` ni les valeurs par défaut globales du fournisseur Talk.

## Directives pilotées par le modèle

Par défaut, l’assistant **peut** émettre des directives `[[tts:...]]` pour remplacer la voix, le modèle ou la vitesse pour une seule réponse, ainsi qu’un bloc facultatif `[[tts:text]]...[[/tts:text]]` pour les indications expressives qui ne doivent apparaître que dans l’audio:

```text
Here you go.

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Lorsque `messages.tts.auto` vaut `"tagged"`, les **directives sont requises** pour déclencher l’audio. La livraison de blocs en streaming supprime les directives du texte visible avant que le canal ne les voie, même lorsqu’elles sont réparties entre des blocs adjacents.

`provider=...` est ignoré sauf si `modelOverrides.allowProvider: true`. Lorsqu’une réponse déclare `provider=...`, les autres clés de cette directive sont analysées uniquement par ce fournisseur; les clés non prises en charge sont supprimées et signalées comme avertissements de directive TTS.

**Clés de directive disponibles:**

- `provider` (ID de fournisseur enregistré; nécessite `allowProvider: true`)
- `speakerVoice` / `speakerVoiceId` (alias hérités: `voice`, `voiceName`, `voice_name`, `google_voice`, `voiceId`)
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume MiniMax, 0–10)
- `pitch` (hauteur entière MiniMax, −12 à 12; les valeurs fractionnaires sont tronquées)
- `emotion` (balise d’émotion Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Désactiver entièrement les remplacements du modèle:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Autoriser le changement de fournisseur tout en gardant les autres réglages configurables:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Commandes slash

Commande unique `/tts`. Sur Discord, OpenClaw enregistre aussi `/voice` parce que `/tts` est une commande Discord intégrée — le texte `/tts ...` fonctionne toujours.

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
Les commandes nécessitent un expéditeur autorisé (les règles d’allowlist/propriétaire s’appliquent) et `commands.text` ou l’enregistrement natif des commandes doit être activé.
</Note>

Notes de comportement:

- `/tts on` écrit la préférence TTS locale sur `always`; `/tts off` l’écrit sur `off`.
- `/tts chat on|off|default` écrit un remplacement auto-TTS limité à la session pour la conversation actuelle.
- `/tts persona <id>` écrit la préférence de persona locale; `/tts persona off` l’efface.
- `/tts latest` lit la dernière réponse de l’assistant dans la transcription de la session actuelle et l’envoie une fois sous forme d’audio. Elle ne stocke qu’un hash de cette réponse sur l’entrée de session afin de supprimer les envois vocaux en double.
- `/tts audio` génère une réponse audio ponctuelle (n’active **pas** TTS).
- `limit` et `summary` sont stockés dans les **préférences locales**, pas dans la configuration principale.
- `/tts status` inclut les diagnostics de fallback pour la dernière tentative — `Fallback: <primary> -> <used>`, `Attempts: ...`, et le détail par tentative (`provider:outcome(reasonCode) latency`).
- `/status` affiche le mode TTS actif ainsi que le fournisseur, le modèle, la voix configurés et les métadonnées de point de terminaison personnalisé assainies lorsque TTS est activé.

## Préférences par utilisateur

Les commandes slash écrivent les remplacements locaux dans `prefsPath`. La valeur par défaut est `~/.openclaw/settings/tts.json`; remplacez-la avec la variable d’environnement `OPENCLAW_TTS_PREFS` ou `messages.tts.prefsPath`.

| Champ stocké | Effet                                           |
| ------------ | ----------------------------------------------- |
| `auto`       | Remplacement auto-TTS local (`always`, `off`, …) |
| `provider`   | Remplacement du fournisseur principal local     |
| `persona`    | Remplacement de persona local                   |
| `maxLength`  | Seuil de résumé (`1500` caractères par défaut)  |
| `summarize`  | Bascule de résumé (`true` par défaut)           |

Ces valeurs remplacent la configuration effective issue de `messages.tts` plus le bloc `agents.list[].tts` actif pour cet hôte.

## Formats de sortie (fixes)

La livraison vocale TTS est pilotée par les capacités du canal. Les Plugins de canal annoncent si le TTS de style vocal doit demander aux fournisseurs une cible native `voice-note` ou conserver une synthèse `audio-file` normale et seulement marquer la sortie compatible pour la livraison vocale.

- **Canaux compatibles avec les notes vocales**: les réponses sous forme de note vocale privilégient Opus (`opus_48000_64` depuis ElevenLabs, `opus` depuis OpenAI).
  - 48 kHz / 64 kbit/s offre un bon compromis pour les messages vocaux.
- **Feishu / WhatsApp**: lorsqu’une réponse sous forme de note vocale est produite en MP3/WebM/WAV/M4A
  ou dans un autre format probablement audio, le Plugin de canal la transcode en Ogg/Opus
  48 kHz avec `ffmpeg` avant d’envoyer le message vocal natif. WhatsApp envoie
  le résultat via la charge utile Baileys `audio` avec `ptt: true` et
  `audio/ogg; codecs=opus`. Si la conversion échoue, Feishu reçoit le fichier
  d’origine en pièce jointe ; l’envoi WhatsApp échoue plutôt que de publier une
  charge utile PTT incompatible.
- **Autres canaux**: MP3 (`mp3_44100_128` depuis ElevenLabs, `mp3` depuis OpenAI).
  - 44,1 kHz / 128 kbit/s est l’équilibre par défaut pour la clarté de la parole.
- **MiniMax**: MP3 (modèle `speech-2.8-hd`, fréquence d’échantillonnage de 32 kHz) pour les pièces jointes audio normales. Pour les cibles de notes vocales annoncées par le canal, OpenClaw transcode le MP3 MiniMax en Opus 48 kHz avec `ffmpeg` avant la livraison lorsque le canal annonce la prise en charge du transcodage.
- **Xiaomi MiMo**: MP3 par défaut, ou WAV lorsque configuré. Pour les cibles de notes vocales annoncées par le canal, OpenClaw transcode la sortie Xiaomi en Opus 48 kHz avec `ffmpeg` avant la livraison lorsque le canal annonce la prise en charge du transcodage.
- **CLI locale**: utilise le `outputFormat` configuré. Les cibles de notes vocales sont
  converties en Ogg/Opus, et la sortie de téléphonie est convertie en PCM mono
  brut 16 kHz avec `ffmpeg`.
- **Google Gemini**: la TTS de l’API Gemini renvoie du PCM brut 24 kHz. OpenClaw l’encapsule en WAV pour les pièces jointes audio, la transcode en Opus 48 kHz pour les cibles de notes vocales, et renvoie directement le PCM pour Talk/téléphonie.
- **Gradium**: WAV pour les pièces jointes audio, Opus pour les cibles de notes vocales, et `ulaw_8000` à 8 kHz pour la téléphonie.
- **Inworld**: MP3 pour les pièces jointes audio normales, `OGG_OPUS` natif pour les cibles de notes vocales, et `PCM` brut à 22050 Hz pour Talk/téléphonie.
- **xAI**: MP3 par défaut ; `responseFormat` peut être `mp3`, `wav`, `pcm`, `mulaw` ou `alaw`. OpenClaw utilise le point de terminaison TTS REST par lots de xAI et renvoie une pièce jointe audio complète ; le WebSocket TTS en streaming de xAI n’est pas utilisé par ce chemin de fournisseur. Le format natif Opus pour les notes vocales n’est pas pris en charge par ce chemin.
- **Microsoft**: utilise `microsoft.outputFormat` (par défaut `audio-24khz-48kbitrate-mono-mp3`).
  - Le transport inclus accepte un `outputFormat`, mais tous les formats ne sont pas disponibles depuis le service.
  - Les valeurs de format de sortie suivent les formats de sortie Microsoft Speech (y compris Ogg/WebM Opus).
  - Telegram `sendVoice` accepte OGG/MP3/M4A ; utilisez OpenAI/ElevenLabs si vous avez besoin
    de messages vocaux Opus garantis.
  - Si le format de sortie Microsoft configuré échoue, OpenClaw réessaie avec MP3.

Les formats de sortie OpenAI/ElevenLabs sont fixes par canal (voir ci-dessus).

## Comportement Auto-TTS

Lorsque `messages.tts.auto` est activé, OpenClaw :

- Ignore la TTS si la réponse contient déjà des médias structurés.
- Ignore les réponses très courtes (moins de 10 caractères).
- Résume les réponses longues lorsque les résumés sont activés, en utilisant
  `summaryModel` (ou `agents.defaults.model.primary`).
- Joint l’audio généré à la réponse.
- En `mode: "final"`, envoie toujours une TTS audio seule pour les réponses finales diffusées en streaming
  après la fin du flux de texte ; le média généré passe par la même
  normalisation des médias de canal que les pièces jointes de réponse normales.

Si la réponse dépasse `maxLength` et que le résumé est désactivé (ou qu’il n’y a pas de clé API pour le
modèle de résumé), l’audio est ignoré et la réponse textuelle normale est envoyée.

```text
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize -> TTS -> attach audio
```

## Formats de sortie par canal

  | Cible                                 | Format                                                                                                                                      |
  | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
  | Feishu / Matrix / Telegram / WhatsApp | Les réponses par note vocale préfèrent **Opus** (`opus_48000_64` depuis ElevenLabs, `opus` depuis OpenAI). 48 kHz / 64 kbps équilibre clarté et taille. |
  | Autres canaux                         | **MP3** (`mp3_44100_128` depuis ElevenLabs, `mp3` depuis OpenAI). 44,1 kHz / 128 kbps par défaut pour la parole.                            |
  | Discussion / téléphonie               | **PCM** natif du fournisseur (Inworld 22050 Hz, Google 24 kHz), ou `ulaw_8000` depuis Gradium pour la téléphonie.                           |

  Notes par fournisseur :

  - **Transcodage Feishu / WhatsApp :** lorsqu’une réponse par note vocale arrive en MP3/WebM/WAV/M4A, le Plugin de canal la transcode en Ogg/Opus 48 kHz avec `ffmpeg`. WhatsApp envoie via Baileys avec `ptt: true` et `audio/ogg; codecs=opus`. Si la conversion échoue : Feishu revient à la pièce jointe du fichier d’origine ; l’envoi WhatsApp échoue au lieu de publier une charge utile PTT incompatible.
  - **MiniMax / Xiaomi MiMo :** MP3 par défaut (32 kHz pour MiniMax `speech-2.8-hd`) ; transcodé en Opus 48 kHz pour les cibles de note vocale via `ffmpeg`.
  - **CLI locale :** utilise le `outputFormat` configuré. Les cibles de note vocale sont converties en Ogg/Opus et la sortie téléphonique en PCM mono 16 kHz brut.
  - **Google Gemini :** renvoie du PCM 24 kHz brut. OpenClaw l’encapsule en WAV pour les pièces jointes, le transcode en Opus 48 kHz pour les cibles de note vocale, et renvoie directement le PCM pour Discussion/téléphonie.
  - **Inworld :** pièces jointes MP3, note vocale native `OGG_OPUS`, `PCM` brut 22050 Hz pour Discussion/téléphonie.
  - **xAI :** MP3 par défaut ; `responseFormat` peut être `mp3|wav|pcm|mulaw|alaw`. Utilise le point de terminaison REST par lot de xAI — le TTS WebSocket en streaming n’est **pas** utilisé. Le format natif Opus pour note vocale n’est **pas** pris en charge.
  - **Microsoft :** utilise `microsoft.outputFormat` (par défaut `audio-24khz-48kbitrate-mono-mp3`). Telegram `sendVoice` accepte OGG/MP3/M4A ; utilisez OpenAI/ElevenLabs si vous avez besoin de messages vocaux Opus garantis. Si le format Microsoft configuré échoue, OpenClaw réessaie avec MP3.

  Les formats de sortie OpenAI et ElevenLabs sont fixes par canal comme indiqué ci-dessus.

  ## Référence des champs

  <AccordionGroup>
  <Accordion title="Top-level messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Mode Auto-TTS. `inbound` envoie l’audio uniquement après un message vocal entrant ; `tagged` envoie l’audio uniquement lorsque la réponse inclut des directives `[[tts:...]]` ou un bloc `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Bascule héritée. `openclaw doctor --fix` la migre vers `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` inclut les réponses d’outils/blocs en plus des réponses finales.
    </ParamField>
    <ParamField path="provider" type="string">
      Identifiant du fournisseur vocal. Lorsqu’il n’est pas défini, OpenClaw utilise le premier fournisseur configuré dans l’ordre de sélection automatique du registre. L’ancien `provider: "edge"` est réécrit en `"microsoft"` par `openclaw doctor --fix`.
    </ParamField>
    <ParamField path="persona" type="string">
      Identifiant de persona actif depuis `personas`. Normalisé en minuscules.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Identité vocale stable. Champs : `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Voir [Personas](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Modèle économique pour le résumé automatique ; par défaut `agents.defaults.model.primary`. Accepte `provider/model` ou un alias de modèle configuré.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Autorise le modèle à émettre des directives TTS. `enabled` vaut `true` par défaut ; `allowProvider` vaut `false` par défaut.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Paramètres détenus par le fournisseur, indexés par identifiant de fournisseur vocal. Les anciens blocs directs (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) sont réécrits par `openclaw doctor --fix` ; ne validez que `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      Limite stricte de caractères d’entrée TTS. `/tts audio` échoue si elle est dépassée.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      Délai d’expiration de la requête en millisecondes.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Remplace le chemin JSON local des préférences (fournisseur/limite/résumé). Par défaut `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env : `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY`, ou `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Région Azure Speech (p. ex. `eastus`). Env : `AZURE_SPEECH_REGION` ou `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Remplacement facultatif du point de terminaison Azure Speech (alias `baseUrl`).</ParamField>
    <ParamField path="speakerVoice" type="string">ShortName de la voix Azure. Par défaut `en-US-JennyNeural`. Alias hérité : `voice`.</ParamField>
    <ParamField path="lang" type="string">Code de langue SSML. Par défaut `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">`X-Microsoft-OutputFormat` Azure pour l’audio standard. Par défaut `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">`X-Microsoft-OutputFormat` Azure pour la sortie note vocale. Par défaut `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Se rabat sur `ELEVENLABS_API_KEY` ou `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Identifiant du modèle (p. ex. `eleven_multilingual_v2`, `eleven_v3`).</ParamField>
    <ParamField path="speakerVoiceId" type="string">Identifiant de voix ElevenLabs. Alias hérité : `voiceId`.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (chacun `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = normal).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Mode de normalisation du texte.</ParamField>
    <ParamField path="languageCode" type="string">ISO 639-1 à 2 lettres (p. ex. `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Entier `0..4294967295` pour un déterminisme au mieux.</ParamField>
    <ParamField path="baseUrl" type="string">Remplace l’URL de base de l’API ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Se rabat sur `GEMINI_API_KEY` / `GOOGLE_API_KEY`. Si omis, TTS peut réutiliser `models.providers.google.apiKey` avant le recours à l’environnement.</ParamField>
    <ParamField path="model" type="string">Modèle TTS Gemini. Par défaut `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="speakerVoice" type="string">Nom de voix Gemini prédéfinie. Par défaut `Kore`. Alias hérités : `voiceName`, `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Invite de style en langage naturel ajoutée avant le texte prononcé.</ParamField>
    <ParamField path="speakerName" type="string">Libellé facultatif du locuteur ajouté avant le texte prononcé lorsque votre invite utilise un locuteur nommé.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Définissez sur `audio-profile-v1` pour encapsuler les champs d’invite de la persona active dans une structure d’invite TTS Gemini déterministe.</ParamField>
    <ParamField path="personaPrompt" type="string">Texte d’invite de persona supplémentaire propre à Google, ajouté aux Notes du réalisateur du modèle.</ParamField>
    <ParamField path="baseUrl" type="string">Seul `https://generativelanguage.googleapis.com` est accepté.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Env. : `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Par défaut `https://api.gradium.ai`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Par défaut Emma (`YTpq7expH9539ERJ`). Alias hérité : `voiceId`.</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Principal Inworld

    <ParamField path="apiKey" type="string">Env. : `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Par défaut `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Par défaut `inworld-tts-1.5-max`. Aussi : `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Par défaut `Sarah`. Alias hérité : `voiceId`.</ParamField>
    <ParamField path="temperature" type="number">Température d’échantillonnage `0..2`.</ParamField>

  </Accordion>

  <Accordion title="CLI local (tts-local-cli)">
    <ParamField path="command" type="string">Exécutable local ou chaîne de commande pour le TTS CLI.</ParamField>
    <ParamField path="args" type="string[]">Arguments de commande. Prend en charge les espaces réservés `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Format de sortie CLI attendu. Par défaut `mp3` pour les pièces jointes audio.</ParamField>
    <ParamField path="timeoutMs" type="number">Délai d’expiration de la commande en millisecondes. Par défaut `120000`.</ParamField>
    <ParamField path="cwd" type="string">Répertoire de travail facultatif de la commande.</ParamField>
    <ParamField path="env" type="Record<string, string>">Remplacements d’environnement facultatifs pour la commande.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (sans clé API)">
    <ParamField path="enabled" type="boolean" default="true">Autoriser l’utilisation de la synthèse vocale Microsoft.</ParamField>
    <ParamField path="speakerVoice" type="string">Nom de voix neuronale Microsoft (par ex. `en-US-MichelleNeural`). Alias hérité : `voice`.</ParamField>
    <ParamField path="lang" type="string">Code de langue (par ex. `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Format de sortie Microsoft. Par défaut `audio-24khz-48kbitrate-mono-mp3`. Tous les formats ne sont pas pris en charge par le transport groupé basé sur Edge.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Chaînes de pourcentage (par ex. `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Écrire les sous-titres JSON à côté du fichier audio.</ParamField>
    <ParamField path="proxy" type="string">URL du proxy pour les requêtes de synthèse vocale Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Remplacement du délai d’expiration de la requête (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Alias hérité. Exécutez `openclaw doctor --fix` pour réécrire la configuration persistée vers `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Se rabat sur `MINIMAX_API_KEY`. Authentification Token Plan via `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` ou `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Par défaut `https://api.minimax.io`. Env. : `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Par défaut `speech-2.8-hd`. Env. : `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Par défaut `English_expressive_narrator`. Env. : `MINIMAX_TTS_VOICE_ID`. Alias hérité : `voiceId`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Par défaut `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Par défaut `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Entier `-12..12`. Par défaut `0`. Les valeurs fractionnaires sont tronquées avant la requête.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Se rabat sur `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Identifiant du modèle TTS OpenAI (par ex. `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="speakerVoice" type="string">Nom de la voix (par ex. `alloy`, `cedar`). Alias hérité : `voice`.</ParamField>
    <ParamField path="instructions" type="string">Champ OpenAI `instructions` explicite. Lorsqu’il est défini, les champs d’invite de persona ne sont **pas** mappés automatiquement.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">Champs JSON supplémentaires fusionnés dans les corps de requête `/audio/speech` après les champs TTS OpenAI générés. Utilisez ceci pour les points de terminaison compatibles OpenAI, tels que Kokoro, qui exigent des clés propres au fournisseur comme `lang` ; les clés de prototype non sûres sont ignorées.</ParamField>
    <ParamField path="baseUrl" type="string">
      Remplace le point de terminaison TTS OpenAI. Ordre de résolution : configuration → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Les valeurs non définies par défaut sont traitées comme des points de terminaison TTS compatibles OpenAI ; les noms de modèle et de voix personnalisés sont donc acceptés.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Env. : `OPENROUTER_API_KEY`. Peut réutiliser `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">Par défaut `https://openrouter.ai/api/v1`. L’URL héritée `https://openrouter.ai/v1` est normalisée.</ParamField>
    <ParamField path="model" type="string">Par défaut `hexgrad/kokoro-82m`. Alias : `modelId`.</ParamField>
    <ParamField path="speakerVoice" type="string">Par défaut `af_alloy`. Alias hérités : `voice`, `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Par défaut `mp3`.</ParamField>
    <ParamField path="speed" type="number">Remplacement de vitesse natif du fournisseur.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Env. : `VOLCENGINE_TTS_API_KEY` ou `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Par défaut `seed-tts-1.0`. Env. : `VOLCENGINE_TTS_RESOURCE_ID`. Utilisez `seed-tts-2.0` lorsque votre projet dispose du droit TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">En-tête de clé d’application. Par défaut `aGjiRDfUWi`. Env. : `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Remplace le point de terminaison HTTP Seed Speech TTS. Env. : `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="speakerVoice" type="string">Type de voix. Par défaut `en_female_anna_mars_bigtts`. Env. : `VOLCENGINE_TTS_VOICE`. Alias hérité : `voice`.</ParamField>
    <ParamField path="speedRatio" type="number">Ratio de vitesse natif du fournisseur.</ParamField>
    <ParamField path="emotion" type="string">Étiquette d’émotion native du fournisseur.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Champs hérités de la console Volcengine Speech. Env. : `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (par défaut `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Env. : `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Par défaut `https://api.x.ai/v1`. Env. : `XAI_BASE_URL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Par défaut `eve`. Voix actives : `ara`, `eve`, `leo`, `rex`, `sal`, `una`. Alias hérité : `voiceId`.</ParamField>
    <ParamField path="language" type="string">Code de langue BCP-47 ou `auto`. Par défaut `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Par défaut `mp3`.</ParamField>
    <ParamField path="speed" type="number">Remplacement de vitesse natif du fournisseur.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Env. : `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Par défaut `https://api.xiaomimimo.com/v1`. Env. : `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Par défaut `mimo-v2.5-tts`. Env. : `XIAOMI_TTS_MODEL`. Prend aussi en charge `mimo-v2-tts` et `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="speakerVoice" type="string">Par défaut `mimo_default` pour les modèles à voix prédéfinie. Env. : `XIAOMI_TTS_VOICE`. Alias hérité : `voice`. Non envoyé pour `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Par défaut `mp3`. Env. : `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Instruction de style facultative en langage naturel envoyée comme message utilisateur ; elle n’est pas prononcée. Pour `mimo-v2.5-tts-voicedesign`, il s’agit de l’invite de conception de voix ; OpenClaw fournit une valeur par défaut lorsqu’elle est omise.</ParamField>
  </Accordion>
</AccordionGroup>

## Outil d’agent

L’outil `tts` convertit du texte en parole et renvoie une pièce jointe audio pour
la livraison de la réponse. Sur Feishu, Matrix, Telegram et WhatsApp, l’audio est
livré comme message vocal plutôt que comme pièce jointe de fichier. Feishu et
WhatsApp peuvent transcoder la sortie TTS non Opus sur ce chemin lorsque `ffmpeg` est
disponible.

WhatsApp envoie l’audio via Baileys comme note vocale PTT (`audio` avec
`ptt: true`) et envoie le texte visible **séparément** de l’audio PTT, car
les clients n’affichent pas systématiquement les légendes sur les notes vocales.

L’outil accepte les champs facultatifs `channel` et `timeoutMs` ; `timeoutMs` est un
délai d’expiration de requête fournisseur par appel en millisecondes. Les valeurs par appel remplacent
`messages.tts.timeoutMs` ; les délais d’expiration TTS configurés remplacent toute valeur par défaut
de fournisseur définie par un plugin.

## RPC Gateway

| Méthode           | Objectif                                 |
| ----------------- | ---------------------------------------- |
| `tts.status`      | Lire l’état TTS actuel et la dernière tentative. |
| `tts.enable`      | Définir la préférence automatique locale sur `always`. |
| `tts.disable`     | Définir la préférence automatique locale sur `off`. |
| `tts.convert`     | Conversion ponctuelle texte → audio.     |
| `tts.setProvider` | Définir la préférence locale de fournisseur. |
| `tts.setPersona`  | Définir la préférence locale de persona. |
| `tts.providers`   | Lister les fournisseurs configurés et leur état. |

## Liens de service

- [Guide de synthèse vocale OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [Référence de l’API Audio OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [Synthèse vocale REST Azure Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Fournisseur Azure Speech](/fr/providers/azure-speech)
- [Synthèse vocale ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Authentification ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/fr/providers/gradium)
- [API Inworld TTS](https://docs.inworld.ai/tts/tts)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [API HTTP TTS Volcengine](/fr/providers/volcengine#text-to-speech)
- [Synthèse vocale Xiaomi MiMo](/fr/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formats de sortie Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [Synthèse vocale xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Connexe

- [Vue d’ensemble des médias](/fr/tools/media-overview)
- [Génération de musique](/fr/tools/music-generation)
- [Génération de vidéo](/fr/tools/video-generation)
- [Commandes slash](/fr/tools/slash-commands)
- [Plugin d’appel vocal](/fr/plugins/voice-call)
