---
read_when:
    - Vous validez le nettoyage des performances et de la taille des packages de mai 2026
    - Vous avez besoin des chiffres derrière l’article de blog sur les performances et les dépendances d’OpenClaw
    - Vous modifiez les contrôles de publication, le shrinkwrap des paquets ou les limites des dépendances des plugins
summary: Synthèse visuelle et preuves techniques pour le nettoyage des performances, de la taille des paquets, des dépendances et du shrinkwrap de mai 2026
title: Passe de performance de version
x-i18n:
    generated_at: "2026-06-27T18:10:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 93438b8037a40ed9e5590854926badfe943d440e4c585e6290d29b54764e861b
    source_path: reference/release-performance-sweep.md
    workflow: 16
---

Cette page rassemble les preuves derrière le nettoyage de mai 2026 d’OpenClaw concernant les performances,
la taille des paquets, les dépendances et le shrinkwrap. Elle est le complément technique
de l’article de blog public.

Deux audits sont combinés ici :

- **Balayage des performances de publication :** les GitHub Releases de `v2026.5.28` en remontant jusqu’à
  la version stable `v2026.4.23`, avec le workflow `OpenClaw Performance`,
  `profile=smoke`, voie mock-provider. La plupart des lignes de tags correspondent à un seul échantillon ; les
  lignes `v2026.5.27` et `v2026.5.28` utilisent les derniers artefacts repeat-3
  de la branche de publication.
- **Contexte antérieur d’avril :** lignes de base mock-provider publiées dans
  `clawgrit-reports`, de `v2026.4.1` à `v2026.5.2`, utilisées uniquement pour éviter de traiter
  les publications défaillantes de fin avril comme la ligne de base publique des performances.
- **Balayage de l’empreinte d’installation :** installations fraîches avec `npm install --ignore-scripts`
  dans des paquets temporaires, avec `du -sk node_modules` pour la taille et un
  parcours de `node_modules` pour compter les instances de paquets.
- **Balayage de la taille du paquet npm :** `npm pack openclaw@<version> --dry-run --json`
  pour les publications publiées, en enregistrant la taille compressée de l’archive tar, la taille
  décompressée et le nombre de fichiers.

<Warning>
Le principal balayage des performances utilise un échantillon smoke par tag, sauf les
lignes `v2026.5.27` et `v2026.5.28`, qui utilisent les derniers artefacts repeat-3
de la branche de publication. Le contexte antérieur d’avril utilise les médianes repeat-3
publiées dans `clawgrit-reports`. Considérez ces chiffres comme des preuves de tendance et un
signal de recherche de régressions, et non comme des statistiques de seuil de publication.
</Warning>

## Instantané

Couverture des performances : **77 publications demandées**, **74 points appuyés par des artefacts**,
et **3 exécutions CI indisponibles**. Dernier point stable mesuré : `v2026.5.28`.

<CardGroup cols={2}>
  <Card title="Stable agent turn" icon="gauge">
    **Tour agent à froid 5,1 fois plus rapide**

    - `v2026.4.14` : 9,8 s
    - `v2026.5.28` : 1,9 s

  </Card>
  <Card title="Published package" icon="package">
    **Archive tar de 17,9 Mo**

    Dernier paquet stable, en baisse par rapport au pic de taille de paquet de mars, à 43,3 Mo.

  </Card>
  <Card title="Latest stable install" icon="hard-drive">
    **Installation fraîche de 361,7 Mio**

    `v2026.5.28` réduit fortement l’arborescence imbriquée des dépendances d’OpenClaw, mais une
    arborescence imbriquée plus petite de 259,7 Mio reste encore dans l’audit d’installation local.

  </Card>
  <Card title="Dependency graph" icon="boxes">
    **300 paquets installés**

    Dernière publication stable, mesurée comme racines uniques de nom/version de paquet dans une
    installation fraîche avec les scripts désactivés.

  </Card>
</CardGroup>

## Chronologie de l’empreinte d’installation

