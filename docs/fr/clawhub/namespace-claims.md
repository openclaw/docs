---
read_when:
    - Revendiquer une organisation, une marque, un périmètre de package, un identifiant de propriétaire, un slug de skill ou un espace de noms de package
    - Résoudre un espace de noms déjà revendiqué ou réservé
    - Décider s’il faut utiliser un signalement, un appel ou une revendication d’espace de noms
sidebarTitle: Org and Namespace Claims
summary: Comment demander une revue ClawHub pour les litiges de propriété concernant une organisation, une marque, un identifiant de propriétaire, une portée de package, un slug de Skills ou un espace de noms.
title: Revendications d’organisation et d’espace de noms
x-i18n:
    generated_at: "2026-07-03T13:27:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Revendications d’organisation et d’espace de noms

ClawHub utilise les identifiants de propriétaires, les identifiants d’organisations, les slugs de Skills, les noms de packages Plugin et
les portées de packages comme espaces de noms publics. Si un espace de noms semble appartenir à un
projet réel, une marque, un écosystème de packages ou une organisation, mais qu’il est déjà
revendiqué, réservé, trompeur ou contesté sur ClawHub, demandez à l’équipe de l’examiner
avec le
[formulaire d’issue Revendication d’organisation / espace de noms](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Utilisez ce parcours pour les examens de propriété publics et non sensibles. N’utilisez pas les
signalements intégrés au produit ni le formulaire d’appel de compte pour les revendications d’espaces de noms.

## Quand ouvrir une revendication

Ouvrez une revendication d’espace de noms lorsque vous pensez que l’équipe ClawHub doit examiner si un
espace de noms doit être réservé, transféré, renommé, masqué, mis en quarantaine, associé à un alias
ou autrement modifié en raison d’une propriété réelle.

Exemples :

- un identifiant d’organisation qui correspond à votre organisation GitHub, projet, entreprise ou communauté
- une portée de package telle que `@example-org/*` qui ne devrait publier que sous le
  propriétaire ClawHub correspondant
- un slug de Skills ou un nom de package Plugin qui semble usurper l’identité d’un projet
- une marque, une marque déposée, un renommage de projet ou un litige d’historique de package
- un propriétaire supprimé, inactif ou inaccessible qui bloque le propriétaire légitime de l’espace de noms

Si la fiche est dangereuse, malveillante ou trompeuse au-delà du litige de propriété,
suivez également les consignes de modération ou de sécurité pertinentes. Le formulaire de revendication d’espace de noms
sert à l’examen de propriété, pas à la divulgation urgente de vulnérabilités.

## Avant de déposer

Vérifiez d’abord que vous publiez avec le propriétaire correspondant à l’espace de noms.
Pour les packages Plugin, les noms avec portée tels que `@example-org/example-plugin` doivent être
publiés en tant que propriétaire `example-org` correspondant.

Si vous pouvez gérer le propriétaire actuel, corrigez directement l’espace de noms en publiant,
renommant, transférant, masquant ou supprimant la ressource concernée. Utilisez une revendication
lorsque vous ne pouvez pas gérer le propriétaire actuel ou lorsque l’équipe doit résoudre un
litige.

## Preuves à inclure

Utilisez des preuves publiques et non sensibles. Les preuves utiles incluent :

- l’historique d’une organisation GitHub, d’un dépôt, d’une version ou d’un mainteneur
- la documentation officielle du projet qui nomme l’espace de noms
- une preuve de domaine ou de domaine d’e-mail officiel
- le contrôle d’une portée de registre de packages npm, PyPI, crates.io ou autre
- une preuve de marque déposée, de marque ou de propriété de projet qui peut être discutée
  publiquement en toute sécurité
- l’historique du dépôt source, l’historique du package ou des avis publics de renommage
- des liens vers le propriétaire, la Skills, le Plugin, le package ou l’issue ClawHub contesté

Expliquez ce que chaque lien prouve. L’équipe doit pouvoir comprendre la
relation sans avoir besoin d’identifiants privés ni de secrets.

## Ce qu’il ne faut pas inclure

Ne mettez pas de secrets ni de preuves privées dans une issue GitHub publique. N’incluez pas :

- des jetons d’API, des clés de signature ou des identifiants
- des jetons de défi DNS
- des fichiers juridiques ou contrats privés
- des documents d’identité personnels
- des e-mails privés, des rapports de sécurité privés ou des données client confidentielles

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
- [Dépannage](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Modération et sécurité des comptes](/clawhub/moderation)
- [Sécurité](/clawhub/security)
