---
description: Real-world OpenClaw projects from the community
read_when:
    - Auf der Suche nach echten Anwendungsbeispielen für OpenClaw
    - Aktualisierung der Highlights aus Community-Projekten
summary: Von der Community entwickelte Projekte und Integrationen auf Basis von OpenClaw
title: Präsentation
x-i18n:
    generated_at: "2026-07-12T02:12:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64af6f1da52ebdccff82fe2cdb0f7a5f0cd57627b08ee796369e2933f47fbae4
    source_path: start/showcase.md
    workflow: 16
---

Community-erstellte OpenClaw-Projekte: PR-Prüfschleifen, mobile Apps, Heimautomatisierung, Sprachsysteme, Entwicklertools und Memory-Workflows – Chat-nativ entwickelt für Telegram, WhatsApp, Discord und Terminals.

<Info>
**Möchten Sie hier vorgestellt werden?** Teilen Sie Ihr Projekt in [#self-promotion auf Discord](https://discord.gg/clawd) oder [markieren Sie @openclaw auf X](https://x.com/openclaw).
</Info>

## Neues aus Discord

Aktuelle Highlights aus den Bereichen Programmierung, Entwicklertools, mobile Anwendungen und Chat-native Produktentwicklung.

<CardGroup cols={2}>

<Card title="Dropage instant HTML deploy" icon="cloud-arrow-up" href="https://clawhub.ai/jiantoucn/skills/dropage-deploy">
  **@jiantoucn** • `deploy` `hosting` `skill`

Sagen Sie Ihrem Agenten „Stelle dieses HTML bereit“, und Sie erhalten nach etwa einer Sekunde eine öffentliche URL. Die Seiten laufen nach einer Stunde automatisch ab – kein Server, keine Konfiguration, keine Registrierung.
</Card>

<Card title="Anti-scam URL checker" icon="shield-halved" href="https://clawhub.ai/phishguard-niki/anti-scam-guard">
  **@phishguard-niki** • `security` `phishing` `skill`

Fügen Sie eine beliebige URL ein und erhalten Sie eine Bewertung. Mehr als 2,5 Millionen Betrugsdomains aus 38 Quellen (PhishTank, OpenPhish, CERT.PL und weitere) werden lokal abgeglichen, sodass der Browserverlauf das Gerät nie verlässt.
</Card>

<Card title="Product-design reasoning skills" icon="pen-ruler" href="https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog">
  **@monikazapisekstudio** • `product` `reasoning` `skills`

Ein Trio für die Produktarbeit: [Sokratischer Dialog](https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog) hinterfragt eine Frage eingehend, bevor sie beantwortet wird, [Kano-Modell-Stratege](https://clawhub.ai/monikazapisekstudio/skills/kano-model-strategist) ordnet Funktionen danach ein, ob sie ihren Platz verdienen, und [Verständliche Agentenausgabe](https://clawhub.ai/monikazapisekstudio/skills/legible-agent-output) formuliert Agentenausgaben in verständlicher Sprache neu.
</Card>

<Card title="Mailbox broker for sub-agents" icon="inbox" href="https://clawhub.ai/albzhu/skills/miab-broker">
  **@albzhu** • `multi-agent` `async` `skill`

Verhindert, dass Orchestratoren untätig warten, während Unteragenten arbeiten: ein asynchroner Callback-Mechanismus, bei dem Ergebnisse in einem Postfach eingehen, statt den übergeordneten Agenten zu blockieren.
</Card>

<Card title="lite-mode for low-RAM machines" icon="feather" href="https://clawhub.ai/skills/lite-mode">
  **@mirajmahmudul** • `performance` `skill`

Hält OpenClaw auf Geräten mit 2–4 GB Arbeitsspeicher nutzbar: Prüft den freien Speicher und reduziert ressourcenintensive Funktionen, bevor das System mit dem Auslagern beginnt. [Quellcode auf GitHub](https://github.com/mirajmahmudul/openclaw-lite-mode).
</Card>

<Card title="tokenomics cost tracker" icon="coins" href="https://github.com/ncz-os/tokenomics">
  **@ncz-os** • `devtools` `costs` `tokens`

Ein Token-Kostentracker von einem NVIDIA-Ingenieur mit erstklassiger OpenClaw-Unterstützung: Sehen Sie genau, wofür Ihre Agentenausgaben anfallen – aufgeschlüsselt nach Modell und Sitzung.
</Card>

<Card title="Excalidraw diagram generator" icon="shapes" href="https://x.com/swiftlysingh/status/2009684853827281070">
  **@swiftlysingh** • `diagrams` `excalidraw` `devtools`

Beschreiben Sie im Chat ein Diagramm und erhalten Sie eine programmgesteuert erzeugte Excalidraw-Skizze.
</Card>

<Card title="GA4 analytics skill" icon="chart-column" href="https://x.com/jdrhyne/status/2012028725710192741">
  **@jdrhyne** • `analytics` `ga4` `skill`

OpenClaw erstellte sein eigenes Abfragewerkzeug für Google Analytics, das anschließend als Paket auf ClawHub veröffentlicht wurde.
</Card>

<Card title="ClawEval model rankings" icon="ranking-star" href="https://github.com/AIgenteur/ClawEval">
  **@AIgenteur** • `evals` `models` `devtools`

Vergleicht Modelle anhand von 59 Agentenrollen, um die Frage „Welches LLM eignet sich für meine GPU?“ zu beantworten. In der Community eine beliebte Hilfe bei der Auswahl lokaler Modelle.
</Card>

<Card title="Music Craft" icon="music" href="https://clawhub.ai/luischarro/music-craft">
  **@luischarro** • `music` `generation` `skill`

Provider-unabhängige Songerzeugung: Planen Sie den Titel, strukturieren Sie den Liedtext und überarbeiten Sie unzureichende Ergebnisse, statt sich auf einen einzigen Prompt zu verlassen. Enthält eine [MiniMax-Variante](https://clawhub.ai/luischarro/music-craft-minimax) mit Steuerung von BPM, Tonart, Struktur und Mashups.
</Card>

<Card title="PR Review to Telegram Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode schließt die Änderung ab und öffnet einen PR. OpenClaw prüft den Diff und antwortet in Telegram mit Vorschlägen sowie einem eindeutigen Urteil zur Zusammenführung.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR review feedback delivered in Telegram" />
</Card>

<Card title="Wine Cellar Skill in Minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

„Robby“ (@openclaw) wurde gebeten, ein lokales Skill für einen Weinkeller zu erstellen. Es fordert einen beispielhaften CSV-Export und einen Speicherpfad an und erstellt und testet anschließend das Skill (im Beispiel mit 962 Flaschen).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw building a local wine cellar skill from CSV" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Wöchentlicher Speiseplan, regelmäßig benötigte Artikel, Lieferzeitfenster buchen, Bestellung bestätigen. Keine APIs, nur Browsersteuerung.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco shop automation via chat" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Wählen Sie per Tastenkürzel einen Bildschirmbereich aus, lassen Sie ihn von Gemini Vision verarbeiten und erhalten Sie sofort Markdown in Ihrer Zwischenablage.

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Desktop-App zur Verwaltung von Skills und Befehlen für Agents, Claude, Codex und OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI app" />
</Card>

<Card title="Telegram voice notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Bindet die Sprachausgabe von papla.media ein und sendet die Ergebnisse als Telegram-Sprachnachrichten – ohne störende automatische Wiedergabe.

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram voice note output from TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Über Homebrew installiertes Hilfsprogramm zum Auflisten, Prüfen und Überwachen lokaler OpenAI-Codex-Sitzungen (CLI und VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor on ClawHub" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Steuern und diagnostizieren Sie BambuLab-Drucker: Status, Aufträge, Kamera, AMS, Kalibrierung und mehr.

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI skill on ClawHub" />
</Card>

<Card title="Vienna transport (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Echtzeit-Abfahrten, Störungen, Aufzugstatus und Routenplanung für den öffentlichen Nahverkehr in Wien.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill on ClawHub" />
</Card>

<Card title="ParentPay school meals" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Automatisierte Buchung von Schulmahlzeiten im Vereinigten Königreich über ParentPay. Verwendet Mauskoordinaten, um Tabellenzellen zuverlässig anzuklicken.
</Card>

<Card title="R2 upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Laden Sie Dateien zu Cloudflare R2/S3 hoch und erzeugen Sie sichere, vorsignierte Downloadlinks. Nützlich für entfernte OpenClaw-Instanzen.

  <img src="/assets/showcase/r2-upload.png" alt="R2 upload skill on ClawHub" />
</Card>

<Card title="iOS app via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

Eine vollständige iOS-App mit Karten und Sprachaufzeichnung wurde ausschließlich über einen Telegram-Chat erstellt und für die Veröffentlichung im App Store vorbereitet.
</Card>

<Card title="Oura Ring health assistant" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Persönlicher KI-Gesundheitsassistent, der Daten des Oura Ring mit Kalender, Terminen und Trainingsplan verknüpft.

  <img src="/assets/showcase/oura-health.png" alt="Oura ring health assistant" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Mehr als 14 Agenten unter einem Gateway, wobei ein Opus-4.5-Orchestrator Aufgaben an Codex-Worker delegiert. Weitere Informationen finden Sie in der [technischen Beschreibung](https://github.com/adam91holt/orchestrated-ai-articles) und unter [Clawdspace](https://github.com/adam91holt/clawdspace) zur Sandbox-Isolierung von Agenten.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI für Linear, die sich in agentenbasierte Workflows integrieren lässt (Claude Code, OpenClaw). Verwalten Sie Issues, Projekte und Workflows über das Terminal.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Lesen, senden und archivieren Sie Nachrichten über Beeper Desktop. Verwendet die lokale MCP-API von Beeper, sodass Agenten alle Ihre Chats (iMessage, WhatsApp und weitere) zentral verwalten können.
</Card>

</CardGroup>

## Automatisierung und Workflows

Zeitplanung, Browsersteuerung, Supportschleifen und die Seite des Produkts, die Aufgaben einfach für Sie erledigt.

<CardGroup cols={2}>

<Card title="Winix air purifier control" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code erkannte und bestätigte die Steuerungsmöglichkeiten des Luftreinigers. Anschließend übernimmt OpenClaw die Verwaltung der Raumluftqualität.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix air purifier control via OpenClaw" />
</Card>

<Card title="Pretty sky camera shots" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Ausgelöst durch eine Dachkamera: Bitten Sie OpenClaw, immer dann ein Foto des Himmels aufzunehmen, wenn er besonders schön aussieht. OpenClaw entwarf ein Skill und nahm das Bild auf.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Roof camera sky snapshot captured by OpenClaw" />
</Card>

<Card title="Visual morning briefing scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Ein zeitgesteuerter Prompt erzeugt jeden Morgen über eine OpenClaw-Persona ein Szenenbild mit Wetter, Aufgaben, Datum und einem bevorzugten Beitrag oder Zitat.
</Card>

<Card title="Padel court booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Verfügbarkeitsprüfung für Playtomic samt Buchungs-CLI. Verpassen Sie nie wieder einen freien Platz.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli screenshot" />
</Card>

<Card title="Accounting intake" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

Sammelt PDF-Dateien aus E-Mails und bereitet Dokumente für eine Steuerberatung vor. Monatliche Buchhaltung im Autopilotbetrieb.
</Card>

<Card title="Couch potato dev mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Eine vollständige persönliche Website wurde beim Netflix-Schauen über Telegram neu erstellt – von Notion zu Astro, einschließlich der Migration von 18 Beiträgen und der Umstellung des DNS auf Cloudflare. Dabei wurde kein Laptop geöffnet.
</Card>

<Card title="Job search agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Durchsucht Stellenangebote, gleicht sie mit Schlüsselwörtern aus dem Lebenslauf ab und liefert passende Angebote mit Links zurück. In 30 Minuten mit der JSearch-API erstellt.
</Card>

<Card title="Jira skill builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw wurde mit Jira verbunden und erstellte dann spontan ein neues Skill (bevor es auf ClawHub verfügbar war).
</Card>

<Card title="Todoist-Skill über Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Automatisierte Todoist-Aufgaben und ließ OpenClaw das Skill direkt im Telegram-Chat erstellen.
</Card>

<Card title="TradingView-Analyse" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Meldet sich per Browserautomatisierung bei TradingView an, erstellt Screenshots von Diagrammen und führt auf Anfrage technische Analysen durch. Keine API erforderlich – nur Browsersteuerung.
</Card>

<Card title="Autoverhandlung (4.200 $ gespart)" icon="car-side" href="https://x.com/astuyve/status/2014147784098681217">
  **@astuyve** • `negotiation` `email` `automation`

OpenClaw wurde auf Autohändler angesetzt: Es übernahm die gesamte Verhandlung und handelte den Preis um 4.200 $ herunter.
</Card>

<Card title="Autopilot für den Flug-Check-in" icon="plane-departure" href="https://x.com/armanddp/status/2008767951340794245">
  **@armanddp** • `travel` `email` `automation`

Findet den nächsten Flug in E-Mails, führt den Online-Check-in durch und wählt einen Fensterplatz aus – ganz ohne App der Fluggesellschaft.
</Card>

<Card title="Einreichung eines Versicherungsanspruchs" icon="file-signature" href="https://x.com/avi_press/status/2013066316467560521">
  **@avi_press** • `automation` `insurance` `browser`

Reichte selbstständig einen Versicherungsanspruch ein und vereinbarte den Folgetermin.
</Card>

<Card title="Idealista-Immobilien-Skill" icon="building" href="https://x.com/quifago/status/2012458753786859872">
  **@quifago** • `real-estate` `api` `skill`

Idealista-API-CLI für Immobilienabfragen und -bewertungen, als Skill verpackt, damit der Agent im Chat nach Immobilien suchen kann.
</Card>

<Card title="Backoffice für einen Gartenbaubetrieb" icon="seedling" href="https://news.ycombinator.com/item?id=47783940">
  **@mjsweet** • `automation` `email` `invoicing`

Überwacht Gmail auf Arbeitsaufträge, analysiert über Telegram gesendete Immobilienfotos, erstellt mehrseitige Angebots-PDFs mit LaTeX und stellt Rechnungen über Xero aus.
</Card>

<Card title="Automatischer Slack-Support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Überwacht einen Slack-Kanal des Unternehmens, antwortet hilfreich und leitet Benachrichtigungen an Telegram weiter. Behebt selbstständig und ohne Aufforderung einen Produktionsfehler in einer bereitgestellten Anwendung.
</Card>

</CardGroup>

## Wissen und Gedächtnis

Systeme, die persönliches oder teaminternes Wissen indizieren, durchsuchen, speichern und für Schlussfolgerungen nutzen.

<CardGroup cols={2}>

<Card title="Chinesischlernen mit xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Lernsystem für Chinesisch mit Aussprachefeedback und Lernabläufen über OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Aussprachefeedback von xuezh" />
</Card>

<Card title="Analyse-Pipeline für X-Beiträge" icon="hashtag" href="https://x.com/andrewjiang/status/2008388427180630155">
  **@andrewjiang** • `analysis` `x` `pipeline`

Rief vier Millionen Beiträge von 100 führenden X-Konten ab und wandelte sie in eine abfragbare Analyse-Pipeline um.
</Card>

<Card title="Laborergebnisse in Notion" icon="flask" href="https://x.com/danpeguine/status/2013388700479058068">
  **@danpeguine** • `health` `notion` `organization`

Organisierte die Ergebnisse jahrelanger Blutuntersuchungen in einer strukturierten Notion-Datenbank.
</Card>

<Card title="Obsidian als zweites Gehirn" icon="book" href="https://notesbylex.com/openclaw-the-missing-piece-for-obsidians-second-brain">
  **@lexandstuff** • `obsidian` `whatsapp` `memory`

Alltagsassistent auf WhatsApp, dessen gesamtes Gedächtnis als Markdown in einem versionsverwalteten Obsidian-Tresor gespeichert ist: Kalorien- und Trainingsprotokollierung, Aufgabenlisten und private Verwaltungsaufgaben.
</Card>

<Card title="Bot für Familiengeschichte" icon="people-roof" href="https://news.ycombinator.com/item?id=47783940">
  **@brtkwr** • `telegram` `memory` `family`

Ist Teil eines Telegram-Gruppenchats der Familie, dokumentiert Geschichten von mehr als 50 Verwandten und stellt fundierte Anschlussfragen – für Muttersprachler auf Nepali.
</Card>

<Card title="WhatsApp-Gedächtnistresor" icon="vault">
  **Community** • `memory` `transcription` `indexing`

Importiert vollständige WhatsApp-Exporte, transkribiert mehr als 1.000 Sprachnachrichten, gleicht sie mit Git-Protokollen ab und erstellt verknüpfte Markdown-Berichte.
</Card>

<Card title="Semantische Suche für Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Erweitert Karakeep-Lesezeichen mithilfe von Qdrant und Einbettungen von OpenAI oder Ollama um eine Vektorsuche.
</Card>

<Card title="Inside-Out-2-Gedächtnis" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

Separater Gedächtnismanager, der Sitzungsdateien zunächst in Erinnerungen, dann in Überzeugungen und schließlich in ein sich weiterentwickelndes Selbstmodell umwandelt.
</Card>

</CardGroup>

## Sprache und Telefon

Sprachzentrierte Zugangspunkte, Telefonbrücken und transkriptionsintensive Arbeitsabläufe.

<CardGroup cols={2}>

<Card title="Sprachsteuerung per Fingertipp mit Pebble Ring" icon="ring" href="https://x.com/thekitze/status/2014765279650189578">
  **@thekitze** • `voice` `wearable` `hardware`

Ein Fingertipp auf einen Pebble Ring startet eine Sprachunterhaltung mit OpenClaw – Zugriff auf den Agenten über ein Wearable.
</Card>

<Card title="Medienstudio für Kreative" icon="clapperboard" href="https://x.com/cedric_chee/status/2014608153393168425">
  **@cedric_chee** • `media` `tts` `transcription`

Ein vollständiges Medienstudio im Chat: TTS, Transkription und Browserautomatisierung, verbunden mit Codex 5.2 und MiniMax.
</Card>

<Card title="Walkie-Talkie über die Aktionstaste" icon="walkie-talkie" href="https://x.com/i/status/2072766510053888497">
  **@buddyhadry** • `voice` `ios` `mobile`

Die Aktionstaste des iPhones ist mit OpenClaw verbunden: drücken, sprechen und der Agent antwortet wie über ein Walkie-Talkie.
</Card>

<Card title="Clawdia-Telefonbrücke" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

HTTP-Brücke zwischen dem Vapi-Sprachassistenten und OpenClaw. Telefongespräche mit Ihrem Agenten nahezu in Echtzeit.
</Card>

<Card title="OpenRouter-Transkription" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Mehrsprachige Audiotranskription über OpenRouter (Gemini und weitere). Auf ClawHub verfügbar.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="OpenRouter-Transkriptions-Skill auf ClawHub" />
</Card>

</CardGroup>

## Infrastruktur und Bereitstellung

Paketierung, Bereitstellung und Integrationen, die den Betrieb und die Erweiterung von OpenClaw vereinfachen.

<CardGroup cols={2}>

<Card title="Home-Assistant-Add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

OpenClaw-Gateway auf Home Assistant OS mit Unterstützung für SSH-Tunnel und persistente Zustände.
</Card>

<Card title="Home-Assistant-Skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Steuern und automatisieren Sie Home-Assistant-Geräte mit natürlicher Sprache.

  <img src="/assets/showcase/homeassistant.png" alt="Home-Assistant-Skill auf ClawHub" />
</Card>

<Card title="macOS-Menüleistenverwaltung" icon="desktop" href="https://x.com/MagiMetal/status/2009424267801485362">
  **@MagiMetal** • `macos` `swift` `ui`

Native Swift-Anwendung für die Menüleiste, die den Agentenstatus mit Schnellsteuerungen anzeigt.
</Card>

<Card title="Nix-Paketierung" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Voll ausgestattete, nixifizierte OpenClaw-Konfiguration für reproduzierbare Bereitstellungen.
</Card>

<Card title="CalDAV-Kalender" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Kalender-Skill mit khal und vdirsyncer. Selbst gehostete Kalenderintegration.

  <img src="/assets/showcase/caldav-calendar.png" alt="CalDAV-Kalender-Skill auf ClawHub" />
</Card>

</CardGroup>

## Zuhause und Hardware

Die physische Seite von OpenClaw: Häuser, Sensoren, Kameras, Staubsauger und andere Geräte.

<CardGroup cols={2}>

<Card title="Selbst erstelltes HomePod-Skill" icon="volume-high" href="https://x.com/localghost/status/2014763987683225685">
  **@localghost** • `homepod` `discovery` `skill`

OpenClaw fand die HomePods im lokalen Netzwerk und schrieb selbst ein Skill, um sie zu steuern.
</Card>

<Card title="Holografischer Würfel als Oberfläche für 35 $" icon="cube" href="https://x.com/andrewjiang/status/2013140793649734032">
  **@andrewjiang** • `hardware` `display` `fun`

Ein günstiger holografischer Würfel dient als physisches Gesicht des Agenten auf dem Schreibtisch.
</Card>

<Card title="GoHome-Automatisierung" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Nix-native Hausautomatisierung mit OpenClaw als Oberfläche sowie Grafana-Dashboards.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome-Grafana-Dashboard" />
</Card>

<Card title="Roborock-Staubsauger" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Steuern Sie Ihren Roborock-Saugroboter durch natürliche Unterhaltung.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock-Status" />
</Card>

</CardGroup>

## Community-Projekte

Projekte, die sich über einen einzelnen Arbeitsablauf hinaus zu umfassenderen Produkten oder Ökosystemen entwickelt haben.

<CardGroup cols={2}>

<Card title="StarSwap-Marktplatz" icon="star" href="https://star-swap.com/">
  **Community** • `marketplace` `astronomy` `webapp`

Vollständiger Marktplatz für Astronomieausrüstung. Mit und rund um das OpenClaw-Ökosystem entwickelt.
</Card>

<Card title="Clinch-Protokoll für Agentenverhandlungen" icon="handshake" href="https://clawhub.ai/publicstringapps/clinch">
  **@publicstringapps** • `protocol` `p2p` `skill`

Offene Verhandlungen zwischen Agenten: Ihr Agent handelt mit anderen Nodes Geschäfte, Termine und Dienstleistungsvereinbarungen aus und signiert das Ergebnis kryptografisch – Sie müssen es nur genehmigen oder ablehnen.
</Card>

</CardGroup>

## Reichen Sie Ihr Projekt ein

<Steps>
  <Step title="Teilen">
    Veröffentlichen Sie es in [#self-promotion auf Discord](https://discord.gg/clawd) oder [erwähnen Sie @openclaw auf X](https://x.com/openclaw).
  </Step>
  <Step title="Details angeben">
    Erläutern Sie, was das Projekt leistet, verlinken Sie das Repository oder die Demo und teilen Sie einen Screenshot, falls vorhanden.
  </Step>
  <Step title="Vorgestellt werden">
    Wir nehmen herausragende Projekte auf diese Seite auf.
  </Step>
</Steps>

## Verwandte Themen

- [Erste Schritte](/de/start/getting-started)
- [OpenClaw](/de/start/openclaw)
- [Vollständige X-Projektübersicht auf openclaw.ai](https://openclaw.ai/showcase/)
