---
read_when:
    - Vous voulez configurer QMD comme backend de mémoire
    - Vous voulez des fonctionnalités de mémoire avancées comme le reclassement ou des chemins indexés supplémentaires
summary: Side-car de recherche local-first avec BM25, vecteurs, reranking et expansion de requête
title: Moteur de mémoire QMD
x-i18n:
    generated_at: "2026-06-28T22:33:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 14af147882829451f026f0b9b6cc052c6e2129626a4ab0d0b1c7b77a31c1c050
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) est un sidecar de recherche local-first qui s’exécute
aux côtés d’OpenClaw. Il combine BM25, recherche vectorielle et reranking dans un seul
binaire, et peut indexer du contenu au-delà des fichiers mémoire de votre espace de travail.

## Ce qu’il ajoute par rapport au moteur intégré

- **Reranking et extension de requête** pour un meilleur rappel.
- **Indexation de répertoires supplémentaires** -- documentation du projet, notes d’équipe, tout élément sur disque.
- **Indexation des transcriptions de session** -- rappel des conversations antérieures.
- **Entièrement local** -- fonctionne avec le plugin fournisseur officiel llama.cpp et
  télécharge automatiquement les modèles GGUF.
- **Repli automatique** -- si QMD est indisponible, OpenClaw revient sans interruption au
  moteur intégré.

## Premiers pas

### Prérequis

- Installez QMD : `npm install -g @tobilu/qmd` ou `bun install -g @tobilu/qmd`
- Build SQLite qui autorise les extensions (`brew install sqlite` sur macOS).
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

OpenClaw crée un répertoire d’accueil QMD autonome sous
`~/.openclaw/agents/<agentId>/qmd/` et gère automatiquement le cycle de vie du sidecar
-- collections, mises à jour et exécutions d’embedding sont prises en charge pour vous.
Il privilégie les formes actuelles de collection QMD et de requête MCP, mais se rabat encore sur
des indicateurs de motifs de collection alternatifs et des noms d’outils MCP plus anciens si nécessaire.
La réconciliation au démarrage recrée aussi les collections gérées obsolètes selon leurs
motifs canoniques lorsqu’une collection QMD plus ancienne portant le même nom est encore
présente.

## Fonctionnement du sidecar

- OpenClaw crée des collections à partir des fichiers mémoire de votre espace de travail et de tout
  `memory.qmd.paths` configuré, puis exécute `qmd update` lorsque le gestionnaire QMD est
  ouvert et périodiquement ensuite (par défaut toutes les 5 minutes). Ces actualisations
  passent par des sous-processus QMD, et non par une exploration du système de fichiers dans le processus. Les
  modes sémantiques exécutent aussi `qmd embed`.
- La collection d’espace de travail par défaut suit `MEMORY.md` ainsi que l’arborescence
  `memory/`. `memory.md` en minuscules n’est pas indexé comme fichier mémoire racine.
- Le scanner propre à QMD ignore les chemins cachés et les répertoires courants de dépendances/build
  comme `.git`, `.cache`, `node_modules`, `vendor`, `dist` et
  `build`. Le démarrage du Gateway n’initialise pas QMD par défaut, donc un démarrage à froid
  évite d’importer le runtime mémoire ou de créer le watcher de longue durée avant la
  première utilisation de la mémoire.
- Si vous voulez tout de même initialiser QMD au démarrage du Gateway, définissez
  `memory.qmd.update.startup` sur `idle` ou `immediate`. Avec
  `memory.qmd.update.onBoot: true`, le démarrage lance l’actualisation initiale. Avec
  `onBoot: false`, le démarrage ignore cette actualisation immédiate mais ouvre quand même le
  gestionnaire de longue durée lorsque des intervalles de mise à jour ou d’embedding sont configurés, afin que QMD puisse
  posséder son watcher et ses minuteurs réguliers.
- Les recherches utilisent le `searchMode` configuré (par défaut : `search` ; prend aussi en charge
  `vsearch` et `query`). `search` est uniquement BM25, donc OpenClaw ignore les sondes de disponibilité
  vectorielle sémantique et la maintenance des embeddings dans ce mode. Si un mode
  échoue, OpenClaw réessaie avec `qmd query`.
