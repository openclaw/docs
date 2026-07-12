---
read_when:
    - Vous souhaitez configurer des fournisseurs de recherche en mémoire ou des modèles d’embeddings
    - Vous souhaitez configurer le backend QMD
    - Vous souhaitez ajuster la recherche hybride, le MMR ou la décroissance temporelle
    - Vous souhaitez activer l’indexation multimodale de la mémoire
sidebarTitle: Memory config
summary: Tous les paramètres de configuration pour la recherche en mémoire, les fournisseurs d’embeddings, QMD, la recherche hybride et l’indexation multimodale
title: Référence de configuration de la mémoire
x-i18n:
    generated_at: "2026-07-12T03:05:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 558995797a5e217e57245e1d5ff90124fca67b6eb4767d97a3ea26a4ca013d06
    source_path: reference/memory-config.md
    workflow: 16
---

Cette page répertorie tous les paramètres de configuration de la recherche en mémoire d’OpenClaw. Pour des présentations conceptuelles, consultez :

<CardGroup cols={2}>
  <Card title="Présentation de la mémoire" href="/fr/concepts/memory">
    Fonctionnement de la mémoire.
  </Card>
  <Card title="Moteur intégré" href="/fr/concepts/memory-builtin">
    Backend SQLite par défaut.
  </Card>
  <Card title="Moteur QMD" href="/fr/concepts/memory-qmd">
    Processus auxiliaire privilégiant l’exécution locale.
  </Card>
  <Card title="Recherche en mémoire" href="/fr/concepts/memory-search">
    Pipeline de recherche et réglage.
  </Card>
  <Card title="Active Memory" href="/fr/concepts/active-memory">
    Sous-agent de mémoire pour les sessions interactives.
  </Card>
</CardGroup>

Tous les paramètres de recherche en mémoire se trouvent sous `agents.defaults.memorySearch` dans `openclaw.json` (ou dans une substitution propre à un agent sous `agents.list[].memorySearch`), sauf indication contraire.

<Note>
Si vous recherchez l’option d’activation de la fonctionnalité **Active Memory** et la configuration du sous-agent, celles-ci se trouvent sous `plugins.entries.active-memory` plutôt que sous `memorySearch`.

Active Memory utilise un modèle à deux conditions :

1. le Plugin doit être activé et cibler l’identifiant de l’agent actuel
2. la requête doit provenir d’une session de discussion interactive persistante admissible

Consultez [Active Memory](/fr/concepts/active-memory) pour le modèle d’activation, la configuration détenue par le Plugin, la persistance de la transcription et le modèle de déploiement progressif sécurisé.
</Note>

---

## Sélection du fournisseur

| Clé        | Type      | Valeur par défaut          | Description                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`  | `boolean` | `true`                     | Active ou désactive la recherche en mémoire                                                                                                                                                                                                                                                 |
| `provider` | `string`  | `"openai"`                 | Identifiant d’adaptateur d’incorporation tel que `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` ou `voyage` ; peut également être un `models.providers.<id>` configuré dont `api` pointe vers un adaptateur d’incorporation de mémoire ou une API de modèle compatible avec OpenAI |
| `model`    | `string`  | valeur par défaut du fournisseur | Nom du modèle d’incorporation                                                                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`                   | Identifiant de l’adaptateur de secours en cas d’échec de l’adaptateur principal                                                                                                                                                                                                             |

Lorsque `provider` n’est pas défini, OpenClaw utilise les incorporations OpenAI. Définissez explicitement `provider` pour utiliser Bedrock, DeepInfra, Gemini, GitHub Copilot, Mistral, Ollama, Voyage, un modèle GGUF local ou un point de terminaison `/v1/embeddings` compatible avec OpenAI. Les anciennes configurations qui indiquent encore `provider: "auto"` sont résolues en `openai`.

<Warning>
La modification du fournisseur d’incorporations, du modèle, des paramètres du fournisseur, des sources, de la portée, du découpage ou du générateur de jetons peut rendre incompatible l’index vectoriel SQLite existant. OpenClaw suspend la recherche vectorielle et signale un avertissement d’identité d’index au lieu de réincorporer automatiquement toutes les données. Reconstruisez l’index lorsque vous êtes prêt avec `openclaw memory status --index --agent <id>` ou `openclaw memory index --force --agent <id>`.
</Warning>

Lorsque `provider` n’est pas défini, que l’ancien `provider: "auto"` est présent ou que `provider: "none"` sélectionne intentionnellement le mode FTS uniquement, le rappel en mémoire peut toujours utiliser le classement lexical FTS lorsque les incorporations ne sont pas disponibles.

