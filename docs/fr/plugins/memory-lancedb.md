---
read_when:
    - Vous configurez le Plugin memory-lancedb intégré
    - Vous voulez une mémoire à long terme adossée à LanceDB avec rappel automatique ou capture automatique
    - Vous utilisez des embeddings locaux compatibles avec OpenAI, comme Ollama
sidebarTitle: Memory LanceDB
summary: Configurer le Plugin de mémoire LanceDB inclus, y compris les embeddings locaux compatibles avec Ollama
title: Mémoire LanceDB
x-i18n:
    generated_at: "2026-04-30T07:39:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: bda53528857a492f1627f655e49be6775e0114115781371ff67debb155b7e731
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` est un Plugin de mémoire intégré qui stocke la mémoire à long terme dans
LanceDB et utilise des embeddings pour le rappel. Il peut rappeler automatiquement les
mémoires pertinentes avant un tour de modèle et capturer les faits importants après une réponse.

Utilisez-le lorsque vous voulez une base de données vectorielle locale pour la mémoire, avez besoin d’un
point de terminaison d’embeddings compatible OpenAI, ou voulez conserver une base de données de mémoire en dehors
du magasin de mémoire intégré par défaut.

<Note>
`memory-lancedb` est un Plugin de mémoire active. Activez-le en sélectionnant l’emplacement mémoire
avec `plugins.slots.memory = "memory-lancedb"`. Des Plugins compagnons tels que
`memory-wiki` peuvent s’exécuter à côté, mais un seul Plugin possède l’emplacement de mémoire active.
</Note>

## Démarrage rapide

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "openai",
            model: "text-embedding-3-small",
          },
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

Redémarrez le Gateway après avoir modifié la configuration du Plugin :

```bash
openclaw gateway restart
```

Vérifiez ensuite que le Plugin est chargé :

```bash
openclaw plugins list
```

## Embeddings adossés à un fournisseur

`memory-lancedb` peut utiliser les mêmes adaptateurs de fournisseur d’embeddings de mémoire que
`memory-core`. Définissez `embedding.provider` et omettez `embedding.apiKey` pour utiliser le
profil d’authentification configuré du fournisseur, la variable d’environnement ou
`models.providers.<provider>.apiKey`.

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "openai",
            model: "text-embedding-3-small",
          },
          autoRecall: true,
        },
      },
    },
  },
}
```

Ce chemin fonctionne avec les profils d’authentification de fournisseur qui exposent des identifiants d’embeddings.
Par exemple, GitHub Copilot peut être utilisé lorsque le profil/forfait Copilot prend en charge
les embeddings :

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

OpenAI Codex / ChatGPT OAuth (`openai-codex`) n’est pas un identifiant d’embeddings
OpenAI Platform. Pour les embeddings OpenAI, utilisez un profil d’authentification avec clé API OpenAI,
`OPENAI_API_KEY`, ou `models.providers.openai.apiKey`. Les utilisateurs avec OAuth seul peuvent utiliser
un autre fournisseur compatible embeddings, comme GitHub Copilot ou Ollama.

## Embeddings Ollama

Pour les embeddings Ollama, privilégiez le fournisseur d’embeddings Ollama intégré. Il utilise le
point de terminaison Ollama natif `/api/embed` et suit les mêmes règles d’authentification/d’URL de base que
le fournisseur Ollama documenté dans [Ollama](/fr/providers/ollama).

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "ollama",
            baseUrl: "http://127.0.0.1:11434",
            model: "mxbai-embed-large",
            dimensions: 1024,
          },
          recallMaxChars: 400,
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

Définissez `dimensions` pour les modèles d’embeddings non standard. OpenClaw connaît les
dimensions de `text-embedding-3-small` et `text-embedding-3-large` ; les modèles
personnalisés ont besoin de la valeur dans la configuration afin que LanceDB puisse créer la colonne vectorielle.

Pour les petits modèles d’embeddings locaux, réduisez `recallMaxChars` si vous observez des erreurs de
longueur de contexte provenant du serveur local.

## Fournisseurs compatibles OpenAI

Certains fournisseurs d’embeddings compatibles OpenAI rejettent le paramètre `encoding_format`,
tandis que d’autres l’ignorent et renvoient toujours des vecteurs `number[]`.
`memory-lancedb` omet donc `encoding_format` dans les requêtes d’embeddings et
accepte soit des réponses sous forme de tableaux de flottants, soit des réponses float32 encodées en base64.

Si vous disposez d’un point de terminaison d’embeddings brut compatible OpenAI qui n’a pas
d’adaptateur de fournisseur intégré, omettez `embedding.provider` (ou laissez-le à `openai`) et
définissez `embedding.apiKey` ainsi que `embedding.baseUrl`. Cela préserve le chemin client direct
compatible OpenAI.

