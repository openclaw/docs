---
read_when:
    - Vous souhaitez configurer QMD comme backend de mémoire
    - Vous souhaitez des fonctionnalités de mémoire avancées comme le reclassement ou des chemins indexés supplémentaires
summary: Sidecar de recherche priorisant le local avec BM25, vecteurs, reclassement et expansion de requêtes
title: Moteur de mémoire QMD
x-i18n:
    generated_at: "2026-04-30T07:21:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71980e3701f9a5ddcfbbfa41497ef51d2aae2993b2326591124cc0a87f9a849f
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) est un sidecar de recherche local-first qui s’exécute
aux côtés d’OpenClaw. Il combine BM25, la recherche vectorielle et le reranking
dans un seul binaire, et peut indexer du contenu au-delà des fichiers mémoire
de votre espace de travail.

## Ce qu’il ajoute par rapport au moteur intégré

- **Reranking et expansion de requête** pour un meilleur rappel.
- **Indexation de répertoires supplémentaires** -- documentation de projet, notes d’équipe, tout ce qui se trouve sur disque.
- **Indexation des transcriptions de session** -- retrouvez des conversations précédentes.
- **Entièrement local** -- s’exécute avec le package d’exécution optionnel node-llama-cpp et
  télécharge automatiquement les modèles GGUF.
- **Repli automatique** -- si QMD est indisponible, OpenClaw revient
  automatiquement au moteur intégré, sans interruption.

## Premiers pas

### Prérequis

- Installez QMD : `npm install -g @tobilu/qmd` ou `bun install -g @tobilu/qmd`
- Une version de SQLite qui autorise les extensions (`brew install sqlite` sur macOS).
- QMD doit être dans le `PATH` du Gateway.
- macOS et Linux fonctionnent immédiatement. Windows est mieux pris en charge via WSL2.

### Activation

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw crée un répertoire QMD autonome sous
`~/.openclaw/agents/<agentId>/qmd/` et gère automatiquement le cycle de vie du sidecar
-- collections, mises à jour et exécutions d’embeddings sont pris en charge pour vous.
Il privilégie les formes actuelles de collection QMD et de requête MCP, mais revient encore aux
options de motif de collection alternatives et aux anciens noms d’outils MCP si nécessaire.
La réconciliation au démarrage recrée aussi les collections gérées obsolètes avec leurs
motifs canoniques lorsqu’une ancienne collection QMD portant le même nom est encore
présente.

## Fonctionnement du sidecar

- OpenClaw crée des collections à partir de vos fichiers mémoire d’espace de travail et de tout
  `memory.qmd.paths` configuré, puis exécute `qmd update` quand le gestionnaire QMD est
  ouvert et périodiquement ensuite (par défaut toutes les 5 minutes). Ces actualisations
  passent par des sous-processus QMD, et non par un parcours du système de fichiers dans le processus. Les
  modes sémantiques exécutent aussi `qmd embed`.
- La collection d’espace de travail par défaut suit `MEMORY.md` ainsi que l’arborescence
  `memory/`. Le fichier `memory.md` en minuscules n’est pas indexé comme fichier mémoire racine.
- Le scanner propre à QMD ignore les chemins masqués et les répertoires courants de dépendances/build
  comme `.git`, `.cache`, `node_modules`, `vendor`, `dist` et
  `build`. Le démarrage du Gateway n’initialise pas QMD par défaut, donc un démarrage à froid
  évite d’importer le runtime mémoire ou de créer le watcher longue durée avant la
  première utilisation de la mémoire.
- Si vous voulez tout de même une actualisation au démarrage du Gateway, définissez
  `memory.qmd.update.startup` sur `idle` ou `immediate`. L’actualisation au démarrage
  optionnelle utilise un chemin de sous-processus QMD ponctuel au lieu de créer le watcher
  complet longue durée dans le processus.
- Les recherches utilisent le `searchMode` configuré (par défaut : `search` ; prend aussi en charge
  `vsearch` et `query`). `search` utilise uniquement BM25, donc OpenClaw ignore les sondes de
  disponibilité vectorielle sémantique et la maintenance des embeddings dans ce mode. Si un mode
  échoue, OpenClaw réessaie avec `qmd query`.
- Avec les versions de QMD qui annoncent des filtres multi-collections, OpenClaw regroupe
  les collections de même source dans une seule invocation de recherche QMD. Les versions plus anciennes de QMD
  conservent le repli compatible par collection.
- Si QMD échoue entièrement, OpenClaw revient au moteur SQLite intégré.
  Les tentatives répétées pendant les tours de chat appliquent un court délai après un échec d’ouverture, afin qu’un
  binaire manquant ou une dépendance sidecar cassée ne crée pas une tempête de nouvelles tentatives ;
  `openclaw memory status` et les sondes CLI ponctuelles revérifient toujours QMD directement.

<Info>
La première recherche peut être lente -- QMD télécharge automatiquement les modèles GGUF (~2 Go) pour
le reranking et l’expansion de requête lors de la première exécution de `qmd query`.
</Info>

## Performances de recherche et compatibilité

OpenClaw garde le chemin de recherche QMD compatible avec les installations QMD actuelles
comme anciennes.

Au démarrage, OpenClaw vérifie une fois par gestionnaire le texte d’aide de QMD installé. Si le
binaire annonce la prise en charge de plusieurs filtres de collection, OpenClaw recherche dans toutes
les collections de même source avec une seule commande :

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Cela évite de démarrer un sous-processus QMD pour chaque collection de mémoire durable.
Les collections de transcriptions de session restent dans leur propre groupe de source, donc les recherches mixtes
`memory` + `sessions` fournissent toujours au diversificateur de résultats des entrées provenant des deux
sources.

