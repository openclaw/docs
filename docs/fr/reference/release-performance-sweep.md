---
read_when:
    - Vous validez le nettoyage de mai 2026 concernant les performances et la taille des paquets.
    - Vous avez besoin des chiffres à l’appui de l’article de blog sur les performances et les dépendances d’OpenClaw
    - Vous modifiez les critères de publication, le verrouillage des versions des paquets ou les limites des dépendances des plugins
summary: Résumé visuel et éléments techniques pour le nettoyage de mai 2026 concernant les performances, la taille des paquets, les dépendances et le fichier shrinkwrap
title: Analyse des performances de la version publiée
x-i18n:
    generated_at: "2026-07-12T03:05:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e98ffc9d63e14e078a19368917eb4278695e1426048dc21942f928af145d5e1
    source_path: reference/release-performance-sweep.md
    workflow: 16
---

Cette page rassemble les éléments probants relatifs au nettoyage de mai 2026 concernant les performances, la taille du paquet, les dépendances et le fichier shrinkwrap d’OpenClaw. Elle constitue le complément technique du billet de blog public.

Deux audits sont regroupés ici :

- **Analyse des performances des versions :** versions GitHub de `v2026.5.28` jusqu’à la version stable `v2026.4.23`, à l’aide du workflow `OpenClaw Performance`, avec `profile=smoke` et le parcours de fournisseur simulé. La plupart des lignes de versions utilisent un seul échantillon ; les lignes `v2026.5.27` et `v2026.5.28` utilisent les derniers artefacts de branche de version répétés trois fois.
- **Contexte antérieur d’avril :** mesures de référence publiées de `clawgrit-reports` avec fournisseur simulé, de `v2026.4.1` à `v2026.5.2`, utilisées uniquement pour éviter de considérer les versions défectueuses de fin avril comme référence publique de performances.
- **Analyse de l’empreinte d’installation :** installations propres avec `npm install --ignore-scripts` dans des paquets temporaires, avec `du -sk node_modules` pour la taille et un parcours de `node_modules` pour compter les instances de paquets.
- **Analyse de la taille du paquet npm :** `npm pack openclaw@<version> --dry-run --json` pour les versions publiées, avec relevé de la taille de l’archive compressée, de la taille décompressée et du nombre de fichiers.

<Warning>
L’analyse principale des performances utilise un échantillon de test rapide par version, à l’exception des lignes `v2026.5.27` et `v2026.5.28`, qui utilisent les derniers artefacts de branche de version répétés trois fois. Le contexte antérieur d’avril utilise les médianes publiées de trois répétitions provenant de `clawgrit-reports`. Considérez ces chiffres comme des indications de tendance et des signaux pour rechercher les régressions, et non comme des statistiques servant de critères de validation des versions.
</Warning>

## Vue d’ensemble

Couverture des performances : **77 versions demandées**, **74 points étayés par des artefacts** et **3 exécutions CI indisponibles**. Dernier point stable mesuré : `v2026.5.28`.

<CardGroup cols={2}>
  <Card title="Tour d’agent stable" icon="gauge">
    **Tour à froid 5,1 fois plus rapide**

    - `v2026.4.14` : 9,8 s
    - `v2026.5.28` : 1,9 s

  </Card>
  <Card title="Paquet publié" icon="package">
    **Archive de 17,9 Mo**

    Dernier paquet stable, contre un pic de taille de 43,3 Mo en mars.

  </Card>
  <Card title="Dernière installation stable" icon="hard-drive">
    **Installation propre de 361,7 Mio**

    Réduit fortement l’arbre de dépendances OpenClaw imbriqué par rapport au pic atteint lors de l’introduction du shrinkwrap dans `2026.5.22`, bien qu’un arbre imbriqué plus petit de 259,7 Mio subsiste dans l’audit d’installation local.

  </Card>
  <Card title="Graphe de dépendances" icon="boxes">
    **300 paquets installés**

    Mesure fondée sur les racines uniques par nom et version de paquet dans une installation propre avec les scripts désactivés, soit 71 racines de moins que dans la version stable précédente.

  </Card>
</CardGroup>

## Modifications apportées dans la version 5.28

Le nettoyage effectué entre `v2026.5.27` et `v2026.5.28` a réduit le graphe d’installation par défaut sans supprimer les fonctionnalités elles-mêmes.

