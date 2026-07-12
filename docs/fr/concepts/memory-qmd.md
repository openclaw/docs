---
read_when:
    - Vous souhaitez configurer QMD comme backend de mémoire
    - Vous souhaitez des fonctionnalités de mémoire avancées, comme le reclassement ou des chemins indexés supplémentaires
summary: Service auxiliaire de recherche local-first avec BM25, vecteurs, reclassement et expansion de requête
title: Moteur de mémoire QMD
x-i18n:
    generated_at: "2026-07-12T15:16:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d4fc87c31835a6a1fdabbb271902334755b9801e51a5b2a3cb5525f1657e9317
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) est un moteur de recherche auxiliaire local qui s’exécute
aux côtés d’OpenClaw. Il combine BM25, la recherche vectorielle et le reclassement dans un seul
binaire, et peut indexer du contenu au-delà des fichiers de mémoire de votre espace de travail.

## Ce qu’il apporte par rapport au moteur intégré

- **Reclassement et expansion des requêtes** pour un meilleur rappel.
- **Indexation de répertoires supplémentaires** — documentation de projet, notes d’équipe, tout contenu sur disque.
- **Indexation des transcriptions de sessions** — retrouvez les conversations antérieures.
- **Entièrement local** — s’exécute avec le Plugin fournisseur officiel llama.cpp et
  télécharge automatiquement les modèles GGUF.
- **Repli automatique** — si QMD n’est pas disponible, OpenClaw se rabat de manière
  transparente sur le moteur intégré.

## Prise en main

### Prérequis

- Installez QMD : `npm install -g @tobilu/qmd` ou `bun install -g @tobilu/qmd`
- Une version de SQLite autorisant les extensions (`brew install sqlite` sous macOS).
- QMD doit se trouver dans le `PATH` du Gateway.
- macOS et Linux fonctionnent sans configuration supplémentaire. Windows est mieux pris en charge via WSL2.

### Activation

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw crée un environnement QMD autonome sous
`~/.openclaw/agents/<agentId>/qmd/` et gère automatiquement le cycle de vie
du moteur auxiliaire : les collections, les mises à jour et les exécutions d’intégration vectorielle sont prises en charge.
Il privilégie les formats actuels des collections QMD et des requêtes MCP, mais se rabat si nécessaire sur
d’autres indicateurs de motif de collection et d’anciens noms d’outils MCP.
La réconciliation au démarrage recrée également les collections gérées obsolètes selon leurs
motifs canoniques lorsqu’une ancienne collection QMD portant le même nom est encore
présente.

## Fonctionnement du moteur auxiliaire

- OpenClaw crée des collections à partir des fichiers de mémoire de votre espace de travail et des
  chemins `memory.qmd.paths` configurés, puis exécute `qmd update` à l’ouverture du gestionnaire QMD
  et périodiquement par la suite (`memory.qmd.update.interval`, valeur par défaut :
  `5m`). Les actualisations passent par des sous-processus QMD, et non par une
  analyse du système de fichiers dans le processus. Les modes de recherche sémantique exécutent également `qmd embed`
  (`memory.qmd.update.embedInterval`, valeur par défaut : `60m`).
- La collection par défaut de l’espace de travail suit `MEMORY.md` ainsi que l’arborescence `memory/`.
  Le fichier `memory.md` en minuscules n’est pas indexé comme fichier de mémoire racine.
- Le propre analyseur de QMD ignore les chemins cachés et les répertoires courants de dépendances ou de compilation
  tels que `.git`, `.cache`, `node_modules`, `vendor`, `dist` et
  `build`. Par défaut, le démarrage du Gateway n’initialise pas QMD
  (`memory.qmd.update.startup` vaut `off` par défaut), de sorte qu’un démarrage à froid évite
  d’importer l’environnement d’exécution de la mémoire ou de créer l’observateur persistant avant
  la première utilisation de la mémoire.
- Définissez `memory.qmd.update.startup` sur `idle` ou `immediate` pour initialiser tout de même QMD
  au démarrage du Gateway. `memory.qmd.update.onBoot` vaut `true` par défaut et
  exécute l’actualisation initiale au démarrage ; définissez-le sur `false` pour ignorer cette
  actualisation immédiate (le gestionnaire persistant s’ouvre quand même lorsque des intervalles de mise à jour ou d’intégration vectorielle
  sont configurés, de sorte que QMD continue de gérer son observateur et ses minuteries réguliers).
