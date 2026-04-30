---
read_when:
    - Vous voulez comprendre le fonctionnement de la mémoire
    - Vous voulez savoir quels fichiers de mémoire écrire
summary: Comment OpenClaw mémorise les informations d’une session à l’autre
title: Vue d’ensemble de la mémoire
x-i18n:
    generated_at: "2026-04-30T07:21:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: ecf6cf2c95ce3ee78d62923e795f16957088f0eb6620ed50647cff05b99bd572
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw se souvient des éléments en écrivant des **fichiers Markdown simples** dans l'espace de travail de votre agent. Le modèle ne « se souvient » que de ce qui est enregistré sur le disque — il n'existe aucun état caché.

## Fonctionnement

Votre agent dispose de trois fichiers liés à la mémoire :

- **`MEMORY.md`** — mémoire à long terme. Faits durables, préférences et décisions. Chargé au début de chaque session DM.
- **`memory/YYYY-MM-DD.md`** — notes quotidiennes. Contexte en cours et observations. Les notes d'aujourd'hui et d'hier sont chargées automatiquement.
- **`DREAMS.md`** (facultatif) — journal Dream Diary et résumés des balayages de dreaming pour revue humaine, y compris les entrées de backfill historique ancrées dans les faits.

Ces fichiers résident dans l'espace de travail de l'agent (par défaut `~/.openclaw/workspace`).

<Tip>
Si vous voulez que votre agent se souvienne de quelque chose, demandez-le-lui simplement : « Souviens-toi que je préfère TypeScript. » Il l'écrira dans le fichier approprié.
</Tip>

## Engagements inférés

Certains suivis futurs ne sont pas des faits durables. Si vous mentionnez un entretien demain, le souvenir utile peut être « faire un point après l'entretien », et non « conserver ceci pour toujours dans `MEMORY.md` ».

Les [engagements](/fr/concepts/commitments) sont des souvenirs de suivi facultatifs et de courte durée pour ce cas. OpenClaw les infère lors d'une passe d'arrière-plan cachée, les limite au même agent et au même canal, et livre les points de suivi arrivés à échéance via heartbeat. Les rappels explicites utilisent toujours les [tâches planifiées](/fr/automation/cron-jobs).

## Outils de mémoire

L'agent dispose de deux outils pour travailler avec la mémoire :

- **`memory_search`** — trouve les notes pertinentes à l'aide d'une recherche sémantique, même lorsque la formulation diffère de l'original.
- **`memory_get`** — lit un fichier mémoire spécifique ou une plage de lignes.

Les deux outils sont fournis par le plugin de mémoire active (par défaut : `memory-core`).

## Plugin compagnon Memory Wiki

Si vous voulez qu'une mémoire durable se comporte davantage comme une base de connaissances maintenue que comme de simples notes brutes, utilisez le plugin intégré `memory-wiki`.

`memory-wiki` compile les connaissances durables dans un coffre wiki avec :

- une structure de pages déterministe
- des affirmations et preuves structurées
- le suivi des contradictions et de la fraîcheur
- des tableaux de bord générés
- des résumés compilés pour les consommateurs agent/runtime
- des outils natifs du wiki comme `wiki_search`, `wiki_get`, `wiki_apply` et `wiki_lint`

Il ne remplace pas le plugin de mémoire active. Le plugin de mémoire active reste responsable du rappel, de la promotion et du dreaming. `memory-wiki` ajoute à côté une couche de connaissances riche en provenance.

Consultez [Memory Wiki](/fr/plugins/memory-wiki).

## Recherche mémoire

Lorsqu'un fournisseur d'embeddings est configuré, `memory_search` utilise la **recherche hybride** — en combinant la similarité vectorielle (signification sémantique) avec la correspondance par mots-clés (termes exacts comme les identifiants et les symboles de code). Cela fonctionne immédiatement dès que vous disposez d'une clé API pour n'importe quel fournisseur pris en charge.

<Info>
OpenClaw détecte automatiquement votre fournisseur d'embeddings à partir des clés API disponibles. Si vous avez configuré une clé OpenAI, Gemini, Voyage ou Mistral, la recherche mémoire est activée automatiquement.
</Info>

Pour plus de détails sur le fonctionnement de la recherche, les options de réglage et la configuration des fournisseurs, consultez [Recherche mémoire](/fr/concepts/memory-search).

## Backends de mémoire

<CardGroup cols={3}>
<Card title="Intégré (par défaut)" icon="database" href="/fr/concepts/memory-builtin">
Basé sur SQLite. Fonctionne immédiatement avec la recherche par mots-clés, la similarité vectorielle et la recherche hybride. Aucune dépendance supplémentaire.
</Card>
<Card title="QMD" icon="search" href="/fr/concepts/memory-qmd">
Sidecar local-first avec reranking, expansion de requête et possibilité d'indexer des répertoires en dehors de l'espace de travail.
</Card>
<Card title="Honcho" icon="brain" href="/fr/concepts/memory-honcho">
Mémoire intersessions native pour l'IA avec modélisation utilisateur, recherche sémantique et conscience multi-agent. Installation de plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/fr/plugins/memory-lancedb">
Mémoire intégrée adossée à LanceDB avec embeddings compatibles OpenAI, rappel automatique, capture automatique et prise en charge des embeddings Ollama locaux.
</Card>
</CardGroup>

