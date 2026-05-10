---
read_when:
    - Beantwortung häufiger Fragen zu Einrichtung, Installation, Einführung oder Unterstützung zur Laufzeit
    - Triage von von Benutzern gemeldeten Problemen vor einer tiefergehenden Fehlersuche
summary: Häufig gestellte Fragen zur Einrichtung, Konfiguration und Nutzung von OpenClaw
title: Häufig gestellte Fragen
x-i18n:
    generated_at: "2026-05-10T19:38:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 121de36647f7452969b760d6b6ab0a6b1b776d63987ca6ba0be1c8cf4c9f85e9
    source_path: help/faq.md
    workflow: 16
---

Kurze Antworten plus ausführlichere Fehlerbehebung für reale Setups (lokale Entwicklung, VPS, Multi-Agent, OAuth-/API-Schlüssel, Modell-Failover). Für Laufzeitdiagnosen siehe [Fehlerbehebung](/de/gateway/troubleshooting). Die vollständige Konfigurationsreferenz finden Sie unter [Konfiguration](/de/gateway/configuration).

## Die ersten 60 Sekunden, wenn etwas nicht funktioniert

1. **Schneller Status (erste Prüfung)**

   ```bash
   openclaw status
   ```

   Schnelle lokale Zusammenfassung: OS + Update, Erreichbarkeit von Gateway/Dienst, Agents/Sitzungen, Provider-Konfiguration + Laufzeitprobleme (wenn das Gateway erreichbar ist).

2. **Einfügbarer Bericht (sicher zum Teilen)**

   ```bash
   openclaw status --all
   ```

   Schreibgeschützte Diagnose mit Log-Auszug (Tokens geschwärzt).

3. **Daemon- + Port-Status**

   ```bash
   openclaw gateway status
   ```

   Zeigt Supervisor-Laufzeit im Vergleich zur RPC-Erreichbarkeit, die Ziel-URL der Probe und welche Konfiguration der Dienst wahrscheinlich verwendet hat.

4. **Tiefe Probes**

   ```bash
   openclaw status --deep
   ```

   Führt eine Live-Gateway-Health-Probe aus, einschließlich Channel-Probes, wenn unterstützt
   (erfordert ein erreichbares Gateway). Siehe [Health](/de/gateway/health).

5. **Das neueste Log verfolgen**

   ```bash
   openclaw logs --follow
   ```

   Wenn RPC nicht verfügbar ist, weichen Sie darauf aus:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Datei-Logs sind von Dienst-Logs getrennt; siehe [Logging](/de/logging) und [Fehlerbehebung](/de/gateway/troubleshooting).

6. **Doctor ausführen (Reparaturen)**

   ```bash
   openclaw doctor
   ```

   Repariert/migriert Konfiguration/Zustand + führt Health-Checks aus. Siehe [Doctor](/de/gateway/doctor).

7. **Gateway-Snapshot**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Fragt das laufende Gateway nach einem vollständigen Snapshot (nur WS). Siehe [Health](/de/gateway/health).

## Schnellstart und Einrichtung beim ersten Start

Fragen und Antworten zum ersten Start - Installation, Onboarding, Auth-Routen, Abonnements, erste Fehler -
finden Sie in der [FAQ zum ersten Start](/de/help/faq-first-run).

## Was ist OpenClaw?