<CardGroup cols={2}>
  <Card title="Graphe racine par défaut" icon="git-branch">
    Le nombre de racines uniques par nom et version de paquet est passé de **371** à **300**. Le nombre d’instances de paquets est passé de **372** à **301**.
  </Card>
  <Card title="Arbre imbriqué" icon="unplug">
    La taille du répertoire imbriqué `openclaw/node_modules` est passée de **656,1 Mio** à **259,7 Mio** dans le même audit d’installation local.
  </Card>
  <Card title="Ensembles natifs facultatifs" icon="cpu">
    L’ensemble de paquets natifs multiplateformes de `@napi-rs/canvas` n’est plus inclus dans l’installation par défaut.
  </Card>
  <Card title="Surface de la chaîne d’approvisionnement" icon="shield">
    Moins de paquets par défaut signifie moins d’archives, de responsables, de binaires natifs, de comportements à l’installation et de chemins de mise à jour transitifs auxquels faire confiance par défaut.
  </Card>
</CardGroup>

<Tip>
Le shrinkwrap n’était pas le problème en soi. C’était la mauvaise structure du paquet. `v2026.5.28` fournit toujours un shrinkwrap, mais l’arbre de dépendances imbriqué est beaucoup plus petit et la distribution multiplateforme de canvas a disparu dans l’audit local.
</Tip>

## Chiffres clés

N’utilisez pas les lignes défectueuses de fin avril comme références publiques de performances. `v2026.4.23` et `v2026.4.29` constituent des éléments utiles pour analyser les régressions, mais les écarts importants de type `14x` décrivent principalement le rétablissement après une mauvaise série de versions.

Pour le récit du blog, utilisez la référence publiée du début avril comme ordre de grandeur. La référence est `v2026.4.14`, issue de l’exécution avec fournisseur simulé publiée dans `clawgrit-reports` (trois répétitions ; cette exécution a échoué uniquement parce que la chronologie de diagnostic n’a pas été produite, de sorte que les médianes à froid, à chaud et de RSS restent utiles comme ordre de grandeur approximatif). Considérez-la comme un contexte narratif, et non comme une statistique servant de critère de validation des versions.

| Mesure           | Référence du début avril | `v2026.5.28` |                              Écart |
| ---------------- | -----------------------: | -----------: | ---------------------------------: |
| Tour d’agent à froid |                 9 819 ms |      1 908 ms | 80,6 % de moins, 5,1 fois plus rapide |
| Tour d’agent à chaud |                 7 458 ms |      1 870 ms | 74,9 % de moins, 4,0 fois plus rapide |
| Pic RSS de l’agent   |                 686,2 Mo |      581,0 Mo |                    15,3 % de moins |

Dans l’analyse de mai, la dernière ligne de branche de version a évolué de manière significative par rapport à `v2026.5.2` :

| Mesure           | `v2026.5.2` | `v2026.5.28` |            Écart |
| ---------------- | ----------: | -----------: | ---------------: |
| Tour d’agent à froid |     3 897 ms |      1 908 ms | 51,0 % de moins |
| Tour d’agent à chaud |     3 610 ms |      1 870 ms | 48,2 % de moins |
| Pic RSS de l’agent   |     613,7 Mo |      581,0 Mo |  5,3 % de moins |

Par rapport à la version stable précédente :

| Mesure           | `v2026.5.27` | `v2026.5.28` |            Écart |
| ---------------- | -----------: | -----------: | ---------------: |
| Tour d’agent à froid |      2 231 ms |      1 908 ms | 14,5 % de moins |
| Tour d’agent à chaud |      2 226 ms |      1 870 ms | 16,0 % de moins |
| Pic RSS de l’agent   |      649,0 Mo |      581,0 Mo | 10,5 % de moins |

### Empreinte d’installation

