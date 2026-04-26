---
read_when:
    - Vous souhaitez configurer des fournisseurs de recherche mémoire ou des modèles d’embeddings
    - Vous souhaitez configurer le backend QMD
    - Vous souhaitez ajuster la recherche hybride, le MMR ou la décroissance temporelle
    - Vous souhaitez activer l’indexation mémoire multimodale
sidebarTitle: Memory config
summary: Tous les paramètres de configuration pour la recherche mémoire, les fournisseurs d’embeddings, le QMD, la recherche hybride et l’indexation multimodale
title: Référence de configuration de la mémoire
x-i18n:
    generated_at: "2026-04-26T11:38:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15fd747abc6d0d43cfc869faa0b5e6c1618681ef3b02068207321d60d449a901
    source_path: reference/memory-config.md
    workflow: 15
---

Cette page répertorie tous les paramètres de configuration de la recherche mémoire d’OpenClaw. Pour des vues d’ensemble conceptuelles, consultez :

<CardGroup cols={2}>
  <Card title="Vue d’ensemble de la mémoire" href="/fr/concepts/memory">
    Fonctionnement de la mémoire.
  </Card>
  <Card title="Moteur intégré" href="/fr/concepts/memory-builtin">
    Backend SQLite par défaut.
  </Card>
  <Card title="Moteur QMD" href="/fr/concepts/memory-qmd">
    Sidecar local-first.
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
Si vous recherchez le basculeur de fonctionnalité **Active Memory** et la configuration du sous-agent, ils se trouvent sous `plugins.entries.active-memory` plutôt que sous `memorySearch`.

Active Memory utilise un modèle à deux conditions :

1. le plugin doit être activé et cibler l’identifiant de l’agent actuel
2. la requête doit appartenir à une session de chat persistante interactive éligible

Consultez [Active Memory](/fr/concepts/active-memory) pour le modèle d’activation, la configuration gérée par le plugin, la persistance de la transcription et le modèle de déploiement prudent.
</Note>

---

## Sélection du fournisseur

| Clé        | Type      | Valeur par défaut | Description                                                                                                     |
| ---------- | --------- | ----------------- | --------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | détecté automatiquement | ID de l’adaptateur d’embeddings : `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model`    | `string`  | valeur par défaut du fournisseur | Nom du modèle d’embeddings                                                                                      |
| `fallback` | `string`  | `"none"`          | ID de l’adaptateur de repli lorsque le principal échoue                                                         |
| `enabled`  | `boolean` | `true`            | Activer ou désactiver la recherche mémoire                                                                      |

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
  <Step title="bedrock">
    Sélectionné si la chaîne d’identifiants du SDK AWS se résout (rôle d’instance, clés d’accès, profil, SSO, identité web ou configuration partagée).
  </Step>
</Steps>

`ollama` est pris en charge mais n’est pas détecté automatiquement (définissez-le explicitement).

### Résolution de clé API

Les embeddings distants nécessitent une clé API. Bedrock utilise à la place la chaîne d’identifiants par défaut du SDK AWS (rôles d’instance, SSO, clés d’accès).

| Fournisseur    | Variable d’environnement                           | Clé de configuration              |
| --------------- | -------------------------------------------------- | --------------------------------- |
| Bedrock         | chaîne d’identifiants AWS                          | Aucune clé API requise            |
| Gemini          | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`  |
| GitHub Copilot  | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Profil d’authentification via connexion d’appareil |
| Mistral         | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey` |
| Ollama          | `OLLAMA_API_KEY` (espace réservé)                  | --                                |
| OpenAI          | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`  |
| Voyage          | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`  |

<Note>
L’authentification OAuth Codex couvre uniquement chat/completions et ne satisfait pas les requêtes d’embeddings.
</Note>

---

## Configuration des points de terminaison distants

Pour les points de terminaison personnalisés compatibles OpenAI ou pour remplacer les valeurs par défaut d’un fournisseur :

<ParamField path="remote.baseUrl" type="string">
  URL de base d’API personnalisée.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Remplace la clé API.
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

## Configuration spécifique au fournisseur

