---
description: Real-world OpenClaw projects from the community
read_when:
    - Auf der Suche nach echten OpenClaw-Nutzungsbeispielen
    - Community-Projekt-Highlights aktualisieren
summary: Von der Community entwickelte Projekte und Integrationen auf Basis von OpenClaw
title: Showcase
x-i18n:
    generated_at: "2026-07-02T08:13:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0530aae85db5414b61c968dcc290178b2b33a540c7f86d556e9bad69cf374fb7
    source_path: start/showcase.md
    workflow: 16
---

OpenClaw-Projekte sind keine Spielzeug-Demos. Menschen liefern PR-Review-Loops, mobile Apps, Heimautomatisierung, Sprachsysteme, Devtools und speicherintensive Workflows über die Kanäle aus, die sie bereits verwenden – chat-native Builds auf Telegram, WhatsApp, Discord und Terminals; echte Automatisierung für Buchungen, Einkäufe und Support, ohne auf eine API zu warten; und Integrationen mit der physischen Welt über Drucker, Staubsauger, Kameras und Haustechnik.

<Info>
**Möchten Sie vorgestellt werden?** Teilen Sie Ihr Projekt in [#self-promotion auf Discord](https://discord.gg/clawd) oder [taggen Sie @openclaw auf X](https://x.com/openclaw).
</Info>

## Frisch von Discord

Aktuelle Highlights aus Coding, Devtools, mobilen Apps und chat-nativem Produktbau.

<CardGroup cols={2}>

<Card title="PR-Review zu Telegram-Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode schließt die Änderung ab, öffnet einen PR, OpenClaw prüft den Diff und antwortet in Telegram mit Vorschlägen sowie einem klaren Merge-Urteil.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw-PR-Review-Feedback in Telegram zugestellt" />
</Card>

<Card title="Weinkeller-Skill in Minuten" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Fragte „Robby“ (@openclaw) nach einem lokalen Weinkeller-Skill. Er fordert einen CSV-Beispielexport und einen Speicherpfad an und baut und testet dann den Skill (962 Flaschen im Beispiel).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw baut einen lokalen Weinkeller-Skill aus CSV" />
</Card>

<Card title="Tesco-Einkaufs-Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Wöchentlicher Essensplan, regelmäßige Artikel, Lieferfenster buchen, Bestellung bestätigen. Keine APIs, nur Browser-Steuerung.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco-Einkaufsautomatisierung per Chat" />
</Card>

<Card title="SNAG Screenshot zu Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Per Hotkey einen Bildschirmbereich auswählen, Gemini Vision nutzen, sofort Markdown in Ihrer Zwischenablage.

  <img src="/assets/showcase/snag.png" alt="SNAG-Screenshot-zu-Markdown-Tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Desktop-App zum Verwalten von Skills und Befehlen über Agents, Claude, Codex und OpenClaw hinweg.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents-UI-App" />
</Card>

<Card title="Telegram-Sprachnachrichten (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Umschließt papla.media TTS und sendet Ergebnisse als Telegram-Sprachnachrichten (kein lästiges Autoplay).

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram-Sprachnachrichtenausgabe aus TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Über Homebrew installierter Helfer zum Auflisten, Prüfen und Beobachten lokaler OpenAI-Codex-Sitzungen (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor auf ClawHub" />
</Card>

<Card title="Bambu-3D-Druckersteuerung" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLab-Drucker steuern und Fehler beheben: Status, Aufträge, Kamera, AMS, Kalibrierung und mehr.

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu-CLI-Skill auf ClawHub" />
</Card>

<Card title="Wiener Verkehr (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Echtzeit-Abfahrten, Störungen, Aufzugstatus und Routing für Wiens öffentlichen Verkehr.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener-Linien-Skill auf ClawHub" />
</Card>

<Card title="ParentPay-Schulessen" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Automatisierte Buchung von Schulessen im Vereinigten Königreich über ParentPay. Verwendet Mauskoordinaten, um zuverlässig Tabellenzellen anzuklicken.
</Card>

<Card title="R2-Upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Upload zu Cloudflare R2/S3 und Generierung sicherer vorsignierter Download-Links. Nützlich für entfernte OpenClaw-Instanzen.

  <img src="/assets/showcase/r2-upload.png" alt="R2-Upload-Skill auf ClawHub" />
</Card>

<Card title="iOS-App über Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

Eine vollständige iOS-App mit Karten und Sprachaufzeichnung gebaut, vollständig über Telegram-Chat für die Veröffentlichung im App Store vorbereitet.
</Card>

<Card title="Oura-Ring-Gesundheitsassistent" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Persönlicher KI-Gesundheitsassistent, der Oura-Ring-Daten mit Kalender, Terminen und Trainingsplan integriert.

  <img src="/assets/showcase/oura-health.png" alt="Oura-Ring-Gesundheitsassistent" />
</Card>

<Card title="Kevs Dream Team (14+ Agenten)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

14+ Agenten unter einem Gateway mit einem Opus-4.5-Orchestrator, der an Codex-Worker delegiert. Siehe den [technischen Bericht](https://github.com/adam91holt/orchestrated-ai-articles) und [Clawdspace](https://github.com/adam91holt/clawdspace) für Agent-Sandboxing.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI für Linear, die sich in agentische Workflows integriert (Claude Code, OpenClaw). Issues, Projekte und Workflows direkt aus dem Terminal verwalten.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Nachrichten über Beeper Desktop lesen, senden und archivieren. Nutzt die lokale MCP-API von Beeper, damit Agenten alle Ihre Chats (iMessage, WhatsApp und mehr) an einem Ort verwalten können.
</Card>

</CardGroup>

## Automatisierung und Workflows

Planung, Browser-Steuerung, Support-Loops und die „Erledigen Sie einfach die Aufgabe für mich“-Seite des Produkts.

<CardGroup cols={2}>

<Card title="Winix-Luftreinigersteuerung" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code hat die Bedienelemente des Luftreinigers erkannt und bestätigt, dann übernimmt OpenClaw die Verwaltung der Raumluftqualität.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix-Luftreinigersteuerung über OpenClaw" />
</Card>

<Card title="Schöne Himmelskamera-Aufnahmen" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Ausgelöst durch eine Dachkamera: Bitten Sie OpenClaw, ein Himmelsfoto aufzunehmen, wann immer es hübsch aussieht. Es entwarf einen Skill und machte die Aufnahme.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Von OpenClaw erfasste Himmelsaufnahme einer Dachkamera" />
</Card>

<Card title="Visuelle Morgenbriefing-Szene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Ein geplanter Prompt erzeugt jeden Morgen ein Szenenbild (Wetter, Aufgaben, Datum, Lieblingsbeitrag oder Zitat) über eine OpenClaw-Persona.
</Card>

<Card title="Padelplatz-Buchung" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic-Verfügbarkeitsprüfung plus Buchungs-CLI. Verpassen Sie nie wieder einen freien Platz.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli-Screenshot" />
</Card>

<Card title="Buchhaltungsannahme" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

Sammelt PDFs aus E-Mails und bereitet Dokumente für eine Steuerberatung vor. Monatliche Buchhaltung auf Autopilot.
</Card>

<Card title="Couch-Potato-Entwicklermodus" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Eine komplette persönliche Website über Telegram neu aufgebaut, während Netflix lief – von Notion zu Astro, 18 Beiträge migriert, DNS zu Cloudflare. Nie einen Laptop geöffnet.
</Card>

<Card title="Jobsuch-Agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Durchsucht Stellenanzeigen, gleicht sie mit CV-Schlüsselwörtern ab und gibt relevante Angebote mit Links zurück. In 30 Minuten mit der JSearch-API gebaut.
</Card>

<Card title="Jira-Skill-Builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw verband sich mit Jira und generierte dann spontan einen neuen Skill (bevor er auf ClawHub existierte).
</Card>

<Card title="Todoist-Skill über Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Automatisierte Todoist-Aufgaben und ließ OpenClaw den Skill direkt im Telegram-Chat generieren.
</Card>

<Card title="TradingView-Analyse" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Meldet sich per Browser-Automatisierung bei TradingView an, erstellt Screenshots von Charts und führt bei Bedarf technische Analysen durch. Keine API erforderlich – nur Browser-Steuerung.
</Card>

<Card title="Slack-Auto-Support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Beobachtet einen Unternehmens-Slack-Kanal, antwortet hilfreich und leitet Benachrichtigungen an Telegram weiter. Hat ohne Aufforderung autonom einen Produktionsfehler in einer bereitgestellten App behoben.
</Card>

</CardGroup>

## Wissen und Gedächtnis

Systeme, die persönliches oder Team-Wissen indexieren, durchsuchen, behalten und darüber schlussfolgern.

<CardGroup cols={2}>

<Card title="xuezh Chinesischlernen" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Chinesisch-Lernengine mit Aussprachefeedback und Lernabläufen über OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh-Aussprachefeedback" />
</Card>

<Card title="WhatsApp-Gedächtnistresor" icon="vault">
  **Community** • `memory` `transcription` `indexing`

Nimmt vollständige WhatsApp-Exporte auf, transkribiert über 1.000 Sprachnachrichten, gleicht sie mit Git-Logs ab und gibt verlinkte Markdown-Berichte aus.
</Card>

<Card title="Semantische Karakeep-Suche" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Fügt Karakeep-Lesezeichen mit Qdrant plus OpenAI- oder Ollama-Embeddings eine Vektorsuche hinzu.
</Card>

<Card title="Inside-Out-2-Gedächtnis" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

Separater Speicherverwalter, der Sitzungsdateien in Erinnerungen, dann in Überzeugungen und dann in ein sich entwickelndes Selbstmodell verwandelt.
</Card>

</CardGroup>

## Sprache und Telefon

Sprachzentrierte Einstiegspunkte, Telefon-Brücken und transkriptionsintensive Workflows.

<CardGroup cols={2}>

<Card title="Clawdia-Telefonbrücke" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Vapi-Sprachassistent-zu-OpenClaw-HTTP-Brücke. Telefonanrufe nahezu in Echtzeit mit Ihrem Agenten.
</Card>

<Card title="OpenRouter-Transkription" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Mehrsprachige Audiotranskription über OpenRouter (Gemini und mehr). Verfügbar auf ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="OpenRouter-Transkriptions-Skill auf ClawHub" />
</Card>

</CardGroup>

## Infrastruktur und Deployment

Paketierung, Deployment und Integrationen, die OpenClaw leichter auszuführen und zu erweitern machen.

<CardGroup cols={2}>

<Card title="Home-Assistant-Add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

OpenClaw-Gateway läuft auf Home Assistant OS mit SSH-Tunnel-Unterstützung und persistentem Zustand.
</Card>

<Card title="Home Assistant-Skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Steuern und automatisieren Sie Home Assistant-Geräte per natürlicher Sprache.

  <img src="/assets/showcase/homeassistant.png" alt="Home Assistant-Skill auf ClawHub" />
</Card>

<Card title="Nix-Paketierung" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Umfassende nixifizierte OpenClaw-Konfiguration für reproduzierbare Deployments.
</Card>

<Card title="CalDAV-Kalender" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Kalender-Skill mit khal und vdirsyncer. Selbst gehostete Kalenderintegration.

  <img src="/assets/showcase/caldav-calendar.png" alt="CalDAV-Kalender-Skill auf ClawHub" />
</Card>

</CardGroup>

## Zuhause und Hardware

Die physische Seite von OpenClaw: Wohnungen, Sensoren, Kameras, Staubsauger und andere Geräte.

<CardGroup cols={2}>

<Card title="GoHome-Automatisierung" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Nix-native Heimautomatisierung mit OpenClaw als Schnittstelle sowie Grafana-Dashboards.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana-Dashboard" />
</Card>

<Card title="Roborock-Staubsauger" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Steuern Sie Ihren Roborock-Saugroboter per natürlicher Konversation.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock-Status" />
</Card>

</CardGroup>

## Community-Projekte

Dinge, die über einen einzelnen Workflow hinaus zu breiteren Produkten oder Ökosystemen gewachsen sind.

<CardGroup cols={2}>

<Card title="StarSwap-Marktplatz" icon="star" href="https://star-swap.com/">
  **Community** • `marketplace` `astronomy` `webapp`

Vollständiger Marktplatz für Astronomieausrüstung. Mit und rund um das OpenClaw-Ökosystem entwickelt.
</Card>

</CardGroup>

## Ihr Projekt einreichen

<Steps>
  <Step title="Teilen">
    Posten Sie in [#self-promotion auf Discord](https://discord.gg/clawd) oder [tweeten Sie @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Details angeben">
    Erzählen Sie uns, was es tut, verlinken Sie das Repository oder die Demo und teilen Sie einen Screenshot, falls Sie einen haben.
  </Step>
  <Step title="Vorgestellt werden">
    Wir nehmen herausragende Projekte auf diese Seite auf.
  </Step>
</Steps>

## Verwandt

- [Erste Schritte](/de/start/getting-started)
- [OpenClaw](/de/start/openclaw)
