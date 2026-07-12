---
read_when:
    - Vous souhaitez comprendre le fonctionnement de la mémoire
    - Vous voulez savoir dans quels fichiers de mémoire écrire
summary: Comment OpenClaw mémorise des informations d’une session à l’autre
title: Vue d’ensemble de la mémoire
x-i18n:
    generated_at: "2026-07-12T02:30:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c77d71dd6b1916b923fbf72c373f20128c4f604f96cc76150ea27e0f13a541f8
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw mémorise des éléments en écrivant des fichiers Markdown simples dans l’espace de travail de votre agent (par défaut `~/.openclaw/workspace`). Le modèle ne mémorise que ce qui est enregistré sur le disque ; il n’existe aucun état caché.

## Fonctionnement

Votre agent dispose de trois fichiers liés à la mémoire :

- **`MEMORY.md`** — mémoire à long terme. Faits durables, préférences et décisions. Chargé au début d’une session.
- **`memory/YYYY-MM-DD.md`** (ou `memory/YYYY-MM-DD-<slug>.md`) — notes quotidiennes. Contexte en cours et observations. Les notes datées d’aujourd’hui et d’hier sont chargées automatiquement lors d’une simple commande `/new` ou `/reset` ; les variantes comportant un slug, telles que celles écrites par le hook de mémoire de session intégré, sont récupérées en même temps que le fichier contenant uniquement la date.
- **`DREAMS.md`** (facultatif) — journal des rêves et résumés des cycles de Dreaming destinés à une révision humaine, y compris les entrées de reconstitution historique fondées sur des données réelles.

<Tip>
Si vous souhaitez que votre agent mémorise quelque chose, demandez-le-lui simplement : « Souviens-toi que je préfère TypeScript. » Il écrit la note dans le fichier approprié.
</Tip>

## Où placer chaque élément

`MEMORY.md` constitue la couche compacte et organisée : faits durables, préférences, décisions permanentes et courts résumés qui doivent être disponibles au début d’une session. Il ne s’agit ni d’une transcription brute, ni d’un journal quotidien, ni d’une archive exhaustive.

Les fichiers `memory/YYYY-MM-DD.md` constituent la couche de travail : notes quotidiennes détaillées, observations, résumés de sessions et contexte brut susceptible de rester utile ultérieurement. Ils sont indexés pour `memory_search` et `memory_get`, mais ne sont pas injectés dans le prompt d’amorçage à chaque tour.

Au fil du temps, l’agent extrait les informations utiles des notes quotidiennes pour les intégrer à `MEMORY.md` et supprime les entrées à long terme obsolètes. Les instructions générées pour l’espace de travail et le flux Heartbeat effectuent cette opération périodiquement ; vous n’avez pas besoin de modifier manuellement `MEMORY.md` pour chaque détail.

Si la taille de `MEMORY.md` dépasse le budget alloué aux fichiers d’amorçage, OpenClaw conserve le fichier intact sur le disque, mais tronque la copie injectée dans le contexte. Considérez cela comme un signal indiquant qu’il faut déplacer les informations détaillées vers `memory/*.md`, ne conserver qu’un résumé durable dans `MEMORY.md`, ou augmenter les limites d’amorçage si vous souhaitez consacrer davantage de budget de prompt. Utilisez `/context list`, `/context detail` ou `openclaw doctor` pour consulter les tailles brutes et injectées ainsi que l’état de troncature.

## Souvenirs sensibles aux actions

La plupart des souvenirs sont de simples notes Markdown. Certains influencent ce que l’agent devra faire ultérieurement ; pour ceux-ci, consignez le moment où il est possible d’agir sans risque à partir de la note, et pas uniquement le fait lui-même.

Consignez cette limite d’action lorsqu’une note concerne :

- des exigences d’approbation ou d’autorisation ;
- des contraintes temporaires ;
- des transmissions à une autre session, un autre fil ou une autre personne ;
- des conditions d’expiration ;
- le moment où il est possible d’agir sans risque ;
- l’autorité de la source ou du propriétaire ;
- des instructions visant à éviter une action tentante.

Un souvenir utile et sensible aux actions indique clairement :

- ce qui modifie le comportement futur ;
- quand ou sous quelle condition cela s’applique ;
- quand cela expire ou ce qui autorise l’action ;
- ce que l’agent doit éviter de faire ;
- qui est la source ou le propriétaire, si cela influe sur la confiance ou l’autorité.

La mémoire peut conserver le contexte d’une approbation, mais elle n’applique pas de politique. Utilisez les paramètres d’approbation d’OpenClaw, le bac à sable et les tâches planifiées pour les contrôles opérationnels stricts.

Exemple :

