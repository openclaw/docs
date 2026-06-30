---
read_when:
    - Signaler un Skill, un Plugin ou un paquet
    - Récupération après une publication retenue, masquée ou bloquée
    - Comprendre la modération ClawHub, les bannissements ou le statut du compte
sidebarTitle: Moderation and Account Safety
summary: Fonctionnement des signalements ClawHub, des suspensions de modération, des annonces masquées, des bannissements et de l’état des comptes.
title: Modération et sécurité du compte
x-i18n:
    generated_at: "2026-06-30T13:58:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Modération et sécurité des comptes

ClawHub est ouvert à la publication, mais les surfaces publiques de découverte et d’installation ont toujours
besoin de garde-fous. Les signalements, mises en attente de modération, listings masqués et actions sur les comptes
aident à protéger les utilisateurs lorsqu’une version ou un compte paraît dangereux, trompeur ou non
conforme aux règles.

Cette page couvre la modération et la réputation du compte. Pour les étiquettes d’audit telles que
`Pass`, `Review`, `Warn`, `Malicious` et le niveau de risque, consultez
[Audits de sécurité](/clawhub/security-audits).

Voir aussi [Sécurité](/clawhub/security) et
[Usage acceptable](/clawhub/acceptable-usage). Pour les questions de droit d’auteur ou autres droits
sur le contenu, utilisez [Demandes relatives aux droits de contenu](/clawhub/content-rights).

## Signalements

Les utilisateurs connectés peuvent signaler des Skills, des Plugins et des packages.

Utilisez les signalements ClawHub uniquement pour du contenu de marketplace dangereux, comme :

- listings malveillants
- métadonnées trompeuses
- identifiants ou exigences d’autorisations non déclarés
- instructions d’installation suspectes
- usurpation d’identité
- enregistrements de mauvaise foi ou usage abusif de marque
- contenu qui enfreint l’[Usage acceptable](/clawhub/acceptable-usage)

Utilisez le bouton **Signaler le Skill** sur une page de Skill, ou la commande/API de signalement
de package pour les packages.

N’utilisez pas les signalements ClawHub pour des vulnérabilités dans le code source propre d’un Skill ou
Plugin tiers. Signalez-les directement à l’éditeur ou au dépôt source
lié depuis le listing. ClawHub ne maintient ni ne corrige le code
de Skills ou Plugins tiers.

Les GitHub Security Advisories pour `openclaw/clawhub` concernent les vulnérabilités dans
ClawHub lui-même. Exemples : bogues dans le site web, l’API, la CLI, le registre, l’authentification,
l’analyse, la modération ou les frontières de confiance du téléchargement/de l’installation. N’utilisez pas les
advisories ClawHub pour les vulnérabilités dans des Skills ou Plugins tiers.

Les bons signalements sont spécifiques et exploitables. L’abus de signalements peut lui-même entraîner une
action sur le compte.

## Revendications d’organisation et d’espace de noms

Les litiges portant sur une organisation, une marque, une portée de package, un identifiant de propriétaire ou la propriété d’un espace de noms doivent
utiliser le processus [Revendications d’organisation et d’espace de noms](/clawhub/namespace-claims), et non le
flux de signalement intégré au produit ni le formulaire d’appel de compte.

Utilisez ce processus lorsque vous avez besoin que l’équipe ClawHub examine des preuves non sensibles indiquant qu’un
espace de noms doit être réservé, transféré, renommé, masqué, mis en quarantaine, doté d’un alias
ou autrement examiné. N’incluez pas de secrets, documents privés, dossiers juridiques privés,
pièces d’identité personnelles, tokens d’API ou tokens de défi DNS dans une
issue publique.

## Mises en attente de modération

Certaines constatations graves ou certains problèmes de conformité aux règles peuvent placer un éditeur ou un listing en
mise en attente de modération. Lorsque cela se produit, le contenu concerné peut être masqué de la
découverte publique, ou les publications futures peuvent commencer masquées jusqu’à l’examen du problème.

Les mises en attente de modération visent à protéger les utilisateurs pendant que ClawHub résout les cas
à haut risque. Elles peuvent aussi être levées lorsqu’un faux positif est confirmé.

## Listings masqués ou bloqués

Un listing peut être mis en attente, masqué, mis en quarantaine, révoqué ou autrement indisponible sur
les surfaces d’installation publiques.

Si vous voyez l’un de ces états, n’installez pas la version sauf si le propriétaire
résout le problème ou si la modération la rétablit.

Les propriétaires peuvent toujours voir des diagnostics pour leurs propres listings mis en attente ou masqués. Ces
diagnostics aident à expliquer ce qui s’est passé et ce qui doit changer avant que le
listing puisse revenir sur les surfaces publiques.

## Bannissements et réputation du compte

Les comptes qui enfreignent la politique ClawHub peuvent perdre l’accès à la publication. Les abus graves peuvent
entraîner des bannissements de compte, la révocation de tokens, du contenu masqué ou des listings supprimés.
Les signaux de pression d’abus des éditeurs sont vérifiés quotidiennement. Les signaux qui atteignent
le seuil de bannissement potentiel de ClawHub peuvent déclencher un avertissement automatique. Si l’analyse
éligible suivante après la date limite de l’avertissement place toujours l’éditeur dans le
seuil de bannissement potentiel, ClawHub peut appliquer automatiquement l’action sur le compte.
Les signaux de vérification à confiance plus faible et temporellement bornés restent en dehors de l’application
automatique.

Les comptes supprimés, bannis ou désactivés ne peuvent pas utiliser de tokens d’API ClawHub. Si l’authentification CLI
commence à échouer après une action sur le compte, connectez-vous à l’interface web pour examiner l’état du compte.
Si la connexion ou l’accès CLI normal est bloqué par un bannissement ou un compte désactivé,
utilisez le [formulaire d’appel ClawHub](https://appeals.openclaw.ai/) pour un examen de récupération.

Si un e-mail déclenché par un scanner désigne une version de Skill ou de Plugin comme malveillante,
téléchargez les résultats d’analyse stockés pour la version soumise bloquée :
`clawhub scan download <slug> --version <version>`. Pour les Plugins, ajoutez
`--kind plugin`. Examinez la sortie d’analyse, corrigez le listing, incrémentez le numéro de version
et téléversez la version corrigée.

## Conseils pour les éditeurs

Pour réduire les faux positifs et améliorer la confiance des utilisateurs :

- gardez les noms, résumés, tags et journaux de modifications exacts
- déclarez les variables d’environnement et autorisations requises
- évitez les commandes d’installation obscurcies
- liez vers le source lorsque c’est possible
- utilisez des essais à blanc avant de publier des Plugins
- répondez clairement si des utilisateurs ou modérateurs posent des questions sur le comportement d’une version
