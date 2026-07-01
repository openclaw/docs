---
read_when:
    - Signaler une skill, un plugin ou un package
    - Récupération d’un listing retenu, masqué ou bloqué
    - Comprendre la modération ClawHub, les bannissements ou l’état du compte
sidebarTitle: Moderation and Account Safety
summary: Fonctionnement des signalements ClawHub, des mises en attente de modération, des listings masqués, des bannissements et de la réputation du compte.
title: Modération et sécurité du compte
x-i18n:
    generated_at: "2026-07-01T08:01:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Modération et sécurité des comptes

ClawHub est ouvert à la publication, mais les surfaces de découverte publique et
d’installation ont toujours besoin de garde-fous. Les signalements, les blocages
de modération, les listings masqués et les actions sur les comptes aident à
protéger les utilisateurs lorsqu’une release ou un compte semble dangereux,
trompeur ou non conforme aux règles.

Cette page couvre la modération et l’état des comptes. Pour les libellés d’audit
comme `Pass`, `Review`, `Warn`, `Malicious` et le niveau de risque, consultez
[Audits de sécurité](/clawhub/security-audits).

Voir aussi [Sécurité](/clawhub/security) et
[Utilisation acceptable](/clawhub/acceptable-usage). Pour les préoccupations
liées au droit d’auteur ou à d’autres droits sur le contenu, utilisez
[Demandes relatives aux droits sur le contenu](/clawhub/content-rights).

## Signalements

Les utilisateurs connectés peuvent signaler des Skills, des Plugins et des
packages.

Utilisez les signalements ClawHub uniquement pour le contenu de marketplace
dangereux, par exemple :

- listings malveillants
- métadonnées trompeuses
- identifiants ou exigences d’autorisations non déclarés
- instructions d’installation suspectes
- usurpation d’identité
- enregistrements de mauvaise foi ou usage abusif de marques
- contenu qui enfreint l’[Utilisation acceptable](/clawhub/acceptable-usage)

Utilisez le bouton **Signaler le Skill** sur une page de Skill, ou la
commande/API de signalement de package pour les packages.

N’utilisez pas les signalements ClawHub pour les vulnérabilités dans le code
source propre à un Skill ou Plugin tiers. Signalez-les directement à l’éditeur ou
au dépôt source lié depuis le listing. ClawHub ne maintient pas et ne corrige pas
le code de Skills ou Plugins tiers.

Les GitHub Security Advisories pour `openclaw/clawhub` concernent les
vulnérabilités dans ClawHub lui-même. Les exemples incluent les bugs du site web,
de l’API, de la CLI, du registre, de l’authentification, de l’analyse, de la
modération ou des limites de confiance liées au téléchargement/à l’installation.
N’utilisez pas les avis ClawHub pour les vulnérabilités dans des Skills ou
Plugins tiers.

Les bons signalements sont précis et exploitables. L’abus du système de
signalement peut lui-même entraîner une action sur le compte.

## Revendications d’organisation et d’espace de noms

Les litiges portant sur la propriété d’une organisation, d’une marque, d’un
scope de package, d’un identifiant de propriétaire ou d’un espace de noms doivent
utiliser le processus [Revendications d’organisation et d’espace de noms](/clawhub/namespace-claims),
et non le flux de signalement dans le produit ni le formulaire d’appel de compte.

Utilisez ce processus lorsque vous avez besoin que l’équipe ClawHub examine une
preuve non sensible indiquant qu’un espace de noms doit être réservé, transféré,
renommé, masqué, mis en quarantaine, doté d’un alias ou autrement examiné.
N’incluez pas de secrets, documents privés, dossiers juridiques privés, pièces
d’identité personnelles, jetons d’API ni jetons de défi DNS dans une issue
publique.

## Blocages de modération

Certains constats graves ou problèmes de conformité aux règles peuvent placer un
éditeur ou un listing sous blocage de modération. Dans ce cas, le contenu affecté
peut être masqué de la découverte publique, ou les futures publications peuvent
commencer masquées jusqu’à ce que le problème soit examiné.

Les blocages de modération visent à protéger les utilisateurs pendant que
ClawHub résout les cas à haut risque. Ils peuvent aussi être levés lorsqu’un faux
positif est confirmé.

## Listings masqués ou bloqués

Un listing peut être retenu, masqué, mis en quarantaine, révoqué ou autrement
indisponible sur les surfaces d’installation publiques.

Si vous voyez l’un de ces états, n’installez pas la release sauf si le
propriétaire résout le problème ou si la modération la restaure.

Les propriétaires peuvent encore voir les diagnostics de leurs propres listings
retenus ou masqués. Ces diagnostics aident à expliquer ce qui s’est passé et ce
qui doit changer avant que le listing puisse revenir sur les surfaces publiques.

## Bannissements et état des comptes

Les comptes qui enfreignent les règles de ClawHub peuvent perdre l’accès à la
publication. Les abus graves peuvent entraîner des bannissements de compte, la
révocation de jetons, du contenu masqué ou des listings supprimés. Les signaux de
pression d’abus des éditeurs sont vérifiés quotidiennement. Les signaux qui
atteignent le seuil de bannissement potentiel de ClawHub peuvent déclencher un
avertissement automatique. Si le prochain scan éligible après l’échéance de
l’avertissement place encore l’éditeur dans le seuil de bannissement potentiel,
ClawHub peut appliquer automatiquement l’action sur le compte. Les signaux
d’examen temporel à plus faible confiance et bornés restent exclus de
l’application automatique.

Les comptes supprimés, bannis ou désactivés ne peuvent pas utiliser les jetons
d’API ClawHub. Si l’authentification CLI commence à échouer après une action sur
le compte, connectez-vous à l’interface web pour consulter l’état du compte. Si
la connexion ou l’accès CLI normal est bloqué par un bannissement ou un compte
désactivé, utilisez le [formulaire d’appel ClawHub](https://appeals.openclaw.ai/)
pour une demande de récupération.

Si un e-mail déclenché par un scanner désigne une version de Skill ou de Plugin
comme malveillante, téléchargez les résultats de scan stockés pour la version
soumise bloquée :
`clawhub scan download <slug> --version <version>`. Pour les Plugins, ajoutez
`--kind plugin`. Examinez la sortie du scan, corrigez le listing, incrémentez le
numéro de version et téléversez la version corrigée.

## Recommandations pour les éditeurs

Pour réduire les faux positifs et améliorer la confiance des utilisateurs :

- gardez les noms, résumés, tags et changelogs exacts
- déclarez les variables d’environnement et autorisations requises
- évitez les commandes d’installation obscurcies
- créez un lien vers la source lorsque c’est possible
- utilisez des essais à blanc avant de publier des Plugins
- répondez clairement si des utilisateurs ou des modérateurs posent des questions sur le comportement d’une release
