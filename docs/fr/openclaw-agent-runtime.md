---
read_when:
    - Travailler sur le code ou les tests du runtime d’agent OpenClaw
    - Exécution des flux de lint, de vérification de types et de tests en direct d’agent-runtime
summary: 'Flux de travail de développement pour le runtime d’agent OpenClaw : compilation, tests et validation en direct'
title: Flux de travail du runtime de l’agent OpenClaw
x-i18n:
    generated_at: "2026-06-27T17:42:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbe2a192ff7954577f8cbeae33676cbfd330f297d31c1917d2ab52898c2c5064
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

Un workflow sain pour travailler sur le runtime d’agent OpenClaw dans OpenClaw.

## Vérification des types et linting

- Garde locale par défaut : `pnpm check`
- Garde de build : `pnpm build` lorsque la modification peut affecter la sortie de build, le packaging ou les frontières de lazy-loading/modules
- Garde complète avant intégration pour les changements du runtime d’agent : `pnpm check && pnpm test`

## Exécuter les tests du runtime d’agent

Exécutez directement l’ensemble de tests du runtime d’agent avec Vitest :

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-tools*.test.ts" \
  "src/agents/agent-settings.test.ts" \
  "src/agents/agent-tool-definition-adapter*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

Pour inclure l’exercice du fournisseur live :

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/embedded-agent-runner-extraparams.live.test.ts
```

Cela couvre les principales suites unitaires du runtime d’agent :

- `src/agents/agent-*.test.ts`
- `src/agents/embedded-agent-*.test.ts`
- `src/agents/agent-tools*.test.ts`
- `src/agents/agent-settings.test.ts`
- `src/agents/agent-tool-definition-adapter.test.ts`
- `src/agents/agent-hooks/*.test.ts`

## Tests manuels

Flux recommandé :

- Exécutez le Gateway en mode développement :
  - `pnpm gateway:dev`
- Déclenchez directement l’agent :
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Utilisez le TUI pour le débogage interactif :
  - `pnpm tui`

Pour le comportement des appels d’outils, demandez une action `read` ou `exec` afin de voir le streaming des outils et la gestion des charges utiles.

## Réinitialisation à zéro

L’état réside dans le répertoire d’état OpenClaw. La valeur par défaut est `~/.openclaw`. Si `OPENCLAW_STATE_DIR` est défini, utilisez plutôt ce répertoire.

Pour tout réinitialiser :

- `openclaw.json` pour la configuration
- `agents/<agentId>/agent/auth-profiles.json` pour les profils d’authentification de modèles (clés API + OAuth)
- `credentials/` pour l’état des fournisseurs/canaux qui réside encore en dehors du magasin de profils d’authentification
- `agents/<agentId>/sessions/` pour l’historique des sessions d’agent
- `agents/<agentId>/sessions/sessions.json` pour l’index des sessions
- `sessions/` si des chemins hérités existent
- `workspace/` si vous voulez un espace de travail vide

Si vous voulez seulement réinitialiser les sessions, supprimez `agents/<agentId>/sessions/` pour cet agent. Si vous voulez conserver l’authentification, laissez `agents/<agentId>/agent/auth-profiles.json` et tout état de fournisseur sous `credentials/` en place.

## Références

- [Tests](/fr/help/testing)
- [Bien démarrer](/fr/start/getting-started)

## Connexe

- [Architecture du runtime d’agent OpenClaw](/fr/agent-runtime-architecture)
