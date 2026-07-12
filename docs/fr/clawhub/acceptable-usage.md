---
read_when:
    - Examen des téléversements à la recherche d’abus ou de violations des politiques
    - Rédaction de documentation de modération ou de guides opérationnels pour les relecteurs
    - Décider si une compétence doit être masquée ou si un utilisateur doit être banni
sidebarTitle: Acceptable Usage
summary: 'Politique de la place de marché : ce que ClawHub autorise et ce qu’il n’hébergera pas.'
title: Utilisation acceptable
x-i18n:
    generated_at: "2026-07-12T02:23:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Utilisation acceptable

ClawHub héberge des Skills, des plugins, des paquets et des métadonnées de place de marché pour OpenClaw.
Utilisez cette page pour déterminer si un contenu ou un comportement de publication a sa place sur
ClawHub.

Ces règles s’appliquent aux actions d’une fiche, à ce qu’elle demande aux utilisateurs d’exécuter, à la manière dont elle
se présente et à la façon dont les éditeurs utilisent les fonctionnalités de découverte, d’installation et
de confiance de ClawHub. Pour les statuts de modération et la situation des comptes, consultez
[Modération et sécurité des comptes](/clawhub/moderation). Pour les réclamations relatives au droit d’auteur ou à d’autres droits,
consultez [Demandes relatives aux droits sur les contenus](/clawhub/content-rights).

## Contenu autorisé

ClawHub accueille les contenus utiles, compréhensibles et publiés de
bonne foi.

| Catégorie                                         | Autorisé lorsque                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productivité des développeurs                           | La fiche aide les utilisateurs à créer, tester, migrer, déboguer, documenter ou exploiter des logiciels.                                               |
| Interfaces utilisateur, données et processus d’automatisation               | Le périmètre est clair, les identifiants requis sont explicitement indiqués et les actions risquées prévoient des procédures de vérification, de simulation, d’aperçu ou de confirmation. |
| Sécurité défensive, modération et examen des abus | L’outil est présenté comme destiné à un examen autorisé, préserve les preuves et maintient clairement les limites nécessitant une approbation humaine.                          |
| Processus personnels ou d’équipe                       | Le processus utilise des comptes fondés sur le consentement, une configuration transparente et des autorisations explicites.                                            |
| Catalogues maintenus                              | Chaque fiche est distincte, utile, décrite avec exactitude et raisonnablement bien maintenue.                                                |

Le contexte est important. Un même sujet peut être acceptable dans un cadre défensif restreint ou
fondé sur le consentement, et inacceptable lorsqu’il est présenté comme un processus facilitant les abus.

## Contenu interdit

ClawHub n’héberge pas de contenu dont l’objectif principal est l’abus, la tromperie, une
exécution dangereuse ou la violation de droits.

| Catégorie                                                    | Interdit                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accès non autorisé ou contournement des mesures de sécurité                      | Contournement de l’authentification, prise de contrôle de comptes, abus des limites de débit, prise de contrôle d’appels en direct ou d’agents, vol de sessions réutilisables ou approbation automatique des processus d’appairage pour des utilisateurs non autorisés.                                                                                                                                                   |
| Abus de plateforme et contournement des interdictions                              | Comptes furtifs après une interdiction, préparation ou élevage de comptes, faux engagement, automatisation de plusieurs comptes, publication de masse, robots de spam ou automatisation conçue pour éviter la détection.                                                                                                                                          |
| Fraude, escroqueries et processus financiers trompeurs             | Faux certificats ou factures, processus de paiement trompeurs, démarchage frauduleux, fausses preuves sociales, processus d’identités synthétiques à des fins de fraude ou outils de dépense ou de facturation sans approbation humaine explicite.                                                                                                                    |
| Enrichissement de données portant atteinte à la vie privée ou surveillance                 | Extraction de coordonnées à des fins de spam, divulgation de données personnelles, harcèlement, extraction de prospects associée à un démarchage non sollicité, surveillance clandestine, correspondance biométrique sans consentement ou utilisation de données divulguées ou issues de fuites de sécurité.                                                                                                                  |
| Usurpation d’identité ou manipulation d’identité sans consentement       | Échange de visages, doubles numériques, influenceurs clonés, faux personnages ou autres outils utilisés pour usurper une identité ou induire en erreur.                                                                                                                                                                                                 |
| Contenu sexuel explicite ou génération de contenu pour adultes sans mesures de sécurité | Génération d’images, de vidéos ou de contenus NSFW ; interfaces de contenu pour adultes reposant sur des API tierces ; ou fiches dont l’objectif principal est la diffusion de contenu sexuel explicite.                                                                                                                                                       |
| Exigences d’exécution cachées, dangereuses ou trompeuses        | Commandes d’installation obscurcies, programmes d’installation transmis directement à un interpréteur de commandes, par exemple du contenu téléchargé exécuté avec `sh` ou `bash` sans possibilité claire de vérification, exigences non déclarées concernant des secrets ou des clés privées, exécution distante de `npx @latest` sans possibilité claire de vérification, ou métadonnées dissimulant les véritables prérequis d’exécution de la fiche. |
| Contenu enfreignant le droit d’auteur ou d’autres droits           | Republication sans autorisation du Skill, du plugin, de la documentation, des ressources de marque ou du code propriétaire d’un tiers ; violation des conditions de licence ; ou usurpation de l’identité de l’auteur ou de l’éditeur d’origine.                                                                                                                            |

