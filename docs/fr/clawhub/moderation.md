---
read_when:
    - Signaler un skill, un Plugin ou un paquet
    - Récupération après une annonce suspendue, masquée ou bloquée
    - Comprendre la modération, les bannissements ou le statut du compte ClawHub
sidebarTitle: Moderation and Account Safety
summary: Fonctionnement des signalements ClawHub, des suspensions de modération, des fiches masquées, des bannissements et du statut du compte.
title: Modération et sécurité du compte
x-i18n:
    generated_at: "2026-06-28T22:32:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Modération et sécurité des comptes

ClawHub est ouvert à la publication, mais les surfaces de découverte publique et d’installation ont tout de même besoin de garde-fous. Les signalements, les mises en attente de modération, les fiches masquées et les actions sur les comptes aident à protéger les utilisateurs lorsqu’une version ou un compte semble dangereux, trompeur ou non conforme aux règles.

Cette page couvre la modération et l’état des comptes. Pour les libellés d’audit tels que `Pass`, `Review`, `Warn`, `Malicious` et le niveau de risque, consultez [Audits de sécurité](/fr/clawhub/security-audits).

Voir aussi [Sécurité](/fr/clawhub/security) et [Utilisation acceptable](/fr/clawhub/acceptable-usage). Pour les préoccupations liées au droit d’auteur ou à d’autres droits sur le contenu, utilisez [Demandes relatives aux droits de contenu](/fr/clawhub/content-rights).

## Signalements

Les utilisateurs connectés peuvent signaler des Skills, des Plugins et des paquets.

Utilisez les signalements ClawHub uniquement pour du contenu de place de marché dangereux, par exemple :

- fiches malveillantes
- métadonnées trompeuses
- identifiants ou exigences d’autorisation non déclarés
- instructions d’installation suspectes
- usurpation d’identité
- enregistrements de mauvaise foi ou usage abusif de marque
- contenu qui enfreint l’[Utilisation acceptable](/fr/clawhub/acceptable-usage)

Utilisez le bouton **Signaler le Skill** sur une page de Skill, ou la commande/API de signalement des paquets pour les paquets.

N’utilisez pas les signalements ClawHub pour des vulnérabilités dans le code source propre d’un Skill ou d’un Plugin tiers. Signalez-les directement à l’éditeur ou au dépôt source lié depuis la fiche. ClawHub ne maintient ni ne corrige le code de Skills ou de Plugins tiers.

Les GitHub Security Advisories pour `openclaw/clawhub` concernent les vulnérabilités dans ClawHub lui-même. Les exemples incluent des bogues dans le site web, l’API, la CLI, le registre, l’authentification, l’analyse, la modération ou les frontières de confiance de téléchargement/installation. N’utilisez pas les avis ClawHub pour des vulnérabilités dans des Skills ou Plugins tiers.

Les bons signalements sont précis et exploitables. L’abus du système de signalement peut lui-même entraîner une action sur le compte.

## Revendications d’organisation et d’espace de noms

Les litiges concernant la propriété d’une organisation, d’une marque, d’une portée de paquet, d’un identifiant de propriétaire ou d’un espace de noms doivent utiliser le processus [Revendications d’organisation et d’espace de noms](/fr/clawhub/namespace-claims), et non le flux de signalement dans le produit ni le formulaire d’appel de compte.

Utilisez ce processus lorsque vous avez besoin que l’équipe ClawHub examine des preuves non sensibles indiquant qu’un espace de noms doit être réservé, transféré, renommé, masqué, mis en quarantaine, associé à un alias ou autrement réexaminé. N’incluez pas de secrets, de documents privés, de fichiers juridiques privés, de documents d’identité personnels, de jetons API ou de jetons de défi DNS dans une issue publique.

## Mises en attente de modération

Certaines constatations graves ou certains problèmes de règles peuvent placer un éditeur ou une fiche en attente de modération. Lorsque cela se produit, le contenu concerné peut être masqué de la découverte publique, ou les futures publications peuvent commencer masquées jusqu’à ce que le problème soit examiné.

Les mises en attente de modération visent à protéger les utilisateurs pendant que ClawHub résout les cas à haut risque. Elles peuvent aussi être levées lorsqu’un faux positif est confirmé.

## Fiches masquées ou bloquées

Une fiche peut être retenue, masquée, mise en quarantaine, révoquée ou autrement indisponible sur les surfaces d’installation publiques.

Si vous voyez l’un de ces états, n’installez pas la version tant que le propriétaire n’a pas résolu le problème ou que la modération ne l’a pas restaurée.

Les propriétaires peuvent toujours voir des diagnostics pour leurs propres fiches retenues ou masquées. Ces diagnostics aident à expliquer ce qui s’est passé et ce qui doit changer avant que la fiche puisse revenir sur les surfaces publiques.

## Bannissements et état du compte

Les comptes qui enfreignent les règles de ClawHub peuvent perdre l’accès à la publication. Les abus graves peuvent entraîner des bannissements de compte, la révocation de jetons, du contenu masqué ou des fiches supprimées. Les signaux de pression d’abus des éditeurs sont vérifiés quotidiennement. Les signaux qui atteignent le seuil de bannissement potentiel de ClawHub peuvent déclencher un avertissement automatique. Si l’analyse éligible suivante après l’échéance de l’avertissement place toujours l’éditeur dans le seuil de bannissement potentiel, ClawHub peut appliquer automatiquement l’action sur le compte. Les signaux de réexamen temporel à confiance plus faible et bornés restent exclus de l’application automatique.

Les comptes supprimés, bannis ou désactivés ne peuvent pas utiliser les jetons API ClawHub. Si l’authentification CLI commence à échouer après une action sur le compte, connectez-vous à l’interface web pour examiner l’état du compte. Si la connexion ou l’accès CLI normal est bloqué par un bannissement ou un compte désactivé, utilisez le [formulaire d’appel ClawHub](https://appeals.openclaw.ai/) pour un examen de récupération.

Si un e-mail déclenché par un analyseur désigne une version de Skill ou de Plugin comme malveillante, téléchargez les résultats d’analyse stockés pour la version soumise bloquée :
`clawhub scan download <slug> --version <version>`. Pour les Plugins, ajoutez
`--kind plugin`. Examinez la sortie d’analyse, corrigez la fiche, incrémentez le numéro de version et téléversez la version corrigée.

## Conseils aux éditeurs

Pour réduire les faux positifs et améliorer la confiance des utilisateurs :

- gardez les noms, résumés, tags et journaux des modifications exacts
- déclarez les variables d’environnement et autorisations requises
- évitez les commandes d’installation obscurcies
- créez un lien vers la source lorsque c’est possible
- utilisez les exécutions à blanc avant de publier des Plugins
- répondez clairement si des utilisateurs ou des modérateurs posent des questions sur le comportement d’une version
