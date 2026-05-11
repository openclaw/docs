---
read_when:
    - Examen des téléversements pour détecter les abus ou les violations des politiques
    - Rédaction de documentation de modération ou de guides opérationnels pour les réviseurs
    - Décider si une compétence doit être masquée ou si un utilisateur doit être banni
summary: 'Politique de la place de marché : ce que ClawHub autorise et ce qu’il n’hébergera pas.'
x-i18n:
    generated_at: "2026-05-11T20:23:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Utilisation acceptable

Cette page décrit les types de Skills et de contenus que ClawHub accepte, ainsi que les workflows d’abus qu’il n’hébergera pas.

Ces règles sont volontairement pratiques. Ce qui nous importe le plus, ce sont les workflows d’abus de bout en bout, pas seulement des mots-clés isolés. Si une Skill est conçue pour contourner des défenses, abuser de plateformes, escroquer des personnes, porter atteinte à la vie privée ou permettre des comportements non consentis, elle n’a pas sa place sur ClawHub.

## Modèles récents que nous acceptons explicitement

- Travaux frontend et de design system utilisant de vrais composants, des jetons sémantiques, des états accessibles et des parcours utilisateur testés.
- Composition shadcn/ui utilisant des composants source installés, des alias de projet et des variantes documentées au lieu d’un balisage ponctuel.
- Conversion UI5 de JavaScript vers TypeScript qui préserve les commentaires, utilise des types UI5 concrets et maintient les interfaces de contrôles générées faciles à réviser.
- Revue de sécurité défensive, outils de modération et prompts de détection d’abus qui présentent des preuves et maintiennent des limites claires d’approbation humaine.
- Automatisation de workflows fondée sur le consentement pour des comptes personnels ou d’équipe, avec identifiants explicites, configuration transparente et modes d’essai à blanc ou de prévisualisation.
- Documentation, runbooks de migration, utilitaires de développement et fixtures de test limités au logiciel qu’ils prennent en charge.

## Non accepté

- Workflows de contournement de sécurité ou d’accès non autorisé.
  - Exemples : contournement d’authentification, prise de contrôle de compte, contournement de CAPTCHA, contournement de Cloudflare ou d’anti-bot, contournement de limites de débit, scraping furtif conçu pour neutraliser les protections, prise de contrôle d’appel ou d’agent en direct, vol de session réutilisable, approbation automatique de flux d’appairage pour des utilisateurs non approuvés.

- Abus de plateforme et contournement de bannissement.
  - Exemples : comptes furtifs après bannissement, préchauffage ou élevage de comptes, faux engagement, développement de karma ou d’abonnés, automatisation multi-comptes, publication en masse, bots de spam, automatisation de marketplace ou sociale conçue pour éviter la détection.

- Fraude, escroqueries et workflows financiers trompeurs.
  - Exemples : faux certificats, fausses factures, flux de paiement trompeurs, démarchage frauduleux, fausse preuve sociale, outils permettant de dépenser ou de facturer sans approbation humaine claire ni contrôles transparents, ou workflows d’identité synthétique conçus pour créer des comptes à des fins de fraude.

- Scraping, enrichissement ou surveillance portant atteinte à la vie privée.
  - Exemples : scraping à grande échelle de coordonnées pour du spam, doxxing, harcèlement, extraction de prospects associée à du démarchage non sollicité, surveillance discrète, recherche faciale ou correspondance biométrique utilisée sans consentement clair, ou achat, publication, téléchargement ou opérationnalisation de données divulguées ou de dumps de violations de données.

- Usurpation non consentie ou manipulation trompeuse de l’identité.
  - Exemples : face swap, jumeaux numériques, faux personnages, influenceurs clonés ou autres outils de manipulation d’identité utilisés pour usurper une identité ou induire en erreur.

- Contenu sexuel explicite et génération de contenu adulte sans protections de sécurité.
  - Exemples : génération d’images, vidéos ou contenus NSFW, wrappers de contenu adulte autour d’API tierces, ou Skills dont l’objectif principal est le contenu sexuel explicite.

- Exigences d’exécution cachées, dangereuses ou trompeuses.
  - Exemples : commandes d’installation obfusquées, `curl | sh`, exigences de secrets non déclarées, utilisation non déclarée de clés privées, exécution distante de `npx @latest` sans possibilité claire de revue, métadonnées trompeuses qui masquent ce dont la Skill a réellement besoin pour s’exécuter.

## Modèles récents que nous n’acceptons explicitement pas

- « Créer des comptes vendeurs furtifs après des bannissements sur des marketplaces. »
- « Modifier l’appairage Telegram afin que les utilisateurs non approuvés reçoivent automatiquement des codes d’appairage. »
- « Développer des comptes Reddit/Twitter avec une automatisation indétectable. »
- « Générer des certificats professionnels ou des factures pour un usage arbitraire. »
- « Générer du contenu NSFW avec les contrôles de sécurité désactivés. »
- « Scraper des prospects, enrichir des contacts et lancer du démarchage à froid à grande échelle. »
- « Acheter, publier ou télécharger des données divulguées ou des dumps de violations de données. »
- « Créer en masse des comptes e-mail ou sociaux avec des identités synthétiques ou la résolution de CAPTCHA. »

## Notes pour les réviseurs

- Le contexte compte. Un même sujet peut être légitime dans un cadre défensif étroit ou fondé sur le consentement, et inacceptable lorsqu’il est présenté comme un workflow d’abus.
- Nous devons privilégier l’action lorsqu’une Skill est clairement optimisée pour l’évasion, la tromperie ou une utilisation non consentie.
- Les téléversements répétés dans ces catégories justifient le masquage du contenu et le bannissement du compte.

## Application

- Nous pouvons masquer, supprimer ou supprimer définitivement les Skills en infraction.
- Nous pouvons révoquer des jetons, supprimer de façon réversible le contenu associé et bannir les récidivistes ou les auteurs d’infractions graves.
- Nous ne garantissons pas une application précédée d’un avertissement pour les abus manifestes.
