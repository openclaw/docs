---
read_when:
    - Vous souhaitez configurer des fournisseurs de recherche de mémoire ou des modèles d’embedding
    - Vous voulez configurer le backend QMD
    - Vous souhaitez régler la recherche hybride, le MMR ou la décroissance temporelle
    - Vous souhaitez activer l’indexation multimodale de la mémoire
sidebarTitle: Memory config
summary: Tous les paramètres de configuration pour la recherche en mémoire, les fournisseurs d’embeddings, QMD, la recherche hybride et l’indexation multimodale
title: Référence de configuration de la mémoire
x-i18n:
    generated_at: "2026-06-27T18:10:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8f5880fef3fbdf81e546b0309a0e53459bae47e16efd787f87e34050d8c7b1e
    source_path: reference/memory-config.md
    workflow: 16
---

Cette page répertorie tous les paramètres de configuration pour la recherche mémoire OpenClaw. Pour les vues d’ensemble conceptuelles, consultez :

<CardGroup cols={2}>
  <Card title="Memory overview" href="/fr/concepts/memory">
    Fonctionnement de la mémoire.
  </Card>
  <Card title="Builtin engine" href="/fr/concepts/memory-builtin">
    Backend SQLite par défaut.
  </Card>
  <Card title="QMD engine" href="/fr/concepts/memory-qmd">
    Sidecar local-first.
  </Card>
  <Card title="Memory search" href="/fr/concepts/memory-search">
    Pipeline de recherche et réglages.
  </Card>
  <Card title="Active memory" href="/fr/concepts/active-memory">
    Sous-agent de mémoire pour les sessions interactives.
  </Card>
</CardGroup>

Tous les paramètres de recherche mémoire se trouvent sous `agents.defaults.memorySearch` dans `openclaw.json`, sauf indication contraire.

<Note>
Si vous cherchez le commutateur de fonctionnalité **Active Memory** et la configuration du sous-agent, ils se trouvent sous `plugins.entries.active-memory` au lieu de `memorySearch`.

Active Memory utilise un modèle à deux portes :

1. le Plugin doit être activé et cibler l’id de l’agent actuel
2. la requête doit être une session de chat persistante interactive éligible

Consultez [Active Memory](/fr/concepts/active-memory) pour le modèle d’activation, la configuration détenue par le Plugin, la persistance des transcriptions et le modèle de déploiement progressif sûr.
</Note>

---

## Sélection du fournisseur