<AccordionGroup>
  <Accordion title="Gemini">
    | Clé                    | Type     | Valeur par défaut     | Description                                |
    | ---------------------- | -------- | --------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Prend aussi en charge `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                | Pour Embedding 2 : 768, 1536 ou 3072       |

    <Warning>
    Modifier le modèle ou `outputDimensionality` déclenche automatiquement une réindexation complète.
    </Warning>

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock utilise la chaîne d’identifiants par défaut du SDK AWS — aucune clé API n’est nécessaire. Si OpenClaw s’exécute sur EC2 avec un rôle d’instance compatible Bedrock, définissez simplement le fournisseur et le modèle :

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

    | Clé                    | Type     | Valeur par défaut              | Description                    |
    | ---------------------- | -------- | ------------------------------ | ------------------------------ |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Tout ID de modèle d’embeddings Bedrock |
    | `outputDimensionality` | `number` | valeur par défaut du modèle    | Pour Titan V2 : 256, 512 ou 1024 |

    **Modèles pris en charge** (avec détection de famille et dimensions par défaut) :

    | ID du modèle                                | Fournisseur | Dimensions par défaut | Dimensions configurables |
    | ------------------------------------------- | ----------- | --------------------- | ------------------------ |
    | `amazon.titan-embed-text-v2:0`              | Amazon      | 1024                  | 256, 512, 1024           |
    | `amazon.titan-embed-text-v1`                | Amazon      | 1536                  | --                       |
    | `amazon.titan-embed-g1-text-02`             | Amazon      | 1536                  | --                       |
    | `amazon.titan-embed-image-v1`               | Amazon      | 1024                  | --                       |
    | `amazon.nova-2-multimodal-embeddings-v1:0`  | Amazon      | 1024                  | 256, 384, 1024, 3072     |
    | `cohere.embed-english-v3`                   | Cohere      | 1024                  | --                       |
    | `cohere.embed-multilingual-v3`              | Cohere      | 1024                  | --                       |
    | `cohere.embed-v4:0`                         | Cohere      | 1536                  | 256-1536                 |
    | `twelvelabs.marengo-embed-3-0-v1:0`         | TwelveLabs  | 512                   | --                       |
    | `twelvelabs.marengo-embed-2-7-v1:0`         | TwelveLabs  | 1024                  | --                       |

    Les variantes suffixées par débit (par exemple `amazon.titan-embed-text-v1:2:8k`) héritent de la configuration du modèle de base.

    **Authentification :** l’authentification Bedrock utilise l’ordre standard de résolution des identifiants du SDK AWS :

    1. Variables d’environnement (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Cache de jetons SSO
    3. Identifiants de jeton d’identité web
    4. Fichiers partagés d’identifiants et de configuration
    5. Identifiants de métadonnées ECS ou EC2

    La région est résolue à partir de `AWS_REGION`, `AWS_DEFAULT_REGION`, du `baseUrl` du fournisseur `amazon-bedrock`, ou utilise par défaut `us-east-1`.

    **Autorisations IAM :** le rôle ou l’utilisateur IAM doit disposer de :

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Pour appliquer le principe du moindre privilège, limitez `InvokeModel` au modèle spécifique :

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + node-llama-cpp)">
    | Clé                   | Type               | Valeur par défaut     | Description                                                                                                                                                                                                                                                                                                             |
    | --------------------- | ------------------ | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | téléchargé automatiquement | Chemin vers le fichier modèle GGUF                                                                                                                                                                                                                                                                                      |
    | `local.modelCacheDir` | `string`           | valeur par défaut de node-llama-cpp | Répertoire de cache pour les modèles téléchargés                                                                                                                                                                                                                                                                        |
    | `local.contextSize`   | `number \| "auto"` | `4096`                | Taille de fenêtre de contexte pour le contexte d’embeddings. 4096 couvre les segments typiques (128–512 tokens) tout en limitant la VRAM hors poids. Réduisez à 1024–2048 sur les hôtes contraints. `"auto"` utilise le maximum appris du modèle — non recommandé pour les modèles 8B+ (Qwen3-Embedding-8B : 40 960 tokens → ~32 Go de VRAM contre ~8,8 Go à 4096). |

    Modèle par défaut : `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 Go, téléchargé automatiquement). Nécessite une compilation native : `pnpm approve-builds` puis `pnpm rebuild node-llama-cpp`.

    Utilisez la CLI autonome pour vérifier le même chemin de fournisseur que celui utilisé par la Gateway :

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Si `provider` vaut `auto`, `local` est sélectionné uniquement lorsque `local.modelPath` pointe vers un fichier local existant. Les références de modèle `hf:` et HTTP(S) peuvent toujours être utilisées explicitement avec `provider: "local"`, mais elles ne font pas sélectionner `local` par `auto` avant que le modèle soit disponible sur disque.

  </Accordion>
