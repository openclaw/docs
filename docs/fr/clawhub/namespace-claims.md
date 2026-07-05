---
read_when:
    - Revendiquer une organisation, une marque, une portée de paquet, un identifiant de propriétaire, un slug de compétence ou un espace de noms de paquet
    - Résolution d’un espace de noms déjà revendiqué ou réservé
    - Décider d’utiliser un rapport, un appel ou une revendication d’espace de noms
sidebarTitle: Org and Namespace Claims
summary: Comment demander une révision ClawHub pour les litiges de propriété portant sur une organisation, une marque, un identifiant de propriétaire, une portée de paquet, un slug de skill ou un espace de noms.
title: Revendications d’organisation et d’espace de noms
x-i18n:
    generated_at: "2026-07-05T05:51:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Revendications d’organisations et d’espaces de noms

ClawHub utilise les identifiants de propriétaires, les identifiants d’organisations, les slugs de Skills, les noms de paquets de Plugin et les
portées de paquets comme espaces de noms publics. Si un espace de noms semble appartenir à un
projet, une marque, un écosystème de paquets ou une organisation du monde réel, mais qu’il est déjà
revendiqué, réservé, trompeur ou contesté sur ClawHub, demandez à l’équipe de l’examiner
avec le
[formulaire de problème Revendication d’organisation / d’espace de noms](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Utilisez cette voie pour les examens de propriété publics et non sensibles. N’utilisez pas les
signalements dans le produit ni le formulaire d’appel de compte pour les revendications d’espaces de noms.

## Quand ouvrir une revendication

Ouvrez une revendication d’espace de noms lorsque vous pensez que l’équipe de ClawHub doit examiner si un
espace de noms doit être réservé, transféré, renommé, masqué, mis en quarantaine, aliasé
ou autrement modifié en raison d’une propriété dans le monde réel.

Exemples :

- un identifiant d’organisation qui correspond à votre organisation GitHub, projet, entreprise ou communauté
- une portée de paquet telle que `@example-org/*` qui ne devrait publier que sous le
  propriétaire ClawHub correspondant
- un slug de compétence ou un nom de paquet de Plugin qui semble usurper l’identité d’un projet
- un litige concernant une marque, une marque commerciale, un renommage de projet ou un historique de paquet
- un propriétaire supprimé, inactif ou injoignable qui bloque le propriétaire légitime de l’espace de noms

Si la fiche est dangereuse, malveillante ou trompeuse au-delà du litige de propriété,
suivez également les consignes de modération ou de sécurité pertinentes. Le formulaire de revendication d’espace de noms
sert à l’examen de propriété, pas à la divulgation urgente de vulnérabilités.

## Avant de déposer

Vérifiez d’abord que vous publiez avec le propriétaire qui correspond à l’espace de noms.
Pour les paquets de Plugin, les noms à portée tels que `@example-org/example-plugin` doivent être
publiés sous le propriétaire `example-org` correspondant.

Si vous pouvez gérer le propriétaire actuel, corrigez directement l’espace de noms en publiant,
renommant, transférant, masquant ou supprimant la ressource concernée. Utilisez une revendication
lorsque vous ne pouvez pas gérer le propriétaire actuel ou lorsque l’équipe doit résoudre un
litige.

## Preuves à inclure

Utilisez des preuves publiques et non sensibles. Les preuves utiles incluent :

- l’historique d’organisation GitHub, de dépôt, de publication ou de maintenance
- la documentation officielle du projet qui nomme l’espace de noms
- une preuve de domaine ou de domaine d’e-mail officiel
- le contrôle de portée sur npm, PyPI, crates.io ou un autre registre de paquets
- des preuves de propriété de marque commerciale, de marque ou de projet pouvant être discutées
  publiquement
- l’historique du dépôt source, l’historique du paquet ou des avis publics de renommage
- des liens vers le propriétaire, la compétence, le Plugin, le paquet ou le problème ClawHub contesté

Expliquez ce que prouve chaque lien. L’équipe doit pouvoir comprendre la
relation sans avoir besoin d’identifiants privés ni de secrets.

## Ce qu’il ne faut pas inclure

Ne placez pas de secrets ni de preuves privées dans un problème GitHub public. N’incluez pas :

- des jetons d’API, des clés de signature ou des identifiants
- des jetons de défi DNS
- des dossiers juridiques ou contrats privés
- des documents d’identité personnels
- des e-mails privés, des rapports de sécurité privés ou des données client confidentielles

Le formulaire de revendication demande si des preuves sensibles nécessitent un canal privé avec l’équipe.
Utilisez cette option au lieu de publier publiquement des éléments sensibles.

## Résultats possibles

Selon les preuves et le risque, l’équipe de ClawHub peut réserver un espace de noms,
transférer la propriété, renommer une ressource, masquer ou mettre en quarantaine une fiche existante,
ajouter un alias ou une redirection, demander davantage de preuves ou refuser la demande.

L’examen d’un espace de noms ne garantit pas que chaque nom correspondant sera transféré.
L’équipe évalue les preuves publiques, l’utilisation existante, le risque de sécurité et l’impact utilisateur.

## Documentation associée

- [Publication](/fr/clawhub/publishing)
- [Dépannage](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Modération et sécurité des comptes](/clawhub/moderation)
- [Sécurité](/clawhub/security)
