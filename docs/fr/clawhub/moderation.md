---
read_when:
    - Signaler un skill, un plugin ou un package
    - Récupération après une annonce mise en attente, masquée ou bloquée
    - Comprendre la modération de ClawHub, les bannissements ou le statut du compte
sidebarTitle: Moderation and Account Safety
summary: Fonctionnement des signalements ClawHub, des mises en attente de modération, des listings masqués, des bannissements et de l’état du compte.
title: Modération et sécurité du compte
x-i18n:
    generated_at: "2026-07-02T00:52:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Modération et sécurité des comptes

ClawHub est ouvert à la publication, mais les surfaces de découverte publique et d’installation ont toujours
besoin de garde-fous. Les signalements, les mises en attente de modération, les annonces masquées et les actions sur les comptes
aident à protéger les utilisateurs lorsqu’une version ou un compte semble dangereux, trompeur ou non
conforme aux règles.

Cette page couvre la modération et l’état des comptes. Pour les libellés d’audit tels que
`Pass`, `Review`, `Warn`, `Malicious` et le niveau de risque, consultez
[Audits de sécurité](/clawhub/security-audits).

Voir aussi [Sécurité](/clawhub/security) et
[Utilisation acceptable](/clawhub/acceptable-usage). Pour les préoccupations liées au copyright ou à d’autres droits
sur le contenu, utilisez [Demandes relatives aux droits de contenu](/clawhub/content-rights).

## Signalements

Les utilisateurs connectés peuvent signaler des skills, des plugins et des packages.

Utilisez les signalements ClawHub uniquement pour le contenu de marketplace dangereux, par exemple :

- annonces malveillantes
- métadonnées trompeuses
- identifiants ou exigences d’autorisation non déclarés
- instructions d’installation suspectes
- usurpation d’identité
- enregistrements de mauvaise foi ou usage abusif de marques
- contenu qui enfreint l’[Utilisation acceptable](/clawhub/acceptable-usage)

Utilisez le bouton **Signaler la skill** sur une page de skill, ou la commande/API de signalement
de package pour les packages.

N’utilisez pas les signalements ClawHub pour les vulnérabilités dans le code source propre à une skill ou à un
plugin tiers. Signalez-les directement à l’éditeur ou au dépôt source
lié depuis l’annonce. ClawHub ne maintient ni ne corrige le code de
skills ou de plugins tiers.

Les GitHub Security Advisories pour `openclaw/clawhub` concernent les vulnérabilités de
ClawHub lui-même. Les exemples incluent les bugs dans le site web, l’API, la CLI, le registre, l’authentification,
l’analyse, la modération ou les limites de confiance du téléchargement/de l’installation. N’utilisez pas les advisories
ClawHub pour les vulnérabilités dans des skills ou plugins tiers.

Les bons signalements sont précis et exploitables. L’abus du système de signalement peut lui-même entraîner une
action sur le compte.

## Revendications d’organisation et d’espace de noms

Les litiges concernant une organisation, une marque, une portée de package, un identifiant de propriétaire ou la propriété d’un espace de noms doivent
utiliser le processus [Revendications d’organisation et d’espace de noms](/clawhub/namespace-claims), et non le
flux de signalement dans le produit ni le formulaire d’appel de compte.

Utilisez ce processus lorsque vous avez besoin que l’équipe ClawHub examine une preuve non sensible indiquant qu’un
espace de noms doit être réservé, transféré, renommé, masqué, mis en quarantaine, associé à un alias
ou examiné autrement. N’incluez pas de secrets, de documents privés, de dossiers juridiques privés,
de documents d’identité personnelle, de jetons d’API ni de jetons de défi DNS dans une
issue publique.

## Mises en attente de modération

Certaines constatations graves ou certains problèmes de règles peuvent placer un éditeur ou une annonce sous
mise en attente de modération. Lorsque cela se produit, le contenu concerné peut être masqué de la
découverte publique ou les futures publications peuvent commencer masquées jusqu’à ce que le problème soit examiné.

Les mises en attente de modération visent à protéger les utilisateurs pendant que ClawHub résout les cas à haut risque.
Elles peuvent aussi être levées lorsqu’un faux positif est confirmé.

## Annonces masquées ou bloquées

Une annonce peut être mise en attente, masquée, mise en quarantaine, révoquée ou autrement indisponible sur
les surfaces d’installation publiques.

Si vous voyez l’un de ces états, n’installez pas la version sauf si le propriétaire
résout le problème ou si la modération la restaure.

Les propriétaires peuvent toujours voir des diagnostics pour leurs propres annonces mises en attente ou masquées. Ces
diagnostics aident à expliquer ce qui s’est passé et ce qui doit changer avant que
l’annonce puisse revenir sur les surfaces publiques.

## Bannissements et état du compte

Les comptes qui enfreignent les règles de ClawHub peuvent perdre l’accès à la publication. Les abus graves peuvent
entraîner des bannissements de compte, la révocation de jetons, du contenu masqué ou des annonces supprimées.
Les signaux de pression d’abus des éditeurs sont vérifiés quotidiennement. Les signaux qui atteignent
le seuil de bannissement potentiel de ClawHub peuvent déclencher un avertissement automatique. Si l’analyse
éligible suivante après l’échéance de l’avertissement place toujours l’éditeur dans le
seuil de bannissement potentiel, ClawHub peut appliquer automatiquement l’action sur le compte.
Les signaux de moindre confiance et les signaux d’examen temporel borné restent exclus de l’application automatique.

Les comptes supprimés, bannis ou désactivés ne peuvent pas utiliser les jetons d’API ClawHub. Si l’authentification CLI
commence à échouer après une action sur le compte, connectez-vous à l’interface web pour examiner l’état du compte.
Si la connexion ou l’accès CLI normal est bloqué par un bannissement ou un compte désactivé,
utilisez le [formulaire d’appel ClawHub](https://appeals.openclaw.ai/) pour un examen de récupération.

Si un e-mail déclenché par un scanner désigne une version de skill ou de plugin comme malveillante,
téléchargez les résultats d’analyse stockés pour la version soumise bloquée :
`clawhub scan download <slug> --version <version>`. Pour les plugins, ajoutez
`--kind plugin`. Examinez la sortie d’analyse, corrigez l’annonce, incrémentez le numéro de version
et téléversez la version corrigée.

## Recommandations pour les éditeurs

Pour réduire les faux positifs et améliorer la confiance des utilisateurs :

- garder les noms, résumés, tags et journaux des modifications exacts
- déclarer les variables d’environnement et permissions requises
- éviter les commandes d’installation obfusquées
- créer un lien vers la source lorsque c’est possible
- utiliser des essais à blanc avant de publier des plugins
- répondre clairement si des utilisateurs ou des modérateurs posent des questions sur le comportement d’une version
