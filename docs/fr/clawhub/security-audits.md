---
read_when:
    - Comprendre les résultats d’audit de sécurité de ClawHub
    - Décider s’il faut installer un skill ou un plugin
    - Expliquer le statut d’audit ClawHub, le niveau de risque ou les constatations
sidebarTitle: Security Audits
summary: Comment comprendre les résultats d’audit de sécurité de ClawHub avant d’installer une Skills ou un Plugin.
title: Audits de sécurité
x-i18n:
    generated_at: "2026-06-28T22:32:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Audits de sécurité

Les audits de sécurité de ClawHub vous aident à décider si un skill ou un Plugin est suffisamment sûr
pour être installé. Ils montrent ce que fait une version, quelles autorisations elle demande, et
si quelque chose mérite une attention particulière avant qu’elle puisse accéder à des fichiers, des comptes,
des identifiants, du code ou des services externes.

Les audits sont de forts signaux de sécurité, mais ils ne garantissent pas qu’une version est
sans risque. Faites toujours preuve de discernement avant d’accorder un accès sensible.

Voir aussi [Sécurité](/fr/clawhub/security), [Utilisation acceptable](/fr/clawhub/acceptable-usage),
et [Modération et sécurité du compte](/fr/clawhub/moderation).

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
| `Warn`      | Faites preuve d’une prudence accrue. ClawHub a trouvé une préoccupation à fort impact ou un signal d’avertissement. |
| `Malicious` | Ne l’installez pas.                                                           |
| `Pending`   | Les audits ne sont pas encore terminés.                                             |
| `Error`     | L’audit n’a pas pu être terminé.                                         |

Un `Pass` est rassurant, mais il ne remplace pas votre propre jugement. C’est particulièrement important
pour les outils qui peuvent publier du contenu, modifier des données, exécuter des commandes, lire des fichiers ou
accéder à des systèmes de production.

## Niveau de risque

Le niveau de risque décrit le rayon d’impact : le pouvoir que la version semble avoir si
vous l’utilisez comme prévu.

| Niveau de risque | Signification                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | Peu d’autorisations sensibles ou d’impact utilisateur ont été trouvés.                          |
| `Medium`   | La version dispose d’autorisations significatives, comme l’accès à un compte ou des modifications de données. |
| `High`     | La version dispose d’autorisations à fort impact, de constatations graves ou de signaux malveillants. |

Le niveau de risque et le statut de l’audit répondent à des questions différentes :

- Le niveau de risque demande : « Quel pouvoir y a-t-il ici ? »
- Le statut de l’audit demande : « Que dois-je faire de ce résultat ? »

Par exemple, un skill de publication peut afficher `Review` avec un risque `Medium`. Cela ne
signifie pas qu’il est malveillant. Cela signifie que le skill semble aligné sur son objectif, mais peut
agir avec des autorisations de compte significatives.

## Constatations

Les constatations expliquent pourquoi un résultat d’audit a été affiché. Chaque constatation comprend généralement :

- ce qu’elle signifie
- pourquoi elle a été signalée
- le contenu pertinent du skill ou du Plugin
- une recommandation

Les constatations peuvent être étiquetées `Info`, `Low`, `Medium`, `High` ou `Critical`. Les constatations de
gravité plus élevée contribuent plus fortement au niveau de risque et au statut de l’audit.

Les constatations à faible confiance sont masquées du récapitulatif public de l’audit afin que la page
reste centrée sur des preuves utiles.

## Ce que ClawHub vérifie

ClawHub audite les artefacts de version soumis, notamment :

- les instructions de skill ou les métadonnées de Plugin
- les variables d’environnement et autorisations déclarées
- les instructions d’installation et les métadonnées de package
- les fichiers inclus et les manifestes de fichiers
- les métadonnées de compatibilité et de capacités

La question principale est la cohérence : le nom, le résumé, les métadonnées, les autorisations
demandées et le contenu réel correspondent-ils à ce que les utilisateurs pourraient raisonnablement attendre ?

Un comportement puissant n’est pas automatiquement mauvais. De nombreux outils utiles ont besoin d’identifiants,
de commandes locales, d’API de fournisseurs ou d’installations de packages. L’audit vérifie si ce
pouvoir est attendu, divulgué et proportionné.

Les pages d’artefacts renvoient vers l’audit complet à l’adresse :

```text
/<owner>/skills/<slug>/security-audit
```

La page d’audit combine :

1. SkillSpector
2. VirusTotal
3. Analyse de risque

## VirusTotal

ClawHub utilise VirusTotal comme télémétrie de logiciels malveillants dans la pile d’audit. VirusTotal est une
norme reconnue du secteur pour la réputation des fichiers et l’analyse des logiciels malveillants, et notre
partenariat permet à ClawHub d’ajouter un renseignement de sécurité plus large à l’examen des skills et des Plugins.

VirusTotal est particulièrement utile pour les artefacts malveillants connus, les détections par moteur et
les signaux de réputation qui complètent l’examen de ClawHub tenant compte des agents. Lorsque les nombres de moteurs
fournisseurs sont disponibles, l’audit les résume en langage clair, par exemple :

```text
62/62 vendors flagged this skill as clean.
```

ou :

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

Lorsque ClawHub ne dispose d’aucune télémétrie de comptage des fournisseurs à résumer, l’audit indique :

```text
No VirusTotal findings
```

VirusTotal reste une télémétrie. Il ne remplace pas la propre analyse de risque de ClawHub
tenant compte des artefacts.

## Analyse de risque

L’analyse de risque est alimentée en interne par ClawScan, le propre système d’audit de sécurité de ClawHub.
Elle examine chaque version comme un artefact destiné aux agents : instructions,
métadonnées, autorisations déclarées, fichiers, signaux de capacités, signaux d’analyse statique,
constatations SkillSpector, télémétrie VirusTotal et contexte fourni par l’éditeur.
Les signaux d’analyse statique constituent un contexte interne pour cet examen ; ils ne sont pas une
section d’audit publique autonome ni un verdict bloquant l’installation.

L’analyse de risque utilise le
[Top 10 OWASP des Skills agentiques](https://owasp.org/www-project-agentic-skills-top-10/)
comme prisme pour les risques tels que l’injection de prompt, le mauvais usage d’outils, l’exposition
d’identifiants, l’exécution non sûre, l’empoisonnement de la mémoire ou du contexte, et l’autonomie excessive.

ClawScan ne considère pas une capacité à l’apparence inquiétante comme automatiquement malveillante.
Il vérifie si la capacité est divulguée, alignée sur l’objectif et étayée par
le cas d’utilisation déclaré de la version.
