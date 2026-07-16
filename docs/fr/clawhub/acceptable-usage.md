---
read_when:
    - Examen des téléversements afin de détecter les abus ou les violations des politiques
    - Rédaction de documentation de modération ou de guides opérationnels pour les réviseurs
    - Décider si une compétence doit être masquée ou si un utilisateur doit être banni
sidebarTitle: Acceptable Usage
summary: 'Politique de la place de marché : ce que ClawHub autorise et ce qu’il n’hébergera pas.'
title: Utilisation acceptable
x-i18n:
    generated_at: "2026-07-16T13:01:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Utilisation acceptable

ClawHub héberge des Skills, des plugins, des paquets et des métadonnées de place de marché pour OpenClaw.
Utilisez cette page pour déterminer si un contenu ou un comportement de publication relève de
ClawHub.

Ces règles s’appliquent à ce que fait une fiche, à ce qu’elle demande aux utilisateurs d’exécuter, à la manière dont elle
se présente et à la façon dont les éditeurs utilisent les mécanismes de découverte, d’installation et de
confiance de ClawHub. Pour connaître les états de modération et la situation d’un compte, consultez
[Modération et sécurité des comptes](/clawhub/moderation). Pour les réclamations relatives aux droits d’auteur ou à d’autres droits,
consultez [Demandes relatives aux droits sur le contenu](/clawhub/content-rights).

## Contenu autorisé

ClawHub accueille les contenus utiles, compréhensibles et publiés de bonne
foi.

| Catégorie                                         | Autorisé lorsque                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productivité des développeurs                           | La fiche aide les utilisateurs à créer, tester, migrer, déboguer, documenter ou exploiter des logiciels.                                               |
| Flux de travail d’interface utilisateur, de données et d’automatisation               | Le périmètre est clair, les identifiants requis sont explicitement indiqués et les actions risquées prévoient des mécanismes de vérification, de simulation, d’aperçu ou de confirmation. |
| Sécurité défensive, modération et examen des abus | L’outil est présenté comme destiné à un examen autorisé, préserve les preuves et maintient des limites claires exigeant une approbation humaine.                          |
| Flux de travail personnels ou d’équipe                       | Le flux de travail utilise des comptes fondés sur le consentement, une configuration transparente et des autorisations explicites.                                            |
| Catalogues maintenus                              | Chaque fiche est distincte, utile, décrite avec exactitude et raisonnablement maintenue.                                                |

Le contexte est important. Un même sujet peut être acceptable dans un cadre défensif restreint ou
fondé sur le consentement, mais inacceptable lorsqu’il est proposé sous la forme d’un flux de travail abusif.

## Contenu interdit

ClawHub n’héberge pas de contenu dont l’objectif principal est l’abus, la tromperie, une exécution
dangereuse ou la violation de droits.

| Catégorie                                                    | Non autorisé                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accès non autorisé ou contournement des mesures de sécurité                      | Contournement de l’authentification, prise de contrôle de compte, abus des limites de débit, prise de contrôle d’un appel en direct ou d’un agent, vol de sessions réutilisables ou approbation automatique des flux d’appairage pour des utilisateurs non autorisés.                                                                                                                                                   |
| Abus de plateforme et contournement des bannissements                              | Comptes dissimulés après un bannissement, préparation ou élevage de comptes, faux engagement, automatisation de plusieurs comptes, publication massive, robots de spam ou automatisation conçue pour éviter la détection.                                                                                                                                          |
| Fraude, escroqueries et flux de travail financiers trompeurs             | Faux certificats ou factures, flux de paiement trompeurs, démarchage frauduleux, fausses preuves sociales, flux de travail utilisant des identités synthétiques à des fins de fraude, ou outils de dépense ou de facturation sans approbation humaine claire.                                                                                                                    |
| Enrichissement portant atteinte à la vie privée ou surveillance                 | Collecte de coordonnées à des fins de spam, divulgation de données personnelles, harcèlement, extraction de prospects associée à un démarchage non sollicité, surveillance clandestine, comparaison biométrique sans consentement, ou utilisation de données divulguées ou de fichiers issus de violations de données.                                                                                                                  |
| Usurpation d’identité ou manipulation de l’identité sans consentement       | Échange de visages, doubles numériques, influenceurs clonés, faux personnages ou autres outils utilisés pour usurper une identité ou induire en erreur.                                                                                                                                                                                                 |
| Contenu sexuel explicite ou génération de contenu pour adultes sans mesures de sécurité | Génération d’images, de vidéos ou de contenu NSFW ; interfaces de contenu pour adultes reposant sur des API tierces ; ou fiches dont l’objectif principal est la diffusion de contenu sexuel explicite.                                                                                                                                                       |
| Exigences d’exécution cachées, dangereuses ou trompeuses        | Commandes d’installation obscurcies, programmes d’installation transmis directement à un shell, par exemple du contenu téléchargé exécuté avec `sh` ou `bash` sans possibilité claire de vérification, exigences non déclarées concernant des secrets ou des clés privées, exécution distante de `npx @latest` sans possibilité claire de vérification, ou métadonnées qui dissimulent les véritables exigences d’exécution de la fiche. |
| Contenu portant atteinte aux droits d’auteur ou à d’autres droits           | Republication sans autorisation des Skills, plugins, documents, ressources de marque ou code propriétaire d’une autre personne ; violation des conditions de licence ; ou usurpation de l’identité de l’auteur ou de l’éditeur d’origine.                                                                                                                            |

