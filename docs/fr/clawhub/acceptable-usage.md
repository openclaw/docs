---
read_when:
    - Examiner les téléversements pour détecter des abus ou des violations des politiques
    - Rédaction de documentation de modération ou de guides opérationnels pour les relecteurs
    - Déterminer si une skill doit être masquée ou si un utilisateur doit être banni
summary: 'Politique de la marketplace : ce que ClawHub autorise et ce qu’il n’hébergera pas.'
x-i18n:
    generated_at: "2026-05-13T02:51:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Utilisation acceptable

Cette page décrit les types de Skills et de contenu que ClawHub accepte, ainsi que les workflows d’abus qu’il n’hébergera pas.

Ces règles sont volontairement pratiques. Nous nous soucions avant tout des workflows d’abus de bout en bout, pas seulement de mots-clés isolés. Si un Skill est conçu pour contourner des défenses, exploiter abusivement des plateformes, escroquer des personnes, porter atteinte à la vie privée ou permettre un comportement non consenti, il n’a pas sa place sur ClawHub.

## Tendances récentes que nous acceptons explicitement

- Travail frontend et de système de design utilisant de vrais composants, des jetons sémantiques, des états accessibles et des parcours utilisateur testés.
- Composition shadcn/ui utilisant les composants source installés, les alias du projet et les variantes documentées au lieu d’un balisage ponctuel.
- Conversion JavaScript vers TypeScript pour UI5 qui préserve les commentaires, utilise des types UI5 concrets et garde les interfaces de contrôles générées faciles à relire.
- Revue de sécurité défensive, outils de modération et prompts de détection des abus qui présentent des preuves et maintiennent des limites claires d’approbation humaine.
- Automatisation de workflows fondée sur le consentement pour des comptes personnels ou d’équipe avec des identifiants explicites, une configuration transparente et des modes d’exécution à blanc ou de prévisualisation.
- Documentation, guides de migration, utilitaires pour développeurs et fixtures de test limités au logiciel qu’ils prennent en charge.

## Non accepté

- Workflows de contournement de sécurité ou d’accès non autorisé.
  - Exemples : contournement d’authentification, prise de contrôle de compte, contournement de CAPTCHA, contournement de Cloudflare ou de protections anti-bot, contournement de limites de débit, scraping furtif conçu pour vaincre les protections, prise de contrôle d’appel en direct ou d’agent, vol de session réutilisable, approbation automatique de flux d’appairage pour des utilisateurs non approuvés.

- Abus de plateforme et contournement de bannissement.
  - Exemples : comptes furtifs après bannissement, préparation/exploitation agricole de comptes, faux engagement, développement artificiel de karma ou d’abonnés, automatisation multi-comptes, publication de masse, bots de spam, automatisation de places de marché ou de réseaux sociaux conçue pour éviter la détection.

- Fraude, escroqueries et workflows financiers trompeurs.
  - Exemples : faux certificats, fausses factures, flux de paiement trompeurs, prospection frauduleuse, fausse preuve sociale, outils permettant de dépenser ou de facturer sans approbation humaine claire et contrôles transparents, ou workflows d’identité synthétique conçus pour créer des comptes à des fins de fraude.

- Scraping, enrichissement ou surveillance portant atteinte à la vie privée.
  - Exemples : scraping de coordonnées à grande échelle pour le spam, doxxing, harcèlement, extraction de prospects associée à une prospection non sollicitée, surveillance clandestine, recherche faciale ou correspondance biométrique utilisée sans consentement clair, ou achat, publication, téléchargement ou mise en exploitation de données divulguées ou de fuites issues de violations.

- Usurpation d’identité non consentie ou manipulation trompeuse de l’identité.
  - Exemples : échange de visage, jumeaux numériques, faux personnages, influenceurs clonés ou autres outils de manipulation d’identité utilisés pour usurper une identité ou induire en erreur.

- Contenu sexuel explicite et génération de contenu pour adultes avec sécurité désactivée.
  - Exemples : génération d’images/vidéos/contenus NSFW, wrappers de contenu pour adultes autour d’API tierces, ou Skills dont l’objectif principal est le contenu sexuel explicite.

- Exigences d’exécution cachées, dangereuses ou trompeuses.
  - Exemples : commandes d’installation obfusquées, `curl | sh`, exigences de secrets non déclarées, utilisation non déclarée de clés privées, exécution distante de `npx @latest` sans possibilité claire de revue, métadonnées trompeuses qui dissimulent ce dont le Skill a réellement besoin pour s’exécuter.

## Tendances récentes que nous refusons explicitement

- « Créer des comptes vendeurs furtifs après des bannissements de places de marché. »
- « Modifier l’appairage Telegram afin que des utilisateurs non approuvés reçoivent automatiquement des codes d’appairage. »
- « Développer des comptes Reddit/Twitter avec une automatisation indétectable. »
- « Générer des certificats professionnels ou des factures pour un usage arbitraire. »
- « Générer du contenu NSFW avec les contrôles de sécurité désactivés. »
- « Scraper des prospects, enrichir des contacts et lancer une prospection à froid à grande échelle. »
- « Acheter, publier ou télécharger des données divulguées ou des fuites issues de violations. »
- « Créer en masse des comptes e-mail ou sociaux avec des identités synthétiques ou une résolution de CAPTCHA. »

## Notes pour les réviseurs

- Le contexte compte. Le même sujet peut être légitime dans un cadre défensif étroit ou fondé sur le consentement, et inacceptable lorsqu’il est présenté comme un workflow d’abus.
- Nous devons privilégier l’action lorsqu’un Skill est clairement optimisé pour le contournement, la tromperie ou un usage non consenti.
- Les téléversements répétés dans ces catégories justifient le masquage du contenu et le bannissement du compte.

## Application

- Nous pouvons masquer, supprimer ou supprimer définitivement les Skills en infraction.
- Nous pouvons révoquer des jetons, supprimer de façon réversible le contenu associé et bannir les auteurs d’infractions répétées ou graves.
- Nous ne garantissons pas une application précédée d’un avertissement pour les abus évidents.
