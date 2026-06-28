---
read_when:
    - Signaler un skill, un plugin ou un paquet
    - Récupération après une publication retenue, masquée ou bloquée
    - Comprendre la modération ClawHub, les bannissements ou l’état du compte
sidebarTitle: Moderation and Account Safety
summary: Fonctionnement des signalements ClawHub, des blocages de modération, des annonces masquées, des bannissements et du statut de compte.
title: Modération et sécurité du compte
x-i18n:
    generated_at: "2026-06-28T07:41:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Modération et sécurité des comptes

ClawHub est ouvert à la publication, mais les surfaces de découverte publique et d’installation ont toujours
besoin de garde-fous. Les signalements, les suspensions de modération, les annonces masquées et les actions sur les comptes
aident à protéger les utilisateurs lorsqu’une version ou un compte semble dangereux, trompeur ou non conforme
aux règles.

Cette page couvre la modération et l’état des comptes. Pour les étiquettes d’audit telles que
`Pass`, `Review`, `Warn`, `Malicious` et le niveau de risque, consultez
[Audits de sécurité](/fr/clawhub/security-audits).

Voir aussi [Sécurité](/fr/clawhub/security) et
[Utilisation acceptable](/fr/clawhub/acceptable-usage). Pour les préoccupations liées au droit d’auteur ou à d’autres
droits sur le contenu, utilisez [Demandes relatives aux droits sur le contenu](/fr/clawhub/content-rights).

## Signalements

Les utilisateurs connectés peuvent signaler des Skills, plugins et packages.

Utilisez les signalements ClawHub uniquement pour les contenus de marketplace dangereux, tels que :

- annonces malveillantes
- métadonnées trompeuses
- identifiants ou exigences d’autorisation non déclarés
- instructions d’installation suspectes
- usurpation d’identité
- enregistrements de mauvaise foi ou usage abusif de marques
- contenu qui enfreint l’[Utilisation acceptable](/fr/clawhub/acceptable-usage)

Utilisez le bouton **Signaler le skill** sur une page de skill, ou la commande/API de signalement
de package pour les packages.

N’utilisez pas les signalements ClawHub pour les vulnérabilités dans le code source propre à une skill ou un
plugin tiers. Signalez-les directement à l’éditeur ou au dépôt source
lié depuis l’annonce. ClawHub ne maintient ni ne corrige le code
de skills ou plugins tiers.

Les GitHub Security Advisories pour `openclaw/clawhub` concernent les vulnérabilités dans
ClawHub lui-même. Exemples : bogues dans le site web, l’API, la CLI, le registre, l’authentification,
l’analyse, la modération ou les frontières de confiance du téléchargement/de l’installation. N’utilisez pas les avis
ClawHub pour les vulnérabilités dans des skills ou plugins tiers.

Les bons signalements sont précis et exploitables. L’abus du système de signalement peut lui-même entraîner une
action sur le compte.

## Revendications d’organisation et d’espace de noms

Les litiges de propriété concernant une organisation, une marque, un périmètre de package, un identifiant de propriétaire ou un espace de noms doivent
utiliser le processus [Revendications d’organisation et d’espace de noms](/fr/clawhub/namespace-claims), et non le
flux de signalement intégré au produit ni le formulaire d’appel de compte.

Utilisez ce processus lorsque vous avez besoin que l’équipe ClawHub examine des preuves non sensibles indiquant qu’un
espace de noms doit être réservé, transféré, renommé, masqué, mis en quarantaine, aliasé
ou autrement réexaminé. N’incluez pas de secrets, de documents privés, de dossiers juridiques privés,
de documents d’identité personnels, de jetons d’API ou de jetons de défi DNS dans une
issue publique.

## Suspensions de modération

Certaines constatations graves ou certains problèmes de conformité aux règles peuvent placer un éditeur ou une annonce sous
suspension de modération. Lorsque cela se produit, le contenu concerné peut être masqué de la
découverte publique ou les futures publications peuvent commencer masquées jusqu’à l’examen du problème.

Les suspensions de modération visent à protéger les utilisateurs pendant que ClawHub résout les cas à haut risque.
Elles peuvent aussi être levées lorsqu’un faux positif est confirmé.

## Annonces masquées ou bloquées

Une annonce peut être suspendue, masquée, mise en quarantaine, révoquée ou autrement indisponible sur
les surfaces d’installation publiques.

Si vous voyez l’un de ces états, n’installez pas la version à moins que le propriétaire
ne résolve le problème ou que la modération ne la restaure.

Les propriétaires peuvent toujours voir les diagnostics de leurs propres annonces suspendues ou masquées. Ces
diagnostics aident à expliquer ce qui s’est passé et ce qui doit changer avant que
l’annonce puisse revenir sur les surfaces publiques.

## Bannissements et état du compte

Les comptes qui enfreignent les règles de ClawHub peuvent perdre l’accès à la publication. Les abus graves peuvent
entraîner des bannissements de compte, la révocation de jetons, du contenu masqué ou des annonces supprimées.
Les signaux de pression d’abus des éditeurs sont vérifiés quotidiennement. Les signaux qui atteignent
le seuil de bannissement potentiel de ClawHub peuvent déclencher un avertissement automatique. Si la prochaine
analyse éligible après l’échéance de l’avertissement place toujours l’éditeur dans le
seuil de bannissement potentiel, ClawHub peut appliquer automatiquement l’action sur le compte.
Les signaux de revue temporels à confiance plus faible et bornés restent exclus de l’application automatique.

Les comptes supprimés, bannis ou désactivés ne peuvent pas utiliser les jetons d’API ClawHub. Si l’authentification CLI
commence à échouer après une action sur le compte, connectez-vous à l’interface web pour vérifier l’état du compte.
Si la connexion ou l’accès CLI normal est bloqué par un bannissement ou un compte désactivé,
utilisez le [formulaire d’appel ClawHub](https://appeals.openclaw.ai/) pour une revue de récupération.

Si un e-mail déclenché par un scanner désigne une version de skill ou de plugin comme malveillante,
téléchargez les résultats d’analyse stockés pour la version soumise bloquée :
`clawhub scan download <slug> --version <version>`. Pour les plugins, ajoutez
`--kind plugin`. Passez en revue la sortie de l’analyse, corrigez l’annonce, incrémentez le numéro de version
et téléversez la version corrigée.

## Conseils aux éditeurs

Pour réduire les faux positifs et améliorer la confiance des utilisateurs :

- gardez les noms, résumés, étiquettes et journaux des modifications exacts
- déclarez les variables d’environnement et autorisations requises
- évitez les commandes d’installation obscurcies
- créez un lien vers la source lorsque c’est possible
- utilisez des exécutions à blanc avant de publier des plugins
- répondez clairement si des utilisateurs ou des modérateurs posent des questions sur le comportement d’une version
