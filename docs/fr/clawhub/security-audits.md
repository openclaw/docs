---
read_when:
    - Comprendre les résultats de l’audit de sécurité ClawHub
    - Décider d’installer une compétence ou un Plugin
    - Explication de l’état d’audit, du niveau de risque ou des constatations de ClawHub
sidebarTitle: Security Audits
summary: Comment comprendre les résultats d’audit de sécurité de ClawHub avant d’installer une compétence ou un plugin.
title: Audits de sécurité
x-i18n:
    generated_at: "2026-07-03T23:31:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Audits de sécurité

Les audits de sécurité de ClawHub vous aident à décider si une skill ou un plugin est suffisamment sûr
pour être installé. Ils indiquent ce que fait une version, quelles autorisations elle demande, et
si certains éléments méritent une attention supplémentaire avant qu’elle puisse accéder à des fichiers, des comptes,
des identifiants, du code ou des services externes.

Les audits sont des signaux de sécurité forts, mais ils ne garantissent pas qu’une version est
sans risque. Faites toujours preuve de jugement avant d’accorder un accès sensible.

Voir aussi [Sécurité](/clawhub/security), [Utilisation acceptable](/clawhub/acceptable-usage),
et [Modération et sécurité des comptes](/clawhub/moderation).

## Ce qu’il faut vérifier avant l’installation

Avant l’installation, examinez :

- l’état global de l’audit
- le niveau de risque
- les constatations répertoriées
- les identifiants, autorisations ou variables d’environnement requis
- le propriétaire, la source, la version, le journal des modifications, les téléchargements, les étoiles et d’autres signaux de confiance

Installez uniquement du contenu que vous comprenez et auquel vous faites confiance.

## État de l’audit

L’état de l’audit vous indique comment réagir au résultat de l’audit :

| État        | Signification                                                             |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Aucun problème visible au-dessus d’un risque faible n’a été trouvé.       |
| `Review`    | Lisez les constatations avant l’installation. La version peut encore être légitime. |
| `Warn`      | Redoublez de prudence. ClawHub a trouvé une préoccupation à fort impact ou un signal d’avertissement. |
| `Malicious` | Ne l’installez pas.                                                       |
| `Pending`   | Les audits ne sont pas encore terminés.                                   |
| `Error`     | L’audit n’a pas pu être terminé.                                          |

Un résultat `Pass` est rassurant, mais il ne remplace pas votre propre jugement. C’est particulièrement important
pour les outils qui peuvent publier du contenu, modifier des données, exécuter des commandes, lire des fichiers ou
accéder à des systèmes de production.

## Niveau de risque

Le niveau de risque décrit le rayon d’impact : le niveau de pouvoir que la version semble avoir si
vous l’utilisez comme prévu.

| Niveau de risque | Signification                                                                       |
| ---------------- | ----------------------------------------------------------------------------------- |
| `Low`            | Peu d’autorisations sensibles ou d’impact utilisateur ont été trouvés.               |
| `Medium`         | La version dispose d’autorisations significatives, comme un accès à un compte ou des modifications de données. |
| `High`           | La version dispose d’autorisations à fort impact, de constatations graves ou de signaux malveillants. |

Le niveau de risque et l’état de l’audit répondent à des questions différentes :

- Le niveau de risque demande : « Quelle est l’étendue du pouvoir ici ? »
- L’état de l’audit demande : « Que dois-je faire de ce résultat ? »

Par exemple, une skill de publication peut afficher `Review` avec un risque `Medium`. Cela
ne signifie pas qu’elle est malveillante. Cela signifie que la skill semble alignée sur son objectif, mais qu’elle peut
agir avec une autorité de compte significative.

## Constatations

Les constatations expliquent pourquoi un résultat d’audit a été affiché. Chaque constatation inclut généralement :

- ce que cela signifie
- pourquoi elle a été signalée
- le contenu de la skill ou du plugin concerné
- une recommandation

Les constatations peuvent être libellées `Info`, `Low`, `Medium`, `High` ou `Critical`. Les constatations de gravité
plus élevée contribuent plus fortement au niveau de risque et à l’état de l’audit.

Les constatations à faible niveau de confiance sont masquées dans le résumé public de l’audit afin que la page
reste centrée sur des preuves utiles.

## Ce que ClawHub vérifie

ClawHub audite les artefacts de version soumis, notamment :

- les instructions de skill ou les métadonnées de plugin
- les variables d’environnement et autorisations déclarées
- les instructions d’installation et les métadonnées de package
- les fichiers inclus et les manifestes de fichiers
- les métadonnées de compatibilité et de capacités

La question principale est la cohérence : le nom, le résumé, les métadonnées, l’autorité demandée
et le contenu réel correspondent-ils à ce que les utilisateurs peuvent raisonnablement attendre ?

Un comportement puissant n’est pas automatiquement mauvais. De nombreux outils utiles ont besoin d’identifiants,
de commandes locales, d’API de fournisseur ou d’installations de packages. L’audit vérifie si ce
pouvoir est attendu, divulgué et proportionné.

Les pages d’artefacts renvoient vers l’audit complet à l’adresse :

```text
/<owner>/skills/<slug>/security-audit
```

La page d’audit combine :

1. SkillSpector
2. VirusTotal
3. L’analyse des risques

## VirusTotal

ClawHub utilise VirusTotal comme télémétrie antimalware dans la pile d’audit. VirusTotal est une
norme de confiance du secteur pour la réputation des fichiers et l’analyse antimalware, et notre
partenariat permet à ClawHub d’ajouter une intelligence de sécurité plus large à l’examen des skills et des plugins.

VirusTotal est particulièrement utile pour les artefacts malveillants connus, les détections par moteur et
les signaux de réputation qui complètent l’examen de ClawHub tenant compte des agents. Lorsque le nombre
de moteurs de fournisseurs est disponible, l’audit le résume en langage clair, par exemple :

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

VirusTotal reste une télémétrie. Elle ne remplace pas l’analyse des risques propre à ClawHub,
tenant compte des artefacts.

## Analyse des risques

L’analyse des risques est alimentée en interne par ClawScan, le système d’audit de sécurité propre à ClawHub.
Il examine chaque version comme un artefact destiné aux agents : instructions,
métadonnées, autorisations déclarées, fichiers, signaux de capacité, signaux d’analyse statique,
constatations SkillSpector, télémétrie VirusTotal et contexte fourni par l’éditeur.
Les signaux d’analyse statique constituent un contexte interne pour cet examen ; ils ne sont pas une
section d’audit publique autonome ni un verdict bloquant l’installation.

L’analyse des risques utilise le
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
comme prisme pour les risques tels que l’injection de prompt, le mauvais usage des outils, l’exposition des identifiants,
l’exécution non sécurisée, l’empoisonnement de la mémoire ou du contexte, et une agentivité excessive.

ClawScan ne considère pas automatiquement une capacité à l’apparence inquiétante comme malveillante.
Il vérifie si la capacité est divulguée, alignée sur l’objectif et étayée par le cas d’utilisation déclaré de la version.
