---
read_when:
    - Activer la synthèse vocale pour les réponses
    - Configurer un fournisseur TTS, une chaîne de repli ou une persona
    - Utiliser des commandes ou directives /tts
sidebarTitle: Text to speech (TTS)
summary: Synthèse vocale pour les réponses sortantes — fournisseurs, personas, commandes slash et sortie par canal
title: Synthèse vocale
x-i18n:
    generated_at: "2026-04-26T11:40:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 199a84fde8f7fd380667a39c448ac8158e0aab071b77be41b87431d10d8b4219
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw peut convertir les réponses sortantes en audio via **13 fournisseurs de synthèse vocale**
et envoyer des messages vocaux natifs sur Feishu, Matrix, Telegram et WhatsApp,
des pièces jointes audio partout ailleurs, ainsi que des flux PCM/Ulaw pour la téléphonie et Talk.

## Démarrage rapide

<Steps>
  <Step title="Choisir un fournisseur">
    OpenAI et ElevenLabs sont les options hébergées les plus fiables. Microsoft et
    Local CLI fonctionnent sans clé d’API. Consultez la [matrice des fournisseurs](#supported-providers)
    pour la liste complète.
  </Step>
  <Step title="Définir la clé d’API">
    Exportez la variable d’environnement pour votre fournisseur (par exemple `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft et Local CLI n’ont pas besoin de clé.
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
L’auto-TTS est **désactivé** par défaut. Lorsque `messages.tts.provider` n’est pas défini,
OpenClaw choisit le premier fournisseur configuré selon l’ordre de sélection automatique du registre.
</Note>

## Fournisseurs pris en charge

| Fournisseur      | Auth                                                                                                             | Notes                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Azure Speech** | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (aussi `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)        | Sortie native en note vocale Ogg/Opus et téléphonie.                    |
| **ElevenLabs**   | `ELEVENLABS_API_KEY` ou `XI_API_KEY`                                                                             | Clonage de voix, multilingue, déterministe via `seed`.                  |
| **Google Gemini** | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`                                                                            | API TTS Gemini ; compatible avec les personas via `promptTemplate: "audio-profile-v1"`. |
| **Gradium**      | `GRADIUM_API_KEY`                                                                                                | Sortie en note vocale et téléphonie.                                    |
| **Inworld**      | `INWORLD_API_KEY`                                                                                                | API TTS en streaming. Note vocale Opus native et téléphonie PCM.        |
| **Local CLI**    | none                                                                                                             | Exécute une commande TTS locale configurée.                             |
| **Microsoft**    | none                                                                                                             | TTS neuronal public Edge via `node-edge-tts`. Best-effort, sans SLA.    |
| **MiniMax**      | `MINIMAX_API_KEY` (ou Token Plan : `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)   | API T2A v2. Par défaut : `speech-2.8-hd`.                               |
| **OpenAI**       | `OPENAI_API_KEY`                                                                                                 | Aussi utilisé pour l’auto-résumé ; prend en charge la persona `instructions`. |
| **OpenRouter**   | `OPENROUTER_API_KEY` (peut réutiliser `models.providers.openrouter.apiKey`)                                     | Modèle par défaut `hexgrad/kokoro-82m`.                                 |
| **Volcengine**   | `VOLCENGINE_TTS_API_KEY` ou `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/jeton hérité : `VOLCENGINE_TTS_APPID`/`_TOKEN`) | API HTTP BytePlus Seed Speech.                                          |
| **Vydra**        | `VYDRA_API_KEY`                                                                                                  | Fournisseur partagé d’images, de vidéo et de voix.                      |
| **xAI**          | `XAI_API_KEY`                                                                                                    | TTS batch xAI. La note vocale Opus native n’est **pas** prise en charge. |
| **Xiaomi MiMo**  | `XIAOMI_API_KEY`                                                                                                 | TTS MiMo via les chat completions Xiaomi.                               |

Si plusieurs fournisseurs sont configurés, le fournisseur sélectionné est utilisé en premier et les
autres servent d’options de repli. L’auto-résumé utilise `summaryModel` (ou
`agents.defaults.model.primary`), donc ce fournisseur doit également être authentifié
si vous laissez les résumés activés.

<Warning>
Le fournisseur **Microsoft** intégré utilise le service TTS neuronal en ligne de Microsoft Edge
via `node-edge-tts`. Il s’agit d’un service web public sans
SLA ni quota publiés — considérez-le comme du best-effort. L’identifiant de fournisseur hérité `edge` est
normalisé en `microsoft` et `openclaw doctor --fix` réécrit la
configuration persistée ; les nouvelles configurations doivent toujours utiliser `microsoft`.
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
          voice: "en-US-JennyNeural",
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
          voiceId: "EXAVITQu4vr4xnSDxMaL",
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
          voiceName: "Kore",
          // Invites de style en langage naturel facultatives :
          // audioProfile: "Parlez sur un ton calme, comme un animateur de podcast.",
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
          voiceId: "YTpq7expH9539ERJ",
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
          voiceId: "Sarah",
          temperature: 0.7,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Local CLI">
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
          voice: "en-US-MichelleNeural",
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
          voiceId: "English_expressive_narrator",
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
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
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
          voice: "af_alloy",
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
          voice: "en_female_anna_mars_bigtts",
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
          voiceId: "eve",
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
          voice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

### Remplacements de voix par agent

Utilisez `agents.list[].tts` lorsqu’un agent doit parler avec un fournisseur,
une voix, un modèle, une persona ou un mode auto-TTS différent. Le bloc de l’agent est fusionné en profondeur par-dessus
`messages.tts`, de sorte que les identifiants du fournisseur peuvent rester dans la configuration globale du fournisseur :

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
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

Pour fixer une persona par agent, définissez `agents.list[].tts.persona` en plus de la
configuration du fournisseur — elle remplace `messages.tts.persona` global pour cet agent uniquement.

L’ordre de priorité pour les réponses automatiques, `/tts audio`, `/tts status`, et l’outil d’agent
`tts` est :

1. `messages.tts`
2. `agents.list[].tts` actif
3. remplacement de canal, lorsque le canal prend en charge `channels.<channel>.tts`
4. remplacement de compte, lorsque le canal transmet `channels.<channel>.accounts.<id>.tts`
5. préférences locales `/tts` pour cet hôte
6. directives inline `[[tts:...]]` lorsque les [remplacements pilotés par le modèle](#model-driven-directives) sont activés

Les remplacements de canal et de compte utilisent la même structure que `messages.tts` et
sont fusionnés en profondeur par-dessus les couches précédentes, de sorte que les identifiants de fournisseur partagés peuvent rester dans
`messages.tts` tandis qu’un canal ou un compte de bot ne change que la voix, le modèle, la persona,
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
              openai: { voice: "shimmer" },
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
entre les fournisseurs. Elle peut préférer un fournisseur, définir une intention de prompt
neutre vis-à-vis du fournisseur et transporter des liaisons spécifiques au fournisseur pour les voix,
modèles, modèles de prompt, seeds et paramètres de voix.

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
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL", modelId: "eleven_multilingual_v2" },
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
          description: "Narrateur majordome britannique, sec mais chaleureux.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "Un brillant majordome britannique. Sec, spirituel, chaleureux, charmant, émotionnellement expressif, jamais générique.",
            scene: "Un bureau calme tard dans la nuit. Narration en proximité micro pour un opérateur de confiance.",
            sampleContext: "Le locuteur répond à une demande technique privée avec une assurance concise et une chaleur sèche.",
            style: "Raffiné, sobre, légèrement amusé.",
            accent: "Anglais britannique.",
            pacing: "Mesuré, avec de courtes pauses dramatiques.",
            constraints: ["Ne lisez pas les valeurs de configuration à voix haute.", "N’expliquez pas la persona."],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              voiceName: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", voice: "cedar" },
            elevenlabs: {
              voiceId: "voice_id",
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

La persona active est sélectionnée de façon déterministe :

1. préférence locale `/tts persona <id>`, si définie.
2. `messages.tts.persona`, si défini.
3. aucune persona.

La sélection du fournisseur suit une logique priorité à l’explicite :

1. remplacements directs (CLI, Gateway, Talk, directives TTS autorisées).
2. préférence locale `/tts provider <id>`.
3. `provider` de la persona active.
4. `messages.tts.provider`.
5. sélection automatique du registre.

Pour chaque tentative de fournisseur, OpenClaw fusionne les configurations dans cet ordre :

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. remplacements de requête approuvés
4. remplacements de directives TTS émises par le modèle et autorisées

### Comment les fournisseurs utilisent les prompts de persona

Les champs de prompt de persona (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) sont **neutres vis-à-vis du fournisseur**. Chaque fournisseur décide comment
les utiliser :

<AccordionGroup>
  <Accordion title="Google Gemini">
    Encapsule les champs de prompt de persona dans une structure de prompt TTS Gemini **uniquement lorsque**
    la configuration Google effective du fournisseur définit `promptTemplate: "audio-profile-v1"`
    ou `personaPrompt`. Les anciens champs `audioProfile` et `speakerName` sont
    toujours préfixés comme texte de prompt spécifique à Google. Les balises audio inline telles que
    `[whispers]` ou `[laughs]` à l’intérieur d’un bloc `[[tts:text]]` sont conservées
    dans la transcription Gemini ; OpenClaw ne génère pas ces balises.
  </Accordion>
  <Accordion title="OpenAI">
    Associe les champs de prompt de persona au champ `instructions` de la requête **uniquement lorsque**
    aucune instruction explicite OpenAI `instructions` n’est configurée. Une valeur explicite de `instructions`
    a toujours priorité.
  </Accordion>
  <Accordion title="Autres fournisseurs">
    Utilisent uniquement les liaisons de persona spécifiques au fournisseur sous
    `personas.<id>.providers.<provider>`. Les champs de prompt de persona sont ignorés
    sauf si le fournisseur implémente son propre mappage prompt-de-persona.
  </Accordion>
</AccordionGroup>

### Politique de repli

`fallbackPolicy` contrôle le comportement lorsqu’une persona n’a **aucune liaison** pour le
fournisseur tenté :

| Politique          | Comportement                                                                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `preserve-persona` | **Par défaut.** Les champs de prompt neutres vis-à-vis du fournisseur restent disponibles ; le fournisseur peut les utiliser ou les ignorer.       |
| `provider-defaults` | La persona est omise de la préparation du prompt pour cette tentative ; le fournisseur utilise ses valeurs neutres par défaut tandis que le repli vers d’autres fournisseurs continue. |
| `fail`             | Ignore cette tentative de fournisseur avec `reasonCode: "not_configured"` et `personaBinding: "missing"`. Les fournisseurs de repli sont toujours essayés. |

La requête TTS entière n’échoue que si **tous** les fournisseurs tentés sont ignorés
ou échouent.

## Directives pilotées par le modèle

Par défaut, l’assistant **peut** émettre des directives `[[tts:...]]` pour remplacer
la voix, le modèle ou la vitesse pour une seule réponse, ainsi qu’un bloc facultatif
`[[tts:text]]...[[/tts:text]]` pour des indices expressifs qui ne doivent apparaître
que dans l’audio :

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Lorsque `messages.tts.auto` vaut `"tagged"`, des **directives sont requises** pour déclencher
l’audio. La diffusion en blocs supprime les directives du texte visible avant que le
canal ne les voie, même lorsqu’elles sont réparties sur des blocs adjacents.

`provider=...` est ignoré sauf si `modelOverrides.allowProvider: true`. Lorsqu’une
réponse déclare `provider=...`, les autres clés de cette directive sont analysées
uniquement par ce fournisseur ; les clés non prises en charge sont supprimées et signalées comme avertissements
de directive TTS.

**Clés de directive disponibles :**

- `provider` (id de fournisseur enregistré ; nécessite `allowProvider: true`)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume MiniMax, 0–10)
- `pitch` (hauteur MiniMax entière, −12 à 12 ; les valeurs fractionnaires sont tronquées)
- `emotion` (tag d’émotion Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Désactiver complètement les remplacements pilotés par le modèle :**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Autoriser le changement de fournisseur tout en gardant les autres paramètres configurables :**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Commandes slash

Commande unique `/tts`. Sur Discord, OpenClaw enregistre aussi `/voice` parce que
`/tts` est une commande Discord intégrée — la commande texte `/tts ...` fonctionne toujours.

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
Les commandes nécessitent un expéditeur autorisé (les règles d’allowlist/propriétaire s’appliquent) et soit
`commands.text`, soit l’enregistrement natif des commandes doit être activé.
</Note>

Notes de comportement :

- `/tts on` écrit la préférence TTS locale à `always` ; `/tts off` l’écrit à `off`.
- `/tts chat on|off|default` écrit un remplacement auto-TTS à portée de session pour le chat actuel.
- `/tts persona <id>` écrit la préférence locale de persona ; `/tts persona off` l’efface.
- `/tts latest` lit la dernière réponse de l’assistant dans la transcription de la session actuelle et l’envoie une fois en audio. Il ne stocke qu’un hash de cette réponse dans l’entrée de session afin de supprimer les envois vocaux en double.
- `/tts audio` génère une réponse audio ponctuelle (n’active **pas** TTS).
- `limit` et `summary` sont stockés dans les **préférences locales**, pas dans la configuration principale.
- `/tts status` inclut des diagnostics de repli pour la dernière tentative — `Fallback: <primary> -> <used>`, `Attempts: ...`, et le détail par tentative (`provider:outcome(reasonCode) latency`).
- `/status` affiche le mode TTS actif ainsi que le fournisseur, le modèle, la voix et les métadonnées nettoyées du point de terminaison personnalisé lorsque le TTS est activé.

## Préférences par utilisateur

Les commandes slash écrivent des remplacements locaux dans `prefsPath`. La valeur par défaut est
`~/.openclaw/settings/tts.json` ; remplacez-la avec la variable d’environnement `OPENCLAW_TTS_PREFS`
ou `messages.tts.prefsPath`.

| Champ stocké | Effet                                        |
| ------------ | -------------------------------------------- |
| `auto`       | Remplacement local d’auto-TTS (`always`, `off`, …) |
| `provider`   | Remplacement local du fournisseur principal  |
| `persona`    | Remplacement local de persona                |
| `maxLength`  | Seuil de résumé (par défaut `1500` caractères) |
| `summarize`  | Bascule de résumé (par défaut `true`)        |

Ces valeurs remplacent la configuration effective de `messages.tts` plus le bloc
`agents.list[].tts` actif pour cet hôte.

## Formats de sortie (fixes)

La diffusion vocale TTS dépend des capacités du canal. Les plugins de canal indiquent
si le TTS de type vocal doit demander aux fournisseurs une cible native `voice-note` ou
conserver une synthèse `audio-file` normale et seulement marquer une sortie compatible pour la
diffusion vocale.

- **Canaux capables de gérer les notes vocales** : les réponses en note vocale préfèrent Opus (`opus_48000_64` depuis ElevenLabs, `opus` depuis OpenAI).
  - 48 kHz / 64 kb/s constitue un bon compromis pour les messages vocaux.
- **Feishu / WhatsApp** : lorsqu’une réponse en note vocale est produite en MP3/WebM/WAV/M4A
  ou dans un autre format de fichier audio probable, le plugin de canal la transcode en
  Ogg/Opus 48 kHz avec `ffmpeg` avant d’envoyer le message vocal natif. WhatsApp envoie
  le résultat via la charge utile Baileys `audio` avec `ptt: true` et
  `audio/ogg; codecs=opus`. Si la conversion échoue, Feishu reçoit le fichier
  original en pièce jointe ; l’envoi WhatsApp échoue au lieu de publier une
  charge utile PTT incompatible.
- **BlueBubbles** : conserve la synthèse du fournisseur sur le chemin audio-file normal ; les sorties MP3
  et CAF sont marquées pour l’envoi de mémos vocaux iMessage.
- **Autres canaux** : MP3 (`mp3_44100_128` depuis ElevenLabs, `mp3` depuis OpenAI).
  - 44,1 kHz / 128 kb/s correspond à l’équilibre par défaut pour la clarté de la parole.
- **MiniMax** : MP3 (modèle `speech-2.8-hd`, fréquence d’échantillonnage 32 kHz) pour les pièces jointes audio normales. Pour les cibles de note vocale annoncées par le canal, OpenClaw transcode le MP3 MiniMax en Opus 48 kHz avec `ffmpeg` avant l’envoi lorsque le canal annonce la prise en charge du transcodage.
- **Xiaomi MiMo** : MP3 par défaut, ou WAV si configuré. Pour les cibles de note vocale annoncées par le canal, OpenClaw transcode la sortie Xiaomi en Opus 48 kHz avec `ffmpeg` avant l’envoi lorsque le canal annonce la prise en charge du transcodage.
- **Local CLI** : utilise le `outputFormat` configuré. Les cibles de note vocale sont
  converties en Ogg/Opus et la sortie de téléphonie est convertie en PCM mono brut 16 kHz
  avec `ffmpeg`.
- **Google Gemini** : l’API TTS Gemini renvoie du PCM brut 24 kHz. OpenClaw l’encapsule en WAV pour les pièces jointes audio, le transcode en Opus 48 kHz pour les cibles de note vocale, et renvoie directement le PCM pour Talk/la téléphonie.
- **Gradium** : WAV pour les pièces jointes audio, Opus pour les cibles de note vocale, et `ulaw_8000` à 8 kHz pour la téléphonie.
- **Inworld** : MP3 pour les pièces jointes audio normales, `OGG_OPUS` natif pour les cibles de note vocale, et `PCM` brut à 22050 Hz pour Talk/la téléphonie.
- **xAI** : MP3 par défaut ; `responseFormat` peut être `mp3`, `wav`, `pcm`, `mulaw` ou `alaw`. OpenClaw utilise le point de terminaison batch REST TTS de xAI et renvoie une pièce jointe audio complète ; le WebSocket TTS en streaming de xAI n’est pas utilisé par ce chemin de fournisseur. Le format natif de note vocale Opus n’est pas pris en charge par ce chemin.
- **Microsoft** : utilise `microsoft.outputFormat` (par défaut `audio-24khz-48kbitrate-mono-mp3`).
  - Le transport intégré accepte un `outputFormat`, mais tous les formats ne sont pas disponibles depuis le service.
  - Les valeurs de format de sortie suivent les formats de sortie Microsoft Speech (y compris Ogg/WebM Opus).
  - `sendVoice` de Telegram accepte OGG/MP3/M4A ; utilisez OpenAI/ElevenLabs si vous avez besoin
    de messages vocaux Opus garantis.
  - Si le format de sortie Microsoft configuré échoue, OpenClaw réessaie avec MP3.

Les formats de sortie OpenAI/ElevenLabs sont fixes par canal (voir ci-dessus).

## Comportement de l’auto-TTS

Lorsque `messages.tts.auto` est activé, OpenClaw :

- Ignore le TTS si la réponse contient déjà un média ou une directive `MEDIA:`.
- Ignore les réponses très courtes (moins de 10 caractères).
- Résume les réponses longues lorsque les résumés sont activés, en utilisant
  `summaryModel` (ou `agents.defaults.model.primary`).
- Joint l’audio généré à la réponse.
- En `mode: "final"`, envoie quand même du TTS audio uniquement pour les réponses finales diffusées en streaming
  une fois le flux de texte terminé ; le média généré passe par la même normalisation
  des médias de canal que les pièces jointes de réponse normales.

Si la réponse dépasse `maxLength` et que le résumé est désactivé (ou qu’aucune clé d’API n’est disponible pour le
modèle de résumé), l’audio est ignoré et la réponse texte normale est envoyée.

```text
Réponse -> TTS activé ?
  non -> envoyer le texte
  oui -> contient un média / MEDIA: / courte ?
          oui -> envoyer le texte
          non -> longueur > limite ?
                   non -> TTS -> joindre l’audio
                   oui -> résumé activé ?
                            non -> envoyer le texte
                            oui -> résumer -> TTS -> joindre l’audio
