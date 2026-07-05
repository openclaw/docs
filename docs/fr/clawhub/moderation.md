---
read_when:
    - Signalement d’une Skill, d’un plugin ou d’un package
    - Récupération d’un listing retenu, masqué ou bloqué
    - Comprendre la modération, les bannissements ou l’état du compte ClawHub
sidebarTitle: Moderation and Account Safety
summary: Fonctionnement des signalements ClawHub, des blocages de modération, des annonces masquées, des bannissements et du statut du compte.
title: Modération et sécurité du compte
x-i18n:
    generated_at: "2026-07-05T05:03:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Modération et sécurité des comptes

ClawHub est ouvert à la publication, mais les surfaces de découverte publique et d'installation ont toujours besoin de garde-fous. Les signalements, les suspensions de modération, les listings masqués et les actions sur les comptes aident à protéger les utilisateurs lorsqu'une version ou un compte semble dangereux, trompeur ou non conforme aux règles.

Cette page couvre la modération et l'état des comptes. Pour les libellés d'audit tels que `Pass`, `Review`, `Warn`, `Malicious` et le niveau de risque, consultez [Audits de sécurité](/clawhub/security-audits).

Voir aussi [Sécurité](/clawhub/security) et [Usage acceptable](/clawhub/acceptable-usage). Pour les préoccupations relatives au droit d'auteur ou à d'autres droits sur le contenu, utilisez [Demandes relatives aux droits de contenu](/clawhub/content-rights).

## Signalements

Les utilisateurs connectés peuvent signaler des Skills, des plugins et des paquets.

Utilisez les signalements ClawHub uniquement pour du contenu de place de marché dangereux, par exemple :

- listings malveillants
- métadonnées trompeuses
- identifiants ou exigences d'autorisation non déclarés
- instructions d'installation suspectes
- usurpation d'identité
- enregistrements de mauvaise foi ou usage abusif de marques
- contenu qui enfreint l'[Usage acceptable](/clawhub/acceptable-usage)

Utilisez le bouton **Signaler le Skill** sur une page de Skill, ou la commande/API de signalement des paquets pour les paquets.

N'utilisez pas les signalements ClawHub pour les vulnérabilités dans le code source propre d'un Skill ou d'un plugin tiers. Signalez-les directement à l'éditeur ou au dépôt source lié depuis le listing. ClawHub ne maintient ni ne corrige le code de Skills ou de plugins tiers.

Les avis de sécurité GitHub pour `openclaw/clawhub` concernent les vulnérabilités dans ClawHub lui-même. Les exemples incluent des bogues dans le site web, l'API, la CLI, le registre, l'authentification, l'analyse, la modération ou les frontières de confiance de téléchargement/installation. N'utilisez pas les avis ClawHub pour les vulnérabilités dans des Skills ou plugins tiers.

Les bons signalements sont précis et exploitables. L'abus de signalements peut lui-même entraîner une action sur le compte.

## Réclamations d'organisation et d'espace de noms

Les litiges concernant la propriété d'une organisation, d'une marque, d'une portée de paquet, d'un identifiant de propriétaire ou d'un espace de noms doivent utiliser le processus [Réclamations d'organisation et d'espace de noms](/clawhub/namespace-claims), et non le flux de signalement dans le produit ni le formulaire d'appel de compte.

Utilisez ce processus lorsque vous avez besoin que l'équipe ClawHub examine une preuve non sensible indiquant qu'un espace de noms doit être réservé, transféré, renommé, masqué, mis en quarantaine, associé à un alias ou examiné autrement. N'incluez pas de secrets, documents privés, dossiers juridiques privés, documents d'identité personnels, jetons d'API ni jetons de défi DNS dans un ticket public.

## Suspensions de modération

Certaines conclusions graves ou certains problèmes de conformité aux règles peuvent placer un éditeur ou un listing sous suspension de modération. Lorsque cela se produit, le contenu concerné peut être masqué de la découverte publique, ou les futures publications peuvent commencer masquées jusqu'à ce que le problème soit examiné.

Les suspensions de modération sont destinées à protéger les utilisateurs pendant que ClawHub résout les cas à haut risque. Elles peuvent aussi être levées lorsqu'un faux positif est confirmé.

## Listings masqués ou bloqués

Un listing peut être suspendu, masqué, mis en quarantaine, révoqué ou autrement indisponible sur les surfaces d'installation publiques.

Si vous voyez l'un de ces états, n'installez pas la version sauf si le propriétaire résout le problème ou si la modération la restaure.

Les propriétaires peuvent toujours voir des diagnostics pour leurs propres listings suspendus ou masqués. Ces diagnostics aident à expliquer ce qui s'est passé et ce qui doit changer avant que le listing puisse revenir sur les surfaces publiques.

## Bannissements et état du compte

Les comptes qui enfreignent les règles de ClawHub peuvent perdre l'accès à la publication. Les abus graves peuvent entraîner des bannissements de compte, la révocation de jetons, du contenu masqué ou la suppression de listings. Les signaux de pression d'abus des éditeurs sont vérifiés quotidiennement. Les signaux qui atteignent le seuil de bannissement potentiel de ClawHub peuvent déclencher un avertissement automatique. Si l'analyse éligible suivante après l'échéance de l'avertissement place toujours l'éditeur dans le seuil de bannissement potentiel, ClawHub peut appliquer automatiquement l'action sur le compte. Les signaux d'examen temporels à plus faible confiance et bornés restent exclus de l'application automatique.

Les comptes supprimés, bannis ou désactivés ne peuvent pas utiliser de jetons d'API ClawHub. Si l'authentification CLI commence à échouer après une action sur le compte, connectez-vous à l'interface web pour examiner l'état du compte. Si la connexion ou l'accès CLI normal est bloqué par un bannissement ou un compte désactivé, utilisez le [formulaire d'appel ClawHub](https://appeals.openclaw.ai/) pour un examen de récupération.

Si un e-mail déclenché par un analyseur désigne une version de Skill ou de plugin comme malveillante, téléchargez les résultats d'analyse stockés pour la version soumise bloquée :
`clawhub scan download <slug> --version <version>`. Pour les plugins, ajoutez
`--kind plugin`. Examinez la sortie de l'analyse, corrigez le listing, incrémentez le numéro de version, puis téléversez la version corrigée.

## Conseils aux éditeurs

Pour réduire les faux positifs et améliorer la confiance des utilisateurs :

- gardez les noms, résumés, balises et journaux des modifications exacts
- déclarez les variables d'environnement et autorisations requises
- évitez les commandes d'installation obfusquées
- liez vers la source lorsque c'est possible
- utilisez des exécutions à blanc avant de publier des plugins
- répondez clairement si des utilisateurs ou des modérateurs posent des questions sur le comportement d'une version
