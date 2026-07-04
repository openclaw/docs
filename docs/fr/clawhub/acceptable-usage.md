---
read_when:
    - Examen des téléversements pour détecter les abus ou les violations de politique
    - Rédaction de documentation de modération ou de guides d’exécution pour les réviseurs
    - Décider si un skill doit être masqué ou si un utilisateur doit être banni
sidebarTitle: Acceptable Usage
summary: 'Politique de la marketplace : ce que ClawHub autorise et ce qu’il n’hébergera pas.'
title: Utilisation acceptable
x-i18n:
    generated_at: "2026-07-04T20:28:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Utilisation acceptable

ClawHub héberge les Skills, Plugins, paquets et métadonnées de marketplace pour OpenClaw.
Utilisez cette page pour déterminer si un contenu ou un comportement de publication a sa place sur
ClawHub.

Ces règles s’appliquent à ce qu’une fiche fait, à ce qu’elle demande aux utilisateurs d’exécuter, à la manière dont elle
se présente, et à la manière dont les éditeurs utilisent les surfaces de découverte, d’installation et de
confiance de ClawHub. Pour les états de modération et le statut des comptes, consultez
[Modération et sécurité des comptes](/clawhub/moderation). Pour les réclamations liées au droit d’auteur ou à d’autres droits,
consultez [Demandes relatives aux droits de contenu](/fr/clawhub/content-rights).

## Contenu autorisé

ClawHub accueille les contenus utiles, compréhensibles et publiés de bonne
foi.

| Catégorie                                         | Autorisé lorsque                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productivité des développeurs                           | La fiche aide les utilisateurs à créer, tester, migrer, déboguer, documenter ou exploiter des logiciels.                                               |
| Flux de travail d’interface utilisateur, de données et d’automatisation               | Le périmètre est clair, les identifiants requis sont explicites, et les actions risquées incluent des parcours de revue, d’exécution à blanc, d’aperçu ou de confirmation. |
| Sécurité défensive, modération et revue des abus | L’outil est présenté pour une revue autorisée, préserve les preuves et maintient des limites claires d’approbation humaine.                          |
| Flux de travail personnels ou d’équipe                       | Le flux de travail utilise des comptes fondés sur le consentement, une configuration transparente et des permissions explicites.                                            |
| Catalogues maintenus                              | Chaque fiche est distincte, utile, décrite avec exactitude et raisonnablement maintenue.                                                |

Le contexte compte. Un même sujet peut être acceptable dans un cadre défensif étroit ou
fondé sur le consentement, et inacceptable lorsqu’il est empaqueté comme un flux de travail d’abus.

## Contenu interdit

ClawHub n’héberge pas de contenu dont l’objectif principal est l’abus, la tromperie, l’exécution
non sécurisée ou la violation de droits.

| Catégorie                                                    | Interdit                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accès non autorisé ou contournement de sécurité                      | Contournement d’authentification, prise de contrôle de compte, abus de limitation de débit, prise de contrôle d’appel en direct ou d’agent, vol de session réutilisable, ou approbation automatique de flux d’appairage pour des utilisateurs non approuvés.                                                                                                                                                   |
| Abus de plateforme et contournement de bannissement                              | Comptes furtifs après bannissement, préparation ou élevage de comptes, faux engagement, automatisation multi-comptes, publication massive, bots de spam, ou automatisation conçue pour éviter la détection.                                                                                                                                          |
| Fraude, escroqueries et flux de travail financiers trompeurs             | Faux certificats ou factures, flux de paiement trompeurs, prospection frauduleuse, fausse preuve sociale, flux de travail d’identité synthétique pour fraude, ou outils de dépense/facturation sans approbation humaine claire.                                                                                                                    |
| Enrichissement ou surveillance portant atteinte à la vie privée                 | Collecte de contacts pour spam, doxxing, harcèlement, extraction de prospects associée à une prospection non sollicitée, surveillance secrète, correspondance biométrique non consensuelle, ou utilisation de données divulguées ou de dumps issus de violations.                                                                                                                  |
| Usurpation d’identité ou manipulation d’identité non consensuelle       | Échange de visage, jumeaux numériques, influenceurs clonés, faux personnages, ou autres outils utilisés pour usurper une identité ou induire en erreur.                                                                                                                                                                                                 |
| Contenu sexuel explicite ou génération adulte avec sécurité désactivée | Génération d’images, de vidéos ou de contenu NSFW ; wrappers de contenu adulte autour d’API tierces ; ou fiches dont l’objectif principal est le contenu sexuel explicite.                                                                                                                                                       |
| Exigences d’exécution cachées, non sécurisées ou trompeuses        | Commandes d’installation obfusquées, installateurs pipe-to-shell tels que du contenu téléchargé exécuté avec `sh` ou `bash` sans possibilité de revue claire, exigences non déclarées en matière de secrets ou de clés privées, exécution distante de `npx @latest` sans possibilité de revue claire, ou métadonnées qui masquent ce dont la fiche a réellement besoin pour s’exécuter. |
| Matériel enfreignant le droit d’auteur ou violant des droits           | Republier le Skill, Plugin, la documentation, les ressources de marque ou le code propriétaire de quelqu’un d’autre sans permission ; violer des conditions de licence ; ou usurper l’identité de l’auteur ou de l’éditeur d’origine.                                                                                                                            |

