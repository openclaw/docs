---
read_when:
    - Vous voulez utiliser des modèles MiniMax dans OpenClaw
    - Vous avez besoin d’instructions de configuration pour MiniMax
summary: Utiliser les modèles MiniMax dans OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-06-27T18:05:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fe606178d7d15383e56c026b02ba7be751ead706adc097c776c0a6a92aa2a2
    source_path: providers/minimax.md
    workflow: 16
---

OpenClaw utilise par défaut **MiniMax M3** pour son fournisseur MiniMax.

MiniMax fournit également :

- Synthèse vocale intégrée via T2A v2
- Compréhension d’images intégrée via `MiniMax-VL-01`
- Génération musicale intégrée via `music-2.6`
- `web_search` intégré via l’API de recherche MiniMax Token Plan

Répartition des fournisseurs :

| ID de fournisseur | Authentification | Capacités                                                                                              |
| ----------------- | ---------------- | ------------------------------------------------------------------------------------------------------- |
| `minimax`         | Clé API          | Texte, génération d’images, génération musicale, génération vidéo, compréhension d’images, parole, recherche web |
| `minimax-portal`  | OAuth            | Texte, génération d’images, génération musicale, génération vidéo, compréhension d’images, parole       |

## Catalogue intégré

| Modèle                   | Type                  | Description                                      |
| ------------------------ | --------------------- | ------------------------------------------------ |
| `MiniMax-M3`             | Chat (raisonnement)   | Modèle de raisonnement hébergé par défaut        |
| `MiniMax-M2.7`           | Chat (raisonnement)   | Modèle de raisonnement hébergé précédent         |
| `MiniMax-M2.7-highspeed` | Chat (raisonnement)   | Niveau de raisonnement M2.7 plus rapide          |
| `MiniMax-VL-01`          | Vision                | Modèle de compréhension d’images                 |
| `image-01`               | Génération d’images   | Édition texte-vers-image et image-vers-image     |
| `music-2.6`              | Génération musicale   | Modèle musical par défaut                        |
| `music-2.5`              | Génération musicale   | Niveau de génération musicale précédent          |
| `music-2.0`              | Génération musicale   | Ancien niveau de génération musicale             |
| `MiniMax-Hailuo-2.3`     | Génération vidéo      | Flux texte-vers-vidéo et avec image de référence |

## Bien démarrer