Les fournisseurs non locaux explicitement sélectionnés échouent de manière restrictive. Si vous définissez `memorySearch.provider` sur un fournisseur distant concret tel que Bedrock, DeepInfra, Gemini, GitHub Copilot, LM Studio, Mistral, Ollama, OpenAI, Voyage ou un fournisseur personnalisé compatible avec OpenAI, et que ce fournisseur est indisponible à l’exécution, `memory_search` renvoie un résultat d’indisponibilité au lieu d’utiliser silencieusement le rappel FTS uniquement. Corrigez la configuration du fournisseur ou de l’authentification, choisissez un fournisseur accessible ou définissez `provider: "none"` si vous souhaitez délibérément utiliser le rappel FTS uniquement.

### Identifiants de fournisseurs personnalisés

`memorySearch.provider` peut pointer vers une entrée personnalisée `models.providers.<id>` pour des adaptateurs propres à la mémoire tels que `ollama`, ou pour des API de modèles compatibles avec OpenAI telles que `openai-responses` / `openai-completions`. OpenClaw résout le propriétaire `api` de ce fournisseur pour l’adaptateur d’incorporation tout en conservant l’identifiant du fournisseur personnalisé pour la gestion du point de terminaison, de l’authentification et du préfixe de modèle. Cela permet aux configurations à plusieurs GPU ou plusieurs hôtes de réserver les incorporations de mémoire à un point de terminaison local spécifique :

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b", name: "Qwen3 Embedding 0.6B" }],
      },
    },
  },
  agents: {
    defaults: {
      memorySearch: {
        provider: "ollama-5080",
        model: "qwen3-embedding:0.6b",
      },
    },
  },
}
```

### Résolution de la clé API

Les incorporations distantes nécessitent une clé API. Bedrock utilise à la place la chaîne d’identifiants par défaut du SDK AWS (rôles d’instance, SSO, clés d’accès ou clé API Bedrock).

| Fournisseur    | Variable d’environnement                            | Clé de configuration                |
| -------------- | --------------------------------------------------- | ----------------------------------- |
| Bedrock        | Chaîne d’identifiants AWS ou `AWS_BEARER_TOKEN_BEDROCK` | Aucune clé API requise          |
| DeepInfra      | `DEEPINFRA_API_KEY`                                 | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`  | Profil d’authentification via connexion par appareil |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (valeur fictive)                   | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`    |

<Note>
OAuth de Codex couvre uniquement les discussions et les complétions et ne satisfait pas les requêtes d’incorporation.
</Note>

---

## Configuration du point de terminaison distant

Utilisez `provider: "openai-compatible"` pour un serveur `/v1/embeddings` générique compatible avec OpenAI qui ne doit pas hériter des identifiants globaux de discussion OpenAI.

<ParamField path="remote.baseUrl" type="string">
  URL de base personnalisée de l’API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Remplacement de la clé API.
</ParamField>
<ParamField path="remote.headers" type="object">
  En-têtes HTTP supplémentaires (fusionnés avec les valeurs par défaut du fournisseur).
</ParamField>

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai-compatible",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "YOUR_KEY",
        },
      },
    },
  },
}
```

---

## Configuration propre au fournisseur