<AccordionGroup>
  <Accordion title="Was ist OpenClaw, in einem Absatz?">
    OpenClaw ist ein persönlicher KI-Assistent, den Sie auf Ihren eigenen Geräten ausführen. Er antwortet auf den Messaging-Oberflächen, die Sie bereits verwenden (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat und gebündelte Channel-Plugins wie QQ Bot) und kann auf unterstützten Plattformen auch Sprache + ein Live-Canvas nutzen. Das **Gateway** ist die ständig aktive Steuerungsebene; der Assistent ist das Produkt.
  </Accordion>

  <Accordion title="Wertversprechen">
    OpenClaw ist nicht „nur ein Claude-Wrapper“. Es ist eine **local-first Steuerungsebene**, mit der Sie einen
    leistungsfähigen Assistenten auf **Ihrer eigenen Hardware** ausführen können, erreichbar über die Chat-Apps, die Sie bereits verwenden, mit
    zustandsbehafteten Sitzungen, Memory und Tools - ohne die Kontrolle über Ihre Workflows an eine gehostete
    SaaS abzugeben.

    Highlights:

    - **Ihre Geräte, Ihre Daten:** Führen Sie das Gateway aus, wo Sie möchten (Mac, Linux, VPS), und behalten Sie
      Workspace + Sitzungsverlauf lokal.
    - **Echte Channels, keine Web-Sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/usw.,
      plus mobile Sprache und Canvas auf unterstützten Plattformen.
    - **Modellagnostisch:** Verwenden Sie Anthropic, OpenAI, MiniMax, OpenRouter usw. mit Routing
      und Failover pro Agent.
    - **Nur-lokal-Option:** Führen Sie lokale Modelle aus, damit **alle Daten auf Ihrem Gerät bleiben können**, wenn Sie möchten.
    - **Multi-Agent-Routing:** getrennte Agents pro Channel, Konto oder Aufgabe, jeweils mit eigenem
      Workspace und eigenen Standardwerten.
    - **Open Source und anpassbar:** Prüfen, erweitern und selbst hosten ohne Vendor-Lock-in.

    Docs: [Gateway](/de/gateway), [Channels](/de/channels), [Multi-Agent](/de/concepts/multi-agent),
    [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Ich habe es gerade eingerichtet - was sollte ich zuerst tun?">
    Gute erste Projekte:

    - Eine Website erstellen (WordPress, Shopify oder eine einfache statische Website).
    - Eine mobile App prototypisieren (Konzept, Screens, API-Plan).
    - Dateien und Ordner organisieren (Bereinigung, Benennung, Tagging).
    - Gmail verbinden und Zusammenfassungen oder Follow-ups automatisieren.

    Es kann große Aufgaben bewältigen, funktioniert aber am besten, wenn Sie sie in Phasen aufteilen und
    Sub-Agents für parallele Arbeit verwenden.

  </Accordion>

  <Accordion title="Was sind die fünf wichtigsten Alltagsanwendungen für OpenClaw?">
    Alltägliche Erfolge sehen meist so aus:

    - **Persönliche Briefings:** Zusammenfassungen von Inbox, Kalender und Nachrichten, die Sie interessieren.
    - **Recherche und Entwürfe:** schnelle Recherche, Zusammenfassungen und erste Entwürfe für E-Mails oder Docs.
    - **Erinnerungen und Follow-ups:** Cron- oder Heartbeat-gesteuerte Hinweise und Checklisten.
    - **Browser-Automatisierung:** Formulare ausfüllen, Daten sammeln und Webaufgaben wiederholen.
    - **Geräteübergreifende Koordination:** Senden Sie eine Aufgabe von Ihrem Telefon, lassen Sie das Gateway sie auf einem Server ausführen und erhalten Sie das Ergebnis im Chat zurück.

  </Accordion>

  <Accordion title="Kann OpenClaw bei Lead-Generierung, Outreach, Ads und Blogs für ein SaaS helfen?">
    Ja, bei **Recherche, Qualifizierung und Entwurf**. Es kann Websites scannen, Shortlists erstellen,
    Interessenten zusammenfassen und Entwürfe für Outreach- oder Anzeigentexte schreiben.

    Für **Outreach- oder Anzeigenläufe** sollten Sie einen Menschen in der Schleife behalten. Vermeiden Sie Spam, befolgen Sie lokale Gesetze und
    Plattformrichtlinien und prüfen Sie alles, bevor es gesendet wird. Das sicherste Muster ist, OpenClaw
    entwerfen zu lassen und selbst zu genehmigen.

    Docs: [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Welche Vorteile gibt es gegenüber Claude Code für Webentwicklung?">
    OpenClaw ist ein **persönlicher Assistent** und eine Koordinationsschicht, kein IDE-Ersatz. Verwenden Sie
    Claude Code oder Codex für den schnellsten direkten Coding-Loop innerhalb eines Repos. Verwenden Sie OpenClaw, wenn Sie
    dauerhafte Memory, geräteübergreifenden Zugriff und Tool-Orchestrierung möchten.

    Vorteile:

    - **Persistente Memory + Workspace** über Sitzungen hinweg
    - **Multi-Plattform-Zugriff** (WhatsApp, Telegram, TUI, WebChat)
    - **Tool-Orchestrierung** (Browser, Dateien, Planung, Hooks)
    - **Ständig aktives Gateway** (auf einem VPS ausführen, von überall interagieren)
    - **Nodes** für lokalen Browser/Bildschirm/Kamera/Exec

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills und Automatisierung

<AccordionGroup>
  <Accordion title="Wie passe ich Skills an, ohne das Repo dirty zu halten?">
    Verwenden Sie verwaltete Overrides, statt die Repo-Kopie zu bearbeiten. Legen Sie Ihre Änderungen in `~/.openclaw/skills/<name>/SKILL.md` ab (oder fügen Sie einen Ordner über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` hinzu). Die Priorität ist `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelt → `skills.load.extraDirs`; verwaltete Overrides gewinnen also weiterhin gegenüber gebündelten Skills, ohne git anzufassen. Wenn der Skill global installiert, aber nur für einige Agents sichtbar sein soll, behalten Sie die gemeinsame Kopie in `~/.openclaw/skills` und steuern Sie die Sichtbarkeit mit `agents.defaults.skills` und `agents.list[].skills`. Nur upstream-taugliche Änderungen sollten im Repo liegen und als PRs eingereicht werden.
  </Accordion>

  <Accordion title="Kann ich Skills aus einem benutzerdefinierten Ordner laden?">
    Ja. Fügen Sie zusätzliche Verzeichnisse über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` hinzu (niedrigste Priorität). Die Standardpriorität ist `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelt → `skills.load.extraDirs`. `clawhub` installiert standardmäßig nach `./skills`, was OpenClaw in der nächsten Sitzung als `<workspace>/skills` behandelt. Wenn der Skill nur für bestimmte Agents sichtbar sein soll, kombinieren Sie das mit `agents.defaults.skills` oder `agents.list[].skills`.
  </Accordion>

  <Accordion title="Wie kann ich unterschiedliche Modelle für unterschiedliche Aufgaben verwenden?">
    Heute werden folgende Muster unterstützt:

    - **Cron-Jobs**: Isolierte Jobs können pro Job einen `model`-Override festlegen.
    - **Sub-Agents**: Leiten Sie Aufgaben an getrennte Agents mit unterschiedlichen Standardmodellen weiter.
    - **Wechsel nach Bedarf**: Verwenden Sie `/model`, um das aktuelle Sitzungsmodell jederzeit zu wechseln.

    Siehe [Cron-Jobs](/de/automation/cron-jobs), [Multi-Agent-Routing](/de/concepts/multi-agent) und [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Der Bot friert bei schwerer Arbeit ein. Wie lagere ich das aus?">
    Verwenden Sie **Sub-Agents** für lange oder parallele Aufgaben. Sub-Agents laufen in ihrer eigenen Sitzung,
    geben eine Zusammenfassung zurück und halten Ihren Hauptchat reaktionsfähig.

    Bitten Sie Ihren Bot, „einen Sub-Agent für diese Aufgabe zu starten“, oder verwenden Sie `/subagents`.
    Verwenden Sie `/status` im Chat, um zu sehen, was das Gateway gerade tut (und ob es beschäftigt ist).

    Token-Tipp: Lange Aufgaben und Sub-Agents verbrauchen beide Tokens. Wenn Kosten eine Rolle spielen, legen Sie ein
    günstigeres Modell für Sub-Agents über `agents.defaults.subagents.model` fest.

    Docs: [Sub-Agents](/de/tools/subagents), [Hintergrundaufgaben](/de/automation/tasks).

  </Accordion>

  <Accordion title="Wie funktionieren thread-gebundene Subagent-Sitzungen auf Discord?">
    Verwenden Sie Thread-Bindings. Sie können einen Discord-Thread an ein Subagent- oder Sitzungsziel binden, damit Folgemeldungen in diesem Thread in dieser gebundenen Sitzung bleiben.

    Grundlegender Ablauf:

    - Mit `sessions_spawn` und `thread: true` starten (und optional `mode: "session"` für persistente Follow-ups).
    - Oder manuell mit `/focus <target>` binden.
    - Mit `/agents` den Binding-Status prüfen.
    - Mit `/session idle <duration|off>` und `/session max-age <duration|off>` die automatische Aufhebung des Fokus steuern.
    - Mit `/unfocus` den Thread lösen.

    Erforderliche Konfiguration:

    - Globale Standardwerte: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord-Overrides: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatisches Binden beim Start: `channels.discord.threadBindings.spawnSessions` ist standardmäßig `true`; setzen Sie es auf `false`, um thread-gebundene Sitzungsstarts zu deaktivieren.

    Docs: [Sub-Agents](/de/tools/subagents), [Discord](/de/channels/discord), [Konfigurationsreferenz](/de/gateway/configuration-reference), [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Ein Subagent ist fertig, aber die Abschlussmeldung ging an die falsche Stelle oder wurde nie gepostet. Was sollte ich prüfen?">
    Prüfen Sie zuerst die aufgelöste Requester-Route:

    - Die Zustellung von Subagents im Abschlussmodus bevorzugt jede gebundene Thread- oder Konversationsroute, wenn eine vorhanden ist.
    - Wenn der Abschlussursprung nur einen Channel enthält, fällt OpenClaw auf die gespeicherte Route der Requester-Sitzung (`lastChannel` / `lastTo` / `lastAccountId`) zurück, damit die direkte Zustellung weiterhin gelingen kann.
    - Wenn weder eine gebundene Route noch eine nutzbare gespeicherte Route existiert, kann die direkte Zustellung fehlschlagen und das Ergebnis fällt auf die Zustellung über die Sitzungswarteschlange zurück, statt sofort in den Chat gepostet zu werden.
    - Ungültige oder veraltete Ziele können weiterhin einen Queue-Fallback oder einen endgültigen Zustellungsfehler erzwingen.
    - Wenn die letzte sichtbare Assistant-Antwort des Childs das exakt stille Token `NO_REPLY` / `no_reply` oder exakt `ANNOUNCE_SKIP` ist, unterdrückt OpenClaw die Ankündigung absichtlich, statt veralteten früheren Fortschritt zu posten.
    - Wenn das Child nach ausschließlich Tool-Aufrufen ein Timeout hatte, kann die Ankündigung dies zu einer kurzen Zusammenfassung des Teilfortschritts verdichten, statt rohe Tool-Ausgabe erneut abzuspielen.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs: [Sub-Agents](/de/tools/subagents), [Hintergrundaufgaben](/de/automation/tasks), [Sitzungs-Tools](/de/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron oder Erinnerungen werden nicht ausgelöst. Was sollte ich prüfen?">
    Cron läuft innerhalb des Gateway-Prozesses. Wenn das Gateway nicht kontinuierlich läuft,
    werden geplante Jobs nicht ausgeführt.

    Checkliste:

    - Bestätigen Sie, dass Cron aktiviert ist (`cron.enabled`) und `OPENCLAW_SKIP_CRON` nicht gesetzt ist.
    - Prüfen Sie, dass das Gateway rund um die Uhr läuft (kein Schlafmodus/keine Neustarts).
    - Überprüfen Sie die Zeitzoneneinstellungen für den Job (`--tz` im Vergleich zur Host-Zeitzone).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Docs: [Cron-Jobs](/de/automation/cron-jobs), [Automatisierung & Aufgaben](/de/automation).

  </Accordion>

  <Accordion title="Cron wurde ausgelöst, aber es wurde nichts an den Kanal gesendet. Warum?">
    Prüfen Sie zuerst den Zustellmodus:

    - `--no-deliver` / `delivery.mode: "none"` bedeutet, dass kein Runner-Fallback-Versand erwartet wird.
    - Ein fehlendes oder ungültiges Ankündigungsziel (`channel` / `to`) bedeutet, dass der Runner die ausgehende Zustellung übersprungen hat.
    - Kanal-Authentifizierungsfehler (`unauthorized`, `Forbidden`) bedeuten, dass der Runner versucht hat zuzustellen, die Zugangsdaten dies aber blockiert haben.
    - Ein stummes isoliertes Ergebnis (nur `NO_REPLY` / `no_reply`) wird als absichtlich nicht zustellbar behandelt, daher unterdrückt der Runner auch die eingereihte Fallback-Zustellung.

    Bei isolierten Cron-Jobs kann der Agent weiterhin direkt mit dem `message`-
    Tool senden, wenn eine Chat-Route verfügbar ist. `--announce` steuert nur den Runner-
    Fallback-Pfad für finalen Text, den der Agent nicht bereits gesendet hat.

    Debugging:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Hintergrundaufgaben](/de/automation/tasks).

  </Accordion>

  <Accordion title="Warum hat ein isolierter Cron-Lauf das Modell gewechselt oder einmal erneut versucht?">
    Das ist normalerweise der Live-Modellwechselpfad, nicht eine doppelte Planung.

    Isolierter Cron kann eine Laufzeit-Modellübergabe dauerhaft speichern und erneut versuchen, wenn der aktive
    Lauf `LiveSessionModelSwitchError` auslöst. Der erneute Versuch behält den gewechselten
    Provider/das gewechselte Modell bei, und wenn der Wechsel eine neue Auth-Profil-Überschreibung mitgebracht hat, speichert Cron
    auch diese vor dem erneuten Versuch dauerhaft.

    Zugehörige Auswahlregeln:

    - Die Gmail-Hook-Modellüberschreibung gewinnt zuerst, wenn sie anwendbar ist.
    - Danach pro Job `model`.
    - Danach jede gespeicherte Cron-Sitzungsmodellüberschreibung.
    - Danach die normale Agent-/Standardmodellauswahl.

    Die Wiederholungsschleife ist begrenzt. Nach dem ersten Versuch plus 2 Wechsel-Wiederholungen
    bricht Cron ab, statt endlos weiterzulaufen.

    Debugging:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Cron-CLI](/de/cli/cron).

  </Accordion>

  <Accordion title="Wie installiere ich Skills unter Linux?">
    Verwenden Sie native `openclaw skills`-Befehle oder legen Sie Skills in Ihrem Arbeitsbereich ab. Die macOS-Skills-Oberfläche ist unter Linux nicht verfügbar.
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

    Natives `openclaw skills install` schreibt in das `skills/`-
    Verzeichnis des aktiven Arbeitsbereichs. Installieren Sie die separate `clawhub`-CLI nur, wenn Sie eigene Skills veröffentlichen oder
    synchronisieren möchten. Für geteilte Installationen über Agenten hinweg legen Sie den Skill unter
    `~/.openclaw/skills` ab und verwenden Sie `agents.defaults.skills` oder
    `agents.list[].skills`, wenn Sie einschränken möchten, welche Agenten ihn sehen können.

  </Accordion>

  <Accordion title="Kann OpenClaw Aufgaben nach Zeitplan oder kontinuierlich im Hintergrund ausführen?">
    Ja. Verwenden Sie den Gateway-Scheduler:

    - **Cron-Jobs** für geplante oder wiederkehrende Aufgaben (bleiben über Neustarts hinweg bestehen).
    - **Heartbeat** für periodische Prüfungen der „Hauptsitzung“.
    - **Isolierte Jobs** für autonome Agenten, die Zusammenfassungen posten oder an Chats zustellen.

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Automatisierung & Aufgaben](/de/automation),
    [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title="Kann ich Apple-macOS-only-Skills von Linux ausführen?">
    Nicht direkt. macOS-Skills werden durch `metadata.openclaw.os` plus erforderliche Binärdateien beschränkt, und Skills erscheinen nur dann im System-Prompt, wenn sie auf dem **Gateway-Host** berechtigt sind. Unter Linux werden `darwin`-only-Skills (wie `apple-notes`, `apple-reminders`, `things-mac`) nicht geladen, außer Sie überschreiben die Beschränkung.

    Sie haben drei unterstützte Muster:

    **Option A - Gateway auf einem Mac ausführen (am einfachsten).**
    Führen Sie das Gateway dort aus, wo die macOS-Binärdateien vorhanden sind, und verbinden Sie sich dann von Linux im [Remote-Modus](#gateway-ports-already-running-and-remote-mode) oder über Tailscale. Die Skills werden normal geladen, weil der Gateway-Host macOS ist.

    **Option B - macOS-Node verwenden (kein SSH).**
    Führen Sie das Gateway unter Linux aus, koppeln Sie einen macOS-Node (Menüleisten-App), und setzen Sie **Node-Ausführungsbefehle** auf dem Mac auf „Immer fragen“ oder „Immer erlauben“. OpenClaw kann macOS-only-Skills als berechtigt behandeln, wenn die erforderlichen Binärdateien auf dem Node vorhanden sind. Der Agent führt diese Skills über das `nodes`-Tool aus. Wenn Sie „Immer fragen“ wählen, fügt die Genehmigung von „Immer erlauben“ in der Eingabeaufforderung diesen Befehl zur Allowlist hinzu.

    **Option C - macOS-Binärdateien über SSH proxysieren (fortgeschritten).**
    Behalten Sie das Gateway unter Linux, aber sorgen Sie dafür, dass die erforderlichen CLI-Binärdateien zu SSH-Wrappern aufgelöst werden, die auf einem Mac laufen. Überschreiben Sie dann den Skill, um Linux zu erlauben, damit er berechtigt bleibt.

    1. Erstellen Sie einen SSH-Wrapper für die Binärdatei (Beispiel: `memo` für Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Legen Sie den Wrapper auf dem Linux-Host in `PATH` ab (zum Beispiel `~/bin/memo`).
    3. Überschreiben Sie die Skill-Metadaten (Arbeitsbereich oder `~/.openclaw/skills`), um Linux zu erlauben:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Starten Sie eine neue Sitzung, damit der Skills-Snapshot aktualisiert wird.

  </Accordion>

  <Accordion title="Haben Sie eine Notion- oder HeyGen-Integration?">
    Heute nicht eingebaut.

    Optionen:

    - **Benutzerdefinierter Skill / Plugin:** am besten für zuverlässigen API-Zugriff (Notion/HeyGen haben beide APIs).
    - **Browser-Automatisierung:** funktioniert ohne Code, ist aber langsamer und anfälliger.

    Wenn Sie Kontext pro Kunde beibehalten möchten (Agentur-Workflows), ist ein einfaches Muster:

    - Eine Notion-Seite pro Kunde (Kontext + Präferenzen + aktive Arbeit).
    - Bitten Sie den Agenten, diese Seite zu Beginn einer Sitzung abzurufen.

    Wenn Sie eine native Integration möchten, öffnen Sie eine Feature-Anfrage oder erstellen Sie einen Skill,
    der auf diese APIs abzielt.

    Skills installieren:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Native Installationen landen im `skills/`-Verzeichnis des aktiven Arbeitsbereichs. Für geteilte Skills über Agenten hinweg platzieren Sie sie in `~/.openclaw/skills/<name>/SKILL.md`. Wenn nur einige Agenten eine geteilte Installation sehen sollen, konfigurieren Sie `agents.defaults.skills` oder `agents.list[].skills`. Manche Skills erwarten über Homebrew installierte Binärdateien; unter Linux bedeutet das Linuxbrew (siehe den Homebrew-Linux-FAQ-Eintrag oben). Siehe [Skills](/de/tools/skills), [Skills-Konfiguration](/de/tools/skills-config) und [ClawHub](/de/clawhub).

  </Accordion>

  <Accordion title="Wie verwende ich mein vorhandenes angemeldetes Chrome mit OpenClaw?">
    Verwenden Sie das eingebaute `user`-Browserprofil, das über Chrome DevTools MCP angebunden wird:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Wenn Sie einen benutzerdefinierten Namen möchten, erstellen Sie ein explizites MCP-Profil:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Dieser Pfad kann den lokalen Host-Browser oder einen verbundenen Browser-Node verwenden. Wenn das Gateway anderswo läuft, führen Sie entweder einen Node-Host auf dem Browser-Rechner aus oder verwenden Sie stattdessen Remote-CDP.

    Aktuelle Einschränkungen von `existing-session` / `user`:

    - Aktionen sind ref-basiert, nicht CSS-Selektor-basiert
    - Uploads erfordern `ref` / `inputRef` und unterstützen derzeit jeweils eine Datei
    - `responsebody`, PDF-Export, Download-Abfangen und Batch-Aktionen benötigen weiterhin einen verwalteten Browser oder ein rohes CDP-Profil

  </Accordion>
</AccordionGroup>

## Sandboxing und Arbeitsspeicher

<AccordionGroup>
  <Accordion title="Gibt es eine dedizierte Sandboxing-Dokumentation?">
    Ja. Siehe [Sandboxing](/de/gateway/sandboxing). Für Docker-spezifische Einrichtung (vollständiges Gateway in Docker oder Sandbox-Images) siehe [Docker](/de/install/docker).
  </Accordion>

  <Accordion title="Docker wirkt eingeschränkt - wie aktiviere ich den vollen Funktionsumfang?">
    Das Standard-Image ist auf Sicherheit ausgelegt und läuft als `node`-Benutzer, daher enthält es keine
    Systempakete, kein Homebrew und keine gebündelten Browser. Für eine vollständigere Einrichtung:

    - Persistieren Sie `/home/node` mit `OPENCLAW_HOME_VOLUME`, damit Caches erhalten bleiben.
    - Backen Sie Systemabhängigkeiten mit `OPENCLAW_DOCKER_APT_PACKAGES` in das Image ein.
    - Installieren Sie Playwright-Browser über die gebündelte CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Setzen Sie `PLAYWRIGHT_BROWSERS_PATH` und stellen Sie sicher, dass der Pfad persistiert wird.

    Dokumentation: [Docker](/de/install/docker), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Kann ich DMs persönlich halten, aber Gruppen mit einem Agenten öffentlich/sandboxed machen?">
    Ja - wenn Ihr privater Traffic **DMs** und Ihr öffentlicher Traffic **Gruppen** sind.

    Verwenden Sie `agents.defaults.sandbox.mode: "non-main"`, damit Gruppen-/Kanalsitzungen (Nicht-Main-Schlüssel) im konfigurierten Sandbox-Backend laufen, während die Haupt-DM-Sitzung auf dem Host bleibt. Docker ist das Standard-Backend, wenn Sie keines auswählen. Beschränken Sie dann über `tools.sandbox.tools`, welche Tools in sandboxed Sitzungen verfügbar sind.

    Einrichtungsdurchlauf + Beispielkonfiguration: [Gruppen: persönliche DMs + öffentliche Gruppen](/de/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Wichtige Konfigurationsreferenz: [Gateway-Konfiguration](/de/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Wie binde ich einen Host-Ordner in die Sandbox ein?">
    Setzen Sie `agents.defaults.sandbox.docker.binds` auf `["host:path:mode"]` (z. B. `"/home/user/src:/src:ro"`). Globale und pro Agent konfigurierte Bindings werden zusammengeführt; pro Agent konfigurierte Bindings werden ignoriert, wenn `scope: "shared"` ist. Verwenden Sie `:ro` für alles Sensible und bedenken Sie, dass Bindings die Dateisystemwände der Sandbox umgehen.

    OpenClaw validiert Bind-Quellen sowohl gegen den normalisierten Pfad als auch gegen den kanonischen Pfad, der über den tiefsten vorhandenen Vorfahren aufgelöst wird. Das bedeutet, dass Symlink-Eltern-Ausbrüche weiterhin geschlossen fehlschlagen, selbst wenn das letzte Pfadsegment noch nicht existiert, und Allowed-Root-Prüfungen nach der Symlink-Auflösung weiterhin gelten.

    Siehe [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts) und [Sandbox vs. Tool-Richtlinie vs. Erhöht](/de/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) für Beispiele und Sicherheitshinweise.

  </Accordion>

  <Accordion title="Wie funktioniert Arbeitsspeicher?">
    OpenClaw-Speicher besteht einfach aus Markdown-Dateien im Agent-Arbeitsbereich:

    - Tägliche Notizen in `memory/YYYY-MM-DD.md`
    - Kuratierte Langzeitnotizen in `MEMORY.md` (nur Haupt-/private Sitzungen)

    OpenClaw führt außerdem einen **stillen Speicher-Flush vor der Compaction** aus, um das Modell daran zu erinnern,
    dauerhafte Notizen vor der Auto-Compaction zu schreiben. Dies läuft nur, wenn der Arbeitsbereich
    beschreibbar ist (schreibgeschützte Sandboxes überspringen es). Siehe [Speicher](/de/concepts/memory).

  </Accordion>

  <Accordion title="Der Speicher vergisst ständig Dinge. Wie sorge ich dafür, dass sie erhalten bleiben?">
    Bitten Sie den Bot, **die Tatsache in den Speicher zu schreiben**. Langzeitnotizen gehören in `MEMORY.md`,
    Kurzzeitkontext kommt in `memory/YYYY-MM-DD.md`.

    Das ist weiterhin ein Bereich, den wir verbessern. Es hilft, das Modell daran zu erinnern, Erinnerungen zu speichern;
    es weiß dann, was zu tun ist. Wenn es weiterhin vergisst, prüfen Sie, ob das Gateway bei jedem Lauf denselben
    Arbeitsbereich verwendet.

    Dokumentation: [Speicher](/de/concepts/memory), [Agent-Arbeitsbereich](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bleibt Speicher für immer bestehen? Wo liegen die Grenzen?">
    Speicherdateien liegen auf der Festplatte und bleiben bestehen, bis Sie sie löschen. Die Grenze ist Ihr
    Speicherplatz, nicht das Modell. Der **Sitzungskontext** ist weiterhin durch das Kontextfenster des Modells
    begrenzt, sodass lange Unterhaltungen verdichten oder abschneiden können. Deshalb
    existiert Speichersuche - sie holt nur die relevanten Teile zurück in den Kontext.

    Dokumentation: [Speicher](/de/concepts/memory), [Kontext](/de/concepts/context).

  </Accordion>

  <Accordion title="Benötigt die semantische Speichersuche einen OpenAI-API-Schlüssel?">
    Nur wenn Sie **OpenAI-Embeddings** verwenden. Codex OAuth deckt Chat/Completions ab und
    gewährt **keinen** Zugriff auf Embeddings, daher hilft **die Anmeldung mit Codex (OAuth oder der
    Codex CLI-Anmeldung)** nicht für die semantische Speichersuche. OpenAI-Embeddings
    benötigen weiterhin einen echten API-Schlüssel (`OPENAI_API_KEY` oder `models.providers.openai.apiKey`).

    Wenn Sie keinen Provider explizit festlegen, wählt OpenClaw automatisch einen Provider aus, wenn es
    einen API-Schlüssel auflösen kann (Authentifizierungsprofile, `models.providers.*.apiKey` oder Umgebungsvariablen).
    Es bevorzugt OpenAI, wenn ein OpenAI-Schlüssel aufgelöst wird, andernfalls Gemini, wenn ein Gemini-Schlüssel
    aufgelöst wird, dann Voyage, dann Mistral. Wenn kein Remote-Schlüssel verfügbar ist, bleibt die Speichersuche
    deaktiviert, bis Sie sie konfigurieren. Wenn Sie einen lokalen Modellpfad
    konfiguriert haben und dieser vorhanden ist, bevorzugt OpenClaw
    `local`. Ollama wird unterstützt, wenn Sie explizit
    `memorySearch.provider = "ollama"` festlegen.

    Wenn Sie lieber lokal bleiben möchten, setzen Sie `memorySearch.provider = "local"` (und optional
    `memorySearch.fallback = "none"`). Wenn Sie Gemini-Embeddings verwenden möchten, setzen Sie
    `memorySearch.provider = "gemini"` und stellen Sie `GEMINI_API_KEY` (oder
    `memorySearch.remote.apiKey`) bereit. Wir unterstützen **OpenAI-, Gemini-, Voyage-, Mistral-, Ollama- oder lokale** Embedding-
    Modelle - siehe [Speicher](/de/concepts/memory) für die Einrichtungsdetails.

  </Accordion>
</AccordionGroup>

## Wo Dinge auf der Festplatte liegen

<AccordionGroup>
  <Accordion title="Werden alle mit OpenClaw verwendeten Daten lokal gespeichert?">
    Nein - **der Status von OpenClaw ist lokal**, aber **externe Dienste sehen weiterhin, was Sie ihnen senden**.

    - **Standardmäßig lokal:** Sitzungen, Speicherdateien, Konfiguration und Arbeitsbereich liegen auf dem Gateway-Host
      (`~/.openclaw` + Ihr Arbeitsbereichsverzeichnis).
    - **Notwendigerweise remote:** Nachrichten, die Sie an Modell-Provider (Anthropic/OpenAI/usw.) senden, gehen an
      deren APIs, und Chat-Plattformen (WhatsApp/Telegram/Slack/usw.) speichern Nachrichtendaten auf ihren
      Servern.
    - **Sie steuern den Umfang:** Die Verwendung lokaler Modelle hält Prompts auf Ihrem Computer, aber Channel-
      Datenverkehr läuft weiterhin über die Server des Channels.

    Verwandt: [Agenten-Arbeitsbereich](/de/concepts/agent-workspace), [Speicher](/de/concepts/memory).

  </Accordion>

  <Accordion title="Wo speichert OpenClaw seine Daten?">
    Alles liegt unter `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`):

    | Pfad                                                            | Zweck                                                              |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Hauptkonfiguration (JSON5)                                         |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Legacy-OAuth-Import (bei der ersten Verwendung in Authentifizierungsprofile kopiert) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Authentifizierungsprofile (OAuth, API-Schlüssel und optionale `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Optionale dateigestützte Secret-Nutzlast für `file`-SecretRef-Provider |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Legacy-Kompatibilitätsdatei (statische `api_key`-Einträge bereinigt) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Provider-Status (z. B. `whatsapp/<accountId>/creds.json`)          |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Agentenspezifischer Status (agentDir + Sitzungen)                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Konversationsverlauf und Status (pro Agent)                        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Sitzungsmetadaten (pro Agent)                                      |

    Legacy-Pfad für einen einzelnen Agenten: `~/.openclaw/agent/*` (migriert durch `openclaw doctor`).

    Ihr **Arbeitsbereich** (AGENTS.md, Speicherdateien, Skills usw.) ist getrennt und wird über `agents.defaults.workspace` konfiguriert (Standard: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Wo sollten AGENTS.md / SOUL.md / USER.md / MEMORY.md liegen?">
    Diese Dateien liegen im **Agenten-Arbeitsbereich**, nicht in `~/.openclaw`.

    - **Arbeitsbereich (pro Agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, optional `HEARTBEAT.md`.
      Kleingeschriebenes `memory.md` im Stammverzeichnis ist nur Legacy-Reparatureingabe; `openclaw doctor --fix`
      kann es in `MEMORY.md` zusammenführen, wenn beide Dateien vorhanden sind.
    - **Statusverzeichnis (`~/.openclaw`)**: Konfiguration, Channel-/Provider-Status, Authentifizierungsprofile, Sitzungen, Protokolle
      und gemeinsam genutzte Skills (`~/.openclaw/skills`).

    Der Standardarbeitsbereich ist `~/.openclaw/workspace`, konfigurierbar über:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Wenn der Bot nach einem Neustart „vergisst“, prüfen Sie, ob das Gateway bei jedem Start denselben
    Arbeitsbereich verwendet (und denken Sie daran: Der Remote-Modus verwendet den **Arbeitsbereich des Gateway-Hosts**,
    nicht Ihren lokalen Laptop).

    Tipp: Wenn Sie ein dauerhaftes Verhalten oder eine Präferenz wünschen, bitten Sie den Bot, **es in
    AGENTS.md oder MEMORY.md zu schreiben**, anstatt sich auf den Chatverlauf zu verlassen.

    Siehe [Agenten-Arbeitsbereich](/de/concepts/agent-workspace) und [Speicher](/de/concepts/memory).

  </Accordion>

  <Accordion title="Empfohlene Backup-Strategie">
    Legen Sie Ihren **Agenten-Arbeitsbereich** in einem **privaten** Git-Repository ab und sichern Sie ihn an einem
    privaten Ort (zum Beispiel GitHub privat). Dadurch werden Speicher + AGENTS/SOUL/USER-
    Dateien erfasst, und Sie können den „Geist“ des Assistenten später wiederherstellen.

    Committen Sie **nichts** unter `~/.openclaw` (Anmeldedaten, Sitzungen, Token oder verschlüsselte Secret-Nutzlasten).
    Wenn Sie eine vollständige Wiederherstellung benötigen, sichern Sie sowohl den Arbeitsbereich als auch das Statusverzeichnis
    separat (siehe die Migrationsfrage oben).

    Dokumentation: [Agenten-Arbeitsbereich](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Wie deinstalliere ich OpenClaw vollständig?">
    Siehe die dedizierte Anleitung: [Deinstallation](/de/install/uninstall).
  </Accordion>

  <Accordion title="Können Agenten außerhalb des Arbeitsbereichs arbeiten?">
    Ja. Der Arbeitsbereich ist das **standardmäßige cwd** und der Speicheranker, kein hartes Sandbox-System.
    Relative Pfade werden innerhalb des Arbeitsbereichs aufgelöst, aber absolute Pfade können auf andere
    Host-Speicherorte zugreifen, sofern Sandboxing nicht aktiviert ist. Wenn Sie Isolation benötigen, verwenden Sie
    [`agents.defaults.sandbox`](/de/gateway/sandboxing) oder agentenspezifische Sandbox-Einstellungen. Wenn Sie
    möchten, dass ein Repository das Standardarbeitsverzeichnis ist, setzen Sie den
    `workspace` dieses Agenten auf den Repository-Stamm. Das OpenClaw-Repository ist nur Quellcode; halten Sie den
    Arbeitsbereich getrennt, es sei denn, Sie möchten ausdrücklich, dass der Agent darin arbeitet.

    Beispiel (Repository als standardmäßiges cwd):

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

  <Accordion title="Remote-Modus: Wo befindet sich der Sitzungsspeicher?">
    Der Sitzungsstatus gehört dem **Gateway-Host**. Wenn Sie im Remote-Modus sind, befindet sich der für Sie relevante Sitzungsspeicher auf der Remote-Maschine, nicht auf Ihrem lokalen Laptop. Siehe [Sitzungsverwaltung](/de/concepts/session).
  </Accordion>
</AccordionGroup>

## Grundlagen der Konfiguration

<AccordionGroup>
  <Accordion title="Welches Format hat die Konfiguration? Wo befindet sie sich?">
    OpenClaw liest eine optionale **JSON5**-Konfiguration aus `$OPENCLAW_CONFIG_PATH` (Standard: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Wenn die Datei fehlt, verwendet es halbwegs sichere Standards (einschließlich eines Standardarbeitsbereichs von `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ich habe gateway.bind: "lan" (oder "tailnet") gesetzt und jetzt lauscht nichts / die UI sagt nicht autorisiert'>
    Nicht-loopback-Binds **erfordern einen gültigen Gateway-Authentifizierungspfad**. In der Praxis bedeutet das:

    - Authentifizierung mit gemeinsamem Secret: Token oder Passwort
    - `gateway.auth.mode: "trusted-proxy"` hinter einem korrekt konfigurierten identitätsbewussten Reverse-Proxy

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

    - `gateway.remote.token` / `.password` aktivieren für sich allein keine lokale Gateway-Authentifizierung.
    - Lokale Aufrufpfade können `gateway.remote.*` nur dann als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
    - Für Passwortauthentifizierung setzen Sie stattdessen `gateway.auth.mode: "password"` plus `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht aufgelöst ist, schlägt die Auflösung geschlossen fehl (keine Maskierung durch Remote-Fallback).
    - Control-UI-Einrichtungen mit gemeinsamem Secret authentifizieren sich über `connect.params.auth.token` oder `connect.params.auth.password` (gespeichert in App-/UI-Einstellungen). Identitätstragende Modi wie Tailscale Serve oder `trusted-proxy` verwenden stattdessen Request-Header. Vermeiden Sie gemeinsam genutzte Secrets in URLs.
    - Mit `gateway.auth.mode: "trusted-proxy"` erfordern Reverse-Proxys mit local loopback auf demselben Host explizit `gateway.auth.trustedProxy.allowLoopback = true` und einen Loopback-Eintrag in `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Warum benötige ich jetzt ein Token auf localhost?">
    OpenClaw erzwingt standardmäßig Gateway-Authentifizierung, einschließlich Loopback. Im normalen Standardpfad bedeutet das Token-Authentifizierung: Wenn kein expliziter Authentifizierungspfad konfiguriert ist, wird der Gateway-Start in den Token-Modus aufgelöst und erzeugt ein nur für diese Laufzeit gültiges Token für diesen Start, sodass **lokale WS-Clients sich authentifizieren müssen**. Konfigurieren Sie `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` oder `OPENCLAW_GATEWAY_PASSWORD` explizit, wenn Clients ein stabiles Secret über Neustarts hinweg benötigen. Dies blockiert andere lokale Prozesse daran, das Gateway aufzurufen.

    Wenn Sie einen anderen Authentifizierungspfad bevorzugen, können Sie explizit den Passwortmodus wählen (oder bei identitätsbewussten Reverse-Proxys `trusted-proxy`). Wenn Sie **wirklich** offenen Loopback möchten, setzen Sie in Ihrer Konfiguration explizit `gateway.auth.mode: "none"`. Doctor kann jederzeit ein Token für Sie generieren: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Muss ich nach dem Ändern der Konfiguration neu starten?">
    Das Gateway überwacht die Konfiguration und unterstützt Hot-Reload:

    - `gateway.reload.mode: "hybrid"` (Standard): sichere Änderungen per Hot-Apply übernehmen, bei kritischen neu starten
    - `hot`, `restart`, `off` werden ebenfalls unterstützt

  </Accordion>

  <Accordion title="Wie deaktiviere ich lustige CLI-Slogans?">
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

    - `off`: blendet den Slogan-Text aus, behält aber die Banner-Titel-/Versionszeile bei.
    - `default`: verwendet jedes Mal `All your chats, one OpenClaw.`.
    - `random`: rotierende lustige/saisonale Slogans (Standardverhalten).
    - Wenn Sie gar kein Banner möchten, setzen Sie die Umgebungsvariable `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Wie aktiviere ich Websuche (und Webabruf)?">
    `web_fetch` funktioniert ohne API-Schlüssel. `web_search` hängt von Ihrem ausgewählten
    Provider ab:

    - API-gestützte Provider wie Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity und Tavily benötigen ihre normale API-Schlüssel-Einrichtung.
    - Ollama Web Search ist schlüsselfrei, verwendet aber Ihren konfigurierten Ollama-Host und erfordert `ollama signin`.
    - DuckDuckGo ist schlüsselfrei, aber es handelt sich um eine inoffizielle HTML-basierte Integration.
    - SearXNG ist schlüsselfrei/selbst gehostet; konfigurieren Sie `SEARXNG_BASE_URL` oder `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Empfohlen:** Führen Sie `openclaw configure --section web` aus und wählen Sie einen Provider.
    Umgebungsalternativen:

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
              provider: "firecrawl", // optional; omit for auto-detect
            },
          },
        },
    }
    ```

    Provider-spezifische Websuche-Konfiguration liegt jetzt unter `plugins.entries.<plugin>.config.webSearch.*`.
    Legacy-Provider-Pfade unter `tools.web.search.*` werden vorübergehend noch aus Kompatibilitätsgründen geladen, sollten aber nicht für neue Konfigurationen verwendet werden.
    Firecrawl-Webabruf-Fallback-Konfiguration liegt unter `plugins.entries.firecrawl.config.webFetch.*`.

    Hinweise:

    - Wenn Sie Allowlists verwenden, fügen Sie `web_search`/`web_fetch`/`x_search` oder `group:web` hinzu.
    - `web_fetch` ist standardmäßig aktiviert (sofern es nicht ausdrücklich deaktiviert wurde).
    - Wenn `tools.web.fetch.provider` ausgelassen wird, erkennt OpenClaw automatisch den ersten bereiten Abruf-Fallback-Provider anhand der verfügbaren Zugangsdaten. Derzeit ist der gebündelte Provider Firecrawl.
    - Daemons lesen Umgebungsvariablen aus `~/.openclaw/.env` (oder aus der Service-Umgebung).

    Docs: [Webtools](/de/tools/web).

  </Accordion>

  <Accordion title="config.apply hat meine Konfiguration gelöscht. Wie stelle ich sie wieder her und vermeide das künftig?">
    `config.apply` ersetzt die **gesamte Konfiguration**. Wenn Sie ein partielles Objekt senden, wird alles
    andere entfernt.

    Aktuelles OpenClaw schützt vor vielen versehentlichen Überschreibungen:

    - OpenClaw-eigene Konfigurationsschreibvorgänge validieren vor dem Schreiben die vollständige Konfiguration nach der Änderung.
    - Ungültige oder destruktive OpenClaw-eigene Schreibvorgänge werden abgelehnt und als `openclaw.json.rejected.*` gespeichert.
    - Wenn eine direkte Bearbeitung den Start oder Hot Reload beschädigt, schlägt Gateway geschlossen fehl oder überspringt den Reload; `openclaw.json` wird nicht neu geschrieben.
    - `openclaw doctor --fix` ist für Reparaturen zuständig und kann die zuletzt bekannte funktionsfähige Version wiederherstellen, während die abgelehnte Datei als `openclaw.json.clobbered.*` gespeichert wird.

    Wiederherstellen:

    - Prüfen Sie `openclaw logs --follow` auf `Invalid config at`, `Config write rejected:` oder `config reload skipped (invalid config)`.
    - Prüfen Sie die neueste `openclaw.json.clobbered.*` oder `openclaw.json.rejected.*` neben der aktiven Konfiguration.
    - Führen Sie `openclaw config validate` und `openclaw doctor --fix` aus.
    - Kopieren Sie nur die beabsichtigten Schlüssel mit `openclaw config set` oder `config.patch` zurück.
    - Wenn Sie keine zuletzt bekannte funktionsfähige Version und keine abgelehnte Payload haben, stellen Sie aus einem Backup wieder her oder führen Sie `openclaw doctor` erneut aus und konfigurieren Sie Kanäle/Modelle neu.
    - Wenn dies unerwartet war, melden Sie einen Bug und fügen Sie Ihre zuletzt bekannte Konfiguration oder ein Backup bei.
    - Ein lokaler Coding-Agent kann aus Logs oder Verlauf oft eine funktionsfähige Konfiguration rekonstruieren.

    Vermeiden:

    - Verwenden Sie `openclaw config set` für kleine Änderungen.
    - Verwenden Sie `openclaw configure` für interaktive Bearbeitungen.
    - Verwenden Sie zuerst `config.schema.lookup`, wenn Sie sich bei einem exakten Pfad oder der Feldstruktur nicht sicher sind; es gibt einen flachen Schema-Knoten plus direkte Zusammenfassungen der untergeordneten Elemente für Drill-down zurück.
    - Verwenden Sie `config.patch` für partielle RPC-Bearbeitungen; behalten Sie `config.apply` nur für den Austausch der vollständigen Konfiguration bei.
    - Wenn Sie das owner-only-Tool `gateway` aus einem Agent-Lauf verwenden, lehnt es weiterhin Schreibvorgänge auf `tools.exec.ask` / `tools.exec.security` ab (einschließlich Legacy-Aliasen `tools.bash.*`, die auf dieselben geschützten Exec-Pfade normalisiert werden).

    Docs: [Konfiguration](/de/cli/config), [Konfigurieren](/de/cli/configure), [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/de/gateway/doctor).

  </Accordion>

  <Accordion title="Wie betreibe ich einen zentralen Gateway mit spezialisierten Workern über mehrere Geräte hinweg?">
    Das übliche Muster ist **ein Gateway** (z. B. Raspberry Pi) plus **Nodes** und **Agents**:

    - **Gateway (zentral):** verwaltet Kanäle (Signal/WhatsApp), Routing und Sitzungen.
    - **Nodes (Geräte):** Macs/iOS/Android verbinden sich als Peripheriegeräte und stellen lokale Tools bereit (`system.run`, `canvas`, `camera`).
    - **Agents (Worker):** getrennte Brains/Workspaces für besondere Rollen (z. B. „Hetzner Ops“, „Persönliche Daten“).
    - **Sub-Agents:** starten Hintergrundarbeit von einem Haupt-Agent aus, wenn Sie Parallelität wünschen.
    - **TUI:** verbindet sich mit dem Gateway und wechselt Agents/Sitzungen.

    Docs: [Nodes](/de/nodes), [Remote-Zugriff](/de/gateway/remote), [Multi-Agent-Routing](/de/concepts/multi-agent), [Sub-Agents](/de/tools/subagents), [TUI](/de/web/tui).

  </Accordion>

  <Accordion title="Kann der OpenClaw-Browser headless laufen?">
    Ja. Das ist eine Konfigurationsoption:

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

    Standard ist `false` (mit sichtbarer Oberfläche). Headless löst auf manchen Websites eher Anti-Bot-Prüfungen aus. Siehe [Browser](/de/tools/browser).

    Headless verwendet dieselbe **Chromium-Engine** und funktioniert für die meisten Automatisierungen (Formulare, Klicks, Scraping, Logins). Die wichtigsten Unterschiede:

    - Kein sichtbares Browserfenster (verwenden Sie Screenshots, wenn Sie visuelle Ausgabe benötigen).
    - Manche Websites sind im Headless-Modus strenger bei Automatisierung (CAPTCHAs, Anti-Bot).
      Beispielsweise blockiert X/Twitter Headless-Sitzungen häufig.

  </Accordion>

  <Accordion title="Wie verwende ich Brave für Browsersteuerung?">
    Setzen Sie `browser.executablePath` auf Ihr Brave-Binary (oder einen beliebigen Chromium-basierten Browser) und starten Sie den Gateway neu.
    Die vollständigen Konfigurationsbeispiele finden Sie unter [Browser](/de/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Remote-Gateways und Nodes

<AccordionGroup>
  <Accordion title="Wie werden Befehle zwischen Telegram, dem Gateway und Nodes weitergegeben?">
    Telegram-Nachrichten werden vom **Gateway** verarbeitet. Der Gateway führt den Agent aus und
    ruft erst danach Nodes über den **Gateway WebSocket** auf, wenn ein Node-Tool benötigt wird:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes sehen keinen eingehenden Provider-Traffic; sie empfangen nur Node-RPC-Aufrufe.

  </Accordion>

  <Accordion title="Wie kann mein Agent auf meinen Computer zugreifen, wenn der Gateway remote gehostet wird?">
    Kurz gesagt: **Koppeln Sie Ihren Computer als Node**. Der Gateway läuft woanders, kann aber
    `node.*`-Tools (Bildschirm, Kamera, System) auf Ihrem lokalen Rechner über den Gateway WebSocket aufrufen.

    Typische Einrichtung:

    1. Führen Sie den Gateway auf dem Always-on-Host aus (VPS/Home-Server).
    2. Bringen Sie den Gateway-Host und Ihren Computer in dasselbe Tailnet.
    3. Stellen Sie sicher, dass der Gateway-WS erreichbar ist (Tailnet-Bind oder SSH-Tunnel).
    4. Öffnen Sie die macOS-App lokal und verbinden Sie sich im Modus **Remote über SSH** (oder direktes Tailnet),
       damit sie sich als Node registrieren kann.
    5. Genehmigen Sie den Node auf dem Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Es ist keine separate TCP-Bridge erforderlich; Nodes verbinden sich über den Gateway WebSocket.

    Sicherheitshinweis: Das Koppeln eines macOS-Node erlaubt `system.run` auf diesem Rechner. Koppeln Sie nur
    Geräte, denen Sie vertrauen, und lesen Sie [Sicherheit](/de/gateway/security).

    Docs: [Nodes](/de/nodes), [Gateway-Protokoll](/de/gateway/protocol), [macOS-Remote-Modus](/de/platforms/mac/remote), [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Tailscale ist verbunden, aber ich erhalte keine Antworten. Was jetzt?">
    Prüfen Sie die Grundlagen:

    - Gateway läuft: `openclaw gateway status`
    - Gateway-Health: `openclaw status`
    - Kanal-Health: `openclaw channels status`

    Prüfen Sie anschließend Authentifizierung und Routing:

    - Wenn Sie Tailscale Serve verwenden, stellen Sie sicher, dass `gateway.auth.allowTailscale` korrekt gesetzt ist.
    - Wenn Sie sich über einen SSH-Tunnel verbinden, bestätigen Sie, dass der lokale Tunnel aktiv ist und auf den richtigen Port zeigt.
    - Bestätigen Sie, dass Ihre Allowlists (DM oder Gruppe) Ihr Konto enthalten.

    Docs: [Tailscale](/de/gateway/tailscale), [Remote-Zugriff](/de/gateway/remote), [Kanäle](/de/channels).

  </Accordion>

  <Accordion title="Können zwei OpenClaw-Instanzen miteinander sprechen (lokal + VPS)?">
    Ja. Es gibt keine eingebaute „Bot-zu-Bot“-Bridge, aber Sie können sie auf einige
    zuverlässige Arten verdrahten:

    **Am einfachsten:** Verwenden Sie einen normalen Chat-Kanal, auf den beide Bots zugreifen können (Telegram/Slack/WhatsApp).
    Lassen Sie Bot A eine Nachricht an Bot B senden, und Bot B antwortet dann wie gewohnt.

    **CLI-Bridge (generisch):** Führen Sie ein Skript aus, das den anderen Gateway mit
    `openclaw agent --message ... --deliver` aufruft und auf einen Chat zielt, in dem der andere Bot
    lauscht. Wenn ein Bot auf einem remote VPS läuft, richten Sie Ihre CLI über SSH/Tailscale auf diesen remote Gateway
    (siehe [Remote-Zugriff](/de/gateway/remote)).

    Beispielmuster (von einem Rechner ausführen, der den Ziel-Gateway erreichen kann):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Tipp: Fügen Sie eine Leitplanke hinzu, damit die beiden Bots nicht endlos in einer Schleife laufen (nur Erwähnungen, Kanal-
    Allowlists oder eine Regel „nicht auf Bot-Nachrichten antworten“).

    Docs: [Remote-Zugriff](/de/gateway/remote), [Agent-CLI](/de/cli/agent), [Agent-Senden](/de/tools/agent-send).

  </Accordion>

  <Accordion title="Brauche ich separate VPSes für mehrere Agents?">
    Nein. Ein Gateway kann mehrere Agents hosten, jeweils mit eigenem Workspace, Modell-Defaults
    und Routing. Das ist die normale Einrichtung und deutlich günstiger und einfacher als
    ein VPS pro Agent.

    Verwenden Sie separate VPSes nur, wenn Sie harte Isolation (Sicherheitsgrenzen) oder sehr
    unterschiedliche Konfigurationen benötigen, die Sie nicht teilen möchten. Andernfalls behalten Sie einen Gateway und
    verwenden mehrere Agents oder Sub-Agents.

  </Accordion>

  <Accordion title="Gibt es einen Vorteil, einen Node auf meinem persönlichen Laptop statt SSH von einem VPS zu verwenden?">
    Ja – Nodes sind der primäre Weg, um Ihren Laptop von einem remote Gateway aus zu erreichen, und sie
    ermöglichen mehr als Shell-Zugriff. Der Gateway läuft auf macOS/Linux (Windows über WSL2) und ist
    leichtgewichtig (ein kleiner VPS oder ein Rechner der Raspberry-Pi-Klasse reicht; 4 GB RAM sind ausreichend), daher ist eine übliche
    Einrichtung ein Always-on-Host plus Ihr Laptop als Node.

    - **Kein eingehendes SSH erforderlich.** Nodes verbinden sich nach außen mit dem Gateway WebSocket und verwenden Gerätekopplung.
    - **Sicherere Ausführungskontrollen.** `system.run` wird durch Node-Allowlists/Genehmigungen auf diesem Laptop geschützt.
    - **Mehr Gerätetools.** Nodes stellen zusätzlich zu `system.run` auch `canvas`, `camera` und `screen` bereit.
    - **Lokale Browserautomatisierung.** Belassen Sie den Gateway auf einem VPS, führen Sie Chrome aber lokal über einen Node-Host auf dem Laptop aus oder hängen Sie sich über Chrome MCP an lokales Chrome auf dem Host an.

    SSH ist für Ad-hoc-Shell-Zugriff in Ordnung, aber Nodes sind für laufende Agent-Workflows und
    Geräteautomatisierung einfacher.

    Docs: [Nodes](/de/nodes), [Nodes-CLI](/de/cli/nodes), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Führen Nodes einen Gateway-Service aus?">
    Nein. Pro Host sollte nur **ein Gateway** laufen, es sei denn, Sie führen absichtlich isolierte Profile aus (siehe [Mehrere Gateways](/de/gateway/multiple-gateways)). Nodes sind Peripheriegeräte, die sich
    mit dem Gateway verbinden (iOS-/Android-Nodes oder der macOS-„Node-Modus“ in der Menüleisten-App). Für Headless-Node-
    Hosts und CLI-Steuerung siehe [Node-Host-CLI](/de/cli/node).

    Ein vollständiger Neustart ist für Änderungen an `gateway`, `discovery` und gehosteten Plugin-Oberflächen erforderlich.

  </Accordion>

  <Accordion title="Gibt es eine API-/RPC-Möglichkeit, Konfiguration anzuwenden?">
    Ja.

    - `config.schema.lookup`: einen Config-Teilbaum mit seinem flachen Schemaknoten, dem passenden UI-Hinweis und Zusammenfassungen der direkten untergeordneten Elemente prüfen, bevor geschrieben wird
    - `config.get`: aktuellen Snapshot + Hash abrufen
    - `config.patch`: sichere Teilaktualisierung (für die meisten RPC-Bearbeitungen bevorzugt); lädt wenn möglich im laufenden Betrieb neu und startet neu, wenn erforderlich
    - `config.apply`: validieren + vollständige Config ersetzen; lädt wenn möglich im laufenden Betrieb neu und startet neu, wenn erforderlich
    - Das nur für Owner vorgesehene `gateway`-Runtime-Tool verweigert weiterhin das Umschreiben von `tools.exec.ask` / `tools.exec.security`; Legacy-Aliasse `tools.bash.*` werden auf dieselben geschützten Exec-Pfade normalisiert

  </Accordion>

  <Accordion title="Minimal sinnvolle Config für eine Erstinstallation">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Damit legen Sie Ihren Workspace fest und beschränken, wer den Bot auslösen kann.

  </Accordion>

  <Accordion title="Wie richte ich Tailscale auf einem VPS ein und verbinde mich von meinem Mac aus?">
    Minimale Schritte:

    1. **Auf dem VPS installieren + anmelden**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Auf Ihrem Mac installieren + anmelden**
       - Verwenden Sie die Tailscale-App und melden Sie sich beim selben Tailnet an.
    3. **MagicDNS aktivieren (empfohlen)**
       - Aktivieren Sie in der Tailscale-Admin-Konsole MagicDNS, damit der VPS einen stabilen Namen hat.
    4. **Den Tailnet-Hostnamen verwenden**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Wenn Sie die Control UI ohne SSH nutzen möchten, verwenden Sie Tailscale Serve auf dem VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Dadurch bleibt das Gateway an loopback gebunden und stellt HTTPS über Tailscale bereit. Siehe [Tailscale](/de/gateway/tailscale).

  </Accordion>

  <Accordion title="Wie verbinde ich eine Mac-Node mit einem entfernten Gateway (Tailscale Serve)?">
    Serve stellt die **Gateway Control UI + WS** bereit. Nodes verbinden sich über denselben Gateway-WS-Endpunkt.

    Empfohlenes Setup:

    1. **Stellen Sie sicher, dass sich VPS + Mac im selben Tailnet befinden**.
    2. **Verwenden Sie die macOS-App im Remote-Modus** (SSH-Ziel kann der Tailnet-Hostname sein).
       Die App tunnelt den Gateway-Port und verbindet sich als Node.
    3. **Genehmigen Sie die Node** auf dem Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Doku: [Gateway-Protokoll](/de/gateway/protocol), [Discovery](/de/gateway/discovery), [macOS-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Sollte ich auf einem zweiten Laptop installieren oder nur eine Node hinzufügen?">
    Wenn Sie auf dem zweiten Laptop nur **lokale Tools** (Bildschirm/Kamera/Exec) benötigen, fügen Sie ihn als
    **Node** hinzu. Dadurch bleibt es bei einem einzigen Gateway und doppelte Config wird vermieden. Lokale Node-Tools sind
    derzeit nur für macOS verfügbar, aber wir planen, sie auf andere Betriebssysteme auszuweiten.

    Installieren Sie ein zweites Gateway nur, wenn Sie **strikte Isolation** oder zwei vollständig separate Bots benötigen.

    Doku: [Nodes](/de/nodes), [Nodes-CLI](/de/cli/nodes), [Mehrere Gateways](/de/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env-Vars und Laden von .env-Dateien

<AccordionGroup>
  <Accordion title="Wie lädt OpenClaw Umgebungsvariablen?">
    OpenClaw liest Env-Vars aus dem übergeordneten Prozess (Shell, launchd/systemd, CI usw.) und lädt zusätzlich:

    - `.env` aus dem aktuellen Arbeitsverzeichnis
    - eine globale Fallback-`.env` aus `~/.openclaw/.env` (auch `$OPENCLAW_STATE_DIR/.env`)

    Keine der beiden `.env`-Dateien überschreibt bestehende Env-Vars.

    Sie können Inline-Env-Vars auch in der Config definieren (werden nur angewendet, wenn sie in der Prozessumgebung fehlen):

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

  <Accordion title="Ich habe das Gateway über den Dienst gestartet und meine Env-Vars sind verschwunden. Was jetzt?">
    Zwei häufige Lösungen:

    1. Legen Sie die fehlenden Schlüssel in `~/.openclaw/.env` ab, damit sie auch dann übernommen werden, wenn der Dienst Ihre Shell-Umgebung nicht erbt.
    2. Aktivieren Sie den Shell-Import (Opt-in-Komfortfunktion):

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

    Dadurch wird Ihre Login-Shell ausgeführt und es werden nur fehlende erwartete Schlüssel importiert (niemals überschrieben). Entsprechende Env-Vars:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ich habe COPILOT_GITHUB_TOKEN gesetzt, aber der Modellstatus zeigt "Shell env: off." Warum?'>
    `openclaw models status` meldet, ob der **Shell-Env-Import** aktiviert ist. "Shell env: off"
    bedeutet **nicht**, dass Ihre Env-Vars fehlen - es bedeutet nur, dass OpenClaw Ihre
    Login-Shell nicht automatisch lädt.

    Wenn das Gateway als Dienst (launchd/systemd) ausgeführt wird, erbt es Ihre Shell-
    Umgebung nicht. Beheben Sie das mit einer dieser Optionen:

    1. Legen Sie das Token in `~/.openclaw/.env` ab:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Oder aktivieren Sie den Shell-Import (`env.shellEnv.enabled: true`).
    3. Oder fügen Sie es dem `env`-Block Ihrer Config hinzu (wird nur angewendet, wenn es fehlt).

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
    Senden Sie `/new` oder `/reset` als eigenständige Nachricht. Siehe [Session-Verwaltung](/de/concepts/session).
  </Accordion>

  <Accordion title="Werden Sessions automatisch zurückgesetzt, wenn ich nie /new sende?">
    Sessions können nach `session.idleMinutes` ablaufen, dies ist jedoch **standardmäßig deaktiviert** (Standardwert **0**).
    Setzen Sie den Wert auf eine positive Zahl, um den Ablauf bei Inaktivität zu aktivieren. Wenn aktiviert, startet die **nächste**
    Nachricht nach der Inaktivitätsdauer eine neue Session-ID für diesen Chat-Schlüssel.
    Dadurch werden keine Transkripte gelöscht - es wird nur eine neue Session gestartet.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Gibt es eine Möglichkeit, ein Team von OpenClaw-Instanzen zu erstellen (ein CEO und viele Agenten)?">
    Ja, über **Multi-Agent-Routing** und **Sub-Agenten**. Sie können einen Koordinator-
    Agenten und mehrere Worker-Agenten mit eigenen Workspaces und Modellen erstellen.

    Dennoch sollte dies am besten als **unterhaltsames Experiment** betrachtet werden. Es verbraucht viele Tokens und ist oft
    weniger effizient, als einen Bot mit separaten Sessions zu verwenden. Das typische Modell, das wir
    uns vorstellen, ist ein Bot, mit dem Sie sprechen, mit verschiedenen Sessions für parallele Arbeit. Dieser
    Bot kann bei Bedarf auch Sub-Agenten starten.

    Doku: [Multi-Agent-Routing](/de/concepts/multi-agent), [Sub-Agenten](/de/tools/subagents), [Agenten-CLI](/de/cli/agents).

  </Accordion>

  <Accordion title="Warum wurde der Kontext mitten in einer Aufgabe abgeschnitten? Wie verhindere ich das?">
    Der Session-Kontext ist durch das Modellfenster begrenzt. Lange Chats, große Tool-Ausgaben oder viele
    Dateien können Compaction oder Kürzung auslösen.

    Das hilft:

    - Bitten Sie den Bot, den aktuellen Stand zusammenzufassen und in eine Datei zu schreiben.
    - Verwenden Sie `/compact` vor langen Aufgaben und `/new` beim Themenwechsel.
    - Halten Sie wichtigen Kontext im Workspace vor und bitten Sie den Bot, ihn erneut zu lesen.
    - Verwenden Sie Sub-Agenten für lange oder parallele Arbeit, damit der Hauptchat kleiner bleibt.
    - Wählen Sie ein Modell mit größerem Kontextfenster, wenn dies häufig passiert.

  </Accordion>

  <Accordion title="Wie setze ich OpenClaw vollständig zurück, behalte es aber installiert?">
    Verwenden Sie den Reset-Befehl:

    ```bash
    openclaw reset
    ```

    Nicht interaktiver vollständiger Reset:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Führen Sie anschließend das Setup erneut aus:

    ```bash
    openclaw onboard --install-daemon
    ```

    Hinweise:

    - Onboarding bietet auch **Reset** an, wenn eine bestehende Config erkannt wird. Siehe [Onboarding (CLI)](/de/start/wizard).
    - Wenn Sie Profile verwendet haben (`--profile` / `OPENCLAW_PROFILE`), setzen Sie jedes State-Verzeichnis zurück (Standardwerte sind `~/.openclaw-<profile>`).
    - Dev-Reset: `openclaw gateway --dev --reset` (nur für Dev; löscht Dev-Config + Anmeldedaten + Sessions + Workspace).

  </Accordion>

  <Accordion title='Ich bekomme Fehler vom Typ "context too large" - wie setze ich zurück oder komprimiere?'>
    Verwenden Sie eine dieser Optionen:

    - **Compact** (behält die Unterhaltung bei, fasst aber ältere Turns zusammen):

      ```
      /compact
      ```

      oder `/compact <instructions>`, um die Zusammenfassung zu steuern.

    - **Reset** (neue Session-ID für denselben Chat-Schlüssel):

      ```
      /new
      /reset
      ```

    Wenn es weiterhin passiert:

    - Aktivieren oder konfigurieren Sie **Session-Pruning** (`agents.defaults.contextPruning`), um alte Tool-Ausgaben zu kürzen.
    - Verwenden Sie ein Modell mit größerem Kontextfenster.

    Doku: [Compaction](/de/concepts/compaction), [Session-Pruning](/de/concepts/session-pruning), [Session-Verwaltung](/de/concepts/session).

  </Accordion>

  <Accordion title='Warum sehe ich "LLM request rejected: messages.content.tool_use.input field required"?'>
    Dies ist ein Provider-Validierungsfehler: Das Modell hat einen `tool_use`-Block ohne das erforderliche
    `input` ausgegeben. Das bedeutet normalerweise, dass die Session-Historie veraltet oder beschädigt ist (oft nach langen Threads
    oder einer Tool-/Schemaänderung).

    Lösung: Starten Sie mit `/new` eine neue Session (eigenständige Nachricht).

  </Accordion>

  <Accordion title="Warum erhalte ich alle 30 Minuten Heartbeat-Nachrichten?">
    Heartbeats laufen standardmäßig alle **30m** (**1h** bei OAuth-Authentifizierung). Passen Sie sie an oder deaktivieren Sie sie:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // or "0m" to disable
          },
        },
      },
    }
    ```

    Wenn `HEARTBEAT.md` existiert, aber praktisch leer ist (nur Leerzeilen und Markdown-
    Überschriften wie `# Heading`), überspringt OpenClaw den Heartbeat-Lauf, um API-Aufrufe zu sparen.
    Wenn die Datei fehlt, läuft der Heartbeat trotzdem und das Modell entscheidet, was zu tun ist.

    Überschreibungen pro Agent verwenden `agents.list[].heartbeat`. Doku: [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title='Muss ich einem WhatsApp-Gruppenchat ein "bot account" hinzufügen?'>
    Nein. OpenClaw läuft über **Ihr eigenes Konto**. Wenn Sie also in der Gruppe sind, kann OpenClaw sie sehen.
    Standardmäßig sind Gruppenantworten blockiert, bis Sie Absender erlauben (`groupPolicy: "allowlist"`).

    Wenn nur **Sie** Gruppenantworten auslösen können sollen:

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
    Option 1 (am schnellsten): Logs mitverfolgen und eine Testnachricht in der Gruppe senden:

    ```bash
    openclaw logs --follow --json
    ```

    Suchen Sie nach `chatId` (oder `from`), das auf `@g.us` endet, zum Beispiel:
    `1234567890-1234567890@g.us`.

    Option 2 (falls bereits konfiguriert/auf der Allowlist): Gruppen aus der Config auflisten:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Doku: [WhatsApp](/de/channels/whatsapp), [Directory](/de/cli/directory), [Logs](/de/cli/logs).

  </Accordion>

  <Accordion title="Warum antwortet OpenClaw nicht in einer Gruppe?">
    Zwei häufige Ursachen:

    - Mention-Gating ist aktiviert (Standard). Sie müssen den Bot per @ erwähnen (oder `mentionPatterns` erfüllen).
    - Sie haben `channels.whatsapp.groups` ohne `"*"` konfiguriert und die Gruppe steht nicht auf der Allowlist.

    Siehe [Gruppen](/de/channels/groups) und [Gruppennachrichten](/de/channels/group-messages).

  </Accordion>

  <Accordion title="Teilen Gruppen/Threads Kontext mit DMs?">
    Direktchats werden standardmäßig zur Haupt-Session zusammengeführt. Gruppen/Channels haben eigene Session-Schlüssel, und Telegram-Themen / Discord-Threads sind separate Sessions. Siehe [Gruppen](/de/channels/groups) und [Gruppennachrichten](/de/channels/group-messages).
  </Accordion>

  <Accordion title="Wie viele Workspaces und Agenten kann ich erstellen?">
    Keine festen Begrenzungen. Dutzende (sogar Hunderte) sind in Ordnung, aber achten Sie auf:

    - **Festplattenwachstum:** Sitzungen + Transkripte liegen unter `~/.openclaw/agents/<agentId>/sessions/`.
    - **Token-Kosten:** mehr Agenten bedeuten mehr gleichzeitige Modellnutzung.
    - **Betriebsaufwand:** Auth-Profile, Workspaces und Channel-Routing pro Agent.

    Tipps:

    - Behalten Sie einen **aktiven** Workspace pro Agent bei (`agents.defaults.workspace`).
    - Bereinigen Sie alte Sitzungen (JSONL- oder Store-Einträge löschen), wenn die Festplattennutzung wächst.
    - Verwenden Sie `openclaw doctor`, um verwaiste Workspaces und Profilabweichungen zu finden.

  </Accordion>

  <Accordion title="Kann ich mehrere Bots oder Chats gleichzeitig ausführen (Slack), und wie sollte ich das einrichten?">
    Ja. Verwenden Sie **Multi-Agent Routing**, um mehrere isolierte Agenten auszuführen und eingehende Nachrichten nach
    Channel/Konto/Peer zu routen. Slack wird als Channel unterstützt und kann an bestimmte Agenten gebunden werden.

    Browserzugriff ist leistungsfähig, aber nicht "kann alles tun, was ein Mensch kann" - Anti-Bot-Maßnahmen, CAPTCHAs und MFA können
    Automatisierung weiterhin blockieren. Für die zuverlässigste Browsersteuerung verwenden Sie lokales Chrome MCP auf dem Host
    oder CDP auf der Maschine, die den Browser tatsächlich ausführt.

    Empfohlene Einrichtung:

    - Immer aktiver Gateway-Host (VPS/Mac mini).
    - Ein Agent pro Rolle (Bindungen).
    - Slack-Channel(s), die an diese Agenten gebunden sind.
    - Lokaler Browser über Chrome MCP oder bei Bedarf über einen Node.

    Dokumentation: [Multi-Agent Routing](/de/concepts/multi-agent), [Slack](/de/channels/slack),
    [Browser](/de/tools/browser), [Nodes](/de/nodes).

  </Accordion>
</AccordionGroup>

## Modelle, Failover und Auth-Profile

Modell-Fragen und -Antworten - Defaults, Auswahl, Aliasse, Wechsel, Failover, Auth-Profile -
finden Sie in den [Modell-FAQ](/de/help/faq-models).

## Gateway: Ports, "läuft bereits" und Remote-Modus

<AccordionGroup>
  <Accordion title="Welchen Port verwendet der Gateway?">
    `gateway.port` steuert den einzelnen multiplexierten Port für WebSocket + HTTP (Control UI, Hooks usw.).

    Rangfolge:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Warum sagt openclaw gateway status "Runtime: running", aber "Connectivity probe: failed"?'>
    Weil "running" die Sicht des **Supervisors** ist (launchd/systemd/schtasks). Der Connectivity-Probe ist die CLI, die tatsächlich eine Verbindung zum Gateway-WebSocket herstellt.

    Verwenden Sie `openclaw gateway status` und vertrauen Sie diesen Zeilen:

    - `Probe target:` (die URL, die der Probe tatsächlich verwendet hat)
    - `Listening:` (was tatsächlich an den Port gebunden ist)
    - `Last gateway error:` (häufige Ursache, wenn der Prozess läuft, aber der Port nicht lauscht)

  </Accordion>

  <Accordion title='Warum zeigt openclaw gateway status unterschiedliche Werte für "Config (cli)" und "Config (service)"?'>
    Sie bearbeiten eine Konfigurationsdatei, während der Dienst eine andere verwendet (oft eine Abweichung bei `--profile` / `OPENCLAW_STATE_DIR`).

    Behebung:

    ```bash
    openclaw gateway install --force
    ```

    Führen Sie das aus demselben `--profile` / derselben Umgebung aus, die der Dienst verwenden soll.

  </Accordion>

  <Accordion title='Was bedeutet "another gateway instance is already listening"?'>
    OpenClaw erzwingt eine Laufzeitsperre, indem der WebSocket-Listener unmittelbar beim Start gebunden wird (Standard `ws://127.0.0.1:18789`). Wenn das Binden mit `EADDRINUSE` fehlschlägt, wird `GatewayLockError` ausgelöst und zeigt an, dass bereits eine andere Instanz lauscht.

    Behebung: Stoppen Sie die andere Instanz, geben Sie den Port frei oder starten Sie mit `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Wie führe ich OpenClaw im Remote-Modus aus (Client verbindet sich mit einem Gateway an anderer Stelle)?">
    Setzen Sie `gateway.mode: "remote"` und verweisen Sie auf eine Remote-WebSocket-URL, optional mit Remote-Zugangsdaten über ein gemeinsames Geheimnis:

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

    - `openclaw gateway` startet nur, wenn `gateway.mode` `local` ist (oder Sie das Override-Flag übergeben).
    - Die macOS-App beobachtet die Konfigurationsdatei und wechselt live den Modus, wenn sich diese Werte ändern.
    - `gateway.remote.token` / `.password` sind nur clientseitige Remote-Zugangsdaten; sie aktivieren für sich genommen keine lokale Gateway-Authentifizierung.

  </Accordion>

  <Accordion title='Die Control UI sagt "unauthorized" (oder verbindet sich ständig neu). Was nun?'>
    Ihr Gateway-Auth-Pfad und die Auth-Methode der UI passen nicht zusammen.

    Fakten (aus dem Code):

    - Die Control UI speichert das Token in `sessionStorage` für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL, sodass Aktualisierungen im selben Tab weiter funktionieren, ohne langlebige localStorage-Token-Persistenz wiederherzustellen.
    - Bei `AUTH_TOKEN_MISMATCH` können vertrauenswürdige Clients einen begrenzten Wiederholungsversuch mit einem zwischengespeicherten Gerätetoken ausführen, wenn der Gateway Wiederholungshinweise zurückgibt (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Dieser Cached-Token-Wiederholungsversuch verwendet nun die zwischengespeicherten genehmigten Scopes wieder, die mit dem Gerätetoken gespeichert sind. Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten weiterhin ihren angeforderten Scope-Satz, anstatt zwischengespeicherte Scopes zu übernehmen.
    - Außerhalb dieses Wiederholungswegs gilt für Connect-Auth folgende Priorität: zuerst explizites gemeinsames Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Gerätetoken, dann Bootstrap-Token.
    - Bootstrap-Token-Scope-Prüfungen sind rollenpräfixiert. Die integrierte Bootstrap-Operator-Allowlist erfüllt nur Operator-Anfragen; Node- oder andere Nicht-Operator-Rollen benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.

    Behebung:

    - Am schnellsten: `openclaw dashboard` (gibt die Dashboard-URL aus + kopiert sie, versucht sie zu öffnen; zeigt bei Headless-Betrieb einen SSH-Hinweis).
    - Wenn Sie noch kein Token haben: `openclaw doctor --generate-gateway-token`.
    - Wenn remote, zuerst tunneln: `ssh -N -L 18789:127.0.0.1:18789 user@host`, dann `http://127.0.0.1:18789/` öffnen.
    - Shared-Secret-Modus: Setzen Sie `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` oder `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, und fügen Sie dann das passende Geheimnis in den Einstellungen der Control UI ein.
    - Tailscale Serve-Modus: Stellen Sie sicher, dass `gateway.auth.allowTailscale` aktiviert ist und Sie die Serve-URL öffnen, nicht eine rohe Loopback-/Tailnet-URL, die Tailscale-Identitätsheader umgeht.
    - Trusted-Proxy-Modus: Stellen Sie sicher, dass Sie über den konfigurierten identitätsbewussten Proxy kommen, nicht über eine rohe Gateway-URL. Same-Host-Loopback-Proxys benötigen außerdem `gateway.auth.trustedProxy.allowLoopback = true`.
    - Wenn die Abweichung nach dem einen Wiederholungsversuch bestehen bleibt, rotieren/genehmigen Sie das gekoppelte Gerätetoken erneut:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Wenn dieser Rotate-Aufruf meldet, dass er abgelehnt wurde, prüfen Sie zwei Dinge:
      - Sitzungen mit gekoppelten Geräten können nur ihr **eigenes** Gerät rotieren, sofern sie nicht zusätzlich `operator.admin` haben
      - explizite `--scope`-Werte dürfen die aktuellen Operator-Scopes des Aufrufers nicht überschreiten
    - Immer noch blockiert? Führen Sie `openclaw status --all` aus und folgen Sie [Troubleshooting](/de/gateway/troubleshooting). Siehe [Dashboard](/de/web/dashboard) für Auth-Details.

  </Accordion>

  <Accordion title="Ich habe gateway.bind auf tailnet gesetzt, aber es kann nicht binden und nichts lauscht">
    `tailnet`-Bindung wählt eine Tailscale-IP aus Ihren Netzwerkschnittstellen (100.64.0.0/10). Wenn die Maschine nicht in Tailscale ist (oder die Schnittstelle down ist), gibt es nichts, woran gebunden werden kann.

    Behebung:

    - Starten Sie Tailscale auf diesem Host (damit er eine 100.x-Adresse hat), oder
    - Wechseln Sie zu `gateway.bind: "loopback"` / `"lan"`.

    Hinweis: `tailnet` ist explizit. `auto` bevorzugt Loopback; verwenden Sie `gateway.bind: "tailnet"`, wenn Sie eine reine Tailnet-Bindung wünschen.

  </Accordion>

  <Accordion title="Kann ich mehrere Gateways auf demselben Host ausführen?">
    Normalerweise nein - ein Gateway kann mehrere Messaging-Channels und Agenten ausführen. Verwenden Sie mehrere Gateways nur, wenn Sie Redundanz (z. B. Rescue-Bot) oder harte Isolation benötigen.

    Ja, aber Sie müssen isolieren:

    - `OPENCLAW_CONFIG_PATH` (Konfiguration pro Instanz)
    - `OPENCLAW_STATE_DIR` (State pro Instanz)
    - `agents.defaults.workspace` (Workspace-Isolation)
    - `gateway.port` (eindeutige Ports)

    Schnelleinrichtung (empfohlen):

    - Verwenden Sie `openclaw --profile <name> ...` pro Instanz (erstellt automatisch `~/.openclaw-<name>`).
    - Setzen Sie in jeder Profilkonfiguration einen eindeutigen `gateway.port` (oder übergeben Sie `--port` für manuelle Läufe).
    - Installieren Sie einen Dienst pro Profil: `openclaw --profile <name> gateway install`.

    Profile hängen außerdem Suffixe an Dienstnamen an (`ai.openclaw.<profile>`; Legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Vollständige Anleitung: [Mehrere Gateways](/de/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Was bedeutet "invalid handshake" / Code 1008?'>
    Der Gateway ist ein **WebSocket-Server**, und er erwartet als allererste Nachricht
    einen `connect`-Frame. Wenn er etwas anderes empfängt, schließt er die Verbindung
    mit **Code 1008** (Richtlinienverstoß).

    Häufige Ursachen:

    - Sie haben die **HTTP**-URL in einem Browser geöffnet (`http://...`) statt in einem WS-Client.
    - Sie haben den falschen Port oder Pfad verwendet.
    - Ein Proxy oder Tunnel hat Auth-Header entfernt oder eine Nicht-Gateway-Anfrage gesendet.

    Schnelle Behebungen:

    1. Verwenden Sie die WS-URL: `ws://<host>:18789` (oder `wss://...`, wenn HTTPS).
    2. Öffnen Sie den WS-Port nicht in einem normalen Browser-Tab.
    3. Wenn Auth aktiviert ist, fügen Sie Token/Passwort in den `connect`-Frame ein.

    Wenn Sie die CLI oder TUI verwenden, sollte die URL so aussehen:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Protokolldetails: [Gateway-Protokoll](/de/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Logging und Debugging

<AccordionGroup>
  <Accordion title="Wo sind die Logs?">
    Datei-Logs (strukturiert):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Sie können über `logging.file` einen stabilen Pfad setzen. Das Datei-Log-Level wird von `logging.level` gesteuert. Die Konsolenausführlichkeit wird von `--verbose` und `logging.consoleLevel` gesteuert.

    Schnellster Log-Tail:

    ```bash
    openclaw logs --follow
    ```

    Dienst-/Supervisor-Logs (wenn der Gateway über launchd/systemd läuft):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` und `gateway.err.log` (Standard: `~/.openclaw/logs/...`; Profile verwenden `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Siehe [Troubleshooting](/de/gateway/troubleshooting) für mehr.

  </Accordion>

  <Accordion title="Wie starte/stoppe/starte ich den Gateway-Dienst neu?">
    Verwenden Sie die Gateway-Helfer:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Wenn Sie den Gateway manuell ausführen, kann `openclaw gateway --force` den Port zurückfordern. Siehe [Gateway](/de/gateway).

  </Accordion>

  <Accordion title="Ich habe mein Terminal unter Windows geschlossen - wie starte ich OpenClaw neu?">
    Es gibt **zwei Windows-Installationsmodi**:

    **1) WSL2 (empfohlen):** Der Gateway läuft innerhalb von Linux.

    Öffnen Sie PowerShell, wechseln Sie in WSL und starten Sie dann neu:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Wenn Sie den Dienst nie installiert haben, starten Sie ihn im Vordergrund:

    ```bash
    openclaw gateway run
    ```

    **2) Natives Windows (nicht empfohlen):** Der Gateway läuft direkt unter Windows.

    Öffnen Sie PowerShell und führen Sie aus:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Wenn Sie ihn manuell ausführen (kein Dienst), verwenden Sie:

    ```powershell
    openclaw gateway run
    ```

    Dokumentation: [Windows (WSL2)](/de/platforms/windows), [Gateway-Dienst-Runbook](/de/gateway).

  </Accordion>

  <Accordion title="Der Gateway ist erreichbar, aber Antworten kommen nie an. Was sollte ich prüfen?">
    Beginnen Sie mit einem schnellen Health-Check:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Häufige Ursachen:

    - Modellauthentifizierung nicht auf dem **Gateway-Host** geladen (`models status` prüfen).
    - Kanal-Pairing/Allowlist blockiert Antworten (Kanalkonfiguration + Logs prüfen).
    - WebChat/Dashboard ist ohne das richtige Token geöffnet.

    Wenn Sie remote arbeiten, bestätigen Sie, dass die Tunnel-/Tailscale-Verbindung aktiv ist und dass der
    Gateway-WebSocket erreichbar ist.

    Docs: [Kanäle](/de/channels), [Fehlerbehebung](/de/gateway/troubleshooting), [Remote-Zugriff](/de/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - was jetzt?'>
    Das bedeutet normalerweise, dass die UI die WebSocket-Verbindung verloren hat. Prüfen Sie:

    1. Läuft das Gateway? `openclaw gateway status`
    2. Ist das Gateway fehlerfrei? `openclaw status`
    3. Hat die UI das richtige Token? `openclaw dashboard`
    4. Ist bei Remote-Zugriff die Tunnel-/Tailscale-Verbindung aktiv?

    Danach Logs verfolgen:

    ```bash
    openclaw logs --follow
    ```

    Docs: [Dashboard](/de/web/dashboard), [Remote-Zugriff](/de/gateway/remote), [Fehlerbehebung](/de/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands schlägt fehl. Was sollte ich prüfen?">
    Beginnen Sie mit Logs und Kanalstatus:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Ordnen Sie dann den Fehler zu:

    - `BOT_COMMANDS_TOO_MUCH`: Das Telegram-Menü hat zu viele Einträge. OpenClaw kürzt bereits auf das Telegram-Limit und versucht es mit weniger Befehlen erneut, aber einige Menüeinträge müssen trotzdem entfernt werden. Reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle, oder deaktivieren Sie `channels.telegram.commands.native`, wenn Sie das Menü nicht benötigen.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` oder ähnliche Netzwerkfehler: Wenn Sie auf einem VPS oder hinter einem Proxy sind, bestätigen Sie, dass ausgehendes HTTPS erlaubt ist und DNS für `api.telegram.org` funktioniert.

    Wenn das Gateway remote ist, stellen Sie sicher, dass Sie die Logs auf dem Gateway-Host ansehen.

    Docs: [Telegram](/de/channels/telegram), [Kanal-Fehlerbehebung](/de/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI zeigt keine Ausgabe. Was sollte ich prüfen?">
    Bestätigen Sie zuerst, dass das Gateway erreichbar ist und der Agent laufen kann:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Verwenden Sie in der TUI `/status`, um den aktuellen Zustand zu sehen. Wenn Sie Antworten in einem Chat-
    Kanal erwarten, stellen Sie sicher, dass die Zustellung aktiviert ist (`/deliver on`).

    Docs: [TUI](/de/web/tui), [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Wie stoppe ich das Gateway vollständig und starte es danach wieder?">
    Wenn Sie den Dienst installiert haben:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Dies stoppt/startet den **überwachten Dienst** (launchd unter macOS, systemd unter Linux).
    Verwenden Sie dies, wenn das Gateway im Hintergrund als Daemon läuft.

    Wenn Sie es im Vordergrund ausführen, stoppen Sie mit Ctrl-C und dann:

    ```bash
    openclaw gateway run
    ```

    Docs: [Gateway-Service-Runbook](/de/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: startet den **Hintergrunddienst** neu (launchd/systemd).
    - `openclaw gateway`: führt das Gateway **im Vordergrund** für diese Terminalsitzung aus.

    Wenn Sie den Dienst installiert haben, verwenden Sie die Gateway-Befehle. Verwenden Sie `openclaw gateway`, wenn
    Sie einen einmaligen Lauf im Vordergrund möchten.

  </Accordion>

  <Accordion title="Schnellster Weg zu mehr Details, wenn etwas fehlschlägt">
    Starten Sie das Gateway mit `--verbose`, um mehr Konsolendetails zu erhalten. Prüfen Sie anschließend die Logdatei auf Kanalauthentifizierung, Modellrouting und RPC-Fehler.
  </Accordion>
</AccordionGroup>

## Medien und Anhänge

<AccordionGroup>
  <Accordion title="Mein Skill hat ein Bild/PDF erzeugt, aber es wurde nichts gesendet">
    Ausgehende Anhänge vom Agent müssen eine `MEDIA:<path-or-url>`-Zeile enthalten (in einer eigenen Zeile). Siehe [OpenClaw-Assistent einrichten](/de/start/openclaw) und [Agent senden](/de/tools/agent-send).

    Senden über CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Prüfen Sie auch:

    - Der Zielkanal unterstützt ausgehende Medien und wird nicht durch Allowlists blockiert.
    - Die Datei liegt innerhalb der Größenlimits des Providers (Bilder werden auf maximal 2048px verkleinert).
    - `tools.fs.workspaceOnly=true` beschränkt lokale Pfad-Sends auf Workspace, Temp-/Media-Store und sandbox-validierte Dateien.
    - `tools.fs.workspaceOnly=false` lässt `MEDIA:` host-lokale Dateien senden, die der Agent bereits lesen kann, aber nur für Medien plus sichere Dokumenttypen (Bilder, Audio, Video, PDF und Office-Dokumente). Klartext- und geheimnisähnliche Dateien werden weiterhin blockiert.

    Siehe [Bilder](/de/nodes/images).

  </Accordion>
</AccordionGroup>

## Sicherheit und Zugriffskontrolle

<AccordionGroup>
  <Accordion title="Ist es sicher, OpenClaw für eingehende DMs freizugeben?">
    Behandeln Sie eingehende DMs als nicht vertrauenswürdige Eingabe. Die Standardwerte sind darauf ausgelegt, Risiken zu reduzieren:

    - Standardverhalten auf DM-fähigen Kanälen ist **Pairing**:
      - Unbekannte Absender erhalten einen Pairing-Code; der Bot verarbeitet ihre Nachricht nicht.
      - Genehmigen mit: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Ausstehende Anfragen sind auf **3 pro Kanal** begrenzt; prüfen Sie `openclaw pairing list --channel <channel> [--account <id>]`, wenn kein Code angekommen ist.
    - Das öffentliche Öffnen von DMs erfordert explizites Opt-in (`dmPolicy: "open"` und Allowlist `"*"`).

    Führen Sie `openclaw doctor` aus, um riskante DM-Richtlinien anzuzeigen.

  </Accordion>

  <Accordion title="Ist Prompt Injection nur für öffentliche Bots ein Problem?">
    Nein. Bei Prompt Injection geht es um **nicht vertrauenswürdige Inhalte**, nicht nur darum, wer dem Bot eine DM senden kann.
    Wenn Ihr Assistent externe Inhalte liest (Websuche/-Abruf, Browserseiten, E-Mails,
    Docs, Anhänge, eingefügte Logs), können diese Inhalte Anweisungen enthalten, die versuchen,
    das Modell zu kapern. Das kann sogar passieren, wenn **Sie der einzige Absender sind**.

    Das größte Risiko besteht, wenn Tools aktiviert sind: Das Modell kann dazu verleitet werden,
    Kontext zu exfiltrieren oder Tools in Ihrem Namen aufzurufen. Reduzieren Sie den Wirkungsbereich durch:

    - Verwendung eines schreibgeschützten oder tool-deaktivierten „Reader“-Agent, um nicht vertrauenswürdige Inhalte zusammenzufassen
    - `web_search` / `web_fetch` / `browser` für tool-aktivierte Agenten deaktiviert lassen
    - decodierten Datei-/Dokumenttext ebenfalls als nicht vertrauenswürdig behandeln: OpenResponses
      `input_file` und Medienanhang-Extraktion umschließen extrahierten Text beide mit
      expliziten Grenzmarkern für externe Inhalte, statt rohen Dateitext zu übergeben
    - Sandboxing und strikte Tool-Allowlists

    Details: [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Sollte mein Bot eine eigene E-Mail-Adresse, ein eigenes GitHub-Konto oder eine eigene Telefonnummer haben?">
    Ja, für die meisten Setups. Die Isolierung des Bots mit separaten Konten und Telefonnummern
    reduziert den Wirkungsbereich, wenn etwas schiefgeht. Dadurch wird es auch einfacher, Zugangsdaten zu rotieren
    oder Zugriff zu widerrufen, ohne Ihre persönlichen Konten zu beeinträchtigen.

    Fangen Sie klein an. Gewähren Sie nur Zugriff auf die Tools und Konten, die Sie wirklich benötigen, und erweitern
    Sie ihn später bei Bedarf.

    Docs: [Sicherheit](/de/gateway/security), [Pairing](/de/channels/pairing).

  </Accordion>

  <Accordion title="Kann ich ihm Autonomie über meine Textnachrichten geben, und ist das sicher?">
    Wir empfehlen **keine** vollständige Autonomie über Ihre persönlichen Nachrichten. Das sicherste Muster ist:

    - DMs im **Pairing-Modus** oder in einer engen Allowlist halten.
    - Eine **separate Nummer oder ein separates Konto** verwenden, wenn es in Ihrem Namen Nachrichten senden soll.
    - Entwürfe erstellen lassen, dann **vor dem Senden genehmigen**.

    Wenn Sie experimentieren möchten, tun Sie das auf einem dedizierten Konto und halten Sie es isoliert. Siehe
    [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Kann ich günstigere Modelle für persönliche Assistentenaufgaben verwenden?">
    Ja, **wenn** der Agent nur chattet und die Eingabe vertrauenswürdig ist. Kleinere Stufen sind
    anfälliger für Anweisungsmanipulation, vermeiden Sie sie daher für tool-aktivierte Agenten
    oder beim Lesen nicht vertrauenswürdiger Inhalte. Wenn Sie ein kleineres Modell verwenden müssen, sperren Sie
    Tools ab und führen Sie es in einer Sandbox aus. Siehe [Sicherheit](/de/gateway/security).
  </Accordion>

  <Accordion title="Ich habe /start in Telegram ausgeführt, aber keinen Pairing-Code erhalten">
    Pairing-Codes werden **nur** gesendet, wenn ein unbekannter Absender dem Bot eine Nachricht sendet und
    `dmPolicy: "pairing"` aktiviert ist. `/start` allein erzeugt keinen Code.

    Ausstehende Anfragen prüfen:

    ```bash
    openclaw pairing list telegram
    ```

    Wenn Sie sofortigen Zugriff möchten, nehmen Sie Ihre Absender-ID in die Allowlist auf oder setzen Sie `dmPolicy: "open"`
    für dieses Konto.

  </Accordion>

  <Accordion title="WhatsApp: Wird es meinen Kontakten Nachrichten senden? Wie funktioniert Pairing?">
    Nein. Die Standard-DM-Richtlinie von WhatsApp ist **Pairing**. Unbekannte Absender erhalten nur einen Pairing-Code und ihre Nachricht wird **nicht verarbeitet**. OpenClaw antwortet nur auf Chats, die es empfängt, oder auf explizite Sends, die Sie auslösen.

    Pairing genehmigen mit:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Ausstehende Anfragen auflisten:

    ```bash
    openclaw pairing list whatsapp
    ```

    Telefonnummernabfrage im Wizard: Sie wird verwendet, um Ihre **Allowlist/Owner** festzulegen, damit Ihre eigenen DMs zugelassen werden. Sie wird nicht zum automatischen Senden verwendet. Wenn Sie Ihre persönliche WhatsApp-Nummer nutzen, verwenden Sie diese Nummer und aktivieren Sie `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Chatbefehle, Aufgaben abbrechen und „es hört nicht auf“

<AccordionGroup>
  <Accordion title="Wie verhindere ich, dass interne Systemnachrichten im Chat angezeigt werden?">
    Die meisten internen oder Tool-Nachrichten erscheinen nur, wenn **verbose**, **trace** oder **reasoning** für diese Sitzung aktiviert ist.

    Beheben Sie es in dem Chat, in dem Sie es sehen:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Wenn es weiterhin zu viel Ausgabe gibt, prüfen Sie die Sitzungseinstellungen in der Control-UI und setzen Sie verbose
    auf **inherit**. Bestätigen Sie außerdem, dass Sie kein Bot-Profil mit `verboseDefault` auf
    `on` in der Konfiguration verwenden.

    Docs: [Denken und verbose](/de/tools/thinking), [Sicherheit](/de/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Wie stoppe/breche ich eine laufende Aufgabe ab?">
    Senden Sie eines davon **als eigenständige Nachricht** (kein Slash):

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

    Für Hintergrundprozesse (aus dem exec-Tool) können Sie den Agent bitten, Folgendes auszuführen:

    ```
    process action:kill sessionId:XXX
    ```

    Übersicht der Slash-Befehle: siehe [Slash-Befehle](/de/tools/slash-commands).

    Die meisten Befehle müssen als **eigenständige** Nachricht gesendet werden, die mit `/` beginnt, aber einige Kurzbefehle (wie `/status`) funktionieren für Absender in der Allowlist auch inline.

  </Accordion>

  <Accordion title='Wie sende ich eine Discord-Nachricht aus Telegram heraus? („Cross-context messaging denied“)'>
    OpenClaw blockiert standardmäßig **Provider-übergreifendes** Messaging. Wenn ein Tool-Aufruf
    an Telegram gebunden ist, sendet er nicht an Discord, es sei denn, Sie erlauben es ausdrücklich.

    Provider-übergreifendes Messaging für den Agent aktivieren:

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

    Starten Sie das Gateway nach dem Bearbeiten der Konfiguration neu.

  </Accordion>

  <Accordion title='Warum fühlt es sich so an, als würde der Bot schnelle Nachrichtenfolgen „ignorieren“?'>
    Der Warteschlangenmodus steuert, wie neue Nachrichten mit einem laufenden Run interagieren. Verwenden Sie `/queue`, um Modi zu ändern:

    - `steer` - alle ausstehenden Steuerungsnachrichten für die nächste Modellgrenze im aktuellen Run in die Warteschlange stellen
    - `queue` - Legacy-Steuerung einzeln nacheinander
    - `followup` - Nachrichten einzeln nacheinander ausführen
    - `collect` - Nachrichten bündeln und einmal antworten
    - `steer-backlog` - jetzt steuern, dann Backlog verarbeiten
    - `interrupt` - aktuellen Run abbrechen und neu starten

    Der Standardmodus ist `steer`. Sie können Optionen wie `debounce:0.5s cap:25 drop:summarize` für Folgemodi hinzufügen. Siehe [Befehlswarteschlange](/de/concepts/queue) und [Steuerungswarteschlange](/de/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Sonstiges

<AccordionGroup>
  <Accordion title='Was ist das Standardmodell für Anthropic mit einem API-Schlüssel?'>
    In OpenClaw sind Anmeldedaten und Modellauswahl getrennt. Das Setzen von `ANTHROPIC_API_KEY` (oder das Speichern eines Anthropic-API-Schlüssels in Auth-Profilen) aktiviert die Authentifizierung, aber das tatsächliche Standardmodell ist das, was Sie in `agents.defaults.model.primary` konfigurieren (zum Beispiel `anthropic/claude-sonnet-4-6` oder `anthropic/claude-opus-4-6`). Wenn Sie `No credentials found for profile "anthropic:default"` sehen, bedeutet das, dass der Gateway im erwarteten `auth-profiles.json` für den ausgeführten Agenten keine Anthropic-Anmeldedaten finden konnte.
  </Accordion>
</AccordionGroup>

---

Kommen Sie weiterhin nicht weiter? Fragen Sie in [Discord](https://discord.com/invite/clawd) oder öffnen Sie eine [GitHub-Diskussion](https://github.com/openclaw/openclaw/discussions).

## Verwandte Themen

- [FAQ zum ersten Start](/de/help/faq-first-run) — Installation, Onboarding, Authentifizierung, Abonnements, frühe Fehler
- [Modelle-FAQ](/de/help/faq-models) — Modellauswahl, Failover, Auth-Profile
- [Fehlerbehebung](/de/help/troubleshooting) — symptombasierte Triage
