---
read_when:
    - Ajout d’une nouvelle capacité centrale et d’une surface d’enregistrement de Plugin
    - Décider si le code doit appartenir au cœur, à un Plugin fournisseur ou à un Plugin de fonctionnalité
    - Câbler un nouvel assistant d’exécution pour les canaux ou les outils
sidebarTitle: Adding Capabilities
summary: Guide du contributeur pour ajouter une nouvelle capacité partagée au système de plugins OpenClaw
title: Ajout de capacités (guide du contributeur)
x-i18n:
    generated_at: "2026-04-24T08:58:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 864506dd3f61aa64e7c997c9d9e05ce0ad70c80a26a734d4f83b2e80331be4ab
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  Ceci est un **guide du contributeur** pour les développeurs du cœur d’OpenClaw. Si vous
  créez un plugin externe, consultez plutôt [Créer des plugins](/fr/plugins/building-plugins).
</Info>

Utilisez ceci lorsqu’OpenClaw a besoin d’un nouveau domaine tel que la génération d’images, la génération
de vidéos ou une future zone de fonctionnalité prise en charge par un fournisseur.

La règle :

- plugin = limite de responsabilité
- capacité = contrat central partagé

Cela signifie que vous ne devez pas commencer par connecter directement un fournisseur à un canal ou à un
outil. Commencez par définir la capacité.

## Quand créer une capacité

Créez une nouvelle capacité lorsque toutes les conditions suivantes sont vraies :

1. plus d’un fournisseur pourrait vraisemblablement l’implémenter
2. les canaux, outils ou plugins de fonctionnalité devraient la consommer sans se soucier du
   fournisseur
3. le cœur doit gérer le repli, la politique, la configuration ou le comportement de livraison

Si le travail est propre au fournisseur et qu’aucun contrat partagé n’existe encore, arrêtez-vous et définissez
d’abord le contrat.

## La séquence standard

1. Définissez le contrat central typé.
2. Ajoutez l’enregistrement du plugin pour ce contrat.
3. Ajoutez un assistant d’exécution partagé.
4. Connectez un vrai plugin fournisseur comme preuve.
5. Faites passer les consommateurs fonctionnalité/canal sur l’assistant d’exécution.
6. Ajoutez des tests de contrat.
7. Documentez la configuration orientée opérateur et le modèle de responsabilité.

## Ce qui va où

Cœur :

- types de requête/réponse
- registre des fournisseurs + résolution
- comportement de repli
- schéma de configuration plus métadonnées de documentation `title` / `description` propagées sur les nœuds d’objet imbriqué, de joker, d’élément de tableau et de composition
- surface d’assistant d’exécution

Plugin fournisseur :

- appels d’API fournisseur
- gestion de l’authentification du fournisseur
- normalisation des requêtes spécifique au fournisseur
- enregistrement de l’implémentation de la capacité

Plugin de fonctionnalité/canal :

- appelle `api.runtime.*` ou l’assistant `plugin-sdk/*-runtime` correspondant
- n’appelle jamais directement une implémentation fournisseur

## Points d’extension Provider et Harness

Utilisez les hooks de provider lorsque le comportement appartient au contrat du fournisseur de modèle
plutôt qu’à la boucle d’agent générique. Les exemples incluent les paramètres de requête spécifiques au fournisseur
après la sélection du transport, la préférence de profil d’authentification, les surcouches de prompt et
le routage de repli de suivi après le basculement de modèle/profil.

Utilisez les hooks de harness d’agent lorsque le comportement appartient à l’environnement d’exécution
qui exécute un tour. Les harnesses peuvent classifier des résultats de tentative réussis mais inutilisables
comme des réponses vides, limitées au raisonnement ou limitées à la planification, afin que la politique
de repli de modèle externe puisse prendre la décision de nouvelle tentative.

Gardez les deux points d’extension étroits :

- le cœur gère la politique de nouvelle tentative/repli
- les plugins provider gèrent les indices spécifiques au fournisseur pour les requêtes/l’authentification/le routage
- les plugins harness gèrent la classification spécifique à l’exécution des tentatives
- les plugins tiers renvoient des indices, et non des mutations directes de l’état central

## Liste de fichiers

Pour une nouvelle capacité, attendez-vous à modifier les zones suivantes :

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
- un ou plusieurs packages de plugins groupés
- configuration/docs/tests

## Exemple : génération d’images

La génération d’images suit la forme standard :

1. le cœur définit `ImageGenerationProvider`
2. le cœur expose `registerImageGenerationProvider(...)`
3. le cœur expose `runtime.imageGeneration.generate(...)`
4. les plugins `openai`, `google`, `fal` et `minimax` enregistrent des implémentations prises en charge par des fournisseurs
5. les futurs fournisseurs peuvent enregistrer le même contrat sans modifier les canaux/outils

La clé de configuration est distincte du routage d’analyse visuelle :

- `agents.defaults.imageModel` = analyser les images
- `agents.defaults.imageGenerationModel` = générer des images

Gardez-les séparées afin que le repli et la politique restent explicites.

## Liste de vérification pour la revue

Avant de livrer une nouvelle capacité, vérifiez :

- aucun canal/outil n’importe directement du code fournisseur
- l’assistant d’exécution est le chemin partagé
- au moins un test de contrat affirme la responsabilité des éléments groupés
- la documentation de configuration nomme la nouvelle clé de modèle/configuration
- la documentation des plugins explique la limite de responsabilité

Si une PR saute la couche de capacité et code en dur le comportement fournisseur dans un
canal/outil, renvoyez-la et définissez d’abord le contrat.

## Liens connexes

- [Plugin](/fr/tools/plugin)
- [Créer des skills](/fr/tools/creating-skills)
- [Outils et plugins](/fr/tools)
