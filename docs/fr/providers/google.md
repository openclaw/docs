---
read_when:
    - Vous souhaitez utiliser les modèles Google Gemini avec OpenClaw
    - Vous avez besoin de la clé API ou du flux d’authentification OAuth
summary: Configuration de Google Gemini (clé API + OAuth, génération d’images, compréhension des médias, synthèse vocale, recherche web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-07-16T13:42:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fe8a58044bea7ce2598da94787334af2bb4a2ff58872c62115697fa0079daf0a
    source_path: providers/google.md
    workflow: 16
---

Le plugin Google donne accès aux modèles Gemini via Google AI Studio, ainsi qu’à la génération d’images, à la compréhension des médias (image/audio/vidéo), à la synthèse vocale et à la recherche web via Gemini Grounding.

- Fournisseur : `google`
- Authentification : `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- API : API Google Gemini
- Option d’exécution : `agentRuntime.id: "google-gemini-cli"` réutilise l’OAuth de Gemini CLI tout en conservant les références de modèles sous leur forme canonique `google/*`.

## Prise en main

Choisissez votre méthode d’authentification préférée et suivez les étapes de configuration.

<Tabs>
  <Tab title="Clé API">
    **Idéal pour :** l’accès standard à l’API Gemini via Google AI Studio.

    <Steps>
      <Step title="Obtenir une clé API">
        Créez une clé gratuite dans [Google AI Studio](https://aistudio.google.com/apikey).
      </Step>
      <Step title="Exécuter l’intégration initiale">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Vous pouvez également transmettre directement la clé :

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Définir un modèle par défaut">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    `GEMINI_API_KEY` et `GOOGLE_API_KEY` sont tous deux acceptés. Utilisez celui qui est déjà configuré.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Idéal pour :** se connecter avec votre compte Google via l’OAuth de Gemini CLI plutôt que d’utiliser une clé API distincte.

    <Warning>
    Le fournisseur `google-gemini-cli` est une intégration non officielle. Certains utilisateurs
    signalent des restrictions de compte lors de l’utilisation d’OAuth de cette manière. Utilisez-la à vos propres risques.
    </Warning>

    <Steps>
      <Step title="Installer Gemini CLI">
        La commande locale `gemini` doit être disponible dans `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # ou npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw prend en charge les installations Homebrew et les installations npm globales, notamment
        les structures courantes sous Windows/npm.
      </Step>
      <Step title="Se connecter via OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Modèle par défaut : `google/gemini-3.1-pro-preview`
    - Environnement d’exécution : `google-gemini-cli`
    - Alias : `gemini-cli`

    L’identifiant de modèle de l’API Gemini pour Gemini 3.1 Pro est `gemini-3.1-pro-preview`. OpenClaw accepte la forme abrégée `google/gemini-3.1-pro` comme alias pratique et la normalise avant les appels au fournisseur.

    **Variables d’environnement :**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    Si les requêtes OAuth de Gemini CLI échouent après la connexion, définissez `GOOGLE_CLOUD_PROJECT` ou
    `GOOGLE_CLOUD_PROJECT_ID` sur l’hôte du Gateway, puis réessayez.
    </Note>

    <Note>
    Si la connexion échoue avant le démarrage du processus dans le navigateur, vérifiez que la commande locale `gemini`
    est installée et présente dans `PATH`.
    </Note>

    La détection automatique lors de l’intégration initiale répertorie toute connexion Gemini CLI existante, mais ne
    la teste jamais automatiquement, car Gemini CLI ne propose aucune sonde sans outil. Choisissez l’OAuth de Gemini CLI
    ou une clé API Gemini pour continuer.

    Les références de modèles `google-gemini-cli/*` sont des alias de compatibilité hérités. Les nouvelles
    configurations doivent utiliser les références de modèles `google/*` ainsi que l’environnement d’exécution `google-gemini-cli`
    lorsqu’une exécution locale de Gemini CLI est souhaitée.

  </Tab>
</Tabs>

<Note>
`google/gemini-3-pro-preview` a été retiré le 2026-03-09 ; utilisez `google/gemini-3.1-pro-preview` à la place. Relancer la configuration de la clé API Gemini (`openclaw onboard --auth-choice gemini-api-key` ou `openclaw models auth login --provider google`) remplace un modèle par défaut obsolète dans la configuration par le modèle actuel.
</Note>

## Fonctionnalités

| Fonctionnalité                    | Prise en charge                  |
| --------------------------------- | -------------------------------- |
| Complétions de chat               | Oui                              |
| Génération d’images               | Oui                              |
| Génération musicale               | Oui                              |
| Synthèse vocale                   | Oui                              |
| Voix en temps réel                | Oui (API Google Live)            |
| Compréhension d’images            | Oui                              |
| Transcription audio               | Oui                              |
| Compréhension de vidéos           | Oui                              |
| Recherche web (Grounding)         | Oui                              |
| Réflexion/raisonnement            | Oui (Gemini 2.5+ / Gemini 3+)    |
| Modèles Gemma 4                   | Oui                              |

## Recherche web

Le fournisseur de recherche web `gemini` inclus utilise l’ancrage Google Search de Gemini.
Configurez une clé de recherche dédiée sous `plugins.entries.google.config.webSearch`,
ou laissez-le réutiliser `models.providers.google.apiKey` après `GEMINI_API_KEY` :

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // facultatif si GEMINI_API_KEY ou models.providers.google.apiKey est défini
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // utilise models.providers.google.baseUrl comme solution de repli
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

L’ordre de priorité des identifiants est le suivant : `webSearch.apiKey` dédié, puis `GEMINI_API_KEY`,
puis `models.providers.google.apiKey`. `webSearch.baseUrl` est facultatif et
sert aux proxys d’exploitation ou aux points de terminaison compatibles avec l’API Gemini ; lorsqu’il est omis,
la recherche web Gemini réutilise `models.providers.google.baseUrl`. Consultez
[Recherche Gemini](/fr/tools/gemini-search) pour connaître le comportement de l’outil propre au fournisseur.

<Tip>
Les modèles Gemini 3 utilisent `thinkingLevel` plutôt que `thinkingBudget`. OpenClaw associe
les contrôles de raisonnement de Gemini 3, Gemini 3.1 et de l’alias `gemini-*-latest` à
`thinkingLevel`, afin que les exécutions par défaut ou à faible latence n’envoient pas de valeurs
`thinkingBudget` désactivées.

`/think adaptive` conserve la sémantique de réflexion dynamique de Google au lieu de choisir
un niveau OpenClaw fixe. Gemini 3 et Gemini 3.1 omettent une valeur `thinkingLevel` fixe afin que
Google puisse choisir le niveau ; Gemini 2.5 envoie la valeur sentinelle dynamique de Google
`thinkingBudget: -1`.

Les modèles Gemma 4 (par exemple `gemma-4-26b-a4b-it`) prennent en charge le mode de réflexion. OpenClaw
remplace `thinkingBudget` par une valeur Google `thinkingLevel` prise en charge pour Gemma 4.
Définir la réflexion sur `off` la maintient désactivée au lieu de l’associer à
`MINIMAL`.

Gemini 2.5 Pro fonctionne uniquement en mode de réflexion et rejette une valeur explicite
`thinkingBudget: 0` ; OpenClaw retire cette valeur des requêtes Gemini 2.5 Pro
au lieu de l’envoyer.
</Tip>

## Génération d’images

Le fournisseur de génération d’images `google` inclus utilise par défaut
`google/gemini-3.1-flash-image-preview`.

- Prend également en charge `google/gemini-3-pro-image-preview`
- Génération : jusqu’à 4 images par requête
- Mode d’édition : activé, jusqu’à 5 images d’entrée
- Contrôles géométriques : `size`, `aspectRatio` et `resolution`

Pour utiliser Google comme fournisseur d’images par défaut :

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
Consultez [Génération d’images](/fr/tools/image-generation) pour connaître les paramètres d’outil partagés, la sélection du fournisseur et le comportement de basculement.
</Note>

## Génération de vidéos

Le plugin `google` inclus enregistre également la génération de vidéos via l’outil partagé
`video_generate`.

- Modèle vidéo par défaut : `google/veo-3.1-fast-generate-preview`
- Modes : texte vers vidéo, image vers vidéo et processus de référence à une seule vidéo
- Prend en charge `aspectRatio` (`16:9`, `9:16`) et `resolution` (`720P`, `1080P`) ; Veo ne prend actuellement pas en charge la sortie audio
- Durées prises en charge : **4, 6 ou 8 secondes** (les autres valeurs sont ajustées à la valeur autorisée la plus proche)

Pour utiliser Google comme fournisseur de vidéos par défaut :

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
Consultez [Génération de vidéos](/fr/tools/video-generation) pour connaître les paramètres d’outil partagés, la sélection du fournisseur et le comportement de basculement.
</Note>

## Génération musicale

Le plugin `google` inclus enregistre également la génération musicale via l’outil partagé
`music_generate`.

- Modèle musical par défaut : `google/lyria-3-clip-preview`
- Prend également en charge `google/lyria-3-pro-preview`
- Contrôles des invites : `lyrics` et `instrumental`
- Format de sortie : `mp3` par défaut, ainsi que `wav` sur `google/lyria-3-pro-preview`
- Entrées de référence : jusqu’à 10 images
- Les exécutions associées à une session se détachent via le processus partagé de tâche et d’état, notamment `action: "status"`

Pour utiliser Google comme fournisseur de musique par défaut :

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
Consultez [Génération musicale](/fr/tools/music-generation) pour connaître les paramètres d’outil partagés, la sélection du fournisseur et le comportement de basculement.
</Note>

## Synthèse vocale

Le fournisseur vocal `google` inclus utilise le parcours TTS de l’API Gemini avec
`gemini-3.1-flash-tts-preview`.

- Voix par défaut : `Kore`
- Authentification : `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- Sortie : WAV pour les pièces jointes TTS ordinaires, Opus pour les destinations de notes vocales, PCM pour Talk/la téléphonie
- Sortie de note vocale : le PCM de Google est encapsulé au format WAV et transcodé en Opus à 48 kHz avec `ffmpeg`

Le parcours TTS Gemini par lots de Google renvoie le contenu audio généré dans la réponse
`generateContent` terminée. Pour obtenir la latence la plus faible dans les conversations vocales, utilisez le
fournisseur vocal Google en temps réel, reposant sur l’API Gemini Live, plutôt que le TTS
par lots.

Pour utiliser Google comme fournisseur TTS par défaut :

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          speakerVoice: "Kore",
          audioProfile: "Parlez de manière professionnelle avec un ton calme.",
        },
      },
    },
  },
}
```

Le TTS de l’API Gemini utilise des invites en langage naturel pour contrôler le style. Définissez
`audioProfile` afin d’ajouter une invite de style réutilisable avant le texte prononcé. Définissez
`speakerName` lorsque le texte de votre invite fait référence à un locuteur nommé.

Le TTS de l’API Gemini accepte également des balises audio expressives entre crochets dans le texte,
telles que `[whispers]` ou `[laughs]`. Pour exclure les balises de la réponse visible dans le chat
tout en les envoyant au TTS, placez-les dans un bloc `[[tts:text]]...[[/tts:text]]` :

```text
Voici le texte propre de la réponse.

[[tts:text]][whispers] Voici la version prononcée.[[/tts:text]]
```

<Note>
Une clé API Google Cloud Console limitée à l’API Gemini est valide pour ce
fournisseur. Il ne s’agit pas du parcours distinct de l’API Cloud Text-to-Speech.
</Note>

## Voix en temps réel

Le plugin `google` inclus enregistre un fournisseur vocal en temps réel reposant sur
l’API Gemini Live pour les ponts audio côté serveur tels que Voice Call et Google Meet.

| Paramètre                    | Chemin de configuration                                               | Valeur par défaut                                                                     |
| ---------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Modèle                       | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-3.1-flash-live-preview`                                                       |
| Voix                         | `...google.voice`                                                   | `Kore`                                                                                |
| Température                  | `...google.temperature`                                             | (non défini)                                                                          |
| Sensibilité de début de VAD  | `...google.startSensitivity`                                        | (non défini)                                                                          |
| Sensibilité de fin de VAD    | `...google.endSensitivity`                                          | (non défini)                                                                          |
| Durée du silence             | `...google.silenceDurationMs`                                       | (non défini)                                                                          |
| Gestion de l’activité        | `...google.activityHandling`                                        | Valeur par défaut de Google, `start-of-activity-interrupts`                           |
| Couverture du tour           | `...google.turnCoverage`                                            | Valeur par défaut de Google, `audio-activity-and-all-video`                           |
| Désactiver la VAD automatique | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| Reprise de session           | `...google.sessionResumption`                                       | `true`                                                                                |
| Compression du contexte      | `...google.contextWindowCompression`                                | `true`                                                                                |
| Clé API                      | `...google.apiKey`                                                  | Utilise à défaut `models.providers.google.apiKey`, `GEMINI_API_KEY` ou `GOOGLE_API_KEY` |

Exemple de configuration en temps réel de Voice Call :

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-3.1-flash-live-preview",
                speakerVoice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "audio-activity-and-all-video",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
L’API Google Live utilise l’audio bidirectionnel et l’appel de fonctions via un WebSocket.
OpenClaw adapte l’audio de la passerelle de téléphonie/Meet au flux de l’API PCM Live de Gemini et
conserve les appels d’outils dans le contrat vocal en temps réel partagé. Laissez `temperature`
non défini sauf si vous devez modifier l’échantillonnage ; OpenClaw omet les valeurs non positives,
car Google Live peut renvoyer des transcriptions sans audio pour `temperature: 0`.
La transcription de l’API Gemini est activée sans `languageCodes` ; le SDK Google actuel
rejette les indications de code de langue sur ce chemin d’API.
</Note>

<Note>
Gemini 3.1 Live accepte le texte conversationnel via l’entrée en temps réel et utilise
l’appel séquentiel de fonctions. OpenClaw omet l’ancien `NON_BLOCKING`, la planification
des réponses de fonctions et les champs de dialogue affectif pour ce modèle. Préférez
`thinkingLevel` ; les valeurs positives configurées de `thinkingBudget` sont associées au
niveau pris en charge le plus proche, tandis que `-1` conserve la valeur par défaut de Google. Consultez la
[comparaison des fonctionnalités de Gemini Live](https://ai.google.dev/gemini-api/docs/live-api/capabilities).
</Note>

<Note>
La fonction Talk de l’interface de contrôle prend en charge les sessions Google Live dans le navigateur avec des
jetons contraints à usage unique. Les fournisseurs de voix en temps réel réservés au backend peuvent également fonctionner via le
transport de relais générique du Gateway, qui conserve les identifiants du fournisseur sur le Gateway.
</Note>

Pour effectuer une vérification en direct destinée aux responsables de maintenance, exécutez
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Le test rapide couvre également les chemins backend/WebRTC d’OpenAI ; la partie Google génère le même
format de jeton contraint de l’API Live que celui utilisé par la fonction Talk de l’interface de contrôle, ouvre le
point de terminaison WebSocket du navigateur, envoie la charge utile de configuration initiale et attend
`setupComplete`.

## Configuration avancée

<AccordionGroup>
  <Accordion title="Réutilisation directe du cache Gemini">
    Pour les exécutions directes de l’API Gemini (`api: "google-generative-ai"`), OpenClaw
    transmet un identifiant `cachedContent` configuré aux requêtes Gemini.

    - Configurez les paramètres par modèle ou globaux avec
      `cachedContent` ou l’ancien `cached_content`
    - Les paramètres de la portée la plus précise (niveau du modèle plutôt que global) sont toujours prioritaires.
      Au sein d’une même portée, si les deux clés sont définies, `cached_content` est prioritaire.
      N’utilisez qu’une seule clé par portée afin d’éviter les surprises.
    - Exemple de valeur : `cachedContents/prebuilt-context`
    - L’utilisation des accès au cache Gemini est normalisée dans le champ OpenClaw `cacheRead` à partir
      du champ en amont `cachedContentTokenCount`

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Notes d’utilisation de la CLI Gemini">
    Lors de l’utilisation du fournisseur OAuth `google-gemini-cli`, OpenClaw utilise par défaut
    la sortie `stream-json` de la CLI Gemini et normalise l’utilisation à partir de la charge utile
    `stats` finale. Les remplacements `--output-format json` hérités continuent d’utiliser
    l’analyseur JSON.

    - Le texte de réponse diffusé provient des événements assistant `message`.
    - Pour l’ancienne sortie JSON, le texte de réponse provient du champ `response` du JSON de la CLI.
    - L’utilisation se rabat sur `stats` lorsque la CLI laisse `usage` vide.
    - `stats.cached` est normalisé dans le champ OpenClaw `cacheRead`.
    - Si `stats.input` est absent, OpenClaw déduit les jetons d’entrée à partir de
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Configuration de l’environnement et du démon">
    Si le Gateway s’exécute en tant que démon (launchd/systemd), assurez-vous que `GEMINI_API_KEY`
    est disponible pour ce processus (par exemple, dans `~/.openclaw/.env` ou via
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Rubriques connexes

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Paramètres partagés de l’outil d’image et sélection du fournisseur.
  </Card>
  <Card title="Génération de vidéos" href="/fr/tools/video-generation" icon="video">
    Paramètres partagés de l’outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="Génération de musique" href="/fr/tools/music-generation" icon="music">
    Paramètres partagés de l’outil musical et sélection du fournisseur.
  </Card>
</CardGroup>
