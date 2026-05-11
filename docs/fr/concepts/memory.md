---
read_when:
    - Vous voulez comprendre le fonctionnement de la mémoire
    - Vous voulez savoir quels fichiers de mémoire écrire
summary: Comment OpenClaw se souvient des informations d’une session à l’autre
title: Présentation de la mémoire
x-i18n:
    generated_at: "2026-05-11T20:31:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef7a67b06615897167d7aac8a9f52fe7df9eee86f5d8d1504291ec750e674833
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw se souvient des éléments en écrivant des **fichiers Markdown simples** dans l’espace de travail de votre agent. Le modèle ne « se souvient » que de ce qui est enregistré sur le disque : il n’y a aucun état caché.

## Fonctionnement

Votre agent dispose de trois fichiers liés à la mémoire :

- **`MEMORY.md`** — mémoire à long terme. Faits durables, préférences et décisions. Chargé au début de chaque session en message privé.
- **`memory/YYYY-MM-DD.md`** — notes quotidiennes. Contexte courant et observations. Les notes d’aujourd’hui et d’hier sont chargées automatiquement.
- **`DREAMS.md`** (facultatif) — journal de Dreaming et résumés des balayages de dreaming pour relecture humaine, y compris les entrées historiques de rattrapage fondées.

Ces fichiers se trouvent dans l’espace de travail de l’agent (par défaut `~/.openclaw/workspace`).

## Où placer quoi

`MEMORY.md` est la couche compacte et organisée. Utilisez-le pour les faits durables, les préférences, les décisions permanentes et les résumés courts qui doivent être disponibles au début d’une session privée principale. Il n’est pas destiné à être une transcription brute, un journal quotidien ou une archive exhaustive.

Les fichiers `memory/YYYY-MM-DD.md` sont la couche de travail. Utilisez-les pour les notes quotidiennes détaillées, les observations, les résumés de session et le contexte brut qui peut encore être utile plus tard. Ces fichiers sont indexés pour `memory_search` et `memory_get`, mais ils ne sont pas injectés dans l’invite d’amorçage normale à chaque tour.

Au fil du temps, l’agent est censé extraire les éléments utiles des notes quotidiennes vers `MEMORY.md` et supprimer les entrées à long terme obsolètes. Les instructions d’espace de travail générées et le flux Heartbeat peuvent le faire périodiquement ; vous n’avez pas besoin de modifier manuellement `MEMORY.md` pour chaque détail mémorisé.

Si `MEMORY.md` dépasse le budget du fichier d’amorçage, OpenClaw conserve le fichier intact sur le disque, mais tronque la copie injectée dans le contexte du modèle. Considérez cela comme un signal indiquant qu’il faut replacer les éléments détaillés dans `memory/*.md`, ne conserver que le résumé durable dans `MEMORY.md`, ou augmenter les limites d’amorçage si vous souhaitez explicitement consacrer davantage de budget d’invite. Utilisez `/context list`, `/context detail` ou `openclaw doctor` pour voir les tailles brutes et injectées, ainsi que l’état de troncature.

<Tip>
Si vous voulez que votre agent se souvienne de quelque chose, demandez-le-lui simplement : « Souviens-toi que je préfère TypeScript. » Il l’écrira dans le fichier approprié.
</Tip>

## Engagements déduits

Certains suivis futurs ne sont pas des faits durables. Si vous mentionnez un entretien demain, la mémoire utile peut être « faire un point après l’entretien », et non « stocker ceci pour toujours dans `MEMORY.md` ».

Les [engagements](/fr/concepts/commitments) sont des mémoires de suivi facultatives et de courte durée pour ce cas. OpenClaw les déduit dans une passe d’arrière-plan cachée, les limite au même agent et au même canal, et transmet les points de suivi échus via Heartbeat. Les rappels explicites utilisent toujours les [tâches planifiées](/fr/automation/cron-jobs).

## Outils de mémoire

L’agent dispose de deux outils pour travailler avec la mémoire :

