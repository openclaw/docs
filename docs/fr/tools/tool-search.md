---
read_when:
    - Vous voulez que les agents Pi utilisent un vaste catalogue d’outils sans ajouter chaque schéma d’outil à l’invite
    - Vous souhaitez que les outils OpenClaw, les outils MCP et les outils client soient exposés via une seule surface PI compacte
    - Vous implémentez ou déboguez la découverte des outils pour les exécutions PI
summary: 'Recherche d’outils : compacter les grands catalogues d’outils PI derrière search, describe et call'
title: Recherche d’outils
x-i18n:
    generated_at: "2026-05-11T21:01:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 410f21a4d56af163d03023f7280469e55e17e8296ee16f7b12cc2589494d0a0c
    source_path: tools/tool-search.md
    workflow: 16
---

La Recherche d’outils est une fonctionnalité expérimentale d’agent PI d’OpenClaw. Elle donne aux agents PI un moyen compact de découvrir et d’appeler de grands catalogues d’outils. Elle est utile lorsque l’exécution dispose de nombreux outils disponibles, mais que le modèle n’a probablement besoin que de quelques-uns d’entre eux.

Cette page documente la Recherche d’outils PI d’OpenClaw. Il ne s’agit pas de la recherche d’outils native de Codex ni de la surface d’outils dynamiques. Le mode code natif de Codex, la recherche d’outils, les outils dynamiques différés et les appels d’outils imbriqués sont des surfaces stables du harnais Codex et ne dépendent pas de `tools.toolSearch`.

Lorsqu’elle est activée pour PI, le modèle reçoit par défaut un outil `tool_search_code`. Cet outil exécute un court corps JavaScript dans un sous-processus Node isolé avec un pont `openclaw.tools` :

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Le catalogue peut inclure des outils OpenClaw, des outils de Plugin, des outils MCP et des outils fournis par le client. Le modèle ne voit pas chaque schéma complet dès le départ. À la place, il recherche des descripteurs compacts, décrit un outil sélectionné lorsqu’il a besoin du schéma exact, puis appelle cet outil via OpenClaw.

Les exécutions du harnais Codex ne reçoivent pas ces contrôles expérimentaux de Recherche d’outils OpenClaw. OpenClaw transmet les capacités produit à Codex sous forme d’outils dynamiques, et Codex possède le mode code natif stable, la recherche d’outils native, les outils dynamiques différés et les appels d’outils imbriqués.

## Déroulement d’un tour

Au moment de la planification, l’exécuteur intégré PI construit le catalogue effectif pour l’exécution :

1. Résoudre la politique d’outils active pour l’agent, le profil, le sandbox et la session.
2. Lister les outils OpenClaw et de Plugin éligibles.
3. Lister les outils MCP éligibles via le runtime MCP de la session.
4. Ajouter les outils client éligibles fournis pour l’exécution actuelle.
5. Indexer les descripteurs compacts pour la recherche.
6. Exposer au modèle soit le pont de code PI, soit les outils de secours structurés.

Au moment de l’exécution, chaque appel d’outil réel revient à OpenClaw. Le runtime Node isolé ne conserve pas les implémentations de Plugins, les objets client MCP ni les secrets. `openclaw.tools.call(...)` traverse le pont pour revenir dans le Gateway, où la politique, l’approbation, les hooks, la journalisation et le traitement des résultats habituels s’appliquent toujours.

## Modes

`tools.toolSearch` dispose de deux modes visibles par le modèle :

- `code` : expose `tool_search_code`, le pont JavaScript compact par défaut.
- `tools` : expose `tool_search`, `tool_describe` et `tool_call` comme outils structurés simples pour les fournisseurs qui ne doivent pas recevoir de code.

Les deux modes utilisent le même catalogue et le même chemin d’exécution. La seule différence est la forme que voit le modèle. Si le runtime actuel ne peut pas lancer le processus enfant Node isolé du mode code, le mode `code` par défaut bascule vers `tools` avant la Compaction du catalogue.

Les deux modes sont expérimentaux. Préférez l’exposition directe des outils pour les petits catalogues d’outils PI, et préférez les surfaces stables natives de Codex pour les exécutions du harnais Codex.

Il n’existe pas de configuration distincte de sélection des sources. Lorsque la Recherche d’outils est activée, le catalogue inclut les outils OpenClaw, MCP et client éligibles après le filtrage normal par politique.

