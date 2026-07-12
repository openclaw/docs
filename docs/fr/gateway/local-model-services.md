---
read_when:
    - Vous souhaitez qu’OpenClaw démarre un serveur de modèles local uniquement lorsque son fournisseur de modèles ou d’embeddings est sélectionné
    - Vous exécutez ds4, inferrs, vLLM, llama.cpp, MLX ou un autre serveur local compatible avec OpenAI
    - Vous devez contrôler le démarrage à froid, l’état de préparation et l’arrêt en cas d’inactivité des fournisseurs locaux.
summary: Démarrer les serveurs de modèles locaux à la demande avant les requêtes de modèles et d’embeddings d’OpenClaw
title: Services de modèles locaux
x-i18n:
    generated_at: "2026-07-12T02:51:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a761113dd591fed0394379b2bad173165efc5e284565c652493e73d1e724529d
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` démarre à la demande un serveur de modèles local géré par le fournisseur. Lorsqu’une requête de modèle ou d’embedding sélectionne ce fournisseur, OpenClaw sonde le point de terminaison de santé, démarre le processus s’il est arrêté, attend qu’il soit prêt, puis envoie la requête. Utilisez cette fonctionnalité pour éviter de laisser tourner toute la journée des serveurs locaux coûteux en ressources.

## Fonctionnement

1. Une requête de modèle ou d’embedding est résolue vers un fournisseur configuré.
2. Si ce fournisseur possède `localService`, OpenClaw sonde `healthUrl`.
3. Si la sonde réussit, OpenClaw utilise le serveur déjà en cours d’exécution.
4. Si la sonde échoue, OpenClaw lance `command` avec `args`.
5. OpenClaw interroge le point de terminaison de santé jusqu’à l’expiration de `readyTimeoutMs`.
6. La requête passe par le transport habituel de modèle ou d’embedding.
7. Si OpenClaw a démarré le processus et que `idleStopMs` est défini, il arrête le processus une fois que la dernière requête en cours est restée inactive pendant cette durée.

OpenClaw n’installe ni launchd, ni systemd, ni Docker, ni aucun démon à cette fin. Le serveur est un simple processus enfant du processus OpenClaw qui en a eu besoin en premier.

Le démarrage est sérialisé pour chaque fournisseur configuré et chaque ensemble de commande, d’arguments et de variables d’environnement. Ainsi, des requêtes simultanées de conversation et d’embedding destinées au même service ne lancent pas de serveurs en double. Chaque requête conserve son propre bail jusqu’à la fin du traitement de la réponse ; l’arrêt pour inactivité attend donc la fin de toutes les requêtes de modèle et d’embedding en cours. Les alias de fournisseurs configurés restent distincts : deux alias peuvent désigner des hôtes GPU différents sans être fusionnés sous le même identifiant d’adaptateur Ollama, LM Studio ou compatible OpenAI.

Si un autre processus OpenClaw dispose déjà d’un serveur opérationnel à la même `healthUrl`, ce processus le réutilise sans en prendre la gestion (chaque processus ne gère que l’enfant qu’il a lui-même démarré). Les journaux de démarrage et d’arrêt incluent des extraits finaux limités et expurgés de la sortie du processus enfant, ainsi que les durées et les détails de sortie ; les valeurs d’environnement configurées ne sont jamais consignées.

## Structure de configuration

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

Définissez `timeoutSeconds` dans l’entrée du fournisseur (et non dans `localService`) afin que les démarrages à froid lents et les longues générations n’atteignent pas le délai d’expiration par défaut des requêtes de modèle. Définissez explicitement `healthUrl` chaque fois que votre serveur expose son état de préparation ailleurs que sur `/models` dans l’URL de base.

## Champs

| Champ            | Obligatoire | Description                                                                                                                                         |
| ---------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`        | oui         | Chemin absolu de l’exécutable. Aucune recherche dans le PATH de l’interpréteur de commandes.                                                        |
| `args`           | non         | Arguments du processus. Aucune expansion par l’interpréteur de commandes, aucun tube, développement de motifs génériques ni traitement des guillemets. |
| `cwd`            | non         | Répertoire de travail du processus.                                                                                                                 |
| `env`            | non         | Variables d’environnement fusionnées avec l’environnement du processus OpenClaw.                                                                   |
| `healthUrl`      | non         | URL d’état de préparation. Par défaut, `/models` est ajouté à `baseUrl` (`http://127.0.0.1:8000/v1` devient `http://127.0.0.1:8000/v1/models`).      |
| `readyTimeoutMs` | non         | Délai maximal d’attente de l’état de préparation au démarrage. Valeur par défaut : `120000`.                                                       |
| `idleStopMs`     | non         | Délai d’arrêt pour inactivité d’un processus démarré par OpenClaw. `0` ou une valeur omise le maintient actif jusqu’à l’arrêt d’OpenClaw.          |

## Exemple avec Inferrs

Inferrs est un backend `/v1` personnalisé compatible avec OpenAI ; la même API `localService` fonctionne donc avec une entrée de fournisseur `inferrs` :

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
            compat: { requiresStringContent: true },
          },
        ],
      },
    },
  },
}
```

Remplacez `command` par le résultat de `which inferrs` sur la machine qui exécute OpenClaw. Configuration complète d’inferrs : [Inferrs](/fr/providers/inferrs).

## Exemple avec ds4

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
        models: [],
      },
    },
  },
}
```

Configuration complète, dimensionnement du contexte et commandes de vérification : [ds4](/fr/providers/ds4).

## Voir aussi

<CardGroup cols={2}>
  <Card title="Modèles locaux" href="/fr/gateway/local-models" icon="server">
    Configuration des modèles locaux, choix des fournisseurs et recommandations de sécurité.
  </Card>
  <Card title="Inferrs" href="/fr/providers/inferrs" icon="cpu">
    Exécutez OpenClaw par l’intermédiaire du serveur local inferrs compatible avec OpenAI.
  </Card>
</CardGroup>