| Clé        | Type      | Par défaut          | Description                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | `"openai"`          | ID d’adaptateur d’embeddings, comme `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` ou `voyage` ; peut aussi être un `models.providers.<id>` configuré dont `api` pointe vers un adaptateur d’embeddings mémoire ou une API de modèle compatible OpenAI |
| `model`    | `string`  | valeur par défaut du fournisseur | Nom du modèle d’embeddings                                                                                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`            | ID d’adaptateur de repli lorsque le principal échoue                                                                                                                                                                                                                                                  |
| `enabled`  | `boolean` | `true`              | Active ou désactive la recherche mémoire                                                                                                                                                                                                                                                             |

Lorsque `provider` n’est pas défini, OpenClaw utilise les embeddings OpenAI. Définissez `provider`
explicitement pour utiliser Gemini, Voyage, Mistral, DeepInfra, Bedrock, GitHub Copilot,
Ollama, un modèle GGUF local ou un endpoint `/v1/embeddings` compatible OpenAI.
Les anciennes configurations qui indiquent encore `provider: "auto"` sont résolues en `openai`.

<Warning>
Modifier le fournisseur d’embeddings, le modèle, les paramètres du fournisseur, les sources, la portée,
le découpage ou le tokenizer peut rendre l’index vectoriel SQLite existant incompatible.
OpenClaw met en pause la recherche vectorielle et signale un avertissement d’identité d’index au lieu de
ré-encoder automatiquement tous les embeddings. Reconstruisez l’index lorsque vous êtes prêt avec
`openclaw memory status --index --agent <id>` ou
`openclaw memory index --force --agent <id>`.
</Warning>

Lorsque `provider` n’est pas défini, qu’un ancien `provider: "auto"` est présent, ou que
`provider: "none"` sélectionne intentionnellement le mode FTS uniquement, le rappel mémoire peut encore
utiliser le classement lexical FTS lorsque les embeddings sont indisponibles.

Les fournisseurs non locaux explicites échouent de façon fermée. Si vous définissez `memorySearch.provider` sur
un fournisseur concret adossé à un service distant, comme OpenAI, Gemini, Voyage, Mistral,
Bedrock, GitHub Copilot, DeepInfra, Ollama, LM Studio ou un fournisseur personnalisé compatible OpenAI,
et que ce fournisseur est indisponible à l’exécution, `memory_search`
renvoie un résultat indisponible au lieu d’utiliser silencieusement le rappel FTS uniquement. Corrigez la
configuration du fournisseur/de l’authentification, basculez vers un fournisseur joignable ou définissez
`provider: "none"` si vous voulez un rappel FTS uniquement délibéré.

### IDs de fournisseurs personnalisés

`memorySearch.provider` peut pointer vers une entrée personnalisée `models.providers.<id>` pour des adaptateurs de fournisseurs propres à la mémoire, comme `ollama`, ou pour des API de modèles compatibles OpenAI, comme `openai-responses` / `openai-completions`. OpenClaw résout le propriétaire `api` de ce fournisseur pour l’adaptateur d’embeddings tout en conservant l’id de fournisseur personnalisé pour la gestion de l’endpoint, de l’authentification et des préfixes de modèles. Cela permet aux configurations multi-GPU ou multi-hôtes de dédier les embeddings mémoire à un endpoint local spécifique :

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

### Résolution de la clé d’API

Les embeddings distants nécessitent une clé d’API. Bedrock utilise plutôt la chaîne d’identifiants par défaut du SDK AWS (rôles d’instance, SSO, clés d’accès).

| Fournisseur   | Var. d’env.                                        | Clé de configuration                 |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | chaîne d’identifiants AWS                          | Aucune clé d’API nécessaire         |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Profil d’authentification via connexion par appareil |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (espace réservé)                  | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth couvre uniquement le chat/les complétions et ne satisfait pas les requêtes d’embeddings.
</Note>

---

## Configuration d’endpoint distant

Utilisez `provider: "openai-compatible"` pour un serveur générique compatible OpenAI
`/v1/embeddings` qui ne doit pas hériter des identifiants de chat OpenAI globaux.

<ParamField path="remote.baseUrl" type="string">
  URL de base d’API personnalisée.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Remplace la clé d’API.
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
    | Clé                    | Type     | Par défaut            | Description                                |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Prend aussi en charge `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Pour Embedding 2 : 768, 1536 ou 3072        |

    <Warning>
    Modifier le modèle ou `outputDimensionality` change l’identité de l’index. OpenClaw
    met en pause la recherche vectorielle jusqu’à ce que vous reconstruisiez explicitement l’index mémoire.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-compatible input types">
    Les endpoints d’embeddings compatibles OpenAI peuvent utiliser des champs de requête `input_type` propres au fournisseur. C’est utile pour les modèles d’embeddings asymétriques qui exigent des libellés différents pour les embeddings de requêtes et de documents.

    | Clé                 | Type     | Par défaut | Description                                             |
    | ------------------- | -------- | ---------- | ------------------------------------------------------- |
    | `inputType`         | `string` | non défini | `input_type` partagé pour les embeddings de requêtes et de documents |
    | `queryInputType`    | `string` | non défini | `input_type` au moment de la requête ; remplace `inputType` |
    | `documentInputType` | `string` | non défini | `input_type` d’index/document ; remplace `inputType`      |

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

    Modifier ces valeurs affecte l’identité du cache d’embeddings pour l’indexation par lots du fournisseur et doit être suivi d’une réindexation mémoire lorsque le modèle en amont traite les libellés différemment.

  </Accordion>
  <Accordion title="Bedrock">
    ### Configuration des embeddings Bedrock

    Bedrock utilise la chaîne d’identifiants par défaut du SDK AWS — aucune clé d’API nécessaire. Si OpenClaw s’exécute sur EC2 avec un rôle d’instance activé pour Bedrock, définissez simplement le fournisseur et le modèle :

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
    | ---------------------- | -------- | ------------------------------ | ------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Tout ID de modèle d’embeddings Bedrock |
    | `outputDimensionality` | `number` | valeur par défaut du modèle    | Pour Titan V2 : 256, 512 ou 1024 |

    **Modèles pris en charge** (avec détection de famille et valeurs de dimensions par défaut) :

    | ID du modèle                               | Fournisseur | Dimensions par défaut | Dimensions configurables |
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

    Les variantes avec suffixe de débit (par exemple, `amazon.titan-embed-text-v1:2:8k`) héritent de la configuration du modèle de base.

    **Authentification :** l’authentification Bedrock utilise l’ordre standard de résolution des identifiants du SDK AWS :

    1. Variables d’environnement (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Cache de jetons SSO
    3. Identifiants de jeton d’identité web
    4. Fichiers d’identifiants et de configuration partagés
    5. Identifiants de métadonnées ECS ou EC2

    La région est résolue depuis `AWS_REGION`, `AWS_DEFAULT_REGION`, le `baseUrl` du fournisseur `amazon-bedrock`, ou utilise par défaut `us-east-1`.

    **Autorisations IAM :** le rôle ou l’utilisateur IAM a besoin de :

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Pour appliquer le moindre privilège, limitez `InvokeModel` au modèle spécifique :

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + llama.cpp)">
    | Clé                   | Type               | Par défaut                         | Description                                                                                                                                                                                                                                                                                                                        |
    | --------------------- | ------------------ | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | téléchargé automatiquement         | Chemin vers le fichier de modèle GGUF                                                                                                                                                                                                                                                                                              |
    | `local.modelCacheDir` | `string`           | valeur par défaut de node-llama-cpp | Répertoire de cache pour les modèles téléchargés                                                                                                                                                                                                                                                                                   |
    | `local.contextSize`   | `number \| "auto"` | `4096`                             | Taille de la fenêtre de contexte pour le contexte d’embedding. 4096 couvre les blocs typiques (128–512 tokens) tout en limitant la VRAM hors poids. Réduisez à 1024–2048 sur les hôtes contraints. `"auto"` utilise le maximum entraîné du modèle — non recommandé pour les modèles 8B+ (Qwen3-Embedding-8B : 40 960 tokens → ~32 Go de VRAM contre ~8,8 Go à 4096). |

    Installez d’abord le fournisseur officiel llama.cpp : `openclaw plugins install @openclaw/llama-cpp-provider`.
    Modèle par défaut : `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 Go, téléchargé automatiquement). Les extractions de source exigent toujours l’approbation de compilation native : `pnpm approve-builds` puis `pnpm rebuild node-llama-cpp`.

    Utilisez la CLI autonome pour vérifier le même chemin de fournisseur que celui utilisé par le Gateway :

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Définissez explicitement `provider: "local"` pour les embeddings GGUF locaux. Les références de modèles `hf:` et HTTP(S) sont prises en charge pour les configurations locales explicites, mais elles ne changent pas le fournisseur par défaut.

  </Accordion>
</AccordionGroup>

### Délai d’expiration des embeddings inline

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Remplacez le délai d’expiration pour les lots d’embeddings inline pendant l’indexation de la mémoire.

Non défini utilise la valeur par défaut du fournisseur : 600 secondes pour les fournisseurs locaux/auto-hébergés comme `local`, `ollama` et `lmstudio`, et 120 secondes pour les fournisseurs hébergés. Augmentez cette valeur lorsque les lots d’embeddings locaux dépendants du CPU fonctionnent correctement mais sont lents.
</ParamField>

---

## Configuration de la recherche hybride

Tout sous `memorySearch.query.hybrid` :

| Clé                   | Type      | Par défaut | Description                                      |
| --------------------- | --------- | ---------- | ------------------------------------------------ |
| `enabled`             | `boolean` | `true`     | Activer la recherche hybride BM25 + vectorielle  |
| `vectorWeight`        | `number`  | `0.7`      | Poids des scores vectoriels (0-1)                |
| `textWeight`          | `number`  | `0.3`      | Poids des scores BM25 (0-1)                      |
| `candidateMultiplier` | `number`  | `4`        | Multiplicateur de taille du pool de candidats    |

<Tabs>
  <Tab title="MMR (diversité)">
    | Clé           | Type      | Par défaut | Description                                  |
    | ------------- | --------- | ---------- | -------------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`    | Activer le reclassement MMR                  |
    | `mmr.lambda`  | `number`  | `0.7`      | 0 = diversité max., 1 = pertinence max.      |
  </Tab>
  <Tab title="Décroissance temporelle (récence)">
    | Clé                          | Type      | Par défaut | Description                         |
    | ---------------------------- | --------- | ---------- | ----------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`    | Activer le boost de récence         |
    | `temporalDecay.halfLifeDays` | `number`  | `30`       | Le score est divisé par deux tous les N jours |

    Les fichiers persistants (`MEMORY.md`, fichiers non datés dans `memory/`) ne subissent jamais de décroissance.

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

| Clé          | Type       | Description                                        |
| ------------ | ---------- | -------------------------------------------------- |
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

Les chemins peuvent être absolus ou relatifs à l’espace de travail. Les répertoires sont analysés récursivement pour les fichiers `.md`. La gestion des liens symboliques dépend du backend actif : le moteur intégré ignore les liens symboliques, tandis que QMD suit le comportement du scanner QMD sous-jacent.

Pour la recherche de transcriptions inter-agents à portée agent, utilisez `agents.list[].memorySearch.qmd.extraCollections` au lieu de `memory.qmd.paths`. Ces collections supplémentaires suivent la même forme `{ path, name, pattern? }`, mais elles sont fusionnées par agent et peuvent conserver des noms partagés explicites lorsque le chemin pointe en dehors de l’espace de travail actuel. Si le même chemin résolu apparaît à la fois dans `memory.qmd.paths` et dans `memorySearch.qmd.extraCollections`, QMD conserve la première entrée et ignore le doublon.

---

## Mémoire multimodale (Gemini)

Indexez les images et l’audio avec Markdown à l’aide de Gemini Embedding 2 :

| Clé                       | Type       | Valeur par défaut | Description                                 |
| ------------------------- | ---------- | ----------------- | ------------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`           | Activer l’indexation multimodale            |
| `multimodal.modalities`   | `string[]` | --                | `["image"]`, `["audio"]`, ou `["all"]`      |
| `multimodal.maxFileBytes` | `number`   | `10000000`        | Taille maximale des fichiers pour l’indexation |

