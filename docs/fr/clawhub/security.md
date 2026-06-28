---
read_when:
    - Signalement d’un problème de sécurité ClawHub
    - Comprendre la divulgation des vulnérabilités de ClawHub
    - Distinguer les problèmes de plateforme ClawHub des problèmes de Skills ou de plugins tiers
sidebarTitle: Security
summary: Comment signaler les problèmes de sécurité de ClawHub et quand les vulnérabilités sont divulguées publiquement.
title: Sécurité
x-i18n:
    generated_at: "2026-06-28T05:07:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Sécurité

Les problèmes de sécurité de ClawHub peuvent être signalés via les avis de sécurité GitHub pour
`openclaw/clawhub`.

Utilisez les avis de sécurité GitHub pour les vulnérabilités dans ClawHub lui-même. Les bons
rapports d’avis ClawHub incluent les bogues dans :

- le site web, l’API ou la CLI ClawHub
- la publication dans le registre, les téléchargements, les installations ou l’intégrité des artefacts
- l’authentification, l’autorisation ou les jetons d’API
- l’analyse, la modération ou le traitement des rapports

N’utilisez pas les avis ClawHub pour les vulnérabilités dans le code source propre à une compétence ou à un
Plugin tiers. Signalez-les directement à l’éditeur ou au dépôt source
lié depuis la fiche ClawHub.

## Divulgation des vulnérabilités

Comme ClawHub est une application cloud hébergée, les vulnérabilités du service ClawHub
ne sont pas rendues publiques par défaut. Elles sont rendues publiques lorsqu’il existe
des preuves d’un impact réel sur les utilisateurs ou lorsque les utilisateurs doivent agir.

Les exemples d’impact réel sur les utilisateurs incluent une exploitation confirmée, l’exposition de données
ou de secrets utilisateur, du contenu malveillant atteignant les utilisateurs en raison d’une défaillance de la plateforme,
ou tout problème obligeant les utilisateurs à renouveler des identifiants, mettre à jour un logiciel local ou
prendre d’autres mesures de protection.

Les vulnérabilités dans les logiciels installés par l’utilisateur sont rendues publiques, comme les
paquets, binaires, bibliothèques ou autres artefacts de publication de la CLI ClawHub que les utilisateurs
doivent mettre à jour localement.

## Pages connexes

Pour les libellés d’audit au moment de l’installation, les niveaux de risque, les constats et l’interprétation, consultez
[Audits de sécurité](/fr/clawhub/security-audits).

Pour les rapports de marketplace, les blocages de modération, les fiches masquées, les bannissements et la
réputation du compte, consultez [Modération et sécurité des comptes](/fr/clawhub/moderation).