<AccordionGroup>
  <Accordion title="Gemini">
    | Clé                    | Type     | Valeur par défaut      | Description                                         |
    | ---------------------- | -------- | ---------------------- | --------------------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | Prend également en charge `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Pour Embedding 2 : 768, 1536 ou 3072                |

    <Warning>
    La modification du modèle ou de `outputDimensionality` change l’identité de l’index. OpenClaw suspend la recherche vectorielle jusqu’à ce que vous reconstruisiez explicitement l’index mémoire.
    </Warning>

  </Accordion>
  <Accordion title="Types d’entrée compatibles avec OpenAI">
    Les points de terminaison d’incorporation compatibles avec OpenAI peuvent activer des champs de requête `input_type` propres au fournisseur. Cela est utile pour les modèles d’incorporation asymétriques qui nécessitent des libellés différents pour les incorporations des requêtes et des documents.

    | Clé                 | Type     | Valeur par défaut | Description                                                    |
    | ------------------- | -------- | ----------------- | -------------------------------------------------------------- |
    | `inputType`         | `string` | non défini        | `input_type` commun aux incorporations de requêtes et de documents |
    | `queryInputType`    | `string` | non défini        | `input_type` lors des requêtes ; remplace `inputType`          |
    | `documentInputType` | `string` | non défini        | `input_type` pour l’index ou le document ; remplace `inputType` |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai-compatible",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "${EMBEDDINGS_API_KEY}",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    La modification de ces valeurs affecte l’identité du cache d’incorporations pour l’indexation par lots du fournisseur et doit être suivie d’une réindexation de la mémoire lorsque le modèle en amont traite les libellés différemment.

  </Accordion>
  <Accordion title="Bedrock">
    ### Configuration des incorporations Bedrock

    Bedrock utilise la chaîne d’identifiants par défaut du SDK AWS ainsi qu’un jeton porteur vérifié par OpenClaw ; aucune clé API n’est donc stockée dans la configuration. Si OpenClaw s’exécute sur EC2 avec un rôle d’instance autorisé à utiliser Bedrock, définissez simplement le fournisseur et le modèle :

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0",
          },
        },
      },
    }
    ```

    | Clé                    | Type     | Valeur par défaut              | Description                                  |
    | ---------------------- | -------- | -------------------------------- | -------------------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Tout identifiant de modèle d’incorporation Bedrock |
    | `outputDimensionality` | `number` | valeur par défaut du modèle    | Pour Titan V2 : 256, 512 ou 1024             |

    **Modèles pris en charge** (avec détection de la famille et dimensions par défaut) :

    | ID du modèle                               | Fournisseur | Dimensions par défaut | Dimensions configurables       |
    | ------------------------------------------- | ----------- | ---------------------- | ------------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon      | 1024                   | 256, 512, 1024                  |
    | `amazon.titan-embed-text-v1`               | Amazon      | 1536                   | --                              |
    | `amazon.titan-embed-g1-text-02`            | Amazon      | 1536                   | --                              |
    | `amazon.titan-embed-image-v1`              | Amazon      | 1024                   | --                              |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon      | 1024                   | 256, 384, 1024, 3072            |
    | `cohere.embed-english-v3`                  | Cohere      | 1024                   | --                              |
    | `cohere.embed-multilingual-v3`             | Cohere      | 1024                   | --                              |
    | `cohere.embed-v4:0`                        | Cohere      | 1536                   | 256, 384, 512, 768, 1024, 1536 |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs  | 512                    | --                              |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs  | 1024                   | --                              |

    Les variantes comportant un suffixe de débit (par exemple, `amazon.titan-embed-text-v1:2:8k`) et les ID de profil d’inférence préfixés par une région (par exemple, `us.amazon.titan-embed-text-v2:0`) héritent de la configuration du modèle de base.

    **Région :** résolue dans cet ordre : le remplacement `memorySearch.remote.baseUrl`, la configuration `models.providers.amazon-bedrock.baseUrl`, `AWS_REGION`, `AWS_DEFAULT_REGION`, puis la valeur par défaut `us-east-1`.

    **Authentification :** OpenClaw recherche d’abord `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` ou `AWS_BEARER_TOKEN_BEDROCK`, puis utilise la chaîne standard de fournisseurs d’identifiants par défaut du SDK AWS :

    1. Variables d’environnement (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`), sauf si `AWS_PROFILE` est également défini
    2. SSO (uniquement lorsque les champs SSO sont configurés)
    3. Fichiers partagés d’identifiants et de configuration (`fromIni`, y compris `AWS_PROFILE`)
    4. Processus d’identification (`credential_process` dans le fichier de configuration AWS)
    5. Identifiants par jeton d’identité web
    6. Identifiants issus des métadonnées d’instance ECS ou EC2

    **Autorisations IAM :** le rôle ou l’utilisateur IAM nécessite :

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Pour appliquer le principe du moindre privilège, limitez `InvokeModel` au modèle concerné :

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + llama.cpp)">
    | Clé                   | Type               | Valeur par défaut          | Description                                                                                                                                                                                                                                                                                                                                                               |
    | --------------------- | ------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | téléchargement automatique | Chemin vers le fichier du modèle GGUF                                                                                                                                                                                                                                                                                                                                      |
    | `local.modelCacheDir` | `string`           | valeur par défaut de node-llama-cpp | Répertoire de cache des modèles téléchargés                                                                                                                                                                                                                                                                                                                       |
    | `local.contextSize`   | `number \| "auto"` | `4096`                     | Taille de la fenêtre contextuelle pour le contexte de vectorisation. 4096 couvre les fragments courants (128 à 512 jetons) tout en limitant la VRAM non occupée par les poids. Réduisez-la à 1024-2048 sur les hôtes aux ressources limitées. `"auto"` utilise le maximum d’entraînement du modèle, ce qui est déconseillé pour les modèles de 8B ou plus (Qwen3-Embedding-8B : jusqu’à 40 960 jetons peuvent porter l’utilisation de la VRAM à environ 32 Go). |

    Installez d’abord le fournisseur llama.cpp officiel : `openclaw plugins install @openclaw/llama-cpp-provider`.
    Modèle par défaut : `embeddinggemma-300m-qat-Q8_0.gguf` (environ 0,6 Go, téléchargé automatiquement). Les extractions du code source nécessitent toujours l’approbation de la compilation native : `pnpm approve-builds`, puis `pnpm rebuild node-llama-cpp`.

    Utilisez la CLI autonome pour vérifier le même chemin de fournisseur que celui utilisé par le Gateway :

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Les valeurs numériques de `local.contextSize` influencent également le placement automatique des couches GPU par node-llama-cpp, afin que les poids du modèle et le contexte de vectorisation demandé tiennent ensemble en mémoire. Après le chargement par l’environnement d’exécution, `openclaw memory status --deep` indique le dernier backend llama.cpp connu, le périphérique, le déchargement, le contexte demandé ainsi que les données de mémoire horodatées ; la consultation passive de l’état ne charge aucun modèle.

    Définissez explicitement `provider: "local"` pour les vectorisations GGUF locales. Les références de modèle `hf:` et HTTP(S) sont prises en charge dans les configurations locales explicites (via la résolution de modèle de node-llama-cpp), mais elles ne modifient pas le fournisseur par défaut.

  </Accordion>
</AccordionGroup>

### Délai d’expiration de la vectorisation en ligne

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Remplacez le délai d’expiration des lots de vectorisation en ligne pendant l’indexation de la mémoire.

Lorsque cette valeur n’est pas définie, la valeur par défaut du fournisseur est utilisée : 600 secondes pour les fournisseurs locaux ou auto-hébergés tels que `local`, `ollama` et `lmstudio`, et 120 secondes pour les fournisseurs hébergés. Augmentez cette valeur lorsque les lots de vectorisation locaux limités par le processeur fonctionnent correctement, mais lentement.
</ParamField>

---

## Comportement de l’indexation

Tous les paramètres se trouvent sous `memorySearch.sync`, sauf indication contraire :

| Clé                            | Type      | Valeur par défaut | Description                                                                                   |
| ------------------------------ | --------- | ----------------- | --------------------------------------------------------------------------------------------- |
| `onSessionStart`               | `boolean` | `true`            | Synchroniser l’index de mémoire au démarrage d’une session                                    |
| `onSearch`                     | `boolean` | `true`            | Effectuer une synchronisation différée lors d’une recherche après détection de changements de contenu |
| `watch`                        | `boolean` | `true`            | Surveiller les fichiers de mémoire (chokidar) et planifier une réindexation en cas de modification |
| `watchDebounceMs`              | `number`  | `1500`            | Fenêtre d’anti-rebond permettant de regrouper les événements rapprochés de surveillance des fichiers |
| `intervalMinutes`              | `number`  | `0`               | Intervalle de réindexation périodique en minutes (`0` la désactive)                           |
| `sessions.postCompactionForce` | `boolean` | `true`            | Forcer la réindexation d’une session après les mises à jour de transcription déclenchées par la Compaction |

<ParamField path="chunking.tokens" type="number">
  Taille des fragments en jetons utilisée lors du découpage des sources de mémoire avant la vectorisation (valeur par défaut : 400).
</ParamField>
<ParamField path="chunking.overlap" type="number">
  Chevauchement en jetons entre les fragments adjacents afin de préserver le contexte à proximité des limites de découpage (valeur par défaut : 80).
</ParamField>

<Note>
La modification de `chunking.tokens` ou de `chunking.overlap` change les limites des fragments et invalide l’identité de l’index existant (voir l’avertissement sous Sélection du fournisseur).
</Note>

---

## Configuration de la recherche hybride

Tous les paramètres sous `memorySearch.query` :

| Clé          | Type     | Valeur par défaut | Description                                                     |
| ------------ | -------- | ----------------- | --------------------------------------------------------------- |
| `maxResults` | `number` | `6`               | Nombre maximal de résultats de mémoire renvoyés avant injection |
| `minScore`   | `number` | `0.35`            | Score de pertinence minimal pour inclure un résultat            |

Et sous `memorySearch.query.hybrid` :

| Clé                   | Type      | Valeur par défaut | Description                                           |
| --------------------- | --------- | ----------------- | ----------------------------------------------------- |
| `enabled`             | `boolean` | `true`            | Active la recherche hybride BM25 + vectorielle        |
| `vectorWeight`        | `number`  | `0.7`             | Pondération des scores vectoriels (0-1)               |
| `textWeight`          | `number`  | `0.3`             | Pondération des scores BM25 (0-1)                     |
| `candidateMultiplier` | `number`  | `4`               | Multiplicateur de la taille du groupe de candidats    |

<Tabs>
  <Tab title="MMR (diversité)">
    | Clé           | Type      | Valeur par défaut | Description                                    |
    | ------------- | --------- | ----------------- | ---------------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`           | Active le reclassement MMR                     |
    | `mmr.lambda`  | `number`  | `0.7`             | 0 = diversité maximale, 1 = pertinence maximale |
  </Tab>
  <Tab title="Décroissance temporelle (récence)">
    | Clé                          | Type      | Valeur par défaut | Description                              |
    | ---------------------------- | --------- | ----------------- | ---------------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`           | Active l’amplification liée à la récence |
    | `temporalDecay.halfLifeDays` | `number`  | `30`              | Le score est divisé par deux tous les N jours |

    Les fichiers permanents (`MEMORY.md` et les fichiers non datés dans `memory/`) ne subissent jamais de décroissance.

  </Tab>
</Tabs>

### Exemple complet

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          maxResults: 6,
          minScore: 0.35,
          hybrid: {
            vectorWeight: 0.7,
            textWeight: 0.3,
            mmr: { enabled: true, lambda: 0.7 },
            temporalDecay: { enabled: true, halfLifeDays: 30 },
          },
        },
      },
    },
  },
}
```

---

## Chemins de mémoire supplémentaires

| Clé          | Type       | Description                                              |
| ------------ | ---------- | -------------------------------------------------------- |
| `extraPaths` | `string[]` | Répertoires ou fichiers supplémentaires à indexer        |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
    },
  },
}
```

Les chemins peuvent être absolus ou relatifs à l’espace de travail. Les répertoires sont analysés récursivement pour rechercher les fichiers `.md`. La gestion des liens symboliques dépend du moteur actif : le moteur intégré ignore les liens symboliques, tandis que QMD suit le comportement de son analyseur sous-jacent.

Pour une recherche dans les transcriptions d’autres agents limitée à un agent donné, utilisez `agents.list[].memorySearch.qmd.extraCollections` plutôt que `memory.qmd.paths`. Ces collections supplémentaires suivent la même structure `{ path, name, pattern? }`, mais elles sont fusionnées pour chaque agent et peuvent conserver des noms partagés explicites lorsque le chemin pointe hors de l’espace de travail actuel. Si le même chemin résolu apparaît à la fois dans `memory.qmd.paths` et `memorySearch.qmd.extraCollections`, QMD conserve la première entrée et ignore le doublon.

---

## Mémoire multimodale (Gemini)

Indexez les images et les fichiers audio avec les fichiers Markdown à l’aide de Gemini Embedding 2 :

| Clé                       | Type       | Valeur par défaut | Description                                          |
| ------------------------- | ---------- | ----------------- | ---------------------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`           | Active l’indexation multimodale                      |
| `multimodal.modalities`   | `string[]` | --                | `["image"]`, `["audio"]` ou `["all"]`                |
| `multimodal.maxFileBytes` | `number`   | `10485760`        | Taille maximale des fichiers à indexer (10 Mio)      |

