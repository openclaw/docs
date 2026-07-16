---
read_when:
    - Signaler une compétence, un plugin ou un paquet
    - Récupération après une publication suspendue, masquée ou bloquée
    - Comprendre la modération de ClawHub, les bannissements ou le statut du compte
sidebarTitle: Moderation and Account Safety
summary: Fonctionnement des signalements ClawHub, des mises en attente pour modération, des annonces masquées, des bannissements et du statut des comptes.
title: Modération et sécurité des comptes
x-i18n:
    generated_at: "2026-07-16T13:07:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Modération et sécurité des comptes

ClawHub est ouvert à la publication, mais les surfaces publiques de découverte et d’installation ont tout de même
besoin de garde-fous. Les signalements, les suspensions de modération, les fiches masquées et les mesures prises sur les comptes
contribuent à protéger les utilisateurs lorsqu’une version ou un compte semble dangereux, trompeur ou non conforme
aux règles.

Cette page traite de la modération et du statut des comptes. Pour les libellés d’audit tels que
`Pass`, `Review`, `Warn`, `Malicious` et le niveau de risque, consultez
[Audits de sécurité](/clawhub/security-audits).

Consultez également [Sécurité](/clawhub/security) et
[Utilisation acceptable](/clawhub/acceptable-usage). Pour les problèmes liés au droit d’auteur ou à d’autres
droits sur le contenu, utilisez les [Demandes relatives aux droits sur le contenu](/clawhub/content-rights).

## Signalements

Les utilisateurs connectés peuvent signaler des skills, des plugins et des paquets.

Utilisez les signalements ClawHub uniquement pour du contenu dangereux sur la place de marché, notamment :

- fiches malveillantes
- métadonnées trompeuses
- identifiants ou autorisations requis non déclarés
- instructions d’installation suspectes
- usurpation d’identité
- enregistrements de mauvaise foi ou utilisation abusive de marques
- contenu qui enfreint les règles d’[utilisation acceptable](/clawhub/acceptable-usage)

Utilisez le bouton **Signaler le skill** sur la page d’un skill, ou la commande/API de signalement
des paquets.

N’utilisez pas les signalements ClawHub pour les vulnérabilités présentes dans le code source propre à un skill ou
à un plugin tiers. Signalez-les directement à l’éditeur ou au dépôt
source indiqué dans la fiche. ClawHub ne maintient ni ne corrige
le code des skills ou plugins tiers.

Les avis de sécurité GitHub concernant `openclaw/clawhub` sont réservés aux vulnérabilités de
ClawHub lui-même. Il peut s’agir, par exemple, de bogues dans le site web, l’API, la CLI, le registre, l’authentification,
l’analyse, la modération ou les frontières de confiance relatives au téléchargement et à l’installation. N’utilisez pas les avis
ClawHub pour les vulnérabilités présentes dans les skills ou plugins tiers.

Les signalements utiles sont précis et exploitables. L’utilisation abusive des signalements peut elle-même entraîner
des mesures sur le compte.

## Revendications d’organisation et d’espace de noms

Les litiges relatifs à la propriété d’une organisation, d’une marque, d’une portée de paquet, d’un identifiant de propriétaire ou d’un espace de noms doivent
suivre la procédure de [Revendication d’organisation et d’espace de noms](/clawhub/namespace-claims), et non le
flux de signalement intégré au produit ni le formulaire d’appel relatif aux comptes.

Utilisez cette procédure lorsque vous souhaitez que l’équipe ClawHub examine des preuves non sensibles indiquant qu’un
espace de noms doit être réservé, transféré, renommé, masqué, mis en quarantaine, associé à un alias
ou faire l’objet d’un autre type d’examen. N’incluez pas de secrets, de documents privés, de dossiers juridiques
privés, de pièces d’identité personnelles, de jetons d’API ni de jetons de défi DNS dans un
ticket public.

## Suspensions de modération

Certains constats graves ou problèmes de conformité peuvent entraîner la suspension pour modération d’un éditeur ou d’une
fiche. Dans ce cas, le contenu concerné peut être masqué de la découverte publique,
ou les futures publications peuvent être initialement masquées jusqu’à l’examen du problème.

Les suspensions de modération visent à protéger les utilisateurs pendant que ClawHub résout les cas à haut
risque. Elles peuvent également être levées lorsqu’un faux positif est confirmé.

## Fiches masquées ou bloquées

Une fiche peut être suspendue, masquée, mise en quarantaine, révoquée ou rendue indisponible d’une autre manière sur
les surfaces publiques d’installation.

Si vous voyez l’un de ces états, n’installez pas la version tant que le propriétaire
n’a pas résolu le problème ou que la modération ne l’a pas rétablie.

Les propriétaires peuvent toujours voir les diagnostics de leurs propres fiches suspendues ou masquées. Ces
diagnostics permettent d’expliquer ce qui s’est passé et ce qui doit changer avant que la
fiche puisse réapparaître sur les surfaces publiques.

## Bannissements et statut des comptes

Les comptes qui enfreignent les règles de ClawHub peuvent perdre leur accès à la publication. Les abus graves peuvent
entraîner le bannissement du compte, la révocation des jetons, le masquage du contenu ou la suppression des fiches.
Les signaux de pression liés aux abus des éditeurs sont vérifiés quotidiennement. Les signaux qui atteignent
le seuil de bannissement potentiel de ClawHub peuvent déclencher un avertissement automatique. Si l’analyse
admissible suivante après la date limite de l’avertissement place toujours l’éditeur au
seuil de bannissement potentiel, ClawHub peut appliquer automatiquement la mesure sur le compte.
Les signaux d’examen temporel de moindre confiance et à portée limitée ne font pas l’objet d’une application
automatique.

Les comptes supprimés, bannis ou désactivés ne peuvent pas utiliser les jetons d’API ClawHub. Si l’authentification de la CLI
commence à échouer après une mesure sur le compte, connectez-vous à l’interface web pour vérifier l’état du
compte. Si la connexion ou l’accès normal à la CLI est bloqué par un bannissement ou un compte désactivé,
utilisez le [formulaire d’appel ClawHub](https://appeals.openclaw.ai/) pour demander un examen en vue de la récupération.

Si un e-mail déclenché par l’analyseur désigne une version d’un skill ou d’un plugin comme malveillante,
téléchargez les résultats d’analyse enregistrés pour la version soumise et bloquée :
`clawhub scan download <slug> --version <version>`. Pour les plugins, ajoutez
`--kind plugin`. Examinez les résultats de l’analyse, corrigez la fiche, incrémentez le numéro
de version et téléversez la version corrigée.

## Recommandations aux éditeurs

Pour réduire les faux positifs et renforcer la confiance des utilisateurs :

- veillez à l’exactitude des noms, résumés, étiquettes et journaux des modifications
- déclarez les variables d’environnement et les autorisations requises
- évitez les commandes d’installation obscurcies
- fournissez un lien vers le code source lorsque cela est possible
- effectuez des simulations avant de publier des plugins
- répondez clairement si des utilisateurs ou des modérateurs posent des questions sur le comportement d’une version
