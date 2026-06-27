---
read_when:
    - Revendiquer une organisation, une marque, une portée de package, un identifiant de propriétaire, un slug de skill ou un espace de noms de package
    - Résolution d’un espace de noms déjà revendiqué ou réservé
    - Décider s’il faut utiliser un signalement, un appel ou une revendication d’espace de noms
sidebarTitle: Org and Namespace Claims
summary: Comment demander une révision ClawHub pour les litiges de propriété concernant une organisation, une marque, un identifiant de propriétaire, une portée de package, un slug de skill ou un espace de noms.
title: Revendications d’organisation et d’espace de noms
x-i18n:
    generated_at: "2026-06-27T17:15:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Revendications d’organisations et d’espaces de noms

ClawHub utilise les identifiants de propriétaires, les identifiants d’organisations, les slugs de Skills, les noms de packages de Plugins et
les portées de packages comme espaces de noms publics. Si un espace de noms semble appartenir à un
projet réel, une marque, un écosystème de packages ou une organisation, mais qu’il est déjà
revendiqué, réservé, trompeur ou contesté sur ClawHub, demandez au personnel de l’examiner
avec le
[formulaire de problème Revendication d’organisation / d’espace de noms](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Utilisez cette voie pour un examen public et non sensible de propriété. N’utilisez pas les
signalements intégrés au produit ni le formulaire d’appel de compte pour les revendications d’espaces de noms.

## Quand ouvrir une revendication

Ouvrez une revendication d’espace de noms lorsque vous pensez que le personnel de ClawHub devrait examiner si un
espace de noms doit être réservé, transféré, renommé, masqué, mis en quarantaine, associé à un alias
ou autrement modifié en raison d’une propriété réelle.

Exemples :

- un identifiant d’organisation qui correspond à votre organisation GitHub, projet, entreprise ou communauté
- une portée de package telle que `@example-org/*` qui ne devrait publier que sous le
  propriétaire ClawHub correspondant
- un slug de Skill ou un nom de package de Plugin qui semble usurper l’identité d’un projet
- un litige concernant une marque, une marque déposée, un renommage de projet ou l’historique d’un package
- un propriétaire supprimé, inactif ou injoignable qui bloque le propriétaire légitime de l’espace de noms

Si la fiche est dangereuse, malveillante ou trompeuse au-delà du litige de propriété,
suivez aussi les consignes de modération ou de sécurité pertinentes. Le formulaire de revendication d’espace de noms
sert à l’examen de propriété, pas à la divulgation urgente de vulnérabilités.

## Avant de déposer

Vérifiez d’abord que vous publiez avec le propriétaire qui correspond à l’espace de noms.
Pour les packages de Plugins, les noms à portée tels que `@example-org/example-plugin` doivent être
publiés sous le propriétaire `example-org` correspondant.

Si vous pouvez gérer le propriétaire actuel, corrigez directement l’espace de noms en publiant,
renommant, transférant, masquant ou supprimant la ressource concernée. Utilisez une revendication
lorsque vous ne pouvez pas gérer le propriétaire actuel ou lorsque le personnel doit résoudre un
litige.

## Preuves à inclure

Utilisez des preuves publiques et non sensibles. Les preuves utiles incluent :

- historique d’organisation GitHub, de dépôt, de version ou de mainteneur
- documentation officielle du projet qui nomme l’espace de noms
- preuve de domaine ou de domaine d’e-mail officiel
- contrôle de portée sur npm, PyPI, crates.io ou un autre registre de packages
- preuves de propriété de marque déposée, de marque ou de projet pouvant être discutées
  publiquement en toute sécurité
- historique du dépôt source, historique du package ou avis publics de renommage
- liens vers le propriétaire, la Skill, le Plugin, le package ou le problème ClawHub contesté

Expliquez ce que chaque lien prouve. Le personnel doit pouvoir comprendre la
relation sans avoir besoin d’identifiants privés ni de secrets.

## Ce qu’il ne faut pas inclure

Ne mettez pas de secrets ni de preuves privées dans un problème GitHub public. N’incluez pas :

- jetons d’API, clés de signature ou identifiants
- jetons de défi DNS
- fichiers juridiques ou contrats privés
- documents d’identité personnels
- e-mails privés, rapports de sécurité privés ou données client confidentielles

Le formulaire de revendication demande si les preuves sensibles nécessitent un canal privé avec le personnel.
Utilisez cette option au lieu de publier du contenu sensible publiquement.

## Résultats possibles

Selon les preuves et le risque, le personnel de ClawHub peut réserver un espace de noms,
transférer la propriété, renommer une ressource, masquer ou mettre en quarantaine une fiche existante,
ajouter un alias ou une redirection, demander davantage de preuves ou refuser la demande.

L’examen d’un espace de noms ne garantit pas que chaque nom correspondant sera transféré.
Le personnel évalue les preuves publiques, l’utilisation existante, le risque de sécurité et l’impact sur les utilisateurs.

## Documentation associée

- [Publication](/fr/clawhub/publishing)
- [Dépannage](/fr/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Modération et sécurité des comptes](/fr/clawhub/moderation)
- [Sécurité](/fr/clawhub/security)
