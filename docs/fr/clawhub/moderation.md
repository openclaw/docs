---
read_when:
    - Signaler une skill, un plugin ou un package
    - Récupération après une annonce suspendue, masquée ou bloquée
    - Comprendre la modération, les bannissements ou l’état du compte ClawHub
sidebarTitle: Moderation and Account Safety
summary: Fonctionnement des signalements ClawHub, des retenues de modération, des annonces masquées, des bannissements et de l’état du compte.
title: Modération et sécurité du compte
x-i18n:
    generated_at: "2026-07-04T10:37:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Modération et sécurité des comptes

ClawHub est ouvert à la publication, mais les surfaces de découverte publique et
d’installation ont toujours besoin de garde-fous. Les signalements, les mises en
attente de modération, les listings masqués et les actions sur les comptes
contribuent à protéger les utilisateurs lorsqu’une release ou un compte semble
dangereux, trompeur ou non conforme aux règles.

Cette page couvre la modération et l’état des comptes. Pour les libellés d’audit
comme `Pass`, `Review`, `Warn`, `Malicious` et le niveau de risque, consultez
[Audits de sécurité](/clawhub/security-audits).

Voir aussi [Sécurité](/clawhub/security) et
[Utilisation acceptable](/clawhub/acceptable-usage). Pour les préoccupations
liées au droit d’auteur ou à d’autres droits sur le contenu, utilisez
[Demandes relatives aux droits sur le contenu](/clawhub/content-rights).

## Signalements

Les utilisateurs connectés peuvent signaler des Skills, plugins et packages.

Utilisez les signalements ClawHub uniquement pour du contenu de marketplace
dangereux, par exemple :

- listings malveillants
- métadonnées trompeuses
- identifiants ou exigences d’autorisation non déclarés
- instructions d’installation suspectes
- usurpation d’identité
- enregistrements de mauvaise foi ou usage abusif de marques
- contenu qui enfreint l’[Utilisation acceptable](/clawhub/acceptable-usage)

Utilisez le bouton **Signaler le Skill** sur une page de Skill, ou la
commande/API de signalement de package pour les packages.

N’utilisez pas les signalements ClawHub pour les vulnérabilités dans le code
source propre d’un Skill ou d’un plugin tiers. Signalez-les directement à
l’éditeur ou au dépôt source lié depuis le listing. ClawHub ne maintient ni ne
corrige le code de Skills ou plugins tiers.

Les GitHub Security Advisories pour `openclaw/clawhub` concernent les
vulnérabilités dans ClawHub lui-même. Les exemples incluent des bugs dans le
site web, l’API, la CLI, le registre, l’authentification, l’analyse, la
modération ou les frontières de confiance de téléchargement/installation.
N’utilisez pas les advisories ClawHub pour les vulnérabilités dans des Skills ou
plugins tiers.

Les bons signalements sont spécifiques et actionnables. L’abus du signalement
peut lui-même entraîner une action sur le compte.

## Revendications d’organisations et d’espaces de noms

Les litiges portant sur la propriété d’une organisation, d’une marque, d’un
périmètre de package, d’un identifiant de propriétaire ou d’un espace de noms
doivent utiliser le processus
[Revendications d’organisations et d’espaces de noms](/clawhub/namespace-claims),
et non le flux de signalement intégré au produit ni le formulaire d’appel de
compte.

Utilisez ce processus lorsque vous avez besoin que l’équipe ClawHub examine une
preuve non sensible indiquant qu’un espace de noms devrait être réservé,
transféré, renommé, masqué, mis en quarantaine, associé à un alias ou autrement
examiné. N’incluez pas de secrets, documents privés, dossiers juridiques privés,
documents d’identité personnels, jetons d’API ni jetons de défi DNS dans une
issue publique.

## Mises en attente de modération

Certaines constatations graves ou certains problèmes de politique peuvent placer
un éditeur ou un listing sous mise en attente de modération. Dans ce cas, le
contenu concerné peut être masqué de la découverte publique ou les publications
futures peuvent commencer masquées jusqu’à l’examen du problème.

Les mises en attente de modération visent à protéger les utilisateurs pendant
que ClawHub résout les cas à haut risque. Elles peuvent aussi être levées
lorsqu’un faux positif est confirmé.

## Listings masqués ou bloqués

Un listing peut être retenu, masqué, mis en quarantaine, révoqué ou autrement
indisponible sur les surfaces d’installation publiques.

Si vous voyez l’un de ces états, n’installez pas la release, sauf si le
propriétaire résout le problème ou si la modération la restaure.

Les propriétaires peuvent toujours voir les diagnostics de leurs propres
listings retenus ou masqués. Ces diagnostics aident à expliquer ce qui s’est
passé et ce qui doit changer avant que le listing puisse revenir sur les
surfaces publiques.

## Bannissements et état des comptes

Les comptes qui enfreignent la politique de ClawHub peuvent perdre l’accès à la
publication. Les abus graves peuvent entraîner des bannissements de compte, la
révocation de jetons, du contenu masqué ou la suppression de listings. Les
signaux de pression d’abus des éditeurs sont vérifiés quotidiennement. Les
signaux qui atteignent le seuil de bannissement potentiel de ClawHub peuvent
déclencher un avertissement automatique. Si l’analyse admissible suivante après
la date limite de l’avertissement place toujours l’éditeur dans le seuil de
bannissement potentiel, ClawHub peut appliquer automatiquement l’action sur le
compte. Les signaux d’examen à plus faible confiance et temporellement bornés
restent exclus de l’application automatique.

Les comptes supprimés, bannis ou désactivés ne peuvent pas utiliser les jetons
d’API ClawHub. Si l’authentification CLI commence à échouer après une action sur
le compte, connectez-vous à l’interface web pour examiner l’état du compte. Si
la connexion ou l’accès CLI normal est bloqué par un bannissement ou un compte
désactivé, utilisez le
[formulaire d’appel ClawHub](https://appeals.openclaw.ai/) pour une revue de
récupération.

Si un e-mail déclenché par un scanner nomme une version de Skill ou de plugin
comme malveillante, téléchargez les résultats d’analyse stockés pour la version
soumise bloquée :
`clawhub scan download <slug> --version <version>`. Pour les plugins, ajoutez
`--kind plugin`. Examinez la sortie de l’analyse, corrigez le listing,
incrémentez le numéro de version et téléversez la version corrigée.

## Conseils aux éditeurs

Pour réduire les faux positifs et améliorer la confiance des utilisateurs :

- gardez les noms, résumés, tags et changelogs exacts
- déclarez les variables d’environnement et autorisations requises
- évitez les commandes d’installation obfusquées
- ajoutez un lien vers la source lorsque c’est possible
- utilisez des exécutions à blanc avant de publier des plugins
- répondez clairement si des utilisateurs ou des modérateurs posent des questions sur le comportement d’une release
