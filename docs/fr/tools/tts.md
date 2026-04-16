---
read_when:
    - Activation de la synthèse vocale pour les réponses
    - Configuration des fournisseurs TTS ou des limites
    - Utilisation des commandes `/tts`
summary: Synthèse vocale (TTS) pour les réponses sortantes
title: Synthèse vocale
x-i18n:
    generated_at: "2026-04-16T06:56:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: de7c1dc8831c1ba307596afd48cb4d36f844724887a13b17e35f41ef5174a86f
    source_path: tools/tts.md
    workflow: 15
---

# Synthèse vocale (TTS)

OpenClaw peut convertir les réponses sortantes en audio à l’aide d’ElevenLabs, Google Gemini, Microsoft, MiniMax ou OpenAI.
Cela fonctionne partout où OpenClaw peut envoyer de l’audio.

## Services pris en charge

- **ElevenLabs** (fournisseur principal ou de secours)
- **Google Gemini** (fournisseur principal ou de secours ; utilise la synthèse vocale TTS de l’API Gemini)
- **Microsoft** (fournisseur principal ou de secours ; l’implémentation groupée actuelle utilise `node-edge-tts`)
- **MiniMax** (fournisseur principal ou de secours ; utilise l’API T2A v2)
- **OpenAI** (fournisseur principal ou de secours ; également utilisé pour les résumés)

### Remarques sur la synthèse vocale Microsoft

Le fournisseur de synthèse vocale Microsoft groupé utilise actuellement le service
TTS neuronal en ligne de Microsoft Edge via la bibliothèque `node-edge-tts`. Il
s’agit d’un service hébergé (et non local), qui utilise les points de terminaison de Microsoft,
et ne nécessite pas de clé API.
`node-edge-tts` expose des options de configuration vocale et des formats de sortie, mais
toutes les options ne sont pas prises en charge par le service. L’ancienne configuration et les entrées de directive
utilisant `edge` fonctionnent toujours et sont normalisées en `microsoft`.

Comme cette voie repose sur un service web public sans SLA ni quota publiés,
considérez-la comme du best-effort. Si vous avez besoin de limites garanties et d’un support,
utilisez OpenAI ou ElevenLabs.

## Clés facultatives

Si vous souhaitez utiliser OpenAI, ElevenLabs, Google Gemini ou MiniMax :

- `ELEVENLABS_API_KEY` (ou `XI_API_KEY`)
- `GEMINI_API_KEY` (ou `GOOGLE_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`

La synthèse vocale Microsoft ne nécessite **pas** de clé API.

Si plusieurs fournisseurs sont configurés, le fournisseur sélectionné est utilisé en premier et les autres servent d’options de secours.
Le résumé automatique utilise le `summaryModel` configuré (ou `agents.defaults.model.primary`),
donc ce fournisseur doit également être authentifié si vous activez les résumés.

## Liens des services

- [Guide OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Référence de l’API Audio OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Authentification ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formats de sortie Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## Est-ce activé par défaut ?

Non. L’auto‑TTS est **désactivé** par défaut. Activez-le dans la configuration avec
`messages.tts.auto` ou localement avec `/tts on`.

Lorsque `messages.tts.provider` n’est pas défini, OpenClaw choisit le premier
fournisseur de synthèse vocale configuré selon l’ordre de sélection automatique du registre.

## Configuration

La configuration TTS se trouve sous `messages.tts` dans `openclaw.json`.
Le schéma complet figure dans [Configuration de Gateway](/fr/gateway/configuration).

### Configuration minimale (activation + fournisseur)

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

### OpenAI principal avec ElevenLabs en secours

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      providers: {
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
      },
    },
  },
}
```

### Microsoft principal (sans clé API)

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
          rate: "+10%",
          pitch: "-5%",
        },
      },
    },
  },
}
```

### MiniMax principal

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "minimax_api_key",
          baseUrl: "https://api.minimax.io",
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

### Google Gemini principal

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "gemini_api_key",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

