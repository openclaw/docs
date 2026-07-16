---
read_when:
    - Vous souhaitez comprendre le fonctionnement de la mémoire
    - Vous souhaitez savoir quels fichiers de mémoire écrire
summary: Comment OpenClaw mémorise des informations d’une session à l’autre
title: Présentation de la mémoire
x-i18n:
    generated_at: "2026-07-16T13:12:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 22542c5df22f1602c89bae05760a5418224d8ee1f1a73679203dec9b2f091f2a
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw mémorise les informations en écrivant des fichiers Markdown simples dans l’espace de travail de votre agent
(par défaut `~/.openclaw/workspace`). Le modèle ne mémorise que ce qui est
enregistré sur le disque ; il n’existe aucun état caché.

## Fonctionnement

Votre agent dispose de trois fichiers liés à la mémoire :

- **`MEMORY.md`** — mémoire à long terme. Faits durables, préférences et
  décisions. Chargé au début d’une session.
- **`memory/YYYY-MM-DD.md`** (ou `memory/YYYY-MM-DD-<slug>.md`) — notes quotidiennes.
  Contexte en cours et observations. Les notes datées d’aujourd’hui et d’hier sont chargées
  automatiquement avec un simple `/new` ou `/reset` ; les variantes comportant un slug, comme celles
  écrites par le hook de mémoire de session fourni, sont récupérées avec le
  fichier contenant uniquement la date.
- **`DREAMS.md`** (facultatif) — Journal des rêves et résumés des passes de Dreaming destinés
  à la vérification humaine, y compris les entrées de rétroremplissage historique fondées sur des sources.

<Tip>
Si vous souhaitez que votre agent mémorise quelque chose, demandez-le-lui simplement : « Souvenez-vous que je
préfère TypeScript. » Il écrit la note dans le fichier approprié.
</Tip>

## Répartition du contenu

`MEMORY.md` constitue la couche compacte et organisée : faits durables, préférences, décisions
permanentes et courts résumés qui doivent être disponibles au début d’une
session. Il ne s’agit ni d’une transcription brute, ni d’un journal quotidien, ni d’une archive exhaustive.

Les fichiers `memory/YYYY-MM-DD.md` constituent la couche de travail : notes quotidiennes détaillées,
observations, résumés de sessions et contexte brut susceptibles de rester utiles
ultérieurement. Ils sont indexés pour `memory_search` et `memory_get`, mais ne sont pas
injectés dans le prompt d’amorçage à chaque tour.

Au fil du temps, l’agent synthétise le contenu utile des notes quotidiennes dans
`MEMORY.md` et supprime les entrées à long terme obsolètes. Les instructions générées pour l’espace de travail
et le flux Heartbeat effectuent cette opération périodiquement ; il n’est pas nécessaire de
modifier manuellement `MEMORY.md` pour chaque détail.

Si `MEMORY.md` dépasse le budget des fichiers d’amorçage, OpenClaw conserve le fichier
intact sur le disque, mais tronque la copie injectée dans le contexte. Considérez cela comme un
signal indiquant qu’il faut déplacer le contenu détaillé vers `memory/*.md`, ne conserver qu’un résumé
durable dans `MEMORY.md`, ou augmenter les limites d’amorçage si vous souhaitez consacrer davantage de
budget de prompt. Utilisez `/context list`, `/context detail` ou `openclaw doctor` pour
consulter les tailles brutes et injectées ainsi que l’état de troncature.

## Importation depuis des assistants de programmation

L’interface de contrôle peut importer une mémoire locale existante depuis Codex et Claude Code.
Ouvrez **Paramètres** → **Importer la mémoire**, choisissez l’agent de destination, examinez les
fichiers détectés, puis confirmez l’importation. OpenClaw copie uniquement la mémoire Markdown :

- Codex : les fichiers consolidés `MEMORY.md` et `memory_summary.md` sous
  `~/.codex/memories` (ou `CODEX_HOME/memories`). Les fichiers de déroulement brut et de transcription
  ne sont pas importés.
