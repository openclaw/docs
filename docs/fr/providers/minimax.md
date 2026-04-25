---
read_when:
    - Vous voulez utiliser les modèles MiniMax dans OpenClaw
    - Vous avez besoin d’un guide de configuration MiniMax
summary: Utiliser les modèles MiniMax dans OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-25T13:56:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 666e8fd958a2566a66bc2262a1b23e3253f4ed1367c4e684380041fd935ab4af
    source_path: providers/minimax.md
    workflow: 15
---

Le fournisseur MiniMax d’OpenClaw utilise par défaut **MiniMax M2.7**.

MiniMax fournit aussi :

- La synthèse vocale intégrée via T2A v2
- La compréhension d’image intégrée via `MiniMax-VL-01`
- La génération musicale intégrée via `music-2.6`
- `web_search` intégré via l’API de recherche MiniMax Coding Plan

Répartition des fournisseurs :

| ID de fournisseur | Authentification | Capacités                                                      |
| ----------------- | ---------------- | -------------------------------------------------------------- |
| `minimax`         | Clé API          | Texte, génération d’images, compréhension d’image, parole, recherche web |
| `minimax-portal`  | OAuth            | Texte, génération d’images, compréhension d’image, parole      |

## Catalogue intégré

| Modèle                   | Type             | Description                                     |
| ------------------------ | ---------------- | ----------------------------------------------- |
| `MiniMax-M2.7`           | Discussion (raisonnement) | Modèle de raisonnement hébergé par défaut       |
| `MiniMax-M2.7-highspeed` | Discussion (raisonnement) | Niveau de raisonnement M2.7 plus rapide         |
| `MiniMax-VL-01`          | Vision           | Modèle de compréhension d’image                 |
| `image-01`               | Génération d’images | Texte-vers-image et édition image-vers-image |
| `music-2.6`              | Génération musicale | Modèle musical par défaut                     |
| `music-2.5`              | Génération musicale | Niveau précédent de génération musicale       |
| `music-2.0`              | Génération musicale | Niveau hérité de génération musicale          |
| `MiniMax-Hailuo-2.3`     | Génération vidéo | Flux texte-vers-vidéo et référence d’image      |

## Démarrage

Choisissez votre méthode d’authentification préférée et suivez les étapes de configuration.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Idéal pour :** une configuration rapide avec MiniMax Coding Plan via OAuth, sans clé API.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Lancer l’intégration initiale">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Cela s’authentifie auprès de `api.minimax.io`.
          </Step>
          <Step title="Vérifier que le modèle est disponible">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Chine">
        <Steps>
          <Step title="Lancer l’intégration initiale">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Cela s’authentifie auprès de `api.minimaxi.com`.
          </Step>
          <Step title="Vérifier que le modèle est disponible">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    Les configurations OAuth utilisent l’identifiant de fournisseur `minimax-portal`. Les références de modèle suivent la forme `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Lien de parrainage pour MiniMax Coding Plan (10 % de réduction) : [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="Clé API">
    **Idéal pour :** MiniMax hébergé avec API compatible Anthropic.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Lancer l’intégration initiale">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Cela configure `api.minimax.io` comme URL de base.
          </Step>
          <Step title="Vérifier que le modèle est disponible">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Chine">
        <Steps>
          <Step title="Lancer l’intégration initiale">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Cela configure `api.minimaxi.com` comme URL de base.
          </Step>
          <Step title="Vérifier que le modèle est disponible">
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
    Sur le chemin de streaming compatible Anthropic, OpenClaw désactive par défaut le mode thinking de MiniMax sauf si vous définissez explicitement `thinking` vous-même. Le point de terminaison de streaming MiniMax émet `reasoning_content` dans des blocs delta de style OpenAI au lieu de blocs thinking Anthropic natifs, ce qui peut exposer le raisonnement interne dans la sortie visible s’il reste activé implicitement.
    </Warning>

    <Note>
    Les configurations par clé API utilisent l’identifiant de fournisseur `minimax`. Les références de modèle suivent la forme `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Configurer via `openclaw configure`

Utilisez l’assistant interactif de configuration pour définir MiniMax sans modifier le JSON :

