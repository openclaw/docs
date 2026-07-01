---
read_when:
    - Examen des téléversements pour détecter les abus ou les violations de politique
    - Rédaction de documents de modération ou de runbooks pour les réviseurs
    - Décider si une skill doit être masquée ou si un utilisateur doit être banni
sidebarTitle: Acceptable Usage
summary: 'Politique du marketplace : ce que ClawHub autorise et ce qu’il n’hébergera pas.'
title: Utilisation acceptable
x-i18n:
    generated_at: "2026-07-01T15:22:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Utilisation acceptable

ClawHub héberge des Skills, des plugins, des packages et des métadonnées de marketplace pour OpenClaw.
Utilisez cette page pour décider si un contenu ou un comportement de publication a sa place sur
ClawHub.

Ces règles s'appliquent à ce que fait une fiche, à ce qu'elle demande aux utilisateurs d'exécuter, à la manière dont elle
se présente, et à la façon dont les éditeurs utilisent les surfaces de découverte, d'installation et de
confiance de ClawHub. Pour les états de modération et la situation des comptes, consultez
[Modération et sécurité des comptes](/clawhub/moderation). Pour les réclamations liées au droit d'auteur ou à d'autres droits,
consultez [Demandes relatives aux droits de contenu](/fr/clawhub/content-rights).

## Contenu autorisé

ClawHub accueille les contenus utiles, compréhensibles et publiés de bonne
foi.

| Catégorie                                         | Autorisé lorsque                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productivité des développeurs                           | La fiche aide les utilisateurs à créer, tester, migrer, déboguer, documenter ou exploiter des logiciels.                                               |
| Workflows d'interface utilisateur, de données et d'automatisation               | Le périmètre est clair, les identifiants requis sont explicites, et les actions risquées incluent des parcours de revue, d'exécution à blanc, d'aperçu ou de confirmation. |
| Sécurité défensive, modération et revue des abus | L'outil est présenté pour une revue autorisée, préserve les preuves et garde claires les limites d'approbation humaine.                          |
| Workflows personnels ou d'équipe                       | Le workflow utilise des comptes basés sur le consentement, une configuration transparente et des permissions explicites.                                            |
| Catalogues maintenus                              | Chaque fiche est distincte, utile, décrite avec exactitude et raisonnablement maintenue.                                                |

Le contexte compte. Le même sujet peut être acceptable dans un cadre défensif étroit ou
fondé sur le consentement, et inacceptable lorsqu'il est présenté comme un workflow d'abus.

## Contenu interdit

ClawHub n'héberge pas de contenu dont l'objectif principal est l'abus, la tromperie, l'exécution
dangereuse ou l'atteinte aux droits.

| Catégorie                                                    | Non autorisé                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accès non autorisé ou contournement de sécurité                      | Contournement d'authentification, prise de contrôle de compte, abus de limites de débit, prise de contrôle d'appel en direct ou d'agent, vol de session réutilisable, ou approbation automatique de flux d'appairage pour des utilisateurs non approuvés.                                                                                                                                                   |
| Abus de plateforme et contournement d'interdiction                              | Comptes furtifs après interdiction, préparation ou élevage de comptes, faux engagement, automatisation multi-comptes, publication massive, robots de spam ou automatisation conçue pour éviter la détection.                                                                                                                                          |
| Fraude, escroqueries et workflows financiers trompeurs             | Faux certificats ou factures, flux de paiement trompeurs, prospection frauduleuse, fausse preuve sociale, workflows d'identité synthétique pour fraude, ou outils de dépense/facturation sans approbation humaine claire.                                                                                                                    |
| Enrichissement ou surveillance portant atteinte à la vie privée                 | Extraction de contacts pour spam, divulgation d'informations personnelles, harcèlement, extraction de prospects associée à une prospection non sollicitée, surveillance dissimulée, mise en correspondance biométrique non consensuelle, ou utilisation de données divulguées ou de dumps de violations de données.                                                                                                                  |
| Usurpation non consensuelle ou manipulation d'identité       | Échange de visage, jumeaux numériques, influenceurs clonés, fausses personas ou autres outils utilisés pour usurper une identité ou induire en erreur.                                                                                                                                                                                                 |
| Contenu sexuel explicite ou génération adulte sans garde-fous | Génération d'images, de vidéos ou de contenu NSFW ; wrappers de contenu adulte autour d'API tierces ; ou fiches dont l'objectif principal est le contenu sexuel explicite.                                                                                                                                                       |
| Exigences d'exécution cachées, dangereuses ou trompeuses        | Commandes d'installation obfusquées, installateurs pipe-to-shell tels que du contenu téléchargé exécuté avec `sh` ou `bash` sans capacité de revue claire, exigences non déclarées de secret ou de clé privée, exécution distante de `npx @latest` sans capacité de revue claire, ou métadonnées qui cachent ce dont la fiche a réellement besoin pour s'exécuter. |
| Matériel portant atteinte au droit d'auteur ou violant des droits           | Republier le skill, le plugin, la documentation, les ressources de marque ou le code propriétaire de quelqu'un d'autre sans permission ; violer les conditions de licence ; ou usurper l'identité de l'auteur ou de l'éditeur d'origine.                                                                                                                            |

