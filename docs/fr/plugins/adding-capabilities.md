---
read_when:
    - Ajout d’une nouvelle capacité centrale et d’une interface d’enregistrement de Plugin
    - Déterminer si le code doit se trouver dans le cœur, dans un plugin fournisseur ou dans un plugin de fonctionnalité
    - Câblage d’un nouvel assistant d’exécution pour les canaux ou les outils
sidebarTitle: Adding capabilities
summary: Guide de contribution pour ajouter une nouvelle fonctionnalité partagée au système de Plugins d’OpenClaw
title: Ajout de fonctionnalités (guide de contribution)
x-i18n:
    generated_at: "2026-07-12T15:31:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3534b7521ab8183d91399cded8a3b397be46bf9bd18f2fdb88a8947bad67ffaa
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Ceci est un **guide de contribution** destiné aux développeurs du cœur d’OpenClaw. Si vous
  développez un plugin externe, consultez plutôt [Développer des plugins](/fr/plugins/building-plugins).
  Pour la référence détaillée sur l’architecture (modèle de capacités, propriété,
  pipeline de chargement, utilitaires d’exécution), consultez [Fonctionnement interne des plugins](/fr/plugins/architecture).
</Info>

Utilisez ce guide lorsqu’OpenClaw a besoin d’un nouveau domaine partagé, tel que les embeddings, la
génération d’images, la génération de vidéos ou un futur domaine fonctionnel reposant sur des fournisseurs.

La règle :

- **plugin** = frontière de propriété
- **capacité** = contrat partagé du cœur

Ne connectez pas directement un fournisseur à un canal ou à un outil. Définissez d’abord la capacité.

## Quand créer une capacité

Créez une nouvelle capacité uniquement lorsque **toutes** les conditions suivantes sont remplies :

1. Plusieurs fournisseurs pourraient vraisemblablement l’implémenter.
2. Les canaux, outils ou plugins fonctionnels doivent pouvoir l’utiliser sans se préoccuper du fournisseur.
3. Le cœur doit gérer le repli, les politiques, la configuration ou le comportement de livraison.

Si le travail ne concerne qu’un fournisseur et qu’aucun contrat partagé n’existe encore, définissez d’abord le contrat.

## Séquence standard

1. Définissez le contrat typé du cœur.
2. Ajoutez l’enregistrement du plugin pour ce contrat.
3. Ajoutez un utilitaire d’exécution partagé.
4. Connectez un véritable plugin de fournisseur à titre de preuve.
5. Faites migrer les consommateurs fonctionnels et les canaux vers l’utilitaire d’exécution.
6. Ajoutez des tests de contrat.
7. Documentez la configuration destinée à l’opérateur et le modèle de propriété.

## Répartition des responsabilités

| Couche                     | Responsabilités                                                                                                                                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cœur**                   | Types de requête/réponse ; registre et résolution des fournisseurs ; comportement de repli ; schéma de configuration avec métadonnées de documentation `title`/`description` propagées aux nœuds d’objet imbriqué, génériques, d’élément de tableau et de composition ; surface des utilitaires d’exécution. |
| **Plugin de fournisseur**  | Appels à l’API du fournisseur, gestion de son authentification, normalisation des requêtes qui lui est propre et enregistrement de l’implémentation de la capacité.                                                                     |
| **Plugin fonctionnel/de canal** | Appelle `api.runtime.*` ou l’utilitaire `plugin-sdk/*-runtime` correspondant. N’appelle jamais directement l’implémentation d’un fournisseur.                                                                                       |

## Points d’extension des fournisseurs et des environnements d’agent

Utilisez les **hooks de fournisseur** lorsque le comportement relève du contrat du fournisseur de modèles plutôt que de la boucle d’agent générique. Il peut s’agir, par exemple, de paramètres de requête propres au fournisseur après la sélection du transport, de la préférence de profil d’authentification, de surcouches de prompt et du routage de repli pour les tentatives suivantes après l’échec d’un modèle ou d’un profil.