<Steps>
  <Step title="Lancer l’assistant">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Sélectionner Modèle/authentification">
    Choisissez **Modèle/authentification** dans le menu.
  </Step>
  <Step title="Choisir une option d’authentification MiniMax">
    Sélectionnez l’une des options MiniMax disponibles :

    | Choix d’authentification | Description |
    | --- | --- |
    | `minimax-global-oauth` | OAuth international (Coding Plan) |
    | `minimax-cn-oauth` | OAuth Chine (Coding Plan) |
    | `minimax-global-api` | Clé API internationale |
    | `minimax-cn-api` | Clé API Chine |

  </Step>
  <Step title="Choisir votre modèle par défaut">
    Sélectionnez votre modèle par défaut lorsque cela vous est demandé.
  </Step>
</Steps>

## Capacités

### Génération d’images

Le Plugin MiniMax enregistre le modèle `image-01` pour l’outil `image_generate`. Il prend en charge :

- La **génération texte-vers-image** avec contrôle du ratio d’aspect
- L’**édition image-vers-image** (référence de sujet) avec contrôle du ratio d’aspect
- Jusqu’à **9 images de sortie** par requête
- Jusqu’à **1 image de référence** par requête d’édition
- Ratios d’aspect pris en charge : `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

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

Le Plugin utilise la même authentification `MINIMAX_API_KEY` ou OAuth que les modèles texte. Aucune configuration supplémentaire n’est nécessaire si MiniMax est déjà configuré.

`minimax` et `minimax-portal` enregistrent tous deux `image_generate` avec le même
modèle `image-01`. Les configurations par clé API utilisent `MINIMAX_API_KEY` ; les configurations OAuth peuvent utiliser
à la place le chemin d’authentification intégré `minimax-portal`.

Lorsque l’intégration initiale ou la configuration par clé API écrit des entrées explicites `models.providers.minimax`,
OpenClaw matérialise `MiniMax-M2.7` et
`MiniMax-M2.7-highspeed` comme modèles de discussion texte uniquement. La compréhension d’image est
exposée séparément via le fournisseur média détenu par le Plugin `MiniMax-VL-01`.

<Note>
Voir [Génération d’images](/fr/tools/image-generation) pour les paramètres d’outil partagés, la sélection de fournisseur et le comportement de repli.
</Note>

### Synthèse vocale

Le Plugin intégré `minimax` enregistre MiniMax T2A v2 comme fournisseur de parole pour
`messages.tts`.

- Modèle TTS par défaut : `speech-2.8-hd`
- Voix par défaut : `English_expressive_narrator`
- Les identifiants de modèle intégrés pris en charge incluent `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd`, et `speech-01-turbo`.
- L’ordre de résolution d’authentification est `messages.tts.providers.minimax.apiKey`, puis
  les profils d’authentification OAuth/jeton `minimax-portal`, puis les
  clés d’environnement Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), puis `MINIMAX_API_KEY`.
- Si aucun hôte TTS n’est configuré, OpenClaw réutilise l’hôte OAuth `minimax-portal`
  configuré et supprime les suffixes de chemin compatibles Anthropic
  tels que `/anthropic`.
- Les pièces jointes audio normales restent en MP3.
- Les cibles de note vocale telles que Feishu et Telegram sont transcodées du MP3 MiniMax
  en Opus 48 kHz avec `ffmpeg`, car l’API de fichiers Feishu/Lark n’accepte
  `file_type: "opus"` que pour les messages audio natifs.
- MiniMax T2A accepte des valeurs fractionnaires pour `speed` et `vol`, mais `pitch` est envoyé comme un
  entier ; OpenClaw tronque les valeurs fractionnaires de `pitch` avant la requête API.

| Paramètre                                | Variable d’environnement | Par défaut                    | Description                           |
| ---------------------------------------- | ------------------------ | ----------------------------- | ------------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`       | `https://api.minimax.io`      | Hôte API MiniMax T2A.                 |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`      | `speech-2.8-hd`               | Identifiant du modèle TTS.            |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID`   | `English_expressive_narrator` | Identifiant de voix utilisé pour la sortie vocale. |
| `messages.tts.providers.minimax.speed`   |                          | `1.0`                         | Vitesse de lecture, `0.5..2.0`.       |
| `messages.tts.providers.minimax.vol`     |                          | `1.0`                         | Volume, `(0, 10]`.                    |
| `messages.tts.providers.minimax.pitch`   |                          | `0`                           | Décalage de hauteur entier, `-12..12`. |

### Génération musicale

