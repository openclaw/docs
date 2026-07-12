---
read_when:
    - Signaler une compétence, un plugin ou un paquet
    - Récupération après une annonce suspendue, masquée ou bloquée
    - Comprendre la modération de ClawHub, les bannissements ou le statut du compte
sidebarTitle: Moderation and Account Safety
summary: Fonctionnement des signalements ClawHub, des mises en attente pour modération, des annonces masquées, des bannissements et du statut des comptes.
title: Modération et sécurité du compte
x-i18n:
    generated_at: "2026-07-12T15:05:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Modération et sécurité des comptes

ClawHub est ouvert à la publication, mais la découverte publique et les interfaces d’installation nécessitent tout de même des garde-fous. Les signalements, les suspensions de modération, les fiches masquées et les mesures prises à l’encontre des comptes contribuent à protéger les utilisateurs lorsqu’une version ou un compte semble dangereux, trompeur ou non conforme aux règles.

Cette page traite de la modération et de la situation des comptes. Pour les libellés d’audit tels que `Pass`, `Review`, `Warn`, `Malicious` et le niveau de risque, consultez
[Audits de sécurité](/clawhub/security-audits).

Consultez également [Sécurité](/clawhub/security) et
[Utilisation acceptable](/clawhub/acceptable-usage). Pour les questions de droits d’auteur ou d’autres droits relatifs au contenu, utilisez les [Demandes relatives aux droits sur le contenu](/clawhub/content-rights).

## Signalements

Les utilisateurs connectés peuvent signaler des Skills, des plugins et des paquets.

Utilisez les signalements ClawHub uniquement pour du contenu de place de marché dangereux, par exemple :

- des fiches malveillantes
- des métadonnées trompeuses
- des exigences non déclarées en matière d’identifiants ou d’autorisations
- des instructions d’installation suspectes
- une usurpation d’identité
- des enregistrements de mauvaise foi ou une utilisation abusive de marques
- du contenu qui enfreint les règles d’[Utilisation acceptable](/clawhub/acceptable-usage)

Utilisez le bouton **Signaler la Skill** sur la page d’une Skill, ou la commande/l’API de signalement des paquets.

N’utilisez pas les signalements ClawHub pour les vulnérabilités présentes dans le code source propre à une Skill ou à un plugin tiers. Signalez-les directement à l’éditeur ou au dépôt source indiqué dans la fiche. ClawHub ne maintient ni ne corrige le code des Skills ou plugins tiers.

Les avis de sécurité GitHub pour `openclaw/clawhub` concernent les vulnérabilités de ClawHub lui-même. Il peut s’agir, par exemple, de bogues dans le site web, l’API, la CLI, le registre, l’authentification, l’analyse, la modération ou les limites de confiance liées au téléchargement et à l’installation. N’utilisez pas les avis ClawHub pour les vulnérabilités présentes dans des Skills ou plugins tiers.

Les bons signalements sont précis et exploitables. L’utilisation abusive du système de signalement peut elle-même entraîner des mesures à l’encontre du compte.

## Revendications d’organisation et d’espace de noms

Les litiges relatifs à la propriété d’une organisation, d’une marque, d’une portée de paquet, d’un identifiant de propriétaire ou d’un espace de noms doivent suivre la procédure de [Revendication d’organisation et d’espace de noms](/clawhub/namespace-claims), et non le processus de signalement intégré au produit ou le formulaire de recours relatif aux comptes.

Utilisez cette procédure lorsque vous avez besoin que l’équipe ClawHub examine des justificatifs non sensibles afin de déterminer si un espace de noms doit être réservé, transféré, renommé, masqué, mis en quarantaine, associé à un alias ou faire l’objet d’un autre examen. N’incluez pas de secrets, de documents privés, de dossiers juridiques privés, de documents d’identité personnels, de jetons d’API ou de jetons de validation DNS dans un ticket public.

## Suspensions de modération

Certaines constatations graves ou certains problèmes de conformité aux règles peuvent entraîner la suspension de modération d’un éditeur ou d’une fiche. Dans ce cas, le contenu concerné peut être masqué de la découverte publique, ou les futures publications peuvent être initialement masquées jusqu’à l’examen du problème.

Les suspensions de modération visent à protéger les utilisateurs pendant que ClawHub traite les cas à haut risque. Elles peuvent également être levées lorsqu’un faux positif est confirmé.

## Fiches masquées ou bloquées

Une fiche peut être suspendue, masquée, mise en quarantaine, révoquée ou rendue indisponible d’une autre manière sur les interfaces publiques d’installation.

Si vous constatez l’un de ces états, n’installez pas la version tant que le propriétaire n’a pas résolu le problème ou que l’équipe de modération ne l’a pas rétablie.

Les propriétaires peuvent toujours consulter les diagnostics de leurs propres fiches suspendues ou masquées. Ces diagnostics permettent d’expliquer ce qui s’est passé et ce qui doit être modifié avant que la fiche puisse réapparaître sur les interfaces publiques.

## Bannissements et situation des comptes

Les comptes qui enfreignent les règles de ClawHub peuvent perdre leur accès à la publication. Les abus graves peuvent entraîner le bannissement du compte, la révocation des jetons, le masquage du contenu ou la suppression de fiches. Les signaux indiquant un risque d’abus de la part d’un éditeur sont vérifiés quotidiennement. Les signaux qui atteignent le seuil de bannissement potentiel de ClawHub peuvent déclencher un avertissement automatique. Si la première analyse admissible après l’échéance de l’avertissement place toujours l’éditeur au niveau du seuil de bannissement potentiel, ClawHub peut appliquer automatiquement la mesure à l’encontre du compte. Les signaux d’examen temporel à faible niveau de confiance et à portée limitée restent exclus de l’application automatique.

Les comptes supprimés, bannis ou désactivés ne peuvent pas utiliser les jetons d’API ClawHub. Si l’authentification de la CLI commence à échouer après une mesure prise à l’encontre du compte, connectez-vous à l’interface web pour consulter l’état du compte. Si la connexion ou l’accès normal à la CLI est bloqué par un bannissement ou la désactivation du compte, utilisez le [formulaire de recours ClawHub](https://appeals.openclaw.ai/) pour demander un examen en vue d’une récupération.

Si un e-mail déclenché par l’analyseur indique qu’une version de Skill ou de plugin est malveillante, téléchargez les résultats d’analyse enregistrés pour la version soumise et bloquée :
`clawhub scan download <slug> --version <version>`. Pour les plugins, ajoutez
`--kind plugin`. Examinez les résultats de l’analyse, corrigez la fiche, incrémentez le numéro de version et téléversez la version corrigée.

## Recommandations pour les éditeurs

Pour réduire les faux positifs et renforcer la confiance des utilisateurs :

- veillez à l’exactitude des noms, résumés, étiquettes et journaux des modifications
- déclarez les variables d’environnement et les autorisations requises
- évitez les commandes d’installation obscurcies
- fournissez un lien vers le code source lorsque cela est possible
- effectuez des simulations avant de publier des plugins
- répondez clairement si des utilisateurs ou des modérateurs posent des questions sur le comportement d’une version
