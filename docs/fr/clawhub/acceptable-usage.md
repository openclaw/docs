---
read_when:
    - Examen des téléversements pour détecter les abus ou les violations des politiques
    - Rédaction de documentation sur la modération ou de guides opérationnels pour les réviseurs
    - Décider si une skill doit être masquée ou si un utilisateur doit être banni
sidebarTitle: Acceptable Usage
summary: 'Politique de la place de marché : ce que ClawHub autorise et ce qu’il n’hébergera pas.'
title: Utilisation acceptable
x-i18n:
    generated_at: "2026-07-12T21:39:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Utilisation acceptable

ClawHub héberge des Skills, des plugins, des paquets et des métadonnées de place de marché pour OpenClaw.
Utilisez cette page pour déterminer si un contenu ou un comportement de publication a sa place sur
ClawHub.

Ces règles s’appliquent aux fonctions d’une fiche, à ce qu’elle demande aux utilisateurs d’exécuter, à la manière dont elle
se présente et à la façon dont les éditeurs utilisent les mécanismes de découverte, d’installation et
de confiance de ClawHub. Pour les statuts de modération et l’état des comptes, consultez
[Modération et sécurité des comptes](/clawhub/moderation). Pour les réclamations relatives au droit d’auteur ou à d’autres droits,
consultez [Demandes relatives aux droits sur les contenus](/clawhub/content-rights).

## Contenu autorisé

ClawHub accueille les contenus utiles, compréhensibles et publiés de
bonne foi.

| Catégorie                                         | Autorisé lorsque                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productivité des développeurs                           | La fiche aide les utilisateurs à créer, tester, migrer, déboguer, documenter ou exploiter des logiciels.                                               |
| Interfaces utilisateur, données et workflows d’automatisation               | Le périmètre est clair, les identifiants requis sont explicitement indiqués et les actions risquées prévoient des étapes de vérification, d’exécution à blanc, d’aperçu ou de confirmation. |
| Sécurité défensive, modération et examen des abus | L’outil est présenté comme destiné à un examen autorisé, préserve les preuves et maintient des limites claires en matière d’approbation humaine.                          |
| Workflows personnels ou d’équipe                       | Le workflow utilise des comptes fondés sur le consentement, une configuration transparente et des autorisations explicites.                                            |
| Catalogues maintenus                              | Chaque fiche est distincte, utile, décrite avec exactitude et raisonnablement maintenue.                                                |

Le contexte est important. Un même sujet peut être acceptable dans un cadre défensif restreint ou
fondé sur le consentement, et inacceptable lorsqu’il est présenté comme un workflow d’abus.

## Contenu interdit

ClawHub n’héberge pas de contenu dont l’objectif principal est l’abus, la tromperie, une exécution
dangereuse ou la violation de droits.

| Catégorie                                                    | Interdit                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accès non autorisé ou contournement de la sécurité                      | Contournement de l’authentification, prise de contrôle de comptes, abus des limites de débit, prise de contrôle d’appels en direct ou d’agents, vol de sessions réutilisables ou approbation automatique de processus d’appairage pour des utilisateurs non approuvés.                                                                                                                                                   |
| Abus de plateforme et contournement des interdictions                              | Comptes furtifs après une interdiction, préparation ou exploitation massive de comptes, faux engagement, automatisation multicomptes, publications de masse, robots de spam ou automatisation conçue pour éviter la détection.                                                                                                                                          |
| Fraude, escroqueries et workflows financiers trompeurs             | Faux certificats ou factures, processus de paiement trompeurs, prospection frauduleuse, fausses preuves sociales, workflows d’identités synthétiques à des fins de fraude ou outils de dépense ou de facturation sans approbation humaine claire.                                                                                                                    |
| Enrichissement portant atteinte à la vie privée ou surveillance                 | Extraction de contacts à des fins de spam, divulgation de données personnelles, harcèlement, extraction de prospects associée à une prospection non sollicitée, surveillance clandestine, correspondance biométrique sans consentement ou utilisation de données divulguées ou issues de fuites de sécurité.                                                                                                                  |
| Usurpation d’identité ou manipulation identitaire sans consentement       | Échange de visages, jumeaux numériques, influenceurs clonés, faux personnages ou autres outils utilisés pour usurper une identité ou induire en erreur.                                                                                                                                                                                                 |
| Contenu sexuel explicite ou génération de contenu pour adultes sans mesures de sécurité | Génération d’images, de vidéos ou de contenus NSFW ; interfaces de génération de contenu pour adultes reposant sur des API tierces ; ou fiches dont l’objectif principal est le contenu sexuel explicite.                                                                                                                                                       |
| Exigences d’exécution dissimulées, dangereuses ou trompeuses        | Commandes d’installation obscurcies, programmes d’installation de type pipe-to-shell, par exemple du contenu téléchargé exécuté avec `sh` ou `bash` sans possibilité claire de l’examiner, exigences non déclarées en matière de secrets ou de clés privées, exécution distante de `npx @latest` sans possibilité claire de l’examiner ou métadonnées masquant les véritables exigences d’exécution de la fiche. |
| Contenu portant atteinte au droit d’auteur ou à d’autres droits           | Republication du Skill, du plugin, de la documentation, des ressources de marque ou du code propriétaire d’un tiers sans autorisation ; violation des conditions de licence ; ou usurpation de l’identité de l’auteur ou de l’éditeur d’origine.                                                                                                                            |

