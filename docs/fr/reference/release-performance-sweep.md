---
read_when:
    - Vous validez le nettoyage de mai 2026 relatif aux performances et à la taille des paquets.
    - Vous avez besoin des chiffres à l’appui de l’article de blog sur les performances et les dépendances d’OpenClaw
    - Vous modifiez les critères de publication, le verrouillage des versions du paquet ou les limites des dépendances des plugins
summary: Résumé visuel et éléments techniques pour le nettoyage de mai 2026 concernant les performances, la taille des paquets, les dépendances et le fichier shrinkwrap
title: Analyse des performances de la version publiée
x-i18n:
    generated_at: "2026-07-12T15:47:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e98ffc9d63e14e078a19368917eb4278695e1426048dc21942f928af145d5e1
    source_path: reference/release-performance-sweep.md
    workflow: 16
---

Cette page rassemble les éléments probants à l’appui du nettoyage de mai 2026 concernant les performances, la taille des paquets, les dépendances et le shrinkwrap d’OpenClaw. Elle constitue le complément technique
du billet de blog public.

Deux audits sont réunis ici :

- **Analyse des performances des versions :** versions GitHub de `v2026.5.28` jusqu’à
  la version stable `v2026.4.23`, à l’aide du workflow `OpenClaw Performance`,
  avec `profile=smoke` et le parcours de fournisseur simulé. La plupart des lignes de balises reposent sur un seul échantillon ; les
  lignes `v2026.5.27` et `v2026.5.28` utilisent les derniers artefacts de branche de version
  exécutés 3 fois.
- **Contexte antérieur d’avril :** références publiées de fournisseur simulé issues de
  `clawgrit-reports`, de `v2026.4.1` à `v2026.5.2`, utilisées uniquement pour éviter de considérer
  les versions défectueuses de fin avril comme référence publique de performances.
- **Analyse de l’empreinte d’installation :** installations neuves avec `npm install --ignore-scripts`
  dans des paquets temporaires, avec `du -sk node_modules` pour la taille et un
  parcours de `node_modules` pour compter les instances de paquets.
- **Analyse de la taille du paquet npm :** `npm pack openclaw@<version> --dry-run --json`
  pour les versions publiées, avec enregistrement de la taille de l’archive compressée, de la taille
  décompressée et du nombre de fichiers.

<Warning>
L’analyse principale des performances utilise un échantillon smoke par balise, à l’exception des
lignes `v2026.5.27` et `v2026.5.28`, qui utilisent les derniers artefacts de branche de version
exécutés 3 fois. Le contexte antérieur d’avril utilise les médianes publiées sur 3 exécutions
issues de `clawgrit-reports`. Considérez ces chiffres comme des éléments indiquant une tendance et
un signal pour la recherche de régressions, et non comme des statistiques servant de critères de validation des versions.
</Warning>

## Aperçu

Couverture des performances : **77 versions demandées**, **74 points étayés par des artefacts**
et **3 exécutions CI indisponibles**. Dernier point stable mesuré : `v2026.5.28`.

<CardGroup cols={2}>
  <Card title="Tour d’agent stable" icon="gauge">
    **Tour à froid 5,1x plus rapide**

    - `v2026.4.14` : 9.8s
    - `v2026.5.28` : 1.9s

  </Card>
  <Card title="Paquet publié" icon="package">
    **Archive de 17.9MB**

    Dernier paquet stable, contre un pic de taille de paquet de 43.3MB en mars.

  </Card>
  <Card title="Dernière installation stable" icon="hard-drive">
    **Installation neuve de 361.7MiB**

    Réduit fortement l’arborescence imbriquée des dépendances d’OpenClaw par rapport au pic d’introduction
    du shrinkwrap de `2026.5.22`, même si une arborescence imbriquée plus petite de 259.7MiB subsiste
    dans l’audit d’installation local.

  </Card>
  <Card title="Graphe des dépendances" icon="boxes">
    **300 paquets installés**

    Mesurés comme racines uniques par nom/version de paquet dans une installation neuve avec
    les scripts désactivés, soit 71 racines de moins que la version stable précédente.

  </Card>
</CardGroup>

## Modifications apportées dans la version 5.28

