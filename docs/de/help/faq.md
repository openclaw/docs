---
read_when:
    - Beantwortung häufiger Supportfragen zu Einrichtung, Installation, Onboarding oder Laufzeit
    - Triage von durch Benutzer gemeldeten Problemen vor tiefergehender Fehlerbehebung
summary: Häufig gestellte Fragen zur Einrichtung, Konfiguration und Nutzung von OpenClaw
title: Häufig gestellte Fragen
x-i18n:
    generated_at: "2026-05-07T13:19:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: b208e28def6b9a1165130bc02f9e2646c3b16d203dfc8c0d59dc664f388c2ef8
    source_path: help/faq.md
    workflow: 16
---

Schnelle Antworten plus tiefere Fehlerbehebung für reale Setups (lokale Entwicklung, VPS, Multi-Agent, OAuth-/API-Schlüssel, Modell-Failover). Runtime-Diagnosen finden Sie unter [Fehlerbehebung](/de/gateway/troubleshooting). Die vollständige Konfigurationsreferenz finden Sie unter [Konfiguration](/de/gateway/configuration).

## Die ersten 60 Sekunden, wenn etwas nicht funktioniert

1. **Schneller Status (erste Prüfung)**

   ```bash
   openclaw status
   ```

   Schnelle lokale Zusammenfassung: Betriebssystem + Update, Erreichbarkeit von Gateway/Dienst, Agents/Sitzungen, Provider-Konfiguration + Runtime-Probleme (wenn der Gateway erreichbar ist).

2. **Einfügbarer Bericht (sicher zum Teilen)**

   ```bash
   openclaw status --all
   ```

   Schreibgeschützte Diagnose mit Log-Auszug (Tokens redigiert).

3. **Daemon- + Port-Status**

   ```bash
   openclaw gateway status
   ```

   Zeigt Supervisor-Runtime im Vergleich zur RPC-Erreichbarkeit, die Ziel-URL der Probe und welche Konfiguration der Dienst wahrscheinlich verwendet hat.

4. **Tiefe Probes**

   ```bash
   openclaw status --deep
   ```

   Führt eine Live-Health-Probe des Gateways aus, einschließlich Channel-Probes, sofern unterstützt
   (erfordert einen erreichbaren Gateway). Siehe [Health](/de/gateway/health).

5. **Das neueste Log verfolgen**

   ```bash
   openclaw logs --follow
   ```

   Wenn RPC nicht verfügbar ist, verwenden Sie stattdessen:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Datei-Logs sind von Dienst-Logs getrennt; siehe [Logging](/de/logging) und [Fehlerbehebung](/de/gateway/troubleshooting).

6. **Doctor ausführen (Reparaturen)**

   ```bash
   openclaw doctor
   ```

   Repariert/migriert Konfiguration/Zustand und führt Zustandsprüfungen aus. Siehe [Doctor](/de/gateway/doctor).

7. **Gateway-Snapshot**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Fragt beim laufenden Gateway einen vollständigen Snapshot ab (nur WS). Siehe [Health](/de/gateway/health).

## Schnellstart und Einrichtung beim ersten Start

Fragen und Antworten zum ersten Start - Installation, Onboarding, Authentifizierungsrouten, Abonnements, anfängliche Fehler -
finden Sie in den [FAQ zum ersten Start](/de/help/faq-first-run).

## Was ist OpenClaw?

