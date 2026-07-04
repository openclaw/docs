---
read_when:
    - Comprendre les résultats d’audit de sécurité de ClawHub
    - Décider d’installer ou non une Skill ou un Plugin
    - Explication du statut d’audit ClawHub, du niveau de risque ou des constats
sidebarTitle: Security Audits
summary: Comment comprendre les résultats d’audit de sécurité ClawHub avant d’installer une Skill ou un Plugin.
title: Audits de sécurité
x-i18n:
    generated_at: "2026-07-04T03:44:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Audits de sécurité

Les audits de sécurité de ClawHub vous aident à décider si une skill ou un plugin est suffisamment sûr
pour être installé. Ils indiquent ce que fait une release, quelles autorisations elle demande, et
si quelque chose mérite une attention particulière avant de pouvoir accéder à des fichiers, des comptes,
des identifiants, du code ou des services externes.

Les audits sont de forts signaux de sécurité, mais ils ne garantissent pas qu’une release soit
sans risque. Faites toujours preuve de discernement avant d’accorder un accès sensible.

Voir aussi [Sécurité](/clawhub/security), [Utilisation acceptable](/clawhub/acceptable-usage),
et [Modération et sécurité des comptes](/clawhub/moderation).

## Ce qu’il faut vérifier avant l’installation

Avant l’installation, examinez :

- l’état global de l’audit
- le niveau de risque
- toutes les conclusions listées
- les identifiants, permissions ou variables d’environnement requis
- le propriétaire, la source, la version, le journal des modifications, les téléchargements, les étoiles et les autres signaux de confiance

Installez uniquement du contenu que vous comprenez et auquel vous faites confiance.

## État de l’audit

L’état de l’audit vous indique comment réagir au résultat de l’audit :

| État        | Signification                                                            |
| ----------- | ------------------------------------------------------------------------ |
| `Pass`      | Aucun problème visible au-dessus d’un risque faible n’a été trouvé.      |
| `Review`    | Lisez les conclusions avant l’installation. La release peut rester légitime. |
| `Warn`      | Redoublez de prudence. ClawHub a trouvé une préoccupation à fort impact ou un signal d’avertissement. |
| `Malicious` | Ne l’installez pas.                                                      |
| `Pending`   | Les audits ne sont pas encore terminés.                                  |
| `Error`     | L’audit n’a pas pu être terminé.                                         |

Un `Pass` est rassurant, mais il ne remplace pas votre propre jugement. C’est particulièrement important
pour les outils qui peuvent publier du contenu, modifier des données, exécuter des commandes, lire des fichiers ou
accéder à des systèmes de production.

## Niveau de risque

Le niveau de risque décrit le rayon d’impact : le pouvoir que la release semble avoir si
vous l’utilisez comme prévu.

| Niveau de risque | Signification                                                                 |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | Peu d’autorisations sensibles ou d’impact utilisateur ont été trouvés.         |
| `Medium`   | La release dispose d’autorisations significatives, comme l’accès à un compte ou la modification de données. |
| `High`     | La release dispose d’autorisations à fort impact, de conclusions graves ou de signaux malveillants. |

Le niveau de risque et l’état de l’audit répondent à des questions différentes :

- Le niveau de risque demande : « Quel est le niveau de pouvoir ici ? »
- L’état de l’audit demande : « Que dois-je faire de ce résultat ? »

Par exemple, une skill de publication peut afficher `Review` avec un risque `Medium`. Cela ne
signifie pas qu’elle est malveillante. Cela signifie que la skill semble alignée sur son objectif, mais peut
agir avec des autorisations de compte significatives.

## Conclusions

Les conclusions expliquent pourquoi un résultat d’audit a été affiché. Chaque conclusion inclut généralement :

- ce que cela signifie
- pourquoi cela a été signalé
- le contenu pertinent de la skill ou du plugin
- une recommandation

Les conclusions peuvent être étiquetées `Info`, `Low`, `Medium`, `High` ou `Critical`. Les conclusions de gravité
plus élevée contribuent plus fortement au niveau de risque et à l’état de l’audit.

Les conclusions à faible niveau de confiance sont masquées du récapitulatif public de l’audit afin que la page
reste centrée sur les éléments utiles.

## Ce que ClawHub vérifie

ClawHub audite les artefacts de release soumis, notamment :

- les instructions de skill ou les métadonnées de plugin
- les variables d’environnement et permissions déclarées
- les instructions d’installation et les métadonnées de package
- les fichiers inclus et les manifestes de fichiers
- les métadonnées de compatibilité et de capacité

La question principale est la cohérence : le nom, le résumé, les métadonnées, les autorisations demandées
et le contenu réel correspondent-ils à ce que les utilisateurs pourraient raisonnablement attendre ?

Un comportement puissant n’est pas automatiquement mauvais. De nombreux outils utiles ont besoin d’identifiants,
de commandes locales, d’API de fournisseurs ou d’installations de packages. L’audit vérifie si ce
pouvoir est attendu, communiqué et proportionné.

Les pages d’artefacts renvoient vers l’audit complet à l’adresse :

```text
/<owner>/skills/<slug>/security-audit
```

La page d’audit combine :

1. SkillSpector
2. VirusTotal
3. Analyse des risques

## VirusTotal

ClawHub utilise VirusTotal comme télémétrie de logiciels malveillants dans la pile d’audit. VirusTotal est un
standard de confiance du secteur pour la réputation des fichiers et l’analyse de logiciels malveillants, et notre
partenariat permet à ClawHub d’ajouter une intelligence de sécurité plus large à l’examen des skills et plugins.

VirusTotal est particulièrement utile pour les artefacts malveillants connus, les détections par moteurs et
les signaux de réputation qui complètent l’examen de ClawHub tenant compte des agents. Lorsque les nombres
de moteurs fournisseurs sont disponibles, l’audit les résume en langage clair, par exemple :

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

VirusTotal reste une télémétrie. Il ne remplace pas la propre analyse des risques de ClawHub tenant compte des artefacts.

## Analyse des risques

L’analyse des risques est alimentée en interne par ClawScan, le propre système d’audit de sécurité de ClawHub.
Il examine chaque release comme un artefact destiné aux agents : instructions,
métadonnées, permissions déclarées, fichiers, signaux de capacité, signaux d’analyse statique,
conclusions SkillSpector, télémétrie VirusTotal et contexte fourni par l’éditeur.
Les signaux d’analyse statique sont un contexte interne pour cet examen ; ils ne constituent pas une
section d’audit publique autonome ni un verdict bloquant l’installation.

L’analyse des risques utilise le
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
comme prisme pour les risques tels que l’injection de prompt, le mauvais usage d’outils, l’exposition d’identifiants,
l’exécution non sécurisée, l’empoisonnement de la mémoire ou du contexte, et l’autonomie excessive.

ClawScan ne considère pas une capacité à l’apparence inquiétante comme automatiquement malveillante.
Il demande si la capacité est communiquée, alignée sur son objectif et étayée par
le cas d’usage déclaré de la release.
