---
read_when:
    - Vous souhaitez utiliser les modèles Google Gemini avec OpenClaw
    - Vous avez besoin de la clé API ou du flux d’authentification OAuth
summary: Configuration de Google Gemini (clé API + OAuth, génération d’images, compréhension des médias, TTS, recherche web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-24T08:57:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e66c9dd637e26976659d04b9b7e2452e6881945dab6011970f9e1c5e4a9a685
    source_path: providers/google.md
    workflow: 15
---

Le plugin Google fournit l’accès aux modèles Gemini via Google AI Studio, ainsi que la
génération d’images, la compréhension des médias (image/audio/vidéo), la synthèse vocale et la recherche web via
Gemini Grounding.

- Fournisseur : `google`
- Authentification : `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- API : API Google Gemini
- Fournisseur alternatif : `google-gemini-cli` (OAuth)

## Premiers pas

Choisissez votre méthode d’authentification préférée et suivez les étapes de configuration.

<Tabs>
  <Tab title="Clé API">
    **Idéal pour :** l’accès standard à l’API Gemini via Google AI Studio.

    <Steps>
      <Step title="Lancer l’onboarding">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Ou transmettez directement la clé :

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
    **Idéal pour :** réutiliser une connexion Gemini CLI existante via OAuth PKCE au lieu d’une clé API distincte.

    <Warning>
    Le fournisseur `google-gemini-cli` est une intégration non officielle. Certains utilisateurs
    signalent des restrictions de compte lors de l’utilisation d’OAuth de cette façon. Utilisez-le à vos propres risques.
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

        OpenClaw prend en charge les installations Homebrew et les installations npm globales, y compris
        les configurations courantes Windows/npm.
      </Step>
      <Step title="Se connecter via OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider google-gemini-cli
        ```
      </Step>
    </Steps>

    - Modèle par défaut : `google-gemini-cli/gemini-3-flash-preview`
    - Alias : `gemini-cli`

    **Variables d’environnement :**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Ou les variantes `GEMINI_CLI_*`.)

    <Note>
    Si les requêtes OAuth Gemini CLI échouent après la connexion, définissez `GOOGLE_CLOUD_PROJECT` ou
    `GOOGLE_CLOUD_PROJECT_ID` sur l’hôte du gateway, puis réessayez.
    </Note>

    <Note>
    Si la connexion échoue avant le démarrage du flux navigateur, assurez-vous que la commande locale `gemini`
    est installée et disponible dans le `PATH`.
    </Note>

    Le fournisseur `google-gemini-cli`, limité à OAuth, constitue une surface distincte
    d’inférence de texte. La génération d’images, la compréhension des médias et Gemini Grounding restent sur
    l’identifiant de fournisseur `google`.

  </Tab>
</Tabs>

## Capacités

| Capability             | Pris en charge                 |
| ---------------------- | ------------------------------ |
| Chat completions       | Oui                            |
| Image generation       | Oui                            |
| Music generation       | Oui                            |
| Text-to-speech         | Oui                            |
| Realtime voice         | Oui (Google Live API)          |
| Image understanding    | Oui                            |
| Audio transcription    | Oui                            |
| Video understanding    | Oui                            |
| Web search (Grounding) | Oui                            |
| Thinking/reasoning     | Oui (Gemini 2.5+ / Gemini 3+)  |
| Gemma 4 models         | Oui                            |

<Tip>
Les modèles Gemini 3 utilisent `thinkingLevel` plutôt que `thinkingBudget`. OpenClaw mappe
les contrôles de raisonnement des alias Gemini 3, Gemini 3.1 et `gemini-*-latest` vers
`thinkingLevel` afin que les exécutions par défaut/à faible latence n’envoient pas de valeurs
`thinkingBudget` désactivées.

Les modèles Gemma 4 (par exemple `gemma-4-26b-a4b-it`) prennent en charge le mode de réflexion. OpenClaw
réécrit `thinkingBudget` vers un `thinkingLevel` Google pris en charge pour Gemma 4.
Définir la réflexion sur `off` conserve la réflexion désactivée au lieu de la mapper vers
`MINIMAL`.
</Tip>

## Génération d’images

Le fournisseur groupé de génération d’images `google` utilise par défaut
`google/gemini-3.1-flash-image-preview`.

- Prend aussi en charge `google/gemini-3-pro-image-preview`
- Génération : jusqu’à 4 images par requête
- Mode édition : activé, jusqu’à 5 images d’entrée
- Contrôles de géométrie : `size`, `aspectRatio` et `resolution`

Pour utiliser Google comme fournisseur d’images par défaut :

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
Voir [Image Generation](/fr/tools/image-generation) pour les paramètres d’outil partagés, la sélection du fournisseur et le comportement de basculement.
</Note>

## Génération vidéo

Le plugin groupé `google` enregistre aussi la génération vidéo via l’outil partagé
`video_generate`.

- Modèle vidéo par défaut : `google/veo-3.1-fast-generate-preview`
- Modes : texte vers vidéo, image vers vidéo et flux de référence à vidéo unique
- Prend en charge `aspectRatio`, `resolution` et `audio`
- Limitation actuelle de durée : **4 à 8 secondes**

Pour utiliser Google comme fournisseur vidéo par défaut :

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
Voir [Video Generation](/fr/tools/video-generation) pour les paramètres d’outil partagés, la sélection du fournisseur et le comportement de basculement.
</Note>

## Génération musicale

Le plugin groupé `google` enregistre aussi la génération musicale via l’outil partagé
`music_generate`.