- Claude Code : les fichiers Markdown du répertoire de mémoire automatique de chaque projet sous
  `~/.claude/projects/*/memory`, ainsi qu’un fichier
  `autoMemoryDirectory` configuré par l’utilisateur lorsqu’il est présent. Les instructions du projet, les sessions, les paramètres
  et les identifiants ne font pas partie de cette opération limitée à la mémoire.

Les fichiers importés restent séparés sous `memory/imports/codex/` et
`memory/imports/claude-code/` dans l’espace de travail de l’agent sélectionné. Ils sont indexés
pour `memory_search` et accessibles via `memory_get` ; ils ne sont pas fusionnés avec
le fichier d’amorçage `MEMORY.md` de l’agent. Les fichiers sources restent inchangés.

L’aperçu signale les conflits à la destination. Activez **Remplacer les importations existantes** pour
remplacer ces fichiers ; l’application crée une sauvegarde vérifiée avant l’importation et conserve
des copies individuelles des fichiers remplacés dans le rapport de migration.

## Mémoires sensibles aux actions

La plupart des mémoires sont des notes Markdown ordinaires. Certaines influencent ce que l’agent devra
faire ultérieurement ; dans ce cas, indiquez quand il peut agir en toute sécurité en fonction de la note, et pas seulement
le fait lui-même.

Indiquez cette limite d’action lorsqu’une note concerne :

- des exigences d’approbation ou d’autorisation,
- des contraintes temporaires,
- des transmissions à une autre session, un autre fil ou une autre personne,
- des conditions d’expiration,
- le moment où il est sûr d’agir,
- l’autorité de la source ou du responsable,
- des instructions visant à éviter une action tentante.

Une mémoire sensible aux actions utile indique clairement :

- ce qui modifie le comportement futur,
- quand ou sous quelle condition cela s’applique,
- quand cela expire ou ce qui autorise l’action,
- ce que l’agent doit éviter de faire,
- qui est la source ou le responsable, si cela influe sur la confiance ou l’autorité.

La mémoire peut conserver le contexte d’une approbation, mais elle ne fait pas respecter les règles. Utilisez
les paramètres d’approbation d’OpenClaw, le bac à sable et les tâches planifiées pour assurer des
contrôles opérationnels stricts.

Exemple :

```md
La migration de l’API est en cours de conception dans une autre session. Les prochains tours ne doivent
pas modifier l’implémentation de l’API depuis ce fil ; utilisez les conclusions présentées ici uniquement comme
données de conception jusqu’à ce que le plan de migration soit finalisé.
```

Autre exemple :

```md
Un rapport provenant d’une source non fiable doit être examiné avant toute promotion. Les prochains tours
doivent le considérer uniquement comme un élément de preuve ; ne l’enregistrez pas comme mémoire durable tant qu’une
personne de confiance chargée de la vérification n’en a pas confirmé le contenu.
```

Il ne s’agit pas d’un schéma obligatoire pour chaque mémoire ; les faits simples peuvent rester concis.
Utilisez des limites sensibles aux actions lorsque la perte du contexte relatif au moment, à l’autorité, à l’expiration ou
à la possibilité d’agir en toute sécurité pourrait conduire l’agent à effectuer ultérieurement une action incorrecte.

Utilisez les [engagements](/fr/concepts/commitments) pour les suivis déduits et de courte durée.
Utilisez les [tâches planifiées](/fr/automation/cron-jobs) pour les rappels précis, les vérifications programmées
et les travaux récurrents. La mémoire peut toujours résumer le contexte durable associé
à l’une ou l’autre approche.

## Engagements déduits

Certains suivis futurs ne sont pas des faits durables. Si vous mentionnez un entretien
demain, la mémoire utile peut être « prendre des nouvelles après l’entretien », et non « conserver
cela pour toujours dans `MEMORY.md` ».

Les [engagements](/fr/concepts/commitments) sont des mémoires de suivi facultatives et de courte durée
destinées à ce cas. OpenClaw les déduit lors d’une passe cachée en arrière-plan,
les limite au même agent et au même canal, puis transmet les prises de nouvelles arrivées à échéance via
Heartbeat. Les rappels explicites utilisent toujours les [tâches planifiées](/fr/automation/cron-jobs).

