---
read_when:
    - Vous souhaitez utiliser les modèles MiniMax dans OpenClaw
    - Vous avez besoin d’aide pour configurer MiniMax
summary: Utiliser les modèles MiniMax dans OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-05-02T07:17:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c7aea4d9656d6ffddab7c43b06940e58bdd119a03b62000e689a3348f7df5a2
    source_path: providers/minimax.md
    workflow: 16
---

Le fournisseur MiniMax d’OpenClaw utilise par défaut **MiniMax M2.7**.

MiniMax fournit également :

- Synthèse vocale intégrée via T2A v2
- Compréhension d’image intégrée via `MiniMax-VL-01`
- Génération musicale intégrée via `music-2.6`
- `web_search` intégré via l’API de recherche MiniMax Token Plan

Répartition des fournisseurs :

| ID du fournisseur | Authentification | Fonctionnalités                                                                                     |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | Clé API | Texte, génération d’images, génération musicale, génération vidéo, compréhension d’image, voix, recherche web |
| `minimax-portal` | OAuth   | Texte, génération d’images, génération musicale, génération vidéo, compréhension d’image, voix       |

## Catalogue intégré

| Modèle                   | Type             | Description                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | Chat (raisonnement) | Modèle de raisonnement hébergé par défaut |
| `MiniMax-M2.7-highspeed` | Chat (raisonnement) | Niveau de raisonnement M2.7 plus rapide  |
| `MiniMax-VL-01`          | Vision           | Modèle de compréhension d’image          |
| `image-01`               | Génération d’images | Édition texte-vers-image et image-vers-image |
| `music-2.6`              | Génération musicale | Modèle musical par défaut                |
| `music-2.5`              | Génération musicale | Niveau précédent de génération musicale  |
| `music-2.0`              | Génération musicale | Ancien niveau de génération musicale     |
| `MiniMax-Hailuo-2.3`     | Génération vidéo | Flux texte-vers-vidéo et de référence d’image |

## Premiers pas

Choisissez votre méthode d’authentification préférée et suivez les étapes de configuration.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Idéal pour :** une configuration rapide avec MiniMax Coding Plan via OAuth, sans clé API requise.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Cela authentifie auprès de `api.minimax.io`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Cela authentifie auprès de `api.minimaxi.com`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    Les configurations OAuth utilisent l’ID de fournisseur `minimax-portal`. Les références de modèle suivent la forme `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Lien de parrainage pour MiniMax Coding Plan (10 % de réduction) : [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Idéal pour :** MiniMax hébergé avec une API compatible Anthropic.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Cela configure `api.minimax.io` comme URL de base.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Cela configure `api.minimaxi.com` comme URL de base.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Exemple de configuration

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Sur le chemin de diffusion en continu compatible Anthropic, OpenClaw désactive par défaut la pensée MiniMax, sauf si vous définissez explicitement `thinking` vous-même. Le point de terminaison de diffusion en continu de MiniMax émet `reasoning_content` dans des morceaux delta de style OpenAI au lieu de blocs de pensée Anthropic natifs, ce qui peut faire apparaître le raisonnement interne dans la sortie visible si l’option reste activée implicitement.
    </Warning>

    <Note>
    Les configurations par clé API utilisent l’ID de fournisseur `minimax`. Les références de modèle suivent la forme `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Configurer via `openclaw configure`

Utilisez l’assistant de configuration interactif pour configurer MiniMax sans modifier le JSON :

<Steps>
  <Step title="Lancer l’assistant">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Sélectionner Modèle/auth">
    Choisissez **Modèle/auth** dans le menu.
  </Step>
  <Step title="Choisir une option d’auth MiniMax">
    Choisissez l’une des options MiniMax disponibles :

    | Choix d’auth | Description |
    | --- | --- |
    | `minimax-global-oauth` | OAuth international (Coding Plan) |
    | `minimax-cn-oauth` | OAuth Chine (Coding Plan) |
    | `minimax-global-api` | Clé d’API internationale |
    | `minimax-cn-api` | Clé d’API Chine |

  </Step>
  <Step title="Choisir votre modèle par défaut">
    Sélectionnez votre modèle par défaut lorsque vous y êtes invité.
  </Step>
</Steps>

## Fonctionnalités

### Génération d’images

Le Plugin MiniMax enregistre le modèle `image-01` pour l’outil `image_generate`. Il prend en charge :