La synthèse vocale TTS de Google Gemini utilise le chemin de clé API Gemini. Une clé API Google Cloud Console
restreinte à l’API Gemini est valide ici, et c’est le même type de clé utilisé
par le fournisseur groupé de génération d’images Google. L’ordre de résolution est
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY`.

### Désactiver la synthèse vocale Microsoft

```json5
{
  messages: {
    tts: {
      providers: {
        microsoft: {
          enabled: false,
        },
      },
    },
  },
}
```

### Limites personnalisées + chemin des préférences

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
    },
  },
}
```

### Répondre uniquement avec de l’audio après un message vocal entrant

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### Désactiver le résumé automatique pour les réponses longues

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

Puis exécutez :

```
/tts summary off
```

### Remarques sur les champs

- `auto` : mode auto‑TTS (`off`, `always`, `inbound`, `tagged`).
  - `inbound` envoie de l’audio uniquement après un message vocal entrant.
  - `tagged` envoie de l’audio uniquement lorsque la réponse inclut des directives `[[tts:key=value]]` ou un bloc `[[tts:text]]...[[/tts:text]]`.
- `enabled` : bascule héritée (doctor la migre vers `auto`).
- `mode` : `"final"` (par défaut) ou `"all"` (inclut les réponses d’outil/de bloc).
- `provider` : identifiant du fournisseur vocal tel que `"elevenlabs"`, `"google"`, `"microsoft"`, `"minimax"` ou `"openai"` (le secours est automatique).
- Si `provider` n’est **pas défini**, OpenClaw utilise le premier fournisseur vocal configuré selon l’ordre de sélection automatique du registre.
- L’ancien `provider: "edge"` fonctionne toujours et est normalisé en `microsoft`.
- `summaryModel` : modèle économique facultatif pour le résumé automatique ; par défaut `agents.defaults.model.primary`.
  - Accepte `provider/model` ou un alias de modèle configuré.
- `modelOverrides` : permet au modèle d’émettre des directives TTS (activé par défaut).
  - `allowProvider` vaut `false` par défaut (le changement de fournisseur est opt-in).