<Note>
S’applique uniquement aux fichiers dans `extraPaths`. Les racines mémoire par défaut restent limitées à Markdown. Nécessite `gemini-embedding-2-preview`. `fallback` doit être `"none"`.
</Note>

Formats pris en charge : `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (images) ; `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Cache d’embeddings

| Clé                | Type      | Valeur par défaut | Description                              |
| ------------------ | --------- | ----------------- | ---------------------------------------- |
| `cache.enabled`    | `boolean` | `true`            | Mettre en cache les embeddings de fragments dans SQLite |
| `cache.maxEntries` | `number`  | `50000`           | Nombre maximal d’embeddings mis en cache |

Évite de recréer les embeddings du texte inchangé lors d’une réindexation ou de mises à jour de transcriptions.

---

## Indexation par lots

| Clé                           | Type      | Valeur par défaut | Description                         |
| ----------------------------- | --------- | ----------------- | ----------------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`               | Embeddings en ligne parallèles      |
| `remote.batch.enabled`        | `boolean` | `false`           | Activer l’API d’embedding par lots  |
| `remote.batch.concurrency`    | `number`  | `2`               | Tâches par lots parallèles          |
| `remote.batch.wait`           | `boolean` | `true`            | Attendre la fin du lot              |
| `remote.batch.pollIntervalMs` | `number`  | --                | Intervalle d’interrogation          |
| `remote.batch.timeoutMinutes` | `number`  | --                | Délai d’expiration du lot           |

Disponible pour `openai`, `gemini` et `voyage`. Les lots OpenAI sont généralement les plus rapides et les moins coûteux pour les grands rétroremplissages.

`remote.nonBatchConcurrency` contrôle les appels d’embedding en ligne utilisés par les fournisseurs locaux/auto-hébergés et les fournisseurs hébergés lorsque les API de lots du fournisseur ne sont pas actives. Ollama utilise par défaut `1` pour l’indexation hors lot afin d’éviter de surcharger les hôtes locaux plus modestes ; définissez une valeur plus élevée sur les machines plus puissantes.

C’est distinct de `sync.embeddingBatchTimeoutSeconds`, qui contrôle le délai d’expiration des appels d’embedding en ligne.

---

## Recherche dans la mémoire de session (expérimental)

Indexez les transcriptions de session et exposez-les via `memory_search` :

| Clé                           | Type       | Valeur par défaut | Description                                      |
| ----------------------------- | ---------- | ----------------- | ------------------------------------------------ |
| `experimental.sessionMemory`  | `boolean`  | `false`           | Activer l’indexation des sessions                |
| `sources`                     | `string[]` | `["memory"]`      | Ajouter `"sessions"` pour inclure les transcriptions |
| `sync.sessions.deltaBytes`    | `number`   | `100000`          | Seuil en octets pour la réindexation             |
| `sync.sessions.deltaMessages` | `number`   | `50`              | Seuil de messages pour la réindexation           |

<Warning>
L’indexation des sessions est optionnelle et s’exécute de manière asynchrone. Les résultats peuvent être légèrement obsolètes. Les journaux de session résident sur le disque ; considérez donc l’accès au système de fichiers comme la limite de confiance.
</Warning>

---

## Accélération vectorielle SQLite (sqlite-vec)

| Clé                          | Type      | Par défaut | Description                              |
| ---------------------------- | --------- | --------- | ---------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`    | Utiliser sqlite-vec pour les requêtes vectorielles |
| `store.vector.extensionPath` | `string`  | intégré   | Remplacer le chemin sqlite-vec           |

