---
read_when:
    - Vous voulez une seule clé API pour de nombreux LLMs
    - Vous avez besoin d’instructions de configuration pour Baidu Qianfan
summary: Utiliser l’API unifiée de Qianfan pour accéder à de nombreux modèles dans OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-06-27T18:07:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8bc31970dc7fbc43819ec6d51f4bd0047b1acc5a03b23b656e617e3abd97475
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan est la plateforme MaaS de Baidu, fournissant une **API unifiée** qui achemine les requêtes vers de nombreux modèles derrière un seul
point de terminaison et une clé API unique. Elle est compatible OpenAI, donc la plupart des SDK OpenAI fonctionnent en changeant l’URL de base.

| Propriété | Valeur                            |
| --------- | --------------------------------- |
| Fournisseur | `qianfan`                       |
| Authentification | `QIANFAN_API_KEY`          |
| API       | Compatible OpenAI                 |
| URL de base | `https://qianfan.baidubce.com/v2` |

## Installer le Plugin

Installez le Plugin officiel, puis redémarrez Gateway :

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## Premiers pas

<Steps>
  <Step title="Create a Baidu Cloud account">
    Inscrivez-vous ou connectez-vous à la [console Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey) et assurez-vous que l’accès à l’API Qianfan est activé.
  </Step>
  <Step title="Generate an API key">
    Créez une nouvelle application ou sélectionnez-en une existante, puis générez une clé API. Le format de la clé est `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Catalogue intégré

| Référence du modèle                  | Entrée      | Contexte | Sortie max. | Raisonnement | Notes              |
| ------------------------------------ | ----------- | -------- | ----------- | ------------ | ------------------ |
| `qianfan/deepseek-v3.2`              | texte       | 98,304   | 32,768      | Oui          | Modèle par défaut  |
| `qianfan/ernie-5.0-thinking-preview` | texte, image | 119,000 | 64,000      | Oui          | Multimodal         |

<Tip>
La référence de modèle par défaut est `qianfan/deepseek-v3.2`. Vous ne devez remplacer `models.providers.qianfan` que lorsque vous avez besoin d’une URL de base personnalisée ou de métadonnées de modèle.
</Tip>

## Exemple de configuration

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Transport and compatibility">
    Qianfan utilise le chemin de transport compatible OpenAI, et non la mise en forme native des requêtes OpenAI. Cela signifie que les fonctionnalités standard des SDK OpenAI fonctionnent, mais que les paramètres propres au fournisseur peuvent ne pas être transmis.
  </Accordion>

  <Accordion title="Catalog and overrides">
    Le catalogue statique inclut actuellement `deepseek-v3.2` et `ernie-5.0-thinking-preview`. Ajoutez ou remplacez `models.providers.qianfan` uniquement lorsque vous avez besoin d’une URL de base personnalisée ou de métadonnées de modèle.

    <Note>
    Les références de modèle utilisent le préfixe `qianfan/` (par exemple `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - Assurez-vous que votre clé API commence par `bce-v3/ALTAK-` et que l’accès à l’API Qianfan est activé dans la console Baidu Cloud.
    - Si les modèles ne sont pas listés, vérifiez que le service Qianfan est activé pour votre compte.
    - L’URL de base par défaut est `https://qianfan.baidubce.com/v2`. Ne la modifiez que si vous utilisez un point de terminaison personnalisé ou un proxy.

  </Accordion>
</AccordionGroup>

## Associés

<CardGroup cols={2}>
  <Card title="Model selection" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèle et le comportement de basculement.
  </Card>
  <Card title="Configuration reference" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de configuration OpenClaw.
  </Card>
  <Card title="Agent setup" href="/fr/concepts/agent" icon="robot">
    Configurer les valeurs par défaut des agents et les affectations de modèles.
  </Card>
  <Card title="Qianfan API docs" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Documentation officielle de l’API Qianfan.
  </Card>
</CardGroup>
