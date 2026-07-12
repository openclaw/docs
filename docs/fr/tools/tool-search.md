---
read_when:
    - Vous souhaitez que les agents OpenClaw utilisent un vaste catalogue d’outils sans ajouter le schéma de chaque outil au prompt
    - Vous souhaitez que les outils OpenClaw, les outils MCP et les outils clients soient accessibles via une interface d’exécution unique et compacte
    - Vous implémentez ou déboguez la découverte des outils pour les exécutions d’OpenClaw
summary: 'Recherche d’outils : compacter les vastes catalogues d’outils OpenClaw derrière les opérations de recherche, de description et d’appel'
title: Recherche d’outils
x-i18n:
    generated_at: "2026-07-12T03:11:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6608a2de3b8ec03d3bb182d5909bb73429f623af8cebb34bc38856cb9d8b8c32
    source_path: tools/tool-search.md
    workflow: 16
---

La recherche d’outils est une fonctionnalité expérimentale de l’environnement d’exécution des agents OpenClaw. Elle offre aux agents un moyen compact unique de découvrir et d’appeler de vastes catalogues d’outils. Elle est utile lorsque l’exécution dispose de nombreux outils, mais que le modèle ne devrait en utiliser que quelques-uns.

Cette page documente la recherche d’outils OpenClaw. Elle ne concerne pas la recherche d’outils ni la surface d’outils dynamiques natives de Codex. Le mode code natif de Codex, la recherche d’outils, les outils dynamiques différés et les appels d’outils imbriqués sont des surfaces stables du harnais Codex et ne dépendent pas de `tools.toolSearch`.

Lorsque cette fonctionnalité est activée pour les exécutions OpenClaw, le modèle reçoit par défaut un outil `tool_search_code`, ainsi que tous les outils exclusivement directs dont les résultats structurés ne peuvent pas franchir le pont compact. L’outil de code exécute un court corps JavaScript dans un sous-processus Node isolé avec un pont `openclaw.tools` :

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Le catalogue peut inclure les outils OpenClaw admissibles au catalogue, les outils de Plugin, les outils MCP et les outils fournis par le client. Le modèle ne voit pas initialement tous les schémas catalogués. Il recherche plutôt des descripteurs compacts, obtient la description d’un outil sélectionné lorsqu’il a besoin du schéma exact, puis appelle cet outil par l’intermédiaire d’OpenClaw. Les outils exclusivement directs restent visibles par le modèle et ne sont pas ajoutés au catalogue.

Les exécutions du harnais Codex ne reçoivent pas ces contrôles expérimentaux de recherche d’outils OpenClaw. OpenClaw transmet les capacités du produit à Codex sous forme d’outils dynamiques, tandis que Codex gère le mode code natif stable, la recherche d’outils native, les outils dynamiques différés et les appels d’outils imbriqués.

## Déroulement d’un tour

Lors de la planification, l’exécuteur intégré OpenClaw construit le catalogue effectif de l’exécution :

1. Résoudre la politique d’outils active pour l’agent, le profil, le bac à sable et la session.
2. Répertorier les outils OpenClaw et de Plugin admissibles.
3. Répertorier les outils MCP admissibles par l’intermédiaire de l’environnement d’exécution MCP de la session.
4. Ajouter les outils client admissibles fournis pour l’exécution en cours.
5. Garder les outils exclusivement directs visibles par le modèle et indexer les descripteurs compacts des autres outils admissibles au catalogue.
6. Exposer le pont de code OpenClaw, les outils structurés de repli ou la surface d’annuaire compacte avec ces outils exclusivement directs.

Lors de l’exécution, chaque appel d’outil réel revient à OpenClaw. L’environnement d’exécution Node isolé ne contient ni implémentations de Plugin, ni objets clients MCP, ni secrets. `openclaw.tools.call(...)` franchit le pont pour revenir dans le Gateway, où les mécanismes habituels de politique, d’approbation, de hook, de journalisation et de traitement des résultats continuent de s’appliquer.

## Modes

`tools.toolSearch` propose trois modes visibles par le modèle :

