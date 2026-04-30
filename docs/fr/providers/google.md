---
read_when:
    - Vous souhaitez utiliser les modèles Google Gemini avec OpenClaw
    - Vous avez besoin de la clé API ou du flux d’authentification OAuth
summary: Configuration de Google Gemini (clé API + OAuth, génération d’images, compréhension des médias, synthèse vocale, recherche web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-30T07:43:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: ea4b53dcea10fef67920da3baca4c85325ee4d4da780fbf708b67bc618e064a6
    source_path: providers/google.md
    workflow: 16
---

Le Plugin Google donne accès aux modèles Gemini via Google AI Studio, ainsi qu’à
la génération d’images, la compréhension des médias (image/audio/vidéo), la synthèse vocale et la recherche web via
Gemini Grounding.

- Fournisseur : `google`
- Authentification : `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- API : Google Gemini API
- Option d’exécution : `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  réutilise l’OAuth de Gemini CLI tout en conservant les références de modèles canoniques sous la forme `google/*`.

## Démarrage

Choisissez votre méthode d’authentification préférée et suivez les étapes de configuration.

<Tabs>
  <Tab title="API key">
    **Idéal pour :** un accès standard à Gemini API via Google AI Studio.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Ou passez directement la clé :

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
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
    **Idéal pour :** réutiliser une connexion Gemini CLI existante via OAuth PKCE au lieu d’une clé API séparée.

    <Warning>
    Le fournisseur `google-gemini-cli` est une intégration non officielle. Certains utilisateurs
    signalent des restrictions de compte lors de l’utilisation d’OAuth de cette façon. À utiliser à vos propres risques.
    </Warning>

    <Steps>
      <Step title="Install the Gemini CLI">
        La commande locale `gemini` doit être disponible dans `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw prend en charge les installations Homebrew et les installations npm globales, y compris
        les agencements Windows/npm courants.
      </Step>
      <Step title="Log in via OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Modèle par défaut : `google/gemini-3.1-pro-preview`
    - Runtime : `google-gemini-cli`
    - Alias : `gemini-cli`

    L’identifiant de modèle Gemini API de Gemini 3.1 Pro est `gemini-3.1-pro-preview`. OpenClaw accepte le raccourci `google/gemini-3.1-pro` comme alias pratique et le normalise avant les appels au fournisseur.

    **Variables d’environnement :**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Ou les variantes `GEMINI_CLI_*`.)

    <Note>
    Si les requêtes OAuth de Gemini CLI échouent après la connexion, définissez `GOOGLE_CLOUD_PROJECT` ou
    `GOOGLE_CLOUD_PROJECT_ID` sur l’hôte du Gateway, puis réessayez.
    </Note>

    <Note>
    Si la connexion échoue avant le démarrage du flux dans le navigateur, assurez-vous que la commande locale `gemini`
    est installée et présente dans `PATH`.
    </Note>

    Les références de modèles `google-gemini-cli/*` sont des alias de compatibilité hérités. Les nouvelles
    configurations doivent utiliser des références de modèles `google/*` avec le runtime `google-gemini-cli`
    lorsqu’elles veulent une exécution locale de Gemini CLI.

  </Tab>
</Tabs>

## Capacités

| Capacité                    | Pris en charge                  |
| --------------------------- | ------------------------------- |
| Complétions de chat         | Oui                             |
| Génération d’images         | Oui                             |
| Génération de musique       | Oui                             |
| Synthèse vocale             | Oui                             |
| Voix en temps réel          | Oui (Google Live API)           |
| Compréhension d’images      | Oui                             |
| Transcription audio         | Oui                             |
| Compréhension de vidéos     | Oui                             |
| Recherche web (Grounding)   | Oui                             |
| Réflexion/raisonnement      | Oui (Gemini 2.5+ / Gemini 3+)   |
| Modèles Gemma 4             | Oui                             |

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
réécrit `thinkingBudget` vers un `thinkingLevel` Google pris en charge pour Gemma 4.
Définir la réflexion sur `off` conserve la réflexion désactivée au lieu de la mapper vers
`MINIMAL`.
</Tip>

## Génération d’images

Le fournisseur de génération d’images `google` inclus utilise par défaut
`google/gemini-3.1-flash-image-preview`.

- Prend aussi en charge `google/gemini-3-pro-image-preview`
- Génération : jusqu’à 4 images par requête
- Mode édition : activé, jusqu’à 5 images d’entrée
- Contrôles de géométrie : `size`, `aspectRatio` et `resolution`

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
Voir [Génération d’images](/fr/tools/image-generation) pour les paramètres d’outil partagés, la sélection de fournisseur et le comportement de basculement.
</Note>

## Génération de vidéos

Le Plugin `google` inclus enregistre aussi la génération de vidéos via l’outil partagé
`video_generate`.

- Modèle vidéo par défaut : `google/veo-3.1-fast-generate-preview`
- Modes : texte vers vidéo, image vers vidéo et flux de référence à une seule vidéo
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
Voir [Génération de vidéos](/fr/tools/video-generation) pour les paramètres d’outil partagés, la sélection de fournisseur et le comportement de basculement.
</Note>

## Génération de musique

Le Plugin `google` inclus enregistre aussi la génération de musique via l’outil partagé
`music_generate`.

- Modèle musical par défaut : `google/lyria-3-clip-preview`
- Prend aussi en charge `google/lyria-3-pro-preview`
- Contrôles de prompt : `lyrics` et `instrumental`
- Format de sortie : `mp3` par défaut, plus `wav` sur `google/lyria-3-pro-preview`
- Entrées de référence : jusqu’à 10 images
- Les exécutions adossées à une session se détachent via le flux partagé de tâche/statut, y compris `action: "status"`

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
Voir [Génération de musique](/fr/tools/music-generation) pour les paramètres d’outil partagés, la sélection de fournisseur et le comportement de basculement.
</Note>

## Synthèse vocale

Le fournisseur vocal `google` inclus utilise le chemin TTS de Gemini API avec
`gemini-3.1-flash-tts-preview`.

- Voix par défaut : `Kore`
- Authentification : `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- Sortie : WAV pour les pièces jointes TTS standard, Opus pour les cibles de notes vocales, PCM pour Talk/la téléphonie
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

Le TTS de Gemini API utilise des prompts en langage naturel pour le contrôle du style. Définissez
`audioProfile` pour préfixer un prompt de style réutilisable avant le texte parlé. Définissez
`speakerName` lorsque votre texte de prompt fait référence à un locuteur nommé.

Le TTS de Gemini API accepte aussi des balises audio expressives entre crochets dans le texte,
comme `[whispers]` ou `[laughs]`. Pour garder les balises hors de la réponse de chat visible
tout en les envoyant au TTS, placez-les dans un bloc `[[tts:text]]...[[/tts:text]]` :

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Une clé API Google Cloud Console limitée à Gemini API est valide pour ce
fournisseur. Il ne s’agit pas du chemin séparé de Cloud Text-to-Speech API.
</Note>

## Voix en temps réel

Le Plugin `google` inclus enregistre un fournisseur de voix en temps réel adossé à
Gemini Live API pour les ponts audio backend comme Voice Call et Google Meet.

| Paramètre                  | Chemin de configuration                                            | Par défaut                                                                            |
| -------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Modèle                     | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Voix                       | `...google.voice`                                                  | `Kore`                                                                                |
| Température                | `...google.temperature`                                            | (non défini)                                                                          |
| Sensibilité de début VAD   | `...google.startSensitivity`                                       | (non défini)                                                                          |
| Sensibilité de fin VAD     | `...google.endSensitivity`                                         | (non défini)                                                                          |
| Durée du silence           | `...google.silenceDurationMs`                                      | (non défini)                                                                          |
| Gestion de l’activité      | `...google.activityHandling`                                       | Valeur par défaut de Google, `start-of-activity-interrupts`                           |
| Couverture du tour         | `...google.turnCoverage`                                           | Valeur par défaut de Google, `only-activity`                                          |
| Désactiver le VAD auto     | `...google.automaticActivityDetectionDisabled`                     | `false`                                                                               |
| Clé API                    | `...google.apiKey`                                                 | Repli vers `models.providers.google.apiKey`, `GEMINI_API_KEY` ou `GOOGLE_API_KEY`     |

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
Google Live API utilise l’audio bidirectionnel et les appels de fonctions via un WebSocket.
OpenClaw adapte l’audio du pont téléphonie/Meet au flux PCM Live API de Gemini et
conserve les appels d’outils sur le contrat vocal temps réel partagé. Laissez `temperature`
non défini sauf si vous devez modifier l’échantillonnage ; OpenClaw omet les valeurs non positives
car Google Live peut renvoyer des transcriptions sans audio pour `temperature: 0`.
La transcription Gemini API est activée sans `languageCodes` ; le SDK Google actuel
rejette les indications de codes de langue sur ce chemin d’API.
</Note>

<Note>
Control UI Talk prend en charge les sessions de navigateur Google Live avec des jetons
à usage unique contraints. Les fournisseurs vocaux temps réel côté backend uniquement
peuvent également passer par le transport de relais générique du Gateway, qui conserve
les identifiants du fournisseur sur le Gateway.
</Note>

Pour la vérification live des mainteneurs, exécutez
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Le segment Google émet la même forme de jeton Live API contraint que celle utilisée par Control
UI Talk, ouvre le point de terminaison WebSocket du navigateur, envoie la charge utile de configuration initiale,
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
    - L’utilisation des accès au cache Gemini est normalisée dans OpenClaw `cacheRead` depuis
      le champ amont `cachedContentTokenCount`

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

  <Accordion title="Notes d’utilisation JSON de la CLI Gemini">
    Lors de l’utilisation du fournisseur OAuth `google-gemini-cli`, OpenClaw normalise
    la sortie JSON de la CLI comme suit :

    - Le texte de réponse provient du champ `response` du JSON de la CLI.
    - L’utilisation se rabat sur `stats` lorsque la CLI laisse `usage` vide.
    - `stats.cached` est normalisé dans OpenClaw `cacheRead`.
    - Si `stats.input` est absent, OpenClaw déduit les jetons d’entrée depuis
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Configuration de l’environnement et du démon">
    Si le Gateway s’exécute comme démon (launchd/systemd), assurez-vous que `GEMINI_API_KEY`
    est disponible pour ce processus (par exemple, dans `~/.openclaw/.env` ou via
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Connexe

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèle et du comportement de basculement.
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
