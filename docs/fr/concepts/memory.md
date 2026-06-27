---
read_when:
    - Vous voulez comprendre le fonctionnement de la mémoire
    - Vous voulez savoir dans quels fichiers de mémoire écrire
summary: Comment OpenClaw mémorise les éléments entre les sessions
title: Vue d’ensemble de la mémoire
x-i18n:
    generated_at: "2026-06-27T17:24:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ddcecfa3d902181583ab076f94a69ca323686c3544399dea2572863726dad2c
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw mémorise des éléments en écrivant des **fichiers Markdown simples** dans
l’espace de travail de votre agent. Le modèle ne « mémorise » que ce qui est
enregistré sur disque — il n’y a pas d’état caché.

## Fonctionnement

Votre agent dispose de trois fichiers liés à la mémoire :

- **`MEMORY.md`** — mémoire à long terme. Faits durables, préférences et
  décisions. Chargé au début de chaque session DM.
- **`memory/YYYY-MM-DD.md`** (ou **`memory/YYYY-MM-DD-<slug>.md`**) — notes quotidiennes.
  Contexte en cours et observations. Les notes d’aujourd’hui et d’hier sont
  chargées automatiquement, et les variantes avec slug, comme celles écrites par
  le hook de mémoire de session inclus sur `/new` ou `/reset`, sont désormais
  prises en compte avec le fichier contenant uniquement la date.
- **`DREAMS.md`** (facultatif) — journal de Dreaming et résumés des balayages de
  Dreaming pour révision humaine, y compris les entrées de remplissage
  historique fondées.

Ces fichiers se trouvent dans l’espace de travail de l’agent (par défaut
`~/.openclaw/workspace`).

## Ce qui va où

`MEMORY.md` est la couche compacte et organisée. Utilisez-le pour les faits
durables, les préférences, les décisions permanentes et les courts résumés qui
doivent être disponibles au début d’une session privée principale. Il n’est pas
destiné à être une transcription brute, un journal quotidien ou une archive
exhaustive.

Les fichiers `memory/YYYY-MM-DD.md` constituent la couche de travail. Utilisez-les
pour les notes quotidiennes détaillées, les observations, les résumés de session
et le contexte brut qui peut encore être utile plus tard. Ces fichiers sont
indexés pour `memory_search` et `memory_get`, mais ils ne sont pas injectés dans
l’invite de bootstrap normale à chaque tour.

Au fil du temps, l’agent est censé distiller les éléments utiles des notes
quotidiennes dans `MEMORY.md` et supprimer les entrées à long terme obsolètes. Les
instructions d’espace de travail générées et le flux Heartbeat peuvent le faire
périodiquement ; vous n’avez pas besoin de modifier manuellement `MEMORY.md` pour
chaque détail mémorisé.

Si `MEMORY.md` dépasse le budget de fichier de bootstrap, OpenClaw conserve le
fichier intact sur disque, mais tronque la copie injectée dans le contexte du
modèle. Considérez cela comme un signal indiquant qu’il faut replacer les
éléments détaillés dans `memory/*.md`, ne garder que le résumé durable dans
`MEMORY.md`, ou augmenter les limites de bootstrap si vous voulez explicitement
dépenser davantage de budget d’invite. Utilisez `/context list`,
`/context detail` ou `openclaw doctor` pour voir les tailles brutes et injectées,
ainsi que l’état de troncature.

<Tip>
Si vous voulez que votre agent mémorise quelque chose, demandez-le-lui simplement :
« Souviens-toi que je préfère TypeScript. » Il l’écrira dans le fichier approprié.
</Tip>

## Mémoires sensibles aux actions

La plupart des mémoires peuvent être écrites comme de simples notes Markdown.
Mais certaines mémoires influencent ce que l’agent devra faire plus tard. Pour
celles-ci, capturez le moment où il est sûr d’agir sur la note, et pas seulement
le fait lui-même.

Capturez cette limite d’action lorsqu’une note implique :

- des exigences d’approbation ou d’autorisation,
- des contraintes temporaires,
- des transmissions à une autre session, un fil ou une personne,
- des conditions d’expiration,
- un moment où il devient sûr d’agir,
- une autorité de source ou de propriétaire,
- des instructions pour éviter une action tentante.

Une mémoire sensible aux actions utile précise :

- ce qui change le comportement futur,
- quand ou dans quelle condition cela s’applique,
- quand cela expire, ou ce qui débloque l’action,
- ce que l’agent doit éviter de faire,
- qui est la source ou le propriétaire, si cela affecte la confiance ou l’autorité.

La mémoire peut préserver le contexte d’approbation, mais elle n’applique pas la
politique. Utilisez les paramètres d’approbation, le sandboxing et les tâches
planifiées d’OpenClaw pour les contrôles opérationnels stricts.