Choisissez votre méthode d’authentification préférée et suivez les étapes de configuration.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Idéal pour :** une configuration rapide avec MiniMax Coding Plan via OAuth, sans clé API requise.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Exécuter l’intégration">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Cela authentifie auprès de `api.minimax.io`.
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
          <Step title="Exécuter l’intégration">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Cela authentifie auprès de `api.minimaxi.com`.
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
    Les configurations OAuth utilisent l’ID de fournisseur `minimax-portal`. Les références de modèle suivent la forme `minimax-portal/MiniMax-M3`.
    </Note>

    <Tip>
    Lien de parrainage pour MiniMax Coding Plan (10 % de réduction) : [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="Clé API">
    **Idéal pour :** MiniMax hébergé avec une API compatible Anthropic.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Exécuter l’intégration">
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
          <Step title="Exécuter l’intégration">
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
    Sur le chemin de streaming compatible Anthropic, OpenClaw désactive par défaut le raisonnement de MiniMax M2.x, sauf si vous définissez explicitement `thinking` vous-même. Le point de terminaison de streaming de M2.x émet `reasoning_content` dans des fragments delta de style OpenAI au lieu de blocs de réflexion Anthropic natifs, ce qui peut exposer le raisonnement interne dans la sortie visible s’il reste activé implicitement. MiniMax-M3 (et M3.x compatible avec les versions futures) est exempté de cette valeur par défaut : M3 émet des blocs de réflexion Anthropic corrects et nécessite que la réflexion soit active pour produire du contenu visible ; OpenClaw conserve donc M3 sur le chemin de réflexion omis/adaptatif du fournisseur.
    </Warning>

    <Note>
    Les configurations par clé API utilisent l’ID de fournisseur `minimax`. Les références de modèle suivent la forme `minimax/MiniMax-M3`.
    </Note>

  </Tab>
</Tabs>

## Configurer via `openclaw configure`

Utilisez l’assistant de configuration interactif pour définir MiniMax sans modifier le JSON :

<Steps>
  <Step title="Lancer l’assistant">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Sélectionner Model/auth">
    Choisissez **Model/auth** dans le menu.
  </Step>
  <Step title="Choisir une option d’authentification MiniMax">
    Choisissez l’une des options MiniMax disponibles :

    | Choix d’authentification | Description |
    | --- | --- |
    | `minimax-global-oauth` | OAuth international (Coding Plan) |
    | `minimax-cn-oauth` | OAuth Chine (Coding Plan) |
    | `minimax-global-api` | Clé API internationale |
    | `minimax-cn-api` | Clé API Chine |

  </Step>
  <Step title="Choisir votre modèle par défaut">
    Sélectionnez votre modèle par défaut lorsque vous y êtes invité.
  </Step>
</Steps>

## Capacités

### Génération d’images

Le Plugin MiniMax enregistre le modèle `image-01` pour l’outil `image_generate`. Il prend en charge :

- **Génération texte-vers-image** avec contrôle du rapport d’aspect
- **Édition image-vers-image** (référence de sujet) avec contrôle du rapport d’aspect
- Jusqu’à **9 images de sortie** par requête
- Jusqu’à **1 image de référence** par requête d’édition
- Rapports d’aspect pris en charge : `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

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

Le Plugin utilise la même authentification `MINIMAX_API_KEY` ou OAuth que les modèles de texte. Aucune configuration supplémentaire n’est nécessaire si MiniMax est déjà configuré.

`minimax` et `minimax-portal` enregistrent tous deux `image_generate` avec le même
modèle `image-01`. Les configurations par clé API utilisent `MINIMAX_API_KEY` ; les configurations OAuth peuvent utiliser
le chemin d’authentification `minimax-portal` intégré à la place.

La génération d’images utilise toujours le point de terminaison dédié de MiniMax
(`/v1/image_generation`) et ignore `models.providers.minimax.baseUrl`,
car ce champ configure l’URL de base compatible chat/Anthropic. Définissez
`MINIMAX_API_HOST=https://api.minimaxi.com` pour router la génération d’images
via le point de terminaison CN ; le point de terminaison global par défaut est
`https://api.minimax.io`.

Lorsque l’intégration ou la configuration par clé API écrit des entrées `models.providers.minimax`
explicites, OpenClaw matérialise `MiniMax-M3`, `MiniMax-M2.7` et
`MiniMax-M2.7-highspeed` comme modèles de chat. M3 annonce la saisie texte et image ;
la compréhension d’images reste exposée séparément via le fournisseur multimédia
`MiniMax-VL-01` détenu par le Plugin.

<Note>
Consultez [Génération d’images](/fr/tools/image-generation) pour les paramètres d’outil partagés, la sélection du fournisseur et le comportement de basculement.
</Note>

### Texte-vers-parole

Le Plugin `minimax` intégré enregistre MiniMax T2A v2 comme fournisseur vocal pour
`messages.tts`.

- Modèle TTS par défaut : `speech-2.8-hd`
- Voix par défaut : `English_expressive_narrator`
- Les ID de modèles intégrés pris en charge incluent `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` et `speech-01-turbo`.
- La résolution d’authentification est `messages.tts.providers.minimax.apiKey`, puis
  les profils d’authentification OAuth/jeton `minimax-portal`, puis les clés d’environnement
  Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), puis `MINIMAX_API_KEY`.
- Si aucun hôte TTS n’est configuré, OpenClaw réutilise l’hôte OAuth
  `minimax-portal` configuré et supprime les suffixes de chemin compatibles Anthropic
  tels que `/anthropic`.
- Les pièces jointes audio normales restent en MP3.
- Les cibles de notes vocales telles que Feishu et Telegram sont transcodées depuis le MP3 MiniMax
  vers Opus 48 kHz avec `ffmpeg`, car l’API de fichiers Feishu/Lark n’accepte que
  `file_type: "opus"` pour les messages audio natifs.
- MiniMax T2A accepte les valeurs fractionnaires `speed` et `vol`, mais `pitch` est envoyé comme
  entier ; OpenClaw tronque les valeurs fractionnaires de `pitch` avant la requête API.

| Paramètre                                       | Variable d’environnement | Par défaut                    | Description                                  |
| ----------------------------------------------- | ------------------------ | ----------------------------- | -------------------------------------------- |
| `messages.tts.providers.minimax.baseUrl`        | `MINIMAX_API_HOST`       | `https://api.minimax.io`      | Hôte de l’API MiniMax T2A.                   |
| `messages.tts.providers.minimax.model`          | `MINIMAX_TTS_MODEL`      | `speech-2.8-hd`               | ID du modèle TTS.                            |
| `messages.tts.providers.minimax.speakerVoiceId` | `MINIMAX_TTS_VOICE_ID`   | `English_expressive_narrator` | ID de voix utilisé pour la sortie vocale.    |
| `messages.tts.providers.minimax.speed`          |                          | `1.0`                         | Vitesse de lecture, `0.5..2.0`.              |
| `messages.tts.providers.minimax.vol`            |                          | `1.0`                         | Volume, `(0, 10]`.                           |
| `messages.tts.providers.minimax.pitch`          |                          | `0`                           | Décalage de hauteur entier, `-12..12`.       |

### Génération musicale