- **`memory_search`** — trouve les notes pertinentes à l’aide d’une recherche sémantique, même lorsque la formulation diffère de l’original.
- **`memory_get`** — lit un fichier mémoire spécifique ou une plage de lignes.

Les deux outils sont fournis par le plugin de mémoire active (par défaut : `memory-core`).

## Plugin compagnon Memory Wiki

Si vous voulez que la mémoire durable se comporte davantage comme une base de connaissances maintenue que comme de simples notes brutes, utilisez le plugin intégré `memory-wiki`.

`memory-wiki` compile les connaissances durables dans un coffre wiki avec :

- une structure de pages déterministe
- des affirmations et preuves structurées
- le suivi des contradictions et de la fraîcheur
- des tableaux de bord générés
- des condensés compilés pour les consommateurs agent/runtime
- des outils natifs du wiki comme `wiki_search`, `wiki_get`, `wiki_apply` et `wiki_lint`

Il ne remplace pas le plugin de mémoire active. Le plugin de mémoire active reste responsable du rappel, de la promotion et du Dreaming. `memory-wiki` ajoute à côté une couche de connaissances riche en provenance.

Voir [Memory Wiki](/fr/plugins/memory-wiki).

## Recherche en mémoire

Lorsqu’un fournisseur d’embeddings est configuré, `memory_search` utilise une **recherche hybride** : elle combine la similarité vectorielle (sens sémantique) avec la correspondance par mots-clés (termes exacts comme les identifiants et les symboles de code). Cela fonctionne immédiatement dès que vous disposez d’une clé d’API pour un fournisseur pris en charge.

<Info>
OpenClaw détecte automatiquement votre fournisseur d’embeddings à partir des clés d’API disponibles. Si vous avez configuré une clé OpenAI, Gemini, Voyage ou Mistral, la recherche en mémoire est activée automatiquement.
</Info>

Pour plus de détails sur le fonctionnement de la recherche, les options de réglage et la configuration des fournisseurs, consultez [Recherche en mémoire](/fr/concepts/memory-search).

## Backends de mémoire

<CardGroup cols={3}>
<Card title="Intégré (par défaut)" icon="database" href="/fr/concepts/memory-builtin">
Basé sur SQLite. Fonctionne immédiatement avec la recherche par mots-clés, la similarité vectorielle et la recherche hybride. Aucune dépendance supplémentaire.
</Card>
<Card title="QMD" icon="search" href="/fr/concepts/memory-qmd">
Sidecar local-first avec reranking, expansion de requête et capacité d’indexer des répertoires hors de l’espace de travail.
</Card>
<Card title="Honcho" icon="brain" href="/fr/concepts/memory-honcho">
Mémoire intersessions native IA avec modélisation utilisateur, recherche sémantique et conscience multi-agent. Installation de plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/fr/plugins/memory-lancedb">
Mémoire intégrée basée sur LanceDB avec embeddings compatibles OpenAI, rappel automatique, capture automatique et prise en charge des embeddings Ollama locaux.
</Card>
</CardGroup>

## Couche wiki de connaissances

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/fr/plugins/memory-wiki">
Compile la mémoire durable dans un coffre wiki riche en provenance, avec affirmations, tableaux de bord, mode pont et workflows compatibles avec Obsidian.
</Card>
</CardGroup>

## Vidage automatique de la mémoire

Avant que la [Compaction](/fr/concepts/compaction) ne résume votre conversation, OpenClaw exécute un tour silencieux qui rappelle à l’agent d’enregistrer le contexte important dans les fichiers de mémoire. Cette fonction est activée par défaut : vous n’avez rien à configurer.

Pour conserver ce tour de maintenance sur un modèle local, définissez un remplacement exact du modèle de vidage de mémoire :

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

Le remplacement s’applique uniquement au tour de vidage de mémoire et n’hérite pas de la chaîne de fallback de la session active.