- **La génération texte-vers-image** avec contrôle du format d’image
- **L’édition image-vers-image** (référence de sujet) avec contrôle du format d’image
- Jusqu’à **9 images de sortie** par requête
- Jusqu’à **1 image de référence** par requête d’édition
- Formats d’image pris en charge : `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Pour utiliser MiniMax pour la génération d’images, définissez-le comme fournisseur de génération d’images :

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Le Plugin utilise le même `MINIMAX_API_KEY` ou la même authentification OAuth que les modèles de texte. Aucune configuration supplémentaire n’est nécessaire si MiniMax est déjà configuré.

`minimax` et `minimax-portal` enregistrent tous deux `image_generate` avec le même
modèle `image-01`. Les configurations par clé d’API utilisent `MINIMAX_API_KEY` ; les configurations OAuth peuvent utiliser
le chemin d’auth `minimax-portal` intégré à la place.

La génération d’images utilise toujours le point de terminaison d’image dédié de MiniMax
(`/v1/image_generation`) et ignore `models.providers.minimax.baseUrl`,
car ce champ configure l’URL de base compatible avec le chat/Anthropic. Définissez
`MINIMAX_API_HOST=https://api.minimaxi.com` pour acheminer la génération d’images
via le point de terminaison CN ; le point de terminaison global par défaut est
`https://api.minimax.io`.

Lorsque l’onboarding ou la configuration par clé d’API écrit des entrées explicites `models.providers.minimax`,
OpenClaw matérialise `MiniMax-M2.7` et
`MiniMax-M2.7-highspeed` comme modèles de chat texte uniquement. La compréhension d’images est
exposée séparément via le fournisseur de médias `MiniMax-VL-01` détenu par le Plugin.

<Note>
Consultez [Génération d’images](/fr/tools/image-generation) pour les paramètres partagés de l’outil, la sélection du fournisseur et le comportement de basculement.
</Note>

### Synthèse vocale

Le Plugin `minimax` intégré enregistre MiniMax T2A v2 comme fournisseur vocal pour
`messages.tts`.

- Modèle TTS par défaut : `speech-2.8-hd`
- Voix par défaut : `English_expressive_narrator`
- Les identifiants de modèles intégrés pris en charge incluent `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` et `speech-01-turbo`.
- La résolution de l’authentification est `messages.tts.providers.minimax.apiKey`, puis
  les profils d’auth OAuth/jeton `minimax-portal`, puis les clés d’environnement
  Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), puis `MINIMAX_API_KEY`.
- Si aucun hôte TTS n’est configuré, OpenClaw réutilise l’hôte OAuth
  `minimax-portal` configuré et supprime les suffixes de chemin compatibles avec Anthropic
  tels que `/anthropic`.
- Les pièces jointes audio normales restent en MP3.
- Les cibles de notes vocales telles que Feishu et Telegram sont transcodées depuis le MP3
  MiniMax vers Opus 48 kHz avec `ffmpeg`, car l’API de fichiers Feishu/Lark n’accepte que
  `file_type: "opus"` pour les messages audio natifs.
- MiniMax T2A accepte les valeurs fractionnaires `speed` et `vol`, mais `pitch` est envoyé sous forme
  d’entier ; OpenClaw tronque les valeurs fractionnaires de `pitch` avant la requête API.

| Paramètre                                | Variable d’env        | Par défaut                    | Description                         |
| ---------------------------------------- | --------------------- | ----------------------------- | ----------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`    | `https://api.minimax.io`      | Hôte API MiniMax T2A.               |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`   | `speech-2.8-hd`               | Identifiant du modèle TTS.          |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID`| `English_expressive_narrator` | Identifiant de voix utilisé pour la sortie vocale. |
| `messages.tts.providers.minimax.speed`   |                       | `1.0`                         | Vitesse de lecture, `0.5..2.0`.     |
| `messages.tts.providers.minimax.vol`     |                       | `1.0`                         | Volume, `(0, 10]`.                  |
| `messages.tts.providers.minimax.pitch`   |                       | `0`                           | Décalage de hauteur entier, `-12..12`. |

### Génération de musique

Le Plugin MiniMax intégré enregistre la génération de musique via l’outil partagé
`music_generate` pour `minimax` et `minimax-portal`.

- Modèle de musique par défaut : `minimax/music-2.6`
- Modèle de musique OAuth : `minimax-portal/music-2.6`
- Prend également en charge `minimax/music-2.5` et `minimax/music-2.0`
- Contrôles du prompt : `lyrics`, `instrumental`, `durationSeconds`
- Format de sortie : `mp3`
- Les exécutions adossées à une session se détachent via le flux partagé de tâche/statut, notamment `action: "status"`