Le Plugin MiniMax intégré enregistre la génération musicale via l’outil partagé
`music_generate` pour `minimax` et `minimax-portal`.

- Modèle de musique par défaut : `minimax/music-2.6`
- Modèle de musique OAuth : `minimax-portal/music-2.6`
- Prend aussi en charge `minimax/music-2.5` et `minimax/music-2.0`
- Contrôles du prompt : `lyrics`, `instrumental`
- Format de sortie : `mp3`
- Les exécutions adossées à une session se détachent via le flux partagé de tâches/statuts, y compris `action: "status"`

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
Consultez [Génération de musique](/fr/tools/music-generation) pour les paramètres d’outil partagés, la sélection du fournisseur et le comportement de basculement.
</Note>

### Génération de vidéo

Le Plugin MiniMax intégré enregistre la génération de vidéo via l’outil partagé
`video_generate` pour `minimax` et `minimax-portal`.

- Modèle de vidéo par défaut : `minimax/MiniMax-Hailuo-2.3`
- Modèle de vidéo OAuth : `minimax-portal/MiniMax-Hailuo-2.3`
- Modes : flux texte vers vidéo et référence à image unique
- Prend en charge `aspectRatio` et `resolution`

Pour utiliser MiniMax comme fournisseur de vidéo par défaut :

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
Consultez [Génération de vidéo](/fr/tools/video-generation) pour les paramètres d’outil partagés, la sélection du fournisseur et le comportement de basculement.
</Note>

### Compréhension d’image

Le Plugin MiniMax enregistre la compréhension d’image séparément du catalogue
de texte :

| ID de fournisseur | Modèle d’image par défaut |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

C’est pourquoi le routage automatique des médias peut utiliser la compréhension d’image MiniMax même
lorsque le catalogue de fournisseur de texte intégré inclut aussi des références de chat M3 compatibles avec l’image.

### Recherche Web

Le Plugin MiniMax enregistre aussi `web_search` via l’API de recherche MiniMax Token Plan.

- ID de fournisseur : `minimax`
- Résultats structurés : titres, URL, extraits, requêtes associées
- Variable d’environnement préférée : `MINIMAX_CODE_PLAN_KEY`
- Alias d’environnement acceptés : `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Repli de compatibilité : `MINIMAX_API_KEY` lorsqu’elle pointe déjà vers un identifiant de Token Plan
- Réutilisation de région : `plugins.entries.minimax.config.webSearch.region`, puis `MINIMAX_API_HOST`, puis les URL de base du fournisseur MiniMax
- La recherche reste sur l’ID de fournisseur `minimax` ; la configuration OAuth CN/globale peut orienter indirectement la région via `models.providers.minimax-portal.baseUrl` et peut fournir l’authentification bearer via `MINIMAX_OAUTH_TOKEN`

La configuration se trouve sous `plugins.entries.minimax.config.webSearch.*`.

<Note>
Consultez [Recherche MiniMax](/fr/tools/minimax-search) pour la configuration et l’utilisation complètes de la recherche Web.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Options de configuration">
    | Option | Description |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Préférez `https://api.minimax.io/anthropic` (compatible Anthropic) ; `https://api.minimax.io/v1` est facultatif pour les charges utiles compatibles OpenAI |
    | `models.providers.minimax.api` | Préférez `anthropic-messages` ; `openai-completions` est facultatif pour les charges utiles compatibles OpenAI |
    | `models.providers.minimax.apiKey` | Clé d’API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Définissez `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Créez des alias pour les modèles que vous voulez dans la liste d’autorisation |
    | `models.mode` | Gardez `merge` si vous voulez ajouter MiniMax aux côtés des éléments intégrés |
  </Accordion>

  <Accordion title="Valeurs par défaut de réflexion">
    Sur `api: "anthropic-messages"`, OpenClaw injecte `thinking: { type: "disabled" }` pour les modèles MiniMax M2.x, sauf si la réflexion est déjà explicitement définie dans les paramètres/la configuration.

    Cela empêche le point de terminaison de streaming M2.x d’émettre `reasoning_content` dans des fragments de delta de style OpenAI, ce qui exposerait le raisonnement interne dans la sortie visible.

    MiniMax-M3 (et M3.x) est exempté : M3 émet de véritables blocs de réflexion Anthropic et renvoie un tableau `content` vide avec `stop_reason: "end_turn"` lorsque la réflexion est désactivée ; l’enveloppe garde donc M3 sur le chemin de réflexion omis/adaptatif du fournisseur.

  </Accordion>

  <Accordion title="Mode rapide">
    `/fast on` ou `params.fastMode: true` réécrit `MiniMax-M2.7` en `MiniMax-M2.7-highspeed` sur le chemin de flux compatible Anthropic.
  </Accordion>

  <Accordion title="Exemple de repli">
    **Idéal pour :** garder votre modèle le plus puissant de dernière génération comme principal, avec basculement vers MiniMax M2.7. L’exemple ci-dessous utilise Opus comme principal concret ; remplacez-le par votre modèle principal de dernière génération préféré.

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
    - API d’utilisation du Coding Plan : `https://api.minimaxi.com/v1/token_plan/remains` ou `https://api.minimax.io/v1/token_plan/remains` (nécessite une clé de Coding Plan).
    - L’interrogation de l’utilisation déduit l’hôte depuis `models.providers.minimax-portal.baseUrl` ou `models.providers.minimax.baseUrl` lorsqu’il est configuré, de sorte que les configurations globales utilisant `https://api.minimax.io/anthropic` interrogent `api.minimax.io`. Les URL de base manquantes ou mal formées conservent le repli CN pour compatibilité.
    - OpenClaw normalise l’utilisation du MiniMax Coding Plan avec le même affichage `% restant` que les autres fournisseurs. Les champs bruts `usage_percent` / `usagePercent` de MiniMax correspondent au quota restant, et non au quota consommé ; OpenClaw les inverse donc. Les champs basés sur le nombre prévalent lorsqu’ils sont présents.
    - Lorsque l’API renvoie `model_remains`, OpenClaw privilégie l’entrée du modèle de chat, déduit si nécessaire le libellé de fenêtre à partir de `start_time` / `end_time`, et inclut le nom du modèle sélectionné dans le libellé du plan afin de rendre les fenêtres de Coding Plan plus faciles à distinguer.
    - Les instantanés d’utilisation traitent `minimax`, `minimax-cn` et `minimax-portal` comme la même surface de quota MiniMax, et privilégient l’OAuth MiniMax stocké avant de se rabattre sur les variables d’environnement de clé de Coding Plan.

  </Accordion>
