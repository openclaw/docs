---
read_when:
    - Vous souhaitez utiliser des modèles GLM dans OpenClaw
    - Vous devez connaître la convention de nommage des modèles et la configuration
summary: Vue d’ensemble de la famille de modèles GLM et de son utilisation dans OpenClaw
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-05-06T07:35:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 190b8834e3f11cdb90c9bdb1844bfad3a79383776540f733e601437157b7a093
    source_path: providers/glm.md
    workflow: 16
---

GLM est une famille de modèles (pas une entreprise) disponible via la plateforme [Z.AI](https://z.ai). Dans OpenClaw, les modèles GLM sont accessibles via le fournisseur `zai` intégré avec des références comme `zai/glm-5.1`.

| Propriété                 | Valeur                                                                      |
| ------------------------- | --------------------------------------------------------------------------- |
| ID du fournisseur         | `zai`                                                                       |
| Plugin                    | intégré, `enabledByDefault: true`                                           |
| Variables d’env. d’auth   | `ZAI_API_KEY` ou `Z_AI_API_KEY`                                             |
| Choix d’onboarding        | `zai-api-key`, `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn` |
| API                       | compatible OpenAI                                                          |
| URL de base par défaut    | `https://api.z.ai/api/paas/v4`                                              |
| Valeur par défaut suggérée | `zai/glm-5.1`                                                               |
| Modèle d’image par défaut | `zai/glm-4.6v`                                                              |

## Premiers pas

<Steps>
  <Step title="Choisir une méthode d’authentification et exécuter l’onboarding">
    Choisissez l’option d’onboarding qui correspond à votre offre Z.AI et à votre région. Le choix générique `zai-api-key` détecte automatiquement le point de terminaison correspondant à partir de la forme de la clé ; utilisez les choix régionaux explicites lorsque vous voulez imposer un Coding Plan ou une surface d’API générale spécifique.

    | Choix d’authentification | Idéal pour                                           |
    | ------------------------ | ---------------------------------------------------- |
    | `zai-api-key`            | Clé d’API générique avec détection automatique du point de terminaison |
    | `zai-coding-global`      | Utilisateurs du Coding Plan (mondial)                |
    | `zai-coding-cn`          | Utilisateurs du Coding Plan (région Chine)           |
    | `zai-global`             | API générale (mondial)                               |
    | `zai-cn`                 | API générale (région Chine)                          |

    <CodeGroup>

```bash Auto-detect
openclaw onboard --auth-choice zai-api-key
```

```bash Coding Plan (global)
openclaw onboard --auth-choice zai-coding-global
```

```bash Coding Plan (China)
openclaw onboard --auth-choice zai-coding-cn
```

```bash General API (global)
openclaw onboard --auth-choice zai-global
```

```bash General API (China)
openclaw onboard --auth-choice zai-cn
```

    </CodeGroup>

  </Step>
  <Step title="Définir GLM comme modèle par défaut">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="Vérifier que les modèles sont disponibles">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## Exemple de configuration

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
  `zai-api-key` permet à OpenClaw de détecter le point de terminaison Z.AI correspondant à partir de la forme de la clé et d’appliquer automatiquement l’URL de base correcte. Utilisez les choix régionaux explicites lorsque vous voulez épingler un Coding Plan ou une surface d’API générale spécifique.
</Tip>

## Catalogue intégré

Le fournisseur `zai` intégré initialise 13 références de modèles GLM. Toutes les entrées prennent en charge le raisonnement, sauf indication contraire ; `glm-5v-turbo` et `glm-4.6v` acceptent l’entrée image ainsi que le texte.

| Référence de modèle | Notes                                              |
| ------------------- | -------------------------------------------------- |
| `zai/glm-5.1`       | Modèle par défaut. Raisonnement, texte uniquement, contexte de 202k. |
| `zai/glm-5`         | Raisonnement, texte uniquement, contexte de 202k. |
| `zai/glm-5-turbo`   | Raisonnement, texte uniquement, contexte de 202k. |
| `zai/glm-5v-turbo`  | Raisonnement, texte + image, contexte de 202k. |
| `zai/glm-4.7`       | Raisonnement, texte uniquement, contexte de 204k. |
| `zai/glm-4.7-flash` | Raisonnement, texte uniquement, contexte de 200k. |
| `zai/glm-4.7-flashx` | Raisonnement, texte uniquement. |
| `zai/glm-4.6`       | Raisonnement, texte uniquement. |
| `zai/glm-4.6v`      | Raisonnement, texte + image. Modèle d’image par défaut. |
| `zai/glm-4.5`       | Raisonnement, texte uniquement. |
| `zai/glm-4.5-air`   | Raisonnement, texte uniquement. |
| `zai/glm-4.5-flash` | Raisonnement, texte uniquement. |
| `zai/glm-4.5v`      | Raisonnement, texte + image. |

<Note>
  Les versions et la disponibilité de GLM peuvent changer. Exécutez `openclaw models list --provider zai` pour voir les lignes de catalogue connues de votre version installée, et consultez la documentation de Z.AI pour les modèles récemment ajoutés ou obsolètes.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Détection automatique du point de terminaison">
    Lorsque vous utilisez le choix d’authentification `zai-api-key`, OpenClaw inspecte la forme de la clé pour déterminer l’URL de base Z.AI correcte. Les choix régionaux explicites (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) remplacent la détection automatique et épinglent directement le point de terminaison.
  </Accordion>

  <Accordion title="Détails du fournisseur">
    Les modèles GLM sont servis par le fournisseur d’exécution `zai`. Pour la configuration complète du fournisseur, les points de terminaison régionaux et les fonctionnalités supplémentaires, consultez la [page du fournisseur Z.AI](/fr/providers/zai).
  </Accordion>
</AccordionGroup>

## Associés

<CardGroup cols={2}>
  <Card title="Fournisseur Z.AI" href="/fr/providers/zai" icon="server">
    Configuration complète du fournisseur Z.AI et points de terminaison régionaux.
  </Card>
  <Card title="Fournisseurs de modèles" href="/fr/concepts/model-providers" icon="layers">
    Choisir des fournisseurs, des références de modèles et un comportement de basculement.
  </Card>
  <Card title="Modes de réflexion" href="/fr/tools/thinking" icon="brain">
    Niveaux `/think` pour la famille GLM capable de raisonnement.
  </Card>
  <Card title="FAQ sur les modèles" href="/fr/help/faq-models" icon="circle-question">
    Profils d’authentification, changement de modèles et résolution des erreurs « no profile ».
  </Card>
</CardGroup>