Le Plugin intégré `minimax` enregistre aussi la génération musicale via l’outil partagé
`music_generate`.

- Modèle musical par défaut : `minimax/music-2.6`
- Prend aussi en charge `minimax/music-2.5` et `minimax/music-2.0`
- Contrôles d’invite : `lyrics`, `instrumental`, `durationSeconds`
- Format de sortie : `mp3`
- Les exécutions adossées à une session se détachent via le flux partagé tâche/état, y compris `action: "status"`

Pour utiliser MiniMax comme fournisseur musical par défaut :

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
Voir [Génération musicale](/fr/tools/music-generation) pour les paramètres d’outil partagés, la sélection de fournisseur et le comportement de repli.
</Note>

### Génération vidéo

Le Plugin intégré `minimax` enregistre aussi la génération vidéo via l’outil partagé
`video_generate`.

- Modèle vidéo par défaut : `minimax/MiniMax-Hailuo-2.3`
- Modes : texte-vers-vidéo et flux de référence d’image unique
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
Voir [Génération vidéo](/fr/tools/video-generation) pour les paramètres d’outil partagés, la sélection de fournisseur et le comportement de repli.
</Note>

### Compréhension d’image

Le Plugin MiniMax enregistre la compréhension d’image séparément du
catalogue texte :

| ID de fournisseur | Modèle d’image par défaut |
| ----------------- | ------------------------- |
| `minimax`         | `MiniMax-VL-01`           |
| `minimax-portal`  | `MiniMax-VL-01`           |

C’est pourquoi le routage média automatique peut utiliser la compréhension d’image MiniMax même
lorsque le catalogue intégré du fournisseur de texte montre encore des références de discussion M2.7 texte uniquement.

### Recherche web

Le Plugin MiniMax enregistre aussi `web_search` via l’API de recherche MiniMax Coding Plan.

- ID de fournisseur : `minimax`
- Résultats structurés : titres, URL, extraits, requêtes associées
- Variable d’environnement préférée : `MINIMAX_CODE_PLAN_KEY`
- Alias d’environnement accepté : `MINIMAX_CODING_API_KEY`
- Repli de compatibilité : `MINIMAX_API_KEY` lorsqu’il pointe déjà vers un jeton coding-plan
- Réutilisation de région : `plugins.entries.minimax.config.webSearch.region`, puis `MINIMAX_API_HOST`, puis les URL de base des fournisseurs MiniMax
- La recherche reste sur l’identifiant de fournisseur `minimax` ; la configuration OAuth CN/globale peut tout de même orienter indirectement la région via `models.providers.minimax-portal.baseUrl`

La configuration se trouve sous `plugins.entries.minimax.config.webSearch.*`.

<Note>
Voir [Recherche MiniMax](/fr/tools/minimax-search) pour la configuration et l’utilisation complètes de la recherche web.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Options de configuration">
    | Option | Description |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Préférez `https://api.minimax.io/anthropic` (compatible Anthropic) ; `https://api.minimax.io/v1` est facultatif pour les charges utiles compatibles OpenAI |
    | `models.providers.minimax.api` | Préférez `anthropic-messages` ; `openai-completions` est facultatif pour les charges utiles compatibles OpenAI |
    | `models.providers.minimax.apiKey` | Clé API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Définir `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Créer des alias pour les modèles que vous voulez dans la liste d’autorisation |
    | `models.mode` | Conservez `merge` si vous voulez ajouter MiniMax aux côtés des modèles intégrés |
  </Accordion>

  <Accordion title="Valeurs par défaut de thinking">
    Sur `api: "anthropic-messages"`, OpenClaw injecte `thinking: { type: "disabled" }` sauf si thinking est déjà explicitement défini dans les paramètres/la configuration.

    Cela empêche le point de terminaison de streaming MiniMax d’émettre `reasoning_content` dans des blocs delta de style OpenAI, ce qui exposerait le raisonnement interne dans la sortie visible.

  </Accordion>

  <Accordion title="Mode rapide">
    `/fast on` ou `params.fastMode: true` réécrit `MiniMax-M2.7` en `MiniMax-M2.7-highspeed` sur le chemin de flux compatible Anthropic.
  </Accordion>

  <Accordion title="Exemple de repli">
    **Idéal pour :** conserver votre modèle le plus puissant et de dernière génération en principal, avec repli sur MiniMax M2.7. L’exemple ci-dessous utilise Opus comme modèle principal concret ; remplacez-le par votre modèle principal de dernière génération préféré.

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

  <Accordion title="Détails d’utilisation de Coding Plan">
    - API d’utilisation Coding Plan : `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (nécessite une clé coding plan).
    - OpenClaw normalise l’utilisation du coding-plan MiniMax vers le même affichage « % restant » utilisé par les autres fournisseurs. Les champs bruts `usage_percent` / `usagePercent` de MiniMax correspondent au quota restant, et non au quota consommé ; OpenClaw les inverse donc. Les champs basés sur un comptage l’emportent lorsqu’ils sont présents.
    - Lorsque l’API renvoie `model_remains`, OpenClaw privilégie l’entrée de modèle de discussion, dérive le libellé de fenêtre depuis `start_time` / `end_time` si nécessaire, et inclut le nom du modèle sélectionné dans le libellé du plan afin que les fenêtres coding-plan soient plus faciles à distinguer.
    - Les instantanés d’utilisation traitent `minimax`, `minimax-cn` et `minimax-portal` comme la même surface de quota MiniMax, et privilégient l’OAuth MiniMax stocké avant de se replier sur les variables d’environnement de clé Coding Plan.
  </Accordion>