| Mesure                                              | Référence | `v2026.5.28` |            Écart |
| --------------------------------------------------- | --------: | -----------: | ---------------: |
| Taille d’installation depuis le pic de `2026.5.22`  | 1 020,6 Mo |     361,7 Mio | 64,6 % de moins |
| Taille d’installation depuis la dernière version `2026.5.27` | 767,1 Mio | 361,7 Mio | 52,8 % de moins |
| Dépendances depuis le pic mensuel de `2026.2.26`    |       645 |          300 | 53,5 % de moins |
| Dépendances depuis la dernière version `2026.5.27`  |       371 |          300 | 19,1 % de moins |
| `openclaw/node_modules` imbriqué depuis `2026.5.22` | 911,8 Mo |     259,7 Mio | 71,5 % de moins |
| `openclaw/node_modules` imbriqué depuis `2026.5.27` | 656,1 Mio |     259,7 Mio | 60,4 % de moins |

### Taille du paquet npm

| Version     | Archive compressée | Paquet décompressé | Fichiers | Remarques                                  |
| ----------- | ------------------: | -----------------: | -------: | ------------------------------------------ |
| `2026.1.30` |             12,8 Mo |            33,5 Mo |    4 607 | paquet renommé initial                     |
| `2026.2.26` |             23,6 Mo |            82,9 Mo |   10 125 | développement des fonctionnalités          |
| `2026.3.31` |             43,3 Mo |           182,6 Mo |   21 037 | pic de taille du paquet                    |
| `2026.4.29` |             22,9 Mo |            74,6 Mo |    9 309 | réduction du paquet visible                |
| `2026.5.12` |             23,4 Mo |            80,1 Mo |   12 035 | séparation majeure des plugins externes    |
| `2026.5.22` |             17,2 Mo |            76,9 Mo |   12 386 | documentation et ressources exclues du paquet |
| `2026.5.27` |             17,8 Mo |            79,0 Mo |   12 509 | paquet stable précédent                    |
| `2026.5.28` |             17,9 Mo |            81,0 Mo |    9 082 | dernier paquet stable                      |

`2026.5.12` constitue le jalon visible de l’extraction des plugins dans le journal des modifications : Amazon Bedrock, Bedrock Mantle, Slack, le bac à sable OpenShell, Anthropic Vertex, Matrix et WhatsApp ont été retirés du chemin de dépendances du cœur, afin que leurs ensembles de dépendances soient installés avec ces plugins plutôt qu’avec chaque installation du cœur.

## Résumé des tours de l’agent Kova

La série stable d’avril raconte deux histoires différentes. Le début avril était lent, mais reconnaissable. La fin avril s’est transformée en véritable précipice de régression. `v2026.5.2` est la première version où le parcours avec fournisseur simulé descend dans la plage de 3 à 5 secondes et commence à réussir régulièrement dans l’analyse fournie.

Contexte publié antérieur :

| Version      | Kova    | Tour à froid | Tour à chaud | Pic RSS de l’agent |
| ------------ | ------- | ------------: | ------------: | -----------------: |
| `v2026.4.10` | ÉCHEC   |     11 031 ms |      7 962 ms |           679,0 Mo |
| `v2026.4.12` | ÉCHEC   |     11 965 ms |      8 289 ms |           713,5 Mo |
| `v2026.4.14` | ÉCHEC   |      9 819 ms |      7 458 ms |           686,2 Mo |
| `v2026.4.20` | ÉCHEC   |     22 314 ms |     18 811 ms |           810,8 Mo |
| `v2026.4.22` | ÉCHEC   |      9 630 ms |      7 459 ms |           743,0 Mo |

Analyse fournie :

| Version             | Kova    | Tour à froid | Tour à chaud | Pic RSS de l’agent |
| ------------------- | ------- | ------------: | ------------: | -----------------: |
| `v2026.4.23`        | ÉCHEC   |     47 847 ms |      8 010 ms |         1 082,7 Mo |
| `v2026.4.24`        | ÉCHEC   |     48 264 ms |     25 483 ms |           996,0 Mo |
| `v2026.4.25`        | ÉCHEC   |     81 080 ms |     59 172 ms |         1 113,9 Mo |
| `v2026.4.26`        | ÉCHEC   |     76 771 ms |     54 941 ms |         1 140,8 Mo |
| `v2026.4.27`        | ÉCHEC   |     60 902 ms |     33 699 ms |         1 156,0 Mo |
| `v2026.4.29`        | ÉCHEC   |     94 031 ms |     57 334 ms |         3 613,7 Mo |
| `v2026.5.2`         | RÉUSSITE |      3 897 ms |      3 610 ms |           613,7 Mo |
| `v2026.5.7`         | RÉUSSITE |      3 923 ms |      3 693 ms |           654,1 Mo |
| `v2026.5.12`        | RÉUSSITE |      7 248 ms |      6 629 ms |           834,8 Mo |
| `v2026.5.18`        | RÉUSSITE |      3 301 ms |      2 913 ms |           630,3 Mo |
| `v2026.5.20`        | RÉUSSITE |      3 413 ms |      2 952 ms |           643,2 Mo |
| `v2026.5.22`        | RÉUSSITE |      4 494 ms |      4 093 ms |           654,3 Mo |
| `v2026.5.26`        | RÉUSSITE |      2 626 ms |      2 282 ms |           660,4 Mo |
| `v2026.5.27-beta.1` | RÉUSSITE |      2 575 ms |      2 217 ms |           635,3 Mo |
| `v2026.5.27`        | RÉUSSITE |      2 231 ms |      2 226 ms |           649,0 Mo |
| `v2026.5.28`        | RÉUSSITE |      1 908 ms |      1 870 ms |           581,0 Mo |

