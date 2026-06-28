---
read_when:
    - Vous souhaitez utiliser Synthetic comme fournisseur de modèles
    - Vous devez configurer une clé API ou une URL de base Synthetic
summary: Utiliser l’API compatible Anthropic de Synthetic dans OpenClaw
title: Synthetic
x-i18n:
    generated_at: "2026-04-24T07:29:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81a48573782d46f0b018d19ab607729b236c241e57535e4af52eb8c142fee59b
    source_path: providers/synthetic.md
    workflow: 15
    postprocess_version: locale-links-v1
---

[Synthetic](https://synthetic.new) expose des endpoints compatibles Anthropic.
OpenClaw l’enregistre comme fournisseur `synthetic` et utilise l’API
Anthropic Messages.

| Propriété | Valeur                                |
| --------- | ------------------------------------- |
| Fournisseur | `synthetic`                         |
| Authentification | `SYNTHETIC_API_KEY`         |
| API       | Anthropic Messages                    |
| URL de base | `https://api.synthetic.new/anthropic` |

## Premiers pas

<Steps>
  <Step title="Obtenir une clé API">
    Obtenez une `SYNTHETIC_API_KEY` depuis votre compte Synthetic, ou laissez
    l’assistant d’onboarding vous en demander une.
  </Step>
  <Step title="Lancer l’onboarding">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="Vérifier le modèle par défaut">
    Après l’onboarding, le modèle par défaut est défini sur :
    ```
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
Le client Anthropic d’OpenClaw ajoute automatiquement `/v1` à l’URL de base, utilisez donc
`https://api.synthetic.new/anthropic` (et non `/anthropic/v1`). Si Synthetic
change son URL de base, surchargez `models.providers.synthetic.baseUrl`.
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

Tous les modèles Synthetic utilisent un coût `0` (entrée/sortie/cache).

| ID du modèle                                          | Fenêtre de contexte | Max tokens | Raisonnement | Entrée         |
| ----------------------------------------------------- | ------------------- | ---------- | ------------ | -------------- |
| `hf:MiniMaxAI/MiniMax-M2.5`                           | 192 000             | 65 536     | non          | texte          |
| `hf:moonshotai/Kimi-K2-Thinking`                      | 256 000             | 8 192      | oui          | texte          |
| `hf:zai-org/GLM-4.7`                                  | 198 000             | 128 000    | non          | texte          |
| `hf:deepseek-ai/DeepSeek-R1-0528`                     | 128 000             | 8 192      | non          | texte          |
| `hf:deepseek-ai/DeepSeek-V3-0324`                     | 128 000             | 8 192      | non          | texte          |
| `hf:deepseek-ai/DeepSeek-V3.1`                        | 128 000             | 8 192      | non          | texte          |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`               | 128 000             | 8 192      | non          | texte          |
| `hf:deepseek-ai/DeepSeek-V3.2`                        | 159 000             | 8 192      | non          | texte          |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                | 128 000             | 8 192      | non          | texte          |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8`| 524 000             | 8 192      | non          | texte          |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                 | 256 000             | 8 192      | non          | texte          |
| `hf:moonshotai/Kimi-K2.5`                             | 256 000             | 8 192      | oui          | texte + image  |
| `hf:openai/gpt-oss-120b`                              | 128 000             | 8 192      | non          | texte          |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`               | 256 000             | 8 192      | non          | texte          |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`              | 256 000             | 8 192      | non          | texte          |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                 | 250 000             | 8 192      | non          | texte + image  |
| `hf:zai-org/GLM-4.5`                                  | 128 000             | 128 000    | non          | texte          |
| `hf:zai-org/GLM-4.6`                                  | 198 000             | 128 000    | non          | texte          |
| `hf:zai-org/GLM-5`                                    | 256 000             | 128 000    | oui          | texte + image  |
| `hf:deepseek-ai/DeepSeek-V3`                          | 128 000             | 8 192      | non          | texte          |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`               | 256 000             | 8 192      | oui          | texte          |

<Tip>
Les références de modèles utilisent la forme `synthetic/<modelId>`. Utilisez
`openclaw models list --provider synthetic` pour voir tous les modèles disponibles sur votre
compte.
</Tip>

<AccordionGroup>
  <Accordion title="Liste d’autorisation de modèles">
    Si vous activez une liste d’autorisation de modèles (`agents.defaults.models`), ajoutez tous les
    modèles Synthetic que vous prévoyez d’utiliser. Les modèles absents de la liste d’autorisation seront cachés
    à l’agent.
  </Accordion>

  <Accordion title="Surcharge d’URL de base">
    Si Synthetic change son endpoint API, surchargez l’URL de base dans votre configuration :

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

    N’oubliez pas qu’OpenClaw ajoute automatiquement `/v1`.

  </Accordion>
</AccordionGroup>

## Articles connexes

<CardGroup cols={2}>
  <Card title="Sélection des modèles" href="/fr/concepts/model-providers" icon="layers">
    Règles des fournisseurs, références de modèles et comportement de bascule.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Schéma de configuration complet incluant les paramètres des fournisseurs.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Tableau de bord Synthetic et documentation de l’API.
  </Card>
</CardGroup>
