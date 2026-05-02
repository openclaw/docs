---
read_when:
    - Beantwortung häufiger Fragen zu Einrichtung, Installation, Einführung oder Laufzeitunterstützung
    - Triage nutzergemeldeter Probleme vor einer tiefergehenden Fehlersuche
summary: Häufig gestellte Fragen zur Einrichtung, Konfiguration und Nutzung von OpenClaw
title: Häufig gestellte Fragen
x-i18n:
    generated_at: "2026-05-02T22:19:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1437a84d7da0e4111edd46297b2a486e2da4f6e4a6cff0d69d6a372e85608130
    source_path: help/faq.md
    workflow: 16
---

Schnelle Antworten plus tiefergehende Fehlerbehebung für reale Setups (lokale Entwicklung, VPS, Multi-Agent, OAuth/API-Schlüssel, Modell-Failover). Für Laufzeitdiagnosen siehe [Fehlerbehebung](/de/gateway/troubleshooting). Die vollständige Konfigurationsreferenz finden Sie unter [Konfiguration](/de/gateway/configuration).

## Die ersten 60 Sekunden, wenn etwas defekt ist

1. **Schnellstatus (erste Prüfung)**

   ```bash
   openclaw status
   ```

   Schnelle lokale Zusammenfassung: Betriebssystem + Update, Erreichbarkeit von Gateway/Dienst, Agents/Sitzungen, Provider-Konfiguration + Laufzeitprobleme (wenn das Gateway erreichbar ist).

2. **Einfügbarer Bericht (sicher teilbar)**

   ```bash
   openclaw status --all
   ```

   Schreibgeschützte Diagnose mit Log-Ende (Tokens geschwärzt).

3. **Daemon- + Portstatus**

   ```bash
   openclaw gateway status
   ```

   Zeigt Supervisor-Laufzeit im Vergleich zur RPC-Erreichbarkeit, die Ziel-URL der Prüfung und welche Konfiguration der Dienst wahrscheinlich verwendet hat.

4. **Tiefenprüfungen**

   ```bash
   openclaw status --deep
   ```

   Führt eine Live-Gateway-Gesundheitsprüfung aus, einschließlich Kanalprüfungen, wenn unterstützt
   (erfordert ein erreichbares Gateway). Siehe [Gesundheit](/de/gateway/health).

5. **Das neueste Log verfolgen**

   ```bash
   openclaw logs --follow
   ```

   Wenn RPC nicht verfügbar ist, weichen Sie aus auf:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Datei-Logs sind von Dienst-Logs getrennt; siehe [Logging](/de/logging) und [Fehlerbehebung](/de/gateway/troubleshooting).

6. **Doctor ausführen (Reparaturen)**

   ```bash
   openclaw doctor
   ```

   Repariert/migriert Konfiguration/Zustand + führt Gesundheitsprüfungen aus. Siehe [Doctor](/de/gateway/doctor).

7. **Gateway-Snapshot**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Fragt das laufende Gateway nach einem vollständigen Snapshot (nur WS). Siehe [Gesundheit](/de/gateway/health).

## Schnellstart und Einrichtung beim ersten Start

Q&A zum ersten Start - Installation, Onboarding, Auth-Routen, Abonnements, erste Fehler -
finden Sie in den [FAQ zum ersten Start](/de/help/faq-first-run).

## Was ist OpenClaw?