Le nettoyage entre `v2026.5.27` et `v2026.5.28` a réduit le graphe
de l’installation par défaut au lieu de supprimer les fonctionnalités elles-mêmes.

<CardGroup cols={2}>
  <Card title="Graphe racine par défaut" icon="git-branch">
    Le nombre de racines uniques par nom/version de paquet est passé de **371** à **300**. Le nombre d’instances de paquets
    est passé de **372** à **301**.
  </Card>
  <Card title="Arborescence imbriquée" icon="unplug">
    La taille de `openclaw/node_modules` imbriqué est passée de **656.1MiB** à **259.7MiB** dans
    le même audit d’installation local.
  </Card>
  <Card title="Ensembles natifs facultatifs" icon="cpu">
    L’ensemble de paquets natifs multiplateformes `@napi-rs/canvas` n’est plus inclus dans
    l’installation par défaut.
  </Card>
  <Card title="Surface de la chaîne d’approvisionnement" icon="shield">
    Moins de paquets par défaut signifie moins d’archives, de responsables de maintenance, de binaires natifs,
    de comportements lors de l’installation et de chemins de mise à jour transitifs auxquels faire confiance par défaut.
  </Card>
</CardGroup>

<Tip>
Le shrinkwrap n’était pas le problème en lui-même. C’était la mauvaise structure du paquet.
`v2026.5.28` fournit toujours le shrinkwrap, mais l’arborescence imbriquée des dépendances est beaucoup
plus petite et la distribution multiplateforme de canvas a disparu dans l’audit local.
</Tip>

## Chiffres clés

N’utilisez pas les lignes défectueuses de fin avril comme références publiques de performances.
`v2026.4.23` et `v2026.4.29` fournissent des éléments utiles sur les régressions, mais les écarts importants
de type `14x` décrivent principalement le rétablissement après une mauvaise série de versions.

Pour le récit du blog, utilisez la référence publiée du début avril comme ordre de grandeur.
Cette référence est `v2026.4.14`, issue de l’exécution publiée avec fournisseur simulé de `clawgrit-reports`
(3 répétitions ; cette exécution a échoué uniquement parce que la chronologie de diagnostic
n’a pas été produite, les médianes à froid, à chaud et de RSS restent donc utiles
comme ordre de grandeur approximatif). Considérez-la comme un contexte narratif, et non comme une statistique
servant de critère de validation des versions.

| Métrique        | Référence du début avril | `v2026.5.28` |                           Écart |
| --------------- | ------------------------: | -----------: | ------------------------------: |
| Tour d’agent à froid |                   9,819ms |      1,908ms | 80.6% de moins, 5,1x plus rapide |
| Tour d’agent à chaud |                   7,458ms |      1,870ms | 74.9% de moins, 4,0x plus rapide |
| Pic RSS de l’agent   |                    686.2MB |      581.0MB |                   15.3% de moins |

Dans l’analyse de mai, la dernière ligne de branche de version a sensiblement évolué depuis
`v2026.5.2` :

| Métrique        | `v2026.5.2` | `v2026.5.28` |          Écart |
| --------------- | ----------: | -----------: | -------------: |
| Tour d’agent à froid |     3,897ms |      1,908ms | 51.0% de moins |
| Tour d’agent à chaud |     3,610ms |      1,870ms | 48.2% de moins |
| Pic RSS de l’agent   |     613.7MB |      581.0MB |  5.3% de moins |

Par rapport à la version stable précédente :

| Métrique        | `v2026.5.27` | `v2026.5.28` |          Écart |
| --------------- | -----------: | -----------: | -------------: |
| Tour d’agent à froid |      2,231ms |      1,908ms | 14.5% de moins |
| Tour d’agent à chaud |      2,226ms |      1,870ms | 16.0% de moins |
| Pic RSS de l’agent   |      649.0MB |      581.0MB | 10.5% de moins |

### Empreinte d’installation