## Outils de mémoire

L’agent dispose de deux outils pour travailler avec la mémoire :

- **`memory_search`** — recherche les notes pertinentes à l’aide d’une recherche sémantique, même lorsque
  la formulation diffère de l’original.
- **`memory_get`** — lit un fichier de mémoire ou une plage de lignes précise.

Les deux outils sont fournis par le Plugin de mémoire actif (par défaut : `memory-core`).

## Recherche dans la mémoire

Lorsqu’un fournisseur d’embeddings est configuré, `memory_search` utilise une recherche hybride :
la similarité vectorielle (sens sémantique) combinée à la correspondance par mots-clés (termes exacts
tels que les identifiants et les symboles de code). Cela fonctionne immédiatement avec une clé API
pour tout fournisseur pris en charge.

<Info>
OpenClaw utilise par défaut les embeddings OpenAI. Définissez
explicitement `agents.defaults.memorySearch.provider` pour utiliser Gemini, Voyage,
Mistral, Bedrock, DeepInfra, un modèle GGUF local, Ollama, LM Studio, GitHub Copilot ou
un point de terminaison générique compatible avec OpenAI.
</Info>

Consultez [Recherche dans la mémoire](/fr/concepts/memory-search) pour comprendre le fonctionnement de la recherche, les options
de réglage et la configuration des fournisseurs.

## Moteurs de mémoire

<CardGroup cols={3}>
<Card title="Intégré (par défaut)" icon="database" href="/fr/concepts/memory-builtin">
Basé sur SQLite. Fonctionne immédiatement avec la recherche par mots-clés, la similarité vectorielle et
la recherche hybride. Aucune dépendance supplémentaire.
</Card>
<Card title="QMD" icon="search" href="/fr/concepts/memory-qmd">
Service auxiliaire privilégiant le traitement local, avec reclassement, expansion des requêtes et possibilité d’indexer
des répertoires situés hors de l’espace de travail.
</Card>
<Card title="Honcho" icon="brain" href="/fr/concepts/memory-honcho">
Mémoire intersession native pour l’IA, avec modélisation de l’utilisateur, recherche sémantique et
prise en compte de plusieurs agents. Installation du Plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/fr/plugins/memory-lancedb">
Mémoire basée sur LanceDB avec embeddings compatibles avec OpenAI, rappel automatique,
capture automatique et prise en charge locale des embeddings Ollama. Installation du Plugin.
</Card>
</CardGroup>

## Couche de wiki de connaissances

Si vous souhaitez que la mémoire durable se comporte davantage comme une base de connaissances entretenue
que comme des notes brutes, utilisez le Plugin `memory-wiki` fourni. Il compile les connaissances durables
dans un coffre-fort wiki doté d’une structure de pages déterministe, d’affirmations et de preuves
structurées, du suivi des contradictions et de l’actualité, de tableaux de bord générés,
de synthèses compilées et d’outils natifs du wiki (`wiki_status`,
`wiki_search`, `wiki_get`, `wiki_apply`, `wiki_lint`).

`memory-wiki` ne remplace pas le Plugin de mémoire actif ; celui-ci
reste responsable du rappel, de la promotion et du Dreaming. `memory-wiki` ajoute à ses côtés une
couche de connaissances riche en provenance.

<CardGroup cols={1}>
<Card title="Wiki de mémoire" icon="book" href="/fr/plugins/memory-wiki">
Compile la mémoire durable dans un coffre-fort wiki riche en provenance, avec des affirmations,
des tableaux de bord, un mode passerelle et des flux de travail adaptés à Obsidian.
</Card>
</CardGroup>

## Vidage automatique de la mémoire

Avant que la [Compaction](/fr/concepts/compaction) ne résume votre conversation,
OpenClaw exécute un tour silencieux qui rappelle à l’agent d’enregistrer le contexte important
dans les fichiers de mémoire. Cette fonction est activée par défaut ; définissez
`agents.defaults.compaction.memoryFlush.enabled: false` pour la désactiver.

