---
read_when:
    - Revendiquer une organisation, une marque, une portée de package, un identifiant de propriétaire, un slug de compétence ou un espace de noms de package
    - Résoudre un namespace déjà revendiqué ou réservé
    - Décider d’utiliser un rapport, un appel ou une revendication d’espace de noms
sidebarTitle: Org and Namespace Claims
summary: Comment demander une revue ClawHub pour les litiges de propriété concernant une organisation, une marque, un identifiant de propriétaire, une portée de package, un slug de skill ou un espace de noms.
title: Revendications d’organisation et d’espace de noms
x-i18n:
    generated_at: "2026-06-28T05:07:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Revendications d’organisation et d’espaces de noms

ClawHub utilise les identifiants de propriétaire, les identifiants d’organisation, les slugs de compétence, les noms de paquets de plugin et
les portées de paquet comme espaces de noms publics. Si un espace de noms semble appartenir à un
projet réel, une marque, un écosystème de paquets ou une organisation, mais qu’il est déjà
revendiqué, réservé, trompeur ou contesté sur ClawHub, demandez à l’équipe de l’examiner
avec le
[formulaire d’issue de revendication d’organisation / d’espace de noms](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Utilisez ce parcours pour les examens publics et non sensibles de propriété. N’utilisez pas les signalements
intégrés au produit ni le formulaire d’appel de compte pour les revendications d’espace de noms.

## Quand ouvrir une revendication

Ouvrez une revendication d’espace de noms lorsque vous pensez que l’équipe ClawHub devrait examiner si un
espace de noms doit être réservé, transféré, renommé, masqué, mis en quarantaine, associé à un alias
ou modifié d’une autre manière en raison d’une propriété dans le monde réel.

Exemples :

- un identifiant d’organisation qui correspond à votre organisation GitHub, projet, entreprise ou communauté
- une portée de paquet telle que `@example-org/*` qui ne devrait publier que sous le
  propriétaire ClawHub correspondant
- un slug de compétence ou un nom de paquet de plugin qui semble usurper l’identité d’un projet
- une marque, une marque déposée, un renommage de projet ou un litige d’historique de paquet
- un propriétaire supprimé, inactif ou injoignable qui bloque le propriétaire légitime de l’espace de noms

Si la fiche est dangereuse, malveillante ou trompeuse au-delà du litige de propriété,
suivez également les consignes de modération ou de sécurité pertinentes. Le formulaire de revendication d’espace de noms
sert à l’examen de propriété, pas à la divulgation urgente de vulnérabilités.

## Avant de déposer

Confirmez d’abord que vous publiez avec le propriétaire qui correspond à l’espace de noms.
Pour les paquets de plugin, les noms avec portée tels que `@example-org/example-plugin` doivent être
publiés sous le propriétaire `example-org` correspondant.

Si vous pouvez gérer le propriétaire actuel, corrigez directement l’espace de noms en publiant,
renommant, transférant, masquant ou supprimant la ressource concernée. Utilisez une revendication
lorsque vous ne pouvez pas gérer le propriétaire actuel ou lorsque l’équipe doit résoudre un
litige.

## Éléments de preuve à inclure

Utilisez des éléments publics et non sensibles. Les preuves utiles incluent :

- l’historique d’organisation GitHub, de dépôt, de release ou de mainteneur
- la documentation officielle du projet qui nomme l’espace de noms
- une preuve de domaine ou de domaine d’e-mail officiel
- le contrôle de portée sur npm, PyPI, crates.io ou un autre registre de paquets
- des éléments de preuve de marque déposée, de marque ou de propriété de projet pouvant être discutés
  publiquement
- l’historique du dépôt source, l’historique du paquet ou les avis publics de renommage
- des liens vers le propriétaire, la compétence, le plugin, le paquet ou l’issue ClawHub contesté

Expliquez ce que prouve chaque lien. L’équipe doit pouvoir comprendre la
relation sans avoir besoin d’identifiants privés ni de secrets.

## Ce qu’il ne faut pas inclure

Ne mettez pas de secrets ni de preuves privées dans une issue GitHub publique. N’incluez pas :

- des jetons d’API, clés de signature ou identifiants
- des jetons de défi DNS
- des fichiers juridiques ou contrats privés
- des documents d’identité personnels
- des e-mails privés, rapports de sécurité privés ou données client confidentielles

Le formulaire de revendication demande si les preuves sensibles nécessitent un canal privé avec l’équipe.
Utilisez cette option au lieu de publier publiquement du contenu sensible.

## Résultats possibles

Selon les preuves et le risque, l’équipe ClawHub peut réserver un espace de noms,
transférer la propriété, renommer une ressource, masquer ou mettre en quarantaine une fiche existante,
ajouter un alias ou une redirection, demander davantage de preuves ou refuser la demande.

L’examen d’un espace de noms ne garantit pas que chaque nom correspondant sera transféré.
L’équipe évalue les preuves publiques, l’utilisation existante, le risque de sécurité et l’impact utilisateur.

## Documentation associée

- [Publication](/fr/clawhub/publishing)
- [Dépannage](/fr/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Modération et sécurité des comptes](/fr/clawhub/moderation)
- [Sécurité](/fr/clawhub/security)