| Métrique                                        | Référence | `v2026.5.28` |          Écart |
| ----------------------------------------------- | --------: | -----------: | -------------: |
| Taille d’installation depuis le pic de `2026.5.22`              | 1,020.6MB |     361.7MiB | 64.6% de moins |
| Taille d’installation depuis la dernière version `2026.5.27`    |  767.1MiB |     361.7MiB | 52.8% de moins |
| Dépendances depuis le pic mensuel de `2026.2.26`                |       645 |          300 | 53.5% de moins |
| Dépendances depuis la dernière version `2026.5.27`              |       371 |          300 | 19.1% de moins |
| `openclaw/node_modules` imbriqué depuis `2026.5.22` |   911.8MB |     259.7MiB | 71.5% de moins |
| `openclaw/node_modules` imbriqué depuis `2026.5.27` |  656.1MiB |     259.7MiB | 60.4% de moins |

### Taille du paquet npm

| Version     | Archive compressée | Paquet décompressé | Fichiers | Remarques                              |
| ----------- | ------------------: | -----------------: | -------: | -------------------------------------- |
| `2026.1.30` |              12.8MB |             33.5MB |    4,607 | premier paquet après changement de marque |
| `2026.2.26` |              23.6MB |             82.9MB |   10,125 | croissance des fonctionnalités         |
| `2026.3.31` |              43.3MB |            182.6MB |   21,037 | pic de taille du paquet                 |
| `2026.4.29` |              22.9MB |             74.6MB |    9,309 | réduction du paquet visible             |
| `2026.5.12` |              23.4MB |             80.1MB |   12,035 | importante séparation des plugins externes |
| `2026.5.22` |              17.2MB |             76.9MB |   12,386 | documentation/ressources exclues du paquet |
| `2026.5.27` |              17.8MB |             79.0MB |   12,509 | paquet stable précédent                 |
| `2026.5.28` |              17.9MB |             81.0MB |    9,082 | dernier paquet stable                   |

`2026.5.12` est le jalon visible de l’extraction des plugins dans le journal des modifications :
Amazon Bedrock, Bedrock Mantle, Slack, le bac à sable OpenShell, Anthropic Vertex,
Matrix et WhatsApp ont été retirés du chemin des dépendances principales afin que leurs ensembles de dépendances
soient installés avec ces plugins plutôt qu’avec chaque installation du cœur.

## Résumé des tours de l’agent Kova

La série stable d’avril présente deux histoires différentes. Le début d’avril était lent,
mais reconnaissable. La fin d’avril est devenue une rupture brutale liée à une régression. `v2026.5.2` est le point où
le parcours de fournisseur simulé descend pour la première fois dans la plage de 3 à 5 secondes et commence à réussir
systématiquement dans l’analyse fournie.

Contexte publié antérieur :

| Version      | Kova | Tour à froid | Tour à chaud | Pic RSS de l’agent |
| ------------ | ---- | -----------: | ------------: | -----------------: |
| `v2026.4.10` | ÉCHEC |     11,031ms |       7,962ms |            679.0MB |
| `v2026.4.12` | ÉCHEC |     11,965ms |       8,289ms |            713.5MB |
| `v2026.4.14` | ÉCHEC |      9,819ms |       7,458ms |            686.2MB |
| `v2026.4.20` | ÉCHEC |     22,314ms |      18,811ms |            810.8MB |
| `v2026.4.22` | ÉCHEC |      9,630ms |       7,459ms |            743.0MB |

Analyse fournie :

| Version             | Kova | Tour à froid | Tour à chaud | Pic RSS de l’agent |
| ------------------- | ---- | -----------: | ------------: | -----------------: |
| `v2026.4.23`        | ÉCHEC |     47,847ms |       8,010ms |          1,082.7MB |
| `v2026.4.24`        | ÉCHEC |     48,264ms |      25,483ms |            996.0MB |
| `v2026.4.25`        | ÉCHEC |     81,080ms |      59,172ms |          1,113.9MB |
| `v2026.4.26`        | ÉCHEC |     76,771ms |      54,941ms |          1,140.8MB |
| `v2026.4.27`        | ÉCHEC |     60,902ms |      33,699ms |          1,156.0MB |
| `v2026.4.29`        | ÉCHEC |     94,031ms |      57,334ms |          3,613.7MB |
| `v2026.5.2`         | RÉUSSITE |      3,897ms |       3,610ms |            613.7MB |
| `v2026.5.7`         | RÉUSSITE |      3,923ms |       3,693ms |            654.1MB |
| `v2026.5.12`        | RÉUSSITE |      7,248ms |       6,629ms |            834.8MB |
| `v2026.5.18`        | RÉUSSITE |      3,301ms |       2,913ms |            630.3MB |
| `v2026.5.20`        | RÉUSSITE |      3,413ms |       2,952ms |            643.2MB |
| `v2026.5.22`        | RÉUSSITE |      4,494ms |       4,093ms |            654.3MB |
| `v2026.5.26`        | RÉUSSITE |      2,626ms |       2,282ms |            660.4MB |
| `v2026.5.27-beta.1` | RÉUSSITE |      2,575ms |       2,217ms |            635.3MB |
| `v2026.5.27`        | RÉUSSITE |      2,231ms |       2,226ms |            649.0MB |
| `v2026.5.28`        | RÉUSSITE |      1,908ms |       1,870ms |            581.0MB |

