---
read_when:
    - Vous souhaitez que les agents OpenClaw utilisent un vaste catalogue d’outils sans ajouter le schéma de chaque outil au prompt
    - Vous souhaitez que les outils OpenClaw, les outils MCP et les outils clients soient exposés via une surface d’exécution compacte et unifiée
    - Vous implémentez ou déboguez la découverte d’outils pour les exécutions OpenClaw
summary: 'Recherche d’outils : regroupez les vastes catalogues d’outils OpenClaw derrière des fonctions de recherche, de description et d’appel'
title: Recherche d’outils
x-i18n:
    generated_at: "2026-07-12T15:56:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6608a2de3b8ec03d3bb182d5909bb73429f623af8cebb34bc38856cb9d8b8c32
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search est une fonctionnalité expérimentale de l’environnement d’exécution des agents OpenClaw. Elle fournit aux agents un moyen compact unique de découvrir et d’appeler de vastes catalogues d’outils. Elle est utile lorsque l’exécution
dispose de nombreux outils, mais que le modèle n’est susceptible d’avoir besoin que de quelques-uns.

Cette page documente Tool Search d’OpenClaw. Il ne s’agit pas de la recherche
d’outils native de Codex ni de sa surface d’outils dynamiques. Le mode code natif de Codex, la recherche d’outils, les outils dynamiques différés et les appels d’outils imbriqués sont des surfaces stables du harnais Codex et ne dépendent
pas de `tools.toolSearch`.

Lorsque cette fonctionnalité est activée pour les exécutions OpenClaw, le modèle reçoit par défaut un outil `tool_search_code`,
ainsi que tous les outils à accès direct uniquement dont les résultats structurés ne peuvent pas transiter par
la passerelle compacte. L’outil de code exécute un court corps JavaScript dans un sous-processus
Node isolé avec une passerelle `openclaw.tools` :

```js
const hits = await openclaw.tools.search("créer un ticket GitHub");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Plantage au démarrage",
  body: "Étapes pour reproduire le problème...",
});
```

Le catalogue peut inclure les outils OpenClaw admissibles au catalogue, les outils de Plugin, les outils MCP
et les outils fournis par le client. Le modèle ne voit pas au préalable tous les schémas catalogués.
Il recherche plutôt des descripteurs compacts, décrit un outil sélectionné
lorsqu’il a besoin du schéma exact, puis appelle cet outil par l’intermédiaire d’OpenClaw.
Les outils à accès direct uniquement restent visibles par le modèle et ne sont pas ajoutés au catalogue.

Les exécutions du harnais Codex ne reçoivent pas ces contrôles expérimentaux Tool Search d’OpenClaw.
OpenClaw transmet les fonctionnalités du produit à Codex sous forme d’outils dynamiques, et
Codex gère le mode code natif stable, la recherche d’outils native, les outils dynamiques
différés et les appels d’outils imbriqués.

## Déroulement d’un tour

Lors de la planification, l’exécuteur intégré d’OpenClaw construit le catalogue effectif pour
l’exécution :

1. Résoudre la stratégie d’outils active pour l’agent, le profil, le bac à sable et la session.
2. Répertorier les outils OpenClaw et de Plugin admissibles.
3. Répertorier les outils MCP admissibles via l’environnement d’exécution MCP de la session.
4. Ajouter les outils clients admissibles fournis pour l’exécution en cours.
5. Maintenir les outils à accès direct uniquement visibles par le modèle et indexer les descripteurs compacts des
   autres outils admissibles au catalogue.
6. Exposer la passerelle de code OpenClaw, les outils structurés de repli ou la
   surface d’annuaire compacte en même temps que ces outils à accès direct uniquement.

Lors de l’exécution, chaque appel d’outil réel revient à OpenClaw. L’environnement d’exécution Node
isolé ne contient ni implémentations de Plugin, ni objets clients MCP, ni secrets.
`openclaw.tools.call(...)` repasse par la passerelle vers le Gateway, où les
mécanismes habituels de stratégie, d’approbation, de hooks, de journalisation et de traitement des résultats continuent de s’appliquer.

## Modes

