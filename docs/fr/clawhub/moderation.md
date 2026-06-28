---
read_when:
    - Signaler un skill, Plugin ou package
    - Récupération après une annonce retenue, masquée ou bloquée
    - Comprendre la modération ClawHub, les bannissements ou le statut du compte
sidebarTitle: Moderation and Account Safety
summary: Fonctionnement des signalements ClawHub, des blocages de modération, des listings masqués, des bannissements et de l’état des comptes.
title: Modération et sécurité des comptes
x-i18n:
    generated_at: "2026-06-28T05:06:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Modération et sécurité des comptes

ClawHub est ouvert à la publication, mais les surfaces de découverte publique et d’installation ont toujours
besoin de garde-fous. Les signalements, les mises en attente de modération, les listes masquées et les actions sur les comptes
aident à protéger les utilisateurs lorsqu’une version ou un compte semble dangereux, trompeur ou non conforme
à la politique.

Cette page couvre la modération et l’état des comptes. Pour les étiquettes d’audit comme
`Pass`, `Review`, `Warn`, `Malicious` et le niveau de risque, consultez
[Audits de sécurité](/fr/clawhub/security-audits).

Voir aussi [Sécurité](/fr/clawhub/security) et
[Utilisation acceptable](/fr/clawhub/acceptable-usage). Pour les préoccupations relatives au droit d’auteur ou à d’autres
droits sur le contenu, utilisez [Demandes relatives aux droits de contenu](/fr/clawhub/content-rights).

## Signalements

Les utilisateurs connectés peuvent signaler des skills, des plugins et des packages.

Utilisez les signalements ClawHub uniquement pour du contenu de place de marché dangereux, comme :

- listes malveillantes
- métadonnées trompeuses
- identifiants ou exigences d’autorisation non déclarés
- instructions d’installation suspectes
- usurpation d’identité
- enregistrements de mauvaise foi ou usage abusif de marque
- contenu qui enfreint l’[Utilisation acceptable](/fr/clawhub/acceptable-usage)

Utilisez le bouton **Signaler le skill** sur une page de skill, ou la commande/API de signalement
de package pour les packages.

N’utilisez pas les signalements ClawHub pour les vulnérabilités dans le code source propre à un skill ou
plugin tiers. Signalez-les directement à l’éditeur ou au dépôt source
lié depuis la liste. ClawHub ne maintient ni ne corrige
le code de skills ou plugins tiers.

Les GitHub Security Advisories pour `openclaw/clawhub` concernent les vulnérabilités dans
ClawHub lui-même. Les exemples incluent des bugs dans le site web, l’API, la CLI, le registre, l’authentification,
l’analyse, la modération ou les frontières de confiance du téléchargement/de l’installation. N’utilisez pas les
advisories ClawHub pour les vulnérabilités dans des skills ou plugins tiers.

Les bons signalements sont précis et exploitables. L’abus du système de signalement peut lui-même entraîner une
action sur le compte.

## Revendications d’organisation et d’espace de noms

Les litiges concernant la propriété d’une organisation, d’une marque, d’une portée de package, d’un identifiant propriétaire ou d’un espace de noms doivent
utiliser le processus [Revendications d’organisation et d’espace de noms](/fr/clawhub/namespace-claims), et non le
flux de signalement dans le produit ni le formulaire d’appel de compte.

Utilisez ce processus lorsque vous avez besoin que l’équipe ClawHub examine des preuves non sensibles indiquant qu’un
espace de noms devrait être réservé, transféré, renommé, masqué, mis en quarantaine, recevoir un alias
ou être examiné autrement. N’incluez pas de secrets, documents privés, dossiers juridiques privés,
pièces d’identité personnelles, jetons d’API ni jetons de défi DNS dans une
issue publique.

## Mises en attente de modération

Certaines constatations graves ou certains problèmes de politique peuvent placer un éditeur ou une liste sous une
mise en attente de modération. Dans ce cas, le contenu concerné peut être masqué de la
découverte publique, ou les futures publications peuvent commencer masquées jusqu’à l’examen du problème.

Les mises en attente de modération visent à protéger les utilisateurs pendant que ClawHub résout les cas
à haut risque. Elles peuvent aussi être levées lorsqu’un faux positif est confirmé.

## Listes masquées ou bloquées

Une liste peut être mise en attente, masquée, mise en quarantaine, révoquée ou autrement indisponible sur
les surfaces d’installation publiques.

Si vous voyez l’un de ces états, n’installez pas la version à moins que le propriétaire
résolve le problème ou que la modération la restaure.

Les propriétaires peuvent toujours voir les diagnostics de leurs propres listes mises en attente ou masquées. Ces
diagnostics aident à expliquer ce qui s’est passé et ce qui doit changer avant que la
liste puisse revenir sur les surfaces publiques.

## Bannissements et état du compte

Les comptes qui enfreignent la politique ClawHub peuvent perdre l’accès à la publication. Les abus graves peuvent
entraîner des bannissements de compte, la révocation de jetons, du contenu masqué ou des listes supprimées.
Les signaux de pression d’abus des éditeurs sont vérifiés quotidiennement. Les signaux qui atteignent
le seuil de bannissement potentiel de ClawHub peuvent déclencher un avertissement automatique. Si l’analyse
éligible suivante après l’échéance de l’avertissement place toujours l’éditeur dans le
seuil de bannissement potentiel, ClawHub peut appliquer automatiquement l’action sur le compte.
Les signaux de moindre confiance et de revue temporelle limitée restent exclus de l’application
automatique.

Les comptes supprimés, bannis ou désactivés ne peuvent pas utiliser les jetons d’API ClawHub. Si l’authentification CLI
commence à échouer après une action sur le compte, connectez-vous à l’interface web pour examiner l’état du compte.
Si la connexion ou l’accès CLI normal est bloqué par un bannissement ou un compte désactivé,
utilisez le [formulaire d’appel ClawHub](https://appeals.openclaw.ai/) pour une revue de récupération.

Si un e-mail déclenché par un scanner nomme une version de skill ou de plugin comme malveillante,
téléchargez les résultats d’analyse stockés pour la version soumise bloquée :
`clawhub scan download <slug> --version <version>`. Pour les plugins, ajoutez
`--kind plugin`. Examinez la sortie d’analyse, corrigez la liste, incrémentez le numéro de version
et téléversez la version corrigée.

## Conseils aux éditeurs

Pour réduire les faux positifs et améliorer la confiance des utilisateurs :

- garder les noms, résumés, tags et journaux des modifications exacts
- déclarer les variables d’environnement et autorisations requises
- éviter les commandes d’installation obfusquées
- ajouter un lien vers la source lorsque possible
- utiliser des essais à blanc avant de publier des plugins
- répondre clairement si les utilisateurs ou les modérateurs posent des questions sur le comportement d’une version
