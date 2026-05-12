---
read_when:
    - Examen des téléversements pour détecter les abus ou les violations des politiques
    - Rédaction de documentation de modération ou de guides opérationnels pour les relecteurs
    - Déterminer si une compétence doit être masquée ou si un utilisateur doit être banni
summary: 'Politique de la place de marché : ce que ClawHub autorise et ce qu’il n’hébergera pas.'
x-i18n:
    generated_at: "2026-05-12T00:56:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Utilisation acceptable

Cette page décrit les types de skills et de contenu que ClawHub accepte, ainsi que les workflows d’abus qu’il n’hébergera pas.

Ces règles sont volontairement pratiques. Nous nous intéressons surtout aux workflows d’abus de bout en bout, et pas seulement à des mots-clés isolés. Si une skill est conçue pour contourner des défenses, abuser de plateformes, arnaquer des personnes, porter atteinte à la vie privée ou permettre des comportements non consensuels, elle n’a pas sa place sur ClawHub.

## Schémas récents que nous acceptons explicitement

- Travail frontend et sur les systèmes de conception utilisant des composants réels, des tokens sémantiques, des états accessibles et des parcours utilisateur testés.
- Composition shadcn/ui utilisant des composants source installés, des alias de projet et des variantes documentées plutôt que du balisage ponctuel.
- Conversion UI5 de JavaScript vers TypeScript qui préserve les commentaires, utilise des types UI5 concrets et garde les interfaces de contrôles générées vérifiables.
- Revue de sécurité défensive, outillage de modération et prompts de détection d’abus qui présentent des preuves et gardent des limites claires d’approbation humaine.
- Automatisation de workflows fondée sur le consentement pour des comptes personnels ou d’équipe, avec des identifiants explicites, une configuration transparente et des modes d’essai à blanc ou d’aperçu.
- Documentation, runbooks de migration, utilitaires de développement et fixtures de test limités aux logiciels qu’ils prennent en charge.

## Non acceptable

- Workflows de contournement de sécurité ou d’accès non autorisé.
  - Exemples : contournement d’authentification, prise de contrôle de compte, contournement de CAPTCHA, évasion Cloudflare ou anti-bot, contournement de limites de débit, scraping furtif conçu pour déjouer les protections, prise de contrôle d’appel en direct ou d’agent, vol de session réutilisable, approbation automatique de flux d’appairage pour des utilisateurs non approuvés.

- Abus de plateforme et évasion de bannissement.
  - Exemples : comptes furtifs après bannissement, préparation ou élevage de comptes, faux engagement, culture de karma ou d’abonnés, automatisation multi-comptes, publication de masse, bots de spam, automatisation de places de marché ou de réseaux sociaux conçue pour éviter la détection.

- Fraude, arnaques et workflows financiers trompeurs.
  - Exemples : faux certificats, fausses factures, flux de paiement trompeurs, prospection frauduleuse, fausse preuve sociale, outils permettant de dépenser ou de facturer sans approbation humaine claire ni contrôles transparents, ou workflows d’identité synthétique conçus pour créer des comptes à des fins de fraude.

- Scraping, enrichissement ou surveillance portant atteinte à la vie privée.
  - Exemples : scraping de coordonnées à grande échelle pour du spam, doxxing, harcèlement, extraction de prospects associée à une prospection non sollicitée, surveillance dissimulée, recherche faciale ou correspondance biométrique utilisée sans consentement clair, ou achat, publication, téléchargement ou opérationnalisation de données divulguées ou de dumps de violations.

- Usurpation non consensuelle ou manipulation trompeuse de l’identité.
  - Exemples : échange de visage, jumeaux numériques, faux personnages, influenceurs clonés ou autres outils de manipulation d’identité utilisés pour usurper une identité ou induire en erreur.

- Contenu sexuel explicite et génération de contenu adulte avec sécurité désactivée.
  - Exemples : génération d’images, de vidéos ou de contenu NSFW, wrappers de contenu adulte autour d’API tierces, ou skills dont l’objectif principal est le contenu sexuel explicite.

- Exigences d’exécution cachées, dangereuses ou trompeuses.
  - Exemples : commandes d’installation obscurcies, `curl | sh`, exigences de secrets non déclarées, utilisation non déclarée de clés privées, exécution distante de `npx @latest` sans vérifiabilité claire, métadonnées trompeuses qui dissimulent ce dont la skill a réellement besoin pour s’exécuter.

## Schémas récents que nous n’acceptons explicitement pas

- « Créer des comptes de vendeurs furtifs après des bannissements de place de marché. »
- « Modifier l’appairage Telegram afin que des utilisateurs non approuvés reçoivent automatiquement des codes d’appairage. »
- « Cultiver des comptes Reddit/Twitter avec une automatisation indétectable. »
- « Générer des certificats professionnels ou des factures pour un usage arbitraire. »
- « Générer du contenu NSFW avec les contrôles de sécurité désactivés. »
- « Scraper des prospects, enrichir des contacts et lancer une prospection à froid à grande échelle. »
- « Acheter, publier ou télécharger des données divulguées ou des dumps de violations. »
- « Créer en masse des comptes e-mail ou sociaux avec des identités synthétiques ou de la résolution de CAPTCHA. »

## Notes pour les réviseurs

- Le contexte compte. Le même sujet peut être légitime dans un cadre défensif étroit ou fondé sur le consentement, et inacceptable lorsqu’il est présenté comme un workflow d’abus.
- Nous devons privilégier l’action lorsqu’une skill est clairement optimisée pour l’évasion, la tromperie ou l’usage non consensuel.
- Des téléversements répétés dans ces catégories justifient le masquage du contenu et le bannissement du compte.

## Application des règles

- Nous pouvons masquer, supprimer ou supprimer définitivement les skills en infraction.
- Nous pouvons révoquer des tokens, supprimer de manière réversible le contenu associé et bannir les contrevenants récidivistes ou graves.
- Nous ne garantissons pas une application avec avertissement préalable en cas d’abus manifeste.
