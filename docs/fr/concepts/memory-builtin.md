---
read_when:
    - Vous voulez comprendre le backend de mémoire par défaut
    - Vous voulez configurer des fournisseurs d’embeddings ou la recherche hybride
summary: Le backend mémoire par défaut basé sur SQLite avec recherche par mots-clés, vectorielle et hybride
title: Moteur de mémoire intégré
x-i18n:
    generated_at: "2026-06-27T17:24:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a867bd295778f81109b258a63a35a1683d652d4564e44335053af4d86f90584e
    source_path: concepts/memory-builtin.md
    workflow: 16
---

Le moteur intégré est le backend de mémoire par défaut. Il stocke votre index de mémoire dans
une base de données SQLite propre à chaque agent et ne nécessite aucune dépendance supplémentaire pour démarrer.

## Ce qu’il fournit

- **Recherche par mots-clés** via l’indexation de texte intégral FTS5 (score BM25).
- **Recherche vectorielle** via des embeddings provenant de n’importe quel fournisseur pris en charge.
- **Recherche hybride** qui combine les deux pour obtenir les meilleurs résultats.
- **Prise en charge CJK** via la tokenisation par trigrammes pour le chinois, le japonais et le coréen.
- **Accélération sqlite-vec** pour les requêtes vectorielles en base de données (facultatif).

## Premiers pas

Par défaut, le moteur intégré utilise les embeddings OpenAI. Si vous avez déjà
configuré `OPENAI_API_KEY` ou `models.providers.openai.apiKey`, la recherche
vectorielle fonctionne sans configuration de mémoire supplémentaire.

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

Pour forcer les embeddings GGUF locaux, installez le Plugin de fournisseur officiel llama.cpp,
puis faites pointer `local.modelPath` vers un fichier GGUF :

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

| Fournisseur       | ID                  | Notes                               |
| ----------------- | ------------------- | ----------------------------------- |
| Bedrock           | `bedrock`           | Utilise la chaîne d’identifiants AWS |
| DeepInfra         | `deepinfra`         | Par défaut : `BAAI/bge-m3`          |
| Gemini            | `gemini`            | Prend en charge le multimodal (image + audio) |
| GitHub Copilot    | `github-copilot`    | Utilise l’abonnement Copilot        |
| Local             | `local`             | `@openclaw/llama-cpp-provider`      |
| Mistral           | `mistral`           |                                     |
| Ollama            | `ollama`            | Local/auto-hébergé                  |
| OpenAI            | `openai`            | Par défaut : `text-embedding-3-small` |
| OpenAI-compatible | `openai-compatible` | Point de terminaison générique `/v1/embeddings` |
| Voyage            | `voyage`            |                                     |

Définissez `memorySearch.provider` pour ne plus utiliser OpenAI.

## Fonctionnement de l’indexation

OpenClaw indexe `MEMORY.md` et `memory/*.md` en segments (~400 tokens avec
un chevauchement de 80 tokens) et les stocke dans une base de données SQLite propre à chaque agent.

- **Emplacement de l’index :** la base de données de l’agent propriétaire à
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Maintenance du stockage :** les fichiers annexes WAL de SQLite sont limités par des points de contrôle périodiques et
  à l’arrêt.
- **Surveillance des fichiers :** les changements apportés aux fichiers de mémoire déclenchent une réindexation différée (1,5 s).
- **Réindexation automatique :** lorsque le fournisseur d’embeddings, le modèle ou la configuration de segmentation
  change, l’index entier est reconstruit automatiquement.
- **Réindexation à la demande :** `openclaw memory index --force`

<Info>
Vous pouvez aussi indexer des fichiers Markdown situés hors de l’espace de travail avec
`memorySearch.extraPaths`. Consultez la
[référence de configuration](/fr/reference/memory-config#additional-memory-paths).
</Info>

## Quand l’utiliser

Le moteur intégré est le bon choix pour la plupart des utilisateurs :

- Fonctionne immédiatement sans dépendances supplémentaires.
- Gère bien la recherche par mots-clés et la recherche vectorielle.
- Prend en charge tous les fournisseurs d’embeddings.
- La recherche hybride combine le meilleur des deux approches de récupération.

Envisagez de passer à [QMD](/fr/concepts/memory-qmd) si vous avez besoin de reranking, d’expansion de requête
ou si vous voulez indexer des répertoires hors de l’espace de travail.

Envisagez [Honcho](/fr/concepts/memory-honcho) si vous voulez une mémoire intersessions avec
modélisation automatique de l’utilisateur.

## Dépannage

**Recherche en mémoire désactivée ?** Vérifiez `openclaw memory status`. Si aucun fournisseur n’est
détecté, définissez-en un explicitement ou ajoutez une clé d’API.

**Fournisseur local non détecté ?** Confirmez que le chemin local existe et exécutez :

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Les commandes CLI autonomes et le Gateway utilisent le même identifiant de fournisseur `local`.
Définissez `memorySearch.provider: "local"` lorsque vous voulez utiliser des embeddings locaux.

**Résultats obsolètes ?** Exécutez `openclaw memory index --force` pour reconstruire. Le surveillant
peut manquer des changements dans de rares cas limites.

**sqlite-vec ne se charge pas ?** OpenClaw revient automatiquement à la similarité cosinus
en cours de processus. `openclaw memory status --deep` signale le magasin vectoriel local
séparément du fournisseur d’embeddings ; ainsi, `Vector store: unavailable` indique
un problème de chargement de sqlite-vec, tandis que `Embeddings: unavailable` indique
un problème de fournisseur/authentification ou de disponibilité du modèle. Consultez les journaux pour l’erreur de chargement précise.

## Configuration

Pour la configuration du fournisseur d’embeddings, l’ajustement de la recherche hybride (poids, MMR, décroissance
temporelle), l’indexation par lots, la mémoire multimodale, sqlite-vec, les chemins supplémentaires et tous
les autres paramètres de configuration, consultez la
[référence de configuration de la mémoire](/fr/reference/memory-config).

## Liens associés

- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [Recherche en mémoire](/fr/concepts/memory-search)
- [Active Memory](/fr/concepts/active-memory)
