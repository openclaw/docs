---
read_when:
    - Comprendre les résultats de l’audit de sécurité ClawHub
    - Décider d’installer une skill ou un Plugin
    - Explication de l’état d’audit ClawHub, du niveau de risque ou des constats
sidebarTitle: Security Audits
summary: Comment comprendre les résultats d’audit de sécurité ClawHub avant d’installer une Skill ou un Plugin.
title: Audits de sécurité
x-i18n:
    generated_at: "2026-07-01T05:39:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Audits de sécurité

Les audits de sécurité ClawHub vous aident à décider si une compétence ou un plugin est suffisamment sûr
pour être installé. Ils montrent ce que fait une version, quelle autorité elle demande, et
si un élément mérite une attention supplémentaire avant de pouvoir accéder à des fichiers, comptes,
identifiants, code ou services externes.

Les audits sont de forts signaux de sécurité, mais ils ne garantissent pas qu’une version est
sans risque. Faites toujours preuve de discernement avant d’accorder un accès sensible.

Voir aussi [Sécurité](/clawhub/security), [Utilisation acceptable](/fr/clawhub/acceptable-usage),
et [Modération et sécurité des comptes](/clawhub/moderation).

## Ce qu’il faut vérifier avant l’installation

Avant l’installation, examinez :

- l’état global de l’audit
- le niveau de risque
- toutes les conclusions répertoriées
- les identifiants, permissions ou variables d’environnement requis
- le propriétaire, la source, la version, le journal des modifications, les téléchargements, les étoiles et les autres signaux de confiance

Installez uniquement du contenu que vous comprenez et auquel vous faites confiance.

## État de l’audit

L’état de l’audit vous indique comment réagir au résultat de l’audit :

| État        | Signification                                                                  |
| ----------- | ------------------------------------------------------------------------------ |
| `Pass`      | Aucun problème visible au-dessus d’un risque faible n’a été trouvé.            |
| `Review`    | Lisez les conclusions avant l’installation. La version peut rester légitime.   |
| `Warn`      | Faites preuve d’une prudence accrue. ClawHub a trouvé un problème à fort impact ou un signal d’avertissement. |
| `Malicious` | Ne l’installez pas.                                                            |
| `Pending`   | Les audits ne sont pas encore terminés.                                        |
| `Error`     | L’audit n’a pas pu être terminé.                                               |

Un `Pass` est rassurant, mais il ne remplace pas votre propre jugement. C’est particulièrement important
pour les outils qui peuvent publier du contenu, modifier des données, exécuter des commandes, lire des fichiers ou
accéder à des systèmes de production.

## Niveau de risque

Le niveau de risque décrit le périmètre d’impact : le pouvoir que la version semble avoir si
vous l’utilisez comme prévu.

| Niveau de risque | Signification                                                                 |
| ---------------- | ----------------------------------------------------------------------------- |
| `Low`            | Peu d’autorité sensible ou d’impact utilisateur a été trouvé.                 |
| `Medium`         | La version dispose d’une autorité significative, comme l’accès à un compte ou des modifications de données. |
| `High`           | La version dispose d’une autorité à fort impact, présente des conclusions graves ou des signaux malveillants. |

Le niveau de risque et l’état de l’audit répondent à des questions différentes :

- Le niveau de risque demande : « Quel est le niveau de pouvoir ici ? »
- L’état de l’audit demande : « Que dois-je faire de ce résultat ? »

Par exemple, une compétence de publication peut afficher `Review` avec un risque `Medium`. Cela ne
signifie pas qu’elle est malveillante. Cela signifie que la compétence semble alignée sur son objectif, mais peut
agir avec une autorité de compte significative.

## Conclusions

Les conclusions expliquent pourquoi un résultat d’audit a été affiché. Chaque conclusion inclut généralement :

- ce que cela signifie
- pourquoi elle a été signalée
- le contenu de compétence ou de plugin concerné
- une recommandation

Les conclusions peuvent être étiquetées `Info`, `Low`, `Medium`, `High` ou `Critical`. Les conclusions de
gravité plus élevée contribuent plus fortement au niveau de risque et à l’état de l’audit.

Les conclusions à faible confiance sont masquées dans le récapitulatif public de l’audit afin que la page
reste centrée sur des preuves utiles.

## Ce que ClawHub vérifie

ClawHub audite les artefacts de version soumis, notamment :

- les instructions de compétence ou les métadonnées de plugin
- les variables d’environnement et permissions déclarées
- les instructions d’installation et les métadonnées de paquet
- les fichiers inclus et les manifestes de fichiers
- les métadonnées de compatibilité et de capacité

La question principale est la cohérence : le nom, le résumé, les métadonnées, l’autorité demandée
et le contenu réel correspondent-ils à ce que les utilisateurs pourraient raisonnablement attendre ?

Un comportement puissant n’est pas automatiquement mauvais. De nombreux outils utiles ont besoin d’identifiants,
de commandes locales, d’API de fournisseurs ou d’installations de paquets. L’audit vérifie si ce
pouvoir est attendu, divulgué et proportionné.

Les pages d’artefact renvoient vers l’audit complet à l’adresse :

```text
/<owner>/skills/<slug>/security-audit
```

La page d’audit combine :

1. SkillSpector
2. VirusTotal
3. Analyse des risques

## VirusTotal

ClawHub utilise VirusTotal comme télémétrie de logiciels malveillants dans la pile d’audit. VirusTotal est une
norme industrielle reconnue pour la réputation des fichiers et l’analyse des logiciels malveillants, et notre
partenariat permet à ClawHub d’ajouter une intelligence de sécurité plus large à l’examen des compétences et des plugins.

VirusTotal est particulièrement utile pour les artefacts malveillants connus, les détections par moteurs et
les signaux de réputation qui complètent l’examen agent-aware de ClawHub. Lorsque les nombres de moteurs
fournisseurs sont disponibles, l’audit les résume en langage clair, par exemple :

```text
62/62 fournisseurs ont marqué cette compétence comme saine.
```

ou :

```text
2/64 fournisseurs ont marqué cette compétence comme malveillante, 1/64 l’a marquée comme suspecte, et 61/64 l’ont marquée comme saine.
```

Lorsque ClawHub ne dispose d’aucune télémétrie de décompte fournisseur à résumer, l’audit indique :

```text
Aucune conclusion VirusTotal
```

VirusTotal reste une télémétrie. Elle ne remplace pas l’analyse des risques propre à ClawHub,
fondée sur la connaissance des artefacts.

## Analyse des risques

L’analyse des risques est alimentée en interne par ClawScan, le système d’audit de sécurité propre à ClawHub.
Elle examine chaque version comme un artefact destiné aux agents : instructions,
métadonnées, permissions déclarées, fichiers, signaux de capacité, signaux d’analyse statique,
conclusions SkillSpector, télémétrie VirusTotal et contexte fourni par l’éditeur.
Les signaux d’analyse statique constituent un contexte interne pour cet examen ; ils ne sont pas une
section d’audit publique autonome ni un verdict bloquant l’installation.

L’analyse des risques utilise le
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
comme prisme pour des risques tels que l’injection de prompt, le mauvais usage d’outils, l’exposition d’identifiants,
l’exécution non sécurisée, l’empoisonnement de la mémoire ou du contexte, et l’agence excessive.

ClawScan ne considère pas automatiquement une capacité inquiétante comme malveillante.
Il demande si la capacité est divulguée, alignée sur l’objectif et appuyée par
le cas d’utilisation déclaré de la version.
