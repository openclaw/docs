---
read_when:
    - Examen des téléversements pour détecter les abus ou les violations des règles
    - Rédaction de documentation de modération ou de guides d’exécution pour les reviewers
    - Décider si une skill doit être masquée ou un utilisateur banni
sidebarTitle: Acceptable Usage
summary: 'Politique de la place de marché : ce que ClawHub autorise et ce qu’il n’hébergera pas.'
title: Utilisation acceptable
x-i18n:
    generated_at: "2026-07-01T18:10:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Utilisation acceptable

ClawHub héberge des Skills, des plugins, des packages et les métadonnées de marketplace pour OpenClaw.
Utilisez cette page pour décider si un contenu ou un comportement de publication a sa place sur
ClawHub.

Ces règles s’appliquent à ce qu’une fiche fait, à ce qu’elle demande aux utilisateurs d’exécuter, à la manière dont elle
se présente et à la manière dont les éditeurs utilisent les surfaces de découverte, d’installation et de
confiance de ClawHub. Pour les états de modération et le statut du compte, consultez
[Modération et sécurité des comptes](/clawhub/moderation). Pour les réclamations relatives au droit d’auteur ou à d’autres droits,
consultez [Demandes relatives aux droits sur le contenu](/fr/clawhub/content-rights).

## Contenu autorisé

ClawHub accueille les contenus utiles, compréhensibles et publiés de bonne
foi.

| Catégorie                                        | Autorisé lorsque                                                                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productivité des développeurs                    | La fiche aide les utilisateurs à créer, tester, migrer, déboguer, documenter ou exploiter des logiciels.                          |
| Workflows d’UI, de données et d’automatisation   | Le périmètre est clair, les identifiants requis sont explicites, et les actions risquées incluent des chemins de revue, de simulation, d’aperçu ou de confirmation. |
| Sécurité défensive, modération et revue des abus | L’outil est présenté pour une revue autorisée, préserve les preuves et garde claires les limites d’approbation humaine.            |
| Workflows personnels ou d’équipe                 | Le workflow utilise des comptes fondés sur le consentement, une configuration transparente et des autorisations explicites.        |
| Catalogues maintenus                             | Chaque fiche est distincte, utile, décrite avec précision et raisonnablement maintenue.                                           |

Le contexte compte. Un même sujet peut être acceptable dans un cadre défensif étroit ou
fondé sur le consentement, et inacceptable lorsqu’il est conditionné comme un workflow d’abus.

## Contenu interdit

ClawHub n’héberge pas de contenu dont le but principal est l’abus, la tromperie, l’exécution
non sûre ou la violation de droits.

| Catégorie                                                   | Non autorisé                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accès non autorisé ou contournement de sécurité             | Contournement d’authentification, prise de contrôle de compte, abus des limites de débit, prise de contrôle d’appel en direct ou d’agent, vol de session réutilisable, ou approbation automatique de flux d’appairage pour des utilisateurs non approuvés.                                                     |
| Abus de plateforme et contournement de bannissement         | Comptes furtifs après bannissement, préchauffage ou culture de comptes, faux engagement, automatisation multi-comptes, publication de masse, bots de spam, ou automatisation conçue pour éviter la détection.                                                                                                  |
| Fraude, escroqueries et workflows financiers trompeurs      | Faux certificats ou factures, flux de paiement trompeurs, prospection frauduleuse, fausse preuve sociale, workflows d’identité synthétique à des fins de fraude, ou outils de dépense/facturation sans approbation humaine claire.                                                                             |
| Enrichissement ou surveillance portant atteinte à la vie privée | Extraction de contacts pour spam, doxxing, harcèlement, extraction de prospects associée à une prospection non sollicitée, surveillance dissimulée, appariement biométrique non consenti, ou utilisation de données divulguées ou de dumps issus de violations.                                                |
| Usurpation non consentie ou manipulation d’identité         | Échange de visage, jumeaux numériques, influenceurs clonés, faux personnages, ou autres outils utilisés pour usurper une identité ou induire en erreur.                                                                                                                                                       |
| Contenu sexuel explicite ou génération adulte sans garde-fous | Génération d’images, de vidéos ou de contenu NSFW ; wrappers de contenu adulte autour d’API tierces ; ou fiches dont l’objectif principal est le contenu sexuel explicite.                                                                                                                                    |
| Exigences d’exécution cachées, non sûres ou trompeuses      | Commandes d’installation obfusquées, installateurs pipe-to-shell comme du contenu téléchargé exécuté avec `sh` ou `bash` sans revue clairement possible, exigences non déclarées de secret ou de clé privée, exécution distante de `npx @latest` sans revue clairement possible, ou métadonnées qui masquent ce dont la fiche a réellement besoin pour s’exécuter. |
| Matériel portant atteinte au droit d’auteur ou à d’autres droits | Republier la Skill, le plugin, la documentation, les ressources de marque ou le code propriétaire d’une autre personne sans autorisation ; violer les conditions de licence ; ou se faire passer pour l’auteur ou l’éditeur d’origine.                                                                          |

