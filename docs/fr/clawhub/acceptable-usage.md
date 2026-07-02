---
read_when:
    - Examen des téléversements pour détecter les abus ou les violations des politiques
    - Rédaction de documentation de modération ou de runbooks pour les reviewers
    - Décider si une skill doit être masquée ou si un utilisateur doit être banni
sidebarTitle: Acceptable Usage
summary: 'Politique de la marketplace : ce que ClawHub autorise et ce qu’il n’hébergera pas.'
title: Utilisation acceptable
x-i18n:
    generated_at: "2026-07-02T22:28:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Utilisation acceptable

ClawHub héberge des Skills, des Plugins, des packages et des métadonnées de marketplace pour OpenClaw.
Utilisez cette page pour décider si un contenu ou un comportement de publication a sa place sur
ClawHub.

Ces règles s'appliquent à ce que fait une fiche, à ce qu'elle demande aux utilisateurs d'exécuter, à la façon dont elle
se présente, et à la manière dont les éditeurs utilisent les surfaces de découverte, d'installation et
de confiance de ClawHub. Pour les états de modération et la situation des comptes, consultez
[Modération et sécurité des comptes](/clawhub/moderation). Pour les réclamations liées au droit d'auteur ou à d'autres droits,
consultez [Demandes relatives aux droits du contenu](/fr/clawhub/content-rights).

## Contenu autorisé

ClawHub accepte les contenus utiles, compréhensibles et publiés de bonne
foi.

| Catégorie                                         | Autorisé lorsque                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productivité des développeurs                           | La fiche aide les utilisateurs à créer, tester, migrer, déboguer, documenter ou exploiter des logiciels.                                               |
| Workflows d'interface utilisateur, de données et d'automatisation               | Le périmètre est clair, les identifiants requis sont explicites, et les actions risquées incluent des parcours de révision, d'essai à blanc, d'aperçu ou de confirmation. |
| Sécurité défensive, modération et examen des abus | L'outil est présenté pour un examen autorisé, préserve les preuves et maintient des limites claires d'approbation humaine.                          |
| Workflows personnels ou d'équipe                       | Le workflow utilise des comptes fondés sur le consentement, une configuration transparente et des autorisations explicites.                                            |
| Catalogues maintenus                              | Chaque fiche est distincte, utile, décrite avec précision et raisonnablement maintenue.                                                |

Le contexte compte. Le même sujet peut être acceptable dans un cadre défensif étroit ou
fondé sur le consentement, et inacceptable lorsqu'il est conditionné comme un workflow d'abus.

## Contenu interdit

ClawHub n'héberge pas de contenu dont l'objectif principal est l'abus, la tromperie, l'exécution
dangereuse ou la violation de droits.

| Catégorie                                                    | Non autorisé                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accès non autorisé ou contournement de la sécurité                      | Contournement d'authentification, prise de contrôle de compte, abus de limitation de débit, prise de contrôle d'appel ou d'agent en direct, vol de session réutilisable, ou approbation automatique de flux d'association pour des utilisateurs non approuvés.                                                                                                                                                   |
| Abus de plateforme et contournement d'interdiction                              | Comptes furtifs après des interdictions, préparation ou élevage de comptes, faux engagement, automatisation multi-comptes, publication de masse, robots de spam, ou automatisation conçue pour éviter la détection.                                                                                                                                          |
| Fraude, escroqueries et workflows financiers trompeurs             | Faux certificats ou factures, flux de paiement trompeurs, prospection frauduleuse, fausse preuve sociale, workflows d'identité synthétique pour fraude, ou outils de dépense/facturation sans approbation humaine claire.                                                                                                                    |
| Enrichissement ou surveillance attentatoires à la vie privée                 | Extraction de contacts à des fins de spam, doxxing, harcèlement, extraction de prospects associée à une prospection non sollicitée, surveillance dissimulée, correspondance biométrique non consensuelle, ou utilisation de données divulguées ou d'archives issues de violations.                                                                                                                  |
| Usurpation d'identité ou manipulation d'identité non consensuelle       | Face swap, jumeaux numériques, influenceurs clonés, faux personnages, ou autres outils utilisés pour usurper une identité ou tromper.                                                                                                                                                                                                 |
| Contenu sexuel explicite ou génération adulte avec sécurité désactivée | Génération d'images, de vidéos ou de contenu NSFW ; enveloppes de contenu adulte autour d'API tierces ; ou fiches dont l'objectif principal est le contenu sexuel explicite.                                                                                                                                                       |
| Exigences d'exécution cachées, dangereuses ou trompeuses        | Commandes d'installation obscurcies, installateurs pipe-to-shell tels que du contenu téléchargé exécuté avec `sh` ou `bash` sans possibilité d'examen claire, exigences non déclarées de secrets ou de clés privées, exécution distante de `npx @latest` sans possibilité d'examen claire, ou métadonnées qui masquent ce dont la fiche a réellement besoin pour fonctionner. |
| Matériel enfreignant le droit d'auteur ou violant des droits           | Republier la skill, le plugin, la documentation, les ressources de marque ou le code propriétaire de quelqu'un d'autre sans autorisation ; violer des conditions de licence ; ou usurper l'identité de l'auteur ou de l'éditeur d'origine.                                                                                                                            |

