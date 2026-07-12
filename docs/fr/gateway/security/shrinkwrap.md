---
read_when:
    - Vous souhaitez savoir ce que signifie le shrinkwrap npm dans une version d’OpenClaw
    - Vous examinez les fichiers de verrouillage des paquets, les modifications des dépendances ou les risques liés à la chaîne d’approvisionnement
    - Vous validez les paquets npm racine ou de Plugin avant leur publication
summary: Explication en langage clair et technique du fichier shrinkwrap npm dans les versions d’OpenClaw
title: verrouillage des dépendances npm
x-i18n:
    generated_at: "2026-07-12T15:28:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d1e6c0d4541da9220d50cde0b9db064e5a91b81d6562cb16ac697de7d4017098
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

Les extractions du code source d’OpenClaw utilisent `pnpm-lock.yaml`. Les paquets npm OpenClaw publiés utilisent `npm-shrinkwrap.json`, le fichier de verrouillage des dépendances publiable de npm, afin que les installations de paquets utilisent le graphe de dépendances examiné lors de la publication.

## Pourquoi est-ce important ?

Le shrinkwrap est un justificatif de l’arborescence des dépendances livrée avec un paquet npm : il indique à npm les versions transitives exactes à installer.

| Fichier               | Contexte d’utilisation                 | Signification                                  |
| --------------------- | -------------------------------------- | ---------------------------------------------- |
| `pnpm-lock.yaml`      | Extraction du code source d’OpenClaw   | Graphe de dépendances des responsables         |
| `npm-shrinkwrap.json` | Paquet npm publié                      | Graphe d’installation npm pour les utilisateurs |
| `package-lock.json`   | Applications npm locales               | Ne constitue pas le contrat de publication d’OpenClaw |

Pour les versions d’OpenClaw, cela signifie que :

- le paquet publié ne demande pas à npm de créer un nouveau graphe de dépendances au moment de l’installation ;
- les modifications de dépendances peuvent être examinées, car elles apparaissent dans le diff d’un fichier de verrouillage ;
- la validation de la version teste le même graphe que celui installé par les utilisateurs ;
- les surprises liées à la taille du paquet ou aux dépendances natives apparaissent avant la publication.

Le shrinkwrap n’est pas un bac à sable. Il ne sécurise pas une dépendance à lui seul et ne remplace ni l’isolation de l’hôte, ni `openclaw security audit`, ni la provenance des paquets, ni les tests élémentaires d’installation.

OpenClaw est un Gateway, un hôte de plugins, un routeur de modèles et un environnement d’exécution d’agents. Une installation par défaut influe donc sur le temps de démarrage, l’utilisation du disque, le téléchargement de paquets natifs et l’exposition aux risques de la chaîne d’approvisionnement. Le shrinkwrap fournit une limite stable à l’examen des versions : les examinateurs voient l’évolution des dépendances transitives, les validateurs rejettent toute dérive inattendue du fichier de verrouillage et les paquets de plugins transportent leur propre graphe de dépendances verrouillé au lieu de dépendre du paquet racine.

## Génération et vérification

Le paquet npm racine `openclaw`, les paquets npm de plugins appartenant à OpenClaw (par exemple `@openclaw/discord`) et les paquets d’espace de travail publiables tels que [`@openclaw/ai`](/fr/reference/openclaw-ai) incluent `npm-shrinkwrap.json` lors de leur publication. Les dépendances d’espace de travail sont omises du shrinkwrap racine, car elles sont publiées avec le paquet racine ; chaque paquet d’espace de travail publiable verrouille plutôt sa propre arborescence transitive. Les paquets de plugins appropriés peuvent également être publiés avec des `bundledDependencies` explicites, en intégrant les fichiers de leurs dépendances d’exécution dans l’archive tar du plugin au lieu de dépendre uniquement de la résolution au moment de l’installation.

```bash
# Tous les paquets gérés par shrinkwrap (racine + plugins publiables)
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check

# Paquet racine uniquement
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check

# Uniquement les paquets concernés par l’ensemble de modifications actuel
pnpm deps:shrinkwrap:changed:generate
pnpm deps:shrinkwrap:changed:check
```

Le générateur produit le format de verrouillage publiable de npm, mais rejette les versions de paquets générées qui ne figurent pas déjà dans `pnpm-lock.yaml`. Cela préserve les limites d’examen relatives à l’ancienneté des dépendances pnpm, aux substitutions et aux correctifs.

Considérez les éléments suivants comme sensibles en matière de sécurité lors de leur examen :

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- les contenus de dépendances intégrés aux plugins
- tout diff de `package-lock.json`

Les validateurs des paquets OpenClaw exigent un shrinkwrap dans les nouvelles archives tar du paquet racine et rejettent `package-lock.json` pour les paquets publiés. Le processus de publication npm des plugins vérifie le shrinkwrap local au plugin, installe les dépendances intégrées locales au paquet, puis empaquette ou publie celui-ci.

## Inspection d’un paquet publié

Paquet racine :

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

Paquet de plugin :

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

Informations générales : [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
