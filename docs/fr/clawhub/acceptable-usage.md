---
read_when:
    - Examen des téléversements pour détecter les abus ou les violations des politiques
    - Rédaction de documentation de modération ou de guides opérationnels pour les réviseurs
    - Décider si une skill doit être masquée ou si un utilisateur doit être banni
sidebarTitle: Acceptable Usage
summary: 'Politique de la marketplace : ce que ClawHub autorise et ce qu’il n’hébergera pas.'
title: Utilisation acceptable
x-i18n:
    generated_at: "2026-07-01T20:19:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Utilisation acceptable

ClawHub héberge des Skills, des plugins, des packages et des métadonnées de marketplace pour OpenClaw.
Utilisez cette page pour déterminer si un contenu ou un comportement de publication a sa place sur
ClawHub.

Ces règles s’appliquent à ce qu’une fiche fait, à ce qu’elle demande aux utilisateurs d’exécuter, à la manière dont elle
se présente, et à la façon dont les éditeurs utilisent les surfaces de découverte, d’installation et
de confiance de ClawHub. Pour les états de modération et le statut des comptes, consultez
[Modération et sécurité des comptes](/clawhub/moderation). Pour les réclamations relatives au droit d’auteur ou à d’autres droits,
consultez [Demandes relatives aux droits de contenu](/fr/clawhub/content-rights).

## Contenu autorisé

ClawHub accueille les contenus utiles, compréhensibles et publiés de bonne
foi.

| Catégorie                                         | Autorisé lorsque                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productivité des développeurs                           | La fiche aide les utilisateurs à créer, tester, migrer, déboguer, documenter ou exploiter des logiciels.                                               |
| Workflows d’interface utilisateur, de données et d’automatisation               | Le périmètre est clair, les identifiants requis sont explicites, et les actions risquées incluent des parcours de revue, d’exécution à blanc, d’aperçu ou de confirmation. |
| Sécurité défensive, modération et revue des abus | L’outil est présenté pour une revue autorisée, préserve les preuves et garde claires les limites d’approbation humaine.                          |
| Workflows personnels ou d’équipe                       | Le workflow utilise des comptes basés sur le consentement, une configuration transparente et des autorisations explicites.                                            |
| Catalogues maintenus                              | Chaque fiche est distincte, utile, décrite avec précision et raisonnablement maintenue.                                                |

Le contexte compte. Le même sujet peut être acceptable dans un cadre défensif restreint ou
basé sur le consentement, et inacceptable lorsqu’il est empaqueté comme un workflow d’abus.

## Contenu interdit

ClawHub n’héberge pas de contenu dont l’objectif principal est l’abus, la tromperie, l’exécution
non sûre ou l’atteinte aux droits.

| Catégorie                                                    | Non autorisé                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accès non autorisé ou contournement de sécurité                      | Contournement de l’authentification, prise de contrôle de compte, abus des limites de débit, prise de contrôle d’appel en direct ou d’agent, vol de session réutilisable, ou approbation automatique de flux d’association pour des utilisateurs non approuvés.                                                                                                                                                   |
| Abus de plateforme et contournement de bannissement                              | Comptes furtifs après bannissement, réchauffement ou élevage de comptes, faux engagement, automatisation multicompte, publication de masse, bots de spam, ou automatisation conçue pour éviter la détection.                                                                                                                                          |
| Fraude, arnaques et workflows financiers trompeurs             | Faux certificats ou factures, flux de paiement trompeurs, prospection frauduleuse, fausse preuve sociale, workflows d’identité synthétique pour la fraude, ou outils de dépense/facturation sans approbation humaine claire.                                                                                                                    |
| Enrichissement portant atteinte à la vie privée ou surveillance                 | Extraction de contacts pour le spam, doxxing, harcèlement, extraction de prospects associée à une prospection non sollicitée, surveillance discrète, correspondance biométrique non consentie, ou utilisation de données divulguées ou de dumps issus de violations.                                                                                                                  |
| Usurpation non consentie ou manipulation d’identité       | Échange de visage, jumeaux numériques, influenceurs clonés, fausses personas, ou autres outils utilisés pour usurper une identité ou induire en erreur.                                                                                                                                                                                                 |
| Contenu sexuel explicite ou génération adulte avec sécurité désactivée | Génération d’images, de vidéos ou de contenus NSFW ; wrappers de contenu adulte autour d’API tierces ; ou fiches dont l’objectif principal est le contenu sexuel explicite.                                                                                                                                                       |
| Exigences d’exécution cachées, dangereuses ou trompeuses        | Commandes d’installation obscurcies, programmes d’installation pipe-to-shell tels que du contenu téléchargé exécuté avec `sh` ou `bash` sans possibilité de revue claire, exigences non déclarées de secrets ou de clés privées, exécution distante de `npx @latest` sans possibilité de revue claire, ou métadonnées qui cachent ce dont la fiche a réellement besoin pour s’exécuter. |
| Matériel portant atteinte au droit d’auteur ou violant des droits           | Republication de la skill, du plugin, de la documentation, des actifs de marque ou du code propriétaire de quelqu’un d’autre sans autorisation ; violation des termes de licence ; ou usurpation de l’auteur ou de l’éditeur d’origine.                                                                                                                            |

