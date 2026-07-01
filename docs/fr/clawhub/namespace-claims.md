---
read_when:
    - Revendication d’une organisation, d’une marque, d’une portée de package, d’un identifiant de propriétaire, d’un slug de skill ou d’un espace de noms de package
    - Résolution d’un espace de noms déjà revendiqué ou réservé
    - Choisir entre un rapport, un appel ou une revendication d’espace de noms
sidebarTitle: Org and Namespace Claims
summary: Comment demander une revue ClawHub pour les litiges de propriété d’organisation, de marque, d’identifiant de propriétaire, de portée de package, de slug de skill ou d’espace de noms.
title: Revendications d’organisation et d’espace de noms
x-i18n:
    generated_at: "2026-07-01T20:19:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Revendications d’organisation et d’espace de noms

ClawHub utilise les identifiants de propriétaires, les identifiants d’organisation, les slugs de Skills, les noms de packages de Plugin et
les portées de packages comme espaces de noms publics. Si un espace de noms semble appartenir à un
projet réel, une marque, un écosystème de packages ou une organisation, mais qu’il est déjà
revendiqué, réservé, trompeur ou contesté sur ClawHub, demandez à l’équipe de l’examiner
avec le
[formulaire de ticket Revendication d’organisation / d’espace de noms](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Utilisez ce parcours pour les examens de propriété publics et non sensibles. N’utilisez pas les
signalements intégrés au produit ni le formulaire d’appel de compte pour les revendications d’espace de noms.

## Quand ouvrir une revendication

Ouvrez une revendication d’espace de noms lorsque vous pensez que l’équipe ClawHub doit examiner si un
espace de noms doit être réservé, transféré, renommé, masqué, mis en quarantaine, associé à un alias
ou modifié d’une autre manière en raison d’une propriété réelle.

Exemples :

- un identifiant d’organisation qui correspond à votre organisation GitHub, projet, entreprise ou communauté
- une portée de package comme `@example-org/*` qui ne doit publier que sous le
  propriétaire ClawHub correspondant
- un slug de Skill ou un nom de package de Plugin qui semble usurper l’identité d’un projet
- un litige concernant une marque, une marque déposée, un renommage de projet ou un historique de package
- un propriétaire supprimé, inactif ou injoignable qui bloque le propriétaire légitime de l’espace de noms

Si la fiche est dangereuse, malveillante ou trompeuse au-delà du litige de propriété,
suivez également les consignes de modération ou de sécurité pertinentes. Le formulaire de revendication d’espace de noms
sert à l’examen de propriété, pas à la divulgation urgente de vulnérabilités.

## Avant de déposer une demande

Vérifiez d’abord que vous publiez avec le propriétaire qui correspond à l’espace de noms.
Pour les packages de Plugin, les noms avec portée comme `@example-org/example-plugin` doivent être
publiés sous le propriétaire `example-org` correspondant.

Si vous pouvez gérer le propriétaire actuel, corrigez directement l’espace de noms en publiant,
renommant, transférant, masquant ou supprimant la ressource concernée. Utilisez une revendication
lorsque vous ne pouvez pas gérer le propriétaire actuel ou lorsque l’équipe doit résoudre un
litige.

## Preuves à inclure

Utilisez des preuves publiques et non sensibles. Les preuves utiles incluent :

- historique d’organisation GitHub, de dépôt, de version ou de mainteneur
- documentation officielle du projet qui nomme l’espace de noms
- preuve de domaine ou de domaine d’e-mail officiel
- contrôle de portée npm, PyPI, crates.io ou d’un autre registre de packages
- preuves de marque déposée, de marque ou de propriété de projet pouvant être discutées
  publiquement sans risque
- historique du dépôt source, historique du package ou avis publics de renommage
- liens vers le propriétaire, Skill, Plugin, package ou ticket ClawHub contesté

Expliquez ce que chaque lien prouve. L’équipe doit pouvoir comprendre la
relation sans avoir besoin d’identifiants privés ni de secrets.

## Ce qu’il ne faut pas inclure

Ne mettez pas de secrets ni de preuves privées dans un ticket GitHub public. N’incluez pas :

- jetons d’API, clés de signature ou identifiants
- jetons de défi DNS
- fichiers juridiques privés ou contrats
- documents d’identité personnels
- e-mails privés, rapports de sécurité privés ou données clients confidentielles

Le formulaire de revendication demande si des preuves sensibles nécessitent un canal privé avec l’équipe.
Utilisez cette option au lieu de publier publiquement des éléments sensibles.

## Résultats possibles

Selon les preuves et le risque, l’équipe ClawHub peut réserver un espace de noms,
transférer la propriété, renommer une ressource, masquer ou mettre en quarantaine une fiche existante,
ajouter un alias ou une redirection, demander davantage de preuves ou refuser la demande.

L’examen d’espace de noms ne garantit pas que chaque nom correspondant sera transféré.
L’équipe évalue les preuves publiques, l’usage existant, le risque de sécurité et l’impact utilisateur.

## Documentation associée

- [Publication](/fr/clawhub/publishing)
- [Dépannage](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Modération et sécurité du compte](/clawhub/moderation)
- [Sécurité](/clawhub/security)