## Comportements interdits sur la place de marché

ClawHub examine également la manière dont les éditeurs utilisent la place de marché. N’utilisez pas ClawHub pour
manipuler la découverte, les indicateurs, les signaux de confiance, les systèmes de modération ou
l’attention des utilisateurs.

Les comportements interdits sur la place de marché comprennent notamment :

- la publication en masse d’un grand nombre de fiches peu travaillées, redondantes, provisoires ou
  générées automatiquement qui ne semblent pas apporter de valeur réelle aux utilisateurs
- la saturation des résultats de recherche ou des catégories avec des Skills ou des plugins presque identiques
- la publication de centaines de fiches avec peu ou pas d’utilisation, de maintenance, de clarté sur les sources
  ou de différenciation significative
- l’augmentation artificielle du nombre d’installations, de téléchargements, d’étoiles ou d’autres indicateurs
  d’engagement au moyen d’automatisation, de boucles d’auto-installation, de faux comptes, d’activités coordonnées,
  d’engagement rémunéré ou de tout autre comportement non organique
- la création ou la rotation de comptes afin de contourner la modération, les interdictions, les limites imposées aux éditeurs ou
  l’examen par la place de marché
- la tromperie des utilisateurs concernant la propriété, la source, les capacités, le niveau de sécurité,
  les exigences d’installation ou l’affiliation à un autre projet ou éditeur
- le téléversement répété de contenus déjà masqués, supprimés ou bloqués
  sans résoudre le problème sous-jacent

La publication à grande échelle ne constitue pas automatiquement un abus. Les grands catalogues sont acceptables
lorsque les fiches présentent des différences significatives, sont décrites avec exactitude, sont maintenues
et sont utilisées par de véritables utilisateurs. Les grands catalogues deviennent un problème de confiance et de sécurité lorsque
le volume s’accompagne de fiches superficielles, redondantes, trompeuses, non maintenues ou
promues artificiellement.

## Droits sur les contenus

Si vous estimez qu’un contenu présent sur ClawHub porte atteinte à votre droit d’auteur ou à d’autres droits, utilisez
[Demandes relatives aux droits sur les contenus](/clawhub/content-rights). N’utilisez pas les signalements ordinaires de la place de marché
pour les réclamations relatives au droit d’auteur ou à d’autres droits, sauf si la fiche est également dangereuse,
malveillante ou trompeuse.

## Examen et application des règles

ClawHub peut utiliser des contrôles automatisés, des signaux statistiques d’abus, des signalements d’utilisateurs et
des examens effectués par son personnel pour identifier les contenus dangereux ou les comportements de publication abusifs. Un signal
ne prouve pas à lui seul l’existence d’un abus ; il aide ClawHub à déterminer les éléments nécessitant un examen.

Nous pouvons :

- masquer, mettre en attente, retirer, supprimer de façon réversible ou, lorsque le type de ressource le permet,
  supprimer définitivement les fiches en infraction
- bloquer les téléchargements ou les installations des versions dangereuses
- révoquer les jetons d’API
- supprimer de façon réversible les contenus associés
- restreindre l’accès à la publication
- bannir les récidivistes ou les auteurs d’infractions graves

Nous ne garantissons pas qu’un avertissement précédera l’application des règles en cas d’abus manifeste. Consultez
[Modération et sécurité des comptes](/clawhub/moderation) pour en savoir plus sur les signalements, les mises en attente pour modération,
les fiches masquées, les interdictions et la situation des comptes.
