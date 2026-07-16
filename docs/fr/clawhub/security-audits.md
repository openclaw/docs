---
read_when:
    - Comprendre les résultats de l’audit de sécurité de ClawHub
    - Décider s’il faut installer une Skill ou un Plugin
    - Explication de l’état de l’audit de ClawHub, du niveau de risque ou des constatations
sidebarTitle: Security Audits
summary: Comment comprendre les résultats de l’audit de sécurité de ClawHub avant d’installer une skill ou un plugin.
title: Audits de sécurité
x-i18n:
    generated_at: "2026-07-16T13:05:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Audits de sécurité

Les audits de sécurité de ClawHub vous aident à déterminer si une skill ou un plugin est suffisamment sûr
pour être installé. Ils indiquent ce que fait une version, les autorisations qu’elle demande et
si certains éléments méritent une attention particulière avant qu’elle puisse accéder à des fichiers, des comptes,
des identifiants, du code ou des services externes.

Les audits constituent de solides indicateurs de sécurité, mais ils ne garantissent pas qu’une version soit
sans risque. Faites toujours preuve de discernement avant d’accorder un accès sensible.

Voir aussi [Sécurité](/clawhub/security), [Utilisation acceptable](/fr/clawhub/acceptable-usage)
et [Modération et sécurité des comptes](/clawhub/moderation).

## Points à vérifier avant l’installation

Avant l’installation, examinez :

- le statut général de l’audit
- le niveau de risque
- tous les constats répertoriés
- les identifiants, autorisations ou variables d’environnement requis
- le propriétaire, la source, la version, le journal des modifications, les téléchargements, les étoiles et les autres indicateurs de confiance

Installez uniquement du contenu que vous comprenez et auquel vous faites confiance.

## Statut de l’audit

Le statut de l’audit indique comment réagir au résultat de l’audit :

| Statut      | Signification                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Aucun problème visible supérieur à un risque faible n’a été détecté.                                |
| `Review`    | Lisez les constats avant l’installation. La version peut néanmoins être légitime. |
| `Warn`      | Redoublez de prudence. ClawHub a détecté un problème à fort impact ou un signal d’avertissement. |
| `Malicious` | Ne procédez pas à l’installation.                                                           |
| `Pending`   | Les audits ne sont pas encore terminés.                                             |
| `Error`     | L’audit n’a pas pu être achevé.                                         |

Un statut `Pass` est rassurant, mais il ne remplace pas votre propre discernement. Cela est
particulièrement important pour les outils capables de publier du contenu, de modifier des données, d’exécuter des commandes, de lire des fichiers ou
d’accéder à des systèmes de production.

## Niveau de risque

Le niveau de risque décrit l’étendue des conséquences potentielles : le degré de pouvoir que la version semble posséder si
vous l’utilisez comme prévu.

| Niveau de risque | Signification                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | Peu d’autorisations sensibles ou d’incidences sur les utilisateurs ont été détectées.                          |
| `Medium`   | La version dispose d’autorisations significatives, telles que l’accès à un compte ou la modification de données. |
| `High`     | La version dispose d’autorisations à fort impact, présente des constats graves ou des signaux malveillants. |

Le niveau de risque et le statut de l’audit répondent à des questions différentes :

- Le niveau de risque pose la question : « Quelle est l’étendue du pouvoir disponible ? »
- Le statut de l’audit pose la question : « Que dois-je faire de ce résultat ? »

Par exemple, une skill de publication peut afficher `Review` avec un risque `Medium`. Cela ne
signifie pas qu’elle est malveillante. Cela signifie que la skill semble conforme à son objectif, mais qu’elle peut
agir avec des autorisations significatives sur le compte.

## Constats

Les constats expliquent pourquoi un résultat d’audit a été affiché. Chaque constat comprend généralement :

- ce qu’il signifie
- la raison pour laquelle il a été signalé
- le contenu concerné de la skill ou du plugin
- une recommandation