<Tip>
Le vidage de mémoire empêche la perte de contexte pendant la Compaction. Si votre agent contient dans la conversation des faits importants qui ne sont pas encore écrits dans un fichier, ils seront enregistrés automatiquement avant le résumé.
</Tip>

## Dreaming

Dreaming est une passe facultative de consolidation en arrière-plan pour la mémoire. Elle collecte les signaux à court terme, note les candidats et ne promeut dans la mémoire à long terme (`MEMORY.md`) que les éléments qualifiés.

Elle est conçue pour garder une mémoire à long terme à fort signal :

- **Activation explicite** : désactivée par défaut.
- **Planifiée** : lorsqu’elle est activée, `memory-core` gère automatiquement une tâche Cron récurrente pour un balayage complet de Dreaming.
- **Avec seuils** : les promotions doivent passer des seuils de score, de fréquence de rappel et de diversité des requêtes.
- **Vérifiable** : les résumés de phase et les entrées de journal sont écrits dans `DREAMS.md` pour relecture humaine.

Pour le comportement des phases, les signaux de score et les détails du journal de Dreaming, consultez [Dreaming](/fr/concepts/dreaming).

## Rattrapage fondé et promotion en direct

Le système de Dreaming dispose désormais de deux voies de revue étroitement liées :

- **Dreaming en direct** fonctionne à partir du magasin de Dreaming à court terme sous `memory/.dreams/` et correspond à ce que la phase profonde normale utilise pour décider ce qui peut être promu dans `MEMORY.md`.
- **Rattrapage fondé** lit les notes historiques `memory/YYYY-MM-DD.md` comme des fichiers journaliers autonomes et écrit une sortie de revue structurée dans `DREAMS.md`.

Le rattrapage fondé est utile lorsque vous voulez rejouer d’anciennes notes et inspecter ce que le système considère comme durable sans modifier manuellement `MEMORY.md`.

Lorsque vous utilisez :

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

les candidats durables fondés ne sont pas promus directement. Ils sont placés en attente dans le même magasin de Dreaming à court terme que la phase profonde normale utilise déjà. Cela signifie que :

- `DREAMS.md` reste la surface de revue humaine.
- le magasin à court terme reste la surface de classement orientée machine.
- `MEMORY.md` n’est toujours écrit que par la promotion profonde.

Si vous décidez que la relecture n’a pas été utile, vous pouvez supprimer les artefacts placés en attente sans toucher aux entrées ordinaires du journal ni à l’état normal de rappel :

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Check index status and provider
openclaw memory search "query"  # Search from the command line
openclaw memory index --force   # Rebuild the index
```

## Pour aller plus loin

- [Moteur de mémoire intégré](/fr/concepts/memory-builtin) : backend SQLite par défaut.
- [Moteur de mémoire QMD](/fr/concepts/memory-qmd) : sidecar local-first avancé.
- [Mémoire Honcho](/fr/concepts/memory-honcho) : mémoire intersessions native IA.
- [Memory LanceDB](/fr/plugins/memory-lancedb) : plugin basé sur LanceDB avec embeddings compatibles OpenAI.
- [Memory Wiki](/fr/plugins/memory-wiki) : coffre de connaissances compilé et outils natifs du wiki.
- [Recherche en mémoire](/fr/concepts/memory-search) : pipeline de recherche, fournisseurs et réglages.
- [Dreaming](/fr/concepts/dreaming) : promotion en arrière-plan du rappel à court terme vers la mémoire à long terme.
- [Référence de configuration de la mémoire](/fr/reference/memory-config) : tous les paramètres de configuration.
- [Compaction](/fr/concepts/compaction) : comment la Compaction interagit avec la mémoire.

## Associé

- [Active Memory](/fr/concepts/active-memory)
- [Recherche en mémoire](/fr/concepts/memory-search)
- [Moteur de mémoire intégré](/fr/concepts/memory-builtin)
- [Mémoire Honcho](/fr/concepts/memory-honcho)
- [Memory LanceDB](/fr/plugins/memory-lancedb)
- [Engagements](/fr/concepts/commitments)
