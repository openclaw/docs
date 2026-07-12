---
read_when:
    - Vous souhaitez comprendre le fonctionnement de la mémoire
    - Vous voulez savoir dans quels fichiers de mémoire écrire
summary: Comment OpenClaw mémorise des informations d’une session à l’autre
title: Vue d’ensemble de la mémoire
x-i18n:
    generated_at: "2026-07-12T15:13:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c77d71dd6b1916b923fbf72c373f20128c4f604f96cc76150ea27e0f13a541f8
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw mémorise des éléments en écrivant des fichiers Markdown simples dans
l’espace de travail de votre agent (par défaut `~/.openclaw/workspace`). Le modèle
ne mémorise que ce qui est enregistré sur le disque ; il n’existe aucun état caché.

## Fonctionnement

Votre agent dispose de trois fichiers liés à la mémoire :

- **`MEMORY.md`** — mémoire à long terme. Faits durables, préférences et
  décisions. Chargé au début d’une session.
- **`memory/YYYY-MM-DD.md`** (ou `memory/YYYY-MM-DD-<slug>.md`) — notes quotidiennes.
  Contexte en cours et observations. Les notes datées d’aujourd’hui et d’hier sont
  chargées automatiquement lors d’une simple commande `/new` ou `/reset` ; les variantes
  avec slug, comme celles écrites par le hook de mémoire de session intégré, sont
  récupérées avec le fichier contenant uniquement la date.
- **`DREAMS.md`** (facultatif) — journal des rêves et résumés des cycles de Dreaming
  destinés à une révision humaine, y compris les entrées de reconstitution historique
  fondées sur des données vérifiables.

<Tip>
Si vous souhaitez que votre agent mémorise quelque chose, demandez-le-lui simplement :
« Mémorisez que je préfère TypeScript. » Il écrit la note dans le fichier approprié.
</Tip>

## Répartition du contenu

`MEMORY.md` constitue la couche compacte et organisée : faits durables, préférences,
décisions permanentes et courts résumés qui doivent être disponibles au début d’une
session. Il ne s’agit ni d’une transcription brute, ni d’un journal quotidien, ni
d’une archive exhaustive.

Les fichiers `memory/YYYY-MM-DD.md` constituent la couche de travail : notes quotidiennes
détaillées, observations, résumés de sessions et contexte brut susceptible de rester
utile par la suite. Ils sont indexés pour `memory_search` et `memory_get`, mais ne sont
pas injectés dans le prompt d’amorçage à chaque tour.

Au fil du temps, l’agent extrait les informations utiles des notes quotidiennes pour les
placer dans `MEMORY.md` et supprime les entrées à long terme devenues obsolètes. Les
instructions générées pour l’espace de travail et le flux Heartbeat effectuent cette
opération périodiquement ; vous n’avez pas besoin de modifier manuellement `MEMORY.md`
pour chaque détail.

Si `MEMORY.md` dépasse le budget alloué aux fichiers d’amorçage, OpenClaw conserve le
fichier intact sur le disque, mais tronque la copie injectée dans le contexte.
Considérez cela comme un signal indiquant qu’il faut déplacer les informations détaillées
vers `memory/*.md`, ne conserver qu’un résumé durable dans `MEMORY.md`, ou augmenter les
limites d’amorçage si vous souhaitez consacrer davantage de budget de prompt. Utilisez
`/context list`, `/context detail` ou `openclaw doctor` pour consulter les tailles brutes
et injectées ainsi que l’état de la troncature.

## Mémoires sensibles aux actions

La plupart des mémoires sont de simples notes Markdown. Certaines influencent ce que
l’agent devra faire ultérieurement ; pour celles-ci, consignez le moment où il est sûr
d’agir en fonction de la note, et pas seulement le fait lui-même.

Consignez cette limite d’action lorsqu’une note concerne :

- des exigences d’approbation ou d’autorisation,
- des contraintes temporaires,
- des transferts vers une autre session, un autre fil ou une autre personne,
- des conditions d’expiration,
- le moment où il est sûr d’agir,
- l’autorité de la source ou du propriétaire,
- des instructions visant à éviter une action tentante.

Une mémoire sensible aux actions utile précise clairement :

- ce qui modifie le comportement futur,
- quand ou sous quelle condition cela s’applique,
- quand cela expire ou ce qui autorise l’action,
- ce que l’agent doit éviter de faire,
- qui est la source ou le propriétaire, si cela influe sur la confiance ou l’autorité.

La mémoire peut conserver le contexte d’une approbation, mais elle n’applique pas les
règles. Utilisez les paramètres d’approbation d’OpenClaw, le sandboxing et les tâches
planifiées pour les contrôles opérationnels stricts.

Exemple :

```md
La migration de l’API est en cours de conception dans une autre session. Les prochains
tours ne doivent pas modifier l’implémentation de l’API depuis ce fil ; utilisez les
conclusions présentées ici uniquement comme données de conception jusqu’à ce que le
plan de migration soit adopté.
```

