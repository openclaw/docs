---
read_when:
    - Ajout d’une nouvelle capacité cœur et d’une surface d’enregistrement de Plugin
    - Décider si le code appartient au noyau, à un Plugin fournisseur ou à un Plugin de fonctionnalité
    - Câbler un nouvel assistant d’exécution pour les canaux ou les outils
sidebarTitle: Adding capabilities
summary: Guide de contribution pour ajouter une nouvelle capacité partagée au système de Plugin d’OpenClaw
title: Ajout de fonctionnalités (guide du contributeur)
x-i18n:
    generated_at: "2026-06-27T17:44:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b8a25122a7b76ff5bbb7616748d5fad2397502f9accb5428134a75d65e872034
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Ceci est un **guide de contribution** destiné aux développeurs du cœur d’OpenClaw. Si vous
  développez un plugin externe, consultez plutôt [Développer des plugins](/fr/plugins/building-plugins).
  Pour la référence d’architecture détaillée (modèle de capacités, propriété,
  pipeline de chargement, assistants runtime), consultez [Internes des plugins](/fr/plugins/architecture).
</Info>

Utilisez ceci lorsqu’OpenClaw a besoin d’un nouveau domaine partagé comme les embeddings, la
génération d’images, la génération de vidéos ou une future zone fonctionnelle adossée à un fournisseur.

La règle :

- **plugin** = frontière de propriété
- **capacité** = contrat partagé du cœur

Ne commencez pas par câbler directement un fournisseur dans un canal ou un outil. Commencez par définir la capacité.

## Quand créer une capacité

Créez une nouvelle capacité lorsque **toutes** ces conditions sont vraies :

1. Plusieurs fournisseurs pourraient vraisemblablement l’implémenter.
2. Les canaux, outils ou plugins de fonctionnalité devraient pouvoir la consommer sans se soucier du fournisseur.
3. Le cœur doit posséder le fallback, la politique, la configuration ou le comportement de livraison.

Si le travail est propre à un fournisseur et qu’aucun contrat partagé n’existe encore, arrêtez-vous et définissez d’abord le contrat.

## La séquence standard

1. Définir le contrat typé du cœur.
2. Ajouter l’enregistrement de plugin pour ce contrat.
3. Ajouter un assistant runtime partagé.
4. Câbler un vrai plugin fournisseur comme preuve.
5. Déplacer les consommateurs de fonctionnalité/canal vers l’assistant runtime.
6. Ajouter des tests de contrat.
7. Documenter la configuration exposée à l’opérateur et le modèle de propriété.

## Ce qui va où

**Cœur :**

- Types de requête/réponse.
- Registre de fournisseurs + résolution.
- Comportement de fallback.
- Schéma de configuration avec métadonnées de documentation `title` / `description` propagées sur les nœuds d’objet imbriqué, wildcard, élément de tableau et composition.
- Surface d’assistant runtime.

**Plugin fournisseur :**

- Appels à l’API du fournisseur.
- Gestion de l’authentification du fournisseur.
- Normalisation des requêtes spécifique au fournisseur.
- Enregistrement de l’implémentation de la capacité.

**Plugin de fonctionnalité/canal :**

- Appelle `api.runtime.*` ou l’assistant `plugin-sdk/*-runtime` correspondant.
- N’appelle jamais directement une implémentation fournisseur.

## Seams de fournisseur et de harness

Utilisez les **hooks de fournisseur** lorsque le comportement relève du contrat du fournisseur de modèle plutôt que de la boucle d’agent générique. Les exemples incluent les paramètres de requête spécifiques au fournisseur après la sélection du transport, la préférence de profil d’authentification, les superpositions de prompt et le routage de fallback de suivi après un basculement de modèle/profil.

Utilisez les **hooks de harness d’agent** lorsque le comportement relève du runtime qui exécute un tour. Les harnesses peuvent classifier des résultats de protocole explicites comme une sortie vide, un raisonnement sans sortie visible ou un plan structuré sans réponse finale afin que la politique externe de fallback de modèle puisse prendre la décision de réessayer.

Gardez les deux seams étroits :

- Le cœur possède la politique de réessai/fallback.
- Les plugins fournisseurs possèdent les indications de requête/authentification/routage spécifiques au fournisseur.
- Les plugins de harness possèdent la classification des tentatives spécifique au runtime.
- Les plugins tiers renvoient des indications, pas des mutations directes de l’état du cœur.

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

## Exemple détaillé : génération d’images

La génération d’images suit la forme standard :

1. Le cœur définit `ImageGenerationProvider`.
2. Le cœur expose `registerImageGenerationProvider(...)`.
3. Le cœur expose `runtime.imageGeneration.generate(...)`.
4. Les plugins `openai`, `google`, `fal` et `minimax` enregistrent des implémentations adossées à des fournisseurs.
5. Les futurs fournisseurs enregistrent le même contrat sans modifier les canaux/outils.

La clé de configuration est intentionnellement séparée du routage d’analyse de vision :

- `agents.defaults.imageModel` analyse les images.
- `agents.defaults.imageGenerationModel` génère des images.

Gardez-les séparées afin que le fallback et la politique restent explicites.

## Fournisseurs d’embeddings

Utilisez `embeddingProviders` pour les fournisseurs d’embeddings vectoriels réutilisables. Ce contrat
est intentionnellement plus large que la mémoire : les outils, la recherche, la récupération, les importateurs ou
les futurs plugins de fonctionnalité peuvent consommer des embeddings sans dépendre du moteur de mémoire.

La recherche mémoire peut consommer des `embeddingProviders` génériques. L’ancien
contrat `memoryEmbeddingProviders` est une compatibilité obsolète pendant que les fournisseurs existants
spécifiques à la mémoire migrent ; les nouveaux fournisseurs d’embeddings réutilisables devraient utiliser
`embeddingProviders`.

## Liste de vérification de revue

Avant d’expédier une nouvelle capacité, vérifiez :

- Aucun canal/outil n’importe directement du code fournisseur.
- L’assistant runtime est le chemin partagé.
- Au moins un test de contrat affirme la propriété groupée.
- La documentation de configuration nomme la nouvelle clé de modèle/configuration.
- La documentation du Plugin explique la frontière de propriété.

Si une PR saute la couche de capacité et code en dur un comportement fournisseur dans un canal/outil, renvoyez-la et définissez d’abord le contrat.

## Associés

- [Internes des plugins](/fr/plugins/architecture) — modèle de capacités, propriété, pipeline de chargement, assistants runtime.
- [Développer des plugins](/fr/plugins/building-plugins) — tutoriel du premier plugin.
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence de la carte d’importation et de l’API d’enregistrement.
- [Créer des Skills](/fr/tools/creating-skills) — surface de contribution compagnon.
