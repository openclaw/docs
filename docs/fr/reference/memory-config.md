---
read_when:
    - Vous voulez configurer des fournisseurs de recherche mémoire ou des modèles d’embeddings
    - Vous souhaitez configurer le backend QMD
    - Vous voulez ajuster la recherche hybride, MMR ou la décroissance temporelle
    - Vous voulez activer l’indexation de mémoire multimodale
sidebarTitle: Memory config
summary: Tous les paramètres de configuration pour la recherche mémoire, les fournisseurs d’embeddings, QMD, la recherche hybride et l’indexation multimodale
title: Référence de configuration de la mémoire
x-i18n:
    generated_at: "2026-06-28T22:33:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de7d1c23cd415293001ef59ae2572cd7bfe9a88c70c1e4cf138ee60664ff0ac2
    source_path: reference/memory-config.md
    workflow: 16
---

Cette page liste chaque réglage de configuration pour la recherche mémoire d’OpenClaw. Pour des vues d’ensemble conceptuelles, consultez :

<CardGroup cols={2}>
  <Card title="Vue d’ensemble de la mémoire" href="/fr/concepts/memory">
    Fonctionnement de la mémoire.
  </Card>
  <Card title="Moteur intégré" href="/fr/concepts/memory-builtin">
    Backend SQLite par défaut.
  </Card>
  <Card title="Moteur QMD" href="/fr/concepts/memory-qmd">
    Sidecar donnant la priorité au local.
  </Card>
  <Card title="Recherche mémoire" href="/fr/concepts/memory-search">
    Pipeline de recherche et réglages.
  </Card>
  <Card title="Active Memory" href="/fr/concepts/active-memory">
    Sous-agent mémoire pour les sessions interactives.
  </Card>
</CardGroup>

Tous les paramètres de recherche mémoire se trouvent sous `agents.defaults.memorySearch` dans `openclaw.json`, sauf indication contraire.

<Note>
Si vous cherchez le bouton d’activation de la fonctionnalité **Active Memory** et la configuration du sous-agent, ils se trouvent sous `plugins.entries.active-memory` plutôt que sous `memorySearch`.

Active Memory utilise un modèle à deux barrières :

1. le plugin doit être activé et cibler l’identifiant de l’agent actuel
2. la requête doit être une session de chat persistante interactive admissible

Consultez [Active Memory](/fr/concepts/active-memory) pour le modèle d’activation, la configuration détenue par le plugin, la persistance des transcriptions et le modèle de déploiement sûr.
</Note>

---

## Sélection du fournisseur

