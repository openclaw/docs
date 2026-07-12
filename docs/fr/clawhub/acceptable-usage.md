---
read_when:
    - Examen des téléversements afin de détecter les abus ou les violations des politiques
    - Rédaction de documentation de modération ou de guides opérationnels pour les réviseurs
    - Décider si une compétence doit être masquée ou si un utilisateur doit être banni
sidebarTitle: Acceptable Usage
summary: 'Politique de la place de marché : ce que ClawHub autorise et ce qu’il n’hébergera pas.'
title: Utilisation acceptable
x-i18n:
    generated_at: "2026-07-12T15:05:36Z"
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

Ces règles s’appliquent aux actions d’une fiche, aux commandes qu’elle demande aux utilisateurs d’exécuter, à la manière dont elle
se présente et à l’utilisation par les éditeurs des fonctionnalités de découverte, d’installation et de
confiance de ClawHub. Pour les états de modération et le statut des comptes, consultez
[Modération et sécurité des comptes](/clawhub/moderation). Pour les réclamations relatives aux droits d’auteur ou à d’autres droits,
consultez [Demandes relatives aux droits sur le contenu](/clawhub/content-rights).

## Contenu autorisé

ClawHub accueille les contenus utiles, compréhensibles et publiés de bonne
foi.

| Catégorie                                         | Autorisé lorsque                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productivité des développeurs                           | La fiche aide les utilisateurs à créer, tester, migrer, déboguer, documenter ou exploiter des logiciels.                                               |
| Interfaces utilisateur, données et workflows d’automatisation               | Le périmètre est clair, les identifiants requis sont explicités et les actions risquées prévoient des mécanismes de vérification, de simulation, d’aperçu ou de confirmation. |
| Sécurité défensive, modération et examen des abus | L’outil est présenté comme destiné à un examen autorisé, préserve les éléments de preuve et maintient clairement les limites de l’approbation humaine.                          |
| Workflows personnels ou d’équipe                       | Le workflow utilise des comptes fondés sur le consentement, une configuration transparente et des autorisations explicites.                                            |
| Catalogues maintenus                              | Chaque fiche est distincte, utile, décrite avec précision et raisonnablement maintenue.                                                |

Le contexte est important. Un même sujet peut être acceptable dans un cadre défensif restreint ou
fondé sur le consentement, mais inacceptable lorsqu’il est proposé sous la forme d’un workflow d’abus.

## Contenu interdit

ClawHub n’héberge pas de contenu dont l’objectif principal est l’abus, la tromperie, une exécution
dangereuse ou la violation de droits.

| Catégorie                                                    | Interdit                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accès non autorisé ou contournement de la sécurité                      | Contournement de l’authentification, prise de contrôle de compte, contournement des limites de débit, prise de contrôle d’un appel en direct ou d’un agent, vol de sessions réutilisables ou approbation automatique des workflows d’association pour des utilisateurs non approuvés.                                                                                                                                                   |
| Abus de plateforme et contournement des interdictions                              | Comptes dissimulés après une interdiction, préparation ou exploitation massive de comptes, faux engagement, automatisation de plusieurs comptes, publications en masse, robots de spam ou automatisation conçue pour éviter la détection.                                                                                                                                          |
| Fraude, escroqueries et workflows financiers trompeurs             | Faux certificats ou factures, workflows de paiement trompeurs, démarchage frauduleux, fausses preuves sociales, workflows d’identités synthétiques à des fins de fraude ou outils de dépense ou de facturation sans approbation humaine claire.                                                                                                                    |
| Enrichissement portant atteinte à la vie privée ou surveillance                 | Extraction de contacts à des fins de spam, divulgation de données personnelles, harcèlement, extraction de prospects associée à un démarchage non sollicité, surveillance clandestine, rapprochement biométrique sans consentement ou utilisation de données divulguées ou de jeux de données issus de violations.                                                                                                                  |
| Usurpation sans consentement ou manipulation d’identité       | Échange de visages, jumeaux numériques, influenceurs clonés, faux personnages ou autres outils utilisés pour usurper une identité ou induire en erreur.                                                                                                                                                                                                 |
| Contenu sexuel explicite ou génération de contenu pour adultes sans mesures de sécurité | Génération d’images, de vidéos ou de contenus NSFW ; surcouches de contenu pour adultes autour d’API tierces ; ou fiches dont l’objectif principal est le contenu sexuel explicite.                                                                                                                                                       |
| Exigences d’exécution dissimulées, dangereuses ou trompeuses        | Commandes d’installation obscurcies, programmes d’installation par redirection vers un interpréteur de commandes, tels que du contenu téléchargé exécuté avec `sh` ou `bash` sans possibilité claire de vérification, exigences non déclarées concernant des secrets ou des clés privées, exécution distante de `npx @latest` sans possibilité claire de vérification ou métadonnées dissimulant les véritables exigences d’exécution de la fiche. |
| Contenu portant atteinte aux droits d’auteur ou à d’autres droits           | Republication sans autorisation des Skills, plugins, documents, ressources de marque ou code propriétaire d’une autre personne ; violation des conditions de licence ; ou usurpation de l’identité de l’auteur ou de l’éditeur d’origine.                                                                                                                            |

