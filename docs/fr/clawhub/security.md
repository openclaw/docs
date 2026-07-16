---
read_when:
    - Signaler un problème de sécurité dans ClawHub
    - Comprendre la divulgation des vulnérabilités de ClawHub
    - Distinguer les problèmes de la plateforme ClawHub de ceux liés aux Skills ou Plugins tiers
sidebarTitle: Security
summary: Comment signaler les problèmes de sécurité de ClawHub et à quel moment les vulnérabilités sont divulguées publiquement.
title: Sécurité
x-i18n:
    generated_at: "2026-07-16T13:02:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Sécurité

Les problèmes de sécurité de ClawHub peuvent être signalés au moyen des avis de sécurité GitHub pour
`openclaw/clawhub`.

Utilisez les avis de sécurité GitHub pour les vulnérabilités de ClawHub lui-même. Les bons
rapports d’avis concernant ClawHub incluent les bogues dans :

- le site Web, l’API ou la CLI de ClawHub
- la publication dans le registre, les téléchargements, les installations ou l’intégrité des artefacts
- l’authentification, l’autorisation ou les jetons d’API
- l’analyse, la modération ou le traitement des signalements

N’utilisez pas les avis de ClawHub pour les vulnérabilités présentes dans le code source propre à une Skills ou à un
plugin tiers. Signalez-les directement à l’éditeur ou au dépôt
source indiqué dans la fiche ClawHub.

## Divulgation des vulnérabilités

ClawHub étant une application cloud hébergée, les vulnérabilités du service ClawHub
ne sont pas rendues publiques par défaut. Elles le sont lorsqu’il existe
des preuves d’un impact réel sur les utilisateurs ou lorsque ceux-ci doivent prendre des mesures.

Les exemples d’impact réel sur les utilisateurs comprennent une exploitation confirmée, l’exposition de données
ou de secrets d’utilisateurs, du contenu malveillant atteignant les utilisateurs en raison d’une défaillance de la plateforme,
ou tout problème obligeant les utilisateurs à renouveler leurs identifiants, à mettre à jour un logiciel local ou à
prendre d’autres mesures de protection.

Les vulnérabilités présentes dans les logiciels installés par les utilisateurs sont rendues publiques, notamment celles des
paquets CLI, des binaires, des bibliothèques ou d’autres artefacts de version de ClawHub que les utilisateurs
doivent mettre à jour localement.

## Pages connexes

Pour les étiquettes d’audit au moment de l’installation, les niveaux de risque, les constatations et leur interprétation, consultez
[Audits de sécurité](/clawhub/security-audits).

Pour les signalements sur la place de marché, les suspensions pour modération, les fiches masquées, les bannissements et le statut
des comptes, consultez [Modération et sécurité des comptes](/clawhub/moderation).
