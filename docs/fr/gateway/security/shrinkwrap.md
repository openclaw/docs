---
read_when:
    - Vous voulez savoir ce que signifie le fichier shrinkwrap npm dans une version d’OpenClaw
    - Vous examinez les fichiers de verrouillage des paquets, les modifications de dépendances ou les risques liés à la chaîne d’approvisionnement
    - Vous validez les paquets npm racine ou de Plugin avant leur publication
summary: Explication en langage clair et technique du fichier shrinkwrap npm dans les versions d’OpenClaw
title: verrouillage des dépendances npm
x-i18n:
    generated_at: "2026-07-12T02:40:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1e6c0d4541da9220d50cde0b9db064e5a91b81d6562cb16ac697de7d4017098
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

Les extractions du code source d’OpenClaw utilisent `pnpm-lock.yaml`. Les paquets npm OpenClaw publiés utilisent `npm-shrinkwrap.json`, le fichier de verrouillage des dépendances publiable de npm, afin que leur installation repose sur le graphe de dépendances examiné lors de la publication.

## Pourquoi est-ce important ?

Le fichier shrinkwrap constitue un relevé de l’arbre des dépendances livré avec un paquet npm : il indique à npm les versions transitives exactes à installer.

| Fichier               | Contexte d’utilisation                | Signification                              |
| --------------------- | ------------------------------------- | ------------------------------------------ |
| `pnpm-lock.yaml`      | Extraction du code source d’OpenClaw | Graphe de dépendances des mainteneurs      |
| `npm-shrinkwrap.json` | Paquet npm publié                     | Graphe d’installation npm pour les utilisateurs |
| `package-lock.json`   | Applications npm locales              | Ne constitue pas le contrat de publication d’OpenClaw |

Pour les versions publiées d’OpenClaw, cela signifie que :

- le paquet publié ne demande pas à npm de créer un nouveau graphe de dépendances au moment de l’installation ;
- les modifications des dépendances peuvent être examinées, car elles apparaissent dans le diff d’un fichier de verrouillage ;
- la validation de la publication teste le même graphe que celui que les utilisateurs installeront ;
- les surprises liées à la taille du paquet ou aux dépendances natives apparaissent avant la publication.

Le fichier shrinkwrap n’est pas un bac à sable. Il ne sécurise pas une dépendance à lui seul et ne remplace ni l’isolation de l’hôte, ni `openclaw security audit`, ni la provenance des paquets, ni les tests de vérification rapide de l’installation.

OpenClaw est un Gateway, un hôte de Plugins, un routeur de modèles et un environnement d’exécution d’agents ; une installation par défaut influe donc sur le temps de démarrage, l’espace disque utilisé, les téléchargements de paquets natifs et l’exposition aux risques de la chaîne d’approvisionnement. Le fichier shrinkwrap fournit une limite stable à l’examen d’une publication : les réviseurs voient les changements apportés aux dépendances transitives, les outils de validation rejettent toute dérive inattendue du fichier de verrouillage et les paquets de Plugins disposent de leur propre graphe de dépendances verrouillé au lieu de dépendre du paquet racine.

## Génération et vérification

Le paquet npm racine `openclaw`, les paquets npm de Plugins appartenant à OpenClaw (par exemple `@openclaw/discord`) et les paquets publiables de l’espace de travail tels que [`@openclaw/ai`](/reference/openclaw-ai) incluent `npm-shrinkwrap.json` lors de leur publication. Les dépendances de l’espace de travail sont omises du fichier shrinkwrap racine, car elles sont publiées en même temps que le paquet racine ; chaque paquet publiable de l’espace de travail verrouille plutôt son propre arbre transitif. Les paquets de Plugins appropriés peuvent également être publiés avec des `bundledDependencies` explicites, qui incluent leurs fichiers de dépendances d’exécution dans l’archive tar du Plugin au lieu de dépendre uniquement de la résolution effectuée au moment de l’installation.

```bash
# Tous les paquets gérés par shrinkwrap (racine + Plugins publiables)
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check

# Paquet racine uniquement
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check

# Uniquement les paquets affectés par l’ensemble de modifications actuel
pnpm deps:shrinkwrap:changed:generate
pnpm deps:shrinkwrap:changed:check
```

Le générateur résout le format de verrouillage publiable de npm, mais rejette les versions de paquets générées qui ne figurent pas déjà dans `pnpm-lock.yaml`. Cela préserve la limite d’examen établie par pnpm pour l’ancienneté des dépendances, les substitutions et les correctifs.

Considérez les éléments suivants comme sensibles du point de vue de la sécurité lors de leur examen :

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- les contenus de dépendances groupés des Plugins
- tout diff de `package-lock.json`

Les outils de validation des paquets OpenClaw exigent un fichier shrinkwrap dans les nouvelles archives tar du paquet racine et rejettent `package-lock.json` pour les paquets publiés. Le processus de publication npm des Plugins vérifie le fichier shrinkwrap local au Plugin, installe les dépendances groupées propres au paquet, puis crée le paquet ou le publie.

## Inspection d’un paquet publié

Paquet racine :

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

Paquet de Plugin :

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

Informations complémentaires : [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