| Clé        | Type      | Par défaut       | Description                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | `"openai"`       | Identifiant d’adaptateur d’embeddings tel que `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` ou `voyage` ; peut aussi être un `models.providers.<id>` configuré dont l’`api` pointe vers un adaptateur d’embeddings mémoire ou une API de modèle compatible avec OpenAI |
| `model`    | `string`  | valeur par défaut du fournisseur | Nom du modèle d’embeddings                                                                                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`         | Identifiant de l’adaptateur de repli lorsque le principal échoue                                                                                                                                                                                                                                                  |
| `enabled`  | `boolean` | `true`           | Activer ou désactiver la recherche mémoire                                                                                                                                                                                                                                                             |

Lorsque `provider` n’est pas défini, OpenClaw utilise les embeddings OpenAI. Définissez `provider`
explicitement pour utiliser Gemini, Voyage, Mistral, DeepInfra, Bedrock, GitHub Copilot,
Ollama, un modèle GGUF local ou un endpoint `/v1/embeddings` compatible avec OpenAI.
Les anciennes configurations qui indiquent encore `provider: "auto"` se résolvent en `openai`.

<Warning>
Modifier le fournisseur d’embeddings, le modèle, les paramètres du fournisseur, les sources, le périmètre,
le découpage en fragments ou le tokenizer peut rendre l’index vectoriel SQLite existant incompatible.
OpenClaw suspend la recherche vectorielle et signale un avertissement d’identité d’index au lieu de
réintégrer automatiquement tous les embeddings. Reconstruisez-le lorsque vous êtes prêt avec
`openclaw memory status --index --agent <id>` ou
`openclaw memory index --force --agent <id>`.
</Warning>

Lorsque `provider` n’est pas défini, que l’ancien `provider: "auto"` est présent, ou que
`provider: "none"` sélectionne intentionnellement le mode FTS uniquement, le rappel mémoire peut tout de même
utiliser le classement lexical FTS lorsque les embeddings sont indisponibles.

Les fournisseurs non locaux explicites échouent en mode fermé. Si vous définissez `memorySearch.provider` sur
un fournisseur concret adossé à un service distant tel qu’OpenAI, Gemini, Voyage, Mistral,
Bedrock, GitHub Copilot, DeepInfra, Ollama, LM Studio ou un fournisseur personnalisé
compatible avec OpenAI, et que ce fournisseur est indisponible à l’exécution, `memory_search`
renvoie un résultat d’indisponibilité au lieu d’utiliser silencieusement le rappel FTS uniquement. Corrigez la
configuration du fournisseur/de l’authentification, passez à un fournisseur joignable ou définissez
`provider: "none"` si vous voulez un rappel FTS uniquement délibéré.

### Identifiants de fournisseur personnalisés

`memorySearch.provider` peut pointer vers une entrée personnalisée `models.providers.<id>` pour des adaptateurs de fournisseur propres à la mémoire comme `ollama`, ou pour des API de modèle compatibles avec OpenAI comme `openai-responses` / `openai-completions`. OpenClaw résout le propriétaire `api` de ce fournisseur pour l’adaptateur d’embeddings tout en préservant l’identifiant de fournisseur personnalisé pour la gestion de l’endpoint, de l’authentification et des préfixes de modèle. Cela permet aux configurations multi-GPU ou multi-hôtes de dédier les embeddings mémoire à un endpoint local spécifique :

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

### Résolution de la clé API

Les embeddings distants nécessitent une clé API. Bedrock utilise plutôt la chaîne d’identifiants par défaut de l’AWS SDK (rôles d’instance, SSO, clés d’accès).

| Fournisseur    | Variable d’environnement                         | Clé de configuration                |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | chaîne d’identifiants AWS                          | Aucune clé API nécessaire           |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Profil d’authentification via connexion par appareil |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                     | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth couvre uniquement le chat/les complétions et ne satisfait pas les requêtes d’embeddings.
</Note>

---

## Configuration d’endpoint distant

Utilisez `provider: "openai-compatible"` pour un serveur générique
`/v1/embeddings` compatible avec OpenAI qui ne doit pas hériter des identifiants globaux de chat OpenAI.

<ParamField path="remote.baseUrl" type="string">
  URL de base personnalisée de l’API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Remplacer la clé API.
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
    | Clé                    | Type     | Par défaut             | Description                                      |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Prend aussi en charge `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Pour Embedding 2 : 768, 1536 ou 3072             |

    <Warning>
    Modifier le modèle ou `outputDimensionality` change l’identité de l’index. OpenClaw
    suspend la recherche vectorielle jusqu’à ce que vous reconstruisiez explicitement l’index mémoire.
    </Warning>

  </Accordion>
  <Accordion title="Types d’entrée compatibles avec OpenAI">
    Les endpoints d’embeddings compatibles avec OpenAI peuvent activer des champs de requête `input_type` propres au fournisseur. C’est utile pour les modèles d’embeddings asymétriques qui nécessitent des libellés différents pour les embeddings de requête et de document.

    | Clé                 | Type     | Par défaut | Description                                             |
    | ------------------- | -------- | ---------- | ------------------------------------------------------- |
    | `inputType`         | `string` | non défini | `input_type` partagé pour les embeddings de requête et de document |
    | `queryInputType`    | `string` | non défini | `input_type` au moment de la requête ; remplace `inputType` |
    | `documentInputType` | `string` | non défini | `input_type` d’index/document ; remplace `inputType`    |

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

    Modifier ces valeurs affecte l’identité du cache d’embeddings pour l’indexation par lots du fournisseur et doit être suivi d’une réindexation de la mémoire lorsque le modèle amont traite les libellés différemment.

  </Accordion>
  <Accordion title="Bedrock">
    ### Configuration des embeddings Bedrock

    Bedrock utilise la chaîne d’identifiants par défaut de l’AWS SDK — aucune clé API n’est nécessaire. Si OpenClaw s’exécute sur EC2 avec un rôle d’instance compatible Bedrock, définissez simplement le fournisseur et le modèle :

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

    | Clé                    | Type     | Par défaut                    | Description                         |
    | ---------------------- | -------- | ----------------------------- | ----------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Tout identifiant de modèle d’embeddings Bedrock |
    | `outputDimensionality` | `number` | valeur par défaut du modèle   | Pour Titan V2 : 256, 512 ou 1024    |

    **Modèles pris en charge** (avec détection de famille et dimensions par défaut) :

    | ID du modèle                              | Fournisseur | Dimensions par défaut | Dimensions configurables |
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
    4. Fichiers partagés d’identifiants et de configuration
    5. Identifiants de métadonnées ECS ou EC2

    La région est résolue depuis `AWS_REGION`, `AWS_DEFAULT_REGION`, le `baseUrl` du fournisseur `amazon-bedrock`, ou utilise `us-east-1` par défaut.

    **Autorisations IAM :** le rôle ou l’utilisateur IAM a besoin de :

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Pour le moindre privilège, limitez la portée de `InvokeModel` au modèle spécifique :

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + llama.cpp)">
    | Clé                   | Type               | Par défaut             | Description                                                                                                                                                                                                                                                                                                                                                           |
    | --------------------- | ------------------ | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | téléchargé automatiquement | Chemin vers le fichier de modèle GGUF                                                                                                                                                                                                                                                                                                                                 |
    | `local.modelCacheDir` | `string`           | valeur par défaut de node-llama-cpp | Répertoire de cache pour les modèles téléchargés                                                                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Taille de la fenêtre de contexte pour le contexte d’embedding. 4096 couvre les fragments typiques (128 à 512 jetons) tout en limitant la VRAM hors poids. Réduisez à 1024 à 2048 sur les hôtes contraints. `"auto"` utilise le maximum entraîné du modèle — non recommandé pour les modèles 8B+ (Qwen3-Embedding-8B : 40 960 jetons → ~32 Go de VRAM contre ~8,8 Go à 4096). |

    Installez d’abord le fournisseur officiel llama.cpp : `openclaw plugins install @openclaw/llama-cpp-provider`.
    Modèle par défaut : `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 Go, téléchargé automatiquement). Les checkouts source nécessitent toujours l’approbation de la compilation native : `pnpm approve-builds` puis `pnpm rebuild node-llama-cpp`.

    Utilisez la CLI autonome pour vérifier le même chemin de fournisseur que celui utilisé par le Gateway :

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Définissez explicitement `provider: "local"` pour les embeddings GGUF locaux. Les références de modèle `hf:` et HTTP(S) sont prises en charge pour les configurations locales explicites, mais elles ne modifient pas le fournisseur par défaut.

  </Accordion>
</AccordionGroup>

### Délai d’expiration des embeddings en ligne

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Remplace le délai d’expiration pour les lots d’embeddings en ligne pendant l’indexation de la mémoire.

Non défini, utilise la valeur par défaut du fournisseur : 600 secondes pour les fournisseurs locaux/auto-hébergés tels que `local`, `ollama` et `lmstudio`, et 120 secondes pour les fournisseurs hébergés. Augmentez cette valeur lorsque les lots d’embeddings locaux limités par le CPU sont sains mais lents.
</ParamField>

---

## Configuration de la recherche hybride

Tout se trouve sous `memorySearch.query.hybrid` :

| Clé                   | Type      | Par défaut | Description                                     |
| --------------------- | --------- | ---------- | ----------------------------------------------- |
| `enabled`             | `boolean` | `true`     | Activer la recherche hybride BM25 + vectorielle |
| `vectorWeight`        | `number`  | `0.7`      | Poids des scores vectoriels (0-1)               |
| `textWeight`          | `number`  | `0.3`      | Poids des scores BM25 (0-1)                     |
| `candidateMultiplier` | `number`  | `4`        | Multiplicateur de taille du pool de candidats   |

<Tabs>
  <Tab title="MMR (diversité)">
    | Clé           | Type      | Par défaut | Description                                  |
    | ------------- | --------- | ---------- | -------------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`    | Activer le reclassement MMR                  |
    | `mmr.lambda`  | `number`  | `0.7`      | 0 = diversité max., 1 = pertinence max.      |
  </Tab>
  <Tab title="Décroissance temporelle (récence)">
    | Clé                          | Type      | Par défaut | Description                                      |
    | ---------------------------- | --------- | ---------- | ------------------------------------------------ |
    | `temporalDecay.enabled`      | `boolean` | `false`    | Activer l’amplification de récence               |
    | `temporalDecay.halfLifeDays` | `number`  | `30`       | Le score est divisé par deux tous les N jours    |

    Les fichiers permanents (`MEMORY.md`, fichiers non datés dans `memory/`) ne subissent jamais de décroissance.

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

