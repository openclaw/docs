---
read_when:
    - Vous souhaitez utiliser les modèles MiniMax dans OpenClaw
    - Vous avez besoin d’aide pour configurer MiniMax
summary: Utiliser les modèles MiniMax dans OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-07-12T03:02:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1172d2d2c92dc92858f15564eee9ffeb8eb9599ee70157116fd2e302556dd75a
    source_path: providers/minimax.md
    workflow: 16
---

  Le plugin `minimax` fourni enregistre deux fournisseurs ainsi que cinq fonctionnalités : chat, génération d’images, génération de musique, génération de vidéos, compréhension d’images, synthèse vocale (T2A v2) et recherche web.

  | ID du fournisseur | Authentification | Fonctionnalités                                                                                                         |
  | ----------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
  | `minimax`         | Clé API          | Texte, génération d’images, génération de musique, génération de vidéos, compréhension d’images, synthèse vocale, recherche web |
  | `minimax-portal`  | OAuth            | Texte, génération d’images, génération de musique, génération de vidéos, compréhension d’images, synthèse vocale              |

  <Tip>
  Lien de parrainage pour MiniMax Coding Plan (10 % de réduction) : [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
  </Tip>

  ## Catalogue intégré

  | Modèle                   | Type                         | Description                                        |
  | ------------------------ | ---------------------------- | -------------------------------------------------- |
  | `MiniMax-M3`             | Chat (raisonnement)          | Modèle de raisonnement hébergé par défaut           |
  | `MiniMax-M2.7`           | Chat (raisonnement)          | Modèle de raisonnement hébergé précédent            |
  | `MiniMax-M2.7-highspeed` | Chat (raisonnement)          | Niveau de raisonnement M2.7 plus rapide             |
  | `MiniMax-VL-01`          | Vision                       | Modèle de compréhension d’images                    |
  | `image-01`               | Génération d’images          | Génération texte-image et édition image-image       |
  | `music-2.6`              | Génération de musique        | Modèle musical par défaut                           |
  | `MiniMax-Hailuo-2.3`     | Génération de vidéos         | Flux texte-vidéo et image-vidéo                     |

  Les références de modèles suivent le mode d’authentification : `minimax/<model>` pour les configurations avec clé API, et `minimax-portal/<model>` pour les configurations OAuth.

  ## Prise en main

  <Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Idéal pour :** une configuration rapide avec MiniMax Coding Plan via OAuth, sans clé API.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Exécuter l’intégration initiale">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            URL de base du fournisseur obtenue : `api.minimax.io`.
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
          <Step title="Exécuter l’intégration initiale">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            URL de base du fournisseur obtenue : `api.minimaxi.com`.
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
    Les configurations OAuth utilisent l’ID de fournisseur `minimax-portal`. Les références de modèles suivent la forme `minimax-portal/MiniMax-M3`.
    </Note>

  </Tab>

  <Tab title="Clé API">
    **Idéal pour :** MiniMax hébergé avec une API compatible avec Anthropic.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Exécuter l’intégration initiale">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Cette commande configure `api.minimax.io` comme URL de base.
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
          <Step title="Exécuter l’intégration initiale">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Cette commande configure `api.minimaxi.com` comme URL de base.
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
      agents: { defaults: { model: { primary: "minimax/MiniMax-M3" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
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
    Le point de terminaison de diffusion en continu compatible avec Anthropic de MiniMax-M2.x émet `reasoning_content` dans des fragments différentiels de style OpenAI plutôt que dans des blocs de réflexion Anthropic natifs, ce qui expose le raisonnement interne dans la sortie visible si la réflexion reste implicitement activée. OpenClaw désactive par défaut la réflexion pour M2.x, sauf si vous définissez explicitement `thinking`. MiniMax-M3 (ainsi que les versions M3.x compatibles ultérieurement) fait exception : M3 émet des blocs de réflexion Anthropic conformes et nécessite que la réflexion soit active pour produire du contenu visible. OpenClaw maintient donc M3 sur le mécanisme de réflexion adaptative du fournisseur. Consultez la section sur les valeurs par défaut de la réflexion dans la configuration avancée ci-dessous.
    </Warning>

    <Note>
    Les configurations avec clé API utilisent l’ID de fournisseur `minimax`. Les références de modèles suivent la forme `minimax/MiniMax-M3`.
    </Note>

  </Tab>
</Tabs>

## Configurer avec `openclaw configure`

<Steps>
  <Step title="Lancer l’assistant">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Sélectionner le modèle/l’authentification">
    Choisissez **Modèle/authentification** dans le menu.
  </Step>
  <Step title="Choisir une option d’authentification MiniMax">
    | Choix d’authentification | Description                              |
    | ------------------------ | ---------------------------------------- |
    | `minimax-global-oauth`   | OAuth international (forfait Coding)     |
    | `minimax-cn-oauth`       | OAuth Chine (forfait Coding)             |
    | `minimax-global-api`     | Clé API internationale                   |
    | `minimax-cn-api`         | Clé API Chine                            |
  </Step>
  <Step title="Choisir votre modèle par défaut">
    Sélectionnez votre modèle par défaut lorsque vous y êtes invité.
  </Step>
</Steps>

## Fonctionnalités

### Génération d’images

Le Plugin MiniMax enregistre le modèle `image-01` pour l’outil `image_generate` sur `minimax` et `minimax-portal`, en réutilisant la même `MINIMAX_API_KEY` ou la même authentification OAuth que les modèles de texte.

- Génération de texte en image et retouche d’image en image (référence du sujet), toutes deux avec contrôle du format d’image
- Jusqu’à 9 images de sortie par requête et 1 image de référence par requête de retouche
- Formats d’image pris en charge : `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

La génération d’images utilise toujours le point de terminaison dédié aux images de MiniMax (`/v1/image_generation`) et ignore `models.providers.minimax.baseUrl`, car ce champ configure plutôt l’URL de base compatible avec la messagerie/Anthropic. Définissez `MINIMAX_API_HOST=https://api.minimaxi.com` pour acheminer la génération d’images via le point de terminaison chinois ; le point de terminaison mondial par défaut est `https://api.minimax.io`.

<Note>
Consultez [Génération d’images](/fr/tools/image-generation) pour connaître les paramètres partagés de l’outil, la sélection du fournisseur et le comportement de basculement.
</Note>

### Synthèse vocale

Le Plugin `minimax` intégré enregistre MiniMax T2A v2 comme fournisseur de synthèse vocale pour `messages.tts`.

- Modèle TTS par défaut : `speech-2.8-hd`
- Voix par défaut : `English_expressive_narrator`
- Identifiants des modèles intégrés : `speech-2.8-hd`, `speech-2.8-turbo`, `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`, `speech-02-turbo`, `speech-01-hd`, `speech-01-turbo`, `speech-01-240228`
- Ordre de résolution de l’authentification : `messages.tts.providers.minimax.apiKey`, puis les profils d’authentification OAuth/par jeton `minimax-portal`, puis les clés d’environnement du forfait Token (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`), puis `MINIMAX_API_KEY`
- Si aucun hôte TTS n’est configuré, OpenClaw réutilise l’hôte OAuth `minimax-portal` configuré et supprime les suffixes de chemin compatibles avec Anthropic, tels que `/anthropic`
- Les pièces jointes audio normales restent au format MP3. Les destinations de notes vocales (Feishu, Telegram et les autres canaux qui demandent une pièce jointe compatible avec les notes vocales) sont transcodées du MP3 MiniMax vers le format Opus à 48 kHz avec `ffmpeg`, car, par exemple, l’API de fichiers Feishu/Lark n’accepte que `file_type: "opus"` pour les messages audio natifs
- MiniMax T2A accepte des valeurs fractionnaires pour `speed` et `vol`, mais `pitch` est envoyé sous forme d’entier ; OpenClaw tronque les valeurs fractionnaires de `pitch` avant la requête API

| Paramètre                                | Variable d’environnement | Valeur par défaut             | Description                                        |
| ---------------------------------------- | ------------------------ | ----------------------------- | -------------------------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`       | `https://api.minimax.io`      | Hôte de l’API MiniMax T2A.                         |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`      | `speech-2.8-hd`               | Identifiant du modèle TTS.                         |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID`   | `English_expressive_narrator` | Identifiant de la voix utilisée pour la synthèse.  |
| `messages.tts.providers.minimax.speed`   |                          | `1.0`                         | Vitesse de lecture, `0.5..2.0`.                    |
| `messages.tts.providers.minimax.vol`     |                          | `1.0`                         | Volume, `(0, 10]`.                                 |
| `messages.tts.providers.minimax.pitch`   |                          | `0`                           | Décalage de hauteur entier, `-12..12`.             |

### Génération musicale

Le Plugin MiniMax intégré enregistre la génération musicale via l’outil partagé `music_generate` pour `minimax` et `minimax-portal`.

- Modèle musical par défaut : `minimax/music-2.6` (OAuth : `minimax-portal/music-2.6`)
- Prend également en charge `music-2.6-free`, `music-cover` et `music-cover-free`
- Paramètres de contrôle de l’invite : `lyrics`, `instrumental`
- Format de sortie : `mp3`
- Les exécutions adossées à une session se détachent via le flux partagé de tâche et d’état, notamment `action: "status"`

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: { primary: "minimax/music-2.6" },
    },
  },
}
```

<Note>
Consultez [Génération musicale](/fr/tools/music-generation) pour connaître les paramètres partagés de l’outil, la sélection du fournisseur et le comportement de basculement.
</Note>

### Génération vidéo

Le Plugin MiniMax intégré enregistre la génération vidéo via l’outil partagé `video_generate` pour `minimax` et `minimax-portal`.

- Modèle vidéo par défaut : `minimax/MiniMax-Hailuo-2.3` (OAuth : `minimax-portal/MiniMax-Hailuo-2.3`)
- Prend également en charge `MiniMax-Hailuo-2.3-Fast`, `MiniMax-Hailuo-02`, `I2V-01-Director`, `I2V-01-live` et `I2V-01`
- Modes : conversion de texte en vidéo et flux avec une seule image de référence
- Prend en charge `resolution` (`768P` ou `1080P` sur les modèles Hailuo 2.3/02) ; `aspectRatio` n’est pas pris en charge et est ignoré

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "minimax/MiniMax-Hailuo-2.3" },
    },
  },
}
```

<Note>
Consultez [Génération de vidéos](/fr/tools/video-generation) pour connaître les paramètres partagés de l’outil, la sélection du fournisseur et le comportement de basculement.
</Note>

### Compréhension des images

Le Plugin MiniMax enregistre la compréhension des images séparément du catalogue de texte :

| ID du fournisseur | Modèle d’image par défaut | Extraction de texte des PDF |
| ----------------- | ------------------------- | --------------------------- |
| `minimax`        | `MiniMax-VL-01`     | `MiniMax-M2.7`      |
| `minimax-portal` | `MiniMax-VL-01`     | `MiniMax-M2.7`      |

C’est pourquoi le routage automatique des médias peut utiliser la compréhension des images de MiniMax, même lorsque le catalogue intégré du fournisseur de texte comprend également des références de chat M3 capables de traiter des images. La compréhension des PDF utilise `MiniMax-M2.7` uniquement pour l’extraction de texte ; MiniMax n’enregistre aucun chemin de conversion des PDF en images.

### Recherche sur le Web

Le Plugin MiniMax enregistre également `web_search` au moyen de l’API de recherche MiniMax Token Plan (`/v1/coding_plan/search`).

- ID du fournisseur : `minimax`
- Résultats structurés : titres, URL, extraits, requêtes associées
- Variable d’environnement recommandée : `MINIMAX_CODE_PLAN_KEY`
- Alias de variables d’environnement acceptés : `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Solution de repli pour la compatibilité : `MINIMAX_API_KEY` lorsqu’elle désigne déjà un identifiant d’authentification Token Plan
- Réutilisation de la région : `plugins.entries.minimax.config.webSearch.region`, puis `MINIMAX_API_HOST`, puis les URL de base du fournisseur MiniMax
- La recherche conserve l’ID de fournisseur `minimax` ; la configuration OAuth pour la Chine ou le reste du monde peut orienter indirectement la région au moyen de `models.providers.minimax-portal.baseUrl` et fournir l’authentification par jeton Bearer au moyen de `MINIMAX_OAUTH_TOKEN`

La configuration se trouve sous `plugins.entries.minimax.config.webSearch.*`.

<Note>
Consultez [Recherche MiniMax](/fr/tools/minimax-search) pour obtenir la configuration complète et les instructions d’utilisation de la recherche sur le Web.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Options de configuration">
    | Option | Description |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Préférez `https://api.minimax.io/anthropic` (compatible avec Anthropic) ; `https://api.minimax.io/v1` est facultatif pour les charges utiles compatibles avec OpenAI |
    | `models.providers.minimax.api` | Préférez `anthropic-messages` ; `openai-completions` est facultatif pour les charges utiles compatibles avec OpenAI |
    | `models.providers.minimax.apiKey` | Clé API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Définissez `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Attribuez des alias aux modèles que vous souhaitez ajouter à la liste d’autorisation |
    | `models.mode` | Conservez `merge` si vous souhaitez ajouter MiniMax aux modèles intégrés |
  </Accordion>

  <Accordion title="Valeurs par défaut de la réflexion">
    Avec `api: "anthropic-messages"`, OpenClaw injecte `thinking: { type: "disabled" }` pour les modèles MiniMax M2.x, sauf si un wrapper antérieur a déjà défini le champ `thinking` dans la charge utile. Cela empêche le point de terminaison de diffusion en continu de M2.x d’émettre `reasoning_content` dans des fragments delta de style OpenAI, ce qui exposerait le raisonnement interne dans la sortie visible.

    MiniMax-M3 (et M3.x) fait exception : M3 renvoie un tableau `content` vide avec `stop_reason: "end_turn"` lorsque la réflexion est désactivée. OpenClaw supprime donc la valeur implicite désactivée par défaut pour M3 et, lorsqu’un niveau de réflexion est défini, impose à la place `thinking: { type: "adaptive" }`.

    Niveaux de réflexion disponibles par famille de modèles :

    | Famille de modèles | Niveaux                                   | Valeur par défaut |
    | ------------------ | ----------------------------------------- | ----------------- |
    | `MiniMax-M3`   | `off`, `adaptive`                        | `adaptive` |
    | `MiniMax-M2.x` | `off`, `minimal`, `low`, `medium`, `high` | `off`      |

  </Accordion>

  <Accordion title="Mode rapide">
    `/fast on` ou `params.fastMode: true` remplace `MiniMax-M2.7` par `MiniMax-M2.7-highspeed` sur le chemin de diffusion en continu compatible avec Anthropic (`api: "anthropic-messages"`, fournisseur `minimax` ou `minimax-portal`).
  </Accordion>

  <Accordion title="Exemple de solution de repli">
    **Idéal pour :** conserver comme modèle principal votre modèle de dernière génération le plus performant et basculer vers MiniMax M2.7 en cas d’échec. L’exemple ci-dessous utilise Opus comme modèle principal concret ; remplacez-le par votre modèle principal de dernière génération préféré.

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
    - API d’utilisation du Coding Plan : `https://api.minimaxi.com/v1/token_plan/remains` ou `https://api.minimax.io/v1/token_plan/remains` (nécessite une clé Coding Plan).
    - L’interrogation périodique de l’utilisation déduit l’hôte de `models.providers.minimax-portal.baseUrl` ou de `models.providers.minimax.baseUrl` lorsqu’ils sont configurés. Ainsi, les configurations mondiales utilisant `https://api.minimax.io/anthropic` interrogent `api.minimax.io`. Les URL de base absentes ou mal formées conservent la solution de repli chinoise pour assurer la compatibilité.
    - OpenClaw normalise l’utilisation du Coding Plan de MiniMax selon le même affichage `% left` que celui utilisé par les autres fournisseurs. Les champs bruts `usage_percent` / `usagePercent` de MiniMax représentent le quota restant, et non le quota consommé ; OpenClaw les inverse donc. Les champs fondés sur un nombre sont prioritaires lorsqu’ils sont présents.
    - Lorsque l’API renvoie `model_remains`, OpenClaw privilégie l’entrée du modèle de chat, déduit au besoin le libellé de la fenêtre à partir de `start_time` / `end_time` et inclut le nom du modèle sélectionné dans le libellé du forfait afin de faciliter la distinction entre les fenêtres du Coding Plan.
    - Les instantanés d’utilisation traitent `minimax`, `minimax-cn`, `minimax-portal` et `minimax-portal-cn` comme une même surface de quota MiniMax, et privilégient les données OAuth MiniMax enregistrées avant de se rabattre sur les variables d’environnement de clé Coding Plan.

  </Accordion>
</AccordionGroup>

## Remarques

- Modèle de chat par défaut : `MiniMax-M3`. Autres modèles de chat : `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- L’intégration initiale et la configuration directe par clé API écrivent les définitions de modèles pour M3 et les deux variantes de M2.7
- La compréhension des images utilise le fournisseur de médias `MiniMax-VL-01` appartenant au Plugin
- Mettez à jour les valeurs tarifaires dans `models.json` si vous avez besoin d’un suivi exact des coûts
- Utilisez `openclaw models list` pour confirmer l’ID actuel du fournisseur, puis changez de modèle avec `openclaw models set minimax/MiniMax-M3` ou `openclaw models set minimax-portal/MiniMax-M3`

<Note>
Consultez [Fournisseurs de modèles](/fr/concepts/model-providers) pour connaître les règles relatives aux fournisseurs.
</Note>

## Dépannage

<AccordionGroup>
  <Accordion title='"Modèle inconnu : minimax/MiniMax-M3"'>
    Cela signifie généralement que le **fournisseur MiniMax n’est pas configuré** (aucune entrée de fournisseur correspondante et aucun profil d’authentification ni aucune clé de variable d’environnement MiniMax trouvés). Pour corriger le problème :

    - Exécutez `openclaw configure` et sélectionnez une option d’authentification **MiniMax**, ou
    - Ajoutez manuellement le bloc `models.providers.minimax` ou `models.providers.minimax-portal` correspondant, ou
    - Définissez `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` ou un profil d’authentification MiniMax afin que le fournisseur correspondant puisse être injecté.

    Vérifiez que l’ID du modèle est **sensible à la casse** :

    - Chemin avec clé API : `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` ou `minimax/MiniMax-M2.7-highspeed`
    - Chemin OAuth : `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` ou `minimax-portal/MiniMax-M2.7-highspeed`

    Vérifiez ensuite à nouveau avec :

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Aide supplémentaire : [Dépannage](/fr/help/troubleshooting) et [FAQ](/fr/help/faq).
</Note>

## Contenu associé

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Paramètres partagés de l’outil d’image et sélection du fournisseur.
  </Card>
  <Card title="Génération de musique" href="/fr/tools/music-generation" icon="music">
    Paramètres partagés de l’outil de musique et sélection du fournisseur.
  </Card>
  <Card title="Génération de vidéos" href="/fr/tools/video-generation" icon="video">
    Paramètres partagés de l’outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="Recherche MiniMax" href="/fr/tools/minimax-search" icon="magnifying-glass">
    Configuration de la recherche sur le Web au moyen de MiniMax Token Plan.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Dépannage général et FAQ.
  </Card>
</CardGroup>
