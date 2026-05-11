---
read_when:
    - Vous souhaitez qu’OpenClaw démarre un serveur de modèles local uniquement lorsque son modèle est sélectionné
    - Vous exécutez ds4, inferrs, vLLM, llama.cpp, MLX ou un autre serveur local compatible avec OpenAI
    - Vous devez contrôler le démarrage à froid, l’état de préparation et l’arrêt en cas d’inactivité des fournisseurs locaux.
summary: Démarrer les serveurs de modèles locaux à la demande avant les requêtes de modèle OpenClaw
title: Services de modèles locaux
x-i18n:
    generated_at: "2026-05-11T20:37:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: b900146c5831c784b5da66666322ed0f5d3457ccd741556f418cd197749b87b1
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` permet à OpenClaw de démarrer à la demande un
serveur de modèles local détenu par le fournisseur. Il s’agit d’une configuration
au niveau du fournisseur : lorsque le modèle sélectionné appartient à ce
fournisseur, OpenClaw sonde le service, démarre le processus si le point de
terminaison est indisponible, attend qu’il soit prêt, puis envoie la requête de
modèle.

Utilisez-la pour les serveurs locaux qu’il est coûteux de maintenir en cours
d’exécution toute la journée, ou pour les configurations manuelles où la
sélection du modèle doit suffire à démarrer le backend.

## Fonctionnement

1. Une requête de modèle est résolue vers un fournisseur configuré.
2. Si ce fournisseur a `localService`, OpenClaw sonde `healthUrl`.
3. Si la sonde réussit, OpenClaw utilise le serveur existant.
4. Si la sonde échoue, OpenClaw démarre `command` avec `args`.
5. OpenClaw interroge l’état de préparation jusqu’à l’expiration de `readyTimeoutMs`.
6. La requête de modèle est envoyée via le transport normal du fournisseur.
7. Si OpenClaw a démarré le processus et que `idleStopMs` est positif, le processus est
   arrêté après que la dernière requête en cours est restée inactive pendant cette durée.

OpenClaw n’installe pas launchd, systemd, Docker ni de daemon pour cela. Le
serveur est un processus enfant du processus OpenClaw qui en a eu besoin en
premier.

## Structure de la configuration

```json5
{
  models: {
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "local-model",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/absolute/path/to/server",
          args: ["--host", "127.0.0.1", "--port", "8000"],
          cwd: "/absolute/path/to/working-dir",
          env: { LOCAL_MODEL_CACHE: "/absolute/path/to/cache" },
          healthUrl: "http://127.0.0.1:8000/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "my-local-model",
            name: "My Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Champs

- `command` : chemin absolu de l’exécutable. La recherche via le shell n’est pas utilisée.
- `args` : arguments du processus. Aucune expansion shell, aucun tube, globbing ni règle de citation
  n’est appliqué.
- `cwd` : répertoire de travail facultatif pour le processus.
- `env` : variables d’environnement facultatives fusionnées par-dessus l’environnement du processus
  OpenClaw.
- `healthUrl` : URL de disponibilité. Si elle est omise, OpenClaw ajoute `/models` à
  `baseUrl`, donc `http://127.0.0.1:8000/v1` devient
  `http://127.0.0.1:8000/v1/models`.
- `readyTimeoutMs` : délai limite de disponibilité au démarrage. Valeur par défaut : `120000`.
- `idleStopMs` : délai d’arrêt sur inactivité pour les processus démarrés par OpenClaw. `0` ou
  une omission maintient le processus en vie jusqu’à la fermeture d’OpenClaw.

## Exemple Inferrs

Inferrs est un backend `/v1` personnalisé compatible OpenAI ; la même API de service local
fonctionne donc avec l’entrée de fournisseur `inferrs`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

Remplacez `command` par le résultat de `which inferrs` sur la machine exécutant
OpenClaw.

## Exemple ds4

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
          command: "/Users/you/Projects/oss/ds4/ds4-server",
          args: [
            "--model",
            "/Users/you/Projects/oss/ds4/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "393216",
          ],
          cwd: "/Users/you/Projects/oss/ds4",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [],
      },
    },
  },
}
```

## Notes opérationnelles

- Un processus OpenClaw gère l’enfant qu’il a démarré. Un autre processus OpenClaw
  qui voit la même URL de santé déjà active la réutilisera sans l’adopter.
- Le démarrage est sérialisé par commande de fournisseur et ensemble d’arguments, de sorte que les requêtes
  concurrentes ne lancent pas de serveurs en double pour la même configuration.
- Les réponses en streaming actives conservent un bail ; l’arrêt sur inactivité attend que la gestion
  du corps de la réponse soit terminée.
- Utilisez `timeoutSeconds` sur les fournisseurs locaux lents afin que les démarrages à froid et les longues générations
  n’atteignent pas le délai d’expiration par défaut des requêtes de modèle.
- Utilisez un `healthUrl` explicite si votre serveur expose sa disponibilité ailleurs
  que sur `/v1/models`.

## Connexe

<CardGroup cols={2}>
  <Card title="Local models" href="/fr/gateway/local-models" icon="server">
    Configuration des modèles locaux, choix des fournisseurs et conseils de sécurité.
  </Card>
  <Card title="Inferrs" href="/fr/providers/inferrs" icon="cpu">
    Exécutez OpenClaw via le serveur local compatible OpenAI d’inferrs.
  </Card>
</CardGroup>