## Pourquoi cela existe

Les grands catalogues sont utiles, mais coûteux. Envoyer chaque schéma d’outil au modèle augmente la taille de la requête, ralentit la planification et accroît les risques de sélection accidentelle d’outils.

La Recherche d’outils modifie la forme :

- outils directs : le modèle voit chaque schéma sélectionné avant le premier jeton
- mode code de la Recherche d’outils : le modèle voit un outil de code compact et un court contrat d’API
- mode outils de la Recherche d’outils : le modèle voit trois outils de secours structurés compacts
- pendant le tour : le modèle ne charge que les schémas d’outils dont il a réellement besoin

L’exposition directe des outils reste le bon choix par défaut pour les petits catalogues. La Recherche d’outils est idéale lorsqu’une exécution peut voir de nombreux outils, en particulier depuis des serveurs MCP ou des outils d’application fournis par le client.

## API

`openclaw.tools.search(query, options?)`

Recherche dans le catalogue effectif de l’exécution actuelle. Les résultats sont compacts et peuvent être réinjectés sans risque dans le contexte de prompt.

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

Le mode de secours structuré expose les mêmes opérations sous forme d’outils :

- `tool_search`
- `tool_describe`
- `tool_call`

## Frontière d’exécution

Le pont de code s’exécute dans un sous-processus Node de courte durée. Le sous-processus démarre avec le mode permissions de Node activé, un environnement vide, aucune autorisation de système de fichiers ou de réseau, et aucune autorisation de processus enfant ou de worker. OpenClaw applique un délai d’expiration en temps réel côté processus parent et tue le sous-processus en cas de dépassement, y compris après les continuations asynchrones.

Le runtime expose uniquement :

- `console.log`, `console.warn` et `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Le comportement normal d’OpenClaw s’applique toujours aux appels finaux :

- politiques d’autorisation et de refus des outils
- restrictions d’outils par agent et par sandbox
- filtrage réservé au propriétaire
- hooks d’approbation
- hooks `before_tool_call` de Plugin
- identité de session, journaux et télémétrie

## Configuration

Activez la Recherche d’outils pour les exécutions PI avec le pont de code par défaut :

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

Utilisez plutôt les outils de secours structurés pour les exécutions PI :

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

Ajustez le délai d’expiration du mode code et les limites des résultats de recherche :

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

La Recherche d’outils enregistre suffisamment de télémétrie pour la comparer à l’exposition directe des outils :

- nombre total d’octets sérialisés d’outils et de prompt envoyés au harnais
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

L’exécuteur E2E du Gateway vérifie les deux chemins avec le harnais PI :

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

Il crée un faux Plugin temporaire avec un grand catalogue d’outils, démarre le fournisseur OpenAI simulé, démarre un Gateway une fois en mode direct puis une fois avec la Recherche d’outils activée, puis compare les charges utiles des requêtes fournisseur et les journaux de session.

La régression prouve que :

1. Le mode direct peut appeler le faux outil de Plugin.
2. La Recherche d’outils peut appeler le même faux outil de Plugin.
3. Le mode direct expose directement les schémas du faux outil de Plugin au fournisseur.
4. La Recherche d’outils expose uniquement le pont compact.
5. La charge utile de requête de la Recherche d’outils est plus petite pour le grand faux catalogue.
6. Les journaux de session affichent les nombres d’appels d’outils attendus et la télémétrie des appels via le pont.

## Comportement en cas d’échec

La Recherche d’outils doit échouer de manière fermée :

- si un outil ne figure pas dans la politique effective, la recherche ne doit pas le retourner
- si un outil sélectionné devient indisponible, `tool_call` doit échouer
- si la politique ou l’approbation bloque l’exécution, le résultat de l’appel doit signaler ce blocage au lieu de le contourner
- si le pont de code ne peut pas créer un runtime isolé, utilisez `mode: "tools"` ou désactivez la Recherche d’outils pour ce déploiement

## Connexe

- [Outils et Plugins](/fr/tools)
- [Sandbox multi-agent et outils](/fr/tools/multi-agent-sandbox-tools)
- [Outil exec](/fr/tools/exec)
- [Configuration des agents ACP](/fr/tools/acp-agents-setup)
- [Créer des Plugins](/fr/plugins/building-plugins)
