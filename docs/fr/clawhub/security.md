---
read_when:
    - Signaler un problème de sécurité ClawHub
    - Comprendre la divulgation des vulnérabilités de ClawHub
    - Distinguer les problèmes de plateforme ClawHub des problèmes de Skills ou de Plugin tiers
sidebarTitle: Security
summary: Comment signaler les problèmes de sécurité de ClawHub et quand les vulnérabilités sont divulguées publiquement.
title: Sécurité
x-i18n:
    generated_at: "2026-07-02T14:02:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Sécurité

Les problèmes de sécurité de ClawHub peuvent être signalés via les GitHub Security Advisories pour
`openclaw/clawhub`.

Utilisez les GitHub Security Advisories pour les vulnérabilités dans ClawHub lui-même. Les bons
rapports d’avis de sécurité ClawHub incluent les bugs dans :

- le site Web, l’API ou la CLI de ClawHub
- la publication dans le registre, les téléchargements, les installations ou l’intégrité des artefacts
- l’authentification, l’autorisation ou les jetons d’API
- l’analyse, la modération ou le traitement des rapports

N’utilisez pas les avis de sécurité ClawHub pour les vulnérabilités dans le code source propre à une compétence tierce ou à un plugin tiers. Signalez-les directement à l’éditeur ou au dépôt source lié depuis la fiche ClawHub.

## Divulgation des vulnérabilités

Comme ClawHub est une application cloud hébergée, les vulnérabilités du service ClawHub
ne sont pas divulguées publiquement par défaut. Elles sont divulguées publiquement lorsqu’il existe
des preuves d’un impact réel sur les utilisateurs ou lorsque les utilisateurs doivent agir.

Des exemples d’impact réel sur les utilisateurs incluent une exploitation confirmée, l’exposition de données
utilisateur ou de secrets, du contenu malveillant atteignant les utilisateurs à cause d’une défaillance de la plateforme,
ou tout problème qui exige des utilisateurs qu’ils renouvellent leurs identifiants, mettent à jour un logiciel local ou
prennent une autre mesure de protection.

Les vulnérabilités dans les logiciels installés par les utilisateurs sont divulguées publiquement, comme
les paquets CLI ClawHub, les binaires, les bibliothèques ou d’autres artefacts de publication que les utilisateurs
doivent mettre à jour localement.

## Pages connexes

Pour les étiquettes d’audit au moment de l’installation, les niveaux de risque, les constats et l’interprétation, consultez
[Audits de sécurité](/clawhub/security-audits).

Pour les signalements de marketplace, les mises en attente de modération, les fiches masquées, les bannissements et l’état des comptes, consultez [Modération et sécurité des comptes](/clawhub/moderation).