## Comportements interdits sur la marketplace

ClawHub examine également la façon dont les éditeurs utilisent la marketplace. N’utilisez pas ClawHub pour
manipuler la découverte, les métriques, les signaux de confiance, les systèmes de modération ou
l’attention des utilisateurs.

Les comportements interdits sur la marketplace incluent :

- la publication en masse d’un grand nombre de fiches à faible effort, dupliquées, factices ou
  générées par machine qui ne semblent pas avoir de valeur réelle pour les utilisateurs
- l’inondation des surfaces de recherche ou de catégories avec des skills ou des plugins presque identiques
- la publication de centaines de fiches avec peu ou pas d’usage, de maintenance, de clarté sur la source
  ou de différenciation significative
- le gonflement artificiel des installations, téléchargements, étoiles ou autres métriques
  d’engagement par automatisation, boucles d’auto-installation, faux comptes, activité
  coordonnée, engagement rémunéré ou autre comportement non organique
- la création ou la rotation de comptes pour contourner la modération, les bannissements, les limites d’éditeur ou
  la revue de la marketplace
- l’induction en erreur des utilisateurs sur la propriété, la source, les capacités, la posture de sécurité,
  les exigences d’installation ou l’affiliation à un autre projet ou éditeur
- le téléversement répété de contenu qui a déjà été masqué, supprimé ou bloqué
  sans corriger le problème sous-jacent

La publication à fort volume n’est pas automatiquement un abus. Les grands catalogues sont acceptables
lorsque les fiches sont réellement différentes, décrites avec précision, maintenues
et utilisées par de vrais utilisateurs. Les grands catalogues deviennent un problème de confiance et de sécurité lorsque
le volume est associé à des fiches peu étoffées, dupliquées, trompeuses, non maintenues ou
promues artificiellement.

## Droits de contenu

Si vous pensez qu’un contenu sur ClawHub porte atteinte à votre droit d’auteur ou à d’autres droits, utilisez
[Demandes relatives aux droits de contenu](/fr/clawhub/content-rights). N’utilisez pas les signalements normaux de la marketplace
pour les réclamations de droit d’auteur ou de droits, sauf si la fiche est également dangereuse,
malveillante ou trompeuse.

## Revue et application

ClawHub peut utiliser des contrôles automatisés, des signaux statistiques d’abus, des signalements d’utilisateurs et une
revue par le personnel pour identifier les contenus dangereux ou les comportements de publication abusifs. Un signal
ne prouve pas à lui seul un abus ; il aide ClawHub à décider ce qui doit être examiné.

Nous pouvons :

- masquer, mettre en attente, supprimer, supprimer de façon réversible ou, lorsque le type de ressource le prend en charge,
  supprimer définitivement les fiches en infraction
- bloquer les téléchargements ou les installations des versions dangereuses
- révoquer les jetons d’API
- supprimer de façon réversible le contenu associé
- restreindre l’accès à la publication
- bannir les récidivistes ou les auteurs d’infractions graves

Nous ne garantissons pas une application précédée d’un avertissement pour les abus manifestes. Consultez
[Modération et sécurité des comptes](/clawhub/moderation) pour les signalements, les mises en attente de modération,
les fiches masquées, les bannissements et le statut des comptes.