Utilisez les **hooks de l’environnement d’agent** lorsque le comportement relève de l’environnement d’exécution qui traite un tour. Les environnements peuvent classifier des résultats explicites du protocole, tels qu’une sortie vide, un raisonnement sans sortie visible ou un plan structuré sans réponse finale, afin que la politique externe de repli du modèle puisse décider d’effectuer une nouvelle tentative.

Maintenez ces deux points d’extension restreints :

- Le cœur gère la politique de nouvelle tentative et de repli.
- Les plugins de fournisseur gèrent les indications propres au fournisseur concernant les requêtes, l’authentification et le routage.
- Les plugins d’environnement gèrent la classification des tentatives propre à l’exécution.
- Les plugins tiers renvoient des indications et ne modifient pas directement l’état du cœur.

## Liste de contrôle des fichiers

Pour une nouvelle capacité, prévoyez de modifier les zones suivantes :

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- Un ou plusieurs paquets de plugins intégrés.
- La configuration, la documentation et les tests.

## Exemple détaillé : génération d’images

La génération d’images suit la structure standard :

1. Le cœur définit `ImageGenerationProvider`.
2. Le cœur expose `registerImageGenerationProvider(...)`.
3. Le cœur expose `api.runtime.imageGeneration.generate(...)` et `.listProviders(...)`.
4. Les plugins de fournisseur (`comfy`, `deepinfra`, `fal`, `google`, `litellm`, `microsoft-foundry`, `minimax`, `openai`, `openrouter`, `vydra`, `xai`) enregistrent des implémentations reposant sur leur fournisseur.
5. Les futurs fournisseurs enregistrent le même contrat sans modifier les canaux ni les outils.

La clé de configuration est volontairement distincte du routage de l’analyse visuelle :

- `agents.defaults.imageModel` analyse les images.
- `agents.defaults.imageGenerationModel` génère des images.

Conservez cette séparation afin que le repli et les politiques restent explicites.

## Fournisseurs d’embeddings

Utilisez `registerEmbeddingProvider(...)` et le contrat `embeddingProviders` pour les
fournisseurs réutilisables d’embeddings vectoriels. Ce contrat est volontairement plus général
que la mémoire : les outils, la recherche, la récupération, les importateurs ou les futurs plugins fonctionnels
peuvent utiliser les embeddings sans dépendre du moteur de mémoire. La recherche en mémoire
utilise également les `embeddingProviders` génériques.

L’ancienne API d’enregistrement propre à la mémoire et le contrat `memoryEmbeddingProviders`
sont obsolètes. Utilisez `registerEmbeddingProvider` et
`embeddingProviders` pour tous les nouveaux fournisseurs d’embeddings.

## Liste de contrôle pour la révision

Avant de livrer une nouvelle capacité, vérifiez les points suivants :

- Aucun canal ni outil n’importe directement le code d’un fournisseur.
- L’utilitaire d’exécution constitue le chemin partagé.
- Au moins un test de contrat vérifie la propriété intégrée.
- La documentation de configuration nomme la nouvelle clé de modèle ou de configuration.
- La documentation des plugins explique la frontière de propriété.

Si une PR contourne la couche de capacité et code en dur le comportement d’un fournisseur dans un canal ou un outil, renvoyez-la et définissez d’abord le contrat.

## Voir aussi

- [Fonctionnement interne des plugins](/fr/plugins/architecture) — modèle de capacités, propriété, pipeline de chargement, utilitaires d’exécution.
- [Développer des plugins](/fr/plugins/building-plugins) — tutoriel pour créer un premier plugin.
- [Présentation du SDK](/fr/plugins/sdk-overview) — référence de la table des imports et de l’API d’enregistrement.
- [Créer des Skills](/fr/tools/creating-skills) — surface complémentaire destinée aux contributeurs.
