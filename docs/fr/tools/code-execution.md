---
read_when:
    - Vous souhaitez activer ou configurer code_execution
    - Vous voulez une analyse à distance sans accès au shell local
    - Vous voulez combiner x_search ou web_search avec une analyse Python distante
summary: 'code_execution: exécuter une analyse Python distante en bac à sable avec xAI'
title: Exécution de code
x-i18n:
    generated_at: "2026-05-11T20:57:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76be496e459fac9c7f6b0324cceb884d3a693fd72d7541094d1bb64a4f1b7b8b
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` exécute des analyses Python distantes en bac à sable sur l’API Responses de xAI. Il est enregistré par le Plugin `xai` fourni avec OpenClaw (sous le contrat `tools`) et envoie les requêtes au même point de terminaison `https://api.x.ai/v1/responses` que celui utilisé par `x_search`.

| Propriété          | Valeur                                                                            |
| ------------------ | --------------------------------------------------------------------------------- |
| Nom de l’outil     | `code_execution`                                                                  |
| Plugin fournisseur | `xai` (fourni avec OpenClaw, `enabledByDefault: true`)                            |
| Authentification   | Profil d’authentification xAI, `XAI_API_KEY`, ou `plugins.entries.xai.config.webSearch.apiKey` |
| Modèle par défaut  | `grok-4-1-fast`                                                                   |
| Délai par défaut   | 30 secondes                                                                       |
| `maxTurns` par défaut | non défini (xAI applique sa propre limite interne)                             |

C’est différent de l’[`exec`](/fr/tools/exec) local :

- `exec` exécute des commandes shell sur votre machine ou sur le nœud associé.
- `code_execution` exécute Python dans le bac à sable distant de xAI.

Utilisez `code_execution` pour :

- Les calculs.
- La tabulation.
- Les statistiques rapides.
- Les analyses de type graphique.
- L’analyse des données renvoyées par `x_search` ou `web_search`.

Ne l’utilisez **pas** lorsque vous avez besoin de fichiers locaux, de votre shell, de votre dépôt ou d’appareils associés. Utilisez [`exec`](/fr/tools/exec) pour cela.

## Configuration

<Steps>
  <Step title="Fournir une clé API xAI">
    Exécutez `openclaw onboard --auth-choice xai-api-key` pour `code_execution` et
    `x_search`, ou définissez `XAI_API_KEY` / configurez la clé sous le Plugin xAI
    lorsque vous voulez aussi que la recherche web Grok utilise le même identifiant :

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

  <Step title="Activer et régler code_execution">
    L’outil est contrôlé par `plugins.entries.xai.config.codeExecution.enabled`. La valeur par défaut est désactivée.

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast", // override the default xAI code-execution model
                maxTurns: 2,            // optional cap on internal tool turns
                timeoutSeconds: 30,     // request timeout (default: 30)
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

Demandez naturellement et explicitez l’objectif de l’analyse :

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

L’outil accepte en interne un seul paramètre `task`, l’agent doit donc envoyer la demande d’analyse complète et toutes les données en ligne dans une seule invite.

## Erreurs

Lorsque l’outil s’exécute sans authentification, il renvoie une erreur structurée `missing_xai_api_key` qui pointe vers le profil d’authentification, la variable d’environnement et les options de configuration. L’erreur est du JSON, pas une exception levée, ce qui permet à l’agent de s’autocorriger :

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs an xAI API key. Run openclaw onboard --auth-choice xai-api-key, set XAI_API_KEY in the Gateway environment, or configure plugins.entries.xai.config.webSearch.apiKey.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Limites

- Il s’agit d’une exécution xAI distante, pas d’une exécution de processus locale.
- Traitez les résultats comme une analyse éphémère, pas comme une session de notebook persistante.
- Ne supposez pas l’accès aux fichiers locaux ni à votre espace de travail.
- Pour des données X récentes, utilisez d’abord [`x_search`](/fr/tools/web#x_search), puis transmettez le résultat à `code_execution`.

## Liens connexes

<CardGroup cols={2}>
  <Card title="Outil Exec" href="/fr/tools/exec" icon="terminal">
    Exécution shell locale sur votre machine ou sur le nœud associé.
  </Card>
  <Card title="Approbations Exec" href="/fr/tools/exec-approvals" icon="shield">
    Politique d’autorisation/refus pour l’exécution shell.
  </Card>
  <Card title="Outils web" href="/fr/tools/web" icon="globe">
    `web_search`, `x_search` et `web_fetch`.
  </Card>
  <Card title="Fournisseur xAI" href="/fr/providers/xai" icon="microchip">
    Modèles Grok, recherche web/X et configuration de l’exécution de code.
  </Card>
</CardGroup>