- Modèle musical par défaut : `google/lyria-3-clip-preview`
- Prend aussi en charge `google/lyria-3-pro-preview`
- Contrôles du prompt : `lyrics` et `instrumental`
- Format de sortie : `mp3` par défaut, plus `wav` sur `google/lyria-3-pro-preview`
- Entrées de référence : jusqu’à 10 images
- Les exécutions adossées à une session se détachent via le flux partagé de tâche/statut, y compris `action: "status"`

Pour utiliser Google comme fournisseur musical par défaut :

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
Voir [Music Generation](/fr/tools/music-generation) pour les paramètres d’outil partagés, la sélection du fournisseur et le comportement de basculement.
</Note>

## Synthèse vocale

Le fournisseur vocal groupé `google` utilise le chemin TTS de l’API Gemini avec
`gemini-3.1-flash-tts-preview`.

- Voix par défaut : `Kore`
- Authentification : `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- Sortie : WAV pour les pièces jointes TTS classiques, PCM pour Talk/téléphonie
- Sortie native de note vocale : non prise en charge sur ce chemin d’API Gemini, car l’API renvoie du PCM plutôt que de l’Opus

Pour utiliser Google comme fournisseur TTS par défaut :

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
        },
      },
    },
  },
}
```

Le TTS de l’API Gemini accepte des balises audio expressives entre crochets dans le texte, telles que
`[whispers]` ou `[laughs]`. Pour garder les balises hors de la réponse visible dans le chat tout en
les envoyant au TTS, placez-les dans un bloc `[[tts:text]]...[[/tts:text]]` :

```text
Voici le texte propre de la réponse.

[[tts:text]][whispers] Voici la version parlée.[[/tts:text]]
```

<Note>
Une clé API Google Cloud Console restreinte à l’API Gemini est valide pour ce
fournisseur. Il ne s’agit pas du chemin distinct de l’API Cloud Text-to-Speech.
</Note>

## Voix en temps réel

Le plugin groupé `google` enregistre un fournisseur vocal en temps réel adossé à la
Google Live API pour les ponts audio backend comme Voice Call et Google Meet.

| Réglage               | Chemin de configuration                                              | Par défaut                                                                           |
| --------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Modèle                | `plugins.entries.voice-call.config.realtime.providers.google.model`  | `gemini-2.5-flash-native-audio-preview-12-2025`                                      |
| Voix                  | `...google.voice`                                                    | `Kore`                                                                               |
| Température           | `...google.temperature`                                              | (non défini)                                                                         |
| Sensibilité de début VAD | `...google.startSensitivity`                                      | (non défini)                                                                         |
| Sensibilité de fin VAD   | `...google.endSensitivity`                                        | (non défini)                                                                         |
| Durée du silence      | `...google.silenceDurationMs`                                        | (non défini)                                                                         |
| Clé API               | `...google.apiKey`                                                   | Repli vers `models.providers.google.apiKey`, `GEMINI_API_KEY` ou `GOOGLE_API_KEY`   |

Exemple de configuration temps réel pour Voice Call :

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
Google Live API utilise l’audio bidirectionnel et l’appel de fonctions via un WebSocket.
OpenClaw adapte l’audio des ponts téléphonie/Meet au flux PCM de la Live API de Gemini et
conserve les appels d’outils sur le contrat partagé de voix en temps réel. Laissez `temperature`
non défini sauf si vous avez besoin de modifier l’échantillonnage ; OpenClaw omet les valeurs non positives
car Google Live peut renvoyer des transcriptions sans audio pour `temperature: 0`.
La transcription de l’API Gemini est activée sans `languageCodes` ; le SDK Google actuel
rejette les indications de code de langue sur ce chemin d’API.
</Note>

<Note>
Les sessions navigateur Talk de l’interface Control nécessitent toujours un fournisseur de voix en temps réel avec une
implémentation de session WebRTC dans le navigateur. Aujourd’hui, ce chemin est OpenAI Realtime ; le
fournisseur Google est destiné aux ponts backend en temps réel.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Réutilisation directe du cache Gemini">
    Pour les exécutions directes de l’API Gemini (`api: "google-generative-ai"`), OpenClaw
    transmet un handle `cachedContent` configuré aux requêtes Gemini.

    - Configurez des paramètres par modèle ou globaux avec
      `cachedContent` ou l’ancien `cached_content`
    - Si les deux sont présents, `cachedContent` est prioritaire
    - Exemple de valeur : `cachedContents/prebuilt-context`
    - L’utilisation des cache-hit Gemini est normalisée dans `cacheRead` d’OpenClaw à partir de
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

  <Accordion title="Notes d’utilisation du JSON Gemini CLI">
    Lors de l’utilisation du fournisseur OAuth `google-gemini-cli`, OpenClaw normalise
    la sortie JSON de la CLI comme suit :

    - Le texte de réponse provient du champ JSON `response` de la CLI.
    - L’usage se replie sur `stats` lorsque la CLI laisse `usage` vide.
    - `stats.cached` est normalisé dans `cacheRead` d’OpenClaw.
    - Si `stats.input` est absent, OpenClaw dérive les tokens d’entrée à partir de
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Configuration de l’environnement et du daemon">
    Si le Gateway s’exécute comme un daemon (launchd/systemd), assurez-vous que `GEMINI_API_KEY`
    est disponible pour ce processus (par exemple, dans `~/.openclaw/.env` ou via
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Lié

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèle et du comportement de basculement.
  </Card>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Paramètres partagés de l’outil d’image et sélection du fournisseur.
  </Card>
  <Card title="Génération vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres partagés de l’outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="Génération musicale" href="/fr/tools/music-generation" icon="music">
    Paramètres partagés de l’outil musical et sélection du fournisseur.
  </Card>
</CardGroup>
