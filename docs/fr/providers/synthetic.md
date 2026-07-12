---
read_when:
    - Vous souhaitez utiliser Synthetic comme fournisseur de modèles
    - Vous devez configurer une clé API Synthetic ou une URL de base
summary: Utiliser l’API compatible avec Anthropic de Synthetic dans OpenClaw
title: Synthetic
x-i18n:
    generated_at: "2026-07-12T15:46:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f1882a34aa1ca52403b92effdbf3b753fd911575af6d8b8aa5d692245b8e8f1b
    source_path: providers/synthetic.md
    workflow: 16
---

[Synthetic](https://synthetic.new) expose des points de terminaison compatibles avec Anthropic.
OpenClaw l’intègre en tant que fournisseur `synthetic` et utilise l’API
Messages d’Anthropic.

| Propriété   | Valeur                                |
| ----------- | ------------------------------------- |
| Fournisseur | `synthetic`                           |
| Auth        | `SYNTHETIC_API_KEY`                   |
| API         | Messages d’Anthropic                  |
| URL de base | `https://api.synthetic.new/anthropic` |

## Prise en main

<Steps>
  <Step title="Obtenir une clé API">
    Obtenez une `SYNTHETIC_API_KEY` depuis votre compte Synthetic, ou laissez le processus d’intégration
    vous en demander une.
  </Step>
  <Step title="Exécuter le processus d’intégration">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="Vérifier le modèle par défaut">
    Le processus d’intégration définit le modèle par défaut sur :
    ```text
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
Le client Anthropic d’OpenClaw ajoute automatiquement `/v1` à l’URL de base ; utilisez donc
`https://api.synthetic.new/anthropic` (et non `/anthropic/v1`). Si Synthetic
modifie son URL de base, remplacez `models.providers.synthetic.baseUrl`.
</Warning>

## Exemple de configuration

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## Catalogue intégré

Tous les modèles Synthetic utilisent un coût de `0` (entrée/sortie/cache).

| ID du modèle                                            | Fenêtre de contexte | Nombre maximal de jetons | Raisonnement | Entrée        |
| ------------------------------------------------------ | ------------------- | ------------------------ | ------------ | ------------- |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000             | 65,536                   | non          | texte         |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000             | 8,192                    | oui          | texte         |
| `hf:zai-org/GLM-4.7`                                   | 198,000             | 128,000                  | non          | texte         |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000             | 8,192                    | non          | texte         |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000             | 8,192                    | non          | texte         |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000             | 8,192                    | non          | texte         |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000             | 8,192                    | non          | texte         |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000             | 8,192                    | non          | texte         |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000             | 8,192                    | non          | texte         |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000             | 8,192                    | non          | texte         |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000             | 8,192                    | non          | texte         |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000             | 8,192                    | oui          | texte + image |
| `hf:openai/gpt-oss-120b`                               | 128,000             | 8,192                    | non          | texte         |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000             | 8,192                    | non          | texte         |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000             | 8,192                    | non          | texte         |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000             | 8,192                    | non          | texte + image |
| `hf:zai-org/GLM-4.5`                                   | 128,000             | 128,000                  | non          | texte         |
| `hf:zai-org/GLM-4.6`                                   | 198,000             | 128,000                  | non          | texte         |
| `hf:zai-org/GLM-5`                                     | 256,000             | 128,000                  | oui          | texte + image |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000             | 8,192                    | non          | texte         |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000             | 8,192                    | oui          | texte         |

<Tip>
Les références de modèle utilisent la forme `synthetic/<modelId>`. Utilisez
`openclaw models list --provider synthetic` pour afficher tous les modèles disponibles pour votre
compte.
</Tip>

<AccordionGroup>
  <Accordion title="Liste d’autorisation des modèles">
    Si vous activez une liste d’autorisation des modèles (`agents.defaults.models`), ajoutez chaque
    modèle Synthetic que vous prévoyez d’utiliser. Les modèles absents de la liste d’autorisation sont masqués
    pour l’agent.
  </Accordion>

  <Accordion title="Remplacement de l’URL de base">
    Si Synthetic modifie son point de terminaison d’API, remplacez l’URL de base :

    ```json5
    {
      models: {
        providers: {
          synthetic: {
            baseUrl: "https://new-api.synthetic.new/anthropic",
          },
        },
      },
    }
    ```

    OpenClaw ajoute toujours automatiquement `/v1`.

  </Accordion>
</AccordionGroup>

## Voir aussi

<CardGroup cols={2}>
  <Card title="Fournisseurs de modèles" href="/fr/concepts/model-providers" icon="layers">
    Règles des fournisseurs, références de modèles et comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Schéma de configuration complet, y compris les paramètres des fournisseurs.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Tableau de bord Synthetic et documentation de l’API.
  </Card>
</CardGroup>
