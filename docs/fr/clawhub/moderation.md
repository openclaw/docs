---
read_when:
    - Signaler un skill, un plugin ou un package
    - Récupération après une annonce suspendue, masquée ou bloquée
    - Comprendre la modération, les bannissements ou l’état du compte ClawHub
sidebarTitle: Moderation and Account Safety
summary: Fonctionnement des signalements ClawHub, des mises en attente de modération, des annonces masquées, des bannissements et de l’état du compte.
title: Modération et sécurité du compte
x-i18n:
    generated_at: "2026-06-30T22:13:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Modération et sécurité des comptes

ClawHub est ouvert à la publication, mais les surfaces de découverte publique et d’installation ont toujours besoin de garde-fous. Les signalements, les mises en attente de modération, les annonces masquées et les actions sur les comptes aident à protéger les utilisateurs lorsqu’une version ou un compte semble dangereux, trompeur ou non conforme aux règles.

Cette page couvre la modération et le statut des comptes. Pour les étiquettes d’audit comme `Pass`, `Review`, `Warn`, `Malicious` et le niveau de risque, consultez [Audits de sécurité](/clawhub/security-audits).

Voir aussi [Sécurité](/clawhub/security) et [Utilisation acceptable](/clawhub/acceptable-usage). Pour les questions de droits d’auteur ou autres droits liés au contenu, utilisez [Demandes relatives aux droits de contenu](/clawhub/content-rights).

## Signalements

Les utilisateurs connectés peuvent signaler des Skills, des plugins et des paquets.

Utilisez les signalements ClawHub uniquement pour du contenu de marketplace dangereux, par exemple :

- annonces malveillantes
- métadonnées trompeuses
- identifiants ou exigences d’autorisation non déclarés
- instructions d’installation suspectes
- usurpation d’identité
- enregistrements de mauvaise foi ou usage abusif de marque
- contenu qui enfreint l’[Utilisation acceptable](/clawhub/acceptable-usage)

Utilisez le bouton **Signaler le Skill** sur une page de Skill, ou la commande/l’API de signalement de paquet pour les paquets.

N’utilisez pas les signalements ClawHub pour des vulnérabilités dans le code source propre d’un Skill ou d’un plugin tiers. Signalez-les directement à l’éditeur ou au dépôt source indiqué dans l’annonce. ClawHub ne maintient pas et ne corrige pas le code de Skills ou de plugins tiers.

Les GitHub Security Advisories pour `openclaw/clawhub` concernent les vulnérabilités dans ClawHub lui-même. Les exemples incluent des bugs dans le site web, l’API, la CLI, le registre, l’authentification, l’analyse, la modération ou les frontières de confiance liées au téléchargement/à l’installation. N’utilisez pas les avis ClawHub pour des vulnérabilités dans des Skills ou plugins tiers.

Les bons signalements sont précis et exploitables. L’abus du système de signalement peut lui-même entraîner une action sur le compte.

## Revendications d’organisation et d’espace de noms

Les litiges de propriété concernant une organisation, une marque, une portée de paquet, un identifiant de propriétaire ou un espace de noms doivent utiliser le processus [Revendications d’organisation et d’espace de noms](/clawhub/namespace-claims), et non le flux de signalement dans le produit ni le formulaire d’appel de compte.

Utilisez ce processus lorsque vous avez besoin que l’équipe ClawHub examine une preuve non sensible indiquant qu’un espace de noms devrait être réservé, transféré, renommé, masqué, mis en quarantaine, associé à un alias ou autrement examiné. N’incluez pas de secrets, documents privés, dossiers juridiques privés, pièces d’identité, jetons d’API ni jetons de challenge DNS dans une issue publique.

## Mises en attente de modération

Certains constats graves ou problèmes de politique peuvent placer un éditeur ou une annonce en mise en attente de modération. Lorsque cela se produit, le contenu concerné peut être masqué de la découverte publique, ou les futures publications peuvent commencer masquées jusqu’à ce que le problème soit examiné.

Les mises en attente de modération visent à protéger les utilisateurs pendant que ClawHub résout les cas à haut risque. Elles peuvent aussi être levées lorsqu’un faux positif est confirmé.

## Annonces masquées ou bloquées

Une annonce peut être mise en attente, masquée, mise en quarantaine, révoquée ou autrement indisponible sur les surfaces d’installation publiques.

Si vous voyez l’un de ces états, n’installez pas la version, sauf si le propriétaire résout le problème ou si la modération la rétablit.

Les propriétaires peuvent toujours voir les diagnostics de leurs propres annonces mises en attente ou masquées. Ces diagnostics aident à expliquer ce qui s’est passé et ce qui doit changer avant que l’annonce puisse revenir sur les surfaces publiques.

## Bannissements et statut du compte

Les comptes qui enfreignent la politique ClawHub peuvent perdre l’accès à la publication. Les abus graves peuvent entraîner des bannissements de compte, la révocation de jetons, du contenu masqué ou des annonces supprimées. Les signaux de pression d’abus des éditeurs sont vérifiés quotidiennement. Les signaux qui atteignent le seuil de bannissement potentiel de ClawHub peuvent déclencher un avertissement automatique. Si l’analyse admissible suivante après la date limite de l’avertissement place toujours l’éditeur dans le seuil de bannissement potentiel, ClawHub peut appliquer automatiquement l’action sur le compte. Les signaux de revue temporelle à confiance plus faible et bornée restent en dehors de l’application automatique.

Les comptes supprimés, bannis ou désactivés ne peuvent pas utiliser les jetons d’API ClawHub. Si l’authentification CLI commence à échouer après une action sur le compte, connectez-vous à l’interface web pour consulter l’état du compte. Si la connexion ou l’accès CLI normal est bloqué par un bannissement ou un compte désactivé, utilisez le [formulaire d’appel ClawHub](https://appeals.openclaw.ai/) pour une revue de récupération.

Si un e-mail déclenché par un scanner désigne une version de Skill ou de plugin comme malveillante, téléchargez les résultats d’analyse stockés pour la version soumise bloquée :
`clawhub scan download <slug> --version <version>`. Pour les plugins, ajoutez
`--kind plugin`. Examinez la sortie d’analyse, corrigez l’annonce, incrémentez le numéro de version et téléversez la version corrigée.

## Conseils aux éditeurs

Pour réduire les faux positifs et améliorer la confiance des utilisateurs :

- gardez les noms, résumés, balises et journaux des modifications exacts
- déclarez les variables d’environnement et autorisations requises
- évitez les commandes d’installation obfusquées
- créez un lien vers le code source lorsque c’est possible
- utilisez des simulations avant de publier des plugins
- répondez clairement si des utilisateurs ou des modérateurs posent des questions sur le comportement d’une version
