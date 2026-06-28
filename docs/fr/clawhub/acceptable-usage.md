---
read_when:
    - Examen des téléversements pour détecter des abus ou des violations de politique
    - Rédaction de documentation de modération ou de guides opérationnels pour les relecteurs
    - Décider si une skill doit être masquée ou si un utilisateur doit être banni
sidebarTitle: Acceptable Usage
summary: 'Politique de la place de marché : ce que ClawHub autorise et ce qu’il n’hébergera pas.'
title: Utilisation acceptable
x-i18n:
    generated_at: "2026-06-28T20:41:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Utilisation acceptable

ClawHub héberge des Skills, des Plugins, des paquets et des métadonnées de place de marché pour OpenClaw.
Utilisez cette page pour déterminer si un contenu ou un comportement de publication a sa place sur
ClawHub.

Ces règles s’appliquent à ce que fait une fiche, à ce qu’elle demande aux utilisateurs d’exécuter, à la manière dont elle
se présente et à la façon dont les éditeurs utilisent les surfaces de découverte, d’installation et de
confiance de ClawHub. Pour les états de modération et la réputation des comptes, consultez
[Modération et sécurité des comptes](/fr/clawhub/moderation). Pour les réclamations relatives au droit d’auteur ou à d’autres droits,
consultez [Demandes relatives aux droits de contenu](/fr/clawhub/content-rights).

## Contenu autorisé

ClawHub accueille les contenus utiles, compréhensibles et publiés de bonne
foi.

| Catégorie                                         | Autorisé lorsque                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productivité des développeurs                           | La fiche aide les utilisateurs à créer, tester, migrer, déboguer, documenter ou exploiter des logiciels.                                               |
| Interfaces utilisateur, données et workflows d’automatisation               | Le périmètre est clair, les identifiants requis sont explicites, et les actions risquées incluent des parcours de revue, d’essai à blanc, d’aperçu ou de confirmation. |
| Sécurité défensive, modération et revue des abus | L’outil est présenté pour une revue autorisée, préserve les preuves et garde clairement définies les limites d’approbation humaine.                          |
| Workflows personnels ou d’équipe                       | Le workflow utilise des comptes fondés sur le consentement, une configuration transparente et des autorisations explicites.                                            |
| Catalogues maintenus                              | Chaque fiche est distincte, utile, décrite avec précision et raisonnablement maintenue.                                                |

Le contexte compte. Un même sujet peut être acceptable dans un cadre défensif étroit ou
fondé sur le consentement, et inacceptable lorsqu’il est présenté comme un workflow d’abus.

## Contenu interdit

ClawHub n’héberge pas de contenus dont l’objectif principal est l’abus, la tromperie, l’exécution
dangereuse ou l’atteinte aux droits.

| Catégorie                                                    | Non autorisé                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accès non autorisé ou contournement de sécurité                      | Contournement d’authentification, prise de contrôle de compte, abus des limites de débit, prise de contrôle d’appel en direct ou d’agent, vol de session réutilisable, ou approbation automatique de flux d’appairage pour des utilisateurs non approuvés.                                                                                                                                                   |
| Abus de plateforme et contournement de bannissement                              | Comptes furtifs après bannissement, préchauffage ou élevage de comptes, faux engagement, automatisation multi-comptes, publication massive, bots de spam, ou automatisation conçue pour éviter la détection.                                                                                                                                          |
| Fraude, escroqueries et workflows financiers trompeurs             | Faux certificats ou factures, flux de paiement trompeurs, prospection frauduleuse, fausse preuve sociale, workflows d’identité synthétique à des fins de fraude, ou outils de dépense/facturation sans approbation humaine claire.                                                                                                                    |
| Enrichissement intrusif ou surveillance                 | Extraction de contacts pour spam, doxxing, harcèlement, extraction de prospects associée à une prospection non sollicitée, surveillance clandestine, correspondance biométrique non consensuelle, ou utilisation de données divulguées ou de dumps issus de violations de données.                                                                                                                  |
| Usurpation non consensuelle ou manipulation d’identité       | Échange de visage, jumeaux numériques, influenceurs clonés, faux personnages ou autres outils utilisés pour usurper une identité ou induire en erreur.                                                                                                                                                                                                 |
| Contenu sexuel explicite ou génération adulte sans garde-fous | Génération d’images, de vidéos ou de contenus NSFW ; wrappers de contenu adulte autour d’API tierces ; ou fiches dont l’objectif principal est le contenu sexuel explicite.                                                                                                                                                       |
| Exigences d’exécution cachées, dangereuses ou trompeuses        | Commandes d’installation obscurcies, programmes d’installation de type pipe-vers-shell tels que du contenu téléchargé exécuté avec `sh` ou `bash` sans possibilité claire de revue, exigences non déclarées en matière de secrets ou de clés privées, exécution distante de `npx @latest` sans possibilité claire de revue, ou métadonnées qui masquent ce dont la fiche a réellement besoin pour s’exécuter. |
| Matériel portant atteinte au droit d’auteur ou violant des droits           | Republication du skill, du Plugin, de la documentation, des ressources de marque ou du code propriétaire de quelqu’un d’autre sans autorisation ; violation des conditions de licence ; ou usurpation de l’auteur ou de l’éditeur d’origine.                                                                                                                            |

