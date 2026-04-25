---
read_when:
    - Vous voulez utiliser les modèles Google Gemini avec OpenClaw
    - Vous avez besoin du flux d’authentification par clé API ou OAuth
summary: Configuration de Google Gemini (clé API + OAuth, génération d’images, compréhension des médias, TTS, recherche web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-25T13:55:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: de0d6563d1c7a25fe26aa7ce255b1d3ed80e950b7761039e6d0a76f23a14e6f3
    source_path: providers/google.md
    workflow: 15
---

Le plugin Google fournit un accès aux modèles Gemini via Google AI Studio, ainsi que la
génération d’images, la compréhension des médias (image/audio/vidéo), le text-to-speech, et la recherche web via
Gemini Grounding.

- Fournisseur : `google`
- Authentification : `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- API : Google Gemini API
- Option de runtime : `agents.defaults.embeddedHarness.runtime: "google-gemini-cli"`
  réutilise l’OAuth Gemini CLI tout en conservant des références de modèle canoniques en `google/*`.

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

        Ou passez directement la clé :

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
    signalent des restrictions de compte lorsqu’ils utilisent OAuth de cette manière. Utilisez-le à vos risques et périls.
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
    Si les requêtes OAuth Gemini CLI échouent après la connexion, définissez `GOOGLE_CLOUD_PROJECT` ou
    `GOOGLE_CLOUD_PROJECT_ID` sur l’hôte gateway puis réessayez.
    </Note>

    <Note>
    Si la connexion échoue avant le démarrage du flux navigateur, assurez-vous que la commande locale `gemini`
    est installée et présente dans le `PATH`.
    </Note>

    Les références de modèle `google-gemini-cli/*` sont des alias de compatibilité hérités. Les nouvelles
    configurations doivent utiliser les références de modèle `google/*` plus le runtime `google-gemini-cli`
    lorsqu’elles veulent une exécution locale Gemini CLI.

  </Tab>
</Tabs>

## Capacités

| Capacité              | Pris en charge                |
| --------------------- | ----------------------------- |
| Chat completions      | Oui                           |
| Génération d’images   | Oui                           |
| Génération musicale   | Oui                           |
| Text-to-speech        | Oui                           |
| Voix en temps réel    | Oui (Google Live API)         |
| Compréhension d’image | Oui                           |
| Transcription audio   | Oui                           |
| Compréhension vidéo   | Oui                           |
| Recherche web (Grounding) | Oui                       |
| Réflexion/raisonnement | Oui (Gemini 2.5+ / Gemini 3+) |
| Modèles Gemma 4       | Oui                           |

<Tip>
Les modèles Gemini 3 utilisent `thinkingLevel` plutôt que `thinkingBudget`. OpenClaw mappe
les contrôles de raisonnement de Gemini 3, Gemini 3.1, et des alias `gemini-*-latest` vers
`thinkingLevel` afin que les exécutions par défaut/à faible latence n’envoient pas de valeurs
`thinkingBudget` désactivées.

`/think adaptive` conserve la sémantique de réflexion dynamique de Google au lieu de choisir
un niveau OpenClaw fixe. Gemini 3 et Gemini 3.1 omettent un `thinkingLevel` fixe afin que
Google puisse choisir le niveau ; Gemini 2.5 envoie le sentinel dynamique Google
`thinkingBudget: -1`.

Les modèles Gemma 4 (par exemple `gemma-4-26b-a4b-it`) prennent en charge le mode réflexion. OpenClaw
réécrit `thinkingBudget` en un `thinkingLevel` Google pris en charge pour Gemma 4.
Définir la réflexion sur `off` conserve la réflexion désactivée au lieu de la mapper vers
`MINIMAL`.
</Tip>

## Génération d’images

Le fournisseur intégré de génération d’images `google` utilise par défaut
`google/gemini-3.1-flash-image-preview`.

- Prend aussi en charge `google/gemini-3-pro-image-preview`
- Génération : jusqu’à 4 images par requête
- Mode édition : activé, jusqu’à 5 images d’entrée
- Contrôles de géométrie : `size`, `aspectRatio`, et `resolution`

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
Voir [Génération d’images](/fr/tools/image-generation) pour les paramètres d’outil partagés, la sélection du fournisseur et le comportement de basculement.
</Note>

## Génération vidéo

Le plugin `google` intégré enregistre aussi la génération vidéo via l’outil partagé
`video_generate`.

- Modèle vidéo par défaut : `google/veo-3.1-fast-generate-preview`
- Modes : texte-vers-vidéo, image-vers-vidéo, et flux à référence vidéo unique
- Prend en charge `aspectRatio`, `resolution`, et `audio`
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
Voir [Génération vidéo](/fr/tools/video-generation) pour les paramètres d’outil partagés, la sélection du fournisseur et le comportement de basculement.
</Note>

## Génération musicale

Le plugin `google` intégré enregistre aussi la génération musicale via l’outil partagé
`music_generate`.

- Modèle musical par défaut : `google/lyria-3-clip-preview`
- Prend aussi en charge `google/lyria-3-pro-preview`
- Contrôles de prompt : `lyrics` et `instrumental`
- Format de sortie : `mp3` par défaut, plus `wav` sur `google/lyria-3-pro-preview`
- Entrées de référence : jusqu’à 10 images
- Les exécutions adossées à une session se détachent via le flux partagé tâche/statut, y compris `action: "status"`

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
Voir [Génération musicale](/fr/tools/music-generation) pour les paramètres d’outil partagés, la sélection du fournisseur et le comportement de basculement.
</Note>

## Text-to-speech

Le fournisseur de parole intégré `google` utilise le chemin TTS de la Gemini API avec
`gemini-3.1-flash-tts-preview`.

- Voix par défaut : `Kore`
- Authentification : `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY`, ou `GOOGLE_API_KEY`
- Sortie : WAV pour les pièces jointes TTS normales, PCM pour Talk/téléphonie
- Sortie native de note vocale : non prise en charge sur ce chemin Gemini API parce que l’API renvoie du PCM plutôt que de l’Opus

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
          audioProfile: "Parlez avec professionnalisme sur un ton calme.",
        },
      },
    },
  },
}
```

Le TTS Gemini API utilise des prompts en langage naturel pour le contrôle du style. Définissez
`audioProfile` pour préfixer un prompt de style réutilisable avant le texte parlé. Définissez
`speakerName` lorsque le texte de votre prompt fait référence à un locuteur nommé.

Le TTS Gemini API accepte aussi des balises audio expressives entre crochets dans le texte,
comme `[whispers]` ou `[laughs]`. Pour garder les balises hors de la réponse visible dans le chat
tout en les envoyant au TTS, placez-les dans un bloc `[[tts:text]]...[[/tts:text]]` :

```text
Voici le texte de réponse propre.

[[tts:text]][whispers] Voici la version parlée.[[/tts:text]]
```

<Note>
Une clé API Google Cloud Console restreinte à la Gemini API est valide pour ce
fournisseur. Ce n’est pas le chemin séparé de Cloud Text-to-Speech API.
</Note>

## Voix en temps réel

Le plugin `google` intégré enregistre un fournisseur vocal en temps réel adossé à la
Gemini Live API pour les ponts audio backend tels que Voice Call et Google Meet.

| Paramètre             | Chemin de configuration                                               | Par défaut                                                                            |
| --------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Modèle                | `plugins.entries.voice-call.config.realtime.providers.google.model`   | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Voix                  | `...google.voice`                                                     | `Kore`                                                                                |
| Température           | `...google.temperature`                                               | (non défini)                                                                          |
| Sensibilité de départ VAD | `...google.startSensitivity`                                      | (non défini)                                                                          |
| Sensibilité de fin VAD | `...google.endSensitivity`                                           | (non défini)                                                                          |
| Durée du silence      | `...google.silenceDurationMs`                                         | (non défini)                                                                          |
| Clé API               | `...google.apiKey`                                                    | Solution de repli vers `models.providers.google.apiKey`, `GEMINI_API_KEY`, ou `GOOGLE_API_KEY` |

Exemple de configuration Voice Call en temps réel :

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
Google Live API utilise l’audio bidirectionnel et l’appel de fonction via un WebSocket.
OpenClaw adapte l’audio des ponts de téléphonie/Meet au flux PCM Live API de Gemini et
conserve les appels d’outil sur le contrat partagé de voix en temps réel. Laissez `temperature`
non défini sauf si vous avez besoin de changements d’échantillonnage ; OpenClaw omet les valeurs non positives
car Google Live peut renvoyer des transcriptions sans audio pour `temperature: 0`.
La transcription Gemini API est activée sans `languageCodes` ; le SDK Google actuel
rejette les indications de code de langue sur ce chemin API.
</Note>

<Note>
Les sessions navigateur Talk de l’UI de contrôle exigent toujours un fournisseur vocal en temps réel avec une
implémentation de session WebRTC navigateur. Aujourd’hui, ce chemin est OpenAI Realtime ; le
fournisseur Google est destiné aux ponts en temps réel backend.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Réutilisation directe du cache Gemini">
    Pour les exécutions directes Gemini API (`api: "google-generative-ai"`), OpenClaw
    transmet un handle `cachedContent` configuré aux requêtes Gemini.

    - Configurez les paramètres par modèle ou globaux avec
      `cachedContent` ou l’ancien `cached_content`
    - Si les deux sont présents, `cachedContent` l’emporte
    - Exemple de valeur : `cachedContents/prebuilt-context`
    - L’usage Gemini avec hit de cache est normalisé en `cacheRead` OpenClaw à partir de
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

  <Accordion title="Remarques sur l’usage JSON de Gemini CLI">
    Lors de l’utilisation du fournisseur OAuth `google-gemini-cli`, OpenClaw normalise
    la sortie JSON de la CLI comme suit :

    - Le texte de réponse provient du champ JSON `response` de la CLI.
    - L’usage se replie sur `stats` lorsque la CLI laisse `usage` vide.
    - `stats.cached` est normalisé en `cacheRead` OpenClaw.
    - Si `stats.input` est absent, OpenClaw dérive les jetons d’entrée à partir de
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Configuration de l’environnement et du daemon">
    Si le Gateway s’exécute comme daemon (launchd/systemd), assurez-vous que `GEMINI_API_KEY`
    est disponible pour ce processus (par exemple dans `~/.openclaw/.env` ou via
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Connexes

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèle et le comportement de basculement.
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
