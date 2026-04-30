---
read_when:
    - Vous voulez comprendre le backend de mémoire par défaut
    - Vous souhaitez configurer des fournisseurs d’embeddings ou la recherche hybride
summary: Le backend de mémoire par défaut basé sur SQLite, avec recherche par mots-clés, vectorielle et hybride
title: Moteur de mémoire intégré
x-i18n:
    generated_at: "2026-04-30T07:21:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: aa1597a9a49a6f1124cedf49f6f5a4c336f76dd5998ced246affb9c2e8171f05
    source_path: concepts/memory-builtin.md
    workflow: 16
---

Le moteur intégré est le backend de mémoire par défaut. Il stocke votre index de mémoire dans
une base de données SQLite propre à chaque agent et ne nécessite aucune dépendance supplémentaire pour démarrer.

## Ce qu’il fournit

- **Recherche par mot-clé** via l’indexation plein texte FTS5 (score BM25).
- **Recherche vectorielle** via les embeddings de tout fournisseur pris en charge.
- **Recherche hybride** qui combine les deux pour obtenir les meilleurs résultats.
- **Prise en charge CJK** via la tokenisation par trigrammes pour le chinois, le japonais et le coréen.
- **Accélération sqlite-vec** pour les requêtes vectorielles en base de données (facultatif).

## Bien démarrer

Si vous disposez d’une clé API pour OpenAI, Gemini, Voyage, Mistral ou DeepInfra, le moteur
intégré la détecte automatiquement et active la recherche vectorielle. Aucune configuration n’est nécessaire.

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

Sans fournisseur d’embeddings, seule la recherche par mot-clé est disponible.

Pour forcer le fournisseur d’embeddings local intégré, installez le paquet d’exécution facultatif
`node-llama-cpp` à côté d’OpenClaw, puis faites pointer `local.modelPath`
vers un fichier GGUF :

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

| Fournisseur | ID          | Détecté automatiquement | Notes                                      |
| ----------- | ----------- | ----------------------- | ------------------------------------------ |
| OpenAI      | `openai`    | Oui                     | Par défaut : `text-embedding-3-small`      |
| Gemini      | `gemini`    | Oui                     | Prend en charge le multimodal (image + audio) |
| Voyage      | `voyage`    | Oui                     |                                            |
| Mistral     | `mistral`   | Oui                     |                                            |
| DeepInfra   | `deepinfra` | Oui                     | Par défaut : `BAAI/bge-m3`                 |
| Ollama      | `ollama`    | Non                     | Local, à définir explicitement             |
| Local       | `local`     | Oui (en premier)        | Runtime facultatif `node-llama-cpp`        |

La détection automatique choisit le premier fournisseur dont la clé API peut être résolue, dans
l’ordre indiqué. Définissez `memorySearch.provider` pour remplacer ce comportement.

## Fonctionnement de l’indexation

OpenClaw indexe `MEMORY.md` et `memory/*.md` en fragments (~400 tokens avec
80 tokens de chevauchement) et les stocke dans une base de données SQLite propre à chaque agent.

- **Emplacement de l’index :** `~/.openclaw/memory/<agentId>.sqlite`
- **Maintenance du stockage :** les fichiers annexes SQLite WAL sont limités par des checkpoints périodiques et
  à l’arrêt.
- **Surveillance des fichiers :** les modifications des fichiers de mémoire déclenchent une réindexation temporisée (1,5 s).
- **Réindexation automatique :** lorsque le fournisseur d’embeddings, le modèle ou la configuration de découpage
  change, l’index entier est reconstruit automatiquement.
- **Réindexation à la demande :** `openclaw memory index --force`

<Info>
Vous pouvez également indexer des fichiers Markdown en dehors de l’espace de travail avec
`memorySearch.extraPaths`. Consultez la
[référence de configuration](/fr/reference/memory-config#additional-memory-paths).
</Info>

## Quand l’utiliser

Le moteur intégré est le bon choix pour la plupart des utilisateurs :

- Fonctionne immédiatement sans dépendances supplémentaires.
- Gère bien la recherche par mot-clé et la recherche vectorielle.
- Prend en charge tous les fournisseurs d’embeddings.
- La recherche hybride combine le meilleur des deux approches de récupération.

Envisagez de passer à [QMD](/fr/concepts/memory-qmd) si vous avez besoin de reranking, d’expansion
de requête ou si vous voulez indexer des répertoires en dehors de l’espace de travail.

Envisagez [Honcho](/fr/concepts/memory-honcho) si vous voulez une mémoire intersessions avec
modélisation automatique de l’utilisateur.

## Dépannage

**Recherche de mémoire désactivée ?** Vérifiez `openclaw memory status`. Si aucun fournisseur n’est
détecté, définissez-en un explicitement ou ajoutez une clé API.

**Fournisseur local non détecté ?** Vérifiez que le chemin local existe et exécutez :

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Les commandes CLI autonomes et le Gateway utilisent le même id de fournisseur `local`.
Si le fournisseur est défini sur `auto`, les embeddings locaux sont pris en compte en premier uniquement
lorsque `memorySearch.local.modelPath` pointe vers un fichier local existant.

**Résultats obsolètes ?** Exécutez `openclaw memory index --force` pour reconstruire. L’observateur
peut manquer des modifications dans de rares cas limites.

**sqlite-vec ne se charge pas ?** OpenClaw revient automatiquement à la similarité cosinus
en cours de processus. Consultez les journaux pour connaître l’erreur de chargement spécifique.

## Configuration

Pour la configuration du fournisseur d’embeddings, le réglage de la recherche hybride (poids, MMR, déclin
temporel), l’indexation par lots, la mémoire multimodale, sqlite-vec, les chemins supplémentaires et tous
les autres paramètres de configuration, consultez la
[référence de configuration de la mémoire](/fr/reference/memory-config).

## Liens associés

- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [Recherche de mémoire](/fr/concepts/memory-search)
- [Active Memory](/fr/concepts/active-memory)
