---
read_when:
    - Revendiquer une organisation, une marque, un périmètre de paquet, un identifiant de propriétaire, un slug de skill ou un espace de noms de paquet
    - Résolution d’un espace de noms déjà revendiqué ou réservé
    - Choisir entre un signalement, un recours ou une revendication d’espace de noms
sidebarTitle: Org and Namespace Claims
summary: Comment demander un examen par ClawHub pour les litiges de propriété concernant une organisation, une marque, un identifiant de propriétaire, une portée de package, un slug de Skill ou un espace de noms.
title: Revendications d’organisation et d’espace de noms
x-i18n:
    generated_at: "2026-07-12T02:24:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Revendications d’organisation et d’espace de noms

ClawHub utilise les identifiants de propriétaire, les identifiants d’organisation, les slugs de Skills, les noms de paquets de Plugin et les portées de paquets comme espaces de noms publics. Si un espace de noms semble appartenir à un projet, une marque, un écosystème de paquets ou une organisation du monde réel, mais qu’il est déjà revendiqué, réservé, trompeur ou contesté sur ClawHub, demandez à l’équipe de l’examiner au moyen du
[formulaire de revendication d’organisation ou d’espace de noms](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Utilisez cette procédure pour un examen public et non sensible de la propriété. N’utilisez pas les signalements intégrés au produit ni le formulaire de recours relatif au compte pour les revendications d’espace de noms.

## Quand ouvrir une revendication

Ouvrez une revendication d’espace de noms lorsque vous estimez que l’équipe de ClawHub doit déterminer si un espace de noms doit être réservé, transféré, renommé, masqué, mis en quarantaine, associé à un alias ou autrement modifié en raison de sa propriété dans le monde réel.

Exemples :

- un identifiant d’organisation qui correspond à votre organisation GitHub, votre projet, votre entreprise ou votre communauté
- une portée de paquet telle que `@example-org/*`, dont la publication doit être réservée au propriétaire ClawHub correspondant
- un slug de Skill ou un nom de paquet de Plugin qui semble usurper l’identité d’un projet
- un litige concernant une marque, une marque déposée, le changement de nom d’un projet ou l’historique d’un paquet
- un propriétaire supprimé, inactif ou injoignable qui empêche le propriétaire légitime d’utiliser l’espace de noms

Si la fiche est dangereuse, malveillante ou trompeuse au-delà du litige de propriété, suivez également les consignes de modération ou de sécurité appropriées. Le formulaire de revendication d’espace de noms est destiné à l’examen de la propriété, et non à la divulgation urgente d’une vulnérabilité.

## Avant de déposer une demande

Vérifiez d’abord que vous publiez avec le propriétaire correspondant à l’espace de noms. Pour les paquets de Plugin, les noms avec portée tels que `@example-org/example-plugin` doivent être publiés sous le propriétaire `example-org` correspondant.

Si vous pouvez gérer le propriétaire actuel, corrigez directement l’espace de noms en publiant, renommant, transférant, masquant ou supprimant la ressource concernée. Déposez une revendication lorsque vous ne pouvez pas gérer le propriétaire actuel ou lorsque l’équipe doit résoudre un litige.

## Éléments de preuve à fournir

Utilisez des éléments de preuve publics et non sensibles. Les preuves utiles comprennent :

- l’historique d’une organisation, d’un dépôt, d’une version ou des responsables de maintenance sur GitHub
- la documentation officielle du projet qui mentionne l’espace de noms
- la preuve du contrôle d’un domaine ou d’un domaine de messagerie officiel
- le contrôle d’une portée dans npm, PyPI, crates.io ou un autre registre de paquets
- des preuves de propriété d’une marque déposée, d’une marque ou d’un projet pouvant être présentées publiquement sans risque
- l’historique du dépôt source ou du paquet, ou des annonces publiques de changement de nom
- des liens vers le propriétaire, la Skill, le Plugin, le paquet ou le ticket ClawHub faisant l’objet du litige

Expliquez ce que prouve chaque lien. L’équipe doit pouvoir comprendre la relation sans avoir besoin d’identifiants de connexion privés ni de secrets.

## Éléments à ne pas fournir

Ne publiez pas de secrets ni de preuves privées dans un ticket GitHub public. N’incluez pas :

- de jetons d’API, de clés de signature ou d’identifiants de connexion
- de jetons de validation DNS
- de dossiers juridiques ou de contrats privés
- de pièces d’identité personnelles
- d’e-mails privés, de rapports de sécurité privés ou de données client confidentielles

Le formulaire de revendication demande si les preuves sensibles nécessitent un canal privé avec l’équipe. Utilisez cette option au lieu de publier des informations sensibles publiquement.

## Résultats possibles

Selon les preuves et les risques, l’équipe de ClawHub peut réserver un espace de noms, transférer sa propriété, renommer une ressource, masquer ou mettre en quarantaine une fiche existante, ajouter un alias ou une redirection, demander des preuves supplémentaires ou refuser la demande.

L’examen d’un espace de noms ne garantit pas le transfert de tous les noms correspondants. L’équipe évalue les preuves publiques, l’utilisation existante, les risques de sécurité et l’incidence sur les utilisateurs.

## Documentation associée

- [Publication](/fr/clawhub/publishing)
- [Dépannage](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Modération et sécurité des comptes](/clawhub/moderation)
- [Sécurité](/clawhub/security)
