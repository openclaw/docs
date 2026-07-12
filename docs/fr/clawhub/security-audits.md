---
read_when:
    - Comprendre les résultats de l’audit de sécurité de ClawHub
    - Décider s’il faut installer une Skill ou un Plugin
    - Explication de l’état de l’audit de ClawHub, du niveau de risque ou des constatations
sidebarTitle: Security Audits
summary: Comment comprendre les résultats de l’audit de sécurité de ClawHub avant d’installer une Skill ou un Plugin.
title: Audits de sécurité
x-i18n:
    generated_at: "2026-07-12T15:07:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Audits de sécurité

Les audits de sécurité de ClawHub vous aident à déterminer si une skill ou un plugin est suffisamment sûr
pour être installé. Ils indiquent ce que fait une version, les autorisations qu’elle demande et
si certains éléments nécessitent une attention particulière avant qu’elle puisse accéder à des fichiers, des comptes,
des identifiants, du code ou des services externes.

Les audits constituent de solides indicateurs de sécurité, mais ne garantissent pas qu’une version est
sans risque. Faites toujours preuve de discernement avant d’accorder un accès sensible.

Voir également [Sécurité](/clawhub/security), [Utilisation acceptable](/fr/clawhub/acceptable-usage)
et [Modération et sécurité des comptes](/clawhub/moderation).

## Éléments à vérifier avant l’installation

Avant l’installation, examinez :

- l’état global de l’audit
- le niveau de risque
- tous les constats répertoriés
- les identifiants, autorisations ou variables d’environnement requis
- le propriétaire, la source, la version, le journal des modifications, les téléchargements, les étoiles et les autres indicateurs de confiance

Installez uniquement du contenu que vous comprenez et auquel vous faites confiance.

## État de l’audit

L’état de l’audit vous indique comment réagir à son résultat :

| État        | Signification                                                                    |
| ----------- | ------------------------------------------------------------------------------- |
| `Pass`      | Aucun problème visible dépassant un risque faible n’a été détecté.              |
| `Review`    | Lisez les constats avant l’installation. La version peut néanmoins être légitime. |
| `Warn`      | Faites preuve d’une prudence accrue. ClawHub a détecté un problème à fort impact ou un signal d’avertissement. |
| `Malicious` | Ne l’installez pas.                                                             |
| `Pending`   | Les audits ne sont pas encore terminés.                                         |
| `Error`     | L’audit n’a pas pu être mené à bien.                                            |

Un état `Pass` est rassurant, mais ne remplace pas votre propre jugement. Cela est
particulièrement important pour les outils capables de publier du contenu, de modifier des données, d’exécuter des commandes, de lire des fichiers ou
d’accéder à des systèmes de production.

## Niveau de risque

Le niveau de risque décrit le rayon d’impact : l’étendue des pouvoirs que la version semble posséder si
vous l’utilisez comme prévu.

| Niveau de risque | Signification                                                                      |
| ---------------- | ---------------------------------------------------------------------------------- |
| `Low`            | Peu d’autorisations sensibles ou d’impact sur l’utilisateur ont été détectés.      |
| `Medium`         | La version dispose d’autorisations significatives, telles que l’accès à un compte ou la modification de données. |
| `High`           | La version dispose d’autorisations à fort impact, présente des constats graves ou des signaux malveillants. |

Le niveau de risque et l’état de l’audit répondent à des questions différentes :

- Le niveau de risque demande : « Quelle est l’étendue des pouvoirs présents ? »
- L’état de l’audit demande : « Que dois-je faire de ce résultat ? »

Par exemple, une skill de publication peut afficher `Review` avec un risque `Medium`. Cela ne
signifie pas qu’elle est malveillante. Cela signifie que la skill semble conforme à son objectif, mais qu’elle peut
agir avec des autorisations significatives sur le compte.

## Constats

Les constats expliquent pourquoi un résultat d’audit a été affiché. Chaque constat comprend généralement :

