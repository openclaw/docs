---
read_when:
    - Vous souhaitez utiliser Cerebras avec OpenClaw
    - Vous avez besoin de la variable d’environnement de la clé API Cerebras ou de l’option d’authentification de la CLI
summary: Configuration de Cerebras (authentification + sélection du modèle)
title: Cerebras
x-i18n:
    generated_at: "2026-07-12T15:51:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fca8110d345c796f0481ebf1a8d85c2cc9630b8bd55db8d4bf60772151b35b37
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) fournit une inférence à haute vitesse compatible avec OpenAI sur du matériel d’inférence personnalisé. Le Plugin inclut un catalogue statique de quatre modèles (sans découverte en direct).

| Propriété                  | Valeur                                                    |
| -------------------------- | --------------------------------------------------------- |
| Identifiant du fournisseur | `cerebras`                                                |
| Plugin                     | paquet externe officiel (`@openclaw/cerebras-provider`)   |
| Variable d’environnement d’authentification | `CEREBRAS_API_KEY`                          |
| Option d’intégration       | `--auth-choice cerebras-api-key`                          |
| Option CLI directe         | `--cerebras-api-key <key>`                                |
| API                        | compatible avec OpenAI (`openai-completions`)             |
| URL de base                | `https://api.cerebras.ai/v1`                              |
| Modèle par défaut          | `cerebras/zai-glm-4.7`                                    |

## Installer le Plugin

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## Prise en main

<Steps>
  <Step title="Obtenir une clé API">
    Créez une clé API dans la [console Cerebras Cloud](https://cloud.cerebras.ai).
  </Step>
  <Step title="Exécuter l’intégration">
    <CodeGroup>

```bash Intégration
openclaw onboard --auth-choice cerebras-api-key
```

```bash Option directe
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Environnement uniquement
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Vérifier que les modèles sont disponibles">
    ```bash
    openclaw models list --provider cerebras
    ```

    Répertorie les quatre modèles statiques. Si `CEREBRAS_API_KEY` n’est pas résolue, `openclaw models status --json` signale l’identifiant d’authentification manquant sous `auth.unusableProfiles`.

  </Step>
</Steps>

## Configuration non interactive

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## Catalogue intégré

Les quatre modèles partagent une fenêtre de contexte de 128k et une sortie maximale de 8,192 jetons.

| Référence du modèle                       | Nom                  | Raisonnement | Remarques                                         |
| ----------------------------------------- | -------------------- | ------------ | ------------------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | oui          | Modèle par défaut ; modèle de raisonnement en aperçu |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | oui          | Modèle de raisonnement en production              |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | non          | Modèle sans raisonnement en aperçu                 |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | non          | Modèle de production axé sur la vitesse            |

<Warning>
Cerebras indique que `zai-glm-4.7` et `qwen-3-235b-a22b-instruct-2507` sont des modèles en aperçu, et la dépréciation de `llama3.1-8b` ainsi que de `qwen-3-235b-a22b-instruct-2507` est documentée pour le 27 mai 2026. Consultez la [page des modèles pris en charge](https://inference-docs.cerebras.ai/models/overview) de Cerebras avant de les utiliser pour des charges de travail de production.
</Warning>

## Configuration manuelle

La plupart des configurations nécessitent uniquement la clé API. Utilisez une configuration `models.providers.cerebras` explicite pour remplacer les métadonnées des modèles ou exécuter le mode `mode: "merge"` avec le catalogue statique :

```json5
{
  env: { CEREBRAS_API_KEY: "csk-..." },
  agents: {
    defaults: {
      model: { primary: "cerebras/zai-glm-4.7" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "Z.ai GLM 4.7" },
          { id: "gpt-oss-120b", name: "GPT OSS 120B" },
        ],
      },
    },
  },
}
```

<Note>
Si le Gateway s’exécute comme un démon (launchd, systemd, Docker), assurez-vous que `CEREBRAS_API_KEY` est disponible pour ce processus, par exemple dans `~/.openclaw/.env` ou via `env.shellEnv`. Une clé exportée uniquement dans un interpréteur de commandes interactif ne sera pas accessible à un service géré, sauf si l’environnement est importé séparément.
</Note>

## Ressources associées

<CardGroup cols={2}>
  <Card title="Fournisseurs de modèles" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Modes de réflexion" href="/fr/tools/thinking" icon="brain">
    Niveaux d’effort de raisonnement pour les deux modèles Cerebras capables de raisonner.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/config-agents#agent-defaults" icon="gear">
    Valeurs par défaut des agents et configuration des modèles.
  </Card>
  <Card title="FAQ sur les modèles" href="/fr/help/faq-models" icon="circle-question">
    Profils d’authentification, changement de modèle et résolution des erreurs « no profile ».
  </Card>
</CardGroup>