`tools.toolSearch` comporte trois modes visibles par le modèle :

- `code` : expose `tool_search_code`, la passerelle JavaScript compacte par défaut,
  ainsi que les outils à accès direct uniquement.
- `tools` : expose `tool_search`, `tool_describe` et `tool_call` comme outils
  structurés simples pour les fournisseurs qui ne doivent pas recevoir de code, ainsi que
  les outils à accès direct uniquement.
- `directory` : expose `tool_search`, `tool_describe` et `tool_call`, ainsi qu’un
  annuaire limité dans le prompt contenant les noms et descriptions des outils disponibles pour
  les fournisseurs qui doivent voir les noms des outils sans disposer de tous leurs schémas complets. OpenClaw peut
  également exposer directement un petit ensemble limité de schémas d’outils probables ou requis
  pour le tour en cours. Les outils à accès direct uniquement restent également visibles dans ce mode.

Tous les modes utilisent le même catalogue filtré par stratégie et le même chemin d’exécution
OpenClaw habituel. Les outils marqués `catalogMode: "direct-only"` restent hors de ce catalogue et
demeurent visibles par le modèle. Si l’environnement d’exécution actuel ne peut pas lancer le sous-processus enfant Node isolé
du mode code, le mode `code` par défaut se replie sur `tools` avant la
Compaction du catalogue. En mode `directory`, les outils fournis par le client restent directement visibles
pour l’exécution en cours, tandis que les outils OpenClaw, les outils de Plugin et les outils MCP peuvent être
compactés derrière le catalogue d’annuaire. Un appel direct à un nom exact masqué
de l’annuaire est chargé depuis ce même catalogue autorisé avant l’exécution.

Tous les modes sont expérimentaux. Préférez l’exposition directe des outils pour les petits catalogues
d’outils OpenClaw, et les surfaces stables natives de Codex pour les exécutions du harnais Codex.

Il n’existe pas de configuration distincte pour la sélection des sources. Lorsque Tool Search est activé, le
catalogue inclut les outils OpenClaw, MCP et clients admissibles au catalogue après le filtrage
habituel par stratégie ; les outils à accès direct uniquement sont conservés séparément.

## Raison d’être

Les grands catalogues sont utiles, mais coûteux. L’envoi de chaque schéma d’outil au modèle
augmente la taille de la requête, ralentit la planification et accroît le risque de sélection
accidentelle d’un outil.

Tool Search modifie cette structure :

- outils directs : le modèle voit chaque schéma sélectionné avant le premier token
- mode code de Tool Search : le modèle voit un outil de code compact, un bref contrat d’API
  et tous les outils à accès direct uniquement
- mode outils de Tool Search : le modèle voit trois outils structurés compacts de repli,
  ainsi que tous les outils à accès direct uniquement
- mode annuaire de Tool Search : le modèle voit un annuaire limité, ainsi que les contrôles de
  recherche/description/appel et un petit ensemble limité de schémas probables ou requis,
  ainsi que tous les outils à accès direct uniquement
- pendant le tour : le modèle peut charger les schémas restants selon les besoins

L’exposition directe des outils reste le choix par défaut approprié pour les petits catalogues. Tool Search
convient surtout lorsqu’une exécution peut accéder à de nombreux outils, notamment depuis des serveurs MCP ou
des outils d’application fournis par le client.

## API

`openclaw.tools.search(query, options?)`

Recherche dans le catalogue effectif de l’exécution en cours. Les résultats sont compacts et peuvent être réinjectés
en toute sécurité dans le contexte du prompt.