| Clé          | Type       | Description                                      |
| ------------ | ---------- | ------------------------------------------------ |
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

Pour la recherche de transcriptions inter-agents limitée à un agent, utilisez `agents.list[].memorySearch.qmd.extraCollections` au lieu de `memory.qmd.paths`. Ces collections supplémentaires suivent la même forme `{ path, name, pattern? }`, mais elles sont fusionnées par agent et peuvent conserver des noms partagés explicites lorsque le chemin pointe hors de l’espace de travail actuel. Si le même chemin résolu apparaît à la fois dans `memory.qmd.paths` et dans `memorySearch.qmd.extraCollections`, QMD conserve la première entrée et ignore le doublon.

---

## Mémoire multimodale (Gemini)

Indexez les images et l’audio avec Markdown à l’aide de Gemini Embedding 2 :

| Clé                       | Type       | Par défaut | Description                                      |
| ------------------------- | ---------- | ---------- | ------------------------------------------------ |
| `multimodal.enabled`      | `boolean`  | `false`    | Activer l’indexation multimodale                 |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]`, ou `["all"]`           |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Taille maximale de fichier pour l’indexation     |

<Note>
S’applique uniquement aux fichiers dans `extraPaths`. Les racines mémoire par défaut restent limitées à Markdown. Nécessite `gemini-embedding-2-preview`. `fallback` doit être `"none"`.
</Note>

Formats pris en charge : `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (images) ; `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Cache des embeddings

| Clé                | Type      | Par défaut | Description                                  |
| ------------------ | --------- | ---------- | -------------------------------------------- |
| `cache.enabled`    | `boolean` | `true`     | Mettre en cache les embeddings de fragments dans SQLite |
| `cache.maxEntries` | `number`  | `50000`    | Nombre maximal d’embeddings mis en cache     |

Évite de recalculer les embeddings du texte inchangé lors d’une réindexation ou de mises à jour de transcriptions.

---

## Indexation par lots

| Clé                           | Type      | Par défaut | Description                    |
| ----------------------------- | --------- | ---------- | ------------------------------ |
| `remote.nonBatchConcurrency`  | `number`  | `4`        | Embeddings en ligne parallèles |
| `remote.batch.enabled`        | `boolean` | `false`    | Activer l’API d’embeddings par lots |
| `remote.batch.concurrency`    | `number`  | `2`        | Tâches par lots parallèles     |
| `remote.batch.wait`           | `boolean` | `true`     | Attendre la fin du traitement par lots |
| `remote.batch.pollIntervalMs` | `number`  | --         | Intervalle d’interrogation     |
| `remote.batch.timeoutMinutes` | `number`  | --         | Délai d’expiration du traitement par lots |

Disponible pour `openai`, `gemini` et `voyage`. Les lots OpenAI sont généralement les plus rapides et les moins coûteux pour les grands remplissages rétrospectifs.

`remote.nonBatchConcurrency` contrôle les appels d’embeddings en ligne utilisés par les fournisseurs locaux/auto-hébergés et par les fournisseurs hébergés lorsque les API de lots du fournisseur ne sont pas actives. Ollama utilise par défaut `1` pour l’indexation hors lots afin d’éviter de surcharger les petits hôtes locaux ; définissez une valeur plus élevée sur les machines plus puissantes.

Cela est distinct de `sync.embeddingBatchTimeoutSeconds`, qui contrôle le délai d’expiration des appels d’embeddings en ligne.

---

## Recherche dans la mémoire de session (expérimental)

Indexez les transcriptions de session et exposez-les via `memory_search` :

| Clé                           | Type       | Par défaut  | Description                                      |
| ----------------------------- | ---------- | ------------ | ------------------------------------------------ |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Activer l’indexation des sessions                |
| `sources`                     | `string[]` | `["memory"]` | Ajouter `"sessions"` pour inclure les transcriptions |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Seuil en octets pour la réindexation             |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Seuil de messages pour la réindexation           |

<Warning>
L’indexation des sessions est optionnelle et s’exécute de manière asynchrone. Les résultats peuvent être légèrement obsolètes. Les journaux de session résident sur le disque ; considérez donc l’accès au système de fichiers comme la frontière de confiance.
</Warning>

Les résultats de transcription de session respectent également
[`tools.sessions.visibility`](/fr/gateway/config-tools#toolssessions). La visibilité
`tree` par défaut n’expose que la session actuelle et les sessions qu’elle a lancées. Pour
rappeler, depuis une autre session comme un DM, une session non liée distribuée par le Gateway pour le même agent,
élargissez volontairement la visibilité à `agent` (ou à `all` uniquement
lorsque le rappel entre agents est également requis et que la politique agent-à-agent l’autorise).

Les exemples ci-dessous placent ces paramètres sous `agents.defaults`. Vous pouvez aussi
appliquer des paramètres `memorySearch` équivalents dans une surcharge par agent lorsque seul un
agent doit indexer et rechercher les transcriptions de session.

Pour le rappel Gateway-vers-DM pour le même agent :

<Tabs>
  <Tab title="Builtin backend">
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
  <Tab title="QMD backend">
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
`sources: ["sessions"]` n’exportent pas à eux seuls les transcriptions dans QMD. Définissez
également `memory.qmd.sessions.enabled: true`.

---

## Accélération vectorielle SQLite (sqlite-vec)

| Clé                          | Type      | Valeur par défaut | Description                              |
| ---------------------------- | --------- | ----------------- | ---------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`            | Utiliser sqlite-vec pour les requêtes vectorielles |
| `store.vector.extensionPath` | `string`  | intégré           | Remplacer le chemin sqlite-vec           |