## Couche wiki de connaissances

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/fr/plugins/memory-wiki">
Compile la mémoire durable dans un coffre wiki riche en provenance avec affirmations, tableaux de bord, mode pont et workflows compatibles Obsidian.
</Card>
</CardGroup>

## Vidage automatique de la mémoire

Avant que la [Compaction](/fr/concepts/compaction) ne résume votre conversation, OpenClaw exécute un tour silencieux qui rappelle à l'agent d'enregistrer le contexte important dans les fichiers mémoire. C'est activé par défaut — vous n'avez rien à configurer.

Pour garder ce tour d'entretien sur un modèle local, définissez une surcharge exacte du modèle de vidage de mémoire :

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

La surcharge s'applique uniquement au tour de vidage de mémoire et n'hérite pas de la chaîne de fallback de la session active.

<Tip>
Le vidage de mémoire évite la perte de contexte pendant la Compaction. Si votre agent dispose dans la conversation de faits importants qui ne sont pas encore écrits dans un fichier, ils seront enregistrés automatiquement avant la génération du résumé.
</Tip>

## Dreaming

Dreaming est une passe de consolidation d'arrière-plan facultative pour la mémoire. Il collecte les signaux à court terme, attribue un score aux candidats et ne promeut dans la mémoire à long terme (`MEMORY.md`) que les éléments qualifiés.

Il est conçu pour conserver une mémoire à long terme très pertinente :

- **Facultatif** : désactivé par défaut.
- **Planifié** : lorsqu'il est activé, `memory-core` gère automatiquement une tâche cron récurrente pour un balayage complet de dreaming.
- **À seuils** : les promotions doivent passer les seuils de score, de fréquence de rappel et de diversité des requêtes.
- **Révisable** : les résumés de phase et les entrées de journal sont écrits dans `DREAMS.md` pour revue humaine.

Pour le comportement des phases, les signaux de scoring et les détails du Dream Diary, consultez [Dreaming](/fr/concepts/dreaming).

## Backfill ancré dans les faits et promotion en direct

Le système de dreaming dispose désormais de deux voies de revue étroitement liées :

- **Live dreaming** fonctionne à partir du magasin de dreaming à court terme sous `memory/.dreams/` et correspond à ce que la phase profonde normale utilise pour décider de ce qui peut passer dans `MEMORY.md`.
- **Grounded backfill** lit les notes historiques `memory/YYYY-MM-DD.md` comme fichiers journaliers autonomes et écrit une sortie de revue structurée dans `DREAMS.md`.

Grounded backfill est utile lorsque vous voulez rejouer d'anciennes notes et inspecter ce que le système considère durable sans modifier manuellement `MEMORY.md`.

Lorsque vous utilisez :

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

les candidats durables ancrés dans les faits ne sont pas promus directement. Ils sont mis en attente dans le même magasin de dreaming à court terme que la phase profonde normale utilise déjà. Cela signifie que :

- `DREAMS.md` reste la surface de revue humaine.
- le magasin à court terme reste la surface de classement destinée à la machine.
- `MEMORY.md` n'est toujours écrit que par la promotion profonde.

Si vous décidez que le rejeu n'était pas utile, vous pouvez supprimer les artefacts mis en attente sans toucher aux entrées de journal ordinaires ni à l'état normal de rappel :

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
- [Mémoire Honcho](/fr/concepts/memory-honcho) : mémoire intersessions native pour l'IA.
- [Memory LanceDB](/fr/plugins/memory-lancedb) : plugin adossé à LanceDB avec embeddings compatibles OpenAI.
- [Memory Wiki](/fr/plugins/memory-wiki) : coffre de connaissances compilé et outils natifs du wiki.
- [Recherche mémoire](/fr/concepts/memory-search) : pipeline de recherche, fournisseurs et réglages.
- [Dreaming](/fr/concepts/dreaming) : promotion d'arrière-plan depuis le rappel à court terme vers la mémoire à long terme.
- [Référence de configuration de la mémoire](/fr/reference/memory-config) : tous les paramètres de configuration.
- [Compaction](/fr/concepts/compaction) : comment la Compaction interagit avec la mémoire.

## Connexe

- [Active Memory](/fr/concepts/active-memory)
- [Recherche mémoire](/fr/concepts/memory-search)
- [Moteur de mémoire intégré](/fr/concepts/memory-builtin)
- [Mémoire Honcho](/fr/concepts/memory-honcho)
- [Memory LanceDB](/fr/plugins/memory-lancedb)
- [Engagements](/fr/concepts/commitments)
