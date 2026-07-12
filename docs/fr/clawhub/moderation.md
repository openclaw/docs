---
read_when:
    - Signaler une compétence, un plugin ou un paquet
    - Récupération après une mise en attente, un masquage ou un blocage de la publication
    - Comprendre la modération de ClawHub, les bannissements ou le statut du compte
sidebarTitle: Moderation and Account Safety
summary: Fonctionnement des signalements ClawHub, des mises en attente pour modération, des annonces masquées, des bannissements et du statut des comptes.
title: Modération et sécurité du compte
x-i18n:
    generated_at: "2026-07-12T21:38:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Modération et sécurité des comptes

ClawHub est ouvert à la publication, mais les surfaces de découverte publique et d’installation ont tout de même besoin de garde-fous. Les signalements, les suspensions de modération, les annonces masquées et les mesures prises sur les comptes contribuent à protéger les utilisateurs lorsqu’une version ou un compte semble dangereux, trompeur ou non conforme aux règles.

Cette page traite de la modération et du statut des comptes. Pour les libellés d’audit tels que `Pass`, `Review`, `Warn`, `Malicious` et le niveau de risque, consultez les
[Audits de sécurité](/clawhub/security-audits).

Consultez également [Sécurité](/clawhub/security) et
[Utilisation acceptable](/clawhub/acceptable-usage). Pour les questions de droits d’auteur ou d’autres droits relatifs au contenu, utilisez les [Demandes relatives aux droits sur le contenu](/clawhub/content-rights).

## Signalements

Les utilisateurs connectés peuvent signaler des Skills, des plugins et des paquets.

Utilisez les signalements ClawHub uniquement pour du contenu dangereux sur la place de marché, par exemple :

- des annonces malveillantes
- des métadonnées trompeuses
- des exigences non déclarées en matière d’identifiants ou d’autorisations
- des instructions d’installation suspectes
- une usurpation d’identité
- des enregistrements de mauvaise foi ou une utilisation abusive de marques
- du contenu qui enfreint les règles d’[Utilisation acceptable](/clawhub/acceptable-usage)

Utilisez le bouton **Signaler la Skill** sur la page d’une Skill, ou la commande/API de signalement des paquets.

N’utilisez pas les signalements ClawHub pour les vulnérabilités présentes dans le code source propre à une Skill ou à un plugin tiers. Signalez-les directement à l’éditeur ou au dépôt source indiqué dans l’annonce. ClawHub ne maintient ni ne corrige le code des Skills ou plugins tiers.

Les avis de sécurité GitHub pour `openclaw/clawhub` concernent les vulnérabilités de ClawHub lui-même. Il peut s’agir, par exemple, de bogues affectant le site Web, l’API, la CLI, le registre, l’authentification, l’analyse, la modération ou les limites de confiance liées au téléchargement et à l’installation. N’utilisez pas les avis ClawHub pour les vulnérabilités présentes dans des Skills ou plugins tiers.

Les bons signalements sont précis et permettent d’agir. L’utilisation abusive des signalements peut elle-même entraîner des mesures sur le compte.

## Revendications d’organisation et d’espace de noms

Les litiges concernant la propriété d’une organisation, d’une marque, d’une portée de paquet, d’un identifiant de propriétaire ou d’un espace de noms doivent suivre la procédure de [Revendication d’organisation et d’espace de noms](/clawhub/namespace-claims), et non le flux de signalement intégré au produit ni le formulaire de recours relatif au compte.

Utilisez cette procédure lorsque vous avez besoin que l’équipe ClawHub examine des preuves non sensibles justifiant qu’un espace de noms soit réservé, transféré, renommé, masqué, mis en quarantaine, associé à un alias ou autrement examiné. N’incluez pas de secrets, de documents privés, de dossiers juridiques privés, de pièces d’identité personnelles, de jetons d’API ni de jetons de défi DNS dans un ticket public.

## Suspensions de modération

Certains constats graves ou problèmes de conformité peuvent placer un éditeur ou une annonce sous suspension de modération. Dans ce cas, le contenu concerné peut être masqué de la découverte publique, ou les futures publications peuvent être initialement masquées jusqu’à l’examen du problème.

Les suspensions de modération visent à protéger les utilisateurs pendant que ClawHub traite les cas à haut risque. Elles peuvent également être levées lorsqu’un faux positif est confirmé.

## Annonces masquées ou bloquées

Une annonce peut être suspendue, masquée, mise en quarantaine, révoquée ou autrement indisponible sur les surfaces publiques d’installation.

Si vous voyez l’un de ces états, n’installez pas la version tant que le propriétaire n’a pas résolu le problème ou que la modération ne l’a pas rétablie.

Les propriétaires peuvent toujours consulter les diagnostics de leurs propres annonces suspendues ou masquées. Ces diagnostics aident à expliquer ce qui s’est passé et ce qui doit changer avant que l’annonce puisse réapparaître sur les surfaces publiques.

## Bannissements et statut du compte

Les comptes qui enfreignent les règles de ClawHub peuvent perdre leur accès à la publication. Les abus graves peuvent entraîner le bannissement du compte, la révocation des jetons, le masquage du contenu ou la suppression des annonces. Les signaux indiquant une pression abusive de la part d’un éditeur sont vérifiés quotidiennement. Les signaux qui atteignent le seuil de bannissement potentiel de ClawHub peuvent déclencher un avertissement automatique. Si la première analyse admissible effectuée après l’échéance de l’avertissement place toujours l’éditeur au niveau du seuil de bannissement potentiel, ClawHub peut appliquer automatiquement la mesure sur le compte. Les signaux de faible confiance et les signaux d’examen temporel limités restent exclus de l’application automatique.

Les comptes supprimés, bannis ou désactivés ne peuvent pas utiliser les jetons d’API ClawHub. Si l’authentification de la CLI commence à échouer après une mesure prise sur le compte, connectez-vous à l’interface Web pour vérifier l’état du compte. Si la connexion ou l’accès normal à la CLI est bloqué par un bannissement ou un compte désactivé, utilisez le [formulaire de recours ClawHub](https://appeals.openclaw.ai/) pour demander un examen en vue de la récupération.

Si un e-mail déclenché par l’analyseur désigne une version de Skill ou de plugin comme malveillante, téléchargez les résultats d’analyse conservés pour la version soumise qui a été bloquée :
`clawhub scan download <slug> --version <version>`. Pour les plugins, ajoutez
`--kind plugin`. Examinez les résultats de l’analyse, corrigez l’annonce, incrémentez le numéro de version et téléversez la version corrigée.

## Recommandations aux éditeurs

Pour réduire les faux positifs et renforcer la confiance des utilisateurs :

- veillez à l’exactitude des noms, résumés, étiquettes et journaux des modifications
- déclarez les variables d’environnement et les autorisations requises
- évitez les commandes d’installation obscurcies
- ajoutez un lien vers le code source lorsque cela est possible
- effectuez des simulations avant de publier des plugins
- répondez clairement si des utilisateurs ou des modérateurs posent des questions sur le comportement d’une version
