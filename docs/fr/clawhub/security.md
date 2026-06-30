---
read_when:
    - Signaler un problème de sécurité ClawHub
    - Comprendre la divulgation des vulnérabilités de ClawHub
    - Distinguer les problèmes de plateforme ClawHub des problèmes de Skills ou de Plugins tiers
sidebarTitle: Security
summary: Comment signaler les problèmes de sécurité de ClawHub et quand les vulnérabilités sont divulguées publiquement.
title: Sécurité
x-i18n:
    generated_at: "2026-06-30T22:14:27Z"
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
rapports d’avis ClawHub incluent les bogues dans :

- le site web, l’API ou la CLI de ClawHub
- la publication dans le registre, les téléchargements, les installations ou l’intégrité des artefacts
- l’authentification, l’autorisation ou les jetons d’API
- l’analyse, la modération ou le traitement des rapports

N’utilisez pas les avis ClawHub pour les vulnérabilités dans le code source propre d’un skill ou
plugin tiers. Signalez-les directement à l’éditeur ou au dépôt source
lié depuis la fiche ClawHub.

## Divulgation des vulnérabilités

Comme ClawHub est une application cloud hébergée, les vulnérabilités du service ClawHub
ne sont pas divulguées publiquement par défaut. Elles le sont lorsqu’il existe
des preuves d’un impact réel sur les utilisateurs ou lorsque les utilisateurs doivent agir.

Les exemples d’impact réel sur les utilisateurs incluent une exploitation confirmée, l’exposition de
données utilisateur ou de secrets, du contenu malveillant atteignant les utilisateurs en raison d’une défaillance de la plateforme,
ou tout problème nécessitant que les utilisateurs renouvellent des identifiants, mettent à jour un logiciel local ou
prennent d’autres mesures de protection.

Les vulnérabilités dans les logiciels installés par les utilisateurs sont divulguées publiquement, comme les
paquets CLI ClawHub, les binaires, les bibliothèques ou autres artefacts de publication que les utilisateurs
doivent mettre à jour localement.

## Pages connexes

Pour les étiquettes d’audit au moment de l’installation, les niveaux de risque, les constatations et leur interprétation, consultez
[Audits de sécurité](/clawhub/security-audits).

Pour les signalements de la place de marché, les suspensions de modération, les fiches masquées, les bannissements et l’état
du compte, consultez [Modération et sécurité des comptes](/clawhub/moderation).
