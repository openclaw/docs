---
read_when:
    - Vous voulez configurer des fournisseurs de recherche en mémoire ou des modèles d’intégration vectorielle
    - Vous voulez configurer le backend QMD
    - Vous voulez ajuster la recherche hybride, le MMR ou la décroissance temporelle
    - Vous souhaitez activer l’indexation multimodale de la mémoire
sidebarTitle: Memory config
summary: Tous les paramètres de configuration pour la recherche en mémoire, les fournisseurs d’embeddings, QMD, la recherche hybride et l’indexation multimodale
title: Référence de configuration de la mémoire
x-i18n:
    generated_at: "2026-04-30T16:29:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58b75751a19afb883fd7646cf5f71859f95bac468b2bfd8cc79db12ae892f70f
    source_path: reference/memory-config.md
    workflow: 16
---

Cette page liste tous les paramètres de configuration de la recherche mémoire d’OpenClaw. Pour les vues d’ensemble conceptuelles, consultez :

<CardGroup cols={2}>
  <Card title="Vue d’ensemble de la mémoire" href="/fr/concepts/memory">
    Fonctionnement de la mémoire.
  </Card>
  <Card title="Moteur intégré" href="/fr/concepts/memory-builtin">
    Backend SQLite par défaut.
  </Card>
  <Card title="Moteur QMD" href="/fr/concepts/memory-qmd">
    Sidecar privilégiant le local.
  </Card>
  <Card title="Recherche mémoire" href="/fr/concepts/memory-search">
    Pipeline de recherche et réglage.
  </Card>
  <Card title="Active Memory" href="/fr/concepts/active-memory">
    Sous-agent mémoire pour les sessions interactives.
  </Card>
</CardGroup>

Tous les paramètres de recherche mémoire se trouvent sous `agents.defaults.memorySearch` dans `openclaw.json`, sauf indication contraire.

<Note>
Si vous cherchez le commutateur de fonctionnalité **Active Memory** et la configuration du sous-agent, ils se trouvent sous `plugins.entries.active-memory` plutôt que sous `memorySearch`.

Active Memory utilise un modèle à deux portes :

1. le plugin doit être activé et cibler l’id de l’agent actuel
2. la requête doit être une session de chat interactive persistante éligible

Consultez [Active Memory](/fr/concepts/active-memory) pour le modèle d’activation, la configuration détenue par le plugin, la persistance de la transcription et le modèle de déploiement sûr.
</Note>

---

## Sélection du fournisseur

| Clé        | Type      | Par défaut          | Description                                                                                                                                                                                                                        |
| ---------- | --------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | détecté automatiquement | ID d’adaptateur d’embeddings tel que `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai` ou `voyage` ; peut aussi être un `models.providers.<id>` configuré dont `api` pointe vers l’un de ces adaptateurs |
| `model`    | `string`  | valeur par défaut du fournisseur | Nom du modèle d’embeddings                                                                                                                                                                                                         |
| `fallback` | `string`  | `"none"`            | ID d’adaptateur de repli lorsque le principal échoue                                                                                                                                                                               |
| `enabled`  | `boolean` | `true`              | Activer ou désactiver la recherche mémoire                                                                                                                                                                                         |

### Ordre de détection automatique

Lorsque `provider` n’est pas défini, OpenClaw sélectionne le premier disponible :

<Steps>
  <Step title="local">
    Sélectionné si `memorySearch.local.modelPath` est configuré et que le fichier existe.
  </Step>
  <Step title="github-copilot">
    Sélectionné si un jeton GitHub Copilot peut être résolu (variable d’environnement ou profil d’authentification).
  </Step>
  <Step title="openai">
    Sélectionné si une clé OpenAI peut être résolue.
  </Step>
  <Step title="gemini">
    Sélectionné si une clé Gemini peut être résolue.
  </Step>
  <Step title="voyage">
    Sélectionné si une clé Voyage peut être résolue.
  </Step>
  <Step title="mistral">
    Sélectionné si une clé Mistral peut être résolue.
  </Step>
  <Step title="deepinfra">
    Sélectionné si une clé DeepInfra peut être résolue.
  </Step>
  <Step title="bedrock">
    Sélectionné si la chaîne d’identifiants du SDK AWS est résolue (rôle d’instance, clés d’accès, profil, SSO, identité web ou configuration partagée).
  </Step>
</Steps>

`ollama` est pris en charge mais n’est pas détecté automatiquement (définissez-le explicitement).