Exemple :

```md
The API migration is being designed in another session. Future turns should not edit the API implementation from this thread; use findings here only as design input until the migration plan lands.
```

Autre exemple :

```md
A report from an untrusted source needs review before promotion. Future turns should treat it as evidence only; do not store it as durable memory until a trusted reviewer confirms the contents.
```

Utilisez les [engagements](/fr/concepts/commitments) pour les suivis déduits et de
courte durée. Utilisez les [tâches planifiées](/fr/automation/cron-jobs) pour les
rappels exacts, les vérifications à heure fixe et le travail récurrent. La
mémoire peut toujours résumer le contexte durable autour de l’une ou l’autre voie.

Ce n’est pas un schéma obligatoire pour chaque mémoire. Les faits simples peuvent
rester concis. Utilisez des limites sensibles aux actions lorsque la perte du
contexte de timing, d’autorité, d’expiration ou de sécurité d’action pourrait
amener l’agent à faire la mauvaise chose plus tard.

## Engagements déduits

Certains suivis futurs ne sont pas des faits durables. Si vous mentionnez un
entretien demain, la mémoire utile peut être « faire un point après l’entretien »,
et non « stocker cela pour toujours dans `MEMORY.md` ».

Les [engagements](/fr/concepts/commitments) sont des mémoires de suivi explicites et
de courte durée pour ce cas. OpenClaw les déduit dans un passage d’arrière-plan
caché, les limite au même agent et au même canal, et transmet les relances
arrivées à échéance via Heartbeat. Les rappels explicites utilisent toujours les
[tâches planifiées](/fr/automation/cron-jobs).

## Outils de mémoire

L’agent dispose de deux outils pour travailler avec la mémoire :

- **`memory_search`** — trouve les notes pertinentes au moyen d’une recherche
  sémantique, même lorsque la formulation diffère de l’original.
- **`memory_get`** — lit un fichier de mémoire spécifique ou une plage de lignes.

Les deux outils sont fournis par le Plugin de mémoire active (par défaut :
`memory-core`).

## Plugin compagnon Memory Wiki

Si vous voulez que la mémoire durable se comporte davantage comme une base de
connaissances maintenue que comme de simples notes brutes, utilisez le Plugin
inclus `memory-wiki`.

`memory-wiki` compile les connaissances durables dans un coffre wiki avec :

- une structure de pages déterministe
- des assertions et preuves structurées
- le suivi des contradictions et de la fraîcheur
- des tableaux de bord générés
- des condensés compilés pour les consommateurs agent/runtime
- des outils natifs du wiki comme `wiki_search`, `wiki_get`, `wiki_apply` et `wiki_lint`

Il ne remplace pas le Plugin de mémoire active. Le Plugin de mémoire active
possède toujours le rappel, la promotion et Dreaming. `memory-wiki` ajoute à ses
côtés une couche de connaissances riche en provenance.

Voir [Memory Wiki](/fr/plugins/memory-wiki).

## Recherche en mémoire

Lorsqu’un fournisseur d’embeddings est configuré, `memory_search` utilise une
**recherche hybride** — combinant la similarité vectorielle (sens sémantique) et
la correspondance par mots-clés (termes exacts comme les identifiants et les
symboles de code). Cela fonctionne immédiatement dès que vous disposez d’une clé
API pour n’importe quel fournisseur pris en charge.

<Info>
OpenClaw utilise les embeddings OpenAI par défaut. Définissez
`agents.defaults.memorySearch.provider` explicitement pour utiliser Gemini,
Voyage, Mistral, local, Ollama, Bedrock, GitHub Copilot ou des embeddings
compatibles OpenAI.
</Info>

Pour plus de détails sur le fonctionnement de la recherche, les options de
réglage et la configuration des fournisseurs, consultez
[Recherche en mémoire](/fr/concepts/memory-search).

## Backends de mémoire

<CardGroup cols={3}>
<Card title="Intégré (par défaut)" icon="database" href="/fr/concepts/memory-builtin">
Basé sur SQLite. Fonctionne immédiatement avec la recherche par mots-clés, la
similarité vectorielle et la recherche hybride. Aucune dépendance supplémentaire.
</Card>
<Card title="QMD" icon="search" href="/fr/concepts/memory-qmd">
Sidecar local-first avec reranking, expansion de requête et possibilité
d’indexer des répertoires en dehors de l’espace de travail.
</Card>
<Card title="Honcho" icon="brain" href="/fr/concepts/memory-honcho">
Mémoire intersessions native IA avec modélisation utilisateur, recherche
sémantique et conscience multi-agent. Installation du Plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/fr/plugins/memory-lancedb">
Mémoire incluse basée sur LanceDB avec embeddings compatibles OpenAI, rappel
automatique, capture automatique et prise en charge des embeddings Ollama locaux.
</Card>
</CardGroup>