Pour utiliser MiniMax comme fournisseur de musique par défaut :

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.6",
      },
    },
  },
}
```

<Note>
Consultez [Génération de musique](/fr/tools/music-generation) pour les paramètres partagés de l’outil, la sélection du fournisseur et le comportement de basculement.
</Note>

### Génération de vidéos

Le Plugin MiniMax intégré enregistre la génération de vidéos via l’outil partagé
`video_generate` pour `minimax` et `minimax-portal`.

- Modèle vidéo par défaut : `minimax/MiniMax-Hailuo-2.3`
- Modèle vidéo OAuth : `minimax-portal/MiniMax-Hailuo-2.3`
- Modes : flux texte-vers-vidéo et référence à image unique
- Prend en charge `aspectRatio` et `resolution`

Pour utiliser MiniMax comme fournisseur vidéo par défaut :

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
Consultez [Génération vidéo](/fr/tools/video-generation) pour les paramètres d’outil partagés, la sélection du fournisseur et le comportement de basculement.
</Note>

### Compréhension d’images

Le plugin MiniMax enregistre la compréhension d’images séparément du catalogue
texte :

| ID du fournisseur | Modèle d’image par défaut |
| ----------------- | ------------------------- |
| `minimax`         | `MiniMax-VL-01`           |
| `minimax-portal`  | `MiniMax-VL-01`           |

C’est pourquoi le routage automatique des médias peut utiliser la compréhension d’images MiniMax même
lorsque le catalogue groupé du fournisseur de texte affiche encore des références de chat M2.7 uniquement textuelles.

### Recherche web

Le plugin MiniMax enregistre aussi `web_search` via l’API de recherche MiniMax Token Plan.

- ID du fournisseur : `minimax`
- Résultats structurés : titres, URL, extraits, requêtes associées
- Variable d’environnement préférée : `MINIMAX_CODE_PLAN_KEY`
- Alias d’environnement acceptés : `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Repli de compatibilité : `MINIMAX_API_KEY` lorsqu’elle pointe déjà vers un identifiant Token Plan
- Réutilisation de la région : `plugins.entries.minimax.config.webSearch.region`, puis `MINIMAX_API_HOST`, puis les URL de base du fournisseur MiniMax
- La recherche reste sur l’ID de fournisseur `minimax` ; la configuration OAuth CN/global peut orienter la région indirectement via `models.providers.minimax-portal.baseUrl` et peut fournir l’authentification bearer via `MINIMAX_OAUTH_TOKEN`

La configuration se trouve sous `plugins.entries.minimax.config.webSearch.*`.

<Note>
Consultez [Recherche MiniMax](/fr/tools/minimax-search) pour la configuration complète et l’utilisation de la recherche web.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Options de configuration">
    | Option | Description |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Préférez `https://api.minimax.io/anthropic` (compatible Anthropic) ; `https://api.minimax.io/v1` est optionnel pour les payloads compatibles OpenAI |
    | `models.providers.minimax.api` | Préférez `anthropic-messages` ; `openai-completions` est optionnel pour les payloads compatibles OpenAI |
    | `models.providers.minimax.apiKey` | Clé d’API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Définir `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Donner un alias aux modèles à inclure dans l’allowlist |
    | `models.mode` | Gardez `merge` si vous voulez ajouter MiniMax aux éléments intégrés |
  </Accordion>

  <Accordion title="Valeurs par défaut de réflexion">
    Sur `api: "anthropic-messages"`, OpenClaw injecte `thinking: { type: "disabled" }`, sauf si la réflexion est déjà explicitement définie dans les paramètres/la configuration.

    Cela empêche le endpoint de streaming de MiniMax d’émettre `reasoning_content` dans des fragments delta de style OpenAI, ce qui exposerait le raisonnement interne dans la sortie visible.

  </Accordion>

  <Accordion title="Mode rapide">
    `/fast on` ou `params.fastMode: true` réécrit `MiniMax-M2.7` en `MiniMax-M2.7-highspeed` sur le chemin de streaming compatible Anthropic.
  </Accordion>

  <Accordion title="Exemple de repli">
    **Idéal pour :** garder votre modèle de dernière génération le plus puissant comme modèle principal, avec basculement vers MiniMax M2.7. L’exemple ci-dessous utilise Opus comme modèle principal concret ; remplacez-le par votre modèle principal de dernière génération préféré.

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Détails d’utilisation du Coding Plan">
    - API d’utilisation du Coding Plan : `https://api.minimaxi.com/v1/token_plan/remains` ou `https://api.minimax.io/v1/token_plan/remains` (nécessite une clé de coding plan).
    - L’interrogation de l’utilisation déduit l’hôte depuis `models.providers.minimax-portal.baseUrl` ou `models.providers.minimax.baseUrl` lorsque c’est configuré ; ainsi les configurations globales utilisant `https://api.minimax.io/anthropic` interrogent `api.minimax.io`. Les URL de base manquantes ou mal formées conservent le repli CN pour la compatibilité.
    - OpenClaw normalise l’utilisation du coding plan MiniMax avec le même affichage `% left` que les autres fournisseurs. Les champs bruts `usage_percent` / `usagePercent` de MiniMax correspondent au quota restant, pas au quota consommé ; OpenClaw les inverse donc. Les champs basés sur un décompte prévalent lorsqu’ils sont présents.
    - Lorsque l’API renvoie `model_remains`, OpenClaw préfère l’entrée du modèle de chat, déduit le libellé de fenêtre depuis `start_time` / `end_time` si nécessaire, et inclut le nom du modèle sélectionné dans le libellé du plan pour faciliter la distinction des fenêtres de coding plan.
    - Les instantanés d’utilisation traitent `minimax`, `minimax-cn` et `minimax-portal` comme la même surface de quota MiniMax, et préfèrent l’OAuth MiniMax stocké avant de se rabattre sur les variables d’environnement de clé Coding Plan.

  </Accordion>