</AccordionGroup>

### Délai d’expiration des embeddings en ligne

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Remplace le délai d’expiration des lots d’embeddings en ligne pendant l’indexation mémoire.

S’il n’est pas défini, la valeur par défaut du fournisseur est utilisée : 600 secondes pour les fournisseurs locaux / auto-hébergés comme `local`, `ollama` et `lmstudio`, et 120 secondes pour les fournisseurs hébergés. Augmentez cette valeur lorsque les lots d’embeddings locaux dépendants du CPU sont sains mais lents.
</ParamField>

---

## Configuration de la recherche hybride

Tout se trouve sous `memorySearch.query.hybrid` :

| Clé                   | Type      | Valeur par défaut | Description                              |
| --------------------- | --------- | ----------------- | ---------------------------------------- |
| `enabled`             | `boolean` | `true`            | Activer la recherche hybride BM25 + vectorielle |
| `vectorWeight`        | `number`  | `0.7`             | Poids des scores vectoriels (0-1)        |
| `textWeight`          | `number`  | `0.3`             | Poids des scores BM25 (0-1)              |
| `candidateMultiplier` | `number`  | `4`               | Multiplicateur de taille du pool de candidats |

<Tabs>
  <Tab title="MMR (diversité)">
    | Clé           | Type      | Valeur par défaut | Description                                |
    | ------------- | --------- | ----------------- | ------------------------------------------ |
    | `mmr.enabled` | `boolean` | `false`           | Activer le reclassement MMR                |
    | `mmr.lambda`  | `number`  | `0.7`             | 0 = diversité maximale, 1 = pertinence maximale |
  </Tab>
  <Tab title="Décroissance temporelle (récence)">
    | Clé                          | Type      | Valeur par défaut | Description                          |
    | ---------------------------- | --------- | ----------------- | ------------------------------------ |
    | `temporalDecay.enabled`      | `boolean` | `false`           | Activer le boost de récence          |
    | `temporalDecay.halfLifeDays` | `number`  | `30`              | Le score est divisé par deux tous les N jours |

    Les fichiers pérennes (`MEMORY.md`, fichiers non datés dans `memory/`) ne subissent jamais de décroissance.

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

| Clé          | Type       | Description                                 |
| ------------ | ---------- | ------------------------------------------- |
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

Pour la recherche de transcription inter-agents à portée d’agent, utilisez `agents.list[].memorySearch.qmd.extraCollections` au lieu de `memory.qmd.paths`. Ces collections supplémentaires suivent la même forme `{ path, name, pattern? }`, mais elles sont fusionnées par agent et peuvent conserver des noms partagés explicites lorsque le chemin pointe en dehors de l’espace de travail actuel. Si le même chemin résolu apparaît à la fois dans `memory.qmd.paths` et `memorySearch.qmd.extraCollections`, QMD conserve la première entrée et ignore le doublon.

---

## Mémoire multimodale (Gemini)

Indexez des images et de l’audio aux côtés du Markdown avec Gemini Embedding 2 :

