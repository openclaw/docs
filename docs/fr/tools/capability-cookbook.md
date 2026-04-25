---
read_when:
    - Ajout d’une nouvelle capacité centrale et d’une surface d’enregistrement de Plugin
    - Décider si du code a sa place dans le cœur, dans un Plugin fournisseur ou dans un Plugin de fonctionnalité
    - Câbler un nouvel utilitaire d’exécution pour les canaux ou les outils
sidebarTitle: Adding Capabilities
summary: Guide du contributeur pour ajouter une nouvelle capacité partagée au système de Plugin d’OpenClaw
title: Ajout de capacités (guide du contributeur)
x-i18n:
    generated_at: "2026-04-25T13:58:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2879b8a4a215dcc44086181e49c510edae93caff01e52c2f5e6b79e6cb02d7b
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  Ceci est un **guide du contributeur** destiné aux développeurs du cœur d’OpenClaw. Si vous
  créez un plugin externe, consultez plutôt [Building Plugins](/fr/plugins/building-plugins).
</Info>

Utilisez ce guide lorsqu’OpenClaw a besoin d’un nouveau domaine, comme la génération d’images, la génération
de vidéos, ou une future zone de fonctionnalités prise en charge par un fournisseur.

La règle :

- plugin = frontière de responsabilité
- capacité = contrat central partagé

Cela signifie que vous ne devez pas commencer par raccorder directement un fournisseur à un canal ou à un
outil. Commencez par définir la capacité.

## Quand créer une capacité

Créez une nouvelle capacité lorsque toutes les conditions suivantes sont vraies :

1. plus d’un fournisseur pourrait raisonnablement l’implémenter
2. les canaux, outils ou Plugins de fonctionnalité devraient la consommer sans se soucier
   du fournisseur
3. le cœur doit posséder le comportement de repli, la politique, la configuration ou la livraison

Si le travail est uniquement lié à un fournisseur et qu’aucun contrat partagé n’existe encore, arrêtez-vous et définissez
d’abord le contrat.

## La séquence standard

1. Définir le contrat central typé.
2. Ajouter l’enregistrement du Plugin pour ce contrat.
3. Ajouter un utilitaire d’exécution partagé.
4. Raccorder un vrai Plugin fournisseur comme preuve.
5. Faire migrer les consommateurs de fonctionnalité/canal vers l’utilitaire d’exécution.
6. Ajouter des tests de contrat.
7. Documenter la configuration orientée opérateur et le modèle de responsabilité.

## Ce qui va où

Cœur :

- types de requête/réponse
- registre de fournisseurs + résolution
- comportement de repli
- schéma de configuration ainsi que les métadonnées de documentation `title` / `description` propagées sur les nœuds d’objet imbriqué, de joker, d’élément de tableau et de composition
- surface d’utilitaire d’exécution

Plugin fournisseur :

- appels d’API du fournisseur
- gestion de l’authentification du fournisseur
- normalisation des requêtes spécifique au fournisseur
- enregistrement de l’implémentation de la capacité

Plugin de fonctionnalité/canal :

- appelle `api.runtime.*` ou l’utilitaire correspondant `plugin-sdk/*-runtime`
- n’appelle jamais directement une implémentation fournisseur

## Frontières provider et harness

Utilisez les hooks de provider lorsque le comportement relève du contrat du fournisseur de modèle
plutôt que de la boucle d’agent générique. Exemples : paramètres de requête spécifiques au fournisseur
après la sélection du transport, préférence de profil d’authentification, surcharges de prompt, et
routage de repli de suivi après bascule de modèle/profil.

Utilisez les hooks de harness d’agent lorsque le comportement appartient au runtime qui
exécute un tour. Les harness peuvent classifier les résultats de tentative réussis mais inutilisables
comme des réponses vides, uniquement de raisonnement, ou uniquement de planification, afin que la politique externe
de repli du modèle puisse prendre la décision de nouvelle tentative.

Gardez les deux frontières étroites :

- le cœur possède la politique de nouvelle tentative/de repli
- les Plugins provider possèdent les indications spécifiques au fournisseur pour les requêtes/l’authentification/le routage
- les Plugins harness possèdent la classification spécifique au runtime des tentatives
- les Plugins tiers renvoient des indications, pas des mutations directes de l’état central

## Checklist des fichiers

Pour une nouvelle capacité, attendez-vous à modifier les zones suivantes :

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
- un ou plusieurs packages de Plugin fournis avec OpenClaw
- config/docs/tests

## Exemple : génération d’images

La génération d’images suit la forme standard :

1. le cœur définit `ImageGenerationProvider`
2. le cœur expose `registerImageGenerationProvider(...)`
3. le cœur expose `runtime.imageGeneration.generate(...)`
4. les Plugins `openai`, `google`, `fal` et `minimax` enregistrent des implémentations prises en charge par des fournisseurs
5. les futurs fournisseurs peuvent enregistrer le même contrat sans modifier les canaux/outils

La clé de configuration est distincte du routage d’analyse visuelle :

- `agents.defaults.imageModel` = analyser des images
- `agents.defaults.imageGenerationModel` = générer des images

Gardez-les séparées afin que le repli et la politique restent explicites.

## Checklist de revue

Avant de livrer une nouvelle capacité, vérifiez :

- aucun canal/outil n’importe directement du code fournisseur
- l’utilitaire d’exécution est le chemin partagé
- au moins un test de contrat affirme la responsabilité des composants fournis avec OpenClaw
- la documentation de configuration nomme la nouvelle clé de modèle/configuration
- la documentation du Plugin explique la frontière de responsabilité

Si une PR saute la couche de capacité et code en dur un comportement fournisseur dans un
canal/outil, renvoyez-la et définissez d’abord le contrat.

## Lié

- [Plugin](/fr/tools/plugin)
- [Création de Skills](/fr/tools/creating-skills)
- [Outils et plugins](/fr/tools)