Pour exécuter ce tour d’entretien sur un modèle local, définissez un remplacement exact qui
s’applique uniquement au tour de vidage de la mémoire (il n’hérite pas de la chaîne de
repli des modèles de la session active) :

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
Le vidage de la mémoire empêche la perte de contexte pendant la Compaction. Si votre agent dispose
dans la conversation de faits importants qui ne sont pas encore écrits dans un fichier, ils
sont enregistrés automatiquement avant la création du résumé.
</Tip>

## Dreaming

Dreaming est une passe facultative de consolidation de la mémoire en arrière-plan. Elle recueille
les signaux de rappel à court terme, évalue les éléments candidats et promeut uniquement ceux qui remplissent les conditions
dans la mémoire à long terme (`MEMORY.md`) :

- **Facultatif** : désactivé par défaut.
- **Planifié** : lorsqu’il est activé, `memory-core` gère automatiquement une tâche Cron
  récurrente pour une passe complète de Dreaming.
- **Soumis à des seuils** : les promotions doivent franchir les seuils de score, de fréquence de rappel et
  de diversité des requêtes.
- **Vérifiable** : les résumés des phases et les entrées du journal sont écrits dans
  `DREAMS.md` afin de permettre une vérification humaine.

Consultez [Dreaming](/fr/concepts/dreaming) pour en savoir plus sur le comportement des phases, les signaux d’évaluation et
les détails du Journal des rêves.

## Rétroremplissage fondé sur des sources et promotion en direct

Le système de Dreaming comporte deux circuits de vérification associés :

- Le **Dreaming en direct** utilise le stockage de Dreaming à court terme sous
  `memory/.dreams/` et permet à la phase approfondie normale de déterminer ce qui
  passe dans `MEMORY.md`.
- Le **rétroremplissage fondé sur des sources** lit les notes historiques `memory/YYYY-MM-DD.md` comme
  des fichiers quotidiens autonomes et écrit une sortie de vérification structurée dans `DREAMS.md`.

Le rétroremplissage fondé sur des sources permet de rejouer d’anciennes notes et d’examiner ce que le
système considère comme durable, sans modifier manuellement `MEMORY.md`.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

L’option `--stage-short-term` place les éléments durables fondés sur des sources dans le même
stockage de Dreaming à court terme que celui déjà utilisé par la phase approfondie normale ; elle ne
les promeut pas directement. Par conséquent :

- `DREAMS.md` reste la surface de vérification humaine.
- Le stockage à court terme reste la surface de classement destinée à la machine.
- `MEMORY.md` est toujours écrit uniquement par la promotion approfondie.

Pour annuler un rejeu sans modifier les entrées ordinaires du journal ni l’état normal de
rappel :

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

- [Recherche en mémoire](/fr/concepts/memory-search) : pipeline de recherche, fournisseurs et réglages.
- [Moteur de mémoire intégré](/fr/concepts/memory-builtin) : backend SQLite par défaut.
- [Moteur de mémoire QMD](/fr/concepts/memory-qmd) : processus auxiliaire avancé privilégiant le stockage local.
- [Mémoire Honcho](/fr/concepts/memory-honcho) : mémoire intersession native pour l’IA.
- [Mémoire LanceDB](/fr/plugins/memory-lancedb) : Plugin basé sur LanceDB avec des plongements compatibles avec OpenAI.
- [Wiki de mémoire](/fr/plugins/memory-wiki) : dépôt de connaissances compilé et outils natifs pour les wikis.
- [Dreaming](/fr/concepts/dreaming) : transfert en arrière-plan du rappel à court terme vers la mémoire à long terme.
- [Référence de configuration de la mémoire](/fr/reference/memory-config) : tous les paramètres de configuration.
- [Compaction](/fr/concepts/compaction) : interaction entre la compaction et la mémoire.
- [Active Memory](/fr/concepts/active-memory) : mémoire des sous-agents pour les sessions de discussion interactives.