## Comportement de marketplace interdit

ClawHub examine également la manière dont les éditeurs utilisent la marketplace. N’utilisez pas ClawHub pour
manipuler la découverte, les métriques, les signaux de confiance, les systèmes de modération ou
l’attention des utilisateurs.

Les comportements de marketplace interdits incluent :

- publier en masse un grand nombre de fiches à faible effort, dupliquées, provisoires ou
  générées par machine, qui ne semblent pas avoir de valeur réelle pour les utilisateurs
- inonder les surfaces de recherche ou de catégorie avec des Skills ou plugins quasi identiques
- publier des centaines de fiches avec peu ou pas d’usage, de maintenance, de clarté sur la source
  ou de différenciation significative
- gonfler artificiellement les installations, téléchargements, étoiles ou autres métriques
  d’engagement au moyen d’automatisation, de boucles d’auto-installation, de faux comptes, d’activité
  coordonnée, d’engagement payé ou d’autres comportements non organiques
- créer ou faire tourner des comptes pour contourner la modération, les bannissements, les limites d’éditeur ou
  la revue de la marketplace
- induire les utilisateurs en erreur sur la propriété, la source, les capacités, la posture de sécurité,
  les exigences d’installation ou l’affiliation avec un autre projet ou éditeur
- téléverser à répétition du contenu qui a déjà été masqué, retiré ou bloqué
  sans corriger le problème sous-jacent

La publication à grand volume n’est pas automatiquement un abus. Les grands catalogues sont acceptables
lorsque les fiches sont réellement différentes, décrites avec précision, maintenues
et utilisées par de vrais utilisateurs. Les grands catalogues deviennent un problème de confiance et de sécurité lorsque
le volume s’accompagne de fiches superficielles, dupliquées, trompeuses, non maintenues ou
promues artificiellement.

## Droits sur le contenu

Si vous pensez qu’un contenu sur ClawHub enfreint votre droit d’auteur ou d’autres droits, utilisez
[Demandes relatives aux droits sur le contenu](/fr/clawhub/content-rights). N’utilisez pas les signalements normaux de marketplace
pour les réclamations relatives au droit d’auteur ou aux droits, sauf si la fiche est également non sûre,
malveillante ou trompeuse.

## Revue et application

ClawHub peut utiliser des contrôles automatisés, des signaux statistiques d’abus, des signalements d’utilisateurs et
une revue par le personnel pour identifier le contenu non sûr ou les comportements de publication abusifs. Un signal
ne prouve pas à lui seul un abus ; il aide ClawHub à décider ce qui doit être examiné.

Nous pouvons :

- masquer, retenir, retirer, supprimer de manière réversible ou, lorsque le type de ressource le permet,
  supprimer définitivement les fiches en infraction
- bloquer les téléchargements ou les installations pour les versions non sûres
- révoquer des jetons API
- supprimer de manière réversible le contenu associé
- restreindre l’accès à la publication
- bannir les récidivistes ou les auteurs d’infractions graves

Nous ne garantissons pas une application précédée d’un avertissement pour les abus évidents. Consultez
[Modération et sécurité des comptes](/clawhub/moderation) pour les signalements, les blocages de modération,
les fiches masquées, les bannissements et le statut du compte.
