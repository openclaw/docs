---
read_when:
    - Revendiquer une organisation, une marque, une portée de package, un identifiant de propriétaire, un slug de compétence ou un espace de noms de package
    - Résolution d’un espace de noms déjà revendiqué ou réservé
    - Déterminer s’il faut utiliser un signalement, un appel ou une revendication d’espace de noms
sidebarTitle: Org and Namespace Claims
summary: Comment demander un examen ClawHub pour les litiges de propriété concernant une organisation, une marque, un identifiant de propriétaire, une portée de package, un slug de skill ou un espace de noms.
title: Revendications d’organisation et d’espace de noms
x-i18n:
    generated_at: "2026-06-30T22:14:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Revendications d’organisation et d’espace de noms

ClawHub utilise les identifiants de propriétaires, les identifiants d’organisation, les slugs de Skills, les noms de packages de plugin et
les portées de packages comme espaces de noms publics. Si un espace de noms semble appartenir à un
projet réel, une marque, un écosystème de packages ou une organisation, mais qu’il est déjà
revendiqué, réservé, trompeur ou contesté sur ClawHub, demandez à l’équipe de l’examiner
avec le
[formulaire de problème de revendication d’organisation / d’espace de noms](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Utilisez ce chemin pour un examen de propriété public et non sensible. N’utilisez pas les
rapports intégrés au produit ni le formulaire d’appel de compte pour les revendications d’espace de noms.

## Quand ouvrir une revendication

Ouvrez une revendication d’espace de noms lorsque vous pensez que l’équipe ClawHub doit examiner si un
espace de noms doit être réservé, transféré, renommé, masqué, mis en quarantaine, aliasé
ou modifié autrement en raison d’une propriété réelle.

Exemples :

- un identifiant d’organisation qui correspond à votre organisation GitHub, projet, entreprise ou communauté
- une portée de package telle que `@example-org/*` qui ne doit publier que sous le
  propriétaire ClawHub correspondant
- un slug de Skills ou un nom de package de plugin qui semble usurper l’identité d’un projet
- une marque, une marque déposée, un renommage de projet ou un litige d’historique de package
- un propriétaire supprimé, inactif ou injoignable qui bloque le propriétaire légitime de l’espace de noms

Si l’annonce est dangereuse, malveillante ou trompeuse au-delà du litige de propriété,
suivez également les consignes de modération ou de sécurité pertinentes. Le formulaire de revendication d’espace de noms
sert à l’examen de propriété, pas à la divulgation urgente de vulnérabilités.

## Avant de déposer une demande

Vérifiez d’abord que vous publiez avec le propriétaire qui correspond à l’espace de noms.
Pour les packages de plugin, les noms avec portée tels que `@example-org/example-plugin` doivent être
publiés en tant que propriétaire `example-org` correspondant.

Si vous pouvez gérer le propriétaire actuel, corrigez directement l’espace de noms en publiant,
renommant, transférant, masquant ou supprimant la ressource concernée. Utilisez une revendication
lorsque vous ne pouvez pas gérer le propriétaire actuel ou lorsque l’équipe doit résoudre un
litige.

## Preuves à inclure

Utilisez des preuves publiques et non sensibles. Les preuves utiles incluent :

- historique d’organisation GitHub, de dépôt, de release ou de mainteneur
- documentation officielle du projet qui nomme l’espace de noms
- preuve de domaine ou de domaine d’e-mail officiel
- contrôle de portée npm, PyPI, crates.io ou d’un autre registre de packages
- preuve de propriété de marque déposée, de marque ou de projet qui peut être discutée
  publiquement en toute sécurité
- historique du dépôt source, historique de package ou avis publics de renommage
- liens vers le propriétaire, la Skill, le plugin, le package ou le problème ClawHub contesté

Expliquez ce que prouve chaque lien. L’équipe doit pouvoir comprendre la
relation sans avoir besoin d’identifiants privés ni de secrets.

## Ce qu’il ne faut pas inclure

Ne mettez pas de secrets ni de preuves privées dans un problème GitHub public. N’incluez pas :

- jetons d’API, clés de signature ou identifiants
- jetons de défi DNS
- fichiers juridiques ou contrats privés
- documents d’identité personnels
- e-mails privés, rapports de sécurité privés ou données clients confidentielles

Le formulaire de revendication demande si des preuves sensibles nécessitent un canal privé avec l’équipe.
Utilisez cette option au lieu de publier publiquement des éléments sensibles.

## Résultats possibles

Selon les preuves et le risque, l’équipe ClawHub peut réserver un espace de noms,
transférer la propriété, renommer une ressource, masquer ou mettre en quarantaine une annonce existante,
ajouter un alias ou une redirection, demander davantage de preuves ou refuser la demande.

L’examen d’un espace de noms ne garantit pas que chaque nom correspondant sera transféré.
L’équipe évalue les preuves publiques, l’utilisation existante, le risque de sécurité et l’impact utilisateur.

## Documents associés

- [Publication](/fr/clawhub/publishing)
- [Dépannage](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Modération et sécurité du compte](/clawhub/moderation)
- [Sécurité](/clawhub/security)
