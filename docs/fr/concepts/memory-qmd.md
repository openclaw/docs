---
read_when:
    - Vous souhaitez configurer QMD comme backend de mémoire
    - Vous souhaitez des fonctionnalités de mémoire avancées, comme le reclassement ou des chemins indexés supplémentaires.
summary: Moteur de recherche auxiliaire local-first avec BM25, vecteurs, reclassement et expansion de requête
title: Moteur de mémoire QMD
x-i18n:
    generated_at: "2026-07-16T13:15:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b13017ead7e7340624a35e603a18216a5c23405cbab09e7f53b1e15d74d59d23
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) est un moteur de recherche auxiliaire privilégiant le fonctionnement local qui s’exécute
aux côtés d’OpenClaw. Il combine BM25, la recherche vectorielle et le reclassement dans un seul
binaire, et peut indexer du contenu au-delà des fichiers de mémoire de votre espace de travail.

## Ce qu’il apporte par rapport au moteur intégré

- **Reclassement et expansion des requêtes** pour un meilleur rappel.
- **Indexation de répertoires supplémentaires** - documentation de projet, notes d’équipe, tout contenu sur disque.
- **Indexation des transcriptions de session** - retrouvez des conversations antérieures.
- **Entièrement local** - fonctionne avec le plugin de fournisseur llama.cpp officiel et
  télécharge automatiquement les modèles GGUF.
- **Repli automatique** - si QMD est indisponible, OpenClaw se rabat de manière
  transparente sur le moteur intégré.

## Prise en main

### Prérequis

- Installez QMD : `npm install -g @tobilu/qmd` ou `bun install -g @tobilu/qmd`
- Une version de SQLite autorisant les extensions (`brew install sqlite` sur macOS).
- QMD doit se trouver dans le `PATH` du Gateway.
- macOS et Linux fonctionnent immédiatement. Sous Windows, la meilleure prise en charge passe par WSL2.

### Activation

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw crée un répertoire d’accueil QMD autonome sous
`~/.openclaw/agents/<agentId>/qmd/` et gère automatiquement le cycle de vie
du moteur auxiliaire : les collections, les mises à jour et les exécutions d’embedding sont prises en charge.
Il privilégie les formats actuels des collections QMD et des requêtes MCP, mais se rabat si nécessaire sur
d’autres options de motif de collection et sur d’anciens noms d’outils MCP.
La réconciliation au démarrage recrée également les collections gérées obsolètes conformément à leurs
motifs canoniques lorsqu’une ancienne collection QMD portant le même nom est encore
présente.

## Fonctionnement du moteur auxiliaire

- OpenClaw crée des collections à partir des fichiers de mémoire de votre espace de travail et de tous les
  `memory.qmd.paths` configurés, puis exécute `qmd update` à l’ouverture du gestionnaire QMD
  et périodiquement par la suite (`memory.qmd.update.interval`, valeur par défaut :
  `5m`). Les actualisations passent par des sous-processus QMD, et non par une analyse
  du système de fichiers dans le processus. Les modes de recherche sémantique exécutent également `qmd embed`
  (`memory.qmd.update.embedInterval`, valeur par défaut : `60m`).
- La collection par défaut de l’espace de travail suit `MEMORY.md` ainsi que l’arborescence `memory/`.
  Le fichier `memory.md` en minuscules n’est pas indexé comme fichier de mémoire racine.
- Le propre analyseur de QMD ignore les chemins cachés et les répertoires courants de dépendances ou de compilation,
  tels que `.git`, `.cache`, `node_modules`, `vendor`, `dist` et
  `build`. Par défaut, le démarrage du Gateway n’initialise pas QMD
  (`memory.qmd.update.startup` vaut `off` par défaut) ; un démarrage à froid évite donc
  d’importer le runtime de mémoire ou de créer l’observateur persistant avant
  la première utilisation de la mémoire.
- Définissez `memory.qmd.update.startup` sur `idle` ou `immediate` pour initialiser malgré tout QMD
  au démarrage du Gateway. `memory.qmd.update.onBoot` vaut `true` par défaut et
  exécute l’actualisation initiale au démarrage ; définissez-le sur `false` pour ignorer cette
  actualisation immédiate (le gestionnaire persistant s’ouvre tout de même lorsque des intervalles
  de mise à jour ou d’embedding sont configurés, de sorte que QMD continue de gérer son observateur et ses minuteurs réguliers).