Lorsque sqlite-vec n’est pas disponible, OpenClaw revient automatiquement à la similarité cosinus en cours de processus.

---

## Stockage des index

Les index mémoire intégrés résident dans la base de données SQLite OpenClaw de chaque agent à
`agents/<agentId>/agent/openclaw-agent.sqlite`.

| Clé                   | Type     | Valeur par défaut | Description                                  |
| --------------------- | -------- | ----------------- | -------------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61`       | Tokenizer FTS5 (`unicode61` ou `trigram`)    |

---

## Configuration du backend QMD

Définissez `memory.backend = "qmd"` pour l’activer. Tous les paramètres QMD résident sous `memory.qmd` :

| Clé                      | Type      | Valeur par défaut | Description                                                                                  |
| ------------------------ | --------- | ----------------- | -------------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`             | Chemin de l’exécutable QMD ; définissez un chemin absolu lorsque le `PATH` du service diffère de celui de votre shell |
| `searchMode`             | `string`  | `search`          | Commande de recherche : `search`, `vsearch`, `query`                                         |
| `rerank`                 | `boolean` | --                | Définissez sur `false` avec `searchMode: "query"` et QMD 2.1+ pour ignorer le reranking QMD  |
| `includeDefaultMemory`   | `boolean` | `true`            | Indexer automatiquement `MEMORY.md` + `memory/**/*.md`                                       |
| `paths[]`                | `array`   | --                | Chemins supplémentaires : `{ name, path, pattern? }`                                         |
| `sessions.enabled`       | `boolean` | `false`           | Exporter les transcriptions de session dans QMD                                              |
| `sessions.retentionDays` | `number`  | --                | Conservation des transcriptions                                                              |
| `sessions.exportDir`     | `string`  | --                | Répertoire d’exportation                                                                     |

