---
read_when:
    - Comprendre les résultats de l’audit de sécurité ClawHub
    - Décider s’il faut installer un skill ou un plugin
    - Explication de l’état d’audit ClawHub, du niveau de risque ou des résultats
sidebarTitle: Security Audits
summary: Comment comprendre les résultats d’audit de sécurité de ClawHub avant d’installer un Skill ou un Plugin.
title: Audits de sécurité
x-i18n:
    generated_at: "2026-07-05T05:03:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Audits de sécurité

Les audits de sécurité de ClawHub vous aident à décider si un skill ou un Plugin est suffisamment sûr à installer. Ils indiquent ce que fait une version, les autorisations qu’elle demande et si certains points méritent une attention particulière avant qu’elle puisse accéder à des fichiers, des comptes, des identifiants, du code ou des services externes.

Les audits sont de solides signaux de sécurité, mais ils ne garantissent pas qu’une version est sans risque. Faites toujours preuve de discernement avant d’accorder un accès sensible.

Voir aussi [Sécurité](/clawhub/security), [Utilisation acceptable](/clawhub/acceptable-usage) et [Modération et sécurité des comptes](/clawhub/moderation).

## Ce qu’il faut vérifier avant l’installation

Avant l’installation, examinez :

- l’état global de l’audit
- le niveau de risque
- toutes les conclusions listées
- les identifiants, autorisations ou variables d’environnement requis
- le propriétaire, la source, la version, le journal des modifications, les téléchargements, les étoiles et les autres signaux de confiance

N’installez que du contenu que vous comprenez et auquel vous faites confiance.

## État de l’audit

L’état de l’audit vous indique comment réagir au résultat de l’audit :

| État        | Signification                                                                 |
| ----------- | ----------------------------------------------------------------------------- |
| `Pass`      | Aucun problème visible au-dessus du risque faible n’a été trouvé.             |
| `Review`    | Lisez les conclusions avant l’installation. La version peut rester légitime.  |
| `Warn`      | Redoublez de prudence. ClawHub a trouvé un problème à fort impact ou un signal d’avertissement. |
| `Malicious` | Ne pas installer.                                                             |
| `Pending`   | Les audits ne sont pas encore terminés.                                       |
| `Error`     | L’audit n’a pas pu être terminé.                                              |

Un `Pass` est rassurant, mais il ne remplace pas votre propre jugement. C’est particulièrement important pour les outils qui peuvent publier du contenu, modifier des données, exécuter des commandes, lire des fichiers ou accéder à des systèmes de production.

## Niveau de risque

Le niveau de risque décrit le rayon d’impact : la puissance que la version semble avoir si vous l’utilisez comme prévu.

| Niveau de risque | Signification                                                                 |
| ---------------- | ----------------------------------------------------------------------------- |
| `Low`            | Peu d’autorisations sensibles ou d’impact utilisateur ont été trouvés.         |
| `Medium`         | La version dispose d’autorisations significatives, comme un accès à un compte ou des modifications de données. |
| `High`           | La version dispose d’autorisations à fort impact, de conclusions graves ou de signaux malveillants. |

Le niveau de risque et l’état de l’audit répondent à des questions différentes :

- Le niveau de risque demande : « Quelle puissance y a-t-il ici ? »
- L’état de l’audit demande : « Que dois-je faire de ce résultat ? »

Par exemple, un skill de publication peut afficher `Review` avec un risque `Medium`. Cela ne signifie pas qu’il est malveillant. Cela signifie que le skill semble aligné sur son objectif, mais peut agir avec des autorisations de compte significatives.

## Conclusions

Les conclusions expliquent pourquoi un résultat d’audit a été affiché. Chaque conclusion inclut généralement :

- ce que cela signifie
- pourquoi cela a été signalé
- le contenu du skill ou du Plugin concerné
- une recommandation

Les conclusions peuvent être étiquetées `Info`, `Low`, `Medium`, `High` ou `Critical`. Les conclusions de gravité plus élevée contribuent plus fortement au niveau de risque et à l’état de l’audit.

Les conclusions à faible confiance sont masquées du récapitulatif public de l’audit afin que la page reste centrée sur des preuves utiles.

## Ce que ClawHub vérifie

ClawHub audite les artefacts de version soumis, notamment :

- les instructions du skill ou les métadonnées du Plugin
- les variables d’environnement et autorisations déclarées
- les instructions d’installation et les métadonnées de paquet
- les fichiers inclus et les manifestes de fichiers
- les métadonnées de compatibilité et de capacité

La question principale est la cohérence : le nom, le résumé, les métadonnées, les autorisations demandées et le contenu réel correspondent-ils à ce que les utilisateurs pourraient raisonnablement attendre ?

Un comportement puissant n’est pas automatiquement mauvais. De nombreux outils utiles ont besoin d’identifiants, de commandes locales, d’API de fournisseurs ou d’installations de paquets. L’audit vérifie si cette puissance est attendue, déclarée et proportionnée.

Les pages d’artefact renvoient vers l’audit complet à l’adresse :

```text
/<owner>/skills/<slug>/security-audit
```

La page d’audit combine :

1. SkillSpector
2. VirusTotal
3. l’analyse des risques

## VirusTotal

ClawHub utilise VirusTotal comme télémétrie de logiciels malveillants dans la pile d’audit. VirusTotal est une norme de confiance dans le secteur pour la réputation des fichiers et l’analyse des logiciels malveillants, et notre partenariat permet à ClawHub d’ajouter une intelligence de sécurité plus large à l’examen des skills et des Plugins.

VirusTotal est particulièrement utile pour les artefacts malveillants connus, les détections par moteurs et les signaux de réputation qui complètent l’examen de ClawHub tenant compte des agents. Lorsque le nombre de moteurs fournisseurs est disponible, l’audit le résume en langage clair, par exemple :

```text
62/62 vendors flagged this skill as clean.
```

ou :

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

Lorsque ClawHub ne dispose d’aucune télémétrie de décompte fournisseur à résumer, l’audit indique :

```text
No VirusTotal findings
```

VirusTotal reste une télémétrie. Il ne remplace pas l’analyse des risques propre à ClawHub, qui tient compte des artefacts.

## Analyse des risques

L’analyse des risques est alimentée en interne par ClawScan, le système d’audit de sécurité propre à ClawHub. Il examine chaque version comme un artefact destiné aux agents : instructions, métadonnées, autorisations déclarées, fichiers, signaux de capacité, signaux d’analyse statique, conclusions SkillSpector, télémétrie VirusTotal et contexte fourni par l’éditeur. Les signaux d’analyse statique constituent un contexte interne pour cet examen ; ils ne sont pas une section d’audit publique autonome ni un verdict bloquant l’installation.

L’analyse des risques utilise le [OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/) comme grille de lecture pour les risques tels que l’injection de prompt, le mauvais usage des outils, l’exposition d’identifiants, l’exécution non sûre, l’empoisonnement de mémoire ou de contexte, et l’autonomie excessive.

ClawScan ne considère pas une capacité d’apparence inquiétante comme automatiquement malveillante. Il demande si la capacité est déclarée, alignée sur l’objectif et prise en charge par le cas d’usage annoncé de la version.
