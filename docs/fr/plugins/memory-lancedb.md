---
read_when:
    - Vous configurez le plugin memory-lancedb
    - Vous souhaitez une mémoire à long terme basée sur LanceDB avec rappel ou capture automatiques
    - Vous utilisez des embeddings locaux compatibles avec OpenAI, comme Ollama.
sidebarTitle: Memory LanceDB
summary: Configurer le plugin de mémoire externe officiel LanceDB, y compris les embeddings locaux compatibles avec Ollama
title: Mémoire LanceDB
x-i18n:
    generated_at: "2026-07-16T13:35:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 786b511da4fbfd90f4c3e5be5a1aeddf5daa59036247552bd671f4bab89319f6
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` est un plugin externe officiel qui stocke la mémoire à long terme dans
LanceDB avec une recherche vectorielle. Il peut rappeler automatiquement les souvenirs pertinents avant un tour
du modèle et capturer automatiquement les faits importants après une réponse.

Utilisez-le pour une base de données vectorielle locale, un point de terminaison d’embeddings compatible avec OpenAI ou
un stockage de mémoire distinct du backend de mémoire intégré par défaut.

## Installation

```bash
openclaw plugins install @openclaw/memory-lancedb
```

Le plugin est publié sur npm ; il n’est pas inclus dans l’image d’exécution
d’OpenClaw. Son installation écrit l’entrée du plugin, l’active et remplace
`plugins.slots.memory` par `memory-lancedb`. Si un autre plugin occupe actuellement
l’emplacement de mémoire, ce plugin est désactivé avec un avertissement.

<Note>
Les plugins complémentaires tels que `memory-wiki` peuvent s’exécuter aux côtés de `memory-lancedb`,
mais un seul plugin occupe l’emplacement de mémoire actif à la fois.
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

Redémarrez le Gateway après avoir modifié la configuration du plugin, puis vérifiez qu’il a été chargé :

```bash
openclaw gateway restart
openclaw plugins list
```

## Configuration des embeddings

`embedding` est requis et doit inclure au moins un champ. `provider`
utilise par défaut `openai` ; `model` utilise par défaut `text-embedding-3-small`.

| Champ                  | Type          | Remarques                                                                    |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | chaîne        | Identifiant de l’adaptateur, par ex. `openai`, `github-copilot`, `ollama`. Valeur par défaut : `openai`. |
| `embedding.model`      | chaîne        | Valeur par défaut : `text-embedding-3-small`.                                        |
| `embedding.apiKey`     | chaîne        | Facultatif ; prend en charge l’expansion de `${ENV_VAR}`.                               |
| `embedding.baseUrl`    | chaîne        | Facultatif ; prend en charge l’expansion de `${ENV_VAR}`.                               |
| `embedding.dimensions` | entier (>=1) | Requis pour les modèles absents du tableau intégré (voir ci-dessous).               |

Deux chemins de requête existent :

- **Chemin de l’adaptateur du fournisseur** (par défaut) : définissez `embedding.provider` et omettez
  `embedding.apiKey`/`embedding.baseUrl`. Le plugin résout le profil
  d’authentification configuré du fournisseur, la variable d’environnement ou
  `models.providers.<provider>.apiKey` par l’intermédiaire des mêmes adaptateurs
  d’embeddings de mémoire que ceux utilisés par `memory-core`. Il s’agit du chemin pour `github-copilot`, `ollama`
  et tout autre fournisseur intégré prenant en charge les embeddings.
- **Chemin du client direct compatible avec OpenAI** : laissez `embedding.provider` non défini
  (ou `"openai"`) et définissez `embedding.apiKey` ainsi que `embedding.baseUrl`. Utilisez ce chemin
  pour un point de terminaison brut d’embeddings compatible avec OpenAI qui ne dispose d’aucun adaptateur
  de fournisseur intégré.

L’OAuth d’OpenAI Codex / ChatGPT ne constitue pas un identifiant d’embeddings OpenAI Platform.
Pour les embeddings OpenAI, utilisez un profil d’authentification par clé d’API OpenAI, `OPENAI_API_KEY` ou
`models.providers.openai.apiKey`. Les utilisateurs disposant uniquement d’OAuth doivent choisir un autre
fournisseur prenant en charge les embeddings, tel que `github-copilot` ou `ollama`.

```json5
{
  plugins: {
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

Certains points de terminaison d’embeddings compatibles avec OpenAI rejettent le paramètre `encoding_format` ;
d’autres l’ignorent et renvoient toujours `number[]`. `memory-lancedb`
omet `encoding_format` dans les requêtes et accepte aussi bien les réponses sous forme de tableaux de nombres flottants que
celles encodées en base64 au format float32 ; les deux formes de réponse fonctionnent donc sans configuration.

### Dimensions

OpenClaw ne dispose de dimensions intégrées que pour `text-embedding-3-small` (1536) et
`text-embedding-3-large` (3072). Tout autre modèle nécessite une valeur
`embedding.dimensions` explicite afin que LanceDB puisse créer la colonne vectorielle, par exemple
ZhiPu `embedding-3` avec 2048 dimensions :

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

## Embeddings Ollama

Utilisez le chemin de l’adaptateur du fournisseur Ollama intégré (`embedding.provider: "ollama"`).
Il appelle le point de terminaison natif `/api/embed` d’Ollama et suit les mêmes règles d’authentification et d’URL
de base que le fournisseur [Ollama](/fr/providers/ollama).

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

`mxbai-embed-large` ne figure pas dans le tableau de dimensions intégré ; `dimensions` est donc
requis. Pour les petits modèles d’embeddings locaux, réduisez `recallMaxChars` si le
serveur local renvoie des erreurs de longueur de contexte.

## Limites de rappel et de capture

| Paramètre           | Valeur par défaut | Plage                        | S’applique à                                                 |
| ----------------- | ------- | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000                    | Texte envoyé à l’API d’embeddings pour le rappel.                 |
| `captureMaxChars` | `500`   | 100-10000                    | Longueur de message admissible pour la capture automatique.                  |
| `customTriggers`  | `[]`    | 0-50 éléments, chacun <=100 caractères | Phrases littérales qui amènent la capture automatique à prendre un message en compte. |

`recallMaxChars` limite la requête de rappel automatique `before_prompt_build`, l’outil
`memory_recall`, le chemin de requête `memory_forget` et `openclaw ltm
search`. Le rappel automatique génère l’embedding du dernier message utilisateur du tour et se rabat
sur l’invite complète uniquement en l’absence de message utilisateur, ce qui exclut les
métadonnées du canal et les grands blocs d’invite de la requête d’embedding.

`captureMaxChars` détermine si un message utilisateur issu de l’événement `agent_end`
du tour est suffisamment court pour être pris en compte par la capture automatique ; il n’affecte pas
les requêtes de rappel.

`customTriggers` ajoute des phrases littérales de capture automatique sans expression régulière. Les déclencheurs
intégrés couvrent les expressions de mémoire courantes en anglais, tchèque, chinois, japonais et coréen
(`remember`, `prefer`, `记住`, `覚えて`, `기억해` et similaires).

La capture automatique rejette également les textes qui ressemblent à des métadonnées d’enveloppe ou de transport,
à des charges utiles d’injection d’invite ou à un contexte `<relevant-memories>` déjà injecté,
et limite la capture à 3 souvenirs par tour d’agent.

Chaque souvenir appartient à un seul agent. Le rappel, la détection des doublons, la capture,
l’énumération, les requêtes brutes et la suppression appliquent tous ce propriétaire avant de renvoyer ou
de modifier des lignes. Un agent avec `memorySearch.enabled: false` (dans `agents.list[]`
ou via `agents.defaults`) ne dispose également d’aucun des outils `memory_recall`, `memory_store`
ou `memory_forget` et ne participe ni au rappel ni à la
capture automatiques, même lorsque les indicateurs `autoRecall`/`autoCapture` au niveau du plugin sont activés.

## Commandes

`memory-lancedb` enregistre l’espace de noms CLI `ltm` dès qu’il est installé
(et pas seulement lorsqu’il occupe l’emplacement de mémoire actif) :

```bash
openclaw ltm list [--agent <id>] [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--agent <id>] [--limit <n>]
openclaw ltm stats [--agent <id>]
```

`ltm query` exécute une requête non vectorielle directement sur la table LanceDB :

```bash
openclaw ltm query --agent research --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| Indicateur                              | Valeur par défaut                                 | Remarques                                                                                                                                     |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--agent <id>`                    | agent configuré par défaut                | Sélectionne l’espace de noms privé de l’agent. Disponible sur `list`, `search`, `query` et `stats`.                                                 |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | Liste autorisée de colonnes séparées par des virgules.                                                                                                         |
| `--filter <condition>`            | aucune                                    | Une comparaison sur une colonne de sortie, telle que `category = 'preference'` ou `importance >= 0.8`. Les valeurs de chaîne doivent être placées entre guillemets.             |
| `--limit <n>`                     | `10`                                    | Entier positif.                                                                                                                         |
| `--order-by <column>:<asc\|desc>` | aucune                                    | Trié en mémoire après l’exécution du filtre ; la colonne de tri est automatiquement ajoutée à la projection et retirée de la sortie si elle n’a pas été demandée. |

Les agents disposent de trois outils fournis par le plugin de mémoire actif :

- `memory_recall` : recherche vectorielle dans les souvenirs stockés.
- `memory_store` : enregistre un fait, une préférence, une décision ou une entité (rejette le texte
  qui ressemble à une charge utile d’injection d’invite ; ignore les enregistrements presque identiques).
- `memory_forget` : supprime par `memoryId` ou par `query` (supprime automatiquement une correspondance unique
  dont le score dépasse 90 %, sinon répertorie les identifiants candidats pour lever l’ambiguïté).

## Stockage

Les données LanceDB sont stockées par défaut dans `~/.openclaw/memory/lancedb`. Remplacez cette valeur avec `dbPath` :

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

Le plugin conserve une seule table LanceDB et stocke un propriétaire d’agent normalisé dans chaque
ligne. Il s’agit d’une limite de stockage, et non d’un filtre postérieur à la recherche : la propriété de l’agent est
appliquée avant le classement vectoriel et incluse dans les prédicats d’énumération, de requête, de comptage et de suppression.
`ltm query --filter` accepte une comparaison validée sur les
colonnes de sortie publiques. Le stockage construit cette comparaison séparément du
prédicat obligatoire du propriétaire, de sorte qu’un filtre ne peut pas élargir la requête à un autre
agent.

Les bases de données créées avant l’introduction de la propriété par agent ne disposent d’aucune provenance fiable pour leurs lignes.
Lors d’une mise à niveau, `openclaw doctor --fix` attribue une seule fois ces lignes héritées à
l’agent configuré par défaut. L’accès à l’exécution échoue de manière fermée tant que cette migration n’est pas
terminée ; les autres agents n’héritent jamais des anciennes lignes partagées.

`storageOptions` accepte des paires clé/valeur de chaînes pour les backends de stockage LanceDB
(par ex. un stockage d’objets compatible avec S3) et prend en charge l’expansion de `${ENV_VAR}` :

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

## Dépendances d’exécution et prise en charge des plateformes

`memory-lancedb` dépend du paquet natif `@lancedb/lancedb`, qui appartient au
paquet du plugin (et non à la distribution principale d’OpenClaw). Le démarrage du Gateway ne répare pas
les dépendances du plugin ; si la dépendance native est absente ou ne se charge pas,
réinstallez ou mettez à jour le paquet du plugin, puis redémarrez le Gateway.

`@lancedb/lancedb` ne publie pas de version native pour `darwin-x64` (Mac
Intel). Sur cette plateforme, le plugin indique dans les journaux que LanceDB est indisponible lors du
chargement ; utilisez le backend de mémoire par défaut, exécutez le Gateway sur une
plateforme ou une architecture prise en charge, ou désactivez `memory-lancedb`.

## Dépannage

### La longueur de l’entrée dépasse la longueur du contexte

Le modèle d’embedding a rejeté la requête de rappel :

```text
memory-lancedb: échec du rappel : Erreur : 400 la longueur de l’entrée dépasse la longueur du contexte
```

Réduisez `recallMaxChars`, puis redémarrez le Gateway :

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

Pour Ollama, vérifiez également que le serveur d’embedding est accessible depuis l’hôte du
Gateway au moyen de son point de terminaison natif d’embedding :

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Modèle d’embedding non pris en charge

Sans `embedding.dimensions`, seules les dimensions d’embedding OpenAI intégrées
sont connues (`text-embedding-3-small`, `text-embedding-3-large`). Pour tout autre
modèle, définissez `embedding.dimensions` sur la taille de vecteur indiquée par ce modèle.

### Le plugin se charge, mais aucune mémoire n’apparaît

Vérifiez que `plugins.slots.memory` pointe vers `memory-lancedb`, puis exécutez :

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Si `autoCapture` est désactivé, le plugin rappelle toujours les mémoires existantes, mais
n’en stocke pas automatiquement de nouvelles. Utilisez l’outil `memory_store`, ou activez
`autoCapture`.

## Pages connexes

- [Présentation de la mémoire](/fr/concepts/memory)
- [Active Memory](/fr/concepts/active-memory)
- [Recherche dans la mémoire](/fr/concepts/memory-search)
- [Wiki de la mémoire](/fr/plugins/memory-wiki)
- [Ollama](/fr/providers/ollama)