## Comportements interdits sur la place de marché

ClawHub examine également la manière dont les éditeurs utilisent la place de marché. N’utilisez pas ClawHub pour
manipuler la découverte, les indicateurs, les signaux de confiance, les systèmes de modération ou
l’attention des utilisateurs.

Les comportements interdits sur la place de marché comprennent :

- la publication en masse d’un grand nombre de fiches nécessitant peu d’efforts, redondantes, servant de modèles temporaires ou
  générées automatiquement, qui ne semblent pas apporter de valeur réelle aux utilisateurs
- la saturation des résultats de recherche ou des catégories avec des Skills ou des plugins presque identiques
- la publication de centaines de fiches avec peu ou pas d’utilisation, de maintenance, de clarté quant à la source
  ou de différenciation significative
- l’augmentation artificielle du nombre d’installations, de téléchargements, d’étoiles ou d’autres indicateurs
  d’engagement au moyen de l’automatisation, de boucles d’auto-installation, de faux comptes, d’activités
  coordonnées, d’engagement rémunéré ou de tout autre comportement non organique
- la création ou la rotation de comptes pour contourner la modération, les interdictions, les limites imposées aux éditeurs ou
  l’examen de la place de marché
- la tromperie des utilisateurs concernant la propriété, la source, les capacités, le niveau de sécurité,
  les exigences d’installation ou l’affiliation avec un autre projet ou éditeur
- le téléversement répété de contenus déjà masqués, supprimés ou bloqués
  sans corriger le problème sous-jacent

La publication à grande échelle ne constitue pas automatiquement un abus. Les grands catalogues sont acceptables
lorsque les fiches sont sensiblement différentes, décrites avec exactitude, maintenues
et utilisées par de véritables utilisateurs. Les grands catalogues deviennent un problème de confiance et de sécurité lorsque
le volume est associé à des fiches sommaires, redondantes, trompeuses, non maintenues ou
promues artificiellement.

## Droits sur les contenus

Si vous estimez qu’un contenu publié sur ClawHub porte atteinte à votre droit d’auteur ou à d’autres droits, utilisez
[Demandes relatives aux droits sur les contenus](/clawhub/content-rights). N’utilisez pas les signalements ordinaires de la place de marché
pour les réclamations relatives au droit d’auteur ou à d’autres droits, sauf si la fiche est également dangereuse,
malveillante ou trompeuse.

## Examen et application des règles

ClawHub peut utiliser des contrôles automatisés, des signaux statistiques d’abus, des signalements d’utilisateurs et
un examen par son personnel pour détecter les contenus dangereux ou les comportements de publication abusifs. Un signal
ne prouve pas à lui seul l’existence d’un abus ; il aide ClawHub à déterminer ce qui doit être examiné.

Nous pouvons :

- masquer, suspendre, retirer, supprimer de manière réversible ou, lorsque le type de ressource le permet,
  supprimer définitivement les fiches en infraction
- bloquer les téléchargements ou les installations des versions dangereuses
- révoquer les jetons d’API
- supprimer de manière réversible les contenus associés
- restreindre l’accès à la publication
- bannir les auteurs d’infractions répétées ou graves

Nous ne garantissons pas l’émission d’un avertissement préalable en cas d’abus manifeste. Consultez
[Modération et sécurité des comptes](/clawhub/moderation) pour en savoir plus sur les signalements, les suspensions de modération,
les fiches masquées, les interdictions et l’état des comptes.