<Note>
S’applique uniquement aux fichiers dans `extraPaths`. Les racines de mémoire par défaut restent limitées aux fichiers Markdown. Nécessite `gemini-embedding-2-preview`. `fallback` doit être défini sur `"none"`.
</Note>

Formats pris en charge : `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (images) ; `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Cache des embeddings

| Clé                | Type      | Valeur par défaut | Description                                        |
| ------------------ | --------- | ----------------- | -------------------------------------------------- |
| `cache.enabled`    | `boolean` | `true`            | Mettre en cache les embeddings de segments dans SQLite |
| `cache.maxEntries` | `number`  | non défini        | Limite supérieure indicative des embeddings mis en cache |

Évite de recalculer les embeddings du texte inchangé lors d’une réindexation ou de mises à jour des transcriptions. Laissez `maxEntries` non défini pour un cache sans limite ; définissez-le lorsque la croissance de l’espace disque importe davantage que la vitesse maximale de réindexation. Lorsqu’il est défini, les entrées les plus anciennes (selon leur date de dernière mise à jour) sont supprimées en premier dès que le cache dépasse la limite.

---

## Indexation par lots

| Clé                           | Type      | Valeur par défaut | Description                              |
| ----------------------------- | --------- | ----------------- | ---------------------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`               | Embeddings directs en parallèle          |
| `remote.batch.enabled`        | `boolean` | `false`           | Activer l’API d’embedding par lots       |
| `remote.batch.concurrency`    | `number`  | `2`               | Tâches par lots en parallèle             |
| `remote.batch.wait`           | `boolean` | `true`            | Attendre la fin du traitement par lots   |
| `remote.batch.pollIntervalMs` | `number`  | `2000`            | Intervalle d’interrogation               |
| `remote.batch.timeoutMinutes` | `number`  | `60`              | Délai d’expiration du traitement par lots |

Disponible pour `gemini`, `openai` et `voyage`. Le traitement par lots d’OpenAI est généralement le plus rapide et le moins coûteux pour les remplissages rétroactifs volumineux.

`remote.nonBatchConcurrency` contrôle les appels directs d’embedding utilisés par les fournisseurs locaux ou auto-hébergés, ainsi que par les fournisseurs hébergés lorsque leurs API de traitement par lots ne sont pas actives. Pour l’indexation sans traitement par lots, Ollama utilise par défaut la valeur `1` afin d’éviter de surcharger les petites machines locales ; définissez une valeur plus élevée sur les machines plus puissantes.

Ce paramètre est distinct de `sync.embeddingBatchTimeoutSeconds`, qui contrôle le délai d’expiration des appels directs d’embedding.

---

## Recherche dans la mémoire des sessions (expérimental)

Indexez les transcriptions de sessions et rendez-les accessibles via `memory_search` :

| Clé                           | Type       | Valeur par défaut | Description                                            |
| ----------------------------- | ---------- | ----------------- | ------------------------------------------------------ |
| `experimental.sessionMemory`  | `boolean`  | `false`           | Activer l’indexation des sessions                      |
| `sources`                     | `string[]` | `["memory"]`      | Ajouter `"sessions"` pour inclure les transcriptions   |
| `sync.sessions.deltaBytes`    | `number`   | `100000`          | Seuil en octets pour la réindexation                   |
| `sync.sessions.deltaMessages` | `number`   | `50`              | Seuil de messages pour la réindexation                 |

<Warning>
L’indexation des sessions est facultative et s’exécute de manière asynchrone. Les résultats peuvent être légèrement obsolètes. Les journaux de session sont stockés sur disque ; considérez donc l’accès au système de fichiers comme la frontière de confiance.
</Warning>

Les résultats issus des transcriptions de sessions respectent également
[`tools.sessions.visibility`](/fr/gateway/config-tools#toolssessions). La visibilité
`tree` par défaut n’expose que la session actuelle et les sessions qu’elle a
créées. Pour retrouver, depuis une autre session telle qu’un message privé, une
session sans lien distribuée par le Gateway au même agent, élargissez
intentionnellement la visibilité à `agent` (ou à `all` uniquement lorsque le
rappel entre agents est également nécessaire et que la politique entre agents
l’autorise).

Les exemples ci-dessous placent ces paramètres sous `agents.defaults`. Vous
pouvez également appliquer des paramètres `memorySearch` équivalents dans une
surcharge propre à un agent lorsque seul cet agent doit indexer et rechercher
les transcriptions de sessions.

Pour le rappel du Gateway vers les messages privés d’un même agent :

<Tabs>
  <Tab title="Backend intégré">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
  <Tab title="Backend QMD">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      memory: {
        backend: "qmd",
        qmd: {
          sessions: { enabled: true },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
</Tabs>

Avec QMD, `agents.defaults.memorySearch.experimental.sessionMemory` et
`sources: ["sessions"]` n’exportent pas à eux seuls les transcriptions vers QMD.
Définissez également `memory.qmd.sessions.enabled: true`.

---

  ## Accélération vectorielle SQLite (sqlite-vec)

  | Clé                          | Type      | Valeur par défaut | Description                                  |
  | ---------------------------- | --------- | ----------------- | -------------------------------------------- |
  | `store.vector.enabled`       | `boolean` | `true`            | Utiliser sqlite-vec pour les requêtes vectorielles |
  | `store.vector.extensionPath` | `string`  | intégré           | Remplacer le chemin de sqlite-vec             |

  Lorsque sqlite-vec est indisponible, OpenClaw utilise automatiquement en remplacement la similarité cosinus calculée dans le processus.

  ---

  ## Stockage des index

  Les index de mémoire intégrés résident dans la base de données SQLite OpenClaw de chaque agent, à l’emplacement
  `agents/<agentId>/agent/openclaw-agent.sqlite`.

  | Clé                   | Type     | Valeur par défaut | Description                                    |
  | --------------------- | -------- | ----------------- | ---------------------------------------------- |
  | `store.fts.tokenizer` | `string` | `unicode61`       | Segmenteur FTS5 (`unicode61` ou `trigram`)     |

  ---

  ## Configuration du backend QMD

  Définissez `memory.backend = "qmd"` pour l’activer. Tous les paramètres QMD se trouvent sous `memory.qmd` :

  | Clé                      | Type      | Valeur par défaut | Description                                                                           |
  | ------------------------ | --------- | ----------------- | ------------------------------------------------------------------------------------- |
  | `command`                | `string`  | `qmd`             | Chemin de l’exécutable QMD ; définissez un chemin absolu lorsque le `PATH` du service diffère de celui de votre shell |
  | `searchMode`             | `string`  | `search`          | Commande de recherche : `search`, `vsearch`, `query`                                  |
  | `rerank`                 | `boolean` | --                | Définissez `false` avec `searchMode: "query"` et QMD 2.1+ pour ignorer le reclassement QMD |
  | `includeDefaultMemory`   | `boolean` | `true`            | Indexer automatiquement `MEMORY.md` + `memory/**/*.md`                                |
  | `paths[]`                | `array`   | --                | Chemins supplémentaires : `{ name, path, pattern? }`                                  |
  | `sessions.enabled`       | `boolean` | `false`           | Exporter les transcriptions de sessions vers QMD                                      |
  | `sessions.retentionDays` | `number`  | --                | Durée de conservation des transcriptions                                               |
  | `sessions.exportDir`     | `string`  | --                | Répertoire d’exportation                                                               |

  `searchMode: "search"` utilise uniquement la recherche lexicale/BM25. OpenClaw n’exécute pas de vérifications de disponibilité des vecteurs sémantiques ni de maintenance des plongements QMD pour ce mode, y compris pendant `memory status --deep` ; `vsearch` et `query` continuent d’exiger que les vecteurs et les plongements QMD soient prêts.

  `rerank: false` modifie uniquement le mode `query` de QMD et nécessite QMD 2.1 ou une version plus récente. En mode CLI direct, OpenClaw transmet `--no-rerank` ; en mode MCP reposant sur mcporter, il transmet `rerank: false` à l’outil de requête unifié de QMD. Ne le définissez pas pour utiliser le comportement de reclassement par défaut des requêtes QMD.

  OpenClaw privilégie les formats actuels des collections QMD et des requêtes MCP, mais maintient la compatibilité avec les anciennes versions de QMD en essayant, si nécessaire, des options compatibles pour les motifs de collections et d’anciens noms d’outils MCP. Lorsque QMD annonce la prise en charge de plusieurs filtres de collections, les collections de même source sont interrogées par un seul processus QMD ; les anciennes versions de QMD conservent le chemin de compatibilité par collection. « De même source » signifie que les collections de mémoire persistante — fichiers de mémoire par défaut et chemins personnalisés — sont regroupées, tandis que les collections de transcriptions de sessions restent dans un groupe distinct afin que la diversification des sources conserve les deux entrées.

  <Note>
  Les remplacements de modèles QMD restent configurés côté QMD, et non dans la configuration OpenClaw. Si vous devez remplacer globalement les modèles de QMD, définissez des variables d’environnement telles que `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` et `QMD_GENERATE_MODEL` dans l’environnement d’exécution du Gateway.
  </Note>

  ### Intégration de mcporter

  Tous les paramètres se trouvent sous `memory.qmd.mcporter`. Cette configuration achemine les recherches QMD par l’intermédiaire d’un démon MCP `mcporter` de longue durée au lieu de lancer `qmd` pour chaque requête, ce qui réduit le coût des démarrages à froid pour les modèles plus volumineux.

  | Clé           | Type      | Valeur par défaut | Description                                                            |
  | ------------- | --------- | ----------------- | ---------------------------------------------------------------------- |
  | `enabled`     | `boolean` | `false`           | Acheminer les appels QMD via mcporter au lieu de lancer `qmd` pour chaque requête |
  | `serverName`  | `string`  | `qmd`             | Nom du serveur mcporter qui exécute `qmd mcp` avec `lifecycle: keep-alive` |
  | `startDaemon` | `boolean` | `true`            | Démarrer automatiquement le démon mcporter lorsque `enabled` vaut `true` |

  Nécessite que `mcporter` soit installé et accessible dans PATH, ainsi qu’un serveur mcporter configuré pour exécuter `qmd mcp`. Laissez cette option désactivée pour les configurations locales plus simples, lorsque le coût de lancement d’un processus pour chaque requête est acceptable.

  <AccordionGroup>
  <Accordion title="Planification des mises à jour">
    | Clé                       | Type      | Valeur par défaut | Description                           |
    | --------------------------- | --------- | ----------------- | ---------------------------------------- |
    | `update.interval`         | `string`  | `5m`              | Intervalle d’actualisation             |
    | `update.debounceMs`       | `number`  | `15000`           | Temporisation des modifications de fichiers |
    | `update.onBoot`           | `boolean` | `true`            | Actualiser à l’ouverture du gestionnaire QMD de longue durée ; définissez `false` pour ignorer la mise à jour immédiate au démarrage |
    | `update.startup`          | `string`  | `off`             | Initialisation QMD facultative au démarrage du Gateway : `off`, `idle` ou `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000`          | Délai avant l’exécution de l’actualisation `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false`           | Bloquer l’ouverture du gestionnaire jusqu’à la fin de son actualisation initiale |
    | `update.embedInterval`    | `string`  | `60m`             | Fréquence distincte de génération des plongements |
    | `update.commandTimeoutMs` | `number`  | `30000`           | Délai d’expiration des commandes de maintenance QMD (liste/ajout de collections) |
    | `update.updateTimeoutMs`  | `number`  | `120000`          | Délai d’expiration de chaque cycle `qmd update` |
    | `update.embedTimeoutMs`   | `number`  | `120000`          | Délai d’expiration de chaque cycle `qmd embed` |
  </Accordion>
  <Accordion title="Limites">
    | Clé                       | Type     | Valeur par défaut | Description                |
    | --------------------------- | -------- | ----------------- | ------------------------------ |
    | `limits.maxResults`       | `number` | `4`               | Nombre maximal de résultats de recherche |
    | `limits.maxSnippetChars`  | `number` | `450`             | Limiter la longueur des extraits |
    | `limits.maxInjectedChars` | `number` | `2200`            | Limiter le nombre total de caractères injectés |
    | `limits.timeoutMs`        | `number` | `4000`            | Délai d’expiration de la recherche |
  </Accordion>
  <Accordion title="Portée">
    Contrôle les sessions qui peuvent recevoir les résultats de recherche QMD. Même schéma que [`session.sendPolicy`](/fr/gateway/config-agents#session) :

    ```json5
    {
      memory: {
        qmd: {
          scope: {
            default: "deny",
            rules: [{ action: "allow", match: { chatType: "direct" } }],
          },
        },
      },
    }
    ```

    La valeur par défaut fournie autorise uniquement les messages privés et les conversations directes, et refuse les groupes ainsi que les autres types de canaux. `match.keyPrefix` correspond à la clé de session normalisée ; `match.rawKeyPrefix` correspond à la clé brute, y compris `agent:<id>:`.

  </Accordion>
  <Accordion title="Citations">
    `memory.citations` s’applique à tous les backends :

    | Valeur             | Comportement                                                          |
    | ------------------ | --------------------------------------------------------------------- |
    | `auto` (par défaut) | Inclut le pied de page `Source: <path#line>` dans les extraits        |
    | `on`               | Inclut toujours le pied de page                                       |
    | `off`              | Omet le pied de page (le chemin reste transmis à l’agent en interne)  |

  </Accordion>
