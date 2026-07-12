---
read_when:
    - Signaler une Skill, un Plugin ou un paquet
    - Récupération d’une fiche suspendue, masquée ou bloquée
    - Comprendre la modération de ClawHub, les bannissements ou le statut du compte
sidebarTitle: Moderation and Account Safety
summary: Fonctionnement des signalements ClawHub, des suspensions pour modération, des publications masquées, des bannissements et du statut des comptes.
title: Modération et sécurité du compte
x-i18n:
    generated_at: "2026-07-12T02:40:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Modération et sécurité des comptes

ClawHub est ouvert à la publication, mais les surfaces publiques de découverte et d’installation ont néanmoins besoin de garde-fous. Les signalements, les suspensions de modération, les fiches masquées et les mesures prises à l’encontre des comptes contribuent à protéger les utilisateurs lorsqu’une version ou un compte semble dangereux, trompeur ou contraire aux règles.

Cette page traite de la modération et de l’état des comptes. Pour les libellés d’audit tels que `Pass`, `Review`, `Warn`, `Malicious` et le niveau de risque, consultez les [Audits de sécurité](/clawhub/security-audits).

Consultez également [Sécurité](/fr/clawhub/security) et [Utilisation acceptable](/clawhub/acceptable-usage). Pour les questions relatives au droit d’auteur ou à d’autres droits sur le contenu, utilisez les [Demandes relatives aux droits sur le contenu](/clawhub/content-rights).

## Signalements

Les utilisateurs connectés peuvent signaler des Skills, des plugins et des paquets.

Utilisez les signalements ClawHub uniquement pour du contenu dangereux sur la place de marché, par exemple :

- des fiches malveillantes
- des métadonnées trompeuses
- des exigences non déclarées en matière d’identifiants ou d’autorisations
- des instructions d’installation suspectes
- une usurpation d’identité
- des enregistrements de mauvaise foi ou une utilisation abusive de marques
- du contenu qui enfreint les règles d’[Utilisation acceptable](/clawhub/acceptable-usage)

Utilisez le bouton **Signaler la Skill** sur la page d’une Skill, ou la commande/l’API de signalement des paquets pour les paquets.

N’utilisez pas les signalements ClawHub pour les vulnérabilités présentes dans le code source propre d’une Skill ou d’un Plugin tiers. Signalez-les directement à l’éditeur ou au dépôt source indiqué dans la fiche. ClawHub ne maintient ni ne corrige le code des Skills ou plugins tiers.

Les avis de sécurité GitHub concernant `openclaw/clawhub` sont destinés aux vulnérabilités de ClawHub lui-même. Cela inclut, par exemple, les bogues du site web, de l’API, de la CLI, du registre, de l’authentification, de l’analyse, de la modération ou des périmètres de confiance liés au téléchargement et à l’installation. N’utilisez pas les avis ClawHub pour les vulnérabilités des Skills ou plugins tiers.

Les bons signalements sont précis et exploitables. L’utilisation abusive des signalements peut elle-même entraîner des mesures à l’encontre du compte.

## Revendications d’organisation et d’espace de noms

Les litiges concernant la propriété d’une organisation, d’une marque, d’une portée de paquet, d’un identifiant de propriétaire ou d’un espace de noms doivent suivre la procédure de [Revendication d’organisation et d’espace de noms](/clawhub/namespace-claims), et non le flux de signalement intégré au produit ni le formulaire de recours relatif aux comptes.

Utilisez cette procédure lorsque vous avez besoin que l’équipe ClawHub examine des preuves non sensibles établissant qu’un espace de noms doit être réservé, transféré, renommé, masqué, mis en quarantaine, associé à un alias ou faire l’objet d’un autre examen. N’incluez pas de secrets, de documents privés, de dossiers juridiques privés, de documents d’identité personnels, de jetons d’API ni de jetons de validation DNS dans un ticket public.

## Suspensions de modération

Certaines constatations graves ou infractions aux règles peuvent entraîner la suspension de modération d’un éditeur ou d’une fiche. Dans ce cas, le contenu concerné peut être masqué dans la découverte publique, ou les publications ultérieures peuvent être initialement masquées jusqu’à l’examen du problème.

Les suspensions de modération visent à protéger les utilisateurs pendant que ClawHub traite les cas à haut risque. Elles peuvent également être levées lorsqu’un faux positif est confirmé.

## Fiches masquées ou bloquées

Une fiche peut être suspendue, masquée, mise en quarantaine, révoquée ou autrement indisponible sur les surfaces publiques d’installation.

Si vous observez l’un de ces états, n’installez pas la version tant que le propriétaire n’a pas résolu le problème ou que la modération ne l’a pas rétablie.

Les propriétaires peuvent toujours consulter les diagnostics de leurs propres fiches suspendues ou masquées. Ces diagnostics permettent d’expliquer ce qui s’est passé et ce qui doit changer avant que la fiche puisse réapparaître sur les surfaces publiques.

## Bannissements et état des comptes

Les comptes qui enfreignent les règles de ClawHub peuvent perdre leur accès à la publication. Les abus graves peuvent entraîner le bannissement du compte, la révocation des jetons, le masquage du contenu ou la suppression de fiches. Les signaux de pression liés aux abus des éditeurs sont vérifiés quotidiennement. Les signaux qui atteignent le seuil de bannissement potentiel de ClawHub peuvent déclencher un avertissement automatique. Si la prochaine analyse admissible après l’échéance de l’avertissement place toujours l’éditeur au niveau du seuil de bannissement potentiel, ClawHub peut appliquer automatiquement la mesure visant le compte. Les signaux d’examen de moindre fiabilité et limités dans le temps ne donnent pas lieu à une application automatique.

Les comptes supprimés, bannis ou désactivés ne peuvent pas utiliser les jetons d’API ClawHub. Si l’authentification de la CLI commence à échouer après une mesure visant le compte, connectez-vous à l’interface web pour examiner l’état du compte. Si la connexion ou l’accès normal à la CLI est bloqué en raison d’un bannissement ou d’un compte désactivé, utilisez le [formulaire de recours ClawHub](https://appeals.openclaw.ai/) pour demander un examen en vue de la récupération.

Si un e-mail déclenché par un analyseur désigne comme malveillante une version de Skill ou de Plugin, téléchargez les résultats d’analyse enregistrés pour la version soumise et bloquée :
`clawhub scan download <slug> --version <version>`. Pour les plugins, ajoutez
`--kind plugin`. Examinez les résultats de l’analyse, corrigez la fiche, incrémentez le numéro de version et téléversez la version corrigée.

## Conseils aux éditeurs

Pour réduire les faux positifs et renforcer la confiance des utilisateurs :

- veillez à l’exactitude des noms, résumés, étiquettes et journaux des modifications
- déclarez les variables d’environnement et les autorisations requises
- évitez les commandes d’installation obscurcies
- fournissez un lien vers le code source lorsque cela est possible
- effectuez des simulations avant de publier des plugins
- répondez clairement si des utilisateurs ou des modérateurs posent des questions sur le comportement d’une version
