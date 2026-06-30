---
read_when:
    - Vous voulez que les agents OpenClaw utilisent un vaste catalogue d’outils sans ajouter chaque schéma d’outil au prompt
    - Vous voulez exposer les outils OpenClaw, les outils MCP et les outils clients via une seule surface d’exécution compacte
    - Vous implémentez ou déboguez la découverte d’outils pour les exécutions OpenClaw
summary: 'Recherche d’outils : compacter les grands catalogues d’outils OpenClaw derrière la recherche, la description et l’appel'
title: Recherche d’outil
x-i18n:
    generated_at: "2026-06-30T14:02:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81036277d763be8040526b42c116b2e503589921a58b3f765ff38670554a751c
    source_path: tools/tool-search.md
    workflow: 16
---

La recherche d’outils est une fonctionnalité expérimentale du runtime d’agent OpenClaw. Elle donne aux agents un moyen
compact de découvrir et d’appeler de grands catalogues d’outils. Elle est utile lorsque l’exécution
dispose de nombreux outils disponibles, mais que le modèle n’a probablement besoin que de quelques-uns d’entre eux.

Cette page documente la recherche d’outils OpenClaw. Il ne s’agit pas de la surface de recherche
d’outils ou d’outils dynamiques native de Codex. Le mode code natif de Codex, la recherche d’outils,
les outils dynamiques différés et les appels d’outils imbriqués sont des surfaces stables du harness Codex et ne
dépendent pas de `tools.toolSearch`.

Lorsqu’elle est activée pour les exécutions OpenClaw, le modèle reçoit par défaut un outil
`tool_search_code`. Cet outil exécute un court corps JavaScript dans un sous-processus Node
isolé avec un pont `openclaw.tools` :

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Le catalogue peut inclure des outils OpenClaw, des outils de plugin, des outils MCP et
des outils fournis par le client. Le modèle ne voit pas chaque schéma complet dès le départ.
À la place, il recherche des descripteurs compacts, décrit un outil sélectionné lorsqu’il
a besoin du schéma exact, puis appelle cet outil via OpenClaw.

Les exécutions du harness Codex ne reçoivent pas ces contrôles expérimentaux de recherche d’outils
OpenClaw. OpenClaw transmet les capacités produit à Codex sous forme d’outils dynamiques, et
Codex possède le mode code natif stable, la recherche d’outils native, les outils dynamiques
différés et les appels d’outils imbriqués.

## Déroulement d’un tour

Au moment de la planification, le runner intégré OpenClaw construit le catalogue effectif pour
l’exécution :

1. Résoudre la politique d’outils active pour l’agent, le profil, le bac à sable et la session.
2. Lister les outils OpenClaw et de plugin éligibles.
3. Lister les outils MCP éligibles via le runtime MCP de session.
4. Ajouter les outils client éligibles fournis pour l’exécution actuelle.
5. Indexer des descripteurs compacts pour la recherche.
6. Exposer au modèle le pont de code OpenClaw, les outils de repli structurés ou la
   surface de répertoire compacte.

Au moment de l’exécution, chaque appel d’outil réel revient à OpenClaw. Le runtime Node
isolé ne contient pas les implémentations de plugins, les objets client MCP ni les secrets.
`openclaw.tools.call(...)` traverse le pont pour revenir dans le Gateway, où la
politique normale, l’approbation, les hooks, la journalisation et le traitement des résultats s’appliquent toujours.

## Modes

`tools.toolSearch` dispose de trois modes visibles par le modèle :

- `code` : expose `tool_search_code`, le pont JavaScript compact par défaut.
- `tools` : expose `tool_search`, `tool_describe` et `tool_call` comme outils
  structurés simples pour les fournisseurs qui ne doivent pas recevoir de code.
- `directory` : expose `tool_search`, `tool_describe` et `tool_call`, ainsi qu’un
  répertoire borné dans le prompt contenant les noms et descriptions des outils disponibles pour
  les fournisseurs qui doivent voir les noms des outils sans chaque schéma complet. OpenClaw peut
  aussi exposer directement un petit ensemble borné de schémas d’outils probables ou requis
  pour le tour actuel.

Tous les modes utilisent le même catalogue filtré par politique et le chemin d’exécution normal
d’OpenClaw. Si le runtime actuel ne peut pas lancer le processus enfant Node isolé
du mode code, le mode `code` par défaut bascule vers `tools` avant la compaction
du catalogue. En mode `directory`, les outils fournis par le client restent directement visibles
pour l’exécution actuelle, tandis que les outils OpenClaw, les outils de plugin et les outils MCP peuvent être
compactés derrière le catalogue de répertoire. Un appel direct à un nom exact masqué du
répertoire est hydraté depuis ce même catalogue autorisé avant l’exécution.

Tous les modes sont expérimentaux. Préférez l’exposition directe des outils pour les petits
catalogues d’outils OpenClaw, et préférez les surfaces stables natives de Codex pour les exécutions du harness Codex.

Il n’existe pas de configuration séparée pour la sélection des sources. Lorsque la recherche d’outils est activée, le
catalogue inclut les outils OpenClaw, MCP et client éligibles après le filtrage normal
par politique.

## Pourquoi cela existe

Les grands catalogues sont utiles mais coûteux. Envoyer chaque schéma d’outil au modèle
augmente la taille de la requête, ralentit la planification et accroît le risque de sélection
accidentelle d’outil.

La recherche d’outils change la forme :

- outils directs : le modèle voit chaque schéma sélectionné avant le premier jeton
- mode code de la recherche d’outils : le modèle voit un outil de code compact et un court contrat
  d’API