## Comportement interdit sur la place de marché

ClawHub examine également la manière dont les éditeurs utilisent la place de marché. N’utilisez pas ClawHub pour
manipuler la découverte, les métriques, les signaux de confiance, les systèmes de modération ou l’attention
des utilisateurs.

Les comportements interdits sur la place de marché incluent :

- la publication en masse d’un grand nombre de fiches à faible effort, dupliquées, de remplacement ou
  générées par machine, qui ne semblent pas apporter de valeur réelle aux utilisateurs
- l’inondation des surfaces de recherche ou de catégorie avec des Skills ou des Plugins presque identiques
- la publication de centaines de fiches avec peu ou pas d’utilisation, de maintenance, de clarté de source
  ou de différenciation significative
- le gonflement artificiel des installations, téléchargements, étoiles ou autres métriques d’engagement
  par automatisation, boucles d’auto-installation, faux comptes, activité coordonnée,
  engagement rémunéré ou autre comportement non organique
- la création ou la rotation de comptes pour contourner la modération, les bannissements, les limites d’éditeur ou
  la revue de la place de marché
- la tromperie des utilisateurs concernant la propriété, la source, les capacités, la posture de sécurité,
  les exigences d’installation ou l’affiliation avec un autre projet ou éditeur
- le téléversement répété de contenu déjà masqué, supprimé ou bloqué
  sans corriger le problème sous-jacent

La publication à grand volume n’est pas automatiquement abusive. Les grands catalogues sont acceptables
lorsque les fiches sont réellement différentes, décrites avec précision, maintenues
et utilisées par de vrais utilisateurs. Les grands catalogues deviennent un problème de confiance et de sécurité lorsque
le volume s’accompagne de fiches superficielles, dupliquées, trompeuses, non maintenues ou
promues artificiellement.

## Droits de contenu

Si vous pensez qu’un contenu sur ClawHub enfreint votre droit d’auteur ou d’autres droits, utilisez
[Demandes relatives aux droits de contenu](/fr/clawhub/content-rights). N’utilisez pas les signalements ordinaires de la place de marché
pour les réclamations de droit d’auteur ou de droits, sauf si la fiche est aussi dangereuse,
malveillante ou trompeuse.

## Revue et application

ClawHub peut utiliser des contrôles automatisés, des signaux statistiques d’abus, des signalements d’utilisateurs et
une revue par le personnel pour identifier les contenus dangereux ou les comportements de publication abusifs. Un signal
ne prouve pas un abus à lui seul ; il aide ClawHub à déterminer ce qui nécessite une revue.

Nous pouvons :

- masquer, retenir, retirer, supprimer de manière réversible ou, lorsque le type de ressource le permet,
  supprimer définitivement les fiches en infraction
- bloquer les téléchargements ou les installations des versions dangereuses
- révoquer des jetons API
- supprimer de manière réversible le contenu associé
- restreindre l’accès à la publication
- bannir les récidivistes ou les auteurs d’infractions graves

Nous ne garantissons pas une application précédée d’un avertissement en cas d’abus manifeste. Consultez
[Modération et sécurité des comptes](/fr/clawhub/moderation) pour les signalements, les retenues de modération,
les fiches masquées, les bannissements et la réputation des comptes.
