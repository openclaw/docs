---
description: Real-world OpenClaw projects from the community
read_when:
    - Vous cherchez des exemples réels d’utilisation d’OpenClaw
    - Mise à jour des projets communautaires mis en avant
summary: Projets et intégrations créés par la communauté, propulsés par OpenClaw
title: Vitrine
x-i18n:
    generated_at: "2026-04-15T06:57:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 797d0b85c9eca920240c79d870eb9636216714f3eba871c5ebd0f7f40cf7bbf1
    source_path: start/showcase.md
    workflow: 15
---

<!-- markdownlint-disable MD033 -->

# Vitrine

<div className="showcase-hero">
  <p className="showcase-kicker">Conçu dans des chats, des terminaux, des navigateurs et des salons</p>
  <p className="showcase-lead">
    Les projets OpenClaw ne sont pas des démos gadgets. Des gens livrent des boucles de revue de PR, des applications mobiles, de la domotique,
    des systèmes vocaux, des outils de développement et des flux de travail riches en mémoire depuis les canaux qu’ils utilisent déjà.
  </p>
  <div className="showcase-actions">
    <a href="#videos">Voir les démos</a>
    <a href="#fresh-from-discord">Parcourir les projets</a>
    <a href="https://discord.gg/clawd">Partager le vôtre</a>
  </div>
  <div className="showcase-highlights">
    <div className="showcase-highlight">
      <strong>Créations natives du chat</strong>
      <span>Telegram, WhatsApp, Discord, Beeper, chat web et flux de travail orientés terminal.</span>
    </div>
    <div className="showcase-highlight">
      <strong>Automatisation réelle</strong>
      <span>Réservation, achats, support, reporting et contrôle du navigateur sans attendre une API.</span>
    </div>
    <div className="showcase-highlight">
      <strong>Local + monde physique</strong>
      <span>Imprimantes, aspirateurs, caméras, données de santé, systèmes domestiques et bases de connaissances personnelles.</span>
    </div>
  </div>
</div>