```md
La migration de l’API est en cours de conception dans une autre session. Les
prochains tours ne doivent pas modifier l’implémentation de l’API depuis ce
fil ; utilisez les conclusions recueillies ici uniquement comme données de
conception jusqu’à l’adoption du plan de migration.
```

Autre exemple :

```md
Un rapport provenant d’une source non fiable doit être examiné avant d’être
promu. Les prochains tours doivent le traiter uniquement comme un élément de
preuve ; ne l’enregistrez pas comme souvenir durable tant qu’un réviseur de
confiance n’en a pas confirmé le contenu.
```

Il ne s’agit pas d’un schéma obligatoire pour chaque souvenir ; les faits simples peuvent rester concis. Utilisez des limites sensibles aux actions lorsque la perte du contexte lié au calendrier, à l’autorité, à l’expiration ou à la possibilité d’agir sans risque pourrait amener l’agent à effectuer ultérieurement une action incorrecte.

Utilisez les [engagements](/fr/concepts/commitments) pour les suivis déduits et de courte durée. Utilisez les [tâches planifiées](/fr/automation/cron-jobs) pour les rappels précis, les vérifications programmées et les travaux récurrents. La mémoire peut néanmoins résumer le contexte durable associé à l’une ou l’autre approche.

## Engagements déduits

Certains suivis futurs ne sont pas des faits durables. Si vous mentionnez un entretien prévu demain, le souvenir utile peut être « prendre des nouvelles après l’entretien », et non « conserver cela indéfiniment dans `MEMORY.md` ».

Les [engagements](/fr/concepts/commitments) sont des souvenirs de suivi facultatifs et de courte durée destinés à ce cas. OpenClaw les déduit lors d’un traitement masqué en arrière-plan, limite leur portée au même agent et au même canal, puis transmet les prises de nouvelles arrivées à échéance par l’intermédiaire du Heartbeat. Les rappels explicites continuent d’utiliser les [tâches planifiées](/fr/automation/cron-jobs).

## Outils de mémoire

L’agent dispose de deux outils pour travailler avec la mémoire :

- **`memory_search`** — trouve les notes pertinentes à l’aide d’une recherche sémantique, même lorsque leur formulation diffère de l’original.
- **`memory_get`** — lit un fichier mémoire précis ou une plage de lignes.

Ces deux outils sont fournis par le Plugin de mémoire actif (par défaut : `memory-core`).

## Recherche dans la mémoire

Lorsqu’un fournisseur d’embeddings est configuré, `memory_search` utilise une recherche hybride : la similarité vectorielle (sens sémantique) combinée à la correspondance de mots-clés (termes exacts tels que les identifiants et les symboles de code). Cela fonctionne immédiatement avec une clé d’API pour tout fournisseur pris en charge.

<Info>
OpenClaw utilise les embeddings OpenAI par défaut. Définissez explicitement `agents.defaults.memorySearch.provider` pour utiliser Gemini, Voyage, Mistral, Bedrock, DeepInfra, un modèle GGUF local, Ollama, LM Studio, GitHub Copilot ou un point de terminaison générique compatible avec OpenAI.
</Info>

Consultez [Recherche dans la mémoire](/fr/concepts/memory-search) pour découvrir le fonctionnement de la recherche, les options de réglage et la configuration des fournisseurs.

## Moteurs de mémoire

<CardGroup cols={3}>
<Card title="Intégré (par défaut)" icon="database" href="/fr/concepts/memory-builtin">
Fondé sur SQLite. Fonctionne immédiatement avec la recherche par mots-clés, la similarité vectorielle et la recherche hybride. Aucune dépendance supplémentaire.
</Card>
<Card title="QMD" icon="search" href="/fr/concepts/memory-qmd">
Processus auxiliaire privilégiant le traitement local, avec reclassement, expansion des requêtes et possibilité d’indexer des répertoires situés hors de l’espace de travail.
</Card>
<Card title="Honcho" icon="brain" href="/fr/concepts/memory-honcho">
Mémoire intersession native pour l’IA, avec modélisation de l’utilisateur, recherche sémantique et prise en compte de plusieurs agents. Installation du Plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/fr/plugins/memory-lancedb">
Mémoire fondée sur LanceDB avec embeddings compatibles avec OpenAI, rappel automatique, capture automatique et prise en charge locale des embeddings Ollama. Installation du Plugin.
</Card>
</CardGroup>

## Couche de wiki de connaissances

Si vous souhaitez que la mémoire durable se comporte davantage comme une base de connaissances entretenue que comme des notes brutes, utilisez le Plugin intégré `memory-wiki`. Il compile les connaissances durables dans un coffre wiki doté d’une structure de pages déterministe, d’affirmations et de preuves structurées, d’un suivi des contradictions et de l’actualité, de tableaux de bord générés, de synthèses compilées et d’outils propres au wiki (`wiki_status`, `wiki_search`, `wiki_get`, `wiki_apply`, `wiki_lint`).