### ID de fournisseurs personnalisés

`memorySearch.provider` peut pointer vers une entrée `models.providers.<id>` personnalisée. OpenClaw résout le propriétaire `api` de ce fournisseur pour l’adaptateur d’embeddings tout en conservant l’id du fournisseur personnalisé pour la gestion du point de terminaison, de l’authentification et des préfixes de modèle. Cela permet aux configurations multi-GPU ou multi-hôtes de dédier les embeddings mémoire à un point de terminaison local spécifique :

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b" }],
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

### Résolution des clés d’API

Les embeddings distants nécessitent une clé d’API. Bedrock utilise à la place la chaîne d’identifiants par défaut du SDK AWS (rôles d’instance, SSO, clés d’accès).

| Fournisseur    | Variable d’environnement                          | Clé de configuration                |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | Chaîne d’identifiants AWS                          | Aucune clé d’API requise            |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Profil d’authentification via connexion par appareil |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                     | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
OAuth Codex ne couvre que le chat/les complétions et ne satisfait pas les requêtes d’embeddings.
</Note>

---

## Configuration des points de terminaison distants

Pour les points de terminaison personnalisés compatibles OpenAI ou pour remplacer les valeurs par défaut du fournisseur :

<ParamField path="remote.baseUrl" type="string">
  URL de base d’API personnalisée.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Remplacer la clé d’API.
</ParamField>
<ParamField path="remote.headers" type="object">
  En-têtes HTTP supplémentaires (fusionnés avec les valeurs par défaut du fournisseur).
</ParamField>

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
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

## Configuration propre aux fournisseurs