## Sondes du code source

Les sondes du code source ont été ignorées pour 17 anciennes références réussies, car ces arborescences de code source ne disposaient pas encore des points d’entrée requis pour les sondes. Les mesures de tours d’agent existent néanmoins pour ces références.

Points représentatifs des sondes du code source :

| Version             | p50 de `readyz` par défaut | p50 de `readyz` avec 50 plugins | p50 de santé de la CLI | RSS maximal des plugins |
| ------------------- | -------------------------: | -------------------------------: | ----------------------: | -----------------------: |
| `v2026.4.29`        |                   2 819 ms |                         2 618 ms |                1 679 ms |                 389,0 Mo |
| `v2026.5.2`         |                   2 324 ms |                         2 013 ms |                1 384 ms |                 377,2 Mo |
| `v2026.5.7`         |                   1 649 ms |                         1 540 ms |                1 175 ms |                 387,6 Mo |
| `v2026.5.18`        |                   1 942 ms |                         1 927 ms |                  607 ms |                 426,5 Mo |
| `v2026.5.20`        |                   1 966 ms |                         1 987 ms |                  621 ms |                 455,0 Mo |
| `v2026.5.22`        |                   2 081 ms |                         1 884 ms |                5 095 ms |                 444,2 Mo |
| `v2026.5.26`        |                   1 546 ms |                         1 634 ms |                  656 ms |                 400,4 Mo |
| `v2026.5.27-beta.1` |                   1 462 ms |                         1 548 ms |                  548 ms |                 394,0 Mo |
| `v2026.5.27`        |                   1 491 ms |                         1 571 ms |                  553 ms |                 401,5 Mo |
| `v2026.5.28`        |                   1 457 ms |                         1 474 ms |                  623 ms |                 386,1 Mo |

Le pic de santé de la CLI dans `v2026.5.22` est visible dans ce tableau, même si le parcours de tours d’agent a tout de même réussi. Conservez les sondes du code source lors de l’analyse de régressions ciblées de la CLI ou du Gateway.

## Audit de l’empreinte d’installation

Les échantillons de dépendances utilisent une version stable par mois, ainsi que l’événement d’introduction du shrinkwrap dans `2026.5.22` et la dernière version `2026.5.28`.

| Point                  | Dépendances installées | Nouvelle installation | Paquet OpenClaw | `openclaw/node_modules` imbriqué | Shrinkwrap racine | Comportement d’installation de Canvas                  |
| ---------------------- | ----------------------: | --------------------: | --------------: | --------------------------------: | ----------------- | ------------------------------------------------------ |
| Janv. `2026.1.30`      |                     605 |             438.4MB |          45.8MB |                             2.4MB | non               | enveloppe de premier niveau + `darwin-arm64`            |
| Févr. `2026.2.26`      |                     645 |             575.7MB |         110.1MB |                             3.5MB | non               | enveloppe de premier niveau + `darwin-arm64`            |
| Mars `2026.3.31`       |                     438 |             584.1MB |         234.8MB |                               0MB | non               | enveloppe de premier niveau + `darwin-arm64`            |
| Avr. `2026.4.29`       |                     392 |             335.0MB |          97.4MB |                               0MB | non               | aucune installation                                    |
| `2026.5.22`            |                     401 |           1,020.6MB |       1,020.4MB |                           911.8MB | oui               | imbriqués : les 12 paquets `@napi-rs/canvas`           |
| Mai `2026.5.26`        |                     371 |             767.5MB |         767.4MB |                           656.4MB | oui               | imbriqués : les 12 paquets `@napi-rs/canvas`           |
| `2026.5.27`            |                     371 |            767.1MiB |        766.9MiB |                          656.1MiB | oui               | imbriqués : les 12 paquets `@napi-rs/canvas`           |
| Dernière `2026.5.28`   |                     300 |            361.7MiB |        361.6MiB |                          259.7MiB | oui               | aucune installation                                    |

