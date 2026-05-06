---
read_when:
    - Ajout d’une nouvelle capacité du noyau et d’une surface d’enregistrement de Plugin
    - Décider si le code relève du noyau, d’un Plugin fournisseur ou d’un Plugin de fonctionnalité
    - Intégration d’un nouvel utilitaire d’exécution pour les canaux ou les outils
sidebarTitle: Adding capabilities
summary: Guide pour les contributeurs à l’ajout d’une nouvelle capacité partagée au système de Plugin OpenClaw
title: Ajout de capacités (guide du contributeur)
x-i18n:
    generated_at: "2026-05-06T07:32:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e289c95d9dc5924b5cc7b67428386660b83052b6cf6f14fc4f838fc88b7a25c
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Ceci est un **guide de contribution** pour les développeurs du cœur d'OpenClaw. Si vous
  créez un plugin externe, consultez plutôt [Créer des plugins](/fr/plugins/building-plugins).
  Pour la référence d'architecture détaillée (modèle de capacités, propriété,
  pipeline de chargement, helpers d'exécution), consultez [Internes des plugins](/fr/plugins/architecture).
</Info>

Utilisez ceci lorsqu'OpenClaw a besoin d'un nouveau domaine partagé, comme la génération d'images, la génération vidéo ou un futur domaine de fonctionnalités adossé à un fournisseur.

La règle :

- **plugin** = frontière de propriété
- **capacité** = contrat partagé du cœur

Ne commencez pas par câbler directement un fournisseur dans un canal ou un outil. Commencez par définir la capacité.

## Quand créer une capacité

Créez une nouvelle capacité lorsque **toutes** les conditions suivantes sont vraies :

1. Plusieurs fournisseurs pourraient plausiblement l'implémenter.
2. Les canaux, outils ou plugins de fonctionnalités devraient la consommer sans se soucier du fournisseur.
3. Le cœur doit posséder le comportement de secours, de politique, de configuration ou de livraison.

Si le travail concerne uniquement un fournisseur et qu'aucun contrat partagé n'existe encore, arrêtez-vous et définissez d'abord le contrat.

## La séquence standard

1. Définissez le contrat typé du cœur.
2. Ajoutez l'enregistrement de plugin pour ce contrat.
3. Ajoutez un helper d'exécution partagé.
4. Câblez un vrai plugin fournisseur comme preuve.
5. Déplacez les consommateurs de fonctionnalités/canaux vers le helper d'exécution.
6. Ajoutez des tests de contrat.
7. Documentez la configuration visible par l'opérateur et le modèle de propriété.

## Ce qui va où

**Cœur :**

- Types de requête/réponse.
- Registre de fournisseurs + résolution.
- Comportement de secours.
- Schéma de configuration avec métadonnées de documentation `title` / `description` propagées sur les nœuds d'objet imbriqué, de joker, d'élément de tableau et de composition.
- Surface du helper d'exécution.

**Plugin fournisseur :**

- Appels à l'API du fournisseur.
- Gestion de l'authentification du fournisseur.
- Normalisation des requêtes spécifique au fournisseur.
- Enregistrement de l'implémentation de la capacité.

**Plugin de fonctionnalité/canal :**

- Appelle `api.runtime.*` ou le helper correspondant `plugin-sdk/*-runtime`.
- N'appelle jamais directement une implémentation fournisseur.

## Interfaces entre fournisseurs et harnais

Utilisez les **hooks de fournisseur** lorsque le comportement appartient au contrat du fournisseur de modèles plutôt qu'à la boucle d'agent générique. Les exemples incluent les paramètres de requête spécifiques au fournisseur après la sélection du transport, la préférence de profil d'authentification, les superpositions de prompt et le routage de secours de suivi après un basculement de modèle/profil.

Utilisez les **hooks de harnais d'agent** lorsque le comportement appartient au runtime qui exécute un tour. Les harnais peuvent classer les résultats de tentative réussis mais inutilisables, comme les réponses vides, uniquement de raisonnement ou uniquement de planification, afin que la politique externe de secours du modèle puisse prendre la décision de réessayer.

Gardez ces deux interfaces étroites :

- Le cœur possède la politique de nouvelle tentative/secours.
- Les plugins fournisseurs possèdent les indications de requête/authentification/routage spécifiques au fournisseur.
- Les plugins de harnais possèdent la classification des tentatives spécifique au runtime.
- Les plugins tiers renvoient des indications, pas des mutations directes de l'état du cœur.

## Liste de vérification des fichiers

Pour une nouvelle capacité, attendez-vous à toucher ces zones :

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
- Un ou plusieurs packages de plugins groupés.
- Configuration, documentation, tests.

## Exemple détaillé : génération d'images

La génération d'images suit la forme standard :

1. Le cœur définit `ImageGenerationProvider`.
2. Le cœur expose `registerImageGenerationProvider(...)`.
3. Le cœur expose `runtime.imageGeneration.generate(...)`.
4. Les plugins `openai`, `google`, `fal` et `minimax` enregistrent des implémentations adossées à des fournisseurs.
5. Les futurs fournisseurs enregistrent le même contrat sans modifier les canaux/outils.

La clé de configuration est intentionnellement séparée du routage d'analyse visuelle :

- `agents.defaults.imageModel` analyse les images.
- `agents.defaults.imageGenerationModel` génère des images.

Gardez-les séparées afin que le secours et la politique restent explicites.

## Liste de vérification de revue

Avant de livrer une nouvelle capacité, vérifiez :

- Aucun canal/outil n'importe directement du code fournisseur.
- Le helper d'exécution est le chemin partagé.
- Au moins un test de contrat affirme la propriété groupée.
- La documentation de configuration nomme la nouvelle clé de modèle/configuration.
- La documentation des plugins explique la frontière de propriété.

Si une PR saute la couche de capacité et code en dur un comportement fournisseur dans un canal/outil, renvoyez-la et définissez d'abord le contrat.

## Connexe

- [Internes des plugins](/fr/plugins/architecture) — modèle de capacités, propriété, pipeline de chargement, helpers d'exécution.
- [Créer des plugins](/fr/plugins/building-plugins) — tutoriel pour le premier plugin.
- [Vue d'ensemble du SDK](/fr/plugins/sdk-overview) — carte d'importation et référence de l'API d'enregistrement.
- [Créer des Skills](/fr/tools/creating-skills) — surface contributrice complémentaire.
