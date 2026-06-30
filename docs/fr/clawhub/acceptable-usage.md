---
read_when:
    - Examen des téléversements pour détecter les abus ou les violations de politique
    - Rédaction de documentation de modération ou de guides opérationnels pour les réviseurs
    - Décider si une skill doit être masquée ou si un utilisateur doit être banni
sidebarTitle: Acceptable Usage
summary: 'Politique de la place de marché : ce que ClawHub autorise et ce qu’il n’hébergera pas.'
title: Utilisation acceptable
x-i18n:
    generated_at: "2026-06-30T22:13:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Utilisation acceptable

ClawHub héberge des Skills, plugins, packages et métadonnées de marketplace pour OpenClaw.
Utilisez cette page pour déterminer si du contenu ou un comportement de publication a sa place sur
ClawHub.

Ces règles s’appliquent à ce qu’une fiche fait, à ce qu’elle demande aux utilisateurs d’exécuter, à la manière dont elle
se présente, et à la façon dont les éditeurs utilisent les surfaces de découverte, d’installation et
de confiance de ClawHub. Pour les états de modération et le statut des comptes, consultez
[Modération et sécurité des comptes](/clawhub/moderation). Pour les réclamations relatives au droit d’auteur ou à d’autres droits,
consultez [Demandes relatives aux droits sur le contenu](/clawhub/content-rights).

## Contenu autorisé

ClawHub accueille le contenu utile, compréhensible et publié de bonne
foi.

| Catégorie                                         | Autorisé lorsque                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productivité des développeurs                           | La fiche aide les utilisateurs à créer, tester, migrer, déboguer, documenter ou exploiter des logiciels.                                               |
| Workflows d’interface utilisateur, de données et d’automatisation               | Le périmètre est clair, les identifiants requis sont explicites, et les actions risquées incluent des parcours de revue, d’exécution à blanc, de prévisualisation ou de confirmation. |
| Sécurité défensive, modération et revue des abus | L’outil est présenté pour une revue autorisée, préserve les preuves et garde claires les limites d’approbation humaine.                          |
| Workflows personnels ou d’équipe                       | Le workflow utilise des comptes fondés sur le consentement, une configuration transparente et des autorisations explicites.                                            |
| Catalogues maintenus                              | Chaque fiche est distincte, utile, décrite avec précision et raisonnablement maintenue.                                                |

Le contexte compte. Le même sujet peut être acceptable dans un cadre défensif étroit ou
fondé sur le consentement, et inacceptable lorsqu’il est empaqueté comme workflow d’abus.

## Contenu interdit

ClawHub n’héberge pas de contenu dont l’objectif principal est l’abus, la tromperie, l’exécution
dangereuse ou la violation de droits.

| Catégorie                                                    | Non autorisé                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accès non autorisé ou contournement de sécurité                      | Contournement de l’authentification, prise de contrôle de compte, abus des limites de débit, prise de contrôle d’appel en direct ou d’agent, vol de session réutilisable, ou approbation automatique de flux d’association pour des utilisateurs non approuvés.                                                                                                                                                   |
| Abus de plateforme et contournement de bannissement                              | Comptes furtifs après bannissement, préparation ou ferme de comptes, faux engagement, automatisation multi-comptes, publication massive, bots de spam ou automatisation conçue pour éviter la détection.                                                                                                                                          |
| Fraude, arnaques et workflows financiers trompeurs             | Faux certificats ou factures, flux de paiement trompeurs, prospection frauduleuse, fausse preuve sociale, workflows d’identité synthétique à des fins de fraude, ou outils de dépense/facturation sans approbation humaine claire.                                                                                                                    |
| Enrichissement ou surveillance portant atteinte à la vie privée                 | Extraction de contacts pour spam, doxxing, harcèlement, extraction de prospects associée à une prospection non sollicitée, surveillance secrète, correspondance biométrique non consensuelle, ou utilisation de données divulguées ou de dumps de violation.                                                                                                                  |
| Usurpation d’identité ou manipulation d’identité non consensuelle       | Échange de visage, jumeaux numériques, influenceurs clonés, faux personas ou autres outils utilisés pour usurper une identité ou tromper.                                                                                                                                                                                                 |
| Contenu sexuel explicite ou génération pour adultes avec sécurité désactivée | Génération d’images, de vidéos ou de contenu NSFW ; wrappers de contenu adulte autour d’API tierces ; ou fiches dont l’objectif principal est le contenu sexuel explicite.                                                                                                                                                       |
| Exigences d’exécution cachées, dangereuses ou trompeuses        | Commandes d’installation obscurcies, installateurs pipe-to-shell tels que du contenu téléchargé exécuté avec `sh` ou `bash` sans revue claire possible, exigences non déclarées de secrets ou de clés privées, exécution distante de `npx @latest` sans revue claire possible, ou métadonnées qui masquent ce dont la fiche a réellement besoin pour s’exécuter. |
| Matériel enfreignant le droit d’auteur ou violant des droits           | Republier la skill, le plugin, la documentation, les ressources de marque ou le code propriétaire de quelqu’un d’autre sans autorisation ; violer les conditions de licence ; ou usurper l’identité de l’auteur ou de l’éditeur d’origine.                                                                                                                            |

