---
read_when:
    - Activation du texte-vers-parole pour les réponses
    - Configuration des fournisseurs TTS ou des limites
    - Utilisation des commandes /tts
summary: Texte-vers-parole (TTS) pour les réponses sortantes
title: Texte-vers-parole
x-i18n:
    generated_at: "2026-04-23T07:12:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: be8f5a8ce90c56bcce58723702d51154fea3f9fd27a69ace144e2b1e5bdd7049
    source_path: tools/tts.md
    workflow: 15
---

# Texte-vers-parole (TTS)

OpenClaw peut convertir les réponses sortantes en audio avec ElevenLabs, Google Gemini, Microsoft, MiniMax, OpenAI ou xAI.
Cela fonctionne partout où OpenClaw peut envoyer de l’audio.

## Services pris en charge

- **ElevenLabs** (fournisseur principal ou de repli)
- **Google Gemini** (fournisseur principal ou de repli ; utilise l’API TTS Gemini)
- **Microsoft** (fournisseur principal ou de repli ; l’implémentation intégrée actuelle utilise `node-edge-tts`)
- **MiniMax** (fournisseur principal ou de repli ; utilise l’API T2A v2)
- **OpenAI** (fournisseur principal ou de repli ; également utilisé pour les résumés)
- **xAI** (fournisseur principal ou de repli ; utilise l’API TTS xAI)

### Remarques sur la parole Microsoft

Le fournisseur de parole Microsoft intégré utilise actuellement le service TTS neuronal
en ligne de Microsoft Edge via la bibliothèque `node-edge-tts`. C’est un service hébergé (non
local), il utilise des points de terminaison Microsoft et ne nécessite pas de clé API.
`node-edge-tts` expose des options de configuration de la parole et des formats de sortie, mais
toutes les options ne sont pas prises en charge par le service. Les anciennes entrées de configuration et de directive
utilisant `edge` fonctionnent toujours et sont normalisées vers `microsoft`.

Comme ce chemin repose sur un service web public sans SLA ni quota publiés,
considérez-le comme une option au mieux. Si vous avez besoin de limites garanties et de support, utilisez OpenAI
ou ElevenLabs.

## Clés facultatives

Si vous voulez OpenAI, ElevenLabs, Google Gemini, MiniMax ou xAI :

