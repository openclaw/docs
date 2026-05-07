---
read_when:
    - Vous souhaitez utiliser gratuitement des modèles ouverts dans OpenClaw
    - Vous devez configurer NVIDIA_API_KEY
summary: Utiliser l’API compatible OpenAI de NVIDIA dans OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-05-07T13:25:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8846c51b056e05f8552b3804d4dac73ff34aa874ec3d5d6fb13fad5a4112bc7f
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA fournit une API compatible avec OpenAI à `https://integrate.api.nvidia.com/v1` pour
les modèles ouverts, gratuitement. Authentifiez-vous avec une clé d’API depuis
[build.nvidia.com](https://build.nvidia.com/settings/api-keys).

## Bien démarrer

<Steps>
  <Step title="Get your API key">
    Créez une clé d’API sur [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Export the key and run onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Set an NVIDIA model">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
Si vous passez `--nvidia-api-key` au lieu de la variable d’environnement, la valeur se retrouve dans
l’historique du shell et dans la sortie de `ps`. Préférez la variable d’environnement `NVIDIA_API_KEY` lorsque
possible.
</Warning>

Pour une configuration non interactive, vous pouvez aussi passer la clé directement :

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

## Exemple de configuration

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## Catalogue intégré

| Référence de modèle                         | Nom                          | Contexte | Sortie maximale |
| ------------------------------------------ | ---------------------------- | -------- | --------------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144  | 8,192           |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144  | 8,192           |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608  | 8,192           |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752  | 8,192           |

## Configuration avancée

<AccordionGroup>
  <Accordion title="Auto-enable behavior">
    Le fournisseur s’active automatiquement lorsque la variable d’environnement `NVIDIA_API_KEY` est définie.
    Aucune configuration explicite du fournisseur n’est requise au-delà de la clé.
  </Accordion>

  <Accordion title="Catalog and pricing">
    Le catalogue fourni est statique. Les coûts sont définis par défaut sur `0` dans la source, car NVIDIA
    propose actuellement un accès API gratuit pour les modèles listés.
  </Accordion>

  <Accordion title="OpenAI-compatible endpoint">
    NVIDIA utilise le point de terminaison standard de complétions `/v1`. Tout outil compatible avec OpenAI
    devrait fonctionner directement avec l’URL de base NVIDIA.
  </Accordion>

  <Accordion title="Slow custom provider responses">
    Certains modèles personnalisés hébergés par NVIDIA peuvent prendre plus longtemps que le délai de surveillance d’inactivité
    par défaut du modèle avant d’émettre le premier fragment de réponse. Pour les entrées de fournisseur NVIDIA personnalisées,
    augmentez le délai d’expiration du fournisseur au lieu d’augmenter le délai d’expiration de tout l’environnement d’exécution
    de l’agent :

    ```json5
    {
      models: {
        providers: {
          "custom-integrate-api-nvidia-com": {
            baseUrl: "https://integrate.api.nvidia.com/v1",
            api: "openai-completions",
            apiKey: "NVIDIA_API_KEY",
            timeoutSeconds: 300,
          },
        },
      },
      agents: {
        defaults: {
          models: {
            "custom-integrate-api-nvidia-com/meta/llama-3.1-70b-instruct": {
              params: { thinking: "off" },
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

<Tip>
Les modèles NVIDIA sont actuellement gratuits. Consultez
[build.nvidia.com](https://build.nvidia.com/) pour les dernières informations de disponibilité et
de limites de débit.
</Tip>

## Articles connexes

<CardGroup cols={2}>
  <Card title="Model selection" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de basculement.
  </Card>
  <Card title="Configuration reference" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de configuration pour les agents, les modèles et les fournisseurs.
  </Card>
</CardGroup>