<CardGroup cols={2}>
  <Card title="Monthly high" icon="triangle-alert">
    **645 dépendances**

    `2026.2.26` a été le pic mensuel du nombre de dépendances dans cet échantillon.

  </Card>
  <Card title="Shrinkwrap introduced" icon="lock">
    **Installation de 1 020,6 Mo**

    `2026.5.22` a ajouté le shrinkwrap racine et révélé un problème de forme du paquet :
    911,8 Mo ont été installés sous `openclaw/node_modules` imbriqué.

  </Card>
  <Card title="Latest stable" icon="tag">
    **Installation de 361,7 Mio**

    `2026.5.28` réduit la taille d’installation fraîche de 52,8 % par rapport à `2026.5.27`, mais installe encore
    une arborescence OpenClaw imbriquée de 259,7 Mio.

  </Card>
  <Card title="Dependency graph" icon="scissors">
    **300 racines de paquets**

    `2026.5.28` installe 71 racines uniques de nom/version de paquet de moins que
    `2026.5.27`.

  </Card>
</CardGroup>

<Tip>
Le shrinkwrap n’était pas le problème à lui seul. La mauvaise forme du paquet l’était.
`v2026.5.28` inclut toujours le shrinkwrap, mais l’arborescence imbriquée des dépendances est beaucoup
plus petite et le fanout canvas toutes plateformes a disparu dans l’audit local.
</Tip>

## Ce qui a changé dans la version 5.28

Le nettoyage entre `v2026.5.27` et `v2026.5.28` a réduit le graphe de
l’installation par défaut au lieu de supprimer les capacités elles-mêmes.

<CardGroup cols={2}>
  <Card title="Graphe racine par défaut" icon="git-branch">
    Les racines uniques nom/version de paquet sont passées de **371** à **300**.
    Les instances de paquet sont passées de **372** à **301**.
  </Card>
  <Card title="Arborescence imbriquée" icon="unplug">
    Le `openclaw/node_modules` imbriqué est passé de **656.1MiB** à
    **259.7MiB** dans le même audit d’installation locale.
  </Card>
  <Card title="Cônes natifs optionnels" icon="cpu">
    Le cône de paquets natifs toutes plateformes `@napi-rs/canvas` a cessé
    d’arriver dans l’installation par défaut.
  </Card>
  <Card title="Surface de chaîne d’approvisionnement" icon="shield">
    Moins de paquets par défaut signifie moins de tarballs, de mainteneurs, de
    binaires natifs, de comportements à l’installation et de chemins de mise à
    jour transitifs auxquels faire confiance par défaut.
  </Card>
</CardGroup>

## Chiffres clés

N’utilisez pas les lignes cassées de fin avril comme références publiques de
performance. `v2026.4.23` et `v2026.4.29` sont des preuves de régression utiles,
mais les grands écarts de type `14x` décrivent surtout la récupération après
une mauvaise série de versions.

Pour le récit de blog, utilisez la référence publiée plus tôt en avril comme
échelle :

| Métrique             | Référence début avril | `v2026.5.28` |                         Écart |
| -------------------- | --------------------: | -----------: | ----------------------------: |
| Tour d’agent à froid |               9,819ms |      1,908ms | 80.6% de moins, 5.1x plus vite |
| Tour d’agent à chaud |               7,458ms |      1,870ms | 74.9% de moins, 4.0x plus vite |
| RSS maximal agent    |               686.2MB |      581.0MB |                15.3% de moins |

La référence de début avril est `v2026.4.14`, issue de l’exécution
`clawgrit-reports` publiée avec fournisseur simulé. Cette exécution utilisait
la répétition 3 et a échoué uniquement parce que la chronologie de diagnostic
n’a pas été émise ; les médianes à froid, à chaud et RSS restent utiles comme
ordre de grandeur approximatif. Traitez cela comme du contexte narratif, et non
comme une statistique de validation de publication.

Dans le balayage de mai, la dernière ligne de branche de publication a évolué
de manière significative depuis `v2026.5.2` :

| Métrique             | `v2026.5.2` | `v2026.5.28` |          Écart |
| -------------------- | ----------: | -----------: | -------------: |
| Tour d’agent à froid |     3,897ms |      1,908ms | 51.0% de moins |
| Tour d’agent à chaud |     3,610ms |      1,870ms | 48.2% de moins |
| RSS maximal agent    |     613.7MB |      581.0MB |  5.3% de moins |

Par rapport à la version stable précédente :

| Métrique             | `v2026.5.27` | `v2026.5.28` |          Écart |
| -------------------- | -----------: | -----------: | -------------: |
| Tour d’agent à froid |      2,231ms |      1,908ms | 14.5% de moins |
| Tour d’agent à chaud |      2,226ms |      1,870ms | 16.0% de moins |
| RSS maximal agent    |      649.0MB |      581.0MB | 10.5% de moins |

