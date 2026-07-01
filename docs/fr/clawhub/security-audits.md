---
read_when:
    - Comprendre les résultats de l’audit de sécurité ClawHub
    - Décider s’il faut installer une Skill ou un plugin
    - Explication du statut d’audit ClawHub, du niveau de risque ou des constatations
sidebarTitle: Security Audits
summary: Comment comprendre les résultats d’audit de sécurité ClawHub avant d’installer une compétence ou un Plugin.
title: Audits de sécurité
x-i18n:
    generated_at: "2026-07-01T18:10:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Audits de sécurité

Les audits de sécurité de ClawHub vous aident à décider si un skill ou un plugin est suffisamment sûr
pour être installé. Ils indiquent ce qu’une version fait, quelle autorité elle demande, et
si un élément mérite une attention supplémentaire avant de pouvoir accéder aux fichiers, comptes,
identifiants, code ou services externes.

Les audits sont de solides signaux de sécurité, mais ils ne garantissent pas qu’une version est
sans risque. Faites toujours preuve de discernement avant d’accorder un accès sensible.

Voir aussi [Sécurité](/clawhub/security), [Utilisation acceptable](/clawhub/acceptable-usage),
et [Modération et sécurité du compte](/clawhub/moderation).

## Ce qu’il faut vérifier avant l’installation

Avant l’installation, examinez :

- le statut global de l’audit
- le niveau de risque
- toutes les constatations listées
- les identifiants, autorisations ou variables d’environnement requis
- le propriétaire, la source, la version, le journal des modifications, les téléchargements, les étoiles et les autres signaux de confiance

Installez uniquement du contenu que vous comprenez et auquel vous faites confiance.

## Statut de l’audit

Le statut de l’audit vous indique comment réagir au résultat de l’audit :

| Statut      | Signification                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Aucun problème visible au-dessus d’un risque faible n’a été trouvé.                                |
| `Review`    | Lisez les constatations avant l’installation. La version peut tout de même être légitime. |
| `Warn`      | Redoublez de prudence. ClawHub a trouvé une préoccupation à fort impact ou un signal d’avertissement. |
| `Malicious` | N’installez pas.                                                           |
| `Pending`   | Les audits ne sont pas encore terminés.                                             |
| `Error`     | L’audit n’a pas pu être terminé.                                         |

Un `Pass` est rassurant, mais il ne remplace pas votre propre jugement. C’est particulièrement important
pour les outils qui peuvent publier du contenu, modifier des données, exécuter des commandes, lire des fichiers ou
accéder à des systèmes de production.

## Niveau de risque

Le niveau de risque décrit le périmètre d’impact : le niveau de pouvoir que la version semble avoir si
vous l’utilisez comme prévu.

| Niveau de risque | Signification                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | Peu d’autorité sensible ou d’impact utilisateur a été trouvé.                          |
| `Medium`   | La version dispose d’une autorité significative, comme l’accès à un compte ou la modification de données. |
| `High`     | La version dispose d’une autorité à fort impact, présente des constatations graves ou des signaux malveillants. |

Le niveau de risque et le statut de l’audit répondent à des questions différentes :

- Le niveau de risque demande : « Quel niveau de pouvoir y a-t-il ici ? »
- Le statut de l’audit demande : « Que dois-je faire avec ce résultat ? »

Par exemple, un skill de publication peut afficher `Review` avec un risque `Medium`. Cela ne signifie
pas qu’il est malveillant. Cela signifie que le skill semble conforme à son objectif, mais qu’il peut
agir avec une autorité significative sur le compte.

## Constatations

Les constatations expliquent pourquoi un résultat d’audit a été affiché. Chaque constatation inclut généralement :

- ce qu’elle signifie
- pourquoi elle a été signalée
- le contenu du skill ou du plugin concerné
- une recommandation

Les constatations peuvent être libellées `Info`, `Low`, `Medium`, `High` ou `Critical`. Les constatations de gravité
plus élevée contribuent plus fortement au niveau de risque et au statut de l’audit.

Les constats à faible confiance sont masqués du récapitulatif d’audit public afin que la page
reste centrée sur les preuves utiles.

## Ce que ClawHub vérifie

ClawHub audite les artefacts de release soumis, notamment :

- les instructions de skill ou les métadonnées de plugin
- les variables d’environnement et autorisations déclarées
- les instructions d’installation et les métadonnées de package
- les fichiers inclus et les manifestes de fichiers
- les métadonnées de compatibilité et de capacité

La question principale est la cohérence : le nom, le résumé, les métadonnées, les
autorisations demandées et le contenu réel correspondent-ils à ce que les
utilisateurs pourraient raisonnablement attendre ?

Un comportement puissant n’est pas automatiquement problématique. De nombreux
outils utiles ont besoin d’identifiants, de commandes locales, d’API de
fournisseurs ou d’installations de packages. L’audit vérifie si ce pouvoir est
attendu, divulgué et proportionné.

Les pages d’artefacts renvoient vers l’audit complet à l’adresse :

```text
/<owner>/skills/<slug>/security-audit
```

La page d’audit combine :

1. SkillSpector
2. VirusTotal
3. Analyse des risques

## VirusTotal

ClawHub utilise VirusTotal comme télémétrie de logiciels malveillants dans la
pile d’audit. VirusTotal est une norme de confiance du secteur pour la réputation
des fichiers et l’analyse de logiciels malveillants, et notre partenariat permet
à ClawHub d’ajouter une intelligence de sécurité plus large à l’examen des
skills et des plugins.

VirusTotal est particulièrement utile pour les artefacts malveillants connus, les
détections par moteurs et les signaux de réputation qui complètent l’examen de
ClawHub tenant compte des agents. Lorsque le nombre de moteurs fournisseurs est
disponible, l’audit les résume en langage clair, par exemple :

```text
62/62 vendors flagged this skill as clean.
```

ou :

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

Lorsque ClawHub ne dispose d’aucune télémétrie de comptage fournisseur à résumer,
l’audit indique :

```text
No VirusTotal findings
```

VirusTotal reste de la télémétrie. Il ne remplace pas l’analyse des risques de
ClawHub, propre à chaque artefact.

## Analyse des risques

L’analyse des risques est alimentée en interne par ClawScan, le propre système
d’audit de sécurité de ClawHub. Il examine chaque release comme un artefact
destiné aux agents : instructions, métadonnées, autorisations déclarées, fichiers,
signaux de capacité, signaux d’analyse statique, constats SkillSpector,
télémétrie VirusTotal et contexte fourni par l’éditeur. Les signaux d’analyse
statique constituent un contexte interne pour cet examen ; ils ne constituent pas
une section d’audit publique autonome ni un verdict bloquant l’installation.

L’analyse des risques utilise le
[Top 10 OWASP des Skills agentiques](https://owasp.org/www-project-agentic-skills-top-10/)
comme angle d’analyse pour les risques tels que l’injection de prompt, le mauvais
usage d’outils, l’exposition d’identifiants, l’exécution non sûre,
l’empoisonnement de la mémoire ou du contexte, et l’agentivité excessive.

ClawScan ne considère pas une capacité à l’apparence inquiétante comme
automatiquement malveillante. Il vérifie si la capacité est divulguée, alignée sur
l’objectif et étayée par le cas d’usage déclaré de la release.
