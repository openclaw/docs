---
read_when:
    - Examen des téléversements pour détecter des abus ou des violations des politiques
    - Rédaction de documentation de modération ou de guides opérationnels pour les réviseurs
    - Déterminer si un skill doit être masqué ou si un utilisateur doit être banni
summary: 'Politique de la place de marché : ce que ClawHub autorise et ce qu’il n’hébergera pas.'
x-i18n:
    generated_at: "2026-05-12T15:42:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Utilisation acceptable

Cette page décrit les types de Skills et de contenu que ClawHub accepte, ainsi que les workflows d’abus qu’il n’hébergera pas.

Ces règles sont volontairement pratiques. Ce qui nous importe le plus, ce sont les workflows d’abus de bout en bout, pas seulement des mots-clés isolés. Si un Skill est conçu pour contourner des défenses, abuser de plateformes, escroquer des personnes, porter atteinte à la vie privée ou permettre un comportement non consensuel, il n’a pas sa place sur ClawHub.

## Motifs récents que nous acceptons explicitement

- Travail d’interface utilisateur et de système de conception utilisant de vrais composants, des jetons sémantiques, des états accessibles et des parcours utilisateur testés.
- Composition shadcn/ui utilisant des composants sources installés, des alias de projet et des variantes documentées au lieu d’un balisage ponctuel.
- Conversion UI5 de JavaScript vers TypeScript qui préserve les commentaires, utilise des types UI5 concrets et garde les interfaces de contrôle générées faciles à examiner.
- Revue de sécurité défensive, outils de modération et prompts de détection d’abus qui présentent des preuves et gardent claires les limites d’approbation humaine.
- Automatisation de workflows fondée sur le consentement pour des comptes personnels ou d’équipe avec des identifiants explicites, une configuration transparente et des modes d’essai à blanc ou d’aperçu.
- Documentation, runbooks de migration, utilitaires de développement et fixtures de test limités au logiciel qu’ils prennent en charge.

## Non accepté

- Workflows de contournement de sécurité ou d’accès non autorisé.
  - Exemples : contournement d’authentification, prise de contrôle de compte, contournement de CAPTCHA, évasion Cloudflare ou anti-bot, contournement de limites de débit, scraping furtif conçu pour déjouer les protections, prise de contrôle d’appels en direct ou d’agents, vol de session réutilisable, approbation automatique de flux d’association pour des utilisateurs non approuvés.

- Abus de plateforme et contournement de bannissement.
  - Exemples : comptes furtifs après des bannissements, préparation ou élevage de comptes, engagement factice, développement artificiel de karma ou d’abonnés, automatisation multi-comptes, publication de masse, bots de spam, automatisation de places de marché ou de réseaux sociaux conçue pour éviter la détection.

- Fraude, escroqueries et workflows financiers trompeurs.
  - Exemples : faux certificats, fausses factures, flux de paiement trompeurs, prospection frauduleuse, fausse preuve sociale, outils qui permettent de dépenser ou de facturer sans approbation humaine claire ni contrôles transparents, ou workflows d’identité synthétique conçus pour créer des comptes à des fins de fraude.

- Scraping, enrichissement ou surveillance portant atteinte à la vie privée.
  - Exemples : scraping de coordonnées à grande échelle pour du spam, doxxing, harcèlement, extraction de prospects associée à une prospection non sollicitée, surveillance clandestine, recherche faciale ou correspondance biométrique utilisée sans consentement clair, ou achat, publication, téléchargement ou exploitation de données divulguées ou de dumps de violations de données.

- Usurpation d’identité non consensuelle ou manipulation trompeuse de l’identité.
  - Exemples : échange de visages, jumeaux numériques, faux personnages, influenceurs clonés ou autres outils de manipulation d’identité utilisés pour usurper une identité ou induire en erreur.

- Contenu sexuel explicite et génération de contenu adulte avec les sécurités désactivées.
  - Exemples : génération d’images, vidéos ou contenus NSFW, wrappers de contenu adulte autour d’API tierces, ou Skills dont l’objectif principal est le contenu sexuel explicite.

- Exigences d’exécution cachées, dangereuses ou trompeuses.
  - Exemples : commandes d’installation obfusquées, `curl | sh`, exigences de secrets non déclarées, utilisation non déclarée de clés privées, exécution distante de `npx @latest` sans capacité d’examen claire, métadonnées trompeuses qui masquent ce dont le Skill a réellement besoin pour s’exécuter.

## Motifs récents que nous n’acceptons explicitement pas

- « Créer des comptes vendeurs furtifs après des bannissements sur une place de marché. »
- « Modifier l’association Telegram afin que des utilisateurs non approuvés reçoivent automatiquement des codes d’association. »
- « Développer des comptes Reddit/Twitter avec une automatisation indétectable. »
- « Générer des certificats ou des factures professionnels pour un usage arbitraire. »
- « Générer du contenu NSFW avec les contrôles de sécurité désactivés. »
- « Scraper des prospects, enrichir des contacts et lancer une prospection à froid à grande échelle. »
- « Acheter, publier ou télécharger des données divulguées ou des dumps de violations de données. »
- « Créer en masse des comptes e-mail ou sociaux avec des identités synthétiques ou une résolution de CAPTCHA. »

## Notes pour les réviseurs

- Le contexte compte. Le même sujet peut être légitime dans un cadre défensif étroit ou fondé sur le consentement, et inacceptable lorsqu’il est conditionné comme un workflow d’abus.
- Nous devons privilégier l’action lorsqu’un Skill est clairement optimisé pour l’évasion, la tromperie ou une utilisation non consensuelle.
- Les téléversements répétés dans ces catégories constituent un motif de masquage du contenu et de bannissement du compte.

## Application

- Nous pouvons masquer, supprimer ou supprimer définitivement les Skills contrevenants.
- Nous pouvons révoquer des jetons, supprimer de manière réversible le contenu associé et bannir les auteurs d’infractions répétées ou graves.
- Nous ne garantissons pas une application précédée d’un avertissement en cas d’abus manifeste.
