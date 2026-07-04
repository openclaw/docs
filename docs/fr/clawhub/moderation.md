---
read_when:
    - Signalement d’une Skill, d’un plugin ou d’un package
    - Récupération après un référencement retenu, masqué ou bloqué
    - Comprendre la modération ClawHub, les bannissements ou l’état du compte
sidebarTitle: Moderation and Account Safety
summary: Fonctionnement des signalements ClawHub, des mises en attente de modération, des listings masqués, des bannissements et de l’état des comptes.
title: Modération et sécurité du compte
x-i18n:
    generated_at: "2026-07-04T17:57:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Modération et sécurité des comptes

ClawHub est ouvert à la publication, mais les surfaces de découverte publique et d’installation ont tout de même besoin de garde-fous. Les signalements, blocages de modération, fiches masquées et actions sur les comptes aident à protéger les utilisateurs lorsqu’une version ou un compte semble dangereux, trompeur ou non conforme aux règles.

Cette page couvre la modération et la réputation des comptes. Pour les libellés d’audit comme `Pass`, `Review`, `Warn`, `Malicious` et le niveau de risque, consultez [Audits de sécurité](/clawhub/security-audits).

Voir aussi [Sécurité](/clawhub/security) et [Utilisation acceptable](/clawhub/acceptable-usage). Pour les préoccupations liées au droit d’auteur ou à d’autres droits sur le contenu, utilisez [Demandes relatives aux droits de contenu](/clawhub/content-rights).

## Signalements

Les utilisateurs connectés peuvent signaler des Skills, des plugins et des packages.

Utilisez les signalements ClawHub uniquement pour du contenu de place de marché dangereux, par exemple :

- fiches malveillantes
- métadonnées trompeuses
- identifiants ou exigences d’autorisations non déclarés
- instructions d’installation suspectes
- usurpation d’identité
- enregistrements de mauvaise foi ou usage abusif de marques
- contenu qui enfreint l’[Utilisation acceptable](/clawhub/acceptable-usage)

Utilisez le bouton **Signaler le Skill** sur une page de Skill, ou la commande/API de signalement de package pour les packages.

N’utilisez pas les signalements ClawHub pour les vulnérabilités dans le code source propre d’un Skill ou plugin tiers. Signalez-les directement à l’éditeur ou au dépôt source lié depuis la fiche. ClawHub ne maintient ni ne corrige le code de Skills ou plugins tiers.

Les GitHub Security Advisories pour `openclaw/clawhub` concernent les vulnérabilités dans ClawHub lui-même. Exemples : bogues dans le site web, l’API, la CLI, le registre, l’authentification, l’analyse, la modération ou les frontières de confiance de téléchargement/installation. N’utilisez pas les avis ClawHub pour les vulnérabilités dans des Skills ou plugins tiers.

Les bons signalements sont précis et exploitables. L’abus du signalement peut lui-même entraîner une action sur le compte.

## Revendications d’organisation et d’espace de noms

Les litiges relatifs à la propriété d’une organisation, d’une marque, d’un périmètre de package, d’un identifiant de propriétaire ou d’un espace de noms doivent utiliser le processus [Revendications d’organisation et d’espace de noms](/clawhub/namespace-claims), et non le flux de signalement intégré au produit ni le formulaire d’appel de compte.

Utilisez ce processus lorsque vous avez besoin que l’équipe ClawHub examine une preuve non sensible indiquant qu’un espace de noms devrait être réservé, transféré, renommé, masqué, mis en quarantaine, aliasé ou autrement examiné. N’incluez pas de secrets, documents privés, dossiers juridiques privés, pièces d’identité, jetons d’API ou jetons de défi DNS dans une issue publique.

## Blocages de modération

Certains constats graves ou problèmes de conformité aux règles peuvent placer un éditeur ou une fiche sous blocage de modération. Lorsque cela se produit, le contenu concerné peut être masqué de la découverte publique, ou les futures publications peuvent commencer masquées jusqu’à l’examen du problème.

Les blocages de modération visent à protéger les utilisateurs pendant que ClawHub résout les cas à haut risque. Ils peuvent aussi être levés lorsqu’un faux positif est confirmé.

## Fiches masquées ou bloquées

Une fiche peut être retenue, masquée, mise en quarantaine, révoquée ou autrement indisponible sur les surfaces d’installation publiques.

Si vous voyez l’un de ces états, n’installez pas la version sauf si le propriétaire résout le problème ou si la modération la restaure.

Les propriétaires peuvent toujours voir les diagnostics de leurs propres fiches retenues ou masquées. Ces diagnostics aident à expliquer ce qui s’est passé et ce qui doit changer avant que la fiche puisse revenir sur les surfaces publiques.

## Bannissements et réputation du compte

Les comptes qui enfreignent les règles ClawHub peuvent perdre l’accès à la publication. Les abus graves peuvent entraîner des bannissements de compte, la révocation de jetons, du contenu masqué ou des fiches supprimées. Les signaux de pression d’abus des éditeurs sont vérifiés quotidiennement. Les signaux qui atteignent le seuil de bannissement potentiel de ClawHub peuvent déclencher un avertissement automatique. Si l’analyse éligible suivante après la date limite de l’avertissement place toujours l’éditeur dans le seuil de bannissement potentiel, ClawHub peut appliquer automatiquement l’action sur le compte. Les signaux d’examen temporel à plus faible confiance et bornés restent exclus de l’application automatique.

Les comptes supprimés, bannis ou désactivés ne peuvent pas utiliser de jetons d’API ClawHub. Si l’authentification CLI commence à échouer après une action sur le compte, connectez-vous à l’interface web pour examiner l’état du compte. Si la connexion ou l’accès CLI normal est bloqué par un bannissement ou un compte désactivé, utilisez le [formulaire d’appel ClawHub](https://appeals.openclaw.ai/) pour une revue de récupération.

Si un e-mail déclenché par un scanner désigne une version de Skill ou de plugin comme malveillante, téléchargez les résultats d’analyse stockés pour la version soumise bloquée :
`clawhub scan download <slug> --version <version>`. Pour les plugins, ajoutez `--kind plugin`. Examinez la sortie d’analyse, corrigez la fiche, incrémentez le numéro de version et téléversez la version corrigée.

## Conseils aux éditeurs

Pour réduire les faux positifs et améliorer la confiance des utilisateurs :

- garder les noms, résumés, étiquettes et journaux des modifications exacts
- déclarer les variables d’environnement et autorisations requises
- éviter les commandes d’installation obscurcies
- créer un lien vers la source lorsque c’est possible
- utiliser des simulations avant de publier des plugins
- répondre clairement si les utilisateurs ou les modérateurs posent des questions sur le comportement d’une version
