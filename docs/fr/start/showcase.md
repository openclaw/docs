---
description: Real-world OpenClaw projects from the community
read_when:
    - À la recherche d’exemples concrets d’utilisation d’OpenClaw
    - Mise à jour des projets communautaires à l’honneur
summary: Projets et intégrations créés par la communauté et propulsés par OpenClaw
title: Vitrine
x-i18n:
    generated_at: "2026-07-12T03:09:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64af6f1da52ebdccff82fe2cdb0f7a5f0cd57627b08ee796369e2933f47fbae4
    source_path: start/showcase.md
    workflow: 16
---

Projets OpenClaw créés par la communauté : boucles de revue de PR, applications mobiles, domotique, systèmes vocaux, outils de développement et flux de travail de mémoire, conçus nativement pour la messagerie sur Telegram, WhatsApp, Discord et dans les terminaux.

<Info>
**Vous souhaitez être mis en avant ?** Partagez votre projet dans [#self-promotion sur Discord](https://discord.gg/clawd) ou [mentionnez @openclaw sur X](https://x.com/openclaw).
</Info>

## Tout juste arrivé de Discord

Les projets récents qui se distinguent dans le développement, les outils de développement, le mobile et la création de produits natifs pour la messagerie.

<CardGroup cols={2}>

<Card title="Dropage instant HTML deploy" icon="cloud-arrow-up" href="https://clawhub.ai/jiantoucn/skills/dropage-deploy">
  **@jiantoucn** • `deploy` `hosting` `skill`

Dites à votre agent « déploie ce HTML » et obtenez une URL publique en environ une seconde. Les pages expirent automatiquement après une heure — aucun serveur, aucune configuration, aucune inscription.
</Card>

<Card title="Anti-scam URL checker" icon="shield-halved" href="https://clawhub.ai/phishguard-niki/anti-scam-guard">
  **@phishguard-niki** • `security` `phishing` `skill`

Collez n’importe quelle URL et obtenez un verdict. Plus de 2,5 millions de domaines frauduleux provenant de 38 sources (PhishTank, OpenPhish, CERT.PL, entre autres) sont comparés localement, de sorte que l’historique de navigation ne quitte jamais la machine.
</Card>

<Card title="Product-design reasoning skills" icon="pen-ruler" href="https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog">
  **@monikazapisekstudio** • `product` `reasoning` `skills`

Un trio pour le travail produit : [Dialogue socratique](https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog) examine une question sous tous les angles avant d’y répondre, [Stratège du modèle de Kano](https://clawhub.ai/monikazapisekstudio/skills/kano-model-strategist) classe les fonctionnalités selon celles qui méritent leur place, et [Sortie d’agent lisible](https://clawhub.ai/monikazapisekstudio/skills/legible-agent-output) reformule la sortie de l’agent en langage clair.
</Card>

<Card title="Mailbox broker for sub-agents" icon="inbox" href="https://clawhub.ai/albzhu/skills/miab-broker">
  **@albzhu** • `multi-agent` `async` `skill`

Empêche les orchestrateurs de rester inactifs pendant que les sous-agents travaillent : un mécanisme de rappel asynchrone dans lequel les résultats arrivent dans une boîte aux lettres au lieu de bloquer l’agent parent.
</Card>

<Card title="lite-mode for low-RAM machines" icon="feather" href="https://clawhub.ai/skills/lite-mode">
  **@mirajmahmudul** • `performance` `skill`

Maintient OpenClaw utilisable sur les machines dotées de 2 à 4 Go de mémoire : vérifie la mémoire disponible et allège les fonctionnalités gourmandes avant que la machine commence à utiliser l’espace d’échange. [Code source sur GitHub](https://github.com/mirajmahmudul/openclaw-lite-mode).
</Card>

<Card title="tokenomics cost tracker" icon="coins" href="https://github.com/ncz-os/tokenomics">
  **@ncz-os** • `devtools` `costs` `tokens`

Outil de suivi du coût des jetons créé par un ingénieur de NVIDIA, avec une prise en charge native d’OpenClaw : voyez précisément où vont les dépenses de votre agent, par modèle et par session.
</Card>

<Card title="Excalidraw diagram generator" icon="shapes" href="https://x.com/swiftlysingh/status/2009684853827281070">
  **@swiftlysingh** • `diagrams` `excalidraw` `devtools`

Décrivez un diagramme dans la conversation et obtenez en retour une esquisse Excalidraw générée par programmation.
</Card>

<Card title="GA4 analytics skill" icon="chart-column" href="https://x.com/jdrhyne/status/2012028725710192741">
  **@jdrhyne** • `analytics` `ga4` `skill`

A demandé à OpenClaw de créer son propre outil de requête Google Analytics, puis l’a empaqueté et publié sur ClawHub.
</Card>

<Card title="ClawEval model rankings" icon="ranking-star" href="https://github.com/AIgenteur/ClawEval">
  **@AIgenteur** • `evals` `models` `devtools`

Évalue les modèles sur 59 rôles d’agent afin de répondre à la question « quel LLM choisir pour mon GPU ? ». Un favori de la communauté pour sélectionner des modèles locaux.
</Card>

<Card title="Music Craft" icon="music" href="https://clawhub.ai/luischarro/music-craft">
  **@luischarro** • `music` `generation` `skill`

Génération de chansons indépendante du fournisseur : planifiez le morceau, structurez les paroles et retravaillez les résultats incomplets plutôt que de vous limiter à une seule requête. Comprend une [variante MiniMax](https://clawhub.ai/luischarro/music-craft-minimax) permettant de contrôler le BPM, la tonalité, la structure et les mélanges.
</Card>

<Card title="PR Review to Telegram Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode termine la modification et ouvre une PR ; OpenClaw examine les différences et répond dans Telegram avec des suggestions ainsi qu’un verdict clair sur la fusion.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR review feedback delivered in Telegram" />
</Card>

<Card title="Wine Cellar Skill in Minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

A demandé à « Robby » (@openclaw) un Skill local de gestion de cave à vin. Il demande un exemple d’export CSV et un chemin de stockage, puis crée et teste le Skill (962 bouteilles dans l’exemple).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw building a local wine cellar skill from CSV" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Planifier les repas de la semaine, ajouter les produits habituels, réserver un créneau de livraison et confirmer la commande. Aucune API, uniquement le contrôle du navigateur.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco shop automation via chat" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Sélectionnez une zone de l’écran avec un raccourci clavier, utilisez la vision de Gemini et obtenez instantanément du Markdown dans votre presse-papiers.

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Application de bureau permettant de gérer les Skills et les commandes dans Agents, Claude, Codex et OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI app" />
</Card>

<Card title="Telegram voice notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Communauté** • `voice` `tts` `telegram`

Encapsule la synthèse vocale de papla.media et envoie les résultats sous forme de messages vocaux Telegram, sans lecture automatique gênante.

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram voice note output from TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Utilitaire installé avec Homebrew permettant de répertorier, d’inspecter et de surveiller les sessions OpenAI Codex locales (CLI et VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor on ClawHub" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Contrôlez et dépannez les imprimantes BambuLab : état, tâches, caméra, AMS, étalonnage et plus encore.

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI skill on ClawHub" />
</Card>

<Card title="Vienna transport (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Départs en temps réel, perturbations, état des ascenseurs et calcul d’itinéraires pour les transports publics de Vienne.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill on ClawHub" />
</Card>

<Card title="ParentPay school meals" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Réservation automatisée des repas scolaires au Royaume-Uni via ParentPay. Utilise les coordonnées de la souris pour cliquer de manière fiable sur les cellules des tableaux.
</Card>

<Card title="R2 upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Téléversez des fichiers vers Cloudflare R2/S3 et générez des liens de téléchargement présignés et sécurisés. Utile pour les instances OpenClaw distantes.

  <img src="/assets/showcase/r2-upload.png" alt="R2 upload skill on ClawHub" />
</Card>

<Card title="iOS app via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

A créé une application iOS complète avec des cartes et un enregistrement vocal, entièrement préparée pour une distribution sur l’App Store au moyen d’une conversation Telegram.
</Card>

<Card title="Oura Ring health assistant" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Assistant de santé personnel fondé sur l’IA, qui intègre les données de la bague Oura au calendrier, aux rendez-vous et au programme de la salle de sport.

  <img src="/assets/showcase/oura-health.png" alt="Oura ring health assistant" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Plus de 14 agents sous un même Gateway, avec un orchestrateur Opus 4.5 qui délègue le travail à des agents Codex. Consultez la [présentation technique](https://github.com/adam91holt/orchestrated-ai-articles) et [Clawdspace](https://github.com/adam91holt/clawdspace) pour l’isolation des agents.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI pour Linear qui s’intègre aux flux de travail agentiques (Claude Code, OpenClaw). Gérez les tickets, les projets et les flux de travail depuis le terminal.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Lisez, envoyez et archivez des messages via Beeper Desktop. Utilise l’API MCP locale de Beeper afin que les agents puissent gérer toutes vos conversations (iMessage, WhatsApp et bien plus) au même endroit.
</Card>

</CardGroup>

## Automatisation et flux de travail

Planification, contrôle du navigateur, boucles d’assistance et dimension « effectuez simplement la tâche à ma place » du produit.

<CardGroup cols={2}>

<Card title="Winix air purifier control" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code a découvert et confirmé les commandes du purificateur, puis OpenClaw prend le relais pour gérer la qualité de l’air de la pièce.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix air purifier control via OpenClaw" />
</Card>

<Card title="Pretty sky camera shots" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Déclenché par une caméra installée sur le toit : demandez à OpenClaw de prendre une photo du ciel chaque fois qu’il est beau. Il a conçu un Skill et pris la photo.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Roof camera sky snapshot captured by OpenClaw" />
</Card>

<Card title="Visual morning briefing scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Une requête planifiée génère chaque matin l’image d’une scène (météo, tâches, date, publication ou citation favorite) par l’intermédiaire d’un personnage OpenClaw.
</Card>

<Card title="Padel court booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Outil de vérification des disponibilités Playtomic accompagné d’une CLI de réservation. Ne manquez plus jamais un terrain disponible.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli screenshot" />
</Card>

<Card title="Accounting intake" icon="file-invoice-dollar">
  **Communauté** • `automation` `email` `pdf`

Collecte les PDF reçus par e-mail et prépare les documents pour un conseiller fiscal. La comptabilité mensuelle en pilotage automatique.
</Card>

<Card title="Couch potato dev mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

A entièrement reconstruit un site personnel via Telegram tout en regardant Netflix — migration de Notion vers Astro, 18 publications transférées et DNS déplacé vers Cloudflare. Sans jamais ouvrir un ordinateur portable.
</Card>

<Card title="Job search agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Recherche des offres d’emploi, les compare aux mots-clés d’un CV et renvoie les opportunités pertinentes avec leurs liens. Créé en 30 minutes avec l’API JSearch.
</Card>

<Card title="Jira skill builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw s’est connecté à Jira, puis a généré une nouvelle compétence à la volée (avant même qu’elle n’existe sur ClawHub).
</Card>

<Card title="Todoist skill via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

A automatisé les tâches Todoist et demandé à OpenClaw de générer la compétence directement dans une conversation Telegram.
</Card>

<Card title="TradingView analysis" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Se connecte à TradingView par automatisation du navigateur, réalise des captures d’écran des graphiques et effectue une analyse technique à la demande. Aucune API nécessaire : il suffit de contrôler le navigateur.
</Card>

<Card title="Car negotiation ($4,200 saved)" icon="car-side" href="https://x.com/astuyve/status/2014147784098681217">
  **@astuyve** • `negotiation` `email` `automation`

A laissé OpenClaw négocier librement avec des concessionnaires automobiles : il a géré les échanges et obtenu une réduction de 4 200 $ sur le prix.
</Card>

<Card title="Flight check-in autopilot" icon="plane-departure" href="https://x.com/armanddp/status/2008767951340794245">
  **@armanddp** • `travel` `email` `automation`

Trouve le prochain vol dans les e-mails, effectue l’enregistrement en ligne et choisit un siège côté hublot, sans nécessiter l’application de la compagnie aérienne.
</Card>

<Card title="Insurance claim filing" icon="file-signature" href="https://x.com/avi_press/status/2013066316467560521">
  **@avi_press** • `automation` `insurance` `browser`

A déposé une demande d’indemnisation auprès d’une assurance et planifié le rendez-vous de suivi de manière autonome.
</Card>

<Card title="Idealista real estate skill" icon="building" href="https://x.com/quifago/status/2012458753786859872">
  **@quifago** • `real-estate` `api` `skill`

CLI pour l’API Idealista permettant de rechercher et d’évaluer des biens immobiliers, encapsulée sous forme de compétence afin que l’agent puisse chercher un logement dans la conversation.
</Card>

<Card title="Gardening business back office" icon="seedling" href="https://news.ycombinator.com/item?id=47783940">
  **@mjsweet** • `automation` `email` `invoicing`

Surveille Gmail pour détecter les ordres de travail, analyse les photos de propriétés envoyées via Telegram, rédige des devis PDF de plusieurs pages en LaTeX et établit les factures dans Xero.
</Card>

<Card title="Slack auto-support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Surveille un canal Slack d’entreprise, fournit des réponses utiles et transfère les notifications vers Telegram. A corrigé de manière autonome un bug de production dans une application déployée sans qu’on le lui demande.
</Card>

</CardGroup>

## Connaissances et mémoire

Systèmes qui indexent, recherchent, mémorisent et raisonnent à partir des connaissances personnelles ou collectives.

<CardGroup cols={2}>

<Card title="xuezh Chinese learning" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Moteur d’apprentissage du chinois proposant des retours sur la prononciation et des parcours d’étude via OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh pronunciation feedback" />
</Card>

<Card title="X post analysis pipeline" icon="hashtag" href="https://x.com/andrewjiang/status/2008388427180630155">
  **@andrewjiang** • `analysis` `x` `pipeline`

A extrait 4 millions de publications issues de 100 comptes X majeurs et les a transformées en un pipeline d’analyse interrogeable.
</Card>

<Card title="Lab results to Notion" icon="flask" href="https://x.com/danpeguine/status/2013388700479058068">
  **@danpeguine** • `health` `notion` `organization`

A organisé plusieurs années de résultats d’analyses sanguines dans une base de données Notion structurée.
</Card>

<Card title="Obsidian second brain" icon="book" href="https://notesbylex.com/openclaw-the-missing-piece-for-obsidians-second-brain">
  **@lexandstuff** • `obsidian` `whatsapp` `memory`

Assistant utilisé au quotidien sur WhatsApp, dont toute la mémoire est stockée au format Markdown dans un coffre Obsidian sous gestion de versions : suivi des calories et des entraînements, listes de tâches et gestion administrative personnelle.
</Card>

<Card title="Family history bot" icon="people-roof" href="https://news.ycombinator.com/item?id=47783940">
  **@brtkwr** • `telegram` `memory` `family`

Participe à une conversation de groupe familiale sur Telegram, consigne les récits de plus de 50 proches et pose des questions de suivi pertinentes, tout en répondant en népalais aux locuteurs natifs.
</Card>

<Card title="WhatsApp memory vault" icon="vault">
  **Communauté** • `memory` `transcription` `indexing`

Ingère des exportations WhatsApp complètes, transcrit plus de 1 000 notes vocales, recoupe les informations avec les journaux Git et produit des rapports Markdown reliés entre eux.
</Card>

<Card title="Karakeep semantic search" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Ajoute une recherche vectorielle aux favoris Karakeep à l’aide de Qdrant et de plongements vectoriels OpenAI ou Ollama.
</Card>

<Card title="Inside-Out-2 memory" icon="brain">
  **Communauté** • `memory` `beliefs` `self-model`

Gestionnaire de mémoire distinct qui transforme les fichiers de session en souvenirs, puis en convictions, et enfin en un modèle de soi évolutif.
</Card>

</CardGroup>

## Voix et téléphone

Points d’entrée axés sur la parole, passerelles téléphoniques et workflows à forte composante de transcription.

<CardGroup cols={2}>

<Card title="Pebble Ring one-tap voice" icon="ring" href="https://x.com/thekitze/status/2014765279650189578">
  **@thekitze** • `voice` `wearable` `hardware`

Une simple pression sur une Pebble Ring lance une conversation vocale avec OpenClaw, permettant d’accéder à l’agent depuis un appareil portable.
</Card>

<Card title="Creator media studio" icon="clapperboard" href="https://x.com/cedric_chee/status/2014608153393168425">
  **@cedric_chee** • `media` `tts` `transcription`

Un studio multimédia complet dans la conversation : synthèse vocale, transcription et automatisation du navigateur connectées à Codex 5.2 et MiniMax.
</Card>

<Card title="Action Button walkie-talkie" icon="walkie-talkie" href="https://x.com/i/status/2072766510053888497">
  **@buddyhadry** • `voice` `ios` `mobile`

Le bouton Action de l’iPhone est relié à OpenClaw : appuyez, parlez et l’agent vous répond comme avec un talkie-walkie.
</Card>

<Card title="Clawdia phone bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Passerelle entre l’assistant vocal Vapi et OpenClaw via HTTP. Permet des appels téléphoniques avec votre agent en quasi-temps réel.
</Card>

<Card title="OpenRouter transcription" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Transcription audio multilingue via OpenRouter (Gemini et d’autres modèles). Disponible sur ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="OpenRouter transcription skill on ClawHub" />
</Card>

</CardGroup>

## Infrastructure et déploiement

Solutions de mise en paquet, de déploiement et d’intégration qui facilitent l’exécution et l’extension d’OpenClaw.

<CardGroup cols={2}>

<Card title="Home Assistant add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway OpenClaw exécuté sur Home Assistant OS avec prise en charge des tunnels SSH et état persistant.
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Contrôlez et automatisez les appareils Home Assistant en langage naturel.

  <img src="/assets/showcase/homeassistant.png" alt="Home Assistant skill on ClawHub" />
</Card>

<Card title="macOS menu bar manager" icon="desktop" href="https://x.com/MagiMetal/status/2009424267801485362">
  **@MagiMetal** • `macos` `swift` `ui`

Application Swift native pour la barre des menus, affichant l’état de l’agent et proposant des commandes rapides.
</Card>

<Card title="Nix packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Configuration OpenClaw complète et adaptée à Nix pour des déploiements reproductibles.
</Card>

<Card title="CalDAV calendar" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Compétence de calendrier utilisant khal et vdirsyncer. Intégration de calendrier auto-hébergée.

  <img src="/assets/showcase/caldav-calendar.png" alt="CalDAV calendar skill on ClawHub" />
</Card>

</CardGroup>

## Maison et matériel

La dimension physique d’OpenClaw : logements, capteurs, caméras, aspirateurs et autres appareils.

<CardGroup cols={2}>

<Card title="Self-built HomePod skill" icon="volume-high" href="https://x.com/localghost/status/2014763987683225685">
  **@localghost** • `homepod` `discovery` `skill`

OpenClaw a détecté les HomePod sur le réseau local et s’est créé une compétence pour les contrôler.
</Card>

<Card title="$35 holo cube interface" icon="cube" href="https://x.com/andrewjiang/status/2013140793649734032">
  **@andrewjiang** • `hardware` `display` `fun`

Un cube holographique bon marché servant de visage physique à l’agent sur le bureau.
</Card>

<Card title="GoHome automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Domotique native pour Nix utilisant OpenClaw comme interface, avec des tableaux de bord Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana dashboard" />
</Card>

<Card title="Roborock vacuum" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Contrôlez votre aspirateur robot Roborock par une conversation naturelle.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock status" />
</Card>

</CardGroup>

## Projets communautaires

Projets qui ont dépassé le cadre d’un workflow unique pour devenir des produits ou des écosystèmes plus vastes.

<CardGroup cols={2}>

<Card title="StarSwap marketplace" icon="star" href="https://star-swap.com/">
  **Communauté** • `marketplace` `astronomy` `webapp`

Place de marché complète pour le matériel d’astronomie. Conçue avec et autour de l’écosystème OpenClaw.
</Card>

<Card title="Clinch agent negotiation protocol" icon="handshake" href="https://clawhub.ai/publicstringapps/clinch">
  **@publicstringapps** • `protocol` `p2p` `skill`

Négociation ouverte d’agent à agent : votre agent négocie des offres, des calendriers et des contrats de service avec d’autres nœuds, puis signe cryptographiquement le résultat ; il ne vous reste qu’à l’approuver ou le refuser.
</Card>

</CardGroup>

## Proposer votre projet

<Steps>
  <Step title="Share it">
    Publiez-le dans [#self-promotion sur Discord](https://discord.gg/clawd) ou [mentionnez @openclaw sur X](https://x.com/openclaw).
  </Step>
  <Step title="Include details">
    Expliquez-nous ce qu’il fait, ajoutez un lien vers le dépôt ou la démonstration et partagez une capture d’écran si vous en avez une.
  </Step>
  <Step title="Get featured">
    Nous ajouterons les projets remarquables à cette page.
  </Step>
</Steps>

## Voir aussi

- [Bien démarrer](/fr/start/getting-started)
- [OpenClaw](/fr/start/openclaw)
- [Présentation complète sur X sur openclaw.ai](https://openclaw.ai/showcase/)