Les constats peuvent porter les libellés `Info`, `Low`, `Medium`, `High` ou `Critical`. Les constats de
gravité supérieure contribuent davantage au niveau de risque et au statut de l’audit.

Les constats à faible niveau de confiance sont masqués dans la synthèse publique de l’audit afin que la page
reste centrée sur des éléments probants utiles.

## Éléments vérifiés par ClawHub

ClawHub audite les artefacts des versions soumises, notamment :

- les instructions de la skill ou les métadonnées du plugin
- les variables d’environnement et autorisations déclarées
- les instructions d’installation et les métadonnées du paquet
- les fichiers inclus et les manifestes de fichiers
- les métadonnées de compatibilité et de capacités

La question principale est celle de la cohérence : le nom, le résumé, les métadonnées, les autorisations demandées
et le contenu réel correspondent-ils à ce que les utilisateurs peuvent raisonnablement attendre ?

Un comportement puissant n’est pas automatiquement mauvais. De nombreux outils utiles ont besoin d’identifiants,
de commandes locales, d’API de fournisseurs ou d’installations de paquets. L’audit vérifie si ce
pouvoir est attendu, déclaré et proportionné.

Les pages des artefacts renvoient vers l’audit complet à l’adresse suivante :

```text
/<owner>/skills/<slug>/security-audit
```

La page d’audit combine :

1. SkillSpector
2. VirusTotal
3. Analyse des risques

## VirusTotal

ClawHub utilise VirusTotal comme source de télémétrie sur les logiciels malveillants dans sa pile d’audit. VirusTotal est une
norme sectorielle reconnue pour la réputation des fichiers et l’analyse des logiciels malveillants, et notre
partenariat permet à ClawHub d’ajouter des renseignements de sécurité plus étendus à l’examen des skills et des plugins.

VirusTotal est particulièrement utile pour détecter les artefacts malveillants connus, les détections par les moteurs et
les signaux de réputation qui complètent l’examen de ClawHub tenant compte des agents. Lorsque le nombre de détections des
moteurs des fournisseurs est disponible, l’audit le résume en langage clair, par exemple :

```text
62/62 fournisseurs ont signalé cette skill comme saine.
```

ou :

```text
2/64 fournisseurs ont signalé cette skill comme malveillante, 1/64 l’a signalée comme suspecte et 61/64 l’ont signalée comme saine.
```

Lorsque ClawHub ne dispose d’aucune télémétrie sur le nombre de fournisseurs à résumer, l’audit indique :

```text
Aucun constat VirusTotal
```

VirusTotal reste une source de télémétrie. Il ne remplace pas l’analyse des risques de ClawHub
tenant compte des artefacts.

## Analyse des risques

L’analyse des risques repose en interne sur ClawScan, le système d’audit de sécurité
propre à ClawHub. Il examine chaque version en tant qu’artefact destiné à un agent : instructions,
métadonnées, autorisations déclarées, fichiers, signaux de capacités, signaux d’analyse statique,
constats de SkillSpector, télémétrie de VirusTotal et contexte fourni par l’éditeur.
Les signaux d’analyse statique constituent un contexte interne pour cet examen ; ils ne forment pas une
section publique autonome de l’audit ni un verdict bloquant l’installation.

L’analyse des risques utilise le
[Top 10 des skills agentiques de l’OWASP](https://owasp.org/www-project-agentic-skills-top-10/)
comme grille de lecture pour des risques tels que l’injection de prompt, l’utilisation abusive des outils, l’exposition des identifiants,
l’exécution non sécurisée, l’empoisonnement de la mémoire ou du contexte et l’autonomie excessive.

ClawScan ne considère pas automatiquement comme malveillante une capacité qui semble inquiétante.
Il détermine si la capacité est déclarée, conforme à son objectif et étayée par
le cas d’usage annoncé de la version.