`searchMode: "search"` est uniquement lexical/BM25. OpenClaw n’exécute pas de sondes de préparation vectorielle sémantique ni de maintenance des embeddings QMD pour ce mode, y compris pendant `memory status --deep` ; `vsearch` et `query` continuent d’exiger la préparation vectorielle et les embeddings QMD.

`rerank: false` ne modifie que le mode `query` de QMD et nécessite QMD 2.1 ou plus récent. En mode CLI direct, OpenClaw transmet `--no-rerank` ; en mode MCP basé sur mcporter, il transmet `rerank: false` à l’outil de requête unifié de QMD. Laissez-le non défini pour utiliser le comportement de reranking de requête par défaut de QMD.

OpenClaw privilégie les formes actuelles de collections QMD et de requêtes MCP, mais maintient la compatibilité avec les anciennes versions de QMD en essayant, si nécessaire, des indicateurs de modèles de collection compatibles et d’anciens noms d’outils MCP. Lorsque QMD annonce la prise en charge de plusieurs filtres de collection, les collections de même source sont recherchées avec un seul processus QMD ; les anciennes versions de QMD conservent le chemin de compatibilité par collection. Même source signifie que les collections de mémoire durable sont regroupées, tandis que les collections de transcriptions de session restent un groupe séparé afin que la diversification des sources conserve les deux entrées.

