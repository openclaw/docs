---
read_when:
    - Vous souhaitez utiliser les modèles Google Gemini avec OpenClaw
    - Vous avez besoin de la clé API ou du flux d’authentification OAuth
summary: Configuration de Google Gemini (clé API + OAuth, génération d’images, compréhension des médias, synthèse vocale, recherche Web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-16T06:56:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec2d62855f5e80efda758aad71bcaa95c38b1e41761fa1100d47a06c62881419
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

Le Plugin Google fournit un accès aux modèles Gemini via Google AI Studio, ainsi qu’à la
génération d’images, à la compréhension des médias (image/audio/vidéo), à la synthèse vocale et à la recherche Web via
Gemini Grounding.

- Fournisseur : `google`
- Authentification : `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- API : API Google Gemini
- Fournisseur alternatif : `google-gemini-cli` (OAuth)

## Premiers pas

Choisissez votre méthode d’authentification préférée et suivez les étapes de configuration.

<Tabs>
  <Tab title="Clé API">
    **Idéal pour :** l’accès standard à l’API Gemini via Google AI Studio.

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
    Les variables d’environnement `GEMINI_API_KEY` et `GOOGLE_API_KEY` sont toutes les deux acceptées. Utilisez celle que vous avez déjà configurée.
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
        La commande locale `gemini` doit être disponible dans le `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # ou npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw prend en charge les installations Homebrew et les installations npm globales, y compris
        les dispositions Windows/npm courantes.
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

    - Modèle par défaut : `google-gemini-cli/gemini-3-flash-preview`
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
    Si la connexion échoue avant le démarrage du flux dans le navigateur, assurez-vous que la commande locale `gemini`
    est installée et disponible dans le `PATH`.
    </Note>

    Le fournisseur `google-gemini-cli`, uniquement OAuth, est une surface distincte
    d’inférence de texte. La génération d’images, la compréhension des médias et Gemini Grounding restent sur
    l’id de fournisseur `google`.

  </Tab>
</Tabs>

## Capacités

| Capacité                     | Pris en charge    |
| ---------------------------- | ----------------- |
| Complétions de chat          | Oui               |
| Génération d’images          | Oui               |
| Génération musicale          | Oui               |
| Synthèse vocale              | Oui               |
| Compréhension d’images       | Oui               |
| Transcription audio          | Oui               |
| Compréhension vidéo          | Oui               |
| Recherche Web (Grounding)    | Oui               |
| Thinking/raisonnement        | Oui (Gemini 3.1+) |
| Modèles Gemma 4              | Oui               |

<Tip>
Les modèles Gemma 4 (par exemple `gemma-4-26b-a4b-it`) prennent en charge le mode thinking. OpenClaw
réécrit `thinkingBudget` en un `thinkingLevel` Google pris en charge pour Gemma 4.
Définir thinking sur `off` conserve la désactivation de thinking au lieu de le mapper sur
`MINIMAL`.
</Tip>

## Génération d’images

Le fournisseur groupé de génération d’images `google` utilise par défaut
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
Voir [Image Generation](/fr/tools/image-generation) pour les paramètres d’outil partagés, la sélection du fournisseur et le comportement de basculement.
</Note>

## Génération vidéo

Le Plugin groupé `google` enregistre également la génération vidéo via l’outil partagé
`video_generate`.

- Modèle vidéo par défaut : `google/veo-3.1-fast-generate-preview`
- Modes : texte vers vidéo, image vers vidéo et flux de référence à vidéo unique
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
Voir [Video Generation](/fr/tools/video-generation) pour les paramètres d’outil partagés, la sélection du fournisseur et le comportement de basculement.
</Note>

## Génération musicale

Le Plugin groupé `google` enregistre également la génération musicale via l’outil partagé
`music_generate`.

- Modèle musical par défaut : `google/lyria-3-clip-preview`
- Prend aussi en charge `google/lyria-3-pro-preview`
- Contrôles d’invite : `lyrics` et `instrumental`
- Format de sortie : `mp3` par défaut, plus `wav` sur `google/lyria-3-pro-preview`
- Entrées de référence : jusqu’à 10 images
- Les exécutions adossées à une session se détachent via le flux partagé de tâche/statut, y compris `action: "status"`

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
Voir [Music Generation](/fr/tools/music-generation) pour les paramètres d’outil partagés, la sélection du fournisseur et le comportement de basculement.
</Note>

## Synthèse vocale

Le fournisseur vocal groupé `google` utilise le chemin TTS de l’API Gemini avec
`gemini-3.1-flash-tts-preview`.

- Voix par défaut : `Kore`
- Authentification : `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- Sortie : WAV pour les pièces jointes TTS classiques, PCM pour Talk/téléphonie
- Sortie native en note vocale : non prise en charge sur ce chemin d’API Gemini car l’API renvoie du PCM plutôt que de l’Opus

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
        },
      },
    },
  },
}
```

Le TTS de l’API Gemini accepte des balises audio expressives entre crochets dans le texte, comme
`[whispers]` ou `[laughs]`. Pour garder les balises hors de la réponse visible du chat tout en
les envoyant au TTS, placez-les dans un bloc `[[tts:text]]...[[/tts:text]]` :

```text
Voici le texte propre de la réponse.

[[tts:text]][whispers] Voici la version parlée.[[/tts:text]]
```

<Note>
Une clé API Google Cloud Console restreinte à l’API Gemini est valide pour ce
fournisseur. Il ne s’agit pas du chemin distinct de l’API Cloud Text-to-Speech.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Réutilisation directe du cache Gemini">
    Pour les exécutions directes de l’API Gemini (`api: "google-generative-ai"`), OpenClaw
    transmet un handle `cachedContent` configuré aux requêtes Gemini.

    - Configurez des paramètres par modèle ou globaux avec
      `cachedContent` ou l’ancien `cached_content`
    - Si les deux sont présents, `cachedContent` est prioritaire
    - Exemple de valeur : `cachedContents/prebuilt-context`
    - L’utilisation des succès de cache Gemini est normalisée en `cacheRead` OpenClaw à partir du
      `cachedContentTokenCount` amont

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

  <Accordion title="Remarques sur l’utilisation du JSON de Gemini CLI">
    Lors de l’utilisation du fournisseur OAuth `google-gemini-cli`, OpenClaw normalise
    la sortie JSON de la CLI comme suit :

    - Le texte de réponse provient du champ JSON `response` de la CLI.
    - L’utilisation se rabat sur `stats` lorsque la CLI laisse `usage` vide.
    - `stats.cached` est normalisé en `cacheRead` OpenClaw.
    - Si `stats.input` est absent, OpenClaw dérive les jetons d’entrée à partir de
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Configuration de l’environnement et du démon">
    Si la Gateway s’exécute comme un démon (launchd/systemd), assurez-vous que `GEMINI_API_KEY`
    est disponible pour ce processus (par exemple, dans `~/.openclaw/.env` ou via
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Lié

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèle et le comportement de basculement.
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