| Clé                       | Type       | Valeur par défaut | Description                              |
| ------------------------- | ---------- | ----------------- | ---------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`           | Activer l’indexation multimodale         |
| `multimodal.modalities`   | `string[]` | --                | `["image"]`, `["audio"]`, ou `["all"]`   |
| `multimodal.maxFileBytes` | `number`   | `10000000`        | Taille maximale de fichier pour l’indexation |

<Note>
S’applique uniquement aux fichiers dans `extraPaths`. Les racines mémoire par défaut restent limitées au Markdown. Nécessite `gemini-embedding-2-preview`. `fallback` doit être `"none"`.
</Note>

Formats pris en charge : `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (images) ; `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Cache d’embeddings

| Clé                | Type      | Valeur par défaut | Description                          |
| ------------------ | --------- | ----------------- | ------------------------------------ |
| `cache.enabled`    | `boolean` | `false`           | Mettre en cache les embeddings de segments dans SQLite |
| `cache.maxEntries` | `number`  | `50000`           | Nombre maximal d’embeddings mis en cache |

Empêche de regénérer les embeddings d’un texte inchangé lors de la réindexation ou des mises à jour de transcription.

---

## Indexation par lots

| Clé                           | Type      | Valeur par défaut | Description                     |
| ----------------------------- | --------- | ----------------- | ------------------------------- |
| `remote.batch.enabled`        | `boolean` | `false`           | Activer l’API d’embeddings par lots |
| `remote.batch.concurrency`    | `number`  | `2`               | Tâches par lots en parallèle    |
| `remote.batch.wait`           | `boolean` | `true`            | Attendre la fin du lot          |
| `remote.batch.pollIntervalMs` | `number`  | --                | Intervalle d’interrogation      |
| `remote.batch.timeoutMinutes` | `number`  | --                | Délai d’expiration du lot       |

Disponible pour `openai`, `gemini` et `voyage`. Les lots OpenAI sont généralement les plus rapides et les moins coûteux pour les gros remplissages initiaux.

Ceci est distinct de `sync.embeddingBatchTimeoutSeconds`, qui contrôle les appels d’embeddings en ligne utilisés par les fournisseurs locaux / auto-hébergés et par les fournisseurs hébergés lorsque les API de lots du fournisseur ne sont pas actives.

---

## Recherche mémoire de session (expérimental)

Indexez les transcriptions de session et exposez-les via `memory_search` :

| Clé                           | Type       | Valeur par défaut | Description                                 |
| ----------------------------- | ---------- | ----------------- | ------------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`           | Activer l’indexation des sessions           |
| `sources`                     | `string[]` | `["memory"]`      | Ajouter `"sessions"` pour inclure les transcriptions |
| `sync.sessions.deltaBytes`    | `number`   | `100000`          | Seuil en octets pour la réindexation        |
| `sync.sessions.deltaMessages` | `number`   | `50`              | Seuil en messages pour la réindexation      |

<Warning>
L’indexation des sessions est activée sur opt-in et s’exécute de manière asynchrone. Les résultats peuvent être légèrement obsolètes. Les journaux de session sont stockés sur disque ; considérez donc l’accès au système de fichiers comme la frontière de confiance.
</Warning>

---

## Accélération vectorielle SQLite (sqlite-vec)

| Clé                          | Type      | Valeur par défaut | Description                              |
| ---------------------------- | --------- | ----------------- | ---------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`            | Utiliser sqlite-vec pour les requêtes vectorielles |
| `store.vector.extensionPath` | `string`  | groupé            | Remplacer le chemin sqlite-vec           |

Lorsque sqlite-vec n’est pas disponible, OpenClaw revient automatiquement à une similarité cosinus en cours de processus.

---

## Stockage de l’index

| Clé                   | Type     | Valeur par défaut                    | Description                                  |
| --------------------- | -------- | ------------------------------------ | -------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Emplacement de l’index (prend en charge le jeton `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                          | Tokenizer FTS5 (`unicode61` ou `trigram`)    |

---

## Configuration du backend QMD

Définissez `memory.backend = "qmd"` pour l’activer. Tous les paramètres QMD se trouvent sous `memory.qmd` :

| Clé                      | Type      | Valeur par défaut | Description                                      |
| ------------------------ | --------- | ----------------- | ------------------------------------------------ |
| `command`                | `string`  | `qmd`             | Chemin de l’exécutable QMD                       |
| `searchMode`             | `string`  | `search`          | Commande de recherche : `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`            | Indexer automatiquement `MEMORY.md` + `memory/**/*.md` |
| `paths[]`                | `array`   | --                | Chemins supplémentaires : `{ name, path, pattern? }` |
| `sessions.enabled`       | `boolean` | `false`           | Indexer les transcriptions de session            |
| `sessions.retentionDays` | `number`  | --                | Rétention des transcriptions                     |
| `sessions.exportDir`     | `string`  | --                | Répertoire d’export                              |