- `ELEVENLABS_API_KEY` (ou `XI_API_KEY`)
- `GEMINI_API_KEY` (ou `GOOGLE_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`
- `XAI_API_KEY`

La parole Microsoft ne nécessite **pas** de clé API.

Si plusieurs fournisseurs sont configurés, le fournisseur sélectionné est utilisé en premier et les autres servent d’options de repli.
Le résumé automatique utilise le `summaryModel` configuré (ou `agents.defaults.model.primary`),
ce fournisseur doit donc aussi être authentifié si vous activez les résumés.

## Liens vers les services

- [Guide OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Référence de l’API Audio OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Authentification ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formats de sortie Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Est-ce activé par défaut ?

Non. L’auto‑TTS est **désactivé** par défaut. Activez-le dans la configuration avec
`messages.tts.auto` ou localement avec `/tts on`.

Lorsque `messages.tts.provider` n’est pas défini, OpenClaw choisit le premier
fournisseur de parole configuré selon l’ordre d’auto-sélection du registre.

## Configuration

La configuration TTS se trouve sous `messages.tts` dans `openclaw.json`.
Le schéma complet se trouve dans [Configuration du Gateway](/fr/gateway/configuration).

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

### OpenAI principal avec ElevenLabs en repli

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

Le TTS Google Gemini utilise le chemin de clé API Gemini. Une clé API Google Cloud Console
limitée à l’API Gemini est valide ici, et c’est le même type de clé utilisé
par le fournisseur intégré de génération d’images Google. L’ordre de résolution est
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY`.

### xAI principal

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "xai_api_key",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
          speed: 1.0,
        },
      },
    },
  },
}
```

Le TTS xAI utilise le même chemin `XAI_API_KEY` que le fournisseur de modèles Grok intégré.
L’ordre de résolution est `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
Les voix live actuelles sont `ara`, `eve`, `leo`, `rex`, `sal` et `una` ; `eve` est
la valeur par défaut. `language` accepte un tag BCP-47 ou `auto`.

### Désactiver la parole Microsoft

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

### Répondre en audio uniquement après un message vocal entrant

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

Exécutez ensuite :

```
/tts summary off
```

### Remarques sur les champs

- `auto` : mode auto‑TTS (`off`, `always`, `inbound`, `tagged`).
  - `inbound` envoie de l’audio uniquement après un message vocal entrant.
  - `tagged` envoie de l’audio uniquement lorsque la réponse inclut des directives `[[tts:key=value]]` ou un bloc `[[tts:text]]...[[/tts:text]]`.
- `enabled` : ancienne bascule (doctor migre cela vers `auto`).
- `mode` : `"final"` (par défaut) ou `"all"` (inclut les réponses d’outil/bloc).
- `provider` : identifiant du fournisseur de parole tel que `"elevenlabs"`, `"google"`, `"microsoft"`, `"minimax"` ou `"openai"` (le repli est automatique).
- Si `provider` est **non défini**, OpenClaw utilise le premier fournisseur de parole configuré dans l’ordre d’auto-sélection du registre.
- L’ancien `provider: "edge"` fonctionne toujours et est normalisé vers `microsoft`.
- `summaryModel` : modèle économique facultatif pour le résumé automatique ; la valeur par défaut est `agents.defaults.model.primary`.
  - Accepte `provider/model` ou un alias de modèle configuré.
- `modelOverrides` : autorise le modèle à émettre des directives TTS (activé par défaut).
  - `allowProvider` a pour valeur par défaut `false` (le changement de fournisseur est opt-in).
- `providers.<id>` : paramètres appartenant au fournisseur indexés par identifiant de fournisseur de parole.
- Les anciens blocs directs de fournisseur (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) sont automatiquement migrés vers `messages.tts.providers.<id>` au chargement.
- `maxTextLength` : limite stricte pour l’entrée TTS (caractères). `/tts audio` échoue si elle est dépassée.
- `timeoutMs` : délai d’expiration de la requête (ms).
- `prefsPath` : remplace le chemin JSON local des préférences (fournisseur/limite/résumé).
- Les valeurs `apiKey` utilisent en repli les variables d’environnement (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl` : remplace l’URL de base de l’API ElevenLabs.
- `providers.openai.baseUrl` : remplace le point de terminaison TTS OpenAI.
  - Ordre de résolution : `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Les valeurs non par défaut sont traitées comme des points de terminaison TTS compatibles OpenAI, donc les noms personnalisés de modèle et de voix sont acceptés.
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
- `providers.google.voiceName` : nom de voix préconstruite Gemini (par défaut `Kore` ; `voice` est aussi accepté).
- `providers.google.baseUrl` : remplace l’URL de base de l’API Gemini. Seul `https://generativelanguage.googleapis.com` est accepté.
  - Si `messages.tts.providers.google.apiKey` est omis, TTS peut réutiliser `models.providers.google.apiKey` avant le repli sur l’environnement.
- `providers.xai.apiKey` : clé API TTS xAI (env : `XAI_API_KEY`).
- `providers.xai.baseUrl` : remplace l’URL de base TTS xAI (par défaut `https://api.x.ai/v1`, env : `XAI_BASE_URL`).
- `providers.xai.voiceId` : id de voix xAI (par défaut `eve` ; voix live actuelles : `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language` : code langue BCP-47 ou `auto` (par défaut `en`).
- `providers.xai.responseFormat` : `mp3`, `wav`, `pcm`, `mulaw` ou `alaw` (par défaut `mp3`).
- `providers.xai.speed` : surcharge de vitesse native au fournisseur.
- `providers.microsoft.enabled` : autorise l’utilisation de la parole Microsoft (par défaut `true` ; pas de clé API).
- `providers.microsoft.voice` : nom de voix neuronale Microsoft (par ex. `en-US-MichelleNeural`).
- `providers.microsoft.lang` : code langue (par ex. `en-US`).
- `providers.microsoft.outputFormat` : format de sortie Microsoft (par ex. `audio-24khz-48kbitrate-mono-mp3`).
  - Voir les formats de sortie Microsoft Speech pour les valeurs valides ; tous les formats ne sont pas pris en charge par le transport intégré adossé à Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume` : chaînes en pourcentage (par ex. `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles` : écrit des sous-titres JSON à côté du fichier audio.
- `providers.microsoft.proxy` : URL de proxy pour les requêtes de parole Microsoft.
- `providers.microsoft.timeoutMs` : surcharge du délai d’expiration de requête (ms).
- `edge.*` : ancien alias pour les mêmes paramètres Microsoft.

## Surcharges pilotées par le modèle (activées par défaut)

Par défaut, le modèle **peut** émettre des directives TTS pour une seule réponse.
Lorsque `messages.tts.auto` vaut `tagged`, ces directives sont nécessaires pour déclencher l’audio.

Lorsqu’elles sont activées, le modèle peut émettre des directives `[[tts:...]]` pour remplacer la voix
pour une seule réponse, plus un bloc facultatif `[[tts:text]]...[[/tts:text]]` afin de
fournir des balises expressives (rires, indications de chant, etc.) qui ne doivent apparaître
que dans l’audio.

Les directives `provider=...` sont ignorées sauf si `modelOverrides.allowProvider: true`.

Exemple de charge utile de réponse :

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Clés de directive disponibles (lorsqu’elles sont activées) :

- `provider` (id de fournisseur de parole enregistré, par exemple `openai`, `elevenlabs`, `google`, `minimax` ou `microsoft` ; nécessite `allowProvider: true`)
- `voice` (voix OpenAI), `voiceName` / `voice_name` / `google_voice` (voix Google), ou `voiceId` (ElevenLabs / MiniMax / xAI)
- `model` (modèle TTS OpenAI, id de modèle ElevenLabs ou modèle MiniMax) ou `google_model` (modèle TTS Google)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume MiniMax, 0-10)
- `pitch` (hauteur MiniMax, -12 à 12)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Désactiver toutes les surcharges pilotées par le modèle :

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

Liste d’autorisation facultative (active le changement de fournisseur tout en gardant les autres réglages configurables) :

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

Les commandes slash écrivent des surcharges locales dans `prefsPath` (par défaut :
`~/.openclaw/settings/tts.json`, surchargeable avec `OPENCLAW_TTS_PREFS` ou
`messages.tts.prefsPath`).

Champs stockés :

- `enabled`
- `provider`
- `maxLength` (seuil de résumé ; 1500 caractères par défaut)
- `summarize` (par défaut `true`)

Ces valeurs remplacent `messages.tts.*` pour cet hôte.

## Formats de sortie (fixes)

- **Feishu / Matrix / Telegram / WhatsApp** : message vocal Opus (`opus_48000_64` depuis ElevenLabs, `opus` depuis OpenAI).
  - 48 kHz / 64 kbps offre un bon compromis pour les messages vocaux.
- **Autres canaux** : MP3 (`mp3_44100_128` depuis ElevenLabs, `mp3` depuis OpenAI).
  - 44,1 kHz / 128 kbps représente l’équilibre par défaut pour la clarté de la parole.
- **MiniMax** : MP3 (modèle `speech-2.8-hd`, fréquence d’échantillonnage 32 kHz). Le format de note vocale n’est pas pris en charge nativement ; utilisez OpenAI ou ElevenLabs pour des messages vocaux Opus garantis.
- **Google Gemini** : le TTS de l’API Gemini renvoie du PCM brut 24 kHz. OpenClaw l’enveloppe en WAV pour les pièces jointes audio et renvoie directement le PCM pour Talk/téléphonie. Le format natif de note vocale Opus n’est pas pris en charge par ce chemin.
- **xAI** : MP3 par défaut ; `responseFormat` peut être `mp3`, `wav`, `pcm`, `mulaw` ou `alaw`. OpenClaw utilise le point de terminaison REST TTS batch de xAI et renvoie une pièce jointe audio complète ; le WebSocket TTS en streaming de xAI n’est pas utilisé par ce chemin fournisseur. Le format natif de note vocale Opus n’est pas pris en charge par ce chemin.
- **Microsoft** : utilise `microsoft.outputFormat` (par défaut `audio-24khz-48kbitrate-mono-mp3`).
  - Le transport intégré accepte un `outputFormat`, mais tous les formats ne sont pas disponibles depuis le service.
  - Les valeurs de format de sortie suivent les formats de sortie Microsoft Speech (y compris Ogg/WebM Opus).
  - `sendVoice` de Telegram accepte OGG/MP3/M4A ; utilisez OpenAI/ElevenLabs si vous avez besoin
    de messages vocaux Opus garantis.
  - Si le format de sortie Microsoft configuré échoue, OpenClaw réessaie avec MP3.

Les formats de sortie OpenAI/ElevenLabs sont fixes par canal (voir ci-dessus).

## Comportement de l’auto-TTS

Lorsqu’il est activé, OpenClaw :

- ignore le TTS si la réponse contient déjà un média ou une directive `MEDIA:`.
- ignore les réponses très courtes (< 10 caractères).
- résume les réponses longues lorsqu’il est activé en utilisant `agents.defaults.model.primary` (ou `summaryModel`).
- joint l’audio généré à la réponse.

Si la réponse dépasse `maxLength` et que le résumé est désactivé (ou qu’il n’y a pas de clé API pour le
modèle de résumé), l’audio
est ignoré et la réponse texte normale est envoyée.

## Diagramme de flux

```
Réponse -> TTS activé ?
  non -> envoyer le texte
  oui -> contient média / MEDIA: / trop court ?
          oui -> envoyer le texte
          non -> longueur > limite ?
                   non -> TTS -> joindre l’audio
                   oui -> résumé activé ?
                            non -> envoyer le texte
                            oui -> résumer (summaryModel ou agents.defaults.model.primary)
                                      -> TTS -> joindre l’audio
```

## Utilisation des commandes slash

Il existe une seule commande : `/tts`.
Voir [Commandes slash](/fr/tools/slash-commands) pour les détails d’activation.

Remarque Discord : `/tts` est une commande Discord intégrée, donc OpenClaw enregistre
`/voice` comme commande native à la place. Le texte `/tts ...` fonctionne toujours.

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

- Les commandes nécessitent un expéditeur autorisé (les règles allowlist/propriétaire s’appliquent toujours).
- `commands.text` ou l’enregistrement de commande native doit être activé.
- La configuration `messages.tts.auto` accepte `off|always|inbound|tagged`.
- `/tts on` écrit la préférence TTS locale à `always` ; `/tts off` l’écrit à `off`.
- Utilisez la configuration lorsque vous voulez des valeurs par défaut `inbound` ou `tagged`.
- `limit` et `summary` sont stockés dans les préférences locales, pas dans la configuration principale.
- `/tts audio` génère une réponse audio ponctuelle (n’active pas TTS).
- `/tts status` inclut la visibilité de repli pour la dernière tentative :
  - succès avec repli : `Fallback: <primary> -> <used>` plus `Attempts: ...`
  - échec : `Error: ...` plus `Attempts: ...`
  - diagnostics détaillés : `Attempt details: provider:outcome(reasonCode) latency`
- Les échecs API OpenAI et ElevenLabs incluent maintenant les détails d’erreur fournisseur analysés et l’id de requête (lorsqu’ils sont renvoyés par le fournisseur), ce qui remonte dans les erreurs/journaux TTS.

## Outil agent

L’outil `tts` convertit du texte en parole et renvoie une pièce jointe audio pour
la livraison de la réponse. Lorsque le canal est Feishu, Matrix, Telegram ou WhatsApp,
l’audio est livré comme message vocal plutôt que comme pièce jointe de fichier.

## Gateway RPC

Méthodes Gateway :

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