Les anciennes versions de QMD n’acceptent qu’un seul filtre de collection. Quand OpenClaw détecte l’une
de ces versions, il conserve le chemin de compatibilité et recherche dans chaque collection
séparément avant de fusionner et dédupliquer les résultats.

Pour inspecter manuellement le contrat installé, exécutez :

```bash
qmd --help | grep -i collection
```

L’aide QMD actuelle indique que les filtres de collection peuvent cibler une ou plusieurs collections.
L’aide plus ancienne décrit généralement une seule collection.

## Surcharges de modèle

Les variables d’environnement de modèle QMD sont transmises telles quelles depuis le processus Gateway,
vous pouvez donc ajuster QMD globalement sans ajouter de nouvelle configuration OpenClaw :

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Après avoir changé le modèle d’embedding, réexécutez les embeddings afin que l’index corresponde au
nouvel espace vectoriel.

## Indexation de chemins supplémentaires

Pointez QMD vers des répertoires supplémentaires pour les rendre recherchables :

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

Les extraits provenant de chemins supplémentaires apparaissent sous la forme `qmd/<collection>/<relative-path>` dans
les résultats de recherche. `memory_get` comprend ce préfixe et lit depuis la racine de
collection correcte.

## Indexation des transcriptions de session

Activez l’indexation de session pour retrouver des conversations précédentes :

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Les transcriptions sont exportées sous forme de tours User/Assistant assainis dans une collection QMD
dédiée sous `~/.openclaw/agents/<id>/qmd/sessions/`.

## Portée de la recherche

Par défaut, les résultats de recherche QMD sont exposés dans les sessions directes et de canal
(pas les groupes). Configurez `memory.qmd.scope` pour modifier cela :

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

Quand la portée refuse une recherche, OpenClaw journalise un avertissement avec le canal déduit et
le type de chat, afin que les résultats vides soient plus faciles à déboguer.

## Citations

Quand `memory.citations` vaut `auto` ou `on`, les extraits de recherche incluent un pied de page
`Source: <path#line>`. Définissez `memory.citations = "off"` pour omettre le pied de page
tout en transmettant quand même le chemin à l’agent en interne.

## Quand l’utiliser

Choisissez QMD quand vous avez besoin de :

- Reranking pour des résultats de meilleure qualité.
- Rechercher dans la documentation de projet ou les notes hors de l’espace de travail.
- Retrouver des conversations de sessions passées.
- Une recherche entièrement locale sans clés d’API.

Pour les configurations plus simples, le [moteur intégré](/fr/concepts/memory-builtin) fonctionne bien
sans dépendances supplémentaires.

## Dépannage

**QMD introuvable ?** Assurez-vous que le binaire se trouve dans le `PATH` du Gateway. Si OpenClaw
s’exécute comme service, créez un lien symbolique :
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Si `qmd --version` fonctionne dans votre shell mais qu’OpenClaw signale toujours
`spawn qmd ENOENT`, le processus Gateway a probablement un `PATH` différent de celui de votre
shell interactif. Épinglez explicitement le binaire :

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      command: "/absolute/path/to/qmd",
    },
  },
}
```

Utilisez `command -v qmd` dans l’environnement où QMD est installé, puis revérifiez
avec `openclaw memory status --deep`.

**Première recherche très lente ?** QMD télécharge les modèles GGUF à la première utilisation. Préchargez
avec `qmd query "test"` en utilisant les mêmes répertoires XDG qu’OpenClaw.

**Nombreux sous-processus QMD pendant la recherche ?** Mettez QMD à jour si possible. OpenClaw utilise
un seul processus pour les recherches multi-collections de même source uniquement lorsque QMD installé
annonce la prise en charge de plusieurs filtres `-c` ; sinon il conserve l’ancien
repli par collection pour garantir l’exactitude.

**QMD en mode BM25 uniquement tente encore de compiler llama.cpp ?** Définissez
`memory.qmd.searchMode = "search"`. OpenClaw traite ce mode comme uniquement lexical,
n’exécute pas les sondes d’état vectoriel QMD ni la maintenance des embeddings, et laisse
les vérifications de disponibilité sémantique aux configurations `vsearch` ou `query`.

**La recherche expire ?** Augmentez `memory.qmd.limits.timeoutMs` (par défaut : 4000ms).
Définissez-le sur `120000` pour du matériel plus lent.

**Résultats vides dans les chats de groupe ?** Vérifiez `memory.qmd.scope` -- la valeur par défaut
autorise uniquement les sessions directes et de canal.

**La recherche mémoire racine est soudainement devenue trop large ?** Redémarrez le Gateway ou attendez
la prochaine réconciliation au démarrage. OpenClaw recrée les collections gérées obsolètes
avec les motifs canoniques `MEMORY.md` et `memory/` quand il détecte un conflit
avec le même nom.

**Des dépôts temporaires visibles depuis l’espace de travail provoquent `ENAMETOOLONG` ou une indexation cassée ?**
Le parcours QMD suit actuellement le comportement du scanner QMD sous-jacent plutôt que
les règles de liens symboliques intégrées d’OpenClaw. Gardez les checkouts de monorepo temporaires sous
des répertoires masqués comme `.tmp/` ou hors des racines QMD indexées jusqu’à ce que QMD expose
un parcours sûr face aux cycles ou des contrôles d’exclusion explicites.

## Configuration

Pour toute la surface de configuration (`memory.qmd.*`), les modes de recherche, les intervalles de mise à jour,
les règles de portée et tous les autres réglages, consultez la
[référence de configuration de la mémoire](/fr/reference/memory-config).

## Articles connexes

- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [Moteur de mémoire intégré](/fr/concepts/memory-builtin)
- [Mémoire Honcho](/fr/concepts/memory-honcho)