## Comportements interdits sur la place de marché

ClawHub examine également la manière dont les éditeurs utilisent la place de marché. N’utilisez pas ClawHub pour
manipuler la découverte, les métriques, les signaux de confiance, les systèmes de modération ou
l’attention des utilisateurs.

Les comportements interdits sur la place de marché comprennent :

- la publication en masse d’un grand nombre de fiches sommaires, redondantes, factices ou
  générées automatiquement qui ne semblent pas présenter de réelle valeur pour les utilisateurs
- la saturation des résultats de recherche ou des catégories avec des Skills ou plugins presque identiques
- la publication de centaines de fiches présentant peu ou pas d’utilisation, de maintenance, de clarté sur leur source
  ou de différenciation significative
- l’augmentation artificielle du nombre d’installations, de téléchargements, d’étoiles ou d’autres métriques
  d’engagement au moyen de l’automatisation, de boucles d’auto-installation, de faux comptes, d’activités
  coordonnées, d’engagement rémunéré ou de tout autre comportement non organique
- la création ou la rotation de comptes pour contourner la modération, les interdictions, les limites imposées aux éditeurs ou
  l’examen par la place de marché
- la communication trompeuse aux utilisateurs concernant la propriété, la source, les fonctionnalités, le niveau de sécurité,
  les exigences d’installation ou l’affiliation avec un autre projet ou éditeur
- le téléversement répété de contenu déjà masqué, supprimé ou bloqué
  sans corriger le problème sous-jacent

La publication en volume élevé ne constitue pas automatiquement un abus. Les grands catalogues sont acceptables
lorsque les fiches sont sensiblement différentes, décrites avec précision, maintenues
et utilisées par de véritables utilisateurs. Les grands catalogues deviennent un problème de confiance et de sécurité lorsque
le volume s’accompagne de fiches superficielles, redondantes, trompeuses, non maintenues ou
promues artificiellement.

## Droits sur le contenu

Si vous pensez qu’un contenu publié sur ClawHub porte atteinte à vos droits d’auteur ou à d’autres droits, utilisez
[Demandes relatives aux droits sur le contenu](/clawhub/content-rights). N’utilisez pas les signalements habituels de la place de marché
pour les réclamations relatives aux droits d’auteur ou à d’autres droits, sauf si la fiche est également dangereuse,
malveillante ou trompeuse.

## Examen et application des règles

ClawHub peut utiliser des contrôles automatisés, des signaux statistiques d’abus, des signalements d’utilisateurs et
des examens par le personnel pour identifier les contenus dangereux ou les comportements de publication abusifs. Un signal
ne prouve pas à lui seul l’existence d’un abus ; il aide ClawHub à déterminer les éléments qui nécessitent un examen.

Nous pouvons :

- masquer, mettre en attente, retirer, effectuer une suppression réversible ou, lorsque le type de ressource le permet,
  supprimer définitivement les fiches en infraction
- bloquer les téléchargements ou les installations de versions dangereuses
- révoquer des jetons d’API
- effectuer une suppression réversible du contenu associé
- restreindre l’accès à la publication
- interdire les auteurs d’infractions répétées ou graves

Nous ne garantissons pas qu’un avertissement précédera toute mesure d’application en cas d’abus manifeste. Consultez
[Modération et sécurité des comptes](/clawhub/moderation) pour en savoir plus sur les signalements, les mises en attente pour modération,
les fiches masquées, les interdictions et le statut des comptes.