## Comportement de marketplace interdit

ClawHub examine aussi la manière dont les éditeurs utilisent la marketplace. N’utilisez pas ClawHub pour
manipuler la découverte, les métriques, les signaux de confiance, les systèmes de modération ou
l’attention des utilisateurs.

Les comportements de marketplace interdits incluent :

- publier en masse de grands nombres de fiches peu soignées, dupliquées, de remplacement ou
  générées par machine qui ne semblent pas avoir de valeur réelle pour les utilisateurs
- inonder les surfaces de recherche ou de catégories avec des skills ou plugins quasi identiques
- publier des centaines de fiches avec peu ou pas d’utilisation, de maintenance, de clarté de la source
  ou de différenciation significative
- gonfler artificiellement les installations, téléchargements, étoiles ou autres métriques
  d’engagement par automatisation, boucles d’auto-installation, faux comptes, activité
  coordonnée, engagement rémunéré ou autre comportement non organique
- créer ou faire tourner des comptes pour contourner la modération, les bannissements, les limites d’éditeur ou
  la revue de marketplace
- induire les utilisateurs en erreur sur la propriété, la source, les capacités, la posture de sécurité,
  les exigences d’installation ou l’affiliation avec un autre projet ou éditeur
- téléverser à plusieurs reprises du contenu qui a déjà été masqué, supprimé ou bloqué
  sans corriger le problème sous-jacent

La publication à grand volume n’est pas automatiquement un abus. Les grands catalogues sont acceptables
lorsque les fiches sont sensiblement différentes, décrites avec précision, maintenues
et utilisées par de vrais utilisateurs. Les grands catalogues deviennent un problème de confiance et de sécurité lorsque
le volume s’accompagne de fiches minces, dupliquées, trompeuses, non maintenues ou
promues artificiellement.

## Droits sur le contenu

Si vous pensez qu’un contenu sur ClawHub enfreint votre droit d’auteur ou d’autres droits, utilisez
[Demandes relatives aux droits sur le contenu](/clawhub/content-rights). N’utilisez pas les signalements normaux de marketplace
pour les réclamations relatives au droit d’auteur ou aux droits, sauf si la fiche est aussi dangereuse,
malveillante ou trompeuse.

## Revue et application

ClawHub peut utiliser des vérifications automatisées, des signaux statistiques d’abus, des signalements d’utilisateurs et
une revue par le personnel pour identifier le contenu dangereux ou les comportements de publication abusifs. Un signal
ne prouve pas un abus à lui seul ; il aide ClawHub à décider ce qui nécessite une revue.

Nous pouvons :

- masquer, suspendre, supprimer, supprimer de manière réversible ou, lorsque le type de ressource le prend en charge,
  supprimer définitivement les fiches en infraction
- bloquer les téléchargements ou les installations pour les versions dangereuses
- révoquer les jetons API
- supprimer de manière réversible le contenu associé
- restreindre l’accès à la publication
- bannir les récidivistes ou les auteurs d’infractions graves

Nous ne garantissons pas une application précédée d’un avertissement pour les abus manifestes. Consultez
[Modération et sécurité des comptes](/clawhub/moderation) pour les signalements, les suspensions de modération,
les fiches masquées, les bannissements et le statut des comptes.
