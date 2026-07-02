---
read_when:
    - Signaler une skill, un plugin ou un package
    - Récupération après une annonce retenue, masquée ou bloquée
    - Comprendre la modération, les bannissements ou le statut du compte sur ClawHub
sidebarTitle: Moderation and Account Safety
summary: Fonctionnement des signalements ClawHub, des blocages de modération, des annonces masquées, des bannissements et de l’état du compte.
title: Modération et sécurité des comptes
x-i18n:
    generated_at: "2026-07-02T17:39:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Modération et sécurité des comptes

ClawHub est ouvert à la publication, mais les surfaces de découverte publique et d’installation ont toujours
besoin de garde-fous. Les signalements, les retenues de modération, les fiches masquées et les actions sur les comptes
aident à protéger les utilisateurs lorsqu’une version ou un compte semble dangereux, trompeur ou non conforme
aux règles.

Cette page couvre la modération et le statut des comptes. Pour les libellés d’audit tels que
`Pass`, `Review`, `Warn`, `Malicious`, et le niveau de risque, consultez
[Audits de sécurité](/clawhub/security-audits).

Voir aussi [Sécurité](/clawhub/security) et
[Utilisation acceptable](/clawhub/acceptable-usage). Pour les problèmes liés au droit d’auteur ou à d’autres droits
sur le contenu, utilisez [Demandes relatives aux droits sur le contenu](/clawhub/content-rights).

## Signalements

Les utilisateurs connectés peuvent signaler des skills, plugins et packages.

Utilisez les signalements ClawHub uniquement pour le contenu de marketplace dangereux, par exemple :

- fiches malveillantes
- métadonnées trompeuses
- identifiants ou exigences d’autorisation non déclarés
- instructions d’installation suspectes
- usurpation d’identité
- enregistrements de mauvaise foi ou usage abusif de marques
- contenu qui enfreint l’[Utilisation acceptable](/clawhub/acceptable-usage)

Utilisez le bouton **Signaler le skill** sur une page de skill, ou la
commande/API de signalement de packages pour les packages.

N’utilisez pas les signalements ClawHub pour les vulnérabilités dans le code source
propre à un skill ou Plugin tiers. Signalez-les directement à l’éditeur ou au dépôt
source lié depuis la fiche. ClawHub ne maintient ni ne corrige le code de skills
ou de plugins tiers.

Les GitHub Security Advisories pour `openclaw/clawhub` concernent les vulnérabilités dans
ClawHub lui-même. Les exemples incluent les bogues dans le site web, l’API, la CLI, le registre, l’authentification,
l’analyse, la modération ou les limites de confiance de téléchargement/installation. N’utilisez pas les advisories ClawHub
pour les vulnérabilités dans des skills ou plugins tiers.

Les bons signalements sont précis et exploitables. L’abus du système de signalement peut lui-même entraîner une
action sur le compte.

## Revendications d’organisations et d’espaces de noms

Les litiges de propriété concernant une organisation, une marque, une portée de package, un identifiant de propriétaire ou un espace de noms doivent
utiliser le processus [Revendications d’organisations et d’espaces de noms](/clawhub/namespace-claims), et non le
flux de signalement intégré au produit ni le formulaire d’appel de compte.

Utilisez ce processus lorsque vous avez besoin que l’équipe ClawHub examine une preuve non sensible indiquant qu’un
espace de noms devrait être réservé, transféré, renommé, masqué, mis en quarantaine, recevoir un alias
ou faire autrement l’objet d’un examen. N’incluez pas de secrets, de documents privés, de dossiers juridiques privés,
de documents d’identité personnels, de jetons d’API ni de jetons de défi DNS dans une issue publique.

## Retenues de modération

Certaines constatations graves ou certains problèmes de conformité peuvent placer un éditeur ou une fiche sous
retenue de modération. Lorsque cela se produit, le contenu concerné peut être masqué de la
découverte publique, ou les futures publications peuvent commencer masquées jusqu’à l’examen du problème.

Les retenues de modération visent à protéger les utilisateurs pendant que ClawHub résout les cas à haut risque.
Elles peuvent aussi être levées lorsqu’un faux positif est confirmé.

## Fiches masquées ou bloquées

Une fiche peut être retenue, masquée, mise en quarantaine, révoquée ou autrement indisponible sur
les surfaces d’installation publiques.

Si vous voyez l’un de ces états, n’installez pas la version sauf si le propriétaire
résout le problème ou si la modération la restaure.

Les propriétaires peuvent toujours voir les diagnostics de leurs propres fiches retenues ou masquées. Ces
diagnostics aident à expliquer ce qui s’est passé et ce qui doit changer avant que la
fiche puisse revenir sur les surfaces publiques.

## Bannissements et statut du compte

Les comptes qui enfreignent la politique de ClawHub peuvent perdre l’accès à la publication. Les abus graves peuvent
entraîner des bannissements de compte, la révocation de jetons, du contenu masqué ou des fiches supprimées.
Les signaux de pression d’abus des éditeurs sont vérifiés quotidiennement. Les signaux qui atteignent
le seuil de bannissement potentiel de ClawHub peuvent déclencher un avertissement automatique. Si l’analyse admissible suivante
après l’échéance d’avertissement place encore l’éditeur dans le
seuil de bannissement potentiel, ClawHub peut appliquer l’action sur le compte automatiquement.
Les signaux de moindre confiance et les signaux d’examen temporels bornés restent exclus de l’application automatique.

Les comptes supprimés, bannis ou désactivés ne peuvent pas utiliser les jetons d’API ClawHub. Si l’authentification CLI
commence à échouer après une action sur le compte, connectez-vous à l’interface web pour vérifier l’état du compte.
Si la connexion ou l’accès CLI normal est bloqué par un bannissement ou un compte désactivé,
utilisez le [formulaire d’appel ClawHub](https://appeals.openclaw.ai/) pour un examen de récupération.

Si un e-mail déclenché par un scanner désigne une version de skill ou de plugin comme malveillante,
téléchargez les résultats d’analyse stockés pour la version soumise bloquée :
`clawhub scan download <slug> --version <version>`. Pour les plugins, ajoutez
`--kind plugin`. Examinez la sortie d’analyse, corrigez la fiche, incrémentez le numéro de version
et téléversez la version corrigée.

## Recommandations pour les éditeurs

Pour réduire les faux positifs et améliorer la confiance des utilisateurs :

- gardez les noms, résumés, tags et journaux de changements exacts
- déclarez les variables d’environnement et autorisations requises
- évitez les commandes d’installation obscurcies
- ajoutez un lien vers le code source lorsque c’est possible
- utilisez des exécutions à blanc avant de publier des plugins
- répondez clairement si des utilisateurs ou des modérateurs posent des questions sur le comportement d’une version