<AccordionGroup>
  <Accordion title="Gemini">
    | Clé                    | Type     | Par défaut            | Description                                |
    | ---------------------- | -------- | --------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Prend aussi en charge `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                | Pour Embedding 2 : 768, 1536 ou 3072       |

    <Warning>
    Modifier le modèle ou `outputDimensionality` déclenche une réindexation complète automatique.
    </Warning>

  </Accordion>
  <Accordion title="Types d’entrée compatibles OpenAI">
    Les points de terminaison d’embeddings compatibles OpenAI peuvent activer des champs de requête `input_type` propres au fournisseur. C’est utile pour les modèles d’embeddings asymétriques qui exigent des libellés différents pour les embeddings de requête et de document.

    | Clé                 | Type     | Par défaut | Description                                             |
    | ------------------- | -------- | ---------- | ------------------------------------------------------- |
    | `inputType`         | `string` | non défini | `input_type` partagé pour les embeddings de requête et de document |
    | `queryInputType`    | `string` | non défini | `input_type` au moment de la requête ; remplace `inputType` |
    | `documentInputType` | `string` | non défini | `input_type` d’index/document ; remplace `inputType`   |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "env:EMBEDDINGS_API_KEY",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    Modifier ces valeurs affecte l’identité du cache d’embeddings pour l’indexation par lots du fournisseur et doit être suivi d’une réindexation de la mémoire lorsque le modèle amont traite les libellés différemment.

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock utilise la chaîne d’identifiants par défaut du SDK AWS : aucune clé d’API n’est nécessaire. Si OpenClaw s’exécute sur EC2 avec un rôle d’instance activé pour Bedrock, définissez simplement le fournisseur et le modèle :

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

    | Clé                    | Type     | Par défaut                    | Description                     |
    | ---------------------- | -------- | ----------------------------- | ------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Tout ID de modèle d’embeddings Bedrock |
    | `outputDimensionality` | `number` | valeur par défaut du modèle   | Pour Titan V2 : 256, 512 ou 1024 |

    **Modèles pris en charge** (avec détection de famille et dimensions par défaut) :

    | ID de modèle                               | Fournisseur | Dimensions par défaut | Dimensions configurables |
    | ------------------------------------------ | ----------- | --------------------- | ------------------------ |
    | `amazon.titan-embed-text-v2:0`             | Amazon      | 1024                  | 256, 512, 1024           |
    | `amazon.titan-embed-text-v1`               | Amazon      | 1536                  | --                       |
    | `amazon.titan-embed-g1-text-02`            | Amazon      | 1536                  | --                       |
    | `amazon.titan-embed-image-v1`              | Amazon      | 1024                  | --                       |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon      | 1024                  | 256, 384, 1024, 3072     |
    | `cohere.embed-english-v3`                  | Cohere      | 1024                  | --                       |
    | `cohere.embed-multilingual-v3`             | Cohere      | 1024                  | --                       |
    | `cohere.embed-v4:0`                        | Cohere      | 1536                  | 256-1536                 |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs  | 512                   | --                       |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs  | 1024                  | --                       |

    Les variantes suffixées par le débit (par exemple, `amazon.titan-embed-text-v1:2:8k`) héritent de la configuration du modèle de base.

    **Authentification :** l’authentification Bedrock utilise l’ordre standard de résolution des identifiants du SDK AWS :

    1. Variables d’environnement (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Cache de jetons SSO
    3. Identifiants de jeton d’identité web
    4. Fichiers partagés d’identifiants et de configuration
    5. Identifiants de métadonnées ECS ou EC2

    La région est résolue depuis `AWS_REGION`, `AWS_DEFAULT_REGION`, le `baseUrl` du fournisseur `amazon-bedrock`, ou prend par défaut `us-east-1`.

    **Autorisations IAM :** le rôle ou l’utilisateur IAM a besoin de :

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Pour le moindre privilège, limitez `InvokeModel` au modèle spécifique :

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + node-llama-cpp)">
    | Clé                   | Type               | Par défaut            | Description                                                                                                                                                                                                                                                                                                                              |
    | --------------------- | ------------------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | téléchargé automatiquement | Chemin vers le fichier de modèle GGUF                                                                                                                                                                                                                                                                                                    |
    | `local.modelCacheDir` | `string`           | valeur par défaut de node-llama-cpp | Répertoire de cache pour les modèles téléchargés                                                                                                                                                                                                                                                                                         |
    | `local.contextSize`   | `number \| "auto"` | `4096`                | Taille de la fenêtre de contexte pour le contexte d’embedding. 4096 couvre les fragments typiques (128 à 512 tokens) tout en limitant la VRAM hors poids. Réduisez à 1024-2048 sur les hôtes contraints. `"auto"` utilise le maximum appris du modèle — déconseillé pour les modèles 8B+ (Qwen3-Embedding-8B : 40 960 tokens → ~32 Go de VRAM contre ~8,8 Go à 4096). |

    Modèle par défaut : `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 Go, téléchargé automatiquement). Les installations empaquetées réparent le runtime natif `node-llama-cpp` via les dépendances de runtime de Plugin gérées lorsque `provider: "local"` est configuré. Les checkouts source nécessitent toujours l’approbation de compilation native : `pnpm approve-builds`, puis `pnpm rebuild node-llama-cpp`.

    Utilisez la CLI autonome pour vérifier le même chemin de fournisseur que celui utilisé par le Gateway :

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Si `provider` vaut `auto`, `local` est sélectionné uniquement lorsque `local.modelPath` pointe vers un fichier local existant. Les références de modèle `hf:` et HTTP(S) peuvent toujours être utilisées explicitement avec `provider: "local"`, mais elles ne font pas sélectionner local par `auto` avant que le modèle soit disponible sur disque.

  </Accordion>
</AccordionGroup>

### Délai d’expiration des embeddings en ligne

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Remplace le délai d’expiration des lots d’embeddings en ligne pendant l’indexation de la mémoire.

Si non défini, utilise la valeur par défaut du fournisseur : 600 secondes pour les fournisseurs locaux/auto-hébergés tels que `local`, `ollama` et `lmstudio`, et 120 secondes pour les fournisseurs hébergés. Augmentez cette valeur lorsque les lots d’embeddings locaux limités par le CPU sont sains mais lents.
</ParamField>

---

## Configuration de la recherche hybride

Tout se trouve sous `memorySearch.query.hybrid` :

| Clé                   | Type      | Par défaut | Description                                    |
| --------------------- | --------- | ---------- | ---------------------------------------------- |
| `enabled`             | `boolean` | `true`     | Active la recherche hybride BM25 + vectorielle |
| `vectorWeight`        | `number`  | `0.7`      | Poids des scores vectoriels (0-1)              |
| `textWeight`          | `number`  | `0.3`      | Poids des scores BM25 (0-1)                    |
| `candidateMultiplier` | `number`  | `4`        | Multiplicateur de taille du pool de candidats  |