## Comportement interdit sur la marketplace

ClawHub examine également la façon dont les éditeurs utilisent la marketplace. N'utilisez pas ClawHub pour
manipuler la découverte, les métriques, les signaux de confiance, les systèmes de modération ou
l'attention des utilisateurs.

Les comportements interdits sur la marketplace incluent :

- publier en masse un grand nombre de fiches à faible effort, dupliquées, factices ou
  générées par machine qui ne semblent pas apporter de réelle valeur aux utilisateurs
- inonder les surfaces de recherche ou de catégories avec des skills ou des plugins presque identiques
- publier des centaines de fiches avec peu ou pas d'utilisation, de maintenance, de clarté de source
  ou de différenciation significative
- gonfler artificiellement les installations, téléchargements, étoiles ou autres métriques d'engagement
  par l'automatisation, des boucles d'auto-installation, de faux comptes, une activité coordonnée,
  de l'engagement rémunéré ou d'autres comportements non organiques
- créer ou alterner des comptes pour contourner la modération, les interdictions, les limites des éditeurs ou
  l'examen de la marketplace
- tromper les utilisateurs sur la propriété, la source, les capacités, la posture de sécurité,
  les exigences d'installation ou l'affiliation à un autre projet ou éditeur
- téléverser à répétition du contenu qui a déjà été masqué, supprimé ou bloqué
  sans corriger le problème sous-jacent

La publication à volume élevé n'est pas automatiquement un abus. Les grands catalogues sont acceptables
lorsque les fiches sont réellement différentes, décrites avec précision, maintenues
et utilisées par de vrais utilisateurs. Les grands catalogues deviennent un problème de confiance et de sécurité lorsque
le volume est associé à des fiches superficielles, dupliquées, trompeuses, non maintenues ou
promues artificiellement.

## Droits du contenu

Si vous pensez qu'un contenu sur ClawHub enfreint votre droit d'auteur ou d'autres droits, utilisez
[Demandes relatives aux droits du contenu](/fr/clawhub/content-rights). N'utilisez pas les signalements normaux de la marketplace
pour les réclamations liées au droit d'auteur ou aux droits, sauf si la fiche est également dangereuse,
malveillante ou trompeuse.

## Examen et application

ClawHub peut utiliser des vérifications automatisées, des signaux statistiques d'abus, des signalements d'utilisateurs et
un examen par l'équipe pour identifier les contenus dangereux ou les comportements de publication abusifs. Un signal
ne prouve pas un abus à lui seul ; il aide ClawHub à décider ce qui doit être examiné.

Nous pouvons :

- masquer, suspendre, retirer, supprimer de manière réversible ou, lorsque le type de ressource le prend en charge,
  supprimer définitivement les fiches en infraction
- bloquer les téléchargements ou installations pour les versions dangereuses
- révoquer les jetons d'API
- supprimer de manière réversible le contenu associé
- restreindre l'accès à la publication
- bannir les contrevenants récidivistes ou graves

Nous ne garantissons pas une application précédée d'un avertissement pour les abus évidents. Consultez
[Modération et sécurité des comptes](/clawhub/moderation) pour les signalements, les blocages de modération,
les fiches masquées, les bannissements et la situation des comptes.