Autre exemple :

```md
Un rapport provenant d’une source non fiable doit être examiné avant d’être promu. Les
prochains tours doivent le traiter uniquement comme un élément de preuve ; ne le
stockez pas comme mémoire durable tant qu’un réviseur de confiance n’a pas confirmé
son contenu.
```

Il ne s’agit pas d’un schéma obligatoire pour chaque mémoire ; les faits simples peuvent
rester concis. Utilisez des limites sensibles aux actions lorsque la perte du contexte
temporel, de l’autorité, de l’expiration ou du moment où il est sûr d’agir pourrait
conduire l’agent à effectuer ultérieurement une action inappropriée.

Utilisez les [engagements](/fr/concepts/commitments) pour les suivis déduits et de courte
durée. Utilisez les [tâches planifiées](/fr/automation/cron-jobs) pour les rappels précis,
les vérifications temporisées et les travaux récurrents. La mémoire peut tout de même
résumer le contexte durable associé à l’un ou l’autre de ces mécanismes.

## Engagements déduits

Certains suivis futurs ne sont pas des faits durables. Si vous mentionnez un entretien
demain, la mémoire utile peut être « prendre des nouvelles après l’entretien », plutôt
que « conserver cela pour toujours dans `MEMORY.md` ».

Les [engagements](/fr/concepts/commitments) sont des mémoires de suivi facultatives et de
courte durée adaptées à ce cas. OpenClaw les déduit au cours d’un traitement masqué en
arrière-plan, les limite au même agent et au même canal, puis transmet les prises de
contact arrivées à échéance par l’intermédiaire de Heartbeat. Les rappels explicites
utilisent toujours les [tâches planifiées](/fr/automation/cron-jobs).

## Outils de mémoire

L’agent dispose de deux outils pour travailler avec la mémoire :

- **`memory_search`** — recherche les notes pertinentes à l’aide d’une recherche
  sémantique, même lorsque leur formulation diffère de l’original.
- **`memory_get`** — lit un fichier de mémoire précis ou une plage de lignes.

Les deux outils sont fournis par le plugin de mémoire actif (par défaut :
`memory-core`).

## Recherche dans la mémoire

Lorsqu’un fournisseur d’embeddings est configuré, `memory_search` utilise une recherche
hybride : la similarité vectorielle (sens sémantique) combinée à la correspondance de
mots-clés (termes exacts comme les identifiants et les symboles de code). Cette
fonctionnalité est immédiatement opérationnelle avec une clé d’API pour tout fournisseur
pris en charge.

<Info>
OpenClaw utilise les embeddings OpenAI par défaut. Définissez explicitement
`agents.defaults.memorySearch.provider` pour utiliser Gemini, Voyage, Mistral, Bedrock,
DeepInfra, un modèle GGUF local, Ollama, LM Studio, GitHub Copilot ou un point de
terminaison générique compatible avec OpenAI.
</Info>

Consultez [Recherche dans la mémoire](/fr/concepts/memory-search) pour découvrir le
fonctionnement de la recherche, les options de réglage et la configuration des
fournisseurs.

## Moteurs de mémoire

<CardGroup cols={3}>
<Card title="Intégré (par défaut)" icon="database" href="/fr/concepts/memory-builtin">
Fondé sur SQLite. Fonctionne immédiatement avec la recherche par mots-clés, la
similarité vectorielle et la recherche hybride. Aucune dépendance supplémentaire.
</Card>
<Card title="QMD" icon="search" href="/fr/concepts/memory-qmd">
Processus auxiliaire privilégiant le stockage local, avec reclassement, expansion des
requêtes et possibilité d’indexer des répertoires situés en dehors de l’espace de
travail.
</Card>
<Card title="Honcho" icon="brain" href="/fr/concepts/memory-honcho">
Mémoire intersession native pour l’IA, avec modélisation des utilisateurs, recherche
sémantique et prise en compte de plusieurs agents. Installation du plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/fr/plugins/memory-lancedb">
Mémoire fondée sur LanceDB avec embeddings compatibles avec OpenAI, rappel automatique,
capture automatique et prise en charge des embeddings Ollama locaux. Installation du
plugin.
</Card>
</CardGroup>

## Couche wiki de connaissances

Si vous souhaitez que la mémoire durable se comporte davantage comme une base de
connaissances tenue à jour que comme des notes brutes, utilisez le plugin `memory-wiki`
intégré. Il compile les connaissances durables dans un coffre wiki doté d’une structure
de pages déterministe, d’affirmations et de preuves structurées, d’un suivi des
contradictions et de l’actualité des informations, de tableaux de bord générés, de
synthèses compilées et d’outils natifs du wiki (`wiki_status`, `wiki_search`,
`wiki_get`, `wiki_apply`, `wiki_lint`).

`memory-wiki` ne remplace pas le plugin de mémoire actif ; celui-ci reste responsable
du rappel, de la promotion et de Dreaming. `memory-wiki` ajoute à ses côtés une couche
de connaissances riche en informations de provenance.