</AccordionGroup>

## Notes

- Les références de modèle suivent le chemin d’authentification :
  - Configuration par clé d’API : `minimax/<model>`
  - Configuration OAuth : `minimax-portal/<model>`
- Modèle de chat par défaut : `MiniMax-M3`
- Modèles de chat alternatifs : `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- L’onboarding et la configuration directe par clé d’API écrivent les définitions de modèle pour M3 et les deux variantes M2.7
- La compréhension d’image utilise le fournisseur média `MiniMax-VL-01` détenu par le Plugin
- Mettez à jour les valeurs de tarification dans `models.json` si vous avez besoin d’un suivi exact des coûts
- Utilisez `openclaw models list` pour confirmer l’ID de fournisseur actuel, puis changez avec `openclaw models set minimax/MiniMax-M3` ou `openclaw models set minimax-portal/MiniMax-M3`

<Tip>
Lien de parrainage pour MiniMax Coding Plan (10 % de réduction) : [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Consultez [Fournisseurs de modèles](/fr/concepts/model-providers) pour les règles de fournisseur.
</Note>

## Dépannage

<AccordionGroup>
  <Accordion title='"Modèle inconnu : minimax/MiniMax-M3"'>
    Cela signifie généralement que le **fournisseur MiniMax n’est pas configuré** (aucune entrée de fournisseur correspondante et aucun profil d’authentification MiniMax/clé d’environnement MiniMax trouvé). Un correctif pour cette détection est dans **2026.1.12**. Corrigez ainsi :

    - Passez à **2026.1.12** (ou exécutez depuis la source `main`), puis redémarrez le gateway.
    - Exécutez `openclaw configure` et sélectionnez une option d’authentification **MiniMax**, ou
    - Ajoutez manuellement le bloc `models.providers.minimax` ou `models.providers.minimax-portal` correspondant, ou
    - Définissez `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` ou un profil d’authentification MiniMax afin que le fournisseur correspondant puisse être injecté.

    Assurez-vous que l’ID du modèle est **sensible à la casse** :

    - Chemin par clé d’API : `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` ou `minimax/MiniMax-M2.7-highspeed`
    - Chemin OAuth : `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` ou `minimax-portal/MiniMax-M2.7-highspeed`

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
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèle et le comportement de basculement.
  </Card>
  <Card title="Génération d’image" href="/fr/tools/image-generation" icon="image">
    Paramètres d’outil d’image partagés et sélection du fournisseur.
  </Card>
  <Card title="Génération de musique" href="/fr/tools/music-generation" icon="music">
    Paramètres d’outil de musique partagés et sélection du fournisseur.
  </Card>
  <Card title="Génération de vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres d’outil de vidéo partagés et sélection du fournisseur.
  </Card>
  <Card title="Recherche MiniMax" href="/fr/tools/minimax-search" icon="magnifying-glass">
    Configuration de la recherche Web via MiniMax Token Plan.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Dépannage général et FAQ.
  </Card>
</CardGroup>
