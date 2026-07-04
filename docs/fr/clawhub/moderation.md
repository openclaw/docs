---
read_when:
    - Signaler une skill, un plugin ou un package
    - Récupérer d’une annonce retenue, masquée ou bloquée
    - Comprendre la modération, les bannissements ou le statut de compte ClawHub
sidebarTitle: Moderation and Account Safety
summary: Fonctionnement des signalements ClawHub, des suspensions de modération, des annonces masquées, des bannissements et du statut du compte.
title: Modération et sécurité du compte
x-i18n:
    generated_at: "2026-07-04T20:29:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Modération et sécurité des comptes

ClawHub est ouvert à la publication, mais les surfaces de découverte publique et d'installation ont toujours
besoin de garde-fous. Les signalements, les suspensions de modération, les listings masqués et les actions sur les comptes
aident à protéger les utilisateurs lorsqu'une release ou un compte semble dangereux, trompeur ou non
conforme aux règles.

Cette page couvre la modération et le statut des comptes. Pour les labels d'audit tels que
`Pass`, `Review`, `Warn`, `Malicious`, et le niveau de risque, consultez
[Audits de sécurité](/clawhub/security-audits).

Voir aussi [Sécurité](/clawhub/security) et
[Utilisation acceptable](/clawhub/acceptable-usage). Pour les questions de droits d'auteur ou d'autres droits
sur le contenu, utilisez [Demandes relatives aux droits de contenu](/clawhub/content-rights).

## Signalements

Les utilisateurs connectés peuvent signaler des skills, plugins et packages.

Utilisez les signalements ClawHub uniquement pour le contenu de marketplace dangereux, tel que :

- listings malveillants
- métadonnées trompeuses
- identifiants ou exigences d'autorisation non déclarés
- instructions d'installation suspectes
- usurpation d'identité
- enregistrements de mauvaise foi ou usage abusif de marques
- contenu qui enfreint l'[Utilisation acceptable](/clawhub/acceptable-usage)

Utilisez le bouton **Signaler le skill** sur la page d'un skill, ou la commande/API de signalement
de package pour les packages.

N'utilisez pas les signalements ClawHub pour les vulnérabilités dans le code source propre à un skill ou
plugin tiers. Signalez-les directement à l'éditeur ou au dépôt source
lié depuis le listing. ClawHub ne maintient ni ne corrige
le code de skills ou plugins tiers.

Les GitHub Security Advisories pour `openclaw/clawhub` concernent les vulnérabilités de
ClawHub lui-même. Les exemples incluent les bugs du site web, de l'API, de la CLI, du registre, de l'authentification,
de l'analyse, de la modération ou des frontières de confiance de téléchargement/installation. N'utilisez pas les advisories
ClawHub pour les vulnérabilités de skills ou plugins tiers.

Les bons signalements sont précis et exploitables. L'abus du système de signalement peut lui-même entraîner une
action sur le compte.

## Revendications d'organisation et de namespace

Les litiges concernant une organisation, une marque, un périmètre de package, un identifiant de propriétaire ou la propriété d'un namespace doivent
utiliser le processus [Revendications d'organisation et de namespace](/clawhub/namespace-claims), et non le
flux de signalement intégré au produit ni le formulaire d'appel de compte.

Utilisez ce processus lorsque vous avez besoin que l'équipe ClawHub examine une preuve non sensible indiquant qu'un
namespace devrait être réservé, transféré, renommé, masqué, mis en quarantaine, aliasé
ou faire l'objet d'un autre examen. N'incluez pas de secrets, documents privés, dossiers juridiques privés,
documents d'identité personnels, jetons d'API ou jetons de défi DNS dans une
issue publique.

## Suspensions de modération

Certaines conclusions graves ou certains problèmes de conformité aux règles peuvent placer un éditeur ou un listing sous
suspension de modération. Lorsque cela se produit, le contenu concerné peut être masqué de la
découverte publique ou les publications futures peuvent commencer masquées jusqu'à ce que le problème soit examiné.

Les suspensions de modération visent à protéger les utilisateurs pendant que ClawHub résout les cas
à haut risque. Elles peuvent également être levées lorsqu'un faux positif est confirmé.

## Listings masqués ou bloqués

Un listing peut être retenu, masqué, mis en quarantaine, révoqué ou autrement indisponible sur
les surfaces d'installation publiques.

Si vous voyez l'un de ces états, n'installez pas la release sauf si le propriétaire
résout le problème ou si la modération la rétablit.

Les propriétaires peuvent toujours voir les diagnostics pour leurs propres listings retenus ou masqués. Ces
diagnostics aident à expliquer ce qui s'est passé et ce qui doit changer avant que le
listing puisse revenir sur les surfaces publiques.

## Bannissements et statut du compte

Les comptes qui enfreignent la politique de ClawHub peuvent perdre l'accès à la publication. Les abus graves peuvent
entraîner des bannissements de compte, la révocation de jetons, du contenu masqué ou des listings supprimés.
Les signaux de pression d'abus des éditeurs sont vérifiés quotidiennement. Les signaux qui atteignent
le seuil de bannissement potentiel de ClawHub peuvent déclencher un avertissement automatique. Si la prochaine
analyse éligible après la date limite de l'avertissement place toujours l'éditeur dans le
seuil de bannissement potentiel, ClawHub peut appliquer automatiquement l'action sur le compte.
Les signaux d'examen à confiance plus faible et limités dans le temps restent exclus de l'application
automatique.

Les comptes supprimés, bannis ou désactivés ne peuvent pas utiliser les jetons d'API ClawHub. Si l'authentification CLI
commence à échouer après une action sur le compte, connectez-vous à l'interface web pour examiner l'état du
compte. Si la connexion ou l'accès CLI normal est bloqué par un bannissement ou un compte désactivé,
utilisez le [formulaire d'appel ClawHub](https://appeals.openclaw.ai/) pour une révision de récupération.

Si un e-mail déclenché par un scanner désigne une version de skill ou de plugin comme malveillante,
téléchargez les résultats d'analyse stockés pour la version soumise bloquée :
`clawhub scan download <slug> --version <version>`. Pour les plugins, ajoutez
`--kind plugin`. Examinez la sortie d'analyse, corrigez le listing, incrémentez le numéro de version
et téléversez la version corrigée.

## Conseils aux éditeurs

Pour réduire les faux positifs et améliorer la confiance des utilisateurs :

- gardez les noms, résumés, tags et changelogs exacts
- déclarez les variables d'environnement et permissions requises
- évitez les commandes d'installation obscurcies
- ajoutez un lien vers la source lorsque c'est possible
- utilisez des simulations avant de publier des plugins
- répondez clairement si des utilisateurs ou des modérateurs posent des questions sur le comportement d'une release
