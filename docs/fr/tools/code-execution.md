---
read_when:
    - Vous voulez activer ou configurer `code_execution`
    - Vous voulez une analyse à distance sans accès au shell local
    - Vous voulez combiner x_search ou web_search avec l’analyse Python distante
summary: 'code_execution: exécuter une analyse Python distante en bac à sable avec xAI'
title: Exécution de code
x-i18n:
    generated_at: "2026-06-27T18:16:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d510d0d2b41deab527d456e675a23ef80ac3b55b5f01906ba2c43d90e4452e36
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` exécute une analyse Python distante en bac à sable sur l’API Responses de xAI. Il est enregistré par le plugin `xai` groupé (dans le cadre du contrat `tools`) et distribue les requêtes vers le même point de terminaison `https://api.x.ai/v1/responses` que celui utilisé par `x_search`.

| Propriété              | Valeur                                                                            |
| ---------------------- | --------------------------------------------------------------------------------- |
| Nom de l’outil         | `code_execution`                                                                  |
| Plugin fournisseur     | `xai` (groupé, `enabledByDefault: true`)                                          |
| Authentification       | Profil d’authentification xAI, `XAI_API_KEY`, ou `plugins.entries.xai.config.webSearch.apiKey` |
| Modèle par défaut      | `grok-4-1-fast`                                                                   |
| Délai par défaut       | 30 secondes                                                                       |
| `maxTurns` par défaut  | non défini (xAI applique sa propre limite interne)                                |

C’est différent de l’outil local [`exec`](/fr/tools/exec) :

- `exec` exécute des commandes shell sur votre machine ou votre nœud appairé.
- `code_execution` exécute Python dans le bac à sable distant de xAI.

Utilisez `code_execution` pour :

- Les calculs.
- La mise en tableau.
- Les statistiques rapides.
- L’analyse de type graphique.
- L’analyse des données renvoyées par `x_search` ou `web_search`.

Ne l’utilisez **pas** lorsque vous avez besoin de fichiers locaux, de votre shell, de votre dépôt ou d’appareils appairés. Utilisez [`exec`](/fr/tools/exec) pour cela.

## Configuration

<Steps>
  <Step title="Provide xAI credentials">
    Connectez-vous avec Grok OAuth au moyen d’un abonnement SuperGrok ou X Premium éligible,
    ou stockez une clé d’API. xAI OAuth utilise la vérification par code d’appareil, ce qui lui permet de fonctionner
    depuis des hôtes distants sans rappel localhost. OAuth fonctionne pour
    `code_execution` et `x_search` ; `XAI_API_KEY` ou la configuration de recherche web du plugin
    peuvent aussi alimenter Grok `web_search`.

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Lors d’une nouvelle installation, les mêmes choix d’authentification sont disponibles dans
    l’intégration initiale :

    ```bash
    openclaw onboard --install-daemon
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    Ou utilisez une clé d’API :

    ```bash
    openclaw models auth login --provider xai --method api-key
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

  <Step title="Enable and tune code_execution">
    `code_execution` est disponible lorsque les identifiants xAI sont disponibles. Définissez
    `plugins.entries.xai.config.codeExecution.enabled` sur `false` pour le désactiver,
    ou utilisez le même bloc pour ajuster le modèle et le délai.

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

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    `code_execution` apparaît dans la liste d’outils de l’agent une fois que le plugin xAI se réenregistre avec `enabled: true`.

  </Step>
</Steps>

## Comment l’utiliser

Formulez votre demande naturellement et explicitez l’intention d’analyse :

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

Lorsque l’outil s’exécute sans authentification, il renvoie une erreur structurée `missing_xai_api_key` pointant vers le profil d’authentification, la variable d’environnement et les options de configuration. L’erreur est au format JSON, et non une exception levée, afin que l’agent puisse se corriger lui-même :

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Limites

- Il s’agit d’une exécution distante xAI, pas d’une exécution de processus local.
- Traitez les résultats comme une analyse éphémère, pas comme une session de notebook persistante.
- Ne supposez pas l’accès aux fichiers locaux ni à votre espace de travail.
- Pour des données X récentes, utilisez d’abord [`x_search`](/fr/tools/web#x_search), puis transmettez le résultat à `code_execution`.

## Connexe

<CardGroup cols={2}>
  <Card title="Exec tool" href="/fr/tools/exec" icon="terminal">
    Exécution shell locale sur votre machine ou votre nœud appairé.
  </Card>
  <Card title="Exec approvals" href="/fr/tools/exec-approvals" icon="shield">
    Politique d’autorisation/refus pour l’exécution shell.
  </Card>
  <Card title="Web tools" href="/fr/tools/web" icon="globe">
    `web_search`, `x_search` et `web_fetch`.
  </Card>
  <Card title="xAI provider" href="/fr/providers/xai" icon="microchip">
    Modèles Grok, recherche web/X et configuration de l’exécution de code.
  </Card>
</CardGroup>
