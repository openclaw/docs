---
read_when:
    - Comprendre les résultats de l’audit de sécurité ClawHub
    - Décider d’installer un skill ou un plugin
    - Expliquer le statut d’audit de ClawHub, le niveau de risque ou les constats
sidebarTitle: Security Audits
summary: Comment comprendre les résultats d’audit de sécurité ClawHub avant d’installer une Skill ou un Plugin.
title: Audits de sécurité
x-i18n:
    generated_at: "2026-06-30T14:00:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Audits de sécurité

Les audits de sécurité ClawHub vous aident à décider si une skill ou un plugin est suffisamment sûr
pour être installé. Ils montrent ce que fait une release, l’autorité qu’elle demande, et
si un élément mérite une attention particulière avant de pouvoir accéder à des fichiers, comptes,
identifiants, code ou services externes.

Les audits sont de forts signaux de sécurité, mais ils ne garantissent pas qu’une release est
sans risque. Faites toujours preuve de discernement avant d’accorder un accès sensible.

Voir aussi [Sécurité](/clawhub/security), [Utilisation acceptable](/fr/clawhub/acceptable-usage),
et [Modération et sécurité des comptes](/clawhub/moderation).

## Ce qu’il faut vérifier avant l’installation

Avant l’installation, examinez :

- le statut global de l’audit
- le niveau de risque
- toutes les constatations listées
- les identifiants, permissions ou variables d’environnement requis
- le propriétaire, la source, la version, le changelog, les téléchargements, les étoiles et les autres signaux de confiance

Installez uniquement du contenu que vous comprenez et auquel vous faites confiance.

## Statut de l’audit

Le statut de l’audit vous indique comment réagir au résultat de l’audit :

| Statut      | Signification                                                            |
| ----------- | ------------------------------------------------------------------------ |
| `Pass`      | Aucun problème visible au-dessus d’un risque faible n’a été trouvé.      |
| `Review`    | Lisez les constatations avant l’installation. La release peut rester légitime. |
| `Warn`      | Redoublez de prudence. ClawHub a trouvé une préoccupation à fort impact ou un signal d’avertissement. |
| `Malicious` | Ne l’installez pas.                                                      |
| `Pending`   | Les audits ne sont pas encore terminés.                                  |
| `Error`     | L’audit n’a pas pu être terminé.                                         |

Un `Pass` est rassurant, mais il ne remplace pas votre propre jugement. C’est particulièrement important
pour les outils qui peuvent publier du contenu, modifier des données, exécuter des commandes, lire des fichiers ou
accéder à des systèmes de production.

## Niveau de risque

Le niveau de risque décrit le rayon d’impact : la puissance que la release semble avoir si
vous l’utilisez comme prévu.

| Niveau de risque | Signification                                                            |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | Peu d’autorité sensible ou d’impact utilisateur a été trouvé.                 |
| `Medium`   | La release dispose d’une autorité significative, comme l’accès à un compte ou des modifications de données. |
| `High`     | La release dispose d’une autorité à fort impact, de constatations graves ou de signaux malveillants. |

Le niveau de risque et le statut de l’audit répondent à des questions différentes :

- Le niveau de risque demande : « Quelle puissance y a-t-il ici ? »
- Le statut de l’audit demande : « Que dois-je faire avec ce résultat ? »

Par exemple, une skill de publication peut afficher `Review` avec un risque `Medium`. Cela ne
signifie pas qu’elle est malveillante. Cela signifie que la skill semble conforme à son objectif, mais peut
agir avec une autorité de compte significative.

## Constatations

Les constatations expliquent pourquoi un résultat d’audit a été affiché. Chaque constatation inclut généralement :

- ce qu’elle signifie
- pourquoi elle a été signalée
- le contenu de skill ou de plugin pertinent
- une recommandation

Les constatations peuvent être étiquetées `Info`, `Low`, `Medium`, `High` ou `Critical`. Les constatations de sévérité plus élevée
contribuent plus fortement au niveau de risque et au statut de l’audit.

Les constatations de faible confiance sont masquées dans le récapitulatif public de l’audit afin que la page
reste centrée sur des preuves utiles.

## Ce que ClawHub vérifie

ClawHub audite les artefacts de release soumis, notamment :

- les instructions de skill ou les métadonnées de plugin
- les variables d’environnement et permissions déclarées
- les instructions d’installation et les métadonnées de package
- les fichiers inclus et les manifestes de fichiers
- les métadonnées de compatibilité et de capacité

La question principale est la cohérence : le nom, le résumé, les métadonnées, l’autorité demandée
et le contenu réel correspondent-ils à ce que les utilisateurs peuvent raisonnablement attendre ?

Un comportement puissant n’est pas automatiquement mauvais. De nombreux outils utiles ont besoin d’identifiants,
de commandes locales, d’API de fournisseurs ou d’installations de packages. L’audit vérifie si cette
puissance est attendue, divulguée et proportionnée.

Les pages d’artefact renvoient vers l’audit complet à l’adresse :

```text
/<owner>/skills/<slug>/security-audit
```

La page d’audit combine :

1. SkillSpector
2. VirusTotal
3. Analyse des risques

## VirusTotal

ClawHub utilise VirusTotal comme télémétrie de malware dans la pile d’audit. VirusTotal est une
norme de confiance dans le secteur pour la réputation des fichiers et l’analyse des malwares, et notre
partenariat permet à ClawHub d’ajouter une intelligence de sécurité plus large à la revue des skills et plugins.

VirusTotal est particulièrement utile pour les artefacts malveillants connus, les détections par moteurs et
les signaux de réputation qui complètent la revue de ClawHub sensible aux agents. Lorsque les
décomptes de moteurs fournisseurs sont disponibles, l’audit les résume en langage clair, par
exemple :

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

VirusTotal reste une télémétrie. Il ne remplace pas l’analyse des risques propre à ClawHub,
tenant compte des artefacts.

## Analyse des risques

L’analyse des risques est alimentée en interne par ClawScan, le système d’audit de sécurité propre à ClawHub.
Il examine chaque release comme un artefact destiné aux agents : instructions,
métadonnées, permissions déclarées, fichiers, signaux de capacités, signaux d’analyse statique,
constatations SkillSpector, télémétrie VirusTotal et contexte fourni par l’éditeur.
Les signaux d’analyse statique sont un contexte interne pour cette revue ; ils ne constituent pas une
section d’audit publique autonome ni un verdict bloquant l’installation.

L’analyse des risques utilise le
[Top 10 OWASP Agentic Skills](https://owasp.org/www-project-agentic-skills-top-10/)
comme prisme pour les risques tels que l’injection de prompt, l’usage abusif d’outils, l’exposition d’identifiants,
l’exécution non sécurisée, l’empoisonnement de la mémoire ou du contexte, et l’autonomie excessive.

ClawScan ne considère pas une capacité inquiétante en apparence comme automatiquement malveillante.
Il demande si la capacité est divulguée, conforme à l’objectif et étayée par
le cas d’usage déclaré de la release.