</AccordionGroup>

## Remarques

- Les références de modèle suivent le chemin d’authentification :
  - Configuration par clé API : `minimax/<model>`
  - Configuration OAuth : `minimax-portal/<model>`
- Modèle de discussion par défaut : `MiniMax-M2.7`
- Modèle de discussion alternatif : `MiniMax-M2.7-highspeed`
- L’intégration initiale et la configuration directe par clé API écrivent des définitions de modèles texte uniquement pour les deux variantes M2.7
- La compréhension d’image utilise le fournisseur média `MiniMax-VL-01` détenu par le Plugin
- Mettez à jour les valeurs de tarification dans `models.json` si vous avez besoin d’un suivi exact des coûts
- Utilisez `openclaw models list` pour confirmer l’identifiant de fournisseur actuel, puis basculez avec `openclaw models set minimax/MiniMax-M2.7` ou `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Lien de parrainage pour MiniMax Coding Plan (10 % de réduction) : [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Voir [Fournisseurs de modèles](/fr/concepts/model-providers) pour les règles des fournisseurs.
</Note>

## Dépannage

<AccordionGroup>
  <Accordion title='"Modèle inconnu : minimax/MiniMax-M2.7"'>
    Cela signifie généralement que le **fournisseur MiniMax n’est pas configuré** (aucune entrée de fournisseur correspondante et aucun profil d’authentification/clé d’environnement MiniMax trouvé). Un correctif pour cette détection est présent dans **2026.1.12**. Corrigez en :

    - Mettant à niveau vers **2026.1.12** (ou en exécutant depuis la source `main`), puis en redémarrant Gateway.
    - Exécutant `openclaw configure` et en sélectionnant une option d’authentification **MiniMax**, ou
    - Ajoutant manuellement le bloc correspondant `models.providers.minimax` ou `models.providers.minimax-portal`, ou
    - Définissant `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN`, ou un profil d’authentification MiniMax afin que le fournisseur correspondant puisse être injecté.

    Assurez-vous que l’identifiant de modèle est **sensible à la casse** :

    - Chemin clé API : `minimax/MiniMax-M2.7` ou `minimax/MiniMax-M2.7-highspeed`
    - Chemin OAuth : `minimax-portal/MiniMax-M2.7` ou `minimax-portal/MiniMax-M2.7-highspeed`

    Vérifiez ensuite à nouveau avec :

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Plus d’aide : [Dépannage](/fr/help/troubleshooting) et [FAQ](/fr/help/faq).
</Note>

## Liens associés

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèle et le comportement de repli.
  </Card>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Paramètres d’outil d’image partagés et sélection du fournisseur.
  </Card>
  <Card title="Génération musicale" href="/fr/tools/music-generation" icon="music">
    Paramètres d’outil de musique partagés et sélection du fournisseur.
  </Card>
  <Card title="Génération vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres d’outil vidéo partagés et sélection du fournisseur.
  </Card>
  <Card title="Recherche MiniMax" href="/fr/tools/minimax-search" icon="magnifying-glass">
    Configuration de recherche web via MiniMax Coding Plan.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Dépannage général et FAQ.
  </Card>
</CardGroup>
