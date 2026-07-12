---
description: Real-world OpenClaw projects from the community
read_when:
    - À la recherche d’exemples concrets d’utilisation d’OpenClaw
    - Mise à jour des projets communautaires à la une
summary: Projets et intégrations créés par la communauté et propulsés par OpenClaw
title: Vitrine
x-i18n:
    generated_at: "2026-07-12T16:00:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 64af6f1da52ebdccff82fe2cdb0f7a5f0cd57627b08ee796369e2933f47fbae4
    source_path: start/showcase.md
    workflow: 16
---

Projets OpenClaw créés par la communauté : boucles de revue de PR, applications mobiles, domotique, systèmes vocaux, outils de développement et workflows de mémoire, conçus nativement pour les conversations sur Telegram, WhatsApp, Discord et dans les terminaux.

<Info>
**Vous souhaitez être mis en avant ?** Partagez votre projet dans [#self-promotion sur Discord](https://discord.gg/clawd) ou [mentionnez @openclaw sur X](https://x.com/openclaw).
</Info>

## Nouveautés de Discord

Projets récents qui se distinguent dans le développement, les outils de développement, le mobile et la création de produits natifs pour les conversations.

<CardGroup cols={2}>

<Card title="Déploiement HTML instantané avec Dropage" icon="cloud-arrow-up" href="https://clawhub.ai/jiantoucn/skills/dropage-deploy">
  **@jiantoucn** • `deploy` `hosting` `skill`

Dites à votre agent « déploie ce HTML » et obtenez une URL publique en environ une seconde. Les pages expirent automatiquement au bout d'une heure — sans serveur, sans configuration et sans inscription.
</Card>

<Card title="Vérificateur d'URL antifraude" icon="shield-halved" href="https://clawhub.ai/phishguard-niki/anti-scam-guard">
  **@phishguard-niki** • `security` `phishing` `skill`

Collez n'importe quelle URL et obtenez un verdict. Plus de 2,5 millions de domaines frauduleux issus de 38 flux (PhishTank, OpenPhish, CERT.PL, entre autres), comparés localement afin que l'historique de navigation ne quitte jamais la machine.
</Card>

<Card title="Skills de raisonnement pour la conception de produits" icon="pen-ruler" href="https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog">
  **@monikazapisekstudio** • `product` `reasoning` `skills`

Un trio pour le travail sur les produits : [Dialogue socratique](https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog) examine une question sous tous les angles avant d'y répondre, [Stratège du modèle de Kano](https://clawhub.ai/monikazapisekstudio/skills/kano-model-strategist) classe les fonctionnalités selon celles qui méritent leur place, et [Sortie d'agent lisible](https://clawhub.ai/monikazapisekstudio/skills/legible-agent-output) reformule la sortie de l'agent en langage clair.
</Card>

<Card title="Courtier de boîtes aux lettres pour les sous-agents" icon="inbox" href="https://clawhub.ai/albzhu/skills/miab-broker">
  **@albzhu** • `multi-agent` `async` `skill`

Évite aux orchestrateurs de rester inactifs pendant que les sous-agents travaillent : un mécanisme de rappel asynchrone dans lequel les résultats arrivent dans une boîte aux lettres au lieu de bloquer l'agent parent.
</Card>

<Card title="Mode léger pour les machines disposant de peu de RAM" icon="feather" href="https://clawhub.ai/skills/lite-mode">
  **@mirajmahmudul** • `performance` `skill`

Maintient OpenClaw utilisable sur les machines dotées de 2-4 Go de mémoire : vérifie la mémoire disponible et réduit les fonctionnalités gourmandes avant que la machine ne commence à utiliser l'espace d'échange. [Code source sur GitHub](https://github.com/mirajmahmudul/openclaw-lite-mode).
</Card>

<Card title="Suivi des coûts de tokenomics" icon="coins" href="https://github.com/ncz-os/tokenomics">
  **@ncz-os** • `devtools` `costs` `tokens`

Outil de suivi du coût des tokens créé par un ingénieur de NVIDIA, avec une prise en charge complète d'OpenClaw : voyez précisément où vont les dépenses de votre agent, par modèle et par session.
</Card>

<Card title="Générateur de diagrammes Excalidraw" icon="shapes" href="https://x.com/swiftlysingh/status/2009684853827281070">
  **@swiftlysingh** • `diagrams` `excalidraw` `devtools`

Décrivez un diagramme dans la conversation et recevez une esquisse Excalidraw générée par programmation.
</Card>

<Card title="Skill d'analyse GA4" icon="chart-column" href="https://x.com/jdrhyne/status/2012028725710192741">
  **@jdrhyne** • `analytics` `ga4` `skill`

A demandé à OpenClaw de créer son propre outil de requête Google Analytics, puis l'a empaqueté et publié sur ClawHub.
</Card>

<Card title="Classement de modèles ClawEval" icon="ranking-star" href="https://github.com/AIgenteur/ClawEval">
  **@AIgenteur** • `evals` `models` `devtools`

Évalue les modèles sur 59 rôles d'agent afin de répondre à la question « quel LLM pour mon GPU ? ». Un outil prisé de la communauté pour choisir des modèles locaux.
</Card>

<Card title="Music Craft" icon="music" href="https://clawhub.ai/luischarro/music-craft">
  **@luischarro** • `music` `generation` `skill`

Génération de chansons indépendante du fournisseur : planifiez le morceau, structurez les paroles et révisez les résultats insuffisants au lieu de vous limiter à une requête unique. Comprend une [variante MiniMax](https://clawhub.ai/luischarro/music-craft-minimax) avec contrôle du BPM, de la tonalité, de la structure et des mashups.
</Card>

<Card title="Des revues de PR aux commentaires sur Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode termine la modification et ouvre une PR ; OpenClaw examine les différences et répond sur Telegram avec des suggestions ainsi qu'un verdict clair concernant la fusion.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Commentaires de revue de PR d'OpenClaw transmis sur Telegram" />
</Card>

<Card title="Skill de cave à vin créé en quelques minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

A demandé à « Robby » (@openclaw) de créer un skill local de gestion de cave à vin. Il demande un exemple d'exportation CSV et un chemin de stockage, puis crée et teste le skill (962 bouteilles dans l'exemple).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw créant un skill local de gestion de cave à vin à partir d'un fichier CSV" />
</Card>

<Card title="Pilotage automatique des courses Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Planification hebdomadaire des repas, produits habituels, réservation du créneau de livraison, confirmation de la commande. Aucune API, uniquement le contrôle du navigateur.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Automatisation des courses Tesco par conversation" />
</Card>

<Card title="Conversion de captures d'écran en Markdown avec SNAG" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Sélectionnez une zone de l'écran avec un raccourci clavier, utilisez la vision de Gemini et obtenez instantanément du Markdown dans votre presse-papiers.

  <img src="/assets/showcase/snag.png" alt="Outil SNAG de conversion de captures d'écran en Markdown" />
</Card>

<Card title="Interface des agents" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Application de bureau permettant de gérer les Skills et les commandes pour Agents, Claude, Codex et OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Application d'interface des agents" />
</Card>

<Card title="Messages vocaux Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Communauté** • `voice` `tts` `telegram`

Encapsule la synthèse vocale de papla.media et envoie les résultats sous forme de messages vocaux Telegram (sans lecture automatique agaçante).

  <img src="/assets/showcase/papla-tts.jpg" alt="Message vocal Telegram généré par synthèse vocale" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Utilitaire installé avec Homebrew permettant de répertorier, d'inspecter et de surveiller les sessions OpenAI Codex locales (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor sur ClawHub" />
</Card>

<Card title="Contrôle d'imprimantes 3D Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Contrôlez et dépannez les imprimantes BambuLab : état, tâches, caméra, AMS, étalonnage, entre autres.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI sur ClawHub" />
</Card>

<Card title="Transports à Vienne (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Départs en temps réel, perturbations, état des ascenseurs et itinéraires pour les transports publics de Vienne.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien sur ClawHub" />
</Card>

<Card title="Repas scolaires ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Réservation automatisée de repas scolaires au Royaume-Uni via ParentPay. Utilise les coordonnées de la souris pour cliquer de manière fiable sur les cellules du tableau.
</Card>

<Card title="Téléversement vers R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Téléversez des fichiers vers Cloudflare R2/S3 et générez des liens de téléchargement pré-signés sécurisés. Utile pour les instances OpenClaw distantes.

  <img src="/assets/showcase/r2-upload.png" alt="Skill de téléversement vers R2 sur ClawHub" />
</Card>

<Card title="Application iOS via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

A créé une application iOS complète avec des cartes et un enregistrement vocal, préparée pour être distribuée sur l'App Store, entièrement au moyen d'une conversation Telegram.
</Card>

<Card title="Assistant santé Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Assistant personnel de santé basé sur l'IA intégrant les données de la bague Oura au calendrier, aux rendez-vous et au programme de la salle de sport.

  <img src="/assets/showcase/oura-health.png" alt="Assistant santé pour la bague Oura" />
</Card>

<Card title="L'équipe de rêve de Kev (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

14+ agents sous un seul Gateway, avec un orchestrateur Opus 4.5 qui délègue les tâches à des agents Codex. Consultez la [présentation technique](https://github.com/adam91holt/orchestrated-ai-articles) et [Clawdspace](https://github.com/adam91holt/clawdspace) pour l'isolation des agents.
</Card>

<Card title="CLI Linear" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI pour Linear qui s'intègre aux workflows agentiques (Claude Code, OpenClaw). Gérez les tickets, les projets et les workflows depuis le terminal.
</Card>

<Card title="CLI Beeper" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Lisez, envoyez et archivez des messages via Beeper Desktop. Utilise l'API MCP locale de Beeper afin que les agents puissent gérer toutes vos conversations (iMessage, WhatsApp, entre autres) depuis un seul endroit.
</Card>

</CardGroup>

## Automatisation et workflows

Planification, contrôle du navigateur, boucles d'assistance et facette « faites simplement la tâche à ma place » du produit.

<CardGroup cols={2}>

<Card title="Contrôle du purificateur d'air Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code a découvert et confirmé les commandes du purificateur, puis OpenClaw prend le relais pour gérer la qualité de l'air de la pièce.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Contrôle du purificateur d'air Winix via OpenClaw" />
</Card>

<Card title="Jolies photos du ciel prises par une caméra" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Déclenché par une caméra installée sur le toit : demandez à OpenClaw de prendre une photo du ciel chaque fois qu'il est joli. Il a conçu un skill et pris la photo.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Photo du ciel prise par une caméra de toit avec OpenClaw" />
</Card>

<Card title="Scène visuelle pour le briefing matinal" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Une requête planifiée génère chaque matin une image représentant une scène (météo, tâches, date, publication ou citation favorite) par l'intermédiaire d'un persona OpenClaw.
</Card>

<Card title="Réservation d'un court de padel" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Outil de vérification des disponibilités Playtomic accompagné d'une CLI de réservation. Ne manquez plus jamais un court disponible.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="Capture d'écran de padel-cli" />
</Card>

<Card title="Collecte des documents comptables" icon="file-invoice-dollar">
  **Communauté** • `automation` `email` `pdf`

Collecte les PDF reçus par e-mail et prépare les documents pour un conseiller fiscal. Comptabilité mensuelle en pilotage automatique.
</Card>

<Card title="Mode développement depuis le canapé" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

A entièrement reconstruit un site personnel via Telegram tout en regardant Netflix — migration de Notion vers Astro, 18 publications migrées, DNS transféré vers Cloudflare. Sans jamais ouvrir un ordinateur portable.
</Card>

<Card title="Agent de recherche d'emploi" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Recherche des offres d'emploi, les compare aux mots-clés d'un CV et renvoie les opportunités pertinentes avec des liens. Créé en 30 minutes à l'aide de l'API JSearch.
</Card>

<Card title="Créateur de skill Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw s’est connecté à Jira, puis a généré une nouvelle Skill à la volée (avant même qu’elle n’existe sur ClawHub).
</Card>

<Card title="Skill Todoist via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Automatisation des tâches Todoist et génération de la Skill par OpenClaw directement dans une conversation Telegram.
</Card>

<Card title="Analyse TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Se connecte à TradingView par automatisation du navigateur, effectue des captures d’écran des graphiques et réalise des analyses techniques à la demande. Aucune API nécessaire : le contrôle du navigateur suffit.
</Card>

<Card title="Négociation automobile (4 200 $ économisés)" icon="car-side" href="https://x.com/astuyve/status/2014147784098681217">
  **@astuyve** • `negotiation` `email` `automation`

OpenClaw a été lancé à l’assaut des concessionnaires automobiles : il a géré les échanges de négociation et obtenu une réduction de 4 200 $.
</Card>

<Card title="Enregistrement de vol en pilote automatique" icon="plane-departure" href="https://x.com/armanddp/status/2008767951340794245">
  **@armanddp** • `travel` `email` `automation`

Trouve le prochain vol dans les e-mails, effectue l’enregistrement en ligne et choisit un siège côté hublot, sans nécessiter l’application de la compagnie aérienne.
</Card>

<Card title="Dépôt d’une demande d’indemnisation" icon="file-signature" href="https://x.com/avi_press/status/2013066316467560521">
  **@avi_press** • `automation` `insurance` `browser`

A déposé une demande d’indemnisation et planifié le rendez-vous de suivi de manière autonome.
</Card>

<Card title="Skill immobilière Idealista" icon="building" href="https://x.com/quifago/status/2012458753786859872">
  **@quifago** • `real-estate` `api` `skill`

CLI pour l’API Idealista destinée aux recherches et aux estimations immobilières, intégrée dans une Skill afin que l’agent puisse rechercher un logement dans la conversation.
</Card>

<Card title="Gestion administrative d’une entreprise de jardinage" icon="seedling" href="https://news.ycombinator.com/item?id=47783940">
  **@mjsweet** • `automation` `email` `invoicing`

Surveille Gmail pour détecter les ordres de travail, analyse les photos de propriétés envoyées via Telegram, rédige des devis PDF LaTeX de plusieurs pages et établit les factures avec Xero.
</Card>

<Card title="Assistance automatique sur Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Surveille un canal Slack d’entreprise, fournit des réponses utiles et transfère les notifications vers Telegram. A corrigé de manière autonome un bug en production dans une application déployée, sans qu’on le lui demande.
</Card>

</CardGroup>

## Connaissances et mémoire

Systèmes qui indexent, recherchent, mémorisent et raisonnent à partir des connaissances personnelles ou d’une équipe.

<CardGroup cols={2}>

<Card title="Apprentissage du chinois avec xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Moteur d’apprentissage du chinois proposant des retours sur la prononciation et des parcours d’étude via OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="retour de xuezh sur la prononciation" />
</Card>

<Card title="Pipeline d’analyse de publications X" icon="hashtag" href="https://x.com/andrewjiang/status/2008388427180630155">
  **@andrewjiang** • `analysis` `x` `pipeline`

A récupéré 4 millions de publications provenant de 100 comptes X majeurs et les a transformées en un pipeline d’analyse interrogeable.
</Card>

<Card title="Résultats d’analyses médicales dans Notion" icon="flask" href="https://x.com/danpeguine/status/2013388700479058068">
  **@danpeguine** • `health` `notion` `organization`

A organisé plusieurs années de résultats d’analyses sanguines dans une base de données Notion structurée.
</Card>

<Card title="Second cerveau Obsidian" icon="book" href="https://notesbylex.com/openclaw-the-missing-piece-for-obsidians-second-brain">
  **@lexandstuff** • `obsidian` `whatsapp` `memory`

Assistant quotidien sur WhatsApp dont toute la mémoire est stockée au format Markdown dans un coffre Obsidian géré par contrôle de version : suivi des calories et des entraînements, listes de tâches et gestion administrative personnelle.
</Card>

<Card title="Bot d’histoire familiale" icon="people-roof" href="https://news.ycombinator.com/item?id=47783940">
  **@brtkwr** • `telegram` `memory` `family`

Participe à une conversation de groupe familial sur Telegram, consigne les histoires de plus de 50 proches et pose des questions de suivi pertinentes, tout en répondant en népalais aux locuteurs natifs.
</Card>

<Card title="Coffre de mémoire WhatsApp" icon="vault">
  **Communauté** • `memory` `transcription` `indexing`

Ingère des exportations WhatsApp complètes, transcrit plus de 1 000 notes vocales, effectue des recoupements avec les journaux Git et produit des rapports Markdown interconnectés.
</Card>

<Card title="Recherche sémantique Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Ajoute une recherche vectorielle aux favoris Karakeep à l’aide de Qdrant et d’embeddings OpenAI ou Ollama.
</Card>

<Card title="Mémoire Inside-Out-2" icon="brain">
  **Communauté** • `memory` `beliefs` `self-model`

Gestionnaire de mémoire distinct qui transforme les fichiers de session en souvenirs, puis en croyances, puis en un modèle de soi évolutif.
</Card>

</CardGroup>

## Voix et téléphone

Points d’entrée centrés sur la parole, passerelles téléphoniques et workflows fortement axés sur la transcription.

<CardGroup cols={2}>

<Card title="Commande vocale en un geste avec Pebble Ring" icon="ring" href="https://x.com/thekitze/status/2014765279650189578">
  **@thekitze** • `voice` `wearable` `hardware`

Un geste sur une Pebble Ring lance une conversation vocale avec OpenClaw, offrant un accès à l’agent depuis un appareil portable.
</Card>

<Card title="Studio multimédia pour créateurs" icon="clapperboard" href="https://x.com/cedric_chee/status/2014608153393168425">
  **@cedric_chee** • `media` `tts` `transcription`

Un studio multimédia complet dans la conversation : synthèse vocale, transcription et automatisation du navigateur connectées à Codex 5.2 et MiniMax.
</Card>

<Card title="Talkie-walkie avec le bouton Action" icon="walkie-talkie" href="https://x.com/i/status/2072766510053888497">
  **@buddyhadry** • `voice` `ios` `mobile`

Bouton Action de l’iPhone connecté à OpenClaw : appuyez, parlez et l’agent vous répond comme avec un talkie-walkie.
</Card>

<Card title="Passerelle téléphonique Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Passerelle entre l’assistant vocal Vapi et OpenClaw via HTTP. Appels téléphoniques avec votre agent presque en temps réel.
</Card>

<Card title="Transcription OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Transcription audio multilingue via OpenRouter (Gemini et d’autres modèles). Disponible sur ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="Skill de transcription OpenRouter sur ClawHub" />
</Card>

</CardGroup>

## Infrastructure et déploiement

Empaquetage, déploiement et intégrations qui facilitent l’exécution et l’extension d’OpenClaw.

<CardGroup cols={2}>

<Card title="Module complémentaire Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway OpenClaw exécuté sur Home Assistant OS avec prise en charge des tunnels SSH et état persistant.
</Card>

<Card title="Skill Home Assistant" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Contrôlez et automatisez les appareils Home Assistant en langage naturel.

  <img src="/assets/showcase/homeassistant.png" alt="Skill Home Assistant sur ClawHub" />
</Card>

<Card title="Gestionnaire de barre des menus macOS" icon="desktop" href="https://x.com/MagiMetal/status/2009424267801485362">
  **@MagiMetal** • `macos` `swift` `ui`

Application Swift native dans la barre des menus, affichant l’état de l’agent et proposant des commandes rapides.
</Card>

<Card title="Empaquetage Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Configuration OpenClaw adaptée à Nix et prête à l’emploi pour des déploiements reproductibles.
</Card>

<Card title="Calendrier CalDAV" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Skill de calendrier utilisant khal et vdirsyncer. Intégration de calendrier auto-hébergée.

  <img src="/assets/showcase/caldav-calendar.png" alt="Skill de calendrier CalDAV sur ClawHub" />
</Card>

</CardGroup>

## Maison et matériel

La dimension physique d’OpenClaw : maisons, capteurs, caméras, aspirateurs et autres appareils.

<CardGroup cols={2}>

<Card title="Skill HomePod créée automatiquement" icon="volume-high" href="https://x.com/localghost/status/2014763987683225685">
  **@localghost** • `homepod` `discovery` `skill`

OpenClaw a trouvé les HomePod sur le réseau local et a créé sa propre Skill pour les contrôler.
</Card>

<Card title="Interface cubique holographique à 35 $" icon="cube" href="https://x.com/andrewjiang/status/2013140793649734032">
  **@andrewjiang** • `hardware` `display` `fun`

Un cube holographique abordable qui sert de visage physique à l’agent sur le bureau.
</Card>

<Card title="Automatisation GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Domotique native pour Nix, avec OpenClaw comme interface et des tableaux de bord Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="tableau de bord Grafana de GoHome" />
</Card>

<Card title="Aspirateur Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Contrôlez votre aspirateur robot Roborock par une conversation naturelle.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="état du Roborock" />
</Card>

</CardGroup>

## Projets communautaires

Projets qui ont dépassé le cadre d’un workflow unique pour devenir des produits ou des écosystèmes plus vastes.

<CardGroup cols={2}>

<Card title="Place de marché StarSwap" icon="star" href="https://star-swap.com/">
  **Communauté** • `marketplace` `astronomy` `webapp`

Place de marché complète pour le matériel d’astronomie. Conçue avec et autour de l’écosystème OpenClaw.
</Card>

<Card title="Protocole de négociation entre agents Clinch" icon="handshake" href="https://clawhub.ai/publicstringapps/clinch">
  **@publicstringapps** • `protocol` `p2p` `skill`

Négociation ouverte d’agent à agent : votre agent négocie des offres, des plannings et des accords de service avec d’autres Nodes, puis signe cryptographiquement le résultat ; il ne vous reste qu’à l’accepter ou le refuser.
</Card>

</CardGroup>

## Proposer votre projet

<Steps>
  <Step title="Partagez-le">
    Publiez-le dans [#self-promotion sur Discord](https://discord.gg/clawd) ou [mentionnez @openclaw sur X](https://x.com/openclaw).
  </Step>
  <Step title="Ajoutez des détails">
    Expliquez-nous ce qu’il fait, ajoutez un lien vers le dépôt ou la démonstration et partagez une capture d’écran si vous en avez une.
  </Step>
  <Step title="Soyez mis en avant">
    Nous ajouterons les projets les plus remarquables à cette page.
  </Step>
</Steps>

## Pages connexes

- [Bien démarrer](/fr/start/getting-started)
- [OpenClaw](/fr/start/openclaw)
- [Présentation complète sur X sur openclaw.ai](https://openclaw.ai/showcase/)