- Les recherches utilisent le `searchMode` configuré (valeur par défaut : `search` ; prend également en charge
  `vsearch` et `query`). `search` utilise uniquement BM25 ; dans ce mode, OpenClaw ignore donc les
  vérifications de disponibilité des vecteurs sémantiques et la maintenance des embeddings. Si un mode
  échoue, OpenClaw réessaie avec `qmd query`.
- Lorsque `searchMode` vaut `query`, définissez `memory.qmd.rerank` sur `false` pour utiliser
  le chemin de requête hybride de QMD sans le reclasseur (nécessite QMD 2.1 ou version ultérieure).
  OpenClaw transmet `--no-rerank` au chemin direct de la CLI QMD et
  `rerank: false` à l’outil de requête MCP de QMD.
- Avec les versions de QMD qui annoncent des filtres multic Collections, OpenClaw regroupe
  les collections de même source dans un seul appel de recherche QMD. Les anciennes versions de QMD
  conservent le repli compatible par collection.
- Si QMD échoue complètement, OpenClaw se rabat sur le moteur SQLite intégré.
  Après un échec d’ouverture, les tentatives répétées lors des tours de conversation temporisent brièvement afin qu’un
  binaire manquant ou une dépendance défaillante du moteur auxiliaire ne provoque pas une avalanche de nouvelles tentatives ;
  `openclaw memory status` et les sondes ponctuelles de la CLI revérifient tout de même QMD
  directement.

<Info>
La première recherche peut être lente : QMD télécharge automatiquement des modèles GGUF (~2 GB) pour
le reclassement et l’expansion des requêtes lors de la première exécution de `qmd query`.
</Info>

## Performances et compatibilité de la recherche

OpenClaw maintient la compatibilité du chemin de recherche QMD avec les installations
actuelles comme anciennes de QMD.

Au démarrage, OpenClaw vérifie une fois par gestionnaire le texte d’aide de la version installée de QMD. Si
le binaire annonce la prise en charge de plusieurs filtres de collection, OpenClaw
recherche dans toutes les collections de même source avec une seule commande :

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Cela évite de démarrer un sous-processus QMD par collection de mémoire persistante.
Les collections de transcriptions de session restent dans leur propre groupe de sources, de sorte que les recherches
combinant `memory` et `sessions` fournissent toujours au mécanisme de diversification des résultats des entrées provenant
des deux sources.

Les anciennes versions de QMD n’acceptent qu’un seul filtre de collection. Lorsque OpenClaw détecte l’une
de ces versions, il conserve le chemin de compatibilité et recherche séparément dans chaque collection
avant de fusionner et de dédupliquer les résultats.

Pour inspecter manuellement le contrat installé, exécutez :

```bash
qmd --help | grep -i collection
```

L’aide actuelle de QMD mentionne le ciblage d’une ou de plusieurs collections. L’ancienne aide
décrit généralement une seule collection.

## Remplacement des modèles

Les variables d’environnement des modèles QMD sont transmises sans modification depuis le processus
du Gateway ; vous pouvez donc ajuster QMD globalement sans ajouter de nouvelle configuration OpenClaw :

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Après avoir modifié le modèle d’embedding, réexécutez les embeddings afin que l’index corresponde au
nouvel espace vectoriel.

## Indexation de chemins supplémentaires

Indiquez à QMD des répertoires supplémentaires afin de pouvoir y effectuer des recherches :

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
les résultats de recherche. `memory_get` comprend ce préfixe et lit depuis la
racine de collection appropriée.

## Indexation des transcriptions de session

Activez l’indexation des sessions pour retrouver des conversations antérieures. QMD nécessite à la fois la
source de session générale `memorySearch` et l’exportateur de transcriptions QMD :

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

Les transcriptions sont exportées sous forme de tours Utilisateur/Assistant assainis dans une collection QMD
dédiée sous `~/.openclaw/agents/<id>/qmd/sessions/`. Définir uniquement
`memorySearch.experimental.sessionMemory` n’exporte pas les transcriptions vers
QMD.