<Tabs>
  <Tab title="MMR (diversity)">
    | Clé           | Type      | Par défaut | Description                                      |
    | ------------- | --------- | ---------- | ------------------------------------------------ |
    | `mmr.enabled` | `boolean` | `false`    | Active le reclassement MMR                       |
    | `mmr.lambda`  | `number`  | `0.7`      | 0 = diversité maximale, 1 = pertinence maximale |
  </Tab>
  <Tab title="Temporal decay (recency)">
    | Clé                          | Type      | Par défaut | Description                         |
    | ---------------------------- | --------- | ---------- | ----------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`    | Active le boost de récence          |
    | `temporalDecay.halfLifeDays` | `number`  | `30`       | Le score est divisé par deux tous les N jours |

    Les fichiers persistants (`MEMORY.md`, fichiers non datés dans `memory/`) ne sont jamais dépréciés.

  </Tab>
</Tabs>

### Exemple complet

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
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

## Chemins mémoire supplémentaires

| Clé          | Type       | Description                                  |
| ------------ | ---------- | -------------------------------------------- |
| `extraPaths` | `string[]` | Répertoires ou fichiers supplémentaires à indexer |

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

Les chemins peuvent être absolus ou relatifs à l’espace de travail. Les répertoires sont analysés récursivement à la recherche de fichiers `.md`. La gestion des liens symboliques dépend du backend actif : le moteur intégré ignore les liens symboliques, tandis que QMD suit le comportement du scanner QMD sous-jacent.

Pour la recherche de transcriptions inter-agents à portée agent, utilisez `agents.list[].memorySearch.qmd.extraCollections` au lieu de `memory.qmd.paths`. Ces collections supplémentaires suivent la même forme `{ path, name, pattern? }`, mais elles sont fusionnées par agent et peuvent préserver des noms partagés explicites lorsque le chemin pointe hors de l’espace de travail courant. Si le même chemin résolu apparaît à la fois dans `memory.qmd.paths` et `memorySearch.qmd.extraCollections`, QMD conserve la première entrée et ignore le doublon.

---

## Mémoire multimodale (Gemini)

Indexez les images et l’audio avec Markdown à l’aide de Gemini Embedding 2 :

| Clé                       | Type       | Par défaut | Description                             |
| ------------------------- | ---------- | ---------- | --------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Active l’indexation multimodale         |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` ou `["all"]`   |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Taille maximale de fichier pour l’indexation |

<Note>
S’applique uniquement aux fichiers dans `extraPaths`. Les racines de mémoire par défaut restent limitées à Markdown. Nécessite `gemini-embedding-2-preview`. `fallback` doit être `"none"`.
</Note>

Formats pris en charge : `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (images) ; `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Cache d’embeddings

| Clé                | Type      | Par défaut | Description                             |
| ------------------ | --------- | ---------- | --------------------------------------- |
| `cache.enabled`    | `boolean` | `false`    | Met en cache les embeddings de fragments dans SQLite |
| `cache.maxEntries` | `number`  | `50000`    | Nombre maximal d’embeddings en cache    |

Évite de recalculer les embeddings de texte inchangé pendant une réindexation ou des mises à jour de transcription.

---

## Indexation par lots

| Clé                           | Type      | Par défaut | Description                    |
| ----------------------------- | --------- | ---------- | ------------------------------ |
| `remote.nonBatchConcurrency`  | `number`  | `4`        | Embeddings en ligne parallèles |
| `remote.batch.enabled`        | `boolean` | `false`    | Active l’API d’embedding par lots |
| `remote.batch.concurrency`    | `number`  | `2`        | Tâches par lots parallèles     |
| `remote.batch.wait`           | `boolean` | `true`     | Attend la fin du lot           |
| `remote.batch.pollIntervalMs` | `number`  | --         | Intervalle d’interrogation     |
| `remote.batch.timeoutMinutes` | `number`  | --         | Délai d’expiration du lot      |

Disponible pour `openai`, `gemini` et `voyage`. Les lots OpenAI sont généralement les plus rapides et les moins coûteux pour les grands remplissages rétroactifs.

`remote.nonBatchConcurrency` contrôle les appels d’embedding en ligne utilisés par les fournisseurs locaux/auto-hébergés et les fournisseurs hébergés lorsque les API de lots du fournisseur ne sont pas actives. Ollama utilise par défaut `1` pour l’indexation hors lots afin d’éviter de surcharger les petits hôtes locaux ; définissez une valeur plus élevée sur les machines plus puissantes.

C’est distinct de `sync.embeddingBatchTimeoutSeconds`, qui contrôle le délai d’expiration des appels d’embedding en ligne.