- `code` : expose `tool_search_code`, le pont JavaScript compact par défaut, avec les outils exclusivement directs.
- `tools` : expose `tool_search`, `tool_describe` et `tool_call` sous forme d’outils structurés simples pour les fournisseurs qui ne doivent pas recevoir de code, avec les outils exclusivement directs.
- `directory` : expose `tool_search`, `tool_describe` et `tool_call`, ainsi qu’un annuaire borné dans le prompt contenant les noms et descriptions des outils disponibles, pour les fournisseurs qui doivent voir les noms des outils sans recevoir tous leurs schémas complets. OpenClaw peut également exposer directement un petit ensemble borné de schémas d’outils probables ou requis pour le tour en cours. Les outils exclusivement directs restent également visibles dans ce mode.

Tous les modes utilisent le même catalogue filtré par les politiques et le même chemin d’exécution OpenClaw normal. Les outils marqués `catalogMode: "direct-only"` restent hors de ce catalogue et demeurent visibles par le modèle. Si l’environnement d’exécution actuel ne peut pas lancer le processus enfant Node isolé du mode code, le mode `code` par défaut se replie sur `tools` avant la Compaction du catalogue. En mode `directory`, les outils fournis par le client restent directement visibles pour l’exécution en cours, tandis que les outils OpenClaw, les outils de Plugin et les outils MCP peuvent être compactés derrière le catalogue de l’annuaire. Un appel direct utilisant le nom exact d’un outil masqué dans l’annuaire est chargé depuis ce même catalogue autorisé avant l’exécution.

Tous les modes sont expérimentaux. Préférez l’exposition directe des outils pour les petits catalogues d’outils OpenClaw, et les surfaces natives stables de Codex pour les exécutions du harnais Codex.

Il n’existe aucune configuration distincte de sélection des sources. Lorsque la recherche d’outils est activée, le catalogue inclut les outils OpenClaw, MCP et client admissibles au catalogue après l’application normale des politiques ; les outils exclusivement directs sont conservés séparément.

## Raison d’être

Les grands catalogues sont utiles, mais coûteux. L’envoi de chaque schéma d’outil au modèle augmente la taille de la requête, ralentit la planification et accroît le risque de sélection accidentelle d’un outil.

La recherche d’outils modifie cette organisation :

- outils directs : le modèle voit chaque schéma sélectionné avant le premier jeton
- mode code de la recherche d’outils : le modèle voit un outil de code compact, un court contrat d’API et tous les outils exclusivement directs
- mode outils de la recherche d’outils : le modèle voit trois outils structurés compacts de repli, ainsi que tous les outils exclusivement directs
- mode annuaire de la recherche d’outils : le modèle voit un annuaire borné, des contrôles de recherche, de description et d’appel, ainsi qu’un petit ensemble borné de schémas probables ou requis, en plus de tous les outils exclusivement directs
- pendant le tour : le modèle peut charger les schémas restants selon ses besoins

L’exposition directe des outils reste le bon choix par défaut pour les petits catalogues. La recherche d’outils est particulièrement adaptée lorsqu’une exécution peut accéder à de nombreux outils, notamment ceux provenant de serveurs MCP ou les outils d’application fournis par le client.

## API

`openclaw.tools.search(query, options?)`

Recherche dans le catalogue effectif de l’exécution en cours. Les résultats sont compacts et peuvent être réinsérés sans risque dans le contexte du prompt.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

Charge les métadonnées complètes d’un résultat de recherche, y compris le schéma d’entrée exact.

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

