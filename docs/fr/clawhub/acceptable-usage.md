---
read_when:
    - Examen des téléversements pour détecter les abus ou les violations des règles
    - Rédiger des documents de modération ou des guides opérationnels pour les relecteurs
    - Déterminer si une compétence doit être masquée ou si un utilisateur doit être banni
sidebarTitle: Acceptable Usage
summary: 'Marketplace policy : ce que ClawHub autorise et ce qu’il n’hébergera pas.'
title: Utilisation acceptable
x-i18n:
    generated_at: "2026-07-02T17:35:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Utilisation acceptable

ClawHub héberge des Skills, des plugins, des packages et les métadonnées de place de marché pour OpenClaw.
Utilisez cette page pour déterminer si un contenu ou un comportement de publication a sa place sur
ClawHub.

Ces règles s’appliquent à ce que fait une fiche, à ce qu’elle demande aux utilisateurs d’exécuter, à la manière dont elle
se présente, et à la façon dont les éditeurs utilisent les surfaces de découverte, d’installation et de
confiance de ClawHub. Pour les états de modération et la situation des comptes, consultez
[Modération et sécurité des comptes](/clawhub/moderation). Pour les réclamations liées au droit d’auteur ou à d’autres droits,
consultez [Demandes relatives aux droits de contenu](/clawhub/content-rights).

## Contenu autorisé

ClawHub accueille le contenu utile, compréhensible et publié de bonne
foi.

| Catégorie                                         | Autorisé lorsque                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productivité des développeurs                           | La fiche aide les utilisateurs à créer, tester, migrer, déboguer, documenter ou exploiter des logiciels.                                               |
| Workflows d’interface utilisateur, de données et d’automatisation               | Le périmètre est clair, les identifiants requis sont explicites, et les actions risquées incluent des chemins de revue, de simulation, d’aperçu ou de confirmation. |
| Sécurité défensive, modération et examen des abus | L’outil est présenté pour une revue autorisée, préserve les preuves et maintient des limites claires d’approbation humaine.                          |
| Workflows personnels ou d’équipe                       | Le workflow utilise des comptes fondés sur le consentement, une configuration transparente et des autorisations explicites.                                            |
| Catalogues maintenus                              | Chaque fiche est distincte, utile, décrite avec précision et raisonnablement maintenue.                                                |

Le contexte compte. Un même sujet peut être acceptable dans un cadre défensif étroit ou
fondé sur le consentement, et inacceptable lorsqu’il est empaqueté comme workflow d’abus.

## Contenu interdit

ClawHub n’héberge pas de contenu dont l’objectif principal est l’abus, la tromperie, l’exécution
non sûre ou l’atteinte aux droits.

| Catégorie                                                    | Non autorisé                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accès non autorisé ou contournement de sécurité                      | Contournement d’authentification, prise de contrôle de compte, abus de limites de débit, prise de contrôle d’appel en direct ou d’agent, vol de session réutilisable, ou approbation automatique de flux d’appairage pour des utilisateurs non approuvés.                                                                                                                                                   |
| Abus de plateforme et contournement de bannissement                              | Comptes furtifs après bannissement, préparation ou élevage de comptes, faux engagement, automatisation multicomptes, publication de masse, robots de spam ou automatisation conçue pour éviter la détection.                                                                                                                                          |
| Fraude, escroqueries et workflows financiers trompeurs             | Faux certificats ou fausses factures, flux de paiement trompeurs, démarchage frauduleux, fausse preuve sociale, workflows d’identité synthétique pour la fraude, ou outils de dépense/facturation sans approbation humaine claire.                                                                                                                    |
| Enrichissement ou surveillance intrusifs pour la vie privée                 | Collecte de contacts pour spam, doxxing, harcèlement, extraction de prospects associée à un démarchage non sollicité, surveillance clandestine, correspondance biométrique sans consentement, ou utilisation de données divulguées ou d’archives de fuite.                                                                                                                  |
| Usurpation ou manipulation d’identité sans consentement       | Échange de visage, jumeaux numériques, influenceurs clonés, faux personnages ou autres outils utilisés pour usurper une identité ou tromper.                                                                                                                                                                                                 |
| Contenu sexuel explicite ou génération adulte avec sécurité désactivée | Génération d’images, de vidéos ou de contenu NSFW ; wrappers de contenu adulte autour d’API tierces ; ou fiches dont l’objectif principal est le contenu sexuel explicite.                                                                                                                                                       |
| Exigences d’exécution cachées, non sûres ou trompeuses        | Commandes d’installation obfusquées, installateurs pipe-to-shell tels que du contenu téléchargé exécuté avec `sh` ou `bash` sans possibilité de revue claire, exigences non déclarées de secret ou de clé privée, exécution distante de `npx @latest` sans possibilité de revue claire, ou métadonnées qui masquent ce dont la fiche a réellement besoin pour fonctionner. |
| Matériel enfreignant le droit d’auteur ou violant des droits           | Republier le Skill, le plugin, la documentation, les éléments de marque ou le code propriétaire de quelqu’un d’autre sans autorisation ; violer des conditions de licence ; ou usurper l’identité de l’auteur ou de l’éditeur d’origine.                                                                                                                            |

