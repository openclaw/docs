---
read_when:
    - Signaler une skill, un plugin ou un paquet
    - Récupération d’une annonce retenue, masquée ou bloquée
    - Comprendre la modération, les bannissements ou l’état du compte ClawHub
sidebarTitle: Moderation and Account Safety
summary: Fonctionnement des signalements ClawHub, des blocages de modération, des annonces masquées, des bannissements et de l’état du compte.
title: Modération et sécurité du compte
x-i18n:
    generated_at: "2026-07-04T06:29:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Modération et sécurité des comptes

ClawHub est ouvert à la publication, mais les surfaces de découverte publique et
d’installation ont tout de même besoin de garde-fous. Les signalements, les mises
en attente de modération, les listings masqués et les actions sur les comptes
aident à protéger les utilisateurs lorsqu’une version ou un compte paraît
dangereux, trompeur ou non conforme aux règles.

Cette page couvre la modération et le statut des comptes. Pour les libellés
d’audit tels que `Pass`, `Review`, `Warn`, `Malicious` et le niveau de risque,
consultez [Audits de sécurité](/clawhub/security-audits).

Voir aussi [Sécurité](/clawhub/security) et
[Utilisation acceptable](/clawhub/acceptable-usage). Pour les préoccupations
liées au droit d’auteur ou à d’autres droits sur le contenu, utilisez
[Demandes relatives aux droits de contenu](/clawhub/content-rights).

## Signalements

Les utilisateurs connectés peuvent signaler des Skills, des plugins et des paquets.

Utilisez les signalements ClawHub uniquement pour du contenu de marketplace
dangereux, par exemple :

- listings malveillants
- métadonnées trompeuses
- identifiants ou exigences d’autorisation non déclarés
- instructions d’installation suspectes
- usurpation d’identité
- enregistrements de mauvaise foi ou usage abusif de marque
- contenu qui enfreint l’[Utilisation acceptable](/clawhub/acceptable-usage)

Utilisez le bouton **Signaler le Skill** sur la page d’un Skill, ou la commande/API
de signalement de paquet pour les paquets.

N’utilisez pas les signalements ClawHub pour les vulnérabilités dans le code
source propre à un Skill ou à un plugin tiers. Signalez-les directement à
l’éditeur ou au dépôt source lié depuis le listing. ClawHub ne maintient pas et
ne corrige pas le code de Skills ou de plugins tiers.

Les GitHub Security Advisories pour `openclaw/clawhub` concernent les
vulnérabilités dans ClawHub lui-même. Les exemples incluent les bogues dans le
site web, l’API, la CLI, le registre, l’authentification, l’analyse, la
modération ou les limites de confiance de téléchargement/installation. N’utilisez
pas les avis ClawHub pour les vulnérabilités dans des Skills ou plugins tiers.

Les bons signalements sont précis et exploitables. L’abus de signalement peut
lui-même entraîner une action sur le compte.

## Revendications d’organisation et d’espace de noms

Les litiges de propriété d’organisation, de marque, de périmètre de paquet, de
pseudonyme de propriétaire ou d’espace de noms doivent utiliser le processus
[Revendications d’organisation et d’espace de noms](/clawhub/namespace-claims),
et non le flux de signalement dans le produit ni le formulaire d’appel de compte.

Utilisez ce processus lorsque vous avez besoin que l’équipe ClawHub examine des
preuves non sensibles indiquant qu’un espace de noms doit être réservé,
transféré, renommé, masqué, mis en quarantaine, doté d’un alias ou autrement
examiné. N’incluez pas de secrets, de documents privés, de dossiers juridiques
privés, de documents d’identité personnels, de jetons d’API ni de jetons de défi
DNS dans une issue publique.

## Mises en attente de modération

Certaines conclusions graves ou certains problèmes de conformité aux règles
peuvent placer un éditeur ou un listing sous mise en attente de modération.
Lorsque cela se produit, le contenu concerné peut être masqué de la découverte
publique, ou les futures publications peuvent commencer masquées jusqu’à l’examen
du problème.

Les mises en attente de modération sont destinées à protéger les utilisateurs
pendant que ClawHub résout les cas à haut risque. Elles peuvent aussi être
levées lorsqu’un faux positif est confirmé.

## Listings masqués ou bloqués

Un listing peut être mis en attente, masqué, mis en quarantaine, révoqué ou
autrement indisponible sur les surfaces d’installation publiques.

Si vous voyez l’un de ces états, n’installez pas la version sauf si le
propriétaire résout le problème ou si la modération la restaure.

Les propriétaires peuvent encore voir les diagnostics de leurs propres listings
mis en attente ou masqués. Ces diagnostics aident à expliquer ce qui s’est passé
et ce qui doit changer avant que le listing puisse revenir sur les surfaces
publiques.

## Bannissements et statut du compte

Les comptes qui enfreignent la politique de ClawHub peuvent perdre l’accès à la
publication. Les abus graves peuvent entraîner des bannissements de compte, la
révocation de jetons, du contenu masqué ou des listings supprimés. Les signaux de
pression d’abus des éditeurs sont vérifiés quotidiennement. Les signaux qui
atteignent le seuil de bannissement potentiel de ClawHub peuvent déclencher un
avertissement automatique. Si la prochaine analyse éligible après l’échéance de
l’avertissement place encore l’éditeur dans le seuil de bannissement potentiel,
ClawHub peut appliquer automatiquement l’action sur le compte. Les signaux de
revue temporelle à confiance plus faible et bornés restent exclus de
l’application automatique.

Les comptes supprimés, bannis ou désactivés ne peuvent pas utiliser les jetons
d’API ClawHub. Si l’authentification CLI commence à échouer après une action sur
le compte, connectez-vous à l’interface web pour consulter l’état du compte. Si
la connexion ou l’accès CLI normal est bloqué par un bannissement ou un compte
désactivé, utilisez le [formulaire d’appel ClawHub](https://appeals.openclaw.ai/)
pour demander un examen de récupération.

Si un e-mail déclenché par un analyseur désigne une version de Skill ou de plugin
comme malveillante, téléchargez les résultats d’analyse stockés pour la version
soumise bloquée :
`clawhub scan download <slug> --version <version>`. Pour les plugins, ajoutez
`--kind plugin`. Examinez la sortie de l’analyse, corrigez le listing, incrémentez
le numéro de version et téléversez la version corrigée.

## Conseils aux éditeurs

Pour réduire les faux positifs et améliorer la confiance des utilisateurs :

- gardez les noms, résumés, tags et changelogs exacts
- déclarez les variables d’environnement et autorisations requises
- évitez les commandes d’installation obfusquées
- ajoutez un lien vers la source lorsque c’est possible
- utilisez des exécutions à blanc avant de publier des plugins
- répondez clairement si des utilisateurs ou des modérateurs posent des questions sur le comportement d’une version