- Les recherches utilisent le `searchMode` configuré (valeur par défaut : `search` ; prend également en charge
  `vsearch` et `query`). `search` utilise uniquement BM25, OpenClaw ignore donc dans ce mode
  les vérifications de disponibilité vectorielle sémantique et la maintenance des intégrations vectorielles. Si un mode
  échoue, OpenClaw réessaie avec `qmd query`.
- Lorsque `searchMode` est défini sur `query`, définissez `memory.qmd.rerank` sur `false` pour utiliser
  le chemin de requête hybride de QMD sans le reclasseur (nécessite QMD 2.1 ou une version ultérieure).
  OpenClaw transmet `--no-rerank` au chemin direct de la CLI QMD et
  `rerank: false` à l’outil de requête MCP de QMD.
- Avec les versions de QMD qui annoncent des filtres multicolllection, OpenClaw regroupe
  les collections provenant de la même source dans une seule invocation de recherche QMD. Les anciennes versions de QMD
  conservent le repli compatible par collection.
- Si QMD échoue entièrement, OpenClaw se rabat sur le moteur SQLite intégré.
  Après un échec d’ouverture, les tentatives répétées lors des tours de discussion sont brièvement temporisées afin qu’un
  binaire manquant ou une dépendance défectueuse du moteur auxiliaire ne crée pas une tempête de nouvelles tentatives ;
  `openclaw memory status` et les sondes ponctuelles de la CLI revérifient toujours QMD
  directement.

<Info>
La première recherche peut être lente : QMD télécharge automatiquement des modèles GGUF (~2 GB) pour
le reclassement et l’expansion des requêtes lors de la première exécution de `qmd query`.
</Info>

## Performances et compatibilité de la recherche

OpenClaw maintient la compatibilité du chemin de recherche QMD avec les installations QMD
actuelles et plus anciennes.

Au démarrage, OpenClaw vérifie une fois par gestionnaire le texte d’aide de la version installée de QMD. Si
le binaire annonce la prise en charge de plusieurs filtres de collection, OpenClaw
recherche dans toutes les collections provenant de la même source à l’aide d’une seule commande :

```bash
qmd search "notes sur le routeur" --json -n 10 -c memory-root-main -c memory-dir-main
```

Cela évite de lancer un sous-processus QMD par collection de mémoire persistante.
Les collections de transcriptions de sessions restent dans leur propre groupe de sources, de sorte que les recherches
mixtes `memory` + `sessions` fournissent toujours au mécanisme de diversification des résultats des données provenant
des deux sources.

Les anciennes versions de QMD n’acceptent qu’un seul filtre de collection. Lorsqu’OpenClaw détecte l’une
de ces versions, il conserve le chemin de compatibilité et recherche séparément dans chaque collection
avant de fusionner et dédupliquer les résultats.

Pour inspecter manuellement le contrat installé, exécutez :

```bash
qmd --help | grep -i collection
```

L’aide actuelle de QMD mentionne le ciblage d’une ou plusieurs collections. L’ancienne aide
décrit généralement une seule collection.

## Remplacement des modèles

Les variables d’environnement des modèles QMD sont transmises sans modification depuis le processus du Gateway,
ce qui vous permet d’ajuster QMD globalement sans ajouter de nouvelle configuration OpenClaw :

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Après avoir modifié le modèle d’intégration vectorielle, réexécutez les intégrations afin que l’index corresponde au
nouvel espace vectoriel.

## Indexation de chemins supplémentaires

Indiquez à QMD des répertoires supplémentaires pour permettre leur recherche :

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

## Indexation des transcriptions de sessions

Activez l’indexation des sessions pour retrouver les conversations antérieures. QMD nécessite à la fois la
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
dédiée sous `~/.openclaw/agents/<id>/qmd/sessions/`. La seule définition de
`memorySearch.experimental.sessionMemory` n’exporte pas les transcriptions vers
QMD.

