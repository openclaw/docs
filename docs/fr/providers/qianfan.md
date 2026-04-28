---
read_when:
    - Vous souhaitez une clé API unique pour de nombreux LLMs
    - Vous avez besoin d’un guide de configuration Baidu Qianfan
summary: Utiliser l’API unifiée de Qianfan pour accéder à de nombreux modèles dans OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-04-24T07:28:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 727236394f6581f5bdb2f557092c31ff7904e4a80b06f8adc07a1c51dcfb2ff1
    source_path: providers/qianfan.md
    workflow: 15
---

Qianfan est la plateforme MaaS de Baidu, qui fournit une **API unifiée** redirigeant les requêtes vers de nombreux modèles derrière un seul endpoint
et une seule clé API. Elle est compatible OpenAI, donc la plupart des SDK OpenAI fonctionnent en changeant simplement l’URL de base.

| Propriété | Valeur                            |
| --------- | --------------------------------- |
| Fournisseur | `qianfan`                       |
| Authentification | `QIANFAN_API_KEY`         |
| API       | Compatible OpenAI                 |
| URL de base | `https://qianfan.baidubce.com/v2` |

## Premiers pas

<Steps>
  <Step title="Créer un compte Baidu Cloud">
    Inscrivez-vous ou connectez-vous sur la [console Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey) et assurez-vous que l’accès à l’API Qianfan est activé.
  </Step>
  <Step title="Générer une clé API">
    Créez une nouvelle application ou sélectionnez-en une existante, puis générez une clé API. Le format de la clé est `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Lancer l’onboarding">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Vérifier que le modèle est disponible">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Catalogue intégré

| Référence de modèle                 | Entrée      | Contexte | Sortie max | Raisonnement | Remarques     |
| ----------------------------------- | ----------- | -------- | ---------- | ------------ | ------------- |
| `qianfan/deepseek-v3.2`             | texte       | 98 304   | 32 768     | Oui          | Modèle par défaut |
| `qianfan/ernie-5.0-thinking-preview`| texte, image| 119 000  | 64 000     | Oui          | Multimodal    |

<Tip>
La référence de modèle incluse par défaut est `qianfan/deepseek-v3.2`. Vous n’avez besoin de surcharger `models.providers.qianfan` que si vous avez besoin d’une URL de base ou de métadonnées de modèle personnalisées.
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
  <Accordion title="Transport et compatibilité">
    Qianfan fonctionne via le chemin de transport compatible OpenAI, et non via un façonnage natif des requêtes OpenAI. Cela signifie que les fonctionnalités standard des SDK OpenAI fonctionnent, mais que les paramètres spécifiques au fournisseur peuvent ne pas être transmis.
  </Accordion>

  <Accordion title="Catalogue et surcharges">
    Le catalogue inclus comprend actuellement `deepseek-v3.2` et `ernie-5.0-thinking-preview`. Ajoutez ou surchargez `models.providers.qianfan` uniquement lorsque vous avez besoin d’une URL de base ou de métadonnées de modèle personnalisées.

    <Note>
    Les références de modèle utilisent le préfixe `qianfan/` (par exemple `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Dépannage">
    - Assurez-vous que votre clé API commence par `bce-v3/ALTAK-` et qu’elle a l’accès à l’API Qianfan activé dans la console Baidu Cloud.
    - Si les modèles ne sont pas listés, confirmez que le service Qianfan est activé pour votre compte.
    - L’URL de base par défaut est `https://qianfan.baidubce.com/v2`. Ne la modifiez que si vous utilisez un endpoint ou un proxy personnalisé.

  </Accordion>
</AccordionGroup>

## Articles connexes

<CardGroup cols={2}>
  <Card title="Sélection des modèles" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, références de modèles et comportement de bascule.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de configuration OpenClaw.
  </Card>
  <Card title="Configuration de l’agent" href="/fr/concepts/agent" icon="robot">
    Configurer les valeurs par défaut des agents et les affectations de modèles.
  </Card>
  <Card title="Documentation API Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Documentation officielle de l’API Qianfan.
  </Card>
</CardGroup>