</AccordionGroup>

Lorsque l’initialisation de QMD au démarrage du Gateway est activée, OpenClaw démarre QMD uniquement pour les agents éligibles. Si `update.onBoot` vaut `true` et qu’aucune maintenance par intervalle ou d’intégration n’est configurée, le démarrage utilise un gestionnaire ponctuel pour l’actualisation initiale, puis le ferme. Si un intervalle de mise à jour ou d’intégration est configuré, le démarrage ouvre le gestionnaire QMD à longue durée de vie afin qu’il puisse gérer l’observateur et les minuteurs d’intervalle ; `update.onBoot: false` ignore uniquement l’actualisation immédiate au démarrage.

### Exemple QMD complet

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 4, timeoutMs: 4000 },
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

---

## Dreaming

Dreaming se configure sous `plugins.entries.memory-core.config.dreaming`, et non sous `agents.defaults.memorySearch`.

Dreaming s’exécute sous la forme d’un balayage planifié unique et utilise en interne des phases légère, profonde et REM comme détail d’implémentation.

Pour le comportement conceptuel et les commandes slash, consultez [Dreaming](/fr/concepts/dreaming).

### Paramètres utilisateur

| Clé                                    | Type      | Valeur par défaut | Description                                                                                                                                                                      |
| -------------------------------------- | --------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`           | Active ou désactive entièrement Dreaming                                                                                                                                         |
| `frequency`                            | `string`  | `0 3 * * *`       | Cadence Cron facultative pour le balayage Dreaming complet                                                                                                                       |
| `model`                                | `string`  | modèle par défaut | Remplacement facultatif du modèle du sous-agent Dream Diary                                                                                                                      |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`             | Nombre maximal estimé de jetons conservés pour chaque extrait de rappel à court terme promu dans `MEMORY.md` ; les métadonnées de provenance restent visibles                    |

