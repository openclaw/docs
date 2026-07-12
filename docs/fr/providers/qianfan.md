---
read_when:
    - Vous souhaitez une clé API unique pour plusieurs LLM
    - Vous avez besoin d’instructions pour configurer Baidu Qianfan
summary: Utilisez l’API unifiée de Qianfan pour accéder à de nombreux modèles dans OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-07-12T15:43:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 31387a53ee4472e2d20ae939ea75cea0d6f6367501becd56a8654fd97fdf0804
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan est la plateforme MaaS de Baidu : une API unifiée, compatible avec OpenAI, qui achemine les requêtes vers de nombreux modèles derrière un point de terminaison et une clé d’API uniques. OpenClaw la fournit sous la forme du plugin externe officiel `@openclaw/qianfan-provider`.

| Propriété       | Valeur                                   |
| --------------- | ---------------------------------------- |
| Fournisseur     | `qianfan`                                |
| Authentification | `QIANFAN_API_KEY`                       |
| API             | Compatible avec OpenAI (`openai-completions`) |
| URL de base     | `https://qianfan.baidubce.com/v2`        |
| Modèle par défaut | `qianfan/deepseek-v3.2`                |

## Installer le plugin

Installez le plugin officiel, puis redémarrez le Gateway :

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## Prise en main

<Steps>
  <Step title="Créer un compte Baidu Cloud">
    Inscrivez-vous ou connectez-vous dans la [console Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey), puis vérifiez que l’accès à l’API Qianfan est activé.
  </Step>
  <Step title="Générer une clé d’API">
    Créez une application ou sélectionnez-en une existante, puis générez une clé d’API. Les clés Baidu Cloud utilisent le format `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Exécuter la configuration initiale">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```

    Les exécutions non interactives lisent la clé depuis `--qianfan-api-key <key>` ou
    `QIANFAN_API_KEY`. La configuration initiale écrit la configuration du fournisseur, ajoute
    l’alias `QIANFAN` au modèle par défaut et définit `qianfan/deepseek-v3.2`
    comme modèle par défaut lorsqu’aucun modèle n’est configuré.

  </Step>
  <Step title="Vérifier que le modèle est disponible">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Catalogue intégré

| Référence du modèle                   | Entrée      | Contexte | Sortie maximale | Raisonnement | Remarques          |
| ------------------------------------- | ----------- | -------- | --------------- | ------------ | ------------------ |
| `qianfan/deepseek-v3.2`               | texte       | 98,304   | 32,768          | Oui          | Modèle par défaut  |
| `qianfan/ernie-5.0-thinking-preview`  | texte, image | 119,000 | 64,000          | Oui          | Multimodal         |

Le catalogue est statique ; il n’existe aucune découverte des modèles en temps réel.

<Tip>
Vous devez remplacer `models.providers.qianfan` uniquement si vous avez besoin d’une URL de base personnalisée ou de métadonnées de modèle personnalisées.
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

<Note>
Les références de modèle utilisent le préfixe `qianfan/` (par exemple `qianfan/deepseek-v3.2`).
</Note>

<AccordionGroup>
  <Accordion title="Transport et compatibilité">
    Qianfan utilise le chemin de transport compatible avec OpenAI, et non la mise en forme native des requêtes OpenAI. Les fonctionnalités standard du SDK OpenAI fonctionnent, mais les paramètres propres au fournisseur peuvent ne pas être transmis.
  </Accordion>

  <Accordion title="Dépannage">
    - Vérifiez que votre clé d’API commence par `bce-v3/ALTAK-` et que l’accès à l’API Qianfan est activé dans la console Baidu Cloud.
    - Si les modèles ne sont pas répertoriés, vérifiez que le service Qianfan est activé pour votre compte.
    - Ne modifiez l’URL de base que si vous utilisez un point de terminaison personnalisé ou un proxy.

  </Accordion>
</AccordionGroup>

## Ressources associées

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèle et du comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de la configuration d’OpenClaw.
  </Card>
  <Card title="Configuration de l’agent" href="/fr/concepts/agent" icon="robot">
    Configuration des valeurs par défaut de l’agent et des attributions de modèles.
  </Card>
  <Card title="Documentation de l’API Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Documentation officielle de l’API Qianfan.
  </Card>
</CardGroup>