### Empreinte d’installation

| Métrique                                           | Référence | `v2026.5.28` |          Écart |
| -------------------------------------------------- | --------: | -----------: | -------------: |
| Taille d’installation depuis le pic `2026.5.22`    | 1,020.6MB |     361.7MiB | 64.6% de moins |
| Taille d’installation depuis la dernière version `2026.5.27` |  767.1MiB |     361.7MiB | 52.8% de moins |
| Dépendances depuis le sommet mensuel `2026.2.26`   |       645 |          300 | 53.5% de moins |
| Dépendances depuis la dernière version `2026.5.27` |       371 |          300 | 19.1% de moins |
| `openclaw/node_modules` imbriqué depuis `2026.5.22` |   911.8MB |     259.7MiB | 71.5% de moins |
| `openclaw/node_modules` imbriqué depuis `2026.5.27` |  656.1MiB |     259.7MiB | 60.4% de moins |

### Taille du paquet npm

| Version     | Tarball compressé | Paquet décompressé | Fichiers | Notes                                      |
| ----------- | ----------------: | ------------------: | -------: | ------------------------------------------ |
| `2026.1.30` |            12.8MB |              33.5MB |    4,607 | paquet renommé initial                     |
| `2026.2.26` |            23.6MB |              82.9MB |   10,125 | croissance des fonctionnalités             |
| `2026.3.31` |            43.3MB |             182.6MB |   21,037 | point haut de taille de paquet             |
| `2026.4.29` |            22.9MB |              74.6MB |    9,309 | élagage du paquet visible                  |
| `2026.5.12` |            23.4MB |              80.1MB |   12,035 | séparation majeure des plugins externes    |
| `2026.5.22` |            17.2MB |              76.9MB |   12,386 | docs/ressources exclues du paquet          |
| `2026.5.27` |            17.8MB |              79.0MB |   12,509 | paquet stable précédent                    |
| `2026.5.28` |            17.9MB |              81.0MB |    9,082 | dernier paquet stable                      |

`2026.5.12` est le jalon visible d’extraction de plugins dans le changelog :
Amazon Bedrock, Bedrock Mantle, Slack, OpenShell sandbox, Anthropic Vertex,
Matrix et WhatsApp ont quitté le chemin de dépendances du cœur afin que leurs
cônes de dépendances s’installent avec ces plugins au lieu de chaque
installation du cœur.

## Résumé des tours d’agent Kova

La série stable d’avril contient deux histoires différentes. Le début avril
était lent mais reconnaissable. La fin avril est devenue un précipice de
régression. `v2026.5.2` est le point où la voie avec fournisseur simulé descend
pour la première fois dans la plage de 3 à 5 s et commence à réussir de façon
constante dans le balayage fourni.

Contexte publié antérieur :

| Version      | Kova  | Tour à froid | Tour à chaud | RSS maximal agent |
| ------------ | ----- | -----------: | -----------: | ----------------: |
| `v2026.4.10` | ÉCHEC |     11,031ms |      7,962ms |           679.0MB |
| `v2026.4.12` | ÉCHEC |     11,965ms |      8,289ms |           713.5MB |
| `v2026.4.14` | ÉCHEC |      9,819ms |      7,458ms |           686.2MB |
| `v2026.4.20` | ÉCHEC |     22,314ms |     18,811ms |           810.8MB |
| `v2026.4.22` | ÉCHEC |      9,630ms |      7,459ms |           743.0MB |

Balayage fourni :