### Limite du shrinkwrap

La version `2026.5.20` a été publiée sans shrinkwrap racine ni arborescence volumineuse de dépendances OpenClaw imbriquées. La version `2026.5.22` a introduit le shrinkwrap racine et installé 911.8MB sous le répertoire imbriqué `openclaw/node_modules`. La version `2026.5.28` conserve le shrinkwrap et installe toujours 259.7MiB sous le répertoire imbriqué `openclaw/node_modules`, mais n’installe plus aucun paquet `@napi-rs/canvas` lors de l’audit local d’une nouvelle installation.

L’inspection des archives tar publiées confirme cette limite :

| Version     | Version stable publiée ? | `npm-shrinkwrap.json` racine | Remarques                                                   |
| ----------- | ------------------------- | ---------------------------- | ----------------------------------------------------------- |
| `2026.5.20` | oui                       | non                          | dernière version stable avant le shrinkwrap                 |
| `2026.5.21` | non                       | s.o.                         | aucune version npm stable                                   |
| `2026.5.22` | oui                       | oui                          | introduction du shrinkwrap                                  |
| `2026.5.23` | non                       | s.o.                         | aucune version npm stable                                   |
| `2026.5.24` | non                       | s.o.                         | aucune version npm stable                                   |
| `2026.5.25` | non                       | s.o.                         | aucune version npm stable                                   |
| `2026.5.26` | oui                       | oui                          | arborescence de dépendances imbriquée toujours présente     |
| `2026.5.27` | oui                       | oui                          | arborescence de dépendances imbriquée toujours présente     |
| `2026.5.28` | oui                       | oui                          | arborescence de dépendances imbriquée nettement plus petite |

Distinction importante : **le shrinkwrap lui-même n’est pas le problème**.
La version `v2026.5.28` inclut toujours le shrinkwrap racine. Le problème résidait dans la structure du paquet, qui conduisait npm à matérialiser une volumineuse arborescence de dépendances OpenClaw imbriquées ainsi que les 12 paquets de plateforme `@napi-rs/canvas`. L’arborescence imbriquée est plus petite dans `v2026.5.28`, et l’ensemble des plateformes Canvas n’apparaît plus dans l’audit local.

Pour une explication accessible du shrinkwrap et des vérifications de paquets destinées aux responsables de maintenance, consultez [shrinkwrap npm](/fr/gateway/security/shrinkwrap).

## Interprétation pour la chaîne d’approvisionnement

Le nombre de dépendances est une métrique de sécurité opérationnelle, et pas seulement une métrique de taille d’installation. Chaque paquet élargit l’ensemble des responsables de maintenance, des archives tar, des mises à jour transitives, des binaires natifs facultatifs et des comportements lors de l’installation auxquels les opérateurs doivent faire confiance.

La démarche de nettoyage consiste à :

- maintenir les fonctionnalités lourdes et facultatives hors de l’installation par défaut du cœur
- faire en sorte que les paquets de Plugin possèdent leur propre graphe de dépendances d’exécution
- éviter toute réparation par le gestionnaire de paquets à l’exécution pendant le démarrage du Gateway
- préserver la reproductibilité des installations sans provoquer la matérialisation de paquets natifs pour toutes les plateformes
- maintenir les scripts d’installation désactivés dans les parcours d’acceptation et de mesure des paquets
- détecter les arborescences de dépendances imbriquées et les explosions de dépendances natives facultatives avant la publication

Documentation associée :

- [Résolution des dépendances des Plugins](/fr/plugins/dependency-resolution)
- [Inventaire des Plugins](/fr/plugins/plugin-inventory)
- [Validation complète d’une version](/fr/reference/full-release-validation)