<Info>
**Vous voulez être mis en avant ?** Partagez votre projet dans [#self-promotion sur Discord](https://discord.gg/clawd) ou [identifiez @openclaw sur X](https://x.com/openclaw).
</Info>

<div className="showcase-jump-links">
  <a href="#videos">Vidéos</a>
  <a href="#fresh-from-discord">Tout droit venu de Discord</a>
  <a href="#automation-workflows">Automatisation</a>
  <a href="#knowledge-memory">Mémoire</a>
  <a href="#voice-phone">Voix &amp; téléphone</a>
  <a href="#infrastructure-deployment">Infrastructure</a>
  <a href="#home-hardware">Maison &amp; matériel</a>
  <a href="#community-projects">Communauté</a>
  <a href="#submit-your-project">Soumettre un projet</a>
</div>

<h2 id="videos">Vidéos</h2>

<p className="showcase-section-intro">
  Commencez ici si vous voulez passer le plus vite possible de « qu’est-ce que c’est ? » à « d’accord, j’ai compris ».
</p>

<div className="showcase-video-grid">
  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/SaWSPZoPX34"
        title="OpenClaw: L’IA auto-hébergée que Siri aurait dû être (configuration complète)"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Guide complet de configuration</h3>
    <p>VelvetShark, 28 minutes. Installez, configurez, et obtenez un premier assistant fonctionnel de bout en bout.</p>
    <a href="https://www.youtube.com/watch?v=SaWSPZoPX34">Voir sur YouTube</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/mMSKQvlmFuQ"
        title="Vidéo vitrine OpenClaw"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Montage vitrine de la communauté</h3>
    <p>Un aperçu plus rapide de vrais projets, interfaces et flux de travail construits autour d’OpenClaw.</p>
    <a href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">Voir sur YouTube</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/5kkIJNUGFho"
        title="Vitrine communautaire OpenClaw"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Projets dans la nature</h3>
    <p>Des exemples de la communauté, des boucles de développement natives du chat au matériel et à l’automatisation personnelle.</p>
    <a href="https://www.youtube.com/watch?v=5kkIJNUGFho">Voir sur YouTube</a>
  </div>
</div>

<h2 id="fresh-from-discord">Tout droit venu de Discord</h2>

<p className="showcase-section-intro">
  Des réalisations récentes remarquables dans le codage, les outils de développement, le mobile et la création de produits natifs du chat.
</p>

<CardGroup cols={2}>

<Card title="Revue de PR → retour Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode termine le changement → ouvre une PR → OpenClaw passe en revue le diff et répond dans Telegram avec « suggestions mineures » ainsi qu’un verdict clair de fusion (y compris les correctifs critiques à appliquer d’abord).

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Retour de revue de PR OpenClaw envoyé dans Telegram" />
</Card>

<Card title="Skill cave à vin en quelques minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

A demandé à « Robby » (@openclaw) un Skill local de cave à vin. Il demande un export CSV d’exemple + l’emplacement où le stocker, puis crée/teste rapidement le Skill (962 bouteilles dans l’exemple).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw créant un Skill local de cave à vin à partir d’un CSV" />
</Card>

<Card title="Pilote automatique d’achats Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Plan de repas hebdomadaire → produits habituels → réservation d’un créneau de livraison → confirmation de commande. Sans API, uniquement avec le contrôle du navigateur.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Automatisation d’achats Tesco via chat" />
</Card>

<Card title="SNAG capture d’écran vers Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Touche de raccourci sur une zone de l’écran → vision Gemini → Markdown instantané dans votre presse-papiers.

  <img src="/assets/showcase/snag.png" alt="Outil SNAG de capture d’écran vers Markdown" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Application de bureau pour gérer les Skills/commandes entre Agents, Claude, Codex et OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Application Agents UI" />
</Card>

<Card title="Notes vocales Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Communauté** • `voice` `tts` `telegram`

Enveloppe le TTS de papla.media et envoie les résultats sous forme de notes vocales Telegram (sans lecture automatique agaçante).

  <img src="/assets/showcase/papla-tts.jpg" alt="Sortie de note vocale Telegram à partir du TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Assistant installé via Homebrew pour lister/inspecter/surveiller les sessions locales OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor sur ClawHub" />
</Card>

<Card title="Contrôle d’imprimante 3D Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Contrôlez et dépannez les imprimantes BambuLab : état, tâches, caméra, AMS, calibration, etc.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI sur ClawHub" />
</Card>

<Card title="Transports de Vienne (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Départs en temps réel, perturbations, état des ascenseurs et itinéraires pour les transports publics de Vienne.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien sur ClawHub" />
</Card>

<Card title="Repas scolaires ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Réservation automatisée de repas scolaires au Royaume-Uni via ParentPay. Utilise des coordonnées de souris pour cliquer de manière fiable dans les cellules du tableau.
</Card>

<Card title="Téléversement R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Téléversez vers Cloudflare R2/S3 et générez des liens de téléchargement présignés sécurisés. Parfait pour les instances OpenClaw distantes.
</Card>

<Card title="Application iOS via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

A créé une application iOS complète avec cartes et enregistrement vocal, puis l’a déployée sur TestFlight entièrement via chat Telegram.

  <img src="/assets/showcase/ios-testflight.jpg" alt="Application iOS sur TestFlight" />
</Card>

<Card title="Assistant santé Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Assistant IA personnel de santé intégrant les données Oura Ring avec l’agenda, les rendez-vous et le programme de sport.

  <img src="/assets/showcase/oura-health.png" alt="Assistant santé Oura Ring" />
</Card>
<Card title="L’équipe de rêve de Kev (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration` `architecture` `manifesto`

14+ agents sous un même Gateway avec un orchestrateur Opus 4.5 qui délègue à des workers Codex. [Présentation technique](https://github.com/adam91holt/orchestrated-ai-articles) complète couvrant la composition de la Dream Team, la sélection des modèles, le sandboxing, les Webhooks, les Heartbeats et les flux de délégation. [Clawdspace](https://github.com/adam91holt/clawdspace) pour le sandboxing des agents. [Article de blog](https://adams-ai-journey.ghost.io/2026-the-year-of-the-orchestrator/).
</Card>

<Card title="CLI Linear" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli` `issues`

CLI pour Linear qui s’intègre aux flux de travail agentiques (Claude Code, OpenClaw). Gérez les tickets, projets et flux de travail depuis le terminal. Première PR externe fusionnée !
</Card>

<Card title="CLI Beeper" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli` `automation`

Lisez, envoyez et archivez des messages via Beeper Desktop. Utilise l’API MCP locale de Beeper pour que les agents puissent gérer tous vos chats (iMessage, WhatsApp, etc.) en un seul endroit.
</Card>

</CardGroup>

<h2 id="automation-workflows">Automatisation &amp; flux de travail</h2>

<p className="showcase-section-intro">
  Planification, contrôle du navigateur, boucles de support et le côté « fais simplement la tâche à ma place » du produit.
</p>

<CardGroup cols={2}>

<Card title="Contrôle de purificateur d’air Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code a découvert et confirmé les contrôles du purificateur, puis OpenClaw prend le relais pour gérer la qualité de l’air de la pièce.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Contrôle de purificateur d’air Winix via OpenClaw" />
</Card>

<Card title="Belles photos du ciel par caméra" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill` `images`

Déclenché par une caméra de toit : demandez à OpenClaw de prendre une photo du ciel dès qu’il est beau — il a conçu un Skill et pris la photo.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Capture du ciel prise par une caméra de toit avec OpenClaw" />
</Card>

<Card title="Scène de briefing visuel du matin" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `images` `telegram`

Un prompt planifié génère chaque matin une image de « scène » unique (météo, tâches, date, publication/citation favorite) via un persona OpenClaw.
</Card>

<Card title="Réservation de terrain de padel" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`
  
  Vérificateur de disponibilité Playtomic + CLI de réservation. Ne manquez plus jamais un terrain libre.
  
  <img src="/assets/showcase/padel-screenshot.jpg" alt="Capture d’écran de padel-cli" />
</Card>

<Card title="Collecte comptable" icon="file-invoice-dollar">
  **Communauté** • `automation` `email` `pdf`
  
  Récupère des PDF depuis les e-mails, prépare les documents pour le conseiller fiscal. Comptabilité mensuelle en pilote automatique.
</Card>

<Card title="Mode dev depuis le canapé" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `website` `migration` `astro`

A entièrement reconstruit son site personnel via Telegram en regardant Netflix — Notion → Astro, 18 articles migrés, DNS vers Cloudflare. N’a jamais ouvert un ordinateur portable.
</Card>

<Card title="Agent de recherche d’emploi" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Recherche des offres d’emploi, les compare aux mots-clés du CV et renvoie des opportunités pertinentes avec liens. Construit en 30 minutes avec l’API JSearch.
</Card>

<Card title="Générateur de Skill Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `automation` `jira` `skill` `devtools`

OpenClaw s’est connecté à Jira, puis a généré un nouveau Skill à la volée (avant même qu’il n’existe sur ClawHub).
</Card>

<Card title="Skill Todoist via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `automation` `todoist` `skill` `telegram`

A automatisé les tâches Todoist et a fait générer le Skill par OpenClaw directement dans le chat Telegram.
</Card>

<Card title="Analyse TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Se connecte à TradingView via l’automatisation du navigateur, capture les graphiques et effectue une analyse technique à la demande. Pas besoin d’API — juste du contrôle de navigateur.
</Card>

<Card title="Support automatique Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Surveille le canal Slack de l’entreprise, répond utilement et transfère les notifications vers Telegram. A corrigé de façon autonome un bug de production dans une application déployée sans qu’on le lui demande.
</Card>

</CardGroup>

<h2 id="knowledge-memory">Connaissances &amp; mémoire</h2>

<p className="showcase-section-intro">
  Systèmes qui indexent, recherchent, mémorisent et raisonnent sur des connaissances personnelles ou d’équipe.
</p>

<CardGroup cols={2}>

<Card title="Apprentissage du chinois xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`
  
  Moteur d’apprentissage du chinois avec retour sur la prononciation et parcours d’étude via OpenClaw.
  
  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Retour sur la prononciation xuezh" />
</Card>

<Card title="Coffre-fort mémoire WhatsApp" icon="vault">
  **Communauté** • `memory` `transcription` `indexing`
  
  Ingère des exports WhatsApp complets, transcrit plus de 1 000 notes vocales, recoupe avec les journaux git et produit des rapports Markdown liés.
</Card>

<Card title="Recherche sémantique Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`
  
  Ajoute la recherche vectorielle aux marque-pages Karakeep à l’aide de Qdrant + embeddings OpenAI/Ollama.
</Card>

<Card title="Mémoire Inside-Out-2" icon="brain">
  **Communauté** • `memory` `beliefs` `self-model`
  
  Gestionnaire de mémoire séparé qui transforme les fichiers de session en souvenirs → croyances → modèle de soi évolutif.
</Card>

</CardGroup>

<h2 id="voice-phone">Voix &amp; téléphone</h2>

<p className="showcase-section-intro">
  Points d’entrée orientés parole, ponts téléphoniques et flux de travail riches en transcription.
</p>

<CardGroup cols={2}>

<Card title="Pont téléphonique Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`
  
  Assistant vocal Vapi ↔ pont HTTP OpenClaw. Appels téléphoniques quasi temps réel avec votre agent.
</Card>

<Card title="Transcription OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Transcription audio multilingue via OpenRouter (Gemini, etc.). Disponible sur ClawHub.
</Card>

</CardGroup>

<h2 id="infrastructure-deployment">Infrastructure &amp; déploiement</h2>

<p className="showcase-section-intro">
  Packaging, déploiement et intégrations qui rendent OpenClaw plus facile à exécuter et à étendre.
</p>

<CardGroup cols={2}>

<Card title="Module complémentaire Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`
  
  Gateway OpenClaw exécuté sur Home Assistant OS avec prise en charge du tunnel SSH et état persistant.
</Card>

<Card title="Skill Home Assistant" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`
  
  Contrôlez et automatisez les appareils Home Assistant en langage naturel.
</Card>

<Card title="Packaging Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`
  
  Configuration OpenClaw nixifiée, complète et prête à l’emploi pour des déploiements reproductibles.
</Card>

<Card title="Calendrier CalDAV" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`
  
  Skill de calendrier utilisant khal/vdirsyncer. Intégration de calendrier auto-hébergée.
</Card>

</CardGroup>

<h2 id="home-hardware">Maison &amp; matériel</h2>

<p className="showcase-section-intro">
  Le côté monde physique d’OpenClaw : maisons, capteurs, caméras, aspirateurs et autres appareils.
</p>

<CardGroup cols={2}>

<Card title="Automatisation GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`
  
  Automatisation domestique native Nix avec OpenClaw comme interface, plus de superbes tableaux de bord Grafana.
  
  <img src="/assets/showcase/gohome-grafana.png" alt="Tableau de bord Grafana GoHome" />
</Card>

<Card title="Aspirateur Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`
  
  Contrôlez votre aspirateur robot Roborock par conversation naturelle.
  
  <img src="/assets/showcase/roborock-screenshot.jpg" alt="État Roborock" />
</Card>

</CardGroup>

<h2 id="community-projects">Projets communautaires</h2>

<p className="showcase-section-intro">
  Des choses qui ont dépassé un simple flux de travail pour devenir des produits ou des écosystèmes plus larges.
</p>

<CardGroup cols={2}>

<Card title="Marketplace StarSwap" icon="star" href="https://star-swap.com/">
  **Communauté** • `marketplace` `astronomy` `webapp`
  
  Marketplace complète pour le matériel d’astronomie. Construite avec/autour de l’écosystème OpenClaw.
</Card>

</CardGroup>

---

<h2 id="submit-your-project">Soumettre votre projet</h2>

<p className="showcase-section-intro">
  Si vous construisez quelque chose d’intéressant avec OpenClaw, envoyez-le-nous. Des captures d’écran percutantes et des résultats concrets aident.
</p>

Vous avez quelque chose à partager ? Nous serions ravis de le mettre en avant !

<Steps>
  <Step title="Partagez-le">
    Publiez dans [#self-promotion sur Discord](https://discord.gg/clawd) ou [tweet @openclaw](https://x.com/openclaw)
  </Step>
  <Step title="Incluez des détails">
    Dites-nous ce que cela fait, mettez le lien vers le dépôt/la démo, partagez une capture d’écran si vous en avez une
  </Step>
  <Step title="Soyez mis en avant">
    Nous ajouterons les projets remarquables à cette page
  </Step>
</Steps>
