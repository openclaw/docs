---
read_when:
    - Travailler sur le code ou les tests du runtime d’agent OpenClaw
    - Exécution des processus de lint, de vérification des types et de tests en conditions réelles de l’environnement d’exécution de l’agent
summary: 'Flux de travail de développement pour l’environnement d’exécution des agents OpenClaw : compilation, tests et validation en conditions réelles'
title: Workflow d’exécution de l’agent OpenClaw
x-i18n:
    generated_at: "2026-07-12T15:28:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 044f05779bef4ad18478081ba44d84356723c8a0be764440aa9d2b976d167324
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

Workflow de développement pour le runtime d’agent (`src/agents/`) dans le dépôt OpenClaw.

## Vérification des types et lint

- Contrôle local par défaut : `pnpm check` (vérification des types, lint, contrôles de politique)
- Contrôle de build : `pnpm build` lorsque la modification peut affecter la sortie du build, le packaging ou les limites du chargement différé/des modules
- Contrôle pré-push complet : `pnpm build && pnpm check && pnpm check:test-types && pnpm test`

## Exécution des tests du runtime d’agent

Exécutez les suites de tests unitaires du runtime d’agent :

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

Le premier glob couvre également les suites `agent-tools*`, `agent-settings` et
`agent-tool-definition-adapter*`.

Les tests en conditions réelles sont exclus de la configuration des tests unitaires ; exécutez-les avec le
wrapper dédié (il définit `OPENCLAW_LIVE_TEST=1` et nécessite des identifiants de fournisseur) :

```bash
pnpm test:live src/agents/embedded-agent-runner-extraparams.live.test.ts
```

## Tests manuels

- Exécutez le Gateway en mode développement (ignore les connexions aux canaux via `OPENCLAW_SKIP_CHANNELS=1`) : `pnpm gateway:dev`
- Déclenchez un tour d’agent via le Gateway : `pnpm openclaw agent --message "Hello" --thinking low`
- Utilisez la TUI pour le débogage interactif : `pnpm tui`

Pour tester le comportement des appels d’outils, demandez une action `read` ou `exec` afin de pouvoir observer
le streaming des outils et le traitement des charges utiles.

## Réinitialisation complète

L’état se trouve dans le répertoire d’état d’OpenClaw : `~/.openclaw` par défaut, ou
`$OPENCLAW_STATE_DIR` lorsqu’il est défini. Chemins relatifs à ce répertoire :

| Chemin                                         | Contenu                                                                                      |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `openclaw.json`                                | Configuration                                                                                |
| `state/openclaw.sqlite`                        | Base de données d’état partagé du runtime                                                    |
| `agents/<agentId>/agent/openclaw-agent.sqlite` | Profils d’authentification du modèle par agent (clés API + OAuth) et état du runtime          |
| `credentials/`                                 | Identifiants des fournisseurs/canaux hors du stockage des profils d’authentification         |
| `agents/<agentId>/sessions/`                   | Historique des transcriptions et sources de migration des sessions héritées                  |
| `sessions/`                                    | Stockage hérité des sessions à agent unique (anciennes installations uniquement)             |
| `workspace/`                                   | Espace de travail par défaut de l’agent (les agents supplémentaires utilisent `workspace-<agentId>`) |

Supprimez ces chemins pour effectuer une réinitialisation complète. Réinitialisations plus ciblées :

- Sessions uniquement : ne supprimez pas `agents/<agentId>/agent/openclaw-agent.sqlite` ; les lignes de session y sont stockées avec les autres états propres à l’agent. Utilisez `/new` ou `/reset` pour démarrer une nouvelle session pour une conversation, et `openclaw sessions cleanup` pour la maintenance des sessions.
- Conserver l’authentification : laissez `agents/<agentId>/agent/openclaw-agent.sqlite` et `credentials/` en place.

Les anciens fichiers `auth-profiles.json` ne sont plus lus lors de l’exécution ;
`openclaw doctor --fix` les importe dans le stockage SQLite.

## Références

- [Tests](/fr/help/testing)
- [Bien démarrer](/fr/start/getting-started)

## Contenu associé

- [Architecture du runtime d’agent OpenClaw](/fr/agent-runtime-architecture)