<CardGroup cols={1}>
<Card title="Wiki de mémoire" icon="book" href="/fr/plugins/memory-wiki">
Compile la mémoire durable dans un coffre wiki riche en informations de provenance,
avec des affirmations, des tableaux de bord, un mode passerelle et des flux de travail
adaptés à Obsidian.
</Card>
</CardGroup>

## Vidage automatique de la mémoire

Avant que la [Compaction](/fr/concepts/compaction) ne résume votre conversation, OpenClaw
exécute un tour silencieux qui rappelle à l’agent d’enregistrer le contexte important
dans les fichiers de mémoire. Cette fonctionnalité est activée par défaut ; définissez
`agents.defaults.compaction.memoryFlush.enabled: false` pour la désactiver.

Pour que ce tour de maintenance utilise un modèle local, définissez un remplacement
exact qui s’applique uniquement au tour de vidage de la mémoire (il n’hérite pas de la
chaîne de modèles de secours de la session active) :

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

<Tip>
Le vidage de la mémoire évite toute perte de contexte pendant la Compaction. Si la
conversation contient des faits importants que votre agent n’a pas encore écrits dans
un fichier, ils sont enregistrés automatiquement avant la création du résumé.
</Tip>

## Dreaming

Dreaming est une phase facultative de consolidation de la mémoire en arrière-plan. Elle
collecte les signaux de rappel à court terme, attribue un score aux candidats et ne
promeut que les éléments qualifiés dans la mémoire à long terme (`MEMORY.md`) :

- **Facultatif** : désactivé par défaut.
- **Planifié** : lorsqu’il est activé, `memory-core` gère automatiquement une tâche Cron
  récurrente pour un cycle complet de Dreaming.
- **Soumis à des seuils** : les promotions doivent franchir les seuils de score, de
  fréquence de rappel et de diversité des requêtes.
- **Révisable** : les résumés de phases et les entrées du journal sont écrits dans
  `DREAMS.md` afin d’être examinés par une personne.

Consultez [Dreaming](/fr/concepts/dreaming) pour en savoir plus sur le comportement des
phases, les signaux de notation et les détails du journal des rêves.

## Reconstitution fondée sur des données vérifiables et promotion en direct

Le système Dreaming comporte deux parcours de révision associés :

- **Dreaming en direct** utilise le stockage Dreaming à court terme situé sous
  `memory/.dreams/` ; c’est ce que la phase approfondie normale utilise pour déterminer
  ce qui est transféré vers `MEMORY.md`.
- **Reconstitution fondée sur des données vérifiables** lit les anciennes notes
  `memory/YYYY-MM-DD.md` comme des fichiers journaliers autonomes et écrit le résultat
  structuré de la révision dans `DREAMS.md`.

La reconstitution fondée sur des données vérifiables permet de relire d’anciennes notes
et d’examiner ce que le système considère comme durable, sans modifier manuellement
`MEMORY.md`.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

L’option `--stage-short-term` place les candidats durables fondés sur des données
vérifiables dans le même stockage Dreaming à court terme que celui déjà utilisé par la
phase approfondie normale ; elle ne les promeut pas directement. Par conséquent :

- `DREAMS.md` reste l’interface de révision destinée aux personnes.
- Le stockage à court terme reste l’interface de classement destinée à la machine.
- `MEMORY.md` n’est toujours modifié que par la promotion approfondie.

Pour annuler une relecture sans toucher aux entrées ordinaires du journal ni à l’état
normal du rappel :

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Vérifier l’état de l’index et le fournisseur
openclaw memory search "query"  # Effectuer une recherche depuis la ligne de commande
openclaw memory index --force   # Reconstruire l’index
```

## Pour aller plus loin

- [Recherche dans la mémoire](/fr/concepts/memory-search) : pipeline de recherche, fournisseurs et réglages.
- [Moteur de mémoire intégré](/fr/concepts/memory-builtin) : moteur SQLite par défaut.
- [Moteur de mémoire QMD](/fr/concepts/memory-qmd) : processus auxiliaire avancé privilégiant le stockage local.
- [Mémoire Honcho](/fr/concepts/memory-honcho) : mémoire intersession native pour l’IA.
- [Mémoire LanceDB](/fr/plugins/memory-lancedb) : plugin fondé sur LanceDB avec embeddings compatibles avec OpenAI.
- [Wiki de mémoire](/fr/plugins/memory-wiki) : coffre de connaissances compilé et outils natifs du wiki.
- [Dreaming](/fr/concepts/dreaming) : promotion en arrière-plan du rappel à court terme vers la mémoire à long terme.
- [Référence de configuration de la mémoire](/fr/reference/memory-config) : tous les paramètres de configuration.
- [Compaction](/fr/concepts/compaction) : interaction entre la Compaction et la mémoire.
- [Active Memory](/fr/concepts/active-memory) : mémoire des sous-agents pour les sessions de discussion interactives.