---

## Recherche dans la mémoire de session (expérimental)

Indexe les transcriptions de session et les expose via `memory_search` :

| Clé                           | Type       | Par défaut  | Description                                 |
| ----------------------------- | ---------- | ----------- | ------------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`     | Active l’indexation des sessions            |
| `sources`                     | `string[]` | `["memory"]` | Ajoutez `"sessions"` pour inclure les transcriptions |
| `sync.sessions.deltaBytes`    | `number`   | `100000`    | Seuil en octets pour la réindexation        |
| `sync.sessions.deltaMessages` | `number`   | `50`        | Seuil de messages pour la réindexation      |

<Warning>
L’indexation des sessions est opt-in et s’exécute de manière asynchrone. Les résultats peuvent être légèrement obsolètes. Les journaux de session résident sur disque ; traitez donc l’accès au système de fichiers comme la limite de confiance.
</Warning>

---

## Accélération vectorielle SQLite (sqlite-vec)

| Clé                          | Type      | Par défaut | Description                                      |
| ---------------------------- | --------- | ---------- | ------------------------------------------------ |
| `store.vector.enabled`       | `boolean` | `true`     | Utilise sqlite-vec pour les requêtes vectorielles |
| `store.vector.extensionPath` | `string`  | intégré    | Remplace le chemin de sqlite-vec                 |

Lorsque sqlite-vec n’est pas disponible, OpenClaw revient automatiquement à la similarité cosinus en processus.

---

## Stockage de l’index

| Clé                   | Type     | Par défaut                            | Description                                      |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------------ |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Emplacement de l’index (prend en charge le token `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | Tokenizer FTS5 (`unicode61` ou `trigram`)        |

---

## Configuration du backend QMD

Définissez `memory.backend = "qmd"` pour l’activer. Tous les paramètres QMD résident sous `memory.qmd` :

| Clé                      | Type      | Valeur par défaut | Description                                                                           |
| ------------------------ | --------- | ----------------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`             | Chemin de l’exécutable QMD ; définissez un chemin absolu lorsque le service `PATH` diffère de votre shell |
| `searchMode`             | `string`  | `search`          | Commande de recherche : `search`, `vsearch`, `query`                                  |
| `includeDefaultMemory`   | `boolean` | `true`            | Indexer automatiquement `MEMORY.md` + `memory/**/*.md`                                |
| `paths[]`                | `array`   | --                | Chemins supplémentaires : `{ name, path, pattern? }`                                  |
| `sessions.enabled`       | `boolean` | `false`           | Indexer les transcriptions de session                                                 |
| `sessions.retentionDays` | `number`  | --                | Conservation des transcriptions                                                       |
| `sessions.exportDir`     | `string`  | --                | Répertoire d’exportation                                                              |

`searchMode: "search"` est uniquement lexical/BM25. OpenClaw n’exécute pas de sondes de disponibilité vectorielle sémantique ni de maintenance des embeddings QMD pour ce mode, y compris pendant `memory status --deep` ; `vsearch` et `query` continuent d’exiger la disponibilité vectorielle QMD et des embeddings.

OpenClaw privilégie les formes actuelles de collection QMD et de requêtes MCP, mais garde les anciennes versions de QMD fonctionnelles en essayant, si nécessaire, des indicateurs de motifs de collection compatibles et d’anciens noms d’outils MCP. Lorsque QMD annonce la prise en charge de plusieurs filtres de collection, les collections de même source sont recherchées avec un seul processus QMD ; les anciennes builds QMD conservent le chemin de compatibilité par collection. Même source signifie que les collections de mémoire durable sont regroupées, tandis que les collections de transcriptions de session restent un groupe distinct afin que la diversification des sources conserve les deux entrées.

<Note>
Les remplacements de modèle QMD restent du côté de QMD, pas dans la configuration OpenClaw. Si vous devez remplacer globalement les modèles de QMD, définissez des variables d’environnement telles que `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` et `QMD_GENERATE_MODEL` dans l’environnement d’exécution du Gateway.
</Note>

<AccordionGroup>
  <Accordion title="Calendrier de mise à jour">
    | Clé                       | Type      | Valeur par défaut | Description                           |
    | ------------------------- | --------- | ----------------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`              | Intervalle d’actualisation            |
    | `update.debounceMs`       | `number`  | `15000`           | Anti-rebond des changements de fichiers |
    | `update.onBoot`           | `boolean` | `true`            | Actualiser lorsque le gestionnaire QMD longue durée s’ouvre ; contrôle aussi l’actualisation de démarrage optionnelle |
    | `update.startup`          | `string`  | `off`             | Actualisation facultative au démarrage du Gateway : `off`, `idle` ou `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000`          | Délai avant l’exécution de l’actualisation `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false`           | Bloquer l’ouverture du gestionnaire jusqu’à la fin de son actualisation initiale |
    | `update.embedInterval`    | `string`  | --                | Cadence d’embedding distincte         |
    | `update.commandTimeoutMs` | `number`  | --                | Délai d’expiration des commandes QMD  |
    | `update.updateTimeoutMs`  | `number`  | --                | Délai d’expiration des opérations de mise à jour QMD |
    | `update.embedTimeoutMs`   | `number`  | --                | Délai d’expiration des opérations d’embedding QMD |
  </Accordion>
  <Accordion title="Limites">
    | Clé                       | Type     | Valeur par défaut | Description                |
    | ------------------------- | -------- | ----------------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`               | Nombre maximal de résultats de recherche |
    | `limits.maxSnippetChars`  | `number` | --                | Limiter la longueur des extraits |
    | `limits.maxInjectedChars` | `number` | --                | Limiter le nombre total de caractères injectés |
    | `limits.timeoutMs`        | `number` | `4000`            | Délai d’expiration de la recherche |
  </Accordion>
  <Accordion title="Portée">
    Contrôle quelles sessions peuvent recevoir les résultats de recherche QMD. Même schéma que [`session.sendPolicy`](/fr/gateway/config-agents#session) :

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

    La valeur par défaut fournie autorise les sessions directes et de canal, tout en continuant à refuser les groupes.

    La valeur par défaut est limitée aux DM. `match.keyPrefix` correspond à la clé de session normalisée ; `match.rawKeyPrefix` correspond à la clé brute incluant `agent:<id>:`.

  </Accordion>
  <Accordion title="Citations">
    `memory.citations` s’applique à tous les backends :

    | Valeur          | Comportement                                       |
    | ---------------- | --------------------------------------------------- |
    | `auto` (par défaut) | Inclure le pied de page `Source: <path#line>` dans les extraits |
    | `on`             | Toujours inclure le pied de page                   |
    | `off`            | Omettre le pied de page (le chemin reste transmis à l’agent en interne) |

  </Accordion>