## Comportements interdits sur la place de marché

ClawHub examine également la manière dont les éditeurs utilisent la place de marché. N’utilisez pas ClawHub pour
manipuler la découverte, les métriques, les signaux de confiance, les systèmes de modération ou
l’attention des utilisateurs.

Les comportements interdits sur la place de marché comprennent notamment :

- la publication en masse d’un grand nombre de fiches nécessitant peu d’efforts, redondantes, provisoires ou
  générées automatiquement et qui ne semblent pas apporter de réelle valeur aux utilisateurs
- la saturation des espaces de recherche ou des catégories avec des Skills ou des plugins presque identiques
- la publication de centaines de fiches dont l’utilisation, la maintenance, la clarté des sources ou
  la différenciation significative sont faibles ou inexistantes
- l’augmentation artificielle des installations, des téléchargements, des étoiles ou d’autres métriques
  d’engagement au moyen de l’automatisation, de boucles d’auto-installation, de faux comptes, d’activités
  coordonnées, d’engagement rémunéré ou de tout autre comportement non organique
- la création ou la rotation de comptes pour contourner la modération, les bannissements, les limites imposées aux éditeurs ou
  l’examen de la place de marché
- le fait d’induire les utilisateurs en erreur concernant la propriété, la source, les capacités, le niveau de sécurité,
  les exigences d’installation ou l’affiliation avec un autre projet ou éditeur
- le téléversement répété de contenu qui a déjà été masqué, supprimé ou bloqué
  sans corriger le problème sous-jacent

La publication en grand volume ne constitue pas automatiquement un abus. Les catalogues volumineux sont acceptables
lorsque les fiches sont sensiblement différentes, décrites avec exactitude, maintenues
et utilisées par de vrais utilisateurs. Les catalogues volumineux deviennent un problème de confiance et de sécurité lorsque
le volume s’accompagne de fiches superficielles, redondantes, trompeuses, non maintenues ou
artificiellement mises en avant.

## Droits sur le contenu

Si vous estimez qu’un contenu présent sur ClawHub porte atteinte à vos droits d’auteur ou à d’autres droits, utilisez
[Demandes relatives aux droits sur le contenu](/clawhub/content-rights). N’utilisez pas les signalements ordinaires de la place de marché
pour les réclamations relatives aux droits d’auteur ou à d’autres droits, sauf si la fiche est également dangereuse,
malveillante ou trompeuse.

## Examen et application des règles

ClawHub peut utiliser des contrôles automatisés, des signaux statistiques d’abus, des signalements d’utilisateurs et
des examens effectués par son personnel afin de détecter les contenus dangereux ou les comportements de publication abusifs. Un signal
ne prouve pas à lui seul l’existence d’un abus ; il aide ClawHub à déterminer ce qui doit être examiné.

Nous pouvons :

- masquer, suspendre, retirer, supprimer de manière réversible ou, lorsque le type de ressource le permet,
  supprimer définitivement les fiches qui enfreignent les règles
- bloquer les téléchargements ou les installations de versions dangereuses
- révoquer les jetons d’API
- supprimer de manière réversible le contenu associé
- restreindre l’accès à la publication
- bannir les contrevenants récidivistes ou responsables d’infractions graves

Nous ne garantissons pas qu’un avertissement précédera l’application des règles en cas d’abus manifeste. Consultez
[Modération et sécurité des comptes](/clawhub/moderation) pour en savoir plus sur les signalements, les suspensions de modération,
les fiches masquées, les bannissements et la situation des comptes.