| Version             | Kova     | Tour à froid | Tour à chaud | RSS maximal agent |
| ------------------- | -------- | -----------: | -----------: | ----------------: |
| `v2026.4.23`        | ÉCHEC    |     47,847ms |      8,010ms |         1,082.7MB |
| `v2026.4.24`        | ÉCHEC    |     48,264ms |     25,483ms |           996.0MB |
| `v2026.4.25`        | ÉCHEC    |     81,080ms |     59,172ms |         1,113.9MB |
| `v2026.4.26`        | ÉCHEC    |     76,771ms |     54,941ms |         1,140.8MB |
| `v2026.4.27`        | ÉCHEC    |     60,902ms |     33,699ms |         1,156.0MB |
| `v2026.4.29`        | ÉCHEC    |     94,031ms |     57,334ms |         3,613.7MB |
| `v2026.5.2`         | RÉUSSITE |      3,897ms |      3,610ms |           613.7MB |
| `v2026.5.7`         | RÉUSSITE |      3,923ms |      3,693ms |           654.1MB |
| `v2026.5.12`        | RÉUSSITE |      7,248ms |      6,629ms |           834.8MB |
| `v2026.5.18`        | RÉUSSITE |      3,301ms |      2,913ms |           630.3MB |
| `v2026.5.20`        | RÉUSSITE |      3,413ms |      2,952ms |           643.2MB |
| `v2026.5.22`        | RÉUSSITE |      4,494ms |      4,093ms |           654.3MB |
| `v2026.5.26`        | RÉUSSITE |      2,626ms |      2,282ms |           660.4MB |
| `v2026.5.27-beta.1` | RÉUSSITE |      2,575ms |      2,217ms |           635.3MB |
| `v2026.5.27`        | RÉUSSITE |      2,231ms |      2,226ms |           649.0MB |
| `v2026.5.28`        | RÉUSSITE |      1,908ms |      1,870ms |           581.0MB |

## Sondes source

Les sondes source ont été ignorées pour 17 anciennes références réussies, car
ces arborescences source n’avaient pas encore les points d’entrée de sonde
requis. Les métriques de tours d’agent existent toujours pour ces références.

Points représentatifs de sonde source :

| Version             | `readyz` p50 par défaut | `readyz` p50 avec 50 plugins | Santé CLI p50 | RSS max Plugin |
| ------------------- | ----------------------: | ---------------------------: | ------------: | -------------: |
| `v2026.4.29`        |                 2,819ms |                      2,618ms |       1,679ms |        389.0MB |
| `v2026.5.2`         |                 2,324ms |                      2,013ms |       1,384ms |        377.2MB |
| `v2026.5.7`         |                 1,649ms |                      1,540ms |       1,175ms |        387.6MB |
| `v2026.5.18`        |                 1,942ms |                      1,927ms |         607ms |        426.5MB |
| `v2026.5.20`        |                 1,966ms |                      1,987ms |         621ms |        455.0MB |
| `v2026.5.22`        |                 2,081ms |                      1,884ms |       5,095ms |        444.2MB |
| `v2026.5.26`        |                 1,546ms |                      1,634ms |         656ms |        400.4MB |
| `v2026.5.27-beta.1` |                 1,462ms |                      1,548ms |         548ms |        394.0MB |
| `v2026.5.27`        |                 1,491ms |                      1,571ms |         553ms |        401.5MB |
| `v2026.5.28`        |                 1,457ms |                      1,474ms |         623ms |        386.1MB |

Le pic d’état de santé de la CLI `v2026.5.22` est visible dans ce tableau, même si la
voie agent-turn réussissait toujours. Conservez les sondes source lors de l’investigation
des régressions ciblées de la CLI ou du Gateway.

## Audit de l’empreinte d’installation

Les échantillons de dépendances utilisent une version stable par mois, plus
l’événement d’introduction du shrinkwrap `2026.5.22` et la dernière version `2026.5.28`.

| Point                  | Dépendances installées | Nouvelle installation | Paquet OpenClaw | `openclaw/node_modules` imbriqué | Shrinkwrap racine | Comportement d’installation de Canvas      |
| ---------------------- | ---------------------: | --------------------: | ---------------: | -------------------------------: | ----------------- | ------------------------------------------ |
| Janv. `2026.1.30`      |                    605 |               438.4MB |           45.8MB |                            2.4MB | non               | wrapper de premier niveau + `darwin-arm64` |
| Févr. `2026.2.26`      |                    645 |               575.7MB |          110.1MB |                            3.5MB | non               | wrapper de premier niveau + `darwin-arm64` |
| Mars `2026.3.31`       |                    438 |               584.1MB |          234.8MB |                              0MB | non               | wrapper de premier niveau + `darwin-arm64` |
| Avr. `2026.4.29`       |                    392 |               335.0MB |           97.4MB |                              0MB | non               | aucun installé                             |
| `2026.5.22`            |                    401 |             1,020.6MB |        1,020.4MB |                          911.8MB | oui               | imbriqué : les 12 paquets `@napi-rs/canvas` |
| Mai `2026.5.26`        |                    371 |               767.5MB |          767.4MB |                          656.4MB | oui               | imbriqué : les 12 paquets `@napi-rs/canvas` |
| `2026.5.27`            |                    371 |              767.1MiB |         766.9MiB |                         656.1MiB | oui               | imbriqué : les 12 paquets `@napi-rs/canvas` |
| Dernière `2026.5.28`   |                    300 |              361.7MiB |         361.6MiB |                         259.7MiB | oui               | aucun installé                             |