- Lorsque `searchMode` vaut `query`, définissez `memory.qmd.rerank` sur `false` pour utiliser le
  chemin de requête hybride de QMD sans le reranker. OpenClaw transmet `--no-rerank` au
  chemin CLI QMD direct et `rerank: false` à l’outil de requête MCP de QMD. Cette option
  nécessite QMD 2.1 ou une version plus récente.
- Avec les versions de QMD qui annoncent des filtres multi-collections, OpenClaw regroupe
  les collections de même source dans une seule invocation de recherche QMD. Les versions plus anciennes de QMD
  conservent le repli compatible par collection.
- Si QMD échoue complètement, OpenClaw se rabat sur le moteur SQLite intégré.
  Les tentatives répétées pendant les tours de chat temporisent brièvement après un échec d’ouverture, afin qu’un
  binaire manquant ou une dépendance de sidecar cassée ne crée pas une tempête de nouvelles tentatives ;
  `openclaw memory status` et les sondes CLI ponctuelles revérifient toujours QMD directement.

<Info>
La première recherche peut être lente -- QMD télécharge automatiquement les modèles GGUF (~2 Go) pour le
reranking et l’extension de requête lors de la première exécution de `qmd query`.
</Info>

## Performances de recherche et compatibilité

OpenClaw garde le chemin de recherche QMD compatible avec les installations QMD actuelles et plus anciennes.

Au démarrage, OpenClaw vérifie une fois par gestionnaire le texte d’aide QMD installé. Si le
binaire annonce la prise en charge de plusieurs filtres de collection, OpenClaw recherche dans toutes les
collections de même source avec une seule commande :

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Cela évite de démarrer un sous-processus QMD pour chaque collection de mémoire durable.
Les collections de transcriptions de session restent dans leur propre groupe de source, donc les recherches mixtes
`memory` + `sessions` fournissent toujours au diversificateur de résultats des entrées issues des deux
sources.

Les anciens builds QMD n’acceptent qu’un seul filtre de collection. Lorsqu’OpenClaw détecte l’un
de ces builds, il conserve le chemin de compatibilité et recherche dans chaque collection
séparément avant de fusionner et de dédupliquer les résultats.

Pour inspecter manuellement le contrat installé, exécutez :

```bash
qmd --help | grep -i collection
```

L’aide QMD actuelle indique que les filtres de collection peuvent cibler une ou plusieurs collections.
L’aide plus ancienne décrit généralement une seule collection.

## Substitutions de modèles

Les variables d’environnement de modèle QMD sont transmises telles quelles depuis le processus
Gateway, afin que vous puissiez ajuster QMD globalement sans ajouter de nouvelle configuration OpenClaw :

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Après avoir changé le modèle d’embedding, relancez les embeddings pour que l’index corresponde au
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

Les extraits provenant des chemins supplémentaires apparaissent sous la forme `qmd/<collection>/<relative-path>` dans les
résultats de recherche. `memory_get` comprend ce préfixe et lit depuis la racine de collection
correcte.

## Indexation des transcriptions de session

Activez l’indexation des sessions pour rappeler des conversations antérieures. QMD a besoin à la fois de la source de session générale
`memorySearch` et de l’exportateur de transcriptions QMD :

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        experimental: { sessionMemory: true },
        sources: ["memory", "sessions"],
      },
    },
  },
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Les transcriptions sont exportées sous forme de tours User/Assistant assainis dans une collection QMD
dédiée sous `~/.openclaw/agents/<id>/qmd/sessions/`. Définir uniquement
`memorySearch.experimental.sessionMemory` n’exporte pas les transcriptions dans QMD.