</AccordionGroup>

## Notes

- Les références de modèle suivent le chemin d’authentification :
  - Configuration par clé d’API : `minimax/<model>`
  - Configuration OAuth : `minimax-portal/<model>`
- Modèle de chat par défaut : `MiniMax-M2.7`
- Modèle de chat alternatif : `MiniMax-M2.7-highspeed`
- L’onboarding et la configuration directe par clé d’API écrivent des définitions de modèles uniquement textuels pour les deux variantes M2.7
- La compréhension d’images utilise le fournisseur de médias `MiniMax-VL-01` détenu par le plugin
- Mettez à jour les valeurs de tarification dans `models.json` si vous avez besoin d’un suivi exact des coûts
- Utilisez `openclaw models list` pour confirmer l’ID de fournisseur actuel, puis basculez avec `openclaw models set minimax/MiniMax-M2.7` ou `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Lien de parrainage pour MiniMax Coding Plan (10 % de réduction) : [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Consultez [Fournisseurs de modèles](/fr/concepts/model-providers) pour les règles des fournisseurs.
</Note>

## Dépannage

<AccordionGroup>
  <Accordion title='"Modèle inconnu : minimax/MiniMax-M2.7"'>
    Cela signifie généralement que le **fournisseur MiniMax n’est pas configuré** (aucune entrée de fournisseur correspondante et aucun profil d’authentification/clé d’environnement MiniMax trouvé). Un correctif pour cette détection est inclus dans **2026.1.12**. Corrigez en :

    - Passant à **2026.1.12** (ou en exécutant depuis la source `main`), puis en redémarrant le gateway.
    - Exécutant `openclaw configure` et en sélectionnant une option d’authentification **MiniMax**, ou
    - Ajoutant manuellement le bloc `models.providers.minimax` ou `models.providers.minimax-portal` correspondant, ou
    - Définissant `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` ou un profil d’authentification MiniMax afin que le fournisseur correspondant puisse être injecté.

    Assurez-vous que l’ID du modèle est **sensible à la casse** :

    - Chemin par clé d’API : `minimax/MiniMax-M2.7` ou `minimax/MiniMax-M2.7-highspeed`
    - Chemin OAuth : `minimax-portal/MiniMax-M2.7` ou `minimax-portal/MiniMax-M2.7-highspeed`

    Puis revérifiez avec :

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Aide supplémentaire : [Dépannage](/fr/help/troubleshooting) et [FAQ](/fr/help/faq).
</Note>

## Connexe

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de basculement.
  </Card>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Paramètres partagés de l’outil d’image et sélection du fournisseur.
  </Card>
  <Card title="Génération de musique" href="/fr/tools/music-generation" icon="music">
    Paramètres partagés de l’outil de musique et sélection du fournisseur.
  </Card>
  <Card title="Génération vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres partagés de l’outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="Recherche MiniMax" href="/fr/tools/minimax-search" icon="magnifying-glass">
    Configuration de la recherche web via MiniMax Token Plan.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Dépannage général et FAQ.
  </Card>
</CardGroup>
