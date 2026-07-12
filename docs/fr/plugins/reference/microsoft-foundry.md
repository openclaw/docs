---
read_when:
    - Vous installez, configurez ou auditez le plugin microsoft-foundry
summary: Ajoute la prise en charge du fournisseur de modèles Microsoft Foundry à OpenClaw.
title: Plugin Microsoft Foundry
x-i18n:
    generated_at: "2026-07-12T02:53:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Plugin Microsoft Foundry

Ajoute à OpenClaw la prise en charge du fournisseur de modèles Microsoft Foundry.

## Distribution

- Paquet : `@openclaw/microsoft-foundry`
- Mode d’installation : inclus dans OpenClaw

## Surface

fournisseurs : microsoft-foundry ; contrats : imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- Fournisseur de génération d’images : `microsoft-foundry`

## Prérequis

- Une ressource Microsoft Foundry ou Azure AI Foundry comportant des déploiements.
- Une authentification par clé d’API via `AZURE_OPENAI_API_KEY` ou une clé d’API de fournisseur configurée.
- Pour l’authentification Entra ID, installez la CLI Azure et exécutez `az login` avant
  l’intégration. OpenClaw actualise les jetons d’exécution Microsoft Foundry via
  `az account get-access-token`.

## Modèles de conversation

Les déploiements de conversation Microsoft Foundry utilisent la référence de modèle du fournisseur
`microsoft-foundry/<deployment-name>`. Lors de l’intégration, la CLI Azure détecte les ressources
et les déploiements Foundry, puis inscrit le nom du déploiement sélectionné dans
la configuration du modèle.

OpenClaw utilise le point de terminaison Foundry `/openai/v1` pour les API de conversation
compatibles avec OpenAI prises en charge :

- Les familles de modèles GPT, `o*`, `computer-use-preview` et DeepSeek-V4 utilisent par défaut
  `openai-responses`.
- MAI-DS-R1 et les autres déploiements de complétion de conversation utilisent `openai-completions`,
  sauf si une API explicitement prise en charge est configurée.
- MAI-DS-R1 est enregistré comme capable de raisonnement au moyen du contenu de raisonnement, et non
  de `reasoning_effort`. Les métadonnées de ses jetons de contexte et de sortie indiquent
  163 840 jetons.

Les déploiements Anthropic Claude dans Microsoft Foundry utilisent le format de l’API Anthropic Messages,
et non le format compatible avec OpenAI `/openai/v1`. Configurez-les comme un fournisseur
`anthropic-messages` personnalisé jusqu’à ce que le Plugin Microsoft Foundry dispose d’un environnement
d’exécution Anthropic natif. Lorsque le nom du déploiement Foundry diffère de l’identifiant du modèle
Claude, définissez `params.canonicalModelId` dans l’entrée du modèle afin qu’OpenClaw
puisse appliquer les contrats de transmission propres au modèle, interpréter correctement `/think off` et
préserver de manière sécurisée les données de réflexion signées.

## Génération d’images MAI

Le Plugin enregistre `microsoft-foundry` pour `image_generate` avec les modèles d’images
Microsoft AI actuels :

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

Utilisez le nom d’un déploiement d’images MAI comme référence de modèle. Le fournisseur ne
déclare aucun modèle d’image par défaut, car l’API MAI exige le nom de votre déploiement
dans le champ `model` de la requête :

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "microsoft-foundry/<deployment-name>",
        timeoutMs: 600000,
      },
    },
  },
}
```

La génération à partir d’une invite seule appelle le point de terminaison de génération MAI de Microsoft Foundry :
`/mai/v1/images/generations`. Les modifications à partir d’une image de référence appellent
`/mai/v1/images/edits` et sont limitées aux déploiements `MAI-Image-2.5-Flash` et
`MAI-Image-2.5`.

La génération à partir d’une invite seule peut utiliser un nom de déploiement personnalisé avec uniquement le point de terminaison
Foundry configuré. Pour modifier des images avec un nom de déploiement personnalisé, sélectionnez le
déploiement lors de l’intégration ou incluez les métadonnées du modèle afin qu’OpenClaw puisse vérifier
que le déploiement repose sur `MAI-Image-2.5-Flash` ou `MAI-Image-2.5`.

Contraintes des images MAI :

- Sortie : une image PNG par requête.
- Taille : `1024x1024` par défaut ; la largeur et la hauteur doivent toutes deux être d’au moins 768 px.
- Nombre total de pixels : largeur × hauteur ne doit pas dépasser 1 048 576.
- Modifications : une image d’entrée PNG ou JPEG.
- Les indications partagées non prises en charge, telles que `aspectRatio`, `resolution`, `quality`,
  `background` et les valeurs de `outputFormat` autres que PNG, ne sont pas envoyées à Microsoft Foundry.

## Dépannage

- `az: command not found` : installez la CLI Azure ou utilisez l’authentification par clé d’API.
- `Microsoft Foundry endpoint missing for MAI image generation` : sélectionnez un
  déploiement Foundry lors de l’intégration ou ajoutez `models.providers.microsoft-foundry.baseUrl`.
- `supports MAI image deployments only` : le modèle d’image sélectionné pointe vers un
  déploiement autre que MAI. Utilisez un modèle d’image MAI déployé pour `image_generate`.

<!-- openclaw-plugin-reference:manual-end -->