Les résultats de sessions sont toujours filtrés par
[`tools.sessions.visibility`](/fr/gateway/config-tools#toolssessions). La
visibilité `tree` par défaut n’expose pas les sessions sans lien du même agent. Si une
session distribuée par le Gateway doit pouvoir être retrouvée depuis une session de message privé distincte,
définissez délibérément `tools.sessions.visibility: "agent"`.

## Portée de la recherche

Par défaut, les résultats de recherche QMD ne sont présentés que dans les sessions directes, et non
dans les discussions de groupe ou de canal. Configurez `memory.qmd.scope` pour modifier ce comportement :

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
OpenClaw consigne un avertissement avec le canal et le type de discussion déterminés afin de faciliter
le débogage des résultats vides.

## Citations

Lorsque `memory.citations` vaut `auto` ou `on`, les extraits de recherche reçoivent un
pied de page `Source: <path>#L<line>` (ou `#L<start>-L<end>`). En mode `auto`,
le pied de page n’est ajouté que pour les sessions de discussion directe. Définissez
`memory.citations = "off"` pour omettre le pied de page tout en transmettant le chemin à
l’agent en interne.

## Quand l’utiliser

Choisissez QMD lorsque vous avez besoin :

- D’un reclassement pour obtenir des résultats de meilleure qualité.
- De rechercher dans la documentation ou les notes d’un projet en dehors de l’espace de travail.
- De retrouver des conversations de sessions antérieures.
- D’une recherche entièrement locale sans clé d’API.

Pour les configurations plus simples, le [moteur intégré](/fr/concepts/memory-builtin) fonctionne bien
sans dépendance supplémentaire.

## Dépannage

**QMD introuvable ?** Assurez-vous que le binaire se trouve dans le `PATH` du Gateway. Si OpenClaw
s’exécute en tant que service, créez un lien symbolique :
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Si `qmd --version` fonctionne dans votre shell mais qu’OpenClaw signale toujours
`spawn qmd ENOENT`, le processus du Gateway utilise probablement un `PATH` différent de
celui de votre shell interactif. Spécifiez explicitement le binaire :

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

**Première recherche très lente ?** QMD télécharge les modèles GGUF lors de la première utilisation. Préchargez-les
avec `qmd query "test"` en utilisant les mêmes répertoires XDG qu’OpenClaw.

**De nombreux sous-processus QMD pendant la recherche ?** Mettez QMD à jour si possible. OpenClaw
n’utilise qu’un seul processus pour les recherches multicolllection provenant de la même source lorsque la
version installée de QMD annonce la prise en charge de plusieurs filtres `-c` ; sinon, il
conserve l’ancien repli par collection pour garantir l’exactitude.

**QMD en mode BM25 uniquement essaie toujours de compiler llama.cpp ?** Définissez
`memory.qmd.searchMode = "search"`. OpenClaw traite ce mode comme
purement lexical, ignore les vérifications d’état vectoriel de QMD et la maintenance des intégrations vectorielles, et
réserve les contrôles de disponibilité sémantique aux configurations `vsearch` ou `query`.

**La recherche expire ?** Augmentez `memory.qmd.limits.timeoutMs` (valeur par défaut :
4000ms). Définissez une valeur plus élevée, par exemple `120000`, pour le matériel plus lent.

**Résultats vides dans les discussions de groupe ou de canal ?** Ce comportement est attendu avec la
valeur par défaut de `memory.qmd.scope`, qui n’autorise que les sessions directes. Ajoutez une
règle `allow` pour les types de discussion `group` ou `channel` si vous souhaitez y obtenir des résultats QMD.

**La recherche dans la mémoire racine est-elle soudainement devenue trop large ?** Redémarrez le Gateway ou attendez
la prochaine réconciliation au démarrage. OpenClaw recrée les collections gérées obsolètes
selon les motifs canoniques `MEMORY.md` et `memory/` lorsqu’il
détecte un conflit de noms identiques.

**Des dépôts temporaires visibles depuis l’espace de travail provoquent-ils `ENAMETOOLONG` ou une indexation défectueuse ?**
Le parcours de QMD suit l’analyseur QMD sous-jacent plutôt que les
règles de liens symboliques du moteur intégré d’OpenClaw. Conservez les extractions temporaires de monorepos dans des
répertoires cachés tels que `.tmp/` ou en dehors des racines QMD indexées jusqu’à ce que QMD fournisse
un parcours protégé contre les cycles ou des contrôles d’exclusion explicites.

## Configuration

Pour l’ensemble des options de configuration (`memory.qmd.*`), les modes de recherche, les intervalles de mise à jour,
les règles de portée et tous les autres paramètres, consultez la
[référence de configuration de la mémoire](/fr/reference/memory-config).

## Pages connexes

- [Présentation de la mémoire](/fr/concepts/memory)
- [Moteur de mémoire intégré](/fr/concepts/memory-builtin)
- [Mémoire Honcho](/fr/concepts/memory-honcho)
