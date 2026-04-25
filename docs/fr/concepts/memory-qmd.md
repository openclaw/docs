---
read_when:
    - Vous souhaitez configurer QMD comme backend de mémoire
    - Vous souhaitez des fonctionnalités de mémoire avancées comme le reranking ou des chemins indexés supplémentaires
summary: Sidecar de recherche local-first avec BM25, vecteurs, reranking et expansion de requête
title: Moteur de mémoire QMD
x-i18n:
    generated_at: "2026-04-25T13:45:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e6a5e0c8f5fb8507dffd08975fec0ca6fda03883079a27c2a28a1d09e95368
    source_path: concepts/memory-qmd.md
    workflow: 15
---

[QMD](https://github.com/tobi/qmd) est un sidecar de recherche local-first qui s’exécute
aux côtés d’OpenClaw. Il combine BM25, recherche vectorielle et reranking dans un seul
binaire, et peut indexer du contenu au-delà des fichiers mémoire de votre espace de travail.

## Ce qu’il ajoute par rapport au moteur intégré

- **Reranking et expansion de requête** pour un meilleur rappel.
- **Indexer des répertoires supplémentaires** -- documentation de projet, notes d’équipe, tout ce qui se trouve sur le disque.
- **Indexer les transcriptions de session** -- rappeler des conversations antérieures.
- **Entièrement local** -- fonctionne avec le package de runtime optionnel node-llama-cpp et
  télécharge automatiquement les modèles GGUF.
- **Repli automatique** -- si QMD n’est pas disponible, OpenClaw revient sans interruption au
  moteur intégré.

## Premiers pas

### Prérequis

- Installer QMD : `npm install -g @tobilu/qmd` ou `bun install -g @tobilu/qmd`
- Build SQLite autorisant les extensions (`brew install sqlite` sur macOS).
- QMD doit être sur le `PATH` de la Gateway.
- macOS et Linux fonctionnent immédiatement. Windows est mieux pris en charge via WSL2.

### Activer

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw crée un home QMD autonome sous
`~/.openclaw/agents/<agentId>/qmd/` et gère automatiquement le cycle de vie du sidecar
-- les collections, mises à jour et exécutions d’embedding sont prises en charge pour vous.
Il privilégie les formes actuelles de collection QMD et de requête MCP, mais revient quand même aux
anciens drapeaux de collection `--mask` et aux anciens noms d’outils MCP lorsque nécessaire.
La réconciliation au démarrage recrée aussi les collections gérées obsolètes selon leurs
modèles canoniques lorsqu’une ancienne collection QMD du même nom est encore
présente.

## Fonctionnement du sidecar

- OpenClaw crée des collections à partir de vos fichiers mémoire d’espace de travail et de tout
  `memory.qmd.paths` configuré, puis exécute `qmd update` + `qmd embed` au démarrage
  et périodiquement (par défaut toutes les 5 minutes).
- La collection d’espace de travail par défaut suit `MEMORY.md` ainsi que l’arborescence `memory/`.
  `memory.md` en minuscules n’est pas indexé comme fichier mémoire racine.
- L’actualisation au démarrage s’exécute en arrière-plan afin de ne pas bloquer le démarrage du chat.
- Les recherches utilisent le `searchMode` configuré (par défaut : `search` ; prend aussi en charge
  `vsearch` et `query`). Si un mode échoue, OpenClaw réessaie avec `qmd query`.
- Si QMD échoue complètement, OpenClaw revient au moteur SQLite intégré.

<Info>
La première recherche peut être lente -- QMD télécharge automatiquement des modèles GGUF (~2 Go) pour le
reranking et l’expansion de requête lors de la première exécution de `qmd query`.
</Info>

## Remplacements de modèle

Les variables d’environnement de modèle QMD sont transmises telles quelles depuis le processus
Gateway, vous pouvez donc ajuster QMD globalement sans ajouter de nouvelle configuration OpenClaw :

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Après avoir changé de modèle d’embedding, relancez les embeddings afin que l’index corresponde au
nouvel espace vectoriel.

## Indexation de chemins supplémentaires

Pointez QMD vers des répertoires supplémentaires pour les rendre interrogeables :

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
les résultats de recherche. `memory_get` comprend ce préfixe et lit à partir de la racine de collection
correcte.

## Indexation des transcriptions de session

Activez l’indexation des sessions pour rappeler des conversations antérieures :

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

Les transcriptions sont exportées comme tours User/Assistant assainis dans une collection QMD dédiée
sous `~/.openclaw/agents/<id>/qmd/sessions/`.

## Portée de la recherche

Par défaut, les résultats de recherche QMD sont exposés dans les sessions directes et de canal
(pas dans les groupes). Configurez `memory.qmd.scope` pour modifier cela :

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

Lorsque la portée refuse une recherche, OpenClaw journalise un avertissement avec le canal dérivé et
le type de chat afin que les résultats vides soient plus faciles à déboguer.

## Citations

Lorsque `memory.citations` vaut `auto` ou `on`, les extraits de recherche incluent un
pied de page `Source: <path#line>`. Définissez `memory.citations = "off"` pour omettre le pied de page
tout en transmettant le chemin à l’agent en interne.

## Quand l’utiliser

Choisissez QMD lorsque vous avez besoin :

- de reranking pour des résultats de meilleure qualité ;
- de rechercher dans la documentation du projet ou des notes en dehors de l’espace de travail ;
- de rappeler des conversations de session passées ;
- d’une recherche entièrement locale sans clés API.

Pour des configurations plus simples, le [moteur intégré](/fr/concepts/memory-builtin) fonctionne bien
sans dépendances supplémentaires.

## Dépannage

**QMD introuvable ?** Assurez-vous que le binaire est sur le `PATH` de la Gateway. Si OpenClaw
s’exécute comme service, créez un lien symbolique :
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**Première recherche très lente ?** QMD télécharge des modèles GGUF lors de la première utilisation. Préchargez-les
avec `qmd query "test"` en utilisant les mêmes répertoires XDG que ceux d’OpenClaw.

**La recherche expire ?** Augmentez `memory.qmd.limits.timeoutMs` (par défaut : 4000ms).
Définissez `120000` pour un matériel plus lent.

**Résultats vides dans les discussions de groupe ?** Vérifiez `memory.qmd.scope` -- la valeur par défaut
n’autorise que les sessions directes et de canal.

**La recherche mémoire racine est soudainement devenue trop large ?** Redémarrez la Gateway ou attendez
la prochaine réconciliation au démarrage. OpenClaw recrée les collections gérées obsolètes
selon les modèles canoniques `MEMORY.md` et `memory/` lorsqu’il détecte un conflit
de même nom.

**Des dépôts temporaires visibles depuis l’espace de travail provoquent `ENAMETOOLONG` ou une indexation défectueuse ?**
Le parcours QMD suit actuellement le comportement du scanner QMD sous-jacent plutôt que
les règles de liens symboliques intégrées d’OpenClaw. Conservez les checkouts temporaires de monorepos sous
des répertoires cachés comme `.tmp/` ou en dehors des racines QMD indexées jusqu’à ce que QMD expose
un parcours sûr face aux cycles ou des contrôles d’exclusion explicites.

## Configuration

Pour la surface de configuration complète (`memory.qmd.*`), les modes de recherche, les intervalles
de mise à jour, les règles de portée et tous les autres réglages, voir la
[référence de configuration Memory](/fr/reference/memory-config).

## Associé

- [Vue d’ensemble de Memory](/fr/concepts/memory)
- [Moteur de mémoire intégré](/fr/concepts/memory-builtin)
- [Mémoire Honcho](/fr/concepts/memory-honcho)
