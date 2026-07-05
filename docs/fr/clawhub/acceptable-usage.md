---
read_when:
    - Examen des téléversements pour détecter les abus ou les violations de règles
    - Rédaction de documents de modération ou de guides d’exécution pour les réviseurs
    - Décider si une skill doit être masquée ou si un utilisateur doit être banni
sidebarTitle: Acceptable Usage
summary: 'Politique de la place de marché : ce que ClawHub autorise et ce qu’il n’hébergera pas.'
title: Utilisation acceptable
x-i18n:
    generated_at: "2026-07-05T05:51:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Usage acceptable

ClawHub héberge des Skills, des Plugins, des paquets et des métadonnées de place de marché pour OpenClaw.
Utilisez cette page pour déterminer si un contenu ou un comportement de publication a sa place sur
ClawHub.

Ces règles s’appliquent à ce que fait une fiche, à ce qu’elle demande aux utilisateurs d’exécuter, à la façon dont elle
se présente, et à la façon dont les éditeurs utilisent les surfaces de découverte, d’installation et de
confiance de ClawHub. Pour les états de modération et la réputation des comptes, consultez
[Modération et sécurité des comptes](/clawhub/moderation). Pour les réclamations liées au droit d’auteur ou à d’autres droits,
consultez [Demandes relatives aux droits sur le contenu](/clawhub/content-rights).

## Contenu autorisé

ClawHub accueille les contenus utiles, compréhensibles et publiés de bonne
foi.

| Catégorie                                         | Autorisé lorsque                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productivité des développeurs                           | La fiche aide les utilisateurs à créer, tester, migrer, déboguer, documenter ou exploiter des logiciels.                                               |
| Flux de travail d’interface utilisateur, de données et d’automatisation               | Le périmètre est clair, les identifiants requis sont explicites, et les actions risquées comprennent des parcours de revue, d’exécution à blanc, d’aperçu ou de confirmation. |
| Sécurité défensive, modération et examen des abus | L’outil est présenté pour un examen autorisé, préserve les preuves et garde claires les limites d’approbation humaine.                          |
| Flux de travail personnels ou d’équipe                       | Le flux de travail utilise des comptes fondés sur le consentement, une configuration transparente et des autorisations explicites.                                            |
| Catalogues maintenus                              | Chaque fiche est distincte, utile, décrite avec exactitude et raisonnablement maintenue.                                                |

Le contexte compte. Le même sujet peut être acceptable dans un cadre défensif étroit ou
fondé sur le consentement, et inacceptable lorsqu’il est empaqueté comme un flux de travail d’abus.

## Contenu interdit

ClawHub n’héberge pas de contenu dont l’objectif principal est l’abus, la tromperie, l’exécution
dangereuse ou l’atteinte aux droits.

| Catégorie                                                    | Non autorisé                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accès non autorisé ou contournement de sécurité                      | Contournement d’authentification, prise de contrôle de compte, abus des limites de débit, prise de contrôle d’un appel ou d’un agent en direct, vol de session réutilisable, ou approbation automatique de flux d’association pour des utilisateurs non approuvés.                                                                                                                                                   |
| Abus de plateforme et contournement de bannissement                              | Comptes furtifs après bannissement, préchauffage ou élevage de comptes, faux engagement, automatisation multi-comptes, publication massive, robots de spam, ou automatisation conçue pour éviter la détection.                                                                                                                                          |
| Fraude, arnaques et flux de travail financiers trompeurs             | Faux certificats ou factures, flux de paiement trompeurs, prospection frauduleuse, fausse preuve sociale, flux de travail d’identité synthétique pour la fraude, ou outils de dépense/facturation sans approbation humaine claire.                                                                                                                    |
| Enrichissement ou surveillance portant atteinte à la vie privée                 | Extraction de contacts pour le spam, doxxing, harcèlement, extraction de prospects associée à une prospection non sollicitée, surveillance discrète, correspondance biométrique non consensuelle, ou utilisation de données divulguées ou de dumps issus de violations.                                                                                                                  |
| Usurpation d’identité ou manipulation d’identité non consensuelle       | Échange de visages, jumeaux numériques, influenceurs clonés, faux personnages, ou autres outils utilisés pour usurper une identité ou induire en erreur.                                                                                                                                                                                                 |
| Contenu sexuel explicite ou génération adulte avec sécurité désactivée | Génération d’images, de vidéos ou de contenu NSFW ; enveloppes de contenu adulte autour d’API tierces ; ou fiches dont l’objectif principal est le contenu sexuel explicite.                                                                                                                                                       |
| Exigences d’exécution cachées, dangereuses ou trompeuses        | Commandes d’installation obscurcies, installateurs pipe-to-shell tels que du contenu téléchargé exécuté avec `sh` ou `bash` sans possibilité claire d’examen, exigences non déclarées de secrets ou de clés privées, exécution distante de `npx @latest` sans possibilité claire d’examen, ou métadonnées qui cachent ce dont la fiche a réellement besoin pour s’exécuter. |
| Matériel portant atteinte au droit d’auteur ou violant des droits           | Republication du Skill, du Plugin, de la documentation, des actifs de marque ou du code propriétaire de quelqu’un d’autre sans autorisation ; violation des conditions de licence ; ou usurpation de l’auteur ou de l’éditeur d’origine.                                                                                                                            |

