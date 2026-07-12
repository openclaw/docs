---
read_when:
    - Vous souhaitez réutiliser les transports de modèles d’OpenClaw dans une autre application
    - Vous modifiez packages/ai ou les ports hôtes du transport d’IA
    - Vous examinez ce que la version d’OpenClaw publie sur npm en plus du paquet racine
summary: 'Le paquet npm @openclaw/ai : transports de modèles réutilisables, environnements d’exécution isolés et interfaces de politique de l’hôte'
title: Package @openclaw/ai
x-i18n:
    generated_at: "2026-07-12T03:18:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 610057caae0a9bbf9f74074cda75fc40c0b9aa9d3441f8263151f08f1a3f35a8
    source_path: reference/openclaw-ai.md
    workflow: 16
---

`@openclaw/ai` est la forme publiable sous forme de bibliothèque de la couche d’exécution
des modèles d’OpenClaw : contrats indépendants des fournisseurs pour les messages, les outils et les flux, validation, diagnostics,
flux d’événements, registre d’exécution isolé et adaptateurs chargés à la demande pour les huit
familles d’API intégrées (Anthropic Messages, OpenAI Completions, OpenAI
Responses, Azure OpenAI Responses, ChatGPT/Codex Responses, Google Generative
AI, Google Vertex, Mistral Conversations).

Elle est publiée avec le paquet racine `openclaw` à chaque version, épinglée à
la même version, avec son propre `npm-shrinkwrap.json` afin que son arborescence de
dépendances transitives soit verrouillée lors de l’installation. L’installation d’`openclaw` installe
automatiquement la version correspondante de `@openclaw/ai` ; les utilisateurs de la bibliothèque peuvent en dépendre
directement sans aucun code de l’application OpenClaw.

## Démarrage rapide

```js
import { createLlmRuntime } from "@openclaw/ai";
import { registerBuiltInApiProviders } from "@openclaw/ai/providers";

const runtime = createLlmRuntime();
registerBuiltInApiProviders(runtime.registry);

const stream = runtime.streamSimple(model, { messages }, { apiKey });
for await (const event of stream) {
  if (event.type === "text_delta") process.stdout.write(event.delta);
}
const result = await stream.result();
```

Une version exécutable se trouve dans le dépôt à l’emplacement `examples/ai-chat`.

## Contrat de conception

- **Portée limitée à l’instance par défaut.** L’importation du paquet n’enregistre rien
  globalement. `createApiRegistry()` / `createLlmRuntime()` renvoient des
  instances isolées ; `registerBuiltInApiProviders(registry)` active les
  transports intégrés pour un registre donné. Les modules SDK des fournisseurs sont chargés à la demande lors de leur première utilisation.
- **La politique de l’hôte est injectée, pas intégrée.** La protection des requêtes fetch (par
  exemple, la politique SSRF), la suppression des secrets dans le texte de relecture des résultats d’outils, les
  valeurs par défaut du mode strict des outils OpenAI et la journalisation des diagnostics sont des ports `AiTransportHost`
  configurés avec `configureAiTransportHost`. Les valeurs par défaut de la bibliothèque sont inertes ;
  OpenClaw installe ses implémentations réelles dans sa façade de flux.
- **Une identité unique pour le flux d’événements.** `@openclaw/ai/event-stream` est le constructeur
  `EventStream` canonique partagé par le cœur d’OpenClaw, agent-core et les
  utilisateurs externes.
- **Les sous-chemins `internal/*` ne font pas partie de l’API.** Ils existent pour l’application
  OpenClaw elle-même et n’offrent aucune garantie semver.
- Les identifiants des fournisseurs, les identifiants d’authentification, les catalogues de modèles, les nouvelles tentatives et le basculement restent
  du ressort de l’application. OpenClaw ajoute ces couches autour de ce paquet ; l’utilisateur d’une bibliothèque
  fournit directement un objet `Model` et des options.

## Exportations des sous-chemins

| Sous-chemin      | Contenu                                                                        |
| ---------------- | ------------------------------------------------------------------------------ |
| `.`              | Contrats, `createApiRegistry`, `createLlmRuntime`, `configureAiTransportHost` |
| `./providers`    | `registerBuiltInApiProviders`, `resetApiProviders`                             |
| `./types`        | Types de modèles, messages, outils et flux                                     |
| `./validation`   | Validation des arguments des outils                                            |
| `./diagnostics`  | Contrats de diagnostic                                                         |
| `./event-stream` | Implémentation partagée d’`EventStream`                                        |
| `./internal/*`   | Usage interne à OpenClaw, aucune garantie semver                               |