Appelle un outil sélectionné par l’intermédiaire d’OpenClaw.

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planning",
  start: "2026-05-09T14:00:00Z",
});
```

Le mode structuré de repli expose les mêmes opérations sous forme d’outils :

- `tool_search`
- `tool_describe`
- `tool_call`

Le mode annuaire expose :

- `tool_search`
- `tool_describe`
- `tool_call`

Il conserve également les outils fournis par le client et tous les outils exclusivement directs comme directement visibles, et peut exposer directement un petit ensemble borné de schémas d’outils du catalogue probables ou requis pour le tour en cours. Si l’annuaire borné omet des entrées, utilisez `tool_search` pour les trouver. Si le modèle demande directement le nom exact d’un outil masqué dans l’annuaire, OpenClaw le charge depuis le catalogue autorisé avant l’exécution normale.
En mode annuaire, les noms des outils client ne doivent pas entrer en collision avec ceux des outils OpenClaw, de Plugin ou MCP, car la distribution différée exacte utilise ces noms.

## Limite de l’environnement d’exécution

Le pont de code s’exécute dans un sous-processus Node de courte durée. Le sous-processus démarre avec le mode d’autorisations de Node activé, un environnement vide, aucun accès accordé au système de fichiers ou au réseau, et aucune autorisation de créer des processus enfants ou des workers. OpenClaw impose un délai d’expiration en temps réel dans le processus parent et termine le sous-processus à son expiration, y compris après des continuations asynchrones.

L’environnement d’exécution expose uniquement :

- `console.log`, `console.warn` et `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Le comportement normal d’OpenClaw continue de s’appliquer aux appels finaux :

- politiques d’autorisation et de refus des outils
- restrictions d’outils propres à chaque agent et à chaque bac à sable
- politique d’outils du canal et de l’environnement d’exécution
- hooks d’approbation
- hooks `before_tool_call` des Plugins
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

Ajustez le délai d’expiration du mode code et les limites des résultats de recherche (les valeurs indiquées sont celles par défaut) :

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

L’environnement d’exécution limite `codeTimeoutMs` à 1000-60000, `maxSearchLimit` à 1-50 et `searchDefaultLimit` à 1..`maxSearchLimit`.

Pour désactiver la fonctionnalité :

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt et télémétrie

La recherche d’outils enregistre suffisamment de données de télémétrie pour permettre sa comparaison avec l’exposition directe des outils :

- nombre total d’octets sérialisés des outils et du prompt envoyés au harnais
- taille du catalogue et répartition par source
- nombre de recherches, de descriptions et d’appels
- appels d’outils finaux exécutés par l’intermédiaire d’OpenClaw
- identifiants et sources des outils sélectionnés

Les journaux de session doivent permettre de déterminer :

- combien de schémas d’outils le modèle a vus initialement
- combien d’opérations de recherche et de description il a effectuées
- quel outil final a été appelé
- si le résultat provenait d’OpenClaw, de MCP ou d’un outil client

## Validation E2E

Le scénario Gateway du laboratoire d’assurance qualité valide les deux chemins avec l’environnement d’exécution OpenClaw :

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

Il crée un faux Plugin temporaire doté d’un vaste catalogue d’outils, démarre le fournisseur OpenAI simulé, démarre une fois un Gateway en mode direct et une fois avec la recherche d’outils activée, puis compare les charges utiles des requêtes adressées au fournisseur et les journaux de session.

La régression démontre que :

1. Le mode direct peut appeler l’outil du faux Plugin.
2. La recherche d’outils peut appeler le même outil du faux Plugin.
3. Le mode direct expose directement les schémas des outils du faux Plugin au fournisseur.
4. La recherche d’outils expose uniquement le pont compact et tous les outils exclusivement directs.
5. La charge utile de la requête de recherche d’outils est plus petite pour le vaste faux catalogue.
6. Les journaux de session présentent le nombre attendu d’appels d’outils et les données de télémétrie des appels passant par le pont.

## Comportement en cas d’échec

La recherche d’outils doit échouer de manière fermée :

- si un outil ne fait pas partie de la politique effective, la recherche ne doit pas le renvoyer
- si un outil sélectionné devient indisponible, `tool_call` doit échouer
- si une politique ou une approbation bloque l’exécution, le résultat de l’appel doit signaler ce blocage au lieu de le contourner
- si le pont de code ne peut pas créer un environnement d’exécution isolé, utilisez `mode: "tools"` ou désactivez la recherche d’outils pour ce déploiement

## Pages connexes

- [Outils et Plugins](/fr/tools)
- [Bac à sable multi-agent et outils](/fr/tools/multi-agent-sandbox-tools)
- [Outil d’exécution](/fr/tools/exec)
- [Configuration des agents ACP](/fr/tools/acp-agents-setup)
- [Création de Plugins](/fr/plugins/building-plugins)