```

## Formats de sortie par canal

| Cible                                 | Format                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | Les réponses en note vocale préfèrent **Opus** (`opus_48000_64` depuis ElevenLabs, `opus` depuis OpenAI). 48 kHz / 64 kb/s équilibre clarté et taille. |
| Autres canaux                         | **MP3** (`mp3_44100_128` depuis ElevenLabs, `mp3` depuis OpenAI). 44,1 kHz / 128 kb/s est la valeur par défaut pour la parole.      |
| Talk / téléphonie                     | **PCM** natif du fournisseur (Inworld 22050 Hz, Google 24 kHz), ou `ulaw_8000` depuis Gradium pour la téléphonie.                   |

Notes par fournisseur :

- **Transcodage Feishu / WhatsApp :** Lorsqu’une réponse en note vocale arrive en MP3/WebM/WAV/M4A, le plugin de canal la transcode en Ogg/Opus 48 kHz avec `ffmpeg`. WhatsApp envoie via Baileys avec `ptt: true` et `audio/ogg; codecs=opus`. Si la conversion échoue : Feishu revient à la pièce jointe du fichier d’origine ; l’envoi WhatsApp échoue au lieu de publier une charge utile PTT incompatible.
- **MiniMax / Xiaomi MiMo :** MP3 par défaut (32 kHz pour MiniMax `speech-2.8-hd`) ; transcodé en Opus 48 kHz pour les cibles de note vocale via `ffmpeg`.
- **Local CLI :** Utilise le `outputFormat` configuré. Les cibles de note vocale sont converties en Ogg/Opus et la sortie de téléphonie en PCM mono brut 16 kHz.
- **Google Gemini :** Renvoie du PCM brut 24 kHz. OpenClaw l’encapsule en WAV pour les pièces jointes, le transcode en Opus 48 kHz pour les cibles de note vocale, et renvoie directement le PCM pour Talk/la téléphonie.
- **Inworld :** Pièces jointes MP3, note vocale native `OGG_OPUS`, `PCM` brut 22050 Hz pour Talk/la téléphonie.
- **xAI :** MP3 par défaut ; `responseFormat` peut être `mp3|wav|pcm|mulaw|alaw`. Utilise le point de terminaison batch REST de xAI — le TTS WebSocket en streaming n’est **pas** utilisé. Le format natif de note vocale Opus n’est **pas** pris en charge.
- **Microsoft :** Utilise `microsoft.outputFormat` (par défaut `audio-24khz-48kbitrate-mono-mp3`). `sendVoice` de Telegram accepte OGG/MP3/M4A ; utilisez OpenAI/ElevenLabs si vous avez besoin de messages vocaux Opus garantis. Si le format Microsoft configuré échoue, OpenClaw réessaie avec MP3.

Les formats de sortie OpenAI et ElevenLabs sont fixes par canal comme indiqué ci-dessus.

## Référence des champs

<AccordionGroup>
  <Accordion title="messages.tts.* de niveau supérieur">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Mode auto-TTS. `inbound` n’envoie de l’audio qu’après un message vocal entrant ; `tagged` n’envoie de l’audio que lorsque la réponse inclut des directives `[[tts:...]]` ou un bloc `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Bascule héritée. `openclaw doctor --fix` la migre vers `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` inclut les réponses d’outil/bloc en plus des réponses finales.
    </ParamField>
    <ParamField path="provider" type="string">
      Id du fournisseur vocal. Lorsqu’il n’est pas défini, OpenClaw utilise le premier fournisseur configuré dans l’ordre de sélection automatique du registre. L’ancien `provider: "edge"` est réécrit en `"microsoft"` par `openclaw doctor --fix`.
    </ParamField>
    <ParamField path="persona" type="string">
      Id de la persona active depuis `personas`. Normalisé en minuscules.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Identité vocale stable. Champs : `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Voir [Personas](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Modèle économique pour l’auto-résumé ; par défaut `agents.defaults.model.primary`. Accepte `provider/model` ou un alias de modèle configuré.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Autorise le modèle à émettre des directives TTS. `enabled` vaut `true` par défaut ; `allowProvider` vaut `false` par défaut.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Paramètres gérés par le fournisseur, indexés par id de fournisseur vocal. Les anciens blocs directs (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) sont réécrits par `openclaw doctor --fix` ; ne validez que `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      Limite stricte de caractères pour l’entrée TTS. `/tts audio` échoue si elle est dépassée.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      Délai maximal de requête en millisecondes.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Remplace le chemin JSON des préférences locales (fournisseur/limite/résumé). Par défaut `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env : `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` ou `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Région Azure Speech (par ex. `eastus`). Env : `AZURE_SPEECH_REGION` ou `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Remplacement facultatif du point de terminaison Azure Speech (alias `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">ShortName de la voix Azure. Par défaut `en-US-JennyNeural`.</ParamField>
    <ParamField path="lang" type="string">Code de langue SSML. Par défaut `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">`X-Microsoft-OutputFormat` Azure pour l’audio standard. Par défaut `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">`X-Microsoft-OutputFormat` Azure pour la sortie en note vocale. Par défaut `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Revient à `ELEVENLABS_API_KEY` ou `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Id du modèle (par ex. `eleven_multilingual_v2`, `eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">Id de voix ElevenLabs.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (chacun `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = normal).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Mode de normalisation du texte.</ParamField>
    <ParamField path="languageCode" type="string">Code ISO 639-1 à 2 lettres (par ex. `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Entier `0..4294967295` pour un déterminisme best-effort.</ParamField>
    <ParamField path="baseUrl" type="string">Remplace l’URL de base de l’API ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Revient à `GEMINI_API_KEY` / `GOOGLE_API_KEY`. S’il est omis, le TTS peut réutiliser `models.providers.google.apiKey` avant le repli sur les variables d’environnement.</ParamField>
    <ParamField path="model" type="string">Modèle TTS Gemini. Par défaut `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="voiceName" type="string">Nom de voix préconstruite Gemini. Par défaut `Kore`. Alias : `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Prompt de style en langage naturel préfixé avant le texte parlé.</ParamField>
    <ParamField path="speakerName" type="string">Étiquette facultative du locuteur préfixée avant le texte parlé lorsque votre prompt utilise un locuteur nommé.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Définissez `audio-profile-v1` pour encapsuler les champs de prompt de la persona active dans une structure de prompt TTS Gemini déterministe.</ParamField>
    <ParamField path="personaPrompt" type="string">Texte de prompt de persona supplémentaire spécifique à Google ajouté aux Director's Notes du modèle.</ParamField>
    <ParamField path="baseUrl" type="string">Seule la valeur `https://generativelanguage.googleapis.com` est acceptée.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Env : `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Par défaut `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">Emma par défaut (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    <ParamField path="apiKey" type="string">Env : `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Par défaut `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Par défaut `inworld-tts-1.5-max`. Aussi : `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">Par défaut `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">Température d’échantillonnage `0..2`.</ParamField>
  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">Exécutable local ou chaîne de commande pour la CLI TTS.</ParamField>
    <ParamField path="args" type="string[]">Arguments de commande. Prend en charge les placeholders `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Format de sortie CLI attendu. Par défaut `mp3` pour les pièces jointes audio.</ParamField>
    <ParamField path="timeoutMs" type="number">Délai maximal de la commande en millisecondes. Par défaut `120000`.</ParamField>
    <ParamField path="cwd" type="string">Répertoire de travail facultatif de la commande.</ParamField>
    <ParamField path="env" type="Record<string, string>">Remplacements facultatifs de variables d’environnement pour la commande.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (sans clé d’API)">
    <ParamField path="enabled" type="boolean" default="true">Autoriser l’utilisation de la synthèse vocale Microsoft.</ParamField>
    <ParamField path="voice" type="string">Nom de voix neuronale Microsoft (par ex. `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">Code de langue (par ex. `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Format de sortie Microsoft. Par défaut `audio-24khz-48kbitrate-mono-mp3`. Tous les formats ne sont pas pris en charge par le transport intégré basé sur Edge.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Chaînes en pourcentage (par ex. `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Écrire des sous-titres JSON à côté du fichier audio.</ParamField>
    <ParamField path="proxy" type="string">URL de proxy pour les requêtes de synthèse vocale Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Remplacement du délai maximal de requête (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Alias hérité. Exécutez `openclaw doctor --fix` pour réécrire la configuration persistée vers `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Revient à `MINIMAX_API_KEY`. Auth Token Plan via `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` ou `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Par défaut `https://api.minimax.io`. Env : `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Par défaut `speech-2.8-hd`. Env : `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">Par défaut `English_expressive_narrator`. Env : `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Par défaut `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Par défaut `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Entier `-12..12`. Par défaut `0`. Les valeurs fractionnaires sont tronquées avant la requête.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Revient à `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Id du modèle TTS OpenAI (par ex. `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">Nom de voix (par ex. `alloy`, `cedar`).</ParamField>
    <ParamField path="instructions" type="string">Champ explicite OpenAI `instructions`. Lorsqu’il est défini, les champs de prompt de la persona ne sont **pas** mappés automatiquement.</ParamField>
    <ParamField path="baseUrl" type="string">
      Remplace le point de terminaison TTS OpenAI. Ordre de résolution : configuration → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Les valeurs non par défaut sont traitées comme des points de terminaison TTS compatibles OpenAI ; des noms de modèle et de voix personnalisés sont donc acceptés.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Env : `OPENROUTER_API_KEY`. Peut réutiliser `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">Par défaut `https://openrouter.ai/api/v1`. L’ancien `https://openrouter.ai/v1` est normalisé.</ParamField>
    <ParamField path="model" type="string">Par défaut `hexgrad/kokoro-82m`. Alias : `modelId`.</ParamField>
    <ParamField path="voice" type="string">Par défaut `af_alloy`. Alias : `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Par défaut `mp3`.</ParamField>
    <ParamField path="speed" type="number">Remplacement de vitesse natif du fournisseur.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Env : `VOLCENGINE_TTS_API_KEY` ou `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Par défaut `seed-tts-1.0`. Env : `VOLCENGINE_TTS_RESOURCE_ID`. Utilisez `seed-tts-2.0` lorsque votre projet dispose du droit TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">En-tête de clé d’application. Par défaut `aGjiRDfUWi`. Env : `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Remplace le point de terminaison HTTP TTS Seed Speech. Env : `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">Type de voix. Par défaut `en_female_anna_mars_bigtts`. Env : `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">Ratio de vitesse natif du fournisseur.</ParamField>
    <ParamField path="emotion" type="string">Tag d’émotion natif du fournisseur.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Champs hérités Volcengine Speech Console. Env : `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (par défaut `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Env : `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Par défaut `https://api.x.ai/v1`. Env : `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">Par défaut `eve`. Voix live : `ara`, `eve`, `leo`, `rex`, `sal`, `una`.</ParamField>
    <ParamField path="language" type="string">Code de langue BCP-47 ou `auto`. Par défaut `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Par défaut `mp3`.</ParamField>
    <ParamField path="speed" type="number">Remplacement de vitesse natif du fournisseur.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Env : `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Par défaut `https://api.xiaomimimo.com/v1`. Env : `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Par défaut `mimo-v2.5-tts`. Env : `XIAOMI_TTS_MODEL`. Prend aussi en charge `mimo-v2-tts`.</ParamField>
    <ParamField path="voice" type="string">Par défaut `mimo_default`. Env : `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Par défaut `mp3`. Env : `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Instruction de style facultative en langage naturel envoyée comme message utilisateur ; elle n’est pas prononcée.</ParamField>
  </Accordion>
</AccordionGroup>

## Outil d’agent

L’outil `tts` convertit du texte en parole et renvoie une pièce jointe audio pour
l’envoi de la réponse. Sur Feishu, Matrix, Telegram et WhatsApp, l’audio est
envoyé comme message vocal plutôt que comme pièce jointe de fichier. Feishu et
WhatsApp peuvent transcoder la sortie TTS non-Opus sur ce chemin lorsque `ffmpeg` est
disponible.

WhatsApp envoie l’audio via Baileys comme note vocale PTT (`audio` avec
`ptt: true`) et envoie le texte visible **séparément** de l’audio PTT parce que
les clients n’affichent pas toujours correctement les légendes sur les notes vocales.

L’outil accepte des champs facultatifs `channel` et `timeoutMs` ; `timeoutMs` est un
délai maximal de requête fournisseur par appel, en millisecondes.

## RPC Gateway

| Méthode           | Objectif                                 |
| ----------------- | ---------------------------------------- |
| `tts.status`      | Lire l’état TTS actuel et la dernière tentative. |
| `tts.enable`      | Définir la préférence auto locale sur `always`.   |
| `tts.disable`     | Définir la préférence auto locale sur `off`.      |
| `tts.convert`     | Conversion ponctuelle texte → audio.     |
| `tts.setProvider` | Définir la préférence locale du fournisseur.      |
| `tts.setPersona`  | Définir la préférence locale de persona.          |
| `tts.providers`   | Lister les fournisseurs configurés et leur état.  |

## Liens de service

- [Guide OpenAI de synthèse vocale](https://platform.openai.com/docs/guides/text-to-speech)
- [Référence de l’API Audio OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [Synthèse vocale REST Azure Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Fournisseur Azure Speech](/fr/providers/azure-speech)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Authentification ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/fr/providers/gradium)
- [API TTS Inworld](https://docs.inworld.ai/tts/tts)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [API HTTP TTS Volcengine](/fr/providers/volcengine#text-to-speech)
- [Synthèse vocale Xiaomi MiMo](/fr/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formats de sortie Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [Synthèse vocale xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Liens associés

- [Vue d’ensemble des médias](/fr/tools/media-overview)
- [Génération de musique](/fr/tools/music-generation)
- [Génération de vidéo](/fr/tools/video-generation)
- [Commandes slash](/fr/tools/slash-commands)
- [Plugin d’appel vocal](/fr/plugins/voice-call)
