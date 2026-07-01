---
read_when:
    - Signaler une Skill, un Plugin ou un paquet
    - Récupération d’un listing retenu, masqué ou bloqué
    - Comprendre la modération de ClawHub, les bannissements ou le statut du compte
sidebarTitle: Moderation and Account Safety
summary: Fonctionnement des signalements ClawHub, des retenues de modération, des annonces masquées, des bannissements et de l’état du compte.
title: Modération et sécurité du compte
x-i18n:
    generated_at: "2026-07-01T12:58:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Modération et sécurité des comptes

ClawHub est ouvert à la publication, mais les surfaces de découverte publique et
d’installation ont toujours besoin de garde-fous. Les signalements, les
suspensions de modération, les fiches masquées et les mesures sur les comptes
aident à protéger les utilisateurs lorsqu’une version publiée ou un compte semble
dangereux, trompeur ou non conforme aux règles.

Cette page couvre la modération et le statut des comptes. Pour les libellés
d’audit comme `Pass`, `Review`, `Warn`, `Malicious` et le niveau de risque,
consultez [Audits de sécurité](/clawhub/security-audits).

Voir aussi [Sécurité](/clawhub/security) et
[Utilisation acceptable](/clawhub/acceptable-usage). Pour les préoccupations
liées au droit d’auteur ou à d’autres droits sur le contenu, utilisez
[Demandes relatives aux droits sur le contenu](/clawhub/content-rights).

## Signalements

Les utilisateurs connectés peuvent signaler des Skills, des plugins et des
paquets.

Utilisez les signalements ClawHub uniquement pour du contenu de marketplace
dangereux, par exemple :

- fiches malveillantes
- métadonnées trompeuses
- identifiants ou exigences d’autorisation non déclarés
- instructions d’installation suspectes
- usurpation d’identité
- enregistrements de mauvaise foi ou usage abusif de marque
- contenu qui enfreint l’[Utilisation acceptable](/clawhub/acceptable-usage)

Utilisez le bouton **Signaler le Skill** sur la page d’un Skill, ou la
commande/API de signalement de paquet pour les paquets.

N’utilisez pas les signalements ClawHub pour les vulnérabilités dans le code
source propre à un Skill ou plugin tiers. Signalez-les directement à l’éditeur ou
au dépôt source lié depuis la fiche. ClawHub ne maintient pas et ne corrige pas le
code de Skills ou plugins tiers.

Les GitHub Security Advisories pour `openclaw/clawhub` concernent les
vulnérabilités dans ClawHub lui-même. Les exemples incluent des bugs dans le site
web, l’API, la CLI, le registre, l’authentification, l’analyse, la modération ou
les frontières de confiance de téléchargement/installation. N’utilisez pas les
advisories ClawHub pour les vulnérabilités dans des Skills ou plugins tiers.

Les bons signalements sont précis et exploitables. L’abus de signalement peut
lui-même entraîner une mesure sur le compte.

## Revendications d’organisation et d’espace de noms

Les litiges relatifs à la propriété d’une organisation, d’une marque, d’un
périmètre de paquet, d’un identifiant de propriétaire ou d’un espace de noms
doivent utiliser le processus
[Revendications d’organisation et d’espace de noms](/clawhub/namespace-claims),
et non le flux de signalement dans le produit ni le formulaire d’appel de compte.

Utilisez ce processus lorsque vous avez besoin que l’équipe ClawHub examine une
preuve non sensible indiquant qu’un espace de noms doit être réservé, transféré,
renommé, masqué, mis en quarantaine, aliasé ou autrement examiné. N’incluez pas
de secrets, documents privés, dossiers juridiques privés, pièces d’identité
personnelles, jetons d’API ou jetons de défi DNS dans une issue publique.

## Suspensions de modération

Certaines constatations graves ou certains problèmes de règles peuvent placer un
éditeur ou une fiche sous suspension de modération. Lorsque cela se produit, le
contenu concerné peut être masqué de la découverte publique, ou les publications
futures peuvent commencer masquées jusqu’à l’examen du problème.

Les suspensions de modération visent à protéger les utilisateurs pendant que
ClawHub traite les cas à haut risque. Elles peuvent aussi être levées lorsqu’un
faux positif est confirmé.

## Fiches masquées ou bloquées

Une fiche peut être suspendue, masquée, mise en quarantaine, révoquée ou
autrement indisponible sur les surfaces d’installation publiques.

Si vous voyez l’un de ces états, n’installez pas la version publiée sauf si le
propriétaire résout le problème ou si la modération la restaure.

Les propriétaires peuvent encore voir les diagnostics de leurs propres fiches
suspendues ou masquées. Ces diagnostics aident à expliquer ce qui s’est passé et
ce qui doit changer avant que la fiche puisse revenir sur les surfaces publiques.

## Bannissements et statut du compte

Les comptes qui enfreignent les règles de ClawHub peuvent perdre l’accès à la
publication. Les abus graves peuvent entraîner des bannissements de compte, une
révocation de jetons, du contenu masqué ou des fiches supprimées. Les signaux de
pression d’abus des éditeurs sont vérifiés quotidiennement. Les signaux qui
atteignent le seuil de bannissement potentiel de ClawHub peuvent déclencher un
avertissement automatique. Si l’analyse éligible suivante après l’échéance de
l’avertissement place toujours l’éditeur dans le seuil de bannissement potentiel,
ClawHub peut appliquer automatiquement la mesure sur le compte. Les signaux
d’examen temporels à confiance plus faible et bornés restent exclus de
l’application automatique.

Les comptes supprimés, bannis ou désactivés ne peuvent pas utiliser les jetons
d’API ClawHub. Si l’authentification CLI commence à échouer après une mesure sur
le compte, connectez-vous à l’interface web pour consulter l’état du compte. Si
la connexion ou l’accès CLI normal est bloqué par un bannissement ou un compte
désactivé, utilisez le
[formulaire d’appel ClawHub](https://appeals.openclaw.ai/) pour une révision de
récupération.

Si un e-mail déclenché par un analyseur désigne une version de Skill ou de plugin
comme malveillante, téléchargez les résultats d’analyse stockés pour la version
soumise bloquée :
`clawhub scan download <slug> --version <version>`. Pour les plugins, ajoutez
`--kind plugin`. Examinez la sortie d’analyse, corrigez la fiche, incrémentez le
numéro de version et téléversez la version corrigée.

## Conseils aux éditeurs

Pour réduire les faux positifs et améliorer la confiance des utilisateurs :

- gardez les noms, résumés, balises et journaux des modifications exacts
- déclarez les variables d’environnement et autorisations requises
- évitez les commandes d’installation obfusquées
- créez un lien vers la source lorsque c’est possible
- utilisez des essais à blanc avant de publier des plugins
- répondez clairement si des utilisateurs ou des modérateurs posent des questions sur le comportement d’une version publiée