## Comportement de place de marché interdit

ClawHub examine aussi la façon dont les éditeurs utilisent la place de marché. N’utilisez pas ClawHub pour
manipuler la découverte, les métriques, les signaux de confiance, les systèmes de modération ou
l’attention des utilisateurs.

Le comportement de place de marché interdit comprend :

- la publication en masse d’un grand nombre de fiches à faible effort, redondantes, temporaires ou
  générées par machine qui ne semblent pas avoir de valeur réelle pour les utilisateurs
- l’inondation des surfaces de recherche ou de catégorie avec des Skills ou des Plugins quasi identiques
- la publication de centaines de fiches avec peu ou pas d’utilisation, de maintenance, de clarté de source
  ou de différenciation significative
- le gonflement artificiel des installations, téléchargements, étoiles ou autres métriques
  d’engagement au moyen d’automatisation, de boucles d’auto-installation, de faux comptes, d’activité
  coordonnée, d’engagement payé ou d’autres comportements non organiques
- la création ou la rotation de comptes pour contourner la modération, les bannissements, les limites d’éditeur ou
  l’examen de la place de marché
- l’induction en erreur des utilisateurs au sujet de la propriété, de la source, des capacités, de la posture de sécurité,
  des exigences d’installation ou de l’affiliation à un autre projet ou éditeur
- l’import répété de contenu qui a déjà été masqué, supprimé ou bloqué
  sans corriger le problème sous-jacent

La publication à grand volume n’est pas automatiquement un abus. Les grands catalogues sont acceptables
lorsque les fiches sont réellement différentes, décrites avec exactitude, maintenues
et utilisées par de vrais utilisateurs. Les grands catalogues deviennent un problème de confiance et de sécurité lorsque
le volume s’accompagne de fiches superficielles, redondantes, trompeuses, non maintenues ou
promues artificiellement.

## Droits sur le contenu

Si vous pensez qu’un contenu sur ClawHub porte atteinte à votre droit d’auteur ou à d’autres droits, utilisez
[Demandes relatives aux droits sur le contenu](/clawhub/content-rights). N’utilisez pas les rapports normaux de la place de marché
pour les réclamations liées au droit d’auteur ou aux droits, sauf si la fiche est également dangereuse,
malveillante ou trompeuse.

## Examen et application

ClawHub peut utiliser des vérifications automatisées, des signaux statistiques d’abus, des signalements d’utilisateurs et
un examen par le personnel pour identifier les contenus dangereux ou les comportements de publication abusifs. Un signal
ne prouve pas l’abus à lui seul ; il aide ClawHub à décider ce qui doit être examiné.

Nous pouvons :

- masquer, mettre en attente, supprimer, supprimer de manière réversible ou, lorsque le type de ressource le permet,
  supprimer définitivement les fiches en infraction
- bloquer les téléchargements ou installations pour les versions dangereuses
- révoquer les jetons d’API
- supprimer de manière réversible le contenu associé
- restreindre l’accès à la publication
- bannir les récidivistes ou les contrevenants graves

Nous ne garantissons pas une application avec avertissement préalable pour les abus manifestes. Consultez
[Modération et sécurité des comptes](/clawhub/moderation) pour les signalements, les mises en attente de modération,
les fiches masquées, les bannissements et la réputation des comptes.
