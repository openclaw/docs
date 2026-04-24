---
read_when:
    - Beantwortung häufiger Fragen zu Einrichtung, Installation, Onboarding oder Laufzeit-Support
    - Triage von von Benutzern gemeldeten Problemen vor einer tiefergehenden Fehlerbehebung
summary: Häufig gestellte Fragen zur Einrichtung, Konfiguration und Verwendung von OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-04-24T08:57:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ae635d7ade265e3e79d1f5489ae23034a341843bd784f68a985b18bee5bdf6f
    source_path: help/faq.md
    workflow: 15
---

Schnelle Antworten plus tiefergehende Fehlerbehebung für reale Setups (lokale Entwicklung, VPS, Multi-Agent, OAuth/API-Schlüssel, Modell-Failover). Für Laufzeitdiagnosen siehe [Troubleshooting](/de/gateway/troubleshooting). Für die vollständige Konfigurationsreferenz siehe [Configuration](/de/gateway/configuration).

## Die ersten 60 Sekunden, wenn etwas nicht funktioniert

1. **Schnellstatus (erste Prüfung)**

   ```bash
   openclaw status
   ```

   Schnelle lokale Zusammenfassung: OS + Update, Erreichbarkeit von Gateway/Service, Agents/Sessions, Provider-Konfiguration + Laufzeitprobleme (wenn das Gateway erreichbar ist).

2. **Einfügbarer Bericht (sicher zum Teilen)**

   ```bash
   openclaw status --all
   ```

   Schreibgeschützte Diagnose mit Log-Tail (Tokens geschwärzt).

3. **Daemon- + Port-Status**

   ```bash
   openclaw gateway status
   ```

   Zeigt Supervisor-Laufzeit vs. RPC-Erreichbarkeit, die Ziel-URL des Probes und welche Konfiguration der Service wahrscheinlich verwendet hat.

4. **Tiefgehende Probes**

   ```bash
   openclaw status --deep
   ```

   Führt einen Live-Gateway-Health-Probe aus, einschließlich Channel-Probes, wenn unterstützt
   (erfordert ein erreichbares Gateway). Siehe [Health](/de/gateway/health).

5. **Dem neuesten Log folgen**

   ```bash
   openclaw logs --follow
   ```

   Wenn RPC nicht verfügbar ist, verwenden Sie stattdessen:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Dateilogs sind getrennt von Service-Logs; siehe [Logging](/de/logging) und [Troubleshooting](/de/gateway/troubleshooting).

6. **Doctor ausführen (Reparaturen)**

   ```bash
   openclaw doctor
   ```

   Repariert/migriert Konfiguration/Status + führt Health-Checks aus. Siehe [Doctor](/de/gateway/doctor).

7. **Gateway-Snapshot**

   ```bash
   openclaw health --json
   openclaw health --verbose   # zeigt bei Fehlern die Ziel-URL + den Konfigurationspfad
   ```

   Fragt das laufende Gateway nach einem vollständigen Snapshot (nur WS). Siehe [Health](/de/gateway/health).

## Schnellstart und Einrichtung beim ersten Start

Fragen und Antworten zum ersten Start — Installation, Onboarding, Auth-Routen, Abonnements, anfängliche Fehler —
finden Sie in der [First-run FAQ](/de/help/faq-first-run).

## Was ist OpenClaw?

