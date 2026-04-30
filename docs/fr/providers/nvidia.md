---
read_when:
    - Vous voulez utiliser gratuitement des modèles ouverts dans OpenClaw
    - Vous devez configurer NVIDIA_API_KEY
summary: Utiliser l’API compatible OpenAI de NVIDIA dans OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-30T07:44:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 297cc25cf5235bb51f3962c2a1b8799ca6544d57e701c42e9b1e1c7d881ad32b
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA fournit une API compatible avec OpenAI à `https://integrate.api.nvidia.com/v1` pour
les modèles ouverts gratuitement. Authentifiez-vous avec une clé API depuis
[build.nvidia.com](https://build.nvidia.com/settings/api-keys).

## Bien démarrer

<Steps>
  <Step title="Obtenir votre clé API">
    Créez une clé API sur [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Exporter la clé et exécuter l’onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Définir un modèle NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
Si vous passez `--nvidia-api-key` au lieu de la variable d’environnement, la valeur se retrouve dans l’historique
du shell et la sortie de `ps`. Préférez la variable d’environnement `NVIDIA_API_KEY` lorsque
c’est possible.
</Warning>

Pour une configuration non interactive, vous pouvez aussi passer la clé directement :

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

| Réf. de modèle                            | Nom                          | Contexte | Sortie max |
| ------------------------------------------ | ---------------------------- | ------- | ---------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192      |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192      |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192      |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192      |

## Configuration avancée

<AccordionGroup>
  <Accordion title="Comportement d’activation automatique">
    Le fournisseur s’active automatiquement lorsque la variable d’environnement `NVIDIA_API_KEY` est définie.
    Aucune configuration explicite du fournisseur n’est requise au-delà de la clé.
  </Accordion>

  <Accordion title="Catalogue et tarification">
    Le catalogue inclus est statique. Les coûts valent par défaut `0` dans le source, car NVIDIA
    offre actuellement un accès gratuit à l’API pour les modèles listés.
  </Accordion>

  <Accordion title="Point de terminaison compatible avec OpenAI">
    NVIDIA utilise le point de terminaison de complétions `/v1` standard. Tout outillage compatible avec OpenAI
    devrait fonctionner directement avec l’URL de base NVIDIA.
  </Accordion>
</AccordionGroup>

<Tip>
Les modèles NVIDIA sont actuellement gratuits. Consultez
[build.nvidia.com](https://build.nvidia.com/) pour connaître la disponibilité la plus récente et
les détails des limites de débit.
</Tip>

## Voir aussi

<CardGroup cols={2}>
  <Card title="Sélection des modèles" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de la configuration pour les agents, modèles et fournisseurs.
  </Card>
</CardGroup>