Lorsque sqlite-vec n’est pas disponible, OpenClaw bascule automatiquement vers la similarité cosinus en processus.

---

## Stockage des index

Les index mémoire intégrés résident dans la base de données SQLite OpenClaw de chaque agent à
`agents/<agentId>/agent/openclaw-agent.sqlite`.

| Clé                   | Type     | Par défaut | Description                               |
| --------------------- | -------- | ---------- | ----------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | Tokeniseur FTS5 (`unicode61` ou `trigram`) |

---

## Configuration du backend QMD

Définissez `memory.backend = "qmd"` pour l’activer. Tous les paramètres QMD se trouvent sous `memory.qmd` :

| Clé                      | Type      | Par défaut | Description                                                                           |
| ------------------------ | --------- | ---------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`      | Chemin de l’exécutable QMD ; définissez un chemin absolu lorsque le `PATH` du service diffère de celui de votre shell |
| `searchMode`             | `string`  | `search`   | Commande de recherche : `search`, `vsearch`, `query`                                  |
| `rerank`                 | `boolean` | --         | Définir sur `false` avec `searchMode: "query"` et QMD 2.1+ pour ignorer le reclassement QMD |
| `includeDefaultMemory`   | `boolean` | `true`     | Indexer automatiquement `MEMORY.md` + `memory/**/*.md`                                |
| `paths[]`                | `array`   | --         | Chemins supplémentaires : `{ name, path, pattern? }`                                  |
| `sessions.enabled`       | `boolean` | `false`    | Indexer les transcriptions de session                                                 |
| `sessions.retentionDays` | `number`  | --         | Rétention des transcriptions                                                          |
| `sessions.exportDir`     | `string`  | --         | Répertoire d’exportation                                                              |

`searchMode: "search"` est uniquement lexical/BM25. OpenClaw n’exécute pas de sondes de préparation vectorielle sémantique ni de maintenance des embeddings QMD pour ce mode, y compris pendant `memory status --deep` ; `vsearch` et `query` continuent d’exiger la préparation vectorielle et les embeddings QMD.

`rerank: false` modifie uniquement le mode `query` de QMD et nécessite QMD 2.1 ou une version plus récente. En mode CLI direct, OpenClaw transmet `--no-rerank` ; en mode MCP basé sur mcporter, il transmet `rerank: false` à l’outil de requête unifié de QMD. Laissez-le non défini pour utiliser le comportement de reclassement des requêtes par défaut de QMD.

OpenClaw privilégie les formes actuelles de collection QMD et de requête MCP, mais maintient la compatibilité avec les anciennes versions de QMD en essayant, si nécessaire, des indicateurs de motif de collection compatibles et les anciens noms d’outils MCP. Lorsque QMD annonce la prise en charge de plusieurs filtres de collection, les collections de même source sont recherchées avec un seul processus QMD ; les anciennes builds QMD conservent le chemin de compatibilité par collection. Même source signifie que les collections de mémoire durable sont regroupées, tandis que les collections de transcriptions de session restent un groupe séparé afin que la diversification des sources conserve toujours les deux entrées.

<Note>
Les remplacements de modèles QMD restent côté QMD, pas dans la configuration OpenClaw. Si vous devez remplacer globalement les modèles de QMD, définissez des variables d’environnement telles que `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` et `QMD_GENERATE_MODEL` dans l’environnement d’exécution du Gateway.
</Note>

<AccordionGroup>
  <Accordion title="Calendrier de mise à jour">
    | Clé                       | Type      | Par défaut | Description                           |
    | ------------------------- | --------- | ---------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`       | Intervalle d’actualisation            |
    | `update.debounceMs`       | `number`  | `15000`    | Débouncer les modifications de fichiers |
    | `update.onBoot`           | `boolean` | `true`     | Actualiser lorsque le gestionnaire QMD longue durée s’ouvre ; définir sur false pour ignorer la mise à jour immédiate au démarrage |
    | `update.startup`          | `string`  | `off`      | Initialisation QMD facultative au démarrage du Gateway : `off`, `idle` ou `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000`   | Délai avant l’exécution de l’actualisation `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false`    | Bloquer l’ouverture du gestionnaire jusqu’à la fin de son actualisation initiale |
    | `update.embedInterval`    | `string`  | --         | Cadence d’embedding séparée           |
    | `update.commandTimeoutMs` | `number`  | --         | Expiration des commandes QMD          |
    | `update.updateTimeoutMs`  | `number`  | --         | Expiration des opérations de mise à jour QMD |
    | `update.embedTimeoutMs`   | `number`  | --         | Expiration des opérations d’embedding QMD |
  </Accordion>
  <Accordion title="Limites">
    | Clé                       | Type     | Par défaut | Description                |
    | ------------------------- | -------- | ---------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`        | Nombre maximal de résultats de recherche |
    | `limits.maxSnippetChars`  | `number` | --         | Limiter la longueur des extraits |
    | `limits.maxInjectedChars` | `number` | --         | Limiter le nombre total de caractères injectés |
    | `limits.timeoutMs`        | `number` | `4000`     | Expiration de la recherche |
  </Accordion>
  <Accordion title="Portée">
    Contrôle quelles sessions peuvent recevoir des résultats de recherche QMD. Même schéma que [`session.sendPolicy`](/fr/gateway/config-agents#session) :

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

    Le comportement par défaut livré autorise les sessions directes et de canal, tout en refusant les groupes.

    Par défaut, seuls les DM sont autorisés. `match.keyPrefix` correspond à la clé de session normalisée ; `match.rawKeyPrefix` correspond à la clé brute, y compris `agent:<id>:`.

  </Accordion>
  <Accordion title="Citations">
    `memory.citations` s’applique à tous les backends :

    | Valeur           | Comportement                                       |
    | ---------------- | -------------------------------------------------- |
    | `auto` (par défaut) | Inclure le pied de page `Source: <path#line>` dans les extraits |
    | `on`             | Toujours inclure le pied de page                   |
    | `off`            | Omettre le pied de page (le chemin reste transmis en interne à l’agent) |

  </Accordion>