Les résultats de session restent filtrés par
[`tools.sessions.visibility`](/fr/gateway/config-tools#toolssessions). La visibilité
`tree` par défaut n’expose pas les sessions non liées d’un même agent. Si une
session distribuée par le Gateway doit pouvoir être retrouvée depuis une session de message privé distincte,
définissez volontairement `tools.sessions.visibility: "agent"`.

## Portée de la recherche

Par défaut, les résultats de recherche QMD ne sont affichés que dans les sessions directes, et non
dans les conversations de groupe ou de canal. Configurez `memory.qmd.scope` pour modifier ce comportement :

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

L’extrait ci-dessus correspond à la règle par défaut réelle. Lorsque la portée refuse une recherche,
OpenClaw consigne un avertissement avec le canal et le type de conversation déduits afin de faciliter
le diagnostic des résultats vides.

## Citations

Lorsque `memory.citations` vaut `auto` ou `on`, un pied de page
`Source: <path>#L<line>` (ou `#L<start>-L<end>`) est ajouté aux extraits de recherche. En mode `auto`,
le pied de page n’est ajouté que pour les sessions de conversation directe. Définissez
`memory.citations = "off"` pour omettre le pied de page tout en transmettant le chemin à
l’agent en interne.

## Quand l’utiliser

Choisissez QMD si vous avez besoin des fonctionnalités suivantes :

- Reclassement pour des résultats de meilleure qualité.
- Recherche dans la documentation ou les notes d’un projet situées hors de l’espace de travail.
- Rappel de conversations de sessions antérieures.
- Recherche entièrement locale sans clé d’API.

Pour les configurations plus simples, le [moteur intégré](/fr/concepts/memory-builtin) fonctionne bien
sans dépendance supplémentaire.

## Dépannage

**QMD introuvable ?** Assurez-vous que le binaire se trouve dans le `PATH` du Gateway. Si OpenClaw
s’exécute en tant que service, créez un lien symbolique :
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Si `qmd --version` fonctionne dans votre shell, mais qu’OpenClaw signale toujours
`spawn qmd ENOENT`, le processus du Gateway utilise probablement un `PATH` différent de celui
de votre shell interactif. Indiquez explicitement le binaire :

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

**Première recherche très lente ?** QMD télécharge les modèles GGUF lors de la première utilisation. Préchauffez-le
avec `qmd query "test"` en utilisant les mêmes répertoires XDG qu’OpenClaw.

**De nombreux sous-processus QMD pendant une recherche ?** Mettez QMD à jour si possible. OpenClaw
n’utilise qu’un seul processus pour les recherches multic Collections de même source lorsque la
version installée de QMD annonce la prise en charge de plusieurs filtres `-c` ; sinon, il
conserve l’ancien repli par collection pour garantir l’exactitude.

**QMD en mode BM25 uniquement essaie toujours de compiler llama.cpp ?** Définissez
`memory.qmd.searchMode = "search"`. OpenClaw traite ce mode comme
purement lexical, ignore les vérifications d’état vectoriel et la maintenance des embeddings de QMD, et
réserve les contrôles de disponibilité sémantique aux configurations `vsearch` ou `query`.

**La recherche expire ?** Augmentez `memory.qmd.limits.timeoutMs` (valeur par défaut : 4000ms).
Définissez une valeur supérieure, par exemple `120000`, pour le matériel plus lent. Cette limite s’applique aux
propres commandes de recherche de QMD lors des appels `memory_search` de l’agent ; la configuration, la synchronisation,
le repli sur le moteur intégré et les travaux sur les corpus supplémentaires conservent leurs propres délais plus courts.

**Résultats vides dans les conversations de groupe ou de canal ?** Ce comportement est attendu avec la
valeur `memory.qmd.scope` par défaut, qui autorise uniquement les sessions directes. Ajoutez une règle
`allow` pour les types de conversation `group` ou `channel` si vous souhaitez y obtenir des résultats QMD.

**La recherche dans la mémoire racine est soudainement devenue trop large ?** Redémarrez le Gateway ou attendez
la prochaine réconciliation au démarrage. OpenClaw recrée les collections gérées obsolètes conformément aux
motifs canoniques `MEMORY.md` et `memory/` lorsqu’il détecte un conflit de noms.

**Des dépôts temporaires visibles depuis l’espace de travail provoquent `ENAMETOOLONG` ou perturbent l’indexation ?**
Le parcours QMD suit l’analyseur QMD sous-jacent plutôt que les règles de liens symboliques
du moteur intégré d’OpenClaw. Conservez les extractions temporaires de monorepos dans des
répertoires cachés tels que `.tmp/` ou hors des racines indexées par QMD jusqu’à ce que QMD propose
un parcours protégé contre les cycles ou des contrôles d’exclusion explicites.

## Configuration

Pour la surface de configuration complète (`memory.qmd.*`), les modes de recherche, les intervalles de mise à jour,
les règles de portée et tous les autres paramètres, consultez la
[référence de configuration de la mémoire](/fr/reference/memory-config).

## Pages connexes

- [Présentation de la mémoire](/fr/concepts/memory)
- [Moteur de mémoire intégré](/fr/concepts/memory-builtin)
- [Mémoire Honcho](/fr/concepts/memory-honcho)