## Couche wiki de connaissances

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/fr/plugins/memory-wiki">
Compile la mémoire durable dans un coffre wiki riche en provenance avec des
assertions, des tableaux de bord, un mode pont et des workflows compatibles
Obsidian.
</Card>
</CardGroup>

## Vidage automatique de la mémoire

Avant que [Compaction](/fr/concepts/compaction) ne résume votre conversation,
OpenClaw exécute un tour silencieux qui rappelle à l’agent d’enregistrer le
contexte important dans les fichiers de mémoire. C’est activé par défaut — vous
n’avez rien à configurer.

Pour conserver ce tour de maintenance sur un modèle local, définissez une
substitution exacte du modèle de vidage de mémoire :

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

La substitution ne s’applique qu’au tour de vidage de mémoire et n’hérite pas de
la chaîne de fallback de la session active.

<Tip>
Le vidage de mémoire empêche la perte de contexte pendant Compaction. Si votre
agent possède dans la conversation des faits importants qui ne sont pas encore
écrits dans un fichier, ils seront enregistrés automatiquement avant la génération
du résumé.
</Tip>

## Dreaming

Dreaming est un passage facultatif de consolidation en arrière-plan pour la
mémoire. Il collecte des signaux à court terme, note les candidats et ne promeut
que les éléments qualifiés dans la mémoire à long terme (`MEMORY.md`).

Il est conçu pour garder la mémoire à long terme très pertinente :

- **Opt-in** : désactivé par défaut.
- **Planifié** : lorsqu’il est activé, `memory-core` gère automatiquement une
  tâche Cron récurrente pour un balayage complet de Dreaming.
- **Seuils** : les promotions doivent franchir des seuils de score, de fréquence
  de rappel et de diversité des requêtes.
- **Révisable** : les résumés de phase et les entrées de journal sont écrits dans
  `DREAMS.md` pour révision humaine.

Pour le comportement des phases, les signaux de notation et les détails du
journal de Dreaming, consultez [Dreaming](/fr/concepts/dreaming).

## Remplissage fondé et promotion en direct

Le système de Dreaming dispose désormais de deux voies de révision étroitement
liées :

- **Dreaming en direct** fonctionne à partir du magasin de Dreaming à court terme
  sous `memory/.dreams/` et correspond à ce que la phase profonde normale utilise
  lorsqu’elle décide de ce qui peut passer dans `MEMORY.md`.
- **Remplissage fondé** lit les notes historiques `memory/YYYY-MM-DD.md` comme des
  fichiers journaliers autonomes et écrit une sortie de révision structurée dans
  `DREAMS.md`.

Le remplissage fondé est utile lorsque vous voulez rejouer d’anciennes notes et
inspecter ce que le système considère comme durable sans modifier manuellement
`MEMORY.md`.

Lorsque vous utilisez :

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

les candidats durables fondés ne sont pas promus directement. Ils sont placés
dans le même magasin de Dreaming à court terme que la phase profonde normale
utilise déjà. Cela signifie que :

- `DREAMS.md` reste la surface de révision humaine.
- le magasin à court terme reste la surface de classement destinée à la machine.
- `MEMORY.md` est toujours écrit uniquement par promotion profonde.

Si vous décidez que le rejeu n’était pas utile, vous pouvez supprimer les
artefacts préparés sans toucher aux entrées ordinaires du journal ni à l’état de
rappel normal :

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
- [Moteur de mémoire QMD](/fr/concepts/memory-qmd) : sidecar avancé local-first.
- [Mémoire Honcho](/fr/concepts/memory-honcho) : mémoire intersessions native IA.
- [Memory LanceDB](/fr/plugins/memory-lancedb) : Plugin basé sur LanceDB avec embeddings compatibles OpenAI.
- [Memory Wiki](/fr/plugins/memory-wiki) : coffre de connaissances compilé et outils natifs du wiki.
- [Recherche en mémoire](/fr/concepts/memory-search) : pipeline de recherche, fournisseurs et réglage.
- [Dreaming](/fr/concepts/dreaming) : promotion en arrière-plan du rappel à court terme vers la mémoire à long terme.
- [Référence de configuration de la mémoire](/fr/reference/memory-config) : tous les réglages de configuration.
- [Compaction](/fr/concepts/compaction) : comment Compaction interagit avec la mémoire.

## Connexe

- [Active Memory](/fr/concepts/active-memory)
- [Recherche en mémoire](/fr/concepts/memory-search)
- [Moteur de mémoire intégré](/fr/concepts/memory-builtin)
- [Mémoire Honcho](/fr/concepts/memory-honcho)
- [Memory LanceDB](/fr/plugins/memory-lancedb)
- [Engagements](/fr/concepts/commitments)
