---
description: Real-world OpenClaw projects from the community
read_when:
    - Recherche d’exemples réels d’utilisation d’OpenClaw
    - Mise à jour des mises en avant des projets communautaires
summary: Projets et intégrations créés par la communauté et propulsés par OpenClaw
title: Vitrine
x-i18n:
    generated_at: "2026-07-02T08:17:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0530aae85db5414b61c968dcc290178b2b33a540c7f86d556e9bad69cf374fb7
    source_path: start/showcase.md
    workflow: 16
---

Les projets OpenClaw ne sont pas de simples démos jouets. Des personnes expédient des boucles de revue de PR, des applications mobiles, de la domotique, des systèmes vocaux, des devtools et des workflows lourds en mémoire depuis les canaux qu’elles utilisent déjà — des builds natifs du chat sur Telegram, WhatsApp, Discord et des terminaux ; de l’automatisation réelle pour les réservations, les achats et le support sans attendre une API ; et des intégrations avec le monde physique, avec des imprimantes, des aspirateurs, des caméras et des systèmes domestiques.

<Info>
**Vous voulez être mis en avant ?** Partagez votre projet dans [#self-promotion sur Discord](https://discord.gg/clawd) ou [mentionnez @openclaw sur X](https://x.com/openclaw).
</Info>

## Tout frais depuis Discord

Sélections récentes autour du code, des devtools, du mobile et de la création de produits natifs du chat.

<CardGroup cols={2}>

<Card title="Revue de PR vers retour Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode termine le changement, ouvre une PR, OpenClaw passe le diff en revue et répond dans Telegram avec des suggestions et un verdict de fusion clair.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Retour de revue de PR OpenClaw transmis dans Telegram" />
</Card>

<Card title="Skill de cave à vin en quelques minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Demande à "Robby" (@openclaw) un skill de cave à vin local. Il demande un exemple d’export CSV et un chemin de stockage, puis construit et teste le skill (962 bouteilles dans l’exemple).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw créant un skill de cave à vin local à partir d’un CSV" />
</Card>

<Card title="Pilote automatique d’achats Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Plan de repas hebdomadaire, articles habituels, réservation du créneau de livraison, confirmation de la commande. Pas d’API, seulement le contrôle du navigateur.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Automatisation des achats Tesco via chat" />
</Card>

<Card title="SNAG capture d’écran vers Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Raccourci clavier sur une zone de l’écran, vision Gemini, Markdown instantané dans votre presse-papiers.

  <img src="/assets/showcase/snag.png" alt="Outil SNAG de capture d’écran vers markdown" />
</Card>

<Card title="Interface Agents" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Application de bureau pour gérer les skills et les commandes entre Agents, Claude, Codex et OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Application Agents UI" />
</Card>

<Card title="Notes vocales Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Enveloppe le TTS de papla.media et envoie les résultats sous forme de notes vocales Telegram (sans lecture automatique agaçante).

  <img src="/assets/showcase/papla-tts.jpg" alt="Sortie de note vocale Telegram depuis TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Assistant installé via Homebrew pour lister, inspecter et surveiller les sessions OpenAI Codex locales (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor sur ClawHub" />
</Card>

<Card title="Contrôle d’imprimante 3D Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Contrôler et dépanner les imprimantes BambuLab : état, tâches, caméra, AMS, calibration et plus encore.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI sur ClawHub" />
</Card>

<Card title="Transports de Vienne (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Départs en temps réel, perturbations, état des ascenseurs et itinéraires pour les transports publics de Vienne.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien sur ClawHub" />
</Card>

<Card title="Repas scolaires ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Réservation automatisée de repas scolaires au Royaume-Uni via ParentPay. Utilise les coordonnées de la souris pour cliquer de manière fiable sur les cellules de tableau.
</Card>

<Card title="Téléversement R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Téléverser vers Cloudflare R2/S3 et générer des liens de téléchargement pré-signés sécurisés. Utile pour les instances OpenClaw distantes.

  <img src="/assets/showcase/r2-upload.png" alt="Skill de téléversement R2 sur ClawHub" />
</Card>

<Card title="Application iOS via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

A créé une application iOS complète avec cartes et enregistrement vocal, préparée pour la distribution sur l’App Store entièrement via un chat Telegram.
</Card>

<Card title="Assistant santé Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Assistant santé IA personnel intégrant les données de bague Oura avec le calendrier, les rendez-vous et le planning de salle de sport.

  <img src="/assets/showcase/oura-health.png" alt="Assistant santé Oura ring" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Plus de 14 agents sous un même Gateway avec un orchestrateur Opus 4.5 déléguant à des workers Codex. Voir le [compte rendu technique](https://github.com/adam91holt/orchestrated-ai-articles) et [Clawdspace](https://github.com/adam91holt/clawdspace) pour le sandboxing des agents.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI pour Linear qui s’intègre aux workflows agentiques (Claude Code, OpenClaw). Gérez les tickets, les projets et les workflows depuis le terminal.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Lire, envoyer et archiver des messages via Beeper Desktop. Utilise l’API MCP locale de Beeper afin que les agents puissent gérer toutes vos conversations (iMessage, WhatsApp et plus) au même endroit.
</Card>

</CardGroup>

## Automatisation et workflows

Planification, contrôle du navigateur, boucles de support et le côté « fais simplement la tâche pour moi » du produit.

<CardGroup cols={2}>

<Card title="Contrôle du purificateur d’air Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code a découvert et confirmé les commandes du purificateur, puis OpenClaw prend le relais pour gérer la qualité de l’air de la pièce.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Contrôle du purificateur d’air Winix via OpenClaw" />
</Card>

<Card title="Belles prises de vue du ciel par caméra" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Déclenché par une caméra de toit : demandez à OpenClaw de prendre une photo du ciel chaque fois qu’il est beau. Il a conçu un skill et pris la photo.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Capture du ciel par caméra de toit capturée par OpenClaw" />
</Card>

<Card title="Scène visuelle de briefing matinal" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Une invite planifiée génère chaque matin une image de scène (météo, tâches, date, publication ou citation favorite) via un persona OpenClaw.
</Card>

<Card title="Réservation de terrain de padel" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Vérificateur de disponibilités Playtomic plus CLI de réservation. Ne manquez plus jamais un terrain disponible.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="Capture d’écran padel-cli" />
</Card>

<Card title="Collecte comptable" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

Collecte les PDF depuis les e-mails, prépare les documents pour un conseiller fiscal. Comptabilité mensuelle en pilote automatique.
</Card>

<Card title="Mode dev depuis le canapé" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

A reconstruit un site personnel entier via Telegram en regardant Netflix — Notion vers Astro, 18 articles migrés, DNS vers Cloudflare. N’a jamais ouvert d’ordinateur portable.
</Card>

<Card title="Agent de recherche d’emploi" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Recherche des offres d’emploi, les compare aux mots-clés du CV et renvoie les opportunités pertinentes avec des liens. Construit en 30 minutes avec l’API JSearch.
</Card>

<Card title="Constructeur de skill Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw s’est connecté à Jira, puis a généré un nouveau skill à la volée (avant qu’il existe sur ClawHub).
</Card>

<Card title="Skill Todoist via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

A automatisé les tâches Todoist et fait générer le skill par OpenClaw directement dans le chat Telegram.
</Card>

<Card title="Analyse TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Se connecte à TradingView via l’automatisation du navigateur, capture des graphiques et effectue une analyse technique à la demande. Pas besoin d’API — seulement le contrôle du navigateur.
</Card>

<Card title="Support automatique Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Surveille un canal Slack d’entreprise, répond utilement et transmet les notifications à Telegram. A corrigé de manière autonome un bug de production dans une application déployée sans qu’on le demande.
</Card>

</CardGroup>

## Connaissance et mémoire

Systèmes qui indexent, recherchent, mémorisent et raisonnent sur les connaissances personnelles ou d’équipe.

<CardGroup cols={2}>

<Card title="Apprentissage du chinois xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Moteur d’apprentissage du chinois avec retour sur la prononciation et parcours d’étude via OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Retour de prononciation xuezh" />
</Card>

<Card title="Coffre mémoire WhatsApp" icon="vault">
  **Community** • `memory` `transcription` `indexing`

Ingère des exports WhatsApp complets, transcrit plus de 1 000 notes vocales, recoupe avec les journaux git, produit des rapports markdown liés.
</Card>

<Card title="Recherche sémantique Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Ajoute la recherche vectorielle aux favoris Karakeep avec Qdrant et des embeddings OpenAI ou Ollama.
</Card>

<Card title="Mémoire Inside-Out-2" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

Gestionnaire de mémoire séparé qui transforme les fichiers de session en souvenirs, puis en croyances, puis en un modèle de soi évolutif.
</Card>

</CardGroup>

## Voix et téléphone

Points d’entrée centrés sur la parole, passerelles téléphoniques et workflows lourds en transcription.

<CardGroup cols={2}>

<Card title="Passerelle téléphonique Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Assistant vocal Vapi vers passerelle HTTP OpenClaw. Appels téléphoniques quasi en temps réel avec votre agent.
</Card>

<Card title="Transcription OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Transcription audio multilingue via OpenRouter (Gemini et plus). Disponible sur ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="Skill de transcription OpenRouter sur ClawHub" />
</Card>

</CardGroup>

## Infrastructure et déploiement

Packaging, déploiement et intégrations qui rendent OpenClaw plus facile à exécuter et à étendre.

<CardGroup cols={2}>

<Card title="Module complémentaire Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway OpenClaw exécutée sur Home Assistant OS avec prise en charge de tunnel SSH et état persistant.
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

Skill de calendrier utilisant khal et vdirsyncer. Intégration de calendrier auto-hébergée.

  <img src="/assets/showcase/caldav-calendar.png" alt="Skill de calendrier CalDAV sur ClawHub" />
</Card>

</CardGroup>

## Maison et matériel

Le côté physique d’OpenClaw : maisons, capteurs, caméras, aspirateurs et autres appareils.

<CardGroup cols={2}>

<Card title="Automatisation GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Automatisation domestique native Nix avec OpenClaw comme interface, plus des tableaux de bord Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="Tableau de bord Grafana GoHome" />
</Card>

<Card title="Aspirateur Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Contrôlez votre aspirateur robot Roborock par une conversation naturelle.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="État de Roborock" />
</Card>

</CardGroup>

## Projets de la communauté

Ce qui est allé au-delà d’un seul workflow pour devenir des produits ou écosystèmes plus larges.

<CardGroup cols={2}>

<Card title="Place de marché StarSwap" icon="star" href="https://star-swap.com/">
  **Communauté** • `marketplace` `astronomy` `webapp`

Place de marché complète pour le matériel d’astronomie. Construite avec et autour de l’écosystème OpenClaw.
</Card>

</CardGroup>

## Soumettre votre projet

<Steps>
  <Step title="Partagez-le">
    Publiez dans [#self-promotion sur Discord](https://discord.gg/clawd) ou [tweetez @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Incluez des détails">
    Dites-nous ce qu’il fait, ajoutez un lien vers le dépôt ou la démonstration, et partagez une capture d’écran si vous en avez une.
  </Step>
  <Step title="Soyez mis en avant">
    Nous ajouterons les projets remarquables à cette page.
  </Step>
</Steps>

## Liens associés

- [Bien démarrer](/fr/start/getting-started)
- [OpenClaw](/fr/start/openclaw)