<Note>
Les remplacements de modèles QMD restent côté QMD, pas dans la configuration OpenClaw. Si vous devez remplacer globalement les modèles de QMD, définissez des variables d’environnement telles que `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` et `QMD_GENERATE_MODEL` dans l’environnement d’exécution du Gateway.
</Note>

<AccordionGroup>
  <Accordion title="Calendrier des mises à jour">
    | Clé                       | Type      | Par défaut | Description                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | Intervalle d’actualisation                      |
    | `update.debounceMs`       | `number`  | `15000` | Anti-rebond des changements de fichiers                 |
    | `update.onBoot`           | `boolean` | `true`  | Actualiser à l’ouverture du gestionnaire QMD longue durée ; définissez sur false pour ignorer la mise à jour immédiate au démarrage |
    | `update.startup`          | `string`  | `off`   | Initialisation QMD facultative au démarrage du Gateway : `off`, `idle` ou `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | Délai avant l’exécution de l’actualisation `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false` | Bloquer l’ouverture du gestionnaire jusqu’à la fin de son actualisation initiale |
    | `update.embedInterval`    | `string`  | --      | Cadence d’intégration distincte                |
    | `update.commandTimeoutMs` | `number`  | --      | Délai d’expiration des commandes QMD              |
    | `update.updateTimeoutMs`  | `number`  | --      | Délai d’expiration des opérations de mise à jour QMD     |
    | `update.embedTimeoutMs`   | `number`  | --      | Délai d’expiration des opérations d’intégration QMD      |
  </Accordion>
  <Accordion title="Limites">
    | Clé                       | Type     | Par défaut | Description                |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | Résultats de recherche max.         |
    | `limits.maxSnippetChars`  | `number` | --      | Limiter la longueur des extraits       |
    | `limits.maxInjectedChars` | `number` | --      | Limiter le nombre total de caractères injectés |
    | `limits.timeoutMs`        | `number` | `4000`  | Délai d’expiration de la recherche             |
  </Accordion>
  <Accordion title="Périmètre">
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

    La valeur par défaut fournie autorise les sessions directes et de canal, tout en refusant les groupes.

    La valeur par défaut est limitée aux DM. `match.keyPrefix` correspond à la clé de session normalisée ; `match.rawKeyPrefix` correspond à la clé brute, y compris `agent:<id>:`.

  </Accordion>
  <Accordion title="Citations">
    `memory.citations` s’applique à tous les backends :

    | Valeur            | Comportement                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (par défaut) | Inclure le pied de page `Source: <path#line>` dans les extraits    |
    | `on`             | Toujours inclure le pied de page                               |
    | `off`            | Omettre le pied de page (le chemin est tout de même transmis à l’agent en interne) |

  </Accordion>