## Comportement interdit sur la marketplace

ClawHub examine également la manière dont les éditeurs utilisent la marketplace. N’utilisez pas ClawHub pour
manipuler la découverte, les métriques, les signaux de confiance, les systèmes de modération ou
l’attention des utilisateurs.

Les comportements interdits sur la marketplace incluent :

- publier en masse de grands nombres de fiches à faible effort, redondantes, factices ou
  générées par machine qui ne semblent pas apporter de valeur réelle aux utilisateurs
- inonder les surfaces de recherche ou de catégorie avec des Skills ou Plugins quasi identiques
- publier des centaines de fiches avec peu ou pas d’utilisation, de maintenance, de clarté de
  source ou de différenciation significative
- gonfler artificiellement les installations, téléchargements, étoiles ou autres métriques
  d’engagement par automatisation, boucles d’auto-installation, faux comptes, activité
  coordonnée, engagement rémunéré ou autre comportement non organique
- créer ou faire tourner des comptes pour contourner la modération, les bannissements, les limites d’éditeur ou
  la revue de la marketplace
- induire les utilisateurs en erreur sur la propriété, la source, les capacités, la posture de sécurité,
  les exigences d’installation ou l’affiliation avec un autre projet ou éditeur
- téléverser de manière répétée du contenu qui a déjà été masqué, supprimé ou bloqué
  sans corriger le problème sous-jacent

La publication à grand volume n’est pas automatiquement un abus. Les grands catalogues sont acceptables
lorsque les fiches sont réellement différentes, décrites avec exactitude, maintenues
et utilisées par de vrais utilisateurs. Les grands catalogues deviennent un problème de confiance et de sécurité lorsque
le volume est associé à des fiches superficielles, redondantes, trompeuses, non maintenues ou
promues artificiellement.

## Droits de contenu

Si vous pensez qu’un contenu sur ClawHub enfreint votre droit d’auteur ou d’autres droits, utilisez
[Demandes relatives aux droits de contenu](/fr/clawhub/content-rights). N’utilisez pas les signalements normaux de la marketplace
pour les réclamations liées au droit d’auteur ou aux droits, sauf si la fiche est également non sécurisée,
malveillante ou trompeuse.

## Revue et application

ClawHub peut utiliser des contrôles automatisés, des signaux statistiques d’abus, des signalements d’utilisateurs et
une revue par le personnel pour identifier les contenus non sécurisés ou les comportements de publication abusifs. Un signal
ne prouve pas un abus à lui seul ; il aide ClawHub à déterminer ce qui nécessite une revue.

Nous pouvons :

- masquer, retenir, retirer, supprimer de manière réversible ou, lorsque le type de ressource le prend en charge,
  supprimer définitivement les fiches en infraction
- bloquer les téléchargements ou installations de versions non sécurisées
- révoquer des jetons d’API
- supprimer de manière réversible le contenu associé
- restreindre l’accès à la publication
- bannir les récidivistes ou les auteurs d’infractions graves

Nous ne garantissons pas une application précédée d’un avertissement pour les abus évidents. Consultez
[Modération et sécurité des comptes](/clawhub/moderation) pour les signalements, les retenues de modération,
les fiches masquées, les bannissements et le statut des comptes.
