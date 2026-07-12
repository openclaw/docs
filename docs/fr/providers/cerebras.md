---
read_when:
    - Vous souhaitez utiliser Cerebras avec OpenClaw
    - Vous devez fournir la variable d’environnement de la clé API Cerebras ou choisir l’authentification via la CLI
summary: Configuration de Cerebras (authentification + sélection du modèle)
title: Cerebras
x-i18n:
    generated_at: "2026-07-12T03:13:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fca8110d345c796f0481ebf1a8d85c2cc9630b8bd55db8d4bf60772151b35b37
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) fournit une inférence à haute vitesse compatible avec OpenAI sur du matériel d’inférence personnalisé. Le Plugin inclut un catalogue statique de quatre modèles (sans découverte en temps réel).

| Propriété                       | Valeur                                                    |
| ------------------------------- | --------------------------------------------------------- |
| Identifiant du fournisseur      | `cerebras`                                                |
| Plugin                          | paquet externe officiel (`@openclaw/cerebras-provider`)   |
| Variable d’environnement d’authentification | `CEREBRAS_API_KEY`                              |
| Option d’intégration            | `--auth-choice cerebras-api-key`                          |
| Option CLI directe              | `--cerebras-api-key <key>`                                |
| API                             | compatible avec OpenAI (`openai-completions`)             |
| URL de base                     | `https://api.cerebras.ai/v1`                              |
| Modèle par défaut               | `cerebras/zai-glm-4.7`                                    |

## Installer le Plugin

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## Prise en main

<Steps>
  <Step title="Obtenir une clé API">
    Créez une clé API dans la [Cerebras Cloud Console](https://cloud.cerebras.ai).
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

```bash Variable d’environnement uniquement
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Vérifier que les modèles sont disponibles">
    ```bash
    openclaw models list --provider cerebras
    ```

    Répertorie les quatre modèles statiques. Si `CEREBRAS_API_KEY` ne peut pas être résolue, `openclaw models status --json` signale l’identifiant d’authentification manquant sous `auth.unusableProfiles`.

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

Les quatre modèles disposent d’une fenêtre de contexte de 128 000 jetons et d’une sortie maximale de 8 192 jetons.

| Référence du modèle                       | Nom                  | Raisonnement | Remarques                                          |
| ----------------------------------------- | -------------------- | ------------ | -------------------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | oui          | Modèle par défaut ; modèle de raisonnement en préversion |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | oui          | Modèle de raisonnement pour la production          |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | non          | Modèle sans raisonnement en préversion              |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | non          | Modèle de production axé sur la vitesse             |

<Warning>
Cerebras classe `zai-glm-4.7` et `qwen-3-235b-a22b-instruct-2507` comme modèles en préversion. La dépréciation de `llama3.1-8b` et de `qwen-3-235b-a22b-instruct-2507` est par ailleurs annoncée pour le 27 mai 2026. Consultez la [page des modèles pris en charge](https://inference-docs.cerebras.ai/models/overview) de Cerebras avant de les utiliser pour des charges de travail en production.
</Warning>

## Configuration manuelle

Dans la plupart des configurations, seule la clé API est nécessaire. Utilisez une configuration `models.providers.cerebras` explicite pour remplacer les métadonnées des modèles ou utiliser `mode: "merge"` avec le catalogue statique :

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
Si le Gateway s’exécute en tant que démon (launchd, systemd, Docker), assurez-vous que `CEREBRAS_API_KEY` est accessible à ce processus, par exemple dans `~/.openclaw/.env` ou par l’intermédiaire de `env.shellEnv`. Une clé exportée uniquement dans un shell interactif ne sera pas accessible à un service géré, sauf si l’environnement est importé séparément.
</Note>

## Pages connexes

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
