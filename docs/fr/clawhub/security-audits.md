---
read_when:
    - Comprendre les résultats de l’audit de sécurité de ClawHub
    - Décider s’il faut installer une Skill ou un Plugin
    - Explication de l’état de l’audit ClawHub, du niveau de risque ou des constatations
sidebarTitle: Security Audits
summary: Comment comprendre les résultats de l’audit de sécurité de ClawHub avant d’installer une Skill ou un Plugin.
title: Audits de sécurité
x-i18n:
    generated_at: "2026-07-12T02:28:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
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

Les audits constituent des indicateurs de sécurité solides, mais ne garantissent pas qu’une version est
sans risque. Faites toujours preuve de discernement avant d’accorder un accès sensible.

Voir aussi [Sécurité](/clawhub/security), [Utilisation acceptable](/clawhub/acceptable-usage)
et [Modération et sécurité des comptes](/clawhub/moderation).

## Éléments à vérifier avant l’installation

Avant l’installation, examinez :

- l’état général de l’audit
- le niveau de risque
- tous les constats répertoriés
- les identifiants, autorisations ou variables d’environnement requis
- le propriétaire, la source, la version, le journal des modifications, les téléchargements, les étoiles et les autres indicateurs de confiance

N’installez que du contenu que vous comprenez et auquel vous faites confiance.

## État de l’audit

L’état de l’audit vous indique comment réagir à son résultat :

| État        | Signification                                                                      |
| ----------- | ---------------------------------------------------------------------------------- |
| `Pass`      | Aucun problème visible supérieur à un risque faible n’a été détecté.               |
| `Review`    | Lisez les constats avant l’installation. La version peut néanmoins être légitime.  |
| `Warn`      | Redoublez de prudence. ClawHub a détecté un problème à fort impact ou un signal d’avertissement. |
| `Malicious` | Ne l’installez pas.                                                                |
| `Pending`   | Les audits ne sont pas encore terminés.                                            |
| `Error`     | L’audit n’a pas pu être mené à terme.                                              |

Un état `Pass` est rassurant, mais ne remplace pas votre propre discernement. Cela est
particulièrement important pour les outils qui peuvent publier du contenu, modifier des données, exécuter des commandes, lire des fichiers ou
accéder à des systèmes de production.

## Niveau de risque

Le niveau de risque décrit l’étendue des conséquences potentielles : le degré de pouvoir que la version semble détenir si
vous l’utilisez comme prévu.

| Niveau de risque | Signification                                                                        |
| ---------------- | ------------------------------------------------------------------------------------ |
| `Low`            | Peu d’autorisations sensibles ou d’incidences sur l’utilisateur ont été détectées.   |
| `Medium`         | La version dispose d’autorisations significatives, comme l’accès à un compte ou la modification de données. |
| `High`           | La version dispose d’autorisations à fort impact, présente des constats graves ou des signaux malveillants. |

Le niveau de risque et l’état de l’audit répondent à des questions différentes :

- Le niveau de risque demande : « Quel est le degré de pouvoir présent ? »
- L’état de l’audit demande : « Que dois-je faire de ce résultat ? »

Par exemple, une skill de publication peut afficher `Review` avec un risque `Medium`. Cela ne
signifie pas qu’elle est malveillante. Cela signifie que la skill semble conforme à son objectif, mais qu’elle peut
agir avec des autorisations significatives sur un compte.

## Constats

Les constats expliquent pourquoi un résultat d’audit donné a été affiché. Chaque constat comprend généralement :

- ce qu’il signifie
- pourquoi il a été signalé
- le contenu pertinent de la skill ou du plugin
- une recommandation

Les constats peuvent porter les libellés `Info`, `Low`, `Medium`, `High` ou `Critical`. Les constats de sévérité
élevée contribuent davantage au niveau de risque et à l’état de l’audit.

Les constats à faible niveau de confiance sont masqués dans la synthèse publique de l’audit afin que la page
reste centrée sur les éléments probants utiles.

## Éléments vérifiés par ClawHub

ClawHub audite les artefacts de version soumis, notamment :

- les instructions de la skill ou les métadonnées du plugin
- les variables d’environnement et les autorisations déclarées
- les instructions d’installation et les métadonnées des paquets
- les fichiers inclus et les manifestes de fichiers
- les métadonnées de compatibilité et de capacité

La question principale est celle de la cohérence : le nom, le résumé, les métadonnées, les autorisations
demandées et le contenu réel correspondent-ils à ce que les utilisateurs peuvent raisonnablement attendre ?

Un comportement puissant n’est pas automatiquement mauvais. De nombreux outils utiles nécessitent des identifiants,
des commandes locales, des API de fournisseurs ou l’installation de paquets. L’audit vérifie si ce
pouvoir est attendu, déclaré et proportionné.

Les pages des artefacts renvoient vers l’audit complet à l’adresse :

```text
/<owner>/skills/<slug>/security-audit
```

La page d’audit combine :

1. SkillSpector
2. VirusTotal
3. Analyse des risques

## VirusTotal

ClawHub utilise VirusTotal comme source de télémétrie sur les logiciels malveillants dans la pile d’audit. VirusTotal est une
norme de confiance du secteur pour la réputation des fichiers et l’analyse des logiciels malveillants, et notre
partenariat permet à ClawHub d’ajouter des renseignements de sécurité plus étendus à l’examen des skills et des plugins.

VirusTotal est particulièrement utile pour les artefacts malveillants connus, les détections par les moteurs et
les signaux de réputation qui complètent l’examen de ClawHub tenant compte des agents. Lorsque le nombre de moteurs
de fournisseurs est disponible, l’audit le résume en langage clair, par exemple :

```text
62/62 vendors flagged this skill as clean.
```

ou :

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

Lorsque ClawHub ne dispose d’aucune télémétrie sur le nombre de fournisseurs à résumer, l’audit indique :

```text
No VirusTotal findings
```

VirusTotal reste une source de télémétrie. Il ne remplace pas l’analyse des risques de ClawHub
tenant compte des artefacts.

## Analyse des risques

L’analyse des risques est assurée en interne par ClawScan, le système d’audit de sécurité
propre à ClawHub. Il examine chaque version comme un artefact destiné à un agent : instructions,
métadonnées, autorisations déclarées, fichiers, signaux de capacité, signaux d’analyse statique,
constats de SkillSpector, télémétrie de VirusTotal et contexte fourni par l’éditeur.
Les signaux d’analyse statique constituent un contexte interne pour cet examen ; ils ne sont ni une
section publique autonome de l’audit ni un verdict bloquant l’installation.

L’analyse des risques utilise le
[Top 10 OWASP des skills agentiques](https://owasp.org/www-project-agentic-skills-top-10/)
comme grille de lecture pour les risques tels que l’injection de prompts, l’utilisation abusive d’outils, l’exposition d’identifiants,
l’exécution non sécurisée, l’empoisonnement de la mémoire ou du contexte et l’autonomie excessive.

ClawScan ne considère pas automatiquement comme malveillante une capacité qui semble inquiétante.
Il vérifie si la capacité est déclarée, conforme à l’objectif et justifiée par
le cas d’usage annoncé de la version.
