---
read_when:
    - Examen des téléversements pour détecter les abus ou les violations des règles
    - Rédaction de documentation de modération ou de guides opérationnels pour les relecteurs
    - Décider si une compétence doit être masquée ou si un utilisateur doit être banni
sidebarTitle: Acceptable Usage
summary: 'Politique de marketplace : ce que ClawHub autorise et ce qu’il n’hébergera pas.'
title: Utilisation acceptable
x-i18n:
    generated_at: "2026-07-04T10:38:32Z"
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

Ces règles s’appliquent à ce que fait une annonce, à ce qu’elle demande aux utilisateurs d’exécuter, à la façon dont elle
se présente, et à la manière dont les éditeurs utilisent les surfaces de découverte, d’installation et de
confiance de ClawHub. Pour les états de modération et le statut des comptes, consultez
[Modération et sécurité des comptes](/clawhub/moderation). Pour les réclamations relatives au droit d’auteur ou à d’autres droits,
consultez [Demandes relatives aux droits sur le contenu](/fr/clawhub/content-rights).

## Contenu autorisé

ClawHub accueille les contenus utiles, compréhensibles et publiés de bonne
foi.

| Catégorie                                        | Autorisé lorsque                                                                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productivité des développeurs                    | L’annonce aide les utilisateurs à créer, tester, migrer, déboguer, documenter ou exploiter des logiciels.                         |
| Workflows d’interface utilisateur, de données et d’automatisation | Le périmètre est clair, les identifiants requis sont explicites, et les actions risquées incluent des parcours de revue, de simulation, d’aperçu ou de confirmation. |
| Sécurité défensive, modération et revue des abus | L’outil est présenté pour une revue autorisée, préserve les preuves et maintient des limites claires d’approbation humaine.        |
| Workflows personnels ou d’équipe                 | Le workflow utilise des comptes fondés sur le consentement, une configuration transparente et des permissions explicites.          |
| Catalogues maintenus                             | Chaque annonce est distincte, utile, décrite avec précision et raisonnablement maintenue.                                         |

Le contexte compte. Un même sujet peut être acceptable dans un cadre défensif
étroit ou fondé sur le consentement, et inacceptable lorsqu’il est empaqueté comme un workflow d’abus.

## Contenu interdit

ClawHub n’héberge pas de contenu dont l’objectif principal est l’abus, la tromperie, l’exécution
dangereuse ou l’atteinte aux droits.

| Catégorie                                                    | Non autorisé                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accès non autorisé ou contournement de sécurité              | Contournement d’authentification, prise de contrôle de compte, abus de limites de débit, prise de contrôle d’appel en direct ou d’agent, vol de session réutilisable, ou approbation automatique de flux d’appairage pour des utilisateurs non approuvés.                                                                                                                   |
| Abus de plateforme et contournement de bannissement          | Comptes furtifs après bannissement, préparation ou élevage de comptes, faux engagement, automatisation multi-comptes, publication de masse, robots de spam, ou automatisation conçue pour éviter la détection.                                                                                                                                          |
| Fraude, escroqueries et workflows financiers trompeurs       | Faux certificats ou factures, flux de paiement trompeurs, prospection frauduleuse, fausse preuve sociale, workflows d’identité synthétique à des fins de fraude, ou outils de dépense/facturation sans approbation humaine claire.                                                                                                                    |
| Enrichissement intrusif pour la vie privée ou surveillance   | Collecte de contacts pour du spam, doxxing, harcèlement, extraction de prospects associée à une prospection non sollicitée, surveillance clandestine, correspondance biométrique non consentie, ou utilisation de données divulguées ou de dumps de fuite.                                                                                                                  |
| Usurpation non consentie ou manipulation d’identité          | Échange de visage, jumeaux numériques, influenceurs clonés, faux personas, ou autres outils utilisés pour usurper une identité ou tromper.                                                                                                                                                                                                 |
| Contenu sexuel explicite ou génération adulte sans sécurité  | Génération d’images, de vidéos ou de contenu NSFW ; wrappers de contenu adulte autour d’API tierces ; ou annonces dont l’objectif principal est le contenu sexuel explicite.                                                                                                                                                       |
| Exigences d’exécution masquées, dangereuses ou trompeuses    | Commandes d’installation obscurcies, installateurs de type pipe-to-shell comme du contenu téléchargé exécuté avec `sh` ou `bash` sans possibilité claire de revue, exigences non déclarées de secrets ou de clés privées, exécution distante de `npx @latest` sans possibilité claire de revue, ou métadonnées qui masquent ce dont l’annonce a réellement besoin pour s’exécuter. |
| Matériel portant atteinte au droit d’auteur ou à d’autres droits | Republication de la Skill, du plugin, de la documentation, des ressources de marque ou du code propriétaire de quelqu’un d’autre sans permission ; violation de conditions de licence ; ou usurpation de l’auteur ou de l’éditeur original.                                                                                                                            |

