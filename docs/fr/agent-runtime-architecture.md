---
summary: 'Comment OpenClaw structure l’environnement d’exécution d’agent intégré : organisation du code, limites, manifestes de ressources et sélection de l’environnement d’exécution.'
title: Architecture de l’environnement d’exécution de l’agent
x-i18n:
    generated_at: "2026-07-12T15:01:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 071a0cb076230ce02f2c2c1c21971379cf617f24faa8a9733570aae30a062019
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw possède l’environnement d’exécution d’agent intégré. Le code de l’environnement d’exécution se trouve sous `src/agents/`, le transport des modèles/fournisseurs sous `src/llm/`, et les contrats destinés aux plugins sont exposés par les modules d’exportation `openclaw/plugin-sdk/*`.

## Organisation de l’environnement d’exécution

| Chemin                              | Responsabilité                                                                                                                                                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/agents/embedded-agent-runner/` | Boucle de tentatives intégrée (`run.ts`, `run/`), sélection du modèle et normalisation du fournisseur (`model*.ts`), paramètres de requête propres à chaque fournisseur (`extra-params.*`), Compaction, raccordement des transcriptions et des sessions. |
| `src/agents/sessions/`              | Persistance des sessions (`session-manager.ts`), découverte des ressources (`package-manager.ts`, `resource-loader.ts`), chargement des `extensions` dans la session, modèles de prompts, Skills, thèmes et moteurs de rendu d’outils basés sur la TUI (`tools/`). |
| `packages/agent-core/`              | Noyau d’agent réutilisable (`@openclaw/agent-core`) : boucle d’agent, types du banc d’essai, messages, utilitaires de Compaction, modèles de prompts, Skills et contrats de stockage des sessions. |
| `src/agents/runtime/`               | Façade OpenClaw qui raccorde `@openclaw/agent-core` à l’environnement d’exécution LLM du SDK de plugins et le réexporte avec les utilitaires de proxy locaux. |
| `src/agents/agent-tools*.ts`        | Définitions d’outils détenues par OpenClaw, schémas de paramètres, politique des outils, adaptateurs avant/après les appels d’outils et outils de modification de l’hôte/de l’environnement isolé. |
| `src/agents/agent-hooks/`           | Hooks d’environnement d’exécution intégrés : protection de la Compaction, instructions de Compaction, élagage du contexte. |
| `src/agents/harness/`               | Registre des bancs d’essai, politique de sélection et cycle de vie des bancs d’essai intégrés et enregistrés par des plugins. |
| `src/llm/`                          | Registre des modèles/fournisseurs, utilitaires de transport et implémentations de flux propres aux fournisseurs (`src/llm/providers/`). |

## Limites

Le cœur appelle l’environnement d’exécution intégré par l’intermédiaire des modules OpenClaw et des modules d’exportation du SDK ; aucun paquet de framework d’agent externe ne subsiste. Les plugins utilisent les points d’entrée `openclaw/plugin-sdk/*` documentés et n’importent pas les éléments internes de `src/**`.

`@earendil-works/pi-tui` reste une dépendance tierce : une boîte à outils de composants de terminal utilisée par la TUI locale et les moteurs de rendu d’outils de session. Son internalisation constituerait un effort distinct d’intégration du code tiers.

## Manifestes

Les paquets de ressources déclarent les ressources OpenClaw dans les métadonnées de `package.json`. Les entrées sont des chemins de fichiers ou des motifs glob relatifs à la racine du paquet :

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

Les types de ressources non répertoriés dans un manifeste utilisent par défaut la découverte des répertoires conventionnels `extensions/`, `skills/`, `prompts/` et `themes/`.

## Sélection de l’environnement d’exécution

- L’identifiant de l’environnement d’exécution intégré est `openclaw`. L’ancien alias `pi` est normalisé en `openclaw` ; `codex-app-server` est normalisé en `codex`.
- Les bancs d’essai des plugins enregistrent des identifiants d’environnement d’exécution supplémentaires (par exemple `codex`).
- La politique d’environnement d’exécution correspond à la configuration `agentRuntime.id` limitée au modèle/fournisseur (l’entrée du modèle prévaut sur celle du fournisseur). Une valeur non définie ou `default` est résolue en `auto`.
- `auto` sélectionne un banc d’essai de plugin enregistré qui prend en charge la route effective du fournisseur ; sinon, il sélectionne l’environnement d’exécution OpenClaw intégré. Le préfixe d’un fournisseur ou d’un modèle ne sélectionne jamais, à lui seul, un banc d’essai.
- OpenAI peut sélectionner implicitement `codex` uniquement pour une route officielle HTTPS exacte de Platform Responses ou de ChatGPT Responses, sans substitution de requête définie par l’auteur. Les adaptateurs Completions, les points de terminaison personnalisés et les routes comportant un comportement de requête défini par l’auteur restent sur `openclaw` ; les points de terminaison HTTP officiels en texte clair sont rejetés. Consultez [Environnement d’exécution d’agent OpenAI implicite](/fr/providers/openai#implicit-agent-runtime).

## Ressources connexes

- [Flux de travail de l’environnement d’exécution d’agent OpenClaw](/fr/openclaw-agent-runtime)
- [Environnements d’exécution d’agent](/fr/concepts/agent-runtimes)