### Limite du shrinkwrap

<CardGroup cols={2}>
  <Card title="Before shrinkwrap" icon="unlock">
    `2026.5.20` n’a pas de shrinkwrap racine ni de grand arbre de dépendances
    OpenClaw imbriqué.
  </Card>
  <Card title="Introduced" icon="lock">
    `2026.5.22` ajoute le shrinkwrap racine et installe 911.8MB sous
    `openclaw/node_modules` imbriqué.
  </Card>
  <Card title="Latest stable" icon="tag">
    `2026.5.28` conserve le shrinkwrap et installe encore 259.7MiB sous
    `openclaw/node_modules` imbriqué.
  </Card>
  <Card title="Canvas fanout fixed" icon="check">
    `2026.5.28` n’installe plus aucun paquet `@napi-rs/canvas` dans l’audit local
    de nouvelle installation.
  </Card>
</CardGroup>

L’inspection des tarballs publiés vérifie la limite :

| Version     | Stable publiée ? | `npm-shrinkwrap.json` racine | Notes                                      |
| ----------- | ---------------- | ---------------------------- | ------------------------------------------ |
| `2026.5.20` | oui              | non                          | dernière version stable avant le shrinkwrap |
| `2026.5.21` | non              | s.o.                         | aucune version npm stable                  |
| `2026.5.22` | oui              | oui                          | shrinkwrap introduit                       |
| `2026.5.23` | non              | s.o.                         | aucune version npm stable                  |
| `2026.5.24` | non              | s.o.                         | aucune version npm stable                  |
| `2026.5.25` | non              | s.o.                         | aucune version npm stable                  |
| `2026.5.26` | oui              | oui                          | arbre de dépendances imbriqué encore présent |
| `2026.5.27` | oui              | oui                          | arbre de dépendances imbriqué encore présent |
| `2026.5.28` | oui              | oui                          | arbre de dépendances imbriqué beaucoup plus petit |

La distinction importante : **le shrinkwrap lui-même n’est pas le problème**.
`v2026.5.28` fournit toujours un shrinkwrap racine. Le problème était la forme du paquet
qui amenait npm à matérialiser un grand arbre de dépendances OpenClaw imbriqué et les 12
paquets de plateforme `@napi-rs/canvas`. L’arbre imbriqué est plus petit dans `v2026.5.28`,
et l’éventail des plateformes Canvas n’apparaît plus dans l’audit local.

Pour une explication en langage clair du shrinkwrap et des vérifications de paquet
au niveau mainteneur, consultez [shrinkwrap npm](/fr/gateway/security/shrinkwrap).

## Interprétation de la chaîne d’approvisionnement

Le nombre de dépendances est une métrique de sécurité opérationnelle, pas seulement
une métrique de taille d’installation. Chaque paquet élargit l’ensemble des mainteneurs,
des tarballs, des mises à jour transitives, des binaires natifs optionnels et des
comportements au moment de l’installation auxquels les opérateurs doivent faire confiance.

La direction du nettoyage est la suivante :

- conserver les capacités lourdes et optionnelles hors de l’installation du cœur par défaut
- faire en sorte que les paquets de Plugin possèdent leur propre graphe de dépendances d’exécution
- éviter les réparations du gestionnaire de paquets à l’exécution pendant le démarrage du Gateway
- préserver des installations déterministes sans provoquer la matérialisation de paquets natifs pour toutes les plateformes
- garder les scripts d’installation désactivés dans les chemins d’acceptation et de mesure des paquets
- détecter les arbres de dépendances imbriqués et les explosions de dépendances optionnelles natives avant
  publication

Documentation connexe :

- [Résolution des dépendances de Plugin](/fr/plugins/dependency-resolution)
- [Inventaire des Plugins](/fr/plugins/plugin-inventory)
- [Validation de version complète](/fr/reference/full-release-validation)
