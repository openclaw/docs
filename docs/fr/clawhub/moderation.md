---
read_when:
    - Signaler une Skill, un Plugin ou un package
    - Récupération après une annonce retenue, masquée ou bloquée
    - Comprendre la modération, les bannissements ou l’état du compte sur ClawHub
sidebarTitle: Moderation and Account Safety
summary: Fonctionnement des signalements ClawHub, des blocages de modération, des fiches masquées, des bannissements et du statut du compte.
title: Modération et sécurité du compte
x-i18n:
    generated_at: "2026-06-28T05:41:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Modération et sécurité des comptes

ClawHub est ouvert à la publication, mais les surfaces publiques de découverte et
d’installation ont toujours besoin de garde-fous. Les signalements, les mises en
attente de modération, les fiches masquées et les actions sur les comptes aident
à protéger les utilisateurs lorsqu’une version ou un compte semble dangereux,
trompeur ou non conforme aux règles.

Cette page couvre la modération et le statut des comptes. Pour les libellés
d’audit comme `Pass`, `Review`, `Warn`, `Malicious` et le niveau de risque,
consultez [Audits de sécurité](/fr/clawhub/security-audits).

Voir aussi [Sécurité](/fr/clawhub/security) et
[Usage acceptable](/fr/clawhub/acceptable-usage). Pour les préoccupations liées au
droit d’auteur ou à d’autres droits de contenu, utilisez
[Demandes relatives aux droits de contenu](/fr/clawhub/content-rights).

## Signalements

Les utilisateurs connectés peuvent signaler des skills, des plugins et des
packages.

Utilisez les signalements ClawHub uniquement pour du contenu de marketplace
dangereux, par exemple :

- des fiches malveillantes
- des métadonnées trompeuses
- des identifiants ou exigences d’autorisation non déclarés
- des instructions d’installation suspectes
- une usurpation d’identité
- des enregistrements de mauvaise foi ou une utilisation abusive de marque
- du contenu qui enfreint l’[Usage acceptable](/fr/clawhub/acceptable-usage)

Utilisez le bouton **Signaler le skill** sur une page de skill, ou la
commande/API de signalement de package pour les packages.

N’utilisez pas les signalements ClawHub pour les vulnérabilités dans le code
source propre à un skill ou plugin tiers. Signalez-les directement à l’éditeur
ou au dépôt source lié depuis la fiche. ClawHub ne maintient ni ne corrige le
code des skills ou plugins tiers.

Les GitHub Security Advisories pour `openclaw/clawhub` concernent les
vulnérabilités dans ClawHub lui-même. Les exemples incluent les bugs du site web,
de l’API, de la CLI, du registre, de l’authentification, de l’analyse, de la
modération ou des limites de confiance du téléchargement/de l’installation.
N’utilisez pas les advisories ClawHub pour les vulnérabilités dans des skills ou
plugins tiers.

Les bons signalements sont précis et actionnables. L’abus de signalement peut
lui-même entraîner une action sur le compte.

## Revendications d’organisation et d’espace de noms

Les litiges concernant la propriété d’une organisation, d’une marque, d’un
périmètre de package, d’un identifiant de propriétaire ou d’un espace de noms
doivent utiliser le processus
[Revendications d’organisation et d’espace de noms](/fr/clawhub/namespace-claims),
et non le flux de signalement dans le produit ni le formulaire d’appel de compte.

Utilisez ce processus lorsque vous avez besoin que l’équipe ClawHub examine des
preuves non sensibles indiquant qu’un espace de noms doit être réservé,
transféré, renommé, masqué, mis en quarantaine, associé à un alias ou autrement
réexaminé. N’incluez pas de secrets, documents privés, dossiers juridiques privés,
documents d’identité personnels, jetons d’API ou jetons de défi DNS dans une
issue publique.

## Mises en attente de modération

Certaines constatations graves ou certains problèmes de règles peuvent placer un
éditeur ou une fiche sous mise en attente de modération. Lorsque cela se produit,
le contenu concerné peut être masqué de la découverte publique, ou les futures
publications peuvent commencer masquées jusqu’à l’examen du problème.

Les mises en attente de modération visent à protéger les utilisateurs pendant que
ClawHub résout les cas à haut risque. Elles peuvent aussi être levées lorsqu’un
faux positif est confirmé.

## Fiches masquées ou bloquées

Une fiche peut être retenue, masquée, mise en quarantaine, révoquée ou autrement
indisponible sur les surfaces publiques d’installation.

Si vous voyez l’un de ces états, n’installez pas la version sauf si le
propriétaire résout le problème ou si la modération la restaure.

Les propriétaires peuvent toujours voir les diagnostics de leurs propres fiches
retenues ou masquées. Ces diagnostics aident à expliquer ce qui s’est passé et ce
qui doit changer avant que la fiche puisse revenir sur les surfaces publiques.

## Bannissements et statut des comptes

Les comptes qui enfreignent les règles de ClawHub peuvent perdre l’accès à la
publication. Les abus graves peuvent entraîner des bannissements de compte, la
révocation de jetons, du contenu masqué ou des fiches supprimées. Les signaux de
pression d’abus des éditeurs sont vérifiés quotidiennement. Les signaux qui
atteignent le seuil de bannissement potentiel de ClawHub peuvent déclencher un
avertissement automatique. Si la prochaine analyse éligible après la date limite
de l’avertissement place toujours l’éditeur dans le seuil de bannissement
potentiel, ClawHub peut appliquer automatiquement l’action sur le compte. Les
signaux d’examen à faible confiance et temporellement bornés restent exclus de
l’application automatique.

Les comptes supprimés, bannis ou désactivés ne peuvent pas utiliser les jetons
d’API ClawHub. Si l’authentification CLI commence à échouer après une action sur
le compte, connectez-vous à l’interface web pour vérifier l’état du compte. Si la
connexion ou l’accès CLI normal est bloqué par un bannissement ou un compte
désactivé, utilisez le
[formulaire d’appel ClawHub](https://appeals.openclaw.ai/) pour une revue de
récupération.

Si un e-mail déclenché par un scanner désigne une version de skill ou de plugin
comme malveillante, téléchargez les résultats d’analyse enregistrés pour la
version soumise bloquée :
`clawhub scan download <slug> --version <version>`. Pour les plugins, ajoutez
`--kind plugin`. Examinez la sortie de l’analyse, corrigez la fiche, incrémentez
le numéro de version et téléversez la version corrigée.

## Conseils aux éditeurs

Pour réduire les faux positifs et renforcer la confiance des utilisateurs :

- gardez les noms, résumés, tags et journaux des modifications exacts
- déclarez les variables d’environnement et autorisations requises
- évitez les commandes d’installation obscurcies
- créez un lien vers la source lorsque c’est possible
- utilisez des exécutions à blanc avant de publier des plugins
- répondez clairement si des utilisateurs ou des modérateurs posent des questions
  sur le comportement d’une version
