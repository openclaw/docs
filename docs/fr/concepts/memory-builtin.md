---
read_when:
    - Vous souhaitez comprendre le backend mémoire par défaut
    - Vous souhaitez configurer des fournisseurs d’embeddings ou la recherche hybride
summary: Le backend mémoire par défaut basé sur SQLite avec recherche par mots-clés, vectorielle et hybride
title: Moteur de mémoire intégré
x-i18n:
    generated_at: "2026-04-25T13:45:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ccf0b70bd3ed4e2138ae1d811573f6920c95eb3f8117693b242732012779dc6
    source_path: concepts/memory-builtin.md
    workflow: 15
---

Le moteur intégré est le backend mémoire par défaut. Il stocke votre index mémoire dans
une base de données SQLite par agent et ne nécessite aucune dépendance supplémentaire pour démarrer.

## Ce qu’il fournit

- **Recherche par mots-clés** via l’indexation plein texte FTS5 (score BM25).
- **Recherche vectorielle** via des embeddings de n’importe quel fournisseur pris en charge.
- **Recherche hybride** qui combine les deux pour de meilleurs résultats.
- **Prise en charge CJK** via la tokenisation par trigrammes pour le chinois, le japonais et le coréen.
- **Accélération sqlite-vec** pour les requêtes vectorielles en base de données (facultatif).

## Démarrage

Si vous avez une clé API pour OpenAI, Gemini, Voyage ou Mistral, le moteur intégré
la détecte automatiquement et active la recherche vectorielle. Aucune configuration n’est nécessaire.

Pour définir explicitement un fournisseur :

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

Pour forcer le fournisseur d’embeddings local intégré, installez le package d’exécution facultatif
`node-llama-cpp` à côté d’OpenClaw, puis pointez `local.modelPath`
vers un fichier GGUF :

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

| Fournisseur | ID        | Détection automatique | Remarques                              |
| ----------- | --------- | --------------------- | -------------------------------------- |
| OpenAI      | `openai`  | Oui                   | Par défaut : `text-embedding-3-small`  |
| Gemini      | `gemini`  | Oui                   | Prend en charge le multimodal (image + audio) |
| Voyage      | `voyage`  | Oui                   |                                        |
| Mistral     | `mistral` | Oui                   |                                        |
| Ollama      | `ollama`  | Non                   | Local, à définir explicitement         |
| Local       | `local`   | Oui (en premier)      | Exécution `node-llama-cpp` facultative |

La détection automatique choisit le premier fournisseur dont la clé API peut être résolue, dans l’ordre
indiqué. Définissez `memorySearch.provider` pour le remplacer.

## Fonctionnement de l’indexation

OpenClaw indexe `MEMORY.md` et `memory/*.md` en segments (~400 jetons avec
un chevauchement de 80 jetons) et les stocke dans une base de données SQLite par agent.

- **Emplacement de l’index :** `~/.openclaw/memory/<agentId>.sqlite`
- **Surveillance des fichiers :** les modifications des fichiers mémoire déclenchent une réindexation temporisée (1,5 s).
- **Réindexation automatique :** lorsque le fournisseur d’embeddings, le modèle ou la configuration de segmentation
  changent, l’index entier est reconstruit automatiquement.
- **Réindexation à la demande :** `openclaw memory index --force`

<Info>
Vous pouvez aussi indexer des fichiers Markdown en dehors de l’espace de travail avec
`memorySearch.extraPaths`. Voir la
[référence de configuration](/fr/reference/memory-config#additional-memory-paths).
</Info>

## Quand l’utiliser

Le moteur intégré est le bon choix pour la plupart des utilisateurs :

- Fonctionne immédiatement sans dépendances supplémentaires.
- Gère bien la recherche par mots-clés et vectorielle.
- Prend en charge tous les fournisseurs d’embeddings.
- La recherche hybride combine le meilleur des deux approches de récupération.

Envisagez de passer à [QMD](/fr/concepts/memory-qmd) si vous avez besoin de reranking, d’expansion
de requête, ou si vous voulez indexer des répertoires en dehors de l’espace de travail.

Envisagez [Honcho](/fr/concepts/memory-honcho) si vous voulez une mémoire inter-session avec
une modélisation utilisateur automatique.

## Dépannage

**Recherche mémoire désactivée ?** Vérifiez `openclaw memory status`. Si aucun fournisseur n’est
détecté, définissez-en un explicitement ou ajoutez une clé API.

**Fournisseur local non détecté ?** Confirmez que le chemin local existe et exécutez :

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Les commandes CLI autonomes et le Gateway utilisent tous deux le même identifiant de fournisseur `local`.
Si le fournisseur est défini sur `auto`, les embeddings locaux ne sont pris en compte en premier
que lorsque `memorySearch.local.modelPath` pointe vers un fichier local existant.

**Résultats obsolètes ?** Exécutez `openclaw memory index --force` pour reconstruire l’index. Le watcher
peut manquer des changements dans de rares cas limites.

**sqlite-vec ne se charge pas ?** OpenClaw revient automatiquement à une similarité cosinus en processus.
Consultez les journaux pour l’erreur de chargement spécifique.

## Configuration

Pour la configuration du fournisseur d’embeddings, le réglage de la recherche hybride (poids, MMR, décroissance
temporelle), l’indexation par lots, la mémoire multimodale, sqlite-vec, les chemins supplémentaires et tous
les autres paramètres de configuration, consultez la
[référence de configuration de la mémoire](/fr/reference/memory-config).

## Connexe

- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [Recherche mémoire](/fr/concepts/memory-search)
- [Mémoire active](/fr/concepts/active-memory)