## Comportement interdit sur la marketplace

ClawHub examine également la manière dont les éditeurs utilisent la marketplace. N’utilisez pas ClawHub pour
manipuler la découverte, les métriques, les signaux de confiance, les systèmes de modération ou
l’attention des utilisateurs.

Les comportements interdits sur la marketplace incluent :

- publier en masse de grands nombres d’annonces peu travaillées, dupliquées, de remplissage ou
  générées par machine qui ne semblent pas avoir de valeur réelle pour les utilisateurs
- inonder les surfaces de recherche ou de catégories avec des Skills ou des plugins presque identiques
- publier des centaines d’annonces avec peu ou pas d’utilisation, de maintenance, de clarté sur la source
  ou de différenciation significative
- gonfler artificiellement les installations, téléchargements, étoiles ou autres métriques
  d’engagement au moyen de l’automatisation, de boucles d’auto-installation, de faux comptes, d’une activité
  coordonnée, d’un engagement rémunéré ou d’autres comportements non organiques
- créer ou faire tourner des comptes pour échapper à la modération, aux bannissements, aux limites d’éditeur ou à la
  revue de la marketplace
- tromper les utilisateurs sur la propriété, la source, les capacités, la posture de sécurité,
  les exigences d’installation ou l’affiliation avec un autre projet ou éditeur
- téléverser à plusieurs reprises du contenu qui a déjà été masqué, supprimé ou bloqué
  sans corriger le problème sous-jacent

La publication à grand volume n’est pas automatiquement un abus. Les grands catalogues sont acceptables
lorsque les annonces sont significativement différentes, décrites avec précision, maintenues
et utilisées par de vrais utilisateurs. Les grands catalogues deviennent un problème de confiance et de sécurité lorsque
le volume s’accompagne d’annonces pauvres, dupliquées, trompeuses, non maintenues ou
promues artificiellement.

## Droits sur le contenu

Si vous pensez qu’un contenu sur ClawHub porte atteinte à votre droit d’auteur ou à d’autres droits, utilisez
[Demandes relatives aux droits sur le contenu](/fr/clawhub/content-rights). N’utilisez pas les signalements normaux de la marketplace
pour les réclamations relatives au droit d’auteur ou aux droits, sauf si l’annonce est également dangereuse,
malveillante ou trompeuse.

## Revue et application

ClawHub peut utiliser des contrôles automatisés, des signaux statistiques d’abus, des signalements d’utilisateurs et une
revue par le personnel pour identifier les contenus dangereux ou les comportements de publication abusifs. Un signal
ne prouve pas un abus à lui seul ; il aide ClawHub à décider ce qui nécessite une revue.

Nous pouvons :

- masquer, retenir, supprimer, supprimer de façon réversible ou, lorsque le type de ressource le permet,
  supprimer définitivement les annonces en infraction
- bloquer les téléchargements ou les installations pour les versions dangereuses
- révoquer les jetons d’API
- supprimer de façon réversible le contenu associé
- restreindre l’accès à la publication
- bannir les récidivistes ou les auteurs d’infractions graves

Nous ne garantissons pas une application avec avertissement préalable en cas d’abus évident. Consultez
[Modération et sécurité des comptes](/clawhub/moderation) pour les signalements, les suspensions de modération,
les annonces masquées, les bannissements et le statut des comptes.
