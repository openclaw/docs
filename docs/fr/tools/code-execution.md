---
read_when:
    - Vous souhaitez activer ou configurer code_execution
    - Vous souhaitez une analyse à distance sans accès au shell local
    - Vous voulez combiner x_search ou web_search avec l’analyse Python distante
summary: code_execution -- exécuter une analyse Python distante en bac à sable avec xAI
title: Exécution de code
x-i18n:
    generated_at: "2026-04-30T07:50:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe635ec65aaf593a5bd63c139fbfc69e1ba3ea7c58c2bba639ec1ebd70dba1a9
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` exécute une analyse Python distante en bac à sable avec l’API Responses de xAI.
C’est différent de l’outil local [`exec`](/fr/tools/exec) :

- `exec` exécute des commandes shell sur votre machine ou nœud
- `code_execution` exécute Python dans le bac à sable distant de xAI

Utilisez `code_execution` pour :

- les calculs
- la mise en tableau
- les statistiques rapides
- l’analyse de type graphique
- l’analyse des données renvoyées par `x_search` ou `web_search`

Ne l’utilisez **pas** lorsque vous avez besoin de fichiers locaux, de votre shell, de votre dépôt ou d’appareils appairés. Utilisez [`exec`](/fr/tools/exec) pour cela.

## Configuration

Vous avez besoin d’une clé d’API xAI. N’importe laquelle de celles-ci fonctionne :

- `XAI_API_KEY`
- `plugins.entries.xai.config.webSearch.apiKey`

Exemple :

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...",
          },
          codeExecution: {
            enabled: true,
            model: "grok-4-1-fast",
            maxTurns: 2,
            timeoutSeconds: 30,
          },
        },
      },
    },
  },
}
```

## Comment l’utiliser

Formulez votre demande naturellement et rendez l’intention d’analyse explicite :

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

L’outil accepte en interne un seul paramètre `task`, donc l’agent doit envoyer la demande d’analyse complète et toutes les données en ligne dans une seule invite.

## Limites

- Il s’agit d’une exécution distante xAI, pas d’une exécution de processus locale.
- Elle doit être traitée comme une analyse éphémère, pas comme un notebook persistant.
- Ne supposez pas l’accès aux fichiers locaux ni à votre espace de travail.
- Pour des données X récentes, utilisez d’abord [`x_search`](/fr/tools/web#x_search).

## Voir aussi

- [Outil Exec](/fr/tools/exec)
- [Approbations Exec](/fr/tools/exec-approvals)
- [Outil apply_patch](/fr/tools/apply-patch)
- [Outils Web](/fr/tools/web)
- [xAI](/fr/providers/xai)
