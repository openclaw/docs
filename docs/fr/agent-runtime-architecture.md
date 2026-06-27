---
summary: Comment OpenClaw exécute l’environnement d’exécution d’agent intégré, les fournisseurs, les sessions, les outils et les extensions.
title: Architecture d’exécution des agents
x-i18n:
    generated_at: "2026-06-27T17:08:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd0ca61b10a4f7029590da8566b22cc44cf801af162e5f2c00c9561fe46e39e3
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw possède directement le runtime d’agent intégré. Le code du runtime se trouve sous `src/agents/`, les assistants de modèle/fournisseur se trouvent sous `src/llm/`, et les contrats exposés aux plugins sont fournis via les barrels `openclaw/plugin-sdk/*`.

## Agencement du runtime

- `src/agents/embedded-agent-runner/` : boucle de tentatives de l’agent intégré, adaptateurs de flux fournisseur, Compaction, sélection du modèle et câblage de session.
- `src/agents/sessions/` : persistance des sessions, chargement des extensions, découverte des ressources, Skills, prompts, thèmes et renderers d’outils adossés au TUI.
- `packages/agent-core/` : cœur d’agent réutilisable, types de harnais de plus bas niveau, messages, assistants de Compaction, modèles de prompts et contrats d’outils/session.
- `src/agents/runtime/` : façade OpenClaw pour `@openclaw/agent-core` plus utilitaires de proxy local.
- `src/agents/agent-tools*.ts` : définitions d’outils, schémas, règles, adaptateurs de hooks avant/après et prise en charge des modifications hôte appartenant à OpenClaw.
- `src/agents/agent-hooks/` : hooks de runtime intégrés, tels que les protections de Compaction et l’élagage du contexte.
- `src/llm/` : registre des modèles/fournisseurs, assistants de transport et implémentations de flux propres aux fournisseurs.

## Limites

Le code cœur appelle le runtime intégré via les modules OpenClaw et les barrels du SDK, et non via d’anciens packages d’agent externes. Les plugins utilisent les points d’entrée documentés `openclaw/plugin-sdk/*` et n’importent pas les éléments internes de `src/**`.

`@earendil-works/pi-tui` reste une dépendance TUI tierce. Elle est utilisée comme boîte à outils de composants de terminal par le TUI local et les renderers de session ; l’internaliser constituerait un effort distinct de vendoring.

## Manifestes

Les packages de ressources déclarent les ressources OpenClaw dans les métadonnées du package :

```json
{
  "openclaw": {
    "extensions": ["extensions/index.ts"],
    "skills": ["skills/*.md"],
    "prompts": ["prompts/*.md"],
    "themes": ["themes/*.json"]
  }
}
```

Le gestionnaire de packages découvre également les répertoires conventionnels `extensions/`, `skills/`, `prompts/` et `themes/`.

## Sélection du runtime

L’identifiant par défaut du runtime intégré est `openclaw`. Les harnais de plugins peuvent enregistrer des identifiants de runtime supplémentaires. `auto` sélectionne un harnais de plugin compatible lorsqu’il en existe un ; sinon, il utilise le runtime OpenClaw intégré.

## Associé

- [Workflow du runtime d’agent OpenClaw](/fr/openclaw-agent-runtime)
- [Runtimes d’agent](/fr/concepts/agent-runtimes)