## Comportement de place de marché interdit

ClawHub examine également la façon dont les éditeurs utilisent la place de marché. N’utilisez pas ClawHub pour
manipuler la découverte, les métriques, les signaux de confiance, les systèmes de modération ou
l’attention des utilisateurs.

Les comportements de place de marché interdits incluent :

- publier en masse un grand nombre de fiches de faible qualité, duplicatives, de remplissage ou
  générées par machine qui ne semblent pas avoir de valeur réelle pour les utilisateurs
- inonder les surfaces de recherche ou de catégorie avec des Skills ou des plugins presque identiques
- publier des centaines de fiches avec peu ou pas d’utilisation, de maintenance, de clarté sur la source
  ou de différenciation significative
- gonfler artificiellement les installations, téléchargements, étoiles ou autres métriques
  d’engagement par l’automatisation, des boucles d’auto-installation, de faux comptes, une activité
  coordonnée, de l’engagement payé ou tout autre comportement non organique
- créer ou faire tourner des comptes pour contourner la modération, les bannissements, les limites d’éditeur ou
  la revue de la place de marché
- induire les utilisateurs en erreur sur la propriété, la source, les capacités, la posture de sécurité,
  les exigences d’installation ou l’affiliation avec un autre projet ou éditeur
- téléverser de manière répétée du contenu qui a déjà été masqué, supprimé ou bloqué
  sans corriger le problème sous-jacent

La publication à grand volume n’est pas automatiquement un abus. Les grands catalogues sont acceptables
lorsque les fiches sont réellement différentes, décrites avec précision, maintenues
et utilisées par de vrais utilisateurs. Les grands catalogues deviennent un problème de confiance et de sécurité lorsque
le volume est associé à des fiches superficielles, duplicatives, trompeuses, non maintenues ou
promues artificiellement.

## Droits de contenu

Si vous pensez qu’un contenu sur ClawHub enfreint votre droit d’auteur ou d’autres droits, utilisez
[Demandes relatives aux droits de contenu](/clawhub/content-rights). N’utilisez pas les signalements normaux de la place de marché
pour les réclamations liées au droit d’auteur ou aux droits, sauf si la fiche est également non sûre,
malveillante ou trompeuse.

## Revue et application

ClawHub peut utiliser des contrôles automatisés, des signaux statistiques d’abus, des signalements d’utilisateurs et
une revue par le personnel pour identifier du contenu non sûr ou un comportement de publication abusif. Un signal
ne prouve pas à lui seul un abus ; il aide ClawHub à décider ce qui doit être revu.

Nous pouvons :

- masquer, retenir, supprimer, effectuer une suppression logique ou, lorsque le type de ressource le prend en charge,
  effectuer une suppression physique des fiches en infraction
- bloquer les téléchargements ou les installations pour les versions non sûres
- révoquer les jetons d’API
- effectuer une suppression logique du contenu associé
- restreindre l’accès à la publication
- bannir les contrevenants récidivistes ou graves

Nous ne garantissons pas une application précédée d’un avertissement pour les abus manifestes. Consultez
[Modération et sécurité des comptes](/clawhub/moderation) pour les signalements, les blocages de modération,
les fiches masquées, les bannissements et la situation des comptes.
