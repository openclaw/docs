---
read_when:
    - Vous souhaitez utiliser des modèles Google Gemini avec OpenClaw
    - Vous avez besoin de la clé API ou du flux d’authentification OAuth
summary: Configuration de Google Gemini (clé API + OAuth, génération d’images, compréhension des médias, TTS, recherche web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-26T11:37:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 312c7a5bc433831d98d1d47c42c5cac6a4cd8d4948ddbf16f1ae11aaec7a0339
    source_path: providers/google.md
    workflow: 15
---

Le Plugin Google fournit un accès aux modèles Gemini via Google AI Studio, ainsi que
la génération d’images, la compréhension des médias (image/audio/vidéo), la synthèse vocale et la recherche web via
Gemini Grounding.

- Fournisseur : `google`
- Authentification : `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- API : API Google Gemini
- Option de runtime : `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  réutilise l’authentification OAuth de Gemini CLI tout en conservant des références de modèle canoniques sous la forme `google/*`.

## Premiers pas

Choisissez votre méthode d’authentification préférée et suivez les étapes de configuration.

<Tabs>
  <Tab title="Clé API">
    **Idéal pour :** accès standard à l’API Gemini via Google AI Studio.

    <Steps>
      <Step title="Lancer l’onboarding">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Ou passez la clé directement :

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
    **Idéal pour :** réutiliser une connexion Gemini CLI existante via PKCE OAuth au lieu d’une clé API distincte.

    <Warning>
    Le fournisseur `google-gemini-cli` est une intégration non officielle. Certains utilisateurs
    signalent des restrictions de compte lors de l’utilisation d’OAuth de cette manière. Utilisez-le à vos propres risques.
    </Warning>

    <Steps>
      <Step title="Installer Gemini CLI">
        La commande locale `gemini` doit être disponible dans le `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # ou npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw prend en charge à la fois les installations Homebrew et les installations npm globales, y compris
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

    **Variables d’environnement :**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Ou les variantes `GEMINI_CLI_*`.)

    <Note>
    Si les requêtes OAuth de Gemini CLI échouent après la connexion, définissez `GOOGLE_CLOUD_PROJECT` ou
    `GOOGLE_CLOUD_PROJECT_ID` sur l’hôte Gateway, puis réessayez.
    </Note>

    <Note>
    Si la connexion échoue avant le démarrage du flux navigateur, assurez-vous que la commande locale `gemini`
    est installée et présente dans le `PATH`.
    </Note>

    Les références de modèle `google-gemini-cli/*` sont des alias de compatibilité hérités. Les nouvelles
    configurations doivent utiliser des références de modèle `google/*` plus le runtime `google-gemini-cli`
    lorsqu’elles veulent une exécution Gemini CLI locale.

  </Tab>
</Tabs>

## Capacités

| Capacité               | Pris en charge                |
| ---------------------- | ----------------------------- |
| Complétions de chat    | Oui                           |
| Génération d’images    | Oui                           |
| Génération musicale    | Oui                           |
| Synthèse vocale        | Oui                           |
| Voix temps réel        | Oui (Google Live API)         |
| Compréhension d’image  | Oui                           |
| Transcription audio    | Oui                           |
| Compréhension vidéo    | Oui                           |
| Recherche web (Grounding) | Oui                        |
| Réflexion/raisonnement | Oui (Gemini 2.5+ / Gemini 3+) |
| Modèles Gemma 4        | Oui                           |

<Tip>
Les modèles Gemini 3 utilisent `thinkingLevel` plutôt que `thinkingBudget`. OpenClaw mappe
les contrôles de raisonnement de Gemini 3, Gemini 3.1 et des alias `gemini-*-latest` vers
`thinkingLevel` afin que les exécutions par défaut ou à faible latence n’envoient pas de valeurs
`thinkingBudget` désactivées.

`/think adaptive` conserve la sémantique de réflexion dynamique de Google au lieu de choisir
un niveau OpenClaw fixe. Gemini 3 et Gemini 3.1 omettent un `thinkingLevel` fixe afin que
Google puisse choisir le niveau ; Gemini 2.5 envoie la valeur sentinelle dynamique de Google
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
Consultez [Génération d’images](/fr/tools/image-generation) pour les paramètres d’outil partagés, la sélection du fournisseur et le comportement de bascule.
</Note>

## Génération vidéo

Le Plugin `google` inclus enregistre également la génération vidéo via l’outil partagé
`video_generate`.

- Modèle vidéo par défaut : `google/veo-3.1-fast-generate-preview`
- Modes : texte-vers-vidéo, image-vers-vidéo et flux de référence vidéo unique
- Prend en charge `aspectRatio`, `resolution` et `audio`
- Limite actuelle de durée : **4 à 8 secondes**

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
Consultez [Génération vidéo](/fr/tools/video-generation) pour les paramètres d’outil partagés, la sélection du fournisseur et le comportement de bascule.
</Note>

## Génération musicale

Le Plugin `google` inclus enregistre également la génération musicale via l’outil partagé
`music_generate`.

- Modèle musical par défaut : `google/lyria-3-clip-preview`
- Prend aussi en charge `google/lyria-3-pro-preview`
- Contrôles de prompt : `lyrics` et `instrumental`
- Format de sortie : `mp3` par défaut, plus `wav` sur `google/lyria-3-pro-preview`
- Entrées de référence : jusqu’à 10 images
- Les exécutions basées sur une session sont détachées via le flux partagé tâche/statut, y compris `action: "status"`

Pour utiliser Google comme fournisseur musical par défaut :

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
Consultez [Génération musicale](/fr/tools/music-generation) pour les paramètres d’outil partagés, la sélection du fournisseur et le comportement de bascule.
</Note>

## Synthèse vocale

Le fournisseur vocal `google` inclus utilise le chemin TTS de l’API Gemini avec
`gemini-3.1-flash-tts-preview`.

- Voix par défaut : `Kore`
- Authentification : `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- Sortie : WAV pour les pièces jointes TTS classiques, Opus pour les cibles de note vocale, PCM pour Talk/téléphonie
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
          audioProfile: "Parlez avec professionnalisme et un ton calme.",
        },
      },
    },
  },
}
```

Le TTS de l’API Gemini utilise des prompts en langage naturel pour le contrôle du style. Définissez
`audioProfile` pour préfixer un prompt de style réutilisable avant le texte parlé. Définissez
`speakerName` lorsque le texte de votre prompt fait référence à un locuteur nommé.

Le TTS de l’API Gemini accepte également des balises audio expressives entre crochets dans le texte,
comme `[whispers]` ou `[laughs]`. Pour garder les balises hors de la réponse de chat visible
tout en les envoyant au TTS, placez-les dans un bloc `[[tts:text]]...[[/tts:text]]` :

```text
Voici le texte de réponse propre.

[[tts:text]][whispers] Voici la version parlée.[[/tts:text]]
```

<Note>
Une clé API Google Cloud Console restreinte à l’API Gemini est valide pour ce
fournisseur. Il ne s’agit pas du chemin distinct de l’API Cloud Text-to-Speech.
</Note>

## Voix temps réel

Le Plugin `google` inclus enregistre un fournisseur vocal temps réel reposant sur la
Google Live API pour les ponts audio backend tels que Voice Call et Google Meet.

| Paramètre             | Chemin de configuration                                              | Par défaut                                                                          |
| --------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Modèle                | `plugins.entries.voice-call.config.realtime.providers.google.model`  | `gemini-2.5-flash-native-audio-preview-12-2025`                                     |
| Voix                  | `...google.voice`                                                    | `Kore`                                                                              |
| Température           | `...google.temperature`                                              | (non défini)                                                                        |
| Sensibilité de début VAD | `...google.startSensitivity`                                      | (non défini)                                                                        |
| Sensibilité de fin VAD   | `...google.endSensitivity`                                        | (non défini)                                                                        |
| Durée du silence      | `...google.silenceDurationMs`                                        | (non défini)                                                                        |
| Clé API               | `...google.apiKey`                                                   | Revient à `models.providers.google.apiKey`, `GEMINI_API_KEY` ou `GOOGLE_API_KEY`   |

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
Google Live API utilise l’audio bidirectionnel et l’appel de fonctions sur un WebSocket.
OpenClaw adapte l’audio des ponts téléphonie/Meet au flux Live API PCM de Gemini et
conserve les appels d’outils sur le contrat vocal temps réel partagé. Laissez `temperature`
non défini sauf si vous avez besoin de modifier l’échantillonnage ; OpenClaw omet les valeurs non positives
car Google Live peut renvoyer des transcriptions sans audio pour `temperature: 0`.
La transcription de l’API Gemini est activée sans `languageCodes` ; le SDK Google actuel
rejette les indications de code langue sur ce chemin API.
</Note>

<Note>
Les sessions navigateur Talk dans l’interface de contrôle nécessitent toujours un fournisseur vocal temps réel avec une
implémentation de session WebRTC navigateur. Aujourd’hui, ce chemin est OpenAI Realtime ; le
fournisseur Google est destiné aux ponts temps réel backend.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Réutilisation directe du cache Gemini">
    Pour les exécutions directes de l’API Gemini (`api: "google-generative-ai"`), OpenClaw
    transmet un handle `cachedContent` configuré aux requêtes Gemini.

    - Configurez des paramètres globaux ou par modèle avec
      `cachedContent` ou l’ancien `cached_content`
    - Si les deux sont présents, `cachedContent` est prioritaire
    - Exemple de valeur : `cachedContents/prebuilt-context`
    - L’utilisation des cache hits de Gemini est normalisée dans OpenClaw en `cacheRead` à partir de
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

  <Accordion title="Notes sur l’utilisation JSON de Gemini CLI">
    Lors de l’utilisation du fournisseur OAuth `google-gemini-cli`, OpenClaw normalise
    la sortie JSON du CLI comme suit :

    - Le texte de réponse provient du champ JSON `response` du CLI.
    - L’utilisation revient à `stats` lorsque le CLI laisse `usage` vide.
    - `stats.cached` est normalisé en `cacheRead` dans OpenClaw.
    - Si `stats.input` est manquant, OpenClaw dérive les jetons d’entrée à partir de
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Configuration de l’environnement et du daemon">
    Si la Gateway s’exécute comme un daemon (launchd/systemd), assurez-vous que `GEMINI_API_KEY`
    est disponible pour ce processus (par exemple dans `~/.openclaw/.env` ou via
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Lié

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de bascule.
  </Card>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Paramètres d’outil d’image partagés et sélection du fournisseur.
  </Card>
  <Card title="Génération vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres d’outil vidéo partagés et sélection du fournisseur.
  </Card>
  <Card title="Génération musicale" href="/fr/tools/music-generation" icon="music">
    Paramètres d’outil musical partagés et sélection du fournisseur.
  </Card>
</CardGroup>
