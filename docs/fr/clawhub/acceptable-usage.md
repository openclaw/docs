---
read_when:
    - Examen des téléversements pour détecter les abus ou les violations des règles
    - Rédaction de documents de modération ou de guides opérationnels pour les relecteurs
    - Déterminer si une Skill doit être masquée ou si un utilisateur doit être banni
summary: 'Politique de la place de marché : ce que ClawHub autorise et ce qu’il n’hébergera pas.'
x-i18n:
    generated_at: "2026-05-12T04:09:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Utilisation acceptable

Cette page décrit les types de Skills et de contenus que ClawHub accepte, ainsi que les workflows abusifs qu’il n’hébergera pas.

Ces règles sont volontairement pratiques. Nous nous intéressons surtout aux workflows abusifs de bout en bout, et pas seulement à des mots-clés isolés. Si une Skill est conçue pour contourner des défenses, abuser de plateformes, escroquer des personnes, porter atteinte à la vie privée ou permettre un comportement non consensuel, elle n’a pas sa place sur ClawHub.

## Modèles récents que nous acceptons explicitement

- Travail frontend et de design system utilisant de vrais composants, des jetons sémantiques, des états accessibles et des parcours utilisateur testés.
- Composition shadcn/ui utilisant des composants sources installés, des alias de projet et des variantes documentées plutôt qu’un balisage ponctuel.
- Conversion UI5 JavaScript vers TypeScript qui préserve les commentaires, utilise des types UI5 concrets et garde les interfaces de contrôle générées faciles à relire.
- Revue de sécurité défensive, outils de modération et prompts de détection des abus qui présentent des preuves et gardent des limites claires pour l’approbation humaine.
- Automatisation de workflows fondée sur le consentement pour des comptes personnels ou d’équipe, avec des identifiants explicites, une configuration transparente et des modes d’exécution à blanc ou d’aperçu.
- Documentation, runbooks de migration, utilitaires pour développeurs et fixtures de test limités au logiciel qu’ils prennent en charge.

## Non acceptable

- Workflows de contournement de sécurité ou d’accès non autorisé.
  - Exemples : contournement d’authentification, prise de contrôle de compte, contournement de CAPTCHA, contournement de Cloudflare ou de protections anti-bot, contournement de limites de débit, scraping furtif conçu pour déjouer les protections, prise de contrôle d’un appel en direct ou d’un agent, vol de session réutilisable, approbation automatique de parcours d’appairage pour des utilisateurs non approuvés.

- Abus de plateforme et contournement de bannissement.
  - Exemples : comptes furtifs après bannissement, préchauffage ou élevage de comptes, faux engagement, constitution de karma ou d’abonnés, automatisation multi-comptes, publication massive, bots de spam, automatisation de places de marché ou de réseaux sociaux conçue pour éviter la détection.

- Fraude, escroqueries et workflows financiers trompeurs.
  - Exemples : faux certificats, fausses factures, flux de paiement trompeurs, prospection frauduleuse, fausse preuve sociale, outils permettant de dépenser ou de facturer sans approbation humaine claire ni contrôles transparents, ou workflows d’identité synthétique conçus pour créer des comptes à des fins de fraude.

- Scraping, enrichissement ou surveillance portant atteinte à la vie privée.
  - Exemples : scraping de coordonnées à grande échelle pour du spam, doxxing, harcèlement, extraction de prospects associée à de la prospection non sollicitée, surveillance dissimulée, recherche faciale ou correspondance biométrique utilisée sans consentement clair, ou achat, publication, téléchargement ou opérationnalisation de données divulguées ou de dumps issus de violations.

- Usurpation d’identité non consensuelle ou manipulation trompeuse de l’identité.
  - Exemples : face swap, jumeaux numériques, faux personnages, influenceurs clonés ou autres outils de manipulation de l’identité utilisés pour usurper une identité ou induire en erreur.

- Contenu sexuel explicite et génération de contenu pour adultes avec protections désactivées.
  - Exemples : génération d’images, de vidéos ou de contenus NSFW, wrappers de contenu pour adultes autour d’API tierces, ou Skills dont l’objectif principal est le contenu sexuel explicite.

- Exigences d’exécution cachées, dangereuses ou trompeuses.
  - Exemples : commandes d’installation obfusquées, `curl | sh`, exigences de secrets non déclarées, utilisation non déclarée de clés privées, exécution distante de `npx @latest` sans relisibilité claire, métadonnées trompeuses qui masquent ce dont la Skill a réellement besoin pour s’exécuter.

## Modèles récents que nous n’acceptons explicitement pas

- « Créer des comptes vendeurs furtifs après des bannissements sur une place de marché. »
- « Modifier l’appairage Telegram afin que des utilisateurs non approuvés reçoivent automatiquement des codes d’appairage. »
- « Développer des comptes Reddit/Twitter avec une automatisation indétectable. »
- « Générer des certificats professionnels ou des factures pour un usage arbitraire. »
- « Générer du contenu NSFW avec les contrôles de sécurité désactivés. »
- « Scraper des prospects, enrichir des contacts et lancer de la prospection à froid à grande échelle. »
- « Acheter, publier ou télécharger des données divulguées ou des dumps issus de violations. »
- « Créer en masse des comptes e-mail ou sociaux avec des identités synthétiques ou la résolution de CAPTCHA. »

## Notes pour les réviseurs

- Le contexte compte. Un même sujet peut être légitime dans un cadre défensif restreint ou fondé sur le consentement, et inacceptable lorsqu’il est présenté comme un workflow abusif.
- Nous devons privilégier l’action lorsqu’une Skill est clairement optimisée pour le contournement, la tromperie ou un usage non consensuel.
- Des téléversements répétés dans ces catégories constituent un motif de masquage du contenu et de bannissement du compte.

## Application des règles

- Nous pouvons masquer, supprimer ou supprimer définitivement les Skills en infraction.
- Nous pouvons révoquer des tokens, supprimer de manière réversible le contenu associé et bannir les récidivistes ou les contrevenants graves.
- Nous ne garantissons pas une application avec avertissement préalable en cas d’abus manifeste.
