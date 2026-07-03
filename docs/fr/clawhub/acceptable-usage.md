---
read_when:
    - Examen des téléversements pour détecter les abus ou les violations des règles
    - Rédaction de docs de modération ou de guides d’exécution pour les réviseurs
    - Décider si une skill doit être masquée ou si un utilisateur doit être banni
sidebarTitle: Acceptable Usage
summary: 'Politique de la place de marché : ce que ClawHub autorise et ce qu’il n’hébergera pas.'
title: Utilisation acceptable
x-i18n:
    generated_at: "2026-07-03T09:32:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Utilisation acceptable

ClawHub héberge des Skills, Plugins, packages et métadonnées de marketplace pour OpenClaw.
Utilisez cette page pour déterminer si un contenu ou un comportement de publication a sa place sur
ClawHub.

Ces règles s’appliquent à ce que fait une fiche, à ce qu’elle demande aux utilisateurs d’exécuter, à la manière dont elle
se présente, et à la façon dont les éditeurs utilisent les surfaces de découverte, d’installation et de
confiance de ClawHub. Pour les états de modération et le statut des comptes, consultez
[Modération et sécurité des comptes](/clawhub/moderation). Pour les réclamations relatives aux droits d’auteur ou à d’autres droits,
consultez [Demandes relatives aux droits sur le contenu](/clawhub/content-rights).

## Contenu autorisé

ClawHub accueille les contenus utiles, compréhensibles et publiés de bonne
foi.

| Catégorie                                         | Autorisé lorsque                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productivité des développeurs                           | La fiche aide les utilisateurs à créer, tester, migrer, déboguer, documenter ou exploiter des logiciels.                                               |
| Workflows d’interface utilisateur, de données et d’automatisation               | La portée est claire, les identifiants requis sont explicites, et les actions risquées incluent des parcours de révision, de simulation, d’aperçu ou de confirmation. |
| Sécurité défensive, modération et examen des abus | L’outil est présenté pour un examen autorisé, préserve les preuves et maintient des limites claires d’approbation humaine.                          |
| Workflows personnels ou d’équipe                       | Le workflow utilise des comptes fondés sur le consentement, une configuration transparente et des autorisations explicites.                                            |
| Catalogues maintenus                              | Chaque fiche est distincte, utile, décrite avec exactitude et raisonnablement maintenue.                                                |

Le contexte compte. Un même sujet peut être acceptable dans un cadre défensif restreint ou
fondé sur le consentement, et inacceptable lorsqu’il est présenté comme un workflow d’abus.

## Contenu interdit

ClawHub n’héberge pas de contenus dont l’objectif principal est l’abus, la tromperie, l’exécution
non sûre ou l’atteinte aux droits.

| Catégorie                                                    | Non autorisé                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accès non autorisé ou contournement de sécurité                      | Contournement de l’authentification, prise de contrôle de compte, abus des limites de débit, prise de contrôle d’appel en direct ou d’agent, vol réutilisable de session, ou approbation automatique de flux d’association pour des utilisateurs non approuvés.                                                                                                                                                   |
| Abus de plateforme et contournement de bannissement                              | Comptes furtifs après bannissement, échauffement ou culture de comptes, engagement factice, automatisation multi-comptes, publication de masse, bots de spam, ou automatisation conçue pour éviter la détection.                                                                                                                                          |
| Fraude, escroqueries et workflows financiers trompeurs             | Faux certificats ou factures, flux de paiement trompeurs, prospection frauduleuse, preuve sociale factice, workflows d’identité synthétique à des fins de fraude, ou outils de dépense/facturation sans approbation humaine claire.                                                                                                                    |
| Enrichissement ou surveillance portant atteinte à la vie privée                 | Collecte de contacts pour spam, doxxing, harcèlement, extraction de prospects associée à une prospection non sollicitée, surveillance dissimulée, correspondance biométrique non consentie, ou utilisation de données divulguées ou de dumps issus de violations.                                                                                                                  |
| Usurpation non consentie ou manipulation d’identité       | Échange de visage, jumeaux numériques, influenceurs clonés, faux personnages, ou autres outils utilisés pour usurper une identité ou induire en erreur.                                                                                                                                                                                                 |
| Contenu sexuel explicite ou génération adulte avec sécurité désactivée | Génération d’images, de vidéos ou de contenus NSFW ; wrappers de contenu adulte autour d’API tierces ; ou fiches dont l’objectif principal est le contenu sexuel explicite.                                                                                                                                                       |
| Exigences d’exécution masquées, non sûres ou trompeuses        | Commandes d’installation obfusquées, installateurs pipe-to-shell comme du contenu téléchargé exécuté avec `sh` ou `bash` sans possibilité de révision claire, exigences non déclarées de secrets ou de clés privées, exécution distante de `npx @latest` sans possibilité de révision claire, ou métadonnées qui masquent ce dont la fiche a réellement besoin pour s’exécuter. |
| Matériel portant atteinte au droit d’auteur ou aux droits           | Republier le Skill, Plugin, la documentation, les ressources de marque ou le code propriétaire de quelqu’un d’autre sans autorisation ; violer les conditions de licence ; ou usurper l’auteur ou l’éditeur original.                                                                                                                            |