OpenClaw privilégie les formes actuelles de collection QMD et de requête MCP, mais maintient la compatibilité avec les anciennes versions de QMD en revenant aux indicateurs de collection hérités `--mask` et aux anciens noms d’outils MCP si nécessaire.

<Note>
Les remplacements de modèle QMD restent du côté QMD, pas dans la configuration OpenClaw. Si vous devez remplacer globalement les modèles de QMD, définissez des variables d’environnement telles que `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` et `QMD_GENERATE_MODEL` dans l’environnement d’exécution de la Gateway.
</Note>

<AccordionGroup>
  <Accordion title="Planification des mises à jour">
    | Clé                       | Type      | Valeur par défaut | Description                                  |
    | ------------------------- | --------- | ----------------- | -------------------------------------------- |
    | `update.interval`         | `string`  | `5m`              | Intervalle de rafraîchissement                |
    | `update.debounceMs`       | `number`  | `15000`           | Anti-rebond des changements de fichier       |
    | `update.onBoot`           | `boolean` | `true`            | Rafraîchir au démarrage                       |
    | `update.waitForBootSync`  | `boolean` | `false`           | Bloquer le démarrage jusqu’à la fin du rafraîchissement |
    | `update.embedInterval`    | `string`  | --                | Cadence d’embedding distincte                 |
    | `update.commandTimeoutMs` | `number`  | --                | Délai d’expiration des commandes QMD         |
    | `update.updateTimeoutMs`  | `number`  | --                | Délai d’expiration des opérations de mise à jour QMD |
    | `update.embedTimeoutMs`   | `number`  | --                | Délai d’expiration des opérations d’embedding QMD |
  </Accordion>
  <Accordion title="Limites">
    | Clé                       | Type     | Valeur par défaut | Description                    |
    | ------------------------- | -------- | ----------------- | ------------------------------ |
    | `limits.maxResults`       | `number` | `6`               | Nombre maximal de résultats de recherche |
    | `limits.maxSnippetChars`  | `number` | --                | Limiter la longueur de l’extrait |
    | `limits.maxInjectedChars` | `number` | --                | Limiter le total de caractères injectés |
    | `limits.timeoutMs`        | `number` | `4000`            | Délai d’expiration de la recherche |
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

    La valeur par défaut livrée autorise les sessions directes et de canal, tout en refusant toujours les groupes.

    La valeur par défaut est DM uniquement. `match.keyPrefix` correspond à la clé de session normalisée ; `match.rawKeyPrefix` correspond à la clé brute incluant `agent:<id>:`.

  </Accordion>
  <Accordion title="Citations">
    `memory.citations` s’applique à tous les backends :

    | Valeur           | Comportement                                       |
    | ---------------- | -------------------------------------------------- |
    | `auto` (par défaut) | Inclure un pied de page `Source: <path#line>` dans les extraits |
    | `on`             | Toujours inclure le pied de page                   |
    | `off`            | Omettre le pied de page (le chemin reste tout de même transmis en interne à l’agent) |

  </Accordion>
</AccordionGroup>

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

Dreaming s’exécute comme un balayage planifié unique et utilise en interne des phases light/deep/REM comme détail d’implémentation.

Pour le comportement conceptuel et les commandes slash, consultez [Dreaming](/fr/concepts/dreaming).

### Paramètres utilisateur

| Clé         | Type      | Valeur par défaut | Description                                      |
| ----------- | --------- | ----------------- | ------------------------------------------------ |
| `enabled`   | `boolean` | `false`           | Activer ou désactiver entièrement Dreaming       |
| `frequency` | `string`  | `0 3 * * *`       | Cadence Cron optionnelle pour le balayage complet de Dreaming |

### Exemple

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
          },
        },
      },
    },
  },
}
```

<Note>
- Dreaming écrit l’état machine dans `memory/.dreams/`.
- Dreaming écrit une sortie narrative lisible par l’humain dans `DREAMS.md` (ou le fichier existant `dreams.md`).
- La stratégie et les seuils des phases light/deep/REM relèvent du comportement interne, et non d’une configuration orientée utilisateur.
</Note>

## Lié

- [Référence de configuration](/fr/gateway/configuration-reference)
- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [Recherche mémoire](/fr/concepts/memory-search)
