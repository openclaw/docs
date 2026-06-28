---
read_when:
    - Comprendre les résultats de l’audit de sécurité ClawHub
    - Décider d’installer ou non une skill ou un plugin
    - Explication de l’état d’audit ClawHub, du niveau de risque ou des constats
sidebarTitle: Security Audits
summary: Comment comprendre les résultats d’audit de sécurité ClawHub avant d’installer une Skill ou un Plugin.
title: Audits de sécurité
x-i18n:
    generated_at: "2026-06-28T05:07:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Audits de sécurité

Les audits de sécurité ClawHub vous aident à décider si un skill ou un plugin est suffisamment sûr à installer. Ils indiquent ce qu’une version fait, les autorisations qu’elle demande et si certains points méritent une attention particulière avant qu’elle puisse accéder à des fichiers, des comptes, des identifiants, du code ou des services externes.

Les audits sont de forts signaux de sécurité, mais ils ne garantissent pas qu’une version est sans risque. Faites toujours preuve de discernement avant d’accorder un accès sensible.

Voir aussi [Sécurité](/fr/clawhub/security), [Utilisation acceptable](/fr/clawhub/acceptable-usage) et [Modération et sécurité du compte](/fr/clawhub/moderation).

## Points à vérifier avant l’installation

Avant d’installer, examinez :

- le statut global de l’audit
- le niveau de risque
- tous les constats listés
- les identifiants, autorisations ou variables d’environnement requis
- le propriétaire, la source, la version, le changelog, les téléchargements, les étoiles et les autres signaux de confiance

N’installez que du contenu que vous comprenez et auquel vous faites confiance.

## Statut de l’audit

Le statut de l’audit vous indique comment réagir au résultat de l’audit :

| Statut      | Signification                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Aucun problème visible au-dessus d’un risque faible n’a été trouvé.                                |
| `Review`    | Lisez les constats avant d’installer. La version peut malgré tout être légitime. |
| `Warn`      | Faites preuve d’une prudence accrue. ClawHub a trouvé un point préoccupant à fort impact ou un signal d’avertissement. |
| `Malicious` | N’installez pas.                                                           |
| `Pending`   | Les audits ne sont pas encore terminés.                                             |
| `Error`     | L’audit n’a pas pu être terminé.                                         |

Un `Pass` est rassurant, mais il ne remplace pas votre propre jugement. C’est particulièrement important pour les outils qui peuvent publier du contenu, modifier des données, exécuter des commandes, lire des fichiers ou accéder à des systèmes de production.

## Niveau de risque

Le niveau de risque décrit le rayon d’impact : le degré de pouvoir que la version semble avoir si vous l’utilisez comme prévu.

| Niveau de risque | Signification                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | Peu d’autorisations sensibles ou d’impact utilisateur ont été trouvés.                          |
| `Medium`   | La version dispose d’autorisations significatives, comme l’accès à un compte ou des modifications de données. |
| `High`     | La version dispose d’autorisations à fort impact, présente des constats graves ou des signaux malveillants. |

Le niveau de risque et le statut de l’audit répondent à des questions différentes :

- Le niveau de risque demande : « Quelle est l’étendue du pouvoir ici ? »
- Le statut de l’audit demande : « Que dois-je faire de ce résultat ? »

Par exemple, un skill de publication peut afficher `Review` avec un risque `Medium`. Cela ne signifie pas qu’il est malveillant. Cela signifie que le skill semble aligné sur son objectif, mais qu’il peut agir avec des autorisations de compte significatives.

## Constats

Les constats expliquent pourquoi un résultat d’audit a été affiché. Chaque constat inclut généralement :

- ce qu’il signifie
- pourquoi il a été signalé
- le contenu pertinent du skill ou du plugin
- une recommandation

Les constats peuvent être étiquetés `Info`, `Low`, `Medium`, `High` ou `Critical`. Les constats de gravité plus élevée contribuent plus fortement au niveau de risque et au statut de l’audit.

Les constats à faible confiance sont masqués du récapitulatif public de l’audit afin que la page reste centrée sur des éléments utiles.

## Ce que ClawHub vérifie

ClawHub audite les artefacts de version soumis, notamment :

- les instructions du skill ou les métadonnées du plugin
- les variables d’environnement et autorisations déclarées
- les instructions d’installation et les métadonnées du paquet
- les fichiers inclus et les manifestes de fichiers
- les métadonnées de compatibilité et de capacités

La question principale est la cohérence : le nom, le résumé, les métadonnées, les autorisations demandées et le contenu réel correspondent-ils à ce que les utilisateurs peuvent raisonnablement attendre ?

Un comportement puissant n’est pas automatiquement mauvais. De nombreux outils utiles ont besoin d’identifiants, de commandes locales, d’API de fournisseurs ou d’installations de paquets. L’audit vérifie si ce pouvoir est attendu, divulgué et proportionné.

Les pages d’artefact renvoient vers l’audit complet à l’adresse :

```text
/<owner>/skills/<slug>/security-audit
```

La page d’audit combine :

1. SkillSpector
2. VirusTotal
3. Analyse des risques

## VirusTotal

ClawHub utilise VirusTotal comme télémétrie de logiciels malveillants dans la pile d’audit. VirusTotal est une norme de confiance du secteur pour la réputation des fichiers et l’analyse des logiciels malveillants, et notre partenariat permet à ClawHub d’ajouter une veille de sécurité plus large à l’examen des skills et des plugins.

VirusTotal est particulièrement utile pour les artefacts malveillants connus, les détections par moteurs et les signaux de réputation qui complètent l’examen de ClawHub tenant compte des agents. Lorsque les décomptes des moteurs de fournisseurs sont disponibles, l’audit les résume en langage clair, par exemple :

```text
62/62 vendors flagged this skill as clean.
```

ou :

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

Lorsque ClawHub ne dispose d’aucune télémétrie de décompte de fournisseurs à résumer, l’audit indique :

```text
No VirusTotal findings
```

VirusTotal reste une télémétrie. Il ne remplace pas l’analyse des risques propre à ClawHub, tenant compte des artefacts.

## Analyse des risques

L’analyse des risques est alimentée en interne par ClawScan, le système d’audit de sécurité propre à ClawHub. Il examine chaque version comme un artefact destiné aux agents : instructions, métadonnées, autorisations déclarées, fichiers, signaux de capacités, signaux d’analyse statique, constats SkillSpector, télémétrie VirusTotal et contexte fourni par l’éditeur. Les signaux d’analyse statique sont un contexte interne pour cet examen ; ils ne constituent pas une section d’audit publique autonome ni un verdict bloquant l’installation.

L’analyse des risques utilise le
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
comme prisme pour les risques tels que l’injection de prompt, l’utilisation abusive d’outils, l’exposition d’identifiants, l’exécution non sécurisée, l’empoisonnement de mémoire ou de contexte et l’autonomie excessive.

ClawScan ne considère pas une capacité à l’apparence inquiétante comme automatiquement malveillante. Il vérifie si la capacité est divulguée, alignée sur l’objectif et étayée par le cas d’usage déclaré de la version.
