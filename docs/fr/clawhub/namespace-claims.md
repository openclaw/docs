---
read_when:
    - Revendication d’une organisation, d’une marque, d’un périmètre de package, d’un identifiant de propriétaire, d’un slug de skill ou d’un espace de noms de package
    - Résoudre un namespace déjà revendiqué ou réservé
    - Décider d’utiliser un signalement, un appel ou une revendication d’espace de noms
sidebarTitle: Org and Namespace Claims
summary: Comment demander un examen ClawHub pour les litiges de propriété d’organisation, de marque, de pseudo de propriétaire, de portée de paquet, de slug de skill ou d’espace de noms.
title: Revendications d’organisation et d’espace de noms
x-i18n:
    generated_at: "2026-06-30T13:59:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Revendications d’organisation et d’espace de noms

ClawHub utilise les identifiants de propriétaires, les identifiants d’organisations, les slugs de Skills, les noms de packages de Plugin et les portées de packages comme espaces de noms publics. Si un espace de noms semble appartenir à un projet réel, une marque, un écosystème de packages ou une organisation, mais qu’il est déjà revendiqué, réservé, trompeur ou contesté sur ClawHub, demandez à l’équipe de l’examiner avec le
[formulaire de problème Revendication d’organisation / d’espace de noms](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Utilisez cette voie pour les examens de propriété publics et non sensibles. N’utilisez pas les signalements dans le produit ni le formulaire d’appel de compte pour les revendications d’espace de noms.

## Quand ouvrir une revendication

Ouvrez une revendication d’espace de noms lorsque vous estimez que l’équipe ClawHub doit examiner si un espace de noms doit être réservé, transféré, renommé, masqué, mis en quarantaine, associé à un alias ou autrement modifié en raison d’une propriété réelle.

Exemples :

- un identifiant d’organisation qui correspond à votre organisation GitHub, projet, entreprise ou communauté
- une portée de package telle que `@example-org/*` qui ne devrait publier que sous le propriétaire ClawHub correspondant
- un slug de Skills ou un nom de package de Plugin qui semble usurper l’identité d’un projet
- un litige portant sur une marque, une marque déposée, un renommage de projet ou l’historique d’un package
- un propriétaire supprimé, inactif ou injoignable qui bloque le propriétaire légitime de l’espace de noms

Si la fiche est dangereuse, malveillante ou trompeuse au-delà du litige de propriété, suivez également les consignes de modération ou de sécurité pertinentes. Le formulaire de revendication d’espace de noms est destiné à l’examen de la propriété, pas à la divulgation urgente de vulnérabilités.

## Avant de déposer

Vérifiez d’abord que vous publiez avec le propriétaire correspondant à l’espace de noms. Pour les packages de Plugin, les noms à portée tels que `@example-org/example-plugin` doivent être publiés en tant que propriétaire `example-org` correspondant.

Si vous pouvez gérer le propriétaire actuel, corrigez directement l’espace de noms en publiant, renommant, transférant, masquant ou supprimant la ressource concernée. Utilisez une revendication lorsque vous ne pouvez pas gérer le propriétaire actuel ou lorsque l’équipe doit résoudre un litige.

## Preuves à inclure

Utilisez des preuves publiques et non sensibles. Les preuves utiles comprennent :

- l’historique d’une organisation GitHub, d’un dépôt, d’une release ou d’un mainteneur
- la documentation officielle du projet qui nomme l’espace de noms
- une preuve de domaine ou de domaine d’e-mail officiel
- le contrôle de portée sur npm, PyPI, crates.io ou un autre registre de packages
- une preuve de propriété de marque déposée, de marque ou de projet qui peut être discutée publiquement sans risque
- l’historique du dépôt source, l’historique du package ou les avis publics de renommage
- des liens vers le propriétaire, le Skills, le Plugin, le package ou le problème ClawHub contesté

Expliquez ce que chaque lien prouve. L’équipe doit pouvoir comprendre la relation sans avoir besoin d’identifiants privés ni de secrets.

## Ce qu’il ne faut pas inclure

Ne mettez pas de secrets ni de preuves privées dans un problème GitHub public. N’incluez pas :

- des jetons d’API, des clés de signature ou des identifiants
- des jetons de défi DNS
- des dossiers juridiques ou contrats privés
- des documents d’identité personnels
- des e-mails privés, des rapports de sécurité privés ou des données client confidentielles

Le formulaire de revendication demande si les preuves sensibles nécessitent un canal privé avec l’équipe. Utilisez cette option au lieu de publier des éléments sensibles publiquement.

## Résultats possibles

Selon les preuves et le risque, l’équipe ClawHub peut réserver un espace de noms, transférer la propriété, renommer une ressource, masquer ou mettre en quarantaine une fiche existante, ajouter un alias ou une redirection, demander davantage de preuves ou refuser la demande.

L’examen d’un espace de noms ne garantit pas que chaque nom correspondant sera transféré. L’équipe évalue les preuves publiques, l’usage existant, le risque de sécurité et l’impact utilisateur.

## Docs associées

- [Publication](/fr/clawhub/publishing)
- [Dépannage](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Modération et sécurité des comptes](/clawhub/moderation)
- [Sécurité](/clawhub/security)