</AccordionGroup>

Lorsque l’initialisation QMD au démarrage du Gateway est activée, OpenClaw démarre QMD uniquement pour les agents éligibles. Si `update.onBoot` vaut true et qu’aucune maintenance d’intervalle/d’embedding n’est configurée, le démarrage utilise un gestionnaire ponctuel pour l’actualisation de démarrage, puis le ferme. Si un intervalle de mise à jour ou d’embedding est configuré, le démarrage ouvre le gestionnaire QMD longue durée afin qu’il puisse posséder le watcher et les minuteurs d’intervalle ; `update.onBoot: false` ignore uniquement l’actualisation immédiate au démarrage.

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

Dreaming s’exécute comme un balayage planifié unique et utilise les phases internes light/deep/REM comme détail d’implémentation.

Pour le comportement conceptuel et les commandes slash, consultez [Dreaming](/fr/concepts/dreaming).

### Paramètres utilisateur

| Clé                                    | Type      | Par défaut       | Description                                                                                                                      |
| -------------------------------------- | --------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`          | Activer ou désactiver entièrement Dreaming                                                                                       |
| `frequency`                            | `string`  | `0 3 * * *`      | Cadence cron facultative pour le balayage Dreaming complet                                                                       |
| `model`                                | `string`  | modèle par défaut | Remplacement facultatif du modèle de sous-agent Dream Diary                                                                      |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`            | Nombre maximal estimé de tokens conservés depuis chaque extrait de rappel à court terme promu dans `MEMORY.md` ; les métadonnées de provenance restent visibles |

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
- Dreaming écrit la sortie narrative lisible par l’humain dans `DREAMS.md` (ou dans le fichier `dreams.md` existant).
- `dreaming.model` utilise la barrière de confiance existante du sous-agent du plugin ; définissez `plugins.entries.memory-core.subagent.allowModelOverride: true` avant de l’activer.
- Dream Diary réessaie une fois avec le modèle par défaut de la session lorsque le modèle configuré est indisponible. Les échecs de confiance ou de liste d’autorisation sont journalisés et ne sont pas réessayés silencieusement.
- La politique et les seuils des phases light/deep/REM sont un comportement interne, pas une configuration destinée à l’utilisateur.

</Note>

## Connexe

- [Référence de configuration](/fr/gateway/configuration-reference)
- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [Recherche mémoire](/fr/concepts/memory-search)