- `providers.<id>` : paramètres propres au fournisseur, indexés par identifiant de fournisseur vocal.
- Les anciens blocs de fournisseur directs (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) sont migrés automatiquement vers `messages.tts.providers.<id>` au chargement.
- `maxTextLength` : limite stricte pour l’entrée TTS (caractères). `/tts audio` échoue si elle est dépassée.
- `timeoutMs` : délai d’expiration de la requête (ms).
- `prefsPath` : remplace le chemin JSON local des préférences (fournisseur/limite/résumé).
- Les valeurs `apiKey` se replient sur les variables d’environnement (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl` : remplace l’URL de base de l’API ElevenLabs.
- `providers.openai.baseUrl` : remplace le point de terminaison TTS OpenAI.
  - Ordre de résolution : `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Les valeurs non par défaut sont traitées comme des points de terminaison TTS compatibles OpenAI, donc les noms de modèle et de voix personnalisés sont acceptés.
- `providers.elevenlabs.voiceSettings` :
  - `stability`, `similarityBoost`, `style` : `0..1`
  - `useSpeakerBoost` : `true|false`
  - `speed` : `0.5..2.0` (1.0 = normal)
- `providers.elevenlabs.applyTextNormalization` : `auto|on|off`
- `providers.elevenlabs.languageCode` : ISO 639-1 à 2 lettres (par ex. `en`, `de`)
- `providers.elevenlabs.seed` : entier `0..4294967295` (déterminisme au mieux)
- `providers.minimax.baseUrl` : remplace l’URL de base de l’API MiniMax (par défaut `https://api.minimax.io`, env : `MINIMAX_API_HOST`).
- `providers.minimax.model` : modèle TTS (par défaut `speech-2.8-hd`, env : `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId` : identifiant de voix (par défaut `English_expressive_narrator`, env : `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed` : vitesse de lecture `0.5..2.0` (par défaut 1.0).
- `providers.minimax.vol` : volume `(0, 10]` (par défaut 1.0 ; doit être supérieur à 0).
- `providers.minimax.pitch` : décalage de hauteur `-12..12` (par défaut 0).
- `providers.google.model` : modèle TTS Gemini (par défaut `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName` : nom de voix préconstruit Gemini (par défaut `Kore` ; `voice` est également accepté).
- `providers.google.baseUrl` : remplace l’URL de base de l’API Gemini. Seul `https://generativelanguage.googleapis.com` est accepté.
  - Si `messages.tts.providers.google.apiKey` est omis, TTS peut réutiliser `models.providers.google.apiKey` avant le repli sur l’environnement.
- `providers.microsoft.enabled` : autorise l’utilisation de la synthèse vocale Microsoft (par défaut `true` ; sans clé API).
- `providers.microsoft.voice` : nom de voix neurale Microsoft (par ex. `en-US-MichelleNeural`).
- `providers.microsoft.lang` : code langue (par ex. `en-US`).
- `providers.microsoft.outputFormat` : format de sortie Microsoft (par ex. `audio-24khz-48kbitrate-mono-mp3`).
  - Voir les formats de sortie Microsoft Speech pour les valeurs valides ; tous les formats ne sont pas pris en charge par le transport groupé basé sur Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume` : chaînes de pourcentage (par ex. `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles` : écrit des sous-titres JSON à côté du fichier audio.
- `providers.microsoft.proxy` : URL de proxy pour les requêtes de synthèse vocale Microsoft.
- `providers.microsoft.timeoutMs` : remplace le délai d’expiration de la requête (ms).
- `edge.*` : alias hérité pour les mêmes paramètres Microsoft.

## Remplacements pilotés par le modèle (activés par défaut)

Par défaut, le modèle **peut** émettre des directives TTS pour une seule réponse.
Lorsque `messages.tts.auto` est `tagged`, ces directives sont nécessaires pour déclencher l’audio.

Lorsqu’il est activé, le modèle peut émettre des directives `[[tts:...]]` pour remplacer la voix
pour une seule réponse, ainsi qu’un bloc facultatif `[[tts:text]]...[[/tts:text]]` pour
fournir des balises expressives (rire, indications de chant, etc.) qui ne doivent apparaître que dans
l’audio.

Les directives `provider=...` sont ignorées sauf si `modelOverrides.allowProvider: true`.

Exemple de charge utile de réponse :

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Clés de directive disponibles (lorsqu’activées) :

- `provider` (identifiant de fournisseur vocal enregistré, par exemple `openai`, `elevenlabs`, `google`, `minimax` ou `microsoft` ; nécessite `allowProvider: true`)
- `voice` (voix OpenAI), `voiceName` / `voice_name` / `google_voice` (voix Google), ou `voiceId` (ElevenLabs / MiniMax)
- `model` (modèle TTS OpenAI, identifiant de modèle ElevenLabs ou modèle MiniMax) ou `google_model` (modèle TTS Google)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume MiniMax, 0-10)
- `pitch` (hauteur MiniMax, -12 à 12)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Désactiver tous les remplacements du modèle :

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
```

Liste d’autorisation facultative (activer le changement de fournisseur tout en conservant les autres réglages configurables) :

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: true,
        allowSeed: false,
      },
    },
  },
}
```

## Préférences par utilisateur

Les commandes slash écrivent des remplacements locaux dans `prefsPath` (par défaut :
`~/.openclaw/settings/tts.json`, remplaçable avec `OPENCLAW_TTS_PREFS` ou
`messages.tts.prefsPath`).

Champs stockés :

- `enabled`
- `provider`
- `maxLength` (seuil de résumé ; 1500 caractères par défaut)
- `summarize` (`true` par défaut)

Ils remplacent `messages.tts.*` pour cet hôte.

## Formats de sortie (fixes)

- **Feishu / Matrix / Telegram / WhatsApp** : message vocal Opus (`opus_48000_64` depuis ElevenLabs, `opus` depuis OpenAI).
  - 48 kHz / 64 kb/s offre un bon compromis pour les messages vocaux.
- **Autres canaux** : MP3 (`mp3_44100_128` depuis ElevenLabs, `mp3` depuis OpenAI).
  - 44,1 kHz / 128 kb/s correspond à l’équilibre par défaut pour la clarté de la parole.
- **MiniMax** : MP3 (modèle `speech-2.8-hd`, fréquence d’échantillonnage de 32 kHz). Le format note vocale n’est pas pris en charge nativement ; utilisez OpenAI ou ElevenLabs pour des messages vocaux Opus garantis.
- **Google Gemini** : la synthèse vocale TTS de l’API Gemini renvoie du PCM brut à 24 kHz. OpenClaw l’encapsule dans du WAV pour les pièces jointes audio et renvoie directement du PCM pour Talk/la téléphonie. Le format natif de note vocale Opus n’est pas pris en charge par cette voie.
- **Microsoft** : utilise `microsoft.outputFormat` (par défaut `audio-24khz-48kbitrate-mono-mp3`).
  - Le transport groupé accepte un `outputFormat`, mais tous les formats ne sont pas disponibles dans le service.
  - Les valeurs de format de sortie suivent les formats de sortie Microsoft Speech (y compris Ogg/WebM Opus).
  - Telegram `sendVoice` accepte OGG/MP3/M4A ; utilisez OpenAI/ElevenLabs si vous avez besoin
    de messages vocaux Opus garantis.
  - Si le format de sortie Microsoft configuré échoue, OpenClaw réessaie avec MP3.

Les formats de sortie OpenAI/ElevenLabs sont fixes par canal (voir ci-dessus).

## Comportement de l’auto-TTS

Lorsqu’elle est activée, OpenClaw :

- ignore la TTS si la réponse contient déjà un média ou une directive `MEDIA:`.
- ignore les réponses très courtes (< 10 caractères).
- résume les réponses longues lorsqu’elle est activée à l’aide de `agents.defaults.model.primary` (ou `summaryModel`).
- joint l’audio généré à la réponse.

Si la réponse dépasse `maxLength` et que le résumé est désactivé (ou qu’il n’y a pas de clé API pour le
modèle de résumé), l’audio
est ignoré et la réponse texte normale est envoyée.

## Diagramme du flux

```
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize (summaryModel or agents.defaults.model.primary)
                                      -> TTS -> attach audio