Définissez `embedding.dimensions` pour les fournisseurs dont les dimensions de modèle ne sont pas intégrées.
Par exemple, ZhiPu `embedding-3` utilise `2048` dimensions :

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            apiKey: "${ZHIPU_API_KEY}",
            baseUrl: "https://open.bigmodel.cn/api/paas/v4",
            model: "embedding-3",
            dimensions: 2048,
          },
        },
      },
    },
  },
}
```

## Limites de rappel et de capture

`memory-lancedb` a deux limites de texte distinctes :

| Paramètre         | Valeur par défaut | Plage     | S’applique à                                  |
| ----------------- | ------- | --------- | --------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000 | texte envoyé à l’API d’embeddings pour le rappel     |
| `captureMaxChars` | `500`   | 100-10000 | longueur de message assistant éligible à la capture |

`recallMaxChars` contrôle le rappel automatique, l’outil `memory_recall`, le chemin de requête
`memory_forget` et `openclaw ltm search`. Le rappel automatique privilégie le
dernier message utilisateur du tour et se rabat sur le prompt complet uniquement lorsqu’aucun
message utilisateur n’est disponible. Cela garde les métadonnées de canal et les gros blocs de prompt
hors de la requête d’embeddings.

`captureMaxChars` détermine si une réponse est suffisamment courte pour être prise en compte
pour la capture automatique. Il ne limite pas les embeddings de requête de rappel.

## Commandes

Lorsque `memory-lancedb` est le Plugin de mémoire active, il enregistre l’espace de noms CLI
`ltm` :

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

Le Plugin étend également `openclaw memory` avec une sous-commande `query` non vectorielle
qui s’exécute directement sur la table LanceDB :

```bash
openclaw memory query --cols id,text,createdAt --limit 20
openclaw memory query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>` : liste autorisée de colonnes séparées par des virgules (par défaut `id`, `text`, `importance`, `category`, `createdAt`).
- `--filter <condition>` : clause WHERE de style SQL ; plafonnée à 200 caractères et limitée aux caractères alphanumériques, aux opérateurs de comparaison, aux guillemets, aux parenthèses et à un petit ensemble de ponctuation sûre.
- `--limit <n>` : entier positif ; valeur par défaut `10`.
- `--order-by <column>:<asc|desc>` : tri en mémoire appliqué après le filtre ; la colonne de tri est automatiquement incluse dans la projection.

Les agents obtiennent également des outils de mémoire LanceDB depuis le Plugin de mémoire active :

- `memory_recall` pour le rappel adossé à LanceDB
- `memory_store` pour enregistrer les faits importants, les préférences, les décisions et les entités
- `memory_forget` pour supprimer les mémoires correspondantes

## Stockage

Par défaut, les données LanceDB se trouvent sous `~/.openclaw/memory/lancedb`. Remplacez le
chemin avec `dbPath` :

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "~/.openclaw/memory/lancedb",
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

`storageOptions` accepte des paires clé/valeur de chaînes pour les backends de stockage LanceDB et
prend en charge l’expansion `${ENV_VAR}` :

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "s3://memory-bucket/openclaw",
          storageOptions: {
            access_key: "${AWS_ACCESS_KEY_ID}",
            secret_key: "${AWS_SECRET_ACCESS_KEY}",
            endpoint: "${AWS_ENDPOINT_URL}",
          },
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

## Dépendances d’exécution

`memory-lancedb` dépend du paquet natif `@lancedb/lancedb`. Les installations
OpenClaw packagées essaient d’abord la dépendance d’exécution intégrée et peuvent réparer la
dépendance d’exécution du Plugin sous l’état OpenClaw lorsque l’import intégré n’est pas
disponible.

Si une ancienne installation consigne une erreur `dist/package.json` manquant ou
`@lancedb/lancedb` manquant pendant le chargement du Plugin, mettez OpenClaw à niveau et redémarrez le
Gateway.

Si le Plugin indique dans les journaux que LanceDB n’est pas disponible sur `darwin-x64`, utilisez le backend
de mémoire par défaut sur cette machine, déplacez le Gateway vers une plateforme prise en charge, ou
désactivez `memory-lancedb`.

## Dépannage

### La longueur d’entrée dépasse la longueur de contexte

Cela signifie généralement que le modèle d’embeddings a rejeté la requête de rappel :

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

Définissez un `recallMaxChars` plus bas, puis redémarrez le Gateway :

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        config: {
          recallMaxChars: 400,
        },
      },
    },
  },
}
```

Pour Ollama, vérifiez également que le serveur d’embeddings est accessible depuis l’hôte du Gateway :

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Modèle d’embeddings non pris en charge

Sans `dimensions`, seules les dimensions d’embeddings OpenAI intégrées sont connues.
Pour les modèles d’embeddings locaux ou personnalisés, définissez `embedding.dimensions` sur la taille vectorielle
signalée par ce modèle.

### Le Plugin se charge, mais aucune mémoire n’apparaît

Vérifiez que `plugins.slots.memory` pointe vers `memory-lancedb`, puis exécutez :

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Si `autoCapture` est désactivé, le Plugin rappellera les mémoires existantes mais ne
stockera pas automatiquement les nouvelles. Utilisez l’outil `memory_store` ou activez
`autoCapture` si vous voulez une capture automatique.

## Associé

- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [Active memory](/fr/concepts/active-memory)
- [Recherche de mémoire](/fr/concepts/memory-search)
- [Memory Wiki](/fr/plugins/memory-wiki)
- [Ollama](/fr/providers/ollama)
