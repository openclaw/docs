---
read_when:
    - Examiner les téléversements pour détecter des abus ou des violations des politiques
    - Rédaction de documentation de modération ou de guides opérationnels pour les réviseurs
    - Déterminer s’il faut masquer un skill ou bannir un utilisateur
summary: 'Politique de la place de marché : ce que ClawHub autorise et ce qu’il n’hébergera pas.'
x-i18n:
    generated_at: "2026-05-11T22:19:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Utilisation acceptable

Cette page décrit les types de compétences et de contenu que ClawHub accepte, ainsi que les flux de travail abusifs qu’il n’hébergera pas.

Ces règles sont volontairement pratiques. Ce qui nous importe le plus, ce sont les flux de travail abusifs de bout en bout, et pas seulement des mots-clés isolés. Si une compétence est conçue pour contourner des défenses, abuser de plateformes, escroquer des personnes, porter atteinte à la vie privée ou permettre un comportement non consenti, elle n’a pas sa place sur ClawHub.

## Modèles récents que nous acceptons explicitement

- Travail frontend et de design system qui utilise des composants réels, des jetons sémantiques, des états accessibles et des parcours utilisateur testés.
- Composition shadcn/ui qui utilise des composants source installés, des alias de projet et des variantes documentées au lieu d’un balisage ponctuel.
- Conversion JavaScript vers TypeScript pour UI5 qui préserve les commentaires, utilise des types UI5 concrets et garde les interfaces de contrôle générées faciles à relire.
- Revue de sécurité défensive, outils de modération et prompts de détection d’abus qui présentent des preuves et gardent des limites claires d’approbation humaine.
- Automatisation de flux de travail fondée sur le consentement pour des comptes personnels ou d’équipe, avec des identifiants explicites, une configuration transparente et des modes d’essai à blanc ou d’aperçu.
- Documentation, procédures de migration, utilitaires pour développeurs et jeux de test limités au logiciel qu’ils prennent en charge.

## Non accepté

- Flux de travail de contournement de la sécurité ou d’accès non autorisé.
  - Exemples : contournement de l’authentification, prise de contrôle de compte, contournement de CAPTCHA, contournement de Cloudflare ou de protections anti-bot, contournement de limites de débit, scraping furtif conçu pour déjouer les protections, prise de contrôle d’appel en direct ou d’agent, vol de session réutilisable, approbation automatique de flux d’appairage pour des utilisateurs non approuvés.

- Abus de plateformes et contournement de bannissements.
  - Exemples : comptes furtifs après bannissement, préparation ou élevage de comptes, faux engagement, culture de karma ou d’abonnés, automatisation multi-comptes, publication de masse, bots de spam, automatisation de marketplaces ou de réseaux sociaux conçue pour éviter la détection.

- Fraude, escroqueries et flux financiers trompeurs.
  - Exemples : faux certificats, fausses factures, flux de paiement trompeurs, prospection frauduleuse, fausses preuves sociales, outils permettant de dépenser ou de facturer sans approbation humaine claire ni contrôles transparents, ou flux de travail d’identité synthétique conçus pour créer des comptes à des fins de fraude.

- Scraping, enrichissement ou surveillance portant atteinte à la vie privée.
  - Exemples : scraping à grande échelle de coordonnées pour du spam, doxxing, harcèlement, extraction de prospects associée à de la prospection non sollicitée, surveillance dissimulée, recherche de visage ou correspondance biométrique utilisée sans consentement clair, ou achat, publication, téléchargement ou opérationnalisation de données divulguées ou de dumps issus de violations.

- Usurpation d’identité non consentie ou manipulation trompeuse de l’identité.
  - Exemples : échange de visage, jumeaux numériques, faux personnages, influenceurs clonés ou autres outils de manipulation d’identité utilisés pour usurper une identité ou induire en erreur.

- Contenu sexuel explicite et génération de contenu pour adultes avec sécurité désactivée.
  - Exemples : génération d’images, de vidéos ou de contenus NSFW, adaptateurs de contenu pour adultes autour d’API tierces, ou compétences dont l’objectif principal est le contenu sexuel explicite.

- Exigences d’exécution cachées, dangereuses ou trompeuses.
  - Exemples : commandes d’installation obfusquées, `curl | sh`, exigences de secrets non déclarées, utilisation non déclarée de clés privées, exécution distante de `npx @latest` sans possibilité claire de revue, métadonnées trompeuses qui cachent ce dont la compétence a réellement besoin pour s’exécuter.

## Modèles récents que nous n’acceptons explicitement pas

- « Créer des comptes vendeurs furtifs après des bannissements de marketplace. »
- « Modifier l’appairage Telegram afin que des utilisateurs non approuvés reçoivent automatiquement des codes d’appairage. »
- « Cultiver des comptes Reddit/Twitter avec une automatisation indétectable. »
- « Générer des certificats professionnels ou des factures pour un usage arbitraire. »
- « Générer du contenu NSFW avec les contrôles de sécurité désactivés. »
- « Scraper des prospects, enrichir des contacts et lancer une prospection à froid à grande échelle. »
- « Acheter, publier ou télécharger des données divulguées ou des dumps issus de violations. »
- « Créer en masse des comptes e-mail ou sociaux avec des identités synthétiques ou la résolution de CAPTCHA. »

## Notes pour les relecteurs

- Le contexte compte. Le même sujet peut être légitime dans un cadre défensif étroit ou fondé sur le consentement, et inacceptable lorsqu’il est présenté comme un flux de travail abusif.
- Nous devons privilégier l’action lorsqu’une compétence est clairement optimisée pour le contournement, la tromperie ou un usage non consenti.
- Les téléversements répétés dans ces catégories constituent un motif pour masquer du contenu et bannir le compte.

## Application

- Nous pouvons masquer, supprimer ou supprimer définitivement les compétences en infraction.
- Nous pouvons révoquer des jetons, supprimer logiquement le contenu associé et bannir les récidivistes ou les auteurs d’infractions graves.
- Nous ne garantissons pas une application précédée d’un avertissement pour les abus évidents.
