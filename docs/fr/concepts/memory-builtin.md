---
read_when:
    - Vous souhaitez comprendre le backend de mémoire par défaut
    - Vous souhaitez configurer des fournisseurs d’embeddings ou la recherche hybride
summary: Le backend de mémoire par défaut basé sur SQLite, avec recherche par mots-clés, vectorielle et hybride
title: Moteur de mémoire intégré
x-i18n:
    generated_at: "2026-07-12T15:19:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e8cbe2bae73b1d393ac158edb67fc442e76d1e5ff93e5201dbb7e7216801aa85
    source_path: concepts/memory-builtin.md
    workflow: 16
---

Le moteur intégré est le backend de mémoire par défaut. Il stocke votre index de mémoire
dans une base de données SQLite propre à chaque agent et ne nécessite aucune dépendance supplémentaire pour
démarrer.

## Fonctionnalités

- **Recherche par mots-clés** via l’indexation de texte intégral FTS5 (score BM25).
- **Recherche vectorielle** via les embeddings de n’importe quel fournisseur pris en charge.
- **Recherche hybride** qui combine les deux pour obtenir les meilleurs résultats.
- **Prise en charge du CJK** via la tokenisation en trigrammes pour le chinois, le japonais et le coréen.
- **Accélération sqlite-vec** pour les requêtes vectorielles dans la base de données (facultative).

## Prise en main

Par défaut, le moteur intégré utilise les embeddings OpenAI. Si `OPENAI_API_KEY` ou
`models.providers.openai.apiKey` est déjà configuré, la recherche vectorielle fonctionne
sans configuration supplémentaire de la mémoire.

Pour définir explicitement un fournisseur :

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
      },
    },
  },
}
```

Sans fournisseur d’embeddings, seule la recherche par mots-clés est disponible.

Pour imposer l’utilisation d’embeddings GGUF locaux, installez le plugin officiel du fournisseur
llama.cpp, puis faites pointer `local.modelPath` vers un fichier GGUF :

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        fallback: "none",
        local: {
          modelPath: "~/.node-llama-cpp/models/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

## Fournisseurs d’embeddings pris en charge

| Fournisseur       | ID                  | Remarques                                      |
| ----------------- | ------------------- | ---------------------------------------------- |
| Bedrock           | `bedrock`           | Utilise la chaîne d’identifiants AWS           |
| DeepInfra         | `deepinfra`         | Par défaut : `BAAI/bge-m3`                     |
| Gemini            | `gemini`            | Prend en charge le multimodal (image + audio)  |
| GitHub Copilot    | `github-copilot`    | Utilise votre abonnement Copilot               |
| LM Studio         | `lmstudio`          | Local/auto-hébergé                              |
| Local             | `local`             | `@openclaw/llama-cpp-provider`                 |
| Mistral           | `mistral`           |                                                |
| Ollama            | `ollama`            | Local/auto-hébergé                              |
| OpenAI            | `openai`            | Par défaut : `text-embedding-3-small`           |
| Compatible OpenAI | `openai-compatible` | Point de terminaison générique `/v1/embeddings` |
| Voyage            | `voyage`            |                                                |

Définissez `memorySearch.provider` pour ne plus utiliser OpenAI.

## Fonctionnement de l’indexation

OpenClaw indexe `MEMORY.md` et `memory/*.md` en fragments (400 tokens avec
un chevauchement de 80 tokens par défaut) et les stocke dans une base de données SQLite propre à chaque agent.

- **Emplacement de l’index :** la base de données de l’agent propriétaire à
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Maintenance du stockage :** la taille des fichiers annexes WAL de SQLite est limitée grâce à des points de contrôle
  périodiques et lors de l’arrêt.
- **Surveillance des fichiers :** les modifications des fichiers de mémoire déclenchent une réindexation temporisée
  (1,5 s par défaut).
- **Réindexation automatique :** l’index est automatiquement reconstruit lorsque le fournisseur
  d’embeddings, le modèle, la configuration du découpage, les sources configurées ou la portée changent.
- **Réindexation à la demande :** `openclaw memory index --force`

<Info>
Vous pouvez également indexer des fichiers Markdown situés hors de l’espace de travail avec
`memorySearch.extraPaths`. Consultez la
[référence de configuration](/fr/reference/memory-config#additional-memory-paths).
</Info>

## Quand l’utiliser

Le moteur intégré est le choix approprié pour la plupart des utilisateurs :

- Fonctionne immédiatement sans dépendance supplémentaire.
- Gère efficacement la recherche par mots-clés et la recherche vectorielle.
- Prend en charge tous les fournisseurs d’embeddings.
- La recherche hybride combine les avantages des deux méthodes de récupération.

Envisagez de passer à [QMD](/fr/concepts/memory-qmd) si vous avez besoin d’un reclassement, d’une expansion
des requêtes ou si vous souhaitez indexer des répertoires situés hors de l’espace de travail.

Envisagez [Honcho](/fr/concepts/memory-honcho) si vous souhaitez disposer d’une mémoire intersession
avec une modélisation automatique de l’utilisateur.

## Résolution des problèmes

**La recherche dans la mémoire est désactivée ?** Vérifiez `openclaw memory status`. Si aucun fournisseur n’est
détecté, définissez-en un explicitement ou ajoutez une clé d’API.

**Le fournisseur local n’est pas détecté ?** Vérifiez que le chemin local existe et exécutez :

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Les commandes CLI autonomes et le Gateway utilisent le même identifiant de fournisseur `local`.
Définissez `memorySearch.provider: "local"` lorsque vous souhaitez utiliser des embeddings locaux.

**Résultats obsolètes ?** Exécutez `openclaw memory index --force` pour reconstruire l’index. Le mécanisme de surveillance
peut ne pas détecter certaines modifications dans de rares cas limites.

**sqlite-vec ne se charge pas ?** OpenClaw utilise automatiquement la similarité cosinus
en cours de processus comme solution de repli. `openclaw memory status --deep` indique le magasin
vectoriel local séparément du fournisseur d’embeddings : `Vector store:
unavailable` signale donc un problème de chargement de sqlite-vec, tandis que `Embeddings: unavailable`
signale un problème lié au fournisseur, à l’authentification ou à la disponibilité du modèle. Consultez les journaux pour connaître l’erreur
de chargement précise.

## Configuration

Pour la configuration du fournisseur d’embeddings, le réglage de la recherche hybride (pondérations, MMR, décroissance
temporelle), l’indexation par lots, la mémoire multimodale, sqlite-vec, les chemins supplémentaires et toutes
les autres options de configuration, consultez la
[référence de configuration de la mémoire](/fr/reference/memory-config).

## Voir aussi

- [Présentation de la mémoire](/fr/concepts/memory)
- [Recherche dans la mémoire](/fr/concepts/memory-search)
- [Active Memory](/fr/concepts/active-memory)
