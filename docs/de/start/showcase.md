---
description: Real-world OpenClaw projects from the community
read_when:
    - Suche nach echten OpenClaw-Nutzungsbeispielen
    - Community-Projekthighlights werden aktualisiert
summary: Community-Projekte und Integrationen, die von OpenClaw unterstützt werden
title: Präsentation
x-i18n:
    generated_at: "2026-06-27T18:14:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 999f89403c1d022e795c0017e5aa7543a4a021ba98cf601b37ce2835136a86a1
    source_path: start/showcase.md
    workflow: 16
---

OpenClaw-Projekte sind keine Spielzeug-Demos. Menschen liefern PR-Review-Schleifen, mobile Apps, Hausautomatisierung, Sprachsysteme, Devtools und speicherintensive Workflows über die Kanäle aus, die sie bereits verwenden — chat-native Builds auf Telegram, WhatsApp, Discord und Terminals; echte Automatisierung für Buchungen, Einkäufe und Support, ohne auf eine API zu warten; und Integrationen in die physische Welt mit Druckern, Staubsaugern, Kameras und Haussystemen.

<Info>
**Möchten Sie vorgestellt werden?** Teilen Sie Ihr Projekt in [#self-promotion auf Discord](https://discord.gg/clawd) oder [taggen Sie @openclaw auf X](https://x.com/openclaw).
</Info>

## Frisch aus Discord

Aktuelle Highlights aus Coding, Devtools, Mobile und chat-nativem Produktbau.

<CardGroup cols={2}>

<Card title="PR-Review mit Telegram-Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode schließt die Änderung ab, öffnet einen PR, OpenClaw prüft das Diff und antwortet in Telegram mit Vorschlägen sowie einem klaren Merge-Urteil.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw-PR-Review-Feedback in Telegram zugestellt" />
</Card>

<Card title="Weinkeller-Skill in Minuten" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Fragte „Robby“ (@openclaw) nach einem lokalen Weinkeller-Skill. Er fordert einen Beispiel-CSV-Export und einen Speicherpfad an und erstellt und testet dann den Skill (962 Flaschen im Beispiel).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw erstellt einen lokalen Weinkeller-Skill aus CSV" />
</Card>

<Card title="Tesco-Einkaufs-Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Wöchentlicher Essensplan, Standardartikel, Lieferzeitfenster buchen, Bestellung bestätigen. Keine APIs, nur Browser-Steuerung.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco-Einkaufsautomatisierung per Chat" />
</Card>

<Card title="SNAG Screenshot-zu-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Per Hotkey eine Bildschirmregion erfassen, Gemini Vision, sofortiges Markdown in Ihrer Zwischenablage.

  <img src="/assets/showcase/snag.png" alt="SNAG Screenshot-zu-Markdown-Tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Desktop-App zum Verwalten von Skills und Befehlen über Agents, Claude, Codex und OpenClaw hinweg.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI App" />
</Card>

<Card title="Telegram-Sprachnachrichten (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Umschließt papla.media TTS und sendet Ergebnisse als Telegram-Sprachnachrichten (keine störende automatische Wiedergabe).

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram-Sprachnachrichtenausgabe aus TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Über Homebrew installierter Helfer zum Auflisten, Prüfen und Beobachten lokaler OpenAI-Codex-Sitzungen (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor auf ClawHub" />
</Card>

<Card title="Bambu-3D-Druckersteuerung" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLab-Drucker steuern und Fehler beheben: Status, Jobs, Kamera, AMS, Kalibrierung und mehr.

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI Skill auf ClawHub" />
</Card>

<Card title="Wiener Verkehr (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Echtzeit-Abfahrten, Störungen, Aufzugsstatus und Routenplanung für den öffentlichen Verkehr in Wien.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien Skill auf ClawHub" />
</Card>

<Card title="ParentPay-Schulessen" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Automatisierte Buchung von Schulessen im Vereinigten Königreich über ParentPay. Verwendet Mauskoordinaten für zuverlässige Klicks auf Tabellenzellen.
</Card>

<Card title="R2-Upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Upload zu Cloudflare R2/S3 und Generierung sicherer vorsignierter Download-Links. Nützlich für Remote-OpenClaw-Instanzen.

  <img src="/assets/showcase/r2-upload.png" alt="R2-Upload-Skill auf ClawHub" />
</Card>

<Card title="iOS-App über Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Eine vollständige iOS-App mit Karten und Sprachaufnahme erstellt und vollständig per Telegram-Chat in TestFlight bereitgestellt.

  <img src="/assets/showcase/ios-testflight.jpg" alt="iOS-App auf TestFlight" />
</Card>

<Card title="Oura-Ring-Gesundheitsassistent" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Persönlicher KI-Gesundheitsassistent, der Oura-Ring-Daten mit Kalender, Terminen und Fitnessstudio-Zeitplan integriert.

  <img src="/assets/showcase/oura-health.png" alt="Oura-Ring-Gesundheitsassistent" />
</Card>

<Card title="Kevs Dream Team (14+ Agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

14+ Agents unter einem Gateway mit einem Opus-4.5-Orchestrator, der an Codex-Worker delegiert. Siehe den [technischen Bericht](https://github.com/adam91holt/orchestrated-ai-articles) und [Clawdspace](https://github.com/adam91holt/clawdspace) für Agent-Sandboxing.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI für Linear, die sich in agentische Workflows integriert (Claude Code, OpenClaw). Verwalten Sie Issues, Projekte und Workflows vom Terminal aus.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Nachrichten über Beeper Desktop lesen, senden und archivieren. Verwendet die lokale MCP-API von Beeper, damit Agents alle Ihre Chats (iMessage, WhatsApp und mehr) an einem Ort verwalten können.
</Card>

</CardGroup>

## Automatisierung und Workflows

Planung, Browser-Steuerung, Support-Schleifen und die „erledige die Aufgabe einfach für mich“-Seite des Produkts.

<CardGroup cols={2}>

<Card title="Winix-Luftreinigersteuerung" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code erkannte und bestätigte die Luftreinigersteuerungen, dann übernimmt OpenClaw die Verwaltung der Raumluftqualität.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix-Luftreinigersteuerung über OpenClaw" />
</Card>

<Card title="Schöne Himmelskamera-Aufnahmen" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Ausgelöst durch eine Dachkamera: Bitten Sie OpenClaw, ein Himmelsfoto aufzunehmen, wann immer es schön aussieht. Es entwarf einen Skill und machte die Aufnahme.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Von OpenClaw erfasste Himmelsaufnahme einer Dachkamera" />
</Card>

<Card title="Visuelle Morgenbriefing-Szene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Ein geplanter Prompt erzeugt jeden Morgen ein Szenenbild (Wetter, Aufgaben, Datum, Lieblingsbeitrag oder Zitat) über eine OpenClaw-Persona.
</Card>

<Card title="Padel-Platzbuchung" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic-Verfügbarkeitsprüfung plus Buchungs-CLI. Verpassen Sie nie wieder einen freien Platz.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli-Screenshot" />
</Card>

<Card title="Buchhaltungsannahme" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

Sammelt PDFs aus E-Mails und bereitet Dokumente für eine Steuerberatung vor. Monatliche Buchhaltung auf Autopilot.
</Card>

<Card title="Couch-Potato-Dev-Modus" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Eine komplette persönliche Website per Telegram neu aufgebaut, während Netflix lief — Notion zu Astro, 18 Beiträge migriert, DNS zu Cloudflare. Nie einen Laptop geöffnet.
</Card>

<Card title="Jobsuch-Agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Durchsucht Stellenangebote, gleicht sie mit CV-Schlüsselwörtern ab und gibt relevante Chancen mit Links zurück. In 30 Minuten mit der JSearch API gebaut.
</Card>

<Card title="Jira-Skill-Builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw stellte eine Verbindung zu Jira her und generierte dann spontan einen neuen Skill (bevor er auf ClawHub existierte).
</Card>

<Card title="Todoist-Skill über Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Automatisierte Todoist-Aufgaben und ließ OpenClaw den Skill direkt im Telegram-Chat generieren.
</Card>

<Card title="TradingView-Analyse" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Meldet sich per Browser-Automatisierung bei TradingView an, erstellt Screenshots von Charts und führt auf Abruf technische Analysen durch. Keine API erforderlich — nur Browser-Steuerung.
</Card>

<Card title="Slack-Auto-Support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Überwacht einen Unternehmens-Slack-Kanal, antwortet hilfreich und leitet Benachrichtigungen an Telegram weiter. Behebte autonom einen Produktionsfehler in einer bereitgestellten App, ohne gefragt zu werden.
</Card>

</CardGroup>

## Wissen und Memory

Systeme, die persönliches oder Teamwissen indexieren, durchsuchen, sich merken und darüber schlussfolgern.

<CardGroup cols={2}>

<Card title="xuezh Chinesischlernen" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Chinesisch-Lernmaschine mit Aussprachefeedback und Lernflows über OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh Aussprachefeedback" />
</Card>

<Card title="WhatsApp-Memory-Tresor" icon="vault">
  **Community** • `memory` `transcription` `indexing`

Importiert vollständige WhatsApp-Exporte, transkribiert 1.000+ Sprachnachrichten, gleicht sie mit Git-Logs ab und gibt verlinkte Markdown-Berichte aus.
</Card>

<Card title="Karakeep-Semantiksuche" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Fügt Karakeep-Lesezeichen Vektorsuche hinzu, mit Qdrant plus OpenAI- oder Ollama-Embeddings.
</Card>

<Card title="Inside-Out-2-Memory" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

Separater Memory-Manager, der Sitzungsdateien zuerst in Erinnerungen, dann Überzeugungen und schließlich in ein sich entwickelndes Selbstmodell umwandelt.
</Card>

</CardGroup>

## Stimme und Telefon

Sprachbasierte Einstiegspunkte, Telefon-Bridges und transkriptionsintensive Workflows.

<CardGroup cols={2}>

<Card title="Clawdia-Telefon-Bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Vapi-Sprachassistent zu OpenClaw-HTTP-Bridge. Telefonate mit Ihrem Agent nahezu in Echtzeit.
</Card>

<Card title="OpenRouter-Transkription" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Mehrsprachige Audiotranskription über OpenRouter (Gemini und mehr). Verfügbar auf ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="OpenRouter-Transkriptions-Skill auf ClawHub" />
</Card>

</CardGroup>

## Infrastruktur und Bereitstellung

Paketierung, Bereitstellung und Integrationen, die OpenClaw einfacher ausführbar und erweiterbar machen.

<CardGroup cols={2}>

<Card title="Home Assistant Add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

OpenClaw-Gateway, ausgeführt auf Home Assistant OS mit SSH-Tunnel-Unterstützung und persistentem Zustand.
</Card>

<Card title="Home Assistant Skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Steuern und automatisieren Sie Home Assistant Geräte per natürlicher Sprache.

  <img src="/assets/showcase/homeassistant.png" alt="Home Assistant Skill auf ClawHub" />
</Card>

<Card title="Nix-Paketierung" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Nixifizierte OpenClaw-Konfiguration mit allem Nötigen für reproduzierbare Deployments.
</Card>

<Card title="CalDAV-Kalender" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Kalender-Skill mit khal und vdirsyncer. Self-hosted Kalenderintegration.

  <img src="/assets/showcase/caldav-calendar.png" alt="CalDAV-Kalender-Skill auf ClawHub" />
</Card>

</CardGroup>

## Zuhause und Hardware

Die physische Seite von OpenClaw: Häuser, Sensoren, Kameras, Staubsauger und andere Geräte.

<CardGroup cols={2}>

<Card title="GoHome-Automatisierung" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Nix-native Heimautomatisierung mit OpenClaw als Schnittstelle sowie Grafana-Dashboards.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana-Dashboard" />
</Card>

<Card title="Roborock-Staubsauger" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Steuern Sie Ihren Roborock-Saugroboter über natürliche Konversation.

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

## Reichen Sie Ihr Projekt ein

<Steps>
  <Step title="Teilen Sie es">
    Posten Sie in [#self-promotion auf Discord](https://discord.gg/clawd) oder [tweeten Sie @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Details angeben">
    Sagen Sie uns, was es tut, verlinken Sie das Repo oder die Demo und teilen Sie einen Screenshot, falls Sie einen haben.
  </Step>
  <Step title="Vorgestellt werden">
    Wir nehmen herausragende Projekte auf dieser Seite auf.
  </Step>
</Steps>

## Verwandt

- [Erste Schritte](/de/start/getting-started)
- [OpenClaw](/de/start/openclaw)
