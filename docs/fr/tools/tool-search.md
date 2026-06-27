---
read_when:
    - Vous voulez que les agents OpenClaw utilisent un vaste catalogue d’outils sans ajouter chaque schéma d’outil au prompt
    - Vous voulez que les outils OpenClaw, les outils MCP et les outils client soient exposés via une seule surface d’exécution compacte
    - Vous implémentez ou déboguez la découverte d’outils pour les exécutions OpenClaw
summary: 'Recherche d’outils : compacter les grands catalogues d’outils OpenClaw derrière la recherche, la description et l’appel'
title: Recherche d’outils
x-i18n:
    generated_at: "2026-06-27T18:22:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23b46264bab307bbfdfeb1e358c566d498f3bcf77f187ba05d2ae319e115e1f4
    source_path: tools/tool-search.md
    workflow: 16
---

La recherche d’outils est une fonctionnalité expérimentale du runtime d’agent OpenClaw. Elle donne aux agents un moyen
compact de découvrir et d’appeler de grands catalogues d’outils. Elle est utile lorsque l’exécution
dispose de nombreux outils, mais que le modèle n’a probablement besoin que de quelques-uns.

Cette page documente la recherche d’outils OpenClaw. Il ne s’agit pas de la surface de recherche
d’outils ou d’outils dynamiques native à Codex. Le mode code natif à Codex, la recherche d’outils,
les outils dynamiques différés et les appels d’outils imbriqués sont des surfaces stables du harnais
Codex et ne dépendent pas de `tools.toolSearch`.

Lorsqu’elle est activée pour les exécutions OpenClaw, le modèle reçoit par défaut un outil `tool_search_code`.
Cet outil exécute un court corps JavaScript dans un sous-processus Node isolé
avec un pont `openclaw.tools` :

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Le catalogue peut inclure des outils OpenClaw, des outils de Plugin, des outils MCP et
des outils fournis par le client. Le modèle ne voit pas chaque schéma complet d’emblée.
À la place, il recherche des descripteurs compacts, décrit un outil sélectionné lorsqu’il
a besoin du schéma exact, puis appelle cet outil via OpenClaw.

Les exécutions du harnais Codex ne reçoivent pas ces contrôles expérimentaux de recherche d’outils OpenClaw.
OpenClaw transmet les capacités produit à Codex comme outils dynamiques, et
Codex possède le mode code natif stable, la recherche d’outils native, les outils dynamiques
différés et les appels d’outils imbriqués.

## Fonctionnement d’un tour

Au moment de la planification, le runner intégré OpenClaw construit le catalogue effectif pour
l’exécution :

1. Résoudre la politique d’outils active pour l’agent, le profil, le bac à sable et la session.
2. Lister les outils OpenClaw et de Plugin éligibles.
3. Lister les outils MCP éligibles via le runtime MCP de session.
4. Ajouter les outils client éligibles fournis pour l’exécution actuelle.
5. Indexer les descripteurs compacts pour la recherche.
6. Exposer au modèle le pont de code OpenClaw, les outils structurés de repli ou la
   surface d’annuaire compacte.

Au moment de l’exécution, chaque véritable appel d’outil revient à OpenClaw. Le runtime Node
isolé ne contient pas les implémentations de Plugin, les objets client MCP ni les secrets.
`openclaw.tools.call(...)` traverse le pont pour revenir dans le Gateway, où les
politiques, approbations, hooks, journaux et traitements de résultats normaux s’appliquent toujours.

## Modes

`tools.toolSearch` propose trois modes visibles par le modèle :

- `code` : expose `tool_search_code`, le pont JavaScript compact par défaut.
- `tools` : expose `tool_search`, `tool_describe` et `tool_call` comme outils
  structurés simples pour les fournisseurs qui ne doivent pas recevoir de code.
- `directory` : expose `tool_search`, `tool_describe` et `tool_call` ainsi qu’un
  annuaire borné dans le prompt avec les noms et descriptions des outils disponibles pour
  les fournisseurs qui doivent voir les noms d’outils sans chaque schéma complet. OpenClaw peut
  aussi exposer directement un petit ensemble borné de schémas d’outils probables ou requis
  pour le tour actuel.

Tous les modes utilisent le même catalogue filtré par politique et le chemin d’exécution
normal d’OpenClaw. Si le runtime actuel ne peut pas lancer le sous-processus Node isolé
du mode code, le mode `code` par défaut bascule vers `tools` avant la compaction
du catalogue. En mode `directory`, les outils fournis par le client restent directement visibles
pour l’exécution actuelle, tandis que les outils OpenClaw, les outils de Plugin et les outils MCP peuvent être
compactés derrière le catalogue d’annuaire. Un appel direct à un nom exact d’annuaire masqué
est hydraté depuis ce même catalogue autorisé avant l’exécution.

Tous les modes sont expérimentaux. Préférez l’exposition directe des outils pour les petits
catalogues d’outils OpenClaw, et préférez les surfaces stables natives à Codex pour les exécutions du harnais Codex.