### Exemple

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        subagent: {
          allowModelOverride: true,
          allowedModels: ["anthropic/claude-sonnet-4-6"],
        },
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
            model: "anthropic/claude-sonnet-4-6",
          },
        },
      },
    },
  },
}
```

<Note>
- Dreaming écrit l’état machine dans `memory/.dreams/`.
- Dreaming écrit la sortie narrative lisible par l’utilisateur dans `DREAMS.md` (ou dans le fichier `dreams.md` existant).
- `dreaming.model` utilise la barrière de confiance existante du sous-agent du Plugin ; définissez `plugins.entries.memory-core.subagent.allowModelOverride: true` avant de l’activer.
- Dream Diary effectue une nouvelle tentative avec le modèle par défaut de la session lorsque le modèle configuré est indisponible. Les échecs liés à la confiance ou à la liste d’autorisation sont journalisés et ne font pas l’objet d’une nouvelle tentative silencieuse.
- La stratégie et les seuils des phases légère, profonde et REM relèvent du comportement interne et ne constituent pas une configuration destinée à l’utilisateur.

</Note>

## Pages associées

- [Référence de configuration](/fr/gateway/configuration-reference)
- [Présentation de la mémoire](/fr/concepts/memory)
- [Recherche dans la mémoire](/fr/concepts/memory-search)