```

## Utilisation des commandes slash

Il existe une seule commande : `/tts`.
Voir [Commandes slash](/fr/tools/slash-commands) pour les détails d’activation.

Remarque Discord : `/tts` est une commande Discord intégrée, donc OpenClaw enregistre
`/voice` comme commande native à cet endroit. Le texte `/tts ...` fonctionne toujours.

```
/tts off
/tts on
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

Remarques :

- Les commandes nécessitent un expéditeur autorisé (les règles de liste d’autorisation/propriétaire s’appliquent toujours).
- `commands.text` ou l’enregistrement de commandes natives doit être activé.
- La configuration `messages.tts.auto` accepte `off|always|inbound|tagged`.
- `/tts on` écrit la préférence TTS locale à `always` ; `/tts off` l’écrit à `off`.
- Utilisez la configuration si vous voulez des valeurs par défaut `inbound` ou `tagged`.
- `limit` et `summary` sont stockés dans les préférences locales, pas dans la configuration principale.
- `/tts audio` génère une réponse audio ponctuelle (cela n’active pas la TTS).
- `/tts status` inclut la visibilité du secours pour la dernière tentative :
  - secours réussi : `Fallback: <primary> -> <used>` plus `Attempts: ...`
  - échec : `Error: ...` plus `Attempts: ...`
  - diagnostics détaillés : `Attempt details: provider:outcome(reasonCode) latency`
- Les échecs d’API OpenAI et ElevenLabs incluent désormais le détail de l’erreur fournisseur analysée et l’identifiant de requête (quand il est renvoyé par le fournisseur), ce qui est exposé dans les erreurs/journaux TTS.

## Outil de l’agent

L’outil `tts` convertit du texte en parole et renvoie une pièce jointe audio pour
la livraison de la réponse. Lorsque le canal est Feishu, Matrix, Telegram ou WhatsApp,
l’audio est livré comme message vocal plutôt que comme pièce jointe de fichier.

## RPC Gateway

Méthodes Gateway :

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