Il n’existe pas de configuration séparée pour la sélection des sources. Lorsque la recherche d’outils est activée, le
catalogue inclut les outils OpenClaw, MCP et client éligibles après le filtrage normal
par politique.

## Pourquoi cela existe

Les grands catalogues sont utiles mais coûteux. Envoyer chaque schéma d’outil au modèle
augmente la taille de la requête, ralentit la planification et accroît le risque de sélection
accidentelle d’outil.

La recherche d’outils change la forme :

- outils directs : le modèle voit chaque schéma sélectionné avant le premier token
- mode code de recherche d’outils : le modèle voit un outil de code compact et un court contrat
  d’API
- mode tools de recherche d’outils : le modèle voit trois outils structurés de repli
  compacts
- mode directory de recherche d’outils : le modèle voit un annuaire borné ainsi que des contrôles
  de recherche/description/appel et un petit ensemble borné de schémas probables ou requis
- pendant le tour : le modèle peut charger les schémas restants au besoin

L’exposition directe des outils reste le bon comportement par défaut pour les petits catalogues. La recherche d’outils
est plus adaptée lorsqu’une exécution peut voir de nombreux outils, en particulier depuis des serveurs MCP ou
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

Le mode de repli structuré expose les mêmes opérations comme outils :

- `tool_search`
- `tool_describe`
- `tool_call`

Le mode annuaire expose :

- `tool_search`
- `tool_describe`
- `tool_call`

Il garde aussi les outils fournis par le client directement visibles et peut exposer directement un petit
ensemble borné de schémas d’outils de catalogue probables ou requis pour le tour actuel.
Si l’annuaire borné omet des entrées, utilisez `tool_search` pour les trouver. Si
le modèle demande directement un nom exact d’outil d’annuaire masqué, OpenClaw
l’hydrate depuis le catalogue autorisé avant l’exécution normale.
Les noms des outils client en mode annuaire ne doivent pas entrer en collision avec les noms d’outils OpenClaw, de Plugin ou MCP,
car le dispatch différé exact utilise ces noms.

## Frontière du runtime

Le pont de code s’exécute dans un sous-processus Node de courte durée. Le sous-processus démarre
avec le mode d’autorisations Node activé, un environnement vide, aucun accès accordé au système de fichiers ou
au réseau, et aucun accès accordé aux processus enfants ou aux workers. OpenClaw impose un
timeout horloge murale côté processus parent et tue le sous-processus en cas de timeout, y compris
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
- hooks `before_tool_call` de Plugin
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

Utilisez plutôt les outils structurés de repli pour les exécutions OpenClaw :

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

Utilisez plutôt la surface d’annuaire compacte pour les exécutions OpenClaw :

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

Ajustez le timeout du mode code et les limites de résultats de recherche :

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

La recherche d’outils enregistre suffisamment de télémétrie pour la comparer à l’exposition directe des outils :

- nombre total d’octets sérialisés d’outils et de prompt envoyés au harnais
- taille du catalogue et répartition par source
- nombres de recherches, descriptions et appels
- appels d’outils finaux exécutés via OpenClaw
- identifiants et sources des outils sélectionnés

Les journaux de session doivent permettre de répondre à ces questions :

- combien de schémas d’outils le modèle a vus d’emblée
- combien d’opérations de recherche et de description il a effectuées
- quel outil final a été appelé
- si le résultat provenait d’OpenClaw, de MCP ou d’un outil client

## Validation E2E

Le runner E2E du Gateway prouve les deux chemins avec le runtime OpenClaw :

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

Il crée un faux Plugin temporaire avec un grand catalogue d’outils, démarre le fournisseur
OpenAI simulé, démarre un Gateway une fois en mode direct et une fois avec la recherche d’outils
activée, puis compare les payloads de requête au fournisseur et les journaux de session.

La régression prouve que :

1. Le mode direct peut appeler le faux outil de Plugin.
2. La recherche d’outils peut appeler le même faux outil de Plugin.
3. Le mode direct expose directement au fournisseur les schémas du faux outil de Plugin.
4. La recherche d’outils expose uniquement le pont compact.
5. Le payload de requête de la recherche d’outils est plus petit pour le grand faux catalogue.
6. Les journaux de session affichent les nombres attendus d’appels d’outils et la télémétrie des appels relayés.

## Comportement en cas d’échec

La recherche d’outils doit échouer de manière fermée :

- si un outil n’est pas dans la politique effective, la recherche ne doit pas le retourner
- si un outil sélectionné devient indisponible, `tool_call` doit échouer
- si une politique ou une approbation bloque l’exécution, le résultat de l’appel doit signaler ce
  blocage au lieu de le contourner
- si le pont de code ne peut pas créer un runtime isolé, utilisez `mode: "tools"` ou
  désactivez la recherche d’outils pour ce déploiement

## Connexe

- [Outils et plugins](/fr/tools)
- [Bac à sable multi-agent et outils](/fr/tools/multi-agent-sandbox-tools)
- [Outil Exec](/fr/tools/exec)
- [Configuration des agents ACP](/fr/tools/acp-agents-setup)
- [Créer des plugins](/fr/plugins/building-plugins)