- sa signification
- la raison de son signalement
- le contenu pertinent de la skill ou du plugin
- une recommandation

Les constats peuvent porter les étiquettes `Info`, `Low`, `Medium`, `High` ou `Critical`. Les constats de
gravité supérieure contribuent davantage au niveau de risque et à l’état de l’audit.

Les constats à faible niveau de confiance sont masqués dans la synthèse publique de l’audit afin que la page
reste centrée sur les éléments probants utiles.

## Ce que ClawHub vérifie

ClawHub audite les artefacts de version soumis, notamment :

- les instructions de la skill ou les métadonnées du plugin
- les variables d’environnement et autorisations déclarées
- les instructions d’installation et les métadonnées du paquet
- les fichiers inclus et les manifestes de fichiers
- les métadonnées de compatibilité et de capacités

La principale question est celle de la cohérence : le nom, le résumé, les métadonnées, les
autorisations demandées et le contenu réel correspondent-ils à ce que les utilisateurs pourraient raisonnablement attendre ?

Un comportement puissant n’est pas automatiquement mauvais. De nombreux outils utiles nécessitent des identifiants,
des commandes locales, des API de fournisseurs ou l’installation de paquets. L’audit vérifie si ces
pouvoirs sont attendus, déclarés et proportionnés.

Les pages des artefacts renvoient vers l’audit complet à l’adresse :

```text
/<owner>/skills/<slug>/security-audit
```

La page d’audit regroupe :

1. SkillSpector
2. VirusTotal
3. Analyse des risques

## VirusTotal

ClawHub utilise VirusTotal comme source de télémétrie sur les logiciels malveillants dans la chaîne d’audit. VirusTotal est une
norme reconnue du secteur pour la réputation des fichiers et l’analyse des logiciels malveillants, et notre
partenariat permet à ClawHub d’ajouter des renseignements de sécurité plus étendus à l’examen des skills et des plugins.

VirusTotal est particulièrement utile pour détecter les artefacts malveillants connus, les détections des moteurs et
les signaux de réputation qui complètent l’examen de ClawHub tenant compte des agents. Lorsque le
nombre de moteurs de fournisseurs est disponible, l’audit le résume en langage clair, par exemple :

```text
62 fournisseurs sur 62 ont signalé cette skill comme saine.
```

ou :

```text
2 fournisseurs sur 64 ont signalé cette skill comme malveillante, 1 sur 64 comme suspecte et 61 sur 64 comme saine.
```

Lorsque ClawHub ne dispose d’aucune télémétrie sur le nombre de fournisseurs à résumer, l’audit indique :

```text
Aucun constat VirusTotal
```

VirusTotal reste une source de télémétrie. Il ne remplace pas l’analyse des risques de ClawHub
tenant compte des artefacts.

## Analyse des risques

L’analyse des risques repose en interne sur ClawScan, le système d’audit de sécurité
propre à ClawHub. Il examine chaque version comme un artefact destiné aux agents : instructions,
métadonnées, autorisations déclarées, fichiers, signaux de capacités, signaux d’analyse statique,
constats de SkillSpector, télémétrie de VirusTotal et contexte fourni par l’éditeur.
Les signaux d’analyse statique constituent un contexte interne pour cet examen ; ils ne forment ni une
section publique autonome de l’audit ni un verdict bloquant l’installation.

L’analyse des risques utilise le
[Top 10 des skills agentiques de l’OWASP](https://owasp.org/www-project-agentic-skills-top-10/)
comme grille de lecture pour des risques tels que l’injection de prompt, l’utilisation abusive d’outils, l’exposition d’identifiants,
l’exécution non sécurisée, l’empoisonnement de la mémoire ou du contexte et l’autonomie excessive.

ClawScan ne considère pas automatiquement comme malveillante une capacité qui semble inquiétante.
Il détermine si la capacité est déclarée, conforme à l’objectif et justifiée par
le cas d’usage annoncé de la version.