## Sondes du code source

Les sondes du code source ont été ignorées pour 17 anciennes références réussies, car ces arborescences de code source
ne disposaient pas encore des points d’entrée de sonde requis. Les métriques de tour d’agent
existent néanmoins pour ces références.

Points représentatifs des sondes du code source :

| Version             | `readyz` par défaut p50 | `readyz` avec 50 plugins p50 | Santé de la CLI p50 | RSS maximal des plugins |
| ------------------- | ----------------------: | ----------------------------: | ---------------------: | -----------------------: |
| `v2026.4.29`        |                 2,819ms |                       2,618ms |                1,679ms |                  389.0MB |
| `v2026.5.2`         |                 2,324ms |                       2,013ms |                1,384ms |                  377.2MB |
| `v2026.5.7`         |                 1,649ms |                       1,540ms |                1,175ms |                  387.6MB |
| `v2026.5.18`        |                 1,942ms |                       1,927ms |                  607ms |                  426.5MB |
| `v2026.5.20`        |                 1,966ms |                       1,987ms |                  621ms |                  455.0MB |
| `v2026.5.22`        |                 2,081ms |                       1,884ms |                5,095ms |                  444.2MB |
| `v2026.5.26`        |                 1,546ms |                       1,634ms |                  656ms |                  400.4MB |
| `v2026.5.27-beta.1` |                 1,462ms |                       1,548ms |                  548ms |                  394.0MB |
| `v2026.5.27`        |                 1,491ms |                       1,571ms |                  553ms |                  401.5MB |
| `v2026.5.28`        |                 1,457ms |                       1,474ms |                  623ms |                  386.1MB |

Le pic de santé de la CLI de `v2026.5.22` apparaît dans ce tableau, même si le
parcours de tour d’agent a tout de même réussi. Conservez les sondes du code source lors de l’analyse
de régressions ciblées de la CLI ou du Gateway.

## Audit de l’empreinte d’installation

Les échantillons de dépendances utilisent une version stable par mois, ainsi que l’événement
d’introduction du shrinkwrap de `2026.5.22` et la dernière version `2026.5.28`.

| Point              | Dépendances installées | Nouvelle installation | Paquet OpenClaw | `openclaw/node_modules` imbriqué | Shrinkwrap racine | Comportement d’installation de Canvas                  |
| ------------------ | ----------------------: | --------------------: | --------------: | --------------------------------: | ----------------- | ------------------------------------------------------ |
| Janv. `2026.1.30`  |                     605 |             438.4MB   |          45.8MB |                             2.4MB | non               | wrapper de premier niveau + `darwin-arm64`             |
| Févr. `2026.2.26`  |                     645 |             575.7MB   |         110.1MB |                             3.5MB | non               | wrapper de premier niveau + `darwin-arm64`             |
| Mars `2026.3.31`   |                     438 |             584.1MB   |         234.8MB |                               0MB | non               | wrapper de premier niveau + `darwin-arm64`             |
| Avr. `2026.4.29`   |                     392 |             335.0MB   |          97.4MB |                               0MB | non               | aucun installé                                         |
| `2026.5.22`        |                     401 |           1,020.6MB   |       1,020.4MB |                           911.8MB | oui               | imbriqués : les 12 paquets `@napi-rs/canvas`           |
| Mai `2026.5.26`    |                     371 |             767.5MB   |         767.4MB |                           656.4MB | oui               | imbriqués : les 12 paquets `@napi-rs/canvas`           |
| `2026.5.27`        |                     371 |            767.1MiB   |        766.9MiB |                          656.1MiB | oui               | imbriqués : les 12 paquets `@napi-rs/canvas`           |
| Dernier `2026.5.28`|                     300 |            361.7MiB   |        361.6MiB |                          259.7MiB | oui               | aucun installé                                         |