</AccordionGroup>

Les actualisations de démarrage QMD utilisent un chemin de sous-processus à usage unique pendant le démarrage du Gateway. Le gestionnaire QMD longue durée reste responsable du surveillant de fichiers régulier et des minuteries d’intervalle lorsque la recherche en mémoire est ouverte pour une utilisation interactive.

### Exemple QMD complet

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 6, timeoutMs: 4000 },
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

Dreaming est configuré sous `plugins.entries.memory-core.config.dreaming`, et non sous `agents.defaults.memorySearch`.

Dreaming s’exécute comme un balayage planifié unique et utilise des phases internes légères/profondes/REM comme détail d’implémentation.

Pour le comportement conceptuel et les commandes slash, consultez [Dreaming](/fr/concepts/dreaming).

### Paramètres utilisateur

| Clé         | Type      | Valeur par défaut | Description                                       |
| ----------- | --------- | ----------------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`           | Activer ou désactiver entièrement Dreaming        |
| `frequency` | `string`  | `0 3 * * *`       | Cadence Cron facultative pour le balayage Dreaming complet |
| `model`     | `string`  | modèle par défaut | Remplacement facultatif du modèle de sous-agent Dream Diary |

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
- Dreaming écrit la sortie narrative lisible par l’humain dans `DREAMS.md` (ou le fichier existant `dreams.md`).
- `dreaming.model` utilise la barrière de confiance existante du sous-agent de Plugin ; définissez `plugins.entries.memory-core.subagent.allowModelOverride: true` avant de l’activer.
- Dream Diary réessaie une fois avec le modèle par défaut de la session lorsque le modèle configuré est indisponible. Les échecs de confiance ou de liste d’autorisation sont consignés et ne sont pas réessayés silencieusement.
- La politique et les seuils des phases légère/profonde/REM relèvent du comportement interne, pas de la configuration destinée à l’utilisateur.

</Note>

## Associé

- [Référence de configuration](/fr/gateway/configuration-reference)
- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [Recherche en mémoire](/fr/concepts/memory-search)
