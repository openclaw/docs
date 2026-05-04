---
read_when:
    - Vous souhaitez utiliser les modèles Google Gemini avec OpenClaw
    - Vous avez besoin de la clé API ou du flux d’authentification OAuth
summary: Configuration de Google Gemini (clé API + OAuth, génération d’images, compréhension des médias, TTS, recherche web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-04T07:05:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e45627f5d5cd57e858c7590a90435b7fc0e9381509f3312a16fc9e9a4cbd908
    source_path: providers/google.md
    workflow: 16
---

Le Plugin Google fournit l’accès aux modèles Gemini via Google AI Studio, ainsi que
la génération d’images, la compréhension des médias (image/audio/vidéo), la synthèse vocale et la recherche web via
Gemini Grounding.

- Fournisseur : `google`
- Authentification : `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- API : API Google Gemini
- Option d’exécution : `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  réutilise l’OAuth de Gemini CLI tout en conservant les références de modèles canoniques sous la forme `google/*`.

## Bien démarrer

Choisissez votre méthode d’authentification préférée et suivez les étapes de configuration.

<Tabs>
  <Tab title="Clé API">
    **Idéal pour :** l’accès standard à l’API Gemini via Google AI Studio.

    <Steps>
      <Step title="Lancer l’intégration">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Ou transmettez directement la clé :

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
    Les variables d’environnement `GEMINI_API_KEY` et `GOOGLE_API_KEY` sont toutes deux acceptées. Utilisez celle que vous avez déjà configurée.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Idéal pour :** réutiliser une connexion Gemini CLI existante via OAuth PKCE au lieu d’une clé API distincte.

    <Warning>
    Le fournisseur `google-gemini-cli` est une intégration non officielle. Certains utilisateurs
    signalent des restrictions de compte lors de l’utilisation d’OAuth de cette manière. Utilisez-le à vos propres risques.
    </Warning>

    <Steps>
      <Step title="Installer Gemini CLI">
        La commande locale `gemini` doit être disponible dans `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw prend en charge les installations Homebrew ainsi que les installations npm globales, y compris
        les dispositions Windows/npm courantes.
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
    - Runtime : `google-gemini-cli`
    - Alias : `gemini-cli`

    L’identifiant de modèle de Gemini 3.1 Pro dans l’API Gemini est `gemini-3.1-pro-preview`. OpenClaw accepte la forme plus courte `google/gemini-3.1-pro` comme alias pratique et la normalise avant les appels au fournisseur.

    **Variables d’environnement :**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Ou les variantes `GEMINI_CLI_*`.)

    <Note>
    Si les requêtes OAuth de Gemini CLI échouent après la connexion, définissez `GOOGLE_CLOUD_PROJECT` ou
    `GOOGLE_CLOUD_PROJECT_ID` sur l’hôte du Gateway et réessayez.
    </Note>

    <Note>
    Si la connexion échoue avant le démarrage du flux dans le navigateur, assurez-vous que la commande locale `gemini`
    est installée et présente dans `PATH`.
    </Note>

    Les références de modèles `google-gemini-cli/*` sont des alias de compatibilité hérités. Les nouvelles
    configurations doivent utiliser les références de modèles `google/*`, ainsi que le runtime `google-gemini-cli`
    lorsqu’elles souhaitent une exécution locale de Gemini CLI.

  </Tab>
</Tabs>

## Fonctionnalités

| Fonctionnalité             | Pris en charge                     |
| ---------------------- | ----------------------------- |
| Complétions de chat       | Oui                           |
| Génération d’images       | Oui                           |
| Génération de musique       | Oui                           |
| Synthèse vocale         | Oui                           |
| Voix en temps réel         | Oui (Google Live API)         |
| Compréhension des images    | Oui                           |
| Transcription audio    | Oui                           |
| Compréhension vidéo    | Oui                           |
| Recherche web (Grounding) | Oui                           |
| Réflexion/raisonnement     | Oui (Gemini 2.5+ / Gemini 3+) |
| Modèles Gemma 4         | Oui                           |

## Recherche web

Le fournisseur de recherche web `gemini` intégré utilise le grounding de Gemini Google Search.
Configurez une clé de recherche dédiée sous `plugins.entries.google.config.webSearch`,
ou laissez-le réutiliser `models.providers.google.apiKey` après `GEMINI_API_KEY` :

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

L’ordre de priorité des identifiants est `webSearch.apiKey` dédié, puis `GEMINI_API_KEY`,
puis `models.providers.google.apiKey`. `webSearch.baseUrl` est facultatif et
existe pour les proxys d’opérateurs ou les points de terminaison compatibles avec l’API Gemini ; lorsqu’il est omis,
la recherche web Gemini réutilise `models.providers.google.baseUrl`. Consultez
[Recherche Gemini](/fr/tools/gemini-search) pour le comportement de l’outil propre à ce fournisseur.

<Tip>
Les modèles Gemini 3 utilisent `thinkingLevel` plutôt que `thinkingBudget`. OpenClaw mappe
les contrôles de raisonnement des alias Gemini 3, Gemini 3.1 et `gemini-*-latest` vers
`thinkingLevel` afin que les exécutions par défaut/à faible latence n’envoient pas de valeurs
`thinkingBudget` désactivées.

`/think adaptive` conserve la sémantique de réflexion dynamique de Google au lieu de choisir
un niveau OpenClaw fixe. Gemini 3 et Gemini 3.1 omettent un `thinkingLevel` fixe afin que
Google puisse choisir le niveau ; Gemini 2.5 envoie la sentinelle dynamique de Google
`thinkingBudget: -1`.

Les modèles Gemma 4 (par exemple `gemma-4-26b-a4b-it`) prennent en charge le mode réflexion. OpenClaw
réécrit `thinkingBudget` en un `thinkingLevel` Google pris en charge pour Gemma 4.
Définir la réflexion sur `off` conserve la réflexion désactivée au lieu de la mapper vers
`MINIMAL`.
</Tip>

## Génération d’images

Le fournisseur de génération d’images `google` intégré utilise par défaut
`google/gemini-3.1-flash-image-preview`.

- Prend également en charge `google/gemini-3-pro-image-preview`
- Génération : jusqu’à 4 images par requête
- Mode édition : activé, jusqu’à 5 images d’entrée
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
Consultez [Génération d’images](/fr/tools/image-generation) pour les paramètres partagés de l’outil, la sélection du fournisseur et le comportement de basculement.
</Note>

## Génération vidéo

Le Plugin `google` intégré enregistre également la génération vidéo via l’outil partagé
`video_generate`.

- Modèle vidéo par défaut : `google/veo-3.1-fast-generate-preview`
- Modes : texte vers vidéo, image vers vidéo et flux de référence à vidéo unique
- Prend en charge `aspectRatio`, `resolution` et `audio`
- Limite de durée actuelle : **4 à 8 secondes**

Pour utiliser Google comme fournisseur vidéo par défaut :

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
Consultez [Génération vidéo](/fr/tools/video-generation) pour les paramètres partagés de l’outil, la sélection du fournisseur et le comportement de basculement.
</Note>

## Génération de musique

Le Plugin `google` intégré enregistre également la génération de musique via l’outil partagé
`music_generate`.

- Modèle de musique par défaut : `google/lyria-3-clip-preview`
- Prend également en charge `google/lyria-3-pro-preview`
- Contrôles de prompt : `lyrics` et `instrumental`
- Format de sortie : `mp3` par défaut, plus `wav` sur `google/lyria-3-pro-preview`
- Entrées de référence : jusqu’à 10 images
- Les exécutions appuyées par une session se détachent via le flux partagé de tâche/état, y compris `action: "status"`

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
Consultez [Génération de musique](/fr/tools/music-generation) pour les paramètres partagés de l’outil, la sélection du fournisseur et le comportement de basculement.
</Note>

## Synthèse vocale

Le fournisseur de parole `google` intégré utilise le chemin TTS de l’API Gemini avec
`gemini-3.1-flash-tts-preview`.

- Voix par défaut : `Kore`
- Authentification : `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- Sortie : WAV pour les pièces jointes TTS classiques, Opus pour les cibles de notes vocales, PCM pour Talk/téléphonie
- Sortie de note vocale : le PCM Google est encapsulé en WAV et transcodé en Opus 48 kHz avec `ffmpeg`

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
          voiceName: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Le TTS de l’API Gemini utilise des prompts en langage naturel pour contrôler le style. Définissez
`audioProfile` pour préfixer le texte prononcé avec un prompt de style réutilisable. Définissez
`speakerName` lorsque le texte de votre prompt fait référence à un locuteur nommé.

Le TTS de l’API Gemini accepte également des balises audio expressives entre crochets dans le texte,
comme `[whispers]` ou `[laughs]`. Pour exclure les balises de la réponse de chat visible
tout en les envoyant au TTS, placez-les dans un bloc `[[tts:text]]...[[/tts:text]]` :

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Une clé API Google Cloud Console limitée à l’API Gemini est valide pour ce
fournisseur. Il ne s’agit pas du chemin séparé de l’API Cloud Text-to-Speech.
</Note>

## Voix en temps réel

Le Plugin `google` intégré enregistre un fournisseur de voix en temps réel adossé à
l’API Gemini Live pour les ponts audio backend tels que Voice Call et Google Meet.

| Paramètre             | Chemin de configuration                                             | Valeur par défaut                                                                     |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Modèle                | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Voix                  | `...google.voice`                                                   | `Kore`                                                                                |
| Température           | `...google.temperature`                                             | (non défini)                                                                          |
| Sensibilité de début VAD | `...google.startSensitivity`                                     | (non défini)                                                                          |
| Sensibilité de fin VAD   | `...google.endSensitivity`                                       | (non défini)                                                                          |
| Durée du silence      | `...google.silenceDurationMs`                                       | (non défini)                                                                          |
| Gestion de l’activité | `...google.activityHandling`                                        | Valeur par défaut de Google, `start-of-activity-interrupts`                           |
| Couverture du tour    | `...google.turnCoverage`                                            | Valeur par défaut de Google, `only-activity`                                          |
| Désactiver la VAD automatique | `...google.automaticActivityDetectionDisabled`              | `false`                                                                               |
| Reprise de session    | `...google.sessionResumption`                                       | `true`                                                                                |
| Compression du contexte | `...google.contextWindowCompression`                              | `true`                                                                                |
| Clé API               | `...google.apiKey`                                                  | Se replie sur `models.providers.google.apiKey`, `GEMINI_API_KEY` ou `GOOGLE_API_KEY`  |

Exemple de configuration temps réel Voice Call :

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
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "only-activity",
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
Google Live API utilise l’audio bidirectionnel et l’appel de fonctions via un WebSocket.
OpenClaw adapte l’audio de téléphonie/pont Meet au flux PCM Live API de Gemini et
conserve les appels d’outils sur le contrat vocal temps réel partagé. Laissez `temperature`
non défini, sauf si vous devez modifier l’échantillonnage ; OpenClaw omet les valeurs non positives,
car Google Live peut renvoyer des transcriptions sans audio pour `temperature: 0`.
La transcription Gemini API est activée sans `languageCodes` ; le SDK Google actuel
rejette les indications de code de langue sur ce chemin d’API.
</Note>

<Note>
Control UI Talk prend en charge les sessions Google Live dans le navigateur avec des
jetons contraints à usage unique. Les fournisseurs vocaux temps réel côté backend uniquement
peuvent aussi passer par le transport de relais générique du Gateway, qui conserve
les identifiants du fournisseur sur le Gateway.
</Note>

Pour la vérification live par les mainteneurs, exécutez
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Le segment Google émet la même forme de jeton contraint Live API que celle utilisée par Control
UI Talk, ouvre le point de terminaison WebSocket du navigateur, envoie la charge utile de configuration initiale
et attend `setupComplete`.

## Configuration avancée

<AccordionGroup>
  <Accordion title="Réutilisation directe du cache Gemini">
    Pour les exécutions directes de Gemini API (`api: "google-generative-ai"`), OpenClaw
    transmet un handle `cachedContent` configuré aux requêtes Gemini.

    - Configurez les paramètres par modèle ou globaux avec
      `cachedContent` ou l’ancien `cached_content`
    - Si les deux sont présents, `cachedContent` l’emporte
    - Exemple de valeur : `cachedContents/prebuilt-context`
    - L’utilisation des succès de cache Gemini est normalisée dans `cacheRead` OpenClaw à partir de
      `cachedContentTokenCount` en amont

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

  <Accordion title="Notes d’utilisation JSON de Gemini CLI">
    Lors de l’utilisation du fournisseur OAuth `google-gemini-cli`, OpenClaw normalise
    la sortie JSON de la CLI comme suit :

    - Le texte de réponse provient du champ `response` du JSON de la CLI.
    - L’utilisation se replie sur `stats` lorsque la CLI laisse `usage` vide.
    - `stats.cached` est normalisé dans `cacheRead` OpenClaw.
    - Si `stats.input` est absent, OpenClaw déduit les jetons d’entrée de
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Configuration de l’environnement et du daemon">
    Si le Gateway s’exécute comme daemon (launchd/systemd), assurez-vous que `GEMINI_API_KEY`
    est disponible pour ce processus (par exemple, dans `~/.openclaw/.env` ou via
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Associés

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèle et du comportement de basculement.
  </Card>
  <Card title="Génération d’image" href="/fr/tools/image-generation" icon="image">
    Paramètres partagés de l’outil image et sélection du fournisseur.
  </Card>
  <Card title="Génération de vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres partagés de l’outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="Génération de musique" href="/fr/tools/music-generation" icon="music">
    Paramètres partagés de l’outil musique et sélection du fournisseur.
  </Card>
</CardGroup>