```js
const hits = await openclaw.tools.search("événement de calendrier", { limit: 5 });
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
  summary: "Planification",
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

Il maintient également les outils fournis par le client et tous les outils à accès direct uniquement directement visibles,
et peut exposer directement un petit ensemble limité de schémas d’outils du catalogue probables ou requis
pour le tour en cours. Si l’annuaire limité omet des entrées, utilisez
`tool_search` pour les trouver. Si le modèle demande directement le nom exact d’un outil masqué
dans l’annuaire, OpenClaw le charge depuis le catalogue autorisé avant
l’exécution normale.
Les noms des outils clients en mode annuaire ne doivent pas entrer en conflit avec ceux des outils OpenClaw, de Plugin ou MCP,
car la répartition différée exacte utilise ces noms.

## Limite de l’environnement d’exécution

La passerelle de code s’exécute dans un sous-processus Node à courte durée de vie. Le sous-processus démarre
avec le mode d’autorisations de Node activé, un environnement vide, aucun accès accordé au système de fichiers ou
au réseau, et aucune autorisation de créer des processus enfants ou des workers. OpenClaw impose un
délai d’expiration en temps réel dans le processus parent et arrête le sous-processus à son expiration, y compris
après des continuations asynchrones.

L’environnement d’exécution expose uniquement :

- `console.log`, `console.warn` et `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Le comportement habituel d’OpenClaw continue de s’appliquer aux appels finaux :

- stratégies d’autorisation et de refus des outils
- restrictions d’outils par agent et par bac à sable
- stratégie d’outils du canal/de l’environnement d’exécution
- hooks d’approbation
- hooks de Plugin `before_tool_call`
- identité de session, journaux et télémétrie

## Configuration

Activez Tool Search pour les exécutions OpenClaw avec la passerelle de code par défaut :

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

Ajustez le délai d’expiration du mode code et les limites de résultats de recherche (les valeurs indiquées sont celles par défaut) :

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

L’environnement d’exécution limite `codeTimeoutMs` à 1000-60000, `maxSearchLimit` à 1-50 et
`searchDefaultLimit` à 1..`maxSearchLimit`.

Désactivez-la :

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt et télémétrie

Tool Search enregistre suffisamment de données télémétriques pour permettre sa comparaison avec l’exposition directe des outils :

- nombre total d’octets sérialisés des outils et du prompt envoyés au harnais
- taille du catalogue et répartition par source
- nombres de recherches, de descriptions et d’appels
- appels d’outils finaux exécutés par l’intermédiaire d’OpenClaw
- identifiants et sources des outils sélectionnés

Les journaux de session doivent permettre de déterminer :

- combien de schémas d’outils le modèle a vus au préalable
- combien d’opérations de recherche et de description il a effectuées
- quel outil final a été appelé
- si le résultat provenait d’OpenClaw, de MCP ou d’un outil client

## Validation E2E

Le scénario Gateway de QA Lab valide les deux chemins avec l’environnement d’exécution OpenClaw :

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

Il crée un faux Plugin temporaire doté d’un vaste catalogue d’outils, démarre le fournisseur
OpenAI simulé, démarre un Gateway une fois en mode direct et une fois avec Tool Search
activé, puis compare les charges utiles des requêtes adressées au fournisseur et les journaux de session.

La régression vérifie que :

1. Le mode direct peut appeler l’outil du faux Plugin.
2. Tool Search peut appeler le même outil du faux Plugin.
3. Le mode direct expose directement les schémas des outils du faux Plugin au fournisseur.
4. Tool Search expose uniquement la passerelle compacte ainsi que tous les outils à accès direct uniquement.
5. La charge utile de la requête Tool Search est plus petite pour le vaste faux catalogue.
6. Les journaux de session indiquent les nombres attendus d’appels d’outils et la télémétrie des appels transitant par la passerelle.

## Comportement en cas d’échec

Tool Search doit échouer de manière fermée :

- si un outil ne figure pas dans la stratégie effective, la recherche ne doit pas le renvoyer
- si un outil sélectionné devient indisponible, `tool_call` doit échouer
- si la stratégie ou l’approbation bloque l’exécution, le résultat de l’appel doit signaler ce
  blocage au lieu de le contourner
- si la passerelle de code ne peut pas créer un environnement d’exécution isolé, utilisez `mode: "tools"` ou
  désactivez Tool Search pour ce déploiement

## Pages connexes

- [Outils et plugins](/fr/tools)
- [Bac à sable multi-agent et outils](/fr/tools/multi-agent-sandbox-tools)
- [Outil Exec](/fr/tools/exec)
- [Configuration des agents ACP](/fr/tools/acp-agents-setup)
- [Création de plugins](/fr/plugins/building-plugins)
