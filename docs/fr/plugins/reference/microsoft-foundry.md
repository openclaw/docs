---
read_when:
    - Vous installez, configurez ou auditez le Plugin microsoft-foundry
summary: Ajoute la prise en charge du fournisseur de modèles Microsoft Foundry à OpenClaw.
title: Plugin Microsoft Foundry
x-i18n:
    generated_at: "2026-06-27T17:55:38Z"
    model: gpt-5.5
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
- Voie d’installation : inclus dans OpenClaw

## Surface

fournisseurs : microsoft-foundry ; contrats : imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- Fournisseur de génération d’images : `microsoft-foundry`

## Prérequis

- Une ressource Microsoft Foundry ou Azure AI Foundry avec des déploiements.
- Authentification par clé API via `AZURE_OPENAI_API_KEY` ou une clé API de fournisseur configurée.
- Pour l’authentification Entra ID, installez Azure CLI et exécutez `az login` avant
  l’intégration. OpenClaw actualise les jetons d’exécution Microsoft Foundry via
  `az account get-access-token`.

## Modèles de chat

Les déploiements de chat Microsoft Foundry utilisent la référence de modèle du fournisseur
`microsoft-foundry/<deployment-name>`. L’intégration découvre les ressources Foundry
et les déploiements avec Azure CLI, puis écrit le nom du déploiement sélectionné dans
la configuration du modèle.

OpenClaw utilise le point de terminaison Foundry `/openai/v1` pour les API de chat
compatibles OpenAI prises en charge :

- Les familles de modèles GPT, `o*`, `computer-use-preview` et DeepSeek-V4 utilisent par défaut
  `openai-responses`.
- MAI-DS-R1 et les autres déploiements de chat-completion utilisent `openai-completions`,
  sauf si une API prise en charge explicite est configurée.
- MAI-DS-R1 est enregistré comme capable de raisonnement via le contenu de raisonnement, et non
  via `reasoning_effort`. Ses métadonnées de jetons de contexte et de sortie sont de
  163 840 jetons.

Les déploiements Anthropic Claude dans Microsoft Foundry utilisent la forme de l’API Anthropic Messages,
et non la forme compatible OpenAI `/openai/v1`. Configurez-les comme un
fournisseur personnalisé `anthropic-messages` jusqu’à ce que le Plugin Microsoft Foundry dispose d’un
environnement d’exécution Anthropic natif. Lorsque le nom du déploiement Foundry diffère de
l’ID du modèle Claude, définissez `params.canonicalModelId` sur l’entrée du modèle afin qu’OpenClaw
puisse appliquer les contrats filaires propres au modèle, mapper correctement `/think off` et
préserver la pensée signée en toute sécurité.

## Génération d’images MAI

Le Plugin enregistre `microsoft-foundry` pour `image_generate` avec les modèles
d’images Microsoft AI actuels :

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

Utilisez le nom d’un déploiement d’image MAI déployé comme référence de modèle. Le fournisseur ne
déclare pas de modèle d’image par défaut, car l’API MAI requiert le nom de votre déploiement
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

Les appels de génération avec invite seule utilisent le point de terminaison de générations MAI de Microsoft Foundry :
`/mai/v1/images/generations`. Les modifications avec image de référence appellent
`/mai/v1/images/edits` et sont limitées aux déploiements `MAI-Image-2.5-Flash` et
`MAI-Image-2.5`.

La génération avec invite seule peut utiliser un nom de déploiement personnalisé avec seulement le point de terminaison Foundry
configuré. Pour les modifications d’image avec un nom de déploiement personnalisé, sélectionnez le
déploiement via l’intégration ou incluez les métadonnées du modèle afin qu’OpenClaw puisse vérifier
que le déploiement s’appuie sur `MAI-Image-2.5-Flash` ou `MAI-Image-2.5`.

Contraintes des images MAI :

- Sortie : une image PNG par requête.
- Taille : `1024x1024` par défaut ; la largeur et la hauteur doivent être d’au moins 768 px.
- Nombre total de pixels : largeur × hauteur doit être au maximum 1 048 576.
- Modifications : une image d’entrée PNG ou JPEG.
- Les indications partagées non prises en charge, telles que `aspectRatio`, `resolution`, `quality`,
  `background` et `outputFormat` non PNG, ne sont pas envoyées à Microsoft Foundry.

## Dépannage

- `az: command not found` : installez Azure CLI ou utilisez l’authentification par clé API.
- `Microsoft Foundry endpoint missing for MAI image generation` : sélectionnez un
  déploiement Foundry via l’intégration ou ajoutez `models.providers.microsoft-foundry.baseUrl`.
- `supports MAI image deployments only` : le modèle d’image sélectionné pointe vers un
  déploiement non-MAI. Utilisez un modèle d’image MAI déployé pour `image_generate`.

<!-- openclaw-plugin-reference:manual-end -->