`memory-wiki` ne remplace pas le Plugin de mémoire actif ; celui-ci reste responsable du rappel, de la promotion et du Dreaming. `memory-wiki` lui ajoute une couche de connaissances riche en provenance.

<CardGroup cols={1}>
<Card title="Wiki de mémoire" icon="book" href="/fr/plugins/memory-wiki">
Compile la mémoire durable dans un coffre wiki riche en provenance, avec affirmations, tableaux de bord, mode passerelle et flux de travail adaptés à Obsidian.
</Card>
</CardGroup>

## Vidage automatique de la mémoire

Avant que la [Compaction](/fr/concepts/compaction) ne résume votre conversation, OpenClaw exécute un tour silencieux qui rappelle à l’agent d’enregistrer le contexte important dans les fichiers mémoire. Cette fonctionnalité est activée par défaut ; définissez `agents.defaults.compaction.memoryFlush.enabled: false` pour la désactiver.

Pour conserver ce tour d’entretien sur un modèle local, définissez un remplacement exact qui s’applique uniquement au tour de vidage de la mémoire (il n’hérite pas de la chaîne de modèles de secours de la session active) :

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
Le vidage de la mémoire empêche la perte de contexte pendant la Compaction. Si la conversation contient des faits importants que votre agent n’a pas encore écrits dans un fichier, ils sont automatiquement enregistrés avant la génération du résumé.
</Tip>

## Dreaming

Dreaming est une étape facultative de consolidation de la mémoire en arrière-plan. Elle recueille les signaux de rappel à court terme, attribue un score aux éléments candidats et ne promeut que les éléments qualifiés vers la mémoire à long terme (`MEMORY.md`) :

- **Facultatif** : désactivé par défaut.
- **Planifié** : lorsqu’il est activé, `memory-core` gère automatiquement une tâche Cron récurrente pour un cycle complet de Dreaming.
- **Soumis à des seuils** : les promotions doivent franchir les seuils de score, de fréquence de rappel et de diversité des requêtes.
- **Révisable** : les résumés des phases et les entrées du journal sont écrits dans `DREAMS.md` en vue d’une révision humaine.

Consultez [Dreaming](/fr/concepts/dreaming) pour en savoir plus sur le comportement des phases, les signaux de notation et le journal des rêves.

## Reconstitution fondée sur des données réelles et promotion en direct

Le système de Dreaming comporte deux voies de révision associées :

- **Dreaming en direct** exploite le stockage de Dreaming à court terme situé dans `memory/.dreams/` ; la phase approfondie normale l’utilise pour déterminer ce qui accède à `MEMORY.md`.
- **Reconstitution fondée sur des données réelles** lit les anciennes notes `memory/YYYY-MM-DD.md` comme des fichiers quotidiens autonomes et écrit une sortie de révision structurée dans `DREAMS.md`.

La reconstitution fondée sur des données réelles permet de rejouer d’anciennes notes et d’examiner ce que le système considère comme durable, sans modifier manuellement `MEMORY.md`.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

L’option `--stage-short-term` place les éléments candidats durables et fondés sur des données réelles dans le même stockage de Dreaming à court terme que celui déjà utilisé par la phase approfondie normale ; elle ne les promeut pas directement. Ainsi :

- `DREAMS.md` reste l’interface de révision humaine.
- Le stockage à court terme reste l’interface de classement destinée à la machine.
- `MEMORY.md` n’est toujours écrit que par la promotion approfondie.

Pour annuler une relecture sans modifier les entrées ordinaires du journal ni l’état de rappel normal :

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

- [Recherche dans la mémoire](/fr/concepts/memory-search) : pipeline de recherche, fournisseurs et réglage.
- [Moteur de mémoire intégré](/fr/concepts/memory-builtin) : moteur SQLite par défaut.
- [Moteur de mémoire QMD](/fr/concepts/memory-qmd) : processus auxiliaire avancé privilégiant le traitement local.
- [Mémoire Honcho](/fr/concepts/memory-honcho) : mémoire intersession native pour l’IA.
- [Mémoire LanceDB](/fr/plugins/memory-lancedb) : Plugin fondé sur LanceDB avec embeddings compatibles avec OpenAI.
- [Wiki de mémoire](/fr/plugins/memory-wiki) : coffre de connaissances compilé et outils propres au wiki.
- [Dreaming](/fr/concepts/dreaming) : promotion en arrière-plan du rappel à court terme vers la mémoire à long terme.
- [Référence de configuration de la mémoire](/fr/reference/memory-config) : tous les paramètres de configuration.
- [Compaction](/fr/concepts/compaction) : interaction de la Compaction avec la mémoire.
- [Active Memory](/fr/concepts/active-memory) : mémoire des sous-agents pour les sessions de conversation interactives.
