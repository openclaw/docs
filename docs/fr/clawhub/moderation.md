---
read_when:
    - Signaler une skill, un plugin ou un package
    - Récupération après une annonce suspendue, masquée ou bloquée
    - Comprendre la modération, les bannissements ou l’état d’un compte ClawHub
sidebarTitle: Moderation and Account Safety
summary: Fonctionnement des signalements ClawHub, des mises en attente de modération, des annonces masquées, des bannissements et de l’état du compte.
title: Modération et sécurité du compte
x-i18n:
    generated_at: "2026-06-28T20:41:38Z"
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
de modération, les fiches masquées et les actions sur les comptes aident à
protéger les utilisateurs lorsqu’une version ou un compte semble dangereux,
trompeur ou non conforme aux règles.

Cette page couvre la modération et l’état des comptes. Pour les libellés d’audit
comme `Pass`, `Review`, `Warn`, `Malicious` et le niveau de risque, consultez
[Audits de sécurité](/fr/clawhub/security-audits).

Voir aussi [Sécurité](/fr/clawhub/security) et
[Usage acceptable](/fr/clawhub/acceptable-usage). Pour les problèmes liés au droit
d’auteur ou à d’autres droits sur le contenu, utilisez les
[Demandes relatives aux droits de contenu](/fr/clawhub/content-rights).

## Signalements

Les utilisateurs connectés peuvent signaler des Skills, des plugins et des packages.

Utilisez les signalements ClawHub uniquement pour du contenu de place de marché
dangereux, comme :

- des fiches malveillantes
- des métadonnées trompeuses
- des identifiants ou exigences d’autorisation non déclarés
- des instructions d’installation suspectes
- une usurpation d’identité
- des enregistrements de mauvaise foi ou un usage abusif de marque
- du contenu qui enfreint l’[Usage acceptable](/fr/clawhub/acceptable-usage)

Utilisez le bouton **Signaler la Skill** sur une page de Skill, ou la
commande/API de signalement de package pour les packages.

N’utilisez pas les signalements ClawHub pour les vulnérabilités dans le code
source propre à une Skill tierce ou à un plugin tiers. Signalez-les directement à
l’éditeur ou au dépôt source lié depuis la fiche. ClawHub ne maintient pas et ne
corrige pas le code de Skills ou de plugins tiers.

Les GitHub Security Advisories pour `openclaw/clawhub` concernent les
vulnérabilités dans ClawHub lui-même. Les exemples incluent les bugs dans le site
web, l’API, la CLI, le registre, l’authentification, l’analyse, la modération ou
les frontières de confiance de téléchargement/installation. N’utilisez pas les
advisories ClawHub pour les vulnérabilités dans des Skills ou plugins tiers.

Les bons signalements sont précis et exploitables. L’abus du signalement peut
lui-même entraîner une action sur le compte.

## Revendications d’organisation et d’espace de noms

Les litiges de propriété portant sur une organisation, une marque, une portée de
package, un identifiant de propriétaire ou un espace de noms doivent utiliser le
processus [Revendications d’organisation et d’espace de noms](/fr/clawhub/namespace-claims),
et non le flux de signalement intégré au produit ni le formulaire d’appel de
compte.

Utilisez ce processus lorsque vous avez besoin que l’équipe ClawHub examine une
preuve non sensible indiquant qu’un espace de noms doit être réservé, transféré,
renommé, masqué, mis en quarantaine, associé à un alias ou autrement réexaminé.
N’incluez pas de secrets, documents privés, dossiers juridiques privés, pièces
d’identité personnelles, jetons d’API ou jetons de défi DNS dans une issue
publique.

## Blocages de modération

Certaines constatations graves ou certains problèmes de conformité peuvent placer
un éditeur ou une fiche sous blocage de modération. Lorsque cela se produit, le
contenu concerné peut être masqué de la découverte publique, ou les publications
futures peuvent commencer masquées jusqu’à ce que le problème soit examiné.

Les blocages de modération visent à protéger les utilisateurs pendant que
ClawHub résout les cas à haut risque. Ils peuvent également être levés lorsqu’un
faux positif est confirmé.

## Fiches masquées ou bloquées

Une fiche peut être retenue, masquée, mise en quarantaine, révoquée ou autrement
indisponible sur les surfaces d’installation publiques.

Si vous voyez l’un de ces états, n’installez pas la version tant que le
propriétaire n’a pas résolu le problème ou que la modération ne l’a pas
restaurée.

Les propriétaires peuvent toujours voir les diagnostics de leurs propres fiches
retenues ou masquées. Ces diagnostics aident à expliquer ce qui s’est passé et ce
qui doit changer avant que la fiche puisse revenir sur les surfaces publiques.

## Bannissements et état du compte

Les comptes qui enfreignent les règles de ClawHub peuvent perdre l’accès à la
publication. Les abus graves peuvent entraîner des bannissements de compte, la
révocation de jetons, du contenu masqué ou des fiches supprimées. Les signaux de
pression d’abus des éditeurs sont vérifiés quotidiennement. Les signaux qui
atteignent le seuil de bannissement potentiel de ClawHub peuvent déclencher un
avertissement automatique. Si l’analyse éligible suivante après l’échéance de
l’avertissement place toujours l’éditeur dans le seuil de bannissement potentiel,
ClawHub peut appliquer automatiquement l’action sur le compte. Les signaux
d’examen de confiance plus faible et temporellement bornés restent exclus de
l’application automatique.

Les comptes supprimés, bannis ou désactivés ne peuvent pas utiliser les jetons
d’API ClawHub. Si l’authentification CLI commence à échouer après une action sur
le compte, connectez-vous à l’interface web pour examiner l’état du compte. Si la
connexion ou l’accès CLI normal est bloqué par un bannissement ou un compte
désactivé, utilisez le [formulaire d’appel ClawHub](https://appeals.openclaw.ai/)
pour une demande de récupération.

Si un e-mail déclenché par l’analyseur désigne une version de Skill ou de plugin
comme malveillante, téléchargez les résultats d’analyse stockés pour la version
soumise bloquée :
`clawhub scan download <slug> --version <version>`. Pour les plugins, ajoutez
`--kind plugin`. Examinez la sortie d’analyse, corrigez la fiche, incrémentez le
numéro de version et téléversez la version corrigée.

## Recommandations aux éditeurs

Pour réduire les faux positifs et améliorer la confiance des utilisateurs :

- gardez les noms, résumés, tags et journaux des modifications exacts
- déclarez les variables d’environnement et autorisations requises
- évitez les commandes d’installation obscurcies
- créez un lien vers la source lorsque c’est possible
- utilisez des essais à blanc avant de publier des plugins
- répondez clairement si des utilisateurs ou des modérateurs posent des questions sur le comportement d’une version