## Comportement interdit sur la marketplace

ClawHub examine également la manière dont les éditeurs utilisent la marketplace. N’utilisez pas ClawHub pour
manipuler la découverte, les métriques, les signaux de confiance, les systèmes de modération ou l’attention
des utilisateurs.

Les comportements interdits sur la marketplace incluent :

- publier en masse de grands nombres de fiches peu soignées, dupliquées, indicatives ou
  générées par machine qui ne semblent pas avoir de réelle valeur pour les utilisateurs
- inonder les surfaces de recherche ou de catégories avec des Skills ou Plugins presque identiques
- publier des centaines de fiches avec peu ou pas d’utilisation, de maintenance, de clarté de la source
  ou de différenciation significative
- gonfler artificiellement les installations, téléchargements, étoiles ou autres métriques
  d’engagement au moyen de l’automatisation, de boucles d’auto-installation, de faux comptes, d’une activité
  coordonnée, d’engagement rémunéré ou d’autres comportements non organiques
- créer ou faire tourner des comptes pour contourner la modération, les bannissements, les limites d’éditeur ou
  l’examen de la marketplace
- induire les utilisateurs en erreur concernant la propriété, la source, les capacités, la posture de sécurité,
  les exigences d’installation ou l’affiliation avec un autre projet ou éditeur
- téléverser de manière répétée du contenu qui a déjà été masqué, supprimé ou bloqué
  sans corriger le problème sous-jacent

La publication à grand volume n’est pas automatiquement un abus. Les grands catalogues sont acceptables
lorsque les fiches sont significativement différentes, décrites avec exactitude, maintenues
et utilisées par de vrais utilisateurs. Les grands catalogues deviennent un problème de confiance et de sécurité lorsque
le volume est associé à des fiches minces, dupliquées, trompeuses, non maintenues ou
promues artificiellement.

## Droits sur le contenu

Si vous pensez qu’un contenu sur ClawHub porte atteinte à votre droit d’auteur ou à d’autres droits, utilisez
[Demandes relatives aux droits sur le contenu](/clawhub/content-rights). N’utilisez pas les signalements normaux de marketplace
pour les réclamations relatives au droit d’auteur ou aux droits, sauf si la fiche est également non sûre,
malveillante ou trompeuse.

## Examen et application

ClawHub peut utiliser des contrôles automatisés, des signaux statistiques d’abus, des signalements d’utilisateurs et
un examen par le personnel pour identifier les contenus non sûrs ou les comportements de publication abusifs. Un signal
ne prouve pas à lui seul un abus ; il aide ClawHub à déterminer ce qui doit être examiné.

Nous pouvons :

- masquer, mettre en attente, supprimer, supprimer de manière réversible ou, lorsque le type de ressource le permet,
  supprimer définitivement les fiches en infraction
- bloquer les téléchargements ou les installations pour les versions non sûres
- révoquer des jetons d’API
- supprimer de manière réversible le contenu associé
- restreindre l’accès à la publication
- bannir les contrevenants récidivistes ou graves

Nous ne garantissons pas une application précédée d’un avertissement pour les abus évidents. Consultez
[Modération et sécurité des comptes](/clawhub/moderation) pour les signalements, les mises en attente de modération,
les fiches masquées, les bannissements et le statut des comptes.
