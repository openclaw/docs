---
read_when:
    - Revendiquer une organisation, une marque, un périmètre de package, un identifiant de propriétaire, un slug de skill ou un espace de noms de package
    - Résolution d’un espace de noms déjà revendiqué ou réservé
    - Décider s’il faut utiliser un rapport, un recours ou une revendication d’espace de noms
sidebarTitle: Org and Namespace Claims
summary: Comment demander une revue ClawHub pour les litiges de propriété d’organisation, de marque, d’identifiant de propriétaire, de scope de package, de slug de skill ou d’espace de noms.
title: Revendications d’organisation et d’espace de noms
x-i18n:
    generated_at: "2026-07-04T20:28:28Z"
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
[formulaire d’issue de revendication d’organisation / d’espace de noms](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Utilisez ce chemin pour les examens de propriété publics et non sensibles. N’utilisez pas les
signalements dans le produit ni le formulaire d’appel de compte pour les revendications d’espace de noms.

## Quand ouvrir une revendication

Ouvrez une revendication d’espace de noms lorsque vous pensez que l’équipe ClawHub devrait examiner si un
espace de noms doit être réservé, transféré, renommé, masqué, mis en quarantaine, associé à un alias
ou autrement modifié en raison d’une propriété réelle.

Exemples :

- un identifiant d’organisation qui correspond à votre organisation GitHub, projet, entreprise ou communauté
- une portée de package comme `@example-org/*` qui ne devrait publier que sous le
  propriétaire ClawHub correspondant
- un slug de Skill ou un nom de package Plugin qui semble usurper l’identité d’un projet
- un litige concernant une marque, une marque déposée, un renommage de projet ou l’historique d’un package
- un propriétaire supprimé, inactif ou injoignable qui bloque le propriétaire légitime de l’espace de noms

Si la fiche est dangereuse, malveillante ou trompeuse au-delà du litige de propriété,
suivez également les consignes de modération ou de sécurité pertinentes. Le formulaire de revendication d’espace de noms
sert à l’examen de propriété, pas à la divulgation urgente de vulnérabilités.

## Avant de déposer une demande

Vérifiez d’abord que vous publiez avec le propriétaire qui correspond à l’espace de noms.
Pour les packages Plugin, les noms à portée comme `@example-org/example-plugin` doivent être
publiés sous le propriétaire `example-org` correspondant.

Si vous pouvez gérer le propriétaire actuel, corrigez directement l’espace de noms en publiant,
renommant, transférant, masquant ou supprimant la ressource concernée. Utilisez une revendication
lorsque vous ne pouvez pas gérer le propriétaire actuel ou lorsque l’équipe doit résoudre un
litige.

## Preuves à inclure

Utilisez des preuves publiques et non sensibles. Les preuves utiles comprennent :

- l’historique d’une organisation GitHub, d’un dépôt, d’une release ou d’un mainteneur
- la documentation officielle du projet qui nomme l’espace de noms
- une preuve de domaine ou de domaine d’e-mail officiel
- le contrôle d’une portée de registre de packages npm, PyPI, crates.io ou autre
- des preuves de propriété de marque déposée, de marque ou de projet pouvant être discutées
  publiquement sans risque
- l’historique du dépôt source, l’historique du package ou des avis publics de renommage
- des liens vers le propriétaire, le Skill, le Plugin, le package ou l’issue ClawHub contesté

Expliquez ce que prouve chaque lien. L’équipe doit pouvoir comprendre la
relation sans avoir besoin d’identifiants privés ni de secrets.

## Ce qu’il ne faut pas inclure

Ne mettez pas de secrets ni de preuves privées dans une issue GitHub publique. N’incluez pas :

- des jetons d’API, des clés de signature ou des identifiants
- des jetons de défi DNS
- des fichiers juridiques ou des contrats privés
- des documents d’identité personnels
- des e-mails privés, des rapports de sécurité privés ou des données client confidentielles

Le formulaire de revendication demande si les preuves sensibles nécessitent un canal privé avec l’équipe.
Utilisez cette option au lieu de publier du contenu sensible publiquement.

## Résultats possibles

Selon les preuves et les risques, l’équipe ClawHub peut réserver un espace de noms,
transférer la propriété, renommer une ressource, masquer ou mettre en quarantaine une fiche existante,
ajouter un alias ou une redirection, demander davantage de preuves ou refuser la demande.

L’examen d’un espace de noms ne garantit pas que tous les noms correspondants seront transférés.
L’équipe évalue les preuves publiques, l’usage existant, le risque de sécurité et l’impact sur les utilisateurs.

## Docs associées

- [Publication](/fr/clawhub/publishing)
- [Dépannage](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Modération et sécurité du compte](/clawhub/moderation)
- [Sécurité](/clawhub/security)
