---
read_when:
    - Signaler une Skill, un Plugin ou un package
    - Récupération après une annonce retenue, masquée ou bloquée
    - Comprendre la modération ClawHub, les bannissements ou le statut du compte
sidebarTitle: Moderation and Account Safety
summary: Fonctionnement des signalements ClawHub, des mises en attente pour modération, des listes masquées, des bannissements et du statut du compte.
title: Sécurité de la modération et des comptes
x-i18n:
    generated_at: "2026-06-27T17:16:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Modération et sécurité des comptes

ClawHub est ouvert à la publication, mais les surfaces de découverte publique et d’installation ont encore besoin de garde-fous. Les signalements, les mises en attente de modération, les listings masqués et les actions sur les comptes aident à protéger les utilisateurs lorsqu’une version ou un compte semble dangereux, trompeur ou contraire aux règles.

Cette page couvre la modération et la situation des comptes. Pour les libellés d’audit comme `Pass`, `Review`, `Warn`, `Malicious` et le niveau de risque, consultez [Audits de sécurité](/fr/clawhub/security-audits).

Voir aussi [Sécurité](/fr/clawhub/security) et [Utilisation acceptable](/fr/clawhub/acceptable-usage). Pour les préoccupations liées au droit d’auteur ou à d’autres droits sur le contenu, utilisez [Demandes relatives aux droits de contenu](/fr/clawhub/content-rights).

## Signalements

Les utilisateurs connectés peuvent signaler des Skills, des plugins et des packages.

Utilisez les signalements ClawHub uniquement pour le contenu de marketplace dangereux, par exemple :

- listings malveillants
- métadonnées trompeuses
- identifiants ou exigences d’autorisation non déclarés
- instructions d’installation suspectes
- usurpation d’identité
- inscriptions de mauvaise foi ou usage abusif de marques
- contenu qui enfreint l’[Utilisation acceptable](/fr/clawhub/acceptable-usage)

Utilisez le bouton **Signaler le Skill** sur une page de Skill, ou la commande/l’API de signalement de package pour les packages.

N’utilisez pas les signalements ClawHub pour les vulnérabilités dans le code source propre à un Skill tiers ou à un plugin tiers. Signalez-les directement à l’éditeur ou au dépôt source lié depuis le listing. ClawHub ne maintient ni ne corrige le code de Skills ou de plugins tiers.

Les GitHub Security Advisories pour `openclaw/clawhub` concernent les vulnérabilités dans ClawHub lui-même. Les exemples incluent des bugs dans le site web, l’API, la CLI, le registre, l’authentification, l’analyse, la modération ou les limites de confiance liées au téléchargement/à l’installation. N’utilisez pas les advisories ClawHub pour les vulnérabilités dans des Skills ou plugins tiers.

Les bons signalements sont précis et exploitables. L’abus de signalements peut lui-même entraîner une action sur le compte.

## Revendications d’organisation et d’espace de noms

Les litiges concernant la propriété d’une organisation, d’une marque, d’une portée de package, d’un identifiant de propriétaire ou d’un espace de noms doivent utiliser le processus [Revendications d’organisation et d’espace de noms](/fr/clawhub/namespace-claims), et non le flux de signalement intégré au produit ni le formulaire d’appel de compte.

Utilisez ce processus lorsque vous avez besoin que l’équipe ClawHub examine des preuves non sensibles indiquant qu’un espace de noms doit être réservé, transféré, renommé, masqué, mis en quarantaine, associé à un alias ou autrement examiné. N’incluez pas de secrets, de documents privés, de dossiers juridiques privés, de documents d’identité personnels, de jetons d’API ni de jetons de défi DNS dans une issue publique.

## Mises en attente de modération

Certaines constatations graves ou certains problèmes de conformité aux règles peuvent placer un éditeur ou un listing sous mise en attente de modération. Dans ce cas, le contenu concerné peut être masqué de la découverte publique, ou les futures publications peuvent commencer masquées jusqu’à ce que le problème soit examiné.

Les mises en attente de modération visent à protéger les utilisateurs pendant que ClawHub résout les cas à haut risque. Elles peuvent aussi être levées lorsqu’un faux positif est confirmé.

## Listings masqués ou bloqués

Un listing peut être retenu, masqué, mis en quarantaine, révoqué ou autrement indisponible sur les surfaces d’installation publiques.

Si vous voyez l’un de ces états, n’installez pas la version sauf si le propriétaire résout le problème ou si la modération la rétablit.

Les propriétaires peuvent toujours voir les diagnostics de leurs propres listings retenus ou masqués. Ces diagnostics aident à expliquer ce qui s’est passé et ce qui doit changer avant que le listing puisse revenir sur les surfaces publiques.

## Bannissements et situation du compte

Les comptes qui enfreignent les règles de ClawHub peuvent perdre l’accès à la publication. Les abus graves peuvent entraîner des bannissements de compte, la révocation de jetons, du contenu masqué ou des listings supprimés. Les signaux de pression d’abus des éditeurs sont vérifiés quotidiennement. Les signaux qui atteignent le seuil de bannissement potentiel de ClawHub peuvent déclencher un avertissement automatique. Si la prochaine analyse éligible après l’échéance de l’avertissement place encore l’éditeur dans le seuil de bannissement potentiel, ClawHub peut appliquer automatiquement l’action sur le compte. Les signaux d’examen temporel moins fiables et bornés restent exclus de l’application automatique.

Les comptes supprimés, bannis ou désactivés ne peuvent pas utiliser les jetons d’API ClawHub. Si l’authentification CLI commence à échouer après une action sur le compte, connectez-vous à l’interface web pour examiner l’état du compte. Si la connexion ou l’accès CLI normal est bloqué par un bannissement ou un compte désactivé, utilisez le [formulaire d’appel ClawHub](https://appeals.openclaw.ai/) pour une révision de récupération.

Si un e-mail déclenché par un analyseur désigne une version de Skill ou de plugin comme malveillante, téléchargez les résultats d’analyse stockés pour la version soumise bloquée : `clawhub scan download <slug> --version <version>`. Pour les plugins, ajoutez `--kind plugin`. Examinez la sortie de l’analyse, corrigez le listing, incrémentez le numéro de version et téléversez la version corrigée.

## Conseils aux éditeurs

Pour réduire les faux positifs et améliorer la confiance des utilisateurs :

- gardez les noms, résumés, tags et changelogs exacts
- déclarez les variables d’environnement et autorisations requises
- évitez les commandes d’installation obfusquées
- créez un lien vers la source lorsque c’est possible
- utilisez des essais à blanc avant de publier des plugins
- répondez clairement si des utilisateurs ou des modérateurs posent des questions sur le comportement d’une version
