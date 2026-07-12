---
read_when:
    - Ajout d’une nouvelle fonctionnalité principale et d’une interface d’enregistrement des plugins
    - Déterminer si le code doit résider dans le cœur, un plugin fournisseur ou un plugin de fonctionnalité
    - Câblage d’un nouvel utilitaire d’exécution pour les canaux ou les outils
sidebarTitle: Adding capabilities
summary: Guide de contribution pour ajouter une nouvelle fonctionnalité partagée au système de Plugins d’OpenClaw
title: Ajout de fonctionnalités (guide du contributeur)
x-i18n:
    generated_at: "2026-07-12T02:48:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3534b7521ab8183d91399cded8a3b397be46bf9bd18f2fdb88a8947bad67ffaa
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Ceci est un **guide de contribution** destiné aux développeurs du cœur d’OpenClaw. Si vous
  développez un plugin externe, consultez plutôt [Développer des plugins](/fr/plugins/building-plugins).
  Pour la référence architecturale détaillée (modèle de capacités, responsabilités,
  pipeline de chargement, utilitaires d’exécution), consultez [Architecture interne des plugins](/fr/plugins/architecture).
</Info>

Utilisez ce guide lorsqu’OpenClaw a besoin d’un nouveau domaine partagé, tel que les plongements,
la génération d’images, la génération de vidéos ou un futur domaine fonctionnel
reposant sur des fournisseurs.

La règle :

- **plugin** = frontière de responsabilité
- **capacité** = contrat partagé du cœur

Ne reliez pas directement un fournisseur à un canal ou à un outil. Définissez d’abord la capacité.

## Quand créer une capacité

Créez une capacité uniquement lorsque **toutes** les conditions suivantes sont remplies :

1. Plusieurs fournisseurs pourraient vraisemblablement l’implémenter.
2. Les canaux, outils ou plugins fonctionnels doivent pouvoir l’utiliser sans se soucier du fournisseur.
3. Le cœur doit gérer le mécanisme de repli, la politique, la configuration ou le comportement de livraison.

Si le travail concerne uniquement un fournisseur et qu’aucun contrat partagé n’existe encore, définissez d’abord le contrat.

## Séquence standard

1. Définissez le contrat typé du cœur.
2. Ajoutez l’enregistrement du plugin pour ce contrat.
3. Ajoutez un utilitaire d’exécution partagé.
4. Intégrez un véritable plugin fournisseur à titre de preuve.
5. Faites migrer les consommateurs fonctionnels et les canaux vers l’utilitaire d’exécution.
6. Ajoutez des tests de contrat.
7. Documentez la configuration destinée aux opérateurs et le modèle de responsabilités.

## Répartition des responsabilités

| Couche                     | Responsabilités                                                                                                                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cœur**                   | Types de requête et de réponse ; registre et résolution des fournisseurs ; comportement de repli ; schéma de configuration avec propagation des métadonnées de documentation `title`/`description` aux objets imbriqués, caractères génériques, éléments de tableau et nœuds de composition ; interface des utilitaires d’exécution. |
| **Plugin fournisseur**     | Appels à l’API du fournisseur, gestion de son authentification, normalisation des requêtes qui lui sont propres et enregistrement de l’implémentation de la capacité.                                                                                                     |
| **Plugin fonctionnel/de canal** | Appelle `api.runtime.*` ou l’utilitaire `plugin-sdk/*-runtime` correspondant. N’appelle jamais directement l’implémentation d’un fournisseur.                                                                                                                    |

## Points d’extension des fournisseurs et des environnements d’exécution

Utilisez les **hooks de fournisseur** lorsque le comportement relève du contrat du fournisseur de modèles plutôt que de la boucle générique de l’agent. Il peut notamment s’agir des paramètres de requête propres au fournisseur après la sélection du transport, de la préférence de profil d’authentification, des surcharges de prompt et du routage de repli après une bascule de modèle ou de profil.

Utilisez les **hooks d’environnement d’exécution de l’agent** lorsque le comportement relève de l’environnement qui exécute un tour. Ces environnements peuvent classer des résultats de protocole explicites, tels qu’une sortie vide, un raisonnement sans sortie visible ou un plan structuré sans réponse finale, afin que la politique externe de repli du modèle puisse décider d’une nouvelle tentative.

Maintenez ces deux points d’extension ciblés :

- Le cœur gère la politique de nouvelle tentative et de repli.
- Les plugins fournisseurs gèrent les paramètres de requête, l’authentification et les indications de routage propres au fournisseur.
- Les plugins d’environnement d’exécution gèrent la classification des tentatives propre à l’environnement.
- Les plugins tiers renvoient des indications, sans modifier directement l’état du cœur.

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
4. Les plugins fournisseurs (`comfy`, `deepinfra`, `fal`, `google`, `litellm`, `microsoft-foundry`, `minimax`, `openai`, `openrouter`, `vydra`, `xai`) enregistrent des implémentations reposant sur ces fournisseurs.
5. Les futurs fournisseurs enregistrent le même contrat sans modifier les canaux ni les outils.

La clé de configuration est intentionnellement distincte du routage de l’analyse visuelle :

- `agents.defaults.imageModel` analyse les images.
- `agents.defaults.imageGenerationModel` génère des images.

Conservez cette séparation afin que le mécanisme de repli et la politique restent explicites.

## Fournisseurs de plongements

Utilisez `registerEmbeddingProvider(...)` et le contrat `embeddingProviders` pour
les fournisseurs réutilisables de plongements vectoriels. Ce contrat est volontairement plus large
que la mémoire : les outils, la recherche, la récupération, les importateurs ou les futurs plugins fonctionnels
peuvent utiliser des plongements sans dépendre du moteur de mémoire. La recherche en mémoire
utilise également les fournisseurs génériques `embeddingProviders`.

L’ancienne API d’enregistrement propre à la mémoire et le contrat `memoryEmbeddingProviders`
sont obsolètes. Utilisez `registerEmbeddingProvider` et
`embeddingProviders` pour tous les nouveaux fournisseurs de plongements.

## Liste de contrôle de la revue

Avant de publier une nouvelle capacité, vérifiez les points suivants :

- Aucun canal ni outil n’importe directement le code d’un fournisseur.
- L’utilitaire d’exécution constitue le chemin partagé.
- Au moins un test de contrat vérifie la responsabilité intégrée.
- La documentation de configuration indique le nouveau modèle ou la nouvelle clé de configuration.
- La documentation des plugins explique la frontière de responsabilité.

Si une PR omet la couche de capacité et code en dur le comportement d’un fournisseur dans un canal ou un outil, renvoyez-la et définissez d’abord le contrat.

## Ressources connexes

- [Architecture interne des plugins](/fr/plugins/architecture) — modèle de capacités, responsabilités, pipeline de chargement et utilitaires d’exécution.
- [Développer des plugins](/fr/plugins/building-plugins) — tutoriel de création d’un premier plugin.
- [Présentation du SDK](/fr/plugins/sdk-overview) — référence des correspondances d’importation et de l’API d’enregistrement.
- [Créer des skills](/fr/tools/creating-skills) — interface complémentaire destinée aux contributeurs.
