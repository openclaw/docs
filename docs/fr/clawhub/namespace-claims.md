---
read_when:
    - Revendiquer une organisation, une marque, une portée de package, un identifiant de propriétaire, un slug de skill ou un espace de noms de package
    - Résolution d’un espace de noms déjà revendiqué ou réservé
    - Décider d’utiliser un rapport, un appel ou une revendication d’espace de noms
sidebarTitle: Org and Namespace Claims
summary: Comment demander une revue ClawHub pour les litiges de propriété concernant une organisation, une marque, un identifiant de propriétaire, une portée de paquet, un slug de compétence ou un espace de noms.
title: Revendications d’organisation et d’espace de noms
x-i18n:
    generated_at: "2026-07-04T17:57:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Revendications d’organisation et d’espace de noms

ClawHub utilise les identifiants de propriétaires, les identifiants d’organisations, les slugs de skills, les noms de paquets de plugins et
les scopes de paquets comme espaces de noms publics. Si un espace de noms semble appartenir à un
projet réel, une marque, un écosystème de paquets ou une organisation, mais qu’il est déjà
revendiqué, réservé, trompeur ou contesté sur ClawHub, demandez à l’équipe de l’examiner
avec le
[formulaire de ticket de revendication d’organisation / d’espace de noms](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Utilisez ce parcours pour les examens de propriété publics et non sensibles. N’utilisez pas les
signalements dans le produit ni le formulaire d’appel de compte pour les revendications d’espaces de noms.

## Quand ouvrir une revendication

Ouvrez une revendication d’espace de noms lorsque vous pensez que l’équipe ClawHub doit examiner si un
espace de noms doit être réservé, transféré, renommé, masqué, mis en quarantaine, aliasé
ou modifié d’une autre manière en raison d’une propriété réelle.

Exemples :

- un identifiant d’organisation qui correspond à votre organisation GitHub, projet, entreprise ou communauté
- un scope de paquet tel que `@example-org/*` qui ne devrait publier que sous le
  propriétaire ClawHub correspondant
- un slug de skill ou un nom de paquet de plugin qui semble usurper l’identité d’un projet
- une marque, une marque déposée, un renommage de projet ou un litige sur l’historique d’un paquet
- un propriétaire supprimé, inactif ou injoignable qui bloque le propriétaire légitime de
  l’espace de noms

Si la fiche est dangereuse, malveillante ou trompeuse au-delà du litige de propriété,
suivez également les consignes de modération ou de sécurité pertinentes. Le formulaire de revendication
d’espace de noms sert à l’examen de propriété, pas à la divulgation urgente de vulnérabilités.

## Avant de déposer une demande

Vérifiez d’abord que vous publiez avec le propriétaire correspondant à l’espace de noms.
Pour les paquets de plugins, les noms à scope tels que `@example-org/example-plugin` doivent être
publiés sous le propriétaire `example-org` correspondant.

Si vous pouvez gérer le propriétaire actuel, corrigez directement l’espace de noms en publiant,
renommant, transférant, masquant ou supprimant la ressource concernée. Utilisez une revendication
lorsque vous ne pouvez pas gérer le propriétaire actuel ou lorsque l’équipe doit résoudre un
litige.

## Preuves à inclure

Utilisez des preuves publiques et non sensibles. Les justificatifs utiles incluent :

- l’historique d’organisation GitHub, de dépôt, de release ou de mainteneur
- la documentation officielle du projet qui nomme l’espace de noms
- une preuve de domaine ou de domaine d’e-mail officiel
- le contrôle de scope sur npm, PyPI, crates.io ou un autre registre de paquets
- des preuves de propriété de marque déposée, de marque ou de projet pouvant être discutées
  publiquement sans risque
- l’historique du dépôt source, l’historique du paquet ou des avis publics de renommage
- des liens vers le propriétaire, le skill, le plugin, le paquet ou le ticket ClawHub contesté

Expliquez ce que prouve chaque lien. L’équipe doit pouvoir comprendre la
relation sans avoir besoin d’identifiants privés ni de secrets.

## Ce qu’il ne faut pas inclure

Ne mettez pas de secrets ni de preuves privées dans un ticket GitHub public. N’incluez pas :

- des jetons d’API, clés de signature ou identifiants
- des jetons de challenge DNS
- des dossiers juridiques ou contrats privés
- des documents d’identité personnels
- des e-mails privés, rapports de sécurité privés ou données client confidentielles

Le formulaire de revendication demande si les preuves sensibles nécessitent un canal privé avec l’équipe.
Utilisez cette option au lieu de publier publiquement des éléments sensibles.

## Résultats possibles

Selon les preuves et le risque, l’équipe ClawHub peut réserver un espace de noms,
transférer la propriété, renommer une ressource, masquer ou mettre en quarantaine une fiche existante,
ajouter un alias ou une redirection, demander plus de preuves ou refuser la demande.

L’examen d’un espace de noms ne garantit pas que chaque nom correspondant sera transféré.
L’équipe évalue les preuves publiques, l’usage existant, le risque de sécurité et l’impact utilisateur.

## Documentation associée

- [Publication](/fr/clawhub/publishing)
- [Dépannage](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Modération et sécurité des comptes](/clawhub/moderation)
- [Sécurité](/clawhub/security)
