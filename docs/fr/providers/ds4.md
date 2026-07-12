---
read_when:
    - Vous souhaitez exécuter OpenClaw avec antirez/ds4
    - Vous souhaitez un backend local DeepSeek V4 Flash avec des appels d’outils
    - Vous avez besoin de la configuration OpenClaw pour ds4-server
summary: Exécutez OpenClaw via ds4, un serveur local compatible avec OpenAI pour DeepSeek V4 Flash
title: ds4
x-i18n:
    generated_at: "2026-07-12T02:59:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be449813295648694625ef8003b3f4b12903535b74816916ca5af0695174fbf4
    source_path: providers/ds4.md
    workflow: 16
---

[ds4](https://github.com/antirez/ds4) exécute DeepSeek V4 Flash à partir d’un backend
Metal local avec une API `/v1` compatible avec OpenAI. OpenClaw se connecte à ds4
par l’intermédiaire de la famille de fournisseurs générique `openai-completions`.

ds4 n’est pas un Plugin fournisseur intégré à OpenClaw. Configurez-le sous
`models.providers.ds4`, puis sélectionnez `ds4/deepseek-v4-flash`.

| Propriété          | Valeur                                                    |
| ------------------ | --------------------------------------------------------- |
| Identifiant du fournisseur | `ds4`                                             |
| Plugin             | aucun (configuration uniquement)                          |
| API                | Chat Completions compatible avec OpenAI (`openai-completions`) |
| URL de base        | `http://127.0.0.1:18000/v1` (recommandée)                 |
| Identifiant du modèle | `deepseek-v4-flash`                                    |
| Appels d’outils    | `tools` / `tool_calls` au format OpenAI                   |
| Raisonnement       | `thinking` et `reasoning_effort` au format DeepSeek       |

## Prérequis

- macOS avec prise en charge de Metal.
- Une copie de travail fonctionnelle de ds4 contenant `ds4-server` et le fichier GGUF de DeepSeek V4 Flash.
- Suffisamment de mémoire pour le contexte choisi ; les valeurs `--ctx` plus élevées allouent davantage de
  mémoire KV au démarrage du serveur.

<Warning>
Les tours d’agent OpenClaw incluent les schémas d’outils et le contexte de l’espace de travail. Un contexte
réduit tel que `--ctx 4096` peut réussir les tests curl directs, mais faire échouer les exécutions complètes de l’agent avec
`500 prompt exceeds context`. Utilisez au moins `--ctx 32768` pour les
tests de bon fonctionnement de l’agent et des outils. Utilisez `--ctx 393216` uniquement avec suffisamment de mémoire et pour activer
Think Max de ds4.
</Warning>

## Démarrage rapide

<Steps>
  <Step title="Start ds4-server">
    Remplacez `<DS4_DIR>` par le chemin de votre copie de travail ds4.

    ```bash
    <DS4_DIR>/ds4-server \
      --model <DS4_DIR>/ds4flash.gguf \
      --host 127.0.0.1 \
      --port 18000 \
      --ctx 32768 \
      --tokens 128
    ```

  </Step>
  <Step title="Verify the OpenAI-compatible endpoint">
    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

    La réponse doit inclure `deepseek-v4-flash`.

  </Step>
  <Step title="Add the OpenClaw provider config">
    Ajoutez la configuration de la section [Configuration complète](#full-config), puis exécutez une vérification ponctuelle du
    modèle :

    ```bash
    openclaw infer model run \
      --local \
      --model ds4/deepseek-v4-flash \
      --thinking off \
      --prompt "Reply with exactly: openclaw-ds4-ok" \
      --json
    ```

  </Step>
</Steps>

## Configuration complète

Utilisez cette configuration lorsque ds4 est déjà en cours d’exécution sur `127.0.0.1:18000`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "ds4/deepseek-v4-flash" },
      models: {
        "ds4/deepseek-v4-flash": {
          alias: "DS4 local",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

Maintenez `contextWindow` aligné sur `ds4-server --ctx`. Maintenez `maxTokens` aligné
sur `--tokens`, sauf si vous souhaitez délibérément qu’OpenClaw demande une sortie plus courte
que la valeur par défaut du serveur.

## Démarrage à la demande

OpenClaw peut démarrer ds4 uniquement lorsqu’un modèle `ds4/...` est sélectionné. Ajoutez
`localService` à la même entrée de fournisseur :

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

`command` doit être un chemin absolu vers un exécutable. La recherche dans l’environnement shell et le développement de `~`
ne sont pas utilisés. Consultez [Services de modèles locaux](/fr/gateway/local-model-services) pour
tous les champs de `localService`.

## Think Max

ds4 applique Think Max uniquement lorsque les deux conditions suivantes sont remplies :

- `ds4-server` démarre avec `--ctx 393216` ou une valeur supérieure.
- La requête utilise `reasoning_effort: "max"` (ou le champ d’effort ds4 équivalent).

Si vous utilisez un contexte aussi étendu, mettez à jour à la fois les options du serveur et les métadonnées du modèle
OpenClaw :

```json5
{
  contextWindow: 393216,
  maxTokens: 384000,
  compat: {
    supportsUsageInStreaming: true,
    supportsReasoningEffort: true,
    maxTokensField: "max_tokens",
    supportsStrictMode: false,
    thinkingFormat: "deepseek",
    supportedReasoningEfforts: ["low", "medium", "high", "xhigh", "max"],
  },
}
```

## Test

Vérification HTTP directe, sans passer par OpenClaw :

```bash
curl http://127.0.0.1:18000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Reply with exactly: ds4-ok"}],"max_tokens":16,"stream":false,"thinking":{"type":"disabled"}}'
```

Routage du modèle OpenClaw (identique à la vérification du démarrage rapide) :

```bash
openclaw infer model run \
  --local \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --prompt "Reply with exactly: openclaw-ds4-ok" \
  --json
```

Test de bon fonctionnement complet de l’agent et des appels d’outils, avec un contexte d’au moins 32768 :

```bash
openclaw agent \
  --local \
  --session-id ds4-tool-smoke \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --message "Use the shell command pwd once, then reply exactly: tool-ok <output>" \
  --json \
  --timeout 240
```

Résultat attendu :

- `executionTrace.winnerProvider` vaut `ds4`
- `executionTrace.winnerModel` vaut `deepseek-v4-flash`
- `toolSummary.calls` vaut au moins `1`
- `finalAssistantVisibleText` commence par `tool-ok`

## Dépannage

<AccordionGroup>
  <Accordion title="curl /v1/models cannot connect">
    ds4 n’est pas en cours d’exécution ou n’est pas lié à l’hôte ou au port indiqué dans `baseUrl`. Démarrez
    `ds4-server`, puis réessayez :

    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

  </Accordion>

  <Accordion title="500 prompt exceeds context">
    La valeur `--ctx` configurée est trop faible pour le tour OpenClaw. Augmentez
    `ds4-server --ctx`, puis mettez à jour `models.providers.ds4.models[].contextWindow`
    avec la même valeur. Les tours complets de l’agent avec des outils nécessitent nettement plus de contexte qu’une
    requête curl directe contenant un seul message.
  </Accordion>

  <Accordion title="Think Max does not activate">
    ds4 utilise Think Max uniquement lorsque `--ctx` vaut au moins `393216` et que la requête
    demande `reasoning_effort: "max"`. Les contextes plus petits utilisent à la place un niveau de
    raisonnement élevé.
  </Accordion>

  <Accordion title="The first request is slow">
    ds4 présente une phase initiale de chargement dans Metal et de préchauffage du modèle. Définissez
    `localService.readyTimeoutMs: 300000` lorsqu’OpenClaw démarre le serveur à la
    demande.
  </Accordion>
</AccordionGroup>

## Pages connexes

<CardGroup cols={2}>
  <Card title="Local model services" href="/fr/gateway/local-model-services" icon="play">
    Démarrez les serveurs de modèles locaux à la demande avant les requêtes de modèle.
  </Card>
  <Card title="Local models" href="/fr/gateway/local-models" icon="server">
    Choisissez et exploitez des backends de modèles locaux.
  </Card>
  <Card title="Model providers" href="/fr/concepts/model-providers" icon="layers">
    Configurez les références des fournisseurs, l’authentification et le basculement.
  </Card>
  <Card title="DeepSeek" href="/fr/providers/deepseek" icon="brain">
    Comportement natif du fournisseur DeepSeek et contrôles de la réflexion.
  </Card>
</CardGroup>