<AccordionGroup>
  <Accordion title="Was ist OpenClaw in einem Absatz?">
    OpenClaw ist ein persönlicher KI-Assistent, den Sie auf Ihren eigenen Geräten ausführen. Er antwortet auf den Messaging-Oberflächen, die Sie bereits verwenden (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat und gebündelte Channel-Plugins wie QQ Bot) und kann auf unterstützten Plattformen auch Sprache + ein Live-Canvas bereitstellen. Das **Gateway** ist die stets aktive Steuerungsebene; der Assistent ist das Produkt.
  </Accordion>

  <Accordion title="Nutzenversprechen">
    OpenClaw ist nicht "nur ein Claude-Wrapper". Es ist eine **lokal-first Steuerungsebene**, mit der Sie einen
    leistungsfähigen Assistenten auf **Ihrer eigenen Hardware** ausführen können, erreichbar über die Chat-Apps, die Sie bereits nutzen, mit
    zustandsbehafteten Sessions, Memory und Tools - ohne die Kontrolle über Ihre Workflows an ein gehostetes
    SaaS abzugeben.

    Highlights:

    - **Ihre Geräte, Ihre Daten:** Führen Sie das Gateway dort aus, wo Sie möchten (Mac, Linux, VPS), und behalten Sie den
      Workspace + den Session-Verlauf lokal.
    - **Echte Channels, keine Web-Sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      plus mobile Sprache und Canvas auf unterstützten Plattformen.
    - **Modellagnostisch:** Verwenden Sie Anthropic, OpenAI, MiniMax, OpenRouter usw., mit Routing
      pro Agent und Failover.
    - **Nur-lokal-Option:** Führen Sie lokale Modelle aus, sodass **alle Daten auf Ihrem Gerät bleiben können**, wenn Sie das möchten.
    - **Multi-Agent-Routing:** Separate Agents pro Channel, Konto oder Aufgabe, jeweils mit eigenem
      Workspace und eigenen Standardwerten.
    - **Open Source und anpassbar:** Prüfen, erweitern und selbst hosten ohne Vendor Lock-in.

    Dokumentation: [Gateway](/de/gateway), [Channels](/de/channels), [Multi-agent](/de/concepts/multi-agent),
    [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Ich habe es gerade eingerichtet - was sollte ich zuerst tun?">
    Gute erste Projekte:

    - Eine Website erstellen (WordPress, Shopify oder eine einfache statische Site).
    - Eine mobile App prototypisch entwerfen (Ablauf, Bildschirme, API-Plan).
    - Dateien und Ordner organisieren (Bereinigung, Benennung, Tagging).
    - Gmail verbinden und Zusammenfassungen oder Follow-ups automatisieren.

    Es kann große Aufgaben bewältigen, funktioniert aber am besten, wenn Sie sie in Phasen aufteilen und
    Sub-Agents für parallele Arbeit verwenden.

  </Accordion>

  <Accordion title="Was sind die fünf wichtigsten alltäglichen Anwendungsfälle für OpenClaw?">
    Alltägliche Gewinne sehen typischerweise so aus:

    - **Persönliche Briefings:** Zusammenfassungen von Posteingang, Kalender und Nachrichten, die für Sie wichtig sind.
    - **Recherche und Entwürfe:** Schnelle Recherche, Zusammenfassungen und erste Entwürfe für E-Mails oder Dokumente.
    - **Erinnerungen und Follow-ups:** Durch Cron oder Heartbeat gesteuerte Erinnerungen und Checklisten.
    - **Browser-Automatisierung:** Formulare ausfüllen, Daten sammeln und wiederkehrende Webaufgaben ausführen.
    - **Geräteübergreifende Koordination:** Senden Sie eine Aufgabe von Ihrem Telefon, lassen Sie das Gateway sie auf einem Server ausführen und erhalten Sie das Ergebnis zurück im Chat.

  </Accordion>

  <Accordion title="Kann OpenClaw bei Lead-Generierung, Outreach, Anzeigen und Blogs für ein SaaS helfen?">
    Ja, für **Recherche, Qualifizierung und Entwürfe**. Es kann Sites scannen, Shortlists erstellen,
    Interessenten zusammenfassen und Entwürfe für Outreach oder Anzeigentexte schreiben.

    Für **Outreach oder Anzeigenkampagnen** sollte ein Mensch eingebunden bleiben. Vermeiden Sie Spam, befolgen Sie lokale Gesetze und
    Plattformrichtlinien und prüfen Sie alles, bevor es gesendet wird. Das sicherste Muster ist,
    OpenClaw entwerfen zu lassen und die Freigabe selbst zu erteilen.

    Dokumentation: [Security](/de/gateway/security).

  </Accordion>

  <Accordion title="Welche Vorteile hat OpenClaw gegenüber Claude Code für Webentwicklung?">
    OpenClaw ist ein **persönlicher Assistent** und eine Koordinationsschicht, kein Ersatz für eine IDE. Verwenden Sie
    Claude Code oder Codex für den schnellsten direkten Coding-Loop innerhalb eines Repos. Verwenden Sie OpenClaw, wenn Sie
    dauerhaftes Memory, geräteübergreifenden Zugriff und Tool-Orchestrierung möchten.

    Vorteile:

    - **Persistentes Memory + Workspace** über Sessions hinweg
    - **Plattformübergreifender Zugriff** (WhatsApp, Telegram, TUI, WebChat)
    - **Tool-Orchestrierung** (Browser, Dateien, Zeitplanung, Hooks)
    - **Immer aktives Gateway** (auf einem VPS ausführen, von überall aus interagieren)
    - **Nodes** für lokalen Browser/Bildschirm/Kamera/Ausführung

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills und Automatisierung

<AccordionGroup>
  <Accordion title="Wie passe ich Skills an, ohne das Repo in einen unsauberen Zustand zu versetzen?">
    Verwenden Sie verwaltete Overrides, statt die Repo-Kopie zu bearbeiten. Legen Sie Ihre Änderungen in `~/.openclaw/skills/<name>/SKILL.md` ab (oder fügen Sie über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` einen Ordner hinzu). Die Priorität ist `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelt → `skills.load.extraDirs`, sodass verwaltete Overrides weiterhin Vorrang vor gebündelten Skills haben, ohne Git zu verändern. Wenn Sie den Skill global installieren müssen, er aber nur für einige Agents sichtbar sein soll, behalten Sie die gemeinsame Kopie in `~/.openclaw/skills` und steuern Sie die Sichtbarkeit mit `agents.defaults.skills` und `agents.list[].skills`. Nur Änderungen, die für Upstream geeignet sind, sollten im Repo liegen und als PRs eingereicht werden.
  </Accordion>

  <Accordion title="Kann ich Skills aus einem benutzerdefinierten Ordner laden?">
    Ja. Fügen Sie zusätzliche Verzeichnisse über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` hinzu (niedrigste Priorität). Die Standardpriorität ist `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelt → `skills.load.extraDirs`. `clawhub` installiert standardmäßig in `./skills`, was OpenClaw in der nächsten Session als `<workspace>/skills` behandelt. Wenn der Skill nur für bestimmte Agents sichtbar sein soll, kombinieren Sie dies mit `agents.defaults.skills` oder `agents.list[].skills`.
  </Accordion>

  <Accordion title="Wie kann ich unterschiedliche Modelle für unterschiedliche Aufgaben verwenden?">
    Heute werden folgende Muster unterstützt:

    - **Cron-Jobs**: Isolierte Jobs können pro Job ein `model`-Override setzen.
    - **Sub-Agents**: Leiten Sie Aufgaben an separate Agents mit unterschiedlichen Standardmodellen weiter.
    - **On-Demand-Wechsel**: Verwenden Sie `/model`, um das Modell der aktuellen Session jederzeit zu wechseln.

    Siehe [Cron jobs](/de/automation/cron-jobs), [Multi-Agent Routing](/de/concepts/multi-agent) und [Slash commands](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Der Bot friert bei schwerer Arbeit ein. Wie lagere ich das aus?">
    Verwenden Sie **Sub-Agents** für lange oder parallele Aufgaben. Sub-Agents laufen in ihrer eigenen Session,
    geben eine Zusammenfassung zurück und halten Ihren Hauptchat responsiv.

    Bitten Sie Ihren Bot, "für diese Aufgabe einen Sub-Agent zu starten", oder verwenden Sie `/subagents`.
    Verwenden Sie `/status` im Chat, um zu sehen, was das Gateway gerade tut (und ob es ausgelastet ist).

    Token-Tipp: Lange Aufgaben und Sub-Agents verbrauchen beide Tokens. Wenn Kosten ein Thema sind, legen Sie ein
    günstigeres Modell für Sub-Agents über `agents.defaults.subagents.model` fest.

    Dokumentation: [Sub-agents](/de/tools/subagents), [Background Tasks](/de/automation/tasks).

  </Accordion>

  <Accordion title="Wie funktionieren threadgebundene Subagent-Sessions auf Discord?">
    Verwenden Sie Thread-Bindings. Sie können einen Discord-Thread an einen Subagent oder ein Session-Ziel binden, sodass Folgenachrichten in diesem Thread in dieser gebundenen Session bleiben.

    Grundablauf:

    - Starten Sie mit `sessions_spawn` unter Verwendung von `thread: true` (und optional `mode: "session"` für persistente Folgenachrichten).
    - Oder binden Sie manuell mit `/focus <target>`.
    - Verwenden Sie `/agents`, um den Binding-Status zu prüfen.
    - Verwenden Sie `/session idle <duration|off>` und `/session max-age <duration|off>`, um das automatische Lösen des Fokus zu steuern.
    - Verwenden Sie `/unfocus`, um den Thread zu lösen.

    Erforderliche Konfiguration:

    - Globale Standardwerte: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord-Overrides: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatisches Binden beim Start: Setzen Sie `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Dokumentation: [Sub-agents](/de/tools/subagents), [Discord](/de/channels/discord), [Configuration Reference](/de/gateway/configuration-reference), [Slash commands](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Ein Subagent ist fertig, aber das Abschluss-Update wurde an die falsche Stelle gesendet oder nie veröffentlicht. Was sollte ich prüfen?">
    Prüfen Sie zuerst die aufgelöste Requester-Route:

    - Die Zustellung eines Subagents im Completion-Modus bevorzugt jeden gebundenen Thread oder jede Conversation-Route, wenn eine vorhanden ist.
    - Wenn der Completion-Ursprung nur einen Channel enthält, greift OpenClaw auf die gespeicherte Route der Requester-Session zurück (`lastChannel` / `lastTo` / `lastAccountId`), sodass direkte Zustellung weiterhin funktionieren kann.
    - Wenn weder eine gebundene Route noch eine nutzbare gespeicherte Route vorhanden ist, kann die direkte Zustellung fehlschlagen und das Ergebnis fällt stattdessen auf zugestellte Session-Queue-Zustellung zurück, anstatt sofort im Chat veröffentlicht zu werden.
    - Ungültige oder veraltete Ziele können weiterhin zu Queue-Fallback oder endgültigem Zustellfehler führen.
    - Wenn die letzte sichtbare Assistant-Antwort des Childs genau das stille Token `NO_REPLY` / `no_reply` oder genau `ANNOUNCE_SKIP` ist, unterdrückt OpenClaw die Ankündigung absichtlich, anstatt veralteten früheren Fortschritt zu posten.
    - Wenn das Child nach reinen Tool-Aufrufen ein Timeout hatte, kann die Ankündigung dies zu einer kurzen Zusammenfassung des Teilfortschritts verdichten, anstatt rohe Tool-Ausgaben erneut abzuspielen.

    Debugging:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentation: [Sub-agents](/de/tools/subagents), [Background Tasks](/de/automation/tasks), [Session Tools](/de/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron oder Erinnerungen werden nicht ausgelöst. Was sollte ich prüfen?">
    Cron läuft innerhalb des Gateway-Prozesses. Wenn das Gateway nicht dauerhaft läuft,
    werden geplante Jobs nicht ausgeführt.

    Checkliste:

    - Bestätigen Sie, dass Cron aktiviert ist (`cron.enabled`) und `OPENCLAW_SKIP_CRON` nicht gesetzt ist.
    - Prüfen Sie, dass das Gateway rund um die Uhr läuft (kein Ruhezustand/Neustarts).
    - Verifizieren Sie die Zeitzoneneinstellungen für den Job (`--tz` vs. Zeitzone des Hosts).

    Debugging:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokumentation: [Cron jobs](/de/automation/cron-jobs), [Automation & Tasks](/de/automation).

  </Accordion>

  <Accordion title="Cron wurde ausgelöst, aber nichts wurde an den Channel gesendet. Warum?">
    Prüfen Sie zuerst den Zustellmodus:

    - `--no-deliver` / `delivery.mode: "none"` bedeutet, dass kein Fallback-Senden durch den Runner erwartet wird.
    - Fehlendes oder ungültiges Ankündigungsziel (`channel` / `to`) bedeutet, dass der Runner die ausgehende Zustellung übersprungen hat.
    - Channel-Authentifizierungsfehler (`unauthorized`, `Forbidden`) bedeuten, dass der Runner die Zustellung versucht hat, aber Anmeldedaten sie blockiert haben.
    - Ein stilles isoliertes Ergebnis (`NO_REPLY` / `no_reply` allein) wird als absichtlich nicht zustellbar behandelt, daher unterdrückt der Runner ebenfalls die Fallback-Zustellung über die Queue.

    Bei isolierten Cron-Jobs kann der Agent mit dem Tool `message`
    weiterhin direkt senden, wenn eine Chat-Route verfügbar ist. `--announce` steuert nur den
    Runner-Fallback-Pfad für finalen Text, den der Agent nicht bereits selbst gesendet hat.

    Debugging:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentation: [Cron jobs](/de/automation/cron-jobs), [Background Tasks](/de/automation/tasks).

  </Accordion>

  <Accordion title="Warum hat ein isolierter Cron-Lauf Modelle gewechselt oder einmal neu versucht?">
    Das ist normalerweise der Live-Modellwechselpfad, nicht doppelte Planung.

    Isolierter Cron kann eine Laufzeit-Modellübergabe persistieren und einen neuen
    Versuch ausführen, wenn der aktive Lauf `LiveSessionModelSwitchError` auslöst. Der
    neue Versuch behält den gewechselten Provider/das gewechselte Modell bei, und wenn der Wechsel ein neues Auth-Profile-Override mitbrachte, persistiert Cron
    dieses ebenfalls vor dem neuen Versuch.

    Zugehörige Auswahlregeln:

    - Das Gmail-Hook-Modell-Override gewinnt zuerst, wenn anwendbar.
    - Dann `model` pro Job.
    - Dann ein beliebiges gespeichertes Cron-Session-Modell-Override.
    - Dann die normale Auswahl des Agent-/Standardmodells.

    Die Retry-Schleife ist begrenzt. Nach dem ersten Versuch plus 2 Wechsel-Retries
    bricht Cron ab, statt endlos zu schleifen.

    Debugging:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentation: [Cron jobs](/de/automation/cron-jobs), [cron CLI](/de/cli/cron).

  </Accordion>

  <Accordion title="Wie installiere ich Skills unter Linux?">
    Verwenden Sie native `openclaw skills`-Befehle oder legen Sie Skills in Ihrem Workspace ab. Die macOS-Skills-UI ist unter Linux nicht verfügbar.
    Durchsuchen Sie Skills unter [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    Die native Installation mit `openclaw skills install` schreibt in das Verzeichnis `skills/`
    des aktiven Workspace. Installieren Sie die separate `clawhub`-CLI nur, wenn Sie eigene Skills veröffentlichen oder
    synchronisieren möchten. Für gemeinsame Installationen über Agents hinweg legen Sie den Skill unter
    `~/.openclaw/skills` ab und verwenden `agents.defaults.skills` oder
    `agents.list[].skills`, wenn Sie einschränken möchten, welche Agents ihn sehen können.

  </Accordion>

  <Accordion title="Kann OpenClaw Aufgaben zeitgesteuert oder kontinuierlich im Hintergrund ausführen?">
    Ja. Verwenden Sie den Gateway-Scheduler:

    - **Cron-Jobs** für geplante oder wiederkehrende Aufgaben (bleiben über Neustarts hinweg erhalten).
    - **Heartbeat** für periodische Prüfungen der "Haupt-Session".
    - **Isolierte Jobs** für autonome Agents, die Zusammenfassungen posten oder an Chats zustellen.

    Dokumentation: [Cron jobs](/de/automation/cron-jobs), [Automation & Tasks](/de/automation),
    [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title="Kann ich Apple-macOS-only-Skills unter Linux ausführen?">
    Nicht direkt. macOS-Skills werden durch `metadata.openclaw.os` plus erforderliche Binärdateien gesteuert, und Skills erscheinen nur dann im System-Prompt, wenn sie auf dem **Gateway-Host** zulässig sind. Unter Linux werden nur für `darwin` vorgesehene Skills (wie `apple-notes`, `apple-reminders`, `things-mac`) nicht geladen, es sei denn, Sie überschreiben diese Einschränkung.

    Es gibt drei unterstützte Muster:

    **Option A - Gateway auf einem Mac ausführen (am einfachsten).**
    Führen Sie das Gateway dort aus, wo die macOS-Binärdateien vorhanden sind, und verbinden Sie sich dann von Linux im [Remote-Modus](#gateway-ports-already-running-and-remote-mode) oder über Tailscale. Die Skills werden normal geladen, weil der Gateway-Host macOS ist.

    **Option B - einen macOS-Node verwenden (ohne SSH).**
    Führen Sie das Gateway unter Linux aus, koppeln Sie einen macOS-Node (Menüleisten-App) und setzen Sie **Node Run Commands** auf "Always Ask" oder "Always Allow" auf dem Mac. OpenClaw kann nur für macOS vorgesehene Skills als zulässig behandeln, wenn die erforderlichen Binärdateien auf dem Node vorhanden sind. Der Agent führt diese Skills über das Tool `nodes` aus. Wenn Sie "Always Ask" wählen, fügt die Bestätigung von "Always Allow" in der Eingabeaufforderung diesen Befehl zur Allowlist hinzu.

    **Option C - macOS-Binärdateien über SSH proxyen (fortgeschritten).**
    Behalten Sie das Gateway unter Linux, sorgen Sie aber dafür, dass sich die erforderlichen CLI-Binärdateien zu SSH-Wrappern auflösen, die auf einem Mac ausgeführt werden. Überschreiben Sie dann den Skill, um Linux zu erlauben, damit er zulässig bleibt.

    1. Erstellen Sie einen SSH-Wrapper für die Binärdatei (Beispiel: `memo` für Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Legen Sie den Wrapper auf dem Linux-Host in `PATH` ab (zum Beispiel `~/bin/memo`).
    3. Überschreiben Sie die Skill-Metadaten (Workspace oder `~/.openclaw/skills`), um Linux zu erlauben:

       ```markdown
       ---
       name: apple-notes
       description: Apple Notes über die memo-CLI unter macOS verwalten.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Starten Sie eine neue Session, damit der Skills-Snapshot aktualisiert wird.

  </Accordion>

  <Accordion title="Gibt es eine Notion- oder HeyGen-Integration?">
    Derzeit nicht integriert.

    Optionen:

    - **Benutzerdefinierter Skill / Plugin:** am besten für zuverlässigen API-Zugriff (Notion/HeyGen haben beide APIs).
    - **Browser-Automatisierung:** funktioniert ohne Code, ist aber langsamer und fehleranfälliger.

    Wenn Sie Kontext pro Kunde beibehalten möchten (Agentur-Workflows), ist ein einfaches Muster:

    - Eine Notion-Seite pro Kunde (Kontext + Präferenzen + aktive Arbeit).
    - Weisen Sie den Agent an, diese Seite zu Beginn einer Session abzurufen.

    Wenn Sie eine native Integration möchten, eröffnen Sie eine Feature-Anfrage oder bauen Sie einen Skill,
    der auf diese APIs abzielt.

    Skills installieren:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Native Installationen landen im Verzeichnis `skills/` des aktiven Workspace. Für gemeinsame Skills über Agents hinweg platzieren Sie sie unter `~/.openclaw/skills/<name>/SKILL.md`. Wenn nur einige Agents eine gemeinsame Installation sehen sollen, konfigurieren Sie `agents.defaults.skills` oder `agents.list[].skills`. Manche Skills erwarten über Homebrew installierte Binärdateien; unter Linux bedeutet das Linuxbrew (siehe den Linux-FAQ-Eintrag zu Homebrew oben). Siehe [Skills](/de/tools/skills), [Skills config](/de/tools/skills-config) und [ClawHub](/de/tools/clawhub).

  </Accordion>

  <Accordion title="Wie verwende ich mein bereits angemeldetes Chrome mit OpenClaw?">
    Verwenden Sie das integrierte Browser-Profil `user`, das sich über Chrome DevTools MCP verbindet:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Wenn Sie einen benutzerdefinierten Namen möchten, erstellen Sie ein explizites MCP-Profil:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Dieser Pfad kann den Browser des lokalen Hosts oder einen verbundenen Browser-Node verwenden. Wenn das Gateway anderswo läuft, führen Sie entweder einen Node-Host auf dem Browser-Rechner aus oder verwenden Sie stattdessen Remote-CDP.

    Aktuelle Einschränkungen von `existing-session` / `user`:

    - Aktionen sind ref-basiert, nicht CSS-Selektor-basiert
    - Uploads erfordern `ref` / `inputRef` und unterstützen derzeit jeweils nur eine Datei
    - `responsebody`, PDF-Export, Download-Interception und Batch-Aktionen benötigen weiterhin einen verwalteten Browser oder ein rohes CDP-Profil

  </Accordion>
</AccordionGroup>

## Sandboxing und Memory

<AccordionGroup>
  <Accordion title="Gibt es eine dedizierte Dokumentation zum Sandboxing?">
    Ja. Siehe [Sandboxing](/de/gateway/sandboxing). Für Docker-spezifische Einrichtung (vollständiges Gateway in Docker oder Sandbox-Images) siehe [Docker](/de/install/docker).
  </Accordion>

  <Accordion title="Docker fühlt sich eingeschränkt an - wie aktiviere ich den vollen Funktionsumfang?">
    Das Standard-Image ist sicherheitsorientiert und läuft als Benutzer `node`, daher enthält es
    keine Systempakete, kein Homebrew und keine gebündelten Browser. Für ein vollständigeres Setup:

    - Persistieren Sie `/home/node` mit `OPENCLAW_HOME_VOLUME`, damit Caches erhalten bleiben.
    - Backen Sie Systemabhängigkeiten mit `OPENCLAW_DOCKER_APT_PACKAGES` in das Image ein.
    - Installieren Sie Playwright-Browser über die gebündelte CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Setzen Sie `PLAYWRIGHT_BROWSERS_PATH` und stellen Sie sicher, dass der Pfad persistiert wird.

    Dokumentation: [Docker](/de/install/docker), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Kann ich DMs persönlich halten, aber Gruppen öffentlich/in der Sandbox machen – mit einem Agent?">
    Ja - wenn Ihr privater Verkehr **DMs** und Ihr öffentlicher Verkehr **Gruppen** sind.

    Verwenden Sie `agents.defaults.sandbox.mode: "non-main"`, damit Gruppen-/Channel-Sessions (nicht-Hauptschlüssel) im konfigurierten Sandbox-Backend laufen, während die Haupt-DM-Session auf dem Host bleibt. Docker ist das Standard-Backend, wenn Sie keines auswählen. Beschränken Sie dann über `tools.sandbox.tools`, welche Tools in Sandbox-Sessions verfügbar sind.

    Einrichtungsanleitung + Beispielkonfiguration: [Groups: personal DMs + public groups](/de/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Wichtige Konfigurationsreferenz: [Gateway configuration](/de/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Wie binde ich einen Host-Ordner in die Sandbox ein?">
    Setzen Sie `agents.defaults.sandbox.docker.binds` auf `["host:path:mode"]` (z. B. `"/home/user/src:/src:ro"`). Globale + Agent-spezifische Binds werden zusammengeführt; Agent-spezifische Binds werden ignoriert, wenn `scope: "shared"` gesetzt ist. Verwenden Sie `:ro` für alles Sensible und denken Sie daran, dass Binds die Dateisystemgrenzen der Sandbox umgehen.

    OpenClaw validiert Bind-Quellen sowohl gegen den normalisierten Pfad als auch gegen den kanonischen Pfad, der über den tiefsten vorhandenen Vorfahren aufgelöst wird. Das bedeutet, dass Ausbrüche über Symlink-Eltern weiterhin sicher fehlschlagen, selbst wenn das letzte Pfadsegment noch nicht existiert, und Prüfungen zulässiger Wurzeln auch nach der Symlink-Auflösung weiterhin gelten.

    Siehe [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts) und [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) für Beispiele und Sicherheitshinweise.

  </Accordion>

  <Accordion title="Wie funktioniert Memory?">
    OpenClaw-Memory sind einfach Markdown-Dateien im Agent-Workspace:

    - Tägliche Notizen in `memory/YYYY-MM-DD.md`
    - Kuratierte langfristige Notizen in `MEMORY.md` (nur Haupt-/private Sessions)

    OpenClaw führt außerdem einen **stillen Memory-Flush vor der Compaction** aus, um das Modell
    daran zu erinnern, dauerhafte Notizen zu schreiben, bevor die automatische Compaction erfolgt. Dies läuft nur, wenn der Workspace
    beschreibbar ist (schreibgeschützte Sandboxes überspringen dies). Siehe [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Memory vergisst ständig Dinge. Wie sorge ich dafür, dass sie bleiben?">
    Bitten Sie den Bot, **die Information in Memory zu schreiben**. Langfristige Notizen gehören in `MEMORY.md`,
    kurzfristiger Kontext in `memory/YYYY-MM-DD.md`.

    Dies ist weiterhin ein Bereich, den wir verbessern. Es hilft, das Modell daran zu erinnern, Erinnerungen zu speichern;
    es weiß dann, was zu tun ist. Wenn es weiterhin Dinge vergisst, prüfen Sie, ob das Gateway in jedem Lauf denselben
    Workspace verwendet.

    Dokumentation: [Memory](/de/concepts/memory), [Agent workspace](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bleibt Memory für immer erhalten? Was sind die Grenzen?">
    Memory-Dateien liegen auf der Festplatte und bleiben erhalten, bis Sie sie löschen. Die Grenze ist Ihr
    Speicherplatz, nicht das Modell. Der **Session-Kontext** ist weiterhin durch das Kontextfenster des Modells
    begrenzt, daher können lange Unterhaltungen kompaktifiziert oder abgeschnitten werden. Deshalb gibt es
    die Memory-Suche - sie holt nur die relevanten Teile zurück in den Kontext.

    Dokumentation: [Memory](/de/concepts/memory), [Context](/de/concepts/context).

  </Accordion>

  <Accordion title="Erfordert die semantische Memory-Suche einen OpenAI-API-Schlüssel?">
    Nur wenn Sie **OpenAI-Embeddings** verwenden. Codex-OAuth deckt Chat/Completions ab und
    gewährt **keinen** Zugriff auf Embeddings, daher hilft **die Anmeldung mit Codex (OAuth oder
    der Codex-CLI-Anmeldung)** nicht bei der semantischen Memory-Suche. OpenAI-Embeddings
    benötigen weiterhin einen echten API-Schlüssel (`OPENAI_API_KEY` oder `models.providers.openai.apiKey`).

    Wenn Sie keinen Provider explizit festlegen, wählt OpenClaw automatisch einen Provider aus, wenn es
    einen API-Schlüssel auflösen kann (Auth-Profile, `models.providers.*.apiKey` oder Env-Variablen).
    Es bevorzugt OpenAI, wenn ein OpenAI-Schlüssel aufgelöst werden kann, ansonsten Gemini, wenn ein Gemini-Schlüssel
    aufgelöst werden kann, dann Voyage, dann Mistral. Wenn kein Remote-Schlüssel verfügbar ist, bleibt die Memory-
    Suche deaktiviert, bis Sie sie konfigurieren. Wenn Sie einen lokalen Modellpfad
    konfiguriert haben und dieser vorhanden ist, bevorzugt OpenClaw
    `local`. Ollama wird unterstützt, wenn Sie explizit
    `memorySearch.provider = "ollama"` setzen.

    Wenn Sie lieber lokal bleiben möchten, setzen Sie `memorySearch.provider = "local"` (und optional
    `memorySearch.fallback = "none"`). Wenn Sie Gemini-Embeddings möchten, setzen Sie
    `memorySearch.provider = "gemini"` und geben Sie `GEMINI_API_KEY` an (oder
    `memorySearch.remote.apiKey`). Wir unterstützen **OpenAI-, Gemini-, Voyage-, Mistral-, Ollama- oder lokale**
    Embedding-Modelle - siehe [Memory](/de/concepts/memory) für die Einrichtungsdetails.

  </Accordion>
</AccordionGroup>

## Wo sich Dinge auf dem Datenträger befinden

<AccordionGroup>
  <Accordion title="Werden alle mit OpenClaw verwendeten Daten lokal gespeichert?">
    Nein - **der Status von OpenClaw ist lokal**, aber **externe Dienste sehen weiterhin, was Sie ihnen senden**.

    - **Standardmäßig lokal:** Sessions, Memory-Dateien, Konfiguration und Workspace befinden sich auf dem Gateway-Host
      (`~/.openclaw` + Ihr Workspace-Verzeichnis).
    - **Notwendigerweise remote:** Nachrichten, die Sie an Modell-Provider (Anthropic/OpenAI/usw.) senden, gehen an
      deren APIs, und Chat-Plattformen (WhatsApp/Telegram/Slack/usw.) speichern Nachrichtendaten auf ihren
      Servern.
    - **Sie kontrollieren den Umfang:** Die Verwendung lokaler Modelle hält Prompts auf Ihrem Rechner, aber Channel-
      Verkehr läuft weiterhin über die Server des jeweiligen Channels.

    Zugehörig: [Agent workspace](/de/concepts/agent-workspace), [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Wo speichert OpenClaw seine Daten?">
    Alles befindet sich unter `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`):

    | Pfad                                                            | Zweck                                                              |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Hauptkonfiguration (JSON5)                                         |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Legacy-OAuth-Import (beim ersten Gebrauch in Auth-Profile kopiert) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth-Profile (OAuth, API-Schlüssel und optional `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Optional dateigestütztes Secret-Payload für `file` SecretRef-Provider |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Legacy-Kompatibilitätsdatei (statische `api_key`-Einträge bereinigt) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Provider-Status (z. B. `whatsapp/<accountId>/creds.json`)          |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Status pro Agent (agentDir + Sessions)                             |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Gesprächsverlauf & Status (pro Agent)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Session-Metadaten (pro Agent)                                      |

    Legacy-Single-Agent-Pfad: `~/.openclaw/agent/*` (migriert durch `openclaw doctor`).

    Ihr **Workspace** (`AGENTS.md`, Memory-Dateien, Skills usw.) ist separat und wird über `agents.defaults.workspace` konfiguriert (Standard: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Wo sollten AGENTS.md / SOUL.md / USER.md / MEMORY.md liegen?">
    Diese Dateien befinden sich im **Agent-Workspace**, nicht in `~/.openclaw`.

    - **Workspace (pro Agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, optional `HEARTBEAT.md`.
      `memory.md` in Kleinbuchstaben im Root ist nur Legacy-Reparatureingabe; `openclaw doctor --fix`
      kann es in `MEMORY.md` zusammenführen, wenn beide Dateien vorhanden sind.
    - **Statusverzeichnis (`~/.openclaw`)**: Konfiguration, Channel-/Provider-Status, Auth-Profile, Sessions, Logs
      und gemeinsame Skills (`~/.openclaw/skills`).

    Der Standard-Workspace ist `~/.openclaw/workspace`, konfigurierbar über:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Wenn der Bot nach einem Neustart "vergisst", prüfen Sie, ob das Gateway bei jedem
    Start denselben Workspace verwendet (und denken Sie daran: Im Remote-Modus wird der Workspace des **Gateway-Hosts**
    verwendet, nicht der Ihres lokalen Laptops).

    Tipp: Wenn Sie ein dauerhaftes Verhalten oder eine dauerhafte Präferenz möchten, bitten Sie den Bot, **es in
    AGENTS.md oder MEMORY.md zu schreiben**, statt sich auf den Chat-Verlauf zu verlassen.

    Siehe [Agent workspace](/de/concepts/agent-workspace) und [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Empfohlene Backup-Strategie">
    Legen Sie Ihren **Agent-Workspace** in einem **privaten** Git-Repo ab und sichern Sie ihn
    an einem privaten Ort (zum Beispiel GitHub private). Dadurch werden Memory + AGENTS-/SOUL-/USER-
    Dateien erfasst, und Sie können den "Geist" des Assistenten später wiederherstellen.

    Committen Sie **nichts** unter `~/.openclaw` (`credentials`, Sessions, Tokens oder verschlüsselte Secret-Payloads).
    Wenn Sie eine vollständige Wiederherstellung benötigen, sichern Sie sowohl den Workspace als auch das Statusverzeichnis
    separat (siehe die Migrationsfrage oben).

    Dokumentation: [Agent workspace](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Wie deinstalliere ich OpenClaw vollständig?">
    Siehe die dedizierte Anleitung: [Uninstall](/de/install/uninstall).
  </Accordion>

  <Accordion title="Können Agents außerhalb des Workspace arbeiten?">
    Ja. Der Workspace ist das **Standard-cwd** und der Memory-Anker, keine harte Sandbox.
    Relative Pfade werden innerhalb des Workspace aufgelöst, aber absolute Pfade können auf andere
    Host-Speicherorte zugreifen, es sei denn, Sandboxing ist aktiviert. Wenn Sie Isolation benötigen, verwenden Sie
    [`agents.defaults.sandbox`](/de/gateway/sandboxing) oder Agent-spezifische Sandbox-Einstellungen. Wenn Sie
    möchten, dass ein Repo das Standard-Arbeitsverzeichnis ist, setzen Sie den
    `workspace` dieses Agents auf das Repo-Root. Das OpenClaw-Repo ist nur Quellcode; halten Sie den
    Workspace getrennt, es sei denn, Sie möchten ausdrücklich, dass der Agent darin arbeitet.

    Beispiel (Repo als Standard-cwd):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Remote-Modus: Wo ist der Session-Speicher?">
    Der Session-Status gehört dem **Gateway-Host**. Wenn Sie sich im Remote-Modus befinden, liegt der relevante Session-Speicher auf dem Remote-Rechner, nicht auf Ihrem lokalen Laptop. Siehe [Session management](/de/concepts/session).
  </Accordion>
</AccordionGroup>

## Grundlagen der Konfiguration

<AccordionGroup>
  <Accordion title="Welches Format hat die Konfiguration? Wo befindet sie sich?">
    OpenClaw liest eine optionale **JSON5**-Konfiguration aus `$OPENCLAW_CONFIG_PATH` (Standard: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Wenn die Datei fehlt, werden einigermaßen sichere Standardwerte verwendet (einschließlich eines Standard-Workspace von `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ich habe gateway.bind: "lan" (oder "tailnet") gesetzt und jetzt lauscht nichts / die UI sagt unauthorized'>
    Nicht-Loopback-Bindings **erfordern einen gültigen Gateway-Auth-Pfad**. In der Praxis bedeutet das:

    - Shared-Secret-Authentifizierung: Token oder Passwort
    - `gateway.auth.mode: "trusted-proxy"` hinter einem korrekt konfigurierten nicht-Loopback Identity-aware Reverse Proxy

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    Hinweise:

    - `gateway.remote.token` / `.password` aktivieren die lokale Gateway-Authentifizierung nicht von sich aus.
    - Lokale Aufrufpfade können `gateway.remote.*` nur dann als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
    - Für Passwort-Authentifizierung setzen Sie stattdessen `gateway.auth.mode: "password"` plus `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht aufgelöst ist, schlägt die Auflösung sicher fehl (kein maskierender Remote-Fallback).
    - Setups mit Shared-Secret-Control-UI authentifizieren sich über `connect.params.auth.token` oder `connect.params.auth.password` (gespeichert in App-/UI-Einstellungen). Identitätstragende Modi wie Tailscale Serve oder `trusted-proxy` verwenden stattdessen Request-Header. Vermeiden Sie es, Shared Secrets in URLs abzulegen.
    - Bei `gateway.auth.mode: "trusted-proxy"` erfüllen Reverse Proxys mit Loopback auf demselben Host weiterhin **nicht** die trusted-proxy-Authentifizierung. Der trusted proxy muss eine konfigurierte Quelle ohne Loopback sein.

  </Accordion>

  <Accordion title="Warum brauche ich jetzt ein Token auf localhost?">
    OpenClaw erzwingt standardmäßig Gateway-Authentifizierung, einschließlich Loopback. Im normalen Standardpfad bedeutet das Token-Authentifizierung: Wenn kein expliziter Auth-Pfad konfiguriert ist, wird beim Gateway-Start der Token-Modus aufgelöst und automatisch ein Token erzeugt, das in `gateway.auth.token` gespeichert wird, sodass **lokale WS-Clients sich authentifizieren müssen**. Dadurch wird verhindert, dass andere lokale Prozesse das Gateway aufrufen.

    Wenn Sie einen anderen Auth-Pfad bevorzugen, können Sie explizit den Passwortmodus wählen (oder für nicht-Loopback Identity-aware Reverse Proxys `trusted-proxy`). Wenn Sie **wirklich** offenes Loopback möchten, setzen Sie in Ihrer Konfiguration explizit `gateway.auth.mode: "none"`. Doctor kann jederzeit ein Token für Sie erzeugen: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Muss ich nach dem Ändern der Konfiguration neu starten?">
    Das Gateway überwacht die Konfiguration und unterstützt Hot-Reload:

    - `gateway.reload.mode: "hybrid"` (Standard): sichere Änderungen hot anwenden, bei kritischen neu starten
    - `hot`, `restart`, `off` werden ebenfalls unterstützt

  </Accordion>

  <Accordion title="Wie deaktiviere ich witzige CLI-Slogans?">
    Setzen Sie `cli.banner.taglineMode` in der Konfiguration:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: blendet den Slogan-Text aus, behält aber die Titel-/Versionszeile des Banners bei.
    - `default`: verwendet jedes Mal `All your chats, one OpenClaw.`.
    - `random`: rotierende witzige/saisonale Slogans (Standardverhalten).
    - Wenn Sie überhaupt kein Banner möchten, setzen Sie die Env-Variable `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Wie aktiviere ich die Websuche (und Web-Fetch)?">
    `web_fetch` funktioniert ohne API-Schlüssel. `web_search` hängt von Ihrem ausgewählten
    Provider ab:

    - API-gestützte Provider wie Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity und Tavily erfordern ihre normale API-Schlüssel-Konfiguration.
    - Ollama Web Search benötigt keinen Schlüssel, verwendet aber Ihren konfigurierten Ollama-Host und erfordert `ollama signin`.
    - DuckDuckGo benötigt keinen Schlüssel, ist aber eine inoffizielle HTML-basierte Integration.
    - SearXNG ist schlüsselfrei/self-hosted; konfigurieren Sie `SEARXNG_BASE_URL` oder `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Empfohlen:** Führen Sie `openclaw configure --section web` aus und wählen Sie einen Provider.
    Alternativen über Umgebungsvariablen:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` oder `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` oder `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` oder `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // optional; weglassen für automatische Erkennung
            },
          },
        },
    }
    ```

    Die Provider-spezifische Websuche-Konfiguration befindet sich jetzt unter `plugins.entries.<plugin>.config.webSearch.*`.
    Legacy-Provider-Pfade unter `tools.web.search.*` werden aus Kompatibilitätsgründen vorübergehend weiterhin geladen, sollten aber für neue Konfigurationen nicht verwendet werden.
    Die Fallback-Konfiguration für Firecrawl-Web-Fetch befindet sich unter `plugins.entries.firecrawl.config.webFetch.*`.

    Hinweise:

    - Wenn Sie Allowlists verwenden, fügen Sie `web_search`/`web_fetch`/`x_search` oder `group:web` hinzu.
    - `web_fetch` ist standardmäßig aktiviert (sofern nicht explizit deaktiviert).
    - Wenn `tools.web.fetch.provider` weggelassen wird, erkennt OpenClaw automatisch den ersten bereiten Fetch-Fallback-Provider anhand der verfügbaren Anmeldedaten. Derzeit ist Firecrawl der gebündelte Provider.
    - Daemons lesen Umgebungsvariablen aus `~/.openclaw/.env` (oder der Service-Umgebung).

    Dokumentation: [Web tools](/de/tools/web).

  </Accordion>

  <Accordion title="config.apply hat meine Konfiguration gelöscht. Wie stelle ich sie wieder her und wie vermeide ich das?">
    `config.apply` ersetzt die **gesamte Konfiguration**. Wenn Sie ein partielles Objekt senden, wird alles
    andere entfernt.

    Das aktuelle OpenClaw schützt vor vielen versehentlichen Überschreibungen:

    - Von OpenClaw verwaltete Konfigurationsschreibvorgänge validieren die vollständige Konfiguration nach der Änderung, bevor sie geschrieben wird.
    - Ungültige oder destruktive von OpenClaw verwaltete Schreibvorgänge werden abgelehnt und als `openclaw.json.rejected.*` gespeichert.
    - Wenn eine direkte Bearbeitung den Start oder Hot-Reload unterbricht, stellt das Gateway die letzte bekannte funktionierende Konfiguration wieder her und speichert die abgelehnte Datei als `openclaw.json.clobbered.*`.
    - Der Haupt-Agent erhält nach der Wiederherstellung eine Boot-Warnung, damit er die fehlerhafte Konfiguration nicht blind erneut schreibt.

    Wiederherstellung:

    - Prüfen Sie `openclaw logs --follow` auf `Config auto-restored from last-known-good`, `Config write rejected:` oder `config reload restored last-known-good config`.
    - Untersuchen Sie die neueste `openclaw.json.clobbered.*` oder `openclaw.json.rejected.*` neben der aktiven Konfiguration.
    - Behalten Sie die aktive wiederhergestellte Konfiguration bei, wenn sie funktioniert, und kopieren Sie dann nur die beabsichtigten Schlüssel mit `openclaw config set` oder `config.patch` zurück.
    - Führen Sie `openclaw config validate` und `openclaw doctor` aus.
    - Wenn Sie keine letzte bekannte funktionierende oder abgelehnte Payload haben, stellen Sie sie aus einem Backup wieder her oder führen Sie `openclaw doctor` erneut aus und konfigurieren Sie Channels/Modelle neu.
    - Wenn dies unerwartet war, melden Sie einen Bug und fügen Sie Ihre letzte bekannte Konfiguration oder ein beliebiges Backup bei.
    - Ein lokaler Coding-Agent kann oft eine funktionierende Konfiguration aus Logs oder der Historie rekonstruieren.

    So vermeiden Sie es:

    - Verwenden Sie `openclaw config set` für kleine Änderungen.
    - Verwenden Sie `openclaw configure` für interaktive Änderungen.
    - Verwenden Sie zuerst `config.schema.lookup`, wenn Sie sich über einen exakten Pfad oder die Form eines Felds nicht sicher sind; es gibt einen flachen Schema-Knoten plus Zusammenfassungen der direkten Kinder für die weitere Untersuchung zurück.
    - Verwenden Sie `config.patch` für partielle RPC-Bearbeitungen; reservieren Sie `config.apply` nur für den Ersatz der vollständigen Konfiguration.
    - Wenn Sie das nur für Owner verfügbare Tool `gateway` aus einem Agent-Lauf verwenden, lehnt es weiterhin Schreibvorgänge an `tools.exec.ask` / `tools.exec.security` ab (einschließlich Legacy-Aliassen `tools.bash.*`, die auf dieselben geschützten Exec-Pfade normalisiert werden).

    Dokumentation: [Config](/de/cli/config), [Configure](/de/cli/configure), [Gateway troubleshooting](/de/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/de/gateway/doctor).

  </Accordion>

  <Accordion title="Wie betreibe ich ein zentrales Gateway mit spezialisierten Workern über mehrere Geräte hinweg?">
    Das übliche Muster ist **ein Gateway** (z. B. Raspberry Pi) plus **Nodes** und **Agents**:

    - **Gateway (zentral):** verwaltet Channels (Signal/WhatsApp), Routing und Sessions.
    - **Nodes (Geräte):** Macs/iOS/Android verbinden sich als Peripheriegeräte und stellen lokale Tools bereit (`system.run`, `canvas`, `camera`).
    - **Agents (Worker):** separate Gehirne/Workspaces für spezielle Rollen (z. B. "Hetzner ops", "Personal data").
    - **Sub-Agents:** starten Hintergrundarbeit von einem Haupt-Agent aus, wenn Sie Parallelität möchten.
    - **TUI:** mit dem Gateway verbinden und zwischen Agents/Sessions wechseln.

    Dokumentation: [Nodes](/de/nodes), [Remote access](/de/gateway/remote), [Multi-Agent Routing](/de/concepts/multi-agent), [Sub-agents](/de/tools/subagents), [TUI](/de/web/tui).

  </Accordion>

  <Accordion title="Kann der OpenClaw-Browser headless laufen?">
    Ja. Es ist eine Konfigurationsoption:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    Standard ist `false` (mit sichtbarem Browserfenster). Headless löst auf manchen Websites eher Anti-Bot-Prüfungen aus. Siehe [Browser](/de/tools/browser).

    Headless verwendet **dieselbe Chromium-Engine** und funktioniert für die meisten Automatisierungen (Formulare, Klicks, Scraping, Logins). Die wichtigsten Unterschiede:

    - Kein sichtbares Browserfenster (verwenden Sie Screenshots, wenn Sie eine visuelle Darstellung benötigen).
    - Manche Websites reagieren im Headless-Modus strenger auf Automatisierung (CAPTCHAs, Anti-Bot).
      Zum Beispiel blockiert X/Twitter häufig Headless-Sessions.

  </Accordion>

  <Accordion title="Wie verwende ich Brave für Browser-Steuerung?">
    Setzen Sie `browser.executablePath` auf Ihre Brave-Binärdatei (oder einen anderen Chromium-basierten Browser) und starten Sie das Gateway neu.
    Die vollständigen Konfigurationsbeispiele finden Sie unter [Browser](/de/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Remote-Gateways und Nodes

<AccordionGroup>
  <Accordion title="Wie werden Befehle zwischen Telegram, dem Gateway und Nodes weitergegeben?">
    Telegram-Nachrichten werden vom **Gateway** verarbeitet. Das Gateway führt den Agent aus und
    ruft erst dann Nodes über den **Gateway-WebSocket** auf, wenn ein Node-Tool benötigt wird:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes sehen keinen eingehenden Provider-Verkehr; sie empfangen nur Node-RPC-Aufrufe.

  </Accordion>

  <Accordion title="Wie kann mein Agent auf meinen Computer zugreifen, wenn das Gateway remote gehostet wird?">
    Kurze Antwort: **Koppeln Sie Ihren Computer als Node**. Das Gateway läuft anderswo, kann aber
    `node.*`-Tools (Bildschirm, Kamera, System) auf Ihrem lokalen Rechner über den Gateway-WebSocket aufrufen.

    Typisches Setup:

    1. Führen Sie das Gateway auf dem immer aktiven Host aus (VPS/Home-Server).
    2. Bringen Sie den Gateway-Host und Ihren Computer in dasselbe Tailnet.
    3. Stellen Sie sicher, dass der Gateway-WS erreichbar ist (Tailnet-Bind oder SSH-Tunnel).
    4. Öffnen Sie lokal die macOS-App und verbinden Sie sich im Modus **Remote over SSH** (oder direkt über Tailnet),
       damit sie sich als Node registrieren kann.
    5. Genehmigen Sie den Node auf dem Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Es ist keine separate TCP-Bridge erforderlich; Nodes verbinden sich über den Gateway-WebSocket.

    Sicherheitshinweis: Das Koppeln eines macOS-Node ermöglicht `system.run` auf diesem Rechner. Koppeln Sie nur
    Geräte, denen Sie vertrauen, und lesen Sie [Security](/de/gateway/security).

    Dokumentation: [Nodes](/de/nodes), [Gateway protocol](/de/gateway/protocol), [macOS remote mode](/de/platforms/mac/remote), [Security](/de/gateway/security).

  </Accordion>

  <Accordion title="Tailscale ist verbunden, aber ich erhalte keine Antworten. Was nun?">
    Prüfen Sie die Grundlagen:

    - Gateway läuft: `openclaw gateway status`
    - Gateway-Health: `openclaw status`
    - Channel-Health: `openclaw channels status`

    Prüfen Sie dann Authentifizierung und Routing:

    - Wenn Sie Tailscale Serve verwenden, stellen Sie sicher, dass `gateway.auth.allowTailscale` korrekt gesetzt ist.
    - Wenn Sie sich über einen SSH-Tunnel verbinden, bestätigen Sie, dass der lokale Tunnel aktiv ist und auf den richtigen Port zeigt.
    - Bestätigen Sie, dass Ihre Allowlists (DM oder Gruppe) Ihr Konto einschließen.

    Dokumentation: [Tailscale](/de/gateway/tailscale), [Remote access](/de/gateway/remote), [Channels](/de/channels).

  </Accordion>

  <Accordion title="Können zwei OpenClaw-Instanzen miteinander kommunizieren (lokal + VPS)?">
    Ja. Es gibt keine integrierte "Bot-zu-Bot"-Bridge, aber Sie können dies auf einige
    zuverlässige Arten umsetzen:

    **Am einfachsten:** Verwenden Sie einen normalen Chat-Channel, auf den beide Bots zugreifen können (Telegram/Slack/WhatsApp).
    Lassen Sie Bot A eine Nachricht an Bot B senden und Bot B dann wie gewohnt antworten.

    **CLI-Bridge (generisch):** Führen Sie ein Skript aus, das das andere Gateway mit
    `openclaw agent --message ... --deliver` aufruft und dabei auf einen Chat zielt, in dem der andere Bot
    lauscht. Wenn ein Bot auf einem Remote-VPS läuft, richten Sie Ihre CLI auf dieses Remote-Gateway
    über SSH/Tailscale aus (siehe [Remote access](/de/gateway/remote)).

    Beispielmuster (von einem Rechner ausführen, der das Ziel-Gateway erreichen kann):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Tipp: Fügen Sie eine Leitplanke hinzu, damit die beiden Bots nicht endlos in Schleifen geraten (nur bei Erwähnung, Channel-
    Allowlists oder eine Regel "nicht auf Bot-Nachrichten antworten").

    Dokumentation: [Remote access](/de/gateway/remote), [Agent CLI](/de/cli/agent), [Agent send](/de/tools/agent-send).

  </Accordion>

  <Accordion title="Brauche ich für mehrere Agents separate VPSes?">
    Nein. Ein Gateway kann mehrere Agents hosten, jeweils mit eigenem Workspace, Standardmodellen
    und Routing. Das ist das normale Setup und viel günstiger und einfacher, als
    einen VPS pro Agent zu betreiben.

    Verwenden Sie separate VPSes nur dann, wenn Sie harte Isolation (Sicherheitsgrenzen) oder sehr
    unterschiedliche Konfigurationen benötigen, die Sie nicht gemeinsam nutzen möchten. Andernfalls behalten Sie ein Gateway und
    verwenden mehrere Agents oder Sub-Agents.

  </Accordion>

  <Accordion title="Gibt es einen Vorteil, einen Node auf meinem persönlichen Laptop zu verwenden statt SSH von einem VPS aus?">
    Ja - Nodes sind der erstklassige Weg, Ihren Laptop von einem Remote-Gateway aus zu erreichen, und sie
    ermöglichen mehr als nur Shell-Zugriff. Das Gateway läuft auf macOS/Linux (Windows über WSL2) und ist
    leichtgewichtig (ein kleiner VPS oder ein Raspberry-Pi-ähnlicher Rechner reicht aus; 4 GB RAM sind reichlich), daher ist ein typisches
    Setup ein immer aktiver Host plus Ihr Laptop als Node.

    - **Kein eingehendes SSH erforderlich.** Nodes verbinden sich ausgehend mit dem Gateway-WebSocket und verwenden Device-Pairing.
    - **Sicherere Ausführungskontrollen.** `system.run` wird auf diesem Laptop durch Node-Allowlists/-Genehmigungen gesteuert.
    - **Mehr Geräte-Tools.** Nodes stellen zusätzlich zu `system.run` auch `canvas`, `camera` und `screen` bereit.
    - **Lokale Browser-Automatisierung.** Behalten Sie das Gateway auf einem VPS, führen Sie Chrome aber lokal über einen Node-Host auf dem Laptop aus oder verbinden Sie sich über Chrome MCP mit lokalem Chrome auf dem Host.

    SSH ist für ad-hoc-Shell-Zugriff in Ordnung, aber Nodes sind für laufende Agent-Workflows und
    Geräteautomatisierung einfacher.

    Dokumentation: [Nodes](/de/nodes), [Nodes CLI](/de/cli/nodes), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Führen Nodes einen Gateway-Service aus?">
    Nein. Pro Host sollte nur **ein Gateway** laufen, es sei denn, Sie betreiben absichtlich isolierte Profile (siehe [Multiple gateways](/de/gateway/multiple-gateways)). Nodes sind Peripheriegeräte, die sich
    mit dem Gateway verbinden (iOS-/Android-Nodes oder der macOS-"Node-Modus" in der Menüleisten-App). Für headless Node-
    Hosts und CLI-Steuerung siehe [Node host CLI](/de/cli/node).

    Für Änderungen an `gateway`, `discovery` und `canvasHost` ist ein vollständiger Neustart erforderlich.

  </Accordion>

  <Accordion title="Gibt es eine API-/RPC-Möglichkeit, Konfiguration anzuwenden?">
    Ja.

    - `config.schema.lookup`: einen Konfigurations-Teilbaum mit seinem flachen Schema-Knoten, passendem UI-Hinweis und Zusammenfassungen der direkten Kinder prüfen, bevor geschrieben wird
    - `config.get`: den aktuellen Snapshot + Hash abrufen
    - `config.patch`: sicheres partielles Update (für die meisten RPC-Bearbeitungen bevorzugt); lädt hot neu, wenn möglich, und startet neu, wenn erforderlich
    - `config.apply`: validiert + ersetzt die vollständige Konfiguration; lädt hot neu, wenn möglich, und startet neu, wenn erforderlich
    - Das nur für Owner verfügbare Runtime-Tool `gateway` verweigert weiterhin das Umschreiben von `tools.exec.ask` / `tools.exec.security`; Legacy-Aliasse `tools.bash.*` werden auf dieselben geschützten Exec-Pfade normalisiert

  </Accordion>

  <Accordion title="Minimal sinnvolle Konfiguration für eine Erstinstallation">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Dadurch wird Ihr Workspace festgelegt und eingeschränkt, wer den Bot auslösen kann.

  </Accordion>

  <Accordion title="Wie richte ich Tailscale auf einem VPS ein und verbinde mich von meinem Mac aus?">
    Minimale Schritte:

    1. **Auf dem VPS installieren + anmelden**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Auf Ihrem Mac installieren + anmelden**
       - Verwenden Sie die Tailscale-App und melden Sie sich im selben Tailnet an.
    3. **MagicDNS aktivieren (empfohlen)**
       - Aktivieren Sie in der Tailscale-Admin-Konsole MagicDNS, damit der VPS einen stabilen Namen hat.
    4. **Den Tailnet-Hostnamen verwenden**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Wenn Sie die Control UI ohne SSH möchten, verwenden Sie Tailscale Serve auf dem VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Dadurch bleibt das Gateway an Loopback gebunden und HTTPS wird über Tailscale bereitgestellt. Siehe [Tailscale](/de/gateway/tailscale).

  </Accordion>

  <Accordion title="Wie verbinde ich einen Mac-Node mit einem Remote-Gateway (Tailscale Serve)?">
    Serve stellt die **Gateway Control UI + WS** bereit. Nodes verbinden sich über denselben Gateway-WS-Endpunkt.

    Empfohlenes Setup:

    1. **Stellen Sie sicher, dass VPS + Mac im selben Tailnet sind**.
    2. **Verwenden Sie die macOS-App im Remote-Modus** (das SSH-Ziel kann der Tailnet-Hostname sein).
       Die App tunnelt dann den Gateway-Port und verbindet sich als Node.
    3. **Genehmigen Sie den Node** auf dem Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentation: [Gateway protocol](/de/gateway/protocol), [Discovery](/de/gateway/discovery), [macOS remote mode](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Soll ich auf einem zweiten Laptop installieren oder einfach einen Node hinzufügen?">
    Wenn Sie auf dem zweiten Laptop nur **lokale Tools** (Bildschirm/Kamera/Exec) benötigen, fügen Sie ihn als
    **Node** hinzu. Dadurch behalten Sie ein einzelnes Gateway und vermeiden doppelte Konfiguration. Lokale Node-Tools sind
    derzeit nur unter macOS verfügbar, aber wir planen, sie auf andere Betriebssysteme auszuweiten.

    Installieren Sie ein zweites Gateway nur dann, wenn Sie **harte Isolation** oder zwei vollständig getrennte Bots benötigen.

    Dokumentation: [Nodes](/de/nodes), [Nodes CLI](/de/cli/nodes), [Multiple gateways](/de/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Umgebungsvariablen und Laden von .env

<AccordionGroup>
  <Accordion title="Wie lädt OpenClaw Umgebungsvariablen?">
    OpenClaw liest Umgebungsvariablen aus dem Elternprozess (Shell, launchd/systemd, CI usw.) und lädt zusätzlich:

    - `.env` aus dem aktuellen Arbeitsverzeichnis
    - ein globales Fallback-`.env` aus `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`)

    Keine der beiden `.env`-Dateien überschreibt vorhandene Umgebungsvariablen.

    Sie können Inline-Umgebungsvariablen auch in der Konfiguration definieren (werden nur angewendet, wenn sie im Prozess-Env fehlen):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Siehe [/environment](/de/help/environment) für vollständige Priorität und Quellen.

  </Accordion>

  <Accordion title="Ich habe das Gateway über den Service gestartet und meine Umgebungsvariablen sind verschwunden. Was nun?">
    Zwei häufige Lösungen:

    1. Legen Sie die fehlenden Schlüssel in `~/.openclaw/.env` ab, damit sie auch dann übernommen werden, wenn der Service Ihre Shell-Umgebung nicht erbt.
    2. Aktivieren Sie den Shell-Import (optionale Komfortfunktion):

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    Dadurch wird Ihre Login-Shell ausgeführt und nur fehlende erwartete Schlüssel werden importiert (niemals überschrieben). Entsprechende Umgebungsvariablen:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ich habe COPILOT_GITHUB_TOKEN gesetzt, aber models status zeigt "Shell env: off." Warum?'>
    `openclaw models status` meldet, ob **Shell-Env-Import** aktiviert ist. "Shell env: off"
    bedeutet **nicht**, dass Ihre Umgebungsvariablen fehlen - es bedeutet nur, dass OpenClaw
    Ihre Login-Shell nicht automatisch lädt.

    Wenn das Gateway als Service läuft (launchd/systemd), erbt es Ihre Shell-
    Umgebung nicht. Beheben Sie das auf eine dieser Arten:

    1. Legen Sie das Token in `~/.openclaw/.env` ab:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Oder aktivieren Sie den Shell-Import (`env.shellEnv.enabled: true`).
    3. Oder fügen Sie es in Ihrem `env`-Block der Konfiguration hinzu (wird nur angewendet, wenn es fehlt).

    Starten Sie dann das Gateway neu und prüfen Sie erneut:

    ```bash
    openclaw models status
    ```

    Copilot-Tokens werden aus `COPILOT_GITHUB_TOKEN` gelesen (auch `GH_TOKEN` / `GITHUB_TOKEN`).
    Siehe [/concepts/model-providers](/de/concepts/model-providers) und [/environment](/de/help/environment).

  </Accordion>
</AccordionGroup>

## Sessions und mehrere Chats

<AccordionGroup>
  <Accordion title="Wie starte ich eine neue Unterhaltung?">
    Senden Sie `/new` oder `/reset` als eigenständige Nachricht. Siehe [Session management](/de/concepts/session).
  </Accordion>

  <Accordion title="Werden Sessions automatisch zurückgesetzt, wenn ich nie /new sende?">
    Sessions können nach `session.idleMinutes` ablaufen, aber dies ist **standardmäßig deaktiviert** (Standard **0**).
    Setzen Sie es auf einen positiven Wert, um den Ablauf bei Inaktivität zu aktivieren. Wenn aktiviert, startet die **nächste**
    Nachricht nach der Inaktivitätszeit eine frische Session-ID für diesen Chat-Schlüssel.
    Dadurch werden Transkripte nicht gelöscht - es wird nur eine neue Session gestartet.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Gibt es eine Möglichkeit, ein Team von OpenClaw-Instanzen zu bilden (ein CEO und viele Agents)?">
    Ja, über **Multi-Agent-Routing** und **Sub-Agents**. Sie können einen koordinierenden
    Agent und mehrere Worker-Agents mit ihren eigenen Workspaces und Modellen erstellen.

    Das sollte allerdings eher als **unterhaltsames Experiment** gesehen werden. Es ist tokenintensiv und oft
    weniger effizient, als einen Bot mit getrennten Sessions zu verwenden. Das typische Modell, das wir
    uns vorstellen, ist ein Bot, mit dem Sie sprechen, mit verschiedenen Sessions für parallele Arbeit. Dieser
    Bot kann bei Bedarf auch Sub-Agents starten.

    Dokumentation: [Multi-agent routing](/de/concepts/multi-agent), [Sub-agents](/de/tools/subagents), [Agents CLI](/de/cli/agents).

  </Accordion>

  <Accordion title="Warum wurde der Kontext mitten in einer Aufgabe abgeschnitten? Wie verhindere ich das?">
    Der Session-Kontext ist durch das Modellfenster begrenzt. Lange Chats, große Tool-Ausgaben oder viele
    Dateien können Compaction oder Abschneidung auslösen.

    Hilfreich ist:

    - Bitten Sie den Bot, den aktuellen Stand zusammenzufassen und in eine Datei zu schreiben.
    - Verwenden Sie `/compact` vor langen Aufgaben und `/new` beim Themenwechsel.
    - Behalten Sie wichtige Kontexte im Workspace und bitten Sie den Bot, sie erneut einzulesen.
    - Verwenden Sie Sub-Agents für lange oder parallele Arbeit, damit der Hauptchat kleiner bleibt.
    - Wählen Sie ein Modell mit größerem Kontextfenster, wenn dies häufig vorkommt.

  </Accordion>

  <Accordion title="Wie setze ich OpenClaw vollständig zurück, behalte es aber installiert?">
    Verwenden Sie den Reset-Befehl:

    ```bash
    openclaw reset
    ```

    Nicht-interaktiver vollständiger Reset:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Führen Sie dann das Setup erneut aus:

    ```bash
    openclaw onboard --install-daemon
    ```

    Hinweise:

    - Onboarding bietet ebenfalls **Reset** an, wenn eine vorhandene Konfiguration erkannt wird. Siehe [Onboarding (CLI)](/de/start/wizard).
    - Wenn Sie Profile verwendet haben (`--profile` / `OPENCLAW_PROFILE`), setzen Sie jedes Statusverzeichnis zurück (Standard ist `~/.openclaw-<profile>`).
    - Dev-Reset: `openclaw gateway --dev --reset` (nur Dev; löscht Dev-Konfiguration + Anmeldedaten + Sessions + Workspace).

  </Accordion>

  <Accordion title='Ich erhalte "context too large"-Fehler - wie setze ich zurück oder kompaktifiziere ich?'>
    Verwenden Sie eine dieser Optionen:

    - **Compaction** (behält die Unterhaltung bei, fasst aber ältere Turns zusammen):

      ```
      /compact
      ```

      oder `/compact <instructions>`, um die Zusammenfassung zu steuern.

    - **Zurücksetzen** (frische Session-ID für denselben Chat-Schlüssel):

      ```
      /new
      /reset
      ```

    Wenn das weiterhin passiert:

    - Aktivieren oder optimieren Sie **Session-Pruning** (`agents.defaults.contextPruning`), um alte Tool-Ausgaben zu kürzen.
    - Verwenden Sie ein Modell mit größerem Kontextfenster.

    Dokumentation: [Compaction](/de/concepts/compaction), [Session pruning](/de/concepts/session-pruning), [Session management](/de/concepts/session).

  </Accordion>

  <Accordion title='Warum sehe ich "LLM request rejected: messages.content.tool_use.input field required"?'>
    Dies ist ein Validierungsfehler des Providers: Das Modell hat einen `tool_use`-Block ohne das erforderliche
    `input` ausgegeben. Das bedeutet in der Regel, dass die Session-Historie veraltet oder beschädigt ist (oft nach langen Threads
    oder einer Tool-/Schema-Änderung).

    Lösung: Starten Sie mit `/new` (eigenständige Nachricht) eine frische Session.

  </Accordion>

  <Accordion title="Warum erhalte ich alle 30 Minuten Heartbeat-Nachrichten?">
    Heartbeats laufen standardmäßig alle **30m** (**1h** bei OAuth-Authentifizierung). Sie können sie anpassen oder deaktivieren:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // oder "0m" zum Deaktivieren
          },
        },
      },
    }
    ```

    Wenn `HEARTBEAT.md` existiert, aber praktisch leer ist (nur Leerzeilen und Markdown-
    Überschriften wie `# Heading`), überspringt OpenClaw den Heartbeat-Lauf, um API-Aufrufe zu sparen.
    Wenn die Datei fehlt, läuft der Heartbeat trotzdem und das Modell entscheidet, was zu tun ist.

    Overrides pro Agent verwenden `agents.list[].heartbeat`. Dokumentation: [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title='Muss ich ein "Bot-Konto" zu einer WhatsApp-Gruppe hinzufügen?'>
    Nein. OpenClaw läuft auf **Ihrem eigenen Konto**, daher kann OpenClaw die Gruppe sehen, wenn Sie in ihr sind.
    Standardmäßig sind Antworten in Gruppen blockiert, bis Sie Absender erlauben (`groupPolicy: "allowlist"`).

    Wenn Sie möchten, dass nur **Sie** Gruppenantworten auslösen können:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Wie erhalte ich die JID einer WhatsApp-Gruppe?">
    Option 1 (am schnellsten): Verfolgen Sie die Logs und senden Sie eine Testnachricht in die Gruppe:

    ```bash
    openclaw logs --follow --json
    ```

    Achten Sie auf `chatId` (oder `from`), das auf `@g.us` endet, z. B.:
    `1234567890-1234567890@g.us`.

    Option 2 (wenn bereits konfiguriert/allowgelistet): Gruppen aus der Konfiguration auflisten:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentation: [WhatsApp](/de/channels/whatsapp), [Directory](/de/cli/directory), [Logs](/de/cli/logs).

  </Accordion>

  <Accordion title="Warum antwortet OpenClaw nicht in einer Gruppe?">
    Zwei häufige Ursachen:

    - Mention-Gating ist aktiviert (Standard). Sie müssen den Bot per @mention erwähnen (oder `mentionPatterns` treffen).
    - Sie haben `channels.whatsapp.groups` ohne `"*"` konfiguriert und die Gruppe ist nicht in der Allowlist.

    Siehe [Groups](/de/channels/groups) und [Group messages](/de/channels/group-messages).

  </Accordion>

  <Accordion title="Teilen Gruppen/Threads Kontext mit DMs?">
    Direkte Chats fallen standardmäßig in die Haupt-Session zusammen. Gruppen/Channels haben ihre eigenen Session-Schlüssel, und Telegram-Themen / Discord-Threads sind separate Sessions. Siehe [Groups](/de/channels/groups) und [Group messages](/de/channels/group-messages).
  </Accordion>

  <Accordion title="Wie viele Workspaces und Agents kann ich erstellen?">
    Keine harten Grenzen. Dutzende (sogar Hunderte) sind in Ordnung, aber achten Sie auf Folgendes:

    - **Wachsender Speicherbedarf:** Sessions + Transkripte liegen unter `~/.openclaw/agents/<agentId>/sessions/`.
    - **Token-Kosten:** Mehr Agents bedeuten mehr gleichzeitige Modellnutzung.
    - **Betriebsaufwand:** Auth-Profile, Workspaces und Channel-Routing pro Agent.

    Tipps:

    - Behalten Sie einen **aktiven** Workspace pro Agent (`agents.defaults.workspace`).
    - Bereinigen Sie alte Sessions (löschen Sie JSONL- oder Store-Einträge), wenn der Speicherbedarf wächst.
    - Verwenden Sie `openclaw doctor`, um verstreute Workspaces und Profilabweichungen zu erkennen.

  </Accordion>

  <Accordion title="Kann ich mehrere Bots oder Chats gleichzeitig ausführen (Slack), und wie sollte ich das einrichten?">
    Ja. Verwenden Sie **Multi-Agent Routing**, um mehrere isolierte Agents auszuführen und eingehende Nachrichten nach
    Channel/Konto/Peer zu routen. Slack wird als Channel unterstützt und kann an bestimmte Agents gebunden werden.

    Browser-Zugriff ist leistungsfähig, aber nicht gleichbedeutend mit "alles tun, was ein Mensch kann" - Anti-Bot, CAPTCHAs und MFA können
    die Automatisierung weiterhin blockieren. Für die zuverlässigste Browser-Steuerung verwenden Sie lokales Chrome MCP auf dem Host,
    oder CDP auf dem Rechner, auf dem der Browser tatsächlich läuft.

    Best-Practice-Setup:

    - Immer aktiver Gateway-Host (VPS/Mac mini).
    - Ein Agent pro Rolle (Bindings).
    - Slack-Channel(s), die an diese Agents gebunden sind.
    - Lokaler Browser über Chrome MCP oder bei Bedarf ein Node.

    Dokumentation: [Multi-Agent Routing](/de/concepts/multi-agent), [Slack](/de/channels/slack),
    [Browser](/de/tools/browser), [Nodes](/de/nodes).

  </Accordion>
</AccordionGroup>

## Modelle, Failover und Auth-Profile

Fragen und Antworten zu Modellen — Standardwerte, Auswahl, Aliasse, Wechsel, Failover, Auth-Profile —
finden Sie in der [Models FAQ](/de/help/faq-models).

## Gateway: Ports, „bereits läuft“ und Remote-Modus

<AccordionGroup>
  <Accordion title="Welchen Port verwendet das Gateway?">
    `gateway.port` steuert den einzelnen multiplexierten Port für WebSocket + HTTP (Control UI, Hooks usw.).

    Priorität:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > Standard 18789
    ```

  </Accordion>

  <Accordion title='Warum zeigt openclaw gateway status "Runtime: running", aber "Connectivity probe: failed" an?'>
    Weil "running" die Sicht des **Supervisors** ist (launchd/systemd/schtasks). Der Connectivity-Probe ist die tatsächliche Verbindung der CLI mit dem Gateway-WebSocket.

    Verwenden Sie `openclaw gateway status` und verlassen Sie sich auf diese Zeilen:

    - `Probe target:` (die URL, die der Probe tatsächlich verwendet hat)
    - `Listening:` (was tatsächlich auf dem Port gebunden ist)
    - `Last gateway error:` (häufige Grundursache, wenn der Prozess lebt, aber der Port nicht lauscht)

  </Accordion>

  <Accordion title='Warum zeigt openclaw gateway status bei "Config (cli)" und "Config (service)" unterschiedliche Werte an?'>
    Sie bearbeiten eine Konfigurationsdatei, während der Service eine andere verwendet (häufig eine Abweichung bei `--profile` / `OPENCLAW_STATE_DIR`).

    Lösung:

    ```bash
    openclaw gateway install --force
    ```

    Führen Sie dies aus derselben `--profile`-/Umgebung aus, die der Service verwenden soll.

  </Accordion>

  <Accordion title='Was bedeutet "another gateway instance is already listening"?'>
    OpenClaw erzwingt eine Laufzeitsperre, indem der WebSocket-Listener beim Start sofort gebunden wird (Standard `ws://127.0.0.1:18789`). Wenn das Binden mit `EADDRINUSE` fehlschlägt, wird `GatewayLockError` ausgelöst, was bedeutet, dass bereits eine andere Instanz lauscht.

    Lösung: Stoppen Sie die andere Instanz, geben Sie den Port frei oder starten Sie mit `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Wie betreibe ich OpenClaw im Remote-Modus (Client verbindet sich mit einem Gateway an einem anderen Ort)?">
    Setzen Sie `gateway.mode: "remote"` und verweisen Sie auf eine Remote-WebSocket-URL, optional mit Shared-Secret-Remote-Anmeldedaten:

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    Hinweise:

    - `openclaw gateway` startet nur, wenn `gateway.mode` auf `local` gesetzt ist (oder wenn Sie das Override-Flag übergeben).
    - Die macOS-App überwacht die Konfigurationsdatei und wechselt live den Modus, wenn sich diese Werte ändern.
    - `gateway.remote.token` / `.password` sind nur clientseitige Remote-Anmeldedaten; sie aktivieren nicht von sich aus lokale Gateway-Authentifizierung.

  </Accordion>

  <Accordion title='Die Control UI zeigt "unauthorized" an (oder verbindet sich ständig neu). Was nun?'>
    Ihr Gateway-Auth-Pfad und die Auth-Methode der UI stimmen nicht überein.

    Fakten (aus dem Code):

    - Die Control UI speichert das Token in `sessionStorage` für die aktuelle Browser-Tab-Session und die ausgewählte Gateway-URL, sodass Aktualisierungen im selben Tab weiterhin funktionieren, ohne langlebige Token-Persistenz in `localStorage` wiederherzustellen.
    - Bei `AUTH_TOKEN_MISMATCH` können vertrauenswürdige Clients einen begrenzten Wiederholungsversuch mit einem zwischengespeicherten Device-Token unternehmen, wenn das Gateway Hinweise zur Wiederholung zurückgibt (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Dieser Wiederholungsversuch mit zwischengespeichertem Token verwendet nun die zwischengespeicherten genehmigten Scopes wieder, die mit dem Device-Token gespeichert wurden. Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten weiterhin ihren angeforderten Scope-Satz, statt zwischengespeicherte Scopes zu übernehmen.
    - Außerhalb dieses Wiederholungspfads ist die Priorität für Connect-Authentifizierung explizites Shared Token/Passwort zuerst, dann explizites `deviceToken`, dann gespeichertes Device-Token, dann Bootstrap-Token.
    - Scope-Prüfungen für Bootstrap-Tokens sind rollenpräfigiert. Die integrierte Allowlist für Bootstrap-Operatoren erfüllt nur Operator-Anfragen; Node- oder andere nicht-Operator-Rollen benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.

    Lösung:

    - Am schnellsten: `openclaw dashboard` (gibt die Dashboard-URL aus und kopiert sie, versucht sie zu öffnen; zeigt bei headless einen SSH-Hinweis).
    - Wenn Sie noch kein Token haben: `openclaw doctor --generate-gateway-token`.
    - Wenn remote, zuerst tunneln: `ssh -N -L 18789:127.0.0.1:18789 user@host` und dann `http://127.0.0.1:18789/` öffnen.
    - Shared-Secret-Modus: Setzen Sie `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` oder `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` und fügen Sie dann das passende Secret in die Einstellungen der Control UI ein.
    - Tailscale-Serve-Modus: Stellen Sie sicher, dass `gateway.auth.allowTailscale` aktiviert ist und Sie die Serve-URL öffnen, nicht eine rohe Loopback-/Tailnet-URL, die die Tailscale-Identity-Header umgeht.
    - Trusted-proxy-Modus: Stellen Sie sicher, dass Sie über den konfigurierten nicht-Loopback Identity-aware Proxy kommen, nicht über einen Loopback-Proxy auf demselben Host oder eine rohe Gateway-URL.
    - Wenn die Abweichung nach dem einen Wiederholungsversuch bestehen bleibt, rotieren/genehmigen Sie das gekoppelte Device-Token neu:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Wenn dieser Rotate-Aufruf sagt, dass er abgelehnt wurde, prüfen Sie zwei Dinge:
      - Sitzungen mit gekoppelten Geräten können nur ihr **eigenes** Device rotieren, es sei denn, sie haben zusätzlich `operator.admin`
      - explizite `--scope`-Werte dürfen die aktuellen Operator-Scopes des Aufrufers nicht überschreiten
    - Immer noch blockiert? Führen Sie `openclaw status --all` aus und folgen Sie [Troubleshooting](/de/gateway/troubleshooting). Siehe [Dashboard](/de/web/dashboard) für Details zur Authentifizierung.

  </Accordion>

  <Accordion title="Ich habe gateway.bind tailnet gesetzt, aber es kann nicht binden und nichts lauscht">
    `tailnet`-Bind wählt eine Tailscale-IP aus Ihren Netzwerkschnittstellen (100.64.0.0/10). Wenn der Rechner nicht in Tailscale ist (oder die Schnittstelle nicht aktiv ist), gibt es nichts, woran gebunden werden kann.

    Lösung:

    - Starten Sie Tailscale auf diesem Host (damit er eine 100.x-Adresse hat), oder
    - wechseln Sie zu `gateway.bind: "loopback"` / `"lan"`.

    Hinweis: `tailnet` ist explizit. `auto` bevorzugt Loopback; verwenden Sie `gateway.bind: "tailnet"`, wenn Sie nur an Tailnet binden möchten.

  </Accordion>

  <Accordion title="Kann ich mehrere Gateways auf demselben Host ausführen?">
    Normalerweise nein - ein Gateway kann mehrere Messaging-Channels und Agents ausführen. Verwenden Sie mehrere Gateways nur dann, wenn Sie Redundanz (z. B. Rescue-Bot) oder harte Isolation benötigen.

    Ja, aber Sie müssen isolieren:

    - `OPENCLAW_CONFIG_PATH` (Konfiguration pro Instanz)
    - `OPENCLAW_STATE_DIR` (Status pro Instanz)
    - `agents.defaults.workspace` (Workspace-Isolation)
    - `gateway.port` (eindeutige Ports)

    Schnelles Setup (empfohlen):

    - Verwenden Sie `openclaw --profile <name> ...` pro Instanz (erstellt automatisch `~/.openclaw-<name>`).
    - Setzen Sie in jeder Profilkonfiguration einen eindeutigen `gateway.port` (oder übergeben Sie `--port` für manuelle Läufe).
    - Installieren Sie einen Service pro Profil: `openclaw --profile <name> gateway install`.

    Profile hängen auch Suffixe an Servicenamen an (`ai.openclaw.<profile>`; Legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Vollständige Anleitung: [Multiple gateways](/de/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Was bedeutet "invalid handshake" / Code 1008?'>
    Das Gateway ist ein **WebSocket-Server** und erwartet, dass die allererste Nachricht
    ein `connect`-Frame ist. Wenn es etwas anderes empfängt, schließt es die Verbindung
    mit **Code 1008** (Policy-Verletzung).

    Häufige Ursachen:

    - Sie haben die **HTTP**-URL in einem Browser geöffnet (`http://...`) statt in einem WS-Client.
    - Sie haben den falschen Port oder Pfad verwendet.
    - Ein Proxy oder Tunnel hat Auth-Header entfernt oder eine Nicht-Gateway-Anfrage gesendet.

    Schnelle Lösungen:

    1. Verwenden Sie die WS-URL: `ws://<host>:18789` (oder `wss://...` bei HTTPS).
    2. Öffnen Sie den WS-Port nicht in einem normalen Browser-Tab.
    3. Wenn Auth aktiviert ist, fügen Sie das Token/Passwort im `connect`-Frame hinzu.

    Wenn Sie die CLI oder TUI verwenden, sollte die URL so aussehen:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Protokolldetails: [Gateway protocol](/de/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Logging und Debugging

<AccordionGroup>
  <Accordion title="Wo sind die Logs?">
    Dateilogs (strukturiert):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Sie können einen festen Pfad über `logging.file` festlegen. Das Dateilog-Level wird über `logging.level` gesteuert. Die Konsolen-Verbosity wird über `--verbose` und `logging.consoleLevel` gesteuert.

    Schnellster Log-Tail:

    ```bash
    openclaw logs --follow
    ```

    Service-/Supervisor-Logs (wenn das Gateway über launchd/systemd läuft):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` und `gateway.err.log` (Standard: `~/.openclaw/logs/...`; Profile verwenden `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Weitere Informationen finden Sie unter [Troubleshooting](/de/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Wie starte/stoppe/starte ich den Gateway-Service neu?">
    Verwenden Sie die Gateway-Helfer:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Wenn Sie das Gateway manuell ausführen, kann `openclaw gateway --force` den Port zurückholen. Siehe [Gateway](/de/gateway).

  </Accordion>

  <Accordion title="Ich habe mein Terminal unter Windows geschlossen - wie starte ich OpenClaw neu?">
    Es gibt **zwei Installationsmodi unter Windows**:

    **1) WSL2 (empfohlen):** Das Gateway läuft innerhalb von Linux.

    Öffnen Sie PowerShell, wechseln Sie in WSL und starten Sie dann neu:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Wenn Sie den Service nie installiert haben, starten Sie ihn im Vordergrund:

    ```bash
    openclaw gateway run
    ```

    **2) Natives Windows (nicht empfohlen):** Das Gateway läuft direkt unter Windows.

    Öffnen Sie PowerShell und führen Sie aus:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Wenn Sie es manuell ausführen (ohne Service), verwenden Sie:

    ```powershell
    openclaw gateway run
    ```

    Dokumentation: [Windows (WSL2)](/de/platforms/windows), [Gateway service runbook](/de/gateway).

  </Accordion>

  <Accordion title="Das Gateway läuft, aber Antworten kommen nie an. Was sollte ich prüfen?">
    Beginnen Sie mit einer schnellen Health-Prüfung:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Häufige Ursachen:

    - Modell-Authentifizierung ist auf dem **Gateway-Host** nicht geladen (prüfen Sie `models status`).
    - Channel-Pairing/Allowlist blockiert Antworten (prüfen Sie Channel-Konfiguration + Logs).
    - WebChat/Dashboard ist ohne das richtige Token geöffnet.

    Wenn Sie remote sind, stellen Sie sicher, dass der Tunnel/die Tailscale-Verbindung aktiv ist und der
    Gateway-WebSocket erreichbar ist.

    Dokumentation: [Channels](/de/channels), [Troubleshooting](/de/gateway/troubleshooting), [Remote access](/de/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - was nun?'>
    Das bedeutet normalerweise, dass die UI die WebSocket-Verbindung verloren hat. Prüfen Sie:

    1. Läuft das Gateway? `openclaw gateway status`
    2. Ist das Gateway gesund? `openclaw status`
    3. Hat die UI das richtige Token? `openclaw dashboard`
    4. Wenn remote: Ist der Tunnel-/Tailscale-Link aktiv?

    Folgen Sie dann den Logs:

    ```bash
    openclaw logs --follow
    ```

    Dokumentation: [Dashboard](/de/web/dashboard), [Remote access](/de/gateway/remote), [Troubleshooting](/de/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands schlägt fehl. Was sollte ich prüfen?">
    Beginnen Sie mit Logs und Channel-Status:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Vergleichen Sie dann den Fehler:

    - `BOT_COMMANDS_TOO_MUCH`: Das Telegram-Menü hat zu viele Einträge. OpenClaw kürzt bereits auf das Telegram-Limit und versucht es mit weniger Befehlen erneut, aber einige Menüeinträge müssen weiterhin entfernt werden. Reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie `channels.telegram.commands.native`, wenn Sie das Menü nicht benötigen.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` oder ähnliche Netzwerkfehler: Wenn Sie auf einem VPS oder hinter einem Proxy sind, bestätigen Sie, dass ausgehendes HTTPS erlaubt ist und DNS für `api.telegram.org` funktioniert.

    Wenn das Gateway remote ist, stellen Sie sicher, dass Sie die Logs auf dem Gateway-Host ansehen.

    Dokumentation: [Telegram](/de/channels/telegram), [Channel troubleshooting](/de/channels/troubleshooting).

  </Accordion>

  <Accordion title="Die TUI zeigt keine Ausgabe. Was sollte ich prüfen?">
    Bestätigen Sie zuerst, dass das Gateway erreichbar ist und der Agent laufen kann:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Verwenden Sie in der TUI `/status`, um den aktuellen Zustand zu sehen. Wenn Sie Antworten in einem Chat-
    Channel erwarten, stellen Sie sicher, dass die Zustellung aktiviert ist (`/deliver on`).

    Dokumentation: [TUI](/de/web/tui), [Slash commands](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Wie stoppe ich das Gateway vollständig und starte es dann erneut?">
    Wenn Sie den Service installiert haben:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Dadurch wird der **überwachte Service** gestoppt/gestartet (launchd unter macOS, systemd unter Linux).
    Verwenden Sie dies, wenn das Gateway als Daemon im Hintergrund läuft.

    Wenn Sie es im Vordergrund ausführen, stoppen Sie es mit Ctrl-C und dann:

    ```bash
    openclaw gateway run
    ```

    Dokumentation: [Gateway service runbook](/de/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: startet den **Hintergrund-Service** neu (launchd/systemd).
    - `openclaw gateway`: führt das Gateway **im Vordergrund** für diese Terminal-Sitzung aus.

    Wenn Sie den Service installiert haben, verwenden Sie die Gateway-Befehle. Verwenden Sie `openclaw gateway`, wenn
    Sie einen einmaligen Lauf im Vordergrund möchten.

  </Accordion>

  <Accordion title="Schnellster Weg, mehr Details zu erhalten, wenn etwas fehlschlägt">
    Starten Sie das Gateway mit `--verbose`, um mehr Details in der Konsole zu erhalten. Prüfen Sie dann die Logdatei auf Channel-Authentifizierung, Modell-Routing und RPC-Fehler.
  </Accordion>
</AccordionGroup>

## Medien und Anhänge

<AccordionGroup>
  <Accordion title="Mein Skill hat ein Bild/PDF erzeugt, aber nichts wurde gesendet">
    Ausgehende Anhänge vom Agent müssen eine Zeile `MEDIA:<path-or-url>` enthalten (in einer eigenen Zeile). Siehe [OpenClaw assistant setup](/de/start/openclaw) und [Agent send](/de/tools/agent-send).

    Senden per CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Prüfen Sie außerdem:

    - Der Ziel-Channel unterstützt ausgehende Medien und wird nicht durch Allowlists blockiert.
    - Die Datei liegt innerhalb der Größenlimits des Providers (Bilder werden auf maximal 2048px skaliert).
    - `tools.fs.workspaceOnly=true` beschränkt das Senden lokaler Pfade auf Workspace, temp/media-store und Sandbox-validierte Dateien.
    - `tools.fs.workspaceOnly=false` erlaubt `MEDIA:`, hostlokale Dateien zu senden, die der Agent bereits lesen kann, aber nur für Medien plus sichere Dokumenttypen (Bilder, Audio, Video, PDF und Office-Dokumente). Klartext- und Secret-ähnliche Dateien bleiben weiterhin blockiert.

    Siehe [Images](/de/nodes/images).

  </Accordion>
</AccordionGroup>

## Sicherheit und Zugriffskontrolle

<AccordionGroup>
  <Accordion title="Ist es sicher, OpenClaw für eingehende DMs freizugeben?">
    Behandeln Sie eingehende DMs als nicht vertrauenswürdige Eingabe. Die Standardwerte sind darauf ausgelegt, das Risiko zu verringern:

    - Standardverhalten auf DM-fähigen Channels ist **Pairing**:
      - Unbekannte Absender erhalten einen Pairing-Code; der Bot verarbeitet ihre Nachricht nicht.
      - Genehmigen mit: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Ausstehende Anfragen sind auf **3 pro Channel** begrenzt; prüfen Sie `openclaw pairing list --channel <channel> [--account <id>]`, wenn kein Code angekommen ist.
    - Das öffentliche Öffnen von DMs erfordert explizites Opt-in (`dmPolicy: "open"` und Allowlist `"*"`).

    Führen Sie `openclaw doctor` aus, um riskante DM-Richtlinien sichtbar zu machen.

  </Accordion>

  <Accordion title="Ist Prompt Injection nur für öffentliche Bots ein Problem?">
    Nein. Prompt Injection betrifft **nicht vertrauenswürdige Inhalte**, nicht nur die Frage, wer dem Bot eine DM senden kann.
    Wenn Ihr Assistent externe Inhalte liest (Websuche/-Fetch, Browser-Seiten, E-Mails,
    Dokumente, Anhänge, eingefügte Logs), können diese Inhalte Anweisungen enthalten, die versuchen,
    das Modell zu kapern. Das kann selbst dann passieren, wenn **Sie der einzige Absender** sind.

    Das größte Risiko besteht, wenn Tools aktiviert sind: Das Modell kann dazu verleitet werden,
    Kontext zu exfiltrieren oder Tools in Ihrem Namen aufzurufen. Verringern Sie den Schadenradius durch:

    - Verwendung eines schreibgeschützten oder Tool-deaktivierten "Reader"-Agent, um nicht vertrauenswürdige Inhalte zusammenzufassen
    - `web_search` / `web_fetch` / `browser` für Tool-aktivierte Agents deaktiviert lassen
    - auch dekodierten Datei-/Dokumenttext als nicht vertrauenswürdig behandeln: OpenResponses
      `input_file` und Media-Attachment-Extraktion umschließen extrahierten Text beide mit
      expliziten Markern für externe Inhaltsgrenzen, statt rohen Dateitext durchzureichen
    - Sandboxing und strikte Tool-Allowlists

    Details: [Security](/de/gateway/security).

  </Accordion>

  <Accordion title="Sollte mein Bot ein eigenes E-Mail-Konto, GitHub-Konto oder eine eigene Telefonnummer haben?">
    Ja, für die meisten Setups. Die Isolation des Bots mit separaten Konten und Telefonnummern
    verringert den Schadenradius, falls etwas schiefläuft. Das macht es auch einfacher,
    Anmeldedaten zu rotieren oder Zugriff zu widerrufen, ohne Ihre persönlichen Konten zu beeinträchtigen.

    Beginnen Sie klein. Geben Sie nur Zugriff auf die Tools und Konten, die Sie tatsächlich benötigen, und erweitern Sie
    später bei Bedarf.

    Dokumentation: [Security](/de/gateway/security), [Pairing](/de/channels/pairing).

  </Accordion>

  <Accordion title="Kann ich ihm Autonomie über meine Textnachrichten geben und ist das sicher?">
    Wir empfehlen **keine** vollständige Autonomie über Ihre persönlichen Nachrichten. Das sicherste Muster ist:

    - DMs im **Pairing-Modus** oder in einer engen Allowlist belassen.
    - Eine **separate Nummer oder ein separates Konto** verwenden, wenn es in Ihrem Namen Nachrichten senden soll.
    - Es entwerfen lassen und dann **vor dem Senden freigeben**.

    Wenn Sie experimentieren möchten, tun Sie das mit einem dedizierten Konto und halten Sie es isoliert. Siehe
    [Security](/de/gateway/security).

  </Accordion>

  <Accordion title="Kann ich günstigere Modelle für persönliche Assistentenaufgaben verwenden?">
    Ja, **wenn** der Agent nur Chat nutzt und die Eingaben vertrauenswürdig sind. Kleinere Tiers sind
    anfälliger für Instruction Hijacking, daher sollten Sie sie für Tool-aktivierte Agents
    oder beim Lesen nicht vertrauenswürdiger Inhalte vermeiden. Wenn Sie ein kleineres Modell verwenden müssen, sperren Sie
    die Tools ab und führen Sie es in einer Sandbox aus. Siehe [Security](/de/gateway/security).
  </Accordion>

  <Accordion title="Ich habe /start in Telegram ausgeführt, aber keinen Pairing-Code erhalten">
    Pairing-Codes werden **nur** gesendet, wenn ein unbekannter Absender dem Bot schreibt und
    `dmPolicy: "pairing"` aktiviert ist. `/start` allein erzeugt keinen Code.

    Ausstehende Anfragen prüfen:

    ```bash
    openclaw pairing list telegram
    ```

    Wenn Sie sofortigen Zugriff möchten, setzen Sie Ihre Absender-ID auf die Allowlist oder setzen Sie `dmPolicy: "open"`
    für dieses Konto.

  </Accordion>

  <Accordion title="WhatsApp: Wird es meinen Kontakten Nachrichten senden? Wie funktioniert Pairing?">
    Nein. Die Standard-DM-Richtlinie für WhatsApp ist **Pairing**. Unbekannte Absender erhalten nur einen Pairing-Code und ihre Nachricht wird **nicht verarbeitet**. OpenClaw antwortet nur auf Chats, die es empfängt, oder auf explizite Sendevorgänge, die Sie auslösen.

    Pairing genehmigen mit:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Ausstehende Anfragen auflisten:

    ```bash
    openclaw pairing list whatsapp
    ```

    Abfrage der Telefonnummer im Wizard: Sie wird verwendet, um Ihre **Allowlist/Ihren Owner** festzulegen, sodass Ihre eigenen DMs erlaubt sind. Sie wird nicht für automatisches Senden verwendet. Wenn Sie OpenClaw mit Ihrer persönlichen WhatsApp-Nummer ausführen, verwenden Sie diese Nummer und aktivieren Sie `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Chat-Befehle, Aufgaben abbrechen und „es hört nicht auf“

<AccordionGroup>
  <Accordion title="Wie verhindere ich, dass interne Systemnachrichten im Chat angezeigt werden?">
    Die meisten internen oder Tool-Nachrichten erscheinen nur, wenn **verbose**, **trace** oder **reasoning** für diese Session aktiviert ist.

    Lösung in dem Chat, in dem Sie das sehen:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Wenn es weiterhin laut ist, prüfen Sie die Session-Einstellungen in der Control UI und setzen Sie verbose
    auf **inherit**. Prüfen Sie außerdem, dass Sie kein Bot-Profil mit `verboseDefault` auf
    `on` in der Konfiguration verwenden.

    Dokumentation: [Thinking and verbose](/de/tools/thinking), [Security](/de/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Wie stoppe/breche ich eine laufende Aufgabe ab?">
    Senden Sie eine der folgenden Optionen **als eigenständige Nachricht** (ohne Slash):

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    Dies sind Abbruch-Trigger (keine Slash-Befehle).

    Bei Hintergrundprozessen (vom Exec-Tool) können Sie den Agent bitten, Folgendes auszuführen:

    ```
    process action:kill sessionId:XXX
    ```

    Überblick über Slash-Befehle: siehe [Slash commands](/de/tools/slash-commands).

    Die meisten Befehle müssen als **eigenständige** Nachricht gesendet werden, die mit `/` beginnt, aber einige Abkürzungen (wie `/status`) funktionieren für allowgelistete Absender auch inline.

  </Accordion>

  <Accordion title='Wie sende ich eine Discord-Nachricht von Telegram aus? ("Cross-context messaging denied")'>
    OpenClaw blockiert standardmäßig **providerübergreifendes** Messaging. Wenn ein Tool-Aufruf
    an Telegram gebunden ist, wird nicht an Discord gesendet, es sei denn, Sie erlauben dies explizit.

    Aktivieren Sie providerübergreifendes Messaging für den Agent:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    Starten Sie das Gateway nach der Bearbeitung der Konfiguration neu.

  </Accordion>

  <Accordion title='Warum fühlt es sich so an, als würde der Bot schnelle Nachrichtenfolgen "ignorieren"?'>
    Der Queue-Modus steuert, wie neue Nachrichten mit einem laufenden Run interagieren. Verwenden Sie `/queue`, um Modi zu ändern:

    - `steer` - neue Nachrichten lenken die aktuelle Aufgabe um
    - `followup` - Nachrichten werden nacheinander ausgeführt
    - `collect` - Nachrichten werden gebündelt und es gibt eine gemeinsame Antwort (Standard)
    - `steer-backlog` - jetzt umlenken, dann Backlog verarbeiten
    - `interrupt` - aktuellen Run abbrechen und neu starten

    Sie können Optionen wie `debounce:2s cap:25 drop:summarize` für Followup-Modi hinzufügen.

  </Accordion>
</AccordionGroup>

## Sonstiges

<AccordionGroup>
  <Accordion title='Was ist das Standardmodell für Anthropic mit einem API-Schlüssel?'>
    In OpenClaw sind Anmeldedaten und Modellauswahl getrennt. Das Setzen von `ANTHROPIC_API_KEY` (oder das Speichern eines Anthropic-API-Schlüssels in Auth-Profilen) aktiviert die Authentifizierung, aber das tatsächliche Standardmodell ist das, was Sie in `agents.defaults.model.primary` konfigurieren (zum Beispiel `anthropic/claude-sonnet-4-6` oder `anthropic/claude-opus-4-6`). Wenn Sie `No credentials found for profile "anthropic:default"` sehen, bedeutet das, dass das Gateway keine Anthropic-Anmeldedaten in der erwarteten `auth-profiles.json` für den Agent finden konnte, der gerade läuft.
  </Accordion>
</AccordionGroup>

---

Sie kommen immer noch nicht weiter? Fragen Sie in [Discord](https://discord.com/invite/clawd) oder eröffnen Sie eine [GitHub-Diskussion](https://github.com/openclaw/openclaw/discussions).

## Zugehörig

- [First-run FAQ](/de/help/faq-first-run) — Installation, Onboarding, Authentifizierung, Abonnements, frühe Fehler
- [Models FAQ](/de/help/faq-models) — Modellauswahl, Failover, Auth-Profile
- [Troubleshooting](/de/help/troubleshooting) — Symptom-basierte Triage
