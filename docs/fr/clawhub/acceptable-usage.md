---
read_when:
    - Examen des téléversements pour détecter des abus ou des violations des politiques
    - Rédaction de documentation de modération ou de guides opérationnels pour les relecteurs
    - Décider si une Skill doit être masquée ou si un utilisateur doit être banni
summary: 'Politique de la place de marché : ce que ClawHub autorise et ce qu’il n’hébergera pas.'
x-i18n:
    generated_at: "2026-05-13T05:32:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Utilisation acceptable

Cette page décrit les types de Skills et de contenu que ClawHub accepte, ainsi que les flux de travail abusifs qu’il n’hébergera pas.

Ces règles se veulent délibérément pratiques. Nous nous préoccupons surtout des flux de travail abusifs de bout en bout, et pas seulement de mots-clés isolés. Si un Skill est conçu pour contourner des défenses, abuser de plateformes, escroquer des personnes, envahir la vie privée ou permettre des comportements non consensuels, il n’a pas sa place sur ClawHub.

## Modèles récents que nous acceptons explicitement

- Travail frontend et de système de conception utilisant de vrais composants, des jetons sémantiques, des états accessibles et des parcours utilisateur testés.
- Composition shadcn/ui utilisant des composants source installés, des alias de projet et des variantes documentées plutôt qu’un balisage ponctuel.
- Conversion JavaScript vers TypeScript pour UI5 qui préserve les commentaires, utilise des types UI5 concrets et garde les interfaces de contrôle générées vérifiables.
- Revue de sécurité défensive, outillage de modération et prompts de détection des abus qui présentent des preuves et maintiennent des limites claires d’approbation humaine.
- Automatisation de flux de travail fondée sur le consentement pour des comptes personnels ou d’équipe, avec des identifiants explicites, une configuration transparente et des modes de simulation ou d’aperçu.
- Documentation, procédures de migration, utilitaires développeur et jeux de tests limités aux logiciels qu’ils prennent en charge.

## Non accepté

- Flux de travail de contournement de la sécurité ou d’accès non autorisé.
  - Exemples : contournement d’authentification, prise de contrôle de compte, contournement de CAPTCHA, contournement de Cloudflare ou de systèmes anti-bots, contournement de limites de débit, scraping furtif conçu pour neutraliser les protections, prise de contrôle d’appels en direct ou d’agents, vol de session réutilisable, approbation automatique de flux d’association pour des utilisateurs non approuvés.

- Abus de plateformes et contournement d’interdictions.
  - Exemples : comptes furtifs après interdiction, préchauffage ou élevage de comptes, faux engagement, culture de karma ou d’abonnés, automatisation multi-comptes, publication de masse, bots de spam, automatisation de places de marché ou de réseaux sociaux conçue pour éviter la détection.

- Fraude, escroqueries et flux de travail financiers trompeurs.
  - Exemples : faux certificats, fausses factures, flux de paiement trompeurs, prospection frauduleuse, fausse preuve sociale, outils permettant des dépenses ou des débits sans approbation humaine claire ni contrôles transparents, ou flux de travail d’identité synthétique conçus pour créer des comptes à des fins de fraude.

- Scraping, enrichissement ou surveillance portant atteinte à la vie privée.
  - Exemples : scraping à grande échelle de coordonnées pour du spam, doxxing, harcèlement, extraction de prospects associée à une prospection non sollicitée, surveillance dissimulée, recherche faciale ou correspondance biométrique utilisée sans consentement clair, ou achat, publication, téléchargement ou opérationnalisation de données divulguées ou de dumps issus de violations.

- Usurpation d’identité non consensuelle ou manipulation trompeuse de l’identité.
  - Exemples : face swap, jumeaux numériques, faux profils, influenceurs clonés ou autre outillage de manipulation d’identité utilisé pour usurper une identité ou induire en erreur.

- Contenu sexuel explicite et génération de contenu adulte avec les sécurités désactivées.
  - Exemples : génération d’images, de vidéos ou de contenu NSFW, wrappers de contenu adulte autour d’API tierces, ou Skills dont l’objectif principal est le contenu sexuel explicite.

- Exigences d’exécution cachées, dangereuses ou trompeuses.
  - Exemples : commandes d’installation obscurcies, `curl | sh`, exigences de secrets non déclarées, utilisation non déclarée de clés privées, exécution distante de `npx @latest` sans capacité de revue claire, métadonnées trompeuses qui dissimulent ce dont le Skill a réellement besoin pour s’exécuter.

## Modèles récents que nous n’acceptons explicitement pas

- « Créer des comptes vendeurs furtifs après des interdictions sur une place de marché. »
- « Modifier l’association Telegram afin que des utilisateurs non approuvés reçoivent automatiquement des codes d’association. »
- « Cultiver des comptes Reddit/Twitter avec une automatisation indétectable. »
- « Générer des certificats professionnels ou des factures pour un usage arbitraire. »
- « Générer du contenu NSFW avec les contrôles de sécurité désactivés. »
- « Scraper des prospects, enrichir des contacts et lancer une prospection à froid à grande échelle. »
- « Acheter, publier ou télécharger des données divulguées ou des dumps issus de violations. »
- « Créer en masse des comptes e-mail ou sociaux avec des identités synthétiques ou la résolution de CAPTCHA. »

## Notes pour les réviseurs

- Le contexte compte. Le même sujet peut être légitime dans un cadre défensif étroit ou fondé sur le consentement, et inacceptable lorsqu’il est présenté comme un flux de travail abusif.
- Nous devrions privilégier l’action lorsqu’un Skill est clairement optimisé pour l’évasion, la tromperie ou l’usage non consensuel.
- Les téléversements répétés dans ces catégories justifient le masquage du contenu et le bannissement du compte.

## Application

- Nous pouvons masquer, supprimer ou supprimer définitivement les Skills en infraction.
- Nous pouvons révoquer des jetons, supprimer de manière réversible le contenu associé et bannir les auteurs d’infractions répétées ou graves.
- Nous ne garantissons pas une application avec avertissement préalable en cas d’abus évident.