Les résultats de session restent filtrés par
[`tools.sessions.visibility`](/fr/gateway/config-tools#toolssessions). La visibilité par défaut
`tree` n’expose pas les sessions sans rapport du même agent. Si une session
répartie par le Gateway doit être rappelable depuis une session DM distincte, définissez
`tools.sessions.visibility: "agent"` intentionnellement.

## Portée de recherche

Par défaut, les résultats de recherche QMD sont exposés dans les sessions directes et de canal
(pas les groupes). Configurez `memory.qmd.scope` pour changer cela :

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

Lorsque la portée refuse une recherche, OpenClaw journalise un avertissement avec le canal et
le type de chat déduits, afin que les résultats vides soient plus faciles à déboguer.

## Citations

Lorsque `memory.citations` vaut `auto` ou `on`, les extraits de recherche incluent un pied
`Source: <path#line>`. Définissez `memory.citations = "off"` pour omettre le pied
tout en transmettant quand même le chemin à l’agent en interne.

## Quand l’utiliser

Choisissez QMD lorsque vous avez besoin :

- Du reranking pour des résultats de meilleure qualité.
- De rechercher dans la documentation ou les notes du projet en dehors de l’espace de travail.
- De rappeler des conversations de sessions passées.
- D’une recherche entièrement locale sans clés API.

Pour des configurations plus simples, le [moteur intégré](/fr/concepts/memory-builtin) fonctionne bien
sans dépendances supplémentaires.

## Dépannage

**QMD introuvable ?** Assurez-vous que le binaire se trouve dans le `PATH` du Gateway. Si OpenClaw
s’exécute comme service, créez un lien symbolique :
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Si `qmd --version` fonctionne dans votre shell mais qu’OpenClaw signale toujours
`spawn qmd ENOENT`, le processus Gateway a probablement un `PATH` différent de celui de votre
shell interactif. Épinglez le binaire explicitement :

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

**Première recherche très lente ?** QMD télécharge les modèles GGUF à la première utilisation. Préchauffez
avec `qmd query "test"` en utilisant les mêmes répertoires XDG qu’OpenClaw.

**Nombreux sous-processus QMD pendant la recherche ?** Mettez QMD à jour si possible. OpenClaw utilise
un seul processus pour les recherches multi-collections de même source uniquement lorsque le QMD installé
annonce la prise en charge de plusieurs filtres `-c` ; sinon il conserve l’ancien
repli par collection pour l’exactitude.

**QMD uniquement BM25 essaie encore de builder llama.cpp ?** Définissez
`memory.qmd.searchMode = "search"`. OpenClaw traite ce mode comme uniquement lexical,
n’exécute pas de sondes d’état vectoriel QMD ni de maintenance des embeddings, et laisse
les vérifications de disponibilité sémantique aux configurations `vsearch` ou `query`.

**La recherche expire ?** Augmentez `memory.qmd.limits.timeoutMs` (par défaut : 4000 ms).
Définissez-le sur `120000` pour du matériel plus lent.

**Résultats vides dans les discussions de groupe ?** Vérifiez `memory.qmd.scope` -- la valeur par défaut
autorise uniquement les sessions directes et de canal.

**La recherche de mémoire racine est soudainement devenue trop large ?** Redémarrez le Gateway ou attendez
la prochaine réconciliation au démarrage. OpenClaw recrée les collections gérées obsolètes
selon les motifs canoniques `MEMORY.md` et `memory/` lorsqu’il détecte un conflit
de même nom.

**Des dépôts temporaires visibles depuis l’espace de travail provoquent `ENAMETOOLONG` ou une indexation cassée ?**
La traversée QMD suit actuellement le comportement du scanner QMD sous-jacent plutôt que
les règles de liens symboliques intégrées d’OpenClaw. Conservez les checkouts temporaires de monorepo sous
des répertoires cachés comme `.tmp/` ou en dehors des racines QMD indexées jusqu’à ce que QMD expose
une traversée sans cycle ou des contrôles d’exclusion explicites.

## Configuration

Pour toute la surface de configuration (`memory.qmd.*`), les modes de recherche, les intervalles de mise à jour,
les règles de portée et tous les autres réglages, consultez la
[référence de configuration de la mémoire](/fr/reference/memory-config).

## Associés

- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [Moteur de mémoire intégré](/fr/concepts/memory-builtin)
- [Mémoire Honcho](/fr/concepts/memory-honcho)