</AccordionGroup>

Lorsque l’initialisation QMD au démarrage du Gateway est activée, OpenClaw démarre QMD uniquement pour les agents éligibles. Si `update.onBoot` vaut true et qu’aucune maintenance d’intervalle ou d’intégration n’est configurée, le démarrage utilise un gestionnaire à exécution unique pour l’actualisation au démarrage, puis le ferme. Si un intervalle de mise à jour ou d’intégration est configuré, le démarrage ouvre le gestionnaire QMD longue durée afin qu’il puisse posséder l’observateur et les minuteurs d’intervalle ; `update.onBoot: false` ignore uniquement l’actualisation immédiate au démarrage.

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

Dreaming se configure sous `plugins.entries.memory-core.config.dreaming`, et non sous `agents.defaults.memorySearch`.

Dreaming s’exécute comme un balayage planifié unique et utilise des phases internes légères/profondes/REM comme détail d’implémentation.

Pour le comportement conceptuel et les commandes slash, consultez [Dreaming](/fr/concepts/dreaming).

### Paramètres utilisateur

| Clé                                    | Type      | Par défaut       | Description                                                                                                                      |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | Activer ou désactiver entièrement Dreaming                                                                                              |
| `frequency`                            | `string`  | `0 3 * * *`   | Cadence cron facultative pour le balayage Dreaming complet                                                                                |
| `model`                                | `string`  | modèle par défaut | Remplacement facultatif du modèle du sous-agent Journal de rêve                                                                                     |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | Nombre maximal estimé de tokens conservés depuis chaque extrait de rappel à court terme promu dans `MEMORY.md` ; les métadonnées de provenance restent visibles |

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
- Dreaming écrit la sortie narrative lisible par l’humain dans `DREAMS.md` (ou le fichier `dreams.md` existant).
- `dreaming.model` utilise la barrière de confiance existante du sous-agent de Plugin ; définissez `plugins.entries.memory-core.subagent.allowModelOverride: true` avant de l’activer.
- Le Journal de rêve réessaie une fois avec le modèle par défaut de la session lorsque le modèle configuré n’est pas disponible. Les échecs de confiance ou de liste d’autorisation sont journalisés et ne font pas l’objet d’une nouvelle tentative silencieuse.
- La politique et les seuils des phases légère/profonde/REM sont un comportement interne, pas une configuration destinée à l’utilisateur.

</Note>

## Connexe

- [Référence de configuration](/fr/gateway/configuration-reference)
- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [Recherche dans la mémoire](/fr/concepts/memory-search)
