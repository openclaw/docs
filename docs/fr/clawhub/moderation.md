---
read_when:
    - Signaler un Skill, un Plugin ou un paquet
    - Récupérer une annonce retenue, masquée ou bloquée
    - Comprendre la modération, les bannissements ou le statut du compte ClawHub
sidebarTitle: Moderation and Account Safety
summary: Fonctionnement des signalements ClawHub, des mises en attente de modération, des annonces masquées, des bannissements et de l’état du compte.
title: Modération et sécurité du compte
x-i18n:
    generated_at: "2026-07-01T18:10:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Modération et sécurité des comptes

ClawHub est ouvert à la publication, mais les surfaces de découverte publique et d’installation ont tout de même besoin de garde-fous. Les signalements, les mises en attente de modération, les listings masqués et les actions sur les comptes aident à protéger les utilisateurs lorsqu’une version ou un compte semble dangereux, trompeur ou non conforme aux règles.

Cette page couvre la modération et le statut des comptes. Pour les libellés d’audit tels que `Pass`, `Review`, `Warn`, `Malicious`, ainsi que le niveau de risque, consultez [Audits de sécurité](/clawhub/security-audits).

Voir aussi [Sécurité](/clawhub/security) et [Utilisation acceptable](/clawhub/acceptable-usage). Pour les préoccupations liées au droit d’auteur ou à d’autres droits de contenu, utilisez [Demandes relatives aux droits de contenu](/clawhub/content-rights).

## Signalements

Les utilisateurs connectés peuvent signaler des Skills, des plugins et des packages.

Utilisez les signalements ClawHub uniquement pour du contenu de marketplace dangereux, par exemple :

- listings malveillants
- métadonnées trompeuses
- identifiants ou exigences d’autorisation non déclarés
- instructions d’installation suspectes
- usurpation d’identité
- enregistrements de mauvaise foi ou usage abusif de marque
- contenu qui enfreint l’[Utilisation acceptable](/clawhub/acceptable-usage)

Utilisez le bouton **Signaler le Skill** sur une page de Skill, ou la commande/API de signalement de package pour les packages.

N’utilisez pas les signalements ClawHub pour les vulnérabilités dans le code source propre d’un Skill ou d’un plugin tiers. Signalez-les directement à l’éditeur ou au dépôt source lié depuis le listing. ClawHub ne maintient pas et ne corrige pas le code des Skills ou plugins tiers.

Les GitHub Security Advisories pour `openclaw/clawhub` concernent les vulnérabilités dans ClawHub lui-même. Les exemples incluent les bogues dans le site web, l’API, la CLI, le registre, l’authentification, l’analyse, la modération ou les frontières de confiance de téléchargement/installation. N’utilisez pas les advisories ClawHub pour les vulnérabilités dans des Skills ou plugins tiers.

Les bons signalements sont précis et exploitables. L’abus du système de signalement peut lui-même entraîner une action sur le compte.

## Revendications d’organisation et d’espace de noms

Les litiges portant sur la propriété d’une organisation, d’une marque, d’un périmètre de package, d’un identifiant de propriétaire ou d’un espace de noms doivent utiliser le processus [Revendications d’organisation et d’espace de noms](/clawhub/namespace-claims), et non le flux de signalement intégré au produit ni le formulaire d’appel de compte.

Utilisez ce processus lorsque vous avez besoin que l’équipe ClawHub examine des preuves non sensibles indiquant qu’un espace de noms doit être réservé, transféré, renommé, masqué, mis en quarantaine, associé à un alias ou autrement examiné. N’incluez pas de secrets, de documents privés, de fichiers juridiques privés, de pièces d’identité personnelles, de jetons d’API ni de jetons de défi DNS dans une issue publique.

## Mises en attente de modération

Certaines découvertes graves ou certains problèmes de conformité peuvent placer un éditeur ou un listing sous mise en attente de modération. Lorsque cela se produit, le contenu concerné peut être masqué de la découverte publique, ou les publications futures peuvent commencer masquées jusqu’à l’examen du problème.

Les mises en attente de modération visent à protéger les utilisateurs pendant que ClawHub résout les cas à haut risque. Elles peuvent également être levées lorsqu’un faux positif est confirmé.

## Listings masqués ou bloqués

Un listing peut être mis en attente, masqué, mis en quarantaine, révoqué ou autrement indisponible sur les surfaces d’installation publiques.

Si vous voyez l’un de ces états, n’installez pas la version sauf si le propriétaire résout le problème ou si la modération la rétablit.

Les propriétaires peuvent toujours voir des diagnostics pour leurs propres listings mis en attente ou masqués. Ces diagnostics aident à expliquer ce qui s’est passé et ce qui doit changer avant que le listing puisse revenir sur les surfaces publiques.

## Bannissements et statut du compte

Les comptes qui enfreignent la politique de ClawHub peuvent perdre l’accès à la publication. Les abus graves peuvent entraîner des bannissements de compte, la révocation de jetons, du contenu masqué ou des listings supprimés. Les signaux de pression d’abus des éditeurs sont vérifiés quotidiennement. Les signaux qui atteignent le seuil de bannissement potentiel de ClawHub peuvent déclencher un avertissement automatique. Si le prochain scan éligible après l’échéance de l’avertissement place toujours l’éditeur dans le seuil de bannissement potentiel, ClawHub peut appliquer automatiquement l’action sur le compte. Les signaux d’examen à plus faible confiance et limités dans le temps restent exclus de l’application automatique.

Les comptes supprimés, bannis ou désactivés ne peuvent pas utiliser les jetons d’API ClawHub. Si l’authentification CLI commence à échouer après une action sur le compte, connectez-vous à l’interface web pour examiner l’état du compte. Si la connexion ou l’accès CLI normal est bloqué par un bannissement ou un compte désactivé, utilisez le [formulaire d’appel ClawHub](https://appeals.openclaw.ai/) pour une demande de récupération.

Si un e-mail déclenché par un scanner désigne une version de Skill ou de plugin comme malveillante, téléchargez les résultats de scan stockés pour la version soumise bloquée :
`clawhub scan download <slug> --version <version>`. Pour les plugins, ajoutez `--kind plugin`. Examinez la sortie du scan, corrigez le listing, incrémentez le numéro de version et téléversez la version corrigée.

## Conseils aux éditeurs

Pour réduire les faux positifs et améliorer la confiance des utilisateurs :

- garder les noms, résumés, tags et changelogs exacts
- déclarer les variables d’environnement et autorisations requises
- éviter les commandes d’installation obfusquées
- créer un lien vers le code source lorsque c’est possible
- utiliser des essais à blanc avant de publier des plugins
- répondre clairement si des utilisateurs ou des modérateurs posent des questions sur le comportement d’une version
