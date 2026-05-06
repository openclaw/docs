---
read_when:
    - Vous souhaitez activer ou configurer code_execution
    - Vous souhaitez une analyse à distance sans accès au shell local
    - Vous souhaitez combiner x_search ou web_search avec une analyse Python distante
summary: 'code_execution: exécuter une analyse Python distante en sandbox avec xAI'
title: Exécution de code
x-i18n:
    generated_at: "2026-05-06T07:40:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: a37e921c0016a32b01558c255bc05fcf24146f363a022da87feb94f3d6d48527
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` exécute une analyse Python distante en bac à sable sur l’API Responses de xAI. Il est enregistré par le Plugin `xai` fourni (sous le contrat `tools`) et envoie les requêtes au même point de terminaison `https://api.x.ai/v1/responses` que celui utilisé par `x_search`.

| Propriété          | Valeur                                                         |
| ------------------ | -------------------------------------------------------------- |
| Nom de l’outil     | `code_execution`                                               |
| Plugin fournisseur | `xai` (fourni, `enabledByDefault: true`)                       |
| Authentification   | `XAI_API_KEY` ou `plugins.entries.xai.config.webSearch.apiKey` |
| Modèle par défaut  | `grok-4-1-fast`                                                |
| Délai par défaut   | 30 secondes                                                    |
| `maxTurns` par défaut | non défini (xAI applique sa propre limite interne)          |

C’est différent de l’outil local [`exec`](/fr/tools/exec) :

- `exec` exécute des commandes shell sur votre machine ou votre nœud appairé.
- `code_execution` exécute Python dans le bac à sable distant de xAI.

Utilisez `code_execution` pour :

- Les calculs.
- La tabulation.
- Les statistiques rapides.
- Les analyses de type graphique.
- L’analyse de données renvoyées par `x_search` ou `web_search`.

Ne l’utilisez **pas** lorsque vous avez besoin de fichiers locaux, de votre shell, de votre dépôt ou d’appareils appairés. Utilisez [`exec`](/fr/tools/exec) pour cela.

## Configuration

<Steps>
  <Step title="Fournir une clé d’API xAI">
    Définissez `XAI_API_KEY` dans l’environnement du Gateway, ou configurez la clé sous le Plugin xAI afin que le même identifiant couvre `code_execution`, `x_search`, la recherche web et les autres outils xAI :

    ```bash
    export XAI_API_KEY=xai-...
    ```

    Ou via la configuration :

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              webSearch: {
                apiKey: "xai-...",
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Activer et ajuster code_execution">
    L’outil est contrôlé par `plugins.entries.xai.config.codeExecution.enabled`. La valeur par défaut est désactivé.

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast", // remplacer le modèle xAI d’exécution de code par défaut
                maxTurns: 2,            // limite optionnelle des tours d’outil internes
                timeoutSeconds: 30,     // délai de requête (par défaut : 30)
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Redémarrer le Gateway">
    ```bash
    openclaw gateway restart
    ```

    `code_execution` apparaît dans la liste d’outils de l’agent une fois que le Plugin xAI se réenregistre avec `enabled: true`.

  </Step>
</Steps>

## Comment l’utiliser

Demandez naturellement et rendez l’intention d’analyse explicite :

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

L’outil prend en interne un seul paramètre `task`, donc l’agent doit envoyer la demande d’analyse complète et toutes les données en ligne dans une seule invite.

## Erreurs

Lorsque l’outil s’exécute sans authentification, il renvoie une erreur structurée `missing_xai_api_key` pointant vers la variable d’environnement et le chemin de configuration. L’erreur est du JSON, pas une exception levée, ce qui permet à l’agent de s’autocorriger :

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs an xAI API key. Set XAI_API_KEY in the Gateway environment, or configure plugins.entries.xai.config.webSearch.apiKey.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Limites

- Il s’agit d’une exécution distante xAI, pas d’une exécution de processus locale.
- Traitez les résultats comme une analyse éphémère, pas comme une session de notebook persistante.
- Ne supposez pas l’accès aux fichiers locaux ni à votre espace de travail.
- Pour des données X récentes, utilisez d’abord [`x_search`](/fr/tools/web#x_search), puis transmettez le résultat à `code_execution`.

## Associés

<CardGroup cols={2}>
  <Card title="Outil exec" href="/fr/tools/exec" icon="terminal">
    Exécution shell locale sur votre machine ou votre nœud appairé.
  </Card>
  <Card title="Approbations exec" href="/fr/tools/exec-approvals" icon="shield">
    Politique d’autorisation/refus pour l’exécution shell.
  </Card>
  <Card title="Outils web" href="/fr/tools/web" icon="globe">
    `web_search`, `x_search` et `web_fetch`.
  </Card>
  <Card title="Fournisseur xAI" href="/fr/providers/xai" icon="microchip">
    Modèles Grok, recherche web/X et configuration de l’exécution de code.
  </Card>
</CardGroup>
