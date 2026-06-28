---
read_when:
    - Revendication d’une organisation, d’une marque, d’une portée de package, d’un identifiant de propriétaire, d’un slug de compétence ou d’un espace de noms de package
    - Résoudre un espace de noms déjà revendiqué ou réservé
    - Décider d’utiliser un rapport, un recours ou une revendication d’espace de noms
sidebarTitle: Org and Namespace Claims
summary: Comment demander un examen ClawHub pour les litiges de propriété concernant une organisation, une marque, un owner-handle, un package-scope, un skill-slug ou un espace de noms.
title: Revendications d’organisation et d’espace de noms
x-i18n:
    generated_at: "2026-06-28T00:11:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Revendications d’organisations et d’espaces de noms

ClawHub utilise les identifiants de propriétaires, les identifiants d’organisations, les slugs de skills, les noms de packages de Plugins et
les portées de packages comme espaces de noms publics. Si un espace de noms semble appartenir à un
projet réel, une marque, un écosystème de packages ou une organisation, mais qu’il est déjà
revendiqué, réservé, trompeur ou contesté sur ClawHub, demandez au personnel de l’examiner
avec le
[formulaire de ticket de revendication d’organisation / d’espace de noms](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Utilisez ce parcours pour les examens de propriété publics et non sensibles. N’utilisez pas les
signalements intégrés au produit ni le formulaire d’appel de compte pour les revendications d’espaces de noms.

## Quand ouvrir une revendication

Ouvrez une revendication d’espace de noms lorsque vous estimez que le personnel de ClawHub doit vérifier si un
espace de noms doit être réservé, transféré, renommé, masqué, mis en quarantaine, doté d’un alias
ou modifié d’une autre manière en raison d’une propriété réelle.

Exemples :

- un identifiant d’organisation qui correspond à votre organisation GitHub, projet, entreprise ou communauté
- une portée de package telle que `@example-org/*` qui ne devrait publier que sous le
  propriétaire ClawHub correspondant
- un slug de skill ou un nom de package de Plugin qui semble usurper l’identité d’un projet
- un litige concernant une marque, une marque déposée, un renommage de projet ou un historique de package
- un propriétaire supprimé, inactif ou injoignable qui bloque le propriétaire légitime de l’espace de noms

Si la fiche est dangereuse, malveillante ou trompeuse au-delà du litige de propriété,
suivez également les consignes de modération ou de sécurité pertinentes. Le formulaire de revendication d’espace de noms
sert à l’examen de propriété, pas à la divulgation urgente de vulnérabilités.

## Avant de déposer une demande

Vérifiez d’abord que vous publiez avec le propriétaire correspondant à l’espace de noms.
Pour les packages de Plugins, les noms avec portée tels que `@example-org/example-plugin` doivent être
publiés sous le propriétaire `example-org` correspondant.

Si vous pouvez gérer le propriétaire actuel, corrigez directement l’espace de noms en publiant,
renommant, transférant, masquant ou supprimant la ressource concernée. Utilisez une revendication
lorsque vous ne pouvez pas gérer le propriétaire actuel ou lorsque le personnel doit résoudre un
litige.

## Preuves à inclure

Utilisez des preuves publiques et non sensibles. Les preuves utiles incluent :

- l’historique d’une organisation GitHub, d’un dépôt, d’une version ou d’un mainteneur
- la documentation officielle du projet qui nomme l’espace de noms
- une preuve de domaine ou de domaine d’e-mail officiel
- le contrôle d’une portée de registre de packages npm, PyPI, crates.io ou autre
- des preuves de marque déposée, de marque ou de propriété de projet qui peuvent être discutées
  publiquement sans risque
- l’historique du dépôt source, l’historique du package ou des avis publics de renommage
- des liens vers le propriétaire, la skill, le Plugin, le package ou le ticket ClawHub contesté

Expliquez ce que prouve chaque lien. Le personnel doit pouvoir comprendre la
relation sans avoir besoin d’identifiants privés ni de secrets.

## Ce qu’il ne faut pas inclure

Ne publiez pas de secrets ni de preuves privées dans un ticket GitHub public. N’incluez pas :

- des jetons d’API, des clés de signature ou des identifiants
- des jetons de défi DNS
- des dossiers ou contrats juridiques privés
- des documents d’identité personnels
- des e-mails privés, des rapports de sécurité privés ou des données client confidentielles

Le formulaire de revendication demande si des preuves sensibles nécessitent un canal privé avec le personnel.
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