<AccordionGroup>
  <Accordion title="Was ist OpenClaw in einem Absatz?">
    OpenClaw ist ein persönlicher KI-Assistent, den Sie auf Ihren eigenen Geräten ausführen. Er antwortet auf den Messaging-Oberflächen, die Sie bereits verwenden (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat und gebündelte Kanal-Plugins wie QQ Bot), und kann auf unterstützten Plattformen auch Sprache + ein Live-Canvas bereitstellen. Das **Gateway** ist die ständig aktive Kontrollebene; der Assistent ist das Produkt.
  </Accordion>

  <Accordion title="Wertversprechen">
    OpenClaw ist nicht „nur ein Claude-Wrapper“. Es ist eine **Local-first-Kontrollebene**, mit der Sie einen
    leistungsfähigen Assistenten auf **Ihrer eigenen Hardware** ausführen können, erreichbar über die Chat-Apps, die Sie bereits verwenden, mit
    zustandsbehafteten Sitzungen, Memory und Werkzeugen - ohne die Kontrolle über Ihre Workflows an ein gehostetes
    SaaS abzugeben.

    Highlights:

    - **Ihre Geräte, Ihre Daten:** Führen Sie das Gateway aus, wo Sie möchten (Mac, Linux, VPS), und halten Sie
      Arbeitsbereich + Sitzungsverlauf lokal.
    - **Echte Kanäle, keine Web-Sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/usw.,
      plus mobile Sprache und Canvas auf unterstützten Plattformen.
    - **Modellagnostisch:** Verwenden Sie Anthropic, OpenAI, MiniMax, OpenRouter usw., mit Routing
      und Failover pro Agent.
    - **Nur-lokal-Option:** Führen Sie lokale Modelle aus, damit **alle Daten auf Ihrem Gerät bleiben können**, wenn Sie möchten.
    - **Multi-Agent-Routing:** Separate Agents pro Kanal, Konto oder Aufgabe, jeweils mit eigenem
      Arbeitsbereich und eigenen Voreinstellungen.
    - **Open Source und hackbar:** Prüfen, erweitern und selbst hosten ohne Anbieterbindung.

    Docs: [Gateway](/de/gateway), [Kanäle](/de/channels), [Multi-Agent](/de/concepts/multi-agent),
    [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Ich habe es gerade eingerichtet - was sollte ich zuerst tun?">
    Gute erste Projekte:

    - Eine Website erstellen (WordPress, Shopify oder eine einfache statische Website).
    - Einen Prototyp für eine mobile App erstellen (Gliederung, Screens, API-Plan).
    - Dateien und Ordner organisieren (Bereinigung, Benennung, Tagging).
    - Gmail verbinden und Zusammenfassungen oder Follow-ups automatisieren.

    Es kann große Aufgaben bewältigen, funktioniert aber am besten, wenn Sie diese in Phasen aufteilen und
    Sub-Agents für parallele Arbeit verwenden.

  </Accordion>

  <Accordion title="Was sind die fünf wichtigsten alltäglichen Anwendungsfälle für OpenClaw?">
    Alltägliche Erfolge sehen normalerweise so aus:

    - **Persönliche Briefings:** Zusammenfassungen von Posteingang, Kalender und Nachrichten, die für Sie relevant sind.
    - **Recherche und Entwurf:** schnelle Recherche, Zusammenfassungen und erste Entwürfe für E-Mails oder Docs.
    - **Erinnerungen und Follow-ups:** durch Cron oder Heartbeat gesteuerte Hinweise und Checklisten.
    - **Browser-Automatisierung:** Formulare ausfüllen, Daten sammeln und Webaufgaben wiederholen.
    - **Geräteübergreifende Koordination:** Senden Sie eine Aufgabe von Ihrem Telefon, lassen Sie das Gateway sie auf einem Server ausführen, und erhalten Sie das Ergebnis im Chat zurück.

  </Accordion>

  <Accordion title="Kann OpenClaw bei Lead-Generierung, Outreach, Anzeigen und Blogs für ein SaaS helfen?">
    Ja, für **Recherche, Qualifizierung und Entwürfe**. Es kann Websites durchsuchen, Shortlists erstellen,
    Interessenten zusammenfassen und Outreach- oder Anzeigentextentwürfe schreiben.

    Für **Outreach- oder Anzeigenkampagnen** sollten Sie einen Menschen in der Schleife behalten. Vermeiden Sie Spam, halten Sie lokale Gesetze und
    Plattformrichtlinien ein, und prüfen Sie alles, bevor es gesendet wird. Das sicherste Muster ist,
    OpenClaw entwerfen zu lassen und Sie geben die Freigabe.

    Docs: [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Welche Vorteile gibt es gegenüber Claude Code für Webentwicklung?">
    OpenClaw ist ein **persönlicher Assistent** und eine Koordinationsschicht, kein IDE-Ersatz. Verwenden Sie
    Claude Code oder Codex für den schnellsten direkten Coding-Loop innerhalb eines Repos. Verwenden Sie OpenClaw, wenn Sie
    dauerhafte Memory, geräteübergreifenden Zugriff und Werkzeugorchestrierung benötigen.

    Vorteile:

    - **Persistente Memory + Arbeitsbereich** über Sitzungen hinweg
    - **Multi-Plattform-Zugriff** (WhatsApp, Telegram, TUI, WebChat)
    - **Werkzeugorchestrierung** (Browser, Dateien, Planung, Hooks)
    - **Ständig aktives Gateway** (auf einem VPS ausführen, von überall interagieren)
    - **Nodes** für lokalen Browser/Bildschirm/Kamera/Ausführung

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills und Automatisierung

<AccordionGroup>
  <Accordion title="Wie kann ich Skills anpassen, ohne das Repo schmutzig zu halten?">
    Verwenden Sie verwaltete Überschreibungen, statt die Repo-Kopie zu bearbeiten. Legen Sie Ihre Änderungen in `~/.openclaw/skills/<name>/SKILL.md` ab (oder fügen Sie einen Ordner über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` hinzu). Die Priorität lautet `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelt → `skills.load.extraDirs`, sodass verwaltete Überschreibungen weiterhin Vorrang vor gebündelten Skills haben, ohne Git zu berühren. Wenn der Skill global installiert, aber nur für einige Agents sichtbar sein soll, behalten Sie die gemeinsame Kopie in `~/.openclaw/skills` und steuern Sie die Sichtbarkeit mit `agents.defaults.skills` und `agents.list[].skills`. Nur upstream-würdige Änderungen sollten im Repo liegen und als PRs herausgehen.
  </Accordion>

  <Accordion title="Kann ich Skills aus einem benutzerdefinierten Ordner laden?">
    Ja. Fügen Sie zusätzliche Verzeichnisse über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` hinzu (niedrigste Priorität). Die Standardpriorität lautet `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelt → `skills.load.extraDirs`. `clawhub` installiert standardmäßig nach `./skills`, was OpenClaw in der nächsten Sitzung als `<workspace>/skills` behandelt. Wenn der Skill nur für bestimmte Agents sichtbar sein soll, kombinieren Sie das mit `agents.defaults.skills` oder `agents.list[].skills`.
  </Accordion>

  <Accordion title="Wie kann ich verschiedene Modelle für verschiedene Aufgaben verwenden?">
    Die heute unterstützten Muster sind:

    - **Cron-Jobs**: Isolierte Jobs können pro Job eine `model`-Überschreibung setzen.
    - **Sub-Agents**: Leiten Sie Aufgaben an separate Agents mit unterschiedlichen Standardmodellen weiter.
    - **Wechsel bei Bedarf**: Verwenden Sie `/model`, um das aktuelle Sitzungsmodell jederzeit zu wechseln.

    Siehe [Cron-Jobs](/de/automation/cron-jobs), [Multi-Agent-Routing](/de/concepts/multi-agent) und [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Der Bot friert bei schwerer Arbeit ein. Wie lagere ich das aus?">
    Verwenden Sie **Sub-Agents** für lange oder parallele Aufgaben. Sub-Agents laufen in ihrer eigenen Sitzung,
    geben eine Zusammenfassung zurück und halten Ihren Hauptchat reaktionsfähig.

    Bitten Sie Ihren Bot, „einen Sub-Agent für diese Aufgabe zu starten“, oder verwenden Sie `/subagents`.
    Verwenden Sie `/status` im Chat, um zu sehen, was das Gateway gerade tut (und ob es ausgelastet ist).

    Token-Tipp: Lange Aufgaben und Sub-Agents verbrauchen beide Tokens. Wenn Kosten ein Thema sind, legen Sie ein
    günstigeres Modell für Sub-Agents über `agents.defaults.subagents.model` fest.

    Docs: [Sub-Agents](/de/tools/subagents), [Hintergrundaufgaben](/de/automation/tasks).

  </Accordion>

  <Accordion title="Wie funktionieren threadgebundene Subagent-Sitzungen auf Discord?">
    Verwenden Sie Thread-Bindungen. Sie können einen Discord-Thread an einen Subagent oder ein Sitzungsziel binden, damit Follow-up-Nachrichten in diesem Thread in dieser gebundenen Sitzung bleiben.

    Grundablauf:

    - Mit `sessions_spawn` und `thread: true` starten (und optional `mode: "session"` für persistente Follow-ups).
    - Oder manuell mit `/focus <target>` binden.
    - Mit `/agents` den Bindungszustand prüfen.
    - Mit `/session idle <duration|off>` und `/session max-age <duration|off>` automatische Entfokussierung steuern.
    - Mit `/unfocus` den Thread lösen.

    Erforderliche Konfiguration:

    - Globale Voreinstellungen: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord-Überschreibungen: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatische Bindung beim Start: `channels.discord.threadBindings.spawnSessions` ist standardmäßig `true`; setzen Sie es auf `false`, um threadgebundene Sitzungsstarts zu deaktivieren.

    Docs: [Sub-Agents](/de/tools/subagents), [Discord](/de/channels/discord), [Konfigurationsreferenz](/de/gateway/configuration-reference), [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Ein Subagent ist fertig, aber das Abschluss-Update ging an die falsche Stelle oder wurde nie gepostet. Was sollte ich prüfen?">
    Prüfen Sie zuerst die aufgelöste Requester-Route:

    - Die Zustellung von Subagents im Abschlussmodus bevorzugt jeden gebundenen Thread oder jede Konversationsroute, wenn vorhanden.
    - Wenn der Abschlussursprung nur einen Kanal enthält, fällt OpenClaw auf die gespeicherte Route der Requester-Sitzung zurück (`lastChannel` / `lastTo` / `lastAccountId`), sodass die direkte Zustellung dennoch gelingen kann.
    - Wenn weder eine gebundene Route noch eine verwendbare gespeicherte Route existiert, kann die direkte Zustellung fehlschlagen und das Ergebnis fällt auf die warteschlangenbasierte Sitzungszustellung zurück, statt sofort in den Chat gepostet zu werden.
    - Ungültige oder veraltete Ziele können weiterhin einen Fallback in die Warteschlange oder ein endgültiges Zustellungsfehler erzwingen.
    - Wenn die letzte sichtbare Assistentenantwort des Child exakt das stille Token `NO_REPLY` / `no_reply` oder exakt `ANNOUNCE_SKIP` ist, unterdrückt OpenClaw die Ankündigung absichtlich, statt veralteten früheren Fortschritt zu posten.
    - Wenn das Child nach ausschließlich Tool-Aufrufen per Timeout beendet wurde, kann die Ankündigung dies zu einer kurzen Teilfortschrittszusammenfassung verdichten, statt rohe Tool-Ausgabe erneut abzuspielen.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs: [Sub-Agents](/de/tools/subagents), [Hintergrundaufgaben](/de/automation/tasks), [Sitzungstools](/de/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron oder Erinnerungen werden nicht ausgelöst. Was sollte ich prüfen?">
    Cron läuft innerhalb des Gateway-Prozesses. Wenn das Gateway nicht kontinuierlich läuft,
    werden geplante Jobs nicht ausgeführt.

    Checkliste:

    - Bestätigen Sie, dass Cron aktiviert ist (`cron.enabled`) und `OPENCLAW_SKIP_CRON` nicht gesetzt ist.
    - Prüfen Sie, dass das Gateway rund um die Uhr läuft (kein Ruhezustand/keine Neustarts).
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

    - `--no-deliver` / `delivery.mode: "none"` bedeutet, dass kein Fallback-Versand durch den Runner erwartet wird.
    - Ein fehlendes oder ungültiges Ankündigungsziel (`channel` / `to`) bedeutet, dass der Runner die ausgehende Zustellung übersprungen hat.
    - Authentifizierungsfehler beim Kanal (`unauthorized`, `Forbidden`) bedeuten, dass der Runner versucht hat zuzustellen, die Anmeldedaten dies aber blockiert haben.
    - Ein stilles isoliertes Ergebnis (nur `NO_REPLY` / `no_reply`) wird als absichtlich nicht zustellbar behandelt, daher unterdrückt der Runner auch die geplante Fallback-Zustellung.

    Bei isolierten Cron-Jobs kann der Agent weiterhin direkt mit dem `message`-
    Tool senden, wenn eine Chat-Route verfügbar ist. `--announce` steuert nur den
    Fallback-Pfad des Runners für finalen Text, den der Agent nicht bereits gesendet hat.

    Debugging:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Hintergrundaufgaben](/de/automation/tasks).

  </Accordion>

  <Accordion title="Warum hat ein isolierter Cron-Lauf das Modell gewechselt oder einmal erneut versucht?">
    Das ist üblicherweise der Live-Modellwechselpfad, keine doppelte Planung.

    Isolierter Cron kann eine Modellübergabe zur Laufzeit speichern und erneut versuchen,
    wenn der aktive Lauf `LiveSessionModelSwitchError` auslöst. Der erneute Versuch behält
    den gewechselten Provider/das gewechselte Modell bei, und wenn der Wechsel eine neue
    Auth-Profil-Übersteuerung mitgebracht hat, speichert Cron auch diese vor dem erneuten Versuch.

    Zugehörige Auswahlregeln:

    - Die Gmail-Hook-Modellübersteuerung gewinnt zuerst, wenn sie anwendbar ist.
    - Dann `model` pro Job.
    - Dann eine gespeicherte Cron-Sitzungs-Modellübersteuerung.
    - Dann die normale Agent-/Standardmodellauswahl.

    Die Retry-Schleife ist begrenzt. Nach dem ersten Versuch plus 2 Wechsel-Retries
    bricht Cron ab, statt endlos weiterzulaufen.

    Debugging:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Cron-CLI](/de/cli/cron).

  </Accordion>

  <Accordion title="Wie installiere ich Skills unter Linux?">
    Verwenden Sie die nativen `openclaw skills`-Befehle oder legen Sie Skills in Ihrem Workspace ab. Die macOS-Skills-Oberfläche ist unter Linux nicht verfügbar.
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

    Das native `openclaw skills install` schreibt in das `skills/`-Verzeichnis
    des aktiven Workspace. Installieren Sie die separate `clawhub`-CLI nur, wenn Sie
    Ihre eigenen Skills veröffentlichen oder synchronisieren möchten. Für gemeinsam
    genutzte Installationen über mehrere Agents hinweg legen Sie den Skill unter
    `~/.openclaw/skills` ab und verwenden `agents.defaults.skills` oder
    `agents.list[].skills`, wenn Sie einschränken möchten, welche Agents ihn sehen können.

  </Accordion>

  <Accordion title="Kann OpenClaw Aufgaben zeitgesteuert oder dauerhaft im Hintergrund ausführen?">
    Ja. Verwenden Sie den Gateway-Scheduler:

    - **Cron-Jobs** für geplante oder wiederkehrende Aufgaben (bleiben über Neustarts hinweg erhalten).
    - **Heartbeat** für regelmäßige Prüfungen der „Hauptsitzung“.
    - **Isolierte Jobs** für autonome Agents, die Zusammenfassungen posten oder an Chats zustellen.

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Automatisierung & Aufgaben](/de/automation),
    [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title="Kann ich reine Apple-macOS-Skills von Linux aus ausführen?">
    Nicht direkt. macOS-Skills werden durch `metadata.openclaw.os` plus erforderliche Binärdateien begrenzt, und Skills erscheinen nur dann im System-Prompt, wenn sie auf dem **Gateway-Host** berechtigt sind. Unter Linux werden nur für `darwin` bestimmte Skills (wie `apple-notes`, `apple-reminders`, `things-mac`) nicht geladen, sofern Sie das Gating nicht übersteuern.

    Es gibt drei unterstützte Muster:

    **Option A - den Gateway auf einem Mac ausführen (am einfachsten).**
    Führen Sie den Gateway dort aus, wo die macOS-Binärdateien vorhanden sind, und verbinden Sie sich dann von Linux im [Remote-Modus](#gateway-ports-already-running-and-remote-mode) oder über Tailscale. Die Skills werden normal geladen, weil der Gateway-Host macOS ist.

    **Option B - einen macOS-Node verwenden (kein SSH).**
    Führen Sie den Gateway unter Linux aus, koppeln Sie einen macOS-Node (Menüleisten-App) und setzen Sie **Node Run Commands** auf dem Mac auf „Always Ask“ oder „Always Allow“. OpenClaw kann reine macOS-Skills als berechtigt behandeln, wenn die erforderlichen Binärdateien auf dem Node vorhanden sind. Der Agent führt diese Skills über das `nodes`-Tool aus. Wenn Sie „Always Ask“ wählen, fügt die Zustimmung zu „Always Allow“ in der Eingabeaufforderung diesen Befehl der Allowlist hinzu.

    **Option C - macOS-Binärdateien über SSH proxyen (fortgeschritten).**
    Belassen Sie den Gateway auf Linux, aber sorgen Sie dafür, dass die erforderlichen CLI-Binärdateien zu SSH-Wrappern aufgelöst werden, die auf einem Mac laufen. Übersteuern Sie dann den Skill, um Linux zuzulassen, damit er berechtigt bleibt.

    1. Erstellen Sie einen SSH-Wrapper für die Binärdatei (Beispiel: `memo` für Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Legen Sie den Wrapper auf dem Linux-Host in `PATH` ab (zum Beispiel `~/bin/memo`).
    3. Übersteuern Sie die Skill-Metadaten (Workspace oder `~/.openclaw/skills`), um Linux zuzulassen:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Starten Sie eine neue Sitzung, damit der Skills-Snapshot aktualisiert wird.

  </Accordion>

  <Accordion title="Gibt es eine Notion- oder HeyGen-Integration?">
    Heute nicht integriert.

    Optionen:

    - **Benutzerdefinierter Skill / Plugin:** am besten für zuverlässigen API-Zugriff (Notion/HeyGen haben beide APIs).
    - **Browser-Automatisierung:** funktioniert ohne Code, ist aber langsamer und anfälliger.

    Wenn Sie Kontext pro Kunde beibehalten möchten (Agentur-Workflows), ist ein einfaches Muster:

    - Eine Notion-Seite pro Kunde (Kontext + Präferenzen + aktive Arbeit).
    - Bitten Sie den Agent, diese Seite zu Beginn einer Sitzung abzurufen.

    Wenn Sie eine native Integration möchten, öffnen Sie eine Feature-Anfrage oder erstellen Sie einen Skill,
    der diese APIs ansteuert.

    Skills installieren:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Native Installationen landen im `skills/`-Verzeichnis des aktiven Workspace. Für gemeinsam genutzte Skills über mehrere Agents hinweg legen Sie sie in `~/.openclaw/skills/<name>/SKILL.md` ab. Wenn nur einige Agents eine gemeinsame Installation sehen sollen, konfigurieren Sie `agents.defaults.skills` oder `agents.list[].skills`. Einige Skills erwarten Binärdateien, die über Homebrew installiert wurden; unter Linux bedeutet das Linuxbrew (siehe den Homebrew-Linux-FAQ-Eintrag oben). Siehe [Skills](/de/tools/skills), [Skills-Konfiguration](/de/tools/skills-config) und [ClawHub](/de/tools/clawhub).

  </Accordion>

  <Accordion title="Wie verwende ich mein vorhandenes, angemeldetes Chrome mit OpenClaw?">
    Verwenden Sie das integrierte `user`-Browserprofil, das über Chrome DevTools MCP angebunden wird:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Wenn Sie einen benutzerdefinierten Namen möchten, erstellen Sie ein explizites MCP-Profil:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Dieser Pfad kann den lokalen Host-Browser oder einen verbundenen Browser-Node verwenden. Wenn der Gateway anderswo läuft, führen Sie entweder einen Node-Host auf der Browser-Maschine aus oder verwenden Sie stattdessen Remote-CDP.

    Aktuelle Grenzen von `existing-session` / `user`:

    - Aktionen sind ref-gesteuert, nicht CSS-Selektor-gesteuert
    - Uploads erfordern `ref` / `inputRef` und unterstützen derzeit jeweils eine Datei
    - `responsebody`, PDF-Export, Download-Abfangen und Batch-Aktionen benötigen weiterhin einen verwalteten Browser oder ein Raw-CDP-Profil

  </Accordion>
</AccordionGroup>

## Sandboxing und Speicher

<AccordionGroup>
  <Accordion title="Gibt es eine eigene Sandboxing-Dokumentation?">
    Ja. Siehe [Sandboxing](/de/gateway/sandboxing). Für Docker-spezifische Einrichtung (vollständiger Gateway in Docker oder Sandbox-Images) siehe [Docker](/de/install/docker).
  </Accordion>

  <Accordion title="Docker wirkt eingeschränkt - wie aktiviere ich den vollen Funktionsumfang?">
    Das Standard-Image ist sicherheitsorientiert und läuft als `node`-Benutzer, daher enthält es
    keine Systempakete, kein Homebrew und keine gebündelten Browser. Für eine vollständigere Einrichtung:

    - Persistieren Sie `/home/node` mit `OPENCLAW_HOME_VOLUME`, damit Caches erhalten bleiben.
    - Backen Sie Systemabhängigkeiten mit `OPENCLAW_DOCKER_APT_PACKAGES` in das Image ein.
    - Installieren Sie Playwright-Browser über die gebündelte CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Setzen Sie `PLAYWRIGHT_BROWSERS_PATH` und stellen Sie sicher, dass der Pfad persistiert wird.

    Dokumentation: [Docker](/de/install/docker), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Kann ich DMs privat halten, aber Gruppen mit einem Agent öffentlich/sandboxed machen?">
    Ja - wenn Ihr privater Traffic **DMs** ist und Ihr öffentlicher Traffic **Gruppen** sind.

    Verwenden Sie `agents.defaults.sandbox.mode: "non-main"`, damit Gruppen-/Kanalsitzungen (Nicht-Hauptschlüssel) im konfigurierten Sandbox-Backend laufen, während die Haupt-DM-Sitzung auf dem Host bleibt. Docker ist das Standard-Backend, wenn Sie keines auswählen. Beschränken Sie dann über `tools.sandbox.tools`, welche Tools in sandboxed Sitzungen verfügbar sind.

    Einrichtungsanleitung + Beispielkonfiguration: [Gruppen: persönliche DMs + öffentliche Gruppen](/de/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Wichtige Konfigurationsreferenz: [Gateway-Konfiguration](/de/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Wie binde ich einen Host-Ordner in die Sandbox ein?">
    Setzen Sie `agents.defaults.sandbox.docker.binds` auf `["host:path:mode"]` (z. B. `"/home/user/src:/src:ro"`). Globale und agentenspezifische Bind-Mounts werden zusammengeführt; agentenspezifische Bind-Mounts werden ignoriert, wenn `scope: "shared"` gesetzt ist. Verwenden Sie `:ro` für alles Sensible und denken Sie daran, dass Bind-Mounts die Dateisystemwände der Sandbox umgehen.

    OpenClaw validiert Bind-Quellen sowohl gegen den normalisierten Pfad als auch gegen den kanonischen Pfad, der über den tiefsten vorhandenen Vorfahren aufgelöst wird. Das bedeutet, dass Ausbrüche über Symlink-Eltern weiterhin geschlossen fehlschlagen, selbst wenn das letzte Pfadsegment noch nicht existiert, und dass Prüfungen erlaubter Wurzeln auch nach der Symlink-Auflösung weiterhin gelten.

    Siehe [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts) und [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) für Beispiele und Sicherheitshinweise.

  </Accordion>

  <Accordion title="Wie funktioniert Speicher?">
    OpenClaw-Speicher besteht einfach aus Markdown-Dateien im Agent-Workspace:

    - Tägliche Notizen in `memory/YYYY-MM-DD.md`
    - Kuratierte Langzeitnotizen in `MEMORY.md` (nur Haupt-/private Sitzungen)

    OpenClaw führt außerdem einen **stillen Speicher-Flush vor der Compaction** aus, um das Modell daran
    zu erinnern, dauerhafte Notizen zu schreiben, bevor die automatische Compaction erfolgt. Dies läuft nur, wenn der Workspace
    beschreibbar ist (schreibgeschützte Sandboxes überspringen es). Siehe [Speicher](/de/concepts/memory).

  </Accordion>

  <Accordion title="Der Speicher vergisst immer wieder Dinge. Wie sorge ich dafür, dass sie bleiben?">
    Bitten Sie den Bot, **die Tatsache in den Speicher zu schreiben**. Langzeitnotizen gehören in `MEMORY.md`,
    kurzfristiger Kontext kommt in `memory/YYYY-MM-DD.md`.

    Dies ist weiterhin ein Bereich, den wir verbessern. Es hilft, das Modell daran zu erinnern, Erinnerungen zu speichern;
    es weiß, was zu tun ist. Wenn es weiterhin vergisst, prüfen Sie, ob der Gateway bei jedem Lauf denselben
    Workspace verwendet.

    Dokumentation: [Speicher](/de/concepts/memory), [Agent-Workspace](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bleibt Speicher für immer erhalten? Welche Grenzen gibt es?">
    Speicherdateien liegen auf der Festplatte und bleiben erhalten, bis Sie sie löschen. Die Grenze ist Ihr
    Speicherplatz, nicht das Modell. Der **Sitzungskontext** ist weiterhin durch das Kontextfenster des Modells
    begrenzt, sodass lange Unterhaltungen compacted oder gekürzt werden können. Deshalb gibt es
    Speichersuche - sie holt nur die relevanten Teile zurück in den Kontext.

    Dokumentation: [Speicher](/de/concepts/memory), [Kontext](/de/concepts/context).

  </Accordion>

  <Accordion title="Benötigt die semantische Speichersuche einen OpenAI-API-Schlüssel?">
    Nur wenn Sie **OpenAI-Embeddings** verwenden. Codex OAuth deckt Chat/Completions ab und
    gewährt **keinen** Zugriff auf Embeddings. Daher hilft **die Anmeldung mit Codex (OAuth oder die
    Anmeldung über die Codex CLI)** nicht für die semantische Speichersuche. OpenAI-Embeddings
    benötigen weiterhin einen echten API-Schlüssel (`OPENAI_API_KEY` oder `models.providers.openai.apiKey`).

    Wenn Sie keinen Provider explizit festlegen, wählt OpenClaw automatisch einen Provider aus, sobald es
    einen API-Schlüssel auflösen kann (Authentifizierungsprofile, `models.providers.*.apiKey` oder Umgebungsvariablen).
    Es bevorzugt OpenAI, wenn ein OpenAI-Schlüssel aufgelöst wird, andernfalls Gemini, wenn ein Gemini-Schlüssel
    aufgelöst wird, dann Voyage, dann Mistral. Wenn kein Remote-Schlüssel verfügbar ist, bleibt die
    Speichersuche deaktiviert, bis Sie sie konfigurieren. Wenn Sie einen lokalen Modellpfad
    konfiguriert haben und dieser vorhanden ist, bevorzugt OpenClaw
    `local`. Ollama wird unterstützt, wenn Sie explizit
    `memorySearch.provider = "ollama"` festlegen.

    Wenn Sie lieber lokal bleiben möchten, setzen Sie `memorySearch.provider = "local"` (und optional
    `memorySearch.fallback = "none"`). Wenn Sie Gemini-Embeddings möchten, setzen Sie
    `memorySearch.provider = "gemini"` und stellen Sie `GEMINI_API_KEY` (oder
    `memorySearch.remote.apiKey`) bereit. Wir unterstützen Embedding-Modelle von **OpenAI, Gemini, Voyage, Mistral, Ollama oder lokal** -
    Details zur Einrichtung finden Sie unter [Speicher](/de/concepts/memory).

  </Accordion>
</AccordionGroup>

## Wo Dinge auf der Festplatte liegen

<AccordionGroup>
  <Accordion title="Werden alle mit OpenClaw verwendeten Daten lokal gespeichert?">
    Nein - **der Zustand von OpenClaw ist lokal**, aber **externe Dienste sehen weiterhin, was Sie an sie senden**.

    - **Standardmäßig lokal:** Sitzungen, Speicherdateien, Konfiguration und Arbeitsbereich liegen auf dem Gateway-Host
      (`~/.openclaw` + Ihr Arbeitsbereichsverzeichnis).
    - **Notwendigerweise remote:** Nachrichten, die Sie an Modell-Provider (Anthropic/OpenAI/usw.) senden, gehen an
      deren APIs, und Chat-Plattformen (WhatsApp/Telegram/Slack/usw.) speichern Nachrichtendaten auf ihren
      Servern.
    - **Sie steuern den Umfang:** Die Verwendung lokaler Modelle hält Prompts auf Ihrem Rechner, aber Kanalverkehr
      läuft weiterhin über die Server des Kanals.

    Verwandt: [Agenten-Arbeitsbereich](/de/concepts/agent-workspace), [Speicher](/de/concepts/memory).

  </Accordion>

  <Accordion title="Wo speichert OpenClaw seine Daten?">
    Alles liegt unter `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`):

    | Pfad                                                            | Zweck                                                              |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Hauptkonfiguration (JSON5)                                         |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Legacy-OAuth-Import (wird bei der ersten Verwendung in Authentifizierungsprofile kopiert) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Authentifizierungsprofile (OAuth, API-Schlüssel und optional `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Optionale dateibasierte Secret-Payload für `file`-SecretRef-Provider |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Legacy-Kompatibilitätsdatei (statische `api_key`-Einträge bereinigt) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Provider-Zustand (z. B. `whatsapp/<accountId>/creds.json`)         |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Zustand pro Agent (agentDir + Sitzungen)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Konversationsverlauf und Zustand (pro Agent)                       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Sitzungsmetadaten (pro Agent)                                      |

    Legacy-Pfad für einen einzelnen Agenten: `~/.openclaw/agent/*` (migriert durch `openclaw doctor`).

    Ihr **Arbeitsbereich** (AGENTS.md, Speicherdateien, Skills usw.) ist separat und wird über `agents.defaults.workspace` konfiguriert (Standard: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Wo sollten AGENTS.md / SOUL.md / USER.md / MEMORY.md liegen?">
    Diese Dateien liegen im **Agenten-Arbeitsbereich**, nicht in `~/.openclaw`.

    - **Arbeitsbereich (pro Agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, optional `HEARTBEAT.md`.
      Die kleingeschriebene Root-Datei `memory.md` ist nur Legacy-Reparatureingabe; `openclaw doctor --fix`
      kann sie in `MEMORY.md` zusammenführen, wenn beide Dateien existieren.
    - **Zustandsverzeichnis (`~/.openclaw`)**: Konfiguration, Kanal-/Provider-Zustand, Authentifizierungsprofile, Sitzungen, Protokolle
      und gemeinsam genutzte Skills (`~/.openclaw/skills`).

    Der Standardarbeitsbereich ist `~/.openclaw/workspace`, konfigurierbar über:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Wenn der Bot nach einem Neustart „vergisst“, prüfen Sie, ob der Gateway bei jedem Start denselben
    Arbeitsbereich verwendet (und denken Sie daran: Der Remote-Modus verwendet den **Arbeitsbereich des Gateway-Hosts**,
    nicht den Ihres lokalen Laptops).

    Tipp: Wenn Sie ein dauerhaftes Verhalten oder eine Präferenz möchten, bitten Sie den Bot, **sie in
    AGENTS.md oder MEMORY.md zu schreiben**, statt sich auf den Chatverlauf zu verlassen.

    Siehe [Agenten-Arbeitsbereich](/de/concepts/agent-workspace) und [Speicher](/de/concepts/memory).

  </Accordion>

  <Accordion title="Empfohlene Backup-Strategie">
    Legen Sie Ihren **Agenten-Arbeitsbereich** in einem **privaten** Git-Repository ab und sichern Sie ihn an einem
    privaten Ort (zum Beispiel GitHub private). Dadurch werden Speicher + AGENTS/SOUL/USER-
    Dateien erfasst, und Sie können den „Geist“ des Assistenten später wiederherstellen.

    Committen Sie **nichts** unter `~/.openclaw` (Anmeldedaten, Sitzungen, Tokens oder verschlüsselte Secret-Payloads).
    Wenn Sie eine vollständige Wiederherstellung benötigen, sichern Sie sowohl den Arbeitsbereich als auch das Zustandsverzeichnis
    separat (siehe die Migrationsfrage oben).

    Docs: [Agenten-Arbeitsbereich](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Wie deinstalliere ich OpenClaw vollständig?">
    Siehe die spezielle Anleitung: [Deinstallieren](/de/install/uninstall).
  </Accordion>

  <Accordion title="Können Agenten außerhalb des Arbeitsbereichs arbeiten?">
    Ja. Der Arbeitsbereich ist das **Standard-cwd** und der Speicheranker, keine harte Sandbox.
    Relative Pfade werden innerhalb des Arbeitsbereichs aufgelöst, aber absolute Pfade können auf andere
    Host-Speicherorte zugreifen, sofern Sandboxing nicht aktiviert ist. Wenn Sie Isolation benötigen, verwenden Sie
    [`agents.defaults.sandbox`](/de/gateway/sandboxing) oder agentenspezifische Sandbox-Einstellungen. Wenn Sie
    möchten, dass ein Repository das Standardarbeitsverzeichnis ist, setzen Sie den
    `workspace` dieses Agenten auf den Repository-Root. Das OpenClaw-Repository ist nur Quellcode; halten Sie den
    Arbeitsbereich getrennt, sofern Sie nicht absichtlich möchten, dass der Agent darin arbeitet.

    Beispiel (Repository als Standard-cwd):

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

  <Accordion title="Remote-Modus: Wo ist der Sitzungsspeicher?">
    Der Sitzungszustand gehört dem **Gateway-Host**. Wenn Sie sich im Remote-Modus befinden, liegt der Sitzungsspeicher, der für Sie relevant ist, auf dem Remote-Rechner, nicht auf Ihrem lokalen Laptop. Siehe [Sitzungsverwaltung](/de/concepts/session).
  </Accordion>
</AccordionGroup>

## Grundlagen der Konfiguration

<AccordionGroup>
  <Accordion title="Welches Format hat die Konfiguration? Wo befindet sie sich?">
    OpenClaw liest eine optionale **JSON5**-Konfiguration aus `$OPENCLAW_CONFIG_PATH` (Standard: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Wenn die Datei fehlt, verwendet es einigermaßen sichere Standardwerte (einschließlich eines Standardarbeitsbereichs von `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ich habe gateway.bind: "lan" (oder "tailnet") gesetzt, und jetzt lauscht nichts / die UI meldet „unauthorized“'>
    Nicht-loopback-Bindungen **erfordern einen gültigen Gateway-Authentifizierungspfad**. In der Praxis bedeutet das:

    - Shared-Secret-Authentifizierung: Token oder Passwort
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

    - `gateway.remote.token` / `.password` aktivieren die lokale Gateway-Authentifizierung **nicht** von allein.
    - Lokale Aufrufpfade können `gateway.remote.*` nur als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
    - Für Passwortauthentifizierung setzen Sie stattdessen `gateway.auth.mode: "password"` plus `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht aufgelöst ist, schlägt die Auflösung geschlossen fehl (keine Maskierung durch Remote-Fallback).
    - Shared-Secret-Setups der Control UI authentifizieren über `connect.params.auth.token` oder `connect.params.auth.password` (gespeichert in App-/UI-Einstellungen). Identitätstragende Modi wie Tailscale Serve oder `trusted-proxy` verwenden stattdessen Request-Header. Vermeiden Sie Shared Secrets in URLs.
    - Mit `gateway.auth.mode: "trusted-proxy"` benötigen local loopback-Reverse-Proxys auf demselben Host explizit `gateway.auth.trustedProxy.allowLoopback = true` und einen loopback-Eintrag in `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Warum benötige ich jetzt ein Token auf localhost?">
    OpenClaw erzwingt standardmäßig Gateway-Authentifizierung, einschließlich loopback. Im normalen Standardpfad bedeutet das Token-Authentifizierung: Wenn kein expliziter Authentifizierungspfad konfiguriert ist, wird der Gateway-Start in den Token-Modus aufgelöst und erzeugt automatisch ein Token, das in `gateway.auth.token` gespeichert wird. Daher **müssen lokale WS-Clients authentifiziert sein**. Das blockiert andere lokale Prozesse davon, den Gateway aufzurufen.

    Wenn Sie einen anderen Authentifizierungspfad bevorzugen, können Sie explizit den Passwortmodus wählen (oder, für identitätsbewusste Reverse-Proxys, `trusted-proxy`). Wenn Sie **wirklich** offenen loopback möchten, setzen Sie `gateway.auth.mode: "none"` explizit in Ihrer Konfiguration. Doctor kann jederzeit ein Token für Sie erzeugen: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Muss ich nach einer Konfigurationsänderung neu starten?">
    Der Gateway überwacht die Konfiguration und unterstützt Hot-Reload:

    - `gateway.reload.mode: "hybrid"` (Standard): sichere Änderungen direkt anwenden, bei kritischen Änderungen neu starten
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

    - `off`: blendet Slogan-Text aus, behält aber die Banner-Titel-/Versionszeile bei.
    - `default`: verwendet jedes Mal `All your chats, one OpenClaw.`.
    - `random`: rotierende lustige/saisonale Slogans (Standardverhalten).
    - Wenn Sie gar kein Banner möchten, setzen Sie die Umgebungsvariable `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Wie aktiviere ich Websuche (und Webabruf)?">
    `web_fetch` funktioniert ohne API-Schlüssel. `web_search` hängt von Ihrem ausgewählten
    Provider ab:

    - API-gestützte Provider wie Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity und Tavily benötigen ihre normale API-Schlüssel-Einrichtung.
    - Ollama Web Search ist schlüsselfrei, verwendet aber Ihren konfigurierten Ollama-Host und erfordert `ollama signin`.
    - DuckDuckGo ist schlüsselfrei, ist aber eine inoffizielle HTML-basierte Integration.
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

    Provider-spezifische Websuche-Konfiguration befindet sich jetzt unter `plugins.entries.<plugin>.config.webSearch.*`.
    Legacy-`tools.web.search.*`-Provider-Pfade werden aus Kompatibilitätsgründen vorübergehend noch geladen, sollten aber nicht für neue Konfigurationen verwendet werden.
    Die Firecrawl-Webfetch-Fallback-Konfiguration befindet sich unter `plugins.entries.firecrawl.config.webFetch.*`.

    Hinweise:

    - Wenn Sie Allowlisten verwenden, fügen Sie `web_search`/`web_fetch`/`x_search` oder `group:web` hinzu.
    - `web_fetch` ist standardmäßig aktiviert (sofern nicht ausdrücklich deaktiviert).
    - Wenn `tools.web.fetch.provider` weggelassen wird, erkennt OpenClaw automatisch den ersten bereiten Fetch-Fallback-Provider anhand der verfügbaren Zugangsdaten. Derzeit ist der gebündelte Provider Firecrawl.
    - Daemons lesen Umgebungsvariablen aus `~/.openclaw/.env` (oder aus der Service-Umgebung).

    Dokumentation: [Webtools](/de/tools/web).

  </Accordion>

  <Accordion title="config.apply wiped my config. How do I recover and avoid this?">
    `config.apply` ersetzt die **gesamte Konfiguration**. Wenn Sie ein Teilobjekt senden, wird alles
    andere entfernt.

    Das aktuelle OpenClaw schützt vor vielen versehentlichen Überschreibungen:

    - OpenClaw-eigene Konfigurationsschreibvorgänge validieren vor dem Schreiben die vollständige Konfiguration nach der Änderung.
    - Ungültige oder destruktive OpenClaw-eigene Schreibvorgänge werden abgelehnt und als `openclaw.json.rejected.*` gespeichert.
    - Wenn eine direkte Bearbeitung den Start oder Hot Reload beschädigt, stellt der Gateway die letzte als funktionsfähig bekannte Konfiguration wieder her und speichert die abgelehnte Datei als `openclaw.json.clobbered.*`.
    - Der Haupt-Agent erhält nach der Wiederherstellung eine Boot-Warnung, damit er die fehlerhafte Konfiguration nicht blind erneut schreibt.

    Wiederherstellen:

    - Prüfen Sie `openclaw logs --follow` auf `Config auto-restored from last-known-good`, `Config write rejected:` oder `config reload restored last-known-good config`.
    - Prüfen Sie die neueste Datei `openclaw.json.clobbered.*` oder `openclaw.json.rejected.*` neben der aktiven Konfiguration.
    - Behalten Sie die aktive wiederhergestellte Konfiguration, wenn sie funktioniert, und kopieren Sie dann nur die beabsichtigten Schlüssel mit `openclaw config set` oder `config.patch` zurück.
    - Führen Sie `openclaw config validate` und `openclaw doctor` aus.
    - Wenn Sie keine letzte als funktionsfähig bekannte Konfiguration oder abgelehnte Payload haben, stellen Sie aus einem Backup wieder her oder führen Sie `openclaw doctor` erneut aus und konfigurieren Sie Channels/Modelle neu.
    - Wenn dies unerwartet war, melden Sie einen Fehler und fügen Sie Ihre letzte bekannte Konfiguration oder ein Backup bei.
    - Ein lokaler Coding-Agent kann eine funktionierende Konfiguration oft aus Logs oder Verlauf rekonstruieren.

    Vermeiden:

    - Verwenden Sie `openclaw config set` für kleine Änderungen.
    - Verwenden Sie `openclaw configure` für interaktive Bearbeitungen.
    - Verwenden Sie zuerst `config.schema.lookup`, wenn Sie sich über einen genauen Pfad oder die Feldstruktur nicht sicher sind; es gibt einen flachen Schema-Knoten plus Zusammenfassungen der direkten Kinder für Drill-down zurück.
    - Verwenden Sie `config.patch` für partielle RPC-Bearbeitungen; verwenden Sie `config.apply` nur für den vollständigen Austausch der Konfiguration.
    - Wenn Sie das owner-only-Tool `gateway` aus einem Agent-Lauf verwenden, lehnt es weiterhin Schreibvorgänge auf `tools.exec.ask` / `tools.exec.security` ab (einschließlich Legacy-`tools.bash.*`-Aliases, die auf dieselben geschützten Exec-Pfade normalisiert werden).

    Dokumentation: [Konfiguration](/de/cli/config), [Konfigurieren](/de/cli/configure), [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/de/gateway/doctor).

  </Accordion>

  <Accordion title="How do I run a central Gateway with specialized workers across devices?">
    Das übliche Muster ist **ein Gateway** (z. B. Raspberry Pi) plus **Nodes** und **Agenten**:

    - **Gateway (zentral):** besitzt Channels (Signal/WhatsApp), Routing und Sitzungen.
    - **Nodes (Geräte):** Macs/iOS/Android verbinden sich als Peripheriegeräte und stellen lokale Tools (`system.run`, `canvas`, `camera`) bereit.
    - **Agenten (Worker):** getrennte Gehirne/Arbeitsbereiche für Spezialrollen (z. B. „Hetzner ops“, „Persönliche Daten“).
    - **Sub-Agenten:** starten Hintergrundarbeit aus einem Haupt-Agenten, wenn Sie Parallelität möchten.
    - **TUI:** stellt eine Verbindung zum Gateway her und wechselt Agenten/Sitzungen.

    Dokumentation: [Nodes](/de/nodes), [Remote-Zugriff](/de/gateway/remote), [Multi-Agent-Routing](/de/concepts/multi-agent), [Sub-Agenten](/de/tools/subagents), [TUI](/de/web/tui).

  </Accordion>

  <Accordion title="Can the OpenClaw browser run headless?">
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

    Standard ist `false` (mit sichtbarer Oberfläche). Headless löst auf manchen Websites eher Anti-Bot-Prüfungen aus. Siehe [Browser](/de/tools/browser).

    Headless verwendet dieselbe **Chromium-Engine** und funktioniert für die meisten Automatisierungen (Formulare, Klicks, Scraping, Logins). Die Hauptunterschiede:

    - Kein sichtbares Browserfenster (verwenden Sie Screenshots, wenn Sie visuelle Informationen benötigen).
    - Manche Websites sind im Headless-Modus strenger gegenüber Automatisierung (CAPTCHAs, Anti-Bot).
      Zum Beispiel blockiert X/Twitter häufig Headless-Sitzungen.

  </Accordion>

  <Accordion title="How do I use Brave for browser control?">
    Setzen Sie `browser.executablePath` auf Ihre Brave-Binärdatei (oder einen beliebigen Chromium-basierten Browser) und starten Sie den Gateway neu.
    Siehe die vollständigen Konfigurationsbeispiele unter [Browser](/de/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Remote-Gateways und Nodes

<AccordionGroup>
  <Accordion title="How do commands propagate between Telegram, the gateway, and nodes?">
    Telegram-Nachrichten werden vom **Gateway** verarbeitet. Der Gateway führt den Agenten aus und
    ruft erst dann Nodes über den **Gateway WebSocket** auf, wenn ein Node-Tool benötigt wird:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes sehen keinen eingehenden Provider-Traffic; sie erhalten nur Node-RPC-Aufrufe.

  </Accordion>

  <Accordion title="How can my agent access my computer if the Gateway is hosted remotely?">
    Kurze Antwort: **Koppeln Sie Ihren Computer als Node**. Der Gateway läuft anderswo, kann aber
    `node.*`-Tools (Bildschirm, Kamera, System) auf Ihrer lokalen Maschine über den Gateway WebSocket aufrufen.

    Typische Einrichtung:

    1. Führen Sie den Gateway auf dem Always-on-Host aus (VPS/Heimserver).
    2. Bringen Sie den Gateway-Host und Ihren Computer in dieselbe Tailnet.
    3. Stellen Sie sicher, dass der Gateway-WS erreichbar ist (Tailnet-Bindung oder SSH-Tunnel).
    4. Öffnen Sie die macOS-App lokal und verbinden Sie sie im Modus **Remote over SSH** (oder direkt über Tailnet),
       damit sie sich als Node registrieren kann.
    5. Genehmigen Sie den Node auf dem Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Es ist keine separate TCP-Bridge erforderlich; Nodes verbinden sich über den Gateway WebSocket.

    Sicherheitshinweis: Das Koppeln eines macOS-Node erlaubt `system.run` auf dieser Maschine. Koppeln Sie nur
    Geräte, denen Sie vertrauen, und lesen Sie [Sicherheit](/de/gateway/security).

    Dokumentation: [Nodes](/de/nodes), [Gateway-Protokoll](/de/gateway/protocol), [macOS-Remote-Modus](/de/platforms/mac/remote), [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Tailscale is connected but I get no replies. What now?">
    Prüfen Sie die Grundlagen:

    - Gateway läuft: `openclaw gateway status`
    - Gateway-Gesundheit: `openclaw status`
    - Channel-Gesundheit: `openclaw channels status`

    Prüfen Sie anschließend Authentifizierung und Routing:

    - Wenn Sie Tailscale Serve verwenden, stellen Sie sicher, dass `gateway.auth.allowTailscale` korrekt gesetzt ist.
    - Wenn Sie sich über einen SSH-Tunnel verbinden, bestätigen Sie, dass der lokale Tunnel aktiv ist und auf den richtigen Port zeigt.
    - Bestätigen Sie, dass Ihre Allowlisten (DM oder Gruppe) Ihr Konto enthalten.

    Dokumentation: [Tailscale](/de/gateway/tailscale), [Remote-Zugriff](/de/gateway/remote), [Channels](/de/channels).

  </Accordion>

  <Accordion title="Can two OpenClaw instances talk to each other (local + VPS)?">
    Ja. Es gibt keine eingebaute „Bot-zu-Bot“-Bridge, aber Sie können sie auf einige
    zuverlässige Arten verdrahten:

    **Am einfachsten:** Verwenden Sie einen normalen Chat-Channel, auf den beide Bots zugreifen können (Telegram/Slack/WhatsApp).
    Lassen Sie Bot A eine Nachricht an Bot B senden, und lassen Sie Bot B dann wie gewohnt antworten.

    **CLI-Bridge (generisch):** Führen Sie ein Skript aus, das den anderen Gateway mit
    `openclaw agent --message ... --deliver` aufruft und dabei einen Chat ansteuert, in dem der andere Bot
    lauscht. Wenn ein Bot auf einem Remote-VPS läuft, richten Sie Ihre CLI über SSH/Tailscale auf diesen Remote-Gateway aus
    (siehe [Remote-Zugriff](/de/gateway/remote)).

    Beispielmuster (von einer Maschine aus ausführen, die den Ziel-Gateway erreichen kann):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Tipp: Fügen Sie eine Leitplanke hinzu, damit die beiden Bots nicht endlos schleifen (nur Erwähnungen, Channel-
    Allowlisten oder eine Regel „nicht auf Bot-Nachrichten antworten“).

    Dokumentation: [Remote-Zugriff](/de/gateway/remote), [Agent-CLI](/de/cli/agent), [Agent senden](/de/tools/agent-send).

  </Accordion>

  <Accordion title="Do I need separate VPSes for multiple agents?">
    Nein. Ein Gateway kann mehrere Agenten hosten, jeweils mit eigenem Arbeitsbereich, Modellstandards
    und Routing. Das ist die normale Einrichtung und viel günstiger und einfacher, als
    einen VPS pro Agent zu betreiben.

    Verwenden Sie separate VPSes nur, wenn Sie harte Isolation (Sicherheitsgrenzen) oder sehr
    unterschiedliche Konfigurationen benötigen, die Sie nicht teilen möchten. Andernfalls behalten Sie einen Gateway bei und
    verwenden Sie mehrere Agenten oder Sub-Agenten.

  </Accordion>

  <Accordion title="Is there a benefit to using a node on my personal laptop instead of SSH from a VPS?">
    Ja - Nodes sind der erstklassige Weg, Ihren Laptop von einem Remote-Gateway aus zu erreichen, und sie
    ermöglichen mehr als nur Shell-Zugriff. Der Gateway läuft auf macOS/Linux (Windows über WSL2) und ist
    leichtgewichtig (ein kleiner VPS oder eine Raspberry-Pi-Klasse-Box reicht aus; 4 GB RAM sind mehr als genug), daher ist eine übliche
    Einrichtung ein Always-on-Host plus Ihr Laptop als Node.

    - **Kein eingehendes SSH erforderlich.** Nodes verbinden sich ausgehend mit dem Gateway WebSocket und verwenden Gerätekopplung.
    - **Sicherere Ausführungskontrollen.** `system.run` wird durch Node-Allowlisten/Genehmigungen auf diesem Laptop abgesichert.
    - **Mehr Gerätetools.** Nodes stellen zusätzlich zu `system.run` auch `canvas`, `camera` und `screen` bereit.
    - **Lokale Browserautomatisierung.** Behalten Sie den Gateway auf einem VPS, führen Sie Chrome aber lokal über einen Node-Host auf dem Laptop aus, oder verbinden Sie sich über Chrome MCP mit lokalem Chrome auf dem Host.

    SSH ist für Ad-hoc-Shell-Zugriff in Ordnung, aber Nodes sind für laufende Agent-Workflows und
    Geräteautomatisierung einfacher.

    Dokumentation: [Nodes](/de/nodes), [Nodes-CLI](/de/cli/nodes), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Do nodes run a gateway service?">
    Nein. Pro Host sollte nur **ein Gateway** laufen, außer Sie betreiben absichtlich isolierte Profile (siehe [Mehrere Gateways](/de/gateway/multiple-gateways)). Nodes sind Peripheriegeräte, die sich
    mit dem Gateway verbinden (iOS/Android-Nodes oder macOS-„Node-Modus“ in der Menüleisten-App). Für headless Node-
    Hosts und CLI-Steuerung siehe [Node-Host-CLI](/de/cli/node).

    Für Änderungen an `gateway`, `discovery` und `canvasHost` ist ein vollständiger Neustart erforderlich.

  </Accordion>

  <Accordion title="Is there an API / RPC way to apply config?">
    Ja.

    - `config.schema.lookup`: einen Konfigurations-Teilbaum mit seinem flachen Schema-Knoten, passendem UI-Hinweis und Zusammenfassungen der direkten Kinder vor dem Schreiben prüfen
    - `config.get`: den aktuellen Snapshot + Hash abrufen
    - `config.patch`: sichere partielle Aktualisierung (für die meisten RPC-Bearbeitungen bevorzugt); führt Hot Reloads aus, wenn möglich, und startet neu, wenn erforderlich
    - `config.apply`: die vollständige Konfiguration validieren und ersetzen; führt Hot Reloads aus, wenn möglich, und startet neu, wenn erforderlich
    - Das owner-only-Runtime-Tool `gateway` weigert sich weiterhin, `tools.exec.ask` / `tools.exec.security` neu zu schreiben; Legacy-`tools.bash.*`-Aliases werden auf dieselben geschützten Exec-Pfade normalisiert

  </Accordion>

  <Accordion title="Minimal sinnvolle Konfiguration für eine Erstinstallation">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Dies legt Ihren Workspace fest und beschränkt, wer den Bot auslösen kann.

  </Accordion>

  <Accordion title="Wie richte ich Tailscale auf einem VPS ein und verbinde mich von meinem Mac aus?">
    Minimale Schritte:

    1. **Auf dem VPS installieren + anmelden**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Auf Ihrem Mac installieren + anmelden**
       - Verwenden Sie die Tailscale-App und melden Sie sich beim selben tailnet an.
    3. **MagicDNS aktivieren (empfohlen)**
       - Aktivieren Sie in der Tailscale-Admin-Konsole MagicDNS, damit der VPS einen stabilen Namen hat.
    4. **Den tailnet-Hostnamen verwenden**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Wenn Sie die Control UI ohne SSH verwenden möchten, nutzen Sie Tailscale Serve auf dem VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Dadurch bleibt der Gateway an loopback gebunden und stellt HTTPS über Tailscale bereit. Siehe [Tailscale](/de/gateway/tailscale).

  </Accordion>

  <Accordion title="Wie verbinde ich einen Mac-Node mit einem entfernten Gateway (Tailscale Serve)?">
    Serve stellt die **Gateway Control UI + WS** bereit. Nodes verbinden sich über denselben Gateway-WS-Endpunkt.

    Empfohlene Einrichtung:

    1. **Stellen Sie sicher, dass VPS + Mac im selben tailnet sind**.
    2. **Verwenden Sie die macOS-App im Remote-Modus** (das SSH-Ziel kann der tailnet-Hostname sein).
       Die App tunnelt den Gateway-Port und verbindet sich als Node.
    3. **Genehmigen Sie den Node** am Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentation: [Gateway-Protokoll](/de/gateway/protocol), [Discovery](/de/gateway/discovery), [macOS-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Sollte ich auf einem zweiten Laptop installieren oder einfach einen Node hinzufügen?">
    Wenn Sie auf dem zweiten Laptop nur **lokale Tools** (Bildschirm/Kamera/exec) benötigen, fügen Sie ihn als
    **Node** hinzu. So bleibt ein einzelner Gateway erhalten und doppelte Konfiguration wird vermieden. Lokale Node-Tools sind
    derzeit nur für macOS verfügbar, aber wir planen, sie auf andere Betriebssysteme auszuweiten.

    Installieren Sie einen zweiten Gateway nur, wenn Sie **harte Isolation** oder zwei vollständig getrennte Bots benötigen.

    Dokumentation: [Nodes](/de/nodes), [Nodes-CLI](/de/cli/nodes), [Mehrere Gateways](/de/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars und .env-Laden

<AccordionGroup>
  <Accordion title="Wie lädt OpenClaw Umgebungsvariablen?">
    OpenClaw liest Env vars aus dem übergeordneten Prozess (Shell, launchd/systemd, CI usw.) und lädt zusätzlich:

    - `.env` aus dem aktuellen Arbeitsverzeichnis
    - eine globale Fallback-`.env` aus `~/.openclaw/.env` (auch `$OPENCLAW_STATE_DIR/.env`)

    Keine der beiden `.env`-Dateien überschreibt vorhandene Env vars.

    Sie können Inline-Env-vars auch in der Konfiguration definieren (werden nur angewendet, wenn sie in der Prozessumgebung fehlen):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Die vollständige Rangfolge und die Quellen finden Sie unter [/environment](/de/help/environment).

  </Accordion>

  <Accordion title="Ich habe den Gateway über den Dienst gestartet und meine Env vars sind verschwunden. Was nun?">
    Zwei häufige Lösungen:

    1. Legen Sie die fehlenden Schlüssel in `~/.openclaw/.env` ab, damit sie auch dann übernommen werden, wenn der Dienst Ihre Shell-Umgebung nicht erbt.
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

    Dies führt Ihre Login-Shell aus und importiert nur fehlende erwartete Schlüssel (überschreibt nie). Entsprechende Env vars:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ich habe COPILOT_GITHUB_TOKEN gesetzt, aber der Modellstatus zeigt "Shell env: off." Warum?'>
    `openclaw models status` meldet, ob der **Shell-Env-Import** aktiviert ist. "Shell env: off"
    bedeutet **nicht**, dass Ihre Env vars fehlen - es bedeutet nur, dass OpenClaw
    Ihre Login-Shell nicht automatisch lädt.

    Wenn der Gateway als Dienst (launchd/systemd) läuft, erbt er Ihre Shell-
    Umgebung nicht. Beheben Sie das mit einer dieser Optionen:

    1. Legen Sie das Token in `~/.openclaw/.env` ab:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Oder aktivieren Sie den Shell-Import (`env.shellEnv.enabled: true`).
    3. Oder fügen Sie es dem `env`-Block Ihrer Konfiguration hinzu (wird nur angewendet, wenn es fehlt).

    Starten Sie danach den Gateway neu und prüfen Sie erneut:

    ```bash
    openclaw models status
    ```

    Copilot-Tokens werden aus `COPILOT_GITHUB_TOKEN` gelesen (auch `GH_TOKEN` / `GITHUB_TOKEN`).
    Siehe [/concepts/model-providers](/de/concepts/model-providers) und [/environment](/de/help/environment).

  </Accordion>
</AccordionGroup>

## Sitzungen und mehrere Chats

<AccordionGroup>
  <Accordion title="Wie starte ich eine neue Unterhaltung?">
    Senden Sie `/new` oder `/reset` als eigenständige Nachricht. Siehe [Sitzungsverwaltung](/de/concepts/session).
  </Accordion>

  <Accordion title="Werden Sitzungen automatisch zurückgesetzt, wenn ich nie /new sende?">
    Sitzungen können nach `session.idleMinutes` ablaufen, dies ist jedoch **standardmäßig deaktiviert** (Standard **0**).
    Setzen Sie den Wert auf eine positive Zahl, um den Ablauf bei Inaktivität zu aktivieren. Wenn aktiviert, startet die **nächste**
    Nachricht nach der Inaktivitätsperiode eine neue Sitzungs-ID für diesen Chat-Schlüssel.
    Dies löscht keine Transkripte - es startet lediglich eine neue Sitzung.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Gibt es eine Möglichkeit, ein Team aus OpenClaw-Instanzen zu erstellen (ein CEO und viele Agents)?">
    Ja, über **Multi-Agent-Routing** und **Sub-Agents**. Sie können einen Koordinator-
    Agent und mehrere Worker-Agents mit eigenen Workspaces und Modellen erstellen.

    Dennoch ist dies am besten als **unterhaltsames Experiment** zu verstehen. Es verbraucht viele Tokens und ist oft
    weniger effizient als ein einzelner Bot mit getrennten Sitzungen. Das typische Modell, das wir
    vorsehen, ist ein Bot, mit dem Sie sprechen, mit verschiedenen Sitzungen für parallele Arbeit. Dieser
    Bot kann bei Bedarf auch Sub-Agents starten.

    Dokumentation: [Multi-Agent-Routing](/de/concepts/multi-agent), [Sub-Agents](/de/tools/subagents), [Agents-CLI](/de/cli/agents).

  </Accordion>

  <Accordion title="Warum wurde der Kontext mitten in der Aufgabe gekürzt? Wie verhindere ich das?">
    Der Sitzungskontext ist durch das Modellfenster begrenzt. Lange Chats, große Tool-Ausgaben oder viele
    Dateien können Compaction oder Kürzung auslösen.

    Das hilft:

    - Bitten Sie den Bot, den aktuellen Stand zusammenzufassen und in eine Datei zu schreiben.
    - Verwenden Sie `/compact` vor langen Aufgaben und `/new`, wenn Sie das Thema wechseln.
    - Bewahren Sie wichtigen Kontext im Workspace auf und bitten Sie den Bot, ihn erneut zu lesen.
    - Verwenden Sie Sub-Agents für lange oder parallele Arbeit, damit der Hauptchat kleiner bleibt.
    - Wählen Sie ein Modell mit größerem Kontextfenster, wenn dies häufig passiert.

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

    Führen Sie danach die Einrichtung erneut aus:

    ```bash
    openclaw onboard --install-daemon
    ```

    Hinweise:

    - Onboarding bietet ebenfalls **Reset** an, wenn eine vorhandene Konfiguration erkannt wird. Siehe [Onboarding (CLI)](/de/start/wizard).
    - Wenn Sie Profile verwendet haben (`--profile` / `OPENCLAW_PROFILE`), setzen Sie jedes State-Verzeichnis zurück (Standard ist `~/.openclaw-<profile>`).
    - Dev-Reset: `openclaw gateway --dev --reset` (nur für Entwicklung; löscht Dev-Konfiguration + Anmeldedaten + Sitzungen + Workspace).

  </Accordion>

  <Accordion title='Ich erhalte Fehler vom Typ "context too large" - wie setze ich zurück oder komprimiere?'>
    Verwenden Sie eine dieser Optionen:

    - **Compaction** (behält die Unterhaltung bei, fasst aber ältere Turns zusammen):

      ```
      /compact
      ```

      oder `/compact <instructions>`, um die Zusammenfassung zu steuern.

    - **Reset** (neue Sitzungs-ID für denselben Chat-Schlüssel):

      ```
      /new
      /reset
      ```

    Wenn es weiterhin passiert:

    - Aktivieren oder justieren Sie **Session-Pruning** (`agents.defaults.contextPruning`), um alte Tool-Ausgaben zu kürzen.
    - Verwenden Sie ein Modell mit größerem Kontextfenster.

    Dokumentation: [Compaction](/de/concepts/compaction), [Session-Pruning](/de/concepts/session-pruning), [Sitzungsverwaltung](/de/concepts/session).

  </Accordion>

  <Accordion title='Warum sehe ich "LLM request rejected: messages.content.tool_use.input field required"?'>
    Dies ist ein Provider-Validierungsfehler: Das Modell hat einen `tool_use`-Block ohne das erforderliche
    `input` ausgegeben. Das bedeutet normalerweise, dass der Sitzungsverlauf veraltet oder beschädigt ist (oft nach langen Threads
    oder einer Tool-/Schemaänderung).

    Lösung: Starten Sie mit `/new` eine neue Sitzung (als eigenständige Nachricht).

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

    Wenn `HEARTBEAT.md` existiert, aber effektiv leer ist (nur Leerzeilen und Markdown-
    Überschriften wie `# Heading`), überspringt OpenClaw den Heartbeat-Lauf, um API-Aufrufe zu sparen.
    Wenn die Datei fehlt, läuft der Heartbeat trotzdem und das Modell entscheidet, was zu tun ist.

    Überschreibungen pro Agent verwenden `agents.list[].heartbeat`. Dokumentation: [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title='Muss ich einer WhatsApp-Gruppe ein "Bot-Konto" hinzufügen?'>
    Nein. OpenClaw läuft auf **Ihrem eigenen Konto**. Wenn Sie also in der Gruppe sind, kann OpenClaw sie sehen.
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
    Option 1 (am schnellsten): Logs verfolgen und eine Testnachricht in der Gruppe senden:

    ```bash
    openclaw logs --follow --json
    ```

    Suchen Sie nach `chatId` (oder `from`), das auf `@g.us` endet, zum Beispiel:
    `1234567890-1234567890@g.us`.

    Option 2 (falls bereits konfiguriert/allowlisted): Gruppen aus der Konfiguration auflisten:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentation: [WhatsApp](/de/channels/whatsapp), [Directory](/de/cli/directory), [Logs](/de/cli/logs).

  </Accordion>

  <Accordion title="Warum antwortet OpenClaw nicht in einer Gruppe?">
    Zwei häufige Ursachen:

    - Mention-Gating ist aktiviert (Standard). Sie müssen den Bot per @mention erwähnen (oder `mentionPatterns` treffen).
    - Sie haben `channels.whatsapp.groups` ohne `"*"` konfiguriert und die Gruppe ist nicht allowlisted.

    Siehe [Gruppen](/de/channels/groups) und [Gruppennachrichten](/de/channels/group-messages).

  </Accordion>

  <Accordion title="Teilen Gruppen/Threads den Kontext mit DMs?">
    Direkte Chats werden standardmäßig zur Hauptsitzung zusammengeführt. Gruppen/Kanäle haben eigene Sitzungsschlüssel, und Telegram-Themen / Discord-Threads sind separate Sitzungen. Siehe [Gruppen](/de/channels/groups) und [Gruppennachrichten](/de/channels/group-messages).
  </Accordion>

  <Accordion title="Wie viele Workspaces und Agents kann ich erstellen?">
    Keine festen Limits. Dutzende (sogar Hunderte) sind in Ordnung, aber achten Sie auf:

    - **Speicherplatzwachstum:** Sitzungen + Transkripte liegen unter `~/.openclaw/agents/<agentId>/sessions/`.
    - **Token-Kosten:** Mehr Agents bedeuten mehr gleichzeitige Modellnutzung.
    - **Betriebsaufwand:** Auth-Profile, Workspaces und Kanal-Routing pro Agent.

    Tipps:

    - Halten Sie einen **aktiven** Workspace pro Agent (`agents.defaults.workspace`).
    - Bereinigen Sie alte Sitzungen (JSONL- oder Store-Einträge löschen), wenn der Speicherverbrauch wächst.
    - Verwenden Sie `openclaw doctor`, um verwaiste Workspaces und Profilkonflikte zu finden.

  </Accordion>

  <Accordion title="Kann ich mehrere Bots oder Chats gleichzeitig ausführen (Slack), und wie sollte ich das einrichten?">
    Ja. Verwenden Sie **Multi-Agent-Routing**, um mehrere isolierte Agenten auszuführen und eingehende Nachrichten nach
    Kanal/Konto/Peer weiterzuleiten. Slack wird als Kanal unterstützt und kann an bestimmte Agenten gebunden werden.

    Browserzugriff ist leistungsfähig, aber nicht gleichbedeutend mit „alles tun können, was ein Mensch kann“ - Anti-Bot-Mechanismen, CAPTCHAs und MFA können
    Automatisierung weiterhin blockieren. Für die zuverlässigste Browsersteuerung verwenden Sie lokales Chrome MCP auf dem Host
    oder CDP auf dem Rechner, auf dem der Browser tatsächlich läuft.

    Empfohlene Einrichtung:

    - Always-on-Gateway-Host (VPS/Mac mini).
    - Ein Agent pro Rolle (Bindungen).
    - Slack-Kanal/Kanäle, die an diese Agenten gebunden sind.
    - Lokaler Browser über Chrome MCP oder bei Bedarf einen Node.

    Doku: [Multi-Agent-Routing](/de/concepts/multi-agent), [Slack](/de/channels/slack),
    [Browser](/de/tools/browser), [Nodes](/de/nodes).

  </Accordion>
</AccordionGroup>

## Modelle, Failover und Auth-Profile

Modell-Fragen und -Antworten - Standards, Auswahl, Aliase, Wechsel, Failover, Auth-Profile -
finden Sie in den [Modell-FAQ](/de/help/faq-models).

## Gateway: Ports, „läuft bereits“ und Remote-Modus

<AccordionGroup>
  <Accordion title="Welchen Port verwendet das Gateway?">
    `gateway.port` steuert den einzelnen multiplexierten Port für WebSocket + HTTP (Control UI, Hooks usw.).

    Priorität:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Warum meldet openclaw gateway status "Runtime: running", aber "Connectivity probe: failed"?'>
    Weil „running“ die Sicht des **Supervisors** ist (launchd/systemd/schtasks). Die Konnektivitätsprüfung ist die CLI, die tatsächlich eine Verbindung zum Gateway-WebSocket herstellt.

    Verwenden Sie `openclaw gateway status` und verlassen Sie sich auf diese Zeilen:

    - `Probe target:` (die URL, die die Prüfung tatsächlich verwendet hat)
    - `Listening:` (was tatsächlich an den Port gebunden ist)
    - `Last gateway error:` (häufige Ursache, wenn der Prozess läuft, der Port aber nicht lauscht)

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
    OpenClaw erzwingt eine Laufzeitsperre, indem der WebSocket-Listener direkt beim Start gebunden wird (Standard `ws://127.0.0.1:18789`). Wenn das Binden mit `EADDRINUSE` fehlschlägt, wird `GatewayLockError` ausgelöst und zeigt an, dass bereits eine andere Instanz lauscht.

    Behebung: Stoppen Sie die andere Instanz, geben Sie den Port frei, oder starten Sie mit `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Wie führe ich OpenClaw im Remote-Modus aus (Client verbindet sich mit einem Gateway an anderer Stelle)?">
    Setzen Sie `gateway.mode: "remote"` und verweisen Sie auf eine Remote-WebSocket-URL, optional mit Remote-Anmeldedaten über ein gemeinsames Geheimnis:

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
    - Die macOS-App überwacht die Konfigurationsdatei und wechselt live den Modus, wenn sich diese Werte ändern.
    - `gateway.remote.token` / `.password` sind nur clientseitige Remote-Anmeldedaten; sie aktivieren nicht von selbst die lokale Gateway-Authentifizierung.

  </Accordion>

  <Accordion title='Die Control UI meldet "unauthorized" (oder verbindet sich immer wieder neu). Was nun?'>
    Ihr Gateway-Authentifizierungspfad und die Authentifizierungsmethode der UI passen nicht zusammen.

    Fakten (aus dem Code):

    - Die Control UI hält das Token in `sessionStorage` für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL, sodass Aktualisierungen im selben Tab weiter funktionieren, ohne eine langlebige localStorage-Token-Persistenz wiederherzustellen.
    - Bei `AUTH_TOKEN_MISMATCH` können vertrauenswürdige Clients einen begrenzten Wiederholungsversuch mit einem zwischengespeicherten Geräte-Token versuchen, wenn das Gateway Wiederholungshinweise zurückgibt (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Dieser Wiederholungsversuch mit zwischengespeichertem Token verwendet jetzt die mit dem Geräte-Token gespeicherten zwischengespeicherten genehmigten Scopes wieder. Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten weiterhin ihren angeforderten Scope-Satz, statt zwischengespeicherte Scopes zu erben.
    - Außerhalb dieses Wiederholungspfads gilt für die Verbindungs-Authentifizierung die Priorität: explizites gemeinsames Token/Passwort zuerst, dann explizites `deviceToken`, dann gespeichertes Geräte-Token, dann Bootstrap-Token.
    - Scope-Prüfungen für Bootstrap-Token sind rollenpräfixiert. Die integrierte Bootstrap-Operator-Allowlist erfüllt nur Operator-Anfragen; Node- oder andere Nicht-Operator-Rollen benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.

    Behebung:

    - Am schnellsten: `openclaw dashboard` (gibt die Dashboard-URL aus und kopiert sie, versucht sie zu öffnen; zeigt bei headless Umgebungen einen SSH-Hinweis).
    - Wenn Sie noch kein Token haben: `openclaw doctor --generate-gateway-token`.
    - Wenn remote, zuerst tunneln: `ssh -N -L 18789:127.0.0.1:18789 user@host`, dann `http://127.0.0.1:18789/` öffnen.
    - Modus mit gemeinsamem Geheimnis: Setzen Sie `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` oder `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, und fügen Sie dann das passende Geheimnis in den Einstellungen der Control UI ein.
    - Tailscale-Serve-Modus: Stellen Sie sicher, dass `gateway.auth.allowTailscale` aktiviert ist und Sie die Serve-URL öffnen, nicht eine rohe Loopback-/Tailnet-URL, die Tailscale-Identitätsheader umgeht.
    - Trusted-Proxy-Modus: Stellen Sie sicher, dass Sie über den konfigurierten identitätsbewussten Proxy kommen, nicht über eine rohe Gateway-URL. Loopback-Proxys auf demselben Host benötigen außerdem `gateway.auth.trustedProxy.allowLoopback = true`.
    - Wenn die Abweichung nach dem einen Wiederholungsversuch bestehen bleibt, rotieren/genehmigen Sie das gekoppelte Geräte-Token erneut:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Wenn dieser Rotationsaufruf meldet, dass er abgelehnt wurde, prüfen Sie zwei Dinge:
      - Sitzungen gekoppelter Geräte können nur ihr **eigenes** Gerät rotieren, sofern sie nicht auch `operator.admin` haben
      - explizite `--scope`-Werte dürfen die aktuellen Operator-Scopes des Aufrufers nicht überschreiten
    - Immer noch blockiert? Führen Sie `openclaw status --all` aus und folgen Sie [Fehlerbehebung](/de/gateway/troubleshooting). Auth-Details finden Sie unter [Dashboard](/de/web/dashboard).

  </Accordion>

  <Accordion title="Ich habe gateway.bind auf tailnet gesetzt, aber es kann nicht binden und nichts lauscht">
    `tailnet`-Bindung wählt eine Tailscale-IP aus Ihren Netzwerkschnittstellen (100.64.0.0/10). Wenn der Rechner nicht in Tailscale ist (oder die Schnittstelle inaktiv ist), gibt es nichts, woran gebunden werden kann.

    Behebung:

    - Starten Sie Tailscale auf diesem Host (damit er eine 100.x-Adresse hat), oder
    - Wechseln Sie zu `gateway.bind: "loopback"` / `"lan"`.

    Hinweis: `tailnet` ist explizit. `auto` bevorzugt Loopback; verwenden Sie `gateway.bind: "tailnet"`, wenn Sie eine Bindung nur an das Tailnet wünschen.

  </Accordion>

  <Accordion title="Kann ich mehrere Gateways auf demselben Host ausführen?">
    Normalerweise nein - ein Gateway kann mehrere Messaging-Kanäle und Agenten ausführen. Verwenden Sie mehrere Gateways nur, wenn Sie Redundanz (z. B. Rescue-Bot) oder harte Isolation benötigen.

    Ja, aber Sie müssen isolieren:

    - `OPENCLAW_CONFIG_PATH` (Konfiguration pro Instanz)
    - `OPENCLAW_STATE_DIR` (Status pro Instanz)
    - `agents.defaults.workspace` (Workspace-Isolation)
    - `gateway.port` (eindeutige Ports)

    Schnelle Einrichtung (empfohlen):

    - Verwenden Sie `openclaw --profile <name> ...` pro Instanz (erstellt automatisch `~/.openclaw-<name>`).
    - Setzen Sie in jeder Profilkonfiguration einen eindeutigen `gateway.port` (oder übergeben Sie `--port` für manuelle Läufe).
    - Installieren Sie einen Dienst pro Profil: `openclaw --profile <name> gateway install`.

    Profile ergänzen auch Dienstnamen um ein Suffix (`ai.openclaw.<profile>`; Legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Vollständige Anleitung: [Mehrere Gateways](/de/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Was bedeutet "invalid handshake" / Code 1008?'>
    Das Gateway ist ein **WebSocket-Server**, und es erwartet als allererste Nachricht
    einen `connect`-Frame. Wenn es etwas anderes empfängt, schließt es die Verbindung
    mit **Code 1008** (Richtlinienverstoß).

    Häufige Ursachen:

    - Sie haben die **HTTP**-URL in einem Browser geöffnet (`http://...`) statt in einem WS-Client.
    - Sie haben den falschen Port oder Pfad verwendet.
    - Ein Proxy oder Tunnel hat Auth-Header entfernt oder eine Nicht-Gateway-Anfrage gesendet.

    Schnelle Behebungen:

    1. Verwenden Sie die WS-URL: `ws://<host>:18789` (oder `wss://...` bei HTTPS).
    2. Öffnen Sie den WS-Port nicht in einem normalen Browser-Tab.
    3. Wenn Auth aktiviert ist, geben Sie das Token/Passwort im `connect`-Frame an.

    Wenn Sie die CLI oder TUI verwenden, sollte die URL so aussehen:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Protokolldetails: [Gateway-Protokoll](/de/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Protokollierung und Debugging

<AccordionGroup>
  <Accordion title="Wo befinden sich die Logs?">
    Datei-Logs (strukturiert):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Sie können über `logging.file` einen stabilen Pfad setzen. Das Datei-Log-Level wird durch `logging.level` gesteuert. Die Konsolen-Ausführlichkeit wird durch `--verbose` und `logging.consoleLevel` gesteuert.

    Schnellstes Log-Tailing:

    ```bash
    openclaw logs --follow
    ```

    Dienst-/Supervisor-Logs (wenn das Gateway über launchd/systemd läuft):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` und `gateway.err.log` (Standard: `~/.openclaw/logs/...`; Profile verwenden `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Weitere Informationen finden Sie unter [Fehlerbehebung](/de/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Wie starte/stoppe/starte ich den Gateway-Dienst neu?">
    Verwenden Sie die Gateway-Helfer:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Wenn Sie das Gateway manuell ausführen, kann `openclaw gateway --force` den Port zurückgewinnen. Siehe [Gateway](/de/gateway).

  </Accordion>

  <Accordion title="Ich habe mein Terminal unter Windows geschlossen - wie starte ich OpenClaw neu?">
    Es gibt **zwei Windows-Installationsmodi**:

    **1) WSL2 (empfohlen):** Das Gateway läuft innerhalb von Linux.

    Öffnen Sie PowerShell, wechseln Sie in WSL, und starten Sie dann neu:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Wenn Sie den Dienst nie installiert haben, starten Sie ihn im Vordergrund:

    ```bash
    openclaw gateway run
    ```

    **2) Natives Windows (nicht empfohlen):** Das Gateway läuft direkt in Windows.

    Öffnen Sie PowerShell und führen Sie Folgendes aus:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Wenn Sie es manuell ausführen (kein Dienst), verwenden Sie:

    ```powershell
    openclaw gateway run
    ```

    Doku: [Windows (WSL2)](/de/platforms/windows), [Gateway-Dienst-Runbook](/de/gateway).

  </Accordion>

  <Accordion title="Das Gateway ist erreichbar, aber Antworten kommen nie an. Was sollte ich prüfen?">
    Beginnen Sie mit einem schnellen Health-Check:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Häufige Ursachen:

    - Modell-Authentifizierung ist auf dem **Gateway-Host** nicht geladen (prüfen Sie `models status`).
    - Kanal-Kopplung/Allowlist blockiert Antworten (prüfen Sie Kanalkonfiguration + Logs).
    - WebChat/Dashboard ist ohne das richtige Token geöffnet.

    Wenn Sie remote arbeiten, bestätigen Sie, dass die Tunnel-/Tailscale-Verbindung aktiv ist und der
    Gateway-WebSocket erreichbar ist.

    Doku: [Kanäle](/de/channels), [Fehlerbehebung](/de/gateway/troubleshooting), [Remote-Zugriff](/de/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - was nun?'>
    Das bedeutet normalerweise, dass die UI die WebSocket-Verbindung verloren hat. Prüfen Sie:

    1. Läuft der Gateway? `openclaw gateway status`
    2. Ist der Gateway fehlerfrei? `openclaw status`
    3. Hat die UI das richtige Token? `openclaw dashboard`
    4. Falls remote: Ist der Tunnel-/Tailscale-Link aktiv?

    Dann Logs verfolgen:

    ```bash
    openclaw logs --follow
    ```

    Dokumentation: [Dashboard](/de/web/dashboard), [Remote-Zugriff](/de/gateway/remote), [Fehlerbehebung](/de/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands schlägt fehl. Was sollte ich prüfen?">
    Beginnen Sie mit Logs und Kanalstatus:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Ordnen Sie dann den Fehler zu:

    - `BOT_COMMANDS_TOO_MUCH`: Das Telegram-Menü hat zu viele Einträge. OpenClaw kürzt bereits auf das Telegram-Limit und versucht es mit weniger Befehlen erneut, aber einige Menüeinträge müssen trotzdem entfernt werden. Reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle, oder deaktivieren Sie `channels.telegram.commands.native`, wenn Sie das Menü nicht benötigen.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` oder ähnliche Netzwerkfehler: Wenn Sie sich auf einem VPS oder hinter einem Proxy befinden, stellen Sie sicher, dass ausgehendes HTTPS erlaubt ist und DNS für `api.telegram.org` funktioniert.

    Wenn der Gateway remote ist, stellen Sie sicher, dass Sie die Logs auf dem Gateway-Host ansehen.

    Dokumentation: [Telegram](/de/channels/telegram), [Kanal-Fehlerbehebung](/de/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI zeigt keine Ausgabe. Was sollte ich prüfen?">
    Bestätigen Sie zuerst, dass der Gateway erreichbar ist und der Agent ausgeführt werden kann:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Verwenden Sie in der TUI `/status`, um den aktuellen Zustand anzuzeigen. Wenn Sie Antworten in einem Chat-Kanal erwarten,
    stellen Sie sicher, dass die Zustellung aktiviert ist (`/deliver on`).

    Dokumentation: [TUI](/de/web/tui), [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Wie stoppe ich den Gateway vollständig und starte ihn dann wieder?">
    Wenn Sie den Dienst installiert haben:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Dies stoppt/startet den **überwachten Dienst** (launchd unter macOS, systemd unter Linux).
    Verwenden Sie dies, wenn der Gateway im Hintergrund als Daemon läuft.

    Wenn Sie ihn im Vordergrund ausführen, stoppen Sie ihn mit Strg-C und dann:

    ```bash
    openclaw gateway run
    ```

    Dokumentation: [Gateway-Dienst-Runbook](/de/gateway).

  </Accordion>

  <Accordion title="Einfach erklärt: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: startet den **Hintergrunddienst** (launchd/systemd) neu.
    - `openclaw gateway`: führt den Gateway **im Vordergrund** für diese Terminalsitzung aus.

    Wenn Sie den Dienst installiert haben, verwenden Sie die Gateway-Befehle. Verwenden Sie `openclaw gateway`, wenn
    Sie eine einmalige Ausführung im Vordergrund möchten.

  </Accordion>

  <Accordion title="Schnellster Weg zu mehr Details, wenn etwas fehlschlägt">
    Starten Sie den Gateway mit `--verbose`, um mehr Details in der Konsole zu erhalten. Prüfen Sie anschließend die Logdatei auf Kanalauthentifizierung, Modell-Routing und RPC-Fehler.
  </Accordion>
</AccordionGroup>

## Medien und Anhänge

<AccordionGroup>
  <Accordion title="Mein Skill hat ein Bild/PDF erzeugt, aber es wurde nichts gesendet">
    Ausgehende Anhänge vom Agent müssen eine `MEDIA:<path-or-url>`-Zeile enthalten (in einer eigenen Zeile). Siehe [OpenClaw-Assistent einrichten](/de/start/openclaw) und [Agent-Senden](/de/tools/agent-send).

    Senden per CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Prüfen Sie außerdem:

    - Der Zielkanal unterstützt ausgehende Medien und wird nicht durch Allowlists blockiert.
    - Die Datei liegt innerhalb der Größenbeschränkungen des Providers (Bilder werden auf maximal 2048px skaliert).
    - `tools.fs.workspaceOnly=true` beschränkt Sendevorgänge mit lokalen Pfaden auf Workspace, temp/media-store und sandbox-validierte Dateien.
    - `tools.fs.workspaceOnly=false` erlaubt `MEDIA:`, Host-lokale Dateien zu senden, die der Agent bereits lesen kann, aber nur für Medien und sichere Dokumenttypen (Bilder, Audio, Video, PDF und Office-Dokumente). Reiner Text und Dateien, die wie Geheimnisse wirken, werden weiterhin blockiert.

    Siehe [Bilder](/de/nodes/images).

  </Accordion>
</AccordionGroup>

## Sicherheit und Zugriffskontrolle

<AccordionGroup>
  <Accordion title="Ist es sicher, OpenClaw für eingehende DMs freizugeben?">
    Behandeln Sie eingehende DMs als nicht vertrauenswürdige Eingaben. Die Standardwerte sind darauf ausgelegt, Risiken zu reduzieren:

    - Standardverhalten auf DM-fähigen Kanälen ist **Pairing**:
      - Unbekannte Absender erhalten einen Pairing-Code; der Bot verarbeitet ihre Nachricht nicht.
      - Genehmigen mit: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Ausstehende Anfragen sind auf **3 pro Kanal** begrenzt; prüfen Sie `openclaw pairing list --channel <channel> [--account <id>]`, wenn kein Code angekommen ist.
    - Öffentliche DMs erfordern explizites Opt-in (`dmPolicy: "open"` und Allowlist `"*"`).

    Führen Sie `openclaw doctor` aus, um riskante DM-Richtlinien sichtbar zu machen.

  </Accordion>

  <Accordion title="Ist Prompt Injection nur für öffentliche Bots ein Problem?">
    Nein. Bei Prompt Injection geht es um **nicht vertrauenswürdige Inhalte**, nicht nur darum, wer dem Bot eine DM senden kann.
    Wenn Ihr Assistent externe Inhalte liest (Websuche/Abruf, Browserseiten, E-Mails,
    Dokumentation, Anhänge, eingefügte Logs), können diese Inhalte Anweisungen enthalten, die versuchen,
    das Modell zu kapern. Das kann selbst dann passieren, wenn **Sie der einzige Absender sind**.

    Das größte Risiko besteht, wenn Tools aktiviert sind: Das Modell kann dazu verleitet werden,
    Kontext zu exfiltrieren oder Tools in Ihrem Namen aufzurufen. Reduzieren Sie den Schadensradius, indem Sie:

    - einen schreibgeschützten oder tool-deaktivierten "Reader"-Agent verwenden, um nicht vertrauenswürdige Inhalte zusammenzufassen
    - `web_search` / `web_fetch` / `browser` für tool-aktivierte Agenten deaktiviert lassen
    - dekodierten Datei-/Dokumenttext ebenfalls als nicht vertrauenswürdig behandeln: OpenResponses
      `input_file` und die Extraktion von Medienanhängen umschließen extrahierten Text beide mit
      expliziten Grenzmarkern für externe Inhalte, statt rohen Dateitext weiterzugeben
    - Sandboxing und strikte Tool-Allowlists verwenden

    Details: [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Sollte mein Bot eine eigene E-Mail-Adresse, ein eigenes GitHub-Konto oder eine eigene Telefonnummer haben?">
    Ja, für die meisten Setups. Die Isolierung des Bots mit separaten Konten und Telefonnummern
    reduziert den Schadensradius, falls etwas schiefgeht. Außerdem wird es einfacher, Zugangsdaten zu rotieren
    oder Zugriff zu entziehen, ohne Ihre persönlichen Konten zu beeinträchtigen.

    Fangen Sie klein an. Gewähren Sie nur Zugriff auf die Tools und Konten, die Sie tatsächlich benötigen, und erweitern Sie
    später bei Bedarf.

    Dokumentation: [Sicherheit](/de/gateway/security), [Pairing](/de/channels/pairing).

  </Accordion>

  <Accordion title="Kann ich ihm Autonomie über meine Textnachrichten geben, und ist das sicher?">
    Wir empfehlen **keine** vollständige Autonomie über Ihre persönlichen Nachrichten. Das sicherste Muster ist:

    - Lassen Sie DMs im **Pairing-Modus** oder in einer engen Allowlist.
    - Verwenden Sie eine **separate Nummer oder ein separates Konto**, wenn er in Ihrem Namen Nachrichten senden soll.
    - Lassen Sie ihn entwerfen und **genehmigen Sie vor dem Senden**.

    Wenn Sie experimentieren möchten, tun Sie dies mit einem dedizierten Konto und halten Sie es isoliert. Siehe
    [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Kann ich günstigere Modelle für Aufgaben eines persönlichen Assistenten verwenden?">
    Ja, **wenn** der Agent nur chattet und die Eingabe vertrauenswürdig ist. Kleinere Stufen sind
    anfälliger für Anweisungskaperung. Vermeiden Sie sie daher für tool-aktivierte Agenten
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

  <Accordion title="WhatsApp: Sendet es Nachrichten an meine Kontakte? Wie funktioniert Pairing?">
    Nein. Die Standard-DM-Richtlinie für WhatsApp ist **Pairing**. Unbekannte Absender erhalten nur einen Pairing-Code und ihre Nachricht wird **nicht verarbeitet**. OpenClaw antwortet nur auf Chats, die es empfängt, oder auf explizite Sendevorgänge, die Sie auslösen.

    Pairing genehmigen mit:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Ausstehende Anfragen auflisten:

    ```bash
    openclaw pairing list whatsapp
    ```

    Eingabeaufforderung für die Telefonnummer im Assistenten: Sie wird verwendet, um Ihre **Allowlist/Ihren Owner** festzulegen, damit Ihre eigenen DMs zugelassen sind. Sie wird nicht für automatisches Senden verwendet. Wenn Sie Ihre persönliche WhatsApp-Nummer verwenden, nutzen Sie diese Nummer und aktivieren Sie `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Chat-Befehle, Aufgaben abbrechen und "es hört nicht auf"

<AccordionGroup>
  <Accordion title="Wie verhindere ich, dass interne Systemnachrichten im Chat angezeigt werden?">
    Die meisten internen oder Tool-Nachrichten erscheinen nur, wenn **verbose**, **trace** oder **reasoning**
    für diese Sitzung aktiviert ist.

    Beheben Sie es in dem Chat, in dem Sie es sehen:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Wenn es immer noch zu viel Ausgabe gibt, prüfen Sie die Sitzungseinstellungen in der Control UI und setzen Sie verbose
    auf **inherit**. Stellen Sie außerdem sicher, dass Sie kein Bot-Profil mit `verboseDefault` auf
    `on` in der Konfiguration verwenden.

    Dokumentation: [Denken und ausführliche Ausgabe](/de/tools/thinking), [Sicherheit](/de/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Wie stoppe/breche ich eine laufende Aufgabe ab?">
    Senden Sie eine der folgenden Nachrichten **als eigenständige Nachricht** (kein Slash):

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

    Dies sind Abbruchauslöser (keine Slash-Befehle).

    Für Hintergrundprozesse (aus dem exec-Tool) können Sie den Agent bitten, Folgendes auszuführen:

    ```
    process action:kill sessionId:XXX
    ```

    Überblick über Slash-Befehle: siehe [Slash-Befehle](/de/tools/slash-commands).

    Die meisten Befehle müssen als **eigenständige** Nachricht gesendet werden, die mit `/` beginnt, aber einige Kurzbefehle (wie `/status`) funktionieren für Absender auf der Allowlist auch inline.

  </Accordion>

  <Accordion title='Wie sende ich eine Discord-Nachricht aus Telegram? ("Cross-context messaging denied")'>
    OpenClaw blockiert **Provider-übergreifendes** Messaging standardmäßig. Wenn ein Tool-Aufruf
    an Telegram gebunden ist, sendet er nicht an Discord, außer Sie erlauben es ausdrücklich.

    Aktivieren Sie Provider-übergreifendes Messaging für den Agent:

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

    Starten Sie den Gateway nach dem Bearbeiten der Konfiguration neu.

  </Accordion>

  <Accordion title='Warum fühlt es sich so an, als würde der Bot schnelle Nachrichten "ignorieren"?'>
    Der Warteschlangenmodus steuert, wie neue Nachrichten mit einem laufenden Durchlauf interagieren. Verwenden Sie `/queue`, um Modi zu ändern:

    - `steer` - stellt alle ausstehenden Steuerungsnachrichten für die nächste Modellgrenze im aktuellen Durchlauf in die Warteschlange
    - `queue` - ältere Steuerung, eine nach der anderen
    - `followup` - Nachrichten nacheinander ausführen
    - `collect` - Nachrichten bündeln und einmal antworten
    - `steer-backlog` - jetzt steuern, dann Rückstau verarbeiten
    - `interrupt` - aktuellen Durchlauf abbrechen und neu starten

    Standardmodus ist `steer`. Sie können Optionen wie `debounce:0.5s cap:25 drop:summarize` für Follow-up-Modi hinzufügen. Siehe [Befehlswarteschlange](/de/concepts/queue) und [Steuerungswarteschlange](/de/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Sonstiges

<AccordionGroup>
  <Accordion title='Was ist das Standardmodell für Anthropic mit einem API-Schlüssel?'>
    In OpenClaw sind Anmeldedaten und Modellauswahl getrennt. Das Setzen von `ANTHROPIC_API_KEY` (oder das Speichern eines Anthropic-API-Schlüssels in Auth-Profilen) aktiviert die Authentifizierung, aber das tatsächliche Standardmodell ist das, was Sie in `agents.defaults.model.primary` konfigurieren (zum Beispiel `anthropic/claude-sonnet-4-6` oder `anthropic/claude-opus-4-6`). Wenn Sie `No credentials found for profile "anthropic:default"` sehen, bedeutet das, dass der Gateway die Anthropic-Anmeldedaten nicht in der erwarteten `auth-profiles.json` für den ausgeführten Agenten finden konnte.
  </Accordion>
</AccordionGroup>

---

Kommen Sie nicht weiter? Fragen Sie in [Discord](https://discord.com/invite/clawd) oder öffnen Sie eine [GitHub-Diskussion](https://github.com/openclaw/openclaw/discussions).

## Verwandt

- [FAQ zum ersten Start](/de/help/faq-first-run) — Installation, Onboarding, Authentifizierung, Abonnements, frühe Fehler
- [Modelle-FAQ](/de/help/faq-models) — Modellauswahl, Failover, Auth-Profile
- [Fehlerbehebung](/de/help/troubleshooting) — symptombasierte Triage
