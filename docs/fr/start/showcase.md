---
description: Real-world OpenClaw projects from the community
read_when:
    - Recherche d’exemples réels d’utilisation d’OpenClaw
    - Mise à jour des coups de projecteur sur les projets communautaires
summary: Projets et intégrations créés par la communauté et propulsés par OpenClaw
title: Vitrine
x-i18n:
    generated_at: "2026-06-27T18:14:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 999f89403c1d022e795c0017e5aa7543a4a021ba98cf601b37ce2835136a86a1
    source_path: start/showcase.md
    workflow: 16
---

Les projets OpenClaw ne sont pas des démos jouets. Des utilisateurs expédient des boucles de revue de PR, des applications mobiles, de la domotique, des systèmes vocaux, des devtools et des workflows gourmands en mémoire depuis les canaux qu’ils utilisent déjà — des builds natifs du chat sur Telegram, WhatsApp, Discord et les terminaux ; de l’automatisation réelle pour les réservations, les achats et le support sans attendre une API ; et des intégrations avec le monde physique pour les imprimantes, aspirateurs, caméras et systèmes domestiques.

<Info>
**Vous voulez être mis en avant ?** Partagez votre projet dans [#self-promotion sur Discord](https://discord.gg/clawd) ou [mentionnez @openclaw sur X](https://x.com/openclaw).
</Info>

## Fraîchement arrivé de Discord

Exemples récents remarquables dans le codage, les devtools, le mobile et la création de produits natifs du chat.

<CardGroup cols={2}>

<Card title="Retour de revue de PR vers Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode termine la modification, ouvre une PR, OpenClaw examine le diff et répond dans Telegram avec des suggestions ainsi qu’un verdict de fusion clair.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Retour de revue de PR OpenClaw livré dans Telegram" />
</Card>

<Card title="Skill de cave à vin en quelques minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

A demandé à "Robby" (@openclaw) un skill local de cave à vin. Il demande un export CSV d’exemple et un chemin de stockage, puis crée et teste le skill (962 bouteilles dans l’exemple).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw créant un skill local de cave à vin à partir d’un CSV" />
</Card>

<Card title="Pilote automatique d’achats Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Plan de repas hebdomadaire, produits habituels, réservation du créneau de livraison, confirmation de la commande. Pas d’API, seulement le contrôle du navigateur.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Automatisation d’achats Tesco via chat" />
</Card>

<Card title="SNAG capture d’écran vers Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Raccourci clavier sur une zone de l’écran, vision Gemini, Markdown instantané dans votre presse-papiers.

  <img src="/assets/showcase/snag.png" alt="Outil SNAG de capture d’écran vers Markdown" />
</Card>

<Card title="Interface utilisateur Agents" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Application de bureau pour gérer les Skills et les commandes entre Agents, Claude, Codex et OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Application Agents UI" />
</Card>

<Card title="Notes vocales Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Enveloppe la synthèse vocale papla.media et envoie les résultats sous forme de notes vocales Telegram (sans lecture automatique agaçante).

  <img src="/assets/showcase/papla-tts.jpg" alt="Sortie de note vocale Telegram depuis la synthèse vocale" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Assistant installé via Homebrew pour lister, inspecter et surveiller les sessions locales OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor sur ClawHub" />
</Card>

<Card title="Contrôle d’imprimante 3D Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Contrôlez et dépannez les imprimantes BambuLab : état, tâches, caméra, AMS, calibration, et plus encore.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI sur ClawHub" />
</Card>

<Card title="Transports de Vienne (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Départs en temps réel, perturbations, état des ascenseurs et itinéraires pour les transports publics de Vienne.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien sur ClawHub" />
</Card>

<Card title="Repas scolaires ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Réservation automatisée de repas scolaires au Royaume-Uni via ParentPay. Utilise les coordonnées de la souris pour cliquer de façon fiable sur les cellules de tableau.
</Card>

<Card title="Téléversement R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Téléversez vers Cloudflare R2/S3 et générez des liens de téléchargement présignés sécurisés. Utile pour les instances OpenClaw distantes.

  <img src="/assets/showcase/r2-upload.png" alt="Skill de téléversement R2 sur ClawHub" />
</Card>

<Card title="Application iOS via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Création d’une application iOS complète avec cartes et enregistrement vocal, déployée sur TestFlight entièrement via un chat Telegram.

  <img src="/assets/showcase/ios-testflight.jpg" alt="Application iOS sur TestFlight" />
</Card>

<Card title="Assistant santé Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Assistant de santé IA personnel intégrant les données de bague Oura avec le calendrier, les rendez-vous et le planning de salle de sport.

  <img src="/assets/showcase/oura-health.png" alt="Assistant santé Oura Ring" />
</Card>

<Card title="Dream Team de Kev (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Plus de 14 agents sous un même Gateway, avec un orchestrateur Opus 4.5 déléguant à des workers Codex. Voir la [note technique](https://github.com/adam91holt/orchestrated-ai-articles) et [Clawdspace](https://github.com/adam91holt/clawdspace) pour le sandboxing d’agents.
</Card>

<Card title="CLI Linear" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI pour Linear qui s’intègre aux workflows agentiques (Claude Code, OpenClaw). Gérez les issues, projets et workflows depuis le terminal.
</Card>

<Card title="CLI Beeper" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Lisez, envoyez et archivez des messages via Beeper Desktop. Utilise l’API MCP locale de Beeper afin que les agents puissent gérer tous vos chats (iMessage, WhatsApp, et plus encore) au même endroit.
</Card>

</CardGroup>

## Automatisation et workflows

Planification, contrôle du navigateur, boucles de support et le côté « fais simplement la tâche pour moi » du produit.

<CardGroup cols={2}>

<Card title="Contrôle de purificateur d’air Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code a découvert et confirmé les commandes du purificateur, puis OpenClaw prend le relais pour gérer la qualité de l’air de la pièce.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Contrôle de purificateur d’air Winix via OpenClaw" />
</Card>

<Card title="Belles prises de vue de caméra du ciel" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Déclenché par une caméra de toit : demandez à OpenClaw de prendre une photo du ciel chaque fois qu’il paraît beau. Il a conçu un skill et pris la photo.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Capture du ciel par caméra de toit réalisée par OpenClaw" />
</Card>

<Card title="Scène visuelle de briefing matinal" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Une invite planifiée génère une image de scène chaque matin (météo, tâches, date, publication ou citation favorite) via une persona OpenClaw.
</Card>

<Card title="Réservation de terrain de padel" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Vérificateur de disponibilité Playtomic avec CLI de réservation. Ne manquez plus jamais un terrain disponible.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="Capture d’écran de padel-cli" />
</Card>

<Card title="Réception comptable" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

Collecte des PDF depuis les e-mails, prépare les documents pour un conseiller fiscal. La comptabilité mensuelle en pilote automatique.
</Card>

<Card title="Mode dev depuis le canapé" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

A reconstruit un site personnel entier via Telegram en regardant Netflix — migration de Notion vers Astro, 18 articles migrés, DNS vers Cloudflare. Aucun ordinateur portable ouvert.
</Card>

<Card title="Agent de recherche d’emploi" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Recherche des offres d’emploi, les compare aux mots-clés du CV et renvoie des opportunités pertinentes avec liens. Créé en 30 minutes avec l’API JSearch.
</Card>

<Card title="Générateur de skill Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw s’est connecté à Jira, puis a généré un nouveau skill à la volée (avant qu’il n’existe sur ClawHub).
</Card>

<Card title="Skill Todoist via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

A automatisé des tâches Todoist et fait générer le skill par OpenClaw directement dans un chat Telegram.
</Card>

<Card title="Analyse TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Se connecte à TradingView via l’automatisation du navigateur, capture des graphiques et effectue une analyse technique à la demande. Pas d’API nécessaire — seulement le contrôle du navigateur.
</Card>

<Card title="Auto-support Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Surveille un canal Slack d’entreprise, répond utilement et transfère les notifications vers Telegram. A corrigé de manière autonome un bug de production dans une application déployée sans qu’on le lui demande.
</Card>

</CardGroup>

## Connaissance et mémoire

Systèmes qui indexent, recherchent, mémorisent et raisonnent sur des connaissances personnelles ou d’équipe.

<CardGroup cols={2}>

<Card title="Apprentissage du chinois xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Moteur d’apprentissage du chinois avec retour sur la prononciation et parcours d’étude via OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Retour de prononciation xuezh" />
</Card>

<Card title="Coffre mémoire WhatsApp" icon="vault">
  **Community** • `memory` `transcription` `indexing`

Ingère des exports WhatsApp complets, transcrit plus de 1 000 notes vocales, recoupe avec les journaux git et produit des rapports Markdown liés.
</Card>

<Card title="Recherche sémantique Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Ajoute la recherche vectorielle aux favoris Karakeep avec Qdrant et des embeddings OpenAI ou Ollama.
</Card>

<Card title="Mémoire Inside-Out-2" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

Gestionnaire de mémoire séparé qui transforme les fichiers de session en souvenirs, puis en croyances, puis en modèle de soi évolutif.
</Card>

</CardGroup>

## Voix et téléphone

Points d’entrée axés sur la voix, passerelles téléphoniques et workflows intensifs en transcription.

<CardGroup cols={2}>

<Card title="Passerelle téléphonique Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Assistant vocal Vapi vers passerelle HTTP OpenClaw. Appels téléphoniques quasi temps réel avec votre agent.
</Card>

<Card title="Transcription OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Transcription audio multilingue via OpenRouter (Gemini, et plus encore). Disponible sur ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="Skill de transcription OpenRouter sur ClawHub" />
</Card>

</CardGroup>

## Infrastructure et déploiement

Packaging, déploiement et intégrations qui rendent OpenClaw plus facile à exécuter et à étendre.

<CardGroup cols={2}>

<Card title="Module complémentaire Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

OpenClaw gateway exécuté sur Home Assistant OS avec prise en charge du tunnel SSH et état persistant.
</Card>

<Card title="Skill Home Assistant" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Contrôlez et automatisez les appareils Home Assistant en langage naturel.

  <img src="/assets/showcase/homeassistant.png" alt="Skill Home Assistant sur ClawHub" />
</Card>

<Card title="Packaging Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Configuration OpenClaw nixifiée, prête à l’emploi, pour des déploiements reproductibles.
</Card>

<Card title="Calendrier CalDAV" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Skill de calendrier utilisant khal et vdirsyncer. Intégration de calendrier auto-hébergé.

  <img src="/assets/showcase/caldav-calendar.png" alt="Skill de calendrier CalDAV sur ClawHub" />
</Card>

</CardGroup>

## Maison et matériel

Le versant physique d’OpenClaw : maisons, capteurs, caméras, aspirateurs et autres appareils.

<CardGroup cols={2}>

<Card title="Automatisation GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Automatisation domestique native Nix avec OpenClaw comme interface, plus des tableaux de bord Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="Tableau de bord Grafana GoHome" />
</Card>

<Card title="Aspirateur Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Contrôlez votre robot aspirateur Roborock par conversation naturelle.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="État de Roborock" />
</Card>

</CardGroup>

## Projets communautaires

Des choses qui sont passées d’un flux de travail unique à des produits ou écosystèmes plus larges.

<CardGroup cols={2}>

<Card title="Marketplace StarSwap" icon="star" href="https://star-swap.com/">
  **Communauté** • `marketplace` `astronomy` `webapp`

Marketplace complète pour le matériel d’astronomie. Conçue avec et autour de l’écosystème OpenClaw.
</Card>

</CardGroup>

## Soumettre votre projet

<Steps>
  <Step title="Partagez-le">
    Publiez dans [#self-promotion sur Discord](https://discord.gg/clawd) ou [tweetez @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Inclure les détails">
    Dites-nous ce qu’il fait, ajoutez un lien vers le dépôt ou la démo, et partagez une capture d’écran si vous en avez une.
  </Step>
  <Step title="Être mis en avant">
    Nous ajouterons les projets remarquables à cette page.
  </Step>
</Steps>

## Connexe

- [Bien démarrer](/fr/start/getting-started)
- [OpenClaw](/fr/start/openclaw)