- mode outils de la recherche d’outils : le modèle voit trois outils de repli structurés compacts
- mode répertoire de la recherche d’outils : le modèle voit un répertoire borné, plus des contrôles
  de recherche/description/appel et un petit ensemble borné de schémas probables ou requis
- pendant le tour : le modèle peut charger les schémas restants selon les besoins

L’exposition directe des outils reste le bon choix par défaut pour les petits catalogues. La recherche d’outils
est préférable lorsqu’une exécution peut voir de nombreux outils, en particulier depuis des serveurs MCP ou
des outils d’application fournis par le client.

## API

`openclaw.tools.search(query, options?)`

Recherche dans le catalogue effectif de l’exécution actuelle. Les résultats sont compacts et sûrs
à réinjecter dans le contexte du prompt.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

Charge les métadonnées complètes d’un résultat de recherche, y compris le schéma d’entrée exact.

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

Appelle un outil sélectionné via OpenClaw.

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planning",
  start: "2026-05-09T14:00:00Z",
});
```

Le mode de repli structuré expose les mêmes opérations sous forme d’outils :

- `tool_search`
- `tool_describe`
- `tool_call`

Le mode répertoire expose :

- `tool_search`
- `tool_describe`
- `tool_call`

Il garde aussi les outils fournis par le client directement visibles et peut exposer directement un petit
ensemble borné de schémas d’outils de catalogue probables ou requis pour le tour
actuel. Si le répertoire borné omet des entrées, utilisez `tool_search` pour les trouver. Si
le modèle demande directement un nom exact d’outil de répertoire masqué, OpenClaw
l’hydrate depuis le catalogue autorisé avant l’exécution normale.
Les noms d’outils client en mode répertoire ne doivent pas entrer en collision avec les noms d’outils OpenClaw, de plugin ou MCP,
car la répartition différée exacte utilise ces noms.

## Limite du runtime

Le pont de code s’exécute dans un sous-processus Node de courte durée. Le sous-processus démarre
avec le mode d’autorisations Node activé, un environnement vide, aucune autorisation de système de fichiers ou
de réseau, et aucune autorisation de processus enfant ou de worker. OpenClaw applique un
délai d’expiration horloge murale côté processus parent et tue le sous-processus en cas d’expiration, y compris
après les continuations asynchrones.

Le runtime expose uniquement :

- `console.log`, `console.warn` et `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Le comportement normal d’OpenClaw s’applique toujours aux appels finaux :

- politiques d’autorisation et de refus d’outils
- restrictions d’outils par agent et par bac à sable
- politique d’outils de canal/runtime
- hooks d’approbation
- hooks de plugin `before_tool_call`
- identité de session, journaux et télémétrie

## Configuration

Activez la recherche d’outils pour les exécutions OpenClaw avec le pont de code par défaut :

```bash
openclaw config set tools.toolSearch true
```

JSON équivalent :

```json5
{
  tools: {
    toolSearch: true,
  },
}
```

Utilisez plutôt les outils de repli structurés pour les exécutions OpenClaw :

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

Utilisez plutôt la surface de répertoire compacte pour les exécutions OpenClaw :

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

Ajustez le délai d’expiration du mode code et les limites de résultats de recherche :

```json5
{
  tools: {
    toolSearch: {
      mode: "code",
      codeTimeoutMs: 10000,
      searchDefaultLimit: 8,
      maxSearchLimit: 20,
    },
  },
}
```

Désactivez-la :

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt et télémétrie

La recherche d’outils enregistre assez de télémétrie pour la comparer à l’exposition directe des outils :

- nombre total d’octets sérialisés d’outils et de prompt envoyés au harness
- taille du catalogue et répartition par source
- nombres de recherches, de descriptions et d’appels
- appels d’outils finaux exécutés via OpenClaw
- identifiants et sources des outils sélectionnés

Les journaux de session doivent permettre de répondre aux questions suivantes :

- combien de schémas d’outils le modèle a vus dès le départ
- combien d’opérations de recherche et de description il a effectuées
- quel outil final a été appelé
- si le résultat provenait d’OpenClaw, de MCP ou d’un outil client

## Validation E2E

Le scénario Gateway du QA Lab prouve les deux chemins avec le runtime OpenClaw :

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

Il crée un faux plugin temporaire avec un grand catalogue d’outils, démarre le fournisseur
OpenAI simulé, démarre un Gateway une fois en mode direct et une fois avec la recherche d’outils
activée, puis compare les charges utiles de requête fournisseur et les journaux de session.

La régression prouve que :

1. Le mode direct peut appeler l’outil du faux plugin.
2. La recherche d’outils peut appeler le même outil du faux plugin.
3. Le mode direct expose les schémas d’outils du faux plugin directement au fournisseur.
4. La recherche d’outils expose uniquement le pont compact.
5. La charge utile de requête de la recherche d’outils est plus petite pour le grand faux catalogue.
6. Les journaux de session affichent les nombres d’appels d’outils attendus et la télémétrie des appels via le pont.

## Comportement en cas d’échec

La recherche d’outils doit échouer de façon fermée :

- si un outil ne figure pas dans la politique effective, la recherche ne doit pas le renvoyer
- si un outil sélectionné devient indisponible, `tool_call` doit échouer
- si la politique ou l’approbation bloque l’exécution, le résultat de l’appel doit signaler ce
  blocage au lieu de le contourner
- si le pont de code ne peut pas créer de runtime isolé, utilisez `mode: "tools"` ou
  désactivez la recherche d’outils pour ce déploiement

## Connexe

- [Outils et plugins](/fr/tools)
- [Bac à sable multi-agent et outils](/fr/tools/multi-agent-sandbox-tools)
- [Outil Exec](/fr/tools/exec)
- [Configuration des agents ACP](/fr/tools/acp-agents-setup)
- [Création de plugins](/fr/plugins/building-plugins)
