---
read_when:
    - Vous souhaitez utiliser Cerebras avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé API Cerebras ou du choix d’authentification CLI
summary: Configuration de Cerebras (authentification + sélection du modèle)
title: Cerebras
x-i18n:
    generated_at: "2026-04-30T07:43:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96f94b23e55340414633ff48e352623907ee36dd2715e5ab053a93c86df1b49a
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) fournit une inférence à haut débit compatible avec OpenAI.

| Propriété       | Valeur                       |
| --------------- | ---------------------------- |
| Fournisseur     | `cerebras`                   |
| Authentification | `CEREBRAS_API_KEY`          |
| API             | Compatible avec OpenAI       |
| URL de base     | `https://api.cerebras.ai/v1` |

## Démarrage

<Steps>
  <Step title="Obtenir une clé API">
    Créez une clé API dans la [console Cerebras Cloud](https://cloud.cerebras.ai).
  </Step>
  <Step title="Exécuter l’onboarding">
    ```bash
    openclaw onboard --auth-choice cerebras-api-key
    ```
  </Step>
  <Step title="Vérifier que les modèles sont disponibles">
    ```bash
    openclaw models list --provider cerebras
    ```
  </Step>
</Steps>

### Configuration non interactive

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## Catalogue intégré

OpenClaw fournit un catalogue Cerebras statique pour le point de terminaison public compatible avec OpenAI :

| Référence de modèle                       | Nom                  | Notes                                      |
| ----------------------------------------- | -------------------- | ------------------------------------------ |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | Modèle par défaut ; modèle de raisonnement en préversion |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | Modèle de raisonnement de production       |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | Modèle sans raisonnement en préversion     |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | Modèle de production axé sur la vitesse    |

<Warning>
Cerebras marque `zai-glm-4.7` et `qwen-3-235b-a22b-instruct-2507` comme modèles en préversion, et `llama3.1-8b` / `qwen-3-235b-a22b-instruct-2507` sont documentés comme devant être abandonnés le 27 mai 2026. Consultez la page des modèles pris en charge de Cerebras avant de vous y fier en production.
</Warning>

## Configuration manuelle

Le Plugin fourni signifie généralement que vous n’avez besoin que de la clé API. Utilisez la configuration explicite
`models.providers.cerebras` lorsque vous souhaitez remplacer les métadonnées des modèles :

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
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
Si le Gateway s’exécute en tant que démon (launchd/systemd), assurez-vous que `CEREBRAS_API_KEY`
est disponible pour ce processus, par exemple dans `~/.openclaw/.env` ou via
`env.shellEnv`.
</Note>