### Limite du shrinkwrap

`2026.5.20` a été publié sans shrinkwrap racine ni arborescence volumineuse de
dépendances OpenClaw imbriquées. `2026.5.22` a introduit le shrinkwrap racine et
installé 911.8MB sous le répertoire imbriqué `openclaw/node_modules`.
`2026.5.28` conserve le shrinkwrap et installe encore 259.7MiB sous le répertoire
imbriqué `openclaw/node_modules`, mais n’installe plus aucun paquet
`@napi-rs/canvas` dans l’audit local d’une nouvelle installation.

L’inspection des archives tar publiées confirme cette limite :

| Version     | Version stable publiée ? | `npm-shrinkwrap.json` racine | Remarques                                           |
| ----------- | ------------------------- | ---------------------------- | --------------------------------------------------- |
| `2026.5.20` | oui                       | non                          | dernière version stable avant le shrinkwrap         |
| `2026.5.21` | non                       | s.o.                         | aucune version npm stable                           |
| `2026.5.22` | oui                       | oui                          | introduction du shrinkwrap                          |
| `2026.5.23` | non                       | s.o.                         | aucune version npm stable                           |
| `2026.5.24` | non                       | s.o.                         | aucune version npm stable                           |
| `2026.5.25` | non                       | s.o.                         | aucune version npm stable                           |
| `2026.5.26` | oui                       | oui                          | arborescence de dépendances imbriquées toujours présente |
| `2026.5.27` | oui                       | oui                          | arborescence de dépendances imbriquées toujours présente |
| `2026.5.28` | oui                       | oui                          | arborescence de dépendances imbriquées bien plus petite |

La distinction importante : **le shrinkwrap lui-même n’est pas le problème**.
`v2026.5.28` est toujours fourni avec un shrinkwrap racine. Le problème résidait
dans la structure du paquet, qui amenait npm à matérialiser une volumineuse
arborescence de dépendances OpenClaw imbriquées ainsi que les 12 paquets de
plateforme `@napi-rs/canvas`. L’arborescence imbriquée est plus petite dans
`v2026.5.28`, et la multiplication des plateformes de Canvas n’apparaît plus
dans l’audit local.

Pour une explication en langage clair du shrinkwrap et des vérifications de
paquets destinées aux responsables de maintenance, consultez
[le shrinkwrap npm](/fr/gateway/security/shrinkwrap).

## Interprétation relative à la chaîne d’approvisionnement

Le nombre de dépendances constitue une métrique de sécurité opérationnelle, et
pas uniquement une métrique de taille d’installation. Chaque paquet élargit
l’ensemble des responsables de maintenance, archives tar, mises à jour
transitives, binaires natifs facultatifs et comportements à l’installation
auxquels les opérateurs doivent faire confiance.

L’orientation du nettoyage est la suivante :

- maintenir les fonctionnalités lourdes et facultatives hors de l’installation
  par défaut du cœur
- faire en sorte que les paquets de plugins possèdent leur propre graphe de
  dépendances d’exécution
- éviter la réparation par le gestionnaire de paquets à l’exécution pendant le
  démarrage du Gateway
- préserver la reproductibilité des installations sans provoquer la
  matérialisation de paquets natifs pour toutes les plateformes
- maintenir les scripts d’installation désactivés dans les parcours
  d’acceptation et de mesure des paquets
- détecter les arborescences de dépendances imbriquées et les multiplications de
  dépendances natives facultatives avant la publication

Documentation associée :

- [Résolution des dépendances des plugins](/fr/plugins/dependency-resolution)
- [Inventaire des plugins](/fr/plugins/plugin-inventory)
- [Validation complète de la version](/fr/reference/full-release-validation)
