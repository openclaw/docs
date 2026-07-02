---
read_when:
    - Revendiquer une organisation, une marque, un périmètre de paquet, un identifiant de propriétaire, un slug de skill ou un espace de noms de paquet
    - Résolution d’un espace de noms déjà revendiqué ou réservé
    - Décider d’utiliser un rapport, un recours ou une revendication d’espace de noms
sidebarTitle: Org and Namespace Claims
summary: Comment demander une revue ClawHub pour les litiges de propriété concernant une organisation, une marque, un identifiant de propriétaire, une portée de package, un slug de skill ou un namespace.
title: Revendications d’organisation et d’espace de noms
x-i18n:
    generated_at: "2026-07-02T17:36:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Revendications d’organisation et d’espace de noms

ClawHub utilise les identifiants de propriétaires, les identifiants d’organisations, les slugs de Skills, les noms de packages de plugins et les
scopes de packages comme espaces de noms publics. Si un espace de noms semble appartenir à un
projet réel, une marque, un écosystème de packages ou une organisation, mais qu’il est déjà
revendiqué, réservé, trompeur ou contesté sur ClawHub, demandez à l’équipe de l’examiner
avec le
[formulaire d’issue de revendication d’organisation / d’espace de noms](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Utilisez cette voie pour les examens de propriété publics et non sensibles. N’utilisez pas les
signalements dans le produit ni le formulaire d’appel de compte pour les revendications d’espace de noms.

## Quand ouvrir une revendication

Ouvrez une revendication d’espace de noms lorsque vous pensez que l’équipe de ClawHub doit examiner si un
espace de noms doit être réservé, transféré, renommé, masqué, mis en quarantaine, doté d’un alias
ou autrement modifié en raison d’une propriété réelle.

Exemples :

- un identifiant d’organisation qui correspond à votre organisation GitHub, projet, entreprise ou communauté
- un scope de package tel que `@example-org/*` qui ne doit publier que sous le
  propriétaire ClawHub correspondant
- un slug de Skill ou un nom de package de plugin qui semble usurper l’identité d’un projet
- une contestation liée à une marque, une marque déposée, un renommage de projet ou un historique de package
- un propriétaire supprimé, inactif ou injoignable qui bloque le propriétaire légitime de l’espace de noms

Si la fiche est dangereuse, malveillante ou trompeuse au-delà du litige de propriété,
suivez également les consignes de modération ou de sécurité pertinentes. Le formulaire de revendication d’espace de noms
sert à l’examen de propriété, pas à la divulgation urgente de vulnérabilités.

## Avant de déposer une demande

Vérifiez d’abord que vous publiez avec le propriétaire qui correspond à l’espace de noms.
Pour les packages de plugins, les noms avec scope tels que `@example-org/example-plugin` doivent être
publiés sous le propriétaire `example-org` correspondant.

Si vous pouvez gérer le propriétaire actuel, corrigez directement l’espace de noms en publiant,
renommant, transférant, masquant ou supprimant la ressource concernée. Utilisez une revendication
lorsque vous ne pouvez pas gérer le propriétaire actuel ou lorsque l’équipe doit résoudre un
litige.

## Éléments de preuve à inclure

Utilisez des éléments de preuve publics et non sensibles. Les preuves utiles incluent :

- l’historique de l’organisation GitHub, du dépôt, des versions ou des mainteneurs
- la documentation officielle du projet qui nomme l’espace de noms
- une preuve de domaine ou de domaine d’e-mail officiel
- le contrôle de scope sur npm, PyPI, crates.io ou un autre registre de packages
- des éléments de preuve de propriété de marque déposée, de marque ou de projet qui peuvent être discutés
  publiquement sans risque
- l’historique du dépôt source, l’historique du package ou les avis publics de renommage
- des liens vers le propriétaire, la Skill, le plugin, le package ou l’issue ClawHub contesté

Expliquez ce que prouve chaque lien. L’équipe doit pouvoir comprendre la
relation sans avoir besoin d’identifiants privés ni de secrets.

## Ce qu’il ne faut pas inclure

Ne mettez pas de secrets ni de preuves privées dans une issue GitHub publique. N’incluez pas :

- des jetons d’API, des clés de signature ou des identifiants
- des jetons de défi DNS
- des dossiers juridiques privés ou des contrats
- des documents d’identité personnels
- des e-mails privés, des rapports de sécurité privés ou des données client confidentielles

Le formulaire de revendication demande si des éléments de preuve sensibles nécessitent un canal privé avec l’équipe.
Utilisez cette option au lieu de publier publiquement du contenu sensible.

## Résultats possibles

Selon les éléments de preuve et le risque, l’équipe de ClawHub peut réserver un espace de noms,
transférer la propriété, renommer une ressource, masquer ou mettre en quarantaine une fiche existante,
ajouter un alias ou une redirection, demander davantage de preuves ou refuser la demande.

L’examen d’un espace de noms ne garantit pas que chaque nom correspondant sera transféré.
L’équipe évalue les preuves publiques, l’utilisation existante, le risque de sécurité et l’impact sur les utilisateurs.

## Documentation associée

- [Publication](/fr/clawhub/publishing)
- [Dépannage](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Modération et sécurité des comptes](/clawhub/moderation)
- [Sécurité](/clawhub/security)
