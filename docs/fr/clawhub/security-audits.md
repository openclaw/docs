---
read_when:
    - Comprendre les résultats d’audit de sécurité ClawHub
    - Décider d’installer une skill ou un plugin
    - Explication du statut d’audit, du niveau de risque ou des conclusions ClawHub
sidebarTitle: Security Audits
summary: Comment comprendre les résultats d’audit de sécurité de ClawHub avant d’installer une Skills ou un Plugin.
title: Audits de sécurité
x-i18n:
    generated_at: "2026-07-03T02:47:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Audits de sécurité

Les audits de sécurité ClawHub vous aident à décider si une compétence ou un plugin est suffisamment sûr à installer. Ils indiquent ce que fait une version, quelle autorité elle demande et si certains points méritent une attention particulière avant qu’elle puisse accéder à des fichiers, des comptes, des identifiants, du code ou des services externes.

Les audits sont de forts signaux de sécurité, mais ils ne garantissent pas qu’une version est sans risque. Faites toujours preuve de discernement avant d’accorder un accès sensible.

Voir aussi [Sécurité](/clawhub/security), [Utilisation acceptable](/clawhub/acceptable-usage) et [Modération et sécurité des comptes](/clawhub/moderation).

## Ce qu’il faut vérifier avant l’installation

Avant l’installation, examinez :

- le statut global de l’audit
- le niveau de risque
- toutes les constatations listées
- les identifiants, permissions ou variables d’environnement requis
- le propriétaire, la source, la version, le journal des modifications, les téléchargements, les étoiles et les autres signaux de confiance

Installez uniquement du contenu que vous comprenez et auquel vous faites confiance.

## Statut de l’audit

Le statut de l’audit vous indique comment réagir au résultat de l’audit :

| Statut     | Signification                                                                 |
| ---------- | ----------------------------------------------------------------------------- |
| `Pass`     | Aucun problème visible au-dessus d’un risque faible n’a été trouvé.           |
| `Review`   | Lisez les constatations avant l’installation. La version peut rester légitime. |
| `Warn`     | Soyez particulièrement prudent. ClawHub a trouvé une préoccupation à fort impact ou un signal d’avertissement. |
| `Malicious` | N’installez pas.                                                             |
| `Pending`  | Les audits ne sont pas encore terminés.                                      |
| `Error`    | L’audit n’a pas pu être terminé.                                             |

Un `Pass` est rassurant, mais il ne remplace pas votre propre jugement. C’est particulièrement important pour les outils qui peuvent publier du contenu, modifier des données, exécuter des commandes, lire des fichiers ou accéder à des systèmes de production.

## Niveau de risque

Le niveau de risque décrit le périmètre d’impact : la puissance que la version semble avoir si vous l’utilisez comme prévu.

| Niveau de risque | Signification                                                                 |
| ---------------- | ----------------------------------------------------------------------------- |
| `Low`            | Peu d’autorité sensible ou d’impact utilisateur a été trouvé.                 |
| `Medium`         | La version possède une autorité significative, comme l’accès à un compte ou des modifications de données. |
| `High`           | La version possède une autorité à fort impact, des constatations graves ou des signaux malveillants. |

Le niveau de risque et le statut de l’audit répondent à des questions différentes :

- Le niveau de risque demande : « Quelle puissance y a-t-il ici ? »
- Le statut de l’audit demande : « Que dois-je faire de ce résultat ? »

Par exemple, une compétence de publication peut afficher `Review` avec un risque `Medium`. Cela ne signifie pas qu’elle est malveillante. Cela signifie que la compétence semble alignée sur son objectif, mais qu’elle peut agir avec une autorité significative sur un compte.

## Constatations

Les constatations expliquent pourquoi un résultat d’audit a été affiché. Chaque constatation inclut généralement :

- ce qu’elle signifie
- pourquoi elle a été signalée
- le contenu pertinent de la compétence ou du plugin
- une recommandation

Les constatations peuvent être étiquetées `Info`, `Low`, `Medium`, `High` ou `Critical`. Les constatations de gravité plus élevée contribuent plus fortement au niveau de risque et au statut de l’audit.

Les constatations à faible confiance sont masquées du récapitulatif public de l’audit afin que la page reste centrée sur des éléments de preuve utiles.

## Ce que ClawHub vérifie

ClawHub audite les artefacts de version soumis, notamment :

- les instructions de compétence ou les métadonnées de plugin
- les variables d’environnement et permissions déclarées
- les instructions d’installation et les métadonnées de paquet
- les fichiers inclus et les manifestes de fichiers
- les métadonnées de compatibilité et de capacités

La question principale est la cohérence : le nom, le résumé, les métadonnées, l’autorité demandée et le contenu réel correspondent-ils à ce que les utilisateurs peuvent raisonnablement attendre ?

Un comportement puissant n’est pas automatiquement mauvais. De nombreux outils utiles ont besoin d’identifiants, de commandes locales, d’API de fournisseurs ou d’installations de paquets. L’audit vérifie si cette puissance est attendue, déclarée et proportionnée.

Les pages d’artefacts renvoient vers l’audit complet à l’adresse :

```text
/<owner>/skills/<slug>/security-audit
```

La page d’audit combine :

1. SkillSpector
2. VirusTotal
3. Analyse des risques

## VirusTotal

ClawHub utilise VirusTotal comme télémétrie de logiciels malveillants dans la pile d’audit. VirusTotal est une norme industrielle reconnue pour la réputation des fichiers et l’analyse des logiciels malveillants, et notre partenariat permet à ClawHub d’ajouter des renseignements de sécurité plus larges à l’examen des compétences et des plugins.

VirusTotal est particulièrement utile pour les artefacts malveillants connus, les détections par moteurs et les signaux de réputation qui complètent l’examen de ClawHub tenant compte des agents. Lorsque le nombre de moteurs fournisseurs est disponible, l’audit le résume en langage clair, par exemple :

```text
62/62 vendors flagged this skill as clean.
```

ou :

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

Lorsque ClawHub ne dispose d’aucune télémétrie de nombre de fournisseurs à résumer, l’audit indique :

```text
No VirusTotal findings
```

VirusTotal reste de la télémétrie. Il ne remplace pas l’analyse des risques propre à ClawHub, fondée sur les artefacts.

## Analyse des risques

L’analyse des risques est alimentée en interne par ClawScan, le système d’audit de sécurité propre à ClawHub. Il examine chaque version comme un artefact destiné aux agents : instructions, métadonnées, permissions déclarées, fichiers, signaux de capacités, signaux d’analyse statique, constatations SkillSpector, télémétrie VirusTotal et contexte fourni par l’éditeur. Les signaux d’analyse statique sont un contexte interne pour cet examen ; ils ne constituent pas une section d’audit publique autonome ni un verdict bloquant l’installation.

L’analyse des risques utilise le [OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/) comme prisme pour les risques tels que l’injection de prompt, le mauvais usage des outils, l’exposition d’identifiants, l’exécution non sûre, l’empoisonnement de la mémoire ou du contexte et l’autonomie excessive.

ClawScan ne considère pas automatiquement une capacité inquiétante comme malveillante. Il demande si la capacité est déclarée, alignée sur l’objectif et prise en charge par le cas d’utilisation annoncé de la version.