## Comportement de marketplace interdit

ClawHub examine également la façon dont les éditeurs utilisent la marketplace. N'utilisez pas ClawHub pour
manipuler la découverte, les métriques, les signaux de confiance, les systèmes de modération ou
l'attention des utilisateurs.

Les comportements de marketplace interdits incluent :

- la publication en masse de grands nombres de fiches à faible effort, dupliquées, temporaires ou
  générées par machine qui ne semblent pas avoir de valeur réelle pour les utilisateurs
- l'inondation des surfaces de recherche ou de catégorie avec des Skills ou plugins presque identiques
- la publication de centaines de fiches avec peu ou pas d'utilisation, de maintenance, de clarté de source
  ou de différenciation significative
- le gonflement artificiel des installations, téléchargements, étoiles ou autres métriques d'engagement
  par automatisation, boucles d'auto-installation, faux comptes, activité coordonnée,
  engagement rémunéré ou autre comportement non organique
- la création ou la rotation de comptes pour contourner la modération, les interdictions, les limites d'éditeur ou
  la revue de marketplace
- l'induction en erreur des utilisateurs concernant la propriété, la source, les capacités, la posture de sécurité,
  les exigences d'installation ou l'affiliation avec un autre projet ou éditeur
- le téléversement répété de contenu qui a déjà été masqué, supprimé ou bloqué
  sans corriger le problème sous-jacent

La publication à grand volume n'est pas automatiquement un abus. Les grands catalogues sont acceptables
lorsque les fiches sont significativement différentes, décrites avec exactitude, maintenues
et utilisées par de vrais utilisateurs. Les grands catalogues deviennent un problème de confiance et de sécurité lorsque
le volume est associé à des fiches superficielles, dupliquées, trompeuses, non maintenues ou
promues artificiellement.

## Droits de contenu

Si vous pensez qu'un contenu sur ClawHub porte atteinte à votre droit d'auteur ou à d'autres droits, utilisez
[Demandes relatives aux droits de contenu](/fr/clawhub/content-rights). N'utilisez pas les signalements normaux de marketplace
pour les réclamations liées au droit d'auteur ou aux droits, sauf si la fiche est également dangereuse,
malveillante ou trompeuse.

## Revue et application des règles

ClawHub peut utiliser des vérifications automatisées, des signaux statistiques d'abus, des signalements d'utilisateurs et
une revue par l'équipe pour identifier les contenus dangereux ou les comportements de publication abusifs. Un signal
ne prouve pas un abus à lui seul ; il aide ClawHub à décider ce qui doit être revu.

Nous pouvons :

- masquer, retenir, supprimer, supprimer provisoirement ou, lorsque le type de ressource le permet,
  supprimer définitivement les fiches en infraction
- bloquer les téléchargements ou les installations pour les versions dangereuses
- révoquer des jetons d'API
- supprimer provisoirement le contenu associé
- restreindre l'accès à la publication
- bannir les récidivistes ou les auteurs d'infractions graves

Nous ne garantissons pas une application des règles précédée d'un avertissement en cas d'abus évident. Consultez
[Modération et sécurité des comptes](/clawhub/moderation) pour les signalements, les retenues de modération,
les fiches masquées, les bannissements et la situation des comptes.