<AccordionGroup>
  <Accordion title="Was ist OpenClaw in einem Absatz?">
    OpenClaw ist ein persönlicher KI-Assistent, den Sie auf Ihren eigenen Geräten ausführen. Er antwortet auf den Messaging-Oberflächen, die Sie bereits verwenden (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat und gebündelte Channel-Plugins wie QQ Bot), und kann auf unterstützten Plattformen auch Sprache und eine Live-Canvas bereitstellen. Das **Gateway** ist die durchgehend aktive Steuerungsebene; der Assistent ist das Produkt.
  </Accordion>

  <Accordion title="Nutzenversprechen">
    OpenClaw ist nicht „nur ein Claude-Wrapper“. Es ist eine **lokal orientierte Steuerungsebene**, mit der Sie einen
    leistungsfähigen Assistenten auf **Ihrer eigenen Hardware** ausführen können, erreichbar über die Chat-Apps, die Sie bereits verwenden, mit
    zustandsbehafteten Sitzungen, Gedächtnis und Tools - ohne die Kontrolle über Ihre Workflows an eine gehostete
    SaaS abzugeben.

    Highlights:

    - **Ihre Geräte, Ihre Daten:** Führen Sie das Gateway dort aus, wo Sie möchten (Mac, Linux, VPS), und halten Sie
      Workspace und Sitzungsverlauf lokal.
    - **Echte Kanäle, keine Web-Sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/usw.,
      plus mobile Sprache und Canvas auf unterstützten Plattformen.
    - **Modellunabhängig:** Verwenden Sie Anthropic, OpenAI, MiniMax, OpenRouter usw., mit Routing
      und Failover pro Agent.
    - **Option nur lokal:** Führen Sie lokale Modelle aus, sodass **alle Daten auf Ihrem Gerät bleiben können**, wenn Sie das möchten.
    - **Multi-Agent-Routing:** getrennte Agents pro Kanal, Konto oder Aufgabe, jeweils mit eigenem
      Workspace und eigenen Voreinstellungen.
    - **Open Source und anpassbar:** Prüfen, erweitern und selbst hosten ohne Vendor-Lock-in.

    Dokumentation: [Gateway](/de/gateway), [Kanäle](/de/channels), [Multi-Agent](/de/concepts/multi-agent),
    [Gedächtnis](/de/concepts/memory).

  </Accordion>

  <Accordion title="Ich habe es gerade eingerichtet - was sollte ich zuerst tun?">
    Gute erste Projekte:

    - Eine Website erstellen (WordPress, Shopify oder eine einfache statische Website).
    - Eine mobile App prototypisieren (Gliederung, Screens, API-Plan).
    - Dateien und Ordner organisieren (Bereinigung, Benennung, Tagging).
    - Gmail verbinden und Zusammenfassungen oder Follow-ups automatisieren.

    OpenClaw kann große Aufgaben bewältigen, funktioniert aber am besten, wenn Sie sie in Phasen aufteilen und
    Sub-Agents für parallele Arbeit verwenden.

  </Accordion>

  <Accordion title="Was sind die fünf wichtigsten alltäglichen Anwendungsfälle für OpenClaw?">
    Alltägliche Erfolge sehen meist so aus:

    - **Persönliche Briefings:** Zusammenfassungen von Posteingang, Kalender und Nachrichten, die Ihnen wichtig sind.
    - **Recherche und Entwürfe:** schnelle Recherche, Zusammenfassungen und erste Entwürfe für E-Mails oder Dokumente.
    - **Erinnerungen und Follow-ups:** durch Cron oder Heartbeat gesteuerte Hinweise und Checklisten.
    - **Browser-Automatisierung:** Formulare ausfüllen, Daten sammeln und Web-Aufgaben wiederholen.
    - **Geräteübergreifende Koordination:** Senden Sie eine Aufgabe von Ihrem Telefon, lassen Sie das Gateway sie auf einem Server ausführen und erhalten Sie das Ergebnis im Chat zurück.

  </Accordion>

  <Accordion title="Kann OpenClaw bei Lead-Generierung, Outreach, Anzeigen und Blogs für ein SaaS helfen?">
    Ja, für **Recherche, Qualifizierung und Entwürfe**. Es kann Websites scannen, Auswahllisten erstellen,
    Interessenten zusammenfassen und Entwürfe für Outreach- oder Anzeigentexte schreiben.

    Bei **Outreach- oder Anzeigenläufen** sollte ein Mensch eingebunden bleiben. Vermeiden Sie Spam, befolgen Sie lokale Gesetze und
    Plattformrichtlinien, und prüfen Sie alles, bevor es gesendet wird. Das sicherste Muster ist, OpenClaw entwerfen zu lassen und selbst freizugeben.

    Doku: [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Welche Vorteile gibt es gegenüber Claude Code für Webentwicklung?">
    OpenClaw ist ein **persönlicher Assistent** und eine Koordinationsschicht, kein IDE-Ersatz. Verwenden Sie
    Claude Code oder Codex für den schnellsten direkten Coding-Loop innerhalb eines Repos. Verwenden Sie OpenClaw, wenn Sie
    dauerhaften Speicher, geräteübergreifenden Zugriff und Tool-Orchestrierung benötigen.

    Vorteile:

    - **Persistenter Speicher + Workspace** über Sitzungen hinweg
    - **Multi-Plattform-Zugriff** (WhatsApp, Telegram, TUI, WebChat)
    - **Tool-Orchestrierung** (Browser, Dateien, Zeitplanung, Hooks)
    - **Immer aktives Gateway** (auf einem VPS ausführen, von überall interagieren)
    - **Nodes** für lokalen Browser/Bildschirm/Kamera/exec

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills und Automatisierung

<AccordionGroup>
  <Accordion title="Wie passe ich Skills an, ohne das Repo schmutzig zu halten?">
    Verwenden Sie verwaltete Überschreibungen, anstatt die Repo-Kopie zu bearbeiten. Legen Sie Ihre Änderungen in `~/.openclaw/skills/<name>/SKILL.md` ab (oder fügen Sie über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` einen Ordner hinzu). Die Priorität ist `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelt → `skills.load.extraDirs`, sodass verwaltete Überschreibungen weiterhin Vorrang vor gebündelten Skills haben, ohne git zu berühren. Wenn der Skill global installiert, aber nur für einige Agents sichtbar sein soll, behalten Sie die gemeinsame Kopie in `~/.openclaw/skills` und steuern Sie die Sichtbarkeit mit `agents.defaults.skills` und `agents.list[].skills`. Nur Änderungen, die upstream-würdig sind, sollten im Repo liegen und als PRs eingereicht werden.
  </Accordion>

  <Accordion title="Kann ich Skills aus einem benutzerdefinierten Ordner laden?">
    Ja. Fügen Sie zusätzliche Verzeichnisse über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` hinzu (niedrigste Priorität). Die Standardpriorität ist `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelt → `skills.load.extraDirs`. `clawhub` installiert standardmäßig nach `./skills`, was OpenClaw in der nächsten Sitzung als `<workspace>/skills` behandelt. Wenn der Skill nur für bestimmte Agents sichtbar sein soll, kombinieren Sie dies mit `agents.defaults.skills` oder `agents.list[].skills`.
  </Accordion>

  <Accordion title="Wie kann ich unterschiedliche Modelle für unterschiedliche Aufgaben verwenden?">
    Heute werden folgende Muster unterstützt:

    - **Cron-Jobs**: Isolierte Jobs können pro Job eine `model`-Überschreibung festlegen.
    - **Sub-Agents**: Leiten Sie Aufgaben an separate Agents mit unterschiedlichen Standardmodellen weiter.
    - **Wechsel bei Bedarf**: Verwenden Sie `/model`, um das Modell der aktuellen Sitzung jederzeit zu wechseln.

    Siehe [Cron-Jobs](/de/automation/cron-jobs), [Multi-Agent-Routing](/de/concepts/multi-agent) und [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Der Bot friert bei schwerer Arbeit ein. Wie lagere ich das aus?">
    Verwenden Sie **Sub-Agents** für lange oder parallele Aufgaben. Sub-Agents laufen in ihrer eigenen Sitzung,
    geben eine Zusammenfassung zurück und halten Ihren Hauptchat reaktionsfähig.

    Bitten Sie Ihren Bot, „einen Sub-Agent für diese Aufgabe zu starten“, oder verwenden Sie `/subagents`.
    Verwenden Sie `/status` im Chat, um zu sehen, was das Gateway gerade tut (und ob es ausgelastet ist).

    Token-Tipp: Lange Aufgaben und Sub-Agents verbrauchen beide Tokens. Wenn Kosten ein Thema sind, legen Sie über `agents.defaults.subagents.model` ein
    günstigeres Modell für Sub-Agents fest.

    Doku: [Sub-Agents](/de/tools/subagents), [Hintergrundaufgaben](/de/automation/tasks).

  </Accordion>

  <Accordion title="Wie funktionieren threadgebundene Subagent-Sitzungen auf Discord?">
    Verwenden Sie Thread-Bindings. Sie können einen Discord-Thread an einen Subagent oder ein Sitzungsziel binden, sodass Folgenachrichten in diesem Thread in der gebundenen Sitzung bleiben.

    Grundlegender Ablauf:

    - Starten Sie mit `sessions_spawn` und `thread: true` (und optional `mode: "session"` für persistente Folgenachrichten).
    - Oder binden Sie manuell mit `/focus <target>`.
    - Verwenden Sie `/agents`, um den Binding-Status zu prüfen.
    - Verwenden Sie `/session idle <duration|off>` und `/session max-age <duration|off>`, um das automatische Unfocus zu steuern.
    - Verwenden Sie `/unfocus`, um den Thread zu lösen.

    Erforderliche Konfiguration:

    - Globale Standardwerte: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord-Überschreibungen: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatisches Binden beim Start: `channels.discord.threadBindings.spawnSessions` ist standardmäßig `true`; setzen Sie es auf `false`, um threadgebundene Sitzungsstarts zu deaktivieren.

    Doku: [Sub-Agents](/de/tools/subagents), [Discord](/de/channels/discord), [Konfigurationsreferenz](/de/gateway/configuration-reference), [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Ein Subagent ist fertig, aber die Abschlussmeldung ging an die falsche Stelle oder wurde nie gepostet. Was sollte ich prüfen?">
    Prüfen Sie zuerst die aufgelöste Requester-Route:

    - Die Zustellung von Subagenten im Completion-Modus bevorzugt jeden gebundenen Thread oder jede Konversationsroute, wenn eine vorhanden ist.
    - Wenn der Completion-Ursprung nur einen Kanal enthält, fällt OpenClaw auf die gespeicherte Route der Requester-Sitzung zurück (`lastChannel` / `lastTo` / `lastAccountId`), sodass direkte Zustellung trotzdem erfolgreich sein kann.
    - Wenn weder eine gebundene Route noch eine nutzbare gespeicherte Route vorhanden ist, kann die direkte Zustellung fehlschlagen, und das Ergebnis fällt auf die Zustellung über die Warteschlange der Sitzung zurück, anstatt sofort im Chat gepostet zu werden.
    - Ungültige oder veraltete Ziele können weiterhin einen Queue-Fallback oder einen endgültigen Zustellungsfehler erzwingen.
    - Wenn die letzte sichtbare Assistentenantwort des Childs exakt das stille Token `NO_REPLY` / `no_reply` oder exakt `ANNOUNCE_SKIP` ist, unterdrückt OpenClaw die Ankündigung absichtlich, anstatt veralteten früheren Fortschritt zu posten.
    - Wenn das Child nach ausschließlich Tool-Aufrufen ein Timeout hatte, kann die Ankündigung dies zu einer kurzen Zusammenfassung des Teilfortschritts verdichten, anstatt rohe Tool-Ausgabe erneut abzuspielen.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Doku: [Sub-Agents](/de/tools/subagents), [Hintergrundaufgaben](/de/automation/tasks), [Sitzungstools](/de/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron oder Erinnerungen werden nicht ausgelöst. Was sollte ich prüfen?">
    Cron läuft innerhalb des Gateway-Prozesses. Wenn das Gateway nicht dauerhaft läuft,
    werden geplante Jobs nicht ausgeführt.

    Checkliste:

    - Bestätigen Sie, dass cron aktiviert ist (`cron.enabled`) und `OPENCLAW_SKIP_CRON` nicht gesetzt ist.
    - Prüfen Sie, dass das Gateway rund um die Uhr läuft (kein Schlafmodus/keine Neustarts).
    - Überprüfen Sie die Zeitzoneneinstellungen für den Job (`--tz` gegenüber Host-Zeitzone).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Doku: [Cron-Jobs](/de/automation/cron-jobs), [Automatisierung & Aufgaben](/de/automation).

  </Accordion>

  <Accordion title="Cron wurde ausgelöst, aber es wurde nichts an den Kanal gesendet. Warum?">
    Prüfen Sie zuerst den Zustellmodus:

    - `--no-deliver` / `delivery.mode: "none"` bedeutet, dass kein Fallback-Versand durch den Runner erwartet wird.
    - Ein fehlendes oder ungültiges Ankündigungsziel (`channel` / `to`) bedeutet, dass der Runner die ausgehende Zustellung übersprungen hat.
    - Authentifizierungsfehler des Kanals (`unauthorized`, `Forbidden`) bedeuten, dass der Runner die Zustellung versucht hat, die Zugangsdaten sie aber blockiert haben.
    - Ein stilles isoliertes Ergebnis (nur `NO_REPLY` / `no_reply`) wird als absichtlich nicht zustellbar behandelt, daher unterdrückt der Runner auch die eingereihte Fallback-Zustellung.

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

  <Accordion title="Warum hat ein isolierter Cron-Lauf das Modell gewechselt oder es einmal erneut versucht?">
    Das ist normalerweise der Live-Modellwechselpfad, keine doppelte Planung.

    Isolierter Cron kann eine Laufzeit-Modellübergabe persistieren und es erneut
    versuchen, wenn der aktive Lauf `LiveSessionModelSwitchError` auslöst. Der erneute
    Versuch behält den gewechselten Provider und das gewechselte Modell bei, und wenn
    der Wechsel eine neue Auth-Profil-Übersteuerung mitgebracht hat, persistiert Cron
    auch diese vor dem erneuten Versuch.

    Zugehörige Auswahlregeln:

    - Die Gmail-Hook-Modellübersteuerung gewinnt zuerst, wenn sie anwendbar ist.
    - Dann `model` pro Job.
    - Dann jede gespeicherte Cron-Sitzungsmodellübersteuerung.
    - Dann die normale Agent-/Standardmodellauswahl.

    Die Wiederholungsschleife ist begrenzt. Nach dem ersten Versuch plus 2 Wechsel-Wiederholungen
    bricht Cron ab, anstatt endlos weiterzulaufen.

    Debugging:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Cron-CLI](/de/cli/cron).

  </Accordion>

  <Accordion title="Wie installiere ich Skills unter Linux?">
    Verwenden Sie native `openclaw skills`-Befehle oder legen Sie Skills in Ihrem Arbeitsbereich ab. Die macOS-Skills-UI ist unter Linux nicht verfügbar.
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

    Natives `openclaw skills install` schreibt in das Verzeichnis `skills/` des
    aktiven Arbeitsbereichs. Installieren Sie die separate `clawhub`-CLI nur, wenn
    Sie eigene Skills veröffentlichen oder synchronisieren möchten. Für gemeinsam
    genutzte Installationen über mehrere Agenten hinweg legen Sie den Skill unter
    `~/.openclaw/skills` ab und verwenden Sie `agents.defaults.skills` oder
    `agents.list[].skills`, wenn Sie einschränken möchten, welche Agenten ihn sehen können.

  </Accordion>

  <Accordion title="Kann OpenClaw Aufgaben nach Zeitplan oder kontinuierlich im Hintergrund ausführen?">
    Ja. Verwenden Sie den Gateway-Scheduler:

    - **Cron-Jobs** für geplante oder wiederkehrende Aufgaben (bleiben über Neustarts hinweg erhalten).
    - **Heartbeat** für regelmäßige Prüfungen der „Hauptsitzung“.
    - **Isolierte Jobs** für autonome Agenten, die Zusammenfassungen posten oder an Chats zustellen.

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Automatisierung und Aufgaben](/de/automation),
    [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title="Kann ich reine Apple-macOS-Skills von Linux aus ausführen?">
    Nicht direkt. macOS-Skills werden durch `metadata.openclaw.os` plus erforderliche Binärdateien eingeschränkt, und Skills erscheinen nur dann im System-Prompt, wenn sie auf dem **Gateway-Host** zulässig sind. Unter Linux werden reine `darwin`-Skills (wie `apple-notes`, `apple-reminders`, `things-mac`) nicht geladen, es sei denn, Sie übersteuern das Gating.

    Sie haben drei unterstützte Muster:

    **Option A - Gateway auf einem Mac ausführen (am einfachsten).**
    Führen Sie den Gateway dort aus, wo die macOS-Binärdateien vorhanden sind, und verbinden Sie sich dann von Linux aus im [Remote-Modus](#gateway-ports-already-running-and-remote-mode) oder über Tailscale. Die Skills werden normal geladen, weil der Gateway-Host macOS ist.

    **Option B - macOS-Node verwenden (ohne SSH).**
    Führen Sie den Gateway unter Linux aus, koppeln Sie einen macOS-Node (Menüleisten-App) und setzen Sie **Node-Ausführungsbefehle** auf dem Mac auf „Immer fragen“ oder „Immer erlauben“. OpenClaw kann reine macOS-Skills als zulässig behandeln, wenn die erforderlichen Binärdateien auf dem Node vorhanden sind. Der Agent führt diese Skills über das `nodes`-Tool aus. Wenn Sie „Immer fragen“ wählen, fügt die Bestätigung von „Immer erlauben“ in der Eingabeaufforderung diesen Befehl der Allowlist hinzu.

    **Option C - macOS-Binärdateien über SSH weiterleiten (fortgeschritten).**
    Behalten Sie den Gateway unter Linux, sorgen Sie aber dafür, dass die erforderlichen CLI-Binärdateien auf SSH-Wrapper aufgelöst werden, die auf einem Mac laufen. Übersteuern Sie dann den Skill, um Linux zu erlauben, damit er zulässig bleibt.

    1. Erstellen Sie einen SSH-Wrapper für die Binärdatei (Beispiel: `memo` für Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Legen Sie den Wrapper auf dem Linux-Host in `PATH` ab (zum Beispiel `~/bin/memo`).
    3. Übersteuern Sie die Skill-Metadaten (Arbeitsbereich oder `~/.openclaw/skills`), um Linux zu erlauben:

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
    - Bitten Sie den Agenten, diese Seite zu Beginn einer Sitzung abzurufen.

    Wenn Sie eine native Integration möchten, öffnen Sie einen Feature Request oder erstellen Sie einen Skill,
    der auf diese APIs abzielt.

    Skills installieren:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Native Installationen landen im Verzeichnis `skills/` des aktiven Arbeitsbereichs. Für gemeinsam genutzte Skills über mehrere Agenten hinweg legen Sie sie unter `~/.openclaw/skills/<name>/SKILL.md` ab. Wenn nur einige Agenten eine gemeinsam genutzte Installation sehen sollen, konfigurieren Sie `agents.defaults.skills` oder `agents.list[].skills`. Einige Skills erwarten Binärdateien, die über Homebrew installiert wurden; unter Linux bedeutet das Linuxbrew (siehe den Homebrew-Linux-FAQ-Eintrag oben). Siehe [Skills](/de/tools/skills), [Skills-Konfiguration](/de/tools/skills-config) und [ClawHub](/de/tools/clawhub).

  </Accordion>

  <Accordion title="Wie verwende ich mein vorhandenes angemeldetes Chrome mit OpenClaw?">
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

    Aktuelle Einschränkungen bei `existing-session` / `user`:

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

  <Accordion title="Docker fühlt sich eingeschränkt an - wie aktiviere ich alle Funktionen?">
    Das Standard-Image ist sicherheitsorientiert und läuft als `node`-Benutzer, daher enthält es keine
    Systempakete, kein Homebrew und keine gebündelten Browser. Für eine vollständigere Einrichtung:

    - Persistieren Sie `/home/node` mit `OPENCLAW_HOME_VOLUME`, damit Caches erhalten bleiben.
    - Backen Sie Systemabhängigkeiten mit `OPENCLAW_DOCKER_APT_PACKAGES` in das Image ein.
    - Installieren Sie Playwright-Browser über die gebündelte CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Setzen Sie `PLAYWRIGHT_BROWSERS_PATH` und stellen Sie sicher, dass der Pfad persistiert wird.

    Dokumentation: [Docker](/de/install/docker), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Kann ich DMs persönlich halten, Gruppen aber mit einem Agenten öffentlich/sandboxed machen?">
    Ja - wenn Ihr privater Verkehr **DMs** und Ihr öffentlicher Verkehr **Gruppen** sind.

    Verwenden Sie `agents.defaults.sandbox.mode: "non-main"`, damit Gruppen-/Kanalsitzungen (Nicht-Hauptschlüssel) im konfigurierten Sandbox-Backend laufen, während die Haupt-DM-Sitzung auf dem Host bleibt. Docker ist das Standard-Backend, wenn Sie keines auswählen. Beschränken Sie anschließend über `tools.sandbox.tools`, welche Tools in Sandbox-Sitzungen verfügbar sind.

    Einrichtungsanleitung + Beispielkonfiguration: [Gruppen: persönliche DMs + öffentliche Gruppen](/de/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Wichtige Konfigurationsreferenz: [Gateway-Konfiguration](/de/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Wie binde ich einen Host-Ordner in die Sandbox ein?">
    Setzen Sie `agents.defaults.sandbox.docker.binds` auf `["host:path:mode"]` (z. B. `"/home/user/src:/src:ro"`). Globale und agentenspezifische Bind-Mounts werden zusammengeführt; agentenspezifische Bind-Mounts werden ignoriert, wenn `scope: "shared"` ist. Verwenden Sie `:ro` für alles Sensible und denken Sie daran, dass Bind-Mounts die Dateisystemgrenzen der Sandbox umgehen.

    OpenClaw validiert Bind-Quellen sowohl gegen den normalisierten Pfad als auch gegen den kanonischen Pfad, der über den tiefsten vorhandenen Vorfahren aufgelöst wurde. Das bedeutet, dass Symlink-Parent-Ausbrüche weiterhin geschlossen fehlschlagen, selbst wenn das letzte Pfadsegment noch nicht existiert, und dass Prüfungen erlaubter Root-Pfade auch nach der Symlink-Auflösung weiterhin gelten.

    Siehe [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts) und [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) für Beispiele und Sicherheitshinweise.

  </Accordion>

  <Accordion title="Wie funktioniert Speicher?">
    OpenClaw-Speicher besteht einfach aus Markdown-Dateien im Agent-Arbeitsbereich:

    - Tagesnotizen in `memory/YYYY-MM-DD.md`
    - Kuratierte Langzeitnotizen in `MEMORY.md` (nur Haupt-/private Sitzungen)

    OpenClaw führt außerdem einen **stillen Speicher-Flush vor der Compaction** aus, um das Modell daran zu erinnern,
    dauerhafte Notizen zu schreiben, bevor Auto-Compaction erfolgt. Das läuft nur, wenn der Arbeitsbereich
    beschreibbar ist (schreibgeschützte Sandboxes überspringen es). Siehe [Speicher](/de/concepts/memory).

  </Accordion>

  <Accordion title="Der Speicher vergisst ständig Dinge. Wie mache ich sie dauerhaft?">
    Bitten Sie den Bot, **den Fakt in den Speicher zu schreiben**. Langzeitnotizen gehören in `MEMORY.md`,
    kurzfristiger Kontext kommt in `memory/YYYY-MM-DD.md`.

    Das ist weiterhin ein Bereich, den wir verbessern. Es hilft, das Modell daran zu erinnern, Erinnerungen zu speichern;
    es wird wissen, was zu tun ist. Wenn es weiterhin vergisst, prüfen Sie, ob der Gateway bei jedem Lauf denselben
    Arbeitsbereich verwendet.

    Dokumentation: [Speicher](/de/concepts/memory), [Agent-Arbeitsbereich](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bleibt Speicher für immer bestehen? Welche Grenzen gibt es?">
    Speicherdateien liegen auf der Festplatte und bleiben bestehen, bis Sie sie löschen. Die Grenze ist Ihr
    Speicherplatz, nicht das Modell. Der **Sitzungskontext** ist weiterhin durch das Kontextfenster des Modells
    begrenzt, daher können lange Gespräche verdichtet oder abgeschnitten werden. Deshalb
    gibt es die Speichersuche - sie holt nur die relevanten Teile zurück in den Kontext.

    Dokumentation: [Speicher](/de/concepts/memory), [Kontext](/de/concepts/context).

  </Accordion>

  <Accordion title="Benötigt die semantische Speichersuche einen OpenAI-API-Schlüssel?">
    Nur wenn Sie **OpenAI-Embeddings** verwenden. Codex OAuth deckt Chat/Completions ab und
    gewährt **keinen** Zugriff auf Embeddings. Daher hilft **die Anmeldung mit Codex (OAuth oder der
    Codex CLI-Anmeldung)** nicht für die semantische Speichersuche. OpenAI-Embeddings
    benötigen weiterhin einen echten API-Schlüssel (`OPENAI_API_KEY` oder `models.providers.openai.apiKey`).

    Wenn Sie keinen Provider explizit festlegen, wählt OpenClaw automatisch einen Provider aus, wenn es
    einen API-Schlüssel auflösen kann (Auth-Profile, `models.providers.*.apiKey` oder Umgebungsvariablen).
    Es bevorzugt OpenAI, wenn ein OpenAI-Schlüssel aufgelöst wird, andernfalls Gemini, wenn ein Gemini-Schlüssel
    aufgelöst wird, dann Voyage, dann Mistral. Wenn kein Remote-Schlüssel verfügbar ist, bleibt die
    Speichersuche deaktiviert, bis Sie sie konfigurieren. Wenn Sie einen lokalen Modellpfad
    konfiguriert haben und dieser vorhanden ist, bevorzugt OpenClaw
    `local`. Ollama wird unterstützt, wenn Sie explizit
    `memorySearch.provider = "ollama"` festlegen.

    Wenn Sie lieber lokal bleiben möchten, setzen Sie `memorySearch.provider = "local"` (und optional
    `memorySearch.fallback = "none"`). Wenn Sie Gemini-Embeddings verwenden möchten, setzen Sie
    `memorySearch.provider = "gemini"` und stellen Sie `GEMINI_API_KEY` (oder
    `memorySearch.remote.apiKey`) bereit. Wir unterstützen Embedding-Modelle von **OpenAI, Gemini, Voyage, Mistral, Ollama oder lokal** -
    siehe [Speicher](/de/concepts/memory) für die Einrichtungsdetails.

  </Accordion>
</AccordionGroup>

## Wo Dinge auf dem Datenträger liegen

<AccordionGroup>
  <Accordion title="Werden alle mit OpenClaw verwendeten Daten lokal gespeichert?">
    Nein - **der Zustand von OpenClaw ist lokal**, aber **externe Dienste sehen weiterhin, was Sie an sie senden**.

    - **Standardmäßig lokal:** Sitzungen, Speicherdateien, Konfiguration und Arbeitsbereich liegen auf dem Gateway-Host
      (`~/.openclaw` + Ihr Arbeitsbereichsverzeichnis).
    - **Notwendigerweise remote:** Nachrichten, die Sie an Modell-Provider (Anthropic/OpenAI/usw.) senden, gehen an
      deren APIs, und Chat-Plattformen (WhatsApp/Telegram/Slack/usw.) speichern Nachrichtendaten auf ihren
      Servern.
    - **Sie steuern den Umfang:** Die Verwendung lokaler Modelle hält Prompts auf Ihrem Rechner, aber Kanal-
      Datenverkehr läuft weiterhin über die Server des Kanals.

    Verwandt: [Agent-Arbeitsbereich](/de/concepts/agent-workspace), [Speicher](/de/concepts/memory).

  </Accordion>

  <Accordion title="Wo speichert OpenClaw seine Daten?">
    Alles liegt unter `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`):

    | Pfad                                                            | Zweck                                                              |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Hauptkonfiguration (JSON5)                                         |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Legacy-OAuth-Import (bei erster Verwendung in Auth-Profile kopiert) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth-Profile (OAuth, API-Schlüssel und optional `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Optionale dateibasierte Secret-Nutzlast für `file` SecretRef-Provider |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Legacy-Kompatibilitätsdatei (statische `api_key`-Einträge bereinigt) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Provider-Zustand (z. B. `whatsapp/<accountId>/creds.json`)         |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Zustand pro Agent (agentDir + Sitzungen)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Gesprächsverlauf und Zustand (pro Agent)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Sitzungsmetadaten (pro Agent)                                      |

    Legacy-Pfad für Einzel-Agent: `~/.openclaw/agent/*` (migriert durch `openclaw doctor`).

    Ihr **Arbeitsbereich** (AGENTS.md, Speicherdateien, Skills usw.) ist getrennt und wird über `agents.defaults.workspace` konfiguriert (Standard: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Wo sollten AGENTS.md / SOUL.md / USER.md / MEMORY.md liegen?">
    Diese Dateien liegen im **Agent-Arbeitsbereich**, nicht in `~/.openclaw`.

    - **Arbeitsbereich (pro Agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, optional `HEARTBEAT.md`.
      `memory.md` in Kleinschreibung im Root ist nur Legacy-Reparatureingabe; `openclaw doctor --fix`
      kann sie in `MEMORY.md` zusammenführen, wenn beide Dateien existieren.
    - **Zustandsverzeichnis (`~/.openclaw`)**: Konfiguration, Kanal-/Provider-Zustand, Auth-Profile, Sitzungen, Logs
      und geteilte Skills (`~/.openclaw/skills`).

    Standardarbeitsbereich ist `~/.openclaw/workspace`, konfigurierbar über:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Wenn der Bot nach einem Neustart „vergisst“, prüfen Sie, ob das Gateway bei jedem Start denselben
    Arbeitsbereich verwendet (und denken Sie daran: Der Remote-Modus verwendet den **Arbeitsbereich des Gateway-Hosts**,
    nicht Ihren lokalen Laptop).

    Tipp: Wenn Sie ein dauerhaftes Verhalten oder eine dauerhafte Präferenz möchten, bitten Sie den Bot, **es in
    AGENTS.md oder MEMORY.md zu schreiben**, statt sich auf den Chatverlauf zu verlassen.

    Siehe [Agent-Arbeitsbereich](/de/concepts/agent-workspace) und [Speicher](/de/concepts/memory).

  </Accordion>

  <Accordion title="Empfohlene Backup-Strategie">
    Legen Sie Ihren **Agent-Arbeitsbereich** in ein **privates** Git-Repository und sichern Sie ihn an einem
    privaten Ort (zum Beispiel GitHub privat). Dadurch werden Speicher + AGENTS/SOUL/USER-
    Dateien erfasst, und Sie können den „Geist“ des Assistenten später wiederherstellen.

    Committen Sie **nichts** unter `~/.openclaw` (Anmeldedaten, Sitzungen, Tokens oder verschlüsselte Secret-Nutzlasten).
    Wenn Sie eine vollständige Wiederherstellung benötigen, sichern Sie sowohl den Arbeitsbereich als auch das Zustandsverzeichnis
    separat (siehe die Migrationsfrage oben).

    Dokumentation: [Agent-Arbeitsbereich](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Wie deinstalliere ich OpenClaw vollständig?">
    Siehe den dedizierten Leitfaden: [Deinstallieren](/de/install/uninstall).
  </Accordion>

  <Accordion title="Können Agents außerhalb des Arbeitsbereichs arbeiten?">
    Ja. Der Arbeitsbereich ist das **Standard-cwd** und der Speicheranker, keine harte Sandbox.
    Relative Pfade werden innerhalb des Arbeitsbereichs aufgelöst, aber absolute Pfade können auf andere
    Host-Speicherorte zugreifen, sofern Sandboxing nicht aktiviert ist. Wenn Sie Isolation benötigen, verwenden Sie
    [`agents.defaults.sandbox`](/de/gateway/sandboxing) oder Sandbox-Einstellungen pro Agent. Wenn Sie möchten,
    dass ein Repository das Standardarbeitsverzeichnis ist, setzen Sie `workspace` dieses Agents
    auf das Repository-Root. Das OpenClaw-Repository ist nur Quellcode; halten Sie den
    Arbeitsbereich getrennt, sofern Sie nicht bewusst möchten, dass der Agent darin arbeitet.

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
    Der Sitzungszustand gehört dem **Gateway-Host**. Wenn Sie im Remote-Modus sind, befindet sich der relevante Sitzungsspeicher auf dem Remote-Rechner, nicht auf Ihrem lokalen Laptop. Siehe [Sitzungsverwaltung](/de/concepts/session).
  </Accordion>
</AccordionGroup>

## Grundlagen der Konfiguration

<AccordionGroup>
  <Accordion title="Welches Format hat die Konfiguration? Wo ist sie?">
    OpenClaw liest eine optionale **JSON5**-Konfiguration aus `$OPENCLAW_CONFIG_PATH` (Standard: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Wenn die Datei fehlt, verwendet es einigermaßen sichere Standardwerte (einschließlich eines Standardarbeitsbereichs von `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ich habe gateway.bind: "lan" (oder "tailnet") gesetzt und jetzt lauscht nichts / die UI meldet nicht autorisiert'>
    Nicht-loopback-Binds **erfordern einen gültigen Gateway-Auth-Pfad**. In der Praxis bedeutet das:

    - Shared-Secret-Auth: Token oder Passwort
    - `gateway.auth.mode: "trusted-proxy"` hinter einem korrekt konfigurierten identitätsbewussten Reverse Proxy

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

    - `gateway.remote.token` / `.password` aktivieren lokale Gateway-Auth **nicht** allein.
    - Lokale Aufrufpfade können `gateway.remote.*` nur als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
    - Für Passwort-Auth setzen Sie stattdessen `gateway.auth.mode: "password"` plus `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht auflösbar ist, schlägt die Auflösung geschlossen fehl (keine Maskierung durch Remote-Fallback).
    - Shared-Secret-Control-UI-Setups authentifizieren über `connect.params.auth.token` oder `connect.params.auth.password` (gespeichert in App-/UI-Einstellungen). Identitätsführende Modi wie Tailscale Serve oder `trusted-proxy` verwenden stattdessen Request-Header. Vermeiden Sie Shared Secrets in URLs.
    - Mit `gateway.auth.mode: "trusted-proxy"` benötigen same-host loopback Reverse Proxies explizit `gateway.auth.trustedProxy.allowLoopback = true` und einen loopback-Eintrag in `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Warum brauche ich jetzt ein Token auf localhost?">
    OpenClaw erzwingt Gateway-Auth standardmäßig, einschließlich loopback. Im normalen Standardpfad bedeutet das Token-Auth: Wenn kein expliziter Auth-Pfad konfiguriert ist, wird der Gateway-Start auf Token-Modus aufgelöst und erzeugt ein nur zur Laufzeit gültiges Token für diesen Start, sodass **lokale WS-Clients sich authentifizieren müssen**. Konfigurieren Sie `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` oder `OPENCLAW_GATEWAY_PASSWORD` explizit, wenn Clients ein stabiles Secret über Neustarts hinweg benötigen. Dies verhindert, dass andere lokale Prozesse das Gateway aufrufen.

    Wenn Sie einen anderen Auth-Pfad bevorzugen, können Sie explizit den Passwortmodus wählen (oder, für identitätsbewusste Reverse Proxies, `trusted-proxy`). Wenn Sie **wirklich** offenes loopback möchten, setzen Sie `gateway.auth.mode: "none"` explizit in Ihrer Konfiguration. Doctor kann jederzeit ein Token für Sie generieren: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Muss ich nach einer Konfigurationsänderung neu starten?">
    Das Gateway überwacht die Konfiguration und unterstützt Hot-Reload:

    - `gateway.reload.mode: "hybrid"` (Standard): sichere Änderungen sofort anwenden, bei kritischen Änderungen neu starten
    - `hot`, `restart`, `off` werden ebenfalls unterstützt

  </Accordion>

  <Accordion title="Wie deaktiviere ich lustige CLI-Taglines?">
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

    - `off`: blendet Tagline-Text aus, behält aber die Banner-Titel-/Versionszeile bei.
    - `default`: verwendet jedes Mal `All your chats, one OpenClaw.`.
    - `random`: rotierende lustige/saisonale Taglines (Standardverhalten).
    - Wenn Sie gar kein Banner möchten, setzen Sie die Umgebungsvariable `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Wie aktiviere ich Websuche (und Web-Abruf)?">
    `web_fetch` funktioniert ohne API-Schlüssel. `web_search` hängt von Ihrem ausgewählten
    Provider ab:

    - API-gestützte Provider wie Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity und Tavily erfordern ihre normale API-Schlüssel-Einrichtung.
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

    Die Provider-spezifische Websuche-Konfiguration liegt jetzt unter `plugins.entries.<plugin>.config.webSearch.*`.
    Veraltete Provider-Pfade unter `tools.web.search.*` werden aus Kompatibilitätsgründen vorübergehend noch geladen, sollten aber nicht für neue Konfigurationen verwendet werden.
    Die Firecrawl-Fallback-Konfiguration für Webabrufe liegt unter `plugins.entries.firecrawl.config.webFetch.*`.

    Hinweise:

    - Wenn Sie Allowlists verwenden, fügen Sie `web_search`/`web_fetch`/`x_search` oder `group:web` hinzu.
    - `web_fetch` ist standardmäßig aktiviert (sofern nicht ausdrücklich deaktiviert).
    - Wenn `tools.web.fetch.provider` ausgelassen wird, erkennt OpenClaw automatisch den ersten bereiten Fallback-Provider für Abrufe anhand der verfügbaren Zugangsdaten. Derzeit ist der gebündelte Provider Firecrawl.
    - Daemons lesen Umgebungsvariablen aus `~/.openclaw/.env` (oder aus der Service-Umgebung).

    Dokumentation: [Webtools](/de/tools/web).

  </Accordion>

  <Accordion title="config.apply hat meine Konfiguration gelöscht. Wie stelle ich sie wieder her und vermeide das?">
    `config.apply` ersetzt die **gesamte Konfiguration**. Wenn Sie ein Teilobjekt senden, wird alles
    andere entfernt.

    Die aktuelle OpenClaw-Version schützt vor vielen versehentlichen Überschreibungen:

    - OpenClaw-eigene Konfigurationsschreibvorgänge validieren vor dem Schreiben die vollständige Konfiguration nach der Änderung.
    - Ungültige oder destruktive OpenClaw-eigene Schreibvorgänge werden abgelehnt und als `openclaw.json.rejected.*` gespeichert.
    - Wenn eine direkte Bearbeitung den Start oder das Hot Reloading beschädigt, schlägt der Gateway geschlossen fehl oder überspringt das Neuladen; er schreibt `openclaw.json` nicht neu.
    - `openclaw doctor --fix` ist für Reparaturen zuständig und kann den zuletzt bekannten guten Zustand wiederherstellen, während die abgelehnte Datei als `openclaw.json.clobbered.*` gespeichert wird.

    Wiederherstellung:

    - Prüfen Sie `openclaw logs --follow` auf `Invalid config at`, `Config write rejected:` oder `config reload skipped (invalid config)`.
    - Untersuchen Sie die neueste Datei `openclaw.json.clobbered.*` oder `openclaw.json.rejected.*` neben der aktiven Konfiguration.
    - Führen Sie `openclaw config validate` und `openclaw doctor --fix` aus.
    - Kopieren Sie nur die beabsichtigten Schlüssel mit `openclaw config set` oder `config.patch` zurück.
    - Wenn Sie keinen zuletzt bekannten guten Zustand oder keine abgelehnte Payload haben, stellen Sie sie aus einem Backup wieder her oder führen Sie `openclaw doctor` erneut aus und konfigurieren Sie Channels/Modelle neu.
    - Wenn dies unerwartet war, melden Sie einen Fehler und fügen Sie Ihre zuletzt bekannte Konfiguration oder ein Backup bei.
    - Ein lokaler Coding-Agent kann aus Protokollen oder Verlauf häufig eine funktionierende Konfiguration rekonstruieren.

    Vermeidung:

    - Verwenden Sie `openclaw config set` für kleine Änderungen.
    - Verwenden Sie `openclaw configure` für interaktive Bearbeitungen.
    - Verwenden Sie zuerst `config.schema.lookup`, wenn Sie sich bei einem exakten Pfad oder einer Feldstruktur nicht sicher sind; es gibt einen flachen Schemaknoten plus Zusammenfassungen der direkten untergeordneten Elemente zum Drill-down zurück.
    - Verwenden Sie `config.patch` für partielle RPC-Bearbeitungen; nutzen Sie `config.apply` nur für den vollständigen Konfigurationsersatz.
    - Wenn Sie das nur für Eigentümer vorgesehene `gateway`-Tool aus einem Agent-Lauf verwenden, lehnt es weiterhin Schreibvorgänge auf `tools.exec.ask` / `tools.exec.security` ab (einschließlich veralteter `tools.bash.*`-Aliasse, die auf dieselben geschützten Exec-Pfade normalisiert werden).

    Dokumentation: [Konfiguration](/de/cli/config), [Konfigurieren](/de/cli/configure), [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/de/gateway/doctor).

  </Accordion>

  <Accordion title="Wie führe ich einen zentralen Gateway mit spezialisierten Workern über mehrere Geräte hinweg aus?">
    Das übliche Muster ist **ein Gateway** (z. B. Raspberry Pi) plus **Nodes** und **Agenten**:

    - **Gateway (zentral):** verwaltet Channels (Signal/WhatsApp), Routing und Sitzungen.
    - **Nodes (Geräte):** Macs/iOS/Android verbinden sich als Peripherie und stellen lokale Tools bereit (`system.run`, `canvas`, `camera`).
    - **Agenten (Worker):** separate Gehirne/Arbeitsbereiche für spezielle Rollen (z. B. „Hetzner-Betrieb“, „Persönliche Daten“).
    - **Sub-Agenten:** starten Hintergrundarbeit von einem Hauptagenten, wenn Sie Parallelität möchten.
    - **TUI:** stellt eine Verbindung zum Gateway her und wechselt zwischen Agenten/Sitzungen.

    Dokumentation: [Nodes](/de/nodes), [Remote-Zugriff](/de/gateway/remote), [Multi-Agent-Routing](/de/concepts/multi-agent), [Sub-Agenten](/de/tools/subagents), [TUI](/de/web/tui).

  </Accordion>

  <Accordion title="Kann der OpenClaw-Browser headless ausgeführt werden?">
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

    Standard ist `false` (mit sichtbarem Browserfenster). Headless löst auf einigen Websites eher Anti-Bot-Prüfungen aus. Siehe [Browser](/de/tools/browser).

    Headless verwendet dieselbe **Chromium-Engine** und funktioniert für die meisten Automatisierungen (Formulare, Klicks, Scraping, Logins). Die Hauptunterschiede:

    - Kein sichtbares Browserfenster (verwenden Sie Screenshots, wenn Sie visuelle Informationen benötigen).
    - Manche Websites sind im Headless-Modus strenger bei Automatisierung (CAPTCHAs, Anti-Bot).
      X/Twitter blockiert beispielsweise häufig Headless-Sitzungen.

  </Accordion>

  <Accordion title="Wie verwende ich Brave für die Browsersteuerung?">
    Setzen Sie `browser.executablePath` auf Ihre Brave-Binärdatei (oder einen beliebigen Chromium-basierten Browser) und starten Sie den Gateway neu.
    Die vollständigen Konfigurationsbeispiele finden Sie unter [Browser](/de/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Remote-Gateways und Nodes

<AccordionGroup>
  <Accordion title="Wie werden Befehle zwischen Telegram, dem Gateway und Nodes weitergeleitet?">
    Telegram-Nachrichten werden vom **Gateway** verarbeitet. Der Gateway führt den Agenten aus und
    ruft erst dann Nodes über den **Gateway WebSocket** auf, wenn ein Node-Tool benötigt wird:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes sehen keinen eingehenden Provider-Traffic; sie erhalten nur Node-RPC-Aufrufe.

  </Accordion>

  <Accordion title="Wie kann mein Agent auf meinen Computer zugreifen, wenn der Gateway remote gehostet wird?">
    Kurz gesagt: **Koppeln Sie Ihren Computer als Node**. Der Gateway läuft anderswo, kann aber
    `node.*`-Tools (Bildschirm, Kamera, System) auf Ihrem lokalen Rechner über den Gateway WebSocket aufrufen.

    Typische Einrichtung:

    1. Führen Sie den Gateway auf dem Always-on-Host aus (VPS/Heimserver).
    2. Bringen Sie den Gateway-Host und Ihren Computer in dasselbe Tailnet.
    3. Stellen Sie sicher, dass der Gateway-WS erreichbar ist (Tailnet-Bindung oder SSH-Tunnel).
    4. Öffnen Sie die macOS-App lokal und verbinden Sie sich im Modus **Remote über SSH** (oder direkt über das Tailnet),
       damit sie sich als Node registrieren kann.
    5. Genehmigen Sie den Node auf dem Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Es ist keine separate TCP-Bridge erforderlich; Nodes verbinden sich über den Gateway WebSocket.

    Sicherheitshinweis: Das Koppeln eines macOS-Node erlaubt `system.run` auf diesem Rechner. Koppeln Sie nur
    Geräte, denen Sie vertrauen, und lesen Sie [Sicherheit](/de/gateway/security).

    Dokumentation: [Nodes](/de/nodes), [Gateway-Protokoll](/de/gateway/protocol), [macOS-Remote-Modus](/de/platforms/mac/remote), [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Tailscale ist verbunden, aber ich erhalte keine Antworten. Was nun?">
    Prüfen Sie die Grundlagen:

    - Gateway läuft: `openclaw gateway status`
    - Gateway-Zustand: `openclaw status`
    - Channel-Zustand: `openclaw channels status`

    Überprüfen Sie dann Authentifizierung und Routing:

    - Wenn Sie Tailscale Serve verwenden, stellen Sie sicher, dass `gateway.auth.allowTailscale` korrekt gesetzt ist.
    - Wenn Sie sich per SSH-Tunnel verbinden, bestätigen Sie, dass der lokale Tunnel aktiv ist und auf den richtigen Port zeigt.
    - Bestätigen Sie, dass Ihre Allowlists (DM oder Gruppe) Ihr Konto enthalten.

    Dokumentation: [Tailscale](/de/gateway/tailscale), [Remote-Zugriff](/de/gateway/remote), [Channels](/de/channels).

  </Accordion>

  <Accordion title="Können zwei OpenClaw-Instanzen miteinander sprechen (lokal + VPS)?">
    Ja. Es gibt keine integrierte „Bot-zu-Bot“-Bridge, aber Sie können dies auf einige
    zuverlässige Arten verdrahten:

    **Am einfachsten:** Verwenden Sie einen normalen Chat-Channel, auf den beide Bots zugreifen können (Telegram/Slack/WhatsApp).
    Lassen Sie Bot A eine Nachricht an Bot B senden und Bot B dann wie gewohnt antworten.

    **CLI-Bridge (generisch):** Führen Sie ein Skript aus, das den anderen Gateway mit
    `openclaw agent --message ... --deliver` aufruft und auf einen Chat zielt, in dem der andere Bot
    zuhört. Wenn ein Bot auf einem Remote-VPS läuft, richten Sie Ihre CLI über SSH/Tailscale
    auf diesen Remote-Gateway aus (siehe [Remote-Zugriff](/de/gateway/remote)).

    Beispielmuster (ausführen von einem Rechner, der den Ziel-Gateway erreichen kann):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Tipp: Fügen Sie eine Schutzregel hinzu, damit die zwei Bots nicht endlos in einer Schleife hängen (nur bei Erwähnung, Channel-
    Allowlists oder eine Regel „nicht auf Bot-Nachrichten antworten“).

    Dokumentation: [Remote-Zugriff](/de/gateway/remote), [Agent-CLI](/de/cli/agent), [Agent senden](/de/tools/agent-send).

  </Accordion>

  <Accordion title="Benötige ich separate VPSes für mehrere Agenten?">
    Nein. Ein Gateway kann mehrere Agenten hosten, jeweils mit eigenem Arbeitsbereich, eigenen Modellvorgaben
    und eigenem Routing. Das ist die normale Einrichtung und deutlich günstiger und einfacher, als
    einen VPS pro Agent auszuführen.

    Verwenden Sie separate VPSes nur, wenn Sie harte Isolation (Sicherheitsgrenzen) oder sehr
    unterschiedliche Konfigurationen benötigen, die Sie nicht gemeinsam verwenden möchten. Andernfalls behalten Sie einen Gateway bei und
    verwenden mehrere Agenten oder Sub-Agenten.

  </Accordion>

  <Accordion title="Gibt es einen Vorteil, einen Node auf meinem persönlichen Laptop statt SSH von einem VPS zu verwenden?">
    Ja - Nodes sind der primäre Weg, um Ihren Laptop von einem Remote-Gateway aus zu erreichen, und sie
    ermöglichen mehr als Shell-Zugriff. Der Gateway läuft auf macOS/Linux (Windows über WSL2) und ist
    leichtgewichtig (ein kleiner VPS oder ein Rechner der Raspberry-Pi-Klasse reicht; 4 GB RAM sind ausreichend), daher ist eine übliche
    Einrichtung ein Always-on-Host plus Ihr Laptop als Node.

    - **Kein eingehendes SSH erforderlich.** Nodes verbinden sich ausgehend mit dem Gateway WebSocket und verwenden Gerätekopplung.
    - **Sicherere Ausführungskontrollen.** `system.run` wird durch Node-Allowlists/Genehmigungen auf diesem Laptop gesteuert.
    - **Mehr Gerätetools.** Nodes stellen zusätzlich zu `system.run` auch `canvas`, `camera` und `screen` bereit.
    - **Lokale Browserautomatisierung.** Lassen Sie den Gateway auf einem VPS, führen Sie Chrome aber lokal über einen Node-Host auf dem Laptop aus oder hängen Sie sich über Chrome MCP an lokales Chrome auf dem Host an.

    SSH eignet sich für Ad-hoc-Shell-Zugriff, aber Nodes sind einfacher für fortlaufende Agent-Workflows und
    Geräteautomatisierung.

    Dokumentation: [Nodes](/de/nodes), [Nodes-CLI](/de/cli/nodes), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Führen Nodes einen Gateway-Dienst aus?">
    Nein. Pro Host sollte nur **ein Gateway** laufen, außer Sie führen absichtlich isolierte Profile aus (siehe [Mehrere Gateways](/de/gateway/multiple-gateways)). Nodes sind Peripheriegeräte, die sich
    mit dem Gateway verbinden (iOS-/Android-Nodes oder macOS-„Node-Modus“ in der Menüleisten-App). Informationen zu headless Node-
    Hosts und CLI-Steuerung finden Sie unter [Node-Host-CLI](/de/cli/node).

    Für Änderungen an `gateway`, `discovery` und gehosteten Plugin-Oberflächen ist ein vollständiger Neustart erforderlich.

  </Accordion>

  <Accordion title="Gibt es eine API-/RPC-Möglichkeit, Konfiguration anzuwenden?">
    Ja.

    - `config.schema.lookup`: prüft einen Config-Unterbaum mit seinem flachen Schemaknoten, passendem UI-Hinweis und direkten Kind-Zusammenfassungen vor dem Schreiben
    - `config.get`: ruft den aktuellen Snapshot + Hash ab
    - `config.patch`: sichere partielle Aktualisierung (für die meisten RPC-Bearbeitungen bevorzugt); lädt nach Möglichkeit live neu und startet neu, wenn erforderlich
    - `config.apply`: validiert + ersetzt die vollständige Config; lädt nach Möglichkeit live neu und startet neu, wenn erforderlich
    - Das nur für Owner bestimmte Runtime-Tool `gateway` verweigert weiterhin das Umschreiben von `tools.exec.ask` / `tools.exec.security`; Legacy-Aliasse `tools.bash.*` werden auf dieselben geschützten Exec-Pfade normalisiert

  </Accordion>

  <Accordion title="Minimale sinnvolle Config für eine Erstinstallation">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Dies legt Ihren Workspace fest und beschränkt, wer den Bot auslösen kann.

  </Accordion>

  <Accordion title="Wie richte ich Tailscale auf einem VPS ein und verbinde mich von meinem Mac?">
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

    Wenn Sie die Steuerungs-UI ohne SSH verwenden möchten, nutzen Sie Tailscale Serve auf dem VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Dadurch bleibt der Gateway an Loopback gebunden und HTTPS wird über Tailscale bereitgestellt. Siehe [Tailscale](/de/gateway/tailscale).

  </Accordion>

  <Accordion title="Wie verbinde ich eine Mac-Node mit einem entfernten Gateway (Tailscale Serve)?">
    Serve stellt die **Gateway-Steuerungs-UI + WS** bereit. Nodes verbinden sich über denselben Gateway-WS-Endpunkt.

    Empfohlene Einrichtung:

    1. **Stellen Sie sicher, dass VPS + Mac im selben Tailnet sind**.
    2. **Verwenden Sie die macOS-App im Remote-Modus** (SSH-Ziel kann der Tailnet-Hostname sein).
       Die App tunnelt den Gateway-Port und verbindet sich als Node.
    3. **Genehmigen Sie die Node** auf dem Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Docs: [Gateway-Protokoll](/de/gateway/protocol), [Discovery](/de/gateway/discovery), [macOS-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Sollte ich auf einem zweiten Laptop installieren oder einfach eine Node hinzufügen?">
    Wenn Sie auf dem zweiten Laptop nur **lokale Tools** (Bildschirm/Kamera/Exec) benötigen, fügen Sie ihn als
    **Node** hinzu. So bleibt es bei einem einzigen Gateway und doppelte Config wird vermieden. Lokale Node-Tools sind
    derzeit nur für macOS verfügbar, aber wir planen, sie auf andere Betriebssysteme auszuweiten.

    Installieren Sie nur dann einen zweiten Gateway, wenn Sie **harte Isolation** oder zwei vollständig getrennte Bots benötigen.

    Docs: [Nodes](/de/nodes), [Nodes-CLI](/de/cli/nodes), [Mehrere Gateways](/de/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Umgebungsvariablen und .env-Laden

<AccordionGroup>
  <Accordion title="Wie lädt OpenClaw Umgebungsvariablen?">
    OpenClaw liest Umgebungsvariablen aus dem Elternprozess (Shell, launchd/systemd, CI usw.) und lädt zusätzlich:

    - `.env` aus dem aktuellen Arbeitsverzeichnis
    - eine globale Fallback-`.env` aus `~/.openclaw/.env` (auch `$OPENCLAW_STATE_DIR/.env`)

    Keine der `.env`-Dateien überschreibt bestehende Umgebungsvariablen.

    Sie können auch Inline-Umgebungsvariablen in der Config definieren (werden nur angewendet, wenn sie in der Prozessumgebung fehlen):

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

  <Accordion title="Ich habe den Gateway über den Dienst gestartet und meine Umgebungsvariablen sind verschwunden. Was nun?">
    Zwei häufige Lösungen:

    1. Legen Sie die fehlenden Schlüssel in `~/.openclaw/.env` ab, damit sie auch dann aufgenommen werden, wenn der Dienst Ihre Shell-Umgebung nicht erbt.
    2. Aktivieren Sie den Shell-Import (optionaler Komfort):

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

    Dadurch wird Ihre Login-Shell ausgeführt und es werden nur fehlende erwartete Schlüssel importiert (niemals überschrieben). Entsprechende Umgebungsvariablen:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ich habe COPILOT_GITHUB_TOKEN gesetzt, aber der Modellstatus zeigt "Shell env: off." Warum?'>
    `openclaw models status` meldet, ob der **Shell-Umgebungsimport** aktiviert ist. "Shell env: off"
    bedeutet **nicht**, dass Ihre Umgebungsvariablen fehlen - es bedeutet nur, dass OpenClaw
    Ihre Login-Shell nicht automatisch lädt.

    Wenn der Gateway als Dienst (launchd/systemd) ausgeführt wird, erbt er Ihre Shell-
    Umgebung nicht. Beheben Sie dies mit einer der folgenden Optionen:

    1. Legen Sie das Token in `~/.openclaw/.env` ab:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Oder aktivieren Sie den Shell-Import (`env.shellEnv.enabled: true`).
    3. Oder fügen Sie es dem `env`-Block Ihrer Config hinzu (wird nur angewendet, wenn es fehlt).

    Starten Sie dann den Gateway neu und prüfen Sie erneut:

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
    Sessions können nach `session.idleMinutes` ablaufen, dies ist jedoch **standardmäßig deaktiviert** (Standard **0**).
    Setzen Sie den Wert auf eine positive Zahl, um den Ablauf bei Inaktivität zu aktivieren. Wenn aktiviert, startet die **nächste**
    Nachricht nach der Inaktivitätsphase eine neue Session-ID für diesen Chat-Schlüssel.
    Dadurch werden keine Transkripte gelöscht - es wird nur eine neue Session gestartet.

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
    weniger effizient als ein Bot mit getrennten Sessions. Das typische Modell, das wir
    uns vorstellen, ist ein Bot, mit dem Sie sprechen, mit verschiedenen Sessions für parallele Arbeit. Dieser
    Bot kann bei Bedarf auch Sub-Agents starten.

    Docs: [Multi-Agent-Routing](/de/concepts/multi-agent), [Sub-Agents](/de/tools/subagents), [Agents-CLI](/de/cli/agents).

  </Accordion>

  <Accordion title="Warum wurde der Kontext mitten in einer Aufgabe abgeschnitten? Wie verhindere ich das?">
    Der Session-Kontext ist durch das Modellfenster begrenzt. Lange Chats, große Tool-Ausgaben oder viele
    Dateien können Compaction oder Kürzung auslösen.

    Was hilft:

    - Bitten Sie den Bot, den aktuellen Zustand zusammenzufassen und in eine Datei zu schreiben.
    - Verwenden Sie `/compact` vor langen Aufgaben und `/new`, wenn Sie das Thema wechseln.
    - Halten Sie wichtigen Kontext im Workspace und bitten Sie den Bot, ihn erneut zu lesen.
    - Verwenden Sie Sub-Agents für lange oder parallele Arbeit, damit der Hauptchat kleiner bleibt.
    - Wählen Sie ein Modell mit größerem Kontextfenster, wenn dies häufig passiert.

  </Accordion>

  <Accordion title="Wie setze ich OpenClaw vollständig zurück, lasse es aber installiert?">
    Verwenden Sie den Reset-Befehl:

    ```bash
    openclaw reset
    ```

    Nichtinteraktiver vollständiger Reset:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Führen Sie anschließend die Einrichtung erneut aus:

    ```bash
    openclaw onboard --install-daemon
    ```

    Hinweise:

    - Onboarding bietet auch **Reset** an, wenn eine bestehende Config erkannt wird. Siehe [Onboarding (CLI)](/de/start/wizard).
    - Wenn Sie Profile (`--profile` / `OPENCLAW_PROFILE`) verwendet haben, setzen Sie jedes State-Verzeichnis zurück (Standardwerte sind `~/.openclaw-<profile>`).
    - Dev-Reset: `openclaw gateway --dev --reset` (nur Dev; löscht Dev-Config + Zugangsdaten + Sessions + Workspace).

  </Accordion>

  <Accordion title='Ich erhalte Fehler vom Typ "context too large" - wie setze ich zurück oder führe Compaction aus?'>
    Verwenden Sie eine dieser Optionen:

    - **Compaction** (behält die Unterhaltung bei, fasst aber ältere Turns zusammen):

      ```
      /compact
      ```

      oder `/compact <instructions>`, um die Zusammenfassung zu steuern.

    - **Reset** (frische Session-ID für denselben Chat-Schlüssel):

      ```
      /new
      /reset
      ```

    Wenn es weiter passiert:

    - Aktivieren oder optimieren Sie **Session-Pruning** (`agents.defaults.contextPruning`), um alte Tool-Ausgaben zu kürzen.
    - Verwenden Sie ein Modell mit größerem Kontextfenster.

    Docs: [Compaction](/de/concepts/compaction), [Session-Pruning](/de/concepts/session-pruning), [Session-Verwaltung](/de/concepts/session).

  </Accordion>

  <Accordion title='Warum sehe ich "LLM request rejected: messages.content.tool_use.input field required"?'>
    Dies ist ein Provider-Validierungsfehler: Das Modell hat einen `tool_use`-Block ohne das erforderliche
    `input` ausgegeben. Das bedeutet in der Regel, dass der Session-Verlauf veraltet oder beschädigt ist (oft nach langen Threads
    oder einer Tool-/Schemaänderung).

    Lösung: Starten Sie mit `/new` eine neue Session (eigenständige Nachricht).

  </Accordion>

  <Accordion title="Warum erhalte ich alle 30 Minuten Heartbeat-Nachrichten?">
    Heartbeats laufen standardmäßig alle **30m** (**1h** bei OAuth-Auth). Passen Sie sie an oder deaktivieren Sie sie:

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

    Overrides pro Agent verwenden `agents.list[].heartbeat`. Docs: [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title='Muss ich ein "Bot-Konto" zu einer WhatsApp-Gruppe hinzufügen?'>
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
    Option 1 (am schnellsten): Logs verfolgen und eine Testnachricht in die Gruppe senden:

    ```bash
    openclaw logs --follow --json
    ```

    Suchen Sie nach `chatId` (oder `from`), das auf `@g.us` endet, zum Beispiel:
    `1234567890-1234567890@g.us`.

    Option 2 (falls bereits konfiguriert/allowlisted): Gruppen aus der Config auflisten:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Docs: [WhatsApp](/de/channels/whatsapp), [Directory](/de/cli/directory), [Logs](/de/cli/logs).

  </Accordion>

  <Accordion title="Warum antwortet OpenClaw nicht in einer Gruppe?">
    Zwei häufige Ursachen:

    - Mention-Gating ist aktiviert (Standard). Sie müssen den Bot @mentionen (oder `mentionPatterns` entsprechen).
    - Sie haben `channels.whatsapp.groups` ohne `"*"` konfiguriert und die Gruppe ist nicht allowlisted.

    Siehe [Gruppen](/de/channels/groups) und [Gruppennachrichten](/de/channels/group-messages).

  </Accordion>

  <Accordion title="Teilen Gruppen/Threads Kontext mit DMs?">
    Direkte Chats werden standardmäßig auf die Haupt-Session zusammengeführt. Gruppen/Kanäle haben eigene Session-Schlüssel, und Telegram-Themen / Discord-Threads sind getrennte Sessions. Siehe [Gruppen](/de/channels/groups) und [Gruppennachrichten](/de/channels/group-messages).
  </Accordion>

  <Accordion title="Wie viele Workspaces und Agenten kann ich erstellen?">
    Keine festen Limits. Dutzende (sogar Hunderte) sind in Ordnung, aber achten Sie auf:

    - **Festplattenwachstum:** Sitzungen und Transkripte liegen unter `~/.openclaw/agents/<agentId>/sessions/`.
    - **Token-Kosten:** Mehr Agenten bedeuten mehr gleichzeitige Modellnutzung.
    - **Betriebsaufwand:** Authentifizierungsprofile, Workspaces und Channel-Routing pro Agent.

    Tipps:

    - Behalten Sie einen **aktiven** Workspace pro Agent bei (`agents.defaults.workspace`).
    - Bereinigen Sie alte Sitzungen (JSONL- oder Store-Einträge löschen), wenn die Festplattennutzung wächst.
    - Verwenden Sie `openclaw doctor`, um verwaiste Workspaces und Profilabweichungen zu finden.

  </Accordion>

  <Accordion title="Kann ich mehrere Bots oder Chats gleichzeitig ausführen (Slack), und wie sollte ich das einrichten?">
    Ja. Verwenden Sie **Multi-Agent-Routing**, um mehrere isolierte Agenten auszuführen und eingehende Nachrichten nach
    Channel/Konto/Peer weiterzuleiten. Slack wird als Channel unterstützt und kann bestimmten Agenten zugeordnet werden.

    Browserzugriff ist leistungsfähig, aber nicht „alles tun, was ein Mensch kann“ - Anti-Bot-Systeme, CAPTCHAs und MFA können
    Automatisierung weiterhin blockieren. Für die zuverlässigste Browsersteuerung verwenden Sie lokales Chrome MCP auf dem Host
    oder CDP auf dem Rechner, der den Browser tatsächlich ausführt.

    Empfohlene Einrichtung:

    - Gateway-Host im Dauerbetrieb (VPS/Mac mini).
    - Ein Agent pro Rolle (Bindings).
    - Slack-Channel(s), die diesen Agenten zugeordnet sind.
    - Lokaler Browser über Chrome MCP oder bei Bedarf ein Node.

    Docs: [Multi-Agent-Routing](/de/concepts/multi-agent), [Slack](/de/channels/slack),
    [Browser](/de/tools/browser), [Nodes](/de/nodes).

  </Accordion>
</AccordionGroup>

## Modelle, Failover und Authentifizierungsprofile

Modell-Fragen und Antworten - Standards, Auswahl, Aliase, Wechsel, Failover, Authentifizierungsprofile -
finden Sie in den [Modelle-FAQ](/de/help/faq-models).

## Gateway: Ports, „already running“ und Remote-Modus

<AccordionGroup>
  <Accordion title="Welchen Port verwendet das Gateway?">
    `gateway.port` steuert den einzelnen multiplexierten Port für WebSocket + HTTP (Control UI, Hooks usw.).

    Rangfolge:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Warum meldet openclaw gateway status "Runtime: running", aber "Connectivity probe: failed"?'>
    Weil "running" die Sicht des **Supervisors** ist (launchd/systemd/schtasks). Der Konnektivitäts-Probe ist die CLI, die tatsächlich eine Verbindung zum Gateway-WebSocket herstellt.

    Verwenden Sie `openclaw gateway status` und vertrauen Sie diesen Zeilen:

    - `Probe target:` (die URL, die der Probe tatsächlich verwendet hat)
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
    OpenClaw erzwingt eine Runtime-Sperre, indem der WebSocket-Listener direkt beim Start gebunden wird (Standard `ws://127.0.0.1:18789`). Wenn das Binden mit `EADDRINUSE` fehlschlägt, wird `GatewayLockError` ausgelöst und angezeigt, dass bereits eine andere Instanz lauscht.

    Behebung: Stoppen Sie die andere Instanz, geben Sie den Port frei oder führen Sie `openclaw gateway --port <port>` aus.

  </Accordion>

  <Accordion title="Wie führe ich OpenClaw im Remote-Modus aus (Client verbindet sich mit einem Gateway an anderer Stelle)?">
    Setzen Sie `gateway.mode: "remote"` und verweisen Sie auf eine Remote-WebSocket-URL, optional mit Remote-Anmeldedaten per gemeinsamem Geheimnis:

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
    - `gateway.remote.token` / `.password` sind nur clientseitige Remote-Anmeldedaten; sie aktivieren für sich genommen keine lokale Gateway-Authentifizierung.

  </Accordion>

  <Accordion title='Die Control UI meldet "unauthorized" (oder verbindet sich immer wieder neu). Was jetzt?'>
    Ihr Gateway-Authentifizierungspfad und die Authentifizierungsmethode der UI stimmen nicht überein.

    Fakten (aus dem Code):

    - Die Control UI speichert das Token in `sessionStorage` für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL. Dadurch funktionieren Aktualisierungen im selben Tab weiter, ohne die langlebige Token-Persistenz in localStorage wiederherzustellen.
    - Bei `AUTH_TOKEN_MISMATCH` können vertrauenswürdige Clients einen begrenzten erneuten Versuch mit einem zwischengespeicherten Gerätetoken starten, wenn das Gateway Retry-Hinweise zurückgibt (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Dieser Retry mit zwischengespeichertem Token verwendet jetzt die zwischengespeicherten genehmigten Scopes wieder, die mit dem Gerätetoken gespeichert sind. Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten weiterhin ihre angeforderte Scope-Menge, statt zwischengespeicherte Scopes zu erben.
    - Außerhalb dieses Retry-Pfads gilt für die Verbindungsauthentifizierung folgende Rangfolge: zuerst explizites gemeinsames Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Gerätetoken, dann Bootstrap-Token.
    - Bootstrap-Token-Scope-Prüfungen sind rollenpräfixiert. Die integrierte Bootstrap-Operator-Allowlist erfüllt nur Operator-Anfragen; Node- oder andere Nicht-Operator-Rollen benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.

    Behebung:

    - Am schnellsten: `openclaw dashboard` (gibt die Dashboard-URL aus und kopiert sie, versucht sie zu öffnen; zeigt bei Headless-Systemen einen SSH-Hinweis).
    - Wenn Sie noch kein Token haben: `openclaw doctor --generate-gateway-token`.
    - Bei Remote-Nutzung zuerst tunneln: `ssh -N -L 18789:127.0.0.1:18789 user@host`, dann `http://127.0.0.1:18789/` öffnen.
    - Modus mit gemeinsamem Geheimnis: Setzen Sie `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` oder `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, und fügen Sie dann das passende Geheimnis in den Einstellungen der Control UI ein.
    - Tailscale-Serve-Modus: Stellen Sie sicher, dass `gateway.auth.allowTailscale` aktiviert ist und Sie die Serve-URL öffnen, nicht eine rohe local loopback-/Tailnet-URL, die Tailscale-Identitätsheader umgeht.
    - Trusted-Proxy-Modus: Stellen Sie sicher, dass Sie über den konfigurierten identitätsbewussten Proxy kommen, nicht über eine rohe Gateway-URL. local loopback-Proxys auf demselben Host benötigen außerdem `gateway.auth.trustedProxy.allowLoopback = true`.
    - Wenn die Abweichung nach dem einen Retry bestehen bleibt, rotieren bzw. genehmigen Sie das gekoppelte Gerätetoken erneut:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Wenn dieser Rotate-Aufruf meldet, dass er abgelehnt wurde, prüfen Sie zwei Dinge:
      - Sitzungen gekoppelter Geräte können nur ihr **eigenes** Gerät rotieren, sofern sie nicht zusätzlich `operator.admin` haben
      - explizite `--scope`-Werte dürfen die aktuellen Operator-Scopes des Aufrufers nicht überschreiten
    - Immer noch blockiert? Führen Sie `openclaw status --all` aus und folgen Sie der [Fehlerbehebung](/de/gateway/troubleshooting). Siehe [Dashboard](/de/web/dashboard) für Authentifizierungsdetails.

  </Accordion>

  <Accordion title="Ich habe gateway.bind auf tailnet gesetzt, aber es kann nicht binden und nichts lauscht">
    `tailnet`-Bind wählt eine Tailscale-IP aus Ihren Netzwerkschnittstellen (100.64.0.0/10). Wenn der Rechner nicht in Tailscale ist (oder die Schnittstelle nicht aktiv ist), gibt es nichts, woran gebunden werden kann.

    Behebung:

    - Starten Sie Tailscale auf diesem Host (damit er eine 100.x-Adresse hat), oder
    - Wechseln Sie zu `gateway.bind: "loopback"` / `"lan"`.

    Hinweis: `tailnet` ist explizit. `auto` bevorzugt loopback; verwenden Sie `gateway.bind: "tailnet"`, wenn Sie eine Bindung ausschließlich ans Tailnet wünschen.

  </Accordion>

  <Accordion title="Kann ich mehrere Gateways auf demselben Host ausführen?">
    Normalerweise nein - ein Gateway kann mehrere Messaging-Channels und Agenten ausführen. Verwenden Sie mehrere Gateways nur, wenn Sie Redundanz (z. B. Rescue-Bot) oder strikte Isolation benötigen.

    Ja, aber Sie müssen isolieren:

    - `OPENCLAW_CONFIG_PATH` (Konfiguration pro Instanz)
    - `OPENCLAW_STATE_DIR` (State pro Instanz)
    - `agents.defaults.workspace` (Workspace-Isolation)
    - `gateway.port` (eindeutige Ports)

    Schnelle Einrichtung (empfohlen):

    - Verwenden Sie pro Instanz `openclaw --profile <name> ...` (erstellt automatisch `~/.openclaw-<name>`).
    - Legen Sie in jeder Profilkonfiguration einen eindeutigen `gateway.port` fest (oder übergeben Sie `--port` für manuelle Läufe).
    - Installieren Sie einen Dienst pro Profil: `openclaw --profile <name> gateway install`.

    Profile hängen außerdem Suffixe an Dienstnamen an (`ai.openclaw.<profile>`; Legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Vollständige Anleitung: [Mehrere Gateways](/de/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Was bedeutet "invalid handshake" / Code 1008?'>
    Das Gateway ist ein **WebSocket-Server** und erwartet als allererste Nachricht
    einen `connect`-Frame. Wenn es etwas anderes empfängt, schließt es die Verbindung
    mit **Code 1008** (Richtlinienverletzung).

    Häufige Ursachen:

    - Sie haben die **HTTP**-URL in einem Browser geöffnet (`http://...`) statt in einem WS-Client.
    - Sie haben den falschen Port oder Pfad verwendet.
    - Ein Proxy oder Tunnel hat Authentifizierungsheader entfernt oder eine Nicht-Gateway-Anfrage gesendet.

    Schnelle Behebungen:

    1. Verwenden Sie die WS-URL: `ws://<host>:18789` (oder `wss://...` bei HTTPS).
    2. Öffnen Sie den WS-Port nicht in einem normalen Browser-Tab.
    3. Wenn Authentifizierung aktiv ist, fügen Sie das Token/Passwort in den `connect`-Frame ein.

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

    Sie können über `logging.file` einen stabilen Pfad festlegen. Das Datei-Log-Level wird durch `logging.level` gesteuert. Die Konsolenausführlichkeit wird durch `--verbose` und `logging.consoleLevel` gesteuert.

    Schnellster Log-Tail:

    ```bash
    openclaw logs --follow
    ```

    Dienst-/Supervisor-Logs (wenn das Gateway über launchd/systemd ausgeführt wird):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` und `gateway.err.log` (Standard: `~/.openclaw/logs/...`; Profile verwenden `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Siehe [Fehlerbehebung](/de/gateway/troubleshooting) für mehr.

  </Accordion>

  <Accordion title="Wie starte/stoppe/starte ich den Gateway-Dienst neu?">
    Verwenden Sie die Gateway-Helfer:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Wenn Sie das Gateway manuell ausführen, kann `openclaw gateway --force` den Port zurückfordern. Siehe [Gateway](/de/gateway).

  </Accordion>

  <Accordion title="Ich habe mein Terminal unter Windows geschlossen - wie starte ich OpenClaw neu?">
    Es gibt **zwei Windows-Installationsmodi**:

    **1) WSL2 (empfohlen):** Das Gateway läuft innerhalb von Linux.

    Öffnen Sie PowerShell, starten Sie WSL und starten Sie dann neu:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Wenn Sie den Dienst nie installiert haben, starten Sie ihn im Vordergrund:

    ```bash
    openclaw gateway run
    ```

    **2) Natives Windows (nicht empfohlen):** Das Gateway läuft direkt unter Windows.

    Öffnen Sie PowerShell und führen Sie aus:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Wenn Sie es manuell ausführen (kein Dienst), verwenden Sie:

    ```powershell
    openclaw gateway run
    ```

    Docs: [Windows (WSL2)](/de/platforms/windows), [Gateway-Dienst-Runbook](/de/gateway).

  </Accordion>

  <Accordion title="Das Gateway ist aktiv, aber Antworten kommen nie an. Was sollte ich prüfen?">
    Beginnen Sie mit einem schnellen Health-Check:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Häufige Ursachen:

    - Modellauthentifizierung nicht auf dem **Gateway-Host** geladen (`models status` prüfen).
    - Channel-Kopplung/Allowlist blockiert Antworten (Channel-Konfiguration + Logs prüfen).
    - WebChat/Dashboard ist ohne das richtige Token geöffnet.

    Wenn Sie remote sind, bestätigen Sie, dass die Tunnel-/Tailscale-Verbindung aktiv und der
    Gateway-WebSocket erreichbar ist.

    Docs: [Channels](/de/channels), [Fehlerbehebung](/de/gateway/troubleshooting), [Remotezugriff](/de/gateway/remote).

  </Accordion>

  <Accordion title='"Verbindung zum Gateway getrennt: kein Grund" - was jetzt?'>
    Das bedeutet normalerweise, dass die UI die WebSocket-Verbindung verloren hat. Prüfen Sie:

    1. Läuft das Gateway? `openclaw gateway status`
    2. Ist das Gateway fehlerfrei? `openclaw status`
    3. Hat die UI das richtige Token? `openclaw dashboard`
    4. Wenn remote, ist die Tunnel-/Tailscale-Verbindung aktiv?

    Lesen Sie dann die Logs mit:

    ```bash
    openclaw logs --follow
    ```

    Docs: [Dashboard](/de/web/dashboard), [Remotezugriff](/de/gateway/remote), [Fehlerbehebung](/de/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands schlägt fehl. Was sollte ich prüfen?">
    Beginnen Sie mit Logs und Channel-Status:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Ordnen Sie dann den Fehler zu:

    - `BOT_COMMANDS_TOO_MUCH`: Das Telegram-Menü hat zu viele Einträge. OpenClaw kürzt bereits auf das Telegram-Limit und versucht es mit weniger Befehlen erneut, aber einige Menüeinträge müssen trotzdem entfernt werden. Reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie `channels.telegram.commands.native`, wenn Sie das Menü nicht benötigen.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` oder ähnliche Netzwerkfehler: Wenn Sie auf einem VPS oder hinter einem Proxy sind, bestätigen Sie, dass ausgehendes HTTPS erlaubt ist und DNS für `api.telegram.org` funktioniert.

    Wenn das Gateway remote ist, stellen Sie sicher, dass Sie die Logs auf dem Gateway-Host ansehen.

    Docs: [Telegram](/de/channels/telegram), [Channel-Fehlerbehebung](/de/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI zeigt keine Ausgabe. Was sollte ich prüfen?">
    Bestätigen Sie zuerst, dass das Gateway erreichbar ist und der Agent ausgeführt werden kann:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Verwenden Sie in der TUI `/status`, um den aktuellen Zustand zu sehen. Wenn Sie Antworten in einem Chat-
    Channel erwarten, stellen Sie sicher, dass die Zustellung aktiviert ist (`/deliver on`).

    Docs: [TUI](/de/web/tui), [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Wie stoppe ich das Gateway vollständig und starte es dann wieder?">
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

  <Accordion title="Einfach erklärt: openclaw gateway restart vs. openclaw gateway">
    - `openclaw gateway restart`: startet den **Hintergrunddienst** (launchd/systemd) neu.
    - `openclaw gateway`: führt das Gateway **im Vordergrund** für diese Terminalsitzung aus.

    Wenn Sie den Dienst installiert haben, verwenden Sie die Gateway-Befehle. Verwenden Sie `openclaw gateway`, wenn
    Sie einen einmaligen Vordergrundlauf möchten.

  </Accordion>

  <Accordion title="Schnellster Weg zu mehr Details, wenn etwas fehlschlägt">
    Starten Sie das Gateway mit `--verbose`, um mehr Konsolendetails zu erhalten. Prüfen Sie dann die Logdatei auf Channel-Authentifizierung, Modell-Routing und RPC-Fehler.
  </Accordion>
</AccordionGroup>

## Medien und Anhänge

<AccordionGroup>
  <Accordion title="Mein Skill hat ein Bild/PDF erzeugt, aber nichts wurde gesendet">
    Ausgehende Anhänge vom Agent müssen eine `MEDIA:<path-or-url>`-Zeile enthalten (in einer eigenen Zeile). Siehe [OpenClaw-Assistent einrichten](/de/start/openclaw) und [Agent senden](/de/tools/agent-send).

    CLI-Senden:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Prüfen Sie außerdem:

    - Der Ziel-Channel unterstützt ausgehende Medien und wird nicht durch Allowlists blockiert.
    - Die Datei liegt innerhalb der Größenlimits des Providers (Bilder werden auf max. 2048 px verkleinert).
    - `tools.fs.workspaceOnly=true` beschränkt Sends mit lokalen Pfaden auf Workspace, temporären/Media-Store und sandboxvalidierte Dateien.
    - `tools.fs.workspaceOnly=false` erlaubt `MEDIA:`, hostlokale Dateien zu senden, die der Agent bereits lesen kann, aber nur für Medien plus sichere Dokumenttypen (Bilder, Audio, Video, PDF und Office-Dokumente). Reiner Text und geheimnisähnliche Dateien werden weiterhin blockiert.

    Siehe [Bilder](/de/nodes/images).

  </Accordion>
</AccordionGroup>

## Sicherheit und Zugriffskontrolle

<AccordionGroup>
  <Accordion title="Ist es sicher, OpenClaw für eingehende DMs freizugeben?">
    Behandeln Sie eingehende DMs als nicht vertrauenswürdige Eingabe. Die Standardwerte sind darauf ausgelegt, Risiken zu reduzieren:

    - Das Standardverhalten auf DM-fähigen Channels ist **Kopplung**:
      - Unbekannte Absender erhalten einen Kopplungscode; der Bot verarbeitet ihre Nachricht nicht.
      - Genehmigen mit: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Ausstehende Anfragen sind auf **3 pro Channel** begrenzt; prüfen Sie `openclaw pairing list --channel <channel> [--account <id>]`, wenn ein Code nicht angekommen ist.
    - Das öffentliche Öffnen von DMs erfordert explizites Opt-in (`dmPolicy: "open"` und Allowlist `"*"`).

    Führen Sie `openclaw doctor` aus, um riskante DM-Richtlinien sichtbar zu machen.

  </Accordion>

  <Accordion title="Ist Prompt Injection nur für öffentliche Bots ein Problem?">
    Nein. Bei Prompt Injection geht es um **nicht vertrauenswürdige Inhalte**, nicht nur darum, wer dem Bot eine DM senden kann.
    Wenn Ihr Assistent externe Inhalte liest (Websuche/-Abruf, Browserseiten, E-Mails,
    Dokumente, Anhänge, eingefügte Logs), können diese Inhalte Anweisungen enthalten, die versuchen,
    das Modell zu kapern. Das kann sogar passieren, wenn **Sie der einzige Absender sind**.

    Das größte Risiko entsteht, wenn Tools aktiviert sind: Das Modell kann dazu gebracht werden,
    Kontext zu exfiltrieren oder Tools in Ihrem Namen aufzurufen. Reduzieren Sie den Wirkungsbereich durch:

    - Verwenden eines schreibgeschützten oder tooldeaktivierten "Reader"-Agent, um nicht vertrauenswürdige Inhalte zusammenzufassen
    - Deaktivieren von `web_search` / `web_fetch` / `browser` für toolaktivierte Agenten
    - Behandeln von dekodiertem Datei-/Dokumenttext ebenfalls als nicht vertrauenswürdig: OpenResponses
      `input_file` und die Extraktion von Medienanhängen umschließen extrahierten Text beide mit
      expliziten Begrenzungsmarkern für externe Inhalte, statt rohen Dateitext zu übergeben
    - Sandboxing und strikte Tool-Allowlists

    Details: [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Sollte mein Bot ein eigenes E-Mail-, GitHub-Konto oder eine eigene Telefonnummer haben?">
    Ja, für die meisten Setups. Die Isolation des Bots mit separaten Konten und Telefonnummern
    reduziert den Wirkungsbereich, wenn etwas schiefgeht. Dadurch wird es auch einfacher, Zugangsdaten zu rotieren
    oder Zugriff zu widerrufen, ohne Ihre persönlichen Konten zu beeinträchtigen.

    Fangen Sie klein an. Gewähren Sie nur Zugriff auf die Tools und Konten, die Sie tatsächlich benötigen, und erweitern
    Sie später bei Bedarf.

    Docs: [Sicherheit](/de/gateway/security), [Kopplung](/de/channels/pairing).

  </Accordion>

  <Accordion title="Kann ich ihm Autonomie über meine Textnachrichten geben, und ist das sicher?">
    Wir empfehlen **keine** vollständige Autonomie über Ihre persönlichen Nachrichten. Das sicherste Muster ist:

    - Lassen Sie DMs im **Kopplungsmodus** oder verwenden Sie eine enge Allowlist.
    - Verwenden Sie eine **separate Nummer oder ein separates Konto**, wenn er in Ihrem Namen Nachrichten senden soll.
    - Lassen Sie ihn entwerfen und **genehmigen Sie vor dem Senden**.

    Wenn Sie experimentieren möchten, tun Sie dies auf einem dedizierten Konto und halten Sie es isoliert. Siehe
    [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Kann ich günstigere Modelle für Aufgaben persönlicher Assistenten verwenden?">
    Ja, **wenn** der Agent nur chattet und die Eingabe vertrauenswürdig ist. Kleinere Stufen sind
    anfälliger für Anweisungskapern, vermeiden Sie sie daher für toolaktivierte Agenten
    oder beim Lesen nicht vertrauenswürdiger Inhalte. Wenn Sie ein kleineres Modell verwenden müssen, sperren Sie
    Tools ein und führen Sie es in einer Sandbox aus. Siehe [Sicherheit](/de/gateway/security).
  </Accordion>

  <Accordion title="Ich habe /start in Telegram ausgeführt, aber keinen Kopplungscode erhalten">
    Kopplungscodes werden **nur** gesendet, wenn ein unbekannter Absender dem Bot eine Nachricht sendet und
    `dmPolicy: "pairing"` aktiviert ist. `/start` allein erzeugt keinen Code.

    Ausstehende Anfragen prüfen:

    ```bash
    openclaw pairing list telegram
    ```

    Wenn Sie sofortigen Zugriff möchten, setzen Sie Ihre Absender-ID auf die Allowlist oder setzen Sie `dmPolicy: "open"`
    für dieses Konto.

  </Accordion>

  <Accordion title="WhatsApp: Wird es meinen Kontakten schreiben? Wie funktioniert Kopplung?">
    Nein. Die Standard-DM-Richtlinie von WhatsApp ist **Kopplung**. Unbekannte Absender erhalten nur einen Kopplungscode und ihre Nachricht wird **nicht verarbeitet**. OpenClaw antwortet nur auf Chats, die es empfängt, oder auf explizite Sends, die Sie auslösen.

    Kopplung genehmigen mit:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Ausstehende Anfragen auflisten:

    ```bash
    openclaw pairing list whatsapp
    ```

    Telefonnummern-Prompt des Wizards: Er wird verwendet, um Ihre **Allowlist/Ihren Owner** festzulegen, damit Ihre eigenen DMs erlaubt sind. Er wird nicht für automatisches Senden verwendet. Wenn Sie Ihre persönliche WhatsApp-Nummer verwenden, verwenden Sie diese Nummer und aktivieren Sie `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Chatbefehle, Aufgaben abbrechen und "es hört nicht auf"

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

    Wenn es weiterhin laut ist, prüfen Sie die Sitzungseinstellungen in der Control UI und setzen Sie verbose
    auf **inherit**. Bestätigen Sie außerdem, dass Sie kein Bot-Profil mit `verboseDefault` auf
    `on` in der Konfiguration verwenden.

    Docs: [Denken und verbose](/de/tools/thinking), [Sicherheit](/de/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Wie stoppe/breche ich eine laufende Aufgabe ab?">
    Senden Sie eine dieser Nachrichten **als eigenständige Nachricht** (kein Slash):

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

    Übersicht über Slash-Befehle: siehe [Slash-Befehle](/de/tools/slash-commands).

    Die meisten Befehle müssen als **eigenständige** Nachricht gesendet werden, die mit `/` beginnt, aber einige Kurzbefehle (wie `/status`) funktionieren für Absender auf der Allowlist auch inline.

  </Accordion>

  <Accordion title='Wie sende ich eine Discord-Nachricht von Telegram? ("Cross-context messaging denied")'>
    OpenClaw blockiert **Provider-übergreifendes** Messaging standardmäßig. Wenn ein Tool-Aufruf
    an Telegram gebunden ist, sendet er nicht an Discord, es sei denn, Sie erlauben es explizit.

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

    Starten Sie das Gateway nach dem Bearbeiten der Konfiguration neu.

  </Accordion>

  <Accordion title='Warum fühlt es sich an, als würde der Bot schnell aufeinanderfolgende Nachrichten "ignorieren"?'>
    Der Warteschlangenmodus steuert, wie neue Nachrichten mit einem laufenden Run interagieren. Verwenden Sie `/queue`, um Modi zu ändern:

    - `steer` - stellt alle ausstehenden Steuerungsnachrichten für die nächste Modellgrenze im aktuellen Run in die Warteschlange
    - `queue` - veraltete Steuerung einzeln nacheinander
    - `followup` - Nachrichten einzeln nacheinander ausführen
    - `collect` - Nachrichten bündeln und einmal antworten
    - `steer-backlog` - jetzt steuern, dann Backlog verarbeiten
    - `interrupt` - aktuellen Run abbrechen und frisch starten

    Der Standardmodus ist `steer`. Sie können Optionen wie `debounce:0.5s cap:25 drop:summarize` für Follow-up-Modi hinzufügen. Siehe [Befehlswarteschlange](/de/concepts/queue) und [Steuerungswarteschlange](/de/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Sonstiges

<AccordionGroup>
  <Accordion title='Was ist das Standardmodell für Anthropic mit einem API-Schlüssel?'>
    In OpenClaw sind Anmeldeinformationen und Modellauswahl getrennt. Das Setzen von `ANTHROPIC_API_KEY` (oder das Speichern eines Anthropic-API-Schlüssels in Auth-Profilen) aktiviert die Authentifizierung, aber das tatsächliche Standardmodell ist das, was Sie in `agents.defaults.model.primary` konfigurieren (zum Beispiel `anthropic/claude-sonnet-4-6` oder `anthropic/claude-opus-4-6`). Wenn Sie `No credentials found for profile "anthropic:default"` sehen, bedeutet das, dass der Gateway die Anthropic-Anmeldeinformationen in der erwarteten `auth-profiles.json` für den ausgeführten Agenten nicht finden konnte.
  </Accordion>
</AccordionGroup>

---

Kommen Sie immer noch nicht weiter? Fragen Sie auf [Discord](https://discord.com/invite/clawd) oder eröffnen Sie eine [GitHub-Diskussion](https://github.com/openclaw/openclaw/discussions).

## Verwandte Themen

- [FAQ zum ersten Start](/de/help/faq-first-run) — Installation, Onboarding, Authentifizierung, Abonnements, frühe Fehler
- [Modelle-FAQ](/de/help/faq-models) — Modellauswahl, Failover, Auth-Profile
- [Fehlerbehebung](/de/help/troubleshooting) — symptomorientierte Triage
